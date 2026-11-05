from __future__ import annotations

import ctypes
import hashlib
import http.client
import json
import msvcrt
import os
import re
import stat
import sys
import time
import traceback
import xml.etree.ElementTree as ET


ORDER = "C-OCR-maintenance-controller-20261030-202123"
ADMISSION_VERDICT = "ADMITTED_ONE_EXISTING_OCR_MAINTENANCE_RESTORE_REQUIRED"
FRESH_ID_PATTERN = re.compile(r"^[0-9a-f]{16}$")

TEMP_PARENT = r"C:\Users\PC\AppData\Local\Temp"
PYTHON_PATH = r"C:\prep395\python\python.exe"
SERVER_PATH = r"C:\prep395\llama\llama-server.exe"
XML_PATH = r"C:\prep395\services\prep395-ocr.xml"
LOG_PARENT = r"C:\prep395\logs"

REQUEST_BYTES = 177698
REQUEST_SHA256 = "0b04102960d29ce77935b5a2d7efd5d1fc616aab9770e5260fc893183cfef0d5"
PYTHON_BYTES = 91648
PYTHON_SHA256 = "4796bc182e858e4440f638fe5dab250d6172745ddec84e41c6afbc192a3198f9"
SERVER_BYTES = 9216
SERVER_SHA256 = "9d7ec1f038329210f6be353a89752ea4a762f9defa80560d37102ccce7b09a06"
XML_BYTES = 738
XML_SHA256 = "6f38260bf02c49b6e8a64fe9c4deae7bdf3a08970719b456e372e516ed02bc98"
NATIVE_DLL_COUNT = 30
NATIVE_DLL_NAMES = (
    "ggml-base.dll",
    "ggml-cpu-alderlake.dll",
    "ggml-cpu-cannonlake.dll",
    "ggml-cpu-cascadelake.dll",
    "ggml-cpu-cooperlake.dll",
    "ggml-cpu-haswell.dll",
    "ggml-cpu-icelake.dll",
    "ggml-cpu-ivybridge.dll",
    "ggml-cpu-piledriver.dll",
    "ggml-cpu-sandybridge.dll",
    "ggml-cpu-sapphirerapids.dll",
    "ggml-cpu-skylakex.dll",
    "ggml-cpu-sse42.dll",
    "ggml-cpu-x64.dll",
    "ggml-cpu-zen4.dll",
    "ggml-rpc.dll",
    "ggml-vulkan.dll",
    "ggml.dll",
    "libomp.dll",
    "llama-batched-bench-impl.dll",
    "llama-bench-impl.dll",
    "llama-cli-impl.dll",
    "llama-common.dll",
    "llama-completion-impl.dll",
    "llama-fit-params-impl.dll",
    "llama-perplexity-impl.dll",
    "llama-quantize-impl.dll",
    "llama-server-impl.dll",
    "llama.dll",
    "mtmd.dll",
)

SERVICE_API = "prep395"
SERVICE_OCR = "prep395-ocr"
SERVICE_LLM9B = "prep395-llm9b"
AUTHORIZED_SERVICES = (SERVICE_API, SERVICE_OCR)
EVIDENCE_DIRECT_PIDS = {
    "api-python": 2932,
    "ocr-native": 36704,
    "llm9b-native": 9652,
}

POST_HOST = "127.0.0.1"
POST_PORT = 9101
POST_PATH = "/v1/chat/completions"
OCR_HEALTH = (POST_HOST, POST_PORT, "/health")
# The 395 API never binds 127.0.0.1:9000. The verified listeners are
# 192.168.8.124:9000 (in-office) and 10.126.126.3:9000 (off-site VPN address of
# the same host) and both are owned by the API python process. One fixed
# endpoint is used for the maintenance start check and for the restore check.
# There is no fallback to another host, another port, or a default.
API_HEALTH = ("10.126.126.3", 9000, "/health")

PRIMARY_BUDGET_SECONDS = 300.0
MAIN_PHASE_SECONDS = 180.0
RESTORE_RESERVE_SECONDS = 120.0
HTTP_TIMEOUT_MAX_SECONDS = 70.0
POLL_SECONDS = 0.20
LOG_READ_BUDGET = 4 * 1024 * 1024

SC_MANAGER_CONNECT = 0x0001
SERVICE_QUERY_STATUS = 0x0004
SERVICE_START = 0x0010
SERVICE_STOP = 0x0020
SC_STATUS_PROCESS_INFO = 0
SERVICE_STOPPED = 1
SERVICE_START_PENDING = 2
SERVICE_STOP_PENDING = 3
SERVICE_RUNNING = 4
SERVICE_CONTROL_STOP = 1
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
TH32CS_SNAPPROCESS = 0x00000002
FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400

RESULT = {
    "order": ORDER,
    "verdict": "IN_PROGRESS",
    "scope": "ONE_EXISTING_OCR_MAINTENANCE_RESTORE_REQUIRED",
    "started_utc": None,
    "first_stop_utc": None,
    "budget": {
        "primary_seconds": PRIMARY_BUDGET_SECONDS,
        "main_phase_seconds": MAIN_PHASE_SECONDS,
        "restore_reserve_seconds": RESTORE_RESERVE_SECONDS,
    },
    "phases": [],
    "errors": [],
    "http": None,
    "cleanup": None,
    "limits": [
        "One synthetic POST; no retry and no redirect handling.",
        "Service descendants are captured by Toolhelp32 best-effort; missing descendants are NOTPROVEN.",
        "A successful HTTP response is one interface sample, not proof of the original HTTP root cause.",
        "The controller does not contact, inspect, or alter 6000D.",
        "The OCR XML is rewritten inside the existing file in place; no replace, rename, unlink, chmod, or ACL call is used on it.",
        "Restoration runs in an unavoidable finally from the first stop dispatch through the single POST.",
        "Every planned service start first proves the previously captured identities of that same service are absent.",
        "Diagnostic writes are best-effort after the first stop; only the pre-stop backup and the initial evidence are mandatory.",
    ],
}
RESULT_PATH = None
LOG_READ_TOTAL = 0
PERSIST_FAILURES: list = []
OWNED_REGISTRY: dict = {}
CURRENT_GENERATION: dict = {}
GENERATION_COUNTER: dict = {}
OWNED_CAPTURE_GAPS: list = []


class ControllerError(RuntimeError):
    pass


class SERVICE_STATUS_PROCESS(ctypes.Structure):
    _fields_ = [
        ("dwServiceType", ctypes.c_ulong),
        ("dwCurrentState", ctypes.c_ulong),
        ("dwControlsAccepted", ctypes.c_ulong),
        ("dwWin32ExitCode", ctypes.c_ulong),
        ("dwServiceSpecificExitCode", ctypes.c_ulong),
        ("dwCheckPoint", ctypes.c_ulong),
        ("dwWaitHint", ctypes.c_ulong),
        ("dwProcessId", ctypes.c_ulong),
        ("dwServiceFlags", ctypes.c_ulong),
    ]


class FILETIME(ctypes.Structure):
    _fields_ = [
        ("dwLowDateTime", ctypes.c_ulong),
        ("dwHighDateTime", ctypes.c_ulong),
    ]


class PROCESSENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", ctypes.c_ulong),
        ("cntUsage", ctypes.c_ulong),
        ("th32ProcessID", ctypes.c_ulong),
        ("th32DefaultHeapID", ctypes.c_void_p),
        ("th32ModuleID", ctypes.c_ulong),
        ("cntThreads", ctypes.c_ulong),
        ("th32ParentProcessID", ctypes.c_ulong),
        ("pcPriClassBase", ctypes.c_long),
        ("dwFlags", ctypes.c_ulong),
        ("szExeFile", ctypes.c_wchar * 260),
    ]


class BY_HANDLE_FILE_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("dwFileAttributes", ctypes.c_ulong),
        ("ftCreationTime", FILETIME),
        ("ftLastAccessTime", FILETIME),
        ("ftLastWriteTime", FILETIME),
        ("dwVolumeSerialNumber", ctypes.c_ulong),
        ("nFileSizeHigh", ctypes.c_ulong),
        ("nFileSizeLow", ctypes.c_ulong),
        ("nNumberOfLinks", ctypes.c_ulong),
        ("nFileIndexHigh", ctypes.c_ulong),
        ("nFileIndexLow", ctypes.c_ulong),
    ]


advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

advapi32.OpenSCManagerW.argtypes = [ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_ulong]
advapi32.OpenSCManagerW.restype = ctypes.c_void_p
advapi32.OpenServiceW.argtypes = [ctypes.c_void_p, ctypes.c_wchar_p, ctypes.c_ulong]
advapi32.OpenServiceW.restype = ctypes.c_void_p
advapi32.QueryServiceStatusEx.argtypes = [
    ctypes.c_void_p,
    ctypes.c_int,
    ctypes.c_void_p,
    ctypes.c_ulong,
    ctypes.POINTER(ctypes.c_ulong),
]
advapi32.QueryServiceStatusEx.restype = ctypes.c_int
advapi32.ControlService.argtypes = [
    ctypes.c_void_p,
    ctypes.c_ulong,
    ctypes.POINTER(SERVICE_STATUS_PROCESS),
]
advapi32.ControlService.restype = ctypes.c_int
advapi32.StartServiceW.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_void_p]
advapi32.StartServiceW.restype = ctypes.c_int
advapi32.CloseServiceHandle.argtypes = [ctypes.c_void_p]
advapi32.CloseServiceHandle.restype = ctypes.c_int

