# Site Experience Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate support entry points, clarify the feedback dialog, improve the services-card hierarchy, and close the remaining OSS distribution verification safely.

**Architecture:** Reuse the existing `SupportDialog` and `Support` form, keeping product pages responsible only for placement. Restructure the existing services-card markup without changing its data model. Keep OSS mirroring fail-closed and switch a product to OSS only after the object exists and passes read-back verification.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Node test runner, Cheerio, GitHub Actions, Aliyun OSS.

## Global Constraints

- Do not change feedback API, email, Lezhi, Turnstile, routes, product binaries, or service offerings.
- `/support/` remains the shareable and fallback support page.
- GitHub Release remains the authoritative release source and fallback download.
- No commit, push, merge, or production deployment without a separate explicit authorization.

---

### Task 1: Product support entry and dialog

**Files:**
- Modify: `tests/product-pages.test.mjs`
- Modify: `tests/product-support-entry.test.mjs`
- Modify: `src/components/support/SupportDialog.tsx`
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/pages/GuigeleiProduct.tsx`

**Interfaces:**
- Consumes: `SupportDialog({ productId })` and `/support/?product=<id>`.
- Produces: one visible `问题反馈与使用帮助` trigger per product context and an in-dialog fallback link.

- [x] Add assertions that product pages omit `单独打开反馈页`, contain the new trigger text, and the dialog source contains the product-aware heading and fallback link.
- [x] Run `node --test tests/product-pages.test.mjs tests/product-support-entry.test.mjs` and confirm the new assertions fail for the expected missing behavior.
- [x] Update `SupportDialog` copy and fallback, then remove duplicate standalone links from both product pages.
- [x] Rerun the focused tests and confirm they pass.

### Task 2: FAQ and services hierarchy

**Files:**
- Modify: `tests/product-pages.test.mjs`
- Create: `tests/services-page.test.mjs`
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/pages/GuigeleiProduct.tsx`
- Modify: `src/pages/Services.tsx`

**Interfaces:**
- Consumes: current product FAQ arrays and `coreServices` data.
- Produces: plain-language support answers and two-column semantic service cards.

- [x] Add tests requiring ordinary-user help FAQ copy, complete target text, named information labels, and `md:grid-cols-2` without `xl:grid-cols-4`.
- [x] Run the focused tests and confirm they fail for missing FAQ and current four-column/truncation behavior.
- [x] Add the minimal FAQ entries and restructure card markup without changing service data.
- [x] Rerun focused tests and confirm they pass.

### Task 3: OSS natural-run verification

**Files:**
- Modify only if a reproduced run failure requires it: `scripts/product-release-mirror.mjs`, its tests, catalog, and product-page tests.

**Interfaces:**
- Consumes: GitHub Actions run logs and public OSS object evidence.
- Produces: verified-existing or uploaded OSS assets; no overwrite on mismatched evidence.

- [x] Inspect the first real run on merge commit `9d9d959` and classify each object result.
- [x] If it fails, write a regression test reproducing the exact evidence mismatch before changing mirror code.
- [x] Implement only the minimal fail-closed compatibility fix and rerun mirror tests.
- [ ] Switch 归个类 to OSS primary only after its object returns 200 and matches size and SHA-256.

### Task 4: Full verification and preview package

**Files:**
- Verify all changed files and generated output.

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: reviewable, uncommitted branch until explicit Git authorization.

- [x] Run focused tests, `npm run verify`, `git diff --check`, and a secret-safe diff review.
- [x] Start a local production preview and inspect product and services routes at desktop and mobile sizes.
- [ ] Report the exact OSS state and request explicit authorization before commit/push/Draft PR.
