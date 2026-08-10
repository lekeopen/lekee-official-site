# 公众号发布清单

## 基本信息

标题：从官网 Markdown 到公众号草稿，我们为什么要做自己的运营工具

副标题：一套小团队能跑通的内容生产与审核流程

作者：乐可开源

封面图：`/images/projects/leke-insight-overview.png`

原文入口：运行 `npm run wechat:article:preview -- tools/wechat-admin/articles/2026-08-10-operations-toolchain.md` 后，使用命令输出的本地预览地址。

关键词引导：回复【合作】

复制入口：打开预览页后点击「一键复制富文本」

## 可复制内容

Markdown 原文：

```text
tools/wechat-admin/articles/2026-08-10-operations-toolchain.md
```

渲染 HTML：

```text
.wechat-admin-output/articles/2026-08-10-operations-toolchain.html
```

纯文本：

```text
.wechat-admin-output/articles/2026-08-10-operations-toolchain.txt
```

## 发布前确认

1. 标题保持当前版本，不再改成偏广告式表达。
2. 副标题保留，作为摘要或导语。
3. 封面图使用项目经营决策驾驶舱那张图。
4. 正文里 3 张配图都保留。
5. 文末保留“回复【合作】”的引导。
6. 先在本地预览里确认一遍，再去公众号后台粘贴。
7. 如果要直接粘贴，先点预览页顶部的「一键复制富文本」。

## 后台操作

1. 打开公众号后台，进入「内容管理 > 草稿箱」。
2. 新建图文消息。
3. 填入标题、作者、摘要。
4. 上传封面图。
5. 把正文按本地预览效果复制进编辑器。
6. 检查图片是否全部正常显示。
7. 确认文末的合作引导仍然保留。
8. 发送预览到管理员微信。
9. 手机端再确认一遍排版后再发表。

## 摘要建议

这篇文章讲的是我们为什么给公众号内容生产做自己的运营工具：把周检、月排期、草稿生成、Bark 提醒和人工审核接成一条稳定流水线，减少重复劳动，也让内容更容易长期维护。
