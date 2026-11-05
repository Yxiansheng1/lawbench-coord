# A handback — T31 restricted claim/cancel replay tests

Status: `SOURCE_HANDED_BACK_RUNTIME_NOT_RUN`

Exact order:
`D:\Lawbeach\lawbench-coord\T31-restricted-claim-replay-tests-order-20261026-201806.md`
(SHA256 `12D077D2052AB80E6C6ABF20B96177C3152803FF6486F078B3B3FCF068C7C95E`)

## Delivered

Only the three authorized files were written:

- `D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-restricted-claim-replay.client.spec.ts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\RestrictedClaimReplay-20261026-201806\README.md`
- `D:\Lawbeach\lawbench-coord\A-handback-T31-restricted-claim-replay-tests-20261026-201806.md`

The new test contains exactly two cases plus paired controls. It uses actual
`beginSubmission()` UUIDs, the real Session/command controller/durable Inbox,
real native claim, and real `updateQueue(remove)` cancellation outcome.
`Agent.send` is forbidden and counted; both cases require zero calls. The
restricted cancellation result allows only an explicit Host rejection or a
restriction-bearing own next-turn, never an unrestricted next-step. The paired
ordinary queued/remove/same-R steer must still succeed.

Static source and the two cited existing tests are unchanged. Relevant live
hashes match the frozen map; the identity test remains
`6EDAC6FCE7E9E1DD6A9B41F53D8DA9982F965402AF2ED8755594D6F4065D8343`.
The new test SHA256 is
`5386E8B5AAC7B9CFB76A5C254D1329E0B94881145CA6B675914F9B93B666CF56`.

## Verification

```text
SOURCE              WRITTEN_AND_STATIC_AUDITED
Node/Python         NOT_RUN
Vitest/list         NOT_RUN
tsc/parser/AST      NOT_RUN
HTTP/GUI/model      NOT_RUN
Git write           NOT_RUN
```

Runtime adjudication is reserved to root. The in-memory Remote mock is only a
routing seam; this handback is not HTTP, real authority, GUI, or model proof.
No product bug is claimed before root runs the new assertions.

## Commands and probes

Every exec command used:

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
```

Successful operations were static `Get-Content`, `Get-Item`, `Test-Path`,
`Get-FileHash`, and `rg` reads against the order, precise frozen-map entries,
B findings, live source, existing tests, and the new test; plus `apply_patch`
for the three authorized files. No Bash, setup, installation, package command,
parser, compiler, test/list command, build, probe, HTTP, GUI, or model command
was run.

Two commands exited nonzero:

```powershell
# exit=1: Git could not chdir into inaccessible submodule metadata
git status --short --branch

# exit=1: parser error before any file action from the first compact existence loop
$paths = @('D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-restricted-claim-replay.client.spec.ts','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\RestrictedClaimReplay-20261026-201806\README.md','D:\Lawbeach\lawbench-coord\A-handback-T31-restricted-claim-replay-tests-20261026-201806.md'); foreach ($p in $paths) { [pscustomobject]@{ Path=$p; Exists=(Test-Path -LiteralPath $p); Length=if (Test-Path -LiteralPath $p) {(Get-Item -LiteralPath $p).Length} else {$null} } } | Format-Table -AutoSize
```

The read-only fallback
`git status --short --branch --ignore-submodules=all` succeeded and showed the
pre-existing dirty `line-A` worktree. No lock, ACL, permission, index, stash,
branch, commit, or worktree state was changed or repaired.

Full provenance and static source observations are in:
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\RestrictedClaimReplay-20261026-201806\README.md`
