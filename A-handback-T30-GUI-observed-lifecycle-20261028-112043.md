# T30 GUI 实际生命周期观察口径交回

状态：`AUTHOR_RUNTIME_ZERO / STATIC_CHANGED_NOT_RUN / ROOT_FULL_AUDIT_AND_FRESH_GUI_REQUIRED`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 仅修正最终观察器的两个实际生命周期遗漏：普通恢复标记和至多一个原生空白会话；同步入口身份与 README，并落证据说明。证据见下方文件。 |
| 目标是什么 | 让根侧完整审计后，以全新 GUI 运行独立验证；本次不是 GUI、删除、回收站、USB、整 T30 或打包验收。 |
| 在等什么 | 等根侧完成累计源码/差异/原始证据复核；收到复核结论后，根侧启动新的 fresh prepare、admit 和 GUI 运行。 |
| 卡在哪 | 无需要本线处理的阻塞。根级 `git status` 仍受共享 `dsh` submodule 权限拒绝；按令未修权限、锁、审批或 ACL。 |

## 最小差异

修改前输入目录：
`D:\Lawbeach\lawbench-coord\T30GuiObservedLifecycle-20261028-112043`

| 文件 | 输入 bytes / SHA-256 | 当前 bytes / SHA-256 |
| --- | --- | --- |
| `entry.py` | 48,547 / `709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87` | 61,841 / `9afc42e1e851948b8ff4d06fe405718303375e6ab20d5001c2b438ddfbd4f360` |
| `start.ps1` | 74,157 / `4566466fd7057439ca1cf2b2505cc4432283df842709d4c199f236febb1a59ba` | 74,157 / `86b099040f38f8ab5c80502efd4fbeafaf9ac9c3c6437629a7e08d0dd7dbee27` |
| `README.md` | 11,473 / `446418ca7a16c77a72585c250f92488926ec98b8d938fe2d87f568fa599bf957` | 12,142 / `474ba33fc263825aa31a2ff7b43ddc974fe1d7cc650866c8657acb8e6f2433b5` |

`entry.py` 的只读 no-index diff 只有 `_final_target_observation` 区域。保留的硬门包括：

- 源案件固定五文件、source-run report、准入前后父/子日志身份不变。
- 父日志必须固定 12,059 bytes / SHA；子日志只允许固定原文、固定原文加一条唯一
  普通恢复标记，或整个子会话目录缺席。
- 恢复标记必须是生产普通非 seeded 路径的
  `session/end-seed`，`seq=37`、空 `data`、整数时间戳位于本 run 窗，且前后没有
  其他字节或事件。
- 原生空白会话最多一个，只允许在案根 `projectKey` 得到的独立项目下；必须是规范
  UUIDv4、目录名等于 header id、v4 `cwd` 精确、`isSeeded:false`、
  `delegationDepth:0`、`agentPreset:"lawbench"`、运行期 `createdAt`、
  header-only；最多带同名投影缓存。
- reparse、普通文件、owned path、完整文件/目录清单、SQLite `mode=ro` 与
  `query_only`、case ID/schema、guarded HTTP、setup/cleanup/600 秒、删除真人确认
  和 OS 回收站独立取证均未放宽。

子日志发生恢复追加时写 `PRESENT_NATIVE_RESUME_MARKER_APPENDED` 和
`targetLogsUnchanged:false`。子目录缺席仍写
`CHILD_DIRECTORY_ABSENT_PENDING_ROOT_GUI_AND_OS_RECYCLE_PROOF` 与
`targetLogsUnchanged:false`。原生空白会话和缓存均标 `acceptanceProof:false`。

`start.ps1` 只改两个入口身份字面量：

```text
$NativeEntryBytes = 61841
$NativeEntrySha256 = '9afc42e1e851948b8ff4d06fe405718303375e6ab20d5001c2b438ddfbd4f360'
```

`README.md` 只改最终观察说明，纳入上述三种子日志状态和一个原生空白会话，仍将
空白会话、缓存、SQLite 辅助文件变化标为非验收观察。

