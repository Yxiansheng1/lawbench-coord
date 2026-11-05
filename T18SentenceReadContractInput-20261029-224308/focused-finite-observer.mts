/**
 * Source-only UNIT checks for the T18 sentence observation layer.
 *
 * This file creates all controlled Native event shapes in memory. Its sole
 * external read is the old gySbhT actual JSONL, opened read-only to prove that
 * the genuine legacy run remains RED. It has no Agent, Context, model, HTTP,
 * credential, product, store, or session-writing path.
 */

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  observeCalculationAndSaveTimeline,
  observeQuestionCallbacks,
  observeReadTimeline,
  type NativeEvent,
  type QuestionCallbackObservation,
} from './native-sentence-calc.mts'

const REQUEST_ID = 'unit-current-request'
const WRONG_REQUEST_ID = 'unit-wrong-request'
const ASK_CALL_ID = 'unit-ask'
const LIST_CALL_ID = 'unit-list'
const READ_CALL_ID = 'unit-read'
const CALC_CALL_ID = 'unit-calc'
const SAVE_CALL_ID = 'unit-save'
const MATERIAL_NAMES = [
  '刑事判决书',
  '拘留证',
  '羁押情况证明',
  '起诉意见书',
  '逮捕证',
] as const
const QUESTION_IDS = ['purpose', 'penalty', 'custody'] as const
const ANSWERS = {
  purpose: 'UNIT-purpose',
  penalty: 'UNIT-penalty',
  custody: 'UNIT-custody',
} as const
const CASE_LIST_DENIAL = '刑期计算必须先调用 case_list_materials 取得本案的真实材料清单，再读取案件材料。'
const questionRequirementDenial = (missing: readonly string[]): string => (
  `提交成果前必须先取得律师对必问问题的真实回答。还缺：${missing.join('、')}`
)
const invalidQuestionAskDenial = (missing: readonly string[]): string => (
  `ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：${missing.join('、')}`
)
const QUESTION_DENIAL = questionRequirementDenial(QUESTION_IDS)
const LEGACY_JSONL =
  'D:\\Lawbeach\\lawbench-B\\docs\\plan\\evidence\\T18\\SentenceApiObservation-20261029-214710\\'
  + 'run-gySbhT\\sessions\\--D-Lawbeach-lawbench-B-docs-plan-evidence-T18-SentenceApiObservation-'
  + '20261029-214710-run-gySbhT-case--\\session-9450ce32-36ec-4596-80c1-75fa29824de5\\session.v4.jsonl'

type Operation =
  | {
    readonly kind: 'call'
    readonly callId: string
    readonly name: string
    readonly args: Record<string, unknown>
  }
  | {
    readonly kind: 'result'
    readonly callId: string
    readonly value: unknown
    readonly isError?: boolean
  }

interface UnitCaseResult {
  readonly name: string
  readonly expected: 'PASS' | 'RED'
  readonly observed: 'PASS' | 'RED'
  readonly source: 'controlled-events' | 'old-gySbhT-jsonl-readonly'
  readonly detail: string
}

function call(callId: string, name: string, args: Record<string, unknown>): Operation {
  return { kind: 'call', callId, name, args }
}

function result(callId: string, value: unknown, isError = false): Operation {
  return { kind: 'result', callId, value, isError }
}

function toolResultCallId(event: NativeEvent): string | undefined {
  if (event.type !== 'tool/result') return undefined
  const data = event.data as Record<string, unknown>
  const message = data.message
  if (message === null || typeof message !== 'object') return undefined
  const source = (message as Record<string, unknown>).source
  if (source === null || typeof source !== 'object') return undefined
  const callId = (source as Record<string, unknown>).callId
  return typeof callId === 'string' ? callId : undefined
}

