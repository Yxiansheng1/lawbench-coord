# T34 私有配置可交根复核

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 在 A 线新增并复核三份配置证据；builder 与输入字节一致，配置只更换三段限定数据，当前 UI 全树匹配 approved。 |
| 目标是什么 | 给根执行器一份可独立审查的 T34 私有构建配置；离终门还差全树逆变换、18 树/53 pins/setup cleanup 复核及获准后的新输出构建。 |
| 在等什么 | 等根执行器的配置准入信号。信号是独立确认旧 UI 树可精确恢复；到信号后才允许接纳源码并跑一次全新私有构建。 |
| 卡在哪 | 本次工作没有停摆。全树 Git 状态受既有 `dsh` 子模块权限拒绝；执行令所述 source-pin 未在 A 线或协调目录找到。两项均未修权限，也不阻止本配置交回。 |

状态为 `CONFIG_ONLY_READY_FOR_ROOT_REVIEW`。本交回件不宣称 T34、业务、native
settings write、GUI 或 private output 已通过。底层 `ConfigEditor.edit`
写拒绝原因仍为未知，未修。

## 决策完成度

| 已合流可见 | 在飞 | 已裁未派工 | 候 owner |
| ---: | ---: | ---: | ---: |
| 0 | 1，本配置交回 | 0 | 0 |

## 产物

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| A 线 `build-private.mjs` | 32121 | `347AE08143138724DB02017FD4243D56F950D2F1A2E7FDF9EF53EC557AB47B55` |
| A 线 `build-config.mjs` | 20467 | `15C563D06618571F420423D87D1521DDD00F0AFF351B433C0C4F26C416254046` |
| A 线 `README.md` | 12945 | `90ECB2D41EA20D8503490B798AC50C85BD80C44D11016950F1BE43F3F5E2B26C` |

builder 输入和产物的 SHA-256 精确相同。配置输入为 20465 bytes、
`4BFB5FAB7465DC381A279788AD4349ECCAD89ADF55761624E370BD7EB55B554F`；
产物反向替换三项数据后逐字节恢复到该输入。

## 精确变更

| 配置项 | 输入值 | 交回值 |
| --- | --- | --- |
| `EVIDENCE_ROOT` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TaskSkillPrivateBuild-20261030-023904` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\IdempotencePrivateBuild-20261030-085828` |
| `lawbench-ui-source.files` | 92 | 92 |
| `lawbench-ui-source.bytes` | 637497 | 639385 |
| `lawbench-ui-source.sha256` | `16453fdee71df01f487d95f1b5afed87203d7a5191150cea63930b9f62b743a1` | `57c096501f307c3633bd0139d135a2f00b4facf005303d594fc02db239617209` |

其余 builder 字节、17 棵树、39 个 file pins、14 个 reference pins、25 个 intended
outputs、53 个总 pins、legacy 18-tree 结构、output 清单和 loader 路径均未改。

当前 approved UI 树有 92 个文件、639385 bytes，全树摘要精确为
`57c096501f307c3633bd0139d135a2f00b4facf005303d594fc02db239617209`。
`settings.tsx` 为 39858 bytes / `e6f5e5fb…`，`state.ts` 为 18994 bytes /
`d93174f1…`，其余 90 文件逐项沿用 approved rows。根执行器仍须用自己的
approved-before 行，仅替换这两个文件，独立确认旧树精确恢复到
`92 / 637497 / 16453fde…`。

A 线未找到执行令提到的
`outputs/T34-disabled-idempotence-source-reviewed-current.json`。因此旧树逆变换
目前是根复核前置项，不能记作 A 线已独立核过。

## 保持不变的运行边界

Agent 4-tree `80724 / f104a046…`、当前 A index `e787`、Task 821、现有 TaskSkill
25-output manifest `30d4`、当前 GUI 旧私有输出 `19411225`、E50 runtime、SDK、
source/lib、status、raw、formal 和 served roots 均保持原样。没有 installer、package、
default build、lib write、loader 或 SDK 变更。没有创建 `private-output-*`。

