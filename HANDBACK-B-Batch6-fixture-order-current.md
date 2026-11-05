# B6 夹具命名修正交回

状态：完成。

执行依据：`D:\Lawbeach\lawbench-coord\ORCH-B-Batch6-fixture-order-source-current.md`。

## 有界改动

只修改以下两个已存在的 Batch6 隔离夹具文件：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\Batch6\NativeMaterials-20261103\prepare.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\Batch6\NativeMaterials-20261103\entry.py`

实际行为：

- 前 12 个生成文件名现为 `发票-Test-material-01.txt` 至 `发票-Test-material-12.txt`。
- 后 12 个仍为 `Test-material-13.txt` 至 `Test-material-24.txt`，第 24 项未改。
- 导入后的 `Materials.list` 检查保留 24 行条件，按外部文件 basename 去扩展名所得 name 精确匹配并排序比较。
- `entry.py` 的 fixture basename 清单同步为相同的 24 项。
- 未修改产品代码、材料排序、安全函数、RootBinding、长路径 IO、既有 failed root 或其他证据。

## 全 diff

```diff
diff --git a/docs/plan/evidence/Batch6/NativeMaterials-20261103/prepare.py b/docs/plan/evidence/Batch6/NativeMaterials-20261103/prepare.py
--- a/docs/plan/evidence/Batch6/NativeMaterials-20261103/prepare.py
+++ b/docs/plan/evidence/Batch6/NativeMaterials-20261103/prepare.py
@@ -272,7 +272,8 @@
         if number in FIXTURE_GROUPS:
             current_group = FIXTURE_GROUPS[number]
         parent = pathlib.Path(current_group) if current_group else pathlib.Path(".")
-        relative = parent / f"Test-material-{number:02d}.txt"
+        prefix = "发票-" if number <= 12 else ""
+        relative = parent / f"{prefix}Test-material-{number:02d}.txt"
         body = (
             f"虚构测试材料 {number:02d}\n\n"
             "本文件仅用于律所本地 AI 工作台的真机界面滚动、搜索、筛选、"
@@ -423,9 +424,12 @@
     rows = materials.list(EXPECTED_CASE_ID)["materials"]
     if len(rows) != 24:
         raise SystemExit(f"production materials list returned {len(rows)} rows, expected 24")
-    if [row["name"] for row in rows] != [
-        f"Test-material-{number:02d}.txt" for number in range(1, 25)
-    ]:
+    expected_names = [
+        f"{'发票-' if number <= 12 else ''}Test-material-{number:02d}"
+        for number in range(1, 25)
+    ]
+    actual_names = sorted(pathlib.PurePosixPath(row["name"]).stem for row in rows)
+    if actual_names != sorted(expected_names):
         raise SystemExit("production material names do not match the fixed 24-file inventory")
     if any(row.get("origin") != "ref" for row in rows):
         raise SystemExit("one or more prepared materials are not external references")
diff --git a/docs/plan/evidence/Batch6/NativeMaterials-20261103/entry.py b/docs/plan/evidence/Batch6/NativeMaterials-20261103/entry.py
--- a/docs/plan/evidence/Batch6/NativeMaterials-20261103/entry.py
+++ b/docs/plan/evidence/Batch6/NativeMaterials-20261103/entry.py
@@ -419,6 +419,8 @@
     _assert_exact_tree(layout["fixture_root"], expected_fixture_rows, "fixture_tree_identity")
-    if [pathlib.PurePosixPath(row["relativePath"]).name for row in expected_fixture_rows] != [
-        f"Test-material-{number:02d}.txt" for number in range(1, 25)
-    ]:
+    expected_fixture_names = [
+        f"{'发票-' if number <= 12 else ''}Test-material-{number:02d}.txt"
+        for number in range(1, 25)
+    ]
+    if [pathlib.PurePosixPath(row["relativePath"]).name for row in expected_fixture_rows] != expected_fixture_names:
         raise Deny("fixture_names")
     if not any("发票" in row["relativePath"] for row in expected_fixture_rows):
         raise Deny("fixture_invoice_named_virtual_paths")
```

## 最终文件身份

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `docs\plan\evidence\Batch6\NativeMaterials-20261103\prepare.py` | 25662 | `A983738760458FCFD472BDD12B6EC53BD49BD57006E365A33FDB6B1E608C63BF` |
| `docs\plan\evidence\Batch6\NativeMaterials-20261103\entry.py` | 46438 | `108C9496AAB2EFDC8108D27D9BE3CE02FA094B5A3EB5377DF4C1AF3D4DF8C283` |

## 验证与边界

- 已按执行令保留并复用既有状态事实；未重读虚构 root，未改 old failed root。
- 已执行只读的修改点复核，确认前 12 项使用“发票-”前缀、后 12 项无前缀，第 24 项仍为 `Test-material-24.txt`。
- 按特别验证禁区，未运行 runtime、Python parser、test、build、HTTP、GUI 或 model；因此本交回不声称运行通过。
- Git 严格只读：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，未暂存。
- 首次 `git status --short` 因既有 `dsh` 子模块目录权限被拒；随后只读使用 `--ignore-submodules=all` 核对到工作树原有大量 dirty/untracked 项，未清理或改动这些既有项。此权限拒绝不影响本单交付，未尝试改权限、ACL、锁或审批。
