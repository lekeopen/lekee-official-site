# WeChat Large Text Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep key mobile layouts usable when WeChat enlarges text, without overriding the user's selected font size.

**Architecture:** Preserve the existing React and Tailwind structure. Add a dependency-free source regression test for the required responsive classes, then make targeted class and viewport changes so text can wrap and containers can grow.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Vite 6, Node built-in test runner.

## Global Constraints

- Do not add `user-scalable=no` or `maximum-scale=1`.
- Do not add WeixinJSBridge font-reset behavior.
- Preserve existing routes, content, and visual hierarchy.
- Verify both source policy and final production artifacts.

---

### Task 1: Add large-text regression policy

**Files:**
- Create: `tests/wechat-large-text-layout.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing source files as UTF-8 text.
- Produces: `npm test`, validating viewport and layout policy.

- [ ] Write tests requiring `viewport-fit=cover`, natural solution-card height, wrapping metadata/footer rows, breakable contact text, and no zoom lock.
- [ ] Run the test and confirm it fails on the missing policy.
- [ ] Add only the `test` package script required to run the Node test.

### Task 2: Make affected layouts resilient

**Files:**
- Modify: `index.html`
- Modify: `src/pages/Solutions.tsx`
- Modify: `src/pages/ProjectDetail.tsx`
- Modify: `src/pages/NewsDetail.tsx`
- Modify: `src/pages/News.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Services.tsx`
- Modify: `src/pages/Contact.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: existing Tailwind utility classes.
- Produces: layouts that wrap, grow, and avoid clipping at enlarged font settings.

- [ ] Replace fixed text height with a minimum height that can grow.
- [ ] Add wrapping and minimum-width safeguards to metadata and title rows.
- [ ] Allow contact identifiers and footer registration links to break or wrap.
- [ ] Remove line clamping from mobile summaries while retaining it from the medium breakpoint upward.
- [ ] Run the regression test and confirm it passes.

### Task 3: Verify and release

**Files:**
- Modify: `RELEASES.md`
- Generated during verification: `dist/**`, `public/rss.xml`, `publish-queue.json`

**Interfaces:**
- Consumes: project scripts and existing Git release workflow.
- Produces: verified production assets and a main-branch deployment.

- [ ] Run `npm test`, `npm run check`, `npm run lint`, and `npm run build` with Node 18 or newer.
- [ ] Inspect built HTML/CSS for the viewport policy, responsive utilities, and absence of zoom locks.
- [ ] Restore timestamp-only generated-file churn if build content is otherwise unchanged.
- [ ] Record the release, review the diff, commit on `develop`, merge to `main`, and push `main`.
- [ ] Verify the production deployment and report iOS and Android WeChat acceptance as pending until tested on real devices.
