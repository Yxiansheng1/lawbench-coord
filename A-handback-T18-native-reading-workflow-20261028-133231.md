# A 线交回：T18 原生阅卷工作流

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 完成一次合成阅卷工作流的源码编写和静态清单固定；作者运行时为 0，未执行 Node、Python、测试、构建或模型请求。 |
| 目标是什么 | 让 root 跑通 NativeSession、SessionCommandController、AgentLoop、当前 LegalAgent/CoreClient、当前 B HTTP、Skill 和 `case_*` 工具，最终保存有真实读取覆盖和可解析出处的 Markdown 草稿。 |
| 在等什么 | 等 root 独立审计后执行一次入口；成功信号是 `run-*/report.json` 为 `PASS`，失败信号是同文件为 `FAILED` 且保留实际阻碍。 |
| 卡在哪 | 作者阶段没有阻塞。按执行令不能运行消费者，因此当前没有任何业务运行结果或验收结论。 |

## 交付

只新增以下四个文件，未改产品、SDK、配置、测试、契约、旧证据或 Git 历史。

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts` | 76652 | `078559230ca8f4e163293d0d56ac63667faa9c9b13b5e253b6ecfdc895f0eba5` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\b-service.py` | 28236 | `446b0a57559f4bc5b4a918cf91eee91f143a1995816b2172cc252769c78911d3` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json` | 14681 | `67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\README.md` | 5278 | `17747afa72596cc1ad37574c9c05aec3ccddc25fb8d916dde1701d84cbe2f9e8` |

固定清单内有 5 个非下划线夹具、45 个 A 端依赖、3 个运行时文件和 4 份已接受证据。它另引用已接受的 46 项 native 基线和 346 项当前 B source pin。消费者内嵌的清单 pin 为 `67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df`。

## 实际调用路径

入口按以下边界实现：

1. 先从匿名 stdin 读取测试 Key，之后才开启模型网络；Key 不进入环境、文件、命令行、报告或本交回件。
2. B 子进程只通过 stdin 接收随机本机 token，只监听 `127.0.0.1` 随机端口；lifespan、OCR、Retainer、转发监听关闭，所有 B 外发经拒绝 transport。
3. B 防火墙只接受本次所需路由，并要求案件、Session、原生 R、task 和五个 material id 按实际响应逐级绑定。`/core/tool` 只允许阅卷所需 `case_*` 工具。
4. 案件由当前 B CaseRegistry 打开，五份材料经当前 `/api/materials/import` 逐份复制；`_任务说明.md` 和 `要点.md` 不在清单、不导入、不进入模型。
5. `BrowserSession` 生成实际 UUID R；`SessionCommandController`、真实 AgentLoop 和已接受 LegalAgent 插件完成 Host claim、`task/begin`、`context`、工具循环和 `task/end`。
6. `case-reading-notes` 由当前 SkillRegistry、文件系统 provider 和 `skill` 工具加载，不替换成手写 Skill 提示。
7. 若模型发范围确认问题，消费者只通过生产 `user-questions/request` waterfall 作答一次；答案逐项绑定模型实际生成的 question id。问题必须逐项列出五份材料，且不得含真实案件、删除、移除或覆盖原件语义。其他问题不代答。
8. 模型只允许访问 `http://10.126.126.1:8000/v1/chat/completions`，路由、参数和预算取当前 B 与 LegalAgent 快照。
9. 成功前核对任务 `completed`、coverage 五份全读、引用检查通过、草稿非空、五份材料均有内联出处，并逐条调用 `/api/source` 确认原文未变。
10. 结束时先取消或等待实际 AgentLoop 空闲，再停 B HTTP、关闭 Session/Context/日志，另起 Context 重开 JSONL 并比对事件。

## 硬门

`PASS` 必须同时满足：

- 导入清单恰为五份声明材料，原件区无第六个文件，副本字节与源字节一致。
- `skill`、`ask_user_question`、`case_list_materials`、`case_read_material`、`case_save_draft` 均由实际工具事件产生。
- 原生 turn 有 `turn/start`、携带实际 R 的 `user/message`、`assistant/message` 和 `completed` 的 `turn/end`。
- 请求头是同一 Session 权威前缀中的 `request/header`，provider 为 `lawfirm`，模型为 `qwen38-27b`，输出上限与当前任务一致。
- `reads.json` 覆盖五个 material id，记录版本等于导入原件 SHA-256，范围合法。
- 最新草稿保留当事人、80,000 元、20,000 元和借款日期，五份材料均有内联出处，且没有胜诉率或诉讼策略判断。
- 每条程序解析出的出处经 `/api/source` 返回非空原文，`source_changed=false`。
- B 协议拒绝数、外发尝试数、凭证读取数和防火墙违规数均为 0；模型至少有一次 HTTP 200 POST。
- 固定清单、46 项 native 基线和 346 项 B source pin 在运行前后一致；JSONL 重开事件等于活跃快照。

