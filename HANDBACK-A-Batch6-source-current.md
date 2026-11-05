# HANDBACK-A-Batch6-source-current

- 状态：SOURCEONLY 完成，等待 Root 验证与合流；本轮未提交 Git。
- 执行面：独立 A 线 DeepSeek 执行者，按 `ORCH-A-Batch6-材料与滚动-source-current.md` 做有界源码修改。
- 基线：执行令给定 `a23271abee333a9a256fd46a3141da16975c2380` 加 owner 已接受 dirty；现有 dirty 全部保留，未 rebase/reset/stash/checkout/clean。
- Git：严格只读，未 add、commit、rebase、push，未改锁或权限。

## 改动路径

1. `dsh-ext/ui/case-tab.tsx`
2. `dsh-ext/ui/materials.tsx`
3. `dsh-ext/tests/dock-capsules.spec.ts`
4. `dsh-ext/tests/owner-batch6-material-management.spec.tsx`（新建）

`dsh-ext/ui/kit.tsx` 未改；DSH 产品源码未改；后端、接口和契约未改。

## 已实现

### 右侧案件页滚动

- `CaseSummary` 根节点成为约束高度内唯一纵向滚动容器：
  - `height: 100%`
  - `minHeight: 0`
  - `flex: 1 1 auto`
  - `overflowY: auto`
  - `boxSizing: border-box`
  - 底部留白 `24px`
  - 原生观察标记 `data-lawbench-scroller="case-summary"`
- embedded `Materials` 保持自然高度，不再嵌套 `100%` 滚动；独立 `Materials` 仍沿用 `S.pane` 的 `height: 100%; overflow: auto`。
- 其他 DSH 右侧页签未改。

### 材料管理

- 管理条支持：
  - 按材料名或相对路径即时、大小写不敏感搜索；
  - 全部、已解析、待识别、识别中、识别失败、已移除、丢失筛选；
  - 始终显示“共 N 份，当前显示 M 份”；
  - 当前筛选结果全选/取消全选。
- 待识别映射包含 `needs_ocr` 及带待识别页的 `partial`；失败映射包含 `failed` 及 `partial`，保留原始状态文字。
- 选择集合跨搜索和状态筛选保留；全选只增删当前筛选结果的 ID；隐藏已选项明确计数，批量操作只处理当前可见选中项，并在确认文字中明确隐藏项不会执行。
- 材料行增加稳定 `data-material-id` 和可访问复选框；复选框拦截点击、指针、鼠标按下和 dragstart 冒泡。当前材料源码未发现原有 reorder/draggable handler，因此未新增排序或持久化接口。
- 批量移除：
  - 仅当前可见选中且 `origin=ref`、未移除、非识别中的材料；
  - 两次确认，第二次明确不删除外部原件、会清派生文本/检索、wiki 需复核；
  - 按最多 100 个唯一 ID 分块调用现有 `materialsRemove`，固定当前 `case_id`；
  - 部分失败按响应保留，不宣称全部成功；实际有成功项时才发材料变更刷新；
  - 复制材料明确排除，原单条移除保留。
- 批量识别只把当前可见选中且待识别的材料交给原 `OcrDialog`；保留原发往 395 确认，`dewatermark=false`，没有自动 OCR/model 调用。
- 批量重定位只处理当前可见选中的缺失引用，按唯一 `ref_id` 分组，每个根顺序调用一次原生目录选择，并复用现有 `relocateMaterial`；取消某组只跳过该组，不构造路径。
- 批量进行中锁定批量按钮和同页单条操作；案件切换、卸载或筛选后旧异步回包不得改写新案件选择或发起新案操作。
- 原有单条移除、识别、重新定位文件/文件夹和“显示已移除的”均保留。

### Dock 红测

- 已证明根因：主页选中能力后，`ui/dock.tsx` 的 `openItem` 会执行 `setRowsOpen(false)`，整个能力入口行按产品交互收起；原首页用例随后直接调用 `tab('民事与商事')`，未执行用户会点的“选能力”重新打开步骤，所以定位结果为 `undefined`。
- `dock-capsules.spec.ts` 只在首页用例中加入一次“选能力”打开步骤；五轮循环、换组、断言均保留，没有 skip、没有放宽断言。

## 新增测试覆盖

`dsh-ext/tests/owner-batch6-material-management.spec.tsx` 覆盖：

- 案件概览根滚动 CSS 与 24 份材料；
- 名称/相对路径搜索、状态计数、待识别/失败映射；
- 筛选变化保留选择、全选只作用于当前结果、隐藏选择不进入批量调用；
- 两次确认与取消零调用、105 项按 100/5 分块、部分失败提示；
- 复制/已移除/识别中排除与原始单条按钮保留；
- 批量 OCR 只提交实际选中项且 `dewatermark=false`；
- 唯一 `ref_id` 分组、每根一次目录选择、取消一组继续下一组；
- 案件切换和卸载后的旧异步回包隔离。

## 已做验证

- 只读检查执行令、owner 原文、相关源码、契约与现有测试夹具。
- `git --no-pager diff --check -- dsh-ext/ui/case-tab.tsx dsh-ext/ui/materials.tsx dsh-ext/tests/dock-capsules.spec.ts`：通过，无空白错误。
- 改动路径静态核对：产品修改仅 `case-tab.tsx`、`materials.tsx`，红测仅 `dock-capsules.spec.ts`，并新增指定测试文件。

## 未做与已知限制

- 按执行令 SOURCEONLY，本轮没有运行任何测试、parser、tsc、build、prepare、serve、probe、GUI、模型调用或网络探测；新测试尚未执行，不能宣称测试通过。
- 未做真机滚轮、滚动条拖动、最后一份材料按钮可见/可点验证；该证据仍需 Root/owner 在真实 24 份材料案件上补。
- 当前 `materials.tsx` 未发现原有拖拽排序 handler，因此无法证明 DND 回归或做排序保持验证；没有新增 DND/API，不能记为 DND PASS。
- 完整 `git status` 因受限子模块 worktree 路径权限被拒，按令未修复、未扩权；受限 `git diff --check` 正常完成。
- 执行中曾有两次只读 PowerShell 调用误把 shell 参数填成 `bash.exe`，命令均在启动前因 `E_ACCESSDENIED` 拒绝，没有执行、没有产生文件或状态变更；发现后立即改回指定原生 `pwsh.exe`。完整 `git status` 另触发长路径只读告警，已主动中断，未产生写入。
- 批量移除只能保证接口契约内的引用材料安全路径；复制材料仍需原单条“移除此材料”。
- 无 Git SHA 可交付，因为本轮禁止暂存和提交；交回以本文件为准。
