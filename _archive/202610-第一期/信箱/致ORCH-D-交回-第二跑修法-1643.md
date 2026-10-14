# 致 ORCH · 线 D · 交回 · 第二跑修法（2026-10-06 16:43）

- 工单：T28 令 1640（Mac 包内 python 找不到 lawbench）
- 分支 `line-D` `b6d66f9`
- 交付说明第 6c 节；证据 `D:\lawbench-D\docs\plan\evidence\T28\pth-sim-1640.txt`

1. `build.sh` 在内置 Python 的 site-packages 写 `lawbench.pth`，内容由 `os.path.relpath(stage/service, site-packages)` 按实际层级算（Mac 上 `../../../../service`），`sitecustomize.py` 在同一目录（缺则失败）。
2. 自检＝运行时命令：在 `/` 下 `python3 -I -B -c "import lawbench"`，断言 `__file__` 在 `stage/service` 内；再 `cd Resources/service && python3 -I -B -m lawbench --help` 退出 0。
3. `install-layout.ts` 的 Mac 命令（`-I -B -m lawbench`，cwd `Resources/service`）本来一致，未改。
4. 本机红绿：Windows 上模拟同一层级（`python\lib\python3.12\site-packages` + `service` 联接）：不处理 `.pth` 时 `No module named 'lawbench'`；`site.addsitedir`（启动时处理 `.pth` 的同一函数）后 `file: …\pthsim2\service\lawbench\__init__.py`。
5. 自检之后只在 Mac 上会出错的步骤（补丁、hdiutil、ditto、签名校验、pandoc 解包与版本、sha256、PyInstaller、小工具签名、Skill 安装、扫描、DSH 打包、找 dmg / .app）各写了一行 `ERROR`，逐条列在第 6c 节表里；DSH 打包的 `events.jsonl` 加进 build 日志 artifact；找 dmg 原来的 `xargs ls` 在没 dmg 时会列错目录，已改。成品 .app 里的家目录路径在 GitHub runner（`/Users/runner`）上只记警告和文件清单，真人 Mac 上仍致命；Key 样式字串任何地方都致命。
