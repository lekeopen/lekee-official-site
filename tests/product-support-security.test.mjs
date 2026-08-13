import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRequestOrigin, verifyTurnstile } from '../functions/support/security.mjs';
import { onRequestPost } from '../functions/api/support.js';
import { deliverFeedbackToLezhi } from '../functions/support/lezhi.mjs';

const payload = { product:'leke-picker',releaseTag:'v1.1.0',environmentId:'windows-modern-x64',issueType:'install',description:'安装之后无法启动应用，请协助排查具体原因。',contact:'teacher@example.com',name:'王老师',privacyConfirmed:true,website:'',turnstileToken:'ok',sourceUrl:'https://lekeopen.com/products/leke-picker/' };

test('Lezhi relay identifies itself as the official website', async () => {
  let headers;
  const result = await deliverFeedbackToLezhi(
    { LEZHI_FEEDBACK_URL:'https://lezhi.example/api/v1/product-feedback', LEZHI_FEEDBACK_TOKEN:'lezhi-secret' },
    { reference:'LK-20260814-01234567' },
    async (_url, options) => {
      headers = options.headers;
      return new Response('{"ok":true,"reference":"LK-20260814-01234567"}', { status:201 });
    },
  );
  assert.equal(result.accepted, true);
  assert.equal(headers['User-Agent'], 'LeKeOpen-Feedback-Relay/1.0');
});

test('checks origin and turnstile response', async () => {
  assert.equal(checkRequestOrigin(new Request('https://lekeopen.com/api/support',{headers:{origin:'https://lekeopen.com'}}), ['https://lekeopen.com']), true);
  assert.equal(checkRequestOrigin(new Request('https://lekeopen.com/api/support',{headers:{origin:'https://evil.example'}}), ['https://lekeopen.com']), false);
  assert.equal(await verifyTurnstile('ok','127.0.0.1','secret',async()=>new Response('{"success":true}')), true);
});

test('only reports success after mail acceptance', async () => {
  const env={ALLOWED_SUPPORT_ORIGINS:'https://lekeopen.com',TURNSTILE_SECRET_KEY:'secret',RESEND_API_KEY:'secret',SUPPORT_MAIL_FROM:'support@lekeopen.com',SUPPORT_MAIL_TO:'support@lekeopen.com',LEZHI_FEEDBACK_URL:'https://lezhi.example/api/v1/product-feedback',LEZHI_FEEDBACK_TOKEN:'lezhi-secret',SUPPORT_RATE_LIMIT:{get:async()=>null,put:async()=>{}}};
  const request=new Request('https://lekeopen.com/api/support',{method:'POST',headers:{origin:'https://lekeopen.com','content-type':'application/json','CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify(payload)});
  const response=await onRequestPost({request,env,waitUntil(){},data:{},next(){},params:{}},{fetchImpl:async(url)=>String(url).includes('turnstile')?new Response('{"success":true}'):String(url).includes('lezhi.example')?new Response('{"ok":true,"duplicate":false,"reference":"LK-20260813-01020304"}',{status:201}):new Response('{"id":"email-id"}'),randomBytes:new Uint8Array([1,2,3,4]),now:new Date('2026-08-13')});
  assert.equal(response.status,201);
  assert.match((await response.json()).reference,/^LK-20260813-/);
});
