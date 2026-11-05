# A progress — T31 scoped queued-steer fix

Status: `SOURCE_HANDOFF_READY_FOR_ROOT_VALIDATION`

- Read the full execution order first with the required PowerShell/login setting.
- Fixed the source-before state and confirmed all existing touched-file hashes, dirty preservation, and frozen FE96/1166/config hashes.
- Implemented the single optional private-native field `deliveryRestriction?: 'next-turn-only'` from material prepare through ConversationController, Session RPC, durable UserMessage source, and Host queue mutation.
- Added same-R replay parity enforcement, restricted-steer fail closure, edit/replay preservation, and old unscoped compatibility.
- Added the native policy regression and integrated the reviewed C registry unit with an import-only adaptation.
- Added `P-29-scoped-queued-delivery-policy.patch`; in-memory source-diff reconstruction produced 389 expected/389 actual lines and 0 differences.
- Completed static hash, whitespace, conflict-marker, frozen-file, unchanged-Inbox, and C-unit import-only checks.
- Did not run product code, Vitest, Node/Python test paths, tsc, parser/AST, build, patch apply/check, GUI, HTTP, or model.
- No Git write command, staging, commit, lock, permission, ACL, approval, or sandbox change occurred.

Detailed evidence and exact root commands:

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ScopedQueuedSteerFix-20261026-175219\README.md`
