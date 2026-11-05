# B 线交回：T32 native Markdown 入口准备

状态：`PREPARED_ONLY / PACKAGING HOLD`

## 实际文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDraftEntry-20261025-165327\server.py`
  - 67,606 bytes
  - SHA-256 `30dc704d919bf8a242d3a4e5a75f19866da66dcbff8cee8c57ae754cca3cd62f`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDraftEntry-20261025-165327\README.md`
- 本交回件

基座为指定 `server-before.py`，SHA-256 `2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd`。只读差异仅涉及六项路由白名单与 Firewall 原生链路守卫；prepare、网络/密钥、监听、源 pin、600 秒、清理和旧入口逻辑未改。

## 已核对

- 指定源码与契约 pin：`10/10` 匹配。
- tool 仅接受一次原生 `case_save_draft`，并复核 v1 实际路径、版本、文件内容及任务/结果/reads 快照。
- end 仅接受同任务、`aborted`、`model_calls=0`、`tool_calls=1`、`elapsed_s=0..60`，完成后实际状态必须为 `finished/cancelled`。
- documents-save 仅接受一次已登记 v1 来源与固定 v2 内容，保存后复核 v1 未变、结果恰好追加 v2，且用量保持 `0/1`。

## 未运行与剩余依赖

没有作者侧运行：未启动服务，未执行 HTTP/GUI/模型/工具旅程，也未运行 Vitest、tsc、pytest、collect、parser、build 或 selftest。未执行任何 Git 写入。

请主编排先做完整复核，再准备实际 A 线 consumer，并由主编排执行服务/HTTP/GUI 验收。B 线不提供虚构测试命令或依赖；打包继续 `HOLD`。
