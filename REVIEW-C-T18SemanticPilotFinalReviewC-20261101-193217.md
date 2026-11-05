# REVIEW-C — T18 isolated semantic pilot, independent source-only closure review (lane C)

Packet: `ORCH-C-T18SemanticPilotFinalReviewC-20261101-193217.md`
Frozen closure set: `D:\Lawbeach\lawbench-coord\T18SemanticPilotFinalClosure-20261101-193217\`
Reviewer: independent lane C, DeepSeek executor. No peer/old formal review was read; no root adjudication was
second-guessed outside its stated narrowed acceptance scope.

## VERDICT: PASS (SOURCE-ONLY)

The current frozen source is fit for Root to re-audit, admit, and (under Root's own gate) execute one
isolated two-call diagnostic. No in-scope functional blocker was found in the consumer source, the offline
controls source, the Root launcher, or the admission script against the narrowed acceptance scope stated in
`index.json` and in the root adjudication view.

`PASS` here means exactly: **the source as pinned in this packet is internally consistent, fail-closed on the
paths it claims to fail closed, and matches the stated trust boundary.** It is **not** a runtime result, **not**
a model-quality result, **not** a business/legal result, and **not** a platform-security result. The
qualifications in section 5 are part of the verdict and must travel with it.

Method: source-only, read-only. I read the execution order, `index.json`, all 10 numbered views and both
numbered diffs, and nothing else — no skill files, no discovery, no environment probing, no Git command, no
peer or old formal review. I executed no Node, Python, parser, test, `--check`, build, preparer, probe, HTTP,
model, GUI, app, Key, or runtime step. I made no edits to product/test/schema/SDK/source. I wrote exactly one
file: this review. Git was not touched in any form (no add/commit/rebase/stash/reset/clean/checkout/push),
and no existing dirty state was modified.

## 1. What the current source actually does (verified line by line)

### 1.1 Credential and redaction

- `review-consumer.mjs:0433-0483` reads the credential from stdin only: TTY rejected (`0434`), one line, CR
  stripped (`0448-0449`), empty/`>4096`/non-printable-ASCII rejected (`0450-0452`), and the byte buffer is
  never written, hashed, logged, or exported. No file/env/keyring/config path is read anywhere in the module.
- `review-consumer.mjs:0583-0600` fixes the admission order inside the consumer itself: CLI parse →
  `verifyPinnedSources()` → fixed-data parse → `selectPilotInput()` → `prepareOutputRoot()` → **then**
  credential read. The key is consumed only after the pin verification succeeded.
- `review-consumer.mjs:0152-0161` re-validates the credential at header build time and is the only place the
  credential enters the Authorization header; the header is never persisted
  (`route.json` records `requestHeadersPersisted: false`, `0601-0612`).
- `review-consumer.mjs:0320-0329` redacts both the raw credential and its JSON-escaped rendering
  (`JSON.stringify(credential).slice(1,-1)`), longest rendering first, so an escaped occurrence is replaced
  before the raw one can be masked by it.
- `review-consumer.mjs:0022` sets the redaction marker to `"\u2588"`, and
  `offline-controls.mjs:172-176` pins the property that matters: the marker lies outside the printable-ASCII
  set the credential validator admits, so the marker can never itself be an admitted raw or JSON-escaped
  credential. The earlier `[REDACTED_CREDENTIAL]` literal was inside the admissible ASCII range — the current
  non-ASCII marker is the correct fix, and the negative controls at `offline-controls.mjs:178-197` (one-char
  credential) and `199-224` (quote/backslash credential) exercise raw text, error string, JSON body string,
  object key and nested value.
- `review-consumer.mjs:0331-0341` applies redaction to string values **and** to object keys, so a credential
  appearing as a serialized key is masked too.
- Failure paths never echo raw material: `0560-0581` writes only `stage`, `code` and timings; `0688-0705`
  writes only `status=<code>` / `stage=<stage>` to stderr; `0686` writes only a status line and a redacted
  path. No headers, no request bodies, no raw objects.

### 1.2 Two-stage protocol, isolation, and validator honesty

- Stage 1 receives only receipts: `0110-0112` (envelope = `evidence_receipts` only) and `0124-0132`
  (system + that envelope). No draft, no selfcheck, no coverage, no stage-0/1 history.
- Stage 2 receives exactly the prescribed five inputs and no stage-1 transcript: `0114-0122`, `0134-0142`.
  `offline-controls.mjs:0112-0143` asserts the negative of stage-1 leakage and the absence of a raw stage-1
  transcript, and the positive presence of the candidate list.
- Prompts are generic. `0024-0034` / `0036-0047` carry no case-specific proper names, expected-defect keywords,
  or answer labels; both stages state that supplied items are untrusted data, never instructions.
- Validator honesty is intact, and the narrow acceptance scope is respected:
  - `0269` authenticates a stage-1 quote as an exact substring of the referenced receipt; `0257-0262`
    enforces exact key sets, unique ids, and receipt resolution. Material/unit equality is checked against
    the receipt (`0265-0268`). No lexical/semantic classifier was added, so no "semantic treatment" claim is
    smuggled in — exactly the adjudicated A5 rejection.
  - `0296-0298` forces a finding that cites a stage-1 candidate to match that candidate's receipt **and**
    quote exactly; `0300` anchors the evidence quote in the receipt text; `0302-0313` anchor `draft_quote` /
    `selfcheck_quote` in the real draft / visible selfcheck; `0314-0315` fail closed when a finding is
    unanchored and is not a declared omitted candidate.
  - `0351-0355` and `0374` of the controls: an empty review is `EMPTY_REVIEW_NOT_QUALITY_PASS`; the strings
    `PASS` / `legal_or_business_pass` never appear as an outcome (`0575-0579`, `0678-0685` set
    `protocol_capability_only: true`, `legal_or_business_pass: false`).
  - Model output is data only. Nothing in the response path is executed, evaluated, or fed back into a prompt;
    a model cannot escalate from finding to action.
- `0168-0201` rejects a completion whose `model` is missing, different, or case-variant (`0177`), a body with
  an `error` member (`0178-0179`), non-single choices (`0181-0183`), `finish_reason !== "stop"` (`0188-0189`),
  a non-assistant role (`0191`), non-empty `tool_calls` (`0192-0196`), and empty/non-string content
  (`0197-0199`).
- `0203-0225` strips at most **one** outer markdown fence (`0206-0213`) and nothing else; the raw body is
  preserved separately in `stage1-response.json` / `stage2-response.json` (`0622-0628`, `0652-0658`). This is
  the adjudicated A2 position — the retained protocol, not a new fallback.
- The physical-v3 binding is left to the external pin chain as adjudicated (A6): the schema check at
  `0091-0097` only requires a positive safe-integer version, and the version fact is carried by the pinned
  `fixed-data.json` bytes plus the Root-side external pins (`view 02` and `admit-...py:0030-0033`), not by a
  hardcoded literal in the consumer.

### 1.3 Route, budget, deadline, response cap

- Hard route/model/parameters are literals: `0006-0012` (`http://10.126.126.1:8000/v1/chat/completions`,
  POST only, `redirect: "error"` at `0497`, `qwen38-27b`, `temperature 0.6`, `max_tokens 49152`,
  `stream false`). No proxy, SDK, DNS, fallback endpoint, health probe, or retry exists in the source; the
  only network call in the whole consumer is `fetch(ROUTE, ...)` at `0495`.
