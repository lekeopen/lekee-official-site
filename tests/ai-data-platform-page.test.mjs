import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const routePath = '/projects/ai-data-platform';
const canonical = 'https://lekeopen.com/projects/ai-data-platform/';
const description = 'AI Data Platform 把散落在 Excel、Word、PDF 和图片中的业务资料，整理成可审核、可查询、可追溯的可信数据。';
const assetRoot = '/images/projects/ai-data-platform/';
const screenshots = [
  'ai-data-platform-dashboard.png',
  'ai-data-platform-query.png',
  'ai-data-platform-office-preview.png',
  'ai-data-platform-governance.png',
];
const ogImage = `${assetRoot}ai-data-platform-og.png`;

async function loadBuiltPage(relativePath) {
  const html = await readFile(path.join(rootDir, 'dist', relativePath, 'index.html'), 'utf8');
  return cheerio.load(html);
}

test('AI Data Platform is a published project route with canonical project metadata', async () => {
  const routes = await loadSeoRoutes(rootDir);
  const route = routes.find((item) => item.path === routePath);

  assert.equal(route?.kind, 'project');
  assert.equal(route?.title, 'AI Data Platform | 乐可开源');
  assert.equal(route?.description, description);
  assert.equal(route?.canonical, canonical);
  assert.deepEqual(route?.breadcrumbs.map((item) => item.name), ['首页', '产品与项目', 'AI Data Platform']);
});

test('products index lists AI Data Platform only as an engineering project', async () => {
  const $ = await loadBuiltPage('products');
  const officialProducts = $('[aria-labelledby="official-products-title"]');
  const engineeringProjects = $('[aria-labelledby="engineering-projects-title"]');

  assert.equal(officialProducts.text().includes('AI Data Platform'), false);
  assert.equal(officialProducts.find(`a[href="${routePath}/"]`).length, 0);
  assert.equal(engineeringProjects.find(`a[href="${routePath}/"]`).length, 1);
  assert.match(engineeringProjects.text(), /把分散资料变成可信、可查询、可追溯的数据/);
});

test('AI Data Platform prerendered page communicates the approved scope and CTA', async () => {
  const $ = await loadBuiltPage('projects/ai-data-platform');
  const mainText = $('main').text();

  assert.equal($('h1').text().trim(), 'AI Data Platform');
  assert.equal($('title').text(), 'AI Data Platform | 乐可开源');
  assert.equal($('meta[name="description"]').attr('content'), description);
  assert.equal($('link[rel="canonical"]').attr('href'), canonical);
  assert.equal($('meta[property="og:image"]').attr('content'), `https://lekeopen.com${ogImage}`);
  assert.equal($('meta[name="twitter:card"]').attr('content'), 'summary_large_image');
  assert.match(mainText, /在线体验即将开放/);
  assert.match(mainText, /海川实验学校为虚构演示数据/);
  assert.match(mainText, /当前不是完整资产管理系统/);
  assert.match(mainText, /不替代学校现有系统/);
  assert.match(mainText, /AI 不绕过人工审核/);
  assert.match(mainText, /当前不开放公网在线 Demo/);
  assert.match(mainText, /100 台设备/);
  assert.match(mainText, /635,800 元/);
  assert.match(mainText, /136 条已发布可信数据/);
  assert.equal($('a[href="/contact/"]').filter((_, element) => $(element).text().includes('联系乐可开源')).length, 1);

  const structuredData = JSON.parse($('script[type="application/ld+json"]').text());
  assert.ok(structuredData['@graph'].some((item) => item['@type'] === 'CreativeWork' && item.url === canonical));
  assert.ok(!structuredData['@graph'].some((item) => item['@type'] === 'SoftwareApplication'));
});

test('AI Data Platform page uses each real Demo screenshot in its narrative', async () => {
  const $ = await loadBuiltPage('projects/ai-data-platform');
  const imageSources = $('main img').map((_, element) => $(element).attr('src')).get();

  for (const filename of screenshots) {
    assert.equal(imageSources.filter((src) => src === `${assetRoot}${filename}`).length, 1, `${filename} should appear exactly once`);
  }

  assert.match($(`img[src="${assetRoot}ai-data-platform-dashboard.png"]`).attr('alt') ?? '', /资产总览/);
  assert.match($(`img[src="${assetRoot}ai-data-platform-query.png"]`).attr('alt') ?? '', /查询.*来源/);
  assert.match($(`img[src="${assetRoot}ai-data-platform-office-preview.png"]`).attr('alt') ?? '', /Office.*原文件/);
  assert.match($(`img[src="${assetRoot}ai-data-platform-governance.png"]`).attr('alt') ?? '', /人工审核.*可信/);
});

test('AI Data Platform real screenshots and social image have publishable dimensions', async () => {
  for (const filename of screenshots) {
    const metadata = await sharp(path.join(rootDir, 'public', assetRoot, filename)).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 1440);
    assert.equal(metadata.height, 934);
  }

  const ogMetadata = await sharp(path.join(rootDir, 'public', ogImage)).metadata();
  assert.equal(ogMetadata.format, 'png');
  assert.equal(ogMetadata.width, 1200);
  assert.equal(ogMetadata.height, 630);
});
