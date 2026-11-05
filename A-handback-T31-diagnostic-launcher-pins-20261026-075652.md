# A 线交回：T31 诊断启动器精确入口 pin

## 结果

已按唯一执行令完成有界机械修改，未做运行时验证。本次只更新两份诊断启动器中的
四个既有入口 pin 字面量，并在证据 README 末尾追加一段诊断运行器入口身份说明。

## 精确差异

证据目录：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\`

- `prepare.ps1` 第 10 行：`109968` -> `110075`。
- `prepare.ps1` 第 11 行：
  `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`
  -> `664cb78ce373fad79ba1b80aca99e55ff51cd46a817072dcfd58a3f235097826`。
- `start.ps1` 第 135 行：`109968` -> `110075`。
- `start.ps1` 第 136 行：
  `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`
  -> `664cb78ce373fad79ba1b80aca99e55ff51cd46a817072dcfd58a3f235097826`。

四个字面量修改合计四处；没有修改引用该变量的其他行。两文件都没有增加或删除
字节。

| 文件 | 修改前 SHA-256 | 修改后 SHA-256 | 字节数 |
| --- | --- | --- | ---: |
| `prepare.ps1` | `44cf57da9ed1532415b84e0195fd22408c281cb452a0ebea0ad79dff2d924c70` | `edacbeb6999b43774e1f82a7d9460d116845b0474291d70486f03f3dbab1c0ae` | 15407 |
| `start.ps1` | `691aa3ed150cb7a72ba889f6362b7362a2a39b91e3a061b4ff66aa1e1169f367` | `7e97e4d826e26c0a8ecd3dd07422dc4ba75ce93b7cebb4f651df8d8b47ae391e` | 75433 |
| `README.md` | `fbcd2ea85132dda5dad5e53594d613db89b99982a057db7956daedd6d427114a` | `027cfb2ba85776a5ddd336825fd9ad86116a4f196900ac51e5d2d3f6aef30d1e` | 22150 |

`README.md` 修改前为 21812 字节；修改后历史前缀逐字节保持不变，仅追加 338 字节。
追加内容标明 source-only 1017/max、native 入口 `110075` 字节及上述新 SHA-256，
并明确不重新生成 source pins、不代表运行时或 T31 整体验收。

## 静态字节反向检查

修改前快照：
`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31DiagnosticLauncherPins-20261026-075652\before\`

三份目标文件的 `before` 快照在修改前均与 live 文件逐字节一致。修改后将新数字和
新哈希反向替换为旧值：

- `prepare.ps1`：旧数字/旧哈希残留均为 0，新数字/新哈希各 1；反向结果与
  `before` 逐字节相等。
- `start.ps1`：旧数字/旧哈希残留均为 0，新数字/新哈希各 1；反向结果与
  `before` 逐字节相等。
- `README.md`：`before` 全文仍是 live 文件的前缀，证明历史前缀未变。

因此上述授权修改之外没有字节变化。`start.ps1` 中既有 reviewed manifest
`52ebf5cf...`、client `5eb66c...` 及其他内容均保持原字节；`stop.ps1` 未触碰，
执行令冻结的 `064fb97e...` 不变；source pins、settings、row、daily、file URLs、
shim、credentials-disabled、T50 memory-only、24 outputs、600 秒限制与 exact
cleanup 均未重生成或改写。

## 未运行

未运行 parser（含 Python AST）、Vitest、tsc、test、build、prepare、start、
stop、serve、probe、HTTP、GUI、model、network、install 或 selftest。未执行
source pins 重生成、哈希扩展、新 loader/framework/routes、打包、安装器、合并、
push、deploy 或 Actions。

GUI 与运行时诊断留给主编排执行；本次只提供新的精确入口 pin，不声称 GUI、
runtime 或 T31 整体验收完成。

## Git 与阻碍

本次遵守只读 Git 边界：仅用 `--ignore-submodules=all` 查看 dirty 状态，保留
全部既有未提交改动；未执行 add、commit、rebase、stash、reset、clean、
checkout 或 push。交回方式为写本协调目录文件，没有提交 SHA。

未修改权限、ACL、锁、审批、全局 API 或凭据；未启动备用环境。本次无运行阻碍。
