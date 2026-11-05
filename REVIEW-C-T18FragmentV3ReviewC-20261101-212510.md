# Independent C review — T18 Fragment V3

## Verdict

**PASS — source-only scope.** No new in-scope source defect was found in the supplied C views. **INSUFFICIENT** for runtime behavior, semantic quality, private ACLs, hostile local actors, and full-platform security; none of those was executed or proven here.

## Findings

| Area | Source finding | Exact lines |
|---|---|---|
| Network and credential path | One fixed private route, fixed model/parameters, one request stage, no redirect, bounded response, and credential only from non-TTY stdin. The cap is checked before root creation or credential read, and only one stage-2 fetch exists. | `review-consumer.mjs:6-17`, `775-843`, `925-1010` |
| External pins and cache | Manifest identity is checked separately from the Consumer; fixed data, controls, and the byte-held Stage-1 cache are hash/size pinned from the same buffer later parsed. Root admission externally pins five source files plus Node, pwsh, and the driver. No Stage-1 HTTP call remains. | `review-consumer.mjs:699-735`, `942-943`, `980-993`; `source-manifest.json:3-23`; `admit-fragment-bidirectional-v3-reviewed-runtime-root-admin.py:9-37`; `run-fragment-bidirectional-v3-saved-key-root-admin.py:35-53` |
| Fragment inventory and response admission | The lossless splitter preserves delimiters, blank and empty bodies, source headers, parent text, and UTF-16 offsets. Stage-2 validator requires exact keys, the full target-id set, correct family treatments, known cross-family refs, no duplicate refs, refs for positive treatments, bounded assessments, and rejects copied-quote/override/overall-PASS fields. | `review-consumer.mjs:192-343`, `592-649`; `offline-controls.mjs:180-257`, `400-500` |
| Root gate, watchdog, and cleanup | Pins are rechecked and the environment is allowlisted before the DPAPI read and Node start. The credential travels by anonymous child stdin. Child identity is checked by path and UTC birth time for timeout and final cleanup, with an independent outer watchdog and post-exit exact-identity sweep. | `run-fragment-bidirectional-v3-saved-key-root-admin.py:35-53`, `54-117`, `127-181` |
| Fail-closed behavior | Target overflow, pin/cache/protocol failure, timeout, transport failure, non-200, response overflow, and invalid output all terminate without retry or fallback. The driver likewise requires an explicit root gate, scans the owned UTF-8 artifacts for raw and JSON-escaped credential forms, and records exact cleanup evidence. | `review-consumer.mjs:338-343`, `902-922`, `925-1050`; `run-fragment-bidirectional-v3-saved-key-root-admin.py:64-115` |

## Trigger and minimal fix

- **Trigger:** none found in the supplied source views.
- **Minimal fix:** none for this source verdict.

## Limits

This review did not execute Node, Python, the offline controls, the Root driver, a request probe, or any model call. The green source proof is not semantic evidence: target treatments, references, and self-check claims require future Root manual judgment against all targets and the original counterexample. This review also does not establish private-document suitability, owner-only ACLs, hostile-local-actor resistance, or full-platform behavior.
