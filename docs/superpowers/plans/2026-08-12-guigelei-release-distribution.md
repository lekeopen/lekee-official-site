# 归个类公开发布仓库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持 `lekeopen/ai-file-organizer` 核心源码私有的同时，建立可匿名访问、可下载、可统计、可反馈的归个类公开发布仓库。

**Architecture:** 新建最小公开仓库 `lekeopen/guigelei-releases`，只存用户文档与 Release 元数据；DMG 作为 GitHub Release 资产上传。私有仓库继续承担源码、构建和内部验收，公开仓库不包含其 Git 历史或构建配置。

**Tech Stack:** GitHub Repository、GitHub Releases、Markdown、SHA-256、macOS DMG。

## Global Constraints

- 核心源码仓库保持 Private；不得复制源码、内部历史、构建配置、Token、日志或本地证据。
- 当前正式版本为 v1.5.0，仅支持 macOS 12+ 和 Apple Silicon。
- 当前 DMG 未签名、未公证；不得表述为已完成签名、公证或 Apple 审核。
- 当前不支持 Intel Mac 或 Windows；不得提供虚构下载入口。
- 仓库创建、公开、资产上传和 Release 发布分别需要人工授权。
- 未经授权不创建外部仓库、不上传、不发布。

---

### Task 1: 冻结公开发布清单

**Files:**
- Create in private source repo: `docs/release/public-distribution-manifest-v1.5.0.md`

- [ ] 从正式 v1.5.0 Release 读取 DMG 文件名、字节数和 SHA-256，并与本地已验收候选逐字节核对。
- [ ] 记录产品名、版本、最低系统、架构、未签名/未公证、发布日期和源 commit；不记录本地绝对路径。
- [ ] 运行私有仓库 `npm run verify`，并记录实际通过或失败结果。
- [ ] 审查 DMG 内产品名、版本、图标和架构；预览或代码绿色不能替代真实 DMG 身份检查。
- [ ] 暂停并请求公开分发 GO/NO-GO。

### Task 2: 准备最小公开仓库内容

**Files in new repository:**
- Create: `README.md`
- Create: `PRIVACY.md`
- Create: `SECURITY.md`
- Create: `SUPPORT.md`
- Create: `CHANGELOG.md`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] 在临时本地目录准备文件，不创建远程仓库；README 只描述产品、系统要求、下载入口和乐可开源官网。
- [ ] 隐私文件说明完全本地运行、不上传文件、不读取正文、不使用云端 AI；同时保留文件操作和 TOCTOU 边界的准确表述。
- [ ] 安全文件提供私下漏洞报告方式；Issue 模板明确禁止上传敏感文件、真实目录列表或个人数据。
- [ ] CHANGELOG 只包含公开版本事实，不复制私有开发日志或未发布路线。
- [ ] 运行敏感词、绝对路径、私有仓库 URL 和占位符扫描；结果必须为零。

### Task 3: 创建公开仓库并配置治理

**Files:**
- External GitHub state only after approval.

- [ ] 展示待创建仓库名、描述、可见性、默认分支、文件清单和回滚局限，申请创建授权。
- [ ] 获批后创建 `lekeopen/guigelei-releases` 为 Public，但先不创建 Release。
- [ ] 推送最小文档前再次展示精确 diff 并申请 push 授权。
- [ ] 配置 Issues、关闭 Wiki/Projects 等未使用功能；开启分支保护和最小权限。
- [ ] 用匿名浏览验证仓库公开内容，不以组织登录态代替。

### Task 4: 发布 v1.5.0 DMG

**Files:**
- GitHub Release asset: `guigelei-1.5.0-arm64.dmg`

- [ ] 从冻结清单重新计算待上传文件字节数与 SHA-256，任何差异直接停止。
- [ ] 准备 Release 标题、说明、系统要求、安装步骤、未签名/未公证警告和 SHA-256；不得声称 Windows 支持。
- [ ] 展示资产和说明，申请单独发布授权。
- [ ] 获批后创建 v1.5.0 Release 并上传唯一 DMG；不要附加私有源码归档。
- [ ] 匿名下载后重新计算 SHA-256，并验证 GitHub API 返回正确 assetName、size 和 download_count。

### Task 5: 接入官网与持续发布规则

**Files:**
- Modify in public repo: `README.md` only if final Release URL differs.
- Consume in website: product catalog and download stats configuration.

- [ ] 把公开仓库、tag、assetName、size、SHA-256 和下载 URL交给官网产品目录。
- [ ] 官网预览验证下载按钮、风险说明、FAQ、统计成功与 API 失败降级。
- [ ] 用户明确授权官网发布后才上线 `/products/guigelei/`。
- [ ] 后续每个版本重复“私有构建验收 → 冻结清单 → 单独批准上传 → 匿名复核 → 官网更新”的顺序。
- [ ] 发现安装包或文案错误时先撤下/标记有问题的 Release 并停止官网入口；不得用同名资产静默覆盖已发布字节。
