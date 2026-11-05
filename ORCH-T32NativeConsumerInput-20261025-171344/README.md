# T32 native Markdown 入口准备

状态：`PREPARED_ONLY`。本目录只提供待主编排复核的入口源码，未启动服务，未执行 HTTP、GUI、模型或原生工具流程，也不构成验收。

## 文件与身份

- `server.py`：67,606 bytes，SHA-256 `30dc704d919bf8a242d3a4e5a75f19866da66dcbff8cee8c57ae754cca3cd62f`。
- 基座：`D:\Lawbeach\lawbench-coord\ORCH-T32NativeDraftInput-20261025-165327\server-before.py`，SHA-256 `2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd`。
- 基座到当前 HEAD 的既有源码/契约 pin 共 10 项，准备时逐项复核为 `10/10` 匹配。

## 路由

入口只放行以下六项：

```text
GET  /health
POST /api/case/open
POST /core/task/begin
POST /core/tool
POST /core/task/end
POST /api/documents/save
```

没有 UI、WebSocket、代理、进度、上下文、导入、OCR、设置写入或模型路由。

## 原生写入链

- `/core/tool` 只接受已捕获任务号、`case_save_draft`，以及固定标题 `T32SyntheticDraft` 和固定 v1 LF 正文；认领后仅接受原生 200 响应及实际 v1 路径/版本。
- v1 正文为 54 bytes，SHA-256 `cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae`。
- 结束门要求 v1 实际存在，任务目录仅含三个 JSON 和 `草稿` 目录，目录内仅含 v1；文件均为普通小文件，无重解析点、硬链接或稀疏标记。
- `/api/documents/save` 只接受已捕获案件、原生登记中的 v1 路径和固定 v2 LF 正文；只接受原生返回的同一任务及 v2 路径/版本。
- v2 正文为 61 bytes，SHA-256 `7d090ef6fbda9e38b17f1befe5e1c4a2bb8f6db2c2bf45031eb70e52e19a22cc`；保存后复核 v1 原文不变，结果清单恰好追加 v2。

## 完成语义与边界

任务文件状态为 `finished`，结果状态为原生 `cancelled`，用量为 `model_calls=0`、`tool_calls=1`，`elapsed_s` 限 0..60 秒。它不是模型完整成功，也不伪造模型调用。

Firewall 对 tool、end、documents-save 均先做粘性一次性认领；无效载荷在认领前拒绝，失败、401 或畸形成功响应不会释放认领。材料、引用和用量都从本地原生结果读取，日志台账只保留方法、路径、状态、处置与耗时等元数据。

## 验证与遗留

本次只做了只读源码差异与 SHA 核对。按执行令，没有运行 service、prepare、Vitest、tsc、pytest、collect、parser、build 或 selftest，没有写入 Git。B 线未提供 consumer/test，也未引入或伪造 DSH/Ajv 依赖；实际消费者由主编排复核后准备。打包继续保持 `HOLD`。
