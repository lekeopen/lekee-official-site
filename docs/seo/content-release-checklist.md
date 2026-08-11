# 内容发布检查清单

发布负责人必须按以下阶段完成新闻或项目内容；draft 不进入公开 route inventory、关键词覆盖检查、sitemap、RSS 或 URL notification。人工审核通过后先在本地设为 `published`，完成全部工程检查并取得部署授权，才会发布到生产。

## 阶段 1：保持 draft，完成内容准备

- 保持新闻的 `status` 或项目的 `publishStatus` 为 `draft`。
- 准备准确的标题、摘要、封面和发布日期；不得夸大能力、效果或数据。
- 为每张页面图片提供准确、简洁的替代文本。
- 预审 canonical、搜索意图和正文语境中的内部链接；不得编造搜索量、堆砌关键词或为链接而链接。
- draft 不得提前加入要求公开 route coverage 的 `config/seo-keywords.json`。

## 阶段 2：人工审核并记录通过

- 由负责人完成人工内容与 SEO 审核，并记录审核通过结论。

## 阶段 3：仅在本地变更为 published

- 仅在阶段 2 通过后，将新闻的 `status` 或项目的 `publishStatus` 改为 `published`。
- 确认页面发布日期正确；此时仍未授权部署或发送平台通知。

## 阶段 4：补齐 SEO 映射并运行完整门禁

- 将新 canonical 路径加入 `config/seo-keywords.json`，登记清晰的 primary intent、supporting terms 和有意义的 related paths。
- 确认 canonical 路径与路由一致，并完成正文所需的双向或上下文内部链接。
- 依次运行 `npm run validate:content`、`npm run check:seo-keywords` 和完整的 `npm run verify`；确认页面进入静态构建、sitemap、RSS 与发布队列的适用输出。
- 在取得明确部署授权前停止。

## 阶段 5：部署后完成生产发布门禁

- 部署后运行只读 `npm run seo:inspect`，并在生产环境检查 canonical、标题、摘要、封面、替代文本及内部链接是否正确呈现。
- 生产巡检是部署后的 release gate，不属于确定性 CI，也不应在部署前被当作工程门禁的替代品。

## 阶段 6：独立确认 URL notification

- 由负责人独立确认是否需要为已发布 URL 发送通知，再决定是否执行相应操作。
- 不得由本清单自动发送通知或执行任何平台操作。
