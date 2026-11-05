# T30 真实会话 Windows GUI 准备

状态：`AUTHORED_NOT_RUN / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_AND_RUN_REQUIRED`

本目录准备一次全新的、未被服务端消费过的私有 GUI 运行。目标是让冻结的 Windows
Electron/DSH GUI 读取复制后的真实 T30 案件与两份真实 v4 JSONL，看到已有的非空
会话，并在后续真人操作中验证右键菜单、打开、取消删除和一次经现场确认的删除。

本作者没有运行 prepare、准入、start、stop、GUI、HTTP、模型、Python、Node、
测试、parser、AST、编译或打包。这里没有 GUI、Windows 回收站、USB 或整卡通过的
运行结论。

## 真实输入

| 输入 | 字节 | SHA-256 |
| --- | ---: | --- |
| 源会话 `session-97c67db2-b8a6-428b-be48-04b4144d10bd` | 12,059 | `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee` |
| 子会话 `session-7fd6b82e-f361-456a-9c91-b6ba77991bb9` | 16,235 | `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461` |
| T30 准入运行报告 | 8,435 | `238bc2fa4d720d0b5c41e60f1c66a0fe51610e5b7a100b7593f4b61e978ea08e` |
| 既有案件根 | 5 文件 | tree `fbace1ea0b8a396669e8b544af60778b33c6ef83c7c60852615b174de7e35716` |

源 run 的已验收 packet manifest SHA-256 为
`b7c1933e9065a67049a2f4cb14d6eac804f084d388a130371664442876d708f4`，该值也保留在
源准入运行报告中；本准备只在新的 `runs` 子目录写复制件。

既有案件根为
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case`，
case ID 为 `872b161f-27d4-40bf-879e-ee457ef6454b`。案件内 5 个普通文件是两份
`session.v4.jsonl`、`case.db`、`case.db-shm`、`case.db-wal`。案件目录和文件
逐项固定大小、SHA 和目录清单；源案件不会被写。

两个 JSONL 来自已验收的真实 T31 三轮会话及生产 fork 第四轮。源会话 27 个事件，
子会话 37 个事件，子会话继承前 27 个事件。物理 header 的旧 T31 `cwd`、会话 ID、
`parentSession`、`R`、事件、历史和消息均不改写。现有 `SessionRouter` 只在读侧把
案件会话的逻辑 `cwd` 换成复制案根，这是已授权的生产行为。

## 冻结 GUI 输入

| 输入 | 身份 |
| --- | --- |
| before `prepare.ps1` | 21,840 bytes / `0f76e9216ec9b29941e0fa7f0e6bd82496d9cd36cbda3aef8f5740079ccf9f58` |
| before `start.ps1` | 81,190 bytes / `c1f33da5c4dfb35b278315541fc47f2d7c4d943728ee8c6b2b068a49f099c0b0` |
| before `stop.ps1` | 7,157 bytes / `b87887fe29dc191cbe9237e3111f1ce9d48ab26ac330edc1e06c5804699a9eec` |
| 私有 runtime | `T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112` |
| runtime manifest | 58,195 bytes / `5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f` |
| staged 输出 | 24 个；加 manifest 共 25 个文件 |
| Node `E:\node\node.exe` | 93,580,104 bytes / `ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32` |
| Electron | 244,440,576 bytes / `1dc2d12e5c60341782e68c4b65a8e49cbd86217f81568f90575547cec13b5610` |
| Desktop `package.json` | 3,474 bytes / `2c1643549732e15dcd911658be6515ffcfef5ddaef308067eaa9fc6e827ee0a0` |

启动器保留旧冻结蓝图中的 profile bundling、绝对 DLL resolver、renderer 来源、
PDF 五项资源、网络 guard、proxy、随机 loopback、Credential/OCR/Retainer 关闭、
exact PID/exe/UTC birth 和端口清理。没有重新构建 runtime，也没有把旧 pin 动态
换算成新库哈希。

## 静态兼容结论

冻结输入 `session-persistence-jsonl/src/format.ts` 的当前 v4 header 必填
`delegationDepth`；本次两份物理日志的首行都已含 `delegationDepth:0`。文件名是
`session.v4.jsonl`，项目目录仍按物理旧 cwd 编码，符合现有
`SessionRouter`/JSONL backend 的定位方式。已验收准入还实际覆盖了同一源码版本的
`list/stat/open/read/recordOf` 和 27/37 事件父子前缀。

本机当前没有发现格式阻断，因此没有新增 adapter、mapper、loader 或源码修复。若
未来在冻结 GUI 实际运行时出现格式拒绝，保留该运行与主错误，按实际阻断回报；
不得伪造回退或把静态结论写成 GUI PASS。

## 运行命令

先完成 root full audit：核对本目录、输入目录 `A-dirty-before.txt`、runtime
manifest 与实际 25 文件、before 三脚本、源案件与 source-run report、B source
pins，并确认没有已存在的 `runs\T30-genuine-session-gui-*`。

以下四条命令都必须由未来获授权的主编排或现场执行者按顺序运行。`<runRoot>` 必须
使用 prepare 返回的那一个绝对路径。

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\stop.ps1' -RunRoot '<runRoot>'
```

prepare 只做长路径下的普通目录/文件复制、私有六目录和静态 manifest；输出必须为
`copiedBytesEqual:true`、`sourceUnchanged:true`、`registered:false`、
`guiStarted:false`、`deleteAttempted:false`。它不会手写会话 header、事件、消息、
ID、父子关系或缓存。

