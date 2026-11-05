# B 线 T18 辩护意见引用未读闸交回

- 状态：`AUTHORED_NOT_RUN`
- 运行器次数：`runtime=0`
- 工作树：`D:\Lawbeach\lawbench-B`
- 修改前快照：`D:\Lawbeach\lawbench-coord\T18CitedUnreadProductFix-20261101-144353Before\`（`drafts.py.before`、`Spec.md.before` 已保留）

## 既有证据

- 复用既有真实红灯结果：`outputs\T18-cited-unread-red-actual-current.json`。
- 既有口径：6 项测试、2 FAIL、4 PASS；总耗时 5.593 秒，测试阶段 3.75 秒；490 pins held；无 guard denials；无 Force。
- 本次未重跑测试、未启动 Python/Node/产品/HTTP/模型/界面或任何运行器。

## 修改范围

仅修改：

1. `service\lawbench\tools\drafts.py`
2. `docs\src\Spec.md`

未修改测试、测试辅助层、契约、schema、版本、SDK、Host、R/Session、输入、鉴权、guard 或 TaskState。未执行 Git 写操作。

## exact hunks

### 1. `service\lawbench\tools\drafts.py:324-388`

在 `merge_citations()` 后新增有限数值出处助手，并在 `save_draft()` 的既有任务锁和状态复核之后、`_save_locked()` 之前执行一次辩护意见检查：

```python
def _defense_unread_numeric_citation(tasks, root: str, task: dict,
                                     cites: list[dict]) -> tuple[str, dict] | None:
    """返回首个未被本任务当前版本完整读取的数值型出处，不解析材料正文或材料名。"""
    tid = task["task_id"]
    reads = tasks._read(root, tasks.rel(tid, "reads.json"), "files/reads.schema.json")["reads"]
    by_material_unit: dict[tuple[str, str, str], list[tuple[int, int]]] = {}
    for rec in reads:
        key = (rec["material_id"], rec["material_version"], rec["unit"])
        by_material_unit.setdefault(key, []).append((rec["from"], rec["to"]))
    for cite in cites:
        loc = cite["loc"]
        unit = loc["unit"]
        if unit not in ("page", "para", "line"):
            continue
        start = loc["from"]
        end = loc.get("to", start)
        next_unit = start
        for read_start, read_end in sorted(
                by_material_unit.get((cite["material_id"], cite["material_version"], unit), ())):
            if read_end < next_unit:
                continue
            if read_start > next_unit:
                break
            next_unit = max(next_unit, read_end + 1)
            if next_unit > end:
                break
        if next_unit <= end:
            return cite["material_id"], loc
    return None
```

`save_draft()` 新增：

```python
        cached_citation = None
        if task.get("skill") == "defense-opinion":
            cached_citation = citation_check(ctx, a["content"])
            unread = _defense_unread_numeric_citation(
                ctx.tasks, ctx.root, task, cached_citation[1])
            if unread is not None:
                material_id, loc = unread
                unit_name = {"page": "页", "para": "段", "line": "行"}[loc["unit"]]
                loc_text = (f"第{loc['from']}{unit_name}" if loc.get("to", loc["from"]) == loc["from"]
                            else f"第{loc['from']}-{loc['to']}{unit_name}")
                raise ApiError(
                    "INVALID_ARGUMENT",
                    "defense_citation_not_read",
                    f"引用位置{loc_text}尚未由本任务在当前材料版本完整读取。"
                    f"请先用 case_read_material 完整读取材料 {material_id} 的{loc_text}，再保存辩护意见。",
                )
        return _save_locked(
            ctx.tasks, ctx.root, ctx.case_id, task, title, a["content"],
            check_fn=lambda: cached_citation if cached_citation is not None
            else citation_check(ctx, a["content"]),
            coverage_fn=lambda: ctx.tasks.coverage(ctx.root, ctx.case_id, tid),
        )
```

行为边界：

- 仅对实际 `defense-opinion` 任务启用；非辩护意见保留原保存路径。
- 只核对已解析且单位为 `page`、`para`、`line` 的出处。
- 仅采信同一任务 `reads.json` 中、同一 `material_id`、同一 `material_version`、同一单位的读取记录。
- 内包含区间用游标和排序区间合并判断；部分读取、缺口、其他任务、旧版本或哈希不同均不能授权。
- 失败体仍仅为 `INVALID_ARGUMENT` 与中文 `message`；不新增错误码或错误字段，消息只含材料编号和数值位置，不含材料名、检索词、正文或材料内容。
- `citation_check` 在辩护路径只计算一次，原结果元组缓存后传给既有 `_save_locked()` 检查函数。
- 既有受保护写闸、费率检查、回滚、`_save_locked()` 和 `save_document_ui()` 未改。

### 2. `docs\src\Spec.md:906`

在 9.2 “结果清单”后只新增一段：

```markdown
- **辩护意见出处读取闸（T18）**：AI 保存辩护意见时，引用的页、段或行必须由本任务在当前材料版本中完整读取，读取区间按内含端点合并判断；检索命中、其他任务读取、旧版本读取和区间缺口都不算读取。该闸只约束 AI 的 `case_save_draft`，律师在界面的手工保存不变；Excel 单元格的版本与读取归属尚未证明，不能据此宣称已通过；本闸也不代表事实或法律内容正确。
```

未改既有“最多 2 轮”规则，未改 1.7 schema 行。

## 最终文件测量

| 文件 | 字节数 | SHA-256 |
|---|---:|---|
| `service\lawbench\tools\drafts.py` | 22908 | `03D8A77D41A75338AE3BAA239E9572B97D71D74AD4BFF4BBE01FE9709E20957D` |
| `docs\src\Spec.md` | 203807 | `43B34592492CBF6CB75B59DBAE3762AC0B60B9B67175D8A3B183532E1D5AD8F4` |

## 局限与待验

- 本次是 `AUTHORED_NOT_RUN`，静态补丁不能替代六项测试的实际绿证；2 FAIL 到全绿的动态结果尚未由本执行者取得。
- 因执行令特别验证禁区，未运行测试、解析器、构建、文档生成、服务、HTTP、模型或界面；`Spec.md` 的 HTML 未重新生成。
- Excel/工作表单元格的版本与读取归属仍是 `NOTPROVEN/OPEN` legacy compatibility 状态，未做笼统“已读取”放行。
- 本闸只证明指定数值位置由本任务当前版本完整读取，不代表事实、法律结论或草稿内容正确。
- 律师界面手工保存路径按令保持不变；本轮没有提供其行为变更证据。
- 未做 Git add/commit/rebase/stash/reset/clean/checkout/push，也未处理或改动任何 writer 锁、ACL、审批或沙箱设置。
