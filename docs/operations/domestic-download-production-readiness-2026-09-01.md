# 国内下载生产启用门禁（2026-09-01）

## 当前结论

国内 CDN **尚未满足生产启用条件**，必须继续保持 `DOMESTIC_DOWNLOADS_ENABLED=false`。官网受控下载接口在门禁关闭、配置缺失或限流服务异常时回退到发行清单锁定的 GitHub Release；不会返回 OSS 原始地址。

当前仓库证据：

- 下载域名固定为 `downloads.lekeopen.com`，签名有效期 120 秒；
- 签名密钥、IP 哈希密钥不在仓库和构建产物中；
- 受控接口仅接受发行清单中的产品与资产 ID；
- 浏览器请求每个资产每 10 分钟最多签发 5 次、每个产品每日最多 20 次；自动化 UA 的短周期上限为 2 次；
- 日志只记录产品、资产、国家、UA 分类、Ray ID 和截断后的 IP HMAC；
- 页面、下载接口和客户端不包含 OSS 公网源站；
- 生产与 Preview 当前都关闭国内 CDN；
- `wrangler.jsonc` 尚未绑定独立的 `DOWNLOAD_RATE_LIMIT` KV，因此即使误配其他变量，接口仍会回退 GitHub。

## 未完成门禁

以下项目在取得可复核的供应商证据前一律视为未完成：

1. `downloads.lekeopen.com` 的备案接入、DNS、有效 TLS 证书；
2. 阿里云 CDN 同账号私有 OSS 回源，且 OSS 公网原始地址保持 403；
3. CDN 鉴权方式 C 与缓存键忽略 `KEY1`、`KEY2` 的实测证据；
4. 生产与 Preview 各自独立的 `DOWNLOAD_RATE_LIMIT` KV；
5. 生产与 Preview 各自独立的 CDN 鉴权密钥及 IP 哈希密钥；
6. CDN 小时、日、月流量阈值、费用预算和告警接收人；
7. 小型探针、Range、一次完整下载、SHA-256、缓存命中和流量归属验收；
8. 关闭开关后的 GitHub 回退演练。

## 启用顺序

先在 Preview 完成全部门禁和一次受控下载验收，再为生产绑定独立 KV 与 Secret。最后一个动作才是把生产 `DOMESTIC_DOWNLOADS_ENABLED` 改为 `true`。任何一项失败都保持或恢复为 `false`；不得把 DNS 指向 OSS，不得恢复 Bucket 公共读。

## 当前回滚

保持或恢复 `DOMESTIC_DOWNLOADS_ENABLED=false` 即可停止签发国内 CDN 地址。GitHub Release、Microsoft Store 和在线版不受影响；OSS 对象继续私有保留，不删除、不覆盖。
