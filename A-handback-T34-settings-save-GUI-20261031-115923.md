# A handback — T34 Settings Save GUI

Status: `SOURCE_ONLY_NOT_RUN`. No finite check, GUI, Save, or runtime test was
performed by A. This is not a PASS claim.

## Delivered source

Destination:
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsSaveGUI-20261031-115923`

The destination contains the 11 baseline source files plus
`firewall-finite.py` (12 files total). The five `.mjs` helpers were copied
byte-for-byte from the accepted baseline and were not edited. The frozen
baseline directory was not modified. No product source, SDK, compiled client,
or build output was changed.

Changed files and literal metadata:

| File | Bytes | SHA-256 |
|---|---:|---|
| `README.md` | 1942 | `1f26e6b905e3dd1c5cb43860d49d4b0ca8933eb191f5fadddba7a5ba006aa458` |
| `entry.py` | 91469 | `098618a96edb4becc838745ebb585af65e8891a4f3a29194c9364f6d576e14aa` |
| `prepare.ps1` | 13600 | `bf36702cee6f292f5326add1a04833eaa847ea2902cc53723110601753f8c618` |
| `start.ps1` | 96141 | `e6f78b31c865bcc0507f73eae5cd466a37d194cb7a55a5e2ec0c675c02071170` |
| `stop.ps1` | 7175 | `25230ce162a00903068d6061eeba8ab9194385599cfbd11a7a94bd4bb9945b69` |
| `firewall-finite.py` | 7372 | `ffcb3af9bb76274e300ec115c4ea8ee1cfd7ac48b343e64f8612264ad4d25203` |

`literal-inputs.json` is the raw template with only those six byte/SHA
placeholders filled. `start.ps1` carries the new `entry.py` byte count and
SHA-256 as literals. The self-location in `entry.py`, `prepare.ps1`,
`start.ps1`, and `stop.ps1` now points to this destination.

## Precise source changes

In `entry.py`, only these named surfaces changed:

- new module helper `expected_saved_settings()`, containing the full approved
  saved object with `external_llm.context_window = 65536`;
- `Firewall.__init__` adds `settings_put_attempts` and `settings_put_ok`;
- `Firewall._policy` adds the exact `PUT /api/settings` branch before
  case-open; it rejects query/body drift without consuming budget, admits one
  canonical object under `self.lock`, and reports `SETTINGS_PUT_LIMIT` later;
- `Firewall._complete` records `settings_put_ok` only for status 200,
  `ok is true`, and the exact canonical saved value, without entering read
  counters;
- `Firewall.__call__` changes one body-read/replay condition from POST-only to
  POST-or-PUT; all existing bounds, auth, capture, and replay behavior remain;
- `Firewall.evidence` exposes only the two new numeric counters.

`README.md` describes only the one allowed Settings numeric edit and Save. It
states no real Key, consent, route switch, Send, model call, human
notification, automatic abandon/discard, or all-T34 PASS. `firewall-finite.py`
is authored source only: it AST-selects the actual helper and actual
`Firewall._policy`, reads the independent expected object from
`--approved`, checks one positive plus repeated denial, and uses a fresh
fixture for each negative family. It creates no app, HTTP request, process,
model call, credential operation, or product import.

## Command accounting

- PowerShell `exec_command` calls: 29 total; 27 read-only and 2 file-copy
  calls; successful results 29; nonzero results 0.
- Command families used: `Get-Content`, `Get-ChildItem`, `Select-String`,
  `Get-Item`, `Get-FileHash`, `Test-Path`, `New-Item`, `Copy-Item`.
- `apply_patch` source-edit batches before this handback: 4 successful,
  0 failed.
- Rejected alternate-shell attempts: 0. Bash was never invoked.
- Node, Python, AST, parser, test, build, prepare, admission, start, GUI, Save,
  HTTP, model, process-probe, Key/credential, DPAPI, Keyring, and Git-runtime
  invocations by A: 0.
- Git add/commit/rebase/stash/reset/checkout/push and other Git writes: 0.
  Git was not used; A did not inspect or alter the index.

The two empty `Select-String` result sets were intentional checks that the old
self-root and manifest placeholders were absent; both commands exited 0.

Root still owns independent AST/text inverse checks, execution of
`firewall-finite.py`, one fresh genuine UI Save, metadata/evidence review, and
cleanup.
