# HANDBACK-A T18 Bounded Read Control Fixture

- Lane: A (独立执行者, deepseek-v4.1-flash)
- 执行令: `D:\Lawbeach\lawbench-coord\ORCH-A-T18BoundedReadControlFixture-20261101-114922.md`
- 状态: AUTHORED_NOT_RUN / runtime ZERO

## 1. 唯一有界修改

文件: `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts`

改动点: 文件最后一个 `it.each` 块（`keeps legacy start-only reads for %s`）中的 `started(skill)` 调用，
改为 `started(skill, { readReply: readReplyFor(args.name, 1, 1) })`。

- 调用点数量: 1（共 2 个 legacy control 用例：contract-review、plain conversation，二者共用该调用点）
- 未改动: 产品源码、其余旧测试、任何断言、任何 `readReplyFor` / `READ_RESULT` / helper 定义
- 未改动: 契约文件、skills、engines、任何 source guard

改动理由: `contracts/examples/tool_read.result.json` 的原始 `start` 不是 1，而新增用例
错误地假定 mock `READ_RESULT` 的 `start` 为 1，导致 legacy control 走真实样例报文时被
读界校验判否（FIXTUREERR）。注入 `readReplyFor(args.name, 1, 1)` 后 mock 返回的
`start`/`end` 均为 1，与用例断言的 `start: 1` 自洽。

## 2. 原始 RED 保留与定谳

- 原始首跑 RED 结果保留，未被本次修改覆盖或重跑：**15 = 8 个预期内 new bound-denial FAIL
  + 2 个 FIXTUREERR（legacy controls）+ 5 个 PASS**
- 定谳：那 2 个 legacy control 失败属于**测试夹具（fixture）错误**，不是产品缺陷。
  本次修改只修正夹具输入，不触碰被测产品代码，因此原始 raw RED 记录仍然有效、继续作为证据保留。
- 本次运行**未执行**任何测试运行时（runtime ZERO）：按执行令禁区，未运行 Node / Python /
  parser / Vitest / tsc / pytest / check / build / prepare / app / HTTP / model / GUI / selftest。

## 3. 本次运行实际做了什么

1. 读取正式执行令（只读）。
2. 完整读取目标 spec 文件（只读）。
3. 用 `apply_patch` 做上述唯一一处调用点修改（写入产品仓库工作树，未做任何 Git 写操作）。
4. 在同一文件内做一次 `Select-String` 调用点核对（只读，未跨目录发现/列举）。
5. 一次原生 PowerShell 取目标文件 SHA256 + 字节大小。
6. 写本交回文件到协调目录（协调目录写文件，不是 Git 提交）。

Git 纪律: 全程只读，未执行 `git add / commit / rebase / stash / reset / clean / checkout / push`，
未暂存、未提交。工作树中既有 dirty 状态保持原样，未触碰无关改动。

## 4. 最终目标文件指纹

```
PATH   = D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts
SHA256 = 08E6E13FB7A8ECD264761882957E2549895A3E1FE08CD3B2705AB839933D3B59
SIZE   = 12459 bytes
```

（取指纹方式: 原生 PowerShell `Get-FileHash -Algorithm SHA256` + `Get-Item`，单次调用。）

## 5. 阻碍与偏离

- 无阻碍。
- 偏离说明: 执行令的禁区清单包含"discovery / list / metadata elsewhere"，故除目标 spec 文件本身外，
  未做跨目录探查；未复核原始 raw RED 报告文件的落盘位置与内容，其原始结论直接采信执行令所述事实
  并在本文第 2 节如实转述。
- 未执行测试验证（runtime ZERO 为执行令指定状态），故本次**不**声称"修改后已转绿"；
  下一步验证由主编排或其授权方在有测试运行授权的会话中执行。

## 6. 建议下一步

在允许运行 Vitest 的会话中复跑 `dsh-ext/tests/defense-read-bound-20261101-114236.spec.ts`，
预期 15/15 通过（8 个 bound-denial FAIL 转为 PASS、2 个 legacy control 由夹具修正后 PASS、
5 个原有 PASS 保持）。修改后需把新的 green 结果回填至 `docs\plan\evidence\T18\`（由有 Git
写权限的一方执行提交与工单回填）。

--- 
交回件人: lane A 执行者（deepseek-v4.1-flash）
交回时间: 2026-11-01
