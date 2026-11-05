import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const consumerPath = join(evidenceDir, 'native-contract-workflow.mts')
const actualEventsPath =
  'D:/Lawbeach/lawbench-coord/T18QuestionOrderObserverInput-20261028-222714/actual-native-events.jsonl'
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
  observer(actualEvents, actualQuestion),
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
  observer(normalEvents(), question),
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

console.log(
  'PASS question-order-observer: immutable actual 70-row replay, normal positive, '
  + 'and 16 malformed-order/result controls',
)