- Exactly two call sites exist (`0621`, `0651`); stage 2 runs only after stage 1 returned 200 and passed
  extraction (`0636-0641` gate before `0644`). `MAX_SEQUENTIAL_CALLS = 2` is exported (`0013`) and reported in
  `route.json` (`0607`).
- The whole-run deadline is computed once at run start (`0584-0585`, 900 000 ms) and is enforced:
  - before **each** fetch — `0487-0488` computes `min(400 000, deadline-now)` and fails
    `ENTIRE_CALL_CAP_EXCEEDED` before any `fetch` when nothing remains (proved negatively by control C,
    `offline-controls.mjs:0607-0617`: expired deadline ⇒ zero fetch calls);
  - after **each** response — `0629` and `0659` check `Date.now() >= deadline` *after* the response artifact
    is written, so the raw redacted body survives while the run still fails closed;
  - in the transport-error classification — `0545-0546` maps a timeout that consumed the remaining whole-run
    budget to `ENTIRE_CALL_CAP_EXCEEDED` and a pure per-call timeout to `TIMEOUT`.
- Per-call timeout is `AbortSignal.timeout(min(400s, remaining))` (`0489`), which also bounds body streaming.
  The two calls can consume at most 800 s of the 900 s budget, leaving headroom for artifacts.
