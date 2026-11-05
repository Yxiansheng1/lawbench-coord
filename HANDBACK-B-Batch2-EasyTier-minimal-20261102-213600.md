# B 线交回：Batch2 EasyTier 最小源码修正

- 执行令：`ORCH-B-Batch2-EasyTier-minimal-source-20261102-213600.md`
- 状态：白名单内源码修正完成，已完成允许范围内的静态回读。
- Git：未执行任何 Git 写入或历史/状态操作。
- 验证边界：按执行令未运行测试、解析器、构建、程序、HTTP、网络或模型；本交回不宣称测试通过，也未新增运行证据。

## 实际改动文件

1. `D:\Lawbeach\lawbench-B\service\lawbench\remote.py`
2. `D:\Lawbeach\lawbench-B\service\lawbench\app.py`
3. `D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py`
4. `D:\Lawbeach\lawbench-B\contracts\api\remote_access.schema.json`
5. `D:\Lawbeach\lawbench-B\service\tests\test_owner_runtime_detection_batch2.py`
6. `D:\Lawbeach\lawbench-B\service\tests\test_owner_remote_p05_20261102.py`

## 实现要点

- 原 `RemoteAccess` 类保持原样，追加 `DetectionOnlyRemoteAccess(RemoteAccess)`。
- 检测器默认核心目录为 `REPO_ROOT / "easytier"`，显式参数优先于 `LB_EASYTIER_DIR`；复用了父类凭据存储与持久开关。
- `status()` 每次检查核心文件，仅返回 `off`、`missing` 或 `no_secret` 等检测状态，不探测网络、不转发、不改变外连地址。
- `start`、`stop`、`servers_changed`、`_restart`、`_run` 均为空操作，`_run_once` 固定返回 `False`。
- `app.py` 仅将生产别名切到检测器；界面把 `missing` 投影为 `RUNTIME_MISSING`，契约两处原因枚举同步追加该值。
- 新增小测试覆盖文件缺失/出现/移除/恢复、接入码有无，以及启动、开关、凭据、服务器变更、停止路径不触发进程、线程或网络动作。

## 限制与待核

- 执行令禁止运行测试；新增及更新的测试只完成源码落盘与人工回读，留待编排按正式边界调度验证。
- 执行令给出的简写 `api/ui.py` 实际落点为 `service\lawbench\api\ui.py`；仅修改该实际文件。
