# B 线交回件：T17 任务记录形状 RED

状态：`AUTHORED_NOT_RUN`

## 交付

- 新增测试：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskRecordShapeRED-20261101-011541\test_task_record_shape.py`
- 用例计数：pytest 收集口径 9 例，含 5 例参数化非对象坏值、1 例完整样例、1 例旧版样例、1 例显式非法路由、1 例结果 `null`。
- 预期判别：5 例 OLD RED，4 例控制/兼容 PASS。作者未运行测试，不把预期判为实测结果。
- 测试模块 SHA-256：`815f6855eb6d4a2dc5ebb9322bf60cb98ec0a456044252e09c08b12a1799d65c`
- 测试模块字节数：`3601`

## 约束遵循

- 只读正式执行令与批准夹具；未读取或改动产品源码、既有测试、守卫和契约。
- 测试调用原始 `TaskStore._read(str(root), rel, schema)`、原始 `TaskStore.rel(...)`，以及未打补丁的 `contracts.read_json` / `contracts.validate`。未使用 mock、monkeypatch、HTTP、线程、模型或凭据。
- 所有测试记录均写入本次 `tmp_path` 下的合成夹具，未手工清理或删除。
- 每例在调用前后核对记录字节、SHA-256 和 `st_mtime_ns`；断言不写回文件。
- 非对象坏值要求抛 `contracts.ContractError`，因此旧实现的 `AttributeError` 不会被误收。
- Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 偏离与风险

- 无授权范围外的修改。
- 未运行 pytest、Python、解析器、构建或任何运行时验证。结论仅为作者静态编写结果。
- 验证器异常属性读取兼容 `path` / `field_path` 两种现有命名，但均明确要求值为 `/`。
- 本交回不含运行证据；RED/GREEN 仅在委托方授权运行边界内实测。
