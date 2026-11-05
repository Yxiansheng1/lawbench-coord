# A线消费端请求头修正待独立复核

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正了原生四问消费者的本回合请求头观察方式。后续稳定回合可从同一原生 Session 截至 `afterSeq` 的真实事件前缀复用最后一个 `request/header`，并保留会话、边界、源序号和来源范围。 |
| 目标是什么 | 让消费者按生产 `Session.requestHeader` 的同一折叠语义校验实际有效头，同时继续拒绝跨会话、未来事件和伪造配置。当前完成消费端静态修正；完整四问、fork 和模型运行仍未执行。 |
| 在等什么 | 等 root 独立复核新 `.mts` 并执行其受控的必要有限编译检查。若该门通过，再由有权限方安排一次完整运行；AUTHOR 不自行运行模型或读取 Key。 |
| 卡在哪 | 本令禁止 AUTHOR 运行解析器、编译器、Node、测试、HTTP 或模型，所以不能给出运行时 PASS。普通 `git status` 还因 `dsh` 子模块既有目录权限被拒绝；按令未修权限、锁或审批，后续用忽略子模块的只读状态完成核对。 |

## 修正内容

原断言只扫描本回合事件的最后三个字段，尤其依赖本回合刚出现的 `request/header`。生产源码并不保证稳定回合重复写头：

- `core/session/src/surface.ts:572-582` 的 `applySurfacePlan` 对 append 只执行 `nodes.push`，只有 replace 和 project 增加 `contentGeneration`。
- `core/agent-loop/src/agent.ts:592-618` 只在首次、头变化或 `startsSeries` 时追加 `request/header`。
- `core/agent-loop/src/agent.ts:267-285` 的默认 pre-step 不设置 `startsRequestSeries`。
- `core/agent-loop/src/runtime-context.ts:88-102` 在系统提示文本未变时返回空替换列表。
- `core/session/src/index.ts:780-797` 与 `core/session/src/request-header.ts:63-68` 的权威语义是取截至边界的最后一个 `request/header`。

本次只改 `native-real-conversation.mts`：

- 新增 `RequestHeaderAnchor` 和 `RequestHeaderObservation`。
- 新增 `requestHeaderAtBoundary`，从同一原生 Session 的 `0..afterSeq` 事件前缀取最后一个真实头。
- 若此回合前从未出现头，则要求本回合确有当前原生头。
- 后续稳定回合允许 `sourceScope=session-prefix`，配置变化仍由最新真实头的 `reason=change` 或新头自然接管。
- `assertTurn` 显式接收观察值，并核对 `sessionId`、`beforeSeq`、`afterSeq`、源序号、源类型和当前回合来源范围。
- 路由仍从 `headerObservation.data.header.config` 读取，原样校验 `provider`、`model` 和 `maxTokens=256`。
- 没有追加事件、修改历史、伪造 Agent、注入预期配置或建立内存全局映射。

四个提示字符串、生产装配、TTY、fetch、源 pin、finally 清理以及原 fork、UUID、R、消息、完成态、工具禁用、四次 HTTP 200、合成事实、继承前缀、源不变和 JSONL 深比较断言均保留。冻结的旧 `.ts` 未改。

## 字节与哈希

