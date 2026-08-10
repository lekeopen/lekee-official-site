const MISSING = '未提供';
const DEFAULT_CREDENTIAL_NAMES = [
  'BAIDU_SUBMIT_TOKEN',
  'INDEXNOW_KEY',
  'API_KEY',
  'API_TOKEN',
  'AUTHORIZATION',
  'PASSWORD',
  'SECRET',
];
const CREDENTIAL_KEY_PATTERN = /(token|secret|password|authorization|credential|api[_-]?key)/i;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value) {
  if (value === undefined || value === null || value === '') return MISSING;
  return String(value).replaceAll('|', '\\|').replaceAll(/\r?\n/g, '<br>');
}

function compareText(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'en');
}

function configuredCredentialKey(name, credentialNames) {
  const normalized = String(name).toLowerCase();
  return CREDENTIAL_KEY_PATTERN.test(name)
    || credentialNames.some((credentialName) => String(credentialName).toLowerCase() === normalized);
}

function assertSafeInput(value, { credentialNames, knownSecretValues }) {
  const knownValues = new Set(knownSecretValues.filter((item) => typeof item === 'string' && item.length > 0));
  const visited = new WeakSet();

  function containsKnownSecret(value) {
    const text = String(value);
    for (const secret of knownValues) {
      if (text === secret || (typeof value === 'string' && text.includes(secret))) return true;
    }
    return false;
  }

  function visit(current) {
    if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean') {
      if (containsKnownSecret(current)) throw new Error('Report input contains a known secret value');
      return;
    }
    if (current === null || typeof current !== 'object') return;
    if (visited.has(current)) return;
    visited.add(current);

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    for (const [key, entry] of Object.entries(current)) {
      if (containsKnownSecret(key)) throw new Error('Report input contains a known secret value');
      if (configuredCredentialKey(key, credentialNames)) {
        throw new Error('Report input contains a sensitive credential key');
      }
      visit(entry);
    }
  }

  visit(value);
}

function providerEntries(providers) {
  if (Array.isArray(providers)) {
    return providers.map((provider) => ({
      name: isRecord(provider) ? provider.provider ?? provider.name : undefined,
      metrics: isRecord(provider) ? provider : {},
    })).sort((left, right) => compareText(left.name, right.name));
  }
  if (!isRecord(providers)) return [];
  return Object.entries(providers)
    .map(([name, metrics]) => ({ name, metrics: isRecord(metrics) ? metrics : {} }))
    .sort((left, right) => compareText(left.name, right.name));
}

function sortChanges(changes) {
  if (!Array.isArray(changes)) return [];
  return [...changes].filter(isRecord).sort((left, right) => (
    compareText(left.date, right.date)
    || compareText(left.title, right.title)
    || compareText(left.url, right.url)
  ));
}

function sortIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return [...issues].filter(isRecord).sort((left, right) => (
    compareText(left.status, right.status)
    || compareText(left.dueDate ?? left.targetDate, right.dueDate ?? right.targetDate)
    || compareText(left.title, right.title)
    || compareText(left.owner, right.owner)
  ));
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(safeText).join(' | ')} |`),
  ].join('\n');
}

function metric(metrics, names) {
  for (const name of names) {
    if (Object.hasOwn(metrics, name)) return metrics[name];
  }
  return undefined;
}

function inspectionLines(inspection) {
  const summary = isRecord(inspection?.summary) ? inspection.summary : {};
  return [
    '## 生产 SEO 检查',
    '',
    `- 检查时间：${safeText(inspection?.startedAt)}`,
    `- 检查总数：${safeText(summary.total)}`,
    `- 通过检查：${safeText(summary.passed)}`,
    `- 失败检查：${safeText(summary.failed)}`,
  ];
}

/**
 * Build a deterministic Markdown report from a sanitized monthly SEO snapshot.
 * The input is deliberately data-only; platform exports and credentials must not be passed in.
 */
export function buildMonthlyReport(input, {
  credentialNames = DEFAULT_CREDENTIAL_NAMES,
  knownSecretValues = [],
} = {}) {
  if (!isRecord(input)) throw new TypeError('Monthly report input must be an object');
  if (!Array.isArray(credentialNames) || !Array.isArray(knownSecretValues)) {
    throw new TypeError('credentialNames and knownSecretValues must be arrays');
  }
  assertSafeInput(input, { credentialNames, knownSecretValues });

  const lines = [
    `# SEO 月度健康报告：${safeText(input.period)}`,
    '',
    ...inspectionLines(input.inspection),
    '',
    '## 平台提交与收录',
    '',
    '提交被平台接受仅表示已进入处理流程，不代表页面已经被收录或建立索引。',
  ];

  const providers = providerEntries(input.providers);
  if (providers.length === 0) {
    lines.push('', MISSING);
  } else {
    for (const { name, metrics } of providers) {
      lines.push(
        '',
        `### ${safeText(name)}`,
        '',
        table(['指标', '值'], [
          ['提交 URL 数', metric(metrics, ['submitted', 'submittedUrls'])],
          ['已接受提交', metric(metrics, ['accepted', 'acceptedUrls'])],
          ['已收录或已建立索引', metric(metrics, ['indexed', 'indexedUrls'])],
        ]),
      );
    }
  }

  const changes = sortChanges(input.contentChanges);
  lines.push('', '## 内容变更', '');
  lines.push(changes.length === 0
    ? MISSING
    : table(['日期', '内容', 'URL'], changes.map((change) => [change.date, change.title, change.url])));

  const issues = sortIssues(input.issues);
  lines.push('', '## 问题跟踪', '');
  lines.push(issues.length === 0
    ? MISSING
    : table(['状态', '问题', '负责人', '目标日期'], issues.map((issue) => [
      issue.status,
      issue.title,
      issue.owner,
      issue.dueDate ?? issue.targetDate,
    ])));

  return `${lines.join('\n')}\n`;
}

export { DEFAULT_CREDENTIAL_NAMES };
