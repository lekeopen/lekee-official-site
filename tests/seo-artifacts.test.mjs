import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import * as cheerio from 'cheerio';
import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

test('sitemap contains each indexed canonical URL exactly once', async () => {
  const xml = await readFile(path.join(process.cwd(), 'dist/sitemap.xml'), 'utf8');
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = $('url > loc').map((_, element) => $(element).text()).get();
  const expected = (await loadSeoRoutes()).map((route) => route.canonical);
  assert.deepEqual([...urls].sort(), [...expected].sort());
  assert.equal(new Set(urls).size, urls.length);
});

test('robots allows crawling and advertises the sitemap', async () => {
  const robots = await readFile(path.join(process.cwd(), 'dist/robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/lekeopen\.com\/sitemap\.xml$/m);
});

test('static 404 page is excluded from search', async () => {
  const html = await readFile(path.join(process.cwd(), 'dist/404.html'), 'utf8');
  const $ = cheerio.load(html);
  assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow');
  assert.match($('body').text(), /页面未找到/);
  assert.equal($('a[href="/"]').length, 1);
});
