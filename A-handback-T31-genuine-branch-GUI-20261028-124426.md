# A 线交回：T31 真实分支 GUI 准备

时间：2026-10-28T12:56:18.320+08:00

结论：`AUTHORED_NOT_RUN / ROOT_AUDIT_AND_RUN_REQUIRED`

本线已完成有界五文件准备，并已写入协调目录交回件。没有运行 prepare、准入、
start、stop、HTTP、GUI、模型、Key、Python、Node、测试、parser、AST、编译或
构建；`authorRuntime=0`。Git 全程只读，没有 `add/commit/rebase/stash/reset/
clean/checkout/push`，没有写 index，没有处理 lock，没有联系其他会话，没有改
沙箱、审批、ACL、权限或 writer lock。

## 回交产物

目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 88,623 | `bb838f64b961949a0b84d435f182926985b4bee76c1c3b2ec0c861018556e9e2` |
| `prepare.ps1` | 13,514 | `5828d34c7734fbf45cf1e59201e88da826b14e0f75a50503e7e615e8764dc2ee` |
| `start.ps1` | 74,172 | `bb95acbe67d8919f304a819655f6829ac568906ff832555c529a689e4a02f9cc` |
| `stop.ps1` | 7,149 | `542474f756d86b82dec04e0b4f2f3abac8f97be7b3e413d62ef76221d2e377d1` |
| `README.md` | 11,268 | `6c0e7b7c5028d4be3e9bda45ae6732cf535cf3910a0fd3dc4545961089df206b` |

`start.ps1` 内的 native entry bytes/hash 已与 `entry.py` 完全一致。目录恰为这
五个普通文件，没有 `runs`、截图、日志、模型输出、`.pyc`、临时文件或其他产物。

## 文件来源与差异

四件运行文件先从以下已审 T30 文件逐字节复制：

- `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\entry.py`
- `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\prepare.ps1`
- `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\start.ps1`
- `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\stop.ps1`

复制前哈希分别与交付蓝本一致：

- entry `9afc42e1e851948b8ff4d06fe405718303375e6ab20d5001c2b438ddfbd4f360`
- prepare `285e5dec942a50a42b277f9d1cf43f690b7b16b0e8e2d0f10abe03e3783d590a`
- start `86b099040f38f8ab5c80502efd4fbaeaf9ac9c3c6437629a7e08d0dd7dbee27`
- stop `cc9e0d32ffd9572c2edb1dbb6b030740d5503ef211698198527e3ed0618f3055`

相对蓝本的行差异：

| 文件 | 差异行数 | 旧/新总行数 |
| --- | ---: | ---: |
| `entry.py` | 704 | 1,716 / 2,388 |
| `prepare.ps1` | 12 | 354 / 354 |
| `start.ps1` | 22 | 1,510 / 1,510 |
| `stop.ps1` | 8 | 196 / 196 |

`prepare.ps1` 只改新 evidence root、`T31-genuine-branch-gui` run 名、
`lawbench-t31-genuine-branch-gui-prepared-v1` 和 task 名。

`start.ps1` 只改新 evidence root、run 名、prepared/admission format、
task 名、native entry pin 和对应 T31 启动错误文字；其余冻结运行面不变。

`stop.ps1` 只改新 run 根、run 名和状态错误文字。

`entry.py` 保留旧已审观察函数和主体字节，新增
`_t31_final_target_observation` 并切换末尾调用；另改 T31 身份、格式名、
只读 placeholder 和“不是验收”的文字。

没有修改旧 T30/T31 文件、notes、runtime、config、product、tests、SDK、guards、
loader、18 个 legacy 行、E50、B source、compiled 25 或打包文件。

## 真实输入与冻结身份

