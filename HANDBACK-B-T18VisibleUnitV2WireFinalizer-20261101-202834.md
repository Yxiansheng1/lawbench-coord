This finalizer changed exactly one source line in `offline-controls.mjs`: `assert.equal(decodedStage2Envelope.actual_coverage, input.actualCoverage);` became `assert.deepEqual(decodedStage2Envelope.actual_coverage, input.actualCoverage);`, replacing the incorrect reference-identity assertion with full-value equality while preserving every other consumer, control, and data byte.

`source-manifest.json` records the one-pass .NET byte sizes and SHA-256 values: `review-consumer.mjs` remains HELD at 34800 bytes and `9c4d1e54f0fe6f412e9e7fc4641ce6868ee2680fe9db042cddf231444a7433e1`, `fixed-data.json` remains HELD at 17427 bytes and `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`, and `offline-controls.mjs` is 29274 bytes with `e9c41d4ca0f35b142751ad1a47bb1d0912c1d7e25a9f6fdb4b04d0d773d07742`.

No runtime, Node, Python, parser, test, `--check`, build, HTTP, model, or GUI operation was run (runtime count 0), and no product behavior, model admission, key, or API was changed.
