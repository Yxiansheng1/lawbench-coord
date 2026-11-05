# HANDBACK B — T18 Sharded Bidirectional V4

Status: `AUTHORED_NOT_RUN`

Source root: `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18ShardedBidirectionalV4-20261101-213929`

## Delivery

The fresh source root contains the five required files only:

- `review-consumer.mjs`
- `fixed-data.json`
- `offline-controls.mjs`
- `stage1-assessments.json`
- `source-manifest.json`

The four copied files were created with .NET `File.Copy`. Final .NET SHA-256/size results pinned in `source-manifest.json`:

- `review-consumer.mjs`: 49695 bytes, `ee5b52624529d760b25a1a9ac36ceafb80a358f453f21ddc9c89e810b78c02c7`
- `fixed-data.json`: 17427 bytes, `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`
- `offline-controls.mjs`: 34986 bytes, `646e7ed6b2f2e1a0298a3696789996ffdd3ec60c151eb28405b67da4f0fb7173`
- `stage1-assessments.json`: 10015 bytes, `5e4ba4c51aa23b29b8625174c595d940628bbb7910ef6e9afcd4f777d5712fc1`

The copied fixed-data and Stage 1 cache retained the required byte identities. The manifest does not self-pin.

## Changed source

- `buildReviewShards(inventory)`: deterministic contiguous balanced two-shard plan; odd counts split by `ceil(n/2)`, with known/unique/nonempty/disjoint/exhaustive/canonical-order checks.
- `buildStage2Envelope(...)`: retains the full canonical target table and adds `review_target_ids` for the active shard.
- `buildStage2Messages(...)`: generic prompt instructs review of exactly the active IDs while retaining all targets for cross-family context and references.
- `validateStage2Result(parsed, inventory, expectedTargetIds = allCanonicalIds)`: strict expected-ID validation and exact incoming subset/count admission; known canonical IDs outside the active shard are rejected; refs may target any other-family canonical ID.
- `mergeShardReviews(inventory, shardPlan, shardReviewSets)`: validates two known, disjoint, exhaustive shards, exact-once review membership, and canonical final order with no missing waiver.
- `performRequest(...)`: retains transport classification and partial-body handling; adds static, whitelist-only `transportDiagnostic` fields for error name, known code, and known cause code. Messages, stacks, headers, bodies, URLs, credentials, and arbitrary strings are excluded.
- `runMain()`: no Stage 1 HTTP; reuses the pinned cache; builds inventory/cap/shard plan before credentials/request; performs sequential `stage2a` then `stage2b` once each with no retry; persists per-stage request/digest/response/parsed artifacts and only writes combined/final success after merge.

`offline-controls.mjs` was adapted as source only for odd/even/invalid partitioning, disjoint/full union, strict subset negatives, cross-shard refs, merge failures, and safe fake-fetch diagnostics.

## Held guards

Source-unit and lossless-fragment inventory, pinned Stage 1 cache validation, target cap 400, treatment/ref rules, positive-treatment refs, 160 UTF-16 assessment bound, credential handling and redaction, partial-reader preservation, 400-second per-call deadline, 900-second total cap, 4 MiB response cap, and no-retry/no-fallback/no-redirect behavior remain in source.

Request/model route settings remain `qwen38-27b`, temperature `0.6`, `max_tokens` 49152, and the existing route. No Root driver/admission file was edited.

## Verification and limits

- Both authored JavaScript files passed `node --check` syntax parsing.
- `offline-controls.mjs` was not executed, per the source-only boundary.
- No HTTP request, health check, SSH check, model probe, runtime admission, Native session, R/H try, or model generation was performed.
- This handback does not establish product, semantic, legal, business, server, or transport-cause PASS.
- The cause of the preceding V3 transport failure remains `UNKNOWN`; the new safe diagnostic is observation-only and does not retroactively diagnose it.
- Read-only `git status --short` failed while entering submodule `dsh` with `Permission denied`. No Git write, index operation, lock change, ACL change, or repair was attempted.

Stop point: ready for Root full review and affected offline execution before any new model call.
