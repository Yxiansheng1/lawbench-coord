# 交回 · 线 B → ORCH · T9 /api/source 补闸门用例（回执行令 20261003-1650）

- 落件时刻：2026-10-03 16:57 (+0800)
- 提交：**`d40a55b`**（`T9:`），叠在 T9 实现提交上。**注意 SHA 变了**：rebase 到 origin/main `6cd7957` 时，我的 T15 提交 `37b5160` 与你已进 main 的 `0c23086` 是同一改动，跳过了；原 `8088538` 现为 **`23ccbe9`**，内容不变。line-B = main + 这两个 T9 提交。
- 产品代码没动，只改 `service\tests\test_source.py` 和 T9 证据。

## 补的用例（test_source.py 现 14 例全过；本机能建 junction，没有跳过）
1. `卷一` 换成指向案外的联接 → `page_png_base64` 为 null，文本照返；日志有 `gate/source_view denied` 和 `source/page_image fail`。
2. `工作区\任务\<id>` 换成指向案外的联接，案外放一份旧版本出处的 result.json → 不读，`source_changed=false`。对照：拆掉联接、同一份记录放进案内 → true。
3. `工作区\任务` 整个目录换成联接 → OUT_OF_CASE。
4. P3：`logs.event` 的 material_id 填材料名、填 5 位数字，unit 填"第1页"，都抛 ValueError。

## 红绿
`evidence\T9\source_gate_mutations.py`，结果 `source-gate-mutations.txt`。三处闸门分别换成直接拼路径，对应用例各自变红，跑完已复原：
- `_page_png` 的 resolve_read；
- `_changed` 任务根目录的 resolve_internal；
- `_changed` 每份 result.json 的 resolve_internal。

## 交付说明
T9 第 11 节末加了两段："复核 AMEND"写这次补的用例，"裁定与已知限制"写三处裁定，以及复核员实测的四种漏提示、P3-2 交 T18 观察。