准入命令调用既有 B 线 `CaseRegistry.open` 登记复制案件。复制案件已有
`case.db`，因此期待 `registryCreated:false`，case ID 保持
`872b161f-27d4-40bf-879e-ee457ef6454b`，`cases.json` 只有这一个复制根。准入
报告必须显示源案件前后完全相同、两份目标日志字节/SHA 不变、模型请求 0、HTTP
请求 0、GUI 未启动、删除未尝试。

start 先核 prepared/admission、源案件、目标日志、runtime 25 文件和 24 个 staged
输出，再创建私有 profile。Host 只在 `127.0.0.1` 随机端口启动本目录的小型
只读服务入口；`lifespan=off`，OCR 不启动，Retainer 替换为无操作，凭据 getter
不调用，外部 HTTP transport 拒绝。服务只开放 GET 读侧路由和精确同案
`POST /api/case/open`；任何 model、OCR、材料移除、session-delete、recycle 或
其他写路由都被 firewall 拒绝。

服务启动前仍严格要求父、子两份目标日志、三个 SQLite 文件与复制案五文件固定。
服务退出后的最终观察不再要求复制前五文件清单原样存在：父日志和 `case.db` 必须
存在；父日志始终保持固定身份，子日志只能是固定身份，或子会话记录目录整体不存在
（`CHILD_DIRECTORY_ABSENT_PENDING_ROOT_GUI_AND_OS_RECYCLE_PROOF`，此时
`targetLogsUnchanged:false`）。`case.db` 必须仍是普通文件，最终元数据记录实际
前后 bytes/SHA，并以 SQLite `mode=ro`、`query_only` 只读核对原 case ID 和
schema `1`；不调用 `CaseRegistry`，不创建或重建案件库。

`case.db-shm` 和 `case.db-wal` 是 SQLite 生命期产物：存在时按普通文件记录实际
bytes/SHA，不存在时明确记录 absent/changed，不伪造等于固定哈希。最终文件白名单
只额外允许 `工作区/会话缓存/<session-id>.json` 中两个固定会话 ID 的投影缓存；
缓存存在时记录实际 bytes/SHA，并明确标为产品生成缓存、不是验收证据。任何其他
会话、缓存名、临时文件或额外文件都会使观察失败。子会话目录缺席、SQLite 辅助文件
消失或缓存存在都只供根侧复核，不构成删除、回收站或 GUI PASS。

## 未来 GUI 操作

不对空白行、空会话或手工造数据取证。现成真实资源应直接表现为左栏已有的非空
Session 行。未来 GUI 输入只允许经 `@oai/sky` 的
`observe-singleaction-newobserve` 做单步观察，不键入、不发送模型消息、不自行
点击确认。获授权的人按以下顺序观察：

1. 截图源会话和子会话两行，父会话保留为控制组。
2. 对子会话打开右键菜单，截图“删除会话”菜单项。
3. 打开子会话历史，确认仍是 37 个真实事件；再返回左栏。
4. 对子会话发起删除，在第一次实际确认框点取消。取消后父、子两行和两份复制
   JSONL 都必须仍在。
5. 只有未来现场人员在真实确认框前另行确认，才可再次发起并确认一次删除。旧
   `M0002` 消费确认不构成本次 T30 授权。
6. 目标只允许子会话。源会话（父控制组）不得删除；原 source case、协调目录输入
   和 T31 原始运行始终不得作为目标。
7. 确认后截图左栏状态：父行仍在，子行消失；目标复制目录
   `...\session-7fd6b82e-f361-456a-9c91-b6ba77991bb9` 不在案件内；源输入两份
   JSONL 仍保持固定字节/SHA。

### 回收站精确取证办法

未来只针对这一次删除取证，不浏览回收站里的其他业务内容：

1. 在人工确认之前，对当前用户卷的精确 `$Recycle.Bin\<SID>` 目录启用只收
   `Created` 事件的短时 watcher；不对已有条目做目录枚举。
2. 人工确认后，只收集该确认窗口内新建的 `$I*` 条目；读取其回收站元数据，要求
   `OriginalLocation` 精确等于复制案件中目标子会话目录，删除时间落在确认窗口。
3. 只确认同一随机后缀的 `$R*` 条目存在；不读取、不列示、不复制其他条目的名称
   或内容。保存 watcher 时间、`$I` 的精确目标匹配和 `$R` 对存在即可。
4. 本次作者没有访问回收站，没有枚举 `$Recycle.Bin`，也没有执行任何删除、停会话
   release 或 trash move。

## 预期运行产物

准入后：`admission.json`。

GUI 运行后：`started.json`、`ready.json`、`requests.ndjson`、
`final-metadata.json`、`loop-closed.json`，以及 `gui\state`、
`gui\logs`、截图和现场人工记录。`ready.json` 的 case ID、源/子 session ID 和
loopback port 必须与本次 run 一致。

stop 只按 `current.json` 中精确的 PID、可执行文件、UTC birth ticks、命令行动
标记和记录端口清理，不清业务 GUI，不用宽泛进程名杀进程。默认保留 run 供复核；
只有明确完成证据归档后，才可人工删除该一个 run，不删除本目录、`T30` 上级目录、
源案件或协调输入。

## 仍未覆盖

- 本次没有启动实际 Windows GUI，因此没有 GUI PASS。
- 实际非空会话删除、取消后状态、一次确认、OS 回收站可见性仍未验证。
- 当前没有可用于拒删验证的 U 盘案件；`DriveType=2` 的拒绝路径未覆盖。
- macOS 三处路径未由本 Windows 运行验证。
- 未验证模型、OCR、Office、Task、压缩、安装包、整条 T30 或整项目。

`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`，
`Packaging=HOLD`。
