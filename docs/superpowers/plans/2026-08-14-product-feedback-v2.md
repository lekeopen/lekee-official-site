# Product Feedback V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将官网产品反馈升级为产品页弹窗和独立页共用的结构化表单，并让每一条成功反馈同时进入乐知和支持邮箱。

**Architecture:** 官网以 `releases.json` 为产品、版本和运行环境的唯一公开数据源，前端共用一个表单组件，Cloudflare Pages Function 负责严格校验、Turnstile、限流、乐知写入和 Resend 通知。乐知增加最小权限、幂等的结构化反馈接收接口；任一投递失败，官网不返回成功。

**Tech Stack:** React 18、TypeScript、Vite、Cloudflare Pages Functions、KV、Turnstile、Resend、Python `BaseHTTPRequestHandler`、Node test runner。

## Global Constraints

- 官网仍是唯一公开反馈入口；`/support/` 保留为可分享和无 JavaScript 回退页面。
- 产品页弹窗锁定当前产品；独立页允许切换产品并同步 `?product=`。
- 版本和运行环境只能选择该产品正式 Release 数据中存在的组合，并保留“其他版本”和“无法确认环境”。
- 内部时间保存 UTC ISO 8601；邮件展示北京时间 `YYYY-MM-DD HH:mm:ss`，不显示毫秒、`T` 或 `Z`。
- 仅当联系方式是合法邮箱时设置 Resend `reply_to`；不得把收件地址当作回复地址。
- 乐知写入必须认证且按反馈编号幂等；日志不得输出联系方式、描述或 Token。
- 不增加数据库、第三方工单 SaaS 或新的运行时依赖。
- 未完成乐知与邮件双投递、Preview 验收、完整 `npm run verify` 和生产只读验收，不得发布。

---

### Task 1: 乐知结构化反馈接收契约

**Files:**
- Create: `/Users/rockts/Dev/lezhi/lezhi-knowledge-vault/scripts/kos_product_feedback.py`
- Modify: `/Users/rockts/Dev/lezhi/lezhi-knowledge-vault/scripts/kos_web_upload.py`
- Create: `/Users/rockts/Dev/lezhi/lezhi-knowledge-vault/scripts/kos_test_product_feedback.py`
- Modify: `/Users/rockts/Dev/lezhi/lezhi-knowledge-vault/README.md`

**Interfaces:**
- Consumes: `POST /api/v1/product-feedback` with `X-KOS-Token` and the exact schema from the approved design.
- Produces: `201 {"ok":true,"duplicate":false,"reference":"..."}` or idempotent `200` with `duplicate:true`; records append safely under the vault's generated-data area.

- [ ] **Step 1: Write failing tests** for strict keys and lengths, token rejection, first insert, identical retry, conflicting retry, and redacted logs.
- [ ] **Step 2: Run** `python3 scripts/kos_test_product_feedback.py`; expect failures because the module and route do not exist.
- [ ] **Step 3: Implement** a focused validator/store module using atomic file replacement and reference-keyed idempotency, then route the authenticated endpoint before generic upload handling.
- [ ] **Step 4: Add query-ready projection** containing product, version, environment, issue type, timestamps and reference so existing RAG ingestion can answer product-feedback questions without parsing email prose.
- [ ] **Step 5: Run** `python3 scripts/kos_test_product_feedback.py` and the existing remote/web regression tests; expect PASS.
- [ ] **Step 6: Document** endpoint, authentication, storage, backup and rollback, then commit only the listed Lezhi files.

### Task 2: Release history and product-specific option contract

**Files:**
- Modify: `src/products/releases.json`
- Modify: `scripts/product-release-monitor.mjs`
- Create: `src/support/options.js`
- Modify: `src/support/config.js`
- Modify: `src/support/types.ts`
- Modify: `tests/product-release-monitor.test.mjs`
- Modify: `tests/product-support-contract.test.mjs`

**Interfaces:**
- Produces: `getSupportProducts()`, `getVersionOptions(productId)`, `getEnvironmentOptions(productId, releaseTag)` and `isAllowedProductReleaseEnvironment(...)`.

- [ ] **Step 1: Add failing tests** proving new stable releases are prepended to bounded history and every selectable environment belongs to the chosen release asset set.
- [ ] **Step 2: Run** the two targeted test files; expect FAIL on missing history/options APIs.
- [ ] **Step 3: Extend release JSON** with `releases` history while preserving current top-level fields for product pages and rollback compatibility.
- [ ] **Step 4: Implement option derivation** including `other` and `unknown` fallbacks; never infer unavailable Windows or macOS editions.
- [ ] **Step 5: Run targeted tests**; expect PASS, then commit these files.

