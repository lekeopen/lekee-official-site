# 官网下载可观测性与信任体验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 区分 OSS 与 GitHub 下载事件，消除页面累计数字歧义，验证自然定时分发，并形成签名与自定义下载域名的可执行只读结论。

**Architecture:** 复用现有 `ProductDownload`、`DownloadSection`、`DownloadStats` 和 Clarity 事件接口，不新增存储或第三方分析系统。自动分发继续由 GitHub Actions 承担；签名和下载域名只产出证据与后续门槛，不在本计划中购买或修改云配置。

**Tech Stack:** React 19、TypeScript、Microsoft Clarity、Node test runner、Cheerio、GitHub Actions、Cloudflare Pages、阿里云 OSS。

## Global Constraints

- GitHub Release 始终是权威发布源，OSS 是校验后的国内副本。
- 不新增 Cloudflare KV、D1、PostHog、数据库或公开统计面板。
- Clarity 事件不得携带 URL、文件名、用户标识、联系方式或表单内容。
- 不购买签名、不修改 DNS、不配置 OSS 自定义域名、不提交、不推送、不合并，除非分别获得明确授权。
- 不修改桌面 App 源码，不重新构建安装包。
- 不向百度、IndexNow 或其他搜索平台提交数据。

---

### Task 1: OSS 与 GitHub 下载事件分类

**Files:**
- Modify: `src/analytics/productEvents.ts`
- Modify: `src/products/catalog.ts`
- Modify: `src/components/products/DownloadSection.tsx`
- Modify: `tests/product-catalog.test.mjs`
- Create: `tests/product-download-analytics.test.mjs`

**Interfaces:**
- Consumes: `ProductDownload.analyticsEvent`, `trackProductEvent(eventName)`。
- Produces: `ProductDownload.fallbackAnalyticsEvent?: ProductEventName`，以及固定枚举的 OSS/GitHub 来源事件。

- [ ] **Step 1: 为事件枚举和目录映射编写失败测试**

  在 `tests/product-download-analytics.test.mjs` 读取 `productEvents.ts`、`catalog.ts` 和 `DownloadSection.tsx`，断言八个当前安装包来源事件存在，并断言备用链接调用 `fallbackAnalyticsEvent`。在 `tests/product-catalog.test.mjs` 断言每个已有下载对象的主事件以 `_oss` 结尾、备用事件以 `_github` 结尾。

- [ ] **Step 2: 运行测试并确认按预期失败**

  Run:

  ```bash
  node --test tests/product-download-analytics.test.mjs tests/product-catalog.test.mjs
  ```

  Expected: FAIL，原因是当前事件没有来源后缀，且 `fallbackAnalyticsEvent` 尚不存在。

- [ ] **Step 3: 实现最小事件模型**

  在 `ProductEventName` 中把现有安装包事件替换为以下固定枚举：

  ```ts
  | 'product_leke_picker_download_modern_oss'
  | 'product_leke_picker_download_modern_github'
  | 'product_leke_picker_download_win7_x64_oss'
  | 'product_leke_picker_download_win7_x64_github'
  | 'product_leke_picker_download_win7_x86_oss'
  | 'product_leke_picker_download_win7_x86_github'
  | 'product_guigelei_download_macos_oss'
  | 'product_guigelei_download_macos_github'
  | 'product_guigelei_download_windows_oss'
  | 'product_guigelei_download_windows_github'
  ```

  为 `ProductDownload` 增加：

  ```ts
  fallbackAnalyticsEvent?: ProductEventName;
  ```

  产品目录中的 OSS 主链接使用 `_oss`，GitHub 备用链接使用 `_github`。`DownloadSection` 的备用 `<a>` 在点击时调用：

  ```tsx
  onClick={() => download.fallbackAnalyticsEvent && trackProductEvent(download.fallbackAnalyticsEvent)}
  ```

- [ ] **Step 4: 重新运行专项测试**

  Run:

  ```bash
  node --test tests/product-download-analytics.test.mjs tests/product-catalog.test.mjs
  ```

  Expected: PASS。

---

### Task 2: GitHub 下载数字消歧

**Files:**
- Modify: `src/components/products/DownloadStats.tsx`
- Modify: `tests/download-stats-ui.test.mjs`
- Modify: `tests/product-pages.test.mjs`

**Interfaces:**
- Consumes: `fetchReleaseDownloadStats()` 返回的 GitHub Release 附件下载数。
- Produces: 默认标签 `GitHub Release 累计下载`；加载、失败时不渲染占位。

- [ ] **Step 1: 修改测试，要求明确的 GitHub 标签**

  在 `tests/download-stats-ui.test.mjs` 将默认标签断言改为 `GitHub Release 累计下载`，继续断言 loading 与 unavailable 返回 `null`。在产品页测试中禁止出现未限定来源的 `正式安装包累计下载`。

- [ ] **Step 2: 运行测试并确认旧文案导致失败**

  Run:

  ```bash
  node --test tests/download-stats-ui.test.mjs tests/product-pages.test.mjs
  ```

  Expected: FAIL，显示当前默认标签仍为 `正式安装包累计下载`。

