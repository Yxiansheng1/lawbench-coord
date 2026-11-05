# B 交回件 律师功能清单精确校正

状态：候选完成，待根复核；打包保持暂停。

日期：2026-10-27。

| 项目 | 内容 |
|---|---|
| 做了什么 | 律师功能清单的三个既有单元格已按 Skill 原文校正；另写内部修订说明和本交回件。 |
| 目标是什么 | 让律师看到的下一步动作和边界与真实 Skill 一致；读者文档仍是待根复核的候选。 |
| 在等什么 | 等根复核反向比较三个单元格、其余字节、18 个 Skill ID 和 21 个固定输入；收到通过信号后再进入主编排的后续决策。 |
| 卡在哪 | 本轮没有需要修复的技术阻碍。Git 按令只读，既有脏项原样保留。 |

## 交付文件

- 读者文档：`D:\Lawbeach\lawbench-B\docs\guide\连越律所工作台功能清单.md`
- 修订说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillListPrecision-20261027-175532\root-review-amendment.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\B-handback-T36-lawyer-list-precision-20261027-175532.md`

## 三处校正

- 案件 wiki：明确律师点击“生成案件 wiki”或“更新案件 wiki”后，由程序按流水线生成并保存；案件卡片继续作为后续任务输入。
- 质证意见：质证意见表按步骤保存；庭审发问提纲仅在律师需要时另存。
- 刑期计算：保留日期由程序计算；未支持项收窄为“数罪并罚、缓刑考验期、减刑后的新刑期”，法定刑档次改由律师核实。

## 依据与验证

- 校正前读者文档与固定快照 SHA-256 一致：`b1c32478771b80aa8a4b5f71798903894e33ce0b95230189722511ea912da702`。
- `case-wiki-build` 第 4、18 行支撑按钮和流水线表述。
- `cross-exam-opinion` 第 30、41 行支撑发问提纲的条件表述。
- `sentence-calc` 第 21、53、59 行支撑日期计算、三类排除项和法定刑档次核实。
- 行级只读比较只有第 4、10、17 行三个差异块；表格仍为 18 行、通用 8、专用 10、四个分析相关标记。
- 校正后文档为 9082 字节，SHA-256 为 `40d9ce79bba882e56f41abd51cce98cfe566e1efa10c1e810e73c5a7b02d3a9f`；无 BOM、LF 换行。
- 三个相关 Skill 的哈希与固定快照一致，本次没有写入 Skill。

## 旧证据与阻碍

- 旧 build/check 原始日志历史结果为退出码 0；旧 pytest 原始日志为退出码 1，4 failed、1308 passed、44 skipped，不能写成通过。
- 本次快照一致只证明本次没有改 Skill，未做历史运行源码身份比对；旧检查日志仍是历史证据，不能声称当前 21 个输入已经通过。
- 旧根记录实际有四次执行前 Bash 拒绝，旧主交回说明写成三次；本件不改写旧文件或旧计数。本轮另有一次 Bash 误填被运行器拒绝，未读写，随后用指定原生命令完成。
- 普通 Git 状态读取发现大量既有脏项，全部保留；没有 add、commit、rebase、stash、reset、clean、checkout 或 push，也未改锁、ACL、沙箱或审批。

## 未做

未运行 Python、Node、测试、测试收集、构建、检查脚本、HTTP、GUI、模型、安装或自检；未重跑旧绿项，未渲染或打包。未读取真实案卷、历史会话、缓存、环境文件、Keyring 或发票账本，未联系其他会话或更换 API。

## 下一步建议

根复核按修订说明反向比较三个单元格和其余字节。若三处精度、全文件保持项或旧证据口径有异议，根复核只指出具体行和事实；作者据此做必要且有界的再次校正。打包保持暂停，直至根复核另有明确决定。

关键路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillListPrecision-20261027-175532\root-review-amendment.md`

Response ID：未分配（本地执行器未提供）

Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T36-lawyer-list-precision-20261027-175532.md`
