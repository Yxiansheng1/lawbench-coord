"""T40 核心 remote_access HTTP 接口的隔离验证。

直接用 Python 运行，不依赖 pytest 收集：
    python tests/test_remote_api.py

契约由 LAWBENCH_T40_CONTRACTS 显式指向冻结 1.5；未提供而当前树也没有该 schema 时直接报错。
应用使用 Starlette TestClient 驱动完整内存 ASGI 栈，RemoteAccess/OcrQueue 在 create_app 前
替换成不会启动线程的 fake。TestClient 不进入上下文，因此不运行 lifespan；不创建监听端口，
不读 Keyring、不启动 EasyTier，也不触碰真实网络。
"""
from __future__ import annotations

import copy
import hashlib
import json as jsonlib
import os
import pathlib
import tempfile
import unittest
from unittest import mock

import httpx
from starlette.testclient import TestClient

from lawbench import app as app_mod
from lawbench import logs
from lawbench.config import REPO_ROOT, Config
from lawbench.errors import fail_body
from lawbench.remote import RemoteAccess
from lawbench.settings import DEFAULTS

TOKEN = "t" * 43
AUTH = {"Authorization": f"Bearer {TOKEN}"}
CONTRACT_SHA256 = "31740171c8024772affe49c7754def9ddbceb8966f75dc2db3678cedf0354d22"
SENSITIVE = "SENSITIVE-CODE-7f3a / SECRET-PATH-CANARY"


def contracts_dir() -> pathlib.Path:
    """冻结依赖优先；未来集成树若已有 endpoint 契约则允许默认目录。"""
    configured = os.environ.get("LAWBENCH_T40_CONTRACTS")
    path = pathlib.Path(configured) if configured else REPO_ROOT / "contracts"
    schema = path / "api" / "remote_access.schema.json"
    if not schema.is_file():
        raise RuntimeError(
            "缺少 remote_access 冻结契约；请把 LAWBENCH_T40_CONTRACTS 指向完整契约 1.5 目录")
    return path


def _refuse_transport(request: httpx.Request) -> httpx.Response:
    raise AssertionError(f"隔离测试不允许任何网络请求：{request.method} {request.url}")


class FakeRemote:
    """只实现 remote_access 路由消费的公开接口，并记录每个动作调用。"""

    def __init__(self) -> None:
        self.enabled = False
        self.code: str | None = None
        self.state = "off"
        self.reason: str | None = None
        self.actions: list[tuple[str, object]] = []
        self.status_calls = 0
        self.status_error: BaseException | None = None
        self.set_error: BaseException | None = None

    def status(self) -> dict:
        self.status_calls += 1
        if self.status_error is not None:
            raise self.status_error
        return {
            "enabled": self.enabled,
            "has_secret": bool(self.code),
            "state": self.state,
            "reason": self.reason,
            "secret": SENSITIVE,
            "path": SENSITIVE,
        }

    def set_enabled(self, value: bool) -> None:
        self.actions.append(("enabled", value))
        if self.set_error is not None:
            raise self.set_error
        self.enabled = value

    def set_secret(self, value: str) -> None:
        self.actions.append(("set_secret", value))
        if self.set_error is not None:
            raise self.set_error
        self.code = value

    def clear_secret(self) -> None:
        self.actions.append(("clear_secret", None))
        if self.set_error is not None:
            raise self.set_error
        self.code = None

    def servers_changed(self) -> None:
        pass

    def start(self) -> None:
        raise AssertionError("测试不得启动 RemoteAccess")

    def stop(self) -> None:
        raise AssertionError("测试不得启动 RemoteAccess")


class FakeOcr:
    """create_app 依赖的惰性后台队列占位；任何线程启停都直接暴露为测试失败。"""

    def __init__(self, *args, **kwargs) -> None:
        pass

    def resume_key_invalid(self) -> None:
        pass

    def start(self) -> None:
        raise AssertionError("测试不得启动 OCR 后台线程")

    def stop(self) -> None:
        raise AssertionError("测试不得启动 OCR 后台线程")


