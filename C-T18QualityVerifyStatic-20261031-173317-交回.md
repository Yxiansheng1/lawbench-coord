# C 线 T18 静态修订交回

状态：三处执行前静态缺陷已按令修订，交回主编排。此件不代表运行时验证或 PASS。

## 修订对象

- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T18\QualityVerify-20261031-173317\verify.py`
- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T18\QualityVerify-20261031-173317\static-amendment.md`

## 修订内容

1. `B_RETENTION_TEST` 改为精确文件名 `test_t18_wiki_date_source_retention_20261031-173317.py`，未扩大白名单。
2. B-green 子脚本的 `OLD_SOURCE` 插值改为 `repr(old_source)`，避免 `None` 被生成为 `null`。
3. 进程元数据查询增加 `timeout=15`；仅捕获 `subprocess.TimeoutExpired`，返回空行与 `PowerShell metadata query timeout after 15s`，原有身份核对、期限、清理及其他错误处理未改。

## 验证边界

- 只做指定字面量的静态存在性核对，未执行 Python、解析、导入、测试、构建、网络或模型调用。
- 未修改产品代码、测试源码、源码固定值、快照、既有 `README.md` 或既有正式交回件。
- 未暂存、提交、rebase、stash、reset、clean、checkout 或 push。

## 阻碍

只读 `git status --short --untracked-files=all` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh` 权限拒绝而中止。未尝试修改权限、审批、ACL、writer 锁或 `index.lock`。
