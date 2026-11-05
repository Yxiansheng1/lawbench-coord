# B 线交回：T18 sentence-calc 实际观测前置修复

## 状态

`SOURCE_ONLY_AUTHORED_NOT_RUN`。已按唯一执行令新增入口并完成字节/结构核验；本线没有
执行 Node、Python、TSX、解析器、导入、检查、测试、构建、HTTP、模型、GUI、产品路径或
全量回归。这不是实际运行、业务/法律、Gate 1 或完整 T18 通过，不触发打包。

原实际失败 `FAILED` 结论继续有效。首次有效分组读取早于列表调用，按批准顺序仍是主失败；
其后的传输错误原因仍未证明，本次未探测或重试该错误。

## 新入口

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceApiObservation-20261029-214710`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `native-sentence-calc.mts` | 151508 | `4ae328eca562a3fc021981cb7bd17cfde16968c97e9f05dd5dbc0bc0261ab55d` |
| `b-service-sentence-calc.py` | 49941 | `eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3` |
| `literalfixed-inputs.json` | 12432 | `96849e75b71af571e5f144b74a2534d85169e978e9efb2ffe2d1ff93cbba253e` |
| `README.md` | 4968 | `280dbd3e843215e71c157f9cd0a5240dfd2f616d7780403fbd68db61b61deabb` |

MTS 与根批准源逐字节一致。manifest 是 `root-approved-manifest-data.json` 的逐字节
固定副本。B 服务只应用根批准的三项替换：不再于请求当下阻断 list、grouped read、calc
的三项程序性顺序。检查未删除；既有最终整序列断言仍要求前两项严格为 list/read、calc
恰一次且索引 2、save 至少一次且在 calc 后。Node Native 事件、五材料名、无 max_chars、
CoreSchema/case-session-task-R 绑定、一次计算、无外连、写入范围、资源关闭和清理均未改。

因此真实坏序仍失败验收，只是实际数据能够流到事后判读处观测。没有改 prompt、答案、
模型/provider/参数/预算，没有新工具、endpoint、旁路、store、helper、测试框架或第九门。

## 下一位准入

主编排可复用与上述精确 MTS 字节及依赖身份对应的既有静态通过项，不重跑旧绿项；仍需完成
FULL 反向核验、guards、setup/cleanup、typed contract review + BAST、current literal
admission。唯一获准的新执行是按原工作流运行一次，并读取实际报告、人工判读、calc、
draft、source GET、JSONL 与 OS 进程/监听关闭证据。再次坏序应为 `FAILED`。

## 边界

默认只读 `git status` 因共享 worktree 的 `dsh` 子模块目录权限拒绝；忽略子模块遍历的
只读状态核对完成。未修锁、扩权、改审批/ACL 或拆 writer 锁。严格无 Git 写入，无
`add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
本交回是协调目录文件，不是 Git 提交。
