# A 线 T18 机器原因单表达式修正交回

状态：`SOURCE_CHANGE_READY_RUNTIME_NOT_RUN`

执行依据：`D:\Lawbeach\lawbench-coord\A-T18-clause-machine-reason-fix-order-20261028-203259.md`

提交 SHA：无。本运行器对 Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 修改范围

只修改以下两个正式证据文件：

| 文件 | 修改前 | 修改后 |
|---|---:|---:|
| `docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/native-contract-workflow.mts` | 107195 字节，`f510f47205ca32446248c4232b5869a8389610c45d378e2166dc2a64ea0ab154` | 107202 字节，`31415f0ec05605bba10e69721c4579fa21d00d553c9af38d84c74ee1b103b3f9` |
| `docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/manual-reason-observer.spec.mts` | 9199 字节，`0b328d54f1246c298974cf47dc3eadf3555155470c102559a60dcd371de85a5f` | 9832 字节，`01f3394735d033ffda806627283cdc6f12292a04b3748bdd0071397083821a34` |

未修改调用点、函数签名、合同主体、既有测试清单、B 产品与测试、固定输入、manifest、映射、SDK、编译器、提示词、预算、setup/finally/watch、旧 raw、旧 formal 或旧 status。未改 README。

## 单表达式修正

只将 `assertOutOfScopeReported` 内的机器原因身份判断从展示子句正则匹配改为规范空白后的精确身份比较：

```text
修改前：
const actualCrossBoundaryReason = crossBoundaryReasonClause.exec(compact(actualReason)) !== null

修改后：
const actualCrossBoundaryReason = compact(actualReason) === compact('find 跨越域代码或超链接')
```

展示子句的锚定有限文法原样保留：

```text
/^(find跨越域代码或超链接|find跨越超链接|域代码)(?:[，,；;](系统未收下|系统未接受|未能应用|应用未成功))?$/
```

因此只有机器实际原因为 `find 跨越域代码或超链接` 时才进入展示子句分支。机器实际原因 `域代码` 属于 OTHER 原因，继续走空白归一后的精确相等后备路径，不再被误分类为完整的“域代码或超链接”原因。

## 新增控制场景

在既有22个场景之后追加两个控制场景，均调用从当前源码抽取的同一 `assertOutOfScopeReported`：

1. 机器实际原因改为 `域代码`，同一风险块的文档处理方式写 `find跨越超链接`：必须拒绝。旧谓词会把它当作跨边界原因分支而误放行。
2. 机器实际原因仍为 `域代码`，同一风险块的文档处理方式写 `域代码`：必须通过。用于锁定 OTHER 原因的规范化精确后备匹配。

两个场景复用最新不可变实际草稿和编辑清单，只替换风险5对应的原因身份与处理方式，没有引入新框架或新功能。

## 静态核验

consumer 逆变换：将唯一新表达式替换回冻结原表达式后，整个文件 SHA-256 精确回到 `f510f47205ca32446248c4232b5869a8389610c45d378e2166dc2a64ea0ab154`。新表达式出现1次，旧表达式出现0次，`INVERSE_MATCHES_FROZEN=True`。展示子句行未变。

observer 原字节保全：新文件前9199字节的 SHA-256 精确等于原文件 `0b328d54f1246c298974cf47dc3eadf3555155470c102559a60dcd371de85a5f`，`ORIGINAL_22_CASE_BYTES_EXACT_PREFIX=True`。新增内容位于原文件 EOF 之后。

最新实际输入核验：

| 输入 | 字节 | SHA-256 |
|---|---:|---|
| `T18ManualReasonClauseInput-20261028-202819/actual-final-draft.md` | 7913 | `3e609211745c95de2ad30b84cd7a2e38048a856cf881c625a876c51acb006c48` |
| `T18ManualReasonClauseInput-20261028-202819/actual-editlist-and-result.json` | 3151 | `58e8319c099e58d79135076d096cff5dd41e0c216a7668225f6f98ffc58e0e48` |

## Dirty 保全

`T18ClauseMachineReasonInput-20261028-203259/A-dirty-before.txt` 为2432行，SHA-256 为 `d3c635658bcb24ecaa45ab7635b818d7fb63127d7f8a0bacf9b7d9e8ef0ccd7e`。

修改后用纯只读方式运行：

```powershell
git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all
```

结果仍为2432行，行内容与行序逐项一致，`DIRTY_ALL_EXACT=True`，`DiffCount=0`。长路径目录产生只读告警，但未改变文件、索引或 dirty 清单。

## 阻碍与执行边界

首次顶层 `git status` 在读取子模块 `modules/dsh` 时被权限拒绝；未修复权限、未扩权、未改 ACL 或锁、未使用第二 writer。随后按只读方式忽略子模块完成 dirty 序列核验。

本轮未运行 Node、Python、TypeScript 解析器、observer、Vitest、tsc、pytest、AST、import、build、HTTP、模型、GPU、GUI、SSH、setup 或 finally。未读取凭据、Key、DPAPI、Keyring、环境秘密或真实案卷，未访问网络，未启动或更换 API。

因此本交回只证明有界源码修正、两个追加控制场景已写好及字节/静态边界成立，不声明24个场景运行时通过，也不声明完整 T18 或发版就绪。

## Root 下一动作

请 root 在同一冻结基座上执行完整源码逆变换与24场景必要的离线有限 ESM 验证，再运行后续真实流程。作者运行器不运行这些测试，也不继续处理 B 线并发速率辅助或 `20 vs 2` 上下文。
