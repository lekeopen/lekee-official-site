# 乐可点名正式版本、微软商店与下载分发设计

日期：2026-09-01

## 1. 目标

建立一个长期可维护、自动化且费用可控的“乐可点名”发行体系：

- GitHub 正式 Release 是唯一版本权威；
- 官网自动展示最新稳定版本、在线版、微软商店入口、安装包和历史版本；
- Microsoft Store 是 Windows 10/11 用户的推荐安装渠道；
- GitHub 安装包保留为官方备用与离线下载；
- OSS 只保存经过校验的私有字节镜像，不决定版本，也不直接暴露给用户；
- 国内受控下载未安全启用时自动回退 GitHub，不能恢复 OSS 公共读；
- Draft、Prerelease、附件不完整或校验失败的版本不得进入官网。

本设计只覆盖乐可点名及官网既有发行链路，不修改点名算法、名单数据模型或课堂功能，不引入新的代码托管镜像。

## 2. 已确认现状

### 2.1 版本权威与官网数据

官网通过 `scripts/product-release-monitor.mjs` 每 15 分钟读取 `lekeopen/leke-picker` 的最新正式 Release，验证版本、附件名称、大小、GitHub URL 和 SHA-256，再更新 `src/products/releases.json`。当前官网发行目录已记录 v1.1.1，并保留 v1.1.0 历史记录。

`src/products/releases.json` 同时驱动产品目录、下载卡片、更新记录、SEO、反馈版本选择和受控下载接口。该单一数据源应继续保留。

### 2.2 在线版落后

`public/products/leke-picker/app/distribution-manifest.json` 仍记录 v1.1.0 和旧源码提交；在线静态资源不会随 GitHub Release 自动更新。v1.1.1 包含全屏多人布局等 Web 可见变化，因此当前在线版与正式版不一致。

公开仓库 `lekeopen/leke-picker` 的 `v1.1.1` 源码标签当前仍指向旧的 v1.1.0 审核快照，不能作为 v1.1.1 在线版构建来源，也不得通过强制改写公开标签修复。当前 v1.1.1 应从私有源码仓库真实且干净的 `v1.1.1` 标签做一次可审计构建；后续版本由私有源码发布工作流生成在线分发包及清单，并作为经过验证的公开 Release 附件同步。

### 2.3 微软商店

Microsoft Store 的公开教育应用列表已能检索到“乐可点名”，但官网尚无商店入口。官网接入前必须用 Partner Center 中的 Store ID 核对最终详情页 URL；当前待核对标识为 `9P8078B19P1H`。微软官方推荐使用 `https://apps.microsoft.com/detail/<Store ID>` 作为网页入口，也可在 Windows 中用 Store ID 打开产品详情页。

商店上架状态和 GitHub 版本是两个不同事实：GitHub Release 决定官网的产品版本；商店只在已确认公开且版本不落后于该 Release 时显示“最新版可用”。

### 2.4 OSS 与国内下载

`lekeopen-downloads` 已设为私有，必须保持私有。镜像程序按版本化对象路径上传并校验元数据，不应在页面源码、接口响应或客户端配置中暴露 OSS 公网域名。

当前 `/api/download` 在国内 CDN 条件未满足时 302 回退 GitHub。这是安全降级，不是故障。只有备案、`downloads.lekeopen.com`、阿里云 CDN 私有回源、短时签名、限流、日志和费用告警全部通过验收后，国内入口才可切到 CDN。

## 3. 推荐架构

### 3.1 发行角色

| 组件 | 角色 | 是否决定版本 |
| --- | --- | --- |
| GitHub 正式 Release | 唯一发行权威、更新记录、附件证据 | 是 |
| 官网 | 展示与下载路由 | 否 |
| Microsoft Store | Windows 10/11 推荐安装与自动更新渠道 | 否 |
| 官网在线版 | 与同一稳定版本对应的 Web 构建 | 否 |
| 私有 OSS | 已验证安装包的国内源站镜像 | 否 |
| 阿里云 CDN | 未来国内下载流量出口 | 否 |

任何平台都不能单独把官网版本号向前推进。版本推进只发生在新的、完整的 GitHub 正式 Release 通过验证之后。这样避免商店审核延迟、OSS 上传状态或在线版构建状态互相覆盖产品版本。

### 3.2 数据模型

在现有发行记录上增加可选的分发元数据，不另建数据库：

- `store.microsoft.storeId`：固定产品标识；
- `store.microsoft.url`：由 Store ID 推导并经公开访问验证的官方详情页；
- `store.microsoft.version`：最近一次核验到的商店包版本；
- `store.microsoft.status`：`verified`、`lagging` 或 `unavailable`；
- `web.version`、`web.sourceCommit`、`web.manifestPath`：在线构建证据；
- `releases[]`：继续保存最近 10 个通过验证的稳定版本。

