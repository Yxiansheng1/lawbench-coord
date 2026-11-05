# A 线 T31 启动器：两项 pre-start 静态修正交回

生成时刻：`2026-10-26 06:30:03 +08:00`  
执行令：`D:\Lawbeach\lawbench-coord\T31-launcher-static-fix-order-20261026-062714.md`

## 状态

| 类型 | 内容 |
| --- | --- |
| 做了什么 | 在允许范围内修正 `start.ps1` 的 row-id 横向缩进匹配；在 `prepare.ps1`、`start.ps1` 中把 fresh `daily-case.json` 的固定 run 哈希替换为由已校验 `casePath` 派生的规范字节身份；同步更正 README。 |
| 目标是什么 | 消除主编排已确认的两个确定性 pre-start 失败，使 fresh run 不再因插入行缩进或 run-specific marker 哈希而被错误拒绝。 |
| 在等什么 | 等主编排累计审计，并由主编排决定是否以 fresh root 执行 prepare 与 GUI 输入区动作。 |
| 卡在哪 | 本任务无交付阻碍。普通 `git status` 的嵌套 `dsh` 子模块目录权限拒绝属于已知运行器边界，已改用只读 `--ignore-submodules=all` 核对。 |

## 交回位置与 Git

- 工单：`T31-launcher-static-fix-20261026-062714`
- 分支：`line-A`
- HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- Git 状态：目标四文件均为既有 untracked 文件；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 交付目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030`
- 主说明：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

## 文件身份

| 文件 | 修改前 SHA-256 | 修改后字节 | 修改后 SHA-256 |
| --- | --- | ---: | --- |
| `prepare.ps1` | `0077ad2b8e6776433843bbc10a8f8bb6493edae93c0948c1d0f3fea000ff7af6` | 15431 | `54a6a395b6d4e1a7e7e9d463df86092c9ba15c241b4aff8de81773efde6a8e8e` |
| `start.ps1` | `e24a26332223242cfc960cfb19fd3529e32721699ce000aaba8e34ec74f86b7a` | 64448 | `0f73c39f0117d294f3e2bbf491e43e50143b9d3548ceaea4381247bed9e4def2` |
| `README.md` | `3114b7d03f21a94a35f0d7a16751bbbe116448b1938946735cb37712e584b314` | 14919 | `61d954f625b77232eb6b1a3367cdd0ecef3d750024673feb8bdbb4c82c19c0b0` |
| `stop.ps1` | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` | 7127 | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` |

三个修改文件仍保持纯 LF。`stop.ps1` 字节数与 SHA-256 均与执行令指定值一致。

## Finding 1：`ROW_COUNT_INDENT`

- 只改 `start.ps1` 中四个固定 row ID 共用的唯一性循环：
  `(?m)^[ \t]*- id: ...`。
- 仍保留 ID 精确锚定、水平空白与行尾锚定，不使用跨行通用 `\s`，且计数门槛仍为恰好 `1`；因此重复行仍会拒绝。
- 后缀行内容、disable flag、package ID 和前缀检查未改。
- 在内存中用原后缀样例静态核对：
  `session-controller=1`、`session-controller-private=1`、
  `ui-conversation=1`、`ui-conversation-private=1`。

## Finding 2：`FRESH_DAILY_MARKER_HASH`

- 两份脚本均已删除旧固定值
  `d2c368346f995bf277c6228ae94050131e62c47308d4ebfd05589537e7088363`
  及对应固定变量。
- 期望文本只由已严格校验的 `$casePath` 生成：单键 `root`、2 空格缩进、
  `ConvertTo-Json -Compress` 仅作用于路径字符串、UTF-8 no BOM、显式 LF 与尾随 LF。
- 期望 SHA-256 由上述期望 bytes 计算；实际文件另经 bytes 长度、逐字节十六进制和 SHA-256 核对。
- `prepared.json` 的 `daily_marker.sha256` 与 `daily_marker.bytes` 必须同时等于派生期望。既有 path、canonical、`service_registration=false` 及后续单键 `root` 对象检查均保留。
- 未从 manifest、实际文件或已服务 root 反向接受哈希，也未硬编码另一组时间戳或 run 哈希。
- 主编写明的 062600 纯路径样例已复算：
  SHA-256 `ca36d2920e8fe12bd6151e3260b850a02f05738ce258c7e4f5d260468c296a2e`，
  137 bytes，与执行令事实一致。此样例只用于一次静态交叉核对，未写入脚本。

## 既有证据复用与边界

- 复用主编排根复核：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-batch-gui-launcher-root-review-current.json`
  （SHA-256 `1c7d747aa2b13f89d72779adf452f78824218729ffef597791e94da1a820c116`）。
- 该复核记录 original job
  `actual01a1750b-343f-7402-8eef-7591435521a1`、
  author commands `69` / exit0 `59`、parser errors `0`，并明确
  build-green 与 B finite-green 可复用、whole T31 未通过。
- 本轮没有重跑开工、安装、调研、全量测试、author parser 或运行态验证。
- 未运行 prepare、start、stop、serve、probe、HTTP、GUI、test、tsc、Vitest、pytest、build、model、network 或 selftest。
- 未改 B 产品、本仓产品代码、native patch、frozen E50、guard、resolver、PDF、current six、source contracts、private build manifest 或 24 个固定输出。
- 未访问权限/ACL/approval/lock/全局 API/Key/.env.local/Keyring/真实案卷；未包装、安装、合并、推送或部署。
- 执行令指定的外部 `before-launcher-static-fix-20261026-062714` 快照目录在当前只读输出区不存在。受 managed 隔离与 allow-write 边界约束，未在外部目录创建快照；修改前文件身份已在上表及本运行记录中留存。

## 交回判断

两项有界静态修正已完成，允许文件之外的 dirty 内容未由本执行者改动。本轮只证明静态修正与纯派生样例一致，不证明脚本解析、fresh prepare、GUI、运行时或 T31 整体通过；这些仍由主编排累计审计和后续 fresh run 判定。
