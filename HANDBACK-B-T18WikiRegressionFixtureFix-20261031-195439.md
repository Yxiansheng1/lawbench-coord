# HANDBACK-B-T18WikiRegressionFixtureFix-20261031-195439

状态：`SOURCE_ONLY_NOT_RUN`

## 完成范围

- 正式执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T18WikiRegressionFixtureFix-20261031-195439.md`
- 仅修改 `service/tests/test_t18_wiki_date_source_retention_20261031-173317.py` 的既有 6189 字节之后新增区段，以及原有 `docs/plan/evidence/T18/WikiReviewRegressions-20261031-194916/README.md`。
- 未改产品、契约、Skill、文档源或工单集。

## 定点修正

- 新增夹具身份改为固定合成 UUIDv4 `2f28dbf1-5b40-43c4-8c27-111111111111`，任务号改为 `P-20261031194916-aaaa`；`case_id`、`generated_by` 和 `task_id` 共用这两项。
- `test_update_replays_cached_date_evidence_atomically` 的期望原文块改为 `"\n\n" + _quote_block(lines[1], 2)`，保持产品引用位置和源夹具不变。
- 首个更新测试新增 `page.count(block) == 1`；重复更新测试新增 `after_second.count(block) == 1`，检查完整律师保护块而非只查首尾标记。
- 原 6189 字节前缀及既有 `_run` 测试未编辑；Root 按原基线复核前缀。
- Root 快照中已复制的原始畸形夹具未在本工作树中改写或删除，继续供 OLD 产品取得真实红灯。
- 同一份既有 README 已追加“纠正限定”，说明静态夹具拒绝不是产品失败、本轮身份与行号纠正、整块断言及未运行状态。

## 最终大小与哈希

仅做一次原生 PowerShell 大小/SHA-256 读取；其显示截断后只重读相同字段，未做额外字节比较或源码比较。

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `service/tests/test_t18_wiki_date_source_retention_20261031-173317.py` | 15033 | `4B6F42A3F759BC1CA91A51925C31B73DA529BC1FC12CFF33B028A5673BD20BE3` |
| `service/lawbench/pipeline/steps/wiki.py` | 35555 | `054441464E1FB78FAB955FFB51613BFBDCFDE2E481DF6DA13B6DB533448F7ABB` |
| `docs/plan/evidence/T18/WikiReviewRegressions-20261031-194916/README.md` | 4917 | `FFDD46CDD01D4CB278DC858F18E64B08548866C71E3BA34B33E674E1BEB370D8` |

产品文件仍为令载 35555 字节、`054441` 基线，本轮未触碰。

## 验证边界与遗留

- 未执行 pytest、collect、import、Python、Node、解析器、AST、构建、应用、HTTP、模型、GUI、凭据读取或测试。
- 本件只证明源码夹具已纠正，不证明任何用例通过或失败。
- 下一产品修复前，仍须由 Root 使用旧快照和当前 B 源码先取得原始 OLD 红灯并交回；本线不提前推进产品修复。
- Git 严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
