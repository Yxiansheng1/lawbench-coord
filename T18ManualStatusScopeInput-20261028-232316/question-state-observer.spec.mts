import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const consumerPath = join(evidenceDir, 'native-contract-workflow.mts')
const actual70Path =
  'D:/Lawbeach/lawbench-coord/T18QuestionOrderObserverInput-20261028-222714/actual-native-events.jsonl'
const actual59Path =
  'D:/Lawbeach/lawbench-coord/T18QuestionOrderRetryInput-20261028-224035/actual-retry59-native-events.jsonl'
const actual95Path =
  'D:/Lawbeach/lawbench-coord/T18QuestionStateObserverInput-20261028-230055/actual95-native-events.jsonl'

const consumerSource = await readFile(consumerPath, 'utf8')
const consumerFile = ts.createSourceFile(
  consumerPath,
  consumerSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
)

const topLevelFunction = (name: string): any => {
  const matches: any[] = []
  const visit = (node: any): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(consumerFile)
  assert.equal(matches.length, 1, `expected exactly one current ${name} function`)
  assert.equal(matches[0].parent, consumerFile, `${name} must be a top-level function`)
  return matches[0]
}

const safeCalls = new Set([
  'add',
  'endsWith',
  'get',
  'has',
  'includes',
  'isArray',
  'isSafeInteger',
  'parse',
  'push',
  'set',
  'some',
  'split',
  'startsWith',
  'test',
  'trim',
])
const safeConstructors = new Set(['Error', 'Map', 'Set'])

const assertPureFunction = (assertedName: string, functionNode: any): void => {
  const functionSource = functionNode.getText(consumerFile)
  assert.doesNotMatch(
    functionSource,
    /\b(?:import|require|process|fetch|WebSocket|XMLHttpRequest|sendBeacon|child_process|http|https|net|tls|fs|os|eval|Function)\b/,
    `${assertedName} must not have process, credential, filesystem, or network capabilities`,
  )
  const inspect = (node: any): void => {
    if (ts.isCallExpression(node)) {
      const target = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.text
        : node.expression.getText(consumerFile)
      assert.ok(safeCalls.has(target), `${assertedName} call is outside safe allowlist: ${target}`)
    }
    if (ts.isNewExpression(node)) {
      const target = node.expression.getText(consumerFile)
      assert.ok(safeConstructors.has(target), `${assertedName} constructor is outside safe allowlist: ${target}`)
    }
    ts.forEachChild(node, inspect)
  }
  inspect(functionNode)
}