function eventsFrom(
  operations: readonly Operation[],
  requestId: string = REQUEST_ID,
): NativeEvent[] {
  const events: NativeEvent[] = [{
    type: 'turn/start',
    seq: 1,
    time: 1,
    data: { turn: 1 },
  }, {
    type: 'user/message',
    seq: 2,
    time: 2,
    data: {
      id: 'unit-user',
      role: 'user',
      content: [{ type: 'text', text: 'UNIT current request' }],
      source: { kind: 'user', rpcId: requestId },
    },
  }]
  let seq = 2
  for (const operation of operations) {
    seq += 1
    if (operation.kind === 'call') {
      events.push({
        type: 'tool/call',
        seq,
        time: seq,
        data: {
          turn: 1,
          step: seq,
          callId: operation.callId,
          name: operation.name,
          arguments: JSON.stringify(operation.args),
        },
      })
      continue
    }
    seq += 1
    const text = typeof operation.value === 'string'
      ? operation.value
      : JSON.stringify(operation.value)
    events.push({
      type: 'tool/result',
      seq,
      time: seq,
      data: {
        turn: 1,
        step: seq,
        message: {
          role: 'tool',
          source: { kind: 'tool', callId: operation.callId },
          toolCallId: operation.callId,
          content: [{ type: 'text', text }],
          isError: operation.isError === true,
        },
      },
    })
  }
  events.push({
    type: 'turn/end',
    seq: seq + 1,
    time: seq + 1,
    data: { reason: { kind: 'completed' } },
  })
  return events
}

function listResult(): Record<string, unknown> {
  return { materials: MATERIAL_NAMES.map(name => ({ name })) }
}

function readArguments(): Record<string, unknown> {
  return {
    name: MATERIAL_NAMES[0],
    more_names: MATERIAL_NAMES.slice(1),
  }
}

function readResult(): Record<string, unknown> {
  return {
    parts: MATERIAL_NAMES.map((name, index) => ({
      name,
      material_id: `M${index + 1}`,
      read: true,
    })),
  }
}

function askArguments(): Record<string, unknown> {
  return {
    questions: QUESTION_IDS.map(id => ({
      id,
      question: `UNIT question ${id}`,
    })),
  }
}

function askResult(): Record<string, unknown> {
  return {
    answers: QUESTION_IDS.map(id => ({
      id,
      selected: [],
      custom: ANSWERS[id],
    })),
  }
}

function orderedOperations(options: {
  readonly calcBeforeAsk?: boolean
  readonly duplicateCalc?: boolean
  readonly failedCalcAfterUnlock?: boolean
} = {}): Operation[] {
  const answerIndex = 4
  const operations: Operation[] = [
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
  ]
  const insertAt = options.calcBeforeAsk === true ? answerIndex : operations.length
  operations.splice(
    insertAt,
    0,
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
  )
  if (options.duplicateCalc === true) {
    operations.push(
      call('unit-calc-duplicate', 'case_calc_sentence', { penalty: 'UNIT' }),
      result('unit-calc-duplicate', { start: null, custody_days: 1 }),
    )
  }
  if (options.failedCalcAfterUnlock === true) {
    operations.push(
      call('unit-calc-after-unlock-error', 'case_calc_sentence', { penalty: 'UNIT' }),
      result('unit-calc-after-unlock-error', `Error: ${QUESTION_DENIAL}`, true),
    )
  }
  operations.push(
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 1 }),
  )
  return operations
}

function observe(
  events: readonly NativeEvent[],
  requestId: string = REQUEST_ID,
  callbackAttempts = 1,
): {
  readonly question: QuestionCallbackObservation
  readonly read: ReturnType<typeof observeReadTimeline>
  readonly calculation: ReturnType<typeof observeCalculationAndSaveTimeline>
} {
  const question = observeQuestionCallbacks(events, {
    callbackAttempts,
    successfulCallbackInvocations: 1,
    declaredQuestionIds: QUESTION_IDS,
    answers: ANSWERS,
    invalidQuestionAskDenial,
    missingQuestionAskDenial: questionRequirementDenial,
    requestId,
  })
  const read = observeReadTimeline(events, question, CASE_LIST_DENIAL)
  const calculation = observeCalculationAndSaveTimeline(events, question, {
    questionRequirementDenial,
  })
  return { question, read, calculation }
}

function expectRed(name: string, action: () => unknown): UnitCaseResult {
  let detail = ''
  try {
    action()
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error)
    return {
      name,
      expected: 'RED',
      observed: 'RED',
      source: 'controlled-events',
      detail,
    }
  }
  throw new Error(`${name} was expected RED but passed`)
}

