# B 线交回：T18 辩护意见门恢复

交回时间：2026-10-29  
状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`  
执行者：独立 B 线 DeepSeek 执行者  
作者运行时：0

## 1. 目标与出处

按正式执行令 `B-T18-defense-gate-recovery-order-20261029-173550.md` 完成有界恢复源码。复用旧运行材料，没有重跑开工、安装、调研、全量测试、HTTP、模型或任何原工作流。

新目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseGateRecovery-20261029-173550\`

证据说明：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseGateRecovery-20261029-173550\README.md`

旧失败证据仅作历史参考：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseOpinionNative-20261029-155352\run-uFp2dy\`

旧报告状态为 `FAILED`；32 次模型 POST、32 次 HTTP 200，任务已结算，资源清理各项为真。执行令记载的 150.125 秒、30 次提问错误、0 个回答、一份未确认草稿和预算停止均未改写为通过结论。

## 2. 改动清单与交付身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 147775 | `11f8bdfa523eb174261019b0451d568c80cc7b08edf3693b37ec2b8c1ef490e4` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `d09ae8e2d3ebf370d2736136a62739e6ab14074ee1618d16e55d506d30bdf790` |
| `wire-schema-finite.mjs` | 18998 | `56ec2351f509017ac6f7ae072d9fdda98ba635291850bc01bbc45d3295b2717c` |

主消费者相较基线新增 6920 字节，只包含：

- 四项根批准编译运行时的 path/bytes/SHA-256 字面 pin。
- 两个绝对编译 `agent.js` / `host.js` 导入。
- 一个被动 `observeAskUserQuestionWireSchema` 异步助手、一个可选安全元数据字段、一处仅对 `isModel` 的调用。
- 对应固定输入清单的四项编译 pin 更新，以及 consumer/bService 两条自身路径和 consumer 自身 bytes/SHA 回填。

服务脚本与基线逐字节相同。26 个依赖、3 个运行时、公开基线输入、三问契约、原 Skill、旧测试、产品代码和私有输出未改。

Git 严格只读。本交回没有 commit SHA；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 3. 验证结果

本阶段只做原生 PowerShell 只读核对：

- 根批准四项编译运行时均存在，bytes 与 SHA-256 全匹配。
- 新 consumer 的 bytes/SHA 与 `literalfixed-inputs.json` 完全一致。
- b-service 的 53717 字节与 SHA-256 同基线完全一致。
- 清单计数为 dependencies=26、compilerPrivate=4、runtimeExecutables=3、materials=2。
- 源码静态计数为 passive helper=1、`isModel` 条件调用=1、原 `original(input, {...init, redirect:'error', cache:'no-store'})` 调用=1、根批准绝对编译导入=2、运行时 pin 行=4。
- 基线到新源码的只读 diff 为 198 行增、2 行改，范围只落在上述批准改动。

`wire-schema-finite.mjs` 已编写 11 个受控控件，但作者运行时为 0，不能写成“测试通过”。其设计覆盖 ARRAY/STRING schema、missing/ambiguous、invalid JSON、unsupported/too-large body、invalid tools/parameters、Request clone 字节保持、异常固定枚举与 sentinel 不落结果。

## 4. 被保持的护栏

- 32 次模型调用、48 次工具调用、45 分钟任务预算、1,200,000 ms 请求/流空闲超时和 86,400,000 ms 技术看门狗未变。
- 三个辩护问题 ID、来源标记 `[false,true,false]`、真实回调一次、L1、原件引用和人工真值边界未变。
- 原 task-end guard 未削弱；旧失败原因是 blocked，不是泄漏。
- 原网络 allowlist、原 fetch arguments/init/body/headers、redirect、cache、timeout、cancellation、drain 和恢复路径未变。
- 观测失败只转成固定枚举，不转成错误正文；不解析模型问题字符串，不自动回答，也不据观测元数据改变执行或断言。

## 5. 根层唯一后续

1. 先运行 `wire-schema-finite.mjs`；通过条件为 11 个控件确认、网络尝试 0、实际函数 SHA 可追溯、无 sentinel 泄漏，并收到 `ROOT_WIRE_SCHEMA_RECEIPT`。
2. 通过后，用既有 DPAPI 匿名 stdin 方式只运行一次新 `native-defense-opinion.mts` 原辩护意见场景。
3. 检查完整 `report.json`、`modelPosts.observations[].askSchema`、人工复核、源码、OS 进程身份、资源关闭与正式收尾证据。

如果没有实际 outbound wire 证据，`askSchema` 原因保持 `unknown`，不得用期望 ARRAY 补齐。有限观察器本身不证明服务端或模型因果。

## 6. 阻碍与遗留

- 默认 `git status` 在受限 `dsh` 子模块返回 permission denied；忽略子模块的只读状态成功，分支显示 `line-B`、ahead 141、behind 1。B 线开工前快照 `B-tracked-dirty.json` 有 42 行，所有 dirty 均保留。
- 本作者有八次只读命令误把工具 `shell` 参数写成 `bash`；运行器均在启动前拒绝，没有 Bash 执行、文件变化或状态变化。之后成功执行的读取、哈希和 diff 均使用指定原生 `pwsh.exe`、`login=false`。
- 尚未验证：新源码编译、11 个有限控件、真实 wire schema、原辩护意见完整运行、草稿人工质量与 T18 全文验收。作者在此停止。
