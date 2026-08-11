import { randomUUID } from 'node:crypto';
import {
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const LOCK_RETRY_MS = 10;
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 60_000;
const MIN_STALE_LOCK_MS = 30_000;
const MAX_LOCK_BYTES = 1_024;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validatedLockOptions({
  lockRetryMs = LOCK_RETRY_MS,
  lockTimeoutMs = LOCK_TIMEOUT_MS,
  staleLockMs = STALE_LOCK_MS,
} = {}) {
  if (!Number.isSafeInteger(lockRetryMs) || lockRetryMs < 1) {
    throw new TypeError('SEO state lock retry interval must be a positive integer');
  }
  if (!Number.isSafeInteger(lockTimeoutMs) || lockTimeoutMs < 0) {
    throw new TypeError('SEO state lock timeout must be a non-negative integer');
  }
  if (!Number.isSafeInteger(staleLockMs) || staleLockMs < MIN_STALE_LOCK_MS) {
    throw new TypeError(`SEO stale lock threshold must be at least ${MIN_STALE_LOCK_MS}ms`);
  }
  return { lockRetryMs, lockTimeoutMs, staleLockMs };
}

function malformedLock(lockPath) {
  return new Error(`Refusing malformed SEO state lock: ${lockPath}`);
}

function parseLockMetadata(contents, stats, lockPath) {
  const trimmed = contents.trim();
  if (/^\d+$/.test(trimmed)) {
    const pid = Number(trimmed);
    if (Number.isSafeInteger(pid) && pid > 0 && pid <= 2_147_483_647) {
      return { pid, createdAt: stats.mtimeMs };
    }
    throw malformedLock(lockPath);
  }

  let metadata;
  try {
    metadata = JSON.parse(contents);
  } catch {
    throw malformedLock(lockPath);
  }
  if (!metadata || Array.isArray(metadata) || metadata.version !== 1
    || !Number.isSafeInteger(metadata.pid) || metadata.pid < 1 || metadata.pid > 2_147_483_647
    || !Number.isSafeInteger(metadata.createdAt) || metadata.createdAt < 0) {
    throw malformedLock(lockPath);
  }
  return { pid: metadata.pid, createdAt: metadata.createdAt };
}

async function lockSnapshot(lockPath) {
  let handle;
  try {
    handle = await open(lockPath, 'r');
    const stats = await handle.stat();
    if (!stats.isFile() || stats.size > MAX_LOCK_BYTES) throw malformedLock(lockPath);
    const contents = await handle.readFile('utf8');
    return {
      contents,
      metadata: parseLockMetadata(contents, stats, lockPath),
      stats,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  } finally {
    await handle?.close();
  }
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
}

async function snapshotStillCurrent(lockPath, snapshot) {
  try {
    const current = await stat(lockPath);
    return current.dev === snapshot.stats.dev
      && current.ino === snapshot.stats.ino
      && current.size === snapshot.stats.size
      && current.mtimeMs === snapshot.stats.mtimeMs;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function recoverStaleLock(lockPath, staleLockMs) {
  const snapshot = await lockSnapshot(lockPath);
  if (!snapshot) return true;
  const newestTimestamp = Math.max(snapshot.metadata.createdAt, snapshot.stats.mtimeMs);
  if (Date.now() - newestTimestamp < staleLockMs) return false;
  if (processIsAlive(snapshot.metadata.pid)) return false;
  if (!await snapshotStillCurrent(lockPath, snapshot)) return false;

  try {
    await unlink(lockPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return true;
}

async function createLock(lockPath) {
  let handle;
  try {
    handle = await open(lockPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify({
      version: 1,
      pid: process.pid,
      createdAt: Date.now(),
    })}\n`, 'utf8');
    return handle;
  } catch (error) {
    if (handle) {
      await handle.close();
      try {
        await unlink(lockPath);
      } catch (unlinkError) {
        if (unlinkError?.code !== 'ENOENT') throw unlinkError;
      }
    }
    throw error;
  }
}

async function acquireLock(lockPath, options) {
  const { lockRetryMs, lockTimeoutMs, staleLockMs } = validatedLockOptions(options);
  const deadline = Date.now() + lockTimeoutMs;

  while (true) {
    try {
      return await createLock(lockPath);
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (await recoverStaleLock(lockPath, staleLockMs)) continue;
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for SEO state lock: ${lockPath}`);
      }
      await delay(Math.min(lockRetryMs, Math.max(1, deadline - Date.now())));
    }
  }
}

async function releaseLock(handle, lockPath) {
  await handle.close();
  try {
    await unlink(lockPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

function normalizeRecord(record) {
  return {
    provider: String(record.provider),
    url: String(record.url),
    acceptedAt: record.acceptedAt ?? null,
    resultClass: String(record.resultClass),
    retryEligible: Boolean(record.retryEligible),
  };
}

function normalizeAttempt(record) {
  return {
    provider: String(record.provider),
    url: String(record.url),
    attemptedAt: record.attemptedAt ?? record.acceptedAt ?? null,
    resultClass: String(record.resultClass),
    retryEligible: Boolean(record.retryEligible),
    ...(typeof record.errorClass === 'string' && record.errorClass ? {
      errorClass: record.errorClass,
    } : {}),
    ...(typeof record.retryGuidance === 'string' && record.retryGuidance ? {
      retryGuidance: record.retryGuidance,
    } : {}),
  };
}

export async function loadState(statePath) {
  try {
    const parsed = JSON.parse(await readFile(statePath, 'utf8'));
    const records = Array.isArray(parsed.records) ? parsed.records.map(normalizeRecord) : [];
    return {
      records,
      attempts: Array.isArray(parsed.attempts)
        ? parsed.attempts.map(normalizeAttempt)
        : records.map(normalizeAttempt),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { records: [], attempts: [] };
    throw error;
  }
}

export async function saveState(statePath, state) {
  const directory = path.dirname(statePath);
  const normalizedState = {
    records: state.records.map(normalizeRecord),
    attempts: state.attempts.map(normalizeAttempt),
  };
  const temporaryPath = path.join(directory, `.state-${randomUUID()}.tmp`);

  let saved = false;
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(normalizedState, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, statePath);
    saved = true;
  } finally {
    if (!saved) {
      try {
        await unlink(temporaryPath);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
}

function mergeSubmissionState(state, records) {
  const merged = new Map(state.records.map((record) => [`${record.provider}\u0000${record.url}`, record]));
  const normalizedRecords = records.map(normalizeRecord);

  for (const record of normalizedRecords) {
    const key = `${record.provider}\u0000${record.url}`;
    const existing = merged.get(key);
    if (existing?.resultClass === 'accepted-for-processing'
      && record.resultClass !== 'accepted-for-processing') continue;
    merged.set(key, record);
  }

  const nextRecords = [...merged.values()].sort((left, right) => (
    left.provider.localeCompare(right.provider) || left.url.localeCompare(right.url)
  ));
  return {
    records: nextRecords,
    attempts: [...state.attempts, ...records.map(normalizeAttempt)],
  };
}

export async function withStateTransaction(statePath, operation, options = {}) {
  if (typeof operation !== 'function') throw new TypeError('SEO state transaction requires an operation');
  validatedLockOptions(options);
  const directory = path.dirname(statePath);
  const lockPath = `${statePath}.lock`;
  await mkdir(directory, { recursive: true });
  const lock = await acquireLock(lockPath, options);

  try {
    let state = await loadState(statePath);
    return await operation({
      get state() {
        return state;
      },
      recordSubmission: async (records) => {
        const nextState = mergeSubmissionState(state, records);
        await saveState(statePath, nextState);
        state = nextState;
        return state;
      },
    });
  } finally {
    await releaseLock(lock, lockPath);
  }
}

export async function recordSubmission(statePath, records, options = {}) {
  return withStateTransaction(
    statePath,
    ({ recordSubmission: persist }) => persist(records),
    options,
  );
}

export function acceptedUrls(state, provider) {
  return state.records
    .filter((record) => record.provider === provider && record.resultClass === 'accepted-for-processing')
    .map((record) => record.url);
}
