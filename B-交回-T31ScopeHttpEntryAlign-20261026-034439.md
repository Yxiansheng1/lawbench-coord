# B 交回：T31 HTTP 入口精确对齐与缺失交回

## 1. 结论

本次已完成执行令限定的源码对齐并形成本正式交回件。范围仅为 T31
`ScopeHttpEntry-20261026-031523` 入口源码与 README，以及本文件；未修改 B
产品、公开契约、源码 pin、权限、审批、沙箱或 writer 锁。

对齐后的两个偏差均已闭合：

1. 运行根名称、命令行帮助和 README 已恢复为
   `^T33-host-[0-9]{8}-[0-9]{6}$` / `T33-host-YYYYMMDD-HHMMSS`。
2. 固定 JPEG fixture 的常量、导入、复制函数、prepare 复制、manifest 字段、
   serve 前身份核对和 serve 收尾身份核对已恢复；新三份 TXT 仍仅位于
   `input\ready\scope-source\`，import 仍只接收该目录，不接收 JPEG。

当前状态是 `SOURCE_ALIGNED_NOT_RUN`。这只是所列源码与静态文本边界的审计结果，
不是 prepare PASS、HTTP PASS、GUI PASS、模型 PASS 或完整 T31 验收。

## 2. 基线与最终产物

- B 线 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 原始完整执行令：
  `D:\Lawbeach\lawbench-coord\T31ScopeHttpEntryOrder-20261026-031523.md`
- 原基座：
  `D:\Lawbeach\lawbench-coord\T31ScopeHttpInput-20261026-031523\server-base.py`
- 原基座 SHA-256：
  `2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd`
- 源码 pin SHA-256：
  `7c3cf7cda3632f2bb1f05fa69bdebb5b1fa40806bf710bec4e6293d864bdb18e`
- 修复前 `server.py` SHA-256：
  `a5b5f513551490bae850a2003423c19c68559cddd7a1ae772fa1586a0fb44be1`
- 修复前 `README.md` SHA-256：
  `84066fd1b1d4d9075bad3183263a48ea6750611f9ba0d346fbf4e3a46bfe9e96`
- 修复后 `server.py` SHA-256：
  `0938e78ccfc3fa73d1e03cec99c5cdc6374c0abc78601a20c6662d22814ebf11`
- 修复后 `README.md` SHA-256：
  `ea69d2a62262b79e934dc1da280868da110163ebd0f2ea16b9324e456251def0`

两个允许修改的文件：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\README.md`

修复前快照已存在且与本次接手时的两个文件哈希一致：

- `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-before-http-continuation-20261026-034439\server.py`
- `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-before-http-continuation-20261026-034439\README.md`

## 3. 实际代码改动

`server.py` 改动仅限以下闭环：

- 恢复 `import shutil`。
- 恢复基座 `FIXTURE` 绝对路径、`FIXTURE_BYTES = 47379` 和
  SHA-256 `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`。
- 将 `RUN_NAME` 恢复为 `^T33-host-[0-9]{8}-[0-9]{6}$`，命令行 `--root` 帮助
  恢复为 `new T33-host-YYYYMMDD-HHMMSS direct child of this preparation's runs`。
