import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalUrls,
  notificationDelta,
  parseSitemap,
} from '../tools/seo-ops/src/inventory.mjs';

test('canonicalUrls keeps sorted unique production canonicals without queries', () => {
  assert.deepEqual(canonicalUrls([
    { canonical: 'https://lekeopen.com/news/b/' },
    { canonical: 'https://lekeopen.com/news/a/#fragment' },
    { canonical: 'https://lekeopen.com/news/a/' },
    { canonical: 'https://lekeopen.com/news/a/?page=2' },
    { canonical: 'https://example.com/news/c/' },
  ]), [
    'https://lekeopen.com/news/a/',
    'https://lekeopen.com/news/b/',
  ]);
});

test('parseSitemap returns canonical loc values and excludes invalid variants', () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset>
      <url><loc>https://lekeopen.com/news/b/</loc></url>
      <url><loc>https://lekeopen.com/news/a/#fragment</loc></url>
      <url><loc>https://lekeopen.com/news/a/?page=2</loc></url>
      <url><loc>https://example.com/news/c/</loc></url>
    </urlset>`;

  assert.deepEqual(parseSitemap(sitemap), [
    'https://lekeopen.com/news/a/',
    'https://lekeopen.com/news/b/',
  ]);
});

test('parseSitemap rejects malformed XML and invalid sitemap structures', () => {
  const url = 'https://lekeopen.com/news/a/';
  const invalidDocuments = [
    `<urlset><url><loc>${url}</loc></url>`,
    `<urlset><url><loc>${url}</url></loc></urlset>`,
    `<sitemapindex><sitemap><loc>${url}</loc></sitemap></sitemapindex>`,
    `<urlset><loc>${url}</loc></urlset>`,
    '<urlset><url></url></urlset>',
    `<urlset>unexpected text<url><loc>${url}</loc></url></urlset>`,
    `<urlset><![CDATA[unexpected text]]><url><loc>${url}</loc></url></urlset>`,
    `<urlset><url><loc><x>${url}</x></loc></url></urlset>`,
    `<urlset><url><loc>${url}</loc></url></urlset><?xml version="1.0"?>`,
    `<?xml version="1.0"?><urlset><?xml version="1.0"?><url><loc>${url}</loc></url></urlset>`,
    `<urlset><?audit invalid?><url><loc>${url}</loc></url></urlset>`,
    `<urlset><url><loc>${url}<?audit invalid?></loc></url></urlset>`,
    `<!DOCTYPE urlset><urlset><url><loc>${url}</loc></url></urlset>`,
  ];

  for (const xml of invalidDocuments) {
    assert.throws(() => parseSitemap(xml), /valid sitemap XML/i);
  }
});

test('notificationDelta returns canonical URLs absent from successful submissions', () => {
  assert.deepEqual(notificationDelta(
    ['https://lekeopen.com/', 'https://lekeopen.com/news/a/'],
    ['https://lekeopen.com/'],
  ), ['https://lekeopen.com/news/a/']);
});

test('canonical URLs use the shared trailing-slash form for inventory and submission delta', () => {
  assert.deepEqual(canonicalUrls([
    { canonical: 'https://lekeopen.com/news/a' },
    { canonical: 'https://lekeopen.com/news/a/' },
  ]), ['https://lekeopen.com/news/a/']);
  assert.deepEqual(notificationDelta(
    ['https://lekeopen.com/news/a/'],
    ['https://lekeopen.com/news/a'],
  ), []);
});
