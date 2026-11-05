# A 线交回：T30 GUI 最终观察器静态修正

状态：`AUTHOR_RUNTIME_ZERO / STATIC_CHANGED_NOT_RUN / ROOT_FULL_AUDIT_AND_FIRST_GUI_REQUIRED`

执行令：
`D:\Lawbeach\lawbench-coord\A-T30-GUI-final-observer-order-20261028-103604.md`

正式证据：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-final-observer-20261028-103604.md`

## 结果

已按令完成最终观察器最小修正。既有 `103405` 状态已核对：prepared/admission
存在，尚无 started/ready/final/loop/run-error；最终 `case` 只剩父日志、子日志和
`case.db`，复制前的 `case.db-shm`、`case.db-wal` 已自然消失，两份日志与
`case.db` 的 bytes/SHA 已只读取证。没有重演 prepare/admission 或旧 T30 admission。

最终身份：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 48,554 | `c68a8155b6b3d843605849f18e060ef7d663f43bd7dab0ba4e6a3247e9e9e1ba` |
| `start.ps1` | 74,131 | `627ed8bf61240479e9d0f5e8a4e4279890f2e44269e7328683016d2a3d44fb35` |
| `README.md` | 10,989 | `73a952925692b163c2ddb8889a8e79a46a8e92784b6638f7e0d198a988741b7d` |

`start.ps1` 从输入到最终只有同一个 hunk 的 `$NativeEntryBytes` 与
`$NativeEntrySha256` 两行变化，且精确匹配最终 `entry.py`：
`48554 / c68a8155b6b3d843605849f18e060ef7d663f43bd7dab0ba4e6a3247e9e9e1ba`。

## 已修正口径

- 父 JSONL 与 `case.db` 是最终必需项；父日志固定身份，`case.db` 记录实际
  前后 bytes/SHA。
- 子 JSONL 仍只允许固定身份，或完整子会话记录目录不存在；部分文件、目录仍在但
  文件缺失、字节变化或其他会话均失败，原 pending-root/OS-recycle 语义保留。
- `case.db-shm`、`case.db-wal` 为可选生命期文件；存在时按普通文件记录实际
  bytes/SHA，缺席时明确记录 absent/changed 和 `null` 后置哈希，不伪造相等。
- 最终 `case.db` 元数据只经 SQLite `mode=ro`、`query_only` 读取，要求原 case ID
  与 schema `1`；没有调用 `CaseRegistry` 或打开写连接。
- 只额外接受两个固定会话 ID 的
  `工作区/会话缓存/<session-id>.json`，记录实际存在性/bytes/SHA 并固定标记
  `acceptanceProof:false`；无 glob、临时缓存或 synthetic cache。其他文件失败。
- 未改 `EXPECTED_FILES`、prepare/stop、准入、prepared、旧正式材料、源案件、日志、
  `_serve`、路由、守卫、清理、产品、测试或 runtime。`prepare.ps1`、`stop.ps1`、
  `交付说明.md`、`root-static-fix-20261028-102456.md` 与协调输入逐字节相同。

## 验证边界

作者运行时为 0：没有执行 Python、Node、parser、AST、测试、prepare、admit、
serve、probe、HTTP、模型、Key、SSH、GUI、build 或 selftest。只做了原生
PowerShell 静态读取、只读 Git diff/status、bytes/SHA、源案件与 `103405` 现场
核对。没有 GUI、删除、停止、release、trash 或回收站操作。

因此本轮不宣称语法执行通过、服务通过、GUI PASS、USB PASS、整 T30 PASS 或
打包通过。根侧仍需完整审计累计 source/delta/raw/finally/pins，再使用既有
UNSERVED prepared + registered run 做首次 GUI；实际删除确认仍走真人门。

## Git、dirty 与阻碍

Git 严格只读：没有 add/commit/rebase/stash/reset/clean/checkout/push、暂存、
锁修复或扩权。工作树原本大量 dirty 未动。普通根级 `git status` 仍因共享
`dsh` submodule worktree 权限拒绝而退出 1；随后用
`--ignore-submodules=all` 成功保全核对，未修权限。

执行中的非零均已在正式证据记录逐条列明：一次 Bash shell 字段误配在 managed
runner 执行前拒绝（同类另一次），三次 PowerShell 解析错误未写文件，一次目录当
文件读取失败，一次工具参数重复未启动命令；四次 `git diff --no-index` 因存在
预期差异正常退出 1。没有 setup/legacy 启动、权限/审批/ACL/锁变化或产品执行。

本交回后停止，不进行 Git 提交。`GUI_PASS=false`、`USB_PASS=false`、
`whole_T30_PASS=false`、`Packaging=HOLD`。
