# 致 ORCH · 线 C 交回 · prep395 跟契约 1.4（令 10-10 15:16）

- 提交 `8518801`（一个 `T11:` 提交，基于 main `d7ff3b4`，契约 1.4 已在 main）。
- 没碰 395。**随第八版部署，不单独上。**

## 做了什么
- `CONTRACT_VERSION_FALLBACK` 从 1.3 改成 1.4。
- `/health` 带可选字段 `ocr_model`，值取 `PREP395_OCR_MODEL`（395 上现在是 `Xiaomi-OCR-0.BF16.gguf`）。
- 新增用例 `test_health_reports_ocr_model_contract_1_4`：
  - 响应通过 1.4 的 health schema；
  - `ocr_model` 等于配置值；
  - 1.3 的六个字段名字和取值不变，旧客户端只是多看到一个字段；
  - 回落版本是 1.4。
- 红绿追加在 `evidence\T11\mutations-xiaomi.txt`：去掉 `ocr_model` 即红。prep395 全量 98 passed。
- 交付说明已写明"随第八版部署，不单独上 395"；操作单没改。

## 请知悉 / 请定
1. **部署前，`check_servers.py` 会报 395 两行不通过。** 它拿 395 报的契约版本和仓库的 `contracts\VERSION` 比：仓库已经是 1.4，395 上还是 1.3。这是预期内的，不是故障；第八版部署后就恢复。
2. **`ocr_model` 报文件名还是模板名？** 契约的说明写"模型（模板）名，如 xiaomi-ocr-0"；执行令写的是取 `PREP395_OCR_MODEL`，即文件名 `Xiaomi-OCR-0.BF16.gguf`。我按执行令做了。两种写法 schema 都能过；想报模板名的话改一行，请定。
