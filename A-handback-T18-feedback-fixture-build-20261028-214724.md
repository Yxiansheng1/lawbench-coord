# A 线交回：T18 草稿反馈兼容夹具与私有构建准备

日期：2026-10-28  
执行者：A 线 DeepSeek  
结论：两项有界准备已完成，产品源码未改。`BUILD_NOT_ADMITTED`；Gate 1、T18 全量验收和项目打包均未完成，Packaging 保持 `HOLD`。

## 1. 输入与既有状态

- 已完整读取唯一执行令 `A-T18-feedback-fixture-build-order-20261028-214724.md`。
- 输入目录 `D:\Lawbeach\lawbench-coord\T18FeedbackFixtureBuildInput-20261028-214724\` 确认为目录。
- 原始旧测试 `original-agent.spec.ts` 与当前 `dsh-ext\tests\agent.spec.ts` 均为 10,300 字节，SHA-256 均为 `7a520b1c07908286fd04a00f154ac63b0e3b0c4931c432ccada2965cba68bbcf`。
- 输入 builder 为 32,121 字节，SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。
- 输入 config 为旧数据版本，SHA-256 `d4a4ea44ec126f8329e5d9109d017d89647d5b3ad68f3b0fe0d5e1c51a2e5402`。
- 只读复核下列产品/测试源钉仍与执行令一致：
  - `dsh-ext/agent/index.ts`：`5e53fbe9d1833c6533143a2e87d7c39a4f2cf1ce4ede4b421572664aab9fdcfb`
  - `dsh-ext/agent/task-state.ts`：`fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`
  - `dsh-ext/tests/draft-feedback-recovery.spec.ts`：`6e23e5d532ef4e79f02606dddac472252a9737f6d9d125356e3a85923e8e5f94`
- 既有事实按输入证据保留：旧 `agent.spec.ts` 根实跑为 61 项、52 通过、9 失败，9 项全部来自旧 T7 通用夹具缺少必问 provider；新恢复 7 项、task-state 12 项、必问闸门 19 项、真实工具运行时闸门 8 项另有通过记录。上述历史结果本次未重跑。
- 既有全量 TypeScript 检查为 0 错误，本次未重跑。该结果只对应未变产品基线，不覆盖本新增测试文件的类型检查。
- 未发现或启动第二名 A 线执行者；本 PID 是本次唯一执行者。未拆分 writer 锁，未联系其他聊天，未更换 API。

## 2. 交付文件

### 2.1 新测试兼容副本

路径：`D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-agent-current-fixture-20261028-214724.spec.ts`

- 11,010 字节。
- SHA-256：`c229ce9945c3d85acecddfa1122dd296eabe145a56e3697a53a76392bbbfcb47`。
- 从原始 `agent.spec.ts` 逐字节复制后，仅增加顶部 3 行说明和 7 个构造点的参数绑定。
- 7 个构造点均为实际 `LegalAgent` 的直接 `new`，第 8 个参数均显式为 `async () => []`。
- 第 3 至第 7 参数的原有值与默认语义保留；缺失项使用 `undefined` 走既有构造默认值。
- 保留 15 个 `it` 测试体及全部旧断言；`skip=0`、`todo=0`；未改测试标签、fake service、helper、原文件或其他旧测试。
- 顶部说明明确本文件是非必问的 T7 生命周期兼容夹具，不伪造问题或答案；当前合同审查必问与草稿反馈由独立真实答案路径覆盖。
- 精确反向校验：删除顶部 3 行，再撤销 7 处构造尾参数后，恢复原文件 SHA-256 `7a520b1c07908286fd04a00f154ac63b0e3b0c4931c432ccada2965cba68bbcf`；行内容差异为 0，CRLF 行尾和末尾换行保持。

### 2.2 私有构建准备目录

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DraftFeedbackPrivateBuild-20261028-214724\`

目录内仅有以下三个准备文件：

- `build-private.mjs`
  - 32,121 字节。
  - SHA-256：`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。
  - 与批准 builder 逐字节相同。
