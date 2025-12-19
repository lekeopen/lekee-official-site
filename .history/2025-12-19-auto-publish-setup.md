# 自动发布系统配置记录

**日期：** 2025-12-19  
**任务：** 实现官网内容自动同步到社交媒体平台

---

## 一、项目初始化

### 1. 环境检查与升级
- **问题：** 项目需要 Node.js 20+，当前使用 v12.16.1
- **解决：** 升级到 Node 20 并清空依赖重装
  ```bash
  nvm use 20
  rm -rf node_modules package-lock.json
  npm install
  ```

### 2. 品牌统一优化
- 对外品牌统一为「乐可开源」
- 法律主体保留「天水乐可信息技术有限公司」
- 修改文件：
  - `index.html`：title 改为"乐可开源 | AI 与工程实践"
  - `Home.tsx`：Hero 区主标题
  - `Footer.tsx`：品牌展示
  - `README.md`：项目介绍
  - RSS feed 标题

### 3. SEO 优化
- 创建 `SEOMeta` 组件统一管理 meta 标签
- 支持 OpenGraph 和 Twitter Card
- 所有页面自动生成社交分享 meta
- 默认封面图：`/og-default.png`

### 4. 版本管理
- 打 Tag：`site-v1.0`
- 发布动态：`2025-12-19-brand-seo-optimization.md`

---

## 二、发布队列功能实现

### 1. 需求
- 扫描 `/content/news` 下的 Markdown 文件
- 解析 frontmatter，筛选 `publish: true` 的文章
- 生成 `publish-queue.json` 文件
- 支持幂等操作，已发布的文章不重复加入

### 2. 实现
**创建脚本：** `scripts/generate-publish-queue.js`

**核心逻辑：**
```javascript
// 仅处理 publish: true 的文章
if (data.publish !== true) return;

// 检查已存在且状态不是 pending 的文章
const existing = existingMap.get(slug);
if (existing && existing.status !== 'pending') {
  newItems.push(existing);
  return;
}

// 新文章统一 status = pending
newItems.push({
  slug,
  title: data.title || slug,
  date: data.date || new Date().toISOString().split('T')[0],
  summary: data.summary || '',
  channels: ['wechat', 'github'],
  status: 'pending'
});
```

**添加 npm 脚本：**
```json
{
  "scripts": {
    "publish:queue": "node --loader ts-node/esm scripts/generate-publish-queue.js",
    "build": "tsc -b && vite build && npm run build:rss && npm run publish:queue"
  }
}
```

**依赖：**
```bash
npm install gray-matter
```

---

## 三、Make.com 自动化配置

### 1. RSS 触发器
- **模块：** RSS > Watch RSS feed items
- **URL：** `https://lekeopen.com/rss.xml`
- **检查频率：** 每 15 分钟
- **返回条数：** 5

### 2. Facebook 发布
- **模块：** Facebook Pages > Create a Page Post
- **授权：** Facebook 账号
- **内容格式：**
  ```
  {{1.title}}
  
  {{1.description}}
  
  阅读全文：{{1.link}}
  ```

### 3. 微博发布（待审核）
- **模块：** HTTP > Make a request
- **URL：** `https://api.weibo.com/2/statuses/share.json`
- **认证：** No auth（access_token 通过 Query String 传递）
- **参数：**
  ```
  status: {{1.title}} {{1.link}}
  ```
- **状态：** 应用审核中

### 4. 邮件通知
- **模块：** Tools > SMTP
- **服务器：** 阿里云邮局
  - Host: `smtp.mxhichina.com`
  - Port: `465`
  - SSL: Yes
- **内容：**
  ```
  主题：【新文章发布】{{1.title}}
  
  内容：
  新文章已发布，请手动同步到微信公众号：
  
  标题：{{1.title}}
  摘要：{{1.description}}
  链接：{{1.link}}
  
  ---
  来自乐可开源官网自动通知
  ```

### 5. 微信公众号（草稿箱方案）
- **API：** `POST https://api.weixin.qq.com/cgi-bin/draft/add`
- **方案：** 邮件通知 + 手动发布
- **原因：** 公众号 API 不支持直接发布图文，只能保存草稿
- **待完善：**
  - 获取 AppID 和 AppSecret
  - 获取 access_token
  - 上传封面图获取 thumb_media_id

---

## 四、工作流程

### 自动化流程
1. 编辑 Markdown 文章，添加 `publish: true`
2. 运行 `npm run build`（自动生成 RSS + 发布队列）
3. 提交代码并部署到生产环境
4. Make.com 每 15 分钟检查 RSS
5. 检测到新文章 → 自动发布到 Facebook
6. 发送邮件通知
7. 微博审核通过后自动发布（待完成）
8. 手动同步到微信公众号

### Git 工作流
- 开发分支：`develop`
- 主分支：`main`
- 修改完成后自动切换回 `develop`
- 合并到 `main` 后推送触发部署

---

## 五、文件变更记录

### 新增文件
- `scripts/generate-publish-queue.js` - 发布队列生成脚本
- `publish-queue.json` - 发布队列数据
- `src/components/common/SEOMeta.tsx` - SEO meta 标签组件
- `public/og-default.png` - 默认 OG 图片

### 修改文件
- `package.json` - 添加 `publish:queue` 脚本
- `content/news/2025-12-19-brand-seo-optimization.md` - 添加 `publish: true`
- 所有页面文件 - 集成 SEOMeta 组件

---

## 六、待完成事项

1. **微博集成**
   - 等待应用审核通过
   - 获取 access_token
   - 配置 Make.com HTTP 模块

2. **微信公众号自动化**
   - 获取公众号 AppID/AppSecret
   - 实现草稿箱 API 调用
   - 上传默认封面图

3. **默认 OG 图片**
   - 设计尺寸：1200x630px
   - 替换当前占位图

4. **测试验证**
   - 部署完成后测试完整流程
   - 验证 Facebook 自动发布
   - 验证邮件通知

---

## 七、技术要点

### 1. RSS 生成
```bash
npm run build:rss
# 生成 public/rss.xml
```

### 2. 发布队列生成
```bash
npm run publish:queue
# 生成 publish-queue.json
```

### 3. frontmatter 字段
```yaml
---
title: 文章标题
date: '2025-12-19'
category: Site Update
status: published
publish: true  # 标记为需要自动发布
summary: 文章摘要
cover: /og-default.png
---
```

### 4. Make.com Scenario 结构
```
RSS Trigger (15min)
  ↓
Facebook Post
  ↓
SMTP Email
  ↓
(待接入) Weibo API
  ↓
(待接入) WeChat Draft API
```

---

## 八、配置清单

### Make.com
- ✅ RSS 触发器
- ✅ Facebook 集成
- ✅ 邮件通知（阿里云邮局）
- ⏳ 微博集成（审核中）
- 🔲 微信公众号集成

### 代码仓库
- ✅ 发布队列脚本
- ✅ SEO meta 组件
- ✅ RSS 生成
- ✅ 构建流程集成
- ✅ Git Tag 管理

### 部署环境
- ✅ RSS feed 可访问
- ✅ OG 图片部署
- ⏳ 自动部署触发（待验证）

---

**最后更新：** 2025-12-19 22:35
