# B 线交回：T18 出稿前原文严格源修订

状态：**SOURCE NOT RUN / STATIC_REJECT 修正已落盘 / 整单未通过 / PACKAGING HOLD**

## 交付位置

- 源脚本：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSourceStrict-20261031-063859\check.py`
- 批准输入逐字节副本：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSourceStrict-20261031-063859\literal-inputs.json`
- 修订说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSourceStrict-20261031-063859\README.md`

未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push。没有改动旧源、旧 FAILED 报告、原文、正式报告或封印文件。

## 输入与执行计数

- 基线完整读取并逐字节复制：19,837 字节；SHA256 `669cc0d9088b4743976d5cc0e409f393b524d1e41c86260339108dd5edcea950`。
- `approved.json` 以批准输入逐字节复制为 `literal-inputs.json`：54,077 字节；SHA256 `18264c91be93f1cf7f359442683f6b437df4d7bee0d52cbbf1773aecacc05bde`。
- 本执行者命令：3 次执行，3 次成功，0 次非零；应用运行 0 次。没有读取完整 54 KB 批准文件内容、产品源码树、Git 状态或环境，没有运行解析器、导入、测试、构建、HTTP、模型或 GUI。
- 先前源作业的实际原始计数仍为：8 次命令、7 次成功、1 次非零、3 个成功补丁批次、应用运行 0；正式报告“7”是暂存错误，原始 8 次记录为准。

## 已完成修正

1. `subprocess.Popen` 由 `_SAVED` 保存的原类派生 `GuardedPopen`，拒绝发生在 `super` 之前。
2. ASGI 客户端与传输关闭不再吞错或无条件标记成功。
3. `loc` 改为与批准 `expected_loc` 精确字典相等。
4. 登记文档改为深复制批准对象、断言单案件与案件号，只重绑 `root`。
5. 原始副本 SHA 条件仅接受 `rel_sha_ok is True`。
6. `attempt_kinds` 在全部 finally 和守卫恢复后、`passed` 计算前取快照。
7. 事件循环显式关闭异步生成器与默认执行器，解绑并关闭，只有实际关闭成功才计为通过。

## 边界与结论

旧 `static-reject.json` 的判决是在任何解析、产品导入和运行之前发现夹具守卫及关闭缺陷，属于静态源拒绝，不是产品业务 FAIL。旧业务 FAILED 与 `whole_T18_PASS=false` 均保持；本修订没有作者运行验证，不能据此宣称任何 GET 已通过。

下一步只应由主根在整模块逆向复核及新类守卫、失败关闭、精确 loc 的内存有限检查通过后，统一执行一次实际 13 条 GET、源码/OS 关闭和封印；全量测试继续等待负责人明确同步放行。
