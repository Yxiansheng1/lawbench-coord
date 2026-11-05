# HANDBACK-A-T18GroundingFinalPrivateBuild-20261102-010229

STATUS: AUTHORED_NOT_RUN

## Delivered

- Created the fresh target root:
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\T18GroundingFinalPrivateBuild-20261102-010229`
- Copied the old `build-private.mjs` to the target by byte copy.
- Wrote the target `build-config.mjs` from the complete old config text.
- Applied only the four supplied literal mappings, with each source literal
  confirmed exactly once before the config write.
- Mapping values used:
  - Evidence root: old prep directory to the final target directory.
  - Agent source bytes: `120872` to `130480`.
  - Agent source tree SHA-256:
    `3b7840d...d5988` to `0f68054...e713`.
  - Grounding helper SHA-256:
    `611814e...c5cb` to `052b960...7c5`.

## Expected Values From The Mapping

- Builder SHA-256: `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`
- Config SHA-256: `002ee15ab98d3390f3621929213293886b306c8ee2178af321fd432c7edd618a`

These values are the supplied expectations. This authoring step did not hash,
count, or read back the target files.

## Boundaries Honored

- The existing product helper was not changed.
- No installer, release, default-library, product, or other source tree was
  written.
- No build, preparer, import, Node, Python, parser, test, HTTP, model, GUI, or
  credentials command was run.
- Git was not written to; no add, commit, rebase, stash, reset, clean,
  checkout, or push was run.
- Native absolute PowerShell with `login=false` and managed MXC isolation was
  retained.
- The only writes were the two allowed target files and this handback file.
- The root orchestrator retains responsibility for hashes, full inverse,
  setup, and finite build execution.
