"""T34 original native relay consumer (line A, DeepSeek).

Source-only artifact. The author wrote this file and did NOT execute it: the
Root runner owns every runtime action (source check, socket bind, child
process, upstream POST, cleanup). No product SDK, no default application
factory, no production configuration path is used here.

One bounded pass:

    Node child (original canonical CLI/appBoot boot + original llm-pi-ai SDK
    one-shot stream)  --HTTP over 127.0.0.1-->  this process' uvicorn server
    (original lawbench Net / ExternalLLMPolicy / forward_app with a real
    upstream transport)  --HTTPS-->  https://www.tokenav.ai/v1/chat/completions

Exactly one upstream POST is permitted. The real relay key exists only in this
process' memory: it arrives on stdin, is handed to the original forwarder as
the external key getter, and never reaches Node, argv, the environment, any
environment variable, or any file on disk.
"""

# T34 static-fix preflight is installed below the standard imports.
from __future__ import annotations

import hashlib as _pin_sha256
import json as _pin_json
from pathlib import Path as _PinPath


def _verify_all_pins_before_service_import() -> None:
    literals_path = _PinPath(__file__).resolve().with_name("literal-inputs.json")
    literals = _pin_json.loads(literals_path.read_text(encoding="utf-8"))
    groups = (
        ("sdk", literals.get("sdk_and_frozen_pins"), 45),
        ("service", literals.get("service_source_pins"), 5),
        ("additional", literals.get("additional_runtime_and_primary_pins"), 2),
    )
    if any(not isinstance(group, list) or len(group) != count for _, group, count in groups):
        raise RuntimeError("T34 pin group count mismatch")
    for _, group, _ in groups:
        for pin in group:
            path = _PinPath(pin["path"])
            payload = path.read_bytes()
            if len(payload) != pin["bytes"]:
                raise RuntimeError("T34 pin byte count mismatch")
            if _pin_sha256.sha256(payload).hexdigest() != pin["sha256"]:
                raise RuntimeError("T34 pin digest mismatch")

import argparse
import asyncio
import hashlib
import hmac
import importlib.util
import json
import os
import socket
import stat
import sys
import time
from pathlib import Path


EVIDENCE = Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735"
)
LITERALS_PATH = EVIDENCE / "literal-inputs.json"
RUNS = EVIDENCE / "runs"
NODE_CLIENT = EVIDENCE / "native-client.mjs"
SERVICE_DIR = Path(r"D:\Lawbeach\lawbench-B\service")
ELECTRON = Path(
    r"D:\Lawbeach\lawbench-A\dsh\apps\desktop\node_modules\electron\dist\electron.exe"
)

REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
MAX_ARTIFACT_BYTES = 64 * 1024
NODE_TIMEOUT_S = 120
TOTAL_TIMEOUT_S = 180
CLEANUP_TIMEOUT_S = 5
LOCAL_PATH = "/v1-ext/chat/completions"
CALLER = "T34_CALLER_SENTINEL"
CREDENTIAL_REF = "EXTERNAL_LLM_KEY"

# The native wire contract. Every key the original SDK may legally emit for
# this one-shot is listed; anything else is denied before the request is
# delegated upstream. `temperature` is intentionally absent: the native
# request omits it, so a wire that carries it is not the native wire.
ALLOWED_WIRE_KEYS = frozenset(
    {
        "model",
        "messages",
        "stream",
        "stream_options",
        "max_tokens",
        "max_completion_tokens",
        "store",
    }
)

PIN_SUFFIXES = {
    "resolver": "resolve-from-dsh.mjs",
    "guard": "network-guard.cjs",
    "credentials": "t50-memory-credentials.mjs",
    "app_boot": "packages\\boot\\app-boot\\lib\\index.js",
    "config_editor": "packages\\boot\\config-editor\\lib\\index.js",
    "settings": "packages\\settings\\settings\\lib\\index.js",
    "loader": "vendor\\loader\\lib\\index.js",
    "timer": "vendor\\timer\\lib\\index.js",
    "hmr": "packages\\boot\\hmr\\lib\\index.js",
    "llm": "packages\\llm\\llm\\lib\\index.js",
    "llm_pi_ai": "packages\\llm\\llm-pi-ai\\lib\\index.js",
    "cli_profile_boot": "apps\\cli\\lib\\profile-boot.js",
    "launch_environment": "packages\\util\\launch-environment\\lib\\index.js",
    "desktop_host_entry": "apps\\desktop-host\\lib\\index.js",
    "pinned_consumer": "relay-forward.py",
}

