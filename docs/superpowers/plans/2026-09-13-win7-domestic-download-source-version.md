# Windows 7 Domestic Download Source-Version Fix Implementation Plan

> **For Codex:** Execute with test-driven development and verify every release, mirror, and download-catalog boundary before integration.

**Goal:** Make inherited Windows 7 installers resolve to their immutable v1.1.0 OSS objects while current Windows 10/11 installers continue to resolve to the current release version.

**Architecture:** Extend each installer asset with its own immutable `version`. Direct release assets receive the current release version; inherited compatibility assets retain the version parsed from their locked GitHub Release URL. The OSS mirror and download catalog use the asset version, falling back to the enclosing release version for old same-version data.

**Tech Stack:** Node.js ES modules, Cloudflare Pages Functions, GitHub Actions, Aliyun OSS/CDN, Node test runner.

**Related design:** `docs/superpowers/specs/2026-08-27-secure-domestic-downloads-design.md`

---

### Task 1: Add regression tests for immutable asset source versions

**Files:**
- Modify: `tests/product-download-api.test.mjs`
- Modify: `tests/product-release-monitor.test.mjs`

1. Add a download-catalog assertion that Windows 7 x64 resolves to `/leke-picker/1.1.0/...` while modern x64 resolves to `/leke-picker/1.1.2/...`.
2. Add a mirror-plan assertion that an inherited asset uses its own version directory.
3. Add a release-monitor assertion that inherited assets retain `version: 1.1.0` and new direct assets record their current version.
4. Run only the affected tests and confirm they fail for the missing source-version behavior.

### Task 2: Implement and migrate asset-level versions

**Files:**
- Modify: `scripts/product-release-monitor.mjs`
- Modify: `scripts/product-release-mirror.mjs`
- Modify: `functions/download/catalog.mjs`
- Modify: `src/products/releases.json`
- Regenerate: `functions/download/release-data.generated.mjs`
- Regenerate: `functions/support/release-data.generated.mjs`

1. Record `version` on directly validated assets.
2. Parse and retain the source version for inherited Windows 7 assets.
3. Resolve mirror object keys and signed CDN paths from `asset.version ?? release.version`.
4. Validate that the GitHub fallback URL tag matches the resolved asset version.
5. Migrate canonical current and historical release data without altering names, sizes, hashes, or fallback URLs.
6. Regenerate committed release-data modules.

### Task 3: Verify behavior and document operations

**Files:**
- Modify: `docs/operations/secure-app-downloads.md`

1. Document that immutable OSS directories follow each asset's source version, including inherited compatibility installers.
2. Run affected tests, then `npm run verify`.
3. Run the mirror dry-run and inspect all planned object keys.
4. Perform read-only production API checks for modern x64 and both Windows 7 assets; record redirect host/path and final status without exposing signatures.
5. Stop before commit, push, workflow execution, OSS upload, or deployment unless explicit authorization is provided.
