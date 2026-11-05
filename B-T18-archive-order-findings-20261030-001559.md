# 线 B：T18 归档工具顺序只读审计

## 1. 任务与结论

执行令：`B-T18-archive-order-review-order-20261030-001559.md`

状态：`SOURCE_ONLY / READONLY_AUDIT_COMPLETE / IMPLEMENTATION_NOT_RUN`。

结论先行：

1. 原始实际运行的失败已确认，不是证据误判。实际 53 个事件中，`skill(case-archiving)` 后直接调用
   `case_archive_match`，全程没有 `case_list_materials`。实际工具序列为
   `skill -> case_archive_match -> case_read_material -> case_read_material ->
   ask_user_question(失败) -> ask_user_question(成功) -> case_save_draft ->
   case_save_archive_plan`。
2. “先 LIST、后 MATCH”目前只写在 `skills/case-archiving/SKILL.md:40`，当前生产 Agent 没有任何归档专用的
   程序化顺序门禁。当前 `LegalAgent` 唯一的“先清单后读材料”程序门禁属于 `sentence-calc`。
3. 支持做有界修复，且不需要改 B Core、契约、路由、通用存储或模型预算。最窄缝是复用现有
   `TaskState.materialListConfirmed` 位：归档任务开始时打上专用工作流标记；在 `preTool` 和直接
   `executeTool` 两条入口都于 Core 调用前拒绝尚未成功列清单的 `case_archive_match`；仅在该任务真的收到
   Core 成功且通过 `$defs/result` 契约校验的 `case_list_materials` 后置位。
4. 当前 `case_save_archive_plan` 不需要纳入此次顺序门。所述失败是 LIST -> MATCH 顺序，不是保存方案本身；
   扩大为 SAVE 门会扩大行为面，也没有实际证据要求。
5. 实际运行中的四项人工业务问题成立，但不能把 QUESTION 文案检查、通用 NLP、文件名别名、全部 `F` 级
   citation hint 或法律结论自动认证混入这个最小顺序修复。原失败仍是原始失败，保留不改写、不放宽。

本审计不是产品 PASS、真实模型 PASS、完整 T18 PASS、Gate 1 通过、业务验收、法律意见认证或封装许可。
`T23` 仍为 `NOT_RUN`，Packaging 仍为 `HOLD`。

## 2. 既有实际证据复用

未重跑模型、HTTP、测试、构建或原始流程。以下均为读取既有证据所得的追溯核验。

原始运行：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq`

| 证据 | 结果 |
| --- | --- |
| 运行状态 | `FAILED`，`B_failure=archive_tool_order` |
| 耗时 / 驱动退出 | `68.156 s` / `1` |
| 模型 POST / HTTP 200 | `9 / 9` |
| 物理事件/行 | `53 events / 54 rows` |
| 实际工具计数 | `skill=1`、`case_archive_match=1`、`case_read_material=2`、`ask_user_question=2`、`case_save_draft=1`、`case_save_archive_plan=1` |
| `case_list_materials` | `0` |
| `case_archive_match` | seq 16 / result 17，成功 |
| 有效四问回答 | seq 36 / result 37，四项均在第一次成功保存前 |
| 最终草稿 | seq 41 / result 42，自动断言模型参数与持久化内容一致 |
| 归档方案 | seq 46 / result 47，13 字段，模型参数与持久化深度相等 |
| 归档方案文件 | 1589 B，SHA-256 `8d2947622d29ffe17a992686755f8dd2799de310c5eaf815fbe5abac5b91ef17` |
| 核对表 | 1725 B，SHA-256 `6619297fad0f980d9441d999e3e5e183c99bb45ab242154130ceed4c4c1d38d0` |
| 网络越界/凭据读取 | outbound `0/0`；key getter `0/0` |
| 清理 | listener/net/logs/retainer 均 closed；owned OS `{}`，Listen `0`，forced stop `false` |
| 未达验证 | SourceGET 和 production JSONL reopen 均为 `NOT_REACHED` |

失败判据在 `report.json` 原文为：

```text
actual tool loop lacks case_list_materials
```

原始实际运行的负向事实应永久保留，不能为转绿删掉“无 LIST”断言，也不能合成 LIST、历史或问答。

## 3. 当前源码事实

当前编译来源是 A 树，不是 B 树中较旧的 Agent 源。

| 角色 | 当前路径 | bytes | SHA-256 |
| --- | --- | ---: | --- |
| LegalAgent / tool hooks | `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 49572 | `140584362c259b6f2909f32f6c8489f47e447ceb2106db1475b76e3971c909ab` |
| TaskState | `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` | 22115 | `866a15366ba37b44f1c611c5b4ba48b51cf995f89b4931aaaf38e5bc1cb8cd99` |
| CoreClient | `D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts` | 3666 | `5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50` |
| B archive tools | `D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py` | 1957 | `f159e7e5e629df3f11554c35b10b432f0464ee67d73eae60d017988079311459` |
| B list/read tools | `D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py` | 7115 | `9122850f43ca96647fe8c3240c47000c55e395aba983c221e2fc79fcdc476a73` |
| B tool registry | `D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py` | 2594 | `83fe68104ebf5f8440205b7bc5be12dc52b31a7945bfcc6ca53ba35b30872f5a` |
| B core API | `D:\Lawbeach\lawbench-B\service\lawbench\api\core.py` | 2106 | `42d8ef7176d2624ff50f9bffc5d156f4f6a126c293f2f354e6fef7770719e988` |
| B endpoint wrapper | `D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py` | 14417 | `a9e9f4dd18cae7869847d56a3a15c992cc618ec3fe242a2e0302a169595ba09c` |
| B TaskStore/lifecycle | `D:\Lawbeach\lawbench-B\service\lawbench\case\task.py` | 40607 | `7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04` |
| B archive matcher | `D:\Lawbeach\lawbench-B\service\lawbench\archive\match.py` | 10304 | `a78631d5af5b49210a65bc5c2fc765d0f5dc7486d3f80b7f982e14864fd049df` |
| primary Skill | `D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md` | 16290 | `7ede544356b715f4aae7e4ebd54eb8e07ef4c7c6038590c47ad2a440c4caa7dd` |
| list contract | `D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json` | 876 | `b2fc83f73d69681f9c1197bf630c668e8d8fe81882cd4b4752601f21b12696c2` |
| match contract | `D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json` | 3505 | `24f5655a3f300cbe850f8e8ce939735c28dc0d523a9027c5247274450da5f0f5` |
| core tool contract | `D:\Lawbeach\lawbench-B\contracts\core\tool.schema.json` | 1300 | `4a726dd60f9de4d8199614411854c3276ac9448a4477054244ba903ddc9c534b` |

