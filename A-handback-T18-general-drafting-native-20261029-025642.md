# A 线交回：T18 general-drafting 原生消费者准备

状态：`AUTHORED_NOT_RUN / RUNTIME_NOT_RUN / ROOT_REVIEW_AND_LITERAL_ADMISSION_REQUIRED`

交回时间：2026-10-29（Asia/Taipei）

执行角色：A 线 DeepSeek 执行者（单一 writer）

## 结论

已在 A 线新增一个、且仅一个 `general-drafting` 原生消费者准备包：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\`

本 job 没有运行 Node、Python、解析器、类型检查、测试、编译、构建、prepare、HTTP、模型、GUI、SSH、Key 或 DPAPI。没有生成真实 UUID、R、JSONL、模型正文、citation 结果、覆盖率或运行清理证据。源码准备不代表实际通过。

旧 `doc-revise` DDLgyK 仍按原事实记为 `FAILED`，包括“精确条款号仍偏粗、input2 skipped”；没有修旧消费者，没有重写失败，也没有声称它已通过。旧 CDP/Keyring 18 报告未复用为本次证明。

## 交付文件

目标目录只新增以下四件：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-general-drafting.mts` | 99398 | `d9bb256d64108a9e0bf1dfda246af61e0c368c2c82d8ef285eb579e39ad5c4aa` |
| `b-service-general-drafting.py` | 39539 | `b21741ce2c3d62b90c704a303d794e6c1b310beb23c61389106f0b6d42669552` |
| `literalfixed-inputs.json` | 11591 | `a9db3600dd82a877dd66be2036774988e598990cff99b81f16e680d998586e93` |
| `README.md` | 7979 | `b9b6056da3f2349ae97a85bd2ab8ca27552c963535863c40ce2581ccb4239dd8` |

`literalfixed-inputs.json` 自含 consumer 与 companion service 的路径、字节和 SHA，consumer 启动时会自校验；它也已写入上述精确值。

## 有界改动

改动面只有上述新目录中的四个文件，以及本交回件。没有编辑：

- 旧 consumer、旧 run、旧 report 或旧 evidence；
- `dsh-ext` 产品源码、测试、契约、运行时配置或 Skill；
- `D:\Lawbeach\lawbench-B` service、Skill、fixture；
- 发票引擎或任何外部工具；
- 当前私有编译产物。

当前编译私有四件按只读身份引用：

| 角色 | 字节 | SHA-256 |
| --- | ---: | --- |
| agent | 552453 | `0e73a0e95b4d1248142f8a579a503f055eda11539f7ddf1614d8e1888e9d3329` |
| host | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| package | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| manifest | 58196 | `3d60e0330055795f456080f8fb4dd74ca1d8446a1cb5124301836cc1adbc272e` |

B 源码仍使用既有审核针脚 346 条：53548 字节，SHA-256 `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379`。

## 固定输入

批准入口：

`D:\Lawbeach\lawbench-coord\T18GeneralDraftingNativeInput-20261029-025642\approved-sample-and-skill.json`

身份：2130 字节，SHA-256 `50a9c328e41d5ab52dbe31411c17d13e1b20d537c711cdc38d101a43e866edb6`。

五份运行时材料逐字取自批准 JSON：

| 材料 | 字节 | SHA-256 | mtime_ns |
| --- | ---: | --- | --- |
| 借条.txt | 831 | `bab960f3ec5040f8c033beb02518b2750cfd223aef97261cdcf7d1a74f3d85ea` | 1792379578820969100 |
| 微信催款记录.txt | 592 | `36942699507474ac9b8622b3fec7bd79fe8b198dadf52c4bb467b021887a95db` | 1792379578820969100 |
| 情况说明.txt | 528 | `475c478598269e56090cc3d404a7a850ffb06d3f043baf965a6aea29a500dcd7` | 1792379578820969100 |
| 还款记录.txt | 260 | `81d44bc76b5dc0aadf65c2e2f970c92ac1a5e4053d4b2df1490dab3ec08598c8` | 1792379578820969100 |
| 银行流水.txt | 600 | `a33459efc500ecf11891f0c7229d6922721c64bfe3612b8b41dc45908f08ae24` | 1792379578820969100 |

