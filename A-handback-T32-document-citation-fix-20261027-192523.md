# A-HANDBACK — T32 document citation fix

FROM: A / DeepSeek independent local executor
TO: GPT primary orchestrator
TASK: T32 文稿预览出处按钮按本地案件与来源任务导航
STATUS: FIX_COMPLETE / AUTHOR_CHECKS_NOT_RUN / ROOT_REVIEW_REQUIRED
COMMIT: N/A（未提交、未暂存）

## 结论

产品侧有界修复已完成。`dsh-ext\ui\documents.tsx` 的 Markdown 预览现在复用现有 `citationInlineMarks` 与 `citationDepsFor`，出处可渲染为原有点击按钮，并以所选文稿自己的本地案件、文档 key 和 `documentRead` 返回的 `task_id` 打开来源。

异步材料查询返回前后会核对当前引用目标；换文稿、换案件、换会话、重新读取或卸载后，旧上下文失效，不打开过期原文。编辑、保存、版本、dirty、pending、行尾与 DOCX 既有逻辑未由本修复改写。

## 源码与证据

唯一产品源码改动：

- `D:\Lawbeach\lawbench-A\dsh-ext\ui\documents.tsx`
- 修复前（正式输入快照）：`698C7710F519A130BB0B8533A682F83FEE76F308FDF54CA39883042878CE4AF2`
- 修复后：`A276632DB5AE38AF61D0E81B743C960B539C5D76C11F170A3D7CDC10DBE85D55`
- 相对正式输入快照仅 3 个净改动块。

