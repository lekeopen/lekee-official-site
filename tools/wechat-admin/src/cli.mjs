#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOOL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(TOOL_ROOT, '..', '..');
const CACHE_DIR = path.join(REPO_ROOT, '.wechat-admin-cache');
const OUTPUT_DIR = path.join(REPO_ROOT, '.wechat-admin-output');
const DEFAULT_ACCOUNTS_FILE = path.join(TOOL_ROOT, 'accounts.local.json');
const EXAMPLE_ACCOUNTS_FILE = path.join(TOOL_ROOT, 'accounts.example.json');

const WECHAT_API_BASE = 'https://api.weixin.qq.com';

async function main() {
  loadDotEnv(path.join(REPO_ROOT, '.env'));

  const [area, action, accountKey, ...rawOptions] = process.argv.slice(2);
  const options = parseOptions(rawOptions);

  if (!area || area === 'help' || area === '--help' || area === '-h') {
    printHelp();
    return;
  }

  const store = await AccountStore.load();

  if (area === 'accounts') {
    printAccounts(store);
    return;
  }

  if (area === 'replies') {
    if (action !== 'show') {
      throw new Error('回复命令目前支持 show');
    }
    if (!accountKey) {
      throw new Error('请指定账号，例如：npm run wechat:replies -- lekeopen');
    }
    const account = store.get(accountKey);
    const replies = await readReplies(account);
    printJson(replies);
    return;
  }

  if (area === 'article') {
    if (action !== 'render') {
      throw new Error('文章命令目前支持 render');
    }
    if (!accountKey) {
      throw new Error('请指定 Markdown 文件路径，例如：npm run wechat:article -- tools/wechat-admin/articles/demo.md');
    }
    const result = await renderArticle(accountKey);
    printJson(result);
    return;
  }

  if (area === 'draft') {
    if (action !== 'create') {
      throw new Error('草稿命令目前支持 create');
    }
    if (!accountKey) {
      throw new Error('请指定账号，例如：npm run wechat:draft -- lekeopen article.md');
    }
    const articleFile = rawOptions.find((item) => !item.startsWith('-'));
    if (!articleFile) {
      throw new Error('请指定文章 Markdown 文件路径');
    }
    const account = store.get(accountKey);
    assertOfficialAccount(account);
    const result = await createDraft(account, articleFile, options);
    printJson(result);
    return;
  }

  if (area !== 'menu') {
    throw new Error(`未知命令：${area}`);
  }

  if (!['get', 'sync', 'delete'].includes(action)) {
    throw new Error('菜单命令必须是 get、sync 或 delete');
  }

  if (!accountKey) {
    throw new Error('请指定账号，例如：npm run wechat:menu:sync -- lekeopen');
  }

  const account = store.get(accountKey);
  assertOfficialAccount(account);

  if (action === 'sync') {
    const menu = await readMenu(account);
    validateMenu(menu);

    if (options.dryRun) {
      printJson({
        account: pickAccountForDisplay(account),
        menu,
      });
      return;
    }

    const client = new WechatClient(account);
    const result = await client.createMenu(menu);
    console.log(`菜单已同步：${account.name || account.key}`);
    printJson(result);
    return;
  }

  const client = new WechatClient(account);

  if (action === 'get') {
    const result = await client.getMenu();
    printJson(result);
    return;
  }

  if (action === 'delete') {
    if (!options.yes) {
      throw new Error('删除菜单需要添加 --yes 确认，例如：npm run wechat:menu:delete -- lekeopen --yes');
    }
    const result = await client.deleteMenu();
    console.log(`菜单已删除：${account.name || account.key}`);
    printJson(result);
  }
}

class AccountStore {
  constructor(accounts) {
    this.accounts = accounts;
  }

  static async load() {
    const file = existsSync(DEFAULT_ACCOUNTS_FILE) ? DEFAULT_ACCOUNTS_FILE : EXAMPLE_ACCOUNTS_FILE;
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    const accounts = {};

    for (const [key, account] of Object.entries(parsed.accounts || {})) {
      accounts[key] = {
        key,
        ...account,
      };
    }

    return new AccountStore(accounts);
  }

  list() {
    return Object.values(this.accounts);
  }

  get(key) {
    const account = this.accounts[key];
    if (!account) {
      const available = Object.keys(this.accounts).join(', ') || '无';
      throw new Error(`找不到账号：${key}。当前可用账号：${available}`);
    }
    return account;
  }
}

class WechatClient {
  constructor(account) {
    this.account = account;
    this.tokenStore = new TokenStore(account);
  }

  async getMenu() {
    const token = await this.getAccessToken();
    return this.request(`/cgi-bin/menu/get?access_token=${encodeURIComponent(token)}`);
  }

