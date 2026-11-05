# T31 empty-wiki native GUI launcher

**PREPARED FOR ROOT REVIEW. THE AUTHOR DID NOT RUN THESE SCRIPTS OR THE GUI.**

This directory is the T33 native read launcher with one bounded GUI-client
dependency change. It prepares a fresh empty native case, starts the real
Electron/DSH/Host/native-service chain, loads the already reviewed T31 client
through one private file-URL package row, and stops the exact recorded process
tree. The earlier root GUI run still showed the missing-wiki legacy hint; the
actual root GUI result for this corrected launcher remains pending.

## Fixed inputs

- `prepare.ps1` and `stop.ps1` are byte-identical to
  `docs\plan\evidence\T33\NativeReadGui-20261025-110241`.
- Native entry:
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py`
  with SHA-256
  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`.
- E50 project, runtime, resolver, network guard, fake loopback sidecars,
  profile seed, native six-GET service, and the original six runtime library
  files remain unchanged.
- The current private-client source is
  `D:\Lawbeach\lawbench-A\dsh-ext\lib\client.js`, 508,590 bytes, SHA-256
  `c551f476c4992af95eaddd5a0eedd7a0a316cd12ebc028bab90dca0ff522589f`.
  Its frozen source is
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-wiki-build-root-full-20261025-1123\current\client.js`.
- Frozen wiki source and test under
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-wiki-empty-root-full-20261025-1120\current`:
  `wiki-card.tsx` is
  `aa3080aff89e12caf173e838ef6635203ed51858a64c5e93ab58521de5db5e5a`;
  `wiki-card.spec.ts` is
  `ae7089e08404237f57010f07c395f6870ac90e51e42a749d38d50801d34ec984`.
- The private package manifest is copied from the original E50 package and
  pinned to
  `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`.

The six library pins copied into the private package are:

```text
agent.js         3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43
client.js        c551f476c4992af95eaddd5a0eedd7a0a316cd12ebc028bab90dca0ff522589f
credentials.js   556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1
host.js          4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8
index.js         df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956
session-store.js 91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762
```

## 1. Prepare

Run only after root review and only once:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\prepare.ps1'
```

Keep the printed `runRoot` unchanged. It must be one new direct child of the
T33 native `runs` directory named `T33-host-YYYYMMDD-HHMMSS`. The script refuses
an existing target and verifies the fixed JPEG, empty case, settings, daily
marker, canonical paths, source snapshot, and absence of served artifacts.

## 2. Start

After the root confirms the fixed six-file private package, original overlay
prefix, and sole `legal-ui` suffix:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\start.ps1' -RunRoot '<printed runRoot>'
```

The fresh root gains only this private package:

```text
<runRoot>\gui\privateplugin\package.json
<runRoot>\gui\privateplugin\lib\agent.js
<runRoot>\gui\privateplugin\lib\client.js
<runRoot>\gui\privateplugin\lib\credentials.js
<runRoot>\gui\privateplugin\lib\host.js
<runRoot>\gui\privateplugin\lib\index.js
<runRoot>\gui\privateplugin\lib\session-store.js
```

The profile overlay begins with the exact original E50 `cordis.patch.yml` bytes
and ends with exactly:

```yaml
- id: legal-ui
  disabled: true
- insert:
    - id: legal-ui-wiki-private
      name: file:///<runRoot with forward slashes>/gui/privateplugin/lib/index.js
```

The first operation disables the built-in row by id. The second appends a new
row without an id qualifier, so the loader indexes the private file-URL entry.
The `name` field on the disabled operation is deliberately absent: it is match
only there and would make the operation skip when it differs from the built-in
name. There are no other suffix rows or settings.

All earlier rows, the original `lawbench-dsh` bundle, memory-provider bytes,
resolver, guard, environment, one-shot budget, cleanup, and six-GET behavior
remain unchanged. The native `lawbench-dsh` package stays at its original E50
absolute path.

The start command returns after the hidden single-run supervisor publishes
`started.json` and `ready.json`. Record:

```text
<runRoot>\gui\state\current.json
<runRoot>\gui\state\handoff.json
```

## 3. Root-only GUI journey

Use the actual Electron window only after reviewing the cumulative diff. Open
the prepared empty case from the sidebar. Confirm the fixed new client loaded
from the private artifact and that the missing-wiki legacy hint/card is absent.
Materials and OCR remain empty rather than failed. Exercise the six real native
read views (`tasks`, `outputs`, `ocrjobs`, `wiki-suggestions`, `wiki-review`,
and `task-current`) and confirm they do not return a generic contract error.

Do not generate wiki content, import material, send a model request, enter real
credentials, or use DOM/CDP, a fake response, or an invented success. The Home
capsule confirmation path is already green for the same source; do not rerun
that old test merely to fill time. A prepared script set is not GUI acceptance.

## 4. Stop

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\stop.ps1' -RunRoot '<printed runRoot>'
```

Read `<runRoot>\gui\state\stop-report.json`. Acceptance requires zero remaining
exact process identities and zero listeners on the recorded native loopback
port. A forced Python stop must not be described as normal Python cleanup.
Neither script removes a run root or uses broad process-name cleanup.

## Author boundary

The author performed read-only fact/hash checks, copied the four T33 files,
and made only the bounded `start.ps1` row-selection correction. No
prepare/start/stop script, server, build, install, static parser, test runner,
GUI, RPC, network request, credential, or Git write was performed.
