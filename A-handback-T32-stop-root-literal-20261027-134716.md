# A 交回：T32 stop 根目录静态修正

状态：`NOT_RUN`。停止启动器只改了 runs 根目录字面量；没有运行停止流程，也没有启动或验证新 GUI。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 把停止启动器唯一一处旧 runs 根目录改成新 prepared root 对应的 runs 根目录；其余脚本逻辑未改。新增本交回和一份静态核验说明。 |
| 目标是什么 | 让新 GUI 的停止入口接受它的合法 run root，同时继续按精确进程身份、端口和报告条件停止。最终目标仍是新 GUI 的实际删除流程通过；本次离该目标还差最终会话复核和真人动作确认。 |
| 在等什么 | 等负责最终复核的会话按正式令做一条精确字面量反向核对、脚本解析审阅和完整命令审阅。该信号到达后，才进入实际 GUI 删除验证。 |
| 卡在哪 | 静态交回没有卡点。当前执行边界不允许运行任何 GUI、脚本、解析器、测试或产品服务；首次常规工作树检查另遇子模块权限拒绝，但没有影响目标文件核对，也未尝试修复权限或锁。 |

## 依据与验证

- 旧完整路径改为新完整路径后，目标脚本从 7128 字节变为 7133 字节。
- 字节核验确认两条完整路径各出现 1 次，前置 214 字节和后置 6833 字节逐字节相同，没有发现字面量之外的差异。
- `prepare.ps1`、`start.ps1` 和原说明与顾问审阅副本逐字节相同，本次未改。
- 目标证据目录仍整体未跟踪，原有大量未提交改动未被清理或覆盖。
- 没有执行任何 Git 写操作，也没有执行 Python、Node、解析器、测试、构建、prepare、start、serve、探测、HTTP、GUI、模型或安装。
- 所有命令成功、非零、验证器误报和写入面都记录在静态核验说明中。

## 关键路径

- 唯一执行令：`D:\Lawbeach\lawbench-coord\T32-stop-root-literal-order-20261027-134716.md`
- 静态核验说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\stop-root-literal-20261027-134716.md`
- 静态核验说明 SHA-256：`d89f5a7568ed4f6fa160e47b62e6ec668f9a76bdfa8f275d63fcd141b0a3aa05`
- 修正后停止启动器：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\stop.ps1`
- 修正后停止启动器 SHA-256：`5a156f2b71a81d36e3494c689320dd2259e5e2f8e1998af49c28fee92ae9d675`
- 顾问审阅材料：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32StopRootLiteral-20261027-134716`
- 旧 GUI 原始证据：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveGui-20261027-115753`
- 新 prepared root：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\runs`

## 未做与降级

- 未运行停止启动器，未启动新 GUI，未重演旧成功证据或 fresh prepare。
- 未做脚本解析、测试、构建、打包或产品运行验证。
- 未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push。
- 打包保持 `HOLD`；第一道验收关仍未完成，本次不宣称 GUI 通过。

## 下一步建议

当前只剩最终复核后的实际 GUI 动作。负责最终复核的会话先独立核对这一条字面量差异、解析脚本并审阅完整命令记录；随后在实际删除动作时请人现场确认，再运行新的 prepared root。静态脚本已经没有本执行器可继续推进的写入项。

Response ID: T32-stop-root-literal-20261027-134716

Response log path: D:\Lawbeach\lawbench-coord\A-handback-T32-stop-root-literal-20261027-134716.md
