/**
 * UNIT_NOT_MODEL_OR_NATIVE archive-order observer checks.
 *
 * AUTHORED_NOT_RUN. This is source-only finite evidence for the pure event
 * observer. It does not create a Native Session, Agent, request, or task; it
 * does not open files, use HTTP, call a model, or import a production SDK.
 */

import assert from 'node:assert/strict'

import {
  observeArchiveReadTimeline,
  type NativeEvent,
  type QuestionCallbackObservation,
} from './native-archive.mts'

const UNIT_DENIAL =
  'UNIT_ONLY_archive_match_requires_the_caller_supplied_civil_list_denial'
const NAMES = [
  '委托代理合同',
  '律师费发票',
  '授权委托书',
  '民事起诉状',
  '对账单',
  '微信图片_20260301',
  '聊天记录',
  '送货单',
  '民事调解书',
] as const
const ASK_SEQ = 90

function callEvent(
  seq: number,
  callId: string,
  name: string,
  args: Record<string, unknown>,
): NativeEvent {
  return {
    type: 'tool/call',
    seq,
    time: seq,
    data: { callId, name, arguments: args },
  }
}

function resultEvent(
  seq: number,
  callId: string,
  value: Record<string, unknown> | { readonly errorText: string },
): NativeEvent {
  const isError = 'errorText' in value
  const text = isError ? value.errorText : JSON.stringify(value)
  return {
    type: 'tool/result',
    seq,
    time: seq,
    data: {
      message: {
        isError,
        content: [{ type: 'text', text }],
        source: { callId },
      },
    },
  }
}

function listEvents(callSeq = 20, resultSeq = 21): NativeEvent[] {
  return [
    callEvent(callSeq, 'unit-list', 'case_list_materials', {}),
    resultEvent(
      resultSeq,
      'unit-list',
      { materials: NAMES.map(name => ({ name })) },
    ),
  ]
}

function matchEvents(
  callSeq = 30,
  resultSeq = 31,
  callId = 'unit-match',
): NativeEvent[] {
  return [
    callEvent(callSeq, callId, 'case_archive_match', { catalog: '民事行政卷' }),
    resultEvent(
      resultSeq,
      callId,
      {
        catalog: '民事行政卷',
        items: [],
        unmatched: [],
        ignored: [],
      },
    ),
  ]
}

function readEvents(callSeq = 40, resultSeq = 41): NativeEvent[] {
  return [
    callEvent(callSeq, 'unit-read', 'case_read_material', {
      name: '委托代理合同',
      start: 1,
      end: 1,
    }),
    resultEvent(resultSeq, 'unit-read', { name: '委托代理合同' }),
  ]
}

function denialEvents(
  callSeq: number,
  resultSeq: number,
  errorText: string,
  callId = 'unit-match-denied',
): NativeEvent[] {
  return [
    callEvent(callSeq, callId, 'case_archive_match', { catalog: '民事行政卷' }),
    resultEvent(resultSeq, callId, { errorText }),
  ]
}

function questionObservation(): QuestionCallbackObservation {
  return {
    allAskCallIds: ['unit-ask'],
    rejectedCalls: [],
    answeredCallIds: ['unit-ask'],
    questionIds: ['catalog', 'result', 'jzl_no', 'fee_settled'],
    answerIds: ['catalog', 'result', 'jzl_no', 'fee_settled'],
    questionTexts: ['unit-only joint archive question'],
    answerTexts: ['unit-only answers'],
    callbackAttempts: 1,
    successfulCallbackInvocations: 1,
    answeredCalls: [{
      callId: 'unit-ask',
      questionIds: ['catalog', 'result', 'jzl_no', 'fee_settled'],
      answerIds: ['catalog', 'result', 'jzl_no', 'fee_settled'],
      seq: ASK_SEQ,
      resultSeq: ASK_SEQ + 1,
      resultSha256: '0'.repeat(64),
      answered: true,
    }],
    lastRequiredAnswerSeq: ASK_SEQ + 1,
    currentRequestSeq: 1,
    turnStartSeq: 0,
    turnEndSeq: 100,
    successfulSaveAfterRequiredAnswers: true,
  }
}

