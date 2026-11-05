# A 线交回：T34 current B346 pins 字面重绑

状态：`SOURCE_ONLY_AMEND_COMPLETE / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_REQUIRED`

## 1. 目标与出处

- 工单入口：`D:\Lawbeach\lawbench-coord\A-T34-current-B-pins-order-20261030-064309.md`
- 批准输入：`D:\Lawbeach\lawbench-coord\T34CurrentBPinsInput-20261030-064309\approved-inputs.json`
- 原 T34 输入：`D:\Lawbeach\lawbench-coord\T34ProjectionObserverInput-20261030-061810\approved-inputs.json`
- 作者运行面：0。只做字面身份重绑，不重演开工、安装、调研或测试。
- Git：严格只读；本运行器未执行 `add/commit/rebase/stash/reset/clean/checkout/push`。

根侧批准的当前 B346 文件为：

```text
path: D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727.json
bytes: 53548
sha256: 7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b
mtime_ns: 1793302647316836800
```

本次独立实测该文件的字节数与 SHA-256，与上述批准元数据一致。按令未重跑
346 文件匹配，也不把本次字面重绑写成动态验收或产品修复。

## 2. 改动清单与提交 SHA

Git 提交 SHA：`NOT_APPLICABLE_BY_ORDER`。本运行器没有 Git 写权限，也没有暂存
或提交；交回以本文件和下面的当前文件身份为准。

允许改动的四个文件：

| 文件 | 改动前字节 / SHA-256 | 改动后字节 / SHA-256 |
| --- | --- | --- |
| `entry.py` | 88,670 / `369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980` | 88,652 / `63f51c6b6709a91c918fd1061bc7648c3a784e1fbcda14b469d676ef10a2beb8` |
| `start.ps1` | 76,348 / `4fe39e1dc2cfc989bbbffe976a71948af1436ec5fc4c49f6820352fb5bb2caf5` | 76,330 / `5ce0684eac8079d7721060bcf4432f323ae99fae7609b860986385f24129a6de` |
| `literal-inputs.json` | 13,410 / `d7a48764689919a66d20d648511801e4eff7a3bbf5d114dee9ea31fa3eb987d2` | 13,679 / `5775e35bd7345ba9e7f80be654d60f4fcc7e292aa6390c8426b6ddf140b86387` |
| `README.md` | 13,965 / `6be25612597b13c5ea77cb32aa527dbfe82511419cf98241cb7100a228fbd58a` | 16,202 / `10dfd6bbba2f3c5bdce6eac7a7448e8d43f49fcd78b107d38eed4ced73b39bf2` |

不应变化的四个文件，终检仍与初始身份一致：

| 文件 | 字节 / SHA-256 |
| --- | --- |
| `prepare.ps1` | 13,561 / `d280ca31609865f91b60c02b1cb531c506673b26e9743b3fdda5ffe8c6dfa9bc` |
| `stop.ps1` | 7,178 / `d52ed07f1ec6bf0ef116c1dab069647c042e5f80751e579bc0872e7ccfed932d` |
| `projection-observer.mjs` | 18,502 / `a50d2eeb520b87576bf977fe2bb895175a8a89e4527bbc907296897714dd0da5` |
| `frame-classifier-finite.mjs` | 7,046 / `6102ee17d992306bbe06405347f25132ba1140feac329ded7f9345ac35ebcd0e` |

具体改动：

- `entry.py`：只改 `B_SOURCE_PINS` 的两段 raw string、`B_SOURCE_PINS_BYTES` 和
  `B_SOURCE_PINS_SHA256`。断言、函数、清理、source case 和参数未改。
- `start.ps1`：只改 `$SourcePinsPath`、`$SourcePinsSha256` 硬编码断言，以及
  `$NativeEntryBytes/$NativeEntrySha256`。旧 `$SourcePinsBytes=53547` 与旧
  `$SourcePinsSha256` 变量在脚本中未被使用；执行令要求其余字节逐字不变，故保留。
- `literal-inputs.json`：只改 `handoff_source_files` 中 entry/start/README 三行
  身份，并增加 `current_B346` 四字段对象；baseline、primary、SDK、legacy 行未改。
