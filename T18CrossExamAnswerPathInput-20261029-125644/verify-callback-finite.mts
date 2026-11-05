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
  129399,
  '6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454',
  'new consumer',
)
const bService = pinnedBytes(
  bServiceBytes,
  48345,
  'aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d',
  'B service',
)
type LiteralPin = {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}
type NativeManifest = {
  readonly format: string
  readonly task: string
  readonly hashAlgorithm: string
  readonly approvedInputs: LiteralPin
  readonly sourcePins: LiteralPin
  readonly authorizedSyntheticAnswers: LiteralPin
  readonly canonicalTask: LiteralPin & { readonly mtime_ns: string }
  readonly skill: LiteralPin & { readonly mtime_ns: string }
  readonly materials: readonly (LiteralPin & {
    readonly name: string
    readonly mtime_ns: string
  })[]
  readonly referenceNotes: LiteralPin & { readonly mtime_ns: string }
  readonly dependencies: readonly (LiteralPin & { readonly role: string })[]
  readonly compilerPrivate: readonly (LiteralPin & { readonly role: string })[]
  readonly runtimeExecutables: readonly (LiteralPin & { readonly role: string })[]
  readonly consumer: LiteralPin
  readonly bService: LiteralPin
}
const nativeManifest = JSON.parse(pinnedText(
  manifestBytes,
  12276,
  'b802114960025acbd28a567289c6ff066524fd6953142b622e972ab732acc03c',
  'full native input manifest',
)) as NativeManifest
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

