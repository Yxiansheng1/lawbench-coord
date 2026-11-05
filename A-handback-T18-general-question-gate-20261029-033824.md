# A 线交回：T18 general-drafting 必问闸门

状态：有界源码修改、5 场景测试作者交付和正式交回完成。  
验证状态：作者运行器 runtime 0；新测试及受影响既有验证均未执行，留给 ROOT 独立完成。  
项目状态：不宣称 T18 或业务质量 PASS；`Gate1 full T18 project INCOMPLETE`，Packaging 继续 `HOLD`。

## 结论

`general-drafting` 已接入既有必问闸门。产品只新增
`GENERAL_DRAFTING_SKILL = 'general-drafting'` 并把它加入既有
`REQUIRED_QUESTION_SKILLS`；必问 ID 仍由当前 Host 的
`skillQuestions('general-drafting')` 从机器 Skill 目录读取。产品没有硬编码
`doc_type`、`recipient`、`goal`，也没有新框架、prompt、提交专用 runtime 或第二套回答状态。

真实回答、取消、错误答案、同会话新任务和旧任务晚到结果继续由现有
`TaskState.captureQuestionAsk` / `acceptFinalQuestionAnswers` / pending 身份核对处理。
`case_save_draft` 与 `case_save_edit_list` 在两个写入入口统一受
`deliverableWritesAllowed` 控制；普通案件读取仍可用。草稿出处反馈仍只对
`contract-review` 启用，通用文书不会被扩展成 reviewer 反馈。

## 交付物

| 类型 | 路径 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| 产品 | `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 46371 | `b2e460220a7ee037fec883fa3fb19e285fa2789846c0af7807099683f2e81255` |
| 新测试 | `D:\Lawbeach\lawbench-A\dsh-ext\tests\general-drafting-question-gate.spec.ts` | 9032 | `c14bce581cfe033ab7a4cc6192ab8a3920c402094f16bf1b0f0a1445a499076a` |
| 证据说明 | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionGate-20261029-033824\README.md` | 9904 | `d9c6f88a34f99afabab0fa7030a6b458b7b782ed1aef80eba91f20b918b6453c` |
| 本交回件 | `D:\Lawbeach\lawbench-coord\A-handback-T18-general-question-gate-20261029-033824.md` | 见 `C44` | 见 `C44` |

产品修改前为 46243 字节、
SHA-256 `d21dd7be6bc1fcb561063f259c2ad2e8d8714679f57982608823f5a896b1a5b0`。
逐行对比执行令输入副本，只有 6 条新增行、5 条删除行，净增 1 行：新增一个常量，既有
`REQUIRED_QUESTION_SKILLS` 加入该常量，另改四处相关说明文字；没有其它产品行变化。

## 冻结对象

| 对象 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| `dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` | 未变，精确匹配执行令 `fa2467…` |
| `dsh-ext\tests\doc-revise-question-gate.spec.ts` | 12428 | `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40` | 未变 |
| `skills\general-drafting\SKILL.md` | 12515 | `a7be13fd93be6f6fe5ff97606cb6018f9f1b2795d4f700c00ae1930383b52f9a` | 当前 Host 测试目录所用 Skill，未变 |
| 执行令输入 `SKILL.md` | 13495 | `2a167b44f4da3cde768834d9a476f2a252c8cf3138cba61f48d99bbf7214fe31` | 未变 |

本次没有修改 TaskState、其它产品文件、old tests、Skill、B source、SDK、runtime、lib、UI、
end reason、budget、prompt、fixture、契约、设置、provider、凭据或真实案卷。

## 新测试的 5 个场景

测试使用真实 `LegalAgent`、当前 `LawbenchRemote` Skill 目录解析和现有
`TaskState`/`Budget`/`Params`/`QuestionExecutionIdentity` 类型契约。所有提问参数都从 Host
返回的实际 ID 生成，产品路径没有从测试常量取三项 ID。

1. 当前 Host 机器目录精确返回 `doc_type`、`recipient`、`goal`，Agent 将目录结果原样固定到
   本轮 `TaskState.requiredQuestionIds`。
2. 真实回答前，首份草稿与修改清单在 `preTool` 和直接 `executeTool` 都被拒绝，Core 工具写入
   为 0；普通读取可用。
