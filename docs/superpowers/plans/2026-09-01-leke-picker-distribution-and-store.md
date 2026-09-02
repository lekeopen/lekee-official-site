# 乐可点名正式版本、微软商店与下载分发 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让乐可点名的 GitHub 正式 Release、官网在线版、微软商店入口、历史版本和私有 OSS 镜像形成证据完整、可降级、费用可控的自动发行链路。

**Architecture:** GitHub 正式 Release 继续作为唯一版本权威。私有源码仓库为每个稳定 tag 构建安装包和在线分发包，并通过最小权限跨仓库凭据同步到公开 Release；官网监控验证这些附件后，原子更新发行 JSON 与在线静态目录。Microsoft Store 只作为经核对的 Windows 10/11 推荐安装渠道，OSS 只作为私有镜像，未通过 CDN 门禁时下载接口继续回退 GitHub。

**Tech Stack:** React 19、TypeScript、Vite、Node.js 24、Node test runner、Vitest、GitHub Actions、Cloudflare Pages Functions、GitHub Releases、阿里云 OSS/CDN。

**Spec:** `docs/superpowers/specs/2026-09-01-leke-picker-distribution-and-store-design.md`

## Global Constraints

- GitHub 正式 Release 是唯一版本权威；Microsoft Store、在线版和 OSS 都不能单独推进官网版本。
- 只接受严格 `vMAJOR.MINOR.PATCH`、`draft=false`、`prerelease=false` 且附件证据完整的 Release。
- 不改写现有公开 Git tag；公开 `v1.1.1` 源码标签已知不是正确的 v1.1.1 在线构建来源。
- OSS Bucket `lekeopen-downloads` 必须保持私有，页面和长期配置不得暴露 OSS 公网直链。
- CDN 门禁未全部通过前，`/api/download` 必须回退 GitHub。
- 在线版入口必须使用 `target="_blank"` 与 `rel="noopener noreferrer"`，保留原产品页。
- 官网保存最近 10 个稳定版本，页面显示当前版本和最近 2 个历史版本，GitHub 保留完整历史。
- 不新增运行时依赖；优先使用 Node 标准库和仓库现有依赖。
- 自动提交必须使用路径白名单；任何测试、CI、部署或生产验收失败都不得宣称完成。
- 提交、推送、PR、合并、Secret 配置和生产部署分别需要人工授权。

---

### Task 1: 在源码仓库生成可验证的在线分发包

**Repository:** `/Users/rockts/Dev/apps/classroom-random-picker`

**Files:**
- Create: `scripts/buildWebDistribution.cjs`
- Create: `scripts/verifyWebDistribution.cjs`
- Create: `src/platform/webDistribution.test.ts`
- Modify: `vite.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: clean source checkout, `package.json.version`, Git commit SHA.
- Produces: `release/web/leke-picker-web_<version>.tar.gz` and `release/web/leke-picker-web_<version>.manifest.json`.
- Manifest shape: `{ schemaVersion: 1, product: "leke-picker", version, sourceCommit, sourceDirty: false, base: "/products/leke-picker/app/", archive: { name, sizeBytes, sha256 }, files: Array<{ path, sizeBytes, sha256 }> }`.

- [ ] **Step 1: Write failing tests for the web-distribution contract**

Add tests that import exported helpers from `scripts/verifyWebDistribution.cjs` and assert:

```ts
expect(validateManifest(validManifest, files)).toEqual([])
expect(validateManifest({ ...validManifest, sourceDirty: true }, files)).toContain('sourceDirty must be false')
expect(validateManifest({ ...validManifest, version: '1.1.0' }, files)).toContain('manifest version must match package version')
expect(validManifest.base).toBe('/products/leke-picker/app/')
expect(files.get('index.html')).toContain('<meta name="robots" content="noindex, nofollow"')
expect([...files.keys()].some((name) => name.includes('..'))).toBe(false)
```

Also assert that every file digest is 64 lowercase hex, no output text contains `clarity.ms`, secrets, `/Users/`, `/private/`, `/Volumes/`, or Windows user paths.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/platform/webDistribution.test.ts`

Expected: FAIL because `buildWebDistribution.cjs` and `verifyWebDistribution.cjs` do not yet exist in the private source repository.

- [ ] **Step 3: Add the dedicated Vite distribution mode**

Refactor `vite.config.ts` to export `createViteConfig(isLekeopenWeb: boolean)`. When `LEKEOPEN_WEB_DISTRIBUTION=1`:

