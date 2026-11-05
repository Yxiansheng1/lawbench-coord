# ORCH-B T33 目录 GUI 启动准备交回

## 结论

本次“目录 GUI 启动准备 ONLY”已完成：已生成三份仅作 5 处 literal 替换的脚本、新 README 和本正式交回件。未运行服务或 GUI，未执行测试、自测、build、prepare、start 或 stop。

## 输入与白名单产物

- 完整已审输入：`D:\Lawbeach\lawbench-coord\T33DirGuiInput-20261025-200431`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateGui-20261025-200431\prepare.ps1`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateGui-20261025-200431\start.ps1`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateGui-20261025-200431\stop.ps1`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateGui-20261025-200431\README.md`
- 本文件：`D:\Lawbeach\lawbench-coord\ORCH-B-T33DirGuiReturn-20261025-200431.md`

除上述白名单产物外未写任何文件；未改已审 `DirRelocateEntry-20261025-195450` 三件、产品、lib、tests、contracts、E50、guard、resolver、PDF 或源输入。

## 精确替换台账

1. `prepare.ps1` NativeEntry 旧值到新值，计数 1。
2. `prepare.ps1` NativeEntrySha256 旧值到新值，计数 1。
3. `start.ps1` NativeEntry 旧值到新值，计数 1。
4. `start.ps1` NativeEntrySha256 旧值到新值，计数 1。
5. `stop.ps1` runsRoot 旧值到新值，计数 1。

新原生 server 完整 pin：

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateEntry-20261025-195450\server.py`
- SHA256：`e438827ecd22adc9f2e71e01da4274c697c6b75984ecb043788016c2b6d18d72`

原生 server 仅有本令指定方法字节变化的上游事实沿用既有 root 审核结论；既有完整 6 bundle pins 沿用源目录完整 manifest，本交回不复制旧表，也未计算新脚本 SHA。

## 完整性与边界证据

- 三源脚本均以 `File.ReadAllText` 完整读入内存；每处 literal 替换前按 ordinal 精确计数，均为 1；替换后旧值均为 0、新值均为 1。
- 对三脚本逐项反向替换并按原编码/BOM/换行重建后，内存结果与输入文件逐字节相同。
- 目标文件采用“不存在则写、已存在且完全相同则复用、已存在但不同则失败不覆盖”的策略；未覆盖任何 dirty 内容。
- 全部旧 6pin、E50 原绝对位置 resolver、网络 guard/PDF 固定 origin 与 5 资源、isolated HOME/appdata/TEMP/profile/skilldir、nativeauth、外层 600s 预算、监督进程/精确 PID+exe+creation+command cleanup 等均未作 token 以外改动。
- 本运行器保持原生 MXC managed 隔离；未触发 MXC 拒绝，也未启动 setup、未切换 legacy、未更改沙箱/审批/ACL、未拆 writer lock。
- 全程未使用 Bash、parallel、Git、搜索、parser、测试、HTTP、服务或 GUI。未执行任何 Git add/commit/rebase/stash/reset/clean/checkout/push，交回仅为本协调目录文件。

## root 后续

root 仍需按已审流程执行真实 GUI 场景；本作者未替跑、未造引用/index/history/rollout/假 GUI。顺序边界为：`prepare.ps1` 生成空根；root 已审 `source-stage --create/verify` 于 `ready` 生成 `relocation-source-dir/relocation.jpg` 后才 `start.ps1`，`start.ps1` 已有 prepared/空 case/未 served 检查；随后真实导入、确认 ref、R01.kinddir 登记、OS/running 精确身份核、同卷兄弟目录 `--move` rename、UI scan missing、原生定位 moved-dir、真实 relocate 持久核、精确 stop。新 server 内模型/OCR/default lifespan/Retainer/forward 均未运行。

## 阻碍

无执行阻碍；未运行或未自测是执行令要求的边界，不是失败。