import * as cheerio from 'cheerio';
import { canonicalUrl as routeCanonicalUrl, SITE_URL } from '../../../scripts/seo-routes.mjs';

function canonicalUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    if (url.origin !== SITE_URL || url.username || url.password || url.search) return null;
    return routeCanonicalUrl(url.pathname);
  } catch {
    return null;
  }
}

function normalizedUrls(urls) {
  return [...new Set(urls.map(canonicalUrl).filter(Boolean))].sort();
}

export function canonicalUrls(routes) {
  return normalizedUrls(routes.map((route) => route.canonical));
}

export function parseSitemap(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return normalizedUrls($('url > loc').map((_, element) => $(element).text()).get());
}

export function notificationDelta(currentUrls, successfulUrls) {
  const successful = new Set(normalizedUrls(successfulUrls));
  return normalizedUrls(currentUrls).filter((url) => !successful.has(url));
}