LITERALS: dict = {}


def _same(left: Path, right: Path) -> bool:
    return os.path.normcase(os.path.abspath(left)) == os.path.normcase(
        os.path.abspath(right)
    )


def _reparse_free(path: Path) -> None:
    if path.exists():
        attrs = getattr(path.lstat(), "st_file_attributes", 0)
        if path.is_symlink() or (REPARSE and attrs & REPARSE):
            raise RuntimeError("REPARSE_PATH")


def prepare_root(value: str) -> Path:
    """Create the one fresh, directly owned run directory for this pass."""
    root = Path(os.path.abspath(value))
    if not root.is_absolute() or not _same(root.parent, RUNS):
        raise RuntimeError("ROOT_NOT_FRESH_CHILD")
    if root.exists() or root.is_symlink():
        raise RuntimeError("ROOT_EXISTS")
    for path in (root.parent, *root.parent.parents):
        _reparse_free(path)
    _reparse_free(EVIDENCE)
    if not RUNS.exists():
        RUNS.mkdir()
    _reparse_free(RUNS)
    try:
        root.mkdir()
    except FileExistsError:
        raise RuntimeError("ROOT_EXISTS") from None
    return root


def read_secret() -> str:
    """The only place the real relay key enters this process."""
    raw = sys.stdin.buffer.read(8193)
    if not raw or len(raw) > 8192:
        raise RuntimeError("STDIN_INVALID")
    pairs = json.loads(raw, object_pairs_hook=lambda value: value)
    del raw
    if not isinstance(pairs, list) or len(pairs) != 1:
        raise RuntimeError("STDIN_INVALID")
    name, secret = pairs[0]
    if name != "key" or not isinstance(secret, str) or not secret or not secret.isascii():
        raise RuntimeError("STDIN_INVALID")
    return secret


def load_literals() -> dict:
    if not LITERALS_PATH.exists():
        raise RuntimeError("LITERALS_MISSING")
    return json.loads(LITERALS_PATH.read_text(encoding="utf-8"))


def pin_lookup(pins: list, suffix: str) -> str:
    matches = [
        pin
        for pin in pins
        if isinstance(pin, dict)
        and isinstance(pin.get("path"), str)
        and pin["path"].lower().endswith(suffix.lower())
    ]
    if len(matches) != 1:
        raise RuntimeError("PIN_LOOKUP_FAILED:" + suffix)
    return matches[0]["path"]


def resolve_paths(literals: dict) -> dict:
    pins = literals.get("sdk_and_frozen_pins")
    if not isinstance(pins, list) or not pins:
        raise RuntimeError("PIN_INVENTORY_MISSING")
    paths = {name: pin_lookup(pins, suffix) for name, suffix in PIN_SUFFIXES.items()}
    install_anchor = literals.get("install_anchor")
    if not isinstance(install_anchor, str) or not install_anchor:
        raise RuntimeError("INSTALL_ANCHOR_MISSING")
    paths["install_anchor"] = install_anchor
    return paths


def verify_pins(paths: dict) -> dict:
    """Verify the bytes and digests of every pinned file this pass depends on."""
    pins = json.loads(LITERALS_PATH.read_text(encoding="utf-8"))["sdk_and_frozen_pins"]
    by_path = {
        pin["path"]: pin
        for pin in pins
        if isinstance(pin, dict) and isinstance(pin.get("path"), str)
    }
    verified = []
    for name, raw_path in paths.items():
        pin = by_path.get(raw_path)
        if pin is None:
            raise RuntimeError("PIN_NOT_IN_INVENTORY:" + name)
        target = Path(raw_path)
        if not target.is_file() or target.is_symlink():
            raise RuntimeError("PIN_FILE_MISSING:" + name)
        blob = target.read_bytes()
        if len(blob) != pin.get("bytes"):
            raise RuntimeError("PIN_BYTES_CHANGED:" + name)
        if hashlib.sha256(blob).hexdigest() != pin.get("sha256"):
            raise RuntimeError("PIN_SHA_CHANGED:" + name)
        verified.append(name)
    return {"verified": sorted(verified), "count": len(verified)}


