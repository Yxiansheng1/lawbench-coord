# C-line independent source review - T18 schema-keyword compat V7

Verdict: AMEND

## Basis

Reviewed only the C_views listed in the supplied index, in full: consumer focus 660-830,
offline controls 615-665 and 850-1005, both source-record JSONs, the complete V7 root PS
(literal and resolved-static), the launcher static-parse record, the source manifest, both
change inverses, and the recorded .NET/CIM birth-precision diagnosis. Static reading only;
no execution, no other files, no hash re-derivation.

## Holds - consumer schema keyword compat

- The consumer delta is exactly one property removal: `uniqueItems: true` is gone from the
  `refs` schema built at review-consumer.mjs 0675-0685. No keyword was added or reshaped.
- Branch construction (0709-0738) keeps enum/minItems/maxItems intact; when no eligible
  reference targets exist, `items` is omitted instead of emitting an empty enum
  (0976-0999), so the response format stays well formed.
- Local validation is unchanged and still rejects duplicate refs: `REF_DUPLICATE` at 0796,
  with its negative control retained at 0625-0634. Typed family, unknown-id, count, merge,
  UTF-16 and positive-without-ref assertions hold (0615-0665, 0850-0953).
- Therefore this is a schema-side capability retreat, not a validator waiver: a provider may
  now emit duplicate refs and the consumer will still fail them.

## Amend item A1 - owned child not cleaned up on the new fail-closed path

- V7 root PS 0031-0033 captures the child CIM identity and birth before the key write at
  0036, and uses the same CIM birth for the inner watchdog (0040) and the outer readback
  (0034 start.json). Exact string equality is kept; no time window or coarser match.
- Defect line: 0032 throws when the CIM identity is null or mismatched, so 0033 never sets
  `$birth`; 0061 then requires `$null -ne $birth` before killing and 0065 only disposes.
- Trigger: `Get-CimInstance` returns `$null`, throws, or cannot resolve `ExecutablePath`
  immediately after `Start()` - provider visibility race or provider error, the exact
  failure path the new hunk introduces.
- Effect: the owned Node child is not killed by the driver and its exit is not reaped; only
  stdin EOF after disposal/exit ends it. The key has not been written yet on this path, so
  no credential exposure, but the "owned child is always cleaned up" property fails here.
- Same root cause on the watchdog path: the kill at 0040 needs a second successful CIM
  re-query. If the provider keeps failing, 0041 throws and 0063 skips the kill although the
  key was already delivered at 0036, so a live consumer can outrun the declared failure.
- Minimal fix: in `finally`, when `$null -ne $child -and -not $child.HasExited`, call
  `$child.Kill()` followed by `$child.WaitForExit(5000)` independently of `$birth`. The
  Process handle is authoritative and cannot hit a reused PID; keep the CIM exe+birth
  equality checks for PID-based cross-process readback, and optionally bound-retry the 0031
  capture briefly before throwing.

## Holds - root ownership, keygate, aliases

- Key ordering is correct: DPAPI unprotect, ASCII validation, then start, CIM ownership
  check, birth capture, start.json, and only then the anonymous stdin credential write.
  No argv/env/file transport is introduced; redaction and the UTF-8 artifact scan are intact.
- Driver inverse shows only aliases/purpose/verdict/path renames plus the three-line PS
  replacement. Watchdog budget, scan scope, reparse rejection and failure JSON are unchanged.
- Launcher: the unsubstituted-template parse failure is retained, and the corrected
  quoted-dummy-path static parse reports zero errors without execution, Key or model use.
- Manifest carries five keys (algorithm plus four sha256-pinned files) matching the pinned
  paths; the original wrong-algorithm `files`-array manifest was rejected before launch.

## Limits

- Provider acceptance beyond `uniqueItems` is unproven; other keyword, grammar, backend and
  request-compatibility behaviour remains unverified.
- Runtime, CIM availability, watchdog kill, natural exit and cleanup are static-only here.
- ACL, hostile-local-actor, Native, production, business, semantic and security admission
  are not established; semantic criteria and prior frozen guard findings are untouched.
- The byte-hold claim for unchanged outer root code is accepted from the supplied inverse
  and record, not independently re-derived.
