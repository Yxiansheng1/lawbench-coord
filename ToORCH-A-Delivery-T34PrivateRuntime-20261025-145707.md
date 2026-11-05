# T34 private-runtime delivery

## Verdict

PREPARED ONLY. The four bounded launcher artifacts are ready for root review.
No GUI, live model, setup, process-start, cleanup, packaging, or installer run
is claimed. Packaging remains on HOLD.

Git commit: N/A. This order prohibited every Git write, including `add` and
`commit`; none was attempted. The pre-existing dirty worktree was preserved.

## Delivered files

Directory:
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707`

| File | Bytes | Current SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 5,544 | `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37` |
| `start.ps1` | 46,872 | `446586e991d0f0441fd57093e8fc39e7466736051914399ce2a22f2c6e0ffb88` |
| `stop.ps1` | 7,126 | `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647` |
| `README.md` | 6,214 | `4cd495a28560657668c48ef16149b4ce265b825f266c4fbd922beeb06483cfc5` |

The directory contains exactly those four files.

## Before/current cumulative difference

The supplied before snapshot and
`ORCH-T34PrivateRuntimeInput-20261025-145707` are byte-identical for all four
originals.

| File | Before bytes / SHA-256 | Current bytes / SHA-256 | Difference |
| --- | --- | --- | --- |
| `prepare.ps1` | 5,544 / `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37` | same | Byte-identical |
| `start.ps1` | 43,405 / `a268c51e5df0754edbbd6ebb154591c48f766948bdb5dfdafd9a591bdfd232` | 46,872 / `446586e991d0f0441fd57093e8fc39e7466736051914399ce2a22f2c6e0ffb88` | Six pins, frozen-file dispatch, and profile suffix only |
| `stop.ps1` | 7,126 / `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647` | same | Byte-identical |
| `README.md` | 6,619 / `6544f8de8e47aa00561bca794845a293a9abf3bdcc656845fa1df91824e73d2e2` | 6,214 / `4cd495a28560657668c48ef16149b4ce265b825f266c4fbd922beeb06483cfc5` | Replaced with T34 prepared-only instructions and boundaries |

### `start.ps1` changes

- `AssetPins` and `WikiPluginLibPins` carry the six reviewed T34 literal pins.
- The former client-only frozen-source branch is extended only to the exact
  six-library whitelist. Every library target is read from
  `T34-core-build-root-full-20261025-144914\current` by its real filename.
- The other five frozen targets continue to use the original T34 projection
  snapshot. The original runtime six assertions, network guard, resolver, PDF
  guard, native entry, no-reparse checks, environment, relay, budget, cleanup,
  and network controls remain literal.
- The copied E50 profile prefix remains byte-identical. Its suffix disables
  `legal-ui` and inserts sole row `legal-ui-wiki-private`; disables
  `legal-host` and inserts sole row `legal-host-t34-private` with the seven
  `profile-overlay.yml` fields; then replaces the existing
  `preset-lawbench` `config` object with the complete `bundle-patch.yml`
  object, changing only its existing `legal-agent.name` to the private
  `agent.js` file URL. `validateContracts: true` is retained.
- No second Host or Agent is added. No YAML dependency, dynamic loader, server,
  fixture, runtime copy, command-line trial, credential, or package change was
  introduced.

## Reviewed input and pins

- Root build record:
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-core-build-current.json`
- Root build verdict:
  `PASS_SOURCE_AND_COMPILED_CONTRACT_DATA_ONLY`
- Frozen library directory:
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-core-build-root-full-20261025-144914\current`

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `agent.js` | 528,681 | `b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b` |
| `client.js` | 508,590 | `a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46` |
| `credentials.js` | 15,774 | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` |
| `host.js` | 893,180 | `a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994` |
| `index.js` | 208 | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` |
| `session-store.js` | 44,858 | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

All six lengths and hashes matched both
`D:\Lawbeach\lawbench-A\dsh-ext\lib` and the frozen current directory.

## Read-only validation completed

- Target directory file set is exactly the four delivered files.
- `prepare.ps1` and `stop.ps1` are byte-identical to both supplied copies and
  the before snapshot.
- All six source/frozen pins, the new current-root literal, the existing
  network guard/resolver/native literals, and the Host seven fields are present.
- The `preset-lawbench` config object matches the supplied bundle object after
  excluding non-semantic comments and substituting the reviewed private Agent
  URL for its original Agent name.
- The suffix contains exactly one built-in Host disable operation, one private
  Host insertion, and one Agent child row.
- README explicitly says prepared-only, not GUI/model acceptance, and Packaging
  HOLD.

## Intentionally unverified

- `prepare.ps1`: not run. No run root, prepared manifest, case directory,
  settings, daily marker, fixture copy, or native preflight was exercised.
- `start.ps1`: not run. No private package materialization, YAML runtime parse,
  Electron/DSH/Host/native startup, exact runtime pin assertion, process
  identity recording, handoff, or ready state was exercised.
- GUI and root scope: no GUI launch, private UI/Host/Agent load, native read
  journey, service call, or live model request was performed.
- `stop.ps1` and cleanup: not run. Exact-process stop, native port closure,
  fallback-stop behavior, and cleanup reporting remain unverified.
- Prohibited checks were not run: setup, Vitest, `tsc`, pytest, collect,
  project parser, self-test, additional build, installer, package, or release.

## Execution deviation

Three read-only validation attempts failed inside the validation command itself
due to a PowerShell aggregation syntax error and two incorrect YAML fragment
boundaries. They made no filesystem change. The corrected read-only checks then
passed, but the retries caused the shell-call count to exceed the order's
ten-command ceiling. No product script, server, GUI, test, parser, build, or
Git write was executed during those retries.

No remaining preparation blocker was found. Runtime, GUI, model, and cleanup
acceptance remain deliberately unclaimed for root execution.
