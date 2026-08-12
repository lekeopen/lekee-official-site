import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkProductReleases } from '../scripts/product-release-monitor.mjs';

const current = {
  'leke-picker': {
    repository: 'lekeopen/leke-picker', tag: 'v1.1.0', version: '1.1.0',
    publishedAt: '2026-08-11T22:39:04Z', releaseUrl: 'https://github.com/lekeopen/leke-picker/releases/tag/v1.1.0',
    assets: {
      'windows-modern-x64': asset('leke-picker_1.1.0_x64-setup.exe', 'lekeopen/leke-picker', 'v1.1.0', 'a', 101),
      'windows-7-x64': asset('leke-picker-Win7-x64-Offline.exe', 'lekeopen/leke-picker', 'v1.1.0', 'b', 102),
      'windows-7-x86': asset('leke-picker-Win7-x86-Offline.exe', 'lekeopen/leke-picker', 'v1.1.0', 'c', 103),
    },
  },
  guigelei: {
    repository: 'lekeopen/guigelei-releases', tag: 'v1.5.0', version: '1.5.0',
    publishedAt: '2026-08-11T21:06:29Z', releaseUrl: 'https://github.com/lekeopen/guigelei-releases/releases/tag/v1.5.0',
    assets: { 'macos-arm64': asset('guigelei-1.5.0-arm64.dmg', 'lekeopen/guigelei-releases', 'v1.5.0', 'd', 104) },
  },
};

function asset(name, repository, tag, hex, size) {
  return { name, url: `https://github.com/${repository}/releases/download/${tag}/${name}`, sha256: hex.repeat(64), sizeBytes: size };
}

function release(repository, tag, assets, overrides = {}) {
  return {
    tag_name: tag, html_url: `https://github.com/${repository}/releases/tag/${tag}`,
    draft: false, prerelease: false, published_at: '2026-08-12T00:00:00Z',
    assets: Object.values(assets).map((item) => ({
      name: item.name, browser_download_url: item.url, size: item.sizeBytes,
      state: 'uploaded', digest: `sha256:${item.sha256}`,
    })),
    ...overrides,
  };
}

async function fixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'release-monitor-'));
  await mkdir(path.join(rootDir, 'src/products'), { recursive: true });
  const file = path.join(rootDir, 'src/products/releases.json');
  const bytes = `${JSON.stringify(current, null, 2)}\n`;
  await writeFile(file, bytes);
  return { rootDir, file, bytes };
}

function fetchFor(releases) {
  return async (input) => {
    const match = String(input).match(/repos\/([^/]+\/[^/]+)\/releases\/latest$/);
    const body = match && releases[match[1]];
    return new Response(JSON.stringify(body ?? {}), { status: body ? 200 : 404 });
  };
}

test('current stable releases produce no write', async () => {
  const { rootDir, file, bytes } = await fixture();
  const releases = {
    'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
    'lekeopen/guigelei-releases': release('lekeopen/guigelei-releases', 'v1.5.0', current.guigelei.assets),
  };
  const result = await checkProductReleases({ rootDir, fetchImpl: fetchFor(releases) });
  assert.deepEqual(result, { changed: false, updates: [] });
  assert.equal(await readFile(file, 'utf8'), bytes);
});

test('compatible newer stable releases update deterministic release data', async () => {
  const { rootDir, file } = await fixture();
  const nextAssets = {
    'macos-arm64': asset('guigelei-1.6.0-arm64.dmg', 'lekeopen/guigelei-releases', 'v1.6.0', 'e', 204),
  };
  const releases = {
    'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
    'lekeopen/guigelei-releases': release('lekeopen/guigelei-releases', 'v1.6.0', nextAssets),
  };
  const result = await checkProductReleases({ rootDir, fetchImpl: fetchFor(releases) });
  assert.deepEqual(result, { changed: true, updates: [{ slug: 'guigelei', from: '1.5.0', to: '1.6.0' }] });
  const updated = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(updated.guigelei.version, '1.6.0');
  assert.deepEqual(updated.guigelei.assets, nextAssets);
  assert.match(await readFile(file, 'utf8'), /\n$/);
});

for (const [label, mutate] of [
  ['missing required asset', (item) => item.assets.pop()],
  ['unknown binary asset', (item) => item.assets.push({ ...item.assets[0], name: 'unknown.exe' })],
  ['invalid asset size', (item) => { item.assets[0].size = 0; }],
  ['missing digest', (item) => { delete item.assets[0].digest; }],
  ['off-repository URL', (item) => { item.assets[0].browser_download_url = 'https://example.com/file.exe'; }],
  ['malformed tag', (item) => { item.tag_name = 'latest'; }],
  ['mismatched release URL', (item) => { item.html_url = 'https://github.com/other/repo/releases/tag/v1.2.0'; }],
]) {
  test(`${label} fails closed without changing release data`, async () => {
    const { rootDir, file, bytes } = await fixture();
    const nextAssets = {
      'windows-modern-x64': asset('leke-picker_1.2.0_x64-setup.exe', 'lekeopen/leke-picker', 'v1.2.0', 'e', 201),
      'windows-7-x64': asset('leke-picker-Win7-x64-Offline.exe', 'lekeopen/leke-picker', 'v1.2.0', 'f', 202),
      'windows-7-x86': asset('leke-picker-Win7-x86-Offline.exe', 'lekeopen/leke-picker', 'v1.2.0', '1', 203),
    };
    const picker = release('lekeopen/leke-picker', 'v1.2.0', nextAssets);
    mutate(picker);
    const releases = {
      'lekeopen/leke-picker': picker,
      'lekeopen/guigelei-releases': release('lekeopen/guigelei-releases', 'v1.5.0', current.guigelei.assets),
    };
    await assert.rejects(checkProductReleases({ rootDir, fetchImpl: fetchFor(releases) }), /validation failed/);
    assert.equal(await readFile(file, 'utf8'), bytes);
  });
}

test('draft and prerelease candidates are ignored without writes', async () => {
  for (const flag of ['draft', 'prerelease']) {
    const { rootDir, file, bytes } = await fixture();
    const nextAssets = { 'macos-arm64': asset('guigelei-1.6.0-arm64.dmg', 'lekeopen/guigelei-releases', 'v1.6.0', 'e', 204) };
    const candidate = release('lekeopen/guigelei-releases', 'v1.6.0', nextAssets, { [flag]: true });
    const releases = {
      'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
      'lekeopen/guigelei-releases': candidate,
    };
    assert.deepEqual(await checkProductReleases({ rootDir, fetchImpl: fetchFor(releases) }), { changed: false, updates: [] });
    assert.equal(await readFile(file, 'utf8'), bytes);
  }
});
