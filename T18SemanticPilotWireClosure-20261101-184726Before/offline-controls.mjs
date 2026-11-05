import assert from "node:assert/strict";
import {
  MAX_SEQUENTIAL_CALLS,
  MODEL,
  PARAMETERS,
  ROUTE,
  buildRequestPayload,
  buildStage1Envelope,
  buildStage1Messages,
  buildStage2Envelope,
  buildStage2Messages,
  outputStatusForFindings,
  parseModelJson,
  redactCredential,
  serializeForArtifact,
  validateStage1Result,
  validateStage2Result,
} from "./review-consumer.mjs";

const receipts = [
  {
    receipt_id: "RECEIPT_SENTINEL_1",
    material_id: "MATERIAL_SENTINEL_1",
    unit: "UNIT_SENTINEL_1",
    text: "EVIDENCE_SENTINEL exact first passage. EVIDENCE_SENTINEL adverse second passage.",
  },
  {
    receipt_id: "RECEIPT_SENTINEL_2",
    material_id: "MATERIAL_SENTINEL_2",
    unit: "UNIT_SENTINEL_2",
    text: "EVIDENCE_SENTINEL scope limit passage.",
  },
];
const input = {
  receipts,
  draft: "DRAFT_ONLY_SENTINEL exact draft sentence.",
  visibleSelfcheck: "SELFCHECK_ONLY_SENTINEL exact self-check sentence.",
  actualCoverage: { note: "COVERAGE_SENTINEL" },
};
const candidates = {
  facts: [
    {
      id: "CANDIDATE_SENTINEL_1",
      receipt_id: "RECEIPT_SENTINEL_1",
      material_id: "MATERIAL_SENTINEL_1",
      unit: "UNIT_SENTINEL_1",
      quote: "EVIDENCE_SENTINEL exact first passage.",
      description: "Neutral candidate description.",
    },
  ],
};

function assertProtocolError(fn, expectedCode) {
  assert.throws(fn, (error) => error && error.code === expectedCode);
}

const stage1Envelope = buildStage1Envelope(input.receipts);
assert.deepEqual(stage1Envelope, { evidence_receipts: receipts });
assert.deepEqual(Object.keys(stage1Envelope), ["evidence_receipts"]);
const stage1Messages = buildStage1Messages(input);
assert.equal(stage1Messages.length, 2);
assert.equal(stage1Messages[0].role, "system");
assert.equal(stage1Messages[1].role, "user");
assert.ok(stage1Messages[1].content.includes('"evidence_receipts"'));
assert.ok(stage1Messages[1].content.includes("EVIDENCE_SENTINEL exact first passage."));
assert.ok(!stage1Messages[1].content.includes("DRAFT_ONLY_SENTINEL"));
assert.ok(!stage1Messages[1].content.includes("SELFCHECK_ONLY_SENTINEL"));
assert.ok(!stage1Messages[1].content.includes("COVERAGE_SENTINEL"));

const stage2Envelope = buildStage2Envelope(input, candidates.facts);
assert.deepEqual(stage2Envelope, {
  evidence_receipts: receipts,
  stage1_candidates: candidates.facts,
  original_draft: "DRAFT_ONLY_SENTINEL exact draft sentence.",
  visible_selfcheck: "SELFCHECK_ONLY_SENTINEL exact self-check sentence.",
  actual_coverage: { note: "COVERAGE_SENTINEL" },
});
assert.deepEqual(Object.keys(stage2Envelope).sort(), [
  "actual_coverage",
  "evidence_receipts",
  "original_draft",
  "stage1_candidates",
  "visible_selfcheck",
]);
const stage2Messages = buildStage2Messages(input, candidates.facts);
assert.equal(stage2Messages.length, 2);
assert.ok(!stage2Messages[1].content.includes("RAW_STAGE1_TRANSCRIPT_SENTINEL"));
assert.ok(stage2Messages[1].content.includes("CANDIDATE_SENTINEL_1"));

const payload = buildRequestPayload(stage1Messages);
assert.equal(ROUTE, "http://10.126.126.1:8000/v1/chat/completions");
assert.equal(MAX_SEQUENTIAL_CALLS, 2);
assert.equal(payload.model, "qwen38-27b");
assert.equal(MODEL, "qwen38-27b");
assert.equal(payload.temperature, 0.6);
assert.equal(PARAMETERS.temperature, 0.6);
assert.equal(payload.max_tokens, 49152);
assert.equal(PARAMETERS.max_tokens, 49152);
assert.equal(payload.stream, false);
assert.equal(PARAMETERS.stream, false);
assert.deepEqual(payload.messages, stage1Messages);

