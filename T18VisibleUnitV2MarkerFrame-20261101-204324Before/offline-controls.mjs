import assert from "node:assert/strict";
import {
  COMPLETION_STATUS,
  ENTIRE_CALL_CAP_MS,
  FIXED_DATA_FORMAT,
  MAX_SEQUENTIAL_CALLS,
  MODEL,
  PARAMETERS,
  PER_CALL_TIMEOUT_MS,
  RESPONSE_CAP_BYTES,
  ROUTE,
  buildAuthorizationHeader,
  buildRequestPayload,
  buildSpanTables,
  buildStage1Envelope,
  buildStage1Messages,
  buildStage2Envelope,
  buildStage2Messages,
  buildVisibleUnits,
  joinAssessmentsToUnits,
  outputStatusForReviews,
  parseModelJson,
  performRequest,
  redactCredential,
  requestTimeoutForDeadline,
  selectPilotInput,
  serializeForArtifact,
  unwrapChatCompletion,
  validateStage1Result,
  validateStage2Result,
} from "./review-consumer.mjs";

const REDACTION_MARKER = "\u2588";

function assertProtocolError(fn, expectedCode) {
  assert.throws(fn, (error) => error && error.code === expectedCode);
}

function cloneStage2Records(records) {
  return records.map((record) => ({
    ...record,
    draft_refs: [...record.draft_refs],
    selfcheck_refs: [...record.selfcheck_refs],
    issues: [...record.issues],
  }));
}

const label7 = "\u3010\u7B2C7\u884C\u3011";
const label8 = "\u3010\u7B2C8\u884C\u3011";
const label9 = "\u3010\u7B2C9\u884C\u3011";
const receiptText = [
  label7,
  "HEADER_SENTINEL only",
  label8,
  "",
  label9,
  "DETAIL_SENTINEL independent detail.",
  "",
].join("\n");
const receipt = {
  receipt_id: "RECEIPT_SENTINEL",
  material_id: "MATERIAL_SENTINEL",
  unit: "line",
  text: receiptText,
  start: 7,
  end: 9,
};
const input = {
  receipts: [receipt],
  draft: "DRAFT_ONE_SENTINEL first line.\nDRAFT_TWO_SENTINEL second line.\n",
  visibleSelfcheck: "SELFCHECK_ONE_SENTINEL first line.\n",
  actualCoverage: { note: "COVERAGE_SENTINEL" },
};
const fixedData = {
  format: FIXED_DATA_FORMAT,
  evidence: input.receipts,
  draft: {
    content: input.draft,
    title: "DRAFT_TITLE_SENTINEL",
    version: 3,
  },
  visible_selfcheck: input.visibleSelfcheck,
  coverage: input.actualCoverage,
};

