# 交回：SAME DemandClosure P0 UI（第二次也是最后一次源码轮）

执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-DemandClosure-P0-UI-final-source-20261102-172610.md`
执行者：独立 A 线（本 job，PID 即本执行者）
时间：2026-11-02（Asia/Taipei）

## 结论

三个允许修改的 UI 文件已按执行令施加最小修改，未动其他任何文件。
Git 严格只读，未 add / commit / rebase / stash / reset / clean / checkout / push。
本轮**未运行**任何测试、构建、tsc、Vitest、解析器、prepare、GUI、HTTP、模型或凭据相关动作；
Root 的原生 UI 验收为强制后续步骤（Root nativeUI acceptance mandatory）。

## 变更文件（仅这三个）

| 文件 | 字节 | SHA256 |
| --- | --- | --- |
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\archive.tsx` | 10534 | `3964C59AF12ADA94AC4181B55E186C5F6FD711C941E9D260AD829925E89BC080` |
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\case-tab.tsx` | 4289 | `D1B0F23F5C2C9964F5480E93122660144460B859457228DB022DB6BB56728EA0` |
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\overview.tsx` | 7645 | `645EA3F8920943719456F9AB2AF7CADFA8BFA95B1AA008607213F266FE2501E4` |

## 各文件改了什么

### 1. `archive.tsx`（归档成功后刷新同案成果）

- 新增 `import { refreshCaseResults } from './result-cards.tsx'`。
- `ArchiveDialog` 的 `build()`：`archiveBuild` 返回 `!r.ok` 时仍按原样 `setError` 并 return（**不刷新**）；
  成功分支在 `setBuilt(r.value)` 之后 `await refreshCaseResults(caseRef.case_id)`，
  外层 `try/catch` 吞掉刷新异常——**已生成到磁盘的归档不会被误判为失败**，
  界面上的成功结果（`built`）不受刷新失败影响。
- 未改选择/结果/请求契约（`buildRequest`、`applyEdit`、`blocker` 等一律未动）。

### 2. `case-tab.tsx`（案件页签：全量成果文件 + 材料事件订阅）

- `CaseSummary` 除原有 `useCaseEvent(OUTPUTS_CHANGED, id, reloadOuts)` 外，新增
  `useCaseEvent(MATERIALS_CHANGED, id, reloadOuts)`：手动材料重扫发的是 `MATERIALS_CHANGED`，
  此时成果索引可能已变，同样重读。事件名与常量取自 `kit.tsx` 既有导出，未新增事件。
- 渲染：主链接仍是 `outputFile(o)` 选出的那个（优先 Word），标题/时间/首次点击 OPEN 行为保持不变；
  其余**实际索引到的全部文件**（`o.files` 去掉主文件后的部分，含 PDF）逐条以
  `openCaseFile(caseRef, f.path)` 真实路径渲染为可点链接，文件名取 `path.split('/').pop()`，
  `title` 放完整路径。**没有 mock 数据**。

### 3. `overview.tsx`（概览卡：全量成果文件 + 事件订阅）

- `OutputsLine` 原来只有 `const [outs]`，现改为 `const [outs, reloadOuts]`，
  并订阅 `OUTPUTS_CHANGED` 与 `MATERIALS_CHANGED`（同一 `reloadOuts`），案件范围一致。
- 渲染方式与 `case-tab.tsx` 相同：主链接保持原有 `outputFile(o)` 行为与 title/时间，
  其余实际文件逐条以 `openCaseFile` 打开。
- `recentOutputs` / `outputFile` 导出原样保留，调用方兼容；
  未新增 import 行为、未动品牌、侧栏页签、未改旧 8 项 UI 行为。

## 未改动的文件（只读确认，未编辑）

- `dsh-ext/ui/kit.tsx`（`OUTPUTS_CHANGED`、`MATERIALS_CHANGED`、`useCaseEvent` 定义未变）
- `dsh-ext/ui/result-cards.tsx`（`refreshCaseResults` 未改，仍在 `finally` 里发 `OUTPUTS_CHANGED`）
- Host / SDK / 发票 / 契约 / T18 源码与冻结件 / 测试 / 文档 / 凭据：一律未动。

## 验证状态

- **SOURCE ONLY — NOT RUN**：本轮没有执行测试、构建、类型检查或任何运行期动作。
- 校验方式仅为源码核对：改动前后逐文件读过全文，改动点逐行回读确认
  （`archive.tsx` 第 9、61 行；`case-tab.tsx` 第 4、28-30、45、52 行；`overview.tsx` 第 5、94-95、103、110 行）。
- 合成数据与 Root 原生 GUI 验收由 Root 后续完成，本轮不代做。

## 阻碍与说明

- 无阻碍。上一次源码轮 `deadline_exceeded 480s`、三个文件未改的状态，已由本轮实际写入取代；
  本轮不复述历史命令计数与 provider 错误，只报当前事实。
- Git 写操作未执行，也不需要修：交付物是协调目录里的这份交回文件，不是提交。

## 后续（Root 侧）

1. Root 原生 UI 验收（强制）：确认归档生成后同一案件的成果列表出现新文书，
   且成果条目能列出 5 个及以上实际索引文件（含 PDF），均可真实打开。
2. 编译/类型检查与既有测试由 Root 或后续轮次执行（本令未授权运行）。
