# A 线交回：T31 scope HTTP 根别名精确匹配修复

## 结论

有界源码修改已完成，正式交回。未运行测试、构建、导入、HTTP 或服务命令；本次交付不构成功能 PASS，根侧复核和运行证明仍待完成。

## 修改范围

唯一源码修改：

- `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scope-http.config.mjs`
- 修改前 SHA256：`63e364b2060ab4dd830930afbac06f31c1418c673298be1d58516c976c6559cc`
- 修改后 SHA256：`31f0ad38d8e05c83875e3620d84c21fb07ff2ee08c70d660513529bd22ba6b22`

实际改动：

1. 将继承的 `baseConfig.resolve.alias` 对象无遗漏地适配成 Vite 别名数组，保留全部原 find/replacement。
2. 仅把 `@deepseek-ai/dsh-llm` 根别名改为精确正则 `/^@deepseek-ai\/dsh-llm$/`，不再截获 `/assistant-stream` 等派生子路径。
3. 保留原有 `baseConfig` 插件，以及 `standardDecoratorPlugin()`、native `tsconfigPaths` 插件、node 环境、globals 和唯一测试 include。
4. 未增加源码别名列表、硬编码 pnpm 路径、通用 resolver、窗口替身或业务 mock；未修改消费者、断言、DSH 配置、原始 Vitest 配置或依赖。

## 既有事实与证据复用

- 修改前专用配置 SHA256 与执行令给出的值一致。
- 已复用根侧原始导入失败证据：
  - `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\HTTP-consumer-import-only-20261026-041900\stderr.txt`
  - `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\HTTP-consumer-import-only-20261026-041900\stdout.txt`
- 失败仍为 `@deepseek-ai/dsh-llm/assistant-stream` 无法解析，0 tests、0 HTTP；与执行令所述根因一致。
- 已只读核对 native `tsconfig.base.json` 第 147 行对 `assistant-stream` 的映射，以及第 399 行对 `@deepseek-ai/dsh-llm` 根包的映射。两处均未修改。
- 修改前快照路径 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-before-http-config-alias-fix-20261026-042003` 的 `Get-FileHash` 返回 `Access denied`；未扩权、未改 ACL，也未尝试修复。

## 工作树与 Git 边界

- 开工只读检查发现大量既有 dirty/untracked 内容，已原样保全。
- 未过滤的 `git status --short` 在读取子模块工作树 `.git` 时返回 `Permission denied`；未解锁、未修复。改用 `git status --short --ignore-submodules=all` 核验顶层状态，未改变工作树或子模块。
- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。本次没有 Git 提交 SHA，交付以本协调文件为准。

## 明确未运行

按执行令禁区，本次未运行：

- author parser、Vitest、test collection、`tsc`、任何测试或 self-validation；
- build、prepare、serve、probe、HTTP、GUI、模型调用；
- 服务启动、重启、停止或导入验证。

因此只确认了源码修改内容与哈希，未确认 Vite 运行时行为。

## 剩余根侧证明

1. 根侧先执行 full config/formal/all-command audit。
2. 审计接受后，以 SAME target、new process 执行仅导入验证。
3. 仅当导入装载成功后，再执行一次有界 HTTP 验证。
4. 若导入仍未装载，只能视为依赖未证明，不能记为功能 PASS。

本次到正式交回件落盘为止。
