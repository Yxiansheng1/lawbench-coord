# A progress — T31 disposal fix / native selector

状态：`SOURCE_HANDED_BACK / NOT_RUN`  
更新时间：2026-10-26T16:33:23+08:00

已完成：

- 按要求首个工具只读正式执行令。
- 只读核对 dirty、固定 native test `1166B065...FC7B`、C test
  `469118...D00DE`、两个冻结配置哈希。
- 在 `dsh-ext/ui/material-batch.ts` 的最后 registration disposer 中增加
  `materialCaptureOwners.clear()`，仅在有 registration 时保留 owner。
- 新增 `dsh-ext/vitest.t31-material-admission.config.mjs`：复用原生
  `thread-safe` project/setup/plugin/path resolution，仅取既有 React/react-dom
  alias，并精确选择 native admission 一个文件。
- 写入证据 README 和正式交回文件。

验证边界：

- 本线未运行 Node、Vitest、collect、tsc、Python、parser、AST、build、prepare、
  serve、probe、HTTP、GUI、网络或任何产品测试。
- C disposal1、affected 19/types、native2、GUI、R2/R1 均为 `NOT_RUN`。
- Git 严格只读；无 add/commit/rebase/stash/reset/clean/checkout/push、无 commit SHA。

下一步：root 全文复核当前源码、私有 selector、冻结测试和 dirty，再实际运行
`docs/plan/evidence/T31/DisposalAndNativeFixture-20261026-162611/README.md`
第 6 节列出的命令并保存真实 stdout/stderr/退出码。
