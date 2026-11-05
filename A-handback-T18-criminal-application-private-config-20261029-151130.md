# A 线交回：T18 刑事申请必问 Skill 私有构建配置

日期：2026-10-29  
状态：`READY_FOR_ROOT_REVIEW / CONFIG_NOT_IMPORTED / BUILD_NOT_ADMITTED / RUNTIME0`  
项目状态：`Gate 1 INCOMPLETE / full T18 INCOMPLETE / project INCOMPLETE / Packaging HOLD`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 交付冻结 builder、只含两项数据变化的私有构建配置和准备说明；未执行构建。 |
| 目标是什么 | 为 ROOT 后续一次 25 文件私有开发编译准备可反审输入；真实运行仍未开始。 |
| 在等什么 | 等 ROOT 完成完整源码、配置反演和 builder 清理复核，并明确准入。 |
| 卡在哪 | 本单按作者边界不获导入、编译或运行授权，因此没有新的编译身份、消费者 pin 或业务结论。 |

## 1. 唯一依据与既有状态

本单唯一执行入口：

`D:\Lawbeach\lawbench-coord\A-T18-criminal-application-private-config-order-20261029-151130.md`

前序必问闸门交回：

`D:\Lawbeach\lawbench-coord\A-handback-T18-criminal-application-question-gate-20261029-150420.md`

前序已通过的五个聚焦测试和类型结果继续作为原始证据引用，不重跑。实际根场景仍是
原样失败：8 次模型调用均为 HTTP 200，自然语言回答 1/8，联合问答 0，保存 2；这些
记录没有被本次配置准备覆盖或改写成通过。

当前产品与测试身份仍为批准值：

| 对象 | 字节 | SHA-256 |
| --- | ---: | --- |
| `dsh-ext\agent\index.ts` | 46809 | `ce2493cb60e652195779394bff50819924ceeff64e5bcf63e859928eb2c87294` |
| `dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| `dsh-ext\tests\criminal-application-question-gate-20261029-150420.spec.ts` | 17714 | `e73983461b33dcb1e141cb5e34859f7baca6faced73b1001d5fde73c93e39540` |

`task-state.ts` 的 Git dirty 标记来自既有关闭前状态，字节仍与冻结身份一致，本次未改。
产品、测试、旧配置、旧 private25、SDK、Skill、B 线源码、旧测试和 legacy18/E50 均保持
原状。

## 2. 输入身份

输入目录：

`D:\Lawbeach\lawbench-coord\T18CriminalApplicationPrivateConfigInput-20261029-151130\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-approved-inputs.json` | 22078 | `fe51550655ae3598d1e271fd7e085b3d87f50a7feac41eaab9d18318db2e7c3f` |
| `build-config.mjs` | 20473 | `bba954bdaff4c909daa23d21173d97ec5de90ed92569482f639998ace859e2e6` |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |

`build-approved-inputs.json` 已记录批准输入中的 18 棵树反向、53 个文件/引用身份和
legacy18 身份。本线没有重算或扩展该批准面。

## 3. 交付文件与写入面

准备目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalApplicationQuestionPrivateBuild-20261029-151130\`

| 文件 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 与冻结输入逐字节相同 |
| `build-config.mjs` | 20483 | `dc64b64cc46e7bd274bb7dc4a00563dfc45bd82211967af4a9b1b3b7ff9c2cf2` | 仅两项数据替换 |
| `README.md` | 2585 | `044bc4355f8615c60f7b235ab02449605300bf14482034acedfcf3ce771a144f` | 准备边界与 ROOT 后续 |
| 本交回件 | 落盘后见最终核对 | 落盘后见最终核对 | 正式交回 |

准备目录实际只有三个文件、0 个子目录、0 个 `private-output-*`。写入面只有上述三个
准备文件及本交回件；没有改源码、测试、fixture、consumer、Skill、契约、运行时、SDK、
默认库、旧编译件或业务证据。Git 没有提交，因此没有提交 SHA。

## 4. 精确配置变化与反演

`build-config.mjs` 相对输入只改两处：

| 字段 | 输入 | 本目录 |
| --- | --- | --- |
| `EVIDENCE_ROOT` | `...\CrossExamQuestionPrivateBuild-20261029-122319` | `...\CriminalApplicationQuestionPrivateBuild-20261029-151130` |
| `lawbench-agent-source` | 4 文件，75480 字节，`ab0b94…72d56c` | 4 文件，75605 字节，`fe13bc…6196f` |

反向字面替换结果：

- 新路径在目标中出现 1 次，旧路径残留 0 次。
- 新 agent 数据块出现 1 次，旧 agent 数据块残留 0 次。
- 正向替换结果与目标文件逐字节一致：`True`。
- 撤销两处后与输入逐字节一致：`True`。
- 反演文件长度与 SHA 精确回到 20473 字节、
  `bba954bdaff4c909daa23d21173d97ec5de90ed92569482f639998ace859e2e6`。

因此其余 17 棵树、39 个文件、14 个引用、53 个文件/引用身份、18 个 legacy、
Node/tsx/tsdown/esbuild pin、25 个输出映射、固定路径、loader、HEAD 和构建开关
均保持输入字节。没有动态重算批准哈希、升级依赖或新增信任来源。

## 5. 当前 agent 树

| 相对路径 | 字节 | SHA-256 |
| --- | ---: | --- |
| `README.md` | 66 | `18dad2a97b4860934be8e15e007c3bb435c222aeaf0113cb1fe9adfaee9eda32` |
| `index.ts` | 46809 | `ce2493cb60e652195779394bff50819924ceeff64e5bcf63e859928eb2c87294` |
| `repetition.ts` | 7466 | `e21e2cb7f0d05e82ea2fae37224296188e70c9930521e8474f0992ba0593b323` |
| `task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |

