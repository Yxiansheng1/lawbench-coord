# B 线交回：T31 session guard 静态校正

## 状态

`STATIC_CORRECTION_COMPLETE / AUTHOR_EXECUTION_NOT_RUN / ROOT_VALIDATION_REQUIRED`

只完成执行令指定的 session guard 源码校正、有限探针修正和新交回件。作者没有运行
prepare、serve、probe、GUI、HTTP、构建、Vitest、tsc、pytest、collect、解析器、
selftest、模型、API 或安装。本交回不构成 HTTP、GUI、整项 T31、打包或生产验收。

## 基线与既有证据

- B worktree：`D:\Lawbeach\lawbench-B`
- 分支：`line-B`
- HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 校正前目录与快照逐字节一致：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31BatchGuiEntry-20261026-044214\before-session-guard-fix-20261026-051016`
- 校正前 `server.py` SHA-256：
  `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`
- 校正前 `probe.mjs` SHA-256：
  `35386a57004f919e50c3f438ec61e63f78cd2a6b9d5aea8980e9ebafa5a225cb`
- 校正前 `README.md` SHA-256：
  `c04b2a1628d68011e9b8d9cc242a6c03edf12d642cecafdf3c1f33e936b522f3`
- 准备基座
  `docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py` SHA-256：
  `0938e78ccfc3fa73d1e03cec99c5cdc6374c0abc78601a20c6662d22814ebf11`
- 11 个 GET 协议来源
  `docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py` SHA-256：
  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`
- source pins
  `D:\Lawbeach\lawbench-coord\T31ScopeHttpInput-20261026-031523\reviewed-source-pins.json`
  SHA-256：
  `7c3cf7cda3632f2bb1f05fa69bdebb5b1fa40806bf710bec4e6293d864bdb18e`

准备、验证、安全环境、密钥护栏、网络护栏、监听器和清理相关函数
`_prepare`、`_verify_prepared`、`_scrub_env`、`_install_keyring`、
`_install_guards`、`_assert_wiring`、`_host_values`、`_serve_checked`、
`_prepare_checked` 与 Scope 基座对应函数的文本完全相同。既有 Fix JPEG、三份 TXT
目录、设置、日常案件标记、Host 环境、Keyring、Guard、lifespan off、OCR/Retainer、
Net、日志和清理边界没有改。

## 精确修改

- `server.py`：仅修 `Firewall._claim_get` 的 `/api/task/current` 分支。
  保留原来的单值查询和 registry/no-task 检查，在其前增加
  `REQUEST_ID.fullmatch(session_id) is None`。畸形值仍返回原有
  `SESSION_ID_QUERY_REQUIRED`，且在 registry/task-dir 检查、`read_counts`
  更新、inflight 变化和 native app 委托前返回。
- `probe.mjs`：增加
  `GET /api/task/current?session_id=not-a-uuid` 的 403
  `SESSION_ID_QUERY_REQUIRED` 断言。原有固定 UUID4
  `11111111-1111-4111-8111-111111111111` 的正例仍紧随其后，要求 HTTP 200 和
  `{"selection":null}`。其余原断言未改。
- `README.md`：`task/current` 的约束由“单个非空值”改为“单个 UUID4”；同步更新
  `server.py`、`probe.mjs` 的校验和。

没有新增公共字段、schema、路由、任务或 session 文件，也没有绑定探针的固定 UUID。
认证、exact-one、路由、once/claims、phase、锁、限制、source pins、setup、写入和
清理逻辑均未改。Materials/RefRegistry 的成功写入与身份断言没有按推测修改。

## 纯静态核对

相对校正前快照：

- `server.py`：`1` 行新增、`1` 行删除，只有上述分支。
- `probe.mjs`：`7` 行新增、`0` 行删除，只有畸形 session 负例。
- `README.md`：`4` 行新增、`4` 行删除，只有 UUID4 措辞和两个校验和。
- 目标目录仍只有 `server.py`、`probe.mjs`、`README.md` 三个普通文件。

本次未运行探针，因此下列是待 root 验证的预期行为，不是实跑通过声明：

- `session_id=not-a-uuid` -> HTTP 403、`SESSION_ID_QUERY_REQUIRED`。
- `session_id=11111111-1111-4111-8111-111111111111` -> HTTP 200、
  `{"selection":null}`。

## 交付哈希

- `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`
  SHA-256：
  `4492a09d8ddc5db067f93f731fd4ea0ecf20e17aedb0c62b7df9f7dfb25d7984`
- `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\probe.mjs`
  SHA-256：
  `e0a850c450fbe68957d44bf85ac9cb4d71cde3a85b4e0da418d3e1e1dd830c83`
- `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\README.md`
  SHA-256：
  `681f732b78e5cd246020f8ab30acd65446ff3655dddacb262da676f949940d37`

README 内嵌的 `server.py` 与 `probe.mjs` 哈希已用实际文件重新计算并核对一致。

## Git 与工作树

Git 全程只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；
没有暂存，所以没有本任务提交 SHA。按执行令，交回以本文件落盘为准。

工作树原有大量 modified/untracked 内容保持不动。目标目录本身仍为 untracked。
普通 `git status` 仍因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝以及部分
超长路径而失败；使用只读的 `--ignore-submodules=all` 定向核对，没有修改权限、ACL、
沙箱、审批、锁、凭证或 `.env.local`。当前 PID 是本执行者，没有启动第二 writer，
没有拆 writer 锁。

Packaging HOLD 保持。frozen E50/current6/resolver/guard/PDF、其他 worktree 和全局
设置均未改动。

## 执行偏差

- 一次只读工具调用误填 `shell=bash`，运行器在任何命令执行前以
  `BASH_E_ACCESS_DENIED` 拒绝；没有读取结果或文件写入来自该调用。
- 一次只读工具调用把 PowerShell 路径中的 `powershell` 误写为
  `native-powershell`；运行器返回了只读核对输出。该调用没有产品执行或写操作。

没有用这些失败调用完成任何验证或交付步骤。

## Root 后续

root 应先独立复核本次累计字节与上述精确差异，再在新私有 runtime 中执行必要验证。
有限探针须同时看到畸形值 403 和固定 UUID4 正例 200；通过后才进行真实 GUI 的同一
3-TXT 目录两次导入、复选框变更/全选/取消及“不发送”验收。打包继续 HOLD。
