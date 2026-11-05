# A 线交回：sentence-calc 工作流顺序闸门

状态：`SOURCE_AND_FOCUSED_TEST_AUTHORED__NOT_RUN_BY_AUTHOR`

基线：`a23271abee333a9a256fd46a3141da16975c2380`  
本运行没有 Git 写入，因此没有新提交 SHA。

## 已交文件

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
  - 49572 bytes
  - SHA-256 `140584362C259B6F2909F32F6C8489F47E447CEB2106DB1475B76E3971C909AB`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`
  - 22115 bytes
  - SHA-256 `866A15366BA37B44F1C611C5B4BA48B51CF995F89B4931AAAF38E5BC1CB8CD99`
- `D:\Lawbeach\lawbench-A\dsh-ext\tests\sentence-workflow-gate-20261029-215838.spec.ts`
  - 19784 bytes
  - SHA-256 `90A9682FD9C7344C984027624884E0C26DDCD28B87B1DF2E3F3FD41E1668635E`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowGate-20261029-215838\README.md`

改动前两份源码与保全 pin 完全一致：

- `index.ts`：48102 bytes，`BA30EFF62C89E2969CAFFA37FEB6EEDF5EA4AF6DDEBE5DB426D4DCB3F238E014`
- `task-state.ts`：21427 bytes，`B111686981B2B14CCE2EEFDCC721C55C03D2BCC367D20DA343B34953E66D5D3B`

## 交付摘要

- `sentence-calc` 作为第九类进入既有 required-question machinery；其余八类、NONE 和默认 `TaskState` 保持原语义。
- sentence 任务读取首份材料前，必须有本任务成功且结果契约校验通过的 `case_list_materials`；`preTool` 和直接 `executeTool` 均在预算/Core 前拦截。
- `case_calc_sentence` 在三个真实必需 ID 全部由现有最终 `tools/result` machinery 收下前拒绝；草稿与修改清单继续走既有 answered-ID 写门。
- 新增窄 `sentenceWorkflow` 默认 false 状态和一个本任务清单成功标记；无新 store、路由、Map、版本、历史、budget、provider、MAX 或框架。
- 新聚焦测试覆盖失败/非法清单、成功清单后先读后问、三问最终成功、错误/取消/空答、错 task/session/case/callId/token、旧任务隔离、Host 不可用及既有八类/NONE 边界。

## 复用证据

- 原始失败运行：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceApiObservation-20261029-214710\run-gySbhT`
- 根侧闭合记录：`D:\Lawbeach\lawbench-coord\T18SentenceWorkflowGateInput-20261029-215838\T18-sentence-native-actual-root-closed-current.json`
- 人工复核：`D:\Lawbeach\lawbench-coord\T18SentenceWorkflowGateInput-20261029-215838\T18-sentence-actual-manual-business-review-current.json`

原实际运行 103.281 秒，11 次模型 POST 均 HTTP 200；实际工具为 `skill=1`、`case_read_material=1`、`case_calc_sentence=1`、`case_save_draft=7`，`case_list_materials=0`、`ask_user_question=0`。只据此确认程序化顺序缺口，不声称业务质量或人工遗漏已解决。

## 验证边界

按令，本执行者未运行 Node、Python、AST、解析器、导入、自检、测试、类型检查、构建、HTTP、模型、GUI 或实际产品流程。已完成只读源码走查、目标哈希/字节核对和覆盖点核对；请主编排运行本聚焦测试、受影响既有门和类型检查后再作源码准入。

## 阻碍与偏离

- `git status --short --branch` 因子模块 `.git` 路径权限被拒；按令未处理 index.lock、ACL、审批、沙箱或 writer 锁，未尝试 Git add/commit/rebase/stash/reset/clean/checkout/push。该只读检查阻碍不影响交回。
- 一次示例文件只读命令误用 `shell=bash`，返回 `E_ACCESSDENIED`，没有输出或写入；未启动 setup 或 legacy，也未改权限。其余操作均使用指定的完整原生 `pwsh.exe`、`login=false`。
- 实际证据来自 B 线 PRIMARY Skill `3F280837B8B424443A03FE55729293F8112E36B98A6F44DD48C7F66B5A017D43`；A 线 Skill 未改，仍为 `C96837B1957B7C7A4891086D1A4C11BA5AF16B14D32E55B206E8A21BB281F54E`。本次不声称两线 Skill 文本一致，也不声称 B Skill 已被修改。
- 不声称计算器、人工输出遗漏、未来实际 PASS、精确消费者准入或打包已解决。计算器与其他冻结文件均未改。

请主编排复核源码后执行范围内验证；本执行者到此停止。
