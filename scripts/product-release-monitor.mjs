import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const POLICIES = {
  'leke-picker': {
    repository: 'lekeopen/leke-picker',
    assets: {
      'windows-modern-x64': (version) => `leke-picker_${version}_x64-setup.exe`,
      'windows-7-x64': () => 'leke-picker-Win7-x64-Offline.exe',
      'windows-7-x86': () => 'leke-picker-Win7-x86-Offline.exe',
    },
  },
  guigelei: {
    repository: 'lekeopen/guigelei-releases',
    assets: { 'macos-arm64': (version) => `guigelei-${version}-arm64.dmg` },
  },
};

const semverPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function fail(message) {
  throw new Error(`Product release validation failed: ${message}`);
}

function parseVersion(tag) {
  const match = semverPattern.exec(tag);
  if (!match) fail('tag must use vMAJOR.MINOR.PATCH');
  return { version: match.slice(1).join('.'), parts: match.slice(1).map(Number) };
}

function compare(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function validateAsset(slug, policy, release, id, name) {
  const matches = release.assets.filter((asset) => asset.name === name);
  if (matches.length !== 1) fail(`${slug}/${id}: expected exactly one asset`);
  const asset = matches[0];
  if (asset.state !== 'uploaded') fail(`${slug}/${id}: asset is not uploaded`);
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0) fail(`${slug}/${id}: invalid asset size`);
  const digest = /^sha256:([a-f0-9]{64})$/.exec(asset.digest ?? '');
  if (!digest) fail(`${slug}/${id}: missing or invalid SHA-256 digest`);
  const expectedUrl = `https://github.com/${policy.repository}/releases/download/${release.tag_name}/${encodeURIComponent(name)}`;
  if (asset.browser_download_url !== expectedUrl) fail(`${slug}/${id}: download URL does not match repository, tag, and asset`);
  return { name, url: expectedUrl, sha256: digest[1], sizeBytes: asset.size };
}

function validateInheritedAsset(policy, currentTag, nextTag, id, expectedName, inherited) {
  if (inherited?.name !== expectedName) fail(`leke-picker/${id}: inherited asset name does not match policy`);
  if (!/^[a-f0-9]{64}$/.test(inherited.sha256 ?? '')) fail(`leke-picker/${id}: inherited SHA-256 is invalid`);
  if (!Number.isSafeInteger(inherited.sizeBytes) || inherited.sizeBytes <= 0) fail(`leke-picker/${id}: inherited asset size is invalid`);

  let inheritedTag;
  try {
    const url = new URL(inherited.url);
    const prefix = `/${policy.repository}/releases/download/`;
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith(prefix)) throw new Error('invalid origin');
    const suffix = url.pathname.slice(prefix.length);
    const separator = suffix.indexOf('/');
    if (separator <= 0 || decodeURIComponent(suffix.slice(separator + 1)) !== expectedName || url.search || url.hash) throw new Error('invalid path');
    inheritedTag = suffix.slice(0, separator);
  } catch {
    fail(`leke-picker/${id}: inherited download URL does not match repository, tag, and asset`);
  }

  const inheritedVersion = parseVersion(inheritedTag);
  const currentVersion = parseVersion(currentTag);
  const nextVersion = parseVersion(nextTag);
  if (compare(inheritedVersion.parts, currentVersion.parts) > 0 || compare(inheritedVersion.parts, nextVersion.parts) > 0) {
    fail(`leke-picker/${id}: inherited asset tag is newer than the known release`);
  }
  return { name: expectedName, url: inherited.url, sha256: inherited.sha256, sizeBytes: inherited.sizeBytes };
}

