# REVIEW-A — T18 Typed Reference V6 (focused source review, independent lane A)

VERDICT: **PASS** — no current-new blocking defect found in the supplied V6 delta.
Scope: strictly the V6 source delta as supplied in the A_views (typed graph, schema builder, local pure helpers, controls, prompt map line). Not a full consumer / protocol / platform / security review.

## Findings (current V6 delta, ordered by severity)

F-1 — NON-BLOCKING, optional hardening. `buildStage2ResponseFormat` (review-consumer.mjs.txt:0710-0761) can emit `reviews.items.anyOf: []` when the active set resolves to empty, which is meta-schema-invalid (anyOf needs a non-empty array).
Trigger: `buildStage2ResponseFormat(inventory, [])`, or an active subset matching no F/C/Q id.
Effect: fail-closed, not permissive — no instance can validate against an empty anyOf, so the request fails rather than admit bad data.
Reachability: NOT reachable from runMain — `buildReviewShards` (review-consumer.mjs.txt:0387-0396) fails with `SHARD_EMPTY` before any empty shard reaches the builder (review-consumer.mjs.txt:1411-1423).
Minimal fix (optional): `if (branches.length === 0) fail("schema", "NO_ACTIVE_TARGETS");`

F-2 — NON-BLOCKING, test-coverage note. The new typed-negative controls (offline-controls.mjs.txt:0641-0657) cover F→Q and C→Q, and `sameFamilyRef` (0635-0640) covers self-reference on an F target, but there is no explicit Q→Q `REF_FAMILY_INVALID` case.
Trigger: a regression widening `allowedRefKinds("Q")` to include "Q" would not be caught by any current assertion.
Effect on source: none now — `allowedRefKinds` (review-consumer.mjs.txt:0667-0672) returns `new Set(["F","C"])` for "Q" by construction, and the family gate is consumer-side (0796), so the Q→Q edge is rejected at validation.
Minimal fix (optional): one added assertion cloning a Q review, setting `refs` to a second Q id, expecting `REF_FAMILY_INVALID`.

F-3 — NON-BLOCKING, retained provider/authority limits (explicit carve-out, NOT an amendment request). Four schema-vs-local gaps remain by design, with the local validator + Root manual kept as the authority:
  (a) `assessment` schema `minLength: 1` / `maxLength: ASSESSMENT_MAX_UTF16` (review-consumer.mjs.txt:0701-0705) does not reject whitespace-only text, while the local validator does (`record.assessment.trim() === ""`, 0785-0787).
  (b) JSON Schema `maxLength` counts Unicode code points; the local validator counts UTF-16 code units (`record.assessment.length`, 0786) — the schema is strictly looser for astral characters.
  (c) `uniqueItems` on `refs` (0679) is a provider feature not assumed honoured; the local duplicate gate (`REF_DUPLICATE`, 0797) is the real check.
  (d) The schema omits `json_schema.strict`. Whether the backend honours `strict`, `anyOf`, `uniqueItems` or `minItems/maxItems` is not proven here; HTTP 400 / protocol failure must stop with no fallback, no health probe, no parameter lottery, no server change.
Minimal fix: none required in this delta; do not add `strict: true` speculatively (it can turn a tolerated field into an HTTP 400).

F-4 — NON-BLOCKING, layering note (not a source defect). The generated schema cannot enforce one-review-per-active-target: `reviews` is a plain array with no array-level uniqueness over `target_id` (0749-0756), so a schema-valid body may duplicate one target and omit another. The local validator is the enforcing gate (`DUPLICATE_TARGET_ID` 0781, `MISSING_TARGET_REVIEW` 0812, `REVIEW_COUNT_MISMATCH` 0815). This matches the stated "local validator and manual remain authority" contract; no change recommended.

No REJECT-level defect and no new runtime/semantic defect was found in the supplied V6 hunks. F-1..F-4 are optional hardening or documented retained limits; none is a current-new correctness bug in the typed-graph / schema-builder / controls delta.

## Method and boundary

Read in the mandated order: the execution order, then `T18TypedReferenceV6Independent-20261101-225414\index.json`, then all seven A_views in full (`00-review-consumer.mjs.txt`, `01-offline-controls.mjs.txt`, `02-T18-typed-reference-schema-v6-source-reviewed-current.json.txt`, `03-source-manifest.json.txt`, `04-T18-v6-typed-reference-structured-output-primary-reference-current.json.txt`, `review-consumer.mjs.diff.txt`, `offline-controls.mjs.diff.txt`).
Source-static review only. No Node/Python/parser, no `--check`, no test or build, no preparer, no HTTP/model/health/probe/GUI/Key/runtime, no Git write, no source edits, no peer / old formal / model outputs / Root manual criteria read. Line numbers above are the source line numbers carried by the A_view files.
Unchanged functions (48-function byte proof) were accepted as supplied and not re-audited; no old causal audit was refilled. The C-side aliases / purpose inverse / draft-PS items and the frozen unchanged network guard were not reopened, not re-probed and not re-audited.

## What was verified (V6 delta only)

