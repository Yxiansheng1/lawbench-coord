# B Handback: T18 Semantic Pilot Safety Closure

## Status

`AUTHORED_NOT_RUN`

`runtime=0`

The four bounded fixes and their necessary offline controls were authored. No consumer runtime, offline control execution, test, build, parser, probe, HTTP request, model call, GUI action, Git write, environment read, credential-format probe, or fixed-data parsing was performed.

## Exact Changes

1. `verifyPinnedSources` now retains the bytes read while verifying the `fixed_data` manifest entry and returns the UTF-8 decoding of that same verified `Buffer`. The former second `fs.readFile` of `fixed-data.json` was deleted. All three source pins remain verified.

2. `runMain` now establishes one whole-run deadline as `runStartedAt + ENTIRE_CALL_CAP_MS`. `performRequest` computes the remaining whole-run budget immediately before each fetch with the exported pure helper `requestTimeoutForDeadline(now, deadline)`, fails with `ENTIRE_CALL_CAP_EXCEEDED` when the budget is exhausted, and uses `AbortSignal.timeout(min(400000, remaining))` for the fetch and body reads. Each response is rechecked against the same deadline before acceptance. Deadline exhaustion is preserved as `ENTIRE_CALL_CAP_EXCEEDED`; it is not converted to a generic transport error. The two-sequential-call limit, absent retries, and absent sleeps remain unchanged.

3. `unwrapChatCompletion` now requires `envelope.model` to equal exactly `qwen38-27b`. A missing or different model produces `COMPLETION_MODEL_MISMATCH`. Existing intended-valid fake envelopes carry the valid model, original negative controls retain their original failure purpose, and missing, different, and case-different model controls were added.

4. `redactCredential` now replaces both the raw credential and `JSON.stringify(credential).slice(1, -1)`, applying the longest distinct rendering first. Redaction remains recursive across string values and object keys before artifact persistence. The new fake quote/backslash controls cover a raw error, a JSON response-body string, nested values, and raw/escaped nested keys, and assert that neither rendering survives serialization.

## Preserved Boundaries

The stage-one and stage-two messages, schemas, envelope data, `model=qwen38-27b`, `temperature=0.6`, `max_tokens=49152`, `stream=false`, route, single permitted outer Markdown fence, authentic-anchor-only validator with Root semantic judgment, and positive-integer version schema are unchanged. The Bearer raw-stdin flow is unchanged. No semantic keyword classifier, quote-presence omission filter, hardcoded version 3, ACL/policy modification, package, SDK, framework, integration, assertion weakening, or broader fallback was added.

## Files

Source root: `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940`

| File | Bytes | SHA-256 |
|---|---:|---|
| `review-consumer.mjs` | 27921 | `a323c1641a87f1686ce16515d31430e966905f2eb3a4dfb4d4775cd8cb3dcb87` |
| `fixed-data.json` | 17427 | `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69` |
| `offline-controls.mjs` | 16290 | `dbd040a95952263ed140ec1a28ae6b980cf375f09d182498f5ac76f8c67acc7f` |

`source-manifest.json` was regenerated once after the final edits using PowerShell/.NET byte length and SHA-256 computation.

## Validation Handoff

No runtime result is claimed. Root remains responsible for the finite controls after the full cumulative review, as required by the order. No Git staging or commit was attempted; this coordination-directory handback is the delivery record.
