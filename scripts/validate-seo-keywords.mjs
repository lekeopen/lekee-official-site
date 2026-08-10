import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadSeoRoutes } from './seo-routes.mjs';

const KEYWORD_MAP_PATH = path.join('config', 'seo-keywords.json');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const loadSeoKeywordMap = async (rootDir = process.cwd()) => JSON.parse(
  await readFile(path.join(rootDir, KEYWORD_MAP_PATH), 'utf8'),
);

export const validateSeoKeywordMap = async ({ rootDir = process.cwd(), keywordMap }) => {
  const errors = [];
  const publicPaths = new Set((await loadSeoRoutes(rootDir)).map((route) => route.path));

  if (!keywordMap || typeof keywordMap !== 'object' || Array.isArray(keywordMap)) {
    return ['keyword map must be an object'];
  }

  if (!Number.isInteger(keywordMap.version) || keywordMap.version < 1) {
    errors.push('keyword map must declare a positive integer version');
  }

  if (!Array.isArray(keywordMap.records) || keywordMap.records.length === 0) {
    errors.push('keyword map must contain at least one record');
    return errors;
  }

  const paths = new Map();
  const intents = new Map();

  for (const record of keywordMap.records) {
    const recordPath = record?.path;
    const label = isNonEmptyString(recordPath) ? recordPath : '<missing path>';

    if (!isNonEmptyString(recordPath)) {
      errors.push('keyword record is missing path');
      continue;
    }
    if (paths.has(recordPath)) {
      errors.push(`${recordPath}: duplicate keyword record path`);
    }
    paths.set(recordPath, record);

    if (!publicPaths.has(recordPath)) {
      errors.push(`${recordPath}: is not a public route`);
    }
    if (!isNonEmptyString(record.primaryIntent)) {
      errors.push(`${label}: primaryIntent must be non-empty`);
    } else {
      const entries = intents.get(record.primaryIntent) ?? [];
      entries.push(record);
      intents.set(record.primaryIntent, entries);
    }
    if (!Array.isArray(record.supportingTerms) || !record.supportingTerms.every(isNonEmptyString)) {
      errors.push(`${label}: supportingTerms must be an array of non-empty strings`);
    }
    if (!Array.isArray(record.relatedPaths) || !record.relatedPaths.every(isNonEmptyString)) {
      errors.push(`${label}: relatedPaths must be an array of non-empty strings`);
      continue;
    }

    for (const relatedPath of record.relatedPaths) {
      if (relatedPath === recordPath) {
        errors.push(`${recordPath}: relatedPaths must not include its own path`);
      } else if (!publicPaths.has(relatedPath)) {
        errors.push(`${recordPath}: related path "${relatedPath}" is not a public route`);
      }
    }
  }

  for (const [primaryIntent, records] of intents) {
    if (records.length > 1 && records.some((record) => !isNonEmptyString(record.sharedIntentReason))) {
      errors.push(
        `primaryIntent "${primaryIntent}" is shared without sharedIntentReason for: ${records.map((record) => record.path).join(', ')}`,
      );
    }
  }

  return errors.sort();
};

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  try {
    const keywordMap = await loadSeoKeywordMap(process.cwd());
    const errors = await validateSeoKeywordMap({ rootDir: process.cwd(), keywordMap });

    if (errors.length > 0) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('SEO keyword map validation passed.');
    }
  } catch (error) {
    console.error(`Unable to validate SEO keyword map: ${error.message}`);
    process.exitCode = 1;
  }
}
