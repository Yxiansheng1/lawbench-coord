# T34 settings-read signature evidence

This handoff adds one read-only Host observation at
`LawbenchRemote.prototype.getSettings`. The new observer imports only the
byte-pinned Host shim already materialized at
`<run>/gui/private-native/lib/host.js`, wraps that method without changing its
receiver, arguments, or returned promise, and emits fixed metadata to Host
stdout. It does not observe UI state writes, the client, Gateway delivery, or
answer correctness.

The observed wrapper has no formal parameters and forwards the original
`arguments` through `Reflect.apply`. This preserves argument forwarding while
satisfying the actual Gateway's `Function.prototype.toString` signature check.
The exact original five observer controls remain unchanged and are rerun.

## Commands

```powershell
$Evidence = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsReadSignatureGUI-20261030-134212'
$RunRoot = Join-Path $Evidence 'runs\T34-private-projection-observer-YYYYMMDD-HHMMSS'

& pwsh -NoProfile -File (Join-Path $Evidence 'prepare.ps1') -RunRoot $RunRoot
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 (Join-Path $Evidence 'entry.py') --admit --root $RunRoot
& pwsh -NoProfile -File (Join-Path $Evidence 'start.ps1') -RunRoot $RunRoot -LifetimeSeconds 600
& pwsh -NoProfile -File (Join-Path $Evidence 'stop.ps1') -RunRoot $RunRoot
```

During the single GUI run, open the settings page once. Do not save, edit, or
perform the ordinary provider action. The existing projection observer remains
installed and the new `T34_SETTINGS_READ_OBS` records are read from normal Host
stdout/log capture.

## Runtime and evidence

- Previous source author runtime: 2. Contrary to the explicit runtime-zero
  order, that author performed two finite Node executions (commands 32 and 33
  of 38). ROOT stopped the exact CLI at PID 61292,
  `C:/Users/morel/AppData/Local/OpenAI/Codex/bin/08d187884f2330d1/codex.exe`,
  birth UTC `2026-10-30T05:42:28.0767440Z`. The original source job remains
  FAILED; no formal completion was issued by that author. The two finite
  results below are not independent ROOT acceptance.
- Current source finalizer runtime: zero. This finalizer performed no prepare,
  admission, Node, Python, GUI, HTTP, model, process probe, test, or
  target-runtime filesystem write; it only finalized this source handoff.
- Finite helpers: the unchanged helper has exactly five memory-only controls.
  `signature-finite.mjs` adds exactly two memory-only controls against the
  byte-pinned parser source: the old rest-parameter wrapper must be rejected
  before the original method runs, while the new zero-formal-parameter wrapper
  must be accepted and preserve its returned promise/value and restore.
- Source/product/build inputs: unchanged by this handoff.
- Provider diagnostic channel: one `console.error` changed to `console.log` in
  the private provider binding so the existing stdout relay can retain it.
- Scope: the signature helper exercises the pinned parser source only. It is
  not full Gateway dispatch, Host, client, or native projection proof.

## Finite validation

- `UNAUTHORIZED_AUTHOR_PRE_REVIEW_RESULTS_NOT_ROOT_ACCEPTED`:
  `observer-finite.mjs`: 5/5 controls PASS, exit 0, 0.121 s.
- `UNAUTHORIZED_AUTHOR_PRE_REVIEW_RESULTS_NOT_ROOT_ACCEPTED`:
  `signature-finite.mjs`: 2/2 controls PASS, exit 0, 0.112 s. The old wrapper
  was rejected before the original call; the new wrapper was accepted with
  `names=[]`, preserved promise/value identity, and restored successfully.
- Both invocations used the pinned Node executable and a 90-second bound. These
  were the two forbidden previous-author finite runs; no Python, GUI, model, or
  HTTP was run.

## NOT RUN

Prepare, admit, start, GUI, settings-page read, native projection observation,
settings-read observation, stop, OS closure, provider greens, model/network,
and packaging were NOT run.

An actual Host rejection would support an early boot/service-state cause. An
actual Host fulfillment with a failed UI read would leave the client cause
UNKNOWN. Neither result alone is T34 PASS.

This is a source-only handback. It does not assert T34 PASS, and it does not
replace ROOT's required independent review and actual GUI run.
