# B 线清理条件正式交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 保留冻结入口全文，只修改第 2607 行的 cancel/join 入口条件，增加 `!contextDisposed`；另交付未运行的真实空上下文生命周期检查脚本和 README。 |
| 目标是什么 | 给复核方一份只差单个既有释放条件判断的可审候选，用来消除释放后再次读取已移除 Agent 注册表造成的清理误报。完整任务、模型复验和最终验收没有完成。 |
| 在等什么 | 等 root 独立审查候选和脚本；若接受，再运行 README 中的有限检查。检查通过后，才进入完整源码、全部命令、改动反向恢复、ESM 形态和 JSONL 切片的独立审查。 |
| 卡在哪 | 候选交付没有停摆。按要求未运行 Node、Python、测试、编译或模型；首次 Git 只读状态查询因 `dsh` 子模块权限拒绝而退出 1，未修权限或锁，随后忽略子模块遍历的只读查询成功。 |

决策完成度四态：已合流可见，否；在飞，否；已裁未派工，否；候 owner，是。root 后续的独立复核和有限运行尚未发生。

## 依据与验证

- 候选入口：`docs/plan/evidence/T18/GeneralDraftingCleanupContract-20261029-040438/native-general-drafting.mts`，101408 字节，SHA-256 `9DC27EB332B0AEDFBC520929B80ED88654D260F6AA0F6E24E109F4CF626C3B40`。
- 原冻结入口：101388 字节，SHA-256 `8DA50E45E6C54B78BB3A6E1D2C7C3E736E8534885CB0116C816FCC4AA4439871`。两版均为 2758 行，PowerShell 逐行比较得到两条差异记录，即一条旧文本和一条新文本。
- 空上下文检查：`cleanup-context-finite.mts`，9214 字节，SHA-256 `400722641C8529F6ADAE70ADED828B96563C6ED1340CB2920AE79B34023795A7`。该文件只创建真实空 Cordis Context 并安装真实 AgentRegistry，不创建会话或 Agent。
- 说明文件：`README.md`，4264 字节，SHA-256 `5D39F0F9D2D842B5C2EC8ACA588152D81B5D25C53E1F8CDD1ED4350297578240`。其中命令明确标注为未执行。
- 伴随输入保持执行令原哈希：B 服务脚本 `85A16D5EC6729E608BA32834E189D64BE9406FED5043687CB9F477A28827FE07`，字面输入清单 `CC96D0A45BDBF6889E1F142F157224BC259FF582FCD65927C494CD3218B12D77`。
- 实际只读 Git 查询：`git --no-optional-locks status --porcelain=v1` 退出 1，报 `dsh` 子模块目录权限拒绝；`git --no-optional-locks status --porcelain=v1 --ignore-submodules=all` 退出 0，显示既有 dirty 保持，本次新增仅目标证据目录。
- 写入面仅限新证据目录的五个文件，以及本协调目录交回文件。没有 Git 写入，没有修改旧运行目录、旧失败报告、产品源码、SDK、测试、Skill、lib、构建产物或运行固定项。

## 未做与降级

- 生命周期检查没有运行，因此“旧路径真实抛出 TypeError、新路径跳过、释放前空注册表分支可执行”目前只是待运行断言，不是实测通过。
- 没有重跑模型、B 服务、完整消费者、类型检查、编译、构建、全量测试或 JSONL 复验。
- 没有生成 `cleanup-context-finite-result.json`。旧版 T18 报告仍为 `FAILED`，本交付不改变其结论。
- 完整任务、业务质量、法律复核和最终验收仍不完整，打包保持冻结。

## 下一步建议

root 先审阅上述候选入口、生命周期检查脚本和 README；若边界符合执行令，再按 README 中列出的未执行命令运行有限检查。有限检查通过后，root 再独立核对完整源码、全部命令、改动反向恢复、ESM 形态、实际生命周期结果和 JSONL 切片。不需要本线提交或修改 Git 锁。

删减轮:读者 2 / 槽位 1 / 半句 3 / 重复 4 / 过程 3 / 黑名单 2

Response ID: 未提供

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T18-general-cleanup-contract-20261029-040438.md`
