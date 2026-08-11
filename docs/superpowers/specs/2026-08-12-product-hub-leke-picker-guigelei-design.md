# 乐可开源双产品官网承接设计

**状态：** 已获用户整体确认，等待实施计划与代码实施

**日期：** 2026-08-12

## 目标

在 `lekeopen.com` 内建立统一产品矩阵，为“乐可点名 v1.1.0”和“归个类 v1.5.0”提供可信、可维护、可搜索、可统计的官方产品入口。官网是唯一宣传主阵地，不创建新域名、产品子域名或独立宣传网站。

## 已确认决策

- 产品列表入口保留 `/products/`，新增“乐可产品”优先区，现有工程项目继续保留在其后。
- 乐可点名产品页为 `/products/leke-picker/`，在线应用为 `/products/leke-picker/app/`。
- 归个类产品页为 `/products/guigelei/`，不提供网页版。
- 乐可点名完成公开前审计后，以干净源码快照发布到 `lekeopen/leke-picker` 并采用 Apache-2.0；仓库创建、源码推送和 Release 发布是独立人工审批动作。
- 归个类核心仓库 `lekeopen/ai-file-organizer` 保持私有；另建公开的 `lekeopen/guigelei-releases` 承载安装包、校验值、版本说明和反馈入口。
- GitHub 只承担源码、Release、更新记录和问题反馈，不承担独立宣传站职责。
- 未经人工确认，不合并 `main`、不推送、不部署、不提交搜索平台。

## 当前架构基线

官网使用 React 18、TypeScript、Vite、React Router、Tailwind CSS 和 Markdown 内容。现有项目内容来自 `content/projects/*.md`，详情使用 `/projects/:id`。生产构建通过 Vite SSR 和预渲染输出静态正文、canonical、JSON-LD、sitemap、robots 和静态 404。

新增产品专页不复用通用项目详情模板，因为产品页需要下载矩阵、版本、系统要求、FAQ、隐私和动态下载统计。现有 `/projects/:id` 路由和内容保持不变。

## 信息架构

### `/products/`

页面由两部分组成：

1. “乐可产品”：展示乐可点名和归个类，包含产品名称、一句话价值、平台、当前版本和“了解产品”入口。
2. “工程项目与实践”：复用现有项目卡片和 `/projects/:id` 链接。

首页现有项目展示不强制重构；若展示数量受限，优先保证 `/products/` 能发现两款产品。

### `/products/leke-picker/`

按以下顺序展示：

1. 首屏：产品标识、v1.1.0、价值主张、“立即在线使用”和“下载 Windows 版”。
2. 核心价值：名单录入、1 至 5 人抽取、一轮内不重复、快捷键、全屏、导入导出。
3. 真实界面：来自 v1.1.0 的真实主界面、名单管理、多人结果和全屏截图。
4. 在线使用：链接到 `/products/leke-picker/app/`，不在介绍页 iframe 嵌入。
5. Windows 下载：Windows 10/11 x64、Windows 7 SP1 x64、Windows 7 SP1 x86 三个明确选项。
6. 版本与系统要求：版本、系统、架构、SP1 要求和浏览器要求。
7. 隐私：名单只保存在本机，不上传、不要求账号，并说明备份和清除方式。
8. FAQ：安装包选择、未知发布者、Win7 EOL、同名学生、断网、迁移和卸载数据。
9. GitHub 与更新记录：源码、Release、CHANGELOG 和反馈入口。
10. 下载统计：仅汇总当前正式版本的三个安装包资产。

下载区必须紧邻展示：三个安装器尚未签名；Windows 7 兼容包使用已结束维护的 Electron 22.3.27；不得要求用户关闭 SmartScreen、杀毒软件或其他保护。

### `/products/leke-picker/app/`

- 由乐可点名仓库独立构建并部署到官网固定子路径。
- 不复制产品业务源码到官网仓库。
- 构建必须正确设置 Vite base 和静态资源路径，直接访问及刷新均可用。
- 页面不加载 Microsoft Clarity 或其他行为分析。
- 页面设置 `noindex, nofollow`，不进入 sitemap，产品介绍页保持唯一搜索入口。

### `/products/guigelei/`

按以下顺序展示：

1. 首屏：产品标识、v1.5.0、价值主张、“下载 macOS 版”和“查看更新记录”。
2. 核心价值：本地扫描、按类型/时间/项目整理、自定义方案、预览、重名保护和撤销。
3. 安全流程：选择文件夹、扫描、预览调整、人工确认、移动、结果、撤销。
4. 真实界面：扫描预览、整理结果、撤销和 v1.5.0 自定义整理方案截图。
5. 下载：Apple Silicon DMG、大小、SHA-256 和发布风险。
6. 系统要求：macOS 12+、Apple Silicon M1/M2/M3/M4；不支持 Intel Mac，当前不提供 Windows 版。
7. 隐私与文件安全：不上传文件、不读取正文、不使用云端 AI、不覆盖同名文件、空目录默认不删除。
8. FAQ：首次打开、安全提示、删除和撤销边界、`.app`、重名、Intel Mac 和 Windows。
9. 更新记录与反馈：链接公开发布仓库，不暴露私有源码仓库。
10. 下载统计：统计当前正式版本 DMG 资产。

下载区必须紧邻展示当前 DMG 尚未签名或公证，并以普通用户可理解的方式说明确认来源的方法。安全说明不得把已知 TOCTOU 边界描述为不存在。

