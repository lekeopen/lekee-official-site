import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articlePath = path.join(repoRoot, 'tools/wechat-admin/articles/2026-08-10-operations-toolchain.md');
const checklistPath = path.join(repoRoot, 'tools/wechat-admin/articles/2026-08-10-operations-toolchain-publish-checklist.md');

test('published article image references resolve from public assets', () => {
  const article = readFileSync(articlePath, 'utf8');
  const sources = [...article.matchAll(/!\[[^\]]*\]\((\/images\/[^)]+)\)/g)].map((match) => match[1]);

  assert.ok(sources.length > 0, 'article should include at least one image');
  for (const source of sources) {
    assert.equal(existsSync(path.join(repoRoot, 'public', source)), true, `missing public asset: ${source}`);
  }
});

test('publication checklist contains no machine-specific absolute paths', () => {
  const checklist = readFileSync(checklistPath, 'utf8');

  assert.doesNotMatch(checklist, /file:\/\/\/Users\//);
  assert.doesNotMatch(checklist, /\/Users\/[^/]+\//);
});

test('repository root has no temporary images symlink', () => {
  const imagesPath = path.join(repoRoot, 'images');
  assert.equal(existsSync(imagesPath) && lstatSync(imagesPath).isSymbolicLink(), false);
});