const credentialSentinel = "CREDENTIAL_OFFLINE_SENTINEL_9f4e2b";
const redacted = serializeForArtifact({
  direct: credentialSentinel,
  nested: { [credentialSentinel]: [`prefix:${credentialSentinel}:suffix`] },
}, credentialSentinel);
assert.ok(!redacted.includes(credentialSentinel));
assert.ok(redacted.includes("[REDACTED_CREDENTIAL]"));
assert.equal(redactCredential(`a${credentialSentinel}b`, credentialSentinel), "a[REDACTED_CREDENTIAL]b");

assert.deepEqual(parseModelJson('{"findings":[]}'), { findings: [] });
assert.deepEqual(parseModelJson('```json\n{"findings":[]}\n```'), { findings: [] });
assertProtocolError(() => parseModelJson('prefix {"findings":[]}'), "MALFORMED_JSON");
assertProtocolError(() => parseModelJson('```json\n```json\n{"findings":[]}\n```\n```'), "MALFORMED_JSON");
assertProtocolError(
  () => validateStage1Result({ facts: [] }, receipts),
  "EMPTY_FACTS",
);
assertProtocolError(
  () => validateStage1Result({
    facts: [{ ...candidates.facts[0], receipt_id: "UNKNOWN_RECEIPT_SENTINEL" }],
  }, receipts),
  "UNKNOWN_RECEIPT",
);
assertProtocolError(
  () => validateStage1Result({
    facts: [{ ...candidates.facts[0], quote: "WRONG_QUOTE_SENTINEL" }],
  }, receipts),
  "EVIDENCE_QUOTE_MISMATCH",
);
assert.deepEqual(validateStage1Result(candidates, receipts), candidates);

const emptyReview = validateStage2Result({ findings: [] }, {
  receipts,
  draft: input.draft,
  visibleSelfcheck: input.visibleSelfcheck,
  stage1Candidates: candidates.facts,
});
assert.deepEqual(emptyReview, { findings: [] });
assert.equal(outputStatusForFindings(emptyReview.findings), "EMPTY_REVIEW_NOT_QUALITY_PASS");
assert.notEqual(outputStatusForFindings(emptyReview.findings), "PASS");
assertProtocolError(
  () => validateStage2Result({ findings: [], overallPASS: true }, {
    receipts,
    draft: input.draft,
    visibleSelfcheck: input.visibleSelfcheck,
    stage1Candidates: candidates.facts,
  }),
  "RESPONSE_SCHEMA_INVALID",
);
assertProtocolError(
  () => validateStage2Result({
    findings: [{
      kind: "SCOPE",
      issue: "Synthetic issue.",
      receipt_id: "UNKNOWN_RECEIPT_SENTINEL",
      evidence_quote: "EVIDENCE_SENTINEL exact first passage.",
      draft_quote: "DRAFT_ONLY_SENTINEL exact draft sentence.",
    }],
  }, {
    receipts,
    draft: input.draft,
    visibleSelfcheck: input.visibleSelfcheck,
    stage1Candidates: candidates.facts,
  }),
  "UNKNOWN_RECEIPT",
);
assertProtocolError(
  () => validateStage2Result({
    findings: [{
      kind: "SCOPE",
      issue: "Synthetic issue.",
      receipt_id: "RECEIPT_SENTINEL_1",
      evidence_quote: "EVIDENCE_SENTINEL exact first passage.",
      draft_quote: "WRONG_DRAFT_QUOTE_SENTINEL",
    }],
  }, {
    receipts,
    draft: input.draft,
    visibleSelfcheck: input.visibleSelfcheck,
    stage1Candidates: candidates.facts,
  }),
  "DRAFT_QUOTE_MISMATCH",
);

const findingReview = validateStage2Result({
  findings: [
    {
      kind: "OMISSION",
      issue: "Synthetic omitted candidate.",
      receipt_id: "RECEIPT_SENTINEL_1",
      evidence_quote: "EVIDENCE_SENTINEL exact first passage.",
      draft_quote: null,
      stage1_candidate_id: "CANDIDATE_SENTINEL_1",
    },
    {
      kind: "SELF_CHECK",
      issue: "Synthetic self-check issue.",
      receipt_id: "RECEIPT_SENTINEL_2",
      evidence_quote: "EVIDENCE_SENTINEL scope limit passage.",
      selfcheck_quote: "SELFCHECK_ONLY_SENTINEL exact self-check sentence.",
    },
  ],
}, {
  receipts,
  draft: input.draft,
  visibleSelfcheck: input.visibleSelfcheck,
  stage1Candidates: candidates.facts,
});
assert.equal(outputStatusForFindings(findingReview.findings), "REVIEW_FINDINGS_REQUIRE_ROOT_MANUAL_JUDGMENT");

process.stdout.write("offline controls passed\n");
