# B 线 T17 TaskRecord 形状夹具交回

状态：`AUTHORED_NOT_RUN`

执行者：`deepseek-v4.1-flash-1017/max`

## 交付

- 文件：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskRecordShapeFixture-20261101-011812\test_task_record_shape.py`
- 大小：3720 bytes
- SHA-256：`33FFC45C4BF28B3442504EF3C113E569113A111DEF3AB28467EBD2EDD1204E52`
- 基线：`T17TaskRecordShapeFixture-20261101-011812Input\test-before.py`

源码仅做了执行令列出的四处夹具修正：

1. `_contract_error` 改为读取实际属性 `exc.field_path`，新增默认 `expected_field_path="/"`，不保留旧 `path` 回退。
2. 显式非法 route 用例传入 `expected_field_path="/route"`；其余根对象/schema 错误仍使用默认 `/` 和原 schema。
3. 私有案件内的任务元数据文件名统一为 `task.json`，不再使用 `file_task.json` 或 `file_task.legacy.json`；`result.json` 保持不变。
4. `_read` 在 `try` 前快照记录，在 `try` 中返回原始 `TaskStore._read` 结果，并在 `finally` 调用 `_unchanged(path, before)`；意外旧属性错误也会先证明记录未被改写。

测试结构仍为 9 个用例：5 个参数化非对象输入分支，加 4 个独立用例。原用例、断言、真实 schema 门、无 mock 与导入保持不变。

## 验证边界

- 按要求仅做源码编写，未运行 Node、Python、解析器、AST、pytest、collect、build、prepare、应用、HTTP、模型、GUI 或任何键/凭据/环境读取。
- 因此不声称测试已通过；本件只证明已生成指定源码夹具。
- 未修改产品代码、旧测试、guard 或 schema。
- Git 全程只读边界外未操作：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，未处理或修改 index/lock、权限、沙箱、审批或 writer 锁。

## 后续

按正式执行令，测试执行与源码不变性复验留给授权运行环节。
