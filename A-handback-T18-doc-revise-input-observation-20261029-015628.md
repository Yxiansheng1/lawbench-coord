# A 线交回：T18 文档修订输入观察修正

状态：`AUTHORED_NOT_RUN`

本次只完成有界静态修正，没有执行消费者、B 服务、Node、Python、tsx、解析器、导入、测试、编译器、构建、准备脚本、HTTP、模型、GUI、SSH、DPAPI 或运行时。旧两阶段运行的 `FAILED`、原首轮业务失败和阶段一“字面 4.1 未满足”均保持原结论，不宣称阶段一或 `doc-revise` 已通过。

## 已核事实

- 完整读取并核验实际预审清单 v4：2351 字节，SHA-256 `b01af533b523c9752a84fd3801d3de1cfd46db5fb75642888aaa6bad493abe2f`。
- 清单确实含“风险3”“合同第四条”“合同第七条”，不含字面 `4.1`。
- 实际《采购合同》文本第 76 行含 `4.1`；消费者仍按材料名读取《采购合同》，并要求实际读取文本中出现 `4.1`。
- 两个选定输入经 `trimEnd` 后分别为 105 和 40 行，最长行 172/158 字符，低于 8000 字分页上限。
- 实际 Native Session 仍为 419109 字节、116 行、115 个事件，SHA-256 `18f9cd26127b50f9cc220f9149f0769800d1577f5d8a8ecd9fed0d98f0b1912c`。
- 实际资源仍为 8494 字节、SHA-256 `1d76a908ef33b9d27d50123a2f534cfce233cb15b44b1f29f6c2437255e26990`；根闭环仍为 16263 字节、SHA-256 `f08fb62048249bae3e35b5247164e4939869674d314c4ac358bbf2af9a6c0ad5`。
- B 伴随件仍为 38290 字节、SHA-256 `20fe78e454fd5fe23fd5cb63350dd8d2df659bdce9637782c902982861e85987`，字节未变。

正式令引用的 `D:\Lawbeach\lawbench-coord\T18DocReviseInputObservationInput-20261029-015628.md` 不存在。没有猜测或补造该缺失输入；依据仅来自正式令、上一份交回、冻结清单和已核实际输入。

## 已完成的最小修正

- 把清单的预模型身份检查从不可能的字面 `4.1` 改为真实“风险3 / 合同第四条 / 合同第七条”标记。
- 将 `case_read_input` 每页结果与其实际来源的 `start/end` 行切片逐字比较；全局标记改在完整覆盖后检查，不再要求每个分页重复同一标记。
- 保留两份输入的完整覆盖、索引、请求/结果分页、结果哈希、实际选择和实际来源身份。
- 保留实际材料 4.1 读取、模型最终风险3 单处 `七 -> 4.1`、其余正文逐字节不变、引用解析、JSONL 前缀、清理、`finally` 和错误/凭证脱敏。
- `STAGE2_PROMPT`、答案、来源清单、正文、模型路由、`maxTokens` 32768、32 次模型预算、48/45 资源、23 个案件文件和所有其他冻结项均未改。

## 最终文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\continue-genuine-doc-revise.mts` | 123988 | `df38e976f6063ce3ba3254189b59d72904a93cc14c07d53fdbde15618e3830c8` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\literalfixed-inputs.json` | 23187 | `6f80266d4ea88b19137868db89931d05bdd4171b4e443fb353cd35e2d5d2c9ab` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\input-observation-precision-20261029-015628.md` | 3294 | `2b349d8a7b0bb881cb43189643eb2db0c52c2e05c2a3206655191ec26b7ff1d6` |
| `D:\Lawbeach\lawbench-coord\A-handback-T18-doc-revise-input-observation-20261029-015628.md` | 本文件 | 由根侧按落盘字节独立核验 |

冻结清单只改了 `consumer.bytes` 与 `consumer.sha256` 两个字段。B 伴随件、README 及其他冻结输入未改。

## 实际命令面

只读核验使用：

```powershell
Get-Content -LiteralPath <order-input-or-source>
Get-ChildItem -LiteralPath <directory>
Get-Item -LiteralPath <path>
Get-FileHash -Algorithm SHA256 -LiteralPath <path>
rg --files <directory>
rg -n <pattern> <paths>
Select-String -LiteralPath <path> -Pattern <pattern>
git status --short --branch
git diff -- <exact-evidence-paths>
git ls-files -m -- <exact-evidence-paths>
git log -1 --format=<format> -- <exact-path>
```

源码/文件写入只经 `apply_patch`：

- 修改消费者。
- 修改冻结清单的两个消费者 pin 字段。
- 新增精度说明。
- 新增本交回件。

## 非零与阻碍

- 读取不存在的 `T18DocReviseInputObservationInput-20261029-015628.md` 返回 `PathNotFound`；随后按正式令与现有权威输入继续，没有补造。
- `git status --short --branch` 返回非零，原因仍是共享工作树中的 `dsh` 子模块目录被拒绝访问；未修权限、ACL、审批、锁或工作树。
- 一次只读 `rg` 汇总因工具调用参数误设成 `bash`，在 `Bash/E_ACCESSDENIED` 失败且无内容、无写入；此后只使用指定的原生 PowerShell。
- 未执行任何 Git 写入：没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

## 交回边界

根侧应先独立核对完整字节差、ESM 语法和全部字面 pin，然后只执行一次剩余的普通 `doc-revise`。不要重演预审检查或整份原始合同复核。只有该实际运行产生真实 task/R、两条输入读取及来源切片、材料 4.1、实际模型工具参数、引用解析、单处字节差、重开 JSONL 和清理证据后，才可讨论这一剩余步骤是否通过。
