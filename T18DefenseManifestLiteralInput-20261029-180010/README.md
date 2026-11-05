# T18 辩护意见门恢复：源码交付

状态：`ROOT_STATIC_REJECTED_FIXED_SOURCE_ONLY_NOT_RUN`。B 线本轮只修复根层静态驳回点并做只读源码核对；作者运行时为 0，没有启动 Node、TypeScript/TSX、Python、HTTP、模型、GUI、测试、构建或语言解析器。有限观察器和原辩护意见场景均未运行，不能据本文件宣称代码或门禁通过。

## 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 148746 | `8957b232935d51d5ba7592a28e2de5fba8e3997a574473433b1fbe76165bae76` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `2b1bf00623f3dac62034ca36d1e8bf4c9d69d934376618f54fb141c90ec7035c` |
| `wire-schema-finite.mjs` | 21756 | `87c5743594932355348889bf0b36259e81cdb7e43dd0ef8208e0504893075e00` |

`b-service-defense-opinion.py` 与基线快照逐字节相同。主消费者从基线的 140855 字节改为 148746 字节；相对上一轮 147775 字节候选的增量只包括本令指定的五处修复。两处绝对编译导入保持原样。

## 固定边界

- 四项编译运行时 pin 来自 `root-approved-runtime-four.json`；路径已改为与合法 Windows 清单行完全相同的反斜杠字面量，字节数和 SHA-256 未改，既有严格字符串相等校验未放松。
- 本轮 `literalfixed-inputs.json` 只改 consumer 一行的 bytes 与 SHA-256；上一轮候选中的四个 `compilerPrivate` 行、自身 consumer 路径和服务路径保持原样，26 个依赖、3 个运行时、六项公开基线输入、三问契约和其余清单内容未改。
- 两个绝对编译导入只指向根批准的 `DefenseQuestionPrivateBuild-20261029-172922`。
- 原 fetch allowlist、原请求参数、redirect/cache、超时、取消、drain、恢复和所有交付断言未改。
- 被动观测只检查模型 POST 的外发 JSON。实际 OpenAI wire 必须是 `{type:'function',function:{name,parameters}}`；平铺内部形状只作为负向反例，不再充当正例。
- 字符串 `init.body` 仍直接读取；任何其他已提供的非字符串 body（包括 `URLSearchParams`、`Uint8Array`、`null`）固定返回 `unsupported-body`，不回读会被 fetch 覆盖的旧 Request body。仅当 `init.body === undefined` 时才 clone Request。
- Request clone 通过只读 reader 按字节累计，达到 2 MiB 上限即停止并异步触发 clone reader 的 cancel；不等待 cancel，不消费也不取消原请求。只记录固定枚举、工具定义数、schema 类型、required 标记和参数 schema SHA-256。
- 原始 messages、提示、工具参数、完整 schema、响应、headers、凭据和请求体不写入报告，也不建立旁路文件。

## 有限观察器

`wire-schema-finite.mjs` 使用冻结的 TypeScript AST/transpile/VM 方式，只抽取并执行真实源码中的 `ASK_SCHEMA_BODY_LIMIT_BYTES`、`sha256Bytes` 和 `observeAskUserQuestionWireSchema`。`sha256Bytes` 的真实声明同时计入片段、依赖哈希与 `executedNames`；观察器继续使用既有的 `createHash` VM context，不另造哈希实现。脚本不导入消费者、Agent、Session、provider、服务或模型。

共设计 14 个受控控件。原有 11 项语义保留并改用实际嵌套 OpenAI 工具夹具；新增平铺形状负例、Request 加三类非字符串 body 覆盖负例、超限 Request clone 有界读取并验证原 body 不变。该脚本由 B 线修复但尚未运行；14 项只是待运行卡组，不是测试结论。

## 旧运行证据

原始失败证据保留在 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseOpinionNative-20261029-155352\run-uFp2dy\`，未覆盖或重用为本次通过证据。该次状态为 `FAILED`，32 次模型 POST 且 32 次 HTTP 200，任务已结算；资源清理各项为真。按根提供的既有事实，模型经 30 次提问错误、0 个回答后保存一份未确认草稿并在预算处停止。

## 根层后续

1. 先运行 `wire-schema-finite.mjs`，要求 14 个控件确认、网络尝试为 0，并检查实际函数与 `sha256Bytes` 依赖 SHA、sentinel 和 stdin 回执 `ROOT_WIRE_SCHEMA_RECEIPT`。
2. 有限观察器通过后，根层再用既有 DPAPI 匿名 stdin 启动 `native-defense-opinion.mts`，只执行一次原辩护意见场景。
3. 根层检查新 `report.json` 中 `modelPosts.observations[].askSchema`、完整人工复核、源码、OS 进程、资源和收尾证据。没有实际 wire 记录时，schema 因果保持 `unknown`，不得用期望值补齐。

## 阻碍记录

- 修复轮只读 `git status` 在共享 `dsh` 子模块的 worktree 元数据处返回 permission denied。没有修改 git、ACL、锁、沙箱或审批，也没有 add/commit/rebase/reset/clean/checkout/push。
- 修复轮有五次调用误把执行器 `shell` 参数写成 `bash`：四次在任何命令启动前以 `Bash/E_ACCESS_DENIED` 拒绝，一次被 MXC 以 MSIX 启动器不可用拒绝；实际 Bash 运行 0 次，无文件或状态变化。另有一次 PowerShell 循环管道语法错误在解析阶段失败。所有成功读取、哈希与差异检查均使用指定原生 PowerShell、`login=false`。
- 因执行令禁止 B 线运行代码，本目录不能宣称编译通过、14 个观察器控件通过或原辩护意见运行通过；这些均留给根层执行。
