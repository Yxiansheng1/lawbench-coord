# B 线交回：T18 导出器源码长路径归一化

状态：`AUTHOR_READY_NOT_RUN`

交回时间：`2026-10-29 Asia/Taipei`

正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-exporter-source-longpath-order-20261029-001041.md`

正式执行令 SHA256：`552384547967536d234d9ad3be6629bb5ca91eda24bf9c233788da31f57f4cee`

## 结论

B 线已按执行令完成有界源码修改。`continue-genuine-exporter.py` 在读取清单的 `source_sessions` 后，仅于 Windows 上为同一个已经绝对的案卷外会话根路径添加 `\\?\` 扩展长度前缀；已带前缀时不会重复添加。`source_case` 和其他代码路径没有改成扩展路径。

脚本仍为 `AUTHOR_READY_NOT_RUN`，本执行者从未运行脚本，也未运行 Python、Node、parser、import、AST、测试、构建、HTTP、模型、GUI 或 SSH 操作。因此本轮没有新 DOCX、没有新的 `applied/manual/XML` 运行证据，也没有完整 T18、业务质量、Word GUI、法律验收或打包放行声明。

原始失败事实保持不变：

- 原报告 SHA256：`020dc959e3fc3732ff4eaa8bc604d03da3a5d999802e3d90ec5ac9850e71ce6c`
- 原报告状态：`FAILED`
- 真实任务：`T-20261028234100-6b49`
- 案件 UUID：`9d535ab5-f14c-42cc-bd99-a2f669ff6200`
- 原生会话：`session-1cb28369-3a90-46dc-b047-e64986038394`
- 原生请求：`60fda87b-25a9-40c1-9abd-1e4893fa7b8b`
- 风险 3 的 `original 4.1`／“合同第七条”业务文章号错误仍保留
- `fullT18PASS=false`
- `businessQualityPASS=false`
- `Packaging=HOLD`

## 修改前后身份

修改前目标脚本与输入快照逐字节一致。

| 产物 | 字节 | SHA256 |
|---|---:|---|
| 修改前脚本 | 43604 | `9536fae3ed58e78e6e0bdedfa2c6e625fcedadd528808f5e5009f0184aefb567` |
| 修改后脚本 | 43816 | `382b3d6d28da3a228c452effc42fdbf482746071132d3ba4bbbb47a3f05880d6` |
| README（未改） | 2445 | `ec039fa34e0742850abb3da5452a77102b9a90dcfa1f7229b55e361b68531807` |
| 旧交回件（未改） | 5514 | `3c5385cb3f3c1546bc015dc5f6b18f65ade481294f9474f1a81c958f2cce8009` |
| 静态长路径证明（未改） | 397 | `bf008561896d87c66e3b302c5223a8d47ea53d902f682232e0803bce74e7ba87` |

修改后脚本：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\continue-genuine-exporter.py`

修改前快照：`D:\Lawbeach\lawbench-coord\T18ExporterLongPathInput-20261029-001041\continue-genuine-exporter.py`

## 精确差异与逆操作

唯一源码差异为以下新增 4 行：

```diff
     source_sessions = pathlib.Path(manifest["source_sessions"])
+    if os.name == "nt":
+        source_sessions_text = str(source_sessions)
+        if not source_sessions_text.startswith("\\\\?\\"):
+            source_sessions = pathlib.Path(f"\\\\?\\{source_sessions_text}")
     source_session_inventory = verify_tree_inventory(
         source_sessions, manifest["session_files"], "source sessions"
     )
```

精确逆操作是删除上述 4 行。静态反演结果为 `InverseExactlyRestoresOld=true`：修改后全文删除该新增块后，与修改前快照逐字符完全一致。新增块出现次数为 1；不存在第二个 `source_sessions` 赋值。

## 长路径事实复核

复用并复核了既有 `static-path-proof.json` 与输入清单，没有重演旧调研：

- 普通 Python 路径访问的 `normal_session_count=0`；
- 同一个 owned 绝对路径加 Windows 扩展前缀后的 `extended_session_count=1`；
- 会话文件实际路径长度为 282 字符；加 `\\?\` 后为 286 字符；
- PowerShell 只读打开该长路径成功；
- 文件字节数为 `240391`；
- SHA256 为 `cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5`，与既有输入清单一致；
- 固定会话数为 1，匹配既有清单。

本次判断仍是：普通路径预检在复制前拒绝，属于 Python 长路径访问问题，不是产品错误、权限问题或新案件材料问题。

## 静态边界核验

- `if os.name == "nt":` 仅新增 1 处。
- 扩展前缀带已存在判断，同一路径不会重复加前缀。
- `source_case` 仍使用原普通绝对路径。
- `tree_inventory`、`verify_tree_inventory`、复制、`CaseRegistry.open`、`TaskStore`、`Exporter.redline`、XML 审计、结果增量、lifespan-off、`finally` 关闭断言及报告字段均无改动。
- 没有新增路径框架、path resolver、目录搬移、夹具或运行时材料。
- README 未改；未覆盖旧交回件。

## 实际命令与非零返回

实际工作只使用指定的原生 `pwsh.exe`、PowerShell 只读命令、`rg`、SHA256 和只读 Git。

| 命令或操作 | 返回 | 说明 |
|---|---:|---|
| `Get-Content -LiteralPath '<正式执行令>' -Raw` | `0` | 全文读取执行令 |
| `git status --porcelain=v1 --untracked-files=all` | `1` | 子模块 `dsh` 报 `Permission denied`；按要求不修复、不扩权 |
| `git --no-pager status --porcelain=v1 --untracked-files=all --ignore-submodules=all` | `0` | 只读状态成功；工作树已有大量脏改和未跟踪证据，另有超长目录警告 |
| `git --no-pager diff --no-index -- '<快照脚本>' '<当前脚本>'` | `1` | 有差异时的预期返回；仅显示上述 4 行新增 |
| `git --no-pager status --porcelain=v1 --untracked-files=all -- '<脚本目录>'` | `0` | 显示脚本与 README 仍为原有 `??` 文件，不执行暂存 |
| `Get-FileHash -Algorithm SHA256 ...` | `0` | 取得修改前后脚本、README、旧交回件和证明哈希 |
| `Get-Item -LiteralPath '<扩展路径>'` 与对应 `Get-FileHash` | `0` | 只读验证 282 字符实际路径、字节和会话哈希 |
| PowerShell 字符串比较 | `0` | 验证修改前目标等于快照、逆操作精确还原、新增块计数为 1 |

Git 的 `index.lock`、子模块权限或普通状态失败不作为交付阻碍处理。未尝试修复锁、权限、审批或 ACL。

## 写入面

本执行者仅有以下写入：

1. 修改 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\continue-genuine-exporter.py`，即上述 4 行。
2. 新建本交回件 `D:\Lawbeach\lawbench-coord\B-handback-T18-exporter-source-longpath-20261029-001041.md`。

未写 README、输入快照、案卷、会话、夹具、现有正式报告、旧交回件或其他证据文件。未产生 `owned-root-*`、DOCX 或运行报告。

未执行 Git `add/commit/rebase/stash/reset/clean/checkout/push`，没有暂存，没有提交 SHA。

## 主编排接续

本交回不是脚本执行结果。主编排复核后仍应由主编排执行；`--owned-root` 应使用证据目录下新的、短的、直接子目录，避免新案卷路径再次超过限制。执行命令和原安全边界不变。

成功时只允许据此声明“生产导出器技术链通过”；原报告 `FAILED`、业务文章号错误、`fullT18PASS=false`、`businessQualityPASS=false` 与 `Packaging=HOLD` 均不得改写。
