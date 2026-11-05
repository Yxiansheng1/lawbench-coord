# 独立执行线交回：入口轮询静态返修

静态修改已落盘，等待 root 审计和复测；本次没有运行产品、探针或 GUI，不能算验收，也不能解除打包保留。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 恢复了删除后合法轮询的原始读取生命周期；重复读取继续按请求选项逐次深校验和计数。通用协议门槛与三变体/GUI 墓碑证据已拆开。 |
| 目标是什么 | 让读取入口兼容原产品生命周期，同时让有限探针保留更严格的三态覆盖；当前还差 root 的完整源码/命令/setup 审计、一次新的 20 秒有限运行和后续真实 GUI 轮询验收。 |
| 在等什么 | 等 root 审完固定源码和实际命令，并给出一次新有限运行的成功、失败或 fixture 红信号；信号到达后才进入真实 GUI 轮询验证。 |
| 卡在哪 | 本次静态工作没有被卡住。普通 Git 状态查询被子模块目录权限拒绝，但忽略子模块的只读查询成功，原有 dirty 改动已保全；没有尝试修复权限、锁或 Git 索引。 |

决策完成度四态（按当前工作树实读）：已合流可见 0；在飞 1；已裁未派工 0；候 owner 0。这里的 1 只表示本次静态返修存在于该可写工作树、等待 root 审计，不代表已验收。

## 依据与验证

- 新入口：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\server.py`，141080 字节，SHA-256 `CCE387F4B5492A0BE2B10EF1E99C2687872A60A826F8BDFAAB5ED62FFC8FAD79`。
- 入口说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\README.md`，10970 字节，SHA-256 `B4075A319744AFF4F192422549E0AB18C1A6F6D6C1084F63DAD9FF50D0217DC1`。
- 静态返修说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\entry-polling-fix-20261027-133508.md`，3157 字节，SHA-256 `B1AFBD6C8CE6717B841AA4CD2CF1D0A0D4CABB609C7E81C7D507622400882592`。
- 冻结探针：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\probe.mjs`，22165 字节，SHA-256 `B1B3FA29D57AD1B727DC04C21804DCB117B0D6EFB970D94B29A9D2CF3B62CB92`，与执行令给定值逐字一致，本次未改。
- 文本复核确认：`_claim_get` 不再按选项桶拒绝重复读取，仍保留原 `MAX_MATERIAL_LISTS = 16`；`READ_INFLIGHT`、查询解析、请求级选项、认证、登记、路径、phase 和任务目录守卫仍在。
- 文本复核确认：`_complete_get` 接受删除后等待态和 `done` 态，两种状态都先调用 `_validate_public_materials`；首份合法删除后响应进入 `done`，后续响应继续累计。`post_remove_list` 只接收 default。
- 文本复核确认：通用 `protocol_complete` 保留 setup、单次 remove、raw 墓碑、原件/派生文本、登记、来源、引用和索引条件，并只要求至少一份实际校验过的删除后响应；没有要求 pre/post 三变体齐全。
- 文本复核确认：`all_list_variants_verified` 只由实际 pre/post 三桶计算，删除后 default/false 必须各 2 行、true 必须 3 行；`gui_optin_tombstone_verified` 只由实际删除后 true 3 行桶计算。
- 探针静态复核确认：原有 pre/post 三态、6 次原生读取、负向查询不进入原生层、三份精确载荷和来源清理断言仍在，没有跳过、放宽或伪造。
- 只读 Git 状态：`git status --short --ignore-submodules=all` 成功，原工作树中的 dirty 项仍在；普通 `git status --short` 因子模块目录权限失败。

## 写入面

