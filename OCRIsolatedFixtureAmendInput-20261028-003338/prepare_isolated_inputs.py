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
import sys
import threading
import types
import importlib.util
from pathlib import Path


SCHEMA = "lawbench-isolated-synthetic-ocr-input/1"
C_REPO = Path(r"D:\Lawbeach\lawbench-C")
B_REPO = Path(r"D:\Lawbeach\lawbench-B")
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


def load_unchanged_renderer():
    """Execute the actual image renderer source without importing Lawbench's package."""
    package = types.ModuleType("_lawbench_fixed")
    package.__path__ = []
    ocr_package = types.ModuleType("_lawbench_fixed.ocr")
    ocr_package.__path__ = []
    ingest = types.ModuleType("_lawbench_fixed.ingest")
    ingest.PDFIUM_LOCK = threading.Lock()
    sys.modules[package.__name__] = package
    sys.modules[ocr_package.__name__] = ocr_package
    sys.modules[ingest.__name__] = ingest

    name = "_lawbench_fixed.ocr.render"
    spec = importlib.util.spec_from_file_location(name, RENDER_SOURCE)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load unchanged renderer source: {RENDER_SOURCE}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


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

    out = Path(args.out)
    if not out.is_absolute():
        raise SystemExit("--out must be absolute")
    if out.exists():
        raise SystemExit(f"--out already exists; refusing to overwrite: {out}")

    sys.dont_write_bytecode = True
    assert_sources_unchanged()
    read_fixed_file(FIXTURE, FIXTURE_BYTES, FIXTURE_SHA256)

    # The actual unchanged renderer is loaded from its pinned source.
    render_module = load_unchanged_renderer()
    rendered = render_module.render_png(FIXTURE, "image", 1)
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

    image = production_app._open_image(rendered, 2_480)
    preprocessed, processed_image = production_app._preprocess(
        image, do_deskew=True, do_dewatermark=False
    )
    if processed_image.mode != "RGB":
        raise SystemExit(f"unexpected preprocessed image mode: {processed_image.mode}")

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

    # Re-open only the prepared bytes to record the exact image sent by the body.
    with Image.open(io.BytesIO(preprocessed)) as sent_image:
        sent_image.load()
        sent_width, sent_height = sent_image.size
        sent_mode = sent_image.mode

    out.mkdir(parents=True, exist_ok=False)
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
