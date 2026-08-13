export interface ReleaseStatsInput {
  owner: string;
  repo: string;
  tag: string;
  allowedAssets: string[];
}

export interface ReleaseDownloadStats {
  total: number;
  assets: { name: string; downloadCount: number }[];
  fetchedAt: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface GitHubReleaseAsset {
  name?: unknown;
  download_count?: unknown;
}

interface GitHubReleaseResponse {
  tag_name?: unknown;
  assets?: unknown;
}

const unavailable = () => new Error('Download statistics unavailable');

export async function fetchReleaseDownloadStats(
  input: ReleaseStatsInput,
  fetchImpl: FetchLike = fetch,
  externalSignal?: AbortSignal,
): Promise<ReleaseDownloadStats> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 5000);
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromCaller();
  else externalSignal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/releases/tags/${encodeURIComponent(input.tag)}`;
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (!response.ok) throw unavailable();

    const release = await response.json() as GitHubReleaseResponse;
    if (release.tag_name !== input.tag || !Array.isArray(release.assets)) throw unavailable();

    const assets = input.allowedAssets.map((allowedName) => {
      const matches = (release.assets as GitHubReleaseAsset[]).filter((asset) => asset.name === allowedName);
      if (matches.length !== 1) throw unavailable();
      const count = matches[0].download_count;
      if (!Number.isSafeInteger(count) || (count as number) < 0) throw unavailable();
      return { name: allowedName, downloadCount: count as number };
    });

    return {
      total: assets.reduce((sum, asset) => sum + asset.downloadCount, 0),
      assets,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    throw unavailable();
  } finally {
    globalThis.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}
