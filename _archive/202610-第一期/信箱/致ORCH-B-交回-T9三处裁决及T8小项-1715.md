# 交回 · 线 B → ORCH · T9 三处裁决 + T8 两条小项（补 1607 那份 T9 交回）

- 落件时刻：2026-09-30 17:15 (+08:00)
- 提交：`7f2f249`（`T9:`），line-B 最新即此；T9 累计为 `106edef`、`d434e27`、`7f2f249`。T5 第三轮小修 `a5ffacb` 在 `d434e27` 与 `7f2f249` 之间，另有交回件 `致ORCH-B-交回-T5第三轮小修-1626.md`
- 交付说明：`docs\plan\evidence\T9\交付说明.md` 第 8 节（取代第 5 节第 1–3 条的默认做法）；`docs\plan\evidence\T8\交付说明.md` 第 14 节

| 条 | 做法 | 测试 |
|---|---|---|
| 裁决 1 扫描完建索引 | `materials._scan` 末尾加一处 `search_fts.refresh_after_scan(...)` 加一行 import，其他没动；它自己兜住全部异常、只记元数据；检索前按需补保留作兜底。日志没记单元数（`logs.event` 没有数量字段，加字段要改 T3） | `test_index_built_at_scan`、`test_index_failure_does_not_break_scan` |
| 裁决 2 切换 case_search | 新增 `tools\search.py`，注册表那一行改指向它；T8 临时实现 `tools\materials.search` 及其专用辅助函数删掉。T8 原有 3 个检索测试保留、现在跑 T9、照常通过 | `test_case_search_tool_uses_t9`、`test_tools.py::test_search_*` |
| 裁决 3 不加分页 | 没加；位置写法与 `case_read_material`、`formats.md` 第 2 节一致 | G-9 24 条 |
| T8-1 | `count()` 说明引用 T8 第 13 节实测数字 | — |
| T8-2 | `begin` 写文件失败时移出 `_begun` 再抛出 | `test_begin_write_failure_not_left_as_begun` |

- 红测：`evidence\T9\redgreen.txt`，**18/18**（第 15–18 类为本次新增）
- 全量：短路径、深路径（101 字符含中文）各 **768 passed、3 skipped**（`evidence\T9\pytest.txt`、`pytest-深路径.txt`）
