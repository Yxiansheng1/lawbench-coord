# T18 刑期计算读取契约有限修复

## 状态

`SOURCE_ONLY / BOUNDED_SOURCE_FIX / NOT_RUN`

本目录按
`D:\Lawbeach\lawbench-coord\B-T18-sentence-read-contract-order-20261029-224308.md`
制作。唯一源码修改是 B 线有限服务快照中
`FiniteFirewall._check_post` 的 `case_read_material` 请求分支。

本轮没有运行 Node、Python、TSX、AST 脚本、导入、类型检查、测试、构建、HTTP、
模型、GUI、产品路径或全量回归；没有产生真实模型通过、完整 T18 通过、发车或业务
质量结论。`read-guard-finite.py` 是可审阅的有限 UNIT 源，必须由主编排复核命令、
写入面和源码后执行。

## 文件

| 文件 | 性质 |
| --- | --- |
| `native-sentence-calc.mts` | 冻结消费者逐字节副本 |
| `b-service-sentence-calc.py` | 允许有界修改的 B 服务快照 |
| `literalfixed-inputs.json` | 批准蓝图，仅 B 的 bytes/SHA 更新 |
| `read-guard-finite.py` | 待主编排执行的纯 UNIT 源码 |
| `README.md` | 本说明 |

冻结 MTS 为 164237 字节，SHA-256：

`f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8`

它与任务输入以及此前已通过相关审查的 consumer 身份相同。本轮没有运行 Node
观察器、修改 prompt、放宽三问或改变模型/API。

## 唯一源码修改

旧请求分支只接受：

1. `name` 固定为 `刑事判决书`；
2. `more_names` 恰好包含另外四份材料；
3. 参数集合恰好为 `name`、`more_names`。

因此一次读取四份材料、读取单份材料、使用 `start`/`offset`/`max_chars`
分页等生产契约允许的请求，会在 Core 前被成组拒绝。

新请求分支允许：

- 必填 `name` 为本任务五个已登记材料名之一；
- 可选的 `more_names` 为非空或空的有序字符串列表，其中每项也必须是五个已登记
  材料名之一；
- 可选的 `start`、`offset`、`max_chars`；
- 不接受其他参数。

新分支只做材料归属和字段白名单判断。`more_names` 的 1 至 9 项、唯一性，
`start`/`offset`/`max_chars` 的类型、范围，以及 `more_names` 与分页参数不能并用的
规则，继续由实际 Core 使用完整生产 schema 和应用逻辑处理。没有重写 payload、
静默默认值、伪造读取或增加回退。

未知首项、未知附加项、路径穿越、错误任务、错误 L1 上下文和额外参数仍在请求期
拒绝。路径写法不能借由已知名称片段绕过；唯一放行依据是材料名精确命中本任务
登记集合。其他工具、路由白名单、任务/会话/case/R 身份、POST 次数、存稿约束、
安全和资源清理路径均未修改。

## 冻结的后置验收

消费者和 B 服务的成功后置验收未放宽：

- 仍要求一次成功 `case_list_materials`；
- 仍要求实际成功的成组读取覆盖五份材料；
- 仍要求实际三问、恰好一次成功算期、算期后立即存稿；
- 仍检查 raw result、引用、source GET、JSONL 和资源关闭。

请求闸门现在允许部分读取继续流向 Core，因为读取语义不应由测试程序阻断；但部分
读取仍会在冻结的成功验收中失败。旧原始实际运行
`FAILED98.187s` 继续判红，不能被本源码修复追溯改绿。新行为若在真实运行后仍出现
读取顺序或质量失败，应作为独立失败保留，并转移原始剩余工作，而不是增加变体。

## 有限矩阵源码

`read-guard-finite.py` 从旧 B 和新 B 各提取唯一顶层 `FiniteFirewall` 类 AST，
在只含标准 `os`、`pathlib`、`typing.Any` 和本分支所需的材料/工具常量命名空间中
编译执行。它不导入产品服务，不创建 app/CaseRegistry，不读 HTTP、模型或 Key，
不写文件。

卡组包含：

- 实际四材料组在旧 B 必须拒绝、在新 B 必须允许；
- 五材料组、单份已知材料、已知材料分页必须允许；
- 未知首项、未知附加项、两处路径穿越、非列表 `more_names`、非字符串附加项、
  错误任务、错误上下文和未知字段必须拒绝。

源码共安排 14 项断言，输出只能是 `UNIT_PASS_NOT_REAL_MODEL` 或
`UNIT_FAIL_NOT_REAL_MODEL`。本轮没有执行它，因此当前没有有限 UNIT 通过结果。

## 复用与未做事项

- 不复制、不重写、不重跑既有 16 项有限观察源码；其既有结果原样作为前序证据。
- 不重演旧开工、安装、调研、全量测试或旧真实运行。
- 不修改产品 A、Skills、contracts、SDK、新私建或现有 B 产品源码。
- 不新增 prompt、三问答案、模型参数、预算、fetch、OCR、retainer、请求范围、
  网络路由或清理行为。
- 私建运行时四项 `7f8e…` 身份保持原样，不重建。

## Git 与执行纪律

默认 Git 状态被共享 worktree 的 `dsh` 子模块目录权限拒绝；随后以
`--ignore-submodules=all` 完成只读状态核对。既有大量 dirty 全部保留，本任务只新增
本证据目录。未修 index、权限、ACL、审批或 writer 锁。

本线未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`
或 `push`。因此没有新提交 SHA，协调目录交回件才是正式交付。

执行过程中出现过工具参数误填：若干净 `bash` 调用均被 MXC 在执行前以
`Bash/E_ACCESS_DENIED` 拒绝；另有只读命令使用了备用 PowerShell 路径并完成读取。
这些偏差没有写入效果，也不作为通过证据；正式交回件逐条列明。

## 主编排后续

1. 审阅本目录全部源码、命令面、写入面和批准清单反向差异；
2. 运行 `read-guard-finite.py` 的有限 UNIT，并复用已批准的 ESM 与依赖身份；
3. 对新 B 的最终 bytes/SHA 做逐字准入；
4. 只执行一次新的原始实际流程和冻结后置验收；
5. 任何实际失败原样保留，不改 consumer、不增变体、不以模型或 prompt 调整追绿。
