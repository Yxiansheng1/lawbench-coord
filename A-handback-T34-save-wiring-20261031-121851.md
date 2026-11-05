# A 线交回：T34 policy-valid Settings Save wiring

状态：`SOURCE_ONLY_NOT_RUN`。不宣称验收通过；实际 Save、清理和全部运行时结论留给 Root。

## 交付位置

源包：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314`

有界改动共 5 个文件：

1. `entry.py`：在 `expected_saved_settings()` 之后、`Firewall` 之前新增本地
   `_assert_wiring`。原守卫断言逐项保留，仅按令改为
   `BASE._targets(SERVERS)`、`B_CONTRACTS`，并把外部条件改为精确匹配
   `lb.external.snapshot() == expected_external`；批准初始快照的
   `context_window` 固定为 `32768`。旧别名仍为原第 206 行
   `_assert_wiring = BASE._assert_wiring`，由后续新定义遮蔽。
2. `start.ps1`：仅把 `$NativeEntryBytes` / `$NativeEntrySha256` 更新为新
   `entry.py` 元数据。两个 HTTPS guard、lawfirm seed 及其他字节未作编辑。
3. `wiring-finite.py`：新增有限源码检查。仅用标准库 AST 选取新
   `_assert_wiring`、`expected_saved_settings` 与冻结 `_targets`；读取
   `--approved`、`--entry`、`--base` 三个显式文件，其余均为内存合成夹具。
4. `literal-inputs.json`：仅更新 `README.md`、`entry.py`、`start.ps1`
   的 bytes/SHA，并新增 `wiring-finite.py` 一行；其他字段与格式未改。
5. `README.md`：追加 policy-valid 精确启用目标守卫说明、有限脚本未运行声明；
   其清单 bytes/SHA 已同步。

`firewall-finite.py` 与五个 `.mjs` 文件未编辑。

## 最终自有文件元数据

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `entry.py` | 92711 | `54588ffe672b3635c8fb47119fc50c1431dcad38089adc58ef15d217e7b8f09d` |
| `start.ps1` | 96169 | `12e7426242b5ad90f1e88dd01068856764bc0819e30016dbb4ed2b212c70df46` |
| `wiring-finite.py` | 9188 | `1b526ce03f12af3a6021707ac104a0c0007f7de4223e5afb21d3691fd1e95271` |
| `README.md` | 2830 | `67eb88d00d86dd208138b3569a0372edfcb82b4907fb8ea220a883f58715f9bf` |

`literal-inputs.json` 自引用保持 `SELF_NOT_REFERENCED`。

## 已做核验

- 定向读取并核对冻结 `_targets` / `_assert_wiring`、旧别名、新插入守卫、
  `start.ps1` 两行元数据及 manifest handoff 行。
- 定向 `Select-String` 核对新守卫顺序、精确外部快照条件、其余原断言、
  `start.ps1` 新 entry 元数据和未变 observer 元数据。
- 定向核对 `wiring-finite.py` 的三个显式参数、三处 `read_text`、AST 选取、
  16 个拒绝夹具、1 个接受夹具及 2 个 target helper 性质检查来源。
- `Get-Item` / `Get-FileHash` 只用于本卡自有 entry、start、new finite 与 README；
  上表数值已同步到 manifest 和 start。

作者未运行 `wiring-finite.py`，未运行 Python、Node、parser、测试、构建、prepare、
start、GUI、stop、HTTP、网络、进程、模型或凭据操作。运行时计数全部为 0：
prepare 0、actual Save 0、cleanup 0、model calls 0、credential operations 0。

## Root 仍需执行

有限源码检查命令：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\wiring-finite.py' --approved 'D:\Lawbeach\lawbench-coord\T34SaveWiringInput-20261031-121851\approved-inputs.json' --entry 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\entry.py' --base 'D:\Lawbeach\lawbench-coord\T34SaveWiringInput-20261031-121851\frozen-safety-source.txt'
```

预期安全计数：读取 3 文件、选取 3 函数、接受夹具 1/1、拒绝夹具 16/16、
target helper 性质 2/2；以上是待 Root 实测的预期值，不是作者运行结果。

Root 仍须完成：完整源码/raw/inverse 核验、上述 finite 实跑、一次 fresh actual
Settings GUI Save，以及 cleanup。原先一次的真实 Save 和清理在这里均为 `NOT RUN`。

## 阻碍与 Git 边界

只读 `git status --short --untracked-files=all` 返回非零，原因：

`fatal: cannot chdir to ...\lawbench-A\modules\dsh: Permission denied`

按令未修复权限、锁或子模块，未改变沙箱、审批或 ACL，也未拆 writer 锁。
本交回不是 Git 提交；没有执行 add、commit、rebase、stash、reset、clean、
checkout 或 push。现有 dirty 由文件级有界编辑保全。
