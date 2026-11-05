# T18 有界读取独立源码复核交回

- 任务：`T18_BOUNDED_MATERIAL_READ`
- 复核执行：C 线独立源码复核
- 正式结论：**AMEND**
- 结论范围：仅审查批准的卡片与五份快照；未运行 Node、Python、解析器、测试、构建、采集、模型、HTTP 或 GUI，不证明真实运行结果，也不证明事实草稿质量。

## 结论摘要

候选的 Agent 单单元守卫、旧行为保留、服务端区间截取和整单元记账主体代码与已批准方向一致。不能判 PASS：服务端直接入口仍接受负数 `start` 并在给定 `end` 时读取第 1 个单元；现有测试没有覆盖有界区间内的超长单元续读及 `has_more/next_start` 账目；批准材料也没有提供合同 1.7、生成器、VERSION 或 Spec 20.12 的接线证据。

## Findings

### F1 — FAIL：服务端合法区间校验不完整

- Snapshot：`1-materials.py:49-62`
- Trigger：调用 `read_material` 时为 `start=-1, end=1`。第 49-57 行只检查二者是否为非布尔整数、是否 `end < start`、是否超过末单元；第 60 行按 `u.no >= -1 and u.no <= 1` 筛出第 1 单元，因此直接读取并可能记账。
- Expected behavior：单元编号从 1 开始；`start < 1` 必须在读取、offset 处理或 `_record` 之前以 `INVALID_ARGUMENT` 拒绝。公开 HTTP/schema 若有 `minimum: 1`，可约束正常入口，但这五份快照没有提供该 schema，且现有 `test_direct_read_material_honors_end_with_real_task_context` 已证明服务函数存在可绕过公开 schema 的直接入口，不能据此放行。
- Evidence：`1-materials.py:50-62`；`4-test_read_bound_20261101_114236.py:210-232`。

### F2 — FAIL：超长单元测试未证明有界区间续读账目

- Snapshot：`4-test_read_bound_20261101_114236.py:157-207`；实现为 `1-materials.py:64-76,131-149`
- Trigger：请求 `start=1, end=2`，第 1 单元超过 `max_chars`，完成后第 2 单元仍在请求区间；或一次非 offset 读取因 `max_chars` 只容纳区间中的前一部分。
- Expected behavior：分段阶段应返回 `has_more=true`、`next_start=1`、非空 `next_offset`；第 1 单元完成后应以 `next_start=2, next_offset=null` 续读；第 2 单元完成后应返回 `has_more=false, next_start=null`，不得提示第 3 单元，且只记录实际完整读到的区间单元。现有代码第 148 行看似采用区间内 `nxt`，但测试只覆盖 `end=1` 的超长单元和 `1/1`、`12/12` 的 Agent 转发，未达到该验收面。
- Evidence：`4-test_read_bound_20261101_114236.py:164-200` 只断言 `next_offset` 与最终空值，未断言中间/完成后的 `next_start` 或区间截断；`1-materials.py:64-76,147-149` 未被执行证据覆盖。

### F3 — FAIL：合同 1.7 采用前提没有进入本轮可审证据

- Snapshot：`card.json` 的 `root_approved_contract_proposal`；`0-index.ts:3,845-853`；`1-materials.py:47-57`
- Trigger：真实 Agent 工具注册和 host 参数校验接收带 `end` 的 `case_read_material` 请求。
- Expected behavior：采用 `end` 前必须能看到合同 1.7 的生成器和 VERSION、Spec 20.12，以及工具参数 schema 明确接受可选 inclusive `end`；`more_names` 仍不得与 `end` 组合。`approved.json` 只列五份快照，`card.json` 明写“1.7 generator/VERSION/Spec20.12 required before adoption”，故本轮无法证明真实入口会接受该字段或版本已对齐。
- Evidence：`0-index.ts:3` 从共享 contracts 取工具参数，`0-index.ts:845-853` 原样注册并转发；批准文件没有 contracts、VERSION 或 Spec 快照。

### F4 — PASS：两个 Agent 入口都在预算前执行单单元守卫