- Response cap is explicit, not silent: `0511-0515` cancels the reader and sets `responseOverflow`, and the
  caller fails `RESPONSE_TOO_LARGE` (`0637`, `0667`). A partial body is preserved (`0549`) and the reader is
  cancelled and released exactly once (`0522-0531`).
- The offline controls exercise the **same exported** `performRequest` implementation (not a copy) against an
  in-memory `globalThis.fetch` stub, restored in a `finally` (`offline-controls.mjs:0517-0620`): control A
  proves partial-body preservation + single cancel + single release + `TRANSPORT_FAILURE`; control B proves
  the clean path with zero cancels; control C proves no fetch on an expired deadline.

### 1.4 Write boundary and output-root handling

- `0357-0366` accepts exactly `--credential-stdin --root <absolute non-drive-root path>`; the driver passes
  exactly that (`run-...py:0071`).
- `0395-0410` rejects an existing root (lstat → `ROOT_ALREADY_EXISTS`), creates the root and `artifacts/`
  fresh, and fails closed on any non-ENOENT condition.
- `0412-0418` re-checks that every artifact target is a strict descendant of the artifacts directory;
  `0420-0431` restricts names to `^[a-z0-9][a-z0-9.-]*\.json$` and opens with `wx` (exclusive create), so no
  artifact can escape the root, overwrite another artifact, or be a path traversal. `fs.readFile` in the
  module is used only for the manifest and the three pinned inputs (`0371`, `0387`).
- The main-module guard `0709-0725` compares the resolved `argv[1]` with the module path (case-insensitively
  on win32), so importing the module — as `offline-controls.mjs:002-023` does — cannot read stdin, read files
  or open a socket. Module top-level code is declarations only.

### 1.5 Root launcher (actual process, cleanup, timeout, environment, write boundary)

- Admission and pin chain before the Key: `run-...py:0026-0038` re-validates the admission record, the
  offline proof, the closure acceptance, its own driver hash, and every external pin; `admit-...py:0011-0033`
  refuses reuse of the admission file (`0026`), pins the exact Node binary by SHA-256 (`0028`), requires seven
  distinct, non-reparse paths (`0030-0033`), and records `no_per_case_owner_reapproval`, `Packaging: HOLD`,
  `owner_only_ACL_or_hostile_local_actor_security_NOT_PROVEN: True` (`0034`).
- The key is read only after the gate and only inside the child: the Python writes `ROOT_START` on the
  driver's stdin (`run-...py:0120`); the driver reads that gate first (`0057`), then unprotects DPAPI
  (`0059-0062`), then starts Node (`0068-0074`), then writes the key to the child's stdin (`0076`). The key
  is therefore never in argv, env, a file, a hash, or a delegated artifact.
