# Independent source-only review: T18VisibleUnitV2

## Verdict

**AMEND**

The reviewed source correctly establishes an all-unit numbered inventory, stage isolation, exact unit-ID coverage, strict response schemas, and machine-derived source/draft/self-check text for the supported marker form. One in-scope framing defect remains.

## Blocking finding

### Malformed numbered markers can be silently absorbed

In `review-consumer.mjs`, `scanDisplayMarkers` at current lines 76-94 records only lines that exactly match `DISPLAY_MARKER_LINE`; the `match === null` branch is a no-op. `buildVisibleUnits` at current lines 116-144 then splits only at the recognized markers and accepts the lossless reassembly.

Trigger: with valid `【第7行】` and `【第8行】` markers, insert a malformed marker-shaped line such as `【第08行】` between them. The scan sees the valid consecutive 7 and 8 markers, so sequence, range, framing, count, and reassembly checks all pass; the malformed line is silently retained inside unit `L7`. `offline-controls.mjs` current lines 132-168 do not cover this mixed valid/malformed case.

This violates the requirement that malformed framing fail explicitly rather than be silently skipped or treated as unit content.

Minimal fix: while scanning each physical line, after the exact marker match fails, detect a marker-shaped line (for example, a line beginning with the full-width `【第` framing and ending in `行】`) and raise an explicit inventory protocol error such as `MARKER_FRAME_INVALID`. Add one synthetic control with valid adjacent markers and a malformed marker-shaped line between them, asserting that explicit failure and preserving the original bytes.

## Qualifications

This is a source-only review. No Node, Python, parser, tests, build, probe, HTTP, model, GUI, application, credential, or runtime was executed. The previously reported offline result and the reviewed source do not establish semantic correctness, model quality, quote fidelity in model prose, legal or factual completeness, or a business/legal PASS.

Root launcher/runtime behavior is outside this review: anonymous stdin/DPAPI handling, credential cleanup, process identity, shared-read logging, ACL behavior, and end-to-end cancellation were not revalidated. This review provides no hostile-local-actor, owner-only ACL, full-platform, production, or private-case guarantee.
