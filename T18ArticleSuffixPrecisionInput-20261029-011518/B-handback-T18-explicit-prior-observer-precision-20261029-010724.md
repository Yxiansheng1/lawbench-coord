# T18 精度修订源码交回

状态：`SOURCE_HANDED_BACK_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修复四项 fixture 源码缺陷，更新 consumer 的两个 manifest pin，新增 precision note。 |
| 目标是什么 | 交给 Root 做全量静态审查、编译、admit 和唯一一次保存的 DPAPI 真实工作流。 |
| 在等什么 | 等 Root 的当前源码审查与运行结果。收到通过结果即封存；收到实际失败即按原始证据定位，不补造结果。 |
| 卡在哪 | 没有源码交回阻塞。运行时、编译与测试按令禁止，均由 Root 执行。 |

## 当前文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts` | 112,107 | `07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json` | 19,484 | `a482b49d8387f8074835e9730b388bd4e78b882083b14ce2a0ad7346ff949c4d` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py` | 38,214 | `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md` | 5,617 | `874927ff1f8c39860b3614866d93b6616d8b35f1ebecc4d6c6413d65e30709ae` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-observer-lifecycle-20261029-010724.md` | 3,817 | 写后只读复核，README 未覆盖 |

修订前 consumer 为 110,111 字节、`a13f40118f371fb7e9b7c400d841f21eb88fc9b85f459fa64f07580de4f2c05e`；修订前 manifest 为 19,484 字节、`92eb03a9210d0cc57f67ee4c38e66e675c7be93eed5d3e486e54805b0cb13d47`。两个旧值均与本次输入副本逐字节一致。companion service 与旧 README 的字节、SHA 和 mtime 保持原值。

## 实际修改块

1. observer 单编辑。删除分段文本 `includes('第七条')`、`includes('4.1')` 和 160 字上限；保留 maximal common prefix/suffix。新增判定要求：

   - `oldDelta.equals(Buffer.from('七','utf8'))`
   - `newDelta.equals(Buffer.from('4.1','utf8'))`
   - `prefix === deltaStart`
   - `suffix === originalBytes.length - afterArticle`
   - `deltaStart` 由原稿风险 3 内“第七条”的实际字符位置换算为 UTF-8 字节位置。

2. 问题回调。删除提问措辞正则与 `scope` 必问假设。阶段一 ID 固定为 `draft`、`doc_type`，阶段二为 `draft`、`opinions`；ID 数量、未知值、重复值均受检。答案按 ID 生成，roles 元数据只由 ID 产生。成功 callback 的结果哈希、长度、call ID 和保存顺序进入阶段报告。

3. header 观察。从 `D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\native-contract-workflow.mts` 原样恢复 `requestHeaderAtBoundary`。每阶段从会话前缀 `SessionLogOffset(0)` 到 `SessionLogOffset(afterSeq)` 取实际 header，断言 provider=`lawfirm`、model=`qwen38-27b`、maxTokens=`32768`，并写入 `turn.requestHeader` 与 `turn.requestHeaderAnchor`。旧 header 复用仍合法。

4. finally 回收。每阶段结束和异常路径都重新执行 `production.live.agents.get(sessionId)`。存在 agent 时先用生产同步 `commands.cancel`，再用 `whenIdle()`；`get` 与 `list` 共同证明 absence 时才允许把 `agentJoined` 记为 true。该块位于 B 服务 stop 之前，browser、Context、B、fetch、环境、stdin 与最终 pins 流程未改。

manifest 只把 `consumer.bytes` 从 110,111 改为 112,107，把 `consumer.sha256` 改为 `07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3`。与输入 manifest 的只读 diff 只有这两行。

## 依据与验证

- consumer 对输入基线的只读 `git diff --no-index` 仅显示上述四处及相关报告字段。
- manifest 对输入基线的只读 diff 仅显示第 390、391 行。
- 当前 replacement observer 的旧 `questionRoles`、`answerTextForRoles`、`includes('第七条')`、`includes('4.1')` 和 160 字长度限制均无命中。阶段一清单验收中另有独立的 160 字局部上下文，不是正文单编辑窗口。
- 旧权威 helper 与当前 helper 用 `Compare-Object` 对相同行区间比较，无差异。
- 所有当前 SHA 和字节数来自只读 `Get-FileHash` 与 `Get-Item`。
- 原始 T18 业务失败保持不变。没有宣称产品失败或模型红。没有声明 fixture 已运行。

## 未做与降级

没有运行 Node、Python、tsx、解析器、AST、导入、测试、编译、构建、预检、prepare、HTTP、模型、GUI、SSH、凭证读取或 DPAPI。没有运行候选、B 服务或产品。没有构造修正正文给模型，没有改 prompt、模型参数、B 服务、产品代码、Skill、契约或冻结证据。

没有 Git 写操作。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。初始普通只读 `git status` 因共享 `dsh` 子模块路径权限被拒；随后只读 `status --ignore-submodules=all` 成功。未修改锁、ACL、权限、审批或沙箱，未拆 writer 锁。当前执行者只作为本次单一 B writer，没有启动第二 writer。

