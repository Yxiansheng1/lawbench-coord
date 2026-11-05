"""Root-only full-regression safety bootstrap for the lawbench service.

This file is a reviewed source artifact, not test evidence.  The root operator
runs it in a fresh private directory.  It replaces the process environment,
keyring access, network access, filesystem mutation, and subprocess creation
with fail-closed guards before importing pytest or any product module.

The only deliberately omitted original test file is tests/test_t37_refs.py.
Its standalone evidence remains the accepted source for that surface.
"""

from __future__ import annotations

import argparse
import builtins
import ipaddress
import json
import os
import pathlib
import shutil
import socket
import stat
import subprocess
import sys
import tempfile
import threading
import time
import types
from collections import defaultdict
from collections.abc import Mapping, Sequence
from urllib.parse import unquote, urlparse


FIXED_SOURCE = pathlib.Path(r"D:\Lawbeach\lawbench-B\service")
EXCLUDED_TEST = FIXED_SOURCE / "tests" / "test_t37_refs.py"
REPO_ROOT = FIXED_SOURCE.parent
ENGINES_ROOT = REPO_ROOT / "engines"

PRIVATE_ENV_NAMES = (
    "HOME",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "TEMP",
    "TMP",
    "TMPDIR",
)

SAFE_ENV_NAMES = (
    "ALLUSERSPROFILE",
    "COMSPEC",
    "LANG",
    "LC_ALL",
    "NUMBER_OF_PROCESSORS",
    "OS",
    "PATH",
    "PATHEXT",
    "PROCESSOR_ARCHITECTURE",
    "PROCESSOR_IDENTIFIER",
    "ProgramData",
    "ProgramFiles",
    "ProgramFiles(x86)",
    "ProgramW6432",
    "SYSTEMDRIVE",
    "SYSTEMROOT",
    "SystemRoot",
    "WINDIR",
)

INLINE_PYTHON = {
    "import time; time.sleep(120)",
    "import time; time.sleep(600)",
    "import sys; print(sys.flags.no_user_site)",
}

SYNTHETIC_SCRIPT_NAMES = {"invoke.py", "kill.py", "peak.py"}
CREDENTIAL_WORDS = (
    "PASSWORD",
    "PASSWD",
    "SECRET",
    "TOKEN",
    "API_KEY",
    "ACCESS_KEY",
    "PRIVATE_KEY",
    "CREDENTIAL",
    "AUTHORIZATION",
    "COOKIE",
)


class SafetyBlocked(RuntimeError):
    """A test-environment safety boundary refused an operation."""


class DenialCounters:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counts: dict[str, int] = defaultdict(int)

    def hit(self, category: str) -> None:
        with self._lock:
            self._counts[category] += 1

    def snapshot(self) -> dict:
        with self._lock:
            categories = dict(sorted(self._counts.items()))
        return {
            "total": sum(categories.values()),
            "categories": categories,
        }


def _die(message: str) -> None:
    raise SystemExit(f"SAFETY_BOOTSTRAP: {message}")


def _norm(path: object) -> pathlib.Path:
    if isinstance(path, int):
        raise TypeError("file descriptor is not a path")
    raw = os.fsdecode(os.fspath(path))  # type: ignore[arg-type]
    if raw.startswith("\\\\?\\UNC\\"):
        raw = "\\\\" + raw[8:]
    elif raw.startswith("\\\\?\\"):
        raw = raw[4:]
    return pathlib.Path(os.path.abspath(raw))


def _resolved(path: object, *, strict: bool = False) -> pathlib.Path:
    return _norm(path).resolve(strict=strict)


def _is_exact_os_null_device(path: object) -> bool:
    if isinstance(path, int):
        return False
    try:
        raw = os.fsdecode(os.fspath(path))
    except (TypeError, ValueError):
        return False
    if os.name == "nt":
        if "/" in raw or "\\" in raw or not raw.isascii():
            return False
        return raw.casefold() == os.devnull.casefold()
    return raw == os.devnull


def _strict_child(root: pathlib.Path, candidate: pathlib.Path) -> bool:
    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    return os.path.normcase(str(candidate)) != os.path.normcase(str(root))


def _is_loopback_host(host: object) -> bool:
    if isinstance(host, bytes):
        host = host.decode("ascii", "strict")
    if not isinstance(host, str) or not host:
        return False
    value = host.strip().casefold()
    if value == "localhost":
        return True
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1]
    try:
        return ipaddress.ip_address(value).is_loopback
    except ValueError:
        return False


