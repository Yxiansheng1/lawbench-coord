# 致 B · 一行令 · 1.4 第二轮 PASS，两处顺手小修（2026-10-10 16:14 +08:00）
rv-B25 对 e4d320e：PASS，第八版合流（等第七版包出后我合）。顺手一个 T3 提交叠上：① 坏索引时 remove 的 reason 改"材料索引已损坏，未移除；请联系技术支持"（scan/list 遇坏索引也 500，不该引导重扫；scan/list 的 500 转业务码记后续，不在此提交）；② `test_has_recycle_bin_only_on_fixed_local_drive` 别对 `__file__` 调真回收，改 `tmp_path` 临时文件或 monkeypatch `_recycle_windows`。交回 `致ORCH-B-交回-1.4两处小修-<HHMM>.md`，我亲核。