当前 admission 的 529 个 pin 中，上表关键行逐一存在且 bytes/SHA-256 与现场文件一致。命中的关键行包括
A `index.ts` 49572/`140584...`、A `task-state.ts` 22115/`866a15...`、B 服务行 346 个，以及 primary
Skill/工具契约行。

B 工作树中的旧 Agent 源不应误作当前编译来源：

```text
D:\Lawbeach\lawbench-B\dsh-ext\agent\index.ts       29056  34ce8356ae494ca7467f6a22b5da9b4c8db283adffff67d4e04301659d630863
D:\Lawbeach\lawbench-B\dsh-ext\agent\task-state.ts  12674  ec52bbd71135727a30f5dd853f9457d9fc0ed5c3777e28de330f1e4d3990d885
```

两者时间均为 `2026-10-19T14:49:30.1652506+08:00`，不是本次运行经 admission 绑定的当前 A 源。

## 4. 是否已有程序化 LIST -> MATCH

结论：没有。

- `SKILL.md:40` 明确要求先 `case_list_materials`，再 `case_archive_match`；这是模型指令，不是运行时门禁。
- `index.ts:135,475-477,547-549,567` 的程序化“先清单”只适用于 `sentenceWorkflow`，目标是保护
  `case_read_material`，不是归档 MATCH。
- `index.ts:115-124` 的 `REQUIRED_QUESTION_SKILLS` 是九类问题门集合，不含 `case-archiving`。不能把
  归档顺序修复偷换成全 Skill 问题门。
- `TaskState` 的 `materialListConfirmed` 只在 `noteSuccessfulMaterialList()` 中置位，
  `task-state.ts:253-257`；当前唯一调用者是 `index.ts:567` 的 sentence 分支。
- B `tools/archive.py:14-16` 的 `archive_match()` 只加载目录并调用 `am.match(ctx.root, ctx.index(), ...)`。
  它不调用 `case_list_materials`，也不检查此前是否调用过。
- B `tools/__init__.py:55-65` 对每个工具独立校验 args/result，没有跨工具顺序状态。
- B `api/core.py:24-30` 只定位当前 `task_id`、检查任务仍在 running，再构建 `ToolContext` 并执行工具。
- B `archive/match.py:95-146` 直接消费当前任务索引 `index["materials"]` 进行匹配；它没有读取调用历史。

因此，本次失败是“指令型流程约束未被执行”，不是错误材料结论。实际计划正确不能反证顺序要求已满足。

## 5. 精确生产成功形状与失败协议

### LIST 成功

B `tools/materials.py:16-22` 返回：

```json
{
  "materials": [
    {
      "material_id": "M0001",
      "name": "委托代理合同",
      "type": "txt",
      "status": "parsed",
      "unit": "line",
      "unit_count": 9,
      "is_ocr": "none",
      "stale_ocr": false,
      "error": null
    }
  ],
  "total": 1
}
```

结构契约在 `case_list_materials.schema.json:13-31`：顶层必须恰有 `materials` 和 `total`，
`materials[*]` 必须是 `common.schema.json#/$defs/material_row`。

B endpoint `api/ui.py:27-56` 把它包成 HTTP 200：

```json
{"ok": true, "value": {"materials": [], "total": 0}}
```

A `core-client.ts:7-8,32-71` 校验 Core 响应并返回 `{ok:true,value}`。随后
`index.ts:560-572` 在 `r.ok` 成功且 `validate(..., 'result', r.value)` 无错之后才可置位。

### LIST 失败

业务异常走 B `ApiError`：HTTP 200 的失败体为

```json
{"ok": false, "error": {"code": "MATERIAL_NOT_READY", "message": "<中文提示>"}}
```

例如 `materials.py:27-33` 在材料未就绪时抛 `MATERIAL_NOT_READY`。Core 失败或结果契约失败都会在
`index.ts:561-566` 先抛错，必须在该处之后才调用 `noteSuccessfulMaterialList()`；失败绝不能置位。

### MATCH 在 Core 前被拒

`tools/pre-execute` 的 DSH 决策为：

```ts
{ kind: 'deny', reason: '<固定中文恢复提示>' }
```

该拒绝在 `index.ts:498` 的 `beforeTool` 调用之前返回，因此不进入工具预算、不增加相同调用计数，也不发
HTTP。模型可在现有任务预算内改调真实的 `case_list_materials`。直接 `executeTool` 调用则必须在
`index.ts:560` 前 `throw new Error(reason)`，同样不发 Core。

建议唯一固定字面量为：

```text
案卷归档必须先调用 case_list_materials 取得本案的真实材料清单，再调用 case_archive_match。
```

## 6. 建议的最小生产缝

只改当前 A 的 `agent/index.ts`、`agent/task-state.ts`，不改 B Core。

1. 增加仅归档使用的常量 `ARCHIVE_SKILL = 'case-archiving'`。
2. 给 `TaskState` 增加 `readonly archiveWorkflow: boolean = false`，与现有 `sentenceWorkflow` 同级，
   `begin` 时从 `begin.value.skill` 固定。保留现有 `materialListConfirmed` 位，可共用于该归档专用标记；
   不新增通用状态机、持久化 store、队列或路由。
3. 在 `index.ts:330-336` 创建 TaskState 时传：

```ts
begin.value.skill === ARCHIVE_SKILL
```

4. 在 `preTool` 取得当前 state 后、`beforeTool` 和所有预算副作用之前加入：

