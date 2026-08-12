# Cloud Product Release Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a GitHub-hosted monitor every 15 minutes that safely updates the official-site product release data when either approved upstream repository publishes a complete stable release.

**Architecture:** Move machine-managed release facts into one validated JSON file consumed by both the React catalog and SEO route generator. A dependency-free Node.js monitor queries only the two locked public repositories, validates SemVer, release state, required assets, GitHub URLs, sizes, and SHA-256 digests, then atomically rewrites that JSON only for a strictly newer compatible release. A minimal-permission GitHub Actions workflow runs the monitor, performs the full verification gate, and commits only the release JSON when it changed.

**Tech Stack:** Node.js 24 ESM, TypeScript 5.8, native `node:test`, GitHub Actions, GitHub REST API.

## Global Constraints

- Monitor `lekeopen/leke-picker` and `lekeopen/guigelei-releases` only.
- Poll every 15 minutes and support `workflow_dispatch`.
- Ignore Draft and Prerelease releases.
- Do not add or remove supported platforms automatically.
- Require every locked asset, positive size, locked GitHub download URL, and SHA-256 evidence.
- Use no PAT, GitHub App secret, or external service.
- No update means no file write, commit, push, or deployment.
- Validation failure means no commit, push, merge, or deployment.
- Never execute Baidu, IndexNow, or other search-platform submissions.
- Disable Codex automation `automation-11` only after the cloud workflow passes a manual no-change run.

---

### Task 1: Establish a Single Validated Release Data Source

**Files:**
- Create: `src/products/releases.json`
- Modify: `src/products/catalog.ts`
- Modify: `scripts/seo-routes.mjs`
- Modify: `tests/product-catalog.test.mjs`
- Test: `tests/product-release-data.test.mjs`

**Interfaces:**
- Produces: JSON records keyed by `leke-picker` and `guigelei`, each with `repository`, `tag`, `version`, `publishedAt`, `releaseUrl`, and a fixed `assets` object keyed by current download ID.
- Consumes: existing human-managed product labels, platform strings, warnings, analytics events, and images from `catalog.ts`.

- [ ] **Step 1: Write failing tests for JSON-to-catalog and JSON-to-SEO behavior**

Assert literal current versions, release URLs, four asset identities, and that `loadSeoRoutes()` emits `1.1.0` and `1.5.0` from the JSON source.

- [ ] **Step 2: Run the focused tests and confirm they fail because `releases.json` is absent**

Run: `node --test tests/product-release-data.test.mjs tests/product-catalog.test.mjs`

- [ ] **Step 3: Add the current audited release JSON and import it from both consumers**

Keep display metadata in TypeScript. Replace only `version`, `releaseNotes`, `assetName`, `url`, `sha256`, and `sizeBytes` with JSON-backed fields. Enable JSON module resolution in TypeScript only if required by the existing compiler configuration.

- [ ] **Step 4: Strengthen catalog validation**

Validate that every available URL belongs to its product's locked repository and current tag, asset names are unique, and catalog version matches the release tag.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/product-release-data.test.mjs tests/product-catalog.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/products/releases.json src/products/catalog.ts scripts/seo-routes.mjs tests/product-release-data.test.mjs tests/product-catalog.test.mjs
git commit -m "refactor: centralize product release data"
```

### Task 2: Implement the Fail-Closed Release Monitor

**Files:**
- Create: `scripts/product-release-monitor.mjs`
- Create: `tests/product-release-monitor.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `checkProductReleases({ rootDir, fetchImpl, now }): Promise<{ changed: boolean, updates: Array<{ slug, from, to }> }>`.
- CLI: `npm run products:releases:check`; exit 0 for no change or valid update, nonzero for invalid upstream evidence.
- Consumes: `src/products/releases.json` and a locked in-code policy mapping each slug to exact repository and asset-name regexes.

- [ ] **Step 1: Write failing tests for no-change and valid newer-release updates**

Use temporary roots and complete literal GitHub Release fixtures. Assert byte-for-byte no write for current versions, and deterministic JSON for a compatible newer release.

- [ ] **Step 2: Run the focused tests and confirm the missing-module failure**

Run: `node --test tests/product-release-monitor.test.mjs`

- [ ] **Step 3: Implement strict SemVer comparison and Release parsing**

Accept only `vMAJOR.MINOR.PATCH`; reject malformed tags, downgrades as updates, Draft, Prerelease, missing publication timestamp, and repository mismatches.

