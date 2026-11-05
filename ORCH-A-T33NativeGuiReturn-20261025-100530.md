# ORCH-A T33 Native GUI Return - 2026-10-25 10:05:30

Status: `PREPARED_FOR_ROOT_REVIEW`, cumulative launcher files complete.
`PREPARE_NOT_RUN`, `GUI_NOT_RUN`, `PACKAGING_HOLD`, `NO_GIT_WRITE`.

## 1. Scope and accepted inputs

The only task used was the formal execution order at
`D:\Lawbeach\lawbench-coord\T33NativeGuiOrder-20261025-100530.md`. The four
required input files were read individually with `-LiteralPath`; their
SHA-256 values were:

```text
f3f3404ac289dfc5cad338301aebe622287e398f29f9157a1ce921c006dfb5a0  native-entry-readme.md
16f4274576b442ec468a9d5a122d5835bb956699a2c8906ba359be9344a2987a  native-entry-root-proof.json
c1505262572ff3bde3baba310aae5d48ea9c4fc8a95a952ef49776408bd4f65a  pinned-client-manifest.json
220269e977cd8c065cfd9c307d504f5b912a8e99465ad48e7eba18ffd316f716  image-copy-resource.json
```

All 11 entries in the pinned manifest matched both their current source and
frozen reference. The B native entry matched
`93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`.
The synthetic JPEG remained 47,379 bytes with SHA-256
`feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`.

## 2. Four delivered files

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\prepare.ps1
SHA-256 186b268691deacaa78fd03d56711706b2554dc9a1202ac0b3c49bf759088a77f
144 lines, 5,541 bytes

D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\start.ps1
SHA-256 4b111e4c2e3e884906519ae466c34c095bc264f3276618a507a0f238a2d1111d
882 lines, 37,759 bytes

D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\stop.ps1
SHA-256 09adeef6710c1da24ecb9ec2e75f16727b66009dfe4202559f962c2c25e4c7a0
197 lines, 7,123 bytes

