# T32 当前启动器数据同步交回

工单：T32 当前启动器身份对齐（A 线数据同步）

状态：允许范围内的两文件、四字面量替换已完成并通过反向逐字节核验；交回后停止。

改动：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\prepare.ps1`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\start.ps1`
- 新增正式说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\current-task-source-sync-20261027-151453.md`

核验：

- NativeEntry 旧值 `cce387f4…8fad79` 已替换为 `399f49b5…f5c5947d`。
- source-pins 旧值 `5856ffbf…9d7835` 已替换为 `5afec662…667168cf`。
- 两文件均与“根快照仅替换两对 SHA”的预期字节序列完全相等，文件长度、无 BOM 状态和 LF 行尾保持不变。
- 新 SHA-256：`prepare.ps1` 为 `b3734b026a30673a985c1f32c622afeb6350859e3c1292fdd8b717210705d72a`；`start.ps1` 为 `7b057d7fc65f58d907a5911b1b8aa7f11a7d1201452b0e7c828a36ae21e4a6ed`。

运行与 Git：

- 未运行解析器、测试、构建、安装、prepare、serve、探针、HTTP、GUI 或模型命令；状态为 `RUNTIME_NOT_RUN`。
- Git 严格只读；本运行没有提交，因此无待交回提交 SHA。
- `git status --short --branch` 因子模块 `dsh` 路径权限拒绝而失败；按要求只记录阻碍，未改权限、ACL、锁或审批。

停点：数据同步已交付；后续 fresh prepare/parser/runtime 由主编排在其独立验收步骤决定。打包仍为 HOLD，全项目仍未完成。
