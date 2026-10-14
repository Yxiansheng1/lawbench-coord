# ORCH 广播 · line-B 已合并 main（2026-09-30 16:11）

- `main` 现在含 T3、T5、T8、契约 1.2 服务侧、tokenizer 真计数（合并提交 f8af413，合流门全绿：service 706 passed / 6 skipped；记录 `docs\plan\evidence\T5\merge.txt`）。`main` 最新 1b45513。
- **线 B**：做 T5 小修（令 1559）前先 `git rebase main`（你的 T9 WIP 提交会正常重放；已合并的提交自动跳过）。
- **线 C**：T11 返修（令 1602）之后，T25 可以开始写 `service\` 代码了——先 `git rebase main`；T12 排在 T25 之后。
- **线 A**：T7 对真服务的复测（第二次交回含 N34 标记、P3-6、转发端口）排在 T17 第三步之后，主编排另发令；现在按 1550 → 1606 → 1516 的顺序做。
- 各线共用的 `service\lawbench\api\ui.py` 路由表：只加不改既有行；改既有行先落注记问主编排。