- `README.md`：增加旧/当前 pin、五处已验收差异和其余 341 项不变说明，并更新
  entry/start 的当前身份描述。

README 中列出的五项旧/当前差异为：

| 文件 | 旧 SHA-256 / 字节 | 当前已验收 SHA-256 / 字节 |
| --- | --- | --- |
| `service/lawbench/checks/citations.py` | `67779ba41e35e2b6780a7b74ebe061e143a79dd5b8c97273329ae91059748758` / 18,609 | `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412` / 19,642 |
| `service/lawbench/checks/parse.py` | `3fd25b61a965abe5432b8d301448517dea003d77739f45a0331bbbf07fa123bc` / 11,974 | `56f6ac85636eb5260db117067397fe5bad8cd1376360a1be8c52b92203b9db83` / 14,357 |
| `service/lawbench/pipeline/steps/wiki.py` | `aa1614baf9c2d28939b133f47cb5d3c86ac3f6003ed3c392298421ceb80ca76a` / 33,754 | `96698902e8e0925376b742074fb7076edb41cf94f7ba83e0682d6c601607ef13` / 33,796 |
| `service/lawbench/tools/archive.py` | `f159e7e5e629df3f11554c35b10b432f0464ee67d73eae60d017988079311459` / 1,957 | `1bc47967b17e238e71a95f7bbbe2f474e968b07a506ce849058220e8ff3173dd` / 2,393 |
| `service/lawbench/tools/drafts.py` | `119d3ceacee730523b6192c540c063dd36aaec4b3c91814efe57194896ef2f2a` / 6,779 | `e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822` / 20,481 |

## 3. 红绿验证

绿色静态证据：

- 第一个执行工具只读正式执行令。
- 第二个执行工具完整读取 `approved-inputs.json`。
- 初始 8 文件字节/SHA-256 与批准输入逐项一致。
- 当前 B346 文件实测 53,548 字节、
  `7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b`。
- 终检 entry/start/literal/README 当前身份与上面改动后表一致。
- 终检 prepare/stop/observer/finite helper 四个非编辑文件与初始 hash 一致。
- `entry.py` 与 `start.ps1` 中已无旧 pin 路径；`start.ps1` 仅剩明确保留、未使用
  的旧 `$SourcePinsSha256` 变量。

非绿或未由本运行器证明：

- 普通 `git --no-optional-locks status --short --untracked-files=all` 退出 1：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh':
  Permission denied`。按令未修权限、锁、沙箱、审批或 ACL。
- 单文件 `git diff --ignore-submodules=all` 对 `entry.py` 退出 0 且无输出，不能
  据空 diff 推断历史身份；初始和终检字节/SHA-256 才是本交回的实际身份证据。
- 没有执行 JSON 解析器或任何脚本解析器来做 schema/syntax PASS；本交回只声明
  字面编辑和物理哈希一致。
- 初始目录仅有八个文件，没有发现独立的 `before\` 目录。八个改前身份完整保留在
  原 `approved-inputs.json` 和本交回第 2 节；未擅自新建快照文件或助手。

## 4. 证据路径

- 编辑目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\`
- 批准输入：
  `D:\Lawbeach\lawbench-coord\T34CurrentBPinsInput-20261030-064309\approved-inputs.json`
- 当前 B346：
  `D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727.json`
- 本交回：
  `D:\Lawbeach\lawbench-coord\A-handback-T34-current-B-pins-20261030-064309.md`

证据为上述文件本体、物理字节数和 SHA-256，没有另造日志或脚本。

## 5. 契约或文档摘要

- 未改 `contracts\`、产品源码、SDK、测试、Skills 或 engines。
- `literal-inputs.json` 新增的是本次证据绑定元数据，不是产品契约。
- `README.md` 明示旧 pin 文件冻结不动，当前 pin 是固定批准身份，不是动态接受。
- 其余 341 项 source pin 按批准输入声明保持不变；本次没有重跑匹配。

## 6. 自检与遗留

运行时计数：

- `author_runtime=0`
- `target_runtime_scripts=0`
- `node_or_python_invocations=0`
- `parser_ast_import_check_test_build=0`
- `gui_http_model_process_probes=0`
- `git_writes=0`
- `credential_or_dsh_home_storage_reads=0`
- `installs_or_package_changes=0`
- `bash_attempts=0`
- `model_calls=0`

`NOT_RUN`：prepare、admission、start、GUI 禁用投影动作、observer capture、
classifier/有限助手运行、一次实际 Native 拒绝观察、stop、OS closure、任何
parser/import/test/type/build、native projection PASS、whole-T34 PASS。

遗留给根：

1. 按令由根复核本交回、执行有限助手/parser/fresh prepare/admit/start/一次真实
   Native 拒绝观察/OS closure。
2. 根决定是否需要在最终正式交付面另存八个改前快照；本运行器未发现目录内独立
   `before\` 快照，也未获准新增文件。
3. Git dirty 集合因 `dsh` 子模块权限被拒而无法由普通 status 完整取得；本运行器
   没有尝试修复该阻碍。

## 7. 精确逆变换

应用下面的逆操作并保留原换行后，四个旧文件应恢复为：

```text
entry.py           88670  369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980
start.ps1          76348  4fe39e1dc2cfc989bbbffe976a71948af1436ec5fc4c49f6820352fb5bb2caf5
literal-inputs.json 13410 d7a48764689919a66d20d648511801e4eff7a3bbf5d114dee9ea31fa3eb987d2
README.md          13965  6be25612597b13c5ea77cb32aa527dbfe82511419cf98241cb7100a228fbd58a
```

`entry.py`：

```diff
 B_SOURCE_PINS = pathlib.Path(
-    r"D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727"
-    r".json"
+    r"D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932"
+    r"\reviewed-source-pins.json"
 )
