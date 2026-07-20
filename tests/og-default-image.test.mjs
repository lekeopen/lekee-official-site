import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const rootFile = (path) => new URL(`../${path}`, import.meta.url);

const readPngSize = async (path) => {
  const png = await readFile(rootFile(path));
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
};

test('default OG image uses square dimensions for WeChat link cards', async () => {
  assert.deepEqual(await readPngSize('public/og-default.png'), {
    width: 600,
    height: 600,
  });

  const png = await readFile(rootFile('public/og-default.png'));
  assert.equal(png[25], 2, 'default OG image should be an opaque RGB PNG');
});

test('client and prerender metadata use the logo-based default OG image', async () => {
  const seoMeta = await readFile(rootFile('src/components/common/SEOMeta.tsx'), 'utf8');
  const prerender = await readFile(rootFile('scripts/prerender.ts'), 'utf8');

  assert.match(seoMeta, /const DEFAULT_IMAGE = `\$\{SITE_URL\}\/og-default\.png`/);
  assert.match(seoMeta, /const ogImageWidth = ogImage === DEFAULT_IMAGE \? 600 : undefined/);
  assert.match(seoMeta, /const ogImageHeight = ogImage === DEFAULT_IMAGE \? 600 : undefined/);
  assert.match(seoMeta, /const twitterCard = ogImage === DEFAULT_IMAGE \? 'summary' : 'summary_large_image'/);
  assert.match(prerender, /const fallback = `\$\{SITE_URL\}\/og-default\.png`/);
  assert.match(prerender, /image: `\$\{SITE_URL\}\/og-default\.png`/);
  assert.match(prerender, /async function imageDimensions/);
  assert.doesNotMatch(`${seoMeta}\n${prerender}`, /og-450x300\.png/);
});

test('production build regenerates the default OG image deterministically', async () => {
  const packageJson = JSON.parse(await readFile(rootFile('package.json'), 'utf8'));
  const generator = await readFile(rootFile('scripts/generate-default-og.mjs'), 'utf8');

  assert.equal(packageJson.scripts['build:og'], 'node scripts/generate-default-og.mjs');
  assert.match(packageJson.scripts.build, /^npm run build:og && /);
  assert.match(generator, /logo\.png/);
  assert.match(generator, /const width = 600/);
  assert.match(generator, /const height = 600/);
});
