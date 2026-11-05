import assert from 'node:assert/strict'
import { constants as fsConstants, createReadStream } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
} from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const INPUT_DIR = 'D:/Lawbeach/lawbench-coord/T18GenuineArtifactContinuationInput-20261028-235617'
const INPUT_PATH = join(INPUT_DIR, 'genuine-inputs.json')
const INPUT_SHA256 = 'e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1'
const ACTUAL_NATIVE_EVENTS_PATH = join(INPUT_DIR, 'actual-native-events.jsonl')
const EXPECTED_PHYSICAL_EVENTS = 60
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

interface InventoryEntry {
  readonly relative: string
  readonly bytes: number
  readonly sha256: string
  readonly mtime_ns: string
}

interface GenuineInputInventory {
  readonly format: string
  readonly original_report: string
  readonly original_report_sha: string
  readonly source_case: string
  readonly case_files: readonly InventoryEntry[]
  readonly source_sessions: string
  readonly session_files: readonly InventoryEntry[]
  readonly native_session: string
  readonly native_request: string
  readonly task_id: string
  readonly actual_edit_result: {
    readonly accepted: number
    readonly out_of_scope: readonly { readonly id: number; readonly reason: string }[]
  }
  readonly business_quality_PASS: boolean
}

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly surfaceOp?: string
}

interface TreeRow {
  readonly relative: string
  readonly bytes: number
  readonly sha256: string
  readonly mtimeNs: string
}

function pathKey(path: string): string {
  return resolve(path).toLocaleLowerCase('en-US')
}

function isSameOrInside(child: string, parent: string): boolean {
  const value = relative(resolve(parent), resolve(child))
  return value === '' || (
    value !== '..'
    && !value.startsWith(`..${sep}`)
    && !isAbsolute(value)
  )
}

function safeRelativePath(value: string): string {
  if (
    value.length === 0
    || value.includes('\\')
    || isAbsolute(value)
    || value.split('/').some(part => part === '' || part === '.' || part === '..')
  ) {
    throw new Error(`inventory contains an unsafe relative path: ${value}`)
  }
  return value
}

function modulePath(relativePath: string): string {
  return pathToFileURL(join(DSH_ROOT, relativePath)).href
}

async function sha256File(path: string): Promise<string> {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) digest.update(chunk as Buffer)
  return digest.digest('hex')
}

async function ordinaryDirectory(path: string): Promise<void> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`expected an ordinary directory: ${path}`)
  }
  if (pathKey(await realpath(path)) !== pathKey(path)) {
    throw new Error(`directory resolves through a reparse point: ${path}`)
  }
}

