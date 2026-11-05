# B 线交回：T32 current-value single assertion correction

- 交回对象：唯一 GPT 主编排
- 执行线：独立 B 线（DeepSeek）
- 正式执行令：`D:\Lawbeach\lawbench-coord\ORCH-ToB-T32GuiCurrentShapeFix-20261025-175603.md`
- 工作目录：`D:\Lawbeach\lawbench-B`
- 状态：有界修改及正式交回完成；停止。Packaging HOLD。
- Git：严格只读；未 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 接续事实与原证据复用

按令复用既有状态，未重新开工、安装、调研、构建或运行探针：

- health 修复已验收且源码保持不变。
- 原根审计已确认实际 `TaskStore.current` 形状为 `{"selection": null}`，契约要求值仅含 `selection`，实际 GUI 期望 `{selection: ...}`。
- 既有根探针在服务自然退出及前面的 GET、实际 tasks v1 检查后，仅在旧条件 `current === null` 处失败。
- 本次修复只纠正该错误输入；既有运行结果不作为 GUI pass。后续仍由根执行全审计和新的有限探针。

## 完整精确变更

相对接令时读取的完整源码，以下为本次全部变更，无省略：

```diff
@@
-check(current === null, "GUI current task must be null for UI session");
+check(
+  same(current, { selection: null }),
+  "GUI current task selection must be null for UI session",
+);
```

修改文件仅：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\probe.mjs`

该断言使用文件内既有 `stable`/`same` 辅助函数，对 `current` 和 `{selection: null}` 做严格整值比较；失败文案明确指示 `selection` 为空。探针的其他断言、payload、健康检查、守卫、服务、README、环境、fixture、lib、E50 与依赖均未修改。

## 文件与 Git 身份

- 仓库 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 修改后 `probe.mjs` SHA-256：`A32C6541F7841940D98A19DE5AFA73FB359A04A22350D985F6788A3162A136ED`
- 目标文件相对 HEAD 的 `git diff --no-ext-diff --no-color`：无输出。
- 目标文件 `git diff --check`：无输出；因下述状态核对阻碍，不把这两项无输出扩大解释为完整工作树证明。

只读状态核对阻碍，原文如下：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

未尝试修复该权限、未更改沙箱或审批、未更改 ACL，也未拆除或改写 writer 锁。该 Git 阻碍不属于本次有界交付要求，不影响本交回。

## 验证边界与遗留

- 按令没有运行 author tests、parser、build、probe、prepare、serve、GUI，也没有启动服务或更改 API。
- 本次没有执行新的运行时验证，不宣称探针通过或 GUI 通过。
- 需要根执行完整审计，再跑一次新的有限探针；Packaging 继续保持 HOLD。
