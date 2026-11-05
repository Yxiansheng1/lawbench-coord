# A 线交回：T18 保存覆盖反馈修复

状态：`SOURCE_PREPARED_NOT_RUN`

执行者：`deepseek-v4.1-flash-1017` / `max`

## 结论

已在既有的一次性交付自检路径内补入真实保存返回的 bounded coverage 快照。只有三类既有交付 Skill 的 `case_save_draft` 同时满足 Core 成功且结果通过契约校验时，才记录覆盖并排队提示；未增加模型或工具调用，未改动任务范围、取消、提问门、预算、重复调用守卫或迟到任务隔离。

## 行为

- 部分读取提示携带材料原名和 `read_units/total_units`；未读取、无法读取提示携带材料原名，并给出任务材料总数及完整读取数。
- 每类快照最多保留 8 项、名称最多 160 个 UTF-16 单元、无法读取原因最多 240 个单元；不截断后冒充原名，超出部分计入 omitted 并在提示中显示“另有 N 项未逐项列出”。
- 覆盖不完整时明确告知只是材料读取覆盖，不表示程序知道哪些案件事实、争议点或法律问题缺失；要求在任务范围和现有预算内按需补读，无法补齐时说明不确定性，不得声称已经检查全部事实或全部不利事实。
- 单方陈述的标题、结论和归属保留规则写入提示；没有新增语义分类器或事实推断。
- 完整覆盖不带“覆盖不完整”标记，但明确材料读完不等于事实或法律问题均已核验。
- `DELIVERY_REVIEW_NOTICE` 原文保留；重复保存仍只提示一次，提示未取走前采用最近一次成功保存的覆盖。

## 工作区文件

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`
- `D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-delivery-coverage-20261031-1830.spec.ts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CoverageFeedback-20261031-1830\README.md`

最终文件元数据：

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `dsh-ext/agent/index.ts` | 57789 | `D8328B142489DC69D12F56156884D04F975B45B90ECA7CE54A25C4C1C202FA0C` |
| `dsh-ext/agent/task-state.ts` | 24595 | `8C68EB6B99E36F774CDDD0F7CD30FB0441C27D3E55B01D6EB733381538A0D899` |
| `dsh-ext/tests/t18-delivery-coverage-20261031-1830.spec.ts` | 15429 | `0AED4D9F5EF082C881B34C556D53CBF68ADFB88A7F2A2C9360095900DB52B60B` |
| `docs/plan/evidence/T18/CoverageFeedback-20261031-1830/README.md` | 3365 | `66DA85CBB5C0E8C63C55ED9D0FE536638FA78FB0E3F237B260CE6607751AAE92` |

## 测试准备

新增测试只使用内存合成 Core，不读取案件 fixture、参考记录或原始输出。用例覆盖：

- 三类交付 Skill 的部分计数、未读取、无法读取、材料总数和真实单元数；
- 完整覆盖不误报不完整或事实已核验；
- 缺失、结构异常、Core 失败及结果契约失败不提示覆盖；
- 非三类交付范围不提示；
- 重复保存只提示一次；
- 迟到旧任务、不同会话隔离；
- 每类限量与 omitted 数量；
- pre-step 注入提示不新增 Core 调用。

按执行令，作者没有运行测试、构建、解析器、应用、网络或模型调用，也没有执行旧源码红测。Root 需用受控验证绑定 before/after 模块，确认旧源码在“实际下一步提示缺少 coverage”断言上失败，新源码通过并完成类型检查。

## Git 与边界

- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 未修改契约、Skill、SDK、部署配置、审批、沙箱、ACL 或 writer 锁。
- 未清理既有 dirty；本次只编辑执行令允许的文件。
- 未读取案件 fixture、参考记录或原始输出；仅使用执行令给出的 17/31、31/42、total=2、fully_read=[] 计数与现有源码、契约、测试 API。

## 偏差记录

1. 一次源码范围读取误将 shell 参数设为 `bash`，运行器以 `ACCESS_DENIED` 在执行前拒绝；随后全部改用指定绝对路径的原生 PowerShell。
2. 第一次最终元数据命令使用表格输出，PowerShell 宽度把 SHA 截成省略号；随后用同一原生 PowerShell 重跑一次，明确输出完整 SHA-256 和字节数。
3. 无其他偏离。
