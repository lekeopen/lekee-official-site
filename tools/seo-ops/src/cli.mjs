#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadSeoRoutes } from '../../../scripts/seo-routes.mjs';
import { inspectProduction } from './inspect.mjs';
import { canonicalUrls, notificationDelta } from './inventory.mjs';
import { submitProvider } from './providers.mjs';
import { acceptedUrls, loadState } from './state.mjs';

function parseSubmissionOptions(args) {
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');
  if (dryRun && execute) throw new Error('Use either --dry-run or --execute, not both');
  return { dryRun: dryRun || !execute, execute };
}

function providerConfig(provider, env) {
  if (provider === 'baidu') {
    return { site: env.BAIDU_SITE, token: env.BAIDU_SUBMIT_TOKEN };
  }
  return { key: env.INDEXNOW_KEY, keyLocation: env.INDEXNOW_KEY_LOCATION };
}

function writeSummary(output, summary) {
  output(`${summary.provider}: ${summary.status}; URLs: ${summary.urlCount}`);
}

function writeInspection(output, report, json) {
  if (json) {
    output(JSON.stringify(report));
    return;
  }
  output(`SEO inspection: ${report.summary.passed}/${report.summary.total} checks passed; failures: ${report.summary.failed}`);
}

export async function main({
  argv = process.argv.slice(2),
  env = process.env,
  rootDir = process.cwd(),
  output = console.log,
  errorOutput = console.error,
  fetchImpl,
} = {}) {
  const [command, provider, ...flags] = argv;
  if (command === 'inspect') {
    const inspectFlags = [provider, ...flags].filter(Boolean);
    if (inspectFlags.some((flag) => flag !== '--json')) {
      errorOutput('Usage: seo:inspect [--json]');
      throw new Error('Invalid SEO inspection command');
    }
    const report = await inspectProduction({ rootDir, fetchImpl });
    writeInspection(output, report, inspectFlags.includes('--json'));
    return report;
  }

  const routes = await loadSeoRoutes(rootDir);
  const urls = canonicalUrls(routes);

  if (command === 'inventory' && provider === undefined) {
    output(`Eligible canonical URLs: ${urls.length}`);
    urls.forEach((url) => output(url));
    return { status: 'inventory', urlCount: urls.length };
  }

  if (command !== 'submit' || !['baidu', 'indexnow'].includes(provider)) {
    errorOutput('Usage: seo:inventory | seo:submit -- <baidu|indexnow> [--dry-run|--execute]');
    throw new Error('Invalid SEO operations command');
  }

  const options = parseSubmissionOptions(flags);
  const statePath = path.join(rootDir, '.seo-ops', 'state.json');
  const state = await loadState(statePath);
  const pendingUrls = notificationDelta(urls, acceptedUrls(state, provider));
  output(`Eligible canonical URLs: ${urls.length}`);
  output(`URLs pending ${provider}: ${pendingUrls.length}`);
  pendingUrls.forEach((url) => output(url));
  const result = await submitProvider(provider, pendingUrls, {
    ...options,
    config: providerConfig(provider, env),
    statePath,
    fetchImpl,
  });
  writeSummary(output, result);
  return result;
}

const isDirectExecution = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  main().then((result) => {
    if (result?.summary?.releaseBlocking) process.exitCode = 1;
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
