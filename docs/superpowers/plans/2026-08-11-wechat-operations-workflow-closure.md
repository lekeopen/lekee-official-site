# WeChat Operations Workflow Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the already-published WeChat article, its supporting content, and the local preview enhancements into one tested, maintainable, committed workflow before V1.4 begins.

**Architecture:** Keep the existing single-file WeChat CLI, but expose its pure Markdown parsing/rendering functions and add a side-effect-free `--no-open` preview path for automated tests. Preserve published source assets in their existing directories, remove machine-specific paths and the temporary root symlink, then run the repository’s full quality gate before synchronizing branches.

**Tech Stack:** Node.js 24, Node test runner, Markdown/front matter, existing WeChat CLI, npm scripts, Git.

## Global Constraints

- Do not auto-publish or modify WeChat backend content.
- Keep human review as the final publishing gate.
- Do not commit `.wechat-admin-output/` or machine-specific absolute paths.
- Keep formal images under `public/images/` and do not commit the root `images` symlink.
- Do not implement Baidu, Google, or Bing integration in this closure.
- Preserve all unrelated user changes.

---

### Task 1: Testable Article Rendering and Preview

**Files:**
- Create: `tests/wechat-admin-article.test.mjs`
- Modify: `tools/wechat-admin/src/cli.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: article Markdown with front matter and body content.
- Produces: exported `parseArticle(markdown: string)`, `markdownToHtml(markdown: string, options?: object)`, `renderWechatHtml(article: object)`, and a `--no-open` preview option that prints a `file://` URL without launching a browser.

- [ ] **Step 1: Write failing import-safety and preview tests**

Create a temporary Markdown fixture containing `##`, `###`, italic text, a blockquote, a list, and `/images/example.png`. Import the CLI module and assert importing it emits no help output or process exit. Spawn `article preview <fixture> --no-open` and assert exit code `0`, a `file://` URL, and no browser-launch message.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin node --test tests/wechat-admin-article.test.mjs
```

Expected: FAIL because the CLI executes `main()` on import and does not support `--no-open`.

- [ ] **Step 3: Make the CLI import-safe and injectable**

Guard `main()` with a direct-execution comparison using `pathToFileURL(process.argv[1]).href === import.meta.url`. Export the pure parser/render functions. Update `previewArticle()` so `options.noOpen === true` skips `openLocalFile()` and prints `未自动打开，请手动在浏览器中打开上面的 file URL。`.

- [ ] **Step 4: Add real rendering assertions**

Assert the generated HTML contains `<h2>`, `<h3>`, `<em>`, `<blockquote>`, `<ul>`, and an image whose source resolves through the configured `imageSrc` callback. Assert the text output retains meaningful article content and omits HTML tags.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin node --test tests/wechat-admin-article.test.mjs
```

Expected: all WeChat article tests PASS without opening a browser or calling WeChat APIs.

### Task 2: Preserve Published Assets and Remove Local Coupling

**Files:**
- Create: `tests/wechat-operations-assets.test.mjs`
- Modify: `tools/wechat-admin/articles/2026-08-10-operations-toolchain-publish-checklist.md`
- Verify: `tools/wechat-admin/articles/2026-08-10-operations-toolchain.md`
- Verify: `public/images/articles/2026-08-10-wechat-content-flow.svg`
- Verify: `docs/wechat-ops-hub.md`
- Remove: `images` symbolic link

**Interfaces:**
- Consumes: the published article source and its referenced images.
- Produces: a repository-portable published-content bundle with no `/Users/...` references and no root image alias.

- [ ] **Step 1: Write failing asset-portability tests**

Assert every local `/images/...` reference in the article resolves under `public/`, the publication checklist contains no `file:///Users/` or `/Users/` path, the SVG exists, and `images` is not a root-level tracked or untracked symlink.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin node --test tests/wechat-operations-assets.test.mjs
```

Expected: FAIL on the current absolute preview path and root `images` symlink.

- [ ] **Step 3: Replace machine-specific references**

Change the checklist’s preview entry to `.wechat-admin-output/articles/2026-08-10-operations-toolchain.html`. Keep source, output, cover, CTA, and image references repository-relative.

- [ ] **Step 4: Remove the temporary root alias**

Remove only the `images` symlink after confirming with `test -L images`; do not remove `public/images` or any target content.

- [ ] **Step 5: Run asset and article tests**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin node --test tests/wechat-admin-article.test.mjs tests/wechat-operations-assets.test.mjs
```

Expected: all tests PASS and the published article can still render from repository files.

### Task 3: Documentation, Full Verification, and Repository Closure

**Files:**
- Modify: `ROADMAP.md`
- Modify: `tools/wechat-admin/README.md`
- Modify: `tools/wechat-admin/articles/README.md`
- Modify: `tools/wechat-admin/content-plan.md`
- Create: `docs/wechat-ops-hub.md`
- Create: `docs/superpowers/plans/2026-08-10-wechat-automation-bark-handoff.md`

**Interfaces:**
- Consumes: the tested CLI and published content bundle.
- Produces: synchronized operational documentation, one coherent commit, clean branches, and a V1.4-ready repository.

- [ ] **Step 1: Review documentation against actual commands**

Confirm every documented command exists in `package.json`, preview remains manual, Bark is only a review reminder, and V1.4 remains marked `未开始`.

- [ ] **Step 2: Run the published-article smoke test**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin npm run wechat:article -- tools/wechat-admin/articles/2026-08-10-operations-toolchain.md
```

Expected: JSON output lists the article title and generated HTML/text paths.

- [ ] **Step 3: Run the full repository gate**

Run:

```bash
PATH=/Users/rockts/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin npm run verify
```

Expected: content validation, typecheck, ESLint, build, all tests, 26-route SEO validation, and bundle budget PASS.

- [ ] **Step 4: Inspect and commit the exact scope**

Run `git diff --check`, confirm generated RSS/publish timestamps are not accidentally included, then stage only the WeChat workflow, published content, tests, and V1.4 roadmap. Commit with:

```bash
git commit -m "feat: close WeChat operations workflow"
```

- [ ] **Step 5: Synchronize release branches**

Push `main`, fast-forward `develop` to the same verified commit, push `develop`, and confirm `main`, `develop`, `origin/main`, and `origin/develop` point to the same commit.

- [ ] **Step 6: Confirm the V1.4 start gate**

Verify the main worktree is clean, the published site remains healthy, and then create a separate `codex/site-v1.4-search-indexing` branch/worktree for the next specification cycle.
