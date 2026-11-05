# A 线交回：T18 合同审查草稿反馈回收

生成时间：2026-10-28T21:40:39+08:00

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已写最小产品改动和 7 个聚焦测试。合同审查保存后若返回任意 `citation_check.problems`，下一次正常模型请求前会用现有 notice 流提醒一次；运行验证没有做。 |
| 目标是什么 | 目标是让合同审查模型在已经保存草稿后，必须再看一次刚返回的出处核对问题，并区分材料事实、建议文字和仍需律师复核的合法提示。任务门、盲测门、真实模型质量和整个 T18 均未通过。 |
| 在等什么 | 等主编排先完整审源码、delta、测试夹具、类型契约和写面；审查通过后再由有运行权限的人做 focused regression、类型检查和一次同一原始真实流程复测。信号是主编排明确认可当前文本并派运行验证。 |
| 卡在哪 | 本执行令禁止运行 Node/Vitest/tsc/模型，因此所有测试结果都是 `NOT RUN`。没有产品逻辑阻碍；不能把静态测试文本当作绿色证据。 |

## 1. 改动

- `dsh-ext\agent\index.ts`
  - begin 时把 `skill === 'contract-review'` 快照进当前 `TaskState`。
  - `case_save_draft` Core 成功且现有 result 契约校验通过后，观察同一保存结果里的 `citation_check.problems`。
  - 预算放行后的下一次 `agent/pre-step` 经现有 `notice(...)` 注入来源 `lawbench-draft-check` 的固定提醒。
  - 未改 endReason、UI、问题算法、旧 consumer、断言或调用预算。
- `dsh-ext\agent\task-state.ts`
  - 新增默认关闭的 `draftFeedbackRecovery` 快照，以及任务内 `pending/sent` 两个布尔。
  - 干净保存清除未取提示；同一任务发送一次后不再重排。
  - 新任务使用新对象，不共享全局提示。
- `dsh-ext\tests\draft-feedback-recovery.spec.ts`
  - 7 个测试，391 行；使用现有 `contracts\examples\tool_save_draft.result.json` 和现有合同问题 ID。
  - 使用 `LocalCore extends CoreClient`，仅内存返回；执行真实 `LegalAgent.preStep/executeTool` 和契约校验。

## 2. 写后身份

- 分支：`line-A`
- HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 无新 Git 提交
- `dsh-ext\agent\index.ts`：`5E53FBE9D1833C6533143A2E87D7C39A4F2CF1CE4EDE4B421572664AAB9FDCFB`
- `dsh-ext\agent\task-state.ts`：`FA2467257B68F274BF4E734EA7116DBCE20D15327B66952AE01AC6E5A708479B`
- `dsh-ext\tests\draft-feedback-recovery.spec.ts`：`6E23E5D532EF4E79F02606DDDAC472252A9737F6D9D125356E3A85923E8E5F94`

以上两源码在写前与冻结快照相同：

- `dsh-ext\agent\index.ts`：`4f652150927692c5230bd7ec5d517fdec2f45e35839fefd017d3e6d0aa3c922c`
- `dsh-ext\agent\task-state.ts`：`d69d93748eace497539a5ca96b18fd19e9852de2b3bed93cbddb45c87a7277b4`

## 3. 提醒文本与诚实边界

固定提醒是：`case_save_draft 已完成保存，并返回了 citation_check.problems。请逐条核对全部问题：材料中的事实陈述应使用与材料名、位置真实匹配的〔…〕出处；拟议条款、修改建议等并非材料事实，不要仅为清除提示而硬加出处。需要改动时修改，并用同一标题重新保存；只需律师复核的合法提示，请在最终回答中明确说明仍待律师核对。passed=true 只表示没有必须修改项，不等于所有事实已经核验。不得为清除提示虚构材料、出处、问答或任务事实。`

这里观察的是工具体成功返回、契约校验后的保存结果，即保存时正文的实际核对快照；它不等于 post-execute 的最终改写结果，也不能证明模型后来遵守了提醒。

## 4. 依据与复用

