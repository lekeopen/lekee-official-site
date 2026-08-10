import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildBaiduRequest,
  buildIndexNowRequest,
  submitProvider,
} from '../tools/seo-ops/src/providers.mjs';
import { main as runCli } from '../tools/seo-ops/src/cli.mjs';

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
