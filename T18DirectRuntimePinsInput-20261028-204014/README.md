# T18 QuestionGate 合同审查工作流输入

状态：`AUTHORED_NOT_RUN`。本目录只准备一次独立工作流所需的 consumer、有限 B 入口、固定输入和说明。本次号码钉扎执行没有运行 Node、Python、TypeScript 解析器、测试、编译器、HTTP、模型、GUI 或安装包流程；本目录不是完整 T18、业务质量或发布验收。

本目录保留上一轮 `assertOutOfScopeReported` 观察语义更正，并增加 B 源映射、B 入口、固定输入和 consumer 摘要的一次号码钉扎。旧实跑、旧红态和原报告均不可变。数值比例 `20 vs 2` 问题仍属 B 线上下文，不在本目录的源码修正范围内。

## 当前身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 107162 | `f9490c16259e98eab221a1215bbe98459587a479fb50ba64be08ef4b0fb8ee49` |
| `manual-reason-observer.spec.mts` | 7386 | `1455f9e3bd683b0ce10b41ce1bf3f315c304bb39d9a537ece12a89c6322da890` |
| `b-service.py` | 30628 | `c78d249fa0303281534e82e5b957c566d90a60f853879917a0d393fbdc577e05` |
| `fixed-inputs.json` | 17187 | `7bd20304f3a2622e37e7631a7067f9ed889126aac8908017ff14e53ab6a372bc` |
| `reviewed-b-source-pins.json` | 53548 | `3a6615c7eae3d8f977910cc13ac455d43f8e1e7d135eab88bcb2f1dca65cfb31` |

## B 源映射与号码钉扎

`reviewed-b-source-pins.json` 由协调目录的旧 reviewed B 映射逐字节复制。旧文件为 53547 字节、`5afec662…68cf`，共 346 项。新文件只将 `service/lawbench/tools/drafts.py` 一行从旧前的 6779 字节、`119d3cea…2f2a` 改为批准值 13437 字节、`7c54c0685edec082cea405e30ad08b38637bdbd1ec3afedeb6e3712fbaebd0ab`。其余 345 项、条目顺序和 JSON 布局未变。

只读核对对 346 项逐一读取 B 工作树文件并计算 SHA-256：旧映射其余 345 项全部一致；`drafts.py` 只匹配批准的新身份。没有从当前工作树批量生成映射，也没有接受任何其他当前 SHA。

`b-service.py` 的 `SOURCE_PINS` 路径、`SOURCE_PINS_BYTES` 和 `SOURCE_PINS_SHA256` 三项数据已指向新映射，`SOURCE_PINS_ENTRIES` 仍为 346。反向替换这三个数据字段可逐字节还原 before 文件；其他 B 入口字节不变。

`fixed-inputs.json` 只更新其 `sourcePins.path`、`sourcePins.bytes`、`sourcePins.sha256`，以及 `bServiceEntry.bytes`、`bServiceEntry.sha256`。本地 67 个路径/字节/SHA 三元组、所引 46 项 native 基线和 346 项 B source pin 合计 459 个固定文件身份；本执行只改上述 5 个数据值和 1 条映射路径。fixture 路径、字节、SHA-256、`mtime_ns`、runtime executable、旧 accepted proof 及其他 JSON 字段均未重算。

consumer 只将 `FIXED_INPUTS_SHA256` 从 `b187d49b…0139` 改为新数据文件摘要 `7bd20304…72bc`。反向替换这一常量可逐字节还原修改前的 107162 字节 consumer；两个 current runtime 动态导入、`skillQuestions` 延迟闭包及调用点均未变化。

## 人工原因观察器更正

目标仅为 `assertOutOfScopeReported` 及其唯一调用点。函数第三步接收实际编辑清单，逐项按以下链条绑定，不再使用全文 `includes`：

1. `out_of_scope.id` 必须在实际 `edits` 中恰好出现一次；
2. 实际编辑评论中必须恰好包含一个 `风险N`，其 `para` 必须出现在同一风险块的段落引用中；
3. 同一风险块必须恰好有一条 `处理方式`，且为 `该条需人工修改（原因）`；
4. 原因必须在同一处理方式内匹配。`find 跨越域代码或超链接` 允许空白归一后的 `find 跨越超链接` 或 `域代码`；其他原因保持归一化精确匹配。

缺失、重复或歧义 id、风险块、段号引用或处理方式均失败关闭。其他风险块内出现人工修改字样不能代替目标条的对应块。

`manual-reason-observer.spec.mts` 从当前 consumer 源码中提取唯一顶层函数，先按调用目标白名单检查，再以已安装 TypeScript 转译到无 `process`、网络、文件系统能力的有限 VM 中执行；不导入 consumer，因此不会触发 `main()`。固定读取协调目录中的 `actual-final-draft.md` 与 `actual-editlist-and-result.json`，覆盖实际输入通过、三种允许语义和 12 个失败场景。该测试源码已写，但本执行者按执行令没有运行它。

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

两字符串各出现一次。对两字符串作精确反向替换并把固定输入摘要换回修改前值，可在内存中逐字节还原冻结 consumer 的 103441 字节和 `21f529a0c9e15c7b1f53347bc2885bf6c8b1273617a0963bafcc56a06de4fd5c`。

## 冻结与资格

- 协调目录中的旧映射、修改前 B 入口、修改前固定输入、修改前 consumer、原 observer 和旧运行结果均为只读 before 证据。完成后重新计算这些 before 文件身份，数值不变。
- 本轮数字链只更新令内列明的映射一行和后续五个数据值。新映射、B 入口、固定输入和 consumer 的身份见上表；每一层反向替换都只还原指定字段，其他字节不变。
- 根侧已有读数：rate-unit 5 项通过，1.719 秒，自然完成，1 个 Python 身份取得完整 OS 起止信息，运行后无残留；当前 `drafts.py` 在运行前后摘要一致。旧受影响 12 项为 8 项通过、4 项错误，错误均来自测试替身 `ExtractedTaskStore` 缺少 `index_for_task`；该缺口在 guard 前文件 `119d3cea…` 已存在，不计为本次 guard 回归。
- 根侧 observer 读数为 16 项通过，1.141 秒，自然完成，2 个 Node 身份取得完整 OS 起止信息，运行后无残留；源码和测试摘要未变。该读数对应修改前 consumer `d1146fcf…` 与已审函数，不是本轮新 consumer 的实跑。
- 原始 actual QuestionGate 已通过；旧数学比例结果仍为红。当前结果不能写成完整 T18 通过，Packaging 保持 **HOLD**。
- Concurrent B 只准备新的 12 项测试副本，没有产品修改；该副本的根侧结果仍待产生。同一合同流程的新实跑须等待当前受影响有限集转绿，不在本执行者权限内启动。
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
