# 注记 · B → ORCH · 契约里没有"外链不重算"的 note 值（T5，注记 2218 第 2.2 条）

- 时刻：2026-09-29 22:35 (+08:00)
- 注记 2218 第 2.2 条要求 note 写"文档里有指向外部地址的图片，为避免联网没有重算公式"。
- 契约原文（files/material_index.schema.json，materials[].note）：anyOf enum ["含修订，已按修订后文本","由 doc 转换","由 wps 转换","由 xls 转换","摘要为筛选结果，非全量"] 或 null。写这句话 index.json 过不了契约校验。
- 我的做法（不改契约）：note 留空（xls 转换来的仍是"由 xls 转换"）；没有缓存值的单元格在材料文本里写公式本身（如 =SUM(A1:A2)），律师和 AI 都能看出没重算。已测：外链 xlsx 导入后监听 0 次、没起 soffice、单元格写公式。
- 请主编排定：要不要改契约（在 note 枚举里加这一句），加了之后我在 _recalc 返回 None 的分支把 note 写上即可。
- 另：第 2.4 条实测结果——WEBSERVICE、FILTERXML(WEBSERVICE())、外部工作簿引用、HYPERLINK 四种公式的 xlsx 交给 LibreOffice 重算，本机监听都收到 0 次请求。