def _address_host(address: object) -> object:
    if isinstance(address, tuple) and address:
        return address[0]
    return address


def _private_environment(root: pathlib.Path) -> dict[str, str]:
    paths = {
        "HOME": root / "home",
        "USERPROFILE": root / "home",
        "APPDATA": root / "appdata",
        "LOCALAPPDATA": root / "localappdata",
        "TEMP": root / "temp",
        "TMP": root / "temp",
        "TMPDIR": root / "temp",
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)

    env = {name: os.environ[name] for name in SAFE_ENV_NAMES if os.environ.get(name)}
    env.update({name: str(path) for name, path in paths.items()})
    env.update(
        {
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONIOENCODING": "utf-8",
            "PYTHONNOUSERSITE": "1",
            "PYTHONUTF8": "1",
            "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1",
            "XDG_CACHE_HOME": str(root / "xdg-cache"),
            "XDG_CONFIG_HOME": str(root / "xdg-config"),
            "XDG_DATA_HOME": str(root / "xdg-data"),
            "HF_HOME": str(root / "hf-home"),
            "MPLCONFIGDIR": str(root / "mpl-config"),
            "NUMBA_CACHE_DIR": str(root / "numba-cache"),
            "SQLITE_TMPDIR": str(root / "temp"),
        }
    )
    for name in ("XDG_CACHE_HOME", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "HF_HOME", "MPLCONFIGDIR", "NUMBA_CACHE_DIR"):
        pathlib.Path(env[name]).mkdir(parents=True, exist_ok=True)
    return env


