import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const background = await readFile(
  new URL('../src/components/ui/TechBackground.tsx', import.meta.url),
  'utf8',
);
const home = await readFile(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8');
const news = await readFile(new URL('../src/pages/News.tsx', import.meta.url), 'utf8');
const products = await readFile(
  new URL('../src/pages/Products.tsx', import.meta.url),
  'utf8',
);

test('the animated background respects device and page lifecycle limits', () => {
  assert.match(background, /prefers-reduced-motion: reduce/);
  assert.match(background, /window\.innerWidth < 768 \? 32 : 60/);
  assert.match(background, /cancelAnimationFrame\(animationFrame\)/);
  assert.match(background, /visibilitychange/);
  assert.match(background, /document\.hidden/);
});

test('below-the-fold card images use lazy asynchronous decoding hints', () => {
  for (const source of [home, news, products]) {
    assert.match(source, /loading="lazy"/);
    assert.match(source, /decoding="async"/);
    assert.match(source, /width=\{640\}/);
    assert.match(source, /height=\{384\}/);
  }
});