canonical 任务 918 字节，SHA-256 `237401ade2d8f4799b80f66a7c089895ac6cb0203c0f78e56d4d5e9ccf59e20d`。consumer 只取第一个 `---` 前的 Markdown，截尾空白后作为唯一模型 prompt；测试说明未进入 prompt。

Skill 13495 字节，SHA-256 `2a167b44f4da3cde768834d9a476f2a252c8cf3138cba61f48d99bbf7214fe31`。manifest 同时固定 B 当前 `general-drafting\SKILL.md`，并要求与批准 Skill 同哈希。

`要点.md` 只在批准的 8 行里被识别并排除。它没有进入私有 case、模型 prompt 或正文校验答案。

## 准备好的真实接缝

1. consumer 先创建全新 `mkdtemp` run root。
2. B 在真实 `CaseRegistry.open` 之前，把五份批准文本复制到私有 `case\02案件材料`，并核对字节、SHA-256、mtime_ns；不复制旧 `case.db`、任务、草稿、appdata scope 或 Session。
3. Node 调真实 `caseOpen`，再调真实 `/api/materials/scan` 让现行文本解析器建材料索引；不调材料导入。
4. `SessionCommandController.create` 创建全新 Native Session；UUID、header、cwd、JSONL 都由生产机制生成。
5. `BrowserSession.beginSubmission` 生成唯一 R；再以真实 `request-scope prepare` 绑定当前 registry 的五个 material_id/version。
6. 真实 `task/begin` 执行 Host claim。B 防火墙强制 prepare 已完成，且 task/begin 返回的 scope 必须与五个当前版本一致。
7. 唯一 prompt 是 canonical 任务截段。任务选择只经真实 `/api/task` 指定 `general-drafting`、`inputs=[]`，没有把期望金额、结果 flag 或测试说明拼入 prompt。
8. Host 当前 Skill 目录必须声明 `doc_type`、`recipient`、`goal`。消费者一次回调回答三项；未知、重复、额外 ID 或第二次询问均 fail closed。未修改当前 d21 的生产问题门白名单。
9. 正文必须是真实模型在律师回答之后通过 `case_save_draft` 传入的内容；标题固定 `律师函`。consumer 将磁盘正文与最终 tool 参数逐字比较。
10. 必须实际读取 `借条` 以覆盖 8 万元、到期日和地址，并在最终保存前实际读取 `还款记录` 或 `银行流水` 覆盖 2 万元部分还款；coverage 必须诚实描述五份材料，允许 `not_read`。
11. citation check 必须 `passed=true`、`stats.must_fix=0`；所有引用再经真实 `/api/source` 解析，必须是当前案件 material_id/version/unit。
12. 最后停止自有 B child、Browser 和 Context，重开 JSONL，用 `isDeepStrictEqual` 深比较；物理文件必须一份，UUID/header/cwd 精确相同。

## 安全边界

- B 只监听随机 `127.0.0.1` 端口，lifespan `off`，无 forward listener。
- B outbound transport 对任何请求直接拒绝；B credential getter 全部计数并拒绝。
- 只允许 health、材料扫描/列表、任务选择/列表、request scope、source 和 core task 路由；材料导入、OCR、retainer、redline 等不在白名单。
- 模型网络只允许 `POST http://10.126.126.1:8000/v1/chat/completions`，redirect 必须失败。
- 模型 Key 只允许根侧现有授权的匿名 stdin；未读取 Keyring/DPAPI，不写 argv、环境、文件、metadata 或报告。
- 进程环境隔离 HOME/APPDATA/TEMP/proxy；不使用按名称的全域 kill。
- B listener/net/log/retainer 在自有停顿路径关闭；Node 会 cancel/join 自身 session 的 agent，然后释放 Browser、Context 和 HTTP 客户面。

