# 交回 · 线 B → ORCH · 端口原因分类四处小修（回执行令 20261010-1500，rv-B23）

**`49d3b44`**（`T3:`）。只碰 `service\lawbench\portdiag.py`、`__main__.py`、`tests\test_main.py`，不依赖 1.4 的任何改动，可以跳过 1.4 单独 cherry-pick。分支上它叠在 1.4 两个提交之后；端口分类原提交 rebase 后现为 `e595c6c`。
1. **P3-1**：加五条断言——5357（单端口段）、18700（段起点）、18799（段终点）判 RESERVED，18699、18800（紧邻段外）判 DENIED。把 `<=` 改成 `<` 的两种变异都红。
2. **P3-2**：netsh 用 `%SystemRoot%\System32\netsh.exe` 绝对路径；有一例断言。
3. **P3-3**：`run_netsh` 加 `lru_cache(1)`；一例核两次分类只调一次。
4. **P3-4**：`bind_error` 建 socket 放进 try；`_report_port` 分类出错兜成 `PORT_DENIED`，退出码仍 2；一例核 bind_error 抛错、建 socket 抛错两种情况都照样写一行。

test_main 8 例过。交付说明的补充随后面"契约 1.4 修"的提交一起写（这个提交按要求只含三个文件）。
