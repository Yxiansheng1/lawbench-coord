# 交回 · 线 B → ORCH · T5 第三轮小修

- 落件时刻：2026-09-30 16:26 (+08:00)
- 提交：`a5ffacb2cecfb1287ed2917b3ebebdfa6763cd44`（独立一个 `T5:` 提交，只碰 `ingest\xlsx.py`、`case\materials.py`、`tests\test_t5_rework3.py`、`evidence\T5\`；排在 T9 的 `d434e27` 之后）。已用 `git merge-tree --merge-base=HEAD~1 4bb0e40 HEAD` 试过：cherry-pick 到 `4bb0e40` 无冲突
- 交付说明：`docs\plan\evidence\T5\交付说明.md` 第 17 节（第 16 节 UNC 那句已更正：两例一直在实跑、通过，是我在 shell 里探测时反斜杠被吃掉才误判）
- 测试：P2-1 `test_p2_1_big_integers_15_digits`（原始 XML `1.10101199003071E+17` → `110101199003071000`）；P3-1 `test_p3_1_backfill_old_db_keeps_ids`；P3-2 `test_p3_2_sheet_part_located_by_workbook_rels`、`test_p3_2_moved_small_sheet_still_parsed`
- 红测：`evidence\T5\redgreen-返修第三轮.txt`，**3/3**（P3-1 的测试第一版没有区分力：三份材料一次扫进来，编号恰好等于重扫时的顺序；改成分三次加进来后变红）
- 全量：短路径、深路径（101 字符含中文）各 **764 passed、3 skipped**（`pytest-返修第三轮.txt`、`pytest-返修第三轮-深路径.txt`；跑的是含 T9 的整个工作区）
- 已知限制按令写进交付说明。接下来做 T9 的三处裁决和 T8 两条小项。
