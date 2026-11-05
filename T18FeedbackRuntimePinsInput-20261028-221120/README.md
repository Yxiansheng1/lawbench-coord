# T18 QuestionGate 合同审查工作流输入

状态：`PINS_REFRESHED_NOT_RUN_BY_AUTHOR`。本目录只准备一次独立工作流所需的 consumer、有限 B 入口、固定输入和说明。本次命名号码钉扎执行没有运行 Node、Python、TypeScript 解析器、测试、编译器、HTTP、模型、GUI 或安装包流程；下面只引用已由 root 完成且源码身份未变的有限结果。本目录不是完整 T18、业务质量或发布验收。

本目录保留上一轮 `assertOutOfScopeReported` 观察语义更正，并在原有 24 项原因观察测试末尾增补 10 项自然原因/状态及负例；新旧测试均待 root 复核运行。接续的命名钉扎只把 B 源映射、B 入口、固定输入和 consumer 摘要从 `-direct` 身份切换到 `-named`；旧 direct 身份、旧实跑、旧红态和原报告均不可变。数值比例 `20 vs 2` 问题仍属 B 线上下文，不在本目录的源码修正范围内。

## 当前身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 107381 | `d194cc74bc445c9e9fbf0241faaf105d67e770f3bccc4afe646cc1d772df6002` |
| `manual-reason-observer.spec.mts` | 12909 | `e06e554ab46b792bc5aea1ed93ce20a0b8e3a1ee7763936ef1285d0976910a2a` |
| `b-service.py` | 30634 | `ac7ccb2607ffc52c55c1e29ba84e3d6a5f8294937c3f93f3339988762649ab84` |
| `fixed-inputs.json` | 17193 | `1119535d0bff70be82b214c3956437c2922fb4874ac050b42b7d8eed8d13488f` |
| `reviewed-b-source-pins-named.json` | 53548 | `ccb030e6a47d2ecd61852085a990459f0c02eca982d748f17f00563a4e0c3b5b` |
| `reviewed-b-source-pins-direct.json`（上一轮保留） | 53548 | `d3acf07a4d50e8de5c6e7b56c823be086795e1efcd2e24d7f245a6c7bc975803` |
| `reviewed-b-source-pins.json`（历史保留） | 53548 | `3a6615c7eae3d8f977910cc13ac455d43f8e1e7d135eab88bcb2f1dca65cfb31` |

## B 源映射与号码钉扎

`reviewed-b-source-pins.json` 保留为历史身份，供旧运行 `Q5tQMz` 引用。上一轮 `reviewed-b-source-pins-direct.json` 从该文件逐字节复制，只将 `service/lawbench/tools/drafts.py` 从 13437 字节、`7c54c068…d0ab` 改为 14654 字节、`816869ed…fa2`。接续的命名钉扎再从 direct 文件逐字节复制为 `reviewed-b-source-pins-named.json`，只把同一行从 14654 字节、`816869ed…fa2` 改为 root 已审的 17262 字节、`255a99da…4f5`。其余 345 项、条目顺序、346 项计数、CRLF 布局及 53548 字节大小均未变。

只读核对对 346 项逐一读取 B 工作树文件并计算 SHA-256：旧映射其余 345 项全部一致；`drafts.py` 只匹配批准的新身份。没有从当前工作树批量生成映射，也没有接受任何其他当前 SHA。

`b-service.py` 的 `SOURCE_PINS` 路径和 `SOURCE_PINS_SHA256` 现指向命名映射 `ccb030e6…3b5b`；`SOURCE_PINS_BYTES` 仍为 53548，`SOURCE_PINS_ENTRIES` 仍为 346。文件名后缀从 `-direct` 改为 `-named` 和该摘要替换是仅有的改动，反向替换可逐字节还原上一轮 30635 字节、`0cc12878…c70b` 的 B 入口。

`fixed-inputs.json` 的 `sourcePins.path`、`sourcePins.bytes`、`sourcePins.sha256`，以及 `bServiceEntry.bytes`、`bServiceEntry.sha256` 现记录命名链；其中路径、映射摘要、B 入口字节和 B 入口摘要共 4 个值发生变化，映射字节仍为 53548。本地 67 个路径/字节/SHA 三元组、所引 46 项 native 基线和 346 项 B source pin 合计 459 个固定文件身份；fixture 路径、字节、SHA-256、`mtime_ns`、runtime executable、旧 accepted proof 及其他 JSON 字段均未重算。当前文件为 17193 字节、`1119535d…3488f`，反向替换可逐字节还原上一轮 17194 字节、`b8a9b829…280a` 的固定输入。

