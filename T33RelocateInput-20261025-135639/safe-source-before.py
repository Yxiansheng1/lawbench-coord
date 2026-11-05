import argparse
import hashlib
import json
import os
import pathlib
import re
import stat
import struct


BIG_BYTES = 104857600
SOURCE_NAME = "synthetic-ref-100MiB.bmp"
SOURCE_HASH = "6e2e620c7d2209f51ee9a191432a36916d1ae30cff95a50adf788df88d16c5ff"
JPEG_BYTES = 47379
JPEG_HASH = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
EXPECTED_HEAD = "dc56a93be4b07dbe7a48863e3135351659817fb5"
PREPARED_SCHEMA = "T33-host-entry-prepared-v1"
MANIFEST_SCHEMA = "T33-large-ref-source-v1"
ALLOWED_BASE = pathlib.Path(
    "D:/Lawbeach/lawbench-B/docs/plan/evidence/T33/"
    "HostEntry-20261025-094816/runs"
)
RUN_NAME = re.compile(r"T33-host-[0-9]{8}-[0-9]{6}")
SERVED_PREFIXES = (
    "started",
    "ready",
    "requests",
    "final-metadata",
    "loop-closed",
    "gui",
)
REPARSE_FLAG = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
HASH_BLOCK = 1024 * 1024


class GuardViolation(RuntimeError):
    pass


def _guard(condition, message):
    if not condition:
        raise GuardViolation(message)


def _is_linkish(path):
    info = os.lstat(path)
    attributes = getattr(info, "st_file_attributes", 0)
    is_junction = getattr(os.path, "isjunction", lambda _path: False)
    return (
        stat.S_ISLNK(info.st_mode)
        or bool(attributes & REPARSE_FLAG)
        or is_junction(path)
    )


def _assert_safe_chain(path):
    _guard(path.is_absolute(), "路径必须是绝对路径")
    for component in (path, *path.parents):
        try:
            os.lstat(component)
        except FileNotFoundError as exc:
            raise GuardViolation(f"路径组件不存在：{component}") from exc
        _guard(not _is_linkish(component), f"路径组件是链接或重解析点：{component}")


def _safe_directory(path):
    _assert_safe_chain(path)
    info = os.lstat(path)
    _guard(stat.S_ISDIR(info.st_mode), f"不是目录：{path}")
    return info


def _safe_regular_file(path):
    _assert_safe_chain(path)
    info = os.lstat(path)
    _guard(stat.S_ISREG(info.st_mode), f"不是普通文件：{path}")
    _guard(not (getattr(info, "st_file_attributes", 0) & 0x200), f"文件是稀疏文件：{path}")
    _guard(getattr(info, "st_nlink", 1) == 1, f"文件是硬链接：{path}")
    return info


def _canonical(path):
    return os.path.normcase(os.path.normpath(os.path.abspath(path)))


def _same_path(value, expected):
    _guard(isinstance(value, str) and pathlib.Path(value).is_absolute(), "预置路径不是绝对路径")
    return _canonical(value) == _canonical(expected)


def _run_root(raw_root):
    root = pathlib.Path(raw_root)
    _guard(root.is_absolute(), "--root 必须是绝对路径")
    root = pathlib.Path(os.path.abspath(root))
    _guard(RUN_NAME.fullmatch(root.name) is not None, "run 根目录名不符合 T33-host-YYYYMMDD-HHMMSS")
    stamp = root.name.removeprefix("T33-host-").replace("-", "")
    _guard(1 <= int(stamp[4:6]) <= 12, "run 根目录月份无效")
    _guard(1 <= int(stamp[6:8]) <= 31, "run 根目录日期无效")
    _guard(0 <= int(stamp[8:10]) <= 23, "run 根目录小时无效")
    _guard(0 <= int(stamp[10:12]) <= 59, "run 根目录分钟无效")
    _guard(0 <= int(stamp[12:14]) <= 59, "run 根目录秒数无效")
    _guard(_canonical(root.parent) == _canonical(ALLOWED_BASE), "run 根目录不是允许基座的直接子目录")
    _assert_safe_chain(root)
    _safe_directory(root)
    return root


