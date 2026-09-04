import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const catalogUrl = new URL('../src/products/catalog.ts', import.meta.url);

async function storeModuleUrl() {
  const source = await readFile(new URL('../src/products/storeChannels.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}

async function loadCatalog() {
  const releases = await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8');
  const source = (await readFile(catalogUrl, 'utf8')).replace(
    "import releaseData from './releases.json';",
    `const releaseData = ${releases};`,
  ).replace(
    "import { getMicrosoftStoreChannel, storeStatusForVersion } from './storeChannels';",
    `import { getMicrosoftStoreChannel, storeStatusForVersion } from '${await storeModuleUrl()}';`,
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: 'catalog.ts',
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('catalog exposes the two approved products in their launch order', async () => {
  const { PRODUCTS } = await loadCatalog();
  assert.deepEqual(PRODUCTS.map(({ slug, name }) => ({ slug, name })), [
    { slug: 'leke-picker', name: '乐可点名' },
    { slug: 'guigelei', name: '归个类' },
  ]);
  assert.equal(PRODUCTS.every(({ version }) => /^\d+\.\d+\.\d+$/.test(version)), true);
});

test('available downloads have complete immutable release identity', async () => {
  const { PRODUCTS } = await loadCatalog();
  const downloads = PRODUCTS.flatMap((product) => product.downloads.filter((item) => item.availability === 'available'));
  assert.equal(downloads.length, 4);
  assert.equal(new Set(downloads.map(({ id }) => id)).size, 4);
  for (const download of downloads) {
    const url = new URL(download.url, 'https://lekeopen.com');
    assert.equal(url.origin, 'https://lekeopen.com');
    assert.equal(url.pathname, '/api/download');
    assert.equal(url.searchParams.get('product') !== null, true);
    assert.equal(url.searchParams.get('asset'), download.id);
    assert.match(download.sha256, /^[a-f0-9]{64}$/);
    assert.equal(Number.isSafeInteger(download.sizeBytes) && download.sizeBytes > 0, true);
    assert.match(download.analyticsEvent, /_domestic$/);
    assert.match(download.fallbackAnalyticsEvent, /_github$/);
  }
});

test('乐可点名 uses only the audited public source and release repository', async () => {
  const { getProduct } = await loadCatalog();
  const picker = getProduct('leke-picker');
  assert.equal(picker.repository, 'https://github.com/lekeopen/leke-picker');
  assert.equal(picker.releaseNotes, `https://github.com/lekeopen/leke-picker/releases/tag/v${picker.version}`);
  assert.equal(picker.downloads.every((download) => download.url === `/api/download?product=leke-picker&asset=${download.id}`), true);
  assert.equal(picker.downloads.every((download) => download.fallbackUrl?.startsWith('https://github.com/lekeopen/leke-picker/releases/download/')), true);
  assert.equal(picker.downloads.every((download) => download.fallbackUrl?.endsWith(`/${download.assetName}`)), true);
  assert.equal(JSON.stringify(picker).includes('classroom-random-picker'), false);
  const storeProductVersion = picker.store.verifiedVersion.split('.').slice(0, 3).join('.');
  assert.deepEqual(picker.store, {
    provider: 'microsoft',
    storeId: '9P8078B19P1H',
    url: 'https://apps.microsoft.com/detail/9P8078B19P1H',
    verifiedVersion: picker.store.verifiedVersion,
    status: storeProductVersion === picker.version ? 'verified' : 'lagging',
  });
  assert.match(picker.store.verifiedVersion, /^\d+\.\d+\.\d+\.\d+$/);
  assert.equal(picker.releases.length > 0 && picker.releases.length <= 10, true);
  assert.equal(picker.releases[0].version, picker.version);
  assert.equal(new Set(picker.releases.map(({ tag }) => tag)).size, picker.releases.length);
});

test('production Store status handles matching, lagging, and invalid versions', async () => {
  const { storeStatusForVersion } = await import(await storeModuleUrl());
  for (const [product, store, expected] of [
    ['1.1.2', '1.1.2.0', 'verified'],
    ['1.1.3', '1.1.2.0', 'lagging'],
    ['2.0.0', '1.9.9.0', 'lagging'],
    ['1.1.2', '1.1.2', 'unavailable'],
    ['', '1.1.2.0', 'unavailable'],
  ]) assert.equal(storeStatusForVersion(product, store), expected);
});

test('归个类 uses the controlled domestic endpoint with the monitored GitHub asset as fallback', async () => {
  const { getProduct } = await loadCatalog();
  const guigelei = getProduct('guigelei');
  assert.equal(guigelei.downloads.length, 1);
  assert.equal(guigelei.downloads[0].availability, 'available');
  assert.equal(guigelei.releaseNotes, `https://github.com/lekeopen/guigelei-releases/releases/tag/v${guigelei.version}`);
  assert.equal(guigelei.downloads[0].assetName, `guigelei-${guigelei.version}-arm64.dmg`);
  assert.equal(guigelei.downloads[0].url, '/api/download?product=guigelei&asset=macos-arm64');
  assert.equal(guigelei.downloads[0].fallbackUrl, `https://github.com/lekeopen/guigelei-releases/releases/download/v${guigelei.version}/guigelei-${guigelei.version}-arm64.dmg`);
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
    'leke-picker/windows-modern-x64: available download requires the controlled same-origin endpoint',
    'leke-picker/windows-7-x86: available download requires the controlled same-origin endpoint',
  ]);
});

test('public product catalog never exposes the private OSS origin', async () => {
  const source = await readFile(catalogUrl, 'utf8');
  assert.doesNotMatch(source, /lekeopen-downloads\.oss-cn-beijing\.aliyuncs\.com/);
});

test('catalog validation rejects an invalid or non-Microsoft Store channel', async () => {
  const { PRODUCTS, validateProductCatalog } = await loadCatalog();
  const invalidProducts = structuredClone(PRODUCTS);
  invalidProducts[0].store.storeId = 'not-a-store-id';
  invalidProducts[0].store.url = 'https://example.com/app';
  invalidProducts[0].store.verifiedVersion = '1.1.1';

  assert.deepEqual(validateProductCatalog(invalidProducts), [
    'leke-picker: Microsoft Store ID must be 12 uppercase letters or digits',
    'leke-picker: Microsoft Store URL must match its Store ID',
    'leke-picker: Microsoft Store version must use four numeric parts',
  ]);
});

test('catalog validation prevents a stale Store version from remaining verified', async () => {
  const { PRODUCTS, validateProductCatalog } = await loadCatalog();
  const staleProducts = structuredClone(PRODUCTS);
  staleProducts[0].version = '9.9.9';
  staleProducts[0].store.status = 'verified';

  assert.deepEqual(validateProductCatalog(staleProducts), [
    'leke-picker: Microsoft Store status must be lagging for product v9.9.9',
  ]);
});
