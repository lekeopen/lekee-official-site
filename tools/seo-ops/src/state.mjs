import { randomUUID } from 'node:crypto';
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const LOCK_RETRY_MS = 10;
const LOCK_TIMEOUT_MS = 5_000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function acquireLock(lockPath) {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (true) {
    try {
      const handle = await open(lockPath, 'wx');
      await handle.writeFile(`${process.pid}\n`, 'utf8');
      return handle;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for SEO state lock: ${lockPath}`);
      }
      await delay(LOCK_RETRY_MS);
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

export async function loadState(statePath) {
  try {
    const parsed = JSON.parse(await readFile(statePath, 'utf8'));
    return {
      records: Array.isArray(parsed.records) ? parsed.records.map(normalizeRecord) : [],
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { records: [] };
    throw error;
  }
}

export async function saveState(statePath, records) {
  const directory = path.dirname(statePath);
  const state = { records: records.map(normalizeRecord) };
  const temporaryPath = path.join(directory, `.state-${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, statePath);
}

export async function recordSubmission(statePath, records) {
  const directory = path.dirname(statePath);
  const lockPath = `${statePath}.lock`;
  await mkdir(directory, { recursive: true });
  const lock = await acquireLock(lockPath);

  try {
    const state = await loadState(statePath);
    const merged = new Map(state.records.map((record) => [`${record.provider}\u0000${record.url}`, record]));

    for (const record of records.map(normalizeRecord)) {
      const key = `${record.provider}\u0000${record.url}`;
      const existing = merged.get(key);
      if (existing?.resultClass === 'accepted-for-processing'
        && record.resultClass !== 'accepted-for-processing') continue;
      merged.set(key, record);
    }

    const nextRecords = [...merged.values()].sort((left, right) => (
      left.provider.localeCompare(right.provider) || left.url.localeCompare(right.url)
    ));
    await saveState(statePath, nextRecords);
    return { records: nextRecords };
  } finally {
    await releaseLock(lock, lockPath);
  }
}

export function acceptedUrls(state, provider) {
  return state.records
    .filter((record) => record.provider === provider && record.resultClass === 'accepted-for-processing')
    .map((record) => record.url);
}