```ts
if (state.archiveWorkflow && toolName === 'case_archive_match' &&
    !state.materialListConfirmedForReads) {
  return { kind: 'deny', reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL }
}
```

5. 在直接 `executeTool` 路径的 Core 调用前加入同义检查并抛固定中文错误，供绕过 `preTool` 的直接调用
   安全兜底。
6. 将 `index.ts:567` 的唯一置位条件改为 sentence 或 archive：

```ts
if (tool === 'case_list_materials' &&
    (state.sentenceWorkflow || state.archiveWorkflow)) {
  state.noteSuccessfulMaterialList()
}
```

这段必须保持在第 562-566 行的结果契约校验之后。

行为边界：

- 失败 LIST 不置位：Core `ok=false` 或 result contract 失败先抛。
- 自动 LIST 不做：拒绝后模型自行恢复；不伪造工具调用、历史或结果。
- 不增加预算：preTool 拒绝发生在 `beforeTool` 前；不新增模型/工具次数。
- 任务隔离：`TaskState` 对象持有布尔位；新 `begin` 创建新对象，旧任务结果只落在其闭包捕获的旧对象。
- 案件/会话隔离：工具回调在 `executeTool` 开头取得当前 agent 对应的 state；`TaskState` 固定 `taskId/caseId/sessionId`；
  B `ToolContext` 的 `ctx.index()` 来自当前 `task_id`，不跨案复用。
- R 隔离：原生 `R` 只参与 begin 选择/scope，不进入该工具观察位；没有新增 Host/R 通道。
- 迟到结果：`const state = ...` 在 `await core.call` 前固定；新任务替换 `tasks` map 中引用，旧 promise
  完成后不会写新 state。此项是从源码语义推得，尚无本轮运行测试。
- `case_archive_match` 之外的行为不变，`case_save_archive_plan`、其他 Skill、问题和预算路径均不扩展。

## 7. 建议的主编排有限验证卡

本轮 `STRICT_NOT_RUN`，以下只是实施后的最小验证建议：

| 卡 | 预期 |
| --- | --- |
| `case-archiving` 的 `archive_match` 在成功 LIST 前调用 | preTool deny；Core tool 调用数仍为 0；工具预算不增加 |
| 绕过 preTool 直接 `executeTool(archive_match)` | 抛同一固定中文错误；Core 调用仍为 0 |
| LIST 失败 | 不置位；随后 MATCH 仍 deny |
| Core LIST 成功但 result 契约错误 | 不置位；随后 MATCH 仍 deny |
| LIST 成功 / result 契约通过 | 置位；随后 MATCH 放行且只调用一次 |
| 新 begin 后旧任务的迟到成功 LIST | 不武装新任务 |
| 取消/失败后同任务再试 | 未成功前仍 deny；成功后按正常预算放行 |
| 非归档 Skill 调 MATCH | 不受 archiveWorkflow 影响；现有行为不变 |
| `sentence-calc` | 原有“先清单后读材料”行为逐字不变 |
| tool call 次数 | 被 preTool 拒的 MATCH 不增工具预算，不消额外模型/工具预算 |

不得用自动 LIST、预置成功结果、人工 MID、假历史、放宽“无 LIST 为失败”断言或改模型/参数/预算来转绿。

## 8. 人工业务问题：确认项与可执行边界

业务复核输入 SHA-256 为
`6f5e53fe0baa0b74f5ad9f8fa601a6ff1b1321f27a39115490a23452011d87bf`。

| 问题 | 确认事实 | 是否可本卡程序化 |
| --- | --- | --- |
| 有效四问缺提取信息展示 | seq 31 的无效三问含委托人、对方、案由、双日期及材料行号，但 result 32 被必问 ID gate 拒绝且从未得到回答；seq 36 的有效四问只有两个逐项问题加两项选择，未展示已提取信息与出处 | **不能稳健纳入本次最小门**。现有 question payload 没有“提取字段/出处/已提供值”的结构化槽；靠扫中文 problem/question 文本会变成 NLP 补丁。 |
| 已提供 JZL 仍被问“编号是多少” | seq 36 `jzl_no.question` 为“金助理系统的案件编号是多少？（您在任务说明里提供的是 JZL-2026-0815）”；skill 要求已给项只请确认 | **不能只靠现有通用 question gate 做**。必需 ID gate 只验证 ID 覆盖和答案非空，`task-state.ts:263-344`；它不携带律师已提供的结构化值。不得以字符串近似替代。 |
| TXT 委托合同未提示补盖章 PDF | `index.json` 中 `M0001 委托代理合同` 为 `type=txt`；核对表和可见答复无“补盖章扫描版 PDF”提示。答复却说程序会把“非 PDF”转 PDF | **可做确定性识别，但不能认证已盖章**。`save_archive_plan` 的 `check_plan()` 已能按 plan 项和材料索引取到 `type`，结果契约已有 `warnings:string[]`；可另派精确规则提示“第 1 项原件类型不是 PDF，请补盖章扫描版”，但这不是本次 LIST 顺序门，也不得升级为自动合法性通过。 |
| 没有可见逐项自检 | 核对表 25 行只有信息、匹配表、缺失项、忽略项；最终答复有完成摘要和下一步，但没有按自检清单逐项写“通过/问题与处理” | **不宜靠扫自由文本强制**。当前草稿和答复没有结构化 selfcheck 字段；要机器强制需另立明确运行时/契约设计，不能混入序列门。 |
| 计划中的专业判断 | `opinion` 写“事实清楚、证据充分、实现委托人诉讼目的”等，属于专业评价 | **必须律师复核**；不得自动认证法律 merit，不能把 `citation_check.passed=true` 或 `missing_required=[]` 当作 merit 或格式全部就绪证明。 |

补充限定：

- `citation_check` 的两个 `F/hint` 不自动致命；没有 must-fix 不能代替逐项自检。
- `missing_required=[]` 只表示当前方案没有漏掉目录必交项，不证明文件是可归档的盖章扫描版。
- 最终保存计划内容在四项已答后生成，日期、当事人、材料 ID 和实际持久化均通过自动一致性断言；这些是可复用正向事实。
- 上述人工问题需要律师/主编排决定后续范围；当前不得扩成通用 NLP、文件名别名、golden facts、全 `F` fatal 或第十道全局门。

