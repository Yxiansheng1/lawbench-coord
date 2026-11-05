# A 线交回：T18 `defense-opinion` 必问闸门

## 结论

授权范围内的源码与聚焦测试已完成，正式交回。按执行令只做源码作者，不执行 Node、TypeScript、测试、构建、模型或网络验证；因此本交回不宣称测试通过。

执行计数：

- 聚焦测试新增：1 个文件、2 个 `describe`、5 个 `it`。
- 聚焦测试执行：0。
- 类型检查 / 构建：0。
- 模型调用 / HTTP / GUI / 进程探测：0。
- Git 写入（add / commit / rebase / stash / reset / clean / checkout / push）：0。

## 授权改动

### 产品源码

文件：`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`

- 新增导出 `DEFENSE_OPINION_SKILL = 'defense-opinion'`。
- 向既有 `REQUIRED_QUESTION_SKILLS` 集合末尾追加 `DEFENSE_OPINION_SKILL`。
- 同步三处只描述已接必问闸门技能范围的注释，加入辩护意见。
- 未改 TaskState、hook、Schema、tool、SDK、Skill、prompt、budget、provider、UI 或 B 线源码。

相对冻结快照：

- 原快照：`T18DefenseQuestionGateInput-20261029-172117\0-index.ts`
- 原字节 / SHA-256：46809 / `ce2493cb60e652195779394bff50819924ceeff64e5bcf63e859928eb2c87294`
- 现字节 / SHA-256：46958 / `442b67e8573f93647c1eac00e4ed810f3820bca7dcd8c4c515287aa94d81d3b1`
- 精确行差：`+5 / -4`，净增 1 行。

### 聚焦测试

文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts`

- 字节 / SHA-256：20288 / `7fff83589539e15b622218d34a3053d0c0bd7748d02d2cf12075a120d2dba1c8`
- 实际 Host 入口读取 `direction`、`stage`、`key_points`，断言 `fromMaterials` 为 `[false, true, false]`。
- `MemoryCore` UNIT 覆盖：未答时 `preTool`、直接 `executeTool`、`saveUnfinished` 均在 Core 写入与预算计数变化前拒绝；预算到顶状态也覆盖代存路径。
- 覆盖未知、漏项、重复、空 ID、空问题、JSON 字符串提问。
- 覆盖失败、取消、旧任务晚到结果、跨会话结果不解锁；同一任务三项联合结构化答案解锁正确保存。
- 覆盖目录缺失、重复或畸形时 fail closed；`NONE` 与其它自由 Skill 不读取辩护必问项。
- 使用真实 `ToolRuntime`、`toolAskUser`、`UserQuestionService` 和 `AgentRegistry` 接线；未建 fake AgentLoop、fake LLM provider、native UUID 或历史。
- 从实际注册定义读取 `ask_user_question.parameters`，断言 `questions` 为 `array`、问题项为 `object`、`options` 为对象数组。
- 实际 ToolRuntime 下 JSON 字符串与字符串 `options` 均被严格拒绝，回调数为 0、Core 写入为 0；随后正确三项结构化提问只回调一次并解锁一次保存。

既有 `criminal-application-question-gate-20261029-150420.spec.ts` 未修改。

## 只读核验

已读取并核对：

- 正式执行令全文。
- `T18DefenseQuestionGateInput-20261029-172117\source-pins.json`。
- `T18DefenseQuestionGateInput-20261029-172117\A-tracked-dirty.json`。
- `task-state.ts`、既有刑事申请测试、实际 SDK 的 `tool-ask-user`、tool schema、ToolRuntime 与 UserQuestionService 源码。
- A Host 测试目录中的 `defense-opinion\SKILL.md`；冻结的 B 线 Skill 源同时保持不动。

仅读核验结果：

- 6 个非授权源钉全部 UNCHANGED，0 mismatch；授权 `index.ts` 为预期变化。
- `A-tracked-dirty.json` 中 56 个既有 tracked-dirty 文件全部 UNCHANGED，0 mismatch；唯一变化的 tracked 文件是授权 `index.ts`。
- 精确源差使用 `git diff --no-index` 对照冻结快照，仅出现上述常量和三处注释改动。
- scoped `git status --short --untracked-files=all --ignore-submodules=all` 显示：`M dsh-ext/agent/index.ts`、`?? dsh-ext/tests/defense-question-gate-20261029-172117.spec.ts`。

核验命令类型：

- `Get-Content -LiteralPath ...` 读取正式文件。
- `rg -n -C ...` 只读定位源码和测试接线。
- `Get-FileHash -Algorithm SHA256 -LiteralPath ...` 对照冻结源钉和 dirty 清单。
- `git diff --no-index --numstat -- <snapshot> <current>` 核对授权产品精确 delta。
- `git status --short --untracked-files=all --ignore-submodules=all -- <authorized paths>` 做限定路径只读状态检查。

## 阻碍与过程偏差

- 不带 `--ignore-submodules=all` 的 Git 状态检查失败：`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝。未尝试修改锁、权限、ACL 或扩权；后续只做限定路径和忽略子模块的只读检查。
- 有三次工具调用误把 shell 指定为 `bash`，运行器在执行前均以 `Bash/E_ACCESS_DENIED` 拒绝；没有命令、文件或状态变化。后续均恢复为执行令指定的绝对路径 native PowerShell、`login=false`。
- 两条只读哈希汇总 PowerShell 命令因 `foreach` 结果直接接管道的语法错误，在脚本解析阶段失败，没有写入或状态变化；修正后重跑成功。
- 未发现需要修改受保护的 dirty、Skill、SDK、Schema 或 B 线源码的理由。

## Root 后续

请由主编排按既定边界执行：

1. 全量复核本交回所列源码、delta、命令和写面。
2. 在冻结的 `347ae` 基座加本授权 delta，按原计划运行聚焦 UNIT/ToolRuntime 测试与类型检查。
3. 用新私有 consumer literal pins 验证真实用户问题回调；旧 served run、旧 source、旧 report 不动。
4. 只有实际测试证据出来后再更新通过/失败计数；本交回不得作为测试或构建通过声明。
