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
  platforms: {
    bing: {
      indexedPages: null,
      impressions: 24,
      clicks: 3,
      representativeRankings: [
        { keyword: 'AI 工程实践', position: 8, url: 'https://lekeopen.com/services/' },
      ],
      crawlErrors: 0,
      sitemapStatus: 'accepted',
    },
    baidu: {
      indexedPages: 6,
      impressions: 120,
      clicks: 12,
      representativeRankings: [
        { keyword: '乐可开源', position: 3, url: 'https://lekeopen.com/' },
        { keyword: '小乐 AI', position: 5, url: 'https://lekeopen.com/projects/xiaole-agent/' },
      ],
      crawlErrors: 1,
      sitemapStatus: 'accepted',
    },
    google: {},
  },
  notifications: {
    indexNow: {
      status: 'accepted-for-processing',
      submittedUrls: 8,
      acceptedUrls: 8,
      lastSubmittedAt: '2026-08-02T00:00:00.000Z',
    },
    baiduUrlSubmission: {
      status: 'partial-acceptance',
      submittedUrls: 8,
      acceptedUrls: 6,
      lastSubmittedAt: '2026-08-01T00:00:00.000Z',
    },
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

test('buildMonthlyReport separates deterministic search-platform metrics from notification status', () => {
  const reversed = {
    ...fixture,
    platforms: {
      ...Object.fromEntries(Object.entries(fixture.platforms).reverse()),
      baidu: {
        ...fixture.platforms.baidu,
        representativeRankings: [...fixture.platforms.baidu.representativeRankings].reverse(),
      },
    },
    notifications: Object.fromEntries(Object.entries(fixture.notifications).reverse()),
    contentChanges: [...fixture.contentChanges].reverse(),
    issues: [...fixture.issues].reverse(),
  };

  const report = buildMonthlyReport(fixture);

  assert.equal(report, buildMonthlyReport(reversed));
  assert.match(report, /^# SEO 月度健康报告：2026-08/m);
  assert.match(report, /## 生产 SEO 检查/);
  assert.match(report, /## 搜索平台指标/);
  assert.ok(report.indexOf('### Baidu') < report.indexOf('### Google'));
  assert.ok(report.indexOf('### Google') < report.indexOf('### Bing'));
  assert.match(report, /已收录页面 \| 6/);
  assert.match(report, /曝光 \| 120/);
  assert.match(report, /点击 \| 12/);
  assert.match(report, /代表性排名 \| 乐可开源: 3 \(https:\/\/lekeopen\.com\/\)/);
  assert.match(report, /抓取错误 \| 1/);
  assert.match(report, /Sitemap 状态 \| accepted/);
  assert.match(report, /### Google[\s\S]*已收录页面 \| 未提供[\s\S]*曝光 \| 未提供[\s\S]*点击 \| 未提供/);
  assert.match(report, /## URL 通知状态/);
  assert.ok(report.indexOf('### Baidu URL 提交') < report.indexOf('### IndexNow'));
  assert.match(report, /通知状态 \| partial-acceptance/);
  assert.match(report, /已接受 URL \| 6/);
  assert.match(report, /提交被平台接受仅表示已进入处理流程，不代表页面已经被收录或建立索引。/);
  assert.match(report, /内容负责人/);
  assert.match(report, /2026-08-15/);
  assert.match(report, /未提供/);
});

test('buildMonthlyReport always includes Baidu, Google, Bing, Baidu submission, and IndexNow sections', () => {
  const report = buildMonthlyReport({
    period: '2026-08',
    inspection: {},
    contentChanges: [],
    issues: [],
  });

  for (const heading of ['### Baidu', '### Google', '### Bing', '### Baidu URL 提交', '### IndexNow']) {
    assert.match(report, new RegExp(`^${heading}$`, 'm'));
  }
  assert.ok((report.match(/未提供/g) || []).length >= 20);
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
