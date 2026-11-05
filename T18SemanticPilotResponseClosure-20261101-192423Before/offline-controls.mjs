import assert from "node:assert/strict";
import {
  MAX_SEQUENTIAL_CALLS,
  MODEL,
  PARAMETERS,
  ROUTE,
  buildAuthorizationHeader,
  buildRequestPayload,
  buildStage1Envelope,
  buildStage1Messages,
  buildStage2Envelope,
  buildStage2Messages,
  outputStatusForFindings,
  parseModelJson,
  redactCredential,
  requestTimeoutForDeadline,
  serializeForArtifact,
  selectPilotInput,
  unwrapChatCompletion,
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
    {
      id: "CANDIDATE_SENTINEL_2",
      receipt_id: "RECEIPT_SENTINEL_2",
      material_id: "MATERIAL_SENTINEL_2",
      unit: "UNIT_SENTINEL_2",
      quote: "EVIDENCE_SENTINEL scope limit passage.",
      description: "Neutral scope candidate description.",
    },
  ],
};

function assertProtocolError(fn, expectedCode) {
  assert.throws(fn, (error) => error && error.code === expectedCode);
}

const fixedData = {
  format: "T18_ISOLATED_REVIEW_ACTUAL_READS_AND_OLD_DRAFT_V1",
  evidence: receipts,
  draft: {
    content: input.draft,
    title: "DRAFT_TITLE_SENTINEL",
    version: 3,
  },
  visible_selfcheck: input.visibleSelfcheck,
  coverage: input.actualCoverage,
};
const selectedInput = selectPilotInput(fixedData);
assert.equal(selectedInput.receipts, receipts);
assert.equal(selectedInput.draft, input.draft);
assert.equal(selectedInput.visibleSelfcheck, input.visibleSelfcheck);
assert.equal(selectedInput.actualCoverage, input.actualCoverage);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, draft: { ...fixedData.draft, version: "3" } }),
  "ORIGINAL_DRAFT_NOT_TEXT",
);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, evidence_receipts: receipts, evidence: undefined }),
  "EVIDENCE_RECEIPTS_MISSING",
);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, draft: { ...fixedData.draft, content: { text: input.draft } } }),
  "ORIGINAL_DRAFT_NOT_TEXT",
);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, visible_selfcheck: { content: input.visibleSelfcheck } }),
  "VISIBLE_SELFCHECK_NOT_TEXT",
);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, coverage: [] }),
  "ACTUAL_COVERAGE_INVALID",
);

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
assert.ok(stage2Messages[0].content.includes(
  "If stage1_candidate_id is present, receipt_id and evidence_quote must exactly equal that candidate's receipt_id and quote.",
));

const payload = buildRequestPayload(stage1Messages);
const requestBody = JSON.stringify(payload);
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
assert.equal(buildAuthorizationHeader(credentialSentinel), `Bearer ${credentialSentinel}`);
assert.ok(!requestBody.includes(credentialSentinel));
assert.ok(!JSON.stringify(stage2Messages).includes(credentialSentinel));
assertProtocolError(() => buildAuthorizationHeader(` ${credentialSentinel}`), "CREDENTIAL_INVALID");
const redacted = serializeForArtifact({
  direct: credentialSentinel,
  nested: { [credentialSentinel]: [`prefix:${credentialSentinel}:suffix`] },
}, credentialSentinel);
assert.ok(!redacted.includes(credentialSentinel));
assert.ok(redacted.includes("[REDACTED_CREDENTIAL]"));
assert.equal(redactCredential(`a${credentialSentinel}b`, credentialSentinel), "a[REDACTED_CREDENTIAL]b");

const quoteBackslashCredential = 'CREDENTIAL_"QUOTE"\\BACKSLASH_SENTINEL';
const jsonEscapedCredential = JSON.stringify(quoteBackslashCredential).slice(1, -1);
const quoteBackslashSerialized = serializeForArtifact({
  error: `raw error ${quoteBackslashCredential}`,
  responseBody: JSON.stringify({ error: { message: quoteBackslashCredential } }),
  nested: {
    [`raw-key:${quoteBackslashCredential}`]: [
      quoteBackslashCredential,
      jsonEscapedCredential,
    ],
    [`escaped-key:${jsonEscapedCredential}`]: [
      quoteBackslashCredential,
      jsonEscapedCredential,
    ],
  },
}, quoteBackslashCredential);
assert.ok(!quoteBackslashSerialized.includes(quoteBackslashCredential));
assert.ok(!quoteBackslashSerialized.includes(jsonEscapedCredential));
assert.ok(quoteBackslashSerialized.includes("[REDACTED_CREDENTIAL]"));
const persistedQuoteBackslash = JSON.parse(quoteBackslashSerialized);
assert.equal(persistedQuoteBackslash.error, "raw error [REDACTED_CREDENTIAL]");
assert.equal(persistedQuoteBackslash.responseBody, '{"error":{"message":"[REDACTED_CREDENTIAL]"}}');
assert.deepEqual(persistedQuoteBackslash.nested, {
  "raw-key:[REDACTED_CREDENTIAL]": ["[REDACTED_CREDENTIAL]", "[REDACTED_CREDENTIAL]"],
  "escaped-key:[REDACTED_CREDENTIAL]": ["[REDACTED_CREDENTIAL]", "[REDACTED_CREDENTIAL]"],
});