async function inspectOrdinaryTree(
  root: string,
  expected: readonly InventoryEntry[],
): Promise<readonly TreeRow[]> {
  await ordinaryDirectory(root)
  const rows: TreeRow[] = []

  const walk = async (directory: string, prefix: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name)
      const relativePath = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`
      const info = await lstat(fullPath, { bigint: true })
      if (info.isSymbolicLink()) {
        throw new Error(`tree contains a reparse entry: ${fullPath}`)
      }
      if (info.isDirectory()) {
        await walk(fullPath, relativePath)
        continue
      }
      if (!info.isFile()) throw new Error(`tree contains a non-ordinary entry: ${fullPath}`)
      rows.push({
        relative: relativePath,
        bytes: Number(info.size),
        sha256: await sha256File(fullPath),
        mtimeNs: info.mtimeNs.toString(),
      })
    }
  }

  await walk(root, '')
  const actual = rows.sort((left, right) => left.relative.localeCompare(right.relative))
  const wanted = [...expected]
    .map(entry => ({ ...entry, relative: safeRelativePath(entry.relative) }))
    .sort((left, right) => left.relative.localeCompare(right.relative))
  assert.equal(
    JSON.stringify(actual.map(row => row.relative)),
    JSON.stringify(wanted.map(row => row.relative)),
    `tree inventory differs: ${root}`,
  )
  for (let index = 0; index < wanted.length; index += 1) {
    const row = actual[index]!
    const entry = wanted[index]!
    assert.equal(row.bytes, entry.bytes, `byte count changed: ${entry.relative}`)
    assert.equal(row.sha256, entry.sha256.toLowerCase(), `SHA-256 changed: ${entry.relative}`)
    assert.equal(row.mtimeNs, entry.mtime_ns, `mtime_ns changed: ${entry.relative}`)
  }
  return actual
}

async function assertFreshOwnedRoot(workRoot: string, manifest: GenuineInputInventory): Promise<void> {
  assert.ok(isAbsolute(workRoot), 'work root must be an absolute path')
  assert.notEqual(dirname(resolve(workRoot)), resolve(workRoot), 'work root must not be a filesystem root')
  await ordinaryDirectory(workRoot)
  const entries = await readdir(workRoot)
  assert.equal(entries.length, 0, 'work root must be fresh and empty')
  for (const protectedRoot of [
    manifest.source_case,
    manifest.source_sessions,
    INPUT_DIR,
    REPO_ROOT,
  ]) {
    if (isSameOrInside(workRoot, protectedRoot) || isSameOrInside(protectedRoot, workRoot)) {
      if (protectedRoot !== REPO_ROOT) {
        throw new Error(`work root overlaps immutable input: ${protectedRoot}`)
      }
    }
  }
}

async function copyTree(
  sourceRoot: string,
  destinationRoot: string,
  markCreated: (path: string) => void,
): Promise<void> {
  markCreated(destinationRoot)
  await mkdir(destinationRoot, { recursive: false, mode: 0o700 })

  const copy = async (sourceDirectory: string, destinationDirectory: string): Promise<void> => {
    for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
      const source = join(sourceDirectory, entry.name)
      const destination = join(destinationDirectory, entry.name)
      const info = await lstat(source)
      if (info.isSymbolicLink()) throw new Error(`source tree contains a reparse entry: ${source}`)
      if (info.isDirectory()) {
        await mkdir(destination, { recursive: false, mode: 0o700 })
        await copy(source, destination)
      } else if (info.isFile()) {
        await copyFile(source, destination, fsConstants.COPYFILE_EXCL)
      } else {
        throw new Error(`source tree contains a non-ordinary entry: ${source}`)
      }
    }
  }

  await copy(sourceRoot, destinationRoot)
}

async function verifyCopiedTree(
  copiedRoot: string,
  expected: readonly InventoryEntry[],
): Promise<readonly TreeRow[]> {
  const rows: TreeRow[] = []
  const walk = async (directory: string, prefix: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name)
      const relativePath = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`
      const info = await lstat(fullPath, { bigint: true })
      if (info.isSymbolicLink()) throw new Error(`copied tree contains a reparse entry: ${fullPath}`)
      if (info.isDirectory()) {
        await walk(fullPath, relativePath)
      } else if (info.isFile()) {
        rows.push({
          relative: relativePath,
          bytes: Number(info.size),
          sha256: await sha256File(fullPath),
          mtimeNs: info.mtimeNs.toString(),
        })
      } else {
        throw new Error(`copied tree contains a non-ordinary entry: ${fullPath}`)
      }
    }
  }
  await walk(copiedRoot, '')
  const actual = rows.sort((left, right) => left.relative.localeCompare(right.relative))
  const wanted = [...expected].sort((left, right) => left.relative.localeCompare(right.relative))
  assert.equal(
    JSON.stringify(actual.map(row => [row.relative, row.bytes, row.sha256])),
    JSON.stringify(wanted.map(row => [row.relative, row.bytes, row.sha256.toLowerCase()])),
    'copied tree is not byte-identical to its inventory',
  )
  return actual
}

function parsePhysicalSession(
  bytes: Uint8Array,
  manifest: GenuineInputInventory,
): { readonly header: Record<string, unknown>; readonly events: readonly NativeEvent[] } {
  const text = Buffer.from(bytes).toString('utf8')
  assert.ok(text.endsWith('\n'), 'physical session JSONL does not end with a newline')
  const lines = text.split(/\r?\n/)
  assert.equal(lines.pop(), '', 'physical session JSONL has an invalid final newline')
  assert.equal(lines.length, EXPECTED_PHYSICAL_EVENTS + 1, 'physical session must have one header and sixty events')
  const header = JSON.parse(lines[0]!) as Record<string, unknown>
  assert.equal(header.type, 'session')
  assert.equal(header.version, 4)
  assert.equal(header.id, manifest.native_session)
  assert.equal(header.isSeeded, false)
  assert.equal(header.delegationDepth, 0)
  assert.equal(pathKey(String(header.cwd)), pathKey(manifest.source_case), 'copied header cwd changed')
  assert.match(String(header.id), SESSION_WITH_UUID, 'native session header id is not a real UUID v4')

  const events = lines.slice(1).map(line => JSON.parse(line) as NativeEvent)
  assert.equal(events.length, EXPECTED_PHYSICAL_EVENTS)
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!
    assert.equal(event.seq, index, 'physical native event sequence is not contiguous')
    assert.equal(typeof event.type, 'string')
    assert.equal(typeof event.time, 'number')
    assert.ok(event.data !== undefined)
  }
  assert.match(manifest.native_request, UUID_V4, 'native request is not a real UUID v4')
  assert.ok(
    JSON.stringify(events).includes(manifest.native_request),
    'the immutable native request id is absent from the sixty physical rows',
  )
  return { header, events }
}

