# Company Website Blueprint Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved five-stage company website blueprint the canonical long-term direction and synchronize all current roadmap and V1.4 release status documentation with it.

**Architecture:** `WEBSITE_BLUEPRINT.md` owns long-term business stages and stage gates. `ROADMAP.md` owns concrete version scope and status, `README.md` exposes navigation, and `docs/seo/v1.4-acceptance.md` preserves engineering evidence while recording the completed production release and the remaining external platform checkpoints.

**Tech Stack:** Markdown, Git, existing npm verification commands

## Global Constraints

- Do not change website runtime code, dependencies, page content, or production configuration.
- Preserve the distinction between V1.4 engineering completion, production deployment, platform acceptance, and confirmed search indexing.
- Do not claim Baidu, Google, or Bing verification, sitemap acceptance, URL submission, or indexing without platform evidence.
- Keep China and Baidu as the first search priority while retaining Google and Bing compatibility.
- Do not commit or push without separate explicit user authorization.

---

### Task 1: Integrate the approved blueprint into project governance

**Files:**
- Review: `WEBSITE_BLUEPRINT.md`
- Modify: `ROADMAP.md`
- Modify: `README.md`
- Modify: `docs/seo/v1.4-acceptance.md`

**Interfaces:**
- Consumes: The approved five-stage definitions and current-state decision in `WEBSITE_BLUEPRINT.md`.
- Produces: One consistent documentation set in which the blueprint owns stages, the roadmap owns versions, the README links both, and the V1.4 acceptance record distinguishes completed release work from pending platform operations.

- [ ] **Step 1: Update the V1.4 roadmap status**

Change the V1.4 status in `ROADMAP.md` from “工程实现完成，待发布与平台验收” to “工程与生产发布完成，平台运营验收中”. Mark the production release and post-release inspection checklist items complete. Leave platform verification, sitemap acceptance, real provider submission, and confirmed indexing incomplete.

- [ ] **Step 2: Add the stage-to-version blueprint relationship**

Add a concise section near the top of `ROADMAP.md` that links to `WEBSITE_BLUEPRINT.md` and maps:

```text
第一阶段 正式上线 -> V1.0 -> 已完成
第二阶段 工程成熟 -> V1.1-V1.3 -> 已完成
第三阶段 搜索发现 -> V1.4 -> 进行中（工程与生产发布完成，平台运营验收中）
第四阶段 信任与转化 -> V1.5-V1.6 候选 -> 未开始
第五阶段 持续运营 -> V2.x 或持续运营版本 -> 未开始
```

State that a future version may start only when its blueprint stage entry conditions are satisfied.

- [ ] **Step 3: Expose the blueprint in README navigation**

Add a short “项目文档” section in `README.md` linking to:

```markdown
- [公司官网长期蓝图](./WEBSITE_BLUEPRINT.md)
- [版本路线图](./ROADMAP.md)
- [技术架构](./technical_architecture_document.md)
- [V1.0 产品需求与验收](./product_requirements_document.md)
```

Describe the blueprint as the owner of long-term stages and the roadmap as the owner of concrete versions.

- [ ] **Step 4: Record the V1.4 production release evidence**

Update `docs/seo/v1.4-acceptance.md` without rewriting its historical pre-release evidence. Add a dated post-release section recording:

```text
Production merge commit: ab73212cdd4a906d88c3745b5bf27bae697fe1d1
GitHub Actions quality: success
Cloudflare Pages production deployment: success
Production endpoints checked: home, robots.txt, sitemap.xml, rss.xml, about, 404
Sitemap canonical URL count: 26
Workspace after release: main synchronized with origin/main and clean
```

State explicitly that the three webmaster-platform verifications, sitemap acceptance, real URL submissions, and confirmed indexing remain pending.

- [ ] **Step 5: Synchronize acceptance checkboxes**

In `docs/seo/v1.4-acceptance.md`, mark only these checkpoints complete:

```text
[x] V1.4 branch released to production
[x] Post-release production SEO inspection has no blocking item
```

Keep every external platform or indexing checkpoint unchecked.

- [ ] **Step 6: Run document consistency checks**

Run:

```bash
grep -n -E "待发布|工程实现完成，待发布|V1.4" WEBSITE_BLUEPRINT.md ROADMAP.md README.md docs/seo/v1.4-acceptance.md
grep -n -E "百度|Google|Bing|平台运营验收|生产发布" WEBSITE_BLUEPRINT.md ROADMAP.md docs/seo/v1.4-acceptance.md
git diff --check
git diff --no-index --check /dev/null WEBSITE_BLUEPRINT.md
git diff --no-index --check /dev/null docs/superpowers/plans/2026-08-12-website-blueprint-integration.md
```

Expected result: no current-state statement says V1.4 is waiting for production release; platform verification and indexing remain explicitly pending; `git diff --check` exits 0. Each `git diff --no-index --check` may exit 1 because the file is new, but must emit no whitespace-error text.

- [ ] **Step 7: Run the project verification gate**

Run:

```bash
npm run verify
```

Expected result: content validation, TypeScript, ESLint, build, tests, SEO checks, SEO operations checks, and bundle budget all exit 0.

- [ ] **Step 8: Review the final documentation diff**

Run:

```bash
git status -sb
git diff --stat
git diff -- WEBSITE_BLUEPRINT.md ROADMAP.md README.md docs/seo/v1.4-acceptance.md docs/superpowers/plans/2026-08-12-website-blueprint-integration.md
```

Expected result: only the five documentation files in this plan are changed or added, with no runtime or generated-file changes. Revert generated timestamp-only changes if `npm run verify` creates them.

- [ ] **Step 9: Stop for commit authorization**

Report the verified file list and test evidence. Do not stage, commit, push, merge, or deploy until the user explicitly authorizes those actions.
