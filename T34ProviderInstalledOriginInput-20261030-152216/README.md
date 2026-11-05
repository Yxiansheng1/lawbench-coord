# T34 settings-startup GUI evidence

Status: `SOURCE_ONLY_READY_FOR_ROOT_REVIEW`. This bundle is not a T34 PASS,
and no GUI or settings-read result is claimed.

The bundle is prepared for one fresh actual GUI of the accepted
`LawbenchRemote.prototype.getSettings` startup-readiness fix. A run must first
wait while `lawbenchCore.state` is `starting`, using the existing
`onState` mechanism, under one 30000 ms total bound across wait and fetch.
`stopped`, `failed`, and `version_mismatch` remain immediate; `running` issues
one `getSettings` call. The wrapper must preserve the original call with no
formal parameters, `Reflect.apply` over `arguments`, the original promise and
error path, one-shot emission, eight-event/16384-byte caps, privacy, and
restoration.

## Current pins

- Host source: `dsh-ext\host\index.ts`, 63665 bytes,
  SHA-256 `cb3679ae85ea6b4f56406b5cbb1e01c1fe0e4739bb22d0ccf05cd4c7ac8fbf83`.
- Private build:
  `docs\plan\evidence\T34\SettingsStartupPrivateBuild-20261030-141828\private-output-20261030-142648`.
- Manifest: 58194 bytes,
  SHA-256 `98fb7a0d47d553fefaa1d608c2e65a221679a4bce17b1987115b4cb8ee8f7e10`.
- Private Host output: 904755 bytes,
  SHA-256 `ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba`.
- Private client output: 539494 bytes,
  SHA-256 `87ffe74e00e2e194a67c3f07cc2567a1ca9ccd9de1be5910103be9d59c0ff869`.
- The remaining 22 private outputs and the existing provider component remain
  pinned byte-for-byte.

## Runtime status

- Current author runtime: zero prepare, admission, Node, Python, AST/parser,
  import, check, test, build, app, GUI, HTTP, model, environment-key, DPAPI,
  or process-probe calls.
- Actual GUI/settings read: `NOT RUN`.
- Necessary ordinary unset: `NOT YET VERIFIED`.
- Underlying `ConfigEditor` write cause: `UNKNOWN`.
- Packaging: `HOLD`.

The observed non-zero operations for this source-only finalization are the
blocked read-only `git status`, one shell-wrapper rejection before execution,
and one PowerShell parser correction. They produced no source, product, or
runtime state change. Detailed evidence is in the formal handback.

## Prepared invocation

```powershell
$Evidence = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsStartupGUI-20261030-143043'
$RunRoot = Join-Path $Evidence 'runs\T34-private-projection-observer-YYYYMMDD-HHMMSS'

& pwsh -NoProfile -File (Join-Path $Evidence 'prepare.ps1') -RunRoot $RunRoot
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 (Join-Path $Evidence 'entry.py') --admit --root $RunRoot
& pwsh -NoProfile -File (Join-Path $Evidence 'start.ps1') -RunRoot $RunRoot -LifetimeSeconds 600
& pwsh -NoProfile -File (Join-Path $Evidence 'stop.ps1') -RunRoot $RunRoot
```

These commands have not been run. The bounded finite helpers are for ROOT
reuse only and must not be executed by this source handoff.
