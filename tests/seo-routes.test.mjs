import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { canonicalUrl, loadSeoRoutes } from '../scripts/seo-routes.mjs';

test('canonicalUrl applies the production origin and page trailing slash', () => {
  assert.equal(canonicalUrl('/'), 'https://lekeopen.com/');
  assert.equal(canonicalUrl('news/example'), 'https://lekeopen.com/news/example/');
  assert.equal(canonicalUrl('/news/example/'), 'https://lekeopen.com/news/example/');
});

test('route manifest contains static routes and only published content', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-routes-'));
  await mkdir(path.join(root, 'content/news'), { recursive: true });
  await mkdir(path.join(root, 'content/projects'), { recursive: true });
  await writeFile(path.join(root, 'content/news/published.md'), `---
title: 已发布动态
date: '2026-07-21'
category: Project
summary: 已发布摘要
status: published
cover: /published.png
---
正文
`);
  await writeFile(path.join(root, 'content/news/draft.md'), `---
title: 草稿动态
date: '2026-07-21'
category: Project
summary: 草稿摘要
status: draft
---
正文
`);
  await writeFile(path.join(root, 'content/projects/live.md'), `---
name: 已发布项目
subtitle: 项目副标题
status: Live
publishStatus: published
summary: 项目摘要
category: Platform
tech_stack: [React]
---
正文
`);
  await writeFile(path.join(root, 'content/projects/draft.md'), `---
name: 草稿项目
subtitle: 项目副标题
status: Alpha
publishStatus: draft
summary: 项目摘要
category: Platform
tech_stack: [React]
---
正文
`);

  const routes = await loadSeoRoutes(root);
  const paths = routes.map((route) => route.path);

  assert.ok(paths.includes('/'));
  assert.ok(paths.includes('/services'));
  assert.ok(paths.includes('/news/published'));
  assert.ok(paths.includes('/projects/live'));
  assert.ok(!paths.includes('/news/draft'));
  assert.ok(!paths.includes('/projects/draft'));
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(routes.every((route) => route.canonical === canonicalUrl(route.path)));
});
