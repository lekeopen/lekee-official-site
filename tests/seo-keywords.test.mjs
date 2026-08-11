import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadSeoKeywordMap, validateSeoKeywordMap } from '../scripts/validate-seo-keywords.mjs';
import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const createFixtureRoot = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-keywords-'));
  await mkdir(path.join(root, 'content/news'), { recursive: true });
  await mkdir(path.join(root, 'content/projects'), { recursive: true });
  await writeFile(path.join(root, 'content/news/draft.md'), `---
title: Draft update
date: '2026-08-11'
category: Project
summary: Draft update
status: draft
---
Draft
`);
  return root;
};

test('keyword map covers the required public routes without validation errors', async () => {
  const keywordMap = await loadSeoKeywordMap(repositoryRoot);
  const errors = await validateSeoKeywordMap({ rootDir: repositoryRoot, keywordMap });
  const publicRoutes = await loadSeoRoutes(repositoryRoot);
  const configuredPaths = new Set(keywordMap.records.map((record) => record.path));

  assert.deepEqual(errors, []);
  for (const route of publicRoutes) {
    assert.ok(configuredPaths.has(route.path), `missing keyword governance for ${route.path}`);
  }
  for (const pathName of ['/', '/services', '/products', '/solutions']) {
    assert.ok(configuredPaths.has(pathName), `missing required route ${pathName}`);
  }
});

test('keyword map reports duplicate intent, self-links, and unpublished route references', async () => {
  const root = await createFixtureRoot();
  const records = (await loadSeoRoutes(root)).map((route, index) => ({
    path: route.path,
    primaryIntent: `Intent ${index + 1}`,
    supportingTerms: [],
    relatedPaths: [],
  }));
  Object.assign(records.find((record) => record.path === '/'), {
    primaryIntent: 'AI engineering',
    relatedPaths: ['/'],
  });
  Object.assign(records.find((record) => record.path === '/services'), {
    primaryIntent: 'AI engineering',
    relatedPaths: ['/news/draft'],
  });
  const errors = await validateSeoKeywordMap({
    rootDir: root,
    keywordMap: {
      version: 1,
      records,
    },
  });

  assert.deepEqual(errors, [
    '/: relatedPaths must not include its own path',
    '/services: related path "/news/draft" is not a public route',
    'primaryIntent "AI engineering" is shared without sharedIntentReason for: /, /services',
  ]);
});

test('validator reports a missing public route from the keyword map', async () => {
  const root = await createFixtureRoot();
  const publicRoutes = await loadSeoRoutes(root);
  const keywordMap = {
    version: 1,
    records: publicRoutes
      .filter((route) => route.path !== '/solutions')
      .map((route, index) => ({
        path: route.path,
        primaryIntent: `Intent ${index + 1}`,
        supportingTerms: [],
        relatedPaths: [],
      })),
  };

  const errors = await validateSeoKeywordMap({ rootDir: root, keywordMap });

  assert.deepEqual(errors, ['missing keyword record for public route "/solutions"']);
});

test('paired project and news content link naturally to each other\'s canonical route', async () => {
  const pairs = [
    ['content/projects/lejiaoku-platform.md', /\[[^\]]*乐教库[^\]]*\]\(\/news\/lejiaoku-refactor\/\)/u, '乐教库项目页'],
    ['content/news/lejiaoku-refactor.md', /\[[^\]]*乐教库[^\]]*\]\(\/projects\/lejiaoku-platform\/\)/u, '乐教库动态页'],
    ['content/projects/leke-insight.md', /\[[^\]]*乐可观澜[^\]]*\]\(\/news\/2026-07-21-leke-insight\/\)/u, '乐可观澜项目页'],
    ['content/news/2026-07-21-leke-insight.md', /\[[^\]]*乐可观澜[^\]]*\]\(\/projects\/leke-insight\/\)/u, '乐可观澜动态页'],
    ['content/projects/xiaole-agent.md', /\[[^\]]*小乐[^\]]*\]\(\/news\/xiaole-ai-iteration\/\)/u, '小乐项目页'],
    ['content/news/xiaole-ai-iteration.md', /\[[^\]]*小乐[^\]]*\]\(\/projects\/xiaole-agent\/\)/u, '小乐动态页'],
    ['content/news/2025-12-18-xiaole-stage-update.md', /\[[^\]]*小乐[^\]]*\]\(\/projects\/xiaole-agent\/\)/u, '小乐阶段说明'],
  ];

  for (const [relativePath, expectedLink, label] of pairs) {
    const source = await readFile(path.join(repositoryRoot, relativePath), 'utf8');
    assert.match(source, expectedLink, `${label} should use a descriptive internal link`);
  }
});
