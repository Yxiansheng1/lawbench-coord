# T18 atomic_write_bytes independent review A

## Verdict

**PASS** for the bounded change-discipline and source-correctness review of the single `atomic_write_bytes` change.

This is not runtime, platform-matrix, formal-security, business, or release acceptance. Existing unit1 and long14 results are separate observations and are not summed or revalidated here.

## Scope reviewed

- Original helper: `D:\Lawbeach\lawbench-coord\T18AtomicTempMinimalFix-20261101-174215Before\contracts.py:112-126`.
- Current helper: `D:\Lawbeach\lawbench-B\service\lawbench\contracts.py:112-135`.
- Current retry/read tail: `contracts.py:138-162`.
- Relevant write caller: `D:\Lawbeach\lawbench-B\service\lawbench\case\gate.py:460-466`.
- Original targeted test: `D:\Lawbeach\lawbench-B\service\tests\test_t18_atomic_temp_longpath_20261101_171932.py:15-66`.
- Existing retry/cleanup tests: `D:\Lawbeach\lawbench-B\service\tests\test_t3_rework.py:117-138`.
- Supplied whole-file callers/contexts, original relevant `test_gate.py`, `test_t5_long_paths.py`, unchanged safety bootstrap, diff, and evidence metadata.

## Findings

No concrete regression attributable to the change was found.

1. **Change discipline.** The whole-file inverse is limited to deriving `temp_dir` on Windows before `mkstemp`; the write, flush/fsync, replace, cleanup, retry constants, and public callers are unchanged. No contract, field, or caller behavior changed.

2. **Existing-parent canonicalization and same physical directory.** `path.parent.mkdir(..., exist_ok=True)` first establishes the existing parent, then `Path.resolve(strict=True)` canonicalizes only that parent. The temporary file is therefore created in the physical directory represented by the target parent. The destination passed to `os.replace` remains `path`, so source and destination are in the same physical directory for a stable path mapping. The diff does not introduce a destination relocation.

3. **Final-target semantics.** Canonicalizing only `path.parent` intentionally leaves the final component unchanged. In particular, Windows aliases in the final component such as trailing dots/spaces are still resolved by the final replace operation under the pre-existing Windows semantics; the patch does not normalize those aliases into a different destination. If the parent mapping changes concurrently after `resolve`, rename may fail rather than supplying a new atomicity guarantee; that is a TOCTOU boundary, not a regression proven by this change.

4. **Relative, UNC, and extended paths.** A relative parent is resolved only to choose an absolute canonical temporary directory; the final relative destination is unchanged. Existing `\\?\...` parents are retained, ordinary UNC parents are transformed to `\\?\UNC\...`, and drive parents receive the `\\?\` prefix. These branches are structurally correct for the requested path classes. Existing device-style paths outside the stated drive/UNC classes were not supplied as product cases and are not claimed supported.

5. **POSIX branch.** `os.name != "nt"` leaves `temp_dir = path.parent`, preserving the original POSIX behavior exactly.

6. **File descriptor and exception cleanup.** The change occurs before `mkstemp` and does not alter the existing `try`/`except BaseException` cleanup. Write, flush, fsync, replace, and bounded PermissionError retry behavior are unchanged. Two pre-existing limits remain: if `os.fdopen(fd, ...)` itself raises, the raw descriptor is not explicitly closed, and a cleanup `os.unlink` error can mask the original exception. Neither is introduced by this diff, so neither changes this bounded verdict.

7. **Retry and durability tail.** Replacement retries remain bounded at 10 attempts with a 30 ms wait and re-raise on the last attempt; temporary-file cleanup remains in `BaseException`. File contents are fsynced before replacement. Parent-directory fsync is not performed, unchanged from the original and not claimed as crash-durability proof on Windows.

## Test and evidence limits

The supplied targeted test covers a short control, a 242-character existing parent, create, overwrite, and temporary-file absence (`test_t18_atomic_temp_longpath_20261101_171932.py:15-66`). It does not directly cover relative destinations, UNC, pre-existing extended prefixes, final-component trailing dot/space aliases, junction/subst parent mappings, POSIX, or `os.fdopen` failure.

The capsule records unit1 as 1/1 and original long-root as 14/14, with both marked separate and not summed. `whole` says the regression is still running and no verdict exists. This review used those records only as supplied evidence provenance and did not execute tests or infer a whole-suite result.

## Exact account

- Reads: the complete formal order and the complete capsule, including all supplied source blocks, diff, and evidence. The first raw capsule output exceeded the display cap, so the same capsule was read in native-PowerShell line segments with no other source or environment exploration.
- Writes: this file only.
- Runtime: zero Python, Node, parser, pytest/collect, build, preparer, probe, HTTP, model, GUI, or application executions; zero Git reads or writes.
- Product/test files and all existing dirty state were left untouched.
