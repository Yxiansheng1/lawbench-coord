/**
 * Source-only finite proof for the T18 cross-exam Core task settlement.
 *
 * This verifier imports only the real consumer helper's extracted functions,
 * the real CoreClient class (with an in-memory controlled call transport),
 * the real LegalAgent.onSessionEvent path, and the real TaskState model.
 * It starts no server, NativeSession, model, HTTP request, browser, Python,
 * process, UUID generator, case, or credential reader.
 *
 * Authoring status: AUTHORED_NOT_RUN. Root review must inspect and execute it.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { lstat, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import vm from 'node:vm'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const CONSUMER = join(EVIDENCE_DIR, 'native-cross-exam.mts')
const FIXED_INPUTS = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const TYPESCRIPT_JS = join(DSH_ROOT, 'node_modules', 'typescript', 'lib', 'typescript.js')
const TYPESCRIPT_PACKAGE = join(DSH_ROOT, 'node_modules', 'typescript', 'package.json')
const AGENT_SOURCE = join(REPO_ROOT, 'dsh-ext', 'agent', 'index.ts')
const TASK_STATE_SOURCE = join(REPO_ROOT, 'dsh-ext', 'agent', 'task-state.ts')
const CORE_CLIENT_SOURCE = join(REPO_ROOT, 'dsh-ext', 'shared', 'core-client.ts')
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/
const ACTUAL_TASK_ID = 'T-20261029130023-e333'
const SELECTION_ID = 'T-20261029130024-a111'
const OTHER_TASK_ID = 'T-20261029130025-b222'
const SECOND_TASK_ID = 'T-20261029130026-c333'
const CASE_ID = '6b927e80-60d5-4c51-a328-5bba64ca8f1c'
const SESSION_ID = 'session-80a6b5e7-bedf-48f3-8ca0-416a28e14afc'
const REQUEST_ID = '32f7ecb5-b38d-466e-bef6-a7d37c0a59cb'
const SKILL = 'cross-exam-opinion'

const EXPECTED = {
  consumerBytes: 148_127,
  consumerSha256: '446ae939d9a30369d0d119600b8cab69e7bc25d460c2f5e6d77e8c24e14ca2f9',
  fixedInputsBytes: 12_282,
  fixedInputsSha256: '0e6f9e838eb5fd3a56a3a8ffebd3b42a975b5bde9baa59643221311380e8d2a5',
  typescriptJsBytes: 9_144_216,
  typescriptJsSha256: '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39',
  typescriptPackageBytes: 3_527,
  typescriptPackageSha256: '9332e97c30d3e53ed54910b89207ed657fb444066484df6e5b6965bf130865e9',
  agentBytes: 46_684,
  agentSha256: '5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c',
  taskStateBytes: 21_264,
  taskStateSha256: 'fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b',
  coreClientBytes: 3_666,
  coreClientSha256: '5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50',
} as const

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

function jsonBridge<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T
}

interface TaskSettlementExpected {
  readonly caseId: string
  readonly sessionId: string
  readonly requestId: string
  readonly skill: string
  readonly selectionId: string
}

interface OwnedTaskMetadata {
  readonly taskId: string
  readonly task: Record<string, unknown>
  readonly result: Record<string, unknown>
}

interface TaskSettlementProof {
  readonly taskId: string
  readonly taskState: 'finished'
  readonly terminalStatus: string
  readonly attempts: number
  readonly taskListRow: Record<string, unknown>
}

interface TaskSettlementController {
  arm(): void
  settle(): Promise<TaskSettlementProof | undefined>
  isArmed(): boolean
}

interface ExtractedConsumer {
  readonly sourceConstants: {
    readonly taskCompletionPollAttempts: number
    readonly taskCompletionPollIntervalMs: number
    readonly taskIdSource: string
    readonly taskIdFlags: string
    readonly taskIdAcceptsActual: boolean
    readonly taskIdRejectsPath: boolean
  }
  createTaskSettlement(
    expected: TaskSettlementExpected,
    io: {
      query(): Promise<unknown>
      readOwnedTaskMetadata(taskId: string): Promise<OwnedTaskMetadata>
      sleep(milliseconds: number): Promise<void>
    },
    acceptedTerminalStatuses?: readonly string[],
  ): TaskSettlementController
}

interface CoreResultLike<T = unknown> {
  readonly ok: boolean
  readonly value?: T
  readonly error?: { readonly code: string; readonly message: string }
}

interface CoreClientLike {
  call<T = unknown>(command: string, body: Record<string, unknown>): Promise<CoreResultLike<T>>
}

interface ControlledCoreHandle extends CoreClientLike {
  readonly calls: Array<{ readonly command: string; readonly body: Record<string, unknown> }>
  readonly entered: Promise<void>
  releaseBody(): void
}

function createControlledCore(
  CoreClientClass: new (...args: any[]) => CoreClientLike,
  backend: ControlledBackend,
  options: {
    readonly failFirst?: boolean
    readonly failAll?: boolean
    readonly holdBody?: boolean
  } = {},
): ControlledCoreHandle {
  let enteredResolve!: () => void
  const entered = new Promise<void>(resolve => {
    enteredResolve = resolve
  })
  let releaseBodyResolve: (() => void) | undefined
  const bodyGate = options.holdBody === true
    ? new Promise<void>(resolve => {
      releaseBodyResolve = resolve
    })
    : Promise.resolve()
  const CoreClass = CoreClientClass as any
  const Controlled = class extends CoreClass {
    readonly calls: Array<{ readonly command: string; readonly body: Record<string, unknown> }> = []

    constructor() {
      super(() => undefined, () => {}, false)
    }

    releaseBody(): void {
      releaseBodyResolve?.()
    }

    async call<T = unknown>(
      command: string,
      body: Record<string, unknown>,
    ): Promise<CoreResultLike<T>> {
      this.calls.push({ command, body: { ...body } })
      enteredResolve()
      if (command !== 'task/end') {
        return {
          ok: false,
          error: { code: 'UNIT_UNEXPECTED_COMMAND', message: 'unexpected unit command' },
        }
      }
      await bodyGate
      const attempt = this.calls.filter(call => call.command === 'task/end').length
      if (options.failAll === true || (options.failFirst === true && attempt === 1)) {
        return {
          ok: false,
          error: { code: 'UNIT_TASK_END_FAILED', message: 'controlled task end failure' },
        }
      }
      const status = backend.finish(String(body.reason ?? 'error'))
      return { ok: true, value: { status } as T }
    }
  }
  const instance = new Controlled() as ControlledCoreHandle
  Object.defineProperty(instance, 'entered', { value: entered })
  return instance
}

class ControlledBackend {
  state: 'running' | 'finished' | 'abnormal' = 'running'
  resultStatus = 'running'
  readonly rows: Array<{ task_id: string; skill: string; status: string }> = []
  readonly metadata = new Map<string, Record<string, unknown>>()
  readonly results = new Map<string, Record<string, unknown>>()
  metadataReads = 0

  constructor(options: {
    readonly includeActual?: boolean
    readonly includeSelection?: boolean
    readonly includeDuplicate?: boolean
    readonly includeOther?: boolean
  } = {}) {
    if (options.includeActual !== false) this.add(ACTUAL_TASK_ID, CASE_ID, SESSION_ID, REQUEST_ID)
    if (options.includeSelection === true) {
      this.add(SELECTION_ID, CASE_ID, SESSION_ID, REQUEST_ID)
    }
    if (options.includeDuplicate === true) {
      this.add(SECOND_TASK_ID, CASE_ID, SESSION_ID, REQUEST_ID)
    }
    if (options.includeOther === true) {
      this.add(OTHER_TASK_ID, CASE_ID, 'session-other', REQUEST_ID)
    }
  }

  add(taskId: string, caseId: string, sessionId: string, requestId: string): void {
    this.rows.push({ task_id: taskId, skill: SKILL, status: 'running' })
    this.metadata.set(taskId, {
      task_id: taskId,
      case_id: caseId,
      session_id: sessionId,
      request_id: requestId,
      skill: SKILL,
      state: 'running',
      result_status: 'running',
    })
    this.results.set(taskId, { task_id: taskId, status: 'running' })
  }

  finish(reason: string): string {
    const status = reason === 'completed'
      ? 'completed'
      : reason === 'aborted'
        ? 'cancelled'
        : reason === 'max-tokens'
          ? 'output_limit'
          : reason === 'budget'
            ? 'budget_stopped'
            : reason === 'interrupted'
              ? 'interrupted'
              : 'failed'
    this.state = 'finished'
    this.resultStatus = status
    for (const row of this.rows) {
      const metadata = this.metadata.get(row.task_id)!
      metadata.state = 'finished'
      metadata.result_status = status
      this.results.set(row.task_id, { task_id: row.task_id, status })
      row.status = status
    }
    return status
  }

  query = async (): Promise<unknown> => ({
    ok: true,
    value: { tasks: this.rows.map(row => ({ ...row })) },
  })

  read = async (taskId: string): Promise<OwnedTaskMetadata> => {
    this.metadataReads += 1
    return {
      taskId,
      task: { ...this.metadata.get(taskId) },
      result: { ...this.results.get(taskId) },
    }
  }
}

function extractConsumer(
  ts: typeof import('typescript'),
  sourceText: string,
): ExtractedConsumer {
  const source = ts.createSourceFile(CONSUMER, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const names = new Set([
    'asRecord',
    'asArray',
    'asString',
    'settleOwnedCoreTask',
    'createTaskSettlement',
  ])
  const snippets: string[] = []
  const extractedNames: string[] = []
  const constantNames = [
    'TASK_ID',
    'TASK_COMPLETION_POLL_ATTEMPTS',
    'TASK_COMPLETION_POLL_INTERVAL_MS',
  ] as const
  const constantInitializers = new Map<string, string>()
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      if (names.has(statement.name.text)) {
        extractedNames.push(statement.name.text)
        snippets.push(statement.getText(source).replace(/^export\s+/, ''))
      }
      continue
    }
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue
      if (!(constantNames as readonly string[]).includes(declaration.name.text)) continue
      assert.equal(
        constantInitializers.has(declaration.name.text),
        false,
        `actual top-level constant is duplicated: ${declaration.name.text}`,
      )
      assert.ok(declaration.initializer, `actual top-level constant has no initializer: ${declaration.name.text}`)
      constantInitializers.set(declaration.name.text, declaration.initializer.getText(source))
    }
  }
  assert.equal(
    snippets.some(snippet => snippet.includes('function settleOwnedCoreTask(')),
    true,
    'actual task settlement helper is absent from the consumer',
  )
  assert.equal(
    snippets.some(snippet => snippet.includes('function createTaskSettlement(')),
    true,
    'actual settlement cache controller is absent from the consumer',
  )
  assert.deepEqual(
    [...constantInitializers.keys()].sort(),
    [...constantNames].sort(),
    'the actual consumer must expose each settlement constant exactly once at top level',
  )
  const preamble = constantNames
    .map(name => `const ${name} = ${constantInitializers.get(name)!}`)
    .join('\n')
  const constantsExport = `exports.sourceConstants = {
    taskCompletionPollAttempts: TASK_COMPLETION_POLL_ATTEMPTS,
    taskCompletionPollIntervalMs: TASK_COMPLETION_POLL_INTERVAL_MS,
    taskIdSource: TASK_ID.source,
    taskIdFlags: TASK_ID.flags,
    taskIdAcceptsActual: TASK_ID.test(${JSON.stringify(ACTUAL_TASK_ID)}),
    taskIdRejectsPath: TASK_ID.test("..\\\\outside")
  }`
  const functionsExport = extractedNames
    .map(name => `exports.${name} = ${name}`)
    .join('\n')
  const compiled = ts.transpileModule(
    `${preamble}\n${snippets.join('\n\n')}\n${constantsExport}\n${functionsExport}`,
    {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
      removeComments: true,
    },
    fileName: CONSUMER,
    },
  ).outputText
  const exports: Record<string, unknown> = {}
  const context = vm.createContext({ exports })
  new vm.Script(compiled, { filename: `${CONSUMER}::settlement-fragment` }).runInContext(context)
  const extracted = exports as unknown as ExtractedConsumer
  const constants = extracted.sourceConstants
  assert.equal(constants.taskCompletionPollAttempts, 1_200)
  assert.equal(constants.taskCompletionPollIntervalMs, 100)
  assert.equal(constants.taskIdSource, '^T-[0-9]{14}-[0-9a-f]{4}$')
  assert.equal(constants.taskIdFlags, '')
  assert.equal(constants.taskIdAcceptsActual, true)
  assert.equal(constants.taskIdRejectsPath, false)
  return {
    ...extracted,
    sourceConstants: {
      taskCompletionPollAttempts: constants.taskCompletionPollAttempts,
      taskCompletionPollIntervalMs: constants.taskCompletionPollIntervalMs,
      taskIdSource: constants.taskIdSource,
      taskIdFlags: constants.taskIdFlags,
      taskIdAcceptsActual: constants.taskIdAcceptsActual,
      taskIdRejectsPath: constants.taskIdRejectsPath,
    },
  }
}

function expectedIdentity(overrides: Partial<TaskSettlementExpected> = {}): TaskSettlementExpected {
  return {
    caseId: CASE_ID,
    sessionId: SESSION_ID,
    requestId: REQUEST_ID,
    skill: SKILL,
    selectionId: SELECTION_ID,
    ...overrides,
  }
}

function settlementIo(
  backend: ControlledBackend,
  sleep?: (milliseconds: number) => Promise<void>,
): {
  query(): Promise<unknown>
  readOwnedTaskMetadata(taskId: string): Promise<OwnedTaskMetadata>
  sleep(milliseconds: number): Promise<void>
  queryCount(): number
  sleepCount(): number
} {
  let queries = 0
  let sleeps = 0
  return {
    async query() {
      queries += 1
      return backend.query()
    },
    readOwnedTaskMetadata(taskId) {
      return backend.read(taskId)
    },
    async sleep(milliseconds) {
      sleeps += 1
      await (sleep?.(milliseconds) ?? Promise.resolve())
    },
    queryCount: () => queries,
    sleepCount: () => sleeps,
  }
}

function makeTaskState(TaskStateClass: new (...args: any[]) => unknown): unknown {
  return new TaskStateClass(
    ACTUAL_TASK_ID,
    { model_calls: 32, tool_calls: 48, minutes: 45 },
    { thinking: '中', window: '128K', max_tokens: 49_152, temperature: 0.6 },
    0,
    'local',
    undefined,
    true,
    CASE_ID,
    SESSION_ID,
    [],
  )
}

function findCallPosition(
  ts: typeof import('typescript'),
  sourceFile: import('typescript').SourceFile,
  objectName: string,
  methodName: string,
): number[] {
  const positions: number[] = []
  const visit = (node: import('typescript').Node): void => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === objectName
      && node.expression.name.text === methodName
    ) {
      positions.push(node.getStart(sourceFile))
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return positions
}

function verifyConsumerOrdering(
  ts: typeof import('typescript'),
  sourceText: string,
): {
  readonly firstSettlementBeforeSuccessStop: true
  readonly finallySettlementBeforeStop: true
  readonly bothSettlementCallsWatchdogged: true
} {
  const source = ts.createSourceFile(CONSUMER, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let runFunction: import('typescript').FunctionDeclaration | undefined
  const visitFunctions = (node: import('typescript').Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'runNativeCrossExam') {
      runFunction = node
      return
    }
    ts.forEachChild(node, visitFunctions)
  }
  visitFunctions(source)
  assert.ok(runFunction !== undefined, 'runNativeCrossExam was not found')

  let mainFinally: import('typescript').Block | undefined
  const visitTry = (node: import('typescript').Node): void => {
    if (
      ts.isTryStatement(node)
      && node.finallyBlock !== undefined
      && node.getStart(source) > runFunction!.getStart(source)
      && node.getEnd() <= runFunction!.getEnd()
    ) {
      if (
        mainFinally === undefined
        || node.finallyBlock.getEnd() - node.finallyBlock.getStart(source)
          > mainFinally.getEnd() - mainFinally.getStart(source)
      ) {
        mainFinally = node.finallyBlock
      }
    }
    ts.forEachChild(node, visitTry)
  }
  visitTry(runFunction!)
  assert.ok(mainFinally !== undefined, 'runNativeCrossExam finally block was not found')

  const allSettlementCalls = findCallPosition(ts, source, 'taskSettlement', 'settle')
  const allStopCalls = findCallPosition(ts, source, 'service', 'stop')
  assert.ok(allSettlementCalls.length >= 2, 'main and cleanup settlement calls are absent')
  let watchdoggedSettlementCalls = 0
  const visitSettlementCalls = (node: import('typescript').Node): void => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === 'taskSettlement'
      && node.expression.name.text === 'settle'
      && ts.isCallExpression(node.parent)
      && ts.isIdentifier(node.parent.expression)
      && node.parent.expression.text === 'withWatchdog'
      && node.parent.arguments.length === 1
      && node.parent.arguments[0] === node
    ) {
      watchdoggedSettlementCalls += 1
    }
    ts.forEachChild(node, visitSettlementCalls)
  }
  visitSettlementCalls(source)
  assert.equal(allSettlementCalls.length, 2, 'task settlement must have exactly the main and finally calls')
  assert.equal(watchdoggedSettlementCalls, 2, 'both actual settlement calls must use the existing watchdog')
  assert.ok(allStopCalls.length >= 2, 'success and cleanup stop calls are absent')
  const firstSuccessStop = Math.min(...allStopCalls)
  assert.ok(
    allSettlementCalls.some(position => position < firstSuccessStop),
    'success path must settle before the first service stop',
  )

  const finallyStart = mainFinally!.getStart(source)
  const finallyEnd = mainFinally!.getEnd()
  const finallySettlement = allSettlementCalls.filter(position => (
    position >= finallyStart && position < finallyEnd
  ))
  const finallyStop = allStopCalls.filter(position => (
    position >= finallyStart && position < finallyEnd
  ))
  assert.ok(finallySettlement.length > 0, 'finally block lacks task settlement')
  assert.ok(finallyStop.length > 0, 'finally block lacks service stop')
  assert.ok(
    Math.min(...finallySettlement) < Math.min(...finallyStop),
    'finally must settle the real task before stopping B',
  )
  return {
    firstSettlementBeforeSuccessStop: true,
    finallySettlementBeforeStop: true,
    bothSettlementCallsWatchdogged: true,
  }
}

async function main(): Promise<void> {
  const consumerBytes = await pinnedFile(
    CONSUMER,
    EXPECTED.consumerBytes,
    EXPECTED.consumerSha256,
  )
  await pinnedFile(FIXED_INPUTS, EXPECTED.fixedInputsBytes, EXPECTED.fixedInputsSha256)
  await pinnedFile(TYPESCRIPT_JS, EXPECTED.typescriptJsBytes, EXPECTED.typescriptJsSha256)
  await pinnedFile(
    TYPESCRIPT_PACKAGE,
    EXPECTED.typescriptPackageBytes,
    EXPECTED.typescriptPackageSha256,
  )
  await pinnedFile(AGENT_SOURCE, EXPECTED.agentBytes, EXPECTED.agentSha256)
  await pinnedFile(TASK_STATE_SOURCE, EXPECTED.taskStateBytes, EXPECTED.taskStateSha256)
  await pinnedFile(CORE_CLIENT_SOURCE, EXPECTED.coreClientBytes, EXPECTED.coreClientSha256)

  const ts = dshRequire('typescript') as typeof import('typescript')
  const sourceText = consumerBytes.toString('utf8')
  const consumer = extractConsumer(ts, sourceText)
  const ordering = verifyConsumerOrdering(ts, sourceText)

  const { CoreClient } = await import(pathToFileURL(CORE_CLIENT_SOURCE).href)
  const { LegalAgent } = await import(pathToFileURL(AGENT_SOURCE).href)
  const { TaskState } = await import(pathToFileURL(TASK_STATE_SOURCE).href)
  const makeCore = (
    backend: ControlledBackend,
    options: {
      readonly failFirst?: boolean
      readonly failAll?: boolean
      readonly holdBody?: boolean
    } = {},
  ): ControlledCoreHandle => createControlledCore(CoreClient, backend, options)
  const cases: Array<Record<string, unknown>> = []

  // UNIT_ONLY: each turn/end object below is plain test input. It is not a
  // Native Session event, replay, history resource, or produced model turn.
  {
    const backend = new ControlledBackend()
    const core = makeCore(backend, { holdBody: true })
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    await core.entered
    let stopped = false
    const stop = (): void => {
      stopped = true
    }
    stop()
    assert.equal(stopped, true)
    assert.equal(backend.state, 'running')
    assert.equal(backend.resultStatus, 'running')
    core.releaseBody()
    await end
    assert.equal(backend.state, 'finished')
    cases.push({
      case: 'old_stop_before_pending_task_end',
      stopBeforeBody: stopped,
      taskStateAtStop: 'running',
      taskEndCalls: core.calls.length,
    })
  }

  {
    const backend = new ControlledBackend()
    const core = makeCore(backend, { holdBody: true })
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    let releasePollSleep!: () => void
    let sleepEntered!: () => void
    const pollSleepGate = new Promise<void>(resolve => {
      releasePollSleep = resolve
    })
    const firstSleep = new Promise<void>(resolve => {
      sleepEntered = resolve
    })
    let first = true
    const io = settlementIo(backend, async () => {
      if (first) {
        first = false
        sleepEntered()
        await pollSleepGate
      }
    })
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    let stopped = false
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    await core.entered
    const pending = settlement.settle()
    await firstSleep
    assert.equal(backend.state, 'running')
    assert.equal(io.queryCount(), 1)
    core.releaseBody()
    releasePollSleep()
    const proof = jsonBridge<TaskSettlementProof>(await pending)
    await end
    assert.equal(stopped, false)
    assert.equal(proof.taskId, ACTUAL_TASK_ID)
    assert.equal(proof.taskState, 'finished')
    assert.equal(proof.terminalStatus, 'completed')
    stopped = true
    cases.push({
      case: 'new_settlement_before_stop',
      bodyWasStillPending: true,
      stopAfterProof: stopped,
      proof,
      taskEndCalls: core.calls.length,
    })
  }

  {
    const backend = new ControlledBackend()
    const core = makeCore(backend, { failFirst: true })
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    const proof = jsonBridge<TaskSettlementProof>(await settlement.settle())
    await end
    assert.equal(core.calls.length, 2)
    assert.equal(proof.terminalStatus, 'completed')
    cases.push({ case: 'first_failed_then_retry', taskEndCalls: 2, proof })
  }

  {
    const backend = new ControlledBackend()
    const core = makeCore(backend, { failAll: true })
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    await assert.rejects(
      settlement.settle(),
      /owned task settlement timed out after 1200 attempts/,
    )
    await end
    assert.equal(core.calls.length, 2)
    assert.equal(backend.state, 'running')
    cases.push({
      case: 'two_failures',
      taskEndCalls: 2,
      finalBackendState: backend.state,
      falselyFinished: false,
    })
  }

  {
    const backend = new ControlledBackend()
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    assert.equal(await settlement.settle(), undefined)
    assert.equal(io.queryCount(), 0)
    cases.push({ case: 'prestart_skip', queries: 0, fakeEnd: false })
  }

  {
    const backend = new ControlledBackend()
    const core = makeCore(backend)
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    await core.entered
    await end
    const first = settlement.settle()
    const second = settlement.settle()
    const firstProof = jsonBridge<TaskSettlementProof>(await first)
    const secondProof = jsonBridge<TaskSettlementProof>(await second)
    assert.deepEqual(secondProof, firstProof)
    assert.equal(io.queryCount(), 1)
    cases.push({ case: 'success_settlement_cached_once', queries: 1, proof: firstProof })
  }

  {
    const backend = new ControlledBackend({ includeSelection: true })
    const core = makeCore(backend)
    const legal = new LegalAgent(core, () => {})
    legal.tasks.set(SESSION_ID, makeTaskState(TaskState))
    const end = legal.onSessionEvent(SESSION_ID, {
      type: 'turn/end',
      data: { reason: { kind: 'completed' } },
    })
    await core.entered
    await end
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const proof = jsonBridge<TaskSettlementProof>(await settlement.settle())
    assert.equal(proof.taskId, ACTUAL_TASK_ID)
    assert.equal(backend.metadataReads, 1)
    cases.push({ case: 'selection_row_ignored', proof, metadataReads: 1 })
  }

  {
    const backend = new ControlledBackend()
    backend.finish('completed')
    backend.rows[0]!.status = 'running'
    let settled = false
    let firstSleepObserved = false
    const io = settlementIo(backend, async () => {
      if (firstSleepObserved) return
      firstSleepObserved = true
      assert.equal(settled, false, 'the API-row-running transient must not return a proof')
      assert.equal(io.queryCount(), 1)
      backend.rows[0]!.status = 'completed'
    })
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const proof = jsonBridge<TaskSettlementProof>(await settlement.settle().then(value => {
      settled = true
      return value
    }))
    assert.equal(firstSleepObserved, true)
    assert.equal(proof.attempts, 2)
    assert.equal(proof.terminalStatus, 'completed')
    cases.push({
      case: 'api_row_running_owned_finished_requery',
      firstIterationAccepted: false,
      queries: io.queryCount(),
      proof,
    })
  }

  {
    const backend = new ControlledBackend()
    backend.finish('completed')
    backend.metadata.get(ACTUAL_TASK_ID)!.state = 'running'
    let settled = false
    let firstSleepObserved = false
    const io = settlementIo(backend, async () => {
      if (firstSleepObserved) return
      firstSleepObserved = true
      assert.equal(settled, false, 'task-metadata-running transient must not return a proof')
      assert.equal(io.queryCount(), 1)
      backend.metadata.get(ACTUAL_TASK_ID)!.state = 'finished'
    })
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    const proof = jsonBridge<TaskSettlementProof>(await settlement.settle().then(value => {
      settled = true
      return value
    }))
    assert.equal(firstSleepObserved, true)
    assert.equal(proof.attempts, 2)
    assert.equal(proof.terminalStatus, 'completed')
    cases.push({
      case: 'task_metadata_running_result_terminal_requery',
      firstIterationAccepted: false,
      queries: io.queryCount(),
      proof,
    })
  }

  const wrongTaskBackend = new ControlledBackend()
  wrongTaskBackend.metadata.get(ACTUAL_TASK_ID)!.task_id = OTHER_TASK_ID
  const negative = [
    {
      name: 'missing_task',
      backend: new ControlledBackend({ includeActual: false }),
      expected: expectedIdentity(),
    },
    {
      name: 'wrong_case',
      backend: new ControlledBackend(),
      expected: expectedIdentity({ caseId: '00000000-0000-4000-8000-000000000000' }),
    },
    {
      name: 'wrong_session',
      backend: new ControlledBackend(),
      expected: expectedIdentity({ sessionId: 'session-00000000-0000-4000-8000-000000000000' }),
    },
    {
      name: 'wrong_request',
      backend: new ControlledBackend(),
      expected: expectedIdentity({ requestId: '00000000-0000-4000-8000-000000000000' }),
    },
    {
      name: 'wrong_task',
      backend: wrongTaskBackend,
      expected: expectedIdentity(),
    },
    {
      name: 'expected_selection_hides_actual',
      backend: new ControlledBackend({ includeSelection: true }),
      expected: expectedIdentity({ selectionId: ACTUAL_TASK_ID }),
    },
    {
      name: 'current_still_running_timeout',
      backend: new ControlledBackend(),
      expected: expectedIdentity(),
    },
  ]
  for (const item of negative) {
    const io = settlementIo(item.backend)
    const settlement = consumer.createTaskSettlement(item.expected, io)
    settlement.arm()
    await assert.rejects(
      settlement.settle(),
      /owned task settlement timed out after 1200 attempts/,
      item.name,
    )
    cases.push({ case: item.name, selectedOtherTask: false })
  }

  {
    const backend = new ControlledBackend({ includeDuplicate: true })
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /more than one owned task matches this run/)
    cases.push({ case: 'duplicate_owned_task', selected: false })
  }

  {
    const backend = new ControlledBackend()
    backend.rows[0]!.task_id = '..\\outside'
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /task list contains invalid task ID/)
    assert.equal(backend.metadataReads, 0)
    cases.push({ case: 'invalid_task_id_before_metadata_path', metadataReads: 0 })
  }

  {
    const backend = new ControlledBackend()
    backend.state = 'abnormal'
    const metadata = backend.metadata.get(ACTUAL_TASK_ID)!
    metadata.state = 'abnormal'
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /abnormal stale state/)
    cases.push({ case: 'abnormal_state', acceptedAsEnd: false })
  }

  {
    const backend = new ControlledBackend()
    backend.finish('completed')
    backend.results.get(ACTUAL_TASK_ID)!.task_id = OTHER_TASK_ID
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /owned task result identity changed/)
    cases.push({ case: 'result_task_id_mismatch', acceptedAsEnd: false })
  }

  {
    const backend = new ControlledBackend()
    backend.finish('completed')
    backend.results.get(ACTUAL_TASK_ID)!.status = 'failed'
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /terminal statuses disagree/)
    cases.push({ case: 'contradictory_terminal_statuses', acceptedAsEnd: false })
  }

  {
    const backend = new ControlledBackend()
    backend.finish('completed')
    backend.rows[0]!.status = 'mystery'
    backend.results.get(ACTUAL_TASK_ID)!.status = 'mystery'
    const io = settlementIo(backend)
    const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
    settlement.arm()
    await assert.rejects(settlement.settle(), /unaccepted status mystery/)
    cases.push({ case: 'unknown_terminal_status', acceptedAsEnd: false })
  }

  const original = new Error('actual tool loop lacks case_list_materials')
  const secondary: unknown[] = []
  let stopped = false
  try {
    throw original
  } catch (error: unknown) {
    assert.equal(error, original)
    try {
      const backend = new ControlledBackend({ includeActual: false })
      const io = settlementIo(backend)
      const settlement = consumer.createTaskSettlement(expectedIdentity(), io)
      settlement.arm()
      await settlement.settle()
    } catch (error: unknown) {
      secondary.push(error)
    } finally {
      stopped = true
    }
    assert.equal(error, original)
  }
  assert.equal(secondary.length, 1)
  assert.equal(stopped, true)
  cases.push({
    case: 'original_error_preserved_with_secondary_cleanup_failure',
    originalError: original.message,
    cleanupFailureCount: secondary.length,
    stopStillRan: stopped,
  })

  const fixed = JSON.parse(await readFile(FIXED_INPUTS, 'utf8')) as Record<string, any>
  assert.equal(fixed.consumer.path, CONSUMER)
  assert.equal(fixed.consumer.bytes, consumerBytes.byteLength)
  assert.equal(fixed.consumer.sha256, sha256(consumerBytes))
  assert.equal(fixed.bService.path, join(EVIDENCE_DIR, 'b-service-cross-exam.py'))
  assert.equal(fixed.dependencies.length, 26)
  assert.equal(fixed.compilerPrivate.length, 4)
  assert.equal(fixed.runtimeExecutables.length, 3)

  console.log(JSON.stringify({
    status: 'FINITE_PASS',
    scope: 'offline consumer settlement helper and actual LegalAgent.onSessionEvent/CoreClient path; not business verification',
    runtime: {
      model: false,
      http: false,
      server: false,
      nativeSession: false,
      resource: false,
      uuidMint: false,
      credentialRead: false,
      realWait: false,
    },
    unitTurnInput: 'UNIT_PLAIN_TURN_END_NOT_NATIVE_HISTORY',
    ordering,
    cases,
    sourcePins: EXPECTED,
  }, null, 2))
}

await main()
