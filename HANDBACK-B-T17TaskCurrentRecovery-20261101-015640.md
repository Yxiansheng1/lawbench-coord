# B 线交回：T17 TaskStore.current / GET /api/task/current

状态：AUTHORED_NOT_RUN

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskCurrentRecovery-20261101-015640\test_public_task_current.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskCurrentRecovery-20261101-015640\bootstrap.py`

## 精确范围

- 新增一个 original 公共恢复测试：六个参数组分别覆盖坏记录 `None`、`[]`、`"bad-record"`、`17`、`True`，以及旧任务缺 `route` 的一组；每组都验证真实私有文件系统上的 `TaskStore.current` 选择与原始 `/api/task/current` GET 路由。
- 测试按内置 SHA256 断言加载获批且未改的 task-list fixture，仅复用其 `CASES`、`TASK`、`_json`、`_snapshot`，不调用旧测试。
- 每组使用独立 `tmp_path`、私有案件根和合成输入字节；写入并校验 `cases.json`、一条 good pending task 和一条坏 task；预期选择固定为 good 任务，旧任务缺省路由为 `local`，新任务保留 `external`。
- 同时直调 `TaskStore.current` 与原路由 ASGI GET，校验 200、精确响应体和 `api/task_current.schema.json#/$defs/response`。
- 保留 accepted fixture 的异常聚合、AnyIO worker 最长 2 秒自然汇合、client/transport 关闭、`logs.close()` 与全量字节/SHA/mtime 快照不变检查；额外确认 legacy good task 文件仍无 `route`，坏标量原样保留。
- `bootstrap.py` 逐字节复制获批原 bootstrap，仅将主调用 `pytest_args` 的最后一个 `str(tests_dir)` 替换为上述测试文件的精确绝对路径字符串和 `--noconftest`；其余 guard、拒绝规则、进程/网络/文件系统/环境边界、T37 排除与清理逻辑不变。

## 未改与未跑

- 未修改产品代码、schema、旧 fixture、原 bootstrap、served root 或任何其他源码/契约。
- 源码作者未运行 Node、Python、parser、AST、pytest、collect、build、prepare、app、HTTP、model、GUI 或其他 runtime，也未运行 bootstrap 或自测。
- Git 操作严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 本文件只声明源码已编写，不声明测试、全量回归或发布通过。后续验证须由 root 在既有隔离与执行令边界内进行。