- [ ] **Step 3: 修改默认标签**

  将 `DownloadStats` 默认值改为：

  ```tsx
  label = 'GitHub Release 累计下载'
  ```

  不改变 API、抓取逻辑或失败降级。

- [ ] **Step 4: 构建预渲染页面并重新运行测试**

  Run:

  ```bash
  npm run build
  node --test tests/download-stats-ui.test.mjs tests/product-pages.test.mjs
  ```

  Expected: PASS。

---

### Task 3: 自然定时分发验收

**Files:**
- Read only: `.github/workflows/product-release-monitor.yml`
- Read only unless defect reproduced: `scripts/product-release-monitor.mjs`
- Read only unless defect reproduced: `scripts/product-release-mirror.mjs`
- Create: `docs/operations/product-release-monitor-acceptance-2026-08-14.md`

**Interfaces:**
- Consumes: GitHub Actions `event=schedule` 运行与 OSS 镜像日志。
- Produces: 不含凭据的自然运行验收记录。

- [ ] **Step 1: 查询最新自然运行**

  使用 `gh run list --workflow product-release-monitor.yml` 找到合并修复后最新的 `event=schedule`。不得用手动 `workflow_dispatch` 替代自然运行证据。

- [ ] **Step 2: 核验自然运行证据**

  记录运行 ID、触发时间、head SHA、结论，以及四个当前对象的 `verified-existing` 状态。日志不得保存 AccessKey、Secret 或带签名的临时 URL。

- [ ] **Step 3: 处理没有自然运行的情况**

  若修复合并后未满 90 分钟，记录“等待自然调度”，不修改工作流。若超过 90 分钟，检查 workflow active 状态、默认分支、cron 和 concurrency；只有确认 GitHub 调度持续异常后，才另行提出每小时 cron 修复，不在本任务直接修改。

- [ ] **Step 4: 写入验收记录**

  文档必须包含 `PASS`、`WAITING` 或 `BLOCKED` 之一，并引用 GitHub Actions 运行 URL和非敏感 OSS 结果。`WAITING` 不得表述为自动调度已通过。

---

### Task 4: 签名与自定义下载域名只读核查

**Files:**
- Create: `docs/operations/download-domain-and-signing-readiness-2026-08-14.md`
- Read only: Cloudflare DNS、阿里云 OSS Bucket/域名绑定/备案状态、当前产品下载配置。

**Interfaces:**
- Consumes: DNS、HTTPS、OSS、备案接入和现有未签名包证据。
- Produces: 可执行结论、阻塞项和回滚方案；不改变外部状态。

- [ ] **Step 1: 核查公开 DNS 与 HTTPS**

  查询 `downloads.lekeopen.com` 的 A/AAAA/CNAME、HTTPS 响应与证书。记录“不存在”“存在但未绑定”或“可用”，不得猜测控制台状态。

- [ ] **Step 2: 核查阿里云 OSS 非敏感配置**

  使用现有登录会话或 CLI 只读查看 `lekeopen-downloads` 的区域、自定义域名、HTTPS、CORS、公共访问和 CDN 状态。不得输出 AccessKey、Cookie、Secret 或签名 URL。

- [ ] **Step 3: 记录签名就绪度**

  分别记录 Windows 代码签名和 macOS Developer ID/notarization 当前为未配置，列出需要的账号、证书、密钥托管和流水线边界；不购买、不创建证书。

- [ ] **Step 4: 形成结论和回滚方案**

  明确 `downloads.lekeopen.com` 是否满足启用条件。若不满足，结论必须是继续使用 OSS 官方 URL。回滚始终为恢复 `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com`，不删除对象或 GitHub 备用地址。

---

### Task 5: 完整验证与预览

**Files:**
- Verify: Tasks 1–4 的全部改动与文档。

**Interfaces:**
- Consumes: 完成的事件分类、统计文案和只读核查文档。
- Produces: 未提交的可审查工作树，以及后续 Git 授权所需证据。

- [ ] **Step 1: 运行专项测试与完整验证**

  Run:

  ```bash
  node --test tests/product-download-analytics.test.mjs tests/product-catalog.test.mjs tests/download-stats-ui.test.mjs tests/product-pages.test.mjs
  npm run verify
  git diff --check
  ```

  Expected: 全部退出码为 0。

- [ ] **Step 2: 本地生产预览**

  启动 `npm run preview`，检查 `/products/leke-picker/` 与 `/products/guigelei/` 的桌面端和 390px 手机端。确认两个链接、标签、SHA-256、未签名提示和反馈入口均正常。

- [ ] **Step 3: 检查事件隐私边界**

  确认事件参数只有固定 `ProductEventName`，不包含 URL、文件名、查询参数、用户输入或联系方式。

- [ ] **Step 4: 报告并等待 Git 授权**

  汇报自然调度状态、域名与签名结论、测试和视觉验收。未经明确授权，不提交、不推送、不创建 PR。
