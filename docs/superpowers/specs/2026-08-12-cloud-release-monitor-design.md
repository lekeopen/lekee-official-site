# 官网产品发行版云端监控设计

## 目标

在 Mac Studio 关机时仍持续监控以下公开仓库的正式 GitHub Release，并在证据完整时自动更新 `lekeopen/lekee-official-site`：

- 乐可点名：`lekeopen/leke-picker`
- 归个类：`lekeopen/guigelei-releases`

监控运行在 GitHub Actions，不依赖本地 Codex、个人电脑或跨仓库写入密钥。检测延迟不超过 15 分钟。

## 方案选择

采用官网仓库定时轮询，而不采用跨仓库 `repository_dispatch`。两个上游仓库都是公开仓库，官网工作流可使用 GitHub API 只读访问 Release；更新官网时仅使用当前仓库的 `GITHUB_TOKEN`。这样避免在两个产品仓库保存能写官网的 PAT 或 GitHub App 凭据。

工作流同时支持 `workflow_dispatch`，用于发布后的立即检查和验收。

## 数据边界

新增一份机器可更新、代码可校验的发行数据文件，作为产品页面和 SEO 构建的唯一发行事实源。它只包含：

- 产品 slug 与上游仓库
- Release tag、语义版本、发布时间和 Release URL
- 允许的附件 ID、名称、平台、架构、下载 URL、大小和 SHA-256
- 系统要求与既有风险提示所需的稳定展示字段

产品名称、宣传文案、图片、统计事件名和风险提示等人工治理内容继续保留在现有代码中，自动任务不得改写。

## Release 接受规则

只有同时满足以下条件的 Release 才能进入官网：

1. `draft=false` 且 `prerelease=false`。
2. tag 可规范化为高于官网当前版本的 SemVer；相同或更旧版本保持零写入。
3. Release 来自配置锁定的仓库，附件名称只能匹配该产品的允许规则。
4. 每个必需平台附件都存在且大小为正数。
5. SHA-256 必须来自 GitHub Release asset 的 `digest=sha256:...` 或同一 Release 中经过严格解析的 `SHA256SUMS`；两者同时存在时必须一致。
6. 下载 URL 必须是锁定仓库、锁定 tag 下的 GitHub HTTPS Release URL。
7. 不允许自动新增未知平台、未知架构或删除官网当前支持的平台；此类变化需要人工设计确认。

任何规则失败均以非零状态结束，不提交、不推送、不部署。

## 组件与数据流

1. `.github/workflows/product-release-monitor.yml`
   - 每 15 分钟运行一次，也支持手动触发。
   - 权限最小化：`contents: write`；不使用仓库外密钥。
   - 安装锁定依赖后运行监控脚本。
   - 无更新时成功退出且不产生提交。
   - 有更新时运行 `npm run verify`，提交机器数据到当前 `main`，由 Cloudflare Git 集成部署。

2. `scripts/product-release-monitor.mjs`
   - 读取受版本控制的发行配置和当前发行数据。
   - 调用 GitHub REST API 获取每个仓库的最新正式 Release。
   - 校验版本、仓库、附件集合、URL、大小和 SHA-256。
   - 使用稳定排序和确定性 JSON 格式原子写入发行数据。
   - 支持注入 `fetch` 和临时根目录，便于无网络单元测试。

3. `src/products/releases.json`
   - 保存机器管理的发行事实。
   - `catalog.ts` 从此文件构造页面下载信息。
   - `scripts/seo-routes.mjs` 从此文件读取软件版本和 Release URL，消除重复版本维护。

4. 测试
   - 正式新版更新、无新版零写入。
   - Draft/Prerelease 被忽略。
   - 缺附件、未知附件、错误仓库 URL、缺失或冲突摘要全部失败关闭。
   - JSON 更新后现有产品目录、页面、SEO、下载统计和完整 `npm run verify` 保持通过。
   - 工作流测试确认定时频率、最小权限、无外部秘密、先验证后提交。

## 提交、部署与回滚

工作流只提交发行数据文件，提交信息包含产品和版本。GitHub Actions 自身先完成完整验证，随后 push 到 `main`；Cloudflare Pages 根据主分支提交部署。

若生产部署失败，代码提交仍可通过普通 revert 回滚到上一份发行数据。若线上下载资源后来不可用，监控任务失败并报告，不自动删除历史下载信息。

## 本地监控迁移

云端工作流合并后先手动运行一次，确认：

- 两个当前版本均判定为无更新；
- 工作流成功且未产生提交；
- 定时触发已启用。

完成上述验收后停用 Codex Studio 自动任务 `automation-11`，避免重复监控。

## 非目标

- 不执行百度、IndexNow 或其他搜索平台提交。
- 不自动发布上游产品 Release。
- 不自动支持新平台或改变人工风险提示。
- 不引入跨仓库 PAT、GitHub App 或新的外部服务。
