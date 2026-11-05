/**
 * Root-controlled finite check for the T18 question-call observer.
 *
 * Authored only. It imports the current exported observer and the current
 * frozen compiled LegalAgent denial functions after the root-owned go signal.
 * It uses the immutable eight-event actual subset plus plain in-memory copies
 * for negative controls. It creates no Agent, Session, Context, model request,
 * HTTP request, credential, task, case, or history.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { access, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const CONSUMER_PATH = join(EVIDENCE_DIR, 'native-contract-draft.mts')
const MANIFEST_PATH = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const B_SERVICE_PATH = join(EVIDENCE_DIR, 'b-service-contract-draft.py')
const ACTUAL_TRACE_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18ContractQuestionObserverInput-20261029-061636\\actual-question-event-evidence-subset.json'
const COMPILED_AGENT_PATH =
  'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\ContractDraftQuestionPrivateBuild-20261029-045644\\private-output-20261029-050141\\profile-node_modules\\lawbench-dsh\\lib\\agent.js'
const ACTUAL_TRACE_BYTES = 26_311
const ACTUAL_TRACE_SHA256 =
  '5fab19f7f3c210f298ca363e0592d0b3165adb5f13ac103324cc7f4d59f08b45'
const COMPILED_AGENT_BYTES = 552_781
const COMPILED_AGENT_SHA256 =
  'f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f'
const B_SERVICE_BYTES = 45_468
const B_SERVICE_SHA256 =
  '2f25915f5cd549ae373d187b8e49f9b8d0f1af7fb81e249c2f46043de723c164'
const CONSUMER_BYTES = 114_845
const CONSUMER_SHA256 =
  '94ba5fbcf35f65f90b66dbb9e0143250061d9f52f9d6a18f3dd0116f4f2f7c3c'
const MANIFEST_BYTES = 10_775
const MANIFEST_SHA256 =
  '86515893b9cdf6066ddc116f05f6dcae7806eb389884d641270ee7da3f48c950'
const QUESTION_IDS = ['our_party', 'doc_scope', 'deal_terms'] as const
const QUESTION_ANSWERS: Readonly<Record<string, string>> = {
  our_party: '我方代表采购方青禾建材。',
  doc_scope: '起草完整的钢材采购合同。',
  deal_terms: '交易条件按材料来；尚未谈妥的事项保留待确认，不自行选择。',
}

interface TraceEvent {
  readonly type: string
  readonly seq: number
  readonly data: any
}

interface TraceFile {
  readonly format: 'READONLY_ACTUAL_NATIVE_EVIDENCE_SUBSET_NOT_SESSION_LOG'
  readonly source_sha256: '949c36b027d9e8192b8c298bc0b7065a6ef95ba9501190bfb6b24742d7b9182b'
  readonly native_session: 'session-14ffaca5-104b-4398-9898-44676da164ee'
  readonly actual_seq: readonly number[]
  readonly events: readonly TraceEvent[]
  readonly callback_invocations: 1
  readonly callback_requested_ids: readonly string[]
  readonly callback_answered_ids: readonly string[]
  readonly callback_unsupported_ids: readonly string[]
  readonly source_manually_reviewed: true
  readonly not_for_model_or_native_session_loading: true
}

interface ObservedQuestionCall {
  readonly callId: string
  readonly reason?: string
  readonly seq: number
  readonly resultSeq: number
  readonly answered: false
}

interface ObserverResult {
  readonly allAskCallIds: readonly string[]
  readonly rejectedCalls: readonly ObservedQuestionCall[]
  readonly answeredCallIds: readonly string[]
  readonly questionIds: readonly string[]
  readonly answerIds: readonly string[]
  readonly lastRequiredAnswerSeq: number
  readonly successfulSaveAfterRequiredAnswers: true
}

type Observer = (
  events: readonly TraceEvent[],
  options: {
    readonly callbackInvocations: number
    readonly declaredQuestionIds: readonly string[]
    readonly answers: Readonly<Record<string, string>>
    readonly invalidQuestionAskDenial: (missing: readonly string[]) => string
    readonly missingQuestionAskDenial: (missing: readonly string[]) => string
  },
) => ObserverResult

interface Cli {
  readonly out: string
  readonly ready: string
  readonly go: string
  readonly goTimeout: number
}

let activeCli: Cli | undefined

function sha256(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function readPinned(
  path: string,
  bytes: number,
  expectedSha256: string,
): Promise<Buffer> {
  const value = await readFile(path)
  assert.equal(value.byteLength, bytes, `byte count mismatch: ${path}`)
  assert.equal(sha256(value), expectedSha256, `SHA-256 mismatch: ${path}`)
  return value
}

function under(root: string, path: string): boolean {
  const rel = relative(resolve(root), resolve(path))
  return rel.length > 0 && !rel.startsWith('..') && !isAbsolute(rel)
}

function parseCli(argv: readonly string[]): Cli {
  const values = new Map<string, string>()
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    assert.ok(flag !== undefined && value !== undefined, 'flags require values')
    assert.ok(['--out', '--ready', '--go', '--go-timeout'].includes(flag), `unknown flag ${flag}`)
    assert.equal(values.has(flag), false, `duplicate flag ${flag}`)
    values.set(flag, value)
  }
  const out = values.get('--out')
  const ready = values.get('--ready')
  const go = values.get('--go')
  const rawTimeout = values.get('--go-timeout') ?? '30'
  assert.ok(out !== undefined && ready !== undefined && go !== undefined,
    '--out, --ready, and --go are required')
  const goTimeout = Number(rawTimeout)
  assert.ok(Number.isFinite(goTimeout) && goTimeout > 0 && goTimeout <= 60,
    '--go-timeout must be in (0, 60]')
  const absoluteOut = resolve(out)
  const absoluteReady = resolve(ready)
  const absoluteGo = resolve(go)
  assert.equal(under(absoluteOut, absoluteReady), true, '--ready must be under --out')
  assert.equal(under(absoluteOut, absoluteGo), true, '--go must be under --out')
  assert.notEqual(absoluteReady, absoluteGo, '--ready and --go must differ')
  return { out: absoluteOut, ready: absoluteReady, go: absoluteGo, goTimeout }
}

async function waitForGo(path: string, timeoutSeconds: number): Promise<void> {
  const deadline = Date.now() + timeoutSeconds * 1_000
  for (;;) {
    try {
      await access(path)
      return
    } catch {
      if (Date.now() >= deadline) throw new Error(`go signal absent after ${timeoutSeconds}s`)
      await new Promise(resolveDelay => setTimeout(resolveDelay, 50))
    }
  }
}

function eventAt(events: readonly TraceEvent[], type: string, seq: number): TraceEvent {
  const event = events.find(value => value.type === type && value.seq === seq)
  assert.ok(event !== undefined, `missing ${type} event at seq ${seq}`)
  return event
}

function cloneEvents(events: readonly TraceEvent[]): TraceEvent[] {
  return structuredClone(events) as TraceEvent[]
}

function runObserver(
  observer: Observer,
  events: readonly TraceEvent[],
  callbackInvocations: number,
  invalidQuestionAskDenial: (missing: readonly string[]) => string,
  missingQuestionAskDenial: (missing: readonly string[]) => string,
): ObserverResult {
  return observer(events, {
    callbackInvocations,
    declaredQuestionIds: QUESTION_IDS,
    answers: QUESTION_ANSWERS,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  })
}

function expectRejected(
  cases: Array<{ name: string; outcome: string }>,
  name: string,
  work: () => unknown,
): void {
  let error: unknown
  try {
    work()
  } catch (caught) {
    error = caught
  }
  assert.ok(error instanceof Error, `${name} did not reject`)
  cases.push({ name, outcome: error.message })
}

async function main(): Promise<void> {
  const startedAtUtc = new Date().toISOString()
  const cli = parseCli(process.argv.slice(2))
  activeCli = cli
  assert.equal((await readdir(cli.out)).length, 0, '--out must be an existing empty directory')
  await assert.rejects(access(cli.ready))
  await assert.rejects(access(cli.go))

  const ready = {
    format: 'lawbench-t18-contract-question-observer-ready-v1',
    status: 'READY_FOR_ROOT_CAPTURE',
    pid: process.pid,
    executable: process.execPath,
    startedAtUtc,
    consumerPath: CONSUMER_PATH,
    consumerBytes: CONSUMER_BYTES,
    consumerSha256: CONSUMER_SHA256,
    manifestBytes: MANIFEST_BYTES,
    manifestSha256: MANIFEST_SHA256,
    bServiceBytes: B_SERVICE_BYTES,
    bServiceSha256: B_SERVICE_SHA256,
    actualTracePath: ACTUAL_TRACE_PATH,
    actualTraceBytes: ACTUAL_TRACE_BYTES,
    actualTraceSha256: ACTUAL_TRACE_SHA256,
    compiledAgentPath: COMPILED_AGENT_PATH,
    compiledAgentBytes: COMPILED_AGENT_BYTES,
    compiledAgentSha256: COMPILED_AGENT_SHA256,
    childProcessesCreated: 0,
  }
  await writeFile(cli.ready, `${JSON.stringify(ready, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  await waitForGo(cli.go, cli.goTimeout)

  const currentConsumer = await readPinned(CONSUMER_PATH, CONSUMER_BYTES, CONSUMER_SHA256)
  const currentManifest = await readPinned(MANIFEST_PATH, MANIFEST_BYTES, MANIFEST_SHA256)
  const bService = await readPinned(B_SERVICE_PATH, B_SERVICE_BYTES, B_SERVICE_SHA256)
  const traceBytes = await readPinned(ACTUAL_TRACE_PATH, ACTUAL_TRACE_BYTES, ACTUAL_TRACE_SHA256)
  await readPinned(COMPILED_AGENT_PATH, COMPILED_AGENT_BYTES, COMPILED_AGENT_SHA256)

  const observerModule = await import(pathToFileURL(CONSUMER_PATH).href) as {
    observeQuestionCallbacks?: Observer
  }
  const observer = observerModule.observeQuestionCallbacks
  if (typeof observer !== 'function') throw new Error('current observer export is missing')
  const agentModule = await import(pathToFileURL(COMPILED_AGENT_PATH).href) as {
    invalidQuestionAskDenial?: (missing: readonly string[]) => string
    questionRequirementDenial?: (missing: readonly string[]) => string
  }
  const invalidQuestionAskDenial = agentModule.invalidQuestionAskDenial
  const missingQuestionAskDenial = agentModule.questionRequirementDenial
  if (typeof invalidQuestionAskDenial !== 'function') {
    throw new Error('frozen compiled invalidQuestionAskDenial is missing')
  }
  if (typeof missingQuestionAskDenial !== 'function') {
    throw new Error('frozen compiled questionRequirementDenial is missing')
  }

  const trace = JSON.parse(traceBytes.toString('utf8')) as TraceFile
  assert.equal(trace.format, 'READONLY_ACTUAL_NATIVE_EVIDENCE_SUBSET_NOT_SESSION_LOG')
  assert.equal(trace.source_sha256, '949c36b027d9e8192b8c298bc0b7065a6ef95ba9501190bfb6b24742d7b9182b')
  assert.equal(trace.native_session, 'session-14ffaca5-104b-4398-9898-44676da164ee')
  assert.deepEqual(trace.actual_seq, [26, 27, 31, 32, 36, 37, 41, 42])
  assert.deepEqual(trace.events.map(event => event.seq), trace.actual_seq)
  assert.equal(trace.callback_invocations, 1)
  assert.deepEqual(trace.callback_requested_ids, QUESTION_IDS)
  assert.deepEqual(trace.callback_answered_ids, QUESTION_IDS)
  assert.deepEqual(trace.callback_unsupported_ids, [])
  assert.equal(trace.source_manually_reviewed, true)
  assert.equal(trace.not_for_model_or_native_session_loading, true)

  const accepted = runObserver(
    observer,
    trace.events,
    trace.callback_invocations,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  )
  assert.deepEqual(accepted.allAskCallIds, [
    'chatcmpl-tool-937dd4784aa64915',
    'chatcmpl-tool-81dba7f112a7bda3',
  ])
  assert.equal(accepted.rejectedCalls.length, 1)
  assert.deepEqual(
    {
      callId: accepted.rejectedCalls[0]!.callId,
      reason: accepted.rejectedCalls[0]!.reason,
      seq: accepted.rejectedCalls[0]!.seq,
      resultSeq: accepted.rejectedCalls[0]!.resultSeq,
      answered: accepted.rejectedCalls[0]!.answered,
    },
    {
      callId: 'chatcmpl-tool-937dd4784aa64915',
      reason: 'invalid_question_ask',
      seq: 31,
      resultSeq: 32,
      answered: false,
    },
  )
  assert.deepEqual(accepted.answeredCallIds, ['chatcmpl-tool-81dba7f112a7bda3'])
  assert.deepEqual(accepted.questionIds, QUESTION_IDS)
  assert.deepEqual(accepted.answerIds, QUESTION_IDS)
  assert.equal(accepted.lastRequiredAnswerSeq, 37)

  const cases: Array<{ name: string; outcome: string }> = [
    {
      name: 'actual_denied_then_valid_callback_accepts_with_denied_record',
      outcome: 'accepted',
    },
  ]

  const validOnly = cloneEvents(trace.events)
    .filter(event => event.seq !== 31 && event.seq !== 32)
  const validOnlyResult = runObserver(
    observer,
    validOnly,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  )
  assert.deepEqual(validOnlyResult.rejectedCalls, [])
  assert.deepEqual(validOnlyResult.answeredCallIds, ['chatcmpl-tool-81dba7f112a7bda3'])
  cases.push({ name: 'valid_callback_only_accepts', outcome: 'accepted' })

  const arbitraryError = cloneEvents(trace.events)
  eventAt(arbitraryError, 'tool/result', 32).data.message.content[0].text =
    'Error: arbitrary question failure'
  expectRejected(cases, 'arbitrary_error_rejects', () => runObserver(
    observer,
    arbitraryError,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const sameDenialOnValidArguments = cloneEvents(trace.events)
  eventAt(sameDenialOnValidArguments, 'tool/call', 31).data.arguments =
    eventAt(sameDenialOnValidArguments, 'tool/call', 36).data.arguments
  expectRejected(cases, 'same_production_denial_on_valid_arguments_rejects', () => runObserver(
    observer,
    sameDenialOnValidArguments,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const missingAnswer = cloneEvents(trace.events)
  const missingAnswerPayload = JSON.parse(
    eventAt(missingAnswer, 'tool/result', 37).data.message.content[0].text,
  ) as { answers: Array<{ id: string }> }
  missingAnswerPayload.answers = missingAnswerPayload.answers.filter(answer => answer.id !== 'deal_terms')
  eventAt(missingAnswer, 'tool/result', 37).data.message.content[0].text =
    JSON.stringify(missingAnswerPayload)
  expectRejected(cases, 'missing_successful_answer_rejects', () => runObserver(
    observer,
    missingAnswer,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const wrongAnswer = cloneEvents(trace.events)
  const wrongAnswerPayload = JSON.parse(
    eventAt(wrongAnswer, 'tool/result', 37).data.message.content[0].text,
  ) as { answers: Array<{ id: string; custom: string }> }
  wrongAnswerPayload.answers.find(answer => answer.id === 'deal_terms')!.custom =
    '自行选择卖方付款方案。'
  eventAt(wrongAnswer, 'tool/result', 37).data.message.content[0].text =
    JSON.stringify(wrongAnswerPayload)
  expectRejected(cases, 'wrong_successful_answer_rejects', () => runObserver(
    observer,
    wrongAnswer,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const undeclaredAnswer = cloneEvents(trace.events)
  const undeclaredPayload = JSON.parse(
    eventAt(undeclaredAnswer, 'tool/result', 37).data.message.content[0].text,
  ) as { answers: Array<{ id: string; custom: string }> }
  undeclaredPayload.answers.find(answer => answer.id === 'deal_terms')!.id = 'payment_terms'
  eventAt(undeclaredAnswer, 'tool/result', 37).data.message.content[0].text =
    JSON.stringify(undeclaredPayload)
  expectRejected(cases, 'undeclared_successful_answer_rejects', () => runObserver(
    observer,
    undeclaredAnswer,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  expectRejected(cases, 'callback_count_mismatch_rejects', () => runObserver(
    observer,
    trace.events,
    2,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const saveBeforeAnswer = cloneEvents(trace.events)
  eventAt(saveBeforeAnswer, 'tool/call', 41).seq = 35
  expectRejected(cases, 'successful_save_before_actual_answers_rejects', () => runObserver(
    observer,
    saveBeforeAnswer,
    1,
    invalidQuestionAskDenial,
    missingQuestionAskDenial,
  ))

  const finishedAtUtc = new Date().toISOString()
  const report = {
    format: 'lawbench-t18-contract-question-observer-finite-v1',
    status: 'PASS',
    scope: 'ACTUAL_EIGHT_EVENT_SUBSET_AND_PLAIN_MEMORY_NEGATIVE_CONTROLS_ONLY',
    startedAtUtc,
    finishedAtUtc,
    pid: process.pid,
    executable: process.execPath,
    consumer: {
      path: CONSUMER_PATH,
      bytes: currentConsumer.byteLength,
      sha256: sha256(currentConsumer),
    },
    manifest: { path: MANIFEST_PATH, bytes: currentManifest.byteLength, sha256: sha256(currentManifest) },
    bService: { path: B_SERVICE_PATH, bytes: bService.byteLength, sha256: sha256(bService) },
    actualTrace: {
      path: ACTUAL_TRACE_PATH,
      bytes: traceBytes.byteLength,
      sha256: sha256(traceBytes),
      sourceSha256: trace.source_sha256,
      events: trace.events.length,
      callbackInvocations: trace.callback_invocations,
    },
    compiledAgent: {
      path: COMPILED_AGENT_PATH,
      bytes: COMPILED_AGENT_BYTES,
      sha256: COMPILED_AGENT_SHA256,
    },
    actualAccepted: {
      allAskCallIds: accepted.allAskCallIds,
      rejectedCalls: accepted.rejectedCalls,
      answeredCallIds: accepted.answeredCallIds,
      lastRequiredAnswerSeq: accepted.lastRequiredAnswerSeq,
    },
    cases,
    runtimeCreation: {
      agents: 0,
      sessions: 0,
      contexts: 0,
      tasks: 0,
      cases: 0,
      modelRequests: 0,
      httpRequests: 0,
      childProcesses: 0,
    },
    fullConsumer: 'NOT_RUN',
    fullT18: 'NOT_RUN',
    businessAcceptance: 'NOT_RUN',
    packaging: 'HOLD',
  }
  await writeFile(join(cli.out, 'result.json'), `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

try {
  await main()
} catch (error) {
  const failed = {
    format: 'lawbench-t18-contract-question-observer-finite-v1',
    status: 'FAILED',
    finishedAtUtc: new Date().toISOString(),
    pid: process.pid,
    error: error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: typeof error, message: String(error) },
    runtimeCreation: {
      agents: 0,
      sessions: 0,
      contexts: 0,
      tasks: 0,
      cases: 0,
      modelRequests: 0,
      httpRequests: 0,
      childProcesses: 0,
    },
    fullConsumer: 'NOT_RUN',
    fullT18: 'NOT_RUN',
  }
  if (activeCli !== undefined) {
    await writeFile(join(activeCli.out, 'result.json'), `${JSON.stringify(failed, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    }).catch(() => undefined)
  }
  throw error
}
