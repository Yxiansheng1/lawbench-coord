# A 线 T34 设置启动私有配置交回

状态：`SOURCE_ONLY_CONFIG_READY_FOR_ROOT_REVIEW`。本交回只提供一份数据配置，不是 T34 PASS，也不是私有构建或业务验收结果。

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 在令定新目录交付冻结 builder、数据配置和短 README；配置只改证据根与 Host 树的两个 pin 值。 |
| 目标是什么 | 为根执行器复核后的一次全新私有 25-output 开发编译准备当前 Host 源码配置。 |
| 在等什么 | 等根执行器完成全配置逆变换和边界审查。收到复核通过信号后，再由新令执行一次私有构建。 |
| 卡在哪 | A 线没有交付卡点。Git dirty 全树查询被仓库外子模块元数据权限拒绝，未修锁、扩权或改 ACL。 |

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T34-startup-private-config-order-20261030-141828.md`
- 交付目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupPrivateBuild-20261030-141828`
- 批准输入：`D:\Lawbeach\lawbench-coord\T34StartupPrivateInput-20261030-141828\approved-inputs.json`
- 旧配置数据：`D:\Lawbeach\lawbench-coord\T34StartupPrivateInput-20261030-141828\old-config-data.json`
- 冻结 builder 为 32121 bytes，SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。
- 旧配置为 20467 bytes，SHA-256 `15c563d06618571f420423d87d1521ddd00f0aff351b433c0c4f26c416254046`。
- 新证据根为 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupPrivateBuild-20261030-141828`。
- Host 树 pin 从 `186034 / e946b4618f02b90154205d5794db077a6e0da6dc31727b611bf61e5e9ce19a80` 改为 `188418 / 3dbe7d097306c8e1734fa458e4f3889cd2f89e9f776b5d6f6935392bcecf73b3`，files 保持 20。
- Host 新树相对旧树只有 `index.ts` 变化：61281 / `da96a5e012b746da5204210188bf8f331bb1049e7436edfb859e162e0b18806f` 变为 63665 / `cb3679ae85ea6b4f56406b5cbb1e01c1fe0e4739bb22d0ccf05cd4c7ac8fbf83`。
- 其余 17 棵树、39 个文件 pin、14 个引用 pin、25 个输出定义、53 个总 pin、metadata、schema hash、模型参数和 legacy 18-tree 结构未改。
- 既有当前 Host 单元快照为 8 项定向通过、0 失败；总口径仍为 `whole_T34_PASS=false`、Packaging HOLD。
- 交付 README：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupPrivateBuild-20261030-141828\README.md`

## 未做与降级

- 未创建 `private-output-*`，未准备 GUI，未替换默认库，未改产品、测试、SDK 或旧 served root。
- 未运行 Node、Python、AST/parser、import、测试、类型检查、构建、prepare、app、HTTP、模型、DPAPI、环境 Key 或进程探测。
- 作者运行计数为 runtime 0。
- Git 全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

## 非零

1. `git status --short --untracked-files=all` exit 1：仓库外子模块元数据
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied。该权限拒绝不是产品测试失败，也未尝试修复。
2. 一次只读列目录误填 `bash`，运行器以 `Bash/E_ACCESSDENIED` 在执行前拒绝，exit 1；没有启动 bash/cmd，没有文件或状态变化。后续命令均使用指定绝对 PowerShell。

## 下一步建议

根执行器先复核三份交付文件、旧配置三值逆变换、当前 Host 全树摘要和既有 dirty；确认后另发新令，只执行一次新 `private-output-*` 的 25-output 开发编译与后续精确 GUI pin 核对。

删减轮：读者 0 / 槽位 0 / 半句 1 / 重复 1 / 过程 1 / 黑名单 0

Response ID: A-T34-startup-private-config-20261030-141828
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-startup-private-config-20261030-141828.md`
