import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { findDownloadAsset } from '../functions/download/catalog.mjs';
import { createCdnSignedUrl } from '../functions/download/signing.mjs';
import { onRequest, onRequestGet } from '../functions/api/download.js';

const releases = JSON.parse(await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8'));
const pickerModern = releases['leke-picker'].assets['windows-modern-x64'];

const env = {
  DOMESTIC_DOWNLOADS_ENABLED: 'true',
  DOWNLOAD_CDN_HOST: 'downloads.lekeopen.com',
  DOWNLOAD_URL_TTL_SECONDS: '120',
  ALIYUN_CDN_AUTH_KEY: '0123456789abcdef'.repeat(4),
  DOWNLOAD_LOG_KEY: 'separate-log-key',
  DOWNLOAD_RATE_LIMIT: { get: async () => null, put: async () => {} },
};

function request(product = 'leke-picker', asset = 'windows-modern-x64', headers = {}) {
  return new Request(`https://lekeopen.com/api/download?product=${product}&asset=${asset}`, {
    headers: { 'CF-Connecting-IP': '203.0.113.10', 'CF-IPCountry': 'CN', 'User-Agent': 'Mozilla/5.0', ...headers },
  });
}

test('download catalog returns only canonical committed release assets', () => {
  const item = findDownloadAsset('leke-picker', 'windows-modern-x64');
  assert.equal(item.pathname, `/leke-picker/${releases['leke-picker'].version}/${pickerModern.name}`);
  assert.equal(item.fallbackUrl, pickerModern.url);
  assert.equal(item.sha256, pickerModern.sha256);
  assert.equal(findDownloadAsset('leke-picker', '../../secret'), null);
  assert.equal(findDownloadAsset('unknown', 'windows-modern-x64'), null);
});

test('type-C CDN signing is deterministic and bounded to the configured host', () => {
  const now = new Date('2026-08-27T12:00:00Z');
  const key = '0123456789abcdef'.repeat(4);
  const result = createCdnSignedUrl({ host: 'downloads.lekeopen.com', pathname: '/leke-picker/1.1.0/demo.exe', key, now, ttlSeconds: 120 });
  const expires = Math.floor(now.getTime() / 1000) + 120;
  const timestamp = expires.toString(16).toUpperCase();
  const expected = createHash('md5').update(`${key}/leke-picker/1.1.0/demo.exe${timestamp}`).digest('hex');
  assert.equal(result.hostname, 'downloads.lekeopen.com');
  assert.equal(result.protocol, 'https:');
  assert.equal(result.searchParams.get('KEY1'), expected);
  assert.equal(result.searchParams.get('KEY2'), timestamp);
  assert.throws(() => createCdnSignedUrl({ host: 'https://evil.example', pathname: '/demo.exe', key, now, ttlSeconds: 120 }), /host/);
  assert.throws(() => createCdnSignedUrl({ host: 'downloads.lekeopen.com', pathname: '/demo.exe', key, now, ttlSeconds: 301 }), /TTL/);
  assert.throws(() => createCdnSignedUrl({ host: 'downloads.lekeopen.com', pathname: '/demo.exe', key: 'x'.repeat(129), now, ttlSeconds: 120 }), /key/);
});

test('download endpoint redirects only to a short-lived configured CDN URL', async () => {
  const logs = [];
  const now = new Date('2026-08-27T12:00:00Z');
  const response = await onRequestGet({ request: request(), env }, { now, logger: { info: (...args) => logs.push(args) } });
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get('location')).hostname, 'downloads.lekeopen.com');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(JSON.stringify(logs).includes('203.0.113.10'), false);
  assert.equal(JSON.stringify(logs).includes(env.ALIYUN_CDN_AUTH_KEY), false);
});

test('download endpoint falls back to the canonical GitHub asset when domestic runtime controls are unavailable', async () => {
  const response = await onRequestGet({ request: request(), env: { ...env, DOMESTIC_DOWNLOADS_ENABLED: 'false' } }, { now: new Date() });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), pickerModern.url);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});

