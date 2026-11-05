# A progress: T31 UI race red

状态：回归测试、正式证据和交回件均已落盘。

- 已读完整正式执行令、根判读、两份现有材料测试及相关产品源码。
- 当前 `material-batch.ts`、`material-batch.tsx`、`state.ts`、`cases.ts`、两份旧材料测试和基础 Vitest 配置的字节数与 SHA-256，均与 root 快照 `source-before.json` 一致。
- 已复用既有 root 实际结果：`tests/material-batch.spec.tsx` 与 `tests/material-batch-boundaries.spec.tsx` 共 15/15 通过，exit 0；原始证据为 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-root-tests\{batch.stdout.txt,results.json}`。本轮未重跑。
- 普通 `git status --short --branch` 在 `dsh` 子模块 Git 元数据处遇到 `Permission denied`；未修权限。改用 `--ignore-submodules=all` 只读检查，既有 dirty/untracked 全部保留。
- 两次只读检查误填 `shell=bash`，运行时均以 `Bash/E_ACCESSDENIED` 拒绝，命令未执行；其余成功读取均使用指定 `pwsh.exe`、`login=false`。
- 新增 `dsh-ext/tests/material-batch-races.spec.tsx`，四个用例分别覆盖取消后旧 prepare 晚回、改选后旧 prepare 晚回、取消 loading 后清单晚回、A/B 建批逆序返回。
- 按令未运行 Python/Node/Vitest/tsc/parser/AST/collect/list/prepare/product/build/GUI/HTTP/模型/网络。
- 正式交回：`D:\Lawbeach\lawbench-coord\A-handback-T31-ui-race-red-20261026-150412.md`。
