import { findDownloadAsset } from '../download/catalog.mjs';
import { checkDownloadRateLimit, hashClientIp } from '../download/security.mjs';
import { createCdnSignedUrl } from '../download/signing.mjs';

const json = (status, code, extraHeaders = {}) => new Response(JSON.stringify({ ok: false, code }), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders },
});

function runtimeConfig(env) {
  if (env.DOMESTIC_DOWNLOADS_ENABLED !== 'true') return null;
  const ttlSeconds = Number(env.DOWNLOAD_URL_TTL_SECONDS || 120);
  if (!env.DOWNLOAD_CDN_HOST || !env.ALIYUN_CDN_AUTH_KEY || !env.DOWNLOAD_LOG_KEY || !env.DOWNLOAD_RATE_LIMIT) return null;
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 30 || ttlSeconds > 300) return null;
  return { host: env.DOWNLOAD_CDN_HOST, key: env.ALIYUN_CDN_AUTH_KEY, logKey: env.DOWNLOAD_LOG_KEY, ttlSeconds };
}

export async function onRequestGet(context, dependencies = {}) {
  const { request, env } = context;
  const config = runtimeConfig(env);
  if (!config) return json(503, 'domestic_download_unavailable');
  const url = new URL(request.url);
  const product = url.searchParams.get('product');
  const assetId = url.searchParams.get('asset');
  const item = findDownloadAsset(product, assetId);
  if (!item) return json(404, 'download_not_found');
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const now = dependencies.now || new Date();
  const logger = dependencies.logger || console;
  let ipHash;
  try { ipHash = hashClientIp(ip, config.logKey); } catch { return json(503, 'domestic_download_unavailable'); }
  let rate;
  try {
    rate = await checkDownloadRateLimit(env, { clientKey: ipHash, product, assetId, userAgent: request.headers.get('User-Agent'), now });
  } catch {
    return json(503, 'domestic_download_unavailable');
  }
  const log = { product, assetId, country: request.headers.get('CF-IPCountry') || 'unknown', uaClass: rate.uaClass, rayId: request.headers.get('CF-Ray') || 'unknown', ipHash };
  if (!rate.allowed) {
    logger.info('download rate limited', log);
    return json(429, 'rate_limited', { 'Retry-After': String(rate.retryAfter) });
  }
  try {
    const location = createCdnSignedUrl({ host: config.host, pathname: item.pathname, key: config.key, now, ttlSeconds: config.ttlSeconds });
    logger.info('download granted', log);
    return new Response(null, { status: 302, headers: { Location: location.href, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    logger.info('download unavailable', log);
    return json(503, 'domestic_download_unavailable');
  }
}

export function onRequest(context, dependencies = {}) {
  if (context.request.method !== 'GET') return json(405, 'method_not_allowed', { Allow: 'GET' });
  return onRequestGet(context, dependencies);
}
