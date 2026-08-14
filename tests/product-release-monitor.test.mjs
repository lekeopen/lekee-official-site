import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkProductReleases } from '../scripts/product-release-monitor.mjs';
import { buildMirrorPlan, createOssAdapter, mirrorReleaseAssets } from '../scripts/product-release-mirror.mjs';

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
  return { name, url: `https://github.com/${repository}/releases/download/${tag}/${name}`, sha256: hex.length === 64 ? hex : hex.repeat(64), sizeBytes: size };
}

const hash = (value) => createHash('sha256').update(value).digest('hex');

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

function fetchWithManifest(releases, manifest, checksums) {
  return async (input) => {
    const url = String(input);
    const match = url.match(/repos\/([^/]+\/[^/]+)\/releases\/latest$/);
    if (match) {
      const body = releases[match[1]];
      return new Response(JSON.stringify(body ?? {}), { status: body ? 200 : 404 });
    }
    if (url.endsWith('/release-manifest.json')) return new Response(JSON.stringify(manifest));
    if (url.endsWith('/SHA256SUMS')) return new Response(checksums);
    return new Response('', { status: 404 });
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

test('mirror plan uses immutable OSS keys and preserves GitHub fallback URLs', () => {
  const plan = buildMirrorPlan(current, { publicBaseUrl: 'https://downloads.lekeopen.com' });
  assert.equal(plan[0].objectKey, 'leke-picker/1.1.0/leke-picker_1.1.0_x64-setup.exe');
  assert.equal(plan[0].domesticUrl, 'https://downloads.lekeopen.com/leke-picker/1.1.0/leke-picker_1.1.0_x64-setup.exe');
  assert.equal(plan[0].sourceUrl, current['leke-picker'].assets['windows-modern-x64'].url);
  assert.equal(plan.length, 4);
  assert.ok(plan.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)));
});

test('dry-run reports the complete plan without downloading or writing OSS', async () => {
  let fetched = false;
  let called = false;
  const result = await mirrorReleaseAssets(current, {
    publicBaseUrl: 'https://downloads.lekeopen.com', dryRun: true,
    fetchImpl: async () => { fetched = true; },
    oss: { inspect: async () => { called = true; } },
  });
  assert.equal(result.mode, 'dry-run');
  assert.equal(result.items.length, 4);
  assert.equal(fetched, false);
  assert.equal(called, false);
});

test('mirror verifies source and OSS read-back bytes', async () => {
  const bytes = Buffer.from('verified installer');
  const sha256 = hash(bytes);
  const releases = { demo: { version: '1.0.0', assets: { x64: { name: 'demo.exe', url: 'https://github.com/lekeopen/demo/releases/download/v1.0.0/demo.exe', sha256, sizeBytes: bytes.length } } } };
  const calls = [];
  const result = await mirrorReleaseAssets(releases, {
    publicBaseUrl: 'https://downloads.lekeopen.com',
    fetchImpl: async () => new Response(bytes),
    oss: {
      inspect: async () => null,
      upload: async (item, source) => calls.push(['upload', item.objectKey, source.equals(bytes)]),
      read: async (item) => { calls.push(['read', item.objectKey]); return bytes; },
    },
  });
  assert.deepEqual(result.items.map(({ status }) => status), ['uploaded']);
  assert.deepEqual(calls, [['upload', 'demo/1.0.0/demo.exe', true], ['read', 'demo/1.0.0/demo.exe']]);
});

test('mirror refuses to overwrite an OSS object with different evidence', async () => {
  const bytes = Buffer.from('verified installer');
  const sha256 = hash(bytes);
  const releases = { demo: { version: '1.0.0', assets: { x64: { name: 'demo.exe', url: 'https://github.com/lekeopen/demo/releases/download/v1.0.0/demo.exe', sha256, sizeBytes: bytes.length } } } };
  await assert.rejects(mirrorReleaseAssets(releases, {
    publicBaseUrl: 'https://downloads.lekeopen.com', fetchImpl: async () => new Response(bytes),
    oss: { inspect: async () => ({ sha256: 'f'.repeat(64), sizeBytes: bytes.length }) },
  }), /refusing to overwrite/);
});

test('OSS adapter signs HEAD, PUT, and GET without delete requests', async () => {
  const requests = [];
  const bytes = Buffer.from('x');
  const adapter = createOssAdapter({
    endpoint: 'https://oss-cn-beijing.aliyuncs.com', bucket: 'lekeopen-downloads', accessKeyId: 'id', accessKeySecret: 'secret',
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), method: init.method, authorization: init.headers.Authorization });
      if (init.method === 'HEAD') return new Response(null, { status: 404 });
      return new Response(init.method === 'GET' ? bytes : null, { status: 200 });
    },
  });
  const item = { objectKey: 'demo/1.0.0/demo.exe', sha256: hash(bytes), sizeBytes: bytes.length };
  assert.equal(await adapter.inspect(item), null);
  await adapter.upload(item, bytes);
  assert.deepEqual(await adapter.read(item), bytes);
  assert.deepEqual(requests.map(({ method }) => method), ['HEAD', 'PUT', 'GET']);
  assert.ok(requests.every(({ authorization }) => authorization.startsWith('OSS id:')));
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
  assert.equal(updated.guigelei.releases[0].version, '1.6.0');
  assert.equal(updated.guigelei.releases[1].version, '1.5.0');
  assert.match(await readFile(file, 'utf8'), /\n$/);
});