kernel32.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
kernel32.OpenProcess.restype = ctypes.c_void_p
kernel32.QueryFullProcessImageNameW.argtypes = [
    ctypes.c_void_p,
    ctypes.c_ulong,
    ctypes.c_wchar_p,
    ctypes.POINTER(ctypes.c_ulong),
]
kernel32.QueryFullProcessImageNameW.restype = ctypes.c_int
kernel32.GetProcessTimes.argtypes = [
    ctypes.c_void_p,
    ctypes.POINTER(FILETIME),
    ctypes.POINTER(FILETIME),
    ctypes.POINTER(FILETIME),
    ctypes.POINTER(FILETIME),
]
kernel32.GetProcessTimes.restype = ctypes.c_int
kernel32.CloseHandle.argtypes = [ctypes.c_void_p]
kernel32.CloseHandle.restype = ctypes.c_int
kernel32.CreateToolhelp32Snapshot.argtypes = [ctypes.c_ulong, ctypes.c_ulong]
kernel32.CreateToolhelp32Snapshot.restype = ctypes.c_void_p
kernel32.Process32FirstW.argtypes = [ctypes.c_void_p, ctypes.POINTER(PROCESSENTRY32W)]
kernel32.Process32FirstW.restype = ctypes.c_int
kernel32.Process32NextW.argtypes = [ctypes.c_void_p, ctypes.POINTER(PROCESSENTRY32W)]
kernel32.Process32NextW.restype = ctypes.c_int
kernel32.GetFileInformationByHandle.argtypes = [
    ctypes.c_void_p,
    ctypes.POINTER(BY_HANDLE_FILE_INFORMATION),
]
kernel32.GetFileInformationByHandle.restype = ctypes.c_int


def utc_now() -> str:
    seconds = time.time()
    whole = time.gmtime(seconds)
    fraction = int((seconds - int(seconds)) * 1_000_000)
    return time.strftime("%Y-%m-%dT%H:%M:%S", whole) + f".{fraction:06d}Z"


def normalized(path: str) -> str:
    return os.path.normcase(os.path.abspath(path))


def require_path_equal(actual: str, expected: str, label: str) -> None:
    if normalized(actual) != normalized(expected):
        raise ControllerError(f"{label} path mismatch")


def win_error(prefix: str) -> ControllerError:
    code = ctypes.get_last_error()
    return ControllerError(f"{prefix} failed: WinError {code}")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def require_file_identity(path: str, size: int, digest: str, label: str) -> bytes:
    try:
        info = os.stat(path, follow_symlinks=False)
    except OSError as exc:
        raise ControllerError(f"{label} is not readable: {exc}") from exc
    if not stat.S_ISREG(info.st_mode) or info.st_size != size:
        raise ControllerError(f"{label} size/type mismatch")
    data = None
    if label == "request" or label.upper().endswith("XML"):
        with open(path, "rb") as handle:
            data = handle.read()
        actual = sha256_bytes(data)
    else:
        actual = sha256_file(path)
    if actual.lower() != digest.lower():
        raise ControllerError(f"{label} SHA256 mismatch")
    return data


