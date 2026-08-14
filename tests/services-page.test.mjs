import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('core service cards use a readable two-column hierarchy without truncating the audience', async () => {
  const source = await readFile('src/pages/Services.tsx', 'utf8');
  assert.match(source, /md:grid-cols-2/);
  assert.doesNotMatch(source, /xl:grid-cols-4/);
  assert.doesNotMatch(source, /substring\(/);
  assert.doesNotMatch(source, /split\('\/'\)\[0\]/);
  assert.match(source, /解决什么问题/);
  assert.match(source, /交付内容/);
  assert.match(source, /适合谁/);
  assert.match(source, /合作方式/);
  assert.match(source, /\{service\.target\}/);
  assert.match(source, /\{service\.cooperation\}/);
});

test('both product FAQs explain the ordinary-user support channel', async () => {
  for (const file of ['src/pages/LekePickerProduct.tsx', 'src/pages/GuigeleiProduct.tsx']) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /遇到使用问题，怎样获得帮助？/);
    assert.match(source, /问题反馈与使用帮助/);
    assert.match(source, /无需 GitHub 账号/);
    assert.match(source, /1–2 个工作日/);
  }
});
