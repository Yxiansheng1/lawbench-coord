# T33 Host-compatible native entry

**PREPARATION ONLY. NO RUN. PACKAGING HOLD.**

This directory contains a two-file, two-phase native entry. It is closely
based on the frozen 720-line source whose SHA-256 was
`a43e46b20edc43094f7ffbf27523b56624b08c7219ea4fda67d2e0d675b77ff8`.
That earlier HTTP slice passed real authentication, case open, scan, copy and
list requests. This job does not repeat that run and does not claim GUI,
actual Host/RPC, OCR, packaging or T33 acceptance.

## Preparation

After root review only, create a fresh run with:

```powershell
python -B -X utf8 "D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py" --prepare --root "D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs\T33-host-YYYYMMDD-HHMMSS"
```

Replace `YYYYMMDD-HHMMSS` with a fresh timestamp. The target must not already
exist. `--prepare` creates one new direct child of `runs`, validates every
path component for reparse points, and refuses replacement. It does not import
or instantiate `lawbench`.

Expected layout:

```text
runs\T33-host-YYYYMMDD-HHMMSS\
  prepared.json
  case\                             # empty before service use
  input\ready\转账截图.jpg           # exact 47,379-byte fixture
  private\home\
  private\appdata\
    settings.json                   # four dead 127 URLs; external disabled
    daily-case.json                 # {"root":"<case>"} Host marker only
  private\system\
  private\temp\
```

`private\appdata\临时\粘贴` is the exact future Host paste directory. It is
recorded in `prepared.json` but is not created by prepare. The marker is not a
service registration and contains no `case_id`, session, history or rollout.
The manifest records the canonical root/private paths and the fixture,
settings, marker, source-code and entry identities. It contains no credential.

## Future Host service call

The future Host supervisor must invoke `--serve --root <the same root>` with:

```text
LB_PORT=<assigned decimal IPv4 loopback port, 1..65535>
LB_TOKEN=<assigned lower-case 64-hex private HTTP token>
LB_APPDATA=<exact same root>\private\appdata
```

The entry reads those values before scrubbing inherited `LB_*` and other
secret-shaped environment variables. It reuses, rather than recreates, the
prepared private directories. The token stays only in process memory and is
never written to `started.json`, `ready.json`, `final-metadata.json`, logs or
errors.

The native app uses the assigned token and port directly. It requires native
contract version 1.6 and binds only IPv4 `127.0.0.1`. Its default lifespan is
off: OCR is not started, OCR resume cannot create a worker while the native
queue has no threads, and Retainer is neither started nor closed. The native
constructor still has side effects: it initializes settings/case stores,
creates or migrates appdata files, ensures capsules, prepares native Materials
and logs, and may use one AnyIO framework worker for an endpoint.

Only these native routes are admitted:

```text
GET  /health
GET  /api/case/recent
GET  /api/settings
GET  /api/capsules
GET  /api/materials
POST /api/case/open
POST /api/materials/scan
POST /api/materials/import
```

`caseOpen.path` must equal the prepared `case` path. Material imports are
limited to reparse-free paths under `input\ready` or a direct regular file in
`private\appdata\临时\粘贴` named
`粘贴-<14 digits>-<lower-case UUID>.(png|jpg)`, between 1 byte and 20 MiB.
Native Materials performs the actual copy. Host owns deletion of its temporary
paste file. No synthetic success response, proxy, mock product route, settings
write, task/model/OCR/pipeline/connection-test/remove/relocate route, forward
listener or WebSocket is added.

The default and maximum lifetime are both 600 seconds. `started.json` is
created exclusively before product import. A second invocation against the
same root refuses because the one-shot marker, readiness/final artifacts or
request log exists. There is no restart, retry, daemon, subprocess supervisor
or late-start fallback. Actual assigned `LB_PORT` and `LB_TOKEN` are mandatory;
there is no port-zero or fixed-token fallback.

## Bounded root admission

This short admission is only for a future root reviewer validating the new
handshake and path guards against a **freshly prepared run**. Do not reuse a
run that has already served. Use an available random loopback port and a
synthetic lower-case 64-hex token generated for this fake admission:

```powershell
$env:LB_PORT = "<assigned random loopback port>"
$env:LB_TOKEN = "<synthetic lower-case 64-hex token>"
$env:LB_APPDATA = "<fresh prepared root>\private\appdata"
python -B -X utf8 "D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py" --serve --root "<fresh prepared root>" --seconds 5
```

This job does not execute that admission. Success would validate only the
finite native HTTP handshake/path boundary, not GUI, actual Host/RPC, model,
OCR, packaging or production readiness. Do not put a real model key,
credential, case, `.env.local`, Keyring material, 6000D/395 target, model or
paid Search into the run.

## Shutdown and evidence

Normal shutdown sets the owned Uvicorn instance to exit, waits for its task,
checks the listener is closed, closes the owned Net client and product log,
restores process guards, then closes the pre-created asyncio loop and writes
`loop-closed.json`. `final-metadata.json` records real request metadata,
source-before/after identities, credential/guard counts, lifecycle flags and
actual cleanup results. Request logs contain method, fixed route path, status,
disposition and elapsed milliseconds only; they do not contain bodies, image
bytes, material names, query values or user text.

Host forced termination can prevent Python cleanup code and these final files
from being written. A future root supervisor must check PID, process start
time, executable identity and that the assigned port is closed; it must not
claim Python cleanup ran merely because a process disappeared.

## Remaining work

A separate, independently reviewed GUI launcher is still required. It must use
this exact prepared appdata as `LOCALAPPDATA`, own the Host service lifecycle,
and perform real Host/RPC/GUI validation. Packaging remains on hold.
