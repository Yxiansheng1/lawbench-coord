# T31 GUI 小切片：prepared guard 修正包（source-only）

状态：`SOURCE_ONLY_NOT_RUN`。本目录只交付源码与字面输入。实际 prepare、GUI、scope、停止、手工核对与 OS 收尾仍归 ROOT；这里没有任何实跑通过结论。

## 本次交付

- 14 个文件从批准基线逐字节复制到全新目录；旧 T31 证据树不改写、不复用。
- `prepare.ps1` / `start.ps1` / `stop.ps1` 仅把旧证据根改成 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopePreparedGuard-20261031-054059`，包含反斜杠、正斜杠和 file URL 形式。
- `entry.py` 只把计划根目录名 `GuiScopeSubmission-20261031-050218` 换成 `GuiScopePreparedGuard-20261031-054059`；新入口应为 43765 字节，SHA-256 为 `f3c9ef443dce7c3ca320b3a317ac5ebcc5c44c7177a65aa9d2c5607749e80dcb`。
- `start.ps1` 的 `Assert-T30PreparedInputs` 在根目录清点前增加 `scope-source` 精确准入：目录普通且非重解析点；仅允许 `scope-a.txt`、`scope-b.txt`、`scope-c.txt` 三个普通文件；名称、字节数和 SHA-256 均按批准字面量校验；拒绝额外项、缺失项、子目录和内容变化。
- 新根目录清点为原四项加 `scope-source`；原根清单失败语句与 never-served 产物守卫保留。
- `literal-inputs.json` 以 `approved_core` 保留批准输入原文，以 `baseline_blueprint` 保留旧全量元数据，并记录本次 rebinding 与 guard；不含自引用哈希。

## 明确未做

E50 证据根、项目与运行参数、canonical ORIGINAL SDK 根、resolver、network guard、资源清单、PDF 处理、`currentGeneralReadOrder` 的 25 个私有文件、18 个 legacy 冻结项、run name、manifest 格式、600 秒上限、清理、源用例五项 pin、端口 57667 与归一化前缀哈希均未改。

本轮未运行 prepare、start、stop、测试、构建或任何 GUI/HTTP/模型/Key/6000D/395 调用，未执行手工核对或清理，也未写 Git。原生 scope、模型传输、整项 T31 均不能宣称通过；实际验证与最终判读由 ROOT 执行。