test('manifest-driven guigelei release accepts dynamic macOS and Windows asset names', async () => {
  const { rootDir, file } = await fixture();
  const repository = 'lekeopen/guigelei-releases';
  const tag = 'v1.7.0';
  const downloads = [
    { id: 'macos-arm64', asset: 'guigelei-v1.7.0-macos-arm64.dmg', platform: 'macos', architecture: 'arm64', sha256: 'e'.repeat(64), sizeBytes: 301 },
    { id: 'windows-x64', asset: 'guigelei-v1.7.0-windows-x64.exe', platform: 'windows', architecture: 'x64', sha256: 'f'.repeat(64), sizeBytes: 302 },
  ];
  const manifest = { schemaVersion: 1, product: 'guigelei', version: '1.7.0', tag, minimumSystems: { macos: '12.0', windows: '10 64-bit' }, downloads };
  const manifestBytes = JSON.stringify(manifest);
  const checksums = downloads.map((item) => `${item.sha256}  ${item.asset}`).join('\n') + '\n';
  const evidence = {
    manifest: asset('release-manifest.json', repository, tag, hash(manifestBytes), Buffer.byteLength(manifestBytes)),
    sums: asset('SHA256SUMS', repository, tag, hash(checksums), Buffer.byteLength(checksums)),
  };
  const releaseAssets = Object.fromEntries([
    ...downloads.map((item) => [item.id, asset(item.asset, repository, tag, item.sha256[0], item.sizeBytes)]),
    ['manifest', evidence.manifest], ['sums', evidence.sums],
  ]);
  const releases = {
    'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
    [repository]: release(repository, tag, releaseAssets),
  };
  const result = await checkProductReleases({ rootDir, fetchImpl: fetchWithManifest(releases, manifest, checksums) });
  assert.deepEqual(result, { changed: true, updates: [{ slug: 'guigelei', from: '1.5.0', to: '1.7.0' }] });
  const updated = JSON.parse(await readFile(file, 'utf8')).guigelei;
  assert.deepEqual(Object.keys(updated.assets), ['macos-arm64', 'windows-x64']);
  assert.deepEqual(updated.minimumSystems, manifest.minimumSystems);
});

test('manifest-driven guigelei release fails closed when evidence is missing', async () => {
  const { rootDir, file, bytes } = await fixture();
  const repository = 'lekeopen/guigelei-releases';
  const tag = 'v1.7.0';
  const installer = asset('guigelei-v1.7.0-macos-arm64.dmg', repository, tag, 'e', 301);
  const releases = {
    'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
    [repository]: release(repository, tag, { installer }),
  };
  await assert.rejects(checkProductReleases({ rootDir, fetchImpl: fetchFor(releases) }), /release-manifest/i);
  assert.equal(await readFile(file, 'utf8'), bytes);
});

test('manifest-driven guigelei release verifies downloaded evidence bytes', async () => {
  const { rootDir, file, bytes } = await fixture();
  const repository = 'lekeopen/guigelei-releases';
  const tag = 'v1.7.0';
  const download = { id: 'macos-arm64', asset: 'guigelei-v1.7.0-macos-arm64.dmg', platform: 'macos', architecture: 'arm64', sha256: 'e'.repeat(64), sizeBytes: 301 };
  const releaseAssets = {
    installer: asset(download.asset, repository, tag, 'e', 301),
    manifest: asset('release-manifest.json', repository, tag, '1', 1),
    sums: asset('SHA256SUMS', repository, tag, '2', 2),
  };
  const releases = {
    'lekeopen/leke-picker': release('lekeopen/leke-picker', 'v1.1.0', current['leke-picker'].assets),
    [repository]: release(repository, tag, releaseAssets),
  };
  const manifest = { schemaVersion: 1, product: 'guigelei', version: '1.7.0', tag, minimumSystems: { macos: '12.0' }, downloads: [download] };
  await assert.rejects(
    checkProductReleases({ rootDir, fetchImpl: fetchWithManifest(releases, manifest, `${download.sha256}  ${download.asset}\n`) }),
    /evidence.*(size|SHA-256)/i,
  );
  assert.equal(await readFile(file, 'utf8'), bytes);
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
