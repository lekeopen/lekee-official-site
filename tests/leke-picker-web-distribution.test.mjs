import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const importerUrl = new URL('../scripts/leke-picker-web-distribution.mjs', import.meta.url);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function writeTarText(header, offset, length, value) {
  header.write(value, offset, Math.min(Buffer.byteLength(value), length), 'utf8');
}

function writeTarOctal(header, offset, length, value) {
  writeTarText(header, offset, length, `${value.toString(8).padStart(length - 1, '0')}\0`);
}

function tarGzip(files) {
  const chunks = [];
  for (const [name, value] of files) {
    const bytes = Buffer.from(value);
    const header = Buffer.alloc(512);
    writeTarText(header, 0, 100, name);
    writeTarOctal(header, 100, 8, 0o644);
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, bytes.length);
    writeTarOctal(header, 136, 12, 0);
    header.fill(0x20, 148, 156);
    header[156] = '0'.charCodeAt(0);
    writeTarText(header, 257, 6, 'ustar\0');
    writeTarText(header, 263, 2, '00');
    writeTarOctal(header, 148, 8, [...header].reduce((sum, byte) => sum + byte, 0));
    chunks.push(header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  chunks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(chunks), { mtime: 0 });
}

function evidence(version = '1.1.1') {
  const files = new Map([
    ['assets/index.css', Buffer.from('body{margin:0}')],
    ['assets/index.js', Buffer.from('console.log("picker")')],
    ['index.html', Buffer.from('<html><head>\n    <meta name="robots" content="noindex, nofollow" /></head><body><script src="/products/leke-picker/app/assets/index.js"></script></body></html>')],
  ]);
  const archive = tarGzip(files);
  const manifest = {
    schemaVersion: 1,
    product: 'leke-picker',
    version,
    sourceCommit: 'e022d29be11aa69fa786f6fc17ec8547043c7dcc',
    sourceDirty: false,
    base: '/products/leke-picker/app/',
    archive: { name: `leke-picker-web_${version}.tar.gz`, sizeBytes: archive.length, sha256: sha256(archive) },
    files: [...files].map(([filePath, bytes]) => ({ path: filePath, sizeBytes: bytes.length, sha256: sha256(bytes) })),
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const release = {
    version,
    web: {
      archive: { name: manifest.archive.name, url: `https://github.com/lekeopen/leke-picker/releases/download/v${version}/${manifest.archive.name}`, sizeBytes: archive.length, sha256: sha256(archive) },
      manifest: { name: `leke-picker-web_${version}.manifest.json`, url: `https://github.com/lekeopen/leke-picker/releases/download/v${version}/leke-picker-web_${version}.manifest.json`, sizeBytes: manifestBytes.length, sha256: sha256(manifestBytes) },
    },
  };
  return { archive, files, manifest, manifestBytes, release };
}

async function loadImporter() {
  assert.equal(existsSync(importerUrl), true, 'website distribution importer must exist');
  return import(importerUrl.href);
}

test('verified web evidence atomically replaces the stale online application', async () => {
  const { importWebDistribution } = await loadImporter();
  const fixture = evidence();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-picker-import-'));
  const oldApp = path.join(rootDir, 'public/products/leke-picker/app');
  await mkdir(oldApp, { recursive: true });
  await writeFile(path.join(oldApp, 'old.txt'), 'old');
  try {
    const result = await importWebDistribution({
      rootDir,
      release: fixture.release,
      fetchImpl: async (url) => {
        if (url === fixture.release.web.manifest.url) return new Response(fixture.manifestBytes);
        if (url === fixture.release.web.archive.url) return new Response(fixture.archive);
        return new Response('', { status: 404 });
      },
    });

    assert.deepEqual(result, { changed: true, version: '1.1.1', sourceCommit: fixture.manifest.sourceCommit });
    assert.equal(existsSync(path.join(oldApp, 'old.txt')), false);
    assert.equal(await readFile(path.join(oldApp, 'assets/index.js'), 'utf8'), 'console.log("picker")');
    assert.deepEqual(JSON.parse(await readFile(path.join(oldApp, 'distribution-manifest.json'), 'utf8')), fixture.manifest);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('tampered archive fails without changing the existing online application', async () => {
  const { importWebDistribution } = await loadImporter();
  const fixture = evidence();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-picker-import-'));
  const oldApp = path.join(rootDir, 'public/products/leke-picker/app');
  await mkdir(oldApp, { recursive: true });
  await writeFile(path.join(oldApp, 'old.txt'), 'preserve me');
  try {
    await assert.rejects(importWebDistribution({
      rootDir,
      release: fixture.release,
      fetchImpl: async (url) => new Response(url === fixture.release.web.manifest.url ? fixture.manifestBytes : Buffer.from('tampered')),
    }), /archive (size|SHA-256) does not match release evidence/);
    assert.equal(await readFile(path.join(oldApp, 'old.txt'), 'utf8'), 'preserve me');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('tar traversal entries are rejected before filesystem writes', async () => {
  const { parseTarGzip } = await loadImporter();
  assert.throws(() => parseTarGzip(tarGzip(new Map([['../escape.txt', 'bad']]))), /unsafe archive path/);
});

test('missing public web assets are tolerated only when the checked-in online version is already current', async () => {
  const { importWebDistribution } = await loadImporter();
  const fixture = evidence();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-picker-import-'));
  const appRoot = path.join(rootDir, 'public/products/leke-picker/app');
  for (const [filePath, bytes] of fixture.files) {
    await mkdir(path.dirname(path.join(appRoot, filePath)), { recursive: true });
    await writeFile(path.join(appRoot, filePath), bytes);
  }
  await writeFile(path.join(appRoot, 'distribution-manifest.json'), fixture.manifestBytes);
  try {
    assert.deepEqual(await importWebDistribution({ rootDir, release: { version: '1.1.1' } }), {
      changed: false, version: '1.1.1', sourceCommit: 'e022d29be11aa69fa786f6fc17ec8547043c7dcc',
    });
    await assert.rejects(importWebDistribution({ rootDir, release: { version: '1.1.2' } }), /missing website evidence and checked-in online version is stale/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('missing public web evidence rejects a version-only manifest or undeclared files', async () => {
  const { importWebDistribution } = await loadImporter();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-picker-import-'));
  const appRoot = path.join(rootDir, 'public/products/leke-picker/app');
  await mkdir(appRoot, { recursive: true });
  await writeFile(path.join(appRoot, 'distribution-manifest.json'), JSON.stringify({
    version: '1.1.1', sourceCommit: 'e022d29be11aa69fa786f6fc17ec8547043c7dcc',
  }));
  try {
    await assert.rejects(importWebDistribution({ rootDir, release: { version: '1.1.1' } }), /missing website evidence and checked-in online version is stale/);

    const fixture = evidence();
    for (const [filePath, bytes] of fixture.files) {
      await mkdir(path.dirname(path.join(appRoot, filePath)), { recursive: true });
      await writeFile(path.join(appRoot, filePath), bytes);
    }
    await writeFile(path.join(appRoot, 'distribution-manifest.json'), fixture.manifestBytes);
    await writeFile(path.join(appRoot, 'undeclared.js'), 'unexpected');
    await assert.rejects(importWebDistribution({ rootDir, release: { version: '1.1.1' } }), /missing website evidence and checked-in online version is stale/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('same remote manifest replaces a current directory that contains an undeclared file', async () => {
  const { importWebDistribution } = await loadImporter();
  const fixture = evidence();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-picker-import-'));
  const appRoot = path.join(rootDir, 'public/products/leke-picker/app');
  for (const [filePath, bytes] of fixture.files) {
    await mkdir(path.dirname(path.join(appRoot, filePath)), { recursive: true });
    await writeFile(path.join(appRoot, filePath), bytes);
  }
  await writeFile(path.join(appRoot, 'distribution-manifest.json'), fixture.manifestBytes);
  await writeFile(path.join(appRoot, 'stale-bundle.js'), 'stale');
  try {
    const result = await importWebDistribution({
      rootDir,
      release: fixture.release,
      fetchImpl: async (url) => new Response(url === fixture.release.web.manifest.url ? fixture.manifestBytes : fixture.archive),
    });
    assert.equal(result.changed, true);
    assert.equal(existsSync(path.join(appRoot, 'stale-bundle.js')), false);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('compressed distributions are bounded before unbounded inflation', async () => {
  const { parseTarGzip } = await loadImporter();
  const compressedBomb = gzipSync(Buffer.alloc(73 * 1024 * 1024));
  assert.throws(() => parseTarGzip(compressedBomb), /archive exceeds the decompressed size limit/);
});