const selectedInput = selectPilotInput(fixedData);
assert.equal(selectedInput.receipts, input.receipts);
assert.equal(selectedInput.draft, input.draft);
assert.equal(selectedInput.visibleSelfcheck, input.visibleSelfcheck);
assert.equal(selectedInput.actualCoverage, input.actualCoverage);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, draft: { ...fixedData.draft, version: "3" } }),
  "ORIGINAL_DRAFT_NOT_TEXT",
);
assertProtocolError(
  () => selectPilotInput({ ...fixedData, evidence_receipts: input.receipts, evidence: undefined }),
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

// Three synthetic visible units: a header-only unit, a blank unit, and an independent detail.
const units = buildVisibleUnits(input.receipts);
assert.deepEqual(units.map((unit) => unit.unit_id), [
  "RECEIPT_SENTINEL#L7",
  "RECEIPT_SENTINEL#L8",
  "RECEIPT_SENTINEL#L9",
]);
assert.deepEqual(units.map((unit) => unit.unit), ["line", "line", "line"]);
assert.deepEqual(units.map((unit) => unit.text), [
  `${label7}\nHEADER_SENTINEL only\n`,
  `${label8}\n\n`,
  `${label9}\nDETAIL_SENTINEL independent detail.\n`,
]);
assert.equal(units.map((unit) => unit.text).join(""), receiptText);
assert.equal(units.length, 3);
assert.ok(units[0].text.endsWith("\n"));
assert.equal(units[1].text, `${label8}\n\n`);
assert.ok(units[2].text.startsWith(`${label9}\n`));
assert.ok(units[2].text.endsWith(".\n"));

assertProtocolError(
  () => buildVisibleUnits([{ ...receipt, unit: "page" }]),
  "UNIT_LABEL_INVALID",
);
assertProtocolError(
  () => buildVisibleUnits([{ ...receipt, unit: "line_label" }]),
  "UNIT_LABEL_INVALID",
);
assertProtocolError(
  () => buildVisibleUnits([{ ...receipt, text: `PREFIX_SENTINEL\n${receiptText}` }]),
  "FIRST_MARKER_NOT_AT_START",
);
assertProtocolError(
  () => buildVisibleUnits([{
    ...receipt,
    text: `${label7}\nHEADER_SENTINEL only\n\u3010\u7B2C10\u884C\u3011\n\n${label9}\nDETAIL_SENTINEL independent detail.\n`,
  }]),
  "MARKER_SEQUENCE_INVALID",
);
assertProtocolError(
  () => buildVisibleUnits([{
    ...receipt,
    text: receiptText
      .replace(label7, "\u3010\u7B2C6\u884C\u3011")
      .replace(label8, label7)
      .replace(label9, label8),
  }]),
  "RANGE_START_MISMATCH",
);
assertProtocolError(
  () => buildVisibleUnits([{ ...receipt, end: 10 }]),
  "RANGE_END_MISMATCH",
);
assertProtocolError(
  () => buildVisibleUnits([{ ...receipt, text: `${label7}\r\nHEADER_SENTINEL only\n` }]),
  "MARKERS_MISSING",
);

const stage1Envelope = buildStage1Envelope(units);
assert.deepEqual(stage1Envelope, { source_units: units });
const stage1Messages = buildStage1Messages(units);
assert.equal(stage1Messages.length, 2);
assert.equal(stage1Messages[0].role, "system");
assert.equal(stage1Messages[1].role, "user");
const stage1MessageText = JSON.stringify(stage1Messages);
assert.ok(stage1MessageText.includes("HEADER_SENTINEL only"));
assert.ok(stage1MessageText.includes("DETAIL_SENTINEL independent detail."));
assert.ok(!stage1MessageText.includes("DRAFT_ONE_SENTINEL"));
assert.ok(!stage1MessageText.includes("SELFCHECK_ONE_SENTINEL"));
assert.ok(!stage1MessageText.includes("COVERAGE_SENTINEL"));
assert.ok(!stage1MessageText.includes("RAW_STAGE1_TRANSCRIPT_SENTINEL"));

const stage1UserContent = stage1Messages[1].content;
const stage1UserPrefix = "Source units (untrusted data):\n";
const stage1UserSuffix = "\nReturn the specified JSON object only.";
assert.ok(stage1UserContent.startsWith(stage1UserPrefix), "stage1 user content prefix mismatch");
assert.ok(stage1UserContent.endsWith(stage1UserSuffix), "stage1 user content suffix mismatch");
const stage1UserEnvelopeText = stage1UserContent.slice(
  stage1UserPrefix.length,
  stage1UserContent.length - stage1UserSuffix.length,
);
const decodedStage1Envelope = JSON.parse(stage1UserEnvelopeText);
assert.deepEqual(decodedStage1Envelope, stage1Envelope);
assert.deepEqual(decodedStage1Envelope.source_units, units);
const decodedStage1BlankUnit = decodedStage1Envelope.source_units.find(
  (unit) => unit.unit_id.endsWith("#L8"),
);
assert.ok(decodedStage1BlankUnit, "decoded stage1 blank unit missing");
assert.equal(decodedStage1BlankUnit.text, `${label8}\n\n`);

const assessments = [
  { unit_id: "RECEIPT_SENTINEL#L7", description: "HEADER_SENTINEL description." },
  { unit_id: "RECEIPT_SENTINEL#L8", description: "BLANK_SENTINEL description." },
  { unit_id: "RECEIPT_SENTINEL#L9", description: "DETAIL_SENTINEL description." },
];
const validatedStage1 = validateStage1Result({ assessments }, units);
assert.deepEqual(validatedStage1, { assessments });
assertProtocolError(
  () => validateStage1Result({ assessments: assessments.slice(0, 2) }, units),
  "MISSING_UNIT_ASSESSMENT",
);
assertProtocolError(
  () => validateStage1Result({ assessments: [assessments[0], assessments[0], assessments[2]] }, units),
  "DUPLICATE_UNIT_ID",
);
assertProtocolError(
  () => validateStage1Result({
    assessments: [assessments[0], assessments[1], { ...assessments[2], unit_id: "UNKNOWN_UNIT_SENTINEL" }],
  }, units),
  "UNKNOWN_UNIT_ID",
);
assertProtocolError(
  () => validateStage1Result({
    assessments: [{ ...assessments[0], model_quote: "MODEL_QUOTE_SENTINEL" }, assessments[1], assessments[2]],
  }, units),
  "ASSESSMENT_SCHEMA_INVALID",
);
assertProtocolError(
  () => validateStage1Result({ assessments, transcript: "RAW_STAGE1_TRANSCRIPT_SENTINEL" }, units),
  "RESPONSE_SCHEMA_INVALID",
);

const joinedUnits = joinAssessmentsToUnits(units, validatedStage1.assessments);
assert.deepEqual(joinedUnits.map((unit) => unit.text), units.map((unit) => unit.text));
assert.deepEqual(joinedUnits.map((unit) => unit.description), assessments.map((item) => item.description));
assert.deepEqual(units.map((unit) => unit.text), [
  `${label7}\nHEADER_SENTINEL only\n`,
  `${label8}\n\n`,
  `${label9}\nDETAIL_SENTINEL independent detail.\n`,
]);

const spans = buildSpanTables(input.draft, input.visibleSelfcheck);
assert.equal(spans.draftSpans.map((span) => span.text).join(""), input.draft);
assert.equal(spans.selfcheckSpans.map((span) => span.text).join(""), input.visibleSelfcheck);
assert.equal(spans.draftSpans[0].text, "DRAFT_ONE_SENTINEL first line.\n");
assert.equal(spans.draftSpans[1].text, "DRAFT_TWO_SENTINEL second line.\n");
assert.equal(spans.selfcheckSpans[0].text, "SELFCHECK_ONE_SENTINEL first line.\n");

const stage2Envelope = buildStage2Envelope(
  units,
  validatedStage1.assessments,
  spans.draftSpans,
  spans.selfcheckSpans,
  input.actualCoverage,
);
assert.deepEqual(Object.keys(stage2Envelope).sort(), [
  "actual_coverage",
  "original_draft_spans",
  "source_units",
  "visible_selfcheck_spans",
]);
assert.deepEqual(stage2Envelope.source_units, joinedUnits);
assert.deepEqual(stage2Envelope.source_units.map((unit) => unit.text), units.map((unit) => unit.text));
assert.deepEqual(stage2Envelope.original_draft_spans, spans.draftSpans);
assert.deepEqual(stage2Envelope.visible_selfcheck_spans, spans.selfcheckSpans);
assert.equal(stage2Envelope.actual_coverage, input.actualCoverage);

const stage2Messages = buildStage2Messages(
  units,
  validatedStage1.assessments,
  spans.draftSpans,
  spans.selfcheckSpans,
  input.actualCoverage,
);
assert.equal(stage2Messages.length, 2);
const stage2MessageText = JSON.stringify(stage2Messages);
assert.ok(stage2MessageText.includes("HEADER_SENTINEL description."));
assert.ok(stage2MessageText.includes("COVERAGE_SENTINEL"));
assert.ok(!stage2MessageText.includes("RAW_STAGE1_TRANSCRIPT_SENTINEL"));

const stage2UserContent = stage2Messages[1].content;
const stage2UserPrefix = "Review inputs (untrusted data):\n";
const stage2UserSuffix = "\nReturn the specified JSON object only.";
assert.ok(stage2UserContent.startsWith(stage2UserPrefix), "stage2 user content prefix mismatch");
assert.ok(stage2UserContent.endsWith(stage2UserSuffix), "stage2 user content suffix mismatch");
const stage2UserEnvelopeText = stage2UserContent.slice(
  stage2UserPrefix.length,
  stage2UserContent.length - stage2UserSuffix.length,
);
const decodedStage2Envelope = JSON.parse(stage2UserEnvelopeText);
assert.deepEqual(decodedStage2Envelope, stage2Envelope);
assert.deepEqual(decodedStage2Envelope.source_units, joinedUnits);
assert.deepEqual(decodedStage2Envelope.original_draft_spans, spans.draftSpans);
assert.deepEqual(decodedStage2Envelope.visible_selfcheck_spans, spans.selfcheckSpans);
assert.deepEqual(decodedStage2Envelope.actual_coverage, input.actualCoverage);
assert.ok(
  decodedStage2Envelope.original_draft_spans[0].text.endsWith("\n"),
  "decoded stage2 draft span must end with a real newline",
);
assert.ok(
  decodedStage2Envelope.original_draft_spans[0].text.includes("DRAFT_ONE_SENTINEL first line.\n"),
  "decoded stage2 draft span text mismatch",
);
assert.ok(
  decodedStage2Envelope.visible_selfcheck_spans[0].text.includes("SELFCHECK_ONE_SENTINEL first line.\n"),
  "decoded stage2 selfcheck span text mismatch",
);
assert.ok(
  !decodedStage2Envelope.original_draft_spans.some((span) => span.text.includes("\\n")),
  "decoded stage2 draft spans must not contain escaped newlines",
);
assert.ok(
  !decodedStage2Envelope.visible_selfcheck_spans.some((span) => span.text.includes("\\n")),
  "decoded stage2 selfcheck spans must not contain escaped newlines",
);

const validReviewRecords = [
  {
    unit_id: "RECEIPT_SENTINEL#L7",
    treatment: "ADDRESSED",
    assessment: "HEADER_SENTINEL treatment.",
    draft_refs: ["D:1"],
    selfcheck_refs: ["S:1"],
    issues: [],
  },
  {
    unit_id: "RECEIPT_SENTINEL#L8",
    treatment: "OMITTED",
    assessment: "BLANK_SENTINEL treatment.",
    draft_refs: [],
    selfcheck_refs: [],
    issues: [],
  },
  {
    unit_id: "RECEIPT_SENTINEL#L9",
    treatment: "UNCLEAR",
    assessment: "DETAIL_SENTINEL treatment.",
    draft_refs: ["D:2"],
    selfcheck_refs: [],
    issues: [],
  },
];
const stage2Context = {
  units,
  draftSpans: spans.draftSpans,
  selfcheckSpans: spans.selfcheckSpans,
};
const validatedStage2 = validateStage2Result({
  reviews: [
    validReviewRecords[2],
    validReviewRecords[0],
    validReviewRecords[1],
  ],
}, stage2Context);
assert.deepEqual(validatedStage2.reviews.map((review) => review.unit_id), units.map((unit) => unit.unit_id));
assert.deepEqual(validatedStage2.reviews.map((review) => review.source.text), units.map((unit) => unit.text));
assert.deepEqual(validatedStage2.reviews[0].draft_quotes, ["DRAFT_ONE_SENTINEL first line.\n"]);
assert.deepEqual(validatedStage2.reviews[0].selfcheck_quotes, ["SELFCHECK_ONE_SENTINEL first line.\n"]);
assert.deepEqual(validatedStage2.reviews[2].draft_quotes, ["DRAFT_TWO_SENTINEL second line.\n"]);
assert.deepEqual(validatedStage2.reviews[1].draft_quotes, []);
assert.deepEqual(validatedStage2.reviews[1].selfcheck_quotes, []);
assert.ok(validatedStage2.reviews.every((review) => review.issues.length === 0));
assert.equal(outputStatusForReviews(validatedStage2.reviews), COMPLETION_STATUS);
assert.equal(outputStatusForReviews(validatedStage2.reviews), "UNIT_REVIEW_COMPLETE_REQUIRES_ROOT_MANUAL_JUDGMENT");
assert.notEqual(outputStatusForReviews(validatedStage2.reviews), "PASS");

assertProtocolError(
  () => validateStage2Result({ reviews: validReviewRecords.slice(0, 2) }, stage2Context),
  "MISSING_UNIT_REVIEW",
);
assertProtocolError(
  () => validateStage2Result({ reviews: [validReviewRecords[0], validReviewRecords[0], validReviewRecords[2]] }, stage2Context),
  "DUPLICATE_UNIT_ID",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [validReviewRecords[0], validReviewRecords[1], { ...validReviewRecords[2], unit_id: "UNKNOWN_UNIT_SENTINEL" }],
  }, stage2Context),
  "UNKNOWN_UNIT_ID",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], draft_refs: ["D:999"] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "UNKNOWN_DRAFT_SPAN_REF",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], draft_refs: ["D:1", "D:1"] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "DRAFT_REF_DUPLICATE",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], selfcheck_refs: ["S:999"] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "UNKNOWN_SELFCHECK_SPAN_REF",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], selfcheck_refs: ["S:1", "S:1"] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "SELFCHECK_REF_DUPLICATE",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], draft_refs: [] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "ADDRESSED_WITHOUT_DRAFT_REF",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], source_quote: "MODEL_SOURCE_QUOTE_SENTINEL" }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "REVIEW_SCHEMA_INVALID",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], draft_quotes: ["MODEL_DRAFT_QUOTE_SENTINEL"] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "REVIEW_SCHEMA_INVALID",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], treatment: "PASS" }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "TREATMENT_INVALID",
);
assertProtocolError(
  () => validateStage2Result({ reviews: validReviewRecords, overallPASS: true }, stage2Context),
  "RESPONSE_SCHEMA_INVALID",
);
assertProtocolError(
  () => validateStage2Result({
    reviews: [{ ...validReviewRecords[0], issues: ["   "] }, validReviewRecords[1], validReviewRecords[2]],
  }, stage2Context),
  "ISSUE_INVALID",
);