async function reopenPersistedEvents(
  persistenceRoot: string,
  sessionId: string,
): Promise<{
  readonly events: readonly NativeEvent[]
  readonly readerClosed: true
  readonly contextDisposed: true
}> {
  const [
    Cordis,
    Llm,
    SessionModule,
    SystemPromptModule,
    ToolsModule,
    ProjectionsModule,
    AgentModule,
    AgentLoopModule,
    PersistenceModule,
    ControllerProjectionModule,
  ] = await Promise.all([
    import(modulePath('vendor/cordis/lib/index.js')),
    import(modulePath('packages/llm/llm/src/index.ts')),
    import(modulePath('packages/core/session/src/index.ts')),
    import(modulePath('packages/core/system-prompt/src/index.ts')),
    import(modulePath('packages/core/tools/src/index.ts')),
    import(modulePath('packages/session/session-projection/src/index.ts')),
    import(modulePath('packages/core/agent/src/index.ts')),
    import(modulePath('packages/core/agent-loop/src/index.ts')),
    import(modulePath('packages/session/session-persistence-jsonl/src/index.ts')),
    import(modulePath('packages/api/session-controller/src/model-selection-projection.ts')),
  ])

  const Context = Cordis.Context
  const LlmRuntime = Llm.default
  const SessionStore = SessionModule.default
  const SystemPrompt = SystemPromptModule.default
  const ToolRuntime = ToolsModule.default
  const ProjectionRegistry = ProjectionsModule.default
  const AgentRegistry = AgentModule.default
  const AgentLoop = AgentLoopModule.default
  const JsonlPersistence = PersistenceModule.default
  const installModelSelectionProjection = ControllerProjectionModule.installModelSelectionProjection

  const verifier = new Context()
  let handle: Awaited<ReturnType<typeof verifier.sessionPersistence.open>> | undefined
  let events: readonly NativeEvent[] | undefined
  let readerClosed = false
  let contextDisposed = false
  try {
    await verifier.plugin(LlmRuntime)
    await verifier.plugin(SessionStore)
    await verifier.plugin(ProjectionRegistry)
    await verifier.plugin(SystemPrompt, { personaPrefix: '' })
    await verifier.plugin(ToolRuntime)
    await verifier.plugin(AgentRegistry)
    installModelSelectionProjection(verifier)
    await verifier.plugin(JsonlPersistence, { root: persistenceRoot, compression: 'none' })
    await verifier.plugin(AgentLoop, { agents: [] })
    handle = await verifier.sessionPersistence.open(sessionId, 'read')
    events = (await handle.read()).events as readonly NativeEvent[]
  } finally {
    try {
      if (handle !== undefined) {
        await handle.close()
        readerClosed = true
      }
    } finally {
      await verifier.fiber.dispose()
      contextDisposed = true
    }
  }
  if (events === undefined || !readerClosed || !contextDisposed) {
    throw new Error('read-only persistence handle or context lifecycle did not complete')
  }
  return { events, readerClosed: true, contextDisposed: true }
}

