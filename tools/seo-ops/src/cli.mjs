#!/usr/bin/env node

import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { loadSeoRoutes } from '../../../scripts/seo-routes.mjs';
import { inspectProduction } from './inspect.mjs';
import { canonicalUrls, notificationDelta } from './inventory.mjs';
import { submitProvider } from './providers.mjs';
import { buildMonthlyReport } from './report.mjs';
import { acceptedUrls, loadState } from './state.mjs';

const CREDENTIAL_NAME_PATTERN = /(token|secret|password|authorization|credential|api[_-]?key)/i;

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

function parseReportOptions(args) {
  let inputPath;
  let outputPath;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === '--force') {
      if (force) throw new Error('Usage: seo:report --input <sanitized.json> --output <report.md> [--force]');
      force = true;
      continue;
    }
    if (flag !== '--input' && flag !== '--output') {
      throw new Error('Usage: seo:report --input <sanitized.json> --output <report.md> [--force]');
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--') || (flag === '--input' ? inputPath : outputPath)) {
      throw new Error('Usage: seo:report --input <sanitized.json> --output <report.md> [--force]');
    }
    if (flag === '--input') inputPath = value;
    else outputPath = value;
    index += 1;
  }

  if (!inputPath || !outputPath) {
    throw new Error('Usage: seo:report --input <sanitized.json> --output <report.md> [--force]');
  }
  return { inputPath, outputPath, force };
}

function reportSecrets(env) {
  const credentialNames = Object.keys(env).filter((name) => CREDENTIAL_NAME_PATTERN.test(name));
  return {
    credentialNames,
    knownSecretValues: credentialNames.map((name) => env[name]).filter((value) => (
      typeof value === 'string' && value.length > 0
    )),
  };
}

async function createMonthlyReport({ flags, rootDir, env, output }) {
  const options = parseReportOptions(flags);
  const inputPath = path.resolve(rootDir, options.inputPath);
  const outputPath = path.resolve(rootDir, options.outputPath);
  let input;

  try {
    input = JSON.parse(await readFile(inputPath, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Monthly report input must be valid JSON');
    throw error;
  }

  const report = buildMonthlyReport(input, reportSecrets(env));
  try {
    await writeFile(outputPath, report, { encoding: 'utf8', flag: options.force ? 'w' : 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('Report output already exists; use --force to overwrite');
    throw error;
  }
  output(`SEO monthly report written: ${outputPath}`);
  return { status: 'report-written', outputPath };
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

  if (command === 'report') {
    return createMonthlyReport({ flags: [provider, ...flags].filter(Boolean), rootDir, env, output });
  }

  const routes = await loadSeoRoutes(rootDir);
  const urls = canonicalUrls(routes);

  if (command === 'inventory' && provider === undefined) {
    output(`Eligible canonical URLs: ${urls.length}`);
    urls.forEach((url) => output(url));
    return { status: 'inventory', urlCount: urls.length };
  }

  if (command !== 'submit' || !['baidu', 'indexnow'].includes(provider)) {
    errorOutput('Usage: seo:inventory | seo:submit -- <baidu|indexnow> [--dry-run|--execute] | seo:report --input <sanitized.json> --output <report.md> [--force]');
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
