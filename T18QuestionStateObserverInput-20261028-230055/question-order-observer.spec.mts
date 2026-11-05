import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const consumerPath = join(evidenceDir, 'native-contract-workflow.mts')
const actualEventsPath =
  'D:/Lawbeach/lawbench-coord/T18QuestionOrderObserverInput-20261028-222714/actual-native-events.jsonl'
const actualRetryEventsPath =
  'D:/Lawbeach/lawbench-coord/T18QuestionOrderRetryInput-20261028-224035/actual-retry59-native-events.jsonl'
const observedFunctionName = 'observeQuestionBeforeFirstDraft'

const consumerSource = await readFile(consumerPath, 'utf8')
const consumerFile = ts.createSourceFile(
  consumerPath,
  consumerSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
)

const functions: any[] = []
const visit = (node: any): void => {
  if (ts.isFunctionDeclaration(node) && node.name?.text === observedFunctionName) {
    functions.push(node)
  }
  ts.forEachChild(node, visit)
}
visit(consumerFile)
assert.equal(functions.length, 1, 'expected exactly one current question-order observer function')

const functionNode = functions[0]
assert.equal(functionNode.parent, consumerFile, 'question-order observer must be a top-level function')
const functionSource = functionNode.getText(consumerFile)
assert.doesNotMatch(
  functionSource,
  /\b(?:import|require|process|fetch|WebSocket|XMLHttpRequest|sendBeacon|child_process|http|https|net|tls|fs|os|eval|Function)\b/,
  'extracted observer must not have process, credential, filesystem, or network capabilities',
)

const safeCalls = new Set([
  'add',
  'endsWith',
  'get',
  'has',
  'includes',
  'isArray',
  'isSafeInteger',
  'parse',
  'set',
  'some',
  'split',
  'startsWith',
  'trim',
])
const safeConstructors = new Set(['Error', 'Map', 'Set'])
const inspectCapabilities = (node: any): void => {
  if (ts.isCallExpression(node)) {
    const target = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText(consumerFile)
    assert.ok(safeCalls.has(target), `observer call is outside safe allowlist: ${target}`)
  }
  if (ts.isNewExpression(node)) {
    const target = node.expression.getText(consumerFile)
    assert.ok(safeConstructors.has(target), `observer constructor is outside safe allowlist: ${target}`)
  }
  ts.forEachChild(node, inspectCapabilities)
}
inspectCapabilities(functionNode)