def load_pinned_consumer(paths: dict):
    """Import the accepted Python consumer for its Gate and cleanup helpers.

    The pinned module guards its own entry point with `__name__ ==
    "__main__"`, so importing it runs no main and imports no application
    factory: only its constants, the Gate transport, the ASGI lifespan
    harness and the bounded cleanup helper are reused.
    """
    target = Path(paths["pinned_consumer"])
    spec = importlib.util.spec_from_file_location("t34_pinned_relay_forward", target)
    if spec is None or spec.loader is None:
        raise RuntimeError("PINNED_CONSUMER_IMPORT_FAILED")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if getattr(module, "__name__", "") == "__main__":
        raise RuntimeError("PINNED_CONSUMER_MAIN_EXECUTED")
    for required in ("Gate", "Lifespan", "_bounded"):
        if not hasattr(module, required):
            raise RuntimeError("PINNED_CONSUMER_SYMBOL_MISSING:" + required)
    return module


def flatten_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


def validate_native_wire(payload) -> str:
    """Return an empty string when the outgoing request is the native wire."""
    if not isinstance(payload, dict):
        return "payload_not_object"
    keys = set(payload)
    unknown = keys - ALLOWED_WIRE_KEYS
    if unknown:
        return "unknown_keys:" + ",".join(sorted(unknown))
    if payload.get("model") != LITERALS["model"]:
        return "model_mismatch"
    if payload.get("stream") is not True:
        return "stream_not_true"
    if payload.get("stream_options") != {"include_usage": True}:
        return "stream_options_mismatch"
    has_max = "max_tokens" in payload
    has_completion = "max_completion_tokens" in payload
    if has_max == has_completion:
        return "max_tokens_xor_violation"
    value = payload["max_tokens"] if has_max else payload["max_completion_tokens"]
    if value != LITERALS["max_tokens"]:
        return "max_tokens_value_mismatch"
    if "store" in payload and payload["store"] is not False:
        return "store_not_false"
    messages = payload.get("messages")
    if not isinstance(messages, list) or len(messages) != 1:
        return "messages_shape"
    message = messages[0]
    if not isinstance(message, dict) or message.get("role") != "user":
        return "message_role_mismatch"
    if flatten_content(message.get("content")) != LITERALS["prompt"]:
        return "message_content_mismatch"
    return ""


def build_native_gate(pinned, key_getter):
    """A gate over the original transport that accepts only the native wire.

    The original consumer accepted a non-streaming request; the native SDK
    sends a streaming one. Everything else (single POST, exact upstream URL,
    exact bearer token, no caller marker, no query, no redirect) is inherited
    unchanged from the accepted gate.
    """

    class NativeSseStream:
        """Pass through the original response stream after bounded key scanning."""

        def __init__(self, source, secret: str):
            self._source = source
            self._secret = secret.encode("utf-8")
            self.body = bytearray()
            self.completed = False
            self.secret_found = False
            self.bounds_failed = False
            self.invalid_chunk = False
            self.aclose_called = False

        def __aiter__(self):
            return self

        async def __anext__(self):
            try:
                chunk = await self._source.__anext__()
            except StopAsyncIteration:
                self.completed = True
                raise
            if not isinstance(chunk, bytes):
                self.invalid_chunk = True
                raise RuntimeError("SSE_CHUNK_NOT_BYTES")
            if (
                len(chunk) > MAX_ARTIFACT_BYTES
                or len(self.body) + len(chunk) > MAX_ARTIFACT_BYTES
            ):
                self.bounds_failed = True
                raise RuntimeError("RAW_SSE_TOO_LARGE")
            self.body.extend(chunk)
            if self._secret in self.body:
                self.secret_found = True
                raise RuntimeError("SECRET_IN_UPSTREAM_STREAM")
            return chunk

        async def aclose(self):
            self.aclose_called = True
            await self._source.aclose()

    class NativeGate(pinned.Gate):
        def __init__(self, getter):
            super().__init__(getter)
            self.native_reasons = []
            self.native_accepted = False
            self.native_response_status = None
            self.native_response_content_type = None
            self.native_stream = None

        async def handle_async_request(self, request):
            if not self.actual or self.forwarded != 0:
                return self._deny()
            if (
                request.method != "POST"
                or str(request.url) != LITERALS["upstream"]
                or request.url.scheme != "https"
                or request.url.host != "www.tokenav.ai"
                or request.url.query
            ):
                return self._deny()
            secret = self.key_getter()
            auth = request.headers.get_list("authorization")
            if not secret or len(auth) != 1:
                return self._deny()
            expected = f"Bearer {secret}".encode("ascii")
            marker = CALLER.encode("ascii")
            if not hmac.compare_digest(auth[0].encode("latin-1"), expected) or any(
                marker in name.lower() + b":" + value
                for name, value in request.headers.raw
            ):
                return self._deny()
            body = await request.aread()
            try:
                payload = json.loads(body)
            except (UnicodeDecodeError, ValueError):
                return self._deny()
            reason = validate_native_wire(payload)
            if reason:
                self.native_reasons.append(reason)
                return self._deny()
            self.forwarded += 1
            self.native_accepted = True
            response = await self.real.handle_async_request(request)
            self.native_response_status = response.status_code
            self.native_response_content_type = response.headers.get("content-type")
            self.native_stream = NativeSseStream(response.stream, secret)
            response.stream = self.native_stream
            return response

    return NativeGate(key_getter)


