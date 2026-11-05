# A 线交回：T18 general-drafting 私有构建准备

日期：2026-10-29  
状态：`READY_FOR_ROOT_REVIEW / CONFIG_NOT_IMPORTED / BUILD_NOT_ADMITTED / RUNTIME0`  
项目状态：`Gate 1 INCOMPLETE / full T18 INCOMPLETE / project INCOMPLETE / Packaging HOLD`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 交付冻结 builder、两项数据变化的私有构建配置和准备说明；未执行构建。 |
| 目标是什么 | 为 ROOT 后续一次 25 文件私有开发编译准备可反审输入；真实运行仍未开始。 |
| 在等什么 | 等 ROOT 完整复核并明确准入；准入后才运行一次冻结 builder。 |
| 卡在哪 | 本单不获构建、导入或运行授权；因此没有编译身份和消费者重钉。 |

## 1. 目标与出处

本次唯一依据为：

`D:\Lawbeach\lawbench-coord\A-T18-general-private-config-order-20261029-034531.md`

输入目录为：

`D:\Lawbeach\lawbench-coord\T18GeneralPrivateConfigInput-20261029-034531\`

三份输入的实际身份：

| 输入 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-approved-inputs.json` | 20,399 | `c2b43bf9db391663d5cb7de2249d9c72069bbfe36662d3c5fd9645ccd9399484` |
| `build-config.mjs` | 20,465 | `4bc9a7e174b9222c476870dcf6763fb8aa86ad3d5f17714b0004a3d261de0219` |
| `build-private.mjs` | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |

`build-approved-inputs.json` 已记录 ROOT 独立完成的 18 棵树反向、53 个文件/引用身份和
18 个 legacy 身份。本线没有重算该全量面，也没有重跑旧测试、安装、调研或全量回归。

根侧既有原始证据：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18-general-question-gate-unit-root-current.json`

该证据记录 unit exit 0、types exit 0、`model_calls=0`、`source_changes=[]`。当前产品与
测试哈希仍分别等于批准值：

- 产品 `dsh-ext\agent\index.ts`：46,371 字节，
  `b2e460220a7ee037fec883fa3fb19e285fa2789846c0af7807099683f2e81255`
- 测试 `dsh-ext\tests\general-drafting-question-gate.spec.ts`：9,032 字节，
  `c14bce581cfe033ab7a4cc6192ab8a3920c402094f16bf1b0f0a1445a499076a`

因此复用既有 unit/types 原始证据，未重演旧开工、安装、调研、全量测试或模型运行。

## 2. 交付文件与写入面

准备目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionPrivateBuild-20261029-034531\`

| 文件 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| `build-private.mjs` | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 与冻结输入逐字节相同 |
| `build-config.mjs` | 20,471 | `6e015d6dacab16fde555775bf5c638e66b97b1f8696cd2b74c15c99693730d6e` | 仅两项数据替换 |
| `README.md` | 4,797 | `eb6042f48da5fb1f3fffa5eec0f8b81d8b98dfcb27840d4bafc25b49f4e65e7` | 准备边界与 ROOT 后续 |
| 本交回件 | 落盘后见 `C50` | 落盘后见 `C50` | 正式交回 |

准备目录实际只有上述 3 个文件、0 个子目录、0 个 `private-output-*`。本交回件在协调目录，
不计入准备目录的三个文件。

写入面只有：

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionPrivateBuild-20261029-034531\build-private.mjs
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionPrivateBuild-20261029-034531\build-config.mjs
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionPrivateBuild-20261029-034531\README.md
D:\Lawbeach\lawbench-coord\A-handback-T18-general-private-config-20261029-034531.md
```

`build-private.mjs` 和 `build-config.mjs` 来自输入目录的逐字节复制；其中 builder 未再编辑，
配置只经一次 `apply_patch` 修改。其余两个文件由 `apply_patch` 新建。

没有改产品、测试、fixture、consumer、Skill、契约、运行时、SDK、B 源码、B 标题契约候选、
旧编译件、旧失败结果或真实场景证据。Git 没有提交，因此没有可引用的提交 SHA。

## 3. 配置反演与源码核验

`build-config.mjs` 只改两处：

| 字段 | 输入基线 | 本目录 |
| --- | --- | --- |
| `EVIDENCE_ROOT` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocRevisePrivateBuild-20261029-021504` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralQuestionPrivateBuild-20261029-034531` |
| `lawbench-agent-source` | 4 文件，75,039 字节，`62eb02d960db9e81bfebcac3f5292afab7fd4ce7b9ad66fcaf12874595e1733d` | 4 文件，75,167 字节，`a13b0857f9f8ff04b0b3669f65a73ab4b0b263735e9c58ea1b487888838df85e` |

