# T18 Visible Unit V2 A Closure Source Review

Verdict: PASS

Scope: independent source-protocol closure review only. This is not runtime, product, legal, business, or semantic PASS.

Current lines and trigger: `00-review-consumer.mjs.txt` lines 76-96 scan LF-delimited physical lines with the exact positive-integer display-marker grammar. A line that begins with reserved `【第` but is not an exact marker now raises `inventory:MARKER_FRAME_INVALID`; this covers mixed valid/malformed content and CRLF framing without normalizing, truncating, or dropping input. Lines 130-147 still reconstruct every admitted unit and require byte-for-byte reassembly. `01-offline-controls.mjs.txt` lines 165-180 add the malformed `【第08行】` line between valid markers and retain a CRLF negative assertion with the new explicit error. The controls change does not waive an earlier assertion.

The consumer delta is limited to `scanDisplayMarkers`; the cumulative protocol outside that function is held unchanged. The full source also retains exact unit-id coverage and unknown-reference rejection, stage 1 without draft/self-check input, a fresh stage 2 request, the fixed route/model/parameters/call and timeout bounds, exact API-envelope handling, credential redaction, and no retry/fallback.

Minimal fix: none for this source verdict. Before any credential is supplied, Root must regenerate or externally pin and verify the current runtime/source artifacts. The supplied `02-source-manifest.json.txt` still pins the pre-fix consumer `9830ff15...`; executing the current consumer against that unchanged manifest will fail closed with `CONSUMER_PIN_MISMATCH`.

Runtime and semantic limits: no Node, Python, parser, test, network, model, or Git operation was run under this order. Provider behavior, the 8-receipt/62-unit finite-corpus acceptance, current pin consistency, and the fixed runtime environment remain Root pre-execution checks. Marker handling is a fail-closed prototype rule for pinned actual-read data, not a general prose parser or content-semantic guarantee. Unit reviews remain provisional material for Root manual judgment and are never semantic, business, or legal PASS.
