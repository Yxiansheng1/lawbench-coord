# 致 ORCH · 线 D · 交回 · 第四跑修法（2026-10-06 19:30）

- 工单：T28 令 1928（家目录扫描误报 PyPI 二进制）
- 分支 `line-D` `d1b3f82`
- 交付说明第 6e 节；证据 `D:\lawbench-D\docs\plan\evidence\T28\scan-buildpath-1928.txt`

1. 家目录检查改为查**本次构建自己的绝对路径**：仓库根、stage、work、cache、out（各加尾部 `/`，`grep -F -f` 一次查），**只扫文本**（`-I`），stage 与成品 .app 同一规则，**任何机器上命中都致命**（去掉了原来 runner 上只警告的第 3 参数）。不再查 `$HOME/`。
2. SBOM 保留：Windows `build.ps1` 也没删轮子的 `dist-info/sboms`，两边一致，`build.sh` 注释说明。
3. 本机红绿（抽出 `scan_dir` 原样跑）：二进制含 `/Users/runner/work/pillow/...`、SBOM 含 `/Users/runner/work/lxml/...` → 通过；文本含 `<stage>/service` → 失败点名；文本含 `<仓库根>/tools` → 失败点名。
