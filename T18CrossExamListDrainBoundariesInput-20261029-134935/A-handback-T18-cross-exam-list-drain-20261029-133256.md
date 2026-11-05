# A 线交回：T18 材料清单严格观察与 Core 任务结束结算

日期：2026-10-29 13:32:56（Asia/Taipei）

执行令：`D:\Lawbeach\lawbench-coord\A-T18-cross-exam-list-drain-order-20261029-133256.md`

## 结论

状态：`AUTHORED_NOT_RUN / ROOT_REVIEW_REQUIRED`

本轮只新增源码与有限验证材料，没有执行验证，没有产生新的业务 Green，也没有改写原失败报告。主编排复核后，两条有限命令才可执行。T18、Gate 1、手工业务验收和打包仍为 `INCOMPLETE/HOLD`。

## 完成内容

1. 材料清单门保留 L0-only 合法路径；成功工具结果缺字段、空名单、重复名、额外名、改名、错误批次、缺结果或重复结果必须失败，不再静默回退 L0。合法工具失败仍可留在历史中，但不构成清单来源；迟到结果不能证明读取前已列清单。
2. 消费者新增自有 Core 任务结算 helper 与缓存控制器。任务身份由候选自己的 `task.json` 对当前 case/session/request/Skill 绑定，任务列表行只作发现证据；`selectionId` 排除，任务号在读取任务路径前校验。
3. 结算只在 `task.json.state=finished` 且 `result.json.status` 为非 `running` 终态、列表状态一致时成立。仍 running、缺失、重复、`abnormal`、错误身份和超时均不算结束成功。
4. 主路径在 `agent.whenIdle()` 后、严格材料/回答/顺序/草稿断言前立即结算；成功路径与失败 `finally` 共用缓存。失败清理在 B stop、Context/Browser dispose 和 fetch restore 之前完成；结算失败作为次级清理失败，原主错误仍优先，资源仍继续关闭。
5. 报告增加实际 `taskId`、`taskState`、终态、轮询次数和结算 outcome。
6. 两份有限验证器只使用封存数据、实际消费者 helper、实际 `CoreClient` 类、实际 `LegalAgent.onSessionEvent` 和受控内存 transport；没有 NativeSession、服务器、HTTP、模型、凭据、资源探测或真实等待。

## 产物

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamListDrain-20261029-133256\`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-cross-exam.mts` | 146650 | `7ecfc51ec1e14f651332fbac1df269e38dfd434d8381dee3550297d9ab830139` |
| `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| `literalfixed-inputs.json` | 12262 | `f7b05ccf8cf43defa8a75bf7f011214c57e589c8486950e88768862cb5c43a06` |
| `verify-L0-listing-finite.mts` | 29935 | `f3b212e92a220eb985487f263cb0a7fcddb349f19d7b0b63504586434999232f` |
| `verify-task-settlement-finite.mts` | 28013 | `a496ed827f4daf615988695c602430191c9cf127ec0c28cc2fe99814753a922a` |
| `README.md` | 6170 | `90881113ecea9dffd4e1b5a0efa5f5f56dabda43c95be3d5c3cb383f719f913f` |

manifest 只改自有消费者/B 服务路径和消费者字节/SHA；26 项依赖、4 项私有编译产物、3 个运行时可执行文件、8 份 approved inputs、实际答案和 source pins 均逐值保持。B 服务是协调基线逐字节副本。

## 复用证据

| 对象 | 字节 | SHA-256 |
|---|---:|---|
| 实际 JSONL | 203065 | `adbca9d61673e8d4768446905d61c0c8da79c74651e0426d2cdb3437596f5f29` |
| 实际旧报告 | 18824 | `928143c5247196fbb464d3594088e2b42ac245bbca871947251405a8ee801739` |
| 实际任务元数据 | 1463 | `c7c2dce83c3d76ae106a34158d0c8708489b4bd401ba7e9f4fef2c813433115b` |
| A agent | 46684 | `5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c` |
| A CoreClient | 3666 | `5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50` |
| TypeScript JS | 9144216 | `569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39` |
| TypeScript package | 3527 | `9332e97c30d3e53ed54910b89207ed657fb444066484df6e5b6965bf130865e9` |

实际 seq 仍为 L0 `5`、R `6`、联合问答 `16/17`、首次材料读取 `21`、首次保存 `31/32`。旧 trace、旧消费者、Skill、B context、授权答案与 A agent pin 均由验证器继续固定。

## 未执行与验证边界

本轮没有运行 Node、Python、TypeScript 解析器、`tsc`、`tsx`、import、check、test、build、HTTP、模型、GUI、SSH、Key/DPAPI 或进程/端口探测。两份验证器状态均为 `AUTHORED_NOT_RUN`。

主编排 FULL 复核源码、setup/cleanup、typed contracts 和这些反向门后，执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamListDrain-20261029-133256\verify-L0-listing-finite.mts'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamListDrain-20261029-133256\verify-task-settlement-finite.mts'
```

预期分别是 L0 观察器有限 GREEN 和离线结算 helper 有限 GREEN；二者都不是业务 PASS。实际模型运行仍须另立授权，原 `FAILED` 报告不可改写。

## 命令与阻碍

本执行者共发出 64 个原生 PowerShell `exec_command` 段。14 个返回非零：1 个主仓库 `git status` 因子模块 `dsh` 权限拒绝；7 个早期误传 Bash shell 参数，立即在进入 PowerShell 前拒绝；3 个只读 PowerShell 汇总脚本因空管道语法失败；2 个只读 `git diff --no-index` 按差异返回 1；1 个只读 `rg` 因无匹配返回 1。所有失败均未产生文件或代码状态变化。Node/Python/解析器/测试/HTTP/模型运行次数为 0。

主仓库 `git status --ignore-submodules=all` 可读；普通 `git status` 在子模块 `modules/dsh` 处 `Permission denied`。该阻碍不影响本目录交回，不修锁、不修 ACL、不扩权。

## Git 与写面

Git 严格只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存任何内容。未改产品 A/B、契约、Skill、测试默认库、旧失败报告、旧证据、maker锁、沙箱、审批或 ACL。正式交回为协调目录文件，不是 Git 提交。

## 遗留

- 两份新有限验证器尚待主编排复核并执行。
- 实际模型消费者未重跑；原 `actual tool loop lacks case_list_materials` 仍保持原报告失败。
- 三次回答的语义、证据用途、争议说明和人工法律质量仍未验收。
