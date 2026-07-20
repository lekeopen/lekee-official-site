# Default Logo OG Image Design

## Goal

Replace the current keyboard-photo default share image with a deterministic 600×600 WeChat-first brand card built from the existing transparent `public/logo.png` asset.

## Design

- Preserve the source logo pixels and aspect ratio.
- Center the logo inside the social-card safe area on a dark brand background.
- Generate and commit a square `public/og-default.png`; regenerate it at build time from a small Sharp script.
- Use `/og-default.png` as the only fallback image in both `SEOMeta` and the prerender pipeline.
- Keep explicit news and project cover images unchanged.
- Declare the fallback image as 600×600. Resolve real dimensions for local content covers and omit dimensions for remote covers that cannot be verified at build time.

## Acceptance

- The generated PNG is exactly 600×600.
- Homepage and static routes use `https://lekeopen.com/og-default.png`.
- No fallback reference to `og-450x300.png` remains in active metadata code.
- Tests, TypeScript, ESLint, and the production build pass.
