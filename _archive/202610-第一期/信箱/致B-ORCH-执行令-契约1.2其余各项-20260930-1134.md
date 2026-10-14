# 执行令 · 致线 B · 契约 1.2 其余各项里服务这一半（补充 T5、T8 返修令）

- 发件：ORCH　收件：B　落件时刻：2026-09-30 11:34 (+08:00)
- 依据：`OWNER-契约项一起定-20260930-1134.md`。**这份令改写 T5、T8 返修清单里的两条**：T5 的 X11 改为按 `material_ids` 表做；T8 的 P1-1 改为按 `offset`/`next_offset` 做。其余各条不变

## 契约 1.2 这次一并加进来的（`main` 7b6281b；Spec 20.12 有整条记录）

| 项 | 契约改动 | 谁做 |
|---|---|---|
| N21 | 材料索引 `note` 枚举加"有外部链接，未重算公式" | 线 B（T5 返修时把原来留空的 note 写上这个值） |
| N26 | `case_db.sql` 新增 `material_ids` 表（材料编号留底）；`meta` 里存 `next_material_seq`；`schema_version` 仍为 1，用 `CREATE TABLE IF NOT EXISTS` 补建 | 线 B（T5 返修的 X11 改为按这张表做：分配编号时写一行；重建 `index.json` 时同一份原件按 `rel_path`＋`sha256` 拿回原编号，新编号从 max(next_material_seq, 表内最大＋1) 起） |
| N28 | 材料文本 Source 行加取值"待识别"（整份都是扫描件、还没识别结果时用） | 线 B（T5） |
| N31 | `case_read_material` 参数加可选 `offset`（单元内从第几个字起，0 起），返回加 `next_offset`（同一单元没读完时给出，读完为 null）。只读了一部分的单元不算已读 | 线 B（T8 返修的 P1-1 改为按这个做：截断时返回 `next_offset`，`reads.json` 只记读完的单元；线 A 的插件不用改，参数说明由契约带给模型） |
| N32 | `start`/`end` 的 Excel 编号改为整份材料连续（`formats.md` 第 2 节和参数说明都改了） | 线 B 现有做法即是，只需核对说明；线 A 无改动 |
| N35 ① | `tasks_list` 任务项加 `coverage`、`citation_check`（都可为 null） | 线 B 填；线 A 成果区显示"没读全的材料"和自检结果（去掉占位） |
| N35 ② | 胶囊项加可缺省字段 `new` | 线 B 在合并默认配置时给新补进来的胶囊标 `new: true`、`hidden: true`；线 A 首页据此提示"有新功能"，律师显示或隐藏一次后调 `PUT /api/capsules` 清掉 |
| N35 ⑥ | 新增 `GET /api/outputs?case_id=`，返回 `成果/索引.json` 的内容 | 线 B 实现；线 A 成果区"成果"列表改用它（去掉占位） |
| N35 ⑦⑧ | `tasks_list` 写明不列待执行的任务单；`unit_count` 写明 cell 时是工作表个数 | 只是说明，两边核对 |
| N35 ⑤ | "Skill"一词维持不换 | 无 |

## 提醒

- 先 `git rebase main` 拿到契约 1.2（rebase 前后各记一次 HEAD 写进交付说明），`/health` 的 `contract_version` 回 1.2。
- 三张卡（T3、T5、T8）仍然分开提交，各自的交付说明加一节写明 1.2 带来的改动。
- 你到现在没有回执。读到这份令请先落 `致ORCH-B-回执-用量恢复-<时刻>.md`。