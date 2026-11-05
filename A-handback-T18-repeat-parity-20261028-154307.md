# 独立 A 线交回

## 进度四问

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在有限原生阅卷消费者中补装既有标准重复调用提醒插件，同步三条冻结 pin、一个清单 SHA 和 README 说明；源码、固定清单、README 的完整正反向字节检查均通过。 |
| 目标是什么 | 让一次受影响的原始原生工作流使用与标准基础配置一致的真实提醒组件；当前只到静态装配，仍需 root 独立审计并执行一次有限原生运行和最终草稿质量检查。 |
| 在等什么 | 等 root 的独立源码审计、有限 ESM/词法准入和一次原始原生工作流结果；结果到达后由 root 判断模型是否改善并人工复核实际草稿。 |
| 卡在哪 | 本执行器被明确限定为作者运行时 0，不能运行 Node、导入、测试、模型或工作流；Git 子模块目录权限拒绝保持原样，不影响本次文件交回。 |

## 变更结论

消费者现在直接导入冻结提交中的 `packages/guard/repeat-tool-reminder/src/index.ts`。插件在工具、Skill、LegalAgent 依赖就绪后、`AgentLoop` 启动前装载。显式配置为：

```text
thresholds: [3, 5, 8]
include: []
exclude: []
argumentsPreviewChars: 500
```

这与基础配置第 454 至 458 行及插件 schema 第 52 至 56 行一致。插件源码第 220 至 229 行通过真实 `tools/post-execute` waterfall 附加带 `{kind: 'repeat-tool-reminder'}` 标记的消息。没有新增错误纠正提示、假历史、假回答或自定义解析。

工具运行时 `packages\core\tools\src\index.ts` 第 1564 至 1587 行把工具主体错误规范成 `toolErrorResult`，第 1622 至 1627 行返回 `post-result`；第 441 至 472 行说明该结果仍进入 post-execute。因而插件可观察真实 schema 错误结果，所需 SDK 改动为 0。

本地扩展配置第 2 行声明 base、webapp、本地补丁的叠加顺序。按插件 id 和包名检索，同 id override 为 0 条。原 `lawbench-source` 固定行仍保留 `e8c84bdfa142be2032f31b3e33040721efad0f2b1593b5a6a5b79bb01e91fcb4`。

## 冻结前、修改后与反证

| 文件 | 修改前 | 修改后 | 行级增量 |
|---|---|---|---|
| `native-reading-workflow.mts` | 76,889 字节；`02476047c58338e14945f55930d17d834c85033b8a1212f679e996eadab1908e` | 77,143 字节；`73675951cc7e3b9bb5b23a257a68dcfbdb60d03e974e41513117fe2608fefd4a` | 2 删，10 增 |
| `fixed-inputs.json` | 16,217 字节；`c919c3b9753d53e00a2c1b58631ce52748c1b955cb10148e152bc5a28c7ab0a9` | 17,100 字节；`757f3f1923f0aedb4082844dd1875badfe5b77d20a42ff9862c3033aeedef40e` | 0 删，21 增 |
| `README.md` | 7,120 字节；`1cbd9425716664f75cfc432210b14861bd39acc091874c5c372845981a8eaf73` | 7,798 字节；`542a1b681c383b1dfd8a3794b00014a9d393f79b0592459e1b026b5e154f389a` | 1 删，5 增 |

固定清单新增三条依赖，分别固定插件源码、包元数据和基础配置：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| `repeat-tool-reminder-source` | 10,619 | `1e917986fe9c5187d8f0fa11154ab2bf3b7c1d30db991540f4d1e62a2c59236d` |
| `repeat-tool-reminder-package` | 1,400 | `4a67ad059ddc15b69e26f56d4e6882ada1b1f53261b6e747585390466bb47581` |
| `base-config` | 20,894 | `861414459d7f60af5421ac7a9735a7c0d80b52a2369623b8cda3ce6079c733b4` |

三条 pin 在冻结输入中均出现 1 次，在固定清单中也均出现 1 次。原有 62 条固定记录的值和顺序保持。清单依赖从 49 条变为 52 条，固定记录从 62 条变为 65 条，`"sha256":` 结构行从 64 条变为 67 条。

完整字节反证没有使用 JSON、TypeScript 或其他 parser：

- 固定清单由 2,676 字节公共前缀、883 字节连续插入和 13,541 字节公共后缀组成；正向重建与当前文件相等，反向移除插入后与冻结前相等。
- 消费者应用唯一 pin 替换、解构行替换、import 行插入和插件装载块插入；正向完整 UTF-8 字节与当前文件相等，逆替换与冻结前相等。
- README 应用唯一段落替换和唯一 pin 替换；正向完整 UTF-8 字节与当前文件相等，逆替换与冻结前相等。
- 三份当前文件均为 UTF-8 无 BOM、裸 LF、CR 为 0。