-B_SOURCE_PINS_BYTES = 53548
+B_SOURCE_PINS_BYTES = 53547
 B_SOURCE_PINS_SHA256 = (
-    "7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b"
+    "5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf"
 )
```

`start.ps1`：

```diff
-$NativeEntryBytes = 88652
-$NativeEntrySha256 = '63f51c6b6709a91c918fd1061bc7648c3a784e1fbcda14b469d676ef10a2beb8'
+$NativeEntryBytes = 88670
+$NativeEntrySha256 = '369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980'
@@
-$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727.json'
+$SourcePinsPath = 'D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json'
@@
-  Assert-Sha256 $SourcePinsPath '7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b' 'reviewed B source pins'
+  Assert-Sha256 $SourcePinsPath '5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf' 'reviewed B source pins'
```

`literal-inputs.json`：

删除下面新增对象：

```json
  "current_B346": {
    "path": "D:\\Lawbeach\\lawbench-coord\\T18WikiTableFidelityBSourcePins-20261030-033727.json",
    "bytes": 53548,
    "sha256": "7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b",
    "mtime_ns": "1793302647316836800"
  },
```

然后把三行身份恢复为：

```text
start.ps1:  76348  4fe39e1dc2cfc989bbbffe976a71948af1436ec5fc4c49f6820352fb5bb2caf5
entry.py:   88670  369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980
README.md:  13965  6be25612597b13c5ea77cb32aa527dbfe82511419cf98241cb7100a228fbd58a
```

`README.md` 的逆操作：

1. 把“本次 B346 字面重绑前……”两条 bullet 恢复为原 bullet：
   `- 五个蓝图快照当前字节/SHA-256 与 \`approved-inputs.json\` 完全一致。`
2. 删除从 `## 2026-10-30 B346 字面重绑` 起、到 `作者运行面为 0` 前的整段。
3. 把 `start.ps1` 第 1 项恢复为：
   `1. \`EvidenceRoot\` 和新 \`entry.py\`、\`projection-observer.mjs\` 自钉。`
4. 把 `entry.py` 段恢复为：
   `仅改变 \`EVIDENCE_ROOT\`、T34 prepared/admission format 和 run 名正则。原`
   `admission、只读 service firewall、source/case/log/SQLite 最终观察、只监听`
   `owned loopback、精确关闭和私有 key stub 均保留。`

## 8. 命令与结果台账

