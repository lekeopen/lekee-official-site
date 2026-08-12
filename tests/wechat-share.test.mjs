import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('news detail page relies on server-rendered OG metadata for WeChat link cards', async () => {
  const source = await read('src/pages/NewsDetail.tsx');

  assert.match(source, /<SEOMeta/);
  assert.match(source, /title=\{`\$\{newsItem\.title\} \| 乐可开源`\}/);
  assert.match(source, /description=\{summary\}/);
  assert.match(source, /image=\{newsItem\.cover\}/);
});

test('SEO metadata includes Open Graph fields used by social link cards', async () => {
  const source = await read('src/components/common/SEOMeta.tsx');

  assert.match(source, /og:title/);
  assert.match(source, /og:description/);
  assert.match(source, /og:image/);
  assert.match(source, /og:image:width/);
  assert.match(source, /og:image:height/);
  assert.match(source, /twitter:card/);
});

test('WeChat link-card support does not depend on JS-SDK signing', async () => {
  const newsDetail = await read('src/pages/NewsDetail.tsx');
  const main = await read('src/main.tsx');

  assert.doesNotMatch(newsDetail, /useWechatShare/);
  assert.doesNotMatch(newsDetail, /wechat-js-signature/);
  assert.doesNotMatch(main, /WECHAT_APP_SECRET/);
});
