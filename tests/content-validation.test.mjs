import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateContent } from '../scripts/validate-content.mjs';

const createFixtureRoot = async (files) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'leke-content-validation-'));

  await Promise.all(Object.entries(files).map(async ([relativePath, content]) => {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }));

  return root;
};

test('reports missing required news fields', async () => {
  const root = await createFixtureRoot({
    'content/news/missing-title.md': `---
date: '2026-07-21'
category: Engineering
summary: Missing a title
status: published
---
Body
`,
  });

  const errors = await validateContent(root);

  assert.deepEqual(errors, ['content/news/missing-title.md: missing title']);
});

test('accepts valid news and project files', async () => {
  const root = await createFixtureRoot({
    'content/news/valid-news.md': `---
title: Valid news
date: '2026-07-21'
category: Engineering
summary:
  - A valid summary
status: published
---
Body
`,
    'content/projects/valid-project.md': `---
name: Valid project
subtitle: Stable project
status: Production
publishStatus: published
summary: A valid project summary
category: Platform
tech_stack:
  - TypeScript
---
Body
`,
  });

  const errors = await validateContent(root);

  assert.deepEqual(errors, []);
});

test('reports invalid enumerated statuses and malformed tech stacks', async () => {
  const root = await createFixtureRoot({
    'content/news/invalid-status.md': `---
title: Invalid news
date: not-a-date
category: Engineering
summary: Invalid status
status: archived
---
Body
`,
    'content/projects/invalid-project.md': `---
name: Invalid project
subtitle: Invalid metadata
status: Retired
publishStatus: hidden
summary: Invalid project metadata
category: Platform
tech_stack: TypeScript
---
Body
`,
  });

  const errors = await validateContent(root);

  assert.deepEqual(errors, [
    'content/news/invalid-status.md: invalid date "not-a-date"',
    'content/news/invalid-status.md: invalid status "archived"',
    'content/projects/invalid-project.md: invalid publishStatus "hidden"',
    'content/projects/invalid-project.md: invalid status "Retired"',
    'content/projects/invalid-project.md: tech_stack must be a non-empty array',
  ]);
});
