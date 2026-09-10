# App 国内安全下载运维手册

## 服务边界

- GitHub Release 是两款 App 的权威发布源和备用下载源。
- `lekeopen-downloads` 必须保持私有，不能因故障临时恢复公共读。
- `downloads.lekeopen.com` 是唯一面向用户的国内文件域名。
- `lekeopen.com/api/download` 只签发短时 CDN 地址，不代理安装包字节。
- 国内 CDN 配置未启用或临时不可用时，下载接口回退到当前清单锁定的 GitHub Release 资产；限流命中仍返回 429。
- 版本化对象不可覆盖；新版本必须使用新的版本目录。

## 阿里云 CDN 配置门槛

在启用官网国内入口前，逐项完成人工配置并留存控制台截图：

1. 在阿里云 CDN 添加 `downloads.lekeopen.com`，源站选择北京区域的 `lekeopen-downloads` OSS Bucket。
2. 完成账号级 CDN 访问 OSS 授权，并开启“同账号 OSS 私有 Bucket 回源”。优先使用阿里云托管的 STS 角色，不创建长期回源 AccessKey。
3. 回源协议使用 HTTPS，核对回源 HOST 和 SNI 指向正确的 OSS 源站。
4. 开启 URL 鉴权方式 C，生成 16 至 32 位随机主 KEY 和备用 KEY；有效期设为 120 秒。
5. 确认鉴权成功后 CDN 会去除 `KEY1`、`KEY2` 再生成缓存键和回源请求，避免每个签名 URL 都回源。
6. 为版本化路径设置长期缓存；禁止忽略路径，只忽略 CDN 鉴权参数。
7. 开启 HTTPS 证书、访问日志、实时监控、流量封顶告警和异常带宽告警。
8. CDN 侧配置 URL 鉴权为主，Referer 与 User-Agent 规则只作为辅助，避免误伤普通浏览器和学校出口网络。

## DNS

在 CDN 返回 CNAME 且域名状态正常后，为 `downloads.lekeopen.com` 添加该 CNAME。切换前确认域名备案接入要求、证书状态和源站权限。不得把 DNS 直接指向 OSS Bucket 域名。

## HTTPS 证书自动续期

`.github/workflows/acme-cdn-renewal.yml` 每月运行一次，也支持人工触发。它使用固定版本的 `acme.sh`，通过 Cloudflare DNS-01 为 `downloads.lekeopen.com` 申请免费的 Let's Encrypt ECDSA 证书，再使用阿里云 CDN API 将证书只部署到该下载域名。每次运行使用临时目录，不上传或缓存账户密钥、证书私钥和证书文件。

GitHub Actions 必须配置以下加密 Secret：

- `CLOUDFLARE_DNS_API_TOKEN`：仅允许编辑 `lekeopen.com` 的 DNS。
- `ALIYUN_CDN_ACCESS_KEY_ID`：专用 RAM 用户的 AccessKey ID。
- `ALIYUN_CDN_ACCESS_KEY_SECRET`：上述 RAM 用户的 AccessKey Secret。

阿里云 RAM 权限应只允许查询目标 CDN 域名并调用 `SetCdnDomainSSLCertificate`；不得复用 OSS 镜像写入凭据，也不得授予 OSS 删除、Bucket 公共读、DNS 全局管理或账单管理权限。首次人工运行成功并验证证书链、域名和到期时间以前，必须保持 `DOMESTIC_DOWNLOADS_ENABLED=false`，不得恢复 OSS 公共读。

GitHub 的工作流失败通知是续期失败的第一告警；每月运行后还要只读检查线上证书剩余有效期。连续一次失败即人工跟进，不等待下一月自动重试。

## Cloudflare Pages 配置门槛

生产和 Preview 分别创建独立 KV，并绑定为 `DOWNLOAD_RATE_LIMIT`。不得复用 `SUPPORT_RATE_LIMIT`。

分别为生产和 Preview 配置加密 Secret：

- `ALIYUN_CDN_AUTH_KEY`：必须与对应环境 CDN 鉴权方式 C 的主 KEY 一致。
- `DOWNLOAD_LOG_KEY`：独立随机值，仅用于 HMAC 处理 IP；不得与 CDN KEY、OSS AccessKey 或其他系统密钥复用。

普通环境变量：

- `DOWNLOAD_CDN_HOST=downloads.lekeopen.com`
- `DOWNLOAD_URL_TTL_SECONDS=120`
- `DOMESTIC_DOWNLOADS_ENABLED=false`

Preview 必须先使用独立 KV 和独立 CDN 测试 KEY 完成验收。所有门槛通过后，最后才将目标环境的 `DOMESTIC_DOWNLOADS_ENABLED` 改为 `true`。

## 发布与镜像

1. GitHub 正式 Release 出现后，发布监控读取固定资产证据。
2. 对 OSS 已存在对象只执行 HEAD，要求 `content-length` 和 `x-oss-meta-sha256` 与发布证据完全一致。
3. 缺少 SHA-256 元数据的旧对象失败关闭，不允许定时回读整个文件。应在一次性人工维护窗口核对文件后补齐元数据。
4. 新对象仅允许执行一次 GitHub 下载、SHA-256 校验、OSS 上传和 OSS 回读校验。
5. 任何证据不一致时不得覆盖对象、更新官网版本或继续发布。

## 验收

只在受控维护窗口进行一次完整下载验收：

1. 调用 `/api/download?product=leke-picker&asset=windows-modern-x64`，确认 302 的 Location 主机为 `downloads.lekeopen.com`。
2. 依次验证当前登记的四个资产；每个文件只完整下载一次并核对 SHA-256。
3. 确认 CDN 响应、命中率和访问日志；再次请求应命中 CDN 缓存。
4. 对 OSS 原始对象只发一个不跟随跳转的 HEAD，必须返回 403。
5. 重复请求下载接口，确认超过阈值返回 429 且没有 Location。
6. 查看 OSS 计量，流量应归类为 CDN 回源而非 OSS 公网外网流出。
7. 搜索线上 HTML、JS 和普通 API 响应，确认不存在 OSS Bucket 公网域名。

健康检查不得 GET 安装包，也不得跟随 GitHub Release 资产跳转。检查接口契约、CDN 域名和小型探针对象即可。

## 告警建议

- CDN 小时流量超过近期正常基线 3 倍时告警。
- 单资产签名请求在 10 分钟内异常增长时告警。
- CDN 鉴权 403、接口 429、接口 503 分别统计并告警。
- OSS 公网外网流出大于零时立即告警；CDN 回源流量按缓存命中率单独观察。
- 发布后 24 小时和 72 小时复核 CDN 命中率、地域、UA 和 IP 摘要分布。

## 回滚

1. 将 `DOMESTIC_DOWNLOADS_ENABLED` 改为 `false`。
2. 保留 GitHub 备用下载，不恢复 OSS 公共读。
3. 密钥泄漏时轮换 CDN 主/备 KEY 和 `DOWNLOAD_LOG_KEY`。
4. CDN 故障时可以暂时撤销 DNS，但不得指向 OSS 原始域名。
5. 不回滚镜像任务的 HEAD-only 修复。