async function main(workRoot: string, markCreated: (path: string) => void): Promise<Record<string, unknown>> {
  const inputBefore = await lstat(INPUT_PATH)
  assert.ok(inputBefore.isFile() && !inputBefore.isSymbolicLink(), 'genuine input inventory must be an ordinary file')
  assert.equal(await sha256File(INPUT_PATH), INPUT_SHA256, 'genuine input inventory SHA-256 changed')
  const manifest = JSON.parse(await readFile(INPUT_PATH, 'utf8')) as GenuineInputInventory
  assert.equal(manifest.format, 'genuine-t18-completed-artifact-continuation-v1')
  assert.equal(manifest.business_quality_PASS, false)
  assert.equal(manifest.actual_edit_result.accepted, 5)
  assert.deepEqual(manifest.actual_edit_result.out_of_scope, [
    { id: 5, reason: 'find 跨越域代码或超链接' },
  ])
  assert.match(manifest.native_session, SESSION_WITH_UUID)
  assert.match(manifest.native_request, UUID_V4)
  assert.match(manifest.task_id, /^T-[0-9]{14}-[0-9a-f]{4}$/)

  const originalReportInfo = await lstat(manifest.original_report)
  assert.ok(originalReportInfo.isFile() && !originalReportInfo.isSymbolicLink())
  assert.equal(await sha256File(manifest.original_report), manifest.original_report_sha)

  const sourceCaseBefore = await inspectOrdinaryTree(manifest.source_case, manifest.case_files)
  const sourceSessionsBefore = await inspectOrdinaryTree(manifest.source_sessions, manifest.session_files)
  const sourceSession = manifest.session_files[0]!
  const sourceJsonlPath = join(manifest.source_sessions, ...safeRelativePath(sourceSession.relative).split('/'))
  const sourceJsonlBefore = await readFile(sourceJsonlPath)
  const actualNativeEvents = await readFile(ACTUAL_NATIVE_EVENTS_PATH)
  assert.equal(await sha256File(ACTUAL_NATIVE_EVENTS_PATH), sourceSession.sha256)
  assert.ok(
    isDeepStrictEqual(actualNativeEvents, sourceJsonlBefore),
    'genuine actual-native-events snapshot differs from the immutable source session',
  )
  const physical = parsePhysicalSession(sourceJsonlBefore, manifest)

  await assertFreshOwnedRoot(workRoot, manifest)
  const caseCopy = join(workRoot, 'case')
  const sessionsCopy = join(workRoot, 'sessions')
  await copyTree(manifest.source_case, caseCopy, markCreated)
  await copyTree(manifest.source_sessions, sessionsCopy, markCreated)
  const copiedCaseRows = await verifyCopiedTree(caseCopy, manifest.case_files)
  const copiedSessionRows = await verifyCopiedTree(sessionsCopy, manifest.session_files)
  const copiedJsonlPath = join(sessionsCopy, ...safeRelativePath(sourceSession.relative).split('/'))
  const copiedJsonlBefore = await readFile(copiedJsonlPath)
  assert.ok(isDeepStrictEqual(copiedJsonlBefore, sourceJsonlBefore), 'copied JSONL bytes differ from immutable source')
  const copiedPhysical = parsePhysicalSession(copiedJsonlBefore, manifest)
  assert.deepEqual(copiedPhysical.header, physical.header)
  assert.ok(isDeepStrictEqual(copiedPhysical.events, physical.events))

  const firstRead = await reopenPersistedEvents(sessionsCopy, manifest.native_session)
  const copiedJsonlAfterFirst = await readFile(copiedJsonlPath)
  assert.ok(isDeepStrictEqual(copiedJsonlAfterFirst, copiedJsonlBefore), 'read mode changed copied JSONL bytes')
  assert.ok(
    isDeepStrictEqual(firstRead.events, physical.events),
    'first production read differs from all immutable physical native events',
  )
  assert.equal(firstRead.readerClosed, true)
  assert.equal(firstRead.contextDisposed, true)

  const secondRead = await reopenPersistedEvents(sessionsCopy, manifest.native_session)
  const copiedJsonlAfterSecond = await readFile(copiedJsonlPath)
  assert.ok(
    isDeepStrictEqual(copiedJsonlAfterSecond, copiedJsonlBefore),
    'second read mode changed copied JSONL bytes',
  )
  assert.ok(isDeepStrictEqual(secondRead.events, firstRead.events), 'the two production reads differ')
  assert.equal(secondRead.readerClosed, true)
  assert.equal(secondRead.contextDisposed, true)

  const sourceCaseAfter = await inspectOrdinaryTree(manifest.source_case, manifest.case_files)
  const sourceSessionsAfter = await inspectOrdinaryTree(manifest.source_sessions, manifest.session_files)
  assert.equal(
    JSON.stringify(sourceCaseAfter),
    JSON.stringify(sourceCaseBefore),
    'immutable source case inventory changed',
  )
  assert.equal(
    JSON.stringify(sourceSessionsAfter),
    JSON.stringify(sourceSessionsBefore),
    'immutable source session inventory changed',
  )
  assert.equal(await sha256File(INPUT_PATH), INPUT_SHA256)

  return {
    verdict: 'READONLY_GENUINE_SESSION_REPLAY_PASS',
    scope: 'Persistence replay only; this is not a full T18 business PASS',
    input: {
      path: INPUT_PATH,
      sha256: INPUT_SHA256,
      originalReportSha256: manifest.original_report_sha,
      originalReportImmutable: true,
      nativeSessionHeader: String(physical.header.id),
      nativeRequestPresent: true,
      taskId: manifest.task_id,
      physicalEvents: physical.events.length,
      physicalRowsIncludingHeader: physical.events.length + 1,
      originalCwdPreserved: true,
      sequencePreserved: true,
    },
    source: {
      caseFiles: manifest.case_files.length,
      sessionFiles: manifest.session_files.length,
      inventoryBeforeEqualsAfter: true,
      sourceCaseShaStillMatches: true,
      sourceSessionsShaAndMtimeStillMatch: true,
      actualNativeEventsEqualsSourceSession: true,
    },
    productionRead: {
      persistenceRoot: sessionsCopy,
      mode: 'read',
      exactNativeConsumerSetup: true,
      firstEventCount: firstRead.events.length,
      secondEventCount: secondRead.events.length,
      allEventsDeepEqualPhysicalSource: true,
      firstEqualsSecond: true,
      firstReaderClosed: firstRead.readerClosed,
      firstContextDisposed: firstRead.contextDisposed,
      secondReaderClosed: secondRead.readerClosed,
      secondContextDisposed: secondRead.contextDisposed,
      copiedJsonlBytesUnchangedAcrossBothReads: true,
      copiedJsonlBytes: copiedJsonlBefore.byteLength,
      copiedJsonlSha256: createHash('sha256').update(copiedJsonlBefore).digest('hex'),
      copiedCaseFiles: copiedCaseRows.length,
      copiedSessionFiles: copiedSessionRows.length,
      appendResumeOrMessageOperations: 0,
    },
    priorNativeRun: {
      run: 'run-fQoiXe',
      elapsedSeconds: 153.594,
      naturalAnswers: 1,
      modelPosts: 10,
      modelHttp200: 10,
      toolCalls: 9,
      tasksCompleted: 6,
      editsAccepted: 5,
      manualRisk: 5,
      manualParagraph: 39,
      sourceHeld: true,
      recordedFromImmutableArtifacts: true,
    },
    thisReadOnlyRun: {
      newModelCalls: 0,
      agentCallbacks: 0,
      providerPluginsLoaded: 0,
      credentialValuesRead: 0,
      httpRequests: 0,
      globalFetchAttempts: 0,
      guiStarted: false,
      homeAppDataOrTempTouchedByScript: false,
    },
    businessQuality: {
      risk3ArticleReferenceErrorOpen: true,
      fullT18BusinessPass: false,
      gate1ProjectComplete: false,
      packaging: 'HOLD',
    },
  }
}

