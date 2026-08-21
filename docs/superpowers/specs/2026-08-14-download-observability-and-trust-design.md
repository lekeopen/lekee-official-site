# 官网下载可观测性、自动分发健康度与信任体验设计

## 目标

在不新增数据库、不引入新的分析平台、不购买签名服务的前提下，清晰区分阿里云 OSS 主下载和 GitHub 备用下载，确认 GitHub Actions 自然定时分发可用，并为软件签名与 `downloads.lekeopen.com` 建立可执行且可回滚的后续路径。

## 已确认决策

- GitHub Release 继续作为权威发布源，阿里云 OSS 只保存经过完整校验的国内下载副本。
- 使用现有 Microsoft Clarity 自定义事件区分 OSS 与 GitHub 点击，不新增 Cloudflare KV、D1、PostHog 或自建计数服务。
- 页面现有下载数字仅来自 GitHub Release API，因此文案明确为“GitHub Release 累计下载”，不把它描述为全部下载量。
- 保持 GitHub Actions 定时检查，不依赖 Studio、Codex 或个人电脑在线。
- 当前不购买 Windows 代码签名或 Apple Developer 资格；继续使用官方来源、SHA-256、安装帮助和安全提示降低风险。
- `downloads.lekeopen.com` 只有在阿里云域名绑定、备案接入、HTTPS 证书和回滚条件全部满足后才启用；否则继续使用 OSS 官方 HTTPS 域名。

## 1. 下载统计设计

### 事件模型

每次下载事件由产品、安装包和来源三部分组成，名称保持固定、可搜索：

- `product_leke_picker_download_modern_oss`
- `product_leke_picker_download_modern_github`
- `product_leke_picker_download_win7_x64_oss`
- `product_leke_picker_download_win7_x64_github`
- `product_leke_picker_download_win7_x86_oss`
- `product_leke_picker_download_win7_x86_github`
- `product_guigelei_download_macos_oss`
- `product_guigelei_download_macos_github`
- 后续 Windows 版沿用 `product_guigelei_download_windows_oss` 与 `product_guigelei_download_windows_github`。

`ProductDownload` 分别保存 `analyticsEvent` 和 `fallbackAnalyticsEvent`。下载组件在点击主链接时发送 OSS 事件，在点击备用链接时发送 GitHub 事件。事件只包含固定枚举名，不发送文件名、URL、用户标识或表单内容。

### 页面数字

`DownloadStats` 继续读取 GitHub Release API，成功时显示“GitHub Release 累计下载”；失败或加载中保持静默，不显示长期加载状态或错误占位。Clarity 用于比较 OSS 与 GitHub 的点击趋势，不与 GitHub API 数字相加，也不声称是精确安装量。

### 验收

- 每个现有安装包都有 OSS 与 GitHub 两个不同的类型安全事件。
- 主链接与备用链接分别触发对应事件。
- 页面只把 GitHub API 数字标注为 GitHub Release 下载。
- 预渲染页面仍包含两个可直接访问的 HTTPS 下载地址。

## 2. 自动分发健康度设计

### 当前机制

`.github/workflows/product-release-monitor.yml` 保持定时和手动入口。工作流继续执行稳定 Release 检查、附件证据核验、OSS 上传或回读校验，并只允许自动提交 `src/products/releases.json`。

### 健康证据

本阶段不新增公开状态页。验收以 GitHub Actions 自然 `schedule` 事件为准，记录：

- 运行 ID、触发时间和 `event=schedule`；
- 使用的 `main` 提交；
- 检测到的正式版本；
- 每个 OSS 对象的 `verified-existing` 或 `uploaded` 状态；
- 完成状态为成功。

若 90 分钟内没有新的自然运行，先只读确认工作流为 active、默认分支为 `main`、cron 语法有效且没有并发任务占用。若 GitHub 仍长期延迟，再将 cron 从每 15 分钟调整为每小时一次，减少调度拥堵；该调整需单独提交和发布授权。

## 3. 软件签名路径

### 当前阶段

- 乐可点名 Windows 安装包继续显示“未知发布者”说明、SHA-256 和 SmartScreen 安装帮助。
- 归个类 macOS DMG 继续显示未签名、未公证说明和 Gatekeeper 安全打开方式。
- 不建议用户关闭杀毒软件、SmartScreen 或 Gatekeeper。

### 升级条件

当产品形成稳定发布节奏或未签名提示明显影响下载转化时，再启动独立签名项目：Windows 选择受信任代码签名证书并接入构建流水线；macOS 购买 Apple Developer Program、Developer ID 签名并完成 notarization。签名项目必须包含密钥托管、最小权限、轮换、构建机边界和失败回滚，不在本阶段用临时绕过方案替代。

## 4. 自定义下载域名设计

### 只读核查项

- Cloudflare DNS 中 `downloads.lekeopen.com` 当前记录与代理状态；
- 阿里云 OSS Bucket `lekeopen-downloads` 的区域、公共访问、CORS 和自定义域名绑定状态；
- 阿里云对 `downloads.lekeopen.com` 的备案接入校验结果；
- HTTPS 证书签发与续期方式；
- 是否启用 CDN，以及源站、防盗链和大文件 Range 请求兼容性。

### 启用条件与回滚

仅当 DNS、备案接入、OSS 绑定和 HTTPS 均验证通过时，才把产品目录的 OSS 基础地址切换为 `https://downloads.lekeopen.com`。切换前保留 OSS 官方地址作为配置级回滚值；切换后验证 HEAD、Range、完整下载大小和 SHA-256。任何错误立即恢复官方 OSS URL，不删除对象、不修改 GitHub 备用地址。

## 5. 测试与发布边界

- 使用测试驱动方式先增加事件枚举、主备点击和统计文案断言，再修改实现。
- 运行下载相关专项测试和完整 `npm run verify`。
- 在本地生产预览中检查乐可点名、归个类的桌面端和移动端下载区。
- PR 先保持 Draft，等待 GitHub Actions 和 Cloudflare Preview 成功。
- 转 Ready、合并、生产部署、DNS、OSS 域名绑定、证书配置和任何付费签名均需要各自明确授权。
- 生产验收只读执行，不向百度、IndexNow 或其他搜索平台提交数据。

## 不在本阶段范围

- 自建公开下载计数器或管理面板；
- 把 Clarity 点击数展示为页面累计下载量；
- 购买代码签名证书或 Apple Developer 资格；
- 未通过备案和 HTTPS 验证时启用自定义下载域名；
- 修改桌面 App 源码或重新构建安装包。
