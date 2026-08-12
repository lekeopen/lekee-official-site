import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
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

function validateRelease(slug, current, release) {
  const policy = POLICIES[slug];
  if (!policy || current.repository !== policy.repository) fail(`${slug}: repository is not locked`);
  if (!release || typeof release !== 'object') fail(`${slug}: missing release response`);
  if (release.draft || release.prerelease) return null;
  if (typeof release.published_at !== 'string' || !Number.isFinite(Date.parse(release.published_at))) fail(`${slug}: invalid publication time`);

  const next = parseVersion(release.tag_name);
  const previous = parseVersion(current.tag);
  if (compare(next.parts, previous.parts) <= 0) return null;
  const expectedReleaseUrl = `https://github.com/${policy.repository}/releases/tag/${release.tag_name}`;
  if (release.html_url !== expectedReleaseUrl) fail(`${slug}: release URL does not match repository and tag`);
  if (!Array.isArray(release.assets)) fail(`${slug}: assets must be an array`);

  const expectedNames = Object.fromEntries(Object.entries(policy.assets).map(([id, buildName]) => [id, buildName(next.version)]));
  const expectedNameSet = new Set(Object.values(expectedNames));
  const binaryAssets = release.assets.filter((asset) => !/^SHA256SUMS(?:\.txt)?$/i.test(asset?.name ?? ''));
  if (binaryAssets.length !== expectedNameSet.size || binaryAssets.some((asset) => !expectedNameSet.has(asset?.name))) {
    fail(`${slug}: release asset set does not match the locked platforms`);
  }

  const assets = {};
  for (const [id, name] of Object.entries(expectedNames)) {
    const matches = binaryAssets.filter((asset) => asset.name === name);
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

  return {
    repository: policy.repository,
    tag: release.tag_name,
    version: next.version,
    publishedAt: release.published_at,
    releaseUrl: expectedReleaseUrl,
    assets,
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
    const candidate = validateRelease(slug, current, await response.json());
    if (!candidate) continue;
    data[slug] = candidate;
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
