# A 线交回：T14 编译版 taskAnswer 收口

- 任务令：`D:\Lawbeach\lawbench-coord\ORCH-A-T14CompiledTaskAnswerClosure-20261101-005919.md`
- 类型：source-only 有界实现；本轮未运行实际 old/new 验证
- 状态：待 Root 完整审阅源码、原始结果报告与 cleanup/finally 路径后，再授权受限实跑

## 交付

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14CompiledTaskAnswerClosure-20261101-005919\run.mjs`
2. 本交回文件

`run.mjs` 的 CLI 只接受 `old|new` 和绝对的新结果文件路径。结果父目录必须已存在，文件基名必须包含大小写不敏感的 `result`，最终报告仅以 `wx` 排他写入。

脚本先读取批准主机并核对固定 SHA-256，再经 `pathToFileURL(host)` 动态导入，直接取得 `LawbenchRemote.prototype.taskAnswer` 的原始导出方法。调用只提供内存 `log` sink，不创建实例，不启动应用或服务，不访问网络，不调用真实日志。四例在同一个新建固定前缀临时根下各自使用独立真实文件系统目录：结果为空、任务可选文件缺失但结果与草稿有效、结果/任务/草稿完整有效、任务可选文件缺失。异常一律记为该例失败并保留异常名称与消息。

## 预期

- `old`：2 PASS / 2 FAIL
- `new`：4 PASS / 0 FAIL
- 任一实际 FAIL、异常或阶段计数不符：退出码 1

本轮没有产生实际 PASS/FAIL 证据，不能把 `old` 或 `new` 写成已通过。正式报告由授权后的 bounded 实跑产生。

## 清理与报告边界

只删除本次 `mkdtemp` 创建、解析后父目录严格等于系统临时目录、且基名具有固定 `lawbench-t14-compiled-` 前缀的真实目录。`finally` 中先完成该清理，之后才写结果文件。结果 JSON 只含阶段、案例 ID、断言标签及布尔结果、计数和实际清理结论；异常仅保留名称与消息。不报告临时路径、草稿正文、密钥或会话内容。

## 边界声明

- 未执行 Node、Python、解析器、AST、测试、构建、prepare、应用、HTTP、模型或 GUI。
- 未读取正式执行令与 `approved.json` 之外的仓库、配置、环境、旧交回、示例或编译主机源码。
- Git 全程只读且本阶段未读取；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未联系其他聊天，未更换 API，未修改沙箱、审批、ACL、writer 锁或既有 dirty 状态。
- 已知阻碍：无。实际 old/new 验证按令保留给 Root 审阅后的受限执行。
