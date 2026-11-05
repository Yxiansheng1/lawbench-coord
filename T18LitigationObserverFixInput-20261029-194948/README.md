# T18 litigation-docs observer contract repair

## Status

`AUTHORED_NOT_RUN` by line B.

This directory contains repaired copies of the frozen litigation-docs consumer,
the unchanged B service entry, the literal-input manifest, and one finite
observer-replay script for root execution after review. Line B did not execute
the consumer, observer script, model, HTTP workflow, product tests, or build.
The full consumer requires root's future binding of the current eight private
files, four imports, and four pins before it can run.

## Frozen inputs

The task entry pins were checked before copying:

| File | Bytes | SHA-256 |
|---|---:|---|
| `native-litigation-docs.mts` input | 119392 | `b8994f1ef1f72314d43ba26cb2cda3bedff7b73addeccf095fc14491c6be5f88` |
| `b-service-litigation-docs.py` input | 46327 | `c9e8faa0b998eff4ed893a439e5030a76c0a04dda8e438e6bc2af563e29105f2` |
| `literalfixed-inputs.json` input | 11246 | `c2840fbd1ab6908d6b7dcd8f9cf3fcbf33ab9459ac0c9d92b3982fcfce7cb26e` |
| `original-actual-session.v4.jsonl` | 197963 | `c449784caf29430657eb65ab5265a155027f68857f4304312a8ac8b05a773f1b` |

The immutable failed packet is
`96859e21516083328c9c256dc073da438e4719142a4401af238046ca120f5d1e`.
It is evidence of a source/observer failure, not a test fixture to rewrite.

## Repaired copies

`native-litigation-docs.mts` is a copy of the pinned consumer with bounded
changes:

- Question capture now counts entries in `attemptCount` and increments
  `successfulCallbackCount` only after exactly four valid structured answers are
  ready to return. The authorized answer file is read only after question IDs,
  question text, and options validate.
- Question rejection now records `origin` as `production` or
  `synthetic_callback`. The synthetic-callback branch accepts only the exact
  `UNSUPPORTED_SYNTHETIC_QUESTION` literal for invalid or missing declared IDs.
- `observeReadTimeline` separately records exact producer-denied pre-answer read
  attempts and successful material/Wiki reads. The primary question observation
  is completed first. The full consumer fails if any successful read precedes
  the last required answer.
- Only successful material reads feed source parsing, coverage, and
  cited-before-save checks. Denied attempts remain in the report and are never
  parsed as read payloads.
- The setup retains all existing execution hooks but additionally requires the
  future current LegalAgent export `questionsBeforeReadDenial`. The frozen old
  private build has no such export, so this repaired consumer is intentionally
  not runnable in the old binding.

`b-service-litigation-docs.py` remains byte-for-byte unchanged. The manifest
changes only the new task identity, the two owned copy paths, and the repaired
consumer's own bytes/SHA. All six approved fixtures, twenty-six dependencies,
four compiler-private entries, three runtime executables, and the unchanged B
service pin remain literal.

## Actual replay facts

The observer repair must recognize the frozen actual session without changing
its events, sequence numbers, UUIDs, request history, response history, or R:

- Wiki reads begin at seq 18; material reads begin at seq 27.
- The bad two-ID callback is seq 36 with the exact synthetic-callback denial at
  seq 37. Its origin is `synthetic_callback`, not the production seven-gate.
- The one successful exact-four-ID callback is seq 41 and its answers are seq 42.
- Successful saves occur after the answers at call/result pairs 46/47, 51/52,
  56/57, and 61/62.
- The actual read order therefore remains **RED**:
  `wiki 18` and `material 27` precede `answers 42`.

The successful four answers before the first successful save remain accepted.
No assertion is weakened to turn the old pre-answer reads green.

## Finite replay

`observer-replay-finite.mjs` uses the frozen TypeScript compiler
`569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39`.
It extracts only the actual observer helpers and constants from the repaired
consumer, transpiles those fragments, and runs them in a private VM. It imports
no consumer module, Agent, Session, provider, SDK, product service, or model.

The script reads the exact 68-event JSONL, accepts a `ROOT_OBSERVER_RECEIPT`
line on stdin, and writes only the new `result.json` path supplied under this
evidence directory. Two mutation cases are explicitly marked `UNIT`: exact
pre-answer denial retention and arbitrary-denial rejection. They are not claimed
as producer/runtime evidence.

Line B did not execute this script. Root may run it only after source review:

```powershell
node .\observer-replay-finite.mjs `
  --source .\native-litigation-docs.mts `
  --source-sha 7e615458396fefcba57bb6f23647f9e40a6263b046705b9a5012fe48256d3ec3 `
  --actual D:\Lawbeach\lawbench-coord\T18LitigationObserverInput-20261029-192800\original-actual-session.v4.jsonl `
  --actual-sha c449784caf29430657eb65ab5265a155027f68857f4304312a8ac8b05a773f1b `
  --result .\root-result.json
```

The expected script verdict is observer contract pass with actual read order
RED. It does not authorize a model rerun and does not convert the frozen
68-event replay into a native API/producer proof.

## Boundaries

- No Git write, stage, commit, rebase, reset, clean, checkout, push, or stash was
  performed.
- No product tree, old served root, API, model, credential source, or global
  policy was changed.
- No Python, Node, TSX, TypeScript compiler, or test/build command was executed
  by line B.
- Business acceptance, full consumer execution, packaging, and producer proof
  remain `HOLD`/`NOT_RUN`.
