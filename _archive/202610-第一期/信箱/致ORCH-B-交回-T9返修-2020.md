# 交回 · 线 B → ORCH · T9 返修（回执行令 1721）

- 落件时刻：2026-09-30 20:20 (+08:00)
- 开工前已 `git rebase main`（`49313b1`），无冲突；`a5ffacb` 因已在 main（37328bc）自动跳过。T9 累计范围现为 `07d03ee`、`0530167`、`cae6301`、**`2398428`（本次返修，一个 `T9:` 提交）**，line-B 最新即 `2398428`
- 交付说明：`docs\plan\evidence\T9\交付说明.md` 第 9 节

| 编号 | 做法 | 测试（红绿类号） |
|---|---|---|
| P2-1 | `refresh` 在 `dict(old)` 副本上改，`with con` 提交成功后才赋回 `_state[root]`；任何异常先 `_state.pop(root, None)` 再抛出 | `test_refresh_failure_midway_heals`：第 2 份材料写入抛"磁盘满"，扫描路径、检索前重建路径各一遍，之后新词 1 条、旧词 0 条（19，两层同时去掉才变红） |
| P3-1 | `_locate` 用 `_CELL_SEP` 正则切列（竖线前是反斜杠不算分隔） | `test_cell_citation_with_escaped_pipe_and_row_numbers`：A2 含竖线时"目标词汇"得 B2、"乙"得 A2（20） |
| P3-2 | 命中落在行号列或分隔符上：`_locate` 返回 None，跳过 | 同上：搜"12"只得 C5 真值，第 12 行的行号不算；"13"0 条（21） |
| P3-3 | 归一化去掉控制字符（Cc 且非空白）；FTS 查询的 `OperationalError` 转 `INVALID_ARGUMENT`（信息含 locked/busy 的照常抛） | `test_control_chars_and_bad_fts_query`：`\x00借款合同` 正常命中；只有 NUL 报参数错；引号不闭合报参数错而非 500（22、23） |
| P3-4 | 按主编排规则去掉两个汉字或中文标点之间的空白，位置映射保留；拉丁字母、数字、汉字与数字之间保留。中文标点按原文字判断（NFKC 会把全角逗号变半角）。完全匹配判定 `_literal` 同一规则，跨行命中算完全匹配 | `test_whitespace_between_hanzi_dropped`、`test_hard_line_break_in_page`（criminal-01 现场勘验图文第 1 页，完全匹配，片段为原文）（24、25） |
| NOTE 4 | 补用例 | `test_double_quote_inside_phrase`（26） |
| NOTE 6 | `_connect` 发现 `search_fts` 不在：执行契约 `case_db.sql`（IF NOT EXISTS），状态作废、整案重建 | `test_search_tables_recreated`（27） |
| NOTE 9 | `normalize.py` 说明重写 | — |

- 红测：`evidence\T9\redgreen.txt`，**27/27**（第 19–27 类新增）
- 全量：短路径、深路径（101 字符含中文）各 **775 passed、3 skipped**
- **契约 1.3（注记 1702 要我查）**：rebase 后第一轮全量有 3 例因写死 `"1.2"` 失败——`test_main.py::test_entrypoint` 两例、`test_api_case.py::test_health_without_token`。改成读 `contracts\VERSION` 比较，随本提交；这两个是 T3 测试文件，只动了断言的期望值，产品代码没动。改后重跑全量即上面的结果
- **待主编排定（不在冻结清单，没改）**：Excel 单元格里的 `|` 在材料文本里是 `\|`，所以查询带 `|` 搜不到单元格里的竖线（搜"乙|丙"0 条）。可在建索引时把 `\|` 还原成 `|`、位置映射保留，属检索侧小改
- 按令不做：NOTE 8 记 T18；NOTE 1/2/3/7 记录；NOTE 5 不改 T3
- T10 输入等发令后再读、不写代码
