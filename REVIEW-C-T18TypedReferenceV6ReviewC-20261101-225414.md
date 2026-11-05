# REVIEW C — T18 typed-reference V6 (focused delta) — independent source review

VERDICT: PASS (focused V6 delta scope only) — 0 blocking current-new defects found.
1 non-blocking fail-closed residual (F1) + 4 Root pre-admission verification items (F2-F5).
NOT a full consumer / pure-protocol / platform / security PASS. Packaging stays HOLD.

Scope actually reviewed (read-only, from the supplied views):
- review-consumer.mjs lines 1-110, 300-430, 490-550, 650-850, 1380-1475 (new/changed: STAGE2_SYSTEM
  map line 90, buildRequestPayload 515-523, allowedRefKinds 667-672, buildStage2ReviewRecordSchema
  674-708, buildStage2ResponseFormat 710-761, validateStage2Result 763-819, runMain shard wiring 1411-1424).
- offline-controls.mjs lines 1-90, 420-550, 615-720, 790-1040 (new typed negatives + bounded static-shape
  + empty-eligible + enum-outside-active + all-family controls).
- Whole diffs: review-consumer.mjs.diff, offline-controls.mjs.diff.
- Root alias inverses: root-driver-inverse.diff, root-admitter-inverse.diff (aliases/purpose/verdict only).
- 02 source-reviewed / 03 source-manifest / 04 vLLM primary reference / 05 root-driver-draft.
Reused the author's 48-function byte-held proof; no old causal audit re-run.
NOT done (prohibited by the order): no runtime, no Node/Python/parser, no --check/test/build/preparer,
no HTTP/model/health/probe/GUI, no Key, no Git write/readback, no metadata or hash re-verification,
no source edits, no peer/old formal/model outputs, no Root manual criteria.
This run wrote exactly one file (this report) into the coordination directory. No Git operation was
attempted; no stash/lock/ACL/approval/sandbox change; no second writer was created.

## FINDINGS (current, in the new code)

F1 (NON-BLOCKING, fail-closed) — outgoing `assessment.maxLength` is not the unit the local validator enforces.
- Where: review-consumer.mjs 0704 (`maxLength: ASSESSMENT_MAX_UTF16` in buildStage2ReviewRecordSchema)
  vs 0785-0788 (`record.assessment.length > ASSESSMENT_MAX_UTF16`, i.e. UTF-16 code units) and the
  prompt at 0092 ("no longer than 160 UTF-16 code units").
- Trigger: an assessment containing astral-plane characters (emoji etc.). JSON Schema `maxLength`
  counts code points (RFC 8259), so a decoder that honours the emitted schema may legally return up to
  160 code points = 320 UTF-16 units; the local validator then throws ASSESSMENT_INVALID and the shard
  aborts after the request was already spent (each shard aborts independently; MAX_REQUESTS=2, no retry).
- Minimal fix: emit `assessment` without `maxLength` (keep `type` + `minLength: 1`) and let the prompt +
  local validator own the UTF-16 rule; or make the local length check code-point based.
- Effect: no acceptance widening, no silent pass, no data loss beyond the aborted run — the local
  validator stays stricter than the schema, so the failure mode is a clean stop. No semantic/security
  change. Not a blocker: the source-reviewed qualification already records provider/Unicode length as
  "not assumed authoritative" and keeps the local validator as the authority. Same class for
  `minLength: 1` vs the local `assessment.trim() === ""` check (schema-permitted whitespace-only string
  is locally rejected — fail-closed again).

F2 (verification item, not a defect) — V6 admission preconditions are file-existence gated.
The admitter inverse requires, before it writes the V6 admission: `T18-typed-reference-schema-v6-final-
source-reviewed-current.json`, `T18-typed-reference-schema-v6-final-closure-accepted-current.json`,
`T18-typed-reference-schema-v6-root-launcher-static-parse-current.json` (with empty `errors`),
the V6 passive offline proof (`exit_code==0`, no `forced`, no `source_changes`, no
`network_guard_denials`, `modelrequests==0`, no `Keyread`), and the authority file with
`per_cycle_owner_reapproval_required is False`, `current_runtime_active` falsy and no
`diagnostic_records[*].state` starting with `CONSUMED`. The static-parse artifact in particular cannot be
produced under this order's no-parser rule, and the CONSUMED-free invariant over the earlier V5 record
cannot be confirmed from the supplied views. Both are fail-closed: the admitter raises rather than admits.
Action: Root must satisfy/verify these before invoking the admitter.

