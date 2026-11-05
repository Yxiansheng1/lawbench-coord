# To ORCH — B 线 T32 GUI case/open 形状修正

- 交回时间：2026-10-25（Asia/Taipei）
- 执行令：`ORCH-ToB-T32GuiCaseOpenShape-20261025-180609.md`
- 状态：`DELIVERED_FOR_ROOT_REVIEW`
- 结论边界：仅有界源码修正，不是探针、GUI 或验收通过；Packaging 继续 `HOLD`

## 结论

已按执行令完成四个允许写点的交付：`server.py` 的 GUI 阶段案件打开形状、
`probe.mjs` 的同案 TCP reopen 载荷、该目录 README，以及本交回件。

`server.py` 现在保持：

- bootstrap 阶段仍只接受精确 `{path}`。
- GUI 阶段接受精确 `{path}` 或精确 `{path, template: null}`。
- 其他键、非 null `template`、`kind`、`folders` 均以 `CASE_OPEN_BODY` 拒绝。
- 既有 canonical case 路径校验、own-registry 校验、sticky failure、四次计数、
  await 前原子增加和返回案件身份校验均未改。

`probe.mjs` 只把同一案件的 TCP reopen 载荷改为
`{path: caseRoot, template: null}`；四次 bootstrap 原生 ASGI 请求未改。

## 最终文件与 SHA-256

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `docs/plan/evidence/T32/GuiDraftEntry-20261025-172934/server.py` | 77868 | `e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b` |
| `docs/plan/evidence/T32/GuiDraftEntry-20261025-172934/probe.mjs` | 19149 | `9bd2d212d767d7f8ebbbb00e922dd81d7068486025a1a8d588f716fa24645e73` |
| `docs/plan/evidence/T32/GuiDraftEntry-20261025-172934/README.md` | 6904 | `400a18eaa5fac77af88532e7437079775fbb832a1a694807bb58118c606e71c3` |

改动前 `server.py` 为 77553 bytes，SHA-256
`458412d6b03c4c350bd40e228503e8ec8f207c13125ec22139612a9176a62151`。

## 完整 before/current diff

三份目标文件在本次编辑前均为既有 untracked dirty 文件，因此 Git 没有可归因于
本次工作的相对 `HEAD` 文件 diff。以下是本次实际编辑覆盖的完整变更 hunks，
没有其他源码差异。

```diff
--- server.py (before)
+++ server.py (current)
@@ _claim_case
-        if not self._exact_keys(data, {"path"}) or not isinstance(data["path"], str):
+        with self.lock:
+            gui_phase = self.gui_phase
+        if not (
+            (
+                self._exact_keys(data, {"path"})
+                or (
+                    gui_phase
+                    and self._exact_keys(data, {"path", "template"})
+                    and data["template"] is None
+                )
+            )
+            and isinstance(data["path"], str)
+        ):
             return "CASE_OPEN_BODY"
```

```diff
--- probe.mjs (before)
+++ probe.mjs (current)
@@ same-case TCP reopen
-const reopen = await expectOk("POST", "/api/case/open", { path: caseRoot });
+const reopen = await expectOk("POST", "/api/case/open", {
+  path: caseRoot,
+  template: null,
+});
```

```diff
--- README.md (before)
+++ README.md (current)
@@ server identity
-- 本目录 `server.py`：`77553` bytes，SHA-256
-  `458412d6b03c4c350bd40e228503e8ec8f207c13125ec22139612a9176a62151`。
+- 本目录 `server.py`：`77868` bytes，SHA-256
+  `e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b`。

@@ GUI boundary
-- GUI 阶段三个 core 路由始终 403。同案 `case/open` 最多允许四次，计数在
-  await 前原子增加；返回案件号必须与 bootstrap 原值一致，失败粘住。
+- GUI 阶段三个 core 路由始终 403。同案 `case/open` 最多允许四次，计数在
+  await 前原子增加；bootstrap 只接受精确 `{path}`，GUI 阶段额外接受精确
+  `{path, template: null}`，其他键或非 null template 均拒绝；返回案件号
+  必须与 bootstrap 原值一致，失败粘住。
```

## 未改边界

- 未改 `_serve`、bootstrap、环境隔离、鉴权、claim 的其他分支、source-pin
  逻辑或 cleanup。
- 未改 health `status=ok` / `contract_version=1.6`、strict current
  `selection=null`、原有断言、once-v2、timeout 或四次 bootstrap 请求。
- 未改产品、A 线、旧 E50、其他 entry、API、route、config、permission 或 ACL。
- 未启动 service、GUI、API、6000D/395、模型、OCR 或 writer；未创建或接管 service
  进程，未拆分 writer 锁。
- 未运行 test、parser、build、prepare、serve、probe、GUI、selftest、全量测试或
  任何替代验证。必要的源码核对仅使用 PowerShell 只读读取、定向搜索、
  文件长度与 SHA-256 计算。

## 既有状态与证据复用

- 编辑前后目标三文件均为 `??`；既有 dirty 保持原状。工作树中其他 dirty
  没有被清理、暂存或覆盖。
- Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout、
  push 或任何其他写操作。没有尝试修复 `index.lock` 或权限。
- 按令复用既有事实：原生 finite probe 24 次调用曾通过；实际 GUI 180225 以
  不满足 strict entry 的 `case/open` 组合触发 `403 CASE_OPEN_BODY`。本次没有
  重跑旧有限探针，没有重用或重试旧 root，也没有把旧源码上的通过外推为新
  `server.py` SHA 的通过。
- 原执行器把当前 PID 声明为本次唯一执行者，不是第二 writer；本运行器没有
  查询或接管 writer，也没有启动 setup 或 legacy 模式。

## 根侧后续

1. 对新 SHA 做完整源码复核。
2. 新固定 SHA 在进入 GUI 前，需要 A 线仅更新两个既有 pin literals；B 线未写 A。
3. 由根侧对新源码运行 fresh finite 20 probe。本交回件不得作为该探针通过证据。
4. GUI 或 service 启动仍须另行准入，本轮没有启动授权。

当前没有需要 B 线继续处理的技术阻碍；Packaging 保持 `HOLD`。
