# 交回件：A 线 — T14/T17 错误恢复盲测（RED 阶段）task-answer JSON null

- 交回时间：2026-11-01
- 任务号：T-20261101004000-a001
- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-T14TaskAnswerNullRED-20261101-003736.md`
- 交回线：A 线（独立 A 线执行者，DeepSeek）
- 状态：**AUTHORED_NOT_RUN**（按执行令禁跑边界，测试已写好但本机未运行）

## 交付物

| 项 | 路径 | SHA256 | 字节数 |
|---|---|---|---|
| 新增测试模块（唯一新增源码文件） | `D:\Lawbeach\lawbench-A\dsh-ext\tests\task-answer-null-20261101-003736.spec.ts` | `3a1ec64b2ac6e2b235a0e1e16f67f8463e379e249b19e0baf2bcb01499fe458c` | 7698 |
| 证据说明 | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14TaskAnswerNullRED-20261101-003736\README.md` | `ff4d035fe527275399df63d743d4f5d1f88f4346cbe0d596939a658a0c0b8c69` | 4559 |

被测源码 `D:\Lawbeach\lawbench-A\dsh-ext\host\task-answer.ts` **未改动**，
SHA256 仍为 `154625adb8a24e0e9c0f4e46287fc4525195fb6c261f30cc3b689000c9f8def6`（4914 字节，与 `approved.json` 一致）。

（以上 SHA256 与字节数由本次执行的原生 PowerShell `Get-FileHash` / `Get-Item` 直接读出，非断言式循环。）

## 做了什么

1. 按执行令只读了三个文件：执行令本身、`T14TaskAnswerNullRED-20261101-003736Input\approved.json`、`dsh-ext\host\task-answer.ts`（全文）。无其他路径扫描、无 Git 操作。
2. 只读源码定位成因：`readTaskAnswer` 把 `result.json` / `task.json` 的 `JSON.parse` 放在 `try` 内，
   但 `result.drafts`、`task.session_id`、`task.budget` 的解引用在 **catch 之外**。
   `null` 是合法 JSON → 解析不抛错 → 走到解引用时抛 `TypeError`，而不是返回函数里已有的 `TASK_NOT_FOUND`。
3. 新写一个测试模块，**正好 7 条**用例，导入原始公开接口 `../host/task-answer` 的 `readTaskAnswer`：
   - ① `result.json` 为 `null` → TASK_NOT_FOUND 且不抛异常
   - ② `task.json` 为 `null` → TASK_NOT_FOUND 且不抛异常
   - ③ 合法记录对 → `status/session_id/used/limit/草稿` 原样保留
   - ④ 缺可选 `task.json` → 草稿保留，`session_id`/`limit` 为 `null`
   - ⑤ `result.json` 语法非法 → TASK_NOT_FOUND
   - ⑥ `task.json` 语法非法 → TASK_NOT_FOUND
   - ⑦ 草稿路径不在本任务 `草稿/` 下一层（别的任务的草稿、本任务下的散稿）→ `draft: null`，其余正常
4. 测试打真实文件系统：每个用例 `mkdtempSync` 独占临时案件根，自写 `工作区/任务/<taskId>/` 下的
   `result.json`、`task.json`、`草稿/`；无 mock（不 mock 函数/加载器/schema），无符号链接或联接，无能力探测。
   清理只删本文件 `mkdtemp` 建的目录，删前做归属检查（必须在 `os.tmpdir()` 之下 + 目录名以 `lawbench-t14-null-` 开头）。
   只用 `os.tmpdir()` 标准 API，未读环境变量、`.env`、Key、口令、凭据。
5. 写证据 README（`docs\plan\evidence\T14\T14TaskAnswerNullRED-20261101-003736\README.md`），如实标注 AUTHORED_NOT_RUN。

## 没有做什么（执行令禁区，逐条自述）

- 未改动任何既有产品代码、测试、配置、守卫、包配置、schema、SDK。只新增上述测试文件、证据 README、本交回件。
- 未执行任何 Node / Python / Vitest / tsc / 解析器 / AST / 采集 / 检查 / 构建 / 准备 / 启动 / HTTP / 模型 / GUI / 运行时。
- 未安装依赖、未跑全量测试、未重演开工/安装/调研。
- 未做任何 Git 写入：`add / commit / rebase / stash / reset / clean / checkout / push` 全部没有执行，也不暂存。
  （执行令明确 Git 只读；本次连只读 Git 命令也没跑。）
- 未联系其他聊天、未更换 API、未改沙箱/审批/ACL、未拆 writer 锁、未触碰既有 dirty 目录与旧证据、sealed 与 served roots。
- 未写任何 Key、口令、网络密钥、真实案卷内容。

## 证据与计数（原始计数，未运行）

- 新增测试模块：1 个文件，**7 条**用例（`it(...)` 计数 7），断言均为对原始公开 API 返回值的直接判定。
- 运行输出 / 截图 / 通过失败数：**无**。本轮按令不跑，故不存在"通过 N / 失败 N"的原始计数。
- 红灯预期（写用例时的预期，**未经本机运行确认**）：用例 ①② 应失败（抛 `TypeError`，被断言捕获成失败），
  用例 ③–⑦ 应通过（环境与语义基线正常，红灯只集中在 JSON null 这一类输入）。

## 留给主编排的下一步

1. 独立复核本测试模块全部代码与临时目录清理逻辑。
2. 在受控环境跑一次"旧源码 RED"取证（当前源码下的失败输出）。
3. 确认红灯定位正确后再进入产品修复：修复方向是让 `result` / `task` 为 `null` 时走已有的 `TASK_NOT_FOUND` 分支
   （把解引用纳入解析/校验保护范围），不放松既有路径与草稿目录校验。

## 偏离之处

- 无偏离。仅一处执行令未逐字规定、由我自行判断的实现细节：用例 ⑦ 额外放了一个"本任务目录下但不在 `草稿/` 子目录"的散稿，
  以同时覆盖"别的任务的草稿目录"与"本任务内但层级不对"两种越界形态，两者都应落到 `draft: null`。

