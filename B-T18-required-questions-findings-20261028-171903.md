# B-T18 必问问题程序化闸门复核

## 结论

当前产品**没有**“Skill 必问问题已真实回答后才允许保存草稿”的程序化闸门。对
`contract-review`，当前只有 Skill 正文里的大模型指令；模型不调用
`ask_user_question`，`case_save_draft` 仍可直接执行。

本轮原始实跑已经证明这一点：实际工具序列是 `skill → case_list_materials →
case_read_material ×2 → case_save_draft ×3 → case_save_edit_list →
case_save_draft`，没有一次 `ask_user_question`。第一版“合同审查意见”在此之前已经保存。
消费者判 `FAILED` 是正确的；不能通过放宽断言、伪造回答、重跑模型或再改提示词掩盖。

最小、准确的插入点在现有 DSH 扩展面内，不需要新增契约、持久化格式或 UI：

1. 任务开始响应已经包含当前 `skill`；Host 的现有 Skill 解析器已经给出机器可读的
   `questions[].key`。
2. 在 `dsh-ext/agent` 的任务状态里保存该任务的 required/answered question IDs。
3. 在现有 `tools/pre-execute` 中拦住未答齐的 `case_save_draft`；同一谓词也应用于
   `case_save_edit_list`，否则合同审查可绕过草稿直接产出修改清单。
4. 在现有 `tools/post-execute` 中只从成功的 `ask_user_question` 返回值记录真实
   answer IDs；取消、中止、无 provider、参数错误均不记录。
5. `LegalAgent.saveUnfinished()` 直接走 CoreClient、绕开 `preTool`，也必须调用同一闸门，
   否则预算收尾仍会先存草稿。

这把缺口从“靠模型自觉”提升为“没有真实回答就写不出成果”。它保证 answer IDs 和人工回答
真实存在，但不能仅凭 key 证明模型提问措辞一定准确复述了已给立场/目的或给出了恰当的
focus 候选；后者若也要程序化证明，需要结构化输入，不应冒充当前已有能力。

## 已确认事实

### 原始实跑

- `report.json`：`status=FAILED`，10 次模型 POST 全部 HTTP 200；错误为
  `actual tool loop lacks ask_user_question`；`question=null`；`redlinePath=null`。
- 会话文件第 10 行的 request header 确实提供了 `ask_user_question` 工具；工具可用，
  不是工具清单缺失。
- 会话第 14、17 行包含已加载的 `contract-review` Skill 必问要求；第 13 至 53 行的
  实际工具调用中没有任何 `ask_user_question`：

| 顺序 | 工具 |
|---:|---|
| 1 | `skill` |
| 2 | `case_list_materials` |
| 3-4 | `case_read_material` |
| 5-7 | `case_save_draft` |
| 8 | `case_save_edit_list` |
| 9 | `case_save_draft` |

- 第一次 `case_save_draft` 已发生在任何律师确认之前，且最终保存了四版“合同审查意见”。

### 当前 Skill 要求

`skills/contract-review/SKILL.md:26-30` 声明三个必问 key：

- `our_party`
- `purpose`
- `focus`

`:34-35` 进一步要求：任务说明已有立场、目的、关注点的，也要用 `ask_user_question`
列出来请律师确认；`focus` 未给时必须提问，并把材料中的关注点列为候选，问清是否可直接改条款。
`:43` 才进入保存审查意见。

本轮合成请求已经给出“代表青禾建材/甲方采购方”和“签约前把关”，但没有明确关注点与改动权限。
因此正确做法仍是：确认 `our_party`、`purpose`，并实际回答 `focus`。

### 实际运行使用的冻结产物

本次运行加载的是：

- `...\private-output-20261027-194112\profile-node_modules\lawbench-dsh\lib\agent.js`
  SHA-256 `0013B9564720A2C68FE2239A36EBFE6F2E80AEE35D8E3ADE019384B62091135B`
- `...\lib\host.js`
  SHA-256 `84ADEEF92360E0EF3FADDB1B89E6D56A2C66135E2B07283A180049613BCE8164`

清单中 `agent.js` 与 `host.js` 的哈希与上述文件一致。冻结的 `host.js` 确实有
`questions.push({ key, question, fromMaterials })` 和 `listSkills()`，但只用于 Skill 列表；
冻结的 `agent.js` 中 `requiredQuestions`、`answeredQuestions`、`requiredQuestionIds`、
`userQuestions` 的命中次数均为 0。

当前 A/B 的 `skills/contract-review/SKILL.md` 只在共用规则尾部有差异，三个必问问题及
`:34-35/:43` 的工作流完全相同，因此不影响本次根因判断。

## 为什么现在只有模型指令

### 现有数据流

