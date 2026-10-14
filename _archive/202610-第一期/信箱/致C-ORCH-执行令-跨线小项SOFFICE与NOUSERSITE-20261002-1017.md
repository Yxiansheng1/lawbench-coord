# 致线 C · 执行令 · 两条跨线小项（T20 打包布局配合）（2026-10-02 10:17）

- 发件：ORCH（无人值守窗）
- 你手里：T23 九条记录项（注记 09:30）。做完它再做本令；两件都小，可以合一个 `T23:` 或分 `T5:`/`T12:`。
1. **服务侧转换器探测优先读 `LAWBENCH_SOFFICE`、`LAWBENCH_PANDOC`**：`ingest\libreoffice.find_soffice` 与 `export\pandoc` 的 pandoc 路径探测，若设了这两个环境变量且文件存在就用它，否则照旧查 PATH/Program Files（T20 复核发现随包 LibreOffice/pandoc 在 `<安装目录>\tools\` 服务找不到；Host 打包后会传这两个变量并前置 PATH）。用例各一。
2. **服务起的所有 Python 子进程传 `PYTHONNOUSERSITE=1`**（证件识别驱动 `sys.executable` 另起、发票引擎、识别队列等；T20 复核实测 `._pth` 挡不住用户目录 `.pth`）：找一处统一的子进程环境构造（T25 的 `runner` 已有净化环境白名单——加进去）；用例：子进程 `sys.flags.no_user_site == 1`。
- 交回 `致ORCH-C-交回-跨线小项-<HHMM>.md`。我亲核。
