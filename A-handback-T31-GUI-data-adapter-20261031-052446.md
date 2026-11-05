# A 线交回：T31 GUI 数据适配（20261031-052446）

## 交回对象

- 执行者：A 线独立执行者（deepseek-v4.1-flash）。
- 唯一任务令：`D:\Lawbeach\lawbench-coord\A-T31-GUI-data-adapter-order-20261031-052446.md`。
- 输入：`D:\Lawbeach\lawbench-coord\T31GuiDataAdapterInput-20261031-052446\approved.json`（Root 批准，全部源 pin、复制表、端口、归一化前缀 SHA 均取自该文件，未手写哈希）。
- 产出目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218`。
- 交回性质：本文件是写协调目录的交回件，不是 Git 提交。

## 做了什么

1. 逐字节复制 9 个文件：B 线的 `entry.py`、`scope-a.txt`、`scope-b.txt`、`scope-c.txt`，以及 canonical 的五个观察器（`observer-finite.mjs`、`signature-finite.mjs`、`projection-observer.mjs`、`settings-read-observer.mjs`、`private-provider-binding.mjs`）。复制后逐个比对字节与 SHA-256，与批准输入一致。
2. 克隆 canonical 的 `prepare.ps1` / `start.ps1` / `stop.ps1`，只做令批准的数据改写：证据根换成产出目录；`start.ps1` 的原生入口 88654 → 43762 字节、SHA-256 `aa42c2aa…` → B 线 entry 批准哈希；字面路由端口与 `T50_LLM_PORT` 65005 → 57667；归一化前缀 SHA `c4734c3a…` → 批准新值。`prepare.ps1` / `stop.ps1` 除证据根外与 canonical 逐字节互逆；run name、manifest 格式、600 秒上限、清理与断言、E50/legacy 18/私有 25 的 pin 全部未动；`forwardPort` 仍是 `Number(process.env.T50_LLM_PORT)`。
3. 新写 `literal-inputs.json`：`approved_core` 为批准输入原文；`baseline_blueprint` 保留旧 canonical 全量蓝图原文（旧证明不改写、不重算）；`new_data_rebind` 记录本次新绑定；`copied_files` / `substituted_scripts` 记录本次文件的字节与哈希；按令未写自引用 SHA 行，也未编造任何实际结果。
4. 新写 `README.md`：说明只做源码与数据适配、实际 scope 与最终检查归 ROOT。

## 产出文件清单（字节 / SHA-256）

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13561 | `49339421002094b2646f8b7417c196c03201fe3f4150b666340a65718945dc92` |
| `start.ps1` | 95730 | `e6000e158f9515aec9d49f3de7418bb5e7e0b06b6f098e863e3f8458825e8ac0` |
| `stop.ps1` | 7178 | `91b58a7afbb347561c65beec4d1f89739e90381c2dd5b0ee385bc954090f4330` |
| `entry.py` | 43762 | `34f9d264e8835b604f5e7696137de33e3b4ca7314126f1d8982ff3d92c79a9b5` |
| `literal-inputs.json` | 50570 | `c4ee799f4d529c8a50b7a53f6925d1f6341c9c4c5045601fdb7899fc4e029ada` |
| `README.md` | 2625 | `0077ebe619495217bba2b8be14353f35ef98ce00a7212a81e891eb4229e60534` |
| `scope-a.txt` | 37 | `0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8` |
| `scope-b.txt` | 37 | `3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91` |
| `scope-c.txt` | 39 | `5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439` |
| `observer-finite.mjs` | 6845 | `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb` |
| `signature-finite.mjs` | 5381 | `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed` |
| `projection-observer.mjs` | 20058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `settings-read-observer.mjs` | 11513 | `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107` |
| `private-provider-binding.mjs` | 2499 | `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e` |

## 边界与未做事项

- 本轮没有 GUI、HTTP、模型、Key、6000D、395、子代理调用；没有跑测试、构建、prepare、start，也没有解析或执行任何交付脚本。
- Git 写入 0 次：未 add、commit、rebase、stash、reset、clean、checkout、push。Git 只读检查也没有做（令禁止 Git 与探针类调用）。
- 按令的 ONLY NEW 文件清单是排他的，因此没有在 `docs\plan\evidence\T31\` 下另建 `交付说明.md`；本交回件承担交回说明。工单集文件未改。
- 未触碰产品源码、SDK、current-25、观察器、legacy 18、默认库、runtime 私有目录；除产出目录与本交回件外没有写任何位置。
- 全量数据只在 inverse（表达式↔字面量互逆）处按批准改动，其余为逐字节复制。

## 交回给 ROOT 的待办

- 复核本目录源码与 pins，然后自行执行一次实际 GUI、实际 scope、停止与 OS 收尾。
- 端口 57667 需 ROOT 自己在运行前占位；两个实际端口必须在 Root 侧确认归属后才能发请求，不得出现指向未归属的 65005 的请求。
- 全量套件仍 HOLD，等待 Root 侧的 sync-release。

## 实际执行计数

作者本轮 exec 批次 6 次（含最终计数更正批次），非零退出 0 次。