其中 GitHub Release 字段由自动监控管理；商店字段和在线构建证据只能由各自验证步骤写入。页面不得根据按钮是否存在猜测版本状态。

### 3.3 自动化数据流

正式 Release 发布后的流程：

1. GitHub Actions 读取公开 Release，只接受 `draft=false`、`prerelease=false` 的严格 SemVer 版本。
2. 验证 Windows 10/11 主安装包；Windows 7 兼容包允许从已验证的旧 Release 继承，但必须保留原始 tag、URL、大小和 SHA-256。
3. 将新版本追加到历史并更新当前版本，最多保留最近 10 条官网结构化记录；GitHub 历史 Release 不删除。
4. 对私有 OSS 执行“只增不覆盖”的镜像：已有对象只检查长度和 SHA-256 元数据，新对象才下载、校验、上传并回读一次。
5. 从与 Release 对应的已审核源码提交构建在线版，生成包含版本、源码提交、dirty 状态和文件摘要的分发清单。
6. 仅当在线构建版本等于官网当前版本、来源提交干净且完整验证通过时，才替换官网在线静态文件。
7. 运行完整 `npm run verify`；仅允许机器修改发行 JSON、在线版静态目录和对应清单，出现其他路径变化立即失败。
8. 通过受保护的 PR 或受限机器人提交进入 `main`，由既有 Cloudflare 流程部署。
9. 部署后分别验证产品页版本、在线版清单、商店入口、GitHub 备用下载和受控下载降级。

GitHub Release 与在线版源码必须存在显式映射。公开 Release 增加机器可读的在线分发清单及内容寻址压缩包，至少包含 `version`、私有源码 `sourceCommit`、文件大小和 SHA-256；官网只导入通过验证的附件。当前 v1.1.1 的一次性修复必须从私有源码的锁定 tag 构建并记录同样证据，不能使用开发机上未提交的 `dist`，也不能依赖错误的公开源码标签。

### 3.4 微软商店展示

产品页 Windows 10/11 下载区调整为：

1. 主按钮：“从 Microsoft Store 获取”，带官方商店标识，并说明“推荐，自动更新”；
2. 次按钮：“下载安装包”，仍经过官网 `/api/download`；
3. 辅助链接：“GitHub 备用下载”；
4. Windows 7 继续收在“旧电脑兼容下载”中，不显示商店入口。

若商店公开页面不可访问、Store ID 未核对或商店包版本落后，主按钮仍可展示为“Microsoft Store 版本”，但不得标注“最新版”；严重不一致时隐藏商店主入口，安装包自动成为主入口。商店状态异常不能阻止 GitHub 正式版发布，也不能把官网版本回退。

SEO 的 `SoftwareApplication` 版本仍取 GitHub Release；下载 URL 指向官网受控入口或产品页，不把商店或 OSS 当作版本权威。

产品页中的“立即在线使用”及其他指向在线版的入口统一使用新浏览上下文打开（`target="_blank"` 和 `rel="noopener noreferrer"`），保留原产品页不被替换。该行为在桌面端和移动端保持一致，并纳入页面自动测试。

### 3.5 在线版策略

在线版和桌面版共享同一产品版本号，但两者是不同交付物：

- 在线版必须显示自己的构建版本和源码证据；
- 产品页当前版本为 v1.1.1 时，在线入口不得继续静默提供 v1.1.0；
- 若新版桌面 Release 已发布而在线构建失败，产品页明确标注“在线版暂为 vX.Y.Z”，继续提供最后一个已验证在线版，不能伪装为最新版；
- 在线版失败不阻断桌面安装包和商店入口，但自动化必须报警并保留失败证据。

第一轮实施应从干净、可审计的 v1.1.1 源码提交重新构建在线版，替换当前 v1.1.0 静态产物，并验证 1 至 5 人全屏布局、名单导入导出、本地存储、键盘操作和隐私边界。

## 4. 历史版本

- GitHub：永久保留所有正式 Release，作为完整历史和权威附件来源；
- 官网数据：保留最近 10 个稳定版本，避免 JSON 无限增长；
- 产品页：默认显示当前版本和最近 2 个历史版本，其余跳转 GitHub Releases；
- OSS：按 `<product>/<version>/<filename>` 保存已验证对象，私有且不可覆盖；
- Windows 7 继承附件时，历史页明确显示其真实来源版本，不能把旧文件冒充为新构建；
- Draft、Prerelease、已删除版本、缺少附件或缺少摘要的版本不进入历史。

## 5. 国内下载与费用控制

### 5.1 当前阶段

- OSS 保持私有；
- `/api/download` 返回 GitHub 备用地址；
- 页面不输出 OSS 域名和永久签名；
- 不启用任何未经备案和费用保护验收的 CDN 链路。

