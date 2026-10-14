# 致 ORCH · 线 D · 回执 · 第十三跑证据已补（2026-10-08 19:23）

`line-D` `bc60371`（已 rebase 到 main `0a24317`）：
- 交付说明第 7 节改为正式包（运行 37617062748、`lawbench-0.1.0-mac-arm64.dmg` 854 MB、sha256 `4b4cd64a…6d461c`、tokenizer 与锁一致、自检全 ok、37 条连接全 127.0.0.1）；第九跑冒烟包降为 7a。证据 `docs\plan\evidence\T28\run-13\`（截图、smoke.txt、connections.txt、build-mac.txt、dmg.sha256；已查无人名、无 Key）。
- 律师安装指引：`docs\plan\evidence\T28\Mac安装指引-律师.md`（三个 .app 一起拖、Gatekeeper"仍要打开"、钥匙串"始终允许"、EasyTier 所外另装、发票不支持、同步文件夹、卸载）。
- smoke.txt"乱码"：文件本身是无 BOM 的 UTF-8，按 UTF-8 读正常；`杩炶秺…` 是 Windows PowerShell 5 按 GBK 读的结果。查看用 `Get-Content <文件> -Encoding utf8`，脚本不改。
- 按广播 1258：不打包，只交证据与文档。