1. Directed evidence graph is consistent across all four encodings: prompt (review-consumer.mjs.txt:0090), local helper `allowedRefKinds` (0667-0672), schema builder (0714-0738) and the local validator gate (0790-0796). F→C, C→F, Q→F,C — identical everywhere; the dropped V5 edges F→Q and C→Q are removed in prompt, helper and schema alike.
2. Positive/negative treatment split is exact and disjoint. Per active family the builder emits at most two branches: the positive branch (`ADDRESSED` for F, `SUPPORTED` for C/Q) with `minItems: 1`, and the "other" branch with the positive value filtered out and `minItems: 0` (0723-0738). Treatment enums are mutually exclusive, so the `anyOf` union has no ambiguous member; the local positive-without-ref gate (0800-0803) keeps the same rule.
3. Branch construction is fail-closed on the empty-eligible case: the positive branch is emitted only when `referenceIds.length > 0` (0725-0732), and with no eligible references the refs schema carries `maxItems: 0` and no `items` key (0675-0686). No empty enum is ever produced (treatments and target ids are always non-empty here).
4. Reference enums are the "known outside active" set: `referenceIds` is filtered from `targetIndex.canonicalIds` (all families in the inventory), not from the active subset (0720-0722). This is what makes cross-shard references work — with the stated 365-target corpus, shard 0 (F0001-F0117 + C0001-C0066) may reference C0067+, and shard 1 (C0067-C0134 + Q0001-Q0114) may reference F targets not active in that shard — and those ids are all supplied in the stage-2 envelope, so schema enum and visible target table stay in agreement.
5. Active-subset scoping holds: `activeTargetIds` is the intersection of the canonical index with the requested ids (0715-0717), the builder validates the subset via `validateExpectedTargetIds` (0712), and `reviews.minItems` and `maxItems` are both `expectedIds.size` (0752-0753) — consistent with the local count/completeness gates.
6. Payload behaviour is preserved: `buildRequestPayload` keeps the old shape when `responseFormat` is `undefined` (0515-0523) and adds `response_format` only when supplied. V5 payload shape, `PARAMETERS`, model, temperature 0.6, `max_tokens` 49152, `stream: false`, MAX_REQUESTS 2, TARGET_CAP 400, PER_CALL_TIMEOUT_MS 400000, ENTIRE_CALL_CAP_MS 900000 and ASSESSMENT_MAX_UTF16 160 are untouched by both diffs.
7. runMain wiring (1411-1426) builds stage-2 messages and the response format from the same shard id list, so request ids and schema ids cannot diverge; both existing stages (stage2a/stage2b) receive the format.
8. Controls: the four original fixture sites that had to change for the new graph did so minimally and only where the old "any different family" pick became illegal (offline-controls.mjs.txt:0460-0478, 0518-0522, 0626-0629, 0691-0700); all other original assertions are preserved. The new negatives (F→Q, C→Q) expect exactly `REF_FAMILY_INVALID`, the code the validator raises for a family violation (0796). The shape assertions (0806-1018) match the builder's actual key sets, enum contents, branch counts and per-family min/max refs, and the no-eligible case is asserted down to the absent `items` key.
9. Nothing else changed: both diffs are confined to the map line, the payload optional argument, the two new pure schema helpers, the tightened ref-kind helper, the runMain wiring and the matching control updates. No model, budget, cache, inventory, prompt, transport, credential, setup, cleanup, artifact, PowerShell or install surface was touched.

## Limits carried forward (not cleared by this review)

- Source: static read of the supplied A_views only. The un-supplied body of `buildStage2Envelope` (outside the supplied focused windows) was not re-read, so a stale V5 ref-direction sentence inside that envelope cannot be positively excluded here; the supplied evidence states the only prompt change is the generic map line and the envelope is byte-held.
- Runtime: nothing was executed — no offline control run, no guard run, no schema submitted to any backend. The static shape reasoning above is not a runtime proof.
- Semantics: no statement about review quality, draft completeness, support conclusions, or legal/business correctness. The protocol remains "provisional protocol data for Root manual judgment"; the local validator and Root manual review remain the authority for the generated content.
- Provider: backend support for `response_format.type = "json_schema"`, `anyOf`, `uniqueItems`, `minItems/maxItems` and `strict` is not proven for the current server fingerprint. HTTP 400 or any protocol failure must stop the run; no fallback, no health probe, no parameter lottery, no server restart, no install or SDK change.
- Private / ACL: this review touches no credential, key, case material or product path; the coordination directory receives only this report and continues to hold no secrets.
- Pre-existing V5 limits and the frozen unchanged C_AMEND / network guard limits are retained as they were; this review neither clears nor modifies them, and no overall security PASS is implied by this PASS. Packaging remains HOLD as supplied; this review does not change it.

## Verdict

**PASS** for the focused V6 typed-graph / schema-builder / controls delta as supplied: the directed graph, the positive-vs-other branch split, the empty-eligible fail-closed path, the known-outside-active reference enums, the optional `response_format` payload field and the runMain wiring are mutually consistent, and the new controls exercise exactly those properties. F-1..F-4 are optional hardening or documented retained limits, not defects requiring a change before the next gate.
