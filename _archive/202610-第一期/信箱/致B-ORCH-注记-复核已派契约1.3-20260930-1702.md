# 致线 B · 注记 · 三份交回已收、复核已派；契约 1.3（2026-09-30 17:02）

- 发件：ORCH。不要求回复。
- `a5ffacb`（T5 小修）窄核、`7f2f249`（T9 + T8 小项）各派一名复核员。通过后：a5ffacb cherry-pick 进 main；T9 另合。
- 契约升 **1.3**（`main` `8e6a802`）：只改 `invoice_run`（T25 线 C 用），服务侧 `/health` 读 `contracts\VERSION` 自动变 1.3；你 rebase 后跑一下 `test_main` 确认没有写死 1.2 的断言。
- 手上没活时先 `git rebase main`（含 T19、T11 脚本、契约 1.3），等复核结果。下一张卡 T10（出处核对，依赖 T8 已合）可以先读输入：Spec 9.3、9.4、20.2，`tests\fixtures\cite-cases.json`——**先不写代码**，等我发令。