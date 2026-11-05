# T34 private-runtime native GUI launcher

**PREPARED FOR ROOT REVIEW. THE AUTHOR DID NOT RUN THESE SCRIPTS, THE GUI,
OR A MODEL REQUEST. THIS IS NOT GUI OR MODEL ACCEPTANCE.**

This directory prepares a fresh native GUI run with the reviewed T34 six-file
private UI package and a separate native-module metadata directory for the
Host and Agent files. The old E50 runtime, resolver, network guard, cleanup,
environment, relay, native routes, and original absolute `lawbench-dsh` install
anchor remain unchanged. The UI row resolves from
`privateplugin\lib\index.js`; the Host and Agent rows resolve from the isolated
`private-native\lib` directory.

## Fixed source state

- From the supplied CoreRuntimeGui originals, `prepare.ps1` and `start.ps1`
  change only their `$NativeEntry` and `$NativeEntrySha256` literals;
  `stop.ps1` changes only its `$runsRoot` literal. Five literals changed in
  total, and reversing them reproduces each supplied original byte for byte.
- Current task-GUI hashes:
  `prepare.ps1`
  `b5cbd654ecb312bd5da992276d907f9ae83725aaa499a02b312dddbc3960dcad`,
  `start.ps1`
  `1e4b0af162c33f945cda10efa3185938b510b1e583030a6049252a686d1c2fb5`,
  and `stop.ps1`
  `c52582200211e6186ea85c1c0e4197fc0ecc72f5120feb4bc47fbd32ad6d9cb5`.
- Native entry:
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\TaskSelectionEntry-20261025-154140\server.py`
  with SHA-256
  `ed7be2e8530f128d3068e793cc04c0d05deb7d68aefd243353c428df06d5fd34`.
- Reviewed frozen library directory:
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-core-build-root-full-20261025-144914\current`.
- The real source files under `D:\Lawbeach\lawbench-A\dsh-ext\lib` and all six
  files in that frozen directory match the following pins.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `agent.js` | 528,681 | `b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b` |
| `client.js` | 508,590 | `a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46` |
| `credentials.js` | 15,774 | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` |
| `host.js` | 893,180 | `a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994` |
| `index.js` | 208 | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` |
| `session-store.js` | 44,858 | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

The reviewed root build record is
`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-core-build-current.json`.
Its `PASS_SOURCE_AND_COMPILED_CONTRACT_DATA_ONLY` verdict covers source and
compiled contract data only; it does not cover this launcher, GUI startup, or a
live model round trip.

## Bounded launcher change

`start.ps1` differs from the supplied original in these reviewed implementation
areas:

1. `AssetPins` and `WikiPluginLibPins` use the six literal pins above. The
   existing frozen-file dispatch branch is extended to those exact six
   library paths, with each file read from the reviewed `T34-core-build`
   current directory by its real name. The other five frozen targets still
   come from the original T34 projection snapshot. The original runtime,
   guard, resolver, PDF, native-entry, no-reparse, environment, relay,
   cleanup, and network assertions remain.
2. The profile suffix retains the private UI file URL, routes the existing
   Host and Agent rows to the isolated native directory, and preserves the
   seven-field Host config and complete preset object with
   `validateContracts: true`. The copied E50 `cordis.patch.yml` prefix remains
   byte-identical.
3. `Prepare-PrivateProfile` creates `private-native\lib`, writes only the
   fixed package metadata below, and copies the pinned Host and Agent bytes
   there with literal SHA-256 assertions. No Host or Agent copy is removed
   from `privateplugin`; its existing package metadata and all six pinned
   library files remain unchanged. The duplicate-package validator remains
   enabled.

The suffix appends only these configuration operations:

- Disable built-in `legal-ui`, then insert the sole private UI row
  `legal-ui-wiki-private` with the private `index.js` file URL.
- Disable built-in `legal-host`, then insert the sole private Host row
  `legal-host-t34-private` with the isolated native `host.js` file URL. Its
  complete seven-field config is the `legal-host` config from
  `profile-overlay.yml`.
- Replace the existing top-level `preset-lawbench` config with the complete
  object from `bundle-patch.yml`, preserving persona, skill, compaction, and
  parameter objects. Only its existing `legal-agent.name` becomes the private
  isolated native `agent.js` file URL; `validateContracts: true` remains. No
  second preset, Host, or Agent is added.

The private UI package and isolated native metadata written under a fresh run
root contain:

```text
<runRoot>\gui\privateplugin\package.json
<runRoot>\gui\privateplugin\lib\agent.js
<runRoot>\gui\privateplugin\lib\client.js
<runRoot>\gui\privateplugin\lib\credentials.js
<runRoot>\gui\privateplugin\lib\host.js
<runRoot>\gui\privateplugin\lib\index.js
<runRoot>\gui\privateplugin\lib\session-store.js
<runRoot>\gui\private-native\package.json
<runRoot>\gui\private-native\lib\agent.js
<runRoot>\gui\private-native\lib\host.js
```

The isolated `private-native\package.json` is exactly:

```json
{"name":"lawbench-t34-native-private","type":"module","private":true}
```

It deliberately has no `dsh`, `client`, `exports`, or `scripts` field. It is
module-ownership metadata for the fresh test tree, not an installer or a
second UI package.

## 1. Prepare

Run only after root review, using:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\TaskSelectionGui-20261025-155216\prepare.ps1'
```

Keep the printed `runRoot`. It must be a new direct child of
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\TaskSelectionEntry-20261025-154140\runs`.

## 2. Start

After root review of the prepared source and cumulative diff:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\TaskSelectionGui-20261025-155216\start.ps1' -RunRoot '<printed runRoot>'
```

The start command returns after the hidden single-run supervisor publishes
`started.json` and `ready.json`. Record
`<runRoot>\gui\state\current.json` and
`<runRoot>\gui\state\handoff.json`.

No prepare, start, GUI journey, cleanup, or model request is claimed by this
prepared artifact. Any later root run must use the recorded exact process
identities and must not treat process startup alone as GUI or model acceptance.

## 3. GUI run boundary

The reviewed native entry is prepared for its 11 GET routes plus case/open and
exactly one task POST using `contract-draft`, local mode, empty inputs, its own
strict pending readback, and the real session. The task may be posted only
once. The root GUI must not select a second task capsule, change parameters or
routing, or use retry. It must not send any model message.

The finite-HTTP `15`-`30` second bound belonged to the preceding native-task
stage and is not a GUI limit. The overall GUI journey must finish within
`600` seconds or less. Use a fresh root that has not already served HTTP.

This preparation is not a GUI run. A successful HTTP task POST, a successful
GUI selection, model success, non-empty execution, and document saving are
separate claims. None is asserted here.

## 4. Stop

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\TaskSelectionGui-20261025-155216\stop.ps1' -RunRoot '<printed runRoot>'
```

Read `<runRoot>\gui\state\stop-report.json`. Acceptance requires zero remaining
exact process identities and zero listeners on the recorded native loopback
port. A forced Python stop must not be described as normal Python cleanup.
Neither script removes a run root or uses broad process-name cleanup.
Stopping does not remove the fresh run's `privateplugin` or `private-native`
directories.

## Author boundary

This preparation performed read-only fact and hash checks, copied the supplied
four files, made exactly the five script literal replacements described above,
and updated this README. No prepare/start/stop script, setup, installer,
package, GUI, server, runtime copy, model request, static parser, test runner,
or Git write was performed. Packaging remains on HOLD.
