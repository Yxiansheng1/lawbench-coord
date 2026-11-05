# 条款前缀运行时冻结稿已交回

结论：指定源码已作为静态冻结稿交回，条款前缀运行时未执行。当前正确状态是 **source-only / NOTRUN**，不是运行通过。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 核对三份冻结源码、同名协调快照、批准件和旧 preimage；反推两组源码常量与清单三对象；新增证据说明和本交回件；没有改动源码。 |
| 目标是什么 | 主编排在本进程终止后独立复核全部源码和原始证据，再决定是否有权进行后续验证。运行时验收尚未开始。 |
| 在等什么 | 等本进程结束且两份指定文档落盘；信号满足后，由主编排读取本交回件，复核冻结源码、旧失败证据和 dirty 状态，再决定下一步。 |
| 卡在哪 | 文档交付没有卡点。只读 Git 的普通视图因子模块权限报错，显式忽略子模块后成功；另有既有 Windows 长路径 warning。按令不修复、不扩权、不启动 setup。 |

## 依据与验证

- 执行入口：`D:\Lawbeach\lawbench-coord\B-T18-clause-prefix-runtime-finish-order-20261029-060112.md`
- 冻结清单：`D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeFinishInput-20261029-060112\frozen-three.json`
- 证据说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftClausePrefixRuntime-20261029-055659\README.md`，8118 字节，SHA256 `e0f2b34ed82ae94af8c9891b0d9cd1e34c1b747ee170d7036e03cfe968d194d0`
- 批准件：`D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeInput-20261029-055659\reviewed-b-source-pins-clause-prefix.json`，53548 字节，SHA256 `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`
- 旧停摆记录：`D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeFinishInput-20261029-060112\root-prior-stop.json`
- dirty 快照：`D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeFinishInput-20261029-060112\B-dirty-before.txt`

三份冻结源码与协调快照同名文件逐字节一致：

| 文件 | 字节数 | SHA256 |
|---|---:|---|
| `native-contract-draft.mts` | 106245 | `296ff353ff31aea1ff357f4266308ab6f9c9a6766a230b4bf5129266a44cf67e` |
| `b-service-contract-draft.py` | 45468 | `2f25915f5cd549ae373d187b8e49f9b8d0f1af7fb81e249c2f46043de723c164` |
| `literalfixed-inputs.json` | 10781 | `d30f643cd18537c3b1e950e77936ecce0158c8d3a9559d34d7a2c4ae7c64f6be` |

旧输入 preimage 的身份为：

| 文件 | 字节数 | SHA256 |
|---|---:|---|
| `native-contract-draft.mts` | 106236 | `bf32c30e5db712b47562777fbdf53609870c2082ac0bff5ebc6aa0678ce9edbc` |
| `b-service-contract-draft.py` | 45459 | `3f27074c34033b03c38b3d97d6534f600de12fdfac690ce9e391c4a3feeba34e` |
| `literalfixed-inputs.json` | 10764 | `f95d9914a0731cbedf5dc74337c7ad4309c9cf85bd1c8aa4f07b20f4974fc70` |

## 源码反推

`native-contract-draft.mts` 只改了两条值：

| 常量 | 旧值 | 新值 |
|---|---|---|
| `SOURCE_PINS_PATH` | `D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\reviewed-b-source-pins-two-rate.json` | `D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeInput-20261029-055659\reviewed-b-source-pins-clause-prefix.json` |
| `SOURCE_PINS_BYTES` | `53548` | `53548`，未变 |
| `SOURCE_PINS_SHA256` | `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379` | `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97` |
| `SOURCE_PINS_ENTRIES` | `346` | `346`，未变 |

`b-service-contract-draft.py` 的 `SOURCE_PINS` 由目录片段与文件片段拼成；旧值分别为：

`D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747`

`\reviewed-b-source-pins-two-rate.json`

新值分别为：

`D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeInput-20261029-055659`

`\reviewed-b-source-pins-clause-prefix.json`

字节数保持 `53548`，条目数保持 `346`，SHA256 从
`2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379`
改为
`3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。

## 清单三对象反推

