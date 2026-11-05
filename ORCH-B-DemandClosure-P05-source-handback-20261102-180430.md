# B line — DemandClosure P0-5 source handback

Status: SOURCE HANDED BACK. No Git commit was made. No test was run, so this handback contains no test-pass claim.

## Exact source files and scope

- `service/lawbench/remote.py` — new; byte-exact copy of supplied `C-remote.py`.
- `service/lawbench/net.py` — added only `_alt_forwards` initialization, `alt_target()`, `set_alt_forwards()`, and alternate-address selection in `candidates()`. Current B external-model routing, security, allowlist, and `/v1-ext` behavior were retained.
- `service/lawbench/app.py` — imported and constructed `RemoteAccess` after `st.net`; added `servers_changed()` to the existing settings callback while preserving `st.net.update()` and `st.external.update()`; added production lifespan start/stop.
- `service/lawbench/api/ui.py` — added the original four-field public projection, reason mapping, authenticated GET/POST handlers, two routes through the existing `_endpoint`, single-action dispatch, and local CR/LF guard before any setter.
- `service/tests/test_owner_remote_p05_20261102.py` — new isolated integration test source using current B contracts.

No file outside the source allowlist was written. No contract, frozen T40 test, archive/citation code, external-model implementation, SDK, lock, ACL, approval, sandbox, or process policy was changed.

## Integration content

The copied `RemoteAccess` retains the original EasyTier lifecycle, keyring-backed access code, persisted switch/hostname, direct-connection check, alternate forwarding, restart/backoff, redacted logging, and start/stop behavior.

B Net now exposes the alternate address target and installs/removes loopback forwarding ports for `llm` and `prep`. Selection still returns route `alternate`, preserving the existing primary/alternate semantics.

B app constructs RemoteAccess after Net creation and starts/stops it in the normal application lifespan. The pre-existing external-model policy update remains in the same settings callback.

The remote API accepts only:

- GET with no input;
- POST `{"enabled": <boolean>}`;
- POST `{"code": <string or null>}`.

The response projects only `enabled`, `has_code`, `state`, and `reason`; no access code, path, or internal status field is returned. CR/LF-bearing code input is rejected before setter invocation.

## New isolated test source

The new test source uses the current B contract directory, private `tmp_path` HOME/appdata paths, loopback-only synthetic settings, an HTTP transport that refuses every request, injected key getters returning `None`, and fakes installed on `app.RemoteAccess`/`app.OcrQueue` before `create_app`. TestClient is instantiated without entering its context, so lifespan is not run.

It covers initial authenticated off/no-code state, all public reason projections, enable/save-code/clear actions, invalid dual-action and CR/LF inputs with no setter call, unauthorized requests with no RemoteAccess call, and non-disclosure of a synthetic code. The test source was reviewed only; it was not executed.

## Verification actually performed

- Native PowerShell static inspection of the edited files.
- Source `remote.py` SHA-256: `AF457CEF5960B4B345997D22BFBB3B5CEA6D75D4F2987726C954D28EED7EBA7B`.
- Supplied `C-remote.py` SHA-256: the same value, confirming byte equality.
- Read-only status limited to the five allowlisted paths showed the three intended modified files and two intended new files.

No Python, pytest, product code, parser, compiler, build, prepare, serve, probe, GUI, HTTP, model, or self-test was run. No package/resource download, credential action, child process, network request, or Git write occurred. The product lifespan was not started.

## Deviations and uncertainty

- No functional deviation from the bounded integration was intentionally introduced.
- The byte-exact RemoteAccess helper still contains its original comment describing contract 1.5. B's current contract version is 1.7; this is documentation from the supplied source, not a contract change. The API uses the current B contract through the existing `_endpoint`.
- Dynamic correctness and import/syntax execution remain for the authorized verifier because this job explicitly prohibited running tests or interpreters.
- The worktree was already extensively dirty. Existing edits were preserved; no cleanup or staging was attempted.

## Failed tool calls and terminal qualification

All commands used the explicit native executable
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
with `login=false`. Reported terminal version: PowerShell `7.6.5`. The current PID was treated as this execution author, not a second writer. Managed isolation remained enabled; no setup, legacy-shell fallback, approval escalation, ACL change, sandbox change, or lock manipulation was attempted.

Failed or non-successful calls:

1. Initial read-only `git status --short` exited 1 because Git could not enter the `dsh` submodule under `.git/worktrees/.../modules/dsh` (`Permission denied`). It was not repaired. A read-only rerun with `--ignore-submodules=all` succeeded and was used to preserve and inspect top-level dirty state.
2. Initial read of `service/tests/test_owner_remote_p05_20261102.py` found no file, as expected before this job created it.
3. One read-only `Get-ChildItem` check used unsupported parameter `-Leaf` and exited 1; it was not repeated because all required dependency files had already been confirmed/read.

No Git `add`, `commit`, `rebase`, `stash`, `reset`, `clean`, `checkout`, or `push` was attempted. The handback itself is this coordination-directory file, not a Git commit.
