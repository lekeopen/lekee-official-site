import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('document declares Simplified Chinese', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="zh-CN">/);
});

test('runtime SEO component emits canonical and JSON-LD', async () => {
  const source = await readFile(new URL('../src/components/common/SEOMeta.tsx', import.meta.url), 'utf8');
  assert.match(source, /rel="canonical"/);
  assert.match(source, /application\/ld\+json/);
  assert.match(source, /buildStructuredData/);
});
