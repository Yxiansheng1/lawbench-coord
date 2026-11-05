# B Native Read-GET Return

Status: `PREPARED_ONLY / AUTHOR_NO_RUN`

本交回只建立新的 GET 集成准备入口，不主张运行时、Host/RPC、GUI、OCR、模型、打包或 T33 验收通过。按正式执行令没有运行 `--prepare`、`--serve`、测试、自检、AST、Python、Node、产品导入、构建、服务、GUI、网络或子代理；没有 Git 写入。

## 入口与身份

- Tree: `D:\Lawbeach\lawbench-B`
- HEAD at preparation: `dc56a93be4b07dbe7a48863e3135351659817fb5`
- Accepted source: `docs\plan\evidence\T33\HostEntry-20261025-094816\server.py`
- Accepted source SHA-256: `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`
- Accepted source: 1310 lines, 45845 bytes
- New entry: `docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py`
- New entry SHA-256: `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`
- New entry: 1357 lines, 47389 bytes
- New README: `docs\plan\evidence\T33\ReadGetEntry-20261025-105313\README.md`
- New README SHA-256: `60e4c28b17e15fd7e0c7925e4ca43bd77788e7752b433c7c46b9e12f1d0f4f3e`
- New README: 68 lines, 2801 bytes

新目录是在确认尚不存在后创建；`server.py` 由已验收入口原样 `Copy-Item` 后仅做下方 diff 的小补丁，没有重建 1310 行，也没有改写原入口。

## 实现边界

- `ROUTES` 精确为 12 个 method/path：11 GET + 1 POST。旧五个 GET 和 `POST /api/case/open` 保留；新增 `GET /api/task/current`、`/api/tasks`、`/api/outputs`、`/api/ocr/jobs`、`/api/wiki/suggestions`、`/api/wiki/review`；materials scan/import POST 已从 ROUTES 移除。
- materials、tasks、outputs、ocr/jobs、wiki/suggestions、wiki/review 只接受唯一键 `case_id`、唯一非空值，且必须等于实际先验 native `/api/case/open` 200 捕获到的绑定值。缺失、重复、额外、空值或错值均返回 403 reason code；不转发或记录原始 query/token。
- `/api/task/current` 只接受唯一非空 opaque `session_id` query；要求 native case 已绑定，并逐请求读取 `<appdata>\cases.json`，要求 v=1、恰好一条记录，且 case_id/root 与当前案完全一致。
- `/api/task/current` 与 `/api/tasks` 在 native 调用前逐请求检查 `<case>\工作区\任务` 为缺失或空目录；使用 `_no_reparse`，不遍历子项内容。任何 child entry 均以 `TASK_DIR_NOT_EMPTY` fail closed，不能进入 `TaskStore.list`/`_close_stale` 的 stale repair，也不伪造空返回。
- 原有 CLI、prepare/serve、source identity、默认 lifespan off、socket/Keyring/Net deny、no-OCR/no-Retainer startup、no forward listener、one-shot 有限运行、token 内存处理与 cleanup 路径均未改。
- 允许的写入仍只是 native `case/open` 带来的私有 SQLite/registry 更新，以及私有日志/runtime evidence；README 明确不声称为全局零写。

## 只读复核

- Hash 复核：Accepted source 在复制/补丁后仍为 `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`，1310 行，45845 bytes。
- New source 的 route block 经源码读取为 11 GET + 1 POST；对新入口检索 `api/materials/scan` 与 `api/materials/import` 无命中。
- 以下完整 unified diff 即新入口相对 accepted source 的全部累计差异；除该 diff、README 和本交回件外，本执行没有改写产品源码、契约、旧入口、旧 launcher/E50 或 Git 状态。
- Dirty 保全件已核在 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\NativeReadGet-before-20261025-105313`，含 `head.txt`、`status.txt`、`server-before.py`、`tracked.patch` 及 stderr 文件。没有 stash/reset/clean/checkout，也没有 Git add/commit/rebase/push。

## 工具操作阻碍（已记录）

- 三次只读读取命令误把 `shell` 指到 `bash`，原生运行器均以 `Bash/E_ACCESS_DENIED` 在执行前拒绝；没有 Bash 命令实际执行、没有状态改变。随后全部改为指定绝对路径 native PowerShell，`login=false`。
- 第一次建目录使用 `New-Item -LiteralPath`，该 PowerShell 构建报参数不存在，未建目录；改用 `New-Item -Path` 后创建成功。
- `git diff --no-index` 因文件有差异返回 exit 1，这是 diff 的预期状态；命令只读，未写 index。

## Entire cumulative diff

```diff
diff --git a/HostEntry-20261025-094816/server.py b/ReadGetEntry-20261025-105313/server.py
index 5e4b78b..fde9c57 100644
--- a/HostEntry-20261025-094816/server.py
+++ b/ReadGetEntry-20261025-105313/server.py
@@ -74,14 +74,26 @@ ROUTES = frozenset(
         ("GET", "/api/settings"),
         ("GET", "/api/capsules"),
         ("GET", "/api/materials"),
+        ("GET", "/api/task/current"),
+        ("GET", "/api/tasks"),
+        ("GET", "/api/outputs"),
+        ("GET", "/api/ocr/jobs"),
+        ("GET", "/api/wiki/suggestions"),
+        ("GET", "/api/wiki/review"),
         ("POST", "/api/case/open"),
-        ("POST", "/api/materials/scan"),
-        ("POST", "/api/materials/import"),
     }
 )