| 文件 | 状态 | 字节 | SHA-256 |
|---|---|---:|---|
| `native-real-conversation.mts` | 本次唯一修改源码 | 54,690 | `3c82c230a9b4f803163e48c9c7eff91f0522cdf89e13de8912324777053d9b68` |
| `native-real-conversation.ts` | 历史冻结，未改 | 51,654 | `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93` |
| `fixed-inputs.json` | 冻结，未改 | 14,284 | `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522` |
| `README.md` | 冻结，未改 | 6,259 | `5e9537aef53e9471e8ff277ab261f2bb0fa9db3eea77fba04a1444746f7f514d` |

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-native-effective-header-order-20261028-013653.md`
- 根依赖钉：`D:\Lawbeach\lawbench-coord\NativeEffectiveHeaderInput-20261028-013653\root-dependency-pins.json`
- 根当前静态判读：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\native-real-fullflow-review-root-current.json`
- B 原始复核：`D:\Lawbeach\lawbench-coord\NativeEffectiveHeaderInput-20261028-013653\B-findings-native-fullflow-review-20261028-012023.md`
- 六个实际依赖的当前字节数和 SHA-256 均与根钉一致，核验结果 `ALL_MATCH=True`。
- `git diff --no-index` 只显示上述三类预期差异：类型、边界观察函数、`assertTurn` 接线。退出码 1 是 `--no-index` 发现差异的正常结果。
- dirty 基线 `A-dirty-before.stdout.txt` 与本轮结束时忽略子模块的只读状态均为 195 行，集合差异为 0 行。
- 既有 fresh root 预检事实按令复用：2.015 秒、Key 0、HTTP 0、guard 0、Node 0、events 0、4 个初始进程结束均消失、46 个固定输入初末不变。该事实只证明 setup-only，不替代四问运行。
- 静态文本检查确认旧 `requestHeaderOf` 已移除，边界观察、provider、model、maxTokens、四次 POST 门、JSONL 深比较和 `fullT31=false` 均存在。

## 未做与降级

- AUTHOR 未运行 Node、tsx、TypeScript 编译器、解析器、导入、测试、自检、HTTP、模型、Key、SSH、GUI 或构建。
- 未重演旧 setup、安装、调研、全量测试或原始四问。
- 未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存或提交。
- `keyCleared` 只表示代码级引用清理，不表示 JavaScript 内存中的不可变字符串已被擦除。
- fetch allowlist 的拒绝路径可能未计入网络观测；本令明确要求不在本次扩展代码修复该项。
- 普通 Git 状态的子模块权限拒绝属于本运行器的既有阻碍，不构成需要修复的交付阻碍。

## 实际命令与写入账

本表列出本次执行者全部 38 个 `exec_command` 调用。命令 38 是交回文件写出后的最终只读核对；本报告位于其前，故该行结果以最终执行返回为准。命令 1 至 37 中为 33 个零退出、4 个非零；命令 38 零退出后，最终总计为 34 个零退出、4 个非零。

