# C-line T18 V7 handle-closure review

Verdict: PASS

Scope: bounded independent source review of the supplied V7 current root driver,
its current PowerShell lifecycle views, the change inverses, the static-parse
record, and the prior C review. This is not a broader product, runtime,
semantic, provider, or security acceptance.

## Closure finding

- No concrete current blocker or new reachable defect was found in the bounded
  handle-closure change.
- Current root PS lines 0030-0033 start the child, set `childStarted`, retain
  `child.SafeHandle` immediately, and then perform strict CIM PID/exe/parent
  checks before the key is supplied.
- Current root PS line 0034 records the CIM UTC birth time before the credential
  write at line 0037; the supplied outer-driver inverse shows PID/birth-exact
  identity comparisons retained for the outer readback.
- The watchdog at lines 0039-0042 now kills and waits on the owned `Process`
  object, independent of CIM availability or a later birth lookup.
- The prior A1 trigger, CIM returning null/throwing or failing to resolve
  `ExecutablePath` after `Start()`, reaches the finally block at lines 0060-0073.
  With `childStarted=true` and a live child, lines 0064-0066 kill and wait on
  the process handle even though `$birth` was never assigned.
- The nested finally preserves child disposal and clearing of the credential byte
  array plus secret/escaped references when cleanup itself throws.
- Killing by the retained child process object does not select by arbitrary PID,
  enumerate a process tree, or broaden global process policy.
- No key is introduced into argv, environment, files, logs, or review text.
  The supplied inverse supports that aliases, paths, watchdog budget, scan scope,
  reparse rejection, and failure JSON are otherwise held.

## Limits

- Source-only static review. The static-parse record has zero parse errors but
  does not prove watchdog, kill, wait, natural-exit, or child-reap behavior at
  runtime.
- Handle assurance is limited to retention through the owned
  `System.Diagnostics.Process`/`SafeHandle` object and its scoped cleanup. It
  does not prove OS grant success, forced-kill success, or absence of all
  hostile-local races.
- CIM assurance remains limited to the supplied strict PID/exe/parent/UTC-birth
  ordering and outer PID checks. CIM provider availability itself is not
  established.
- Private ACL, credential-memory erasure beyond the byte-array clear, DPAPI
  deployment, hostile-local-actor resistance, and full platform security are
  not proven.
- The record claims unchanged remaining root code from the supplied inverse;
  this review did not execute, parse, hash, or re-derive those files.
- Runtime, provider compatibility, model behavior, Native/product/business use,
  semantic acceptance, frozen-guard findings, and packaging remained outside
  this review and are not closed by this PASS.
