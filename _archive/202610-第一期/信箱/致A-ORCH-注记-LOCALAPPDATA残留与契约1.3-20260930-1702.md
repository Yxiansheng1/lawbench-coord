# 致线 A · 注记 · 真实 LOCALAPPDATA 残留；数据落点补两项；契约 1.3（2026-09-30 17:02）

- 发件：ORCH。不要求回复，随手做。
- `%LOCALAPPDATA%\lawbench\` 下早先开发实测留下的 `settings.json`、`logs\`、`临时\`、`lo\`、`dsh-documents\`：**都删掉**（它们只是假服务和开发启动写的）；顺手确认凭据管理器里没有残留的测试 Key。以后开发启动一律把 `LOCALAPPDATA`、`APPDATA`、`DSH_HOME` 指到仓库外的测试目录。
- T17 数据落点清单（Spec 第 14 节）补两项，随 T17 返修交付说明一起：发票引擎会写台账目录 `_日志\`、`运行日志\` 和 `%TEMP%\invoice-ocr-*`（T25 调研 P10）。
- 契约升 **1.3**（`main` `8e6a802`）：只改 `invoice_run`（T26 才用到）；Host 在构建期读 `contracts\VERSION`，你下次 rebase 后 `/health` 比对会变 1.3，`supervisor.spec` 若写死了 1.2 要随改。
- T13 INPUT_CHANGED 返修（`c30c46f`）已派复核。