# A 线交回：T18 QuestionGate 合同审查工作流输入

## 结论

已完成执行令允许的有界输入准备，状态为 `AUTHORED_NOT_RUN`。四个新增文件均在工作区内，Git 仍只读；未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

发现一项必须先由 root 裁定的硬冲突：新固定输入已 pin 到新编译包，但冻结 consumer 第 1030、1031 行仍直接 import 旧 T31 编译包。旧 agent/host 均不含 `skillQuestions`；仅增加命令允许的闭包后，实际对象仍是旧 `LawbenchRemote`。执行令同时要求使用新编译对象和保持其余 consumer 字节不变，二者不能同时满足，因此未擅自改 import。

## 新增路径与身份

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 103441 | `21f529a0c9e15c7b1f53347bc2885bf6c8b1273617a0963bafcc56a06de4fd5c` |
| `b-service.py` | 30607 | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `fixed-inputs.json` | 17162 | `3594dc7b9b7bdc48c9bfcf826b6b0deafe34cef143a999cf03de24d2ffcf06ab` |
| `README.md` | 5035 | `3d00ba307bf626755fa9c808f7c9d15cce2322e5bdf01443de4e3af956285ce3` |

目标目录内恰有上述四个文件，没有 run 目录。

## 实际改动

- consumer 从冻结 `005889a8…` 复制后只有两个预期变化：加入延迟闭包 `skillQuestions: (skillName: string) => remote.skillQuestions(skillName)`；把 `FIXED_INPUTS_SHA256` 从旧 `63f2da57…` 更新为实际 `3594dc7b…06ab`。逐行比较为 1 删 2 加。
- `fixed-inputs.json` 从冻结 `63f2da57…` 复制后只有 11 删 11 加：四条 `accepted-private-runtime` 的当前新编译路径、字节和 SHA，以及 `bServiceEntry.path` 指向新目录。其它字段、fixture 字节/SHA/`mtime_ns`、46 项 native 基线、346 项 B source pin、source-resource pin、runtime executable、accepted old evidence 与 JSON 布局均未改。
- 四项目前编译 pin 与磁盘逐个核对一致：agent `af533872…` / 549374；host `ca849dcf…` / 902499；package metadata `3d6bcaf2…` / 1257；manifest `af0d8cc2…` / 58199。
- `b-service.py` 与冻结入口逐字节相等，均为 30607 字节、SHA `4fef1d52…`。
- README 记录当前身份、延迟闭包顺序、冻结面、自然构建的 OS 资格边界、独立流程未运行和 import 冲突。

## 静态顺序核对

只读核对当前 Agent 源码和编译产物：`apply()` 构造 `LegalAgent` 时只保存 `skillQuestions` 回调；该回调直到 `preStep()` 的 `requiredQuestionIds()` 才执行；`AgentLoop` 与相关 setup 完成后 consumer 才继续 `remote` 工作流。新增箭头闭包本身不会在构造 `lawbenchCore` 时提前访问 `remote`。

但延迟顺序成立不等于实际能力已接上：consumer 第 1030、1031 行仍 import：

- `T31/PrivateRuntimeBuild-20261026-043910/private-output-20261027-194112/.../agent.js`
- 同旧路径 `/host.js`

只读 `rg` 在旧 agent/host 中均未找到 `skillQuestions`；新 host 存在 `LawbenchRemote.skillQuestions(skillName)`。root 若按新 pin 实跑，需要先裁定把两处 import 指向 `QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115`，或采用等价、可审计的新 agent/host 装载方式。

## 冻结与范围

协调目录三个 before 原件完成后重新核验，身份未变：

| 原件 | SHA-256 |
|---|---|
| `native-contract-workflow.mts` | `005889a8dbc5bd7689270771cbfa993ce87b71600fae312ef9a97ff73012e1d6` |
| `b-service.py` | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `fixed-inputs.json` | `63f2da57aedf9165a50e7b356224c37ca4b8918abf3ceb9e4b839ff8773b8e6d` |

`git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all` 对目标目录只显示这四个新增文件。开工前已有大量 dirty 改动原样保留，未触碰其它业务文件。

## 验证与未验证

验证仅为只读文件操作：文件集合、长度、SHA-256、逐行最小差异、固定输入摘要与 consumer 常量相等、B 入口逐字节相等、冻结原件哈希和 Git 目标范围。

本执行者没有运行 Node、Python、TypeScript parser、AST、import、自测、prepare、构建、服务、HTTP、模型、SSH、GUI、Vitest、tsc 或安装包流程。问题是否在首版草稿前出现、实际模型草稿/编辑清单、redline/OOXML、源材料保持、JSONL 重开、清理、watchdog、业务质量、完整 T18 和发布均未由本文件证明。`20 vs 2` 与阅读质量遗留不变，Packaging 仍为 **HOLD**。

## 运行器阻碍与纪律记录

- 普通只读 `git status` 因 dsh 子模块目录权限被拒；未扩权，改用 `--ignore-submodules=all` 的只读范围核对。
- 本执行者误有四次只读列目录/比较命令沿旧模板指定了 `bash`，均被运行器以 `E_ACCESSDENIED` 拒绝，未执行、未写入；后续有效命令均按令使用指定原生 `pwsh.exe`、`login=false`。
- 未读取 DPAPI、Keyring、环境凭据或用户 TTY；未启动进程、HTTP、模型或 GUI；未改沙箱、审批、ACL、锁、安全策略或 API。

## 下一步

root 先裁定旧 T31 import 与新编译 pin 的冲突。若选择改 import，应形成可审计的最小版本并相应更新本交回和 consumer 身份；之后再按完整固定输入与实际 DPAPI 匿名 stdin 运行独立工作流，不得把本轮静态输入准备计作模型、业务或发布通过。
