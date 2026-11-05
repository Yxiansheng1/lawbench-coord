# HANDBACK-A-T14TaskAnswerNullImportFinalizer-20261101-004129

状态：AUTHORED_NOT_RUN

执行对象：`D:\Lawbeach\lawbench-A\dsh-ext\tests\task-answer-null-20261101-003736.spec.ts`

## 变更

仅对上述唯一新测试执行批准的两处字面替换：

1. 删除 `import { afterEach, describe, expect, it } from 'vitest'` 及其后换行。
2. 将 `from '../host/task-answer'` 改为 `from '../host/task-answer.ts'`。

未编辑产品代码、其他既有文件、契约、配置或测试断言。

## 文件事实

改前：

- 大小：7698 bytes
- SHA-256：`3a1ec64b2ac6e2b235a0e1e16f67f8463e379e249b19e0baf2bcb01499fe458c`

改后：

- 大小：7644 bytes
- SHA-256：`78dccf9ec63f8306a638cf7fc933344372c21a315f4e18f7cd263c8cc2fd4be0`

两处旧字面量改前均恰好匹配 1 次。改后第一处剩余 0 次，第二处剩余 0 次；新路径字面量恰好出现 1 次。改后大小和 SHA-256 均与 `approved.json` 的预期值一致。以原位点插入旧 import、再逆向恢复旧路径后，逆变换文件的大小和 SHA-256 均精确回到批准前基线，说明除批准替换外无不一致字节。

## 原始文本计数

- `it(`：7
- `expect(`：8
- `afterEach(`：1
- `beforeEach(`：0
- `mkdtempSync(`：1
- `rmSync(`：1

以上仅为原生 PowerShell 文本计数，不构成测试结果。

## 未运行

未运行 Git 读写命令；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。未运行 Node、Python、TypeScript parser、AST、check、prepare、build、Vitest、tsc、collect、应用、HTTP、模型、GUI、凭据、环境或全局策略操作。未安装依赖、未修改沙箱或 ACL、未拆分 writer 锁。

## 保全与遗留

原目标的新增未提交状态按其批准前字节基线原样保全；本交回件是协调目录中唯一新增文件，属要求的正式交回文件。无产品侧偏离。测试运行状态为 AUTHORED_NOT_RUN，不作任何通过声明。