async function validateManifestRelease(policy, release, version, fetchImpl) {
  if (!release.assets.some(({ name }) => name === 'release-manifest.json')) fail('guigelei: release-manifest.json is missing');
  if (!release.assets.some(({ name }) => name === 'SHA256SUMS')) fail('guigelei: SHA256SUMS is missing');
  const manifestAsset = validateAsset('guigelei', policy, release, 'manifest', 'release-manifest.json');
  validateAsset('guigelei', policy, release, 'checksums', 'SHA256SUMS');
  const manifestResponse = await fetchImpl(manifestAsset.url);
  if (!manifestResponse.ok) fail('guigelei: release-manifest.json is not accessible');
  const manifestBytes = Buffer.from(await manifestResponse.arrayBuffer());
  if (manifestBytes.length !== manifestAsset.sizeBytes || createHash('sha256').update(manifestBytes).digest('hex') !== manifestAsset.sha256) {
    fail('guigelei: release-manifest evidence size or SHA-256 mismatch');
  }
  let manifest;
  try { manifest = JSON.parse(manifestBytes.toString('utf8')); } catch { fail('guigelei: release-manifest.json is invalid JSON'); }
  if (manifest?.schemaVersion !== 1 || manifest.product !== 'guigelei' || manifest.tag !== release.tag_name || manifest.version !== version) {
    fail('guigelei: release-manifest.json identity does not match the release');
  }
  if (!manifest.minimumSystems || typeof manifest.minimumSystems !== 'object' || !Array.isArray(manifest.downloads) || manifest.downloads.length === 0) {
    fail('guigelei: release-manifest.json structure is invalid');
  }
  const allowed = new Map([['macos-arm64', ['macos', 'arm64']], ['windows-x64', ['windows', 'x64']]]);
  const assets = {};
  const names = new Set(['release-manifest.json', 'SHA256SUMS']);
  for (const item of manifest.downloads) {
    const pair = allowed.get(item?.id);
    if (!pair || item.platform !== pair[0] || item.architecture !== pair[1]) fail('guigelei: manifest platform is unsupported');
    if (assets[item.id] || names.has(item.asset)) fail('guigelei: manifest contains duplicate downloads');
    if (!/^[a-f0-9]{64}$/.test(item.sha256) || !Number.isSafeInteger(item.sizeBytes) || item.sizeBytes <= 0) fail('guigelei: manifest digest or size is invalid');
    const asset = validateAsset('guigelei', policy, release, item.id, item.asset);
    if (asset.sha256 !== item.sha256 || asset.sizeBytes !== item.sizeBytes) fail(`guigelei/${item.id}: manifest evidence mismatch`);
    if (typeof manifest.minimumSystems[item.platform] !== 'string' || !manifest.minimumSystems[item.platform]) fail(`guigelei: missing system requirement for ${item.platform}`);
    assets[item.id] = asset;
    names.add(item.asset);
  }
  if (release.assets.some((asset) => !names.has(asset.name))) fail('guigelei: release contains an undeclared asset');
  const sumsAsset = release.assets.find(({ name }) => name === 'SHA256SUMS');
  const sumsEvidence = validateAsset('guigelei', policy, release, 'checksums', 'SHA256SUMS');
  const sumsResponse = await fetchImpl(sumsAsset.browser_download_url);
  if (!sumsResponse.ok) fail('guigelei: SHA256SUMS is not accessible');
  const sumsBytes = Buffer.from(await sumsResponse.arrayBuffer());
  if (sumsBytes.length !== sumsEvidence.sizeBytes || createHash('sha256').update(sumsBytes).digest('hex') !== sumsEvidence.sha256) {
    fail('guigelei: SHA256SUMS evidence size or SHA-256 mismatch');
  }
  const expectedSums = manifest.downloads.map((item) => `${item.sha256}  ${item.asset}`).join('\n') + '\n';
  if (sumsBytes.toString('utf8') !== expectedSums) fail('guigelei: SHA256SUMS does not match the manifest');
  return { assets, minimumSystems: manifest.minimumSystems };
}

