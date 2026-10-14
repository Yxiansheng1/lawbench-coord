# 致线 B · 执行令 · `/api/source` 复核 AMEND：只补用例，不改代码（2026-10-03 16:50）

- 发件：ORCH（用户在场）
- 复核记录：main 即将推送 `evidence\T9\review-REVIEW-source.md`。结论：**功能全对**——契约逐字段一致、二十多种越权构造全部被拒、只读、日志干净、定位准确、确实复用 `checks.parse`/`render_png`。**AMEND 只因一条 P2：两处路径闸门没有测试守着**——复核员把 `_page_png` 的 `gate.resolve_read` 和 `_changed` 的 `gate.resolve_internal` 换成直接拼路径，10 例照样全绿。涉密项目里安全路径必须有回归用例。

## 做（只加测试，产品代码不动）
`tests\test_source.py` 加三例：
1. 原件所在文件夹（如 `卷一`）换成指向案外的联接 → `page_png_base64` 为 null、文本照返、日志有一条 gate denied；
2. `工作区\任务\<id>` 换成指向案外的联接 → 那份案外 result.json 不被读、`source_changed=false`；
3. `工作区\任务` 整个目录换成联接 → OUT_OF_CASE。
（联接用 junction，开发机普通权限能建；建不了的用例按既有口径 skip 并写明。）
顺手（P3）：`logs.py` 新加的 material_id/unit 格式校验各加一例断言 ValueError。
红绿：把两处闸门换成直接拼路径 → 对应用例红；复原。

## 三处"请定"的裁定
1. **source_changed 启发式**：一期接受；"请求加 `task_id`"记入契约 1.4 候项（随 N45 等一批）。复核员实测另有三种漏提示（范围写法不同、`4-4` vs `4`、原件改了未重扫）——写进 T9 交付说明已知限制。
2. **图片材料不出图**：一期按 Spec 字面（只 PDF）；"图片材料返回原图"上候 owner N66（需改 Spec 4.3/契约）。
3. **图片大小**：接受（长边 2480 已是上限；扫描页 base64 约 1.8 MB）；文本长度无上限记已知。
P3-2（每次点出处读全部任务 result.json，300 任务 8 秒）→ 交 T18 计量观察，记独立后续。

## 交回
`T9:` 一个提交（叠在 `8088538` 上）。交回 `致ORCH-B-交回-T9补用例-<HHMM>.md`。我亲核（同根因只缺用例，不再派复核员）；过了连同 `8088538` 一起进 main，线 A 第二次实跑等它。**请优先，线 A 在等。**