def sanitized_env(root: Path, paths: dict) -> dict:
    """A private, key-free environment for the one Node child."""
    private_home = root / "node-home"
    private_appdata = root / "node-appdata"
    private_tmp = root / "node-tmp"
    private_dsh_home = root / "dsh-home"
    for target in (private_home, private_appdata, private_tmp, private_dsh_home):
        target.mkdir(parents=True, exist_ok=True)
    resolver_url = Path(paths["resolver"]).as_uri()
    node_options = f"--import={resolver_url} --require={paths['guard']}"
    return {
        "SystemRoot": os.environ.get("SystemRoot", r"C:\Windows"),
        "SystemDrive": os.environ.get("SystemDrive", "C:"),
        "WINDIR": os.environ.get("WINDIR", r"C:\Windows"),
        "COMSPEC": os.environ.get("COMSPEC", r"C:\Windows\system32\cmd.exe"),
        "PATH": os.environ.get("PATH", ""),
        "PATHEXT": os.environ.get("PATHEXT", ".COM;.EXE;.BAT;.CMD"),
        "NUMBER_OF_PROCESSORS": os.environ.get("NUMBER_OF_PROCESSORS", "1"),
        "TEMP": str(private_tmp),
        "TMP": str(private_tmp),
        "TMPDIR": str(private_tmp),
        "HOME": str(private_home),
        "USERPROFILE": str(private_home),
        "APPDATA": str(private_appdata),
        "LOCALAPPDATA": str(private_appdata),
        "DSH_HOME": str(private_dsh_home),
        "ELECTRON_RUN_AS_NODE": "1",
        "NODE_OPTIONS": node_options,
        "LANG": "C",
        "LC_ALL": "C",
    }


async def run_node_child(root: Path, port: int, paths: dict) -> dict:
    """Start the single approved Electron-as-Node child and wait once."""
    if not ELECTRON.is_file():
        raise RuntimeError("ELECTRON_EXE_MISSING")
    if not NODE_CLIENT.is_file():
        raise RuntimeError("NODE_CLIENT_MISSING")
    env = sanitized_env(root, paths)
    argv = [
        str(ELECTRON),
        str(NODE_CLIENT),
        "--root",
        str(root),
        "--port",
        str(port),
    ]
    process = await asyncio.create_subprocess_exec(
        *argv,
        stdin=asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
        cwd=str(root),
    )
    info = {
        "argv": argv,
        "pid": process.pid,
        "executable": str(ELECTRON),
        "electron_run_as_node": True,
        "node_options_present": True,
        "real_key_in_environment": False,
        "forced_termination": False,
        "timed_out": False,
        "cancelled": False,
        "child_closed": False,
    }
    communicate_task = asyncio.create_task(process.communicate())
    try:
        stdout, stderr = await asyncio.wait_for(
            asyncio.shield(communicate_task), timeout=NODE_TIMEOUT_S
        )
    except asyncio.TimeoutError:
        info["forced_termination"] = True
        info["timed_out"] = True
        try:
            process.kill()
        except ProcessLookupError:
            pass
        try:
            stdout, stderr = await asyncio.wait_for(
                asyncio.shield(communicate_task), timeout=10
            )
        except asyncio.TimeoutError:
            communicate_task.cancel()
            stdout, stderr = b"", b""
            try:
                await asyncio.wait_for(
                    asyncio.shield(process.wait()), timeout=10
                )
            except Exception:
                pass
    except asyncio.CancelledError:
        info["forced_termination"] = True
        info["cancelled"] = True
        try:
            process.kill()
        except ProcessLookupError:
            pass
        try:
            await asyncio.wait_for(asyncio.shield(communicate_task), timeout=10)
        except asyncio.TimeoutError:
            communicate_task.cancel()
            try:
                await asyncio.wait_for(
                    asyncio.shield(process.wait()), timeout=10
                )
            except Exception:
                pass
        info["child_closed"] = process.returncode is not None
        raise
    info["child_closed"] = process.returncode is not None
    info["returncode"] = process.returncode
    info["stdout_bytes"] = len(stdout)
    info["stderr_bytes"] = len(stderr)
    info["stdout"] = stdout[:MAX_ARTIFACT_BYTES].decode("utf-8", "replace")
    info["stderr"] = stderr[:MAX_ARTIFACT_BYTES].decode("utf-8", "replace")
    return info


