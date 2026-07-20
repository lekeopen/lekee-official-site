# 乐可开源官网技术架构

## 1. 当前架构

官网是 React + TypeScript + Vite 构建的静态优先网站，不包含自建后端、数据库或公开 API。

- **界面**：React 18、React Router、Tailwind CSS、Framer Motion；
- **内容**：`content/news` 和 `content/projects` 中的 Markdown；
- **内容加载**：`src/lib/content.ts` 使用 `import.meta.glob` 在构建时载入内容；
- **内容质量**：`scripts/validate-content.mjs` 在测试和构建前校验 Markdown frontmatter；
- **联系表单**：浏览器直接调用 EmailJS；
- **SEO**：页面运行时 Meta 与构建后的路由级 HTML 预渲染；
- **订阅与分发**：构建时生成 `public/rss.xml` 和 `publish-queue.json`；
- **微信管理工具**：`tools/wechat-admin` 是本地 CLI，不属于官网运行时。

## 2. 运行与构建流程

```text
Markdown / React 源码
        ↓
内容校验、自动测试、TypeScript 与 ESLint
        ↓
RSS 与发布队列生成
        ↓
TypeScript 编译检查
        ↓
Vite 静态构建
        ↓
路由级 SEO HTML 预渲染
        ↓
dist 生产产物
```

统一质量门禁为 `npm run verify`，它会执行内容校验、自动测试、TypeScript、ESLint 和完整生产构建。单独构建命令为 `npm run build`。构建产物位于 `dist/`，其中包含静态页面、客户端资源以及新闻和项目详情的预渲染入口。

`.github/workflows/quality.yml` 在所有 Pull Request 以及 `develop`、`main` 推送时使用 Node 20、`npm ci` 和同一条 `npm run verify`，避免本地与 CI 门禁漂移。

## 3. 路由

- `/`：首页；
- `/services`：能力与服务；
- `/products`：产品与项目；
- `/solutions`：解决方案；
- `/about`：关于我们；
- `/contact`：联系我们；
- `/news`、`/news/:id`：动态列表与详情；
- `/projects/:id`：项目详情；
- `/privacy`：隐私政策；
- `/rss.xml`：RSS 订阅源。

## 4. 配置与安全边界

生产联系表单依赖 `VITE_EMAILJS_SERVICE_ID`、`VITE_EMAILJS_TEMPLATE_ID` 和 `VITE_EMAILJS_PUBLIC_KEY`。这些值会进入浏览器构建产物，只能使用 EmailJS 设计为公开使用的标识，不得放入私钥、服务端 Token 或其他敏感凭据。地图入口使用普通高德地图 URI，不需要 API Key。

## 5. 发布与回滚

- 所有修改先进入 `develop`；
- `develop` 本地运行 `npm run verify`；
- GitHub Actions `quality` 检查通过；
- `develop` 合并到 `main`；
- 推送 `main` 触发生产部署；
- 回滚时优先回退到上一条已验证的 `main` 提交并重新部署，不直接修改生产产物。

## 6. 后续演进

V1.1 已建立统一验证命令、Markdown 内容校验、持续集成和文档治理。除非出现明确业务需求，不引入 CMS、数据库、自建 API 或新的运行时服务。
