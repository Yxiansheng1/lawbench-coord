# 受限排队兼容修复进度

状态：`SOURCE_ONLY / ROOT_RUN_PENDING`

## 进展

1. 已完整读取唯一执行令，并按令先核对修复前源码、根失败证据和当前 dirty 状态。
2. 已确认 UI19 两条失败来自 prepare 阶段返回限制，类型失败来自旧消息来源声明与可选限制字段冲突。
3. 已恢复 prepare 的 `Promise<void>` 契约；材料最后的同步接纳复核通过后返回限制。
4. 已让提交注册表从 prepare 快照汇总 admit 返回值，并在控制器 prompt 前同步规范化和传递。
5. 已把受限用户消息来源拆成独立、必填限制的窄类型；旧消息来源声明保持原形状。
6. 已只调整允许的第三例测试生产者，其他测试未改。
7. 已按上一轮原件快照重建 6 文件累积补丁，并完成静态签名、哈希、textdiff、空白和补丁结构核对。
8. 已写证据正文和源码交回件。

## 当前阻碍

- 执行令禁止运行测试、类型检查、构建、GUI、HTTP 和模型，所以当前没有新的运行读数。
- `dsh` 子模块的 Git 管理路径被权限拒绝，完整内层 `git status` 无法读取。目标文件已用修复前快照和最终 SHA-256 对照；未改权限、ACL、锁或沙箱。
- 17 次调用误把 shell 参数写成 `bash`，均在执行前被 MXC 拒绝，exit 1，无文件或状态变化。

## 待根侧动作

根主编排审阅源码与累积补丁，独立运行类型检查和既有测试分组。根侧取得真实退出码和分组读数后决定是否合流。

## 产物

- 证据正文：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ScopedQueueCompatibilityFix-20261026-193241\README.md`
- 源码交回：`D:\Lawbeach\lawbench-coord\A-handback-T31-scoped-queue-compat-fix-20261026-193241.md`
- 累积补丁：`D:\Lawbeach\lawbench-A\dsh-patches\P-29-scoped-queued-delivery-policy.patch`
- 补丁 SHA-256：`B282ECDC045C31D5001159D4B6EDE5E0C241AF4471E9CFADB0EDB3434123785A`

删减轮:读者 1 / 槽位 1 / 半句 1 / 重复 0 / 过程 0 / 黑名单 1

Response ID: `T31-scoped-queue-compat-fix-20261026-193241-A`

Response log path: `D:\Lawbeach\lawbench-coord\A-progress-T31-scoped-queue-compat-fix-20261026-193241.md`
