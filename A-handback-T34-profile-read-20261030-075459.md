# A 线交回：T34 ConfigEditor 预写入读取/组合契约

状态：`NOT_RUN / ROOT EXECUTION REQUIRED`

正式入口：`D:\Lawbeach\lawbench-coord\A-T34-profile-read-order-20261030-075459.md`

本交回只交付根审查器可执行的只读取证器。A 线没有执行 Node，没有把静态交付写成产品契约通过，也没有对原生 Settings.mutate 成功、失败或拒绝原因作新结论。

## 交付

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\`

| 新文件 | SHA-256 |
|---|---|
| `profile-read-contract.mjs` | `C18F5769A3A565FBA5D35E292D8905768D92F26BC50B7BAFEBE1F92E6669035E` |
| `literal-inputs.json` | `A1BB3B9FEFD0463BC0F782DEB3E6C23FE7AE6795463A2F633C0ECA9A9C3AF871` |
| `README.md` | `4DBADD03160AAA5F43476F459D314A586813E9466D437BADB96D04B6006F8C2A` |

正式交回：

`D:\Lawbeach\lawbench-coord\A-handback-T34-profile-read-20261030-075459.md`

没有新增或修改产品、测试、SDK、旧 served roots、raw formal、工单集或交付说明；没有创建 `交付说明.md`，因为正式执行令只授权上述三个证据文件和一个交回件。

## 契约实现

- `literal-inputs.json` 固定三份既有合成 profile、六份 package/patch pin 和四份 primary source pin。`mtime_ns` 以十进制字符串保存，避免 JavaScript 数值精度损失。
- 脚本先以自身固定常量逐字段拒绝输入元数据漂移，再校验六份 profile 文件的 bytes、SHA-256、纳秒 mtime 和三个 home patch 不存在。
- 所有四份 primary source 在动态导入前完成同一组 pin；只有 app-boot `lib/index.js` 在 pin 全部成立后以固定文件 URL 导入。
- 三案按 label 1、2、3 顺序，分别真实调用 `loadProfileDirectory('dsh', profile, installAnchor, {userLayer:false})`、`readProfilePatches('dsh', <固定普通参数对象>)`、`composeEntries([patches])`。
- 六份 profile 文件、四份 primary source 和 home patch 缺失条件在调用后再次校验；前后 pin 必须逐项一致。
- 成功输出固定为 `stage=PASS` 和三案 `stage=COMPOSE_OK`、三阶段 `PASS`、整数 counts 及目标行两个布尔值。目标配置只输出 `providers.external` 的布尔值，不序列化配置。
- 失败只输出 `stage=FAILED`、窄白名单 `errorName`/`errorCode`，并置退出码 1；不输出 message、reason、stack、路径、文件名、配置值或 secrets。
- 成功退出码 0 的硬门：三案均三阶段通过、每案 `layers=3`、`skipped=0`、`targetNamespaceCount=1`，且所有前后 pin/mtime/缺席条件成立。

`cwd` 和空 `startedBundles` 按令提供给 `readProfilePatches`，但三个指定导出不消费这两个字段；证据不把它们写成影响本次结果的输入。

## 根执行命令

从 `D:\Lawbeach\lawbench-A`、使用根批准的 Node 运行时和现有根过程包装器执行：

```powershell
node .\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs
```

根包装器负责 OS/网络/监听/process/worker 防护、私有环境、超时和 stdout 落盘。脚本不写结果文件；只读消费，不需 cleanup。

根判读时必须以真实退出码和 stdout 为准：退出 0 且输出 `stage=PASS` 才算通过；退出 1 只能记录固定的 `FAILED/errorName/errorCode`，不得从该元数据推断原因。

## A 线静态检查与计数

`authorRuntime=0`。A 线未调用 Node、Python、解析器、AST、产品 import、测试、build、GUI、HTTP、模型、SSH、DPAPI、环境密钥或产品函数。

| 项目 | 实际值 |
|---|---:|
| API 调用 | 0 |
| 实际 case 执行 | 0 |
| GUI / model / network / listener / process / worker 调用 | 0 |
| 设置写入 / 产品写入 | 0 |
| Git 写命令 | 0 |
| 新证据文件 | 3 |
| 新正式交回件 | 1 |

静态文本检查确认脚本只 import `node:fs`、`node:crypto`、`node:url`、`node:assert/strict`，只调用三个指定导出；未发现 `writeFileAtomic`、`withFileLock`、`reconcileProfilePatches`、`runProfile`、`boot`、Context、Agent、credentials、网络、监听、child process 或 worker 入口。因 A 线不运行 Node，未执行 `node --check`，正式运行时由根完成首次语法和契约执行裁决。

## 状态与阻碍

- Git 全程只读，未执行 add/commit/rebase/stash/reset/clean/checkout/push。Git SHA 不适用。
- 根级 `git status` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而无法完成子模块状态；没有修权限、拆锁或扩权。既有 dirty 保持原样。
- 一次静态 `rg` 命令误落到不可用的 MSIX Bash 入口，被 MXC 拒绝，命令未执行、无状态变化；随后改用显式 PowerShell 原生 `Select-String` 完成同一只读检查。
- 当前 PID 是本任务唯一 writer；没有启动第二 writer，也没有联系其他聊天、安装、换 API、改沙箱/审批/ACL 或切 legacy。

剩余动作仅根审查器执行一次有界只读 API 取证并消费结果。
