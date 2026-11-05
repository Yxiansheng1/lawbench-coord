# A 线交回：T30 GUI 端口字面值修正

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 完成一个入口表达式和两个启动身份字面量的有界修改，并写入证据与交回件。 |
| 目标是什么 | 入口按环境变量原值精确比较固定端口；根侧随后新建 prepare、admit 和 GUI 运行。 |
| 在等什么 | 等根侧对累计差异的全量审计及新运行结果；收到后由根侧判定，A 线不再动作。 |
| 卡在哪 | 当前未卡。作者验证按令止于静态检查，真实 GUI 不在本作者范围。 |

执行令：
`D:\Lawbeach\lawbench-coord\A-T30-GUI-port-literal-order-20261028-104724.md`

正式证据：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-port-literal-20261028-104724.md`

## 修改结果

`entry.py` 只把
`_norm(os.environ.get("LB_FORWARD_PORT", ""))` 改为
`os.environ.get("LB_FORWARD_PORT", "")`。固定比较值仍为 `"65005"`，拒绝分支、
其他函数、断言和清理未改。

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 48,547 | `709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87` |
| `start.ps1` | 74,131 | `8aa948afe87e7a8d29ad6d394acd06d737d53b701000ef181316b04f4a359b8f` |

`start.ps1` 只改 `$NativeEntryBytes` 与 `$NativeEntrySha256`，最终 pin 为
`48547 / 709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87`，
与实际 `entry.py` 一致。两份文件均为 UTF-8 无 BOM、纯 LF。

## 依据与验证

- `103405` 未复用：没有 `started.json`、`ready.json`、`final-metadata.json`；
  保留 `run-error.json`、`launch-error.json`、`loop-closed.json`。
- `run-error.json` 固定为 `LB_FORWARD_PORT_not_fixed` /
  `FAILED_FOR_ROOT_REVIEW` / `rootRetained=true`。
- 源案件 5 文件身份未变；失败运行仍为目标父日志、子日志和 `case.db`。父日志
  12,059 bytes / `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee`；
  子日志 16,235 bytes / `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461`；
  `case.db` 65,536 bytes / `47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6`。
- `prepare.ps1`、`stop.ps1`、`README.md`、交付说明和两份旧证据记录身份未变。
  历史计数串 `47/37mainfinalobserver and40/36earlierfix170/149main` 原样保留。
- `A-dirty-before.txt` 与修改后 dirty 清单均为 197 行，差异 0。
- 合计 43 次原生命令行调用、7 次非零；非零均在正式证据记录逐条列明。两次误配
  Bash 在 managed runner 执行前拒绝，没有命令执行或写面。

## 未做与降级

作者运行时为 0。没有执行 Python、Node、parser、AST、测试、prepare、admit、
serve、probe、HTTP、模型、Key、SSH、GUI、build、selftest 或删除。因此不宣称
语法、准入、服务、GUI、USB 或整 T30 通过。

Git 严格只读，没有 add、commit、rebase、stash、reset、clean、checkout、push、
暂存、锁修复或扩权。根级普通 `git status` 仍因共享 `dsh` submodule 权限拒绝而
不完整；忽略 submodule 的清单已与 dirty 前件精确比对。该环境阻碍不需要修复。

`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。

## 下一步建议

根侧完成累计差异、原始文件、finally 与 pins 审计后，使用新身份执行全新的
prepare、admit 和不超过 600 秒的 GUI。`103405` 不得复用。A 线到此停止，不进行
Git 提交。

Response ID: `A-T30-GUI-port-literal-20261028-104724`

Response log path: `D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-port-literal-20261028-104724.md`
