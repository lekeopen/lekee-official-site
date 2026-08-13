import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS } from '../src/support/config.js';
import { createSupportReference } from '../functions/support/reference.mjs';

test('support option values are unique and products are stable', () => {
  assert.deepEqual(PRODUCT_OPTIONS.map(({ value }) => value), ['leke-picker', 'guigelei', 'other']);
  for (const options of [PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS]) {
    assert.equal(new Set(options.map(({ value }) => value)).size, options.length);
  }
});

test('preview uses an exact origin and an isolated KV namespace', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.env.preview.vars.ALLOWED_SUPPORT_ORIGINS, 'https://codex-product-support-design.lekee-official-site.pages.dev');
  assert.notEqual(config.env.preview.kv_namespaces[0].id, config.kv_namespaces[0].id);
  assert.equal(config.env.preview.kv_namespaces[0].binding, 'SUPPORT_RATE_LIMIT');
});

test('support reference contains date and random data only', () => {
  const reference = createSupportReference(new Date('2026-08-13T10:00:00Z'), new Uint8Array([1, 35, 69, 103]));
  assert.equal(reference, 'LK-20260813-01234567');
});
