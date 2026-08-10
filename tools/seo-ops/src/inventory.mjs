import * as cheerio from 'cheerio';

const SITE_ORIGIN = 'https://lekeopen.com';

function canonicalUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    if (url.origin !== SITE_ORIGIN || url.username || url.password || url.search) return null;
    url.hash = '';
    return url.toString();
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
