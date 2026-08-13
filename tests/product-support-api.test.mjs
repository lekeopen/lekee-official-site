import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSupportRequest } from '../functions/support/validation.mjs';
import { buildSupportEmail, sendSupportEmail } from '../functions/support/mailer.mjs';

const valid = {
  product: 'leke-picker', version: '1.1.0', system: 'windows-11', issueType: 'install',
  description: '安装后点击启动按钮没有反应，希望协助确认原因。', contact: 'teacher@example.com',
  name: '王老师', privacyConfirmed: true, website: '', turnstileToken: 'token',
};

test('strictly validates support payload', () => {
  assert.equal(parseSupportRequest(valid).ok, true);
  assert.equal(parseSupportRequest({ ...valid, unknown: 'x' }).ok, false);
  assert.equal(parseSupportRequest({ ...valid, description: '短内容' }).ok, false);
  assert.equal(parseSupportRequest({ ...valid, privacyConfirmed: false }).ok, false);
  assert.equal(parseSupportRequest({ ...valid, issueType: 'invalid' }).ok, false);
});

test('uses Resend REST API and requires an accepted message id', async () => {
  let request;
  const result = await sendSupportEmail({
    RESEND_API_KEY: 'secret', SUPPORT_MAIL_FROM: '乐可开源产品支持 <support@lekeopen.com>',
    SUPPORT_MAIL_TO: 'support@lekeopen.com',
  }, { subject: '测试', text: '纯文本' }, async (url, init) => { request={url,init}; return new Response('{"id":"email-id"}'); });
  assert.equal(result.accepted, true);
  assert.equal(request.url,'https://api.resend.com/emails');
  assert.equal(request.init.headers.Authorization,'Bearer secret');
  assert.deepEqual(JSON.parse(request.init.body),{from:'乐可开源产品支持 <support@lekeopen.com>',to:['support@lekeopen.com'],reply_to:'support@lekeopen.com',subject:'测试',text:'纯文本'});
});

test('builds plain text email without header injection', () => {
  const message = buildSupportEmail('LK-20260813-01234567', valid, '2026-08-13T10:00:00Z');
  assert.match(message.subject, /^\[产品反馈\]\[乐可点名\]\[安装问题\]/);
  assert.match(message.text, /teacher@example\.com/);
  assert.equal(message.html, undefined);
  assert.throws(() => buildSupportEmail('BAD\nBcc:x', valid, '2026-08-13T10:00:00Z'));
});