### 5.2 CDN 启用条件

必须全部满足：

1. `downloads.lekeopen.com` 完成所需备案接入并绑定阿里云 CDN；
2. CDN 使用私有 OSS 回源，用户不能绕过 CDN 读取 Bucket；
3. 官网下载接口只接受代码内登记的产品与资产 ID，生成不超过 120 秒的 CDN 签名 URL；
4. CDN 缓存键忽略签名参数，版本化文件可长缓存；
5. 接口具备每 IP 频率限制、异常 User-Agent 基础阻断和结构化日志；
6. 配置月度预算、日流量阈值和异常告警，并设置可快速停用的开关；
7. 通过 Range、完整下载、大小、SHA-256、旧 OSS 直链拒绝访问和 CDN 流量归属验收。

费用边界采用“先限额、后放量”：初始只开放低阈值，观察 7 天再调整。任何告警、签名绕过、回源异常或费用失控都立即关闭国内 CDN，`/api/download` 回退 GitHub；回滚不删除 OSS 对象，不影响商店或 GitHub Release。

## 6. 失败处理

- GitHub API 不可用：不改任何文件，等待下次调度；
- Release 证据不完整：失败并报警，不更新官网；
- 在线构建失败：保留上一版在线版并显示真实版本；
- OSS 镜像失败：不启用国内镜像，桌面版本仍可经商店/GitHub发布；
- Microsoft Store 页面或版本核验失败：降级为安装包主入口，不影响官网版本；
- 官网验证、CI 或部署失败：不合并、不宣称上线；
- 生产验收失败：回滚网站部署或关闭对应入口，GitHub Release 本身不删除。

## 7. 安全边界

- 不在仓库、页面、日志或构建产物中保存 AccessKey、PAT、CDN Secret 或短时签名 URL；
- 跨仓库发布优先使用最小权限 GitHub App；临时 PAT 不作为长期自动化方案；
- 自动提交路径使用白名单，禁止工作流夹带源码或配置变更；
- 不恢复 OSS 公共读，不提供永久 OSS URL；
- 下载页始终展示文件名、大小、SHA-256、签名状态和 Windows 7 EOL 提示；
- 商店徽章和链接只使用微软官方素材及官方域名。

## 8. 验证与验收

### 8.1 自动测试

- Release：稳定/草稿/预发布、升降级、附件缺失、摘要错误、Win7 继承、历史截断；
- 在线版：版本和源码提交一致、清单摘要正确、`sourceDirty=false`、资源无绝对开发路径或密钥；
- 商店：Store ID 和官方 URL 格式、状态降级、版本落后时不显示“最新版”；
- 下载：受控同源接口、资产白名单、GitHub 回退、OSS 域名不泄漏；
- 页面：桌面/移动端按钮层级、历史版本、SEO、无障碍标签和分析事件；
- 在线入口：必须在新浏览上下文打开，并包含 `noopener noreferrer`；
- 全量：`npm run verify`。

### 8.2 发布后只读验收

- 产品页和结构化数据均显示 v1.1.1；
- 在线版分发清单显示 v1.1.1，且核心交互通过真实浏览器检查；
- Microsoft Store 按钮打开经核对的“乐可点名”官方页面；
- Windows 10/11 安装包、GitHub 备用和 Windows 7 兼容链接均正确；
- 国内 CDN 未启用时，受控接口明确回退 GitHub；启用后流量经 CDN，OSS 公网直链仍拒绝访问；
- Cloudflare 生产部署成功，SEO 只读检查无 release-blocking 错误。

## 9. 实施边界与顺序

1. 修复在线版 v1.1.1 构建与分发清单；
2. 增加微软商店数据、状态校验和产品页推荐入口；
3. 扩展 Release 自动化，使官网版本、历史和在线版在严格证据下联动；
4. 完成测试、预览和生产前验收；
5. 国内 CDN 作为独立上线门禁，备案和费用保护未完成前保持 GitHub 回退；
6. 归个类后续复用同一分发模型，但不在本次乐可点名实施中顺带改造。

任何提交、推送、PR、合并或生产部署均需要独立人工授权。

## 10. 参考

- Microsoft Learn：应用商店公开链接格式为 `https://apps.microsoft.com/detail/<Store ID>`：<https://learn.microsoft.com/zh-cn/windows/apps/publish/view-app-identity-details>
- Microsoft Learn：Windows 中建议使用 Store ID 打开产品详情页：<https://learn.microsoft.com/zh-cn/windows/apps/develop/launch/launch-store-app>
- Microsoft Store 教育类公开列表（当前可检索“乐可点名”）：<https://www.microsoft.com/en-us/store/new/apps/pc?category=Education>