F3 (verification item, not a defect) — driver/admitter alias coupling verified consistent by hand.
Verdict literal `ADMITTED_ISOLATED_TYPED_REFERENCE_SCHEMA_TWO_SHARD_DIAGNOSTIC`, purpose
`TYPED_REFERENCE_SCHEMA_V6_CACHED_STAGE1_CAPABILITY_NOT_NATIVE_WORKFLOW`, admission path
`T18-typed-reference-schema-v6-runtime-admission-current.json`, active/result names, root prefix
`T18TypedReferenceSchemaV6Actual-root-<stamp>` and the 8-pin set match character-for-character between
the two inverse diffs and the consumer constants (`ROUTE`, `MODEL`, `PARAMETERS` 0.6/49152/stream false,
`MAX_REQUESTS` 2, `ENTIRE_CALL_CAP_MS` 900). Driver also asserts `max_requests==2`,
`Root_timeout_seconds==900`, `not consumed`, `source_review_accepted` — all satisfied by the admitter's
written record. No alias mismatch found. Residual: the pinned driver/admitter bytes and the two diff
artifacts are separate files; I did not re-derive the pinned .py bytes from the diffs (hash/readback
prohibited), so the "diff == pinned file" relation rests on the author index/05 pairing.

F4 (verification item, not a defect) — the frozen V5 C_AMEND guard is untouched.
Neither inverse diff nor the consumer diff touches
`T18-explicit-deadline-http-v5-root-review-adjudication-current.json`; 05 keeps pointing at the V5-named
frozen guard. Consistent with the "do not modify / do not re-audit" constraint. No overall security PASS
is implied or requested here.

