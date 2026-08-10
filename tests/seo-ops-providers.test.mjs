import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildBaiduRequest,
  buildIndexNowRequest,
  submitProvider,
} from '../tools/seo-ops/src/providers.mjs';
import * as cli from '../tools/seo-ops/src/cli.mjs';
import { recordSubmission } from '../tools/seo-ops/src/state.mjs';

const { main: runCli } = cli;

const URLS = [
  'https://lekeopen.com/news/a/',
  'https://lekeopen.com/news/b/',
];

test('buildBaiduRequest uses the official tokenized endpoint and a newline-delimited UTF-8 body', () => {
  const request = buildBaiduRequest(URLS, {
    site: 'https://lekeopen.com',
    token: 'baidu-test-token',
  });

  assert.equal(request.url, 'https://data.zz.baidu.com/urls?site=https%3A%2F%2Flekeopen.com&token=baidu-test-token');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers['content-type'], 'text/plain; charset=utf-8');
  assert.equal(request.init.body, 'https://lekeopen.com/news/a/\nhttps://lekeopen.com/news/b/');
  assert.deepEqual(request.secretValues, ['baidu-test-token']);
});

test('buildIndexNowRequest uses documented JSON fields and endpoint', () => {
  const request = buildIndexNowRequest(['https://lekeopen.com/news/a/'], {
    key: 'public-indexnow-key',
    keyLocation: 'https://lekeopen.com/public-indexnow-key.txt',
  });

  assert.equal(request.url, 'https://api.indexnow.org/indexnow');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers['content-type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(request.init.body), {
    host: 'lekeopen.com',
    key: 'public-indexnow-key',
    keyLocation: 'https://lekeopen.com/public-indexnow-key.txt',
    urlList: ['https://lekeopen.com/news/a/'],
  });
  assert.deepEqual(request.secretValues, ['public-indexnow-key']);
});

test('provider submission display summaries do not contain credentials', async () => {
  const secret = 'baidu-test-token';
  const result = await submitProvider('baidu', URLS, {
    dryRun: true,
    config: { site: 'https://lekeopen.com', token: secret },
  });

  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(result.status, 'dry-run');
});

test('missing credentials refuse execute and dry-run never calls fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  };

  await assert.rejects(
    submitProvider('baidu', URLS, { execute: true, config: {}, fetchImpl }),
    /BAIDU_SITE and BAIDU_SUBMIT_TOKEN/,
  );
  await submitProvider('indexnow', URLS, { dryRun: true, config: {}, fetchImpl });
  assert.equal(calls, 0);
});

test('IndexNow keys must use the protocol length and character set', () => {
  for (const key of ['short', 'contains_underscore', 'contains space', 'x'.repeat(129)]) {
    assert.throws(() => buildIndexNowRequest(URLS, { key }), /INDEXNOW_KEY/);
  }

  assert.doesNotThrow(() => buildIndexNowRequest(URLS, { key: 'aB3-4567' }));
});

test('IndexNow keyLocation must be an absolute scoped HTTPS URL on the production host', () => {
  const invalidLocations = [
    'http://lekeopen.com/key.txt',
    'https://user:password@lekeopen.com/key.txt',
    'https://lekeopen.com/key.txt?token=public',
    'https://lekeopen.com/key.txt?',
    'https://lekeopen.com/key.txt#fragment',
    'https://lekeopen.com/key.txt#',
    'https://example.com/key.txt',
    'https://lekeopen.com/projects/key.txt',
    'https://lekeopen.com/newsroom/key.txt',
  ];

  for (const keyLocation of invalidLocations) {
    assert.throws(
      () => buildIndexNowRequest(['https://lekeopen.com/news/a/'], {
        key: 'aB3-4567',
        keyLocation,
      }),
      /INDEXNOW_KEY_LOCATION/,
    );
  }

  assert.doesNotThrow(() => buildIndexNowRequest(['https://lekeopen.com/news/a/'], {
    key: 'aB3-4567',
    keyLocation: 'https://lekeopen.com/news/key.txt',
  }));
  assert.doesNotThrow(() => buildIndexNowRequest(URLS, {
    key: 'aB3-4567',
    keyLocation: 'https://lekeopen.com/key.txt',
  }));
});

