# B 交回：T31 后端边界修复

- 交回时间：2026-10-26T02:50:55+08:00
- 执行令：`D:\Lawbeach\lawbench-coord\T31BackendBoundaryFixOrder-20261026-024437.md`
- 分支：`line-B`
- 分支 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`（未变）
- 提交：无。按本令 Git 严格只读，未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 结论：完成两处有界修复及同目标测试源码调整；作者阶段未运行测试、解析器、构建、pipeline、模型、服务或网络。不能宣称新红已被动态转绿，也不宣称整个 T31 完成。

## 1. 范围缺口修复

`service\lawbench\case\request_scope.py:46` 新增 `RequestScopeStore.task_scope()`。它在持久 R 锁内读取权威记录，并按 `task_id` 反查认领记录，要求请求编号、案件、会话、任务编号均一致，记录状态只能是 `claiming` 或 `claimed`。返回的 scope 由持久记录重新构造，不采用任务副本作为权限来源。

`service\lawbench\case\task.py:112` 的 `index_for_task()` 先调用上述核验，再读取材料索引。已有 R 的任务若副本缺 `request_scope`、置 null，甚至同时缺 `request_id` 和 `request_scope`，只要 `task_id` 仍对应认领记录，就抛 `INTERNAL` 且 reason 非空。真正未 prepare 的原生 R 在持久记录中材料为空，仍返回合法 null；没有 R 记录的旧任务仍走全案。范围版本、材料状态和 sha256 随后继续按原逻辑失败关闭。

## 2. wiki 摘要来源修复

`service\lawbench\tools\inputs.py:34` 新增材料摘要来源核验。scoped 请求只有在下列事实同时成立时才返回摘要正文：

1. 案件卡片属于当前案件，`generated_by`、`generated_at` 非空；
2. 卡片 `materials_at_generation` 中恰有一条当前 M-ID，且 sha256 等于本次固定范围版本；
3. `generated_by` 指向本案 `pipeline` 任务，步骤为 `wiki_build`，任务为 `finished`，结果为 `completed`；
4. 该结果恰登记任务内的 `草稿/案件卡片-v1.md`，草稿通过案件卡片契约；
5. 草稿与主卡片的 `v/case_id/generated_by/generated_at/materials_at_generation` 完全一致。

该证明边界来自真实写入顺序：`wiki_build` 先重写全部完整摘要，随后写案件卡片，并把同一卡片 payload 落到任务草稿；流水线完成后才记 `completed`。因此完成态 `wiki_build` 能证明固定材料版本进入了完整摘要生成批次。文件名、文件 mtime 和当前原件哈希相符均不作为证明；scoped 摘要的 `updated_at` 也只取卡片 `generated_at`。

`wiki_update` 可能沿用未经当次重写的完整页，现有元数据没有单页摘要版本清单，无法证明某一页是当次更新还是旧页沿用，所以 scoped 读取该分支继续安全拒绝。没有可信来源时返回明确“没有可核验……未返回正文”，不返回摘要 marker；旧无 R 用户的读取行为保持不变。

## 3. 实际文件与 SHA-256

| 文件 | SHA-256 |
|---|---|
| `service\lawbench\case\request_scope.py` | `4b158901d7b478e645cb57d4c53e5eb6b7ea947bf9581dce4be05058fa3356e8` |
| `service\lawbench\case\task.py` | `9b7409e3274aa45232229703499cafe2edb2bcbefeb575ce856b5d3983a53027` |
| `service\lawbench\tools\inputs.py` | `d96ac05b19bc6e9b292679a6eddbf8d545d9400084765d47b6487cda681d57ca` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py` | `3391dc6e17a86fb938a02fe263a5b0e6d88ae97f659e9854975e20aef4302fb5` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py` | `1898c4d4208919b274f8e0cbc0f04bf6c874aa571f155e7b3dcab790a777a21c` |

测试源码只做了本令允许的调整：原 5 例文件仅把“手写 `INSIDE_WIKI` 后 scoped 仍可读”改为安全拒绝且不含 marker，并补旧无 R 仍可读守卫；其它断言未动。边界脚本保留原两条红，并新增同一测试内的故障子例：同时删除 `request_id` 与 `request_scope`、保留原 `task_id` 时也必须拒绝。

## 4. 复用证据与静态检查

- 原 5 例 root 日志：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-root-tests\stderr.txt`
- SHA-256：`0d2fc94379f95a5dae4d41775470798ec718fd4bbcbc2c66a74b03c3a8807d23`
- 既有结果：`Ran 5 tests in 1.567s`、`OK`。只复用，未重跑。
- 两条真实红日志：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-boundaries-red\stderr.txt`
- SHA-256：`51db717a937baf193e095492a62976a2ca84e9e474e1b3938982a44be0adef9b`
- 既有结果：缺/坏 scope 均漏出 3 份材料；无来源材料摘要返回唯一 marker；共 `Ran 2 tests`、`FAILED (failures=2)`。
- 与开工保全副本逐文件比较，差异只落在上述目标；`git diff --check` 无空白错误，未跟踪文件尾部空白扫描为空。

## 5. 未验证与遗留

- 作者没有运行新增边界脚本、原 5 例、任何测试、unittest、pytest、collect、parser、Vitest、tsc、build、prepare、serve、probe、HTTP、GUI、pipeline、模型或 socket 路径。
- 新红转绿、原 5 例回归、旧无 R 兼容和新增双字段丢失子例都只有静态判读，须由 root 全审后用真实运行定谳。
- 可信 `wiki_build` 正向返回分支没有动态样例；本令禁止启动 pipeline 和手写伪成功记录。
- `wiki_update` 的摘要来源仍未动态覆盖，当前按安全原则拒绝。若后续要安全放行，需要契约允许的单页生成来源/材料版本清单；本令未改契约。

## 6. Dirty、Git 与过程阻碍

- 开工保全：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-before-boundary-fix-20261026-024437` 已存在；其关键文件哈希与前交回记录一致，未清理或覆盖旧 dirty。
- 定向 status：`M service/lawbench/case/task.py`、`M service/lawbench/tools/inputs.py`，另有 `request_scope.py` 和两份 T31 回归源码为 untracked，均原样保留在 line-B 工作树。
- 完整 `git status --short --untracked-files=all` 仍因无法进入 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 报 `Permission denied`，随后 submodule `dsh` porcelain 失败。按令未修权限、锁、审批或沙箱。
- 一次 `rg` 工具调用的 shell 字段误设为 `bash`，运行器以 `Bash/E_ACCESSDENIED` 拒绝，命令未执行；随后改用执行令指定的绝对路径 `pwsh.exe` 和 `login=false`。未使用 bash 包装或绕过。
- 当前 PID 是本次唯一执行者，未拆 writer 锁，未改 ACL、审批、沙箱或网络。

## 7. 交回边界

本交回只表示有界源码修复完成并停在作者阶段。root 应接手全审、重跑两条真实红和真正受影响的原 5 例，再判断 T31 是否继续走向合流。
