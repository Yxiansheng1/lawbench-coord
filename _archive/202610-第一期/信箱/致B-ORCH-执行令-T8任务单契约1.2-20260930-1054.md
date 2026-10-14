# 执行令 · 致线 B · 任务单改为契约 1.2 的做法（N37 用户已定），并入 T8 返修

- 发件：ORCH　收件：B　落件时刻：2026-09-30 10:54 (+08:00)
- 依据：`OWNER-N37按推荐-20260930-1054.md`。本令**取代** `致B-ORCH-执行令-T8返修补充-任务单作废-20260930-0608.md`（那份"新建时作废旧单"的做法不要做了，改成下面这个），其余 T8 返修清单不变。

## 契约 1.2 的内容（`main` 上 `contracts\`，VERSION 1.2；Spec 20.12、9.2、4.3 已改）

- `POST /api/task`：改为**设置该会话当前的选择**（entry、skill、inputs、params）。同一会话只保留最新一张待执行的任务单（新的顶掉旧的）；**执行时不消耗**——之后每条消息都按它运行，直到下一次设置或清除。entry 与 skill 都为 null 表示自由对话。字段没有增减。
- 新增 `GET /api/task/current?session_id=`：返回 `{selection: null | {task_id, entry, skill, inputs, params, updated_at}}`。界面每次显示之前从这里读，不在本地记。
- `/core/task/begin`：按该会话当前的选择新建一个执行中的任务（复制一份），待执行的那张**不消耗、不删除**；没有就按自由对话默认值新建。
- `/api/tasks` 不变：仍只列已开始执行的任务。
- `contract_version` 升 1.2：服务的 `/health` 要回 1.2，Host 启动时比对的也是 1.2。

## 服务这一半要做的（编号 P2-7，替换原 P2-7）

1. `POST /api/task`：同一会话已有待执行的任务单时，用新的顶掉旧的（删掉旧的那张目录——它还没执行过，里面只有任务单本身；删之前核对它是待执行、属于同一会话、目录里没有草稿和读取记录）。任何时候同一会话最多一张待执行的。
2. 新增 `GET /api/task/current?session_id=`，按契约 `api/task_current.schema.json`。
3. `/core/task/begin`：按当前的选择**复制**出一个新的执行中任务（新编号），待执行的那张不动；没有就按自由对话默认值新建。执行中任务的 `task.json` 记下它来自哪张选择（不加契约字段，用现有字段即可；写不进就不写）。
4. `/api/tasks` 继续只列已开始执行的（有 `result.json`）；补测试守着。
5. `/health` 的 `contract_version` 回 1.2。契约在 `main` 上，`line-B` 需要 `git rebase main`（这次允许，rebase 前后各记一次 HEAD 写进交付说明）。
6. 测试：设 A、设 B、begin 取到 B、再 begin 仍取到 B；切回自由对话后 begin 按自由对话；`task/current` 三种返回；旧的待执行单被顶掉后目录不在；执行中和已结束的不受影响；别的会话不受影响。红测。

## 另

之前给你的注记 `致B-ORCH-注记-任务单作废不留result-20260930-0806.md` 的要求（被顶掉的任务单不留 `result.json`、不出现在 `/api/tasks`）继续有效。