const passIssueRecords = cloneStage2Records(validReviewRecords);
passIssueRecords[0].issues = ["PASS"];
const passIssueResult = validateStage2Result({ reviews: passIssueRecords }, stage2Context);
assert.deepEqual(passIssueResult.reviews[0].issues, ["PASS"]);
assert.equal(outputStatusForReviews(passIssueResult.reviews), COMPLETION_STATUS);
assert.notEqual(outputStatusForReviews(passIssueResult.reviews), "PASS");

const stage2CompletionBody = JSON.stringify({
  id: "CHAT_COMPLETION_SENTINEL_2",
  object: "chat.completion",
  model: MODEL,
  choices: [{
    index: 0,
    message: { role: "assistant", content: JSON.stringify({ reviews: validReviewRecords }) },
    finish_reason: "stop",
  }],
});
assert.deepEqual(
  validateStage2Result(parseModelJson(unwrapChatCompletion(stage2CompletionBody)), stage2Context),
  validatedStage2,
);

const payload = buildRequestPayload(stage1Messages);
const requestBody = JSON.stringify(payload);
assert.equal(ROUTE, "http://10.126.126.1:8000/v1/chat/completions");
assert.equal(MAX_SEQUENTIAL_CALLS, 2);
assert.equal(PER_CALL_TIMEOUT_MS, 400_000);
assert.equal(ENTIRE_CALL_CAP_MS, 900_000);
assert.equal(RESPONSE_CAP_BYTES, 4 * 1024 * 1024);
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
assert.ok(redacted.includes(REDACTION_MARKER));
assert.equal(redactCredential(`a${credentialSentinel}b`, credentialSentinel), `a${REDACTION_MARKER}b`);

