# B Handback - T18 Schema Keyword Compatibility V7

Status: AUTHORED_NOT_RUN. Source-only bounded change completed. Git was not modified.

## Exact pins

- `review-consumer.mjs` - 56665 bytes - sha256 `cba474a6babb427c11d461e7945b29edc5313071599a92771247645dce2129ec`
- `offline-controls.mjs` - 50326 bytes - sha256 `cc677c978dd3a66232931303830f97751486643d195c7cf2c5a41e4664042767`
- `fixed-data.json` - 17427 bytes - sha256 `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`
- `stage1-assessments.json` - 10015 bytes - sha256 `5e4ba4c51aa23b29b8625174c595d940628bbb7910ef6e9afcd4f777d5712fc1`

The four pins are recorded in `source-manifest.json`, with algorithm `sha256`.
The two fixed inputs were copied byte-exact and match their capsule pins.

## Consumer change

The only consumer change is deletion of the `uniqueItems: true,` property from
`refsSchema` in `buildStage2ReviewRecordSchema`.

No other consumer byte, function, prompt, name, model, budget, graph, validator,
transport, main, artifact, cleanup, or local duplicate-reference validation was
changed. The name remains `lawbench_target_review_v6`.

## Offline-control changes

Only the affected schema expectations changed:

- removed `uniqueItems` from the three expected `refs` key arrays;
- replaced the exact `.uniqueItems === true` assertion with an own-property-absent
  assertion.

All local `REF_DUPLICATE`, typed-graph, ID, count, merge, positive-without-support,
UTF-16, model-budget, transport, and fake-HTTP-tail assertions remain unchanged.

## Known boundaries

- Observed condition: server HTTP 400,
  `Grammar error: Unimplemented keys: ["uniqueItems"]`.
- The transport retains the original HTTP 400 path; no fallback, retry, alternate
  keyword, backend flag, SDK/install, restart, or parameter guessing was added.
- No parser, syntax check, test, build, runtime, HTTP/model call, or health probe
  was run because this execution is source-only.
- Model semantics are not proven.
- Root full diff, guarded affected offline controls, and independent review are
  still required before any Key/model use.
- Packaging remains HOLD.

Evidence directory:
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18SchemaKeywordCompatV7-20261101-230453`
