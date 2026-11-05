# A线原生偏移绑定修正待Root复核

状态：`STATIC_BINDING_FIX_READY_NOT_COMPILED`。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正原生消费器中的两处 `SessionLogOffset` 裸调用。完整对话的回合切片改用已返回的 `production.SessionLogOffset`；请求头前缀观察器显式接收同一个 factory，并用它读取 `0` 和 `afterSeq` 边界。 |
| 目标是什么 | 消除完整模型回合在观察事件时触发 `ReferenceError` 的静态缺陷，同时保持有效请求头的既有折叠语义、四个提示、生产装配和全部运行断言不变。当前只完成有界源码修正，尚不能宣称编译、四问、fork、JSONL 或 T31 通过。 |
| 在等什么 | 等 root 独立核对本报告、新源码字节与精确差异，然后按 root 的权限执行受控的 TypeScript 符号解析或有限编译检查。该门通过后，才可由有权限方另行安排完整四问运行。 |
| 卡在哪 | 本执行者未被授权运行 Node、tsx、Python、TypeScript 编译器、解析器、导入、测试、HTTP、模型或 Key 读取。普通 Git 状态仍因既有 `dsh` 子模块工作树权限被拒；按令未修权限、ACL、锁、审批或沙箱。 |

## 缺陷与修正

root 已确认的静态问题是：`setupProduction()` 在局部作用域声明
`const SessionLogOffset = SessionModule.SessionLogOffset`，随后只通过
`ProductionSetup.SessionLogOffset` 返回值暴露。模块顶层没有同名绑定。

修正前有两处局部作用域外的裸值调用：

- `requestHeaderAtBoundary()` 的行前缀读取。
- `promptTurn()` 的回合事件切片。

无 Key 的 setup-only 路径不会进入回合，所以历史 setup 证据不能覆盖该缺陷。完整模型回合在收到响应并进入事件观察后会落到未绑定标识符，属于真实阻断，不是产品侧回归。

