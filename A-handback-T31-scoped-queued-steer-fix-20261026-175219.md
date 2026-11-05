# A handback — T31 scoped queued-steer delivery policy

State: `SOURCE_HANDOFF_READY_FOR_ROOT_VALIDATION`

The scoped queued-R red now has one explicit request-owned native constraint. A successful material prepare returns `next-turn-only`; ConversationController carries it with the same native R; `SessionPromptRequest` and the durable `user-rpc` source carry the optional field; Host rejects restricted steer admission and rejects `updateQueue(steer)` for any restricted next-turn message. Edit preserves source, projection replay restores it, same-R dedup rejects restriction mismatch, and unscoped requests remain legally steerable.

Delivered:

- UI/material producer: `dsh-ext/ui/material-batch.ts`, `dsh-ext/ui/index.tsx`
- Conversation/native client: `dsh/packages/client/ui-conversation/src/client/{service,apply}.ts`
- Native API/Host: `dsh/packages/api/session-controller/src/{types,commands}.ts`, `src/client/contract/session.ts`, `src/client/sessions/session.ts`
- New policy regression: `dsh/packages/api/session-controller/tests/t31-scoped-queue-policy.client.spec.ts`
- C unit native adaptation: `dsh/packages/client/ui-conversation/tests/t31-submission-registry-admit.client.spec.ts`
- Eighth P-29 source patch: `dsh-patches/P-29-scoped-queued-delivery-policy.patch`

Patch facts: 18896 bytes, 389 lines, SHA-256 `b382e09b1f9d9dd9e141e7b663d52f650d0f96f7d8f8f6eb10c17701b15e8b19`. Static reconstructed source diff: 389 expected/389 actual lines, 0 differences. The patch contains the six native production files; new tests and the two `dsh-ext` files are delivered as workspace files with hashes in the README.

Preserved:

- Dirty worktree; no Git writes or commits.
- FE96 `fe96d6f18f65811d694bce8aa6e788f5fd3b84e2c247f5f9ea1dfd917ca2e426`.
- Material admission 1166 `1166b065c97ef634d7b0e2829927e148e56f3a3f851148fad92134205b45fc7b`.
- Frozen selector/config hashes and unchanged `inbox.ts` hash.
- Public four JSON schemas, B source, provider/model/LLM/global config, and unrelated modules.

NOT_RUN: Vitest, Node, Python, tsc, lint, parser/AST, build, patch apply/check, probe, HTTP, model, GUI, packaging, real cases. This is not whole-T31 acceptance.

Required root validation:

1. Independently review/replay the patch from the source-before hashes.
2. Run frozen FE96 paired test, new policy test, C registry unit, and affected material-admission/native-identity/service-orchestration tests using native config and exact file selection.
3. Fix only failures exposed by that validation; do not weaken the frozen assertions.

Exact commands, all hashes, compatibility notes, routing anomalies, and known limits:

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ScopedQueuedSteerFix-20261026-175219\README.md`
