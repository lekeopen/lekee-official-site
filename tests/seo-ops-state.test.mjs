import assert from 'node:assert/strict';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  utimes,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadState, recordSubmission } from '../tools/seo-ops/src/state.mjs';

function record(url, resultClass, acceptedAt = null) {
  return {
    provider: 'indexnow',
    url,
    acceptedAt,
    resultClass,
    retryEligible: resultClass === 'retry-eligible',
  };
}

function lockMetadata(pid, createdAt) {
  return `${JSON.stringify({ version: 1, pid, createdAt })}\n`;
}

test('recordSubmission refuses to steal an old state lock owned by a live process', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-held-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  const oldTimestamp = Date.now() - 120_000;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(lockPath, lockMetadata(process.pid, oldTimestamp), { encoding: 'utf8', flag: 'wx' });
  await utimes(lockPath, new Date(oldTimestamp), new Date(oldTimestamp));

  const pending = recordSubmission(
    statePath,
    [record('https://lekeopen.com/about/', 'rejected')],
    { lockTimeoutMs: 30 },
  );
  const outcome = await Promise.race([
    pending.then(() => 'completed', (error) => error),
    new Promise((resolve) => setTimeout(() => resolve('waiting'), 100)),
  ]);
  if (outcome === 'waiting') {
    await rm(lockPath);
    await pending;
  }

  assert.ok(outcome instanceof Error);
  assert.match(outcome.message, /Timed out waiting for SEO state lock/);
  assert.equal(await readFile(lockPath, 'utf8'), lockMetadata(process.pid, oldTimestamp));
});

test('recordSubmission recovers a sufficiently old lock only after proving its owner PID is absent', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-stale-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  const oldTimestamp = Date.now() - 120_000;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(lockPath, lockMetadata(2_147_483_647, oldTimestamp), 'utf8');
  await utimes(lockPath, new Date(oldTimestamp), new Date(oldTimestamp));

  const pending = recordSubmission(
    statePath,
    [record('https://lekeopen.com/about/', 'rejected')],
    { lockTimeoutMs: 100 },
  );
  const outcome = await Promise.race([
    pending.then(() => 'recovered'),
    new Promise((resolve) => setTimeout(() => resolve('waiting'), 200)),
  ]);
  if (outcome === 'waiting') {
    await rm(lockPath);
    await pending;
  }

  assert.equal(outcome, 'recovered');
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
  assert.equal((await loadState(statePath)).records.length, 1);
});

test('recordSubmission fails closed without removing malformed lock metadata', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-malformed-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(lockPath, '{"version":1,"pid":"invalid"}\n', 'utf8');

  const pending = recordSubmission(
    statePath,
    [record('https://lekeopen.com/about/', 'rejected')],
    { lockTimeoutMs: 30 },
  );
  const outcome = await Promise.race([
    pending.then(() => 'completed', (error) => error),
    new Promise((resolve) => setTimeout(() => resolve('waiting'), 100)),
  ]);
  if (outcome === 'waiting') {
    await rm(lockPath);
    await pending;
  }

  assert.ok(outcome instanceof Error);
  assert.match(outcome.message, /malformed SEO state lock/i);
  assert.equal(await readFile(lockPath, 'utf8'), '{"version":1,"pid":"invalid"}\n');
});

test('concurrent submissions retain distinct records instead of losing the later merge', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-concurrent-state-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');

  await Promise.all([
    recordSubmission(statePath, [record('https://lekeopen.com/about/', 'rejected')]),
    recordSubmission(statePath, [record('https://lekeopen.com/contact/', 'retry-eligible')]),
  ]);
  const state = await loadState(statePath);

  assert.deepEqual(state.records.map(({ url, resultClass }) => ({ url, resultClass })), [
    { url: 'https://lekeopen.com/about/', resultClass: 'rejected' },
    { url: 'https://lekeopen.com/contact/', resultClass: 'retry-eligible' },
  ]);
});

test('an accepted record is never overwritten by a later rejected result', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-accepted-state-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const url = 'https://lekeopen.com/about/';

  await recordSubmission(statePath, [record(url, 'accepted-for-processing', '2026-08-11T00:00:00.000Z')]);
  await recordSubmission(statePath, [record(url, 'rejected')]);
  const state = await loadState(statePath);

  assert.deepEqual(state.records, [record(url, 'accepted-for-processing', '2026-08-11T00:00:00.000Z')]);
});

test('state lock is removed after both successful and failed merges', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-lock-cleanup-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;

  await recordSubmission(statePath, [record('https://lekeopen.com/about/', 'rejected')]);
  await assert.rejects(access(lockPath), { code: 'ENOENT' });

  await writeFile(statePath, '{malformed json', 'utf8');
  await assert.rejects(recordSubmission(statePath, [record('https://lekeopen.com/contact/', 'rejected')]));
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});
