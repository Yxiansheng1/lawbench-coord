## 1. Scope and frozen inputs

Prepared only the narrowed T33 Host-compatible native entry. No GUI launcher,
service registration, packaging, model, Search, 6000D, 395, real case, Key,
`.env.local` or Keyring action was included.

- Formal order:
  `D:\Lawbeach\lawbench-coord\T33HostEntryOrder-20261025-094816.md`
- Frozen source:
  `D:\Lawbeach\lawbench-coord\ORCH-T33HostInput-20261025-092948\server-before.py`
- Frozen source SHA-256:
  `a43e46b20edc43094f7ffbf27523b56624b08c7219ea4fda67d2e0d675b77ff8`
- Host facts:
  `D:\Lawbeach\lawbench-coord\ORCH-T33HostInput-20261025-092948\host-facts.md`
- Worktree HEAD:
  `dc56a93be4b07dbe7a48863e3135351659817fb5`
- Fixture identity: 47,379 bytes,
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`

The previously passed frozen HTTP slice was reused as design/evidence only; it
was not rerun.

## 2. Delivered files and cumulative change map

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py`
  - 45,845 bytes, 1,310 lines
  - SHA-256:
    `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\README.md`
  - 6,297 bytes, 139 lines
  - SHA-256:
    `f3f3404ac289dfc5cad338301aebe622287e398f29f9157a1ce921c006dfb5a0`

Cumulative source map against the frozen 720-line entry:
822 insertions, 232 deletions, net 1,310 lines. The changes are confined to:
two-phase CLI and private manifest; canonical/reparse identity checks; Host
port/token/appdata admission; the prior guard wiring; the same eight-route
firewall with the exact Host paste source; fixed-loopback Uvicorn startup;
one-shot and bounded lifecycle evidence; and honest prepare/no-run README.
No contract, product, E50, guard source, PDF, GUI or launcher file was changed.

## 3. Frozen behavior implemented

`--prepare` creates a unique `runs\T33-host-YYYYMMDD-HHMMSS` direct child,
private home/appdata/system/temp, an initially empty case, the exact fixture in
`input\ready`, fake four-address settings with external LLM off, and the Host
shape `daily-case.json` (`{"root":"<case>"}`). It records canonical path,
fixture, settings, marker, source and intended
`private\appdata\临时\粘贴` identities in `prepared.json`; it does not import
lawbench, create service identity/history/session data, or create the paste
directory.

`--serve` requires that manifest, unchanged source/fixture/settings/marker
identities, an unused run, decimal `LB_PORT` 1..65535, lower-case 64-hex
`LB_TOKEN`, and exact canonical `LB_APPDATA`. It creates `started.json` with
exclusive create before product import, uses the assigned token/port in the
native Config and Uvicorn, binds only `127.0.0.1`, and writes readiness only
after actual start. The readiness/final/error records contain no token.

Native B `create_app`, contract 1.6, auth, Gate, Registry, Materials and skills
remain the implementation. The firewall admits only the same eight routes and
binds `case_id` from native `caseOpen` success. Imports are limited to
reparse-free paths under prepared `input\ready` or direct regular Host-named
paste files in the prepared appdata paste directory, at most 20 MiB. Product
lifespan stays off; OCR is not started and Retainer is neither started nor
closed. Outbound sockets, subprocesses, non-AnyIO threads, Office discovery/
conversion, Keyring and external model policy are guarded.

## 4. Verification performed, with NO RUN

**NO RUN. Preparation was not executed. No HTTP, native app, GUI, Host/RPC,
OCR, model, network, dependency, Python or Node job was run.**

Actual successful commands used native
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
with `login=false`. Key read-only checks were:

```text
Get-Content -LiteralPath <formal order and the two exact input files> -Raw
git rev-parse HEAD
git status --short --branch --ignore-submodules=all
git diff --cached --name-only --ignore-submodules=all
Get-FileHash -LiteralPath <frozen source, fixture, new server.py, README.md>
git diff --no-index --numstat -- <frozen server.py> <new server.py>
rg -n <routes, token/port fallback, product imports, write/delete modes>
Get-Content -LiteralPath <new server.py and README.md>
```

Static results: exact expected HEAD and frozen-source hash; exact fixture size/
hash; no `FAKE_TOKEN`, `port=0`, extra API, `/__stop`, WebSocket, process launch,
settings/task/model/OCR core route, or overwrite/delete write path; no trailing
whitespace diagnostics; exactly eight admitted routes; product imports occur
only inside serve, after the exclusive started marker and event-loop creation.
The unmodified frozen slice remains the only previously observed HTTP evidence.

One procedural deviation must be recorded: two read-only `rg` submissions were
mistakenly sent with `shell=bash`. The environment rejected both before command
execution with `Bash/E_ACCESS_DENIED`; no filesystem, Git, process or network
state changed. All effective commands used the required native `pwsh`.

`git status` including submodules was blocked read-only by:
`cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied`.
The ignore-submodules status was recorded; no lock, ACL, approval or sandbox
change was attempted. The pre-existing dirty worktree was preserved.

## 5. Runtime cleanup design and actual job cleanup

The serve path defines one bounded 1..600 second asyncio deadline, exclusive
one-shot reuse refusal, native request metadata capture, source-before/after
identity comparison, and normal shutdown of the owned Uvicorn task/listener,
Net client and product log. It restores guards, closes the pre-created loop,
and writes `loop-closed.json` separately. A cancellation is recorded as
failure evidence. No auto-restart, watchdog, subprocess or daemon exists.

No runtime cleanup result is claimed because no serve was executed. Host forced
termination can prevent Python cleanup and final metadata; README requires a
future root supervisor to check PID, process start, executable identity and
closed assigned port instead of claiming Python cleanup ran.

This job created only the two files above plus this formal return. It created
no `runs`, private directories, copied fixture, process, thread, port, request
log or credential artifact. Git remained read-only: no add, commit, rebase,
stash, reset, checkout, clean, push, lock or permission action occurred.

## 6. Unresolved dependencies and HOLD

- Root review is required before the documented prepare command may run.
- The unexecuted finite admission still needs root execution with a freshly
  prepared run and explicitly fake Host environment.
- A separate independently reviewed GUI launcher must use the exact prepared
  appdata as `LOCALAPPDATA`, own service supervision and perform real Host/RPC/
  GUI validation.
- Actual forced-termination supervision still requires external PID/start/
  executable and port-closed checks.
- This is preparation, not HTTP/Host/GUI/OCR/model/package/T33 acceptance.
- Packaging is HOLD. Git integration and commits remain outside this runner's
  authorization.

STOP.
