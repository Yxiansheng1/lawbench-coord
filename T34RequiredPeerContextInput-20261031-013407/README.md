# T34 dependency-context source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / PREPARED_RESOURCE_NOT_CREATED_BY_AUTHOR / NEW_TARGET_NOT_RUN / FULL_TEST_NOT_RUN`

本件只修改根侧试验边界源码，目标是保留已经证实的模块局部根 Include 注册表
问题现场，同时补齐原始 E50 包的真实依赖文件上下文。既有源码已经证明：只复制 99
个文件会在第一个新增依赖处终止，不能替根侧声称修复。

## 固定输入

- 基线与完整源码：`CompleteLauncher-20261031-004819\complete-launcher.mjs`
  （76,074 bytes，SHA-256
  `92b2f652d5a25ac25f93816dc39b87bd8512dbf383150bba5478f3c0a9c65df6`）。
- 固定复制表：协调目录内
  `T34DependencyContextInput-20261031-011744\approved-copy-table.json`
  （1,722,626 bytes，SHA-256
  `44710f94a3368937cfd808fae8f0c5ffbdea6ffe14602bf2e183247e0c035c7e`）。
- 表内容：schema `lawbench-t34-fixed-original-dependency-table-v1`，4,704 个文件，
  25,628,005 bytes。
- 固定准备根：
  `D:\Lawbeach\lawbench-coord\T34DependencyResources-20261031-011744`。
  本源没有创建该目录；只有根侧 `--prepare-only` 可以在该绝对路径独占创建。
- 原 14 个 source pin 未改名、未改值；观察器仍使用原 source pin，不进入复制运行时。
- `approved-inputs.json` 未修改；`literal-inputs.json` 保留其完整 JSON 核心，只追加
  `handoff` 自述、计数、全零运行计数和 `NOT_RUN` 状态。

## 源码边界

`dependency-context.mjs` 只接受两个显式入口：

1. `--prepare-only --root <固定准备根>`：先核对复制表自身 bytes/SHA-256，再解析固定
   表；要求 schema、4,704 文件、25,628,005 bytes、唯一 owned 相对路径和四个允许
   扩展名。随后核对原 14 pin 与表内全部原始文件，安装同一组八类 guard，只在
   `<固定准备根>\complete-runtime` 以 `wx` 复制表内文件并逐个回读 SHA/bytes。
   最终写入 `compiled-boundary-result.json`，结果为
   `DEPENDENCY_FILES_PREPARED_NO_APP_IMPORT`，在任何 DSH import、`runProfile`、
   mutation、模型、worker、GUI 之前返回 0。
2. `--root <本证据目录 runs 下的新目录>`：不复制、不重建、不复用旧 served root。
   先核对同一固定表、原 14 pin 和全部 4,704 个原始文件，再安装八类 guard；随后只读
   固定准备根，验证 PINNED 表 SHA/count/bytes、prepare proof、owned/reparse 边界和
   全部 4,704 个已复制文件的 SHA/bytes。全部通过后才 import 准备运行时中的
   appBoot/loader，并保持原有的旧 profile 只读元数据、内部 profile-boot import、
   最小新 profile、唯一 unset、物理 patch、观察器和一次 shutdown 路径。

两种模式均不读取 `.env`、Key 或密码，不联网，不启动模型，不修改 SDK/resolver/
provider，不创建业务 profile 或 GUI。复制表缺少任一预期依赖时失败，不回退到旧资源。

## 根侧唯一执行顺序

先确认固定准备根不存在。以下命令只执行一次，使用既有批准的 Electron Node mode、
冻结 resolver 与冻结 network guard；setup 外壳上限为 180 秒：

```powershell
<approved Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\dependency-context.mjs" `
  --prepare-only `
  --root "D:\Lawbeach\lawbench-coord\T34DependencyResources-20261031-011744"
```

根侧必须独立核对准备根的 4,704 个副本等于固定表原始来源及 OS closure，并确认
prepare proof 为 `PREPARE_ONLY`。不通过即停止，不启动实际路径。

通过后，在
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\runs`
下选择一个尚不存在的新目录，只执行一次实际路径；实际调用外壳上限仍为 45 秒：

```powershell
<approved Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\dependency-context.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\runs\<fresh-owned-name>"
```

实际路径退出码：`0` 表示唯一 mutation fulfilled 且 shutdown fulfilled；`1` 表示
准备根、固定表、源 pin、准备副本、import、profile 或 boot 前置失败；`2` 表示唯一
mutation rejected；`3` 表示运行时 precondition rejected；`4` 表示 shutdown rejected。
只有根侧这一条实际链和完整外壳证据可以判定目标是否修复，本源不能预称 PASS。

## 作者侧边界

- Node、Python、import、check、test、build、prepare、actual、boot、应用、GUI、HTTP、
  模型、SSH、DPAPI、worker 与 process probe 均为 0。
- 固定准备根由作者创建：否。实际运行新 root 由作者创建：否。
- Git add/commit/rebase/stash/reset/clean/checkout/push 均为 0。
- 未修改 `approved-inputs.json`、基线源码、SDK、resolver、guard、观察器或业务 profile。
- 结果仅为源码交接；`PREPARE_ONLY` 与完整实际 T34 均仍为 `NOT_RUN`。
