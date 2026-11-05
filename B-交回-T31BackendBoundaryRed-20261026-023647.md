# B 交回：T31 服务端边界红回归

- 交回时间：2026-10-26T02:39:57+08:00
- 工单：`T31BackendBoundaryRedOrder-20261026-023647.md`
- 结论：按令新增两条独立边界反例源码，未改产品、契约、生成器、原 5 条测试或其它树；作者没有运行测试。当前源码静态判读预期红，由 root 全审后实跑定谳。

## 1. 新增对象

### 1.1 边界回归入口

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py`
- SHA-256：`56c4ad913eb1983bdce1d8740ae957f4f3f92418c4db6538fab5beae4ae8517f`
- 大小：6020 bytes
- 第 28 行：`ScopedTaskBoundaryTest` 继承原独立回归类，复用其 `setUp`、`prepare`、`task_context` 和窄拒桩。
- 第 155 行：`load_tests` 只装载两条新反例；直接运行本文件不会重跑原 5 条。
- 原模块经 `importlib` 加载，`__name__` 不是 `__main__`，不会触发其 `unittest.main`。

### 1.2 固定范围丢字段反例

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py:45`
- 测试名：`test_scoped_task_without_scope_cannot_fall_back_to_full_case`

真实操作链：

1. 继承的 `setUp` 在仓库根下创建临时目录，调用真实 `CaseRegistry.open`、`Materials.import_` 导入三份合成 TXT。
2. 调用真实 `TaskStore.request_scope({"action":"prepare",...})` 固定 1 份材料。
3. 调用真实 `TaskStore.begin(session, case_root, request_id)` 产生 scoped task，再从真实 `TaskStore.locate` 取得持久任务对象。
4. 先对未改任务调用真实 `TaskStore.index_for_task`，断言只返回该 1 份材料及其固定 sha256。
5. 仅在内存 `copy.deepcopy` 的任务对象上分别删除 `request_scope`、置 `request_scope = null`；保留原 `request_id`、`task_id`、`case_id`、`session_id`。不向 task/result/index/history 手工写坏数据。
6. 对两个内存副本分别调用真实 `TaskStore.index_for_task`。

预期断言：

- 两类坏副本都必须抛 `ApiError`，错误码为 `INTERNAL` 或 `INPUT_CHANGED`，且 reason 非空。
- 两类坏副本都不得返回全案 3 份材料。
- 同一测试保留互补守卫：原生 R 首次 begin 且没有 prepare 时，`request_scope` 合法为 null，`index_for_task` 返回全案 3 份；完全无 R 的旧任务也返回全案 3 份。
- 当前静态判读：`D:\Lawbeach\lawbench-B\service\lawbench\case\task.py:112` 的 `index_for_task` 用 `task.get("request_scope")`，`None` 分支直接返回全索引。因此两个坏副本当前都会被静默放大到 3 份，预期红；未实跑。

