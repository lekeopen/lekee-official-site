import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { main as runCli } from '../tools/seo-ops/src/cli.mjs';
import { inspectProduction } from '../tools/seo-ops/src/inspect.mjs';
import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

const ORIGIN = 'https://lekeopen.com';

function response(body, status = 200, url = ORIGIN) {
  const result = new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
  Object.defineProperty(result, 'url', { value: url });
  return result;
}

function page({ canonical, links = [] }) {
  return `<!doctype html><html><head>
    <link rel="canonical" href="${canonical}">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
  </head><body><main><h1>Page</h1>${links.map((href) => `<a href="${href}">Link</a>`).join('')}</main></body></html>`;
}

async function settlesWithin(operation, milliseconds = 250) {
  let timeoutId;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('inspection did not settle within its timeout')), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function createFixtureFetch({
  brokenLink = false,
  throwSecret = false,
  extraLinks = [],
  sitemapUrls,
  sitemapXml,
  robotsText,
} = {}) {
  const routes = await loadSeoRoutes(process.cwd());
  const article = routes.find((route) => route.kind === 'article');
  const project = routes.find((route) => route.kind === 'project');
  const canonicals = sitemapUrls ?? routes.map((route) => route.canonical);
  const representative = [routes[0], article, project];
  const pages = new Map(representative.map((route) => [new URL(route.canonical).pathname, page({
    canonical: route.canonical,
    links: route.path === '/' ? [article.path, project.path, '/about/', ...extraLinks, ...(brokenLink ? ['/broken-link/'] : [])] : [],
  })]));
  pages.set('/about/', page({ canonical: `${ORIGIN}/about/` }));
  const calls = [];

  return {
    calls,
    fetchImpl: async (input, init = {}) => {
      const url = new URL(input);
      calls.push({ url: url.href, method: init.method });
      assert.equal(init.method, 'GET');
      if (throwSecret && url.pathname === '/about/') throw new Error('token=fixture-secret');
      if (url.pathname === '/sitemap.xml') {
        return response(sitemapXml ?? `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${canonicals.map((canonical) => `<url><loc>${canonical}</loc></url>`).join('')}</urlset>`, 200, url.href);
      }
      if (url.pathname === '/robots.txt') return response(robotsText ?? `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`, 200, url.href);
      if (url.pathname === '/rss.xml') return response('<?xml version="1.0"?><rss version="2.0"/>', 200, url.href);
      if (url.pathname === '/not-found/') return response('<meta name="robots" content="noindex, nofollow"><h1>Not found</h1>', 404, url.href);
      if (url.pathname === '/broken-link/') return response('<h1>Not found</h1>', 404, url.href);
      if (url.pathname.startsWith('/linked-') || url.pathname === '/query-target/') return response('<h1>Linked page</h1>', 200, url.href);
      if (pages.has(url.pathname)) return response(pages.get(url.pathname), 200, url.href);
      return response('<h1>Not found</h1>', 404, url.href);
    },
  };
}

test('inspectProduction validates representative production SEO artifacts with bounded GET requests', async () => {
  const { fetchImpl, calls } = await createFixtureFetch();

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd(), maxRequests: 12 });

  assert.equal(report.origin, ORIGIN);
  assert.equal(typeof report.startedAt, 'string');
  assert.deepEqual(report.failures, []);
  assert.equal(report.summary.failed, 0);
  assert.ok(report.summary.passed > 0);
  assert.ok(report.checks.some((check) => check.name === 'https-final-host'));
  assert.ok(report.checks.some((check) => check.name === 'static-html'));
  assert.ok(report.checks.some((check) => check.name === 'single-h1'));
  assert.ok(report.checks.some((check) => check.name === 'single-canonical'));
  assert.ok(report.checks.some((check) => check.name === 'json-ld-parseable'));
  assert.ok(report.checks.some((check) => check.name === 'sitemap-coverage'));
  assert.ok(report.checks.some((check) => check.name === 'sitemap-xml-valid'));
  assert.ok(report.checks.some((check) => check.name === 'robots-sitemap-discovery'));
  assert.ok(report.checks.some((check) => check.name === 'robots-crawl-permission'));
  assert.ok(report.checks.some((check) => check.name === 'rss-available'));
  assert.ok(report.checks.some((check) => check.name === 'not-found-noindex'));
  assert.ok(report.checks.some((check) => check.name === 'same-origin-link-status'));
  assert.ok(report.checks.some((check) => check.name === 'development-locator-attributes'));
  assert.ok(calls.length <= 12);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('inspectProduction requests representative pages at their canonical trailing-slash URLs', async () => {
  const { fetchImpl, calls } = await createFixtureFetch();

  await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd(), maxRequests: 12 });

  assert.deepEqual(calls.slice(0, 3).map((call) => new URL(call.url).pathname), [
    '/',
    '/news/2025-12-18-xiaole-stage-update/',
    '/projects/boral-wang/',
  ]);
});