def _is_served_name(name):
    lowered = name.casefold()
    return any(
        lowered == prefix
        or lowered.startswith(prefix + ".")
        or lowered.startswith(prefix + "-")
        or lowered.startswith(prefix + "_")
        for prefix in SERVED_PREFIXES
    )


def _prepared_paths(root):
    input_dir = root / "input"
    case_dir = root / "case"
    ready_dir = input_dir / "ready"
    _safe_directory(input_dir)
    _safe_directory(case_dir)
    _safe_directory(ready_dir)
    _guard(not any(case_dir.iterdir()), "case 目录不是空的")
    for entry in input_dir.iterdir():
        if entry.name == "ready":
            continue
        _guard(not _is_served_name(entry.name), f"拒绝 served 工件：{entry.name}")
        _guard(not _is_linkish(entry), f"input 工件是链接或重解析点：{entry.name}")
        _guard(stat.S_ISREG(os.lstat(entry).st_mode), f"input 含非预期目录：{entry.name}")
    return input_dir, case_dir, ready_dir


def _load_object(path, label):
    _safe_regular_file(path)
    with open(path, "r", encoding="utf-8") as stream:
        try:
            value = json.load(stream)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise GuardViolation(f"{label} 不是有效 JSON") from exc
    _guard(isinstance(value, dict), f"{label} 顶层必须是对象")
    return value


def _hash_file(path):
    info_before = _safe_regular_file(path)
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        while True:
            chunk = stream.read(HASH_BLOCK)
            if not chunk:
                break
            digest.update(chunk)
    info_after = _safe_regular_file(path)
    identity_before = (info_before.st_size, info_before.st_mtime_ns, info_before.st_ino)
    identity_after = (info_after.st_size, info_after.st_mtime_ns, info_after.st_ino)
    _guard(identity_before == identity_after, f"文件在读取期间发生变化：{path}")
    return digest.hexdigest(), info_after


def _prepared_record(root, case_dir, ready_dir):
    prepared_path = root / "prepared.json"
    prepared = _load_object(prepared_path, "prepared.json")
    _guard(prepared.get("format") == PREPARED_SCHEMA, "prepared.json format 不符")
    _guard(prepared.get("expected_head") == EXPECTED_HEAD, "prepared.json expected_head 不符")
    paths = prepared.get("paths")
    _guard(isinstance(paths, dict), "prepared.json paths 不是对象")
    for name, expected_path in (("root", root), ("case", case_dir), ("ready", ready_dir)):
        record = paths.get(name)
        _guard(isinstance(record, dict), f"prepared.json paths.{name} 不是对象")
        _guard(_same_path(record.get("path"), expected_path), f"prepared.json paths.{name}.path 不是当前规范目录")
        _guard(_same_path(record.get("canonical"), expected_path), f"prepared.json paths.{name}.canonical 不是当前规范目录")

    digest, prepared_stat = _hash_file(prepared_path)
    return {
        "path": str(prepared_path),
        "bytes": prepared_stat.st_size,
        "hash": digest,
        "mtime_ns": prepared_stat.st_mtime_ns,
    }


def _jpeg_record(ready_dir):
    entries = list(ready_dir.iterdir())
    _guard(len(entries) == 1, "create 前 ready 目录必须只含原始 JPEG")
    jpeg_path = entries[0]
    _guard(jpeg_path.suffix.casefold() in (".jpg", ".jpeg"), "ready 唯一文件不是 JPEG")
    jpeg_stat = _safe_regular_file(jpeg_path)
    _guard(jpeg_stat.st_size == JPEG_BYTES, "原始 JPEG 字节数不符")
    digest, jpeg_stat = _hash_file(jpeg_path)
    _guard(digest == JPEG_HASH, "原始 JPEG SHA-256 不符")
    return {
        "path": str(jpeg_path),
        "bytes": jpeg_stat.st_size,
        "hash": digest,
        "mtime_ns": jpeg_stat.st_mtime_ns,
    }


def _check_root_shape(root, manifest_path, verify_only):
    expected = {"case", "input", "prepared.json", "private"}
    if verify_only:
        expected.add(manifest_path.name)
    actual = {entry.name for entry in root.iterdir()}
    _guard(actual == expected, f"run 根目录顶层集合不符：{sorted(actual)}")


