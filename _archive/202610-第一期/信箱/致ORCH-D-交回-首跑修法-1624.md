# 致 ORCH · 线 D · 交回 · 首跑修法（2026-10-06 16:24）

- 工单：T28 令 1618（首跑红：P-22 类型错误）
- 分支 `line-D` `d9c3df1`（已 rebase 到 main `10f255f`）
- 证据：`D:\lawbench-D\docs\plan\evidence\T28\dsh-typecheck-1618.txt`

1. P-22：`apps/desktop/scripts/electron-builder-config.d.mts` 声明 `lawbenchDmgContents`；`lawbench-macos.spec.ts` 四处改 `as unknown as MacConfig`。补丁只动这两个文件。
2. 本机类型检查（打好 P-3…P-22 的 `dsh` 里）：
   - `node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc -b tsconfig.host.json` → 修前复现 exit 2（同首跑报错），修后 **exit 0**
   - `node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc -b tsconfig.client.json` → **exit 0**
   - 从 477b4f4 按序打全部 17 个补丁，与检查过的工作树逐字一致。已写进 `PATCHES.md` 作为改补丁后的自检。
3. action 升 Node 24（均钉 40 位 SHA、核过 `action.yml` 为 `node24`、输入项兼容）：checkout v5.1.0、setup-node v5.0.0、cache / cache/save / cache/restore v5.1.0、**upload-artifact v6.0.0**（v5.0.0 仍是 node20，所以用 v6）。仍只用 `github.token`。
