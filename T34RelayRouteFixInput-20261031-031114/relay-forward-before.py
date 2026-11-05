from __future__ import annotations
import argparse
import asyncio
import hashlib
import hmac
import json
import os
import stat
import sys
from pathlib import Path
import httpx
PRODUCT_ROOT = Path(r"D:\Lawbeach\lawbench-B")
APPROVED = Path(r"D:\Lawbeach\lawbench-coord\T34RelayForwardBoundedInput-20261031-030549\approved-inputs.json")
EVIDENCE = Path(r"D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549")
RUNS = EVIDENCE / "runs"
UPSTREAM = "https://www.tokenav.ai/v1/chat/completions"
MODEL = "deepseek-v4.1-flash-1017"
PROMPT = "这是软件连通性测试，请只回复：连接测试成功。"
CALLER = "T34_CALLER_SENTINEL"
ROUTE = "t34-route-sentinel"
FAKE_KEY = "T34_FAKE_CONTROL_KEY"
PATH = "/v1-ext/chat/completions"
LOCAL = "http://127.0.0.1:65005"
MAX_REPLY = 64 * 1024
REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
def _same(left: Path, right: Path) -> bool:
    return os.path.normcase(os.path.abspath(left)) == os.path.normcase(os.path.abspath(right))
def _reparse_free(path: Path) -> None:
    if path.exists():
        attrs = getattr(path.lstat(), "st_file_attributes", 0)
        if path.is_symlink() or (REPARSE and attrs & REPARSE):
            raise RuntimeError("REPARSE_PATH")
def prepare_root(value: str) -> Path:
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
def verify_sources() -> None:
    approved = json.loads(APPROVED.read_text(encoding="utf-8"))
    if (approved.get("only_upstream") != UPSTREAM or approved.get("model") != MODEL
            or approved.get("prompt") != PROMPT or approved.get("max_model_POST") != 1
            or approved.get("max_tokens") != 256 or approved.get("total_s") != 120):
        raise RuntimeError("APPROVED_INPUT_MISMATCH")
    expected = {
        "net.py": (25896, "e547412246e92ba4ba105fed98923f91e30e8f5f63a0965a9830ab03f4252585"),
        "external_llm.py": (6693, "ed34db4f63f3f5db580660b3fc1256c154f5533c8aa83834a7dd7539b7c2ce6e"),
        "logs.py": (2455, "7576265fd8bf4967d9d99b7b67c22607af36fc640ccd8333602ba4ff15bdcdc6"),
        "errors.py": (3204, "f580d733d88a15a70df089f8b1bcd6bfffcac6b8a78013532aab61d2d20d33f4"),
        "config.py": (2701, "c65355fb2335356955e717f22780358605a7e56d775b878e9fb9d69fdfabcfce"),
    }
    pins = approved.get("source_pins")
    if not isinstance(pins, list) or len(pins) != len(expected):
        raise RuntimeError("SOURCE_PINS_MISMATCH")
    seen = set()
    for pin in pins:
        if not isinstance(pin, dict):
            raise RuntimeError("SOURCE_PINS_MISMATCH")
        path = Path(pin.get("path", ""))
        if not _same(path.parent, PRODUCT_ROOT / "service" / "lawbench"):
            raise RuntimeError("SOURCE_PINS_MISMATCH")
        name = path.name
        if name not in expected or name in seen:
            raise RuntimeError("SOURCE_PINS_MISMATCH")
        seen.add(name)
        raw = path.read_bytes()
        want_bytes, want_sha = expected[name]
        if pin.get("bytes") != want_bytes or pin.get("sha256") != want_sha:
            raise RuntimeError("SOURCE_PINS_MISMATCH")
        if len(raw) != want_bytes or hashlib.sha256(raw).hexdigest() != want_sha:
            raise RuntimeError("SOURCE_CHANGED")
async def _bounded(cleanup: dict, name: str, action) -> None:
    try:
        await asyncio.wait_for(action(), timeout=5)
        cleanup[name] = True
    except Exception:
        cleanup[name] = False
