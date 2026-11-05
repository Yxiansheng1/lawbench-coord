# T34 canonical original-runtime GUI source bundle

Status: `SOURCE_ONLY_READY_FOR_ROOT_REVIEW`. This bundle is not a T34 PASS.
No actual GUI, settings read, necessary-unset result, physical patch result, or
owned OS closure is claimed.

The existing root cause remains the proven E50 snapshot missing its CLI. The
canonical development runtime already contains the original compiled SDK,
desktop host, CLI, and profile boot. This bundle performs only the approved
source-only follow-up needed for ROOT to exercise that canonical runtime.
It does not repeat the old E50 control.

## Bounded source changes

- `prepare.ps1`, `stop.ps1`, and `entry.py` change only their owned evidence
  roots. `start.ps1` moves its evidence root and the corresponding entry hash
  and byte count; the relocated `entry.py` is 88654 bytes with SHA-256
  `aa42c2aa1e9f0b3e5b84b1ba20b9bdd26ac35a1552a491f7f3d67ed266001f64`.
- `start.ps1` adds the literal canonical runtime root
  `D:\Lawbeach\lawbench-A\dsh\apps\desktop\.desktop-build\development\project`
  and exactly 38 physical file pins from the approved manifest.
- Immediately before child launch, the existing preflight verifies that the
  canonical runtime directory exists, that no `.env` file exists there without
  reading environment-file content, and that every one of the 38 physical
  files matches its approved byte count and SHA-256.
- Exactly one environment assignment changes:
  `DSH_DESKTOP_DSH_DIR` moves from `$Project` to
  `$CanonicalOriginalRuntime`. `$Project` remains the immutable E50 input for
  the frozen profile, legacy checks, and special LawBench persona resolver.
- `NODE_OPTIONS` remains only the original resolver import and network guard.
  No candidate provider preload or binding is introduced.
- `projection-observer.mjs`, `settings-read-observer.mjs`,
  `private-provider-binding.mjs`, `observer-finite.mjs`, and
  `signature-finite.mjs` remain byte-identical to the approved baseline.
- The original E50 inputs, frozen 18 legacy pins, current 25 private files,
  three native shims, resolver, guard, network-deny policy, synthetic literal
  URL, private profile construction, cleanup paths, and 600-second lifetime
  bound remain unchanged.
- No SDK library copy, mirror, build, install, package, new link, or replacement
  resolver is produced. Existing canonical-runtime links are read only.

## Runtime and validation status

- Author Node/Python/parser/import/check/test/build/prepare/admit/start/GUI/HTTP/
  model/Key/DPAPI/SSH/process-probe calls: `0`.
- Actual GUI: `NOT RUN`.
- Settings read: `NOT RUN`.
- Necessary ordinary unset: `NOT RUN`.
- Physical patch verification: `NOT RUN`.
- Stop and owned OS closure: `NOT RUN`.
- Full suite: `HOLD` pending owner release.
- Whole T34: `NOT PASS`.

This author did only source inspection and file metadata operations. One final
PowerShell metadata read records the delivered file sizes and hashes; it does
not parse or execute any delivered script. ROOT must independently review the
source and pins, then perform one fresh controlled GUI startup, observe the
required unset and physical patch, stop the owned processes, verify OS closure,
and preserve any failure at its precise stage.

The source-only execution record contains 27 `exec_command` calls: 25 returned
zero and 2 returned non-zero. The non-zero results are one PowerShell syntax
error in a read-only hash command and one Bash launch rejected before
execution. Git reads: 0. Git writes: 0. No add, commit, rebase, stash, reset,
clean, checkout, or push was attempted.

Model requests allowed: `0`. Actual Keys allowed: `0`. External calls allowed:
`0`. Packaging: `HOLD`.
