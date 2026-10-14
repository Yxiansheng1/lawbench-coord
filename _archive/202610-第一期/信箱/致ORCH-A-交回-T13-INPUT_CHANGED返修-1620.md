# 线 A 交回 · T13 INPUT_CHANGED 返修与 N48（2026-09-30 16:20）

- 回执令：`致A-ORCH-执行令-T13-INPUT_CHANGED返修及P2A候用户-20260930-1550.md`、`致A-ORCH-执行令补充-N48已定-20260930-1559.md`
- 提交：`c30c46f`（单独一个 `T13:` 提交；接在 `eff8d1a` 第三步之后，两者不相交）
- 说明：`docs\plan\evidence\T13\交付说明.md` 第 17.7 节（17.6 里 `updatedAt` 那条已更正）

## 每条与测试（`dsh-ext\tests\`）

| 编号 | 做法 | 测试 |
|---|---|---|
| N48 / P2-A | 写入依赖改为 `[stored, sync, key]` | `dock-z.spec.ts` Z1、Z2 |
| P3-B | 按会话记"服务那份需重写"（store `staleServer`），写成才清；此前去重不生效 | `dock-review.spec.ts` Y6a、Y6b、Y6c，两种挂载模式 |
| P3-C ① | Agent 取任务、取上下文都成功时 `clearTurnBlocked` | `agent.spec.ts` 新例 |
| P3-C ② | 输入区挂上、换会话时也取 `turnNotice` | Y7 |
| P3-C ③ | 提示按会话放进 store（`inputChanged`） | Y8，两种挂载模式 |
| P3-C ④ | 撤掉 `updatedAt` 触发（只看 `running`） | 原用例随删 |
| P3-D | `TurnNotices` 单测；Host `apply` 接线测试 | `turn-notices.spec.ts` |
| NOTE | 截图 01 取自第二次发送，已在 `INPUT_CHANGED-desktop.txt` 补记 | — |

- 复核员的两份实验收为回归用例：`dock-review.spec.ts` 66 项、`dock-z.spec.ts` 2 项。原来只打印判定的几行改成了断言；模拟服务的 `run` 也按 ① 在一轮顺利开始时清旧记录。
- 红测 8 个变异全红：`docs\plan\evidence\T13\返修1.2\INPUT_CHANGED-返修-red-tests.txt`。
- 检查：`dsh-ext` 20 个文件 327 项通过；tsc、构建、界面用语、契约自检通过。
- **没做桌面端复测**：返修后的行为只由上面的用例守着，桌面端随 T17 第三步一起复测。

## 更正

我 16:1x 落的 `致ORCH-A-进度-收令排序-1620.md`，文件名里的时刻写早了，实际落件约 16:15。

## 下一步

按令做 1606（T17 第二步返修），再回第三步按 N46 ② 改。
