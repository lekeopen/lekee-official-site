import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

test('release data is the shared product and SEO release source', async () => {
  const releases = JSON.parse(await readFile(new URL('../src/products/releases.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(releases['leke-picker'].assets).length, 3);
  assert.equal(Object.keys(releases.guigelei.assets).length, 1);

  const routes = await loadSeoRoutes();
  assert.equal(
    routes.find((route) => route.path === '/products/leke-picker').software.version,
    releases['leke-picker'].version,
  );
  assert.equal(
    routes.find((route) => route.path === '/products/guigelei').software.version,
    releases.guigelei.version,
  );
});
