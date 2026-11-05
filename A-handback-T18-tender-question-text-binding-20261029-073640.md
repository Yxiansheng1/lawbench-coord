# A 线交回：T18 tender-review 题目文本绑定修正

## 结论

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-tender-question-text-binding-order-20261029-073640.md`
- 作者状态：`QUESTION_TEXT_BINDING_SOURCE_READY_NOT_RUN`
- 封装：`HOLD`
- 唯一新证据目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewQuestionTextBinding-20261029-073640`
- 正式文件：
  `D:\Lawbeach\lawbench-coord\A-handback-T18-tender-question-text-binding-20261029-073640.md`

本轮只修复主编排已定位的消费者题目文本绑定 RED，没有运行消费者、admission、ESM 导入、
类型检查、绑定检查、模型或实际链路。不能据此宣称实际链路、题目语义、业务质量、Gate 1、
完整 T18 或打包通过。

## 交付身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-tender-review.mts` | 117979 | `19505d6ff1552b310463cefc6f7ff1d86372e810098e8c8e3b1639b08a8fa83a` |
| `b-service-tender-review.py` | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` |
| `literalfixed-inputs.json` | 11289 | `9a1b38a7de5a05a2a3ddfc31e6aa11fe12836194bf899dcbb71a5f59ef6faf23` |
| `README.md` | 13564 | `c5a63880b1a4fce830d0f5ce509e328fca55bcaa8b634f2d5813f4535f965007` |

逻辑 `TASK_NAME` / `REVIEW_ID` 仍为原 `A070224`；证据目录使用本执行令的新目录名。

## 有界修改

新 MTS 相对执行令 before 快照只有一行差异，位置为记录返回对象的第 1884 行：

```diff
-    questionTexts: question.questionTexts,
+    questionTexts: answeredCalls.flatMap(call => parseAskQuestionShape(askQuestionArguments(callById.get(call.callId)!)).questionTexts),
```

该表达式只遍历 `answeredCalls` 中已经成功回调并已由既有严格断言确认存在于 `callById`
的真实 ask 调用，按实际成功调用及题目顺序解析同一批 Native 事件中的参数。它与
`questionIds` 使用同一 `answeredCalls` 顺序，没有新增 Map、状态、助手函数、假历史、
假问题或假回答，也没有改观察器护栏。严格两项 ID、首次成功保存前的实际回答、A-E 致命
护栏、`must_fix=0`、全部 hints、双 ID、实际回答、时间顺序、主问题拒绝、setup/finally、
fetch/JSONL 和既有参数均保持。实际题目文本不是新提示词，题目语义确认仍为 `ROOTMANUAL`。

`literalfixed-inputs.json` 只更新自有 `consumer` 与 `bService` 两个对象的路径；consumer
同步为新字节和 SHA-256，bService 同步为新路径但保留原字节和 SHA-256。只读差分显示清单
没有其他变化。

## 字节保全

| 对象 | 身份 | 结果 |
|---|---|---|
| B 服务 | 46017 字节，`3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` | 与 before 逐字节相同 |
| 六个批准输入 | 清单身份 `0939aebc1e1d3c611cccb641261809eee6e0c1a3ffc16f27d0aef1c62e001e5d` | 清单内容未改 |
| B 源 pin | 清单身份 `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97` | 清单内容未改 |
| 私有 manifest | 清单身份 `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14` | 清单内容未改 |
| 编译 agent/host/package | 清单身份保持不变 | 清单内容未改 |
| 26 项依赖 | 清单身份保持不变 | 清单内容未改 |
| 三个运行时可执行文件 | 清单身份保持不变 | 清单内容未改 |

未新建、重建或替换 private25、SDK、loader、依赖、模型、provider、全局配置或运行时。
旧 T18 tender 证据、旧源码、旧状态、raw 和既有运行结果均未改写。

## 工作树与 Git

- 开工前 dirty 快照：
  `D:\Lawbeach\lawbench-coord\T18TenderQuestionTextBindingInput-20261029-073640\A-dirty-before.txt`
- 以相同 `--short --ignore-submodules=all --untracked-files=all` 口径对照，当前只新增本证据
  目录的四个未跟踪文件；没有任何既有 dirty 条目被删除或改写。
- 窄范围状态只显示
  `?? docs/plan/evidence/T18/TenderReviewQuestionTextBinding-20261029-073640/`。
- Git 全程只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 没有修锁、ACL、审批或共享 worktree 状态。

## 验证边界

本轮没有运行执行令禁止的 Node、Python、TypeScript/解析器/AST、import/check/test/build、
模型、HTTP、GUI、SSH、Env/Key、DPAPI、root driver 或进程探测，也没有安装或运行准备脚本。
只使用指定绝对路径 native PowerShell 做文本读取、哈希、文件复制和只读 Git
status/diff；唯一内容写入是上述一处 MTS 表达式、清单两个对象、README 和本正式文件。

产品运行期计数全为 0：consumer 0、Agent 0、Session 0、Context 0、Task 0、Case 0、
model request 0、HTTP request 0。该计数不冒充 CLI/脚手架遥测。

本轮共 24 次 Shell 调用：21 次退出 0，3 次非零。

1. 读取正式执行令。
2. 列出 before 快照文件。
3. 读取 before README。
4. 读取旧正式文件。
5. 读取 `root-binding-red-result.json`。
6. 读取 `root-binding-red.json`。
7. 读取工作树窄口径 status。
8. 确认目标目录原不存在。
9. 哈希四个 before 文件。
10. 检索旧绑定源码上下文。
11. 创建目标目录时误用 `New-Item -LiteralPath`；运行器不支持该参数，命令在写入前失败。
12. 改用原生 PowerShell `New-Item -Path` 创建目录并复制四个冻结文件。
13. 哈希复制结果。
14. `git diff --no-index` 核对 MTS；因确有一行差异返回 1。
15. 读取冻结清单。
16. 检索新 MTS 的旧/新表达式。
17. 查看 dirty 快照格式。
18. 哈希首次修改后的四个交付文件。
19. `git diff --no-index` 核对 B 服务，逐字节相同，退出 0。
20. `git diff --no-index` 核对清单；因两个对象身份差异返回 1，输出只含两块变化。
21. 读取目标目录窄范围 status。
22. 首次 dirty 对照误用目录折叠 status 口径，输出不具判定力。
23. 改用与快照一致的 `--untracked-files=all` 对照，只显示新增四个目标文件；Git 同时报告
    若干既有超长路径 warning，未阻断，也未做修复。
24. 哈希 README 最终修正后的四个交付文件。

三次非零均是上述第 11、14、20 条：一次在写入前因运行器参数能力拒绝，两次是
`git diff --no-index` 对真实差异按约定返回 1。没有一次是产品命令、测试失败或运行时失败。

## 后续由主编排执行

主编排仍须在完整源码、依赖、setup/finally 和逐字节反向审阅后自行执行：整文件与唯一
表达式反向核对、清单两对象核对、全 setup/finally，再做 focused observer RED -> GREEN、
主 MTS 两项变量绑定、ESM/AST/current 509 admission，最后仅执行一次 canonical actual，
使用自动 DPAPI 与匿名 stdin。作者本轮到此停止。
