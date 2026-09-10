import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL(
  '../.github/workflows/acme-cdn-renewal.yml',
  import.meta.url,
);

async function loadWorkflow() {
  return readFile(workflowUrl, 'utf8');
}

test('certificate renewal runs on a bounded schedule and supports manual checks', async () => {
  const workflow = await loadWorkflow();

  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s*['"]17 3 1 \* \*['"]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /timeout-minutes:\s*20/);
  assert.match(workflow, /concurrency:/);
});

test('operations guide documents renewal secrets and the fail-closed rollout gate', async () => {
  const guide = await readFile(
    new URL('../docs/operations/secure-app-downloads.md', import.meta.url),
    'utf8',
  );

  assert.match(guide, /CLOUDFLARE_DNS_API_TOKEN/);
  assert.match(guide, /ALIYUN_CDN_ACCESS_KEY_ID/);
  assert.match(guide, /ALIYUN_CDN_ACCESS_KEY_SECRET/);
  assert.match(guide, /acme-cdn-renewal\.yml/);
  assert.match(guide, /DOMESTIC_DOWNLOADS_ENABLED=false/);
  assert.match(guide, /不得.*OSS.*公共读/);
});

test('certificate renewal uses Cloudflare DNS-01 and a pinned acme.sh release', async () => {
  const workflow = await loadWorkflow();

  assert.match(workflow, /CLOUDFLARE_DNS_API_TOKEN:\s*\$\{\{ secrets\.CLOUDFLARE_DNS_API_TOKEN \}\}/);
  assert.match(workflow, /CF_Token:\s*\$\{\{ env\.CLOUDFLARE_DNS_API_TOKEN \}\}/);
  assert.match(workflow, /acmesh-official\/acme\.sh\.git/);
  assert.match(workflow, /--branch\s+3\.1\.5/);
  assert.match(workflow, /--server\s+letsencrypt/);
  assert.match(workflow, /--dns\s+dns_cf/);
  assert.match(workflow, /ACME_DOMAIN:\s*downloads\.lekeopen\.com/);
  assert.match(workflow, /-d\s+"\$ACME_DOMAIN"/);
  assert.doesNotMatch(workflow, /CF_Key|CF_Email|Global API Key/);
});

test('certificate renewal deploys only to the approved Alibaba CDN domain', async () => {
  const workflow = await loadWorkflow();

  assert.match(workflow, /ALIYUN_CDN_ACCESS_KEY_ID:\s*\$\{\{ secrets\.ALIYUN_CDN_ACCESS_KEY_ID \}\}/);
  assert.match(workflow, /ALIYUN_CDN_ACCESS_KEY_SECRET:\s*\$\{\{ secrets\.ALIYUN_CDN_ACCESS_KEY_SECRET \}\}/);
  assert.match(workflow, /Ali_Key:\s*\$\{\{ env\.ALIYUN_CDN_ACCESS_KEY_ID \}\}/);
  assert.match(workflow, /Ali_Secret:\s*\$\{\{ env\.ALIYUN_CDN_ACCESS_KEY_SECRET \}\}/);
  assert.match(workflow, /DEPLOY_ALI_CDN_DOMAIN:\s*downloads\.lekeopen\.com/);
  assert.match(workflow, /--deploy-hook\s+ali_cdn/);
  assert.doesNotMatch(workflow, /ALIYUN_OSS_ACCESS_KEY/);
});

test('certificate workflow avoids artifact and debug leakage', async () => {
  const workflow = await loadWorkflow();

  assert.doesNotMatch(workflow, /upload-artifact|actions\/cache/);
  assert.doesNotMatch(workflow, /--debug|set -x|printenv|envless|env\s*$/m);
  assert.match(workflow, /::add-mask::/);
  assert.match(workflow, /certificate was deployed to Alibaba Cloud CDN/);
});
