# A 线交回：T18 合同审查必问闸门返修

状态：`IMPLEMENTATION_AND_TESTS_READY / RUNTIME_NOT_RUN / PACKAGING_HOLD`

完整证据与命令账：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractQuestionGate-20261028-174016\返修说明-20261028-175542.md`

## 已完成

- 修复 `host/skills.ts`：`## 必问问题` 为空或纯空白时解析失败；只有显式 `无` 才得到合法的零问题列表。
- 修复 `agent/index.ts`：合同审查未答齐时，非存稿工具在工具预算、重复熔断、收尾和兜底拒绝上返回“仍缺必问问题”，不再说“已保存草稿”；非合同行为保持原样。
- 修复旧测试夹具：补齐必填 `owner`，消除两个 `TS7006`，并证明重复/畸形问题是因正确原因失败。
- 增加合法 explicit-none 正向、空/纯空白 Host + Agent 负向、18 个 Skill 全解析及另外 17 个不受影响的断言。
- 新增真实 DSH 接线测试：现有编译 Cordis、ToolRuntime、UserQuestionService、ask tool 和生产 apply hooks，完整遍历 pre-execute → body → post-execute → 最终 tools/result。
- 集成覆盖有效答案放行实际写入；post-policy block；post-execute 后、最终结果前 caller abort；最终输出 schema/materialization 失败；无 provider；invalid args；实际工具预算；实际 preStep 预算；新任务/新会话迟到答案隔离。
- 集成测试的 CoreClient 为进程内内存替身，不监听端口、不发起 HTTP、不调用模型或读取凭据。

## 最终静态身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `dsh-ext/agent/index.ts` | 44666 | `4f652150927692c5230bd7ec5d517fdec2f45e35839fefd017d3e6d0aa3c922c` |
| `dsh-ext/host/skills.ts` | 3801 | `9981fa72543238a5d7d16b9790905cb98a08dc140adab67a4fe485da5239a472` |
| `dsh-ext/tests/contract-question-gate.spec.ts` | 22358 | `248d87161122529cf295985d6d56b53cdcc6722ad9e55d7f432f3a2eaa1d5ed8` |
| `dsh-ext/tests/contract-question-gate-runtime.spec.ts` | 15307 | `474839258f5e4dc3436482824ae9574acceb46471a26e7a1e3ae1c25a35da85c` |

只读 Git HEAD：`a23271abee333a9a256fd46a3141da16975c2380`。

## 验证状态

- 已完成：只读状态/差异检查、目标文件哈希、尾部空白与危险模式静态扫描、Skill owner/问题段静态核对。
- `git diff --check`：通过。
- `owner`：18 个 Skill 均有；`case-wiki-build`、`legal-workflow` 为显式 `无`。
- `task-state.ts`、`host/index.ts`、`shared/turn-notices.ts`、`ui/dock.tsx` 哈希与开工 pin 一致。
- **NOT RUN**：Node、Python、Vitest、tsc、parser、AST、import、prepare、serve、probe、HTTP、模型、GUI、SSH、build、selftest、全量测试、私有编译。
- 新/旧测试源码均未执行，不能宣称 PASS；root 仍需执行两个定向测试、类型检查和后续门。

## Git 与阻碍

- 未执行 add/commit/rebase/stash/reset/clean/checkout/push；无提交 SHA。
- `git status --short` 因 `dsh` 子模块工作树路径权限拒绝退出 `1`；未改锁、ACL、审批或沙箱，随后用 `--ignore-submodules=all` 读取超项目状态。
- dirty 开工快照保留在
  `D:\Lawbeach\lawbench-coord\T18QuestionGateRepairInput-20261028-175542\A-dirty-before.txt`；
  未清理既有改动。
- 少量误投 Bash 的读取命令在启动前被 MXC/权限层拒绝，没有 Bash 进程或文件写；有效命令均为绝对原生 PowerShell、`login=false`。

## 写入面

产品只写 `dsh-ext/agent/index.ts`、`dsh-ext/host/skills.ts`；测试只改旧合同问题闸门 spec 并新增 focused runtime spec；另写本交回件和证据说明。

未改契约/schema、Skill 内容、TaskState、Host index、turn notices、UI、SDK、DSH 源码/编译件、consumer、B346、`005889a8`、B entry/manifest、private 194112、18 legacy、E50、DLL/PDF guard 或安装包。

## 遗留

- root 执行定向 tests/typecheck 后再判绿。
- root 后续需做新的私有编译绑定及 `lawbenchCore.skillQuestions` consumer 接线；本轮按令不动 consumer/build。
- Gate1、全量 T18、全项目、真人/法律质量门未完成；打包继续 HOLD。