  async createMenu(menu) {
    const token = await this.getAccessToken();
    return this.request(`/cgi-bin/menu/create?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(menu),
    });
  }

  async deleteMenu() {
    const token = await this.getAccessToken();
    return this.request(`/cgi-bin/menu/delete?access_token=${encodeURIComponent(token)}`);
  }

  async addDraft(article) {
    const token = await this.getAccessToken();
    return this.request(`/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ articles: [article] }),
    });
  }

  async uploadPermanentThumb(file) {
    const token = await this.getAccessToken();
    const url = `${WECHAT_API_BASE}/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=thumb`;
    const form = new FormData();
    form.append('media', new Blob([file.bytes], { type: file.mimeType }), file.filename);

    const response = await fetch(url, {
      method: 'POST',
      body: form,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`微信素材接口返回非 JSON：${text}`);
    }

    if (!response.ok) {
      throw new Error(`微信素材接口请求失败：HTTP ${response.status} ${text}`);
    }

    if (data.errcode) {
      throw new Error(formatWechatApiError('微信素材接口', data));
    }

    if (!data.media_id) {
      throw new Error(`微信素材接口响应缺少 media_id：${JSON.stringify(data)}`);
    }

    return data;
  }

  async getAccessToken() {
    const cached = await this.tokenStore.read();
    if (cached) {
      return cached.accessToken;
    }

    const appId = readRequiredEnv(this.account.appIdEnv);
    const appSecret = readRequiredEnv(this.account.appSecretEnv);
    const query = new URLSearchParams({
      grant_type: 'client_credential',
      appid: appId,
      secret: appSecret,
    });
    const result = await this.request(`/cgi-bin/token?${query.toString()}`, undefined, { skipTokenCheck: true });

    if (!result.access_token || !result.expires_in) {
      throw new Error(`微信 token 响应异常：${JSON.stringify(result)}`);
    }

    await this.tokenStore.write({
      accessToken: result.access_token,
      expiresAt: Date.now() + (Number(result.expires_in) - 300) * 1000,
    });

    return result.access_token;
  }

  async request(pathname, init = {}, options = {}) {
    const url = `${WECHAT_API_BASE}${pathname}`;
    const response = await fetch(url, {
      method: init.method || 'GET',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        ...(init.headers || {}),
      },
      body: init.body,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`微信接口返回非 JSON：${text}`);
    }

    if (!response.ok) {
      throw new Error(`微信接口请求失败：HTTP ${response.status} ${text}`);
    }

    if (!options.skipTokenCheck && data.errcode && data.errcode !== 0) {
      throw new Error(formatWechatApiError('微信接口', data));
    }

    if (options.skipTokenCheck && data.errcode) {
      throw new Error(formatWechatApiError('微信 token 获取失败', data));
    }

    return data;
  }
}

class TokenStore {
  constructor(account) {
    this.file = path.join(CACHE_DIR, `${account.key}.token.json`);
  }

  async read() {
    if (!existsSync(this.file)) {
      return null;
    }

    try {
      const data = JSON.parse(await readFile(this.file, 'utf8'));
      if (data.accessToken && data.expiresAt && data.expiresAt > Date.now()) {
        return data;
      }
    } catch {
      return null;
    }

    return null;
  }

  async write(data) {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(this.file, JSON.stringify(data, null, 2), 'utf8');
  }
}

async function readMenu(account) {
  const menuFile = account.menuFile || `menus/${account.key}.json`;
  const menuPath = path.resolve(TOOL_ROOT, menuFile);
  return JSON.parse(await readFile(menuPath, 'utf8'));
}

async function readReplies(account) {
  const repliesFile = account.repliesFile || `replies/${account.key}.json`;
  const repliesPath = path.resolve(TOOL_ROOT, repliesFile);
  return JSON.parse(await readFile(repliesPath, 'utf8'));
}

async function renderArticle(inputFile) {
  const inputPath = path.resolve(REPO_ROOT, inputFile);
  const markdown = await readFile(inputPath, 'utf8');
  const parsed = parseFrontMatter(markdown);
  const slug = path.basename(inputPath).replace(/\.[^.]+$/, '');
  const articleDir = path.join(OUTPUT_DIR, 'articles');
  await mkdir(articleDir, { recursive: true });

  const html = renderWechatHtml(parsed);
  const text = renderPlainText(parsed);
  const manifest = {
    title: parsed.data.title || slug,
    subtitle: parsed.data.subtitle || '',
    author: parsed.data.author || '',
    cover: parsed.data.cover || '',
    ctaKeyword: parsed.data.ctaKeyword || '',
    ctaUrl: parsed.data.ctaUrl || '',
    source: path.relative(REPO_ROOT, inputPath),
    htmlFile: path.relative(REPO_ROOT, path.join(articleDir, `${slug}.html`)),
    textFile: path.relative(REPO_ROOT, path.join(articleDir, `${slug}.txt`)),
  };

  await writeFile(path.join(articleDir, `${slug}.html`), html, 'utf8');
  await writeFile(path.join(articleDir, `${slug}.txt`), text, 'utf8');
  await writeFile(path.join(articleDir, `${slug}.json`), JSON.stringify(manifest, null, 2), 'utf8');

  return manifest;
}