## 静态准入读数

消费者导入路径出现 1 次，插件装载出现 1 次，四个显式配置字段各出现 1 次。插件装载在第 1059 行，`AgentLoop` 在第 1105 行，先后关系符合执行令。

`b-service.py` 保持 28,222 字节和 `87be5a7c09d0e8cafba0b3a729885189c517ddc0ea9bddb6b4c845cd7fdc3220`。当前 Skill 保持 14,422 字节和 `69619488f8cc827db702fed8fa153682bc6874374ac80817b26e4e06bf77b03c`。原有 46 项 native 基线、346 项 B source pin、已验收私编依赖、24 个私编输出、18 个 legacy Skill、E50 和五份材料均未写入。

原 `run-hdDyn1` 保持 `FAILED`：32 次模型 POST，全部 HTTP 200，最终为 `native turn ended with blocked`。既有 root 复核记录了 28 次把 `ask_user_question.questions` 发成字符串的畸形调用。本轮没有转换或代答这些问题。提醒组件可能在实际模型请求前注入标准提醒，但不能据此宣称模型必然改正；原始上游 HTTP 缺失，也不作服务器、权重或解析器的具体原因判断。

## 依据与验证

- 协调执行令：`D:\Lawbeach\lawbench-coord\A-T18-repeat-parity-order-20261028-154307.md`
- 冻结输入：`D:\Lawbeach\lawbench-coord\T18RepeatParityInput-20261028-154307\`
- 详细技术记录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\repeat-parity-20261028-154307.md`
- 修改后的消费者：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`
- 修改后的固定清单：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json`
- 修改后的说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\README.md`
- 原失败报告：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\run-hdDyn1\report.json`
- 冻结 dirty 基线：`D:\Lawbeach\lawbench-coord\T18RepeatParityInput-20261028-154307\A-dirty-before.txt`，250,884 字节，`7494402ac54ed81d84fdab772fbc56dd73296e496e9046adae721c50e1e13a45`

## 实际写入面

工作树写入仅四件：

1. `native-reading-workflow.mts`
2. `fixed-inputs.json`
3. `README.md`
4. `repeat-parity-20261028-154307.md`

协调目录写入仅本文件。所有源码修改经 `apply_patch` 写入，没有 shell 重定向、PowerShell 写文件或格式化工具写入。未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push。目标三份文件在只读 Git 查询中仍为 `??`，与变更前一致。

## 实际命令与退出

所有有效 `exec_command` 都显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、
`login=false`、工作目录 `D:\Lawbeach\lawbench-A`。

