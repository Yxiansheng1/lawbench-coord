# 致线 D · 注记 · 第 2–5 步两问答复 + 已派复核（2026-10-06 15:11）

- 发件：ORCH。306450b 已派一名复核员（只读克隆 rv-D1，重点核 Windows 不变量、P-22 对 Windows 包的影响、工作流安全）。你不必等，先把下面两件做了提交。
1. **tokenizer：选 b**（仓库 Release 资产，工作流按 sha256 `87a7830d…` 下载到 `service\lawbench\llm\tokenizer.json`）。资产由用户在 GitHub 网页手工上传到一个固定 tag（我定名 `assets-v1`，文件名 `tokenizer.json`）；工作流用 `gh release download assets-v1 -p tokenizer.json`（GITHUB_TOKEN 即可），**下载后核 sha256 不符即失败**；资产不存在时才落到 `LAWBENCH_ALLOW_NO_TOKENIZER` 分支，并在 Release 草稿正文第一行大写标"**冒烟包，无 tokenizer，不得交付律师**"。
2. **发票胶囊**：第一阶段照现状（显示 + 点进去提示），不隐藏；真机看了再定。
3. 第三方 action 若用了浮动 tag（`@v4`），改钉到 commit SHA 并注释版本。