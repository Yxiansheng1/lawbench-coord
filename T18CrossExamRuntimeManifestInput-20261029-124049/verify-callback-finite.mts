import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const oldConsumerPath =
  'D:/Lawbeach/lawbench-coord/T18CrossExamConfigCallbackInput-20261029-122319/native-cross-exam.mts'
const newConsumerPath = join(evidenceDir, 'native-cross-exam.mts')
const bServicePath = join(evidenceDir, 'b-service-cross-exam.py')
const manifestPath = join(evidenceDir, 'literalfixed-inputs.json')
const agentSourcePath = 'D:/Lawbeach/lawbench-A/dsh-ext/agent/index.ts'
const authorizedAnswersPath =
  'D:/Lawbeach/lawbench-coord/T18CrossExamNativeInput-20261029-113906/authorized-synthetic-answers.json'
const sessionPath =
  'D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/CrossExamNative-20261029-113906/run-zMFEDU/sessions/'
  + '--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-CrossExamNative-20261029-113906-run-zMFEDU-case--/'
  + 'session-d099d317-2b32-451d-88f1-203bf04f4e24/session.v4.jsonl'
const typescriptPath = 'D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const sha256 = (bytes: Uint8Array | string): string =>
  createHash('sha256').update(bytes).digest('hex')

const pinnedBytes = (
  bytes: Uint8Array,
  expectedBytes: number,
  expectedSha256: string,
  label: string,
): Buffer => {
  assert.equal(bytes.byteLength, expectedBytes, `${label} byte count changed`)
  assert.equal(sha256(bytes), expectedSha256, `${label} SHA-256 changed`)
  return Buffer.from(bytes)
}

const pinnedText = (
  bytes: Uint8Array,
  expectedBytes: number,
  expectedSha256: string,
  label: string,
): string => pinnedBytes(bytes, expectedBytes, expectedSha256, label).toString('utf8')

const [
  oldBytes,
  newBytes,
  bServiceBytes,
  manifestBytes,
  agentBytes,
  authorizedAnswerBytes,
  sessionBytes,
  typescriptBytes,
] = await Promise.all([
  readFile(oldConsumerPath),
  readFile(newConsumerPath),
  readFile(bServicePath),
  readFile(manifestPath),
  readFile(agentSourcePath),
  readFile(authorizedAnswersPath),
  readFile(sessionPath),
  readFile(typescriptPath),
])

const oldSource = pinnedText(
  oldBytes,
  127688,
  '1a6e5f0c28eb20bc8a7b719805ce48d9ff1fb8ace60f0ac96d2fa3900283e35b',
  'frozen old consumer',
)
const newSource = pinnedText(
  newBytes,
  129407,
  '290d8bb50e271753bdbd01f77e507753caf72de97c1e3e9a95f7662e105668c2',
  'new consumer',
)
const bService = pinnedBytes(
  bServiceBytes,
  48345,
  'aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d',
  'B service',
)
const manifest = JSON.parse(pinnedText(
  manifestBytes,
  967,
  '9789f5a346dd612f51b5785ba9d1a0ac26cbb19112f163fa208e297d57a6c654',
  'finite input manifest',
)) as {
  frozenConsumer: { path: string; bytes: number; sha256: string }
  sourceCopies: Record<string, { path: string; bytes: number; sha256: string }>
}
const agentSource = pinnedText(
  agentBytes,
  46684,
  '5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c',
  'current LegalAgent source',
)
const authorizedAnswerFile = pinnedBytes(
  authorizedAnswerBytes,
  453,
  '4784dfc3d345ec2010c1443f7f803bc39fdfd5ca19754b2d4bc6b96a0ae2c9ce',
  'public authorized synthetic answers',
)
const sessionSource = pinnedText(
  sessionBytes,
  265287,
  '13555ca8461f2e76fe987c4f0ff13ce35e57dd20fe6154546d27b01ed0f97604',
  'closed actual cross-exam JSONL',
)
pinnedBytes(
  typescriptBytes,
  9_144_216,
  '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39',
  'pinned TypeScript AST runtime',
)

