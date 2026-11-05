/**
 * Source-only finite contract check for the T18 L0 material-list correction.
 *
 * This file never imports or executes the native consumer's main path. It:
 * - pins the failed-closed actual JSONL and its same-session event sequence;
 * - extracts only the observer/helper functions from the old and new sources;
 * - transpiles those fragments and runs them in a small vm context;
 * - proves the old observer rejects the valid L0-only actual prefix;
 * - proves the new observer accepts it and preserves the question/read/save order;
 * - exercises strict parser failures with direct structured unit inputs.
 *
 * It does not start B, NativeSession, LegalAgent, a model request, a browser,
 * HTTP, Python, or any process other than the caller's Node process.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const COORD_ROOT = 'D:/Lawbeach/lawbench-coord'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const TYPESCRIPT_JS = join(DSH_ROOT, 'node_modules', 'typescript', 'lib', 'typescript.js')
const TYPESCRIPT_PACKAGE = join(DSH_ROOT, 'node_modules', 'typescript', 'package.json')
const NEW_CONSUMER = join(EVIDENCE_DIR, 'native-cross-exam.mts')
const FIXED_INPUTS = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const NEW_B_SERVICE = join(EVIDENCE_DIR, 'b-service-cross-exam.py')
const BASELINE_DIR = join(COORD_ROOT, 'T18CrossExamL0ListingInput-20261029-131449')
const OLD_CONSUMER = join(BASELINE_DIR, 'native-cross-exam.mts')
const OLD_B_SERVICE = join(BASELINE_DIR, 'b-service-cross-exam.py')
const ACTUAL_RUN = join(
  REPO_ROOT,
  'docs',
  'plan',
  'evidence',
  'T18',
  'CrossExamCallbackRecovery-20261029-122319',
  'run-zs09S1',
)
const ACTUAL_JSONL = join(
  ACTUAL_RUN,
  'sessions',
  '--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-CrossExamCallbackRecovery-20261029-122319-run-zs09S1-case--',
  'session-80a6b5e7-bedf-48f3-8ca0-416a28e14afc',
  'session.v4.jsonl',
)
const ACTUAL_REPORT = join(ACTUAL_RUN, 'report.json')
const ACTUAL_TASK = join(ACTUAL_RUN, 'case', '工作区', '任务', 'T-20261029130023-e333', 'task.json')
const OLD_TRACE = join(
  REPO_ROOT,
  'docs',
  'plan',
  'evidence',
  'T18',
  'CrossExamNative-20261029-113906',
  'run-zMFEDU',
  'sessions',
  '--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-CrossExamNative-20261029-113906-run-zMFEDU-case--',
  'session-d099d317-2b32-451d-88f1-203bf04f4e24',
  'session.v4.jsonl',
)
const CROSS_EXAM_SKILL = 'D:/Lawbeach/lawbench-B/skills/cross-exam-opinion/SKILL.md'
const B_CONTEXT_SOURCE = 'D:/Lawbeach/lawbench-B/service/lawbench/case/context.py'
const A_AGENT_SOURCE = join(REPO_ROOT, 'dsh-ext', 'agent', 'index.ts')
const AUTHORIZED_ANSWERS =
  join(COORD_ROOT, 'T18CrossExamNativeInput-20261029-113906', 'authorized-synthetic-answers.json')

const EXPECTED = {
  actualJsonlBytes: 203_065,
  actualJsonlSha256: 'adbca9d61673e8d4768446905d61c0c8da79c74651e0426d2cdb3437596f5f29',
  actualReportBytes: 18_824,
  actualReportSha256: '928143c5247196fbb464d3594088e2b42ac245bbca871947251405a8ee801739',
  actualTaskBytes: 1_463,
  actualTaskSha256: 'c7c2dce83c3d76ae106a34158d0c8708489b4bd401ba7e9f4fef2c813433115b',
  oldTraceBytes: 265_287,
  oldTraceSha256: '13555ca8461f2e76fe987c4f0ff13ce35e57dd20fe6154546d27b01ed0f97604',
  oldConsumerBytes: 129_399,
  oldConsumerSha256: '6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454',
  bServiceBytes: 48_345,
  bServiceSha256: 'aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d',
  skillBytes: 12_390,
  skillSha256: '03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a',
  contextBytes: 6_409,
  contextSha256: '1128f934f13e1f0453be4c73cea1466dd4bf54ede158cd359eedc48a57e4d9ee',
  agentBytes: 46_684,
  agentSha256: '5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c',
  answersBytes: 453,
  answersSha256: '4784dfc3d345ec2010c1443f7f803bc39fdfd5ca19754b2d4bc6b96a0ae2c9ce',
  typescriptJsBytes: 9_144_216,
  typescriptJsSha256: '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39',
  typescriptPackageBytes: 3_527,
  typescriptPackageSha256: '9332e97c30d3e53ed54910b89207ed657fb444066484df6e5b6965bf130865e9',
  fixedInputsBytes: 12_262,
  fixedInputsSha256: 'f7b05ccf8cf43defa8a75bf7f011214c57e589c8486950e88768862cb5c43a06',
  newConsumerBytes: 146_650,
  newConsumerSha256: '7ecfc51ec1e14f651332fbac1df269e38dfd434d8381dee3550297d9ab830139',
  requestId: '32f7ecb5-b38d-466e-bef6-a7d37c0a59cb',
  sessionId: 'session-80a6b5e7-bedf-48f3-8ca0-416a28e14afc',
  caseId: '6b927e80-60d5-4c51-a328-5bba64ca8f1c',
  names: [
    '价格认定结论书',
    '扣押清单',
    '监控视频截图说明',
    '被害人王某丙询问笔录',
    '起诉书',
  ],
  questionIds: ['stance', 'scope', 'need_questions'],
} as const

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly surfaceOp?: string
}

interface ListingScopeEntry {
  readonly materialId: string
  readonly version: string
}

interface ObservationResult {
  readonly listingSource: 'L0' | 'tool'
  readonly listingSourceSeq: number
  readonly listingNames: readonly string[]
  readonly listingScope: readonly ListingScopeEntry[]
  readonly questionIds: readonly string[]
  readonly answerIds: readonly string[]
  readonly lastRequiredAnswerSeq: number
  readonly firstMaterialReadSeq: number
  readonly listingBeforeAnyMaterialRead: true
  readonly successfulSaveAfterRequiredAnswers: true
}

interface ExtractedObserver {
  observeQuestionCallbacks(
    events: readonly NativeEvent[],
    options: {
      readonly callbackInvocations: number
      readonly declaredQuestionIds: readonly string[]
      readonly answers: Readonly<Record<string, string>>
      readonly invalidQuestionAskDenial: (missing: readonly string[]) => string
      readonly missingQuestionAskDenial: (missing: readonly string[]) => string
      readonly requestId?: string
      readonly expectedListingNames: readonly string[]
      readonly expectedListingScope?: readonly ListingScopeEntry[]
    },
  ): ObservationResult
  parseScopedL0Listing?(
    contextEvent: NativeEvent,
    currentRequestEvent: NativeEvent,
    turnStartSeq: number,
    firstMaterialReadSeq: number,
    options: {
      readonly requestId: string
      readonly expectedListingNames: readonly string[]
      readonly expectedListingScope: readonly ListingScopeEntry[]
    },
  ): {
    readonly sourceSeq: number
    readonly names: readonly string[]
    readonly scope: readonly ListingScopeEntry[]
  }
  parseScopedToolListing?(
    resultSeq: number,
    isError: boolean,
    payload: unknown,
    firstMaterialReadSeq: number,
    options: {
      readonly expectedListingNames: readonly string[]
      readonly expectedListingScope: readonly ListingScopeEntry[]
    },
  ): {
    readonly sourceSeq: number
    readonly names: readonly string[]
    readonly scope: readonly ListingScopeEntry[]
  } | undefined
}

const dshRequire = createRequire(join(DSH_ROOT, 'package.json'))

function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function pinnedFile(path: string, bytes: number, digest: string): Promise<Buffer> {
  const info = await lstat(path)
  assert.equal(info.isFile(), true, `not an ordinary file: ${path}`)
  assert.equal(info.isSymbolicLink(), false, `symlink is not allowed: ${path}`)
  const value = await readFile(path)
  assert.equal(value.byteLength, bytes, `byte count changed: ${path}`)
  assert.equal(sha256(value), digest, `SHA-256 changed: ${path}`)
  return value
}

function eventAt(events: readonly NativeEvent[], seq: number): NativeEvent {
  const matches = events.filter(event => event.seq === seq)
  assert.equal(matches.length, 1, `expected exactly one event at seq ${seq}`)
  return matches[0]!
}

function cloneEvent(event: NativeEvent): any {
  return structuredClone(event)
}

function errorShape(error: unknown): { readonly name: string; readonly message: string } {
  assert.equal(error !== null && typeof error === 'object', true, 'thrown value is not an object')
  const row = error as Record<string, unknown>
  assert.equal(typeof row.message, 'string', 'thrown value has no string message')
  return {
    name: typeof row.name === 'string' ? row.name : 'Error',
    message: row.message as string,
  }
}

function expectThrowsMessage(action: () => unknown, expected: string, label: string): void {
  let thrown = false
  try {
    action()
  } catch (error: unknown) {
    thrown = true
    const shape = errorShape(error)
    assert.equal(shape.name, 'Error', `${label}: unexpected error name`)
    assert.equal(shape.message, expected, `${label}: exact message changed`)
  }
  assert.equal(thrown, true, `${label}: expected an actual throw`)
}

function jsonBridge<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// UNIT_ONLY structured controls: these events are plain data, never claims
// about a Native Session, model output, or sealed production trace.
function withUnitToolAttempt(
  events: readonly NativeEvent[],
  options: {
    readonly callId: string
    readonly payload?: unknown
    readonly rawText?: string
    readonly isError?: boolean
    readonly omitResult?: boolean
    readonly duplicateResult?: boolean
  },
): NativeEvent[] {
  const call: NativeEvent = {
    type: 'tool/call',
    seq: 19.25,
    time: 0,
    data: {
      name: 'case_list_materials',
      callId: options.callId,
      arguments: {},
    },
  }
  const result: NativeEvent = {
    type: 'tool/result',
    seq: 19.75,
    time: 0,
    data: {
      message: {
        isError: options.isError === true,
        content: [{
          type: 'text',
          text: options.rawText ?? JSON.stringify(options.payload),
        }],
        source: { callId: options.callId },
      },
    },
  }
  const injected = options.omitResult
    ? [call]
    : options.duplicateResult
      ? [call, result, { ...result, seq: 19.875 }]
      : [call, result]
  return [...events, ...injected].sort((left, right) => left.seq - right.seq)
}

function extractObserver(
  ts: typeof import('typescript'),
  sourceText: string,
  sourcePath: string,
): ExtractedObserver {
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const names = new Set([
    'asRecord',
    'asArray',
    'asString',
    'sha256Bytes',
    'eventMessageText',
    'toolCallsFromEvents',
    'toolResultValue',
    'toolResultRecord',
    'parseAskQuestionShape',
    'askQuestionArguments',
    'sameNames',
    'assertExpectedListing',
    'parseScopedToolListing',
    'parseScopedL0Listing',
    'observeQuestionCallbacks',
  ])
  const snippets: string[] = []
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || statement.name === undefined) continue
    if (!names.has(statement.name.text)) continue
    snippets.push(statement.getText(source))
  }
  assert.equal(
    snippets.some(snippet => snippet.includes('function observeQuestionCallbacks(')),
    true,
    `observer is absent from ${sourcePath}`,
  )
  const compiled = ts.transpileModule(snippets.join('\n\n'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      removeComments: true,
    },
    fileName: sourcePath,
  }).outputText
  const exports: Record<string, unknown> = {}
  const context = vm.createContext({ exports, createHash })
  new vm.Script(compiled, { filename: `${sourcePath}::observer-fragment` }).runInContext(context)
  return exports as unknown as ExtractedObserver
}

function answerDenials(): {
  invalidQuestionAskDenial: (missing: readonly string[]) => string
  missingQuestionAskDenial: (missing: readonly string[]) => string
} {
  return {
    invalidQuestionAskDenial: missing =>
      'ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：'
      + missing.join('、'),
    missingQuestionAskDenial: missing =>
      '提交成果前必须先取得律师对必问问题的真实回答。还缺：' + missing.join('、'),
  }
}

async function main(): Promise<void> {
  await pinnedFile(
    TYPESCRIPT_JS,
    EXPECTED.typescriptJsBytes,
    EXPECTED.typescriptJsSha256,
  )
  await pinnedFile(
    TYPESCRIPT_PACKAGE,
    EXPECTED.typescriptPackageBytes,
    EXPECTED.typescriptPackageSha256,
  )
  const ts = dshRequire('typescript') as typeof import('typescript')
  const actualJsonlBytes = await pinnedFile(
    ACTUAL_JSONL,
    EXPECTED.actualJsonlBytes,
    EXPECTED.actualJsonlSha256,
  )
  const reportBytes = await pinnedFile(
    ACTUAL_REPORT,
    EXPECTED.actualReportBytes,
    EXPECTED.actualReportSha256,
  )
  const actualTaskBytes = await pinnedFile(
    ACTUAL_TASK,
    EXPECTED.actualTaskBytes,
    EXPECTED.actualTaskSha256,
  )
  const oldTraceBytes = await pinnedFile(OLD_TRACE, EXPECTED.oldTraceBytes, EXPECTED.oldTraceSha256)
  const oldConsumerBytes = await pinnedFile(
    OLD_CONSUMER,
    EXPECTED.oldConsumerBytes,
    EXPECTED.oldConsumerSha256,
  )
  const bServiceBytes = await pinnedFile(
    NEW_B_SERVICE,
    EXPECTED.bServiceBytes,
    EXPECTED.bServiceSha256,
  )
  await pinnedFile(OLD_B_SERVICE, EXPECTED.bServiceBytes, EXPECTED.bServiceSha256)
  const skillBytes = await pinnedFile(CROSS_EXAM_SKILL, EXPECTED.skillBytes, EXPECTED.skillSha256)
  const contextBytes = await pinnedFile(B_CONTEXT_SOURCE, EXPECTED.contextBytes, EXPECTED.contextSha256)
  const agentBytes = await pinnedFile(A_AGENT_SOURCE, EXPECTED.agentBytes, EXPECTED.agentSha256)
  const answerBytes = await pinnedFile(AUTHORIZED_ANSWERS, EXPECTED.answersBytes, EXPECTED.answersSha256)
  const fixedInputsBytes = await pinnedFile(
    FIXED_INPUTS,
    EXPECTED.fixedInputsBytes,
    EXPECTED.fixedInputsSha256,
  )
  const newConsumerBytes = await pinnedFile(
    NEW_CONSUMER,
    EXPECTED.newConsumerBytes,
    EXPECTED.newConsumerSha256,
  )

  const report = JSON.parse(reportBytes.toString('utf8')) as Record<string, any>
  assert.equal(report.status, 'FAILED')
  assert.equal(report.error?.message, 'actual tool loop lacks case_list_materials')
  assert.equal(report.originalInputsHeld, true)
  assert.equal(report.bService?.forcedStop, false)
  assert.equal(report.bService?.final?.listenerClosed, true)

  const fixed = JSON.parse(fixedInputsBytes.toString('utf8')) as Record<string, any>
  assert.equal(fixed.consumer.path, NEW_CONSUMER)
  assert.equal(fixed.consumer.bytes, newConsumerBytes.byteLength)
  assert.equal(fixed.consumer.sha256, sha256(newConsumerBytes))
  assert.equal(fixed.bService.path, NEW_B_SERVICE)
  assert.equal(fixed.bService.bytes, EXPECTED.bServiceBytes)
  assert.equal(fixed.bService.sha256, EXPECTED.bServiceSha256)
  assert.equal(fixed.materials.length, 5)
  assert.equal(fixed.dependencies.length, 26)
  assert.equal(fixed.compilerPrivate.length, 4)
  assert.equal(fixed.runtimeExecutables.length, 3)

  const actualRows = actualJsonlBytes.toString('utf8').trimEnd().split(/\r?\n/)
  assert.equal(actualRows.length, 49)
  const header = JSON.parse(actualRows[0]!) as Record<string, any>
  assert.equal(header.type, 'session')
  assert.equal(header.version, 4)
  assert.equal(header.id, EXPECTED.sessionId)
  const events = actualRows.slice(1).map(row => JSON.parse(row) as NativeEvent)
  assert.equal(events.length, 48)
  assert.deepEqual(events.map(event => event.seq), Array.from({ length: 48 }, (_, index) => index))
  assert.equal(eventAt(events, 5).type, 'user/message')
  assert.equal(eventAt(events, 6).type, 'user/message')
  assert.equal(eventAt(events, 16).type, 'tool/call')
  assert.equal(eventAt(events, 17).type, 'tool/result')
  assert.equal(eventAt(events, 21).type, 'tool/call')
  assert.equal(eventAt(events, 31).type, 'tool/call')
  assert.equal(eventAt(events, 32).type, 'tool/result')

  const task = JSON.parse(actualTaskBytes.toString('utf8')) as Record<string, any>
  assert.equal(task.request_id, EXPECTED.requestId)
  assert.equal(task.case_id, EXPECTED.caseId)
  assert.equal(task.request_scope.request_id, EXPECTED.requestId)
  assert.equal(task.request_scope.kind, 'materials')
  assert.equal(task.request_scope.materials.length, EXPECTED.names.length)
  const scope: ListingScopeEntry[] = task.request_scope.materials.map((row: Record<string, unknown>) => ({
    materialId: String(row.material_id),
    version: String(row.sha256),
  }))
  assert.deepEqual(scope.map(row => row.materialId), ['M0001', 'M0002', 'M0003', 'M0004', 'M0005'])

  const answers = JSON.parse(answerBytes.toString('utf8')) as Record<string, string>
  assert.deepEqual(Object.keys(answers).sort(), [...EXPECTED.questionIds].sort())
  const answerResult = JSON.parse(
    (eventAt(events, 17).data as any).message.content[0].text,
  ) as { answers: { id: string; custom: string }[] }
  assert.deepEqual(answerResult.answers.map(row => row.id), EXPECTED.questionIds)
  assert.deepEqual(
    Object.fromEntries(answerResult.answers.map(row => [row.id, row.custom])),
    answers,
  )

  const oldTrace = oldTraceBytes.toString('utf8').trimEnd().split(/\r?\n/).slice(1)
    .map(row => JSON.parse(row) as NativeEvent)
  const otherRequestIds = oldTrace.flatMap(event => {
    if (event.type !== 'user/message') return []
    const source = (event.data as any)?.source
    return source?.kind === 'user' && typeof source.rpcId === 'string' ? [source.rpcId] : []
  })
  assert.equal(new Set(otherRequestIds).size, 1)
  const otherRequestId = otherRequestIds[0]!
  assert.notEqual(otherRequestId, EXPECTED.requestId)

  const oldSource = oldConsumerBytes.toString('utf8')
  const newSource = newConsumerBytes.toString('utf8')
  const oldObserver = extractObserver(ts, oldSource, OLD_CONSUMER)
  const newObserver = extractObserver(ts, newSource, NEW_CONSUMER)
  assert.equal(typeof newObserver.parseScopedL0Listing, 'function')
  assert.equal(typeof newObserver.parseScopedToolListing, 'function')

  const baseOptions = {
    callbackInvocations: 1,
    declaredQuestionIds: EXPECTED.questionIds,
    answers,
    expectedListingNames: EXPECTED.names,
    ...answerDenials(),
  }
  const oldResult = (() => {
    try {
      oldObserver.observeQuestionCallbacks(events, baseOptions)
      return undefined
    } catch (error: unknown) {
      return error
    }
  })()
  const oldResultShape = errorShape(oldResult)
  assert.equal(oldResultShape.name, 'Error')
  assert.equal(
    oldResultShape.message,
    'actual tool loop lacks case_list_materials',
    'old observer must fail with its exact original message',
  )

  const newOptions = {
    ...baseOptions,
    requestId: EXPECTED.requestId,
    expectedListingScope: scope,
  }
  const actual = jsonBridge<ObservationResult>(
    newObserver.observeQuestionCallbacks(events, newOptions),
  )
  assert.equal(actual.listingSource, 'L0')
  assert.equal(actual.listingSourceSeq, 5)
  assert.deepEqual(actual.listingNames, EXPECTED.names)
  assert.deepEqual(actual.listingScope, scope)
  assert.deepEqual(actual.questionIds, EXPECTED.questionIds)
  assert.deepEqual(actual.answerIds, EXPECTED.questionIds)
  assert.equal(actual.lastRequiredAnswerSeq, 17)
  assert.equal(actual.firstMaterialReadSeq, 21)
  assert.equal(actual.listingBeforeAnyMaterialRead, true)
  assert.equal(actual.successfulSaveAfterRequiredAnswers, true)
  assert.ok(32 > actual.firstMaterialReadSeq, 'the first successful save must follow the first material read')

  const contextEvent = eventAt(events, 5)
  const requestEvent = eventAt(events, 6)
  const turnStart = events.find(event => event.type === 'turn/start')
  assert.ok(turnStart !== undefined)
  const parseL0 = newObserver.parseScopedL0Listing!

  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(events.filter(event => event.seq !== 5), newOptions),
    'no successful exact case_list_materials result or actual scoped L0 snapshot precedes every material read or search',
    'removing the actual L0 context must fail',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(events, { ...newOptions, requestId: otherRequestId }),
    'event prefix does not contain exactly one current request',
    'another actual sealed-trace R must not bind this event prefix',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(events, {
      ...newOptions,
      expectedListingNames: [...EXPECTED.names.slice(0, -1), '错误批次材料'],
    }),
    'L0 material names do not match the current material scope',
    'a wrong expected batch must fail',
  )
  expectThrowsMessage(
    () => parseL0(contextEvent, requestEvent, turnStart.seq, 4, newOptions),
    'L0 context is not before the current request and every material read',
    'a material list after the first read must fail',
  )

  const wrongSource = cloneEvent(contextEvent)
  wrongSource.data.source.kind = 'user'
  expectThrowsMessage(
    () => parseL0(wrongSource, requestEvent, turnStart.seq, 21, newOptions),
    'context source is not a lawbench-context snapshot',
    'user prose is not an L0 source',
  )

  const withoutL0Section = cloneEvent(contextEvent)
  withoutL0Section.data.source.sections = withoutL0Section.data.source.sections
    .filter((section: Record<string, unknown>) => section.name !== '案件卡片（L0）')
  expectThrowsMessage(
    () => parseL0(withoutL0Section, requestEvent, turnStart.seq, 21, newOptions),
    'context snapshot does not contain exactly one L0 section',
    'a missing typed L0 section must fail',
  )

  const duplicate = cloneEvent(contextEvent)
  const duplicateSection = duplicate.data.source.sections
    .find((section: Record<string, unknown>) => section.name === '案件卡片（L0）')
  duplicateSection.text = `${duplicateSection.text}- 价格认定结论书（已解析）\n`
  expectThrowsMessage(
    () => parseL0(duplicate, requestEvent, turnStart.seq, 21, newOptions),
    'L0 material list is empty or duplicated',
    'duplicate material names must fail',
  )

  const extra = cloneEvent(contextEvent)
  const extraSection = extra.data.source.sections
    .find((section: Record<string, unknown>) => section.name === '案件卡片（L0）')
  extraSection.text = `${extraSection.text}- 额外材料（已解析）\n`
  expectThrowsMessage(
    () => parseL0(extra, requestEvent, turnStart.seq, 21, newOptions),
    'L0 material names do not match the current material scope',
    'extra material names must fail',
  )

  const renamed = cloneEvent(contextEvent)
  const renamedSection = renamed.data.source.sections
    .find((section: Record<string, unknown>) => section.name === '案件卡片（L0）')
  renamedSection.text = renamedSection.text.replace('价格认定结论书', '价格认定报告书')
  expectThrowsMessage(
    () => parseL0(renamed, requestEvent, turnStart.seq, 21, newOptions),
    'L0 material names do not match the current material scope',
    'renamed material names must fail',
  )

  const toolPayload = { materials: EXPECTED.names.map(name => ({ name })) }
  const toolListing = jsonBridge<ReturnType<NonNullable<ExtractedObserver['parseScopedToolListing']>>>(
    newObserver.parseScopedToolListing!(20, false, toolPayload, 21, newOptions),
  )
  assert.ok(toolListing !== undefined)
  assert.equal(toolListing.sourceSeq, 20)
  assert.deepEqual(toolListing.names, EXPECTED.names)
  assert.deepEqual(toolListing.scope, scope)
  assert.equal(
    newObserver.parseScopedToolListing!(21, false, toolPayload, 21, newOptions),
    undefined,
    'a tool list at the first read is late',
  )
  expectThrowsMessage(
    () => newObserver.parseScopedToolListing!(
      20,
      false,
      { materials: [{ name: '错误批次材料' }] },
      21,
      newOptions,
    ),
    'successful material-list tool result does not match the current material scope',
    'a successful tool list with wrong names must fail',
  )

  const validToolAttempt = jsonBridge<ObservationResult>(
    newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-valid-tool',
        payload: toolPayload,
      }),
      newOptions,
    ),
  )
  assert.equal(validToolAttempt.listingSource, 'tool')
  assert.deepEqual(validToolAttempt.listingNames, EXPECTED.names)

  const failedToolAttempt = jsonBridge<ObservationResult>(
    newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-failed-tool',
        payload: { materials: [] },
        isError: true,
      }),
      newOptions,
    ),
  )
  assert.equal(failedToolAttempt.listingSource, 'L0')
  assert.equal(failedToolAttempt.listingSourceSeq, 5)

  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-missing-materials',
        payload: {},
      }),
      newOptions,
    ),
    'expected an array',
    'a successful malformed tool result must not fall back to L0',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-missing-name',
        payload: { materials: [{}] },
      }),
      newOptions,
    ),
    'listed material 1 name must be a string',
    'a successful tool result missing a name must fail',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-duplicate-name',
        payload: { materials: [{ name: EXPECTED.names[0] }, { name: EXPECTED.names[0] }] },
      }),
      newOptions,
    ),
    'successful material-list tool result contains duplicate names',
    'a successful tool result with duplicate names must fail',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-extra-name',
        payload: { materials: [...EXPECTED.names, '额外材料'].map(name => ({ name })) },
      }),
      newOptions,
    ),
    'successful material-list tool result does not match the current material scope',
    'a successful tool result with an extra name must fail',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-missing-result',
        payload: toolPayload,
        omitResult: true,
      }),
      newOptions,
    ),
    'tool result is missing for unit-missing-result',
    'a successful-looking tool call without a result must fail',
  )
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(
      withUnitToolAttempt(events, {
        callId: 'unit-duplicate-result',
        payload: toolPayload,
        duplicateResult: true,
      }),
      newOptions,
    ),
    'tool result is duplicated for unit-duplicate-result',
    'duplicate tool results must fail before L0 fallback',
  )
  const duplicateCalls = withUnitToolAttempt(events, {
    callId: 'unit-duplicate-call',
    payload: toolPayload,
  })
  const firstUnitCall = duplicateCalls.find(event => (
    event.type === 'tool/call' && (event.data as any).callId === 'unit-duplicate-call'
  ))!
  duplicateCalls.push({ ...firstUnitCall, seq: 19.5 })
  duplicateCalls.sort((left, right) => left.seq - right.seq)
  expectThrowsMessage(
    () => newObserver.observeQuestionCallbacks(duplicateCalls, newOptions),
    'tool call IDs are duplicated',
    'duplicate tool call IDs must fail before L0 fallback',
  )

  assert.ok(contextBytes.toString('utf8').includes('## 材料清单'))
  assert.ok(contextBytes.toString('utf8').includes("lines.append(f\"- {m['name']}（{STATUS.get(m['status'], m['status'])}）\")"))
  assert.ok(agentBytes.toString('utf8').includes("const sections = [{ name: '案件卡片（L0）', text: l0.text }"))
  assert.ok(skillBytes.toString('utf8').includes('没有目录时按 L0 材料清单或 `case_list_materials` 返回的 `name` 逐份列'))

  console.log(JSON.stringify({
    status: 'FINITE_PASS',
    scope: 'pure observer/helper contract; not complete business verification',
    actualSequence: {
      l0Seq: 5,
      requestSeq: 6,
      questionCallSeq: 16,
      answerResultSeq: 17,
      firstMaterialReadSeq: 21,
      firstSaveCallSeq: 31,
      firstSaveResultSeq: 32,
      lastEventSeq: 47,
    },
    oldObserver: 'REJECTED_VALID_L0_ONLY_ACTUAL_PREFIX',
    newObserver: {
      listingSource: actual.listingSource,
      listingSourceSeq: actual.listingSourceSeq,
      listingNames: actual.listingNames,
      listingScope: actual.listingScope,
      answerIds: actual.answerIds,
    },
    sourcePins: {
      actualJsonl: EXPECTED.actualJsonlSha256,
      oldConsumer: EXPECTED.oldConsumerSha256,
      currentConsumer: sha256(newConsumerBytes),
      bService: EXPECTED.bServiceSha256,
      skill: EXPECTED.skillSha256,
      bContext: EXPECTED.contextSha256,
      aAgent: EXPECTED.agentSha256,
      authorizedAnswers: EXPECTED.answersSha256,
    },
    negativeControls: [
      'L0_removed',
      'other_sealed_trace_R',
      'wrong_expected_batch',
      'late_L0',
      'non_context_source',
      'missing_typed_L0_section',
      'duplicate_name',
      'extra_name',
      'renamed_name',
      'tool_list_late',
      'tool_list_wrong_names',
      'successful_tool_missing_materials',
      'successful_tool_missing_name',
      'successful_tool_duplicate_name',
      'successful_tool_extra_name',
      'successful_tool_missing_result',
      'successful_tool_duplicate_result',
      'duplicate_tool_call_id',
      'failed_tool_preserves_L0',
    ],
  }, null, 2))
}

await main()
