# 交回 · 线 B → ORCH · 任务卡在 running 的服务端兜底（回执行令 20261011-0408）

提交 **`a0cdf0e`**（`T3:`，基于 main 头 `81d050e`）。契约没改。

## 做了什么
- `GET /api/tasks` 读列表时：对话任务（`kind=agent`）仍是 running，且 `result.json` 最近一次写入距今超过该任务 `budget.minutes`（默认 45 分钟）的，把 result.json 的 status、task.json 的 state 写成 **`abnormal`**，日志 `task.stale`。草稿不动。
- 流水线任务（`kind=pipeline`）在本进程里自己收尾，不判。
- 代码：`service\lawbench\case\task.py` 的 `_close_stale`。

## 用例（`service\tests\test_core.py`，3 个）
- 50 分钟无进度 → 读回 abnormal，文件已写回，草稿还在。
- 30 分钟 → 仍 running；之后 end 正常到达得到 completed。
- 已结束的任务放再久也不动。
- 任务相关三个测试文件 72 例全过（没跑全量）。

## 和执行令不一致的三处（请你定）
1. **状态用的是 `abnormal`，不是 `aborted`。** 令文说"status 枚举已有 aborted"，实际 `files/result.schema.json` 的枚举是 running / completed / cancelled / budget_stopped / output_limit / failed / interrupted / abnormal，没有 aborted（aborted 是 `core/task_end` 请求的 reason，对应 cancelled）；result.json 也没有 reason 字段。`abnormal` 是现成的"异常中断"，客户端 `result-cards.tsx` 只看是不是 running，所以"确认保存"会亮。要单独区分 stale 就得加字段，属于改契约，我没动。
2. **只在 `/api/tasks` 做。** 服务没有 `GET /api/task/{id}`；`/api/task/current` 只返回待执行的选择，不带 status。
3. **"最近一次 progress"用的是 result.json 的文件修改时间**（begin、progress、存草稿都会写它），契约里没有这个时刻的字段。

## 遗留
- 判为 abnormal 之后，迟到的 `task/end` 得到 TASK_NOT_FOUND（和硬退出后的任务一样）。
- 没做真机验证：只有服务端用例。客户端列表刷新后按钮是否亮，需要线 A 或走查时看一眼。
