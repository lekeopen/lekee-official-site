import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadModule() {
  const source = await readFile(new URL('../src/products/releaseStats.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const input = {
  owner: 'lekeopen',
  repo: 'leke-picker',
  tag: 'v1.1.0',
  allowedAssets: ['modern.exe', 'win7.exe'],
};

test('download stats sum only explicitly allowed assets', async () => {
  const { fetchReleaseDownloadStats } = await loadModule();
  const fakeFetch = async (url) => {
    assert.equal(url, 'https://api.github.com/repos/lekeopen/leke-picker/releases/tags/v1.1.0');
    return new Response(JSON.stringify({
      tag_name: 'v1.1.0',
      assets: [
        { name: 'modern.exe', size: 200, download_count: 4, browser_download_url: 'https://github.com/example/modern.exe' },
        { name: 'win7.exe', size: 100, download_count: 3, browser_download_url: 'https://github.com/example/win7.exe' },
        { name: 'source.zip', size: 50, download_count: 99, browser_download_url: 'https://github.com/example/source.zip' },
      ],
    }), { status: 200 });
  };

  const result = await fetchReleaseDownloadStats(input, fakeFetch);
  assert.equal(result.total, 7);
  assert.deepEqual(result.assets, [
    { name: 'modern.exe', downloadCount: 4 },
    { name: 'win7.exe', downloadCount: 3 },
  ]);
  assert.match(result.fetchedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('download stats fail closed for incomplete or mismatched release data', async () => {
  const { fetchReleaseDownloadStats } = await loadModule();
  const cases = [
    async () => new Response('{}', { status: 503 }),
    async () => new Response(JSON.stringify({ tag_name: 'v2.0.0', assets: [] }), { status: 200 }),
    async () => new Response(JSON.stringify({ tag_name: 'v1.1.0', assets: [{ name: 'modern.exe', download_count: -1 }] }), { status: 200 }),
  ];

  for (const fakeFetch of cases) {
    await assert.rejects(fetchReleaseDownloadStats(input, fakeFetch), /Download statistics unavailable/);
  }
});