| 对象和字段 | 旧值 | 新值 |
|---|---|---|
| `sourcePins.path` | `D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747\reviewed-b-source-pins-two-rate.json` | `D:\Lawbeach\lawbench-coord\T18ClausePrefixRuntimeInput-20261029-055659\reviewed-b-source-pins-clause-prefix.json` |
| `sourcePins.bytes` | `53548` | `53548`，未变 |
| `sourcePins.sha256` | `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379` | `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97` |
| `consumer.path` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\native-contract-draft.mts` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftClausePrefixRuntime-20261029-055659\native-contract-draft.mts` |
| `consumer.bytes` | `106236` | `106245` |
| `consumer.sha256` | `bf32c30e5db712b47562777fbdf53609870c2082ac0bff5ebc6aa0678ce9edbc` | `296ff353ff31aea1ff357f4266308ab6f9c9a6766a230b4bf5129266a44cf67e` |
| `bService.path` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\b-service-contract-draft.py` | `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftClausePrefixRuntime-20261029-055659\b-service-contract-draft.py` |
| `bService.bytes` | `45459` | `45468` |
| `bService.sha256` | `3f27074c34033b03c38b3d97d6534f600de12fdfac690ce9e391c4a3feeba34e` | `2f25915f5cd549ae373d187b8e49f9b8d0f1af7fb81e249c2f46043de723c164` |

逐行静态比对未发现清单其他对象变化。

## 保留项

批准摘要记录 source-pin 共 346 行，只有 `service/lawbench/checks/citations.py` 一行变化：旧 18609 字节、SHA256 `b67779ba41e35e2b6780a7b74ebe061e143a79dd5b8c97273329ae91059748758`；新 19642 字节、SHA256 `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412`。其余 345 行保持。

冻结输入清单中的批准输入保持 1286 字节、SHA256 `1266d329ae41e193f81b2ae0ae6cbd94ee285ad1444db5e03c738de3cb7a7b49`；契约起草 Skill 保持 13469 字节、SHA256 `92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912`；私人构建证据保持 25 项。

令中指定的断言、提示词、三次回答、未知 ID 拒绝、provider 49152、32 模型、48 工具、guard、finally、批准 5 项与 Skill 92bd 等既有内容均未重跑。主编排此前的有限 8 项验证保留为 PASS；本次没有重演。当前实际根运行时状态为 NOTRUN。

## 计数与停摆

前次执行保持 failed，退出码 `4294967295`，共 44 条命令：38 成功、6 非零、作者运行时 0，正式交回缺失。停止发生于任何运行时或 DPAPI 调用之前；非机密元数据与驱动读取记录保留，未读取明文凭据，原始证据未改动。

本执行者含最终静态回读共 33 条 shell 命令：30 成功、3 非零、运行时 0。三条非零均在开工静态定位阶段：一次按规定目录读取冻结清单时路径不存在，转到令中指定快照目录后找到；两次 PowerShell 管道语法错误，未写文件、未运行源码。另有一条哈希命令使用了拼写有偏差的显式 shell 路径，命令本身成功；随后已用令中准确路径重做同一只读哈希，两次均计入总数。

## 工作区保全

本执行者没有执行任何 Git 写操作，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。

用 `--no-optional-locks` 和 `--ignore-submodules=all` 读取的 porcelain 视图与 5797 行既有 dirty 快照逐行完全相等，退出码 0。最终回读只允许新增证据说明一个未跟踪文件，其他行不得变化。

普通只读 Git 状态在子模块 `modules/dsh` 遇到 `Permission denied`，退出码 128。显式忽略子模块的只读视图成功，但保留仓库既有的 Windows 长路径 warning。按令不修权限、不改锁、不扩权、不启动 setup、不切换 legacy，也不把 Git 或权限问题当成交付阻碍。

## 未做与降级

未运行 consumer、root driver、模型、HTTP、Key、DPAPI、环境、凭据、SSH、进程探测、解析器、Node、Python、导入、检查、测试、构建或 GUI；未创建包装器、框架或第二 writer；未联系其他聊天，未更换 API，未修改 MTS、Python、清单、产品、Skill、测试、pin、运行时或旧证据。

因此，本交回件只能证明冻结文件的静态身份、改动范围、dirty 保全和旧证据计数，不能证明条款前缀运行时可用。

## 下一步建议

当前无需人工作业。主编排应在本次执行进程结束后读取本交回件和证据说明，独立复核三份源码、批准件、旧失败原始证据与 dirty 快照；复核通过后，再由主编排决定是否按其职权另行启动验证。信号是本进程结束且两文存在；若任一文件缺失或哈希不符，应停止，不进入运行。

Response ID: 未提供（本执行器未收到可见响应 ID）

Response log path: chat reply

文风删减轮：读者 1 / 槽位 0 / 半句 2 / 重复 2 / 过程 1 / 黑名单 0
