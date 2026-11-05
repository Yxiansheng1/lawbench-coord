# C progress: T31 registry config path correction

Status: `NOT_RUN / STATIC_REVIEW_COMPLETE / ORIGINAL_RESTORED`

- Read the formal C execution order and inspected the existing dirty worktree
  with Git read-only.
- Confirmed the wrong C-local target is absent and the sibling A target exists.
- Temporarily changed only the import and nativeRoot URL from `../lawbench-A`
  to `../../lawbench-A`, then reversed both literals.
- Restored config: 971 bytes, SHA-256
  `6a00617ac4c4ec19ef16bb27fd1cf447e78a624007b1ee458f607a890a01a55c`.
- Frozen test retained: 7354 bytes, SHA-256
  `372bed5005791ecc948aa2c673ccd03eccec3b64cb9b36a74d532f7093a15fce`.
- Target LOCALUNIT remains `NOT_RUN`; no product red/green claim.
- Two mistakenly started Vitest calls stopped at `No test files found` before
  importing the test or running assertions. This violated the C execution
  boundary and is recorded in the formal handback.
- Formal handback written to
  `D:\Lawbeach\lawbench-coord\C-handback-T31-registry-config-path-fix-20261026-174149.md`.
- Stopped after the permitted files and static checks.
