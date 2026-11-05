# A 线 T18 人工修改原因子句交回

状态：`SOURCE_CHANGE_READY_RUNTIME_NOT_RUN`

提交 SHA：无。本次 Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 修改范围

只修改以下两个正式证据文件：

| 文件 | 修改前 | 修改后 |
|---|---:|---:|
| `docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/native-contract-workflow.mts` | 107162 字节，`f9490c16259e98eab221a1215bbe98459587a479fb50ba64be08ef4b0fb8ee49` | 107195 字节，`f510f47205ca32446248c4232b5869a8389610c45d378e2166dc2a64ea0ab154` |
| `docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/manual-reason-observer.spec.mts` | 7386 字节，`1455f9e3bd683b0ce10b41ce1bf3f315c304bb39d9a537ece12a89c6322da890` | 9199 字节，`0b328d54f1246c298974cf47dc3eadf3555155470c102559a60dcd371de85a5f` |

未改调用点、函数签名、合同主体、测试清单、B 产品与测试、固定输入、manifest、映射、SDK、编译器、提示词、回答、宿主机、预算、redline/OOXML、JSONL、setup/finally/watch，也未改原失败报告。

## 具体修正

保留原有逐条绑定链：`out_of_scope.id` 对应实际编辑；实际编辑评论恰有一个 `风险N`；段号落在该风险块引用的段范围内；恰有一个对应风险块；块内恰有一条处理方式；处理方式带人工修改标记。

原因匹配只改已知“find 跨越域代码或超链接”分支。当前使用锚定的有限子句文法：

```text
(find跨越域代码或超链接 | find跨越超链接 | 域代码)
  [，|,|；|; (系统未收下 | 系统未接受 | 未能应用 | 应用未成功)]
```

已知原因后只允许一个分隔的明确失败状态；原因本身必须仍是已允许的跨越原因。错误原因、矛盾原因、否定状态、无分隔拼接及额外尾随子句均失败关闭。其他机器原因保持原有空白归一后的逐字相等匹配，不套用该特例。

这样可收下最新实际处理方式 `find跨越超链接，系统未收下`，同时不接受“只要原因前缀相同”的宽泛文本。

## 测试源码

原 16 个聚焦场景的字节和语义全部保留。新增使用 20:43 最新不可变实际草稿与编辑清单/结果，样例为不同的 `id5/risk5`：

- 最新实际状态子句直接通过；
- 去掉失败状态后的已知原因通过；
- 另一明确失败状态 `系统未接受` 通过；
- 错误原因加状态子句失败；
- 矛盾原因加状态子句失败；
- 状态后追加无关子句失败。

合计 22 个聚焦场景：7 个正向调用、15 个失败关闭场景。调用针对从当前 consumer 源码抽取的唯一顶层 `assertOutOfScopeReported`，不导入 consumer，不读取凭据，不接网络。

本轮没有运行这些测试。按执行令，Node、TypeScript 解析器、测试和其他原定禁区均留给 root 在完成源码复核后运行。

## 静态核对证据

consumer 逆变换：将当前函数体替换为冻结原函数体后，整个文件 SHA-256 精确回到 `f9490c16259e98eab221a1215bbe98459587a479fb50ba64be08ef4b0fb8ee49`。`OUTSIDE_FUNCTION_EXACT=True`，证明函数外字节未变。

测试逆变换：删除新增目录常量与新增测试块、恢复原收尾行后，整个测试文件 SHA-256 精确回到 `1455f9e3bd683b0ce10b41ce1bf3f315c304bb39d9a537ece12a89c6322da890`。`ORIGINAL_16_CASES_EXACT=True`。

函数内只读能力扫描未发现 `import/require/process/fetch/WebSocket/XMLHttpRequest/sendBeacon/child_process/http/https/net/tls/fs/os/eval/Function` 等能力词；使用的外层辅助调用仍为原有 `compact`、`exec`、`normalize` 等安全集合。

最新不可变输入身份：

| 输入 | 字节 | SHA-256 |
|---|---:|---|
| `T18ManualReasonClauseInput-20261028-202819/actual-final-draft.md` | 7913 | `3e609211745c95de2ad30b84cd7a2e38048a856cf881c625a876c51acb006c48` |
| `T18ManualReasonClauseInput-20261028-202819/actual-editlist-and-result.json` | 3151 | `58e8319c099e58d79135076d096cff5dd41e0c216a7668225f6f98ffc58e0e48` |
| `T18ManualReasonClauseInput-20261028-202819/root-actual-failure.json` | 6517 | `759c47e91c83cd73bfff7c36c8b5cfc5fab904806ca81567932eda72605a891c` |

冻结 consumer 与 observer 输入分别为 107162 字节 `f949…ee49` 和 7386 字节 `1455…a890`，本轮核对后保持不变。

## Dirty 保全

开工快照 `T18ManualReasonClauseInput-20261028-202819/A-dirty-before.txt` 为 2432 行，SHA-256 为 `a0abd9ef2dba9c9dc2265c166c4dcccb6f3a7446649776916ca9b6475619b271`。

完工后使用 `git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all` 得到同样 2432 行，`DIRTY_ALL_EXACT=True`，SHA-256 仍为 `a0abd9ef2dba9c9dc2265c166c4dcccb6f3a7446649776916ca9b6475619b271`。Git 仅执行只读 status；长路径目录的读取告警未改文件或索引。

## 阻碍与偏离

有两次读取命令因执行参数误传到已打包的 `bash.exe`，被原生 MXC 拒绝。两条命令未启动 Bash、未读取内容、未运行任何禁区程序，也未改变文件、进程、索引或审批状态。发现问题后所有命令均改用执行令指定的原生 pwsh，未启动 setup、legacy、扩权或锁修复。

本轮没有运行 Node、Python、test、selftest、Vitest、tsc、pytest、import、AST、parser、collect、prepare、build、serve、probe、HTTP、模型、GPU、GUI 或 SSH；没有使用凭据、真实案卷、网络或安装流程。因此本交回只证明有界源码修正及静态边界，不声明运行时绿灯。

## 遗留与 root 下一动作

20:43 原始失败报告仍为不可变事实：数学比例句与人工原因状态后缀导致原 consumer 失败，redline/DOCX/JSONL 重开未到达；`20 vs 2` 仍属 B 线上下文，本次未处理。

请 root 完成源码与逆变换复核后，在授权环境运行有限的 observer 场景，再决定后续实际工作流。建议命令轮廓：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-reason-observer.spec.mts'
```

Gate 1、完整 T18 与整个项目仍未完成，Packaging 保持 **HOLD**。本次未产生运行时通过、完整业务验收或发版就绪结论。
