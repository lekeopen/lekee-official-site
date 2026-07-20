import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readContactPage = () => readFile(
  new URL('../src/pages/Contact.tsx', import.meta.url),
  'utf8',
);

test('office address links to Amap without requiring an API key', async () => {
  const contact = await readContactPage();

  assert.match(contact, /href="https:\/\/uri\.amap\.com\/search\?keyword=/);
  assert.match(contact, /target="_blank"/);
  assert.match(contact, /rel="noopener noreferrer"/);
  assert.match(contact, />\s*在高德地图中查看\s*</);
});
