# 乐可开源双产品官网承接 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 lekeopen.com 建立乐可点名和归个类的统一产品矩阵、独立产品页、下载统计、SEO 与隐私承接，同时保持现有项目页和发布流程稳定。

**Architecture:** 保留现有 React/Vite/SSR 预渲染架构，新增类型化产品目录和专用产品页面组件。产品正文、下载元数据和 SEO 路由由同一产品定义驱动；GitHub 下载统计在浏览器端异步读取公开 Release API并可失败降级。

**Tech Stack:** React 18、TypeScript 5.8、React Router 7、Vite 6、Tailwind CSS 3、React Helmet Async、Node test runner、Cheerio、GitHub Releases REST API。

## Global Constraints

- 官网是唯一宣传主阵地；不得新增域名、产品子域名或独立宣传站。
- 固定产品路径为 `/products/leke-picker/` 和 `/products/guigelei/`。
- 固定在线应用路径为 `/products/leke-picker/app/`，且必须 `noindex, nofollow`、不进入 sitemap、不加载 Clarity。
- 现有 `/projects/:id`、新闻路由和 Markdown 内容保持兼容。
- 不增加运行时依赖，优先复用现有 React、Router、Helmet、Tailwind 和测试工具。
- 不把 GitHub Token、个人数据、学生姓名、文件名或目录路径写入源码、事件或日志。
- GitHub API 不得阻塞正文和下载按钮；失败时显示“下载统计暂不可用”。
- 未经独立明确授权，不 commit、不 push、不合并 main、不部署、不执行搜索平台真实提交。
- 实施时保留当前工作区内与本计划无关的既有修改。

---

### Task 1: 建立类型化产品目录

**Files:**
- Create: `src/products/catalog.ts`
- Create: `tests/product-catalog.test.mjs`
- Modify: `scripts/validate-content.mjs`

**Interfaces:**
- Produces: `ProductSlug`, `ProductDownload`, `ProductDefinition`, `PRODUCTS`, `getProduct(slug)`。
- Consumes: 固定版本、Release 资产名、大小、SHA-256、URL 和公开页面文案。

- [ ] **Step 1: 写失败测试**

断言两个 slug 唯一、版本非空、下载 ID 与 assetName 唯一、URL 为 HTTPS、SHA-256 为 64 位小写十六进制、sizeBytes 为正整数，并禁止私有仓库 URL 出现在归个类公开链接中。

```js
assert.deepEqual(products.map((product) => product.slug), ['leke-picker', 'guigelei']);
assert.match(download.sha256, /^[a-f0-9]{64}$/);
assert.equal(new URL(download.url).protocol, 'https:');
assert.equal(JSON.stringify(guigelei).includes('lekeopen/ai-file-organizer'), false);
```

- [ ] **Step 2: 验证测试先失败**

Run: `node --test tests/product-catalog.test.mjs`

Expected: FAIL，原因是 `src/products/catalog.ts` 尚不存在。

- [ ] **Step 3: 实现最小产品目录**

定义设计规格中的接口，并导出不可变的两项产品数据。乐可点名写入三个正式安装包；归个类的公开 Release URL 在 `guigelei-releases` 创建前使用产品级禁用状态而不是虚构链接：

```ts
export type ProductSlug = 'leke-picker' | 'guigelei';

export function getProduct(slug: ProductSlug): ProductDefinition {
  const product = PRODUCTS.find((item) => item.slug === slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  return product;
}
```

为未就绪下载增加明确的 `availability: 'available' | 'pending'`，页面不得渲染可点击的占位 URL。

- [ ] **Step 4: 扩展内容校验并运行测试**

Run: `node --test tests/product-catalog.test.mjs && npm run validate:content`

Expected: PASS；无私有 URL、无无效 hash、无重复资产。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

展示本任务精确 diff 和测试结果。只有用户明确授权后才可执行：

```bash
git add src/products/catalog.ts tests/product-catalog.test.mjs scripts/validate-content.mjs
git commit -m "feat: add typed product catalog"
```