新增证据：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-observed-lifecycle-20261028-112043.md` | 9,419 | `25a5bd40e9262513bbd5e75e7736d5eef8561b59f217519de577d6aeed0e4104` |

`prepare.ps1` 13,520 bytes 与 `stop.ps1` 7,145 bytes 均和输入快照 SHA 相同。
没有改源案件、prepared/admission、运行产物、旧证据、runtime 25 文件、18 legacy、
E50、scripts、guard、HTTP、测试、product、config 或其他正式材料。

## 依据与验证

- 实际 GUI 运行：
  `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\runs\T30-genuine-session-gui-20261028-110751`
  的 `root-cancel-observation.json` 记录两行、四回合、取消后 dialog gone、无实际删除。
- 真实最终库存：协调目录 `actual-target-inventory.json`，6 个文件；父 12,059 bytes
  固定，子 16,303 bytes，原生空白会话 319 bytes，两个缓存。
- 真实失败元数据：`actual-final-metadata.json` 的
  `failureCode:"final_target_inventory"`；控制进程、端口与 cleanup 证据另见
  `root-controlled-OS-port-after-stop.json`。
- 子日志静态核对：16,235-byte 原文是 16,303-byte 当前文件的精确前缀；追加恰为
  68 bytes：
  `{"type":"session/end-seed","seq":37,"time":1793156966828,"data":{}}` 加换行。
- 原生会话静态核对：319 bytes，一个换行，v4 header-only，ID
  `session-006180fb-b5d5-4fa2-9680-472f1214c391`，cwd 精确为本次案根，
  `isSeeded:false`、`delegationDepth:0`、`agentPreset:"lawbench"`，创建时间
  晚于 `started.json`。
- 生产契约：`packages\core\session\src\index.ts:620-621` 恢复普通 seed 时追加
  普通结束标记；`packages\session\session-persistence-jsonl\src\format.ts:219-244`
  定义项目目录编码；`...\src\index.ts:306-332` 定义 header-only 的惰性物理写入。
- 入口身份：当前 `entry.py` 61,841 bytes /
  `9afc42e…f360`，与 `start.ps1` 两个 pin 精确一致。
- 文本格式：修改与新增的四个文件均为 UTF-8 无 BOM、纯 LF。
- 只读 diff：`entry.py` 只命中目标函数；`start.ps1` 只命中两个入口字面量；
  `README.md` 只命中最终观察段。

## 完整命令台账

所有 shell 调用的工作目录均为 `D:\Lawbeach\lawbench-A`，`login=false`。成功启动者
均使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`。
标为“Bash 拒绝”的调用误填了 `shell=bash`，managed MXC 在命令启动前返回
`Bash/E_ACCESS_DENIED`；没有 Bash 进程、读取、写入或外部动作。