consumer 在上一轮将 `FIXED_INPUTS_SHA256` 从 `7bd20304…72bc` 改为 `b8a9b829…280a`；命名钉扎只再将该常量改为当前固定输入摘要 `1119535d…3488f`。当前仍为 107381 字节、`d194cc74…6002`；反向替换这一个常量可逐字节还原命名钉扎前的 107381 字节、`7482f47d…7bbb` consumer，人工原因子句、两个 current runtime 动态导入、`skillQuestions` 延迟闭包及调用点均未变化。

## 人工原因观察器更正

目标仅为 `assertOutOfScopeReported` 及其唯一调用点。函数第三步接收实际编辑清单，逐项按以下链条绑定，不再使用全文 `includes`：

1. `out_of_scope.id` 必须在实际 `edits` 中恰好出现一次；
2. 实际编辑评论中必须恰好包含一个 `风险N`，其 `para` 必须出现在同一风险块的段落引用中；
3. 同一风险块必须恰好有一条 `处理方式`，且为 `该条需人工修改（原因）`；
4. 原因必须在同一处理方式内匹配。`find 跨越域代码或超链接` 允许旧有的 `find 跨越超链接`、`域代码`，也允许以 `find`、`原文` 或 `匹配文本` 为主体，明确陈述包含或跨越超链接/域代码；状态可接在分隔符后用封闭的失败表达，不能接成功状态、否定原因或任意后缀。其他机器原因保持归一化精确匹配。

缺失、重复或歧义 id、风险块、段号引用或处理方式均失败关闭。其他风险块内出现人工修改字样不能代替目标条的对应块。

`manual-reason-observer.spec.mts` 从当前 consumer 源码中提取唯一顶层函数，先按调用目标白名单检查，再以已安装 TypeScript 转译到无 `process`、网络、文件系统能力的有限 VM 中执行；不导入 consumer，因此不会触发 `main()`。原有 24 项用例的前缀逐字节保留，末尾新增最新实际 id 2 输入通过、自然原因/失败状态正例，以及错误边界、否定、成功状态、无关后缀、错误风险和其他机器原因负例。该测试源码已写，但本执行者按执行令没有运行它。

root 完成源码复核后，离线测试命令轮廓为：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-reason-observer.spec.mts'
```

该命令不接收凭据、不启动 HTTP、模型、GUI 或完整 consumer。

`fixed-inputs.json` 的四条 `accepted-private-runtime` 已从当前新编译输出取字面 pin：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| `current-compiled-agent` | 549374 | `af533872ed30e41aeb2de823d24261a588f4b72c96f753ab05ead01def67c6e6` |
| `current-compiled-host` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `current-compiled-package-metadata` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `current-compiled-manifest` | 58199 | `af0d8cc2adae28bdae370d140044403ad9060a54b4a2a80c252991be42d88e88` |

四条 `accepted-private-runtime` 身份在本轮保持不变。`bServiceEntry.path` 仍指向本目录的 `b-service.py`；本次号码钉扎后的字节和 SHA-256 见 `fixed-inputs.json`。消费者内的 `FIXED_INPUTS_SHA256` 与当前 `fixed-inputs.json` 的实际摘要一致。

## 延迟能力接线

在本次观察器更正之前，`native-contract-workflow.mts` 相对冻结 consumer `005889a8…` 只有四个预期变化：

1. 在 `lawbenchCore` 手动能力对象中加入 `skillQuestions: (skillName: string) => remote.skillQuestions(skillName)`。
2. 第 1030 行的 `ExtAgentModule` 动态导入改为直接加载本目录 current runtime 的 `agent.js`。
3. 第 1031 行的 `ExtHostModule` 动态导入改为直接加载同一 runtime 的 `host.js`。
4. 更新上述固定输入摘要。

新增能力项是箭头闭包，不在对象构造时调用 `remote`。只读核对当前 Agent 源码与编译产物确认：`apply()` 构造 `LegalAgent` 时只保存 `skillQuestions` 回调；回调到 `preStep()` 的 `requiredQuestionIds()` 才执行；consumer 在 `applyLegalAgent()` 与 `AgentLoop` 设置之后才声明 `remote`，并在 `setupProduction()` 返回后继续案件工作流。因此该闭包按当前 ESM 词法顺序是延迟求值。两个动态导入现在分别精确指向：

- `file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/agent.js`
- `file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/host.js`

两字符串各出现一次。把固定输入摘要换回本轮写入前的 `7bd20304…72bc`，可逐字节还原 107202 字节、`31415f0ec05605bba10e69721c4579fa21d00d553c9af38d84c74ee1b103b3f9` 的 consumer；人工原因子句和 9832 字节 observer 测试不在本轮修改范围内。

## 冻结与资格

- 协调目录中的旧映射、修改前 B 入口、修改前固定输入、修改前 consumer、原 observer 和旧运行结果均为只读 before 证据。完成后只读反向核对这些 before 文件身份，数值不变。
- 本轮数字链只更新令内列明的直接映射一行和后续五个数据值。新映射、B 入口、固定输入和 consumer 的身份见上表；每一层反向替换都只还原指定字段，其他字节不变。
- root 已完成当前 24 项 observer 有限通过：1.172 秒，自然完成，2 个 Node 身份取得完整 OS 起止信息，运行后无残留。
- root 已完成当前受影响有限两路：8 项 rate-unit 通过 1.657 秒；12 项 affected-current 通过 2.203 秒。两路均自然完成、各 1 个完整 Python OS 身份、运行后无残留，当前 `drafts.py` 摘要前后一致。
- 旧 actual model 运行 `Q5tQMz` 为 225.859 秒、11 次 HTTP 200，但数值语法与答案/原因观察失败；其 observer、报告和证据保持不可变。上述有限通过不能写成模型实跑通过。
- 原始 actual QuestionGate 曾通过；旧数学比例结果仍为红。当前结果不能写成完整 T18、redline/OOXML 或发布通过，Packaging 保持 **HOLD**。
- 本轮不启动 host、模型、编译或测试；同一合同流程的全量命令/源码反向/459 项 pin/BAST/ESM 核对及一次新的实际模型运行由 root 后续执行。
- Skill 正文、任务说明、判分要点、旧 consumer、旧 B 入口、旧 manifest、旧运行证据、SDK 和 legacy 树均保持冻结。本目录未导入任务说明或判分要点，未提供预期答案或伪造模型/工具结果。

## root 顺序更正

先前说明把“只允许两处 consumer 改动”解释成继续导入旧 T31 编译包，因而把动态导入与已批准的 current runtime pin 判为不可同时满足。root 现已明确更正：两个动态导入也必须更新，并额外批准 `fixed-inputs.json` 中 5 条已经审过的源码字面 pin。上述修正均已按精确路径完成，不再存在旧说明所述的 import 阻塞。

本轮只做源码和固定输入的字面修正与只读机械核对。没有运行 Node、Python、TypeScript 解析器、动态导入、测试、编译器、HTTP、模型、GPU、GUI 或安装包流程，因此不能把输入一致性表述为实际工作流通过；合同问题实际先后、模型草稿/编辑清单、redline/OOXML、源材料保持、JSONL 重开、清理和 watchdog 仍有待 root 在授权环境实跑验证。

## 未运行

仅保留以下命令轮廓供 root 裁定阻塞后执行；本执行者未运行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts' --credential-stdin
```

