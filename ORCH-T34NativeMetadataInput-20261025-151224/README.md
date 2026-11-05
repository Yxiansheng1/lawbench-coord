# T34 private-runtime native GUI launcher

**PREPARED FOR ROOT REVIEW. THE AUTHOR DID NOT RUN THESE SCRIPTS, THE GUI,
OR A MODEL REQUEST. THIS IS NOT GUI OR MODEL ACCEPTANCE.**

This directory prepares a fresh native GUI run with the reviewed T34 six-file
private package. The old E50 runtime, resolver, network guard, cleanup,
environment, relay, native routes, and original absolute `lawbench-dsh` install
anchor remain unchanged. The launcher only routes the private UI, Host, and
Agent rows to the reviewed private library.

## Fixed source state

- `prepare.ps1` and `stop.ps1` are byte-identical to the supplied originals.
  Their SHA-256 values remain
  `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37`
  and `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647`.
- Native entry:
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py`
  with SHA-256
  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`.
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

`start.ps1` differs from the supplied original in only two implementation
areas:

1. `AssetPins` and `WikiPluginLibPins` use the six literal pins above. The
   existing frozen-file dispatch branch is extended to those exact six
   library paths, with each file read from the reviewed `T34-core-build`
   current directory by its real name. The other five frozen targets still
   come from the original T34 projection snapshot. The original runtime,
   guard, resolver, PDF, native-entry, no-reparse, environment, relay,
   cleanup, and network assertions remain.
2. The profile suffix materializes private file URLs for the existing UI,
   Host, and Agent rows. The copied E50 `cordis.patch.yml` prefix remains
   byte-identical.

The suffix appends only these configuration operations:

- Disable built-in `legal-ui`, then insert the sole private UI row
  `legal-ui-wiki-private` with the private `index.js` file URL.
- Disable built-in `legal-host`, then insert the sole private Host row
  `legal-host-t34-private` with the private `host.js` file URL. Its complete
  seven-field config is the `legal-host` config from `profile-overlay.yml`.
- Replace the existing top-level `preset-lawbench` config with the complete
  object from `bundle-patch.yml`, preserving persona, skill, compaction, and
  parameter objects. Only its existing `legal-agent.name` becomes the private
  `agent.js` file URL; `validateContracts: true` remains. No second preset,
  Host, or Agent is added.

The private package written under a fresh run root contains:

```text
<runRoot>\gui\privateplugin\package.json
<runRoot>\gui\privateplugin\lib\agent.js
<runRoot>\gui\privateplugin\lib\client.js
<runRoot>\gui\privateplugin\lib\credentials.js
<runRoot>\gui\privateplugin\lib\host.js
<runRoot>\gui\privateplugin\lib\index.js
<runRoot>\gui\privateplugin\lib\session-store.js
```

## 1. Prepare

Run only after root review, using:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\prepare.ps1'
```

Keep the printed `runRoot`. It must be a new direct child of the T33 native
`runs` directory named `T33-host-YYYYMMDD-HHMMSS`.

## 2. Start

After root review of the prepared source and cumulative diff:

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\start.ps1' -RunRoot '<printed runRoot>'
```

The start command returns after the hidden single-run supervisor publishes
`started.json` and `ready.json`. Record
`<runRoot>\gui\state\current.json` and
`<runRoot>\gui\state\handoff.json`.

No GUI journey or model request is claimed by this prepared artifact. Any later
root run must use the recorded exact process identities and must not treat
process startup alone as GUI or model acceptance.

## 3. Stop

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\stop.ps1' -RunRoot '<printed runRoot>'
```

Read `<runRoot>\gui\state\stop-report.json`. Acceptance requires zero remaining
exact process identities and zero listeners on the recorded native loopback
port. A forced Python stop must not be described as normal Python cleanup.
Neither script removes a run root or uses broad process-name cleanup.

## Author boundary

The author performed read-only fact and hash checks, copied the supplied four
files, and made the bounded `start.ps1` and documentation changes described
above. No prepare/start/stop script, setup, installer, package, GUI, server,
runtime copy, model request, static parser, test runner, or Git write was
performed. Packaging remains on HOLD.
