# A线正式交回：T31 guard brace source-only repair

- 状态：SOURCE ONLY / NOT RUN；不得据此宣称测试通过。
- 源码：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopePreparedGuard-20261031-054059\start.ps1`
- 已做修改：仅用精确字面替换，删除紧跟在 `# T31 scope-source exact admission guard END` 之后、`foreach` 之前的一行 `  }`；未删除其他花括号，保留 LF。
- 实际源码元数据：约 97497 字节，SHA-256 为 `96570529294bed6027f2e4965528c152bf40ebd723a0723d9d090de2d51558c6`。最终执行阶段记录的实际值为：- 最终元数据：97497 字节；SHA-256 $sourceHash96570529294bed6027f2e4965528c152bf40ebd723a0723d9d090de2d51558c6。。
- 原失败输入与既有证据保留在 `D:\Lawbeach\lawbench-coord\T31GuardBraceInput-20261031-054418\before`；未重演或改写原失败运行。
- 原有 README / 正式文件未改写，保留并须按既有限定口径理解：它们不能证明本次修正后的源码已运行通过。
- 验证：NOT RUN。按令未运行检查、断言、Contains/IndexOf、parser、ConvertFromJson、Node/Python AST、测试、build、prepare、app、GUI、HTTP、model、Git、Key、SSH；未联系其他聊天或派子代理。
- Git：严格只读且本阶段未执行任何 Git 命令；本文件是协调目录正式交回，不是 Git 提交。
- 结论：请 Root 复核并独立裁定；本次仅完成有界源码修复，不主张 guard 逻辑以外的改动或行为验证。

- 最终元数据：97497 字节；SHA-256 $sourceHash96570529294bed6027f2e4965528c152bf40ebd723a0723d9d090de2d51558c6。