const expectedDependencies = [
  {
    role: 'persona',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh-ext\\persona.md',
    bytes: 2706,
    sha256: 'a0dbc2b314f781d2b74a99edce633a289176965a549e00e45c946f0c5bf877c3',
  },
  {
    role: 'dsh-cordis',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\vendor\\cordis\\lib\\index.js',
    bytes: 60361,
    sha256: '6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e',
  },
  {
    role: 'dsh-llm',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\llm\\llm\\src\\index.ts',
    bytes: 53468,
    sha256: 'bda0a46c6cdc927a72b84f45b4caf351753e3e82cc3b8b35707c24857fdd14ba',
  },
  {
    role: 'dsh-session',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\core\\session\\src\\index.ts',
    bytes: 60384,
    sha256: 'e4092a93a5a6daecf9639f2a261cf074d1877318c9ddb2226249802cc21ddd2d',
  },
  {
    role: 'dsh-system-prompt',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\core\\system-prompt\\src\\index.ts',
    bytes: 26532,
    sha256: '9e31442544109b3ff9be13458e826e0dcacbe31d9f59ddd96a6498ab20b1574e',
  },
  {
    role: 'dsh-tools',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\core\\tools\\src\\index.ts',
    bytes: 90679,
    sha256: '9107a2b6447b10c2ecb90429d7c1b80b956759e96d35230af16f5a88f5d3eccd',
  },
  {
    role: 'dsh-agent',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\core\\agent\\src\\index.ts',
    bytes: 31340,
    sha256: '9979fdae64fd0a342067981c39de9cde2da7066d28f8506a501fd51e8f9068b9',
  },
  {
    role: 'dsh-agent-loop',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\core\\agent-loop\\src\\index.ts',
    bytes: 37946,
    sha256: '853e76aef2eecafe5526a5267c3d386780b5c59e3c79c2448532fada7285a605',
  },
  {
    role: 'dsh-session-projection',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\session\\session-projection\\src\\index.ts',
    bytes: 31464,
    sha256: '2186b62bfd59c0b5ea1413287f34e3a5be79b2162c5e0e2eb2143d7e42fea39f',
  },
  {
    role: 'dsh-persistence-jsonl',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\session\\session-persistence-jsonl\\src\\index.ts',
    bytes: 70510,
    sha256: '6c56c465034c7673dd167f2ad7270ad8ce9ae7536457a291dc6a7abb81328436',
  },
  {
    role: 'dsh-session-query',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\session-query\\session-query\\src\\index.ts',
    bytes: 15460,
    sha256: '549f7f90c90efec63a5c7d69dbc65938c0f9578f85dcfc8ee25a49a43a8e83e3',
  },
  {
    role: 'dsh-typert',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\typert\\registry\\src\\index.ts',
    bytes: 1023,
    sha256: 'a6c1aa498660cb50d768c867411943d3760e2bbb8dcd016c950c6294ed626e2a',
  },
  {
    role: 'dsh-llm-pi-ai',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\llm\\llm-pi-ai\\src\\index.ts',
    bytes: 14182,
    sha256: '1aa1823262d01d9e2bdc33177b82bfb1082b4559cbde288bb3606db19d575f2d',
  },
  {
    role: 'controller-agent',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\api\\session-controller\\src\\agent.ts',
    bytes: 22822,
    sha256: '2136af39dc59755f3fc5ef9474ec78ca77576061ea197627f1b664b319a4d769',
  },
  {
    role: 'controller-commands',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\api\\session-controller\\src\\commands.ts',
    bytes: 31548,
    sha256: 'c3ea5af81f21212888364bbd169c9d3d19c93f8720716dfc44ba32c1d164bb2c',
  },
  {
    role: 'controller-projection',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\api\\session-controller\\src\\model-selection-projection.ts',
    bytes: 3041,
    sha256: 'a45bdb4bf86025c62e45e83a582301ff649fea50c94f82eedd81b37ba6ef7f9f',
  },
  {
    role: 'browser-session',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\api\\session-controller\\src\\client\\sessions\\session.ts',
    bytes: 40534,
    sha256: '07dc081cb466087fae1262050b171697efd60d8721b43578baf31e08a8a67b73',
  },
  {
    role: 'skill-registry',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\skill\\skill\\src\\index.ts',
    bytes: 35965,
    sha256: 'af4fad67fb086c3f5c93aed4604830718b4535e7e59a60d680404b07ea08477c',
  },
  {
    role: 'skill-filesystem',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\skill\\skill-filesystem\\src\\index.ts',
    bytes: 39233,
    sha256: 'a3fcfefcc6500f4bd7c19ba48dfa80efad312034f196f81a40d33d0d0098d315',
  },
  {
    role: 'tool-skill',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\skill\\tool-skill\\src\\index.ts',
    bytes: 18371,
    sha256: 'fb7b9f7558d516854ffe159803586decd1da003d7f10e04e026c4b7ca3622a1c',
  },
  {
    role: 'user-questions',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\interaction\\user-questions\\src\\index.ts',
    bytes: 5960,
    sha256: '2d8e7899f9763b308cf3fab3cc1018f5026af8c06a6b39925982ccdb8d934668',
  },
  {
    role: 'tool-ask-user',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\interaction\\tool-ask-user\\src\\index.ts',
    bytes: 3702,
    sha256: 'aa448c483d0e0de805079950c616e45d93b4c972b7a62345b4e4a8c4164bfecf',
  },
  {
    role: 'repeat-tool-reminder',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\guard\\repeat-tool-reminder\\src\\index.ts',
    bytes: 10619,
    sha256: '1e917986fe9c5187d8f0fa11154ab2bf3b7c1d30db991540f4d1e62a2c59236d',
  },
  {
    role: 'installed-lock',
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\node_modules\\.pnpm\\lock.yaml',
    bytes: 1011346,
    sha256: '60c46d0ed242a2f94663b0921b6296dd2db3a64fb2112dbc708a8341828acc38',
  },
  {
    role: 'shared-skill-rules',
    path: 'D:\\Lawbeach\\lawbench-B\\skills\\_shared\\共用规则.md',
    bytes: 6982,
    sha256: 'ebb19fe3584185971e989a87580d1e0f2f5ec1c83cc1c965c9958cbb8aec8b45',
  },
  {
    role: 'cross-exam-opinion-skill',
    path: 'D:\\Lawbeach\\lawbench-B\\skills\\cross-exam-opinion\\SKILL.md',
    bytes: 12390,
    sha256: '03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a',
  },
] as const
const expectedCompilerPrivate = [
  {
    role: 'current-compiled-agent',
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\CrossExamQuestionPrivateBuild-20261029-122319\\private-output-20261029-123906\\profile-node_modules\\lawbench-dsh\\lib\\agent.js',
    bytes: 552937,
    sha256: '8f6bcb5cda92ba88370a425205c74dabc8f699146b3fa68501deb64f62a6ddfe',
  },
  {
    role: 'current-compiled-host',
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\CrossExamQuestionPrivateBuild-20261029-122319\\private-output-20261029-123906\\profile-node_modules\\lawbench-dsh\\lib\\host.js',
    bytes: 902499,
    sha256: 'ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b',
  },
  {
    role: 'current-compiled-package',
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\CrossExamQuestionPrivateBuild-20261029-122319\\private-output-20261029-123906\\profile-node_modules\\lawbench-dsh\\package.json',
    bytes: 1257,
    sha256: '3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794',
  },
  {
    role: 'current-compiled-manifest',
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\CrossExamQuestionPrivateBuild-20261029-122319\\private-output-20261029-123906\\manifest.json',
    bytes: 58196,
    sha256: '3756191ed865dffadfadb964ba55272751b2ed3ae9d6b5b46a4fb07c767a926d',
  },
] as const

