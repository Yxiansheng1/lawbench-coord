# A 线交回：全量回归 dock 剩余 8 失败源码因果审计

日期：2026-10-31  
执行者：A 线 `deepseek-v4.1-flash`（原生 MXC，managed 隔离）  
范围：仅 `dock-review.spec.ts` 的 X7/X8 两种挂载模式 4 例，以及 `dock.spec.ts` 的 R3、R11、写到一半又改、X8 4 例。

## 1. 核验结论

- 原始 A 线正式全量：1344 项，1202 过、124 败、18 待定、类型错误 0。
- Root 对本次 8 个失败所在范围的原始 135 项重放：127 过、8 败、0 待定、类型错误 0；`source_changes=[]`，没有新的源码改动，只有此前已接受的两处测试夹具补充。
- 本次是夹具恢复后的 focused replay，不能把 127/135 或尚未消除的 8 个失败写成全项目通过。
- 8 个失败不是可统一定性为“8 个产品 bug”，也不能统一定性为“8 个旧测试作废”。源码可证明的拆分是：
  - 3 例：旧断言要求“任务单仍在保存时按上一选择发送”，与现行“选择写入在途不得发送”的明确约束直接冲突，属旧期望，不是产品缺陷。
  - 3 例：X8 同一症状在两种挂载模式和 `dock.spec` 各出现一次。测试所谓“软件重启/插件重载”没有重置 Host 的会话拒发门，反而清掉了 UI 侧待确认释放记录；`sheetHold` 忠实落地后，门跨重启残留。就“软件重启”语义而言属夹具生命周期错误，不足以证明产品缺陷。
  - 2 例：`dock-review.spec.ts` X7 两种模式。失败只给出汇总值“不一致”，没有给出完整 ROW，不能凭旧错误串断言当时显示的是 A、B 还是别的状态，也不能断定产品缺陷或旧期望。须保留为未定。

## 2. 原始证明与现行行为链

### 2.1 原始证明

- 正式证明：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\full-regression-dock-fixture-replay-current.json`
- 夹具源审查：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\full-regression-dock-fixture-source-reviewed-current.json`
- 证明中 `source_changes=[]`、`models=0`、`real_credentials_read=false`、`GUI=0`、`Packaging=HOLD`、`whole_project_fullsuite_complete=false`、`release_ready=false`。
- 两处已接受的夹具补充是 `tests\dock-review.spec.ts` 和 `tests\helpers\dock-lab.ts` 的 `sheetHold` 路径；原断言、原用例主体和原时序保持不变。

### 2.2 产品与 Host 的实际操作链

1. UI 选胶囊、Skill、参数或输入成果后走 `setSelection()`，把该会话选择记为 `saved:false`（`ui\state.ts:126-130`）。
2. 写选择 effect 每次取新的会话代次 `nextSelectionWrite()`，立即调用 `setSheetHold(..., true)`（`ui\dock.tsx:432-469`）。因此不是等 500 ms 防抖结束才拦，而是从律师改动那一刻起就拦。
3. 500 ms 后执行写入；写入成功后必须再得到 Host 的显式 `sheetHold(false)` 回执 `{held:false}`，并且该代次仍是最新，才 `markSelectionSaved()`（`ui\dock.tsx:191-196, 492-512, 522`）。
4. Host 把 hold 保存在进程内 `TurnNotices.holds`（`shared\turn-notices.ts:62-69`；`host\index.ts:458-465`）。Agent 在 `preStep` 第 1 步若看到该会话仍 held，就记 `TASK_SHEET_FAILED` 并整轮 reject（`agent\index.ts:258-264`）。
5. 会话每轮结束由 `ui\index.tsx:339-343` 发出开始/结束事件。结束时有提示则先取提示、处理本轮到期的选择清除，再读 `task/current`（`ui\dock.tsx:377-400`）。
6. 挂上、换会话和 `TURN_ENDED` 的读回在 `ui\dock.tsx:317-354`。有未保存本地改动时一般不覆盖；只有存在 `selectionReleaseNeeded` 且服务读回的键与该待释放键相符时，才尝试严格按代次释放。
7. 旧代次受 `isSelectionWrite()` 守卫，不能释放或确认新代次（`ui\dock.tsx:168-195`）。这是必须保留的并发不变量。

## 3. 逐症状因果表

