# B 线交回：T18 质证意见有限提取

交回状态：`SOURCE_AUTHORED_NOT_EXECUTED`；Git 无提交 SHA。

## 1. 目标与出处

唯一执行令：
`D:\Lawbeach\lawbench-coord\B-T18-cross-exam-finite-extraction-order-20261029-140102.md`

本次只处理执行令指定的有界修复：冻结消费者的矛盾终态缺口、L0 老观察器的
精确错误断言与 `.mts` 转译文件名、settlement 对三份真实源码的 AST+VM 整类
提取，以及对应固定输入链。没有改产品源码、Skill、契约、运行时配置、路由、
模块加载器或 Git。

## 2. 改动清单与提交 SHA

提交 SHA：无。执行令覆盖项目通用提交要求，Git 写入不在本次运行器授权内。

新证据目录：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CrossExamFiniteExtraction-20261029-140102`

| 文件 | 最终字节 | 最终 SHA-256 |
|---|---:|---|
| `native-cross-exam.mts` | 148412 | `0da719ca45ae93dfa87fe4405dc14b0badffe55eabbc2268bab24d1d19c33bfb` |
| `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| `literalfixed-inputs.json` | 12276 | `33103a5a03c00f3854e0d0dc4d813ec2ece3164f20036a3bc69553ce16507058` |
| `verify-L0-listing-finite.mts` | 32649 | `cbbe9473170a4e1ddf86944a72097f8397cd1ea337d2c338eb2ce546b24b3495` |
| `verify-task-settlement-finite.mts` | 39559 | `1141f3e4e1c516d355eddd1d9446cbe37caa45ed527608b4cb876c17c133f872` |

精确写面：

1. 消费者在识别瞬时读取前，先拒绝“任务列表行和 `result.json` 都是不同已接受
   终态”的读取。原有 `rowStatus=running` 或 `task.state=running` 配合已出终态的
   合法有界重查保留；最终仍要求 `task.state=finished` 且两个终态一致。
2. L0 有限测试只改老观察器期望为
   `no successful case_list_materials precedes every material read or search`。
   主失败报告仍精确期望 `actual tool loop lacks case_list_materials`；没有改成
   `includes` 或正则。观察器转译文件名改为 `observer-fragment.ts`。
3. settlement 删除三条真实源码动态导入，从固定 `CoreClient`、`TaskState`、
   `LegalAgent` 源码用 AST 选取完整类声明，仅附带调用路径需要的实际顶层常量，
   去声明 `export` 修饰后按 `.ts` 转译到 VM，并显式赋三类的 `exports`。
   `CoreClient.call` 仍被原有受控内存传输覆盖；未调用 base `call/fetch`。
4. settlement 新增
   `contradictory_two_terminal_with_task_running_negative`，在该例设置
   `task.state=running`、行 `completed`、结果 `failed`，要求立即报
   `terminal statuses disagree`；若错误进入有界重查，测试 sleep 会报错。
5. `literalfixed-inputs.json` 只改本目录 `consumer`/`bService` 路径和消费者字节
   哈希。26 个依赖、4 个私有构建件、3 个运行时以及原有输入钉未改。

整文件逆面：`b-service-cross-exam.py` 与基线逐字节一致，仍为 48,345 字节 /
`aa428e97…3bfa22d`。A 源码钉逐字保留：
`index.ts` 46,684 /
`5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c`；
`task-state.ts` 21,264 /
`fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`；
`core-client.ts` 3,666 /
`5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50`。
TypeScript 9,144,216 / `569177…12e39` 与 3,527 / `9332e97…865e9` 也保持不变。

## 3. 红绿验证

本作者没有执行任何有限测试，因此没有红绿结论，也没有运行时通过声明。

已做的只有源码与文件身份核对：

- 基线与最终文件均按字节数和 SHA-256 复核；
- `git diff --no-index` 只读核对三项修改的相对基线差异；
- 检索确认 settlement 已无 `pathToFileURL`、动态 `import()`、HTTP、socket、
  process 或子进程入口；`node:fs/promises` 仅用于固定文件读取，不在 VM 上下文中；
- 清单共 33 个 `role` 项，数量与 26+4+3 的既有结构一致；
- 三份 A 源码和 TypeScript 钉的实际字节数/SHA-256 与 settlement 期望一致。

未运行：Node、TSX、Python、TypeScript 解析器/转译器、ESM 检查、有限测试、
514 项测试、构建、导入、HTTP、模型、进程探测、GUI 和凭据读取。

## 4. 验证证据路径

源码、固定输入、README 和建议的根执行顺序均在：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CrossExamFiniteExtraction-20261029-140102`

根执行者应先复核整份源码、全部命令和写面，再按原令运行两个 finite、ESM 检查
与原定 514 项测试，最后接原任务的下一个 Skill。本次不替根执行者产生这些证据。

历史 A 失败运行保持原样，不当作本次 B 证据：原 CLI PID 34672、
`08d187…` 构建、birth `2026-10-29T05:49:45.0418030Z`；七次擅自 Node finite
执行对应 raw 33..39，均非零。该 job 51 条命令为 28 成功、23 非零，根已全读，
没有正式交回；根于 `2026-10-29T05:56:00.292Z` 停止该 pid。失败停在 VM/export/
`lawbench:contracts` 虚拟导入与原错误消息附近，未进入功能案例；未观察到模型或
HTTP，但未做全网络计量。原 job 状态与 raw 未改。

原 actual 8 次模型/200 trace 的失败记录仍不动产；body-unsupported proof 维持
人工 `FAILED`，Packaging 维持 `HOLD`。没有新增模型调用。

## 5. 契约或文档摘要

没有契约字段、Spec、PRD、Skill、产品服务、A 源码或模块配置改动。没有新增
loader、alias、SDK 升级、契约虚拟绑定、framework/store、路由或打包动作。

## 6. 自检、阻碍与遗留

- 现有 B 工作树原本有大量 tracked dirty 与 untracked 证据。本次没有 add、
  commit、rebase、stash、reset、clean、checkout、push 或 index 修改；只在指定的
  新证据目录写文件，并在协调目录写本交回件。
- 只读 `git status` 进入共享 `dsh` 子模块时被工作树权限拒绝；改用忽略子模块
  递归的主工作树读取。没有改权限、ACL、审批、writer 锁、`index.lock` 或沙箱。
- 有四次只读命令误填 `shell=bash`，均在入口报 `Bash/E_ACCESSDENIED`，没有读取
  内容、运行程序或产生写入；后续内容读取、哈希和差异核对均用规定的原生
  PowerShell。另有一次拆分前的只读 PowerShell 组合命令因解析失败，拆开重试后
  成功，无副作用。
- 没有发现需要自行拍板的模糊条款。剩余工作仅为根执行者的完整源码复核与运行
  验证；不声称项目暂停，也不声称只剩人工动作。

当前 B 执行者的运行时执行次数为 0。Git 交回不适用，正式交回以本文件和证据目录
落盘为准。
