# B 线交回：T18 Defense Read Gate Recovery Binding

任务来源：
`ORCH-B-T18DefenseReadGateRecoveryBinding-20261031-233816.md`

状态：`AUTHORED_NOT_RUN`。有界文件交付已完成，未作任何运行或测试结论。

## 交付

新交付根：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseReadGateRecovery-20261031-233816`

| 新文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-defense-opinion.mts` | 157063 | `1dc2030362eeaf3f2282a8437677e0efd861dc8c6b841a88b4aef70efc3648b5` |
| `b-service-defense-opinion.py` | 53695 | `76c940b6994da9efd18b5f473ddb7229202d1a5c8513c6b1841c3402bd5c96ea` |
| `request-digest-finite.mjs` | 18852 | `c66f6d356f42aff1cecd9f06f59d9031c205c2b52af7a88976404b559b28b4be` |
| `wire-schema-finite.mjs` | 21756 | `73272d3fd8adbc9b089ad57c1e6ea6402a130d297ee224383b3d9cea572f48ea` |
| `literalfixed-inputs.json` | 12010 | `99f1e9ea1ea4a57c78368ba05d44e0df6368c98b5b608a260c29e57211bd3153` |

## 绑定与计数

- 批准源码原样复制：4 个文件。
- 批准清单原样复制为 `literalfixed-inputs.json`：1 个文件。
- 批准字面替换：5 组；实际替换位置依次为 4、1、1、1、1，共 8 处。
- 批准 `compiled_rows`：4 行。
- 旧 MTS 声明的 source-pin 条目数：346；本次未读取、重算或生成 pin 数据。
- 交付载荷总数：5 个。

只有新 `native-defense-opinion.mts` 发生内容变化。替换使用原始字节定位和拼接，每组先核对
精确出现次数，未解析 TypeScript，未改动其他字节、函数、参数、守卫、断言、答案或模型设置。
四份原样文件通过复制操作生成，清单目标名严格为 `literalfixed-inputs.json`。

## 合格步骤

唯一最终元数据命令仅读取五个交付载荷的名称、字节数和 SHA-256。新 MTS 的 157063 字节和
`1dc2030362eeaf3f2282a8437677e0efd861dc8c6b841a88b4aef70efc3648b5` 与批准值完全一致。
字面替换前的出现次数核对也全部符合批准计数。

这不等于运行、编译、测试或功能验收通过。没有执行任何导入、编译、测试、构建、服务、探测、
模型、HTTP、GUI、Node、Python、环境变量或凭据操作。

## 边界与阻碍

旧 served root、旧准入、raw 证据和状态均未触碰；dirty 工作区保持原状。Git 未调用，且没有
add、commit、rebase、stash、reset、clean、checkout 或 push；因此没有 Git SHA。index.lock
与 Git 权限均未处理。

首个目录创建命令因本 PowerShell 的 `New-Item` 不支持 `-LiteralPath` 在参数校验阶段失败；
当时尚未创建目录或写入文件。随后以 .NET 精确路径创建同一新目录并完成上述有界操作。无其他
偏离或遗留执行项。停止于此，不再作额外调研、验证或发送。
