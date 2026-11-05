# B 线交回：T18 辩护意见 wire 契约修复

交回时间：2026-10-29 17:54 +08:00  
状态：`ROOT_STATIC_REJECTED_FIXED_SOURCE_ONLY_NOT_RUN`  
执行者：独立 B 线 DeepSeek 执行者  
作者运行时：0

## 1. 目标与既有状态

按正式执行令 `D:\Lawbeach\lawbench-coord\B-T18-defense-wire-contract-fix-order-20261029-174803.md` 处理根层确认的五项静态契约问题。开工前核对工作树与输入快照，四个目标文件均逐字节相同：

| 文件 | 开工快照 SHA-256 |
|---|---|
| `native-defense-opinion.mts` | `11f8bdfa523eb174261019b0451d568c80cc7b08edf3693b37ec2b8c1ef490e4` |
| `wire-schema-finite.mjs` | `56ec2351f509017ac6f7ae072d9fdda98ba635291850bc01bbc45d3295b2717c` |
| `README.md` | `f20aff911bcc0693654edf908ec9b4ecc10ac31b99088096e2f4dd9ffabd5391` |
| `literalfixed-inputs.json` | `d09ae8e2d3ebf370d2736136a62739e6ab14074ee1618d16e55d506d30bdf790` |

既有产品 7 门 5 单元证据、当前私有构建的 `25b5b5…a1fdc2d` manifest、B service、26 个依赖、3 个运行时、4 个 `compilerPrivate` 行、source pins、原始 6 项输入、答案、prompts、3 个 ID、provider/model、32/48/45 分钟预算、1,200,000 ms 请求预算和主流程均未重测或改写。旧失败证据只复用为历史事实，没有当作通过证据。

## 2. 有界改动与交付身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 148746 | `8957b232935d51d5ba7592a28e2de5fba8e3997a574473433b1fbe76165bae76` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `2b1bf00623f3dac62034ca36d1e8bf4c9d69d934376618f54fb141c90ec7035c` |
| `wire-schema-finite.mjs` | 21756 | `87c5743594932355348889bf0b36259e81cdb7e43dd0ef8208e0504893075e00` |
| `README.md` | 5418 | `343ed9ed0fb1534ec8967173875ae706b83c76ef65cf1f4c3dd7910e25dd26f7` |

目标路径：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseGateRecovery-20261029-173550\`

五个源码修复点：

1. 四个 `APPROVED_RUNTIME_PINS.path` 改为与根批准清单相同的 Windows 反斜杠运行时值。`entry.path !== approved.path` 严格相等判断、四项 roles/bytes/SHA-256 和两处 file URL 编译导入均未变。
2. 被动 wire 观察器只接受根工具 `type === 'function'` 且 `tool.function.name === 'ask_user_question'` 的 OpenAI wrapper，并从嵌套 `function.parameters` 读取 schema。平铺内部形状不再被当成 wire 正例。
3. 有限脚本从同一冻结 TypeScript AST 抽取真实 `sha256Bytes` 声明，连同 limit 与 observer 注入虚拟 `.cts`/CommonJS 片段；真实依赖 SHA 进入 `actualFragments.sha256BytesDeclarationSha256`，名称进入 `executedNames`。既有 `createHash` VM context 保留。
4. `init.body` 已提供但不是字符串时返回固定 `unsupported-body/unavailable`，不从 Request 读取旧 body。只有 `init.body === undefined` 才 clone Request；原 `input`、`init`、headers、body 和 `original(input, { ...init, redirect: 'error', cache: 'no-store' })` 调用未改。
5. Request clone 改为只读 reader 逐块累计字节，超过 2 MiB 立即固定返回 `too-large-body`，通过 `void cancel().catch(...)` 后释放 clone reader；不等待 cancel，不消费或取消原 Request，也不回退到无界 `text()`。

`literalfixed-inputs.json` 本轮只改 consumer 两行：`bytes=148746` 和新 SHA-256。`b-service-defense-opinion.py` 与输入快照逐字节相同。`README.md` 只更新本令要求的状态、身份、修复边界、14 项未运行卡组、根层后续和阻碍记录。

## 3. 只读验证

- 新 consumer 文件身份为 148746 字节、SHA-256 `8957b232…bae76`；有限脚本源钉与清单 consumer 行均已同步该值。
- 只读文本比较显示 consumer 相对快照共 38 行差异，全部落在上述四个路径行、两处原逻辑行及其替代源码内；两处绝对编译导入仍为原值。
- `literalfixed-inputs.json` 相对快照只有 consumer `bytes` 和 `sha256` 两行内容变化；文件总字节数仍为 11741。
- B service 相对快照 SHA-256 完全相同；未修改产品代码、SDK、Skill、TaskState、tool schema、coercion、fake answers 或策略框架。
- 有限脚本静态计数为 14 个 `controls.push(observationControl(`；原 11 项语义保留并改用实际嵌套工具形状，新增平铺负例、三类非字符串 body 覆盖负例和超限 Request clone 控件。
- 脚本仍要求 2 MiB 上限、网络尝试计数为 0、实际函数/依赖哈希和 `ROOT_WIRE_SCHEMA_RECEIPT`；没有 Node、TypeScript/TSX、Python、AST、parser、import、check、test、build、HTTP、模型、GUI、SSH、DPAPI 或进程探测实际运行。

以上只是源码与文件身份静态核对。有限观察器 14/14、编译、ESM 511 准入、原辩护意见恢复、实际 wire schema、资源关闭和报告内容均未由 B 线验证或宣称通过。

## 4. 根层唯一后续

1. 先运行修复后的 `wire-schema-finite.mjs`，要求 14 个控件确认、网络尝试为 0、实际 observer 与 `sha256Bytes` 依赖 SHA 可追溯、无 sentinel 泄漏，并收到 `ROOT_WIRE_SCHEMA_RECEIPT`。
2. 只有有限契约通过后，才以既有方式做纯有限、ESM/511 准入和一次必要 actual defense recovery；再检查 report、人工复核、源码、OS closure 和资源收尾。
3. 没有真实 outbound wire 记录时，schema 因果保持 `unknown`，不得用期望 ARRAY 回填。

## 5. Git 与阻碍

- Git 严格只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，因此没有提交 SHA。修复轮 `git status --short --branch` 在共享 `dsh` 子模块 worktree 元数据处返回 permission denied；按令不修复权限、不拆 writer 锁、不修改 ACL、沙箱或审批。
- 修复轮有五次调用误把执行器 `shell` 参数写成 `bash`：四次在任何命令启动前以 `Bash/E_ACCESS_DENIED` 拒绝，一次被 MXC 以 MSIX 启动器不可用拒绝；实际 Bash 运行 0 次，无文件或状态变化。此前候选轮保留的 8 次 Bash 预执行拒绝另行计数。另有 1 次 PowerShell 循环管道语法错误在解析阶段失败。
- 唯一未解决项是根层运行验证，不是 B 线源码交付阻碍。作者在此停止，不联系其他聊天、不更换 API、不启动 setup/legacy 路径。

