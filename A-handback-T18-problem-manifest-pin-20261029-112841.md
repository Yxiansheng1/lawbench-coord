# A 线交回：T18 manifest 固定值同步

原因：上一轮漏同步有限验证器内嵌的 manifest SHA；严格 pin 因此在目标函数提取和执行前按预期失败。

仅修改 `docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348\verify-problem-records-finite.mts` 第 67 行：旧 manifest SHA `a0e8272d60fbb872c8099ca5b008fc28eb360b53c6d4558e1fc27bd4f4081da6` 改为 `a3e5567dfd0726e135253d1cde1cf679d0150e5f1cff8108854176f1095fa9ee`。

| 状态 | 字节 | SHA-256 |
|---|---:|---|
| 修改前 | 13933 | `638b8db2f43f3fc9c5e9359c6d88007cc7131c23401ea61b622608a924ab0983` |
| 修改后 | 13933 | `e5fc836e2c058a104e0b6404d21282edba1590f372079b827c610c07c5fde6f8` |

逆差：相对冻结输入仅上述一行不同；修改后旧值 0 次、新值 1 次。目标源码仍为 123264 字节 / `69e80a8e1fea9d04f8cbdde3e73a066a43d22de3e998958603dd9c46c3de70d1`，manifest 仍为 12239 字节 / `a3e5567dfd0726e135253d1cde1cf679d0150e5f1cff8108854176f1095fa9ee`，B 服务仍为 48428 字节 / `c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb`。

验证：`NOT_RUN`。本作者阶段 runtime 为 0；未运行 Node、Python、parser、AST、import、check、test、build、HTTP、model、GUI、SSH、环境/密钥读取或进程探测。请主编排在完整终端记录全部命令和逆差后，对同一测试器执行一次 39 条有限验证，不重试模型。

Git 保持只读，未 add、commit、rebase、stash、reset、clean、checkout 或 push；既有 dirty 均未清理。直接 `git status` 因受保护子模块 `dsh` 目录权限拒绝，改用 `--ignore-submodules=all` 完成了只读状态核对。修正说明：`docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348\manifest-pin-correction-20261029-112841.md`。