test('IndexNow rejects requests larger than 10,000 URLs', () => {
  const urls = Array.from({ length: 10_001 }, (_, index) => `https://lekeopen.com/news/${index}/`);
  assert.throws(() => buildIndexNowRequest(urls, { key: 'aB3-4567' }), /10,000/);
});

test('accepted submissions persist only safe state fields atomically', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-state-'));
  const statePath = path.join(root, '.seo-ops', 'state.json');

  const result = await submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => new Response(null, { status: 202 }),
    statePath,
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(result.status, 'accepted-for-processing');
  assert.deepEqual(state.records.map((record) => Object.keys(record).sort()), [
    ['acceptedAt', 'provider', 'resultClass', 'retryEligible', 'url'],
    ['acceptedAt', 'provider', 'resultClass', 'retryEligible', 'url'],
  ]);
  assert.ok(state.records.every((record) => record.resultClass === 'accepted-for-processing'));
  assert.ok(state.records.every((record) => record.retryEligible === false));
  assert.equal(JSON.stringify(state).includes('aB3-4567'), false);
});

test('provider request runs while the state transaction lock is held and records state before cleanup', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-request-transaction-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  let observedLock = false;

  const result = await submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => {
      try {
        await access(lockPath);
        observedLock = true;
      } catch {
        observedLock = false;
      }
      return new Response(null, { status: 202 });
    },
    statePath,
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(observedLock, true);
  assert.equal(result.status, 'accepted-for-processing');
  assert.ok(state.records.every((record) => record.resultClass === 'accepted-for-processing'));
  assert.ok(state.attempts.every((attempt) => attempt.resultClass === 'accepted-for-processing'));
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('state transaction cleans up its lock after a provider request failure is recorded', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-request-failure-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  let observedLock = false;

  const result = await submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => {
      try {
        await access(lockPath);
        observedLock = true;
      } catch {
        observedLock = false;
      }
      throw new Error('fixture transport failure');
    },
    statePath,
    requestOptions: { attempts: 1, timeoutMs: 100 },
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(observedLock, true);
  assert.equal(result.status, 'retry-eligible');
  assert.equal(result.errorClass, 'network-error');
  assert.ok(state.attempts.every((attempt) => attempt.errorClass === 'network-error'));
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('state transaction removes its lock and atomic temp file after persistence failure', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-persist-failure-lock-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const stateDirectory = path.dirname(statePath);
  const lockPath = `${statePath}.lock`;
  let observedLock = false;

  await assert.rejects(submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => {
      try {
        await access(lockPath);
        observedLock = true;
      } catch {
        observedLock = false;
      }
      await mkdir(statePath);
      return new Response(null, { status: 202 });
    },
    statePath,
  }));

  assert.equal(observedLock, true);
  assert.deepEqual(await readdir(stateDirectory), ['state.json']);
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('malformed state lock fails closed before any provider request', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-malformed-lock-request-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(lockPath, 'malformed lock metadata\n', 'utf8');
  let fetchCalls = 0;

  const pending = submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response(null, { status: 202 });
    },
    statePath,
    stateOptions: { lockTimeoutMs: 30 },
  });
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
  assert.equal(fetchCalls, 0);
  assert.equal(await readFile(lockPath, 'utf8'), 'malformed lock metadata\n');
});

test('provider dry-run creates neither state nor lock artifacts', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-dry-run-artifacts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const lockPath = `${statePath}.lock`;

  const result = await submitProvider('indexnow', URLS, {
    dryRun: true,
    config: {},
    fetchImpl: async () => assert.fail('dry-run must not request the provider'),
    statePath,
  });

  assert.equal(result.status, 'dry-run');
  await assert.rejects(access(statePath), { code: 'ENOENT' });
  await assert.rejects(access(lockPath), { code: 'ENOENT' });
});

