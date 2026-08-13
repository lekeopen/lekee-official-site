# 产品帮助与反馈渠道实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 lekeopen.com 建立无需 GitHub 账号、具备隐私保护和反垃圾能力的统一产品反馈渠道。

**Architecture:** 新增 React `/support/` 页面和 Cloudflare Pages Function `/api/support`。前端负责引导与基础校验，服务端负责严格校验、Turnstile、频率限制、反馈编号和邮件投递；不引入数据库和附件上传。

**Tech Stack:** React 18、TypeScript、Vite、Cloudflare Pages Functions、Cloudflare Turnstile、Node 24 测试工具。

## Global Constraints

- 保留 `/contact/` 与现有 EmailJS 业务咨询流程，不在本项目中重构。
- 不要求注册或 GitHub 账号；GitHub Issue 仅作为开发者次要入口。
- 不上传附件，不将表单正文或联系方式写入应用日志或浏览器持久存储。
- 只有服务端邮件供应商确认接受后才显示提交成功。
- 所有用户输入按纯文本处理，服务端 Secret 不得进入 Vite 客户端构建。
- 生产发布前必须确认 `support@lekeopen.com` 可收信并完成真实邮件验收。
- 不执行百度、IndexNow 或其他搜索平台真实提交。

---

## 文件结构

- `src/support/config.ts`：产品、系统和问题类型共享配置。
- `src/support/types.ts`：请求、响应和页面状态类型。
- `src/support/client.ts`：仅负责调用 `/api/support` 并规范化响应。
- `src/pages/Support.tsx`：支持页面、表单状态与无障碍反馈。
- `functions/api/support.ts`：Pages Function 请求入口。
- `functions/support/validation.ts`：服务端解析、白名单和长度校验。
- `functions/support/security.ts`：Origin、Turnstile、蜜罐和频率限制。
- `functions/support/mailer.ts`：纯文本邮件构造与邮件供应商适配。
- `functions/support/reference.ts`：反馈编号生成。
- `src/App.tsx`、`src/pages/LekePickerProduct.tsx`、`src/pages/GuigeleiProduct.tsx`：路由与产品入口。
- `src/seo/site.ts`、静态生成配置：canonical、sitemap 和预渲染路由。
- `tests/product-support-*.test.mjs`：页面、API、安全、隐私、SEO 和构建测试。
- `DEPLOYMENT_ENV_SETUP.md`、`.env.example`：非秘密变量名称、Secret 和人工配置步骤。

---

### Task 1: 建立共享数据契约与反馈编号

**Files:**
- Create: `src/support/config.ts`
- Create: `src/support/types.ts`
- Create: `functions/support/reference.ts`
- Test: `tests/product-support-contract.test.mjs`

**Interfaces:**
- Produces: `PRODUCT_OPTIONS`, `SYSTEM_OPTIONS`, `ISSUE_TYPE_OPTIONS`。
- Produces: `SupportRequest`, `SupportSuccess`, `SupportFailure`。
- Produces: `createSupportReference(now: Date, randomBytes: Uint8Array): string`。

- [ ] 写失败测试，断言产品 slug 仅包含 `leke-picker`、`guigelei`、`other`，选项值唯一，并断言固定日期和随机字节生成 `LK-20260813-` 前缀且不含用户数据。
- [ ] 运行 `node --test tests/product-support-contract.test.mjs`，确认因模块不存在而失败。
- [ ] 实现只读选项配置、判别联合响应类型和大写十六进制随机编号。
- [ ] 重跑目标测试，确认通过。

### Task 2: 实现服务端输入校验与纯文本邮件

**Files:**
- Create: `functions/support/validation.ts`
- Create: `functions/support/mailer.ts`
- Test: `tests/product-support-api.test.mjs`

**Interfaces:**
- Consumes: Task 1 的选项值与 `SupportRequest`。
- Produces: `parseSupportRequest(value: unknown): { ok: true; data: SupportRequest } | { ok: false; fieldErrors: Record<string,string> }`。
- Produces: `buildSupportEmail(reference: string, data: SupportRequest, submittedAt: string): { subject: string; text: string }`。
- Produces: `sendSupportEmail(env, message): Promise<{ accepted: boolean }>`。

