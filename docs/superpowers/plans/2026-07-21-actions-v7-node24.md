# V1.1.1 GitHub Actions Runtime Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the quality workflow to GitHub Actions v7 and Node.js 24 without changing application behavior.

**Architecture:** Keep the existing single-job quality workflow and change only its action/runtime versions. Add a repository-level regression test that reads the workflow as text so future downgrades are caught by the existing `npm test` and `npm run verify` gates.

**Tech Stack:** GitHub Actions YAML, Node.js 24, Node.js built-in test runner, npm

## Global Constraints

- Use `actions/checkout@v7` and `actions/setup-node@v7`.
- Use `node-version: 24` for CI verification.
- Do not change application code, content, dependencies, build scripts, deployment settings, or production behavior.
- Release through `develop` before `main`.

---

### Task 1: Lock and Upgrade the Quality Workflow

**Files:**
- Create: `tests/quality-workflow.test.mjs`
- Modify: `.github/workflows/quality.yml`

**Interfaces:**
- Consumes: `.github/workflows/quality.yml` as UTF-8 text.
- Produces: a quality workflow pinned to action major version 7 and Node.js 24, protected by the standard test suite.

- [x] **Step 1: Write the failing regression test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/quality.yml', import.meta.url),
  'utf8',
);

test('quality workflow uses Node.js 24-native GitHub actions', () => {
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /node-version:\s*24/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v4/);
});
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/quality-workflow.test.mjs`

Expected: FAIL because the workflow still contains `actions/checkout@v4`, `actions/setup-node@v4`, and `node-version: 20`.

- [x] **Step 3: Upgrade the workflow versions**

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7
    with:
      node-version: 24
      cache: npm
  - run: npm ci
  - run: npm run verify
```

- [x] **Step 4: Run the focused test and full local quality gate**

Run: `node --test tests/quality-workflow.test.mjs`

Expected: 1 test passed, 0 failed.

Run: `npm run verify`

Expected: content validation, all tests, TypeScript, ESLint, build, and prerender complete with exit code 0.

- [x] **Step 5: Commit the workflow upgrade**

```bash
git add .github/workflows/quality.yml tests/quality-workflow.test.mjs
git commit -m "Upgrade quality workflow to Node 24 actions"
```

---

### Task 2: Record and Release V1.1.1

**Files:**
- Modify: `RELEASES.md`
- Modify: `docs/superpowers/plans/2026-07-21-actions-v7-node24.md`

**Interfaces:**
- Consumes: the verified workflow upgrade commit from Task 1.
- Produces: an auditable V1.1.1 release record and completed checklist.

- [x] **Step 1: Add the V1.1.1 release entry**

Add under the current release date:

```markdown
- V1.1.1：升级 GitHub Actions 至 v7，并将 CI 验证环境统一为 Node.js 24。
- 新增质量工作流版本回归测试，防止 action 或 Node.js 版本意外回退。
```

- [x] **Step 2: Mark completed plan steps**

Change every completed checkbox in this plan from `- [ ]` to `- [x]` only after its command has succeeded.

- [x] **Step 3: Run final pre-release verification**

Run: `git diff --check && npm run verify`

Expected: no whitespace errors and the complete quality gate exits 0.

- [x] **Step 4: Commit the release record**

```bash
git add RELEASES.md docs/superpowers/plans/2026-07-21-actions-v7-node24.md
git commit -m "Record V1.1.1 engineering maintenance release"
```

- [x] **Step 5: Release through branch gates**

Push the completed branch to `develop`, require the `quality` workflow to pass without the Node.js 20 action-runtime warning, fast-forward `main`, push it, and require the `main` quality workflow to pass. Confirm `https://lekeopen.com` and `https://lekeopen.com/rss.xml` return HTTP 200.