function expectPass(name: string, action: () => unknown): UnitCaseResult {
  try {
    action()
  } catch (error) {
    throw new Error(`${name} was expected PASS but failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  return {
    name,
    expected: 'PASS',
    observed: 'PASS',
    source: 'controlled-events',
    detail: 'ordered observation completed',
  }
}

async function genuineLegacyRed(): Promise<UnitCaseResult> {
  const rows = (await readFile(LEGACY_JSONL, 'utf8')).trimEnd().split(/\r?\n/)
  const events = rows.slice(1).map(row => JSON.parse(row) as NativeEvent)
  const request = events.find(event => {
    if (event.type !== 'user/message') return false
    const data = event.data as Record<string, unknown>
    const source = data.source
    return source !== null
      && typeof source === 'object'
      && (source as Record<string, unknown>).kind === 'user'
  })
  const requestId = request === undefined
    ? ''
    : String(((request.data as Record<string, unknown>).source as Record<string, unknown>).rpcId)
  assert.ok(requestId.length > 0)
  let detail = ''
  try {
    observeQuestionCallbacks(events, {
      callbackAttempts: 0,
      successfulCallbackInvocations: 0,
      declaredQuestionIds: QUESTION_IDS,
      answers: ANSWERS,
      invalidQuestionAskDenial,
      missingQuestionAskDenial: questionRequirementDenial,
      requestId,
    })
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error)
    return {
      name: 'genuine-gySbhT-baseline',
      expected: 'RED',
      observed: 'RED',
      source: 'old-gySbhT-jsonl-readonly',
      detail,
    }
  }
  throw new Error('genuine gySbhT baseline was expected RED but passed')
}

const cases: UnitCaseResult[] = []

cases.push(await genuineLegacyRed())
cases.push(expectPass('valid-ordered-control', () => {
  const observed = observe(eventsFrom(orderedOperations()))
  assert.equal(observed.read.successfulLists.length, 1)
  assert.equal(observed.read.rejectedCalls.length, 0)
  assert.equal(observed.read.successfulReads.length, 1)
  assert.equal(observed.calculation.successfulCalculations.length, 1)
  assert.equal(observed.calculation.successfulSaves.length, 1)
  assert.equal(observed.calculation.firstSuccessfulCoreAfterCalculation.callId, SAVE_CALL_ID)
}))

cases.push(expectPass('denied-read-then-valid-recovery', () => {
  const operations: Operation[] = [
    call('unit-read-denied', 'case_read_material', readArguments()),
    result('unit-read-denied', `Error: ${CASE_LIST_DENIAL}`, true),
    ...orderedOperations(),
  ]
  const observed = observe(eventsFrom(operations))
  assert.equal(observed.read.rejectedCalls.length, 1)
  assert.equal(observed.read.rejectedCalls[0]!.reason, 'case_list_before_read')
  assert.equal(observed.read.successfulLists.length, 1)
  assert.equal(observed.read.successfulReads.length, 1)
}))

cases.push(expectPass('denied-calc-save-before-ask-then-valid-recovery', () => {
  const operations: Operation[] = [
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call('unit-calc-denied', 'case_calc_sentence', { penalty: 'UNIT' }),
    result('unit-calc-denied', `Error: ${QUESTION_DENIAL}`, true),
    call('unit-save-denied', 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result('unit-save-denied', `Error: ${QUESTION_DENIAL}`, true),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 1 }),
  ]
  const observed = observe(eventsFrom(operations))
  assert.deepEqual(
    observed.calculation.rejectedCalls.map(row => row.tool).sort(),
    ['case_calc_sentence', 'case_save_draft'],
  )
  assert.equal(observed.calculation.successfulCalculations.length, 1)
  assert.equal(observed.calculation.firstSuccessfulCoreAfterCalculation.callId, SAVE_CALL_ID)
}))

cases.push(expectPass('unknown-question-id-then-valid-ask-recovery', () => {
  const operations: Operation[] = [
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call('unit-ask-invalid', 'ask_user_question', {
      questions: [{ id: 'unit-unknown-question', question: 'UNIT unknown question' }],
    }),
    result(
      'unit-ask-invalid',
      `Error: ${invalidQuestionAskDenial(QUESTION_IDS)}`,
      true,
    ),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 1 }),
  ]
  const observed = observe(eventsFrom(operations), REQUEST_ID, 1)
  assert.equal(observed.question.rejectedCalls.length, 1)
  assert.equal(observed.question.answeredCalls.length, 1)
  assert.equal(observed.calculation.successfulCalculations.length, 1)
}))

cases.push(expectRed('callback-attempts-include-producer-denial', () => {
  const operations: Operation[] = [
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call('unit-ask-invalid', 'ask_user_question', {
      questions: [{ id: 'unit-unknown-question', question: 'UNIT unknown question' }],
    }),
    result(
      'unit-ask-invalid',
      `Error: ${invalidQuestionAskDenial(QUESTION_IDS)}`,
      true,
    ),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 1 }),
  ]
  observe(eventsFrom(operations), REQUEST_ID, 2)
}))

cases.push(expectRed('wrong-denial', () => {
  observe(eventsFrom([
    call('unit-read-wrong-denial', 'case_read_material', readArguments()),
    result('unit-read-wrong-denial', 'Error: UNIT wrong denial', true),
    ...orderedOperations(),
  ]))
}))

cases.push(expectRed('wrong-calculator-denial-before-ask', () => {
  observe(eventsFrom([
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call('unit-calc-wrong-denial', 'case_calc_sentence', { penalty: 'UNIT' }),
    result('unit-calc-wrong-denial', 'Error: UNIT wrong calculator denial', true),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 1 }),
  ]))
}))

cases.push(expectRed('unpaired-result', () => {
  const events = eventsFrom(orderedOperations())
    .filter(event => toolResultCallId(event) !== LIST_CALL_ID)
  observe(events)
}))

cases.push(expectRed('after-unlock-error', () => {
  observe(eventsFrom(orderedOperations({ failedCalcAfterUnlock: true })))
}))

cases.push(expectRed('duplicate-calc', () => {
  observe(eventsFrom(orderedOperations({ duplicateCalc: true })))
}))

cases.push(expectRed('success-before-answers', () => {
  observe(eventsFrom(orderedOperations({ calcBeforeAsk: true })))
}))

cases.push(expectRed('successful-save-before-calculation-result', () => {
  observe(eventsFrom([
    call(LIST_CALL_ID, 'case_list_materials', {}),
    result(LIST_CALL_ID, listResult()),
    call(READ_CALL_ID, 'case_read_material', readArguments()),
    result(READ_CALL_ID, readResult()),
    call(ASK_CALL_ID, 'ask_user_question', askArguments()),
    result(ASK_CALL_ID, askResult()),
    call('unit-save-before-calc', 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result('unit-save-before-calc', { path: '工作区/任务/UNIT/草稿/UNIT-before.md', version: 1 }),
    call(CALC_CALL_ID, 'case_calc_sentence', { penalty: 'UNIT' }),
    result(CALC_CALL_ID, { start: null, custody_days: 1 }),
    call(SAVE_CALL_ID, 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
    result(SAVE_CALL_ID, { path: '工作区/任务/UNIT/草稿/UNIT.md', version: 2 }),
  ]))
}))

cases.push(expectRed('read-before-list', () => {
  observe(eventsFrom([
    call('unit-read-before-list', 'case_read_material', readArguments()),
    result('unit-read-before-list', readResult()),
    ...orderedOperations(),
  ]))
}))

cases.push(expectRed('missing-ask', () => {
  const events = eventsFrom(orderedOperations()).filter(event => !(
    event.type === 'tool/call'
    && (event.data as Record<string, unknown>).name === 'ask_user_question'
  ))
  observe(events)
}))

cases.push(expectRed('wrong-current-request', () => {
  observe(eventsFrom(orderedOperations()), WRONG_REQUEST_ID)
}))

const output = {
  format: 'lawbench-t18-sentence-gate-observer-focused-unit-v1',
  verdict: cases.every(row => row.observed === row.expected) ? 'UNIT_PASS_NOT_REAL_MODEL' : 'UNIT_FAIL',
  label: 'UNIT_ONLY',
  actualModelOrNativeRun: false,
  network: false,
  persistedSessionCreated: false,
  legacyJsonlReadOnly: true,
  freshCases: cases.length,
  passed: cases.filter(row => row.observed === 'PASS').length,
  redAsExpected: cases.filter(row => row.observed === 'RED').length,
  cases,
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