async function validatePickerWebRelease(policy, release, version, fetchImpl) {
  const archiveName = `leke-picker-web_${version}.tar.gz`;
  const manifestName = `leke-picker-web_${version}.manifest.json`;
  const archive = validateAsset('leke-picker', policy, release, 'web-archive', archiveName);
  const manifestAsset = validateAsset('leke-picker', policy, release, 'web-manifest', manifestName);
  const response = await fetchImpl(manifestAsset.url);
  if (!response.ok) fail('leke-picker: website manifest is not accessible');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== manifestAsset.sizeBytes || createHash('sha256').update(bytes).digest('hex') !== manifestAsset.sha256) {
    fail('leke-picker: website manifest evidence size or SHA-256 mismatch');
  }
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); } catch { fail('leke-picker: website manifest is invalid JSON'); }
  if (manifest?.schemaVersion !== 1 || manifest.product !== 'leke-picker' || manifest.version !== version
    || manifest.sourceDirty !== false || !/^[a-f0-9]{40}$/.test(manifest.sourceCommit ?? '')
    || manifest.base !== '/products/leke-picker/app/') {
    fail('leke-picker: website manifest identity is invalid');
  }
  if (manifest.archive?.name !== archive.name || manifest.archive?.sizeBytes !== archive.sizeBytes || manifest.archive?.sha256 !== archive.sha256) {
    fail('leke-picker: website archive evidence does not match manifest');
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) fail('leke-picker: website manifest files are missing');
  const paths = new Set();
  for (const item of manifest.files) {
    if (typeof item?.path !== 'string' || item.path.length === 0 || item.path.includes('\\') || item.path.startsWith('/')
      || item.path.split('/').includes('..') || paths.has(item.path)
      || !Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 0 || !/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) {
      fail('leke-picker: website manifest file evidence is invalid');
    }
    paths.add(item.path);
  }
  return { archive, manifest: manifestAsset, sourceCommit: manifest.sourceCommit, base: manifest.base };
}

async function validateRelease(slug, current, release, fetchImpl) {
  const policy = POLICIES[slug];
  if (!policy || current.repository !== policy.repository) fail(`${slug}: repository is not locked`);
  if (!release || typeof release !== 'object') fail(`${slug}: missing release response`);
  if (release.draft || release.prerelease) return null;
  if (typeof release.published_at !== 'string' || !Number.isFinite(Date.parse(release.published_at))) fail(`${slug}: invalid publication time`);

  const next = parseVersion(release.tag_name);
  const previous = parseVersion(current.tag);
  const versionComparison = compare(next.parts, previous.parts);
  if (versionComparison < 0) return null;
  if (versionComparison === 0 && slug !== 'leke-picker') return null;
  const expectedReleaseUrl = `https://github.com/${policy.repository}/releases/tag/${release.tag_name}`;
  if (release.html_url !== expectedReleaseUrl) fail(`${slug}: release URL does not match repository and tag`);
  if (!Array.isArray(release.assets)) fail(`${slug}: assets must be an array`);

  const pickerWebNames = slug === 'leke-picker'
    ? new Set([`leke-picker-web_${next.version}.tar.gz`, `leke-picker-web_${next.version}.manifest.json`])
    : new Set();
  const pickerWebCount = release.assets.filter((asset) => pickerWebNames.has(asset?.name)).length;
  if (slug === 'leke-picker' && pickerWebCount !== 0 && pickerWebCount !== 2) fail('leke-picker: website distribution assets are incomplete');
  if (versionComparison === 0) {
    if (current.web || pickerWebCount === 0) return null;
    const web = await validatePickerWebRelease(policy, release, next.version, fetchImpl);
    return { ...current, web };
  }

  if (slug === 'guigelei' && compare(next.parts, [1, 6, 0]) > 0) {
    const validated = await validateManifestRelease(policy, release, next.version, fetchImpl);
    return {
      repository: policy.repository,
      tag: release.tag_name,
      version: next.version,
      publishedAt: release.published_at,
      releaseUrl: expectedReleaseUrl,
      minimumSystems: validated.minimumSystems,
      assets: validated.assets,
    };
  }

  const expectedNames = Object.fromEntries(Object.entries(policy.assets).map(([id, buildName]) => [id, buildName(next.version)]));
  const expectedNameSet = new Set(Object.values(expectedNames));
  const binaryAssets = release.assets.filter((asset) => !/^SHA256SUMS(?:\.txt)?$/i.test(asset?.name ?? '') && !pickerWebNames.has(asset?.name));
  const requiredIds = slug === 'leke-picker' ? ['windows-modern-x64'] : Object.keys(expectedNames);
  const requiredNames = new Set(requiredIds.map((id) => expectedNames[id]));
  if (binaryAssets.some((asset) => !expectedNameSet.has(asset?.name)) || [...requiredNames].some((name) => !binaryAssets.some((asset) => asset.name === name))) {
    fail(`${slug}: release asset set does not match the locked platforms`);
  }

  const assets = {};
  for (const [id, name] of Object.entries(expectedNames)) {
    const matches = binaryAssets.filter((asset) => asset.name === name);
    if (matches.length === 0 && slug === 'leke-picker' && id.startsWith('windows-7-')) {
      const inherited = current.assets?.[id];
      if (!inherited) fail(`${slug}/${id}: missing inherited compatibility asset`);
      assets[id] = validateInheritedAsset(policy, current.tag, release.tag_name, id, name, inherited);
      continue;
    }
    if (matches.length !== 1) fail(`${slug}/${id}: expected exactly one asset`);
    const asset = matches[0];
    if (asset.state !== 'uploaded') fail(`${slug}/${id}: asset is not uploaded`);
    if (!Number.isSafeInteger(asset.size) || asset.size <= 0) fail(`${slug}/${id}: invalid asset size`);
    const digest = /^sha256:([a-f0-9]{64})$/.exec(asset.digest ?? '');
    if (!digest) fail(`${slug}/${id}: missing or invalid SHA-256 digest`);
    const expectedUrl = `https://github.com/${policy.repository}/releases/download/${release.tag_name}/${encodeURIComponent(name)}`;
    if (asset.browser_download_url !== expectedUrl) fail(`${slug}/${id}: download URL does not match repository, tag, and asset`);
    assets[id] = { name, url: expectedUrl, sha256: digest[1], sizeBytes: asset.size };
  }

  const web = pickerWebCount === 2 ? await validatePickerWebRelease(policy, release, next.version, fetchImpl) : undefined;
  if (!web && slug === 'leke-picker' && compare(next.parts, [1, 1, 1]) > 0) fail('leke-picker: website distribution assets are required');
  return {
    repository: policy.repository,
    tag: release.tag_name,
    version: next.version,
    publishedAt: release.published_at,
    releaseUrl: expectedReleaseUrl,
    assets,
    ...(web ? { web } : {}),
  };
}

