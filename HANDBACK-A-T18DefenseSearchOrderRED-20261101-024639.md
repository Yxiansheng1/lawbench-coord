# HANDBACK-A T18 辩护主材料检索顺序 RED

## 状态

`AUTHORED_NOT_RUN`

独立 A 线已按执行令
`ORCH-A-T18DefenseSearchOrderRED-20261101-024639.md` 完成测试作者交付。
本运行未执行 Node、Vitest、TypeScript 检查、构建、收集、服务、HTTP、模型或运行时自测；
没有测试通过/失败的实际观测结果。请主编排在完整复核后执行 RED。

时限标记：`240s`。

## 新增文件

- 测试：
  `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-search-read-order-20261101-024639.spec.ts`
- 本交回件：
  `D:\Lawbeach\lawbench-coord\HANDBACK-A-T18DefenseSearchOrderRED-20261101-024639.md`

新测试大小：`13457` 字节。

新测试 SHA-256：
`6A6C63FC8833693A04E61B25E38085506B498811745B9C1272FBE097144C4EA2`

## 精确范围

只新增了上述 RED 测试和本正式交回件。产品源码、契约、Skill、配置、锁和既有 dirty 文件均未修改。
Git 严格只读且本运行未调用任何 Git 写入命令；没有 add、commit、rebase、stash、reset、clean、
checkout 或 push。交回以本协调目录文件为准，不是 Git 提交。

已核产品源码仍与审批清单固定值一致：

- `dsh-ext\agent\index.ts`
  - 字节数：`57836`
  - SHA-256：`A9A26FD6FFFC3FC458E6F04E18848AD035DB80E67723886E73D3F1425A815451`
- `dsh-ext\agent\task-state.ts`
  - 字节数：`24595`
  - SHA-256：`8C68EB6B99E36F774CDDD0F7CD30FB0441C27D3E55B01D6EB733381538A0D899`

## 测试口径

顶层描述精确为 `T18 defense primary read search order`，共 16 个案例：

1. 辩护任务答齐真实必问后，检索前以仅 `name` 读取材料应拒绝；拒绝原因含
   `case_search`，不进入预算且不转发 Core 读取。
2. 不先走 `preTool`，直接 `executeTool` 读取材料应拒绝，且不转发 Core 读取。
3. Core 检索报错不解锁材料读取。
4. 不符合结果契约的检索结果不解锁材料读取。
5. 成功且通过结果契约校验的检索后，显式 `start: 1` 放行读取并转发一次 Core 读取。
6. 检索成功后缺少 `start` 应拒绝。
7. 检索成功后 `start: 0` 应拒绝。
8. 检索成功后 `start: 1.5` 应拒绝。
9. 检索成功后字符串 `start: "1"` 应拒绝。
10. 检索成功后 `start: null` 应拒绝。
11. 会话 A 的成功检索不解锁同 Agent 的兄弟会话 B。
12. 成功检索不跨同一会话结束后的新 `TaskState` 延续。
13. 非辩护的 `contract-review` 仅名称读取原行为不变。
14. 辩护答齐必问后、检索前 `case_read_input` 仍放行。
15. 辩护答齐必问后、检索前 `case_read_wiki` 仍放行。
16. 辩护答齐必问后、检索前 `case_list_materials` 仍放行。

`start: 1` 按有效值处理；不要求大于 1、不匹配检索命中名称、不推断事实类别，也不强制整案读完。
测试只约束辩护主材料读取的“同当前任务一次成功检索 + 显式正整数 start”顺序。

## 实现边界

- 使用真实 `LegalAgent.preStep`、`preTool`、`executeTool` 和 `TaskState`。
- 复用既有原测试的真实必问问答流程：实际发起 `ask_user_question` 并观察最终成功答案，
  不修改私有已答 ID，不绕过问题门。
- Skill 必问元数据来自原 A 公共 Skill，经既有 `LawbenchRemote` / `skillQuestions` 私有
  Supervisor 路径读取。
- 测试读取审批允许的原搜索与读取结果样例，返回符合现有契约的结果。
- `MemoryCore` 只替代 Core 传输；没有 socket、服务、默认 app、假 NativeSession、R、历史或
  模型消息。
- 未引用任何未来新增导出、构造参数或属性，因此当前基线应因行为缺失而红，而非因 API 不存在、
  语法缺失或收集失败而红。

## 预期但未观测

按当前产品源码，预期 11 个顺序案例红、5 个控制案例绿；这是作者预期，不是实际测试计数。
实际通过/失败数须由主编排运行后记录。
