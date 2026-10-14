# 交回 · 线 B → ORCH · 契约 1.4（回执行令 20261010-1428 第二节）

提交 **`b7ff580`**（`T3:`），另有 `7a065b5` 更正交付说明里的一个用例名。基于 main `5e0d218`，叠在端口分类 `9bcc4fd` 之上。说明在 `evidence\T3\交付说明.md` 末节（逐项表、材料移除做法、客户端要跟的点）。

## 做了的 13 项（第 6 项 N66 候拍板，没做）
1. **N45**：出处正则允许材料名带成对〔〕；服务解析同步。
2. **`ORIGINAL_HAS_REVISIONS`**：/api/redline 原文含修订时回它。
3. **`pipeline_status.notice`**：395 抽取被跳过的提示。
4. **`CASE_CARD_INVALID`**：case.json 损坏。
5. **`/api/source` 可选 `task_id`**：只按该任务记的版本判断原件有没有变。
7. **`POST /api/materials/remove`**：原件移**系统回收站**（真回收站跑过一次），清文本、识别页、检索；index 留 `removed`、编号不复用；幂等；`source_deleted` 的也能清。
8. **`materials_list.chars`**。
9. **`case_read_material` 的 `more_names` / `parts`**：一次读多份。
10. **`成果/索引.json` 的 `draft`**。
11. **导入跳过原因**去掉"云同步目录"。
12. **`case_open.folders`**。
13. **`GET/POST /api/wiki/review`**，`case.json` 加 `review`。
14. **395 `/health` 的 `ocr_model`**：只改契约文件，395 侧归线 C。

- **流程**：gen_schemas 已运行、VERSION 1.4、Spec 20.12 加一行、SEC-08 口径（PRD、Spec 4.2 与 SEC-08 行）已改、build_docs 已跑；check_examples 69 条通过；Skill 共用规则加"一次读几份"，build_skills 过。
- **测试**：每项有用例；**service 全量 1328 过、7 跳过**；dsh-ext 710 过、6 跳过。

## 请你看的几处（我自己定的，交付说明里有原因）
1. 候项只有一句话的三项，名字是我起的：`notice`、`CASE_CARD_INVALID`、`wiki_review` 接口加 `review` 字段。
2. materials_remove **没有 `delete_original` 参数**：既然不允许"只去索引留原件"，移除就是移回收站。
3. 一次读多份用 `more_names`，`name` 不变。
4. `folders` 必须都在 template 的标准目录表里，不接受自由路径。

## 跨线
- **dsh-ext 我顺手改了两处**：`ui\citation.ts` 的 CITATION_PATTERN、`ui\fixtures\materials_import.json` 的跳过原因。不改的话这次合进去 dsh-ext 测试就红两例。别的没动。
- **版本号混装**：Host 严格比对 `contract_version`，客户端和服务必须一起升到 1.4。令里"1.3 客户端照常"我理解为字段兼容，不是 1.3 客户端配 1.4 服务。若真要混装，得改 Host 的比对，归线 A。
- **线 C**：prep395 的 `CONTRACT_VERSION_FALLBACK = "1.3"` 要改成 1.4，`/health` 可带 `ocr_model`。
- **线 A、线 D 要跟的点**：交付说明里列了 11 条，包括 materialRemove 放开、按 outputs.draft 对应草稿、caseFolders 与 wiki 核对改走服务、chars、notice、task_id、端口类别。
