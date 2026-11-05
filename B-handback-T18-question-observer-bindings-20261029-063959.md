# T18 提问观察器绑定修复交回

状态：**源码修复已交回，实际运行未执行，等待主编排复核与根控重跑**。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新建独立证据目录，原字节复制四个冻结输入；消费者只恢复两个缺失绑定并修正观察器最大值语义；同步清单和有限脚本 pin；写入 README 与本交回件。 |
| 目标是什么 | 消除旧实际运行的 `saveCalls` 未定义错误及同段 `lastRequiredAnswerSeq` 缺失绑定，使主编排能够复跑既定的静态与有限检查，再决定是否跑一次新实际运行。 |
| 在等什么 | 等待主编排读取本交回件和证据目录，完成 whole-inverse 审阅并发出根控检查信号；信号到达后由主编排运行定向变量绑定检查、九个有限案例，然后再决定实际重跑。 |
| 卡在哪 | 本次没有技术阻塞；实际运行被作者边界禁止，所以在此停止。普通 `git status` 受共享 `dsh` 子模块目录权限限制，按令未修复。 |

## 依据与验证

- 新证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftQuestionBindings-20261029-063959`
- 说明文件：同目录 `README.md`
- README 身份：7716 字节，SHA-256 `d26d485fdecf730458c1b4323bfbbb148b6bb288cf276e3ec802d5678f89b37a`
- 消费者：115024 字节，SHA-256 `9d5aeab699479e3db0c4c951f66fb1c407e28846804da6315ccb3ce18fbaab25`
- B 服务：45468 字节，SHA-256 `2f25915f5cd549ae373d187b8e49f9b8d0f1af7fb81e249c2f46043de723c164`
- 字面固定输入清单：10775 字节，SHA-256 `f559caac973fbe7c6b797563f9d3a0418c7c97d0c041b01deb1e625280a4c9aa`
- 有限检查脚本：18510 字节，SHA-256 `56de325de747c41b48a0776e41e7936c55ccfd08d5a56ebc76e8267526c1618d`
- 消费者冻结输入：114845 字节，SHA-256 `94ba5fbcf35f65f90b66dbb9e0143250061d9f52f9d6a18f3dd0116f4f2f7c3c`
- 字面固定输入冻结件：10775 字节，SHA-256 `86515893b9cdf6066ddc116f05f6dcae7806eb389884d641270ee7da3f48c950`
- 有限检查脚本冻结件：18510 字节，SHA-256 `7f69aa3ab51a495f8d03686c0d3fa45ea644ab38580978832ca5f7b628510faf`
- 只读 diff：消费者恰好三处文本变化；清单只改 `consumer` 与 `bService`；有限脚本只改四个 pin 值。
- 服务一致性：B 服务副本与冻结输入 SHA-256 完全相同。
- 旧失败原文：`D:\Lawbeach\lawbench-coord\T18QuestionObserverBindingsInput-20261029-063959\actual-failure.json`，21485 字节，SHA-256 `1ec0d4e755ac9c7e9a226350526e9412855dc197d42aaa470b9e08655f797f92f`。
- 旧实际运行：111.5 秒，模型 POST 8、HTTP 200 8，三问在序号 34 回答，首次成功保存序号 38、结果序号 39，最终 v2 草稿 5894 字节、12 条引用、`must_fix=0`，B guard PASSED，清理无错误，整体仍为 FAILED。
- 未变身份：实际事件子集 26311 字节、`5fab19f7f3c210f298ca363e0592d0b3165adb5f13ac103324cc7f4d59f08b45`；冻结编译代理 552781 字节、`f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f`；Skill 13469 字节、`92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912`；346 项 B 源 pin 53548 字节、`3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`；25 项私人构建清单 58200 字节、`712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14`。
- 导入方向：有限脚本导入消费者；消费者不导入有限脚本。清单因此不需要 helper 行。
- 旧有限检查：九个案例曾经 PASS，本轮没有重跑；因最大值计算已改，该历史结果不能替代当前检查。

## 未做与降级

本轮未执行消费者、有限脚本、Node、Python、parser、AST、import、check、test、build、HTTP、模型、GUI、SSH 或 DPAPI。未读取 Key 或 Env，未更换 API，未改产品、Skill、提示词、预算、SDK、契约、测试或私人构建，未设置工程上限。

运行计数均为 0：消费者 0、Agent 0、Session 0、Context 0、Task 0、Case 0、model request 0、HTTP request 0、子进程 0。消费者与有限脚本的实际状态均为 NOT_RUN。

没有 Git 写入。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。Git status 的 `dsh` 子模块权限拒绝保持原状，未改锁、权限、审批或沙箱。

作者有四次调用误设成 Bash，均在执行前被运行器拒绝，没有执行 Bash 内容；后续恢复指定原生 PowerShell。该记录不改变代码、证据或运行计数。

## 下一步建议

主编排现在可审阅新目录和本文件。审阅后先做三处编辑与数据 pin 的 whole-inverse，再做针对 `saveCalls`、`lastRequiredAnswerSeq` 的当前变量绑定静态红绿检查；通过后运行一次九个案例的有限检查。有限检查通过后，再由主编排决定并启动一次全新的同规范实际合同起草。完整 T18、业务验收和打包继续保持 HOLD。

删减轮：读者 0 / 槽位 0 / 半句 1 / 重复 1 / 过程 0 / 黑名单 0

Response ID: B-T18-question-observer-bindings-20261029-063959
Response log path: D:\Lawbeach\lawbench-coord\B-handback-T18-question-observer-bindings-20261029-063959.md
