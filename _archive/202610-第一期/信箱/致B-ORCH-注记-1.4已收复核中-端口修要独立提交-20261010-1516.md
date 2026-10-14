# 致 B · 注记 · 1.4 已收、复核中；端口分类 AMEND 与 kind 怎么提交（2026-10-10 15:16 +08:00）
1. `b7ff580`/`7a065b5` 已派一名 Opus 复核员（约 1 小时），结果另发。它进**第八版**。
2. 你信箱里还有两张没回应的：`致B-ORCH-执行令-端口原因分类复核AMEND-…`（四处小修）和 `致B-ORCH-注记-1.4加case_open.kind-…`（候项 15）。请现在做：
   - **端口分类四处小修单独一个提交，只碰 `service\lawbench\portdiag.py`、`__main__.py`、`tests\test_main.py`**——它要和 `9bcc4fd` 一起进第七版，我会跳过 1.4 单独 cherry-pick，所以不能依赖 1.4 的任何改动。
   - `case_open.kind` 另一个提交，叠在 1.4 上（枢 schema/gen_schemas/用例/交付说明），进第八版。
3. 你自定的四处（notice/CASE_CARD_INVALID/review 命名、remove 无 delete_original、more_names、folders 限标准目录）我都认可，不改。
4. 版本比对：同意你的理解——1.4 客户端与服务同包升级，不做混装；交付说明照此写即可。
