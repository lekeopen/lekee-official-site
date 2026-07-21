import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = await readFile(
  new URL('../src/layouts/MainLayout.tsx', import.meta.url),
  'utf8',
);

const pages = [
  'Home',
  'Services',
  'Products',
  'Solutions',
  'About',
  'Contact',
  'NewsDetail',
  'News',
  'ProjectDetail',
  'Privacy',
];

test('every page is loaded through a route-level lazy import', () => {
  for (const page of pages) {
    assert.match(
      app,
      new RegExp(`const ${page} = lazy\\(\\(\\) => import\\('\\./pages/${page}'\\)\\)`),
    );
    assert.doesNotMatch(app, new RegExp(`import ${page} from './pages/${page}'`));
  }
});

test('the persistent layout provides an accessible route fallback', () => {
  assert.match(layout, /import React, \{ Suspense \} from 'react'/);
  assert.match(layout, /<Suspense\s+fallback=/);
  assert.match(layout, /role="status"/);
  assert.match(layout, /页面加载中…/);
  assert.match(layout, /min-h-\[calc\(100vh-5rem\)\]/);
  assert.match(layout, /<Outlet \/>/);
});
