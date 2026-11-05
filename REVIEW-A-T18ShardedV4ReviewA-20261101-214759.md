# REVIEW-A — T18 Sharded Bidirectional V4, Independent Line A, source-only review

Order: ORCH-A-T18ShardedV4ReviewA-20261101-214759.md (first tool read, complete).
Second read: T18ShardedV4Independent-20261101-214759\index.json (full).
Then read FULL, only the A_views listed there:
00-review-consumer.mjs.txt (1281 lines), 01-offline-controls.mjs.txt (1009 lines),
02-source-manifest.json.txt, 06-T18-sharded-bidirectional-v4-source-reviewed-current.json.txt,
07-T18-isolated-semantic-pilot-input-provenance-current.json.txt,
08-ORCH-B-T18ShardedBidirectionalV4-20261101-213929.md.txt,
review-consumer.mjs.diff.txt, offline-controls.mjs.diff.txt.
Not read (out of A scope): the C_views Root driver / admitter / launcher, any peer or older
formal review, any skill, any Git object. No Node/Python/parser/--check/test/build/preparer/
HTTP/model/probe/GUI/Key/runtime invocation was performed; no Git write of any kind.
Line numbers below are the source line numbers printed inside the view files (2 header lines
are not source lines).

VERDICT: PASS (source-only, scope-limited). No blocking new in-scope defect found in the
sharding/subset/merge/transport-diagnostic code or in the current meaningful controls.
Three non-blocking observations follow. This verdict is a source reading, not a runtime,
semantic, factual, legal or business pass, and it does not certify the Root driver chain.

--------------------------------------------------------------------------------
1. WHAT I CHECKED, AND WHERE IT LIVES (all confirmed by reading current code, not the diff alone)

1.1 Deterministic contiguous balanced partition of the SAME target set — PASS
    review-consumer.mjs:380-406 `buildReviewShards`.
    - Splits `targetIndex.canonicalIds` (inventory order) at `Math.ceil(n/2)`; shard 0 = first
      `firstCount`, shard 1 = the remainder (385-393). For n=365 that is 183+182, contiguous,
      no filter, no content/duplicate/dedup selection, no data change.
    - `shards` are derived from `REQUEST_STAGES` (388), so shard identity is stage2a/stage2b.
    - Guards actually present: minimum count (382-386), per-shard id validity via
      `validateExpectedTargetIds` (392-393, 253-265), non-empty (394-396), overlap (397-399),
      and a full-union check that is also ORDER-exact (400-405): `union` is rebuilt from the
      per-shard Sets in insertion order and compared element-by-element with `canonicalIds`.
      A shard that dropped or reordered an id therefore fails SHARD_UNION_INCOMPLETE.

1.2 Every request carries the FULL canonical context plus only its active ids — PASS
    review-consumer.mjs:467-486 `buildStage2Envelope`, 498-512 `buildStage2Messages`,
    1179-1187 (per-shard call site).
    - The envelope always carries full `source_units` (with reused Stage-1 descriptions),
      `draft_parent_spans`, `selfcheck_parent_spans`, the full `targets` table (484) and
      `actual_coverage`; `review_target_ids` (485) carries only the active subset.
    - Each shard builds its own payload from scratch (1179-1187). No shard response, no
      prior assistant turn, no chat history and no Native/R context is ever placed into a
      request; the message array is exactly [system, user] (507-512).

1.3 Exact active-ID set / equal count per call; inactive output rejected — PASS
    review-consumer.mjs:668-726 `validateStage2Result`, 253-265 `validateExpectedTargetIds`.
    - Expected set is validated first: non-empty array (256), non-empty string (260), known id
      (261 -> EXPECTED_TARGET_ID_UNKNOWN), no duplicates (262 -> EXPECTED_TARGET_ID_DUPLICATE).
    - Per record: unknown id -> UNKNOWN_TARGET_ID (687-688); known-but-not-active id ->
      UNEXPECTED_TARGET_REVIEW (689); duplicate -> DUPLICATE_TARGET_ID (690);
      missing active -> MISSING_TARGET_REVIEW (719-721); count vs expected set size (722).
      The check order is deliberate and correct: a known id outside the active shard is
      rejected as UNEXPECTED_TARGET_REVIEW rather than passing as "known".
    - Default path (no 3rd argument) still means "all canonical ids" (674-678), so the
      pre-existing all-ID behaviour is preserved.

1.4 Cross-shard / outside-active refs to any known other family — PASS
    review-consumer.mjs:699-707. Refs resolve against `targetIndex.targetsById`, i.e. the
    FULL canonical table (703), not the active subset; family rule unchanged (705: only other
    families), duplicate ref rejected (706). An active target in shard 2a may therefore cite a
    known target that lives in shard 2b, which is exactly what requirement 1 asks for.