## 9. 冻结、dirty 与准入保全

### dirty 42

快照：

`D:\Lawbeach\lawbench-coord\T18ArchiveNativeInput-20261029-231046\B-tracked-dirty-pins.json`

- 快照 7799 B，SHA-256 `c30181281ca038dd3beeea58af06d6f6a17bd96a6517cc9b3a83959e30522399`。
- 42/42 行的当前文件均存在，bytes 与 SHA-256 全部一致，0 个 mismatch。
- admission 记录 `tracked_dirty42_held=true`。
- 后续只读 `git -c submodule.recurse=false status --short --branch --ignore-submodules=all`
  显示分支 `line-B`、HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`，原有 tracked/untracked dirty
  大量保留。初始默认 `git status` 曾因受限
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 返回 permission denied；没有修锁、
  改 ACL、扩权或绕过 writer。

### current private 25

目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\private-output-20261029-221202`

- 文件数：25。
- `manifest.json`：58195 B，SHA-256
  `7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851`。
- admission `private25_exact=true`，`legacy18_held=true`。

### admission

输入 `T18-archive-native-admission-current.json`：

- Verdict：`ADMITTED_ONE_ORIGINAL_ARCHIVE_NATIVE_WORKFLOW`
- Pin count：529
- Original rows：15
- Baseline rows：459
- New rows：54
- Source B rows：346
- ESM lexical/scoped bindings：PASS
- dirty42 held：true
- private25 exact：true
- legacy18 held：true
- answers not preloaded：true
- full consumer typecheck：false
- admission 时 actual model not started

因此 full consumer typecheck 不能由本次复用证据宣称通过；实际运行由已封存的原始运行单独证明发生了模型调用。

## 10. 证据哈希

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `T18-archive-native-admission-current.json` | 124433 | `48142ff62345884521e02d5c376a672b1bb147e2f320d453ec77088bf33f6baa` |
| `T18-archive-native-actual-root-closed-current.json` | 49104 | `9f489d819ab2d647e64cb6ae15a9068b7483f270448778995c60e4787d6a0195` |
| `T18-archive-actual-manual-business-review-current.json` | 2415 | `6f5e53fe0baa0b74f5ad9f8fa601a6ff1b1321f27a39115490a23452011d87bf` |
| `run-tePzKq\report.json` | 36562 | `63d27a2cb4aa78b52a4a18f43c6ebbc4efbb6cdfb5601cf13399db715fd43f61` |
| `run-tePzKq\b-service-final.json` | 15234 | `d34666f667d0846cfabb9e1a094277894b2f6737bb4a6199d5412ac67cf4621c` |
| 核对表 `归档核对表-v1.md` | 1725 | `6619297fad0f980d9441d999e3e5e183c99bb45ab242154130ceed4c4c1d38d0` |
| 归档方案 `归档方案.json` | 1589 | `8d2947622d29ffe17a992686755f8dd2799de310c5eaf815fbe5abac5b91ef17` |
| `native-archive.mts` | 170355 | `279f3d3cd49e06a801aaa363c3b95d493b9f305e7d3c4a67b3f4c34454b6f76b` |
| `b-service-archive.py` | 54781 | `b6d1d7b695b0a31aa1359bc2d9341ffa0b8e0bcefc4d9c743889228839e39bac` |

原始失败封存 manifest：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18ArchiveActualFailure-root-20261030-001559`

SHA-256：

`6bf29136200e908150a3f9a616c266a4e01438ef0850230ccaaebe67ef9fe571`

## 11. 写入面、歧义和停止点

本轮唯一允许的新文件：

1. `D:\Lawbeach\lawbench-coord\B-T18-archive-order-findings-20261030-001559.md`
2. `D:\Lawbeach\lawbench-coord\B-handback-T18-archive-order-review-20261030-001559.md`

产品、测试、fixtures、Skills、contracts、private25、runtime、params、served roots 均冻结；没有产品源码修改。
没有新增/替换证据、未改原始失败、未改工单集、未写 Git 提交。

没有需要靠自行拍板解决的歧义；待主编排裁决的是是否按第 6 节下发最小顺序修复，以及第 8 节的人工业务问题是否另立
明确范围。

## 12. STRICT_NOT_RUN

本轮没有运行：

- Node、Python、AST parser、import check、类型检查、测试或构建；
- 任何 HTTP、模型、GUI、环境 Key、DPAPI、SSH 或进程探测；
- 任何 Git add/commit/rebase/stash/reset/clean/checkout/push；
- 任何 setup、安装、私建运行时重建、writer 锁处理、沙箱/审批/ACL 改动；
- 任何产品运行、SourceGET、production JSONL reopen 验证或新的原始归档流程；
- 任何外部消息、其他聊天联系、其他作者或四线总线的占用。

## 13. 审计阶段原始命令账

以下账覆盖本审计落盘前的 81 次 `exec_command`：78 次退出码 0，3 次退出码 1。全部显式使用
`shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、
`login=false` 和 managed 隔离；没有 bash/cmd 或短名 pwsh。

3 次非零：

- 第 6 条：PowerShell 对管道中的 `foreach` 解析失败（exit 1），无写入；随后改写成可解析形式。
- 第 50 条：全协调目录递归 `Select-String` 在已取得所需命中后由本执行者 Ctrl-C 终止（exit 1），无写入。
- 第 61 条：同样的管道 `foreach` ParserError（exit 1），无写入；随后改写成 `$rows = & { ... }`。

### 1

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-archive-order-review-order-20261030-001559.md'
```

### 2

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ArchiveNativeInput-20261029-231046\B-tracked-dirty-pins.json'
```

### 3

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

### 4

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

### 5（overall exit 0；内部 Git 子模块 permission diagnostic）

```powershell
git status --short --branch; git rev-parse HEAD; git diff --stat; git diff --cached --stat
```

### 6（exit 1）

