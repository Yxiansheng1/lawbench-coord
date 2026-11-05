# T18 边界实现闭包交回

- 结论：AUTHORED_NOT_RUN
- 运行次数：runtime 0
- Git：未执行任何读写命令，未 add/commit/rebase/stash/reset/clean/checkout/push
- 既有状态：保留现有多文件 dirty；仅修改指定目标文件

## 修改面

目标文件：`D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py`

1. 在 `_defense_unread_numeric_citation` 的原读取覆盖判定之前，拒绝 `end < start` 的倒置区间。
2. 在原读取台账覆盖成立后，按引用键 `(material_id, material_version, unit)` 缓存检查；仅从 `tasks.index_for_task(task)["materials"]` 按 `material_id`、`sha256`、`unit` 精确匹配材料。
3. 通过原始 `texts.read_text` 与 `texts.split_units` 排除 `strip() == texts.PENDING_OCR` 的程序占位单元。材料元数据或文本缺失时 fail closed；仅吞掉 `MATERIAL_NOT_READY`，其他 `ApiError` 与保护性拒绝继续传播。
4. 保留 helper 的元组返回形状，未增加事实分析、NLP、全文检查或新正则。
5. 修正现有 `defense_citation_not_read` 文案，明确错误区间、正确起止、重新读取及保存动作；待识别占位时要求等待识别文本生成。

## 证据与隐私

- 复用胶囊中既有真实文件系统红测结果：倒置区间及程序占位页各 1 例，均复现保存 v1 边界问题；本次不重跑。
- 未读取测试，未运行 Node、Python、解析器、测试、收集、构建、准备、服务、探针、模型、HTTP、GUI 或 OCR。
- 错误信息仅含材料 ID、数值位置与动作，不含材料名、正文、检索词或模型输入输出。
- 测试文件及 `tests/preparer/_save_locked/UI/TaskStore/checker/SDK/schema/auth/protectiveguard` 均未修改。
- 本交回不宣称 GREEN；完整反演与真实文件系统验证由 Root 独立执行。

## 遗留

- 因执行令禁止运行时，本次仅完成目标片段的目视结构复核，未做语法解析或行为验证。
