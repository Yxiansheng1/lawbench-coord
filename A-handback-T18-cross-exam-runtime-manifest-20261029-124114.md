# T18 Cross-Exam Runtime Manifest 交回

执行令：`D:\Lawbeach\lawbench-coord\A-T18-cross-exam-runtime-manifest-order-20261029-124114.md`

状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`

作者运行时：Node、Python、AST/ESM、源码执行、测试、构建、HTTP、模型、GUI、SSH 均为 `0`；未读取或使用凭据。本轮只做文本编辑、只读文件比较和 SHA-256 计算。

## 交付目录

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamCallbackRecovery-20261029-122319`

最终文件身份：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-cross-exam.mts` | 129399 | `6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454` |
| `literalfixed-inputs.json` | 12276 | `b802114960025acbd28a567289c6ff066524fd6953142b622e972ab732acc03c` |
| `verify-callback-finite.mts` | 35283 | `a3a3bd8158f58468ada592134ff98ed08fc363a39327d17fc097f17538f1f6b2` |
| `README.md` | 8892 | `9962e397c364f73990cc8fb6225667aa14cd614a15fbaaafa6f23ff5a48a355f` |
| `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |

`b-service-cross-exam.py` 未改，仍与输入快照逐字节相同。

## 完成的修改

1. `native-cross-exam.mts` 只将两条 compiled import 从旧
   `ContractDraftQuestionPrivateBuild-20261029-045644\private-output-20261029-050141`
   改为当前
   `CrossExamQuestionPrivateBuild-20261029-122319\private-output-20261029-123906`。
   与 `290d…` 快照逐行比较只有这 2 行删除、2 行新增；旧私有构建路径计数为 0。

2. `literalfixed-inputs.json` 从 `full-native-baseline.json` 的完整 `67b0…` schema
   恢复为 12,276 字节。format、task、hashAlgorithm、8 个 canonical 输入、26 项
   dependency、3 项 runtimeExecutable、源 pin 和授权答案保持原值；只更新当前
   consumer 的路径/129399/新 SHA、当前 B 服务路径，并换入 approved 文件中的 4 个
   compiler-private 精确路径、字节和 SHA。旧编译构建路径计数为 0。

3. `verify-callback-finite.mts` 将当前 consumer 与完整 manifest 改为静态 literal
   pin，逐项校验 26 项 dependency 和 4 个 approved compiler-private pin，并校验
   consumer、B 服务及 header/count。全文反向还原现覆盖 9 个目标：原有 7 个
   callback/count 目标加 2 个 compiled import，还原后必须等于旧 `1a6…` 全文。

4. 有限测试加载的真实 AST `user-questions/request` 箭头函数保持原文本，由
   `(question) => callback` 的每次调用工厂显式建立词法绑定；`invokeCallback`
   每次创建独立闭包，不存在共享顶层 `question`。原有 bad->valid RED、
   10 个 invalid controls、commit-once、repeat-after-commit、并发单次读取和
   读失败清锁重试均保留。

5. README 已更新最终身份和全量 ledger 说明，并纠正历史 OS 口径：旧实际运行
   `run-zMFEDU` 是 7 个完整 OS 身份 gone；unit5 的 4 个完整身份加 1 条
   `types`/`ntdll.dll` 记录属于另一运行，未混写。

## 只读核验

输入快照目录：

`D:\Lawbeach\lawbench-coord\T18CrossExamRuntimeManifestInput-20261029-124114`

- 原 Native 快照：`290d8bb50e271753bdbd01f77e507753caf72de97c1e3e9a95f7662e105668c2`
- 全量基线：12,272 字节，`67b0d5634e6a5182917ff27eb13fcc83c6672d0566e86a6d810a863201f66865`
- 最终 Native 对快照：差异行总数 4，旧侧 2、新侧 2。
- 最终 manifest 对基线：差异仅位于 approved compiler-private 四行和 consumer/B 服务身份区；终态含 5 个 material 名称、26 个 dependency role、4 个当前 compiler-private 路径、3 个 runtimeExecutable。
- `b-service-cross-exam.py` 最终 SHA 与输入仍为 `aa428e…22d`。

以上均为静态文本事实，不是有限测试、ESM、编译、模型运行或质量通过声明。

## 边界、Git 与阻碍

- 未联系其他聊天，未更换 API，未启动 setup/legacy，未修改沙箱、审批、ACL、权限或 writer 锁。
- Git 严格只读：未执行 add、commit、rebase、stash、reset、clean、checkout、push，也未暂存任何文件。分支 `line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`。
- 普通 `git status` 在既有 `.git/worktrees/lawbench-A/modules/dsh` 处 Permission denied；使用 `--ignore-submodules=all` 后确认目标目录 5 个文件均为未跟踪，缓存区对该目录为空。全仓既有 dirty 保持，另有大量 `Filename too long` 只读警告。以上均未修复、未清理。
- Git index/permission 拒绝不构成本次交付阻碍，未尝试 Git 写入或扩权。
- 命令审计：前稿记录一次只读命令误选 bash；本轮接续又有两次同类误选，均由运行器在命令执行前以 `BASH/E_ACCESS_DENIED` 拒绝，未产生读写。其余实质命令均使用原生 PowerShell；初段另有一次 PowerShell 管道闭合 ParserError，同样未执行文件操作。

## 交回后的根步骤

本作者到此停止。根下一步仍是实际有限验证、ESM/作用域绑定检查和 514 准入；全部通过后，才启用一次同 canonical 被告的实际模型链路，并完成 report/manual/JSONL/OS 闭环。作者结果不得替代根复核。