```powershell
$docs = @('D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-actual-manual-business-review-current.json'); foreach ($doc in $docs) { $obj = Get-Content -Raw -LiteralPath $doc | ConvertFrom-Json; [pscustomobject]@{File=[IO.Path]::GetFileName($doc); Type=$obj.GetType().Name; Properties=($obj.PSObject.Properties.Name -join ', ')} } | Format-List
```

### 7

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq' -Recurse -File | Select-Object FullName,Length | Format-Table -AutoSize
```

### 8

```powershell
$p = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json'; $o = Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; $o.PSObject.Properties.Name; if ($o.report) { $o.report.PSObject.Properties.Name }; if ($o.PSObject.Properties.Name -contains 'final_response') { $o.final_response }
```

### 9

```powershell
$p = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\b-service-final.json'; $o = Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; $o.PSObject.Properties.Name; Format-List -InputObject $o
```

### 10

```powershell
$docs = @('D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-actual-manual-business-review-current.json'); $rows = & { foreach ($doc in $docs) { $obj = Get-Content -Raw -LiteralPath $doc | ConvertFrom-Json; [pscustomobject]@{File=[IO.Path]::GetFileName($doc); RootType=$obj.GetType().Name; Properties=($obj.PSObject.Properties.Name -join ', ')} } }; $rows | Format-List
```

### 11

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-actual-manual-business-review-current.json'
```

### 12

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Status=$o.status; AuthoredStatus=$o.authoredStatus; Error=($o.error | ConvertTo-Json -Depth 8 -Compress); TaskSettlement=($o.taskSettlement | ConvertTo-Json -Depth 8 -Compress); ManualAcceptance=($o.manualAcceptance | ConvertTo-Json -Depth 8 -Compress); Claims=($o.claims | ConvertTo-Json -Depth 8 -Compress); Cleanup=($o.cleanup | ConvertTo-Json -Depth 8 -Compress); Network=($o.networkSummary | ConvertTo-Json -Depth 8 -Compress); ModelPosts=($o.modelPosts | ConvertTo-Json -Depth 5 -Compress)} | Format-List
```

### 13

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{PromptSha256=$o.prompt.sha256; PromptChars=$o.prompt.chars; PromptExact=$o.prompt.exact; ApiCallCount=@($o.apiCalls).Count; EventCount=$o.modelPosts.events; ToolSequence=($o.bService.protocol.toolSequence -join ' -> '); ArchiveMatchArgs=($o.bService.protocol.archiveMatchArgs | ConvertTo-Json -Depth 8 -Compress); ArchiveMatchResults=($o.bService.protocol.archiveMatchResults | ConvertTo-Json -Depth 8 -Compress); ArchivePlanArgs=($o.bService.protocol.archivePlanArgs | ConvertTo-Json -Depth 8 -Compress); ArchivePlanResults=($o.bService.protocol.archivePlanResults | ConvertTo-Json -Depth 8 -Compress); Violations=($o.bService.protocol.violations -join '; ')} | Format-List
```

### 14

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Verdict=$o.verdict; Run=$o.run; Elapsed=$o.elapsed_s; DriverExit=$o.driver_exit_code; Status=$o.status; Error=$o.error; ActualToolCounts=($o.actual_tool_counts | ConvertTo-Json -Depth 8 -Compress); ActualTools=($o.actual_tools | ConvertTo-Json -Depth 12 -Compress); ActualQuestions=($o.actual_questions | ConvertTo-Json -Depth 12 -Compress); ActualAnswers=($o.actual_answers | ConvertTo-Json -Depth 12 -Compress); FourAnswersBeforeFirstSave=$o.actual_four_answers_before_first_save; Task=($o.task | ConvertTo-Json -Depth 12 -Compress); NativeSession=($o.native_session | ConvertTo-Json -Depth 12 -Compress); NativeRequest=($o.native_request | ConvertTo-Json -Depth 12 -Compress)} | Format-List
```

### 15

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Plan=($o.plan | ConvertTo-Json -Depth 12 -Compress); ArchiveMatch=($o.archive_match | ConvertTo-Json -Depth 12 -Compress); FinalDraft=($o.final_draft | ConvertTo-Json -Depth 12 -Compress); ProductionSourceGETs=$o.production_sourceGETs; ProductionJSONLReopen=$o.production_JSONL_reopen; BPassed=$o.B_passed; BFailure=$o.B_failure; BProtocol=($o.B_protocol | ConvertTo-Json -Depth 12 -Compress); BCloseFlags=($o.B_close_flags | ConvertTo-Json -Depth 8 -Compress)} | Format-List
```

### 16

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Verdict=$o.verdict; Consumer=$o.consumer; ConsumerSha256=$o.consumer_sha256; Service=$o.service; ServiceSha256=$o.service_sha256; ManifestSha256=$o.manifest_sha256; PinCount=$o.pin_count; OriginalRows=$o.original_rows; BaselineRows=$o.baseline_rows; NewRows=$o.new_rows; ExplicitRebindings=($o.explicit_two_source_rebindings | ConvertTo-Json -Depth 10 -Compress); SourceBRows=($o.source_B_rows | ConvertTo-Json -Depth 12 -Compress); Dirty42Held=$o.tracked_dirty42_held; FullConsumerTypecheck=$o.full_consumer_typecheck; Private25Exact=$o.private25_exact; Legacy18Held=$o.legacy18_held; ActualModelStarted=$o.actual_model_started} | Format-List
```

### 17

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\sessions' -File -Recurse | ForEach-Object { $_.FullName }; Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务' -File -Recurse | ForEach-Object { $_.FullName }
```

### 18

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\agent' -File | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

### 19

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\dsh-ext\agent' -File | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

### 20

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\tools' -File | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize; Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case' -File | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
```

### 21

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\contracts' -Recurse -File | Where-Object { $_.Name -match 'tool|skill|archive' } | Select-Object FullName,Length | Format-Table -AutoSize
```

