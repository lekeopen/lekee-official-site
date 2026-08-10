import assert from 'node:assert/strict';
import test from 'node:test';
import { indexNowKeyFile, verificationMeta } from '../scripts/prerender.mjs';

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
