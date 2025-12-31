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

- ⚠️ **不要**将真实的 EmailJS 配置信息提交到 Git 仓库
- ✅ `.env` 文件已在 `.gitignore` 中，本地开发安全
- ✅ 生产环境必须通过部署平台的环境变量配置功能设置
- ✅ 环境变量更新后需要重新构建和部署才能生效

### 当前状态

- ✅ 本地开发环境：已配置（通过 .env 文件）
- ❌ 生产环境：**待配置**（需要在部署平台添加环境变量）

---

**配置完成后，请删除此文档或将其移至 `docs/` 目录。**
