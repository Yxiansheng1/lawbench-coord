# Independent Source Review A — T18 Schema Keyword Compat V7

Reviewer: independent lane A (static source review, exact DS1017max/A scope)
Date: 2026-11-01
Verdict: PASS (static, source-only; no runtime / provider / semantic / security pass claimed)

## Scope actually reviewed

Only the supplied A views were read, in full:

- 00-review-consumer.mjs.txt (review-consumer.mjs, focused lines 660-830)
- 01-offline-controls.mjs.txt (offline-controls.mjs, focused lines 615-665, 850-1005)
- 02-T18-schema-keyword-compat-v7-source-reviewed-current.json.txt
- 08-source-manifest.json.txt (source-manifest.json)
- review-consumer.mjs.diff.txt (whole-file CLOSED_V6 -> V7 diff)
- offline-controls.mjs.diff.txt (whole-file CLOSED_V6 -> V7 diff)

Not read: any other repository file, the pinned evidence artifacts themselves, the Root
driver / root PS / inverse-diff views (C-side), peer or model outputs, root semantic
criteria, fixed-data, stage1 assessments. No Node/Python/parser/--check/test/build/
prepare/HTTP/model/health/probe/GUI/Key/runtime invocation was performed. No hash or
readback verification was performed.

## Focus 1 — Single unsupported keyword removal

- The consumer delta is exactly one property removal: `uniqueItems: true` is deleted from
  the `refs` schema literal in `buildStage2ReviewRecordSchema` (review-consumer.mjs
  L674-L679). The remaining literal is `type` / `minItems` / `maxItems`, with `items`
  added only when the eligible reference set is non-empty (L680-L685).
- The whole-file diff shows no other consumer change: no second keyword added or removed,
  no prompt, model, budget, library, guard, transport, cache or fallback edit. No automatic
  fallback path exists or was introduced.
- The schema builder is shared by both the positive and the non-positive branch, so the
  single removal applies uniformly to all stage-2 branches. This is the intended scope.
- Effect: the provider may now legally return duplicate `refs` entries (the array stays
  bounded by `minItems` / `maxItems` / `items.enum`); uniqueness is no longer enforced at
  the schema layer. Backend support for the remaining grammar is unchanged and still
  unproven.

## Focus 2 — Local duplicate preservation

- `validateStage2Result` keeps the local uniqueness guard unchanged (review-consumer.mjs
  L790-L797): a per-record `refIds` Set is maintained and a repeated reference id fails
  with `REF_DUPLICATE` before the record is accepted (L796). The diff does not touch this
  region.
- Consequence: schema-level uniqueness is gone but local strictness is intact — a provider
  duplicate is still a hard protocol failure, not a silently accepted record. No validator
  waiver, no softening of the error taxonomy, no change to `REF_FAMILY_INVALID`,
  `UNKNOWN_REF_TARGET_ID`, `POSITIVE_TREATMENT_WITHOUT_REF`, count or merge logic.

## Focus 3 — Affected control assertions

- The control delta is confined to the three assertions that encoded the removed keyword:
  the per-branch absence check (offline-controls.mjs L881), the two exact key-set
  assertions for the positive / non-positive branch refs schema (L943-L950), and the
  exact key-set assertion for the no-eligible-refs branch (L991-L995). The prior
  duplicate-negative control is untouched and still asserts `REF_DUPLICATE`
  (L625-L634).
- Cross-check against the consumer builder: the absence assertion is expressed as
  `hasOwnProperty(...) === false`, which is the correct negation of the removed property
  (it fails both for a present-and-true and for a present-and-falsy keyword, which a
  value assertion would not).
- Key sets were reconciled line by line with the consumer code in the reviewed window:
  refs keys `{items, maxItems, minItems, type}` when eligible refs exist (consumer L674-L685
  produces exactly these four); `{maxItems, minItems, type}` when the eligible set is
  empty (consumer skips `items` at L680-L685, asserted at L996-L999); top-level `reviews`
  keys `{items, maxItems, minItems, type}` (consumer L748-L756) and its insertion order
  `type, minItems, maxItems, items` (L1000-L1003, consumer L749-L753). No contradiction
  found.
- The "all other assertions held" claim is verified only for the supplied windows; the
  control file regions outside 615-665 / 850-1005 were not in view.

## Focus 4 — Manifest closure

- `source-manifest.json` (L002-L023) declares `algorithm: sha256` and exactly four
  entries — `consumer`, `fixed_data`, `offline_controls`, `stage1_assessments` — each with
  path, byte count and digest, all relative to the offline evidence directory.
- `T18-schema-keyword-compat-v7-source-reviewed-current.json` (L005-L035) pins the same
  four artifacts plus the manifest itself, with digests and byte counts identical to the
  manifest and to the index pins. No digest, byte-count or path disagreement exists among
  the supplied files.
- Closure limitation: this is the offline manifest for the consumer/control bundle. The
  Root driver and Root PS manifests are carried in C-side views and were not audited by A,
  so no statement is made here about Root pre-launch manifest rejection or directory-scan
  closure.

## Concrete current bugs

None identified in the reviewed delta. No reachable new-defect line / trigger / minimal
fix is reported; the schema-keyword removal, the retained local duplicate guard, the
updated control assertions and the offline manifest entries are mutually consistent.

One documentation-only nit (no code change proposed): the qualification wording in the
source-reviewed-current.json describes the control-change scope in a way that can be read
as a diff-region count rather than a changed-expectation count. Cosmetic imprecision in
prose only; it does not affect the artifacts.

## Limits and qualifications (source / runtime / provider / semantic / ACL)

- Source window: the consumer was supplied only for lines 660-830 plus the whole-file
  diff. The diff proves one removal but cannot by itself prove that `uniqueItems` occurs
  nowhere else in the 56,665-byte consumer (for example in a second schema builder
  outside the window); the offline controls assert absence only on stage-2 response-format
  branches. Closing this without touching any frozen guard would be a consumer-source
  scan for the `uniqueItems` token in the offline control suite — a test-only addition
  with no product behaviour change. Until then this stays a verification gap, not a
  demonstrated defect.
- Source scope: no full re-read of the consumer, the platform layer, the Root driver, the
  Root PS CIM ownership capture (parent PID / exe Node / birth-time comparison, inner
  watchdog versus outer readback), setup / error paths, stdin privacy, cleanup or
  watchdog duration. Those views are C-side; no Root-PS verdict is issued here.
- Runtime: static source reading only. Nothing was executed, so no claim is made that the
  control suite passes, that the consumer emits the expected schema at runtime, or that
  the Root pre-launch rejection behaves as described.
- Provider: the only observed server behaviour is the V6 HTTP 400 specifically on
  `uniqueItems`; the follow-up request was not sent. Support for the remaining schema
  grammar is still unproven, no feature lottery or server-flag probing was performed, and
  no automatic fallback exists.
- Semantic: no semantic criteria were supplied or read. No Stage1, NativeSession, R,
  history, product, business, security or release PASS is claimed; the fixed-data and
  stage1 assessments were not audited.
- ACL / environment: writes were confined to the coordination directory. Git was kept
  strictly read-only — no add, commit, rebase, stash, reset, clean, checkout or push; no
  index.lock or permission issue was treated as a delivery blocker and no attempt was made
  to repair one. No sandbox, approval or ACL change, no writer-lock change, no setup
  script run, no model or API change.
