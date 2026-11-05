# C 线交回：OCR 最终停止保护

状态：`AMENDED_NOT_RUN`

执行令：

`D:\Lawbeach\lawbench-coord\C-OCR-final-stop-guard-order-20261028-005632.md`

## 交付路径

- 唯一修改文件：
  `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\run-isolated-ocr.ps1`
  - 修改前：36,518 字节 / `da3f0aedeacff49b69050b1414c05362d8824789eb85ee3e56123846b6470bcd`
  - 修改后：37,041 字节 / `eb92b2877ed181946d3dac74a3c10994474d0071dca594ccd7db4d3d0cada8e8`
- 新增正式说明：
  `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\root-final-stop-guard-20261028-005632.md`
- 本交回件：
  `D:\Lawbeach\lawbench-coord\C-handback-OCR-final-stop-guard-20261028-005632.md`

## 已完成的有界源码修正

1. 最终 Kill 使用独立 `$finalOwnedIdentityVerified`，每次最终尝试前先复位为 false，
   仅在原有 PID、冻结路径、UTC birth 三项核对全部成功后置 true。启动阶段的核对结果
   另存为 `startup_owned_identity_verified`；全脚本仍只有一个 Kill 调用。
2. `manifest.json` 的读取显式增加 `-Encoding UTF8`。实际 prepared manifest 为 2,325
   字节 / `a6716fb57b91060717cccc5ba952aa2ff551df3898b1094e1880f82ca7de4ebe`，
   无 BOM，严格 UTF-8 解码成功并含中文夹具名。
3. started 实例的 `own_listener_closed` 为 false 或未被观测时，成功路径改 exit 21
   `OWNED_LISTENER_CLOSE_UNCONFIRMED`；HTTP cleanup 和后续 cleanup 的失败统一写入
   既有 `$status`，写证据前同步到 `$result.status`。没有按端口停止 listener。

冻结的 `prepare_isolated_inputs.py` 仍为 11,915 字节 /
`34432c4ebfa8585a993ebc90287e2e5b555854be5e372bd37bc36cf317cc0ae0`；
`README.md` 与 `root-fixture-amend-20261028-003338.md` 也未修改。root 已有的 render
132,843 字节 / `6c839956...c40a`、request 177,698 字节 / `0b041029...f0d5` 和
prepare 自然退出证据按原样复用，没有重跑。

## 验证与阻碍

作者只执行了 22 次静态读取/哈希/只读 Git 命令：17 次 exit 0，5 次非零。非零项为：
整体 `git status` 因 `dsh` 子模块目录权限拒绝；两次 PowerShell 静态读取脚本的写法错误
（均已用正确只读命令取得所需结果）；`git check-ignore` exit 1（不是忽略项）；
`git show HEAD:<target>` exit 128（目标文件在磁盘上但不在 HEAD）。

目标脚本未出现在 `git ls-files --stage`，普通 Git diff 无基线可显示。没有修复权限、
子模块或锁，也没有执行 add/commit/rebase/stash/reset/clean/checkout/push，故无提交 SHA。

按令，作者没有运行候选 PowerShell、Python、parser/import/compile、Node、测试、HTTP、
SSH、SCP、GPU、模型、Key、自检或安装，也没有产生新的 CPU/GPU/网络证据。

## root 下一步

请 root 独立审阅累积 delta、全部 source/setup/finally 和纯回调矩阵，并以实际的
Windows PowerShell 5.1、实际 UTF-8/no-BOM prepared manifest 做 0 socket、0 GPU
预检。通过前不得启动模型实例。

HANDBACK STOP
