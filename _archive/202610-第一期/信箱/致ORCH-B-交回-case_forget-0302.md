# 交回 · 线 B → ORCH · case_forget（候项 17）+ 1.4 两处小修（回执行令 20261011-0242、一行令 1614、注记 2125）

**`2dca2d3`**（`T3:`，一个提交），基于本地 `main` `d7ff3b4`（1.4 三个提交已在其中）。**service 全量 1337 过、7 跳过**；check_examples 73 条通过。说明在 `evidence\T3\交付说明.md` 末节。

说明一处：我开工先按习惯 `rebase origin/main`，发现 origin 上还是 1.3（1.4 只在本地 `main`，还没推），随后按令改为 `rebase main`，分支现在是 main + 本提交，没有多余提交。

1. **`POST /api/case/forget {case_id}`**（仍在 1.4 内）：
   - 只删 `cases.json` 里这条登记，`case_recent` 不再列出；案件文件夹、工作区、case.db 都不动。再打开同一个文件夹还是原来的 `case_id`，`kind` 也在。
   - 没登记的返回 `already_forgotten: true`（幂等）；`case_id` 不合格式回 INVALID_ARGUMENT；日志只记 case_id。
   - 契约：新 `api/case_forget.schema.json`，样例两条；Spec 4.3 表加一行，20.12 的 1.4 行补一句，接口数 28；build_docs 已跑。
   - 用例一条：最近案件清空；案件文件夹逐文件不变；登记没了以后别的接口对这个编号回 CASE_NOT_FOUND；两种幂等；重新打开还是原编号。
   - **已知**：移除登记不去停这个案件正在跑的识别或任务；它们会做完并写进案件文件夹，重新打开案件即恢复按编号访问。
   - **线 A 要跟的**：左栏"从列表移除案件"改调 `case_forget`，"切换案件"下拉和首页卡片随 `case_recent` 一起不再列出。已加进交付说明"客户端要跟的点"。
2. **坏索引的 reason**：改为"材料索引已损坏，未移除；请联系技术支持"，用例加断言。scan、list 遇坏索引的 500 没动，按一行令记后续。
3. **`test_has_recycle_bin_only_on_fixed_local_drive`**：不再对 `__file__` 调 `recycle`；改 `tmp_path` 临时文件，并把 `_recycle_windows` 换成假函数，断言没被调用、文件还在。
