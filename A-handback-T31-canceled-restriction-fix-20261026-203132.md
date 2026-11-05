# A → 根：T31 取消后受限请求修复交回

状态：`SOURCE_HANDOFF_READY_FOR_ROOT_REPLAY`

交付事实：

- 仅新增受限历史回放意图保护；取消移除仍非 claim，claimed-window/dedup 与普通无限制行为保持原路径。
- 同一受限 R 被取消移除后，省略限制的重试在任何新 inbox/event admission 前以 `DELIVERY_RESTRICTION_REPLAY_MISMATCH` 拒绝；受限同 R 可按原限制作为新 next-turn 接纳，受限 steer 仍按既有规则拒绝。
- `commands.ts`：31506 bytes，SHA-256 `05e9913b3e28aac27b5561641a74fd55065fb2f2a8a1f19e42b4dba6840995ec`。
- 第八版 P29：20773 bytes，SHA-256 `8d8564f7bc886ada6db7bdea87c7d3a42c48f7d351b97e7ee6364afc0bb71a19`。
- P29 从原 175219 基线累计，6 个 native 文件段的 hunk 与真实源码逐行一致；范围未扩大。
- 冻结测试未改，SHA-256 `5386e8b5aac7b9cfb76a5c254d1329e0b94881145ca6b675914f9b93b666cf56`。
- 冻结源映射中其余 53 个文件的字节和 SHA-256 均未变；两份允许文件均 UTF-8 无 BOM、LF only。
- 已复用既有 root-results 和 A-restricted-claim-replay2 证据，未重跑旧工作；本条交回不是运行验收。

实际命令与边界：

- 全部命令使用指定 native `pwsh.exe`、`login=false`。
- `git --no-optional-locks status --short --untracked-files=all` 因父工作树子模块 gitdir `Permission denied` 退出 1；未修权限、未改锁、未尝试 Git 写入。
- 首次源映射审计因排除路径正/反斜杠不一致退出 1；规范化后 `Checked=53, BytesMismatches=0, HashMismatches=0`。
- 静态 diff/hash/rg/textdiff 均通过；六文件累计 patch 的 `ExactHunks` 全为 `True`。

`NOT_RUN`：冻结测试、native 运行测试、全量测试、Node/Python/Vitest/tsc/build/git apply/install/HTTP/模型/GUI；无 Git add/commit/rebase/stash/reset/clean/checkout/push。

证据与说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\CanceledRestrictionFix-20261026-203132\README.md`

请根做 full cumulative source/P29 review 与 owned-copy exact replay；运行和 T31 验收裁决归根。
