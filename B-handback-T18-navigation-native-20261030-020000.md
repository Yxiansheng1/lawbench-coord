# B 交回：T18 业务导航原生场景源码

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

任务：`B-T18-navigation-native-20261030-020000`

分支：`line-B`

交付前 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`

提交 SHA：无。按本次执行令，Git 全程只读，未 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 1. 目标与出处

按正式执行令从批准基座生成一个独立的 `legal-workflow` 原生导航场景，供 root 后续执行真实 Native Session、AgentLoop、B 服务与一次模型 turn。作者只完成源码、固定清单和交回文件，没有运行产品代码。

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\NavigationNative-20261030-020000\`

正式文件：

- `native-navigation.mts`
- `b-service-navigation.py`
- `literalfixed-inputs.json`
- `README.md`

## 2. 改动清单

- `native-navigation.mts`：从 `baseline-entry.mts` 复制后改场景名、五个材料、公开任务、Skill、参数、固定输入核对和导航 no-document 断言；保留生产 setup、凭据 stdin、网络/TTY 护栏、`SessionCommandController`、AgentLoop、native JSONL、finally 与源文件不变检查。
- `b-service-navigation.py`：从 `baseline-service.py` 复制后改为五个平铺 TXT，真实 civil CaseRegistry 与生产 scanner；L0 必须来自生产 Core 的“还没有生成 wiki”卡片并列出五份材料；L1 必须空；任何 `/core/tool` 案件调用都由防火墙拒绝。
- `literalfixed-inputs.json`：以批准蓝图为基础，仅回填两个本目录源文件的 bytes/SHA；其余依赖、私有构建、运行时和输入身份保持批准值。
- `README.md`：记录场景、边界、文件身份、命令阻碍与 runtime 0 声明。

只新增上述证据目录与本文；未改产品代码、Skill、契约、测试、SDK、builder、依赖或共享证据。

## 3. 场景和机械门

- `legal-workflow` 必须由真实 Skill 工具恰好调用一次。
- 任务 `inputs=[]`、`request_scope=null`，模型只收到公开任务分隔线之前的原文。
- L0 由生产 Core 从全新案件和真实材料索引生成；没有 wiki fixture、模板卡片、伪造 UUID/R/事件/历史/任务结果或上游记录。
- 真实 turn 必须正常完成且有非空可见回答。
- 除 `skill` 外零工具调用；零询问回调、材料读取、检索、保存、编辑、归档、计算、格式转换和 Wiki 写入。
- TaskStore 中 `drafts`、`citations`、`reads` 必须为空，任务目录不得出现 `归档方案.json`。
- B 服务继续核对 `task/begin`、`context`、`progress`、`task/end`、请求范围、五个材料 ID、source pins、源文件不变、资源关闭、零外连和零凭据访问。
- 回答的导航正确性、上游材料建议、确认与缺失信息、是否虚构法律意见或出处，全部留给 root 读取实际响应与 production JSONL 后人工判读。源码未加入语义关键词、黄金正则或提示词变体。

## 4. 参数映射与固定身份

当前 Host/Agent 映射支持 Skill 声明的：

- 思考：`关闭` → `reasoningEffort: off`
- 窗口：`32K`
- `max_tokens: 4096`

没有参数不支持项。单任务仍为 32 次模型调用、48 次工具调用、45 分钟；模型和流请求边界仍为 1,200,000 ms；模型/provider 未更换。

批准输入八个 size/SHA/mtime 行均已静态核对一致。`approved-inputs.json` 为 2132 bytes，SHA-256 `e759fe53b62165faf8ab680b5d28e59b51dc2e8f4c77cbbe6094ae3871b13a20`。B 源码固定表为 53548 bytes，SHA-256 `5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`，346 行。

## 5. 文件身份与非零结果

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-navigation.mts` | 174956 | `26d31e5e4a6ff18d12e0ad95968947b3904e1e7eea7edbc381de0987b40a329f` |
| `b-service-navigation.py` | 57931 | `b6cea46229411cb8cabcee8a263b08dda9a1b3995df515bbd574ce24dbddf787` |
| `literalfixed-inputs.json` | 13079 | `b888c961645a723abf8fe5de2d2a5ccc9fb1f177ceeee6b1b167fa4e0e17f157` |

非零与阻碍：

- 普通 `git status` 退出 1：共享 worktree 的只读 `dsh` 子模块目录无权限。未改 index lock、ACL、审批或 Git 配置；随后用 `--ignore-submodules=all` 只读取得主仓状态。
- 九次工具参数误填 `bash`，均由 runner 以 `Bash/E_ACCESSDENIED` 拒绝；没有读取、执行或写入任何内容，也未启动 setup/legacy。
- 一次 PowerShell 数组管道写法触发 `ParserError`，未写入。
- 所有源码身份命令为静态文件读取/SHA；没有把 diff 的非零语义当作测试结论。

## 6. 命令、运行状态与遗留

实际 shell 均按要求使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`、managed 隔离。

只读命令：

- `Get-Content` 读取正式执行令、关键事实、T18 工单切片、`PROJECT-PROFILE.md`、`SKILL.md`、公开任务分隔线前段、批准输入、蓝图和基线源码。
- `rg` 定位基线生产 setup、场景、参数、工具、JSONL、finally 与清理路径。
- `git status --short --ignore-submodules=all`、`git rev-parse --abbrev-ref HEAD`、`git rev-parse HEAD`。
- `Get-Item`、`Get-FileHash -Algorithm SHA256` 核对批准输入、source pins 与三个本目录文件。

写入命令/操作：

- 创建唯一新目录 `NavigationNative-20261030-020000`。
- `Copy-Item` 从执行令指定的入口/服务基线及 root 蓝图复制初始三文件。
- `apply_patch` 完成场景源码、清单和 README 的有界修改。

运行状态：Node 0 次、Python 0 次、类型检查 0 次、测试 0 次、import 0 次、构建 0 次、HTTP 0 次、模型调用 0 次、GUI 0 次、进程探针 0 次。没有原生运行、模型、业务、法律、JSONL close/reopen 或 PASS 声明。

遗留：root 必须独立审看完整源码和固定清单，再执行一次实际导航 turn；需人工判断回答是否正确给出下一步、上游输入、已有/缺失事项与无 wiki 提示，以及是否避免虚构法律意见或出处。源码目前仅完成静态身份核对。
