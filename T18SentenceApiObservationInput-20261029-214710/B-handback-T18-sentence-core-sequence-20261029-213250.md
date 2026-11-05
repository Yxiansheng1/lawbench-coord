# B 线交回：T18 sentence-calc 联合答案后计算时序修正

## 状态

`SOURCE_REPAIRED_NOT_RUN`。按
`B-T18-sentence-core-sequence-order-20261029-213250.md` 仅完成源修正、固定输入清单、
说明和本交回。本次没有执行 Node、Python、TSX、AST、导入、检查、测试、构建、模型、HTTP、
GUI 或产品路径，不宣称实际运行或业务通过。根复核仍需按令完成一次新的实际保存 DPAPI
运行及报告、人工、JSONL、source GET、OS 清理判读。

## 修改与身份

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\b-service-sentence-calc.py` | 50163 | `213a38489f596b0915ad6dd62e59fa12a7de6942d74e67e6a57402464e7d6db0` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\native-sentence-calc.mts` | 151508 | `4ae328eca562a3fc021981cb7bd17cfde16968c97e9f05dd5dbc0bc0261ab55d` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\literalfixed-inputs.json` | 12424 | `b68c9fa45bedf5fe139ce47fe781d478c4e63fa2b7d50a94f529bda4fab747a0` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\README.md` | 6202 | `fe696ab06ec61808f867bd5e49c947a05aba8bc45a194df24709b9809871369a` |

B 服务的最终身份精确命中根批准值 `50163 / 213a…db0`。只执行了批准的五段字节替换：

1. 从 B 工具允许列表删除 `ask_user_question`；
2. 删除 B 的 ask 分支；
3. 计算前要求 B 工具序列精确为
   `[case_list_materials, case_read_material]`；
4. 删除最终协议对 ask 数量的要求；
5. 最终协议要求计算下标为 2。

只读源计数为：`ask_user_question` 0 次；精确计算前序列 1 次；计算下标 2 约束 1 次；
计算唯一性约束 1 次；保存晚于计算约束 1 次。Host 的实际联合问答仍由 Node
`user-questions/request` 权威处理；生产 B `tools._registry` 无 ask 工具，B 仅依据实际
联合答案之后出现的工具请求放行一次计算。没有新增框架、旁路、通知、预置答案或弱化守卫。

`literalfixed-inputs.json` 是 `root-approved-manifest-data.json` 的逐字节副本，身份
一致；未使用动态 pin。消费者与执行令快照逐字节一致。场景仍是无 prior、无 request scope
的原始样本 01 五文件小样本，不是 T31 选中材料批次；未加入 scope、prepare、store 或
fallback。

## 边界与阻碍

只读 `git status` 的默认子模块遍历因共享 worktree 的 `dsh` 元数据
`Permission denied` 中止；改用忽略子模块遍历的只读状态命令完成核对。没有尝试修锁、
扩权、改审批或改 ACL，没有执行任何 Git 写命令。

原始作者记录实际为四次 `bash` 执行前拒绝，不是旧说明所写三次；原始命令也不支持
“另一次不同原生路径成功调用”的声明，故不再作该声明。本次接续另误传两次 `bash`，
均由 MXC 在执行前以 `E_ACCESSDENIED` 拒绝；当前可核累计六次，均未执行命令或产生文件
变更。其余有效命令均使用指定完整原生 PowerShell、`login=false`。

允许写入之外的旧正式文件、旧状态、快照、consumer、产品源码、Skill、contracts、tests、
SDK、private、权限和锁均未修改。本交回不是 Git 提交。
