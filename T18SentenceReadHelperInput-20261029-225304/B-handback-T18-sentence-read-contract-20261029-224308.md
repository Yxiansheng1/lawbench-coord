# 线 B 交回：T18 读材料请求契约有限修复

## 结论

工单：`B-T18-sentence-read-contract-order-20261029-224308`

状态：`SOURCE_ONLY / BOUNDED_SOURCE_FIX / NOT_RUN`

已在独立 B 证据副本中修复 `case_read_material` 的请求期过度限制：现允许生产契约
内的单份、已登记材料分组和分页请求，同时保留未知材料、路径穿越、错误任务、
错误上下文及额外字段拒绝。冻结消费者、后置成功验收、模型、prompt、三问答案、
参数、预算、私建运行时和其他工作流工具均未修改。

本文件是正式交回，不是 Git 提交，也不是产品、真实模型、完整 T18、发车或业务质量
PASS。旧原始实际运行 `FAILED98.187s` 保留原状；本修复不把该失败追溯改绿。

## 产物

仓库证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceReadContract-20261029-224308\`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `native-sentence-calc.mts` | 164237 | `f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8` |
| `b-service-sentence-calc.py` | 50285 | `d22b23a29b0a6f438f393fcbf755f9ca578cd17afc0e567995aa95eac70de82f` |
| `literalfixed-inputs.json` | 12420 | `7eea9c826f4615f45bf0029a7d90b2dab01745fc8e48539d719947f326541fbf` |
| `read-guard-finite.py` | 6517 | `b7097361668ebda68df510b48a49ba62088dc2a72ded687d1a82c301aa20ff` |
| `README.md` | 5967 | `36e857e80df5583281511285e2cf3afb78fad1256a84853de4b2db6cf8c3e817` |

MTS 是批准输入逐字节副本，与冻结身份一致。没有 Node 观察器变化，也没有放宽三问、
计算、存稿或后置事件顺序。

## 源码变化

新 B 对旧 B 只有一个 diff hunk，位于 `FiniteFirewall._check_post` 的
`case_read_material` 分支。

旧行为强制 `name=刑事判决书`、其余四份材料固定成组且传满，并禁用分页字段。新行为：

1. 要求 `name` 是非空字符串且精确命中本任务五份已登记材料名；
2. 若存在 `more_names`，要求它是列表，且每个元素都是精确命中的已登记材料字符串；
3. 参数只允许 `name`、`more_names`、`start`、`offset`、`max_chars`；
4. 其余完整 schema 的类型、范围、项数、唯一性、组合限制和读取结果语义交给 Core。

没有 query/body 重写、默认回退、伪读取、新工具、新路由或未知材料放行。`_check_post`
的其他分支、`WORKFLOW_TOOLS` 四项、路由白名单、case/session/task/request 身份、
POST 次数、存稿和资源清理保持原字节。

## 验收口径

- 实际四材料组：旧 B 必须 `DENY`，新 B 允许进入 Core；
- 五材料组、单份已知材料、已知材料分页：新 B 允许进入 Core；
- 未知首项、未知附加项、路径穿越、畸形 `more_names`、错任务、错上下文、
  额外字段：请求期拒绝；
- 部分读取可以流过请求闸门，但仍会被冻结的“成功五材料读取”后置验收判失败；
- 成功路径仍要求一次列表、完整读取、实际三问、恰好一次算期、算期后立即存稿、
  raw result、引用、source GET、JSONL 与资源关闭。

`read-guard-finite.py` 只编译旧/新 `FiniteFirewall` 类 AST，并在受限本地命名空间
调用 `_check_post`。它不导入产品服务，不使用默认 app/CaseRegistry，不访问
HTTP/模型/Key，不写文件。源码安排 14 项断言；本轮没有执行它，因此没有有限
UNIT 通过结果，也没有真实模型结果。

## 清单反向差异

`literalfixed-inputs.json` 已从批准蓝图复制。与蓝图的逐行反向差异只有：

```text
- "bytes": 49941
+ "bytes": 50285
- "sha256": "eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3"
+ "sha256": "d22b23a29b0a6f438f393fcbf755f9ca578cd17afc0e567995aa95eac70de82f"
```

consumer 两路径、材料、批准输入、依赖 26 项、运行时三项、私建四项及原 8 项均未
替换。新私建 `7f8e…` 没有重建。

## 复用边界

- 未重演旧开工、安装、调研、全量测试或原始实际运行；
- 未复制、修改或重跑既有 16 项有限观察源码；
- 未改产品 A、Skills、contracts、SDK、B 产品源码或现有证据；
- 未改 prompt、三问答案、模型、API、参数、预算、fetch、lifespan、OCR、retainer、
  request scope、网络或清理；
- 未启动新增进程、listener、writer 或私建运行时；当前 PID 仅是本次执行者。

## 验证与原始命令账

本轮按要求没有运行 Node、Python、TSX、AST 执行、导入、类型检查、测试、构建、HTTP、
模型、GUI、产品路径或全量回归。只做了 PowerShell 文本/身份读取、两个只读
`git diff --no-index`、默认与忽略子模块的只读 Git 状态、机械复制和后置源码审阅。

截至交回前，`exec_command` 共 28 次：20 次退出码 0，8 次非零。

非零构成为：

- 1 次默认 Git 状态受共享 worktree 的 `dsh` 子模块目录权限拒绝；
- 1 次读材料目标路径尚未创建；
- 1 次只读检索使用了不存在的目标路径；
- 2 次预期有差异的 `git diff --no-index` 返回 1（B 单 hunk、清单两行）；
- 3 次 `shell` 参数误填 `bash`，均被 MXC 以 `Bash/E_ACCESS_DENIED` 在执行前拒绝。

另有 2 次只读命令误用备用 PowerShell 路径并完成读取。上述 5 次 shell 偏差均没有
写入效果，也不作为验证通过证据；其余命令均使用指定绝对原生 PowerShell 和
`login=false`。

默认 Git 状态和初次目标检查的阻碍均未修复或绕过权限。随后仅以
`git status --short --ignore-submodules=all` 和限定目标路径完成只读核对。既有
大量 dirty 全部保留，没有修改锁、审批、ACL、权限或 writer 状态。

## 纪律声明

本轮未联系其他聊天，未更换 API，未触碰生产。Git 全程严格只读：未执行
`git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
因此没有提交 SHA；协调目录本文件即正式交付。