test('inspectProduction reserves bounded requests for sitemap, robots, RSS, and 404 checks before link crawling', async () => {
  const { fetchImpl, calls } = await createFixtureFetch({
    extraLinks: Array.from({ length: 10 }, (_, index) => `/linked-${index}/`),
  });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd(), maxRequests: 7 });

  assert.equal(report.summary.failed, 0);
  assert.equal(calls.length, 7);
  assert.ok(report.checks.some((check) => check.name === 'sitemap-coverage' && check.passed));
  assert.ok(report.checks.some((check) => check.name === 'robots-sitemap-discovery' && check.passed));
  assert.ok(report.checks.some((check) => check.name === 'rss-available' && check.passed));
  assert.ok(report.checks.some((check) => check.name === 'not-found-noindex' && check.passed));
});

test('inspectProduction deduplicates same-origin links with and without a trailing slash', async () => {
  const { fetchImpl, calls } = await createFixtureFetch({ extraLinks: ['/about'] });

  await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.equal(calls.filter((call) => new URL(call.url).pathname === '/about/').length, 1);
  assert.equal(calls.filter((call) => new URL(call.url).pathname === '/about').length, 0);
});

test('inspectProduction blocks an unexpected same-origin redirect away from the requested canonical URL', async () => {
  const { fetchImpl } = await createFixtureFetch();
  const redirectingFetch = async (input, init) => {
    const url = new URL(input);
    if (url.pathname === '/') {
      return response(page({ canonical: `${ORIGIN}/` }), 200, `${ORIGIN}/about/`);
    }
    return fetchImpl(input, init);
  };

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl: redirectingFetch, rootDir: process.cwd() });

  assert.deepEqual(report.failures.find((item) => item.check === 'exact-final-url'), {
    url: `${ORIGIN}/`,
    check: 'exact-final-url',
    expected: `${ORIGIN}/`,
    actual: `${ORIGIN}/about/`,
  });
  assert.equal(report.summary.releaseBlocking, true);
});

test('inspectProduction rejects sitemap entries that use a non-production host', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const sitemapUrls = routes.map((route) => route.canonical);
  sitemapUrls.push('https://wrong-host.example/');
  const { fetchImpl } = await createFixtureFetch({ sitemapUrls });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(report.failures.some((failure) => failure.check === 'sitemap-coverage'));
});

test('inspectProduction accepts a valid namespace-prefixed sitemap structure', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const sitemapXml = `<?xml version="1.0"?>
    <sm:urlset xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${routes.map((route) => `<sm:url><sm:loc>${route.canonical}</sm:loc></sm:url>`).join('')}
    </sm:urlset>`;
  const { fetchImpl } = await createFixtureFetch({ sitemapXml });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(report.checks.some((check) => check.name === 'sitemap-xml-valid' && check.passed));
  assert.ok(report.checks.some((check) => check.name === 'sitemap-coverage' && check.passed));
});

test('inspectProduction rejects a namespace-less sitemap before coverage', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const sitemapXml = `<urlset>${routes.map((route) => `<url><loc>${route.canonical}</loc></url>`).join('')}</urlset>`;
  const { fetchImpl } = await createFixtureFetch({ sitemapXml });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(report.failures.some((item) => item.check === 'sitemap-xml-valid'));
  assert.equal(report.checks.some((item) => item.name === 'sitemap-coverage'), false);
});

test('inspectProduction rejects raw sitemap locations that omit the canonical trailing slash', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const nestedRoute = routes.find((route) => route.path !== '/');
  const malformedCanonical = nestedRoute.canonical.slice(0, -1);
  const sitemapUrls = routes.map((route) => (
    route.canonical === nestedRoute.canonical ? malformedCanonical : route.canonical
  ));
  const { fetchImpl } = await createFixtureFetch({ sitemapUrls });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });
  const failure = report.failures.find((item) => item.check === 'sitemap-coverage');

  assert.ok(failure);
  assert.ok(failure.actual.includes(malformedCanonical));
});