任一门不满足即写 `FAILED`。消费者不会补造模型回复、请求头、序号、R、事件、工具调用或草稿。

## 依据与验证

作者阶段执行的静态检查：

- 固定清单 JSON 可读；5 个夹具、45 个依赖、3 个运行时、4 份接受证据和 B 入口的字节与 SHA-256 全部匹配，`BAD=0`。
- 清单 SHA-256 为 `67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df`，与消费者常量一致，`PIN_MATCH=True`。
- 346 项 B source pin 的路径、字节和 SHA-256 全部匹配，`BAD=0`。
- 已接受 native 基线的 46 项输入字节和 SHA-256 全部匹配，`BAD=0`。
- 可执行源码和固定清单中没有 `_任务说明.md`、`要点.md`、expected answer、ground truth 或 L0 注入。
- 证据目录当前只有上述四个文件；`run-*` 数量为 0，`__pycache__` 数量为 0。
- 入口源码没有 Node/Python 运行记录；模型 URL 只有已授权的 `10.126.126.1:8000`，本机 URL 只有 `127.0.0.1`。

尚未执行：TypeScript 类型检查、Python 语法解析、Node/Python 启动、HTTP、模型、工具、JSONL 重开和业务验收。本轮没有可声称的运行绿灯。

## Git 与 dirty 保全

- 工作目录：`D:\Lawbeach\lawbench-A`
- 分支：`line-A`
- HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 当前主仓 dirty 条目：2132；只读状态快照 SHA-256：`bf4a007153ae816222497cc4eaa81ae5973ab218c12dd48be662c7a33ac3657a`
- 本目录相关 Git 状态只有四个 `??` 新文件。
- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 未改索引锁、ACL、审批或沙箱。

普通 `git status` 因受限子模块 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 报权限拒绝；按执行令改用 `--ignore-submodules=all` 读取主仓状态，没有尝试修复。

## 实际命令与写面

以下按首次出现列出实质命令；同一文件的不同 `Get-Content` 行段分别属于只读审读。运行环境均为 Windows PowerShell；未启动 Bash、Node、Python、tsx、测试、构建或安装。

1. 读取正式执行令：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-native-reading-workflow-order-20261028-133231.md' -Raw`。
2. 读取精确输入：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18NativeReadingInput-20261028-133231\inputs.json' -Raw`。
3. 读取 `lawbench-关键事实索引-20260928.md`、`PROJECT-PROFILE.md` 和 B 工单集；用 `Select-String` 抽取 T18，再按 `## T18` 到 `## T19` 读取完整卡片。
4. 执行 `git -c submodule.recurse=false status --short --untracked-files=all`、`git rev-parse --show-toplevel`、`git rev-parse HEAD`、`git branch --show-current`。`status` 因子模块目录权限失败；其余读出 `D:\Lawbeach\lawbench-A`、`a23271a`、`line-A`。
5. 执行 `git -c submodule.recurse=false status --short --untracked-files=all --ignore-submodules=all`；只读确认既存大量 dirty 和超长路径警告。
6. 用 `Get-ChildItem`、`Test-Path`、`Get-Item`、`Get-FileHash -Algorithm SHA256` 核对目标目录、T31 基线、`fixed-inputs.json`、guard 入口和两份已接受报告。
7. 用 `Get-Content -Raw` 读取 T31 `native-real-conversation.mts`、其 `fixed-inputs.json`、T31 guard `entry.py`、两份已接受 JSON，以及 T32 invalid-scope finite fixture。
8. 用 `rg`、`Select-String` 定位 `LegalAgent`、`CoreClient`、`SessionCommandController`、`ApiSessionAgentController`、Skill provider、`tool-skill`、`ask_user_question`、B CaseRegistry、材料导入、任务、覆盖和出处接口。
9. 用分段 `Get-Content` 读取 native 基线第 0–399、600–1099、1100–1399 行；读取 T32 fixture 第 320–620 行；读取 SkillRegistry、文件系统 Skill provider、`tool-skill`、user-questions、ask-user 和 B task/context/drafts/logs 的关键段。
10. 用 `Get-Content -Raw` 读取五份非下划线夹具；只读取 `_任务说明.md` 的律师原句，未读取 `要点.md`。
11. 用 `Get-Command python` 和 `Get-Item`、`Get-FileHash` 核对 Python、Node、tsx、已接受 native 文件和 fixture 的字节与 SHA-256。
12. 用 PowerShell 逐项核对 B source-pins JSON 的 346 个文件：`COUNT=346`、`BAD=0`。
13. 用 PowerShell 逐项核对已接受 native `fixed-inputs.json` 的 46 个文件：`COUNT=46`、`BAD=0`。
14. 用 `New-Item -ItemType Directory` 创建唯一新目录 `docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231`。
15. 用 `apply_patch` 新增并修改 `b-service.py`、`native-reading-workflow.mts`、`fixed-inputs.json` 和 `README.md`。
16. 用 `Get-FileHash` 计算并回填入口、清单和消费者 pin；最终静态汇总为 `FIXTURES=5`、`DEPENDENCIES=45`、`RUNTIME=3`、`ACCEPTED=4`、`BAD=0`、`PIN_MATCH=True`。
17. 用 `rg` 扫描 `PENDING`、TODO、伪网络记录、测试答案文件名、外部 URL、删除/Git 写命令和凭证环境读取。
18. 用 `git status --short --ignore-submodules=all -- docs/plan/evidence/T18/NativeReadingWorkflow-20261028-133231` 确认只新增四个文件；用 `git status --porcelain` 统计主仓 dirty 条目及快照哈希。
19. 用 `Get-ChildItem` 确认目标目录没有 `run-*` 和 `__pycache__`，并计算四个交付文件的最终字节与 SHA-256。
20. 写入后再用 `Get-Content` 读取 `native-reading-workflow.mts` 第 940–1135、1410–1946 行，以及 `b-service.py` 第 0–380、380–738 行，人工检查调用顺序、范围绑定和收尾。
21. 用 `rg -n "fetch\\(|http://|https://|spawn\\(|writeFile\\(|write_json_exclusive|flag: 'wx'"` 扫描两个入口的网络和写面。
22. 用 `rg` 扫描 README 和本交回件的文风黑名单，修正 2 处后用同一模式复扫为 0 命中。
23. 用 PowerShell 对固定清单的 58 行执行最终字节/SHA-256 核对，并读取消费者常量比对清单 SHA-256；最终为 `ROWS=58`、`BAD=0`、`PIN_MATCH=True`。
24. 用 `Get-FileHash` 生成最终四文件哈希，用 `Get-Item` 读取字节数；最后再次运行限定路径的只读 `git status`，输出只有四个 `??`。