```ts
base: '/products/leke-picker/app/',
build: { outDir: 'dist-lekeopen', target: 'chrome108' },
plugins: [react(), {
  name: 'lekeopen-web-noindex',
  transformIndexHtml(html) {
    return html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />')
  },
}]
```

Default desktop behavior remains `base: './'` and `outDir: 'dist'`.

- [ ] **Step 4: Implement deterministic build evidence**

`buildWebDistribution.cjs` must:

1. refuse a non-clean source tree;
2. read the exact package version and `git rev-parse HEAD`;
3. run Vite with `LEKEOPEN_WEB_DISTRIBUTION=1`;
4. enumerate regular files under `dist-lekeopen` in bytewise path order;
5. reject symlinks, traversal paths, secrets and absolute development paths;
6. compute size and SHA-256 for each file;
7. create `leke-picker-web_<version>.tar.gz` containing only the verified files;
8. compute archive size/SHA-256 and write the manifest atomically;
9. call `verifyWebDistribution.cjs` against the finished outputs.

Expose pure validation helpers from `verifyWebDistribution.cjs` so the Vitest file tests validation without running a full build.

- [ ] **Step 5: Add package commands and run verification**

Add:

```json
"web:distribution": "node scripts/buildWebDistribution.cjs"
```

`buildWebDistribution.cjs` performs final verification internally so the command remains cross-platform.

Run:

```bash
npm test -- src/platform/webDistribution.test.ts
npm run lint
npm test
npm run web:distribution
```

Expected: all tests pass; the manifest version equals the source package version; `sourceDirty=false`; archive and file hashes verify.

- [ ] **Step 6: Review the isolated diff and request commit authorization**

Run: `git diff --check && git status --short`

Expected: only the five declared files plus generated ignored `release/web/` outputs. Do not commit until authorized.

---

### Task 2: 扩展私有 Release 到公开 Release 的安全同步

**Repository:** `/Users/rockts/Dev/apps/classroom-random-picker`

**Files:**
- Modify: `.github/workflows/sync-public-release.yml`
- Create: `scripts/workflowPublicReleaseSync.check.mjs`
- Modify: `package.json`
- Create: `docs/release/website-distribution-contract.md`

**Interfaces:**
- Consumes: private stable Release tag and verified installer from Task 1's source tag checkout.
- Produces public Release assets:
  - `leke-picker_<version>_x64-setup.exe`
  - `leke-picker-web_<version>.tar.gz`
  - `leke-picker-web_<version>.manifest.json`
- Cross-repo write credential: GitHub App installation token limited to `lekeopen/leke-picker`, Contents read/write; no classic PAT.

- [ ] **Step 1: Write failing workflow contract tests**

Parse `.github/workflows/sync-public-release.yml` and assert:

```js
assert.match(workflow, /actions\/create-github-app-token@/)
assert.match(workflow, /LEKE_PICKER_PUBLIC_APP_ID/)
assert.match(workflow, /LEKE_PICKER_PUBLIC_APP_PRIVATE_KEY/)
assert.match(workflow, /npm run web:distribution/)
assert.match(workflow, /leke-picker-web_\$\{?VERSION\}?\.tar\.gz/)
assert.match(workflow, /leke-picker-web_\$\{?VERSION\}?\.manifest\.json/)
assert.doesNotMatch(workflow, /PUBLIC_RELEASE_TOKEN/)
assert.doesNotMatch(workflow, /gh release delete|git push --force/)
```

