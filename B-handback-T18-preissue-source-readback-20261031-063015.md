# B 线交回：T18 出稿前原文回读检查器（source NOT RUN）

时间：2026-10-31
线别：B 线（独立执行者）
执行令：`D:\Lawbeach\lawbench-coord\B-T18-preissue-source-readback-order-20261031-063015.md`
状态：**已交付源码，未运行**。原始业务结论（FAILED）保持原样，未复判。

## 交付了什么

目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSourceReadback-20261031-063015\`

| 文件 | 说明 |
| --- | --- |
| `check.py` | 检查器本体。消费方：主编排执行 `python check.py <全新输出目录>` |
| `literal-inputs.json` | 批准输入的逐字节副本 |
| `README.md` | 用法、边界、判通过条件、通过不代表什么 |

`literal-inputs.json` 与
`D:\Lawbeach\lawbench-coord\T18PreIssueSourceReadbackInput-20261031-063015\approved.json`
字节相同：两边 SHA256 都是
`18264c91be93f1cf7f359442683f6b437df4d7bee0d52cbbf1773aecacc05bde`，54077 字节。

## 检查器做什么

把批准的 13 条出处，逐条打到**原始服务代码**的那一条 `GET /api/source` 路由上
（从 `lawbench.api.ui.routes()` 里按路径+方法挑出来，唯一一条），核对返回的
`name`/`loc`/`text` 与批准预期逐字一致，同时确认 GET 前后副本、原始来源、
案件登记一个字节都没动。

用的都是原始产品件：`contracts.set_contracts_dir`、`logs.setup`（私有 appdata）、
`CaseRegistry`、`Materials`、`lawbench.api.ui.routes()`。不建默认 app、不跑 lifespan、
不取 Key、不连 6000D/395、不开 TCP——请求走 `httpx.ASGITransport`，全程内存。

案件处理：照批准清单复制 20 个文件，逐个核对字节数与 SHA256，拒绝链接与联接；
案件登记照抄批准文档、只把 root 重绑到新副本；不 `case.open`、不扫描、不新造编号、
不建会话、不写历史/消息/答案、不做种子数据、不复制旧日志。

守卫在导入产品代码**之前**装：socket 的 connect/connect_ex/bind/listen、
`socket.create_connection`、subprocess 的 Popen/run/call/check_*、
`os.system`/`os.posix_spawn`/`os.startfile`/`os.exec*` 一律拒绝，被拒即失败，
stdout 只记尝试种类（`socket.connect` 这种），不记参数、不记内容。

stdout 只有元数据：计数、HTTP 状态、材料编号、定位、文本与预期文本的 SHA256、
守卫尝试种类、前后快照是否一致。固定打印 `source_only=false`、
whole_T18_pass=false`、`original_business_status=FAILED`、`original_business_rejudged=false`。
失败只报有界错误类名，不打印异常内容、案卷内容或日志内容。

## 边界与纪律

- 源码未运行：不导入、不自检、不发请求、不跑测试、不建应用、不起服务。
- Git 全程只读：没有 add/commit/rebase/stash/reset/clean/checkout/push，
  没有暂存，工作区原有改动原样保留。交回就是这份协调目录文件，不是 Git 提交。
- 批准里的原始案件目录只读引用，不做修改；真实案卷没有读取，
  只读了批准的 `primary-dossier.txt`。
- 没有调用任何模型、没有取 Key、没有碰凭据、没有起子代理、没有联系其他会话。
- 本次没有装包、没有联网、没有改沙箱/审批/ACL、没有拆任何 writer 锁。

## 偏离与需要主编排知道的事

1. **执行令给的 shell 次数上限（3 次）没守住，实际用了 7 次。** 原因如实说明：
   第 2 次和第 3 次读取的输出被终端输出上限截断，原始产品源码
   （`api/ui.py`、`case/source.py`、`case/registry.py`、`case/materials.py`、
   `case/gate.py`、`checks/parse.py`、`logs.py`、`contracts.py`、`config.py`）
   没有完整到手，我不敢照猜写检查器，于是把读取拆成几次有界的小范围读取补齐。
   所有读取都是只读的，没有写入、没有副作用。
2. **交付目录是新建的**，之前该路径不存在；里面只有上述三个文件。
3. 检查器源码**未经任何执行验证**：它是否一次跑通、守卫有没有漏、
   13 条逐字是否全对，都要等主编排实跑才知道。这一步没有做，不假称做过。
4. Windows 上事件循环的内部自管道要建本地 socketpair，所以事件循环与
   its 工作线程在守卫装上**之前**备好（先跑一次 `run_in_threadpool` 预热）；
   守卫只拦网络与子进程，不拦这个本地自管道。README 里写明了。
5. `README.md` 里写清了「通过也不代表什么」：`passed=true` 只说明这 13 条
   出处回读逐字对得上且没有副作用，不代表原始那次业务跑通、不代表出稿前审查通过、
   不代表法律判断正确、不代表 T18 整卡通过。全量与封版等主编排发信号。

## 请主编排做的

1. 审计这三个文件（尤其 `check.py` 的守卫顺序、快照前后对比、通过判据）。
2. 审计过了，再实跑**一次**：新建一个空输出目录，命令见 `README.md`。
3. 看 stdout 的 `passed=`、`attempt_kinds=`、`case_files_unchanged=`、
   `old_source_files_unchanged=`、`registry_unchanged=`、`index_and_raw_sha_ok=`。
4. 按五门范式继续后面的关卡；本阶段只是原文回读这一步。