| ID | 退出 | 实际命令/内容 |
| --- | ---: | --- |
| C01 | 0 | `Get-Content -Raw` 完整执行令。 |
| C02 | 1 | `git status --short --untracked-files=all`；共享 `dsh` submodule worktree 权限拒绝。 |
| C03 | 0 | `rg --files` 并按 entry/start/README/session/store/factory/projection/GenuineSessionGui 过滤。 |
| C04 | 0 | `Get-ChildItem -Force -Recurse` 协调输入目录。 |
| C05 | 0 | `Get-Content -Raw A-dirty-before.txt`。 |
| C06 | 0 | `Get-Content -Raw entry.py`。 |
| C07 | 0 | `Get-Content -Raw start.ps1`。 |
| C08 | 0 | `Get-Content -Raw README.md`。 |
| C09 | 1 | 读取 `entry.py` 目标函数的 `rg`；Bash 拒绝，未执行。 |
| C10 | 1 | 搜索 session restore/factory/store 的 `rg`；Bash 拒绝，未执行。 |
| C11 | 1 | 读取 target inventory/resume marker/final metadata 的 PowerShell；Bash 拒绝，未执行。 |
| C12 | 1 | 猜到不存在的 `observed-session-...v4.jsonl` 文件名；路径不存在，未写。 |
| C13 | 0 | `rg -A/-B` 读取 `_final_target_observation`。 |
| C14 | 0 | `rg` 搜索 session lifecycle/seed 源码。 |
| C15 | 0 | 读取 `actual-target-inventory.json`、`root-open-resume-marker.json`、`actual-final-metadata.json`。 |
| C16 | 0 | 列出协调输入实际文件名。 |
| C17 | 0 | 读取 `observed-session-006180fb...jsonl`。 |
| C18 | 1 | `rg session/end-seed`；Bash 拒绝，未执行。 |
| C19 | 0 | 列出 `dsh\packages\core\session\src` 文件。 |
| C20 | 1 | `rg isSeeded/delegationDepth/...`；Bash 拒绝，未执行。 |
| C21 | 0 | 在 `dsh/packages`、`dsh/apps` 搜索 `session/end-seed`。 |
| C22 | 0 | 在 Session、SessionController、desktop 源码搜索创建/空白/seed 字段。 |
| C23 | 0 | 读取 core Session `index.ts` 560–679。 |
| C24 | 0 | 列出实际 run case 的全部目录。 |
| C25 | 1 | 读取 SessionController `commands.ts`；Bash 拒绝，未执行。 |
| C26 | 0 | `rg` 搜索 JSONL storage 的 create/open/restore/header。 |
| C27 | 0 | `rg` 搜索 SessionController 创建与投影入口。 |
| C28 | 0 | `Select-String` 读取 start 的入口 bytes/SHA pin。 |
| C29 | 0 | 读取 `commands.ts` 90–319。 |
| C30 | 0 | 读取 JSONL `index.ts` 300–419。 |
| C31 | 0 | 读取 JSONL `format.ts` 110–199。 |
| C32 | 0 | 读取 SessionController `agent.ts` 340–569。 |
| C33 | 0 | 读取 SessionController `index.ts` 130–209。 |
| C34 | 1 | 读取 SessionController `list.ts`；Bash 拒绝，未执行。 |
| C35 | 0 | 列出实际 case 目录树。 |
| C36 | 0 | 读取 `commands.ts` 215–304。 |
| C37 | 0 | 读取 SessionStore prepare 1010–1099。 |
| C38 | 0 | 读取 `agent.ts` 450–529。 |
| C39 | 0 | 读取 `actual-admission.json`。 |
| C40 | 0 | 回读修改后的 `_final_target_observation`。 |
| C41 | 0 | 首次读取 entry bytes/SHA。 |
| C42 | 1 | `git diff --no-index` entry 输入/当前；发现预期差异。 |
| C43 | 0 | PowerShell 逐字节核对子日志原文前缀、追加长度与 UTF-8。 |
| C44 | 0 | PowerShell 读取原生会话 header、换行和 run 时间边界。 |
| C45 | 0 | 重新读取 entry bytes/SHA。 |
| C46 | 0 | `Select-String` README 最终观察段。 |
| C47 | 0 | 读取旧协调 `交付说明.md`。 |
| C48 | 0 | 读取 `root-final-observer-20261028-103604.md`。 |
| C49 | 0 | 读取 `root-cancel-observation.json` 与 `root-controlled-OS-port-after-stop.json`。 |
| C50 | 0 | 读取 `root-compression-20261028-110209.md`。 |
| C51 | 1 | 组合读取三文件身份；PowerShell 管道语法错误，未写。 |
| C52 | 0 | `Select-String` README 中旧 pin/entry 字样。 |
| C53 | 0 | `Select-String` start 入口 pin。 |
| C54 | 0 | 修正为变量后读取 entry/start/README 最终身份。 |
| C55 | 0 | 读取 `formal-report` skill。 |
| C56 | 0 | 读取 `cn-prose` skill。 |
| C57 | 1 | prepare/stop 快照比较；PowerShell `foreach` 直接接管道语法错误，未写。 |
| C58 | 1 | `git diff --no-index` start 输入/当前；仅两个入口字面量，预期退出 1。 |
| C59 | 1 | `git diff --no-index` README 输入/当前；仅最终观察段，预期退出 1。 |
| C60 | 0 | 四个交付文件 bytes、BOM、CR、LF 检查。 |
| C61 | 0 | 修正为变量后复核 prepare/stop 文件大小与 SHA 相等。 |
| C62 | 0 | PowerShell 重现生产 projectKey；确认 case-derived 项目存在、两个项目、两个缓存。 |
| C63 | 0 | 读取输入/当前差异身份；输入侧三行完整，当前侧表宽截断。 |
| C64 | 0 | 检查证据文件含 runtime zero、GUI_PASS=false、恢复状态且无 GUI_PASS=true。 |
| C65 | 0 | 动态核对 entry bytes/SHA 与 start 两个 pin。 |
| C66 | 0 | 输出 entry/start/README/证据文件最终 bytes/SHA。 |
| C67 | 0 | 回读本交回件 bytes/SHA、BOM/CR，并检查 runtime zero、完整台账、写面与 GUI_PASS=false。 |
| C68 | 0 | `rg` 回读 entry 中的目录/缓存/恢复/header/SQLite 硬门。 |
| C69 | 0 | 回算当前父、子会话日志 bytes/SHA。 |
| C70 | 0 | 回读本交回件前 24 行。 |