async function createDraft(account, inputFile, options) {
  const inputPath = path.resolve(REPO_ROOT, inputFile);
  const markdown = await readFile(inputPath, 'utf8');
  const parsed = parseFrontMatter(markdown);
  const html = renderWechatContentHtml(parsed);
  const draftArticle = {
    title: parsed.data.title,
    author: parsed.data.author || account.name || '',
    digest: parsed.data.digest || buildDigest(parsed.body),
    content: html,
    content_source_url: parsed.data.ctaUrl || parsed.data.sourceUrl || parsed.data.source || '',
    need_open_comment: 0,
    only_fans_can_comment: 0,
  };

  if (!draftArticle.title) {
    throw new Error('文章缺少 title');
  }

  if (options.dryRun) {
    return {
      account: pickAccountForDisplay(account),
      article: {
        ...draftArticle,
        thumb_media_id: '<uploaded when not dry-run>',
      },
      cover: parsed.data.cover || '',
    };
  }

  if (!parsed.data.cover) {
    throw new Error('创建公众号草稿需要 cover，用于上传封面素材');
  }

  const client = new WechatClient(account);
  const coverFile = await loadCoverFile(parsed.data.cover);
  const material = await client.uploadPermanentThumb(coverFile);
  const result = await client.addDraft({
    ...draftArticle,
    thumb_media_id: material.media_id,
  });

  return {
    title: draftArticle.title,
    media_id: result.media_id,
    thumb_media_id: material.media_id,
  };
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith('---')) {
    return { data: {}, body: markdown.trim() };
  }

  const endIndex = markdown.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { data: {}, body: markdown.trim() };
  }

  const rawMatter = markdown.slice(3, endIndex).trim();
  const body = markdown.slice(endIndex + 4).trim();
  return {
    data: parseSimpleYaml(rawMatter),
    body,
  };
}

function parseSimpleYaml(raw) {
  const data = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(unquote(listMatch[1].trim()));
      continue;
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();
    currentKey = key;
    data[key] = value ? unquote(value) : [];
  }

  return data;
}

function renderWechatHtml(article) {
  const title = escapeHtml(article.data.title || '');
  const subtitle = escapeHtml(article.data.subtitle || '');
  const author = escapeHtml(article.data.author || '');
  const content = markdownToHtml(article.body);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 24px; background: #f6f7f9; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 680px; margin: 0 auto; background: #fff; padding: 28px 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; line-height: 1.35; color: #111827; }
    .meta { margin-bottom: 28px; color: #6b7280; font-size: 14px; }
    h2 { margin: 32px 0 14px; font-size: 20px; line-height: 1.4; color: #111827; }
    p { margin: 16px 0; font-size: 16px; line-height: 1.85; }
    ul { padding-left: 1.2em; margin: 16px 0; }
    li { margin: 8px 0; line-height: 1.75; }
    a { color: #2563eb; word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <div class="meta">${[subtitle, author].filter(Boolean).join(' · ')}</div>
${content}
  </main>
</body>
</html>
`;
}

function renderWechatContentHtml(article) {
  return `<section style="font-size:16px;line-height:1.85;color:#1f2937;">\n${markdownToHtml(article.body).replace(/^    /gm, '')}\n</section>`;
}

function renderPlainText(article) {
  const header = [article.data.title, article.data.subtitle, article.data.author].filter(Boolean).join('\n');
  return `${header}\n\n${article.body}\n`;
}

function buildDigest(markdown) {
  return markdown
    .replace(/^#+\s+/gm, '')
    .replace(/[-*]\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

async function loadCoverFile(cover) {
  if (/^https?:\/\//.test(cover)) {
    const response = await fetch(cover);
    if (!response.ok) {
      throw new Error(`封面图下载失败：HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      bytes: new Uint8Array(arrayBuffer),
      mimeType: response.headers.get('content-type') || guessMimeType(cover),
      filename: filenameFromUrl(cover),
    };
  }

  const coverPath = path.resolve(REPO_ROOT, cover.replace(/^\//, 'public/'));
  return {
    bytes: await readFile(coverPath),
    mimeType: guessMimeType(coverPath),
    filename: path.basename(coverPath),
  };
}

function filenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname);
    return basename && basename.includes('.') ? basename : 'cover.jpg';
  } catch {
    return 'cover.jpg';
  }
}

