import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const BASE = '/products/leke-picker/app/';
const MAX_EXPANDED_BYTES = 64 * 1024 * 1024;
const MAX_TAR_BYTES = MAX_EXPANDED_BYTES + 8 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 16 * 1024 * 1024;
const FORBIDDEN_TEXT_PATTERN = /clarity\.ms|uupelkp00u|(?:\/Users\/|\/private\/|\/Volumes\/|[A-Za-z]:\\Users\\)/u;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function readTarString(header, offset, length) {
  return header.subarray(offset, offset + length).toString('utf8').replace(/\0.*$/u, '').trim();
}

function readTarOctal(header, offset, length) {
  const value = readTarString(header, offset, length);
  if (!/^[0-7]+$/u.test(value)) throw new Error('archive contains an invalid octal field');
  return Number.parseInt(value, 8);
}

function isSafeRelativePath(filePath) {
  return typeof filePath === 'string'
    && filePath.length > 0
    && !filePath.includes('\\')
    && !path.posix.isAbsolute(filePath)
    && path.posix.normalize(filePath) === filePath
    && !filePath.split('/').includes('..');
}

export function parseTarGzip(archiveBytes) {
  if (!Buffer.isBuffer(archiveBytes) || archiveBytes.length > MAX_ARCHIVE_BYTES) throw new Error('archive exceeds the compressed size limit');
  let tarBytes;
  try {
    tarBytes = gunzipSync(archiveBytes, { maxOutputLength: MAX_TAR_BYTES });
  } catch (error) {
    if (error?.code === 'ERR_BUFFER_TOO_LARGE' || /larger than|output length|buffer too large/iu.test(error?.message ?? '')) {
      throw new Error('archive exceeds the decompressed size limit');
    }
    throw error;
  }
  const files = new Map();
  let offset = 0;
  let expandedBytes = 0;

  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;

    const storedChecksum = readTarOctal(header, 148, 8);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    const actualChecksum = [...checksumHeader].reduce((sum, byte) => sum + byte, 0);
    if (storedChecksum !== actualChecksum) throw new Error('archive header checksum is invalid');

    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const filePath = prefix ? `${prefix}/${name}` : name;
    if (!isSafeRelativePath(filePath)) throw new Error('archive contains an unsafe archive path');

    const type = String.fromCharCode(header[156] || 0);
    if (type !== '\0' && type !== '0') throw new Error('archive must contain regular files only');
    const size = readTarOctal(header, 124, 12);
    if (!Number.isSafeInteger(size) || size < 0) throw new Error('archive contains an invalid file size');
    expandedBytes += size;
    if (expandedBytes > MAX_EXPANDED_BYTES) throw new Error('archive exceeds the expanded size limit');

    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tarBytes.length) throw new Error('archive file extends beyond archive bytes');
    if (files.has(filePath)) throw new Error(`archive contains duplicate file ${filePath}`);
    files.set(filePath, Buffer.from(tarBytes.subarray(dataStart, dataEnd)));
    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  if (files.size === 0) throw new Error('archive contains no files');
  return files;
}

export function validateWebDistributionManifest(manifest, release, files) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return ['manifest must be an object'];
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (manifest.product !== 'leke-picker') errors.push('product must be leke-picker');
  if (manifest.version !== release.version) errors.push('manifest version does not match release');
  if (!COMMIT_PATTERN.test(manifest.sourceCommit ?? '')) errors.push('sourceCommit is invalid');
  if (manifest.sourceDirty !== false) errors.push('sourceDirty must be false');
  if (manifest.base !== BASE) errors.push('manifest base is invalid');
  if (manifest.archive?.name !== release.web?.archive?.name
    || manifest.archive?.sizeBytes !== release.web?.archive?.sizeBytes
    || manifest.archive?.sha256 !== release.web?.archive?.sha256) {
    errors.push('manifest archive evidence does not match release');
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) return [...errors, 'manifest files must be a non-empty array'];
  const declared = new Set();
  for (const item of manifest.files) {
    if (!isSafeRelativePath(item?.path)) {
      errors.push('manifest contains an unsafe file path');
      continue;
    }
    if (declared.has(item.path)) {
      errors.push(`manifest contains duplicate file ${item.path}`);
      continue;
    }
    declared.add(item.path);
    if (!Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 0 || !SHA256_PATTERN.test(item.sha256 ?? '')) {
      errors.push(`${item.path} contains invalid file evidence`);
      continue;
    }
    const bytes = files.get(item.path);
    if (!bytes) errors.push(`${item.path} is missing from archive`);
    else if (bytes.length !== item.sizeBytes) errors.push(`${item.path} size does not match manifest`);
    else if (sha256(bytes) !== item.sha256) errors.push(`${item.path} SHA-256 does not match manifest`);
  }
  for (const filePath of files.keys()) if (!declared.has(filePath)) errors.push(`${filePath} is not declared in manifest`);

  const index = files.get('index.html')?.toString('utf8') ?? '';
  if (!index.includes('<meta name="robots" content="noindex, nofollow" />')) errors.push('index.html must declare noindex, nofollow');
  if (!index.includes(BASE)) errors.push('index.html must use the website product base');
  for (const [filePath, bytes] of files) {
    if (/\.(?:css|html|js|json|svg|txt|xml)$/u.test(filePath) && FORBIDDEN_TEXT_PATTERN.test(bytes.toString('utf8'))) {
      errors.push('distribution text contains a forbidden local path or telemetry marker');
      break;
    }
  }
  return errors;
}

