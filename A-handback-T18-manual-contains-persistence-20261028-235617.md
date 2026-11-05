# A 线交回：T18 contained-form 状态文法与真实会话只读持久化

## 状态

- 执行者：独立 A 线 DeepSeek 执行者
- 任务令：`D:\Lawbeach\lawbench-coord\A-T18-manual-contains-persistence-order-20261028-235617.md`
- 本阶段状态：**源码与静态检查完成；运行验证未执行，待主编排完整复核后执行**
- Git：严格只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`
- 产品代码、B 线、契约、manifest、pins、编译产物、旧测试和实际草稿均未修改

## 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts` | 117399 | `FE1282280325928FA78032433E74ABC3BDFF933784BA385BBB6F3399987E8564` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-contains-status-20261028-235617.spec.mts` | 21588 | `B1BB6FBD554B0B9CB675EE8FEFEEE691534AB0B2C07904C58B8B317194801812` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\read-genuine-session.mts` | 22897 | `C7DF50338B7742A2D2D5E56FD62AFE377B238738A2D29685357CE8DF66C7C74D` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\README.md` | 4621 | `0B12083CBFE67053E528F0DA19EE937CBF70E3D09D6553ED391207360FF8509F` |

## 1. 手工原因状态的单行修复

修复前源码 SHA-256：`D42E96E5D424BE27954A04B485D9F5768104FDD5001DF90DCFC2DE634CECA1F2`，117382 字节，2944 行。

修复后仍为 2944 行。逐行比较结果为：只有第 1704 行变化，其他行内容一致；文件增加 17 字节，全部来自新增文法字符。

第 1704 行现在以一个锚定的有限文法完成以下收口：

- 正向边界原因接受 `包含`、`跨越`、`含`；
- 边界仍只允许 `超链接`、`域代码`及其既有固定组合；
- 失败状态接受 `系统(修改清单)(无法处理|未收下|未接受)`；
- 既有 `系统无法自动替换`、`系统不能自动替换`、`未能应用`、`应用未成功`、`系统未纳入修改清单`保持不变；
- 否定原因、成功状态、无关原因、任意后缀和把其他风险块文案挪来顶替仍不匹配。

没有增加整句实际草稿例外、NLP、宽松 `includes`、成功声明或自定义后缀。

## 2. 新增测试副本

输入旧测试：

- `manual-status-scope-20261028-232316.spec.mts`
- 18462 字节
- SHA-256：`AE77BBF28D1B5CB857E4BDACDCCAD254DC26879704895844A567A13C755ADB1F`

新测试以前者完整字节为前缀。静态字节比较确认旧文件 18462 字节逐字节一致，只在末尾追加 3126 字节；旧测试的既有场景体和调用均未改。

追加部分使用真实 60 行产物的不可变输入：

- 草稿：9170 字节，SHA-256 `1B095356F48C4A7AE9E94BD171C92377385D70FF3730C59FCB50F26822CBA31D`
- 编辑结果：3575 字节，SHA-256 `EE45FCE70B3C35A01CD7C29779F8C33174E7C084B29EFB079E3BE69C975DFC6A`
- 正例：`原文含超链接，系统修改清单无法处理`
- 负例：否定原因、成功处理、其他原因、错误风险块绑定

## 3. 真实会话只读持久化入口

入口硬编码并校验清单：

- 路径：`D:\Lawbeach\lawbench-coord\T18GenuineArtifactContinuationInput-20261028-235617\genuine-inputs.json`
- SHA-256：`E776968F25602AF1640987EC08245AF911E1F60713EEF12FCC6B9A95ACE24AB1`

入口要求调用者只传入一个新鲜、空、普通目录作为自有工作根。它不会在 HOME、AppData 或 TEMP 中创建运行目录，不会使用原始 case 或 sessions 作为运行时根。

入口将原始 case 与整个 sessions 树复制到该工作根，并核对：

- case 文件数和逐文件字节、SHA-256、`mtime_ns`；
- sessions 文件数和逐文件字节、SHA-256、`mtime_ns`；
- 外部 `actual-native-events.jsonl` 与源 session 文件逐字节一致；
- header 保留真实 session UUID、cwd 和 version 4；
- 物理文件为 1 行 header + 60 行 event；
- event `seq` 从 0 到 59 连续，真实 native request ID `60fda87b-25a9-40c1-9abd-1e4893fa7b8b` 存在。

原生消费者严格复用当前已证明的装配：

`Cordis.Context` → `LlmRuntime` → `SessionStore` → `ProjectionRegistry` → `SystemPrompt({personaPrefix:''})` → `ToolRuntime` → `AgentRegistry` → `installModelSelectionProjection` → `JsonlPersistence({compression:'none'})` → `AgentLoop({agents:[]})` → `sessionPersistence.open(sessionId, 'read')` → `handle.read()` → `handle.close()` → `Context.fiber.dispose()`。

关闭释放后再次独立重开。静态源码检查结果：

- `sessionPersistence.open(..., 'read')`：1 处，无 append/resume 模式；
- 空 `AgentLoop agents`：1 处；
- 空 `SystemPrompt personaPrefix`：1 处；
- `compression:'none'`：1 处；
- 新建 session、事件写入、消息发送调用：0；
- `node:http`、`node:https`、`node:net`、`node:tls` 导入：0；
- `process.env` 读取：0；
- 全局 `fetch` 先替换为拒绝计数函数，结束后恢复。

成功运行时还将执行以下语义核对：

- 第一次只读事件与不可变物理 60 条 event 全部深等；
- 关闭并释放后第二次重开仍与第一次全部深等；
- 两次读取前后复制 JSONL 均字节不变；
- 来源 case/sessions 在开始与结束的 SHA、字节数、`mtime_ns` 全部一致；
- 模型、agent 回调、provider、凭据值及 HTTP 新调用均为 0；
- 只删除入口创建的 `case` 与 `sessions` 副本，删除后工作根为空。

## 静态检查记录

- 正式输入清单 SHA-256 与执行令一致。
- 原始工作流副本 SHA-256 与执行令的 `D42E96...` 一致。
- 源码逐行比较：2944/2944 行，唯一变化行号 1704。
- 新测试旧前缀逐字节比较通过；旧前缀 SHA 与输入副本一致。
- 入口危险能力扫描通过：无直接网络导入、无环境变量读取、无会话创建、无事件写入、无消息发送。
- 未运行 Node、Python、TypeScript 编译器/AST、测试、构建、HTTP 或 GUI。

## Git 与工作树阻碍；非本运行器修复项

- `git status --short --branch` 只读失败：Git 无法进入 `lawbench-A` worktree 元数据下的 `dsh` 子模块，返回 `Permission denied`。
- 改用 `--ignore-submodules=all` 后，主仓显示大量既有 dirty/untracked 文件；Git 还报告多个超过 Windows 路径长度限制的真实运行目录无法打开。
- 因此本交回不以 `git status` 作为完整脏状态证明；已使用执行令提供的 A/B dirty-before 快照和逐目标哈希保全现状。
- 未尝试修锁、提权、改 ACL/审批/沙箱、拆 writer 锁或清理工作树。

## 主编排复核后的执行命令

以下命令本阶段均未运行。主编排必须先完整复核 `read-genuine-session.mts` 的装配、失败路径和 `finally` 清理，再执行。

聚焦手工原因文法：

```powershell
Set-Location 'D:\Lawbeach\lawbench-A'
node '.\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-contains-status-20261028-235617.spec.mts'
```

只读持久化续证，其中 `$runRoot` 必须是执行者新建并确认空白的自有目录：

```powershell
Set-Location 'D:\Lawbeach\lawbench-A'
$runRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\run-<fresh-owned>'
New-Item -ItemType Directory -Path $runRoot
node '.\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\read-genuine-session.mts' $runRoot
```

执行入口成功后，仍要独立审阅 stdout 报告，不能只以退出码 0 代替深等、关闭释放、来源身份和清理字段的检查。

## 未宣称与遗留

- 本阶段没有执行任何新测试，不能宣称新测试已绿或持久化入口已实跑通过。
- 历史 `run-fQoiXe` 是已完成真实 native 会话，物理 event 为 60 条；其原始窗口记录为 153.594 秒、1 次自然回答、10 次 model POST/HTTP 200、9 次 tool call。
- 本次续证不新增模型窗口、不新发请求；即使只读重放通过，也只是持久化证明。
- 实际草稿的风险 3 仍把原文 4.1 写成“合同第七条”，业务质量仍为 FAIL；不得改写实际草稿或声称 T18 全量业务通过。
- 未生成 redline、DOCX 或反馈 JSONL；Gate 1 仍未完成，项目未完整，Packaging 保持 `HOLD`。
