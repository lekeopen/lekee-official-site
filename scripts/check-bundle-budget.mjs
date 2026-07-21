import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const INITIAL_ENTRY_BUDGET_BYTES = 699_993;

export async function readInitialEntry(rootDir) {
  const html = await readFile(path.join(rootDir, 'dist', 'index.html'), 'utf8');
  const scriptTags = html.match(/<script\b[^>]*>/gi) ?? [];
  const moduleScript = scriptTags.find((tag) => /type=["']module["']/i.test(tag));
  const source = moduleScript?.match(/src=["']([^"']+\.js)["']/i)?.[1];

  if (!source) {
    throw new Error('Unable to find the initial module script in dist/index.html.');
  }

  const assetPath = source.replace(/^\/+/, '');
  const metadata = await stat(path.join(rootDir, 'dist', assetPath));
  return { assetPath, bytes: metadata.size };
}

export async function assertBundleBudget(
  rootDir,
  budgetBytes = INITIAL_ENTRY_BUDGET_BYTES,
) {
  const entry = await readInitialEntry(rootDir);
  if (entry.bytes > budgetBytes) {
    throw new Error(
      `${entry.assetPath}: ${entry.bytes} bytes exceeds the ${budgetBytes}-byte budget.`,
    );
  }
  return entry;
}

const isCli = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
    const entry = await assertBundleBudget(rootDir);
    const reduction = (1 - entry.bytes / 999_991) * 100;
    console.log(
      `Bundle budget passed: ${entry.assetPath} is ${entry.bytes} bytes `
      + `(${reduction.toFixed(1)}% below the V1.1 baseline).`,
    );
  } catch (error) {
    console.error(`Bundle budget failed: ${error.message}`);
    process.exitCode = 1;
  }
}