### Task 2: 构建共享产品页面组件和路由

**Files:**
- Create: `src/components/products/ProductHero.tsx`
- Create: `src/components/products/ProductGallery.tsx`
- Create: `src/components/products/DownloadSection.tsx`
- Create: `src/components/products/ProductFaq.tsx`
- Create: `src/pages/LekePickerProduct.tsx`
- Create: `src/pages/GuigeleiProduct.tsx`
- Modify: `src/App.tsx`
- Modify: `src/seo/ServerApp.tsx`
- Test: `tests/product-pages.test.mjs`
- Test: `tests/route-lazy-loading.test.mjs`

**Interfaces:**
- Consumes: `getProduct(slug)` 和产品目录类型。
- Produces: 两个客户端懒加载路由与两个 SSR 同构路由。

- [ ] **Step 1: 写路由与内容失败测试**

断言客户端路由与 SSR 路由都包含两个固定路径；每页只有一个 `h1`，存在版本、主要 CTA、隐私、系统要求、FAQ 和更新记录标题。

```js
assert.match(appSource, /path="products\/leke-picker"/);
assert.match(serverSource, /path="products\/guigelei"/);
```

- [ ] **Step 2: 验证失败**

Run: `node --test tests/product-pages.test.mjs tests/route-lazy-loading.test.mjs`

Expected: FAIL，原因是页面和路由尚不存在。

- [ ] **Step 3: 实现共享组件和独立页面**

页面共享布局组件，但把产品特定风险文案保留在各自页面。CTA 使用可见文本；外链使用 `target="_blank" rel="noopener noreferrer"`；待发布下载使用禁用按钮和“即将开放”，不得链接 `#`。

```tsx
<Route path="products/leke-picker" element={<LekePickerProduct />} />
<Route path="products/guigelei" element={<GuigeleiProduct />} />
```

- [ ] **Step 4: 运行页面测试、类型检查和 lint**

Run: `node --test tests/product-pages.test.mjs tests/route-lazy-loading.test.mjs && npm run check && npm run lint`

Expected: PASS。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后才可提交本任务列出的文件，建议消息：`feat: add dedicated product pages`。

### Task 3: 升级产品与项目列表页

**Files:**
- Modify: `src/pages/Products.tsx`
- Test: `tests/products-index.test.mjs`
- Test: `tests/wechat-large-text-layout.test.mjs`

**Interfaces:**
- Consumes: `PRODUCTS` 和现有 `getAllProjects()`。
- Produces: “乐可产品”优先区和保持兼容的“工程项目与实践”区。

- [ ] **Step 1: 写失败测试**

断言两张产品卡链接到 `/products/leke-picker`、`/products/guigelei`；现有项目仍链接 `/projects/:id`；卡片在放大字体下允许换行且没有固定高度裁切。

- [ ] **Step 2: 运行并确认失败**

Run: `node --test tests/products-index.test.mjs tests/wechat-large-text-layout.test.mjs`

Expected: FAIL，原因是产品优先区尚不存在。

- [ ] **Step 3: 实现产品优先区**

保留 `getAllProjects()` 的现有渲染，并将标题改为清晰的两个层级。不要重构项目 Markdown 或改变旧 URL。

- [ ] **Step 4: 验证列表页**

Run: `node --test tests/products-index.test.mjs tests/wechat-large-text-layout.test.mjs && npm run check`

Expected: PASS。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后建议提交消息：`feat: feature products in project hub`。

### Task 4: 实现可靠的公开下载统计

