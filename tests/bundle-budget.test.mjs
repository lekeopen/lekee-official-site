import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertBundleBudget,
  readInitialEntry,
} from '../scripts/check-bundle-budget.mjs';

async function createBuild(entryBytes) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-bundle-'));
  const assetsDir = path.join(rootDir, 'dist', 'assets');
  await mkdir(assetsDir, { recursive: true });
  await writeFile(
    path.join(rootDir, 'dist', 'index.html'),
    '<script type="module" crossorigin src="/assets/index-test.js"></script>',
  );
  await writeFile(path.join(assetsDir, 'index-test.js'), 'x'.repeat(entryBytes));
  await writeFile(path.join(assetsDir, 'Home-route.js'), 'y'.repeat(entryBytes * 2));
  await writeFile(path.join(assetsDir, 'index-test.js.map'), 'z'.repeat(entryBytes * 3));
  return rootDir;
}

test('reports only the initial module script referenced by index.html', async (t) => {
  const rootDir = await createBuild(1234);
  t.after(() => rm(rootDir, { recursive: true, force: true }));

  assert.deepEqual(await readInitialEntry(rootDir), {
    assetPath: 'assets/index-test.js',
    bytes: 1234,
  });
});

test('rejects an initial entry above the configured budget', async (t) => {
  const rootDir = await createBuild(101);
  t.after(() => rm(rootDir, { recursive: true, force: true }));

  await assert.rejects(
    assertBundleBudget(rootDir, 100),
    /101 bytes exceeds the 100-byte budget/,
  );
});

test('the canonical verification gate checks the freshly built bundle', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.match(packageJson.scripts.verify, /npm run build && npm run check:bundle$/);
});