成功 shell 调用均只读；所有写操作均来自 `apply_patch`。非零共 14 次：

- C02：既存共享 submodule 权限阻碍，未修。
- C09、C10、C11、C18、C20、C25、C34：7 次误填 Bash，运行器在启动前拒绝。
- C12：推测文件名不存在。
- C42、C58、C59：只读 diff 发现预期差异。
- C51、C57：两次 PowerShell 复合管道语法错误，未写。

这些非零均未启动产品、服务、模型、HTTP、GUI、测试或外部程序，也未改权限、审批、
ACL、锁、writer 状态或 Git。

## 写面

| 写面 | 内容 |
| --- | --- |
| W1 | `entry.py`：最终观察器生命周期分支初改。 |
| W2 | `entry.py`：修正项目目录清单的裸目录名比较。 |
| W3 | `entry.py`：移除一个未使用局部变量。 |
| W4 | `start.ps1`：两个 entry bytes/SHA pin。 |
| W5 | `README.md`：最终观察说明。 |
| W6 | 新增本 evidence 目录生命周期记录。 |
| W7 | 新增本交回件。 |
| W8 | 本交回件补记 W7 后的 C67–C70 最终回读。 |

没有直接 shell 写文件。没有 Git `add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout`、`push`、暂存、修锁或扩权。Git 写入不在本运行器授权内，
因此没有 commit SHA；index/权限问题不是交付阻碍。

## 未做与降级

- 作者运行时为零：没有执行 Python、Node、parser、AST、测试、prepare、admit、
  serve、probe、HTTP、模型、Key、SSH、GUI、build、selftest、delete 或 recycle。
- 新观察器分支没有语法执行证明或运行证明；由根侧独立 cumulative review 和新的
  fresh GUI 首次实际覆盖。
- 没有实际删除、回收站证明、USB 拒删、macOS、整 T30 或打包验证。
- 没有把既有 `failureCode:"final_target_inventory"` 改写为通过，也没有修改既有
  最终元数据或运行产物。

## 下一步建议

根侧先独立复核本差异、生产 restore/store/factory 契约与既有原始观察。源码和依赖
不变时，可复用既有 GUI 生命周期证据作为观察来源，但需按根侧规则对新的观察器做
fresh GUI 验证；本次作者不自行运行。实际删除只在现场人员对真实确认框另行确认后
进入独立回收站取证门。

`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。

删减轮：读者 3 / 槽位 2 / 半句 2 / 重复 3 / 过程 1 / 黑名单 0

Response ID: `A-T30-GUI-observed-lifecycle-20261028-112043`

Response log path:
`D:\Lawbeach\lawbench-coord\A-handback-T30-GUI-observed-lifecycle-20261028-112043.md`
