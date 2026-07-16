---
name: 高源外 · 个人技术博客
subtitle: 技术、教育、AI 与知识管理的个人品牌内容平台
status: Live
publishStatus: published
summary: 高源外是高鹏的个人品牌官网，围绕技术实践、教育信息化、AI、知识管理和产品设计持续发布视频与图文内容，让可复用的经验沉淀为长期可检索的资料。
category: Content Platform
tech_stack:
  - Astro
  - TypeScript
  - MDX
  - Content Collections
  - Pagefind
  - Cloudflare Pages
image_bg: bg-stone-50
cover: /images/projects/gaoyuanwai-brand-kit.png
links:
  - label: 访问高源外
    url: https://free-e.net/
  - label: 文章
    url: https://free-e.net/articles/
  - label: 视频
    url: https://free-e.net/videos/
---

## 为什么要做这个项目

高源外是高鹏的个人品牌，品牌题记是“代码之外，仍有山海。”它不是乐教库、乐知或小乐 AI 的产品官网，而是作者本人长期实践的内容出口。

博客用于记录技术、教育、AI、知识管理和产品构建。视频负责表达、演示和传播，图文负责保留可检索、可复制、可修订的技术细节与实践结论。

## 项目架构

高源外坚持纯静态架构，不使用数据库、CMS、登录系统或服务端运行时。代码、内容元数据、图片和旧地址映射都保存在 Git 中，通过 GitHub Actions 自动验证与发布到 Cloudflare Pages。

站点内容分为三个长期专题：AI 实用教程、信息化教学和系统实践。旧 WordPress 内容会按价值和时效性逐篇迁移，核验后再公开发布。

## 技术实现

项目使用 Astro 静态输出与 TypeScript，正文使用 MDX 和 Content Collections 管理。搜索由 Pagefind 提供，站点同时生成 RSS、sitemap、robots.txt、canonical 和结构化数据。

正式域名为 <https://free-e.net/>，同时支持 <https://www.free-e.net/>。当前版本已具备静态站点、搜索、专题、标签、RSS 和自动部署能力。