### 1.3 wiki 摘要版本证明反例

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py:100`
- 测试名：`test_scoped_wiki_summary_without_version_proof_is_not_returned`

真实操作链：

1. 调用真实 prepare/begin 固定 M1 的 sha256，并断言 task 内固定 hash 等于导入结果。
2. 在本次私有临时案件目录的 `工作区\wiki\材料\<M-ID>.md` 写入唯一合成 marker：`T31_STALE_WIKI_SUMMARY_WITHOUT_SOURCE_VERSION_6C1D7F9A`。
3. 该文件没有对应材料版本、来源任务或生成证明；没有写 task/result/index/history，也没有运行 pipeline、模型或伪造来源。
4. 对 scope 内的同一材料名调用真实 `lawbench.tools.inputs.read_wiki({"section":"材料摘要",...})`。

预期断言：

- 若拒绝，必须是带 reason 或 detail 的 `ApiError`。
- 若返回安全说明，完整 JSON 中不得出现上述 marker，并须含“无法核验 / 不可用 / 没有可核验 / 未返回 / 无来源 / 拒绝”之一的明确说明。
- 当前静态判读：`D:\Lawbeach\lawbench-B\service\lawbench\tools\inputs.py:52` 的 `read_wiki` 先按 scope 内 name 取得 M-ID，再在 `:81` 直接读取 `<M-ID>.md` 全文。因此当前会返回 marker，预期红；未实跑。

只读元数据说明：

- 现有真实生成路径在 `D:\Lawbeach\lawbench-B\service\lawbench\pipeline\steps\wiki.py:590` 写 `case.json` 的 `materials_at_generation`，契约在 `D:\Lawbeach\lawbench-B\contracts\files\case_card.schema.json:84`。
- `D:\Lawbeach\lawbench-B\service\lawbench\case\context.py:30` 的 `changed_since_card` 可比较该案件级快照，但本次没有可信的真实生成样例可供复用。
- 因本单禁止运行 pipeline/模型且禁止伪造历史或索引，本次没有手写 `case.json` 凑来源，也没有添加第二个“可信元数据”绿场景。

## 2. 复用与未改对象

- 原 5 条源码：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`
- 原 5 条源码 SHA-256：`762cacf1943cfda7caabcae3421de0bf0f937016e150542292a0c559e9035b6e`
- 原 5 条只通过继承复用 fixture/helpers；其源码、五个测试名和断言未改。
- root 既有原始日志：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-root-tests\stderr.txt`
- root 日志 SHA-256：`0d2fc94379f95a5dae4d41775470798ec718fd4bbcbc2c66a74b03c3a8807d23`
- 该原始日志显示原 5 条均 `ok`、`Ran 5 tests`、`OK`；本次未重跑。
- 相关产品/契约当前只读 SHA-256：
  - `service\lawbench\case\task.py`: `c5870cadd5e26fde48217393de8b4b1787f8f97cd05128d84211d1026078e684`
  - `service\lawbench\tools\inputs.py`: `865e5a576f974c56fffcd1fb7b6f9e26caaf4f142fc445056b369e46230dfe85`
  - `service\lawbench\case\request_scope.py`: `23610dff0588c3c5bdc73667ab44c21ddc2a2b213635220f43fb88909deecca4`
  - `contracts\files\request_scope_store.schema.json`: `e8b40898e8f4af1ac21a66bda79213ae37031b842d05c309e1c645c83cd2a477`
  - `contracts\files\task.schema.json`: `1d291f56a9efe903b3f695654c768c6378b986d0aa62b0ffd1c99611ace06bed`

## 3. 未运行声明

作者没有运行 unittest、pytest、collect、parser、tsc、Vitest、任何测试、selfcheck、build、prepare、serve、HTTP、GUI、pipeline、模型、OCR、Office、subprocess 或网络调用。没有创建 `create_app`，没有真实默认 lifespan。没有把静态预期红写成已复现红。

## 4. Git、dirty 与阻碍

- 本单 Git 严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout、push，未暂存任何文件。
- 未修改沙箱、审批、ACL、权限或 writer 锁；当前 PID 未被当成第二 writer。
- 完整 `git status --short --untracked-files=all` 仍在读取 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 时以 `Permission denied` 失败，随后报 submodule `dsh` porcelain 失败。按令未修权限、锁或审批。
- 使用 `git status --short --untracked-files=all --ignore-submodules=all` 做了只读旁证，显示既有大量 modified/untracked 和超长路径 warning；全部原样保留，未清理。
- 对本单目标做定向 status，结果为 `?? docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/scoped_task_boundaries.py`。协调交回件按令写在仓库外。
- Git 写入不在本运行器授权内；index.lock 或权限拒绝不是交付阻碍，本单交回不依赖提交 SHA。

## 5. root 下一步

全文审阅新增脚本后，直接运行该文件；`load_tests` 应只执行两条新反例。先以真实运行结果判定两处红，再决定最小产品修复。本单没有提前修产品，也没有扩大其它功能范围。
