#!/usr/bin/env python3
"""Render the fixed synthetic OCR input and freeze the unchanged production payload.

This authoring candidate is source-only. It never starts prep395, llama-server,
KeyChecker, an HTTP client, or a model. The root must audit it before execution.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
import stat
import sys
import tempfile
from pathlib import Path


SCHEMA = "lawbench-isolated-synthetic-ocr-input/1"
C_REPO = Path(r"D:\Lawbeach\lawbench-C")
B_REPO = Path(r"D:\Lawbeach\lawbench-B")
SERVICE_DIR = B_REPO / "service"
FIXTURE = B_REPO / r"tests\fixtures\criminal-01\转账截图.jpg"
APP_SOURCE = C_REPO / r"prep395\prep395\app.py"
BACKENDS_SOURCE = C_REPO / r"prep395\prep395\backends.py"
DEWATERMARK_SOURCE = C_REPO / r"prep395\prep395\dewatermark.py"
RENDER_SOURCE = B_REPO / r"service\lawbench\ocr\render.py"

FIXTURE_BYTES = 47_379
FIXTURE_SHA256 = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
RENDER_BYTES = 132_843
RENDER_SHA256 = "6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a"
MODEL_NAME = "Xiaomi-OCR-0.BF16.gguf"

SOURCE_PINS = {
    str(APP_SOURCE): (17_514, "011cf2e510d1ed03fe8dc8b14cc10feef5aa012e1a22e119a819fb6f8fecc5f1"),
    str(BACKENDS_SOURCE): (10_931, "5cd1446577b7a61b60146d42a56e8778ecda0623dd2a5490b4b27e7138fc6200"),
    str(DEWATERMARK_SOURCE): (5_347, "1defd385791fbec594e9b09a9dcd6b6ec06ee0c019554dbc85185398b904748a"),
    str(RENDER_SOURCE): (2_892, "600fbb3c368c6a0dbc71fd173c94ba5455af8518717284b852ccee8b72849ae3"),
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_fixed_file(path: Path, expected_bytes: int, expected_sha256: str) -> bytes:
    if not path.is_file() or path.is_symlink():
        raise SystemExit(f"fixed input is missing, non-regular, or a link: {path}")
    data = path.read_bytes()
    actual = sha256(data)
    if len(data) != expected_bytes or actual != expected_sha256:
        raise SystemExit(
            f"fixed input identity differs: {path} bytes={len(data)} sha256={actual}"
        )
    return data


def assert_sources_unchanged() -> None:
    for name, (expected_bytes, expected_sha256) in SOURCE_PINS.items():
        read_fixed_file(Path(name), expected_bytes, expected_sha256)


def is_link(path: Path) -> bool:
    junction = getattr(os.path, "isjunction", lambda _path: False)
    try:
        attributes = int(getattr(path.lstat(), "st_file_attributes", 0))
    except OSError:
        return True
    reparse_flag = int(getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0))
    return (
        path.is_symlink()
        or bool(junction(path))
        or bool(attributes & reparse_flag)
    )


def validate_output_path(raw: str) -> Path:
    """Require a fresh root below TEMP with only ordinary directory ancestors."""
    requested = Path(raw)
    if not requested.is_absolute():
        raise SystemExit("--out must be absolute")
    out = Path(os.path.abspath(str(requested)))
    temp_root = Path(os.path.abspath(tempfile.gettempdir()))
    try:
        common = Path(os.path.commonpath((str(temp_root), str(out))))
    except ValueError:
        common = Path("")
    if (
        os.path.normcase(str(common)) != os.path.normcase(str(temp_root))
        or os.path.normcase(str(out)) == os.path.normcase(str(temp_root))
    ):
        raise SystemExit(f"--out must be a fresh directory below TEMP: {out}")
    if out.exists():
        raise SystemExit(f"--out already exists; refusing to overwrite: {out}")

    cursor = out.parent
    while True:
        if not cursor.is_dir() or is_link(cursor):
            raise SystemExit(f"output ancestor is missing, non-directory, or a link: {cursor}")
        if os.path.normcase(str(cursor)) == os.path.normcase(str(temp_root)):
            break
        parent = cursor.parent
        if parent == cursor:
            raise SystemExit(f"output path escaped the required TEMP root: {out}")
        cursor = parent
    return out


def serialized_httpx_json(body: dict) -> bytes:
    """Match httpx's JSON request rendering used by unchanged LlamaServerBackend._chat."""
    return json.dumps(
        body,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def write_new(path: Path, data: bytes) -> None:
    with path.open("xb") as stream:
        stream.write(data)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prepare fixed synthetic input for the isolated 395 native-crash diagnostic."
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Absolute path that does not yet exist; all prepared files are written here.",
    )
    args = parser.parse_args()

    sys.dont_write_bytecode = True
    out = validate_output_path(args.out)
    assert_sources_unchanged()
    read_fixed_file(FIXTURE, FIXTURE_BYTES, FIXTURE_SHA256)

    # Import the unchanged production packages normally. The renderer and parser
    # must share the real production lock object.
    service_root = str(SERVICE_DIR)
    if service_root not in sys.path:
        sys.path.insert(0, service_root)
    from lawbench import ingest as production_ingest
    from lawbench.ocr import render as production_render

    if Path(production_render.__file__).resolve() != RENDER_SOURCE.resolve():
        raise SystemExit(
            f"lawbench.ocr.render came from an unexpected source: {production_render.__file__}"
        )
    if production_render._PDFIUM is not production_ingest.PDFIUM_LOCK:
        raise SystemExit("production renderer does not use the shared production PDFIUM_LOCK")
    assert_sources_unchanged()

    rendered = production_render.render_png(FIXTURE, "image", 1)
    if len(rendered) != RENDER_BYTES or sha256(rendered) != RENDER_SHA256:
        raise SystemExit(
            "production renderer output differs from the original 2026-10-27 evidence: "
            f"bytes={len(rendered)} sha256={sha256(rendered)}"
        )

    # Import the real prep395 package, but never create_app(), start a lifespan,
    # instantiate KeyChecker, read a business key, or construct a backend client.
    prep_root = str(C_REPO / "prep395")
    if prep_root not in sys.path:
        sys.path.insert(0, prep_root)
    from prep395 import app as production_app
    from prep395 import backends as production_backends
    from PIL import Image

    assert_sources_unchanged()
    if Path(production_app.__file__).resolve() != APP_SOURCE.resolve():
        raise SystemExit(f"prep395.app came from an unexpected source: {production_app.__file__}")
    if Path(production_backends.__file__).resolve() != BACKENDS_SOURCE.resolve():
        raise SystemExit(
            f"prep395.backends came from an unexpected source: {production_backends.__file__}"
        )

    if production_app.DEWATERMARK_ENABLED:
        raise SystemExit("prep395 unexpectedly enabled dewatermarking")

    image = None
    processed_image = None
    close_errors = []
    try:
        image = production_app._open_image(rendered, 2_480)
        preprocessed, processed_image = production_app._preprocess(
            image, do_deskew=True, do_dewatermark=False
        )
        if processed_image.mode != "RGB":
            raise SystemExit(f"unexpected preprocessed image mode: {processed_image.mode}")

        # Re-open only the prepared bytes to record the exact image sent by the body.
        with Image.open(io.BytesIO(preprocessed)) as sent_image:
            sent_image.load()
            sent_width, sent_height = sent_image.size
            sent_mode = sent_image.mode
    finally:
        for name, candidate in (
            ("processed image", processed_image),
            ("opened image", image),
        ):
            if candidate is None:
                continue
            try:
                candidate.close()
            except Exception as exc:
                close_errors.append(f"{name}: {type(exc).__name__}: {exc}")
    if close_errors:
        raise SystemExit("failed to close image handles: " + "; ".join(close_errors))

    template = production_backends.OCR_TEMPLATES["xiaomi-ocr-0"]
    if (
        template["image_first"] is not True
        or template["otsl"] is not True
        or production_backends.ocr_template_name(MODEL_NAME) != "xiaomi-ocr-0"
    ):
        raise SystemExit("unchanged backend no longer has the expected Xiaomi OCR semantics")

    data_url = "data:image/png;base64," + base64.b64encode(preprocessed).decode("ascii")
    body = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": data_url}},
                    {"type": "text", "text": template["prompt"]},
                ],
            }
        ],
        "temperature": 0,
        "max_tokens": 4096,
        "stream": False,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    request_json = serialized_httpx_json(body)

    out.mkdir(exist_ok=False)
    if is_link(out) or not out.is_dir():
        raise SystemExit(f"created output root is not an ordinary directory: {out}")
    write_new(out / "render-page1.png", rendered)
    write_new(out / "preprocessed-page1.png", preprocessed)
    write_new(out / "request.json", request_json)

    manifest = {
        "artifact_schema": SCHEMA,
        "status": "PREPARED_NOT_RUN",
        "fixture": {
            "path": str(FIXTURE),
            "bytes": FIXTURE_BYTES,
            "sha256": FIXTURE_SHA256,
            "mutation": "none",
        },
        "production_render": {
            "source": str(RENDER_SOURCE),
            "call": "render_png(path, 'image', 1)",
            "bytes": len(rendered),
            "sha256": sha256(rendered),
            "width": 750,
            "height": 1334,
        },
        "production_preprocess": {
            "source": str(APP_SOURCE),
            "call": "_open_image -> _preprocess(do_deskew=True, do_dewatermark=False)",
            "bytes": len(preprocessed),
            "sha256": sha256(preprocessed),
            "width": sent_width,
            "height": sent_height,
            "mode": sent_mode,
        },
        "production_payload": {
            "model": MODEL_NAME,
            "backend_source": str(BACKENDS_SOURCE),
            "template": "xiaomi-ocr-0",
            "image_first": True,
            "prompt_sha256": sha256(template["prompt"].encode("utf-8")),
            "temperature": 0,
            "max_tokens": 4096,
            "stream": False,
            "enable_thinking": False,
            "request_json_bytes": len(request_json),
            "request_json_sha256": sha256(request_json),
        },
        "source_pins": {
            path: {"bytes": size, "sha256": digest}
            for path, (size, digest) in SOURCE_PINS.items()
        },
        "runtime_performed_by_author": False,
        "model_or_network_calls_by_author": 0,
        "credential_fields": [],
    }
    manifest_bytes = json.dumps(
        manifest, ensure_ascii=False, indent=2, sort_keys=True
    ).encode("utf-8") + b"\n"
    write_new(out / "manifest.json", manifest_bytes)

    print(
        json.dumps(
            {
                "status": manifest["status"],
                "render_bytes": len(rendered),
                "render_sha256": sha256(rendered),
                "preprocessed_bytes": len(preprocessed),
                "preprocessed_sha256": sha256(preprocessed),
                "request_json_bytes": len(request_json),
                "request_json_sha256": sha256(request_json),
                "manifest_sha256": sha256(manifest_bytes),
                "out": str(out),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
