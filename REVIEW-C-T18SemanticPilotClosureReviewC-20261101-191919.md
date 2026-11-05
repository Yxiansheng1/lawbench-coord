# Independent C closure review: T18 isolated semantic pilot

## Verdict: AMEND

The frozen packet is internally pinned as follows:

- `review-consumer.mjs`: 27,921 bytes, SHA-256 `a323c1641a87f1686ce16515d31430e966905f2eb3a4dfb4d4775cd8cb3dcb87`.
- `offline-controls.mjs`: 16,290 bytes, SHA-256 `dbd040a95952263ed140ec1a28ae6b980cf375f09d182498f5ac76f8c67acc7f`.
- `fixed-data.json`: 17,427 bytes, SHA-256 `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`.
- Root launcher `run-semantic-pilot-saved-key-root-admin.py`: 13,493 bytes, SHA-256 `b890ef8c1a621ded74d00118989899504dc34e7447eb8ce1fe4f626878234443`.

This is a source-only review. No Node, Python, parser, test, build, HTTP, model, probe, GUI, application, credential, or Git operation was performed.

## In-scope blockers

### 1. The launcher's exact-process comparison is invalid for its Windows Node path

Current source:

- Root launcher line 7 defines `NODE='E:/node/node.exe'`.
- Line 68 inserts that forward-slash spelling into `ProcessStartInfo.FileName`.
- Lines 80 and 102 compare `$q.ExecutablePath` with `NODE_LITERAL` using PowerShell `-ieq`.

`Win32_Process.ExecutablePath` is a Windows canonical executable path, normally `E:\node\node.exe`. PowerShell `-ieq` compares strings and does not normalize `/` versus `\`. The expected literal is therefore not equal to the observed path.

Concrete trigger and effect:

1. Node remains alive when the driver's line 78 watchdog expires.
2. The line 80 identity test is false, so `$child.Kill()` is skipped.
3. Line 81 then enters an unbounded `$child.WaitForExit()`.
4. The same false comparison at lines 100-103 prevents the driver's `finally` cleanup.
5. The outer Python watchdog at lines 136-139 can rescue the normal 900-second case after it has recorded Node identity, but the outer `finally` at lines 145-146 only observes remaining processes. If the driver exits through its catch or otherwise exits while Node survives, Node can remain orphaned.

Minimal fix: normalize the expected and observed executable paths before both comparisons, or compare canonical full paths case-insensitively. Also have the Root Python `finally` invoke the already identity-checked `kill_exact` for every still-live owned descendant before writing final proof. This preserves exact PID/executable/UTC-birth cleanup and does not require a broader process-management framework.

### 2. Redaction can create a persisted occurrence of the exact credential

Current source:

- `review-consumer.mjs` line 22 defines the replacement as `[REDACTED_CREDENTIAL]`.
- Lines 320-328 replace the raw credential and its JSON-escaped rendering with that marker.
- Root launcher lines 64-66 use the same replacement strategy.
- Line 85 scans files only after the consumer and launcher have written them.

The credential validator accepts any nonempty printable-ASCII string. If the admitted credential is a substring of the replacement marker, redaction introduces the exact credential into the replacement. For example, an admitted credential of `R` is valid, and every `[REDACTED_CREDENTIAL]` marker still contains the exact raw credential `R`. The post-write scan at lines 85-92 or consumer-side serialization cannot make that safe: the files have already been persisted.

Concrete effect: artifact, stdout, or stderr redaction can pass through the replacement stage with the exact credential still present. The Root scan then reports a hit and aborts, but it does not retract the already written files. That violates the requirement that all owned artifacts are redacted and that no raw-key artifact exists.

Minimal fix: use a replacement policy that cannot contain a nonempty admitted credential, such as replacing the exact raw and JSON-escaped renderings with an empty segment, or dynamically selecting a marker that contains no nonempty substring of either rendering and falling back to the empty segment. Apply the same policy in the Node serializer and the Root string redactor, and retain the independent scan as a backstop rather than the primary guarantee.

## Additional operational risk

In `review-consumer.mjs`, lines 500-517 cancel the response reader on the explicit byte-cap path, but a read/transport exception reaches the catch at lines 527-539 after only `releaseLock()`. The body stream is not canceled on that terminal path. The Root watchdog can eventually terminate the process, so this is not a credential or route failure, but it weakens natural resource closure during an early transport failure. A minimal fix is to retain the reader until the `finally` and cancel it when reading did not complete normally.

## Source-only findings that pass the narrowed requirements

- Stage 1 receives only system instructions plus evidence receipts. Draft, visible self-check, coverage, and stage-one history are absent.
- Stage 2 receives the same verified receipt objects, parsed stage-one candidates, the physical old-v3 draft content, visible self-check, and actual coverage, without a raw stage-one transcript.
- The prompt contains no expected defect keywords, completeness pass, legal result, or business result.
- The parser permits at most one explicit outer Markdown fence and otherwise fail-closes.
- Validators authenticate receipt, material, unit, candidate, draft, and self-check anchors; they do not claim that literal presence proves correct semantic treatment.
- The fixed-data bytes verified during the manifest pass are reused for parsing, so the earlier reopen race is closed.
- The response model must exactly equal `qwen38-27b`; missing or different values fail.
- The request route, model, temperature, token cap, stream flag, redirect policy, two-call limit, per-call budget, and whole-run deadline are fixed in source. No retry, fallback, health probe, SDK, child process, or dynamic code path is present.
- The launcher uses a filtered environment without proxy, preload, or `NODE_OPTIONS` variables, redirects user state into the fresh Root, and sends the DPAPI-derived credential only through anonymous child stdin after admission and pin checks.
- Consumer artifact names are restricted, files are created under a strict descendant of the requested output root with exclusive creation, and the launcher requires the root to be fresh and its pre-existing ancestors to be non-reparse paths.
- Empty findings produce `EMPTY_REVIEW_NOT_QUALITY_PASS`, never a quality, legal, business, or completeness pass.

## Explicit limits

- Runtime behavior is not proven. The offline controls were not accepted here as proof of model behavior, and the model was not contacted.
- Semantic accuracy, recall, false findings, stage-2 judgment quality, and completeness are unmeasured. Every model finding still requires manual Root judgment.
- The stated trust boundary is the current user plus the existing local Codex workspace. The recorded parent is writable by `CodexSandboxUsers`; owner-only ACL protection, hostile local actor resistance, and full platform security are neither proven nor claimed.
- The launcher detects exact owned-root credential occurrences only in UTF-8 files. It does not prove memory erasure, absence from OS crash artifacts, absence from server-side state, or machine-wide secrecy.
- The observed TCP peer record is evidence for Root inspection, not an automatic route allowlist enforcement mechanism.
- This diagnostic is not production implementation, a Native workflow, a legal review, or a business-quality gate. Packaging remains on hold until the bounded source amendments are applied and Root performs its separate admission and runtime review.
