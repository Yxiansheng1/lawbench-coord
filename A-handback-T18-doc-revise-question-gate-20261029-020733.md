# A 线交回：T18 doc-revise 必问闸门

状态：`SOURCE_READY_FOR_REVIEW / AUTHOR_NOT_RUN`

执行者：当前 A 线任务执行者（现有单 writer，未更换 API，未联系其它聊天）

## 完成内容

已完成有界源码修改和正式证据交回，没有执行 Git 写入。

唯一产品改动：

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
- 修改前 46028 B / `5e53fbe9d1833c6533143a2e87d7c39a4f2cf1ce4ede4b421572664aab9fdcfb`
- 修改后 46243 B / `d21dd7be6bc1fcb561063f259c2ad2e8d8714679f57982608823f5a896b1a5b0`

实现事实：

- 新增精确常量 `DOC_REVISE_SKILL = 'doc-revise'`。
- 既有 `requiredQuestionIds` 选择谓词只扩展为 `contract-review` 与 `doc-revise`。
- `doc-revise` 的实际必问 ID 仍由既有 Host `skillQuestions` 从机器 Skill 目录解析，没有写死 `draft`、`opinions`，没有使用 LLM 文本。
- 复用既有 `TaskState` 的提问身份、最终冻结结果、同任务/同会话校验、错误关闭和成果写入门。
- `TaskState`、共享契约、Host、UI、Skill、产品参数和旧测试均未修改。
- 草稿反馈回收仍只限 `contract-review`，没有扩到 `doc-revise`。

新聚焦测试：

- `D:\Lawbeach\lawbench-A\dsh-ext\tests\doc-revise-question-gate.spec.ts`
- 12428 B / `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40`
- 状态：`AUTHOR / NOT RUN`
- 5 个用例覆盖 Host 目录真实取值、未答双写入拒绝、错/重复/空 ID、错误/空最终结果、两个非空答案成功解锁、同任务新任务及迟到/跨会话隔离、目录不可用失败关闭、合同审查正向和无关 Skill/自由对话控制。

## 证据

正式证据：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocReviseQuestionGate-20261029-020733\README.md`
- 7146 B / `b0ea0e8d954ed2cc4a82d36910d379119856e47c15ffd2602b9b0567a3a89ab1`

证据完整记录了执行令/输入哈希、原始 `run-Jwpm24` 复用位置、精确改动、测试矩阵、冻结文件 SHA、实际只读命令面、写入面、全部非零尝试和未完成边界。

既有原始失败证据继续引用，不重演、不复制：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuineDocReviseContinuation-20261029-013610\run-Jwpm24`
- 失败摘要：`D:\Lawbeach\lawbench-coord\T18DocReviseQuestionGateInput-20261029-020733\root-actual-doc-revise-failure.json`

## 核验结论

- 输入快照其余 7 个关键文件 SHA 全部保持原值；无未授权源码漂移。
- 当前只读 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`，分支 `line-A`。
- 未执行 Node、Python、tsx、Vitest、tsc、解析器/AST、import、测试、类型检查、编译、私有构建、prepare、HTTP、模型、GUI、SSH、Key/DPAPI 或运行时操作。
- 未更新消费者 pin；不得宣称新源码已编译或已部署。
- 未触碰生产 JSONL、旧 FAILED 结果、真实模型会话或资源泄漏相关旧证据。
- 没有 add、commit、rebase、stash、reset、clean、checkout、push，也没有暂存。

`git status --short --branch` 因共享 worktree 的 `dsh` 子模块目录权限被拒；按令作为交付环境阻碍记录，未改锁、权限或审批。`A-dirty-before.txt` 已作为 311985 B / `88e05d589967f13b4e9722588f3fa6557b982d278e658edccfd2abc71a5b206b` 的基线保留。

## 非零与写入面

证据的“实际命令、写入面与非零记录”一节列全。关键非零：

- 只读 `git status --short --branch` 因 `dsh` 子模块 worktree 权限退出 1。
- 一次只读 PowerShell 哈希命令因本地转义错误退出 1，未写文件。
- 三次误把只读命令提交给 `bash`，均被运行器以 `Bash/E_ACCESS_DENIED` 拒绝，未执行命令、未写文件。
- 一个可选编辑清单结果样例不存在，读取退出 1；后续未依赖它。
- `git diff --no-index` 在确认差异时退出 1，属于正常差异语义。

实际写入仅：

- `dsh-ext/agent/index.ts`
- `dsh-ext/tests/doc-revise-question-gate.spec.ts`
- `docs\plan\evidence\T18\DocReviseQuestionGate-20261029-020733\README.md`
- 本交回件

## 后续门

本轮到此停止。下一步只应由主编排在另行授权的验证阶段执行新增聚焦测试、既有合同问题门与运行时回归、类型检查，再决定是否做一次与当前源码树精确对应的私有构建；未完成这些门之前，Gate 1、完整 T18、全项目和 Packaging 状态均不得改成 PASS。
