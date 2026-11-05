# REVIEW-C — T18 Sharded Bidirectional V4, independent source review (line C, exact1017max)

**Verdict: PASS (source-only).** No new in-scope blocking defect found.

Scope of this verdict: static reading of exactly the artifacts listed in
`T18ShardedV4Independent-20261101-214759\index.json` (C_views only). Nothing was
executed: no Node, no module load, no HTTP, no model call, no Key/DPAPI read, no
PowerShell driver run, no Git. No peer review, no old formal review, no owner
instruction was read or assumed. No product/SDK/Skill/NativeSession/R/history
change is authorised by this PASS.

Files read in full: `review-consumer.mjs` (1281 lines), `offline-controls.mjs`
(1010), `source-manifest.json`, `run-sharded-bidirectional-v4-saved-key-root-admin.py`
(181), `admit-sharded-bidirectional-v4-reviewed-runtime-root-admin.py` (35),
`T18-sharded-bidirectional-v4-root-launcher-static-parse-current.json`,
`T18-sharded-bidirectional-v4-source-reviewed-current.json`,
`T18-isolated-semantic-pilot-input-provenance-current.json`,
`ORCH-B-T18ShardedBidirectionalV4-20261101-213929.md`, plus the four diffs
(consumer V2→V4, controls V2→V4, root-driver inverse, admitter inverse).
Line numbers below are source-file line numbers.

## 1. Deterministic shard split (consumer 0380–0406, 0234–0264)

`buildReviewShards` splits the canonical inventory order positionally: first
`Math.ceil(n/2)`, remainder (0385–0391). Gates: canonical table rebuild with
duplicate/unknown-kind rejection (0234–0251), `n >= 2` (0382–0384), both shards
non-empty (0394–0396), disjoint (0397–0399), union exhaustive **and** in
canonical order (0400–0404). The split uses no content, label, keyword or
filter — only `inventory.targets` order, which is F then C then Q (0354).
Arithmetic consistency: recorded F117+C134+Q114 = 365, `ceil(365/2)=183`,
remainder 182 → matches the recorded shard sizes 183/182. No finding.

## 2. Per-call admission of the active ID set (0467–0486, 0670–0726)

Every request carries the **full** canonical target table (0482 `targets:
inventory.targets`) plus the active list (0483 `review_target_ids`), so
cross-family context is complete in both shards. `validateStage2Result` with
an explicit expected set enforces exactly the active set and equal count:
unknown id → `UNKNOWN_TARGET_ID` (0686); known-but-inactive id →
`UNEXPECTED_TARGET_REVIEW` (0687); missing active id →
`MISSING_TARGET_REVIEW` (0719–0721); count mismatch → `REVIEW_COUNT_MISMATCH`
(0722); duplicate → `DUPLICATE_TARGET_ID` (0688). Refs resolve against the
**full** canonical table (0701) and are restricted to other families only
(0664–0668, 0703), so a known cross-family ref outside the active shard is
accepted while a same-family ref is rejected; positive treatment without a ref
is rejected (0707–0710). Expected-ID inputs themselves are validated as known,
unique, non-empty (0253–0264). No finding.

## 3. Merge before any success (0728–0786, invoked at 1218)

Plan order pinned to `REQUEST_STAGES` (0742), per-shard ids re-validated as
known/unique (0743), global disjointness (0744–0747), union completeness plus
canonical order (0750–0754), per-shard exact count (0760), each review exactly
once and inside its own shard (0768–0778), global count (0780), re-emission in
canonical order (0784). Merge runs only on two independently validated shard
results, and `final-report.json` is written only after the merge (1218–1238);
there is no partial-green path and no waiver. No finding.

## 4. Main flow, budgets, stop-on-first-failure (1108–1238)

Target cap (1127) and shard plan (1128) are computed **before** the credential
is read (1131) and before any request. There is no Stage-1 HTTP call: the
byte-held cache is parsed and validated by the unchanged validator
(0632–0641 at 1125). `MAX_REQUESTS = 2` and `REQUEST_STAGES = ["stage2a",
"stage2b"]` (0013–0014) with exactly one fetch per shard (1192), no retry, no
health check, no fallback, `redirect: "error"` (1020). The first failure raises
through `fail()` (1203–1207), so shard 2b is skipped and shard 2a's
request/response/parsed artifacts remain on disk (1187–1216). Per-call 400 s
inside one shared 900 s deadline (0533–0536, 1010–1011): 400+400 = 800 s ≤
900 s, so two calls fit the cap. Route, model, temperature, max_tokens, 4 MiB
cap and the 400-target cap are unchanged (0006–0017); no budget, model,
temperature or tool-budget increase, and the native product's 32/48 tool
budget is not touched. `callsMade: 2` is written only on the merged success
path (1237). No finding.

## 5. Safe transport error categories (0963–1006, persisted at 1194–1201)

`errorName` maps only through a 4-entry frozen table (0963–0968) via
`hasOwnProperty` (0999–1002), so no arbitrary name string can pass; unknown
name → `OTHER`. `error.code` and `error.cause.code` map only through the
10-code whitelist set (0969–0980); unknown code → `OTHER` (0990–0993),
absent code → `null`. Only `name`, `code` and `cause.code` are read
(0995–1005) — message, stack, URL, headers, body and credentials are never
copied into the diagnostic. The original classification expression is
unchanged (`TIMEOUT` / `ENTIRE_CALL_CAP_EXCEEDED` / `TRANSPORT_FAILURE`,
1066–1080); the diagnostic is an additional field only, and a completed
response carries `transportDiagnostic: null` (1056–1064). No finding.

