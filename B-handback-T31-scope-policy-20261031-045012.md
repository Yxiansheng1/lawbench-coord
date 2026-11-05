# B 线交回：T31 GUI scope policy 源码片

日期：2026-10-31  
状态：**SOURCE_ONLY / DELIVERED；未测试、未验收、未提交。**

## 结论

已按正式执行令新增一个有界、可复用的纯 ASGI 策略类工厂
`make_scope_firewall(BaseFirewall, *, source_root, source_sha_by_name)`。
实现只构造 `BaseFirewall` 子类，不导入产品或执行模块级 I/O；没有启动
server/preparation/GUI/forwarder，也没有改旧源码、契约或产品行为。

## 新增写入面

仅新增以下四个文件：

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopePolicy-20261031-045012\scope-policy.py`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopePolicy-20261031-045012\README.md`
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopePolicy-20261031-045012\literal-inputs.json`
4. `D:\Lawbeach\lawbench-coord\B-handback-T31-scope-policy-20261031-045012.md`

`literal-inputs.json` 原样保留批准元数据、基线路径、八个 source pins、
`runtime_allowed=false`、超时任务路径和 canonical case ID。没有改旧源文件；
未读取或改动既有 dirty 内容。

## 实现边界

- `ContextVar` 在覆写 `__call__` 中逐请求设置并在 `finally` 重置；`_policy`
  只写当前调用元数据，`_complete` 用同一调用上下文，不共享 pending body。
- 继承锁保护共享预约状态。并发 prepare 比较完整 case/session/request/IDs
  元组；不同元组拒绝。异常及原生失败清掉在途预约，只有原生成功响应可绑定。
- `bind_materials(rows)` 接收三条原生 index 事实，只接受 factory 中三个 TXT
  名称和 SHA；重复 ID/名称/SHA、一次性后重绑均拒绝。它从不生成 ID。
- 导入仅允许两次、同案、`paths=[source_root]`、`target=null`、
  `unzip=false`、显式 `mode="ref"`。不开放路径移动、删除或第二源根。
- scope 仅允许两次相同 prepare/release；要求实际
  `session-<UUIDv4>`、实际请求 UUIDv4、三个已绑定材料中的恰好两个不同 ID。
  prepare 成功响应必须精确回显 action/case/session/request/IDs；release 只接
  同三元组。未生成 session、request、材料 ID 或响应。
- task begin 仅允许两次相同重放，精确校验 prepared 元组、真实 private case
  路径和原生 `task_id`。只有实际成功响应才记录 task；嵌套
  `request_scope` 必须精确为 case/request、`kind="materials"`、两个已知 ID
  及其 SHA，session 若存在必须相同，重复项拒绝。持久化不据此宣称通过。
- `/core/context`、`/core/progress`、`/core/task/end` 只接已绑定 task，保持
  原文精确字段，每条最多八次，计数为有限非负整数。progress 文本不持久化。
- `/core/tool` 明确拒绝；其他 task selection/任意写面继续由原 Firewall 拒绝。
  GET/caseopen/认证/路径原行为继承。GET `/api/materials` 只提取
  ID/name/SHA 元数据并保留原生响应；无法验证时只暴露 observation，不伪造。
- 原生响应从不改写。响应后验失配、原生失败、未预期异常分别进入 violations
  或 native failures，不会静默吞掉或转成 PASS。

## 验证结果

本片按令禁止 Python/import/AST/parser/check/test/build/prepare/app/HTTP/model/
GUI/credentials/SSH/subagent 和产品探测，因此这些均为 **NOT_RUN**，不是 PASS。
Git 也严格只读执行，实际是未调用任何 Git 命令，没有 add/commit/rebase/stash/
reset/clean/checkout/push，未暂存、未提交。

本次共执行四次 shell 命令：

- 读正式执行令：退出码 0。
- 读 `approved.json` 与 `primary-excerpts.txt`：退出码 0。
- 对当时源码草稿做行数/文件长度只读检查：退出码 0。
- 可选最终元数据/hash 命令：退出码 1。PowerShell 报 `ParserError`，原因是
  `foreach` 结果直接接管道的表达式缺少括号。该命令未写文件，未重试。

失败命令原文：

```powershell
$dir = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopePolicy-20261031-045012'; $files = @('scope-policy.py','README.md','literal-inputs.json'); foreach ($name in $files) { $p = Join-Path $dir $name; $item = Get-Item -LiteralPath $p; $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant(); $lines = if ($name.EndsWith('.py')) { (Get-Content -LiteralPath $p | Measure-Object -Line).Lines } else { 0 }; [pscustomobject]@{File=$name;Bytes=$item.Length;Lines=$lines;SHA256=$hash} } | Format-Table -AutoSize
```

因四次执行上限已用尽且令禁止重演，本次未取得最终三份证据文件的哈希，也未做
语法或运行验证。此前行数检查针对旧草稿，不能作为最终源码行数证据。

## Root 后续硬门

Root 必须先完整审源码，再做语法/import-time I/O 审查、并发两请求上限、
changed tuple/conflict、原生失败清理及响应不改写测试。随后由 adapter 从实际
native index 调用 `bind_materials`，确认三个实际 ID/name/SHA 后再 GUI Send。

以下均仍为 **NOT_RUN**：选二与全量 current batch、二次导入新增 0、真实
session/request/task ID、TaskStore/JSONL/GUI/OS 证据、模型或 6000D/395 调用、
完整 T31 或项目验收。本交回不包含任何此类 PASS 宣称。