assert.equal(requestTimeoutForDeadline(1_000, 901_000), 400_000);
assert.equal(requestTimeoutForDeadline(501_000, 901_000), 400_000);
assert.equal(requestTimeoutForDeadline(801_000, 901_000), 100_000);
assert.equal(requestTimeoutForDeadline(901_000, 901_000), 0);
assert.equal(requestTimeoutForDeadline(902_000, 901_000), 0);

const stage1Content = JSON.stringify(candidates);
const stage1CompletionBody = JSON.stringify({
  id: "CHAT_COMPLETION_SENTINEL_1",
  object: "chat.completion",
  created: 1,
  model: MODEL,
  choices: [{
    index: 0,
    message: { role: "assistant", content: stage1Content },
    finish_reason: "stop",
  }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});
assert.equal(unwrapChatCompletion(stage1CompletionBody), stage1Content);
assert.equal(
  unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    choices: [{
      message: { role: "assistant", content: stage1Content, tool_calls: [] },
      finish_reason: "stop",
    }],
  })),
  stage1Content,
);
assert.deepEqual(
  validateStage1Result(parseModelJson(unwrapChatCompletion(stage1CompletionBody)), receipts),
  candidates,
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({ model: MODEL, findings: [] })),
  "COMPLETION_INVALID",
);
assertProtocolError(() => unwrapChatCompletion("{"), "COMPLETION_INVALID");
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    choices: [{ message: { role: "assistant", reasoning_content: "REASONING_SENTINEL" }, finish_reason: "stop" }],
  })),
  "COMPLETION_CONTENT_INVALID",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    choices: [{ message: { role: "assistant", content: "TRUNCATED_CONTENT_SENTINEL" }, finish_reason: "length" }],
  })),
  "COMPLETION_NOT_FINISHED",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    error: { type: "SENTINEL_ERROR" },
  })),
  "COMPLETION_ERROR",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    choices: [{
      message: {
        role: "assistant",
        content: stage1Content,
        tool_calls: [{ id: "TOOL_CALL_SENTINEL" }],
      },
      finish_reason: "stop",
    }],
  })),
  "COMPLETION_TOOL_CALLS_UNSUPPORTED",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL,
    choices: [{
      message: {
        role: "assistant",
        content: stage1Content,
        tool_calls: { id: "TOOL_CALL_SENTINEL" },
      },
      finish_reason: "stop",
    }],
  })),
  "COMPLETION_TOOL_CALLS_UNSUPPORTED",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: "DIFFERENT_MODEL_SENTINEL",
    choices: [{
      message: { role: "assistant", content: stage1Content },
      finish_reason: "stop",
    }],
  })),
  "COMPLETION_MODEL_MISMATCH",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    choices: [{
      message: { role: "assistant", content: stage1Content },
      finish_reason: "stop",
    }],
  })),
  "COMPLETION_MODEL_MISMATCH",
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({
    model: MODEL.toUpperCase(),
    choices: [{
      message: { role: "assistant", content: stage1Content },
      finish_reason: "stop",
    }],
  })),
  "COMPLETION_MODEL_MISMATCH",
);

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

const stage2Context = {
  receipts,
  draft: input.draft,
  visibleSelfcheck: input.visibleSelfcheck,
  stage1Candidates: candidates.facts,
};
assertProtocolError(
  () => validateStage2Result({
    findings: [{
      kind: "SCOPE",
      issue: "Synthetic unknown candidate.",
      receipt_id: "RECEIPT_SENTINEL_1",
      evidence_quote: candidates.facts[0].quote,
      draft_quote: input.draft,
      stage1_candidate_id: "UNKNOWN_CANDIDATE_SENTINEL",
    }],
  }, stage2Context),
  "UNKNOWN_STAGE1_CANDIDATE",
);
assertProtocolError(
  () => validateStage2Result({
    findings: [{
      kind: "SCOPE",
      issue: "Synthetic cross-candidate receipt.",
      receipt_id: "RECEIPT_SENTINEL_2",
      evidence_quote: candidates.facts[1].quote,
      draft_quote: input.draft,
      stage1_candidate_id: "CANDIDATE_SENTINEL_1",
    }],
  }, stage2Context),
  "STAGE1_CANDIDATE_RECEIPT_MISMATCH",
);
assertProtocolError(
  () => validateStage2Result({
    findings: [{
      kind: "SCOPE",
      issue: "Synthetic cross-candidate quote.",
      receipt_id: "RECEIPT_SENTINEL_1",
      evidence_quote: candidates.facts[1].quote,
      draft_quote: input.draft,
      stage1_candidate_id: "CANDIDATE_SENTINEL_1",
    }],
  }, stage2Context),
  "STAGE1_CANDIDATE_QUOTE_MISMATCH",
);
const sameCandidateReview = validateStage2Result({
  findings: [{
    kind: "SCOPE",
    issue: "Synthetic same-candidate finding.",
    receipt_id: "RECEIPT_SENTINEL_1",
    evidence_quote: candidates.facts[0].quote,
    draft_quote: input.draft,
    stage1_candidate_id: "CANDIDATE_SENTINEL_1",
  }],
}, stage2Context);
assert.equal(sameCandidateReview.findings[0].stage1_candidate_id, "CANDIDATE_SENTINEL_1");
const stage2CompletionBody = JSON.stringify({
  id: "CHAT_COMPLETION_SENTINEL_2",
  object: "chat.completion",
  model: MODEL,
  choices: [{
    index: 0,
    message: { role: "assistant", content: JSON.stringify(sameCandidateReview) },
    finish_reason: "stop",
  }],
});
assert.deepEqual(
  validateStage2Result(parseModelJson(unwrapChatCompletion(stage2CompletionBody)), stage2Context),
  sameCandidateReview,
);

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
