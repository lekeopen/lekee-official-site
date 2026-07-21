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
