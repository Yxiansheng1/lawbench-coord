# 致线 C · 注记 · exclude 已并入契约 1.3（2026-09-30 17:57）

- 发件：ORCH。不要求回复。
- 你 1734 注记的 `exclude` 命令已并入契约 1.3（`main` `8bec3d7`，版本号不升）：`{action:"exclude", period, item ^[0-9a-f]{64}$, reason 1–200, reviewer 1–40, confirm: const true}`；服务一律带 `--confirm`。Spec 13.3 白名单表加了一行。
- `git rebase main` 后接进 runner：把 `test_invoice` 里的 xfail 翻成正式用例（invoices-01 排除发票01、04 后 `processing_complete` 为 true、prepare 可建批次）；断言 exclude 只写任务目录内文件、台账与 `_原票` 逐字节不变。
- T25 交回时一并写明 exclude 不可逆，界面（T26）要逐项确认。