def require_plain_chain(path: str, include_leaf: bool) -> None:
    current = os.path.abspath(path)
    if not include_leaf:
        current = os.path.dirname(current)
    while True:
        try:
            info = os.stat(current, follow_symlinks=False)
        except OSError as exc:
            raise ControllerError(f"path-chain check failed at {current}: {exc}") from exc
        if getattr(info, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT:
            raise ControllerError(f"reparse point refused in path chain: {current}")
        parent = os.path.dirname(current)
        if normalized(parent) == normalized(current):
            break
        current = parent


def atomic_write(path: str, data: bytes, work_dir: str) -> None:
    temp = os.path.join(work_dir, os.path.basename(path) + ".next")
    with open(temp, "wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp, path)


def persist_result() -> None:
    """Best-effort diagnostic persistence.

    From the first stop dispatch onward a diagnostic write failure must never
    prevent service or configuration restoration, so the failure is recorded
    and swallowed here. Before the first stop the caller decides separately
    whether a mandatory write failed.
    """
    if RESULT_PATH is None:
        return
    try:
        data = (json.dumps(RESULT, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        atomic_write(RESULT_PATH, data, os.path.dirname(RESULT_PATH))
    except Exception as exc:
        PERSIST_FAILURES.append(
            {
                "utc": utc_now(),
                "phase": "persist-result",
                "error": f"{type(exc).__name__}: {exc}",
            }
        )


def persist_result_strict() -> None:
    """Mandatory durable evidence write. Raises on failure."""
    if RESULT_PATH is None:
        return
    data = (json.dumps(RESULT, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    atomic_write(RESULT_PATH, data, os.path.dirname(RESULT_PATH))


def durable_write_bytes(path: str, data: bytes) -> None:
    """Mandatory durable write of a fresh artifact. Raises on failure."""
    with open(path, "xb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())


def file_identity_handle(handle, label: str) -> dict:
    info = BY_HANDLE_FILE_INFORMATION()
    if not kernel32.GetFileInformationByHandle(handle, ctypes.byref(info)):
        raise win_error(f"GetFileInformationByHandle({label})")
    return {
        "volume_serial": int(info.dwVolumeSerialNumber),
        "file_index": (int(info.nFileIndexHigh) << 32) | int(info.nFileIndexLow),
        "size": (int(info.nFileSizeHigh) << 32) | int(info.nFileSizeLow),
        "links": int(info.nNumberOfLinks),
        "attributes": int(info.dwFileAttributes),
    }


def open_existing_file_handle(path: str) -> int:
    """Open the EXISTING XML file read-write in place, like open(path, 'r+b').

    O_CREAT and O_TRUNC are deliberately absent so the file object is never
    replaced and never truncated before the new bytes are written. The
    security descriptor of the existing file is inherited unchanged because
    the file already exists and no new file is created.
    """
    try:
        descriptor = os.open(path, os.O_RDWR | os.O_BINARY)
    except OSError as exc:
        raise ControllerError(f"{path} could not be opened in place: {exc}") from exc
    return descriptor


def write_file_in_place(path: str, data: bytes, label: str) -> dict:
    """Overwrite an EXISTING file's bytes in place.

    Only the existing file is opened r+b style: the same file object is
    written, truncated and flushed. os.replace / rename / unlink / chmod are
    never used, so the service keeps reading the same file with the same
    security descriptor. The file identity (volume serial plus file index) is
    confirmed to be the same object before and after the write.
    """
    before_stat = os.stat(path, follow_symlinks=False)
    if not stat.S_ISREG(before_stat.st_mode):
        raise ControllerError(f"{label} is not a regular file")
    if getattr(before_stat, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT:
        raise ControllerError(f"{label} is a reparse point")

    descriptor = open_existing_file_handle(path)
    try:
        handle = msvcrt.get_osfhandle(descriptor)
        identity_before = file_identity_handle(handle, label)
        if identity_before["links"] < 1:
            raise ControllerError(f"{label} has no name reference")
        if identity_before["attributes"] & FILE_ATTRIBUTE_REPARSE_POINT:
            raise ControllerError(f"{label} became a reparse point")

        os.lseek(descriptor, 0, os.SEEK_SET)
        written = 0
        view = memoryview(data)
        while written < len(data):
            chunk = view[written:written + 1024 * 1024]
            count = os.write(descriptor, chunk)
            if count <= 0:
                raise ControllerError(f"{label} in-place write returned {count}")
            written += count

        os.ftruncate(descriptor, len(data))
        os.fsync(descriptor)

        identity_after = file_identity_handle(handle, label)
    finally:
        os.close(descriptor)

    if (
        identity_after["volume_serial"] != identity_before["volume_serial"]
        or identity_after["file_index"] != identity_before["file_index"]
    ):
        raise ControllerError(f"{label} file identity changed during the in-place write")
    if identity_after["size"] != len(data):
        raise ControllerError(f"{label} final size mismatch")

    after_stat = os.stat(path, follow_symlinks=False)
    if not stat.S_ISREG(after_stat.st_mode):
        raise ControllerError(f"{label} is not a regular file after the in-place write")
    if getattr(after_stat, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT:
        raise ControllerError(f"{label} is a reparse point after the in-place write")
    with open(path, "rb") as check:
        written_bytes = check.read()
    if written_bytes != data:
        raise ControllerError(f"{label} byte comparison after the in-place write failed")
    return {
        "write": "IN_PLACE_SAME_FILE",
        "bytes": len(data),
        "identity": {
            "volume_serial": identity_before["volume_serial"],
            "file_index": identity_before["file_index"],
        },
        "same_file_object": True,
        "written_utc": utc_now(),
    }


def restore_file_times(path: str, original_times: dict) -> dict:
    """Restore the original access/write timestamps of the XML file.

    The timestamps were captured from the very same file object before the
    maintenance write. Only the timestamps are touched; no security API,
    chmod, or ownership call is involved.
    """
    try:
        os.utime(
            path,
            ns=(int(original_times["atime_ns"]), int(original_times["mtime_ns"])),
        )
    except OSError as exc:
        raise ControllerError(f"original timestamps could not be restored: {exc}") from exc
    return {
        "timestamps_restored": True,
        "original_mtime_ns": int(original_times["mtime_ns"]),
    }


def add_phase(name: str, status: str, **details) -> dict:
    record = {
        "phase": name,
        "status": status,
        "utc": utc_now(),
        "monotonic_ms": round(time.monotonic() * 1000, 3),
    }
    record.update(details)
    RESULT["phases"].append(record)
    persist_result()
    return record


def add_error(phase: str, exc: BaseException) -> None:
    RESULT["errors"].append(
        {
            "phase": phase,
            "utc": utc_now(),
            "type": type(exc).__name__,
            "message": str(exc),
        }
    )
    persist_result()


def value(mapping: dict, key: str, label: str):
    if not isinstance(mapping, dict) or key not in mapping:
        raise ControllerError(f"admission missing {label}.{key}")
    return mapping[key]


def check_admission_file(record: dict, expected_path: str, size: int, digest: str, label: str) -> None:
    actual_path = str(value(record, "path", label))
    require_path_equal(actual_path, expected_path, label)
    if int(value(record, "bytes", label)) != size:
        raise ControllerError(f"admission {label} byte pin mismatch")
    if str(value(record, "sha256", label)).lower() != digest.lower():
        raise ControllerError(f"admission {label} SHA pin mismatch")


def admit() -> dict:
    if os.name != "nt":
        raise ControllerError("Windows is required")
    if len(sys.argv) != 1:
        raise ControllerError("arguments are forbidden")

    script_path = os.path.abspath(__file__)
    stage = os.path.dirname(script_path)
    stage_name = os.path.basename(stage)
    prefix = "lb-ocr-maint-"
    if not stage_name.startswith(prefix):
        raise ControllerError("stage name has the wrong prefix")
    fresh_id = stage_name[len(prefix):]
    if not FRESH_ID_PATTERN.fullmatch(fresh_id):
        raise ControllerError("fresh id must be 16 lowercase hexadecimal characters")
    require_path_equal(stage, os.path.join(TEMP_PARENT, stage_name), "stage")
    require_plain_chain(stage, include_leaf=True)

    expected_script = os.path.join(stage, "maintenance-controller.py")
    request_path = os.path.join(stage, "request.json")
    admission_path = os.path.join(stage, "admission.json")
    run_dir = os.path.join(stage, "run")
    require_path_equal(script_path, expected_script, "controller")
    if os.path.exists(run_dir):
        raise ControllerError("stage run directory must be absent at admission")

    admission_info = os.stat(admission_path, follow_symlinks=False)
    if not stat.S_ISREG(admission_info.st_mode) or admission_info.st_size > 256 * 1024:
        raise ControllerError("admission.json type/size refused")
    with open(admission_path, "r", encoding="utf-8") as handle:
        admission = json.load(handle)
    if value(admission, "verdict", "admission") != ADMISSION_VERDICT:
        raise ControllerError("explicit admission verdict mismatch")
    if value(admission, "fresh_id", "admission") != fresh_id:
        raise ControllerError("fresh id mismatch")
    require_path_equal(str(value(admission, "stage_root", "admission")), stage, "admission stage")
    if value(admission, "outage_seconds", "admission") != int(PRIMARY_BUDGET_SECONDS):
        raise ControllerError("outage budget admission mismatch")
    if value(admission, "restore_required", "admission") is not True:
        raise ControllerError("restore_required must be true")
    if value(admission, "no_real_case_traffic", "admission") is not True:
        raise ControllerError("human no-real-traffic confirmation missing")
    if list(value(admission, "authorized_services", "admission")) != list(AUTHORIZED_SERVICES):
        raise ControllerError("authorized service list mismatch")

    check_admission_file(
        value(admission, "controller", "admission"),
        expected_script,
        os.stat(script_path, follow_symlinks=False).st_size,
        sha256_file(script_path),
        "controller",
    )
    check_admission_file(
        value(admission, "request", "admission"),
        request_path,
        REQUEST_BYTES,
        REQUEST_SHA256,
        "request",
    )
    check_admission_file(
        value(admission, "python", "admission"),
        PYTHON_PATH,
        PYTHON_BYTES,
        PYTHON_SHA256,
        "python",
    )
    check_admission_file(
        value(admission, "server", "admission"),
        SERVER_PATH,
        SERVER_BYTES,
        SERVER_SHA256,
        "server",
    )
    check_admission_file(
        value(admission, "xml", "admission"),
        XML_PATH,
        XML_BYTES,
        XML_SHA256,
        "xml",
    )
    require_path_equal(sys.executable, PYTHON_PATH, "running Python")
    require_plain_chain(XML_PATH, include_leaf=True)
    require_plain_chain(PYTHON_PATH, include_leaf=True)
    require_plain_chain(SERVER_PATH, include_leaf=True)
    require_file_identity(request_path, REQUEST_BYTES, REQUEST_SHA256, "request")
    require_file_identity(PYTHON_PATH, PYTHON_BYTES, PYTHON_SHA256, "python")
    require_file_identity(SERVER_PATH, SERVER_BYTES, SERVER_SHA256, "server")

    log_record = value(admission, "log", "admission")
    log_parent = str(value(log_record, "parent", "admission.log"))
    log_dir = str(value(log_record, "directory", "admission.log"))
    require_path_equal(log_parent, LOG_PARENT, "log parent")
    require_path_equal(log_dir, os.path.join(LOG_PARENT, stage_name), "log directory")
    require_plain_chain(log_parent, include_leaf=True)
    if os.path.exists(log_dir):
        raise ControllerError("owned log directory must be new and absent")

    dll_rows = value(admission, "native_dlls", "admission")
    if not isinstance(dll_rows, list) or len(dll_rows) != NATIVE_DLL_COUNT:
        raise ControllerError("native DLL pin count mismatch")
    dll_names = set()
    for row in dll_rows:
        name = str(value(row, "name", "native_dll"))
        if os.path.basename(name) != name or not name.lower().endswith(".dll"):
            raise ControllerError("unsafe native DLL name")
        if name.lower() in dll_names:
            raise ControllerError("duplicate native DLL pin")
        dll_names.add(name.lower())
        dll_path = os.path.join(os.path.dirname(SERVER_PATH), name)
        require_plain_chain(dll_path, include_leaf=True)
        require_file_identity(
            dll_path,
            int(value(row, "bytes", "native_dll")),
            str(value(row, "sha256", "native_dll")),
            f"native DLL {name}",
        )
    if dll_names != {name.lower() for name in NATIVE_DLL_NAMES}:
        raise ControllerError("native DLL name set mismatch")

    services = value(admission, "services", "admission")
    service_pids = []
    for service_name in (SERVICE_API, SERVICE_OCR, SERVICE_LLM9B):
        row = value(services, service_name, "admission.services")
        service_pid = int(value(row, "pid", f"services.{service_name}"))
        if service_pid <= 0:
            raise ControllerError(f"{service_name} expected service PID is invalid")
        service_pids.append(service_pid)
        if not str(value(row, "exe", f"services.{service_name}")):
            raise ControllerError(f"{service_name} expected wrapper exe is empty")
        int(value(row, "creation_filetime", f"services.{service_name}"))
    if len(set(service_pids)) != len(service_pids):
        raise ControllerError("expected service PIDs must be distinct")

    direct_rows = value(admission, "direct_processes", "admission")
    if not isinstance(direct_rows, list) or len(direct_rows) != 3:
        raise ControllerError("direct process pin count mismatch")
    expected_roles = {"api-python", "ocr-native", "llm9b-native"}
    if {str(value(row, "role", "direct_process")) for row in direct_rows} != expected_roles:
        raise ControllerError("direct process roles mismatch")
    direct_by_role = {str(row["role"]): row for row in direct_rows}
    for role, expected_pid in EVIDENCE_DIRECT_PIDS.items():
        if int(value(direct_by_role[role], "pid", role)) != expected_pid:
            raise ControllerError(f"{role} evidence PID mismatch")
    direct_pids = {int(value(row, "pid", "direct_process")) for row in direct_rows}
    if len(direct_pids) != len(direct_rows):
        raise ControllerError("expected direct process PIDs must be distinct")
    require_path_equal(
        str(value(direct_by_role["api-python"], "exe", "api-python")),
        PYTHON_PATH,
        "api-python executable",
    )
    for role in ("ocr-native", "llm9b-native"):
        require_path_equal(
            str(value(direct_by_role[role], "exe", role)),
            SERVER_PATH,
            f"{role} executable",
        )

    with open(request_path, "rb") as handle:
        request_body = handle.read()
    return {
        "stage": stage,
        "fresh_id": fresh_id,
        "script": script_path,
        "request_path": request_path,
        "request_body": request_body,
        "run_dir": run_dir,
        "log_dir": log_dir,
        "services": services,
        "direct_processes": direct_rows,
    }


def open_scm():
    handle = advapi32.OpenSCManagerW(None, None, SC_MANAGER_CONNECT)
    if not handle:
        raise win_error("OpenSCManagerW")
    return handle


def open_service(scm, name: str, access: int):
    allowed = {SERVICE_API, SERVICE_OCR, SERVICE_LLM9B}
    if name not in allowed:
        raise ControllerError("service name refused")
    handle = advapi32.OpenServiceW(scm, name, access)
    if not handle:
        raise win_error(f"OpenServiceW({name})")
    return handle


def require_authorized_service(name: str) -> str:
    """Narrow guard: only the two authorized services may ever be mutated.

    This runs BEFORE any mutation access is opened, so a refused name never
    reaches OpenServiceW with SERVICE_START or SERVICE_STOP. The 9B service is
    never in this set, so it can only be queried, never controlled.
    """
    if name not in AUTHORIZED_SERVICES:
        raise ControllerError(
            f"service {name!r} is not an authorized maintenance target"
        )
    return name


def query_service_status(handle) -> dict:
    status = SERVICE_STATUS_PROCESS()
    needed = ctypes.c_ulong()
    ok = advapi32.QueryServiceStatusEx(
        handle,
        SC_STATUS_PROCESS_INFO,
        ctypes.byref(status),
        ctypes.sizeof(status),
        ctypes.byref(needed),
    )
    if not ok:
        raise win_error("QueryServiceStatusEx")
    return {
        "state": int(status.dwCurrentState),
        "pid": int(status.dwProcessId),
        "win32_exit_code": int(status.dwWin32ExitCode),
        "service_exit_code": int(status.dwServiceSpecificExitCode),
        "checkpoint": int(status.dwCheckPoint),
        "wait_hint_ms": int(status.dwWaitHint),
    }


def service_snapshot(name: str) -> dict:
    scm = open_scm()
    service = None
    try:
        service = open_service(scm, name, SERVICE_QUERY_STATUS)
        return query_service_status(service)
    finally:
        if service:
            advapi32.CloseServiceHandle(service)
        advapi32.CloseServiceHandle(scm)


def dispatch_stop(name: str) -> dict:
    require_authorized_service(name)
    scm = open_scm()
    service = None
    try:
        service = open_service(scm, name, SERVICE_QUERY_STATUS | SERVICE_STOP)
        before = query_service_status(service)
        if before["state"] != SERVICE_RUNNING:
            raise ControllerError(f"{name} is not RUNNING before stop dispatch")
        status = SERVICE_STATUS_PROCESS()
        if not advapi32.ControlService(service, SERVICE_CONTROL_STOP, ctypes.byref(status)):
            raise win_error(f"ControlService(STOP,{name})")
        return before
    finally:
        if service:
            advapi32.CloseServiceHandle(service)
        advapi32.CloseServiceHandle(scm)


def dispatch_start(name: str) -> dict:
    require_authorized_service(name)
    scm = open_scm()
    service = None
    try:
        service = open_service(scm, name, SERVICE_QUERY_STATUS | SERVICE_START)
        before = query_service_status(service)
        if before["state"] in (SERVICE_RUNNING, SERVICE_START_PENDING):
            return before
        if before["state"] != SERVICE_STOPPED:
            raise ControllerError(f"{name} is not STOPPED before start")
        if not advapi32.StartServiceW(service, 0, None):
            code = ctypes.get_last_error()
            if code != 1056:
                raise ControllerError(f"StartServiceW({name}) failed: WinError {code}")
        return before
    finally:
        if service:
            advapi32.CloseServiceHandle(service)
        advapi32.CloseServiceHandle(scm)


def wait_service_state(name: str, wanted: int, deadline: float) -> dict:
    last = None
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise ControllerError(f"{name} state wait timed out; last={last}")
        last = service_snapshot(name)
        if last["state"] == wanted:
            return last
        if last["state"] not in (
            SERVICE_START_PENDING,
            SERVICE_STOP_PENDING,
            SERVICE_RUNNING,
            SERVICE_STOPPED,
        ):
            raise ControllerError(f"{name} entered unexpected SCM state {last['state']}")
        time.sleep(min(POLL_SECONDS, remaining))


def process_identity(pid: int) -> dict:
    handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid)
    if not handle:
        raise win_error(f"OpenProcess({pid})")
    try:
        capacity = ctypes.c_ulong(32768)
        buffer = ctypes.create_unicode_buffer(capacity.value)
        if not kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(capacity)):
            raise win_error(f"QueryFullProcessImageNameW({pid})")
        creation = FILETIME()
        exit_time = FILETIME()
        kernel_time = FILETIME()
        user_time = FILETIME()
        if not kernel32.GetProcessTimes(
            handle,
            ctypes.byref(creation),
            ctypes.byref(exit_time),
            ctypes.byref(kernel_time),
            ctypes.byref(user_time),
        ):
            raise win_error(f"GetProcessTimes({pid})")
        filetime = (int(creation.dwHighDateTime) << 32) | int(creation.dwLowDateTime)
        return {"pid": pid, "exe": buffer.value, "creation_filetime": filetime}
    finally:
        kernel32.CloseHandle(handle)


def identity_matches(actual: dict, expected: dict) -> bool:
    return (
        int(actual["pid"]) == int(expected["pid"])
        and normalized(str(actual["exe"])) == normalized(str(expected["exe"]))
        and int(actual["creation_filetime"]) == int(expected["creation_filetime"])
    )


def require_expected_process(expected: dict, label: str) -> dict:
    actual = process_identity(int(value(expected, "pid", label)))
    if not identity_matches(actual, expected):
        raise ControllerError(f"{label} identity mismatch")
    return actual


def process_snapshot_rows() -> tuple[list[dict], str | None]:
    snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if snapshot in (None, ctypes.c_void_p(-1).value):
        return [], f"CreateToolhelp32Snapshot failed: WinError {ctypes.get_last_error()}"
    rows = []
    error = None
    try:
        entry = PROCESSENTRY32W()
        entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
        if not kernel32.Process32FirstW(snapshot, ctypes.byref(entry)):
            error = f"Process32FirstW failed: WinError {ctypes.get_last_error()}"
        else:
            while True:
                rows.append(
                    {
                        "pid": int(entry.th32ProcessID),
                        "parent_pid": int(entry.th32ParentProcessID),
                        "name": entry.szExeFile,
                    }
                )
                if not kernel32.Process32NextW(snapshot, ctypes.byref(entry)):
                    break
    finally:
        kernel32.CloseHandle(snapshot)
    return rows, error


def capture_descendants(root_pid: int) -> dict:
    rows, snapshot_error = process_snapshot_rows()
    children = {}
    for row in rows:
        children.setdefault(row["parent_pid"], []).append(row)
    found_rows = []
    errors = []
    queue = [(root_pid, 0)]
    seen = {root_pid}
    while queue and len(found_rows) < 256:
        parent_pid, depth = queue.pop(0)
        if depth >= 8:
            continue
        for row in children.get(parent_pid, []):
            if row["pid"] in seen:
                continue
            seen.add(row["pid"])
            queue.append((row["pid"], depth + 1))
            try:
                identity = process_identity(row["pid"])
                identity["depth"] = depth + 1
                identity["snapshot_name"] = row["name"]
                found_rows.append(identity)
            except Exception as exc:
                errors.append({"pid": row["pid"], "depth": depth + 1, "error": str(exc)})
    capture = {
        "root_pid": root_pid,
        "descendants": found_rows,
        "errors": errors,
        "snapshot_error": snapshot_error,
        "proof": "PARTIAL_NOTPROVEN" if (errors or snapshot_error) else "SNAPSHOT_CAPTURED",
    }
    return capture


def service_identity_check(name: str, expected: dict) -> dict:
    snapshot = service_snapshot(name)
    if snapshot["state"] != SERVICE_RUNNING:
        raise ControllerError(f"{name} initial state is not RUNNING")
    if snapshot["pid"] != int(expected["pid"]):
        raise ControllerError(f"{name} SCM PID mismatch")
    wrapper = require_expected_process(expected, f"{name} wrapper")
    descendants = capture_descendants(snapshot["pid"])
    return {"snapshot": snapshot, "wrapper": wrapper, "descendants": descendants}


def verify_direct_processes(admission: dict, initial: dict) -> dict:
    expected_by_role = {str(row["role"]): row for row in admission["direct_processes"]}
    observed = {}
    for role, expected in expected_by_role.items():
        observed[role] = require_expected_process(expected, role)

    service_for_role = {
        "api-python": SERVICE_API,
        "ocr-native": SERVICE_OCR,
        "llm9b-native": SERVICE_LLM9B,
    }
    for role, expected in expected_by_role.items():
        service_name = service_for_role[role]
        service_pid = int(initial[service_name]["snapshot"]["pid"])
        if int(expected["pid"]) != service_pid:
            descendants = initial[service_name]["descendants"]
            descendant_pids = {int(row["pid"]) for row in descendants["descendants"]}
            if int(expected["pid"]) not in descendant_pids:
                raise ControllerError(
                    f"{role} is neither the SCM wrapper nor a captured descendant; NOTPROVEN"
                )
    return observed


def health_once(endpoint: tuple[str, int, str], timeout: float) -> tuple[int, bytes, str | None]:
    host, port, path = endpoint
    connection = http.client.HTTPConnection(host, port, timeout=timeout)
    try:
        connection.request("GET", path)
        response = connection.getresponse()
        body = response.read(65536)
        return response.status, body, None
    except Exception as exc:
        return 0, b"", f"{type(exc).__name__}: {exc}"
    finally:
        connection.close()


def wait_health(endpoint: tuple[str, int, str], deadline: float, label: str) -> dict:
    last_error = None
    attempts = 0
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise ControllerError(f"{label} health wait timed out; last={last_error}")
        status_code, body, error = health_once(endpoint, min(2.0, remaining))
        attempts += 1
        if status_code == 200:
            return {"status": status_code, "body_bytes": len(body), "attempts": attempts}
        last_error = error or f"HTTP {status_code}"
        time.sleep(min(POLL_SECONDS, max(0.0, deadline - time.monotonic())))


def start_and_check(name: str, endpoint: tuple[str, int, str], deadline: float) -> dict:
    dispatch_start(name)
    running = wait_service_state(name, SERVICE_RUNNING, deadline)
    health = wait_health(endpoint, deadline, name)
    actual = process_identity(running["pid"])
    capture = capture_and_register_service_tree(name, running["pid"])
    register_owned(name, actual)
    return {
        "service": running,
        "wrapper": actual,
        "health": health,
        "descendants": capture,
    }


def stop_and_wait(name: str, deadline: float) -> dict:
    dispatch_stop(name)
    stopped = wait_service_state(name, SERVICE_STOPPED, deadline)
    return stopped


def stop_if_needed(name: str, deadline: float) -> dict:
    before = service_snapshot(name)
    if before["state"] == SERVICE_STOPPED:
        return {"before": before, "dispatch": "NOT_NEEDED", "after": before}
    if before["state"] not in (
        SERVICE_RUNNING,
        SERVICE_START_PENDING,
        SERVICE_STOP_PENDING,
    ):
        raise ControllerError(f"{name} cannot be stopped from SCM state {before['state']}")
    dispatch = "NONE"
    current = before
    if current["state"] in (SERVICE_RUNNING, SERVICE_START_PENDING):
        if current["state"] == SERVICE_START_PENDING:
            current = wait_service_state(name, SERVICE_RUNNING, min(deadline, time.monotonic() + 20))
        dispatch_stop(name)
        dispatch = "ONE"
    stopped = wait_service_state(name, SERVICE_STOPPED, deadline)
    return {"before": before, "dispatch": dispatch, "after": stopped}


def xml_semantic_child(element: ET.Element) -> tuple:
    text = element.text if element.text and element.text.strip() else ""
    attributes = tuple(sorted((str(key), str(val)) for key, val in element.attrib.items()))
    return (
        str(element.tag),
        attributes,
        text,
        tuple(xml_semantic_child(child) for child in list(element)),
    )


def xml_other_semantics(root: ET.Element) -> tuple:
    excluded = {"arguments", "logpath", "log"}
    attributes = tuple(sorted((str(key), str(val)) for key, val in root.attrib.items()))
    root_text = root.text if root.text and root.text.strip() else ""
    children = [
        xml_semantic_child(child)
        for child in list(root)
        if str(child.tag).lower() not in excluded
    ]
    return (str(root.tag), attributes, root_text, tuple(children))


def direct_children(root: ET.Element, tag: str) -> list[ET.Element]:
    return [child for child in list(root) if str(child.tag).lower() == tag]


def validate_original_xml(original_bytes: bytes) -> tuple[ET.Element, tuple]:
    if len(original_bytes) != XML_BYTES or sha256_bytes(original_bytes) != XML_SHA256:
        raise ControllerError("original XML bytes/SHA mismatch")
    root = ET.fromstring(original_bytes)
    if str(root.tag).lower() != "service":
        raise ControllerError("XML root is not service")

    ids = direct_children(root, "id")
    if len(ids) != 1 or (ids[0].text or "").strip() != SERVICE_OCR:
        raise ControllerError("XML service id mismatch")
    executables = direct_children(root, "executable")
    if len(executables) != 1:
        raise ControllerError("XML executable count mismatch")
    require_path_equal((executables[0].text or "").strip(), SERVER_PATH, "XML executable")

    arguments = direct_children(root, "arguments")
    if len(arguments) != 1 or list(arguments[0]):
        raise ControllerError("XML arguments shape mismatch")
    tokens = (arguments[0].text or "").split()
    if tokens.count("--log-disable") != 1:
        raise ControllerError("XML must contain exactly one --log-disable")
    forbidden_flags = {
        "--log-verbosity",
        "--log-prefix",
        "--log-timestamps",
        "--log-colors",
        "--verbose",
        "--trace",
        "--log-file",
    }
    if forbidden_flags.intersection(tokens):
        raise ControllerError("XML already contains a persistent-log flag")
    if direct_children(root, "logpath"):
        raise ControllerError("XML already has logpath")
    for child in root:
        tag = str(child.tag).lower()
        if tag in {"env", "serviceaccount", "credential", "credentials", "password"}:
            raise ControllerError(f"XML contains forbidden {tag} node")
    log_nodes = direct_children(root, "log")
    if len(log_nodes) > 1:
        raise ControllerError("XML has multiple log nodes")
    if log_nodes:
        node = log_nodes[0]
        if str(node.attrib.get("mode", "")).lower() != "none" or list(node):
            raise ControllerError("existing XML log node is not empty mode=none")
    return root, xml_other_semantics(root)


def build_modified_xml(original_bytes: bytes, log_dir: str) -> bytes:
    root, other_before = validate_original_xml(original_bytes)
    arguments = direct_children(root, "arguments")[0]
    arguments_attributes = tuple(sorted((str(key), str(val)) for key, val in arguments.attrib.items()))
    before_tokens = (arguments.text or "").split()
    index = before_tokens.index("--log-disable")
    replacement = [
        "--log-verbosity",
        "1",
        "--log-prefix",
        "--log-timestamps",
        "--log-colors",
        "off",
    ]
    after_tokens = before_tokens[:index] + replacement + before_tokens[index + 1:]
    arguments.text = " ".join(after_tokens)

    log_nodes = direct_children(root, "log")
    if log_nodes:
        log_node = log_nodes[0]
        log_node.attrib.clear()
        log_node.text = None
        for child in list(log_node):
            log_node.remove(child)
    else:
        log_node = ET.SubElement(root, "log")
    log_node.set("mode", "roll-by-size")
    threshold = ET.SubElement(log_node, "sizeThreshold")
    threshold.text = "1024"
    keep = ET.SubElement(log_node, "keepFiles")
    keep.text = "2"

    logpath = ET.SubElement(root, "logpath")
    logpath.text = log_dir.replace("\\", "/")
    ET.indent(root, space="  ")
    modified = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    reparsed = ET.fromstring(modified)
    if xml_other_semantics(reparsed) != other_before:
        raise ControllerError("XML semantic inverse failed for untouched nodes")
    reparsed_arguments = direct_children(reparsed, "arguments")
    if len(reparsed_arguments) != 1 or (reparsed_arguments[0].text or "").split() != after_tokens:
        raise ControllerError("XML arguments did not apply the exact token delta")
    reparsed_argument_attributes = tuple(
        sorted((str(key), str(val)) for key, val in reparsed_arguments[0].attrib.items())
    )
    if reparsed_argument_attributes != arguments_attributes:
        raise ControllerError("XML arguments attributes changed")
    reparsed_logpath = direct_children(reparsed, "logpath")
    if len(reparsed_logpath) != 1 or (reparsed_logpath[0].text or "") != log_dir.replace("\\", "/"):
        raise ControllerError("XML logpath mismatch")
    reparsed_logs = direct_children(reparsed, "log")
    if len(reparsed_logs) != 1 or reparsed_logs[0].attrib != {"mode": "roll-by-size"}:
        raise ControllerError("XML log node mismatch")
    children = {str(child.tag): (child.text or "") for child in list(reparsed_logs[0])}
    if children != {"sizeThreshold": "1024", "keepFiles": "2"}:
        raise ControllerError("XML roll-by-size children mismatch")
    return modified


def capture_owned_logs(log_dir: str) -> dict:
    global LOG_READ_TOTAL
    if not os.path.isdir(log_dir):
        return {
            "directory": log_dir,
            "exists": False,
            "files": [],
            "call_read_bytes": 0,
            "cumulative_read_bytes": LOG_READ_TOTAL,
        }
    files = []
    call_read_total = 0
    with os.scandir(log_dir) as entries:
        ordered = sorted(list(entries), key=lambda item: item.name.lower())
    for entry in ordered:
        info = entry.stat(follow_symlinks=False)
        row = {
            "name": entry.name,
            "bytes": int(info.st_size),
            "regular_file": stat.S_ISREG(info.st_mode),
            "reparse_point": bool(
                getattr(info, "st_file_attributes", 0) & FILE_ATTRIBUTE_REPARSE_POINT
            ),
        }
        if row["regular_file"] and not row["reparse_point"]:
            if LOG_READ_TOTAL + row["bytes"] <= LOG_READ_BUDGET:
                row["sha256"] = sha256_file(entry.path)
                LOG_READ_TOTAL += row["bytes"]
                call_read_total += row["bytes"]
                row["read_status"] = "HASHED"
            else:
                row["read_status"] = "READ_BUDGET_SKIPPED"
        files.append(row)
    return {
        "directory": log_dir,
        "exists": True,
        "files": files,
        "call_read_bytes": call_read_total,
        "cumulative_read_bytes": LOG_READ_TOTAL,
        "read_budget_bytes": LOG_READ_BUDGET,
    }


def post_once(request_body: bytes, deadline: float) -> dict:
    remaining = min(HTTP_TIMEOUT_MAX_SECONDS, deadline - time.monotonic())
    if remaining <= 0:
        raise ControllerError("no positive primary-budget time remains for HTTP")
    hard_deadline = time.monotonic() + remaining
    connection = http.client.HTTPConnection(POST_HOST, POST_PORT, timeout=remaining)
    started = time.monotonic()
    status_code = 0
    reason = ""
    headers = []
    chunks = []
    error = None
    try:
        connection.request(
            "POST",
            POST_PATH,
            body=request_body,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        response = connection.getresponse()
        status_code = int(response.status)
        reason = response.reason
        allowed_header_values = {"content-type", "content-length"}
        headers = [
            {
                "name": name,
                "value": header_value if name.lower() in allowed_header_values else None,
            }
            for name, header_value in response.getheaders()
        ]
        while True:
            read_remaining = hard_deadline - time.monotonic()
            if read_remaining <= 0:
                raise ControllerError("HTTP response body exceeded primary-budget deadline")
            if connection.sock is not None:
                connection.sock.settimeout(min(read_remaining, 2.0))
            chunk = response.read(65536)
            if not chunk:
                break
            chunks.append(chunk)
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"
    finally:
        connection.close()
    body = b"".join(chunks)
    return {
        "endpoint": f"http://{POST_HOST}:{POST_PORT}{POST_PATH}",
        "attempts": 1,
        "status": status_code,
        "reason": reason,
        "headers": headers,
        "body_bytes": len(body),
        "body_sha256": sha256_bytes(body),
        "elapsed_ms": round((time.monotonic() - started) * 1000, 3),
        "body": body,
        "error": error,
    }


def process_missing_or_identity_absent(pid: int, old_identity: dict) -> dict:
    try:
        actual = process_identity(pid)
    except ControllerError as exc:
        message = str(exc)
        process_not_found = "WinError 87" in message or "WinError 1168" in message
        return {
            "pid": pid,
            "old_identity_absent": process_not_found,
            "observation": (
                "PROCESS_NOT_FOUND" if process_not_found else "ABSENCE_NOTPROVEN"
            ),
            "error": message,
        }
    same = identity_matches(actual, old_identity)
    return {
        "pid": pid,
        "old_identity_absent": not same,
        "actual": actual,
        "observation": "IDENTITY_PRESENT" if same else "PID_REUSED_BY_DIFFERENT_IDENTITY",
    }


def register_owned(label: str, identity: dict) -> None:
    """Register an owned process identity under a service label and generation."""
    generation = CURRENT_GENERATION.get(label, 0)
    rows = OWNED_REGISTRY.setdefault((label, generation), [])
    key = (int(identity["pid"]), int(identity["creation_filetime"]))
    for row in rows:
        if (int(row["pid"]), int(row["creation_filetime"])) == key:
            return
    rows.append(
        {
            "pid": int(identity["pid"]),
            "exe": str(identity["exe"]),
            "creation_filetime": int(identity["creation_filetime"]),
            "registered_utc": utc_now(),
            "label": label,
            "generation": generation,
        }
    )


def begin_generation(label: str) -> int:
    """Open a new tracked generation for a service label."""
    generation = GENERATION_COUNTER.get(label, 0)
    GENERATION_COUNTER[label] = generation + 1
    CURRENT_GENERATION[label] = generation
    return generation


def owned_rows(label: str, generation: int) -> list:
    return list(OWNED_REGISTRY.get((label, generation), []))


def owned_generations(label: str) -> list:
    return sorted(
        generation for (row_label, generation) in OWNED_REGISTRY if row_label == label
    )


def owned_rows_for_generations(label: str, generations: list) -> list:
    rows = []
    for generation in generations:
        rows.extend(owned_rows(label, generation))
    return rows


def stale_generations(label: str) -> list:
    """All tracked generations of a label except the currently live one."""
    current = CURRENT_GENERATION.get(label)
    return [
        generation
        for generation in owned_generations(label)
        if generation != current
    ]


def live_generation_present(label: str) -> dict:
    """Check that the currently live generation's identities really exist."""
    current = CURRENT_GENERATION.get(label)
    if current is None:
        return {"label": label, "live_generation": None, "all_present": False}
    rows = owned_rows(label, current)
    observations = [
        process_missing_or_identity_absent(int(row["pid"]), row) for row in rows
    ]
    return {
        "label": label,
        "live_generation": current,
        "tracked": len(observations),
        "all_present": bool(observations)
        and all(not row["old_identity_absent"] for row in observations),
        "observations": observations,
    }


def capture_and_register_service_tree(label: str, service_pid: int) -> dict:
    """Capture the live descendants of a just-started service and register them.

    The capture is best effort. A failed or missing capture is recorded as
    PARTIAL_NOTPROVEN and never upgraded to a whole-tree proof.
    """
    capture = capture_descendants(service_pid)
    if capture["proof"] != "SNAPSHOT_CAPTURED":
        OWNED_CAPTURE_GAPS.append(
            {
                "label": label,
                "service_pid": service_pid,
                "utc": utc_now(),
                "proof": capture["proof"],
                "errors": capture["errors"],
                "snapshot_error": capture["snapshot_error"],
            }
        )
    for row in capture["descendants"]:
        register_owned(label, row)
    return capture


def register_direct_owned(label: str, identity: dict) -> None:
    """Register a direct (non-wrapper) owned identity under its own label."""
    register_owned(label, identity)


def owned_absence_snapshot(labels: list, generations: dict) -> dict:
    """Observe the tracked identities of the given generations.

    Only the explicitly named generations are observed, so a generation that
    is expected to be alive right now is never mistaken for a leak.
    """
    per_label = {}
    for label in labels:
        rows = []
        for generation in generations.get(label, []):
            for row in owned_rows(label, generation):
                rows.append(
                    {
                        "observation": process_missing_or_identity_absent(
                            int(row["pid"]), row
                        ),
                        "generation": generation,
                    }
                )
        per_label[label] = rows
    all_rows = []
    for label in labels:
        all_rows.extend(per_label[label])
    still_present = [
        row for row in all_rows if not row["observation"]["old_identity_absent"]
    ]
    unproven = [
        row
        for row in all_rows
        if not row["observation"]["old_identity_absent"]
        and row["observation"].get("observation") == "ABSENCE_NOTPROVEN"
    ]
    return {
        "labels": list(labels),
        "generations": {label: list(generations.get(label, [])) for label in labels},
        "per_label": per_label,
        "tracked": len(all_rows),
        "still_present": still_present,
        "absence_pass": not still_present,
        "absence_proof": "PROVEN" if not still_present else "NOTPROVEN",
        "unproven_rows": unproven,
    }


def require_owned_absent(
    labels: list, generations: dict, deadline: float, phase: str
) -> dict:
    """Wait, bounded by the caller's deadline, until the tracked identities are gone.

    If the identities are still present when the bound expires the caller must
    NOT start another process and must NOT force kill anything.
    """
    last = None
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise ControllerError(
                f"{phase}: owned identities for {labels} are still present; "
                "no new process is started and nothing is force killed"
            )
        last = owned_absence_snapshot(labels, generations)
        if last["absence_pass"]:
            return last
        time.sleep(min(POLL_SECONDS, max(0.0, deadline - time.monotonic())))


def start_after_absence(
    label: str,
    endpoint: tuple[str, int, str],
    deadline: float,
) -> dict:
    """Prove the previous generation is gone, then start exactly one service.

    The absence proof GATES the start. If the proof cannot be made, this
    raises and the service is not started, so no second GPU or helper
    process is ever created and nothing is force killed.

    The absence proof gets its own bounded slice so it can never eat the
    whole budget that the start and the health check need.
    """
    absence_deadline = min(deadline, time.monotonic() + 15.0)
    absence = require_owned_absent(
        [label],
        {label: owned_generations(label)},
        absence_deadline,
        f"before start of {label}",
    )
    begin_generation(label)
    started = start_and_check(label, endpoint, deadline)
    started["absence_before_start"] = absence
    return started


def restore(
    admission: dict,
    original_bytes: bytes,
    overall_deadline: float,
) -> dict:
    started = time.monotonic()
    started_wall = utc_now()
    restore_deadline = min(
        started + RESTORE_RESERVE_SECONDS,
        overall_deadline,
    )
    steps = []
    errors = []

    def step(name: str, function):
        phase_started = time.monotonic()
        try:
            result_value = function()
            steps.append(
                {
                    "step": name,
                    "status": "PASS",
                    "elapsed_ms": round((time.monotonic() - phase_started) * 1000, 3),
                    "result": result_value,
                }
            )
            persist_result()
            return result_value
        except BaseException as exc:
            # A failing restore step must not stop the remaining restore steps.
            errors.append({"step": name, "error": f"{type(exc).__name__}: {exc}"})
            steps.append(
                {
                    "step": name,
                    "status": "FAIL",
                    "elapsed_ms": round((time.monotonic() - phase_started) * 1000, 3),
                    "error": str(exc),
                }
            )
            persist_result()
            return None

    step(
        "stop-api",
        lambda: stop_if_needed(SERVICE_API, min(restore_deadline, time.monotonic() + 25)),
    )
    step(
        "stop-ocr",
        lambda: stop_if_needed(SERVICE_OCR, min(restore_deadline, time.monotonic() + 25)),
    )

    def restore_xml():
        current_size = os.stat(XML_PATH, follow_symlinks=False).st_size
        current_digest = sha256_file(XML_PATH)
        if current_size == XML_BYTES and current_digest.lower() == XML_SHA256:
            return {"write": "NOT_NEEDED_ALREADY_ORIGINAL"}
        outcome = write_file_in_place(XML_PATH, original_bytes, "original XML")
        try:
            outcome.update(restore_file_times(XML_PATH, admission["xml_original_times"]))
        except Exception as exc:
            outcome["timestamp_restore_error"] = f"{type(exc).__name__}: {exc}"
        restored = require_file_identity(XML_PATH, XML_BYTES, XML_SHA256, "restored XML")
        if restored != original_bytes:
            raise ControllerError("restored XML bytes differ from original")
        outcome["bytes_match_original"] = True
        return outcome

    step("restore-original-xml", restore_xml)

    # Before any planned start in the restore path, prove that the identities
    # captured for that service in the previous generation are really gone.
    # If they are not gone, nothing is force killed and no second process is
    # started.
    step(
        "start-ocr-and-health",
        lambda: start_after_absence(
            SERVICE_OCR,
            OCR_HEALTH,
            min(restore_deadline, time.monotonic() + 45),
        ),
    )
    step(
        "start-api-and-health",
        lambda: start_after_absence(
            SERVICE_API,
            API_HEALTH,
            min(restore_deadline, time.monotonic() + 25),
        ),
    )

    final_checks = {}

    def final_check(name: str, function):
        """Run one final check; a failure never hides the other checks."""
        try:
            value = function()
            final_checks[name] = value
            return value
        except Exception as exc:
            errors.append({"step": f"final-check:{name}", "error": f"{type(exc).__name__}: {exc}"})
            final_checks[name] = {"error": f"{type(exc).__name__}: {exc}"}
            return None

    try:
        def check_xml():
            xml_now = require_file_identity(XML_PATH, XML_BYTES, XML_SHA256, "final XML")
            return {
                "exact": xml_now == original_bytes,
                "bytes": len(xml_now),
                "sha256": sha256_bytes(xml_now),
            }

        xml_result = final_check("xml_exact", check_xml)
        if xml_result is not None:
            final_checks["xml_exact"] = xml_result["exact"]

        final_check("ocr_service", lambda: service_snapshot(SERVICE_OCR))
        final_check("api_service", lambda: service_snapshot(SERVICE_API))
        final_check("llm9b_service", lambda: service_snapshot(SERVICE_LLM9B))
        final_check("ocr_health", lambda: wait_health(OCR_HEALTH, restore_deadline, "OCR final health"))
        final_check("api_health", lambda: wait_health(API_HEALTH, restore_deadline, "API final health"))

        expected_9b = admission["services"][SERVICE_LLM9B]
        final_check("llm9b_wrapper", lambda: require_expected_process(expected_9b, "9B wrapper"))
        expected_9b_direct = next(
            row for row in admission["direct_processes"] if row["role"] == "llm9b-native"
        )
        final_check("llm9b_direct", lambda: require_expected_process(expected_9b_direct, "9B native"))

        def check_9b_pid():
            service = final_checks.get("llm9b_service")
            if not isinstance(service, dict) or "pid" not in service:
                raise ControllerError("9B SCM state was not observed")
            if service["pid"] != int(expected_9b["pid"]):
                raise ControllerError("9B SCM PID changed during maintenance")
            return {
                "pid": service["pid"],
                "state": service.get("state"),
                "unchanged": service["state"] == SERVICE_RUNNING,
            }

        llm9b_result = final_check("llm9b_service_unchanged", check_9b_pid)
        if llm9b_result is not None:
            final_checks["llm9b_service_unchanged"] = llm9b_result["unchanged"]

        # The ORIGINAL and every intermediate generation must be gone. The
        # currently live generation is expected to be running and is checked
        # separately.
        final_generations = {
            label: stale_generations(label) for label in AUTHORIZED_SERVICES
        }
        absence = final_check(
            "old_owned_identities",
            lambda: owned_absence_snapshot(list(AUTHORIZED_SERVICES), final_generations),
        )
        if absence is not None:
            final_checks["old_owned_absence_pass"] = bool(absence["absence_pass"])
        final_checks["live_owned_identities"] = {
            label: live_generation_present(label)
            for label in AUTHORIZED_SERVICES
        }
        final_checks["owned_capture_gaps"] = list(OWNED_CAPTURE_GAPS)
        final_checks["owned_capture_complete"] = not OWNED_CAPTURE_GAPS
        final_check(
            "ocr_final_descendants",
            lambda: capture_descendants(final_checks["ocr_service"]["pid"]),
        )
        final_check(
            "api_final_descendants",
            lambda: capture_descendants(final_checks["api_service"]["pid"]),
        )
        final_check("owned_log_files", lambda: capture_owned_logs(admission["log_dir"]))
        final_checks["restored_endpoints"] = {
            "ocr": {"host": OCR_HEALTH[0], "port": OCR_HEALTH[1], "health": OCR_HEALTH[2]},
            "api": {"host": API_HEALTH[0], "port": API_HEALTH[1], "health": API_HEALTH[2]},
        }
    except Exception as exc:
        errors.append({"step": "final-checks", "error": f"{type(exc).__name__}: {exc}"})
        final_checks["exception"] = str(exc)

    pass_checks = (
        not errors
        and final_checks.get("xml_exact") is True
        and final_checks.get("ocr_service", {}).get("state") == SERVICE_RUNNING
        and final_checks.get("api_service", {}).get("state") == SERVICE_RUNNING
        and final_checks.get("old_owned_absence_pass") is True
        and final_checks.get("llm9b_service_unchanged") is True
    )
    summary = {
        "status": "PASS" if pass_checks else "FAIL",
        "started_utc": started_wall,
        "finished_utc": utc_now(),
        "elapsed_ms": round((time.monotonic() - started) * 1000, 3),
        "steps": steps,
        "errors": errors,
        "final_checks": final_checks,
    }
    add_phase("restore-and-final-verification", summary["status"], result=summary)
    return summary


def xml_is_original() -> bool:
    """True when the XML file already holds exactly the original bytes."""
    try:
        info = os.stat(XML_PATH, follow_symlinks=False)
        if info.st_size != XML_BYTES:
            return False
        return sha256_file(XML_PATH).lower() == XML_SHA256
    except OSError:
        return False


def verify_without_mutation(admission: dict) -> dict:
    """Truthful verification when no service was actually taken down.

    This path never stops or starts anything. It only reports the observed
    states and configuration, so a failed stop dispatch cannot be turned into
    a fabricated outage or a fabricated success.
    """
    final_checks = {}
    errors = []

    def observe(name: str, function):
        try:
            final_checks[name] = function()
        except Exception as exc:
            errors.append({"step": name, "error": f"{type(exc).__name__}: {exc}"})
            final_checks[name] = {"error": f"{type(exc).__name__}: {exc}"}

    observe("ocr_service", lambda: service_snapshot(SERVICE_OCR))
    observe("api_service", lambda: service_snapshot(SERVICE_API))
    observe("llm9b_service", lambda: service_snapshot(SERVICE_LLM9B))
    observe("xml_is_original", xml_is_original)
    observe("ocr_health", lambda: health_once(OCR_HEALTH, 2.0))
    observe("api_health", lambda: health_once(API_HEALTH, 2.0))
    observe(
        "old_owned_identities",
        lambda: owned_absence_snapshot(
            list(AUTHORIZED_SERVICES),
            {label: stale_generations(label) for label in AUTHORIZED_SERVICES},
        ),
    )
    observe(
        "live_owned_identities",
        lambda: {label: live_generation_present(label) for label in AUTHORIZED_SERVICES},
    )
    ocr_state = final_checks.get("ocr_service", {}).get("state")
    api_state = final_checks.get("api_service", {}).get("state")
    intact = (
        ocr_state == SERVICE_RUNNING
        and api_state == SERVICE_RUNNING
        and final_checks.get("xml_is_original") is True
    )
    summary = {
        "status": "PASS" if (intact and not errors) else "FAIL",
        "mode": "VERIFY_ONLY_NO_MUTATION",
        "started_utc": utc_now(),
        "finished_utc": utc_now(),
        "steps": [],
        "errors": errors,
        "final_checks": final_checks,
    }
    add_phase("restore-and-final-verification", summary["status"], result=summary)
    return summary


def run_maintenance(admission: dict) -> dict:
    global RESULT_PATH
    stage = admission["stage"]
    run_dir = admission["run_dir"]
    os.makedirs(run_dir, exist_ok=False)
    RESULT_PATH = os.path.join(run_dir, "result.json")
    RESULT["started_utc"] = utc_now()
    RESULT["admission"] = {
        "verdict": ADMISSION_VERDICT,
        "fresh_id": admission["fresh_id"],
        "stage": stage,
        "authorized_services": list(AUTHORIZED_SERVICES),
    }
    # Mandatory first durable evidence: if this cannot be written the run is
    # aborted BEFORE the first stop, so no service is ever taken down without
    # durable evidence on disk.
    persist_result_strict()
    add_phase("run-output-created", "PASS", path=run_dir)

    original_bytes = require_file_identity(XML_PATH, XML_BYTES, XML_SHA256, "original XML")
    if original_bytes is None:
        raise ControllerError("original XML could not be captured as bytes")
    original_path = os.path.join(run_dir, "original-ocr.xml")
    durable_write_bytes(original_path, original_bytes)
    xml_stat = os.stat(XML_PATH, follow_symlinks=False)
    admission["xml_original_times"] = {
        "atime_ns": int(xml_stat.st_atime_ns),
        "mtime_ns": int(xml_stat.st_mtime_ns),
    }
    add_phase(
        "preflight-and-save-original-xml",
        "PASS",
        original_xml={
            "path": original_path,
            "bytes": len(original_bytes),
            "sha256": sha256_bytes(original_bytes),
        },
        xml_original_times=admission["xml_original_times"],
    )
    validate_original_xml(original_bytes)

    initial = {}
    for service_name in (SERVICE_API, SERVICE_OCR, SERVICE_LLM9B):
        initial[service_name] = service_identity_check(
            service_name,
            admission["services"][service_name],
        )
    observed_direct = verify_direct_processes(admission, initial)
    controller_identity = process_identity(os.getpid())
    add_phase(
        "runtime-identity-preflight",
        "PASS",
        services=initial,
        direct_processes=observed_direct,
        controller=controller_identity,
        proof_scope="SCM/Kernel32 wrapper required; Toolhelp32 descendants PARTIAL_NOTPROVEN",
    )

    # Register the ORIGINAL owned identities of the two authorized services
    # (generation 0) so that their absence can be proven later.
    old_identities = []
    for service_name in AUTHORIZED_SERVICES:
        generation = begin_generation(service_name)
        old_identities.append(initial[service_name]["wrapper"])
        register_owned(service_name, initial[service_name]["wrapper"])
        for row in initial[service_name]["descendants"]["descendants"]:
            register_owned(service_name, row)
    # The direct native/Python children are tracked under their owning
    # service label so their absence is covered by the same guard.
    register_direct_owned("api-python", observed_direct["api-python"])
    register_direct_owned("ocr-native", observed_direct["ocr-native"])
    old_identities.extend([observed_direct["api-python"], observed_direct["ocr-native"]])
    register_owned(SERVICE_API, observed_direct["api-python"])
    register_owned(SERVICE_OCR, observed_direct["ocr-native"])
    RESULT["old_identities"] = [
        {
            "pid": int(row["pid"]),
            "exe": str(row["exe"]),
            "creation_filetime": int(row["creation_filetime"]),
        }
        for row in old_identities
    ]

    main_error = None
    http_result = None
    first_stop_at = None
    main_deadline = None
    restore_result = None
    stop_dispatched = False
    try:
        # The single monotonic 300 s deadline is set IMMEDIATELY BEFORE the
        # first stop dispatch, because ControlService may block. It is never
        # reset afterwards and never restarted during cleanup.
        stop_dispatch_started_at = time.monotonic()
        first_stop_at = stop_dispatch_started_at
        RESULT["first_stop_utc"] = utc_now()
        main_deadline = min(
            first_stop_at + MAIN_PHASE_SECONDS,
            first_stop_at + PRIMARY_BUDGET_SECONDS - RESTORE_RESERVE_SECONDS,
        )
        RESULT["budget"]["first_stop_monotonic"] = first_stop_at
        RESULT["budget"]["main_deadline_monotonic"] = main_deadline
        RESULT["budget"]["overall_deadline_monotonic"] = (
            first_stop_at + PRIMARY_BUDGET_SECONDS
        )
        RESULT["budget"]["stop_dispatch_started_monotonic"] = stop_dispatch_started_at
        add_phase("stop-deadline-armed", "PASS", main_deadline_monotonic=main_deadline)

        api_before = dispatch_stop(SERVICE_API)
        stop_dispatched = True
        add_phase("stop-api-dispatch", "PASS", before=api_before)
        api_stopped = wait_service_state(SERVICE_API, SERVICE_STOPPED, main_deadline)
        add_phase("stop-api", "PASS", after=api_stopped)

        ocr_before = dispatch_stop(SERVICE_OCR)
        add_phase("stop-ocr-dispatch", "PASS", before=ocr_before)
        ocr_stopped = wait_service_state(SERVICE_OCR, SERVICE_STOPPED, main_deadline)
        add_phase("stop-ocr", "PASS", after=ocr_stopped)

        if time.monotonic() >= main_deadline:
            raise ControllerError("main phase deadline reached before config mutation")
        os.mkdir(admission["log_dir"])
        add_phase("create-owned-log-directory", "PASS", path=admission["log_dir"])
        modified_bytes = build_modified_xml(original_bytes, admission["log_dir"])
        modified_evidence_path = os.path.join(run_dir, "modified-ocr.xml")
        durable_write_bytes(modified_evidence_path, modified_bytes)
        # The XML is rewritten INSIDE the existing file. No os.replace,
        # rename, unlink, chmod or ACL call is used on it, so the service
        # keeps reading the same file object with the same security
        # descriptor.
        write_file_in_place(XML_PATH, modified_bytes, "modified XML")
        current_modified = require_file_identity(
            XML_PATH,
            os.stat(XML_PATH).st_size,
            sha256_file(XML_PATH),
            "modified XML",
        )
        if current_modified != modified_bytes:
            raise ControllerError("modified XML verification mismatch")
        add_phase(
            "apply-log-configuration",
            "PASS",
            xml_bytes=len(modified_bytes),
            xml_sha256=sha256_bytes(modified_bytes),
            modified_evidence_path=modified_evidence_path,
            log_dir=admission["log_dir"],
            args_delta=[
                "--log-disable",
                "--log-verbosity 1 --log-prefix --log-timestamps --log-colors off",
            ],
            log_mode="roll-by-size:1024:keep2",
            xml_write="IN_PLACE_SAME_FILE",
        )

        if time.monotonic() >= main_deadline:
            raise ControllerError("main phase deadline reached before OCR start")
        # Prove the previous generation of OCR identities is really gone
        # before starting another OCR process. Nothing is force killed.
        ocr_started = start_after_absence(
            SERVICE_OCR,
            OCR_HEALTH,
            min(main_deadline, time.monotonic() + 45),
        )
        add_phase("start-maintenance-ocr-and-health", "PASS", result=ocr_started)

        if time.monotonic() >= main_deadline:
            raise ControllerError("main phase deadline reached before API start")
        api_started = start_after_absence(
            SERVICE_API,
            API_HEALTH,
            min(main_deadline, time.monotonic() + 30),
        )
        add_phase("start-maintenance-api-and-health", "PASS", result=api_started)

        http_result = post_once(admission["request_body"], main_deadline)
        raw_body = http_result.pop("body")
        http_error = http_result.pop("error")
        RESULT["http"] = http_result
        add_phase(
            "single-native-http-post",
            (
                "HTTP_ERROR"
                if http_error
                else "PASS"
                if 200 <= http_result["status"] < 300
                else "HTTP_NON_2XX"
            ),
            result=http_result,
        )
        raw_path = os.path.join(run_dir, "http-raw-response.bin")
        durable_write_bytes(raw_path, raw_body)
        http_result["raw_body_path"] = raw_path
        RESULT["http"] = http_result
        add_phase("persist-raw-http-response", "PASS", path=raw_path)
        logs_after_main = capture_owned_logs(admission["log_dir"])
        RESULT["logs_after_main"] = logs_after_main
        add_phase("capture-owned-log-metadata-main", "PASS", result=logs_after_main)
        if http_error:
            raise ControllerError(f"single HTTP attempt failed: {http_error}")
    except BaseException as exc:
        main_error = exc
        add_error("main-phase", exc)
        add_phase(
            "main-phase",
            "FAIL",
            error=f"{type(exc).__name__}: {exc}",
            traceback=traceback.format_exc(),
        )
    finally:
        # Unavoidable restoration. It runs on every exit path of the try
        # block, including BaseException and control-flow errors, and it is
        # never skipped by a diagnostic write failure.
        if first_stop_at is None:
            restore_result = {
                "status": "NOT_REQUIRED_NO_STOP_DISPATCH",
                "steps": [],
                "errors": [],
                "final_checks": {},
            }
            add_phase("restore-and-final-verification", "NOT_REQUIRED_NO_STOP_DISPATCH")
        else:
            if stop_dispatched:
                try:
                    restore_result = restore(
                        admission,
                        original_bytes,
                        first_stop_at + PRIMARY_BUDGET_SECONDS,
                    )
                except BaseException as exc:
                    restore_result = {
                        "status": "FAIL",
                        "steps": [],
                        "errors": [
                            {"step": "restore-outer", "error": f"{type(exc).__name__}: {exc}"}
                        ],
                        "final_checks": {},
                    }
                    add_error("restore-outer", exc)
                    add_phase("restore-and-final-verification", "FAIL", error=str(exc))
            else:
                # The stop dispatch itself failed, so nothing was taken down.
                # Only the real state is observed; no service is stopped or
                # started here, so no outage and no success is fabricated.
                RESULT["stop_dispatch_failed"] = True
                try:
                    restore_result = verify_without_mutation(admission)
                except BaseException as exc:
                    restore_result = {
                        "status": "FAIL",
                        "mode": "VERIFY_ONLY_NO_MUTATION",
                        "steps": [],
                        "errors": [
                            {"step": "verify-outer", "error": f"{type(exc).__name__}: {exc}"}
                        ],
                        "final_checks": {},
                    }
                    add_error("verify-outer", exc)
                    add_phase("restore-and-final-verification", "FAIL", error=str(exc))

    RESULT["cleanup"] = restore_result
    RESULT["persist_failures"] = list(PERSIST_FAILURES)
    RESULT["owned_capture_gaps"] = list(OWNED_CAPTURE_GAPS)
    if restore_result["status"] == "FAIL":
        RESULT["verdict"] = (
            "STOP_DISPATCH_FAILED_NO_MUTATION"
            if RESULT.get("stop_dispatch_failed")
            else "RESTORE_FAILED"
        )
    elif first_stop_at is None:
        RESULT["verdict"] = "PREFLIGHT_FAILED_NO_MUTATION"
    elif main_error is not None:
        RESULT["verdict"] = "MAIN_ERROR_RESTORED_ROOTCAUSE_NOTPROVEN"
    elif int(http_result["status"]) == 200:
        RESULT["verdict"] = "HTTP_200_RESTORED_INTERFACE_SAMPLE_ONLY_ROOTCAUSE_NOTPROVEN"
    elif int(http_result["status"]) == 500:
        RESULT["verdict"] = "HTTP_500_RESTORED_ROOTCAUSE_NOTPROVEN"
    else:
        RESULT["verdict"] = f"HTTP_{int(http_result['status'])}_RESTORED_ROOTCAUSE_NOTPROVEN"
    RESULT["finished_utc"] = utc_now()
    persist_result()
    return {
        "verdict": RESULT["verdict"],
        "result_path": RESULT_PATH,
        "http_status": None if http_result is None else http_result["status"],
        "restore_status": restore_result["status"],
    }


def main() -> int:
    try:
        admission = admit()
    except Exception as exc:
        print(
            json.dumps(
                {
                    "verdict": "ADMISSION_REFUSED",
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
                ensure_ascii=False,
            )
        )
        return 2

    try:
        summary = run_maintenance(admission)
        print(json.dumps(summary, ensure_ascii=False))
    except Exception as exc:
        try:
            add_error("controller-outer", exc)
            RESULT["verdict"] = "CONTROLLER_OUTER_FAILURE"
            RESULT["finished_utc"] = utc_now()
            persist_result()
        except Exception:
            pass
        print(
            json.dumps(
                {
                    "verdict": "CONTROLLER_OUTER_FAILURE",
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
                ensure_ascii=False,
            )
        )
        return 3
    if summary["verdict"] == "HTTP_200_RESTORED_INTERFACE_SAMPLE_ONLY_ROOTCAUSE_NOTPROVEN":
        return 0
    if summary["verdict"].startswith("HTTP_"):
        return 5
    if summary["verdict"].startswith("PREFLIGHT_"):
        return 2
    if summary["verdict"] == "STOP_DISPATCH_FAILED_NO_MUTATION":
        return 6
    return 4


if __name__ == "__main__":
    raise SystemExit(main())