1.5 Strict merge, disjoint / exhaustive / canonical full union before final success — PASS
    review-consumer.mjs:726-786 `mergeShardReviews`.
    - Plan must have exactly `REQUEST_STAGES.length` shards (730), each with exactly the two
      keys shard_id/review_target_ids (741), shard_id must equal REQUEST_STAGES[index] (742);
      per-shard ids must be known/unique/non-empty (743); global overlap rejected (744-746);
      union must equal the canonical list element-for-element in order (750-753).
    - Result side: result-set arity (734), per-shard arity (759-761), every review id must
      belong to that shard (767-769), no duplicates within (770-772) or across shards
      (773-774), no missing id (775-777), total must equal canonical count (779-781).
    - Output is emitted in canonical order (783-784). Merge runs only after both shards were
      independently validated (1210-1216 -> 1218), so a partial first shard can never become
      a final success, and there is no "missing waiver" path.

1.6 Stage-1 reuse, caps, budgets held — PASS
    review-consumer.mjs:13-19, 630-641, 1125-1130. MAX_REQUESTS=2 and REQUEST_STAGES=
    ["stage2a","stage2b"] (13-14) are the only budget change; model qwen38-27b, temperature
    0.6, max_tokens 49152, stream false, per-call 400 s, whole-run 900 s, 4 MiB response cap,
    TARGET_CAP 400 and ASSESSMENT_MAX_UTF16 160 are unchanged (8-19). Stage-1 is still read
    from the pinned cache and validated by the unchanged `validateStage1Result` (630-641, 1125);
    no Stage-1 HTTP call exists. Target cap and shard plan are computed BEFORE the credential
    is read (1127-1130 -> 1131).

1.7 Transport diagnostic is a static whitelist only — PASS
    review-consumer.mjs:963-1006, 1067-1081. `errorName` maps only TypeError/AbortError/
    TimeoutError/Error, via `hasOwnProperty` on the frozen map (999-1003), everything else
    -> "OTHER"; `code` and `cause.code` map only the ten literal Node codes (969-980), unknown
    -> "OTHER", absent -> null (990-992); property access is wrapped so a throwing getter
    cannot leak (984-988). No message, stack, URL, header, body or credential is read into the
    diagnostic. Completed responses carry `transportDiagnostic: null` (1062). The original
    transportError classification, partial-body retention, reader cancel/release and the
    4 MiB cap are untouched. This is a NEW observation for future runs and is not a
    retrospective explanation of the V3 failure, whose cause remains UNKNOWN.

1.8 Current meaningful controls actually cover the new surface — PASS
    offline-controls.mjs:262-298 (odd 9 -> 5+4, even 10 -> 5+5, disjoint+exhaustive+canonical
    order, n=1 -> TARGET_COUNT_BELOW_MINIMUM, duplicate id -> TARGET_TABLE_INVALID),
    298-299 (MAX_REQUESTS=2, stages), 398-415 (envelope keys, review_target_ids default =
    all ids), 428-445 (shard envelope keeps the FULL target table and adds the active subset;
    prompt asserts the "exact and only target ids" and "All supplied targets remain
    available" clauses), 488-518 (subset validation + a cross-shard ref to an inactive
    known other-family target accepted), 518-583 (missing / duplicate / unknown /
    known-outside-active / empty-expected / duplicate-expected / unknown-expected negatives),
    672-742 (merge: canonical-order union, overlap, duplicate, count mismatch, plan overlap,
    plan union incomplete), 862-973 (transportDiagnostic: known TYPE_ERROR/ECONNRESET/
    UND_ERR_HEADERS_TIMEOUT, unknown secret name/code/cause -> OTHER with a no-leak assertion
    over the whole result object, absent code -> null, completed response -> null; original
    partial body / cancel / releaseLock / 4 MiB overflow / no-fetch-past-deadline held).
    The negative controls match the implementation's error codes as written.

--------------------------------------------------------------------------------
2. NON-BLOCKING OBSERVATIONS (each with trigger and minimal fix; none blocks)

N1 — Latent partition fragility if the shard count ever changes (LOW, currently unreachable)
    Lines: review-consumer.mjs:380-406 (`buildReviewShards`), 13-14 (`REQUEST_STAGES`).
    Trigger: `buildReviewShards` derives the shard count from `REQUEST_STAGES.map(...)`
    (388) but splits the id list with a single `firstCount = ceil(n/2)` (385) and the
    overlap check compares only shard 0 against shard 1 (397-399). With the current
    two-element `REQUEST_STAGES` this is exact and correct. If `REQUEST_STAGES` were ever
    grown to three entries, shards 1 and 2 would both receive `slice(firstCount)`; the
    shard-1/shard-2 duplicate would not be caught by the 397-399 check and the union check
    (400-405, which only unions shards 0 and 1) would still pass, yielding a plan with
    duplicated coverage.
    Minimal fix: build the shards from a computed count (`shardCount = REQUEST_STAGES.length`)
    with contiguous `slice` boundaries derived from that count, and compare every shard
    against every earlier shard rather than only shard 0 vs shard 1; or fail explicitly
    unless `REQUEST_STAGES.length === 2`.
    Not a current defect: `REQUEST_STAGES` is frozen at length 2 in this source.

