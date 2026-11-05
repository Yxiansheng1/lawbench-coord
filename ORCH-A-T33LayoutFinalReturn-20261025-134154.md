# T33 布局最终修补交回

执行依据：`D:\Lawbeach\lawbench-coord\T33LayoutFinalOrder-20261025-134154.md`

结论：已按白名单完成三处源码 patch。按执行令未运行 helper，未构建、未测试、未启动服务或 GUI。不能据此宣称输入生成或 GUI 通过。

## 实际修改

白名单文件：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300\create-large-source.py`

1. `_prepared_record` 改为从 `root / "prepared.json"` 读取。校验字段改为 `format == PREPARED_SCHEMA`，`expected_head` 校验保持原值；`paths` 必须为对象，其中 `root`、`case`、`ready` 每项必须为对象，并分别用既有 `_same_path` 校验该对象中的 `path` 和 `canonical` 到对应计算目录。旧的 `schema`、`run_root`、顶层 `case`、顶层 `ready` 读取与兼容路径已移除。返回结构仍为 `path`、`bytes`、`hash`、`mtime_ns`。
2. `_check_root_shape` 的基础顶层集合改为准确包含 `case`、`input`、`prepared.json`、`private`；`verify_only` 时仍仅追加 `manifest_path.name`，其余集合相等检查不变。
3. `_safe_regular_file` 保留原有安全链、普通文件和硬链接守卫，并新增 `st_file_attributes & 0x200` 的稀疏文件拒绝。

除以上三处外，未改其它函数、常量、生成器、导入或安全链；未改 native manifest，未创建其它准备件。

## 验证与证据边界

- 本轮仅使用 file patch，未执行修改后的文件。
- 未重演旧开工、安装、调研、全量测试、构建、服务或 GUI，也未运行其它只读检查。
- 既有原始证据未被本轮运行或替换；本轮没有新增运行证据，也没有修改后 SHA 计算结果。
- 源码可读性来自 patch 成功应用，不等于运行时安全链或端到端输入生成已验证。

## 依赖与后续

- 运行依赖真实根目录包含 `prepared.json`，且其投影符合 `T33-host-entry-prepared-v1`、当前 `expected_head` 和本 patch 校验的 `paths` 结构。
- 根目录初始顶层精确为 `case`、`input`、`prepared.json`、`private`；验证阶段再允许 native manifest。
- 本次严格使用只读 Git 语义，未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。交回方式为本文件落盘。
