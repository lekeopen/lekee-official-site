import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { glob } from 'glob';

test('production artifacts exclude development locator metadata and machine paths', async () => {
  const files = await glob('dist/**/*.{html,js,css,json,xml,txt}', { nodir: true });
  assert.ok(files.length > 0, 'production build must exist before this gate runs');

  for (const file of files) {
    const source = await readFile(path.resolve(file), 'utf8');
    assert.doesNotMatch(source, /trae-inspector-/i, `${file} contains development locator attributes`);
    assert.doesNotMatch(source, /(?:\/Users\/|\/private\/|\/Volumes\/|[A-Za-z]:\\Users\\)/, `${file} contains a machine-specific absolute path`);
  }
});