test('inspectProduction rejects sitemap elements declared in a non-sitemap namespace', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const sitemapXml = `<bad:urlset xmlns:bad="https://example.invalid/sitemap">
    ${routes.map((route) => `<bad:url><bad:loc>${route.canonical}</bad:loc></bad:url>`).join('')}
  </bad:urlset>`;
  const { fetchImpl } = await createFixtureFetch({ sitemapXml });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(report.failures.some((item) => item.check === 'sitemap-xml-valid'));
  assert.equal(report.checks.some((item) => item.name === 'sitemap-coverage'), false);
});

test('inspectProduction fetches same-origin links with their original query string', async () => {
  const { fetchImpl, calls } = await createFixtureFetch({ extraLinks: ['/query-target/?page=2'] });

  await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(calls.some((call) => call.url === `${ORIGIN}/query-target/?page=2`));
});

test('inspectProduction ignores only Cloudflare email-protection placeholder links', async () => {
  const { fetchImpl, calls } = await createFixtureFetch({
    extraLinks: ['/cdn-cgi/l/email-protection#encoded', '/cdn-cgi/other'],
  });

  await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.equal(calls.some((call) => new URL(call.url).pathname === '/cdn-cgi/l/email-protection'), false);
  assert.equal(calls.some((call) => new URL(call.url).pathname === '/cdn-cgi/other'), true);
});

test('inspectProduction reports malformed sitemap locations without exposing their contents', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const sitemapUrls = [...routes.map((route) => route.canonical), '%%%token=fixture-secret'];
  const { fetchImpl } = await createFixtureFetch({ sitemapUrls });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  const failure = report.failures.find((item) => item.check === 'sitemap-coverage');
  assert.deepEqual(failure, {
    url: `${ORIGIN}/sitemap.xml`,
    check: 'sitemap-coverage',
    expected: routes.map((route) => route.canonical).sort(),
    actual: '[invalid sitemap location]',
  });
  assert.equal(JSON.stringify(report).includes('fixture-secret'), false);
});

test('inspectProduction blocks a global wildcard robots disallow', async () => {
  const { fetchImpl } = await createFixtureFetch({
    robotsText: `User-agent: *\nDisallow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });
  const failure = report.failures.find((item) => item.check === 'robots-crawl-permission');

  assert.ok(failure);
  assert.match(JSON.stringify(failure.actual), /https:\/\/lekeopen\.com\//);
});

test('inspectProduction blocks a wildcard robots rule that disallows an inspected route', async () => {
  const { fetchImpl } = await createFixtureFetch({
    robotsText: `User-agent: *\nDisallow: /news/\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });
  const failure = report.failures.find((item) => item.check === 'robots-crawl-permission');

  assert.ok(failure);
  assert.ok(failure.actual.every((url) => new URL(url).pathname.startsWith('/news/')));
});

test('inspectProduction applies longest-match allow rules for wildcard robots groups', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const article = routes.find((route) => route.kind === 'article');
  const { fetchImpl } = await createFixtureFetch({
    robotsText: `User-agent: *\nDisallow: /news/\nAllow: ${article.path}\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  assert.ok(
    report.checks.some((item) => item.name === 'robots-crawl-permission' && item.passed),
    JSON.stringify(report.failures),
  );
});

test('inspectProduction blocks effective crawler-specific rules for every production crawler', async () => {
  for (const userAgent of ['Baiduspider', 'Googlebot', 'bingbot']) {
    const { fetchImpl } = await createFixtureFetch({
      robotsText: `User-agent: *\nAllow: /\nUser-agent: ${userAgent}\nDisallow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    });

    const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

    assert.ok(
      report.failures.some((item) => item.check === 'robots-crawl-permission'),
      `${userAgent} crawl blocking must be release-blocking`,
    );
  }
});

