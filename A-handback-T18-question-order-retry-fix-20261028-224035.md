# A 线交回：T18 问答题顺序“拒绝后重试”修正

状态：**AUTHORED_NOT_RUN**。

本件只交回 evidence 观察器的有界修正和窄测试，不是测试通过、完整 T18 通过或业务验收。没有运行 Node、Python、解析器 AST 执行、测试/自测/import、构建/prepare、HTTP、模型、GPU、GUI、SSH、凭据或产品。

## 改动

只改以下三个源码/证据文件，另新增一份 evidence 说明：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-order-observer.spec.mts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\问题顺序观察器-重试修正-20261028-224035.md`
- 本交回件

观察器现在唯一选择非错误 `ask_user_question` 回调；只有更早、严格早于所选成功 ask/结果、`isError=true` 且文本精确等于既有必问门拒绝文本的 ask 可被排除。未知/迟到错误、未匹配回调、畸形/缺失/重复/外来结果、两个成功 ask、全部错误且无真实回答均失败关闭。

回答 ID、定制内容、三角色覆盖、草稿路径/版本、首个成功保存调用的先后校验保持原强度。`case_save_draft` 的原有已知拒绝兼容逻辑仅复用同一字面量，没有新增语法、NLP、框架、白名单句变体或存储。

## 字节反演

| 文件 | 旧字节/SHA-256 | 新字节/SHA-256 |
|---|---|---|
| consumer | 117061 / `207cd958ef0d4040396455d80ca6db377a58517177aea4fdae32b4e3bf02ab45` | 117691 / `fc41f56622135d0a34ba1b8777c23ed84072451fbe1952076b883ccafbf70f46` |
| spec | 11140 / `1a7830de70c5c8bef763ef9ea4ce8a8d4afd8ed3ca74960b5783470e11eb8e9a` | 15511 / `830af8c618b5da7632135c475d16d4cdc57fcb17ed18bf0a20c6a589759de885` |

consumer 反演已在内存中完成：只把当前观察器函数段替换回输入函数段后，整文件精确恢复为 117061 字节与 SHA `207cd958…ab45`。因此观察器外的 consumer 字节全部保持。

测试在真实 70 行与普通正例两个 `deepStrictEqual` 前用 `JSON.parse(JSON.stringify(...))` 将 VM 返回的普通六字段记录转入宿主 realm；期望锚点值未变。真实 59 行正例直接读取协调输入包并由字节数、SHA、行数、唯一成功 ask 和六字段锚点固定。

聚焦测试合计 21 项：3 个正锚点；原 16 个负控例原块保留；新增“未知错误 ask 后接有效 ask”和“两个成功 ask”两个负例。没有断言删除或原型盲改。

## 真实资源锚点

输入资源：

`D:\Lawbeach\lawbench-coord\T18QuestionOrderRetryInput-20261028-224035\actual-retry59-native-events.jsonl`

232044 字节，SHA-256：

`aa45f25b674dc8e3f58140784b98a97cfab38a96eaa8e330a5c0077ffa4e6056`

| 事件 | callId | call seq | result seq |
|---|---|---:|---:|
| 已知必问门拒绝，排除 | `chatcmpl-tool-a2c9522e1809c7d8` | 31 | 32 |
| 唯一成功回答，采用 | `chatcmpl-tool-bb6256f1f4c26d8a` | 36 | 37 |
| 首个成功草稿 | `chatcmpl-tool-85c92449d7212dd3` | 41 | 42 |

测试只从真实成功回调派生 `QuestionRecord` 的三 ID/custom 内容，不伪造 callback、history 或 model 结果。

## 冻结与写入面

以下文件与输入副本逐字节相等：`manual-reason-observer.spec.mts`（14571，`25adcb…d48239`）、`b-service.py`（30634，`ac7ccb…649ab84`）、`fixed-inputs.json`（17197，`bd26b5…d253e`）、`reviewed-b-source-pins-named.json`（53548，`ccb030…c3b5b`）。

旧交付说明保持 8321 字节、SHA `22ade64f1baab081cad4869f60d85122276575d78232c7ac3c91b7f9ca63d9a1`。旧 38 项规格未改未跑；README 未改。产品、manifest、B 源、编译输出、callback/prompt/answers、预算、Native、redline/OOXML、JSONL、finally 均未改。

写入只经 `apply_patch`，仅上述三个 evidence 文件和本交回件；没有 shell 写文件。

## 命令与非零

共执行 30 次 `exec_command`：27 次退出 0，3 次退出 1。

- 1：完整读取正式执行令；0。
- 2–6：只读清点输入、evidence 和源码；其中 `git status --short` 因受保护子模块 `dsh` 目录权限退出 1，其余 0。
- 7–11：读取旧源码/测试、根失败、真实 59 行探针和 dirty 快照；0。
- 12–17：观察器定位、current 输入/pin、真实 ask/result/draft 锚点提取；0。
- 18–21：旧 70 行资源、旧交付说明、输入包身份和新文档不存在检查；0。
- 22–24：consumer 函数文本、反演与测试标记静态检查；0。
- 25–26：两份 `git diff --no-index`；均因预期差异退出 1。
- 27–30：冻结哈希/逐字节相等、标记计数和最终静态审计；0。第 30 次在交付文档存在后执行。

另有 1 次 `multi_tool` 参数构造因重复 `sandbox_permissions` 被运行器拒绝，未启动 shell、未读写文件。

程序性偏离：第 13–15、18–29 次共 15 次命令使用短名 `pwsh.exe`；全部为 `login=false` PowerShell，未用 bash/cmd。第 30 次使用显式绝对原生 PowerShell 路径。首次 Git 状态检查遇子模块目录权限拒绝，按令未修锁、ACL、审批或沙箱。

Git 严格只读，仅 `status` 与 `diff --no-index`；没有 add/commit/rebase/stash/reset/clean/checkout/push，故没有提交 SHA。

## 后续

root 先审计完整当前测试，再运行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-order-observer.spec.mts'
```

聚焦绿后做 ESM/459 与全量反向核对；全绿后才按同一合同发起一次真实 originals 流程完成 DOCX+JSONL。不得重开准备/安装/调研/全量测试。

Gate 1、完整 T18、业务质量和项目交付未完成；Packaging 保持 **HOLD**。
