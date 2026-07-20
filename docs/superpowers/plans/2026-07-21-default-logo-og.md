# WeChat-First Default Logo OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and use a consistent 600×600 logo-based default share image for WeChat link cards.

**Architecture:** A deterministic Sharp script composites the existing transparent logo over a branded background. Source and prerender metadata share one fallback path, while a Node regression test validates the asset and build policy.

**Tech Stack:** Node.js, Sharp, React Helmet, Cheerio, Vite.

## Global Constraints

- Preserve `public/logo.png` without generative modification.
- Keep explicit news and project cover images unchanged.
- Do not commit or deploy without explicit authorization.

---

### Task 1: Add failing OG policy regression

**Files:**
- Create: `tests/og-default-image.test.mjs`

- [ ] Check that `public/og-default.png` is 600×600.
- [ ] Check that client and prerender fallbacks use `/og-default.png`.
- [ ] Check that the production build runs the deterministic OG generator.
- [ ] Run the focused test and confirm it fails for the current 1840×600 asset and old fallback references.

### Task 2: Generate and integrate the brand card

**Files:**
- Create: `scripts/generate-default-og.mjs`
- Modify: `package.json`
- Modify: `src/components/common/SEOMeta.tsx`
- Modify: `scripts/prerender.ts`
- Regenerate: `public/og-default.png`

- [ ] Composite `public/logo.png` at its original aspect ratio onto a 600×600 dark brand background.
- [ ] Add `build:og` and run it before the existing production build stages.
- [ ] Replace active fallback references to `og-450x300.png`.
- [ ] Run the focused test and confirm it passes.

### Task 3: Verify production artifacts

**Files:**
- Generated: `dist/**`

- [ ] Run all tests, TypeScript, ESLint, and the complete production build.
- [ ] Inspect the generated PNG visually.
- [ ] Confirm prerendered static routes declare `/og-default.png` with 600×600 dimensions and local content covers use their real dimensions.
- [ ] Restore timestamp-only RSS and publish-queue churn.
