# 内容发布检查清单

在把新闻或项目内容设为 `published` 前，发布负责人应逐项确认：

- 标题与摘要准确说明内容，不夸大能力、效果或数据。
- 已提供适合页面主题的封面图；页面中的图片均有准确、简洁的替代文本。
- 日期正确，发布状态为 `published`，且内容经过人工审核。
- 已在 `config/seo-keywords.json` 为其 canonical 路径登记清晰的 primary intent 和相关 supporting terms；不得编造搜索量或堆砌关键词。
- canonical 路径与路由一致，且已添加与正文语境相关的内部链接；不为链接而链接。
- `npm run validate:content`、`npm run check:seo-keywords` 和构建均会包含该页面。
- 部署后在生产环境检查 canonical、标题、摘要、封面及内部链接是否正确呈现。
- 仅在内容适合对外通知、且人工确认发布后，才将其列入通知或分发流程。

发布、外部通知和任何平台操作都保留人工审核与确认，不由此清单自动触发。
