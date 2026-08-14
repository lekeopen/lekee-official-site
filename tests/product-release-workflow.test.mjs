import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/product-release-monitor.yml', import.meta.url),
  'utf8',
);

test('release monitor runs in GitHub on a schedule and manually', () => {
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s*['"]\*\/15 \* \* \* \*['"]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /node-version:\s*24/);
});

test('release monitor verifies before its narrowly scoped commit', () => {
  assert.match(workflow, /npm run products:releases:check/);
  assert.match(workflow, /npm run verify/);
  assert.match(workflow, /git add -- src\/products\/releases\.json/);
  assert.match(workflow, /git diff --cached --name-only/);
  assert.match(workflow, /git push origin HEAD:main/);
  assert.match(workflow, /contents:\s*write/);
});

test('release monitor contains no search submission or unrelated deployment writes', () => {
  assert.doesNotMatch(workflow, /seo:submit|IndexNow|Baidu|百度/i);
  assert.doesNotMatch(workflow, /wrangler|cloudflare|deploy/i);
});

test('release monitor mirrors to OSS before publishing release data and supports dry-run dispatch', () => {
  assert.match(workflow, /inputs:[\s\S]*dry_run:[\s\S]*type: boolean/);
  assert.match(workflow, /ALIYUN_OSS_ACCESS_KEY_ID:.*secrets\.ALIYUN_OSS_ACCESS_KEY_ID/);
  assert.match(workflow, /ALIYUN_OSS_ACCESS_KEY_SECRET:.*secrets\.ALIYUN_OSS_ACCESS_KEY_SECRET/);
  const mirrorIndex = workflow.indexOf('Mirror verified release assets');
  const verifyIndex = workflow.indexOf('Verify website');
  assert.ok(mirrorIndex > 0 && verifyIndex > mirrorIndex);
  assert.doesNotMatch(workflow, /ossutil\s+rm|--delete|DeleteObject/);
});
