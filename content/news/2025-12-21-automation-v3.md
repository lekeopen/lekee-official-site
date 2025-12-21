---
title: 自动化发布系统 v3.0 验收测试
date: '2025-12-21'
category: Engineering
tags:
  - Automation
  - LinkedIn
status: published
publish: true
summary: 这是一个精简版测试，专门用于验证 LinkedIn 大图卡片配置。移除了 Description 手动填充，完全依赖 OpenGraph 抓取。
cover: /og-default.png
---

## v3.0 验收测试

本次测试重点关注 LinkedIn 的卡片渲染效果。

### 变更点

- **LinkedIn 模块配置**：移除了 `Description` 和 `Thumbnail` 的手动填充。
- **预期效果**：LinkedIn 应自动抓取网页的 `og:title`、`og:description` 和 `og:image`，展示完整的大图卡片。

### 验证清单

1.  [ ] Facebook 正常
2.  [ ] LinkedIn 有大图
3.  [ ] GitHub Profile 更新
4.  [ ] 微信公众号草稿 (可选)

Let's verify!
