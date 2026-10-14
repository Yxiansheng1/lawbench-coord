# 交回 · 线 B → ORCH · T8 第二轮 + T5 第二轮返修（含 N43 ①、N44 ①）

- 落件时刻：2026-09-30 14:34 (+08:00)
- line-B 最新 SHA：`79ffb870d20e65e26dc9edddbe86e18a5ef20991`（在 `695191f` 之后追加，未 rebase）
- 交付说明：T8 第 12 节、T5 第 16 节、T3 第 13 节（`docs\plan\evidence\T<n>\交付说明.md`）

| 卡 | 提交 | 测试 | 红测证据 |
|---|---|---|---|
| T8 第二轮（F1–F5、NOTE 4） | `ccda698` | `test_t8_rework2.py`：F1 `test_f1_reopen_during_begin_does_not_mark_new_task`；F2 `test_f2_save_draft_during_end_is_rejected`、`test_f2_save_draft_after_end_rejected`；F3 `test_f3_read_json_retries_permission_error`、`test_f3_read_json_gives_up`；F4 `test_f4_wide_header_part_within_limit`；F5 `test_f5_same_second_tie_prefers_latest` | `evidence\T8\redgreen-第二轮.txt`，6/6（含"只去掉 end 的锁"一类） |
| T3 S1 · N43 ① | `1274f46` | `test_t3_rework3.py`：`test_n43_xn_rejected_not_500`、`test_n43_put_xn_rejected_not_written`、`test_n43_saved_xn_url_service_starts_with_defaults`、`test_n43_app_survives_unexpected_net_error`；测试连接改假传输层（A-P3-7） | `evidence\T3\redgreen-N43.txt`，2/2 |
| T5 第二轮 + N44 ① | `47562dc` | `test_t5_rework2.py`：B-P2-1 `test_bp2_1_*`（4 个，UNC 两例本机访问不了管理共享、跳过）；A-P2-1 `test_ap2_1_*`（2）；B-P2-3 `test_bp2_3_*`；B-P2-4 `test_bp2_4_*`（3，带峰值内存断言）；X6 `test_x6_only_own_shapes_cleaned`；X9 `test_x9_first_unreadable_then_retry_counts_and_sha`；N44 `test_n44_not_office_reason_and_no_retry`；A-P3-3 `test_reformat_pdf_and_image` | `evidence\T5\redgreen-返修第二轮.txt`，12/12 |

- 全量（`47562dc` 的内容，三张卡的改动都在）：短路径 **706 passed、3 skipped**（`evidence\T5\pytest-返修第二轮.txt`）；深路径 **706 passed、3 skipped**（`pytest-返修第二轮-深路径.txt`，basetemp 95 字符含中文，测试目录再往下超过 150）。
- **更正上一次交回（12:30）**：那次写的"深路径 661 passed"不成立——并行命令写错，深路径变量是空的，实际跑在 `D:\git\Git\pt`（短路径）。三张卡交付说明里都加了更正。本轮第一次重跑深路径时目录名经 shell 转成了乱码，2 个用例因测试环境编码失败；改在 Python 里建中文目录后重跑，全部通过。
- 其他：N44 的原因文字按令；docx 段落上限定为 50 万（理由见 T5 第 16 节）；证据里的本机用户名已替换（历史不改写）。tokenizer 的 scp 命令已按 12:39 注记再贴给用户。
