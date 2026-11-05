# A-T18 提问工具参数失败复核

## 结论

本次原生运行的 `FAILED` 结论成立。原始证据显示，模型在步骤 3 至 30 共 28 次调用
`ask_user_question` 时，都把 `questions` 生成为 JSON 字符串，而工具 schema 要求它是数组。
工作台工具运行时按严格 schema 拒绝，错误明确为 `ToolArgsError / INVALID_ARGS`，实际
`userQuestions.ask` 处理器一次也没有执行，没有产生范围确认答案，也没有伪造答案。

当前证据足以把根因红区锁定在模型生成出的工具参数；没有证据表明工作台的
`tool-ask-user` schema、AgentLoop 参数解析或 `llm-pi-ai` 适配层把正确的数组改成了字符串。
严格拒绝本身不是产品缺陷。可讨论的恢复缺口是：同一个无效调用持续 28 次，系统没有在
耗尽预算前形成可操作的终止结果；现有重复调用提醒在本会话里没有留下任何提醒上下文。

本轮没有修改产品或测试，没有进行运行器级验证，不建议据此直接改源码。若要确认更上游的
模型服务器或模板责任，还需要一次获得授权的原始 SSE 抓包。

## 输入与完整性

- 正式输入目录：
  `D:\Lawbeach\lawbench-coord\T18QuestionFailureInput-20261028-152952`
- `synthetic-session.jsonl` SHA-256：
  `5C2D6839E6397613754C53F40E279EFC32A3A24A947511E2A7E6DD6C666341F7`
