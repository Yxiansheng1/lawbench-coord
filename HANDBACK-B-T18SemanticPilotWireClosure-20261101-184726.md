# B handback: T18 semantic pilot wire closure

## Status

- Account: `AUTHORED_NOT_RUN`
- Runtime: `0`
- Real API calls: `0`
- Model calls: `0`
- Offline controls executed: `false`
- Quality result claimed: `none`

The bounded source edits are complete in the existing unserved source root. No product execution, runtime validation, real request, credential read, or Git write occurred.

## Exact changes

### WIRE1

Added pure `buildAuthorizationHeader(rawKey)`. It requires the existing raw-key contract (nonempty printable ASCII without spaces, maximum 4096 characters) and returns `Bearer ` plus the unchanged raw key. `performRequest` now constructs the Authorization header from that function. Stdin parsing still returns the raw key without a scheme, and no DPAPI slot or external credential store was touched.

Offline authored controls use a fake sentinel, assert the exact Bearer prefix, and assert the sentinel is absent from both generated payload/message bodies. The controls do not print the sentinel.

### WIRE2

Added pure `unwrapChatCompletion(rawBody)`. It accepts an object with exactly one chat-completion choice and requires an assistant message whose `content` is a nonempty string and whose `finish_reason` is `stop`. It rejects malformed envelopes, top-level errors, missing content, tool calls, length/unfinished completions, and non-assistant messages. It never reads `reasoning_content` as a fallback and never extracts top-level facts.

Both stages now write the raw HTTP response artifact before parsing, pass only the returned assistant content to the existing `parseModelJson`, and then pass that result to the existing validators.

Authored offline controls cover OpenAI-style enveloped positive responses for both stages, direct/non-enveloped rejection, malformed JSON, missing content, error envelopes, tool calls, and truncated `length` completion.

### SCOPE1

Replaced recursive normalized-name lookup, receipt-array scanning, nested aliases, and text fallbacks with direct fixed-schema reads from `data.evidence`, `data.draft.content`, `data.visible_selfcheck`, and `data.coverage`. The selector also checks the exact format discriminant and required receipt/draft types. Returned receipt arrays and coverage objects remain the original parsed references; text values are not trimmed, rewritten, or synthesized.

Authored controls cover direct-schema preservation and rejection of aliased evidence, nested draft text, nested self-check text, and invalid coverage.

### JOIN1

Stage 2 validation now resolves every supplied `stage1_candidate_id` and requires its finding's `receipt_id` and `evidence_quote` to exactly equal the referenced candidate's `receipt_id` and `quote`. Unknown candidates remain failures.

The Stage 2 system prompt adds only the exact candidate-binding protocol sentence. Authored controls include one same-candidate positive, two distinct cross-candidate negatives (receipt mismatch and quote mismatch), and an unknown-candidate negative.

## Integrity

Final static .NET SHA-256 and byte-size readings:

- `review-consumer.mjs`: `26521` bytes, `1a8455abd85ba1862cf66296b0c342af11fe03ed21293c260343bdad26878e43`
- `fixed-data.json`: `17427` bytes, `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`
- `offline-controls.mjs`: `13090` bytes, `bc652d6c83723cdbc535a73255d0a536889b77e2bc1cea62b1bb5cdaec041f12`

`fixed-data.json` remains byte-exact against the supplied pin. `source-manifest.json` was updated only for the two edited source files.

## Held behavior and validation boundary

The route, model, `temperature: 0.6`, `max_tokens: 49152`, non-streaming mode, two-call cap, per-call and entire-run timeouts, no-retry behavior, redirect rejection, output-root protections, redaction, prompt purposes, and fail-closed error flow remain in place.

Per the execution order, no Node, parser, test, check, HTTP, model, key, GUI, discovery, or Git write was performed. Controls are authored but not executed. This handback does not assert a PASS or claim that model quality is fixed.

Root must review the full cumulative diff and setup, then obtain the required independent reviews and passive controls before any real call.