assert.equal(manifest.frozenConsumer.path, oldConsumerPath)
assert.equal(manifest.frozenConsumer.bytes, oldBytes.byteLength)
assert.equal(manifest.frozenConsumer.sha256, sha256(oldBytes))
assert.equal(manifest.sourceCopies.consumer?.path, newConsumerPath)
assert.equal(manifest.sourceCopies.consumer?.bytes, newBytes.byteLength)
assert.equal(manifest.sourceCopies.consumer?.sha256, sha256(newBytes))
assert.equal(manifest.sourceCopies.bService?.path, bServicePath)
assert.equal(manifest.sourceCopies.bService?.bytes, bService.byteLength)
assert.equal(manifest.sourceCopies.bService?.sha256, sha256(bService))

type AstNode = any
type SourceFile = any

const parse = (path: string, source: string): SourceFile => (
  ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
)

const namedDeclarations = (sourceFile: SourceFile, name: string): AstNode[] => {
  const found: AstNode[] = []
  const visit = (node: AstNode): void => {
    if (
      (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node))
      && node.name?.getText(sourceFile) === name
    ) {
      found.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

const extractFunction = (path: string, source: string, name: string): string => {
  const sourceFile = parse(path, source)
  const found = namedDeclarations(sourceFile, name)
  assert.equal(found.length, 1, `${path} must contain exactly one ${name}`)
  assert.equal(found[0].parent, sourceFile, `${name} must be top-level in ${path}`)
  assert.equal(ts.isFunctionDeclaration(found[0]), true, `${name} must be a function declaration`)
  return found[0].getText(sourceFile)
}

const extractInitializer = (sourceFile: SourceFile, name: string): string => {
  const found = namedDeclarations(sourceFile, name)
  assert.equal(found.length, 1, `source must contain exactly one ${name}`)
  assert.equal(ts.isVariableDeclaration(found[0]), true, `${name} must be a variable`)
  const initializer = found[0].initializer
  assert.ok(initializer, `${name} must have an initializer`)
  return initializer.getText(sourceFile)
}

const extractRequestCallback = (path: string, source: string): {
  readonly sourceFile: SourceFile
  readonly source: string
} => {
  const sourceFile = parse(path, source)
  const setupFunctions = namedDeclarations(sourceFile, 'setupProduction')
  assert.equal(setupFunctions.length, 1, `${path} must contain one setupProduction`)
  assert.equal(ts.isFunctionDeclaration(setupFunctions[0]), true)
  const callbacks: AstNode[] = []
  const visit = (node: AstNode): void => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'on'
      && node.arguments.length >= 2
      && ts.isStringLiteral(node.arguments[0]!)
      && node.arguments[0]!.text === 'user-questions/request'
    ) {
      let callback = node.arguments[1]
      if (ts.isAsExpression(callback)) callback = callback.expression
      if (ts.isArrowFunction(callback)) callbacks.push(callback)
    }
    ts.forEachChild(node, visit)
  }
  visit(setupFunctions[0])
  assert.equal(callbacks.length, 1, `${path} must contain one actual user-questions callback`)
  return { sourceFile, source: callbacks[0].getText(sourceFile) }
}

const oldCallback = extractRequestCallback(oldConsumerPath, oldSource)
const newCallback = extractRequestCallback(newConsumerPath, newSource)
assert.notEqual(newCallback.source, oldCallback.source, 'the callback must contain the bounded fix')

const forbiddenCapabilities = new Set([
  'fetch',
  'WebSocket',
  'XMLHttpRequest',
  'sendBeacon',
  'EventSource',
  'child_process',
  'process',
  'eval',
  'Function',
  'require',
])
const inspectCallbackCapabilities = (node: AstNode): void => {
  if (ts.isIdentifier(node)) {
    assert.equal(
      forbiddenCapabilities.has(node.text),
      false,
      `callback contains forbidden capability ${node.text}`,
    )
  }
  ts.forEachChild(node, inspectCallbackCapabilities)
}
const oldCallbackNode = extractRequestCallback(oldConsumerPath, oldSource)
const newCallbackNode = extractRequestCallback(newConsumerPath, newSource)
inspectCallbackCapabilities(parse(oldConsumerPath, oldCallbackNode.source))
inspectCallbackCapabilities(parse(newConsumerPath, newCallbackNode.source))

const replaceOnce = (
  source: string,
  newText: string,
  oldText: string,
  label: string,
): string => {
  const at = source.indexOf(newText)
  assert.notEqual(at, -1, `${label} replacement target is missing`)
  assert.equal(source.indexOf(newText, at + 1), -1, `${label} replacement target is not unique`)
  return source.slice(0, at) + oldText + source.slice(at + newText.length)
}