function verifyReleaseAsset(bytes, asset, label) {
  if (!asset || !Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes <= 0 || !SHA256_PATTERN.test(asset.sha256 ?? '')) {
    throw new Error(`${label} release evidence is invalid`);
  }
  if (bytes.length !== asset.sizeBytes) throw new Error(`${label} size does not match release evidence`);
  if (sha256(bytes) !== asset.sha256) throw new Error(`${label} SHA-256 does not match release evidence`);
}

async function fetchBytes(fetchImpl, asset, label) {
  const response = await fetchImpl(asset.url);
  if (!response?.ok) throw new Error(`${label} download failed`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verifyReleaseAsset(bytes, asset, label);
  return bytes;
}

async function readStoredDistribution(appRoot) {
  const manifest = JSON.parse(await readFile(path.join(appRoot, 'distribution-manifest.json'), 'utf8'));
  if (manifest?.schemaVersion !== 1 || manifest.product !== 'leke-picker'
    || typeof manifest.version !== 'string' || !COMMIT_PATTERN.test(manifest.sourceCommit ?? '')
    || manifest.sourceDirty !== false || manifest.base !== BASE
    || manifest.archive?.name !== `leke-picker-web_${manifest.version}.tar.gz`
    || !Number.isSafeInteger(manifest.archive?.sizeBytes) || manifest.archive.sizeBytes <= 0
    || !SHA256_PATTERN.test(manifest.archive?.sha256 ?? '')) {
    throw new Error('stored distribution manifest identity is invalid');
  }

  const files = new Map();
  async function visit(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink()) throw new Error('stored distribution must not contain symbolic links');
      if (stats.isDirectory()) await visit(absolutePath, relativePath);
      else if (stats.isFile() && relativePath !== 'distribution-manifest.json') files.set(relativePath, await readFile(absolutePath));
      else if (!stats.isFile()) throw new Error('stored distribution must contain regular files only');
    }
  }
  await visit(appRoot);
  const totalBytes = [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0);
  if (totalBytes > MAX_EXPANDED_BYTES) throw new Error('stored distribution exceeds the expanded size limit');
  const release = { version: manifest.version, web: { archive: manifest.archive } };
  const errors = validateWebDistributionManifest(manifest, release, files);
  if (errors.length > 0) throw new Error(`stored distribution validation failed: ${errors.join('; ')}`);
  return manifest;
}

async function currentDistributionMatches(appRoot, manifest) {
  try {
    const current = await readStoredDistribution(appRoot);
    return JSON.stringify(current) === JSON.stringify(manifest);
  } catch {
    return false;
  }
}

async function writeStagedDistribution(stagingRoot, manifest, files) {
  for (const [filePath, bytes] of files) {
    const destination = path.join(stagingRoot, ...filePath.split('/'));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes, { flag: 'wx' });
  }
  await writeFile(path.join(stagingRoot, 'distribution-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
}

export async function importWebDistribution({ rootDir = process.cwd(), release, fetchImpl = fetch } = {}) {
  if (!release?.web?.manifest || !release?.web?.archive) {
    try {
      const current = await readStoredDistribution(path.join(rootDir, 'public/products/leke-picker/app'));
      if (current.version === release?.version) {
        return { changed: false, version: current.version, sourceCommit: current.sourceCommit };
      }
    } catch {
      // The explicit stale/missing error below is the fail-closed result.
    }
    throw new Error('release is missing website evidence and checked-in online version is stale');
  }
  const manifestBytes = await fetchBytes(fetchImpl, release.web.manifest, 'manifest');
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new Error('manifest is invalid JSON');
  }
  const archiveBytes = await fetchBytes(fetchImpl, release.web.archive, 'archive');
  const files = parseTarGzip(archiveBytes);
  const errors = validateWebDistributionManifest(manifest, release, files);
  if (errors.length > 0) throw new Error(`website distribution validation failed: ${errors.join('; ')}`);

  const appParent = path.join(rootDir, 'public', 'products', 'leke-picker');
  const appRoot = path.join(appParent, 'app');
  if (await currentDistributionMatches(appRoot, manifest)) {
    return { changed: false, version: manifest.version, sourceCommit: manifest.sourceCommit };
  }

  await mkdir(appParent, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(appParent, '.app-import-'));
  const backupRoot = path.join(appParent, `.app-backup-${randomUUID()}`);
  let movedExisting = false;
  try {
    await writeStagedDistribution(stagingRoot, manifest, files);
    if (existsSync(appRoot)) {
      await rename(appRoot, backupRoot);
      movedExisting = true;
    }
    try {
      await rename(stagingRoot, appRoot);
    } catch (error) {
      if (movedExisting) await rename(backupRoot, appRoot);
      throw error;
    }
    if (movedExisting) await rm(backupRoot, { recursive: true, force: true });
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }
  return { changed: true, version: manifest.version, sourceCommit: manifest.sourceCommit };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const releases = JSON.parse(await readFile(path.join(rootDir, 'src/products/releases.json'), 'utf8'));
  const result = await importWebDistribution({ rootDir, release: releases['leke-picker'] });
  console.log(result.changed ? `Imported leke-picker web v${result.version}` : `leke-picker web v${result.version} is current`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'website distribution import failed');
    process.exitCode = 1;
  });
}
