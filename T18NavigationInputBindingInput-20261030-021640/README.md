# T18 navigation native source handoff

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

本目录只保存 B-T18 的新增导航原生场景源码。作者没有运行 Node、Python、类型检查、测试、构建、AST、import、HTTP、模型或 GUI；这里没有模型、原生、业务或法律 PASS 声明。实际运行与人工判读由 root 继续。

## 场景

- 用一个全新的案件根建立真实的 `civil` CaseRegistry 案件。
- 在案件打开前，将批准的五个纯文本材料按原名、原字节、原 `mtime_ns` 复制进去。生产材料扫描器只应登记五个 `txt` 材料，地址单位为 `line`；不创建 Word、PDF、OCR、wiki、案件卡片或历史记录。
- 新 Native Session 使用 `legal-workflow`，任务 `inputs` 为空、`request_scope` 为 `null`，提交只含公开任务分隔线之前的原文。
- 生产 `SessionCommandController`、真实 AgentLoop 和真实 B 服务完成一次模型请求。导航只给下一步与上游材料指引，不写文书。
- 机械检查要求：真实 Skill 工具恰好加载一次 `legal-workflow`；turn 正常完成且有非空可见回答；除 `skill` 外没有工具调用；没有询问回调、材料读取、检索、保存、编辑、归档、计算、格式转换或 Wiki 写入；TaskStore 的 `drafts`、`citations`、`reads` 为空且任务目录没有 `归档方案.json`。
- 服务侧自行核对 `task/begin`、`context`、`progress`、`task/end` 的真实请求和响应；L0 必须来自生产 Core 的无 wiki 卡片，并列出五个实际材料名；L1 必须为空。

回答中的导航是否正确、上游建议是否合理、是否虚构法律意见或出处，只由 root 读取实际响应和 production JSONL 后人工判断；源码没有用关键词、正则、黄金答案或提示词变体代替该判断。

## 固定输入

- 输入基线来自 `D:\Lawbeach\lawbench-coord\T18NavigationNativeInput-20261030-020000\`。
- `baseline-entry.mts`：172233 bytes，`3d4e671f2aa634777cb975c33d0b5b88ce620b7acae640af410c5569734e3314`。
- `baseline-service.py`：54743 bytes，`7facdd335d06cc2c6f5d728e27b5334618057e85cf6c81c20e020473d85e0780`。
- 只读输入清单 `approved-inputs.json`：2132 bytes，`e759fe53b62165faf8ab680b5d28e59b51dc2e8f4c77cbbe6094ae3871b13a20`。
- B 源码固定表 `T18ArchiveWarningBSourcePins-20261030-003710.json`：53548 bytes，`5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`，346 行。
- 八个批准输入（五个 TXT、任务说明、Skill、参考要点）的 size/SHA/mtime 已作为清单固定值保存；参考要点只做文件身份校验，不读取正文，也不进入模型上下文。

## 参数与边界

- Skill 声明参数按当前生产映射使用：思考 `关闭`、窗口 `32K`、`max_tokens=4096`。
- 当前 Host 类型和 Agent 请求层支持该映射：`关闭` 映射为 `reasoningEffort: off`，`max_tokens` 原值进入请求 header；没有参数不支持项。
- 单任务预算继续为 32 次模型调用、48 次工具调用、45 分钟；模型与流请求边界继续为 1,200,000 ms。
- 模型仍为 `qwen38-27b`，provider 为 `lawfirm`，目标仍是批准的制作环境地址和专用凭据；作者未读取凭据或环境变量。
- 源文件、私有构建、依赖、运行时与运行上下文沿用批准固定值；只把 Skill 依赖行换成本场景的 `legal-workflow`。

## 文件身份

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-navigation.mts` | 174956 | `26d31e5e4a6ff18d12e0ad95968947b3904e1e7eea7edbc381de0987b40a329f` |
| `b-service-navigation.py` | 57931 | `b6cea46229411cb8cabcee8a263b08dda9a1b3995df515bbd574ce24dbddf787` |
| `literalfixed-inputs.json` | 13079 | `b888c961645a723abf8fe5de2d2a5ccc9fb1f177ceeee6b1b167fa4e0e17f157` |

## 运行与限制

root 执行前应先独立审看完整源码、固定输入和清单。作者未执行产品入口；因此没有运行证据，也没有红绿测试、原生 turn、模型响应、JSONL close/reopen 或业务结论。未运行不是通过。

所有执行命令均按要求显式指定 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe` 和 `login=false`。有九次误填 `bash` 的工具调用，均由 runner 以 `Bash/E_ACCESSDENIED` 拒绝，未读取、执行或写入任何内容；一次 PowerShell 数组管道写法触发 ParserError，未写入。普通 `git status` 因共享 worktree 的只读 `dsh` 子模块目录无权限而失败；随后用 `--ignore-submodules=all` 只读核对主仓。未修锁、扩权、启动 setup 或改用 legacy，未尝试 Git 写操作。
