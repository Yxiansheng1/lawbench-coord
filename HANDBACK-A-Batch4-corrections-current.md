# A 线 Batch4 有限修正交回（current）

日期：2026-11-03

执行入口：`D:\Lawbeach\lawbench-coord\ORCH-A-Batch4-FiniteCorrections-20261103-093335.md`

工作树：`D:\Lawbeach\lawbench-A`

## 结论

已按执行令完成 2 个白名单文件的有限修正。只改下列两处，未新增产品代码或测试，未改 UI/产品源码，
未执行 Git 写操作（add/commit/rebase/stash/reset/clean/checkout/push 全部未做），未暂存，
未执行测试、解析器、构建、运行时、HTTP、GUI、凭据或系统查询。

进场 dirty 原样保留，未清理、未还原、未重排。

## 精确改动

1. `dsh-ext/tests/owner-remote-p05-20261102.spec.ts`
   - `connected` 用例的两条期望字符串对齐当前组件真实文案：
     - `不表示两台都可用` → `不表示两台律所服务器都可用`
     - `不表示身份认证已经通过` → `也不表示身份认证已经通过`
   - 依据：`dsh-ext/ui/remote-access.tsx` 第 171–172 行当前文案为
     “……不表示两台律所服务器都可用，也不表示身份认证已经通过。”
   - 检查条数、断言强度、`connected` 状态断言、`工作台隧道已连接` 断言均未删减；
     产品 UI/源码未改。

2. `contracts/_build/gen_schemas.py`
   - 仅在 `remote_access_value` 的 `reason` 枚举中，于 `NO_REMOTE_ADDRESS` 之后追加
     `EXTERNAL_NOT_TUNNEL`。
   - 未运行生成器、未重生成任何 schema、未改 `CONTRACT_VERSION`、未动其他枚举或生成逻辑。

## 验证状态

按执行令特别禁区，本轮未运行任何测试、解析器、构建或运行时验证，仅做只读源码比对与修改后静态复核。

只读核对结论：

- `dsh-ext/ui/remote-access.tsx` 当前 `connected` 分支文案确为
  「工作台隧道已连接，不表示两台律所服务器都可用，也不表示身份认证已经通过。」
  → 新期望字符串与当前源码逐字一致。
- `contracts/api/remote_access.schema.json` 当前已含 `EXTERNAL_NOT_TUNNEL`
  （`$defs/response` 与 `$defs/value` 两处），与本次生成器追加一致；
  即重新生成不会覆盖掉该枚举。
- 该 schema 同时含 `RUNTIME_MISSING`，而生成器枚举里没有它——即执行令所说的
  「Existing RuntimeMissing generator mismatch predates batch」。本次按令未修这一历史差异。

修改后文件 SHA256：

- `dsh-ext/tests/owner-remote-p05-20261102.spec.ts`
  `BEFFC5FC183D0ED3C6B0EF887C56A755E431BF42C02C2397988F835D4D9FA1DF`
- `contracts/_build/gen_schemas.py`
  `3D5B1E43EDFCE00EBFFF3AA2E7D13C661A5A0EF778935EF3303B26E7B90FE345`

两文件行尾均为纯 LF（CRLF=0），编辑未改变行尾风格。

## 阻碍与需主编排处理

1. 根级 `git status --porcelain` 被只读权限拒绝：
   `cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。
   这是 submodule 目录只读导致，与本任务无关。按令未修复权限、未改锁、未扩权、未改审批，也未尝试任何 Git 写入。
   对本次两个文件的只读 diff/状态查询可用（`git diff -- contracts/_build/gen_schemas.py` 正常输出）。
2. `dsh-ext/tests/owner-remote-p05-20261102.spec.ts` 在 Git 中仍是未跟踪文件（`??`），
   与进场状态一致，未 add、未改状态。
3. 未执行验证：请主编排在允许的时机重跑该 spec 与相关契约检查（本令禁止本运行器执行）。
4. `RUNTIME_MISSING` 生成器/产物不一致为历史遗留，未在本令范围内处理，需主编排决定是否另派。

## 交回方式

本文件即为交回件（写入协调目录，非 Git 提交）。本运行器到此停止。
