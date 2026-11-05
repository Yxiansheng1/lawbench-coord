# B 交回：T18 修改稿输入保真复核

## 判定

**NO PRODUCT DEFECT CONFIRMED.**

两份已选前序成果都已完整进入 seq 120 的 L1 快照；输入 2 没有丢。实际模型随后只调用 `case_read_input(index=1)`，0 次读取 index 2，并直接保存草稿。律师在 seq 121 明确要求两份都用 `case_read_input` 实际读取，因此本次是 **模型 instruction-following FAIL**，不是 transport/adapter/consumer metadata bug。

**T18 仍 FAIL。** 另有一个独立的 factual quality FAIL：合同条款没有精确从“第七条”改为“4.1”，只改成上位“合同第四条”。`citation_check.passed=true` 不能覆盖该质量失败。

## 已完成

- 只读核对现行 A 线 agent、TaskState、Host/CoreClient、context、task、read_input、save_draft、PRD/Spec/业务编排、契约和固定 consumer。
- 复用既有 actual run `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocReviseClauseRuntime-20261029-024101\run-DDLgyK`，没有重跑模型或全量测试。
- 确认 TaskState / save_draft / task_end 当前没有任何“已选 input 全部或部分经工具读取”的机械完成条件；`reads.json` 只记材料。
- 确认通用契约允许 L1 内联输入直接使用；consumer 要求两份实际读取，权威来自本轮明确用户指令，不得弱化。
- 确认新 doc-revise 层级规则已实际投递（skill result SHA-256 `208975cef032159751ecefc11be46b7817c0e0e250b71b209afe90b4f16f423e`），模型收到后仍未执行双读。
- 实际草稿仍为 9170 bytes / `cd8f3cf84f8af1be413e0764798f076c2c91ba91f0f1f026e8b344b1e5c924bb`；`合同第七条` 0 次，`合同第四条` 1 次，4.1 仅在原引用/推荐措辞处；严格 precision 未达成。

## 变更

- 产品源码：无。
- tests/fixtures/Skill/consumer/runtime/params/pins：无。
- Git：无 add/commit/rebase/stash/reset/clean/checkout/push；无暂存。
- 新文件仅两份：
  1. `D:\Lawbeach\lawbench-coord\B-T18-doc-revise-input-fidelity-findings-20261029-025144.md`
  2. 本 handback

## 证据主路径

- 实际选择：`run-DDLgyK\case\工作区\任务\T-20261029024515-5073\task.json:10-27`
- 双输入 L1 投递：native session `session.v4.jsonl:122`，event seq 120
- 明示双读指令：`continue-genuine-doc-revise.mts:80-81`；native session 第 123 行，event seq 121
- 唯一 input 工具调用：native session 第 136 行，event seq 134，参数 `{"index":1}`
- 无 index 2：阶段 2 event seq 116-150 内计数 0
- 保存：native session 第 146 行，event seq 144
- actual run 汇总：`run-DDLgyK\report.json`
- 完整论证、源码行号、pins、CONFIRMED/INFERRED/UNRESOLVED：见 findings 文件

## 边界与阻碍

- 产品/模型/测试/HTTP/GUI/SSH runtime 新启动：0。
- B 线 dirty 已保全；只读 `git status` 遇到 submodule `dsh` 目录权限拒绝，未尝试修复或扩权。该 Git 可视性阻碍不影响本次源码/证据结论。
- 过程中有 7 次误指定 bash 的只读调用，均在目标命令执行前被 access denied/MXC 拒绝，无读取或写入副作用；细节已逐条记入 findings 执行审计。
- 未改沙箱、审批、ACL、writer lock，也没有拆锁。

## 建议下一步

1. 保留本运行作为 explicit-read instruction-following FAIL，并保留独立的 7→4.1 precision FAIL；不要把服务、输入投递或 citation gate 单项通过写成 T18 PASS。
2. 不再重发同源 Skill prompt variant，不做同源模型重试，不换 API/provider。
3. 要完成原 T18 goal，需要能遵守显式过程指令的模型/执行资源，或由 owner 明示改变验收策略。
4. 当前不实施代码修复；Package 继续 HOLD。只有 owner 决定把“必须读取”升级为产品硬门禁时，才应先走契约流程，再在 TaskState / tools result / save precheck 的现有 seam 上做最小实现与边界测试。

停止于只读审计和正式交回。