| 层 | 当前行为 | 结果 |
|---|---|---|
| Skill 解析 | `dsh-ext\host\skills.ts:11-45` 只从 `## 必问问题` 格式提取 key/question/fromMaterials | 数据已存在 |
| Skill 列表 UI | `dsh-ext\ui\dock.tsx:414-418` 只展示问题预告 | 不产生回答状态 |
| 建任务 | `contracts\api\task_create.schema.json` 不含 questions/answers；`service\lawbench\case\task.py:187-195` 只保存 `skill` | 服务不知道是否已回答 |
| 开始任务 | `service\lawbench\case\task.py:476-489` 返回 `skill`；`dsh-ext\agent\index.ts:131-141` 的局部类型甚至没有接 `skill` | 客户端丢失现成信息 |
| 工具前置 | `dsh-ext\agent\index.ts:210-247` 只做白名单、预算、重复调用、收尾；`ask_user_question` 只用于暂停计时 | 草稿无必问闸门 |
| 问律师 | `dsh\packages\interaction\tool-ask-user\src\index.ts` 返回带真实 `id` 的 answers | 可记录“谁回答了哪个 ID” |
| 取消/中止 | `ui-user-questions` 分别抛 `ASK_CANCELLED` / `ASK_ABORTED`；无 provider 为 `NO_PROVIDER` | 天然可区分未答 |

### 服务端也没有闸门

`service\lawbench\api\core.py:24-27` 的 `/core/tool` 只检查任务正在运行，随后直接调用工具；
`case_save_draft` 工具实现不读取 Skill 必问状态。任务与结果契约也没有 questions/answers 字段。

所以当前边界应准确表述为：

- **已确认**：UI 能解析和展示必问项，模型也拿到了真实提问工具，但没有消费回答状态的闸门。
- **已确认**：实跑中 Skill 指令没有约束住模型，产品仍把任务正常结束并保留草稿。
- **可合理推断**：任何仅继续增加提示词、重复模型运行或调整供应商参数的做法都不能提供
  “未回答就不得保存”的结构性保证。
- **未解决**：模型展示内容的语义正确性，以及进程崩溃后跨重启保存回答状态。二者不在本次
  最小 key/answer 闸门内。

## 建议的最小实现边界

### 1. 复用现有 Skill 问题数据

在 `dsh-ext\host\index.ts` 的现有 `lawbenchCore` 服务上增加窄方法：

```text
skillQuestions(skillName): Promise<SkillQuestion[]>
```

实现直接复用 `host\skills.ts` 的 `listSkills(config.skillDirs)`，按同名后只取一次并返回
`questions`。不新增 HTTP 接口、不新建存储，也不改 `contracts\*`。

### 2. 把所选 Skill 带入任务状态

`/core/task/begin` 已返回 `skill`，`contracts\core\task_begin.schema.json` 也要求该字段。
只需让 `dsh-ext\agent\index.ts` 的局部响应类型接收它，并在新建 `TaskState` 时：

- 读取该 Skill 的 questions；
- 保存 `requiredQuestionIds`；
- 初始 `answeredQuestionIds` 为空；
- questions 为空时 required 也为空，现有无必问 Skill 行为不变。

### 3. 用现有工具生命周期记录真实回答

`tools/pre-execute` 的 `ToolExecution` 已有稳定 `callId`：

- 对 `ask_user_question`，要求本次请求包含当前所有未答 required IDs；缺项则拒绝并返回明确
  “还缺哪些 ID”，不伪造问题、不自动替答。
- 对 `case_save_draft` / `case_save_edit_list`，若仍有 required ID 未答则拒绝。拒绝发生在
  预算计数前，不消耗工具预算。
- 任务挂上 pending ask 的 `{callId, taskId, state}` 快照。

`tools/post-execute` 只在以下条件全部满足时把 answer IDs 记入对应任务：

- `exec.name === 'ask_user_question'`；
- `result.isError === false`；
- `result.value.answers` 中存在 required ID；
- 该 ID 的 `selected` 非空或 `custom` 非空；
- `exec.callId` 与 pending 快照一致，且当前 `TaskState.taskId` 仍是原任务。

该接口直接拿到工具的结构化返回值，不需要解析会话正文，也不依赖模型自报。

### 4. 同一谓词覆盖所有自动保存路径

`LegalAgent.saveUnfinished()` 当前在 `dsh-ext\agent\index.ts:186-204` 直接调用 CoreClient，
不经过 `preTool`。它必须复用同一“是否答齐”判断；未答齐时不代存普通成果，只允许结束并报告
未取得确认。否则预算到顶路径仍能创建前置草稿。

### 5. 生命周期与隔离

- 取消：`ASK_CANCELLED` 是失败结果，不记录 ID；模型可在原任务重试。
- 中止/无 provider/参数错误：同样不记录，草稿闸门保持关闭。
- 原任务重试：已成功的 answer IDs 留在该 `TaskState`，无需重复追问。
- 新任务：`task/begin` 创建新 `TaskState`，required/answered 全部重置，不沿用上一轮确认。
- 任务间串线：post-execute 同时核对 pending `callId`、captured `taskId` 和当前 state；
  旧任务迟到的成功回答不能写入新任务。
