import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { indexNowKeyFile, syncIndexNowKeyFile, verificationMeta } from '../scripts/prerender.mjs';

test('verificationMeta emits the exact provider tags and escapes HTML attribute values', () => {
  assert.equal(
    verificationMeta({
      BAIDU_SITE_VERIFICATION: 'baidu&"<\'>',
      GOOGLE_SITE_VERIFICATION: 'google-token',
      BING_SITE_VERIFICATION: 'bing-token',
    }),
    '<meta name="baidu-site-verification" content="baidu&amp;&quot;&lt;&#39;&gt;">\n'
      + '<meta name="google-site-verification" content="google-token">\n'
      + '<meta name="msvalidate.01" content="bing-token">',
  );
});

test('verificationMeta omits providers without a configured value', () => {
  assert.equal(verificationMeta({}), '');
  assert.equal(
    verificationMeta({ GOOGLE_SITE_VERIFICATION: 'google-token' }),
    '<meta name="google-site-verification" content="google-token">',
  );
});

test('verificationMeta rejects control characters in public verification values', () => {
  assert.throws(
    () => verificationMeta({ BAIDU_SITE_VERIFICATION: 'unsafe\nvalue' }),
    /control character/i,
  );
});

test('verificationMeta rejects C1 control characters while preserving normal Chinese values', () => {
  assert.throws(
    () => verificationMeta({ GOOGLE_SITE_VERIFICATION: 'unsafe\u0085value' }),
    /control character/i,
  );
  assert.equal(
    verificationMeta({ GOOGLE_SITE_VERIFICATION: '乐可开源验证' }),
    '<meta name="google-site-verification" content="乐可开源验证">',
  );
});

test('indexNowKeyFile returns an exact public key-file descriptor', () => {
  const key = 'AbCdEf0123456789-IndexNow-Key';
  assert.deepEqual(indexNowKeyFile({ INDEXNOW_KEY: key }), {
    key,
    filename: `${key}.txt`,
  });
});

test('indexNowKeyFile omits an unconfigured key', () => {
  assert.equal(indexNowKeyFile({}), undefined);
});

test('indexNowKeyFile rejects control characters and invalid protocol key formats', () => {
  assert.throws(() => indexNowKeyFile({ INDEXNOW_KEY: 'valid-key\n' }), /control character/i);
  assert.throws(() => indexNowKeyFile({ INDEXNOW_KEY: 'short-1' }), /8.*128/i);
  assert.throws(() => indexNowKeyFile({ INDEXNOW_KEY: 'invalid_key_123' }), /8.*128/i);
});

test('syncIndexNowKeyFile rotates only its recorded ownership file', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'leke-indexnow-test-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  const oldKey = 'OldIndexNowKey-123456';
  const newKey = 'NewIndexNowKey-654321';
  const unrelatedFile = path.join(outputDir, 'UnrelatedIndexNowKey-123.txt');

  await writeFile(unrelatedFile, 'preserve me', 'utf8');
  await syncIndexNowKeyFile(outputDir, { INDEXNOW_KEY: oldKey });
  await syncIndexNowKeyFile(outputDir, { INDEXNOW_KEY: newKey });

  await assert.rejects(access(path.join(outputDir, `${oldKey}.txt`)));
  assert.equal(await readFile(path.join(outputDir, `${newKey}.txt`), 'utf8'), newKey);
  assert.equal(await readFile(unrelatedFile, 'utf8'), 'preserve me');
});

test('syncIndexNowKeyFile revokes its recorded ownership file without creating an empty file', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'leke-indexnow-test-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  const key = 'ActiveIndexNowKey-1234';

  await syncIndexNowKeyFile(outputDir, { INDEXNOW_KEY: key });
  await syncIndexNowKeyFile(outputDir, {});

  await assert.rejects(access(path.join(outputDir, `${key}.txt`)));
  assert.deepEqual(await readdir(outputDir), []);
});
