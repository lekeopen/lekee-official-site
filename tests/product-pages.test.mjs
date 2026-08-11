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
});

test('归个类产品页提供已冻结的公开 DMG 下载', async () => {
  const $ = await loadPage('products/guigelei');

  assert.equal($('h1').length, 1);
  assert.match($('h1').text(), /归个类/);
  assert.match($('main').text(), /macOS 12/);
  assert.match($('main').text(), /Apple Silicon/);
  assert.match($('main').text(), /不读取文件正文/);
  assert.equal(
    $('a[href="https://github.com/lekeopen/guigelei-releases/releases/download/v1.5.0/guigelei-1.5.0-arm64.dmg"]').length,
    1,
  );
  assert.doesNotMatch($('main').text(), /即将开放|公开发布仓库完成后/);
  assert.equal($('a[href*="ai-file-organizer"]').length, 0);
});
