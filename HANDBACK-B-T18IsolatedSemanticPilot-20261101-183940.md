# B handback: T18 isolated semantic pilot

Status: AUTHORED_NOT_RUN

Runtime calls this execution: 0

The isolated Node ESM source, byte-exact fixed-data copy, source pins, and offline controls are prepared for Root audit. The fixed-data SHA-256 and byte count match the approved provenance descriptor exactly.

## Exact write faces

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940\review-consumer.mjs`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940\fixed-data.json`
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940\source-manifest.json`
4. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940\offline-controls.mjs`
5. `D:\Lawbeach\lawbench-coord\HANDBACK-B-T18IsolatedSemanticPilot-20261101-183940.md`

No other files were authored. No product, schema, Skill, SDK, or default-lib change was made.

## Pinned source facts

| Face | Bytes | SHA-256 |
|---|---:|---|
| review-consumer.mjs | 25844 | 13195af9b5271da752a8f2a1d976df26ca71e48bd89f34f42942782a0228cd67 |
| fixed-data.json | 17427 | e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69 |
| offline-controls.mjs | 7280 | fdedc96d9238fd2879772c9aa1e6ff7cded37753c06ac550a3190863be84f67a |

The manifest deliberately does not pin itself.

## Verification boundary

Per the execution order, this execution did not run Node, the consumer, parser, controls, tests, builds, preparers, HTTP/model calls, GUI, or probes. It did not run `--version`, access Git, inspect original case material, or modify the sandbox, approvals, ACLs, or writer locks. Git write operations were not attempted.

The Root must independently audit all source and setup and must run the offline controls before any finite runtime call.

## Limitations

- This is a diagnostic prototype, not a production implementation or Native workflow.
- Runtime artifacts do not yet exist because runtime calls were zero.
- Statuses describe protocol/capability behavior only. No legal or business quality result is asserted; an empty Stage 2 review returns `EMPTY_REVIEW_NOT_QUALITY_PASS`.
- The input selector uses generic field aliases and fails closed if the approved fixed-data shape does not expose receipt `text`, `material_id`, `unit`, original draft text, visible self-check text, and actual coverage as expected.
- The Authorization header value is the supplied credential line verbatim. The Root must supply the complete intended header value, including any scheme prefix.
- Source execution remains unproven until Root runs the reviewed controls and the bounded runtime.

## Obstacles

No execution obstacle occurred. Runtime execution is intentionally withheld under the order's audit boundary.