## 写面孔

- `apply_patch` 四次修改 `native-genuine-quality-revision.mts`。
- `apply_patch` 一次只改 `fixed-inputs.json` 的 consumer bytes/SHA。
- `apply_patch` 新增 `precision-note-observer-lifecycle-20261029-010724.md`。
- `apply_patch` 新增本交回件。
- 没有其他写文件动作；没有 Git 写入；没有外部消息或模型调用。

## 实际命令

以下按执行顺序列出本次所有 shell 命令。`0` 表示命令本身成功；`1` 表示非零。diff 的 `1` 是发现预期差异；文本搜索的 `1` 是确认无命中；权限拒绝也已列出。

1. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-explicit-prior-observer-precision-order-20261029-010724.md' -Raw`
2. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\root-findings.json' -Raw`
3. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\root-delta-counterexample.json' -Raw`
4. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-explicit-prior-revision-order-20261029-004226.md' -Raw`
5. `1` `git status --short --branch`；`fatal: cannot chdir .../modules/dsh: Permission denied`
6. `0` `Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json' | Format-Table -AutoSize Path,Hash`
7. `0` `git -c submodule.recurse=false status --short --branch --ignore-submodules=all`
8. `0` `Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py' | ForEach-Object { '{0}|{1}' -f $_.Hash,$_.Path }`
9. `0` `Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py' | Select-Object FullName,Length,LastWriteTimeUtc,LastWriteTime | Format-List`
10. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json' -Raw`
11. `0` `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226' -Force | Select-Object Name,Length,LastWriteTimeUtc,Attributes | Format-Table -AutoSize`
12. `0` `git diff --no-ext-diff --ignore-submodules=all --stat -- 'docs/plan/evidence/T18/ExplicitPriorQualityRevision-20261029-004226'`
13. `0` `rg -n -C 35 "function oneContiguousEdit|oneContiguousEdit\\(" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
14. `0` `rg -n -C 55 "setupProduction|user-questions|questionRoles|ask_user|answered" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`；该次 shell 路径少 `runtime` 段，但实际仍是 PowerShell。
15. `0` `rg -n -C 70 "requestHeaderAtBoundary|executeStage|afterSeq|SessionLogOffset|finally" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
16. `0` `rg -n -C 55 "requestHeaderAtBoundary" 'D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\native-contract-workflow.mts'`
17. `0` `Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md' -Raw`
18. `0` `Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts' -TotalCount 260`
19. `0` `rg -n -C 18 "questions:|id: draft|id: doc_type|id: opinions|id: scope|ask_user_question" 'skills\pre-issue-check\SKILL.md' 'skills\doc-revise\SKILL.md'`
20. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1298..1415]`；该次 shell 路径少 `runtime` 段，但实际仍是 PowerShell。
21. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1700..1915]`；该次 shell 路径少 `runtime` 段，但实际仍是 PowerShell。
22. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2210..2560]`
23. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2688..2778]`
24. `0` `rg -n "requestHeader|headerConfig|taskParams|max_tokens|agentJoined|production\.live\.agents\.get|production\.live\.agents" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
25. `0` `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\native-contract-workflow.mts'; $lines[3260..3345]`
26. `0` `rg -n -C 20 "agents\.get\(|agents\.list|AgentRegistry|agentJoined|owned agent|live\.agents" 'D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\native-contract-workflow.mts'`
27. `1` shell=`bash`：`rg -n -C 18 "class AgentRegistry|agents\.get|agents\.list|declare.*agents|register.*agent|unregister" 'D:\Lawbeach\lawbench-A\dsh\packages\core\agent\src\index.ts' 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\agent.ts'`；`Bash/E_ACCESSDENIED`，无输出。
28. `1` shell=`bash`：`rg -n -C 25 "async prompt|prompt\(|resolveAgent|agents\.resume" 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\commands.ts' 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\agent.ts'`；`Bash/E_ACCESSDENIED`，无输出。
29. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1988..2032]`
30. `0` `rg -n -C 12 "class ApiSessionAgentController|get\(|list\(|status|whenIdle" 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\agent.ts'`
31. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1415..1492]`
32. `0` `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\core\agent\src\index.ts'; $lines[1..260]`
33. `0` `rg -n -C 20 "class AgentRegistry|export default.*Agent|register\(|get\(id|get\(session|isOwnedBy|has\(" 'D:\Lawbeach\lawbench-A\dsh\packages\core\agent\src\index.ts'`
34. `1` shell=`bash`：`rg -n -C 15 "class SessionCommandController|prompt\(|cancel\(|agents:" 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\commands.ts'`；`Bash/E_ACCESSDENIED`，无输出。
35. `0` `rg -n "questionRoles|answerTextForRoles|'scope'|160|oldText\.includes|newText\.includes|questionRoleFromId|mandatoryQuestionIds|answerTextForQuestionId" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
36. `0` `rg -n -C 35 "function requestHeaderAtBoundary|function oneContiguousEdit|function risk3BlockRange|function observeQuestionBeforeFirstDraft" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
37. `1` shell=`bash`：`rg -n -C 45 "user-questions/request|requestHeaderAtBoundary\(|ownedAgent|headerConfig\.provider" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`；`Bash/E_ACCESSDENIED`，无输出。
38. `0` `Get-FileHash -Algorithm SHA256 -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md' | ForEach-Object { '{0}|{1}' -f $_.Hash,$_.Path }`
39. `0` `Get-Item -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md' | ForEach-Object { '{0}|{1}|{2:o}|{3:o}' -f $_.FullName,$_.Length,$_.LastWriteTimeUtc,$_.CreationTimeUtc }`
40. `0` `rg -n -C 45 "user-questions/request|requestHeaderAtBoundary\(|ownedAgent|headerConfig\.provider" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
41. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1328..1378]`
42. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2334..2398]`
43. `1` shell=`bash`：`$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2568..2612]`；`Bash/E_ACCESSDENIED`，无输出。
44. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2750..2795]`
45. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2610..2655]`
46. `0` `$lines = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1930..1962]`
47. `0` `rg -n "requestHeader:|requestHeaderAnchor:|answerResultSha256|answerResultLength|agentJoined = true|SCOPE_ANSWER" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
48. `0` `rg -n -C 18 "class SessionCommandController|cancel\(|async cancel|prompt\(" 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\commands.ts'`
49. `0` `$old = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\native-contract-workflow.mts'; $current = Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; Compare-Object -ReferenceObject $old[1369..1401] -DifferenceObject $current[1481..1513] -SyncWindow 0`
50. `1` shell=`bash`：`Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\native-genuine-quality-revision.mts' | ForEach-Object { '{0}|{1}' -f $_.Hash,$_.Path }`；`Bash/E_ACCESSDENIED`，无输出。
51. `0` `Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\native-genuine-quality-revision.mts' | ForEach-Object { '{0}|{1}' -f $_.Hash,$_.Path }`
52. `0` `Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\formal-report\SKILL.md' -Raw`
53. `0` `Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\cn-prose\SKILL.md' -Raw`
54. `1` `git --no-pager diff --no-index --no-ext-diff --unified=3 -- 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\native-genuine-quality-revision.mts' 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`；预期差异，输出四处修改。
55. `0` `Get-FileHash -Algorithm SHA256 -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md' | ForEach-Object { '{0}|{1}' -f $_.Hash,$_.Path }`
56. `0` `Get-Item -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py','docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\README.md' | ForEach-Object { '{0}|{1}|{2:o}' -f $_.FullName,$_.Length,$_.LastWriteTimeUtc }`
57. `0` `Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json' -Tail 12`
58. `1` `git --no-pager diff --no-index --no-ext-diff --unified=2 -- 'D:\Lawbeach\lawbench-coord\T18ExplicitPriorObserverPrecisionInput-20261029-010724\fixed-inputs.json' 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json'`；预期差异，只显示 bytes 与 sha256。
59. `1` shell=`bash`：`rg -n -C 8 "function sha256Bytes" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`；`Bash/E_ACCESSDENIED`，无输出。
60. `0` `rg -n -C 8 "function sha256Bytes" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
61. `0` `Select-String -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json' -SimpleMatch -Pattern '112107','07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3','77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a' | ForEach-Object { '{0}:{1}' -f $_.LineNumber,$_.Line.Trim() }`
62. `1` `rg -n "questionRoles|answerTextForRoles|oldText\.includes|newText\.includes|oldText\.length > 160|newText\.length > 160" 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`；无命中，确认旧逻辑不在正文 observer。
63. `0` `Get-Content -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-observer-lifecycle-20261029-010724.md' -Raw`
64. `0` `Get-Item -LiteralPath 'docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-observer-lifecycle-20261029-010724.md' | ForEach-Object { '{0}|{1}|{2:o}' -f $_.FullName,$_.Length,$_.LastWriteTimeUtc }`
65. `0` `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T18-explicit-prior-observer-precision-20261029-010724.md' -Raw`

七次 `bash` 拒绝分别是命令 27、28、34、37、43、50、59；均无命令输出，且没有执行产品、候选或测试。三次 shell 路径少 `runtime` 段的调用为 14、20、21；均实际执行 PowerShell。其余 shell 调用均使用指定的绝对 native `pwsh.exe` 和 `login=false`。

删减轮：读者 3 / 槽位 2 / 半句 4 / 重复 3 / 过程 0 / 黑名单 3

## 下一步建议

Root 直接审查当前 consumer 与 manifest pin，再按其既定权限完成编译、admit 和唯一一次真实工作流。当前不需要 B 线再做人工动作；若 Root 得到真实源码阻塞或运行失败，把原始错误与当前 SHA 交回，B 线只按证据修复相应源码。

Response ID: chat reply
Response log path: chat reply
