# B-T18 Prior Coverage 契约修正交回

状态：`SOURCE_HANDED_BACK_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正 `assertTaskCoverage` 的组别形状解析，保留首次主错误并把 cleanup、最终 pin 与凭据清理失败记为次生失败；更新 consumer pin，新增精度说明。 |
| 目标是什么 | 让 Root 能用旧 stage 1 原始证据通过正确契约观察，并在后续单独授权时继续剩余 `doc-revise`；本线不实施 continuation。 |
| 在等什么 | 等 Root 审查当前 consumer 与 manifest，完成其授权范围内的静态审查、编译和 admit。若收到编译/源码问题，按新证据返修。 |
| 卡在哪 | 没有源码交回阻塞。只读 `git status` 因共享 `dsh` 子模块目录权限被拒，按令不修权限、锁、ACL 或审批。 |

## 当前文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts` | 114,851 | `2e34cf9435ef1cafac0ea0f28b219f19d46778f1a193f063345316f5d3cadd9d` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json` | 19,484 | `aa4d289ed4429f0a907232c233bb1564deeef1daf575ba1d34a36360b3e91b73` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py` | 38,214 | `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-prior-coverage-contract-20261029-012823.md` | 2,857 | `84487b17c4b8960829a133d14fe7ccdfa0fce037414f0957d3af16facf44706c` |

修订前 consumer 为 112,104 字节、`d9602629f65a13d97e0a6aa2aa232b039bb28fd84ce163676633eead38e1bc76`。修订前 manifest 为 19,484 字节、`dbca629100335db645d3b590b568b25d0c57cc58d14acd03fd2f2013fb3db6b0`。伴生服务保持执行令指定字节数与 SHA。

## 修了什么

1. `assertTaskCoverage` 现在按 `common.schema.json/$defs/coverage` 解析四组：

   - `fully_read` 与 `not_read` 是字符串数组。
   - `partially_read` 是只含 `name`、`read_units`、`total_units` 的对象数组；后两项必须是不小于零的整数。
   - `unreadable` 是只含 `name`、`reason` 的对象数组；两项必须是字符串。
   - `total` 必须为 2，原两个材料名跨四组恰好出现一次，不允许额外、缺失或重复。
   - 没有要求全部材料已完整读取；truthful partial 仍可观察。

2. 主错误只写一次。`catch` 中的首个实际错误存入 `report.error`。后续 cleanup、最终固定输入核验、输出重定向恢复与凭据清理失败追加到 `cleanup.failures`；只有此前没有主错误时才用次生失败回填 `error`。`status=FAILED` 条件、两阶段协议要求、citation/read/model/quality 判定均未放宽。

3. manifest 只改 consumer 的 `bytes` 与 `sha256`。B 服务脚本整文件未动。

## 依据与验证

- 实际旧报告与输入副本均为 24,456 字节、SHA-256 `3cb1cb4ad133306a361f37e75acc342ab1f856bfa28bbd9d9d25bf13dfd5943c`；仍为 `status=FAILED`，旧 `two_stage_protocol_incomplete` 与 cleanup 次生失败均保留。
- 实际 stage 1 的 `task.json`、`result.json`、`reads.json` 与输入副本逐字节一致，SHA-256 分别为 `63758b80ede3c64d3ee8e747e9da5457b677f026e810b0a09635224735905c2d`、`15352d914ca8d37106ecefc7ca45d1b9042145661d0a8b1f1e0a78ac7db9cd1a`、`c121bde3eb83e2c43715f87a2c8a1ccc6cbcc9980f132ebecd79f46588c17cd2`。
- 实际 coverage 为 `total=2`、`fully_read=[]`；`采购合同` 为 26/47，`采购部内部意见` 为 4/10；`not_read=[]`、`unreadable=[]`。该实际形状现能被正确解析。
- consumer 对前置输入的只读 diff 只包含 coverage 解析和首错保留相关代码。
- manifest 对前置输入的只读 diff 只包含第 390、391 行的 consumer 数值。
- 伴生服务 SHA-256 仍为 `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a`。
- 源码和 manifest 的 Hash 均由只读 `Get-FileHash` 取得，字节数由只读 `Get-Item` 取得。

## 反向核销

- 旧运行报告没有改成 PASS；stages 仍为空，stage 2 仍未开始。
- 没有把 `actualTwoSkillWorkflow`、模型清单或修订稿声明为完成。
- 没有把 `two_stage_protocol_incomplete` 改成产品缺陷、模型质量问题或资源泄漏。
- 没有重演 stage 1 的 10 次模型请求，没有新增模型调用或 HTTP 请求。
- 没有新增 prompt 变体、案例、材料、答案、预算或 continuation 模式。
- 没有修改产品代码、Skill、契约、B 服务、旧报告、旧交回件或冻结输入。
- 没有启动第二 writer，没有拆 writer 锁。
- 没有修改沙箱、审批、ACL、权限或 Git 锁。
- 没有执行 Git 写操作。

## 未做与降级