def _install_fs_guard(root: pathlib.Path, counters: DenialCounters) -> None:
    fd_paths: dict[int, pathlib.Path] = {}
    null_device_fds: set[int] = set()
    fd_lock = threading.Lock()

    def deny(category: str, reason: str = "path_outside_private_root") -> None:
        counters.hit(category)
        raise SafetyBlocked(f"FS_{category.upper()}_DENIED:{reason}")

    def path_for_event(path: object, category: str) -> pathlib.Path:
        if isinstance(path, int):
            with fd_lock:
                known = fd_paths.get(path)
            if known is None:
                deny(category, "untracked_file_descriptor")
            return known
        if not os.path.isabs(os.fspath(path)):  # type: ignore[arg-type]
            deny(category, "relative_path")
        try:
            resolved = _resolved(path)
        except (OSError, RuntimeError, ValueError):
            deny(category, "unresolvable_path")
        if not _strict_child(root, resolved):
            deny(category)
        return resolved

    def writable_flags(flags: object) -> bool:
        if not isinstance(flags, int):
            return False
        write_bits = (
            os.O_WRONLY
            | os.O_RDWR
            | os.O_CREAT
            | os.O_TRUNC
            | os.O_APPEND
            | getattr(os, "O_TMPFILE", 0)
        )
        return bool(flags & write_bits)

    def writable_mode(mode: object) -> bool:
        return isinstance(mode, str) and any(ch in mode for ch in "wax+")

    def audit(event: str, args: tuple) -> None:
        if event == "open":
            path = args[0] if args else None
            mode = args[1] if len(args) > 1 else None
            flags = args[2] if len(args) > 2 else None
            if writable_mode(mode) or writable_flags(flags):
                if _is_exact_os_null_device(path):
                    return
                path_for_event(path, "write")
            return
        one_path = {
            "os.remove",
            "os.rmdir",
            "os.mkdir",
            "os.truncate",
            "os.chmod",
            "os.chown",
            "os.utime",
            "os.removexattr",
            "os.setxattr",
        }
        if event in one_path:
            if not args:
                deny("delete" if event in {"os.remove", "os.rmdir"} else "write", "missing_path")
            category = "delete" if event in {"os.remove", "os.rmdir"} else "write"
            path_for_event(args[0], category)
            return
        if event == "os.rename":
            if len(args) < 2:
                deny("rename", "missing_path")
            path_for_event(args[0], "rename")
            path_for_event(args[1], "rename")
            return
        if event in {"os.link", "os.symlink"}:
            targets = args[:2]
            if len(targets) < 2:
                deny("write", "missing_path")
            for target in targets:
                path_for_event(target, "write")

    sys.addaudithook(audit)

    real_os_open = os.open
    real_os_close = os.close
    real_os_write = os.write
    real_os_dup = os.dup
    real_os_dup2 = os.dup2
    real_ftruncate = getattr(os, "ftruncate", None)
    real_writev = getattr(os, "writev", None)
    real_pwrite = getattr(os, "pwrite", None)

    def guarded_open(path, flags, mode=0o777, *, dir_fd=None):
        if writable_flags(flags):
            if dir_fd is not None:
                deny("write", "dir_fd")
            if not _is_exact_os_null_device(path):
                path_for_event(path, "write")
        fd = real_os_open(path, flags, mode, dir_fd=dir_fd)
        if writable_flags(flags):
            with fd_lock:
                if _is_exact_os_null_device(path):
                    null_device_fds.add(fd)
                else:
                    fd_paths[fd] = _resolved(path)
        return fd

    def guarded_close(fd):
        try:
            return real_os_close(fd)
        finally:
            with fd_lock:
                fd_paths.pop(fd, None)
                null_device_fds.discard(fd)

    def check_write_fd(fd: int) -> None:
        if fd in (1, 2):
            return
        with fd_lock:
            known = fd_paths.get(fd)
            null_device = fd in null_device_fds
        if known is not None or null_device:
            return
        try:
            mode = os.fstat(fd).st_mode
        except OSError:
            deny("write", "invalid_file_descriptor")
        if stat.S_ISREG(mode) or stat.S_ISDIR(mode):
            deny("write", "untracked_regular_file_descriptor")

    def guarded_write(fd, data):
        check_write_fd(fd)
        return real_os_write(fd, data)

    def guarded_dup(fd):
        result = real_os_dup(fd)
        with fd_lock:
            if fd in fd_paths:
                fd_paths[result] = fd_paths[fd]
            elif fd in null_device_fds:
                null_device_fds.add(result)
        return result

    def guarded_dup2(fd, fd2, inheritable=True):
        result = real_os_dup2(fd, fd2, inheritable=inheritable)
        with fd_lock:
            fd_paths.pop(fd2, None)
            null_device_fds.discard(fd2)
            if fd in fd_paths:
                fd_paths[fd2] = fd_paths[fd]
            elif fd in null_device_fds:
                null_device_fds.add(fd2)
        return result

    os.open = guarded_open
    os.close = guarded_close
    os.write = guarded_write
    os.dup = guarded_dup
    os.dup2 = guarded_dup2
    if real_writev is not None:
        def guarded_writev(fd, buffers):
            check_write_fd(fd)
            return real_writev(fd, buffers)
        os.writev = guarded_writev
    if real_pwrite is not None:
        def guarded_pwrite(fd, data, offset):
            check_write_fd(fd)
            return real_pwrite(fd, data, offset)
        os.pwrite = guarded_pwrite
    if real_ftruncate is not None:
        def guarded_ftruncate(fd, length):
            check_write_fd(fd)
            return real_ftruncate(fd, length)
        os.ftruncate = guarded_ftruncate


def _install_network_guard(counters: DenialCounters) -> None:
    real_connect = socket.socket.connect
    real_connect_ex = socket.socket.connect_ex
    real_bind = socket.socket.bind
    real_sendto = socket.socket.sendto
    real_create_connection = socket.create_connection
    real_getaddrinfo = socket.getaddrinfo
    real_gethostbyname = socket.gethostbyname
    real_gethostbyname_ex = socket.gethostbyname_ex
    real_getnameinfo = socket.getnameinfo

    def deny(operation: str) -> None:
        counters.hit("network")
        raise SafetyBlocked(f"NETWORK_DENIED:{operation}")

    def guarded_connect(self, address):
        if not _is_loopback_host(_address_host(address)):
            deny("connect")
        return real_connect(self, address)

    def guarded_connect_ex(self, address):
        if not _is_loopback_host(_address_host(address)):
            deny("connect_ex")
        return real_connect_ex(self, address)

    def guarded_bind(self, address):
        if not _is_loopback_host(_address_host(address)):
            deny("bind")
        return real_bind(self, address)

    def guarded_sendto(self, data, *args):
        address = args[-1] if args else None
        if not _is_loopback_host(_address_host(address)):
            deny("sendto")
        return real_sendto(self, data, *args)

    def guarded_create_connection(address, *args, **kwargs):
        if not _is_loopback_host(_address_host(address)):
            deny("create_connection")
        return real_create_connection(address, *args, **kwargs)

    def guarded_getaddrinfo(host, *args, **kwargs):
        if not _is_loopback_host(host):
            deny("getaddrinfo")
        return real_getaddrinfo(host, *args, **kwargs)

    def guarded_gethostbyname(host):
        if not _is_loopback_host(host):
            deny("gethostbyname")
        return real_gethostbyname(host)

    def guarded_gethostbyname_ex(host):
        if not _is_loopback_host(host):
            deny("gethostbyname_ex")
        return real_gethostbyname_ex(host)

    def guarded_getnameinfo(sockaddr, flags):
        if not _is_loopback_host(_address_host(sockaddr)):
            deny("getnameinfo")
        return real_getnameinfo(sockaddr, flags)

    socket.socket.connect = guarded_connect
    socket.socket.connect_ex = guarded_connect_ex
    socket.socket.bind = guarded_bind
    socket.socket.sendto = guarded_sendto
    socket.create_connection = guarded_create_connection
    socket.getaddrinfo = guarded_getaddrinfo
    socket.gethostbyname = guarded_gethostbyname
    socket.gethostbyname_ex = guarded_gethostbyname_ex
    socket.getnameinfo = guarded_getnameinfo