- `build-config.mjs`
  - 20,469 字节。
  - SHA-256：`355b4a3e83d1ea9c585227bbd9223ba6a7d1cb666b0bea15b16802f35bccad48`。
  - `EVIDENCE_ROOT` 仅改为 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DraftFeedbackPrivateBuild-20261028-214724`。
  - `lawbench-agent-source` 仅改为 `files: 4`、`bytes: 74824`、SHA-256 `4afb993817f195acce41a6b3c9b03ffe08243ce0553105a3135ca8f8a85f2eb7`。
  - 上述两个区段在文件中各出现 1 次；在内存中还原这两个区段后，与旧 config 的 SHA-256 完全一致，为 `d4a4ea44ec126f8329e5d9109d017d89647d5b3ad68f3b0fe0d5e1c51a2e5402`。
- `README.md`
  - 855 字节。
  - SHA-256：`397f47e8ec990dff326292bd5705e9a0809aa1d9029b45f1d85df27f8eb1d644`。
  - 写明这是准备材料，构建须等待新副本 15 项及相关受影响测试通过，且仅允许一次私有 25 文件开发构建，不允许安装器或打包。

目录不是构建输出，未执行、未导入 config，也未创建 `private-output-*`。

## 3. 验证与未运行边界

已做：

- 只读读取执行令、批准输入、旧测试、相关构造签名和既有结果。
- `Get-FileHash` 核对输入、原始文件、builder、config、README 与三个源钉。
- `Get-Item`、`Get-ChildItem`、`Select-String` 核对大小、路径、构造点、测试数及配置字面值。
- 内存中精确反向变换：测试恢复旧文件 SHA；config 恢复旧数据 SHA。
- 行尾/字节检查：新测试 177 行、177 个 CRLF、0 个裸 LF；builder 哈希未变。

明确未运行：

- 未运行 Node、Python、AST/parser、import、测试、自测、类型检查、构建或 prepare。
- 未运行 HTTP、模型、GPU、GUI、SSH、DPAPI、环境变量 Key、keyring 或真实案卷。
- 未做安装器/打包，未宣称准备材料是实际构建，也未宣称模型验收通过。
- 输入证据声明的 18 棵树反向、53 个文件/引用身份和 18 个 legacy 冻结由 root 后续独立复核；本线未按 builder 重算。
- 新测试副本的最终运行与本文件类型检查仍待 root 执行；新副本必须与受影响测试一起过绿后才可考虑构建。

本次写面只有：

- 新建上述证据准备目录；
- 新建 `t18-agent-current-fixture-20261028-214724.spec.ts`；
- 新建准备目录中的 3 个文件；
- 新建本交回件。

`dsh-ext/tests/agent.spec.ts`、产品源码、schema、Skill、consumer、manifest、B entry/map、编译产物及预算文件均未由本线写入。

## 4. 非零命令与阻碍

- 根目录 `git status --short --branch` 退出 1：Git 进入 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 时 `Permission denied`。未尝试修复锁、ACL、工作树或 Git 权限。
- 一次目标存在性检查因 PowerShell 管道语法错误退出 1；修正后重跑成功，未发生写入。
- 一次测试反向校验命令因 PowerShell 内联中文引号解析错误退出 1；改用无中文字面量的行数组校验后成功，未发生文件写入。
- 两次数值/配置检查调用误填了非 PowerShell shell 参数；运行器在任何 shell 命令执行前以 `Bash/E_ACCESS_DENIED` 拒绝。未启动 Bash、未执行命令；随后均以指定原生 `pwsh.exe`、`login=false` 重跑成功。
- 未使用 Bash 执行产品命令；未启动 setup 或 legacy；未改沙箱、审批、ACL 或权限。

## 5. Git 与离场状态

- Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- index.lock 或权限拒绝不作为本次准备交付的修复目标，也未尝试扩权或改锁。
- `A-dirty-before.txt` 仅作保全，未回滚或清理工作树。由于上述子模块权限阻碍，本次无法用根 `git status` 重列完整 dirty；本线已按实际写面逐项限定。
- 交回以本协调目录文件为准，不以 Git 提交为准。

请求 root 下一步：用新副本替换旧测试运行面，重跑 15 项兼容副本及相关受影响测试；若全绿，再独立复核 18 棵树、53 个引用和 builder 清理，随后只做一次私有 25 文件开发编译。Gate 1、T18 全量和 Packaging 当前均不通过。
