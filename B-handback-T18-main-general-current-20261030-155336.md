# B 线 T18 当前版本主流程回归候选 正式交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在新证据目录交付三份运行文件和一份 README：入口与 B 服务各改指当前 source pins，入口把两处编译产物 import 改指 T34 当前私有构建；清单按 root 批准蓝图落地，仅改两个自身份字段。 |
| 目标是什么 | 给 root 一份只差自身份改指、可直接跑当前版本主流程的候选，用新的 Host 启动代码和 Agent 闸门做一次当前版本回归。业务正文与法律质量仍单独人工评审，不在本候选内认证。 |
| 在等什么 | 等 root 独立审查源码与全部命令，然后跑一次真实主流程；owner 的同步发版信号到达前不跑全量套件。 |
| 卡在哪 | 没有卡点。候选已备好；本次未运行任何东西，完整 T18 项目、全量套件、业务质量、法律复核与最终验收都未完成，打包保持冻结。 |

决策完成度四态：已合流可见，否；在飞，是；已裁未派工，否；候 owner，否。

## 依据与验证

- 入口 `docs/plan/evidence/T18/MainGeneralCurrent-20261030-155336/native-general-drafting.mts`，101383 字节，SHA-256 `B37FAC29F8F26EF4985329B9694E5775A0ADDFF67DB95C634055B03788CCB5D9`。
- B 服务 `docs/plan/evidence/T18/MainGeneralCurrent-20261030-155336/b-service-general-drafting.py`，42437 字节，SHA-256 `44BB8B5FF60309A7D7DC3C1474AB4EFEBE00995673927F59137DBB1F86346203`。
- 字面输入清单 `docs/plan/evidence/T18/MainGeneralCurrent-20261030-155336/literalfixed-inputs.json`，11922 字节，SHA-256 `E6F63625680DE2394AA841B51A2C29A8B5A14C9B7FCC524A437C3C2B09ABBC38`。
- 说明文件 `docs/plan/evidence/T18/MainGeneralCurrent-20261030-155336/README.md`，4546 字节，SHA-256 `1E09CACBC7CC7D89FD4FCFD98B41928636B7515B8A54BE697D4C3527456C9340`。
- 改动行数：入口 2758 行不变，只差 4 行（source pins 路径与 SHA-256、两处编译产物 import）；服务 1057 行不变，只差 3 行（pins 路径两块字符串与 SHA-256）；清单 278 行不变，相对 root 批准蓝图只差 4 行（`consumer` 与 `bService` 两行的 `bytes` 与 `sha256`）。
- 清单逐行只读复核通过：approved inputs、source pins、canonical 任务、Skill、5 份材料（含 `mtime_ns`）、26 条 dependency、4 条 compiler private、3 条 runtime executable、consumer、bService，字节数与 SHA-256 全部对上真实文件。
- 新 source pins 文件 53548 字节、SHA-256 `7410F1BD84F1B2A2764203540550670D3252A73BAE3B3E3CC02007E5ADF9C57B`，346 条逐条对 `D:\Lawbeach\lawbench-B` 真实文件复核通过；相对旧 pins 只差已接受的四条（archive.py `1bc47967`、wiki.py `96698902`、citations.py `6171f0dd`、parse.py `56f6ac85`）。
- 4 条 current compiled 产物（agent `0C403EAC`、host `AD0F620E`、package `3D6BCAF2`、manifest `98FB7A0D`）字节数与 SHA-256 与蓝图一致，真实存在于 T34 私有输出目录。
- 入口常量与清单 `sourcePins` 行逐字段一致（路径、SHA-256、字节数、条目数 346）；新目录三份文件不再引用旧 pins 路径、旧编译产物路径或旧证据目录路径。
- 单一 `contextDisposed` 清理守卫保留在原位；旧版整体 `FAILED` 报告未改写；有限空上下文清理检查与两处身份修正按令复用，不重跑。
- 实际只读 Git 查询：`git --no-optional-locks status --porcelain=v1 --ignore-submodules=all` 退出 0，既有 dirty 保持，本次新增仅目标证据目录；`.git\index.lock` 不存在。
- 写入面仅限新证据目录的四个文件和本协调目录交回文件。没有 Git 写入，没有修改旧运行目录、旧失败报告、产品源码、SDK、测试、Skill、lib、构建产物或运行固定项。

## 未做与降级

- 本次未运行 Node、TypeScript、Python、测试、类型检查、编译、构建、准备脚本、HTTP、模型或界面。README 里的命令是给 root 用的，本次未执行。
- 没有生成运行结果文件。真实开案→五份固定材料→NativeSession/R/Host/LegalAgent/AgentLoop→一次联合三问回调→实际起草保存引用→生产 JSONL 关闭重开→自有清理这条主流程，本次只是备好了可跑的候选，没有取得运行结论。
- 全量套件未跑，等 owner 同步发版信号。
- 完整 T18 项目、业务质量、法律复核与最终验收仍不完整，打包保持冻结。

## 下一步建议

root 先审这四份文件与上面列出的改动边界；边界符合就按 README 里的命令跑一次当前版本主流程回归，随后独立复核完整源码、全部命令、类型契约、清理守卫、改动反向恢复、ESM 绑定、当前 pins 和清单，再决定一次实际保存的 DPAPI 匿名 stdin 调用。本线不需要提交，也不需要动 Git 锁或审批。

删减轮:读者 2 / 槽位 1 / 半句 3 / 重复 4 / 过程 3 / 黑名单 2
