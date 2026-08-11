import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('product analytics uses an allow-list of anonymous Clarity event names', async () => {
  const source = await readFile(new URL('../src/analytics/productEvents.ts', import.meta.url), 'utf8');
  assert.match(source, /product_leke_picker_online_use/);
  assert.match(source, /product_leke_picker_download_modern/);
  assert.match(source, /product_guigelei_release_notes/);
  assert.match(source, /product_guigelei_download_macos/);
  assert.match(source, /window\.clarity\('event', eventName\)/);
  assert.doesNotMatch(source, /student|roster|filename|filePath/i);
});

test('product calls to action and downloads emit product events', async () => {
  const [hero, downloads, picker, guigelei] = await Promise.all([
    readFile(new URL('../src/components/products/ProductHero.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/products/DownloadSection.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/LekePickerProduct.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/GuigeleiProduct.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(hero, /trackProductEvent/);
  assert.match(downloads, /download\.analyticsEvent/);
  assert.match(picker, /product_leke_picker_online_use/);
  assert.match(guigelei, /product_guigelei_release_notes/);
});

test('privacy policy names Clarity and excludes product-local content from analytics', async () => {
  const privacy = await readFile(new URL('../src/pages/Privacy.tsx', import.meta.url), 'utf8');
  assert.match(privacy, /Microsoft Clarity/);
  assert.match(privacy, /GitHub Release API/);
  assert.match(privacy, /自动请求/);
  assert.match(privacy, /IP 地址和浏览器请求信息/);
  assert.match(privacy, /学生名单、文件名、文件路径或文件内容/);
});
