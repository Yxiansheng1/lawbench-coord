# A 线交回：T18 质证意见类型字面量修正

状态：`SOURCE_CORRECTED_NOT_RUN`。有界修正已完成，运行次数为 0；等待主编排安排必要验证和一次真实原始任务。

## 交付身份

| 项目 | 修前 | 修后 |
|---|---|---|
| `native-cross-exam.mts` | 127688 字节 / `8c88aaa0eab7fd0fd81e6c7d3141cb08c5f4a8df5b45a67afc3db14e8dab7411` | 127688 字节 / `1a6e5f0c28eb20bc8a7b719805ce48d9ff1fb8ace60f0ac96d2fa3900283e35b` |
| `literalfixed-inputs.json` | 12272 字节 / `264867adb2af48ef71ced7568a8b2a1108837c1c8847ea7c7f2350fe5115cb5f` | 12272 字节 / `67b0d5634e6a5182917ff27eb13fcc83c6672d0566e86a6d810a863201f66865` |
| `b-service-cross-exam.py` | 48345 字节 / `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` | 未改 |

源码只执行了 `D:\Lawbeach\lawbench-coord\T18CrossExamTypeLiteralInput-20261029-115516\root-exact-inverse.json` 规定的单点逆变换：`RunReport.modelRoute.readonly thinking: '高'` 改为 `'中'`。逐字节比较仅出现该字面量的 3 个 UTF-8 字节差异，文件长度不变。输入清单仅同步 `consumer.sha256`，路径、字节值和其余字节保持原意。

## 产物

- 修复说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamNative-20261029-113906\type-literal-fix.md`
- 修正前快照及反向量：`D:\Lawbeach\lawbench-coord\T18CrossExamTypeLiteralInput-20261029-115516\`
- 原始场景证据与未测边界：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamNative-20261029-113906\README.md`
- 既有观察者有限验收原件：`D:\Lawbeach\lawbench-coord\T18CrossExamNativeInput-20261029-113906\observer-accepted.json`

原 main author 的状态、原始证据和失败记录均保留。本次不重演旧开工、安装、调研、全量测试或模型任务；README 中原有的“未测”声明继续有效。

## 验证与未执行

- 已做：指定路径读取、两次文本修改、SHA-256 与字节数核对、`thinking` 位置核对、逐字节差异核对、B 服务身份核对。
- 未做：Node、Python、AST/解析器、导入、类型检查、测试、构建、HTTP、模型、GUI、SSH、环境、Key、DPAPI 和进程探针。
- 因没有执行，本交回不声称语法通过、真实任务通过、草稿质量通过或完整 T18 通过。
- 建议下一步：确认更新清单与两份源码身份后，在不改正文的前提下执行有限验证，并完成一次真实原始任务。

## Git 与阻碍

Git 全程只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，也未暂存。初次 `git status` 因 `dsh` 子模块工作树元数据权限拒绝而失败；随后只使用不递归、无可选锁的状态检查，确认既有 dirty 状态并原样保留。

另有两条只读命令（一次目录查看、一次文件存在性查看）误以 `shell=bash` 发起，均被环境拒绝且未执行；随后改用指定 PowerShell。两项操作未改变任何文件，不构成本次代码交付的阻碍。

