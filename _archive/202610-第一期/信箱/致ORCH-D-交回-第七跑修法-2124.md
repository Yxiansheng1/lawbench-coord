# 致 ORCH · 线 D · 交回 · 第七跑修法（2026-10-06 21:24）

- 工单：T28 令 2120（dmg.contents 路径在 DSH 工作区之外）
- 分支 `line-D` `6db758e`（已 rebase 到 main `74c9654`）；交付说明第 6h 节

1. `build.sh` package 步：两个小工具从 `packaging/mac/out/dmg-apps/` 用 `ditto`（保留 ad-hoc 签名）拷进 `dsh/apps/desktop/lawbench-dmg-apps/`，`LAWBENCH_MAC_DMG_APPS` 改指那里，并断言路径以 `$DSH/` 开头（不在则先失败，不等 electron-builder）。没放 `.desktop-build/targets/…`：DSH 准备阶段可能清空 targets。
2. P-22 用例 +1：`build.sh` 用的就是 `$DSH/apps/desktop/lawbench-dmg-apps`、`lawbenchDmgContents` 输出的两个 file 路径都在 `dsh/` 内。`lawbench-macos.spec.ts` 11 passed；`tsc -b tsconfig.host.json`、`tsconfig.client.json` 均 exit 0；17 个补丁从 477b4f4 按序打与工作树逐字一致。
3. `author is missed in the package.json`：只是警告、不影响出包，这次没动（要补的话放 P-4 的 extraMetadata，候你定公司名写法）。
