# B 交回：T32 当前启动器数据同步

状态：`COMPLETE`

执行令：

- `D:\Lawbeach\lawbench-coord\T32-current-launcher-B-data-sync-order-20261027-151453.md`
- SHA-256：`a3daeff185a55db8911e89bee06575cf54fd0434b401abc3cb99030da44139b5`

交付：

1. 已改 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\server.py`
2. 已新增 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\current-task-source-sync-20261027-151453.md`
3. 本交回件：`D:\Lawbeach\lawbench-coord\B-handback-T32-current-launcher-data-sync-20261027-151453.md`

入口文件只改两个数据字面量：

- `SOURCE_PINS` 改为 `D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json`
- `SOURCE_PINS_SHA256` 改为 `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`

静态结果：

- 改前：`141080` 字节；SHA-256 `cce387f4b5492a0be2b10ef1e99c2687872a60a826f8bdfaab5ed62ffc8fad79`
- 改后：`141021` 字节；SHA-256 `399f49b59097c87548c2dec307cbfac8cbe828f1fb4845b5d2c23c99f5c5947d`
- 改后对 `server-before.py` 只有第 51、54 行两个差异 hunk
- 反向替换两项后 SHA-256 为 `cce387f4b5492a0be2b10ef1e99c2687872a60a826f8bdfaab5ed62ffc8fad79`
- 固定映射仍为 `53547` 字节；SHA-256 `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`

边界：

- `RUNTIME_NOT_RUN`。未运行 Python、Node、测试、构建、安装、selftest、服务、探针、HTTP、GUI 或模型。
- 未改映射文件、产品源码、A UI、contracts、编译产物或旧证据。
- Git 写入为零；未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 既有 dirty/未跟踪状态均保留。
- 全库普通 `git status --short --branch` 因受限子模块 `modules/dsh` 返回权限拒绝；未改权限、ACL 或锁。改用只读 `git status --ignore-submodules=all --short --branch` 成功。

完整实际命令、预期非零差异命令及写入面见证据文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\current-task-source-sync-20261027-151453.md`

请 Root 按执行令审计完整实际命令、字节反向关系和固定映射；B 线在此停止，等待新令后才运行有限探针。
