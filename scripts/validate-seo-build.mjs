import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { loadSeoRoutes } from './seo-routes.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const routes = await loadSeoRoutes(root);

for (const route of routes) {
  const relative = route.path === '/' ? 'index.html' : path.join(route.path.slice(1), 'index.html');
  const html = await readFile(path.join(dist, relative), 'utf8');
  const $ = cheerio.load(html);
  assert.equal($('html').attr('lang'), 'zh-CN', `${route.path}: invalid language`);
  assert.equal($('link[rel="canonical"]').length, 1, `${route.path}: canonical count`);
  assert.equal($('link[rel="canonical"]').attr('href'), route.canonical, `${route.path}: canonical URL`);
  assert.ok($('#root').text().trim().length > 20, `${route.path}: empty rendered body`);
  assert.equal($('#root h1').length, 1, `${route.path}: h1 count`);
  const jsonLd = $('script[type="application/ld+json"]');
  assert.equal(jsonLd.length, 1, `${route.path}: JSON-LD count`);
  JSON.parse(jsonLd.text());
}

const sitemap = cheerio.load(await readFile(path.join(dist, 'sitemap.xml'), 'utf8'), { xmlMode: true });
const sitemapUrls = sitemap('url > loc').map((_, element) => sitemap(element).text()).get();
assert.deepEqual([...sitemapUrls].sort(), routes.map((route) => route.canonical).sort(), 'sitemap coverage');

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
assert.match(robots, /Sitemap: https:\/\/lekeopen\.com\/sitemap\.xml/);
const notFound = cheerio.load(await readFile(path.join(dist, '404.html'), 'utf8'));
assert.equal(notFound('meta[name="robots"]').attr('content'), 'noindex, nofollow');

console.log(`SEO build validation passed for ${routes.length} indexed routes.`);
