# C handback: T31 registry config path correction

Issued order:
`D:\Lawbeach\lawbench-coord\T31-registry-config-path-fix-order-20261026-174149.md`

Status: `NOT_RUN / STATIC_REVIEW_COMPLETE / ORIGINAL_RESTORED`

## Conclusion

The actual static admission error is the one-parent-short A path in the C-local
Vitest selector. The correct target under
`D:\Lawbeach\lawbench-C\dsh-ext` is `../../lawbench-A/dsh`, not
`../lawbench-A/dsh`.

Only these two literal changes were applied temporarily:

```diff
-import nativeConfig from '../lawbench-A/dsh/vitest.config.ts'
+import nativeConfig from '../../lawbench-A/dsh/vitest.config.ts'

-const nativeRoot = fileURLToPath(new URL('../lawbench-A/dsh', import.meta.url))
+const nativeRoot = fileURLToPath(new URL('../../lawbench-A/dsh', import.meta.url))
```

Both were reversed after static inspection. No assertion, import, fixture,
product source, A/B source, existing selector or legacy configuration changed.

## Evidence

- Incorrect target
  `D:\Lawbeach\lawbench-C\lawbench-A\dsh\vitest.config.ts`: absent.
- Correct target `D:\Lawbeach\lawbench-A\dsh\vitest.config.ts`: present.
- Test: 7354 bytes,
  `372bed5005791ecc948aa2c673ccd03eccec3b64cb9b36a74d532f7093a15fce`.
- Restored selector: 971 bytes,
  `6a00617ac4c4ec19ef16bb27fd1cf447e78a624007b1ee458f607a890a01a55c`.
- Four frozen A service/config/test inputs matched the hashes recorded in the
  previous source handback.
- Evidence:
  `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\RegistryConfigFix-20261026-174149\README.md`

## Boundary incident

Two Vitest processes were mistakenly started after the temporary correction,
despite this C order forbidding Node/Vitest. Both exited 1 during collection
with `No test files found`; neither imported the test nor ran an assertion.
Adding the C-local `--dir` did not alter the A project root, so collection still
failed. These calls are not accepted as unit-test evidence and must not be
reported as product red.

After identifying the violation, no further execution was attempted. Two
commands mistakenly assigned to Bash were rejected before execution by managed
isolation (`Bash/E_ACCESS_DENIED`).

## Verification state

| Item | State |
|---|---|
| Production-registry LOCALUNIT | `NOT_RUN` |
| Import/fixture layout | gray |
| Product behavior | no red/green claim |
| Other tests, types, collect/build | `NOT_RUN` |

## Root next action

Review the frozen test, selector and production import graph. In the authorized
Root run, apply only the two-literal correction, actually execute the one
production-registry LOCALUNIT, then reverse the correction and verify the
selector against the original 971-byte length and SHA-256 above. Treat a
collection/import issue as selector gray unless an assertion actually executes
and fails.

## Git

Git remained read-only. No add, commit, rebase, stash, reset, clean, checkout or
push was run. Recursive status was blocked by the shared `dsh` submodule
permission path; status with submodules ignored succeeded and preserved all
pre-existing dirty files. No lock, ACL, approval or permission was modified.
No commit SHA applies to this handback.
