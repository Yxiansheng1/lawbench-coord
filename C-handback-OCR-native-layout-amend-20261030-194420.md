# C 线正式交回：OCR 原生 CLI 远端布局修正

- 交回时刻：2026-10-30 19:49:40（UTC+08:00）
- 执行线：C，DeepSeek 执行者
- 状态：`SOURCE_READY_FOR_ROOT_FINAL_REVIEW_NOT_RUN`
- 作者运行：Python / CLI / 模型 / 测试 / 探测均为 0
- Git 写操作：0；没有 add、commit、rebase、stash、reset、clean、checkout 或 push
- 提交 SHA：不适用；本运行器禁止 Git 写操作
- Packaging：`HOLD`

## 进度汇报

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正了三份未服役文件，使 admission 和实际文件布局能在 395 的单一 stage 上执行。源码仍为 `NOT_RUN`。 |
| 目标是什么 | 让 root 能把 runner、`input.png`、`admission.json` 放进一个精确 stage，随后在 `stage\run` 中做唯一一次离线原生 CLI 反事实。 |
| 在等什么 | 等 root 对最终三文件和本件做完整静态复核，核对客户端六项来源与 Python/CLI 身份，生成精确 admission 并完成一次实际尝试。 |
| 卡在哪 | 本轮没有需要作者处理的运行阻碍。递归 Git 状态检查被 `dsh` 子模块权限拒绝，已改为忽略子模块的只读检查；这不影响交付文件。 |

## 改动清单

