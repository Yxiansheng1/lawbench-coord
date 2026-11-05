# T18观察器契约已修正

结论：有界源码修改已落盘，新增纯函数观察器已编写但未执行。当前不能宣称实际模型、接口、草稿质量、法律语义或完整 T18 通过。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正 MTS 与 B 的六类不支持假设；只回填 manifest 两行；更新 README；新增未运行的有限观察器。证据见下文。 |
| 目标是什么 | 让观察器只检查公开契约支持的结构事实，保留原始问句供根层人工判断。离终门还差根层执行观察器、一次全新真实模型返程和人工验收。 |
| 在等什么 | 等根层复核本交回件与最终哈希。根层通过后执行观察器；收到 `ROOT_OBSERVER_RECEIPT` 得到 exit 0，再安排一次全新实际返程。 |
| 卡在哪 | 无源码阻塞。`git status` 在 `dsh` 子模块处被权限拒绝；按令未扩权、未改锁、未做 Git 写入。实际运行仍未发生。 |

## 精确改动

1. MTS 删除 `REQUIRED_TEMPLATE_ELEMENTS` 常量，以及 `hasAllRequiredTemplateElements`、`hasDefensePointHeadings` 两个机器硬门。报告不再输出 `requiredTemplateElements`。标题二选一、法律核验标记、原件引用、正文洁净度检查仍然保留。

2. MTS 的正文引用从单词条正则改为同一方括号内的一个或多个已登记名称加行号或行区间，多个词条只按顿号分隔。仍只接受 `起诉意见书`、`讯问笔录`，不加入别名、页单位或上游成果引用。

3. MTS 删除完整 L1 下禁止 `case_read_input` 的三行抛错。B 防火墙原无条件拒绝改为严格绑定 `index == 1`，`index` 必须是整数；参数键只允许 `index` 与生产契约已有的可选 `start`、`max_chars`。没有新增读取要求，生产 `ToolContext` 的范围、索引和 SHA 校验未改。

4. MTS 删除 `direction`、`stage`、`key_points` 问句的 `罪轻`、`审查起诉`、`16,500`、`郑某` 和阶段引用关键词门。实际 `questionTexts` 仍完整保留供根层审阅。报告字段改为 `expectedCanonicalStage`、`expectedStageSource`，并删除 `stageCitation`，不再把预期值写成已观察值。

5. B 在 `/core/task/begin` 的既有检查中加入 `selection_id is None` 拒收。只有 `/api/task` 返回成功 JSON 后才会写入 `selection_id`，因此开工前必须有实际成功的选择响应。其余协议、L1、零范围准备、OCR/retainer/off、拒绝外连和清理检查未改。

6. 新增 `observer-format-finite.mjs`。它只从固定 BEFORE/CURRENT 两版 MTS 中提取 `DRAFT_TITLES`、`CANONICAL_DRAFT_TITLE`、旧版存在的 `REQUIRED_TEMPLATE_ELEMENTS` 和实际 `assertDraftMachineChecks`，转译后放入 `vm` 调用。它不导入或执行消费者、Agent、Session、SDK、provider、服务或模型。

观察器含 4 个 CURRENT 正向控件、8 个 CURRENT 负向控件，以及两个旧版拒收事实：替代版式被旧模板硬门拒绝；带旧版全部格式字面量的复合引用被旧单词条正则拒绝。旧拒收保留为主证据，不作为产品红判。根层运行后，文件先写入独占新结果 JSON，再在匿名 stdin 等待 `ROOT_OBSERVER_RECEIPT`；技术看门狗固定 86,400,000 毫秒。

## 最终源码身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 140855 | `31622e39fd11629ede25ab78b41af7fa7d43703d223681595ca00b26de2bbeb3` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11791 | `4e40104dc933922b3bc55e943dd1bb5ab16e93aa716515f9c9ba239ce8533fde` |
| `README.md` | 6466 | `19177ba546a146c3f9add96e70a131d33869ee6c35eefc7b3bdabd07e52d3fc8` |
| `observer-format-finite.mjs` | 21606 | `1ea786590dc9d88736033d48956adad4aceed0f68af7db0f177c4d9ea4b41f82` |

README 的 6,466 字节与上述哈希对应“两次只读检索误填非指定 PowerShell 路径”的最终审计文本。若后续改写 README，必须重新记录其字节与哈希。

## 依据与验证

- BEFORE MTS：142,369 字节，SHA-256 `76c73e0fbf32b1d4e5da936df6b4e226a71e46e27a30d2bd24bb947e6f758f67`，与执行令和官方快照一致。
- BEFORE B 服务：53,414 字节，SHA-256 `42806c571ea71d3c475dcf70001e87a5be8c3149021efb975ef27a954172b1e8`，未改写。
- BEFORE manifest：11,791 字节，SHA-256 `e026e2929141f663003db56af4a66676277cb1a861f2230768ff415db98571b5`，未改写。
- 固定 TypeScript：9,144,216 字节，SHA-256 `569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39`，与执行令一致。
- 只读文件差异显示：MTS 仅有上述六类允许片段变化；B 服务仅有选择响应门和 `case_read_input` 参数门两处变化；manifest 仅 consumer/service 两行变化。
- 源码检索确认旧模板常量、旧标题门、旧单词条正则、未支持问句门、旧阶段来源字段和 B 的无条件输入拒绝均无残留。
- 观察器源码内固定了 BEFORE、CURRENT、TypeScript 三个 SHA；CURRENT 常量与最终 MTS 实际 SHA 一致。结果路径必须是不存在的绝对 JSON 文件，源路径和 SHA 不接受动态替换。
- 本次没有启动 Node、Python、TSX、AST、解析器 import、检查、测试、构建、HTTP、模型、GUI、SSH、DPAPI、凭据读取或进程探测。B 线 author runtime 为 0。
- 未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push，不暂存、不提交，因此没有提交 SHA。

## 未做与降级

- 观察器的实际 AST 抽取、VM 调用、12 个 CURRENT 控件、2 个旧版拒收和网络拒绝结果均未由 B 线运行；必须由根层在另行授权窗口执行。
- 没有新的真实 Case、Task、Session、R 请求、模型调用、JSONL、草稿、citation 或人工验收结果。
- 整体 `git status` 未能完成。准确阻碍为：进入 `D:\Lawbeach\lawbench-A\.git\worktrees\lawbench-B-new\modules\dsh` 时权限拒绝。未尝试修复、提权、改 ACL、改锁或写 Git。
- 三次只读检索误填 `bash`，执行器均在启动前拒绝，Bash 未执行、文件未修改。两次只读检索误填非指定 PowerShell 路径，仍按原生 PowerShell 和 `login=false` 执行；其余成功命令均使用指定的精确实例。
- 本交回件没有声明产品失败，也没有声明观察器已经通过。产品是否通过只能在根层执行观察器并获得一次全新实际返程证据后判断。

## 下一步建议

根层先按最终字节与哈希复核五个交付文件，再按 README 中的未来入口执行纯函数观察器，并核对结果 JSON、进程出口和 `ROOT_OBSERVER_RECEIPT`。观察器 exit 0 只表示源码契约控件通过；随后仍需安排一次全新的原始辩护意见实际返程，检查模型生成草稿、原始行号、三问实际语义、最终答复和人工法律边界。

删减轮: 读者 0 / 槽位 0 / 半句 2 / 重复 1 / 过程 0 / 黑名单 0

Response ID: `B-T18-defense-observer-contract-20261029-162518`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T18-defense-observer-contract-20261029-162518.md`
