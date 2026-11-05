# A 线交回：T30 GUI 静态修正

状态：`STATIC_FIX_COMPLETE_FOR_ROOT_REVIEW / AUTHOR_RUNTIME_ZERO / ROOT_NOT_RUN`

执行令：
`D:\Lawbeach\lawbench-coord\A-T30-GUI-static-fix-order-20261028-102456.md`

仓库静态修正记录（含 C01-C38 全部实际 shell 命令、非零项与 W1-W8 写面）：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-static-fix-20261028-102456.md`

该记录最终身份：15,809 bytes /
`67396ce216f481c830b6e07396ffdecee7fac4e51ef00270c1348e9f7f832e11`。

## 修正结果

| 文件 | 最终字节 | 最终 SHA-256 |
| --- | ---: | --- |
| `entry.py` | 45,298 | `32d4cf19d8929c13c4023755494209dd4ce1cdbc17e8edfb2f760d77768a8345` |
| `start.ps1` | 74,131 | `efd043e99964c29463c9ede500a61b6e6fe598502349598838a038051328a18b` |
| `README.md` | 10,158 | `0751116e9c84d51cfbd89ddb32bc5c2b9294a269e76e79efc45893efe4880c7e` |

已完成四项窄幅静态修正：

1. 源案件和目标案件的树遍历、`stat`、SHA 读写走仅限本地盘号的
   `\\?\D:\...` 扩展别名；证据相对路径和普通 canonical 路径保持不变。两条真实
   JSONL 路径长度为 279/307 字符。
2. 冻结安全基座的虚拟兼容文件加入 `T30` 层级，使其 `parents[4]` 精确回到
   `D:\Lawbeach\lawbench-B`。冻结基座未改。
3. POST 重放闭包在重绑前捕获原始 `receive`，后续读取不再递归；鉴权、body 和
   响应上限、两次 POST 上限及路由白名单未改。
4. 最终观察严格要求源案件 5 文件、父 JSONL、固定目标文件清单和会话目录清单；
   子 JSONL 只能保持固定身份，或子会话目录整体不存在。子缺席写
   `CHILD_DIRECTORY_ABSENT_PENDING_ROOT_GUI_AND_OS_RECYCLE_PROOF` 且
   `targetLogsUnchanged:false`；三个 SQLite 文件记录实际前后 bytes/SHA。最终
   outcome 仍仅为 `*_FOR_ROOT_REVIEW`，并明确不是删除、回收站或 GUI PASS。

`start.ps1` 只改动 `$NativeEntryBytes` 与 `$NativeEntrySha256` 两个字面量，且与
`entry.py` 最终身份一致。`README.md` 只补充最终观察口径。`prepare.ps1`、
`stop.ps1`、`交付说明.md`、产品、runtime、config、guard、输入和原始案卷均未改。

## 静态与运行边界

- 没有创建 `runs`，`RUNS_EXIST=False`。
- 没有运行 prepare/admit/serve/probe/GUI/HTTP/model/OCR/Python/Node/tsx/parser/
  AST/Vitest/tsc/pytest/collect/build/selftest 或删除。
- 没有启动 setup、未切换 legacy、未改沙箱/审批/ACL、未拆 writer 锁。
- 本运行器 author runtime 为 0；根侧实际运行仍为 `NOT_RUN`。因此本交回不宣称
  语法执行、准入、服务、GUI、删除、回收站或 T30 通过。
- `GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
  `Packaging=HOLD`。

## Git 与 dirty

Git 严格只读，没有 add/commit/rebase/stash/reset/clean/checkout/push，也没有处理
index.lock、权限、审批或锁。首次 `git status --short` 因既存 submodule `dsh`
worktree 权限拒绝而退出 1；随后
`git status --short --ignore-submodules=all` 只读确认工作树原本大量 dirty，所有
既存 dirty 内容均保留。该 submodule 权限不是本次修复交付阻碍。

## 非零项与写面

- C02：`git status --short` 退出 1，既存 submodule
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` permission denied。
- C26、C30、C33：三个只读 `rg` 调用的工具参数误配为 `bash`，运行器分别在执行前
  以 `Bash/E_ACCESSDENIED` 拒绝；无命令执行、无文件写面、无权限/审批/锁变化。
- C37：PowerShell 复合命令先正常输出文件身份与 `RUNS_EXIST=False`，末段 `rg`
  因引号转义错误退出 1；无写面。C38 以正确 PowerShell 引号重跑成功。
- W1-W8 均记入仓库静态修正记录；W2 是格式错误且未应用，其余为允许文件写入。
- W9 是本交回文件的 `apply_patch` 创建，不涉及 shell 或 Git 写面。

## 本记录创建后的实际命令

以下是 C01-C38 之后、本交回创建前唯一新增的 shell 命令：

```powershell
# C39
$root='docs\plan\evidence\T30\GenuineSessionGui-20261028-094637'; Get-ChildItem -LiteralPath $root -Force | Sort-Object Name | ForEach-Object { [pscustomobject]@{Name=$_.Name;Bytes=$_.Length;Sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()} } | Format-Table -AutoSize; "RUNS_EXIST=$([bool](Test-Path -LiteralPath (Join-Path $root 'runs')))"
```

C39 使用指定绝对原生 PowerShell、`login=false`、工作目录
`D:\Lawbeach\lawbench-A`，退出 0。C01-C38 的完整精确命令串见上方仓库静态修正
记录；两份文件合并构成全部实际 shell 命令记录。

请根侧审计后按执行令另行运行 prepare/admit/fresh GUI；实际删除确认必须由真人在
实际对话框作出，旧 `M0002` 不是本次授权。
