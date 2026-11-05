"""所外接入（T40，方案页 docs/plan/evidence/T40/方案.md；用户 2026-10-19 定：全所一把密钥、律师手输一次）。

工作台自带 EasyTier 2.6.4 的 easytier-core，律师打开"所外接入"后随服务起停：
- 不建虚拟网卡（--no-tun），不要管理员权限；把设置里 6000D、395 的所外地址转发到 127.0.0.1 的随机端口
  （--port-forward），再告诉 Net 所外改走这两个本机端口（Net.set_alt_forwards）。
- 接入码（网络密钥）存凭据管理器 / 钥匙串（同律师 Key，Spec 8.1），只写不读回；经环境变量 ET_NETWORK_SECRET
  交给子进程，不上命令行、不写文件。
- easytier-core 启动时会把配置全文（含密钥）打到自己的输出里（T40 实测）：它的 stdout / stderr 一律丢弃，不读、不落盘。
- 设置里的所外地址已经直接连得通（律师自己装的 EasyTier 在跑）时不启动自带的这份，状态记 external。
- 子进程退出后按 2、4、8…60 秒退避重启；服务退出时连同子进程一起结束。
- 日志只记状态和错误代号。
- 开关和本机标识存在 <应用数据>/remote-access.json（服务内部文件，不是共用格式）。
"""
from __future__ import annotations

import json
import os
import pathlib
import secrets
import socket
import subprocess
import sys
import threading
import time

from . import logs, procs
from .config import REPO_ROOT
from .net import LOOPBACK, KINDS, Net

NETWORK_NAME = "lawbench"
RELAY = "tcp://47.107.140.75:11010"           # 律所提供的阿里云中转（deploy/easytier/README.md）
KEYRING_SERVICE = "lawbench/EASYTIER_SECRET"
KEYRING_USER = "lawbench"
STATE_FILE = "remote-access.json"
CORE_NAME = "easytier-core.exe" if os.name == "nt" else "easytier-core"
DEFAULT_CORE_DIR = REPO_ROOT / "tools" / "easytier"   # 安装目录 <install>\tools\easytier\（packaging/build.ps1）
CONNECT_POLL = 2.0
BACKOFF_MAX = 60.0
EXTERNAL_RECHECK = 30.0

# 状态与原因（给设置页显示用；对外接口在契约 1.5 定下之前不开放）
OFF, CONNECTING, CONNECTED, FAILED, EXTERNAL = "off", "connecting", "connected", "failed", "external"
NO_SECRET, MISSING, EXITED, NO_ALT = "no_secret", "missing", "exited", "no_alt_address"


class KeyringSecret:
    """接入码的存取：Windows 凭据管理器 / macOS 钥匙串（keyring）。"""

    def get(self) -> str | None:
        import keyring
        return keyring.get_password(KEYRING_SERVICE, KEYRING_USER)

    def set(self, value: str) -> None:
        import keyring
        keyring.set_password(KEYRING_SERVICE, KEYRING_USER, value)

    def delete(self) -> None:
        import keyring
        from keyring.errors import PasswordDeleteError
        try:
            keyring.delete_password(KEYRING_SERVICE, KEYRING_USER)
        except PasswordDeleteError:
            pass


def free_port() -> int:
    s = socket.socket()
    s.bind((LOOPBACK, 0))
    port = s.getsockname()[1]
    s.close()
    return port


def core_args(core: pathlib.Path | str, hostname: str, rpc_port: int,
              forwards: dict[str, tuple[int, str, int]]) -> list[str]:
    """easytier-core 的命令行（不含密钥）。forwards：{kind: (本机端口, 所外主机, 所外端口)}。"""
    args = [str(core), "--network-name", NETWORK_NAME, "-p", RELAY, "--no-tun", "--dhcp", "--no-listener",
            "--hostname", hostname, "-r", f"{LOOPBACK}:{rpc_port}"]
    for kind in sorted(forwards):
        local, host, port = forwards[kind]
        args += ["--port-forward", f"tcp://{LOOPBACK}:{local}/{host}:{port}"]
    return args


