# 生产环境配置指南

## EmailJS 环境变量配置

生产环境的联系表单功能需要配置 EmailJS 环境变量。请在您的部署平台添加以下环境变量：

### 需要配置的环境变量

```
VITE_EMAILJS_SERVICE_ID=您的EmailJS服务ID
VITE_EMAILJS_TEMPLATE_ID=您的EmailJS模板ID
VITE_EMAILJS_PUBLIC_KEY=您的EmailJS公钥
```

### 获取 EmailJS 配置信息

1. 访问 [EmailJS 官网](https://www.emailjs.com/)
2. 注册/登录账号
3. 创建 Email Service（获取 Service ID）
4. 创建 Email Template（获取 Template ID）
5. 在 Account > General 中获取 Public Key

### 在不同部署平台配置环境变量

#### Vercel

1. 进入项目的 Settings > Environment Variables
2. 添加上述三个环境变量
3. 选择适用环境（Production, Preview, Development）
4. 保存后重新部署

#### Netlify

1. 进入 Site settings > Build & deploy > Environment
2. 点击 Edit variables
3. 添加上述三个环境变量
4. 保存后触发新的部署

#### Cloudflare Pages

1. 进入项目的 Settings > Environment Variables
2. 添加环境变量（Production 和 Preview）
3. 保存后重新部署

#### 自建服务器（Nginx/Apache）

如果使用自建服务器部署：

1. 在构建时设置环境变量：
```bash
export VITE_EMAILJS_SERVICE_ID=your_service_id
export VITE_EMAILJS_TEMPLATE_ID=your_template_id
export VITE_EMAILJS_PUBLIC_KEY=your_public_key
npm run build
```

2. 或者在构建脚本中添加：
```bash
VITE_EMAILJS_SERVICE_ID=xxx VITE_EMAILJS_TEMPLATE_ID=xxx VITE_EMAILJS_PUBLIC_KEY=xxx npm run build
```

### 验证配置

配置完成后：

1. 重新部署应用
2. 访问生产环境的「联系我们」页面
3. 尝试发送测试消息
4. 确认没有「缺少 EmailJS 环境变量」的错误提示

### 注意事项

- ℹ️ `VITE_EMAILJS_SERVICE_ID`、`VITE_EMAILJS_TEMPLATE_ID` 和 `VITE_EMAILJS_PUBLIC_KEY` 会进入浏览器构建产物，它们是 EmailJS 设计为客户端使用的公开标识，不是服务端秘密
- ⚠️ **不要**在这些变量或任何 `VITE_*` 变量中放置私钥、服务端 Token 或其他敏感凭据
- ✅ `.env` 文件已在 `.gitignore` 中，本地开发安全
- ✅ 生产环境必须通过部署平台的环境变量配置功能设置
- ✅ 环境变量更新后需要重新构建和部署才能生效

### 发布前质量检查

在 `develop` 分支运行：

```bash
npm run verify
```

GitHub Actions 会在 Pull Request 及 `develop`、`main` 推送时运行相同门禁。部署后应在生产「联系我们」页面执行一次表单冒烟测试；文档不记录环境变量的实际值或假定某个部署环境已配置。