D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\README.md
SHA-256 2cad88e00c0d27fed7403520aecf087f7e76e65ba8343e03be72ff1364e6a76b
166 lines, 7,471 bytes
```

The directory contains exactly these four files. No product, contract, test,
E50/B source, coordination input, guard, selector, PDF, map, or current native
entry file was written.

## 3. Exact source/clone and cumulative diff map

- `prepare.ps1` is new. It pins Python312 and the B native entry, chooses a
  unique `runs\T33-host-YYYYMMDD-HHMMSS` direct child, refuses an existing
  target, invokes only the documented `--prepare`, and verifies the resulting
  manifest, empty case, exact JPEG, settings, daily marker, canonical paths,
  source snapshot, and absence of runtime artifacts. It never cleans a failed
  preparation root.
- `start.ps1` reuses the E50 proven process-relay shape: environment cleared
  through `ProcessStartInfo`, asynchronous stdout/stderr relays, explicit
  start-time ticks, exact executable identity, and a bounded owning supervisor.
  Its cumulative changes against
  `T50\20261023-211421\start.ps1` (pinned SHA
  `95ce7bac006be1e8a36b6ae5e5966412ca6a0edc4cdecdf6022cbc3eb412ebf0`) are:
  every mutable GUI path is rebound under the one new native run; the fake
  workbench and PDF diagnostics/DevTools branches are removed; the Host
  command is the exact Python312 native `--serve --root <RunRoot> --seconds
  <=600`; a fresh three-file profile is materialized under
  `<RunRoot>\gui\dsh-home`; Host skill directories are private; Electron, Host,
  native Python child, sidecars, relays, and supervisor receive exact identity
  records; the outer owning budget is at most 600 seconds from GUI start.
- `stop.ps1` keeps the E50 exact PID/start-time/executable/path-marker shutdown
  rule. Its cumulative change is run-specific state, explicit recorded child
  lists, exact own-tree stop order, no process-name matching, no broad kill,
  and verification that the assigned native loopback port has zero listeners.
- `README.md` is new. It fixes the prepare -> review/hash gate -> start ->
  actual window ID -> native case open -> Paint synthetic-image copy/paste ->
  native saved-material and Host-temp verification -> exact stop sequence.

The profile copies are hash-equal to their accepted E50 read-only sources:

```text
bb7315c3844542261d160da20c0b9c963b5e56464cb81f546862fb2d46f43c3f  profile package.json
7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f  cordis.patch.yml
c4d0fefd428086416055f1350b0fb6e7cf1a7e14a3912a1e5796500e7e26377a  t50-memory-credentials.mjs
```

The original E50 resolver
`1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208`
and network guard
`cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130`
are used at their original absolute paths, byte-identically. The profile keeps
exactly `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app`, and
`lawbench-dsh`. The launcher embeds the fixed T34 projection-safe-error six-file
set and all other literal manifest hashes; it has no dynamic selector or
bundle build path.

## 4. Future side effects and cleanup

After root review, `prepare.ps1` will create exactly one new
`T33-host-YYYYMMDD-HHMMSS` root below the accepted B entry `runs` directory.
It creates no GUI files and never replaces a root.

Within that prepared root, `start.ps1` will create:

```text
gui\dsh-home\profiles\desktop\   three copied profile files
gui\electron-user-data\
gui\host-skills\
gui\logs\
gui\state\
private\roaming\
private\programdata\
```

It reuses the prepared `private\appdata`, `private\home`, `private\system`, and
`private\temp`; it does not replace `settings.json` or `daily-case.json`.
Electron user data, DSH_HOME, HOME/USERPROFILE, TEMP/TMP, APPDATA,
PROGRAMDATA, LOCALAPPDATA, and HostLB_APPDATA all remain private under the new
root. `LOCALAPPDATA` and `HostLB_APPDATA` both equal
`<RunRoot>\private\appdata`.

The future real chain may create the ordinary native metadata, request log,
case material, Host deletion evidence, guard log, and process state under that
same root. All roots and evidence remain. There is no recursive cleanup,
directory removal, run generator, retry loop, daemon, external installation,
or shared-runtime copy. Stop acts only on recorded exact identities and then
checks the assigned port. It does not claim Python cleanup ran after a forced
Python stop.

## 5. Actual static commands only / NO RUN

Executed operations were read-only file reads, SHA-256 calculations, directory
enumeration, literal string searches, and PowerShell AST parsing. The three
scripts each reported zero parse errors.

Several mechanically malformed tool invocations selected Bash after the order
was read; MXC rejected them before command execution (`Bash/E_ACCESSDENIED` or
the packaged-app refusal). They made no filesystem, process, Git, permission,
or sandbox change, and were not converted to legacy/setup workarounds. Every
successful command used the explicit native `pwsh.exe` path with
`login=false`.

The following were not executed: `prepare.ps1`, `start.ps1`, `stop.ps1`,
Python, Node, tests, Vitest, tsc, pytest, collection, selfcheck, product import,
service, GUI, installation, or network. The B `runs` directory still contained
only the prior root `T33-host-20261025-095824`; this author created no new run.

One read-only `git status` attempt failed before doing any write because the
shared worktree could not enter
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` (`Permission
denied`). Per order it was not retried, no lock/permission workaround was
attempted, and no staged/dirty file was changed. Git was not used for add,
commit, rebase, stash, reset, clean, checkout, or push. The pre-existing dirty
state remains owned by prior work.

## 6. Unresolved dependencies and handoff

- Root must review all four files and the cumulative map above before calling
  `prepare.ps1`.
- The actual fresh prepare, Electron/DSH/Host/Gateway/RPC chain, real window ID,
  native case open, Paint clipboard re-encoding, saved native material,
  Host-temp deletion, and final port closure remain unexecuted and unverified.
- `start.ps1` uses standard `Get-CimInstance` and `Get-NetTCPConnection`
  read-only process/port inspection. If the latter is unavailable, shutdown
  verification fails closed rather than claiming port closure.
- The Host must publish `started.json` and `ready.json`; the launcher fails
  closed if that bounded readiness handshake does not complete. This has not
  been run here.
- No new permission, security, credential, or install dependency was accepted.
  Packaging, deploy, installer, billing, model upgrade, OCR, and real model or
  Search tests remain on hold.