class T40Harness(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory(prefix="t40-core-api-")
        self.addCleanup(self.tmp.cleanup)
        self.appdata = pathlib.Path(self.tmp.name) / "appdata"
        self.appdata.mkdir()
        settings = copy.deepcopy(DEFAULTS)
        settings["servers"] = {
            "llm_base_url": "http://127.0.0.1:9/v1",
            "prep_base_url": "http://127.0.0.1:9",
            "llm_alt_base_url": "http://127.0.0.1:9/v1",
            "prep_alt_base_url": "http://127.0.0.1:9",
        }
        (self.appdata / "settings.json").write_text(
            jsonlib.dumps(settings, ensure_ascii=False), encoding="utf-8")
        self.remote = FakeRemote()
        self.ocr = FakeOcr()
        cfg = Config(
            token=TOKEN,
            appdata=self.appdata,
            contracts_dir=contracts_dir(),
            skills_dirs=[pathlib.Path(self.tmp.name) / "skills"],
            validate_responses=True,
        )
        with mock.patch.object(app_mod, "RemoteAccess", lambda *a, **k: self.remote), \
                mock.patch.object(app_mod, "OcrQueue", lambda *a, **k: self.ocr):
            self.app = app_mod.create_app(
                cfg, key_getter=lambda: None, transport=httpx.MockTransport(_refuse_transport))
        self.addCleanup(self._cleanup)

    def _cleanup(self) -> None:
        logs.close()

    def request(self, method: str, path: str, *, headers=None, params=None, json=None) -> httpx.Response:
        """经真实 TestClient 请求完整内存 ASGI 栈，不运行 lifespan。"""
        client = TestClient(self.app, raise_server_exceptions=False, backend="asyncio")
        try:
            return client.request(
                method,
                path,
                headers=AUTH if headers is None else headers,
                params=params,
                json=json,
            )
        finally:
            client.close()

    def get(self, path: str, **kwargs) -> httpx.Response:
        return self.request("GET", path, **kwargs)

    def post(self, payload):
        return self.request("POST", "/api/remote_access", json=payload)


class RemoteApiTests(T40Harness):
    def test_frozen_contract_identity(self) -> None:
        path = contracts_dir() / "api" / "remote_access.schema.json"
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.assertEqual(digest, CONTRACT_SHA256)
        self.assertEqual((path.parents[1] / "VERSION").read_text(encoding="utf-8").strip(), "1.5")

    def test_auth_401_empty_and_no_backend_action(self) -> None:
        for method, path, kwargs in [
            ("GET", "/api/remote_access", {}),
            ("POST", "/api/remote_access", {"json": {"enabled": True}}),
        ]:
            with self.subTest(method=method):
                r = self.request(method, path, headers={"Authorization": ""}, **kwargs)
                self.assertEqual(r.status_code, 401)
                self.assertEqual(r.content, b"")
        self.assertEqual(self.remote.actions, [])
        self.assertEqual(self.remote.status_calls, 0)

    def test_get_states_reasons_and_four_key_projection(self) -> None:
        cases = [
            ("off", None, None),
            ("connecting", None, None),
            ("connected", None, None),
            ("external", None, None),
            ("failed", "no_secret", "NO_CODE"),
            ("failed", "missing", "START_FAILED"),
            ("failed", "exited", "PROCESS_EXITED"),
            ("failed", "no_alt_address", "NO_REMOTE_ADDRESS"),
        ]
        for state, internal, expected in cases:
            with self.subTest(state=state, reason=internal):
                self.remote.enabled = True
                self.remote.code = "present"
                self.remote.state = state
                self.remote.reason = internal
                r = self.get("/api/remote_access")
                self.assertEqual(r.status_code, 200, r.text)
                self.assertEqual(r.json(), {
                    "ok": True,
                    "value": {
                        "enabled": True,
                        "has_code": True,
                        "state": state,
                        "reason": expected,
                    },
                })
                self.assertNotIn(SENSITIVE, r.text)

    def test_post_each_action_once_and_preserves_other_fact(self) -> None:
        code = "  " + ("x" * 508) + "  "
        self.assertEqual(len(code), 512)

        r = self.post({"code": code})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["value"], {
            "enabled": False, "has_code": True, "state": "off", "reason": None})
        self.assertEqual(self.remote.actions, [("set_secret", code)])
        self.assertEqual(self.remote.code, code)
        self.assertFalse(self.remote.enabled)

        self.remote.actions.clear()
        r = self.post({"enabled": True})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["value"], {
            "enabled": True, "has_code": True, "state": "off", "reason": None})
        self.assertEqual(self.remote.actions, [("enabled", True)])
        self.assertEqual(self.remote.code, code)

        self.remote.actions.clear()
        r = self.post({"code": None})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["value"], {
            "enabled": True, "has_code": False, "state": "off", "reason": None})
        self.assertEqual(self.remote.actions, [("clear_secret", None)])
        self.assertTrue(self.remote.enabled)
        self.assertIsNone(self.remote.code)

        self.remote.actions.clear()
        r = self.post({"enabled": False})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["value"], {
            "enabled": False, "has_code": False, "state": "off", "reason": None})
        self.assertEqual(self.remote.actions, [("enabled", False)])
        self.assertIsNone(self.remote.code)

    def test_invalid_shapes_and_code_bounds_have_no_side_effect(self) -> None:
        invalid = [
            {},
            {"enabled": True, "code": "x"},
            {"code": "x", "extra": 1},
            {"enabled": "true"},
            {"enabled": None},
            {"code": 1},
            {"code": {}},
            {"code": []},
            {"code": ""},
            {"code": "x" * 513},
        ]
        for payload in invalid:
            with self.subTest(payload=payload):
                self.remote.enabled = True
                self.remote.code = "keep"
                self.remote.actions.clear()
                r = self.post(payload)
                self.assertEqual(r.status_code, 200, r.text)
                self.assertEqual(r.json(), fail_body("INVALID_ARGUMENT"))
                self.assertEqual(self.remote.actions, [])
                self.assertTrue(self.remote.enabled)
                self.assertEqual(self.remote.code, "keep")

    def test_crlf_guard_blocks_without_side_effect(self) -> None:
        """现有 C 校验器会放过 pattern 中 $ 前的换行；本测试必须由路由局部 guard 守住。"""
        lines = [
            "\rfirst",
            "\nfirst",
            "a\rb",
            "a\nb",
            "a\r\nb",
            "last\r",
            "last\n",
            "last\r\n",
        ]
        for code in lines:
            with self.subTest(code=repr(code)):
                self.remote.code = "keep"
                self.remote.actions.clear()
                r = self.post({"code": code})
                self.assertEqual(r.status_code, 200, r.text)
                self.assertEqual(r.json(), fail_body("INVALID_ARGUMENT"))
                self.assertEqual(self.remote.actions, [])
                self.assertEqual(self.remote.code, "keep")

    def test_get_query_rejected_before_status_read(self) -> None:
        self.remote.actions.clear()
        self.remote.status_calls = 0
        r = self.get("/api/remote_access", params={"extra": "1"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), fail_body("INVALID_ARGUMENT"))
        self.assertEqual(self.remote.actions, [])
        self.assertEqual(self.remote.status_calls, 0)

    def test_internal_errors_are_fixed_and_do_not_log_canary(self) -> None:
        path = pathlib.Path(self.tmp.name) / "secret-path-canary" / "state.json"
        self.remote.status_error = RuntimeError(f"{SENSITIVE} {path}")
        r = self.get("/api/remote_access")
        self.assertEqual(r.status_code, 500)
        self.assertEqual(r.json(), fail_body("INTERNAL"))
        self.assertNotIn(SENSITIVE, r.text)
        self.assertNotIn(str(path), r.text)

        self.remote.status_error = None
        self.remote.set_error = RuntimeError(f"{SENSITIVE} {path}")
        r = self.post({"code": SENSITIVE})
        self.assertEqual(r.status_code, 500)
        self.assertEqual(r.json(), fail_body("INTERNAL"))
        self.assertNotIn(SENSITIVE, r.text)
        self.assertNotIn(str(path), r.text)

        logs.close()
        log_path = self.appdata / "logs" / "service.log"
        self.assertTrue(log_path.is_file())
        text = log_path.read_text(encoding="utf-8")
        self.assertNotIn(SENSITIVE, text)
        self.assertNotIn(str(path), text)

    def test_adjacent_settings_and_health_do_not_regress(self) -> None:
        health = self.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json(), {"status": "ok", "contract_version": "1.5"})
        settings = self.get("/api/settings")
        self.assertEqual(settings.status_code, 200)
        self.assertTrue(settings.json()["ok"])
        self.assertEqual(settings.json()["value"]["servers"], {
            "llm_base_url": "http://127.0.0.1:9/v1",
            "prep_base_url": "http://127.0.0.1:9",
            "llm_alt_base_url": "http://127.0.0.1:9/v1",
            "prep_alt_base_url": "http://127.0.0.1:9",
        })


