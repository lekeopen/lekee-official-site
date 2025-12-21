---
title: 🧪 自动化测试 v8.0：动态封面图验证
date: '2025-12-21'
category: Engineering
tags:
  - Automation
  - Image Test
status: published
publish: true
summary: 本次测试旨在验证 Make.com 是否能正确从 RSS 读取 `<enclosure>` 标签，并动态下载文章指定的封面图（而不是使用默认图）。
cover: /images/news/monster.png
---

## 动态封面测试

这是一张可爱的怪兽图片。

### 验证逻辑

1.  **RSS 生成**：检查 `rss.xml` 中是否有 `<enclosure url=".../images/monster.png" ... />`。
2.  **Make.com**：
    *   HTTP 模块应下载这张怪兽图。
    *   Email/LinkedIn 应展示这张怪兽图。

### 预期结果

如果收到的邮件里是这只小怪兽，而不是黑色的 "LekeOpen" Logo，则测试通过。

Happy Coding! 👾
