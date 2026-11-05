# B 线交回：T18 质量防御实际运行准备

状态：`SOURCE_PREPARED_NOT_RUN`

执行者：B 线 DeepSeek 执行者  
执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T18QualityDefenseActualPrep-20261031-1810.md`  
交付目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\QualityDefenseActual-20261031-1810\`

## 交付结果

新建目录在开工时不存在，现已准备以下五件文件：

| 文件 | 字节 | SHA-256 / 说明 |
|---|---:|---|
| `native-defense-opinion.mts` | 148641 | `5445f438c63f5113349119bd95da84731a9769fc18dc3d6ffc0b09ad1d122fa9` |
| `b-service-defense-opinion.py` | 53696 | `6dee119fcb6949b2df376445bd2f8f77b28f8f04e8463d40e3546068f5a2b6fd` |
| `literalfixed-inputs.json` | 11686 | 在唯一一次源码哈希/大小清点后仅回填了消费者与服务自元数据；最终 SHA 未再次计算 |
| `wire-schema-finite.mjs` | 21756 | `73272d3fd8adbc9b089ad57c1e6ea6402a130d297ee224383b3d9cea572f48ea` |
| `README.md` | — | 已标明 `SOURCE_PREPARED_NOT_RUN`，未宣称任何运行通过 |

旧 served root 未触碰。未读取原样任务、材料、阅卷笔记、门禁答案或任何模型输出。

## 固定重绑定

- 批准输入改为 `T18QualityDefenseInput-20261031-173317\approved-inputs.json`，2217 字节，SHA-256 `f835e8ef523438d9ec8b3440e3465435c2d4e0a4e9f7b9c8855561af3c1a976e`。
- 源码 pin 改为 `T18QualityCurrentInput-20261031-173317\reviewed-b346-current.json`，53548 字节，SHA-256 `0da04b925d421c711b7c6ef8d8bbc049b75c04fba537ba2275efc0a642b81847`。
- Skill 身份改为 13852 字节，SHA-256 `f3fed80c767e5c9d7f2fdaebc9e0fa5c0b5aa2878383ffd52b12edca260c9846`，mtime 为 `1793440531688076800`。
- 四项编译运行时 pin 和 Agent、Host 两处静态导入均改为 `QualityPrivateBuild-20261031-173317\private-output-20261031-180837`；字节与 SHA 采用 `approved-bindings.json`。
- 固定清单只更新了批准输入、源码 pin、Skill、四个编译对象、消费者和 Python 服务对应的路径、大小、SHA 与 Skill mtime。
- 授权合成答案、选择决定、规范任务、两项材料、前置成果、参考要点、26 个依赖、三个运行时、模型上限、任务参数、预算、问题、Native/R 绑定、会话绑定、凭据读取边界、外连拒绝、清理守卫和断言均未改。

## 只读核对

- 用原生 PowerShell 对消费者、服务和固定清单逐行比较：差异只落在上述固定元数据行；未发现函数体、控制流、提示、样本、模型或预算差异。
- `wire-schema-finite.mjs` 与原文件用字节序列直接比较，结果为 `WIRE_SCHEMA_BYTE_EQUAL=True`，两件均为 21756 字节。
- 唯一一次原生哈希/大小清点发生在消费者与服务源码定稿后；后续只把所得 SHA 回填固定清单，并更新文档，没有再运行哈希命令。
- 没有执行 Node、TypeScript/TSX、Python、HTTP、模型、GUI、测试、构建、导入、prepare、selftest、JSON/TS/Python 解析器或 AST。
- 没有调用 Git 写命令，也没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。没有提交 SHA。

## 异常与阻碍

- 一次 PowerShell 将 `foreach` 直接接入管道的命令在解析阶段报 `An empty pipe element is not allowed`，没有执行任何文件读取或哈希；改为先收集结果后完成唯一一次哈希/大小清点。
- `apply_patch` 对固定清单中旧的编译 `manifest.json` 路径行始终无法匹配。对此一个单点使用了 PowerShell 精确文本替换：先确认旧路径恰好出现一次，再替换并确认旧值消失。其余修改均由 `apply_patch` 完成。
- README 保留了原场景的命令异常：只读 `git status` 曾在共享 `dsh` 子模块 worktree 元数据处返回 permission denied；五次调用曾误把执行器 `shell` 写成 `bash`，四次被访问策略拒绝、一次被 MXC 拒绝，实际 Bash 运行 0 次；另有一次 PowerShell 循环管道解析失败。没有修改 ACL、锁、沙箱、审批或 Git。

## 根层待办

1. 独立审查完整字节反向补丁、所有固定路径和 SHA、运行时 import、私有目录 setup/cleanup 与旧 served root 隔离。
2. 若根层要求固定清单最终 SHA，由根层在审查时重算；B 线未用额外命令补算。
3. 审查通过后再由根层按规定启动既有观察器和一次原辩护意见实际场景。

本交回件不声称编译、观察器、质量门或辩护意见运行通过。