误用 shell 的记录：

- 8 次误把 `exec_command` 的 `shell` 写成 Bash；全部在命令执行前被 ACL 或 MXC 拒绝，没有执行代码或写文件。
- 若干次使用了相对的 `pwsh.exe` 而不是指定绝对路径；这些调用只做 `Get-Content`、`Select-String` 或 `rg` 只读审读，没有运行消费者、产品或测试。
- 一次用于生成源文件哈希的 PowerShell 表达式有语法错误，未执行文件操作；随后重新读取并修正。
- 若干次 `rg` 因没有命中而返回 1，包括接口名猜错和测试答案文件扫描；空输出是预期结果，没有改变文件。
- 首个普通 `git status` 的内部子模块读取报权限拒绝；命令本身继续读出 HEAD 和分支，后续按要求使用 `--ignore-submodules=all`。

这些失误违反执行令的“每次均用指定绝对 PowerShell”要求，现如实记录。没有通过改沙箱、审批、ACL、锁或重新安装 Bash 绕过。

写面只有：`New-Item` 创建新证据目录；`apply_patch` 新增和修订上述四个证据文件；`apply_patch` 新增本交回件。没有其他文件写入，没有 Git 写入。

## 静态 API 与限制

消费者依赖的生产接口为 `SessionCommandController.create/prompt/cancel`、原生 Session 事件与 `request/header`、`AgentLoop`、LegalAgent 的 `task/begin`、`context`、`tool`、`progress`、`task/end`、B 的 case open/import/list、request scope、task create/tasks list/source、Skill tool 和 user-questions waterfall。主要契约事实已逐字对照 B 的 `task_create`、`materials_import`、`materials_list`、`tasks_list`、`source`、`files/task`、`files/result`、`files/reads` 和 `common.schema.json`。

静态限制：

- 没有类型检查或解释器检查，不能声称源码可编译。
- 没有实际观察模型是否调用 `skill`、是否只读五份材料、是否保存成功；这些由 root 一次运行后的真实事件判定。
- 当前 B 的 Material list 不返回 `sha256`，消费者已改为读取实际材料索引路径上的副本并逐字节核对。
- 模型可能不按 Skill 提问或开工具循环；入口会如实失败，不会自动重跑第二个场景。
- `case-reading-notes` 要求模型先作范围确认；若问题不逐项包含五份材料，自动答复不会发生，工作流将按未处理问题失败。

本轮没有 GUI、安装包、全 T18 18 个 Skill、真实案卷、业务质量或项目完成度声称。Packaging 仍为 HOLD，T18 与全项目仍未验收。

## 下一步建议

root 先独立审计四个新文件及固定清单，再执行一次 README 中给出的入口。完成后读取 `run-*/report.json`、案件内 `task.json`、`result.json`、`reads.json`、Markdown 草稿和 `/api/source` 记录。只有实际运行同时满足所有硬门才进入 T18 支线继续验收；否则按 report 的真实失败项处理，不重跑场景、不补造结果。

删减轮：读者 3 / 槽位 2 / 半句 4 / 重复 2 / 过程 1 / 黑名单 2

Response ID：当前 runner 未暴露  
Response log path：当前 Codex 会话记录
