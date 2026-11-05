# C 线交回：FullRegression 消费者预运行静态修正

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已按执行令只改现有 `consumer.py` 的两处源码区域，并新建本交回件。第一处增加一个 `hmac` 导入，将无效的 `hashlib.compare_digest` 改为 `hmac.compare_digest`；第二处先判断原始 `Path(args.junit).is_absolute()`，再按原逻辑生成规范化的绝对子路径。冻结的 `GUARD_SHA256` 原值未改。 |
| 目标是什么 | 交付可交由根控制者独立复核的两区域静态修正。当前停在预运行静态交接；根独立静态检查之后，才进入既有控制面与实际运行边界。 |
| 在等什么 | 等根控制者的独立静态检查信号：确认源码差异仅限这两个区域、冻结守卫哈希常量未变、快照与原有三个新文件均保留。信号通过后由根控制者按既有边界决定下一步控制面动作。 |
| 卡在哪 | 本执行域没有静态修改阻碍，也没有发生停摆。消费者、pytest、控制面和实际运行均按令未启动，因此不产生测试通过或产品可用结论。 |

## 依据与验证

- 修改前源码快照：`D:\Lawbeach\lawbench-coord\FullRegression-consumer-preflight-before-20261031-135633\0-before.txt`，SHA-256 为 `4FC5BA7D0DEC0EA23D9096BE2F39AE2FC5E46436C3D809476AE8451501519ED6`。
- 修改后源码：`D:\Lawbeach\lawbench-C\docs\plan\evidence\FullRegression\CSafetyRunner-20261031-135039\consumer.py`，SHA-256 为 `0620F5E613CDBD2C38FEB47150731794729B0FBEAE7A35F62D6A83E4AB6817FA`。
- 只读逐行比较显示差异为 5 行新增、3 行删除，归入两处规定区域：第 17 行新增 `import hmac`；第 115 行改为 `hmac.compare_digest(actual, GUARD_SHA256)`；第 169 至 172 行先检查 `raw_junit.is_absolute()`，再用原表达式规范化 `junit`。
- 冻结常量保持原值：第 33 行为 `GUARD_SHA256 = "4b3c956626e822cb39af5341ed410ea4fdeeefcf1d8f3b432028bd23578ba8b2"`。
- 本次只写入上述 `consumer.py` 与这份新交回件；既有快照未改动，旧 README、旧正式文件和历史件未改动。

## 未做与降级

- 按令未运行消费者、pytest、控制面、实际测试、导入、语法解析、源码自检、构建或收集；本交回不含测试 PASS 或产品可用结论。
- 按令未执行任何 Git 写操作，未暂存、未提交，也没有提交 SHA。
- 没有扩大路径权限、守卫函数、摘要结构或清理顺序；这些内容沿用原文件。
- 运行器的 managed MXC 隔离、沙箱、审批和文件锁均未改动；本次没有遇到需要记录的拒绝或锁阻碍。

## 下一步建议

根控制者先独立核对当前 `consumer.py` 的两处源码区域、冻结守卫哈希和上述前后哈希，再决定是否进入既有控制面与实际运行。若静态检查不一致，退回具体行差异；若一致，后续运行结论仍由根控制者按原始证据单独判定，不能沿用本交回作为测试结果。

Response ID: `C-FullRegression-consumer-preflight-20261031-135633`

Response log path: `D:\Lawbeach\lawbench-coord\AorC-handback-FullRegression-consumer-preflight-20261031-135633.md`