Test idempotency rules: an existing asset with the same GitHub digest is accepted; a missing asset is uploaded; a same-name/different-digest asset causes failure and is never overwritten.

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test scripts/workflowPublicReleaseSync.check.mjs`

Expected: FAIL because the workflow still uses `PUBLIC_RELEASE_TOKEN` and publishes only the installer.

- [ ] **Step 3: Build from the true private source tag**

Update the workflow to check out `${SOURCE_TAG}` into an isolated path, run `npm ci`, full tests and `npm run web:distribution` there. Assert `git status --porcelain` is empty before building and verify the manifest `sourceCommit` equals `git rev-parse ${SOURCE_TAG}^{commit}`.

Do not check out or build the known-stale public source tag.

- [ ] **Step 4: Use a minimal GitHub App token**

Use `actions/create-github-app-token` with:

```yaml
owner: lekeopen
repositories: leke-picker
app-id: ${{ secrets.LEKE_PICKER_PUBLIC_APP_ID }}
private-key: ${{ secrets.LEKE_PICKER_PUBLIC_APP_PRIVATE_KEY }}
```

Pass only the generated token to public Release API calls. Keep workflow-level `contents: read`; the App installation alone owns the cross-repo write.

- [ ] **Step 5: Publish all three verified assets idempotently**

For each exact expected filename:

- calculate the local SHA-256;
- when the asset is absent, upload it;
- if present, require `state=uploaded`, positive size and exact `digest=sha256:<local>`;
- reject unknown executable/archive/manifest assets;
- never delete or overwrite mismatched evidence.

The public Release remains stable, not Draft/Prerelease. Its body continues to come from the private stable Release.

- [ ] **Step 6: Document the cross-repository contract and verify**

Document exact asset names, manifest schema, App permissions, failure behavior and rotation procedure. Run:

```bash
node --test scripts/workflowPublicReleaseSync.check.mjs
npm test
npm run lint
```

Expected: all pass and no workflow contains `PUBLIC_RELEASE_TOKEN`.

- [ ] **Step 7: Stop at the external credential gate**

Before any live run, request separate authorization to create/install the GitHub App and configure the two private repository Secrets. Never print the App private key. A workflow dry-run without write calls must pass before the first public upload.

---

### Task 3: 让官网验证并原子导入在线分发包

**Repository:** `/Users/rockts/Dev/leke-web`

**Files:**
- Create: `scripts/leke-picker-web-distribution.mjs`
- Modify: `scripts/product-release-monitor.mjs`
- Modify: `.github/workflows/product-release-monitor.yml`
- Modify: `src/products/releases.json` (machine-managed fields only)
- Modify: `tests/leke-picker-app.test.mjs`
- Modify: `tests/product-release-monitor.test.mjs`
- Modify: `tests/product-release-workflow.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes public Release assets and manifest from Task 2.
- Produces `public/products/leke-picker/app/**` plus `distribution-manifest.json` matching the current release version.
- Export: `validateWebDistributionManifest(manifest, release, archiveAsset): string[]` and `importWebDistribution({ rootDir, release, fetchImpl }): Promise<{ changed: boolean }>`.

- [ ] **Step 1: Replace hard-coded v1.1.0 assertions with failing current-version assertions**

In `tests/leke-picker-app.test.mjs`, load `src/products/releases.json` and assert:

```js
assert.equal(manifest.version, releases['leke-picker'].version)
assert.equal(manifest.product, 'leke-picker')
assert.equal(manifest.sourceDirty, false)
assert.equal(manifest.base, '/products/leke-picker/app/')
```

Retain file size/hash, noindex, base-path, secret and absolute-path checks. Add failure fixtures for archive path traversal, extra files, wrong archive hash, wrong source commit shape and version mismatch.

- [ ] **Step 2: Run focused tests and confirm the stale online app fails**

Run: `node --test tests/leke-picker-app.test.mjs tests/product-release-monitor.test.mjs tests/product-release-workflow.test.mjs`

Expected: FAIL because the online manifest is v1.1.0 and the monitor does not recognize the new web assets.

- [ ] **Step 3: Validate web assets as release evidence**

Extend the leke-picker policy so the installer remains the only required downloadable binary while these two exact names are allowed metadata/distribution assets:

```js
`leke-picker-web_${version}.tar.gz`
`leke-picker-web_${version}.manifest.json`
```

Require each GitHub asset to have one uploaded instance, positive safe size, lowercase SHA-256 digest and exact URL derived from repository/tag/name. Fetch the manifest and verify its bytes against GitHub size/digest before parsing it.

Add the validated web evidence under `release.web`, not under user-facing `release.assets`, so OSS installer mirroring does not upload the web archive.

- [ ] **Step 4: Implement safe atomic import**

`leke-picker-web-distribution.mjs` must:

1. download only the validated archive URL;
2. verify archive byte length and SHA-256 before extraction;
3. extract into a fresh temporary directory under the repository;
4. reject absolute paths, `..`, symlinks, hardlinks and undeclared files;
5. verify every extracted file against the manifest;
6. validate `index.html` noindex/base and scan text outputs for secrets/absolute paths;
7. atomically replace `public/products/leke-picker/app` only after all checks pass;
8. leave the previous online app byte-for-byte unchanged on any failure.

- [ ] **Step 5: Restrict workflow changes and commit paths**

Order the website workflow:

1. check stable releases;
2. import verified online distribution;
3. mirror installer assets to private OSS;
4. detect changes;
5. run `npm run verify`;
6. allow only `src/products/releases.json` and `public/products/leke-picker/app/**` in the staged diff;
7. commit once with `chore: update product releases`.