const loadCurrentFunction = (name: string): any => {
  const functionNode = topLevelFunction(name)
  assertPureFunction(name, functionNode)
  const functionSource = functionNode.getText(consumerFile)
  const exportable = functionSource.replace(
    new RegExp(`^function[ \\t]+${name}`),
    `export function ${name}`,
  )
  assert.notEqual(exportable, functionSource, `${name} export transform must be exact`)
  const transpiled = ts.transpileModule(exportable, {
    fileName: `${name}.ts`,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const moduleShim: { exports: Record<string, unknown> } = { exports: {} }
  const context = vm.createContext(
    { module: moduleShim, exports: moduleShim.exports },
    { codeGeneration: { strings: false, wasm: false } },
  )
  new vm.Script(transpiled, { filename: `${name}.cjs` })
    .runInContext(context, { timeout: 500 })
  const loaded = moduleShim.exports[name]
  assert.equal(typeof loaded, 'function', `${name} did not load from the current function body`)
  return loaded
}

const observer = loadCurrentFunction('observeQuestionBeforeFirstDraft')
const questionRoles = loadCurrentFunction('questionRoles')

type QuestionRole = 'our_party' | 'purpose' | 'focus'
type Event = {
  type: string
  seq?: number
  time: number
  data: Record<string, unknown>
}
type Question = {
  questionIds: readonly string[]
  questionText: string
  optionLabels: readonly string[]
  rolesByQuestion: readonly (readonly QuestionRole[])[]
  answerIds: readonly string[]
  answerText: string
}
type AskArguments = {
  questions: Array<{
    id: string
    header?: string
    question: string
    options?: Array<{ label: string; description?: string }>
  }>
}
type AnswerPayload = {
  answers: Array<{ id: string; selected: string[]; custom: string }>
}

const bytesHash = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex')

const readEventResource = async (
  path: string,
  expectedBytes: number,
  expectedHash: string,
  expectedRows: number,
  label: string,
): Promise<Event[]> => {
  const bytes = await readFile(path)
  assert.equal(bytes.byteLength, expectedBytes, `${label} must retain its immutable byte count`)
  assert.equal(bytesHash(bytes), expectedHash, `${label} must retain its immutable SHA-256`)
  const rows = bytes.toString('utf8').split(/\r?\n/).filter(Boolean)
  assert.equal(rows.length, expectedRows, `${label} must retain its physical row count`)
  return rows.map(row => JSON.parse(row) as Event)
}

const messageFor = (event: Event): Record<string, any> =>
  event.data.message as Record<string, any>

const resultFor = (events: readonly Event[], callId: string): Event => {
  const results = events.filter(event => (
    event.type === 'tool/result'
    && messageFor(event).source?.callId === callId
  ))
  assert.equal(results.length, 1, `expected exactly one result for ${callId}`)
  return results[0]!
}

const askArguments = (event: Event): AskArguments =>
  JSON.parse(event.data.arguments as string) as AskArguments

const questionFromSuccessfulAsk = (events: readonly Event[]): Question => {
  const calls = events.filter(event => (
    event.type === 'tool/call'
    && event.data.name === 'ask_user_question'
  ))
  const successfulCalls = calls.filter(call => messageFor(resultFor(events, call.data.callId as string)).isError === false)
  assert.equal(successfulCalls.length, 1, 'the resource must contain exactly one non-error ask')
  const successfulCall = successfulCalls[0]!
  const parsed = askArguments(successfulCall)
  const ids = parsed.questions.map(question => question.id)
  const answerMessage = messageFor(resultFor(events, successfulCall.data.callId as string))
  const answers = JSON.parse(answerMessage.content[0].text as string) as AnswerPayload
  assert.deepEqual(
    answers.answers.map(answer => answer.id),
    ids,
    'the real answer IDs must exactly match the final callback IDs',
  )
  return {
    questionIds: ids,
    questionText: parsed.questions.map(question => question.question).join('\n'),
    optionLabels: parsed.questions.flatMap(question => (
      question.options ?? []
    ).map(option => option.label)),
    rolesByQuestion: ids.map(id => [id as QuestionRole]),
    answerIds: ids,
    answerText: answers.answers.map(answer => answer.custom).join('\n'),
  }
}

const assertReplay = (
  events: readonly Event[],
  question: Question,
  expected: Record<string, unknown>,
  label: string,
): void => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(observer(events, question))),
    expected,
    label,
  )
}

const actual70 = await readEventResource(
  actual70Path,
  336215,
  '5a0f499a2c6172d970af0c0b6a63308d955d907f9f711fb5b931b164e50461d9',
  70,
  'actual70',
)
assertReplay(
  actual70,
  questionFromSuccessfulAsk(actual70),
  {
    answerCallId: 'chatcmpl-tool-8bf1d3305c4b0b75',
    answerCallSeq: 36,
    answerResultSeq: 37,
    draftCallId: 'chatcmpl-tool-843985056bef794e',
    draftCallSeq: 41,
    draftResultSeq: 42,
  },
  'the immutable 70-row answer-before-draft replay must remain positive',
)

const actual59 = await readEventResource(
  actual59Path,
  232044,
  'aa45f25b674dc8e3f58140784b98a97cfab38a96eaa8e330a5c0077ffa4e6056',
  59,
  'actual59',
)
assertReplay(
  actual59,
  questionFromSuccessfulAsk(actual59),
  {
    answerCallId: 'chatcmpl-tool-bb6256f1f4c26d8a',
    answerCallSeq: 36,
    answerResultSeq: 37,
    draftCallId: 'chatcmpl-tool-85c92449d7212dd3',
    draftCallSeq: 41,
    draftResultSeq: 42,
  },
  'the immutable 59-row retry replay must keep excluding the known denied mandatory-question save',
)

const actual95 = await readEventResource(
  actual95Path,
  269225,
  '824ab2b28d44cfaffd05b99a5574e53183b8815447a1eb1ca9cd5ff17a888900',
  95,
  'actual95',
)
const actual95AskCalls = actual95.filter(event => (
  event.type === 'tool/call'
  && event.data.name === 'ask_user_question'
))
const actual95AskMessages = actual95AskCalls.map(call => (
  messageFor(resultFor(actual95, call.data.callId as string))
))
assert.equal(actual95AskCalls.length, 8, 'the 95-row resource must retain all eight ask calls')
assert.equal(
  actual95AskMessages.filter(message => message.isError === true).length,
  7,
  'the 95-row resource must retain seven failed ask results',
)
assert.equal(
  actual95AskMessages.filter(message => message.isError === false).length,
  1,
  'the 95-row resource must retain exactly one successful ask result',
)
const actual95Question = questionFromSuccessfulAsk(actual95)
assert.deepEqual(
  actual95Question.questionIds,
  ['our_party', 'purpose', 'focus'],
  'the real final callback must retain its three declared IDs',
)
assertReplay(
  actual95,
  actual95Question,
  {
    answerCallId: 'chatcmpl-tool-96200cd7d4cff24b',
    answerCallSeq: 66,
    answerResultSeq: 67,
    draftCallId: 'chatcmpl-tool-8dd2ff8b25c816bd',
    draftCallSeq: 71,
    draftResultSeq: 72,
  },
  'the real 95-row completed task must pass with its sole successful answer before the first persisted draft',
)

