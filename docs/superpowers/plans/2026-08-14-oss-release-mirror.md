# OSS Release Mirror Implementation Plan

**Goal:** Mirror validated stable GitHub Release assets to the `lekeopen-downloads` OSS bucket before exposing domestic download URLs.

**Architecture:** Reuse `product-release-monitor.mjs` as the sole release-validation boundary. A focused mirror module consumes validated release data, produces deterministic object keys, supports a no-write dry-run, and invokes an injected OSS adapter for upload and read-back verification. The workflow runs mirroring before committing release metadata and fails closed on every mismatch.

**Tech Stack:** Node.js 24, Node test runner, GitHub Actions, Aliyun ossutil.

## Global Constraints

- GitHub Release remains authoritative and is retained as the fallback URL.
- OSS never receives draft, prerelease, undeclared, or digest-incomplete assets.
- Existing objects with a different digest are never overwritten.
- The workflow has no delete operation.
- No code signing, product build, DNS, CDN, or search-engine submission is included.
- No commit, push, or deployment is performed during this implementation session.

### Task 1: Deterministic mirror planning

- Add tests for immutable object keys, domestic URLs, checksum manifests, and no-write dry-run output.
- Implement the minimal planning API and CLI.

### Task 2: Verified OSS transfer

- Add tests for source digest verification, existing-object handling, upload, and read-back digest verification.
- Implement an injected command adapter so tests perform no network writes.

### Task 3: Website download model

- Add tests for domestic primary URL and GitHub fallback URL.
- Extend release data and catalog types without removing existing GitHub authority.

### Task 4: GitHub Actions integration

- Add workflow assertions for secrets, dry-run dispatch, OSS-before-site ordering, and no-delete behavior.
- Update the existing scheduled workflow and package scripts.

### Task 5: Verification

- Run focused tests, dry-run, and full `npm run verify` using Node.js 24.
- Inspect the diff for unexpected files and credential leakage.
