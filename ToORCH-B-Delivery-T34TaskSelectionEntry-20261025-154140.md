# T34TaskSelectionEntry：B 线正式交回

状态：`AUTHOR_COMPLETE_FOR_ROOT_REVIEW`

执行边界：独立 B 线、本次唯一任务入口；未联系其他聊天，未更换 API，未扩权，未改动沙箱、审批、ACL 或 writer 锁。Git 全程只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`。

## 身份与产物

- HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 原始 `server-before.py`：`D:\Lawbeach\lawbench-coord\ORCH-T34TaskEntryInput-20261025-154140\server-before.py`
- 新目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\TaskSelectionEntry-20261025-154140`
- 新目录仅有 `server.py`、`README.md`
- 两文件均保持未跟踪；未暂存、未提交

路径核对：执行令提到的外部 before 目录存在，但其中没有 `server.py`；其内容为 `dirty.patch` 与 `frozen-pins.json`。授权输入目录存在且包含 `server-before.py`，本次完整读取并使用该文件作为复制基线。未据此扩写、搜索历史或猜测其他 product source。

| 文件 | 当前 SHA-256 |
|---|---|
| `server.py` | `ED7BE2E8530F128D3068E793CC04C0D05DEB7D68AEFD243353C428DF06D5FD34` |
| `README.md` | `744BCFA02F20FB927B3395A95C9590D2E769939C0D02074D950D9923DF41385E` |

原始 `server-before.py` SHA-256：`C763F3B00EC32575BF26F34D4B2A22D07A9A17ABA370AAE79A078737FD2458CA`

## 实现结果

- ROUTES 只新增 `("POST", "/api/task")`；仍为 11 个 GET 与 2 个 POST method/path 对。
- `POST /api/task` 仅接纳恰好七键 body，且要求绑定 case、DSH session、`contract-draft` entry/skill、空 inputs、object params、`local` route、空 query；不接纳地址、Key 或模型字段。
- 合法候选在等待 native app 前由原 Firewall lock 原子 claim；重复或并发 POST 均拒绝。claim 后不存在 reset、补偿、重试或自动恢复。
- 仅 native `200`、`ok: true`、合法 `value.task_id` 才记录 task ID；native 失败或无效响应原样透传，不自造成功。
- 任务响应与 case/open 响应共用既有 `MAX_BODY` 截断捕获；请求原文、body、Key 均不记录。
- claim 前 `/api/task/current` 与 `/api/tasks` 保持原“任务目录 absent/empty”策略；claim 后要求同 session/case、原单案 registry，以及唯一 pending 任务目录。
- pending 目录只允许一个以该 task ID 命名的子目录，子目录内只允许 `task.json`；文件须为不超过 64 KiB 的普通非 link、非 reparse、非 hardlink、非 sparse 文件。
- `task.json` 只读核验 case/session/task 绑定、`agent`、`pending`、`contract-draft`、`local`、空 inputs 与 object params；不重写 native 内容。
- 创建中间态保守拒绝读回；没有新增 wait、sleep、queue 或 recovery。未 claim 的旧空目录 GET 行为保留。
- 重开 case 不清 claim/session/task ID。
- `git diff --no-index` 确认 `server.py` 除下述 ROUTES、Firewall 局部状态/helper/policy/capture 外，与原始文件一致；CLI、prepare/serve、600 秒界、源码 pin、started 一次性守卫、finally/close、socket/credential/OCR/Retainer/Net/lifespan/日志字段均未修改。

## 完整 before/current 函数

以下代码均为完整函数/常量原文，无省略。

### `ROUTES`

before：

```python
ROUTES = frozenset(
    {
        ("GET", "/health"),
        ("GET", "/api/case/recent"),
        ("GET", "/api/settings"),
        ("GET", "/api/capsules"),
        ("GET", "/api/materials"),
        ("GET", "/api/task/current"),
        ("GET", "/api/tasks"),
        ("GET", "/api/outputs"),
        ("GET", "/api/ocr/jobs"),
        ("GET", "/api/wiki/suggestions"),
        ("GET", "/api/wiki/review"),
        ("POST", "/api/case/open"),
    }
)
```

current：

```python
ROUTES = frozenset(
    {
        ("GET", "/health"),
        ("GET", "/api/case/recent"),
        ("GET", "/api/settings"),
        ("GET", "/api/capsules"),
        ("GET", "/api/materials"),
        ("GET", "/api/task/current"),
        ("GET", "/api/tasks"),
        ("GET", "/api/outputs"),
        ("GET", "/api/ocr/jobs"),
        ("GET", "/api/wiki/suggestions"),
        ("GET", "/api/wiki/review"),
        ("POST", "/api/case/open"),
        ("POST", "/api/task"),
    }
)
```