- Exact identity capture and cleanup: the driver records the child's pid, canonical exe and UTC birth
  (`0073-0074`); the driver watchdog kills the child only when exe **and** birth UTC still match
  (`0079-0081`); the driver `finally` repeats the same identity-checked kill (`0100-0103`) and clears the
  DPAPI byte buffer (`0104`). The Python side independently records identities with
  `ProcessId`/`ParentProcessId` (`0014-0019`), kills only exact pid+exe+birth matches (`0020-0022`), and
  applies that cleanup after **every** outcome, not only timeout (`0148-0158`), with descendants killed before
  parents (`reversed`). No whole-machine or server-side cancellation is attempted anywhere.
- Timeout: the Python watchdog is 900 s from spawn (`0136-0139`), the driver watchdog is the remaining 900 s
  minus its own elapsed time (`0077-0082`), and the consumer's own cap is 900 s from its start (`0584-0585`).
  All three fail closed.
- Environment / proxy / preload: the child environment is rebuilt from a whitelist
  (`SYSTEMROOT/WINDIR/SYSTEMDRIVE/COMSPEC/PATH/PATHEXT`) plus fresh sandboxed HOME/USERPROFILE/APPDATA/
  LOCALAPPDATA/TEMP/TMP/DSH_HOME/XDG_* directories under the fresh root (`0048-0050`), with
  `NODE_USE_ENV_PROXY=0` and an explicit assertion that no `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY`/`NODE_OPTIONS`/
  `NODE_EXTRA_CA_CERTS` is present (`0051-0052`). Node is launched by absolute pinned path, so PATH cannot
  influence resolution.
- Driver literal substitution is longest-token-first (`0106`), which is what fixes the
  `ROOT_LITERAL`/`MODELROOT_LITERAL` overlap that the static-parse proof records (`view 09`); the persisted
  driver text contains no credential (`0107-0108`).
- Root-side redaction and scanning are independent of the consumer: the driver redacts the child's raw
  stdout/stderr with the raw **and** JSON-escaped forms, longest first (`0064-0067`), and writes only the
  redacted text to disk (`0083-0084`); it then walks every file under the owned root, rejects reparse points,
  decodes strictly as UTF-8, and counts raw and escaped occurrences (`0085-0092`). The scan runs **after**
  stdout/stderr are written, so those are covered too. The escaped form computed at `0063`
  (backslash then quote) is byte-identical to `JSON.stringify(credential).slice(1,-1)` for the printable-ASCII
  credential range the consumer admits — I checked the two orderings, including a credential containing both
  `\` and `"`.
- Post-run integrity: the external pins are re-hashed after the run and any difference (including mtime) is
  reported (`0160`, `source_changes`), the observed TCP peers of the owned Node process are recorded
  (`0130-0134`), and the proof file states plainly that owner-only ACL and full-platform security are **not**
  proven (`0163`).

### 1.6 Coherence between the two sources

`offline-controls.mjs` asserts exactly what the current implementation does; I re-derived each assertion
against the consumer lines and found no drift: the request-payload/mode/cap assertions (`0145-0157`), the
timeout-bound assertions (`0226-0230`), the completion negative controls (`0246-0342`), the schema
fail-closed controls (`0344-0489`), the marker property (`0172-0176`, `0199-0224`), and the three
response-path controls (`0517-0620`). The manifest (`view 02`) pins consumer/fixed-data/controls and not
itself, and every pin in it matches the byte counts and digests carried in `index.json` and in the
Root-side external pin list — I compared all three views.

## 2. Residual operational risks I found in the current source (none blocking)

Each item is a concrete trigger with a minimal fix. None of them is a platform-security claim, and none of
them requires a new framework or an owner policy decision.