-CASE_ROUTES = frozenset(
-    {"/api/materials", "/api/materials/scan", "/api/materials/import"}
+CASE_QUERY_ROUTES = frozenset(
+    {
+        "/api/materials",
+        "/api/tasks",
+        "/api/outputs",
+        "/api/ocr/jobs",
+        "/api/wiki/suggestions",
+        "/api/wiki/review",
+    }
 )
+TASK_EMPTY_ROUTES = frozenset({"/api/task/current", "/api/tasks"})
 RUNTIME_ARTIFACTS = (
     "started.json",
     "ready.json",
@@ -657,12 +669,14 @@ class Firewall:
         case: pathlib.Path,
         ready: pathlib.Path,
         paste: pathlib.Path,
+        appdata: pathlib.Path,
         ledger: pathlib.Path,
     ) -> None:
         self.app = app
         self.case = case
         self.ready = ready
         self.paste = paste
+        self.registry = appdata / "cases.json"
         self.ledger = ledger
         self.lock = threading.Lock()
         self.records: list[dict[str, Any]] = []
@@ -696,6 +710,55 @@ class Firewall:
         except (OSError, ValueError, TypeError):
             return False
 
+    @staticmethod
+    def _single_query(query: bytes, key: str) -> str | None:
+        values = parse_qs(query.decode("latin-1"), keep_blank_values=True)
+        if set(values) != {key}:
+            return None
+        items = values[key]
+        return items[0] if len(items) == 1 and items[0] else None
+
+    def _bound_case(self) -> str | None:
+        with self.lock:
+            return self.case_id
+
+    def _own_registry(self) -> bool:
+        bound_case = self._bound_case()
+        try:
+            _no_reparse(self.registry)
+            data = _read_json(self.registry)
+            cases = data.get("cases") if isinstance(data, dict) else None
+            if (
+                not isinstance(data, dict)
+                or data.get("v") != 1
+                or not isinstance(cases, list)
+                or len(cases) != 1
+                or not isinstance(cases[0], dict)
+            ):
+                return False
+            return (
+                bound_case is not None
+                and cases[0].get("case_id") == bound_case
+                and isinstance(cases[0].get("root"), str)
+                and _norm(cases[0]["root"]) == _norm(self.case)
+            )
+        except (Deny, OSError, ValueError, TypeError):
+            return False
+
+    def _task_dir_empty(self) -> bool:
+        path = self.case / "工作区" / "任务"
+        try:
+            _no_reparse(self.case)
+            _no_reparse(path, allow_missing_tail=True)
+            if not os.path.lexists(path):
+                return True
+            if _link(path) or not path.is_dir():
+                return False
+            with os.scandir(path) as entries:
+                return next(entries, None) is None
+        except (Deny, OSError, ValueError, TypeError):
+            return False
+
     def _policy(self, path: str, data: Any, query: bytes) -> str | None:
         if path == "/api/case/open" and isinstance(data, dict) and isinstance(
             data.get("path"), str
@@ -705,37 +768,20 @@ class Firewall:
                     return "OPEN_PATH_OUTSIDE_RUN"
             except (OSError, ValueError, TypeError):
                 return "OPEN_PATH_OUTSIDE_RUN"
-        if path == "/api/materials/import" and isinstance(data, dict) and isinstance(
-            data.get("paths"), list
-        ):
-            for value in data["paths"]:
-                if not isinstance(value, str):
-                    return "IMPORT_PATH_INVALID"
-                try:
-                    if _within(self.ready, value):
-                        _no_reparse(pathlib.Path(value))
-                        continue
-                    if self._paste_source(value):
-                        continue
-                except (Deny, OSError, ValueError, TypeError):
-                    pass
-                return "IMPORT_PATH_OUTSIDE_RUN"
-        if path in CASE_ROUTES:
-            if path == "/api/materials":
-                values = parse_qs(
-                    query.decode("latin-1"), keep_blank_values=True
-                ).get("case_id", [])
-                if len(values) > 1:
-                    return "CASE_ID_AMBIGUOUS"
-                value = values[0] if values else None
-            else:
-                value = data.get("case_id") if isinstance(data, dict) else None
-            with self.lock:
-                bound_case = self.case_id
-            if isinstance(value, str) and (
-                bound_case is None or value != bound_case
-            ):
+        if path in CASE_QUERY_ROUTES:
+            value = self._single_query(query, "case_id")
+            bound_case = self._bound_case()
+            if value is None:
+                return "CASE_ID_QUERY_REQUIRED"
+            if bound_case is None or value != bound_case:
                 return "CASE_ID_OUTSIDE_RUN"
+        if path == "/api/task/current":
+            if self._single_query(query, "session_id") is None:
+                return "SESSION_ID_QUERY_REQUIRED"
+            if not self._own_registry():
+                return "CASE_REGISTRY_OUTSIDE_RUN"
+        if path in TASK_EMPTY_ROUTES and not self._task_dir_empty():
+            return "TASK_DIR_NOT_EMPTY"
         return None
 
     async def __call__(self, scope, receive, send) -> None:
@@ -931,6 +977,7 @@ async def _serve(
             case=layout["case"],
             ready=layout["ready"],
             paste=layout["paste"],
+            appdata=layout["appdata"],
             ledger=root / "requests.ndjson",
         )
         server = uvicorn.Server(
```

## 待 Root 决定

请 Root 先做完整累计 diff 复核。未获准前不要执行该新入口；作者没有发出任何 prepare/serve 请求，也没有将“源码静态准备”表述成 GET 能力或 GUI 通过。
