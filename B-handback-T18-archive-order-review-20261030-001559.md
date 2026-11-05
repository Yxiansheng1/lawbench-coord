# 线 B 交回：T18 归档工具顺序只读审计

## 结论

状态：`SOURCE_ONLY / READONLY_AUDIT_COMPLETE / IMPLEMENTATION_NOT_RUN`。

原始实际失败确认：`case-archiving` 后没有 `case_list_materials`，直接成功调用了
`case_archive_match`。当前生产代码只有 Skill 文案要求，没有归档专用 LIST -> MATCH 程序门禁；
唯一同类门属于 `sentence-calc`。

支持的最小修复是只在当前 A 的 `LegalAgent/TaskState` 复用现有“本任务成功列清单”布尔位：

- begin 时按 `skill=case-archiving` 固定归档工作流；
- 在 `preTool` 和直接 `executeTool` 两条 Core 前入口拒绝未成功列清单的
  `case_archive_match`；
- 仅在 Core 成功且 `$defs/result` 契约通过后置位；
- 不自动 LIST、不造答案/历史/MID、不扩预算、不改 B Core/契约/路由/通用存储；
- `case_save_archive_plan`、其他 Skill 和现有 sentence 门不扩改。

## 正式产物

只新增两份协调文件：

1. `D:\Lawbeach\lawbench-coord\B-T18-archive-order-findings-20261030-001559.md`
2. `D:\Lawbeach\lawbench-coord\B-handback-T18-archive-order-review-20261030-001559.md`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| findings | 54700 | `584094828e8970d266ea8253ac6625fedae13524194650e1f5eff3041a08cf0a` |

详细事实、源码行号/哈希、成功与失败协议、状态隔离推演、业务问题分层、冻结保全和全部原始命令账均在第一份。

## 原始证据复用

- 实际运行：`run-tePzKq`，68.156 s，9/9 模型 POST HTTP 200，53 events / 54 rows。
- 工具计数：`case_list_materials=0`、`case_archive_match=1`、有效四问回答 4 项、
  一次成功核对表保存、一次成功归档方案保存。
- 归档计划 13 字段、1589 B，`8d294762...`；参数与持久化 deep equal。
- 原始失败未改、未重跑、未放宽。SourceGET 和 production JSONL reopen 原记录仍是
  `NOT_REACHED`。
- dirty 42 快照 42/42 当前 bytes/SHA 一致。
- 当前 private 25 文件，manifest 58195 B，
  `7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851`。
- 当前 A 源按 admission 绑定：
  `index.ts` 49572/`140584...`，`task-state.ts` 22115/`866a15...`。

## 业务问题

最终保存计划的核心事实和材料映射是有证据的正向结果，但人工复核失败仍成立：

- 有效四问未展示提取的当事人、案由、日期与出处；
- 已提供的 JZL 编号仍被问“是多少”，不是只请确认；
- TXT 委托合同没有提示补盖章扫描版 PDF；
- 无可见逐项自检。

其中，TXT 类型可由材料索引精确识别并作为未来独立 warning 候选，但只能提示补扫描版，
不能认证盖章或法律 merit。四问内容和“已供值只确认”在现有 payload 无结构化槽；靠中文字符串扫描/NLP
不应塞进本次顺序门。逐项自检和法律意见均留律师复核或另立明确设计。

## 阻碍与纪律

初始默认 Git 状态因受限 `dsh` 子模块工作树返回 permission denied；随后使用只读
`--ignore-submodules=all` 成功核对。没有修锁、ACL、权限、审批或 writer。

本轮没有运行 Node、Python、AST/import/类型检查、测试、构建、HTTP、模型、GUI、Key/DPAPI/SSH/进程探测、
setup/安装/私建重建、产品运行或新的原始流程；没有联系其他聊天、换 API、占四线总线。

Git 全程只读，未执行 add/commit/rebase/stash/reset/clean/checkout/push。因此没有提交 SHA；
本交回文件就是正式交回。

## 建议下一步

主编排复核本审计后，只对有证据的顺序缺陷下发有限 A 侧修复与现有预算内的原 N 工单实际重跑。
人工业务问题与 TXT 格式提示若要做，应另行明确范围；不得借此扩大为全 Skill NLP 门、第十道全局门或自动法律认证。