1. 首个工具读取正式执行令，退出 0。
2. 将冻结输入目录误作文件读取，退出 1，未写。
3. 初始全工作树 Git 状态查询，因子模块 `dsh` 目录权限拒绝退出 1；未修锁、扩权或改 ACL。
4. 列出证据目录，退出 0。
5. 递归列出冻结节输入，退出 0。
6. 带 `submodule.recurse=false` 和 `ignore-submodules=all` 的只读 Git 状态查询，退出 0，输出大量既有 dirty。
7. 读取冻结 `fixed-inputs.json`，退出 0。
8. 读取冻结 `README.md`，退出 0。
9. 读取 `input-pins.json`，退出 0。
10. 读取基础配置第 440 至 470 行，退出 0。
11. 读取插件源码全文，退出 0。
12. 读取插件包元数据全文，退出 0。
13. 检索消费者装配关键字，退出 0。
14. 读取消费者第 879 至 980 行，退出 0。
15. 读取消费者第 980 至 1105 行，退出 0。
16. 一次误填 `shell=bash` 的本地补丁检索，AccessDenied，退出 1，未执行目标命令。
17. 读取冻结基础配置第 448 至 462 行，退出 0。
18. 列出插件目录并检索导出，退出 0。
19. 读取本地补丁前 80 行并检索同 id，退出 0。
20. 消费者 pin 检索命令把 shell 路径误写成 `native-powershell\pwsh.exe`，返回只读结果，退出 0；记录为规格偏差。
21. 读取消费者第 20 至 90 行，退出 0。
22. 读取插件源码第 1 至 70 行和第 160 至 255 行，退出 0。
23. 读取三份冻结源码/配置尺寸和修改时间，退出 0。
24. 读取原失败报告，退出 0。
25. 读取当前编译源记录，退出 0。
26. 读取质量针脚记录，退出 0。
27. 读取冻结 dirty 清单前 80 行，退出 0。
28. 读取原 B 服务最终状态，退出 0。
29. 用 `apply_patch` 插入三个固定依赖行组，成功。
30. 计算固定清单尺寸与 SHA，退出 0。
31. 用 `apply_patch` 修改消费者和 README，成功。
32. 计算四份目标文件尺寸与 SHA，退出 0。
33. 对固定清单执行 `Compare-Object`，21 增、0 删，退出 0。
34. 对消费者执行 `Compare-Object`，2 删、10 增，退出 0。
35. 对 README 执行 `Compare-Object`，1 删、5 增，退出 0。
36. 统计消费者和 README 的旧/新 pin，PowerShell 语法错误，退出 1，未写。
37. 并行只读核对三次均误填 `shell=bash`；两次 AccessDenied、一次 MSIX 启动拒绝，全部退出 1，目标命令未执行。
38. 原生重做源码、包、基础配置 SHA、同 id 检索和消费者装配行检索，退出 0。
39. 读取 README 末尾字符差异，退出 0。
40. 第一次完整正反向字节检查，固定清单和消费者为 `True`，README 为 `False`，退出 0；失败来自只读比较构造，未写。
41. 定位 README 构造文本差异，退出 0。
42. 检查 README UTF-8 往返，退出 0。
43. 检查新段落与当前末尾逐字符相等，退出 0。
44. 修正末行处理后的 README 反证仍为 `False`，原因是先替换 pin 改变了旧段落，未写。
45. 再次修正替换顺序但保留多余末行，仍为 `False`，未写。
46. 去掉多余末行并按段落优先替换，完整正向和反向均通过，退出 0。
47. 并行做最终尺寸/SHA/换行、范围内 Git 状态、装配计数、pin 守恒和源码行核对；两组 PowerShell 语法错误退出 1，其余三组退出 0。
48. 重做消费者装配计数；各目标均 1 次，第 1059 行早于第 1105 行，退出 0。
49. 重做三条 pin 的冻结输入与清单对照；各出现 1 次，退出 0。
50. 一次误填 `shell=bash` 的基线文件哈希，AccessDenied，退出 1。
51. 原生重做基线文件哈希，退出 0。
52. 读取 `formal-report` Skill，退出 0。
53. 读取 `cn-prose` Skill，退出 0。
54. 读取 `human-explain` Skill，退出 0。
55. 用 `apply_patch` 新增技术记录，成功。
56. 用 `apply_patch` 新增本交回件，成功。
57. 并行读取五份目标与交回文件哈希；退出 0。
58. 扫描文档黑名单，PowerShell 语法错误，退出 1，未写。
59. 扫描结论边界，PowerShell 语法错误，退出 1，未写。
60. 读取本交回件开头和结尾；退出 0。
61. 查询 A 工作树范围内状态并查询协调目录 Git 状态；前者退出 0，后者因协调目录无 Git 仓库退出 1。
62. 重做黑名单扫描；两份均为 0 命中，退出 0。
63. 重做结论边界扫描；保证性错误声称与假 PASS 均为 0，打包暂停和运行时 0 记录存在，退出 0。
64. 检查协调目录无 `.git` 并读取交回件元数据；退出 0。
65. 只读检索工具运行时 dispatch 与 post-execute 路径；退出 0。
66. 只读定位 `dispatchToolBody` 第 1564 至 1587 行和 `post-result` 返回段；退出 0。

非零命令来自目录读取、子模块权限、五次误填 `shell=bash` 和三次 PowerShell 语法错误。五次 Bash 误填均由运行器拒绝，没有 Bash 进程执行，没有写入。README 的四个中间反证为只读比较失败，最终完整正反向已通过。

## 未做与降级

- 作者运行时为 0，没有 ESM 实际导入、词法编译、测试、类型检查、构建或工作流运行。
- 没有新的模型请求、工具事件、用户回答、JSONL、R、草稿或质量结论。
- 模型是否因提醒而改变仍未证明，原失败报告仍是本次唯一最新实际运行结果。
- 没有访问 Key、DPAPI、环境秘密、凭据、history、rollout 或真实案卷。
- 没有联系其他聊天或 agent，没有安装依赖，没有改沙箱、审批、ACL、权限或 writer 锁。
- 没有执行任何 Git 写操作。

## 下一步建议

root 先审阅三份目标文件的完整增量与三条 pin，再做有限 ESM/词法准入。准入通过后，只运行一次受影响的原始原生工作流，并人工审阅实际最终草稿。若提醒后模型仍不能完成任务，保留真实红色结果并停，不再生成无限变体。

第一道任务验收、完整 T18 和项目终态均未达到。打包保持暂停。

删减轮：读者 3 / 槽位 1 / 半句 2 / 重复 2 / 过程 2 / 黑名单 4

Response ID：`A-T18-repeat-parity-20261028-154307`

Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T18-repeat-parity-20261028-154307.md`
