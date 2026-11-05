# B 交回：T18 导航输入绑定修复

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

任务：`B-T18-navigation-native-20261030-020000`

执行令：`D:\Lawbeach\lawbench-coord\B-T18-navigation-input-binding-order-20261030-021640.md`

证据说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\NavigationNative-20261030-020000\input-binding-fix-20261030-021640.md`

## 交回结果

已按正式执行令完成有界静态修复：

- `native-navigation.mts` 的 `verifyNavigationFixedInputs` 改为读取实际 8 行批准数组，验证精确唯一路径及 path/bytes/SHA/mtime 固定身份，并只在返回的本地清单中派生五份材料的 `relativePath`。该函数已增加一个 `export` 供 root 有限复用。
- `b-service-navigation.py` 的 `approved_navigation_inputs` 改为读取同一 8 行数组，按 task、Skill、notes 和五份 TXT 的 canonical path 绑定全部身份；其他服务逻辑未改。
- `literalfixed-inputs.json` 仅更新 `consumer` 与 `bService` 的 bytes/SHA。

整个清单与蓝图的静态逐行差异只有这两个 self/companion 行的四个标量。批准输入、根蓝图外部输入、旧 README/旧交回件、产品、Skill、契约、测试和当前私有运行目录均未修改。

## 最终身份

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-navigation.mts` | 176203 | `343470287d428f917b9eca0315da1c3995eb2e1fce17dbcede6b0becbac192af` |
| `b-service-navigation.py` | 58754 | `bae68496aabbbdc3dcc6951beec4942908aeaa99133b986f56cddbdd43906e69` |
| `literalfixed-inputs.json` | 13079 | `25c9d2e41a8b4e99d944f32cefa0d05b68cadd9350073da42b1fed66e2323e7b` |

当前证据目录仍没有 `run-*` 私有运行目录。

## 未运行与交接

本轮 Node、Python、类型检查、测试、构建、AST/解析、import、HTTP、产品服务、原生 Session、AgentLoop、模型、GUI、进程探针、凭据读取均为 0。没有运行 PASS；静态修复不等于输入绑定或原生场景通过。

root 下一阶段仍须按执行令独立审看，并执行有限输入绑定验证及一次实际导航运行。作者在写入本文后停止。

## Git 与执行环境

Git 全程只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未修锁、扩权、改审批/ACL 或拆 writer 锁。

成功命令均显式使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe` 且 `login=false`。本轮另有 4 次并行读取误填 `shell=bash`，均由 MXC/访问控制在启动前拒绝，未执行命令或产生结果；其中一次为 packaged MSIX `bash.exe` 不能在 sandbox 启动，其余为 `Bash/E_ACCESSDENIED`。
