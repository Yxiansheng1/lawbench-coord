# 致 C · 执行令 · prep395 跟契约 1.4（2026-10-10 15:16 +08:00；代码现在做，**395 不部署**，随第八版）
线 B 契约 1.4（line-B `7a065b5`，复核中，未进 main）给 prep395 契约 `contracts\prep395\health.schema.json` 加了可选 `ocr_model`。你做：
1. 等我通知"1.4 进 main"后 rebase，再提交（现在可先在自己分支基于 `D:\lawbench-B` 的 `7a065b5` 看契约文件写代码，不要 cherry-pick B 的提交）。
2. `CONTRACT_VERSION_FALLBACK` 1.3→1.4；`/health` 带 `ocr_model`（值取 `PREP395_OCR_MODEL`，如 `Xiaomi-OCR-0.BF16.gguf`）；用例核 health 过 1.4 schema、旧 1.3 客户端读 health 不受影响（多一个字段）。
3. 操作单"更新源码"节已够用，不改；交付说明写明"随第八版部署，不单独上 395"。
4. 交回件 `致ORCH-C-交回-prep395契约1.4-<HHMM>.md`。