没有运行 Node、Python、tsx、解析器、AST、导入、测试、编译、构建、预检、prepare、候选、HTTP、模型、GUI、SSH、凭证读取或 DPAPI。没有运行产品或 B 服务。没有声明编译通过、测试通过、两阶段通过或质量通过。

## 写面孔

- `apply_patch` 一次修改 `native-genuine-quality-revision.mts`。
- `apply_patch` 一次只改 `fixed-inputs.json` 的 consumer `bytes`/`sha256`。
- `apply_patch` 新增 `precision-note-prior-coverage-contract-20261029-012823.md`。
- `apply_patch` 新增本交回件。
- 没有其他文件写入；没有 Git 写入；没有外部消息；没有模型或网络调用。

## 实际命令与全部非零

以下列出本次全部 shell 调用。`0` 表示命令成功；`1` 表示非零。所有 shell 均为 PowerShell，没有使用 bash。命令 39、40 的 `shell` 参数误写为 `native-powershell` 路径，但实际执行仍是 PowerShell；已用精确 native path 在 41、42 复跑关键检查。

1. `0` 读取正式执行令。
2. `1` 一次性核对目标文件、固定输入、前置输入与工作区。报错：执行令中的 companion 短名和 Before 单文件路径不存在；实际 companion 为 `.py`，Before 为目录；`git status` 另报共享 `dsh` 子模块权限拒绝。
3. `0` 列出 T18 consumer 所在目录。
4. `0` 列出协调目录中 T18/012823 文件。
5. `0` `git status --short --untracked-files=all --ignore-submodules=all`；输出发生工具截断，但命令退出 0。
6. `0` 读取 `actual-stage1-task.json`。
7. `0` 读取 `actual-stage1-result.json`。
8. `0` 读取 `actual-stage1-reads.json`。
9. `0` 读取 `b-service-final.json`。
10. `0` 读取旧 `report.json`。
11. `0` `rg` 定位 consumer 的 coverage、主错误与 cleanup。
12. `0` `rg` 定位服务 `task.py` 的 coverage、partial 和 unreadable。
13. `0` 统计 consumer 与 `task.py` 行数、字节数。
14. `0` 读取 `task.py` 全文；工具显示截断。
15. `0` 读取 consumer 第 1–900 行。
16. `0` 读取 consumer 第 901–1800 行。
17. `0` 读取 consumer 第 1801–2891 行；工具显示截断。
18. `0` 读取 `task.py` 第 1–400 行。
19. `0` 读取 `task.py` 第 401–786 行。
20. `0` 补读 consumer 第 1801–2200 行。
21. `0` 补读 consumer 第 2201–2600 行。
22. `0` 补读 consumer 第 2601–2891 行。
23. `0` 读取旧 observer 精度说明。
24. `0` 读取上一份正式交回件。
25. `0` 只读取 consumer、manifest、B 服务三者字节数与 SHA。
26. `1` consumer 对前置输入的 `git diff --no-index`；差异符预期，只显示授权修订。
27. `0` 修改后只读取 consumer 字节数与 SHA。
28. `0` 查看修改后的 coverage 函数。
29. `0` 查看修改后的主错误与 cleanup 块。
30. `1` manifest 对前置输入的 `git diff --no-index`；差异符预期，只显示 consumer 两字段。
31. `0` 只读取 consumer、manifest、B 服务新 pin。
32. `0` `rg` 复核 `report.error`、`sanitized.error`、cleanup、PASS 门槛和 B stop。
33. `0` 查看 manifest consumer/B service 尾段。
34. `0` 对比旧报告与 stage 1 三个文件在执行令输入和工作树中的 SHA，四组均相等。
35. `0` 查看最终错误保留与凭据清理块。
36. `0` `rg` 复核 `第七条`、`4.1`、初始 claims 与 coverage 约束仍在。
37. `0` 读取 `formal-report` skill。
38. `0` 读取 `cn-prose` skill。
39. `0` 查看新增精度说明；该次 `shell` 参数存在路径拼写偏差。
40. `0` 读取新增精度说明的字节数与 SHA；该次 `shell` 参数存在同一拼写偏差。
41. `0` 用精确 native PowerShell path 重读精度说明。
42. `0` 用精确 native PowerShell path 重取精度说明字节数与 SHA。

非零 shell 调用共 3 次：命令 2 的路径命中与 `dsh` 权限问题，命令 26、30 的 `git diff --no-index` 因存在预期差异返回 1。三个调用的原因已分别列明。

