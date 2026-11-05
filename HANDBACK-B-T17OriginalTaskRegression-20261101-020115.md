# T17 原始任务回归受限交回

## 结论

状态：`AUTHORED_NOT_RUN`

已按批准清单生成仅包含 22 个原始任务 nodeid 的回归 bootstrap 源文件。该文件未执行，未收集测试，未启动 app、HTTP、GUI、模型或运行时；本交回不表示整库、完整后端或业务功能通过。

## 交付文件

- Bootstrap：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17OriginalTaskRegression-20261101-020115\bootstrap.py`
- 文件大小：`34395` 字节
- 新文件 SHA-256：`7286E52FF7808FA98CF1504EAFDB5E624814884D0BB8466C2DC4AA71C31436C4`
- 原文件：`D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\SafetyLoggingFix-20261031-133032\bootstrap.py`
- 批准原文件 SHA-256：`4b3c956626e822cb39af5341ed410ea4fdeeefcf1d8f3b432028bd23578ba8b2`
- 批准清单：`D:\Lawbeach\lawbench-coord\T17OriginalTaskRegression-20261101-020115Input\approved.json`

## 唯一源码差异

先对批准的原 bootstrap 作字节级原样复制，再将 `main()` 内 `pytest_args` 的末项 `str(tests_dir)` 替换为批准清单中的 22 个精确 nodeid 字符串字面量。

未改动 pytest 标志、函数、进程/网络/文件系统/凭据防护、拒绝控制或清理逻辑；保留原 `conftest` 启用状态；保留 T37 在收集前忽略的设置。未新增 `--noconftest`，未改动产品、测试、断言、schema 或 guard。

## 验证边界

- 源码仅复制和作上述唯一替换，未执行。
- 唯一文件核验为最终 PowerShell 大小与 SHA-256 检查。
- 未运行 Node、Python、parser、AST、pytest、collect、build、prepare、app、HTTP、GUI、模型或运行时。
- 未读取或复用旧 job/served root，未联系其他聊天，未更换 API。
- 全程未执行 Git 写入；未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未更改沙箱、审批、ACL、writer 锁或受保护拒绝控制。

## 事实限制

22 个 nodeid 的通过状态尚待主编排按获批流程运行；本交回仅证明受限源文件已按批准内容生成。
