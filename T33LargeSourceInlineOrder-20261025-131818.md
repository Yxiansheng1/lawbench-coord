# SHRUNK one-file preparation only, no shell after initial read
Previous entire5-file task stopped after a parallel read mistakenly used Bash. No outputs/source changes. Do NOT restart its job, repeat its research/Git/hash commands or extend its old report. Root independently read native policy and exact existing generator. This is the ONLY narrowed alternative, 180 seconds maximum within original absolute task budget; no further retry if shell/permission refusal.
Write ONLY D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300\create-large-source.py and formal D:\Lawbeach\lawbench-coord\ORCH-A-T33LargeSourceInlineReturn-20261025-131818.md. No other files (no README/start/stop/prepare/server). Root corrects the previous dispatch-input omission: ALL required original generator source is embedded verbatim below. Your FIRST and ONLY exec reads this order alone, exactly as runner requires, with explicit nativepwsh absolute shell/login=false. No separate file read is needed or allowed. After that, use file patch tools ONLY; NO more exec calls, no parallel exec, no Bash/defaultshell, no self-hash/check/tests/parser/build/run. Root validates artifacts. Formal SHA may be omitted (root will compute); do not run a command just to get SHA. No services/GUI/network/product imports/Git/credentials/permission/isolation/TEMP/lock changes.

Implement one minimal standard-library Python helper, CLI --root <fresh prepared root>, with an optional --verify-only to validate an already created prepared-input manifest without writing. Main guard required; do not import old prepare/product. No generic path/size/target/provider options or frameworks. All file inputs only already prepared private synthetic run, all writes under that root.
Exactly allowed base: D:/Lawbeach/lawbench-B/docs/plan/evidence/T33/HostEntry-20261025-094816/runs. Root must exist as direct child T33-host-YYYYMMDD-HHMMSS, every component non-reparse/no links; ready=root/input/ready and case=root/case. Refuse any served artifacts (started/ready/requests/final-metadata/loop-closed/gui), preserve all existing data, never remove/overwrite/restore anything. Require case empty and original prepared.json format T33-host-entry-prepared-v1/expected_head dc56a93be4b07dbe7a48863e3135351659817fb5 with exact canonical root/case/ready. Require exactly original ready JPEG47379B SHAfeeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad before create. Do not modify original prepared.json/settings/daily marker/JPEG/old runs. Record/validate original prepared SHA before/after.
Create a NEW source synthetic-ref-100MiB.bmp in existing intended private input/ready, not case, by exact reviewed _create_big_bmp algorithm/constants.104857600 full sequential real written bytes/no seek/truncate/sparse/hardlinks, SHA6e2e620c7d2209f51ee9a191432a36916d1ae30cff95a50adf788df88d16c5ff, not reparse/sparse. Do NOT move/copy old100MiB fixtures to pass a guard. Root will claim this private synthetic source only, not arbitrary filesystem. Source must be absent before creation; retain partial failed output, do not auto-retry/cleanup. No decoding or OCR.
Save NEW root/large-ref-source.json (exclusive create) schema T33-large-ref-source-v1 with run_root/case/source canonical paths, bytes/hash/mtime_ns, preserved original prepared SHA, explicit newly-generated-private-source/external-to-case provenance. No case_id/session/history/rollout/success fake. verify-only validates same fixed identities/bytes/hash/mtime, original JPEG/prepared unchanged, case still empty, ready set exactly JPEG+newBMP, no writes. Before create do same guard except source/manifest must not exist.
Use only argparse/pathlib/os/stat/hashlib/json/re/struct standard libraries. No shell subprocess/network/credentials/realproduct code. Root will read whole file, AST+boundary checks then run ONLY against a fresh native --prepare run after independent admission.
Formal <=30lines: created path or concrete dependency, semantics, copied generator provenance, unchanged invariants, noexec after first read/no selfrun, limitations. This file alone is PREPARED_ONLY, not runnableGUI or PASS. Finish without waiting forroot. No suggestion to expand runtime/security. Packaging HOLD.

## Root-frozen original generator, complete required code context
This is quoted existing author code from immutable input, not a request to execute/import that old module. BIG_BYTES = 104857600. Provide the trivial GuardViolation RuntimeError subclass and pathlib/os imports needed for this exact function; no missing external symbol.
```python
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
```
Root explicitly confirms this order alone now contains all code/data context; first-read-only and no-subsequent-exec are compatible. Write actual helper + formal via file patch tools, then stop. Do not produce another candidate/paper. If anything else truly prevents writing the whitelisted file, report exact dependency once; no repeat loop.