只读源码核验得到当前 agent 树：

| 相对路径 | 字节 | SHA-256 |
| --- | ---: | --- |
| `README.md` | 66 | `18dad2a97b4860934be8e15e007c3bb435c222aeaf0113cb1fe9adfaee9eda32` |
| `index.ts` | 46,371 | `b2e460220a7ee037fec883fa3fb19e285fa2789846c0af7807099683f2e81255` |
| `repetition.ts` | 7,466 | `e21e2cb7f0d05e82ea2fae37224296188e70c9930521e8474f0992ba0593b323` |
| `task-state.ts` | 21,264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |

按 builder 的 UTF-8 字面路径顺序重算，结果为 4 文件、75,167 字节、
`a13b0857f9f8ff04b0b3669f65a73ab4b0b263735e9c58ea1b487888838df85e`，与批准 after
身份完全一致。

配置反演只使用源文本字面替换，不导入或执行配置：

- 新目标根路径出现 1 次，旧根路径残留 0 次。
- 新树数据块出现 1 次，旧树数据块残留 0 次。
- 撤回两处后，结构字节比较为 `True`。
- 撤回后长度 20,465 字节，SHA-256 精确回到 `4bc9…0219`。

因此除这两处数据外，其余配置字节保持。另外 17 棵树、53 个文件/引用、18 个 legacy、
builder 入口、默认值、固定 Node、tsx、tsdown、esbuild、HEAD 和 25 项输出映射均未变。
没有使用数组 `-ceq` 伪证，也没有新增动态信任或哈希库。

## 4. 命令台账与非零记录

