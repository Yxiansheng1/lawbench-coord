# A 线 T18 contract-draft 原生链路交回

## 任务与状态

- 执行令：`A-T18-contract-draft-native-order-20261029-042331.md`
- 作者态：`AUTHORED_NOT_RUN`；未执行模型、HTTP、测试、构建、解析/类型检查、Key 或生产操作。
- 产物只供主编排做一次新的真实原生验收；不是业务通过、Gate 1 通过或打包放行。

## 作者包

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\native-contract-draft.mts`
  106165 bytes，
  `69b6865b676e764adde099767a4eed8c17115e9ccb8cf50fa7708000e9adf0a3`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\b-service-contract-draft.py`
  45166 bytes，
  `eeae98dd0cd8905b7e8d3272127686ab404033dc5c580b136732e877acd31221`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\literalfixed-inputs.json`
  10709 bytes，
  `bd99e4b52a98ddb033643b61a379bc2abeb23ebde9a8f8eff3a21b16fd78bfd2`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\README.md`

## 已做的静态核对

- 只取实际 B 的任务说明、`contract-draft/SKILL.md`、`报价单.md` 和
  `询价往来邮件.txt`；`要点.md`、任务说明和 Skill 均不进入案件。
- 问题 ID 固定为 `our_party/doc_scope/deal_terms`，来源标志核对为
  false/false/true；回答只响应模型实际请求的已知 ID。
- 两端参数为 49152 tokens；32 模型 / 48 工具 / 45 分钟 / 1200000 ms 保持。
- 单份和批量 `case_read_material` 的真实返回形状分别校验；无返回形状 fallback。
- 双材料全文覆盖、所有实际引用 A-E=0 且经 `/api/source` 回读、保存参数与落盘、
  task、path、version 和实际结果一致，均保留为运行期硬检查。
- 当前编译 agent/host/package/manifest 的 `9dd068…/ca849d…/3d6bca…/cc33c0…`
  路径与摘要按冻结私有构建清单复用；Host 必问门未扩到 `contract-draft`。

## 未执行

按本令特别禁区，作者运行次数为 0。主编排仍需在允许条件内做语法/类型检查、一次新
原生运行、双材料实际读取、引用回读、JSONL 关闭重开、finally 清理和 OS 身份收口，
再单独人工核对合同事实、未决付款/质保选择和文本质量。

## 已知边界

- 普通 `git status` 被 `dsh` 子模块 worktree 权限和超长证据路径拒绝；未改 ACL、锁、
  审批或沙箱。
- 八次只读检索/查看调用误设了禁止的 bash 启动参数，均在命令启动前被拒绝；无命令
  执行、无文件改动。其余操作均使用指定的原生 PowerShell。
- 批准 JSON 的 `要点.md` 行保留但原文件不存在；按执行令排除，不复制、不作为输入。
- Git 全程只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push，
  因而没有本卡提交 SHA。既有 dirty 未清理或改动。

正式作者说明见作者包内 `README.md`。到此停止。