export async function checkProductReleases({ rootDir = process.cwd(), fetchImpl = fetch } = {}) {
  const releasePath = path.join(rootDir, 'src/products/releases.json');
  const before = await readFile(releasePath, 'utf8');
  const data = JSON.parse(before);
  const updates = [];

  for (const slug of Object.keys(POLICIES)) {
    const current = data[slug];
    if (!current) fail(`${slug}: current release data is missing`);
    const response = await fetchImpl(`https://api.github.com/repos/${POLICIES[slug].repository}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (!response.ok) fail(`${slug}: GitHub API returned HTTP ${response.status}`);
    const candidate = await validateRelease(slug, current, await response.json(), fetchImpl);
    if (!candidate) continue;
    const previousReleases = Array.isArray(current.releases) ? current.releases : [{
      repository: current.repository, tag: current.tag, version: current.version,
      publishedAt: current.publishedAt, releaseUrl: current.releaseUrl,
      ...(current.minimumSystems ? { minimumSystems: current.minimumSystems } : {}), assets: current.assets,
    }];
    data[slug] = { ...candidate, releases: [candidate, ...previousReleases.filter((item) => item.tag !== candidate.tag)].slice(0, 10) };
    updates.push({ slug, from: current.version, to: candidate.version });
  }

  const after = `${JSON.stringify(data, null, 2)}\n`;
  if (after === before) return { changed: false, updates: [] };
  const temporaryPath = `${releasePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporaryPath, after, { flag: 'wx' });
    await rename(temporaryPath, releasePath);
  } finally {
    await unlink(temporaryPath).catch((error) => {
      if (error?.code !== 'ENOENT') throw error;
    });
  }
  return { changed: true, updates };
}

async function main() {
  const result = await checkProductReleases({ rootDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') });
  if (!result.changed) {
    console.log('Product releases are current; no changes.');
    return;
  }
  console.log(`Updated product releases: ${result.updates.map((item) => `${item.slug} ${item.from} -> ${item.to}`).join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Product release monitor failed');
    process.exitCode = 1;
  });
}
