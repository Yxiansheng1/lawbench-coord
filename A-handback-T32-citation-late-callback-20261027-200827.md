# A 线交回：T32 文稿出处迟到回调测试

## 状态

- 执行者：A 线独立执行会话。
- 正式执行令：`A-T32-citation-late-callback-order-20261027-200827.md`。
- 状态：`AUTHORED_NOT_RUN`。
- 验证类型：仅 `LOCAL_UI_UNIT` 测试源码编写；没有运行测试或任何运行时验证。
- 产品代码：未修改。
- Git：严格只读；未 add、commit、rebase、stash、reset、clean、checkout、merge 或 push。

## 交付

1. `D:/Lawbeach/lawbench-A/dsh-ext/tests/document-citation-late-callback.spec.tsx`
   - 当前 12383 bytes，337 lines。
   - SHA-256：`e9aa0b39a702c4af777c7919983a52b894d90ef101987457fec4ef3378a3b929`。
2. `D:/Lawbeach/lawbench-A/docs/plan/evidence/T32/CitationLateCallback-20261027-200827/README.md`
3. 本交回件：`D:/Lawbeach/lawbench-coord/A-handback-T32-citation-late-callback-20261027-200827.md`

## 覆盖结果

- 用例 1：甲稿出处材料 pending 时切换同案乙稿；旧材料结果不打开、不提示、不保存、不发送；乙稿正控精确携带乙任务与本案材料核对请求。
- 用例 2：甲案材料 pending 时在同一 React root 把真实 `Documents` 的 `caseRef` 换为乙案；旧结果不产生任何可见副作用；乙案正控精确携带乙案和乙案任务。
- 用例 3：材料 pending 时卸载真实 `Documents`；旧成功材料结果在 `act` 内解决后仍无来源、提示、保存、发送或 source API 调用。
- 每个用例都先断言真实文档已加载、真实出处按钮存在，并断言点击后恰好一次预期 `materialsList` 请求，避免把夹具/导入 gray 误当产品断言 red。

## 冻结与清理

- `documents.tsx`、`citation.ts`、`citation-deps.ts`、既有 `document-citation-navigation.spec.tsx`、`documents.spec.tsx`、`citation.spec.ts` 和 `vitest.config.mjs` 的 bytes/SHA-256 与 fixed-inputs 快照逐项一致。
- 既有 dirty 未清理、未暂存、未提交；完整开工前快照保留在 `T32CitationLateCallbackInput-20261027-200827/A-dirty-before.stdout.txt`。
- 测试 `afterEach` 卸载 root、移除 body 容器、清空 API/Nav，并恢复完整 `AppState`；所有成功用例都在 `act` 内解决 deferred 响应。
- 未使用 sleep、timeout、计时器、Node/Python、Vitest、tsc、编译、HTTP、GUI、trace、Office、model 或打包命令。

## 非声明与阻碍

- 没有声称新测试通过，也没有声称新测试一定先红或已复现新产品缺陷。
- 普通只读 `git status` 在既有子模块目录上被 managed 权限拒绝；未扩权、未改 ACL/沙箱/审批、未处理任何锁，改用 `--ignore-submodules=all` 完成只读清单核验。
- 一次只读 `rg` 误用了 `bash` launcher，进程立即 `E_ACCESS_DENIED` 且没有执行内部命令；其余 Shell 均使用执行令指定的原生 PowerShell。

事实命令、非零项、哈希、精确断言和边界的完整记录见 A 线 README。交回后停止，等待主编排根侧对新 consumer 的独立执行与审计。
