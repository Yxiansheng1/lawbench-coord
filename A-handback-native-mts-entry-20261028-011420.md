# 原生入口副本已交回，预检仍待 root 执行

状态：`HANDOFF_ENTRY_READY_NOT_RUN`。本次只新增精确字节副本和两份说明，没有运行任何消费器或验证程序。不能据此宣称 no-Key preflight、完整对话、GUI 或 T31 已通过。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增 51,654 字节的 `.mts` 精确副本，完成逐字节核验，并写入口说明与本文。未改旧源码或其他文件。 |
| 目标是什么 | 用既有 tsx 对 `.mts` 的标准 ESM 识别消除入口模块格式灰区，让 root 可以独立复核并实跑 no-Key preflight。 |
| 在等什么 | 等 root 复核三件产物后实跑 `--preflight-only`；通过信号是预期的 no-Key 报告、两次固定输入准入、自然清理、0 网络和正常退出。通过后再决定是否安排 Key 就绪后的完整四轮运行。 |
| 卡在哪 | 本次交付未被卡住。普通 Git 状态因 `dsh` 子模块目录权限拒绝返回 1，后续只用忽略子模块的只读口径核对，没有修权限、锁或审批。 |

## 交付范围

本次仅写以下三个新路径：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-mts-entry-20261028-011420.md`
- `D:\Lawbeach\lawbench-coord\A-handback-native-mts-entry-20261028-011420.md`

旧 `.ts`、固定清单、README、旧说明、旧交回件、工单集、产品源码、配置、loader、tsconfig、SDK、运行时、pin、测试和锁均未改。未创建 `package.json`、类型边界或新 loader，未联系其他聊天，未更换 API，未启动子代理。

本次没有 Git 提交。Git `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 和 `push` 全部未执行。

## 依据与验证

- 原文件和新文件均为 51,654 字节，SHA-256 均为 `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93`。
- 原文件与新文件逐字节比较相等；新文件无 BOM。副本没有内容修改、断言弱化、提示修改、fork 路径修改或历史替换。
- 上游说明为 3,932 字节，65 个 LF、0 个 CRLF、无 BOM，SHA-256 为 `79d73164f5a903e9111595bf1cbea26a3fd9aed16f2c3b5c448f7a7527491be0`。
- 上一轮 `010748` 正式账为 33 个命令条目，其中 29 个退出 0、4 个非零，运行时执行为 0；已完成两个精确替换与全文重建核对，46 项冻结输入已重新核对。
- 当前源码仍保持上一轮修订后的哈希，说明本轮复制前源码未变。
- root 的 `011259` 实跑已在产品 `main`、Context、Key 和 HTTP 之前退出，首要错误是 CJS 输出不支持顶层 await，定位在 `.ts:1452`。原始观测为网络 0、Key 0、HTTP 0、GPU 0、Node 自然退出码 1、0.891 秒；未捕获操作系统可执行文件身份和出生信息，不宣称完整身份。
- 历史原始消费器的正确值为 39,711 字节、SHA-256 `24d9458aa87f07f35bf9c7851bc0104e01be4b05372d12a66b0df5c4eccc8c73`。旧说明中的值少一个字符，按令保留旧历史。
- 开工前后按默认未跟踪目录折叠口径的 dirty 清单均为 195 行。三件新增物没有改变该目录级清单；其中两个仓库内文件位于既有未跟踪证据目录，另经直接路径元数据与哈希核对。
- 普通 `git status` 的原始非零输出为：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`，随后 `fatal: 'git status --porcelain=2' failed in submodule dsh`。

## 实际命令账

全部 Shell 均使用显式原生 PowerShell、`login=false`，工作目录为 `D:\Lawbeach\lawbench-A`；没有 bash 包装。命令账共 12 个可执行条目。

- C01 `Get-Content -Raw -LiteralPath <执行令>`：退出 0，完整读取执行令。
- C02 对源文件、三个目标路径和协调输入目录做存在性、字节、SHA-256、mtime 静态扫描：退出 0；三个目标当时均不存在，源文件匹配执行令。
- C03 普通 `git status --short --untracked-files=all`：退出 1，原始权限错误见上。
- C04 只读 `git status --short --untracked-files=all --ignore-submodules=all`：退出 0。
- C05 用 `rg --files` 查协调目录中的 `010748`、`011259`、`native-mts` 和 handback：退出 0。
- C06 用 `rg --files` 列出证据目录：退出 0。
- C07 完整读取上一轮正式说明、上一轮交回件、同内容证据副本和旧 README：退出 0。
- C08 仅在目标不存在时执行 `Copy-Item`，随后比对长度、SHA-256 和每个字节：退出 0，字节完全一致。
- C09 完整读取 `formal-report` 与 `cn-prose` 两个 Skill：退出 0，只用于文稿表达。
- C10 对入口、说明、旧基线执行静态核对，并先以 `--untracked-files=all` 与目录折叠基线比较：退出 0；比较口径不一致，形成 1,412 个新增和 62 个缺失的无效差异，不作为检查结果。
- C11 按旧基线完全相同的默认未跟踪目录折叠口径重取 `git status --short --branch --ignore-submodules=all`：退出 0；前后均为 195 行，0 个目录级差异，两个新文件仍由直接路径核验。
- C12 本文写入后对三件产物做存在性、字节和 SHA-256 只读回查：退出 0；三件均存在，两件仓库内文件与上述读数一致。

写入账共 3 次：

- W01 用 `Copy-Item` 新增 `.mts` 精确副本。
- W02 用 `apply_patch` 新增入口说明。
- W03 用 `apply_patch` 新增本文。

没有其他文件写入。C10 的无效比较只读，未触发补偿写入。

## 未做与降级

- 未运行 Node、tsx、TypeScript、解析器、导入、测试、tsc、HTTP、模型、Key、GUI、SSH、构建或自检。
- 未生成 no-Key 或 Key 运行报告，没有真实清理、模型答案、请求计数或四轮结果。
- 未修 `dsh` 权限、`index.lock`、ACL、审批、沙箱或 writer 锁，也没有尝试扩权。
- 本次只是入口模块格式改道的静态交付，不是产品运行证据。

## 下一步建议

root 先读入口说明并核对 `.mts` 哈希，再用既有 Node 和既有 tsx CLI 独立执行 `.mts --preflight-only`。出现新的真实错误时保留首要证据；no-Key 通过前不进入完整对话，Key 就绪后再安排新鲜个人测试 Key 的四轮运行。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 1 / 黑名单 1

Response ID: chat reply
Response log path: chat reply
