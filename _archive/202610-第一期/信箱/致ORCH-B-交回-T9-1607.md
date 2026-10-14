# 交回 · 线 B → ORCH · T9 全文检索

- 落件时刻：2026-09-30 16:07 (+08:00)
- 提交：`106edef`（代码、测试、证据）＋ `d434e27`（交付说明补全量结果，上一个提交里漏成了占位符）；line-B 最新 `d434e2746245ac0c5170e5a7036570cdc1bc9c14`，接在 `4bb0e40` 之后，未 rebase
- 交付说明：`docs\plan\evidence\T9\交付说明.md`
- 测试：`service\tests\test_search.py`（48 个；G-9 每条一个用例 `test_g9[...]`，另有 `test_g9_report_and_speed`、`test_sqlite_version` 等）
- 验收：G-9 **24/24**（`g9.txt`，5 条 found_as 为扩展匹配）；criminal-01 上 20 次查询平均 **27.4 ms**（含第一次查询时建索引）；返回全部过契约校验；SQLite 3.45.3
- 红测：`evidence\T9\redgreen.txt`，**14/14**
- 全量：短路径、深路径（101 字符含中文）各 **757 passed、3 skipped**（`pytest.txt`、`pytest-深路径.txt`）
- 待你定（注记 `致ORCH-B-注记-T9三处要改已复核文件或契约-20260930-1544`）：①导入时写索引要改 materials.py，现在是检索前按需建；②`case_search` 工具仍指向 T8 的临时实现，切换要改 T8 一行，本提交没切；③契约没有分页参数，没加。没有改 T3/T5/T8 已复核的文件，`ui.py` 只加了 `/api/search`。