| 证据 | 读数或 SHA-256 |
|---|---|
| 原始真实会话 | `AA45F25B674DC8E3F58140784B98A97CFAB38A96EAA8E330A5C0077FFA4E6056` |
| 原始最终草稿 | `F6CF41FDDB2F7A5FD71CF3181B760619658C520B429F578DA611C2F07E27A1F7` |
| 根失败记录 | `F9FB8AFFCB4788A64E96973C7613B842BC13DF068E9FB86F28A4BA8F73D2666B` |
| B 线历史审计 | `11EB314E831821CB0634963FDCB74ABD930A504B41BA1A23B0192B1884B3BDA1` |
| B 线历史正式说明 | `C0153B4F451EF917ECFFF8AA6CF5A4CA6C7A567173E0CBE0F2EE94FB0C3EA5B5` |
| 仓库内说明 | `docs\plan\evidence\T18\DraftFeedbackRecovery-20261028-213436\README.md` |

原始真实会话、最终草稿和根失败记录的哈希与历史记录相同，本次未重写。

## 5. 未做与降级

- `NOT RUN`：Node、Python、Vitest、tsc、语法解析器、导入、收集、自测、准备、构建、HTTP、模型、探测、GUI、GPU、SSH、DPAPI、环境变量、Keyring、真实案卷。
- `NOT RUN`：focused regression、类型检查、私有构建、一次同一原始真实合同审查复测。
- 未改 provider、模型参数、预算、Skill、system prompt、旧测试、旧断言、UI、Host、runtime、config、SDK、compiled/private、18 legacy 或 E50。
- 没有业务质量结论；不得据本次静态文本宣称模型已经区分事实和建议，也不得宣称 `passed=true` 等于事实全部核验。

## 6. 非零与过程偏差

- 一次普通 `git status --short` 因既有 `modules/dsh` 子模块 gitdir 权限拒绝退出 1；之后以 `--ignore-submodules=all` 只读成功，没有修权限或锁。
- 因命令模板误填 `shell=bash`，共 7 次被环境以 `BASH_ACCESS_DENIED` 拒绝，均无执行、无写入；没有启动 setup、legacy 或改审批/沙箱。
- 2 次使用相对 `pwsh` 的成功命令和 1 次使用相对 `pwsh` 的失败命令偏离“每命令指定绝对原生 pwsh”的要求；失败项退出 255，原因是该解释器下找不到 `Select-String`。均无写入。

## 7. 写面

- 产品：修改 `dsh-ext\agent\index.ts`、`dsh-ext\agent\task-state.ts`
- 测试：新增 `dsh-ext\tests\draft-feedback-recovery.spec.ts`
- 证据：新增 `docs\plan\evidence\T18\DraftFeedbackRecovery-20261028-213436\README.md`
- 正式交回：新增本文件
- Git：仅读；没有 add/commit/rebase/stash/reset/clean/checkout/push，没有改 index.lock、ACL、审批或沙箱

## 8. 全部 Shell 命令账

以下为本执行器从读令到写回件前的全部 shell 调用；并列命令按 a/b 顺序逐一记录。路径中的 `<...>` 只用于压缩本表，未用于实际解析。退出码未注为 0。

