import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/quality.yml', import.meta.url),
  'utf8',
);

test('quality workflow uses Node.js 24-native GitHub actions', () => {
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /node-version:\s*24/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v4/);
});
