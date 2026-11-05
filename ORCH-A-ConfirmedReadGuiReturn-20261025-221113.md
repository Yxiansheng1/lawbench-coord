# A 线 ConfirmedRead GUI 交回 — 20261025-221113

状态：四件已准备，未运行；不声明 GUI 或模型 PASS。

## 四件与相关路径

- 输入四件：
  `D:\Lawbeach\lawbench-coord\ConfirmedReadGuiInput-20261025-221113\prepare.ps1`
- 输入四件：
  `D:\Lawbeach\lawbench-coord\ConfirmedReadGuiInput-20261025-221113\start.ps1`
- 输入四件：
  `D:\Lawbeach\lawbench-coord\ConfirmedReadGuiInput-20261025-221113\stop.ps1`
- 输入四件：
  `D:\Lawbeach\lawbench-coord\ConfirmedReadGuiInput-20261025-221113\README.md`
- 新准备目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T15\ConfirmedReadGui-20261025-221113`
- 新 native entry：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\server.py`
- 新 fresh runs root：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\runs`
- 本正式交回：
  `D:\Lawbeach\lawbench-coord\ORCH-A-ConfirmedReadGuiReturn-20261025-221113.md`
- 执行边界：
  `2026-10-25T22:17:14.1840556+08:00`

## 变更边界

只把输入四件复制到新准备目录，并执行以下五个 literal：

| 文件 | 原行 | 原 literal | 新 literal |
| --- | ---: | --- | --- |
| `prepare.ps1` | 9 | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\server.py` |
| `prepare.ps1` | 10 | `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca` | `6f907803a2e933c149081bea687ca70c23b9b041cab332347bef154bac54b509` |
| `start.ps1` | 131 | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\server.py` |
| `start.ps1` | 135 | `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca` | `6f907803a2e933c149081bea687ca70c23b9b041cab332347bef154bac54b509` |
| `stop.ps1` | 10 | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\runs` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmedReadEntry-20261025-215536\runs` |

每个旧 literal 在目标文件中原先都恰好出现一次。未新增代码，未修改 label、
selector、guard、hash map、PDF、环境、timeout、cleanup 或产品源码。新 README
只在文件末尾追加本目标的 entry、runs、SHA 和只读验收目标；原历史内容保留。

只读目标为：新 fresh root 首页显示一份成果；准确 case 文稿页实际显示已确认
成果列表和 Markdown 预览。不得编辑、保存、确认成果或请求模型；不得伪造 DSH
turn、history、rollout；不得改旧 E50、原 resolver 绝对位置、guard、PDF
固定 origin 加五资源。

## 实际执行

所有 Shell 均为显式原生 PowerShell，`login=false`；未使用 Bash 包装。

1. 首件只读正式执行令：

   ```powershell
   Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\ConfirmedReadGuiOrder-20261025-221113.md' -Raw -Encoding UTF8
   ```

2. 只读核状态：用 `Get-Date`、`Get-ChildItem -Force -File`、
   `Get-FileHash -Algorithm SHA256`、`Test-Path` 和
   `git status --porcelain=v1 --branch --untracked-files=all --no-renames`
   检查输入、目标、正式件、dirty 与本机时间，环境为
   `$env:GIT_OPTIONAL_LOCKS = '0'`。

3. 只读定位五处 literal：逐行使用 ordinal `String.Contains`，并读取输入
   `README.md`；结果分别为 1 次，位置见上表。

4. 机械复制四件并用 Latin-1 字节往返与 ordinal `String.Replace` 执行五个
   literal 替换；同一命令用反向替换逐字节比较脚本与源件。该命令落成四件，
   `prepare.ps1`、`start.ps1` 的逆替换比较通过；`stop.ps1` 的单元素嵌套数组
   被 PowerShell 摊平，命令在其写入前退出。

5. 在同一目标执行唯一剩余的 `stop.ps1` runs-root literal 替换；替换后，汇总
   校验辅助逻辑再次把单元素数组摊成字符串，将首字符 `D` 当作 literal，因而
   在报告 JSON 前退出。根据该命令控制流，`stop.ps1` 已在汇总校验前写入；但
   因第五次工作 exec 已用完，本次没有取得完整汇总校验输出，不能声称最终
   结构校验 PASS。

## 未运行与阻碍

- 未运行 `prepare.ps1`、`start.ps1` 或 `stop.ps1`。
- 未启动 GUI、HTTP、probe、parser、测试、build 或任何自测；未发模型请求；
  未生成或编辑 DSH turn、history、rollout。
- 未复用旧 started 根；未运行旧 T34/T33 示例路径。
- `git status` 退出 128：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`
  及子模块状态失败。未修改锁、ACL、沙箱或审批，未尝试 Git 写操作。
- Git 全程严格只读；未执行 add、commit、rebase、stash、reset、clean、
  checkout 或 push。没有 Git 交回。
- 第一次只读字面定位脚本因自身非线性行号算法过慢而中止，未写文件；它不涉及
  产品脚本运行，也没有改变交付边界。
- 最后的 Shell 辅助代码缺陷导致完整汇总输出缺失，这是当前唯一未消除的验证
  阻碍。主循环或其他有权复核者应以只读方式检查四件、五个 literal 的残留/
  计数，并对三脚本做反向逐字节比较；本次不自行宣称通过。

准备不等于 GUI 通过。结束即停。
