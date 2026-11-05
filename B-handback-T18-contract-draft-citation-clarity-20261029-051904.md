# B 线交回：T18 合同起草事实引用措辞澄清

时间：2026-10-29 05:19:04（任务标识）

交回状态：`SOURCE_DRAFT_READY / RUNTIME_NOT_RERUN / REVIEW_REQUIRED`

执行线：B

## 交付位置

- 源码：`D:\Lawbeach\lawbench-B\skills\contract-draft\SKILL.md`
- 证据：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationClarity-20261029-051904.md`
- 本交回：`D:\Lawbeach\lawbench-coord\B-handback-T18-contract-draft-citation-clarity-20261029-051904.md`

## 已完成

只在 `contract-draft` 的第 5 步逐条起草和第 7 步保存/重存做局部澄清：

- 来源交易事实写入合同正文时，保留实际材料名和实际位置的原位出处；“草稿只放交付正文”仅排除说明、清单和自检，不删除事实出处。
- 拟议风险分配和救济措施不得虚构出处；未约定或未达成一致的内容继续写【待补充/待确认】，描述双方已有方案时引用材料实际位置。
- 保存返回的 `citation_check.problems` 须按事实与拟议条款逐项核对；事实出处遗漏时补齐并同标题重存，合法复核提示在答复中说明。

修改前：

- 12,866 字节
- SHA256 `bfd44f5e3e970d95fe961df3d7298b67b9dc6f37cd5de7f825ea902c889b4012`

修改后：

- 13,469 字节
- SHA256 `92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912`
- +603 字节；3 行新增、1 行替换；99 个换行全为 CRLF

已对目标文件执行同一补丁的精确逆变换，实测恢复原 12,866 字节和原哈希，再重放正向补丁得到上述新哈希。由此前端 matter、共用规则块和其余字节均保持原样。

## 为什么不变更事实引用政策

主 Skill 原第 2 步已要求材料交易要素带出处，第 7 步已要求处理核对问题；共用规则也要求每条事实有出处。实际失误来自“起草类草稿只放交付正文”这句被模型扩大解释为正文事实也不需要出处。

本次仅消除这一局部歧义，没有把“必须引用事实”改成新政策，没有削弱 requirement，也没有加入黄金引用、文件名别名、NLP、新存储或硬门。主 Skill 与共用规则不存在实质政策冲突，故没有改动 `skills\_shared\共用规则.md`。

## 既有证据复用

复用原真实运行：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCurrentRuntime-20261029-050335\run-Xzv31a`

保留的事实：

- 原报告 `FAILED` 不变；7 次模型调用、7 次 HTTP 200；两份材料均完整读取。
- 实际询问及答案各 3 项，发生在首次成功保存前。
- 成功保存第 36 条、成功结果第 37 条、核对通知第 40 条、错误结论第 41 条。
- 保存正文 1,978 字节，SHA256 `f4d1127350e0fe4d3939ac325d761d0e01588f8afe00bdab9eac50119867b21b`。
- `citations=0`、`must_fix=0`、`hints=31`。
- 付款六十日对三十日、95% 对 97%、质保金 5% 对 3%、质保期六个月等未决选择均保留，本次未替律师取舍。

未重跑素材导入、安装、调研、全量测试、旧同源绿测或模型。

## 冻结与状态

- 未改 canonical 用户提示、答案、模型参数、预算、旧断言、消费者、source guard、材料、fixture 或运行目录。
- 未运行 Node、Python、解析器、AST、import、检查/测试/构建/prepare、HTTP、模型、GUI、SSH、密钥或 DPAPI 流程。
- 未改产品、测试、fixtures、当前 runtime、私有 25 项、SDK、guards、pins、source case、runs 或 old formal。
- 未运行 `build_skills.py`。
- 旧 `FAILED` 原样保留，历史不可改写。
- Gate 1 `INCOMPLETE`；T18 `INCOMPLETE`；Packaging `HOLD`；不声明项目 PASS。

## 主编排待办与放行门

1. 完整复核最终 Skill 源码、本交回以及本次全部命令/偏离记录。
2. 对字面新源码 SHA256 `92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912` 单独批准；本交回不构成动态哈希批准。
3. 另做精确 DeepSeek 消费者数据 pin，明确测试输入不得改变。
4. 在新源码批准和消费者 pin 完成前，不启动新模型运行，也不把旧结果沿用于新源码。
5. 继续按要求复用现有产品 `40ab51`、types `0`、private `25`、manifest `712` 的同字节事实；本次未重建或重跑这些旧核对。

## Git 与执行偏差

Git 全程只读，未 add、commit、rebase、stash、reset、clean、checkout 或 push。工作区原有大量 dirty 文件；本次只改上述主 Skill、新增证据和本交回文件。初次 `git status` 因子模块 `modules/dsh` 权限失败，未修权限或锁；其后用忽略子模块的只读状态命令核对。

需主编排显式判定的两处执行偏差：

- 曾用一次 `$env:TEMP` 路径查询和复制做临时前像；未读取环境配置、密钥或产品环境。跨命令临时目录不一致，副本未能用于核验，工作区无残留。
- 一条验证命令误标记为 bash，立即返回 `E_ACCESSDENIED`，命令体未执行、文件未变；另有三个 PowerShell 命令因引号/管道在解析阶段失败，文件未变。之后均用指定 PowerShell 重做。

因此本次不能宣称每个 shell 边界都完全严格。请主编排据实决定接受、重做或拒绝；本次未尝试扩权、改审批、改 ACL 或拆锁。