- 会话/案件隔离：`LegalAgent.tasks` 仍以 `agent.id` 为键；任务本身绑定 session/case。
  新 case 会得到新任务、新 state，不共享答案。
- 无问题 Skill：required 为空，直接放行，不改变现有行为。

## 完整语义的两个选项

本次建议只做 **Option A**：

- **A（建议）**：强制 required IDs 均收到真实非空回答，再允许成果写入。无新契约/UI。
- **B（仅候 owner）**：若还必须程序证明展示文本准确复述了“甲方采购方/签约前把关”，并从材料
  生成合法 focus 候选，则需把结构化问题/答案或已给值摘要加入任务契约并持久化。该方案要改
  contract、API、service 和 UI，明显大于当前关缺口所需，不应在本次复核内自行拍板。

## Focused 红绿证明计划

本轮不实现、不运行。实现后只需以下定向测试，不重演整批 T18 或改模型提示：

1. **红**：`contract-review` 任务未调用 `ask_user_question`，直接 `case_save_draft`，
   必须 deny，且 fake CoreClient 不收到保存请求。
2. **红**：只回答 `our_party`、`purpose`，缺 `focus`，草稿和修改清单仍 deny。
3. **绿**：一次成功后收到三个真实 answer IDs，之后 `case_save_draft` 与
   `case_save_edit_list` 各允许一次。
4. **取消/重试**：首次 ask 返回 `ASK_CANCELLED` 或 `isError=true`，不记录；原任务第二次
   ask 成功后才放行。
5. **任务隔离**：旧任务 ask 成功结果迟到，不得满足新任务的 required IDs。
6. **无问题 Skill**：`questions=[]` 时草稿直接放行，不会被新增闸门误伤。
7. **预算旁路**：未答齐时 `saveUnfinished()` 不得调用 `case_save_draft`。
8. **解析**：Host 对当前 `contract-review` 精确返回
   `['our_party','purpose','focus']`；任一字段缺失或格式不符按“无机器必问项”处理，而不是猜测。

建议落点：

- `dsh-ext\tests\agent.spec.ts`：pre/post-execute 闸门、取消与重试。
- `dsh-ext\tests\task-state.spec.ts`：required/answered、任务重置与空问题。
- `dsh-ext\tests\host-api.spec.ts`：当前 Skill questions 精确解析。
- `dsh-ext\tests\budget-wrapup.spec.ts`：预算代存不得绕过。

测试通过只能宣称“key/answer 闸门成立”；原生 DeepSeek 工作流是否照常，需要 GPT 主编排另行
决定一次受控合成实跑，不能沿用本次 `FAILED` 结果宣称修复已验证。

## 业务事实，另列不混判

- 修改清单实际保存 7 项；工具返回 `accepted=6`，`out_of_scope=[{id:4,
  reason:"find 跨越域代码或超链接"}]`。
- `redlinePath=null`，没有生成修订版 Word；不能写“修订版已验证”。
- 最终草稿称千分之一/万分之五违约金比例是 20 倍，实际算术是 2 倍。此事实是独立的业务质量
  问题，不用于本次必问闸门根因，也不作法律结论。
- 此前读书质量 GvaNIJ 的 factual pending、self-check、hint classification 业务失败保持原样；
  本复核没有重跑或改写该证据。

## 未解决与禁止外推

- 未验证实现后行为；本轮运行时调用为 0。
- 未证明模型会把已给的 party/purpose 以合适措辞放入确认项。
- 未使回答状态跨进程崩溃持久化。
- 未把闸门下沉到服务端；持有本机 CoreClient 的内部调用仍可绕过 DSH 层，除非另行做
  Option B。
- 未重跑模型、未改 prompt/参数/预算/provider/Skill、未生成新修订版。

## 写入面与只读审计

- 本任务只写两份协调目录文件：本 findings 和第二份 handback。
- 未改产品、测试、fixture、配置、Skill、运行时或仓库工作树。
- Git 仅执行只读检查。首次 `git status` 因 worktree 子模块 `modules/dsh` 路径权限拒绝而退出；
  未修权限、未碰索引锁，后以 `--no-optional-locks --ignore-submodules=all` 成功确认既有 dirty。
  index.lock 或权限拒绝不构成本交回的修复事项。
- 实际 Windows shell 为指定的原生 `pwsh.exe`、`login=false`。过程中多次误填 Bash 字段；
  均在启动前由 MXC/权限层拒绝，没有执行命令，也没有状态变化。所有有效读取均为原生 PowerShell。
- 未运行 Node、Python、导入、源码解析器、AST、HTTP、模型、GUI、SSH、测试或构建。

当前状态：`REVIEW_FINDINGS_READY / PACKAGING_HOLD / FULL_T18_NOT_VERIFIED`。
