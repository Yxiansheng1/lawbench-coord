# A 线交回：T18 真实文档修订续跑

状态：`AUTHORED_NOT_RUN`

本次只完成剩余的有界实现和静态核验，未执行消费者、B 服务、Node、Python、tsx、测试、编译器、HTTP 或模型。旧两阶段运行的 `FAILED` 结论、原首轮业务失败和旧证据全部保留；本交回不宣称 `doc-revise` 已通过，也不宣称完整 T18、业务质量、法律质量、GUI、打包或真人验收通过。

## 已核既有事实

- 冻结基线仍为：消费者 `d9602629f65a13d97e0a6aa2aa232b039bb28fd84ce163676633eead38e1bc76`，B 伴随件 `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a`，清单 `dbca629100335db645d3b590b568b25d0c57cc58d14acd03fd2f2013fb3db6b0`。
- 实际案件 `9d535ab5-f14c-42cc-bd99-a2f669ff6200` 当前为 23 个文件。
- 实际 Native Session 为 `session-1cb28369-3a90-46dc-b047-e64986038394`：419109 字节、116 行、115 个事件，SHA-256 `18f9cd26127b50f9cc220f9149f0769800d1577f5d8a8ecd9fed0d98f0b1912c`。
- 原 59 事件前缀仍为 240391 字节，SHA-256 `cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5`。
- 实际预审任务 `T-20261029012044-5869`、R `b91ca8e9-4d23-47bb-b249-c8e46fb7dd06`；清单 v4 为 2351 字节，SHA-256 `b01af533b523c9752a84fd3801d3de1cfd46db5fb75642888aaa6bad493abe2f`。
- 实际资源 `actual-preissue-inputs.json` 为 8494 字节，SHA-256 `1d76a908ef33b9d27d50123a2f534cfce233cb15b44b1f29f6c2437255e26990`。
- 原预审只命名“第四条”而未满足旧阶段一的字面 `4.1` 条件。该限制未被弱化，仍不作为旧两阶段 PASS 证据。

## 已实现

- 只执行一次普通 `/api/task` + `doc-revise`，输入严格为原 v2 和实际预审清单 v4。
- 使用原样 `STAGE2_PROMPT`；没有新提示词、黄金正文、夹具正文或预修正稿。
- 恢复同一 Session UUID；复制当前 23 个案件文件、当前一份 Native JSONL，以及仅两条实际 appdata 记录。
- B 守卫只接受同一案件、同一 Session、一次 task 选择、一次 begin、一次 end、一次新 R 和一次成功修改稿注册；拒绝材料导入、request-scope、redline、设置、凭证、OCR、Retainer 和外连。
- 仅保留一个显式路径接缝：原会话头 cwd 在 `task_begin` 时映射到本次私有复制案。报告单列 `cwdAliases`；不把它冒充生产 cwd 重定位通过。
- 要求实际加载 `doc-revise`、一次 `draft`/`opinions` 问题回调、完整读取两个 prior input、按名称回读《采购合同》并取得 4.1、注册新的 completed task、解析引用，并从实际 `case_save_draft` 工具参数取得全文。
- coverage 解析遵循 `common.schema.json`：字符串组与对象组分型读取；`partially_read` 校验 `name/read_units/total_units`，并与实际 reads 区间和材料总单位数交叉核对。没有沿用旧字符串假设，也不要求或宣称全部 `fully_read`。
- 成功正文只允许原风险 3 中的连续替换 `七` -> `4.1`；其余正文逐字节相同。模型可因改错、漏读或引用失败而诚实地失败。
- 持久化验证要求最终 JSONL 保留实际 419109 字节/115 事件整段前缀，并验证重开事件与关闭前内存事件深度一致。
- 失败报告保留首个错误；清理、B 协议和最终 pin 错误单列，不覆盖首个错误。

## 新增文件与最终身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\continue-genuine-doc-revise.mts` | 123006 | `08453ec8ba76a1bed97a799a25bb71d6fb2c31a1c1626a3e5c4fb598058614ab` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\b-service-doc-revise.py` | 38290 | `20fe78e454fd5fe23fd5cb63350dd8d2df659bdce9637782c902982861e85987` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\literalfixed-inputs.json` | 23187 | `06293cfff51d233cffd34feb0c5ea97b1469d5e8fd61555ed05b14d9a8376e57` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\README.md` | 3311 | `422491afedc1d522a36298455fb575b0653df37d2a4e0082bdd6240f667d0cea` |

`literalfixed-inputs.json` 回指消费者和 B 服务的上述大小/SHA；同时保留原 `genuine-inputs.json`、旧失败报告证据、346 条 B source pins、当前 private compiled agent/host/package/manifest pins 和运行时 pins，并新增实际资源/根闭环 pin。

## 本次执行的命令面

只读命令：

```powershell
Get-Content -Raw -LiteralPath <order-or-evidence-path>
Get-ChildItem -Force -LiteralPath <directory>
Get-Item -LiteralPath <path>
Get-FileHash -Algorithm SHA256 -LiteralPath <paths>
rg --files <directory>
rg -n <pattern> <paths>
git status --short --branch
git --no-pager diff --no-index -- <baseline> <new-source>
```

源码写入：

```powershell
Copy-Item -LiteralPath <frozen-baseline> -Destination <new-consumer-or-service>
```

随后仅用编辑补丁限定修改新目录四个文件，并通过 `apply_patch` 新增本交回文件。

根执行候选命令（本执行者未运行，命令不含 Key、密码、token 或正文）：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\continue-genuine-doc-revise.mts' --credential-stdin
```

## 静态核验与非零结果

- 冻结三文件的实际 SHA 与交回前 pin 完全一致。
- 实际会话、清单 v4 与 23 文件实际值已与固定资源交叉核对；新清单中的 consumer/service hash 与最终文件一致。
- 新目录最终只有四个正式文件，没有 `run-*` 目录；本次没有产生候选运行结果。
- `git status --short --branch` 返回非零：共享子模块 `D:\Lawbeach\lawbench\...\modules\dsh` 被拒绝访问。按要求未修权限、拆锁、改 ACL 或改审批。
- 有少量只读读取调用误用了 `bash` 参数；命令在 `Bash/E_ACCESSDENIED` 或 MSIX 启动限制处失败，没有返回内容、没有产品运行时、没有写文件。后续恢复为指定 PowerShell。
- 一次 PowerShell 哈希汇总命令因未包裹 `foreach` 管线而产生 `ParserError`；重写后成功，未产生写入。
- 未执行任何 Git 写入：没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

## 留待主编排

由主编排先做自己的完整源码复核与有限准入，再决定是否执行上面的唯一候选命令。必须由根侧经专用匿名 stdin 提供模型凭据；作者未读取任何 Key、密码或凭据槽。

本交回不代替运行证据。只有实际运行产生新的 task/R、实际模型工具参数、引用解析、单处字节差和 JSONL 重开证据后，才可能讨论这一剩余 `doc-revise` 步骤是否通过。
