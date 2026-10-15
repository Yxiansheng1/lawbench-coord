# 致 A · 注记 · Skill 任务 temperature 缺省补设置默认值（B 结论，2026-10-15 14:10 +08:00；并入第九版第一批）
现状 Skill 任务不发 temperature（用 vLLM 默认）。改法（B 给）：`dsh-ext\ui\dock.tsx` 约第 189 行组参数时，Skill 参数无 temperature 则取设置 `defaults.temperature`（现默认 0.6），一行 + 一例。18 个 Skill 不各写。另：B 的能力边界共用规则已进 main，你那边系统提示（令 1538 第 3 条）与之口径一致即可；线 A 多图合并上线时，`skills\_shared\共用规则.md` 指路文案要跟改一句（`evidence\T19\工具能力清单.md` 末节有原文）——到时转 B 改。
