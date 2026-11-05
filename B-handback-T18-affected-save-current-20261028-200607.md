# B 线交回：T32 界面保存当前接缝有限回归

状态：`FINITE_GREEN / T18_INCOMPLETE / PACKAGING_HOLD`

正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-affected-save-current-order-20261028-200607.md`

## 结论

新受限副本的 12 项定向回归只运行一次，`12/12 PASS`：

```text
Ran 12 tests in 0.461s

OK
```

最近真实失败为 `8 PASS / 4 ERROR`；4 个错误都来自测试抽取的 `ExtractedTaskStore` 缺少 `index_for_task`，而实际 `drafts.py` 在该接缝调用真实 `tasks.index_for_task(task)`。源码反查显示调用位于比率倍数写前保护之前，故该红例不是本轮数值保护新增的产品回归。

## 本轮唯一源码改动与固定值

新增且唯一改动的源码文件：

- `service/tests/t32_document_save_current_20261028_200607.py`
- SHA-256：`61DAF4DECCF163F9F00D34876DFDCBD205E5C549F658837D13B58D1508F7D495`

固定输入与生产源码均未变：

- 固定原始测试：`0ADB566D110C16693FBB96B25BB67DD2F9EC449331C4E755D386AFE9B345F348`
- 冻结 `service/lawbench/tools/drafts.py`：`7C54C0685EDEC082CEA405E30AD08B38637BDBD1EC3AFEDEB6E3712FBAEBD0AB`
- 真实 `service/lawbench/case/task.py`：`7B6EE04BA53F45B1F7E6624D2C9BF60B122DFC68C12E26331431A84EED36BF04`
- 真实 `service/lawbench/case/request_scope.py`：`9A0BCFE70C7AEEDB05F2B6440526AE7CC10D4D3CD5C5EDD4A7DC8000680DC405`

新副本由协调目录内 30,991 字节固定原文复制而来，只增加：

- 一行新副本运行路径说明；
- 一行真实既存 `RequestScopeStore` 导入；
- 真实 `TaskStore` 方法集里的 `task_scope`、`index_for_task` 两个名字；
- 测试夹具的 `self.store.materials` 与 `self.store.scopes` 两项初始化。

原 12 个测试方法、全部断言、协议元数据写入、案件隔离、并发、回滚、副作用、API 路由、旧状态和材料夹具字节均保留。精确反向删除这些接缝后恢复输入原文；固定原始测试未触碰。

## 接缝真实性

私有 `request-scopes.json` 在每个测试的临时案件根内初始不存在。真实 `RequestScopeStore._load()` 对此返回空版本记录；种子任务没有 `request_id/request_scope`，也没有认领记录，所以真实 `task_scope()` 返回 `None`，真实 `index_for_task()` 返回夹具案件索引。

这是既有的无提交范围任务分支，不是伪造 `None` 的 lambda，也不是构造原生 UUID、R 记录或历史数据。接缝没有启动 app、默认生命周期、Materials/ingest/Retainer、配置或网络。

## 本次运行的覆盖读数

- 旧稿、旧结果和已确认成果保持字节不变；
- 运行、待定、异常及结果状态不稳定的任务均拒绝保存且无副作用；
- 跨案、未登记、缺失、非法形状来源拒绝；
- 锁内来源与任务绑定复核拒绝伪造；
- AI 已结束拒绝与 UI 独立保存路径边界保持；
- 同任务并发保存得到不同版本 2、3；
- 写入失败与元数据失败都回滚新文件且保留旧状态；
- 聊天体与未知字段契约检查通过；
- 真实 UI 路由在假状态下通过，事件循环未启动；
- 禁止产品模块加载数为 0，lifespan/network 均未启动。

运行后再次核验：上述四份固定源/测试哈希不变，仓库根无 `.t32-document-save-*` 临时目录残留。

## 证据与台账入口刷新

- 交付说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RateRatioRepair-20261028-194123\affected-current-copy.md`
- 既有根运行摘要：`D:\Lawbeach\lawbench-coord\T18AffectedSaveCurrentInput-20261028-200607\root-finite-current.json`
- 既有 5 项比率单元测试结果直接复用：`5/5 PASS`，未重跑。
- 旧固定 T32 测试未重跑；其最近真实红例仍按原样保留，不伪装成本轮通过。
- 本正式交回文件即本轮协调目录/台账入口刷新，不修改工单集文件。

## 未做与下一硬门

- 未运行实际原生模型、完整 HTTP、GUI、SSH、Key/env、DPAPI/Keyring、构建或全量测试。
- 未修改生产源码、旧测试、契约、API、来源、SDK、A 线、模型、Key 或环境。
- 未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；未拆 writer 锁。
- 普通 `git status` 因既有 `modules/dsh` 子模块目录无权限而中止；改用忽略子模块的只读状态，未修改沙箱、审批、ACL、权限或 Git 状态。该阻碍不影响本次文件交付。
- 完整 T18 尚未完成。下一硬门是主编排以本交回固定值核验后，单独运行当前实际原生模型工作流，并判读完整 T18 与全项目验证；在此之前 Gate 1 与 Packaging 均不能宣告通过。
