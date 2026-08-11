import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as cheerio from 'cheerio';

test('产品与项目页优先展示两款正式产品并保留工程项目入口', async () => {
  const html = await readFile(new URL('../dist/products/index.html', import.meta.url), 'utf8');
  const $ = cheerio.load(html);

  const productSection = $('[aria-labelledby="official-products-title"]');
  assert.equal(productSection.length, 1);
  assert.equal(productSection.find('a[href="/products/leke-picker/"]').length, 1);
  assert.equal(productSection.find('a[href="/products/guigelei/"]').length, 1);
  assert.match(productSection.text(), /Windows/);
  assert.match(productSection.text(), /macOS/);

  const projectsSection = $('[aria-labelledby="engineering-projects-title"]');
  assert.equal(projectsSection.length, 1);
  assert.ok(projectsSection.find('a[href^="/projects/"]').length >= 1);
});
