# B 线交回：T17 任务列表恢复

## 交付状态

状态：`AUTHORED_NOT_RUN`。已按正式执行令编写测试与隔离 bootstrap，**未执行**。本件只记录作者编写结果，不宣称测试通过、接口通过、全量回归通过或鉴权通过。

| 项目 | 数量 |
|---|---:|
| 授权参数场景 | 6 |
| 已运行场景 | 0 |
| 通过 | 0 |
| 失败 | 0 |
| 跳过 / xfail | 0 |

## 文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskListRecovery-20261101-013252\test_public_task_list.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskListRecovery-20261101-013252\bootstrap.py`
- `D:\Lawbeach\lawbench-coord\HANDBACK-B-T17TaskListRecovery-20261101-013252.md`

测试覆盖 `None`、`[]`、`"bad-record"`、`17`、`True` 五个坏任务值，以及有效 finished task 配 `null` result 的第六分支。每个私有 `tmp_path` 均从 approved 模板复刻一个正常 finished task、completed result、实际 draft 字节和一个不同 task_id 的坏记录；调用原始 `CaseRegistry` 与仅调用 `TaskStore.list`，再经原始 `/api/tasks` Route 做内存 ASGI GET。运行前后比较全部种子文件字节、SHA-256 和 mtime，并检查 normal 结果字段及响应体。

## 边界与证据声明

- bootstrap 仅改 `main()` 的 `pytest_args`：测试目标改为本目录新测试绝对路径，并加入 `--noconftest`；其余守卫与源码保持逐字不变。
- 未执行 Node、Python、pytest、收集、构建、应用、HTTP、模型、GUI、环境、凭据或 Git。
- 未读取正式执行令与两份 authorized 输入之外的仓库/环境/进程/元数据。
- HTTP 仅设计为 Starlette + `httpx.ASGITransport` 的内存请求，不声称覆盖默认应用、lifespan、鉴权中间件、GUI、原生程序、模型或生产网络。
- 未调用 `CaseRegistry.open`、`check_root`、`forget`、SQLite 初始化或其他 store 方法；未使用 mock、monkeypatch、skip、xfail 或降级断言。
- 未执行任何 Git 写操作；工作树其他内容未改动。本轮按令不核验 Git 状态。

## 遗留

按执行令由允许的运行方在离线、私有、受守护环境中执行这一份 6 场景测试；截至本交回件，行为和结果均未验证。