### `Firewall.__init__`

before：

```python
    def __init__(
        self,
        app,
        *,
        case: pathlib.Path,
        ready: pathlib.Path,
        paste: pathlib.Path,
        appdata: pathlib.Path,
        ledger: pathlib.Path,
    ) -> None:
        self.app = app
        self.case = case
        self.ready = ready
        self.paste = paste
        self.registry = appdata / "cases.json"
        self.ledger = ledger
        self.lock = threading.Lock()
        self.records: list[dict[str, Any]] = []
        self.case_id: str | None = None
        with open(ledger, "x", encoding="utf-8"):
            pass
```

current：

```python
    def __init__(
        self,
        app,
        *,
        case: pathlib.Path,
        ready: pathlib.Path,
        paste: pathlib.Path,
        appdata: pathlib.Path,
        ledger: pathlib.Path,
    ) -> None:
        self.app = app
        self.case = case
        self.ready = ready
        self.paste = paste
        self.registry = appdata / "cases.json"
        self.ledger = ledger
        self.lock = threading.Lock()
        self.records: list[dict[str, Any]] = []
        self.case_id: str | None = None
        self.task_claimed = False
        self.task_session_id: str | None = None
        self.task_id: str | None = None
        with open(ledger, "x", encoding="utf-8"):
            pass
```

### 新增 `Firewall._claim_task`

before：不存在。

current：

```python
    def _claim_task(self, data: Any, query: bytes) -> str | None:
        with self.lock:
            if self.task_claimed:
                return "TASK_ALREADY_CLAIMED"
        if query:
            return "TASK_QUERY_DENIED"
        if not isinstance(data, dict) or set(data) != {
            "case_id",
            "session_id",
            "entry",
            "skill",
            "inputs",
            "params",
            "route",
        }:
            return "TASK_REQUEST_SHAPE_DENIED"
        session_id = data.get("session_id")
        bound_case = self._bound_case()
        if (
            bound_case is None
            or data.get("case_id") != bound_case
            or data.get("entry") != "contract-draft"
            or data.get("skill") != "contract-draft"
            or data.get("inputs") != []
            or data.get("route") != "local"
            or not isinstance(data.get("params"), dict)
            or not isinstance(session_id, str)
            or re.fullmatch(
                r"session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-"
                r"[0-9a-f]{4}-[0-9a-f]{12}",
                session_id,
            )
            is None
        ):
            return "TASK_REQUEST_VALUE_DENIED"
        if not self._own_registry() or not self._task_dir_empty():
            return "TASK_LOCAL_LAYOUT_DENIED"
        with self.lock:
            if self.task_claimed:
                return "TASK_ALREADY_CLAIMED"
            if self.case_id != bound_case or not self._task_dir_empty():
                return "TASK_CLAIM_RACE_DENIED"
            self.task_claimed = True
            self.task_session_id = session_id
            self.task_id = None
        return None
```

### 新增 `Firewall._plain_task_file`

before：不存在。

current：

```python
    @staticmethod
    def _plain_task_file(path: pathlib.Path) -> bool:
        try:
            _no_reparse(path)
            info = os.lstat(path)
            attributes = getattr(info, "st_file_attributes", 0)
            return (
                stat.S_ISREG(info.st_mode)
                and not _link(path)
                and 0 <= info.st_size <= MAX_BODY
                and getattr(info, "st_nlink", 1) == 1
                and not (
                    attributes
                    & getattr(stat, "FILE_ATTRIBUTE_SPARSE_FILE", 0x200)
                )
            )
        except (Deny, OSError, ValueError, TypeError):
            return False
```

### 新增 `Firewall._owned_pending_layout`

before：不存在。

current：

```python
    def _owned_pending_layout(self) -> bool:
        with self.lock:
            if (
                not self.task_claimed
                or self.case_id is None
                or self.task_session_id is None
                or self.task_id is None
            ):
                return False
            bound_case = self.case_id
            bound_session = self.task_session_id
            bound_task = self.task_id
        if not self._own_registry():
            return False
        base = self.case / "工作区" / "任务"
        try:
            _no_reparse(base)
            if _link(base) or not base.is_dir():
                return False
            with os.scandir(base) as entries:
                task_dirs = list(entries)
            if len(task_dirs) != 1:
                return False
            task_dir = pathlib.Path(task_dirs[0].path)
            if task_dir.name != bound_task:
                return False
            _no_reparse(task_dir)
            if (
                _link(task_dir)
                or not task_dir.is_dir()
                or not task_dirs[0].is_dir(follow_symlinks=False)
            ):
                return False
            with os.scandir(task_dir) as entries:
                children = list(entries)
            if [child.name for child in children] != ["task.json"]:
                return False
            task_path = task_dir / "task.json"
            if not self._plain_task_file(task_path):
                return False
            task = _read_json(task_path)
            if not self._plain_task_file(task_path) or not isinstance(task, dict):
                return False
            return (
                task.get("case_id") == bound_case
                and task.get("session_id") == bound_session
                and task.get("task_id") == bound_task
                and task.get("kind") == "agent"
                and task.get("state") == "pending"
                and task.get("entry") == "contract-draft"
                and task.get("skill") == "contract-draft"
                and task.get("route") == "local"
                and task.get("inputs") == []
                and isinstance(task.get("params"), dict)
            )
        except (Deny, OSError, ValueError, TypeError):
            return False
```

