---
name: 乐可观澜 · 项目经营决策驾驶舱
subtitle: 面向多项目访问监测、趋势判断与下一步行动建议的数据看板
status: Live
publishStatus: published
summary: 乐可观澜是乐可开源内部使用的项目经营决策驾驶舱，用于横向比较多个项目的访问表现、数据可信度和近期动态，并基于可验证的历史数据生成下一阶段行动建议。
category: Analytics Platform
tech_stack:
  - FastAPI
  - SQLite
  - APScheduler
  - Cloudflare Analytics
  - Vercel Web Analytics
  - Chart.js
image_bg: bg-slate-50
cover: /images/projects/leke-insight-overview.png
links:
  - label: 访问乐可观澜
    url: https://dash.xiaole.app/
  - label: 服务健康状态
    url: https://dash.xiaole.app/health
---

## 为什么要做这个项目

乐可开源同时维护多个长期项目，包括乐教库、乐可开源官网、GeoGenius、高源外和边大夫口腔等。项目数量增加后，只看单个站点后台很难判断整体状态：哪个项目增长最快、哪个项目数据不足、哪类内容需要继续投入，都需要一个统一视角。

乐可观澜就是为这个问题建立的项目经营决策驾驶舱。它不只展示访问数字，还把项目排名、周期变化、数据口径、近期动态和下一步行动放在同一个界面里，让数据真正进入日常运营和产品迭代。

## 项目界面

![乐可观澜全局项目态势](/images/projects/leke-insight-overview.png)

全局视图按最近 7 日 PV 对项目排序，同时显示监测项目数、增长项目数和需要关注的项目。项目卡片会标记增长、稳定、下降、无数据或数据不足，便于快速判断当前投入重点。

![乐可观澜项目洞察与行动建议](/images/projects/leke-insight-actions.png)

项目详情视图展示 30 日访问趋势、最近 7 日与前 7 日周期对比、最近动态和行动建议。每条行动都包含数据依据、具体动作、目标和复查日期，避免只停留在“看数据”的层面。

## 项目架构

乐可观澜采用轻量服务端架构，后端由 FastAPI 提供 API 和静态前端入口，SQLite 保存项目、每日指标、事件和建议记录。前端是无构建依赖的单页仪表盘，使用原生 HTML、CSS、JavaScript 与 Chart.js 渲染趋势图和状态卡片。

数据采集由 APScheduler 统一调度，按不同项目来源接入 Cloudflare Analytics、Vercel Web Analytics、项目 API 和 RSS。系统同时保留每日推送、每周报告、数据验证和旁路由监控等自动任务，用于把项目运营状态同步到日常工作流。

## 技术实现

后端提供 `/api/overview` 输出全项目排名与摘要，提供 `/api/projects/{name}/insight` 输出单项目趋势、周期对比和行动建议。写接口统一要求 Bearer Token，公开 API 只返回白名单字段，不暴露 Cloudflare Token 等敏感配置。

项目上线在 `dash.xiaole.app`，通过 Nginx、systemd、Gitea webhook 和部署脚本完成更新流程。部署脚本执行拉取代码、健康检查、重启服务和失败回滚，保证这个内部看板能长期稳定运行。

## 当前状态

当前版本已经支持多项目访问排名、30 日趋势、7 日周期对比、项目动态、行动建议、小可任务状态和业务自动化状态展示。后续会继续补充更细的内容转化指标、异常告警和运营复盘能力。