const actual95FocusCall = actual95.find(event => (
  event.type === 'tool/call'
  && event.seq === 31
  && event.data.name === 'ask_user_question'
))
assert.ok(actual95FocusCall, 'the immutable resource must retain the first focus callback')
const focusQuestion = askArguments(actual95FocusCall!).questions.find(question => question.id === 'focus')
assert.ok(focusQuestion?.header, 'the real focus callback must retain its role-bearing header')
assert.deepEqual(
  JSON.parse(JSON.stringify(questionRoles(focusQuestion.question))),
  [],
  'the real focus question body alone must remain unclassified',
)
assert.deepEqual(
  JSON.parse(JSON.stringify(questionRoles(`${focusQuestion.header}\n${focusQuestion.question}`))),
  ['focus'],
  'the existing callback text composition must recover focus from header plus question',
)
assert.deepEqual(
  JSON.parse(JSON.stringify(questionRoles('其他事项\n请说明'))),
  [],
  'an unrelated header and body must remain outside the synthetic contract-review scope',
)

const question: Question = {
  questionIds: ['our_party', 'purpose', 'focus'],
  questionText: 'party\npurpose\nfocus',
  optionLabels: [],
  rolesByQuestion: [['our_party'], ['purpose'], ['focus']],
  answerIds: ['our_party', 'purpose', 'focus'],
  answerText: 'party answer\npurpose answer\nfocus answer',
}
const answerJson = (
  ids: readonly string[] = ['our_party', 'purpose', 'focus'],
  custom: readonly string[] = ['party answer', 'purpose answer', 'focus answer'],
): string => JSON.stringify({
  answers: ids.map((id, index) => ({
    id,
    selected: [],
    custom: custom[index],
  })),
})
const draftJson = (
  path = '工作区/任务/T-20261028221818-8c46/草稿/合同审查意见-v1.md',
  version = 1,
): string => JSON.stringify({ path, version })
const call = (seq: number, callId: string, name: string): Event => ({
  type: 'tool/call',
  seq,
  time: seq,
  data: { callId, name, arguments: '{}' },
})
const result = (seq: number, callId: string, text: string, isError = false): Event => ({
  type: 'tool/result',
  seq,
  time: seq,
  data: {
    message: {
      source: { kind: 'tool', callId },
      toolCallId: callId,
      content: [{ type: 'text', text }],
      isError,
    },
  },
})
const normalEvents = (): Event[] => [
  call(1, 'ask', 'ask_user_question'),
  result(2, 'ask', answerJson()),
  call(3, 'draft', 'case_save_draft'),
  result(4, 'draft', draftJson()),
]
const expectReject = (
  label: string,
  events: readonly Event[],
  recordedQuestion: Question = question,
): void => {
  assert.throws(
    () => observer(events, recordedQuestion),
    undefined,
    `${label} must fail closed`,
  )
}

assertReplay(
  normalEvents(),
  question,
  {
    answerCallId: 'ask',
    answerCallSeq: 1,
    answerResultSeq: 2,
    draftCallId: 'draft',
    draftCallSeq: 3,
    draftResultSeq: 4,
  },
  'a normal answer result before one successful draft call must pass',
)

const unknownErroredAskBeforeValid = [
  call(1, 'denied', 'ask_user_question'),
  result(2, 'denied', 'Error: question callback failed', true),
  call(3, 'ask', 'ask_user_question'),
  result(4, 'ask', answerJson()),
  call(5, 'draft', 'case_save_draft'),
  result(6, 'draft', draftJson()),
]
assertReplay(
  unknownErroredAskBeforeValid,
  question,
  {
    answerCallId: 'ask',
    answerCallSeq: 3,
    answerResultSeq: 4,
    draftCallId: 'draft',
    draftCallSeq: 5,
    draftResultSeq: 6,
  },
  'an earlier failed ask with arbitrary error prose must not defeat the later sole successful answer',
)

