# 线 B 交回：T18 litigation observer fixed contract

任务：`B-T18-litigation-observer-fixed-contract-20261029-194948`

状态：`SOURCE_COMPLETE / AUTHORED_NOT_RUN / ROOT_REVIEW_REQUIRED`

## 结论

按正式执行令完成唯一新证据包的复制和有界修正。`native-litigation-docs.mts`
的字节数、SHA-256 均精确命中 root 预批准身份；B 服务副本逐字节未变；
`literalfixed-inputs.json` 与 root 批准文件逐字节一致。有限观察器脚本已完成五个
已确认静态缺陷的修正，但未执行。

本轮没有运行消费者、有限回放、TypeScript 编译器、Node、Python、测试、构建、
HTTP、模型、GUI、SSH、DPAPI、Key 环境、进程探针、SDK 或产品流程。没有启动或
准备新的完整 Native 实跑。

## 证据目录

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\LitigationQuestionObserverFix-20261029-194948\`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-litigation-docs.mts` | 127270 | `8f9cbd8a64036d2a82f143993806cdd1ddcf8d68ac3fabf9a3ba1c91dcf88901` |
| `b-service-litigation-docs.py` | 46327 | `c9e8faa0b998eff4ed893a439e5030a76c0a04dda8e438e6bc2af563e29105f2` |
| `literalfixed-inputs.json` | 11552 | `193f2f7ff9332604d3db3c1deb1c83f103bfa10cc6b60534dd079fe445249c2a` |
| `observer-replay-finite.mjs` | 24524 | `424ba29c59629250aa0b402a662888999362e0d8d33f96926d179dc39a47e542` |
| `README.md` | 6371 | `538f0d7bc52a68a22d1000e3196f8bf5e33c349774801164f2962cfa9a3def52` |

根预批准消费者身份文件为：

`D:\Lawbeach\lawbench-coord\T18LitigationObserverFixInput-20261029-194948\root-approved-entry-identity.json`

实测 MTS 的身份与该文件一致：

- bytes：`127270`
- sha256：`8f9cbd8a64036d2a82f143993806cdd1ddcf8d68ac3fabf9a3ba1c91dcf88901`

旧候选和旧证据包均未覆盖或改写。

## 五项修正

1. `setupProduction` 返回对象补入已要求的
   `questionsBeforeReadDenial`。
2. `successfulReadsAfterRequiredAnswers` 同时要求读取调用的 `seq` 与结果
   `resultSeq` 都晚于最后必问答案；读序诊断同样命中两种早于答案的情况，不再
   仅靠结果序号形成假通过。
3. 编译版 LegalAgent 与 host 的两个绝对导入路径改为 root 批准的
   `LitigationQuestionPrivateBuild-20261029-193422` /
   `private-output-20261029-194043` 文件。其他源码字节按指令保持。
4. 有限脚本按 69 个物理行读取：先验证 `type=session`、`version=4` 头部，
   再只读切出 68 个事件，断言事件 seq 连续为 0..67。未改写输入，也未生成新的
   header ID、cwd、UUID、R 或模型历史。
5. VM 返回的数组/对象只在测试比较前归一化为 host 纯结构数据；生产 ask 参数、
   tool result 和 SDK 均未归一化。跨 VM 错误改用 Node 内建
   `util.types.isNativeError` 识别，顶层失败记录报告真实 `name/message`。

`TASK_NAME`、`REVIEW_ID`、参数、提示词、答案、回调成功语义、拒绝来源、源码
解析、覆盖、JSONL、`finally`、fetch、Key、防护、公共 Skill 和输入契约均按令
保持。

## 实际回放元组

实际数据仍为 197963 字节、68 个事件、SHA-256：

`c449784caf29430657eb65ab5265a155027f68857f4304312a8ac8b05a773f1b`

有限脚本现在要求六组成功读取元组：

- Wiki：18/19、20/21、22/23
- 材料：27/28、29/30、31/32

全拒绝 UNIT 变体也改写结果 19/21/23/28/30/32，预期六次精确生产拒绝、零次
成功读取。三个实际案例仍命名为 `actual_*`；所有否定案例均显式标为 `UNIT_*`。
UNIT 只修改内存克隆，不持久化事件、trace 或输入；脚本在运行前后对原始实际
JSONL 做完整字节比较。

实际读序保持 **RED**：六次成功读取均早于答案 42。没有把旧读序改成绿灯，也
没有生成新的消息或历史资源冒充实际 pipeline 证据。

## Manifest 与运行入口

`literalfixed-inputs.json` 直接复制 root 批准数据：

- 绑定当前四个 private 编译文件；
- 绑定当前四个 runtime pin；
- 指向本证据目录中的 MTS 与 B 服务；
- 其余 approve input、材料、Skill、依赖、源码 pin 和运行时可执行文件保持。

有限脚本仍要求先收到 stdin 的 `ROOT_OBSERVER_RECEIPT`，只在证据目录内用
`flag: 'wx'` 写新的 result JSON，拒绝覆盖，并保留进程内网络拒绝、只读 pinned
输入和清理边界。本轮没有运行它，因此没有 `root-result.json`。

## 只读核验

本轮实际完成的核验仅为 PowerShell 文件级静态检查：

- MTS 字节与 SHA 精确命中 root 批准身份；
- B 服务字节与 SHA 保持；
- manifest 与 root 批准数据文件 SHA 完全一致；
- 实际 JSONL 字节与 SHA 保持；
- 有限脚本含 69 行头部结构、0..67 事件切片、跨 VM 错误处理、比较数据归一化、
  六组元组、六项拒绝、输入前后比较；
- 有限脚本仅 import Node 内建模块，不 import consumer、Agent、Session、SDK、
  provider 或 service；
- README 使用绝对 source/result 示例并明确 `AUTHORED_NOT_RUN`。

以上是文件级静态核对，不是测试结果，也不是产品绿灯。

## Git 与工作区

Git 全程严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout
或 push，因此没有交付提交 SHA。

只读 `git status --short` 在子模块 `dsh` 处因权限拒绝而失败，错误为：

`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied`

该问题没有通过扩权、锁修改、审批修改或 Git 写入尝试处理。它不是本交回的源码
阻碍。除本次明确新增的证据目录和本交回文件外，没有进行其他写操作。

## Root 后续

1. 审阅证据目录与有限脚本源码；
2. 若接受，由 root 通过 stdin 发送 receipt 并执行有限回放；
3. 保持预期实际读序 RED；
4. 再决定是否进入 root 独占的完整 Native 实跑、admission、ESM/BAST 和原始
   civil workflow 验证。

本轮到此停止，不继续准备或启动完整实跑。
