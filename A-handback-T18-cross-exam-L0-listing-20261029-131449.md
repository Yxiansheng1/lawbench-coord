# A 线交回：T18 跨案 L0 材料清单误拒修复

交回时间：2026-10-29 13:14 之后  
线别：A  
状态：`AUTHORED_NOT_RUN` / `REVIEW_REQUIRED`  
任务入口：`D:\Lawbeach\lawbench-coord\A-T18-cross-exam-L0-listing-order-20261029-131449.md`

## 结论

已完成有界源码修复和有限验证材料交付。旧消费者把 `case_list_materials` 作为无条件必需工具；新消费者接受“成功工具清单”或“同一 fresh turn、当前 R 前缀中的真实 L0 typed section”任一有效路径，不强制追加 Native 工具调用。

作者未运行 Node、Python、AST/VM 验证器、服务、浏览器、HTTP、模型或 GUI。因此本次不是有限验证通过，更不是业务、法律、完整 T18 或打包通过。根编排仍需按令做源码复核、有限验证、命令与反例审计，再做离线实际资格判断；原 `run-zs09S1` 的 `FAILED` 报告永久保持，不重写、不洗绿。

## 交付文件

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamL0Listing-20261029-131449`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-cross-exam.mts` | 137700 | `f33e60ac55e2923c864cc3c5a80afe901de15af10f63fe1648ada72dcb1aab02` |
| `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| `literalfixed-inputs.json` | 12262 | `edf4e1b040714ae9202646dd542d452d41cf6957c5047c1a5e23badd1f27dc40` |
| `verify-L0-listing-finite.mts` | 21855 | `23b47ab8fbc887526eff510feaf0d461622fecf7f2624a0420e8ff78128473a3` |
| `README.md` | 4461 | `c15c51b346ea07275f886f11a2f368a619aab39f86d56f06b444b1fc8b7a73ec` |

目录内无其他新增文件。Git 中五项均为 `??` 未跟踪文件；未暂存、未提交。

## 实现范围

新 MTS 相对基线 `6ab1f2e5...` 的代码差异仅有：

1. 清单观察器增加 L0/工具双路径和严格 L0 section 解析；
2. 增加必要的来源、R、seq、实际名称和当前批次范围报告字段；
3. 增加 `requestId` 与 `materialId + sha256` scope 选项；
4. 从实际工具循环的 required list 删除单行 `case_list_materials`。

L0 路径要求：

- `user/message`、`surfaceOp=append`；
- `data.source.kind=lawbench-context`、`form=snapshot`；
- 当前 turn 的 `turn/start < L0 seq < 当前 R seq < 首次材料读取 seq`；
- 当前 R 的 `source.kind=user` 且 `source.rpcId` 精确等于实际 request ID；
- 只解析名为 `案件卡片（L0）` 的 typed section，不搜索用户正文；
- `## 材料清单` 只能出现一次，其后的每一行必须精确匹配 B 受限 L0 生产器的 `- 名称（状态）` 格式；
- 名称必须与当前 `materialReads` 的实际名称集合一致，并报告对应 `materialId + sha256`；
- 缺 section、错 source、晚于读取、重复、额外、改名或错批次均失败；
- 不回落全案、历史、配置默认批次或额外 Native 调用。

工具路径仍保留原有成功 `case_list_materials` 能力：结果必须在首次读取前且五个名称精确匹配。工具结果错误、晚到、缺名、重名或错批次不被接受。

保留项：

- 三个实际必问 ID `stance`、`scope`、`need_questions`；
- 实际联合回答、前序 denied ask 分类、单一成功回调、invocation/attempt/inflight 观察；
- 回答早于首次读取、首次读取早于成功保存、真实 R、scope、source GET 与正文断言；
- primary 中思考、128K、49152、32 次模型、48 次工具、45 分钟、1,200,000 ms timeout、finally 收尾；
- 全部实际草稿、citation、source read 和运行报告断言。

未改产品、Skill、测试默认库、路由、服务、网络守卫、加载器或构建脚本。

## 冻结输入与 held 状态

