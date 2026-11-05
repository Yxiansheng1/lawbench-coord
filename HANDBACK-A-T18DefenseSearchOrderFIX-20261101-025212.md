# A 线交回：T18 辩护意见检索先于主材料读取

状态：`AUTHORED_NOT_RUN`

## 交付范围

只修改了批准包列明的两个产品文件：

1. `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`
   - 在构造函数末尾新增默认 `false` 的 `defenseSearchBeforePrimaryRead` 参数，旧调用方行为不变。
   - 增加仅属于单个 `TaskState` 实例的私有检索成功标记、getter 与成功登记方法；不保存检索词或材料内容。
   - 结果不会跨同级任务、会话、案件或新请求继承；迟到结果即使更新旧实例，也不能解锁当前实例。
2. `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
   - 仅在 `begin.skill === DEFENSE_OPINION_SKILL` 时固定新开关。
   - `case_search` 必须在 Core 调用成功且既有结果契约校验通过后，才登记本任务检索成功。
   - 辩护意见的 `case_read_material` 在 `preTool` 与 `executeTool` 使用同一谓词；原有必问门优先，之后要求本任务已有成功检索且参数 `start` 是大于等于 1 的整数。
   - 两项检查均位于工具预算计数和 Core 转发之前。未检索时拒绝原因明确指向 `case_search`，缺少或非法开始位置时明确指向 `start`。
   - 其他 Skill 的读取、辩护意见的输入/Wiki/清单/检索/提问，以及保存草稿和预算兜底路径均未新增门禁。

## 文件证据

| 路径 | 字节数 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 59185 | `B0E093554B4903A605587431BE0095E4318B846C7BFFA6791D70114B4ECADF93` |
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` | 25296 | `CE6A5EE0D21443305173C19FD36C5B623A6641566164DAC427098DA9F3718DAE` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-search-read-order-20261101-024639.spec.ts` | 13457 | `6A6C63FC8833693A04E61B25E38085506B498811745B9C1272FBE097144C4EA2` |

修改前，两个产品文件的 SHA-256 均与批准包 `approved.json` 一致，没有覆盖既有目标文件变更。批准的新测试未改，最终 SHA-256 与 `approved.json` 的 `6a6c63...` 完全一致。

## 验证声明

本线没有运行任何测试或运行时验证，不能宣称新 16 项测试、类型检查或相邻范围已经通过。

按正式执行令，本线未运行 Node、Python、解析器/AST、Vitest、tsc、pytest、收集、构建、prepare、应用、HTTP、模型、GUI、环境变量、凭据或 Git 命令。仅执行了正式执行令要求的只读源码核对，以及一次最终原生 PowerShell 元数据检查。

执行令载明的修复前原始结果仍只能作为红测基线：同一份 16 项测试中 11 项行为失败、5 项对照通过，源码处于保有时状态，未运行模型；真实原始案件跳过了 `case_search`，并在 `case_read_material` 未提供 `start` 的情况下仅按名称读取。由于两个产品源码现已改变，该旧运行结果不能当作修复后证据复用。

## 后续复核门

由 root 先对本次两个产品文件做 FULL review，再运行同一份 16 项测试，取得全绿，并补做类型检查及相邻范围验证。未完成这些步骤前，本交回只证明代码已按批准范围编写，不证明修复已通过。

## Git 与遗留

按本次执行令，全程未使用 Git，未暂存、提交、变基、重置、清理、切换或推送。交回通过本文件完成，不是提交。

遗留事项仅剩 root 的独立 FULL review、同一份 16 项测试、类型检查及相邻范围验证。