N2 — Shard-of-origin is not visible in error artifacts (LOW, diagnostic only)
    Lines: review-consumer.mjs:670-724 (`validateStage2Result` uses the fixed stage
    "stage2"), 467-477 (`buildStage2Envelope` uses "input"), 1085-1096 (`writeFailure`
    records `stage`/`code`).
    Trigger: when shard stage2a or stage2b fails protocol validation, `error.json` and
    `final-report.json` record stage "stage2" (or "input"), not the shard id, so the shard
    of origin must be inferred from the per-stage `stage2a-*` / `stage2b-*` artifacts.
    Correctness is unaffected — every failure still aborts the run before any final success
    — and the per-stage request/response/parsed artifacts are written before the abort.
    Minimal fix: thread the shard stage into the validator's stage argument
    (`validateStage2Result(parsed, inventory, expectedIds, stage)`).
    Note the stage labels themselves are legal for the existing failure regex
    `/^[a-z0-9_]+$/` — "stage2a"/"stage2b" contain no hyphen, as required.

N3 — Two merge guard codes and the second-shard envelope are not asserted by the controls
    (LOW, coverage gap, not a defect)
    Lines: review-consumer.mjs:730-737 (SHARD_PLAN_INVALID / SHARD_RESULTS_INVALID guards,
    742 SHARD_ORDER_INVALID) and offline-controls.mjs:428-445 (only the FIRST shard's
    envelope is asserted to keep the full canonical table).
    Trigger: the controls exercise merge overlap/duplicate/count-mismatch and plan
    overlap/union-incomplete, but never a malformed plan object, a wrong-length result set,
    a swapped shard_id order, nor the stage2b envelope's full-target-table retention. The
    code paths exist and read correctly by inspection, so this is a proof-coverage gap, not
    a behavioural hole.
    Minimal fix: add three `assertProtocolError` cases (malformed shard object -> 
    SHARD_PLAN_INVALID; `shardReviewSets` of wrong length -> SHARD_RESULTS_INVALID; swapped
    shard_id -> SHARD_ORDER_INVALID) and one assertion that the stage2b envelope's
    `targets` still deep-equals `inventory.targets` while its `review_target_ids` equals
    shard 2b's ids.

--------------------------------------------------------------------------------
3. RESIDUAL RUNTIME RISK (explicitly NOT a source defect, flagged for the Root)

- The new subset contract is strict by construction: if the model returns any record for an
  inactive id, the whole shard is rejected at review-consumer.mjs:689 and the run ends as
  FAIL_UNEXPECTED_TARGET_REVIEW. That is the intended behaviour ("known inactive output
  rejected", "no partial green"), but it means a V4 runtime attempt can still fail on
  protocol rather than on transport. The prompt (71-93) states the active set three times
  and says inactive targets are context-only, which should be sufficient, but only a real
  run can show which way the model behaves. No expectation of a green runtime is implied
  anywhere in the source.
- The transport diagnostic labels only observations made from now on. The V3 failure
  (no HTTP status, no body, 307650 ms) is not re-classified by this code and must remain
  "server/proxy cause UNKNOWN" — no health check, retry, redirect, fallback or invented
  cause was added.

--------------------------------------------------------------------------------
4. LIMITS OF THIS REVIEW

- Source only. I did not execute the consumer, the offline controls, any parser/`--check`,
  any test, build, preparer, HTTP request, model call, probe, GUI or Key operation; no
  application/module execution is claimed or implied. Syntax correctness of the source is
  not asserted as a runtime result.
- Not a semantic proof. The checks above establish protocol/shape facts only: id sets,
  counts, disjointness, union, canonical order, family rules, quote/schema shape, the 160
  UTF-16 assessment bound and the absence of a Root pass field. They say nothing about
  entailment, factual correctness, legal quality, business suitability or false positives.
  Root still has to judge all 365 final records manually against counterexamples.
- Not a Root-chain review. The Root driver, admitter and launcher (the C views) were out of
  my scope and were not read; their pin counts, max-2 restoration, clean environment, DPAPI
  stdin, PID/exe/UTC-birth cleanup, UTF-8/raw-plus-JSON-escaped credential scanning and
  PowerShell literal reuse are not certified by this review. The source author's disclosed
  three forbidden `Node --check` parser invocations remain a rejected source-process
  discipline and were not used here as any form of pass evidence; I ran no such invocation.
- Trust model. Nothing here establishes an owner-only ACL, protection against a hostile
  local actor, or any filesystem- or process-level guarantee. The shared writable
  workspace is trusted to the same degree as the rest of this workstream.
- The manifest pins in the source manifest agree with the pinned consumer/controls/fixed-data/
  Stage-1-cache bytes listed in the review index, so `verifyPinnedSources` (833-871) is
  internally consistent with the reviewed files.

One formal review filed; stopping here.
