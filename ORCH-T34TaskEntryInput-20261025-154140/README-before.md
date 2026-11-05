# T33 Native Read-GET preparation

Prepared 2026-10-25. Author-run status: **NO RUN**.

`server.py` is a narrow copy of the accepted Host entry. The accepted original
remains unchanged in `T33/HostEntry-20261025-094816/server.py`.

## Start contract

1. Run `server.py --prepare --root <run-root>` first. `<run-root>` must be a
   new direct child of this entry's `runs` directory.
2. The actual Host assigns `LB_PORT`, `LB_TOKEN`, and `LB_APPDATA`. Serve with
   the same root. `LB_APPDATA` must equal the prepared private appdata path.
3. Use `--serve --root <run-root> --seconds 15..60` for a finite root-review
   call. The existing 1..600 second parser and cleanup bounds are unchanged.

The original CLI, source identity checks, default lifespan-off behavior, socket
and Keyring guards, Net deny, no-OCR/no-Retainer startup, no-forward-listener,
one-shot runtime artifacts, token memory handling, and cleanup paths are kept.

## Exact routes

GET routes:

- `/health`
- `/api/case/recent`
- `/api/settings`
- `/api/capsules`
- `/api/materials`
- `/api/task/current`
- `/api/tasks`
- `/api/outputs`
- `/api/ocr/jobs`
- `/api/wiki/suggestions`
- `/api/wiki/review`

The only POST route is `/api/case/open`, restricted to the prepared case path.
There are exactly 11 GET and 1 POST method/path pairs. Materials scan/import,
model/OCR POST, task creation, core/pipeline, PUT, export/save/remove/relocate,
and slow-control routes are denied.

## Request gates

Materials, tasks, outputs, OCR jobs, wiki suggestions, and wiki review require
exactly one nonempty `case_id` query value equal to the case ID returned by an
actual prior native `/api/case/open` 200. Missing, duplicate, extra, wrong, or
blank query data fails closed; `id`, `accept`, and request-body substitution do
not bypass the query gate.

`/api/task/current` requires exactly one nonempty opaque `session_id` query
value and a bound native case. The private `cases.json` must freshly contain
exactly one entry matching that case ID and the prepared case/root.

`/api/task/current` and `/api/tasks` also require the prepared
`<case>/工作区/任务` directory to be absent or empty. The check is repeated per
request without reparse traversal; any child entry is rejected before native
TaskStore invocation. This prevents GET from entering stale-task repair or
returning a fabricated empty result.

## Side effects and review

Admitted writes are limited to native `case/open`, its private SQLite/registry
updates, and private logs/runtime evidence. This is not a claim that serving is
globally zero-write.

The original entries remain intact. This preparation was not executed and is
not GUI, Host/RPC, OCR, model, packaging, or T33 acceptance. Root must review
the cumulative diff and make all invocation decisions before any run.