function guessMimeType(file) {
  const lower = file.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const parts = [];
  let list = [];

  const flushList = () => {
    if (list.length === 0) {
      return;
    }
    parts.push(`    <ul>\n${list.map((item) => `      <li>${inlineMarkdown(item)}</li>`).join('\n')}\n    </ul>`);
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      parts.push(`    <h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('- ')) {
      list.push(trimmed.slice(2));
      continue;
    }

    flushList();
    parts.push(`    <p>${inlineMarkdown(trimmed)}</p>`);
  }

  flushList();
  return parts.join('\n');
}

function inlineMarkdown(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateMenu(menu) {
  if (!menu || !Array.isArray(menu.button)) {
    throw new Error('菜单配置必须包含 button 数组');
  }
  if (menu.button.length > 3) {
    throw new Error('一级菜单最多 3 个');
  }

  for (const button of menu.button) {
    validateButton(button, 1);
  }
}

function validateButton(button, level) {
  if (!button.name || typeof button.name !== 'string') {
    throw new Error('每个菜单都必须有 name');
  }

  if (level === 1 && countName(button.name) > 8) {
    throw new Error(`一级菜单「${button.name}」名称过长，最多 4 个汉字或 8 个字母`);
  }

  if (level === 2 && countName(button.name) > 16) {
    throw new Error(`二级菜单「${button.name}」名称过长，最多 8 个汉字或 16 个字母`);
  }

  if (Array.isArray(button.sub_button) && button.sub_button.length > 0) {
    if (button.sub_button.length > 5) {
      throw new Error(`菜单「${button.name}」的二级菜单最多 5 个`);
    }
    for (const child of button.sub_button) {
      validateButton(child, 2);
    }
    return;
  }

  if (!button.type) {
    throw new Error(`菜单「${button.name}」缺少 type`);
  }

  if (button.type === 'view' && !button.url) {
    throw new Error(`网页菜单「${button.name}」缺少 url`);
  }

  if (button.type === 'click' && !button.key) {
    throw new Error(`点击菜单「${button.name}」缺少 key`);
  }
}

function countName(value) {
  return Array.from(value).reduce((total, char) => total + (char.charCodeAt(0) > 127 ? 2 : 1), 0);
}

function assertOfficialAccount(account) {
  if (account.type !== 'official_account') {
    throw new Error(`账号「${account.key}」不是公众号账号，当前类型：${account.type}`);
  }
}

function readRequiredEnv(name) {
  if (!name) {
    throw new Error('账号配置缺少环境变量名');
  }
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

function loadDotEnv(file) {
  if (!existsSync(file)) {
    return;
  }

  const content = readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const rawValue = trimmed.slice(equalIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = unquote(rawValue);
    }
  }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseOptions(args) {
  return {
    dryRun: args.includes('--dry-run'),
    yes: args.includes('--yes') || args.includes('-y'),
  };
}

function printAccounts(store) {
  const accounts = store.list().map(pickAccountForDisplay);
  printJson({ accounts });
}

function pickAccountForDisplay(account) {
  return {
    key: account.key,
    name: account.name,
    type: account.type,
    appIdEnv: account.appIdEnv,
    appSecretEnv: account.appSecretEnv,
    menuFile: account.menuFile,
  };
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`WeChat Admin

用法：
  npm run wechat:accounts
  npm run wechat:menu:get -- <account>
  npm run wechat:menu:sync -- <account> [--dry-run]
  npm run wechat:menu:delete -- <account> --yes
  npm run wechat:replies -- <account>
  npm run wechat:article -- <markdown-file>
  npm run wechat:draft -- <account> <markdown-file> [--dry-run]

配置：
  tools/wechat-admin/accounts.local.json  本地账号配置
  tools/wechat-admin/menus/<account>.json 菜单配置
  .env                                    AppID/AppSecret
`);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function formatWechatApiError(scope, data) {
  const base = `${scope}错误 ${data.errcode}：${data.errmsg || '未知错误'}`;
  if (data.errcode === 48001) {
    return `${base}\n当前公众号未获得该接口权限。菜单接口可用，但素材/草稿接口可能需要账号认证、接口权限开通，或改用公众号后台/第三方编辑器手动创建草稿。`;
  }
  if (data.errcode === 40164) {
    return `${base}\n当前请求 IP 不在公众号后台 IP 白名单，请到「设置与开发 > 基本配置 > IP 白名单」添加当前出口 IP。`;
  }
  return base;
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
