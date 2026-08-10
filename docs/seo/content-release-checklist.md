# 内容发布检查清单

发布负责人必须按以下阶段完成新闻或项目内容；在阶段 2 的人工审核通过前，不得将内容设为 `published`。

## 阶段 1：保持 draft，完成内容与 SEO 检查

- 保持新闻的 `status` 或项目的 `publishStatus` 为 `draft`。
- 准备准确的标题、摘要、封面和发布日期；不得夸大能力、效果或数据。
- 为每张页面图片提供准确、简洁的替代文本。
- 在 `config/seo-keywords.json` 为 canonical 路径登记清晰的 primary intent 和相关 supporting terms；不得编造搜索量或堆砌关键词。
- 确认 canonical 路径与路由一致，并添加与正文语境相关的内部链接；不为链接而链接。
- 确认 `npm run validate:content`、`npm run check:seo-keywords` 和构建能够包含该页面。

## 阶段 2：人工审核并记录通过

- 由负责人完成人工内容与 SEO 审核，并记录审核通过结论。

## 阶段 3：变更为 published 并确认发布日期

- 仅在阶段 2 通过后，将新闻的 `status` 或项目的 `publishStatus` 改为 `published`。
- 确认页面的发布日期正确。

## 阶段 4：构建、部署与生产检查

- 完成构建和部署后，在生产环境检查 canonical、标题、摘要、封面、替代文本及内部链接是否正确呈现。

## 阶段 5：独立确认 URL notification

- 由负责人独立确认是否需要为已发布 URL 发送通知，再决定是否执行相应操作。
- 不得由本清单自动发送通知或执行任何平台操作。