class _MemSecret:
    def __init__(self) -> None:
        self.value: str | None = None

    def get(self) -> str | None:
        return self.value

    def set(self, value: str) -> None:
        self.value = value

    def delete(self) -> None:
        self.value = None


class _LazyNet:
    def __init__(self) -> None:
        self.forward_updates: list[object] = []

    def set_alt_forwards(self, value) -> None:
        self.forward_updates.append(value)

    def alt_target(self, kind):
        raise AssertionError("不得开始探测所外地址")

    def candidates(self, kind):
        raise AssertionError("不得开始探测所外地址")

    def probe(self, kind, base):
        raise AssertionError("不得开始探测所外地址")


class RealRemotePersistenceTests(unittest.TestCase):
    def test_enabled_persists_without_starting_sidebar(self) -> None:
        with tempfile.TemporaryDirectory(prefix="t40-remote-state-") as tmp:
            root = pathlib.Path(tmp)
            logs.setup(root)
            try:
                net = _LazyNet()
                store = _MemSecret()
                first = RemoteAccess(root, net, secret_store=store, command=["not-started"])
                first.set_enabled(True)
                self.assertTrue(first.enabled)
                self.assertIsNone(first._thread)
                self.assertIsNone(first._proc)
                self.assertEqual(net.forward_updates, [None])

                second = RemoteAccess(root, _LazyNet(), secret_store=store, command=["not-started"])
                self.assertTrue(second.enabled)
                self.assertIsNone(second._thread)
                second.set_enabled(False)
                self.assertFalse(second.enabled)
            finally:
                logs.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