| 症状 | 失败用例与当前断言 | 证明里的实际结果 | 精确源码触发 | 夹具偏离 | 现行设计依据 | 静态定性 |
|---|---|---|---|---|---|---|
| D1 一秒内 B→A→B，最后一次后仅 100 ms 就发 | `dock.spec.ts:219-225`；“正在保存”状态下 `expect(await send('S1')).toBe(A.id)` | 实际为 `被拦下`，断言报 expected `被拦下` to be `contract-review` | A 已保存；随后三次 `setSelection()` 产生新代次。最后一次 B 的 effect 已调用 `setSheetHold(sid,newGeneration,true)`，但 500 ms 写入尚未开始。Host `held=true`，Agent 第 1 步直接 reject | 无。`Service.send()` 的 `holds.has(sessionId)` 正是忠实 Host 语义 | 本次正式执行令明确要求“Preserve no-send while selection write in-flight”；旧 T13 交付说明 `交付说明.md:247` 记录的“按服务上一次选择跑”已被这一现行约束覆盖 | 旧期望；不是产品缺陷；不得为过旧断言放开 pending hold |
| D2 选 A 后改 B，仅 200 ms 就发 | `dock.spec.ts:308-312`；`expect(await send('S1')).toBe(A.id)` | 实际为 `被拦下`，断言报 expected `被拦下` to be `contract-review` | 与 D1 同：B 未写成，hold 已 true，500 ms 写计时未到；发送被 Agent 整轮拒绝 | 无 | 同 D1；测试前一行也已经断言状态为“正在保存选择…”，但下一行仍要求旧 A 实际运行，语义自相冲突 | 旧期望；不是产品缺陷 |
| D3 旧写落地时新选择仍在途中 | `dock.spec.ts:346-352`；A 写入需 1 s，B 排队；1.6 s 时服务仍为 A，状态“正在保存”，但断言 `expect(await send('S1')).toBe(A.id)` | 实际为 `被拦下`，断言报 expected `被拦下` to be `contract-review` | A 的旧写入完成后，B 仍在同一会话写队列中执行；B 代次的 hold 尚未收到显式 false 回执。发送时 held=true，被 reject | 无。`writeDelay`、串行队列和 hold 均忠实模拟 | 同 D1、D2；现行要求选择写仍在途时不得发送，也不得以旧代次 false 释放新代次 | 旧期望；不是产品缺陷 |
| D4 另一窗口直接把服务选择改为 B；本窗口一轮结束后再发 | `dock-review.spec.ts:142`，两种挂载模式各一次；第二轮断言 `expect(row(...)).toBe('一致')` | 两个用例都报 expected `不一致` to be `一致`。这是 ROW 汇总判定；证明没有披露该 ROW 的完整显示、状态行和实际运行值 | 第一轮前本窗口显示 A、服务已是 B，这是既有已知限制。`turnEnded` 后应走 `notice → clearAfterTurn → load`；`task/current` 读到 B 后应 `applyServerSelection`。但仅凭当前证明无法证明哪一步未达到断言，也不能排除初始 hold 回执时序造成的“被拦下” | 直接 `svc.create(B)` 模拟另一窗口改服务，不模拟 UI 写，是该原用例既有手法；仅凭错误串看不出是否还有 hold 生命周期偏离 | T13 明确把“一轮前 A→B”列为已知限制，并要求“一轮结束后 B→B”（`交付说明.md:464-473`）。PRD 7.9 只规定输入区有当前胶囊/Skill/参数控件，不定义这个竞态时序 | **未定**；不能证明产品缺陷，也不能称旧断言已作废。需要最小运行时元数据 |
| D5 改 B 后未到 500 ms 就“重载/重启” | `dock-review.spec.ts:143` 两种模式 + `dock.spec.ts:587-592`，共 3 例；期望读回 A 并按 A 跑 | 3 例都只报 expected `不一致` to be `一致`，没有完整 ROW | B 的选择 effect 已成功 `sheetHold(true)`；500 ms 写计时尚未到。卸载使写代次/生命周期失效，因此旧写不会执行。测试 `restart()` 清空 UI store 和 `selectionReleaseNeeded`，但复用同一个 `LineB/Service` 对象，其 `holds` 仍为 true。重挂读回 A 时不存在待释放记录，发送时 Agent 仍看到 held=true，只能 reject | **有。** 测试把“软件重启”和“插件重载”合为一个 helper：`dock.spec.ts:109-117`、`dock-review.spec.ts:89` 只重建 UI 状态，不重建 Host holds。T14 复核已明确 hold 在 Host 进程内存中，“软件重启就清空”（`review-REVIEW-T14派修三件.md:48`），而当前 helper 恰好保留了它 | 现行要求重挂后读服务 canonical A；同时必须保留显式 false 回执和旧代次不得释放新代次。若为真正的软件重启，应先重建 Host notices 再验证 A 可发；若是仅 UI 重挂/Host 存活，当前状态是否有意继续拒发尚未单独建模 | “软件重启”用例属夹具生命周期偏离，不足以证明产品缺陷。插件重载而 Host 存活的情形仍是待观察风险，不能通过整体 clear hold 猜修 |

