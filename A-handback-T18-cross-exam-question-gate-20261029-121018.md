# A 线交回：T18 cross-exam-opinion 必问闸门

状态：SOURCE COMPLETE / VERIFICATION UNRUN / GIT UNTOUCHED / STOP

收件：GPT 主编排

## 交付

- 产品源码：`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
  - 前：46,547 B，`40ab48b82a3bb8b1ae488daa1ba930924d1b8b292aa70114bf317e9a633d5794`
  - 后：46,684 B，`5366f8454189cbfeeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c`
- 聚焦测试：`D:\Lawbeach\lawbench-A\dsh-ext\tests\cross-exam-question-gate-20261029-121018.spec.ts`
  - 17,345 B，`670c9f5573ec8530e088a3735b68aca2c63efbb0a94b3927c825ef24f186870c`
- 源码说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamQuestionGate-20261029-121018.md`

## 精确改动

仅把 `cross-exam-opinion` 作为第五个已确认必问 Skill：

- 新增导出的 `CROSS_EXAM_OPINION_SKILL` 常量；
- 加入现有 `REQUIRED_QUESTION_SKILLS`；
- 三处相关说明补入质证意见。

没有改 `requiredQuestionIds`、`TaskState`、`acceptFinalQuestionAnswers`、`preTool`、`executeTool`、协议、UI、参数、预算、通知、存储或其它 Skill 激活。

## 测试设计

新测试使用真实 `LegalAgent`、`TaskState`、当前 Host Skill 元数据和已安装 ToolRuntime；内存 Core 仅为单元夹具，不伪造 NativeSession、模型、历史、R 或案件资源。

覆盖主 Host 的 `stance/scope/need_questions`、保存前置拒绝、工具预算顺序、空/未知/重复/漏项/畸形 ID、失败/取消/陈旧结果、同一任务联合成功、目录 fail-closed 和合法空目录。既有通用生命周期测试原样复用。

## 保持与计数

`task-state.ts`、三份既有闸门测试和 A 线现有 `SKILL.md` 的字节与哈希均与开工快照一致；消费者、旧运行、回调、Skill、B 线源码和 private 25 均未改。

正式输入的 B 线主 Skill 快照为 12,390 B、`03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a`；A 线当前同名 Skill 为 11,410 B、`9b22ff099b8239341eea5585b5ce1600972675dc7a035de57afe9e5fc865ccbd`，三项必问元数据及联合确认要求一致，测试按 A 线当前 Host 解析。

Node、Python、测试、类型检查、构建、导入、HTTP、模型、GUI、SSH、环境/Key/DPAPI/进程探测均为 0；Git 写入为 0。

## 根后续

本次按令未运行测试与类型检查。根应先做完整累计源码复核，再运行：

```powershell
Set-Location D:\Lawbeach\lawbench-A\dsh-ext
corepack pnpm@11.7.0 run test -- tests/cross-exam-question-gate-20261029-121018.spec.ts
corepack pnpm@11.7.0 run typecheck
```

之后如需私有编译，只接受 approval 后的精确 data-only 配置、本交回的 `5366f845...` 源码哈希和冻结 builder `347ae`。不得复用旧编译件 `40ab` 冒充新激活。

## Git / 阻碍

严格只读。目标文件不存在 `index.lock`；全量 `git status` 在 `dsh` 子模块处报 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝。`--ignore-submodules=all` 的只读状态显示工作树原本已有大量 dirty/untracked 内容，均已保全。未修复锁/权限，未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