assertReplay(
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'late-ask', 'ask_user_question'),
    result(4, 'late-ask', 'Error: another failed ask attempt', true),
    call(5, 'draft', 'case_save_draft'),
    result(6, 'draft', draftJson()),
  ],
  question,
  {
    answerCallId: 'ask',
    answerCallSeq: 1,
    answerResultSeq: 2,
    draftCallId: 'draft',
    draftCallSeq: 5,
    draftResultSeq: 6,
  },
  'a later failed ask attempt must remain outside successful-answer selection',
)

assertReplay(
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'failed-draft', 'case_save_draft'),
    result(4, 'failed-draft', 'Error: storage unavailable after answers', true),
    call(5, 'draft', 'case_save_draft'),
    result(6, 'draft', draftJson()),
  ],
  question,
  {
    answerCallId: 'ask',
    answerCallSeq: 1,
    answerResultSeq: 2,
    draftCallId: 'draft',
    draftCallSeq: 5,
    draftResultSeq: 6,
  },
  'a failed draft call after successful answers must not create a question-order violation',
)

expectReject(
  'absent ask',
  [
    call(1, 'draft', 'case_save_draft'),
    result(2, 'draft', draftJson()),
  ],
)
expectReject(
  'only errored ask',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', 'Error: question callback failed', true),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson()),
  ],
)
expectReject(
  'partial answer IDs',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson(['our_party', 'purpose'], ['party answer', 'purpose answer'])),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson()),
  ],
)
expectReject(
  'mismatched answer ID',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson(['our_party', 'purpose', 'other'])),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson()),
  ],
)
expectReject(
  'mismatched answer content',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson(
      ['our_party', 'purpose', 'focus'],
      ['party answer', 'purpose answer', 'changed focus answer'],
    )),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson()),
  ],
)
expectReject(
  'successful draft before answers',
  [
    call(1, 'draft', 'case_save_draft'),
    result(2, 'draft', draftJson()),
    call(3, 'ask', 'ask_user_question'),
    result(4, 'ask', answerJson()),
  ],
)
expectReject(
  'draft call before answer result even when its result is later',
  [
    call(1, 'ask', 'ask_user_question'),
    call(2, 'draft', 'case_save_draft'),
    result(3, 'ask', answerJson()),
    result(4, 'draft', draftJson()),
  ],
)
expectReject(
  'unknown draft error before answers',
  [
    call(1, 'draft', 'case_save_draft'),
    result(2, 'draft', 'Error: storage unavailable', true),
    call(3, 'ask', 'ask_user_question'),
    result(4, 'ask', answerJson()),
  ],
)
expectReject(
  'missing draft result',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'draft', 'case_save_draft'),
  ],
)
expectReject(
  'missing ask result',
  [
    call(1, 'ask', 'ask_user_question'),
    call(2, 'draft', 'case_save_draft'),
    result(3, 'draft', draftJson()),
  ],
)
expectReject(
  'duplicate draft result',
  [
    ...normalEvents(),
    result(5, 'draft', draftJson()),
  ],
)
expectReject(
  'foreign result call ID',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'foreign', draftJson()),
  ],
)
expectReject(
  'malformed persisted path',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson('/absolute/审查意见.md', 1)),
  ],
)
expectReject(
  'missing persisted version',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', JSON.stringify({
      path: '工作区/任务/T-20261028221818-8c46/草稿/合同审查意见-v1.md',
    })),
  ],
)
expectReject(
  'zero persisted version',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', answerJson()),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson(undefined, 0)),
  ],
)

expectReject(
  'missing recorded role',
  normalEvents(),
  {
    ...question,
    rolesByQuestion: [['our_party'], ['purpose']],
  },
)
expectReject(
  'two successful asks',
  [
    call(1, 'ask-one', 'ask_user_question'),
    result(2, 'ask-one', answerJson()),
    call(3, 'ask-two', 'ask_user_question'),
    result(4, 'ask-two', answerJson()),
    call(5, 'draft', 'case_save_draft'),
    result(6, 'draft', draftJson()),
  ],
)
expectReject(
  'malformed answer JSON',
  [
    call(1, 'ask', 'ask_user_question'),
    result(2, 'ask', '{"answers":'),
    call(3, 'draft', 'case_save_draft'),
    result(4, 'draft', draftJson()),
  ],
)

console.log(
  'PASS question-state-observer: immutable actual 70-, 59-, and 95-row replays; '
  + '7 positive order/result cases; 3 callback header assertions; 18 negative controls; '
  + 'retired 1 artificial unknown-error-ask negative',
)