class Gate(httpx.AsyncBaseTransport):
    def __init__(self, key_getter):
        self.real = httpx.AsyncHTTPTransport(verify=True, retries=0, trust_env=False)
        self.key_getter = key_getter
        self.actual = False
        self.forwarded = 0
        self.denied = 0
        self.real_closed = False
    def _deny(self): self.denied += 1; raise PermissionError("DENY")
    async def handle_async_request(self, request: httpx.Request):
        if not self.actual or self.forwarded != 0:
            return self._deny()
        if (request.method != "POST" or str(request.url) != UPSTREAM
                or request.url.scheme != "https" or request.url.host != "www.tokenav.ai"
                or request.url.query):
            return self._deny()
        secret = self.key_getter()
        auth = request.headers.get_list("authorization")
        if not secret or len(auth) != 1:
            return self._deny()
        expected = f"Bearer {secret}".encode("ascii")
        marker = CALLER.encode("ascii")
        if (not hmac.compare_digest(auth[0].encode("latin-1"), expected)
                or any(marker in n.lower() + b":" + v for n, v in request.headers.raw)):
            return self._deny()
        body = await request.aread()
        try:
            payload = json.loads(body)
        except (UnicodeDecodeError, ValueError):
            return self._deny()
        if not isinstance(payload, dict) or set(payload) != {"model", "messages", "max_tokens", "stream"}:
            return self._deny()
        if (payload.get("model") != MODEL
                or payload.get("messages") != [{"role": "user", "content": PROMPT}]
                or payload.get("max_tokens") != 256 or payload.get("stream") is not False
                or "tools" in payload
                or any(k in payload for k in ("chat_template_kwargs", "enable_thinking", "reasoning_effort"))):
            return self._deny()
        self.forwarded += 1
        return await self.real.handle_async_request(request)

    async def aclose(self):
        await self.real.aclose()
        self.real_closed = True
class Lifespan:
    def __init__(self, app):
        self.app = app
        self.inbox = asyncio.Queue()
        self.outbox = asyncio.Queue()
        self.task = None
        self.started = False
    async def _receive(self): return await self.inbox.get()
    async def _send(self, message): await self.outbox.put(message)
    async def start(self):
        scope = {"type": "lifespan", "asgi": {"version": "3.0", "spec_version": "2.0"}}
        self.task = asyncio.create_task(self.app(scope, self._receive, self._send))
        await self.inbox.put({"type": "lifespan.startup"})
        message = await asyncio.wait_for(self.outbox.get(), timeout=30)
        if message.get("type") != "lifespan.startup.complete":
            raise RuntimeError("LIFESPAN_START_FAILED")
        self.started = True
    async def close(self):
        if self.task is None:
            return
        if self.started:
            await self.inbox.put({"type": "lifespan.shutdown"})
            message = await asyncio.wait_for(self.outbox.get(), timeout=5)
            if message.get("type") != "lifespan.shutdown.complete":
                raise RuntimeError("LIFESPAN_STOP_FAILED")
        await asyncio.wait_for(self.task, timeout=5)