def _create_big_bmp(path: pathlib.Path) -> None:
    if path.exists():
        raise GuardViolation(f"合成文件目标已存在：{path}")
    offset = 56
    stride = 4
    if (BIG_BYTES - offset) % stride:
        raise AssertionError("BMP 尺寸不可整除")
    height = (BIG_BYTES - offset) // stride
    import struct

    header = struct.pack(
        "<2sIHHI IiiHHIIiiII",
        b"BM",
        BIG_BYTES,
        0,
        0,
        offset,
        40,
        1,
        height,
        1,
        24,
        0,
        BIG_BYTES - offset,
        2835,
        2835,
        0,
        0,
    )
    if len(header) != 54:
        raise AssertionError("BMP 头长度错误")
    block = b"\0" * (1024 * 1024)
    remaining = BIG_BYTES
    with open(path, "xb") as stream:
        stream.write(header)
        stream.write(b"\0\0")
        remaining -= offset
        while remaining:
            chunk = block if remaining >= len(block) else block[:remaining]
            stream.write(chunk)
            remaining -= len(chunk)
        stream.flush()
        os.fsync(stream.fileno())
    if path.stat().st_size != BIG_BYTES:
        raise AssertionError("BMP 物理大小不等于 104857600")


def _manifest_value(root, case_dir, ready_dir, prepared, jpeg, source, source_stat):
    return {
        "schema": MANIFEST_SCHEMA,
        "run_root": str(root),
        "case": str(case_dir),
        "source": str(source),
        "bytes": source_stat.st_size,
        "hash": SOURCE_HASH,
        "mtime_ns": source_stat.st_mtime_ns,
        "original_prepared_sha256": prepared["hash"],
        "original_prepared": prepared,
        "original_jpeg": jpeg,
        "provenance": {
            "newly_generated_private_source": True,
            "external_to_case": True,
        },
    }


