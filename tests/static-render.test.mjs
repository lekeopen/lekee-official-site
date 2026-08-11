import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import * as cheerio from 'cheerio';

for (const [route, expected] of [
  ['/', '乐可开源'],
  ['/news/2026-07-21-leke-insight', '乐可观澜项目经营决策驾驶舱上线'],
  ['/projects/leke-insight', '项目经营决策驾驶舱'],
]) {
  test(`generated ${route} contains the rendered React body`, async () => {
    const relative = route === '/' ? 'index.html' : path.join(route.slice(1), 'index.html');
    const html = await readFile(path.join(process.cwd(), 'dist', relative), 'utf8');
    const $ = cheerio.load(html);
    const rootText = $('#root').text();
    assert.match(rootText, new RegExp(expected));
    assert.equal($('#root h1').length, 1);
    assert.doesNotMatch(rootText, /^\s*页面加载中…\s*$/);
  });
}

test('rendered internal links use the indexed canonical trailing-slash URL', async () => {
  const distRoot = path.join(process.cwd(), 'dist');
  const sitemap = await readFile(path.join(distRoot, 'sitemap.xml'), 'utf8');
  const indexedPaths = new Set(
    [...sitemap.matchAll(/<loc>https:\/\/lekeopen\.com([^<]*)<\/loc>/g)].map((match) => match[1]),
  );
  const entries = await readdir(distRoot, { recursive: true, withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.join(entry.parentPath, entry.name));
  const nonCanonicalLinks = [];

  for (const htmlFile of htmlFiles) {
    const $ = cheerio.load(await readFile(htmlFile, 'utf8'));
    for (const element of $('a[href]').toArray()) {
      const href = $(element).attr('href');
      if (!href) continue;

      const url = new URL(href, 'https://lekeopen.com/');
      const canonicalPath = url.pathname === '/' ? '/' : `${url.pathname.replace(/\/+$/, '')}/`;
      if (
        url.origin === 'https://lekeopen.com'
        && indexedPaths.has(canonicalPath)
        && url.pathname !== canonicalPath
      ) {
        nonCanonicalLinks.push(`${path.relative(distRoot, htmlFile)}: ${href}`);
      }
    }
  }

  assert.deepEqual(nonCanonicalLinks, []);
});
