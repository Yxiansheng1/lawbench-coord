## T18 · 18 个 Skill 在链路中跑通与预算实测

- **执行体**：线 B
- **模型档**：Opus 5.5 · high　**预算档**：大
- **依赖**：T14、T16、T23、T24
- **输入**：`skills\`（18 个 Skill、`capsules.default.json`）；`docs\src\业务编排.md`；PRD F-SKILL-01 至 08、F-RUN-05；`tests\fixtures\`；大卷宗样本
- **步骤**：
  1. 每个 Skill 在对应的样本案件上跑一次（刑事类和刑期计算用 `criminal-01` 和大卷宗，合同类用 `contract-01`，通用文书、民事阅卷和诉讼文书用 `civil-01`，招投标用 `tender-01`，案卷归档用 `closed-01`）；`contract-review` 同时检查修改清单和修订版生成；`case-archiving` 同时检查归档方案和 T23 的生成结果。
  2. 每次记录：模型调用次数、工具调用次数、耗时、是否触发预算、出处核对结果、必问问题是否按"已有的请确认、缺的才问"执行。
  3. 预算不够的 Skill：按业务编排的建议先改为"按卷分批"的写法；仍不够的，提出 F-RUN-05 的调整值，写进报告交主编排上候 owner 清单（不自行改 PRD）。
  4. 发现 Skill 正文的问题直接改 `skills\`，每次改完跑 `build_skills.py` 和契约自检。
  5. 为每个 Skill 在 `skills\<skill>\tests\` 下放 ≥ 4 个虚构样本和 `要点.md`（律所样本到位后替换）。
- **产出**：`docs\plan\evidence\T18\skill-report.md`（18 行表：Skill、样本、调用次数、耗时、预算是否够、核对结果、问题和处理）；`skills\*\tests\`；修改过的 `skills\` 文件
- **验收**：18 个 Skill 均至少成功产出一份草稿（`case-archiving` 为归档方案）且核对结果无 A–E 类问题；`build_skills.py --root skills --strict` 除"owner 待定"外无错误；报告中每个预算不足的 Skill 有明确的处理结论。
- **补充（2026-10-02 15:25，第一阶段复核，target `8e2fb48`，`evidence\T18\review-REVIEW-第一阶段.md`）**：PASS。408 个样本/要点文件无真实信息；664 条要点出处 663 条落实；契约参数名逐字一致；`--strict` 只剩 owner。裁定：实测工具先把样本转 docx/pdf 再导入；共用规则加自检结果与 ■/[看不清]；默认取法按作者；覆盖清单/L0 记 T14；预算 8→16 候实测。
- **五门格**：①任务门=第一阶段过（2026-10-02 15:25）；步骤 1–3 实测等 T14 ②合流门=过（cherry-pick b9fdb32 + 小项 ff a5445f3，`evidence\T18\merge.txt`、`review-ORCH-小项.md`） ③盲测门= ④发车门=不适用 ⑤真人门=
- **补充（2026-09-30，T8/T5 第二轮复核发现的独立后续，本卡实测）**：①`task.current()` 每次在全局锁里遍历所有最近案件的全部任务目录，界面每轮结束、每次挂上都调，案件和任务多了以后会拖慢 `begin`、`add_read`；②一份总是转换超时的文档会让每次扫描和导入多出约 130 秒并占着全局 LibreOffice 锁（按 T5 X9 裁决不重开）。两条在本卡的预算实测里量一次，超过可接受就派回线 B。
- **交付说明**：

---