// The Unicode block is outside printable ASCII, including its JSON-escaped spelling.
assert.ok([...REDACTION_MARKER].every((character) => character.charCodeAt(0) > 126));
assert.ok([...JSON.stringify(REDACTION_MARKER).slice(1, -1)].every((character) => character.charCodeAt(0) > 126));
assert.equal(REDACTION_MARKER, "\u2588");

const oneCharCredential = "R";
assert.equal(buildAuthorizationHeader(oneCharCredential), "Bearer R");
const oneCharSerialized = serializeForArtifact({
  direct: oneCharCredential,
  error: `raw error ${oneCharCredential} tail`,
  jsonbody: JSON.stringify({ message: oneCharCredential }),
  nested: {
    [`raw-key:${oneCharCredential}`]: [oneCharCredential, oneCharCredential],
  },
}, oneCharCredential);
assert.ok(!oneCharSerialized.includes(oneCharCredential));
const persistedOneChar = JSON.parse(oneCharSerialized);
assert.equal(persistedOneChar.direct, REDACTION_MARKER);
assert.equal(persistedOneChar.error, `raw error ${REDACTION_MARKER} tail`);
assert.equal(persistedOneChar.jsonbody, `{"message":"${REDACTION_MARKER}"}`);
assert.deepEqual(persistedOneChar.nested, {
  [`raw-key:${REDACTION_MARKER}`]: [REDACTION_MARKER, REDACTION_MARKER],
});

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
assert.ok(quoteBackslashSerialized.includes(REDACTION_MARKER));
const persistedQuoteBackslash = JSON.parse(quoteBackslashSerialized);
assert.equal(persistedQuoteBackslash.error, `raw error ${REDACTION_MARKER}`);
assert.equal(persistedQuoteBackslash.responseBody, `{"error":{"message":"${REDACTION_MARKER}"}}`);
assert.deepEqual(persistedQuoteBackslash.nested, {
  [`raw-key:${REDACTION_MARKER}`]: [REDACTION_MARKER, REDACTION_MARKER],
  [`escaped-key:${REDACTION_MARKER}`]: [REDACTION_MARKER, REDACTION_MARKER],
});

