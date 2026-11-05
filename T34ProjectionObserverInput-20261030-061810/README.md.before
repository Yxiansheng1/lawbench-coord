# T31 真实分支 Windows GUI 准备

状态：`AUTHORED_NOT_RUN / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_AND_RUN_REQUIRED`

本目录只准备两类有界 GUI 观察：

1. 已知真实三轮会话上的普通“在新对话中分支／分叉会话”。
2. GUI 新建的空白会话，以及该空白状态上的分支菜单结果。

不准备、不重试、不伪造第三类“刚刚压缩”状态。既有
`GenuineCompactedFork-20261028-115217` 的最后一次真实尝试在 256 token
上限处停止，服务端只有一次 HTTP 200，随后原生失败括起；没有摘要 checkpoint、
没有 fork、没有子会话。该状态仍是 `NOT_VERIFIED`。

本作者没有运行 Python、Node、PowerShell 脚本、测试、parser、AST、编译、准备、
准入、启动、停止、探针、GUI、HTTP、模型、Key 或自检。目录内没有 GUI、
模型、分支、压缩、整条 T31 或项目通过结论。

## 真实输入

| 输入 | 身份 |
| --- | --- |
| 既有案件复制根 | `T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case` |
| case ID | `872b161f-27d4-40bf-879e-ee457ef6454b` |
| 源会话 | `session-97c67db2-b8a6-428b-be48-04b4144d10bd` |
| 源日志 | 12,059 bytes；事件 `seq 0..26`；3 轮；SHA-256 `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee` |
| 既有子会话 | `session-7fd6b82e-f361-456a-9c91-b6ba77991bb9` |
| 既有子日志 | 16,235 bytes；事件 `seq 0..36`；继承源 27 事件；SHA-256 `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461` |
| 私有 runtime | `T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112` |
| runtime manifest | 58,195 bytes；`5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f` |
| B 源码 pins | 53,547 bytes；`5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf` |

原始两份 JSONL、案件五文件和源案件目录均按 T30 已验收身份固定。prepare 只做
字节复制，不改写 header、ID、cwd、parentSession、事件、消息、`R` 或历史。
原始 source case、T30 运行目录和协调输入不得作为写入目标。

## 冻结运行面

本目录复用已通过的 T30 GUI 运行面，只改任务身份与末端观察：

- 随机 loopback、fake Key、memory-only credential、credentials disabled、
  lifespan off、OCR off、Retainer off；
- deny-outbound network guard、固定 proxy、私有 profile、`compression:none`；
- 绝对 DLL resolver、Electron renderer source、PDF 五项资源和 offline PDF worker；
- 600 秒硬生命周期、exact PID/exe/UTC birth、精确端口关闭、窗口停止；
- 私有 runtime manifest `526036...` 和 24 staged 输出；
- 不恢复、不复用旧 served run，不改全局默认值、产品 loader、18 个旧配置行、
  E50、B 源码、SDK、guards、compiled 25 文件，不构建。

分支动作不经过产品修改。GUI 调用冻结的生产 Session Controller；本目录的 Python
`entry.py` 仅在末尾读取同一案件目录，验证生产持久化结果。

## 精确差异

四件运行文件先按已审蓝图字节复制，再作以下有界改动：

| 文件 | 初始蓝图 SHA-256 | 有界改动 |
| --- | --- | --- |
| `entry.py` | `9afc42e1e851948b8ff4d06fe405718303375e6ab20d5001c2b438ddfbd4f360` | 新增 T31 身份；保留旧观察函数字节，新增 `_t31_final_target_observation` 并切换调用 |
| `prepare.ps1` | `285e5dec942a50a42b277f9d1cf43f690b7b16b0e8e2d0f10abe03e3783d590a` | 新 evidence root、run 名、prepared format、task 名；源案件身份不变 |
| `start.ps1` | `86b099040f38f8ab5c80502efd4fbaeaf9ac9c3c6437629a7e08d0dd7dbee27` | 新 evidence root、run 名、format、task 名、native entry pin；其余运行面不变 |
| `stop.ps1` | `cc9e0d32ffd9572c2edb1dbb6b030740d5503ef211698198527e3ed0618f3055` | 只改 run 根允许列表、run 名和状态错误文字 |

最终字节数和 SHA-256 以代码交回件及根复核记录为准。未创建 `BEFORE.md`，也未在
协调输入内放运行产物。

## 主契约

本轮据以下主源码定合同，不据目录空猜测行为：

- `dsh/packages/client/ui-workspace/src/client/session-actions/ForkSession.tsx`：
  会话菜单的“分叉会话”入口，只调用生产 `forkSession`。
- `dsh/packages/client/ui-chat/src/client/chat/TurnTailNodeView.tsx`：
  消息尾部“在新对话中分支”把真实 `turn/end` seq 交给生产 fork。
- `dsh/packages/api/session-controller/src/commands.ts`：
  `latestCompletedPrefixBoundary` 与 `fork`；普通 fork 复制完整已完成前缀，
  生成新 UUIDv4，写入真实 `parentSession`、`isSeeded:true` 和继承计数。
- `dsh/packages/core/session/src/fork.ts`：
  `buildForkSeed` 在继承前缀后写入 tagged `session/end-seed`；当前普通尾部是
  `turn/end`，不产生额外 closer。
- `dsh/packages/core/session/src/index.ts`：
  seeded 会话的继承边界标记；普通打开时最多补一条 canonical
  `session/end-seed`，`data:{}`。
- `dsh/packages/session/session-persistence-jsonl/src/format.ts` 与 `index.ts`：
  v4 header 必填/可选字段、UUID 路径、header-first JSONL、header-only 空会话、
  原子首次持久化和项目/session 目录编码。
