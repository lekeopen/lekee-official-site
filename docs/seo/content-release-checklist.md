# 内容发布检查清单

发布负责人应按以下顺序确认新闻或项目内容：

- 标题与摘要准确说明内容，不夸大能力、效果或数据。
- 已提供适合页面主题的封面图；页面中的图片均有准确、简洁的替代文本。
- 保持 `status` 或 `publishStatus` 为 `draft`，完成下列内容与 SEO 检查。
- 内容须先通过人工审核；审核通过后，才可将发布状态改为 `published`，并确认日期正确。
- 已在 `config/seo-keywords.json` 为其 canonical 路径登记清晰的 primary intent 和相关 supporting terms；不得编造搜索量或堆砌关键词。
- canonical 路径与路由一致，且已添加与正文语境相关的内部链接；不为链接而链接。
- `npm run validate:content`、`npm run check:seo-keywords` 和构建均会包含该页面。
- 部署后在生产环境检查 canonical、标题、摘要、封面及内部链接是否正确呈现。
- 仅在内容适合对外通知、且人工确认发布后，才将其列入通知或分发流程。

发布状态变更与外部通知是独立的人工确认：即使内容已设为 `published`，仍不得由此清单自动发送通知或执行任何平台操作。
