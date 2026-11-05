# T37 混合材料 GUI 启动器交回

状态：`READY_FOR_ROOT_REVIEW_AND_FALSE_GATE_NOT_RUN`。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | A 线按固定蓝图复制并机械改写三份已复核启动器，完成字节、SHA-256、逆替换和实际 diff 核验。 |
| 目标是什么 | root 后续在全新私有根中只读查看同一案件的 3 行材料、2 个引用徽标、原生路径和 1 份 legacy copy。 |
| 在等什么 | 等 root 完成三份脚本的全字节逆替换与源码 parser 审阅；信号为三份脚本和累计差异均命中蓝图，收到后开始 fresh prepare、24 项 exact stage 和真实 GUI。 |
| 卡在哪 | 本作者没有交付阻碍；禁止作者运行 runtime、parser、测试、build、prepare、start、serve、probe、HTTP 或 GUI。 |

## 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T37\MixedMaterialsGui-20261027-171812\prepare.ps1` | 17117 | `2f8f1393758495a345a11a71ed1422ca604348a5a53c0d20ef8fd2ebc35d3d7f` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T37\MixedMaterialsGui-20261027-171812\start.ps1` | 75677 | `b2b6905fff7b7f27397e42be7400d5ee01d4fc588a1d6a610fb672a536526540` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T37\MixedMaterialsGui-20261027-171812\stop.ps1` | 7131 | `c21f6abb5ce34b94a827fcb1d3dfef88238cf9260683e3d5ab66955f911b9f1e` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T37\MixedMaterialsGui-20261027-171812\README.md` | 9605 | `4859456d4f625c0a6e16d714baefe0930b6d8dfbd23ed7a06607bfdfd3f4a9fe` |

证据目录当前只有 `prepare.ps1`、`start.ps1`、`stop.ps1`、`README.md` 四个文件。

## 固定输入与允许差异

来源为 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049` 下三份已复核脚本。来源、固定快照和输入索引的指纹完全一致：

| 来源文件 | 字节 | SHA-256 |
|---|---:|---|
| `prepare.ps1` | 17122 | `1c0395f1a8d05749645f3d39823e3cb32ba81e08bdda2d52fe1d51ba535219e5` |
| `start.ps1` | 75682 | `cc802b8023d0b81e90334451187bb38c9a4bef0b2e10cc5021225258311ffcbf` |
| `stop.ps1` | 7133 | `5a156f2b71a81d36e3494c689320dd2259e5e2f8e1998af49c28fee92ae9d675` |

新 native entry 为 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\server.py`，实取 151304 bytes，SHA-256 `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`。新 runs root 为 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\runs`，prepared format 为 `T37-mixed-materials-gui-prepared-v1`。

`prepare.ps1` 和 `start.ps1` 各自只执行以下四组替换：

- 旧 B 目录前缀改为新 B 目录前缀，2 次；
- 旧入口 SHA-256 改为 `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`，1 次；
- `$NativeEntryBytes = 141021` 改为 `$NativeEntryBytes = 151304`，1 次；
- `T32-reference-remove-gui-prepared-v1` 改为 `T37-mixed-materials-gui-prepared-v1`，1 次。

`stop.ps1` 只把 runs root 的旧目录前缀改为新目录前缀，1 次。没有新增 `NativeEntry` 变量、`server.py` 字面量或额外停止逻辑；owned PID/exe/UTC birth/command-line marker 校验仍从 runtime state 读取。

## 依据与验证

- 固定快照索引：`D:\Lawbeach\lawbench-coord\T37MixedGuiLauncherInput-20261027-171812\index.json`。
- 字面量蓝图：`D:\Lawbeach\lawbench-coord\T37MixedGuiLauncherInput-20261027-171812\expected-literal-identities.json`。
- 三份候选在写盘前均命中蓝图 bytes/SHA，并通过逆替换后与原文件逐字节 `SequenceEqual`。
- 三份写盘文件实测 bytes/SHA 均与蓝图完全一致。
- 三次 `git diff --no-index` 只显示上述允许行；没有其他内容差异。
- 三份脚本保持 LF、UTF-8 无 BOM 和所有未列明字节不变。
- private manifest 为 58186 bytes，SHA-256 `b20e67a73b329c1249d2ad647c847594d834e3aab855db6b462fdef2a57583a0`；本次沿用固定 24 项 output pins，没有重跑或重算。
- finite proof 为 2315 bytes，SHA-256 `c4871485f093a36a4282aec2ccf1aa3d5a0d9a454acf3eec5fdb01b4a1d59d9b`，状态 `PASS_REAL_NATIVE_ONE_LEGACY_COPY_TWO_FILE_REFERENCES_HTTP_AND_TARGET_REF_REMOVE_ONLY_NOT_GUI`，并明确 `GUI_pass=false`。
- 既有 finite proof 可支持 3 行材料、1 份 legacy copy、2 个 reference badges、`R01/R02`、21 次有限 TCP 请求及 `M0002` 定向移除。该证据不是 GUI 结果，本次没有重跑。

## 未做与降级

没有运行三份新脚本、parser、Python、Node、Vitest、pytest、tsc、build、prepare、start、serve、probe、HTTP、GUI、Office、OCR 或模型；没有安装依赖；没有重演全量测试。

因此本次只交付固定数据启动器，不声明新 GUI 通过，也不声明 Gate 1、T37 或整个项目完成。真实 GUI 仅允许 root 后续只读查看 3 行材料、2 个引用徽标、原生路径和 1 份案件副本。不得执行 Send、picker、GUI remove，不得要求 owner 在本阶段动作。未来实际 GUI 删除必须在动作发生时重新取得真人确认，不能复用 finite probe 或旧确认。

## 阻碍、非零与写入面

实际 shell 为 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`，工作目录 `D:\Lawbeach\lawbench-A`。没有 Bash 包装，没有更改全局 API、Key、provider、权限、锁、ACL、沙箱、审批或 writer lock。

