#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Synthetic (fictitious) invoice PDF preparer -- B line, Batch 2 acceptance.

Strict scope:
  * Creates exactly ONE clearly fictitious PDF plus ONE manifest inside the
    sandbox root supplied by the caller via --root.
  * The sandbox root must resolve strictly beneath D:/Lawbeach/_acceptance
    (never equal to it), must not already be a non-empty directory, and no
    ancestor (root, base, or their parents) may be a reparse point / symlink.
  * Every byte written is synthetic. No real names, IDs, taxpayer numbers or
    case material are used, and no mailbox, network, model, OCR or credential
    access of any kind happens here.
  * This script does NOT import or monkey-patch product code, does NOT invoke
    any application or CLI, performs NO cleanup of the sandbox, and writes NO
    ledger entry. The sandbox is left in place for owner review.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

try:  # PyMuPDF (module name "fitz" on the pinned runtime)
    import fitz
except ImportError:  # pragma: no cover - newer packaging exposes "pymupdf"
    import pymupdf as fitz


# --------------------------------------------------------------------------
# Fixed constants. Nothing here is configurable at runtime on purpose.
# --------------------------------------------------------------------------

ACCEPTANCE_BASE = Path("D:/Lawbeach/_acceptance")
INPUT_DIRNAME = "input"
MANIFEST_NAME = "manifest.json"

BUYER = "虚构合成测试有限公司"
SELLER = "虚构合成销售有限公司"
AMOUNT_TEXT = "12.34"
AMOUNT_VALUE = 12.34
CURRENCY = "CNY"
CURRENCY_SYMBOL = "¥"
INVOICE_NUMBER = "00000000000000000001"
INVOICE_DATE = "2026年11月02日"
PDF_NAME = "1-办公用品-12.34-00001.pdf"

TEXT_LINES = [
    "合成测试发票（虚构，不可报销）",
    "电子发票（普通发票）",
    "发票号码：00000000000000000001",
    "开票日期：2026年11月02日",
    "购买方名称：虚构合成测试有限公司",
    "销售方名称：虚构合成销售有限公司",
    "项目名称：办公用品",
    "价税合计（小写）：12.34",
]

FONT_NAME = "china-s"
FONT_SIZE = 12
START_Y = 80.0
LINE_STEP = 24.0
LEFT_X = 60.0
A4_WIDTH = 595.276
A4_HEIGHT = 841.89

FILE_ATTRIBUTE_REPARSE_POINT = 0x400


class PrepError(RuntimeError):
    """Refusal raised for any condition the sandbox contract forbids."""


def _is_reparse_point(path: Path) -> bool:
    """True when path exists and is a symlink / reparse point (Windows junction)."""
    try:
        st = os.lstat(str(path))
    except OSError:
        return False
    if os.path.islink(str(path)):
        return True
    attrs = getattr(st, "st_file_attributes", 0)
    return bool(attrs & FILE_ATTRIBUTE_REPARSE_POINT)


def _chain(path: Path) -> list[Path]:
    """path itself plus every existing ancestor, nearest first."""
    return [path, *path.parents]


def _norm(path: Path) -> str:
    return os.path.normcase(os.path.realpath(str(path)))


def resolve_sandbox_root(raw_root: str) -> Path:
    """Validate --root and return the absolute sandbox path.

    Enforces: absolute path, no reparse point anywhere in the chain, strict
    containment beneath the acceptance base, and (checked separately) that the
    directory is absent or empty.
    """
    if not raw_root:
        raise PrepError("--root is required and must not be empty")

    candidate = Path(os.path.abspath(os.path.expanduser(raw_root)))
    if not candidate.is_absolute():
        raise PrepError("--root must be an absolute path")
    if not candidate.is_dir() and candidate.exists():
        raise PrepError("--root exists but is not a directory")

    if not ACCEPTANCE_BASE.exists():
        raise PrepError("acceptance base does not exist: %s" % ACCEPTANCE_BASE)
    if not ACCEPTANCE_BASE.is_dir():
        raise PrepError("acceptance base is not a directory: %s" % ACCEPTANCE_BASE)

    # Reject reparse points / symlinks on every ancestor of base and of root.
    for node in _chain(ACCEPTANCE_BASE) + _chain(candidate):
        if _is_reparse_point(node):
            raise PrepError("reparse point or symlink refused in path chain: %s" % node)

    base_real = _norm(ACCEPTANCE_BASE)
    root_real = _norm(candidate)
    if root_real == base_real:
        raise PrepError("--root must not be the acceptance base itself")
    if not root_real.startswith(base_real.rstrip("\\/") + os.sep):
        raise PrepError("--root must resolve strictly beneath %s" % ACCEPTANCE_BASE)

    return candidate


