# HANDBACK B — T18 Request Digest Context Closure

Status: `AUTHORED_NOT_RUN`

Product fix: none.

Author runtime: 0 model executions.

## Scope completed

- Corrected the copied B companion `SOURCE_PINS` path to the approved `T18RequestDigestInput-20261031-215607\reviewed-b346-current.json` identity while preserving 53,548 bytes and updating its SHA-256 to `98d18e82053f1d1d4d0e8543e97011907bc6387a148537f308f1288ea84155fd`.
- Changed the request-digest helper's one in-scope tee-branch cancellation to nonblocking cleanup; the original schema observer and all guards were left unchanged.
- Added the twelfth finite-source control for a 2 MiB + 1 byte actual `Request.clone` body. It requires `too-large-body` within a 1,500 ms `Promise.race`, consumes the original body independently in `finally`, verifies exact bytes, and clears the timer in an inner `finally`. A helper that awaits tee cancellation fails the bounded control.
- Updated only the manifest consumer and companion byte/SHA entries. Source, input, dependency and all other manifest fields were preserved.
- Appended a correction to the candidate README that qualifies earlier authored claims.

## Authored files

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607\b-service-defense-opinion.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607\native-defense-opinion.mts`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607\request-digest-finite.mjs`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607\literalfixed-inputs.json`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RequestDigestActual-20261031-215607\README.md`

## Verification boundary

No runtime command, test, probe, parser, AST check, app launch, model request, HTTP request, GUI action, environment inspection, or credential access was performed. Git was strictly read-only by prohibition and was not queried or mutated. The prior formal handback `HANDBACK-B-T18RequestDigest-20261031-215607.md` was not rewritten.

This is a source-only closure handoff for independent full-inverse review and the root's single real original workflow. It does not claim that controls pass.
