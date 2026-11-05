# B 线交回：T18 比率测试桩签名更正

状态：`CODE_FIXED_AWAITING_ROOT_VERIFICATION`

本轮按正式执行令只修正一处测试桩签名；未把有限单测结果扩写为 T18、项目或发版通过。

## 唯一改动

`service/tests/t18_rate_ratio_20261028_194123.py`：

- 原签名：`FakeTasks.save_result(self, _root: str, _task_id: str, result: dict)`
- 现签名：`FakeTasks.save_result(self, _root: str, result: dict)`
- 删去未被使用的 `_task_id`，对齐生产 `TaskStore.save_result(root, result)` 及实际 `_save_locked` 调用。

测试体、断言、5 个测试方法、15 个负控、界面正向保存、回滚检查、抽取代码命名空间和真实保护源码均未改。其它 B 线源码、旧 T32 测试、SDK、编译产物、契约、Skill、模型提示、参数和预算未改。

## 哈希与字节核对

- 协调输入 `drafts.py` 与工作区一致：`7C54C0685EDEC082CEA405E30AD08B38637BDBD1EC3AFEDEB6E3712FBAEBD0AB`
- 协调输入 `test.py` 与更正前工作区一致：`E57DD13D8111CD6CEAD90A34021EF742DBCDD816E373B7B9612E998E3DDAB7E0`
- 更正后测试 SHA-256：`F2E79733E08297B682199E9A0CF1ECFAB90F442317F0EC9DBD93B82F45DDDA1E`
- 更正后 `drafts.py` 仍为冻结值：`7C54C0685EDEC082CEA405E30AD08B38637BDBD1EC3AFEDEB6E3712FBAEBD0AB`
- PowerShell 原始字节重建：旧签名字符串恰出现 1 次；测试由 14226 字节变为 14211 字节；重建文件与工作区测试逐字节一致。

已复用 `T18RateRatioTestSignatureInput-20261028-195932/actual-finite-failure.json`：此前实际有限单测为 `5 tests / 20 ERROR`，所有业务失败均为该桩签名不符；不是产品/API 失败。更正前真实红例已通过且未在作者侧重跑。

证据 README 已追加更正记录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RateRatioRepair-20261028-194123\README.md`

## 作者侧边界

- 未运行 Python、Node、测试、AST、导入、收集、自测、准备脚本、构建、HTTP、模型、界面、SSH、Key/env 或 DPAPI/Keyring 操作。
- 未执行任何 Git 写操作，未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；本交回不是提交。
- 未修改沙箱、审批、策略、ACL、安全设置、全局配置或真实数据，未拆 writer 锁。
- 既有 dirty 原样保全；协调目录只新增本交回文件。

## 主编排待验

1. 对新测试做旧签名删除的精确反向字节检查。
2. 运行新有限单测，并独立运行旧 T32 回归。
3. 生成/核对精确的新 B 源码哈希图，再跑实际原生流程。
4. 按全量 T18 与项目验证门判读；当前作者侧不宣称通过。

门禁状态：Gate 1 与全量 T18 未完成，Packaging 继续 `HOLD`。
