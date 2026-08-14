# 下载域名与软件签名准备度（2026-08-14）

## 当前结论

- OSS 正式下载继续使用 `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com`。
- `downloads.lekeopen.com` 当前没有可公开解析的 A、AAAA 或 CNAME 记录，HTTPS 请求无法解析主机，**不满足启用条件**。
- 乐可点名 Windows 安装包仍未进行代码签名；归个类 macOS DMG 仍未使用 Developer ID 签名或 Apple 公证。官网必须继续保留现有风险提示和 SHA-256。
- 本次不修改 DNS、OSS、CDN、证书或签名配置，不购买服务，不重新构建安装包。

## 公开链路证据

2026-08-14 11:10（Asia/Shanghai）只读检查：

- `downloads.lekeopen.com`：DNS 无结果；HTTPS 因域名无法解析而不可用。
- OSS 官方对象：`leke-picker/1.1.0/leke-picker_1.1.0_x64-setup.exe` 返回 `200 OK`。
- 响应服务：`AliyunOSS`。
- 地域：官方端点为 `oss-cn-beijing`。
- 对象大小：`214599979` 字节，与冻结发布数据一致。
- 支持 `Accept-Ranges: bytes`，适合安装包断点/范围下载。

由于自动化浏览器未能在只读观察窗口内稳定加载阿里云控制台，本记录不猜测 Bucket 控制台中的 CORS、自定义域名、CDN 或证书开关状态。公开 DNS 缺失已经构成独立的停止条件；在控制台配置得到人工只读复核前，不得切换域名。

## 自定义域名启用门槛

只有以下条件全部有证据时，才可提出独立变更：

1. Cloudflare DNS 中创建目标记录，并明确是否代理；
2. 阿里云 OSS 完成 `downloads.lekeopen.com` 自定义域名绑定；
3. 备案接入校验通过；
4. HTTPS 证书有效、自动续期路径明确；
5. HEAD、Range、完整文件大小和 SHA-256 验证通过；
6. 防盗链规则不会误伤官网用户、浏览器下载或 GitHub Actions 回读；
7. OSS 官方 URL 与 GitHub Release 备用地址仍可用。

直接下载不依赖浏览器跨域读取，因此当前没有理由仅为下载而扩大 CORS。若以后前端需要读取对象响应，再按最小来源和最小方法单独配置。

## 签名准备度

### Windows

当前状态：未签名。后续独立项目至少需要：

- 受信任的代码签名证书及明确的公司主体；
- 私钥的硬件或托管保护、最小权限和轮换流程；
- 构建后签名、时间戳、签名验证和失败关闭；
- 对三个安装包重新产出并重新执行 SHA-256、安装和发布验收。

购买证书或接入流水线之前，官网继续要求用户只从本页正式地址下载、核对 SHA-256，且不得建议关闭 SmartScreen 或杀毒软件。

### macOS

当前状态：未使用 Developer ID 签名、未公证。后续独立项目至少需要：

- Apple Developer Program 有效账号；
- Developer ID Application 证书及安全的密钥托管；
- Hardened Runtime、签名、公证、staple 和 Gatekeeper 验证；
- 对新 DMG 重新执行 SHA-256、安装和发布验收。

## 回滚

自定义域名未来若出现 DNS、证书、备案、CDN、Range 或校验问题，产品目录立即恢复 OSS 官方基础地址；不删除 OSS 对象，也不移除 GitHub Release 备用下载。签名项目失败时继续保留当前已冻结安装包及明确风险说明，不发布半签名或校验不一致的包。
