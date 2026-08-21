import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const expectedEvents = [
  'product_leke_picker_download_modern_oss',
  'product_leke_picker_download_modern_github',
  'product_leke_picker_download_win7_x64_oss',
  'product_leke_picker_download_win7_x64_github',
  'product_leke_picker_download_win7_x86_oss',
  'product_leke_picker_download_win7_x86_github',
  'product_guigelei_download_macos_oss',
  'product_guigelei_download_macos_github',
  'product_guigelei_download_windows_oss',
  'product_guigelei_download_windows_github',
];

test('download analytics exposes fixed source-specific Clarity events', async () => {
  const source = await readFile('src/analytics/productEvents.ts', 'utf8');
  for (const eventName of expectedEvents) assert.match(source, new RegExp(`'${eventName}'`));
  assert.doesNotMatch(source, /'product_leke_picker_download_modern'/);
  assert.doesNotMatch(source, /'product_guigelei_download_macos'/);
});

test('download fallback records its own typed analytics event', async () => {
  const catalog = await readFile('src/products/catalog.ts', 'utf8');
  const section = await readFile('src/components/products/DownloadSection.tsx', 'utf8');
  assert.match(catalog, /fallbackAnalyticsEvent\?: ProductEventName/);
  assert.match(section, /download\.fallbackAnalyticsEvent/);
  assert.match(section, /trackProductEvent\(download\.fallbackAnalyticsEvent\)/);
});

test('download events remain fixed names without user or URL payloads', async () => {
  const source = await readFile('src/analytics/productEvents.ts', 'utf8');
  assert.match(source, /clarity\('event', eventName\)/);
  assert.doesNotMatch(source, /location|href|searchParams|contact|email|fileName/);
});

test('download statistics are explicitly labeled as GitHub Release counts', async () => {
  const source = await readFile('src/components/products/DownloadStats.tsx', 'utf8');

  assert.match(source, /GitHub Release 累计下载/);
  assert.doesNotMatch(source, /正式安装包累计下载/);
});
