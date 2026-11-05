# 会话标识纠正已落盘待审计

本轮按执行令纠正一个错误约束。会话标识是传给 DSH 的不透明字符串，不能按请求 UUID
解析。三份准备证据已恢复正确边界，未改动产品源码、契约、运行环境或既有历史文件。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已恢复入口脚本；探针只改用原生形状正例并撤掉畸形负例；说明文件已补契约事实。正式交回件已落盘。 |
| 目标是什么 | 交付物回到主编排已复核的原始三文件语义，保留单个非空 `session_id`。本轮目标停在主编排独立审计入口。 |
| 在等什么 | 等主编排对三份证据与本交回件给出审计信号。通过后，由主编排继续累计源码、初始化和清理审计；有异议则按正式件返工。 |
| 卡在哪 | 未卡住。测试、运行和 Git 写入均由执行令禁止，因此没有产生新的运行证据或提交。 |

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\T31-opaque-session-correction-order-20261026-051710.md`。
- 源码事实：A 线 `dsh/packages/api/session-controller/src/commands.ts:109,266` 的原生会话 ID 为 `session-${randomUUID()}`；`contracts/common.schema.json:32-36` 将 `session_id` 定义为传给 DSH 的不透明字符串，只要求 `minLength: 1`，不得解析。UUID 正则属于请求 ID `REQUEST_ID`，不属于会话标识。以上事实以执行令所载的主编排源码核对结果为准。
- 原始不可变快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31BatchGuiEntry-20261026-044214\before-session-guard-fix-20261026-051016\`。
- 快照哈希：`server.py` 为 `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`；`probe.mjs` 为 `35386a57004f919e50c3f438ec61e63f78cd2a6b9d5aea8980e9ebafa5a225cb`；`README.md` 为 `c04b2a1628d68011e9b8d9cc242a6c03edf12d642cecafdf3c1f33e936b522f3`。
- `server.py`：纠正前为 `4492a09d8ddc5db067f93f731fd4ea0ecf20e17aedb0c62b7df9f7dfb25d7984`，仅撤掉错误加入的 `REQUEST_ID.fullmatch(session_id)` 条件；最终为 `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`，与原始快照逐字节一致。
- `probe.mjs`：纠正前为 `e0a850c450fbe68957d44bf85ac9cb4d71cde3a85b4e0da418d3e1e1dd830c83`。已从原始快照恢复，并只把第 8 行常量从裸 UUID 改为 `session-11111111-1111-4111-8111-111111111111`；最终为 `dd9a58dbb66e9e83b2e0d0b06d79ea0a2208fc02e140f812ef73e7f4db7aeb0f`。相对原始快照的唯一差异就是该常量。
- `README.md`：纠正前为 `681f732b78e5cd246020f8ab30acd65446ff3655dddacb262da676f949940d37`。已恢复原始路由与说明，更新探针哈希，并写明不透明会话契约及本次错误指令的更正；最终为 `6d3f2c3a61525893e51c0147fab14ab644307388dbb8f1c193a3f5421f147c7b`。
- README 相对原始快照的差异只有两项：探针哈希从原值更新为最终值；新增“会话 ID 契约更正”一节。原有导入、认证、查询、负例、计数和审计说明均保留。
- 静态核验使用只读文件哈希和只读差异比较。纠正确认后，工作区内 `server.py`、`probe.mjs`、`README.md` 仍显示为未跟踪文件；没有清理或改写其他 dirty 内容。
- 验证复用依据：入口脚本已精确恢复并通过主编排复核的原始基线；探针保留原有当前选择正例，只把该正例改成真实原生形状。既往当前选择正例的 200 结果作为原始证据复用，本轮没有重跑。

## 未做与降级

- 未运行 `--prepare`、`--serve`、`probe.mjs`、GUI、HTTP、构建、Vitest、`tsc`、`pytest`、collect、解析器、自测、安装、模型或 API。
- 未访问真实案卷、`.env.local`、Keyring、凭据、全局设置或网络。
- 未改动产品源码、`contracts` 原生代码、权限、审批、ACL、沙箱或锁。
- 未执行 Git 暂存、提交、rebase、stash、reset、clean、checkout、push 或合并。
- 未做打包、安装器、发布、部署或 Actions，发布状态保持 HOLD。
- 未修改旧报告、历史记录或其他非指定文件。

## 下一步建议

主编排先核验本交回件所列三份最终哈希和两项只读差异，再决定是否进入累计源码、初始化和清理审计。本运行器不需人工补充动作，收到审计结果后即停止。

删减轮:读者 2 / 槽位 1 / 半句 2 / 重复 2 / 过程 1 / 黑名单 2

Response ID: 未提供
Response log path: chat reply