- [ ] 写失败测试覆盖：未知字段、非法枚举、描述 19/20/3000/3001 字、联系方式长度、HTML 字符、换行邮件头注入和隐私确认缺失。
- [ ] 运行 `node --test tests/product-support-api.test.mjs`，确认失败。
- [ ] 实现严格对象白名单和 Unicode 安全长度校验；允许描述包含普通标点，但永不把它作为 HTML 渲染。
- [ ] 实现固定主题 `[产品反馈][产品名][问题类型] 编号` 和纯文本正文；拒绝主题字段中的 CR/LF。
- [ ] 实现邮件供应商适配器，仅从 `env.SUPPORT_MAIL_*` 读取服务端配置，失败返回 `accepted: false`。
- [ ] 重跑目标测试，确认通过且测试输出不出现联系方式或正文。

### Task 3: 实现反垃圾与 Pages Function

**Files:**
- Create: `functions/support/security.ts`
- Create: `functions/api/support.ts`
- Test: `tests/product-support-security.test.mjs`
- Test: `tests/product-support-api.test.mjs`

**Interfaces:**
- Produces: `verifyTurnstile(token, remoteIp, secret, fetchImpl): Promise<boolean>`。
- Produces: `checkRequestOrigin(request, allowedOrigins): boolean`。
- Produces: `checkRateLimit(env, clientKey): Promise<boolean>`。
- Produces: Pages Function `onRequestPost(context): Promise<Response>`。

- [ ] 写失败测试覆盖非 POST、错误 Content-Type、超限正文、非法 Origin、蜜罐命中、Turnstile 失败/超时、限流、邮件失败和成功响应。
- [ ] 运行两份目标测试，确认失败。
- [ ] 实现 Origin 白名单、`application/json` 与正文大小限制；客户端标识只用于短周期限流，不写入响应或日志。
- [ ] 服务端调用 Turnstile `siteverify`，网络异常按失败处理。
- [ ] 使用 Cloudflare KV 绑定 `SUPPORT_RATE_LIMIT` 做带 TTL 的粗粒度计数；KV 缺失时生产环境 fail closed，测试环境使用注入存根。
- [ ] 串联校验、安全检查、编号与邮件；成功返回 `201 { ok: true, reference }`，可重试服务异常返回 `503 { ok: false, code: "temporarily_unavailable" }`。
- [ ] 为所有响应设置 `Cache-Control: no-store`、`X-Content-Type-Options: nosniff`，日志只记录编号和错误类别。
- [ ] 重跑目标测试，确认通过。

### Task 4: 实现 Support 页面和产品预选

**Files:**
- Create: `src/support/client.ts`
- Create: `src/pages/Support.tsx`
- Modify: `src/App.tsx`
- Test: `tests/product-support-page.test.mjs`

**Interfaces:**
- Consumes: Task 1 的共享配置和类型。
- Produces: `submitSupportRequest(payload, turnstileToken, signal): Promise<SupportSuccess>`。
- Produces: `/support/` 页面，接受查询参数 `product`。

- [ ] 写失败测试，断言路由、唯一 H1、产品参数合法预选/非法回退、全部字段、隐私确认、Turnstile 容器、备用邮箱和无 GitHub 要求文案存在。
- [ ] 运行 `node --test tests/product-support-page.test.mjs`，确认失败。
- [ ] 实现客户端请求封装，区分字段错误、验证失败、频率限制和临时不可用；不记录 payload。
- [ ] 实现响应式表单和字段级错误，提交时禁用按钮并阻止重复请求。
- [ ] 成功时清空敏感字段，保留并展示反馈编号；失败时保留输入并显示 `support@lekeopen.com`。
- [ ] 加入键盘焦点、`aria-live` 状态和 Turnstile token 过期重置。
- [ ] 重跑目标测试，确认通过。

### Task 5: 接入产品页并调整 GitHub 入口层级

