import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const readContactPage = () => readFile(
  new URL('../src/pages/Contact.tsx', import.meta.url),
  'utf8',
);

test('office address does not repeat the Amap link above the embedded map', async () => {
  const contact = await readContactPage();

  assert.doesNotMatch(contact, /href="https:\/\/uri\.amap\.com\/search\?keyword=/);
  assert.doesNotMatch(contact, />\s*在高德地图中查看\s*</);
});

test('contact page renders a wide embedded office map below the contact grid', async () => {
  const contact = await readContactPage();

  assert.match(contact, /import OfficeMap from ['"]\.\.\/components\/contact\/OfficeMap['"]/);
  assert.match(contact, /<OfficeMap\s*\/>/);
  assert.match(contact, /<\/div>\s*<OfficeMap\s*\/>\s*<\/div>/);
});

test('static map targets Anju Community Zone E without runtime map services', async () => {
  const officeMap = await readFile(
    new URL('../src/components/contact/OfficeMap.tsx', import.meta.url),
    'utf8',
  );

  assert.match(officeMap, /天水市秦州区安居小区 E 区/);
  assert.match(officeMap, /<img/);
  assert.match(officeMap, /loading="lazy"/);
  assert.match(officeMap, /src="\/images\/office-map\.webp"/);
  assert.match(officeMap, /alt={`天水市秦州区安居小区 E 区位置地图`}/);
  assert.doesNotMatch(officeMap, /<iframe/);
  assert.doesNotMatch(officeMap, /openstreetmap\.org\/export\/embed\.html/);
  assert.doesNotMatch(officeMap, /VITE_AMAP_KEY/);
  assert.doesNotMatch(officeMap, /webapi\.amap\.com/);
  assert.match(officeMap, /https:\/\/uri\.amap\.com\/search\?keyword=/);

  const mapImage = await stat(new URL('../public/images/office-map.webp', import.meta.url));
  assert.ok(mapImage.size > 10_000, 'static map image should contain rendered map detail');
});