### 22

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts' -Pattern 'class |interface |type |TaskState|ToolRuntime|ToolRuntime|LegalAgent|case_list_materials|case_archive_match|case_save_archive_plan|/core/tool|toolCall|tool_result|toolResult|toolSequence|Skill|skill' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 23

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\app.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py' -Pattern 'case_list_materials|case_archive_match|case_save_archive_plan|archive|list_materials|Tool|tool|task|session|request' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 24

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md' -Pattern '^#|^##|case_list_materials|case_archive_match|case_save_archive_plan|自检|问题|失败|确认|PDF|TXT|第2步|步骤' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 25

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\skills\case-archiving' -Recurse -File | Select-Object FullName,Length | Format-Table -AutoSize
```

### 26

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' -Pattern 'def begin|def locate|def end|def progress|def index_for_task|def rel|skill|request_id|state|result.json|task.json|finished|running' -CaseSensitive:$false | Select-Object LineNumber,Line | Format-List
```

### 27

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py','D:\Lawbeach\lawbench-B\service\lawbench\errors.py' -Pattern 'def _endpoint|ApiError|ok|value|error|response|status_code|JSONResponse|except' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 28

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext' -Recurse -File | Select-String -Pattern 'case_archive_match|case_list_materials' -CaseSensitive | Select-Object Path,LineNumber,Line | Format-List
```

### 29

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench' -Recurse -File -Filter '*.py' | Select-String -Pattern 'case_archive_match|case_list_materials' -CaseSensitive | Select-Object Path,LineNumber,Line | Format-List
```

### 30

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts'; $lines=Get-Content -LiteralPath $p; $ranges=@(@(95,170),@(185,360)); foreach($r in $ranges){ for($i=$r[0];$i -le $r[1];$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 31

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts'; $lines=Get-Content -LiteralPath $p; $ranges=@(@(430,575),@(650,760)); foreach($r in $ranges){ for($i=$r[0];$i -le $r[1];$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 32

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts'; $lines=Get-Content -LiteralPath $p; $ranges=@(@(1,180),@(180,420)); foreach($r in $ranges){ for($i=$r[0];$i -le $r[1];$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 33

```powershell
$paths=@('D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts','D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py'); foreach($p in $paths){ 'FILE: '+$p; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 34

```powershell
$paths=@('D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json','D:\Lawbeach\lawbench-B\contracts\api\materials_list.schema.json','D:\Lawbeach\lawbench-B\contracts\examples\tool_list.result.json','D:\Lawbeach\lawbench-B\contracts\core\tool.schema.json'); foreach($p in $paths){ 'FILE: '+$p; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 35

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\tools' -File | Select-Object Name,Length | Format-Table -AutoSize
```

### 36

```powershell
$p='D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le 60;$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] }; $p='D:\Lawbeach\lawbench-B\service\lawbench\errors.py'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] }
```

### 37

```powershell
$p='D:\Lawbeach\lawbench-B\service\lawbench\case\task.py'; $lines=Get-Content -LiteralPath $p; $ranges=@(@(280,390),@(476,490),@(719,780)); foreach($r in $ranges){ for($i=$r[0];$i -le $r[1];$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] } }
```

### 38

```powershell
$p='D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,5}: {1}' -f $i,$lines[$i-1] }
```

### 39

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts','D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts' -Pattern 'case_archive_match|case_save_archive_plan|archive' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 40

```powershell
Select-String -Path 'D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py' -Pattern 'materialList|list_material|case_list_materials|archive_match' -CaseSensitive | Select-Object Path,LineNumber,Line | Format-List
```

### 41

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts'; Select-String -LiteralPath $p -Pattern 'async request|begin.value.skill|TOOL_NAMES|toolDescription|toolParameters' | Select-Object LineNumber,Line | Format-List
```

### 42

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{SessionProperties=($o.session.PSObject.Properties.Name -join ', '); BServiceProperties=($o.bService.PSObject.Properties.Name -join ', '); ProcessProperties=($o.process.PSObject.Properties.Name -join ', '); ApiCalls=($o.apiCalls | ConvertTo-Json -Depth 6 -Compress)} | Format-List
```

### 43

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\材料\index.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; $o.materials | Select-Object material_id,name,type,status,unit,unit_count,is_ocr | Format-Table -AutoSize
```

