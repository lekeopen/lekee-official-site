# 官网 App 国内安全下载设计

## 目标

为乐可点名和归个类提供统一的国内分发链路：GitHub Release 保持权威发布源和海外备用源；阿里云 OSS 保持私有，仅作为 CDN 源站；官网通过受控接口签发短时 CDN URL。不得在公开页面、构建产物或普通接口响应中长期暴露 OSS 原始域名。

## 架构

`lekeopen.com/api/download` 仅接受代码内登记的产品与资产 ID。请求通过基础限流后，Pages Function 使用服务器端 CDN 鉴权密钥生成 120 秒有效的 `downloads.lekeopen.com` URL，并返回 302。阿里云 CDN 验证 URL、按不含鉴权参数的版本化路径缓存，并使用同账号 STS 权限回源私有 `lekeopen-downloads` Bucket。

GitHub Release URL 保留为独立的备用下载入口。国内下载不可用时不得恢复 OSS 公共读，而是关闭国内入口并保留 GitHub。

## 安全边界

- 产品、版本、对象路径和文件名全部来自 `src/products/releases.json`，用户不能提供任意路径。
- CDN 签名密钥只存在于 Cloudflare Secret `ALIYUN_CDN_AUTH_KEY`，不得进入源码、日志或浏览器。
- CDN 主机由环境变量 `DOWNLOAD_CDN_HOST` 固定，生产值为 `downloads.lekeopen.com`。
- 签名 TTL 固定为 120 秒；接口响应使用 `Cache-Control: private, no-store`。
- 使用独立 KV `DOWNLOAD_RATE_LIMIT`；同 IP、同资产 10 分钟最多 5 次，同 IP、同产品 24 小时最多 20 次。
- 记录产品、资产、结果、国家、UA 类别、Ray ID 和带密钥 HMAC 的 IP 摘要；不记录原始 IP、签名 URL 或密钥。
- 明确异常或自动化 UA 使用更严格限额；正常浏览器不依赖 Referer 才能下载。

## 镜像任务

镜像计划只包含对象键和发布证据，不再生成公开 URL。已存在对象只用 HEAD 校验长度和 `x-oss-meta-sha256`，禁止定时整文件 GET。只有新对象首次上传时，才从 GitHub 下载、校验 SHA-256、上传 OSS，并执行一次回读复核。

## 可用性与回滚

通过 `DOMESTIC_DOWNLOADS_ENABLED` 控制国内入口。关闭时接口返回 503，页面保留 GitHub 备用下载。CDN/DNS 故障、流量异常或密钥泄漏时关闭国内入口并轮换密钥；不得恢复 OSS 公共读，也不得回滚“已存在对象禁止 GET”的修复。

## 验收

- 公开源码和构建产物不包含 OSS 公网域名。
- 国内入口只能跳转到 `downloads.lekeopen.com`，签名有效期不超过 120 秒。
- 任意产品、资产和路径输入均失败关闭。
- 限流返回 429，配置缺失返回 503，GitHub 备用入口保持不变。
- 镜像任务对已存在对象零 GET；新上传对象只允许一次回读。
- 完整 `npm run verify` 通过。