- 恢复基座 `_copy_fixture`；其函数文本与基座逐字一致。
- prepare 在全新 `input\ready\` 中复制 JPEG，并在 manifest 写回基座 `fixture`
  来源/副本身份字段；随后创建且只创建 `scope-source\` 下三份固定 TXT。
- `_scope_source_manifest` 的 ready 顶层集合改为恰好
  `转账截图.jpg` 与 `scope-source` 两项；scope-source 自身仍恰好三份普通小 TXT。
- `_verify_prepared` 恢复 fixture manifest、来源和副本的大小/SHA-256 核对。
- `ready.json` 恢复 `fixture_path`、`fixture_bytes`、`fixture_sha256`，同时保留
  scope-source 元数据。
- serve 收尾分别核对 JPEG 来源、JPEG 副本，以及 scope-source 三份 TXT；最终
  元数据写 `fixture_source_unchanged`、`fixture_copy`、`fixture_copy_unchanged`。
- JPEG 只用于身份核对，未进入 import、材料范围、OCR、Office 或子进程。
- README 恢复 T33 运行名，并改为事实描述：JPEG 复制后只核对字节与哈希，不作为
  import 输入，不进入材料范围。

未增加任何额外 source、fixture 或运行时文件。

## 4. 保留的业务、安全与协议边界

静态对比确认以下边界相对修复前快照保持不变：

- `Guard`、`_install_guards`、`_install_keyring`、`_scrub_env`、
  `_assert_wiring`、`_started`、`_listener`、`_closed`、`_host_values`。
- `Firewall` 类及 `ROUTES` 集合。
- 精确一个 `Authorization` 头、常量时间比较、失败前不消耗 claims，以及 wrapper
  认证后继续执行 native middleware 认证。
- 请求体/查询严格键、相位、一次性计数、原子快照、只读文件身份和固定四工具顺序。
- module-level `_guard_reply`；没有 `self._guard_reply`。
- `case/open`、单次 `materials/import`、scope prepare 同 R 重放、task begin 同 R
  重放、context、四工具和 task end 的既有断言均未改。
- 第四工具的原生 `MATERIAL_NOT_FOUND` 仍是预期业务失败路径，没有被改成 wrapper
  伪造成功或 guard 拒绝。
- 公开 schema 与 reviewed source pins 未改；B 产品源码未改。

最后一次只读静态审计还确认：

- ready 顶层恰好 fixture 加 scope-source 两项。
- import 的 `paths` 仍严格等于 `[str(ready / SCOPE_SOURCE_NAME)]`。
- prepare、serve 起点和 serve 收尾均包含 fixture/TXT 身份核对。
- `RUN_NAME` 接受 `T33-host-20261026-034439`，旧的 T31-scope 运行帮助已不存在。
- 两个证据文件均为 UTF-8 无 BOM、LF，无 NUL。

## 5. 运行状态与证据边界

本次没有运行 `--prepare`、`--serve`、测试、探针、HTTP、GUI、模型、构建或作者
自验解析器。`ScopeHttpEntry-20261026-031523\runs` 不存在，故没有 T31 run root、
native HTTP 响应、final metadata 或工具结果可交。

唯一验证是上述源码文本、哈希、文件输入边界和只读 diff 审计。A 线消费者生成的
native 协议事实仍待 root 执行完整累计最终审计后，再做一次有限 fresh HTTP；该
后续运行及其结论不属于本交回件。

## 6. Git、过程偏差与遗留

Git 全程只读。没有执行 add、commit、rebase、stash、reset、clean、checkout 或
push，也没有修改 index、锁、ACL、审批或沙箱。HEAD 读取为约定基线
`dc56a93be4b07dbe7a48863e3135351659817fb5`。

递归 `git status` 因工作树内 `dsh` 子模块访问拒绝而未完成；随后仅用
`--ignore-submodules=all` 做只读状态枚举。仓库原有大量 tracked/untracked dirty
内容仍然保留，未做清理或覆盖。Git 写入不在本运行器授权内，不构成源码对齐的交付
阻碍，也未尝试修复。

历史事实：`20261026-031523` 的上一次 job 实际已完成并 exit 0，共 94 条命令、
82 条成功；`server.py` 与 `README.md` 已写出，但未写正式交回件，本 job 未重开该
job。其证据仍位于原 `ScopeHttpEntry-20261026-031523` 路径。

过程偏差：有一次只读 `rg` 调用误填非 PowerShell shell，宿主返回
`Bash/E_ACCESS_DENIED`，命令未执行、未改状态；其余命令均使用指定的绝对原生
`pwsh.exe`、`login=false`。

未决事项仅为 root 后续完整累计静态审计与有限 fresh native HTTP；当前不得据此宣称
prepare、HTTP、GUI、模型或完整 T31 通过。