async def execute(root: Path, secret: str) -> bool:
    state = {"status": "FAILED", "ok": False, "failure": None, "controls": {},
             "after404": None, "http": None, "sha": None, "reply_bytes": None,
             "reply": None, "cleanup": {}}
    holder = {"key": None}
    logs = net = gate = local = lifespan = None
    try:
        verify_sources()
        from lawbench import logs
        from lawbench.external_llm import ExternalLLMPolicy
        from lawbench.net import Net, forward_app
        logs.setup(root / "appdata")
        policy = ExternalLLMPolicy()
        enabled = {"external_llm": {"enabled": True, "base_url": "https://www.tokenav.ai",
                                   "model": MODEL, "context_window": 65536, "supports_tools": False}}
        net = Net({"llm_base_url": "http://127.0.0.1:65004",
                   "prep_base_url": "http://127.0.0.1:65003"}, forward_port=65005)
        gate = Gate(lambda: holder["key"])
        forwarder = forward_app(net, transport=gate, external_policy=policy,
                                external_key_getter=lambda: holder["key"])
        lifespan = Lifespan(forwarder)
        async with asyncio.timeout(120):
            await lifespan.start()
            local = httpx.AsyncClient(transport=httpx.ASGITransport(app=forwarder),
                                      base_url=LOCAL, follow_redirects=False,
                                      trust_env=False, timeout=httpx.Timeout(110, connect=5))
            controls = state["controls"]
            policy.update({"external_llm": {"enabled": False}})
            controls["policy_off"] = (await local.post(PATH, content=b"{}")).status_code
            policy.update(enabled)
            controls["enabled_missing_key"] = (await local.post(PATH, content=b"{}")).status_code
            holder["key"] = FAKE_KEY
            controls["origin"] = (await local.post(PATH, content=b"{}",
                                  headers={"Origin": LOCAL})).status_code
            controls["wrong_host"] = (await local.post(PATH, content=b"{}",
                                    headers={"Host": "127.0.0.1:65004"})).status_code
            controls["wrong_route"] = (await local.post("/v1-ext/wrong", content=b"{}")).status_code
            holder["key"] = None
            if any(code != 404 for code in controls.values()) or gate.forwarded != 0:
                state["failure"] = "ADMISSION_CONTROL_FAILED"
            else:
                holder["key"] = secret
                gate.actual = True
                request = {"model": ROUTE, "messages": [{"role": "user", "content": PROMPT}],
                           "max_tokens": 256, "stream": False,
                           "chat_template_kwargs": {"marker": ROUTE},
                           "enable_thinking": True, "reasoning_effort": "max"}
                response = await local.post(PATH, content=json.dumps(
                    request, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
                    headers={"Authorization": f"Bearer {CALLER}", "Content-Type": "application/json"})
                gate.actual = False
                holder["key"] = None
                state["http"] = response.status_code
                raw = response.content
                if gate.forwarded != 1:
                    state["failure"] = "OUTBOUND_COUNT_FAILED"
                elif len(raw) > MAX_REPLY:
                    state["failure"] = "REPLY_TOO_LARGE"
                elif secret.encode("utf-8") in raw:
                    state["failure"] = "SECRET_IN_REPLY"
                else:
                    try:
                        text = raw.decode("utf-8")
                    except UnicodeDecodeError:
                        state["failure"] = "REPLY_NOT_UTF8"
                    else:
                        state["reply"] = text
                        state["sha"] = hashlib.sha256(raw).hexdigest()
                        state["reply_bytes"] = len(raw)
                        if response.status_code != 200:
                            state["failure"] = "ACTUAL_HTTP_STATUS"
                        else:
                            try:
                                choice = json.loads(raw)["choices"][0]
                                content = choice["message"]["content"]
                                stop = choice["finish_reason"] == "stop"
                            except (KeyError, IndexError, TypeError, ValueError):
                                state["failure"] = "ACTUAL_REPLY_INVALID"
                            else:
                                if not isinstance(content, str) or not content.strip() or not stop:
                                    state["failure"] = "ACTUAL_REPLY_INVALID"
            policy.update({"external_llm": {"enabled": False}})
            state["after404"] = (await local.post(PATH, content=b"{}")).status_code
            if state["after404"] != 404 or gate.forwarded != 1:
                state["failure"] = state["failure"] or "POST_ACTUAL_CONTROL_FAILED"
            state["ok"] = state["failure"] is None
    except Exception as exc:
        state["failure"] = state["failure"] or type(exc).__name__
    finally:
        cleanup = state["cleanup"]
        if lifespan is not None:
            await _bounded(cleanup, "forwarder_clients", lifespan.close)
        if local is not None:
            await _bounded(cleanup, "local_client", local.aclose)
        if net is not None:
            try:
                net.client.close()
                cleanup["net_client"] = True
            except Exception:
                cleanup["net_client"] = False
        if gate is not None:
            await _bounded(cleanup, "gate_transport", gate.aclose)
            if not gate.real_closed:
                await _bounded(cleanup, "real_transport", gate.real.aclose)
        if logs is not None:
            try:
                logs.close()
                cleanup["logs"] = True
            except Exception:
                cleanup["logs"] = False
        holder["key"] = None
        if not cleanup or not all(cleanup.values()):
            state["failure"] = state["failure"] or "CLEANUP_FAILED"
        if state["ok"] and state["failure"] is None and all(cleanup.values()):
            state["status"] = "PASS"
        result = {"status": state["status"], "failure": state["failure"],
                  "admission_controls": state["controls"], "outbound_actual": gate.forwarded if gate is not None else 0,
                  "outbound_denied": gate.denied if gate is not None else 0, "actual_http_status": state["http"],
                  "actual_reply": state["reply"], "actual_reply_bytes": state["reply_bytes"],
                  "actual_reply_sha256": state["sha"], "post_actual_disabled_404": state["after404"],
                  "cleanup": cleanup, "scope": "FORWARD_APP_ONE_SYNTHETIC_REQUEST"}
        payload = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8") + b"\n"
        secrets = secret.encode("utf-8")
        if secrets in payload:
            raise RuntimeError("SECRET_IN_RESULT")
        log_path = root / "appdata" / "logs" / "service.log"
        if log_path.exists() and secrets in log_path.read_bytes():
            raise RuntimeError("SECRET_IN_LOGS")
        with (root / "result.json").open("xb") as handle:
            handle.write(payload)
    return state["status"] == "PASS"
def main() -> None:
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--root", required=True)
        args = parser.parse_args()
        root = prepare_root(args.root)
        secret = read_secret()
        ok = asyncio.run(asyncio.wait_for(execute(root, secret), timeout=150))
        secret = None
        if not ok:
            raise RuntimeError("CONSUMER_FAILED")
    except Exception as exc:
        sys.stderr.write(type(exc).__name__ + "\n")
        raise SystemExit(1) from None
if __name__ == "__main__":
    main()