const exportable = functionSource.replace(
  /^function[ \t]+observeQuestionBeforeFirstDraft/,
  'export function observeQuestionBeforeFirstDraft',
)
assert.notEqual(exportable, functionSource, 'observer export transform must be exact')
const transpiled = ts.transpileModule(exportable, {
  fileName: 'observeQuestionBeforeFirstDraft.ts',
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
new vm.Script(transpiled, { filename: 'observeQuestionBeforeFirstDraft.cjs' })
  .runInContext(context, { timeout: 500 })
const observer = moduleShim.exports.observeQuestionBeforeFirstDraft
assert.equal(typeof observer, 'function', 'observer did not load from the current function body')

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
  rolesByQuestion: readonly (readonly ('our_party' | 'purpose' | 'focus')[])[]
  answerIds: readonly string[]
  answerText: string
}

const actualRows = (await readFile(actualEventsPath, 'utf8'))
  .split(/\r?\n/)
  .filter(Boolean)
const actualEvents = actualRows.map(row => JSON.parse(row) as Event)
const actualAskCall = actualEvents.find(event => (
  event.type === 'tool/call'
  && event.data.name === 'ask_user_question'
))!
const actualAskArguments = JSON.parse(actualAskCall.data.arguments as string) as {
  questions: Array<{ id: string; question: string; options?: Array<{ label: string }> }>
}
const actualAnswerResult = actualEvents.find(event => (
  event.type === 'tool/result'
  && (event.data.message as any)?.source?.callId === actualAskCall.data.callId
))!
const actualAnswers = JSON.parse(
  ((actualAnswerResult.data.message as any).content[0].text as string),
) as {
  answers: Array<{ id: string; selected: string[]; custom: string }>
}
const actualIds = actualAskArguments.questions.map(question => question.id)
const actualQuestion: Question = {
  questionIds: actualIds,
  questionText: actualAskArguments.questions.map(question => question.question).join('\n'),
  optionLabels: actualAskArguments.questions.flatMap(question => (
    question.options ?? []
  ).map(option => option.label)),
  rolesByQuestion: actualIds.map(id => [id as 'our_party' | 'purpose' | 'focus']),
  answerIds: actualIds,
  answerText: actualAnswers.answers.map(answer => answer.custom).join('\n'),
}

assert.equal(actualRows.length, 70, 'the immutable actual resource must retain 70 physical rows')
assert.deepEqual(
  JSON.parse(JSON.stringify(observer(actualEvents, actualQuestion))),
  {
    answerCallId: 'chatcmpl-tool-8bf1d3305c4b0b75',
    answerCallSeq: 36,
    answerResultSeq: 37,
    draftCallId: 'chatcmpl-tool-843985056bef794e',
    draftCallSeq: 41,
    draftResultSeq: 42,
  },
  'the previous false-negative actual run must now accept the real answer-before-successful-draft order',
)

const actualRetryBytes = await readFile(actualRetryEventsPath)
assert.equal(actualRetryBytes.byteLength, 232044, 'the retry resource must retain its immutable byte count')
assert.equal(
  createHash('sha256').update(actualRetryBytes).digest('hex'),
  'aa45f25b674dc8e3f58140784b98a97cfab38a96eaa8e330a5c0077ffa4e6056',
  'the retry resource must retain its immutable SHA-256',
)
const actualRetryRows = actualRetryBytes.toString('utf8').split(/\r?\n/).filter(Boolean)
const actualRetryEvents = actualRetryRows.map(row => JSON.parse(row) as Event)
assert.equal(actualRetryRows.length, 59, 'the immutable retry resource must retain 59 physical rows')
const actualRetryAskCalls = actualRetryEvents.filter(event => (
  event.type === 'tool/call'
  && event.data.name === 'ask_user_question'
))
assert.equal(actualRetryAskCalls.length, 2, 'the retry resource must retain its denied and successful ask calls')
const actualRetryAskResults = actualRetryEvents.filter(event => event.type === 'tool/result')
const actualRetryDeniedCall = actualRetryAskCalls[0]!
const actualRetryDeniedResult = actualRetryAskResults.find(event => (
  (event.data.message as any)?.source?.callId === actualRetryDeniedCall.data.callId
))!
const actualRetryDeniedMessage = actualRetryDeniedResult.data.message as {
  isError: boolean
  content: Array<{ text: string }>
}
assert.equal(actualRetryDeniedMessage.isError, true)
assert.equal(
  actualRetryDeniedMessage.content[0]!.text,
  'Error: 提交成果前必须先取得律师对必问问题的真实回答。还缺：our_party、purpose、focus',
)
const actualRetrySuccessfulCall = actualRetryAskCalls[1]!
const actualRetrySuccessfulResult = actualRetryAskResults.find(event => (
  (event.data.message as any)?.source?.callId === actualRetrySuccessfulCall.data.callId
))!
const actualRetrySuccessfulMessage = actualRetrySuccessfulResult.data.message as {
  isError: boolean
  content: Array<{ text: string }>
}
assert.equal(actualRetrySuccessfulMessage.isError, false)
assert.ok(actualRetryDeniedCall.seq! < actualRetrySuccessfulCall.seq!)
assert.ok(actualRetryDeniedResult.seq! < actualRetrySuccessfulResult.seq!)
const actualRetryAskArguments = JSON.parse(actualRetrySuccessfulCall.data.arguments as string) as {
  questions: Array<{ id: string; question: string; options?: Array<{ label: string }> }>
}
const actualRetryAnswers = JSON.parse(
  actualRetrySuccessfulMessage.content[0]!.text,
) as {
  answers: Array<{ id: string; selected: string[]; custom: string }>
}
const actualRetryIds = actualRetryAskArguments.questions.map(question => question.id)
const actualRetryQuestion: Question = {
  questionIds: actualRetryIds,
  questionText: actualRetryAskArguments.questions.map(question => question.question).join('\n'),
  optionLabels: actualRetryAskArguments.questions.flatMap(question => (
    question.options ?? []
  ).map(option => option.label)),
  rolesByQuestion: actualRetryIds.map(id => [id as 'our_party' | 'purpose' | 'focus']),
  answerIds: actualRetryIds,
  answerText: actualRetryAnswers.answers.map(answer => answer.custom).join('\n'),
}
assert.deepEqual(
  JSON.parse(JSON.stringify(observer(actualRetryEvents, actualRetryQuestion))),
  {
    answerCallId: 'chatcmpl-tool-bb6256f1f4c26d8a',
    answerCallSeq: 36,
    answerResultSeq: 37,
    draftCallId: 'chatcmpl-tool-85c92449d7212dd3',
    draftCallSeq: 41,
    draftResultSeq: 42,
  },
  'the real denied mandatory-question attempt before the single successful ask must be excluded',
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
const draftJson = (path = '工作区/任务/T-20261028221818-8c46/草稿/合同审查意见-v1.md', version = 1): string =>
  JSON.stringify({ path, version })
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

assert.deepEqual(
  JSON.parse(JSON.stringify(observer(normalEvents(), question))),
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

expectReject(
  'absent ask',
  [
    call(1, 'draft', 'case_save_draft'),
    result(2, 'draft', draftJson()),
  ],
)
expectReject(
  'errored ask',
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
  'uncertain draft error before answers',
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

const missingRole: Question = {
  ...question,
  rolesByQuestion: [['our_party'], ['purpose']],
}
expectReject(
  'missing recorded role',
  normalEvents(),
  missingRole,
)

expectReject(
  'unknown errored ask before valid',
  [
    call(1, 'denied', 'ask_user_question'),
    result(2, 'denied', 'Error: question callback failed', true),
    call(3, 'ask', 'ask_user_question'),
    result(4, 'ask', answerJson()),
    call(5, 'draft', 'case_save_draft'),
    result(6, 'draft', draftJson()),
  ],
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

console.log(
  'PASS question-order-observer: immutable actual 70-row and 59-row replays plus a normal positive, '
  + 'and 18 malformed-order/result controls',
)