def _install_keyring_guard(counters: DenialCounters) -> None:
    def deny(*_args, **_kwargs):
        counters.hit("keyring")
        raise SafetyBlocked("KEYRING_DENIED")

    class DeniedKeyring:
        get_password = staticmethod(deny)
        set_password = staticmethod(deny)
        delete_password = staticmethod(deny)
        get_credential = staticmethod(deny)

    try:
        import keyring  # imported only after the filesystem and network guards
        import keyring.core
    except Exception:
        keyring = types.ModuleType("keyring")
        core = types.ModuleType("keyring.core")
        keyring.core = core
        sys.modules["keyring"] = keyring
        sys.modules["keyring.core"] = core
    else:
        core = keyring.core

    denied_backend = DeniedKeyring()
    for module in (keyring, core):
        module.get_password = deny
        module.set_password = deny
        module.delete_password = deny
        if hasattr(module, "get_credential"):
            module.get_credential = deny
        if hasattr(module, "get_keyring"):
            module.get_keyring = lambda: denied_backend


def _environment_is_private(env: Mapping[str, str], root: pathlib.Path) -> bool:
    for name in PRIVATE_ENV_NAMES:
        if name not in env:
            continue
        value = env[name]
        if not value or not os.path.isabs(value):
            return False
        try:
            resolved = _resolved(value)
        except (OSError, RuntimeError, ValueError):
            return False
        if resolved != root and not _strict_child(root, resolved):
            return False
    return True


def _environment_has_prohibited_values(env: Mapping[str, str]) -> bool:
    for name, value in env.items():
        upper = name.upper()
        if not value:
            continue
        if upper == "KEY" or upper.endswith("_KEY"):
            return True
        if upper in {"HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY"} or upper.endswith("_PROXY"):
            return True
        if any(word in upper for word in CREDENTIAL_WORDS):
            return True
    return False


