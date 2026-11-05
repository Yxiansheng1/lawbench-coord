# T18 有界读取测试夹具准备交回

状态：**AUTHORED_NOT_RUN / runtimeZERO**

执行令：
`D:\Lawbeach\lawbench-coord\ORCH-B-T18BoundedReadFixturePrep-20261101-114647.md`

批准件：
`D:\Lawbeach\lawbench-coord\T18BoundedReadFixturePrep-20261101-114647-approved.json`

## 交付

1. 目标测试已修改：
   `D:\Lawbeach\lawbench-B\service\tests\test_read_bound_20261101_114236.py`

   覆盖内容：

   - `RANGE_TEXT` 改为单元间单换行，TXT 行单元精确为 4 行。
   - `LONG_TEXT` 改为两个单元间单换行。
   - 超长单元首读和所有 offset 续读都显式传 `end=1`。
   - 完成后断言 `next_offset is None`、`has_more is False`、`next_start is None`，并持续排除第二单元泄漏。
   - 读取记录只允许 `from=1,to=1`；通过真实 `TaskStore.coverage(task_id)` 快照和选中单元计数核对覆盖，不再假定存在 `coverage.json`。
   - 增加一次直接 `materials.read_material` 调用；ToolContext 使用实际 `TaskStore`、`MaterialStore` 和实际任务记录，未 monkeypatch read/units/render/record/coverage/schema。该用例要求 `start=2,end=2` 停在单元 2，且不得出现单元 4 哨兵。
   - 保留公开 schema 校验、非法边界无读取变更、原始材料字节不变及无 skip/xfail。

2. 已批准控制文件副本：
   `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18BoundedReadFixturePrep-20261101-114647\bootstrap.py`

   该文件从批准件指定的原始 `bootstrap.py` 按字节复制，仅将主 pytest 参数中的单个
   `str(tests_dir)` 选择器替换为批准的目标测试绝对路径。替换脚本校验匹配数必须恰为 1；
   其余 pytest 参数、T37 ignore、guard/process/net/key/env/fs/summary/finally 内容均由原字节保留。
   批准件记录的原始控制文件 SHA-256 为
   `4b3c956626e822cb39af5341ed410ea4fdeeefcf1d8f3b432028bd23578ba8b2`。
   本副本未执行。

## 最终原生 SHA-256 与大小

| 文件 | SHA-256 | Bytes |
|---|---|---:|
| `service\tests\test_read_bound_20261101_114236.py` | `ae4953cc5e64c01bed4989affef9cbc0bc8976d2d5c30713f32726085493677c` | 8653 |
| `docs\plan\evidence\T18\T18BoundedReadFixturePrep-20261101-114647\bootstrap.py` | `5b944f27bb95497d7c932abfba30373c898563978d82f223a97493e73391755d` | 32103 |

## 运行与验证边界

- `runtimeZERO`：未执行 pytest、Python、测试收集、复制后的 bootstrap、HTTP、模型、GUI、依赖安装、构建或环境/安全配置。
- 未修改产品源码、schema、conftest、契约或其他源码。
- 按要求未使用 Git：未执行 add、commit、rebase、stash、reset、clean、checkout、push，也未修复或绕过 Git 锁/权限。
- 因禁止运行，直接调用的导入名、构造签名和运行期兼容性未由本执行者验证；这是 AUTHORED_NOT_RUN 的明确遗留验证项。

## 阻碍与额外读取披露

- 先前原 B 作业首次尝试使用 Bash，在 PREEXEC 阶段收到 `E_ACCESS_DENIED`。本次已按要求改用指定原生 PowerShell、`login=false` 重做第一次正式执行令读取。
- 为定位 `TaskStore`、`ToolContext`、`read_material` 的公开符号路径，执行过一次 `rg` 符号/路径检索，范围涉及 `service\lawbench` 与 `service\tests`，因此命中了批准四文件之外的文件路径和少量匹配行摘要；未打开或完整读取这些额外文件。此额外只读操作在此披露。
- 最终 SHA 命令第一次因 PowerShell 管道语法错误未产生哈希；修正后在同一核验面完成，未改动任何交付文件。
- 未发现需要扩权、修改沙箱/审批/ACL、启动 setup 或拆 writer 锁的情况；当前 PID 未被当作第二 writer。