test('inspectProduction selects the longest matching crawler group before applying longest-path Allow precedence', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const article = routes.find((route) => route.kind === 'article');
  const crawlers = [
    { partial: 'Baidu', exact: 'Baiduspider' },
    { partial: 'Google', exact: 'Googlebot' },
    { partial: 'bing', exact: 'bingbot' },
  ];

  for (const crawler of crawlers) {
    const otherCrawlerGroups = crawlers
      .filter((candidate) => candidate.exact !== crawler.exact)
      .map((candidate) => `User-agent: ${candidate.exact}\nAllow: /`)
      .join('\n');
    const { fetchImpl } = await createFixtureFetch({
      robotsText: `User-agent: *\nDisallow: /\n${otherCrawlerGroups}\nUser-agent: ${crawler.partial}\nDisallow: /\nUser-agent: ${crawler.exact}\nDisallow: /news/\nAllow: ${article.path}\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    });

    const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

    assert.ok(
      report.checks.some((item) => item.name === 'robots-crawl-permission' && item.passed),
      `${crawler.exact} must use its most-specific group and Allow rule: ${JSON.stringify(report.failures)}`,
    );
  }
});

test('inspectProduction rejects malformed, truncated, or mismatched sitemap XML before coverage', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const url = routes[0].canonical;
  const malformedDocuments = [
    `<urlset><url><loc>${url}</loc></url>`,
    `<urlset><url><loc>${url}</url></loc></urlset>`,
    `<urlset><url><loc>${url}</loc></url></urlset`,
  ];

  for (const sitemapXml of malformedDocuments) {
    const { fetchImpl } = await createFixtureFetch({ sitemapXml });
    const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

    assert.ok(report.failures.some((item) => item.check === 'sitemap-xml-valid'));
    assert.equal(report.checks.some((item) => item.check === 'sitemap-coverage'), false);
  }
});

test('inspectProduction rejects invalid sitemap roots and URL structures before coverage', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const url = routes[0].canonical;
  const invalidDocuments = [
    `<sitemapindex><sitemap><loc>${url}</loc></sitemap></sitemapindex>`,
    `<urlset><loc>${url}</loc></urlset>`,
    '<urlset><url></url></urlset>',
    `<urlset><url><loc>${url}</loc><loc>${url}</loc></url></urlset>`,
    `<urlset>unexpected text<url><loc>${url}</loc></url></urlset>`,
  ];

  for (const sitemapXml of invalidDocuments) {
    const { fetchImpl } = await createFixtureFetch({ sitemapXml });
    const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

    assert.ok(report.failures.some((item) => item.check === 'sitemap-xml-valid'));
    assert.equal(report.checks.some((item) => item.check === 'sitemap-coverage'), false);
  }
});

test('inspectProduction returns structured blocking failures for strict sitemap XML violations', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const url = routes[0].canonical;
  const invalidDocuments = [
    `<urlset><url><loc><x>${url}</x></loc></url></urlset>`,
    `<urlset><![CDATA[unexpected text]]><url><loc>${url}</loc></url></urlset>`,
    `<urlset>unexpected text<url><loc>${url}</loc></url></urlset>`,
    `<urlset><url><loc>${url}</loc></url></urlset><?xml version="1.0"?>`,
    `<?xml version="1.0"?><urlset><?audit invalid?><url><loc>${url}</loc></url></urlset>`,
    `<urlset><url><loc>${url}<?audit invalid?></loc></url></urlset>`,
    `<!DOCTYPE urlset><urlset><url><loc>${url}</loc></url></urlset>`,
  ];

  for (const sitemapXml of invalidDocuments) {
    const { fetchImpl } = await createFixtureFetch({ sitemapXml });
    const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });
    const failure = report.failures.find((item) => item.check === 'sitemap-xml-valid');

    assert.deepEqual(failure, {
      url: `${ORIGIN}/sitemap.xml`,
      check: 'sitemap-xml-valid',
      expected: 'well-formed urlset with one loc per URL',
      actual: 'invalid XML or sitemap structure',
    });
    assert.equal(report.summary.releaseBlocking, true);
    assert.equal(report.checks.some((item) => item.name === 'sitemap-coverage'), false);
  }
});

test('inspectProduction records missing published article and project representatives as blocking failures', async () => {
  const { fetchImpl } = await createFixtureFetch();
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-empty-content-'));

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir });

  assert.deepEqual(report.failures.filter((item) => item.check.startsWith('representative-')).map((item) => item.check), [
    'representative-article',
    'representative-project',
  ]);
});

test('inspectProduction reports broken links and request errors as sanitized structured failures', async () => {
  const { fetchImpl } = await createFixtureFetch({ brokenLink: true, throwSecret: true });

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl, rootDir: process.cwd() });

  const brokenLink = report.failures.find((failure) => failure.url === `${ORIGIN}/broken-link/`);
  assert.deepEqual(brokenLink, {
    url: `${ORIGIN}/broken-link/`,
    check: 'same-origin-link-status',
    expected: '2xx or 3xx',
    actual: 404,
  });
  const requestError = report.failures.find((failure) => failure.url === `${ORIGIN}/about/`);
  assert.deepEqual(requestError, {
    url: `${ORIGIN}/about/`,
    check: 'same-origin-link-status',
    expected: '2xx or 3xx',
    actual: 'request failed',
  });
  assert.equal(JSON.stringify(report).includes('fixture-secret'), false);
});

test('inspectProduction bounds a stalled fetch and records a sanitized blocking timeout failure', async () => {
  const { fetchImpl } = await createFixtureFetch();
  let aborts = 0;
  const stalledFetch = async (input, init) => {
    if (new URL(input).pathname === '/') {
      init.signal?.addEventListener('abort', () => { aborts += 1; }, { once: true });
      return new Promise(() => {});
    }
    return fetchImpl(input, init);
  };

  const report = await settlesWithin(inspectProduction({
    origin: ORIGIN,
    fetchImpl: stalledFetch,
    rootDir: process.cwd(),
    timeoutMs: 10,
  }));

  assert.deepEqual(report.failures.find((item) => item.url === `${ORIGIN}/`), {
    url: `${ORIGIN}/`,
    check: 'expected-status',
    expected: 200,
    actual: 'request timed out',
  });
  assert.equal(report.summary.releaseBlocking, true);
  assert.equal(aborts, 1);
});

test('inspectProduction bounds stalled response-body consumption with the same request timeout', async () => {
  const { fetchImpl } = await createFixtureFetch();
  let aborts = 0;
  const stalledBodyFetch = async (input, init) => {
    const url = new URL(input);
    if (url.pathname === '/sitemap.xml') {
      init.signal?.addEventListener('abort', () => { aborts += 1; }, { once: true });
      return {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/xml' }),
        url: url.href,
        arrayBuffer: async () => new Promise(() => {}),
        text: async () => new Promise(() => {}),
      };
    }
    return fetchImpl(input, init);
  };

  const report = await settlesWithin(inspectProduction({
    origin: ORIGIN,
    fetchImpl: stalledBodyFetch,
    rootDir: process.cwd(),
    timeoutMs: 10,
  }));

  assert.deepEqual(report.failures.find((item) => item.url === `${ORIGIN}/sitemap.xml`), {
    url: `${ORIGIN}/sitemap.xml`,
    check: 'sitemap-status',
    expected: 200,
    actual: 'request timed out',
  });
  assert.equal(report.summary.releaseBlocking, true);
  assert.equal(aborts, 1);
});

test('inspectProduction rejects invalid timeout configuration before making a request', async () => {
  for (const timeoutMs of [0, -1, NaN, Infinity, '10']) {
    let calls = 0;
    await assert.rejects(
      inspectProduction({
        origin: ORIGIN,
        fetchImpl: async () => {
          calls += 1;
          return response('', 200, `${ORIGIN}/`);
        },
        rootDir: process.cwd(),
        timeoutMs,
      }),
      /timeoutMs must be a finite positive number/,
    );
    assert.equal(calls, 0);
  }
});

test('inspectProduction never exposes a secret-looking canonical value in a failure report', async () => {
  const { fetchImpl } = await createFixtureFetch();
  const leakingFetch = async (input, init) => {
    if (new URL(input).pathname === '/') {
      return response(page({ canonical: `${ORIGIN}/?token=fixture-secret` }), 200, ORIGIN);
    }
    return fetchImpl(input, init);
  };

  const report = await inspectProduction({ origin: ORIGIN, fetchImpl: leakingFetch, rootDir: process.cwd() });

  assert.equal(JSON.stringify(report).includes('fixture-secret'), false);
});

test('inspect CLI emits JSON and marks release-blocking inspection failures with a nonzero exit code', async () => {
  const { fetchImpl } = await createFixtureFetch({ brokenLink: true });
  const output = [];

  const result = await runCli({
    argv: ['inspect', '--json'],
    rootDir: process.cwd(),
    fetchImpl,
    output: (line) => output.push(line),
  });

  assert.equal(result.summary.releaseBlocking, true);
  assert.equal(output.length, 1);
  assert.equal(JSON.parse(output[0]).summary.releaseBlocking, true);
});

test('direct inspect CLI exits nonzero when a read-only fixture reports blocking failures', () => {
  const preload = 'data:text/javascript,globalThis.fetch=async()=>new Response(\'\',{status:503})';
  const result = spawnSync(process.execPath, ['--import', preload, 'tools/seo-ops/src/cli.mjs', 'inspect'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /SEO inspection:/);
});
