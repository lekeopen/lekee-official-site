import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve('public/products/leke-picker/app');
const releaseData = JSON.parse(readFileSync(path.resolve('src/products/releases.json'), 'utf8'));

test('乐可点名在线应用来自与当前正式版一致的干净内容清单', () => {
  assert.equal(existsSync(appRoot), true, 'online app artifact must be delivered');

  const manifest = JSON.parse(readFileSync(path.join(appRoot, 'distribution-manifest.json'), 'utf8'));
  assert.equal(manifest.product, 'leke-picker');
  assert.equal(manifest.version, releaseData['leke-picker'].version);
  assert.equal(manifest.base, '/products/leke-picker/app/');
  assert.equal(manifest.sourceDirty, false);
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/u);

  for (const file of manifest.files) {
    const bytes = readFileSync(path.join(appRoot, file.path));
    assert.equal(bytes.length, file.sizeBytes ?? file.size, `${file.path} size must match manifest`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.path} hash must match manifest`);
  }

  const html = readFileSync(path.join(appRoot, 'index.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/u);
  assert.match(html, /\/products\/leke-picker\/app\/assets\//u);

  const text = manifest.files
    .filter((file) => /\.(?:html|js|css|json|svg|txt|xml)$/u.test(file.path))
    .map((file) => readFileSync(path.join(appRoot, file.path), 'utf8'))
    .join('\n');
  assert.doesNotMatch(text, /clarity\.ms|uupelkp00u|(?:\/Users\/|\/private\/|\/Volumes\/|[A-Za-z]:\\Users\\)/u);
});
