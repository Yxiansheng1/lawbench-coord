# A 线交回：T31 启动器 settings 字段形状纠正

## 任务身份

- 执行令：`D:\Lawbeach\lawbench-coord\T31-launcher-settings-shape-order-20261026-064627.md`
- 执行线：A
- 日期：2026-10-26
- 结论：允许范围内的 8 处字段引用已纠正，README 已更新，正式交回已落盘。
- 运行结论：未验证；本次不得声明 prepare、start、GUI 或 T31 运行时通过。

## 前置事实与核验

已使用执行令指定的纠正前基线：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-settings-shape-20261026-064627`

开始修改前，该基线中的 `prepare.ps1`、`start.ps1`、`stop.ps1`、`README.md`
四文件与工作目录当前文件逐项 SHA-256 一致。既有 dirty 内容均未清理、暂存、
提交或改写。

实际 B 入口
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`
的 `_settings()` 在第 252-255 行返回顶层 `"servers": dict(SERVERS)`；
第 451-455 行只在 `prepared.json` 的 manifest `settings` 元数据中写
`"fixed_servers": dict(SERVERS)`。因此本次只纠正从实际 settings JSON 读取的
`$settings.fixed_servers`，没有改 manifest 的 `fixed_servers` 元数据语义。

执行令同时记录了实际 root prepare 的先前事实：原生 `--prepare` 已写出 fresh
synthetic inputs，包装脚本随后因不存在的 `fixed_servers` 属性退出。对应证据根为
`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31BatchGui-root-20261026-063352`。
本次没有重演该准备过程。

## 完整前后身份

路径均相对于
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030`。

| 文件 | 修改前字节 | 修改后字节 | 修改前 SHA-256 | 修改后 SHA-256 |
| --- | ---: | ---: | --- | --- |
| `prepare.ps1` | 15431 | 15407 | `54a6a395b6d4e1a7e7e9d463df86092c9ba15c241b4aff8de81773efde6a8e8e` | `44cf57da9ed1532415b84e0195fd22408c281cb452a0ebea0ad79dff2d924c70` |
| `start.ps1` | 75457 | 75433 | `c93c9294a024a46f8d377f0b30cf2c13ef873f949f1bf75c07785a5927e84400` | `762cd49129670664adf31a0a9d47a2f1e1779219e222f2fd3f8f69806bb1405e` |
| `stop.ps1` | 7127 | 7127 | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` |
| `README.md` | 18793 | 20684 | `18ad427afd3728e79311e10db7cf52685e783675759cf1c5f7ec647492b18e58` | `e83e1aab9e2368ea7492729404950846a7ed7129af799ea40795e7dd07b1beb9` |

## 实际修改

`prepare.ps1` 当前第 284-287 行和 `start.ps1` 当前第 350-353 行，各将以下四个
读取路径中的 `$settings.fixed_servers` 改为 `$settings.servers`：

1. `llm_base_url`
2. `llm_alt_base_url`
3. `prep_base_url`
4. `prep_alt_base_url`

合计恰为 8 处文本替换，即每份脚本 4 处。四条预期 loopback URL 保持原字节：

- `http://127.0.0.1:65001/v1`
- `http://127.0.0.1:65003/v1`
- `http://127.0.0.1:65002`
- `http://127.0.0.1:65004`

字节级静态复核以指定 before 文件为输入，只将
`$settings.fixed_servers` 替换为 `$settings.servers`，生成结果与两份当前脚本逐字节
完全一致。修改后 `$settings.fixed_servers` 残留为 0，`$settings.servers` 各 4 处；
两份脚本长度均恰好减少 24 字节。

`stop.ps1` 未改，哈希保持冻结值。`prepare.ps1` 和 `start.ps1` 的 settings 固定
SHA、空外部 provider、四条 loopback URL，以及 daily canonical bytes/rows/profile/
runtime shim/24 pins/18 legacy pins/once/auth/phase/600s/exact PID cleanup 均未改。

README 只做两项允许修改：

1. 将已过期的“`prepare.ps1` 保持原始字节”及旧 SHA 身份改为当前
   `44cf57da9ed1532415b84e0195fd22408c281cb452a0ebea0ad79dff2d924c70`。
2. 追加实际 settings 字段形状纠正、四 URL 不变、manifest 元数据边界、前后
   脚本哈希和未运行事实。

## 验证与禁区

本次只执行了只读文件读取、哈希、目标字符串计数/上下文核对、逐字节期望变换比较，
以及只读 Git 状态查询。

未执行 parser、prepare、start、stop、serve、probe、test、Vitest、tsc、pytest、
collect、build、GUI、HTTP、model、network 或 selftest；未安装、未启用 loader、
globalAPI、Keyring，未使用真实案卷，未修改权限/ACL/sandbox/approval/locks，未
运行 package/installer/merge/push/deploy/Actions。没有更换 API，也没有联系其他聊天。

完整 `git status --short` 因仓库子模块 `dsh` 的工作树元数据权限被拒而失败：

`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`

未尝试修复该阻碍。随后以 `git status --short --ignore-submodules=all` 只读核对，
确认既有 dirty 范围仍在并原样保全。按执行令，Git 严格只读：未暂存、未提交、未
rebase、未 stash、未 reset、未 clean、未 checkout、未 push。因此没有可交回的
提交 SHA；协调目录中的本文件即正式交回。

## 未证明事项

本次证明的是允许文件中的目标字节形状已纠正，且允许范围外脚本字节未改。它不证明
PowerShell 解析、fresh prepare、启动、GUI 输入区行为、模型/API 路由或整体 T31
适用于运行时。上述运行时结论仍须由主编排按执行令在其授权范围内另行验证。
