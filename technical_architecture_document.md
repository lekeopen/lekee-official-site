# 技术架构文档 - 天水乐可信息技术有限公司官网骨架

## 1. 技术栈
- **核心框架**：React + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **路由管理**：React Router (推荐)
- **图标库**：Lucide React 或 Heroicons (推荐)

## 2. 项目结构设计
```
/src
  /assets         # 静态资源
  /components     # 公共组件
    /common       # 通用UI组件 (Button, Card, Input)
    /layout       # 布局组件 (Header, Footer)
    /sections     # 页面特定区块
  /data           # 占位数据 (JSON/TS文件)
  /layouts        # 页面布局模板 (MainLayout)
  /pages          # 页面组件
    Home.tsx
    Services.tsx
    Products.tsx
    Solutions.tsx
    About.tsx
    Contact.tsx
  /styles         # 全局样式
  App.tsx         # 路由配置
  main.tsx        # 入口文件
```

## 3. 关键技术实现

### 3.1 路由配置
使用 `react-router-dom` 配置以下路由：
- `/` - 首页
- `/services` - 能力与服务
- `/products` - 产品与项目
- `/solutions` - 解决方案
- `/about` - 关于我们
- `/contact` - 联系我们

### 3.2 组件化策略
- **UI 组件**：尽可能原子化，使用 Tailwind 类名控制样式。
- **布局组件**：`MainLayout` 包含导航栏（Header）和页脚（Footer），包裹所有页面内容。
- **数据驱动**：页面内容（如卡片列表、服务列表）应从 `/data` 目录下的常量文件中读取，方便后续替换为 API 数据。

### 3.3 样式规范
- 使用 Tailwind CSS 工具类。
- 定义一套基础颜色和字体变量（在 `tailwind.config.js` 中配置）。
- 响应式断点遵循 Tailwind 默认标准 (sm, md, lg, xl)。

### 3.4 占位内容策略
- 文本：使用 "Lorem ipsum..." 或具描述性的中文占位符（如“此处填写服务详情...”）。
- 图片：使用灰色背景 `div` 或 `https://placehold.co` 服务。
