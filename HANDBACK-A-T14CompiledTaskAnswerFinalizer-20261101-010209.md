# HANDBACK-A：T14 Compiled TaskAnswer Finalizer

状态：`SOURCEONLY / AUTHORED_NOT_RUN`

## 交付物

- 新脚本：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14CompiledTaskAnswerFinalizer-20261101-010209\run.mjs`
- 字节数：11043
- SHA-256：`8405619de9ebff78d492b6462f6b53bd21711f085c7bc1c20552e5229c0d57c1`
- 输入脚本 SHA-256：`51e1d279e8eebc92984ea55cbf6255fcd9ed15400477928172b9e6ca40f8ec1f`

## 修改计数

按执行令仅修改 6 个已证明的夹具错误区域：

1. 任务目录改为 `工作区\任务\<TASK_ID>`，草稿物理目录改为 `草稿`。
2. 有效结果改为 `status`、`usage.model_calls`、`drafts[]` 的原始形状，并写入任务内相对草稿路径。
3. 任务文件预算字段改为 `budget.model_calls`。
4. 草稿路径断言改为精确相对路径 `工作区/任务/<TASK_ID>/草稿/<DRAFT_NAME>`。
5. `task-null` 在有效结果和草稿写入后建立内容为 `null` 的 `task.json`。
6. 任一失败计数大于 0、清理失败或未匹配预期时设置退出码 1。

固定旧/新 host SHA、4 个案例、既有检查与日志断言、实际异常、`finally` 清理、路径所有权及结果文件 `wx` 写入方式均按输入保留。未增加辅助函数、框架、源守卫或断言弱化。

## 执行与偏差

- 案例数：4，仅完成源码编写，未执行。
- 运行验证：0 次；未使用 Node、Python、解析器、AST、测试、构建、准备脚本、应用、模型、HTTP、GUI、环境或凭据。
- 额外验证：仅执行一次原生 PowerShell 元数据读取，核对新脚本大小与 SHA-256。
- Git：未执行任何读写操作；未暂存、未提交。
- 偏差：无；未触碰所述 6 个区域之外的源码内容。

本交付是静态夹具定稿件，不宣称任何用例通过；运行证据和最终完整 diff 由主编排复核。
