# B 线 · T18 引用回收源码审计与最小接入建议

- 生成时间：2026-10-28T21:26:28+08:00
- 状态：`SOURCE_AUDIT_COMPLETE`
- 本轮性质：只读源码/契约/既有真实运行证据审计；不是产品修复，不是提交，不构成 `BUSINESS_PASS`
- 范围：T18 合同审查真实失败中的 `citation_check` 回收链、材料读取/覆盖、任务状态、结束/取消路径
- 法律实体、风险高低、条款取舍均不作判断

## 1. 结论先行

### CONFIRMED

1. **现有系统没有程序化回收 `citation_check.problems` 的机制。**
   `case_save_draft` 在草稿落盘后计算核对结果，并把 `citation_check`、`coverage`、`not_fully_read` 返回给 Agent；它不会因 `must_fix` 或提示存在而拒绝本次保存，也不要求下一次保存必须同标题。
2. **Agent 插件也不回收该结果。**
   `executeTool` 只校验工具返回契约；`case_save_draft` 成功时仅把 `draftSaved` 设为 `true`。任务结束时没有检查最新草稿的 `citation_check`、`not_fully_read` 或覆盖状态。
3. **`passed=true` 只是在说“没有 must_fix”，不是在说“每条事实都有出处”。**
   契约明文规定 `passed` 为“没有 must_fix 类问题即为 true”。F 类固定是 `hint`。
4. **“每条事实都要有出处”当前只存在于系统提示和 Skill 文本，没有完整程序判定。**
   检查器会核对已写出的 A–E/G，也会对“带金额或日期但没有出处”的句段报 F；对不含阿拉伯金额、日期或引语的普通事实句，没有安全、通用的自动判断。
5. **真实失败是模型忽略了已返回的提示，不是工具结果没有送达。**
   原始会话 JSONL 第 44、54 行均含完整 `tool/result`：两次保存都返回 12 条 F 提示、`must_fix=0`、`not_fully_read=[]`，两份材料均在 `fully_read`。模型随后把提示概括成“推荐措辞不需要出处”，未逐项区分事实句和建议句。
6. **模型在最终草稿中确实引用了内部意见的事实，却没有引用内部意见。**
   最终草稿第 28、36、44、52、60 行分别使用采购部、质检部、财务部、附件缺失、二十日解除权等内部意见内容；结构化 `result.json.citations` 唯一的材料名是“采购合同”，没有“采购部内部意见”。
7. **12 条 F 提示不能整体升级为 must_fix。**
   其中多条是“修改建议”或“推荐措辞”，属于拟议文本，不应被强制要求指向原件。至少第 28、44 行对应的 `问题` 句是材料事实断言；第 36、52、60 行也是同类事实来源，但因中文数字、短整数或无金额/日期而未进入 F。
8. **问题不在必问问题或材料读取。**
   `our_party`、`purpose`、`focus` 三个必问项在首次正式草稿前完成；覆盖清单显示两份材料均读全。不能把这次失败归因于未问或漏读。

### INFERRED

1. 一次对“当前保存结果的未处理反馈”做确定性、一次性的后续提示，可能显著降低模型把 12 条原文 JSON 粗略概括成“都是推荐措辞”的概率。
2. 界面现在对 `passed=true` 使用绿色 `ok` 语气，同时在摘要中写“另有 N 条提示”。文字技术上准确，但视觉上容易被模型/律师理解为整体通过；改为“待核对提示”的弱提示语气更诚实。
3. `must_fix>0` 时在任务完成前自动降为 `blocked` 属于安全的硬门；F 类不能进入此硬门，否则会打断合法的拟议条款。

### UNRESOLVED

1. 在不引入通用 NLP、材料名特判、记忆样本或预期答案的前提下，无法可靠判断“每一个普通事实句都已有出处”。
2. “读了某材料”不能推出“必须引用该材料”：内部意见可能只用于形成建议，也可能只支持其中一段。不能用材料覆盖度或“读而未引”直接判错。
3. 对仅有 F 提示的任务，最终聊天答复是否已经逐项评估，当前没有结构化确认通道；若不增加契约/新工具，只能做到：
   - 强制模型多看到一次确定性提示；
   - 界面保持“待核对”；
   - 保留根部的严格内部意见引用断言，由真实模型验证是否已改正；
   不能仅凭程序宣称语义质量通过。

## 2. 真实证据链