- `dsh-ext/session-store/router.ts`：
  读取复制案件时把逻辑 `cwd` 换成当前复制案根；新建分支和空会话因此落在本
  run 案根的独立 session 项目目录。

静态测试合同另见 `session-fork.host.spec.ts` 与
`commands-create-fork.host.spec.ts` 中的 completed-prefix、显式 `atSeq`
和“no completed turn”反例。

## 末端观察合同

`_t31_final_target_observation` 只读案件目录、两份原始日志、SQLite 元数据和
普通缓存。任何 reparse、链接、非普通文件、案外路径、未知文件/目录、duplicate
ID、非 UUIDv4 或非规范字节都失败。

原始两份日志必须各自以已验收原文为完整字节前缀。二者可保持原样；若 GUI 打开
其中一份，只允许在原文尾部追加恰好一条运行窗内的 canonical
`session/end-seed`，`seq` 等于原事件数，`data:{}`。

新会话只允许位于本 run 案根编码出的独立项目目录，且最多：

- 一个生产新建的空会话：header-only、0 事件、无 `parentSession`、
  `isSeeded:false`、`delegationDepth:0`、`agentPreset:"lawbench"`、
  规范 UUIDv4，`cwd` 精确等于本 run 案根，`createdAt` 在运行窗内；
- 一个生产 seeded fork：真实 `parentSession` 指向原始 source/既有 child，
  `isSeeded:true`、`delegationDepth:0`、`agentPreset:"lawbench"`，事件逐字
  等于父会话某个已完成 `turn/end` 边界的前缀；也可等于父会话最新 completed
  prefix（该 prefix 恰以 GUI 打开产生的唯一 normal `session/end-seed` 收尾）。
  前缀后恰好一条 canonical inherited `session/end-seed`，其 `seq` 等于继承数、
  时间等于父边界最后事件时间。

空会话上的生产 fork 在当前控制器没有已完成轮次边界，会返回
`session/fork-unavailable`，不会创建子会话。观察器不接受为“空父会话”
猜造 seeded 子会话；`buildForkSeed` 也没有可用的父事件。若未来真实运行出现
这种结构，应保留现场并回报合同冲突，不得放宽成任意 UUID/事件尾。

上述结构只证明文件形态，不证明 GUI 点击。根必须独立看到实际菜单位置、动作、
结果和实际 native session ID，并单独证明父稳定性、源不可变性、0 新轮次和
0 模型请求。不得把目录没有某文件、缓存或 SQLite 辅助文件当成动作证据。

## 根侧运行边界

建议普通和空白各用一个全新 run 根，避免把两个状态混成一次结论。每次都必须重新
prepare、admit、start，且每个状态最多一次实际分支动作。

普通状态：

1. 根先核对本目录、四件文件、协调输入、源案件五文件、runtime manifest/25 文件、
   源 pins、B pins 和 `runs` 中尚无同名目录。
2. 运行 prepare、admit、start。
3. 只打开已知 source 会话或其真实历史；不键入、不发送、不选模型。
4. 对 source 的已完成末尾做一次“在新对话中分支”或会话菜单“分叉会话”。
5. 截图源行、动作入口、生成子行和打开后的子历史；记录真实 child UUID。
6. 不向子会话发送任何内容，运行 stop。

空白状态：

1. 用新的 run 根重复准备和启动。
2. 通过 GUI 正常“新建对话”，确认显示为空白；截图该状态与真实 native UUID。
3. 在该空白会话的会话菜单上只做一次“分叉会话”。
4. 记录实际结果。按主契约应为 `session/fork-unavailable`，没有新子会话；
   截图错误/无子行结果。
5. 不键入、不发送、不删除，运行 stop。

“刚刚压缩”状态：不启动新 GUI、不重试 256 上限、不补 history、不改 max
tokens、不换模型。既有 cap-stop 只作为未验证限制保存。

## 运行命令

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineBranchGui-20261028-124426\stop.ps1' -RunRoot '<runRoot>'
```

`<runRoot>` 必须直接位于本目录 `runs` 下并匹配
`T31-genuine-branch-gui-YYYYMMDD-HHMMSS`。不得使用旧 prepared/admission，
不得复用旧 GUI root，不得扩大 `LifetimeSeconds` 超过 600。

## 根侧独立证据

除 `final-metadata.json` 的末端结构外，根至少独立保存：

- 实际 GUI 动作前后截图和可访问性/单步观察记录；
- 实际菜单动作类型、结果、真实 native UUID、父 ID；
- source 与既有 child 的原 SHA/大小，以及运行后逐字节前缀或唯一 normal marker；
- source case 五文件、case ID、schema `1` 和 SQLite 只读核对；
- `requests.ndjson`、网络 denial、模型请求 0、新 turn/user/assistant message 0；
- exact PID/exe/UTC birth、端口关闭、窗口停止和六 OS 进程消失；
- runtime manifest/25 文件、私有 profile 前缀、24 staged pins 和未改全局设置；
- dirty before/after、本目录五个新增文件及其他运行目录边界。

`final-metadata.json` 中所有 native 记录都带 `acceptanceProof:false`。根可据此
做结构复核，但不能把脚本生成的文件本身当成 GUI 动作通过证据。

## 仍未覆盖

- 本作者 runtime 为 0，没有 Windows GUI、分支、空白状态或压缩通过结论。
- 普通分支的现场点击与真实 child UUID 尚待根侧运行。
- 空白分支的实际错误呈现和真实 UUID 尚待根侧运行。
- 刚刚压缩状态未验证；256 cap-stop 未被改写为失败或通过。
- 未验证模型、OCR、Office、Task、文档、安装包、整条 T31 或整个项目。

`GATE1=false`、`WHOLE_T31=false`、`PROJECT_INCOMPLETE=true`、
`PACKAGING=HOLD`。
