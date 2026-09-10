import { createHash } from 'node:crypto';

const HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function createCdnSignedUrl({ host, pathname, key, now = new Date(), ttlSeconds = 120 }) {
  if (!HOST_PATTERN.test(host) || host.includes(':')) throw new Error('Invalid CDN host');
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.includes('..') || pathname.includes('?') || pathname.includes('#')) throw new Error('Invalid asset pathname');
  if (typeof key !== 'string' || key.length < 16 || key.length > 128) throw new Error('Invalid CDN signing key');
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 30 || ttlSeconds > 300) throw new Error('Invalid CDN signing TTL');
  const expires = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const timestamp = expires.toString(16).toUpperCase();
  const signature = createHash('md5').update(`${key}${pathname}${timestamp}`).digest('hex');
  const url = new URL(`https://${host}${pathname}`);
  url.searchParams.set('KEY1', signature);
  url.searchParams.set('KEY2', timestamp);
  return url;
}