**F1 — Failure report can be lost when the success path already wrote the same filenames
(non-blocking).**
`writeArtifact` opens with `wx` (`review-consumer.mjs:0426`). The success path writes `timings.json`
(`0677`) and `final-report.json` (`0678`) before the only remaining operation, `process.stdout.write`
(`0686`). If that write fails, the catch path (`0688`) calls `writeFailure`, which tries to create the same
two names again (`0569`, `0573`) and hits `EEXIST`; the inner catch then emits only
`FAIL_ARTIFACT_WRITE` (`0693-0695`) and the specific `stage`/`code` is lost.
*Trigger:* stdout/stderr write error after the success artifacts exist. *Impact:* diagnostic loss only — still
fail-closed, no credential exposure. *Minimal fix:* in `writeFailure`, write `failure-report.json` /
`failure-timings.json`, or open the existing names with `"r+"`/truncate instead of `"wx"`.

**F2 — The two-call cap is structural, not counter-enforced (non-blocking).**
`MAX_SEQUENTIAL_CALLS = 2` (`0013`) is exported and reported (`0607`) but never compared against a live
counter; the cap is currently guaranteed by the absence of any loop and by the exactly two `performRequest`
call sites (`0621`, `0651`) with the stage-2 gate (`0636-0641`).
*Trigger:* a later edit that introduces a retry loop would silently exceed the two-request budget while
`route.json` still advertised `maxSequentialCalls: 2`. *Minimal fix:* keep a counter and fail
`SEQUENTIAL_CALL_CAP_EXCEEDED` before a third call.

**F3 — Driver cleanup depends on CIM exposing the child's `ExecutablePath` (non-blocking, layered).**
The driver's watchdog (`run-...py:0080`) and its `finally` (`0102`) call
`[IO.Path]::GetFullPath($q.ExecutablePath)`. If CIM ever returns a null `ExecutablePath` for the child, that
call throws, the inline kill is skipped, and the driver's `finally` aborts before `Dispose`/`Array.Clear`
(`0104`). The Python parent's independent cleanup (`0156-0158` → `0020-0022`) is the backstop and matches
identity from CIM itself (pid + exe + birth UTC), so the child is still terminated exactly.
*Trigger:* CIM cannot report the child's exe path. *Impact:* one extra orphan window in the driver, closed by
the Root-side path. *Minimal fix:* null-guard `ExecutablePath` before `GetFullPath` in the driver.

**F4 — The pinned `pwsh` must be able to load the DPAPI assembly (fail-closed, unverifiable here).**
`run-...py:0058` uses `Add-Type -AssemblyName System.Security.Cryptography.ProtectedData`. I could not
execute anything, so I cannot confirm the assembly loads in the pinned PowerShell 7 runtime.
*Trigger:* assembly load failure → the driver's catch returns exit 91 (`0096-0098`) and the run stops.
*Impact:* none on confidentiality — the statement precedes the DPAPI unprotect, so no key is ever
materialized. *Minimal fix:* Root may confirm the assembly loads, or catch the specific load error and
report it distinctly before admitting the runtime.

## 3. Data-handling qualification the Root must resolve (not a source defect)

