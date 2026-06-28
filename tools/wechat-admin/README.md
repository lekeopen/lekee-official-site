# WeChat Admin

自用微信公众号管理工具。第一版聚焦多个公众号的自定义菜单管理，避免模拟登录公众号后台。

> 需要 Node.js 18+。本项目主应用本身也按 Node 18+ 运行。

## 能力

- 多公众号账号配置
- 从 `.env` 读取每个账号的 AppID/AppSecret
- 获取并缓存 `access_token`
- 查询公众号菜单
- 同步本地菜单配置到公众号
- 删除公众号菜单
- 维护关注回复和关键词回复文案配置
- 将公众号 Markdown 初稿渲染成可复制的 HTML/纯文本

## 配置账号

复制示例配置：

```bash
cp tools/wechat-admin/accounts.example.json tools/wechat-admin/accounts.local.json
```

`accounts.local.json` 可以配置多个公众号：

```json
{
  "accounts": {
    "lekeopen": {
      "name": "乐可开源",
      "type": "official_account",
      "appIdEnv": "WECHAT_LEKEOPEN_APP_ID",
      "appSecretEnv": "WECHAT_LEKEOPEN_APP_SECRET",
      "menuFile": "menus/lekeopen.json"
    }
  }
}
```

在 `.env` 中放真实密钥：

```env
WECHAT_LEKEOPEN_APP_ID=你的AppID
WECHAT_LEKEOPEN_APP_SECRET=你的AppSecret
```

## 命令

查看账号：

```bash
npm run wechat:accounts
```

预览本地菜单配置，不请求微信接口：

```bash
npm run wechat:menu:sync -- lekeopen --dry-run
```

同步菜单：

```bash
npm run wechat:menu:sync -- lekeopen
```

查询线上菜单：

```bash
npm run wechat:menu:get -- lekeopen
```

删除线上菜单：

```bash
npm run wechat:menu:delete -- lekeopen
```

渲染公众号文章初稿：

```bash
npm run wechat:article -- tools/wechat-admin/articles/2026-06-geogenius-wechat.md
```

创建公众号草稿：

```bash
npm run wechat:draft -- lekeopen tools/wechat-admin/articles/2026-06-geogenius-wechat.md --dry-run
npm run wechat:draft -- lekeopen tools/wechat-admin/articles/2026-06-geogenius-wechat.md
```

## 后续预留

工具内部已经按 `AccountStore`、`TokenStore`、`WechatClient` 的边界拆开。当前从本地 JSON 与 `.env` 读取账号，后续如果要做 SaaS，可以把账号来源替换为数据库和微信开放平台授权。

## 回复文案

回复文案放在：

```text
tools/wechat-admin/replies/lekeopen.json
```

当前用于人工复制到公众号后台，后续可以接入服务器消息事件后自动处理。

## 文章渲染

公众号文章初稿放在：

```text
tools/wechat-admin/articles/
```

渲染后会生成到：

```text
.wechat-admin-output/articles/
```

创建草稿会先把文章封面上传为永久素材，再调用公众号草稿箱接口。建议每次先 `--dry-run`，确认标题、摘要、正文链接无误后再创建。

如果创建草稿时返回 `48001 api unauthorized`，说明当前公众号没有素材/草稿接口权限。此时可继续使用 `wechat:article` 生成的 HTML/纯文本，在公众号后台或 135/96/秀米等编辑器中手动创建草稿。
