# A 线 T18 通用文书先问后读私有配置交回

状态：`SOURCE_ONLY_CONFIG_READY_FOR_ROOT_REVIEW`。本交回只提供一份数据配置，不是 T18 PASS，也不是私有构建或业务验收结果。

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 在令定新目录交付冻结 builder、数据配置和短 README；配置只改证据根与 Agent 树的两个 pin 值。 |
| 目标是什么 | 为根执行器复核后的一次全新私有 25-output 开发编译准备当前 Agent 源码配置。 |
| 在等什么 | 等根执行器完成全配置逆变换和边界审查。收到复核通过信号后，再由新令执行一次私有构建。 |
| 卡在哪 | A 线没有交付卡点。既有 dirty 保持原样，未做任何 Git 写入。 |

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-general-read-private-config-20261030-164557.md`
- 交付目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557`
- 批准输入：`D:\Lawbeach\lawbench-coord\T18GeneralReadPrivateInput-20261030-164557\approved-inputs.json`
- 旧配置数据：`D:\Lawbeach\lawbench-coord\T18GeneralReadPrivateInput-20261030-164557\old-config-data.json`
- Agent 新树行：`D:\Lawbeach\lawbench-coord\T18GeneralReadPrivateInput-20261030-164557\new-agent-tree-rows.json`

交付三件：

| 文件 | bytes | SHA-256 |
| --- | --- | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20472 | `826fc02a7caaff9fde9183cc414294467c1817df9b3be768fd38d4dd2ef07e1e` |
| `README.md` | 3477 | `43210c3d87a6b23e72b52b193ff0ed032da16add3af84b2858a28160838b56f2` |

冻结 builder 从 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupPrivateBuild-20261030-141828\build-private.mjs` 逐字节复制，交付后复算仍为 32121 bytes / `347ae081…`，与源完全一致。

旧配置（冻结的 T34 配置）为 20471 bytes，SHA-256 `da99b9c851ece3bf18a45891a588eff4b24a4ac847c89ffb5f9bb60cdf71e266`。新配置只改以下三处数据：

| 字段 | 旧值 | 新值 |
| --- | --- | --- |
| `EVIDENCE_ROOT` | `…\evidence\T34\SettingsStartupPrivateBuild-20261030-141828` | `…\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557` |
| `lawbench-agent-source.bytes` | 80724 | 80781 |
| `lawbench-agent-source.sha256` | `f104a046c7cc80cbd71e9d7ad8a918322958fcd61be0caa056b9200f288bf0d1` | `abc7e8570e1d3b8a1e1a0041bd41ac9c82414181bf8fdd37df7b40748fdd810b` |

`lawbench-agent-source.files` 保持 4。逐行 diff 对比冻结 T34 配置确认只有这 3 行数据变化。

其余 17 棵树、39 个文件 pin、14 个引用 pin、25 个输出定义、53 个总 pin、metadata、schema hash、模型参数、TSX loader 和 legacy 18-tree 结构均未改。配置内结构复点为：TREE_PINS 18 条、FILE_PINS 39 条、REFERENCE_PINS 14 条、INTENDED_OUTPUTS 25 条。

## 现状核对（只读现算）

用 builder 同款 canonical 树摘要算法（`path\tbytes\tfile-sha256` 按 LF 拼接、相对路径按字节序排列）现算全部 18 棵树：

- `lawbench-agent-source`：4 files / 80781 bytes / `abc7e8570e1d3b8a1e1a0041bd41ac9c82414181bf8fdd37df7b40748fdd810b`，与新 pin 一致。
- 其余 17 棵树全部逐字节一致：credentials `c4ca46f1…`、host `3dbe7d09…`、session-store `51da6a3c…`、shared `a4182a25…`、ui `57c09650…`、contracts `a0da8077…`、ui-conversation `0b4843e9…`、session-controller `52771d97…`、typert `3dfc33ee…`、tsdown `a9c4d06e…`、tsx `52ecedb3…`、esbuild `3a91c312…`、esbuild-win32 `a0963ef3…`、lightningcss `0f26ab33…`、lightningcss-win32 `4c2a040d…`、rolldown `7f7621e5…`、rolldown-win32 `b8dfc655…`。
- 39 个文件 pin、14 个引用 pin 现算 SHA-256 与批准输入全部一致，差异 0。

Agent 树相对旧树只有 `index.ts` 变化，已用两份快照核对：

- 旧 `index.ts`：50901 bytes / `e78789e20dc9e015664d41cebc1b55097c6a70ba6e85ce221006d5d06a23bbec`（快照 `D:\Lawbeach\lawbench-coord\T18GeneralReadOrderFixInput-20261030-163841\0-index.ts`）。
- 新 `index.ts`：50958 bytes / `f2f8444f9cc4f83a98153f40dc81fb32dcf5e0c21c846101c60433c274896ead`。
- 差异为 3 行：提示语由「诉讼文书起草必须…」改为「文书起草必须…」，条件由 `skill === LITIGATION_DOCS_SKILL` 扩为 `skill === LITIGATION_DOCS_SKILL || skill === GENERAL_DRAFTING_SKILL`，注释同步改为「诉讼文书与通用文书先问后读」。
- 其余 3 个文件逐字节未变：`README.md` 66 / `18dad2a9…`、`repetition.ts` 7466 / `e21e2cb7…`、`task-state.ts` 22291 / `82121824…`。

其他现状：A 线 HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`，与配置 `EXPECTED_A_HEAD` 一致；`E:\node\node.exe` 存在且字节数 93580104，与 `NODE_PIN` 一致；当前 `host/index.ts` 为 63665 bytes / `cb3679ae85ea6b4f56406b5cbb1e01c1fe0e4739bb22d0ccf05cd4c7ac8fbf83`，本次未改。