F5 (coverage note, no defect) — the new typed controls are consistent but not exhaustive.
Covered: F->Q and C->Q rejected with REF_FAMILY_INVALID (controls 641-657), same-family rejected,
cross-shard/outside-active refs accepted (516-533), per-family branch shape/treatment split/refs enum
equality (891-953), partial active subset with target_id enum restricted to active and refs enum
containing outside-active ids (956-974), empty-eligible family with no `items` key and
maxItems 0 (976-1006), no-empty-enum walk, payload key set with/without `response_format` (798-804,
1008-1018). Not explicitly exercised: a Q target carrying a C-family ref through the local validator
(only through the schema's enum equality), Q self-reference, per-family cardinality inside the reviews
array (the schema cannot express it; the local validator catches it as MISSING_TARGET_REVIEW), and the
`reviews` minItems/maxItems of a partial active subset. All of these remain fail-closed by the existing
local validator, so they are coverage notes, not defects.

## WHAT I CHECKED AND FOUND CORRECT

1. Outgoing request schema shape (consumer 710-761, 674-708).
   - `buildStage2ResponseFormat` returns exactly `{type:"json_schema", json_schema:{name, schema}}`,
     `name = "lawbench_target_review_v6"`, schema root `type:"object"`, `additionalProperties:false`,
     `required:["reviews"]`, `reviews` array with `minItems = maxItems = expectedIds.size` and
     `items.anyOf = branches`. Emitted shape matches the documented vLLM 0.29 surface
     (`response_format.type=json_schema` with `json_schema.name` / `.schema`, no `strict` key) per 04.
   - Branch construction is per active family only (F/C/Q); a family with no active target is skipped
     (`continue`), so no empty enum can be produced; `refs.items` is omitted entirely when there is no
     eligible reference family, so `enum` is never empty. `assertNoEmptyEnums` in the controls agrees.
   - Positive branch exists only when eligible reference ids exist, with `minItems:1` and treatment enum
     narrowed to the single positive value; the non-positive branch carries the remaining treatments
     (including PARTIAL) with `minItems:0`. `maxItems` = eligible reference count; `uniqueItems:true`.
   - `target_id` enum = active ids of that family only (inactive ids excluded); `refs` enum = every
     canonical id of the eligible families, including ids outside the active shard (the "known outside
     active refs" rule the offline control 956-974 asserts).
   - Real-corpus shape derived from the author-reported counts (F117/C134/Q114, shards 183/182, canonical
     order F then C then Q): shard 1 = F1-117 + C1-66 (4 branches; F refs enum = 134 C ids, C refs enum =
     117 F ids); shard 2 = C67-134 + Q1-114 (4 branches; C refs enum = 117 F ids — all outside the
     active shard, which is the intended outside-active case; Q refs enum = 251 F+C ids). `reviews`
     minItems/maxItems = 183 and 182. Numbers are arithmetic on author-reported counts, not re-measured.
2. Fail-closed direction. The emitted schema is never looser than the local validator in a way that can
   let a bad answer through: the local validator (763-819) re-checks exact keys, unknown/duplicate/inactive
   target ids, family-legal treatments, family-legal and duplicate-free refs, and positive-treatment-without-
   ref. Where the schema is looser (F1: length unit, whitespace-only text) the local check rejects and the
   run stops. HTTP 400 / non-200 / transport failure / oversized response / cap exceedance all stop the run
   with no fallback (1441-1448), and no new health probe, backend switch, server restart, SDK or config
   change appears anywhere in the delta.
3. Typed graph boundaries. The consumer has a single source of truth: `allowedRefKinds` (667-672) is used
   both by the schema builder (719-722) and by the local validator (790-796), so the outgoing enum and the
   local family rule cannot drift apart. F->C only, C->F only, Q->F|C only; the prompt map line (0090),
   the schema, the validator and the controls' own independent copy (controls 66-71, 891-907) all state the
   same four-edge DAG, and the narrowing from V5 (F->Q, C->Q removed) is applied consistently to the
   prompt, the emitted schema and the validator. It matches the substantive semantics: draft fragments (C)
   are evidenced by source fragments (F), the self-check (Q) is evidenced by F and C but is not evidence
   for either.
4. Budget / request impact. No new HTTP call, no parameter change: `PARAMETERS` (0.6 / 49152 / stream
   false), `MAX_REQUESTS` 2, `ENTIRE_CALL_CAP_MS` 900, `PER_CALL_TIMEOUT_MS` 400000, `RESPONSE_CAP_BYTES`
   4 MiB, `TARGET_CAP` 400 and the stage1 cache reuse are untouched. The only size change is the outgoing
   schema, which adds O(N) enum duplication (bounded by TARGET_CAP 400); the author reports request bodies
   141459 B / 143303 B — I did not re-measure (no runtime). No request-size guard exists (RESPONSE_CAP_BYTES
   is response-side); at these magnitudes that is not a practical risk, and it is pre-existing behaviour
   rather than a new gap.
5. Payload wiring. `buildRequestPayload(messages, responseFormat)` adds `response_format` only when the
   argument is defined (515-523), so stage1 and every other call site keep the old payload byte-for-byte
   (controls 798-804 assert the key is absent). `runMain` attaches the schema to stage2 only (1421-1424);
   the stage2 message construction itself is unchanged apart from being hoisted into a variable.

## LIMITS OF THIS REVIEW (source / runtime / semantics / provider / ACL)

- Source-only. No code was executed, no parser/test/build/HTTP/model/Key path was exercised, so every
  statement above is static reasoning over the supplied windows and diffs, not an observed run.
- Runtime: none. I cannot confirm that the live backend accepts this schema, that the two shards would
  return schema-conformant bodies, or that the driver's PS/identity/cleanup path behaves at runtime.
- Semantics: no semantic guarantee. A schema-conformant answer can still be substantively wrong; the
  assessments remain provisional protocol data for Root manual judgment. No legal, business, product,
  Native-workflow or production pass is implied. The typed graph is a protocol shape, not evidence.
- Provider: compatibility with the current backend is NOT proven. The emitted schema uses `anyOf`,
  `uniqueItems`, `minItems`/`maxItems`, `additionalProperties:false`, large `enum` sets (up to 251
  entries) and `maxLength` — features whose backend support was not verified here and which some
  JSON-Schema backends implement partially. Per the pinned 04 reference, the shape matches the documented
  vLLM 0.29 `json_schema` surface, but current backend acceptance remains unproven and the agreed
  behaviour on rejection is HTTP 400 -> stop, with no fallback, no parameter lottery, no health probe,
  no server change. Unicode/code-point length semantics are explicitly not assumed; the local validator
  and Root manual review remain the authority.
- Private / ACL / hostile-local-actor: not assessed and not claimed. The pre-existing V5 C_AMEND frozen
  guard limits are retained unchanged and were deliberately not re-audited or proposed for modification;
  owner-only ACL behaviour, local-actor containment and full platform security remain unproven.
- Old known limits from V5 (raw/partial 183, manual/sealed 39, retained results, no unchanged retry)
  stay in force; this review neither clears nor re-opens them.
- I did not re-verify the byte/sha pins, the offline passive proof, the static-parse artifact or the
  authority-file state (readback and hash checks are outside this order); F2/F3 list them as Root
  pre-admission items instead.

## CONCLUSION

Within the focused V6 delta (outgoing request schema, static provider-compat surface, fail-closed
behaviour, budget impact, Root alias inverses, typed-graph boundaries) the new code is internally
consistent, fails closed, keeps the local validator authoritative, changes no budget parameter and
introduces no acceptance-widening path. I find no current-new blocking defect. The single concrete
line-level interaction is F1 (length-unit mismatch), whose minimal fix is optional hardening rather
than a gate. F2-F5 are Root verification items, not code defects. This PASS is scoped to the focused
delta; it is not a full consumer, protocol, platform, semantic or security pass, and it does not
clear the frozen V5 guard limits or the HOLD packaging state.
