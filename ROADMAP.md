# 乐可开源官网版本计划

## V1.0：生产官网

**状态：✅ 已完成（2026-07-20）**

V1.0 已完成品牌展示、服务与解决方案、项目与动态内容、联系表单、地图入口、RSS、SEO、预渲染、响应式布局和生产发布流程。客户反馈功能经产品确认从最终范围取消。

详细验收记录见 `product_requirements_document.md`。

## V1.1：工程质量

**状态：🟡 已规划，尚未开始实施**

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
