# T18 sentence-calc 原生样本 01 作者交付

## 状态

`AUTHORED_NOT_RUN`。本目录是 B 线作者侧交付，只包含一份新的 sentence-calc native
consumer、其有限 B HTTP service、冻结输入 manifest 和本说明。consumer、service、
Node、Python、TypeScript、模型、HTTP、GUI、产品和全量测试均未由作者执行。

本交付是样本 01 的下一次原始真实资源入口，不沿用旧 pre-issue 实际失败，也不构成
业务、法律、Gate 1 或完整 T18 通过。主编排应先完成源码、命令、manifest 与写入面复核，
再决定是否执行一次全新的实际运行。

## 冻结来源

- 原始八行只读身份来自
  `D:\Lawbeach\lawbench-coord\T18SentenceNativeInput-20261029-211228\approved-inputs.json`：
  current `sentence-calc` Skill、公开任务说明、五份实际 TXT，以及仅供主编排人工判读的
  `要点.md` 元数据。consumer 和 service 只验证后者的字节与 SHA，不把备注或测试说明交给模型。
- 26 个依赖中只有 Skill 行改为 current `sentence-calc`，其余依赖逐字节保持批准身份。
  四个 current private 编译文件和三个运行时均来自主编排 blueprint 的原值。
- `literalfixed-inputs.json` 由
  `root-approved-manifest-blueprint.json` 逐字段复制，只填 consumer 和 B service 的新
  大小与 SHA-256。

## 有界场景

- 私有 `criminal` 案件在 `CaseRegistry` 打开前只复制五份批准 TXT：刑事判决书、拘留证、
  羁押情况证明、起诉意见书、逮捕证；保留精确 bytes、SHA-256 和 `mtime_ns`。
- 生产 text scanner 使用真实 line 单元解析这五份副本。`CaseRegistry` 保留三个严格为空
  的犯罪模板目录；任何额外材料、文件或模板目录内对象都拒绝。
- 任务无前序成果，`task.inputs` 为空且没有 request scope。参数固定为低思考、64K、
  16384 max tokens、32 次模型调用、48 次工具调用、45 分钟和 1200000 ms 请求超时。
- 模型必须先实际调用 `case_list_materials`，再以
  `case_read_material(name=刑事判决书, more_names=其余四份)` 一次读完全部五份短原文，
  不传 `max_chars`；读取后才允许一次联合确认 `purpose`、`penalty`、`custody`。
- 三项回答只能由授权答案文件在合法联合问句之后返回；不得预置到 prompt、context、
  history、task 或 ask 参数。无关或未知问题 ID 走生产拒绝，不合成答案。
- 回答后只允许真实 `case_calc_sentence` 一次。计算参数与返回原样记录；首份草稿必须紧随
  成功计算保存为“刑期计算表”，后续如有修改仍使用同一标题。consumer 不写入任何预期
  日期、参数答案或金标事实。

## 机器边界

consumer 仅核对结构、真实工具调用与返回、实际读取时序、Task 覆盖、当前材料版本引用、
草稿标题和返回标量的可见性：

- 唯一成功的材料读取必须是计算前的一次五文件分组全读；计算前必须已经有实际三问回答。
- `case_calc_sentence` 必须成功调用一次，且 calc 调用晚于回答、首次保存晚于 calc 成功。
- 草稿标题必须为“刑期计算表”；返回的 start、end、offset_days、custody_days、milestones、
basis 和 notes 标量都要出现在真实草稿文本中。
- 草稿中的 citation 必须回到当前五材料版本的真实 `/api/source`；A-E 类问题为零，
  F/hint 保留 severity 和正文供主编排人工处理。
- 原八行和案件五文件在运行前后保持 bytes、SHA-256 和所需 `mtime_ns`；JSONL 关闭后
  重新打开必须与 live Native Session 事件完全相等；资源关闭、fetch guard、stdin 和密钥
  清理沿用已通过基线。

## 留主编排人工判读

- 联合问句是否把用途、刑种刑期、各段羁押和止日及出处清楚地展示给律师确认。
- 逮捕证中的识别不清日期是否保留原字符，并在起诉意见书等清楚原件中找到可核对来源；
  不得自行补全。
- 计算参数是否由实际工具读取材料与授权确认共同支撑；判决书起止有没有与程序结果对照，
  不一致或数罪并罚、缓刑、减刑等情况是否如实列为需律师判断。
- 草稿中的日期、折抵、羁押天数、起止和里程碑是否来自实际工具返回而非模型心算；
  法律依据是否保留待律师核实。
- 可见答复中的自检是否真实；业务和法律质量均不由本目录自动宣称通过。

## 执行纪律偏差

- 只读 `git status --short --branch` 因共享 worktree 元数据指向的 `dsh` 子模块返回
  `Permission denied` 而中止。按令没有尝试修锁、扩权或执行 Git 写操作。
- 三次误把 `shell` 写成 `bash` 的只读调用均由 MXC 在执行前拒绝为 `E_ACCESSDENIED`；
  没有执行命令或产生文件变更。
- 一次只读 `Get-Content` 误用了不匹配执行令的 PowerShell 完整路径；该调用成功但只读了
  源码片段，未执行 Node、Python、测试、模型或产品命令。其余有效作者命令均使用执行令
  指定的完整原生 PowerShell、`login=false`。
- 没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push；没有修改产品源码、
  Skill、contracts、tests、权限、审批、ACL 或 writer lock。