凭据只由 root 现有驱动解密后经匿名 stdin 输入，不进入本目录、参数、环境变量或报告。合同问题的实际先后、模型草稿/编辑清单、redline/OOXML、源材料保持、JSONL 重开、清理和 watchdog 仍需 root 在授权环境实跑；先前 `20 vs 2` 与阅读质量未解决事项不受本轮影响。Gate 1、完整 T18 与项目未完成，Packaging 保持 **HOLD**。

## 复合人工原因子句更正（2026-10-28 21:27）

本节只保留上一次已审身份之后的新增更正；上表仍是更正前身份，不覆盖旧记录。当前 `native-contract-workflow.mts` 为 107447 字节、`4228076465001F210F18D5BC90542F7A1BB6EB0DBD04C424961B4A5C92163CF4`，共 2691 行，只改第 1693 行的 `crossBoundaryReasonClause`。当前 `manual-reason-observer.spec.mts` 为 14571 字节、`25ADCBBE8A2A0C061F668FDD23058A3B946D1970639BAA8ADA6775C389D48239`。

复合子句更正只做两项封闭扩展：

1. 明确“包含或跨越”之后可同时指出超链接和域代码，接受实际拼接 `超链接域代码` 及其对称顺序 `域代码超链接`；
2. 失败状态家族加入实际出现的 `系统未纳入修改清单`。

原有 `find跨越域代码或超链接`、`find跨越超链接`、`域代码`、自然表述和旧失败状态均保留；否定原因、成功状态、任意后缀、错误风险、id 或段号仍失败关闭。其他机器原因继续使用归一化精确匹配，没有增加全篇扫描、宽泛 NLP 或弱原因语义。

原 spec 的 12909 字节前缀与更正前文件逐字节一致。末尾只追加 1 个当前真实复合子句正例和 3 个负例：复合原因配成功状态、只有失败状态没有原因、复合原因被否定。累计 authored 38 项（原 34 项加新 4 项），本次未运行，不能声称测试通过。

本轮未调用 Node、Python、TypeScript 解析器、测试、自测、导入、编译、准备、HTTP、模型、GUI、GPU、SSH、凭据或真实案卷，只做了文本和字节核验。root 仍需按顺序完成全源反向核对与全部命令、当前有限测试、字面常量编译器，再执行实际模型流程；Gate 1、完整 T18 和发布结论仍不成立，Packaging 保持 **HOLD**。
