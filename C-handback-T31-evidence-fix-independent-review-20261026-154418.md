# T31 修复材料独立复核交回

结论：A 侧有一条源码可证的生命周期清理缺口，源码结论为 `REQUEST_CHANGES`。B 侧已审修复路径没有发现会用全案替换已知材料范围的源码缺陷。全部运行、类型、schema、界面和全卡结果均为 `NOT_RUN`，本次不能视为产品通过。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 核对五份固定快照身份，对照 A/B 修复前后源码，追踪必要调用方和状态顺序，产出来源映射与正式 findings。 |
| 目标是什么 | 判断这批修复是否新引入或仍未关闭材料竞态，尤其是已知材料范围会不会退回全案。 |
| 在等什么 | 等真实运行方执行 A 生命周期定向回归、B 独立运行回归和真机提交链路。拿到实际结果后再判断运行态。 |
| 卡在哪 | 没有停摆。按令没有运行任何产品、测试或解析工具，运行可达性与全案后果尚未实测。 |

## 源码发现

### A：提交观察点注销后，在途建批仍可写回

当前 A 快照 `dsh-ext/ui/material-batch.ts` 第 63 至 78 行建立了会话 owner 和 epoch；第 146 至 149 行登记 owner 后等待材料清单；第 186 至 194 行在 owner 仍匹配时把批次写回界面状态。第 412 至 423 行的注销路径只清批次和阻断态，没有失效在途 owner。

可复现顺序是：观察点注册；建批等待材料清单；界面 effect 清理并注销观察点；清单随后成功；旧 owner 仍匹配，批次重新写入。材料条在第 12 至 41 行只看批次状态，因此仍会显示“下一条消息默认按所选材料处理”。若界面在该窗口继续提交已有草稿，材料 prepare 钩子已不存在，B 当前第 218 至 229 行会把无记录请求当作合法无材料请求，任务可能退回全案。

这是源码可证的状态缺口。实际能否在注销后继续发送、以及是否真的触发全案，需要真机链路实测，当前没有把后果标成运行复现。

最小定向回归：注册内存提交钩子；用可控 Promise 挂住材料清单；注销观察点；再让清单成功返回。断言建批返回空、批次和阻断态为空、提交功能可用性为假。用例不需要真实案件、服务或界面。

### B：已审修复路径未发现扩围缺陷

- 正常 scoped prepare 的顺序是先写 pending 意图，再原子写 prepared 主记录，最后写 prepared 意图。主记录失行而 pending 意图存活时，只在身份、材料集合和当前版本都吻合时重建。
- prepared 主记录失行时，claim 路径失败关闭，不建任务，不退回全案。提供的回归源码把此结果定义为失败关闭，但本次未执行。
- 主记录缺失、任务编号冲突、案件或会话不吻合、意图材料冲突均失败关闭。
- release 会把仍然存活的意图写成 released tombstone；prepared、claimed 和 replay 路径没有把 released/rejected 改回材料范围。
- 无 request id，或有 request id 但主记录和独立意图都不存在时，保持合法 unscoped 兼容。该路径正是 A 生命周期缺口可能落入的兼容分支。
- 意图目录位于应用数据同一卷，文件名取请求编号哈希，内容不含材料名、路径、正文或模型输入输出。
- 单文件写入已审为校验、临时文件、文件 fsync、替换和 Windows 重试。主记录与意图之间没有跨文件事务；目录级持久化和跨进程并发未验证。

## 依据与验证

- 固定清单：`D:\Lawbeach\lawbench-coord\T31FixReviewInput-20261026-154418\manifest.json`，1768 字节，SHA-256 `6a2f8bfd2dc167641a1b7f8c314f41ab4a28e5221e10c13f58e2e8b44375b8e0`。
- 五份 current 快照的字节数和 SHA-256 全部与清单一致；A/B 原工作树中的对应文件也与快照一致。
- 正式 findings：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\FixReview-20261026-154418\findings.md`。
- 源码映射：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\FixReview-20261026-154418\source-map.json`。
- 验证状态：`NOT_RUN`。Git 写入：`NOT_PERFORMED`。

## 未做与降级

未运行 Python、Node、产品、测试、parser、AST、collector、prepare、serve、probe、GUI、HTTP、build、model 或 self-check。未执行类型检查、实际 schema 校验、界面链路或持久化故障注入。未查看真实案卷、`.env.local`、Key、Keyring、默认程序、OCR、Office 或网络。未修改产品源码，未执行 Git 写操作，未修复子模块/ACL 权限，未拆分 writer 锁。

## 非零事件与边界

保留了六次执行或写入尝试异常：两次只读 PowerShell 语法错误；一次无锁 Git 状态检查因既有子模块元数据权限拒绝；一次只读 `rg` 被误用 `bash` 拒绝；一次只读清单哈希使用了错误的 native-powershell 路径拼写；一次源映射补丁上下文未匹配。这些事件均未修改产品或 Git 状态。详细记录在 source-map 和进度文件中。

post-prepare 到实际 prompt 的间隔、queued R2 到 steer R1 的顺序仍是已知未修边界，本次没有重复列为新发现。主记录与独立意图同时丢失，或应用数据卷整体丢失，不能仅靠本批文件恢复曾经存在的材料范围。

## 下一步建议

先由真实运行方执行 A 的注销中迟到建批定向回归，再独立运行 A/B 回归和原生提交真机链路。如果 A 定向回归复现，由当前授权实现方补齐最后观察点注销时的捕获失效，再由独立方重新检查并实际跑该回归。B 的运行结论不能从本次静态审阅推导。

Response ID：当前运行器未暴露

Response log path：`D:\Lawbeach\lawbench-coord\C-handback-T31-evidence-fix-independent-review-20261026-154418.md`