**Files:**
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/pages/GuigeleiProduct.tsx`
- Test: `tests/product-support-entry.test.mjs`
- Test: `tests/product-pages.test.mjs`

**Interfaces:**
- Consumes: `/support/?product=<slug>`。
- Produces: 两个产品页的普通用户主入口与开发者次入口。

- [ ] 写失败测试，断言两个页面都有正确预选链接；乐可点名安装帮助不再把 GitHub Issue 作为普通用户主渠道。
- [ ] 运行目标测试，确认失败。
- [ ] 在安装帮助或 FAQ 附近加入“使用遇到问题？提交反馈”，并保持 44px 最小触控区域。
- [ ] 将 GitHub Issue 文案明确为“开发者与开源贡献者反馈”，不删除现有开源协作能力。
- [ ] 重跑目标测试与现有产品页测试，确认通过。

### Task 6: 补齐 SEO、隐私与静态构建

**Files:**
- Modify: `src/pages/Privacy.tsx`
- Modify: `src/seo/site.ts`
- Modify: `scripts/prerender.mjs`
- Modify: `scripts/validate-seo-build.mjs`
- Test: `tests/product-support-seo.test.mjs`
- Test: `tests/production-artifact-privacy.test.mjs`
- Test: `tests/static-render.test.mjs`

**Interfaces:**
- Produces: `/support/` 的 title、description、canonical、静态 HTML 和 sitemap 条目。
- Produces: 反馈用途、处理方式、保留原则和联系方式的隐私说明。

- [ ] 写失败测试，断言 Support SEO 元数据、单 H1、canonical、预渲染和 sitemap 覆盖。
- [ ] 写隐私测试，断言生产构建不含邮件 Secret、Turnstile Secret、示例 token 或用户反馈样本。
- [ ] 运行目标测试，确认失败。
- [ ] 添加 Support SEO 与静态路由，并更新隐私说明；不把 API 路由加入 sitemap。
- [ ] 重跑目标测试，确认通过。

### Task 7: 部署配置、运行手册与故障降级

**Files:**
- Modify: `.env.example`
- Modify: `DEPLOYMENT_ENV_SETUP.md`
- Create: `docs/product-support-operations.md`
- Test: `tests/product-support-operations.test.mjs`

**Interfaces:**
- Documents: `VITE_TURNSTILE_SITE_KEY`（公开站点键）。
- Documents: `TURNSTILE_SECRET_KEY`、`RESEND_API_KEY`、`SUPPORT_MAIL_FROM`、`SUPPORT_MAIL_TO`（服务端变量/Secret）。
- Documents: `SUPPORT_RATE_LIMIT` KV binding。

- [ ] 写失败测试，断言文档区分公开变量和 Secret，并包含收件验证、密钥轮换、失败降级与回滚步骤。
- [ ] 运行目标测试，确认失败。
- [ ] 更新示例变量，只给变量名和无效占位值，不提交真实凭据。
- [ ] 编写运维手册：创建邮箱、配置 Turnstile、KV 和邮件服务，预览真实投递，日志安全检查，关闭表单功能开关与恢复步骤。
- [ ] 重跑目标测试，确认通过。

### Task 8: 全量验证与人工发布门禁

**Files:**
- Modify as needed only for defects discovered by verification.

- [ ] 使用 Node 24 运行 `npm run verify`，保存通过证据；任何失败先定位根因，不跳过测试。
- [ ] 本地预览桌面与移动布局，检查产品预选、字段错误、键盘操作、成功/失败状态。
- [ ] 运行生产构建产物隐私扫描，确认没有服务端 Secret 或测试反馈正文。
- [ ] 人工创建或确认 `support@lekeopen.com`，再在 Cloudflare 预览环境配置 Secret、KV 和 Turnstile。
- [ ] 在预览环境完成真实提交，确认邮件到达、主题字段正确、编号一致且日志无个人信息。
- [ ] 经人工确认后提交、推送并创建 PR；等待 GitHub Actions 与 Cloudflare 预览全部通过。
- [ ] 经人工批准后合并 `main`，等待生产部署，再完成页面 200、API 失败/成功语义、邮件到达和 `npm run seo:inspect -- --json` 只读验收。
- [ ] 不运行 `seo:submit`，不向百度、IndexNow 或其他搜索平台提交。

## 实施顺序与审核点

1. Task 1–3 完成后审核服务端契约、安全边界和日志隐私。
2. Task 4–6 完成后审核页面体验、产品入口和 SEO。
3. Task 7 完成后暂停，等待邮箱、Turnstile、KV 与邮件服务的外部配置授权。
4. Task 8 的提交、推送、PR、合并和生产配置分别遵循人工授权门禁。