## 4. 不变量核对

- 选择写入在途不得发送：D1–D3 的 `被拦下` 正是该不变量在忠实夹具下的表现；保留。
- 必须收到显式 `{held:false}` 才算释放：`releaseSelectionHold()` 同时核对响应 `held===false` 和代次（`ui\dock.tsx:191-196, 498`）；保留。
- 旧代次不得释放新代次：`setSheetHold()` 在执行串行队列项前检查 `isSelectionWrite()`（`ui\dock.tsx:179-185`）；保留。
- 跨会话隔离：generation、in-flight、hold queue、release-needed 均以 `sessionId` 为键；Host holds 也是按会话 Set；不得合并成全局门。
- 重挂以服务 canonical selection 为准：读回入口为 `taskCurrent → fromServer → applyServerSelection`（`ui\dock.tsx:321-353`）；仍需保留。
- 本会话自己的 INPUT_CHANGED、CASE_MOVED、TASK_SHEET_FAILED 等上下文门没有在本审计中发现需放宽的依据。
- 本审计没有建议“为通过旧断言而把 pending hold 当已释放”；X8 的最小修法也必须区分真正 Host 重启与仅 UI 重挂。

## 5. 未决观察与最小诊断

### 5.1 X7：只补错误上下文，不改变业务断言

建议在现有 X7 第二轮断言处，把 `row()` 刚写入的完整 ROW 作为失败消息一并带上。最小字面改动形态：

```ts
const verdict = row(`${M}|X7-一轮后`, begin('S1'))
expect(verdict, rows.at(-1)).toBe('一致')
```

这样只增加既有测试元数据的失败可见性，不改变操作顺序、不断言新的 DOM 值、不放宽期望。`rows.at(-1)` 会直接显示 `下拉=… 状态=… 实际=…`，足以把 D4 归为显示陈旧、错误门残留或读回未完成之一。

### 5.2 X8：把两个不同生命周期拆开

建议 Root 在决定修法前增加一个极小诊断，不改产品：

1. **真正软件重启**：重挂时同时新建/清空 Host notices（等价于进程重启），保留服务 canonical A；预期 A 可发送。
2. **仅输入区卸载重挂、Host 存活**：保留原 notices 和 held=true；只观察并记录当前行为，不把“应拒发”或“应释放”先写成产品结论。

第二种情况必须与“明确选择写成后 false 回执”区分；不能由重挂本身无回执清门。

## 6. 规范与设计依据

- `docs\src\PRD.md:364-370`：只规定案件工作区的当前胶囊、Skill、参数等界面位置，没有定义选择写入与发送的竞态时序。
- `docs\src\Spec.md:895, 1036-1037, 1446, 1545`：记录任务单/current selection、胶囊 entry、输入成果和 1.2 历史语义。
- `docs\plan\evidence\T13\交付说明.md:247`：旧口径“保存中按上一次选择跑”；`交付说明.md:464-473`：X7 一轮前不一致、一轮后应一致，X9 重载后有空窗。
- `docs\plan\evidence\T13\交付说明.md:1427-1444`：用户 2026-10-11 将选择改为“管到任务结束”。
- `docs\plan\evidence\T13\review-REVIEW-T14派修三件.md:48-50`：hold 在 Host 进程内存中，软件重启清空；写成后显式 false 去除。
- 本次正式执行令：现行优先级高于旧用例注释，明确保留 in-flight no-send、显式释放回执、跨会话隔离和旧代次保护。

## 7. 审计操作边界

- 产品源码修改：0。
- 测试/夹具修改：0。
- 原始证据修改：0。
- 运行测试、类型检查、构建、应用、HTTP、模型、凭据：0。
- Git 命令，包括只读命令：0；未 add/commit/rebase/stash/reset/clean/checkout/push。
- 最终只新增本交回文件。
- 操作阻碍：有 7 次工具调用误把 shell 参数填成 `bash`，均在命令执行前被 MXC/沙箱拒绝（`E_ACCESSDENIED` 或 MSIX packaged app 不可启动）；随后全部以指定原生 `pwsh.exe`、`login=false` 重试。没有源码、工作树、进程、锁或证据状态变化。

## 8. 最终判定

- D1、D2、D3：现行行为正确，旧断言过时。
- D5：按“完整软件重启”语义，测试夹具错误地让 Host hold 跨重启存活；不据此认定产品缺陷。插件重载而 Host 存活的子情形仍需 Root 用上面的有界诊断决定。
- D4：证据不足，未知；不得把 8 个失败整体宣称为产品 bug，也不得整体清理为 obsolete。
- 全量仍为失败状态；本次只完成 8 个 dock 失败的源码因果审计，不构成修复、全项目通过或发布就绪。