## 实际静态命令与结果

本段是本次作者实际运行的静态命令记录。没有将静态检查写成运行通过。

| 命令面 | 退出码 | 原始结果 |
| --- | ---: | --- |
| 只读正式执行令 `Get-Content -Raw` | 0 | 读回 1791 tokens，确认唯一任务、目录和禁区 |
| `git status --short --branch` | 1 | `fatal: cannot chdir ... modules/dsh: Permission denied`；未修权限、锁或 ACL |
| `git status --short --branch --ignore-submodules=all -- <目标目录>` | 0 | `## line-A...origin/line-A [ahead 93, behind 1]`；目标目录为 `?? .../GeneralDraftingNative-20261029-025642/` |
| `Get-FileHash -Algorithm SHA256` 对目标四件 | 0 | 得上述四组精确字节/SHA |
| `rg` 对旧 session/旧 case 标识 `Bf3ztJ|DDLgyK|run-R8IeGo|run-Jwpm24|session-1cb28369|9d535ab5|60fda87b` | 1 | 无匹配 |
| `rg` 对 Git 写命令 | 1 | 无匹配；唯一的 `spawn` 是启动 pinned Python companion |
| `rg` 对禁用的独立外连/DPAPI/Keyring 等 | 0 或 1 | 只命中预期的 B outbound/credential 拒绝器、retainer sentinel 和 `/materials/import` 禁止断言，没有独立外连实现 |
| 一次 `rg` 安全查询引号写坏 | 2 | PowerShell 报 regex parse error；随后拆成简单模式重跑并人工判读，无源码改动 |

作者曾四次把只读诊断的工具 shell 参数误写为 `bash`。原生 MXC 在启动前拒绝（`BASH/E_ACCESS_DENIED` 或 MSIX/container 拒绝），没有执行 bash 命令；发现后全部命令改用显式 native `pwsh.exe`。

## Runtime 计数

- Node 启动：0
- Python 启动：0
- 解析器/类型检查：0
- 测试/收集：0
- 编译/构建/prepare：0
- HTTP 请求：0
- 模型请求：0
- GUI/SSH/Key/DPAPI：0
- 真实 UUID/R/JSONL/模型正文：0
- 运行目录：0

因此不存在本次实跑的退出码、模型用量、citation 或进程清理证据。

## Git 与 dirty 保全

本次 Git 严格只读。没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push；没有暂存或提交。

`HEAD` 仍为 `a23271a`。全量 `git status` 的失败点是既有子模块权限：

`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh`

没有尝试修 `index.lock`、权限、ACL 或工作树。开工前 dirty 由本任务输入目录既有 `A-dirty-before.txt` 冻结保全；目标目录以外现有改动未被本轮写回。

## 根侧后续准入

根侧应先只读复核：

1. 完整 consumer 与 B companion；
2. `literalfixed-inputs.json` 的 5 个 raw source、Skill、persona/common、DSH 依赖、B 346、编译私有四件；
3. 当前 TypeScript 契约与两个绝对私有 import；
4. `request-scope prepare → task/begin claim → ask once → material reads → model save` 顺序；
5. `finally` 仅触达本 run 的对象和自有 PID；
6. 固定输入没有 golden、旧 case 或测试说明进入模型。

复核通过后，根侧才做 literal admission，并按 README 的固定 Node/tsx 命令执行一次 canonical scenario。该命令需要根侧现有授权机制向 stdin 匿名送入模型 Key；不得把 Key 写进命令、环境变量、文件或日志。

即使得到 `TECHNICAL_PASS_REVIEW_REQUIRED`，仍必须由根侧手读完整 Markdown，独立核对事实、算术、威胁语气、引用位置、律师函结构和占位。技术检查不能替代业务/法律验收。

Gate 1：`INCOMPLETE`

完整 T18：`INCOMPLETE`

项目验收：`INCOMPLETE`

Packaging：`HOLD`
