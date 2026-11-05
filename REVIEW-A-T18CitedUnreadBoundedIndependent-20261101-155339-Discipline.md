# REVIEW-A · T18 出处读取闸 · 独立复核（A线，20261101-155339）

只读复核同一冻结全量包 `T18CitedUnreadCumulativeIndependent-20261101-154523`。未执行产品代码、未跑测试、未改源码；Git 全程只读。runtime 0。

判据（判定前重读）：仅 live defense-opinion 模型保存——已解析 page/para/line 出处须在权威当前任务 reads.json 中按相同 material_id/version/unit 完全覆盖，且判定在落文件／版本／result 之前；报错可执行且守住 code/message 隐私；API 1.7、schema、auth、SDK、TaskStore、guard、UI、手工保存、其他 Skill 不变。

## Findings

P0：无。P1：无。

**P2-1（target，独立跟进）材料文本不可用时反向区间绕过闸门。**
不变式：仅 start ≤ end 的区间能挡住闸门。`Material.check_loc`（parse.py）在 `units is None` 时返回 None，于是 `〔材料 第5-3行〕` 仍进结构化 cites（citations.py `_check_fact` 的 setdefault 在 check_loc 之后）；闸门中 `next_unit = start > end`，`next_unit <= end` 不成立 → 判为已读。
证据：code-capsule `_defense_unread_numeric_citation` 末段判定 + parse.py check_loc + citations.py `_check_fact` 顺序。
最小修法：`end = max(end, start)`，或 start > end 直接判未读。材料文本可用时已被 E 类挡住，属窄口。

**P2-2（独立跟进）闸门只按 reads.json 区间判"读过"，未复制 coverage() 的 OCR 占位规则。**
证据：task-store.py `coverage()` 的 `got -= {…PENDING_OCR…}`；闸门不读材料文本。个别"本页需识别"占位页仍算已读。
最小修法：闸门同样排除占位单元，或在 Spec 注写明本闸以 reads.json 为准。

**P2-3（独立跟进）Spec 新注"必须由本任务……完整读取"措辞不准。**
预算续接会把上一个 budget_stopped 任务的读取记录写进本任务 reads.json（task-store.py `_carry_reads`；测试 `test_t18_edge_budget_stopped_carries_reads_to_next_same_session_task` 续接后允许保存）。实现符合判据，措辞需补"含预算续接带入"。

**NOTE-1（测试维护，独立跟进）** 反事实夹具硬依赖仓库外绝对路径 `…T18CitedUnreadProductFix-20261101-144353Before\drafts.py`（钉 sha256）；仅 `LB_T18_COMPARE_ORIGINAL_SAVE=1` 时读取，干净检出无法复现。建议 vendored 进测试或 tests/fixtures。

**NOTE-2（证据缺口）** 真实模型现场从未触发新拒绝：`T18-cited-unread-native-actual-closed-current.json` 的 `denied_draft_attempts` 为空、3 次保存全放行；消费端在第一次合法原文读取处即 FAILED（`tool failed for chatcmpl-tool-…`），任务仍结算 completed。故"模型收到拒绝后改写再存"无现场证据，不据此宣称全量或语义 PASS。

**NOTE-3（发布产物缺口）** Spec 源已改，但两个运行环境缺 `markdown_it`，HTML/PRD 未生成（`T18-cited-unread-spec-HTML-current.json`：NOT_RENDERED_MISSING_EXISTING_MARKDOWN_IT_DEPENDENCY），发布产物不完整，需另补。

**NOTE-4（非阻断）** 闸门经私有 `tasks._read` 读 reads.json，无公开访问器；闸门在任务锁内、reads 追加走另一把锁，并发下判定后完成只会保守拒绝（fail-closed），不会误放行。

**NOTE-5（契约为先）** 复用既有 `INVALID_ARGUMENT` + detail，reason 仅进日志；未新增错误码、未改 contracts。

## 累计变更完整性

差分仅三处：新增 `_defense_unread_numeric_citation`、save_draft 内 defense 钩子与 `cached_citation` 复用（免二次 citation_check 与二次日志）、Spec.md 一行注；测试 11 节点与已执行工件 sha256 b95422… 一致。task-store／tools／core-api／errors／parse／citations／materials／agent-consumer／契约 schema 均未变；`save_document_ui`（手工保存）未接闸，符合判据。

## 判定

**PASS**（仅限上述判据的实现层面）。不得据此宣称：事实／法律质量 PASS、Excel 单元格来源（OPEN）、完整服务全绿（1412 项中 18 FAIL/8 ERROR，同 26 失败键）、模型端拒绝恢复已验证、发布产物已完整。

AUTHORED_REVIEW_ONLY / runtime 0