1. `Get-Content -Raw -LiteralPath <execution-order>`
2. a `Get-Content -Raw docs\plan\lawbench-关键事实索引-20260928.md`
3. b `Get-Content -Raw PROJECT-PROFILE.md`
4. c `Get-Content -Raw <B-findings-historical.md>`
5. d `git status --short` — 退出 1，既有子模块 gitdir 权限拒绝
6. e `Get-Content -Raw docs\plan\lawbench-工单集-第一版开发-20260928.md`
7. a `git status --short --branch --ignore-submodules=all`
8. b `Get-Content -Raw dsh-ext\agent\index.ts`
9. c `Get-Content -Raw dsh-ext\agent\task-state.ts`
10. d PowerShell 读取 T18 工单段 — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
11. e PowerShell 读取 `docs\src\Spec.md` 900–970 行
12. f `Get-ChildItem docs\plan\evidence\T18 -Recurse -File`
13. a PowerShell 提取 T18 工单段
14. b PowerShell 编号读取 `index.ts` 130–390
15. c PowerShell 编号读取 `index.ts` 390–560
16. d `Get-Content -Raw contracts\tools\case_save_draft.schema.json` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
17. e PowerShell 编号读取 `contracts\common.schema.json` 330–440
18. f `Get-ChildItem dsh-ext\tests` 并按合同/Agent/草稿名过滤
19. a `Get-Content -Raw dsh-ext\tests\contract-question-gate.spec.ts`
20. b `Get-Content -Raw dsh-ext\tests\contract-question-gate-runtime.spec.ts` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
21. c `Get-Content -Raw dsh-ext\tests\agent.spec.ts`
22. d `Get-Content -Raw contracts\tools\case_save_draft.schema.json`
23. e `Get-Content -Raw dsh-ext\shared\core-client.ts` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
24. f `Get-ChildItem <T18DraftFeedbackRecoveryInput> -Recurse -File`
25. a `Get-Content -Raw dsh-ext\shared\core-client.ts`
26. b `Get-Content -Raw dsh-ext\tests\contract-question-gate-runtime.spec.ts`
27. c `Get-Content -Raw dsh-ext\tests\task-state.spec.ts`
28. d `Get-Content -Raw <source-before.json>`
29. e `Get-Content -Raw contracts\examples\tool_save_draft.result.json`
30. f `Get-Content -Raw <A-dirty-before.txt>`
31. a `Get-ChildItem dsh-ext -Recurse -File -Include *.ts,*.tsx | Select-String 'citation_check|CaseSaveDraft|SaveDraft'`
32. b `Get-Content -Raw dsh-ext\shared\contracts.ts`
33. c `Get-Content -Raw dsh-ext\package.json` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
34. d `Get-Item <B findings+formal>` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
35. e `Get-FileHash` 六个冻结源码/夹具
36. a `Compare-Object` 冻结与当前 `task-state.ts`
37. b `Compare-Object` 冻结与当前 `index.ts`
38. c PowerShell 编号读取新测试 1–230
39. d PowerShell 编号读取新测试 231–末行
40. e `Select-String` 检查 `any/type-suppression/network` — 被误设为 `shell=bash`，退出 1，`BASH_ACCESS_DENIED`
41. f `Get-Item` 三个写面文件 — 使用相对 `pwsh`，成功
42. a `Select-String` 检查三个写面的 `any/type-suppression/network`
43. b `git rev-parse --show-toplevel; git rev-parse --abbrev-ref HEAD; git rev-parse HEAD`
44. c `git status --short --ignore-submodules=all -- <允许写面>`
45. d `Get-ChildItem <T18CitationRecoveryInput> -Recurse -File`
46. e `Get-FileHash` 新冻结输入四文件
47. f `Test-Path` 证据目录、交回目标并取系统时间
48. a `Get-FileHash` 原始会话、最终草稿、根失败记录
49. b `Get-FileHash` 三个写面 — 使用相对 `pwsh`，成功
50. c `Select-String` 搜索 `new TaskState(` — 使用相对 `pwsh` 且解释器不对，退出 255
51. d PowerShell 编号读取 `index.ts` 关键段
52. e PowerShell 编号读取 `task-state.ts` 关键段
53. `Get-Content -Raw D:\Lawbeach\lawbench-A\.agents\skills\formal-report\SKILL.md`
54. `Get-Content -Raw D:\Lawbeach\lawbench-A\.agents\skills\human-explain\SKILL.md`
55. PowerShell 取当前时间、测试行数、7 个测试计数和三个写后 SHA-256
56. `Get-Content -Raw -LiteralPath <README>,<handback>`
57. `Get-FileHash -Algorithm SHA256 -LiteralPath <README>,<handback>`

命令 56、57 均退出 0。回读时 README 哈希为 `0A9E6367D1B5F55463E82A8146139FD6E0CE74C825D6D8E7C07A150D3D04DB96`；本交回件当次哈希为 `036108928867A0408970E6725FB6C32989D06E450BA3D023AECB7A42452D40EB`，其后仅追加本节命令账与修正第 40 条标签。

写入使用编辑器补丁，不是 shell：本执行器共 8 次补丁，分别为产品源码一次、新测试初始新增一次、新测试局部调整五次、README 和本交回件一次。

## 9. 下一步

主编排先审当前源码、测试、冻结输入和本节命令账。若接受，下一步是运行 focused regression、类型检查和一次同一原始真实流程；到那时才有资格判断该提示是否真正改善模型行为，当前结论仅为源码与测试已写、运行结果未知。

Response ID: 本执行器线程未提供独立响应编号  
Response log path: chat reply；正式落盘路径为本文件
