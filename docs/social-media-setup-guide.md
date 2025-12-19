# 社交媒体自动发布配置指南

本文档旨在指导如何配置 Make.com 与社交媒体平台的集成，特别是如何实现自定义发布来源（如显示“由 乐可开源 发布”而非“由 Make 发布”）。

## 一、Facebook 自定义发布来源配置

默认情况下，使用 Make.com 的 Facebook 模块发布贴文时，来源会显示为 "Make" 或 "Integromat"。为了提升品牌形象，我们需要创建自己的 Facebook App。

### 1. 创建 Facebook App
1. 访问 [Facebook for Developers](https://developers.facebook.com/) 并登录。
2. 点击 **"My Apps"** > **"Create App"**。
3. 选择 **"Business"** (商业) 类型，点击 Next。
4. **Display Name**：填写您希望显示的名称，例如 **"乐可开源"** 或 **"LekeOpen"**。
   > 这里填写的名字就是最终贴文上方显示的“由 XXX 发布”。
5. **App Contact Email**：填写联系邮箱。
6. 点击 **"Create App"**。

### 2. 配置 App 权限
1. 在 App Dashboard 中，找到 **"Add products to your app"**。
2. 找到 **"Facebook Login for Business"**，点击 **"Set up"**。
3. 在左侧菜单，进入 **Settings** > **Basic**。
   - 记录下 **App ID** 和 **App Secret**（稍后在 Make.com 中用到）。
   - 在 **App Domains** 中添加 `make.com` 和 `integromat.com`。
   - 填写 **Privacy Policy URL**（可以是官网首页）。
4. 在左侧菜单，进入 **Facebook Login for Business** > **Settings**。
   - 在 **Valid OAuth Redirect URIs** 中添加：
     - `https://www.integromat.com/oauth/cb/facebook-pages`
     - `https://www.make.com/oauth/cb/facebook-pages`
   - 保存更改。

### 3. 在 Make.com 中连接
1. 打开 Make.com Scenario。
2. 点击 Facebook Pages 模块。
3. 点击 Connection 旁边的 **"Add"** 按钮。
4. 点击 **"Show advanced settings"** (显示高级设置)。
5. 填入刚才获取的 **App ID** 和 **App Secret**。
6. 点击 Save，系统会弹窗跳转到 Facebook 进行授权。
7. 同意授权（确保选择您要管理的公共主页）。

**完成！** 以后通过此连接发布的贴文，来源将显示为“由 乐可开源 发布”。

---

## 二、多项目复用方案

如果您有多个项目（如 Project A, Project B）需要区分发布来源：

1. **重复上述步骤**：为每个项目在 Facebook Developers 创建一个独立的 App（App Name = 项目名称）。
2. **Make.com 配置**：
   - 在 Make.com 中创建多个 Connection，分别命名为 "Project A Conn", "Project B Conn"。
   - 每个 Connection 绑定对应的 App ID/Secret。
3. **使用**：
   - 当需要以 Project A 名义发布时，在模块中选择 "Project A Conn"。
   - 当需要以 Project B 名义发布时，选择 "Project B Conn"。

这相当于为您构建了一个**品牌中间件**层，灵活控制发布身份。

---

## 三、优化贴文内容（增加链接）

为了确保用户在正文中也能看到链接（不仅是底部卡片），建议调整 Make.com 的 **Post caption** 格式。

**推荐格式：**
```
{{1.title}}

{{1.description}}

🔗 阅读原文：{{1.link}}
```

**操作步骤：**
1. 点击 Facebook Pages 模块。
2. 在 **Post caption** 字段中，重新排版。
3. 确保从 RSS 模块的输出变量中拖入 `link` 字段。
4. 保存 Scenario。

---

## 四、常见问题

### 1. 为什么 HTTP 请求失败？
- **原因**：通常是因为目标平台（如微博、微信）的 API 需要特定的 Header、Token 或白名单 IP。
- **微博**：需要申请“微连接”开发者权限，获取 `access_token`。如果是未审核应用，可能只能发给测试账号。
- **微信**：公众号 API 需要 IP 白名单，且 Token 有效期仅 2 小时，需要专门的 Token 刷新机制（建议搭建中转服务或使用 Make.com 的 Data Store 存储 Token）。

### 2. RSS 更新不及时？
- Make.com 的 Free/Basic 套餐通常最短轮询间隔为 15 分钟。
- 可以手动点击 "Run once" 强制触发。