def _install_process_guard(root: pathlib.Path, counters: DenialCounters) -> None:
    real_popen = subprocess.Popen
    owned: dict[int, subprocess.Popen] = {}
    owned_lock = threading.Lock()

    def deny(reason: str) -> None:
        counters.hit("subprocess")
        raise SafetyBlocked(f"SUBPROCESS_DENIED:{reason}")

    def resolved_program(name: str | os.PathLike[str]) -> pathlib.Path:
        raw = os.fsdecode(os.fspath(name))
        found = shutil.which(raw) if not os.path.isabs(raw) else raw
        if not found:
            deny("program_not_found")
        try:
            return _resolved(found)
        except (OSError, RuntimeError, ValueError):
            deny("program_unresolvable")

    def is_under(path: pathlib.Path, parent: pathlib.Path) -> bool:
        return path == parent or _strict_child(parent, path)

    def validate_env(env: Mapping[str, str] | None) -> None:
        actual = dict(os.environ if env is None else env)
        if _environment_has_prohibited_values(actual):
            deny("credential_or_proxy_environment")
        if not _environment_is_private(actual, root):
            deny("non_private_runtime_environment")
        pythonpath = actual.get("PYTHONPATH")
        if pythonpath:
            for item in pythonpath.split(os.pathsep):
                if not item:
                    continue
                try:
                    path = _resolved(item)
                except (OSError, RuntimeError, ValueError):
                    deny("pythonpath_unresolvable")
                if path != FIXED_SOURCE and not is_under(path, root):
                    deny("pythonpath_outside_private_root")

    def validate_private_args(arguments: Sequence[str]) -> None:
        for value in arguments:
            path = pathlib.Path(value)
            if not path.is_absolute():
                continue
            try:
                resolved = _resolved(value)
            except (OSError, RuntimeError, ValueError):
                deny("argument_unresolvable")
            if resolved != FIXED_SOURCE and not is_under(resolved, root):
                deny("argument_outside_private_root")

    def authorize_python(arguments: Sequence[str]) -> bool:
        if not arguments:
            deny("python_without_arguments")
        if arguments[0] == "-c":
            if len(arguments) != 2 or arguments[1] not in INLINE_PYTHON:
                deny("python_inline_code")
            return True
        if arguments[0] == "-m":
            deny("python_module")
        script = _resolved(arguments[0])
        if script == (FIXED_SOURCE / "tests" / "fake_com_worker.py"):
            validate_private_args(arguments[1:])
            return True
        if is_under(script, root) and script.name in SYNTHETIC_SCRIPT_NAMES:
            if script.name == "invoke.py" and script.parent.name != "scripts":
                deny("synthetic_invoke_outside_scripts")
            validate_private_args(arguments[1:])
            return True
        if is_under(script, ENGINES_ROOT):
            deny("source_engine")
        deny("python_script")

    def authorize_batch(program: pathlib.Path) -> None:
        if not is_under(program, root):
            deny("batch_outside_private_root")
        if program.name == "fake_soffice.cmd":
            try:
                text = program.read_text(encoding="mbcs")
            except (LookupError, OSError, UnicodeError):
                deny("batch_unreadable")
            marker = f'@"{sys.executable}" "'
            if not text.startswith(marker) or not text.endswith('" %*\r\n'):
                deny("batch_shape")
            script = pathlib.Path(text[len(marker):].split('"', 1)[0])
            if script.name != "fake_soffice.py" or not is_under(_resolved(script), root):
                deny("batch_script")
            return
        if program.name == "crash.cmd":
            try:
                text = program.read_text(encoding="mbcs")
            except (LookupError, OSError, UnicodeError):
                deny("batch_unreadable")
            expected = f'@"{sys.executable}" -c "import sys; sys.exit(-1073740791)"\r\n'
            if text != expected:
                deny("batch_shape")
            return
        deny("batch_executable")

    def authorize_soffice(program: pathlib.Path, arguments: Sequence[str]) -> None:
        allowed = {
            _resolved(pathlib.Path(r"C:\Program Files\LibreOffice\program\soffice.exe")),
            _resolved(pathlib.Path(r"C:\Program Files (x86)\LibreOffice\program\soffice.exe")),
        }
        if program not in allowed:
            deny("soffice_path")
        lowered = [value.casefold() for value in arguments]
        if "--headless" not in lowered or "--convert-to" not in lowered or "--outdir" not in lowered:
            deny("soffice_arguments")
        if any(value in {"--print-to-file", "--pt", "-p", "--printer-name"} for value in lowered):
            deny("soffice_print")
        profile_roots = [value for value in arguments if value.startswith("-env:UserInstallation=")]
        if len(profile_roots) != 1:
            deny("soffice_profile")
        profile = pathlib.Path(unquote(urlparse(profile_roots[0].split("=", 1)[1]).path))
        if not is_under(_resolved(profile), root):
            deny("soffice_profile_outside_root")
        outdir_index = lowered.index("--outdir")
        if outdir_index + 1 >= len(arguments) or not is_under(_resolved(arguments[outdir_index + 1]), root):
            deny("soffice_outdir")
        if not arguments or not is_under(_resolved(arguments[-1]), root):
            deny("soffice_input")

    def authorize_pandoc(program: pathlib.Path, arguments: Sequence[str]) -> None:
        candidates = {
            _resolved(pathlib.Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Pandoc" / "pandoc.exe"),
            _resolved(pathlib.Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Pandoc" / "pandoc.exe"),
        }
        if program not in candidates:
            deny("pandoc_path")
        if "-o" not in arguments or arguments[arguments.index("-o") + 1 : arguments.index("-o") + 2] != ["-"]:
            deny("pandoc_output")
        if "-f" not in arguments or "-t" not in arguments:
            deny("pandoc_formats")
        if any(value.startswith("--lua-filter") or value.startswith("--pdf-engine") for value in arguments):
            deny("pandoc_executable_extension")

    def authorize_system_tool(program: pathlib.Path, arguments: Sequence[str], cwd: pathlib.Path | None):
        system32 = _resolved(pathlib.Path(os.environ["SYSTEMROOT"]) / "System32")
        if program.name.casefold() == "tasklist.exe":
            if program.parent != system32:
                deny("tasklist_path")
            if len(arguments) != 3 or arguments[0].casefold() != "/fi" \
                    or not arguments[1].casefold().startswith("pid eq ") \
                    or not arguments[1][-1:].isdigit() \
                    or arguments[2].casefold() != "/nh":
                deny("tasklist_arguments")
            return
        if program.name.casefold() == "taskkill.exe":
            if program.parent != system32:
                deny("taskkill_path")
            lowered = [value.casefold() for value in arguments]
            if len(arguments) != 4 or lowered.count("/t") != 1 \
                    or lowered.count("/f") != 1 or lowered.count("/pid") != 1:
                deny("taskkill_arguments")
            pid_index = lowered.index("/pid")
            if pid_index + 1 >= len(arguments):
                deny("taskkill_arguments")
            pid_text = arguments[pid_index + 1]
            if not pid_text.isascii() or not pid_text.isdecimal():
                deny("taskkill_pid")
            try:
                pid = int(pid_text)
            except ValueError:
                deny("taskkill_pid")
            if pid <= 0:
                deny("taskkill_pid")
            with owned_lock:
                proc = owned.get(pid)
            if proc is None or proc.poll() is not None:
                deny("taskkill_not_owned")
            return
        if program.name.casefold() == "git.exe":
            if cwd is None or _resolved(cwd) != REPO_ROOT:
                deny("git_cwd")
            valid_paths = {
                _resolved(pathlib.Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Git" / "cmd" / "git.exe"),
                _resolved(pathlib.Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Git" / "bin" / "git.exe"),
                _resolved(pathlib.Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Git" / "cmd" / "git.exe"),
            }
            if program not in valid_paths:
                deny("git_path")
            if list(arguments) != ["check-ignore", "service/lawbench/llm/tokenizer.json"]:
                deny("git_command")
            return
        deny("system_tool")

    def authorize(args, kwargs) -> tuple[object, pathlib.Path | None]:
        if kwargs.get("shell"):
            deny("shell")
        for forbidden in ("user", "group", "extra_groups", "umask", "preexec_fn"):
            if kwargs.get(forbidden) is not None:
                deny("privilege_option")
        validate_env(kwargs.get("env"))
        cwd = kwargs.get("cwd")
        cwd_path = _resolved(cwd) if cwd is not None else None

        if isinstance(args, (str, bytes, os.PathLike)):
            deny("command_string")
        command = list(args)
        if not command:
            deny("empty_command")
        program = resolved_program(kwargs.get("executable") or command[0])
        arguments = [os.fsdecode(value) if isinstance(value, os.PathLike) else str(value) for value in command[1:]]

        if is_under(program, ENGINES_ROOT):
            deny("source_engine")
        if program.name.casefold() in {"cmd.exe", "powershell.exe", "pwsh.exe", "bash.exe", "sh.exe", "wmic.exe"}:
            deny("shell")
        if program.suffix.casefold() in {".cmd", ".bat"}:
            authorize_batch(program)
        elif program == _resolved(pathlib.Path(sys.executable)):
            authorize_python(arguments)
        else:
            lower_name = program.name.casefold()
            if lower_name in {"soffice.exe", "soffice.com"}:
                authorize_soffice(program, arguments)
            elif lower_name == "pandoc.exe":
                authorize_pandoc(program, arguments)
            elif lower_name in {"tasklist.exe", "taskkill.exe", "git.exe"}:
                authorize_system_tool(program, arguments, cwd_path)
            else:
                deny("unlisted_executable")
        command[0] = str(program)
        return command, program

    class GuardedPopen(real_popen):
        def __init__(self, args, *popen_args, **kwargs):
            guarded_args, _program = authorize(args, kwargs)
            super().__init__(guarded_args, *popen_args, **kwargs)
            with owned_lock:
                owned[self.pid] = self

    subprocess.Popen = GuardedPopen

    def denied_process_api(*_args, **_kwargs):
        deny("unwrapped_process_api")

    for name in (
        "system",
        "popen",
        "spawnl",
        "spawnle",
        "spawnlp",
        "spawnlpe",
        "spawnv",
        "spawnve",
        "spawnvp",
        "spawnvpe",
        "posix_spawn",
        "posix_spawnp",
        "execv",
        "execve",
        "execvp",
        "execvpe",
        "startfile",
    ):
        if hasattr(os, name):
            setattr(os, name, denied_process_api)


def _write_summary(path: pathlib.Path, payload: dict) -> None:
    text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    with builtins.open(path, "w", encoding="utf-8", newline="\n") as stream:
        stream.write(text)
        stream.flush()
        os.fsync(stream.fileno())


def _parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Root-only lawbench safety bootstrap")
    parser.add_argument("--private-root", required=True)
    parser.add_argument("--junit", required=True)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(sys.argv[1:] if argv is None else argv)
    source = FIXED_SOURCE.resolve(strict=True)
    if os.path.normcase(str(source)) != os.path.normcase(str(FIXED_SOURCE.resolve(strict=True))):
        _die("source_path_changed")
    tests_dir = source / "tests"
    if not tests_dir.is_dir() or not EXCLUDED_TEST.is_file():
        _die("fixed_test_layout_missing")

    raw_root = pathlib.Path(args.private_root)
    if not raw_root.is_absolute() or not raw_root.is_dir():
        _die("private_root_must_be_an_existing_absolute_directory")
    root = raw_root.resolve(strict=True)
    if any(root.iterdir()):
        _die("private_root_must_be_fresh")

    junit_input = pathlib.Path(args.junit)
    if not junit_input.is_absolute():
        _die("junit_must_be_absolute")
    junit = _resolved(junit_input)
    if not _strict_child(root, junit) or junit.name == "root-summary.json":
        _die("junit_must_be_a_child_of_private_root")
    if junit.exists():
        _die("junit_must_not_already_exist")
    junit.parent.mkdir(parents=True, exist_ok=True)

    basetemp = root / "pytest-basetemp"
    if basetemp.exists():
        _die("private_basetemp_must_not_already_exist")

    safe_env = _private_environment(root)
    os.environ.clear()
    os.environ.update(safe_env)
    tempfile.tempdir = str(root / "temp")
    os.chdir(source)
    sys.path.insert(0, str(source))

    counters = DenialCounters()
    _install_fs_guard(root, counters)
    _install_network_guard(counters)
    _install_keyring_guard(counters)
    _install_process_guard(root, counters)

    pytest_args = [
        f"--ignore={EXCLUDED_TEST}",
        "-p",
        "no:cacheprovider",
        f"--basetemp={basetemp}",
        f"--junitxml={junit}",
        f"--log-file={root / 'pytest.log'}",
        str(tests_dir),
    ]
    started = time.monotonic()
    pytest_exit: int | None = None
    fatal_exception = None
    try:
        import pytest
        pytest_exit = int(pytest.main(pytest_args, plugins=[]))
    except BaseException as exc:
        fatal_exception = type(exc).__name__
        pytest_exit = 3
    finally:
        elapsed = round(time.monotonic() - started, 3)
        summary = {
            "authored_not_run_by_lane_b": True,
            "elapsed_seconds": elapsed,
            "excluded_original_test": str(EXCLUDED_TEST),
            "excluded_test_reason": (
                "runtime/collection is forbidden by the dispatch order; its separately accepted "
                "standalone evidence remains the authority"
            ),
            "full_service_pass_claimed": False,
            "bootstrap_owned_log_handles": [],
            "junit": str(junit),
            "private_root": str(root),
            "pytest_log_path": str(root / "pytest.log"),
            "pytest_args": pytest_args,
            "pytest_exit": pytest_exit,
            "safety_denials": counters.snapshot(),
            "source": str(source),
        }
        if fatal_exception is not None:
            summary["fatal_exception_type"] = fatal_exception
        _write_summary(root / "root-summary.json", summary)
    return int(pytest_exit if pytest_exit is not None else 3)


if __name__ == "__main__":
    raise SystemExit(main())
