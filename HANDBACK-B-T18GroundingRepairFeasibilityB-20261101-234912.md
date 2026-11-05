# T18 grounding-repair feasibility handback

## Decision

RECOMMEND: gate every positive C/Q result on explicit, content-bound target-to-source
premise pairs, while keeping the existing two model calls and arbitrary two-way sharding.
For `SUPPORTED`, require source-family F premise spans whose claim spans cover every
non-whitespace character of the C/Q target. Q targets may not use C draft text as proof.

This is feasible as a small in-file protocol/dataflow repair. It does not require a
semantic regex, keyword classifier, SDK change, extra request, or automatic PASS.

## Exact current-source evidence

- `docs/plan/evidence/T18/T18SchemaKeywordCompatV7-20261101-230453/review-consumer.mjs:73`
  supplies source units, the draft, and the visible self-check to one mixed review:
  `"You independently review a supplied target table against full source units, an original draft, and a visible self-check."`
- `review-consumer.mjs:80` states the semantic goal for C:
  `"examine all of its claims and whether the draft claim is supported only by the actual supplied read receipts."`
  No output field records which premise spans were matched to which part of the claim.
- `review-consumer.mjs:90` defines evidence only as target IDs:
  `"C may refer to F; Q may refer to F or C."`
- `review-consumer.mjs:91` makes one ID sufficient for a positive result:
  `"An F target marked ADDRESSED and a C or Q target marked SUPPORTED require at least one ref."`
- `review-consumer.mjs:667-670` maps C to F but maps Q to `F` or `C`. The checked-in
  Skill separates draft saving from final self-check (`skills/defense-opinion/SKILL.md:39-40`)
  and says self-check results do not enter the draft (`SKILL.md:141`).
- `review-consumer.mjs:267-280` preserves each target's exact `text`, `start`, and `end`.
  `review-consumer.mjs:331-354` builds separate F source, C draft, and Q self-check families.
  These offsets already provide deterministic anchors for paired validation.
- `review-consumer.mjs:468-486` sends `targets`, `draft_parent_spans`, and
  `selfcheck_parent_spans` together. The envelope contains no C/Q-to-premise mapping.
- `review-consumer.mjs:674-706` serializes `refs` as only an array of allowed IDs.
  `review-consumer.mjs:723-737` uses `refs.length >= 1` for the positive branch.
- `review-consumer.mjs:788-801` validates ID syntax, existence, family, uniqueness, and
  non-emptiness. It never checks that the referenced target supports the active target.

## Meaningful counterexamples

1. A C claim about a date and a valid F target about an amount pass current validation:
   the F ID is in the allowed family and `refs.length` is one.
2. A C claim of global absence and a source target merely listing an item's existence
   pass for the same reason; existence is never paired with the absence proposition.
3. A Q truth claim can cite a C draft fragment and become `SUPPORTED`; the draft authored
   the checked proposition, so this is self-reference rather than source verification.
4. A blank, duplicate-free, or merely unrelated valid F ID passes the current positive
   branch. Source code cannot distinguish it from an entailment witness.

## Smallest implementation map

All functional edits remain in
`docs/plan/evidence/T18/T18SchemaKeywordCompatV7-20261101-230453/review-consumer.mjs`.

1. `STAGE2_SYSTEM` (lines 72-94): define `support_pairs`; require an exact premise ID and
   claim/source offsets for positive C/Q records; state that Q uses F premises only.
2. `buildReviewShards` (lines 381-407): leave unchanged. Continue exactly two fresh calls
   under the existing 400-per-call and 900-second caps.
3. `allowedRefKinds` (lines 667-672): change Q to F only for positive support evidence.
   Keep existing optional refs for non-support context if compatibility needs them.
4. `buildStage2ReviewRecordSchema` (lines 674-706): add a C/Q-positive pair object with
   exactly `premise_id`, `claim_start`, `claim_end`, `premise_start`, and `premise_end`.
   Use integer bounds; do not return copied prose and do not add a keyword field.
5. `buildStage2ResponseFormat` (lines 709-760): put the pair array only in the
   `SUPPORTED` branch, with `minItems: 1`. Keep F `ADDRESSED` behavior and all other
   treatments unchanged.
6. `validateStage2Result` (lines 762-809): resolve `premise_id` to an F target, require
   safe in-range spans, require each referenced slice to be non-whitespace, and require
   the union of claim spans to cover every non-whitespace UTF-16 position in the C/Q
   target. Preserve a copy of the validated pairs in the returned review record.
7. `mergeShardReviews` (lines 812 onward): no logic change; merge the already validated
   records. `outputStatusForReviews` remains protocol-only and must not become PASS.

Suggested positive record:

```json
{"target_id":"C0001","treatment":"SUPPORTED","refs":["F0004"],
 "support_pairs":[{"premise_id":"F0004","claim_start":0,"claim_end":18,
 "premise_start":6,"premise_end":24}],
 "assessment":"The supplied source span states the same date and subject."}
```

For Q, the same shape is accepted only with an F `premise_id`. A Q claim whose truth
depends solely on generated C text must return `UNKNOWN`, not `SUPPORTED`.

## Validation plan (not executed in this source-only feasibility run)

- Static: exercise valid F→C and F→Q pairs; an amount F premise against a date C claim;
  existence-only F against global-absence C; blank or out-of-range spans; a C premise
  supplied for Q; incomplete claim-span coverage; and duplicate span records.
- Expected: unrelated/blank/out-of-range/incomplete pairs fail validation or cannot
  produce `SUPPORTED`; valid complete pairs survive both shard merge and final output.
- Preserve all original semantic cases and read-coverage RED results. Do not describe
  schema acceptance, timing, or manual outcomes as a semantic quality PASS.

## Remaining risks and unknowns

- Local source code can verify binding, family, bounds, and coverage, but cannot prove
  natural-language entailment. The model can still select a wrong but well-formed source
  span; Root manual judgment and immutable semantic RED cases remain necessary.
- Q self-checks that depend on `actual_coverage` rather than a specific F fragment may
  become `UNKNOWN` under the safe rule. The allowed sources do not expose a validated
  coverage schema from which to construct a stronger deterministic witness.
- Splitting calls by family would isolate Q completely, but the current sharder requires
  two non-empty target shards and the source does not establish a safe family balance.
  Therefore the smallest safe repair is per-record source-only Q gating inside the
  existing two shards.

No source, runtime, test, Git, key, lock, approval, or sandbox state was changed by this
feasibility run.