let invertedNewSource = replaceOnce(
  newSource,
  newCallback.source,
  oldCallback.source,
  'callback',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  [
    '  invocationCount: number',
    '  answeredCallbackCount: number',
    '  answerReadInFlight: boolean',
    '  readonly unsupportedQuestionIds: Set<string>',
  ].join('\n'),
  [
    '  invocationCount: number',
    '  readonly unsupportedQuestionIds: Set<string>',
  ].join('\n'),
  'QuestionCapture fields',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  [
    '    readonly actualCallbackInvocations: number',
    '    readonly totalCallbackAttempts: number',
    '    readonly questionTextSha256: string',
  ].join('\n'),
  [
    '    readonly actualCallbackInvocations: number',
    '    readonly questionTextSha256: string',
  ].join('\n'),
  'RunReport fields',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  [
    '    invocationCount: 0,',
    '    answeredCallbackCount: 0,',
    '    answerReadInFlight: false,',
    '    unsupportedQuestionIds: new Set(),',
  ].join('\n'),
  [
    '    invocationCount: 0,',
    '    unsupportedQuestionIds: new Set(),',
  ].join('\n'),
  'QuestionCapture initialization',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  [
    '      capturedQuestion === null',
    '      || question.answeredCallbackCount === 0',
  ].join('\n'),
  [
    '      capturedQuestion === null',
    '      || question.invocationCount === 0',
  ].join('\n'),
  'successful callback predicate',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  '      callbackInvocations: question.answeredCallbackCount,',
  '      callbackInvocations: question.invocationCount,',
  'observer callback count',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  [
    '      actualCallbackInvocations: question.answeredCallbackCount,',
    '      totalCallbackAttempts: question.invocationCount,',
  ].join('\n'),
  '      actualCallbackInvocations: question.invocationCount,',
  'report callback counts',
)
assert.equal(
  invertedNewSource,
  oldSource,
  'outside the focused count fields and callback, every old byte must be held',
)

const sessionEvents = sessionSource.trimEnd().split('\n').filter(Boolean).map(line => (
  JSON.parse(line) as {
    type: string
    seq: number
    data: {
      name?: string
      callId?: string
      arguments?: string
    }
  }
))
const askEvent = (seq: number): typeof sessionEvents[number] => {
  const matches = sessionEvents.filter(event => event.seq === seq)
  assert.equal(matches.length, 1, `actual JSONL must contain one event at seq ${seq}`)
  const event = matches[0]!
  assert.equal(event.type, 'tool/call')
  assert.equal(event.data.name, 'ask_user_question')
  assert.equal(typeof event.data.arguments, 'string')
  return event
}
const wrongAskEvent = askEvent(16)
const validAskEvent = askEvent(21)
assert.equal(wrongAskEvent.data.callId, 'chatcmpl-tool-ba9522b98ac615d8')
assert.equal(
  sha256(wrongAskEvent.data.arguments!),
  'c57bd4d2679e6364bb725eb629a02042e1aed6af4af87c8e0fb03407ee995115',
)
assert.equal(validAskEvent.data.callId, 'chatcmpl-tool-a0ad7a38e18998d5')
assert.equal(
  sha256(validAskEvent.data.arguments!),
  '18782071255151490d54ad3e658f4a6e8c3d46ed633c7be103f38ac32806a480',
)
const wrongRequest = JSON.parse(wrongAskEvent.data.arguments!) as unknown
const validRequest = JSON.parse(validAskEvent.data.arguments!) as unknown
assert.deepEqual(
  ((wrongRequest as { questions: Array<{ id: string }> }).questions).map(question => question.id),
  ['confirm_scope'],
)
assert.deepEqual(
  ((validRequest as { questions: Array<{ id: string }> }).questions).map(question => question.id),
  ['stance', 'scope', 'need_questions'],
)
const authorizedAnswers = JSON.parse(authorizedAnswerFile.toString('utf8')) as Record<string, string>
assert.deepEqual(Object.keys(authorizedAnswers).sort(), ['need_questions', 'scope', 'stance'])
assert.equal(Object.values(authorizedAnswers).every(value => value.trim().length > 0), true)

const agentSourceFile = parse(agentSourcePath, agentSource)
const denialSource = [
  `const REQUIRED_QUESTIONS_PREFIX = ${extractInitializer(agentSourceFile, 'REQUIRED_QUESTIONS_PREFIX')};`,
  `const INVALID_QUESTION_ASK = ${extractInitializer(agentSourceFile, 'INVALID_QUESTION_ASK')};`,
  `const questionRequirementDenial = ${extractInitializer(agentSourceFile, 'questionRequirementDenial')};`,
  `const invalidQuestionAskDenial = ${extractInitializer(agentSourceFile, 'invalidQuestionAskDenial')};`,
].join('\n')