def _write_manifest(path, value):
    _guard(not os.path.lexists(path), "large-ref-source.json 已存在")
    with open(path, "x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


def _prepare(raw_root):
    root = _run_root(raw_root)
    manifest_path = root / "large-ref-source.json"
    _check_root_shape(root, manifest_path, verify_only=False)
    input_dir, case_dir, ready_dir = _prepared_paths(root)
    source = ready_dir / SOURCE_NAME
    _guard(not os.path.lexists(source), "合成 BMP 目标已存在")
    _guard(not os.path.lexists(manifest_path), "source manifest 已存在")
    prepared = _prepared_record(root, case_dir, ready_dir)
    jpeg = _jpeg_record(ready_dir)

    _guard(os.path.lexists(jpeg["path"]), "create 前原始 JPEG 消失")
    _guard(not os.path.lexists(source), "create 前合成 BMP 目标已出现")
    _create_big_bmp(source)
    _safe_regular_file(source)
    source_hash, source_stat = _hash_file(source)
    _guard(source_stat.st_size == BIG_BYTES, "合成 BMP 字节数不符")
    _guard(source_hash == SOURCE_HASH, "合成 BMP SHA-256 不符")

    prepared_after_hash, prepared_after_stat = _hash_file(pathlib.Path(prepared["path"]))
    _guard(prepared_after_hash == prepared["hash"], "创建后 prepared.json SHA 改变")
    _guard(prepared_after_stat.st_mtime_ns == prepared["mtime_ns"], "创建后 prepared.json mtime 改变")
    jpeg_after_hash, jpeg_after_stat = _hash_file(pathlib.Path(jpeg["path"]))
    _guard(jpeg_after_hash == jpeg["hash"], "创建后原始 JPEG SHA 改变")
    _guard(jpeg_after_stat.st_mtime_ns == jpeg["mtime_ns"], "创建后原始 JPEG mtime 改变")
    _guard(not any(case_dir.iterdir()), "创建后 case 目录不是空的")

    manifest = _manifest_value(root, case_dir, ready_dir, prepared, jpeg, source, source_stat)
    _write_manifest(manifest_path, manifest)
    return manifest_path


def _verify_record(value, expected_path, expected_bytes, expected_hash, label):
    _guard(isinstance(value, dict), f"{label} 记录不是对象")
    _guard(_same_path(value.get("path"), expected_path), f"{label} 路径不符")
    _guard(value.get("bytes") == expected_bytes, f"{label} 字节数不符")
    _guard(value.get("hash") == expected_hash, f"{label} hash 不符")
    _guard(isinstance(value.get("mtime_ns"), int), f"{label} mtime_ns 不符")
    info = _safe_regular_file(expected_path)
    _guard(info.st_size == expected_bytes, f"{label} 当前字节数不符")
    digest, info = _hash_file(expected_path)
    _guard(digest == expected_hash, f"{label} 当前 hash 不符")
    _guard(info.st_mtime_ns == value["mtime_ns"], f"{label} 当前 mtime 不符")


def _verify(raw_root):
    root = _run_root(raw_root)
    manifest_path = root / "large-ref-source.json"
    _check_root_shape(root, manifest_path, verify_only=True)
    input_dir, case_dir, ready_dir = _prepared_paths(root)
    source = ready_dir / SOURCE_NAME
    manifest = _load_object(manifest_path, "large-ref-source.json")

    _guard(manifest.get("schema") == MANIFEST_SCHEMA, "source manifest schema 不符")
    _guard(_same_path(manifest.get("run_root"), root), "source manifest run_root 不符")
    _guard(_same_path(manifest.get("case"), case_dir), "source manifest case 不符")
    _guard(_same_path(manifest.get("source"), source), "source manifest source 不符")
    _guard(source.parent == ready_dir, "source 不在 ready 目录")
    _guard(source.name == SOURCE_NAME, "source 文件名不符")

    provenance = manifest.get("provenance")
    _guard(isinstance(provenance, dict), "source provenance 不是对象")
    _guard(provenance.get("newly_generated_private_source") is True, "未声明新生成私有来源")
    _guard(provenance.get("external_to_case") is True, "未声明位于 case 外")

    prepared = _prepared_record(root, case_dir, ready_dir)
    prepared_manifest = manifest.get("original_prepared")
    _guard(isinstance(prepared_manifest, dict), "原始 prepared 记录缺失")
    _verify_record(prepared_manifest, pathlib.Path(prepared["path"]), prepared_manifest.get("bytes"), prepared["hash"], "original_prepared")
    _guard(manifest.get("original_prepared_sha256") == prepared["hash"], "original_prepared_sha256 不符")
    _guard(prepared_manifest.get("mtime_ns") == prepared["mtime_ns"], "原始 prepared mtime 不符")

    jpeg_manifest = manifest.get("original_jpeg")
    _guard(isinstance(jpeg_manifest, dict), "原始 JPEG 记录缺失")
    jpeg_path = pathlib.Path(jpeg_manifest.get("path", ""))
    _guard(jpeg_path.parent == ready_dir, "原始 JPEG 不在 ready 目录")
    _verify_record(jpeg_manifest, jpeg_path, JPEG_BYTES, JPEG_HASH, "original_jpeg")
    _guard(jpeg_path.suffix.casefold() in (".jpg", ".jpeg"), "原始 JPEG 后缀不符")

    _guard(manifest.get("bytes") == BIG_BYTES, "source manifest 字节数不符")
    _guard(manifest.get("hash") == SOURCE_HASH, "source manifest hash 不符")
    _guard(isinstance(manifest.get("mtime_ns"), int), "source manifest mtime_ns 不符")
    source_info = _safe_regular_file(source)
    _guard(source_info.st_size == BIG_BYTES, "合成 BMP 当前字节数不符")
    source_hash, source_info = _hash_file(source)
    _guard(source_hash == SOURCE_HASH, "合成 BMP 当前 hash 不符")
    _guard(source_info.st_mtime_ns == manifest["mtime_ns"], "合成 BMP 当前 mtime 不符")

    _guard(not any(case_dir.iterdir()), "case 目录不是空的")
    ready_names = {entry.name for entry in ready_dir.iterdir()}
    _guard(ready_names == {jpeg_path.name, SOURCE_NAME}, "ready 文件集合不是原始 JPEG 加新 BMP")
    return manifest_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    try:
        result = _verify(args.root) if args.verify_only else _prepare(args.root)
    except GuardViolation as exc:
        raise SystemExit(f"GUARD: {exc}") from None
    print(f"OK: {result}")


if __name__ == "__main__":
    main()