按 builder 的 UTF-8 字面路径顺序重算：

- 文件数：4
- 总字节：75605
- 摘要：`fe13bc5a86d899dd087969f3abc9f28eaa3fa99fed4669fc478bb12bc496196f`
- 与批准 after：精确一致

## 6. 命令、运行与 Git 边界

实际共调用 `exec_command` 32 段（含本交回件落盘后的最终只读核对）：25 段返回 0，
7 段返回非零；另有成功的 `apply_patch` 写入。所有应执行的核对均使用指定原生
`pwsh.exe`、`login=false`。

非零记录：

1. 普通 `git status --short --branch` 进入
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 时
   `Permission denied`。随后用 `--ignore-submodules=all` 完成只读状态核对；未修锁、
   权限或 ACL。
2. 六次误填 `shell=bash` 的读取在命令启动前被 MXC 拒绝，均返回非零；没有执行 Bash、
   没有读取或写入文件。另有 1 次误填 `shell=bash` 的只读 `Get-Content` 成功读取了
   前序交回件，没有写入。发现后全部改为逐条指定原生 PowerShell。
3. 首次 agent 树摘要命令把制表符写成了字面反引号，返回 0 但结论未采用；随后按
   `StringComparer.Ordinal` 和真实制表符重算，得到上述批准摘要。

运行边界：

- Node、Python、TSX、tsdown、esbuild、parser、AST、import、类型检查、测试、build、
  prepare、HTTP、模型、GUI、SSH、环境变量和 Key/DPAPI 执行次数均为 0。
- `build-config.mjs` 未被导入或执行，只做过文本读取、字面替换和字节比较。
- 未创建 `private-output-*`，`BUILD_NOT_ADMITTED`。
- 未安装依赖、未启动 setup、未改默认 package、库、构建器或全局设置。
- 未读取凭据或真实案卷；协调目录未写机密。

Git 全程只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；
没有暂存。目标证据目录现在仅显示三个新增未跟踪文件，前序产品/测试 dirty 均保留。

## 7. 后续与遗留

ROOT 应先完整复核全部源码、整文件配置反演、原始证据、命令和写面；通过后才用本目录
冻结 builder 执行一次全新的 PRIVATE25 开发编译，不使用安装器或打包流程。编译后须
独立验收获 25 个输出文件，再另按精确消费者 pin 单处理。

不得启动旧编译件 `3756` 冒充本次刑事申请必问新特性，不得进入 UI，不得改默认库、
安装目录或删除输出。实际问答与草稿质量仍需后续规范业务运行和律师手工复核；本次
没有由配置准备、旧测试或旧证据推出 `PASS`。

Response ID：`A-T18-criminal-application-private-config-20261029-151130`  
Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T18-criminal-application-private-config-20261029-151130.md`
