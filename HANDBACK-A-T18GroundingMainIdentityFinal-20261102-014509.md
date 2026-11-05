# HANDBACK-A-T18GroundingMainIdentityFinal-20261102-014509

Status: AUTHORED_NOT_RUN

## Scope completed

- Updated `dsh-ext/agent/grounding-review.ts` so nonempty `more_names` with no parts returns null.
- Moved the request/receipt top-level name identity check outside the parts branch.
- Kept the existing single-main-part check and all prior range/completion checks.
- Replaced only the incorrect unrelated-clean-part notice assertion with `范围完整性不可用`.
- Added same-block negative fixtures for nonempty `more_names` without parts and wrong top-level name without parts.
- Both new fixtures assert null and the actual scope-unavailable notice.

## Evidence

- Read the formal execution order.
- Inspected the requested helper range and test range before editing.
- Source-only synthetic fixtures were added within the existing test block.

## Verification

- No Node, parser, test, build, model, HTTP, or GUI execution was performed.
- Runtime verification and prior-evidence reuse decisions remain with the root reviewer.

## Boundaries

- No Git write was attempted.
- No other source files were edited.
- No readback, count, or hash was performed after the formal handback was written.