源案件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case`

当前五文件逐项仍为：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| source JSONL | 12,059 | `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee` |
| child JSONL | 16,235 | `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461` |
| `case.db` | 65,536 | `47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6` |
| `case.db-shm` | 32,768 | `fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb` |
| `case.db-wal` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

source 为 27 个事件（`seq 0..26`，3 轮），既有 child 为 37 个事件
（`seq 0..36`，继承前 27 个）。两份物理 header 只读核对：source
`isSeeded:false`，child `parentSession=source`、`isSeeded:true`，均
`delegationDepth:0`、`compression:none`。

冻结 pins：

- private runtime manifest 58,195 bytes /
  `5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f`
- B reviewed source pins 53,547 bytes /
  `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`
- separate-action safety base 151,304 bytes /
  `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`
- T30 before prepare/start/stop 仍分别为
  `0f76e921...f9f58`、`c1f33da5...9c0b0`、`b87887fe...9eec`

运行面仍固定：随机 loopback、fake Key、memory-only credential、credentials
disabled、lifespan off、OCR off、Retainer off、deny outbound、绝对 DLL resolver、
PDF 五项资源、600 秒、exact PID/exe/UTC birth、端口和窗口停止；无 served root
复用、无 global default 改动、`compression:none` 不变。

## 主源码合同

已读并据此接线：

- `dsh\packages\client\ui-workspace\src\client\session-actions\ForkSession.tsx`
- `dsh\packages\client\ui-chat\src\client\chat\TurnTailNodeView.tsx`
- `dsh\packages\api\session-controller\src\commands.ts`
- `dsh\packages\api\session-controller\src\client\sessions\lineage.ts`
- `dsh\packages\core\session\src\fork.ts`
- `dsh\packages\core\session\src\index.ts`
- `dsh\packages\session\session-persistence-jsonl\src\format.ts`
- `dsh\packages\session\session-persistence-jsonl\src\index.ts`
- `dsh\packages\session\session-format\src\catalog.ts`
- `dsh\packages\session\session-format-v1-to-v2\src\codec.ts`
- `dsh\packages\session\session-format-v3-to-v4\src\codec.ts`
- `dsh-ext\session-store\router.ts`
- `dsh\packages\api\session-controller\tests\session-fork.host.spec.ts`
- `dsh\packages\api\session-controller\tests\commands-create-fork.host.spec.ts`

普通完成轮次 fork 的当前合同是：新 UUIDv4；header 有真实
`parentSession`、`isSeeded:true`、`delegationDepth:0`、案根 `cwd`；复制父
completed boundary 的逐字事件前缀，再写一条
`{"type":"session/end-seed",...,"data":{"inherited":true}}`。显式消息尾动作
传真实 `turn/end` seq；会话菜单省略 `atSeq` 时取 latest completed prefix。

空会话 fork 的当前合同是 `session/fork-unavailable`：没有 completed turn，
`buildForkSeed` 也没有父事件。GUI 正常“新建对话”可留下一个 header-only、
0 事件、`isSeeded:false` 的生产空会话；这不是 fork 子会话。

如真实根运行在空状态生成了 seeded 子会话，本观察器会以
`native_seeded_empty_parent_not_producible` 拒绝。这是刻意的合同冲突门：
不得为过门猜 UUID、时间、空父前缀或事件尾。

## 新末端观察器

原两份日志必须保留原始完整字节前缀。各自可原样，或仅在尾部追加一条运行窗内
canonical normal `session/end-seed`，`seq` 为原事件数，`data:{}`。原 child
不允许缺席；本单不做删除流。

新会话只允许在 run 案根编码出的独立 session 项目目录，最多一个生产空会话和
一个生产 seeded fork：

- 空会话：header-only、0 事件、UUIDv4、案根 `cwd`、`isSeeded:false`、
  `delegationDepth:0`、`agentPreset:"lawbench"`、运行窗 `createdAt`；
- seeded fork：UUIDv4、案根 `cwd`、真实 parent、`isSeeded:true`、
  `delegationDepth:0`、`agentPreset:"lawbench"`；事件逐字等于父根的某个
  completed `turn/end` 前缀，或 latest completed prefix（仅允许由唯一 normal
  end-seed 收尾），随后恰好一条 canonical inherited end-seed；时间等于父边界
  最后事件时间。

拒绝任意 UUID、任意 parent、任意事件尾、0/多 individual markers、未完成边界、
非规范 header/event bytes、额外 session/project/cache、非普通文件、链接、
reparse、案外路径、未知目录/文件、case ID/schema 变化。

`final-metadata.json` 的 native 记录均为 `acceptanceProof:false`。根必须另做：
实际 GUI 动作及结果、菜单/截图、实际 native ID、父稳定性、源不可变性、
0 新 turns/messages、0 模型请求、进程/端口/窗口和网络独立核验。

## 根侧 GUI 边界

建议普通和空白各用一个全新 run 根，每状态最多一次实际分支动作：

- 普通：打开 3 轮 source，只点一次已完成末尾的“在新对话中分支”或会话菜单
  “分叉会话”；看见新 child，不 send/type/model；截图并记录真实 child UUID。
- 空白：GUI 正常新建空白对话，截图真实空 UUID；在该空白会话菜单只点一次
  “分叉会话”；按当前合同应见 `session/fork-unavailable` 且无子会话。
- 刚刚压缩：不运行、不重试。既有 256 cap-stop 是 `NOT_VERIFIED`。

验收门槛不因 prepare 文件存在而改变：

`GATE1=false`、`WHOLE_T31=false`、`PROJECT_INCOMPLETE=true`、
`PACKAGING=HOLD`。

## 实际命令与写面台账

所有正式命令均用显式 native PowerShell：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

且 `login=false`。实际只读操作包括：

- `Get-Content` 读取执行令、`blueprint-paths.json`、`A-dirty-before.txt`、
  T31 cap-stop JSON、T30 README、四件蓝本/目标文件、主 GUI/fork/session/
  persistence 源码及测试；
- `Get-ChildItem` 枚举协调输入、T31 新目录、源案件目录和目录树；
- `Get-FileHash -Algorithm SHA256` 核对蓝本、四件交付、源五文件、manifest、
  source pins、safety base，并回核 `start.ps1` 内部 pin；
- `rg` 定位 GUI branch 菜单、fork controller、`buildForkSeed`、v4 header、
  end-seed、测试合同和残留 T30 身份；
- `git status --short --branch --ignore-submodules=all` 读取分支/脏状态，并与
  `A-dirty-before.txt` 做 `Compare-Object`；唯一增量为本新目录；
- `Compare-Object` 对四件蓝本与交付逐行核对，并读取最终行数、bytes、hash；
- `[IO.Directory]::CreateDirectory` 只创建本新证据目录；
- `[IO.File]::Copy(...,$false)` 只把四件蓝本复制进本新目录；
- `apply_patch` 只新建 `README.md`、协调交回件，并修改本新目录四件运行文件。

非零/被拒记录：

1. 8 次 `rg`/`Get-Content` 调用误传 `shell=bash`，均被本 job 的 MXC 隔离拒绝；
   没有启动 bash，没有切 legacy/沙箱/ACL，也没有重试同一误配。
2. 1 次原始 header 读取 PowerShell 命令在 `foreach` 后直接接管道，PowerShell
   报空管道 ParserError；改成先收集 result 后成功。
3. 1 次蓝本/目标行数比较在 `foreach` 后直接接管道，PowerShell 报空管道
   ParserError；改成分行输出后成功。
4. 1 次 `rg` 正则转义写坏，报 unclosed group；改成更窄的独立搜索后成功。
5. 2 次 `rg` 因预期模式无匹配返回 1：一次确认四件运行文件中已无
   `T30-genuine-session-gui`/`lawbench-t30-genuine` 残留；一次确认新 T31
   evidence 下无旧运行文件名。
6. 1 次 `rg` 使用 Windows 不接受的 glob 路径 `session-format*` 返回 1；改用
   具体包路径后读取成功。
7. 1 次组合 `Test-Path`/`rg` 因目标文件不存在走出非零分支；未改任何状态。

没有以上失败产生文件写、安装、下载、运行、Git 写、权限写或第二 writer。

## 静态核验结果

- 四件复制前哈希 = 蓝本；最终五文件均存在且为普通文件。
- `entry.py` 最终 88,623 bytes；
  `start.ps1` 的 `$NativeEntryBytes/$NativeEntrySha256` 精确匹配。
- prepare/start format 名一致；start/stop run regex 一致；目录内无旧 run 名。
- 目录恰好五文件，`runs` 不存在，`BEFORE.md` 不存在。
- `git status` 与开工快照相比只有：
  `?? docs/plan/evidence/T31/GenuineBranchGui-20261028-124426/`。
- 源案件五文件当前 bytes/SHA 全部等于固定身份；旧 source/child JSONL 未被本单
  运行改写。
- runtime manifest、B pins、safety base 当前身份全部等于固定 pin。
- 当前分支仍为 `line-A`，相对 `origin/line-A [ahead 93, behind 1]`；没有 Git 写。

## 未覆盖与遗留

- 作者没有执行任何运行，因此没有 GUI 点按、真实 native UUID、实际空分支错误、
  模型 0、进程消失或端口关闭的动态证据。
- 普通和空白仍需根侧独立运行。
- 刚刚压缩状态因既有 256 cap-stop 保持未验证；没有重试或抬高上限。
- 空父 seeded fork 与当前主源码冲突，按严格门拒绝，等待根侧实际运行判读。
- 本交回不是正式 Git 提交；提交 SHA 为空，符合本执行令的 Git 只读边界。

