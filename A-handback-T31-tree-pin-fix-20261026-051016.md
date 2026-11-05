# A 线交回：T31 tree pin 精确源码修正

交回时间：2026-10-26  
执行身份：独立 A 线 DeepSeek 执行者  
正式执行令：`D:\Lawbeach\lawbench-coord\T31-tree-pin-fix-order-20261026-051016.md`  
执行令 SHA-256：`8b35eb489ab72bedda151c51692d5873b77e15a6c9b8bd9908d8e679a8a5896a`

## 结论

`STATIC_TREE_PINS_CORRECTED_PREPARED_FOR_ROOT_AUDIT`

已按 root 的独立只读字节复核结果，将 `TREE_PINS` 的 18 个 `sha256` 字面值替换为规范算法的 `canonical_sha256`。18 个 id、root、selector、文件数、总字节数均未改；`build-private.mjs` 保持逐字节不变；README 已同步现有树表中的 10 个值并记录原 PowerShell 命令的单引号-backtick 成因。

本次没有执行构建、tsx、tsc、Vitest、pytest、collect、parser、self-test、prepare、serve、probe、GUI、HTTP、模型、API、网络或安装；没有生成 `private-output-*`、manifest、profile 或 launcher。Packaging 继续 HOLD。

## 结果文件

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910`

| 文件 | 行数 | 字节 | 修正前 SHA-256 | 结果 SHA-256 |
| --- | ---: | ---: | --- | --- |
| `build-config.mjs` | 311 | 19,825 | `bbb7fea1f2bffa6abfbcf85e507ca97f4a35914863d4224bed12b8e496b711de` | `d4cde00714221b47e1475faa2e3e58ce5888c8f9bdeabf2e000a4a4711751650` |
| `build-private.mjs` | 818 | 31,202 | `66f122273e5c13eb5996b147041684816a5ea2f8c05fb7af0c3935bb32dcee63` | `66f122273e5c13eb5996b147041684816a5ea2f8c05fb7af0c3935bb32dcee63` |
| `README.md` | 158 | 11,982 | `f6ce723e6cc489cb02d96f703edfd809e5275f0718d1c2d3877d80ed04559799` | `09a3288d65b415165081fa9b9c9c96d64a1c206e27dee4e17cbdc0b3200b94bd` |

`build-private.mjs` 的结果摘要与执行令规定的 byte-exact pin 以及 root before 快照均相同。

## 18 个 TREE_PINS 的修正结果

| id | 规范树 SHA-256 |
| --- | --- |
| `lawbench-agent-source` | `a0c25295daed8ca444c989d24d51d6a5ed6196703d3a3b6f3a68d22313a8b745` |
| `lawbench-credentials-source` | `c4ca46f1ce6647c56c10f083332cfdd938907eaf22255e4673256637c07d095f` |
| `lawbench-host-source` | `c123ccce803c62278b3a7e99e8cbe3292b0c095b2d12b3d23b6a5c9cf042b044` |
| `lawbench-session-store-source` | `51da6a3cd97a14233db41e52c1b00210d48eb4f63e626aa590200e629f8ee74e` |
| `lawbench-shared-source` | `0f7805f79e4d93d8bb7730ed652053bd3723cca8703f172ca358f6db8dba3b77` |
| `lawbench-ui-source` | `59af2e62c9f661d2f8df127e3b0708499f6223874f9e8f5f1f7a85b09647027c` |
| `embedded-contract-schemas` | `e61a6c8286fbd64659814c956c21f34817d1a5bbc51c7440cafd16890d4ad435` |
| `ui-conversation-source` | `2b8f89ea9192247df1dc6e7361f2ef1c463df947982478932165b307472eb567` |
| `session-controller-source` | `c205f0947f4381c2b228fe6e10e1b70db1b1ccaa81e67abfa08af08c525a84bf` |
| `typert-generator-runtime` | `3dfc33eea95b5edcccfcbe6c6f6255abdaeb046226f89563f65e702992d295b8` |
| `tsdown-installed-package` | `a9c4d06e0869eb22c8eb0c3be1315227d6525dd1d30da7c43e830a2ef6c66870` |
| `tsx-installed-package` | `52ecedb35b24ab7768b8b4e0c051c090e85a8d1f70b15eca02be497d5bdffb9b` |
| `esbuild-installed-package` | `3a91c31246e1cd399db3ac0ef60627b758f6973457dc923908001cc326a41161` |
| `esbuild-win32-x64` | `a0963ef3a8b22a3cd9273bea498e29a9ef4881f2a4dc80e4fda5c15ab52ca045` |
| `lightningcss-installed-package` | `0f26ab338f0cc2d22d04b1995eb5922beea43b045259a01b086ed210f6943850` |
| `lightningcss-win32-x64` | `4c2a040d50a5206802f7cacb0b23839642c221728a2fa1b80432291472710d8c` |
| `rolldown-installed-package` | `7f7621e5577a9df636bed3e1d07018d32bf509444838a97ae43c29efd441ca3f` |
| `rolldown-win32-x64` | `b8dfc6550ee47d94278114b42811f062719c93d9dc44e593ba96d6d016a578df` |

`build-config.mjs` 中原有的 `FILE_PINS`、`REFERENCE_PINS`、Node pin、输出策略和输出清单均未改动。固定输入仍是字面 pin，不在构建时放宽或动态接受实际哈希。

## README 修正

- 更新现有树表中的 10 个规范树 SHA-256。
- 其余 8 个工具链树 pin 原本不在 README 表中，已仅在 `build-config.mjs` 的 `TREE_PINS` 中更新。
- 增加 root 复核成因说明：旧 PowerShell 单引号格式字符串保留了字面 backtick 加 `t`，没有生成实际 TAB；文件清单、文件数和字节数均与原证据一致。

## 复用证据与只读核对

- root 独立证据：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-tree-pin-mismatch.json`，SHA-256 `fb35110257022d1a7a5700cc42261a2387f650fa832ea0dbaa8b937ec2555722`。
- 修正前快照目录：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-tree-pin-fix-20261026-051016`。
- 未重新计算源码树或重跑旧研究；只将当前静态配置与 root 的 18 行独立证据逐项比对。
- 只读一致性检查结果：`tree_pins=18; ids/files/bytes/canonical_sha256 match root independent evidence`。
- 与 before 快照做只读文本差异：配置只出现 18 个 `sha256` 值行替换；README 为 10 行值替换、1 行说明和 1 个必要空行。
- 目标目录仍有且仅有 `build-config.mjs`、`build-private.mjs`、`README.md` 三个普通文件，无子目录、无 reparse point、无构建输出。
- A HEAD 仍为 `a23271abee333a9a256fd46a3141da16975c2380`。限制到本证据目录的只读 Git 状态仍为未跟踪目录；既有 dirty 未清理、未暂存、未提交。
- 未改写旧正式交回件，未修改 root evidence、产品源码、配置、契约、lib、依赖、运行目录或凭据。

## 阻碍与执行偏差

- 全量 `git status` 在 `dsh` 子模块的 worktree gitdir 处遇到 `Permission denied`；改用 `--ignore-submodules=all` 做只读状态核对，没有改权限、审批、ACL、沙箱或锁。
- root before 快照中的 `runner.stdout.txt`、`runner.stderr.txt` 正被另一进程占用，无法由本会话读取哈希；所需的三个 artifact 快照均已成功读取并与当前 before hash 核对，没有终止或改动占用进程。
- 一次只读文件摘要命令误填了错误的绝对 PowerShell 路径，只产生 PowerShell parser error；一次续查 one-liner 也因管道语法产生 parser error。两次均未写文件、未启动 setup/legacy、未修改环境；之后所有执行均使用执行令指定的绝对 `pwsh.exe` 和 `login=false`。
- 当前 PID 仅为本执行者，没有将其声明为第二 writer，也没有拆 writer 锁。

## 仍未完成与限制

- 本交回只是静态 tree pin 修正，不是 build PASS、native runtime PASS、GUI PASS、model PASS 或 T31 PASS。
- 私有构建脚本尚未执行；实际源树 pin 核对、产物生成、manifest、profile 投递、原生模块加载和 GUI 行为仍需 root 独立审计并另行授权。
- 既有源码测试及真实 NativeR/Host/CoreClient TCP 切片证据继续按 root 原结论沿用，本次未重跑，也不扩大其证明范围。
- Packaging 仍为 HOLD。

到此停止，等待 root 独立审计。
