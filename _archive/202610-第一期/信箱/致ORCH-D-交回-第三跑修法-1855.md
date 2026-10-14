# 致 ORCH · 线 D · 交回 · 第三跑修法（2026-10-06 18:55）

- 工单：T28 令 1850（scan 误报 + customSkillDirs 绝对路径）
- 分支 `line-D` `5c01e02`
- 交付说明第 6d 节；证据 `D:\lawbench-D\docs\plan\evidence\T28\skills-hint-1850.txt`

1. 扫描：全量 Key 模式（含 PEM 头）只扫文本（`grep -I`）；二进制只查强标记（`.env.local` 变量名、≥32 位 `sk-`），不查 PEM 头；另按文件名查 `.env*`、`*.p12`。本机抽出 `scan_dir` 原样跑：二进制含 PEM → 过；文本含 PEM / 二进制含 `LAWFIRM_TEST_KEY_B=` / 有 `.env.local` → 均失败并点名文件。
   **顺带发现并修了一个真问题**：`--exclude-dir=LibreOffice.app` 原先写在模式与目录之后，macOS 的 BSD grep 不重排参数，会把它当文件名，LibreOffice.app 实际没被排除（家目录路径那条也一样）。三处都挪到模式前。
   Windows：`build.ps1` 没有 Key 扫描，不存在同样误报。
2. customSkillDirs：`install.py:118` 那行只是**打印**给开发者的提示，不写任何文件；本机跑 `install.py --out <临时目录>`，输出 27 个文件里无绝对路径；stage 里没有 cordis.patch.yml。装好的 Mac 包按 `dsh-ext\cordis.patch.yml` 表达式运行时推导 `<App>.app/Contents/Resources/skills`（有用例）。所以只改日志：Mac 构建日志去掉这一行，改写实际来源。Windows 构建日志同样会打印一行 Windows 绝对路径，也只是提示、不进包。
