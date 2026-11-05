# T34 Settings Save GUI source bundle

Status: `SOURCE_ONLY_NOT_RUN`. This is not a PASS.

## Exact scope

The authorized runtime scope is one original Settings-page save: navigate to
Settings, change the synthetic external `context_window` from `32768` to
`65536`, and click Save once. The expected path is genuine
`Host.putSettings` -> B `PUT /api/settings` -> native Settings SET. The full
static expected object is supplied by `expected_saved_settings()`; `max_tokens`
remains `16384`, and the model, budget, and task route are unchanged.

The firewall admits exactly one canonical settings PUT. Missing or changed
fields, credential fields, alternate servers/model/URLs/scopes, type drift, a
query string, or another method/path are denied and do not consume the PUT
budget. A second exact PUT is denied. A legitimate settings GET remains
read-only and is not treated as a write.

## Boundaries

No actual Key, privacy consent, task-route switch, Send, model call, or
credential store operation is part of this scenario. The human is not
notified, no automatic abandon or discard is allowed, and all-T34 is not
claimed. The task route remains the current local route before and after the
allowed UI action.

`prepare.ps1`, `entry.py`, `start.ps1`, and `stop.ps1` contain only
self-relocation, the approved synthetic settings guard, and the new
`entry.py` metadata pin. The five `.mjs` helpers remain byte-identical to the
accepted baseline. Existing auth, outbound, phase, case, body-size, response
capture, cleanup, one-owned-root, current-25, client, and SDK protections
remain otherwise unchanged. No build is required.

## Execution status

The author ran no prepare, admission, start, GUI, stop, Node, Python, parser,
test, build, HTTP, model, or credential operation. `firewall-finite.py` is
source only. Root owns the static AST finite run, one fresh actual UI Save, and
cleanup; actual Save and all runtime claims are `NOT RUN`.