test('Baidu partial success records listed failures as rejected and only mapped successes as accepted', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-baidu-partial-state-'));
  const statePath = path.join(root, '.seo-ops', 'state.json');

  const result = await submitProvider('baidu', URLS, {
    execute: true,
    config: { site: 'https://lekeopen.com', token: 'baidu-test-token' },
    fetchImpl: async () => new Response(JSON.stringify({
      success: 1,
      not_valid: ['https://lekeopen.com/news/b/'],
    }), { status: 200 }),
    statePath,
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(result.status, 'partial-acceptance');
  assert.deepEqual(state.records.map(({ url, resultClass }) => ({ url, resultClass })), [
    { url: 'https://lekeopen.com/news/a/', resultClass: 'accepted-for-processing' },
    { url: 'https://lekeopen.com/news/b/', resultClass: 'rejected' },
  ]);
});

test('Baidu full URL rejections return deterministic actionable classifications without leaking provider data', async (t) => {
  const cases = [
    {
      label: 'invalid URLs',
      payloadFor: (urls) => ({ success: 0, not_valid: urls }),
      errorClass: 'url-validation-error',
      attemptClassesFor: (urls) => urls.map(() => 'url-validation-error'),
      guidancePattern: /canonical URLs/i,
    },
    {
      label: 'site mismatch',
      payloadFor: (urls) => ({ success: 0, not_same_site: urls }),
      errorClass: 'site-mismatch-error',
      attemptClassesFor: (urls) => urls.map(() => 'site-mismatch-error'),
      guidancePattern: /site ownership|configured Baidu site/i,
    },
    {
      label: 'mixed rejection arrays',
      payloadFor: (urls) => ({
        success: 0,
        not_valid: urls.slice(0, 1),
        not_same_site: urls.slice(1),
      }),
      errorClass: 'url-validation-and-site-mismatch',
      attemptClassesFor: (urls) => [
        'url-validation-error',
        ...urls.slice(1).map(() => 'site-mismatch-error'),
      ],
      guidancePattern: /canonical URLs.*site|site.*canonical URLs/i,
    },
  ];

  for (const scenario of cases) {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-baidu-full-rejection-'));
    t.after(() => import('node:fs/promises').then(({ rm }) => rm(rootDir, { recursive: true, force: true })));
    const token = 'baidu-test-token';
    const rawBody = 'raw-provider-body-secret';
    const output = [];
    let submittedUrls;

    const result = await runCli({
      argv: ['submit', 'baidu', '--execute'],
      rootDir,
      env: { BAIDU_SITE: 'https://lekeopen.com', BAIDU_SUBMIT_TOKEN: token },
      fetchImpl: async (_url, init) => {
        submittedUrls = init.body.split('\n');
        return new Response(JSON.stringify({
          ...scenario.payloadFor(submittedUrls),
          message: rawBody,
        }), { status: 200 });
      },
      output: (line) => output.push(line),
    });
    const stateText = await readFile(path.join(rootDir, '.seo-ops', 'state.json'), 'utf8');
    const state = JSON.parse(stateText);
    const display = JSON.stringify({ result, output });

    assert.equal(result.status, 'rejected', scenario.label);
    assert.equal(result.errorClass, scenario.errorClass, scenario.label);
    assert.equal(result.retryEligible, false, scenario.label);
    assert.match(result.retryGuidance, scenario.guidancePattern, scenario.label);
    assert.equal(cli.submissionExitCode(result), 1, scenario.label);
    assert.ok(output.some((line) => line.includes(`error class: ${scenario.errorClass}`)), scenario.label);
    assert.deepEqual(
      state.attempts.map((attempt) => attempt.errorClass),
      scenario.attemptClassesFor(submittedUrls),
      scenario.label,
    );
    assert.equal(display.includes(token), false, scenario.label);
    assert.equal(display.includes(rawBody), false, scenario.label);
    assert.equal(stateText.includes(token), false, scenario.label);
    assert.equal(stateText.includes(rawBody), false, scenario.label);
  }
});

test('Baidu fails closed when partial response counts and failure arrays cannot map URLs safely', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-baidu-uncertain-state-'));
  const statePath = path.join(root, '.seo-ops', 'state.json');

  await submitProvider('baidu', URLS, {
    execute: true,
    config: { site: 'https://lekeopen.com', token: 'baidu-test-token' },
    fetchImpl: async () => new Response(JSON.stringify({
      success: 1,
      not_valid: ['https://lekeopen.com/news/not-submitted/'],
    }), { status: 200 }),
    statePath,
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.ok(state.records.every((record) => record.resultClass === 'rejected'));
});

test('HTTP rejection classes persist sanitized per-URL state and return actionable guidance', async (t) => {
  const cases = [
    { status: 400, resultClass: 'rejected', errorClass: 'validation-error', retryEligible: false },
    { status: 401, resultClass: 'rejected', errorClass: 'authentication-error', retryEligible: false },
    { status: 403, resultClass: 'rejected', errorClass: 'authentication-error', retryEligible: false },
    { status: 422, resultClass: 'rejected', errorClass: 'validation-error', retryEligible: false },
    { status: 429, resultClass: 'retry-eligible', errorClass: 'rate-limit', retryEligible: true },
    { status: 500, resultClass: 'retry-eligible', errorClass: 'provider-unavailable', retryEligible: true },
    { status: 503, resultClass: 'retry-eligible', errorClass: 'provider-unavailable', retryEligible: true },
  ];

  for (const expected of cases) {
    const root = await mkdtemp(path.join(os.tmpdir(), `leke-indexnow-http-${expected.status}-`));
    t.after(() => import('node:fs/promises').then(({ rm }) => rm(root, { recursive: true, force: true })));
    const statePath = path.join(root, '.seo-ops', 'state.json');
    const result = await submitProvider('indexnow', URLS, {
      execute: true,
      config: { key: 'aB3-4567' },
      fetchImpl: async () => new Response('raw-provider-body-secret', { status: expected.status }),
      statePath,
      requestOptions: { attempts: 1, timeoutMs: 100 },
    });
    const state = JSON.parse(await readFile(statePath, 'utf8'));

    assert.equal(result.status, expected.resultClass);
    assert.equal(result.errorClass, expected.errorClass);
    assert.equal(result.retryEligible, expected.retryEligible);
    assert.equal(typeof result.retryGuidance, 'string');
    assert.ok(result.retryGuidance.length > 0);
    assert.equal(JSON.stringify(result).includes('raw-provider-body-secret'), false);
    assert.ok(state.records.every((record) => record.resultClass === expected.resultClass));
    assert.ok(state.records.every((record) => record.retryEligible === expected.retryEligible));
    assert.equal(JSON.stringify(state).includes('raw-provider-body-secret'), false);
  }
});

test('Baidu application errors are rejected without exposing the raw provider message', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-baidu-application-error-'));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const result = await submitProvider('baidu', URLS, {
    execute: true,
    config: { site: 'https://lekeopen.com', token: 'baidu-test-token' },
    fetchImpl: async () => new Response(JSON.stringify({
      error: 401,
      message: 'raw-provider-body-secret',
    }), { status: 200 }),
    statePath,
  });
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(result.status, 'rejected');
  assert.equal(result.errorClass, 'provider-application-error');
  assert.equal(result.retryEligible, false);
  assert.match(result.retryGuidance, /configuration|request/i);
  assert.equal(JSON.stringify(result).includes('raw-provider-body-secret'), false);
  assert.ok(state.records.every((record) => record.resultClass === 'rejected'));
});

