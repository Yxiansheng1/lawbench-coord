# 线 B 交回：T37 混合材料摘要形状

## 状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在唯一指定入口删除了内部引用摘要中未使用的 `file_name`，并写出本件与技术说明。 |
| 目标是什么 | 消除 root 运行前的摘要键矛盾；实际有限运行和 GUI 仍留给 root 与 A 的后续门。 |
| 在等什么 | 等 root 读取本件及固定 SHA，复核严格反向证据，再用原冻结探针做一次新的有限运行。 |
| 卡在哪 | 本次没有运行阻塞；顶层 Git 状态受 `dsh` 子模块权限拒绝，按令只记录并改用忽略子模块的只读查询。 |

当前标记为 `STATIC_FIXTURE_GRAY`、`RUNTIME_NOT_RUN`、`PREPARED_FOR_ROOT_REVIEW`、`GUI_NOT_VERIFIED`。作者运行时调用数为 0。Packaging 为 `HOLD`，Gate 1 为 `INCOMPLETE`。

## 依据与验证

- 修正后入口：151219 字节，SHA-256 `18366a1c6b62bb62b2df50108bf6b82365bcf5c239eea15caa600e17b93ed808`。
- 修正前入口：151259 字节，SHA-256 `7d4a45196746b6f29ea1877de32ab2652767ad9b4c20d7cc63f4a9f533584eb6`。
- 原冻结探针：31434 字节，SHA-256 `f18e06f0febb040058057759df97acdff1ff4758428d27a28d462b690d93d1de`。
- 历史 README：10059 字节，SHA-256 `f44f35adde5bf3a2b59e206f37813a4ca9a3527ec391468d567a8d1168d4db6d`，原字节保留。
- 上一份正式交回件：7259 字节，SHA-256 `2e48c026b5ec11ceee14d76a700a38292dadf6593a07cafe7f2219d658e0c405`，只读参照。
- 固定源码清单：53547 字节，SHA-256 `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`。
- 技术说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\summary-shape-20261027-170531.md`。

唯一差异位于 `Firewall._native_refs` 的 `found[ref_id]` 摘要，删除一行 `"file_name": file_name,`。旧块 140 字节并精确出现 1 次；新块 100 字节，替换前不存在。修正后差值为 40 字节，文件仍为纯 LF。

把新块在内存中还原成旧块后，完整源码与 `server-before.py` 逐字节相等，字节数回到 151259，SHA 回到修正前值。该严格反向校验证明其他源码字节未变，包括原始引用的 `kind/path/status/added/checked` guard、文件名派生与校验、材料 `origin`、案件副本、阶段、认证、移除、查询和清理断言。产品 `refs.json` 形状与冻结精确断言未改。

## 命令与写入面

本次使用指定 PowerShell，`login=false`，未使用 Bash。37 条实际 shell 命令已按执行顺序逐项写入技术说明，覆盖读取正式令和写作规程、目录与文本读取、哈希、`rg`、`Select-String`、只读 Git 查询、内存严格反向校验及 `git diff --no-index`。运行时命令为 0。

非零命令共 3 条：顶层 Git 状态因 `dsh` 子模块权限拒绝退出 1，未修复；一次内嵌索引查询因 PowerShell 管道语法错误退出 1，未写文件；`git diff --no-index` 因存在预期差异退出 1，并只显示删除一行。前两项的后续只读核对均成功。

写入面仅三项：修改指定入口 `server.py`；新增技术说明；新增本交回件。没有写产品源码、旧证据、Git 索引或其他工作树。Git 未 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存。

## 未做与降级

- 没有实际 prepare、serve、探针、HTTP、GUI、Office、OCR、模型、构建或测试运行。
- 没有 HTTP 200、真实墓碑、请求账、截图或 GUI 证据。
- 没有产品缺陷或 HTTP 红样断言；本次只关闭 fixture 元数据形状矛盾。
- 没有 Git 提交 SHA；交回以协调目录文件落盘为准。

## 下一步

root 按累计口径复核全部剩余源码和命令，确认严格反向字节相等，再以 `18366a1c6b62bb62b2df50108bf6b82365bcf5c239eea15caa600e17b93ed808` 冻结入口，使用同一个 `f18e06f0febb040058057759df97acdff1ff4758428d27a28d462b690d93d1de` 探针和全部业务断言做一次新的有限运行。A 的 GUI 展示及任何 GUI 移除仍需各自门确认；当前不需要 owner 动作。

删减轮:读者 2 / 槽位 1 / 半句 3 / 重复 1 / 过程 1 / 黑名单 0

Response ID: `T37-mixed-summary-shape-20261027-170531-B`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T37-mixed-summary-shape-20261027-170531.md`
