# B 线交回：T18 主线 Cycle 2 修复

状态：AUTHORED_NOT_RUN  
runtime=ZERO  
执行角色：line B / deepseek-v4.1-flash-1017 / max  
工作目录：`D:\Lawbeach\lawbench-B`

## 交付

仅修改目标 Skill：

`D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md`

- 字节数：22727
- SHA-256：`5CE2CF89D09176FC689971F11C899E07E5BE31A9E28152D0FF7794B308779103`

## 改动章节

1. `处理步骤`第 4 步：把事实清单改为可拆分的来源与处理清单，要求同句中的身份、行为、物品、证明作用等独立分行；保留全部不利事实的实际草稿落点，未经依据的让步交律师确认。
2. `保存前核验`：重排为按固定顺序执行的六项文字审计，覆盖中性开头、争议标题与结论归属、来源层级与反证边界、数额分项、不利事实实际落点、法律引注和请求；明确摘要已读不等于附件已读。
3. `输出模板`：开头使用三个独立字面字段 `Defender identity: [to fill]`、`Retainer relationship and source: [to fill]`、`Work actually performed: [to fill]`；保留日期占位；争议标题和结论要求单方归属或中性待核实表述；不利事实不得自动写成“无异议”。
4. `最终交付核验`：改为答复首块唯一结果表，固定列为 `check / exact final draft quote+location / original quote+source or known limitation / disposition`；一张表覆盖全部自检项。失败行须实际语义改正并同标题保存，或明确标为未解决；只修引注不算完成。
5. `自检清单`：取消重复清单，统一指向上述唯一结果表；保留最后保存的 coverage、citation_check 和固定结束句规则。

## 边界与保全

- 未改动 frontmatter、owner/params、tools、必问问题、预算、处理步骤第 1-3 步、第 5-7 步及整个共用规则标记块。
- 未新增或修改其他源码文件，未生成合成案例，未调用模型、API、HTTP、GUI、解析器、测试、检查或构建。
- 未执行任何 Git 命令，包括只读 Git；未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未暂存、未提交，未联系其他聊天或代理，未更换 API，未更改沙箱、审批、ACL 或 writer 锁。
- 未启动后台进程；本次执行没有继承或创建 runtime。

## 实际命令与工具

1. 原生 PowerShell 只读正式执行令：

   `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`，`Get-Content -Raw` 读取 `D:\Lawbeach\lawbench-coord\ORCH-B-T18MainlineCycle2Repair-20261101-110751.md`。

2. 原生 PowerShell 只读目标 Skill，`login=false`，`Get-Content -Raw` 读取完整 `SKILL.md`。

3. 使用本地补丁工具修改上述非共享章节。

4. 原生 PowerShell 对目标文件执行唯一一次最终 SHA/字节数记录：

   `Get-Item -LiteralPath ... | Select-Object Length, @{Name='SHA256';Expression={(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}}`

5. 使用本地补丁工具写本交回件。

无命令偏差；全程使用原生 PowerShell，未使用 bash 包装。

## 限制

- 按要求没有运行任何模型或合成案例，故本件只证明静态源码已重写，不证明实际草稿执行已通过。
- 未运行静态检查、测试、构建或 prepare；目标 Skill 的实际行为、最终结果表是否被模型完整遵循，需由 root 的独立必要静态检查和新的 source binding/finite actual case 验证。
- 既有 dirty 未通过 Git 查询或改写；本件未主张工作树清洁，也未提供 Git 状态或 diff。
- root 应独立比对修改前后目标及完整 shared marker block；本交回不替代该字节级复核。