test('final network timeout is persisted as retry-eligible without exposing transport details', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-indexnow-timeout-'));
  const statePath = path.join(root, '.seo-ops', 'state.json');
  const resultPromise = submitProvider('indexnow', URLS, {
    execute: true,
    config: { key: 'aB3-4567' },
    fetchImpl: async () => new Promise(() => {}),
    statePath,
    requestOptions: { attempts: 1, timeoutMs: 10 },
  });
  const result = await Promise.race([
    resultPromise,
    new Promise((resolve) => setTimeout(() => resolve({ status: 'did-not-settle' }), 200)),
  ]);
  const state = JSON.parse(await readFile(statePath, 'utf8'));

  assert.equal(result.status, 'retry-eligible');
  assert.equal(result.errorClass, 'network-timeout');
  assert.equal(result.retryEligible, true);
  assert.ok(state.records.every((record) => record.resultClass === 'retry-eligible'));
});

test('submission CLI maps rejected, retry-eligible, and partial real runs to failure exit codes', () => {
  assert.equal(typeof cli.submissionExitCode, 'function');
  assert.equal(cli.submissionExitCode({ status: 'rejected' }), 1);
  assert.equal(cli.submissionExitCode({ status: 'retry-eligible' }), 1);
  assert.equal(cli.submissionExitCode({ status: 'partial-acceptance' }), 1);
  assert.equal(cli.submissionExitCode({ status: 'accepted-for-processing' }), 0);
  assert.equal(cli.submissionExitCode({ status: 'dry-run' }), 0);
});