- 实际原生会话文件：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\run-hdDyn1\sessions\--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-NativeReadingWorkflow-20261028-133231-run-hdDyn1-case--\session-56fd642a-416f-422b-912b-c8e0eeff53d5\session.v4.jsonl`
- 实际原生会话文件 SHA-256 与输入副本相同：
  `5C2D6839E6397613754C53F40E279EFC32A3A24A947511E2A7E6DD6C666341F7`
- `tool-ask-user-before.ts` SHA-256：
  `AA448C483D0E0DE805079950C616E45D93B4C972B7A62345B4E4A8C4164BFECF`
- 当前 `dsh\packages\interaction\tool-ask-user\src\index.ts` SHA-256 与执行令给出的
  源码基线相同：
  `AA448C483D0E0DE805079950C616E45D93B4C972B7A62345B4E4A8C4164BFECF`

输入仅涉及 `run-hdDyn1` 的纯合成案件。没有读取或写入真实案卷、凭据、DPAPI、Keyring、
环境密钥或业务历史。

## 实际运行事实

| 事实 | 实测值 | 证据 |
|---|---:|---|
| 状态 | `FAILED` | `report.json:4` |
| 模型 HTTP 调用 | 32 次，32 次 HTTP 200 | `report.json:48-49` |
| 原生步骤 | 32 | 会话中共 32 个 `assistant/message`、32 个 `step/start`、32 个 `step/end` |
| 工具调用与结果 | 各 36 条 | 会话事件计数 |
| 实际调用构成 | `skill=1`、`case_list_materials=1`、`ask_user_question=28`、`case_read_material=5`、`case_save_draft=1` | 会话 `tool/call.data.name` 计数 |
| `ask_user_question` 失败 | 28 次，均为 `ToolArgsError / INVALID_ARGS` | 步骤 3 至 30 的 `tool/result` |
| 实际上游 core 工具 | 7 次 | `b-service-final.json:36` |
| 报告侧工具清单 | `[]` | `report.json:451` |
| 报告侧问题对象 | `null` | `report.json:452` |
| 服务最终状态 | `STOPPED`，协议 `passed=true` | `b-service-final.json:20,49` |
| 原生回合结束 | `blocked` | `synthetic-session.jsonl:180` |

36 条 `tool/call`、36 条 `tool/result` 和 7 次上游 core 工具调用并不矛盾。报告中的
`toolCalls: []` 是在运行结果对象被晚赋值前采集到的空数组，不能解释成实际没有工具调用。
实际会话里有 36 次工具调用；其中 28 次 `ask_user_question` 在本地 schema 校验层被拒绝，
只有另外 7 次非提问工具到达上游 core：1 次材料清单、5 次材料读取、1 次草稿保存。

技能内容确实已加载。步骤 1 的 `skill` 返回了
`<skill_content name="case-reading-notes">`，其中要求先调用 `ask_user_question` 确认范围。
因此不能把新 Skill 的加载失败解释为本次失败原因。

## 根因红区

### 已证实：模型的工具参数值为字符串

步骤 3 的模型消息先把参数生成为：

```json
{"questions":"[{\"id\": \"scope\", \"question\": \"本次阅卷范围为全部5份材料，请确认：\", \"header\": \"确认阅卷范围\", \"options\": [{\"label\": \"全部5份材料（推荐）\", \"description\": \"借条、情况说明、案情摘要、还款记录、银行流水\"}]}]"}
```

这是外层参数对象，`questions` 的 JSON 类型是 `string`；字符串内容才是数组文本。
对应证据是 `synthetic-session.jsonl:22-24`：模型消息、`tool/call`、错误结果相邻记录。
工具返回原文是：

```text
Error: invalid arguments: "questions" must be an array
```

28 次调用均出现同一类型错误。步骤 10 至 30 有 21 次参数的规范 JSON 完全相等于：

```json
{"questions":"[{\"id\":\"q1\",\"question\":\"确认？\"}]}"}
```

模型在步骤 4 的推理内容中说“questions 应该是一个数组”，在步骤 5 说“我传的就是数组”，
随后仍反复生成字符串。步骤 30 仍把数组文本包在字符串里；步骤 31 才转去读完 5 份材料，
步骤 32 在预算收尾提示后保存了未核实且含两处 `must_fix` 的草稿，随后回合以 `blocked` 结束。

### 已证实：严格 schema 拒绝且处理器未执行

工具声明在
`D:\Lawbeach\lawbench-A\dsh\packages\interaction\tool-ask-user\src\index.ts:22-25`
要求 `questions.type = 'array'`。实际处理器只在参数通过 schema 后执行，
其 `questions.map(...)` 位于同文件 `:79-90`。

`defineTool` 在
`D:\Lawbeach\lawbench-A\dsh\packages\core\tools\src\schema.ts:597-600`
先调用 `validate`，有违规即抛出 `ToolArgsError`，不会进入工具主体。
错误模型在同文件 `:460-469`，稳定代码是 `INVALID_ARGS`。

`tools.spec.ts:2662` 已明确要求字符串不能冒充数组：
`'"tags" must be an array'`。`tools.spec.ts:2679-2738` 又验证无效参数返回带违规详情的
`isError` 结果和稳定错误信息。

因此“没有出现范围确认问题”不是因为 UI 或问题服务静默吞掉了错误，而是因为参数未通过
工具运行时的第一道验证，`userQuestions.ask` 没有机会执行。

### 已证实：错误反馈被持久化并继续下一模型步

AgentLoop 在
`D:\Lawbeach\lawbench-A\dsh\packages\core\agent-loop\src\tool-calls.ts:269-289`
把工具结果写回会话，包括 `isError` 和 `error.info`。
`agent.ts:515-521` 在工具调用结束后返回 `null`，同一回合继续下一模型步。

这与会话吻合：每次错误后都有下一步模型调用，直到普通预算收尾提示出现。错误反馈机制
确实把“questions 必须是数组”交给了模型，但没有形成对连续无效参数的有效恢复。

## 参数转换路径

### 供应商适配层

`D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\src\adapter.ts:389-404`
把供应商流交给 `toStreamChunks(...)`，没有对 `questions` 做 schema 投影或自动解析。

`D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\src\stream.ts:183-190`
把 `toolcall_delta` 的增量原样映射为 `argumentsDelta`。
同文件 `:194-204` 在调用结束时把供应商已经解析出的 arguments 对象重新
`JSON.stringify`，不会把对象字段从字符串改成数组。

步骤 3 记录的参数增量也显示字符串边界来自工具体参数本身：

```text
{"questions": "[{\"id\": \"scope\", ...
```

### AgentLoop 与会话装配

`D:\Lawbeach\lawbench-A\dsh\packages\core\agent-loop\src\assistant-stream.ts:59-70`
只做增量累计、快照和框架发布。
`D:\Lawbeach\lawbench-A\dsh\packages\core\agent-loop\src\tool-calls.ts:104-111`
对完整 arguments 字符串调用一次 `JSON.parse`；解析成功后保留
`{ questions: string }`，失败时才保留原字符串。

结论：工作台自己的参数处理路径没有“字符串转数组”或“数组转字符串”的隐式修复。

## 现有机制核对

### Schema 与错误模型

- `JsonSchema` 是严格类型校验，数组槽位收到字符串即违规。
- `ToolArgsError` 提供稳定代码 `INVALID_ARGS` 和逐项违规文本。
- 现有工具测试覆盖了 schema 类型错误、错误返回结构和处理器不执行，但没有
  `ask_user_question` 收到字符串数组的具体回归样例。
- `tool-ask-user.spec.ts:58-87` 只验证 schema 是数组；
  `:89-123` 只验证合法数组能进入处理器。没有测试“字符串形式的 JSON 数组”被拒绝且
  不显示问题。

### 重复调用提醒

`D:\Lawbeach\lawbench-A\dsh\packages\guard\repeat-tool-reminder\src\index.ts:188-213`
已有按工具名和规范化参数统计连续重复调用的提醒机制，
`:220-231` 会把它作为额外上下文送入下一次模型请求，默认阈值为 `[3, 5, 8]`。

本会话没有出现来源为 `repeat-tool-reminder` 的提醒消息，尽管步骤 10 至 30 有 21 次完全相同
的无效调用。可证实的是本部署没有产生提醒；未证实的是插件未加载、被排除，还是部署配置
未启用。该机制只提醒，不解析、不修复参数，也不阻止真实工具执行。

### JSON 解析与回放后备

`D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\src\replay.ts:43-53`
在重建旧助手历史时，对不可解析的工具参数退回 `{}`；`:152-165` 和 `:187-213`
只用于历史投影。该路径不是当前执行校验路径。直接复用它解决本次问题会静默丢弃原始参数，
不能作为恢复方案。

没有找到通用的工具参数纠错器、类型强制转换器或 schema 驱动的自动重写机制。

## 责任分层

### 已确认

1. 28 次 `ask_user_question` 的 `questions` 在进入工作台校验前就是字符串。
2. 工具声明和运行时校验均要求数组。
3. `ToolArgsError / INVALID_ARGS` 是正确结果。
4. `userQuestions.ask` 和实际用户问题处理器从未执行。
5. 没有范围答案，没有伪造答案，没有绕过范围确认。
6. 错误结果被写入会话并反馈给模型。
7. 模型在明确看到错误后仍连续生成无效参数，直到步骤 30。
8. 步骤 31 读取五份材料，步骤 32 在预算提示后保存草稿，随后回合以 `blocked` 结束。
9. 报告的 `toolCalls: []` 是消费者晚赋值事实，不是实际上游工具为零。

### 可合理推断

1. 初始红旗位于 provider/model 生成的工具参数表达，至少位于
   `llm-pi-ai` 已完成解析后的边界。
2. 28 次重复显示现有错误文本对当前模型不足以形成纠正，恢复策略缺少针对
   `INVALID_ARGS` 的升级动作。
3. 现有 `repeat-tool-reminder` 没有参与这次运行；其配置状态需要另行核对，不能从本会话反推。

### 尚未解决

1. 原始 HTTP SSE 请求体没有被本证据集保存，因此不能把字符串化精确归因到模型服务器、
   服务端模板或 `pi-ai` 流解析的哪一层。可以排除本工作台适配层主动改写，不能排除 SDK
   在记录前保留了供应商错误结构。
2. 没有证据证明 `ask_user_question` schema 或 `tool-ask-user` 源码存在错误。
3. 没有运行测试、导入、类型检查、构建、HTTP 或模型调用，不能宣称修改后行为。

## 最小建议

### 建议一：先启用现有重复提醒

在部署配置中确认 `repeat-tool-reminder` 是否加载，并考虑把
`ask_user_question` 的 `INVALID_ARGS` 连续调用阈值设为 `2` 或 `3`。
这是现有机制，不需要放宽 schema、解析字符串或伪造答案。它只能增加纠正机会，不能保证
模型改对。

### 建议二：增加一次有界的参数纠错上下文

若 owner 决定处理恢复缺口，最小产品改动应在 AgentLoop 的 `INVALID_ARGS` 结果之后增加
一次结构化纠错上下文，内容只包含：

- 工具名；
- 违规参数路径；
- 实际 JSON 类型；
- schema 期望类型；
- 合法的最小调用形状。

例如，明确指出“`questions` received `string`; expected `array`; pass the array directly,
not a JSON-encoded string”。不得在工作台内解析该字符串并替代模型执行，不得修改原始参数，
不得放宽 schema，也不得绕过问题工具。

### 建议三：为同类重复设置终止边界

若一次纠错后仍出现相同工具、相同参数的 `INVALID_ARGS`，应在有限的第二次重复后结束回合，
返回结构化 `blocked` 原因，例如 `TOOL_ARGS_UNRECOVERABLE`，并在 UI 明示“没有执行问题
工具，没有取得用户确认”。这能避免耗尽整个模型预算，也不会把失败伪装成成功。

### 建议四：下一步只补一项上游证据

由 owner 决定是否在后续独立任务中，对同一合成请求记录原始 `/v1/chat/completions` SSE，
并与 `assistant/message.stream` 的 `tool-call-chunks` 对照：

- 原始 SSE 已是字符串：责任在模型或服务端模板；
- 原始 SSE 是数组而记录变为字符串：责任在 SDK/适配解析。

本轮遵守执行令，没有抓包、重跑、联网或修改配置。

## 命令与验证台账

所有成功执行的读取均使用绝对原生 PowerShell：
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，
`login=false`。没有运行 Node、Python、导入、解析器、AST、测试、类型检查、构建、HTTP、
模型、GUI 或 SSH。

| 批次 | 实际动作 | 结果 |
|---|---|---|
| 1 | 完整读取正式执行令 | 退出 0 |
| 2 | 列出输入目录；读取 `report.json` 前 5 行会话；读取源码哈希 | 退出 0 |
| 3 | `git status --short --branch` | 退出 1，`dsh` 子模块路径权限拒绝；未写入 |
| 4 | 首次 `rg` 搜索 | 退出 1，且一个 `rg` 启动尝试被 MXC 拒绝；结果只作线索 |
| 5 | `git --no-optional-locks status --short --branch --ignore-submodules=all` | 退出 0；确认既有 dirty |
| 6 | 读取 `tool-ask-user`、工具 schema、AgentLoop、provider、replay、repeat reminder 源码与 focused tests | 各退出 0；未执行测试 |
| 7 | PowerShell 解析 180 行会话，统计事件、步骤、工具名、参数类型、错误码、预算提示 | 退出 0 |
| 8 | 计算输入副本、实际会话、备份工具源码、当前工具源码的 SHA-256 | 退出 0；见上节 |
| 9 | 对比 `A-dirty-before.txt` 与当前完整未跟踪状态 | 最终 `2234/2234` 行，差异 `0`；退出 0 |
| 10 | 读取 `formal-report` 与 `cn-prose` 规范 | 退出 0 |

非零与中断记录：

- `git status --short --branch` 一次退出 1；原因是受保护子模块目录权限拒绝，
  后以 `--ignore-submodules=all` 完成只读审计。
- 两个范围过大的原生 PowerShell 递归扫描分别被人工中断，均退出 1；它们没有产生修改，
  后续改为明确文件路径读取。
- 11 次命令请求误将 `shell` 设为 Bash，均在执行前被环境拒绝；另有 1 次 `rg`
  启动器被 MXC 判为 Bash 而拒绝。这些尝试没有读取、写入或改变产品、配置、Git 或测试状态。
  全部有效读取随后均使用原生 PowerShell。
- 第一次 dirty 对比将快照中的展开未跟踪列表与 Git 的折叠列表比较，得到 2169 条表面差异；
  改为当前 `--untracked-files=all` 后为 `2234/2234` 行、差异 `0`。工作区没有因本任务改变。

写入面：本文件是由本任务新写的第一份协调目录文件；第二份只允许是
`A-handback-T18-question-failure-review-20261028-152952.md`。没有产品、测试、fixture、
README、配置、Skill 或源码写入；没有 Git add、commit、rebase、stash、reset、clean、
checkout 或 push。

## 收口判断

当前可以确认“提问工具在正确拒绝非法参数”，不能确认“提问工具 schema 或转换代码有缺陷”。
本次 `FAILED` 的直接事实是模型持续输出字符串化数组，产品恢复策略没有阻止其消耗预算。
`Gate1` 与项目级封版仍是 `PackagingHOLD`；本次复核不构成 T18 业务验收、原生工作流通过、
GUI 验证或打包验收。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 5 / 过程 0 / 黑名单 2

Response ID: 未由当前运行器提供

Response log path: chat reply
