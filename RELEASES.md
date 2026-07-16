# Release Notes

## 2026-07-16
- content: add Gaoyuanwai free-e.net project entry and related project update news

## 2026-06-27
- content: replace placeholder Lab Projects entry with the live GeoGenius AI geometry learning assistant project
- content: add GeoGenius project update news and refreshed OG cover image

## 2026-03-19
- content: add news post `2026-03-19-openclaw-adoption` about OpenClaw internal adoption on Alibaba Cloud ECS
- feat: add OpenClaw / Clawdbot private deployment service section in `Services` page
- assets: add OpenClaw mascot cover image for news and service section
- fix: resolve missing `rehype-raw` dependency for markdown rendering in detail pages
- fix: repair social share metadata extraction by escaping OG/Twitter meta attributes in prerender output
- feat: expand prerender coverage to static pages and project detail pages for crawler-friendly HTML metadata
- fix: fallback SVG cover images to PNG OG image for better WeChat/social crawler compatibility
- fix: replace placeholder SEO description in `Solutions` page to improve shared snippet quality

## 2025-12-30
- feat: add news post for Lejiaoku official launch (2025-12-30-lejiaoku-official-launch)
- feat: enhance project status visibility with "Live" radar pulse indicators
- feat: improve project card interactions with full-area click and hover effects
- feat: sync "Live" status indicators to Home page project showcase
- feat: distinguish internal and external links - internal links stay in same window, external links open in new tab
- feat: add company news link to footer quick navigation
- feat: add custom ReactMarkdown renderer to auto-handle links in NewsDetail and ProjectDetail pages
- style: optimize footer navigation order by text length
- style: move "About Us" from quick navigation to resources section
- chore: update publish queue and RSS feed

## 2025-12-22
- content: update news (2025-12-18-xiaole-stage-update)
- docs: add release workflow commands to README
- docs: add release-rules.md
- style: restore footer logo original color and optimize social icons
- refactor: update Services, Solutions, Contact pages for B2B focus

## 2025-12-21
- feat: implement post-build SSG for SEO and Facebook sharing (prerender script)
- feat: redesign home page with tech-style UI and animations
- style: darken footer background and improve CTA section contrast
- fix: ensure og:image is always an absolute url for facebook crawler
- fix: enforce trailing slash in og:url to prevent facebook circular redirect warning
- chore: remove weibo link from footer
- chore: remove automation test post
- chore: add linkedin social link back to footer
- docs: add pending tasks record for facebook setup and automation
