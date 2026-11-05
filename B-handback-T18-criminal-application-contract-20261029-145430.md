# 刑事申请书调用契约修订交回

修订源码已写入新证据目录，原三件源码和现有 dirty 均保持原样。本次只去掉过度具体的消费者语义门，并把人工判断与报告中的“期望值”分清；真实模型工作流尚未运行，不能据此宣称产品通过或业务验收完成。

| 类型和状态 | 内容 |
|---|---|
| 做了什么（已交源，未运行） | 新目录已交付三件源码。真实提问回调不再以固定机关字符串和固定第 34 行拒绝答案；报告改用期望值字段并标记待根复核；主申请角色接受三种明确写法；清单只指向自身新入口与未变的 B 服务。 |
| 目标是什么 | 交付一套可由根执行者直接准入并运行一次的刑事申请书消费者，验证真实模型提问、人工回答、材料出处和保存草稿。距离完成仍差根侧静态准入、一次真实保存运行、人工读问句与出处、关闭与 Key 检查。 |
| 在等什么 | 等根执行者对新入口和清单做有限静态检查，并用一套新私有案卷运行一次真实 6000D 保存工作流。运行报告到手后，根执行者核对实际问句文本、引用来源和保存参数，再作技术结论。 |
| 卡在哪 | 本次修改未停摆。Git 全局状态命令被受限子模块的读取权限挡住，但新目录写入和文件级核验均正常；按授权未修权限、锁或改 Git 状态。 |

## 依据与验证

- 新源码：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CriminalApplicationContract-20261029-145430\native-criminal-applications.mts`，137924 bytes，SHA-256 `effd7e0e66c49bd1a12172e00180f83ff584034c513966e8a9570fef7edf135f`。
- B 服务：同目录 `b-service-criminal-applications.py`，48430 bytes，SHA-256 `5841bfe21acd27ac6bc6dd468d8d2c1dedafbb28db52b176fb94d12032c7e28b`，与批准源码逐字节相同。
- 固定输入：同目录 `literalfixed-inputs.json`，11652 bytes，SHA-256 `92dbec88557eece5c4971f3361f166d7378f957dfa7945e0a75c6d7e0feeb9c8`。
- 修订入口与原入口只差授权四类内容：常量与报告字段命名、18 行展示语义门删除、报告待复核标记、主申请角色三选一检查。问题文本与选项仍从真实回调捕获，source GET 仍对实际引用执行。
- 固定输入清单只改自身消费者路径、bytes、SHA 与自身 B 服务路径；其余行逐行保持。
- 原三件源码与协调目录批准快照完全相同；来源 dirty pin 共 42 项，存在性、bytes、SHA 全部匹配，未被改写。
- 技术说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CriminalApplicationContract-20261029-145430\README.md`。
- 修订前身份 pin：`D:\Lawbeach\lawbench-coord\T18CriminalApplicationContractInput-20261029-145430\three-pins.json`。
- dirty 保全 pin：`D:\Lawbeach\lawbench-coord\T18CriminalApplicationContractInput-20261029-145430\B-tracked-dirty-pins.json`。
- Git 阻碍原文：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied`，随后报告该子模块 `git status --porcelain=2` 失败。

## 未做与降级

- 未运行 Node、Python、TSX、TypeScript、测试、构建、产品导入或解析检查、真实模型、HTTP、GUI、SSH、DPAPI、Key 读取或进程探测。
- 没有真实问题文本、回答、草稿、运行报告或截图；没有模型、产品、业务或法务结论。
- 没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push，因此没有提交 SHA。
- 未修改原三件源码、现有 dirty、产品、Skill、契约、测试、配置、运行时、权限、审批、锁、模型地址或 API。

## 下一步建议

不需要 owner 现在作业务决定。根执行者应先对新入口与清单做允许的有限静态检查；通过后只运行一次新的真实保存工作流。收到实际问句文本、回答、材料读取、source GET、保存参数和关闭报告后，根执行者再人工确认“提供了文书类型”与“从来源读出了机关和出处”，并由 owner 完成业务与法务复核。

`Response ID: B-T18-criminal-application-contract-20261029-145430`

`Response log path: D:\Lawbeach\lawbench-coord\B-handback-T18-criminal-application-contract-20261029-145430.md`
