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
  const releaseData = JSON.parse(await readFile(path.join(rootDir, 'src', 'products', 'releases.json'), 'utf8'));
  const visibleReleases = releaseData['leke-picker'].releases.slice(0, 3);

  assert.equal($('h1').length, 1);
  assert.match($('h1').text(), /乐可点名/);
  const onlineLink = $('a[href="/products/leke-picker/app/"]');
  assert.equal(onlineLink.text().trim(), '立即在线使用');
  assert.equal(onlineLink.attr('target'), '_blank');
  assert.equal(onlineLink.attr('rel'), 'noopener noreferrer');
  assert.match($('main').text(), /Windows 下载/);
  assert.match($('main').text(), /版本与系统要求/);
  assert.match($('main').text(), /名单只在本机处理和保存/);
  assert.match($('main').text(), /常见问题/);
  assert.doesNotMatch($('main').text(), /正在读取下载统计|下载统计暂不可用/);

  assert.equal($('[data-download-featured="windows-modern-x64"]').length, 1);
  const storeLink = $('[data-download-store="microsoft"]');
  assert.equal(storeLink.length, 1);
  assert.equal(storeLink.attr('href'), 'https://apps.microsoft.com/detail/9P8078B19P1H');
  assert.equal(storeLink.attr('target'), '_blank');
  assert.equal(storeLink.attr('rel'), 'noopener noreferrer');
  assert.match(storeLink.text(), /Microsoft Store/);
  assert.match($('[data-download-featured]').text(), /推荐.*自动更新/s);
  assert.match($('[data-download-featured]').text(), /推荐/);
  assert.match($('[data-download-featured]').text(), /Windows 10\/11 版/);
  assert.match($('[data-download-featured]').text(), /下载安装包/);
  assert.equal($('[data-download-featured] a').filter((_, element) => $(element).text().includes('GitHub 备用下载')).length, 1);
  assert.equal($('details[data-legacy-downloads]').attr('open'), undefined);
  assert.equal($('details[data-legacy-downloads] a[href^="/api/download?product=leke-picker&asset="]').length, 2);
  assert.equal($('details[data-legacy-downloads] a[href^="https://github.com/"][href$=".exe"]').length, 2);
  assert.equal($('details[data-legacy-downloads] a').filter((_, element) => $(element).text().includes('GitHub 备用下载')).length, 2);
  assert.match($('details[data-legacy-downloads]').text(), /已结束安全维护/);

  const quickStart = $('#quick-start');
  assert.equal(quickStart.length, 1);
  assert.match(quickStart.text(), /粘贴或导入学生名单/);
  assert.match(quickStart.text(), /选择每次抽取人数/);
  assert.match(quickStart.text(), /点击“点名”或按空格键/);

  const video = $('video[aria-label="乐可点名 v1.1.2 产品演示视频"]');
  assert.equal(video.length, 1);
  assert.equal(video.is('[controls]'), true);
  assert.equal(video.attr('preload'), 'metadata');
  assert.equal(video.attr('poster'), '/images/products/leke-picker/main.webp');
  assert.equal(video.attr('autoplay'), undefined);
  assert.equal(
    video.find('source[type="video/mp4"]').attr('src'),
    '/videos/products/leke-picker/leke-picker-v1.1.2-official-website-promo-natural-voice.mp4',
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
  assert.equal(installHelp.find('a[href="/support/?product=leke-picker"]').length, 0);
  assert.match(installHelp.text(), /问题反馈与使用帮助/);
  assert.doesNotMatch(installHelp.text(), /单独打开反馈页/);
  assert.match($('main').text(), /Mac、Linux 和平板用户可直接使用在线版/);
  assert.match($('main').text(), /目前不提供 Mac、Linux 或平板安装版/);

  const releaseHistory = $('[data-release-history]');
  assert.equal(releaseHistory.length, 1);
  assert.equal(releaseHistory.find('[data-release]').length, visibleReleases.length);
  for (const release of visibleReleases) {
    assert.match(releaseHistory.text(), new RegExp(`v${release.version.replaceAll('.', '\\.')}`));
  }
});

test('乐可点名下载统计跟随当前产品版本且只统计本版本安装包', async () => {
  const source = await readFile(new URL('../src/pages/LekePickerProduct.tsx', import.meta.url), 'utf8');
  assert.match(source, /tag:\s*`v\$\{product\.version\}`/);
  assert.doesNotMatch(source, /tag:\s*'v1\.1\.0'/);
  assert.match(source, /allowedAssets:\s*\[product\.downloads\[0\]\.assetName\]/);
});

test('微软商店推荐状态由商店核验版本与当前正式版本共同决定', async () => {
  const catalog = await readFile(new URL('../src/products/catalog.ts', import.meta.url), 'utf8');
  assert.match(catalog, /getMicrosoftStoreChannel\(pickerRelease\.version\)/);
  assert.doesNotMatch(catalog, /status:\s*'verified'/);
});

test('归个类产品页提供受控国内下载和已冻结的 GitHub 备用下载', async () => {
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
  const domesticUrl = '/api/download?product=guigelei&asset=macos-arm64';
  assert.equal($(`a[href="${domesticUrl}"]`).length, 1);
  assert.equal($(`a[href="${download.url}"]`).length, 1);
  assert.match($('#downloads').text(), /国内高速下载/);
  assert.match($('#downloads').text(), /GitHub 备用下载/);
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
