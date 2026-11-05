# T18 通用法律文书原生消费者

状态：`AUTHORED_NOT_RUN / RUNTIME_NOT_RUN / REVIEW_REQUIRED / PACKAGING_HOLD`

本目录只准备一次 `general-drafting` 原生场景。作者没有运行 Node、Python、解析器、类型检查、测试、编译、构建、HTTP、模型、GUI、Key 或 DPAPI，也没有创建实际运行目录。这里的源码准备不是实际通过，不能据此宣称 T18、业务质量、法律质量或项目验收完成。

旧 `doc-revise` 的 DDLgyK 仍为 `FAILED`，其“精确条款号仍偏粗、input2 skipped”等事实保持不变；本目录不修旧消费者，也不把旧失败改写成新成功。

## 文件身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-general-drafting.mts` | 99398 | `d9bb256d64108a9e0bf1dfda246af61e0c368c2c82d8ef285eb579e39ad5c4aa` |
| `b-service-general-drafting.py` | 39539 | `b21741ce2c3d62b90c704a303d794e6c1b310beb23c61389106f0b6d42669552` |
| `literalfixed-inputs.json` | 11591 | `a9db3600dd82a877dd66be2036774988e598990cff99b81f16e680d998586e93` |

固定输入来自：

`D:\Lawbeach\lawbench-coord\T18GeneralDraftingNativeInput-20261029-025642\approved-sample-and-skill.json`

文件本身 2130 字节，SHA-256 为：

`50a9c328e41d5ab52dbe31411c17d13e1b20d537c711cdc38d101a43e866edb6`

五份材料、canonical 任务和 Skill 的字节、SHA-256、mtime_ns 均按该批准 JSON 原样写入固定输入。`要点.md` 只作为被排除的 golden 行存在，不进入 case、不进入模型 prompt、不作为验收答案。

## 一次工作流的接缝

1. 消费者校验批准输入、B 346 源码针脚、五份源文件、Skill、persona、DSH 依赖、三件运行时和当前编译私有四件。
2. 消费者创建全新的私有 run root。B 入口在真实 `CaseRegistry.open` 之前，把五份合成 `.txt` 以 `copy2` 复制为私有 case 的 `02案件材料`，逐份核对字节、SHA-256 和 mtime_ns。
3. Node 只用真实 `caseOpen` 创建案件，再调用真实 `/api/materials/scan`；不调用材料导入、OCR、生命周期、retainer 或默认设置加载。
4. Node 用 `SessionCommandController.create` 创建全新的 Native Session 和 JSONL；没有复制旧 Session、消息、任务、case.db 或历史事件。
5. Node 用实际 `BrowserSession.beginSubmission` 生成新 R，把当前 registry 的五份材料 ID/version 通过真实 `request-scope prepare` 绑定到该 R。
6. 唯一的模型 prompt 是 `_任务说明.md` 中第一个 `---` 之前的内容。脚本只截去尾部空白；测试说明、`要点.md` 和验收事实都未注入。
7. 任务选择走真实 `/api/task`，明确 `skill=general-drafting`、`inputs=[]`。随后真实 `task/begin` 原子 claim 上述材料 scope。
8. Host 的 Skill 目录声明 `doc_type`、`recipient`、`goal`。合成律师回调一次回答三项；未知 ID、重复 ID、额外 ID、第二次询问都 fail closed。当前 d21 的生产问题门白名单没有改动，也没有扩展到第三个 Skill。
9. 模型正文只能通过真实 `case_save_draft` 工具保存，标题固定为 `律师函`。首次成功保存必须晚于三项回答的实际工具结果。
10. 完成后核对 B task 的当前 scope/version、真实 reads、coverage、citation check、draft 工具参数和引用解析；再停止 B、释放 Browser/Context、重开 JSONL 并做深比较。

## 固定资源

- B 源码针脚：346 条，53548 字节，`2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379`
- 当前压缩私有：agent `0e73a0...d3329`、host `ca849d...e56b`、package `3d6bca...e794`、manifest `3d60e0...272e`
- 运行时：Node `E:\node\node.exe`、tsx `dsh\node_modules\tsx\dist\cli.mjs`、Python `C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe`
- 模型：`lawfirm / qwen38-27b`，`http://10.126.126.1:8000/v1`，思考中，128K，最大输出 32768，32 次模型调用、48 次工具调用、45 分钟

