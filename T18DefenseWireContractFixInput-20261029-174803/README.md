# T18 辩护意见门恢复：源码交付

状态：`AUTHORED_NOT_RUN`。B 线本轮只做源码交付；作者运行时为 0，没有启动 Node、TypeScript/TSX、Python、HTTP、模型、GUI、测试、构建或语言解析器。

## 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 147775 | `11f8bdfa523eb174261019b0451d568c80cc7b08edf3693b37ec2b8c1ef490e4` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `d09ae8e2d3ebf370d2736136a62739e6ab14074ee1618d16e55d506d30bdf790` |
| `wire-schema-finite.mjs` | 18998 | `56ec2351f509017ac6f7ae072d9fdda98ba635291850bc01bbc45d3295b2717c` |

`b-service-defense-opinion.py` 与基线快照逐字节相同。主消费者从基线的 140855 字节改为 147775 字节，增量只包括根批准的编译运行时 pin、两处绝对编译导入，以及出站 `ask_user_question` 公共 schema 的被动观测。

## 固定边界

- 四项编译运行时 pin 来自 `root-approved-runtime-four.json`；agent、host、package、manifest 的路径、字节数和 SHA-256 已逐项现场核对。
- `literalfixed-inputs.json` 只改四个 `compilerPrivate` 行、自身 consumer 行和服务路径行；26 个依赖、3 个运行时、六项公开基线输入、三问契约和其余清单内容未改。
- 两个绝对编译导入只指向根批准的 `DefenseQuestionPrivateBuild-20261029-172922`。
- 原 fetch allowlist、原请求参数、redirect/cache、超时、取消、drain、恢复和所有交付断言未改。
- 被动观测只检查模型 POST 的外发 JSON：优先读取字符串 `init.body`，否则读取现有 `Request` 的 clone；不消费原请求。固定最多处理 2 MiB，只记录固定枚举、工具定义数、schema 类型、required 标记和参数 schema SHA-256。
- 原始 messages、提示、工具参数、完整 schema、响应、headers、凭据和请求体不写入报告，也不建立旁路文件。

## 有限观察器

`wire-schema-finite.mjs` 使用冻结的 TypeScript AST/transpile/VM 方式，只抽取并执行真实源码中的 `ASK_SCHEMA_BODY_LIMIT_BYTES` 和 `observeAskUserQuestionWireSchema`。它不导入消费者、Agent、Session、provider、服务或模型。

共设计 11 个受控控件，覆盖结构化 ARRAY、故意 STRING 不自动纠正、missing/ambiguous 工具、invalid JSON、unsupported/too-large body、invalid tools/parameters、Request clone 前后字节一致、clone 异常固定枚举，以及 sentinel 不进入结果。该脚本由 B 线编写但尚未运行；11/11 只是待运行卡组，不是测试结论。

## 旧运行证据

原始失败证据保留在 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseOpinionNative-20261029-155352\run-uFp2dy\`，未覆盖或重用为本次通过证据。该次状态为 `FAILED`，32 次模型 POST 且 32 次 HTTP 200，任务已结算；资源清理各项为真。按根提供的既有事实，模型经 30 次提问错误、0 个回答后保存一份未确认草稿并在预算处停止。

## 根层后续

1. 先运行 `wire-schema-finite.mjs`，要求 11 个控件确认、网络尝试为 0，并检查实际函数 SHA、sentinel 和 stdin 回执 `ROOT_WIRE_SCHEMA_RECEIPT`。
2. 有限观察器通过后，根层再用既有 DPAPI 匿名 stdin 启动 `native-defense-opinion.mts`，只执行一次原辩护意见场景。
3. 根层检查新 `report.json` 中 `modelPosts.observations[].askSchema`、完整人工复核、源码、OS 进程、资源和收尾证据。没有实际 wire 记录时，schema 因果保持 `unknown`，不得用期望值补齐。

## 阻碍记录

- 默认 `git status` 在受限 `dsh` 子模块返回 permission denied；使用忽略子模块的只读状态成功核对。没有修改 git、ACL、锁、沙箱或审批，也没有 add/commit/rebase/reset/clean/checkout/push。
- B 线作者在本轮有八次只读命令误把执行器 `shell` 参数写成 `bash`。运行器均在命令启动前拒绝；没有执行 Bash，也没有文件或状态变化。所有成功的读取、哈希与差异检查均使用指定的原生 PowerShell、`login=false`。
- 因执行令禁止 B 线运行代码，本目录不能宣称编译通过、11 个观察器控件通过或原辩护意见运行通过；这些均留给根层执行。
