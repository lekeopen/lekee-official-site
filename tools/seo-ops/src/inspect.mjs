import * as cheerio from 'cheerio';

import { loadSeoRoutes } from '../../../scripts/seo-routes.mjs';
import { canonicalUrls, parseSitemap } from './inventory.mjs';

const DEFAULT_ORIGIN = 'https://lekeopen.com';
const DEFAULT_MAX_REQUESTS = 24;
const DEFAULT_TIMEOUT_MS = 10_000;
const LOCATOR_SELECTOR = '[data-locator], [data-source-location], [data-component-path]';
const PRODUCTION_CRAWLERS = ['baiduspider', 'googlebot', 'bingbot'];
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

class InspectionTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`SEO inspection request timed out after ${timeoutMs}ms`);
    this.name = 'InspectionTimeoutError';
  }
}

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

function bufferedResponse(response, body) {
  const result = new Response(NULL_BODY_STATUSES.has(response.status) ? null : body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  if (response.url) Object.defineProperty(result, 'url', { value: response.url });
  return result;
}

async function fetchAndBuffer(url, init, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timeoutError = new InspectionTimeoutError(timeoutMs);
  let timedOut = false;
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);
  });
  const request = (async () => {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    const body = await response.arrayBuffer();
    return bufferedResponse(response, body);
  })();

  try {
    return await Promise.race([request, timeout]);
  } catch (error) {
    if (timedOut) throw timeoutError;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function robotGroups(robots) {
  const groups = [];
  let group;
  let hasRules = false;

  function finishGroup() {
    if (group) groups.push(group);
    group = undefined;
    hasRules = false;
  }

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const directive = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (directive === 'user-agent') {
      if (!group || hasRules) {
        finishGroup();
        group = { agents: [], rules: [] };
      }
      group.agents.push(value.toLowerCase());
      continue;
    }
    if ((directive === 'allow' || directive === 'disallow') && group) {
      hasRules = true;
      if (value) group.rules.push({ type: directive, pattern: value });
    }
  }
  finishGroup();

  return groups;
}

function robotRulesForCrawler(groups, crawler) {
  const matches = groups.map((group) => ({
    group,
    specificity: Math.max(...group.agents.map((agent) => (
      agent === '*' ? 0 : crawler.includes(agent) ? agent.length : -1
    ))),
  }));
  const specificity = Math.max(-1, ...matches.map((match) => match.specificity));
  if (specificity < 0) return [];
  return matches
    .filter((match) => match.specificity === specificity)
    .flatMap((match) => match.group.rules);
}

function robotsPattern(pattern) {
  const anchored = pattern.endsWith('$');
  const source = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = source
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('*', '.*');
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`);
}

function robotsAllows(url, rules) {
  const target = `${new URL(url).pathname}${new URL(url).search}`;
  const matches = rules
    .filter((rule) => robotsPattern(rule.pattern).test(target))
    .map((rule) => ({
      ...rule,
      specificity: rule.pattern.replace(/[*$]/g, '').length,
    }))
    .sort((left, right) => (
      right.specificity - left.specificity
      || (left.type === right.type ? 0 : left.type === 'allow' ? -1 : 1)
    ));
  return matches.length === 0 || matches[0].type === 'allow';
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
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Inspection fetchImpl must be a function');
  if (!Number.isInteger(maxRequests) || maxRequests < 1) throw new TypeError('Inspection maxRequests must be a positive integer');
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('Inspection timeoutMs must be a finite positive number');
  }

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
      const response = await fetchAndBuffer(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      }, fetchImpl, timeoutMs);
      record(checkName, targetUrl, expected, response.status, predicate(response.status));
      record('exact-final-url', targetUrl, targetUrl, response.url || null, response.url === targetUrl);
      return response;
    } catch (error) {
      record(checkName, targetUrl, expected, error instanceof InspectionTimeoutError ? 'request timed out' : 'request failed', false);
      return null;
    }
  }

  async function inspectPage(route) {
    const url = expectedCanonical(normalizedOrigin, route);
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
    let sitemapUrls;
    try {
      sitemapUrls = parseSitemap(xml).map((url) => routeUrl(normalizedOrigin, new URL(url).pathname));
      record('sitemap-xml-valid', sitemapUrl, 'well-formed urlset with one loc per URL', 'valid', true);
    } catch {
      record('sitemap-xml-valid', sitemapUrl, 'well-formed urlset with one loc per URL', 'invalid XML or sitemap structure', false);
    }
    if (sitemapUrls) {
      const $xml = cheerio.load(xml, { xmlMode: true });
      const rawSitemapUrls = $xml.root().find('*').filter((_, element) => (
        String(element.name || '').split(':').at(-1) === 'loc'
        && String(element.parent?.name || '').split(':').at(-1) === 'url'
      )).map((_, element) => $xml(element).text()).get();
      const expectedUrls = canonicalUrls(routes).map((url) => routeUrl(normalizedOrigin, new URL(url).pathname));
      const sortedRawSitemapUrls = [...rawSitemapUrls].sort();
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
          && JSON.stringify(sortedRawSitemapUrls) === JSON.stringify(expectedUrls),
      );
    }
  }

  const robotsUrl = routeUrl(normalizedOrigin, '/robots.txt');
  const robotsResponse = await get(robotsUrl, 'robots-status', 200);
  if (robotsResponse) {
    const robots = await robotsResponse.text();
    const expectedSitemap = `${normalizedOrigin}/sitemap.xml`;
    record('robots-sitemap-discovery', robotsUrl, expectedSitemap, robots.match(/^Sitemap:\s*(.+)$/mi)?.[1] ?? null, new RegExp(`^Sitemap:\\s*${expectedSitemap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'mi').test(robots));
    const groups = robotGroups(robots);
    const inspectedUrls = representativeRoutes.map((route) => expectedCanonical(normalizedOrigin, route));
    const blockedUrls = [...new Set(PRODUCTION_CRAWLERS.flatMap((crawler) => {
      const rules = robotRulesForCrawler(groups, crawler);
      return inspectedUrls.filter((url) => !robotsAllows(url, rules));
    }))];
    record(
      'robots-crawl-permission',
      robotsUrl,
      'all inspected canonical routes allowed for Baiduspider, Googlebot, and bingbot',
      blockedUrls.length === 0 ? 'allowed' : blockedUrls,
      blockedUrls.length === 0,
    );
  }

  await get(routeUrl(normalizedOrigin, '/rss.xml'), 'rss-available', 200);

  const notFoundUrl = routeUrl(normalizedOrigin, '/not-found/');
  const notFoundResponse = await get(notFoundUrl, 'not-found-status', 404);
  if (notFoundResponse) {
    const $ = cheerio.load(await notFoundResponse.text());
    const robots = $('meta[name="robots"]').attr('content') ?? null;
    record('not-found-noindex', notFoundUrl, 'contains noindex', robots, typeof robots === 'string' && /\bnoindex\b/i.test(robots));
  }

  const visitedLinks = new Set(representativeRoutes.map((route) => linkDedupeKey(expectedCanonical(normalizedOrigin, route))));
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
