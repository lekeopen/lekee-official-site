# 产品支持渠道运维手册

## 发布前配置

1. 创建或确认 `support@lekeopen.com` 能收信，并完成站外发信测试。
2. 在 Cloudflare Turnstile 创建仅允许 `lekeopen.com` 和预览域名的站点，公开站点键配置为 `VITE_TURNSTILE_SITE_KEY`，Secret 配置为 `TURNSTILE_SECRET_KEY`。
3. 创建 KV namespace，在 Preview 和 Production 中绑定为 `SUPPORT_RATE_LIMIT`。
4. 在 Resend 免费方案中验证 `lekeopen.com` 发信域名，仅创建本项目使用的 API Key，并作为 Pages Secret `RESEND_API_KEY` 保存；配置 `SUPPORT_MAIL_FROM` 和 `SUPPORT_MAIL_TO`。Cloudflare Workers 保持免费套餐，不启用 Email Sending Beta。
5. 将 `ALLOWED_SUPPORT_ORIGINS` 配置为逗号分隔的精确 Origin，不使用通配符。

## 预览验收

- 从两个产品页分别进入 Support 页面，确认产品预选正确。
- 提交一次不含真实用户数据的测试反馈，确认邮箱收到邮件且页面编号与邮件编号一致。
- 模拟邮件服务失败，确认页面不显示成功并提供 `support@lekeopen.com`。
- 检查日志只出现反馈编号和错误类别，不出现联系方式、正文、验证码 token 或 Secret。
- 运行 `npm run verify`，并检查 Cloudflare Preview。

## 密钥轮换

Turnstile Secret 与 Resend API Key 均按 Preview 先行顺序轮换：先更新 Preview 并验证，再更新 Production。密钥只保存在 Cloudflare Pages Secret 中，不写入仓库、构建产物或日志。

## 故障降级与回滚

若邮件或 Turnstile 长时间不可用，停止推广表单入口并在 Support 页面保留 FAQ 与 `support@lekeopen.com`，不得让 API 返回虚假成功。代码回滚使用上一生产提交重新部署；不要删除用户邮箱中的已受理记录。恢复后先在 Preview 验证，再恢复生产入口。

## 数据与隐私

官网不建立反馈数据库，不上传附件。邮件只按处理反馈和必要记录所需期限保留。任何公开 Issue 均由维护人员人工去除个人信息后创建，禁止自动同步用户原文。
