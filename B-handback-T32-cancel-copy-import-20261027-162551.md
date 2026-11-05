# B handback: T32 cancel-entry copy import

状态：有界修复完成；`RUNTIME_NOT_RUN`；等待主编排审计并执行唯一新的同意义场景。

## 修改

唯一源码改动：在
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\server.py`
的 `import asyncio` 与 `import hashlib` 之间加入标准库 `import copy`。

- 修改前：116705 字节，SHA-256 `33992711026AC5835AE23CE20E209DA6366C908193F6FAA3A72229CAC8F96A96`。
- 修改后：116717 字节，SHA-256 `1b5389bc6d0ba9680967281dd744a43cc89b34a82ec124e2e990d6702fe40b17`。
- 新增恰为 12 字节；从新文件移除该插入后，与给定 `server-before.py` 逐字符完全一致。
- `import copy` 仅 1 处；`copy.deepcopy` 原有 4 处，行号 1559、1562、1570、1683。

## 验证与阻碍

- 未运行运行时、测试、构建、prepare、serve、HTTP、GUI、模型或探测动作；未重跑旧 green。
- 首次 `git status --short; git status --branch --short` 退出码 1：
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限被拒。
  按令仅记录，不修复权限/锁，不扩权。
- 使用 `--ignore-submodules=all` 的只读 Git 状态确认仓库既有 dirty/untracked 仍保留。
- Git 严格只读；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`。

## 写入面

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\server.py`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\root-copy-import-fix-20261027-162551.md`
3. `D:\Lawbeach\lawbench-coord\B-handback-T32-cancel-copy-import-20261027-162551.md`

产品/旧 entries/测试/25 runtime/18 legacy/消费者/选择器/业务/R/ledger 断言均未修改；API、provider、依赖、权限、ACL、锁、沙箱与审批均未更改。

证据明细见
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\root-copy-import-fix-20261027-162551.md`。

包装保持 HOLD；全项目仍未完成。主编排审计全部写入面后，以其纠正后的执行输入启动唯一一次新的同意义场景。
