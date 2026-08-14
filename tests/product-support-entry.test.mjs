import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const products = [
  ['src/pages/LekePickerProduct.tsx', 'leke-picker'],
  ['src/pages/GuigeleiProduct.tsx', 'guigelei'],
];

test('product pages expose one ordinary-user support trigger without a duplicate standalone link', () => {
  for (const [file, slug] of products) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, new RegExp(`<SupportDialog productId="${slug}"`));
    assert.doesNotMatch(source, /单独打开反馈页/);
  }
});

test('support dialog uses product-aware help copy and retains the full-page fallback', () => {
  const source = fs.readFileSync('src/components/support/SupportDialog.tsx', 'utf8');
  assert.match(source, /问题反馈与使用帮助/);
  assert.match(source, /乐可点名/);
  assert.match(source, /归个类/);
  assert.match(source, /帮助与反馈/);
  assert.match(source, /打开完整反馈页/);
  assert.match(source, /\/support\/\?product=/);
});