async def execute(root: Path, secret: str) -> dict:
    state = {
        "status": "FAILED",
        "failure": None,
        "phase": "INIT",
        "phases": [],
        "pins": {},
        "control": {},
        "upstream": {},
        "gate_forwarded": 0,
        "gate_denied": 0,
        "native_reasons": [],
        "native_accepted": False,
        "node": {},
        "reply": None,
        "reply_bytes": None,
        "finish_reason": None,
        "usage": None,
        "raw_sse": {},
        "cleanup": {},
        "timings": {},
    }
    holder = {"key": None}
    logs = net = gate = policy = forwarder = server = task = None
    sock = None
    lifespan_seen = {
        "startup_complete": False,
        "shutdown_complete": False,
        "duplicate": False,
    }
    started = time.monotonic()

    def phase(name: str) -> None:
        state["phase"] = name
        state["phases"].append(name)

    try:
        phase("LITERALS")
        _verify_all_pins_before_service_import()
        literals = load_literals()
        paths = resolve_paths(literals)
        state["pins"] = verify_pins(paths)
        state["upstream"] = {
            "url": literals["upstream"],
            "model": literals["model"],
            "max_tokens": literals["max_tokens"],
            "max_actual_POST": literals["max_actual_POST"],
        }
        pinned = load_pinned_consumer(paths)

        phase("SERVICE_IMPORT")
        if not (SERVICE_DIR / "lawbench").is_dir():
            raise RuntimeError("SERVICE_PACKAGE_MISSING")
        from lawbench import logs as service_logs
        from lawbench.external_llm import ExternalLLMPolicy
        from lawbench.net import Net, forward_app
        import uvicorn

        logs = service_logs

        phase("BIND")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(("127.0.0.1", 0))
        sock.listen(64)
        port = int(sock.getsockname()[1])
        state["control"]["loopback_port"] = port
        state["control"]["local_path"] = LOCAL_PATH

        phase("FORWARDER")
        logs.setup(root / "appdata")
        policy = ExternalLLMPolicy()
        policy.update(literals["service_policy"])
        net = Net(dict(literals["dead_endpoints"]), forward_port=port)
        gate = build_native_gate(pinned, lambda: holder["key"])
        forwarder = forward_app(
            net,
            transport=gate,
            external_policy=policy,
            external_key_getter=lambda: holder["key"],
        )

        async def observed_forward_app(scope, receive, send):
            async def observed_send(message):
                if scope.get("type") == "lifespan":
                    message_type = message.get("type")
                    flags = {
                        "lifespan.startup.complete": "startup_complete",
                        "lifespan.shutdown.complete": "shutdown_complete",
                    }
                    flag = flags.get(message_type)
                    if flag is not None:
                        if lifespan_seen[flag]:
                            lifespan_seen["duplicate"] = True
                        lifespan_seen[flag] = True
                await send(message)

            await forwarder(scope, receive, observed_send)

        config = uvicorn.Config(
            observed_forward_app,
            lifespan="on",
            log_level="warning",
            access_log=False,
        )
        server = uvicorn.Server(config)
        task = asyncio.create_task(server.serve(sockets=[sock]))
        deadline = time.monotonic() + 20
        while not server.started and time.monotonic() < deadline:
            if task.done():
                raise RuntimeError("SERVER_TASK_ENDED")
            await asyncio.sleep(0.05)
        if not server.started:
            raise RuntimeError("SERVER_START_TIMEOUT")
        state["control"]["server_started"] = True

        phase("NODE")
        holder["key"] = secret
        gate.actual = True
        node_info = await run_node_child(root, port, paths)
        gate.actual = False
        holder["key"] = None
        state["node"] = node_info

        phase("READ_RESULT")
        node_result = None
        node_result_path = root / "node-result.json"
        if node_result_path.is_file():
            try:
                node_result = json.loads(node_result_path.read_text(encoding="utf-8"))
            except (UnicodeDecodeError, ValueError):
                node_result = None
        state["node"]["result_present"] = node_result is not None
        if isinstance(node_result, dict):
            state["reply"] = node_result.get("reply")
            state["reply_bytes"] = node_result.get("reply_bytes")
            state["finish_reason"] = node_result.get("finish_reason")
            state["usage"] = node_result.get("usage")
            state["node"]["outcome"] = node_result.get("outcome")
            state["node"]["shutdown"] = node_result.get("shutdown")

        phase("JUDGE")
        failures = []
        if gate.forwarded != literals["max_actual_POST"]:
            failures.append("OUTBOUND_COUNT_FAILED")
        if gate.denied != 0:
            failures.append("GATE_DENIED")
        if not gate.native_accepted:
            failures.append("NATIVE_WIRE_NOT_ACCEPTED")
        if gate.native_reasons:
            failures.append("NATIVE_WIRE_REJECTED")
        if gate.native_response_status != 200:
            failures.append("UPSTREAM_HTTP_NOT_200")
        response_content_type = gate.native_response_content_type
        if not isinstance(response_content_type, str) or not response_content_type.lower().startswith(
            "text/event-stream"
        ):
            failures.append("UPSTREAM_CONTENT_TYPE")
        native_stream = gate.native_stream
        if (
            native_stream is None
            or not native_stream.completed
            or not native_stream.body
            or native_stream.secret_found
            or native_stream.bounds_failed
            or native_stream.invalid_chunk
        ):
            failures.append("RAW_SSE_NOT_COMPLETED")
        if node_info.get("returncode") != 0:
            failures.append("NODE_RETURNCODE")
        if node_info.get("forced_termination") is not False:
            failures.append("NODE_FORCED_TERMINATION")
        if node_info.get("child_closed") is not True:
            failures.append("NODE_CHILD_NOT_CLOSED")
        shutdown = state["node"].get("shutdown")
        if not isinstance(shutdown, dict) or shutdown.get("fulfilled") is not True:
            failures.append("NODE_SHUTDOWN_NOT_FULFILLED")
        if not isinstance(state["reply"], str) or not state["reply"].strip():
            failures.append("REPLY_EMPTY")
        if (
            not isinstance(state["finish_reason"], dict)
            or state["finish_reason"].get("kind") != "stop"
        ):
            failures.append("FINISH_REASON_NOT_STOP")
        secret_bytes = secret.encode("utf-8")
        for label, blob in (
            ("node_stdout", node_info.get("stdout", "").encode("utf-8")),
            ("node_stderr", node_info.get("stderr", "").encode("utf-8")),
        ):
            if secret_bytes in blob:
                failures.append("SECRET_IN_" + label.upper())
        if node_result_path.is_file():
            if secret_bytes in node_result_path.read_bytes():
                failures.append("SECRET_IN_NODE_RESULT")
        if state["failure"] is None and failures:
            state["failure"] = ",".join(failures)
    except Exception as exc:  # noqa: BLE001 - the failure itself is the report
        if state["failure"] is None:
            state["failure"] = type(exc).__name__
    finally:
        phase("CLEANUP")
        cleanup = state["cleanup"]
        holder["key"] = None
        if gate is not None:
            gate.actual = False
        if server is not None:
            server.should_exit = True
        if task is not None:
            try:
                await asyncio.wait_for(task, timeout=CLEANUP_TIMEOUT_S)
            except Exception:
                task.cancel()
                try:
                    await asyncio.wait_for(task, timeout=CLEANUP_TIMEOUT_S)
                except Exception:
                    pass
            cleanup["server_stopped"] = (
                task.done()
                and not task.cancelled()
                and task.exception() is None
            )
        cleanup["lifespan_startup_complete"] = lifespan_seen["startup_complete"]
        cleanup["lifespan_shutdown_complete"] = lifespan_seen["shutdown_complete"]
        cleanup["lifespan_no_duplicate_completion"] = not lifespan_seen["duplicate"]
        if net is not None:
            try:
                net.client.close()
                cleanup["net_client"] = net.client.is_closed
            except Exception:
                cleanup["net_client"] = False
        if gate is not None:
            try:
                await asyncio.wait_for(gate.aclose(), timeout=CLEANUP_TIMEOUT_S)
                cleanup["gate_transport"] = True
            except Exception:
                cleanup["gate_transport"] = False
            native_stream = gate.native_stream
            cleanup["gate_response_stream"] = (
                native_stream is not None and native_stream.aclose_called
            )
        if logs is not None:
            try:
                logs.close()
                cleanup["logs"] = True
            except Exception:
                cleanup["logs"] = False
        if sock is not None:
            try:
                sock.close()
                cleanup["socket"] = sock.fileno() == -1
            except Exception:
                cleanup["socket"] = False
        cleanup["keyholder"] = holder["key"] is None

        native_stream = gate.native_stream if gate is not None else None
        state["upstream"]["status"] = (
            gate.native_response_status if gate is not None else None
        )
        state["upstream"]["content_type"] = (
            gate.native_response_content_type if gate is not None else None
        )
        state["upstream"]["raw_sse_completed"] = bool(
            native_stream is not None and native_stream.completed
        )
        state["upstream"]["raw_sse_secret_found"] = bool(
            native_stream is not None and native_stream.secret_found
        )
        if (
            native_stream is not None
            and native_stream.completed
            and native_stream.body
            and not native_stream.secret_found
            and not native_stream.bounds_failed
            and not native_stream.invalid_chunk
        ):
            raw_sse = bytes(native_stream.body)
            if secret.encode("utf-8") not in raw_sse:
                artifact = root / "raw-sse.bin"
                try:
                    with artifact.open("xb") as handle:
                        handle.write(raw_sse)
                    state["raw_sse"] = {
                        "artifact": str(artifact),
                        "bytes": len(raw_sse),
                        "sha256": hashlib.sha256(raw_sse).hexdigest(),
                        "completed": True,
                    }
                except Exception:
                    state["failure"] = state["failure"] or "RAW_SSE_ARTIFACT_FAILED"
        if cleanup and not all(cleanup.values()):
            state["failure"] = state["failure"] or "CLEANUP_FAILED"
        state["gate_forwarded"] = gate.forwarded if gate is not None else 0
        state["gate_denied"] = gate.denied if gate is not None else 0
        state["native_reasons"] = list(getattr(gate, "native_reasons", []))
        state["native_accepted"] = bool(getattr(gate, "native_accepted", False))
        state["timings"] = {
            "total_s": round(time.monotonic() - started, 3),
            "node_timeout_s": NODE_TIMEOUT_S,
            "total_budget_s": TOTAL_TIMEOUT_S,
        }

    if state["failure"] is None and cleanup_ok(state["cleanup"]):
        state["status"] = "PASS"
    else:
        state["status"] = "FAILED"
    payload = json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    if secret.encode("utf-8") in payload:
        raise RuntimeError("SECRET_IN_RESULT")
    with (root / "result.json").open("xb") as handle:
        handle.write(payload + b"\n")
    return state


def cleanup_ok(cleanup: dict) -> bool:
    return bool(cleanup) and all(cleanup.values())


def main() -> None:
    global LITERALS
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--root", required=True)
        args = parser.parse_args()
        root = prepare_root(args.root)
        LITERALS = load_literals()
        secret = read_secret()
        state = asyncio.run(
            asyncio.wait_for(execute(root, secret), timeout=TOTAL_TIMEOUT_S)
        )
        secret = None
        if state["status"] != "PASS":
            raise RuntimeError(state["failure"] or "CONSUMER_FAILED")
    except Exception as exc:
        sys.stderr.write(type(exc).__name__ + "\n")
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
