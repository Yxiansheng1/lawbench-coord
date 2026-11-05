# B 交回：T18 合同起草引用运行时静态候选

日期：2026-10-29

执行线：B

状态：`AUTHORED_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已从 `ContractDraftCurrentRuntime-20261029-050335` 原样复制三份冻结输入，只更新批准输入和四个清单对象。三份结果可逐字节反演回旧输入，静态核对通过。 |
| 目标是什么 | 把已批准引用措辞 Skill 接到当前编译器身份。距终门还需要 ROOT 全源复核、准入，以及一次同原 canonical 场景的真实模型运行。 |
| 在等什么 | 等 ROOT 对三份新文件全源、命令、pins、AST/ESM 和当前五项目给出准入；准入后由 A 线装配并执行一次完整真实运行。 |
| 卡在哪 | 本轮没有停摆。旧子模块目录权限拒绝标准 Git 状态读取；按令保持只读，不修锁、不扩权。 |

## 依据与验证

正式执行令：

`D:\Lawbeach\lawbench-coord\B-T18-contract-draft-citation-runtime-order-20261029-052404.md`

详细证据：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\README.md`

ROOT 批准输入：

`D:\Lawbeach\lawbench-coord\T18ContractCitationClarityInput-20261029-051904\approved-sample-and-skill-current.json`

批准输入实物为 1286 字节，SHA-256 为 `1266d329ae41e193f81b2ae0ae6cbd94ee285ad1444db5e03c738de3cb7a7b49`。

新文件身份：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-draft.mts` | 106236 | `bf32c30e5db712b47562777fbdf53609870c2082ac0bff5ebc6aa0678ce9edbc` |
| `b-service-contract-draft.py` | 45459 | `3f27074c34033b03c38b3d97d6534f600de12fdfac690ce9e391c4a3feeba34e` |
| `literalfixed-inputs.json` | 10764 | `342038ae51a38f68aabc639b69eff8ea82d8bbb2277afa62c77e527f57e22fdf` |

冻结输入身份：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-draft.mts` | 106224 | `e971e95930f1325e79278f60c0bf2ca076c1225d56f2a1038d25cb3520767854` |
| `b-service-contract-draft.py` | 45447 | `a9316a37e7b6396ab098dbbe0ab95398148ff03b0b9a60e8447b4b225b5aa418` |
| `literalfixed-inputs.json` | 10750 | `690a88654f53ac5b17d75afad472ea1fff4af064ff29713ce589352c992496e4` |

## 精确改动与反演

`native-contract-draft.mts` 只替换 `APPROVED_INPUTS_PATH` 和 `APPROVED_INPUTS_SHA256`。字节数保持不变。把新路径和新 SHA 反向替换后，恢复 106224 字节及旧哈希 `e971e959…7854`。

`b-service-contract-draft.py` 只替换批准路径的两段字符串和 `APPROVED_INPUTS_SHA256`。把三项反向替换后，恢复 45447 字节及旧哈希 `a9316a37…a418`。

`literalfixed-inputs.json` 只改 `approvedInputs`、顶层 `skill`、`consumer`、`bService` 四个对象。顶层 Skill 为 13469 字节、`92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912`、mtime_ns `1793222466213523100`。把这四个对象反向替换后，恢复 10750 字节及旧哈希 `690a8865…96e4`。

`sourcePins`、两份 materials、四条 `compilerPrivate`、依赖数组、runtime executables、其余行、分组、顺序和空白均保持。依赖数组中的 `contract-draft-skill` 旧身份行按令保留。

## 验证边界

`AUTHOR_RUNTIME=0`。没有执行产品源码、Node、Python、tsx、解析、导入、AST、ESM、检查、测试、构建、prepare、HTTP、模型、GUI、SSH、密钥、DPAPI 或凭据发现，没有启动或关闭服务。

原始 shell 调用共 40 次。成功退出 30 次，非零 10 次。非零为 2 次错误 shell 启动失败、2 次 PowerShell 解析前失败、1 次 JSON 精确匹配保护、1 次旧运行目录权限拒绝、3 次预期为 1 的只读文件差异、1 次综合核验命令的 PowerShell 引号计算失败。原生 PowerShell 调用 38 次，bash 调用 2 次且未执行命令。

标准 Git 状态读取被旧 `lawbench-B-new/modules/dsh` 子模块路径权限拒绝。本运行器没有 Git 写权限，按令未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，也未尝试修锁、改 ACL 或扩权。

## 保留的旧事实

`run-Xzv31a` 仍为真实 `FAILED`。旧记录显示模型调用 7 次、HTTP 200 共 7 次，两份材料完整读取，必问问题已回答，保存正文 1978 字节、SHA-256 为 `f4d1127350e0fe4d3939ac325d761d0e01588f8afe00bdab9eac50119867b21b`，`citation_check` 为 `citations=0`、`must_fix=0`、`hints=31`。本次没有改写该失败。

source pins 仍为 346 条、53548 字节。当前产品身份 `40ab51`、types 0、私有 25 项、manifest `712f3b68…affc14` 和四条编译私有身份均不变，本次不重建。基线 raw 459 条和有效检查链 `5e53 -> d21 -> b2e -> 40ab` 保持。

## ROOT 后续

ROOT 对最终 40 次原始命令、三份全文及反演进行复核，并完成 pins、AST/ESM、当前五项目准入。随后由 A 线装配，用已保存凭据经匿名 stdin，在独立运行中完成一次原 canonical 真实模型流程。

该流程必须覆盖真实提问、两份材料读取、保存、正文人工事实与引用核对、来源 GET、JSONL、OS 端口关闭和 Key 扫描，不得停在 prepare 或 launch。

Gate 1：`INCOMPLETE`。完整 T18：`INCOMPLETE`。项目：`INCOMPLETE`。Packaging：`HOLD`。

Response ID：`B-T18-contract-draft-citation-runtime-20261029-052404`

Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-contract-draft-citation-runtime-20261029-052404.md`

