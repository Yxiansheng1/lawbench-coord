# HANDBACK — B / T18 Mainline Fact Check

状态：SOURCE_ONLY_COMPLETE

目标文件：`D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md`

## 交付结果

- 在既有 dirty 上补齐了定位回读后的事实清单流程：按不利、有利、争议事实分类，逐项保留原件出处和短引文；独立不利事实不得合并；写作前映射到实际草案章节或律师确认事项。
- 保存前要求把当前草稿的标题原文与原件归属逐项对照；单方陈述的依据必须进入标题本身，不能只在正文补归属。
- 最终律师答复新增短表：独立不利/争议事实及短引文 → 原件出处及短引文 → 当前草稿实际章节/短引文或未解决事项。该表仍留在答复中，不进入法律文书草稿。
- 自检要求具体到草稿实际标题、原件短引文/出处和事实清单在草稿中的落点；禁止用 `citation_check` 数量、保存成功或草稿完整代替实际核验。发现问题先改正并用同一标题保存后复核，无法核实不得 PASS。
- 覆盖披露明确只取最后一次真实保存的 `coverage`。读取计数不得用于定位未读前缀/后缀，不得从 `read_units` 推断后续位置；只有实际返回范围可写，缺失完整物理区间时写“精确未读位置：未提供”，不得作未读部分无影响或事实已全部完成的断言。
- 开头模板继续只在【待补充】内处理委托和已开展工作，不预设已经接受委托、阅卷或会见；日期占位和律师法律核实边界保留。
- 未增加工具、产物、字段、分类器、guard、预算或强制全案读取；未写测试答案或具体案件样例数据。

## 边界与状态核对

- 修改仅限目标 Skill 的非共用区。零上下文差异中未出现 frontmatter、`name/owner/params/tools`、三个必问问题或共用规则 marker/block 的变更。
- 原有 dirty 全部保留；未执行 Git 写操作，未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 初次 `git status --short` 因 submodule `dsh` 指向的 worktree 元数据目录权限被拒而未完成；目标文件限定 `git diff` 正常返回。按令未尝试修复权限、锁、ACL、沙箱或审批，也不将其扩大为产品交付阻碍。
- `AUTHORED_NOT_RUN`：未运行安装、setup、调研、构建、全量/离线测试、模型或实际案件回放，未运行 49152/0.6/32+48 预算实验，未由作者运行有界实际案件。
- 未联系其他聊天，未更换 API，未写协调目录机密。

## 原生只读核验

最终一次原生 SHA-256/字节数核验：

```text
PATH=D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md
BYTES=20018
SHA256=44CD01606577963DA6DCA861521D3AF9AF1E1337C0043CFC08E4863D720F08DF
```

Runtime: 0.240s

## 实际原始命令

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\ORCH-B-T18MainlineFactCheck-20261101-105336.md' -Raw
```

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md' -Raw
```

```powershell
git status --short; git diff -- skills/defense-opinion/SKILL.md
```

```powershell
git diff --unified=0 -- skills/defense-opinion/SKILL.md
```

```powershell
$targetPath = 'D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md'; $targetFile = Get-Item -LiteralPath $targetPath; "PATH=$($targetFile.FullName)"; "BYTES=$($targetFile.Length)"; "SHA256=$((Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash)"
```

文件编辑由 `apply_patch` 完成；上述 Git 命令均为只读，最终 SHA/字节数命令是该源码文件修改后的唯一 SHA-size 检查。
