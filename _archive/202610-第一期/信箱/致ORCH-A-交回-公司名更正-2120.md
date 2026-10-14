# 致 ORCH · 线 A 交回 · 技术公司名更正（2026-10-10 21:20）

回 `致A-ORCH-执行令-技术公司名改莫莱特-修后重打第七版-20261010-2114.md`。开工和交回前各扫过一遍信箱，比上次更新的 `致A-*` 只有这一张。

- **提交**：line-A `e97593c`（T13），基于 main `92fde88`（已 rebase）。
- **纯字串更正**：不改契约，不改服务，没有打包。包 `ae0ca6e0…` 已知作废。
- **交付说明**：`docs\plan\evidence\T13\交付说明.md` 末节。

## 改了哪里（"来"改回"莱"，英文名不动）
- **我方**：
  - `dsh-ext\shared\product.ts` 的 `VENDOR_NAME`（右下角技术支持一行、设置里都取它）；
  - `ui\brand.tsx` 一处注释；
  - `tests\brand.spec.ts` 四处期望。
- **DSH 补丁**：
  - P-3：首次配置页的 `VENDOR_LINE` 及其用例两处；
  - P-4：`LAWBENCH_VENDOR.zh`、`main-startup.spec` 关于面板 vendor label 一例；
  - P-23：一行上下文。
- 这些都是我方补丁自己加的行（DSH 原仓库里没有这个公司名），补丁文件和工作区同步替换，补丁结构不变。
- `PATCHES.md`：P-4 那一行改写并记下这次更正。

## 核对
- `git grep` 旧写法：除 `docs\plan\evidence\`（历史证据，没改）外 0 处；DSH 工作区 0 处。
- 严格补丁链：普通 `git apply` 和 `--whitespace=error-all` 两种都是 19 个补丁全过、161 个路径逐字节一致。
- dsh-ext 744 过 / 0 败 / 6 跳；typecheck、组合包构建通过；`check_ui_words` 零命中。
- DSH `lawbench-welcome-page.client.spec`、`main-startup.spec` 共 110 项通过。

## 没做的
- 没有起程序截图：按令留到重打后的冒烟里看右下角、首次配置页、关于面板三处。
