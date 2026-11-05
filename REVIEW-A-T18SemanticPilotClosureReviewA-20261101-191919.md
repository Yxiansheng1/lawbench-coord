# Independent Source-Only Closure Review A

## Verdict

**AMEND**

The four bounded corrections are materially present, but the response path still
drops failure evidence that the protocol requires Root to retain for judgment.
Do not admit the real two-call diagnostic until the bounded response fix below
is applied and the changed source is re-reviewed.

## Blocking finding

### B1. A partial or boundary-complete model response is not preserved

Current source:

- `review-consumer.mjs` lines 497-539, `performRequest`
- `review-consumer.mjs` lines 604-612, stage 1 response handling
- `review-consumer.mjs` lines 634-642, stage 2 response handling

Trigger:

1. The HTTP response headers arrive and one or more body chunks are captured,
   then the body read fails, the transport closes, or the whole-run abort fires.
   The `catch` return at lines 528-539 always returns `status: null`,
   `body: ""`, and `capturedBytes: 0`, discarding the captured status and body.
2. A response returns at or after the 900-second deadline. Lines 605 and 635
   fail before lines 606-612 or 636-642 write the response artifact, so even a
   returned body is lost.

This violates the stated failure rule to treat timeout and transport failures as
actual failures while preserving the redacted raw response. It also prevents
Root from distinguishing no response from an HTTP response whose body later
failed.

Minimal fix:

- Initialize the response status and captured chunk state before the `try`.
  On a post-header failure, return the captured status, body, byte count, and
  overflow flag together with the classification in `performRequest`'s `catch`.
- Write each `stageN-response.json` immediately after `performRequest` returns,
  before applying the post-response deadline failure. The deadline check must
  still fail the run, but it must first persist the redacted response evidence.
- Keep the existing serializer as the only write path so both raw and
  JSON-escaped credential variants remain redacted.

## Corrections confirmed

- The consumer reads fixed data once and returns the verified byte buffer rather
  than reopening the file: lines 368-392.
- The per-call request timeout is bounded by both 400 seconds and the remaining
  whole-run deadline, and checks exist before and after each request: lines
  163-166, 485-539, 604-605, and 634-635. B1 concerns loss of response evidence,
  not absence of deadline enforcement.
- The response model must exactly equal `qwen38-27b`: lines 177-179.
- Artifact serialization redacts the exact credential and its JSON-escaped
  rendering, including nested keys and values: lines 320-340.

The stage split, exact receipt/candidate/draft/self-check anchors, empty-findings
status, single optional Markdown fence, fixed route/model/parameters, two-call
bound, and no-overall-PASS behavior remain consistent with the accepted source
protocol. The current offline controls exercise the corrected model, deadline,
redaction, and parser boundaries without network access. They do not exercise
the private `performRequest` failure path, so a green control run would not clear
B1.

## Root launcher and pin boundary

No additional source blocker was found in the reviewed launcher under the stated
trust boundary. Its ordering is appropriate: admission/status checks and
external pins are checked before the Root gate; the DPAPI credential is read
only inside the gated PowerShell driver; the raw credential is transported only
through anonymous stdin; and clean environment, fixed Node executable, fixed
route, two-request cap, owned-process identity, exact-process cleanup attempts,
post-run pin comparison, stdout/stderr redaction, and exact owned-root artifact
scanning are present.

This source review cannot prove the contents or completeness of
`T18-isolated-semantic-pilot-runtime-admission-current.json`, because that file
is outside the frozen packet. Root must ensure that the actual admission pin
list includes the pinned Node executable, source manifest, fixed data, and both
JavaScript sources before admission. The launcher trusts the supplied pin list;
it does not independently require those members to be present.

## Limits

- **Runtime:** no Node, Python, parser, test, control script, PowerShell driver,
  HTTP request, model call, Key read, or process-cleanup path was executed.
  Syntax, DPAPI behavior, timeout delivery, process identity, and final cleanup
  remain unproven.
- **Semantic:** no model output was produced or judged. Exact quote validation
  proves anchor presence, not correct treatment, completeness, or legal quality.
  All findings still require Root manual judgment.
- **Private ACL and hostile local actors:** the existing parent is shared
  writable with `CodexSandboxUsers`; owner-only ACL, private storage, hostile
  local-actor resistance, and full platform security are neither proven nor
  claimed.
- **Production:** this is an isolated synthetic diagnostic, not the Native
  workflow, production implementation, product repair, or business/legal PASS.
- **Data provenance:** the packet pins the fixed-data bytes and separately
  records the physical draft provenance. This review did not inspect or encode
  case-specific fixed-data content.