工作区只修改以下三份既有未服役文件，没有改动产品、Spec、Skill、旧 PS helper、SDK、模型、配置或旧正式交回件。

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\native-cli-diagnostic.py` | 45360 | `4c83ef00326048582d3581666d69a9bc32a8db981ce08bc199166c77bcf5de93` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\literal-inputs.json` | 4929 | `25845f1ed292f5b3c2cdabc66bafcd10941d29cbf3a2a61d0e5bd46b033d98fd` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\README.md` | 8336 | `645dee44aed4f91f5fffb9ac2773350e2fa32b6bdeb497bedbd62cb5228b6cf` |

`native-cli-diagnostic.py` 的实质 delta：

1. admission schema 升为 `/2`，必须有 `runner` pin；旧 `/1` 或缺少 runner 的输入被拒绝。
2. stage 必须直接在 `C:\Users\PC\AppData\Local\Temp` 下，名称匹配 `lb-ocr-native-<fresh-id>`，路径链不得含 reparse point。
3. stage 可预先存在，但必须恰有 runner、`input.png`、`admission.json` 三个条目；`run_dir` 必须精确为 `stage\run` 且尚未存在。
4. runner 路径必须等于 `stage\native-cli-diagnostic.py`、`__file__` 必须与 admission 路径一致，实际 bytes/SHA 由 runner 自身复核。
5. image 必须精确为 `stage\input.png`、132843 bytes，SHA-256 为 `6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a`。
6. admission 必须精确位于 `stage\admission.json`。
7. CLI 固定为 `C:\prep395\llama\llama-mtmd-cli.exe`、91136 bytes，SHA-256 为 `1c984293418dbfbe3e58d242a94029e1e155f5beaea721570e27300f1adf086c`。
8. argv 保持原冻结参数，并在末尾加入 `--jinja`；图片路径改为 stage 内的 `input.png`，英文 primary prompt、4096、32768、99、temperature 0 不变。
9. 六项旧 source pin 继续作为 admission 的精确 path/bytes/SHA 元数据校验，但不再进入远端指纹或读取路径。
10. runtime 只前置和后置哈希真实远端 runner、CLI、model、mmproj、image、admission。结果固定标注 `ROOT_CLIENT_VERIFIED_METADATA_ONLY_NOT_REMOTE_FILES`。
11. `exact_identity_absence_verified=true` 现在同时要求 startup identity 实际验证、当前独立查询成功、当前没有匹配的原始 PID/exe/UTC-birth。
12. `process.poll()` 仍存活时标 `RESOURCE_NOT_CLOSED`。超时或异常停止前继续重查精确身份，并要求当前持有的 `Popen.pid` 未变。
13. 错误路径固定先写 `cleanup_complete=false`，不回推 `finally` 已运行；若错误后进程仍存活，最终状态改为 `RESOURCE_NOT_CLOSED`，退出码 21。

`literal-inputs.json` 和 `README.md` 只同步 stage、runner、CLI/Python 身份、argv、客户端来源作用域和 CLI 语义。旧正式交回件仍为 8119 bytes，mtime 为 2026-10-30 19:37:39（UTC+08:00），没有重写。

## 依据与验证

- 执行令：`D:\Lawbeach\lawbench-coord\C-OCR-native-layout-amend-20261030-194420.md`，完整只读。
- 布局输入：`D:\Lawbeach\lawbench-coord\OCRNativeLayoutInput-20261030-194420\approved-layout.json`，完整只读。
- 三份提交前 snapshot：同一输入目录下的 `native-cli-diagnostic.py`、`literal-inputs.json`、`README.md`。
- 完整 delta 对照：分别用只读 `git diff --no-index` 对照上述三份 snapshot；差异只在列出的三个文件内。
- 文件终态：用 PowerShell `Get-FileHash -Algorithm SHA256` 和 `Get-ChildItem` 记录上表 bytes/SHA 与 metadata，未调用 JSON parser。
- 源码静态扫描：用 `rg` 核对 schema、stage、runner、固定身份、`--jinja`、source scope、缺席真值、cleanup 与 `Popen.pid`。
- 子进程扫描：源码只有一个 CLI `Popen` 和一个固定只读 CIM 查询 `subprocess.run`；未发现 HTTP、socket、模型变体、重试、帮助、按名杀进程或删除调用。
- 指纹路径扫描：`source_pins` 只出现在 admission 元数据校验和结果标签；`inputs_before` / `inputs_after` 的 pins 只有 runner、CLI、model、mmproj、image、admission。
- 工作区范围：scoped `git --no-optional-locks -c submodule.recurse=false status` 只显示目标目录为未跟踪；没有把既有 dirty 暂存、清理或覆盖。
- 新交回件在本件写入前不存在；旧正式交回件没有被修改。

成功执行的 shell 全部为执行令指定的 PowerShell。命令面只包括：完整只读文件、目录与文档；只读 Git status、diff、hash；只读 `rg` 文本扫描；`Get-Date`、`Test-Path` 和目标 metadata；`apply_patch` 修改三份指定文件和新增本件。没有使用 setup、安装、legacy shell、沙箱/审批/ACL 更改或 writer 锁操作。

## 未做与偏离

未运行：

- Python、import、AST、source parser、py_compile、JSON parser、测试、构建、应用、CLI、帮助、模型、GPU、HTTP、端口、health、SSH、SCP 或任何探测。
- 旧 PowerShell helper 没有执行、内联、编码或移植。
- 没有修改 API、环境 Key、DPAPI、安装、生产进程、执行策略、沙箱、审批、ACL 或 Git 写状态。
- 没有验证 runner 的语法或运行时正确性。源码和两份参考文档仍是作者侧 `NOT_RUN`，必须由 root 独立复读。

有两项必须记录的过程异常：

1. 开工时的递归 Git status 在 `dsh` 子模块处被权限拒绝。随后使用
   `--ignore-submodules=all` 只读检查主工作树，没有修复权限或改锁。
2. 一次只读 `rg` 检查误把 shell 参数写成 `bash.exe`。托管运行器在命令执行前以
   `E_ACCESSDENIED` 拒绝；没有读取文件、没有改变状态，也没有启动 Bash、setup
   或 legacy 路径。对同一事项已改用指定 PowerShell 重做。该失败不作为验证证据。

## Root 后续硬门

在下列项目全部核对前，不得运行实际 CLI：

1. 完整复核三份文件的最终 bytes/SHA、完整 delta 和本交回件；确认没有范围外改动。
2. 在客户端实际执行前后复核六项冻结来源及原图片的 path/bytes/SHA；它们只作为外部 provenance，不得复制成 395 本地假文件。
3. 核对 Python host 的固定身份：`C:\prep395\python\python.exe`、91648 bytes、SHA-256 `4796bc182e858e4440f638fe5dab250d6172745ddec84e41c6afbc192a3198f9`。
4. 核对 CLI、model、mmproj 和 image 的固定路径与 bytes/SHA；不要再运行作者侧测试或探针。
5. 建立或复用直接位于 `C:\Users\PC\AppData\Local\Temp` 的 stage，确认路径链无 reparse point，正好放入 runner、`input.png`、`admission.json`，且 `stage\run` 不存在。
6. 独立生成 schema `/2` admission，runner pin 用最终 runner 的实际 bytes/SHA；六项 source pin 按元数据精确填写，argv 精确加末尾 `--jinja`。
7. 在唯一一次实际执行前，复核源码 setup、输入前置哈希、单次 Popen、300/45 秒预算、固定 CIM 查询、超时停止身份门、异常路径、输入后哈希和结果写盘路径。
8. 使用指定 Python 和绝对 runner/admission 路径执行一次。禁止 HTTP、server、端口、credential、重试、安装、默认变体、删除或生产停止。
9. 执行后按结果原样报告。退出码 0 也只能记为
   `COUNTERFACTUAL_COMPLETED_ZERO_NOT_QUALITY_PASS`；`thinking_control`
   只能是 `NOT_AVAILABLE_IN_CLI_NOT_HTTP_EQUIVALENCE`，不得宣称原 HTTP 服务路径等价复现、因果成立或 OCR 质量通过。

## 下一步建议

当前工作区已可交给 root 做最终静态复核；没有需要 owner 另行拍板的代码决定。root 完成第 1 至 7 项并确认最终 runner SHA 后，触发唯一一次第 8 项执行；若任一身份、stage 或来源复核不符，就停在模型载入前，不改路径、不换 CLI、不补测试。

Response ID：`C-OCR-native-layout-amend-20261030-194420`
Response log path：`D:\Lawbeach\lawbench-coord\C-handback-OCR-native-layout-amend-20261030-194420.md`

删减轮：读者 1 / 槽位 2 / 半句 3 / 重复 4 / 过程 1 / 黑名单 2
