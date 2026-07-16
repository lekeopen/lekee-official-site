---
title: 高源外个人技术博客正式上线
date: '2026-07-16 23:55:00'
category: Project
summary: 高源外 free-e.net 已作为个人品牌内容平台收录到乐可开源项目列表，用于持续沉淀技术、教育、AI、知识管理和产品设计相关实践。
tags:
  - 高源外
  - free-e.net
  - 内容平台
  - 知识管理
  - 系统实践
status: published
publish: true
cover: /images/projects/gaoyuanwai-brand-kit.png
---

## 项目背景

高源外是高鹏的个人品牌，品牌题记是“代码之外，仍有山海。”它不代表某一个具体产品，而是用来长期记录技术、教育、AI、知识管理和产品构建的个人内容平台。

视频负责表达、演示和传播，图文负责保留可检索、可复制、可修订的技术细节与实践结论。乐教库、乐知、小乐 AI 等项目可以成为内容来源，但高源外始终代表作者本人及其长期实践。

官网地址：<https://free-e.net/>

## 项目架构

高源外采用纯静态架构，不使用数据库、CMS、登录系统或服务端运行时。代码、内容元数据、图片和旧地址映射全部保存在 Git 中，推送到主分支后由 GitHub Actions 自动验证并部署到 Cloudflare Pages。

内容上，站点当前围绕三个长期专题组织：AI 实用教程、信息化教学和系统实践。视频内容保留封面、简介和分享入口，文章使用 MDX 保存完整正文、代码、图片、更新时间和 SEO 信息。

## 使用技术

项目主要使用 Astro、TypeScript、MDX、Content Collections、Pagefind 和 Cloudflare Pages。站点同时生成 RSS、sitemap、robots.txt、canonical 和结构化数据，并保留旧 WordPress 内容的迁移和 301 映射能力。

当前版本已经支持静态站点、搜索、专题、标签、RSS 和自动部署。后续会继续迁移旧站内容，并围绕真实项目建设补充视频和文章。

## 当前状态

free-e.net 与 www.free-e.net 已接入 Cloudflare Pages 并启用 HTTPS。旧 WordPress 内容正在按价值、时效性和可恢复程度逐篇迁移。

欢迎访问 [高源外 free-e.net](https://free-e.net/) 查看最新内容。