**Q1 — The diagnostic data is real-case-derived, not synthetic, and it currently sits on a repo evidence path.**
The closure scope and the root adjudication both describe the diagnostic as "synthetic" and state "All data
synthetic/no rawKeyartifact" (`index.json` `scope`/`requirements`; view 05 line 22-24). The packet's own
provenance contradicts that for the data: `fixed-data.json` is a byte-exact copy of the approved input
(sha256 `e386b2e0…`, 17 427 bytes — `view 04` lines 2-6) whose provenance names a **real Native session
transcript** (`view 04` lines 7-11), a **real physical draft v3**
`…\工作区\任务\T-20261101152340-fc8c\草稿\辩护意见-v3.md` (5 394 bytes, `view 04` lines 12-18) and
**eight real read receipts** (`view 04` lines 19-28). The consumer is required to consume exactly that draft
(`original_draft`) and those receipts (`evidence_receipts`).
*Trigger:* the byte-exact copy is committed with the T18 evidence tree, which the project's evidence
convention places under `docs\plan\evidence\T<n>\` and commits with the branch. That would put real case
content into version control, against the standing project rule "仓库不放真实案卷" and against the "synthetic"
label the closure carries.
*Minimal fix (Root, before any commit):* keep `fixed-data.json` — and any artifact that embeds the draft or
receipt text — out of version control (keep the pilot evidence tree outside the repo, or exclude it
branch-locally), and describe the run accurately in the closure note as "real-case-derived read receipts +
physical draft v3 consumed in isolation", not "synthetic data". This changes no product/test/schema/SDK/source
file and requires no new framework.

## 4. Explicit limits of this PASS (must accompany the verdict)

- **Runtime limit.** Nothing was executed. No Node, Python, parser, test, `--check`, build, preparer, probe,
  HTTP, model, GUI, app, Key or runtime step was run by this review, and no prior green result was accepted
  as a substitute for source audit. Every statement above is derived from reading the pinned bytes in this
  packet. The offline controls were run once on the changed source by another party per the packet's scope
  statement; I audited their source and confirmed assertion-by-assertion agreement with the implementation,
  but I did not re-run them.
- **Semantic limit.** `PASS` says nothing about whether the two model stages will produce useful findings.
  The validators authenticate anchors only (`0269`, `0300-0313`); they cannot establish that the draft
  actually treats a candidate correctly. Every finding still requires Root's manual judgment, and
  "no findings" is explicitly not a quality pass (`0352-0353`). The consumer is a capability diagnostic, not
  the Native workflow and not a repair path.
- **Private-ACL / hostile-local-actor limit.** The outputs parent is user-owned but shared-writable with
  `CodexSandboxUsers` (`view 07`), and the fresh output root inherits that. Root verifies that the owned root
  and its ancestors are not reparse points (`run-...py:0046`) and re-pins all seven files before the Key and
  after the run (`0035`, `0160`), but a concurrent writer with access to that tree could in principle replace
  the consumer between the pre-Key pin check and Node's read, or tamper with artifacts. Owner-only privacy
  and platform security are **not** proven and **not** claimed here; the admission record says so explicitly
  (`admit-...py:0034`). No owner-only ACL framework is demanded by this review.
- **Production limit.** This is a diagnostic prototype: hard-coded single route, single model, two-call cap,
  900 s budget, no retry, no fallback, no health probe, no GUI/app/OCR/Retainer/local HTTP/SSH/GPU, no
  schema/SDK/product integration, `Packaging: HOLD`. It is not production code and is not a security boundary
  for the platform.
- **Unverifiable-by-packet items.** `fixed-data.json` is not among the frozen views (only its pin is), so the
  consumer's expected top-level shape (`format`, `evidence`, `draft{content,title,version}`,
  `visible_selfcheck`, `coverage`) could not be checked against the pinned bytes here. If the pinned file's
  field names differ, the run fails closed at `0074-0108` with `FIXED_DATA_SCHEMA_INVALID` /
  `EVIDENCE_RECEIPTS_MISSING` **before any request**, so this is a fail-closed availability question, not a
  data-integrity or confidentiality one. Root may confirm the five top-level keys read-only before admission.
  The colocated `source-manifest.json` is likewise not self-authenticating by construction; its authenticity
  rests entirely on the Root-side external pin, as the adjudication already records.

## 5. What this PASS does and does not authorize

It supports Root proceeding to: re-audit the launcher as required, then admit and execute the single
isolated two-call diagnostic under the existing 900 s Root watchdog and the exact-identity cleanup rules,
with the post-run pin re-check and the owned-artifact raw+escaped credential scan intact.

It does not authorize: model/business/legal conclusions, packaging or product integration, any repository
commit of the pilot's real-case-derived data (see Q1), owner-only ACL or platform-security claims, or any
relaxation of the trust boundary stated in the closure scope.

**Verdict: PASS (SOURCE-ONLY) — with F1-F4 as non-blocking qualifications and Q1 as a Root-side data-handling
action to settle before any commit.**
