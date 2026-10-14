# 致 A · 执行令 · 第八版：契约 1.4 客户端跟进（2026-10-11 02:42 +08:00；头号优先，"移除此材料"放开）

背景：第七版已发出，律师看到灰的"移除此材料"按钮，用户要求第八版尽快（本周）。契约 1.4 服务侧（线 B，两轮复核 PASS）已合 main（`bb5fc41`、`00d5231`、`d7ff3b4`），`contracts\VERSION` = 1.4。开工先读完信箱新件逐一回应，`git rebase main`。读 B 的 `docs\plan\evidence\T3\交付说明.md` "契约 1.4" 两节里"客户端要跟的点"（11 条）。

## 第一优先（先交一个提交）
1. Host/界面 `contract_version` 升 1.4（严格比对，与服务同包升级）。
2. **`materialRemove` 放开**：调 `POST /api/materials/remove`；材料页按钮可点，确认框文案"移到回收站，可从回收站找回"；返回 removed/already_removed/failed 分别显示（failed 的 reason 原样给律师，含"该位置没有回收站，未移除…"）；`material_status=removed` 的材料列表里标"已移除"并可隐藏；wiki 卡随 `wiki_needs_update` 提示。用例 + 真机（真服务）截图。
3. `materials_import` 跳过原因枚举去"云同步目录"（fixture 已随 B 改）。

## 第二批（同一令，可拆提交）
4. 草稿↔成果改按 `outputs.draft` 对应，删本机 `lawbench.confirmed.*` 记录。
5. `case_open.folders`：标准目录勾选改传服务；自填目录仍走 Host `caseFolders`。
6. `case_open.kind`：新建案件与拖文件夹/左栏添加建案件传 `kind`（civil/criminal/daily），本机记录改读服务回传。
7. wiki 核对改走 `GET/POST /api/wiki/review`，删本机 localStorage 记录。
8. `materials_list.chars`、`pipeline_status.notice`、`/api/source task_id`、`CASE_CARD_INVALID`、`ORIGINAL_HAS_REVISIONS` 按交付说明接显示。
9. 待办 22：空会话"选择案件"菜单藏"未归入案件"（DSH 补丁）。
10. 待办 24：会话菜单"删除会话"（注记已发）。
11. 待办 17 候项：`case_forget` **B 还没做**——本批不等它，继续用本机 hidden-cases；B 交了再换。
12. 小项：P3（弹框过滤用例、explorer 接线用例、材料页重新扫描用例）、`ROOT_TEXT`/`nameText` 在"选"的入口不说"拖"。

每个提交 `T13:`；dsh-ext vitest/tsc/check_ui_words；交付说明分节；交回件 `致ORCH-A-交回-1.4客户端-<HHMM>.md`（第一优先先交一份）。打包令另发，不打包。