assert.equal(nativeManifest.format, 'lawbench-t18-cross-exam-native-inputs-v1')
assert.equal(nativeManifest.task, 'A-T18-cross-exam-native-20261029-113906')
assert.equal(nativeManifest.hashAlgorithm, 'sha256')
assert.equal(nativeManifest.materials.length, 5)
assert.equal(nativeManifest.dependencies.length, 26)
assert.equal(nativeManifest.compilerPrivate.length, 4)
assert.equal(nativeManifest.runtimeExecutables.length, 3)
assert.deepEqual(nativeManifest.dependencies, expectedDependencies)
assert.deepEqual(nativeManifest.compilerPrivate, expectedCompilerPrivate)
assert.deepEqual(nativeManifest.runtimeExecutables.map(entry => entry.role), ['node', 'tsx', 'python'])
assert.deepEqual(nativeManifest.consumer, {
  path: newConsumerPath,
  bytes: newBytes.byteLength,
  sha256: sha256(newBytes),
})
assert.deepEqual(nativeManifest.bService, {
  path: bServicePath,
  bytes: bService.byteLength,
  sha256: sha256(bService),
})

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
      while (
        ts.isAsExpression(callback)
        || ts.isParenthesizedExpression(callback)
      ) {
        callback = callback.expression
      }
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
  "    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/CrossExamQuestionPrivateBuild-20261029-122319/private-output-20261029-123906/profile-node_modules/lawbench-dsh/lib/agent.js'),",
  "    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/ContractDraftQuestionPrivateBuild-20261029-045644/private-output-20261029-050141/profile-node_modules/lawbench-dsh/lib/agent.js'),",
  'current compiled agent import',
)
invertedNewSource = replaceOnce(
  invertedNewSource,
  "    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/CrossExamQuestionPrivateBuild-20261029-122319/private-output-20261029-123906/profile-node_modules/lawbench-dsh/lib/host.js'),",
  "    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/ContractDraftQuestionPrivateBuild-20261029-045644/private-output-20261029-050141/profile-node_modules/lawbench-dsh/lib/host.js'),",
  'current compiled host import',
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
  '4e47b9d46f8c47b7b2becb7136352271d6ea3e6aea1cd7707b9b96fe6fe789d4',
)
assert.equal(validAskEvent.data.callId, 'chatcmpl-tool-a0ad7a38e18998d5')
assert.equal(
  sha256(validAskEvent.data.arguments!),
  '1e90c7a5036f90971453d4be13288991eb273ad19956eaf33f4d4a6ce50850b4',
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
    `const makeCallback = (question) => ${callback};`,
    'const invokeCallback = async (request, question) => await makeCallback(question)(request, async () => undefined);',
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
