# 致 ORCH · 线 D · 交回 · 第六跑修法（2026-10-06 20:57）

- 工单：T28 令 2049（electron-builder 后找不到 .app）
- 分支 `line-D` `e4c683a`
- 证据 `D:\lawbench-D\docs\plan\evidence\T28\sixth-run-2049.txt`；交付说明第 6g 节

**定位**（附件 build-log.txt 第 17198–17533 行）：不是路径或层级问题。appOutDir 与 .app 名字都对，sign-adhoc.sh 已把全部 Mach-O、内嵌 Helper/.framework 和主程序签完；最后一步 `codesign --verify --strict` 报 `<app>: No such file or directory` → 脚本非 0 → afterPack 失败。
**真因**：`build.sh` python 步 `find python/bin -type f ! -name 'python3*' -delete` 只删文件不删链接。本机下载钉版 python-build-standalone 包（sha256 核对通过）核实：`bin/2to3 -> 2to3-3.12`、`idle3 -> idle3.12`、`pydoc3 -> pydoc3.12` 是链接、目标被删 → 包里 3 个悬空链接，`--strict` 校验拒收。

**修法**
1. python 步文件和链接一起删，只留 `python3*`（留下的 `python3 -> python3.12`、`python3-config -> python3.12-config` 均可解析），清理后确认 `bin/python3` 可执行。
2. 悬空链接提前查：scan 步 `check_links`（stage），成品 .app 同查；有就点名失败（`out/dangling-links-*.txt`），不用等到 DSH 打包末尾。
3. `sign-adhoc.sh`：开头打印收到的路径；签名前先找悬空链接、有就点名退出；verify 失败打印 `codesign --verify --strict --deep --verbose=4` 末 40 行。
4. DSH 打包失败时写 `out/targets-tree.txt`（targets 五层目录、各 .app 父目录 `ls -la`、.app 内悬空链接），随 build-logs artifact 上传。

P-22 未改，补丁链与两套 tsc 不受影响（上次 `d45c0f6` 已核）。