### `Firewall._policy`

before：

```python
    def _policy(self, path: str, data: Any, query: bytes) -> str | None:
        if path == "/api/case/open" and isinstance(data, dict) and isinstance(
            data.get("path"), str
        ):
            try:
                if _norm(data["path"]) != _norm(self.case):
                    return "OPEN_PATH_OUTSIDE_RUN"
            except (OSError, ValueError, TypeError):
                return "OPEN_PATH_OUTSIDE_RUN"
        if path in CASE_QUERY_ROUTES:
            value = self._single_query(query, "case_id")
            bound_case = self._bound_case()
            if value is None:
                return "CASE_ID_QUERY_REQUIRED"
            if bound_case is None or value != bound_case:
                return "CASE_ID_OUTSIDE_RUN"
        if path == "/api/task/current":
            if self._single_query(query, "session_id") is None:
                return "SESSION_ID_QUERY_REQUIRED"
            if not self._own_registry():
                return "CASE_REGISTRY_OUTSIDE_RUN"
        if path in TASK_EMPTY_ROUTES and not self._task_dir_empty():
            return "TASK_DIR_NOT_EMPTY"
        return None
```

current：

```python
    def _policy(self, path: str, data: Any, query: bytes) -> str | None:
        if path == "/api/case/open" and isinstance(data, dict) and isinstance(
            data.get("path"), str
        ):
            try:
                if _norm(data["path"]) != _norm(self.case):
                    return "OPEN_PATH_OUTSIDE_RUN"
            except (OSError, ValueError, TypeError):
                return "OPEN_PATH_OUTSIDE_RUN"
        if path == "/api/task":
            return self._claim_task(data, query)
        if path in CASE_QUERY_ROUTES:
            value = self._single_query(query, "case_id")
            bound_case = self._bound_case()
            if value is None:
                return "CASE_ID_QUERY_REQUIRED"
            if bound_case is None or value != bound_case:
                return "CASE_ID_OUTSIDE_RUN"
        if path == "/api/task/current":
            session_id = self._single_query(query, "session_id")
            if session_id is None:
                return "SESSION_ID_QUERY_REQUIRED"
            with self.lock:
                claimed = self.task_claimed
                bound_session = self.task_session_id
            if claimed and session_id != bound_session:
                return "TASK_SESSION_OUTSIDE_RUN"
            if not self._own_registry():
                return "CASE_REGISTRY_OUTSIDE_RUN"
        if path in TASK_EMPTY_ROUTES:
            with self.lock:
                claimed = self.task_claimed
            if claimed:
                if not self._owned_pending_layout():
                    return "TASK_PENDING_LAYOUT_DENIED"
            elif not self._task_dir_empty():
                return "TASK_DIR_NOT_EMPTY"
        return None
```

### `Firewall.__call__`

before：

```python
    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if (method, path) not in ROUTES:
            self._record(method, "<denied-route>", 403, "route_denied", started)
            await _guard_reply(send, 403, "OUT_OF_SCOPE")
            return
        body, data = None, None
        if method == "POST":
            original = receive
            try:
                body = await _read_body(receive)
            except Deny:
                self._record(method, path, 413, "body_denied", started)
                await _guard_reply(send, 413, "REQUEST_TOO_LARGE")
                return
            if body is None:
                self._record(
                    method, path, None, "disconnected_before_body", started
                )
                return
            data = _json(body)
            used = False

            async def replay():
                nonlocal used
                if not used:
                    used = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await original()

            receive = replay
        denial = self._policy(path, data, scope.get("query_string", b""))
        if denial:
            self._record(method, path, 403, denial, started)
            await _guard_reply(send, 403, denial)
            return
        status, captured = None, bytearray()

        async def observed(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = int(message["status"])
            elif message["type"] == "http.response.body" and path == "/api/case/open":
                captured.extend(
                    message.get("body", b"")[: max(0, MAX_BODY - len(captured))]
                )
            await send(message)

        try:
            await self.app(scope, receive, observed)
        finally:
            self._record(method, path, status, "native_app", started)
        if path == "/api/case/open" and status == 200:
            response = _json(bytes(captured))
            if isinstance(response, dict) and response.get("ok") is True:
                value = response.get("value")
                if isinstance(value, dict) and isinstance(value.get("case_id"), str):
                    with self.lock:
                        self.case_id = value["case_id"]
```

