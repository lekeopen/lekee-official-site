import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS } from '../src/support/config.js';
import { createSupportReference } from '../functions/support/reference.mjs';
import { getEnvironmentOptions, getVersionOptions, isAllowedProductReleaseEnvironment } from '../src/support/options.js';

const releases = JSON.parse(await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8'));

test('support option values are unique and products are stable', () => {
  assert.deepEqual(PRODUCT_OPTIONS.map(({ value }) => value), ['leke-picker', 'guigelei', 'other']);
  for (const options of [PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS]) {
    assert.equal(new Set(options.map(({ value }) => value)).size, options.length);
  }
});

test('preview uses an exact origin and an isolated KV namespace', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.env.preview.vars.ALLOWED_SUPPORT_ORIGINS, 'https://codex-product-support-design.lekee-official-site.pages.dev');
  assert.equal(config.vars.SUPPORT_MAIL_TO, 'contact@lekeopen.com');
  assert.equal(config.env.preview.vars.SUPPORT_MAIL_TO, 'contact@lekeopen.com');
  assert.notEqual(config.env.preview.kv_namespaces[0].id, config.kv_namespaces[0].id);
  assert.equal(config.env.preview.kv_namespaces[0].binding, 'SUPPORT_RATE_LIMIT');
});

test('support reference contains date and random data only', () => {
  const reference = createSupportReference(new Date('2026-08-13T10:00:00Z'), new Uint8Array([1, 35, 69, 103]));
  assert.equal(reference, 'LK-20260813-01234567');
});

test('versions and environments come from each product release', () => {
  const pickerVersions = releases['leke-picker'].releases.map(({ tag }) => tag);
  assert.deepEqual(getVersionOptions('leke-picker').map(({ value }) => value), [...pickerVersions, 'other']);
  assert.deepEqual(
    getEnvironmentOptions('leke-picker', releases['leke-picker'].tag).map(({ value }) => value),
    [...Object.keys(releases['leke-picker'].assets), 'unknown'],
  );
  assert.equal(isAllowedProductReleaseEnvironment('guigelei', 'v1.6.0', 'macos-arm64'), true);
  assert.equal(isAllowedProductReleaseEnvironment('guigelei', 'v1.6.0', 'windows-modern-x64'), false);
});

test('Pages Functions avoid JSON import attributes unsupported by the production bundler', async () => {
  const recordModule = await readFile(new URL('../functions/support/record.mjs', import.meta.url), 'utf8');
  const validationModule = await readFile(new URL('../functions/support/validation.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(recordModule, /releases\.json['"]\s+with\s*\{/);
  assert.doesNotMatch(recordModule, /src\/support\/(?:config|options)\.js/);
  assert.doesNotMatch(validationModule, /src\/support\/(?:config|options)\.js/);
});

test('generated Functions release data stays synchronized with the canonical manifest', async () => {
  const canonical = JSON.parse(await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8'));
  const generated = (await import(`../functions/support/release-data.generated.mjs?test=${Date.now()}`)).default;
  assert.deepEqual(generated, canonical);
  const downloadGenerated = (await import(`../functions/download/release-data.generated.mjs?test=${Date.now()}`)).default;
  assert.deepEqual(downloadGenerated, canonical);
});
