# A 线 T18 状态引脚交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已按执行令绑定复核版 Skill 的真实 15,420 bytes / `ef60fbbd…dfffe`；三份目标文件的字面修改已落盘并通过整字节正反校验。 |
| 目标是什么 | 状态清单、消费者常量和 README 指向同一复核版 Skill。T18 业务仍为 `BUSINESS_HOLD`；让 root 复用既有可执行代码证明后，再做一次原业务新鲜运行和人工质量核对。 |
| 在等什么 | 等 root 的后续复用信号：仅证明代码在单个 hash 字面量之外仍为同一套，再组织一次原始新鲜工作流和完整人工质量复核。A 线当前没有待触发动作。 |
| 卡在哪 | 本次字面绑定没有阻碍。T18 仍受既有状态冲突、自检与提示回报不一致等问题约束；本轮没有运行，不能解除业务 HOLD。 |

## 依据与验证

- 新 `fixed-inputs.json`：17,100 bytes，SHA-256 `39c880ade5260cb085aee1240298b996a9b59e89d3229a49627bce0c1066eb01`。只有第 298、299 行改变。
- 新工作流：77,143 bytes，SHA-256 `807b05c900a5f4730c1d6099680425cae25d953bd6f1bad9a3be89a73aec5396`。只有第 25 行 hash 常量改变。
- 新 README：7,798 bytes，SHA-256 `259dde12359c4e78519d07d956ec8eb3fd97907a478cf239945edc8aebeac4a2`。只有第 92 行 hash 改变。
- 实际 Skill：15,420 bytes，SHA-256 `ef60fbbd8e6e60ff3bd87619d5530e735264864f574c63cc4538d8834c4dfffe`；与复核输入逐字节一致。
- 冻结 `b-service.py`：28,222 bytes，SHA-256 `87be5a7c09d0e8cafba0b3a729885189c517ddc0ea9bddb6b4c845cd7fdc3220`；未变。
- 三份可改文件的整字节正向、逆向校验均为真；清单、工作流和 README 的旧值零残留，新值各就位一处。其余固定行、顺序和现有私有 pin 未变。
- 实际命令面均有非空结果：`Get-Content`、`Get-ChildItem`、`Get-Item`、`Get-FileHash`、`Select-String`、PowerShell 整字节比对。
- 证据说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\status-pin-20261028-161212.md`。
- 写面：本任务目录三份目标文件与新增证据说明；协调目录为本回件。

## 未做与降级

- 未运行 Node、Python、import、parser、AST、测试、类型检查、编译、构建、HTTP、模型、GUI、SSH、自检或业务工作流；没有业务通过、运行时通过或产品级结论。
- 未读取凭据、DPAPI、环境密钥、Keyring、真实案卷或业务历史。
- 未执行任何 Git 写入；既有 dirty 原样保留，没有暂存、提交、重写、清理、锁或审批变更。

## 下一步建议

root 可沿用既有可执行代码证明，前提是确认除单个 hash 字面量外代码逐字节相同；随后执行一次原始新鲜工作流并人工核对业务质量。A 线无需继续动作。

Response ID: `A-T18-status-pin-20261028-161212`  
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T18-status-pin-20261028-161212.md`

删减轮：读者 1 / 槽位 1 / 半句 2 / 重复 1 / 过程 1 / 黑名单 0