class RemoteAccess:
    def __init__(self, appdata: pathlib.Path, net: Net, *, core_dir: pathlib.Path | None = None,
                 secret_store=None, command=None, port_picker=free_port):
        """command：测试用，代替 [easytier-core 路径]（如 [python, 假程序.py]）。"""
        self.net = net
        self.path = pathlib.Path(appdata) / STATE_FILE
        env_dir = os.environ.get("LB_EASYTIER_DIR")
        self.core = pathlib.Path(core_dir or env_dir or DEFAULT_CORE_DIR) / CORE_NAME
        self.secret = secret_store or KeyringSecret()
        self._command = command
        self._pick = port_picker
        self._lock = threading.Lock()
        self._wake = threading.Event()
        self._stopping = threading.Event()
        self._thread: threading.Thread | None = None
        self._proc: subprocess.Popen | None = None
        self._gen = 0                      # 开关、接入码每变一次加一：正在跑的子进程属于旧的一代就结束重来
        self._state, self._reason = OFF, None
        self._data = self._load()

    # ---------- 开关与接入码 ----------

    def _load(self) -> dict:
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            if isinstance(data, dict) and isinstance(data.get("enabled"), bool) and isinstance(data.get("hostname"), str):
                return data
        except (OSError, ValueError):
            pass
        return {"enabled": False, "hostname": "lb-" + secrets.token_hex(4)}   # 不用 Windows 用户名（N39）

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._data, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, self.path)

    @property
    def enabled(self) -> bool:
        return self._data["enabled"]

    def has_secret(self) -> bool:
        try:
            return bool(self.secret.get())
        except Exception as e:  # noqa: BLE001 凭据管理器读不了：按没有处理
            logs.event("remote", "secret_read", status="fail", error=type(e).__name__)
            return False

    def set_secret(self, value: str) -> None:
        self.secret.set(value)
        logs.event("remote", "secret_set")
        self._restart()

    def clear_secret(self) -> None:
        self.secret.delete()
        logs.event("remote", "secret_clear")
        self._restart()

    def set_enabled(self, on: bool) -> None:
        with self._lock:
            self._data["enabled"] = bool(on)
            self._save()
        logs.event("remote", "enable" if on else "disable")
        self._restart()

    def status(self) -> dict:
        with self._lock:
            return {"enabled": self.enabled, "state": self._state, "reason": self._reason,
                    "has_secret": self.has_secret()}

    # ---------- 起停 ----------

    def start(self) -> None:
        """服务启动时调用；开关没开时什么也不做（线程照样起，等开关）。"""
        if self._thread is None:
            self._stopping.clear()
            self._thread = threading.Thread(target=self._run, name="remote-access", daemon=True)
            self._thread.start()

    def stop(self) -> None:
        """服务退出时调用：结束子进程，所外地址恢复直连。"""
        self._stopping.set()
        self._wake.set()
        if self._thread is not None:
            self._thread.join(timeout=20)
            self._thread = None
        self._kill()

    def servers_changed(self) -> None:
        """设置里的服务器地址变了：按新的所外地址重建端口转发。"""
        self._restart()

    def _restart(self) -> None:
        """开关或接入码变了：结束当前子进程，让监管线程按新状态重来。"""
        with self._lock:
            self._gen += 1
        self._kill()
        self._wake.set()

    def _set(self, state: str, reason: str | None = None) -> None:
        with self._lock:
            changed = (state, reason) != (self._state, self._reason)
            self._state, self._reason = state, reason
        if changed:
            logs.event("remote", "state_" + state, status="fail" if state == FAILED else "ok", error=reason)

    def _kill(self) -> None:
        with self._lock:
            proc, self._proc = self._proc, None
            # 与 _run_once 的最终代际确认/发布共用生命周期锁。Net 不回调 Remote，
            # 因此固定为 Remote → Net；耗时的进程终止仍在锁外。
            self.net.set_alt_forwards(None)
        if proc is not None:
            procs.kill_tree(proc)

    def _wait(self, seconds: float) -> None:
        self._wake.wait(seconds)
        self._wake.clear()

    def _run(self) -> None:
        backoff = 2.0
        while not self._stopping.is_set():
            if not self.enabled:
                self._set(OFF)
                self._wait(3600)
                continue
            if not self.has_secret():
                self._set(FAILED, NO_SECRET)
                self._wait(3600)
                continue
            if self._command is None and not self.core.is_file():
                self._set(FAILED, MISSING)
                self._wait(3600)
                continue
            targets = {k: self.net.alt_target(k) for k in KINDS}
            if not any(targets.values()):
                self._set(FAILED, NO_ALT)
                self._wait(3600)
                continue
            if self._direct_ok():
                self._set(EXTERNAL)
                self._wait(EXTERNAL_RECHECK)
                continue
            if self._run_once({k: v for k, v in targets.items() if v}):
                backoff = 2.0
            if self._stopping.is_set() or not self.enabled:
                continue
            self._wait(backoff)
            backoff = min(backoff * 2, BACKOFF_MAX)

    def _direct_ok(self) -> bool:
        """设置里的所外地址现在就连得通（律师自己的 EasyTier 在跑）。"""
        for kind in KINDS:
            alt = self.net.candidates(kind)[-1]
            if alt[1] == "alternate" and self.net.probe(kind, alt[0]):
                return True
        return False

    def _run_once(self, targets: dict[str, tuple[str, int]]) -> bool:
        """起一次子进程，直到它退出或被要求停下。返回这次是否接通过。"""
        with self._lock:
            gen = self._gen
        forwards = {k: (self._pick(), host, port) for k, (host, port) in targets.items()}
        cmd = core_args(self.core, self._data["hostname"], self._pick(), forwards)
        if self._command is not None:
            cmd = list(self._command) + cmd[1:]
        try:
            secret = self.secret.get()
        except Exception as e:  # noqa: BLE001
            logs.event("remote", "secret_read", status="fail", error=type(e).__name__)
            secret = None
        if not secret:
            self._set(FAILED, NO_SECRET)
            return False
        env = dict(os.environ, ET_NETWORK_SECRET=secret)
        del secret
        self._set(CONNECTING)
        try:
            # 输出里有密钥：丢弃，不读、不落盘
            proc = subprocess.Popen(cmd, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                    stderr=subprocess.DEVNULL, **_no_window(), **procs.own_group())
        except OSError as e:
            self._set(FAILED, MISSING)
            logs.event("remote", "spawn", status="fail", error=type(e).__name__)
            return False
        finally:
            env.pop("ET_NETWORK_SECRET", None)
        with self._lock:
            stale = gen != self._gen or not self.enabled or self._stopping.is_set()
            if not stale:                  # 最终确认与发布必须同属当前代际、当前进程和开启状态
                self._proc = proc
                self.net.set_alt_forwards({k: v[0] for k, v in forwards.items()})
        if stale:                          # 起的同时开关或接入码又变了
            procs.kill_tree(proc)
            return False
        connected = False
        while not self._stopping.is_set() and proc.poll() is None:
            ok = self._forward_ok()
            if ok and not connected:
                connected = True
                self._set(CONNECTED)
            elif not ok and connected:
                connected = False
                self._set(CONNECTING)
            self._wake.wait(CONNECT_POLL)
            with self._lock:
                stale = gen != self._gen or self._proc is not proc
            if self._stopping.is_set() or stale:
                break
            self._wake.clear()             # 不是这一代的事（变化已由 _gen 表达）：清掉，免得空转
        with self._lock:
            mine = self._proc is proc
        if mine:
            self._kill()
        if not self._stopping.is_set() and self.enabled and mine:
            self._set(FAILED, EXITED)
        return connected

    def _forward_ok(self) -> bool:
        for kind in KINDS:
            cands = self.net.candidates(kind)
            if len(cands) > 1 and cands[-1][0].startswith(f"http://{LOOPBACK}:") and self.net.probe(kind, cands[-1][0]):
                return True
        return False


def _no_window() -> dict:
    return {"creationflags": subprocess.CREATE_NO_WINDOW} if sys.platform == "win32" else {}
