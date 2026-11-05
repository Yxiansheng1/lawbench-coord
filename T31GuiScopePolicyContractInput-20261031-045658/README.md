# T31 GUI scope policy — source-only handoff

Status: **SOURCE_ONLY / NOT_RUN**. This directory contains a reusable pure-ASGI
policy subclass; it is not a server, GUI adapter, forwarder, or T31 acceptance
result.

## Integration

Call `make_scope_firewall(BaseFirewall, source_root=..., source_sha_by_name=...)`.
`BaseFirewall` remains the canonical immutable Firewall supplied by the service
adapter. The returned class accepts the same constructor keywords and preserves
the inherited forwarding, authentication, 512 KiB capture, recording and
read-only behavior.

Before any GUI Send, the adapter must obtain three actual material IDs from the
native index and call:

```python
BoundFirewall.bind_materials([
    {"material_id": "<native-id>", "name": "<source.txt>", "sha256": "<lowercase-sha256>"},
    # Exactly three rows total.
])
```

The method accepts `id` as an alias for `material_id`, rejects duplicate facts,
requires names and hashes to equal the three factory pins, and can run only
once. It never creates IDs. The native `GET /api/materials` response is left
untouched; observed ID/name/SHA metadata is exposed for Root. A true
`material_response_verified` requires that observed facts equal the three bound
facts.

## Enforced faces

- Import: two attempts maximum; exact case, `[source_root]`, null target,
  `unzip=false`, and `mode="ref"`.
- Scope: two identical prepare/release attempts maximum; real
  `session-<UUIDv4>`, real request UUIDv4, exactly two distinct bound IDs, and
  changed session/request/ID tuples are refused.
- Task begin: two identical attempts maximum; exact prepared session/request and
  private case path; only a native task ID in an actual success response is
  recorded.
- Context/progress/end: bound task only, exact dossier fields, eight attempts
  maximum per route, finite nonnegative counters. Progress text is checked but
  never retained.
- `/core/tool`, task selection writes, and other unlisted writes remain denied.
  Existing GET/case-open policy is inherited unchanged.

Response validation can only expose post-send violations; it never rewrites a
native response or turns an unexpected result into success. Per-request
metadata uses `ContextVar`, while shared reservation changes use the inherited
`RLock`.

## Verification boundary

No Python, AST, import, syntax, contract, unit, integration, HTTP, model, GUI or
product command was run from this runtime. The bounded work used exactly four
shell calls: the order read and input read succeeded, one source line-count
inspection succeeded, and the final metadata/hash command exited 1 with a
PowerShell `ParserError` caused by an invalid pipeline expression. That failed
command did not write files; it was not retried. No full T31/project/GUI
acceptance is claimed.

Root commands still required after full source review include a syntax check,
import-time I/O inspection, concurrency tests for the two-request limits,
changed-tuple/conflict tests, native-failure cleanup tests, and an end-to-end
native run proving selection of two, three bound materials, real request/session
IDs, TaskStore persistence and unchanged native responses. These checks are
**NOT_RUN**, not PASS.

## Still outside this slice

Full current batch, a second import adding zero items, real native IDs and
hashes, TaskStore evidence, JSONL/event evidence, GUI/OS behavior, model
transport, material deletion/move, skill selection, and full T31 acceptance are
all **NOT_RUN**.
