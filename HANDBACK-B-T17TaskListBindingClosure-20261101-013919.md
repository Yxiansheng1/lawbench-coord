# 交回件 — B线 T17 TaskListBindingClosure

- 交回编号：HANDBACK-B-T17TaskListBindingClosure-20261101-013919
- 执行令：`ORCH-B-T17TaskListBindingClosure-20261101-013919.md`（唯一任务与接续事实入口）
- 输入：`T17TaskListBindingClosure-20261101-013919Input\approved.json`、`...\test-before.py`
- 状态：**SOURCEONLY / AUTHORED_NOT_RUN**（本运行器未执行任何 Python、pytest、收集、构建、HTTP 或应用启动动作）

## 1. 改动落点

唯一被编辑的文件（既有、尚未服务的测试）：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskListRecovery-20261101-013252\test_public_task_list.py`

- 行数：152（≤ 180 上限）
- 字节数：8262
- SHA256：`7a2d01fd6509c7a53d578d0e03109512c685ccf08a9288ab0ab48f5a903d45d2`

未触碰：`bootstrap.py`、`bootstrap.py`（FullRegression 副本）、任何产品源码、guard、SDK、契约文件、`contracts\*.json`、工单集、事实索引。
原 partial 测试的备份（协调目录 `test-before.py`）保持原样，未被覆盖。

## 2. 修复明细（逐条对应执行令）

1. **导入改为规范路径**：删除全部 `ImportError` 回退分支与不存在的路径。
   - `from lawbench.case.registry import CaseRegistry`
   - `from lawbench.case.task import TaskStore`
   - `from lawbench import contracts, logs`
   - `from lawbench.api import ui`
   - 保留 `from lawbench.config import Config`（原样）
   - 删除 `from lawbench.ui import routes as ui_routes`（改用 `ui.routes`）
2. **删除 schema 推断助手**：原 `_schema(payload)`（遍历 `vars(schemas)`、`model_fields` 匹配、`model_validate`）整函数删除，改为直接调用原 `contracts.validate(schema_path, pointer, data)`，schema 文件显式指定：
   - `contracts/files/cases.schema.json`，指针 `#`
   - `contracts/files/task.schema.json`，指针 `#`
   - `contracts/files/result.schema.json`，指针 `#`
   - 无 `inference` / `model_validate` / `fallback` / `model_dump` 残留。
3. **两个种子任务状态**：`TASK` 模板 `state` 由 `"pending"` 改为 `"finished"`；`bad_result_null` 分支的 `bad_task` 同样为 `"finished"`。其余模板内容与 6 个参数化用例（`bad_value` 五种 + `bad_result_null` 一种）保持不变。
4. **原 `TaskStore.list` 返回值**：断言原行为为 dict，键恰为 `tasks`，值恰为期望 list：
   `assert list(actual) == ["tasks"]` 且 `assert actual == {"tasks": expected}`；不再做 list 自动转换、不再 `model_dump`。
5. **HTTP 响应**：断言原始信封 `{"ok": True, "value": {"tasks": expected}}`（不是裸 list），并对 HTTP body 本身做契约校验：
   `contracts.validate(contracts/api/tasks_list.schema.json, "#/$defs/response", body)`。
6. **路由选择**：直接使用 `ui.routes(state)` 返回的真实 `list[Route]`，不使用 `getattr` / `routes` 属性回退；筛出 `path == "/api/tasks"` 且 `"GET" in route.methods` 的路由（兼容 Starlette 自动附加 HEAD），并断言 `len(matches) == 1`。
7. **清理语义**：删除局部 `logs = None` 影子变量；`finally` 中无条件执行原 `logs.close()`，其异常仍写入 `cleanup_failure` 并参与最终 `BaseExceptionGroup`，保留清理失败上报。
8. **保留项**：原 `httpx.ASGITransport`（无鉴权声明）、`client` 关闭、`transport` 关闭、新建 AnyIO worker 的 `join` 超时 ≤ 2 秒、`_snapshot` 前后比对每个种子文件的字节 / SHA / mtime 不变、坏文件保留（不清除、不重写）。

## 3. 有效计数

| 项 | 数量 |
|---|---|
| 被编辑文件 | 1 |
| 被删除的导入回退分支 | 2（`lawbench.CaseRegistry/TaskStore`、`lawbench.schemas`） |
| 显式 `contracts.validate` 调用点 | 5（cases×1、good task×1、good result×1、bad task×1、HTTP body×1） |
| 保留的参数化用例 | 6 |
| 删除的辅助函数 | 1（`_schema`） |
| 未新增抽象 / helper 框架 | 0 |

## 4. 偏离与说明

- **未运行**：按执行令禁区，本运行器未执行 Python 解释器、parser/AST、pytest 收集、build、prepare、应用启动、HTTP、模型、GUI、环境变量、Key/凭据或 Git 读写。因此本文件的结论均为**静态源码层面**（SOURCEONLY），不是运行结果（AUTHORED_NOT_RUN）。
- **指针写法**：seed 级校验使用根指针 `#`；API 响应使用执行令指定的 `#/$defs/response`。
- **`REPO` 路径**：`Path(__file__).resolve().parents[5]` 与 `CONTRACTS = REPO / "contracts"` 原样保留未改。
- **未提交**：本运行器授权为 Git 严格只读，未执行 add/commit/rebase/stash/reset/clean/checkout/push，也未暂存。交回以本协调目录文件为准。
- **旧作业**：旧 deadline 作业未重开、未触碰。

## 5. 待主编排接手事项

- 由主编排执行完整源码审查 / 静态 guard 反向检查 / raw 与 setup 清理复核，随后再跑**一次全新的实际 6 用例**。
- 本运行器未对 `contracts.validate` 的实际指针语义、`lawbench.logs.close` 的真实可用性、`ui.routes(state)` 的真实返回类型做运行时确认——这三点属于静态推断，需由主编排的实际执行验证。
