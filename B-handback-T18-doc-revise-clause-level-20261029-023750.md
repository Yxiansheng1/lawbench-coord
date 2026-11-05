# T18 `doc-revise` 条款层级边界正式交回

- 工单入口：`D:\Lawbeach\lawbench-coord\B-T18-doc-revise-clause-level-order-20261029-023750.md`
- 执行角色：B 线独立 DeepSeek 执行者；当前 PID 为本执行者，不是第二 writer
- 分支：`line-B`
- 状态：有界源码修改与文件交回完成；等待主编排审计和后续验证
- 发布状态：Gate 1、完整 T18、项目均为 INCOMPLETE；Packaging HOLD

## 结果

只修改了 `skills\doc-revise\SKILL.md`，新增一条通用的条款编号与层级核验规则及一条对应自检项。未新增示例答案、固定条款、fixture 专用名称或编号、提示词变体、框架、存储或解析逻辑。

“修改规则”新增内容：

> **条款与层级引用必须回原件核准**：修改涉及章、节、条、款、项等编号或层级时，回读原件核对具体编号及其上级层级；应指向原稿所描述的实际具体条款，不能只写其所属章、节等上位标题。审查意见中的编号只能作线索，也必须对原件复核；原件编号或层级不明确时，不猜补编号，在说明表里写明原件表述并请律师确认。

“自检清单”新增内容：

> 条款编号和层级已回原件核对；引用落在实际具体条款，未用上位标题替代，也未直接照抄审查意见编号；原件不明确的没有补造。

只读 diff 为 `2 0 skills/doc-revise/SKILL.md`，即 2 行新增、0 行删除；frontmatter、共用规则、原有出处规则和律师冲突确认规则均未出现在 diff 的删除或改写中。

## 哈希与路径

原工作树文件与指定输入副本一致：

- 大小：11,571 字节
- SHA-256：`9107EA54962A12521F4D4A0B824C494100359FB3A0A9968A3DB1CF86C65FE1F7`

修改后目标文件：

- 路径：`D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md`
- 大小：12,189 字节
- SHA-256：`23B048DF3CEEB8948E9A14DBC3C1E8031E98158908FB9421F30DE5F875D1FCCF`

证据说明：

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DocReviseClauseLevel-20261029-023750\README.md`
- 内容：修改范围、改动原文、哈希、全部命令、非零结果、写面和未运行边界

## 写入面

实际仅写入以下三个路径：

1. `D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md`（修改）
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DocReviseClauseLevel-20261029-023750\README.md`（新增）
3. `D:\Lawbeach\lawbench-coord\B-handback-T18-doc-revise-clause-level-20261029-023750.md`（新增，本交回件）

没有其他文件写入。未修改 common rules、其他 Skill、测试、产品 A/B、服务、契约 schema、SDK、运行时、私有编译件、旧 fixture、旧消费者、prompts、答案、模型预算或 source histories。

## Git 状态与非零结果

未执行任何 Git 写操作：没有 add、commit、rebase、merge、reset、clean、checkout、stash 或 push。未暂存、未提交。

普通 `git status --short` 是唯一非零命令，返回 1：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

按令未修复权限、未调整沙箱或审批、未修改 ACL、未拆 writer 锁。随后用只读 `git status --short --ignore-submodules=all` 确认 B 线既有 dirty 范围，并只改本次目标文件。

## author runtime 与 sourceNOTRUN

- author runtime：0
- 未启动 Node、Python、parser、AST、import、测试、构建、prepare、HTTP、模型、GUI、SSH、DPAPI 或其他运行时
- `build_skills.py`：NOT RUN
- `check_examples.py`：NOT RUN
- Skill 构建、契约检查、模型实测、产品运行：NOT RUN
- 未复用或重跑旧调查、安装、开工、全量测试或旧模型POST
- 未修改旧失败结论；`R8IeGo`、`Jwpm24`、`Bf3ztJ` 的历史失败仍为不可变事实
- 未声称具体条款 4.1 已由模型修正通过；实际模型重复只能在修改源码获主编排接受并配置新 pin 后执行

## 实际命令记录

以下为本次执行者实际调用的 shell 命令，保持原顺序与原文：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-doc-revise-clause-level-order-20261029-023750.md' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md' -Raw
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18DocReviseClauseLevelInput-20261029-023750' -Force | Select-Object Name,Length,PSIsContainer,LastWriteTimeUtc
git status --short
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md' -Algorithm SHA256 | Select-Object Algorithm,Hash,Path; (Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md').Length
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18DocReviseClauseLevelInput-20261029-023750' -Recurse -File | Select-Object FullName,Length,LastWriteTimeUtc
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18' -Force -ErrorAction SilentlyContinue | Select-Object Name,Length,PSIsContainer,LastWriteTimeUtc
git status --short --ignore-submodules=all
git branch --show-current
git diff -- skills/doc-revise/SKILL.md
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-coord\T18DocReviseClauseLevelInput-20261029-023750\skills\doc-revise\SKILL.md' -Algorithm SHA256 | Select-Object Algorithm,Hash,Path; (Get-Item -LiteralPath 'D:\Lawbeach\lawbench-coord\T18DocReviseClauseLevelInput-20261029-023750\skills\doc-revise\SKILL.md').Length
Test-Path -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DocReviseClauseLevel-20261029-023750'; Test-Path -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T18-doc-revise-clause-level-20261029-023750.md'
git diff -- skills/doc-revise/SKILL.md
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md' -Algorithm SHA256 | Select-Object Algorithm,Hash,Path; (Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md').Length
git diff --numstat -- skills/doc-revise/SKILL.md
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md' | Select-Object -First 16
Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\PROJECT-PROFILE.md' -Pattern '^## 3\.' -Context 0,80
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DocReviseClauseLevel-20261029-023750\README.md' -Algorithm SHA256 | Select-Object Algorithm,Hash,Path; (Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DocReviseClauseLevel-20261029-023750\README.md').Length
```

另执行四次 `apply_patch`：修改目标 Skill、新增证据 README、补记后续命令、新增本交回件。

## 待主编排处理

1. 先审计实际 `skills\doc-revise\SKILL.md` 的改动与字节边界，并按令决定和执行必要的只读检查。
2. 本交回不包含消费者配置、绑定变更、Skill pin、构建、安装包或模型复测；这些均未执行。
3. 修改源码被接受后，再由主编排按执行令处理精确 DS 数据面副本、旧 consumer/service/manifest 的唯一声明 `doc-revise` Skill pin 变更和后续实测。
4. 本件使用执行令指定的固定文件名，覆盖 `PROJECT-PROFILE.md` 中默认的“致 ORCH”命名模板。
