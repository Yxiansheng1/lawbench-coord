# B 线交回：T31 批次入口首因诊断

## 结论

已完成执行令允许的有界修改：仅在 `Firewall._record` 中增加可选、纯元数据的
`protocol_failure` 字段，并在 README 末尾追加本轮已观测事实。静态验证通过，结果为
`PASS_STATIC_DIAGNOSTIC_ENTRY_ONLY`。

本轮没有重跑失败的有限 26 项协议，也没有运行 GUI、HTTP、服务、探针、解析器、测试、
构建或 prepare。实际首个失败防护码仍未获得，不能据此推断产品或 API 原因，T31 与
打包状态均保持未通过 / HOLD。

## 交付内容

| 文件 | 修改前 | 修改后 |
|---|---|---|
| `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py` | `109968` 字节 / `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89` | `110075` 字节 / `664cb78ce373fad79ba1b80aca99e55ff51cd46a817072dcfd58a3f235097826` |
| `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\README.md` | `6849` 字节 / `6d3f2c3a61525893e51c0147fab14ab644307388dbb8f1c193a3f5421f147c7b` | `8363` 字节 / `5668a06f0b74ea8a818662fec035974178bb17a3cb73dc136f5f9f075ef5edaa` |
| `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\probe.mjs` | `20697` 字节 / `dd9a58dbb66e9e83b2e0d0b06d79ea0a2208fc02e140f812ef73e7f4db7aeb0f` | 未改，哈希完全相同 |

`server.py` 只新增以下两行，位置在新记录追加到 `self.records` 之前：

```python
if self.failure_code is not None:
    item["protocol_failure"] = self.failure_code
```

原五个账本字段
`method`、`path`、`status`、`disposition`、`elapsed_ms` 及字段顺序不变。
`protocol_failure` 仅在既有固定失败码非空时写入；正常请求仍是原五字段。

## 既有事实复用

- `runs\T33-host-20261026-073954` 的真实 GUI 运行中，原生目录选择成功；
  `POST /api/materials/import` 一次返回 200，耗时 108 ms；原生索引含
  M0001–M0003，引用为 R01。
- 随后 `GET /api/materials` 返回 403 `RUN_FAILED`，连续三次 `GET /health`
  也返回 403 `RUN_FAILED`。此前 `GET /api/case/recent` 的
  `READ_INFLIGHT` 403 发生在开案前，和本次失败分开保留。
- 原 `requests.ndjson` 恰为 72 条，字段集合只有
  `method,path,status,disposition,elapsed_ms`；没有 `protocol_failure`。
- 原索引三份合成 TXT 未变：
  `scope-in.txt` 为
  `4d9e4eb195fb86d06512f7595739a7b08adb3e800994e1aafa8646c08d837140`，
  `scope-out.txt` 为
  `5c9b2740bb117076db13c45d4960b11911079a79ae36b38342047a60aca59510`，
  `scope-third.txt` 为
  `103da2317f4bee98ae3cf0bb84635b306ec78f304a18a9bdf1589ef0e245dbc6`。
- A 线静态准入回执确认私有构建 `073502` 的 manifest 为
  `52ebf5cfb50fbe863c4fd183744d374b537693dbdbd387f7425dabdbff0cce42`，
  client 为
  `5eb66c09e3c3f819b0f98382778c5e901e3b6fcee92b932a9a9c00e39d044859`；
  A 交回给出的 launcher `start.ps1` 精确 SHA-256 为
  `691aa3ed150cb7a72ba889f6362b7362a2a39b91e3a061b4ff66aa1e1169f367`。

## 静态验证

- `before\server.py`、`before\probe.mjs`、`before\README.md` 已存在且未被覆盖。
  开工时当前 `server.py` 和 `probe.mjs` 均与快照逐字节相等。
- 删除新增的 107 字节两行后，`server.py` 与 before 快照逐字节相等。
- before 与修改后均可由 Python AST 解析；规范化删除新增两行后，整个模块 AST dump
  与 before 相同。函数名集合及数量均为 107，未改动其他函数、setup、cleanup、
  环境或 core guard。
- AST 断言确认两行位于 `Firewall._record` 的 `self.lock` 块内，条件为
  `self.failure_code is not None`，写入键仅为 `protocol_failure`，值仅为既有
  `self.failure_code`。
- README 的 6849 字节原内容是新文件的精确前缀；只追加 1514 字节、21 行。
- 两文件均为 UTF-8 无 BOM、纯 LF；`server.py` 只新增两个 LF，README 只新增 21 个 LF。
- `diff --check` 没有报告空白错误；退出码 1 只因两份文件确有预期差异。
- 目标目录顶层仍只有 `server.py`、`probe.mjs`、`README.md` 三个文件，没有新增路由、
  文件、运行产物或日志。

## Git 与阻碍记录

- 分支 `line-B`，HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`；工作树原有大量
  dirty/untracked 内容已原样保全。
- 首次全树 `git status --short --branch` 在子模块 `dsh` 返回已有路径权限拒绝；
  改用只读 `--ignore-submodules=all` 完成外层核对，没有处理权限、ACL 或锁。
- 本轮目标文件相对 Git 仍为未跟踪文件，索引未变化。没有 add、commit、rebase、
  stash、reset、clean、checkout、push 或 merge，因此没有提交 SHA，也没有暂存。
- 一次 AST 检查命令漏传 PowerShell 的 `$code` 变量，Python 只返回“缺少 -c 参数”，
  未执行检查；随后用同一只读断言重跑通过。一次换行统计命令有 PowerShell 管道语法
  错误，未读写文件；简化后重跑通过。
- 没有读取或复制 DSH 会话缓存内容，没有访问真实案卷、模型、凭据、网络或全局设置；
  没有更改沙箱、审批、ACL、权限或 writer 锁。

## 未做与下一步

未运行 `--prepare`、`--serve`、`probe.mjs`、GUI、HTTP、模型、网络、解析器、测试、
构建、安装或自测；未修改产品源码、配置、fixtures、launcher、契约或安全断言。

下一步需由 root 先对完整累计静态差异作出放行判断，再用 A 线已核 launcher 的新鲜运行根
做一次真实 GUI 首次导入；首个拒绝请求的账本记录应带 `protocol_failure`。该实跑未在
B 线执行，不能把本交回件替代真实首因证据。
