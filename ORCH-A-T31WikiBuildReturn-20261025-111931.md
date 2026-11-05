# ORCH-A T31 wiki build return — 20261025-111931

Status: BUILD PREPARED; not GUI/runtime verified.

## Build result

- Ran the authorized builder exactly once from `D:/Lawbeach/lawbench-A/dsh-ext`: `E:/node/node.exe scripts/build.mjs`.
- Actual exit: `0`; build stamp: `202610251120`.
- Builder-internal pure-ESM imports passed for all five ESM outputs; `lib/host.js` method/parameter-name check passed.
- Current HEAD: `a23271abee333a9a256fd46a3141da16975c2380`.
- Existing dirty worktree was preserved. No Git add, commit, rebase, stash, reset, clean, checkout, or push was attempted.

## Six-artifact pin

| Artifact | SHA-256 | Bytes |
|---|---|---:|
| `agent.js` | `3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43` | 528111 |
| `client.js` | `c551f476c4992af95eaddd5a0eedd7a0a316cd12ebc028bab90dca0ff522589f` | 508590 |
| `credentials.js` | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` | 15774 |
| `host.js` | `4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8` | 892610 |
| `index.js` | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` | 208 |
| `session-store.js` | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` | 44858 |

Only `client.js` differs from the pre-build backup; the other five SHA-256 values and byte counts are unchanged. The old six+two backup remains at `C:/Users/morel/Documents/Codex/2026-10-21/deepseek-codex-gpt-advisor-reviewer/outputs/T31-wiki-build-before-20261025-111931`.

## Fixed sources

- `D:/Lawbeach/lawbench-A/dsh-ext/ui/wiki-card.tsx`: `aa3080aff89e12caf173e838ef6635203ed51858a64c5e93ab58521de5db5e5a`, 12394 bytes.
- `D:/Lawbeach/lawbench-A/dsh-ext/tests/wiki-card.spec.ts`: `ae7089e08404237f57010f07c395f6870ac90e51e42a749d38d50801d34ec984`, 13908 bytes.
- Both hashes were rechecked after build and remain exact.

## Evidence

- `D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/WikiEmptyBuild-20261025-111931/manifest.json`
- `D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/WikiEmptyBuild-20261025-111931/README.md`

The README records the exact current loader consumer lines and the narrow unresolved dependency: whether typert/package and client bundle discovery accept absolute/`file:` entry paths while preserving expected package metadata. No new private profile patch or workaround was created, and no runtime claim is made.

## Not performed

No Vitest, tsc, pytest, collect, self-test, dependency install/download, GUI, RPC, prepare, Host, native-app, service launch, E50 copy, resolver/guard change, launcher/patch write, or second build was performed.

## Read limitations / blockers

- Full `git status --short` could not enter the protected `dsh` submodule Git directory and failed read-only; `git status --short --ignore-submodules=all` completed and confirmed existing dirty state. HEAD remained readable. No permission, ACL, index/lock, sandbox, approval, or writer-lock repair was attempted.
- Two early read-only checks were accidentally submitted with `shell=bash` and were denied by MXC before execution. They were rerun only with the mandated native `pwsh`, `login=false`; no setup or fallback was started.
