# B 线交回：T18 pre-issue ready 计数谓词修正

## 结论

状态：`SOURCE_ONLY_NOT_RUN`，本线有界工作已完成。

已按正式执行令创建新证据目录，逐字节复制 entry、B service、批准 manifest，并且
只在 native entry 中修改两个数值字面量。修正后的 consumer 长度与 SHA-256 均命中
根事先给出的身份。未启动 Node、Python、TypeScript、B service、产品、模型或 HTTP，
未执行测试、构建、导入、进程探测、GUI、SSH 或其他运行时动作。

这不是产品或模型缺陷。既有实际运行 `run-v1G6xP` 在 4.734 秒、0 次模型 POST、
0 次模型 HTTP 200 前自然失败，原因是 consumer 仍要求旧 defense 场景的
`materialCount === 2`、`fixtureCount === 3`；本 preissue 场景实际为四份 TXT 材料
加一份 prior，B service 返回 `4 materials / 1 prior / 5 total`。本线没有重演该运行，
只复用根已落盘的实际失败记录。

## 唯一源码差异

`native-pre-issue-check.mts` 仅有两个变化字节：

```text
ready.materialCount !== 2  ->  ready.materialCount !== 4
ready.fixtureCount !== 3   ->  ready.fixtureCount !== 5
```

逐字节比较显示变化位于偏移 `52840`（`2` -> `4`）和 `52919`（`3` -> `5`），
全文差异计数为 2；文件长度不变。prompt、callback、NativeUUID、setup、finally、
断言、参数及其他字节均未改动。没有新增有限辅助器、测试或业务逻辑。

## 实际写入与身份

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueReadyCountFix-20261029-205727`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-pre-issue-check.mts` | 153232 | `c39d244e81f988f2418cd3b3047998cbe2cf718bd17a14aac8480bff3f15bce4` |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |
| `root-approved-manifest-data.json` | 13575 | `2ca2cba062250e03817e50fefa5b060afdb54cac5c63f414bcfe0654b53f2923` |
| `README.md` | 1747 | `90eb974e7531c1f09a5cb63c74a73ef42eb2a94759929f06807831f5789fa5a5` |

entry 的源件在修正前为 153232 字节、SHA-256
`86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536`。
B service 和 manifest 均从
`D:\Lawbeach\lawbench-coord\T18PreIssueReadyFixInput-20261029-205727` 逐字节复制，
分别保持冻结身份和批准身份。

## 核验

- 用 PowerShell `Get-Item` 核对四个证据文件长度。
- 用 PowerShell `Get-FileHash -Algorithm SHA256` 核对三份源件与 README。
- 用 PowerShell 字节比较确认 native entry 相对批准输入只有上述两个变化字节。
- 用 `Select-String` 只读确认当前 readiness 谓词为 `materialCount !== 4` 和
  `fixtureCount !== 5`。
- 目标目录之前不存在，本次最终只创建上述四份证据文件和本交回件。

本线没有运行既有有限检查器。其源码未改；按执行令，完整反向核对、ESM/作用域绑定、
准入检查及一次全新原始实际运行由根后续执行。本次交回不构成 T18、产品、模型、
三路验证或发版通过。

## dirty 保全与阻碍

开工时顶层 `git --no-optional-locks status --short --branch` 因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝而失败。
随后使用只读
`git --no-optional-locks status --ignore-submodules=all --short --branch` 核到
`line-B...origin/line-B [ahead 141, behind 1]` 及大量既有 dirty 项。所有既有 dirty
均原样保留，本线未接触业务源码、契约、Skills、旧 evidence 或旧 served root。

该 Git 子模块只读检查阻碍已记录，但按执行令不属于需要修复的交付阻碍。未尝试改权限、
清锁、扩审批或写入 Git。全程没有运行 `git add`、`commit`、`rebase`、`stash`、
`reset`、`clean`、`checkout` 或 `push`，交回以本协调目录文件为准。

另有执行器参数失误：最初一次正式令读取误发了非 native shell 参数，被环境以
`BASH/E_ACCESS_DENIED` 拒绝；该次没有读写文件，随后立即用指定绝对 native
PowerShell、`login=false` 成功只读正式令。此后所有命令均使用该 native PowerShell。

## 后续

由根完成源码全量反向核对、ESM/作用域绑定、准入检查和且仅一次全新原始实际运行，
并核验手工记录、JSONL 与 OS closure。B 线到此停止，不再执行无关修复或机械计数循环。