3. 三项真实结构化回答齐全后，首份草稿获准并只到达 Core 一次。
4. 错 ID、下游取消、旧任务晚到结果都不解锁同会话的新任务。
5. Host 必问能力不可用时 `general-drafting` 整轮 blocked，不创建可写空需求状态。

新测试没有运行；`contract-review`/`doc-revise` 旧测试没有改写，也没有运行。

## 根因证据与失败状态

- 真实失败 `run-iOLk2a` 原样保留：96.546 秒；12 次 model POST 均为 HTTP 200；
  5 份材料全读；4 次草稿保存成功；`ask_user_question` 为 0；最终驱动退出 1。
- 该失败没有重跑，`actual-closed.json`、raw、旧 README、旧 formal 和失败标记均未改写。
- 前一轮 A-031834 因 `Node --check` 与 Env 名检查被拒/停止的状态原样保留。本次没有重复
  Node/Python check、环境变量读取、安装、调研、全量测试或旧任务动作。
- 本次将失败状态继续视为失败，不把作者测试代码或静态修改计作修复绿灯。

## Git 和工作树

- Git 严格只读。没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`；没有暂存，交回依赖协调目录文件而不是 Git 提交。
- 开头的普通 `git status --short --branch` 返回 1：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh':
  Permission denied`，子模块 status 随后失败。未修复 index/submodule 权限、ACL、锁或审批。
- 使用 `git status --short --branch --ignore-submodules=all` 只读确认 A 线原有大量 dirty。
  本次只新增/修改下面四个交付路径，没有回退或清理既存改动。
- 当前 PID 是本次唯一 writer；没有拆分 writer lock，没有启动第二 writer，也没有执行 setup。

写入面只有：

```text
D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts
D:\Lawbeach\lawbench-A\dsh-ext\tests\general-drafting-question-gate.spec.ts
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionGate-20261029-033824\README.md
D:\Lawbeach\lawbench-coord\A-handback-T18-general-question-gate-20261029-033824.md
```

## 验证边界与命令

全部实际命令使用显式原生运行器：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
sandbox=managed/use_default
workdir=D:\Lawbeach\lawbench-A
```

完整逐条命令台账在证据 README 的 `C01`-`C44`。命令范围只包括：

- `Get-Content`/`Get-Item`/`Get-FileHash`/`Select-String`/`rg`/`Compare-Object`/`Test-Path`
  的只读核对。
- 两次 Git 只读 status；源码 diff 的空白检查 `git diff --check -- dsh-ext/agent/index.ts`
  返回 0，没有执行产品代码。
- 四次 `apply_patch` 写入：产品与新测试、证据 README、README 台账校正、本 formal；
  README 的台账校正是同一新增文件的后续编辑。
- `C44` 在 formal 落盘后只做 `Get-Item`/`Get-FileHash`，然后停止。

非零事件均已原样记入 README：

1. `C03` 普通 Git status 返回 1，原因是既有子模块工作树权限拒绝。
2. `C04` 组合 `Get-Item` 返回 1，因为引用了一个不存在的旧测试文件名；同命令仍输出三个
   实际目标的元数据，没有写入。
3. `C34`、`C41` 两次误填 `shell=bash`，均返回 `Bash/E_ACCESSDENIED`；没有 bash/PowerShell
   命令内容实际启动或执行，随后用显式原生 `pwsh.exe` 重做成功。
4. 两个工具调用在参数层因重复字段被拒，未启动命令、shell 或写入。

Runtime 执行次数为 **0**：没有运行 Node、Python、TSX、parser、AST/import、check、
compile、test、build、prepare、HTTP、model、GUI、SSH、消费者、finite、admission 或真实任务。
没有读取环境变量、Key、密码、provider credential、DPAPI 或 SSH 凭据。

## ROOT 后续

1. 运行新的聚焦测试，并核对它确实从当前 Host 目录得到三项 ID。
2. 运行受影响的既有 `contract-review`/`doc-revise` 问题门测试和必要的 finite/type 验证。
3. 在授权范围内做一次真实 `general-drafting` 复查，确认首次草稿保存前出现一次完整
   `ask_user_question`，未答齐时 Core 草稿写入为 0。
4. 由 ROOT 决定后续 private build/data-only build config；本次没有 build/prepare，也没有编写
   新 build config。

遗留：作者没有测试结果，因此本交回件只证明有界源码与测试作者交付和冻结边界，不证明测试绿灯、
业务质量或打包就绪。
