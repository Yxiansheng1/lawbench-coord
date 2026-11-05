# A 线正式交回：T34 namespace 匹配计数纠偏

## 状态

有界源码修改、单一新增测试和既有证据说明修正已完成。状态为
`SOURCE_HANDOFF_ONLY / NOT_RUN`：本执行者没有运行 Node、Python、AST/parser、import、
类型检查、Vitest、测试、构建、GUI、HTTP、模型、SSH、DPAPI、SDK 或默认应用，也没有读取
环境 Key。新源码和新测试尚未得到运行绿、类型绿、native 写入绿或业务绿。

执行令要求 Git 严格只读，故没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout`、`push`，没有暂存或提交，因此没有交付提交 SHA。交回以本文件和仓库证据说明为准。
未修改 index、锁、ACL、沙箱或审批。当前 PID 是本次 job 的唯一执行者，不是第二 writer。

## 执行令与既有状态

已完整读取唯一执行令：

`D:\Lawbeach\lawbench-coord\A-T34-namespace-match-order-20261030-081807.md`

已完整读取批准输入、两份源码副本、新测试副本、README 副本及原实现交回件：

`D:\Lawbeach\lawbench-coord\T34NamespaceMatchInput-20261030-081807\`

修改前当前三份输入与批准哈希逐项一致：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `dsh-ext/ui/settings.tsx` | 39756 | `48295283802E0B5FAB824DC004B004C513D28320ED235608450D4D29E37F4FC9` |
| `dsh-ext/ui/state.ts` | 18994 | `D93174F1F1AC88EB6C5552C740774178A636EF8D2EEFF592297750492A0257CB` |
| `dsh-ext/tests/t34-disabled-provider-idempotence.spec.ts` | 10958 | `C81C10D73E138C84220675B6B0AC32015AAEF8EA7DF69037D6B18A87538305B1` |

既有 dirty 原样保全。只读 status 显示目标仍为两个既有产品文件修改、新测试和证据
README 未跟踪；没有清理、暂存或回滚任何既有改动。

旧证据目录只有源码静态 README，没有可复用的运行通过证据。未改的
`ui/index.tsx`、`tests/t34-provider.spec.ts`、`tests/settings-t34.spec.ts`、
`tests/t34-projection-error.spec.ts` 哈希仍与旧证据记录逐项一致；它们原有的“源码未改”
结论可继续引用，但不能据此宣称本次新测试或类型检查通过。

## 改动清单

1. `D:\Lawbeach\lawbench-A\dsh-ext\ui\settings.tsx`
   - 只修改 `confirmedExternalProviderAbsent`。
   - 先确认 `payload.namespaces` 是数组，再只按候选记录的 `ns` 筛出
     `llm-pi-ai`。
   - 只有匹配项恰为一项时继续，之后完整保留原 `plain object`、`applies === 'live'`、
     自有 `value`、自有 `providers`、普通对象和自有 `external` 不存在这些门槛。
   - 无关 namespace 位于目标之前或之后不参与 `value.providers` 判定；其自有
     `external` 不影响目标。
   - 匹配目标缺失或重复时继续原 `unset` 路径，没有弱化重复目标闸门或底层写失败抑制。
   - 禁用分支、串行队列、代次/Remote/API 门、启用 `set`、凭据、路由、错误映射和其他
     产品行为未改。
2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-disabled-provider-idempotence.spec.ts`
   - 只在原第一条测试后新增一条顶层 `it`，原有 9 条测试正文和断言未改。
   - 覆盖多 namespace 中目标位于首/中/尾，无关 namespace 前后都有自有 `external`，
     每次均一次 `describe`、零 `mutate`、返回 `null`。
   - 覆盖无关 namespace 中重复匹配目标时仍一次 `describe` 和一次原样
     `mutate('llm-pi-ai', UNSET_EXTERNAL, undefined)`。
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DisabledIdempotence-20261030-080958\README.md`
   - 把“全局唯一 namespace”纠正为“所有 namespace 中恰有一个匹配目标”。
   - 同步新源码/测试字节数、SHA、相对批准快照差异和新增覆盖说明。
4. 本正式交回件。

没有修改 `dsh-ext/ui/state.ts` 的其他字节、旧测试、`ui/index.tsx`、契约、工单集、构建配置
或其他产品文件。

## 最终哈希与范围差异

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `dsh-ext/ui/settings.tsx` | 39858 | `E6F5E5FB98B6F249E397D85F98FE7EAC3A7DAE9869E1DAA57ABBC34F0FEE7967` |
| `dsh-ext/ui/state.ts` | 18994 | `D93174F1F1AC88EB6C5552C740774178A636EF8D2EEFF592297750492A0257CB` |
| `dsh-ext/tests/t34-disabled-provider-idempotence.spec.ts` | 12622 | `2B5104D027EBA0BFD9EFE40A6BA540339D13896968D25EF3F657B00B64B998A1` |
| `docs/plan/evidence/T34/DisabledIdempotence-20261030-080958/README.md` | 12221 | `5739E38FFE885CDC13DFFF6E249227D6945AFAB2193282E4604F1B295560D272` |

相对本次批准快照：

- `settings.tsx`：`+7/-4`，diff 只落在 helper。
- `state.ts`：源文件与批准副本 SHA 完全相同。
- 新测试：`+45/-0`，diff 只有一条新增 `it`。

## 静态验证

- 指定原生 PowerShell 下目标 `git diff --check`：exit 0。
- 四份最终文件尾随空白扫描：均 0 行。
- `rg` 确认 `payload.namespaces.length === 1` 已不存在，当前门槛为
  `matches.length !== 1`。
- 新测试文件现为 10 条顶层 `it`：原有 9 条加新增 1 条。
- `settings.tsx` 与批准副本的 no-index diff 只有匹配计数修正；新增测试与批准副本的
  no-index diff 只有插入测试。
- 未执行类型检查，故不宣称 TypeScript 编译通过；静态审查看护为旧门槛完整保留，匹配
  结果在访问字段前仍有普通对象守卫。

## 验证禁区与下一步

本卡不能证明，也没有尝试证明或修复底层 `ConfigEditor.edit` 的
`settings/rejected` 原因；该项仍为 `UNKNOWN`。本次只保留安全幂等调用方修补。

根执行器下一步应按令做 whole inverse 和 tests/source/all-raw 审计；通过后只跑新增测试、
必要受影响旧测试和类型检查。不得把本交回当运行绿，也不得重演安装、调研、全量测试、
配置、模型、SDK 或默认应用运行。

## 非零与偏离

1. 两次 `git diff --no-index` / `--numstat` 因预期存在文件差异返回 exit 1：
   `settings.tsx` 为 `+7/-4`，新测试为 `+45/-0`。这不是产品失败。
2. 一次误把测试 numstat 调用的 shell 填成 `bash`，运行器执行前以
   `Bash/E_ACCESSDENIED` 拒绝，exit 1；没有执行 bash、没有文件或状态变更。
3. 一次误把 README/源码 `rg` 调用的 shell 填成 `bash`，同样在执行前以
   `Bash/E_ACCESSDENIED` 拒绝，exit 1；没有执行 bash、没有文件或状态变更。
4. 一次 PowerShell 尾随空白扫描因 `foreach` 后直接接管道产生 ParserError，exit 1；
   用合法的 `& { ... } | Format-Table` 重跑，四份文件均为 0 行。
5. 初版补丁曾短暂重复一行 `descriptor.applies` 判断，在任何验证前已立即删除；最终
   helper diff 不含重复判断。

没有其他范围偏离、权限或 ACL 修改、锁修改、网络访问或秘密读取。

## 实际命令台账

除上述两次明确被拒绝的 `bash` 调用外，所有 shell 均显式使用：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

均使用 `login=false`，工作目录为 `D:\Lawbeach\lawbench-A`。并行批次按一次工具调用计。

1. exit 0：读取唯一正式执行令全文。
2. exit 0：列出批准输入目录并读取 `approved-inputs.json` 全文。
3. exit 0：并行读取 README、`settings.tsx`、`state.ts` 和新测试的批准副本全文。
4. exit 0：`git status --short --branch --ignore-submodules=all`；读取四份当前文件
   SHA/长度；读取 `PROJECT-PROFILE.md`；列出证据与既有交回件。
5. exit 0：读取上一份正式交回件和当前 README 全文；目标路径历史 diff；四份完整
   SHA。
6. 编辑：用 `apply_patch` 修改 helper 并插入单条测试。
7. 编辑：用 `apply_patch` 删除补丁中重复的 `descriptor.applies` 判断。
8. exit 0/1：no-index diff 审阅 settings 与新测试（exit 1 为预期差异）；state 与批准
   副本哈希相同；目标 `git diff --check` exit 0；`rg` 审阅 helper 与 10 个 `it`。
9. 编辑：用 `apply_patch` 给匹配 descriptor 补回普通对象类型守卫。
10. exit 0/1：读取三份最终 SHA/长度；settings no-index numstat 为 `+7/-4`（exit 1
    为预期差异）；PowerShell 测试 numstat 调用误填 `bash`，执行前被拒绝（exit 1）。
11. exit 1：正确 PowerShell 下测试 no-index numstat 为 `+45/-0`（预期差异）。
12. 编辑：用 `apply_patch` 修正 README 为“恰有一个匹配目标”，同步哈希和覆盖说明。
13. exit 0/1：读取四份未改引用哈希与四份最终文件 SHA/长度；README/源码 `rg` 调用
    误填 `bash`，执行前被拒绝（exit 1）；目标 status 与 `git diff --check` exit 0。
14. exit 0/1/0：正确 PowerShell 下 `rg` 核 README/helper；第一次尾随空白扫描出现
    PowerShell ParserError（exit 1）；读取 helper 和新增测试上下文（exit 0）。
15. exit 0：修正尾随空白扫描，四份文件均为 0 行。
16. exit 0：再次全文读取 README、检索旧“全局唯一”措辞，并读取目标 status。

## 交回结论

代码侧纠偏为“恰有一个匹配 `llm-pi-ai`”，不是“全局恰有一个 namespace”；旧 9 条测试
正文未改，新增测试覆盖执行令指定的顺序、无关 `external` 和重复目标。运行与类型验证
按令未执行，交根执行器继续。
