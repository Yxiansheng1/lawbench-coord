# HANDBACK — B/T18 Atomic Temporary-Path Closure

Status: `AUTHORED_NOT_RUN`

Target: `D:\Lawbeach\lawbench-B\service\lawbench\contracts.py`

Scope: `atomic_write_bytes` only. No other function, import, contract, test, policy, guard, resolver, schema, SDK, material-limit, or engine file was changed.

## Authored change

After the existing `path.parent.mkdir(parents=True, exist_ok=True)` call, the function retains `path.parent` as the temporary directory on POSIX. On Windows, it canonicalizes that just-created, existing parent with `resolve(strict=True)` and serializes only the canonical temporary-parent path in Win32 extended-path notation:

- an existing `\\?\` representation is retained;
- an ordinary UNC parent is represented with `\\?\UNC\`;
- an ordinary local-drive parent is represented with `\\?\`.

The temporary file still uses `tempfile.mkstemp(prefix=".~lb-", suffix=".tmp", dir=temp_dir)`. Consequently the basename contract remains `.~lb-` plus the original eight random characters plus `.tmp` (17 characters). File write, flush, fsync, replace, retry, and cleanup behavior are unchanged.

The final destination remains the original `path` object. It is neither prefixed nor canonicalized, and the original `_replace_with_retry(tmp, path)` call is unchanged. The long-path representation applies only to the temporary parent, which resolves to the same existing physical directory rather than an external fallback or another location.

POSIX behavior is unchanged: `temp_dir` remains the original `path.parent`.

## Verification boundary

Runtime calls: 0.

No Python, Node, parser, pytest/collect, build, prepare, serve, probe, HTTP, model, GUI, OCR, or version command was run. No Git command was run. No hash, metadata, BOM, or line-ending query was performed. The previously audited original RED reproduction and held-source facts were used as supplied; that evidence was not repeated.

This handback claims only that the bounded implementation was authored. Runtime verification and full review remain with the root agent.