### 44

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务\T-20261030001203-fe4f\草稿\归档核对表-v1.md'; Select-String -LiteralPath $p -Pattern 'PDF|盖章|自检|通过|问题与处理|缺失|律师费|律师确认|金助理' | Select-Object LineNumber,Line | Format-List
```

### 45

```powershell
$root='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq'; $needles=@('归档核对表','案件信息','已足额收取','承办律师未填','下一步','确认保存','自检'); Get-ChildItem -LiteralPath $root -Recurse -File -Include '*.json','*.jsonl','*.log','*.md' | Select-String -Pattern $needles -SimpleMatch | Select-Object Path,LineNumber,Line | Format-List
```

### 46

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务\T-20261030001203-fe4f\草稿\归档核对表-v1.md'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 47

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务\T-20261030001203-fe4f\归档方案.json'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 48

```powershell
$p='D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md'; $lines=Get-Content -LiteralPath $p; for($i=30;$i -le 58;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }; for($i=108;$i -le 115;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 49

```powershell
$p='D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{FinalStatus=$o.status; AuthoredStatus=$o.authoredStatus; Claims=($o.claims | ConvertTo-Json -Depth 6 -Compress); Manual=($o.manualAcceptance | ConvertTo-Json -Depth 6 -Compress); BServiceFinal=($o.bService.final | ConvertTo-Json -Depth 8 -Compress)} | Format-List
```

### 50（exit 1：已取得命中后主动 Ctrl-C）

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -Recurse -File | Select-String -SimpleMatch '7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851' | Select-Object Path,LineNumber,Line | Format-List
```

### 51

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A' -Recurse -File -Filter '*manifest*' -ErrorAction SilentlyContinue | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
```

### 52

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456' -Recurse -File -Filter '*manifest*' | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
```

### 53

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ArchiveNativeInput-20261029-231046' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ArchiveNativeInput-20261029-231046\B-tracked-dirty-pins.json' | Format-List
```

### 54

```powershell
$paths=@('D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts','D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts','D:\Lawbeach\lawbench-A\dsh-ext\shared\contracts.ts','D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py','D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py','D:\Lawbeach\lawbench-B\service\lawbench\archive\match.py','D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md','D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json','D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json','D:\Lawbeach\lawbench-B\contracts\core\tool.schema.json'); $paths | ForEach-Object { $f=Get-Item -LiteralPath $_; $h=Get-FileHash -Algorithm SHA256 -LiteralPath $_; [pscustomobject]@{Path=$_.Substring(13);Bytes=$f.Length;SHA256=$h.Hash.ToLowerInvariant()} } | Format-Table -AutoSize
```

### 55

```powershell
$root='D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\private-output-20261029-221202'; Get-ChildItem -LiteralPath $root -Recurse -File | Measure-Object | Select-Object Count; Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $root 'manifest.json') | Format-List; Get-Item -LiteralPath (Join-Path $root 'manifest.json') | Select-Object FullName,Length,LastWriteTime | Format-List
```

### 56

```powershell
$root='D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\private-output-20261029-221202'; $o=Get-Content -Raw -LiteralPath (Join-Path $root 'manifest.json') | ConvertFrom-Json; [pscustomobject]@{Properties=($o.PSObject.Properties.Name -join ', '); Files=($o.files | Measure-Object).Count; Pins=($o.pins | Measure-Object).Count; ApprovedInputs=($o.approvedInputs | Measure-Object).Count; RuntimeFiles=($o.runtime | Measure-Object).Count} | Format-List; $o | ConvertTo-Json -Depth 2 -Compress
```

### 57

```powershell
$names=@('D:\Lawbeach\lawbench-coord\B-T18-archive-order-findings-20261030-001559.md','D:\Lawbeach\lawbench-coord\B-handback-T18-archive-order-review-20261030-001559.md'); $names | ForEach-Object { [pscustomobject]@{Path=$_;Exists=Test-Path -LiteralPath $_} } | Format-Table -AutoSize
```

### 58

```powershell
$paths=@('D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts','D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts','D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py','D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py','D:\Lawbeach\lawbench-B\service\lawbench\archive\match.py','D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md','D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json','D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json','D:\Lawbeach\lawbench-B\contracts\core\tool.schema.json'); foreach($p in $paths){ $f=Get-Item -LiteralPath $p; $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant(); Write-Output ($f.Length.ToString()+'|'+$h+'|'+$p) }
```

### 59

```powershell
$p='D:\Lawbeach\lawbench-B\service\lawbench\archive\match.py'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le 80;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 60

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\shared\contracts.ts'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 61（exit 1）

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; $targets=@('D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts','D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py','D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py','D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md','D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json','D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json'); foreach($t in $targets){ $row=@($o.pin_rows) | Where-Object { $_.path -eq $t } | Select-Object -First 1; [pscustomobject]@{Path=$t;Found=($null -ne $row);Bytes=$row.bytes;SHA256=$row.sha256} } | Format-List
```

### 62

```powershell
$base='D:\Lawbeach\lawbench-coord\T18ArchiveTaskSymbolInput-20261030-000456'; Get-ChildItem -LiteralPath $base -File | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize; $candidates=@((Join-Path $base 'native-archive.mts'),(Join-Path $base 'root-reviewed-manifest-blueprint-v2.json'),(Join-Path $base 'literalfixed-inputs.json')); foreach($p in $candidates){ if(Test-Path -LiteralPath $p){ $h=Get-FileHash -Algorithm SHA256 -LiteralPath $p; Write-Output ($h.Hash.ToLowerInvariant()+'|'+$p) } }
```

### 63

```powershell
$p='D:\Lawbeach\lawbench-B\service\lawbench\archive\match.py'; $lines=Get-Content -LiteralPath $p; for($i=90;$i -le 205;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 64

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; $targets=@('D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts','D:\Lawbeach\lawbench-B\service\lawbench\tools\archive.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py','D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py','D:\Lawbeach\lawbench-B\service\lawbench\api\core.py','D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py','D:\Lawbeach\lawbench-B\skills\case-archiving\SKILL.md','D:\Lawbeach\lawbench-B\contracts\tools\case_list_materials.schema.json','D:\Lawbeach\lawbench-B\contracts\tools\case_archive_match.schema.json'); $rows=& { foreach($t in $targets){ $row=@($o.pin_rows) | Where-Object { $_.path -eq $t } | Select-Object -First 1; [pscustomobject]@{Path=$t;Found=($null -ne $row);Bytes=$row.bytes;SHA256=$row.sha256} } }; $rows | Format-List
```

### 65

```powershell
$p='D:\Lawbeach\lawbench-B\contracts\tools\case_save_archive_plan.schema.json'; Select-String -LiteralPath $p -Pattern 'warnings|missing_required|items|materials|result' | Select-Object LineNumber,Line | Format-List
```

### 66

```powershell
$p='D:\Lawbeach\lawbench-coord\B-handback-T18-sentence-observer-fix-20261029-222220.md'; $lines=Get-Content -LiteralPath $p; for($i=1;$i -le $lines.Count;$i++){ '{0,4}: {1}' -f $i,$lines[$i-1] }
```

### 67

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\skills\case-archiving\catalogs' -File -Filter '*.json' | ForEach-Object { $o=Get-Content -Raw -LiteralPath $_.FullName | ConvertFrom-Json; $item=$o.items | Where-Object { $_.code -eq 1 } | Select-Object -First 1; [pscustomobject]@{Catalog=$_.BaseName;Code=$item.code;Name=$item.name;Keywords=($item.keywords -join ',');Folders=($item.folders -join ',')} } | Format-Table -AutoSize
```

### 68

```powershell
$paths=@('D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json','D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-actual-manual-business-review-current.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\report.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\b-service-final.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务\T-20261030001203-fe4f\草稿\归档核对表-v1.md','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\run-tePzKq\case\工作区\任务\T-20261030001203-fe4f\归档方案.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\native-archive.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456\b-service-archive.py'); foreach($p in $paths){ $f=Get-Item -LiteralPath $p; $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant(); Write-Output ($f.Length.ToString()+'|'+$h+'|'+$p) }
```

### 69

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{PhysicalRows=$o.physical_rows;Events=$o.events;ModelPOST=$o.model_POST;HTTP200=$o.model_HTTP200;OwnedOSAfter=$o.owned_OS_after;ListenerPort=$o.listener_port;ListenCount=$o.Listen_count;ForcedStop=$o.forced_stop;Original15Held=$o.original15_SHA_size_mtime_ns_held;AdmissionRowsHeld=$o.fixed_admission_rows_held;Private25Held=$o.private25_held;KeyScan=$o.owned_text_key_scan;T23=$o.T23;BusinessAllPass=$o.business_quality_all_PASS;WholeProjectPass=$o.whole_project_PASS;Packaging=$o.Packaging} | Format-List
```

### 70

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-admission-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Verdict=$o.verdict;PinCount=$o.pin_count;OriginalRows=$o.original_rows;BaselineRows=$o.baseline_rows;NewRows=$o.new_rows;SourceBRows=$o.source_B_rows;Dirty42Held=$o.tracked_dirty42_held;ScopedBindings=$o.ESM_lexical_and_scoped_bindings_PASS;FullConsumerTypecheck=$o.full_consumer_typecheck;Private25Exact=$o.private25_exact;Legacy18Held=$o.legacy18_held;AnswersNotPreloaded=$o.answers_not_preloaded_into_business_model;ActualModelStarted=$o.actual_model_started;T23=$o.T23_generation;Packaging=$o.Packaging} | Format-List
```

### 71

```powershell
$p='D:\Lawbeach\lawbench-coord\T18ArchiveOrderReviewInput-20261030-001559\T18-archive-native-actual-root-closed-current.json'; $o=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json; [pscustomobject]@{Run=$o.run;Elapsed=$o.elapsed_s;Status=$o.status;Error=($o.error | ConvertTo-Json -Compress);ActualToolCounts=($o.actual_tool_counts | ConvertTo-Json -Compress);ActualQuestions=@($o.actual_questions).Count;ActualAnswers=@($o.actual_answers).Count;FourBeforeFirstSave=$o.actual_four_answers_before_first_save;ProductionSourceGETs=$o.production_sourceGETs;ProductionJSONLReopen=$o.production_JSONL_reopen;Failure=$o.B_failure;BOutbound=($o.B_outbound | ConvertTo-Json -Compress);BCredentials=($o.B_credentials | ConvertTo-Json -Compress);BClose=($o.B_close_flags | ConvertTo-Json -Compress)} | Format-List
```

### 72

```powershell
$paths=@('D:\Lawbeach\lawbench-B\dsh-ext\agent\index.ts','D:\Lawbeach\lawbench-B\dsh-ext\agent\task-state.ts'); foreach($p in $paths){ $f=Get-Item -LiteralPath $p; $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant(); Write-Output ($f.Length.ToString()+'|'+$h+'|'+$f.LastWriteTime.ToString('o')+'|'+$p) }
```

### 73

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\agent','D:\Lawbeach\lawbench-A\dsh-ext\host','D:\Lawbeach\lawbench-A\dsh-ext\shared','D:\Lawbeach\lawbench-A\dsh-ext\session-store','D:\Lawbeach\lawbench-A\dsh-ext\credentials' -File -Filter '*.ts' | Select-String -Pattern 'case_archive_match|case_list_materials' -CaseSensitive | Select-Object Path,LineNumber,Line | Format-List
```

