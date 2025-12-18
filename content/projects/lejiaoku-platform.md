---
name: 乐教库 · 知识管理平台
subtitle: 教育场景下的数字化资源管理
status: Alpha
publishStatus: published
summary: 围绕教育与知识管理场景构建的数字化平台，探索 AI 在教学辅助、资源整理与内容管理中的实际应用。
category: Education Platform
tech_stack:
  - 内容管理系统 (CMS)
  - 全文检索
  - 知识结构化
image_bg: bg-green-50
cover: /images/projects/lejiaoku-platform.png
links:
  - label: Frontend (Repo)
    url: https://github.com/rockts/lejiaoku-vue
  - label: Backend (Repo)
    url: https://github.com/rockts/lejiaoku-node
---

## 为什么要做这个项目

### 背景问题
传统的教育资源管理往往依赖人工整理，效率低下且检索困难。优质的教学内容难以被有效复用，知识沉淀主要靠文档堆砌，缺乏结构化。

### 技术动机
试图解决非结构化数据（课件、教案、音视频）的解析与标签化问题。利用 NLP 技术自动提取关键信息，构建知识图谱，实现资源的智能推荐与关联。

## 我们解决了什么

### 技术层面
后端采用 Python/Django 框架，利用其丰富的数据处理生态。集成 OCR 与 ASR 服务，实现多媒体内容的文本化。

### 工程层面
构建了高可用的文件存储服务，支持大文件断点续传与 CDN 加速。实现了基于 RBAC 的精细化权限控制系统，保障数据安全。

## 当前阶段说明

目前处于 Alpha 阶段。前端代码已开源，正在进行核心功能迭代与搜索体验优化。
