# 乐可开源官网

> 专注 AI 与工程实践的技术团队

这是乐可开源（lekeopen）的官方网站，基于内容驱动架构构建，用于展示技术实践、开源项目和工程动态。

*法律主体：天水乐可信息技术有限公司*

## 📋 项目概览

本项目是面向技术社区与开源实践的官方网站，采用 React + TypeScript + Vite 技术栈，支持 Markdown 驱动的内容管理，包含以下核心功能：

- 🏠 **首页展示** - 技术能力、开源项目、工程动态
- 💼 **服务介绍** - AI 应用开发、定制软件开发、技术咨询
- 🚀 **产品展示** - 项目详情页面，支持 Markdown 内容渲染
- 📰 **技术动态** - 项目进展与技术分享
- 📧 **联系表单** - 集成 EmailJS 的在线联系功能
- 📡 **RSS 订阅** - 自动生成 RSS feed

## 🛠️ 技术栈

### 核心框架
- **React 18.3** - UI 框架
- **TypeScript 5.8** - 类型安全
- **Vite 6.3** - 构建工具与开发服务器

### 路由与状态
- **React Router 7.10** - 客户端路由
- **Zustand 5.0** - 轻量级状态管理

### UI 与样式
- **Tailwind CSS 3.4** - 原子化 CSS 框架
- **@tailwindcss/typography** - Markdown 排版支持
- **Lucide React** - 图标库
- **clsx / tailwind-merge** - 样式工具

### 内容管理
- **Front Matter** - Markdown 元数据解析
- **React Markdown** - Markdown 渲染
- **RSS 生成** - 自动构建 RSS feed

### 其他工具
- **EmailJS** - 邮件服务集成
- **React Helmet Async** - SEO 优化
- **ESLint** - 代码规范
- **TypeScript ESLint** - TypeScript 代码检查

## 📁 项目结构

```
lekee-official-site/
├── content/                    # Markdown 内容文件
│   ├── news/                  # 新闻动态
│   └── projects/              # 项目展示
├── public/                    # 静态资源
│   └── rss.xml               # RSS feed
├── scripts/                   # 构建脚本
│   └── generate-rss.ts       # RSS 生成脚本
├── src/
│   ├── components/           # React 组件
│   │   ├── common/          # 通用组件（Logo 等）
│   │   └── layout/          # 布局组件（Header, Footer）
│   ├── hooks/               # 自定义 Hooks（主题等）
│   ├── layouts/             # 页面布局
│   ├── lib/                 # 核心库
│   │   ├── content.ts       # 内容管理（Markdown 解析）
│   │   └── utils.ts         # 工具函数
│   ├── pages/               # 页面组件
│   ├── utils/               # 辅助工具
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # 渲染入口
├── .env.example             # 环境变量示例
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，并填写 EmailJS 相关配置：

```bash
cp .env.example .env
```

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看开发环境。

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录，同时会自动生成 RSS feed。

### 预览生产构建

```bash
npm run preview
```

### 其他命令

```bash
# 类型检查
npm run check

# 代码检查
npm run lint

# 单独生成 RSS
npm run generate-rss
```

## 📝 内容管理指南

### 1. 新闻动态 (News)

在 `content/news/` 目录下创建 `.md` 文件。文件名建议使用 `YYYY-MM-DD-slug.md` 格式。

**Front Matter 模板：**

```markdown
---
title: "文章标题"
date: "2025-12-21 22:30"        # 支持 "YYYY-MM-DD" 或 "YYYY-MM-DD HH:mm"
category: "Engineering"         # 推荐分类：Engineering, Product, Company, Site Update
summary: "文章摘要（用于列表页和 RSS 描述）"
cover: "/images/news/cover.png" # 封面图路径（建议放在 public/images/news/ 下）
tags:                           # 标签列表
  - Tag1
  - Tag2
status: "published"             # 文章状态：published, draft
publish: true                   # 是否发布到 RSS (true/false)
---

这里是正文内容，支持完整的 Markdown 语法...
```

### 2. 项目展示 (Projects)

在 `content/projects/` 目录下创建 `.md` 文件。

**Front Matter 模板：**

```markdown
---
name: "项目名称"
subtitle: "一句话副标题"
status: "Live"                  # 项目状态：Live, Beta, In Development
publishStatus: "published"      # 发布状态：published, draft
summary: "项目简要介绍"
category: "AI Product"          # 分类：AI Product, Open Source, Solution
tech_stack:                     # 技术栈列表
  - React
  - TypeScript
  - Python
image_bg: "bg-blue-50"          # 封面背景色（Tailwind 类名，如 bg-blue-50, bg-gray-100）
cover: "/images/projects/cover.png" # 项目封面图
links:                          # 相关链接列表
  - label: "GitHub"
    url: "https://github.com/..."
  - label: "Demo"
    url: "https://..."
---

这里是项目详细介绍，支持完整的 Markdown 语法...
```

## 🎨 特性说明

### 内容驱动架构

- 所有新闻和项目内容使用 Markdown 管理
- 支持 Front Matter 元数据
- 自动解析和渲染内容
- 基于文件系统的路由映射

### RSS 自动生成

构建时自动扫描 `content/news/` 目录，生成 RSS feed 到 `public/rss.xml`。

### 响应式设计

完全响应式布局，支持桌面端、平板和移动设备。

### SEO 优化

通过 React Helmet Async 实现动态 SEO 优化。

## 📦 部署

构建完成后，将 `dist/` 目录部署到任何静态托管服务：

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- 自建服务器（Nginx/Apache）

## 📄 许可证

Copyright © 2025 天水乐可信息技术有限公司

## 🔗 相关链接

- [GitHub Organization](https://github.com/lekeopen)
- [官方网站](https://lekeopen.com)

---

**Made with ❤️ by 乐可开源团队**
