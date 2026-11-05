# A 线正式交回：T31 prepared guard

状态：`SOURCE_ONLY_NOT_RUN`。有界源码修正与必要文件元数据已完成；实际 prepare、GUI、scope、手工核对、清理和最终判读均未执行，归 ROOT。

## 执行依据与目的地

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T31-prepared-guard-order-20261031-054059.md`
- 批准输入：`D:\Lawbeach\lawbench-coord\T31PreparedGuardInput-20261031-054059\approved.json` 与 `guard-primary.txt`
- 新证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopePreparedGuard-20261031-054059`
- 旧 `GuiScopeSubmission-20261031-050218` 证据树保持只读未改，未复用为本轮运行产物。

## 已完成改动

1. 从批准基线复制全部 14 个文件到全新目的地。
2. `entry.py` 仅替换计划根目录名；批准目标为 43,765 字节、SHA-256 `f3c9ef443dce7c3ca320b3a317ac5ebcc5c44c7177a65aa9d2c5607749e80dcb`。`start.ps1` 的 `NativeEntryBytes` / `NativeEntrySha256` 同步到该批准值。
3. `prepare.ps1` / `start.ps1` / `stop.ps1` 的证据根改为新目录，涵盖反斜杠、正斜杠与 file URL 形式。
4. `Assert-T30PreparedInputs` 在根清点前加入 `T31 scope-source exact admission guard BEGIN/END` 块：普通非重解析目录、恰好三个大小写敏感排序名称、三个普通非重解析文件、批准字节与哈希；拒绝额外、缺失、子目录和内容变化。根清点改为原四项加 `scope-source`，原失败语句与 never-served 产物守卫保留。
5. `literal-inputs.json` 的 `approved_core` 为批准 JSON 原始字节嵌入；`baseline_blueprint` 为旧全量元数据原始对象嵌入；新增本次 rebinding、guard 与 source-only 边界。未写自引用哈希。
6. `README.md` 与实际元数据均明确 `SOURCE_ONLY_NOT_RUN`，没有声称原生 scope、模型传输或整项 T31 通过。

## 最终 14 文件元数据

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `entry.py` | 43765 | `f3c9ef443dce7c3ca320b3a317ac5ebcc5c44c7177a65aa9d2c5607749e80dcb` |
| `literal-inputs.json` | 56712 | `73605adb254f774a191cfc808388bbfedefd0d0ca2794474c118c50148801626` |
| `observer-finite.mjs` | 6845 | `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb` |
| `prepare.ps1` | 13564 | `2c50e782df0fbae4e095b2da95bee72ff1b9f49d760f89ae963f0491e589588e` |
| `private-provider-binding.mjs` | 2499 | `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e` |
| `projection-observer.mjs` | 20058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `README.md` | 2067 | `34b55a92e793b4c5a30da31802141ff0a792735e67ee7367c023ce2a045f062c` |
| `scope-a.txt` | 37 | `0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8` |
| `scope-b.txt` | 37 | `3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91` |
| `scope-c.txt` | 39 | `5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439` |
| `settings-read-observer.mjs` | 11513 | `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107` |
| `signature-finite.mjs` | 5381 | `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed` |
| `start.ps1` | 97501 | `c74887fa3e44f263576a6ff6af15426340d61dd646f3ffaae313a29e6d1bf92b` |
| `stop.ps1` | 7181 | `7d10afad238a42e86f5f19e4273166d9352fe18b8e8cb833ea1c7e60564a9ee8` |

## 实际执行与禁区

- 原生 PowerShell 执行批次：5（首次只读令、批准输入读取、源码定位、失败复制尝试、最终编辑与元数据）。
- PowerShell 进程非零退出：0。第 4 批因 `Copy-Item -LiteralPath` 将 `*` 当字面路径产生错误记录，目的地只生成 README；第 5 批在同一目的地改为显式文件枚举完成，未改授权范围，未触及旧树。
- Git 写入：0；未执行 add、commit、rebase、stash、reset、clean、checkout、push。
- prepare/start/stop、测试、构建、GUI、HTTP、模型、Key、6000D、395、手工核对、清理调用：0。
- 未使用 JSON 解析器、断言/探针、AST/import/check/test、子代理、SSH、write_stdin 或 bash。
- 未修改 product、SDK、current25、build/defaultlib/legacy18、沙箱、审批、ACL、锁或其他工作树。

## 待 ROOT

按批准流程执行实际 prepare、GUI/scope、手工闭合、OS 清理及最终验证。本交回件不是运行通过证明。

Git 提交：未做（本执行令明确禁止）；本文件即正式交回通知。