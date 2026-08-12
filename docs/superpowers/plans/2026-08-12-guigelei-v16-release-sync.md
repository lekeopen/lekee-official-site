# 归个类 v1.6 发行同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让归个类官网可靠地从公开发行仓库自动同步 v1.6.0 及后续正式版。

**Architecture:** 保持 `guigelei-releases` 为唯一公开发行源；页面展示只消费集中发行数据。先修复官网及测试，再发布 DMG 并触发监控。

**Tech Stack:** React, TypeScript, Node.js test runner, GitHub Actions, GitHub Releases, Cloudflare Pages.

## Global Constraints

- 不改变归个类源码仓库的私有属性。
- 不执行搜索平台真实提交。
- 任一发布门禁失败时停止。

---

### Task 1: 修复页面和可升级测试

**Files:**
- Modify: `src/pages/GuigeleiProduct.tsx`
- Modify: `tests/product-pages.test.mjs`
- Modify: `tests/product-catalog.test.mjs`

- [ ] 写入“唯一更新记录入口”和“版本数据驱动”失败测试。
- [ ] 运行产品页与目录测试，确认因当前写死行为失败。
- [ ] 移除首屏次要按钮，将版本字段改为 `product.version`。
- [ ] 运行产品测试和完整 `npm run verify`。

### Task 2: 官网 PR 与部署门禁

- [ ] 提交并推送 `codex/guigelei-v16-sync`。
- [ ] 创建 PR，等待 GitHub Actions 和 Cloudflare 预览通过。
- [ ] 合并后等待生产部署，并执行只读 SEO 检查。

### Task 3: 发布 v1.6.0 并验证自动同步

- [ ] 下载已发布的 v1.6.0 arm64 DMG，核对字节数和 SHA-256。
- [ ] 以 `guigelei-1.6.0-arm64.dmg` 上传到 `lekeopen/guigelei-releases` v1.6.0 正式 Release。
- [ ] 触发 `product-release-monitor.yml`，等待其完整校验和主线更新。
- [ ] 等待生产部署，验证线上版本、链接、统计和唯一更新记录入口。