所有 `exec_command` 均显式使用：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
```

实际只读命令与结果：

```powershell
# 1. 正式执行令（首个工具）
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-current-B-pins-order-20261030-064309.md'                                  # exit 0
# 2. 批准输入
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T34CurrentBPinsInput-20261030-064309\approved-inputs.json'                     # exit 0
# 3. 当前 shell/PID/时间
$PSVersionTable.PSVersion.ToString(); $PID; Get-Date -Format o                                                                          # exit 0
# 4. 只读 Git 状态
git --no-optional-locks status --short --untracked-files=all                                                                             # exit 1：dsh 子模块权限拒绝
# 5. T34 目录清单与初始 8 文件 hash
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810' -Force                   # exit 0
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810' -File | ForEach-Object { Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName } # exit 0
# 6. 精确定位旧/新字面量及上下文
Select-String -LiteralPath '...\entry.py' -Pattern 'B_SOURCE_PINS|reviewed-source-pins|...' -Context 3,5                         # exit 0
Select-String -LiteralPath '...\start.ps1' -Pattern 'SourcePinsPath|...' -Context 3,5                                          # exit 0
Get-Content -Raw -LiteralPath '...\literal-inputs.json'                                                                         # exit 0
Select-String -LiteralPath '...\README.md' -Pattern 'entry.py|start.ps1|...' -Context 2,4                                      # exit 0
# 7. 当前 B346 实测
$f=Get-Item ...; $h=Get-FileHash ...; Get-Content -Raw -LiteralPath ...\T18WikiTableFidelityBSourcePins-20261030-033727.json      # exit 0
# 8. before 目录与 README/source 上下文
Get-ChildItem -LiteralPath '...\T34' -Directory -Force | Where-Object { $_.Name -like 'ProjectionObserver-20261030-061810*' }  # exit 0；仅同名目录
Get-Content README.md lines 1-150                                                                                                # exit 0
Get-Content README.md lines 150-end                                                                                              # exit 0
Get-Content entry.py lines 1-70                                                                                                  # exit 0
Get-Content start.ps1 lines 136-180 and 506-545                                                                                 # exit 0
Select-String start.ps1 '$SourcePinsBytes|$SourcePinsPath|$NativeEntryBytes|$NativeEntrySha256'                                  # exit 0
Select-String start.ps1 'SourcePinsBytes' -Context 2,3                                                                           # exit 0
# 9. entry 修改后 hash 与只读 diff
Get-Item/Get-FileHash entry.py                                                                                                   # exit 0
git --no-optional-locks diff --ignore-submodules=all --no-ext-diff -- 'docs/plan/evidence/T34/ProjectionObserver-20261030-061810/entry.py' # exit 0，无输出
# 10. start 修改后 hash/字面量检查
Get-Item/Get-FileHash start.ps1                                                                                                  # exit 0
Select-String start.ps1 old/new path/hash/bytes                                                                                  # exit 0
# 11. README 修改后 hash
Get-Item/Get-FileHash README.md                                                                                                  # exit 0
# 12. literal 修改后逐行检查
Get-Content literal-inputs.json lines 176-245                                                                                    # exit 0
Select-String literal-inputs.json 'current_B346|...'                                                                             # exit 0
# 13. 终检 8 文件与新字面量
Get-ChildItem ... -File | ForEach-Object { Get-FileHash ... }                                                                    # exit 0
Select-String entry.py,start.ps1 old-path/old-hash patterns                                                                       # exit 0
# 14. 项目交回约定
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\PROJECT-PROFILE.md'                                                        # exit 0
# 15. 交回文件名时间/存在性
Get-Date -Format o; $PID; Test-Path -LiteralPath '...A-handback...md'                                                             # exit 0；写前不存在
```

编辑只通过逐字面 `apply_patch` 完成，没有用 shell 写文件、替换文本、生成脚本或
调用解析器。

## 9. 非零与说明

- 非零退出仅有普通只读 Git status 的 `dsh` 子模块权限拒绝；无命令执行沙箱拒绝，
  无审批升级，无 ACL/锁/审批改动。
- 首次 exec 进程观察到 PID `55620`；各 exec 为独立原生 PowerShell 子进程，本交回
  写前最后一次只读 exec 的 `$PID` 为 `16400`。均属本次执行器，不是第二 writer。
- 本文件写于系统时间 `2026-10-30T06:45:49.6446370+08:00` 取时之后。
- 除上面四个证据文件与本交回外，未改其他文件；旧 pin 文件冻结未动。
