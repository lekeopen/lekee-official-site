---
name: 边大夫口腔 · 静态优先的本地 SEO 官网
subtitle: 面向口腔门诊展示、诊疗项目说明与科普内容沉淀的品牌网站
status: Live
publishStatus: published
summary: 边大夫口腔官网是一个面向本地口腔门诊的静态优先宣传与 SEO 网站，用于展示诊所信息、诊疗项目、口腔知识和门诊动态，让用户在访问前获得更清晰、可信的服务说明。
category: Healthcare Website
tech_stack:
  - Next.js
  - React
  - TypeScript
  - MDX
  - Cloudflare Workers
  - Wrangler
image_bg: bg-teal-50
cover: /images/projects/boral-wang-og.png
links:
  - label: 访问边大夫口腔
    url: https://boral.wang/
---

## 为什么要做这个项目

边大夫口腔官网服务于真实线下门诊，核心目标不是做复杂系统，而是把诊所介绍、诊疗项目、口腔科普和门诊动态以更稳定、清晰、便于搜索的方式呈现出来。

对本地医疗服务来说，官网需要同时满足用户了解信息和搜索引擎识别内容两类需求。项目因此采用克制的展示方式，重点放在服务说明、真实信息、内容可维护和本地 SEO 上，避免依赖后台系统带来的维护成本。

## 项目架构

项目采用静态优先架构，第一版不使用 CMS、数据库或登录系统。诊疗项目由类型化数据维护，文章和动态通过 MDX 文件管理，内容、图片、路由和旧地址映射都保存在代码仓库中。

生产环境部署在 Cloudflare Workers，主域名为 boral.wang，www 域名通过 301 跳转到主域名。GitHub Actions 负责质量门禁和线上只读巡检，正式部署由维护者在完整验证通过后执行。

## 技术实现

网站基于 Next.js、React 和 TypeScript 构建，使用 MDX 管理口腔知识文章与诊所动态。诊疗项目集中在类型化数据文件中，便于保持字段完整、链接稳定和页面内链一致。

项目发布前通过统一验证命令完成构建、测试、生产路由请求检查和 ESLint。Cloudflare 部署使用 Wrangler 与项目脚本封装，避免把生产凭证写入仓库，也减少本地网络环境差异对发布流程的影响。