- Snapshot：`0-index.ts:249-258,567-664,688-704`
- Trigger：辩护意见任务已答题并完成成功检索，随后在 `tool_calls=1` 上限调用缺失 `end`、`end != start`、非整数或 `start < 1` 的 `case_read_material`。
- Expected behavior：`preTool` 在 `state.beforeTool` 前拒绝；直接 `executeTool` 在 CoreClient 前再拒绝；两者都不增加工具预算或发送读取请求。无效调用覆盖不是把守卫移到 `end` 后才发生。
- Evidence：`0-index.ts:249-257` 定义守卫；`:627-630` 位于 `:644` 预算计数之前；`:703-704` 位于 `:711` CoreClient 调用之前。`3-defense-read-bound-20261101-114236.spec.ts:232-269` 覆盖八种无效输入与两条入口。

### F5 — PASS：`start=1,end=1`、单区间及未给 `end` 的旧行为

- Snapshot：`0-index.ts:249-257`；`1-materials.py:46-76`；`2-SKILL.md:36`
- Trigger：辩护任务读取第 1 页且写 `start:1,end:1`；非辩护任务或自由会话只给 `start`。
- Expected behavior：辩护任务允许单单元 inclusive 范围；非辩护旧调用继续采用省略 `end` 的原路径。Skill 明确 `start/end` 均写单元号，offset 续读保持同一范围。
- Evidence：`3-defense-read-bound-20261101-114236.spec.ts:272-293,339-354`；`4-test_read_bound_20261101_114236.py:112-154`；实现以 `end_present` 分流。

### F6 — PASS：区间选择、记账和输入不变性主体正确

- Snapshot：`1-materials.py:60-76,125-149`；`4-test_read_bound_20261101_114236.py:112-207,235-290`
- Trigger：读取 `start=1,end=1`、`start=2,end=3`、超长单单元，以及反向或越界范围。
- Expected behavior：只拼接请求区间内单元；完整读到的单元才 `_record`；超长单元完成前不记账；反向/越界不改变 reads、coverage 或输入文件。该实现中 `picked` 来自已按 `start/end` 过滤的 `rest`，`_read_part` 的候选 `nxt` 同样来自 `rest`。
- Evidence：测试通过真实 `ToolContext`/环境读取内容、源文件字节、`reads.json` 和 coverage；仅源码可见主体正确，F2 的区间续读分支仍缺执行证据。

### F7 — PASS：`more_names` 与 `end` 不混用

- Snapshot：`1-materials.py:42-43,82-87`
- Trigger：同时提交 `more_names` 和 `end`。
- Expected behavior：返回 `INVALID_ARGUMENT`，不产生读取或记账副作用。
- Evidence：`1-materials.py:86-87` 在任何材料读取前拒绝；`4-test_read_bound_20261101_114236.py:251-268` 校验失败前后记账快照不变。

### F8 — PASS：非辩护邻接路径与改动局部性

- Snapshot：`0-index.ts:249-258,566-664`；`2-SKILL.md:32-37`
- Trigger：合同审查、普通会话、其他材料读取，以及未成功检索或未答齐必问项的辩护调用。
- Expected behavior：单单元规则只按 `defenseSearchBeforePrimaryRead` 生效；必问门和成功检索门仍先于单单元校验；普通调用不被强制要求 `end`。修改集中在既有守卫/extract 分流和辩护 Skill 指示，未出现新工具或跨职责抽象。
- Evidence：`0-index.ts:621-630,699-704`；`3-defense-read-bound-20261101-114236.spec.ts:295-354`。

## 未读与不可证明范围

- 按令未读 Git、历史、其他项目、当前 jobs、合同文件、`task-state.ts`、Spec、VERSION、旧快照、真实运行记录或任何测试输出。
- 未运行测试，因此不复核既有红/绿结论、测试是否实际通过、真实 HTTP schema 行为、真实材料解析、coverage 聚合实现或性能。
- 五份快照足以指出上述源码风险，但不足以定谳真实端到端接线；也不证明事实选择、NLP 语义、引文真实性或辩护草稿质量。
- 未对任何未批准文件提出补丁，不据此放宽来源断言或守卫。
