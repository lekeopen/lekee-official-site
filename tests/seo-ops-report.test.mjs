import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { main as runCli } from '../tools/seo-ops/src/cli.mjs';
import { buildMonthlyReport } from '../tools/seo-ops/src/report.mjs';

const fixture = {
  period: '2026-08',
  inspection: {
    startedAt: '2026-08-01T08:00:00.000Z',
    summary: { total: 12, passed: 11, failed: 1 },
  },
  providers: {
    indexnow: { submitted: 8, accepted: 8, indexed: null },
    baidu: { submitted: 8, accepted: 6 },
  },
  contentChanges: [
    { date: '2026-08-03', title: '第二篇文章', url: 'https://lekeopen.com/news/b/' },
    { date: '2026-08-01', title: '第一篇文章', url: 'https://lekeopen.com/news/a/' },
  ],
  issues: [
    { title: '等待平台抓取', status: 'open', owner: '内容负责人', dueDate: '2026-08-15' },
    { title: '缺少负责人字段', status: 'open' },
  ],
};

test('buildMonthlyReport renders deterministic provider sections and never equates acceptance with indexing', () => {
  const reversed = {
    ...fixture,
    providers: Object.fromEntries(Object.entries(fixture.providers).reverse()),
    contentChanges: [...fixture.contentChanges].reverse(),
    issues: [...fixture.issues].reverse(),
  };

  const report = buildMonthlyReport(fixture);

  assert.equal(report, buildMonthlyReport(reversed));
  assert.match(report, /^# SEO 月度健康报告：2026-08/m);
  assert.match(report, /## 生产 SEO 检查/);
  assert.ok(report.indexOf('### baidu') < report.indexOf('### indexnow'));
  assert.match(report, /提交被平台接受仅表示已进入处理流程，不代表页面已经被收录或建立索引。/);
  assert.match(report, /已接受提交 \| 6/);
  assert.match(report, /已收录或已建立索引 \| 未提供/);
  assert.match(report, /内容负责人/);
  assert.match(report, /2026-08-15/);
  assert.match(report, /未提供/);
});

test('buildMonthlyReport rejects credential-shaped keys and configured known secret values', () => {
  assert.throws(
    () => buildMonthlyReport({ ...fixture, apiToken: 'not-safe' }),
    /sensitive credential key/i,
  );
  assert.throws(
    () => buildMonthlyReport({ ...fixture, issues: [{ title: 'known-secret-value' }] }, {
      knownSecretValues: ['known-secret-value'],
    }),
    /known secret value/i,
  );
});

test('report CLI requires explicit paths, preserves existing reports, and only writes with --force', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-report-'));
  const inputPath = path.join(rootDir, 'sanitized.json');
  const outputPath = path.join(rootDir, 'report.md');
  await writeFile(inputPath, JSON.stringify(fixture), 'utf8');

  await assert.rejects(
    runCli({ argv: ['report'], rootDir, output: () => {} }),
    /Usage: seo:report/,
  );
  await runCli({
    argv: ['report', '--input', inputPath, '--output', outputPath],
    rootDir,
    output: () => {},
  });
  assert.match(await readFile(outputPath, 'utf8'), /# SEO 月度健康报告：2026-08/);
  await assert.rejects(
    runCli({
      argv: ['report', '--input', inputPath, '--output', outputPath],
      rootDir,
      output: () => {},
    }),
    /already exists/i,
  );
  await runCli({
    argv: ['report', '--input', inputPath, '--output', outputPath, '--force'],
    rootDir,
    output: () => {},
  });
});

test('direct report CLI rejects secrets supplied through configured environment names', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-report-secret-'));
  const inputPath = path.join(rootDir, 'sanitized.json');
  const outputPath = path.join(rootDir, 'report.md');
  await writeFile(inputPath, JSON.stringify({ ...fixture, issues: [{ title: 'env-secret-value' }] }), 'utf8');

  const result = spawnSync(process.execPath, ['tools/seo-ops/src/cli.mjs', 'report', '--input', inputPath, '--output', outputPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, BAIDU_SUBMIT_TOKEN: 'env-secret-value' },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /known secret value/i);
  assert.equal(result.stderr.includes('env-secret-value'), false);
});

test('report CLI preserves default credential names and rejects configured IndexNow values without echoing them', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'leke-seo-report-indexnow-'));
  const inputPath = path.join(rootDir, 'sanitized.json');
  const outputPath = path.join(rootDir, 'report.md');
  const secret = 'indexnow-secret-value';

  await writeFile(inputPath, JSON.stringify({ ...fixture, INDEXNOW_KEY: 'not-a-secret' }), 'utf8');
  await assert.rejects(
    runCli({
      argv: ['report', '--input', inputPath, '--output', outputPath],
      rootDir,
      env: {},
      output: () => {},
    }),
    /sensitive credential key/i,
  );

  await writeFile(inputPath, JSON.stringify({ ...fixture, issues: [{ title: secret }] }), 'utf8');
  await assert.rejects(
    runCli({
      argv: ['report', '--input', inputPath, '--output', outputPath],
      rootDir,
      env: { INDEXNOW_KEY: secret },
      output: () => {},
    }),
    (error) => /known secret value/i.test(error.message) && !error.message.includes(secret),
  );
});

test('buildMonthlyReport rejects known secret values in scalar output fields and object keys', () => {
  assert.throws(
    () => buildMonthlyReport({ ...fixture, issues: [{ title: 12345678 }] }, {
      knownSecretValues: ['12345678'],
    }),
    /known secret value/i,
  );
  assert.throws(
    () => buildMonthlyReport({ ...fixture, issues: [{ title: true }] }, {
      knownSecretValues: ['true'],
    }),
    /known secret value/i,
  );
  assert.throws(
    () => buildMonthlyReport({ ...fixture, issues: [{ 'known-secret-value': 'safe' }] }, {
      knownSecretValues: ['known-secret-value'],
    }),
    /known secret value/i,
  );
});