## 依据与验证

1. 四个输入文件已复取长度和 SHA-256，与执行令及预期一致。
2. builder 输入和产物均通过 SHA-256 字节一致性核对。
3. 配置三项替换均找到唯一 ASCII 字节位置；逆替换后为 20465 bytes，且与输入配置
   逐字节相同。
4. 当前 `dsh-ext/ui` 逐项对照 approved rows：92 files、0 extra、0 missing、
   0 changed；按 builder 的 ordinal 方法重算全树摘要为 `57c096… / 639385`。
5. builder 静态约束确认：配置和脚本须同处证据根，`--out` 必须为该根下的全新直接
   子目录。本卡仅提供配置，未启动 builder。
6. 继承既有 source/test/inverse/formal 复核：root actual-40 scoped unit 为 PASS、
   0 fail，另有 4 个旧 Agent case 按计划 pending；type 为 0；8 个 OS case 已不在；
   forced 为 false；source 保持。底层真实 settings 写拒绝原因仍为 UNKNOWN。

完整文件级说明、旧值、边界和命令台账见
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\IdempotencePrivateBuild-20261030-085828\README.md`。

## 未做与降级

删减轮：读者 1 / 槽位 0 / 半句 1 / 重复 0 / 过程 0 / 黑名单 0

- NOT_RUN：Node、Python、AST/parser、import、Vitest、测试、类型检查、构建。
- NOT_RUN：builder、新 `private-output-*`、package/install/default build。
- NOT_RUN：GUI、HTTP、模型、SSH、DPAPI、环境 Key、网络探测。
- NOT_RUN：底层 native settings 写入、E50 runtime、served profile 或安装替换。
- runtime 0：本次作者没有运行上述动作，也没有读取或输出 Key、密码、真实案卷。
- 降级：只提供静态配置证据；底层 settings 写失败仍未知，不扩大既有 scoped 结果。

## Git 与 dirty

Git 全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout` 或 `push`，未暂存、未提交，未修改 index、锁、ACL、审批或沙箱。
因此没有 Git 提交 SHA；本交回件就是交付记录。

`git status --short` 因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied
返回 exit 1。未修锁、未扩权。对 UI 的只读 Git 查询显示 HEAD 不是本卡所需的
approved-before 快照；既有 dirty 原样保留。当前 PID 是本次唯一执行者。

## 非零记录

1. 全树 `git status --short`：exit 1，`dsh` 子模块权限拒绝。
2. 首次读取执行令所述 source-pin 的假定路径：exit 1，文件不存在；递归检索仍未找到。
3. 两个预期无命中的 `rg` 检索：exit 1，无匹配。
4. PowerShell 默认排序的错误 UI 摘要试算未被采信；ordinal 重算后得到令定摘要。
5. 一次 ordinal 写法触发 PowerShell 非终止方法绑定错误；随后用干净的
   `List<string>.Sort(StringComparer.Ordinal)` 从实际文件重算并确认。
6. 一次并行工具调用因重复 JSON 字段在执行前被工具层拒绝，没有启动 shell。
7. 一次只读列目录命令误填 `bash`，运行器以 `Bash/E_ACCESSDENIED` 在执行前拒绝，
   exit 1；没有执行 bash/cmd，没有文件或状态变化。

## 实际命令台账

实际启动的非拒绝命令均显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，
均 `login=false`，工作目录为 `D:\Lawbeach\lawbench-A`。并行批次按一次工具调用计。

1. exit 0：读取正式执行令。
2. exit 1：`git status --short`，子模块 `dsh` 权限拒绝。
3. exit 0：列出并哈希四个输入文件；列出 T34 既有证据目录。
4. exit 1：读取假定的
   `docs/plan/evidence/T34/outputs/T34-disabled-idempotence-source-reviewed-current.json`，
   文件不存在。
5. exit 0/1：检索 source-pin 并读取 `build-config.mjs`、
   `old-config-data.json`、`approved-ui-tree.json`；其中 source-pin 检索无匹配。
