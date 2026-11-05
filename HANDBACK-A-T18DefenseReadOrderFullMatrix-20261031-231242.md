# 交回：A 线 T18 防御意见先问后读 —— 归档/刑期旧矩阵修正

- 交回人：A 线执行者（DeepSeek，PID 240s 窗口）
- 任务令：`D:\Lawbeach\lawbench-coord\ORCH-A-T18DefenseReadOrderFullMatrix-20261031-231242.md`
- 状态：**AUTHORED_NOT_RUN**（本次未运行任何测试、未构建、未调用模型/网络）
- Git 写入：本次运行器未授权 Git 写入；未执行 add/commit/rebase/stash/reset/clean/checkout/push，未暂存任何内容。工作区保留原有 dirty 状态，未改动 index.lock、审批或 ACL。

## 一、结论

按令只改两处测试表达式，把防御意见（`DEFENSE_OPINION_SKILL`）并入已有的「先问后读」DENY + 缺失必问 ID 理由分支，期望行为因此收紧（防御意见在必问未答时读材料应当 DENY，而不是原先错误期望的 ALLOW）。无豁免、无 skip、无放宽断言。

## 二、实际改动（仅两文件两处，各一处）

1. `D:\Lawbeach\lawbench-A\dsh-ext\tests\archive-workflow-gate-20261030-003021.spec.ts`
   - 旧：`if (skill === LITIGATION_DOCS_SKILL || skill === GENERAL_DRAFTING_SKILL) {`
   - 新：`if (skill === LITIGATION_DOCS_SKILL || skill === GENERAL_DRAFTING_SKILL || skill === DEFENSE_OPINION_SKILL) {`

2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\sentence-workflow-gate-20261029-215838.spec.ts`
   - 旧：`if (skill === LITIGATION_DOCS_SKILL || skill === GENERAL_DRAFTING_SKILL) {`
   - 新：`if (skill === LITIGATION_DOCS_SKILL || skill === GENERAL_DRAFTING_SKILL || skill === DEFENSE_OPINION_SKILL) {`

两个文件的 `DEFENSE_OPINION_SKILL` 符号在改动前已从 `../agent/index.ts` 导入，无需新增导入。

## 三、未改动项（按令守住的边界）

- 产品源码、其他测试、Skill、SDK、guard：未改动。
- 两个文件的标题、`describe`/`it` 名称、精确理由常量（`questionsBeforeReadDenial(['required'])`）、断言、完整测试流程、setup/teardown：未改动，除上表两行表达式外其余字节保持原样。
- 契约文件、`contracts\`、`skills\`、`engines\`、`docs\src\`：未改动。
- 本次未运行全量回归、未运行本两文件、未做自测；沿用令中转述的既有原始证据状态，未重演旧开工/安装/调研/全量测试。

## 四、沿用的既有事实（原始证据，未重演）

- 全量 1367 用例：1345 PASS / 4 FAIL / 18 pending / types 0。
- 其余 2 个 FAIL 为旧 archive / sentence 跨 Skill 矩阵错误期望防御意见先问后读为 ALLOW，本次正是修正对象。
- 另有 2 个 FAIL 属原有环境问题（env），不在本次范围。
- 产品 Agent 侧已有一个经批准的谓词 `a9a26fd6/sourceheld`（源保持不动）。

## 五、验证状态与遗留

- 本次改动**未执行**任何测试，状态为 AUTHORED_NOT_RUN；「两文件由 FAIL 转 PASS」这一结论尚无本次运行证据，需由有测试权限的一方按既定验证流程补跑后确认。
- 遗留 1：全量回归未在本次重跑，18 pending 与 2 个原有 env FAIL 状态以既有原始证据为准。
- 遗留 2：本次仅修测试期望，未动产品源码；若产品侧谓词 `a9a26fd6` 的实际行为与「防御意见先问后读 DENY」不一致，需主编排另行裁决产品改动，本次不越界。

## 六、证据路径

- 改动文件：`dsh-ext\tests\archive-workflow-gate-20261030-003021.spec.ts`、`dsh-ext\tests\sentence-workflow-gate-20261029-215838.spec.ts`
- 本次未产生新的测试输出或截图（未运行测试）；不新建 `docs\plan\evidence\T<n>\` 证据目录。
- 交回件即本文件（写入协调目录，非 Git 提交）。