current：

```python
    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if (method, path) not in ROUTES:
            self._record(method, "<denied-route>", 403, "route_denied", started)
            await _guard_reply(send, 403, "OUT_OF_SCOPE")
            return
        body, data = None, None
        if method == "POST":
            original = receive
            try:
                body = await _read_body(receive)
            except Deny:
                self._record(method, path, 413, "body_denied", started)
                await _guard_reply(send, 413, "REQUEST_TOO_LARGE")
                return
            if body is None:
                self._record(
                    method, path, None, "disconnected_before_body", started
                )
                return
            data = _json(body)
            used = False

            async def replay():
                nonlocal used
                if not used:
                    used = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await original()

            receive = replay
        denial = self._policy(path, data, scope.get("query_string", b""))
        if denial:
            self._record(method, path, 403, denial, started)
            await _guard_reply(send, 403, denial)
            return
        status, captured = None, bytearray()

        async def observed(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = int(message["status"])
            elif (
                message["type"] == "http.response.body"
                and path in ("/api/case/open", "/api/task")
            ):
                captured.extend(
                    message.get("body", b"")[: max(0, MAX_BODY - len(captured))]
                )
            await send(message)

        try:
            await self.app(scope, receive, observed)
        finally:
            self._record(method, path, status, "native_app", started)
        if path == "/api/case/open" and status == 200:
            response = _json(bytes(captured))
            if isinstance(response, dict) and response.get("ok") is True:
                value = response.get("value")
                if isinstance(value, dict) and isinstance(value.get("case_id"), str):
                    with self.lock:
                        self.case_id = value["case_id"]
        if path == "/api/task" and status == 200:
            response = _json(bytes(captured))
            if isinstance(response, dict) and response.get("ok") is True:
                value = response.get("value")
                if isinstance(value, dict):
                    task_id = value.get("task_id")
                    if isinstance(task_id, str) and re.fullmatch(
                        r"T-[0-9]{14}-[0-9a-f]{4}", task_id
                    ):
                        with self.lock:
                            if (
                                self.task_claimed
                                and self.task_session_id is not None
                                and self.task_id is None
                            ):
                                self.task_id = task_id
```

## Dirty 保全与副作用

- 既有 B 线 tracked dirty 已在授权 before 目录保全：`dirty.patch` SHA-256 `BE2613A851BBE840B838E100AE76918407AFA57ADD4826A9782BEB8842617309`。
- `frozen-pins.json` 已读取并保持原样；其中记录旧 server、`case/task.py`、`api/ui.py`、`task_create.schema.json` 的冻结哈希。
- 本次只创建授权 T34 新目录及其中 `server.py`、`README.md`；server 未运行，因此没有 task-store、runtime、日志或请求副作用。
- 未改产品、契约、权限、全局网络、旧 launcher、A 线材料或 common guard；Packaging HOLD。
- 既有 dirty 与未跟踪证据未清理、未移动、未覆盖。

## 已做验证

- 完整读取授权执行令、`facts.json`、`server-before.py`、`task-store.py`、`native-ui.py`、`task-create.schema.json`。
- 只读核对 HEAD 与 `facts.json.expected_head` 一致。
- 复制后 SHA 与旧 server 固定 SHA 一致。
- 使用 `git --no-optional-locks ... diff --no-index --ignore-submodules` 只读对照原始与当前 server；diff 仅包含执行令允许的局部改动。
- 只读读取当前两文件全文/关键函数与 README，并计算两文件 SHA。
- 只读确认目标目录当前仅有两个交付文件且均为未跟踪。

## 未验边界

- 按执行令未运行 `--prepare`、`--serve`、任何脚本、parser、pytest、collect、Vitest、tsc、自测、build、GUI 或联网。
- 未取得真实 native `/api/task` 200/task ID，也未实跑第二次 POST、并发 claim、native 失败透传、case reopen 后状态保持或 pending 文件 hardlink/sparse 拒绝。
- 未验证 HTTP、GUI、模型、OCR、打包、旧 launcher 或生产接线的通过性。
- 当前结论仅为作者静态实现完成，等待 root 按令先做 15–30 秒有限 HTTP 复核，再决定 fresh root GUI。
