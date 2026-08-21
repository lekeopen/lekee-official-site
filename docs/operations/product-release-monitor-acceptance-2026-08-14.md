# 产品 Release 自动分发验收记录（2026-08-14）

## 结论

状态：**通过（PASS）**。

`Product release monitor` 工作流处于 `active`，默认分支上的计划表达式为 `*/15 * * * *`。运行 `31769423218` 于 2026-08-14 12:17（Asia/Shanghai）由 `schedule` 自然触发，在修复合并提交 `22b7f7fb5b9df75005fc706937b3d98f6ae564e3` 上于 12:18 成功完成，满足自然调度验收门槛。

## 已有功能证据

- 工作流：`Product release monitor`
- 工作流状态：`active`
- 计划：每 15 分钟一次；GitHub Actions 实际触发允许延迟
- 修复后自然运行：`31769423218`，2026-08-14 12:17（Asia/Shanghai），成功；使用修复合并提交 `22b7f7fb5b9df75005fc706937b3d98f6ae564e3`
- 修复前自然运行：`31762386658`，2026-08-14 10:00（Asia/Shanghai），失败；使用提交 `9d9d9593f2ec78eab009c23f69be5276363d35ee`
- 修复后的真实执行：`31763135351`，2026-08-14 10:14（Asia/Shanghai），`workflow_dispatch`，成功；使用提交 `c1e666e0d993fd1fe2764984d0ed372b003d3cb4`

成功自然运行对当前四个正式对象的结果：

| 产品 | 对象路径 | 结果 |
| --- | --- | --- |
| 乐可点名 | `leke-picker/1.1.0/leke-picker_1.1.0_x64-setup.exe` | `verified-existing` |
| 乐可点名 | `leke-picker/1.1.0/leke-picker-Win7-x64-Offline.exe` | `verified-existing` |
| 乐可点名 | `leke-picker/1.1.0/leke-picker-Win7-x86-Offline.exe` | `verified-existing` |
| 归个类 | `guigelei/1.6.0/guigelei-1.6.0-arm64.dmg` | `verified-existing` |

该运行同时确认正式 Release 数据无变化，四个固定版本对象均完成校验，未触发发布数据提交。

## 通过门槛

在修复合并后观察到至少一次 `event=schedule`、`conclusion=success` 的运行，并确认日志中：

1. 正式 Release 检查成功；
2. 四个当前对象均为 `verified-existing`（或严格校验后首次 `uploaded`）；
3. 未发生非预期源码改动；
4. 未泄露凭据或临时签名 URL。

本次四项门槛均已满足。后续仍应保留失败关闭策略：任何 Release 校验、OSS 回读、完整验证或提交范围异常均不得发布新版本数据。
