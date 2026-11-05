# A 线交回：T31 checkpoint surfaceOp 字段层级修正

时间：2026-10-28 12:08:23（Asia/Taipei）

状态：`READY_FOR_ROOT_AUDIT_NOT_PASS`

## 交回结论

已按执行令完成有界修正。`verifyCommittedCompaction` 现在从同一 checkpoint 事件的顶层读取 `surfaceOp`，同时保留 `checkpoint.data.source.compactionId` 关联和原有三类表面操作断言。没有修改产品源码、其他测试、配置或运行路径。

该结果只修正真实压缩后的观察断言，不代表真实压缩、fork、模型、GUI 或 T31 项目通过。打包仍为 `HOLD`。

## 精确变更

唯一修改文件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts`

- 修改前：72,524 字节，SHA-256 `72130abd6e6e71d87fc56e17db262d75c693d36cbc5716336ff9cbfefa7c3aff`。
- 修改后：72,543 字节，SHA-256 `cd7e1a4e3ac19574fa99fb002501a8ab63a43f319f35812c8f5fa26b4f940b51`。
- 文件实际增量仅 19 字节。
- 修改位置为 `verifyCommittedCompaction` 内的 `checkpointData` 类型和同级局部观察 `checkpointSurfaceOp`。
- `checkpointData.source?.compactionId !== result.compactionId` 保持不变。
- `checkpointSurfaceOp?.op !== 'replace'`、`startSeq` 和 `endSeq` 对 `result.shadowedRange` 的比较保持不变。
- 没有顶层/data fallback，没有局部 schema 增添 data 层 `surfaceOp` 字段，没有放宽断言。

## 源码证明与冻结边界

- 复用主编排已确认的静态事实：生产端将用户/消息数据作为第二个参数、将顶层 `surfaceOp` 作为第三个元数据参数写入；会话事件接口声明顶层 `surfaceOp`。本次未重跑该静态调研。
- 修改前 `NativeEvent` 已存在 `readonly surfaceOp?: unknown`，该接口没有改动。
- `verifyCommittedCompaction` 函数外前缀修改前后 SHA-256 均为 `37d67fe73d05d3cce042200191e26d5a7e1952c3d20efcd05a31d0b58cc588b8`。
- 函数外后缀修改前后 SHA-256 均为 `f2cc12c69a14e6d812ddcc1177750a4dc1bd76fb31db92c5f92d18d9819c0d7f`。
- 修改后函数 SHA-256 为 `902102230865f69ee0ebf3a85583c5e21a627e8cedc8bf10f291a34cd3e470ab`。
- 函数外字节完全一致，覆盖 main、setup、transport、credential、copy、persistence、finally、prompts、MAX256、counts、pins、7-source/46-fixed、README、旧 formal/product/config/SDK/lib/runtime/tests 等冻结范围。
- 没有新增 consumer、framework、测试、fake event、history、R 文件或 model message。

## 静态检查

只在目标函数文本上做字符串级检查：

- 顶层读取：通过。
- data/source 压缩关联：通过。
- `replace` 比较：通过。
- 起止区间比较：通过。
- 错误嵌套读取 `checkpointData.surfaceOp`：不存在。
- `surfaceOp` fallback：不存在。
- 修改后 LF 行尾保持，CRLF 数为 0。

未运行 Python、Node、parser、AST、tsc、测试、prepare、probe、HTTP、model、Key、SSH、GUI、build 或 import execution。模型请求数 0，运行时产品请求数 0。

## 实际 Shell 命令

全部通过执行令指定的原生 PowerShell 运行，`login=false`。截至本交回件创建前共 14 次 Shell 命令：13 次退出 0，1 次退出 1。

| # | 实际命令用途 | 退出码 |
|---|---|---:|
| 1 | `Get-Content -Raw` 完整读取正式执行令 | 0 |
| 2 | `git status --short --branch` | 1 |
| 3 | `Get-FileHash -Algorithm SHA256` 核对修改前目标文件 | 0 |
| 4 | `Select-String` 读取函数及字段上下文 | 0 |
| 5 | `git --no-optional-locks status --short --ignore-submodules=all` | 0 |
| 6 | `[IO.File]::ReadAllBytes` 统计修改前字节及行尾 | 0 |
| 7 | `Get-Content` 读取修改前关键行 | 0 |
| 8 | `git --no-optional-locks ls-files --stage -- <target>` | 0 |
| 9 | .NET SHA256 计算修改前函数外前缀/后缀哈希 | 0 |
| 10 | `Get-Content` 读取纠正后关键行 | 0 |
| 11 | .NET SHA256 计算修改后整文件、函数和函数外哈希 | 0 |
| 12 | `Get-Content` 复核修改后函数片段 | 0 |
| 13 | PowerShell 字符串检查顶层读取、关联、区间和禁止 fallback | 0 |
| 14 | `Test-Path` 确认两个交回文件在创建前不存在 | 0 |

## 非零阻碍

命令 2 的完整 `git status` 在读取 `dsh` 子模块时返回：

`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`

按令没有修复权限、锁、沙箱或审批，也没有尝试 Git 写操作。命令 5 使用忽略子模块的只读状态成功识别主工作树脏面。

## 写入面与 Git 纪律

- 使用两次 `apply_patch` 修改目标 `.mts`。第一次函数内局部结构写错，第二次在验证前立即纠正；最终版本已完成上述静态复核。
- 新增根因备注：

  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\root-checkpoint-surface-field-20261028-120823.md`

- 新增本交回件：

  `D:\Lawbeach\lawbench-coord\A-handback-T31-checkpoint-surface-field-20261028-120823.md`

- 未创建临时文件。
- Git 只使用 `status` 和 `ls-files` 读取；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 既有 dirty 内容全部保留，没有清理或改写。

请主编排审计最终 delta 和累计源码/命令/清理状态后，再决定有限准入与实际最多 2 次 POST 运行。
