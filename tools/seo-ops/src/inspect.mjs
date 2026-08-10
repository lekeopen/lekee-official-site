import * as cheerio from 'cheerio';

import { loadSeoRoutes } from '../../../scripts/seo-routes.mjs';
import { canonicalUrls, parseSitemap } from './inventory.mjs';

const DEFAULT_ORIGIN = 'https://lekeopen.com';
const DEFAULT_MAX_REQUESTS = 24;
const LOCATOR_SELECTOR = '[data-locator], [data-source-location], [data-component-path]';

function normalizeOrigin(value) {
  const origin = new URL(value);
  if (origin.protocol !== 'https:') throw new TypeError('Inspection origin must use HTTPS');
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
    throw new TypeError('Inspection origin must be a bare HTTPS origin');
  }
  return origin.origin;
}

function routeUrl(origin, routePath) {
  return new URL(routePath, `${origin}/`).href;
}

function safeUrl(value) {
  const url = new URL(value);
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url.href;
}

function requestUrl(value) {
  const url = new URL(value);
  url.hash = '';
  return url.href;
}

function linkDedupeKey(value) {
  const url = new URL(requestUrl(value));
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}

function safeActual(value) {
  if (typeof value === 'string') {
    try {
      return safeUrl(value);
    } catch {
      return value.replace(/\b(token|secret|api[_-]?key|authorization)\s*[=:]\s*[^\s,;]+/gi, '$1=[REDACTED]');
    }
  }
  if (Array.isArray(value)) return value.map(safeActual);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, safeActual(entry)]));
  }
  return value;
}

function isSuccessStatus(status) {
  return status >= 200 && status < 400;
}

function expectedCanonical(origin, route) {
  return routeUrl(origin, new URL(route.canonical).pathname);
}

function failureFromCheck(check) {
  return {
    url: check.url,
    check: check.name,
    expected: check.expected,
    actual: check.actual,
  };
}