### 2.1 输入与身份

冻结输入目录：

`D:\Lawbeach\lawbench-coord\T18CitationRecoveryInput-20261028-212043`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `root-actual-failure.json` | 15442 | `f9fb8affcb4788a64e96973c7613b842bc13df068e9fb86f28a4ba8f73d2666b` |
| `actual-final-draft.md` | 7454 | `f6cf41fddb2f7a5fd71cf3181b760619658c520b429f578da611c2f07e27a1f7` |
| `source-before.json` | 775 | `11adf5188115ddd87ff4cc68c54db76fdd374f62097f07e7129877c014ab92b8` |
| `B-dirty-before.txt` | 727514 | `4304fe91a77a35da9cf5579316c17d60d8ab6c925352b1c4999ab6c47ca9679e` |

真实会话原件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\run-znIBMz\sessions\--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-QuestionGateContractWorkflow-20261028-191702-run-znIBMz-case--\session-c880b32f-0802-4dfa-bdb7-bde6b998425f\session.v4.jsonl`

- SHA-256：`aa45f25b674dc8e3f58140784b98a97cfab38a96eaa8e330a5c0077ffa4e6056`
- 第 44 行：第一次 `case_save_draft` 的 `tool/result`，含 12 条 F、`passed=true`、内部意见已读全。
- 第 54 行：第二次 `case_save_draft` 的 `tool/result`，提示与第一次完全相同。
- 第 42 行可见第二次保存前模型已看到第一次结果，并继续处理修改清单。
- final assistant reasoning 明确写“only hints”“recommendations, not facts”，但该概括漏掉了 `问题` 段中的事实来源。

真实任务 `result.json`：

- 路径：`...\run-znIBMz\case\工作区\任务\T-20261028211432-5e7d\result.json`
- SHA-256：`2e9e4e5f2d273ed89926ae61d16d3607b3770442f35a57a3898042922b2c6d34`
- `citation_check.stats`：`citations=12`、`must_fix=0`、`hints=12`
- `coverage`：两句材料均在 `fully_read`，`partially_read/not_read/unreadable` 均为空
- `result.citations`：11 个去重后的结构化位置，材料名全部为“采购合同”；“采购部内部意见”为 0

### 2.2 实际草稿中的两类句段

不应一律要求出处的拟议内容：

- 第 29、30、37、45、46、54、61、62、69 行是修改建议或推荐措辞。
- 第 6、8 行是签署前事项摘要；是否补出处取决于它是否作为事实摘要呈现，不能仅因有数字机械判错。

确有材料事实来源但未标内部意见的内容：

| 草稿位置 | 内容类型 | 内部意见来源 |
|---|---|---|
| 第 28 行 | `根据采购部意见`，第一批须在 2026-05-10 前到货 | `采购部内部意见.txt` 第 5 行 |
| 第 36 行 | `采购部质检反馈`，第三方检测需十至十五个工作日 | 同文件第 7 行 |
| 第 44 行 | `财务部要求`保留 5% 质量保证金 | 同文件第 8 行 |
| 第 52 行 | 对方文本没有附件 | 同文件第 9 行 |
| 第 60 行 | `根据采购部意见`，逾期超过二十日应能解除 | 同文件第 10 行 |

其中第 28、44 行进入 F 提示；第 36、52、60 行没有进入 F，原因是现有抽取只覆盖有限数字、日期和引语：中文数词、单个/两位数字、普通事实句均可能不触发。

## 3. 当前实现的准确语义

### 3.1 检查器只证明有限事项

- `service/lawbench/checks/citations.py:243-245`：
  `passed` 仅由 `must_fix == 0` 推导；F 是提示。
- `service/lawbench/checks/citations.py:249-256`：
  无出处时，只有抽出了金额或日期才报 F；没有金额/日期的普通事实句直接返回。
- `service/lawbench/checks/citations.py:312-322`：
  写出处后核金额、日期和引语；不核对整句结论是否由所引页支持。
- `docs/src/Spec.md:927-941`：
  F 是提示；核对只能证明数字、日期、引语在所指位置存在，不能证明整句话成立。
- `contracts/common.schema.json:385-428`：
  `passed` 字段说明就是“没有 must_fix 类问题即为 true”。

因此，不能把当前 `citation_check` 改名或解释成“事实全部核验通过”。

### 3.2 保存只返回反馈，不消费反馈

- `service/lawbench/tools/drafts.py:294-311`：
  先写草稿，再核对并保存结果，随后无条件返回 `citation_check`/`not_fully_read`。
- `service/lawbench/tools/drafts.py:268-277`：
  只在任务锁和运行状态上把关，没有根据核对结果拒绝或安排重存。
- `dsh-ext/agent/index.ts:242-254`：
  `executeTool` 接收并验工具结果；`case_save_draft` 仅设置 `draftSaved=true`。
- `dsh-ext/agent/task-state.ts:70-71`：
  任务状态只有“是否存过草稿”的布尔值，没有 `citation_check`、提示签名、待重存标题或待评估状态。
- `dsh-ext/agent/index.ts:319-334`：
  `turn/end` 只走收尾和 `/core/task/end`，不检查最新草稿质量。

### 3.3 已有提示注入点可复用

- `dsh-ext/agent/index.ts:167-178`：
  每次模型调用前已有 `notice(...)` 注入机制；预算/收尾提示即由此进入模型上下文。
- `dsh-ext/agent/index.ts:40-43`：
  `notice` 构造的是普通 user notice，不需要新增协议或工具。
- `dsh-ext/agent/task-state.ts:221-226`：
  结束原因在 `endReason()` 一处汇总，可在“原本 completed”时决定是否降为 `blocked`。
- `dsh-ext/agent/index.ts:258-271`：
  `endTask` 已覆盖正常、取消、出错、中断等所有结束路径，并保留一次重试；不要另造结束链。

## 4. 推荐的最小代码级接缝

### 4.1 推荐第一刀：一次性反馈 + 仅硬问题阻止 completed

不改契约，不改 `citation_check` 算法，不改模型、提示词、预算或材料名规则。

1. 在 `dsh-ext/agent/task-state.ts` 增加任务内存状态：
   - 最新一次成功保存的标题/版本；
   - `problems` 的稳定签名；
   - `must_fix` 数、`hints` 数；
   - `not_fully_read` 是否为空；
   - 是否需要同标题重存；
   - 一条待注入、尚未注入的质量提示。
2. 在 `dsh-ext/agent/index.ts:242-254` 成功执行 `case_save_draft` 后，调用
   `state.noteDraftResult(r.value, args.title)`。
3. 该方法按“标题 + 版本 + problems 的 class/severity/message/excerpt + not_fully_read”生成内存签名：
   - 同一签名只注入一次，避免重复不变提示形成循环；
   - 不同签名才更新待提示；
   - 新问题覆盖旧的待提示，但不得在日志写 excerpt、标题或正文。
4. 在 `dsh-ext/agent/index.ts:167-178` 的已有 notice 路径中取走一次待提示：
   - 有 `must_fix` 或 `not_fully_read`：明确要求处理并在完成前用同标题重存；
   - 只有 F/G hint：要求逐项区分“材料事实来源句”和“建议/拟议措辞”，事实句补出处或固定标记，建议句不需强行补出处；
   - 不注入“每条 read 材料都必须被引用”。
5. 在 `dsh-ext/agent/task-state.ts:221-226` 的 `endReason(kind)` 中只在两处加门：
   - 原 `kind` 是 `completed`，且最新保存仍有 `must_fix>0` 或非空 `not_fully_read`，返回 `blocked`；
   - `aborted`、`interrupted`、`budget`、`error`、`max-tokens` 保持原语义，不能因质量提示改写取消/预算/中断。
   F 提示本身不阻止 completed。
6. 在 `dsh-ext/ui/format.ts:197-202` 把“`passed=true` 但有 hints”从绿色 `ok` 改为弱提示 `faint`，摘要写成：

   `没有必须修改的问题；仍有 N 条出处提示待核对（核对了 X 处出处）`

   有 `must_fix` 时仍用 `err`。这样界面不再把 F 的存在表现成整体绿色通过，同时不篡改 `passed` 的契约含义。

### 4.2 为什么不建议在检查器里硬造“全部事实已引用”

- 现有 Skill 允许分析意见、推断、未找到依据和建议措辞。
- 普通句是否“事实”、是否“来源于材料”、还是“律师给出的新事实”，无法只靠句子外观可靠区分。
- 以“没有〔〕就报必须修改”会误伤标题、风险结论、建议、拟议条款、过渡句。
- 以“读了材料就必须引用”会误伤合法的派生建议，并与 OWNER 的边界冲突。
- 用“根据采购部/财务部”等材料别名特判会把本样本做成绿色，但不是通用产品行为，明确不可采用。

因此，对“每条事实都有出处”的自动检测应维持 **UNRESOLVED / not justified**。安全的程序行为只能把已有有限核对结果变成明确待处理状态，并由同一真实模型复测语义是否改善。

## 5. 任务、会话、案件、取消与重试边界

- 会话任务以 `agent.id` 为键：`dsh-ext/agent/index.ts:89-90`；新一步若发现旧任务仍挂着，先按 `interrupted` 结束旧任务，再登记新任务：`:128-141`。质量状态必须放在当前 `TaskState`，不得做跨会话全局 map。
- 保存受任务锁保护，并在锁内重核 running：`service/lawbench/tools/drafts.py:268-272`。
- 请求固定材料范围时，`index_for_task` 按 material_id/version 过滤，不跨案、不借旧版本：`service/lawbench/case/task.py:119-134`。
- 覆盖按 `reads.json` 的实际读取记录计算，只认当前材料版本：`service/lawbench/case/task.py:680-715`。
- `task/end` 在任务锁里写成终态；已结束任务重复结束不改写：`service/lawbench/case/task.py:734-775`。
- `endTask` 无论正常、取消、出错、中断都走同一登记路径，失败仅重试一次：`dsh-ext/agent/index.ts:258-271`。
- 新机制不得新建独立质量存储、不得跨任务继承引用提示、不得延迟或吞掉取消/中断。

## 6. 必问问题判定

本失败不是 Skill 选择或必问门问题：

- 真实运行在首次草稿前已完成 `our_party`、`purpose`、`focus` 三项确认。
- 当前 Skill 第 34-35 行要求已给项请确认、缺项才问；本次行为已满足该项。
- 本次审计不需要、也不建议修改 `ask_user_question`、Skill 选择或问题门。

## 7. 必要验证（本轮不运行，交主编排）

先由主编排完整复核本建议；若采纳最小实现，再做以下有限验证：

1. `task-state.spec.ts`
   - 同一保存签名只产生一次待提示；
   - 新签名覆盖旧待提示；
   - `hints` 只提示，不把 ended completed 变成 blocked；
   - `must_fix>0` 或非空 `not_fully_read` 时 completed 被映射为 blocked；
   - 同标题干净重存后解除硬门；
   - aborted/interrupted/budget/error/max-tokens 不被质量状态改写。
2. `result-cards.spec.ts`
   - `passed=true,hints>0` 显示“待核对提示”，不是绿色通过；
   - `must_fix>0` 仍为错误；
   - `citation_check=null` 仍显示“尚未核对”。
3. 原有契约/类型/静态检查
   - 不新增字段，不改 `case_save_draft`/`result.json`/`task_end` schema；
   - 工具结果仍按原契约校验；
   - 日志不含 excerpt、标题、正文、材料名。
4. 真实原始模型复测
   - 同一个 `contract-review`、同一份合成合同与内部意见、同一模型/参数/预算/提示；
   - 复用根消费者现有的严格“草稿至少引用内部意见”断言，不削弱、不删除；
   - 观察原始 JSONL 中质量 notice 是否出现一次、模型是否据此回读/修正并同标题重存；
   - 对 12 条提示仍逐条人工/根侧判定，不能把所有提示强制升格；
   - 修改清单仍允许 5 accepted / 1 out_of_scope，不因引用回收机制改动；
   - 本轮已知真实运行未到人工门/修订版/DOCX/JSONL 的闭环，不补写成已通过。

## 8. 边界、阻碍与验证状态

- 产品、测试、fixtures、Skill、契约、配置、runtime、SDK、lib、legacy、E50、18 未改。
- 未运行 Node、Python、pytest、收集、AST、导入、构建、准备脚本、HTTP、模型、GPU、GUI、SSH、凭据、DPAPI、Keyring、真实案卷或业务缓存。
- 未执行 Git add/commit/rebase/stash/reset/clean/checkout/push，也未触碰 index.lock、ACL、审批或沙箱策略。
- 普通 `git status --short --branch` 因既有 `modules/dsh` 子模块 gitdir `Permission denied` 退出 1；改以 `--ignore-submodules=all` 读取到既有 dirty 树。该权限问题未修。
- 本次执行者没有启动第二 writer；当前 PID 仅为本执行者。
- 当前工作树 `draft/citations/parse/Skill` 四文件与冻结快照逐文件 SHA-256 相同；既有 dirty 未清理。

### 源码身份

| 文件 | SHA-256 |
|---|---|
| `service/lawbench/tools/drafts.py` | `255a99dabb231d8cb4f09b692fac5bf7a87d7e291973ab746de43ccc022da4f5` |
| `service/lawbench/checks/citations.py` | `67779ba41e35e2b6780a7b74ebe061e143a79dd5b8c97273329ae91059748758` |
| `service/lawbench/checks/parse.py` | `3fd25b61a965abe5432b8d301448517dea003d77739f45a0331bbbf07fa123bc` |
| `skills/contract-review/SKILL.md` | `339e3f09001421424c319ef17d9082084b54e6b6d90938afff92a3c7b33575c9` |
| `service/lawbench/tools/materials.py` | `9122850f43ca96647fe8c3240c47000c55e395aba983c221e2fc79fcdc476a73` |
| `service/lawbench/case/task.py` | `7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04` |
| `service/lawbench/case/texts.py` | `1f44044b450d6816b1384288391f5a72229b236e8d067a958b424dadae6f85c4` |
| `service/lawbench/case/request_scope.py` | `9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405` |
| `service/lawbench/checks/evidence.py` | `577eeb2c6c361eb4784b561ce34dc34da8678a5bf677dc3c20c0ab85b8bbf571` |
| `dsh-ext/agent/index.ts` | `34ce8356ae494ca7467f6a22b5da9b4c8db283adffff67d4e04301659d630863` |
| `dsh-ext/agent/task-state.ts` | `ec52bbd71135727a30f5dd853f9457d9fc0ed5c3777e28de330f1e4d3990d885` |
| `dsh-ext/ui/format.ts` | `da6bbd80903eb819bd937e0d52b205203bcd3546555863a114ced88003cbc583` |
| `contracts/common.schema.json` | `46a8ac7b6c7017684d2667f4d622bb65577b29691b3f4121a20de02a6e5cb445` |
| `contracts/tools/case_save_draft.schema.json` | `0e4d0997ef5790f0106c2300917a5f8f16ab264237a8bc01edb8a28f3311730b` |
| `contracts/files/result.schema.json` | `9b8cb22bfa8b1a529c702f643a2295a2deff2dfce23cc66777ea776bda0f10f8` |
| `contracts/core/task_end.schema.json` | `311dba84568699e59d0d0d94ebceecfe5c51249dd773fdaf3a9d5e17e4c5a066` |

## 9. 实际命令账

除明确标为 `FAIL` 的条目外，命令退出码为 0。`<run>` 代指真实 run 目录，`<session>` 代指 `session.v4.jsonl`；替代只用于本表压缩，文件均由完整路径或工作目录明确解析，无猜测。

1. `Get-Content -Raw <execution-order>.md`
2. `git status --short --branch` — FAIL：`dsh` 子模块 gitdir 权限拒绝
3. `Get-Content -Raw docs\plan\lawbench-关键事实索引-20260928.md`
4. `Get-Content -Raw PROJECT-PROFILE.md`
5. `rg -n -C 8 'T18|citation_check|citation|引用' <workorders>`
6. `rg --files | rg <source/evidence pattern>`
7. `git status --short --branch --ignore-submodules=all`
8. `Get-ChildItem <frozen-input> -Recurse -File`
9. `rg --files service\lawbench dsh-ext | rg <draft/check/... pattern>`
10. `Get-Content -Raw skills\_shared\共用规则.md`
11. `rg -n -C 20 '9.4|citation_check|...' docs\src\Spec.md docs\src\业务编排.md docs\src\PRD.md`
12. `rg -n -C 15 'citation_check|...' docs\plan\evidence\T18 docs\plan\evidence\T10`
13. `Get-Content -Raw <root-actual-failure.json>`
14. `Get-Content -Raw <actual-final-draft.md>`
15. `Get-Content -Raw <source-before.json>`
16. `Get-Content -Raw <snapshot citations.py>`
17. `Get-Content -Raw <snapshot parse.py>`
18. `Get-Content -Raw <snapshot drafts.py>`
19. `Get-FileHash` of live snapshot source quartet
20. `rg -n -C 12 ... <snapshot contract-review SKILL.md>`
21. `rg -n -C 12 ... core.py task.py context.py inputs.py tools/__init__.py agent/index.ts task-state.ts` — the first local context display was truncated
22. `Get-Content -Raw` on `case_save_draft.schema.json`, `result.schema.json`, `task.schema.json`
23. `rg -n -C 8 ... common.schema.json contracts/README.md Spec.md 业务编排.md`
24. `Get-Item` for seven lifecycle/source files
25. `rg -n -C 8 ... T10/T18 owner/hint evidence`
26. `Get-ChildItem docs\plan\evidence\T10`
27. `Get-ChildItem docs\plan\evidence\T18`
28. `rg -n -C 10 ... D:\Lawbeach\lawbench-coord`
29. `rg -n -C 10 ... docs\src\Spec.md`
30. numbered read of `Spec.md:889-970`
31. numbered read of `review-REVIEW-第二轮.md`
32. numbered read of T10 `交付说明.md`
33. `rg -n -C 12 ... T10/T18 evidence notes`
34. `rg -n -C 12 ... dsh-ext UI/host/service API`
35. `rg -n -C 10 ... task_end/tasks_list/outputs schemas` — FAIL：`contracts/api/outputs.schema.json` did not exist; command still printed existing-schema matches
36. `Get-Content -Raw task_end.schema.json; Get-Content -Raw tasks_list.schema.json` — FAIL：accidental `bash` launcher refusal，无写入
37. numbered read of `dsh-ext/ui/result-cards.tsx`
38. `rg -n -C 12 'citationSummary...' dsh-ext/ui` — command succeeded，但误用了不符执行令的 shell 路径参数；无写入
39. `Get-Content -Raw skills\contract-review\tests\样本01-钢材采购\采购部内部意见.txt`
40. `Get-Content -Raw skills\contract-review\tests\样本01-钢材采购\_任务说明.md` — FAIL：accidental `bash` launcher refusal
41. `rg ... actual-final-draft.md 采购部内部意见.txt` — FAIL：accidental `bash` launcher refusal
42. numbered read of `citations.py:216-330`
43. numbered read of `drafts.py:226-360`
44. numbered read of `common.schema.json:331-430`
45. `Get-ChildItem <run> -Recurse -File`
46. `Get-Content -Raw ...\_任务说明.md`
47. `rg ... draft/internal-opinion terms`
48. `rg -n -C 8 ... <run>`
49. `rg -n '"name":"case_save_draft"...' <session>`
50. `rg -n '"type":"tool/result"...call ids...' <session>`
51. `rg -n '"type":"tool/result"' <session>`
52. `rg -n '"type":"assistant/message"' <session>`
53. `rg -n '每条事实|每条风险|没有必须修改|citation_check' <session>`
54. `Get-Content -Raw evidence.py; Get-Content -Raw checks/__init__.py`
55. `Get-Content -Raw texts.py`
56. `rg ... request_scope.py registry.py api/ui.py` — FAIL：accidental `bash` launcher refusal
57. numbered read of `task.py:277-360,609-775`
58. `rg ... dsh-ext tests task-state`
59. `Get-ChildItem RateRatioRepair`
60. `Get-Content -Raw RateRatioRepair\README.md`
61. `Get-FileHash RateRatioRepair root-finite-current + inputs` — FAIL：accidental `bash` launcher refusal
62. `Get-Content B-dirty-before.txt -TotalCount 20`
63. `Get-FileHash` four root evidence files
64. `Get-FileHash` snapshot/live source quartet
65. `rg --files dsh-ext\tests | rg result|citation|format|task-state|draft`
66. `Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'`
67. `Test-Path` both formal destination files before writing
68. `Get-FileHash` additional lifecycle/schema files

写面：

- 本轮唯一写入是这两份新建协调目录文件。
- 未修改或重写任何既有文件。
- 没有任何 Git 写操作。

## 10. 裁决建议

- 保留 `passed`、F=hint、D 不查、材料读取和必问门现状。
- 结论维持：本真实工作流的业务质量未通过；根消费者的“草稿至少引用内部意见”严格断言继续作为主判据。
- 若进入实现，优先只做第 4.1 节的确定性反馈/硬 `must_fix` 门/界面待核对语气，再用同一原始模型复测。
- 在任何新增真实模型复测和根部质量复核前，`whole_T18_PASS=false`、`whole_project_PASS=false`、Packaging 维持 `HOLD`。
