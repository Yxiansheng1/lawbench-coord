# A 线交回：T18 合同任务说明标题提取修复

交回时间：2026-10-28 17:05（Asia/Taipei）

执行令：`D:\Lawbeach\lawbench-coord\A-T18-contract-task-heading-order-20261028-170518.md`

## 结论

有界修复已完成：`native-contract-workflow.mts` 只改了 `taskNotes` 提取的同一个表达式，精确移除任务说明首部的 `# 任务说明` 标题行及其换行，然后保持原来的分隔线截取、`trim()` 和与 `LAWYER_REQUEST` 的完整严格相等比较。

状态：`PREFLIGHT_FIXED_NOT_RERUN`。本轮没有执行 Node、Python、编译器、测试、HTTP、模型、Key、GUI、SSH、安装或 fresh workflow；这些验证留给主编排在读完交回后按原令继续。

## 文件身份

| 文件 | 修改前 | 修改后 |
|---|---:|---:|
| `native-contract-workflow.mts` 字节 | 103328 | 103364 |
| `native-contract-workflow.mts` SHA-256 | `099a5388d4faa8596335e4b2b9984d757774ae728b2964d96122238af1c7b4c3` | `005889a8dbc5bd7689270771cbfa993ce87b71600fae312ef9a97ff73012e1d6` |
| `README.md` 字节 | 4992 | 5019 |
| `README.md` SHA-256 | 未作为修改前 pin 使用 | `4e400aca21ddd97ef3deb5a724cfc386244c269758f57dbb7e5db3524541afab` |

README 只更新了当前状态和 `native-contract-workflow.mts` 的字节数、SHA-256。

## 唯一源码改动

改动位置：`docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\native-contract-workflow.mts:1692`

```diff
-  const lawyerRequest = taskNotes.split(/^---\s*$/m, 1)[0]?.trim()
+  const lawyerRequest = taskNotes.split(/^---\s*$/m, 1)[0]?.replace(/^# 任务说明\r?\n/, '').trim()
```

未改动 `LAWYER_REQUEST`、`USER_PROMPT`、分隔线截取条件、`trim()`、严格相等断言、后续隐私检查、B 服务、manifest、旧 Skill、运行时 pin 或原始任务文件。

## 实际任务源核对

固定清单 `fixed-inputs.json` 的 `task-notes` 指向：

`D:\Lawbeach\lawbench-coord\T18NativeContractInput-20261028-163202\task_and_test_notes.md`

只读核对结果：1055 字节，SHA-256 为 `0e6830a53849d7129ec9482401b57c30cd786880551b1cef78a1487faf724083`，与 manifest pin 一致。文件首部实际为：

```text
# 任务说明

帮我审一下这份钢材采购合同。……
```

因此旧表达式截取到的是“标题 + 空行 + 律师请求”，不可能与 `LAWYER_REQUEST` 完全相等。该失败发生在 stdin 凭据读取、setup、模型调用和报告写出之前，是确定性 fixture 预检缺陷，不是产品行为或模型失败。

## 验证边界

本轮只进行了只读静态核对：读取修改行、计算源文件字节数和 SHA-256、核对实际任务源与其 manifest pin。未运行 fresh workflow，也未声称编译、运行、模型质量或业务验收通过。

Git 全程只读：没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`，没有暂存或提交。首次 `git status --short` 在读取 `dsh` 子模块时因既有目录权限失败；随后使用忽略子模块的只读状态命令确认工作区原有大量 dirty 内容仍在，没有修复权限、锁、ACL 或扩大审批范围。

## 事实缺口与偏离

1. 执行令指定的输入件 `D:\Lawbeach\lawbench-coord\T18ContractTaskHeadingInput-20261028-170518.md` 不存在，协调目录中也没有同批次改名件。未创建代填输入件；修改依据取自执行令、固定清单和实际 pinned 任务源。
2. `run-CwSx1q` 目录仍保留，但当前为空；交回时 `run-CwSx1q\report.json` 不存在。未删除、重写或伪造原失败报告。

## 主编排下一门

按原令继续执行：核对当前文件相对 `099a5388...` 仅允许这一个表达式变化；用实际任务文件做 fixture 提取验证和现有编译检查；再用同一原始工作流 fresh run。Packaging 仍为 HOLD，项目整体仍未完成。