- [ ] **Step 4: Implement locked asset validation**

Require the exact current asset IDs. Match the configured filename pattern for the candidate version, require `state=uploaded`, positive safe integer size, `digest=sha256:<64 lowercase hex>`, and the exact GitHub download URL derived from repository, tag, and encoded asset name. Reject missing, duplicate, or unknown binary assets.

- [ ] **Step 5: Implement deterministic atomic persistence**

Write a sibling temporary file with stable two-space JSON and final newline, then rename it. Do not write if serialized bytes are unchanged.

- [ ] **Step 6: Add failure-path tests**

Cover Draft, Prerelease, malformed tag, same/older version, missing asset, duplicate asset, unknown binary, invalid size, missing/conflicting digest, and off-repository URL. Assert the original file remains unchanged for every failure.

- [ ] **Step 7: Add CLI and package script**

Add `"products:releases:check": "node scripts/product-release-monitor.mjs"`; CLI prints a concise no-change or updated-version summary without dumping Release bodies.

- [ ] **Step 8: Run focused tests**

Run: `node --test tests/product-release-monitor.test.mjs`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add scripts/product-release-monitor.mjs tests/product-release-monitor.test.mjs package.json
git commit -m "feat: add fail-closed product release monitor"
```

### Task 3: Add the GitHub-Hosted Schedule and Commit Gate

**Files:**
- Create: `.github/workflows/product-release-monitor.yml`
- Create: `tests/product-release-workflow.test.mjs`

**Interfaces:**
- Schedule: `*/15 * * * *` plus `workflow_dispatch`.
- Permissions: workflow default `contents: read`; update job `contents: write` only.
- Concurrency: one monitor run at a time without cancelling an in-progress verified update.

- [ ] **Step 1: Write a failing workflow behavior test**

Parse the YAML as text and assert Node 24 actions, the exact 15-minute cron, manual trigger, concurrency, no secret references, no provider-submission commands, monitor-before-verify ordering, and a commit command restricted to `src/products/releases.json`.

- [ ] **Step 2: Run the test and confirm failure because the workflow is absent**

Run: `node --test tests/product-release-workflow.test.mjs`

- [ ] **Step 3: Implement the workflow**

Checkout `main`, set up Node 24 with npm cache, run `npm ci`, run the monitor, use `git diff --quiet -- src/products/releases.json` as the no-change gate, run `npm run verify` only when changed, set GitHub Actions bot identity, commit only the JSON file, and push normally to `main`. Never force-push.

- [ ] **Step 4: Run the workflow test**

Run: `node --test tests/product-release-workflow.test.mjs`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/product-release-monitor.yml tests/product-release-workflow.test.mjs
git commit -m "ci: monitor product releases in GitHub Actions"
```

### Task 4: Verify, Publish, and Exercise the Cloud Monitor

**Files:**
- Modify only if verification exposes a defect in the files above.

**Interfaces:**
- Produces: a merged PR, a successful production deployment, and a successful manual no-change workflow run.

- [ ] **Step 1: Run full local verification**

Run: `npm run verify`
Expected: all application tests, SEO operations tests, TypeScript, ESLint, build, prerender, and bundle checks pass.

- [ ] **Step 2: Confirm clean intended diff**

Run: `git diff --check`, restore timestamp-only `public/rss.xml` and `publish-queue.json`, and verify no unrelated files are staged.

- [ ] **Step 3: Push and create a Draft PR**

Push `codex/cloud-release-monitor`; PR body must document permissions, fail-closed behavior, no external secret, and verification counts.

- [ ] **Step 4: Wait for PR checks**

Require GitHub `verify` and Cloudflare Pages preview success. Do not merge on pending or failed checks.

- [ ] **Step 5: Merge and wait for production**

Convert to Ready, squash merge, require main-branch `verify` and Cloudflare Pages success.

- [ ] **Step 6: Run the workflow manually**

Run `gh workflow run product-release-monitor.yml --ref main`, wait for completion, and confirm it reports both current versions with no commit created.

- [ ] **Step 7: Run final production SEO inspection**

Run: `npm run seo:inspect -- --json`
Expected: 63/63 passed, zero failures, `releaseBlocking=false`.

- [ ] **Step 8: Disable the Studio monitor**

Delete Codex automation `automation-11` only after Steps 5-7 succeed. Report that cloud monitoring replaced the Studio dependency.
