# A handback: T18 close-contract repair

## Outcome

Status: bounded source repair completed. `AUTHORED_NOT_RUN`, author runtime 0.
This is not a PASS and does not establish workflow readiness.

The only code repair is the confirmed fixture close-contract mismatch:

1. `b-service.py` line 665, normal path:
   `await lb.net.client.aclose()` -> `lb.net.client.close()`
2. `b-service.py` line 713, outer `finally` path:
   `await lb.net.client.aclose()` -> `lb.net.client.close()`

The current primary B source `D:\Lawbeach\lawbench-B\service\lawbench\net.py`
constructs `Net.client` as a synchronous `httpx.Client`. The repaired entry
preserves `net_closed`, `bool(lb.net.client.is_closed)`,
`failure = "net_close_failed"`, both `try` / `except` paths, all final JSON
fields, and the outer `finally` cleanup.

## Exact byte relation

The baseline contains exactly two `await lb.net.client.aclose()` expressions.
The final entry contains zero such expressions and exactly two synchronous
`lb.net.client.close()` expressions. Replacing both final synchronous
expressions with the original awaited expressions reproduces the complete
baseline byte array exactly.

The final `b-service.py` is UTF-8 without BOM, has 753 bare LF line endings,
has no CRLF, and is 14 bytes smaller. No async-client substitution was made and
no assertion or exception handling was removed.

The complete Node source and complete B `net.py` were read by the author. The
single raw whole-file Node read was display-truncated by the tool, so all
2,012 lines were then read in four overlapping 520-line chunks. The earlier
root-fixed socket binding and per-question eligibility were not reopened.
The progress body was not changed.

## Source and manifest identities

Baseline copies remain unchanged at:

`D:\Lawbeach\lawbench-coord\T18CloseContractInput-20261028-142044\`

| Identity | Before | After |
|---|---|---|
| `b-service.py` | 28,236 bytes; `446b0a57559f4bc5b4a918cf91eee91f143a1995816b2172cc252769c78911d3` | 28,222 bytes; `87be5a7c09d0e8cafba0b3a729885189c517ddc0ea9bddb6b4c845cd7fdc3220` |
| `fixed-inputs.json` | 14,681 bytes; `67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df` | 14,681 bytes; `7fa7ee7fddcc8fff0768a3dde4b84eef077c10aaea2cc451e201469c5d4869e0` |
| `native-reading-workflow.mts` | 76,652 bytes; `078559230ca8f4e163293d0d56ac63667faa9c9b13b5e253b6ecfdc895f0eba5` | 76,652 bytes; `f3ab52077c41090124eb1440908483b716a40f74a8c14cff3e572444b3f9b4b4` |
| `README.md` | 5,278 bytes; `17747afa72596cc1ad37574c9c05aec3ccddc25fb8d916dde1701d84cbe2f9e8` | unchanged |
| B `net.py` | 25,896 bytes; `e547412246d92ba4ba105fed98923f91e30e8f5f63a0965a9830ab03f4252585` | unchanged |

`fixed-inputs.json` differs from its baseline copy only in these two pairs:

```text
- "bytes": 28236
+ "bytes": 28222
- "sha256": "446b0a57559f4bc5b4a918cf91eee91f143a1995816b2172cc252769c78911d3"
+ "sha256": "87be5a7c09d0e8cafba0b3a729885189c517ddc0ea9bddb6b4c845cd7fdc3220"
```

`native-reading-workflow.mts` differs from its baseline copy only in this line:

```text
- const FIXED_INPUTS_SHA256 = '67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df'
+ const FIXED_INPUTS_SHA256 = '7fa7ee7fddcc8fff0768a3dde4b84eef077c10aaea2cc451e201469c5d4869e0'
```

The new technical note is:

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\close-contract-20261028-142044.md`

At final read-only check it was 4,529 bytes with SHA-256
`205f97cf44ba2a93c8be3ed1bc7767cbe23708570aae6475a35ddb17c20284c4`.

## Frozen surfaces

No change was made to:

- the other `fixed-inputs.json` fields;
- any Node source line other than the one manifest literal;
- `README.md`;
- four prompts, question bindings, budgets, or native-R behavior;
- current production route, Skill, tools, read coverage, citations, draft,
  persistence, protocol-neutrality, or finally assertions;
- B production source or any other product source;
- old T18 status/report, old evidence formal, or prior handbacks.

`README.md` was left unchanged because its existing close statement is not
contradicted by the repair. The precise synchronous contract is recorded in
the new technical note.

The pre-work dirty inventory is preserved at
`D:\Lawbeach\lawbench-coord\T18CloseContractInput-20261028-142044\A-dirty-before.txt`
(238,717 bytes, SHA-256
`9353ce17d59722b939967cf2ea53bdd916e3266b4f82eaefe36d38dbe392c00f`).
The current execution PID is this author; no second writer was started.

## Exact writefaces

Only these five paths were written:

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\b-service.py`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`
4. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\close-contract-20261028-142044.md`
5. `D:\Lawbeach\lawbench-coord\A-handback-T18-close-contract-20261028-142044.md`

No staging, index update, commit, rebase, stash, reset, clean, checkout, push,
package, install, or Git index write was attempted. No sandbox, approval, ACL,
permission, security, or lock change was attempted.

## Command log and nonzeros

Every completed `exec_command` below returned exit code 0. Nonzero exits:
none. `apply_patch` operations are listed separately as writes.

Read-only Git used `--ignore-submodules=all`. The initial broad read-only
`git status` emitted unrelated `Filename too long` warnings for deeply nested
evidence paths but exited 0 and reported the T18 target files. A later
target-only status check completed without that warning.

1. Read the formal order:
   `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-close-contract-order-20261028-142044.md'`
