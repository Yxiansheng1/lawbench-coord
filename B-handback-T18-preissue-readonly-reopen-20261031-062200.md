# B 线交回：T18 Preissue 只读重开

状态：**源码与正式说明已写入，等待 Root 反向审计和单独执行实际只读双开。**

范围仅为 `ORIGINAL_FAILED_PREISSUE_JSONL_READONLY_REOPEN_ONLY`。旧的 Preissue 业务失败报告、消费者、历史与 58 个既有事件均未改写；固定原始计数为 59 行、58 个事件。旧业务状态仍为 FAILED，不构成 Skill 质量通过，也不宣称 T18 整体通过。

已准备：

- `docs/plan/evidence/T18/PreIssueReadonlyReopen-20261031-062200/readback.mjs`
- `docs/plan/evidence/T18/PreIssueReadonlyReopen-20261031-062200/literal-inputs.json`
- `docs/plan/evidence/T18/PreIssueReadonlyReopen-20261031-062200/README.md`

新消费者只使用已验收基线的 imports、guard、invariant、pin、行解析、会话读取、安装/恢复和受限错误辅助逻辑；未加入新会话、新历史、写修复、迁移、回调、服务端、模型或 GUI 路径。任务身份检查已按本切片收窄，不要求空 `inputs` 或材料范围；事件只按实际 `data.source.rpcId` 做存在性匹配。

作者阶段未运行 Node 或新消费者，因此实际双开头、事件相等、句柄关闭和上下文释放均为**待 Root 执行**，不能提前记绿。未执行 Git 写入，未使用 stash、reset、clean、checkout、add、commit、rebase 或 push。

建议 Root 完成源码反向审计后，只执行一次本消费者：期望 stdout 给出 `purpose=ORIGINAL_FAILED_PREISSUE_JSONL_READONLY_REOPEN_ONLY`、`task_identity=true`、`header_equal=true`、`event_equal=true`、`read_count=2`、两次关闭与上下文释放均为真，并以零退出码结束。
