# A 线 T18 任务与 Skill 私有构建配置交回

工单：T18 任务与 Skill 绑定私有构建配置

执行令：`D:\Lawbeach\lawbench-coord\A-T18-task-skill-private-config-order-20261030-023904.md`

状态：源码配置已交付；PRIVATE25 development build 未运行，作者 runtime 为 0

## 状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在唯一新目录落盘冻结 builder、两项批准配置修订和证据说明；完成只读字节级核验。 |
| 目标是什么 | 为主编排准入一次全新的 PRIVATE25 development build 准备配置；尚缺复核、fresh build、消费者恢复和运行准入。 |
| 在等什么 | 等主编排复核证据目录；复核确认后触发一次明确的 PRIVATE25 development compile。 |
| 卡在哪 | 本卡无停摆。Git 子模块权限拒绝只阻止全量 dirty 查看，不阻止交付；未修锁或扩权。 |

## 交付

唯一证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TaskSkillPrivateBuild-20261030-023904`

目录内恰好 3 个文件，没有 `private-output-*`：

| 文件 | 字节 | 行数 | SHA-256 |
| --- | ---: | ---: | --- |
| `build-private.mjs` | 32,121 | 834 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20,465 | 314 | `4bfb5fab7465dc381a279788ad4349eccad89adf55761624e370bd7eb55b554f` |
| `README.md` | 6,420 | 106 | `1248fa931e28d3f77f145fe3aa42cdd14b65c6fec9992570f3a6541571545722` |

冻结输入目录：

`D:\Lawbeach\lawbench-coord\T18TaskSkillPrivateInput-20261030-023904`

`build-private.mjs` 与冻结输入逐字节相同，来源和交付 SHA-256 均为
`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。

`build-config.mjs` 输入为 20,463 B、SHA-256
`9516e0f99bf42c9d8525191a2a422ad383f182a5b1dd4ec605db3f17babc9a62`。
交付件与输入同为 314 行，逐行比较只有三行不同：

1. 第 10 行只把 `EVIDENCE_ROOT` 改到本证据目录。
2. 第 68 行只把 `lawbench-agent-source` 的字节数从 80,380 改为 80,724。
3. 第 69 行只把该树摘要改为
   `f104a046c7cc80cbd71e9d7ad8a918322958fcd61be0caa056b9200f288bf0d1`。

这就是执行令指定的两项数据变化。新路径、新字节数和新摘要各出现一次；旧路径、旧字节数
和旧摘要残留均为零。撤销三项替换后，配置与冻结输入逐字节一致。因此其余 17 棵树、
39 个文件 pin、14 个引用、53 个身份、25 个预期输出、路径、构建开关、legacy 18 和
loader 都保持输入字节；没有加入动态摘要、运行时准入或新元数据。

## 依据与验证

- 执行令为 2,537 B、SHA-256
  `0e8587106a4a1285c535358c4e093fe2417d62a454896d738b6df0c0dfcdd109`。
- `approved-agent-tree.json` 为 741 B、SHA-256
  `0e7482b22b8e72c271dec2def13158f84e2c7efff325573feaed6987d885684f`。
- 当前 `dsh-ext\agent\index.ts` 为 50,901 B、SHA-256
  `e78789e20dc9e015664d41cebc1b55097c6a70ba6e85ce221006d5d06a23bbec`。
- 当前 `dsh-ext\tests\task-skill-binding-20261030-023251.spec.ts` 为 8,777 B、
  SHA-256 `a60c87e6bf2312b8c5091486bfbb98f86acc46e5faeaff1fdbf3731810ba119e`。
- `dsh-ext\agent` 按 `ordinal-path-tab-size-tab-sha256-lf-v1` 独立重算为 4 个普通
  文件、80,724 B、SHA-256
  `f104a046c7cc80cbd71e9d7ad8a918322958fcd61be0caa056b9200f288bf0d1`，
  与批准 JSON 一致。
- 执行令记载的既有 root 读数为 60 项聚焦 UNIT PASS、类型检查退出 0、源码 7 行整文件
  反演已接受。本作者没有重跑这些旧结果。
- 先前原生 Skill 12 模型 HTTP 200 后失败的结果保持不可改写；未调整提示词、golden、
  NLP、模型、provider 或预算。

## 未做与边界

- 作者执行的 Node、Python、AST、导入、解析器、测试、类型检查、构建、安装、打包、
  HTTP、模型、GUI、服务探测和进程探测均为 0。
- PRIVATE25 development build 为 `NOT_RUN`；没有创建或复用 `private-output-*`，没有服务
  或交付旧编译件。
- 未修改产品源码、测试、Skills、contracts、SDK、默认库、B 线、E50、legacy 18、
  当前 runtime、权限、网络或审批。未读取凭据，未联系其他聊天。
- Git 严格只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，
  因此没有提交 SHA。既有 dirty 原样保全；本卡只新增证据目录和本交回文件。

## 原始失败

| 次数 | 原始情形 | 处理与影响 |
| ---: | --- | --- |
| 1 | 初次 `git status` 因 `dsh` 子模块元数据目录权限拒绝而中止。 | 改用只读 `git status --short --branch --ignore-submodules=all` 记录 dirty；未修锁或扩权。 |
| 2 | 两次工具参数误设为 `bash`，均返回 Windows `BASH/E_ACCESSDENIED`。 | 未执行目录读取或文件修改；后续全部使用指定原生 PowerShell。 |
| 2 | 两次尝试打开不存在的 `.codex\skills\...\SKILL.md`。 | 改用仓库内实际存在的 `.agents\skills`，只读取正式报告与文风规程。 |
| 1 | 文件身份元数据脚本把 `foreach` 结果直接接入管道，触发 PowerShell `ParserError`。 | 改用结果变量后取得身份读数，文件未改。 |
| 2 | agent 树摘要验证首次使用区域性排序，第二次仍把制表符写成字面量，得到错误中间值。 | 最终使用 UTF-8 字节序、真实 TAB 和 LF，结果与批准摘要一致。 |

## 下一步建议

主编排先复核本目录、整文件反演和冻结源码，再用本目录 builder 执行一次全新的
PRIVATE25 development compile，并独立验收恰好 25 个输出。该编译不应由本作者启动；
通过后才进入消费者恢复、运行时 pin、准入和原始必要实跑。

删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 4 / 过程 1 / 黑名单 0。

Response ID: `A-T18-task-skill-private-config-20261030-023904`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T18-task-skill-private-config-20261030-023904.md`
