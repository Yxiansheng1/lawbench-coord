# 致 ORCH：FullRegressionDockFixture 源码窄改交回

## 结论

已按 `ORCH-A-FullRegressionDockFixture-20261031-131102.md` 完成两份白名单测试 mock 的源码窄改。状态是 **source-only / authored-not-run**：没有运行测试、类型检查、构建或任何运行时验证，等待主编排按执行令做全量字节反向核对并运行原始受影响文件及相邻测试。

## 改动

1. `dsh-ext/tests/dock-review.spec.ts`
   - 给内存服务 `LineB` 增加 `sheetHold(request)`：与 Host 相同，仅当 `session_id` 是字符串且 `hold` 是布尔值时更新该会话持锁；始终返回 `{ ok: true, value: { held } }`，其中 `held` 读取实际会话成员关系。
   - 持锁复用该服务已有的 `TurnNotices.hold/held`，底层是按会话的 Set，没有共享全局标志或跨会话污染。
   - `run(session)` 在本会话被持锁时直接返回“被拦下”，模拟 Agent 插件的真实拒发门。
   - `api.sheetHold` 原样把既有 request 交给 `svc.sheetHold`。

2. `dsh-ext/tests/helpers/dock-lab.ts`
   - 以相同窄范围增加 `LineB.sheetHold(request)`、`run(session)` 持锁拒发门和 `api.sheetHold` 转发。

两份 mock 都只在 UI 显式发送成功后才收到 `hold:false`；失败、超时或仍在途的任务写不会由 mock 自动标记保存或释放。现有不可用模式、读写延迟、输入变更模式和调用顺序均未改动。未改产品代码、产品行为或 `engines/`。

## 原样保全

本次补丁只有上述窄增行：没有改测试名、测试正文、断言、期望值、时序、错误模式、fixture，没有跳测、弱化断言、扩大超时或把被持锁状态伪报为成功。所有既有测试正文按补丁范围保持不变。

## 改动前后身份

冻结基座：`D:\Lawbeach\lawbench-coord\FullRegressionDockFixtureInput-20261031-131102\source-before.json`。

| 文件 | 改前 bytes | 改前 SHA-256 | 改后 bytes | 改后 SHA-256 |
|---|---:|---|---:|---|
| `dsh-ext/tests/dock-review.spec.ts` | 23025 | `3dad925cd3493fe182d21da7165deffa6b40da1c95c82449c8cf479264b49edc` | 23479 | `48105e50d19372c17927a8cc14a63a4b1b9325609a47057da40b7ff6e749e4b2` |
| `dsh-ext/tests/helpers/dock-lab.ts` | 7545 | `5cd9786339a7432e8df0ccbbbf253a471b80c5a9bdc879fc0cd889116b35155d` | 8001 | `41685b990217d636248c7e525808c7a5f8e35376b4a5ffca4479a807e050d905` |

改前身份与 `source-before.json` 及 `0-before.txt`、`1-before.txt` 的 SHA-256 一致。改后身份来自唯一一次变更文件元数据读取（`Get-Item` / `Get-FileHash`）。

## 依据与边界

- 已读完整执行令、`AGENTS.md`、`PROJECT-PROFILE.md`、两份完整白名单测试源码、`dsh-ext/host/index.ts` 的 `sheetHold`、`dsh-ext/ui/dock.tsx` 的 `setSheetHold` / `releaseSelectionHold` 调用路径，以及 `dsh-ext/shared/turn-notices.ts` 的会话持锁实现。
- 全部 Shell 调用均为指定的原生 PowerShell 绝对路径、`login=false`、managed 隔离；未使用 Bash、cmd 或替代 shell。
- 未运行 Node、Python、AST/parser/import、自检脚本、测试、类型检查、构建、准备步骤、App/GUI、HTTP、模型、环境/凭据或 DPAPI 操作。
- 未执行任何 Git 命令，包括状态、add、commit、rebase、stash、reset、clean、checkout、push；未处理 `index.lock` 或扩权。
- 未启动 setup，未改沙箱、审批、策略或 ACL，未拆 writer 锁，未联系其他聊天或派子代理。
- 除两份白名单源码和本交回件外，未写其他文件。

## 差异与遗留

未发现需要上报的已知差异。因执行令禁止运行时验证，本次不能宣称任一测试已转绿；旧断言若仍与当前授权行为不兼容，应由主编排运行后按原始源码和期望值裁定，不应由本执行者改动。
