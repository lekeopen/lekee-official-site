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
  const endpoint = await read('functions/api/wechat-js-signature.ts');
  const core = await read('functions/wechat-signature-core.ts');
  const main = await read('src/main.tsx');

  assert.match(core, /WECHAT_APP_SECRET/);
  assert.match(core, /WECHAT_APP_ID/);
  assert.match(core, /jsapi_ticket/);
  assert.match(core, /cachedJsapiTicket/);
  assert.match(core, /sha1/i);
  assert.match(endpoint, /createWechatJsSignatureResponse/);
  assert.doesNotMatch(main, /WECHAT_APP_SECRET/);
});

test('production build emits a Pages advanced-mode worker for the share API', async () => {
  const packageJson = await read('package.json');
  const buildWorker = await read('scripts/build-pages-worker.mjs');
  const worker = await read('functions/worker.ts');

  assert.match(packageJson, /build:pages-worker/);
  assert.match(buildWorker, /dist\/_worker\.js/);
  assert.equal(worker.includes("'/api/wechat-js-signature'"), true);
  assert.equal(worker.includes('env.ASSETS.fetch'), true);
});