function acceptedEvents(withPriorDenial = false): NativeEvent[] {
  const events = [
    ...(withPriorDenial
      ? denialEvents(10, 11, `Error: ${UNIT_DENIAL}`)
      : []),
    ...listEvents(),
    ...matchEvents(),
    ...readEvents(),
  ]
  return events.sort((left, right) => left.seq - right.seq)
}

const normal = observeArchiveReadTimeline(
  acceptedEvents(),
  questionObservation(),
  UNIT_DENIAL,
)
assert.equal(normal.archiveMatch.callId, 'unit-match')
assert.deepEqual(normal.timeline.successfulLists[0]?.names, [...NAMES])
assert.equal(normal.timeline.rejectedMatches.length, 0)
assert.equal(normal.timeline.successfulReads.length, 1)
assert.equal(normal.timeline.successfulReadsBeforeRequiredQuestions, true)

const recovered = observeArchiveReadTimeline(
  acceptedEvents(true),
  questionObservation(),
  UNIT_DENIAL,
)
assert.deepEqual(recovered.timeline.rejectedMatches.map(row => ({
  callId: row.callId,
  reason: row.reason,
  seq: row.seq,
  resultSeq: row.resultSeq,
})), [{
  callId: 'unit-match-denied',
  reason: 'case_list_before_archive_match',
  seq: 10,
  resultSeq: 11,
}])
assert.equal(recovered.archiveMatch.callId, 'unit-match')

assert.doesNotThrow(() => observeArchiveReadTimeline(
  acceptedEvents(true),
  questionObservation(),
  UNIT_DENIAL,
))
assert.throws(() => observeArchiveReadTimeline(
  acceptedEvents(true),
  questionObservation(),
  `${UNIT_DENIAL}_different_binding`,
), /unrelated or late denial/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...denialEvents(10, 11, 'Error: UNIT_UNKNOWN_REASON'),
    ...listEvents(),
    ...matchEvents(),
    ...readEvents(),
  ].sort((left, right) => left.seq - right.seq),
  questionObservation(),
  UNIT_DENIAL,
), /unrelated or late denial/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...listEvents(),
    ...denialEvents(22, 23, `Error: ${UNIT_DENIAL}`),
    ...matchEvents(),
    ...readEvents(),
  ].sort((left, right) => left.seq - right.seq),
  questionObservation(),
  UNIT_DENIAL,
), /unrelated or late denial/)

assert.throws(() => observeArchiveReadTimeline(
  [...matchEvents(), ...readEvents()],
  questionObservation(),
  UNIT_DENIAL,
), /exactly one actual case_list_materials call/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...listEvents(),
    ...matchEvents(30, 31, 'unit-match-one'),
    ...matchEvents(32, 33, 'unit-match-two'),
    ...readEvents(),
  ].sort((left, right) => left.seq - right.seq),
  questionObservation(),
  UNIT_DENIAL,
), /exactly one successful actual case_archive_match call/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...listEvents(),
    callEvent(30, 'unit-match', 'case_archive_match', { catalog: '民事行政卷' }),
    ...readEvents(),
  ],
  questionObservation(),
  UNIT_DENIAL,
), /tool result is missing/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...listEvents(),
    callEvent(30, 'unit-match', 'case_archive_match', { catalog: '民事行政卷' }),
    resultEvent(31, 'unit-foreign', {
      catalog: '民事行政卷',
      items: [],
      unmatched: [],
      ignored: [],
    }),
    ...readEvents(),
  ],
  questionObservation(),
  UNIT_DENIAL,
), /tool result is missing/)

assert.throws(() => observeArchiveReadTimeline(
  [
    ...matchEvents(10, 11),
    ...listEvents(20, 21),
    ...readEvents(),
  ].sort((left, right) => left.seq - right.seq),
  questionObservation(),
  UNIT_DENIAL,
), /preceded the successful material list/)

process.stdout.write(
  'UNIT_NOT_MODEL_OR_NATIVE archive-order-finite: 10 red/green cases authored\n',
)
