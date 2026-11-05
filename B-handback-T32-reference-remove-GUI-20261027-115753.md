# T32 引用移除 GUI 有界交回

## 四问状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已写入新入口、有限探针、三份新 GUI 脚本和两份 README；所有 Git、产品、契约和旧证据保持原样 |
| 目标是什么 | root 审阅后先跑一次 20 秒后端探针，再另开全新根执行人工 GUI 取消与确认流程；当前仍差实际运行与 root 真人动作时确认 |
| 在等什么 | 等 root 完成静态复核并明确开始有限探针；探针自然结束且全绿后，再等 root 启动独立 GUI，并在实际确认框出现时向人取得动作许可 |
| 卡在哪 | 未卡；作者运行授权明确禁止运行 parser、Node、Python、脚本、HTTP、GUI 或测试，因此按令停在 `RUNTIME_NOT_RUN` |

## 交付文件

入口目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\`

- `server.py`，134435 字节，`2c3894d173744fa99c5d0c8eb115a3fb7ab879fb51abb5ac5527e425b16750a0`
- `probe.mjs`，13453 字节，`fa0f4bab363bf50c3bbd50f9b3aa91beffb528bab2952e618dd880972d574b57`
- `README.md`

GUI 目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveGui-20261027-115753\`

- `prepare.ps1`，17112 字节，`8b5d8d3b9ba40610a0c304d80eb86f55aab60f55020711d652750c686f2e62c4`
- `start.ps1`，75672 字节，`5ba5d3c67d7462fb0e8a42490c8be064762a3dc83c130bd94b60fdb29e91e85e`
- `stop.ps1`，7128 字节，`3818bb48bba7e8f1d0735e6394f01340972007a01d4c6d4197530a84abb9fc44`
- `README.md`

## 入口改动

| 方法或区段 | 行范围 | 改动 |
|---|---|---|
| 模块头与常量 | `1-132` | 新入口标题、预置格式、M0002 目标、唯一新增 remove 路由和 setup 账本 |
| `Firewall.__init__`、`_record` | `851-930` | 分离 ASGI/TCP 账本，增加移除前后与 GUI 重开状态 |
| 文本和原生基线 | `1291-1361` | case 内文本身份、三材料快照和无来源原件复制检查 |
| `finish_setup` | `1362-1424` | 校验 current3、R01、M0002=`scope-out.txt`，保存原生基线 |
| `_verify_pre_remove_state` | `1425-1439` | 原生执行前重验案件、任务、来源、索引、引用和文本 |
| `_verify_post_remove_state` | `1440-1527` | 校验墓碑、派生文本缺失、其余两行不变、R01 存活、外部来源不变 |
| `_validate_public_materials` | `1528-1578` | 真实公共列表必须依次为 3 和 2，身份逐项一致 |
| `_claim_case`、`_claim_import` | `1825-1915` | setup 后只允许一次同案导航重开；任何导入拒绝 |
| `_claim_remove` | `1916-1955` | 仅当前案、仅 `["M0002"]`、无查询、无额外字段、单次原子 claim |
| `_claim_get`、`_policy` | `1956-1990`、`2214-2232` | 保留原严格 route，仅增加 remove 分派 |
| `_complete_case`、`_complete_remove` | `2241-2277`、`2328-2357` | 记录 GUI 重开；只接受原生 M0002 成功信封 |
| `_complete_get`、`_complete` | `2358-2448`、`2654-2710` | 真实列表由响应校验，未伪造；完整 inflight 清理 |
| `evidence` | `2711-2794` | `protocol_complete` 要求真实 remove 与移除后列表 2 |
| `_seed_native_asgi` | `2908-2993` | listener 前经同一 Firewall 执行 case/open 与两次 import |
| `_serve` | `2994-3393` | setup 前置、ready 证据、recycle 拒绝、自然关闭和不启动 OCR/Retainer/Office |

## 依据与验证

### 固定身份

- B HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 源 pins：`da2763bc9e723bb31baced46c608b70dc696b57ae3f426c0be6580af4e6b906f`
- 源项：347
- A 项目：`D:\Lawbeach\lawbench-A`
- A 编译 runtime head：`a23271abee333a9a256fd46a3141da16975c2380`
- private build manifest：`1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae`
- guard：`cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130`
- resolver：`1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208`

三份 GUI 脚本只改入口路径、入口字节/SHA、`RUNS_ROOT` 和预置格式标识。A 项目、25 个 private output pins、18 个 legacy pins、guard、resolver、PDF 与资源、E50 当前依赖、600 秒上限和 relay 脱敏均未改。

## 已执行命令与退出码

以下均为 PowerShell 7.6.5 下的只读检查，shell 为执行令指定 `pwsh.exe`：

| 命令类别 | 结果 |
|---|---|
| 读取执行令、事实索引、协作规则、契约、UI、materials、基线与脚本全文 | 退出码 0 |
| `E:\Git\cmd\git.exe status --short --branch --ignore-submodules=all` | 退出码 0；原 dirty 改动与未跟踪证据保留 |
| `E:\Git\cmd\git.exe rev-parse HEAD` 与 `--abbrev-ref HEAD` | 退出码 0；HEAD=`dc56a93be4b07dbe7a48863e3135351659817fb5`，分支 `line-B` |
| `Get-FileHash`、`Get-Item`、`Get-Content`、`rg` 静态核验 | 退出码 0 |
| 三组 `git diff --no-index` 脚本比较 | 命令正常返回；因文件存在预期差异而按 Git 语义返回 1 |
| 基线文件/新旧脚本差异审阅 | 差异仅含本报告列出的允许改动 |

另有一次候选路径清单 `Get-Item` 返回 1，因为按执行令简称在仓库根查找 `ui\folder-actions.ts` 与 `ui\materials.tsx`，实际路径在 `dsh-ext\ui\`；随后用 `rg --files` 定位并重新读取，未影响文件。

启动层误用记录：

- 两次并行检查误选 `bash` 启动壳，MSIX 包装器在执行前拒绝，未运行目标命令，未产生文件变化。
- 两次检查误用短名 `pwsh.exe`，进程创建阶段报目录名称无效，未运行目标命令，未产生文件变化。

这些启动失败均已在后续改用完整 `pwsh.exe` 路径重做。无 parser、AST、Python、Node、HTTP、Vitest、tsc、pytest、collect、selfcheck、build、prepare、serve、probe、GUI、model、install 命令运行。

## 未做与当前结论

`RUNTIME_NOT_RUN`。根目录尚未运行有限探针；实际 GUI 删除流程尚未执行；取消动作、第二次确认、真人动作时确认和最终 UIA 证据均待 root。

当前不宣布 whole T32、项目、Gate1、打包或生产验收通过。若 M0002 在真实 seed 中不指向 `scope-out.txt`，应保留 run 根并记 fixture 红，不扩权、不放宽断言、不改产品。

## 下一步建议

root 先按两份 README 审阅并核对三组脚本反向差异，再为一个新 run 根运行 20 秒有限探针。探针自然关闭且 final 通过后，必须另建全新根执行 GUI，不得复用探针根。

GUI 第二次点击完成后，在实际确认框出现的时点按 computer-use rule1 向人取得动作许可。人选择“移除引用”后，再收集原生请求、索引墓碑、列表 2、外部三 TXT 字节/mtime、UIA/截图和自然清理证据。

删减轮：读者 0 / 槽位 0 / 半句 0 / 重复 0 / 过程 0 / 黑名单 1

Response ID: `B-T32-reference-remove-GUI-20261027-115753`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T32-reference-remove-GUI-20261027-115753.md`