### 74

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\agent','D:\Lawbeach\lawbench-A\dsh-ext\host','D:\Lawbeach\lawbench-A\dsh-ext\shared','D:\Lawbeach\lawbench-A\dsh-ext\session-store','D:\Lawbeach\lawbench-A\dsh-ext\credentials' -File -Filter '*.ts' | Select-String -Pattern 'archiveWorkflow|materialListConfirmed|noteSuccessfulMaterialList' -CaseSensitive | Select-Object Path,LineNumber,Line | Format-List
```

### 75

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench' -Recurse -File -Filter '*.py' | Select-String -Pattern 'archiveWorkflow|materialListConfirmed|case_archive_match.*case_list_materials|case_list_materials.*case_archive_match' -CaseSensitive:$false | Select-Object Path,LineNumber,Line | Format-List
```

### 76

```powershell
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts' -Pattern "const REQUIRED_QUESTION_SKILLS|archive|SENTENCE_CALC_SKILL|QUESTION_GATED_TOOLS" -CaseSensitive:$false | Select-Object LineNumber,Line | Format-List
```

### 77

```powershell
git -c submodule.recurse=false status --short --branch --ignore-submodules=all
```

### 78

```powershell
git -c submodule.recurse=false rev-parse HEAD
```

### 79

```powershell
git -c submodule.recurse=false diff --stat --ignore-submodules=all
```

### 80

```powershell
git -c submodule.recurse=false diff --cached --stat --ignore-submodules=all
```

### 81

```powershell
$snapshot='D:\Lawbeach\lawbench-coord\T18ArchiveNativeInput-20261029-231046\B-tracked-dirty-pins.json'; $rows=Get-Content -Raw -LiteralPath $snapshot | ConvertFrom-Json; $bad=@(); foreach($r in $rows){ $p=Join-Path 'D:\Lawbeach\lawbench-B' $r.path; if(-not (Test-Path -LiteralPath $p)){ $bad += [pscustomobject]@{Path=$r.path;Reason='missing'}; continue }; $f=Get-Item -LiteralPath $p; $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant(); if($f.Length -ne $r.bytes -or $h -ne $r.sha256){ $bad += [pscustomobject]@{Path=$r.path;Reason='mismatch';ExpectedBytes=$r.bytes;ActualBytes=$f.Length;ExpectedHash=$r.sha256;ActualHash=$h} } }; [pscustomobject]@{Rows=$rows.Count;Matched=$rows.Count-$bad.Count;Mismatches=$bad.Count} | Format-List; $bad | Format-List
```

