# T18 Grounding Fixture Literal Closure Handback

Status: Implementation complete within the authorized source-only boundary.

## Scope

Only the designated helper and test source were modified. All unrelated dirty
work was preserved. No Git write operation, dependency change, model call,
network request, or broader discovery was performed.

## Changes

1. `dsh-ext/agent/grounding-review.ts`
   - Restored the complete-read predicate to require each part `start === 1`
     while retaining the integer requirement and `end >= start`.

2. `dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts`
   - Added the required negative range-group case with part `start: 2` and
     `end: 2`, expecting `read_complete` to be false.
   - Changed only the eight-receipt aggregate fixture name padding from 400 to
     390 repetitions; its existing assertions remain unchanged.
   - Expanded the coverage fixture loop from 9 to 10 coherent reads. Its raw
     coverage now lists all 10 matching fully-read names without an `omitted`
     property, allowing the index snapshot to derive eight shown and two
     omitted names while preserving the identity notice assertions.
   - Replaced the invalid near-cap setup with five valid single-material reads
     whose unique names are exactly 505 JavaScript characters, IDs M0001 through
     M0005, unit `page`, and complete one-page receipts. A sixth ordinary read is
     omitted. The retained-source expectation is now five with one omitted.

## Verification

No test, build, parser, runtime, or ancillary command was executed because the
order expressly prohibited those actions. The fixture boundary relies on the
independent adjudicated JSON lengths in the order: five stored receipt groups
occupy 5,960 characters, and adding the 74-character fallback group exceeds the
6,000-character cap. Every stored receipt remains below 2,500 characters.

## Remaining Limits

Runtime confirmation of the edited tests was outside this run's authorized
verification boundary. No source drift or unrelated change was introduced.
