# B handback: T18 typed reference graph + request JSON Schema V6

Status: `SOURCE_ONLY_AUTHORED_NOT_RUN`

No Git writes were performed. Packaging remains `HOLD`. Root full review, affected guarded offline execution, and independent review remain required before any Key/model use.

## Destination

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18TypedReferenceSchemaV6-20261101-224758`

Exactly five filenames were copied into the new directory. `fixed-data.json` and `stage1-assessments.json` remain the trusted byte-exact copies.

## Final pins

| File | Bytes | SHA-256 |
|---|---:|---|
| `review-consumer.mjs` | 56688 | `1780ed662ce2dac7e8c4e7e7a00f441c205fe6a66aa0c6ffe43e64dd7d5a5b08` |
| `fixed-data.json` | 17427 | `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69` |
| `offline-controls.mjs` | 50329 | `83fcd21f27ba25b50b5f91ea603cfb86ac787b89c619f7cf17d9e7470d94a1d9` |
| `stage1-assessments.json` | 10015 | `5e4ba4c51aa23b29b8625174c595d940628bbb7910ef6e9afcd4f777d5712fc1` |

Manifest algorithm: `sha256`. `source-manifest.json` pins the four files above without adding fields.

## Authored change

- The sole generic Stage2 reference-map prompt sentence now expresses the directed graph `F -> C`, `C -> F`, and `Q -> F | C`.
- The local validator now rejects all other reference directions, including the new `F -> Q` and `C -> Q` negative cases. Existing schema, ID, duplicate, missing, cap, quote, root-pass, assessment, redaction, and error checks remain.
- Exported `buildStage2ResponseFormat(inventory, reviewTargetIds)` builds the request-scoped `json_schema` format from the canonical index and existing active-ID validation. Branches are metadata-only, family-disjoint, and positive/other-treatment-disjoint. Active target enums exclude inactive same-family IDs; reference enums include all typed eligible canonical IDs, including IDs outside the active shard.
- Positive branches require at least one ref. Non-positive branches retain `minItems: 0`. If no typed eligible ref exists, the positive branch is omitted and the non-positive refs constraint allows only an empty array without an empty enum.
- `buildRequestPayload(messages)` is byte-behavior compatible when the optional format is absent. Supplying a format appends only `response_format`. Each existing Stage2 request now supplies the current inventory and shard IDs to the builder. Request count, stages, timeouts, parameters, response cap, transport, credential handling, artifact writes, cleanup, and no-fallback behavior are unchanged.

## Entire inverse areas held

- Product HTTP transport and all setup/cleanup/key/stdin/write/disposal functions were not redesigned or mirrored.
- No new model call, stage, retry, fallback, SDK, backend configuration, health check, or network path was added.
- Existing offline pure and transport assertions were retained except minimum ref-fixture changes required by the directed graph.
- The V5 HTTP fake and `AbortSignal` restoration tail were not rewritten; only the new builder import and preceding controls changed.

## New controls authored but NOT RUN

- Directed-graph negatives: `F -> Q`, `C -> Q`, same-family refs, and old positive-without-ref behavior.
- Response-format static structure: root exactness, required/no-extra fields, active-ID family enums, treatment enums, typed ref enums, positive/non-positive item minima, outside-active refs, all-family branch coverage, recursive absence of empty enums, and empty-eligible-ref handling.
- Payload controls: original payload omits `response_format`; formatted payload includes it; model and parameters remain held.

No controls, Node parser/check, test/build command, product run, HTTP request, model call, health check, probe, or server inspection was run.

## Known unproven conditions

- Matching backend support for Chat Completions `response_format.type=json_schema` is documented but not actually proven in this source-only run. A schema-related HTTP non-200 must be preserved as the actual response and followed by stop, with no fallback.
- JSON Schema `maxLength` may count Unicode code points more narrowly/widely than the retained local UTF-16 validator. The strict local validator and trim/nonempty check remain authoritative.
- Schema conformance would constrain protocol shape only; it does not guarantee semantic correctness, evidence relevance beyond the typed family graph, factual truth, or manual-review outcomes. Root manual judgment remains required.
