# T18 Atomic Write - Independent C Source Review

## Verdict

**PASS (bounded source-only review)**

For the supplied callers and tests, I found no newly introduced atomicity,
denied-target, or same-volume defect in the `atomic_write_bytes` change. This
PASS does not cover UNC or reparse-point behavior at runtime, relative paths
under a concurrent working-directory change, paths whose final target itself
exceeds `MAX_PATH`, POSIX behavior, formal security, the whole suite, or release
acceptance.

## Findings

1. **The temporary file and final replacement remain in the same directory
   identity for the supplied absolute Windows callers.** The canonical parent is
   used only for `mkstemp`; `os.replace` still receives the original final path
   (`service/lawbench/contracts.py:112-129`, current source). For normal drive
   and UNC paths, the raw final path and canonical parent name the same parent
   directory, so atomic replacement remains same-volume. A mismatch fails
   replacement instead of exposing a partially written target. The UNC prefix
   bridge at lines 117-120 is consistent with the gate's existing normalization
   (`service/lawbench/case/gate.py:87-103`).

2. **The change does not add a new path authorization surface.** Gate writes are
   still resolved and checked before the helper is called
   (`service/lawbench/case/gate.py:260-281`, `449-466`, `560-572`). App-data
   callers already write administrator/user-selected app-data locations rather
   than case-relative paths: settings
   (`service/lawbench/settings.py:93-97`, `113`), capsules
   (`service/lawbench/capsules.py:40-47`, `60-68`), case registry
   (`service/lawbench/case/registry.py:98-99`), and request-scope evidence
   (`service/lawbench/case/request_scope.py:343-349`, `423-424`). Canonicalizing
   the temporary parent does not weaken those existing boundaries.

3. **Failure and cleanup behavior is unchanged.** `fsync` still precedes the
   replace, bounded retries still apply only to `PermissionError`
   (`service/lawbench/contracts.py:129-142`), and a failed replace still reaches
   the cleanup path before the original exception is re-raised
   (`service/lawbench/contracts.py:121-126`). A failed canonical resolution
   occurs before temporary-file creation and therefore fails closed. The
   pre-existing limits remain: retries are not generalized to every transient
   Windows error, and cleanup ignores only `FileNotFoundError`, so a cleanup
   error can mask the primary write error and may leave the temporary file.

4. **No new reparse/symlink escape is proven.** The gate rejects links and
   reparse points before the call, and a canonical parent changes where the
   temporary entry is created, not whether the raw final path follows a parent
   reparse point. The existing gate-to-operation TOCTOU window remains, including
   a reparse/junction swap during write. This was already present before the
   change and is not repaired by this patch. A conclusive assessment of the
   changed retarget window would require runtime adversarial testing that is
   outside this source-only order.

5. **Relative final paths are a residual constraint, not a regression in the
   supplied callers.** `path.parent.resolve(strict=True)` converts the temporary
   parent to an absolute canonical parent, while `os.replace` is still given the
   raw `path`. A concurrent `os.chdir` between those operations could make the
   destination resolve elsewhere; it is not shown for the supplied callers. The
   prior implementation was also vulnerable to a working-directory change
   between temporary creation and replacement. If this helper later admits
   relative paths or concurrent `chdir`, the destination should be pinned to the
   same absolute resolved parent.

## Test and Evidence Assessment

The focused original test exercises a 242-character parent, create and overwrite,
and verifies that no temporary file remains
(`service/tests/test_t18_atomic_temp_longpath_20261101_171932.py:15-64`).
The original retry tests cover a temporarily held file, bounded give-up, and
cleanup on short paths (`service/tests/test_t3_rework.py:117-138`). Gate tests
cover denied link/junction writes and normal atomic writes
(`service/tests/test_gate.py:151-174`), while the long-path test limits the
claimed recovery to the temporary-name/260 boundary
(`service/tests/test_t5_long_paths.py:23-52`).

This evidence supports the specific temporary-file boundary. It does not test
UNC behavior, relative targets plus `chdir`, reparse retargeting, a final target
over `MAX_PATH`, cross-volume mounting, or POSIX. The supplied unit and long-root
results remain separate and are not summed. The whole suite is still running and
is not accepted here.

## Exact Account

- Reads: one formal execution order; 18 capsule-file read operations (one
  initial raw read truncated by the terminal, then 17 targeted capsule reads to
  cover the supplied sources, diff, and evidence). No product, test, Git, or
  other filesystem material was read.
- Writes: this one review file only.
- Runtime: zero Python, Node, parser, pytest, collection, test, build, preparer,
  probe, HTTP, model, GUI, app, or runtime executions.
- Git: zero operations. No staging, commit, rebase, stash, reset, clean,
  checkout, push, lock repair, approval change, sandbox change, or ACL change.
