# A 线交回：T31 长路径启动器入口 pin

## 结论

状态：`STATIC_CHANGE_VERIFIED`；运行时状态：`NOT_RUN`。

已按执行令仅更新 A 线 `prepare.ps1` 与 `start.ps1` 的原生入口 pin，并向同目录 `README.md`
末尾追加简短记录。`stop.ps1` 逐字节未变。未执行启动器、GUI、HTTP、探针或其他运行时验证；
T31 整体仍未验收。

## 基线与 dirty 保全

- 工作树：`D:\Lawbeach\lawbench-A`
- 分支：`line-A`
- 只读基线 HEAD：`a23271a`
- 四个目标文件修改前后均为 Git 未跟踪状态 `??`；未暂存、未提交、未 rebase、未创建 stash，
  也未做任何其他 Git 写操作。
- 修改前快照：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31LongPathLauncherPins-20261026-112452\before`
- 修改前四文件与快照逐字节一致。
- tracked-before 补丁：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31LongPathLauncherPins-20261026-112452\A-tracked-before.patch`
- tracked-before 补丁 SHA-256：
  `48bf28c283df6d88e2108850944427336c62780f4114e583d59827dee4a51c58`

## 修改内容

`docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1`

- 第 10 行：`$NativeEntryBytes = 113384`
- 第 11 行：
  `$NativeEntrySha256 = '10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4'`
- 最终大小：`15407` 字节
- 最终 SHA-256：
  `af3d28d3844173c9841ea8668412d1c126ff36ee11837ef1b871065c5deaf450`

`docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1`

- 第 135 行：`$NativeEntryBytes = 113384`
- 第 136 行：
  `$NativeEntrySha256 = '10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4'`
- 最终大小：`75433` 字节
- 最终 SHA-256：
  `bbbe9eb62191a62eafd7bd0c5c0c1c29503fbf395291e512960d47368d8f5c72`

两份脚本均只发生执行令要求的四处字面值替换：每份各一次
`112475 -> 113384`、各一次
`c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e ->`
`10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4`。
文件字节数、UTF-8 无 BOM 状态、LF 行尾及其余字节均保持不变。

`docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

- 仅在末尾追加 `552` 字节的上述 pin 记录。
- 追加前 `22503` 字节；追加后 `23055` 字节。
- 追加前原始前缀逐字节一致；历史 `112475` 记录仍保留一次。
- 最终 SHA-256：
  `4dff0b64f9882150b2133fd48d0f9865e35d51e29b772de20ab81715ab2346ac`

`docs\plan\evidence\T31\BatchGui-20261026-055030\stop.ps1`

- 修改前后逐字节一致。
- 大小：`7127` 字节
- SHA-256：
  `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67`

## 入口身份核验

只读核对目标入口：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`

- 大小：`113384` 字节
- SHA-256：
  `10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4`

该结果与执行令给出的新入口身份一致。

## 已做静态验证

- 以旧文件重建仅替换四处 pin 的期望字节，结果与两份修改后脚本逐字节一致。
- 新大小与新 SHA 在两份脚本中各出现一次；两处旧值均不再出现。
- `stop.ps1` 与 before 快照逐字节一致。
- README 仅存在尾部追加，原始前缀逐字节一致。
- 只读核对 `line-A`、HEAD `a23271a` 及四个目标文件的 `??` 状态。

## 未执行与遗留

- 运行时状态为 `NOT_RUN`：未执行 parser、AST、Python、tests、selfcheck、prepare、start、
  stop、probe、build、GUI、HTTP、model、network 或 install。
- 因而本次交回不构成启动器运行验收、GUI 验收或 T31 整体验收。
- 按要求，根侧需先完成整字节及三路 parser 反证，再进行新的 GUI 验证。
- 打包仍为 `HOLD`。
- 依据本执行令，交回方式是本文件；没有 Git 提交，且无需修复 `index.lock`、权限或锁问题。
