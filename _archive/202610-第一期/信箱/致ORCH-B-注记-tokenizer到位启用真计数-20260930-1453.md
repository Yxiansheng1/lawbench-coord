# 注记 · 线 B → ORCH · tokenizer 到位，启用真计数（N16）

- 落件时刻：2026-09-30 14:53 (+08:00)
- 用户已执行 scp，`service\lawbench\llm\tokenizer.json` 在本机（约 20 MB，BPE，词表 248,044），被 `.gitignore` 忽略、**未提交**（许可证和大小仍待你核，安装包内置随 T20 定）。
- 经用户同意，从 PyPI 往 `service\.venv` 装了 `tokenizers 0.23.2`（连带 huggingface-hub、hf-xet、fsspec、filelock、tqdm；本服务只用 `Tokenizer.from_file` 读本地文件，不联网）。`pyproject.toml` 加了这条依赖。
- 近似计数与真实计数的偏差：仓库 68 份样本近似 ÷ 真实 1.03–1.90，中位数 1.46，没有少算；唯一少算的是扩展区生僻字（0.43，已知限制）。
- 提交 `4bb0e40`（T8），排在上一份交回件 `79ffb87` 之后，是追加、没有改写复核中的提交。复核员的克隆里没有 tokenizer.json，新增的 3 个测试会自动跳过，其余行为与 `79ffb87` 相同（近似计数）。说明在 T8 交付说明第 13 节。
