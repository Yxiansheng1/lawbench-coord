# HANDBACK B · Batch2 P0-6 source-only

- 状态：SOURCE_HANDED_BACK
- 原始执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-Batch2-P06-source-20261102-210830.md`
- OWNER 令：`D:\Lawbeach\lawbench-coord\OWNER-第二批-今晚收尾-20261102-205800.md`
- Git：严格只读；未执行 add/commit/rebase/stash/reset/clean/checkout/push，因此无本次提交 SHA。

## 实际改动

| 状态 | 文件 | SHA256 | 内容 |
|---|---|---|---|
| M | `D:\Lawbeach\lawbench-B\service\lawbench\checks\citations.py` | `9A9B6157400911031EF2E2F62433B876F171F232944A4CFED545E4E76B9C5D52` | 仅增强 `_b_or_c` 既有 B 分支消息，保留 B/must_fix、`targets` 原目标选择和 C 分支不变。第 393 行起。 |
| A | `D:\Lawbeach\lawbench-B\service\tests\test_owner_p06_pages_20261102.py` | `B0204F3574D1E3E7E3AB632C3557D1182677B705E54A14DA2405CBBB5E4BD540` | 新增四页合成材料回归测试。 |

B 分支现在明确分写两条判断：

> 值核验通过，内容确实存在于所引材料中（已忽略空白差异）；页码/位置核验未通过，引用标注为 …，实际在 …

本次没有增加或修改 schema/API 字段，没有改解析、源文本抽取、`_WS` 空白归一、`_chinese_only`、日期/数值等价、`MaterialSet`、页选择或第一批 6 项行为。既有 `service/tests/test_owner_archive_p0_20261102.py` 未修改。

## 新测试覆盖

- 日期仅有空白差异、实际在第 4 页、引用第 1 页：B / `must_fix`，同时断言值核验通过、引用页 1、实际页 4，且本值不出现 C/“找不到”。
- 日期仅有空白差异、实际第 1 页、引用第 1 页：通过。
- 日期仅有空白差异、实际第 4 页、引用第 4 页：通过。
- 日期真正不存在：保持原 C 类“_在所引材料（…）中找不到_”。
- 每次调用后断言合成材料的源定位单元仍为第 1、2、3、4 页。
- `citation_check` 与返回引用均用现有 `contracts/check_examples.py` 的 `validator` 绑定校验。

## 只读检查与阻碍

- `git diff --check -- service/lawbench/checks/citations.py`：通过，无输出。
- 目标路径状态：`M service/lawbench/checks/citations.py`、`?? service/tests/test_owner_p06_pages_20261102.py`；工作树其余 dirty 内容全部保留。
- 首次执行 `git status --short --branch` 时，Git 在读取子模块 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 时返回 `Permission denied`。随后仅用 `--ignore-submodules=all` 做只读状态核验；未启动 setup、未切换 shell、未改沙箱/审批/ACL、未拆 writer 锁。

## 未运行与缺失证明

- 按执行令，未运行 pytest/collect/parser/import/build/prepare/server/HTTP/model/GUI/network/credentials，未读取真实案卷、`.env.local`、Keyring 或 master ledger。
- 单元测试：`NOT_RUN`。
- 运行时验证：`NOT_RUN`。
- GUI/真机证据：`NOT_RUN`。
- 当前只完成源码交回，不能宣称测试或所有者验收通过；由 root 复核并运行有限测试。
