# A handback — T31 GUI 前缀边界

状态：`BOUNDED_CHANGE_COMPLETE / AUTHOR_RUNTIME_ZERO / ROOT_GUI_REQUIRED`

## 交付

唯一源码改动为 `_t31_final_target_observation` 的父事件比较：

```python
# before
if child_events[:inherited_count] != parent_events:

# after
if child_events[:inherited_count] != parent_events[:inherited_count]:
```

生产 `buildForkSeed` 用 `events.slice(0, boundary + 1)` 构造显式 `atSeq` 的闭区间
继承前缀；父日志可在该边界后继续增长，所以只比较精确选中前缀是正确合同。继承数
上下界、子事件数、唯一 inherited marker、原始事件逐项相等、completed
`turn/end`、普通 `session/end-seed` 省略完成前缀、marker 时间/头字段/来源、父
稳定性、无新轮次、UUID、路径、缓存、文件类型、reparse、案件根与清理检查均未改。

## 最终文件和 pin

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 88,641 | `9cad004ad8a7f0cd4ba9b76bfcf4e38762ea1b0e0c90c891cf3f3307dbda953c` |
| `start.ps1` | 74,172 | `e5ea6ba83220536a4009f613df66c1e213c5b58d281b1413d339014628a83172` |
| `prepare.ps1` | 13,514 | `5828d34c7734fbf45cf1e59201e88da826b14e0f75a50503e7e615e8764dc2ee` |
| `stop.ps1` | 7,149 | `542474f756d86b82dec04e0b4f2f3abac8f97be7b3e413d62ef76221d2e377d1` |
| `README.md` | 11,268 | `6c0e7b7c5028d4be3e9bda45ae6732cf535cf3910a0fd3dc4545961089df206b` |
| `root-prefix-boundary-20261028-125751.md` | 7,441 | `a3f95456358b09cc36d81489af6bee724d06106c6758f501014e9f2496f56c4a` |

旧 `entry.py` 为 `88623` 字节 /
`bb838f64b961949a0b84d435f182926985b4bee76c1c3b2ec0c861018556e9e2`。旧
`start.ps1` 为 `74172` 字节 /
`bb95acbe67d8919f304a819655f6829ac568906ff832555c529a689e4a02f9cc`。

`start.ps1` 中只同步了两个等长固定 pin：

```powershell
$NativeEntryBytes = 88641
$NativeEntrySha256 = '9cad004ad8a7f0cd4ba9b76bfcf4e38762ea1b0e0c90c891cf3f3307dbda953c'
```

## 反向逐字节证明

- `entry.py` 长度恰为旧文件加 18 字节。第一个差异在字节偏移 `48080`；新插入的
  18 字节精确为 UTF-8 `[:inherited_count]`。旧文件其前 48,080 字节与新文件同区
  相等；旧文件自偏移 `48080` 起的 40,543 字节与新文件自偏移 `48098` 起的同长
  后缀逐字节相等。故除该插入外没有旧字节变化。
- `start.ps1` 在新旧同长文件的内存旧副本上只做两处等长替换：偏移 `5651` 的
  `88623 -> 88641`，偏移 `5699` 的旧 SHA 字面量 -> 新 SHA 字面量。重建结果与
  新文件全文逐字节相等，故没有第三个变化。
- `prepare.ps1`、`stop.ps1`、`README.md` 均与协调目录基线副本全文逐字节相等。
- 脚本 pin 与实际 `entry.py` 长度、SHA 一致性检查为 `True`。

## 生产输入 pin

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `producer-commands.ts` | 31,548 | `c3ea5af81f21212888364bbd169c9d3d19c93f8720716dfc44ba32c1d164bb2c` |
| `producer-fork.ts` | 1,397 | `de80ecbf0e6a7961c096a2d7f0304bc6f6c83f897268304e28352357da06bfb0` |

两份生产输入只读，未修改。

## 实际命令与非零

所有 Shell 调用都显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，
`login=false`，cwd 为 `D:\Lawbeach\lawbench-A`。逐项命令和退出码已完整记录在
证据说明的“实际命令与退出码”一节；序号共 20 项，最终摘要计算又追加一项只读
`Get-FileHash`，退出 0。主要命令为：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T31-GUI-prefix-boundary-order-20261028-125751.md' -Raw -Encoding utf8
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426' -Force
git -c submodule.recurse=false status --short --untracked-files=all
Get-FileHash -Algorithm SHA256 -LiteralPath <target files>
rg -n -C 12 --fixed-strings 'child_events[:inherited_count] != parent_events' <entry.py>
rg -n -C 3 --fixed-strings -e '88623' -e '<old entry sha>' <start.ps1>
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T31GuiPrefixBoundary-20261028-125751' -Force
git -c submodule.recurse=false status --short --untracked-files=all --ignore-submodules=all
Get-Content -LiteralPath <producer-fork.ts> -Raw -Encoding utf8
rg -n -C 18 --fixed-strings -e 'fork(' -e 'atSeq' -e 'boundary' -e 'buildForkSeed' <producer-commands.ts>
Get-Content -LiteralPath <GenuineBranchGui README.md> -Raw -Encoding utf8
Get-Content -LiteralPath <A-dirty-before.txt> -Raw -Encoding utf8
Test-Path -LiteralPath <new note and handback paths>
Get-FileHash -Algorithm SHA256 -LiteralPath <coordinator source files>
<corrected Get-FileHash loop over seven coordinator inputs>
<read-only in-memory byte inverse-proof command>
<final Get-FileHash read-only summary over six output files>
```

两个非零均为诊断性只读命：

1. 第一次 `git status` 退出 1：
   `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。
   未修权限、ACL、沙箱、审批或锁；随后按令仅用 `--ignore-submodules=all` 只读重试。
2. 一次中间 `Get-FileHash` 汇总命令因 PowerShell 写成空管道元素退出 1：
   `ParserError: ... | An empty pipe element is not allowed.` 未写文件；修正后的同义
   只读命令退出 0。

`git status --ignore-submodules=all` 对既有超长路径运行目录有 warning，退出 0；
未据此推断任何测试或 GUI 结论。

## 写入面与保全

仅写：

1. `docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\entry.py`
2. `docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\start.ps1`
3. `docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\root-prefix-boundary-20261028-125751.md`
4. `D:\Lawbeach\lawbench-coord\A-handback-T31-GUI-prefix-boundary-20261028-125751.md`

未写 prepare、stop、README、旧 formal、B/SDK/guards/compiled/legacy/E50、产品、
runtime、config、fixture、messages 或其他工作区。既有 dirty 未清理。Git 严格
只读，未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、
`push`、暂存、改锁或扩权。

## 未执行

作者 runtime 与动作数均为 0：未执行 Node、Python、TSX、import、源码 parser、
AST、tsc、测试、prepare、admit、start、stop、probe、GUI、HTTP、模型、Key、SSH、
build、selftest 或 600 秒窗口；未创建 fork 用例、fake event、header、history、
`R`、消息、Send、model 或 delete。

本交回只覆盖源码修正、pin 与静态字节证明。普通三轮父会话的实际 GUI 分支、消息
尾部动作、空会话菜单结果及父稳定性、0 Send/model/delete 仍必须由根在独立全新
run 中验证。`GATE1=false`，`WHOLE_T31=false`，`PROJECT_INCOMPLETE=true`，
`PACKAGING=HOLD`。