**Files:**
- Create: `src/products/releaseStats.ts`
- Create: `src/components/products/DownloadStats.tsx`
- Create: `tests/release-stats.test.mjs`
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/pages/GuigeleiProduct.tsx`

**Interfaces:**
- Produces: `fetchReleaseDownloadStats(input, fetchImpl?) -> Promise<ReleaseDownloadStats>`。
- Consumes: `{ owner, repo, tag, allowedAssets }`；只返回白名单资产的合计、逐项数量和 `fetchedAt`。

- [ ] **Step 1: 写失败测试**

使用 stub fetch 覆盖成功、未知资产、非 2xx、畸形 JSON、负数计数、Abort 和仓库未公开。不得在测试中访问真实网络。

```ts
await fetchReleaseDownloadStats({
  owner: 'lekeopen', repo: 'leke-picker', tag: 'v1.1.0',
  allowedAssets: ['leke-picker_1.1.0_x64-setup.exe'],
}, fakeFetch);
```

- [ ] **Step 2: 确认失败**

Run: `node --test tests/release-stats.test.mjs`

Expected: FAIL，原因是统计模块不存在。

- [ ] **Step 3: 实现白名单解析和超时降级**

使用 `AbortController` 和固定超时；不使用 Token；拒绝仓库/tag 不匹配的数据；React 组件初始显示“正在读取下载统计”，失败显示“下载统计暂不可用”。下载按钮始终独立可用。

- [ ] **Step 4: 运行统计和页面测试**

Run: `node --test tests/release-stats.test.mjs tests/product-pages.test.mjs && npm run check`

Expected: PASS，且测试无外部请求。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后建议提交消息：`feat: add resilient release download stats`。

### Task 5: 接入真实产品素材

**Files:**
- Create: `public/images/products/leke-picker/*.webp`
- Create: `public/images/products/leke-picker/og.png`
- Create: `public/images/products/guigelei/*.webp`
- Create: `public/images/products/guigelei/og.png`
- Modify: `src/products/catalog.ts`
- Test: `tests/product-assets.test.mjs`

**Interfaces:**
- Consumes: 已脱敏的真实 v1.1.0 和 v1.5.0 截图。
- Produces: 明确宽高、可读取、非 SVG 的页面与 OG 图片。

- [ ] **Step 1: 写资产失败测试**

断言每个产品至少四张界面图，文件存在、可由 Sharp 读取、宽高不小于页面最低要求；OG 精确为 1200×630；文件名不含空格或个人数据。

- [ ] **Step 2: 确认失败**

Run: `node --test tests/product-assets.test.mjs`

Expected: FAIL，原因是资产尚未加入。

- [ ] **Step 3: 生成并接入脱敏素材**

从已验收界面导出截图，检查无真实姓名、文件名、目录、账号或设备信息，压缩为 WebP；OG 输出 PNG。不得用概念图标记为“真实界面”。

- [ ] **Step 4: 运行资产和页面测试**

Run: `node --test tests/product-assets.test.mjs tests/product-pages.test.mjs`

Expected: PASS。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后建议提交消息：`assets: add verified product screenshots`。

### Task 6: 完成产品 SEO 与在线应用排除规则

**Files:**
- Modify: `scripts/seo-routes.mjs`
- Modify: `src/seo/structuredData.ts`
- Modify: `scripts/prerender.mjs`
- Modify: `config/seo-keywords.json`
- Modify: `src/components/common/SEOMeta.tsx`
- Test: `tests/seo-routes.test.mjs`
- Test: `tests/seo-head.test.mjs`
- Test: `tests/seo-keywords.test.mjs`
- Test: `tests/static-render.test.mjs`

**Interfaces:**
- Consumes: 产品目录公开 SEO 字段。
- Produces: 两个 `SoftwareApplication` 路由、FAQPage、BreadcrumbList 和应用页 noindex 规则。

- [ ] **Step 1: 写 SEO 失败测试**

断言两个产品页存在于 route manifest 和 sitemap；结构化数据包含 `SoftwareApplication`；FAQ 与可见正文一致；在线应用不在 sitemap，且若静态文件存在则含 `noindex, nofollow`。

- [ ] **Step 2: 确认失败**

Run: `node --test tests/seo-routes.test.mjs tests/seo-head.test.mjs tests/seo-keywords.test.mjs tests/static-render.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现 SEO 路由和结构化数据**

为两页提供唯一 title、description、canonical、OG 和 breadcrumb；新增明确关键词记录并双向关联 `/products`。不声称搜索量、用户量或排名。

- [ ] **Step 4: 构建并验证 SEO**

Run: `npm run build && npm run check:seo && npm run check:seo-keywords`

Expected: PASS；产品页静态 HTML 有正文、一个 h1、canonical 和可解析 JSON-LD。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后建议提交消息：`feat: add product SEO routes`。

### Task 7: 明确 Clarity 数据边界并更新隐私政策

**Files:**
- Create: `src/analytics/productEvents.ts`
- Modify: `src/pages/Privacy.tsx`
- Modify: `src/components/products/DownloadSection.tsx`
- Test: `tests/product-analytics.test.mjs`
- Test: `tests/privacy-page.test.mjs`

**Interfaces:**
- Produces: `trackProductEvent({ product, version, action, platform? })`。
- Consumes: 仅固定枚举值；函数在 `window.clarity` 不存在时静默返回。

- [ ] **Step 1: 写失败测试**

断言事件 payload 只能含产品、版本、动作、平台；自由文本和本地路径类型上不可表达；在线应用产物不得包含 `clarity.ms` 或 Clarity 项目 ID。

- [ ] **Step 2: 确认失败**

Run: `node --test tests/product-analytics.test.mjs tests/privacy-page.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现最小事件包装和隐私文案**

动作枚举限定为 `online_use`、`download`、`github`、`release_notes`。隐私政策说明 Clarity 仅用于官网介绍页，GitHub 提供下载文件与下载次数，在线点名应用不加载分析脚本。

- [ ] **Step 4: 运行测试**

Run: `node --test tests/product-analytics.test.mjs tests/privacy-page.test.mjs && npm run check`

Expected: PASS。

- [ ] **Step 5: 暂停并请求明确 commit 授权**

授权后建议提交消息：`docs: define product analytics privacy boundary`。

### Task 8: 文档、全量验证与人工发布门禁

**Files:**
- Modify: `README.md`
- Modify: `ROADMAP.md`
- Modify: `RELEASES.md`
- Modify: `docs/release-rules.md`
- Create: `docs/releases/product-hub-acceptance.md`
- Test: `tests/product-release-workflow.test.mjs`

**Interfaces:**
- Consumes: 前七个任务的最终行为和外部仓库准备状态。
- Produces: 可复核的上线清单、回滚提交记录位和发布后冒烟清单。

- [ ] **Step 1: 写工作流失败测试**

断言 `npm run verify` 仍为统一门禁；CI 不访问真实 GitHub API、不上传 Release、不执行搜索平台提交；验收文档包含下载 hash、Clarity 排除、在线应用刷新、SEO 和回滚检查。

- [ ] **Step 2: 确认失败**

Run: `node --test tests/product-release-workflow.test.mjs`

Expected: FAIL，原因是验收文档和规则尚未同步。

- [ ] **Step 3: 同步文档和验收表**

记录两款产品、路径、公开仓库前置条件、精确 Release 资产、风险、人工证据位置和生产回滚方法。不要把“待授权”写成“已完成”。

- [ ] **Step 4: 运行全量确定性验证**

Run: `npm run verify`

Expected: PASS。若失败，记录首个失败命令和原因，不声称完成。

- [ ] **Step 5: 运行本地生产预览人工验收**

检查 `/products/`、两个产品页、移动端、微信大字体、下载链接、API 失败降级、静态 HTML、在线应用占位/就绪状态。不得在此步骤部署生产。

- [ ] **Step 6: 暂停并请求 commit、push、merge、deploy 的逐步授权**

每个动作分别展示精确文件、commit 范围、CI、生产影响和回滚提交。授权不可从前一步自动继承。

- [ ] **Step 7: 仅在发布获批后执行生产只读冒烟**

Run: `npm run seo:inspect`

并人工验证首页、产品列表、两个产品页、在线应用、四类下载、sitemap、robots、404 和 Clarity 范围。搜索平台 `--execute` 仍需另行授权。