test('direct submission CLI exits nonzero only after persisting a rejected real run', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-direct-rejected-'));
  const cliPath = path.resolve('tools/seo-ops/src/cli.mjs');
  const preload = 'data:text/javascript,globalThis.fetch=async()=>new Response(\'raw-provider-body-secret\',{status:400})';
  const result = spawnSync(process.execPath, [
    '--import', preload, cliPath, 'submit', 'indexnow', '--execute',
  ], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, INDEXNOW_KEY: 'aB3-4567' },
  });
  const state = JSON.parse(await readFile(path.join(rootDir, '.seo-ops', 'state.json'), 'utf8'));

  assert.equal(result.status, 1);
  assert.match(result.stdout, /indexnow: rejected/);
  assert.match(result.stdout, /error class: validation-error/);
  assert.match(result.stdout, /retry: no/);
  assert.equal(`${result.stdout}${result.stderr}`.includes('raw-provider-body-secret'), false);
  assert.ok(state.records.every((record) => record.resultClass === 'rejected'));
});

test('explicit resubmit defaults to dry-run and lists only the selected accepted canonical URL', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-resubmit-dry-run-'));
  const selectedUrl = 'https://lekeopen.com/about/';
  const statePath = path.join(rootDir, '.seo-ops', 'state.json');
  await recordSubmission(statePath, [{
    provider: 'indexnow',
    url: selectedUrl,
    acceptedAt: '2026-08-11T00:00:00.000Z',
    resultClass: 'accepted-for-processing',
    retryEligible: false,
  }]);
  let fetchCalls = 0;
  const output = [];

  const result = await runCli({
    argv: ['submit', 'indexnow', '--resubmit', selectedUrl],
    rootDir,
    env: {},
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response(null, { status: 202 });
    },
    output: (line) => output.push(line),
  });

  assert.equal(result.status, 'dry-run');
  assert.equal(fetchCalls, 0);
  assert.deepEqual(output.filter((line) => line.startsWith('https://')), [selectedUrl]);
  assert.ok(output.includes('Explicit resubmit URLs: 1'));
});

test('explicit resubmit rejects URLs outside the current published canonical inventory', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-resubmit-invalid-'));
  const invalidUrls = [
    'not-a-url',
    'https://example.com/about/',
    'https://lekeopen.com/about/?preview=1',
    'https://lekeopen.com/about/#draft',
    'https://lekeopen.com/not-published/',
  ];

  for (const url of invalidUrls) {
    await assert.rejects(
      runCli({
        argv: ['submit', 'indexnow', '--resubmit', url],
        rootDir,
        output: () => {},
      }),
      /resubmit.*published canonical inventory/i,
    );
  }
  await assert.rejects(
    runCli({
      argv: ['submit', 'indexnow', '--resubmit'],
      rootDir,
      output: () => {},
    }),
    /--resubmit requires one canonical URL/,
  );
});

test('explicit resubmit requires an existing accepted record for the selected provider', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-resubmit-not-accepted-'));

  await assert.rejects(
    runCli({
      argv: ['submit', 'indexnow', '--resubmit', 'https://lekeopen.com/about/'],
      rootDir,
      output: () => {},
    }),
    /--resubmit URL must already have an accepted indexnow result/,
  );
});

test('explicit accepted-URL resubmit performs a network write only with --execute', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-resubmit-execute-'));
  const selectedUrl = 'https://lekeopen.com/about/';
  const statePath = path.join(rootDir, '.seo-ops', 'state.json');
  await recordSubmission(statePath, [{
    provider: 'indexnow',
    url: selectedUrl,
    acceptedAt: '2026-08-11T00:00:00.000Z',
    resultClass: 'accepted-for-processing',
    retryEligible: false,
  }]);
  let fetchCalls = 0;
  let submittedUrls;
  const fetchImpl = async (_url, init) => {
    fetchCalls += 1;
    submittedUrls = JSON.parse(init.body).urlList;
    return new Response(null, { status: 202 });
  };

  await runCli({
    argv: ['submit', 'indexnow', '--resubmit', selectedUrl, '--dry-run'],
    rootDir,
    env: { INDEXNOW_KEY: 'aB3-4567' },
    fetchImpl,
    output: () => {},
  });
  assert.equal(fetchCalls, 0);

  const result = await runCli({
    argv: ['submit', 'indexnow', '--resubmit', selectedUrl, '--execute'],
    rootDir,
    env: { INDEXNOW_KEY: 'aB3-4567' },
    fetchImpl,
    output: () => {},
  });
  assert.equal(fetchCalls, 1);
  assert.deepEqual(submittedUrls, [selectedUrl]);
  assert.equal(result.status, 'accepted-for-processing');
});