全部实际命令使用：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
sandbox=managed/use_default
workdir=D:\Lawbeach\lawbench-A
```

| 编号 | 实际动作 | 返回 | 写入 |
| --- | --- | ---: | --- |
| `C01` | `Get-Content -Raw` 正式执行令 | 0 | 无 |
| `C02` | `Get-ChildItem -Recurse` 输入目录 | 0 | 无 |
| `C03` | `git status --short --branch --untracked-files=all` | 1 | 无 |
| `C04` | `Get-Content -Raw` `PROJECT-PROFILE.md` | 0 | 无 |
| `C05` | 只读 Git status，忽略子模块，列出外层 dirty | 0 | 无 |
| `C06` | 检查新建前目标目录 | 1 | 无 |
| `C07` | `Get-FileHash` 三份输入 | 0 | 无 |
| `C08` | `Get-Content -Raw` `build-approved-inputs.json` | 0 | 无 |
| `C09` | `Get-Content -Raw` 输入 `build-config.mjs` | 0 | 无 |
| `C10` | `Get-Content -Raw` 输入 `build-private.mjs` | 0 | 无 |
| `C11` | `rg` 检索既有 T18 构建/消费者说明 | 0 | 无 |
| `C12` | 列出最近 T18 证据目录 | 0 | 无 |
| `C13` | `Get-Content -Raw` 根侧 unit/types 原始证据 | 0 | 无 |
| `C14` | 核对目标存在性、HEAD、产品和测试哈希 | 0 | 无 |
| `C15` | `rg --files` 列 T18 证据文件 | 0 | 无 |
| `C16` | 列出 `GeneralQuestionGate-20261029-033824` | 0 | 无 |
| `C17` | `Get-Content -Raw` 必问闸门 README | 0 | 无 |
| `C18` | `Get-Content -Raw` 通用文书原生消费者 README | 0 | 无 |
| `C19` | 误填 `shell=bash` 读取私有构建 README | 未启动 | 无 |
| `C20` | 误填 `shell=bash` 读取旧私有配置交回 | 未启动 | 无 |
| `C21` | 列出协调目录 T18/General 文件 | 0 | 无 |
| `C22` | `Get-Content -Raw` 七路径修正说明 | 0 | 无 |
| `C23` | `rg` 检索 T18 标题、manifest 和四针说明 | 0 | 无 |
| `C24` | `rg` 定位消费者两个编译导入 | 0 | 无 |
| `C25` | 列出协调目录 T18/General 输入目录 | 0 | 无 |
| `C26` | `Get-Content -Raw` B 线标题契约交回 | 0 | 无 |
| `C27` | 误填 `shell=bash` 读取 B 线标题契约令 | 未启动 | 无 |
| `C28` | `Get-Content -Raw` A 线必问闸门交回 | 0 | 无 |
| `C29` | `Get-Content -Raw` 草稿反馈构建 README | 0 | 无 |
| `C30` | `Get-Content -Raw` 草稿反馈构建正式交回 | 0 | 无 |
| `C31` | 误填 `shell=bash` 读取三个构建文件哈希 | 未启动 | 无 |
| `C32` | 首次行尾/字节统计，PowerShell 数组切片解析失败 | 1 | 无 |
| `C33` | 新建准备目录并逐字节复制 builder/config | 0 | 2 文件 |
| `C34` | `apply_patch` 改配置根路径和 agent 树数据 | 0 | 1 文件 |
| `C35` | 核对输入/目标 config 长度、行尾和哈希 | 0 | 无 |
| `C36` | 字面反演并计算整文件长度/哈希 | 0 | 无 |
| `C37` | 对反演结果做直接结构字节比较 | 0 | 无 |
| `C38` | 首次 agent 树摘要，默认排序不符冻结算法 | 0 | 无；结论不采信 |
| `C39` | builder 与输入直接结构字节比较 | 0 | 无 |
| `C40` | 核对准备目录当前文件与输出目录数量 | 0 | 无 |
| `C41` | `Sort-Object -CaseSensitive` 重算，仍非字节序 | 0 | 无；结论不采信 |
| `C42` | 用 `StringComparer.Ordinal` 重算 agent 树 | 0 | 无 |
| `C43` | `Get-Content -Raw` `formal-report` skill | 0 | 无 |
| `C44` | `Get-Content -Raw` `cn-prose` skill | 0 | 无 |
| `C45` | `apply_patch` 新建准备 README | 0 | 1 文件 |
| `C46` | 核对三文件、目录数量、输出数量和 SHA | 0 | 无 |
| `C47` | `Select-String` 只读核对配置关键行 | 0 | 无 |
| `C48` | 路径限定只读 Git status | 0 | 无 |
| `C49` | `apply_patch` 新建本正式交回件 | 0 | 1 文件 |
| `C50` | 落盘后只读核对交回件与准备目录 | 待执行 | 无 |

非零记录：

1. `C03`：Git 进入
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 时 `Permission denied`。
   未修锁、权限、ACL 或子模块。
2. `C06`：新建前目标目录不存在，返回 1 属预期，未写入。
3. `C19`、`C20`、`C27`、`C31` 四次误填 `shell=bash`。MXC 在任何 shell 或命令启动前
   拒绝；没有执行 Bash、PowerShell 命令或被读取源码，没有写入。后续全部用指定原生
   `pwsh.exe`、`login=false` 重做。
4. `C32`：首次行尾统计因 PowerShell 数组切片表达式解析失败返回 1；未创建文件，随后
   简化命令成功。
5. `C38`、`C41`：两次 agent 树摘要所用排序不满足 builder 的 UTF-8 字面序。两次均未
   写入；最终结论只采用 `C42` 的 ordinal 结果。

## 5. runtime、Git 与保密边界

Runtime 执行次数为 **0**：

- 未运行 Node、Python、TSX、tsdown、esbuild、parser、AST、import、类型检查、测试、
  build、prepare、HTTP、模型、GPU、GUI、SSH 或消费者。
- `build-config.mjs` 未被导入或执行；只做过 `Get-Content`、`Select-String` 和内存字面
  字节反演。
- 未创建 `private-output-*`，`BUILD_NOT_ADMITTED`。
- 未安装依赖、未启动 setup、未改默认 package、库、构建器、框架或全局设置。
- 未读取环境变量、Key、密码、provider credential、DPAPI、keyring、真实案卷或业务历史。
- 当前 PID 是本次唯一 writer；没有启动第二 writer，没有拆 writer lock。

Git 全程只读。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存。
路径限定 status 只显示新增准备目录为未跟踪。index 或子模块权限拒绝不作为交付修复项。

## 6. 后续与遗留

ROOT 应先完整复核本目录、整文件配置反演、全部源码、原始证据、命令、写面和清理边界。
复核通过后，按令用本目录冻结 builder 做一次全新的 25 文件私有开发编译，不使用安装器或
打包流程。

编译后，ROOT 才可为既有数据消费者配置四个当前编译产物路径、字节与 SHA，保留两个绝对
`file:///` 导入，并写入新 manifest 摘要。B 线标题契约候选不归本线编辑；不得启动旧
`0e73…` 编译件冒充新的 general-question 功能。canonical 用户 prompt、五份材料、Skill、
回答、新 R、`MAX32768` 和 32/48/45 预算继续固定。

本次没有模型或真实业务通过，不能由 unit、types、构建准备或未来 build 单独推出质量
PASS。Gate 1、完整 T18、项目验收和 Packaging 状态均未改变。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 4 / 过程 1 / 黑名单 0

Response ID：`A-T18-general-private-config-20261029-034531`  
Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T18-general-private-config-20261029-034531.md`
