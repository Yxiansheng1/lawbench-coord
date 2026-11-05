# B line handback: T18 defense direct import binding

Status: completed bounded preparation; AUTHORED_NOT_RUN.

Execution authority: `D:\Lawbeach\lawbench-coord\ORCH-B-T18DefenseDirectImportBinding-20261031-235546.md`.

## Delivered

New evidence root:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18DefenseDirectImportBinding-20261031-235546`

The four approved source files were copied from the approved old source root. The approved manifest was copied byte-for-byte as `literalfixed-inputs.json`. In the new `native-defense-opinion.mts`, only these two expressions were replaced:

- Static agent import expression to `import(pathToFileURL(APPROVED_RUNTIME_PINS['current-compiled-agent'].path).href)`.
- Static host import expression to `import(pathToFileURL(APPROVED_RUNTIME_PINS['current-compiled-host'].path).href)`.

The byte-level replacement command reported one exact occurrence of each expression. No other source edit was made. A short `README.md` records `AUTHORED_NOT_RUN`.

## Command results

- Preparation command: PowerShell native byte copy plus the two approved exact replacements; exit `0`; both replacement counts were `1`.
- Final metadata command: only the five named artifacts below were measured; exit `0`.
- Nonzero exits: none.

| File | Bytes | SHA-256 |
|---|---:|---|
| `native-defense-opinion.mts` | 156871 | `27D3A318B34AA3560C18C3B206C0583DD41B7576E12EBACF0801665857A6A8EA` |
| `b-service-defense-opinion.py` | 53695 | `76C940B6994DA9EFD18B5F473DDB7229202D1A5C8513C6B1841C3402BD5C96EA` |
| `request-digest-finite.mjs` | 18852 | `C66F6D356F42AFF1CECD9F06F59D9031C205C2B52AF7A88976404B559B28B4BE` |
| `wire-schema-finite.mjs` | 21756 | `73272D3FD8ADBC9B089AD57C1E6EA6402A130D297EE224383B3D9CEA572F48EA` |
| `literalfixed-inputs.json` | 12022 | `5CBEF893F12E31F1AE37CA3C5964BF0C5E5BFC566EFDAB15DDC863D03D073B80` |

The consumer size and SHA-256 exactly match `approved.json`: 156871 bytes and `27d3a318b34aa3560c18c3b206c0583dd41b7576e12ebacf0801665857a6a8ea`.

## Boundary qualifications

- No Node, Python, test, build, prepare, serve, probe, GUI, HTTP, model, credential, or environment action was executed.
- No JSON or TypeScript parsing, AST operation, execution, or import was performed.
- No Git write was attempted; there was no add, commit, rebase, stash, reset, clean, checkout, or push.
- No old raw, failure, served root, or dirty worktree content was changed.
- The execution used the requested native absolute `pwsh.exe` with `login=false`; managed MXC isolation remained in place. No setup or legacy-shell fallback was started.
- No Key or other credential was needed or used.
- Whole-source review and actual-import-binding review before any runtime remain required. This handback supplies authored artifacts and static byte evidence only; it does not claim runtime readiness or runtime success.
