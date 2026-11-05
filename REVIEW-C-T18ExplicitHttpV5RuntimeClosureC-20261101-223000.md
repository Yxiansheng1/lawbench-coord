Verdict: AMEND

Concrete findings

1. Frozen guard: UDP deny bypass
   Location: 04-network-guard.cjs.txt:164-177
   Trigger: create a dgram socket, call `socket.connect(port, "203.0.113.1")`, then call `socket.send(buffer)` with no address argument. `createSocket` wraps only `send`; the unpatched `connect` establishes the denied remote, and the no-address `send` has `host === undefined`, so it is allowed.
   Impact: lower-net/network denial can be bypassed for UDP.
   Minimal fix: wrap `socket.connect` with the same destination check, and fail closed on an unaddressed `send` unless the socket's connected remote is loopback.

2. Frozen guard: custom DNS lookup deny bypass
   Location: 04-network-guard.cjs.txt:88-105 and 136-150
   Trigger: call `http.request({ host: "127.0.0.1", port: 80, lookup: (_host, _opts, cb) => cb(null, "203.0.113.1", 4) })`, or use the same `lookup` option with `net.connect`. The guard validates only the advertised loopback host; the custom lookup supplies the denied connect address later.
   Impact: both the HTTP wrapper and lower socket wrapper permit a connection whose resolved destination is non-loopback.
   Minimal fix: deny caller-supplied `lookup` functions, or wrap/validate every resolved address and fail closed on a non-loopback result.

Focused source disposition

- `performRequest` (00-review-consumer.mjs.txt:1009-1227): no concrete current bug found. The reviewed path constructs the body once, sends it with the fixed method/headers/content length, sets `agent: false`, uses the absolute per-call abort signal, resolves exactly once, destroys owned request/response/socket objects, and does not add retry, redirect, fallback, or SDK/global-agent behavior.
- HTTP memory/lifecycle controls (01-offline-controls.mjs.txt:898-1173): the shown controls cover exact request shape, complete and partial response termination, error classification, abort, overflow, and pre-expired deadline. This is source review only; those controls were not rerun.
- Root outer driver (02...py.txt:24-181): admission is consumed before DPAPI access; the environment is allowlisted with proxy and Node preload/options removed; the child receives the key only through dedicated anonymous stdin; process ownership is checked by PID, executable, and UTC birth time; the outer watchdog and final cleanup target exact observed identities. No concrete current bug found in this reviewed logic.
- Embedded PowerShell driver (02...py.txt:54-116): `ROOT_START` gates startup, the credential length/alphabet is validated, stdio is forced to BOM-free UTF-8, stdout/stderr are redacted, owned UTF-8 artifacts are scanned for raw and JSON-escaped credential forms, and failures take nonzero/error exits.
- Admitter (03...py.txt:9-35): it checks the admission inputs before creating the one-use admission, checks eight external paths for uniqueness and reparse status, records the driver hash, and does not read the credential.
- Static parse view (05...json.txt): it is explicitly qualified reuse of the V4/V2 PowerShell-literal parse. It does not prove the new outer Python driver or a new runtime.

Limits

- Source-only review. No runtime, model call, HTTP probe, cancellation behavior, ACL/hostile-local-actor resistance, or semantic/business/legal result is established.
- The unchanged pure protocol and protocol helpers outside the focused transport window were not reopened; no full consumer/protocol review is claimed.
- The accepted/status labels in the closure artifacts were treated as metadata, not independent proof. The completed job statuses and accepted booleans are mutable inputs rather than new executions.
- The Root credential scan intentionally skips non-UTF-8 files (02...py.txt:102); this is not a full binary or memory-erasure guarantee.
- The post-run source pin comparison reports drift (02...py.txt:171-175) but does not itself make a successful child exit fail; protection against a concurrent source writer therefore remains outside the proven local-actor boundary.
- Packaging and production/Native/R readiness remain HOLD.