test('download endpoint rejects unknown assets but falls back when domestic dependencies fail', async () => {
  assert.equal((await onRequestGet({ request: request('leke-picker', 'unknown'), env }, { now: new Date() })).status, 404);
  assert.equal((await onRequestGet({ request: request(), env: { ...env, ALIYUN_CDN_AUTH_KEY: '' } }, { now: new Date() })).status, 302);
  assert.equal((await onRequestGet({ request: request(), env: { ...env, DOWNLOAD_RATE_LIMIT: undefined } }, { now: new Date() })).status, 302);
  const failedRateLimit = { get: async () => { throw new Error('unavailable'); }, put: async () => {} };
  assert.equal((await onRequestGet({ request: request(), env: { ...env, DOWNLOAD_RATE_LIMIT: failedRateLimit } }, { now: new Date() })).status, 302);
});

test('download endpoint rate limits repeated grants without exposing a signed URL', async () => {
  const values = new Map();
  const rateLimit = {
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => { values.set(key, value); },
  };
  let response;
  for (let index = 0; index < 6; index += 1) {
    response = await onRequestGet({ request: request(), env: { ...env, DOWNLOAD_RATE_LIMIT: rateLimit } }, { now: new Date('2026-08-27T12:00:00Z'), logger: { info() {} } });
  }
  assert.equal(response.status, 429);
  assert.equal(response.headers.has('location'), false);
  assert.equal(response.headers.get('retry-after'), '600');
  assert.equal([...values.keys()].some((key) => key.includes('203.0.113.10')), false);
});

test('download endpoint rejects methods other than GET without issuing a URL', async () => {
  const post = new Request('https://lekeopen.com/api/download?product=leke-picker&asset=windows-modern-x64', { method: 'POST' });
  const response = await onRequest({ request: post, env }, { now: new Date() });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
  assert.equal(response.headers.has('location'), false);
});

test('download handler source never contains the OSS public origin or secrets', async () => {
  const files = ['../functions/api/download.js', '../functions/download/catalog.mjs', '../functions/download/signing.mjs', '../functions/download/security.mjs'];
  const source = (await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')))).join('\n');
  assert.doesNotMatch(source, /lekeopen-downloads\.oss-cn-beijing\.aliyuncs\.com/);
  assert.doesNotMatch(source, /0123456789abcdef|separate-log-key/);
});

test('deployment config enables only production with isolated download rate limiting', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.vars.DOMESTIC_DOWNLOADS_ENABLED, 'true');
  assert.equal(config.vars.DOWNLOAD_CDN_HOST, 'downloads.lekeopen.com');
  assert.equal(config.vars.DOWNLOAD_URL_TTL_SECONDS, '120');
  assert.deepEqual(config.kv_namespaces.find(({ binding }) => binding === 'DOWNLOAD_RATE_LIMIT'), {
    binding: 'DOWNLOAD_RATE_LIMIT',
    id: '01e4a2197e364c849858e7ee7e1a8cf6',
  });
  assert.equal(config.env.preview.vars.DOMESTIC_DOWNLOADS_ENABLED, 'false');
  assert.deepEqual(config.env.preview.kv_namespaces.find(({ binding }) => binding === 'DOWNLOAD_RATE_LIMIT'), {
    binding: 'DOWNLOAD_RATE_LIMIT',
    id: '2dd2868bb88a453fbece42ead3e88801',
  });
  assert.equal(JSON.stringify(config).includes('ALIYUN_CDN_AUTH_KEY'), false);
  assert.equal(JSON.stringify(config).includes('DOWNLOAD_LOG_KEY'), false);
  assert.equal(JSON.stringify(config).includes('lekeopen-downloads.oss-cn-beijing.aliyuncs.com'), false);
});
