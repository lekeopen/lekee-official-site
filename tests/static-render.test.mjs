import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