- 修改 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\server.py`。
- 修改 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\README.md`。
- 新建 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\entry-polling-fix-20261027-133508.md`。
- 新建本交回件 `D:\Lawbeach\lawbench-coord\B-handback-T32-entry-polling-fix-20261027-133508.md`。
- 没有其他产品、契约、skill、文档、源清单、旧 evidence、旧 formal、旧 status 或协调目录文件写入。
- 没有执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push，也没有改 ACL、锁、沙箱、审批、API 或设置。

## 实际命令与结果

以下命令均由正式指定的原生 PowerShell 执行，使用 `login=false`；没有使用 bash、cmd 或短壳。

1. 读取正式执行令：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T32-entry-polling-fix-order-20261027-133508.md' -Raw`，exit 0。
2. 普通 Git 状态：`git status --short`，exit 1；根因是 `D:\Lawbeach\lawbench-main` 的工作树元数据指向的 `dsh` 子模块目录拒绝进入，`git status --porcelain=2` 在该子模块失败。
3. 列目标目录：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809' -Force | Select-Object Name,Length,LastWriteTimeUtc`，exit 0。
4. 初次哈希猜测：`Get-FileHash ...\probe-frozen.py -Algorithm SHA256`，exit 1，文件不存在；随后按实际文件名核对 `probe.mjs`。
5. 递归列目标证据目录：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32' -Force -Recurse | Select-Object FullName,Length,LastWriteTimeUtc`，exit 0；输出被截断，但没有执行任何写入。
6. 探针哈希：`Get-FileHash -LiteralPath ...\probe.mjs -Algorithm SHA256`，exit 0，结果与执行令一致。
7. 忽略子模块的只读 Git 状态：`git status --short --ignore-submodules=all`，exit 0；完整列出既有 dirty 项。
8. 入口说明读取：`Get-Content -LiteralPath ...\README.md -Raw`，以及 `Get-Content ... | Select-Object -First 80`，exit 0。
9. 新入口方法定位与阅读：`rg` 查找 `_claim_get`、`_complete_get`、`_validate_public_materials`、`protocol_complete`、选项桶和计数；随后按区间读取 `server.py` 的模块头、初始化、校验、claim/complete 和 evidence 方法，exit 0。
10. 旧审入口对照：`rg` 查找 `_claim_get`、`_complete_get`、`protocol_complete`、选项桶和计数；随后按区间读取对应方法，确认原始上限和 `done` 生命周期，exit 0。
11. 探针对照：`rg -n -C ... 'protocol_complete|pre_remove_list|post_remove_list|case/open|CASE_OPEN|third|403' ...\probe.mjs`，exit 0；仅读取，没有执行 Node。
12. 新入口复核：`rg` 检查 `phase = "done"`、`await_materials_after_remove`、`MATERIALS_LIST_REPLAY`、`MATERIALS_LIST_LIMIT`，并读取 `_complete_end` 上下文，exit 0；确认材料入口没有新增完成路径。
13. 哈希与大小复核：`Get-FileHash` 和 `Get-Item` 读取 `server.py`、`README.md`、`probe.mjs`、返修说明，exit 0。
14. 最终文本检查：`rg` 检查静态返修状态、服务器摘要、探针摘要、两个新增布尔值、原读取上限和说明章节，exit 0。
15. 汇报纪律读取：按本地正式报告 skill 和其指定的人话写作 skill，读取对应 `SKILL.md`，exit 0。
16. 有一次 `rg` 最终行号查询因 PowerShell 双引号转义导致正则解析错误，exit 1；改用单引号重跑，exit 0。另有一次工具参数在调用层因重复 `shell` 字段被拒绝，没有启动任何 shell 命令。

## 未做与降级

- 没有运行 Python、Node、解析器、AST、导入、Vitest、TypeScript、pytest、测试收集、构建、prepare、serve、probe、HTTP、GUI、模型、OCR、安装或外部网络。
- 没有重建新构建，没有重新安装，没有重演旧调研或全量测试，没有修改或重跑旧探针。
- 没有复用旧运行结论作为本次通过证据；只复用未变的探针字节和旧审入口作为静态对照。
- 没有联系其他聊天，没有更换 API，没有把静态检查升格成运行时通过。
- 工作树普通 Git 状态仍受子模块权限限制；这是只读核验的已知阻碍，不影响本次四个目标文件的静态交回，也不应通过改锁、改权限或 Git 写入处理。

## 下一步建议

当前处境是“静态返修已交回，运行时仍未验证”。root 应先完整审计入口差异、固定源码、setup/cleanup 和本文件的实际命令记录；审计通过后执行一次不超过 20 秒的新有限 probe。有限 probe 给出新的成功或真实失败信号后，再安排 current-runtime GUI 的 true 轮询验收。当前不需要 owner 做额外操作。

Response ID: `B-handback-T32-entry-polling-fix-20261027-133508`
Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T32-entry-polling-fix-20261027-133508.md`
