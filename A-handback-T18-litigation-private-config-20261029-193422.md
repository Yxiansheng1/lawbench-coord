# A 线交回：诉讼文书问答私有构建配置

日期：2026-10-29  
状态：`READY_FOR_ROOT_REVIEW / CONFIG_NOT_IMPORTED / BUILD_NOT_ADMITTED / RUNTIME0`  
项目状态：`Gate 1 INCOMPLETE / full T18 INCOMPLETE / project INCOMPLETE / Packaging HOLD`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 交付冻结构建器、只含两项批准数据变化的私有构建配置和 README；没有执行构建或重跑旧证据。 |
| 目标是什么 | 为 ROOT 后续一次全新 25 文件 PRIVATE25 开发编译准备可反审输入。 |
| 在等什么 | 等 ROOT 完整复核全部命令、整文件反演、当前源码和冻结 builder 清理状态，并明确构建准入。 |
| 卡在哪 | 本单没有导入、编译、消费者接线或运行权限；原诉讼问答真实运行仍失败，静态配置和既有单测不能推出业务通过。 |

## 唯一入口与输入

唯一执行入口：

`D:\Lawbeach\lawbench-coord\A-T18-litigation-private-config-20261029-193422.md`

冻结输入目录：

`D:\Lawbeach\lawbench-coord\T18LitigationPrivateConfigInput-20261029-193422\`

| 输入文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20471 | `36e85da4c40f8e6c44baa266111f76a1b5c78dccb8e75ac4e69069e1114670a2` |
| `build-approved-inputs.json` | 22075 | `4843015ae7663c1d866854bd9c142f570707e7a4333fc5030116cd7b0b8f6942` |

## 交付文件

准备目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\LitigationQuestionPrivateBuild-20261029-193422\`

| 交付文件 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 与冻结输入逐字节相同 |
| `build-config.mjs` | 20474 | `ccf1275f1162edd01106be10048db739d5c6529a60ceffb0769bbfb963574206` | 仅两项批准数据变化 |
| `README.md` | 4747 | `5e3356230f6e9b4f1cfe203694e6e265c097935827fde031906dca5de7ecf01c` | 记录身份、复用证据与后续边界 |
| 本交回件 | 落盘后核对 | 落盘后核对 | 正式交回 |

目录实测为 3 个文件、0 个子目录、0 个 `private-output-*`。没有生成编译产物。

配置相对输入只改两处：

1. `EVIDENCE_ROOT` 指向本准备目录。
2. `lawbench-agent-source` 从 4 文件、75754 字节、
   `95d0b63bf2ac846e9f1cac6aedbaac47a4708268ed0baef74b34dfd2dd9b1231`
   改为 4 文件、77061 字节、
   `3e77bb4aef925c22d84bfa04b9530e07df20a1607f1e5ea7e8504f013f09eaf7`。

新值逐字取自批准输入，没有动态重算批准树摘要、引入新库、升级依赖或把新 pin 用于旧代码。
把输入配置的两项旧值替换成新值后，结果与目标文件逐字节一致；撤销两项后，结果与输入
文件逐字节一致。新路径、新字节数和新摘要各出现 1 次，旧值残留均为 0 次。因此其余
17 棵树、39 个文件、14 个引用、53 个文件/引用身份、Node/tsx、25 个预期输出映射、
固定路径、构建开关和 loader 保持输入字节。

## 前序证据复用

前序产品、TaskState 和测试身份按批准清单原样复用：

| 对象 | SHA-256 |
| --- | --- |
| `dsh-ext\agent\index.ts` | `ba30eff62c89e2969caffa37feb6eedf5ea4af6ddebe5db426d4dcb3f238e014` |
| `dsh-ext\agent\task-state.ts` | `b111686981b2b14cce2eefdcc721c55c03d2bcc367d20da343b34953e66d5d3b` |
| 当前测试 | `58576d67eefd99d1b40139a0d82aa7b5462d485d4a2017da134a305108584ebf` |

前序 4 个聚焦 UNIT 测试通过，耗时 7.0682647 秒；类型检查退出 0，耗时 9.6655946 秒；
作者运行器为 0；5 个已验证 OS 进程自然消失，未强制终止。

`LitigationDocsNative-20261029-185959\run-keDSBH` 原样保留：10 次模型 POST 均返回
HTTP 200，共 68 个事件；运行因读取顺序和观察者拒绝契约失败。23 包封存摘要仍以
`96859e...` 开头，未改写。单测通过不等于原生问答、业务、法律、Gate 1 或完整 T18 通过。

## 验证、计数与阻碍

本单实际执行命令 18 次，成功 17 次，非零 1 次；所有 Shell 均为执行令指定的完整原生
PowerShell 路径、`login=false`，没有启动 Bash。产品运行期计数为 0：

- Node、Python、TypeScript、TSX、AST、解析器、导入、检查、测试、构建和打包：0。
- HTTP、模型、GUI、SSH、DPAPI、环境变量 Key 读取和进程探测：0。
- Git 暂存、提交、rebase、stash、reset、clean、checkout 和 push：0。
- 安装、消费者接线、恢复运行和旧编译件运行：0。

唯一非零项是普通只读 `git status` 被子模块 `dsh` 的外部 `.git` 路径权限拒绝
（`Access denied`）。随后没有修 ACL、锁、权限或审批，没有改用 Git 写入，也没有拆 writer
锁；该阻碍不影响本次新增文件与字节反演交付，完整脏状态仍待 ROOT 用既定只读方式复核。

没有修改产品、测试、fixture、消费者、Skill、契约、运行时、SDK、默认库、旧编译件、
权限、锁、审批或全局设置。没有读取凭据或真实案卷，协调目录没有写入机密。

## 下一步

ROOT 应先复核本交回全部命令和写入面、整文件配置反演、当前源码及冻结 builder 清理状态；
复核通过后，用本目录冻结 builder执行一次全新的 PRIVATE25 开发编译，不使用安装器或打包
流程。编译后独立验收恰好 25 个输出，再按精确消费者 pin 接入当前运行时，记录 imports 和
manifest SHA；之后只做一次原始必要恢复实跑并闭环。消费者运行须另行批准。

不得运行旧 `896f` 编译件作为本次运行门，不得启动旧编译件冒充诉讼文书问答新特性，不得
进入 UI，不得修改默认库、安装目录或删除既有输出。

Response ID：`A-T18-litigation-private-config-20261029-193422`  
Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T18-litigation-private-config-20261029-193422.md`
