# 待解决问题记录 (Pending Tasks)

## 1. Facebook 自动发布配置 (Facebook Auto-Publish Setup)

### 当前状态
- **App 类型**: 商务 (Business) - 已正确配置。
- **App 模式**: 开发中 (In Development)。
- **连接状态**: OAuth URI 已配置，Make.com 连接理论上已通。

### 遗留问题
**无法切换到上线模式 (Live Mode)**
- **原因**: Meta 要求 `public_profile` 权限必须获得“高级访问权 (Advanced Access)”才能上线。
- **报错信息**: "这款应用暂时无法切换为上线模式，因为数据访问权限更新评估未完成。"
- **所需行动**: 需要填写并提交 Meta 的“数据处理问卷 (Data Use Checkup)”和“应用审核说明”。

### 解决方案/建议
- **短期 (当前方案)**: **保持开发模式**。
    - 作为 App 管理员，在开发模式下自动拥有高级权限。
    - Make.com 连接时请使用管理员的 Facebook 账号。
    - 只要不涉及外部用户登录，此模式完全满足自动发帖需求。
- **长期**: 如果必须上线（例如 Make.com 连接失效或策略变更），需要花时间完成 Meta 后台的所有合规性问卷。

---

## 2. 自动化流程验证 (Automation Verification)

### 待办事项
- [ ] 在 Make.com 中完成 Facebook 节点的最终连接测试。
- [ ] 发布一篇真实的测试文章，观察 RSS 是否更新，以及 Make.com 是否成功抓取并发布到 Facebook Page。
- [ ] 确认发布的帖子是否正确显示了“由 乐可开源 发布”。

---

## 3. 网站优化 (Site Optimization)

### 已完成
- [x] 首页扁平化与科技感重构 (TechBackground, Framer Motion)。
- [x] 移除 Footer 中的 LinkedIn 图标。
- [x] 优化 CTA 区域与 Footer 的视觉连接（消除白边，区分层级）。
- [x] 项目状态可视化增强：引入"Live"雷达脉冲指示灯。
- [x] 项目列表交互优化：实现全区域点击与悬停动效。
- [x] 乐教库正式上线动态发布。
- [x] 站内外链接区分：站内链接不打开新窗口，站外链接使用 target="_blank"。
- [x] Footer 快速导航优化：添加公司动态链接，调整关于我们位置。
- [x] Markdown 内容链接自动处理：NewsDetail 和 ProjectDetail 页面支持自动区分站内外链接。

### 潜在优化点
- **移动端适配**: 检查新版首页动画在手机端的性能表现。
- **SEO**: 持续监控新页面的 SEO 表现。