既有单元快照 `general-read-order-green-unit-current.json` 为 21 项定向通过、0 失败、类型检查 0 失败；总口径仍为 `whole_T34_PASS=false`、Packaging HOLD。该证据复用，未重演。

## 未做与降级

- 未创建 `private-output-*`，未准备 GUI，未替换默认库，未改产品、测试、SDK 或旧 served root。
- 未运行 Node、Python、AST/parser、import、测试、类型检查、构建、prepare、app、HTTP、模型、DPAPI、环境 Key 或进程探测。
- 作者运行计数为 runtime 0。
- Git 全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，未暂存。
- 交付目录内只有 3 个文件、0 个子目录；本次在工作区的全部写入只有该新目录和本交回文件，既有 dirty 原样保留。

## 非零与阻碍

1. `git status --porcelain=v1`（不带 `--ignore-submodules`）exit 1：仓库外子模块元数据
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied。加 `--ignore-submodules=all` 后可正常列出既有 dirty。该权限拒绝不是交付失败，也未修锁、扩权或改 ACL。
2. `git status` 全树带 untracked 时对 T18/T30/T31/T34/T50/T51 若干深层会话目录报 `Filename too long` warning，为既有证据目录长路径，只读噪声，未做任何处理。
3. 作者自写的 PowerShell 树摘要脚本首版按序号排序（`README.md` 排在 `index.ts` 前），与 builder 的字节序不符，算出 `ab0e3fe8…`；已改为 `CompareOrdinal` 字节序后与 builder 口径一致，得 `abc7e857…`。首版结论已作废，未写入任何交付文件。
4. 一次计数脚本因 PowerShell 数组处理（`$rows.ToArray()`）报 MethodInvocationException；改用 `List[object]` 后复点通过。

## NOT_RUN

构建、测试、类型检查、GUI、HTTP、模型、安装、清理和私有输出全部未运行。

## 下一步建议

根执行器先复核三份交付文件、三值逆变换、Agent 树摘要与既有 dirty；确认后另发新令，只执行一次新 `private-output-*` 的 25-output 开发编译。线 B 的独立观察者源码在 B 树内，本次未触碰。

删减轮：读者 0 / 槽位 0 / 半句 1 / 重复 1 / 过程 1 / 黑名单 0

Response ID: A-T18-general-read-private-config-20261030-164557
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T18-general-read-private-config-20261030-164557.md`
