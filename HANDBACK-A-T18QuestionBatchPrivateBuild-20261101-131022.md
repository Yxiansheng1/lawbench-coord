# T18 QuestionBatch Private Build 交回

状态：`AUTHORED_NOT_RUN`

运行时调用：`0`

## 产物

| 文件 | SHA-256 | 大小 |
|---|---|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\T18QuestionBatchPrivateBuild-20261101-131022\build-private.mjs` | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 与源文件逐字节一致；最终双目标 SHA-size 检查通过 |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\T18QuestionBatchPrivateBuild-20261101-131022\build-config.mjs` | `b5e51c4dc5492a42e12bd02be7f898d1bd230210be38d0fab902e3792ac4338c` | `20801` 字节 |

## 数据绑定

- `build-private.mjs` 从绑定指定的旧 builder 逐字节复制，未改写。
- `build-config.mjs` 从绑定指定的旧 config 逐字节复制后，仅执行绑定列出的四个 ASCII 字面量替换；每个字面量在替换前均确认恰好命中一次。
- 四个替换后的目标 SHA-256 与绑定给出的 expected SHA-256 一致；config 字节数与 `expected_config_bytes` 一致。

## 边界与现状

- 未执行 builder、config、模块、import、parser、test、Node、Python、build、GUI、HTTP、model 或 credentials 操作。
- 未执行 Git 操作；未暂存、提交、rebase、stash、reset、clean、checkout、push 或修改锁。
- 既有 dirty 状态未清理、未覆盖。除上述目标目录及两个目标文件外，未写入其他文件。
- 绑定所述其他 18 棵树、41 个文件和 14 个引用保持原状，既有 Agent source diagnostics 未改动。
- Root/full-inverse/setup-cleanup 复核：目标在写入前均不存在；源只用于绑定指定的数据复制；写入范围限于两个已声明目标；无 setup 或 cleanup 动作。
- 阻碍：无。

本交回件仅记录 authored 数据产物，不宣称运行、构建或测试成功。
