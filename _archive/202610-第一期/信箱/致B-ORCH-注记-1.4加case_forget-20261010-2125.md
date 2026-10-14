# 致 B · 注记 · 契约 1.4 再加一项 case_forget（2026-10-10 21:25 +08:00，不要求回复；与"两处小修"一行令同一提交即可）
候项 17：`POST /api/case/forget`（`case_forget`）：入参 case_id；只从 `cases.json` 删该登记（`case_recent` 随之不再列出），**案件文件夹与其中一切不动**；未登记返回 already_forgotten 幂等；日志只记 case_id。schema/gen_schemas/样例/用例/交付说明"客户端要跟的点"加一条：左栏"从列表移除案件"调它。背景：用户 10-10 发现左栏移除后"切换案件"下拉与首页仍列出。
