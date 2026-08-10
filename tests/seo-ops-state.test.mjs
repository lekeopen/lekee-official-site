import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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

test('recordSubmission waits for the exclusive state lock before read-merge-write', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-held-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(lockPath, 'held by test', { encoding: 'utf8', flag: 'wx' });

  const pending = recordSubmission(statePath, [record('https://lekeopen.com/about/', 'rejected')]);
  const earlyResult = await Promise.race([
    pending.then(() => 'completed'),
    new Promise((resolve) => setTimeout(() => resolve('waiting'), 30)),
  ]);

  assert.equal(earlyResult, 'waiting');
  await rm(lockPath);
  await pending;
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
