import assert from 'node:assert/strict';
import { access, open, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

const root = process.cwd();

const galleries = {
  'leke-picker': ['main.webp', 'roster.webp', 'result.webp', 'controls.webp'],
  guigelei: ['overview.webp', 'plans.webp', 'customize.webp', 'actions.webp'],
};

test('归个类 committed source screenshots contain no local-path workflow captures', async () => {
  const sourceFiles = await readdir(path.join(root, 'assets', 'product-source', 'guigelei'));
  assert.deepEqual(sourceFiles.sort(), ['icon.png', 'plans.png']);
});

test('leke-picker website demo is a non-empty MP4 asset', async () => {
  const asset = path.join(
    root,
    'public',
    'videos',
    'products',
    'leke-picker',
    'leke-picker-v1.1-horizontal-website-final.mp4',
  );
  const info = await stat(asset);
  const handle = await open(asset, 'r');
  const header = Buffer.alloc(12);

  try {
    await handle.read(header, 0, header.length, 0);
  } finally {
    await handle.close();
  }

  assert.ok(info.size > 1_000_000);
  assert.equal(header.subarray(4, 8).toString('ascii'), 'ftyp');
});

for (const [slug, files] of Object.entries(galleries)) {
  test(`${slug} has four optimized real-interface gallery images`, async () => {
    for (const file of files) {
      const asset = path.join(root, 'public', 'images', 'products', slug, file);
      await access(asset);
      const metadata = await sharp(asset).metadata();
      assert.equal(metadata.format, 'webp');
      assert.ok((metadata.width ?? 0) >= 960);
      assert.ok((metadata.height ?? 0) >= 540);
    }
  });

  test(`${slug} has a 1200x630 social image`, async () => {
    const asset = path.join(root, 'public', 'images', 'products', slug, 'og.png');
    await access(asset);
    const metadata = await sharp(asset).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
  });
}