非零与阻碍：

- 首次 `git status --short --branch` 退出 1；git 进入子模块 `dsh` 时遇到 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh: Permission denied`。之后仅以 `--ignore-submodules=all` 读取顶层状态，没有修锁、扩权或改 ACL；该权限阻碍不影响本次文件交付。
- 一次预核误把 stop 也套用四组替换，在写盘前因次数不符退出；没有产生目标文件。
- 一次预核因 PowerShell 元组数组展平而退出；没有产生目标文件。改为逐次显式字节替换后全部命中。
- 三次 `git diff --no-index` 因预期差异退出 1；Git 同时给出本仓库配置下未来可能把 LF 转成 CRLF 的 warning，本次文件字节未改变。
- 一次黑名单扫描退出 1，表示 README 无黑名单命中。

写入面仅为新证据目录 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T37\MixedMaterialsGui-20261027-171812`、其中四个指定文件，以及本交回件。没有修改旧脚本、B 入口、产品源码、schema、测试、probe、runtime、build config、manifest、pins 或全局配置。

Git 严格只读：没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。当前只读分支为 `line-A`，HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`。工作树已有 dirty 内容全部保留；本交回件不是 Git 提交。

## 完成度与下一步

| 决策完成度 | 当前事实 |
|---|---|
| 已合流可见 | 无 |
| 在飞 | 三份数据型启动器和 README 已交回，待 root 审阅 |
| 已裁未派工 | root 的完整逆替换、源码 parser 审阅、fresh prepare、24 项 exact stage 和真实只读 GUI |
| 候 owner | 仅未来实际 GUI 删除在动作时确认；本次只读检查不需要 owner 动作 |

root 下一步应先独立重读正式执行令并审阅三份脚本。通过后复用固定 B 入口，在全新私有 run root 中执行 fresh prepare，核对 24 项 exact output，再启动真实 GUI 做只读混合材料检查。Packaging 继续 `HOLD`，Gate 1 与整个项目仍未完成。

删减轮：读者 1 / 槽位 1 / 半句 2 / 重复 2 / 过程 0 / 黑名单 1

Response ID: `A-T37-MixedMaterialsGui-Handback-20261027-171812`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T37-mixed-materials-GUI-launcher-20261027-171812.md`