assert.equal(requestTimeoutForDeadline(1_000, 901_000), 400_000);
assert.equal(requestTimeoutForDeadline(501_000, 901_000), 400_000);
assert.equal(requestTimeoutForDeadline(801_000, 901_000), 100_000);
assert.equal(requestTimeoutForDeadline(901_000, 901_000), 0);
assert.equal(requestTimeoutForDeadline(902_000, 901_000), 0);

const stage1Content = JSON.stringify({ assessments });
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
  validateStage1Result(parseModelJson(unwrapChatCompletion(stage1CompletionBody)), units),
  validatedStage1,
);
assertProtocolError(
  () => unwrapChatCompletion(JSON.stringify({ model: MODEL, assessments: [] })),
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

assert.deepEqual(parseModelJson('{"reviews":[]}'), { reviews: [] });
assert.deepEqual(parseModelJson('```json\n{"reviews":[]}\n```'), { reviews: [] });
assertProtocolError(() => parseModelJson('prefix {"reviews":[]}'), "MALFORMED_JSON");
assertProtocolError(() => parseModelJson('```json\n```json\n{"reviews":[]}\n```\n```'), "MALFORMED_JSON");

// --- Response-path controls against the SAME exported performRequest implementation ---
// No network, real timers, sleep calls, or model calls: globalThis.fetch is replaced in memory
// and restored in a finally block.
function makeFakeResponse({ status, chunks, throwAfterChunks }) {
  const state = { cancelCalls: 0, releaseLockCalls: 0, reads: 0 };
  const reader = {
    async read() {
      state.reads += 1;
      if (state.reads <= chunks.length) {
        return { done: false, value: new Uint8Array(Buffer.from(chunks[state.reads - 1], "utf8")) };
      }
      if (throwAfterChunks) {
        const failure = new Error("FAKE_READER_FAILURE_SENTINEL");
        failure.name = "FakeReaderFailure";
        throw failure;
      }
      return { done: true, value: undefined };
    },
    async cancel() {
      state.cancelCalls += 1;
      return undefined;
    },
    releaseLock() {
      state.releaseLockCalls += 1;
    },
  };
  return {
    response: { status, body: { getReader: () => reader } },
    state,
  };
}

const fakeCredential = "OFFLINE_FAKE_CREDENTIAL_SENTINEL";
const fakeRequestBody = JSON.stringify({ model: MODEL, probe: "FAKE_REQUEST_BODY_SENTINEL" });
const originalFetch = globalThis.fetch;
try {
  // Partial response: one prefix chunk, then a reader failure.
  const failing = makeFakeResponse({
    status: 200,
    chunks: ["{\"partial_prefix\":"],
    throwAfterChunks: true,
  });
  let fetchCalls = 0;
  const failingCalls = [];
  globalThis.fetch = async (url, options) => {
    fetchCalls += 1;
    failingCalls.push({ url, options });
    return failing.response;
  };
  const failingResult = await performRequest(
    "stage1",
    fakeRequestBody,
    fakeCredential,
    Date.now() + ENTIRE_CALL_CAP_MS,
  );
  assert.equal(fetchCalls, 1);
  assert.equal(failingCalls[0].url, ROUTE);
  assert.equal(failingCalls[0].options.method, "POST");
  assert.equal(failingCalls[0].options.redirect, "error");
  assert.equal(failingCalls[0].options.headers.Authorization, `Bearer ${fakeCredential}`);
  assert.ok(failingCalls[0].options.signal);
  assert.equal(failingResult.status, 200);
  assert.equal(failingResult.body, "{\"partial_prefix\":");
  assert.equal(failingResult.capturedBytes, Buffer.byteLength("{\"partial_prefix\":", "utf8"));
  assert.equal(failingResult.responseOverflow, false);
  assert.equal(failingResult.transportError, "TRANSPORT_FAILURE");
  assert.equal(failing.state.cancelCalls, 1);
  assert.equal(failing.state.releaseLockCalls, 1);

  // Complete response: all chunks returned, no reader failure.
  const complete = makeFakeResponse({
    status: 200,
    chunks: ["{\"ok\":", "true}"],
    throwAfterChunks: false,
  });
  globalThis.fetch = async () => complete.response;
  const completeResult = await performRequest(
    "stage1",
    fakeRequestBody,
    fakeCredential,
    Date.now() + ENTIRE_CALL_CAP_MS,
  );
  assert.equal(completeResult.status, 200);
  assert.equal(completeResult.body, "{\"ok\":true}");
  assert.equal(completeResult.capturedBytes, Buffer.byteLength("{\"ok\":true}", "utf8"));
  assert.equal(completeResult.responseOverflow, false);
  assert.equal(completeResult.transportError, null);
  assert.equal(complete.state.cancelCalls, 0);
  assert.equal(complete.state.releaseLockCalls, 1);

  // Response cap: an oversized chunk is never retained and the reader is cancelled.
  const overflow = makeFakeResponse({
    status: 200,
    chunks: ["A".repeat(RESPONSE_CAP_BYTES + 1)],
    throwAfterChunks: false,
  });
  globalThis.fetch = async () => overflow.response;
  const overflowResult = await performRequest(
    "stage1",
    fakeRequestBody,
    fakeCredential,
    Date.now() + ENTIRE_CALL_CAP_MS,
  );
  assert.equal(overflowResult.status, 200);
  assert.equal(overflowResult.body, "");
  assert.equal(overflowResult.capturedBytes, 0);
  assert.equal(overflowResult.responseOverflow, true);
  assert.equal(overflowResult.transportError, null);
  assert.equal(overflow.state.cancelCalls, 1);
  assert.equal(overflow.state.releaseLockCalls, 1);

  // Already-expired deadline: no fetch attempt.
  let expiredFetchCalls = 0;
  globalThis.fetch = async () => {
    expiredFetchCalls += 1;
    throw new Error("SHOULD_NOT_BE_CALLED");
  };
  await assert.rejects(
    () => performRequest("stage1", fakeRequestBody, fakeCredential, Date.now() - 1),
    (error) => error && error.code === "ENTIRE_CALL_CAP_EXCEEDED",
  );
  assert.equal(expiredFetchCalls, 0);
} finally {
  globalThis.fetch = originalFetch;
}

process.stdout.write("offline controls passed\n");