本次只改一个现有源码文件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts`

精确差异只有三组：

1. `requestHeaderAtBoundary()` 新增参数 `sessionLogOffset: (offset: number) => unknown`。
2. 该函数的前缀读取改为 `sessionLogOffset(0)` 与 `sessionLogOffset(afterSeq)`。
3. `promptTurn()` 的两处切片改用 `production.SessionLogOffset(...)`，并把 `production.SessionLogOffset` 作为参数传给边界观察器。

没有新增全局映射、模块导出、导入、插件、配置、测试或消费者；没有改变 `ProductionSetup` 的返回字段；没有手工转换或伪造偏移值。

## 字节与哈希

| 文件 | 状态 | 字节 | SHA-256 |
|---|---|---:|---|
| `native-real-conversation.mts` | 本次唯一修改源码 | 54,823 | `2f25e05e75d0512f2445b27d412a6d8c13a900688cf3f4d9d9ec49bddf7c6084` |
| `native-real-conversation.ts` | 历史冻结，未改 | 51,654 | `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93` |
| `fixed-inputs.json` | 冻结，未改 | 14,284 | `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522` |
| `README.md` | 冻结，未改 | 6,259 | `5e9537aef53e9471e8ff277ab261f2bb0fa9db3eea77fba04a1444746f7f514d` |

修改前 `.mts` 为 54,690 字节、SHA-256
`3c82c230a9b4f803163e48c9c7eff91f0522cdf89e13de8912324777053d9b68`。
协调目录输入副本与修改前工作区逐字节相同。修改后文件无 UTF-8 BOM，保留末尾 LF。

## 语义保留

将改后文件与协调目录中的精确输入副本做只读 `--no-index` 差异，只出现上述绑定参数、前缀读取和 `promptTurn` 接线，没有其他差异。因此：

- 同一 Session 的前缀边界、最新真实 `request/header`、锚点来源和 `current-turn` / `session-prefix` 语义不变。
- provider、model、`maxTokens=256` 校验不变。
- 四个固定合成提示、Session 与 fork 操作、R、UUID、turn 事件、完成态、工具禁用、网络 POST 判定、合成事实断言、fork 前缀、源不变和 JSONL 深比较均未改动。
- 生产 `setupProduction()`、插件装配、导入和 `ProductionSetup` 字段未改动。

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-native-offset-binding-order-20261028-020359.md`
- root 静态 finding：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\native-real-effective-header-root-amend-current.json`
- 修改前 dirty 快照：`D:\Lawbeach\lawbench-coord\NativeOffsetBindingInput-20261028-020359\A-dirty-before.stdout.txt`
- 修改前源码输入：`D:\Lawbeach\lawbench-coord\NativeOffsetBindingInput-20261028-020359\native-real-conversation.mts`
- 上一轮正式报告：`D:\Lawbeach\lawbench-coord\NativeOffsetBindingInput-20261028-020359\root-effective-header-20261028-013653.md`
- 上一轮 A 交回：`D:\Lawbeach\lawbench-coord\NativeOffsetBindingInput-20261028-020359\A-handback-native-effective-header-20261028-013653.md`
- 只读状态集合：基线 195 行，当前 195 行，集合差异 0 行。
- 只读 `rg`：绑定参数、三处 factory 使用和生产返回值位置均可静态看见；无裸调用残留在已核对区域。
- 源码只读差异退出码 1，是 `git diff --no-index` 发现预期差异的正常结果；差异内容只有本报告列出的三组。

上一轮正式报告中的原始命令账应更正为 43 个实际 `exec_command`，其中 39 个零退出、4 个非零；此前“38/34”的旧摘要不准确。本轮保留所有旧文件，不回转旧说明。

历史 no-Key setup-only 事实仍只作为 setup 证据复用，不冒充本轮完整消费器运行。本执行者没有重新执行安装、调研、setup、全量测试或四问。

## 未做与降级

- AUTHOR 运行时执行为 0：未启动 Node、tsx、Python、TypeScript 编译器、解析器、导入、测试、HTTP、模型、Key、SSH、GUI 或构建。
- 未产生新的编译、符号解析、四问、fork、JSONL 或 T31 PASS 证据。
- 普通 `git status --short --branch` 因既有子模块权限被拒；没有修复该阻碍，改用只读 `--ignore-submodules=all` 与既有基线比对。
- 命令 20 的工具 shell 路径误写为同一 runtime 下的 `native-powershell\pwsh.exe`，而非执行令指定的 `native\pwsh.exe`。该命令只读源码片段，退出 0，未用 Bash，也未改文件；其余调用均使用指定 native `pwsh.exe` 和 `login=false`。
- `keyCleared` 的旧限制、fetch allowlist 拒绝路径旧限制均未在本轮扩展，不改变其原说明。

## 实际命令与写入账

本表逐条列出本报告落盘前全部 26 个 `exec_command`。落盘后另执行命令 27 做只读终检；其返回结果以最终工具输出为准。落盘前为 23 个零退出、3 个非零；预计终检零退出后总计 27 个，其中 24 个零退出、3 个非零。

1. 零：`Get-Content -Raw 'D:\Lawbeach\lawbench-coord\A-native-offset-binding-order-20261028-020359.md'`
2. 零：`Get-ChildItem -Force 'D:\Lawbeach\lawbench-coord\NativeOffsetBindingInput-20261028-020359'`
3. 非零：`git status --short --branch`；`cannot chdir ... modules/dsh: Permission denied`。
4. 零：`Get-Item 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts'`
5. 零：`Get-FileHash ... native-real-conversation.mts -Algorithm SHA256`
6. 零：`Get-Content -Raw ...\README.md`
7. 零：`Get-Content -Raw ...\A-dirty-before.stdout.txt`
8. 零：`Get-Content -Raw ...\A-handback-native-effective-header-20261028-013653.md`
9. 零：`Get-Content -Raw ...\root-effective-header-20261028-013653.md`
10. 零：`Get-Content -Raw ...\root-mts-entry-20261028-011420.md`
11. 零：`Get-Content -Raw ...\root-dependency-pins.json`
12. 零：`Get-FileHash ...\NativeOffsetBindingInput-20261028-020359\native-real-conversation.mts -Algorithm SHA256`
13. 零：`rg -n "SessionLogOffset|setupProduction|promptTurn|snapshotEvents|requestHeaderAtBoundary|observeRequestHeader|headerObservation|createSession|production\." ...\native-real-conversation.mts`
14. 零：PowerShell 逐行读取 consumer 650..790。
15. 零：PowerShell 逐行读取 consumer 900..1045。
16. 零：PowerShell 逐行读取 consumer 1230..1345。
17. 零：PowerShell 逐行读取 consumer 1..180。
18. 非零：四个冻结文件字节与 SHA-256 的首次 PowerShell 展示；`foreach(...) |` 写法返回 `An empty pipe element is not allowed`，未改文件。
19. 零：窄修后 `rg -n "SessionLogOffset|sessionLogOffset|snapshotEvents\(" ...\native-real-conversation.mts`
20. 零：PowerShell 逐行读取窄修后 consumer 715..742 与 1296..1305；本命令误用了非指定的 native-powershell `pwsh.exe` 路径，未用 Bash。
21. 零：基线 195 行与当前 `git status --short --branch --ignore-submodules=all` 做只读集合比较；195/195，差异 0。
22. 非零：`git diff --no-index -- ...\NativeOffsetBindingInput-20261028-020359\native-real-conversation.mts ...\NativeRealConversation-20261028-000823\native-real-conversation.mts`；退出 1 为发现预期差异。
23. 零：修正 PowerShell 展示写法后读取四个冻结文件字节与 SHA-256。
24. 零：`Get-Content -Raw 'C:\Users\morel\.agents\skills\formal-report\SKILL.md'`
25. 零：`Get-Content -Raw 'C:\Users\morel\.agents\skills\cn-prose\SKILL.md'`
26. 零：只读检查改后 `.mts` 字节、UTF-8 BOM 与末尾 LF。
27. 零：报告与交回件落盘后的只读终检；核对三个本次文件、dirty 集合和正文尾行。

写入动作共 2 次 `apply_patch`：

- W1：修改唯一源码 `native-real-conversation.mts`。
- W2：一次新增本报告与协调目录交回件。

没有其他文件写入，没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push。

## 下一步建议

root 先复核新 `.mts` 的 54,823 字节、SHA-256 和精确差异，再执行其权限内的 TypeScript 符号解析或有限编译检查。该门通过后才安排完整四问；AUTHOR 在此停止，不运行消费者。

删减轮：读者 1 / 槽位 0 / 半句 2 / 重复 1 / 过程 1 / 黑名单 0

Response ID: 本次聊天未提供

Response log path: chat reply