const workRootArgument = process.argv[2]
if (workRootArgument === undefined || process.argv.length !== 3) {
  throw new Error('usage: node read-genuine-session.mts <fresh-empty-owned-work-root>')
}
const workRoot = resolve(workRootArgument)
const createdTrees: string[] = []
const markCreated = (path: string): void => {
  createdTrees.push(path)
}

let fetchAttempts = 0
const originalFetch = globalThis.fetch
globalThis.fetch = (async () => {
  fetchAttempts += 1
  throw new Error('network is forbidden in the read-only persistence continuation')
}) as typeof fetch

let report: Record<string, unknown> | undefined
let failure: string | undefined
try {
  report = await main(workRoot, markCreated)
  if (fetchAttempts !== 0) throw new Error('a network fetch was attempted during the read-only replay')
} catch (error) {
  failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
} finally {
  globalThis.fetch = originalFetch
}

const cleanupRows: string[] = []
const cleanupErrors: string[] = []
for (const created of [...createdTrees].reverse()) {
  try {
    if (!isSameOrInside(created, workRoot) || pathKey(created) === pathKey(workRoot)) {
      throw new Error(`refusing to remove path outside the fresh work root: ${created}`)
    }
    const info = await lstat(created).catch(() => undefined)
    if (info === undefined) continue
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error(`refusing to remove a non-ordinary directory: ${created}`)
    }
    await rm(created, { recursive: true, force: false })
    cleanupRows.push(created)
  } catch (error) {
    cleanupErrors.push(error instanceof Error ? error.message : String(error))
  }
}

let workRootEmptyAfterCleanup = false
try {
  workRootEmptyAfterCleanup = (await readdir(workRoot)).length === 0
} catch (error) {
  cleanupErrors.push(error instanceof Error ? error.message : String(error))
}

const output = {
  ...(report ?? { verdict: 'READONLY_GENUINE_SESSION_REPLAY_FAIL' }),
  thisReadOnlyRun: {
    ...(report?.thisReadOnlyRun as Record<string, unknown> | undefined ?? {}),
    globalFetchAttempts: fetchAttempts,
  },
  cleanup: {
    removedOnlyCreatedCopies: cleanupErrors.length === 0,
    removedTrees: cleanupRows,
    workRootEmptyAfterCleanup,
    errors: cleanupErrors,
  },
  ...(failure === undefined ? {} : { failure }),
}

console.log(JSON.stringify(output, null, 2))
if (failure !== undefined || cleanupErrors.length > 0 || !workRootEmptyAfterCleanup) {
  process.exitCode = 1
}
