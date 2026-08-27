import releases from './release-data.generated.mjs';

export function findDownloadAsset(product, assetId) {
  if (typeof product !== 'string' || typeof assetId !== 'string') return null;
  const release = releases[product];
  const asset = release?.assets?.[assetId];
  if (!release || !asset) return null;
  if (!/^\d+\.\d+\.\d+$/.test(release.version)) return null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(product) || !/^[a-z0-9][a-z0-9-]*$/.test(assetId)) return null;
  if (!/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes <= 0) return null;
  if (asset.name.includes('/') || asset.name.includes('\\')) return null;
  let fallbackUrl;
  try {
    fallbackUrl = new URL(asset.url);
  } catch {
    return null;
  }
  const expectedPath = `/${release.repository}/releases/download/${release.tag}/${encodeURIComponent(asset.name)}`;
  if (fallbackUrl.protocol !== 'https:' || fallbackUrl.hostname !== 'github.com'
      || fallbackUrl.pathname !== expectedPath || fallbackUrl.search || fallbackUrl.hash) return null;
  const pathname = `/${[product, release.version, asset.name].map(encodeURIComponent).join('/')}`;
  return { product, assetId, version: release.version, name: asset.name, pathname,
    fallbackUrl: fallbackUrl.href, sha256: asset.sha256, sizeBytes: asset.sizeBytes };
}
