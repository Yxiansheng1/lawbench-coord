# B 线 T18 Mainline Cycle 1 绑定交回

- 状态：`AUTHORED_NOT_RUN`
- 范围：`OWNER_MAINLINE_CYCLE1_FIXED_SOURCE_BINDING_ONLY`
- 执行身份：`deepseek-v4.1-flash-1017` / `max` / `cwdB`
- 业务运行：`ZERO`
- 案件执行：无。作者未运行实际案例、模型、HTTP、GUI、测试、构建、探针或自检。
- Git：严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，未暂存、未提交。

## 新建文件与最终绑定

| 文件 | 字节 | SHA-256 | 原始替换计数 |
|---|---:|---|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18MainlineCycle1-20261101-105907\native-defense-opinion.mts` | 156887 | `c8d843ff7f3d66204b5235c53e1634d27f39d336c4037100e9f24815e9c341ac` | `1,1,1` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18MainlineCycle1-20261101-105907\b-service-defense-opinion.py` | 53711 | `1de5352685d5bc8cf8c25eb421eaddb0fb89ed69431a7dd846dffb27f8ed6c13` | `1,1,1` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18MainlineCycle1-20261101-105907\literalfixed-inputs.json` | 12014 | `333b427e5478b07de147c371c7b149464844c190d9d50c3201becb4316dc066c` | `1,1,1,2,2,1,2,1,1,1,1` |

三个文件均从批准的 `before` 字节复制，仅执行批准清单中的逐项字面替换；每项替换前均核对精确出现次数。写盘前的内存大小与 SHA-256 以及写盘后唯一一次最终原生大小与 SHA-256 核对，全部命中批准值。

## 绑定内容

- `APPROVED_INPUTS` 路径、字节数与 SHA-256 头绑定更新为：
  - 路径：`D:\Lawbeach\lawbench-coord\T18MainlineCycle1-20261101-105907Input\approved-inputs.json`
  - 字节数：`2217`
  - SHA-256：`2e6b9e6da29f57ba7843c0111c0b392a4e464da8f91bb835bf2417fe8c631ce6`
- `literalfixed-inputs.json` 的当前 Skill、批准输入与自身证据描述已按批准清单更新：
  - Skill 字节数：`20018`
  - Skill SHA-256：`44cd01606577963da6dca861521d3af9af1e1337c0043cfc08e4863d720f08df`
  - Skill mtime_ns：`1793501660789086200`

## 不可变项

- 原业务函数、模型、`49152` 预算、`temp 0.6`、模型调用上限 `32`、工具调用上限 `48`、提示词、材料、答案与清理逻辑未变。
- 当前编译 Agent 与 Host 的固定描述未变：Agent `0cec...3264`，Host `c201...72b4`。
- B 线 `346` 项源码固定描述、守卫、断言与处置逻辑未变。
- 新批准的 `approved-inputs.json` 与已准备的快照数据未被本执行者修改。

## 偏离与遗留

- 文件内容偏离：无。
- 业务运行偏离：无，业务运行时间为零。
- 操作记录：唯一一次最终原生大小/SHA-256 只读命令的 `shell` 选择字段误写为 `native-powershell\pwsh.exe`；命令仍成功返回 PowerShell 输出。该误写没有触发 setup、沙箱或审批切换，没有修改 ACL，没有拆分 writer 锁，也未执行任何 Git 写操作。
- 遗留：按令由根会话在真实单案例前完成完整 inverse、复核、pin 与执行；本执行者不运行该案例。
