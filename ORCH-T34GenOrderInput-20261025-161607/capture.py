"""有界只读验证：仅在 root 完整审阅本文件后运行，不运行原始 generator。"""

from collections import Counter
import hashlib
import io
import json
import os
import pathlib
import runpy
from contextlib import redirect_stdout
from unittest import mock


SOURCE_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\contracts\_build\gen_examples.py"
)
EXPECTED_SOURCE_SHA256 = (
    "6e7d786c983386f846326db019d4515693bf413d0db0bed4775f73688d648fde"
)
EX_DIR = pathlib.Path(r"D:\Lawbeach\lawbench-A\contracts\examples")
FACTS_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\ORCH-T34ExampleGenInput-20261025-160738\facts.json"
)
EXPECTED_JSON_COUNT = 105


class CaptureRefused(RuntimeError):
    """生成源未满足只读捕获的前置条件。"""


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    return sha256_bytes(path.read_bytes())


def snapshot_current():
    paths = sorted(EX_DIR.glob("*.json"), key=lambda path: path.name)
    if len(paths) != EXPECTED_JSON_COUNT:
        raise CaptureRefused(
            f"当前 EX JSON 数为 {len(paths)}，要求 {EXPECTED_JSON_COUNT}"
        )

    names = [path.name for path in paths]
    hashes = {path.name: sha256_file(path) for path in paths}
    pin_doc = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    if pathlib.Path(pin_doc["EX"]) != EX_DIR:
        raise CaptureRefused("facts.EX 与固定 EX 路径不一致")
    pins = {
        name: value.lower()
        for name, value in pin_doc["current_corpus_sha256"].items()
    }
    if set(names) != set(pins):
        raise CaptureRefused("当前 EX 文件集合与 facts pins 不一致")
    mismatches = sorted(name for name in names if hashes[name] != pins[name])
    if mismatches:
        raise CaptureRefused("当前 EX SHA 与 facts pins 不一致：" + ", ".join(mismatches))

    raw = {path.name: path.read_bytes() for path in paths}
    try:
        objects = {
            name: json.loads(raw[name].decode("utf-8"))
            for name in names
        }
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CaptureRefused("当前 EX 无法按 UTF-8 JSON 读取：" + str(exc)) from exc
    return names, hashes, objects, raw


def capture_generated(current_names):
    captured_text = {}
    write_order = []
    blocked = Counter()

    def guarded_mkdir(self, *args, **kwargs):
        if self != EX_DIR:
            raise CaptureRefused(f"拒绝 mkdir：{self}")
        blocked["mkdir"] += 1
        return None

    def guarded_glob(self, pattern):
        if self != EX_DIR or pattern != "*.json":
            raise CaptureRefused(f"拒绝 glob：{self} / {pattern!r}")
        blocked["glob"] += 1
        return iter(())

    def guarded_unlink(self, *args, **kwargs):
        blocked["unlink"] += 1
        raise CaptureRefused(f"拒绝 unlink：{self}")

    def guarded_write_text(
        self, data, encoding=None, errors=None, newline=None
    ):
        if self.parent != EX_DIR or self.suffix != ".json" or self.name in ("", ".", ".."):
            raise CaptureRefused(f"拒绝 write_text：{self}")
        if not isinstance(data, str):
            raise CaptureRefused(f"write_text 数据不是字符串：{self}")
        if encoding not in (None, "utf-8") or errors is not None or newline is not None:
            raise CaptureRefused(f"拒绝非 UTF-8 write_text 参数：{self}")
        if self.name in captured_text:
            raise CaptureRefused(f"拒绝重复写对象：{self.name}")
        if len(captured_text) >= EXPECTED_JSON_COUNT:
            raise CaptureRefused("内存写对象超过 105 件")
        blocked["write_text"] += 1
        captured_text[self.name] = data
        write_order.append(self.name)
        return len(data)

    real_methods = (
        pathlib.Path.mkdir,
        pathlib.Path.glob,
        pathlib.Path.unlink,
        pathlib.Path.write_text,
    )
    generator_stdout = io.StringIO()
    with mock.patch.object(pathlib.Path, "mkdir", guarded_mkdir), \
            mock.patch.object(pathlib.Path, "glob", guarded_glob), \
            mock.patch.object(pathlib.Path, "unlink", guarded_unlink), \
            mock.patch.object(pathlib.Path, "write_text", guarded_write_text):
        with redirect_stdout(generator_stdout):
            runpy.run_path(str(SOURCE_PATH), run_name="T34_memory_capture")

    restored_methods = (
        pathlib.Path.mkdir,
        pathlib.Path.glob,
        pathlib.Path.unlink,
        pathlib.Path.write_text,
    )
    if restored_methods != real_methods:
        raise RuntimeError("pathlib.Path 方法未完整恢复")
    if generator_stdout.getvalue() != "104 examples\n":
        raise RuntimeError(
            "generator print 与预期不符：" + repr(generator_stdout.getvalue())
        )
    if set(write_order) != set(current_names):
        raise CaptureRefused("内存捕获对象集合与当前 EX 文件集合不一致")
    return captured_text, write_order, dict(blocked)


