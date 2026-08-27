# Secure Domestic App Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public OSS App URLs with a rate-limited same-origin signer for a private-OSS-backed CDN, and stop scheduled full-object OSS verification.

**Architecture:** Product pages link to a Cloudflare Pages Function using allowlisted product and asset IDs. The function issues a short-lived Alibaba Cloud CDN type-C signed redirect, while the release mirror uses metadata-only verification for existing objects.

**Tech Stack:** React, TypeScript, Cloudflare Pages Functions, KV, Node.js crypto, Alibaba Cloud CDN URL authentication, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-27-secure-domestic-downloads-design.md`

## Global Constraints

- Do not restore OSS public read.
- Do not proxy installer bytes through Cloudflare Pages Functions.
- Do not expose the OSS origin hostname or CDN signing key to clients.
- Keep GitHub Release URLs unchanged as fallback downloads.
- Do not commit, push, deploy, modify DNS, or modify cloud configuration in this implementation session.

---

### Task 1: Stop recurring OSS full-object reads

**Files:**
- Modify: `scripts/product-release-mirror.mjs`
- Modify: `.github/workflows/product-release-monitor.yml`
- Test: `tests/product-release-monitor.test.mjs`
- Test: `tests/product-release-workflow.test.mjs`

**Interfaces:**
- Produces: `buildMirrorPlan(releases)` with immutable object evidence only.
- Produces: `mirrorReleaseAssets(releases, options)` that calls `oss.read()` only after a new upload.

- [ ] Add tests proving existing objects use HEAD metadata only and mirror plans contain no public URL.
- [ ] Run the focused tests and observe the expected failures.
- [ ] Remove `publicBaseUrl`, `domesticUrl`, and `OSS_PUBLIC_BASE_URL`; accept existing objects after complete metadata equality.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Add the allowlisted CDN signing service

**Files:**
- Create: `functions/download/catalog.mjs`
- Create: `functions/download/signing.mjs`
- Create: `functions/download/security.mjs`
- Create: `functions/api/download.js`
- Create: `tests/product-download-api.test.mjs`

**Interfaces:**
- Produces: `findDownloadAsset(product, asset)` returning only committed release evidence.
- Produces: `createCdnSignedUrl({ host, pathname, key, now, ttlSeconds })` using Alibaba CDN type-C query parameters.
- Produces: GET/HEAD `/api/download?product=<slug>&asset=<id>` returning 302, 400, 404, 429, or 503.

- [ ] Add tests for allowlisting, signing, bounded TTL, response host, configuration failure, safe logging, and rate limiting.
- [ ] Run the focused tests and observe the expected failures.
- [ ] Implement the smallest modules and handler that satisfy the contract.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Route product pages through the controlled endpoint

**Files:**
- Modify: `src/products/catalog.ts`
- Modify: `src/analytics/productEvents.ts`
- Modify: `src/components/products/DownloadSection.tsx`
- Modify: `tests/product-catalog.test.mjs`
- Modify: `tests/product-download-analytics.test.mjs`

**Interfaces:**
- Consumes: `/api/download` from Task 2.
- Produces: same-origin primary download URLs and unchanged GitHub fallbacks.

- [ ] Update tests to require same-origin controlled URLs and forbid the OSS hostname.
- [ ] Run focused tests and observe the expected failures.
- [ ] Replace public OSS URLs with encoded product/asset API URLs and source-neutral domestic analytics names.
- [ ] Add graceful domestic-unavailable copy while retaining the GitHub link.
- [ ] Run focused tests and confirm they pass.

### Task 4: Add deployment configuration and operational documentation

**Files:**
- Modify: `wrangler.jsonc`
- Create: `docs/operations/secure-app-downloads.md`
- Modify: `tests/product-release-workflow.test.mjs`
- Modify: `tests/product-download-api.test.mjs`

**Interfaces:**
- Produces: required binding/secret names and a fail-closed deployment checklist.

- [ ] Add contract tests for required non-secret variables and dedicated KV binding names.
- [ ] Run focused tests and observe the expected failures.
- [ ] Add placeholder-free runtime variable names, preview isolation requirements, CDN/DNS steps, alarms, rollback and one-time checksum verification instructions.
- [ ] Run focused tests and confirm they pass.

### Task 5: Full verification and leakage audit

**Files:**
- Verify all changed files.

- [ ] Run `npm run verify` and require exit 0.
- [ ] Search source and generated output for `lekeopen-downloads.oss-cn-beijing.aliyuncs.com`; require zero public references.
- [ ] Run focused API tests under Node and inspect the complete diff.
- [ ] Report local results and the still-manual Alibaba Cloud, Cloudflare secret/KV, DNS, Preview, and production gates without committing or publishing.