def prepare_sandbox(root: Path) -> Path:
    """Create the sandbox directory if needed; refuse a non-empty existing one."""
    if root.exists():
        if not root.is_dir():
            raise PrepError("--root exists but is not a directory")
        if any(root.iterdir()):
            raise PrepError("--root already exists and is not empty: %s" % root)
    else:
        try:
            root.mkdir(parents=True, exist_ok=False)
        except OSError as exc:
            raise PrepError("could not create sandbox root %s: %s" % (root, exc))
    return root


def write_synthetic_pdf(root: Path) -> tuple[Path, int, int]:
    """Write the single fictitious PDF. Returns (path, page_count, bytes)."""
    input_dir = root / INPUT_DIRNAME
    input_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = input_dir / PDF_NAME
    if pdf_path.exists():
        raise PrepError("target PDF already exists: %s" % pdf_path)

    doc = fitz.open()
    try:
        page = doc.new_page(width=A4_WIDTH, height=A4_HEIGHT)
        page.insert_font(fontname=FONT_NAME)
        y = START_Y
        for line in TEXT_LINES:
            page.insert_text(
                (LEFT_X, y),
                line,
                fontname=FONT_NAME,
                fontsize=FONT_SIZE,
            )
            y += LINE_STEP
        page_count = doc.page_count
        doc.save(str(pdf_path), deflate=True)
    finally:
        doc.close()

    return pdf_path, page_count, pdf_path.stat().st_size


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_manifest(root: Path, pdf_path: Path, page_count: int, size_bytes: int) -> Path:
    """Write the sandbox manifest. Descriptive only -- no self-reported verdict."""
    manifest = {
        "synthetic": True,
        "buyer": BUYER,
        "seller": SELLER,
        "amount": AMOUNT_VALUE,
        "amount_text": AMOUNT_TEXT,
        "amount_display": "%s%s" % (CURRENCY_SYMBOL, AMOUNT_TEXT),
        "currency": CURRENCY,
        "invoice_number": INVOICE_NUMBER,
        "invoice_date": INVOICE_DATE,
        "root": str(root),
        "pdf": {
            "path": str(pdf_path),
            "relative_path": "%s/%s" % (INPUT_DIRNAME, pdf_path.name),
            "sha256": sha256_of(pdf_path),
            "bytes": size_bytes,
            "pages": page_count,
        },
        "manifest": {
            "path": str(root / MANIFEST_NAME),
            "relative_path": MANIFEST_NAME,
        },
        "note": "synthetic test fixture; not a real invoice; sandbox left in place for review",
    }
    manifest_path = root / MANIFEST_NAME
    with manifest_path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return manifest_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="batch2-synthetic-invoice-preparer",
        description=(
            "Create one clearly fictitious invoice PDF plus a manifest inside a new "
            "empty sandbox root beneath D:/Lawbeach/_acceptance."
        ),
    )
    parser.add_argument(
        "--root",
        required=True,
        help="Absolute path of the new empty sandbox directory to create/use.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    # Console encoding on Windows hosts may be cp1252; the report lines carry
    # non-ASCII paths, so force UTF-8 output rather than crashing on print.
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):
                pass
    try:
        root = resolve_sandbox_root(args.root)
        prepare_sandbox(root)
        pdf_path, page_count, size_bytes = write_synthetic_pdf(root)
        manifest_path = write_manifest(root, pdf_path, page_count, size_bytes)
    except PrepError as exc:
        sys.stderr.write("refused: %s\n" % exc)
        return 2

    sys.stdout.write("sandbox_root: %s\n" % root)
    sys.stdout.write("pdf_path: %s\n" % pdf_path)
    sys.stdout.write("pdf_pages: %d\n" % page_count)
    sys.stdout.write("pdf_bytes: %d\n" % size_bytes)
    sys.stdout.write("pdf_sha256: %s\n" % sha256_of(pdf_path))
    sys.stdout.write("manifest_path: %s\n" % manifest_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