### Task 3: Shared feedback form and accessible modal

**Files:**
- Create: `src/components/support/SupportForm.tsx`
- Create: `src/components/support/SupportDialog.tsx`
- Modify: `src/pages/Support.tsx`
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/pages/GuigeleiProduct.tsx`
- Modify: `tests/product-support-page.test.mjs`
- Modify: `tests/product-support-entry.test.mjs`
- Modify: `tests/product-pages.test.mjs`

**Interfaces:**
- Consumes: Task 2 option APIs and existing `submitSupportRequest`.
- Produces: `<SupportForm lockedProductId?>` and `<SupportDialog productId triggerLabel>`.

- [ ] **Step 1: Add failing tests** for modal triggers, locked product, dependent version/environment resets, dialog labels, Escape, focus return and independent-page query synchronization.
- [ ] **Step 2: Run targeted support/page tests**; expect FAIL.
- [ ] **Step 3: Extract the existing form** without changing Turnstile behavior, then make all select fields controlled and dependent.
- [ ] **Step 4: Implement the dialog** with `role="dialog"`, `aria-modal`, labelled title, focus trap, body scroll lock and near-fullscreen mobile layout.
- [ ] **Step 5: Replace product-page links** with modal triggers while retaining a visible independent-page fallback link.
- [ ] **Step 6: Run targeted tests and `npm run build`**; expect PASS, then commit.

### Task 4: Server validation, Lezhi delivery and corrected email

**Files:**
- Create: `functions/support/record.mjs`
- Create: `functions/support/lezhi.mjs`
- Modify: `functions/support/validation.mjs`
- Modify: `functions/support/mailer.mjs`
- Modify: `functions/api/support.js`
- Modify: `wrangler.jsonc`
- Modify: `tests/product-support-api.test.mjs`
- Modify: `tests/product-support-security.test.mjs`

**Interfaces:**
- Consumes: `LEZHI_FEEDBACK_URL`, secret `LEZHI_FEEDBACK_TOKEN`, Resend variables, Task 1 endpoint.
- Produces: canonical record with `schemaVersion:1`; success only after `deliverFeedbackToLezhi(record)` and `sendSupportEmail(...)` both accept.

- [ ] **Step 1: Add failing tests** for forbidden combinations, canonical record, UTC persistence, China-time mail display, valid-email `reply_to`, non-email omission, Lezhi auth header, retry idempotency and partial-delivery failure.
- [ ] **Step 2: Run API/security tests**; expect FAIL.
- [ ] **Step 3: Implement canonical record and strict validation** using the shared release-derived contract.
- [ ] **Step 4: Implement Lezhi delivery** with timeout, safe error mapping and no payload logging.
- [ ] **Step 5: Correct Resend composition** and require both destinations before returning HTTP 201.
- [ ] **Step 6: Run targeted tests**; expect PASS, then commit.

### Task 5: Privacy, full verification and gated production release

**Files:**
- Modify: `src/pages/Privacy.tsx`
- Modify: `README.md`
- Modify: `tests/product-support-seo.test.mjs`

**Interfaces:**
- Consumes: completed Tasks 1-4 and configured Preview/production secrets.
- Produces: documented retention and delivery behavior plus live acceptance evidence.

- [ ] **Step 1: Update privacy copy** to disclose structured Lezhi storage, email notification, purpose, retention and `contact@lekeopen.com` rights channel.
- [ ] **Step 2: Run** `npm run verify`; expect every check PASS.
- [ ] **Step 3: Push the isolated branch and open a Draft PR**, then configure only the required Preview secrets without printing their values.
- [ ] **Step 4: Execute Preview E2E** for both products and verify one reference appears in Lezhi and one matching Resend delivery; verify modal keyboard and mobile behavior.
- [ ] **Step 5: Mark ready and merge only after GitHub Actions and Cloudflare Preview pass**, then wait for the production deployment.
- [ ] **Step 6: Execute one production feedback E2E** and verify the same reference in both destinations; run `npm run seo:inspect -- --json` read-only and perform no search-engine submission.
- [ ] **Step 7: Record evidence** for the PR, deployment, feedback reference, delivery result and rollback commit without recording personal data or secrets.
