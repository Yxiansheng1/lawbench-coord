# 线 B 交回：T18 刑期计算观察器静态返修

## 结论

工单：`B-T18-sentence-observer-fix-order-20261029-222220`

状态：`SOURCE_ONLY / STATIC_SOURCE_FIXED_NOT_RUN`。

已按令处置主编排确认的两项逻辑缺陷和一项生产者拒绝字面量问题，并完成批准运行时四项
身份及两处绝对编译导入的 data-only 更新。产物仅用于主编排后续全量反向核验、有限
UNIT 和新的原始实际运行；本交回不是产品 PASS、真实模型 PASS、完整 T18 PASS、
Gate 1 通过、发车、封装或业务质量结论。

本批没有运行 Node、Python、TSX、导入、类型检查、测试、构建、HTTP、模型、GUI、
产品路径、OS 进程探测或全量回归；没有停止或重建私建运行时。

## 产物

仓库证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceGateObserverFix-20261029-222220\`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `native-sentence-calc.mts` | 164237 | `f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8` |
| `b-service-sentence-calc.py` | 49941 | `eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3` |
| `literalfixed-inputs.json` | 12426 | `725d9d888d9621df15b0d5d978f05261064782e51ea5af795f230a42a1627ed9` |
| `focused-finite-observer.mts` | 18631 | `cdd661d2a8b62529eedf6beaca4261ddb80cb4ea7201216b15d79f84ae5b1367` |
| `README.md` | 6285 | `e8f55f2c0c004483fff08cacf74e3f97c962b3ee485f03c218a981e3981908c5` |

`b-service-sentence-calc.py` 与批准输入逐字节一致，SHA-256 为冻结值
`eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3`。

## 已处置项

### `CALLBACK_ORIGIN_COUNT`

- 实际 `callbackAttempts` 现在只允许等于唯一一次成功 callback，
  `successfulCallbackInvocations` 仍必须严格为 1。
- 未知问题 ID 在生产 `preTool` 阶段被拒绝，不再错误计入 callback 次数；
  该拒绝仍按当前 Native turn、callId/seq 配对和精确生产拒绝字面量单列在
  `rejectedCalls`，不计成功、不合成答案。
- 未知 ID 后接合法联合三问的恢复卡现在传实际值 1；新增反例在同样只有 1 次
  真实 callback 时传 2，预期 RED。

### `FIRST_SUCCESSFUL_SAVE_ORDER`

- 保留成功计算恰好一次、计算后首个成功 Core 调用必须是 `case_save_draft`。
- 新增必要硬门：任一成功存稿的 call seq 或 result seq 早于唯一计算结果的 result seq，
  立即 RED。
- 新增反例：清单、读取、实际三问回答、成功存稿、计算、再存稿，预期 RED。

### `UNIT_PRODUCER_DENIAL_LITERAL`

- 有限卡改用批准生产函数
  `invalidQuestionAskDenial` 的完整真实模板：
  `ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：`
- 不再使用旧有限卡虚构的短拒绝文字。

## 运行时与固定清单

四项 `APPROVED_RUNTIME_PINS` 已只更新为批准的新私建输出：

| role | bytes | SHA-256 |
| --- | ---: | --- |
| current-compiled-agent | 556453 | `16a82ad40de09d1895b6ceda188af70d630863c8fd369444490e62e7eeb2f9af` |
| current-compiled-host | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| current-compiled-package | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| current-compiled-manifest | 58195 | `7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851` |

路径均指向：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\private-output-20261029-221202\`

两处绝对编译 `agent.js` / `host.js` 导入已同步指向该路径。源码差异中当前 manifest
SHA 只出现在四项 pin 内的 manifest 一项；旧 `LitigationQuestionPrivateBuild` 路径、
旧消费者 151508 字节和旧 SHA 已归零。

`literalfixed-inputs.json` 采用批准蓝图。逐行比较结果仅允许的两处不同：

```text
"bytes": 164237
"sha256": "f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8"
```

其余自身两路径、新私建四项、依赖、材料、运行时可执行文件、批准输入和 B 服务身份
与批准蓝图一致。未复用旧快照 `96849...` 的旧自身路径。

新私建 `9.5909036s / build0 / 4 complete gone + 1 partial NOT_PROVEN` 按既有验收结果
复用，未重建。未把 partial OS 身份写成完整证明。

## 静态核对与卡组

- 原生源码对输入件仅 17 行新增、12 行删除；有限观察源仅 43 行新增、2 行删除。
  逐行 diff 只包含上述运行时身份、两处 import、两项逻辑修复和必要的新控制。
- `focused-finite-observer.mts` 当前为 16 项源码卡：4 项预期绿、12 项预期红。
  这些只是待运行源码计数，不是本轮运行结果。
- 旧的 14 项卡保留语义；旧真实 `gySbhT` 仍然预期 RED，没有被放宽或改成绿色。
- 旧源码/证据 3c246...、7a123... 和既有真实失败报告未被改写。未新增框架、旁路、
  store、路由、fixture、endpoint、prompt、答案、参数、预算或产品代码。
- 主入口 guard、setup/finally、旧 46、源码 346、legacy 18、prompt、三问答案、
  模型、provider、fetch 和 B 服务均未改。

## 原始命令账

交回件落盘前的原始工具账为：

- `exec_command` 56 次：49 次退出码 0，7 次非零。
- 非零构成：1 次默认 Git 状态受 `dsh` 子模块权限拒绝；1 次目标目录初次检查不存在；
  1 次 `bash` 误配被 MXC 以 `Bash/E_ACCESS_DENIED` 在执行前拒绝；2 次预期有差异的
  `git diff --no-index --numstat` 退出 1；2 次预期有差异的只读 diff 内容退出 1。
- 另有一条只读诊断命令误填短 `pwsh.exe`；它已输出只读内容，但不符合本令绝对原生
  PowerShell 要求。此后所有 `exec_command` 均使用
  `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
  和 `login=false`。两条 shell 误配均无写入效果。
- README 首次大块 patch 因上下文换行不匹配整体失败，未产生部分改写；随后按实际段落
  分两次成功应用。其余所需修改均成功应用。

默认 `git status` 的权限拒绝已如实保留；改用
`git -c submodule.recurse=false status --short --branch --ignore-submodules=all`
完成只读核对。既有大量 dirty 全部保留；未修 `index.lock`、权限、ACL、审批或 writer
锁，未尝试拆锁或扩权。

## 后续

建议主编排从本目录开始：

1. 对全量累计 diff、命令/写入面、源码和整份 manifest 做反向核验；
2. 运行有限 ESM、BAST、scoped bindings、514 条逐字身份准入、459 源/140584/task866a
   及新私建四项；
3. 只执行一次新的原始实际流程，覆盖 raw calc、question、read、save、source GET、
   JSONL 重开、人工判读、source 不可变、OS 完整性与 key scan；
4. 继续保留原成功硬门；任何实际失败原样保留，不以改观察器、放宽断言或改模型追绿。

## 纪律声明

本线未联系其他聊天，未更换 API，未触碰生产，未执行 `git add`、`commit`、`rebase`、
`stash`、`reset`、`clean`、`checkout` 或 `push`。Git 全程严格只读，因此没有提交
SHA；本文件即正式交回。
