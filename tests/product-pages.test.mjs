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
  assert.doesNotMatch($('main').text(), /正在读取下载统计|下载统计暂不可用/);

  assert.equal($('[data-download-featured="windows-modern-x64"]').length, 1);
  assert.match($('[data-download-featured]').text(), /推荐/);
  assert.match($('[data-download-featured]').text(), /下载 Windows 10\/11 版/);
  assert.equal($('details[data-legacy-downloads]').attr('open'), undefined);
  assert.equal($('details[data-legacy-downloads] a[href$=".exe"]').length, 2);
  assert.match($('details[data-legacy-downloads]').text(), /已结束安全维护/);

  const quickStart = $('#quick-start');
  assert.equal(quickStart.length, 1);
  assert.match(quickStart.text(), /粘贴或导入学生名单/);
  assert.match(quickStart.text(), /选择每次抽取人数/);
  assert.match(quickStart.text(), /点击“点名”或按空格键/);

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
  assert.equal(video.closest('[data-product-hero-media]').length, 1);
  assert.equal(quickStart.prev('section').is('[data-product-hero]'), true);
  assert.equal($('main').text().includes('课堂点名主界面'), false);
  assert.equal($('main').text().includes('名单管理'), false);

  const installHelp = $('#windows-install-help');
  assert.equal(installHelp.length, 1);
  assert.match(installHelp.text(), /更多信息/);
  assert.match(installHelp.text(), /仍要运行/);
  assert.match(installHelp.text(), /不需要、也不建议关闭/);
  assert.doesNotMatch(installHelp.text(), /请关闭杀毒软件/);
  assert.equal(installHelp.find('a[href="https://github.com/lekeopen/leke-picker/issues/new"]').length, 1);
  assert.equal(installHelp.find('a[href="/support/?product=leke-picker"]').length, 1);
  assert.match($('main').text(), /Mac、Linux 和平板用户可直接使用在线版/);
  assert.match($('main').text(), /目前不提供 Mac、Linux 或平板安装版/);
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
  assert.equal($('[data-legacy-downloads]').length, 0);

  const video = $('video[aria-label="归个类产品演示视频"]');
  assert.equal(video.length, 1);
  assert.equal(video.is('[controls]'), true);
  assert.equal(video.attr('preload'), 'metadata');
  assert.equal(video.attr('poster'), '/images/products/guigelei/overview.webp');
  assert.equal(video.attr('autoplay'), undefined);
  assert.equal(
    video.find('source[type="video/mp4"]').attr('src'),
    '/videos/products/guigelei/guigelei-horizontal-website-final-v5.mp4',
  );
  assert.equal(video.closest('[data-product-hero-media]').length, 1);
  assert.equal($('[data-product-gallery]').length, 0);
  assert.equal($('main').text().includes('整理工作台'), false);
  assert.equal($('main').text().includes('内置整理方案'), false);
});

test('产品目录为两款正式 App 展示各自图标', async () => {
  const $ = await loadPage('products');

  assert.equal($('img[src="/images/products/leke-picker/icon.webp"][alt="乐可点名图标"]').length, 1);
  assert.equal($('img[src="/images/products/guigelei/icon.webp"][alt="归个类图标"]').length, 1);
});

test('乐可点名首屏使用官网浅色品牌视觉', async () => {
  const $ = await loadPage('products/leke-picker');
  const hero = $('[data-product-hero]');

  assert.match(hero.attr('class') ?? '', /bg-gradient-to-br/);
  assert.doesNotMatch(hero.attr('class') ?? '', /bg-gray-950|bg-black/);
  assert.match(hero.find('h1').attr('class') ?? '', /text-gray-950/);
});
