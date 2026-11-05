# T34 literal-route GUI evidence

Status: `SOURCE_ONLY_READY_FOR_ROOT_REVIEW`. This bundle is not a T34 PASS.
No actual GUI, settings read, model request, necessary-unset result, physical
patch result, or OS closure is claimed.

This bundle is prepared for ROOT to run one fresh actual GUI using the original
SDK and the production-shape literal lawfirm route
`http://127.0.0.1:65005/v1`. The candidate provider component is retained only
as pinned historical evidence and is not imported, registered, bound, built, or
preloaded.

## Bounded source changes

- `prepare.ps1`, `stop.ps1`, and `entry.py` change only their owned evidence
  roots.
- `start.ps1` moves to the accepted current private build. Its 24 output pins
  match that build; only `lawbench-dsh/lib/agent.js` and
  `lawbench-dsh/lib/client.js` differ from the prior build. The three native
  shim pins are `ad0f...` Host, the current Agent, and the unchanged session
  store.
- From the pinned source prefix (2146 bytes, SHA-256 `7bb1...`), exactly one
  lawfirm `baseURL` line is replaced with the literal production URL. The
  normalized prefix is 2110 bytes, SHA-256 `c473...`; the replacement reverses
  byte-for-byte to the source prefix.
- The existing synthetic `external` seed now uses the same literal URL. Seed
  insertion, seed inverse, and on-disk seeded-prefix inverse are checked against
  the normalized prefix; the original source proof is retained separately.
- `NODE_OPTIONS` contains only the frozen resolver import and network guard
  require. It no longer imports the private provider binding.
- `projection-observer.mjs`, `settings-read-observer.mjs`,
  `private-provider-binding.mjs`, `observer-finite.mjs`, and
  `signature-finite.mjs` remain byte-identical to their baseline files.

## Runtime status

- Current author runtime: zero Node, Python, AST/parser, import, check, test,
  build, prepare, admit, start, app, GUI, HTTP, model, environment-key, DPAPI,
  process-probe, or stop calls.
- Actual GUI/settings read: `NOT RUN`.
- Necessary ordinary unset: `NOT YET VERIFIED`.
- Physical patch and owned OS closure: `NOT RUN`.
- Underlying `ConfigEditor` write cause: `UNKNOWN`; no causal claim is made.
- Model requests allowed: `0`. External calls allowed: `0`.
- Packaging: `HOLD`.

The source-only execution record contains 51 total command calls: 40 returned
zero and 11 returned non-zero. The non-zero results are one blocked read-only
`git status` at the `dsh` submodule, two rejected `bash` launches before execution,
three PowerShell quoting/parser errors in read-only inspection commands, one
PowerShell verification-call binding error, one verification-path assumption
error, two verification-text assumption errors, and one expected non-zero
`git diff --no-index` result used to inspect the source delta.
No command ran Node, Python, parser/import/check/test/build, prepare, admission,
GUI, HTTP, model, credential storage, or process probes. Git writes: 0.

## Historical violation retained

The earlier T34 read-signature source-finalization job remains a historical
runtime violation: its commands 32 and 33 ran `finite5` and `finite2`, and its
results are not independent ROOT acceptance. The original failed status is
preserved. That evidence records 38 raw commands without GUI or model
execution; it is not relabeled as a pass.

## Prepared invocation, not run

```powershell
$Evidence = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LiteralRouteGUI-20261030-225948'
$RunRoot = Join-Path $Evidence 'runs\T34-private-projection-observer-YYYYMMDD-HHMMSS'

& pwsh -NoProfile -File (Join-Path $Evidence 'prepare.ps1') -RunRoot $RunRoot
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 (Join-Path $Evidence 'entry.py') --admit --root $RunRoot
& pwsh -NoProfile -File (Join-Path $Evidence 'start.ps1') -RunRoot $RunRoot -LifetimeSeconds 600
& pwsh -NoProfile -File (Join-Path $Evidence 'stop.ps1') -RunRoot $RunRoot
```

ROOT must independently perform admission, one fresh actual native settings
`required_unset` GUI startup, physical private-patch verification, and owned OS
closure. This source bundle does not authorize a second route variant or a
candidate/SDK fix.
