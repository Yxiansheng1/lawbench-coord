# T30 真实会话准入复核入口

状态：`AUTHORED_NOT_RUN / ROOT_AUDIT_AND_RUN_REQUIRED / PACKAGING_HOLD`。

本目录只处理 T30 原工单第 3、5 步中“已有非空真实会话进入私有合成案件，
删除预检不越过停会话和移回收站”的有限准入面。作者没有执行 Node、Python、
tsx、测试、HTTP、模型或 GUI；本文不代表任何一个运行断言已经通过。

## 边界

本入口使用已验收的真实 T31 日志和现行源码：

- 源会话 `session-97c67db2-b8a6-428b-be48-04b4144d10bd`：
  12,059 bytes，SHA-256
  `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee`。
- 子会话 `session-7fd6b82e-f361-456a-9c91-b6ba77991bb9`：
  16,235 bytes，SHA-256
  `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461`。
- 两个物理文件的首行仍是原虚拟项目 `cwd`。入口只按原项目目录、原会话目录、
  原文件名做独占字节复制，不改首行、事件、seq、父子关系或文件名。
- 合成案件由一个全新私有根中的现行 B 线 `CaseRegistry.open` 创建并登记，
  不是手写 `cases.json`，也不冒充已打开 GUI 案件。

固定清单为 [fixed-inputs.json](fixed-inputs.json)，当前 SHA-256 为
`3ce2e0193d228d4a8083ad243ebdbf9065f539aef80bd63e969c5c6a7a373c3a`。
该值已作为字面常量写入消费者。消费者先核清单，再核清单内 32 个文件及其快照；
不会以“先算当前值、再拿当前值自证”的方式通过。

## 入口和写入面

- `prepare-case.py`：只核固定 B 线案件源码，调用 `CaseRegistry.open`，在
  `<run>/case` 创建 `daily` 合成案件，在 `<run>/appdata` 写私有登记。
- `admission.mts`：在证据目录下用 `mkdtemp` 新建一次性的 `run-*` 根，隔离
  `HOME`、`APPDATA`、`LOCALAPPDATA`、`TEMP` 和 `DSH_HOME`，关闭 Node 网络，
  然后用现行 `CaseRoots`、`SessionRouter` 和 JSONL v4 后端验证清单、复制、
  `list/stat/open/read`、父前缀和删除预检。
- `admission.mts` 不发出 `workspace/session-delete`。它只发出
  `workspace/session-delete-check`，确认固定盘预检可放行；没有停会话、
  release 或回收站移动动作。

运行根内新增的持久写入只有：

- `case-registration.json`：合成案件的真实登记结果；
- `appdata/cases.json` 和 B 线在私有应用数据目录内的登记日志；
- `case/工作区/case.db` 及标准案件目录；
- `case/工作区/会话/<原项目目录>/<原会话目录>/session.v4.jsonl` 两份；
- `admission-report.json`。

源协调目录中的两个 JSONL、T31 运行目录和源码均不在写入面内。

## 主编排唯一命令

以下命令由主编排完成源码、setup、finally 和写入面审计后执行一次。它不接受
Key、模型参数、端口或手工运行根；消费者必须自行创建全新的 `run-*`。

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\admission.mts'
```

命令退出码 0 且报告为 `PASS`，只表示这一个有限准入事件通过。退出码非零时，
先读该次 `run-*/admission-report.json` 的 `error`、`cleanup` 和未完成字段，
不得复用该运行根，也不得把失败改成 fixture-only 后重试。

## 预期结果

`admission-report.json` 至少应给出：

- 固定清单 SHA 和 32 个文件核验完成；
- `CaseRegistry.open` 的 `created=true`、真实 `caseId`、案件根及
  `工作区/会话` 位置；
- 源、子两个目标文件与固定输入的 SHA-256、字节数在复制后和结束时不变；
- `CaseRoots` 只含本案件；路由器列表恰好两份；
- 源 27 个事件、子 37 个事件；子头 `parentSession` 指向源；
- 子会话继承 27 个事件，且这 27 个事件与源逐事件相等；
- `stat` 的逻辑 `cwd` 是合成案件根，物理首行仍是原 T31 工作区 `cwd`；
- `recordOf` 返回的两个目录都在本案
  `工作区\会话\<原项目目录>\<会话编号>` 下；
- 实际 session-store 服务能 `list/stat`，删除预检返回空拒绝码；
- `workspace/session-delete` 观察次数为 0，Node fetch 尝试为 0；
- 两个 Context 均已 dispose，进程环境已恢复。

任何一项缺失都应失败并保留现场，不能用旧 T31 报告、预期 API 结果或旧编译
产物补成通过。

## 清理

默认保留 `run-*` 供主编排复核。确认不再需要后，只删除命令输出中明确显示的
该次运行根；不得递归删除本目录、`T30` 上级目录、T31 源运行或协调目录。

```powershell
$runRoot = '<admission-report.json 所在的那一个 run-* 目录>'
Remove-Item -LiteralPath $runRoot -Recurse -Force
```

## 仍未覆盖

- 未启动 GUI，未证明冻结的已编译 GUI 能直接打开并继续这两个会话。本执行令
  没有给出一个固定 GUI 包哈希，因此不把“源码格式支持”写成“GUI 格式支持”。
- 未真正删除会话，未验证停会话、release、系统回收站成功或界面行状态。
- 未验证 U 盘案件拒绝；当前没有可用可移动介质。
- 未验证 macOS 三处路径、真实案件、模型、OCR、Office、压缩、打包或完整 T30。
- `fixedDriveTrash=false`、`usbRefusal=false`、`wholeT30=false`、
  `Packaging=HOLD`。

完整作者命令、非零事件和写入面见 [交付说明.md](交付说明.md)。
