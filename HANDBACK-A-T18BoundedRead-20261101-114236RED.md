# HANDBACK — A 线 T18 有界读取 RED

状态：`AUTHORED_NOT_RUN / runtime ZERO`

执行边界：本阶段只新增一个 standalone Vitest 回归源文件；未修改产品源码、契约、SDK、Skill、配置或其他测试。Git 严格只读，未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`。既有 dirty 未清理、未暂存、未覆盖。

## 交付物

- 新测试源：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts`
- 字节数：`12413`
- SHA-256：`C1EAD7F6687FED97C2405C913C38164FBA98724EA8CE5AADC366CE5EB969ABFD`
- 正式交回：`D:\Lawbeach\lawbench-coord\HANDBACK-A-T18BoundedRead-20261101-114236RED.md`

## 测试源结构

新文件是独立 Vitest 套件，没有导入既有测试文件。它复用 supplied original16 test 的骨架：真实 `LegalAgent.preStep` / `preTool` / `executeTool` 路径、原 MemoryCore 的 `/core` 交互形状、真实必问题捕获与最终结果观察、真实成功 `case_search` 解锁读取、`LawbenchRemote` 从仓库 Skill 读取机器必问题。

未 stub LegalAgent 的守卫或执行路径，未伪造 NativeSession、请求 R、历史或模型输出。搜索与读取结果均来自现有合法 example 结果的深拷贝；定位单元使用匹配的合成覆盖值。

## 新增用例

共 15 个执行用例：

1. 无效 `end` 共 8 组：缺失、`null`、字符串、小数、布尔、零、倒序、跨多单元；每组同时覆盖 `preTool` 和直接 `executeTool`。
2. 无效边界用例在成功检索、必问回答完成后运行，并把工具预算设在读取边界；断言拒绝先于预算和 Core，拒绝不增加工具计数、不置 `budgetHit`、不向 Core 转发读取。
3. 合法同单元 `start=1,end=1`：断言放行、Core 精确收到原参数、结果回指 `start=1,end=1`。
4. 另一合法定位单元 `start=12,end=12`：断言放行、精确转发、返回匹配的合成结果。
5. 必问题优先级：未回答时，带缺失 `end` 的读取仍未两个入口拒绝为必问门，且不落入检索门或 Core。
6. 检索失败隔离共 2 组：Core 报错与结果契约无效；两种失败后读取仍先因未完成有效检索被拒绝。
7. 非辩护兼容共 2 组：`contract-review` 与普通对话仍允许 legacy `start`-only 读取，并精确转发原参数。

所有用例均为真实 `expect` 断言，无 `skip`、`todo` 或 `pending`。

## 运行与证据

- Vitest：`NOT RUN`
- Node / parser / collector / `tsc`：`NOT RUN`
- 产品测试、构建、检查、prepare/setup、serve：`NOT RUN`
- HTTP、模型、GUI：`ZERO`
- 测试运行时：`ZERO`
- 证据：本交回件中的目标文件字节数与 SHA-256；无测试输出可报。

预期状态为 RED：当前产品只校验防守读取的 `start`，尚无同单元 `end` 边界守卫，因此无效 `end` 用例预计不能按未来收紧行为通过。这是本阶段要求捕获的计划性 RED，不表示现行产品违反现行契约，也不表示现有测试、契约或 SDK 已失败。

## 精确依赖

- 运行时相对依赖：`../agent/index.ts`、`../agent/task-state.ts`、`../host/index.ts`、`../host/supervisor.ts`、`../shared/core-client.ts`。
- 测试数据依赖：`contracts/examples/tool_search.result.json`、`contracts/examples/tool_read.result.json`。
- 必问题依赖：仓库 `skills` 目录由现有 `LawbenchRemote` 读取。
- 环境：项目现有 Vitest / TypeScript 测试工具链；本阶段未调用。

## 清理假设

- 每个用例新建 MemoryCore、LegalAgent 和 TaskState；任务状态不跨用例共享。
- 仅使用虚构案件、虚构检索词、虚构必问回答与合成材料文本。
- 未生成测试临时文件、截图、日志、缓存或外部状态，无需新增清理。
- `tmpdir()` 仅按原测试骨架传入现有 `LawbenchRemote` 构造器；本阶段未运行，故无运行期残留。
