import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'tools/wechat-admin/src/cli.mjs');

test('importing the WeChat CLI has no command-line side effects', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(cliPath)})`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('article parser and renderer preserve supported WeChat formatting', async () => {
  const { parseArticle, markdownToHtml, renderWechatHtml } = await import(cliPath);
  const article = parseArticle(`---\ntitle: 测试文章\nauthor: 乐可开源\n---\n## 二级标题\n### 三级标题\n\n正文含 *强调*。\n\n> 引用内容\n\n- 第一项\n- 第二项\n\n![示意图](/images/demo.svg)\n`);
  const content = markdownToHtml(article.body);
  const page = renderWechatHtml(article);

  assert.match(content, /<h2/);
  assert.match(content, /<h3/);
  assert.match(content, /<em>强调<\/em>/);
  assert.match(content, /<blockquote/);
  assert.match(content, /<ul/);
  assert.match(content, /src="\/images\/demo\.svg"/);
  assert.match(page, /测试文章/);
});

test('no-open preview never invokes the browser opener', async () => {
  const { shouldOpenPreview } = await import(cliPath);
  let calls = 0;
  const opened = shouldOpenPreview({ noOpen: true }, () => {
    calls += 1;
    return true;
  });

  assert.equal(opened, false);
  assert.equal(calls, 0);
});