新增正式证据：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\DocumentCitationFix-20261027-192523\README.md`

冻结输入未改：

- 冻结测试：`6C438973FD59868A9FB5CA596C842C4BF8314E5127A9807B654CFE7BEC0114B7`
- 旧文稿测试：`42FC98715F1E7524CB5EF56E4DA19297B4686671216FF72115649801F02881DA`
- primitives stub：`D36E82F62FCBDB7880A0359D26CB8C111A21B1D23F2A4469E06B76B4C87E0ED5`
- Vitest config：`62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF`
- `citation.ts`、`citation-deps.ts`、`source.tsx`、`session-case.tsx` 均与正式输入索引哈希一致。

原始根红证据直接复用：两项冻结 UI 用例在实际文稿正文加载成功后，均在冻结测试第 201、258 行因 citation button 为 null 失败；不是 import/fixture/unhandled failure。未重跑。

## 检查结果

- `git diff --no-index -- 00-documents.tsx documents.tsx`：退出码 1，符合“有差异”，输出只有 3 个预期净改动块。
- `git diff --check -- dsh-ext/ui/documents.tsx`：退出码 0，仅仓库既存 LF→CRLF 属性警告，无 whitespace error。
- 行尾静态计数：21,776 bytes、513 LF、0 CRLF、0 CR；与输入快照同为纯 LF。
- 文件结构静态检查：本地 case 守卫、`citationDepsFor(citationTaskId)`、`inlineMarks={citationMarks}` 均存在。
- 精确 pathspec 的只读 Git 状态检查成功，仅显示 `M dsh-ext/ui/documents.tsx` 与新证据 README；冻结测试正式输入与当前文件 SHA-256 前后一致。
- 未运行任何测试、类型检查、导入、parser、AST、构建、probe、HTTP、GUI、模型、Office 或安装命令。

## 非零退出与阻碍

1. `git status --short --branch` 退出 1：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。按令未修权限、未碰 index.lock、未拆 writer 锁、未扩权。
2. 一次只读哈希核对调用误把 shell 参数写成 `bash`；执行器启动前返回 `ACCESS_DENIED`，命令未执行、无文件写。随后全部恢复指定 native PowerShell、`login=false`。
3. `rg --files ui dsh-ext/tests | rg ...` 退出 1，因为当时 cwd 下无 `ui` 目录；随后改用正确 `dsh-ext\ui` 只读核对。
4. 一次较宽的 `rg` 搜索退出 1，原因为部分候选搜索目录不存在，但已返回所需 `inlineMarks` 命中；无写入。
5. `git diff --no-index` 按设计在存在差异时退出 1；不是测试失败。

## 命令日志

以下为全部 `exec_command` 调用；`apply_patch` 与目录创建不计为 shell 命令。命令均从 `D:\Lawbeach\lawbench-A` 启动，除明确注明外使用指定绝对 native PowerShell、`login=false`。

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T32-document-citation-fix-order-20261027-192523.md' -Raw` — 0
2. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T32DocumentCitationFixInput-20261027-192523\index.json' -Raw` — 0
3. `git status --short --branch` — 1（dsh 子模块权限）
4. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T32DocumentCitationFixInput-20261027-192523' -Recurse -File | Select-Object FullName,Length,LastWriteTime` — 0
5. `rg --files ui dsh-ext/tests | rg '(^ui[\\/](documents|citation-deps|answer|source|kit|state|sessioncase)|document-citation-navigation\.spec\.tsx$)'` — 1（无 `ui` 目录）
6. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\ui' -File | Select-Object Name,Length,LastWriteTime | Sort-Object Name` — 0
7. `Get-Content root-run.json -Raw; Get-Content root-red-results.json -Raw` — 0
8. `rg -n --context 2 '^diff --git a/(dsh-ext/)?ui/(documents\.tsx|citation\.ts|citation-deps\.ts|source\.tsx|session-case\.tsx)|^diff --git a/(dsh-ext/)?tests/(document-citation-navigation|documents)\.spec\.tsx' A-tracked-before.patch` — 0
9. `$paths = @(...7 target files...); Get-FileHash -Algorithm SHA256 -LiteralPath $paths | Select-Object Path,Hash` — 0
10. `Get-Content 00-documents.tsx -Raw; Get-Content 01-citation.ts -Raw; Get-Content 02-citation-deps.ts -Raw` — 0
11. `Get-Content 03-source.tsx -Raw; Get-Content 04-session-case.tsx -Raw; Get-Content answer.tsx -Raw; Get-Content kit.tsx -Raw` — 0
12. `Get-Content dsh-ext\ui\state.ts -Raw` — 0
13. `Get-Content 05-document-citation-navigation.spec.tsx -Raw` — 0
14. `Get-Content 06-documents.spec.tsx -Raw` — 0
15. `rg -n --glob '*.ts' --glob '*.tsx' --glob '*.d.ts' 'inlineMarks|citationInlineMarks|MarkdownText' dsh-ext dsh/packages dsh/node_modules/@deepseek-ai/dsh-client-ui-primitives 2>$null` — 1（部分候选路径不存在，仍有有效命中）
16. `rg -n '^(diff --git|--- |\+\+\+ |@@ )|^\s*(function|export function|const|interface|type) ' A-tracked-before.patch | Select-Object -First 500` — 0
17. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\tests' -File | Where-Object { $_.Name -match 'citation|markdown|documents' } | Select-Object Name,Length,LastWriteTime | Sort-Object Name` — 0
18. `git diff --no-ext-diff -- dsh-ext/ui/documents.tsx; git diff --check -- dsh-ext/ui/documents.tsx` — 0
19. `$paths = @(...12 target/test files...); Get-FileHash -Algorithm SHA256 -LiteralPath $paths | Format-List Path,Hash` — 0
20. `$p='...documents.tsx'; $lines=Get-Content -LiteralPath $p; ... 输出 imports/上下文/预览行` — 0
21. `rg -n 'citationInlineMarks|citationDepsFor|liveCitationTarget|citationTarget|citationMarks|inlineMarks=' dsh-ext/ui/documents.tsx` — 0
22. `git diff --no-index -- 00-documents.tsx documents.tsx` — 1（预期文件差异）
23. `$before=...; $after=...; 统计 bytes/CRLF/LF/CR` — 0
24. `Get-FileHash ... | Format-Table Path,Hash -AutoSize`，误设 `shell=bash` — 1（启动前 `ACCESS_DENIED`，未执行）
25. `$paths = @(...12 target/test files...); Get-FileHash ... | Format-Table Path,Hash -AutoSize` — 0
26. `git diff --no-index -- 00-documents.tsx documents.tsx` — 1（预期文件差异）
27. `$p='...documents.tsx'; ... 输出 imports/上下文/预览行` — 0
28. `$p='...documents.tsx'; ... 统计 bytes/CRLF/LF/CR` — 0
29. `git diff --check -- dsh-ext/ui/documents.tsx` — 0
30. `$targets=@(...5 files...); Get-FileHash ...` — 0
31. `$p=...README; $q=...handback; Test-Path ...` — 0
32. `$c=Get-Content documents.tsx -Raw; 检查 4 个修复标记` — 0
33. `New-Item -ItemType Directory -Force -Path '...DocumentCitationFix-20261027-192523' | Select-Object FullName` — 0
34. `$paths=@(documents.tsx, evidence README, handback); Get-Item ...; Get-FileHash ...` — 0
35. `Get-Content README -Raw; Get-Content handback -Raw` — 0
36. `git status --short -- dsh-ext/ui/documents.tsx docs/plan/evidence/T32/DocumentCitationFix-20261027-192523/README.md` — 0
37. `$a=冻结输入; $b=当前冻结测试; 比较两者 SHA-256` — 0（二者一致）

## 根代理后续

需独立审计最终 diff，运行冻结 2 项和必要 affected documents/citation/types 检查；通过后决定新源码 pin/private build。当前不能把作者静态检查或旧 compiled GUI 当成绿色验收。

STOP
