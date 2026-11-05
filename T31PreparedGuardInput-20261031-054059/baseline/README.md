# T31 GUI 小切片：数据适配提交包（source-only）

状态：`SOURCE_ONLY_NOT_RUN`。本目录只交付源码与字面输入。实际 GUI、实际 scope、停止与 OS 收尾都由 ROOT 执行；这里没有任何实跑结论。

## 目录里有什么

- `prepare.ps1` / `start.ps1` / `stop.ps1`：从 canonical T34 克隆，只做批准的数据改写。
- `entry.py`：从 B 线 `GuiScopeTaskStoreBinding-20261031-051914` 逐字节复制（43762 字节，SHA-256 `34f9d264e8835b604f5e7696137de33e3b4ca7314126f1d8982ff3d92c79a9b5`），未改写。
- `scope-a.txt` / `scope-b.txt` / `scope-c.txt`：从同一 B 目录逐字节复制，三个纯软件标记，无用户图片、无法律数据。
- 五个观察器（`observer-finite.mjs`、`signature-finite.mjs`、`projection-observer.mjs`、`settings-read-observer.mjs`、`private-provider-binding.mjs`）：从 canonical 逐字节复制，未改。
- `literal-inputs.json`：新的字面输入记录。`approved_core` 是 Root 批准输入的原文；`baseline_blueprint` 保留旧 canonical 全量蓝图原文，旧证明不改写；`new_data_rebind` 记录本次新绑定；`copied_files` 与 `substituted_scripts` 记录本次文件的字节与哈希。按令，本文件不含自引用 SHA 行。

## 相对 canonical 的唯一改动

1. 三个脚本的证据根换成 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218`。
2. `start.ps1` 的原生入口从 88654 字节 / `aa42c2aa…` 换成 43762 字节 / B 线 entry 的批准哈希。
3. 字面路由端口与 `T50_LLM_PORT` 从 65005 换成 57667；归一化前缀 SHA 换成批准值。`forwardPort` 仍是 `Number(process.env.T50_LLM_PORT)`。

## 保持不变

E50 证据根、项目与运行参数、canonical ORIGINAL SDK 根、resolver、network guard、资源清单、PDF 处理、`currentGeneralReadOrder` 的 25 个私有文件、18 个 legacy 冻结项、run name、manifest 格式、600 秒上限、清理与断言、五个源用例的输入 pin，全部原样保留。

## 运行边界

模型侧是原有 Net 在触达上游之前就拒绝传输，不触模型、不触 Key、不连 6000D 与 395。API 侧 lifespan 关、Retainer 关、OCR 关。原生 SDK GUI 用当前正常项目的 private25 GeneralReadOrder 构建，不是临时 provider。

## 实际执行记录

作者本轮 exec 批次 6 次（含最终计数更正批次），非零退出 0 次。Git 写入 0 次：未 add、commit、rebase、stash、reset、clean、checkout、push。GUI、HTTP、模型、Key、6000D、395、子代理调用均为 0。

实际 scope 与最终检查归 ROOT。