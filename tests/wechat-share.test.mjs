import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('WeChat share hook loads the JS SDK and registers timeline share data', async () => {
  const source = await read('src/hooks/useWechatShare.ts');

  assert.match(source, /res\.wx\.qq\.com\/open\/js\/jweixin-1\.6\.0\.js/);
  assert.match(source, /updateTimelineShareData/);
  assert.match(source, /updateAppMessageShareData/);
  assert.match(source, /\/api\/wechat-js-signature/);
});

test('news detail page registers per-article WeChat share metadata', async () => {
  const source = await read('src/pages/NewsDetail.tsx');

  assert.match(source, /useWechatShare/);
  assert.match(source, /title:\s*newsItem\.title/);
  assert.match(source, /desc:\s*summary/);
  assert.match(source, /imgUrl:\s*absoluteImageUrl\(newsItem\.cover\)/);
});

test('WeChat signature endpoint keeps app secret on the server side', async () => {
  const endpoint = await read('functions/api/wechat-js-signature.js');
  const main = await read('src/main.tsx');

  assert.match(endpoint, /WECHAT_APP_SECRET/);
  assert.match(endpoint, /WECHAT_APP_ID/);
  assert.match(endpoint, /jsapi_ticket/);
  assert.match(endpoint, /cachedJsapiTicket/);
  assert.match(endpoint, /sha1/i);
  assert.match(endpoint, /onRequestGet/);
  assert.doesNotMatch(main, /WECHAT_APP_SECRET/);
});

test('production build exposes a standard Pages Function for the share API', async () => {
  const endpoint = await read('functions/api/wechat-js-signature.js');
  const routes = await read('public/_routes.json');

  assert.match(endpoint, /function onRequestGet\(context\)/);
  assert.match(endpoint, /WECHAT_APP_SECRET/);
  assert.match(endpoint, /jsapi_ticket/);
  assert.match(routes, /"include":\s*\["\/api\/\*"\]/);
});