type InvokeCallback = (request: unknown, question: Record<string, unknown>) => Promise<unknown>
type LoadedCallback = {
  readonly invoke: InvokeCallback
  readonly setReadFile: (implementation: (path: string) => Promise<Uint8Array>) => void
  readonly readCalls: () => number
  readonly networkAttempts: () => number
}

const loadCallback = (path: string, source: string): LoadedCallback => {
  const sourceFile = parse(path, source)
  const callback = extractRequestCallback(path, source).source
  const moduleSource = [
    `const QUESTION_IDS = ${extractInitializer(sourceFile, 'QUESTION_IDS')};`,
    'type QuestionId = typeof QUESTION_IDS[number];',
    `const AUTHORIZED_SYNTHETIC_ANSWERS_PATH = ${extractInitializer(
      sourceFile,
      'AUTHORIZED_SYNTHETIC_ANSWERS_PATH',
    )};`,
    `const AUTHORIZED_SYNTHETIC_ANSWERS_BYTES = ${extractInitializer(
      sourceFile,
      'AUTHORIZED_SYNTHETIC_ANSWERS_BYTES',
    )};`,
    `const AUTHORIZED_SYNTHETIC_ANSWERS_SHA256 = ${extractInitializer(
      sourceFile,
      'AUTHORIZED_SYNTHETIC_ANSWERS_SHA256',
    )};`,
    extractFunction(path, source, 'asRecord'),
    extractFunction(path, source, 'asArray'),
    extractFunction(path, source, 'asString'),
    extractFunction(path, source, 'sha256Bytes'),
    extractFunction(path, source, 'readAuthorizedSyntheticAnswers'),
    denialSource,
    `const callback = ${callback};`,
    'const invokeCallback = async (request, question) => await callback(request, async () => undefined);',
    'exports.invokeCallback = invokeCallback;',
  ].join('\n')
  const transpiled = ts.transpileModule(moduleSource, {
    fileName: `${path}.callback.ts`,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  let readFileImplementation: (path: string) => Promise<Uint8Array> = async () => {
    throw new Error('test read implementation is not configured')
  }
  let readCallCount = 0
  let deniedNetworkAttempts = 0
  const denyNetwork = (name: string) => (..._args: unknown[]): never => {
    deniedNetworkAttempts += 1
    throw new Error(`network denied by finite test: ${name}`)
  }
  const moduleShim: { exports: Record<string, unknown> } = { exports: {} }
  const context = vm.createContext({
    module: moduleShim,
    exports: moduleShim.exports,
    createHash,
    readFile: async (filePath: string): Promise<Uint8Array> => {
      readCallCount += 1
      return await readFileImplementation(filePath)
    },
    fetch: denyNetwork('fetch'),
    WebSocket: denyNetwork('WebSocket'),
    XMLHttpRequest: denyNetwork('XMLHttpRequest'),
    sendBeacon: denyNetwork('sendBeacon'),
    EventSource: denyNetwork('EventSource'),
  }, { codeGeneration: { strings: false, wasm: false } })
  new vm.Script(transpiled, { filename: `${path}.callback.cjs` })
    .runInContext(context, { timeout: 500 })
  const invoke = moduleShim.exports.invokeCallback
  assert.equal(typeof invoke, 'function', `${path} callback did not load`)
  return {
    invoke: invoke as InvokeCallback,
    setReadFile(implementation) {
      readFileImplementation = implementation
    },
    readCalls: () => readCallCount,
    networkAttempts: () => deniedNetworkAttempts,
  }
}

const oldLoaded = loadCallback(oldConsumerPath, oldSource)
const newLoaded = loadCallback(newConsumerPath, newSource)

type TrialQuestion = {
  value: unknown
  invocationCount: number
  answeredCallbackCount: number
  answerReadInFlight: boolean
  unsupportedQuestionIds: Set<string>
  requestedQuestionIds: Set<string>
  answeredQuestionIds: Set<string>
  questionTexts: string[]
  answerTexts: string[]
  answers: Record<string, string> | null
}

const makeQuestion = (): TrialQuestion => ({
  value: null,
  invocationCount: 0,
  answeredCallbackCount: 0,
  answerReadInFlight: false,
  unsupportedQuestionIds: new Set(),
  requestedQuestionIds: new Set(),
  answeredQuestionIds: new Set(),
  questionTexts: [],
  answerTexts: [],
  answers: null,
})

const installAuthorizedRead = (loaded: LoadedCallback): void => {
  loaded.setReadFile(async path => {
    assert.equal(path, authorizedAnswersPath)
    return Buffer.from(authorizedAnswerFile)
  })
}
installAuthorizedRead(oldLoaded)
installAuthorizedRead(newLoaded)

const noAnswers = (question: TrialQuestion): void => {
  assert.equal(question.answers, null)
  assert.equal(question.value, null)
  assert.equal(question.answeredQuestionIds.size, 0)
  assert.equal(question.requestedQuestionIds.size, 0)
  assert.equal(question.questionTexts.length, 0)
  assert.equal(question.answerTexts.length, 0)
}

const oldQuestion = makeQuestion()
await assert.rejects(
  () => oldLoaded.invoke(wrongRequest, oldQuestion),
  { message: 'ask_user_question did not jointly confirm exactly stance, scope, and need_questions' },
)
await assert.rejects(
  () => oldLoaded.invoke(validRequest, oldQuestion),
  { message: 'authorized synthetic callback may answer only one actual ask' },
)
assert.equal(oldQuestion.invocationCount, 2)
noAnswers(oldQuestion)
console.log('PASS old callback: the sealed wrong-confirm_scope ask consumes the sole slot and rejects the valid three-ID ask')

const invalidDenial =
  'ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；'
  + '不得为空、重复或包含未声明 ID。还缺：stance、scope、need_questions'
const missingDenial =
  '提交成果前必须先取得律师对必问问题的真实回答。还缺：need_questions'
const newQuestion = makeQuestion()
await assert.rejects(
  () => newLoaded.invoke(wrongRequest, newQuestion),
  { message: invalidDenial },
)
assert.equal(newQuestion.invocationCount, 1)
assert.equal(newQuestion.answeredCallbackCount, 0)
assert.equal(newQuestion.answerReadInFlight, false)
noAnswers(newQuestion)
const readBeforeValid = newLoaded.readCalls()
const validResponse = await newLoaded.invoke(validRequest, newQuestion)
assert.equal(newLoaded.readCalls(), readBeforeValid + 1)
assert.deepEqual(JSON.parse(JSON.stringify(validResponse)), {
  answers: ['stance', 'scope', 'need_questions'].map(id => ({
    id,
    selected: [],
    custom: authorizedAnswers[id],
  })),
})
assert.equal(newQuestion.invocationCount, 2)
assert.equal(newQuestion.answeredCallbackCount, 1)
assert.equal(newQuestion.answerReadInFlight, false)
assert.deepEqual([...newQuestion.answeredQuestionIds], ['stance', 'scope', 'need_questions'])
assert.deepEqual(JSON.parse(JSON.stringify(newQuestion.answers)), authorizedAnswers)
assert.notEqual(newQuestion.value, null)
console.log('PASS new callback: actual bad ask is locally denied, then the actual valid three-ID ask returns the three authorized answers')

type RequestShape = {
  questions: Array<{
    id: string
    question: string
    options?: unknown
    multi_select?: unknown
  }>
}
const cloneValid = (): RequestShape => structuredClone(validRequest as RequestShape)
const invalidCases: ReadonlyArray<{
  label: string
  request: RequestShape
  denial: string
}> = [
  {
    label: 'unknown id',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.id = 'confirm_scope'
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'duplicate id',
    request: (() => {
      const value = cloneValid()
      value.questions[1]!.id = 'stance'
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'missing id',
    request: (() => {
      const value = cloneValid()
      value.questions.pop()
      return value
    })(),
    denial: missingDenial,
  },
  {
    label: 'empty question list',
    request: { questions: [] },
    denial: invalidDenial,
  },
  {
    label: 'blank question text',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.question = ' \t '
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'non-array options',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.options = {}
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'non-object option',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.options = [null]
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'blank option label',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.options = [{ label: ' ' }]
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'non-string option description',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.options = [{ label: '确认', description: 1 }]
      return value
    })(),
    denial: invalidDenial,
  },
  {
    label: 'non-boolean multi_select',
    request: (() => {
      const value = cloneValid()
      value.questions[0]!.multi_select = 'yes'
      return value
    })(),
    denial: invalidDenial,
  },
]
for (const testCase of invalidCases) {
  const question = makeQuestion()
  const before = newLoaded.readCalls()
  await assert.rejects(
    () => newLoaded.invoke(testCase.request, question),
    { message: testCase.denial },
    testCase.label,
  )
  assert.equal(question.invocationCount, 1, `${testCase.label}: total attempt count`)
  assert.equal(question.answeredCallbackCount, 0, `${testCase.label}: success count`)
  assert.equal(question.answerReadInFlight, false, `${testCase.label}: in-flight lock`)
  assert.equal(newLoaded.readCalls(), before, `${testCase.label}: no answer read allowed`)
  noAnswers(question)
}
console.log('PASS invalid controls: unknown, duplicate, missing, blank text, and malformed options are denied without reads, answers, or success consumption')

const repeatQuestion = makeQuestion()
await newLoaded.invoke(validRequest, repeatQuestion)
await assert.rejects(
  () => newLoaded.invoke(validRequest, repeatQuestion),
  { message: 'authorized synthetic callback may answer only one committed ask' },
)
assert.equal(repeatQuestion.invocationCount, 2)
assert.equal(repeatQuestion.answeredCallbackCount, 1)
assert.equal(repeatQuestion.answerReadInFlight, false)
assert.deepEqual([...repeatQuestion.answeredQuestionIds], ['stance', 'scope', 'need_questions'])
console.log('PASS repeat control: a second ask after commit is rejected without changing the three committed answers')

const concurrentQuestion = makeQuestion()
let releaseRead!: () => void
let reportReadStarted!: () => void
const readStarted = new Promise<void>(resolve => {
  reportReadStarted = resolve
})
newLoaded.setReadFile(async path => {
  assert.equal(path, authorizedAnswersPath)
  reportReadStarted()
  return await new Promise<Uint8Array>(resolve => {
    releaseRead = () => resolve(Buffer.from(authorizedAnswerFile))
  })
})
const readBeforeConcurrent = newLoaded.readCalls()
const firstConcurrent = newLoaded.invoke(validRequest, concurrentQuestion)
await readStarted
assert.equal(concurrentQuestion.answerReadInFlight, true)
await assert.rejects(
  () => newLoaded.invoke(validRequest, concurrentQuestion),
  { message: 'authorized synthetic callback already has an answer read in flight' },
)
releaseRead()
await firstConcurrent
assert.equal(newLoaded.readCalls(), readBeforeConcurrent + 1)
assert.equal(concurrentQuestion.invocationCount, 2)
assert.equal(concurrentQuestion.answeredCallbackCount, 1)
assert.equal(concurrentQuestion.answerReadInFlight, false)
assert.deepEqual([...concurrentQuestion.answeredQuestionIds], ['stance', 'scope', 'need_questions'])
console.log('PASS concurrency control: two overlapping valid asks perform one read and commit exactly one answer set')

const failedReadQuestion = makeQuestion()
newLoaded.setReadFile(async () => {
  throw new Error('injected synthetic answer read failure')
})
await assert.rejects(
  () => newLoaded.invoke(validRequest, failedReadQuestion),
  { message: 'injected synthetic answer read failure' },
)
assert.equal(failedReadQuestion.invocationCount, 1)
assert.equal(failedReadQuestion.answeredCallbackCount, 0)
assert.equal(failedReadQuestion.answerReadInFlight, false)
noAnswers(failedReadQuestion)
installAuthorizedRead(newLoaded)
await newLoaded.invoke(validRequest, failedReadQuestion)
assert.equal(failedReadQuestion.invocationCount, 2)
assert.equal(failedReadQuestion.answeredCallbackCount, 1)
assert.equal(failedReadQuestion.answerReadInFlight, false)
assert.deepEqual([...failedReadQuestion.answeredQuestionIds], ['stance', 'scope', 'need_questions'])
console.log('PASS read-failure control: failure clears the in-flight lock and success count, and a clean retry commits once')

assert.equal(newQuestion.invocationCount, 2)
assert.equal(newQuestion.answeredCallbackCount, 1)
assert.equal(oldLoaded.networkAttempts(), 0)
assert.equal(newLoaded.networkAttempts(), 0)
console.log(
  'PASS callback-finite: attempts and committed answers are separate; no network, credential, child-process, model, HTTP, or whole-consumer path is available',
)
