# HANDBACK-A-T14TaskAnswerNullFIX-20261101-004619

状态：AUTHORED_NOT_RUN

## 源码改动

- 文件：`D:\Lawbeach\lawbench-A\dsh-ext\host\task-answer.ts`
- 改动：在既有 `JSON.parse` 的 `try/catch` 之后、后续 `result`/`task` 解引用之前，新增一处：
  `if (result === null || task === null) return fail('TASK_NOT_FOUND', NO_TASK)`
- 改动前：4914 字节；SHA-256 `154625adb8a24e0e9c0f4e46287fc4525195fb6c261f30cc3b689000c9f8def6`
- 改动后：4994 字节；SHA-256 `f88d5397c3c1b0398b1db48065e1441bae292dc0fc2fada09eee203e7fcc227f`
- 字节差：+80
- 未增加 helper、框架、结构校验、NLP 或 schema 校验；未改动路径读取、符号链接/reparse、大小/截断、Agent、TaskState、Host RPC、UI、Skill、prompt、SDK 或 config 行为。

## 既有原始证据引用

以下均为本次改动前的批准记录与原始证据引用，不是本次执行者运行结果：

- 测试：`D:\Lawbeach\lawbench-A\dsh-ext\tests\task-answer-null-20261101-003736.spec.ts`
- 测试大小：7644 字节
- 测试 SHA-256：`78dccf9ec63f8306a638cf7fc933344372c21a315f4e18f7cd263c8cc2fd4be0`
- 旧 RED：exit 1，5 passed，2 failed，0 pending
- 两项失败均为 `JSON null` 结果文件/任务文件应返回 `TASK_NOT_FOUND` 且不抛异常
- 测试文件与本次新测试均未由本次执行者修改

## 验证边界

- 本次只执行了源码全文只读、批准记录全文只读、单点补丁，以及补丁后目标源码大小/SHA-256 元数据读取。
- 未运行 Node、Python、解析器、AST、Vitest、tsc、collect、check、prepare、build、serve、app、HTTP、模型、GUI、凭据、env 或安全策略操作。
- 未执行任何 Git 写操作，也未暂存或提交。
- 本交回件不主张运行时通过；等待主编排执行后续全量逆向复核与同一 7 项测试、类型检查。

## 偏离与遗留

- 偏离：无。
- 遗留：按执行令，本次执行者不运行测试或类型检查，因此新源码的运行时 GREEN 尚待主编排验证。
