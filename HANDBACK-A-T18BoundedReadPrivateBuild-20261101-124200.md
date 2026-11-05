# HANDBACK — T18 Bounded Read Private Build

- Task: `ORCH-A-T18BoundedReadPrivateBuild-20261101-124200`
- Execution line: A / DeepSeek
- Status: `AUTHORED_NOT_RUN`
- Runtime executions: `0`
- Git writes: none
- Final result: bounded source changes authored and delivered; no build or private output created

## Bounded changes

1. Created fresh evidence root:
   `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\T18BoundedReadPrivateBuild-20261101-124200`
2. Created `build-private.mjs` as a byte-exact copy of the approved old builder.
3. Created `build-config.mjs` from the approved old config and changed only the six literal values in `approved.json.config_mapping`:
   - evidence root
   - agent tree SHA-256
   - agent tree byte count
   - embedded-contract tree SHA-256
   - embedded-contract byte count
   - `dsh-ext\agent\index.ts` file SHA-256
4. Changed exactly the two approved occurrences in
   `dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`,
   adding `end: 1` to the positive `case_read_material` assertion and execution.

No other product or test file was intentionally changed. Existing dirty state was not reset, cleaned, stashed, or checked out.

## Final SHA-256 and size

| Target | Bytes | SHA-256 |
| --- | ---: | --- |
| `docs\plan\evidence\T18\T18BoundedReadPrivateBuild-20261101-124200\build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `docs\plan\evidence\T18\T18BoundedReadPrivateBuild-20261101-124200\build-config.mjs` | 20799 | `ffa36d33324b0cd39bebfc9aad9741a1b43077e6e55f059e759c92925ae0c7b7` |
| `dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts` | 15620 | `e5caf7ec8d2a5c60b2d493877aef674b0c7c3b9d63f7abfb7054f21f7ec63ec5` |

The builder size and hash match the approved values.

## Verification boundary

- Performed only the instructed final SHA-256/size check over the three targets.
- The first invocation of that metadata check stopped at PowerShell parsing before any file was accessed; the same final check was then run once successfully.
- Did not run Python, Node, a parser, checker, test, collector, build, prepare step, model, HTTP request, or GUI.
- Did not create an actual build or a `private-output-*` directory.
- Did not invoke any Git write operation and did not attempt lock or permission repair.
- Did not contact another chat, change API configuration, alter sandbox/approval/ACL state, or remove a writer lock.

## Blockers and handback

No blocker affected the authorized bounded delivery. This handback certifies source authorship and static metadata only; it does not claim compilation, test execution, runtime readiness, private-output creation, or release readiness.
