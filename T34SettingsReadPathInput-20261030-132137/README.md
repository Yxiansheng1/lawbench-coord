# T34 settings-read boundary evidence

This handoff adds one read-only Host observation at
`LawbenchRemote.prototype.getSettings`. The new observer imports only the
byte-pinned Host shim already materialized at
`<run>/gui/private-native/host.js`, wraps that method without changing its
receiver, arguments, or returned promise, and emits fixed metadata to Host
stdout. It does not observe UI state writes, the client, Gateway delivery, or
answer correctness.

## Commands

```powershell
$Evidence = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsReadBoundaryGUI-20261030-125910'
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

- Author runtime: zero. No prepare, admission, Node, Python, GUI, HTTP, model,
  process probe, or target-runtime filesystem write was performed. The author
  only created this evidence handoff.
- Finite helper: source only. It must run under Root's bounded 90-second owned
  PID wrapper and has exactly five memory-only controls.
- Source/product/build inputs: unchanged by this handoff.
- Provider diagnostic channel: one `console.error` changed to `console.log` in
  the private provider binding so the existing stdout relay can retain it.

## NOT RUN

Prepare, admit, start, GUI, settings-page read, native projection observation,
settings-read observation, stop, OS closure, finite helper, parser/import/check/
test/build, provider greens, model/network, and packaging were NOT run.

An actual Host rejection would support an early boot/service-state cause. An
actual Host fulfillment with a failed UI read would leave the client cause
UNKNOWN. Neither result alone is T34 PASS.
