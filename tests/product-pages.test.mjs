import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import * as cheerio from 'cheerio';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);

async function loadPage(route) {
  const html = await readFile(path.join(rootDir, 'dist', route, 'index.html'), 'utf8');
  return cheerio.load(html);
}

test('乐可点名产品页提供在线使用、下载、隐私和版本信息', async () => {
  const $ = await loadPage('products/leke-picker');

  assert.equal($('h1').length, 1);
  assert.match($('h1').text(), /乐可点名/);
  assert.equal($('a[href="/products/leke-picker/app/"]').text().trim(), '立即在线使用');
  assert.match($('main').text(), /Windows 下载/);
  assert.match($('main').text(), /版本与系统要求/);
  assert.match($('main').text(), /名单只在本机处理和保存/);
  assert.match($('main').text(), /常见问题/);
  assert.match($('main').text(), /先看一分钟，了解乐可点名/);

  const video = $('video[aria-label="乐可点名 v1.1 产品演示视频"]');
  assert.equal(video.length, 1);
  assert.equal(video.is('[controls]'), true);
  assert.equal(video.attr('preload'), 'metadata');
  assert.equal(video.attr('poster'), '/images/products/leke-picker/main.webp');
  assert.equal(video.attr('autoplay'), undefined);
  assert.equal(
    video.find('source[type="video/mp4"]').attr('src'),
    '/videos/products/leke-picker/leke-picker-v1.1-horizontal-natural-voice-final.mp4',
  );
  assert.equal(
    $('#picker-demo-title').closest('section').next('section').attr('aria-labelledby'),
    'picker-value-title',
  );
  assert.equal($('main').text().includes('课堂点名主界面'), false);
  assert.equal($('main').text().includes('名单管理'), false);
});

test('归个类产品页提供已冻结的公开 DMG 下载', async () => {
  const $ = await loadPage('products/guigelei');

  const releaseData = JSON.parse(await readFile(path.join(rootDir, 'src', 'products', 'releases.json'), 'utf8'));
  const release = releaseData.guigelei;
  const download = release.assets['macos-arm64'];

  assert.equal($('h1').length, 1);
  assert.match($('h1').text(), /归个类/);
  assert.match($('main').text(), new RegExp(`v${release.version.replaceAll('.', '\\.')}`));
  assert.match($('main').text(), /macOS 12/);
  assert.match($('main').text(), /Apple Silicon/);
  assert.match($('main').text(), /不读取文件正文/);
  assert.equal(
    $(`a[href="${download.url}"]`).length,
    1,
  );
  assert.equal($(`a[href="${release.releaseUrl}"]`).length, 1);
  assert.equal($('main').text().includes('查看更新记录'), false);
  assert.doesNotMatch($('main').text(), /即将开放|公开发布仓库完成后/);
  assert.equal($('a[href*="ai-file-organizer"]').length, 0);
});
