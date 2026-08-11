# 乐可点名公开仓库与同域在线应用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不泄露敏感历史或削弱发布安全边界的前提下，将乐可点名正式开源，并产出可部署到 lekeopen.com 固定子路径的在线应用。

**Architecture:** 产品经历史、许可证和品牌审计后，以干净源码快照发布到 `lekeopen/leke-picker` 独立维护。在线构建使用明确的 Vite base 生成静态文件，由官网部署流程消费，不在官网仓库复制业务源码。

**Tech Stack:** React 19、TypeScript 6、Vite 8、Vitest、Tauri 2、Electron 22.3.27、GitHub Releases、Apache-2.0。

## Global Constraints

- 仓库可见性变更、许可证发布和 GitHub Release 修改均需独立人工授权。
- 公开前不得出现 Token、真实名单、VM 地址、内部路径、私有证据或无权再分发资产。
- Apache-2.0 适用于代码；“乐可点名”和乐可品牌资产必须另有商标与官方版本说明。
- Windows 7 EOL、Electron EOL 和未签名风险不得淡化。
- 在线应用固定 base 为 `/products/leke-picker/app/`，不加载 Clarity，不发送名单或遥测。
- 未经授权不 commit、不 push、不改变仓库 visibility。

---

### Task 1: 公开前历史与资产审计

**Files:**
- Create: `docs/release/public-repository-audit.md`
- Modify: `.gitignore`

- [ ] 检查 tracked 文件、完整 Git 历史、tags 和 Release 附件中的凭据模式、真实名单、私有 IP、用户名目录和内部证据引用；输出路径和结论，不在报告中复制秘密值。
- [ ] 运行依赖许可证清单，逐项确认 SVG、ICO、字体、声音和第三方代码可公开再分发。
- [ ] 对每项发现给出“移除当前文件、重写历史、替换资产、保留并说明”之一；历史重写属于破坏性动作，必须单独获批。
- [ ] 重新运行 `npm test`、`npm run build`、`npm run electron:policy` 和相关 Rust 检查，证明审计修复没有改变产品行为。
- [ ] 展示审计报告并暂停；只有报告为 GO 且用户明确授权，才进入许可证任务。

### Task 2: 建立开源与品牌治理文件

**Files:**
- Create: `LICENSE`
- Create: `NOTICE`
- Create: `TRADEMARKS.md`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `package.json`

- [ ] 写测试断言许可证为 Apache-2.0、package metadata 一致、README 不再写模糊版权状态、商标文件禁止冒充官方发行版。
- [ ] 运行测试确认失败。
- [ ] 加入标准 Apache-2.0 正文；NOTICE 记录版权所有者；商标文件把代码许可与品牌许可分开；SECURITY 提供私下漏洞报告渠道且不放个人凭据。
- [ ] 运行完整 `npm test`、类型检查、lint、生产构建和桌面策略门禁。
- [ ] 暂停并请求明确 commit/push 授权；授权不等于允许改变 visibility。

### Task 3: 产出同域在线应用构建

**Files:**
- Modify: `vite.config.ts`
- Modify: `index.html`
- Create: `scripts/verifyWebDistribution.cjs`
- Create: `src/platform/webDistribution.test.ts`
- Modify: `package.json`

- [ ] 写失败测试断言生产 web 构建 base 为 `/products/leke-picker/app/`、HTML 有 `noindex, nofollow`、产物不含 `clarity.ms`、Clarity ID、GitHub Token 或绝对开发路径。
- [ ] 运行测试确认失败。
- [ ] 增加明确的 `build:web:lekeopen` 命令，不改变桌面构建默认 base；验证器读取最终 dist HTML 和资产引用。
- [ ] 运行 `npm test`、`npm run build:web:lekeopen` 和验证脚本；用本地子路径服务器验证直接访问、刷新、导入导出和断网后的现有页面功能。
- [ ] 生成内容寻址 manifest，供官网部署流程验证来源 commit、版本、文件集合和 SHA-256。
- [ ] 暂停并请求 commit/push 授权；部署官网是另一个独立授权。

### Task 4: 验证公开 Release 与官网契约

**Files:**
- Modify: `RELEASE_NOTES_V1.1.0.md`
- Modify: `README.md`
- Create: `docs/release/website-distribution-contract.md`

- [ ] 核对 v1.1.0 三个安装包的文件名、大小、SHA-256 和 GitHub API download URL 与官网产品目录完全一致。
- [ ] 记录在线产物交付接口：tag、commit、base、manifest hash、禁止分析脚本和回滚版本。
- [ ] 验证仓库公开后匿名访问 README、LICENSE、Release 页面和三个资产；登录态访问不能代替匿名验收。
- [ ] 暂停并请求仓库 visibility 变更授权；获批后才在 GitHub 设置中转为 Public。
- [ ] visibility 变更后立即执行匿名只读复核；失败则停止官网发布，不假设改回 Private 能撤销已发生的复制。

### Task 5: 交付官网并保留发布门禁

**Files:**
- No source changes required in this repository unless交付契约验证失败。

- [ ] 把经过验证的 web manifest 和产物交给官网计划 Task 8，不手工复制未验证 dist。
- [ ] 官网预览环境验证固定子路径、刷新、资源、noindex 和无 Clarity。
- [ ] 用户明确批准官网发布后才允许产品页和在线应用上线。
- [ ] 发布后匿名验证在线使用、三个安装包、源码、更新记录和下载统计；记录实际结果。
- [ ] 任何异常回滚官网到上一已验证版本；开源仓库可见性不作为自动回滚动作。
