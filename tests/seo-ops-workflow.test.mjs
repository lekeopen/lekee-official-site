import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(
  new URL('../package.json', import.meta.url),
  'utf8',
));
const workflow = await readFile(
  new URL('../.github/workflows/quality.yml', import.meta.url),
  'utf8',
);

test('package scripts expose the complete SEO operations interface', () => {
  assert.equal(packageJson.scripts['seo:inventory'], 'node tools/seo-ops/src/cli.mjs inventory');
  assert.equal(packageJson.scripts['seo:inspect'], 'node tools/seo-ops/src/cli.mjs inspect');
  assert.equal(packageJson.scripts['seo:submit'], 'node tools/seo-ops/src/cli.mjs submit');
  assert.equal(packageJson.scripts['check:seo-keywords'], 'node scripts/validate-seo-keywords.mjs');
  assert.equal(packageJson.scripts['seo:report'], 'node tools/seo-ops/src/cli.mjs report');
});

test('verify includes a deterministic SEO operations gate and keeps live inspection separate', () => {
  assert.match(packageJson.scripts.verify, /(?:^|&&\s*)npm run verify:seo-ops(?:\s*&&|$)/);
  assert.equal(
    packageJson.scripts['verify:seo-ops'],
    'npm run seo:inventory && npm run check:seo-keywords && node --test tests/seo-ops-*.test.mjs',
  );
  assert.doesNotMatch(packageJson.scripts['verify:seo-ops'], /seo:inspect|seo:submit|--execute/);
});

test('quality workflow runs verification without provider writes or credential references', () => {
  assert.match(workflow, /run:\s*npm run verify/);
  assert.doesNotMatch(
    workflow,
    /seo:submit|--execute|BAIDU_(?:SITE|SUBMIT_TOKEN)|INDEXNOW_(?:KEY|KEY_LOCATION)|secrets\./i,
  );
});
