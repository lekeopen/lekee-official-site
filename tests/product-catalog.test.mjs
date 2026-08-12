import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const catalogUrl = new URL('../src/products/catalog.ts', import.meta.url);

async function loadCatalog() {
  const releases = await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8');
  const source = (await readFile(catalogUrl, 'utf8')).replace(
    "import releaseData from './releases.json';",
    `const releaseData = ${releases};`,
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: 'catalog.ts',
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('catalog exposes the two approved products in their launch order', async () => {
  const { PRODUCTS } = await loadCatalog();
  assert.deepEqual(PRODUCTS.map(({ slug, name, version }) => ({ slug, name, version })), [
    { slug: 'leke-picker', name: '乐可点名', version: '1.1.0' },
    { slug: 'guigelei', name: '归个类', version: '1.5.0' },
  ]);
});

test('available downloads have complete immutable release identity', async () => {
  const { PRODUCTS } = await loadCatalog();
  const downloads = PRODUCTS.flatMap((product) => product.downloads.filter((item) => item.availability === 'available'));
  assert.equal(downloads.length, 4);
  assert.equal(new Set(downloads.map(({ id }) => id)).size, 4);
  for (const download of downloads) {
    assert.equal(new URL(download.url).protocol, 'https:');
    assert.match(download.sha256, /^[a-f0-9]{64}$/);
    assert.equal(Number.isSafeInteger(download.sizeBytes) && download.sizeBytes > 0, true);
  }
});

test('乐可点名 uses only the audited public source and release repository', async () => {
  const { getProduct } = await loadCatalog();
  const picker = getProduct('leke-picker');
  assert.equal(picker.repository, 'https://github.com/lekeopen/leke-picker');
  assert.equal(picker.releaseNotes, 'https://github.com/lekeopen/leke-picker/releases/tag/v1.1.0');
  assert.equal(
    picker.downloads.every((download) => download.url?.startsWith('https://github.com/lekeopen/leke-picker/releases/download/v1.1.0/')),
    true,
  );
  assert.equal(JSON.stringify(picker).includes('classroom-random-picker'), false);
});

test('归个类 exposes only the frozen public release asset', async () => {
  const { getProduct } = await loadCatalog();
  const guigelei = getProduct('guigelei');
  assert.equal(guigelei.downloads.length, 1);
  assert.equal(guigelei.downloads[0].availability, 'available');
  assert.equal(
    guigelei.downloads[0].url,
    'https://github.com/lekeopen/guigelei-releases/releases/download/v1.5.0/guigelei-1.5.0-arm64.dmg',
  );
  assert.equal(guigelei.downloads[0].sizeBytes, 120968070);
  assert.equal(guigelei.downloads[0].sha256, '655daf297121b2fcff8ef56c25e7745c41a381667d58728e87abdd4a2a83834a');
  assert.equal(JSON.stringify(guigelei).includes('lekeopen/ai-file-organizer'), false);
});

test('getProduct fails closed for an unknown slug', async () => {
  const { getProduct } = await loadCatalog();
  assert.throws(() => getProduct('unknown-product'), /Unknown product: unknown-product/);
});

test('catalog validation reports duplicate ids and incomplete available downloads', async () => {
  const { PRODUCTS, validateProductCatalog } = await loadCatalog();
  const invalidProducts = structuredClone(PRODUCTS);
  invalidProducts[0].downloads[1].id = invalidProducts[0].downloads[0].id;
  invalidProducts[0].downloads[2].url = undefined;

  assert.deepEqual(validateProductCatalog(invalidProducts), [
    'leke-picker: duplicate download id "windows-modern-x64"',
    'leke-picker/windows-7-x86: available download requires an HTTPS url',
  ]);
});