6. exit 0：列出 DisabledIdempotence 证据，哈希当前 `settings.tsx`、`state.ts`
   并读取执行令输入配置。
7. exit 0/1：在 A 线、主编排工作树和协调目录查找 source-pin；未找到时相应检索退出 1。
8. exit 0：逐项比较当前 UI 树与 approved rows，结果为 92 files、0 extra、
   0 missing、0 changed。
9. exit 0：静态读取 builder 的目录与输出约束、builder 前 180 行，定位配置三项旧值。
10. exit 0：确认交付路径原本不存在，创建证据目录，逐字节复制 builder，执行三个
    “恰好一次”ASCII 字节替换并写 `build-config.mjs`。
11. exit 0：复取 builder/config SHA-256，读取配置中的新值，执行三项逆替换并与输入
    配置逐字节比较。
12. exit 0：首次 PowerShell 默认排序试算 UI 摘要，得到未被采信的
    `045A1136…`；随后两次 ordinal 试算出现非终止方法绑定错误，最终使用干净的
    `List<string>.Sort(StringComparer.Ordinal)` 从实际文件得到 `57C096…`。
13. exit 0：`git diff --numstat`、`git ls-files --stage`、`git rev-parse HEAD`、
    `git diff --name-only -- dsh-ext/ui`、`git ls-tree` 只读查询；HEAD 为
    `a23271abee333a9a256fd46a3141da16975c2380`。
14. exit 0：读取 DisabledIdempotence README，检索旧 UI 摘要引用，列出本目录产物。
15. exit 1：一次误用 `bash` 的列目录命令在执行前被拒绝；随后以指定 PowerShell
    成功列出旧输入目录。
16. exit 0：读取 `formal-report` 与 `cn-prose` 的完整说明。
17. 编辑：`apply_patch` 新增 A 线 README。
18. exit 0：扫描 README 的必需边界、尾随空白和三份证据文件清单；0 行尾随空白，
    目录无 `private-output-*`。
19. exit 0：复取 README、builder、config 的最终 SHA-256 和字节数。
20. 编辑：`apply_patch` 新增本正式交回件。
21. exit 0：只读复核本交回件、最终哈希、证据目录三文件清单，并确认没有
    `private-output-*`。
22. exit 1：一批最终哈希检查中的 PowerShell 键名写法触发 ParserError；同批其余
    静态检查和稍后重跑不受影响。
23. exit 0：重跑必需边界扫描，发现正式件缺少明确的 `ConfigEditor.edit` 字样；
    同一批尾随空白、四问和旧 README 哈希引用检查通过。
24. 编辑：`apply_patch` 在正式件补充 `ConfigEditor.edit` 未修边界和删减轮记录。
25. 编辑：`apply_patch` 更新 README 台账，并将本正式件引用的 README 哈希改为最终值。
26. exit 0/1：最终静态扫描成功；同批的四个哈希对象展示再次因 PowerShell
    键名表达式触发 ParserError，未作为哈希结论采信。
27. exit 0：改用简单 `Get-FileHash -Algorithm SHA256 -LiteralPath` 分项读取四个
    交付文件，得到最终哈希。
28. 编辑：`apply_patch` 把本次非零写入双方台账，并把本正式件引用的 README 哈希
    更新为本次编辑后的最终值。
29. exit 0：只读确认四个最终哈希、README 哈希引用、必需边界、四问、
    零尾随空白和零 `private-output-*`。

## 下一步建议

根执行器先独立核配置逆变换和旧 UI 全树：仅换回 `settings.tsx` 与 `state.ts`
批准前版本，确认其余 90 文件保持并精确恢复旧树摘要。随后复核 18 棵树、53 pins、
25 outputs、setup/cleanup 和 dirty。全部通过后才接纳源码并运行一次全新
`private-output-*`，最后只核对实际变化产物与受影响 GUI。底层 native settings
写拒绝另列未知项处理。

Response ID: `A-T34-IDEMP-PRIVATE-CONFIG-20261030-085828`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-idempotence-private-config-20261030-085828.md`