## 6. Credential, network and runtime isolation

The key enters only over stdin (0911–0960), is length- and printable-ASCII
checked (0928–0932) and re-validated when the header is built (0522–0531);
every artifact is serialised through the redactor in raw and JSON-escaped
form (0788–0809). The Root driver scrubs proxy/NODE env vars and sets
`NODE_USE_ENV_PROXY=0` (driver 0048–0052), redirects HOME/APPDATA/TEMP inside
the owned root (0049–0050), hands the key to the child over anonymous stdin
only (0077–0086), and scans the owned root for the raw and JSON-escaped key
(0095–0103). The route `10.126.126.1:8000` is the approved outside-of-office
6000D gateway (0006). No finding.

## 7. Root driver, watchdog, cleanup, fail-closed

The 8 external pins (5 source/cache + node + pwsh + driver) are re-verified
byte- and mtime-exact **before** the Key is read (driver 0034–0035, executed
before the PS literal is written at 0119). The child is launched with the exact
source/root arguments and its own PID/exe/UTC birth recorded (0082–0084). The
PS watchdog kills only on exact exe + UTC-birth identity match (0088–0092) and
the Python watchdog/cleanup re-verify the same identity (0132–0152, 0159–0170);
cleanup applies after every outcome, not only on timeout (0166–0169). The
admission is marked consumed before the Key is read and closed afterwards
(0120–0123, 0177–0180). The admitter refuses reuse of an existing admission
(admitter 0026) and refuses to run while any CONSUMED diagnostic record exists
(0024). No finding.

## 8. Held sources

The manifest pins consumer + fixed data + offline controls + stage-1 cache
(manifest 0001–0022) and the consumer re-verifies all four at startup,
including its own bytes (0835–0871). The stage-1 cache bytes and the
`validateStage1Result` / `parsePinnedStage1Assessments` validator are unchanged
from the held V3 copy (the consumer diff touches neither), and the cache
identity is carried into the artifacts (1145, 1150). No finding.

## Non-blocking observations (no fix required now; recorded for later)

**O1 — `MAX_REQUESTS` is declarative only.** The runtime request count is
bounded by `REQUEST_STAGES.length` through the loop at 1174, not by
`MAX_REQUESTS` (0013). If a third stage were ever added, the loop would issue
3 calls while `MAX_REQUESTS` still reads 2, and neither the admitter (which
checks the admission file's `max_requests == 2`, admitter 0034) nor the offline
controls (which check the constant, controls 0300) would notice. Optional
hardening: assert `REQUEST_STAGES.length === MAX_REQUESTS` at the top of
`runMain` (or derive the loop bound from `MAX_REQUESTS`).

**O2 — the PS literal is a byte-held V2 reuse; its identity-kill branch is
unproven in this review.** The literal body is unchanged from the accepted V2
literal apart from `requests_cap=1→2` (static-parse json 0006–0008; the
driver inverse diff touches only the outer Python). Its kill branch compares
`CreationDate.ToUniversalTime().ToString('o')` from CIM against
`$child.StartTime...ToString('o')` from the .NET process object (driver
0089–0090, 0111–0114). This static review did not exercise that branch, so
exact-identity kill under the watchdog remains qualified, not proven. Minimal
future strengthening: take both birth stamps from the same CIM source. This
is inherited from V2, not a new V4 defect, and does not block.

## Limits of this PASS (explicit)

- **Source only.** No code was executed, so there is no runtime, no timing, no
  real request byte count, no server behaviour, no Key/DPAPI observation and
  no watchdog observation in this review.
- The 183/182 split and the recorded request sizes (132675 / 132659) are
  arithmetically consistent with the recorded 365 targets, but were not
  recomputed from `fixed-data.json`.
- **Semantic: none.** No target, source, draft, self-check, ref, union or
  protocol check proves entailment, factual correctness, or any legal/business
  outcome. The terminal status stays
  `TARGET_REVIEW_COMPLETE_REQUIRES_ROOT_MANUAL_JUDGMENT`; a future full-365
  manual counterexample review plus a false-positive judge is still required.
- **Transport cause remains unknown.** The safe diagnostic is a new
  observation channel only; it does not retroactively explain the V3 failure
  (no HTTP status, no body, no server-side cause known) and must not be read
  as a green transport result.
- **Private ACL / platform security not proven.** Only "current user + shared
  writable workspace" trust was assumed. Owner-only ACLs, hostile local
  actors, memory forensics and full-machine key scans are explicitly not
  proven (driver 0174 scope fields, admitter 0034).
- **The sharding hypothesis itself is untested.** Each request still carries
  the full 365-target table and the full source, so if the V3 failure was
  request-side rather than response-side, two shards fail the same way. That
  is a hypothesis for the runtime run, not a source defect.
- The caller's own downstream gates (full source review plus the bounded
  affected-offline rerun against the exact 8 pins) remain outstanding; this
  PASS covers neither, and it grants no model-run authorisation.