test('rejected accepted-URL resubmit keeps effective acceptance and records sanitized attempt history', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-resubmit-rejected-'));
  const selectedUrl = 'https://lekeopen.com/about/';
  const statePath = path.join(rootDir, '.seo-ops', 'state.json');
  const key = 'aB3-4567';
  const rawBody = 'raw-provider-body-secret';
  const accepted = {
    provider: 'indexnow',
    url: selectedUrl,
    acceptedAt: '2026-08-11T00:00:00.000Z',
    resultClass: 'accepted-for-processing',
    retryEligible: false,
  };
  await recordSubmission(statePath, [accepted]);

  const result = await runCli({
    argv: ['submit', 'indexnow', '--resubmit', selectedUrl, '--execute'],
    rootDir,
    env: { INDEXNOW_KEY: key },
    fetchImpl: async () => new Response(rawBody, { status: 400 }),
    output: () => {},
  });
  const stateText = await readFile(statePath, 'utf8');
  const state = JSON.parse(stateText);
  const ordinaryOutput = [];
  await runCli({
    argv: ['submit', 'indexnow', '--dry-run'],
    rootDir,
    env: {},
    fetchImpl: async () => assert.fail('ordinary dry-run must not request the provider'),
    output: (line) => ordinaryOutput.push(line),
  });

  assert.equal(result.status, 'rejected');
  assert.deepEqual(state.records, [accepted]);
  assert.deepEqual(state.attempts.map(({ provider, url, resultClass, retryEligible }) => ({
    provider,
    url,
    resultClass,
    retryEligible,
  })), [
    {
      provider: 'indexnow',
      url: selectedUrl,
      resultClass: 'accepted-for-processing',
      retryEligible: false,
    },
    {
      provider: 'indexnow',
      url: selectedUrl,
      resultClass: 'rejected',
      retryEligible: false,
    },
  ]);
  assert.deepEqual(Object.keys(state.attempts[0]).sort(), [
    'attemptedAt',
    'provider',
    'resultClass',
    'retryEligible',
    'url',
  ]);
  assert.deepEqual(Object.keys(state.attempts[1]).sort(), [
    'attemptedAt',
    'errorClass',
    'provider',
    'resultClass',
    'retryEligible',
    'retryGuidance',
    'url',
  ]);
  assert.equal(state.attempts[1].errorClass, 'validation-error');
  assert.match(state.attempts[1].retryGuidance, /canonical URLs|configuration/i);
  assert.equal(ordinaryOutput.includes(selectedUrl), false);
  assert.equal(stateText.includes(key), false);
  assert.equal(stateText.includes(rawBody), false);
});

test('inventory prints each canonical URL once without callback metadata', async () => {
  const output = [];
  const result = await runCli({ argv: ['inventory'], output: (...values) => output.push(...values) });

  assert.equal(output.length, result.urlCount + 1);
  assert.ok(output.slice(1).every((value) => typeof value === 'string'));
});

test('Baidu dry-run prints the exact pending URL set without its token', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-cli-'));
  const output = [];
  const token = 'must-not-appear';

  await runCli({
    argv: ['submit', 'baidu', '--dry-run'],
    rootDir,
    env: { BAIDU_SITE: 'https://lekeopen.com', BAIDU_SUBMIT_TOKEN: token },
    output: (line) => output.push(line),
  });

  assert.deepEqual(output, [
    'Eligible canonical URLs: 8',
    'URLs pending baidu: 8',
    'https://lekeopen.com/',
    'https://lekeopen.com/about/',
    'https://lekeopen.com/contact/',
    'https://lekeopen.com/news/',
    'https://lekeopen.com/privacy/',
    'https://lekeopen.com/products/',
    'https://lekeopen.com/services/',
    'https://lekeopen.com/solutions/',
    'baidu: dry-run; URLs: 8',
  ]);
  assert.equal(JSON.stringify(output).includes(token), false);
});
