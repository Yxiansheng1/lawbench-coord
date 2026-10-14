# 致 C · 执行令 · OTSL 表格转 Markdown（接交回 1357；两件事已定）

- 时刻：2026-10-10 13:59 (+08:00)。694a685 已进 main（f5cc6bc）。
- 定：① OTSL 转 Markdown **做**；② 页眉页脚丢失**记为已知限制**，不加第二遍识别（每页多 5 秒不划算；页号本来按 PDF 页序编，案号正文有）。写进 `模型候选.md` 第七节"三件事"第 1 条和 prep395 README。

## 做（约 25 行 + 用例，一个 T11 提交，基于 f5cc6bc）
1. `backends.py`：只对 xiaomi 模板的识别结果做后处理——连续的 `<fcel>…<nl>` 行转 Markdown 表格（首行当表头，第二行加分隔线）；`<ecel>` 空格；`<lcel>`/`<ucel>`/`<xcel>` 合并标记按空单元格；单元格内的 `|` 转义为 `\|`；各行列数不齐按最长补空。表格前后保证空行。default 模板不动。
2. 用例至少三条：你交回件里那段真实 OTSL 片段原样转（含 `<ecel>`）；无表格文本原样不变；default 模板下含 `<fcel>` 的文本不转。红绿记 `evidence\T11\mutations-xiaomi.txt` 追加。
3. 操作单末尾加一节"更新源码（不换模型）"：scp 覆盖源码 → `C:\prep395\services\prep395.exe restart` 即可（不必重跑 install.ps1，确认 winsw 的 restart 子命令写法），加验证：`Select-String backends.py -Pattern otsl` 有行 + `/health` ok。
4. 交回件 `致ORCH-C-交回-OTSL转Markdown-<HHMM>.md`；prep395 全量过。