Dry-run must validate and report planned paths without downloading full OSS objects, writing release data or replacing the online directory.

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
node --test tests/leke-picker-app.test.mjs tests/product-release-monitor.test.mjs tests/product-release-workflow.test.mjs
npm run verify
```

Expected: all pass; v1.1.1 online manifest matches current release; OSS mirror plan contains installers only; staged path whitelist is exact.

---

### Task 4: 增加微软商店推荐入口、在线新窗口和历史版本 UI

**Repository:** `/Users/rockts/Dev/leke-web`

**Files:**
- Create: `src/products/storeChannels.ts`
- Create: `src/components/products/ReleaseHistory.tsx`
- Modify: `src/products/catalog.ts`
- Modify: `src/pages/LekePickerProduct.tsx`
- Modify: `src/components/products/DownloadSection.tsx`
- Modify: `src/analytics/productEvents.ts`
- Modify: `tests/product-catalog.test.mjs`
- Modify: `tests/product-pages.test.mjs`
- Modify: `tests/product-analytics.test.mjs`
- Modify: `tests/product-seo.test.mjs`

**Interfaces:**
- Export `MICROSOFT_STORE_CHANNEL` with `{ storeId: '9P8078B19P1H', url, verifiedVersion, status }` after live verification.
- Extend `ProductDefinition` with optional `store` and `releases` display data.
- `ReleaseHistory` consumes the current release plus at most two previous stable releases.

- [ ] **Step 1: Write failing page and catalog tests**

Assert:

```js
const online = $('a[href="/products/leke-picker/app/"]')
assert.equal(online.attr('target'), '_blank')
assert.equal(online.attr('rel'), 'noopener noreferrer')

const store = $('a[data-download-store="microsoft"]')
assert.equal(store.attr('href'), 'https://apps.microsoft.com/detail/9P8078B19P1H')
assert.equal(store.attr('target'), '_blank')
assert.match(store.text(), /Microsoft Store/)
assert.match(store.closest('[data-download-featured]').text(), /推荐|自动更新/)

assert.equal($('[data-release-history] [data-release]').length, 2)
```

Also assert the official installer and GitHub fallback remain present, Windows 7 remains collapsed, Store status `lagging` does not render “最新版”, and unavailable status promotes the installer to the primary action.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run build && node --test tests/product-pages.test.mjs tests/product-catalog.test.mjs tests/product-analytics.test.mjs tests/product-seo.test.mjs`

Expected: FAIL because no Store channel/history exists and the online link currently reuses the same window.

- [ ] **Step 3: Add a typed, fail-closed Store channel**

Use a small static module rather than scraping Microsoft Store at runtime. Accept only:

```ts
type StoreStatus = 'verified' | 'lagging' | 'unavailable'
```

Validate Store ID with `/^[A-Z0-9]{12}$/`, URL origin/path against `https://apps.microsoft.com/detail/<Store ID>`, and a four-part numeric Store package version. `verified` requires a separately recorded read-only check that the public page belongs to 乐可点名.

- [ ] **Step 4: Implement professional download hierarchy**

For Windows 10/11:

- Store button is primary only when status is `verified`;
- copy: “从 Microsoft Store 获取” and “推荐 · 自动更新”；
- official installer remains visible as “下载安装包”；
- GitHub remains “GitHub 备用下载”；
- unavailable Store state removes the Store CTA without affecting installer/GitHub links.

Do not change Windows 7 compatibility behavior or OSS routing.

- [ ] **Step 5: Open online app in a new browsing context**

Add exactly:

```tsx
target="_blank"
rel="noopener noreferrer"
```

to every product-page link whose destination is `/products/leke-picker/app/`. Keep the existing analytics handler.

- [ ] **Step 6: Add concise release history**

Render the current version plus `releases.slice(1, 3)`. Each historical row shows version, publication date and official GitHub Release link. Do not repeat download cards or expose OSS URLs. Add a final “查看全部历史版本” link to `https://github.com/lekeopen/leke-picker/releases`.

- [ ] **Step 7: Verify focused behavior and full build**

Run:

```bash
npm run build
node --test tests/product-pages.test.mjs tests/product-catalog.test.mjs tests/product-analytics.test.mjs tests/product-seo.test.mjs
npm run verify
```

Expected: tests pass; online link opens a new context; Store CTA is recommended; installer/GitHub/Win7 paths remain intact; history shows at most two older releases.

---

### Task 5: 一次性修复 v1.1.1 并验证未来自动联动

**Repositories:** private source, `lekeopen/leke-picker`, official website.

