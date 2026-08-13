import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const page=fs.readFileSync('src/pages/Support.tsx','utf8'), app=fs.readFileSync('src/App.tsx','utf8');
test('support page exposes accessible ordinary-user form',()=>{assert.match(app,/path="support"/);assert.match(page,/<h1[^>]*>产品帮助与反馈/);for(const text of ['无需 GitHub 账号','support@lekeopen.com','privacyConfirmed','turnstileToken','render=explicit','turnstile.render'])assert.match(page,new RegExp(text));});
test('support page retains the public Turnstile site key when build env is absent',()=>{assert.match(page,/VITE_TURNSTILE_SITE_KEY\s*\|\|\s*['"]0x4AAAAAAEO5t5fiAthUfImF['"]/);});