def build_report():
    source_hash_before = sha256_file(SOURCE_PATH)
    if source_hash_before != EXPECTED_SOURCE_SHA256:
        raise CaptureRefused("生成源 SHA 与 capture 固定值不一致")

    current_names, current_hashes, current_objects, current_bytes = snapshot_current()
    captured_text, write_order, blocked = capture_generated(current_names)
    generated_objects = {
        name: json.loads(text)
        for name, text in captured_text.items()
    }

    all_names = sorted(set(current_objects) | set(generated_objects))
    semantic_diffs = []
    for name in all_names:
        if name not in current_objects:
            semantic_diffs.append({"file": name, "kind": "missing_current"})
        elif name not in generated_objects:
            semantic_diffs.append({"file": name, "kind": "missing_generated"})
        elif current_objects[name] != generated_objects[name]:
            semantic_diffs.append({"file": name, "kind": "object_mismatch"})

    current_manifest = current_objects.get("manifest.json")
    generated_manifest = generated_objects.get("manifest.json")
    manifest_equal = (
        isinstance(current_manifest, list)
        and isinstance(generated_manifest, list)
        and len(current_manifest) == 104
        and len(generated_manifest) == 104
        and current_manifest == generated_manifest
    )

    after_paths = sorted(EX_DIR.glob("*.json"), key=lambda path: path.name)
    after_hashes = {path.name: sha256_file(path) for path in after_paths}
    actual_files_unchanged = (
        [path.name for path in after_paths] == current_names
        and after_hashes == current_hashes
    )
    source_hash_after = sha256_file(SOURCE_PATH)

    source_text_diffs = []
    native_newline_diffs = []
    for name in all_names:
        if name not in captured_text or name not in current_bytes:
            source_text_diffs.append(name)
            native_newline_diffs.append(name)
            continue
        text = captured_text[name]
        if text.encode("utf-8") != current_bytes[name]:
            source_text_diffs.append(name)
        predicted_native = text.replace("\n", os.linesep).encode("utf-8")
        if predicted_native != current_bytes[name]:
            native_newline_diffs.append(name)

    all_checks_passed = (
        len(generated_objects) == EXPECTED_JSON_COUNT
        and len(write_order) == EXPECTED_JSON_COUNT
        and not semantic_diffs
        and manifest_equal
        and actual_files_unchanged
        and source_hash_after == source_hash_before
    )
    return {
        "generated": len(generated_objects),
        "manifest": len(generated_manifest) if isinstance(generated_manifest, list) else None,
        "semantic_diffs": semantic_diffs,
        "manifest_equal": manifest_equal,
        "actual_files_unchanged": actual_files_unchanged,
        "blocked_real_writes": blocked,
        "byte_prediction_diffs": {
            "captured_text_utf8": source_text_diffs,
            "write_text_default_newline": native_newline_diffs,
        },
        "all_checks_passed": all_checks_passed,
    }


def main():
    try:
        report = build_report()
    except CaptureRefused as exc:
        print(json.dumps(
            {"refused": True, "error": str(exc)},
            ensure_ascii=False,
            separators=(",", ":"),
        ))
        return 2
    print(json.dumps(report, ensure_ascii=False, separators=(",", ":")))
    return 0 if report["all_checks_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