export async function inspectProduction({
  origin = DEFAULT_ORIGIN,
  fetchImpl = globalThis.fetch,
  rootDir = process.cwd(),
  maxRequests = DEFAULT_MAX_REQUESTS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Inspection fetchImpl must be a function');
  if (!Number.isInteger(maxRequests) || maxRequests < 1) throw new TypeError('Inspection maxRequests must be a positive integer');

  const normalizedOrigin = normalizeOrigin(origin);
  const startedAt = new Date().toISOString();
  const checks = [];
  const failures = [];
  let requestCount = 0;

  function record(name, url, expected, actual, passed) {
    const check = { name, url: safeUrl(url), expected: safeActual(expected), actual: safeActual(actual), passed };
    checks.push(check);
    if (!passed) failures.push(failureFromCheck(check));
    return passed;
  }

  async function get(url, checkName, expected, predicate = (status) => status === expected) {
    const targetUrl = requestUrl(url);
    if (requestCount >= maxRequests) {
      record(checkName, targetUrl, expected, 'request limit exceeded', false);
      return null;
    }
    requestCount += 1;
    try {
      const response = await fetchImpl(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      });
      record(checkName, targetUrl, expected, response.status, predicate(response.status));
      return response;
    } catch {
      record(checkName, targetUrl, expected, 'request failed', false);
      return null;
    }
  }

  async function inspectPage(route) {
    const url = routeUrl(normalizedOrigin, route.path);
    const response = await get(url, 'expected-status', 200);
    if (!response) return [];

    const finalUrl = response.url ? safeUrl(response.url) : url;
    const final = new URL(finalUrl);
    record('https-final-host', url, normalizedOrigin, final.origin, final.protocol === 'https:' && final.origin === normalizedOrigin);
    const html = await response.text();
    record('static-html', url, 'non-empty HTML document', html.trim().length > 0 ? 'present' : 'empty', html.trim().length > 0);
    const $ = cheerio.load(html);
    record('single-h1', url, 1, $('h1').length, $('h1').length === 1);
    const canonicals = $('link[rel="canonical"]').map((_, element) => $(element).attr('href')).get();
    const canonical = canonicals.length === 1 ? canonicals[0] : null;
    record('single-canonical', url, expectedCanonical(normalizedOrigin, route), canonical, canonical === expectedCanonical(normalizedOrigin, route));
    const jsonLd = $('script[type="application/ld+json"]').map((_, element) => $(element).text()).get();
    const jsonLdValid = jsonLd.length > 0 && jsonLd.every((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    });
    record('json-ld-parseable', url, 'at least one parseable JSON-LD block', jsonLdValid ? 'parseable' : 'missing or invalid', jsonLdValid);
    const locatorCount = $(LOCATOR_SELECTOR).length;
    record('development-locator-attributes', url, 0, locatorCount, locatorCount === 0);
    return $('a[href]').map((_, element) => $(element).attr('href')).get();
  }

  const routes = await loadSeoRoutes(rootDir);
  const homepage = routes.find((route) => route.path === '/');
  const article = routes.find((route) => route.kind === 'article');
  const project = routes.find((route) => route.kind === 'project');
  if (!article) record('representative-article', normalizedOrigin, 'published article route', 'missing', false);
  if (!project) record('representative-project', normalizedOrigin, 'published project route', 'missing', false);
  const representativeRoutes = [homepage, article, project].filter(Boolean);
  const linkedHrefs = [];
  for (const route of representativeRoutes) linkedHrefs.push(...await inspectPage(route));

  const sitemapUrl = routeUrl(normalizedOrigin, '/sitemap.xml');
  const sitemapResponse = await get(sitemapUrl, 'sitemap-status', 200);
  if (sitemapResponse) {
    const xml = await sitemapResponse.text();
    const $xml = cheerio.load(xml, { xmlMode: true });
    const rawSitemapUrls = $xml('url > loc').map((_, element) => $xml(element).text()).get();
    const sitemapUrls = parseSitemap(xml).map((url) => routeUrl(normalizedOrigin, new URL(url).pathname));
    const expectedUrls = canonicalUrls(routes).map((url) => routeUrl(normalizedOrigin, new URL(url).pathname));
    let hasMalformedSitemapUrl = false;
    const safeSitemapUrls = rawSitemapUrls.map((value) => {
      try {
        return safeUrl(value);
      } catch {
        hasMalformedSitemapUrl = true;
        return null;
      }
    });
    const rawUrlsAreCanonical = rawSitemapUrls.every((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.origin === normalizedOrigin
          && !url.username && !url.password && !url.search && !url.hash;
      } catch {
        return false;
      }
    });
    record(
      'sitemap-coverage',
      sitemapUrl,
      expectedUrls,
      hasMalformedSitemapUrl ? '[invalid sitemap location]' : safeSitemapUrls,
      !hasMalformedSitemapUrl
        && rawUrlsAreCanonical
        && rawSitemapUrls.length === sitemapUrls.length
        && JSON.stringify(sitemapUrls) === JSON.stringify(expectedUrls),
    );
  }

  const robotsUrl = routeUrl(normalizedOrigin, '/robots.txt');
  const robotsResponse = await get(robotsUrl, 'robots-status', 200);
  if (robotsResponse) {
    const robots = await robotsResponse.text();
    const expectedSitemap = `${normalizedOrigin}/sitemap.xml`;
    record('robots-sitemap-discovery', robotsUrl, expectedSitemap, robots.match(/^Sitemap:\s*(.+)$/mi)?.[1] ?? null, new RegExp(`^Sitemap:\\s*${expectedSitemap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'mi').test(robots));
  }

  await get(routeUrl(normalizedOrigin, '/rss.xml'), 'rss-available', 200);

  const notFoundUrl = routeUrl(normalizedOrigin, '/not-found/');
  const notFoundResponse = await get(notFoundUrl, 'not-found-status', 404);
  if (notFoundResponse) {
    const $ = cheerio.load(await notFoundResponse.text());
    const robots = $('meta[name="robots"]').attr('content') ?? null;
    record('not-found-noindex', notFoundUrl, 'contains noindex', robots, typeof robots === 'string' && /\bnoindex\b/i.test(robots));
  }

  const visitedLinks = new Set(representativeRoutes.map((route) => linkDedupeKey(routeUrl(normalizedOrigin, route.path))));
  for (const href of linkedHrefs) {
    if (requestCount >= maxRequests) break;
    let url;
    try {
      url = new URL(href, normalizedOrigin);
    } catch {
      continue;
    }
    if (url.origin !== normalizedOrigin || url.username || url.password || !['http:', 'https:'].includes(url.protocol)) continue;
    if (url.pathname === '/cdn-cgi/l/email-protection') continue;
    url.hash = '';
    const target = requestUrl(url.href);
    const dedupeKey = linkDedupeKey(target);
    if (visitedLinks.has(dedupeKey)) continue;
    visitedLinks.add(dedupeKey);
    await get(target, 'same-origin-link-status', '2xx or 3xx', isSuccessStatus);
  }

  return {
    startedAt,
    origin: normalizedOrigin,
    checks,
    summary: {
      total: checks.length,
      passed: checks.length - failures.length,
      failed: failures.length,
      releaseBlocking: failures.length > 0,
      requestCount,
      maxRequests,
    },
    failures,
  };
}
