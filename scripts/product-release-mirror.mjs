import path from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function cleanBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('OSS public base URL must be a clean HTTPS origin');
  }
  return url.href.replace(/\/$/, '');
}

export function buildMirrorPlan(releases, { publicBaseUrl }) {
  const baseUrl = cleanBaseUrl(publicBaseUrl);
  const plan = [];
  for (const [slug, release] of Object.entries(releases)) {
    if (!/^\d+\.\d+\.\d+$/.test(release?.version ?? '')) throw new Error(`${slug}: invalid version`);
    for (const [assetId, asset] of Object.entries(release.assets ?? {})) {
      if (!/^[a-f0-9]{64}$/.test(asset?.sha256 ?? '') || !Number.isSafeInteger(asset?.sizeBytes) || asset.sizeBytes <= 0) {
        throw new Error(`${slug}/${assetId}: incomplete release evidence`);
      }
      if (path.posix.basename(asset.name) !== asset.name) throw new Error(`${slug}/${assetId}: unsafe asset name`);
      const objectKey = `${slug}/${release.version}/${asset.name}`;
      plan.push({
        slug,
        version: release.version,
        assetId,
        name: asset.name,
        sizeBytes: asset.sizeBytes,
        sha256: asset.sha256,
        sourceUrl: asset.url,
        objectKey,
        domesticUrl: `${baseUrl}/${objectKey.split('/').map(encodeURIComponent).join('/')}`,
      });
    }
  }
  return plan;
}

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function createOssAdapter({ endpoint, bucket, accessKeyId, accessKeySecret, fetchImpl = fetch }) {
  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== 'https:' || endpointUrl.pathname !== '/' || endpointUrl.search || endpointUrl.hash) throw new Error('Invalid OSS endpoint');
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(bucket)) throw new Error('Invalid OSS bucket');
  const request = async (method, item, body) => {
    const date = new Date().toUTCString();
    const meta = method === 'PUT' ? `x-oss-meta-sha256:${item.sha256}\n` : '';
    const resource = `/${bucket}/${item.objectKey}`;
    const signature = createHmac('sha1', accessKeySecret).update(`${method}\n\n\n${date}\n${meta}${resource}`).digest('base64');
    const headers = { Date: date, Authorization: `OSS ${accessKeyId}:${signature}` };
    if (method === 'PUT') headers['x-oss-meta-sha256'] = item.sha256;
    const url = new URL(item.objectKey.split('/').map(encodeURIComponent).join('/'), `https://${bucket}.${endpointUrl.host}/`);
    return fetchImpl(url, { method, headers, ...(body ? { body } : {}) });
  };
  return {
    async inspect(item) {
      const response = await request('HEAD', item);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`${item.objectKey}: OSS HEAD failed`);
      return { sha256: response.headers.get('x-oss-meta-sha256'), sizeBytes: Number(response.headers.get('content-length')) };
    },
    async upload(item, bytes) {
      const response = await request('PUT', item, bytes);
      if (!response.ok) throw new Error(`${item.objectKey}: OSS upload failed`);
    },
    async read(item) {
      const response = await request('GET', item);
      if (!response.ok) throw new Error(`${item.objectKey}: OSS read-back failed`);
      return Buffer.from(await response.arrayBuffer());
    },
  };
}

export async function mirrorReleaseAssets(releases, { publicBaseUrl, dryRun = false, fetchImpl = fetch, oss }) {
  const plan = buildMirrorPlan(releases, { publicBaseUrl });
  if (dryRun) return { mode: 'dry-run', items: plan.map((item) => ({ ...item, status: 'planned' })) };
  if (!oss?.inspect) throw new Error('OSS adapter is incomplete');
  const items = [];
  for (const item of plan) {
    const existing = await oss.inspect(item);
    if (existing) {
      if (existing.sha256 !== item.sha256 || existing.sizeBytes !== item.sizeBytes) {
        throw new Error(`${item.objectKey}: refusing to overwrite an object with different evidence`);
      }
      if (!oss.read) throw new Error('OSS adapter is incomplete');
      const readBack = Buffer.from(await oss.read(item));
      if (readBack.length !== item.sizeBytes || digest(readBack) !== item.sha256) throw new Error(`${item.objectKey}: OSS read-back verification failed`);
      items.push({ ...item, status: 'verified-existing' });
      continue;
    }
    const response = await fetchImpl(item.sourceUrl);
    if (!response?.ok) throw new Error(`${item.objectKey}: source download failed`);
    const source = Buffer.from(await response.arrayBuffer());
    if (source.length !== item.sizeBytes || digest(source) !== item.sha256) throw new Error(`${item.objectKey}: source SHA-256 verification failed`);
    if (!oss.upload || !oss.read) throw new Error('OSS adapter is incomplete');
    await oss.upload(item, source);
    const readBack = Buffer.from(await oss.read(item));
    if (readBack.length !== item.sizeBytes || digest(readBack) !== item.sha256) throw new Error(`${item.objectKey}: OSS read-back verification failed`);
    items.push({ ...item, status: 'uploaded' });
  }
  return { mode: 'execute', items };
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const releases = JSON.parse(await readFile(path.join(rootDir, 'src/products/releases.json'), 'utf8'));
  const execute = process.argv.includes('--execute');
  const required = ['ALIYUN_OSS_ACCESS_KEY_ID', 'ALIYUN_OSS_ACCESS_KEY_SECRET'];
  if (execute && required.some((name) => !process.env[name])) throw new Error('Execute mode requires OSS credentials');
  const result = await mirrorReleaseAssets(releases, {
    publicBaseUrl: process.env.OSS_PUBLIC_BASE_URL ?? 'https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com',
    dryRun: !execute,
    ...(execute ? { oss: createOssAdapter({
      endpoint: process.env.OSS_ENDPOINT ?? 'https://oss-cn-beijing.aliyuncs.com',
      bucket: process.env.OSS_BUCKET ?? 'lekeopen-downloads',
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
    }) } : {}),
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Product release mirror failed');
    process.exitCode = 1;
  });
}
