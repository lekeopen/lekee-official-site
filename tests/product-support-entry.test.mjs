import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
test('product pages link to preselected support form',()=>{for(const [file,slug] of [['src/pages/LekePickerProduct.tsx','leke-picker'],['src/pages/GuigeleiProduct.tsx','guigelei']]){const source=fs.readFileSync(file,'utf8');assert.match(source,new RegExp(`/support/\\?product=${slug}`));}});