**Files:**
- Machine update: `src/products/releases.json`
- Machine update: `public/products/leke-picker/app/**`
- Create: `docs/operations/leke-picker-v1.1.1-distribution-acceptance-2026-09-01.md`

**Interfaces:**
- Uses the workflows and manifest contract from Tasks 1–4.
- Produces auditable run IDs, release asset evidence, deployment URL and production checks.

- [ ] **Step 1: Verify the true v1.1.1 source tag before any write**

Read-only checks:

```bash
git show-ref --verify refs/tags/v1.1.1
git status --short
git show v1.1.1:package.json
```

Expected: the private source tag resolves to the audited v1.1.1 commit and package version `1.1.1`. Record the commit SHA; do not use the public source tag.

- [ ] **Step 2: Run source and website dry-runs**

After authorized GitHub App Secret configuration, manually dispatch private sync for `v1.1.1` in dry-run mode. It must build/verify all three public assets and report only intended uploads. Dispatch the website monitor with `dry_run=true`; it must validate the public Release and report the online-directory change without writing.

Expected: both workflows succeed; no Release/branch/object changes occur during dry-run.

- [ ] **Step 3: Request explicit authorization for the real v1.1.1 repair**

The authorization must cover: uploading the two new web assets to the existing public v1.1.1 Release, running the website monitor with writes, committing its whitelisted changes, and allowing normal Cloudflare deployment. Do not infer this authority from design approval.

- [ ] **Step 4: Publish web evidence idempotently**

Run the private sync for `v1.1.1`. Verify via GitHub API that the public Release remains stable and contains exactly the installer plus the two expected web distribution assets, all uploaded with positive size and SHA-256 digest.

Expected: no existing installer is replaced; no unknown asset is present.

- [ ] **Step 5: Import, test and deploy through the normal website workflow**

Run the website monitor with writes. It must import the v1.1.1 online app, keep OSS private, run `npm run verify`, and commit only the whitelisted release/app paths. Wait for GitHub Actions and Cloudflare production deployment.

- [ ] **Step 6: Perform read-only production acceptance**

Verify:

- `/products/leke-picker/` displays v1.1.1;
- “立即在线使用” has `_blank`/`noopener noreferrer` and opens without replacing the product page;
- `/products/leke-picker/app/distribution-manifest.json` reports v1.1.1 and the expected source commit;
- 1–5 person fullscreen layout, roster import/export, keyboard start and local-only storage work in a real browser;
- Microsoft Store CTA opens the verified 乐可点名 page;
- official installer and GitHub backup download correctly;
- `/api/download` still falls back to GitHub while domestic CDN is disabled;
- old OSS public URL remains denied;
- `npm run seo:inspect -- --json` reports `releaseBlocking=false`.

- [ ] **Step 7: Record evidence and rollback**

Document GitHub workflow/run IDs, Release asset names/digests, website commit, Cloudflare deployment, production URLs and test results. Rollback is a website revert plus disabling the Store/online CTA if required; never make OSS public, delete the GitHub Release or rewrite a tag.

---

### Task 6: 保持国内 CDN 为独立上线门禁

**Repository:** `/Users/rockts/Dev/leke-web`

**Files:**
- Read only: `functions/api/download.js`
- Read only: `functions/download/security.mjs`
- Read only: `functions/download/signing.mjs`
- Read only: `tests/product-download-api.test.mjs`
- Create: `docs/operations/domestic-download-cdn-readiness.md`

**Interfaces:**
- Consumes: `DOWNLOAD_CDN_ENABLED`, fixed `DOWNLOAD_CDN_HOST`, server-only signing key and release asset whitelist.
- Produces: 302 to a <=120-second signed CDN URL only when every production gate is enabled; otherwise 302 to GitHub.

- [ ] **Step 1: Re-run the existing security tests before changing code**

Run: `node --test tests/product-download-api.test.mjs`

Expected: whitelist, rate limit, `private, no-store`, GitHub fallback and no OSS leakage tests pass. If they pass, do not rewrite working code.

- [ ] **Step 2: Document remaining external gates**

Record the observed status of ICP/备案接入, `downloads.lekeopen.com`, TLS, CDN private origin, cache key, rate limit, logs, monthly budget, daily threshold and alert destination. Unknown status remains “not ready”, never inferred as enabled.

- [ ] **Step 3: Keep production fail-closed until a separate authorization**

Do not enable CDN merely because code tests pass. A later production change requires explicit approval plus Range/full-download/SHA-256 verification, old OSS direct-link denial and billing/traffic evidence. Until then, GitHub fallback is the accepted production state.
