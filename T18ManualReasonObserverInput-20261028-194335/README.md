# T18 QuestionGate 合同审查工作流输入

状态：`AUTHORED_NOT_RUN`。本目录只准备一次独立工作流所需的 consumer、有限 B 入口、固定输入和说明。本执行者没有运行 Node、Python、TypeScript 解析器、测试、编译器、HTTP、模型、GUI 或安装包流程；本目录不是完整 T18、业务质量或发布验收。

## 当前身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 103451 | `782d9d55cccbdecc8ccf754dfb9d9ec49ae9c4bddf9b4683f5311b3915e210ed` |
| `b-service.py` | 30607 | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `fixed-inputs.json` | 17162 | `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139` |

`fixed-inputs.json` 的四条 `accepted-private-runtime` 已从当前新编译输出取字面 pin：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| `current-compiled-agent` | 549374 | `af533872ed30e41aeb2de823d24261a588f4b72c96f753ab05ead01def67c6e6` |
| `current-compiled-host` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `current-compiled-package-metadata` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `current-compiled-manifest` | 58199 | `af0d8cc2adae28bdae370d140044403ad9060a54b4a2a80c252991be42d88e88` |

`bServiceEntry.path` 指向本目录的 `b-service.py`，字节和 SHA-256 未变。消费者内的 `FIXED_INPUTS_SHA256` 已改为本目录 `fixed-inputs.json` 的实际数据摘要 `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139`。

## 延迟能力接线

与冻结 consumer `005889a8…` 相比，`native-contract-workflow.mts` 只有四个预期变化：

1. 在 `lawbenchCore` 手动能力对象中加入 `skillQuestions: (skillName: string) => remote.skillQuestions(skillName)`。
2. 第 1030 行的 `ExtAgentModule` 动态导入改为直接加载本目录 current runtime 的 `agent.js`。
3. 第 1031 行的 `ExtHostModule` 动态导入改为直接加载同一 runtime 的 `host.js`。
4. 更新上述固定输入摘要。

新增能力项是箭头闭包，不在对象构造时调用 `remote`。只读核对当前 Agent 源码与编译产物确认：`apply()` 构造 `LegalAgent` 时只保存 `skillQuestions` 回调；回调到 `preStep()` 的 `requiredQuestionIds()` 才执行；consumer 在 `applyLegalAgent()` 与 `AgentLoop` 设置之后才声明 `remote`，并在 `setupProduction()` 返回后继续案件工作流。因此该闭包按当前 ESM 词法顺序是延迟求值。两个动态导入现在分别精确指向：

- `file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/agent.js`
- `file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/host.js`

两字符串各出现一次。对两字符串作精确反向替换并把固定输入摘要换回修改前值，可在内存中逐字节还原冻结 consumer 的 103441 字节和 `21f529a0c9e15c7b1f53347bc2885bf6c8b1273617a0963bafcc56a06de4fd5c`。

## 冻结与资格

- 执行令列出的冻结 consumer `005889a8…`、B 入口 `4fef1d52…` 和旧 manifest `63f2da57…` 均只读复用；协调目录中的 before 原件在完成后重新核对，哈希未变。
- `fixed-inputs.json` 相对协调目录 before 只有 5 条既有源码 pin 的字节/SHA 更新，共 10 对行差异；fixture 路径、字节、SHA-256、`mtime_ns`、46 项 native 基线、346 项 B source pin 的条目数、source-resource pin、runtime executable、accepted old evidence 与 JSON 布局均未重算或改写。更新值逐项匹配 root 提供的 `approved-five-source-literal-pins.json` 和当前文件实际身份。
- 新编译资格来自 root 的 `root-qualified-static25-build.json`：25 个精确输出、自然构建退出码 0、5 个完整 OS 身份与 1 个部分 OS 身份；Node 子进程 26660 观察到 exe/gone 但未取得 birth。未声称六进程完整 OS 证明，也未重跑编译。
- Skill 正文、task notes、judging notes、源码、旧 consumer、旧 B 入口、旧 manifest、旧运行证据、SDK 和 legacy 树均保持冻结。本目录未导入任务说明或判分要点，未提供预期答案或伪造模型/工具结果。

## root 顺序更正

先前说明把“只允许两处 consumer 改动”解释成继续导入旧 T31 编译包，因而把动态导入与已批准的 current runtime pin 判为不可同时满足。root 现已明确更正：两个动态导入也必须更新，并额外批准 `fixed-inputs.json` 中 5 条已经审过的源码字面 pin。上述修正均已按精确路径完成，不再存在旧说明所述的 import 阻塞。

本轮只做源码和固定输入的字面修正与只读机械核对。没有运行 Node、Python、TypeScript 解析器、动态导入、测试、编译器、HTTP、模型、GPU、GUI 或安装包流程，因此不能把输入一致性表述为实际工作流通过；合同问题实际先后、模型草稿/编辑清单、redline/OOXML、源材料保持、JSONL 重开、清理和 watchdog 仍有待 root 在授权环境实跑验证。

## 未运行

仅保留以下命令轮廓供 root 裁定阻塞后执行；本执行者未运行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts' --credential-stdin
```

凭据只由 root 现有驱动解密后经匿名 stdin 输入，不进入本目录、参数、环境变量或报告。合同问题的实际先后、模型草稿/编辑清单、redline/OOXML、源材料保持、JSONL 重开、清理和 watchdog 仍需 root 在授权环境实跑；先前 `20 vs 2` 与阅读质量未解决事项不受本轮影响。Gate 1、完整 T18 与项目未完成，Packaging 保持 **HOLD**。
