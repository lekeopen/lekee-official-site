# 乐可开源官网版本计划

## V1.0：生产官网

**状态：✅ 已完成（2026-07-20）**

V1.0 已完成品牌展示、服务与解决方案、项目与动态内容、联系表单、地图入口、RSS、SEO、预渲染、响应式布局和生产发布流程。客户反馈功能经产品确认从最终范围取消。

详细验收记录见 `product_requirements_document.md`。

## V1.1：工程质量

**状态：✅ 已完成（2026-07-21）**

### 目标

在不增加业务功能和运行时复杂度的前提下，让每次内容或代码发布都能通过一致、可重复的质量门禁。

### 计划范围

- 增加统一的 `npm run verify`；
- 校验新闻和项目 Markdown 的必填 frontmatter、状态值和日期；
- 增加 GitHub Actions，覆盖 PR 及 `develop`、`main` 推送；
- 保持 TypeScript、ESLint、测试和生产构建全部通过；
- 将架构、部署、环境变量和回滚文档纳入发布检查；
- 记录并评估当前约 1 MB 主 JavaScript 包，但不在缺少性能数据时贸然拆包。

### 明确不做

- 不增加 CMS、数据库或自建 API；
- 不增加新的业务页面；
- 不实施 AI 客服或 Playground；
- 不引入 Playwright、Lighthouse CI 或依赖自动升级服务，除非后续数据证明必要。

### 完成标准

- `npm run verify` 一条命令完成测试、类型检查、Lint 和构建；
- 无效内容在进入生产构建前失败，并输出具体文件和字段；
- GitHub Actions 与本地验证命令一致；
- `develop` 和 `main` 均受相同质量门禁约束；
- README、架构文档和部署文档与实际流程一致。

实施步骤见 `docs/superpowers/plans/2026-07-20-site-v1.1-engineering-quality.md`。

## V1.2：性能与可观测性

**状态：✅ 已完成（2026-07-21）**

### 目标

在不改变现有设计、业务功能、SEO、预渲染和可访问性的前提下，降低首屏 JavaScript 与移动端运行成本，并建立可重复的性能回归保护。

### 计划范围

- 建立 V1.1 入口包和移动端性能基线；
- 页面模块改为路由级懒加载；
- 入口 JavaScript 至少降低 30%；
- 优化移动端粒子动画的生命周期与低性能设备成本；
- 为非首屏卡片图片增加延迟加载和异步解码提示；
- 将确定性的入口包预算纳入 `npm run verify`；
- 记录移动端 Lighthouse LCP 与 CLS 验收证据。

### 完成标准

- 入口 JavaScript 不超过 699,993 字节；
- 移动端实验室 LCP 不超过 2.5 秒，CLS 不超过 0.1；
- 全部路由、SEO 元数据预渲染、RSS、地图与联系功能保持正常；
- `develop`、`main` 质量门禁和生产验证全部通过。

详细设计与实施步骤见：

- `docs/superpowers/specs/2026-07-21-site-v1.2-performance-design.md`
- `docs/superpowers/plans/2026-07-21-site-v1.2-performance.md`

## V1.3：完整技术 SEO

**状态：✅ 已完成（2026-07-21）**

### 目标

以中国搜索引擎抓取能力为优先，同时满足 Google 与 Bing 的通用技术 SEO 标准，让所有公开页面无需执行 JavaScript 即可读取完整正文。

### 已完成范围

- 保留 React + Vite 架构，增加仅在构建期运行的完整页面静态渲染；
- 26 个公开页面均输出正文、唯一 `h1`、独立标题、描述和 canonical；
- 文档语言统一为 `zh-CN`；
- 输出 Organization、WebSite、WebPage、Article、CreativeWork 和 BreadcrumbList 结构化数据；
- 自动生成只包含已发布内容的 `sitemap.xml`；
- 自动生成带 sitemap 声明的 `robots.txt`；
- 生成带 `noindex, nofollow` 的静态 `404.html`；
- 将完整正文、canonical、JSON-LD、sitemap、robots 和 404 校验纳入 `npm run verify`。

详细设计与实施步骤见：

- `docs/superpowers/specs/2026-07-21-site-v1.3-technical-seo-design.md`
- `docs/superpowers/plans/2026-07-21-site-v1.3-technical-seo.md`