## 数据与组件边界

创建类型化产品目录，作为产品列表、产品页和 SEO 元数据的单一来源。产品目录只保存公开、稳定的产品数据，不保存 GitHub Token、实时统计或本地路径。

建议接口：

```ts
type ProductSlug = 'leke-picker' | 'guigelei';

interface ProductDownload {
  id: string;
  label: string;
  platform: string;
  architecture: string;
  availability: 'available' | 'pending';
  assetName: string;
  url?: string;
  sha256: string;
  sizeBytes: number;
  warning?: string;
}

interface ProductDefinition {
  slug: ProductSlug;
  name: string;
  tagline: string;
  summary: string;
  version: string;
  platforms: string[];
  cover: string;
  downloads: ProductDownload[];
  repository?: string;
  releaseNotes: string;
}
```

产品页使用共享展示组件，但页面内容与特殊风险保持独立。共享组件包括产品首屏、真实界面图库、下载卡、下载统计、系统要求、隐私区和 FAQ。

## 下载统计

首版由浏览器端匿名请求公开 GitHub Releases API：

- 乐可点名只汇总当前正式版本三个 `.exe` 的 `download_count`。
- 归个类只显示当前正式版本 DMG 的 `download_count`。
- 不统计 GitHub 自动源码压缩包、页面访问量或按钮点击量。
- 响应按预期仓库、tag 和资产白名单过滤，未知资产不进入统计。
- 请求失败、限流、响应结构错误或仓库尚未公开时显示“下载统计暂不可用”。
- 统计异步加载，不阻塞产品页正文和下载按钮。
- 页面显示统计口径和查询时间，不把数字写死在源码中。

## Clarity 与隐私

- 官网产品介绍页继续使用现有 Clarity。
- 产品 CTA 可以发送只含产品、版本、平台和动作类型的自定义事件。
- 不发送学生姓名、文件名、目录路径、SHA-256 或自由文本。
- 乐可点名在线应用完全不加载 Clarity。
- 官网隐私政策补充 Clarity、GitHub 外链、下载统计来源和失败降级说明。

## SEO

- 两个产品介绍页加入共享 SEO 路由清单、预渲染、sitemap 和关键词治理。
- 使用唯一 title、description、canonical 和真实 OG 图片。
- 结构化数据使用 `SoftwareApplication`、`BreadcrumbList`，并为真实可见 FAQ 生成 `FAQPage`。
- `/products/` 与两个产品页双向内链。
- `/products/leke-picker/app/` 不进入 sitemap，并输出 `noindex, nofollow`。
- 下载 URL 不创建可索引落地页。
- 所有产品主要正文必须无需客户端 JavaScript 即可抓取。

## 真实素材要求

- 乐可点名补齐四张 v1.1.0 真实界面截图。
- 归个类复用三张验收截图，并补一张 v1.5.0 自定义方案截图。
- 截图不得包含真实学生姓名、真实文件名、用户目录、设备名、账号或其他个人信息。
- 每个产品生成独立的 1200×630 OG 图片；不使用 SVG 作为社交分享图。
- 图片放入官网 `public/images/products/<slug>/`，使用明确宽高、延迟加载和压缩格式。

## 发布与仓库治理

乐可点名开源前必须完成密钥与历史扫描、依赖/资产许可证审查、品牌商标边界、`LICENSE`、`SECURITY.md` 和贡献说明。公开仓库与许可证变更需要独立授权。

归个类公开发布仓库只包含用户需要的发布资料和 Release 资产。核心私有仓库、构建配置和历史不复制到公开仓库。创建仓库、上传 DMG、发布 Release 均需要独立授权。

官网实施遵循 `develop → 本地 verify → PR/CI → 人工预览 → 明确发布授权 → main → Cloudflare → 生产冒烟`。搜索平台真实提交不属于 CI，并需要单独授权。

## 验收标准

- `/products/` 可发现两款产品，现有项目和旧 URL 不回归。
- 两个产品页在桌面、移动端和微信 WebView 可读可用。
- 乐可点名三个 Windows 安装包和归个类 DMG 的 URL、文件名、大小、SHA-256 与正式 Release 一致。
- 在线应用在固定子路径直接访问和刷新均可用，且无 Clarity。
- 下载统计成功时口径正确，失败时可靠降级。
- 产品页静态正文、canonical、JSON-LD、OG、sitemap 和关键词治理通过现有门禁。
- 隐私政策与页面实际数据流一致。
- `npm run verify` 通过。
- 发布后完成首页、产品列表、两个产品页、在线应用、下载链接、sitemap、robots、404 和 Clarity 的只读冒烟检查。

## 不在本次范围

- 新域名、产品子域名或独立宣传站。
- 归个类网页版、Intel Mac 或 Windows 版。
- 自动更新、代码签名或 Apple 公证本身。
- 后端下载代理、账号系统、支付、许可证服务器或数据库。
- 未经批准的仓库公开、许可证变更、推送、合并、部署或搜索平台提交。

## 回滚

官网发布失败时回退到上一条已验证的 `main` 提交并由托管平台重新部署，不直接修改生产产物。GitHub 仓库可见性和开源许可证一旦公开可能已被第三方复制，不能视为普通可逆发布；因此必须在官网发布动作之外单独审批并先完成审计。