## 实际 shell 命令原文

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-prior-coverage-contract-order-20261029-012823.md' -Raw`
2. `$paths = @('D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.companion.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823.md'); Get-Item -LiteralPath $paths | Select-Object FullName,Length,LastWriteTime; Get-FileHash -Algorithm SHA256 -LiteralPath $paths | Select-Object Path,Hash; git status --short --untracked-files=all`
3. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226' -Force | Select-Object Name,Length,LastWriteTime,Mode`
4. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -Force | Where-Object { $_.Name -like '*T18*' -or $_.Name -like '*012823*' } | Select-Object Name,Length,LastWriteTime,Mode`
5. `git status --short --untracked-files=all --ignore-submodules=all`
6. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-task.json' -Raw`
7. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-result.json' -Raw`
8. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-reads.json' -Raw`
9. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\b-service-final.json' -Raw`
10. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\report.json' -Raw`
11. `rg -n -C 35 "assertTaskCoverage|coverage|cleanup failed|report\.error|finalPin|final pin" 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
12. `rg -n -C 30 "coverage|partially_read|unreadable|read_units|total_units" 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py'`
13. `$file = 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py'; $lines = Get-Content -LiteralPath $file; [pscustomobject]@{Path=$file;Lines=$lines.Count;Bytes=(Get-Item -LiteralPath $file).Length}; $source = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $sourceLines = Get-Content -LiteralPath $source; [pscustomobject]@{Path=$source;Lines=$sourceLines.Count;Bytes=(Get-Item -LiteralPath $source).Length}`
14. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' -Raw`
15. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[0..899]`
16. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[900..1799]`
17. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1800..2890]`
18. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py'; $lines[0..399]`
19. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py'; $lines[400..785]`
20. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1800..2199]`
21. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2200..2599]`
22. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2600..2890]`
23. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-observer-lifecycle-20261029-010724.md' -Raw`
24. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T18-explicit-prior-observer-precision-20261029-010724.md' -Raw`
25. `$items = Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json'; foreach ($item in $items) { $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $item.FullName).Hash; [pscustomobject]@{Path=$item.FullName;Bytes=$item.Length;SHA256=$hash} | Format-List }`
26. `git --no-pager diff --no-index --no-ext-diff --unified=4 -- 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\native-genuine-quality-revision.mts' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
27. `$path = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $item = Get-Item -LiteralPath $path; $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash; [pscustomobject]@{Path=$path;Bytes=$item.Length;SHA256=$hash} | Format-List`
28. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[1630..1705]`
29. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2780..2890]`
30. `git --no-pager diff --no-index --no-ext-diff --unified=2 -- 'D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\fixed-inputs.json' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json'`
31. `$paths = @('D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py'); foreach ($path in $paths) { $item = Get-Item -LiteralPath $path; $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant(); "{0}|{1}|{2}" -f $item.FullName,$item.Length,$hash }`
32. `rg -n "function assertTaskCoverage|partially_read|unreadable|report\.error =|sanitized\.error =|cleanupFailures\.push|actualTwoSkillWorkflow =|report\.status = 'PASS'|service\.stop\(\)|forcedStop" 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
33. `$path = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json'; $lines = Get-Content -LiteralPath $path; $first = [Math]::Max(0, $lines.Count - 18); $first..($lines.Count - 1) | ForEach-Object { '{0}:{1}' -f ($_ + 1),$lines[$_] }`
34. `$pairs = @(@('D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\report.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\run-Bf3ztJ\report.json'),@('D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-task.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\run-Bf3ztJ\case\工作区\任务\T-20261029012044-5869\task.json'),@('D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-result.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\run-Bf3ztJ\case\工作区\任务\T-20261029012044-5869\result.json'),@('D:\Lawbeach\lawbench-coord\T18PriorCoverageContractInput-20261029-012823\actual-stage1-reads.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\run-Bf3ztJ\case\工作区\任务\T-20261029012044-5869\reads.json')); foreach ($pair in $pairs) { $left = Get-Item -LiteralPath $pair[0]; $right = Get-Item -LiteralPath $pair[1]; $leftHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $pair[0]).Hash.ToLowerInvariant(); $rightHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $pair[1]).Hash.ToLowerInvariant(); "{0}|{1}|{2}|{3}|{4}" -f $pair[0],$left.Length,$leftHash,($leftHash -eq $rightHash),$right.Length }`
35. `$lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'; $lines[2888..2948]`
36. `rg -n "seven|七|4\.1|actualTwoSkillWorkflow = false|actualModelAuthoredChecklist = false|actualModelAuthoredRevision = false|task coverage total is not two|names\.length !== 2" 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts'`
37. `Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\formal-report\SKILL.md' -Raw`
38. `Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\cn-prose\SKILL.md' -Raw`
39. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-prior-coverage-contract-20261029-012823.md' -Raw`
40. `$path = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-prior-coverage-contract-20261029-012823.md'; $item = Get-Item -LiteralPath $path; $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant(); "{0}|{1}|{2}" -f $item.FullName,$item.Length,$hash`
41. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-prior-coverage-contract-20261029-012823.md' -Raw`
42. `$path = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-prior-coverage-contract-20261029-012823.md'; $item = Get-Item -LiteralPath $path; $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant(); "{0}|{1}|{2}" -f $item.FullName,$item.Length,$hash`

## 下一步建议

Root 先只读审查当前 consumer 与 manifest pin，再按自身权限完成静态审查、编译和 admit。当前不需要 B 线再做人工动作；若获得新的真实编译错误、源码失败或后续独立 continuation 授权，把原始证据和当前 SHA 交回 B 线，再开有界返修。

删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 1 / 过程 0 / 黑名单 1

Response ID: chat reply
Response log path: chat reply
