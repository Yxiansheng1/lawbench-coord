# 致线 A · 执行令 · T13 契约 1.2 第二轮复核结果：INPUT_CHANGED 三条 P3 返修；P2-A 候用户（2026-09-30 15:50）

- 发件：ORCH（用户在场）
- 复核记录（先 `git fetch`）：`git show origin/main:docs/plan/evidence/T13/review-契约1.2-第二轮.md`。冻结清单十五条全部关闭、变异全红、R/X/Y 系列两种挂载模式全部一致——做得对。
- **解冻**：1516 令里"复核期间不要改 dock/state/agent/host"作废——复核员在固定提交的克隆上工作，你的工作树改动不影响它们。T17 双人复核仍在飞，结果另行落件。

## 一、P2-A（新的"显示 ≠ 实际"路径）——止损线触发，候用户 N48

输入区刚挂上、Skill 列表还没回来时，写入 effect（依赖 `[stored, sync]`）把第一次渲染的默认参数写给了服务，参数框随后显示 Skill 预设，但 effect 不重跑；状态行绿字、参数框 64K、服务存 128K。附带：此时写失败错误被键过滤掉，状态行卡"正在保存"、无重试。复核员验证过的最小修法：依赖改 `[stored, sync, key]`。按上一轮定的止损线，**我不发这条的返修令**，已上候 owner 清单 N48（推荐允许一并修）。用户定了我补一行令；**未定前不改这一处**。

## 二、INPUT_CHANGED 三条 P3（本次 `eb9d817` 引入，现在修；单独一个 `T13:` 提交）

| 编号 | 做什么 |
|---|---|
| P3-B | 收到 INPUT_CHANGED 后，把服务那份记为"需重写"（按会话的 stale 标记），写成功才清；在此之前 `key === serverKey.current` 的去重不生效。补用例：0.5 秒内切 B 再切回 A、参数本就默认时点"恢复默认"、成果区快速取消再选用——三种都要真的 POST |
| P3-C | ①Agent 插件在 begin 和 context 都成功时清掉该会话的记录；②输入区挂上或换会话时也取一次 `turnNotice`；③提示按会话放进 store，不放组件状态（S1 被拦 → 去 S2 也被拦 → 回 S1 提示仍在；重挂后仍在）；④**去掉**"空闲会话 updatedAt 变了算一轮结束"这条——复核员查了 DSH 源码，`updatedAt` 只在用户消息写入时变（`session-controller/src/index.ts:196`），它标记的是一轮开始；要保留的话只用于"提前取一次 turnNotice"、不触发重读。交付说明 17.6 改准确。补用例：被拦时律师在别的会话、之后回来提示仍在；漏取的旧提示不会在成功一轮后误报 |
| P3-D | `TurnNotices` 补单测（取一次即删，改成不删要变红）；Host `apply` 补接线测试（去掉 `noteTurnBlocked` 那一行要变红） |
| NOTE | 截图 `INPUT_CHANGED-01` 与 `INPUT_CHANGED-desktop.txt` 不是同一次运行（图是"合同起草"，文是"合同审查"）：重截或把记录改成一致 |

复核员留下的实验可直接复用：`C:\Users\<用户>\AppData\Local\Temp\claude\D--lawbench\780b8a59-…\scratchpad\rv-A18-T13-evidence\`（`rv-t13r2.spec.ts` 66 项、`rv-t13r2-z.spec.ts`），照它的 Y6/Y7/Y8 写你的用例。

## 三、顺序

这份返修优先于 T17 第三步（改动小、清单明确）；交回 `致ORCH-A-交回-T13-INPUT_CHANGED返修-<HHMM>.md`，然后回到 1516 令的第三步。