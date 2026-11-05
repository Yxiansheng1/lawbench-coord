# B 线交回：T31 GUI scope policy 契约修正版（source-only）

执行令：`D:\Lawbeach\lawbench-coord\B-T31-scope-policy-contract-order-20261031-045658.md`
交回时间：2026-10-31
执行者：独立 B 线（deepseek-v4.1-flash-1017/max/cwdB）

## 1. 结论

已在新目录交付三份文件，源模块按执行令做了**恰好五处**契约修正，其余函数与守卫
逐行保留。**未运行任何代码**：无 Python / AST / 解析 / import / 检查 / 测试 /
 构建 / prepare / 应用 / GUI / HTTP / 模型 / Key / SSH / 子代理调用。

## 2. 交付物（全部为新文件，未改旧源码）

目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopePolicyContract-20261031-045658\`

| 文件 | 字节 | SHA-256 |
|---|---|---|
| `scope-policy.py` | 24402 | `4bb9918cf8f61e6292e1a9200ebfba42b1cdc9b9c51502b962502d79966af1fb` |
| `README.md` | 7775 | `4e7bb8b73217b6a6630335445d7b150a2cba657b3f4918687f775ea3d57a1bb8` |
| `literal-inputs.json` | 4208 | `c3f3b587b207be81786f31d7463aa623aa784f033a641c55b4b64407eb3b5d87` |

本交回文件：`D:\Lawbeach\lawbench-coord\B-handback-T31-scope-policy-contract-20261031-045658.md`

被替换的旧候选（只读，未删未改）：
`D:\Lawbeach\lawbench-coord\T31GuiScopePolicyContractInput-20261031-045658\scope-policy.py`
字节 23904，SHA-256 `58638e9552a22ce60c79cd7c4291b1333eeb4cf17c36d01a4d9b66d420f489b2`
（与 `approved.json` 的 `before_module_sha256` 一致，已现场复核）。

## 3. 五处修正（与执行令逐条对应）

1. **工厂 source root 与 run root 分离。** 归一化后的自有 TXT source_root 在工厂
   函数体内、嵌套类定义之前捕获进独立闭包变量 `source_root_key`；构造函数
   `root` 关键字是 run root，不再遮蔽 TXT source root；`self._root_key` 取捕获值，
   import 面据此比对真实 source 目录。case / cwd / root / auth 匹配未改。
2. **`/core/context` 不再当 scope 证据。** 生产 context 只返回 `value.l0` /
   `value.l1`，根本没有 `request_scope`。`_complete_context` 现在只记录实际
   200/`ok` 与计数，并在有值时校验 l0/l1 直接对象形状；不再搜索
   `request_scope`，不再置 `task_scope_verified`。scope 由原生 begin 响应加
   Root 侧持久化 TaskStore 另行证明。begin 处的 selectedIDs / SHA / case /
   request 断言一条未减。
3. **先校验再赋权。** `_complete_begin` 先要求实际 200/`ok`，再要求直接
   `value.case_id` 与 `value.request_id` 等于绑定 scope，然后要求直接
   `task_id` 为非空且 ≤128 字符，最后要求直接 `value.request_scope` 精确匹配
   （kind=materials、case/request 一致、恰好两个互异已知 material_id 且 SHA-256
   相符）；全部通过后才赋 `_task`、才计成功。scope 错/缺、跨 case、
   request 不符一律保持 `_task is None`，并记录具体违规码
   `TASK_BEGIN_CASE_OR_REQUEST` / `TASK_BEGIN_TASK_ID` /
   `TASK_BEGIN_SCOPE_RESPONSE`。重放必须同 task。
4. **去掉递归搜索与别名。** `_find_scope` 整段删除；嵌套 `value.task.task_id`
   回退与 materials 映射别名一并删除。真实契约只有直接 `value.task_id` /
   `value.request_scope`，`request_scope.materials` 是恰好两个 dict 的列表
   （`material_id` + `sha256`）。先验类型再哈希/成员判定，重复即拒，原有
   tuple 顺序保留（原始快照保持调用方顺序）。无通用结构搜索，无自造回退。
5. **evidence 不再宣称它无从知道的事实。** `evidence()` 去掉硬编码
   `source_only: true` 与 `runtime_allowed: false`（这两项属 README 与字面交接），
   任何地方都没有捏造 runtime PASS。

其余内容逐字节保留：scope 精确响应校验、currentUUID 校验、ContextVar 每请求
并发隔离、import 引用与配额、begin/progress/end 配额、继承的只读与鉴权面、
`native_failures` / `violations` 证据结构等。

**旧候选的静态否决发生在任何运行时之前，属夹具协议期望错误，不是产品失败。**
README 已按此口径改写，并订正继承基座捕获上限为 **256 KiB**（原 README 误写
512 KiB）。

## 4. README 与字面输入要点

- README 记录五处修正、旧候选静态否决理由、context 单独不计 scope 证据、
  256 KiB 基座捕获、未运行边界与 Root 后续必跑项。
- `literal-inputs.json` 中 `approved_core` 与 `approved.json` 完全一致；随后追加
  `before_module_sha256`、`context_pin` 及 `_metadata`（更正清单、旧候选状态）。
  **自哈希故意省略**（本窗口未跑哈希命令），不做伪造。

## 5. 验证边界（未运行，非 PASS）

- 本次窗口 shell 调用共 **4 次，全部退出码 0**：① 读执行令；② 读
  `approved.json` + `primary.txt` + 输入目录清单；③ 读旧候选三件套 + 目标目录
  状态；④ 收尾元数据（新文件字节数与 SHA-256、旧模块哈希复核、逐行
  before→after 差异对照，差异仅落在五处修正上）。
- 源修改全部用文本补丁落盘，共 5 次 apply_patch（本文件为第 5 次）。
- **旧候选的正式记录保持原样**：4 次 exec、3 次成功、1 次因非法管道表达式导致
  PowerShell `ParserError` 非零退出；该次失败未写文件，也未重试；source_only
  未被触碰。
- 本次窗口：未跑 Python、AST、解析、import、契约自检、单元/集成、HTTP、模型、
  GUI、产品命令；模块从未被导入或执行。
- Git 严格只读：本窗口未执行任何 Git 命令，未 add/commit/rebase/stash/reset/
  clean/checkout/push，未暂存。交回是写协调目录文件，不是 Git 提交。若后续出现
  `index.lock` 或权限拒绝，那是运行器授权边界，不是本次交付的阻碍，未作任何
  修复尝试。

## 6. 仍需 Root 在完整源码复核后执行（本次全部 NOT_RUN）

语法检查、import 期 I/O 检查、两类请求配额并发测试、变更 tuple/冲突测试、
原生失败清理测试，以及端到端原生运行：证明三个绑定材料中选两个、真实
request/session ID、TaskStore 持久化、原生响应未被改写。

## 7. 未知 / 留给 Root 裁决

- 生产 `request_scope.materials` 的元素字段名，本窗口只见到 primary.txt 给出的
  begin 契约说明（`material_id` + `sha256`），未读生产源码核对其精确形状；
  若实际字段名不同，需 Root 按源码裁决后调整 `_scope_matches`。
- `request_scope.session_id` 缺失时按"等于绑定 session"处理（宽松），严格版可由
  Root 决定是否改为强制存在。
- 未做任何 Git 提交，符合本执行令的只读 Git 边界；如需进入分支提交，请由主编排
  指示。
