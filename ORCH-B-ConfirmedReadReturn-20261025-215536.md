# B 线交回：已确认 Markdown GUI 输入准备

## 结论

三件准备文件和本交回件已写入指定路径，未运行、未自证 PASS。当前状态只能称
`PREPARED_ONLY / AWAITING_ROOT_REVIEW`；不能据此宣称 HTTP、GUI、Host/RPC、
模型、OCR、Word 或打包通过。

本次严格按 `ConfirmedReadOrder-20261025-215536.md` 执行。Git 全程只读，没有
add、commit、rebase、stash、reset、clean、checkout 或 push；没有更改
sandbox、审批、ACL 或任何锁，也未启动另一个 writer。

## 新文件

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\server.py`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\probe.mjs`
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\README.md`
4. `D:\Lawbeach\lawbench-coord\ORCH-B-ConfirmedReadReturn-20261025-215536.md`

目标 evidence 目录在写入前不存在，因此三件没有覆盖既有 dirty。除以上四个
路径外，本 job 没有写入产品、tests、contracts、lib、旧 server/probe、
launchers、模型或其他协调文件。旧 history 与旧 formal 未改。

## 输入与固定来源

首工具完整读取正式执行令。固定 `base-server.py` 的第一轮输出被运行器截断，
随后按其三个固定行段完整补读，全部 2,366 行已消费。已读取固定
`base-probe.mjs`、`base-README.md`、`manifest.json`、
`bootstrap-report.json` 和 `outputs-index.json`。`final-metadata.json` 的
原始大 JSON 输出在 29,557 token 处被运行器截断；本次 job 的 8 个后续 exec
额度已用尽，无法再做无价值的大表泛读，但已取得其顶层状态、请求 ledger、
cleanup、listener、lifecycle 和自然关闭等本任务相关 shape。该截断不影响
按令写出准备件，但作为证据读取残余问题在此披露。

`manifest.json` 记录的固定来源包括：

- `base-server.py`：85,379 bytes，
  `6065d8101705c55862f8516418e39d71d36d85602d307048aff74b86297a6595`
- `base-probe.mjs`：23,810 bytes，
  `ff05e287968704990497eb265e3420f09f0cf16279ed790ffd3e3166d14f194d`
- `base-README.md`：4,856 bytes，
  `546eec6995112ec367d1658c848d49eb75daf06a7cdf71657f478cb5d4d40a2e`

三个运行 JSON 只作为旧真实 shape 参考，没有被复制成新 run 元数据。

## server.py 累计 diff 边界

`server.py` 先由固定 `base-server.py` 做全文机械复制，随后只有以下修改：

- 顶层模块说明改为本入口用途；
- Firewall 新增 `confirmed_read_phase = False`；
- `_gui_snapshot_denial` 要求 GUI phase、`confirmed_read_phase`、原 ended
  snapshot 与原 `_confirm_state` 全真；
- `_policy` 在 confirmed phase 后拒绝再次 confirm；原 core 拒绝与同案
  `_claim_case` 重开路径仍在；
- 新增 `_bootstrap_native_confirmed_v1`；
- `_serve` 的唯一 bootstrap 调用点改调新 wrapper。

旧 `_bootstrap_native_v1` 函数本体、原 16 条 route、原
authentication/exact-one-header、once/claim、契约、native handler、
credential、socket、OCR、lifespan、Retainer 与有限运行边界没有改写。

新 wrapper 先调用旧 4 次 bootstrap，再读取本 run 的真实
`bootstrap-report.json`；随后通过内存 `httpx.ASGITransport(app=firewall)`
和 Host token 发起唯一一次固定 Markdown confirm。wrapper 总限时 10 秒、
不重试。成功后核对：

- 第 5 次 native ASGI 调用为 `POST /api/outputs/confirm` 且 200；
- `confirm_complete` 与原 `_confirm_state(task)` 为真；
- 原 task/result/reads/v1 的 bytes、SHA 与 mtime 前后保持；
- 成果为原 v1 的 54 bytes / 原 SHA；
- native 索引恰一条且 provenance 属于本 case/task/v1；
- 原 task finished、result cancelled、usage `model_calls: 0`、
  `tool_calls: 1`。

只有全部成功后，新 report 才更新为
`T15-confirmed-read-bootstrap-v1`、5 次 ASGI calls、输出 path/bytes/hash、
`outputs_count: 1`、`source_preserved: true`，随后置
`confirmed_read_phase = True`，再开始监听。失败路径不监听、不重试、不手写
task/result/索引。

## probe.mjs 边界

新 probe 只使用 Node 内建模块。三个必需环境值只在内存中；它只读本次 run
和磁盘 evidence，不写文件、不 spawn、不 mock、不打印 token。核对项包括：

- `PREP_DIR/runs/T33-host-*`、prepared/started/ready、完整 server SHA；
- 5 次 ASGI report shape、health 1.6、current `selection: null`；
- 本 task/result/reads/v1、54-byte 成果与唯一 native 索引；
- 任务列表返回本 task 的 v1 source path，outputs 列表与磁盘索引一致。

TCP 请求集合固定为：

- 1 次同案 `caseOpen`，正文为 path 加 `template: null`，返回同一 case；
- 11 个正确 case/session query 的 GET；
- confirm、documents-save、core tool 各一次，均要求 403；
- 错误 case query 与额外 query 各一次，均要求 403。

上述业务写尝试前后，task/result/reads/v1/成果/索引的 SHA、mtime 和成果目录
成员必须不变。没有重复旧 4 个 auth 负例或 14 个 confirm 负例，没有额外
延时或自动重开。最终检查自然 final metadata、request ledger、service log、
loop/listener/net 关闭、0 credential getter、0 Keyring、0 outbound、OCR
与 Retainer 未启动、product lifespan off，以及必要的 1 个 AnyIO worker。

summary 固定分别输出 `ASGI 5` 和实际 `TCP n`，不把 ASGI 记成 TCP，也不把
有限 TCP 请求宣称为 GUI 通过。

## README

`README.md` 准确记录了固定 Python 3.12 与 Node 绝对路径、`cwd` 为 B 线
`service`、private child env、prepare、serve 20 秒、probe 与失败判读。说明
明确 ASGI 5 是 GUI 输入，有限 TCP 请求不等同 GUI，`caseOpen` 是唯一已审
同案重开 POST 例外，准备不等于通过。作者没有执行 README 中命令。

## 未运行与阻碍

本 job 没有生成 run/data/task/result/index/history/rollout，也没有运行：

- prepare、serve、probe、HTTP、GUI；
- tests、Vitest、tsc、pytest、collect；
- parser、compile、build 或任何自测；
- 模型、OCR、PDF、Guard、Resolver、E50 或 launcher。

Git 写入不在本运行器授权内。read-only `git status --short` 曾因子模块路径
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 的
Permission denied 失败，未取得完整 status。按执行令，这不是交付阻碍；没有
尝试修锁、扩权、改审批或绕过沙箱。

当前剩余风险是：四件结论尚未经过 root 的独立静态复核与有限运行；旧
launcher 尚未固定本新 entry。后者属于下一张窄准备单，不在本单修改。