- actual failed-closed JSONL：`203065` 字节，`adbca9d61673e8d4768446905d61c0c8da79c74651e0426d2cdb3437596f5f29`
- 原失败报告：`18824` 字节，`928143c5247196fbb464d3594088e2b42ac245bbca871947251405a8ee801739`
- 旧 wrong-answer trace：`265287` 字节，`13555ca8461f2e76fe987c4f0ff13ce35e57dd20fe6154546d27b01ed0f97604`
- 当前产品：`dsh-ext\agent\index.ts`，`46684 / 5366f845...`
- 当前编译 agent：`552937 / 8f6bcb5c...`
- 当前 private manifest：`58196 / 3756191e...`
- 当前 `context.py`：`6409 / 1128f934...`
- Skill 第 37 行路径：`12390 / 03615deb...`
- authorized answers：`453 / 4784dfc3...`

I 新 B 文件与协调基线逐字节相同：`48345 / aa428e97...`。新 manifest 只改了自有 consumer/B 路径及 consumer 字节、SHA；其余 approved inputs、26 dependencies、4 compilerPrivate、3 runtimeExecutables、source pins、答案与原始输入保持。

实际运行关键前缀：

| 事件 | seq |
|---|---:|
| L0 typed snapshot | 5 |
| 当前用户 R | 6 |
| 联合必问调用 | 16 |
| 联合回答结果 | 17 |
| 首次材料读取 | 21 |
| 首次保存调用 | 31 |
| 首次保存成功结果 | 32 |

session：`session-80a6b5e7-bedf-48f3-8ca0-416a28e14afc`  
request：`32f7ecb5-b38d-466e-bef6-a7d37c0a59cb`  
case：`6b927e80-60d5-4c51-a328-5bba64ca8f1c`

## 有限验证器

`verify-L0-listing-finite.mts` 设计为源码限定验证：

- 固定上述 JSONL、原报告、旧 trace、旧/新 consumer、Skill/context/agent/source/答案；
- 使用 TypeScript AST 只抽取观察器与必要 helper，不导入完整 consumer/main；
- 在最小 `node:vm` 中执行，只提供 `createHash`，不提供 process/fs/network；
- 从实际 seq 5 L0、seq 6 R、seq 16/17 回答、seq 21 首次读取、seq 31/32 首次保存构建同一实际前缀；
- 旧 observer 必须拒绝该 L0-only 实际序列；
- 新 observer 必须以 `listingSource=L0`、`listingSourceSeq=5` 通过并报告五名和实际 scope；
- 反例包括实际 L0 删除、另一个封存 trace 的真实 R、错预期批次、晚 L0、非 context source、缺 L0 section、重复/额外/改名；
- 工具路径用直接结构化单元输入，不在 Native 历史中伪造 case_list 事件。

待根编排执行（作者未执行）：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamL0Listing-20261029-131449\verify-L0-listing-finite.mts'
```

预期顶层 `status=FINITE_PASS`，且 `scope` 为 `pure observer/helper contract; not complete business verification`。该结果只证明有限 observer/helper 契约，不证明完整业务、法律质量、完整 T18、GUI 或打包。

## 根编排下一步

1. 完整复核新 MTS 相对基线 diff，确认差异仅在令允许范围；
2. 完整复核有限验证器的抽取与反例，确认没有伪造 Native history；
3. 运行上述有限验证器并保存输出；
4. 核对所有 pins、manifest、实际 JSONL 和原 `FAILED` 报告未被改写；
5. 按令再决定 offline actual qualification；不得跑同模型重试、prompt variant 或语义框架补绿；
6. 单独审计 B 提前中止时 fire-and-forget Core `task/end` 清理；本次未动 finally、未增加等待。

## 阻碍与执行记录

- 初始全仓 `git status` 因 `.../worktrees/lawbench-A/modules/dsh` permission denied 失败；这是只读状态探测阻碍，不影响交付。未尝试修权限、扩权或绕过锁。随后以 `submodule.recurse=false` 限定目标路径完成只读状态核对。
- 一次只读搜索误把 shell 参数写成 `bash`，运行器以 `E_ACCESSDENIED` 立即拒绝，未读取、未写入；此后全部使用指定的 native `pwsh.exe`、`login=false`。
- 未启动 setup、未切 legacy、未改沙箱/审批/ACL、未拆 writer lock。
- 未联系其他聊天、未换 API、未执行 Git add/commit/rebase/stash/reset/clean/checkout/push。
- 未触碰原 served source/run/report；production JSONL reopen 与 source GET 仍未被本次覆盖。

作者到此停止，等待根编排复核。