2. `git --no-pager status --short --untracked-files=all --ignore-submodules=all`
3. `Get-ChildItem -Force -LiteralPath 'D:\Lawbeach\lawbench-coord\T18CloseContractInput-20261028-142044' | Select-Object Name,Length,LastWriteTime`
4. `Get-ChildItem -Force -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231' | Select-Object Name,Length,LastWriteTime`
5. `Get-FileHash -Algorithm SHA256 -LiteralPath @(<the four baseline files, four current files, and B net.py>) | Select-Object Path,Hash`
6. `Get-Item -LiteralPath @(<the four baseline files and B net.py>) | Select-Object FullName,Length,LastWriteTime`
7. `Select-String -LiteralPath <current b-service.py> -Pattern 'await lb\.net\.client\.aclose\(\)|lb\.net\.client\.close\(\)|net_closed|is_closed' -AllMatches | Select-Object LineNumber,Line`
8. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\net.py'`
9. `Get-Content -Raw -LiteralPath <current b-service.py>`
10. `Get-Content -Raw -LiteralPath <current native-reading-workflow.mts>`
11. `Get-Content -LiteralPath <current native-reading-workflow.mts> | Select-Object -Skip 0 -First 520`
12. `Get-Content -LiteralPath <current native-reading-workflow.mts> | Select-Object -Skip 520 -First 520`
13. `Get-Content -LiteralPath <current native-reading-workflow.mts> | Select-Object -Skip 1040 -First 520`
14. `Get-Content -LiteralPath <current native-reading-workflow.mts> | Select-Object -Skip 1560 -First 520`
15. `Get-Content -Raw -LiteralPath <current fixed-inputs.json>`
16. `Get-Content -Raw -LiteralPath <current README.md>`
17. `Select-String -LiteralPath <current fixed-inputs.json> -Pattern 'bServiceEntry|b-service.py|28236|446b0a' -Context 0,6`
18. Byte/newline-count command over the current `b-service.py`
19. `Get-Content -LiteralPath <current b-service.py> | Select-Object -Skip 654 -First 66`
20. The same complete nine-path `Get-FileHash` identity read as command 5
21. Post-patch complete-byte inverse comparison and SHA-256 read of
    `b-service.py`
22. `Get-FileHash ... fixed-inputs.json | ForEach-Object { '{0}  {1}' -f $_.Hash,$_.Path }; (Get-Item ... fixed-inputs.json).Length`
23. `Compare-Object` over baseline/current `fixed-inputs.json` lines
24. Final hashes and byte counts for current B entry, manifest, Node source,
    README, and primary B `net.py`
25. `Compare-Object` over baseline/current `native-reading-workflow.mts` lines
26. `Select-String` over current B entry, Node source, and manifest for old/new
    close expressions, `FIXED_INPUTS_SHA256`, `28222`, and `87be5a7c`
27. `Test-Path -LiteralPath <new technical note>` -> `False`
28. `Test-Path -LiteralPath <new handback file>` -> `False`
29. Target-only read-only `git status` over the four original T18 files
30. `Get-FileHash` plus length over `A-dirty-before.txt`
31. Final ten-file hash/length integrity read over all baseline copies, current
    entries, new note, and B `net.py`
32. Final old/new expression counts, preserved-value counts, and
    `Compare-Object` checks for manifest and Node source
33. Final target-only read-only `git status` over the four original files and
    the new technical note

`apply_patch` writes were:

1. Replace the two awaited expressions in `b-service.py`.
2. Replace only `bServiceEntry.bytes` and `bServiceEntry.sha256` in
   `fixed-inputs.json`.
3. Replace only `FIXED_INPUTS_SHA256` in `native-reading-workflow.mts`.
4. Create the technical note.
5. Create this handback file.

Two read-only commands had a mistyped `shell` parameter rather than the
required absolute path:

- command 12 used
  `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native-powershell\pwsh.exe`;
- command 33 used the same mistyped path.

Both invocations nevertheless returned exit code 0 and the requested read-only
output. This is an explicit command-spec deviation. Neither invocation wrote a
file or started a runtime, and every other invocation used the required native
PowerShell path with `login=false`.

## Verification boundary and limitations

Author side ran no Python, Node, import, parser, AST, compiler, type checker,
test, build, prepare, serve, probe, HTTP, model, SSH, GUI, or self-test. No
source execution was used to infer success. The evidence is static source
inspection, exact line comparison, and complete-file SHA-256/byte comparison.

`DisabledRetainer` remains a finite-entry sentinel whose `close()` only flips a
boolean. It is not evidence about cleanup of a real production Retainer.

Root still owns the independent cumulative review, finite compiler admission,
and the actual one integrated synthetic workflow using the dedicated saved Key.
Preparation is not PASS. Gate 1, full T18, project completion, and packaging
remain incomplete; Packaging is HOLD.

No other chat was contacted. No API was changed. The initial author status and
the original formal were not reopened or overwritten.
