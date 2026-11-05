# A 线 T18 原生合同审查收尾交回

交回时间：2026-10-28 17:01 +08:00

工单：`A-T18-native-contract-finish-20261028-165515`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 读完原始令，保全 dirty，审计消费者和 B 主契约；将清单哈希安装为真实值；补上范围外结果后的重新保存门槛和 redline manual 真实性门槛；新增 README 与本交回件。 |
| 目标是什么 | 形成主编排可直接审计和准入实跑的有限合同审查消费者。距离真实模型修订版证据、业务复核和封装门仍有距离。 |
| 在等什么 | 等主编排按 README 入口执行实跑。信号是生成新的 `run-*` 与 `report.json`；信号到达后核对 report、DOCX、JSONL 和 B 关停记录。 |
| 卡在哪 | 作者运行边界为 0，所以没有实际运行卡点。Git 全树状态在 `dsh` 子模块处被权限拒绝；已改用忽略子模块的限定路径只读检查。 |

## 改动清单

| 文件 | 动作 | 字节 | SHA-256 |
|---|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\native-contract-workflow.mts` | 修改 | 103328 | `099a5388d4faa8596335e4b2b9984d757774ae728b2964d96122238af1c7b4c3` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\b-service.py` | 原样保留 | 30607 | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\fixed-inputs.json` | 原样保留 | 17136 | `63f2da57aedf9165a50e7b356224c37ca4b8918abf3ceb9e4b839ff8773b8e6d` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\README.md` | 新增 | 4992 | `d24fd2de1f7140ca8c0cf7f681a132181d584c136a05333c7fd08cba38e73f86` |

消费者改动只有三处：

1. 将 `FIXED_INPUTS_SHA256` 从全零占位改为 `63f2da57aedf9165a50e7b356224c37ca4b8918abf3ceb9e4b839ff8773b8e6d`。
2. `case_save_edit_list` 返回非空 `out_of_scope` 时，要求真实模型先收到该工具结果，再调用 `case_save_draft` 保存更新后的审查意见。
3. redline 的 manual 条目必须属于真实修改清单、不得重复，并覆盖 edit-list 返回的全部 `out_of_scope` 条目。

没有修改提示词、问题答案、32/48/45 分钟预算、`max_tokens=32768`、模型、provider、B 产品源码、Skill、材料、测试、SDK、配置或权限。

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-native-contract-finish-order-20261028-165515.md`。
- 原始执行令：`D:\Lawbeach\lawbench-coord\A-T18-native-contract-order-20261028-163202.md`。
- 固定清单：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\fixed-inputs.json`。
- 静态审读面：消费者全文、有限 B 入口全文、`outputs.py`、`redline.py`、`tools\edit_list.py`、`api\ui.py`、`case\source.py`、当前 `contract-review\SKILL.md`、相关 API/tool 契约、任务说明、仅 root 判分要点、资源 pins 和固定输入清单。
- 静态事实：真实清单 SHA 与消费者常量一致；B 入口 SHA 与清单 `bServiceEntry` 一致；源码固定 39994 字节和 `16ea49cb…`，内部意见固定 823 字节和 `3c40461c…`；当前编译 agent/host 仍为 194112 冻结成品。
- 目录只读状态：`line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`；限定 T18 目录显示四个文件均为 `??`。本轮没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 运行原始结果

- 作者运行时为 0：未启动 Node、Python、编译器、测试、HTTP、模型、GUI、SSH 或案件创建。
- 没有 `run-*`、`report.json`、`b-service-final.json`、实际模型回复、真实事件或修订版 DOCX；不存在可引用的运行 PASS 或非零业务结果。
- 三次误把工具 shell 设为 bash 的调用均在执行前被拒绝，实际命令数为 0；之后全部使用显式原生 PowerShell。此记录不改变作者运行时为 0。
- 全树 `git status` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限被拒；没有尝试修锁、改 ACL、修权限或 Git 写入。限定路径的只读状态检查已成功。

## 未做与降级

- 没有声明源码通过编译、测试通过、实际模型成功、GUI 成功、业务质量通过、全 T18 通过或项目完成。
- 上一轮阅卷业务质量失败仍是独立缺口，本交回不改写该结论。
- 真实运行时还需要主编排审计全部命令、固定 pins、setup/finally，再用现有保存 Key 的匿名 stdin 驱动；本交回不提供 Key 或凭据位置。
- Packaging HOLD。

## 下一步建议

主编排先全文复核本目录四个文件和有限 B 入口，再按 README 的原生命令准入实跑。新的 `report.json` 是唯一可采信实跑信号；若失败，按报告中的实际工具、pending 字段和 cleanup 证据判读，不用静态源码补写成功结果。

删减轮：读者 4 / 槽位 2 / 半句 2 / 重复 1 / 过程 1 / 黑名单 0

Response ID: chat reply

Response log path: chat reply
