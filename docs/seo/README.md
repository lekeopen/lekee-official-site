# SEO 运营资料

## 月度健康报告

以 [monthly-report-template.json](./monthly-report-template.json) 为起点，复制为本地的已脱敏输入文件，再生成报告：

```bash
npm run seo:report -- --input /absolute/path/sanitized-monthly-seo.json --output /absolute/path/monthly-seo-report.md
```

报告输入只能包含汇总数据。不要把百度、IndexNow 或其他平台的原始导出文件、Cookie、请求头、token、API key、密码或平台访问凭据放入仓库或报告输入。命令会拒绝凭据形态的字段名，以及与当前环境中凭据变量值匹配的内容。

输出文件默认不覆盖；在确认目标文件可替换后，显式添加 `--force`。

“已接受提交”仅表示平台接受了提交并进入处理流程，不等于页面已被收录或建立索引。没有可验证指标时保留 `null`，报告会显示为“未提供”，不要填 `0`。
