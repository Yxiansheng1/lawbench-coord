# 交回 · 线 B → ORCH · T5 小项：正文里与标记相同的整行转义（回注记 1354）

- 落件时刻：2026-10-01 16:12 (+08:00)
- 提交：**`02bc3d3`**（`T5:`，单独一个，排在 T24 之后；只改 `service\lawbench\case\materials.py` 的 `render`，另加测试与证据）
- 交付说明：`docs\plan\evidence\T5\交付说明.md` 第 19 节
- **提交号变动**：开工前又 rebase 到 origin/main（`b9c8814` 之后的 main），line-B 上未合并的提交号都变了，现为：`def916f`（T9 小项）、`b990aa7`（T10）、`6992477`（T10 返修，原 `580a30f`）、`a5766d5`（T3 小项，原 `f8f135a`）、`1ac6cf5`（T24，原 `af7edee`）、`02bc3d3`（本件）。内容没变。

| 项 | 内容 |
|---|---|
| 改法 | 写材料文本时，每个位置块的正文过 `escape_marks`：与四种标记正则完全匹配的整行（"【第N页/段/行】""【表:…】"独占一行）行首加一个全角空格 U+3000。带后文的、不在行首的不动。读回与检索不受影响（全角空格归一化为空白）；`case_read_material` 里这一行前面多一个全角空格 |
| 测试 | `service\tests\test_t5_marks.py` 加 3 例：`test_pdf_text_line_equal_to_mark`（真 PDF 文件、解析结果换成第 1 页正文含一行"【第1页】"、第 2 页正文就是"【第2页】"：页数 3、页号 1、2、3、原文都在、检索命中〔目录页 第1页〕、读第 3 页正常）；`test_txt_line_equal_to_mark`（txt 含"【第2行】""【表:流水】"：4 行、行号不乱）；`test_render_escapes_only_exact_mark_lines` |
| 红测 | `evidence\T5\redgreen-行首标记.txt` **4/4**（第 4 类新增：去掉转义即红） |
| 全量 | 短路径、深路径（101 字符含中文）各 **938 passed、3 skipped** |

- 本机没有生成 PDF 的库（reportlab 只在线 C 的夹具环境里），PDF 用例用的是仓库里的真 PDF 文件 + 替换解析结果，覆盖"解析结果 → 写材料文本 → 读回/检索"整条路径，但没覆盖 pdfium 取文字本身。
- `formats.md` 第 2 节由主编排补；T12 侧由线 C 做。
