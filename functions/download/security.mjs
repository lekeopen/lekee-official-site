import { createHmac } from 'node:crypto';

const TEN_MINUTES = 600;
const ONE_DAY = 86_400;

export function classifyUserAgent(value) {
  const ua = String(value || '').toLowerCase();
  if (!ua) return 'missing';
  if (/bot|crawler|spider|scrapy|wget|curl|python|go-http-client/.test(ua)) return 'automation';
  return 'browser';
}

async function incrementWithinLimit(kv, key, limit, ttl) {
  const count = Number(await kv.get(key) || 0);
  if (!Number.isSafeInteger(count) || count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: ttl });
  return true;
}

export async function checkDownloadRateLimit(env, { clientKey, product, assetId, userAgent, now }) {
  if (!env.DOWNLOAD_RATE_LIMIT || !clientKey) throw new Error('Download rate limiting is unavailable');
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const uaClass = classifyUserAgent(userAgent);
  const shortLimit = uaClass === 'browser' ? 5 : 2;
  const shortKey = `download:10m:${Math.floor(nowSeconds / TEN_MINUTES)}:${clientKey}:${product}:${assetId}`;
  const dailyKey = `download:day:${Math.floor(nowSeconds / ONE_DAY)}:${clientKey}:${product}`;
  if (!await incrementWithinLimit(env.DOWNLOAD_RATE_LIMIT, shortKey, shortLimit, TEN_MINUTES * 2)) return { allowed: false, retryAfter: TEN_MINUTES, uaClass };
  if (!await incrementWithinLimit(env.DOWNLOAD_RATE_LIMIT, dailyKey, 20, ONE_DAY * 2)) return { allowed: false, retryAfter: ONE_DAY, uaClass };
  return { allowed: true, retryAfter: 0, uaClass };
}

export function hashClientIp(ip, key) {
  if (!ip || typeof key !== 'string' || key.length < 16) throw new Error('Download log hashing is unavailable');
  return createHmac('sha256', key).update(ip).digest('hex').slice(0, 20);
}
