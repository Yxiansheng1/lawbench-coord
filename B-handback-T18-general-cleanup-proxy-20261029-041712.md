# T18 清理代理身份修正交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 按执行令修正清理 helper 的 AgentRegistry 身份观察，保留原真实空 Context 生命周期断言与三处调用路径。 |
| 结果状态 | `AUTHORED_NOT_RUN`。helper 已改、静态差异已核；没有运行生命周期检查，不能写成通过。 |
| 目标是什么 | 让 Root 后续的一次有限检查比较代理背后的实际 AgentRegistry，而不是误比较每次访问都可能新建的代理门面。 |
| 在等什么 | 等 Root 完成完整源码、全部命令、公共 API 证明和反向恢复核对，再执行一次受影响的真实空 Context 有限检查。 |
| 卡在哪 | 本轮无执行停摆。根仓库只读状态查询在 `dsh` 子模块处被权限拒绝；没有修复目录、锁、ACL、审批或沙箱。 |

## 交付位置

- 修正注记：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingCleanupContract-20261029-040438\proxy-identity-correction-20261029-041712.md`
- 修正 helper：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingCleanupContract-20261029-040438\cleanup-context-finite.mts`
- 本交回件：`D:\Lawbeach\lawbench-coord\B-handback-T18-general-cleanup-proxy-20261029-041712.md`

## 改动

- 从既有 Cordis 模块捕获公共 `symbols.original`，断言其类型为 `symbol`，并把该符号显式传给 `runCancelJoinBranch` 的三次调用。
- 将直接代理引用相等断言替换为两侧实际底层 AgentRegistry 的同一性断言；两侧缺失分别先被拒绝，最终比较使用原始布尔结果，避免失败时检查 Cordis 代理。
- 没有加入假 Agent/注册表、回退、mocking 或减弱旧断言；真实 `get/list`、fiber 释放、旧条件 `TypeError`、新条件跳过及模型/会话/HTTP 为 0 的证明设计保持不变。

修改前 helper 为 9215 字节、`7F28979A88E96CA88769C6941EDAD4EEB7AD891452889FC56A765E7B79797C72`；修改后为 9990 字节、`738B1F05CC648E7703214C35ACD09CD0B99905928132B0BD7C19A363CB2392D0`。精确反向恢复步骤已写入修正注记。

## 保持不变的证据

- 候选入口保持 101408 字节、`9DC27EB332B0AEDFBC520929B80ED88654D260F6AA0F6E24E109F4CF626C3B40`。
- 固定清单保持 11693 字节、`C56DF90760EC5D80698DE3B733D275E1164ACA0D02E91A64B0A086BD01E31B17`。
- B 服务保持 42461 字节、`85A16D5EC6729E608BA32834E189D64BE9406FED5043687CB9F477A28827FE07`。
- 旧 README、旧报告、旧正式交回和旧结果均未改写。

## 验证与未做

- 已做：只读逐行差异、文件 hash、辅助符号 API 源码与 bundle 导出核对。静态差异只涉及授权身份观察和参数传递。
- 未做：Node、TypeScript、Python、解析器、AST、导入、检查、测试、构建、HTTP、模型、界面、Key、环境发现或 SSH。
- 未改：产品源码、SDK、测试、Skill、lib、构建产物、运行固定项、全局权限、审批或沙箱。
- Git 全程只读；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。交回以本文件落盘为准。

旧有限运行失败记录仍为 `cannot get property "href" without inject`，没有精确定位到运行行，也不据此指认产品缺陷。旧清理报告继续为 `FAILED`；完整 T18、项目总体和法律/业务验收未完成，打包继续 `HOLD`。
