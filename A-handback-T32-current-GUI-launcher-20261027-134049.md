# A 交回：T32 current-runtime GUI launcher fixed-data alignment

状态：`AUTHORED_NOT_RUN`。本交回只表示三个 launcher 脚本和正式记录已写出，不表示新 GUI、测试、构建、打包或 Gate 1 通过。

## 工单与范围

- 唯一执行令：`D:\Lawbeach\lawbench-coord\T32-current-GUI-launcher-order-20261027-134049.md`
- 只从旧 B 复核目录复制 `prepare.ps1`、`start.ps1`、`stop.ps1`，并只按固定蓝图改 literal 固定数据。
- 新 native 入口绑定 `RefRemoveOptinEntry-20261027-131809\server.py`：141080 字节，SHA-256 `cce387f4b5492a0be2b10ef1e99c2687872a60a826f8bdfaab5ed62ffc8fad79`。
- 新 private build 绑定 `private-output-20261027-132936`：manifest 58186 字节，SHA-256 `b20e67a73b329c1249d2ad647c847594d834e3aab855db6b462fdef2a57583a0`。

## 交付物

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\prepare.ps1` | 17122 | `1e738722b9eb0ba8b048c6b2faeb98221cfa6f4a2dfa8b239235e68bbb2f8979` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\start.ps1` | 75682 | `3bbe6a5ba33e69c0ced1e6abf3faef53d2a0199952d56e503f75c13368bd3de3` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\stop.ps1` | 7128 | `3818bb48bba7e8f1d0735e6394f01340972007a01d4c6d4197530a84abb9fc44` |

完整固定值、允许差异、只读核验、命令与非零记录、写入面见：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\README.md`

## 核验结论

- `prepare.ps1` 仅改 `NativeEntry`、入口 bytes/SHA、`RunsRoot`、`SourcePinsSha256`。
- `start.ps1` 仅改入口/private build 固定值及 3 行 private output pin、2 行 native shim pin；24 行 pin 总数和 347 source count 未变。
- `stop.ps1` 与旧文件字节完全一致。
- 新 native、manifest 和 24 个 private output 的 bytes/SHA 与固定蓝图及磁盘一致；`runs` 尚不存在。
- 作者未运行 Python、Node、parser、测试、build、prepare、start、serve、probe、HTTP、GUI、模型或安装。

## 阻碍与边界

- 首次 `git status` 在只读子模块 `dsh` 被权限拒绝，后续使用 `--ignore-submodules=all` 完成只读状态核对；未改锁、ACL、审批或沙箱。
- Git 严格只读。交回不是提交；未执行 add/commit/rebase/stash/reset/clean/checkout/push。只读 HEAD：`line-A` / `a23271abee333a9a256fd46a3141da16975c2380`。
- root 须先独立完成 native、固定源清单、脚本和差异的完整反向/源码 parser 审阅，再在全新 root 做 fresh prepare 和 GUI；实际 GUI 删除须在实际动作时由人确认。
- 打包仍 `HOLD`，Gate 1 未完成；本次不宣称 GUI 绿。