1. 零：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-native-effective-header-order-20261028-013653.md'`
2. 非零：`git status --short --branch`；`cannot chdir ... modules/dsh: Permission denied`。
3. 零：`Get-ChildItem -Force -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823' | Select-Object Name,Length,LastWriteTime`
4. 零：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts'`
5. 零：`rg --files -g 'root-dependency-pins.json' -g '*native-real-fullflow-review-root-current.json' -g '*NativeEffectiveHeaderInput*' 'D:\Lawbeach\lawbench-A' 'D:\Lawbeach\lawbench-coord' 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs'`
6. 零：`git status --short --branch --ignore-submodules=all`
7. 零：`Get-FileHash -Algorithm SHA256 -LiteralPath '...\native-real-conversation.mts','...\native-real-conversation.ts','...\fixed-inputs.json','...\README.md' | Select-Object Path,Hash`
8. 零：`Get-ChildItem -Force -LiteralPath 'D:\Lawbeach\lawbench-coord\NativeEffectiveHeaderInput-20261028-013653' | Select-Object Name,Length,LastWriteTime`
9. 零：读取 `root-dependency-pins.json` 与 `native-real-fullflow-review-root-current.json` 的两条 `Get-Content -Raw -LiteralPath` 命令。
10. 零：`rg -n "assertTurn|requestHeader|headerConfig|startsRequestSeries|applySurfacePlan|SystemPromptProjection|requestHeaderOf|session/request-header|provider|maxTokens|MAX_TOKENS" '<consumer.mts>'`
11. 零：PowerShell 逐行读取 consumer 650..790。
12. 非零：PowerShell 逐行读取 consumer 1170..1235；工具 shell 参数误填 `native-powershell`，返回 `'$p' is not recognized as an internal or external command`。此调用只含读取语句，未改文件。
13. 零但无输出：PowerShell 循环读取 `dep-2-surface.ts` 550..600；同一依赖随后以 565..590 的命令成功读取。
14. 零：PowerShell 逐行读取 `dep-0-agent.ts` 240..300 与 580..635。
15. 零：PowerShell 逐行读取 `dep-1-runtime-context.ts` 75..120。
16. 零：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\NativeEffectiveHeaderInput-20261028-013653\B-findings-native-fullflow-review-20261028-012023.md'`
17. 零：`rg -n "requestHeader\(|class SessionSurface|applySurfacePlan|contentGeneration" 'D:\Lawbeach\lawbench-A\dsh\packages\core\session\src'`
18. 零：PowerShell 逐行读取 `dep-2-surface.ts` 565..590。
19. 零：PowerShell 逐行读取 consumer 1170..1235。
20. 零：PowerShell 逐行读取 consumer 780..825。
21. 零：`Format-List` 输出四个冻结文件的 SHA-256。
22. 零：`rg -n "function foldRequestHeader|foldRequestHeader" 'D:\Lawbeach\lawbench-A\dsh\packages\core\session\src'`
23. 零：PowerShell 逐行读取 `request-header.ts` 1..100。
24. 零：`rg -n "export function SessionLogOffset|function SessionLogOffset|type SessionLogOffset" 'D:\Lawbeach\lawbench-A\dsh\packages\core\session\src'`
25. 零：PowerShell 逐行读取 consumer 815..855。
26. 零：`git diff --no-index -- '<native-real-conversation.ts>' '<native-real-conversation.mts>'`；退出 1 是发现预期差异的正常结果。
27. 零：`Get-Item` 加 `Get-FileHash` 输出四个冻结文件字节与 SHA-256。
28. 非零：根依赖钉核对脚本首次写法为 `foreach(...){...} | Format-Table`，PowerShell 返回 `An empty pipe element is not allowed`；只读失败。
29. 零：`rg -n "requestHeaderOf|requestHeaderAtBoundary|headerObservation|requestHeaderAnchor|headerConfig|startsRequestSeries|applySurfacePlan|requestHeader\(\)|sourceScope" '<consumer.mts>'`
30. 零：修正后的根依赖钉核对；六项全部匹配。
31. 零：读取 `A-dirty-before.stdout.txt` 的行数、首项和末项。
32. 零：PowerShell 逐行读取修改后 consumer 70..105 与 705..855。
33. 零：`Get-ChildItem -File` 输出证据目录内文件字节与 UTC 修改时间。
34. 零：基线与当前 `git status --short --branch --ignore-submodules=all` 集合比对；195 行、195 行、差异 0。
35. 零：静态文本存在性检查；旧函数为 false，新观察器、三项路由校验、四次 POST 门、JSONL 深比较和 `fullT31=false` 均为 true。工具 shell 参数误填 `native-powershell`，命令仍按 PowerShell 文本检查成功；未用 Bash，未改文件。
36. 零：读取 `formal-report` 技能说明。
37. 零：读取 `cn-prose` 技能说明。
38. 零：最终 `Get-Item` 加 `Get-FileHash` 只读核对 consumer、本报告与交回件。

写入动作共 4 次 `apply_patch` 调用，涉及 3 个文件面：

- W1：用 `apply_patch` 修改唯一源码 `native-real-conversation.mts`。
- W2：用一次 `apply_patch` 新增本报告与协调目录交回件。
- W3：用 `apply_patch` 修正本报告误算的命令总数、最终编号和交回件写动作措辞。
- W4：用本次 `apply_patch` 校正本报告与交回件的写入动作账。

没有其他文件写入。

## 下一步建议

当前状态是有界消费端修正已写，运行时待 root 独立核验。root 应先检查本报告、新 `.mts` 的 54,690 字节与 SHA-256，再做一次受控的有限编译检查。只有该门通过且 Key 条件满足时，才安排完整四问；AUTHOR 到此停止。

删减轮：读者 1 / 槽位 0 / 半句 2 / 重复 2 / 过程 1 / 黑名单 2

Response ID: 本次聊天未提供

Response log path: chat reply