以上身份在 `literalfixed-inputs.json` 中是字面行，没有动态扫描 wide private sources，没有新生成未批准库，也没有把旧 raw A index 5e53 写回当前 consumer。

## 运行时边界

B 只监听随机 `127.0.0.1` 端口，lifespan 为 `off`。出站 HTTP transport 一律拒绝；模型 Key 访问器一律拒绝。OCR、retainer、材料导入、范围 release 和未列出的 API/core 路由均不在允许集合。

模型网络只允许 `POST http://10.126.126.1:8000/v1/chat/completions`，redirect 必须失败。本地网络只允许固定 health/settings GET 和 core task/context/tool/progress/end POST。独立 B bearer token 由父进程随机生成并通过子进程 stdin 发送，不写文件、环境变量、参数或报告。

模型 Key 仅允许由根侧现有匿名 stdin 授权通道送入 `--credential-stdin`。禁止把 Key 放进命令行、环境变量、文件、日志、报告、metadata 或 Git。

## 根侧必须做的准入

根侧先只读复核本目录三份源文件和 README，确认：

- 只有本任务定义的一个 `general-drafting` 场景；
- 没有复制旧案卷、旧 Session、旧 task/messages 或手写 JSONL/header/R；
- `request-scope prepare`、真实 Host claim、唯一 `ask_user_question` 和 post-answer save 的顺序正确；
- 五份材料只来自 `approved-sample-and-skill.json`，golden `要点.md` 未成为运行时输入；
- 当前编译四件、B 346、Skill、persona、固定 46/18/E50 和资源预算未改写；
- `finally` 只取消/等待本身 PID 的 agent，只 stop 自有 B child，不使用按名称的全局清理。

复核通过后，根侧需要对该三份源文件做 literal admission，并决定是否执行下一次现行有限验证。新 source 在根侧完成 literal 准入前不属于 runtime-admitted 产物。

## 执行命令

根侧在独立复核和 literal admission 通过后，用固定的 Node + tsx 执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\native-general-drafting.mts' --credential-stdin
```

stdin 必须由根侧现有授权密钥机制匿名提供。不要把 Key 写进命令、PowerShell 变量持久化、临时文件或环境变量。B 的随机 loopback token 由 consumer 自动写入其 owned child 的 stdin。

## 通过口径

技术成功只写：

`TECHNICAL_PASS_REVIEW_REQUIRED`

报告必须保持 `businessAcceptance=false`、`legalAcceptance=false`、`manualFactArithmeticThreatFormatReviewRequired=true`。技术检查至少包括：

- 唯一 Skill、唯一 task、唯一 R、唯一 ask、五个当前材料 scope；
- 三项回答在首次成功保存前，正文等于实际模型 `case_save_draft` 参数；
- 借条和还款记录/银行流水的实际读结果支撑本金、部分还款、余额和到期事实；
- citation `must_fix=0`，引用只指向当前案件材料 ID/version/unit；
- 正文具备期限、逾期利息、法律依据待核实的占位，并排除原任务中的举报/偷税/曝光要挟；
- B task 用量来自实际 task B 记录，模型 POST 来自实际 fetch 观察；
- 新 Session UUID/header/cwd 与 JSONL live/reopen 深比较一致；
- 原五份输入、B 源码、Skill 和固定资源前后身份一致；
- agent、controller、Context、JSONL、B listener/net/log、redaction、环境和 Key 都收口。

`TECHNICAL_PASS_REVIEW_REQUIRED` 仍不是业务验收。根侧必须手读完整正文，独立核对事实、算术、威胁语气、引用位置、律师函结构和占位内容；公式化技术检查不能替代该人工复核。

## 明确未做

作者没有运行本目录代码，因此没有实际 UUID、R、JSONL、模型正文、citation 结果、覆盖率、清理 PID 或退出码。现有 61/32/38 等旧绿灯没有重跑，也不构成本场景证据。Gate 1、完整 T18、项目验收与 Packaging 继续为 `INCOMPLETE / INCOMPLETE / HOLD`。
