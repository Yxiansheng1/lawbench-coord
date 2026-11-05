/**
 * One-shot genuine compacted-session fork observer.
 *
 * Authoring status: AUTHORED_NOT_RUN. This process copies the accepted
 * three-turn native JSONL into a fresh persistence root, restores it through
 * production code, performs at most one manual compaction through
 * BasicCompactionEngine.compactNow(), and only after a committed compaction
 * creates one production fork and sends the original fourth prompt once.
 *
 * It does not create or modify product source, synthesize session history,
 * manufacture credentials, retry compaction, or open a GUI.
 */

import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { constants as fsConstants, mkdirSync } from 'node:fs'
import {
  copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, writeFile,
} from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const INPUT_ROOT = 'D:/Lawbeach/lawbench-coord/T31GenuineCompactedForkInput-20261028-115217'
const ACCEPTED_CONSUMER_PATH = join(INPUT_ROOT, 'native-real-conversation.mts')
const FIXED_INPUTS_PATH = join(INPUT_ROOT, 'fixed-inputs.json')
const ORIGINAL_SESSION_PATH = join(
  REPO_ROOT,
  'docs/plan/evidence/T31/NativeRealConversation-20261028-000823/run-RTmLl7/sessions/',
  '--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--',
  'session-97c67db2-b8a6-428b-be48-04b4144d10bd/session.v4.jsonl',
)

const MODEL_ORIGIN = 'http://10.126.126.1:8000'
const MODEL_URL = `${MODEL_ORIGIN}/v1`
const MODEL = 'qwen38-27b'
const PROVIDER = 'lawbench-6000d'
const CREDENTIAL_REF = 'LAWBENCH_6000D_KEY'
const MAX_TOKENS = 256
const MAX_CREDENTIAL_BYTES = 4096
const TECHNICAL_WATCHDOG_MS = 86_400_000
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

const SOURCE_SESSION_ID = 'session-97c67db2-b8a6-428b-be48-04b4144d10bd'
const SOURCE_SESSION_BYTES = 12_059
const SOURCE_SESSION_SHA256 = 'e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee'
const SOURCE_SESSION_EVENT_COUNT = 27
const ACCEPTED_CONSUMER_BYTES = 58_057
const ACCEPTED_CONSUMER_SHA256 = '80c603f94c42f19ce635d245fc0520559aa9bb72fed55d2ef91685ae4d3c2343'
const FIXED_INPUTS_BYTES = 14_284
const FIXED_INPUTS_SHA256 = 'ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522'
const FIXED_INPUT_COUNT = 46

const SYNTHETIC_CODE = 'LB-SYN-FORK-27'
const SYNTHETIC_PERSON = '林岚'
const SYNTHETIC_AMOUNT = '2700'
const FORK_PROMPT =
  '这是从原纯合成对话复制出的新分支。只回答原对话里的合成代码、虚构化名和虚构金额，格式为“代码|化名|金额”。'

const EXTRA_DEPENDENCY_PINS = [
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/compaction/compaction-basic/src/index.ts',
    bytes: 20_589,
    sha256: '4136f3bb98964a0d1546795131da12364ed1e7ecc33b123dfdc860965ddf8a5b',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/compaction/compaction-basic/src/region.ts',
    bytes: 23_571,
    sha256: '295b53cc9e924f7cb2e843e0d0d296e89ead73da2aab9790282db30736e2e063',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/compaction/compaction-basic/src/summarizer.ts',
    bytes: 10_107,
    sha256: '9169a13cac6a168c6e758528524cc913bb04255e2d2f8c13af5c07fe0bf4b64f',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/compaction/compaction-basic/src/config.ts',
    bytes: 14_220,
    sha256: '4972edc6447dcff87eab54c3a9c5984171238aa06aa0eb34ffde4bfac4ce1275',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/compaction/compaction/src/index.ts',
    bytes: 8_764,
    sha256: '1923cc2fd2400184760f321fb7df7a9ffbc6cff200012884dda09632756dc849',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/api/session-controller/src/commands.ts',
    bytes: 31_548,
    sha256: 'c3ea5af81f21212888364bbd169c9d3d19c93f8720716dfc44ba32c1d164bb2c',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/api/session-controller/src/agent.ts',
    bytes: 22_822,
    sha256: '2136af39dc59755f3fc5ef9474ec78ca77576061ea197627f1b664b319a4d769',
  },
] as const

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly surfaceOp?: unknown
}

interface SourceHeader {
  readonly type: 'session'
  readonly version: number
  readonly id: string
  readonly createdAt: number
  readonly cwd: string
  readonly isSeeded: boolean
  readonly delegationDepth: number
}

interface NetworkObservation {
  readonly startedAt: string
  readonly finishedAt?: string
  readonly method: string
  readonly url: string
  readonly status?: number
  readonly outcome: 'completed' | 'failed'
  readonly redirect: 'error'
}

interface SessionSnapshot {
  readonly id: string
  readonly header: unknown
  readonly inheritedEventCount: number
  readonly events: readonly NativeEvent[]
  readonly surfaceNodes: readonly number[]
}

interface TurnRecord {
  readonly sessionId: string
  readonly requestId: string
  readonly prompt: string
  readonly beforeSeq: number
  readonly afterSeq: number
  readonly responseText: string
  readonly requestHeader: unknown
  readonly modelPostAttempts: number
  readonly modelPostHttp200: number
  readonly eventTypes: readonly string[]
}

interface FixedInputManifest {
  readonly format: 'lawbench-native-real-fixed-inputs-v1'
  readonly task: 'A-native-real-conversation-20261028-000823'
  readonly hashAlgorithm: 'sha256'
  readonly inputs: readonly {
    readonly group: string
    readonly id: string
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly snapshotPath?: string
  }[]
}

interface AdmissionRecord {
  readonly fixedInputSha256: string
  readonly fixedInputCount: number
  readonly acceptedConsumerBytes: number
  readonly acceptedConsumerSha256: string
  readonly originalSessionBytes: number
  readonly originalSessionSha256: string
  readonly originalSessionEventCount: number
  readonly dependencyCount: number
  readonly checkedAtUtc: string
}

interface CompactionObservation {
  attempted: boolean
  networkStart: number
  modelPostAttempts: number
  modelPostHttp200: number
  committed: boolean
  durableReopenEqual?: boolean
  result?: unknown
  eventSeqs?: {
    readonly start: number
    readonly summary: number
    readonly checkpoint: number
    readonly end: number
  }
  summaryFacts?: {
    readonly provider: string
    readonly model: string
    readonly maxTokens: number
    readonly llmStreamCall: true
  }
  failure?: unknown
}

interface StopRecord {
  readonly reason: 'NO_USEFUL_RANGE' | 'MAX_TOKENS' | 'NO_SHRINK'
  readonly actualCause: unknown
  readonly followedByFork: false
  readonly followedByModelTurn: false
}

type RunMode = 'full' | 'preflight-only'
type RunStatus =
  | 'RUNNING'
  | 'CLEARSETUP_ONLY'
  | 'PASS_OPERATION_ONLY'
  | 'STOPPED_NO_USEFUL_RANGE'
  | 'STOPPED_MAX_TOKENS'
  | 'STOPPED_NO_SHRINK'
  | 'FAILED'

interface RunReport {
  format: 'lawbench-native-genuine-compacted-fork-v1'
  task: 'A-T31-genuine-compacted-fork-20261028-115217'
  mode: RunMode
  status: RunStatus
  authoredStatus: 'AUTHORED_NOT_RUN'
  process: {
    readonly executable: string
    readonly pid: number
    readonly startedAtUtc: string
    readonly node: string
    readonly cwd: string
  }
  fixture: {
    readonly syntheticOnly: true
    readonly code: string
    readonly person: string
    readonly amount: string
    readonly provider: string
    readonly model: string
    readonly endpoint: string
    readonly maxTokens: 256
    readonly tools: 'empty registry'
    readonly automaticCompaction: false
  }
  runRoot: string
  admission: { initial?: AdmissionRecord; final?: AdmissionRecord }
  copy: {
    readonly sourcePath: string
    readonly destinationPath?: string
    readonly sourceBytes: number
    readonly sourceSha256: string
    readonly copiedBytes?: number
    readonly copiedSha256?: string
    readonly exactInitialCopy?: boolean
  }
  restore?: {
    readonly persistedPrefixEventCount: number
    readonly persistedPrefixEqual: boolean
    readonly livePrefixEqual: boolean
    readonly appendedTypes: readonly string[]
    readonly sourceHeaderEqual: boolean
    readonly sourceSessionId: string
  }
  compaction: CompactionObservation
  stop?: StopRecord
  parentAtFork?: SessionSnapshot
  parentAfterChild?: SessionSnapshot
  childAfterFork?: SessionSnapshot
  childAfterTurn?: SessionSnapshot
  fork?: {
    readonly childSessionId: string
    readonly parentSession: string
    readonly isSeeded: boolean
    readonly inheritedEventCount: number
    readonly inheritedPrefixEqual: boolean
    readonly compactionDurableBeforeFork: boolean
    readonly parentUnchangedByFork: boolean
    parentUnchangedByChildTurn: boolean
  }
  childTurn?: TurnRecord
  network: NetworkObservation[]
  networkSummary: {
    readonly observations: number
    readonly modelPostAttempts: number
    readonly modelPostHttp200: number
    readonly closedAttempts: number
  }
  persistence?: {
    readonly root: string
    readonly parentReopened: boolean
    readonly childReopened: boolean
    readonly parentEqual: boolean
    readonly childEqual: boolean
    readonly parentBytes: number
    readonly parentSha256: string
    readonly childBytes: number
    readonly childSha256: string
  }
  originalSourceUnchanged?: {
    readonly bytes: number
    readonly sha256: string
    readonly equal: boolean
  }
  cleanup: {
    fiberDisposed: boolean
    clientSessionsDisposed: boolean
    fetchRestored: boolean
    outputRedactionRestored: boolean
    environmentRestored: boolean
    keyCleared: boolean
    failures: string[]
  }
  error?: unknown
  claims: {
    readonly gui: false
    readonly wholeT31: false
    readonly projectAcceptance: false
    readonly packaging: false
  }
}

interface SecretReaderState {
  readonly restore: () => void
}

interface EnvironmentLease {
  readonly restore: () => void
}

interface FetchLease {
  restore(): void
  isRestored(): boolean
  closedAttempts(): number
}

interface OutputRedactionLease {
  restore(): void
  isRestored(): boolean
  clearSecret(): boolean
}

interface NetworkGateState {
  readonly preflightOnly: boolean
  keyReady: boolean
  modelPostAttempts: number
  closedAttempts: number
}

interface BrowserSessionInstance {
  readonly id: string
  handleRunning(running: boolean): void
  beginSubmission(input: {
    readonly mode: 'queue'
    readonly text: string
    readonly attachments: readonly unknown[]
  }): { readonly requestId: string }
  dispose(): Promise<void>
}

interface LiveAgent {
  readonly id: string
  readonly session: {
    readonly id: string
    readonly header: unknown
    readonly inheritedEventCount: number
    readonly seq: number
    readonly surface: { readonly nodes: readonly number[] }
    snapshotEvents(offset?: unknown, endOffset?: unknown): readonly NativeEvent[]
  }
  whenIdle(): Promise<void>
}

interface ProductionContext {
  plugin(plugin: unknown, config?: unknown): Promise<unknown>
  fiber: { dispose(): Promise<void> }
  on(event: string, callback: (...args: never[]) => unknown): () => void
  provide(name: string, value: unknown): void
  readonly sessions: {
    get(id: never): LiveAgent['session'] | undefined
  }
  readonly agents: {
    get(id: never): LiveAgent | undefined
  }
  readonly compaction: {
    compactNow(agent: LiveAgent, signal: AbortSignal, sourceCommandId?: unknown): Promise<{
      readonly compactionId: string
      readonly startSeq: number
      readonly summarySeq: number
      readonly endSeq: number
      readonly summary: readonly unknown[]
      readonly shadowedRange: { readonly start: number; readonly end: number }
      readonly shadowedSeqs: readonly number[]
      readonly shadowedTokenCount: number
    } | null>
  }
}

interface ProductionSetup {
  readonly live: ProductionContext
  readonly agents: {
    resolveAgent(sessionId: string): Promise<
      | { readonly agent: LiveAgent }
      | { readonly error: { readonly code: string; readonly message: string } }
    >
  }
  readonly commands: {
    fork(input: { readonly sessionId: string }): Promise<{ readonly sessionId: string }>
    prompt(input: {
      readonly sessionId: string
      readonly requestId: string
      readonly mode: 'queue'
      readonly content: readonly { readonly type: 'text'; readonly text: string }[]
    }): Promise<unknown>
  }
  readonly BrowserSession: new (id: unknown, options: Record<string, never>) => BrowserSessionInstance
  readonly SessionLogOffset: (offset: number) => unknown
  readonly isCompactCheckpointSource: (source: unknown) => boolean
  readonly persistenceRoot: string
  readonly workspaceRoot: string
  copyOriginalSession(sourcePath: string, header: SourceHeader): Promise<{
    readonly destinationPath: string
    readonly bytes: number
    readonly sha256: string
  }>
  reopenPersistedEvents(parentSessionId: string, childSessionId?: string): Promise<{
    readonly parent: readonly NativeEvent[]
    readonly child: readonly NativeEvent[]
  }>
}

function modulePath(relative: string): string {
  return pathToFileURL(join(DSH_ROOT, relative)).href
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function utcNow(): string {
  return new Date().toISOString()
}

function processBirthUtc(): string {
  return new Date(Date.now() - process.uptime() * 1000).toISOString()
}

function pathKey(path: string): string {
  return resolve(path).toLocaleLowerCase('en-US')
}

function errorName(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

function parseRunOptions(args: readonly string[]): { readonly mode: RunMode; readonly credentialStdin: boolean } {
  if (args.length === 1 && args[0] === '--preflight-only') {
    return { mode: 'preflight-only', credentialStdin: false }
  }
  if (args.length === 1 && args[0] === '--credential-stdin') {
    return { mode: 'full', credentialStdin: true }
  }
  throw new Error(
    'usage: native-genuine-compacted-fork.mts [--preflight-only | --credential-stdin]',
  )
}

async function assertDirectoryNotReparse(path: string): Promise<void> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`private root is not a non-reparse directory: ${path}`)
  }
  if (pathKey(await realpath(path)) !== pathKey(path)) {
    throw new Error(`private root resolves through a reparse point: ${path}`)
  }
}

async function createPrivateRunRoot(): Promise<string> {
  await assertDirectoryNotReparse(EVIDENCE_DIR)
  const root = await mkdtemp(join(EVIDENCE_DIR, 'run-'))
  await assertDirectoryNotReparse(root)
  if ((await readdir(root)).length !== 0) throw new Error(`private run root is not empty: ${root}`)
  return root
}

async function verifyFilePin(
  path: string,
  expectedBytes: number,
  expectedSha256: string,
  label: string,
): Promise<Uint8Array> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is not a non-reparse file`)
  const bytes = await readFile(path)
  if (bytes.byteLength !== expectedBytes || sha256(bytes) !== expectedSha256) {
    throw new Error(
      `${label} bytes or SHA-256 changed: ${String(bytes.byteLength)} bytes, ${sha256(bytes)}`,
    )
  }
  return bytes
}

async function verifyAdmission(): Promise<AdmissionRecord> {
  const fixedInputBytes = await verifyFilePin(
    FIXED_INPUTS_PATH,
    FIXED_INPUTS_BYTES,
    FIXED_INPUTS_SHA256,
    'fixed-inputs manifest',
  )
  const parsed = JSON.parse(Buffer.from(fixedInputBytes).toString('utf8')) as Partial<FixedInputManifest>
  if (
    parsed.format !== 'lawbench-native-real-fixed-inputs-v1'
    || parsed.task !== 'A-native-real-conversation-20261028-000823'
    || parsed.hashAlgorithm !== 'sha256'
    || !Array.isArray(parsed.inputs)
    || parsed.inputs.length !== FIXED_INPUT_COUNT
  ) {
    throw new Error('fixed-inputs manifest header or entry count is invalid')
  }
  const identities = new Set<string>()
  for (const entry of parsed.inputs) {
    if (
      typeof entry.group !== 'string'
      || typeof entry.id !== 'string'
      || typeof entry.path !== 'string'
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes <= 0
      || typeof entry.sha256 !== 'string'
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
    ) {
      throw new Error('fixed-inputs manifest contains an invalid entry')
    }
    const identity = `${entry.group}\u0000${entry.id}`
    if (identities.has(identity)) throw new Error(`fixed-inputs manifest repeats ${identity}`)
    identities.add(identity)
    await verifyFilePin(entry.path, entry.bytes, entry.sha256, `fixed input ${identity}`)
  }

  await verifyFilePin(
    ACCEPTED_CONSUMER_PATH,
    ACCEPTED_CONSUMER_BYTES,
    ACCEPTED_CONSUMER_SHA256,
    'accepted consumer',
  )
  const originalBytes = await verifyFilePin(
    ORIGINAL_SESSION_PATH,
    SOURCE_SESSION_BYTES,
    SOURCE_SESSION_SHA256,
    'original genuine session',
  )
  const original = parseOriginalSession(originalBytes)
  for (const pin of EXTRA_DEPENDENCY_PINS) {
    await verifyFilePin(pin.path, pin.bytes, pin.sha256, `extra dependency ${pin.path}`)
  }
  return {
    fixedInputSha256: FIXED_INPUTS_SHA256,
    fixedInputCount: FIXED_INPUT_COUNT,
    acceptedConsumerBytes: ACCEPTED_CONSUMER_BYTES,
    acceptedConsumerSha256: ACCEPTED_CONSUMER_SHA256,
    originalSessionBytes: originalBytes.byteLength,
    originalSessionSha256: SOURCE_SESSION_SHA256,
    originalSessionEventCount: original.events.length,
    dependencyCount: EXTRA_DEPENDENCY_PINS.length,
    checkedAtUtc: utcNow(),
  }
}

function parseOriginalSession(bytes: Uint8Array): {
  readonly header: SourceHeader
  readonly events: readonly NativeEvent[]
} {
  const text = Buffer.from(bytes).toString('utf8')
  const lines = text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n')
  if (lines.length !== SOURCE_SESSION_EVENT_COUNT + 1) {
    throw new Error(`original session line count changed: ${String(lines.length)}`)
  }
  const header = JSON.parse(lines[0] ?? '') as Partial<SourceHeader>
  if (
    header.type !== 'session'
    || header.version !== 4
    || header.id !== SOURCE_SESSION_ID
    || typeof header.cwd !== 'string'
    || !header.cwd.startsWith('D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T31\\')
    || header.isSeeded !== false
    || header.delegationDepth !== 0
  ) {
    throw new Error('original session header is not the fixed unseeded source')
  }
  const events = lines.slice(1).map((line, index) => {
    const event = JSON.parse(line) as NativeEvent
    if (event.seq !== index) throw new Error(`original event seq mismatch at ${String(index)}`)
    return event
  })
  return { header: header as SourceHeader, events }
}

function isolateProcessFiles(root: string): EnvironmentLease {
  const names = [
    'HOME',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'TMPDIR',
    'XDG_CONFIG_HOME',
    'XDG_CACHE_HOME',
    'DSH_HOME',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'ALL_PROXY',
    'http_proxy',
    'https_proxy',
    'all_proxy',
    'NODE_USE_ENV_PROXY',
  ] as const
  const previous = new Map<string, string | undefined>()
  for (const name of names) previous.set(name, process.env[name])

  const home = join(root, 'home')
  const appData = join(root, 'appdata')
  const localAppData = join(root, 'localappdata')
  const temp = join(root, 'temp')
  const dshHome = join(root, 'dsh-home')
  const xdgConfig = join(root, 'xdg-config')
  const xdgCache = join(root, 'xdg-cache')
  for (const path of [home, appData, localAppData, temp, dshHome, xdgConfig, xdgCache]) {
    mkdirSync(path, { recursive: true })
  }

  process.env.HOME = home
  process.env.USERPROFILE = home
  process.env.APPDATA = appData
  process.env.LOCALAPPDATA = localAppData
  process.env.TEMP = temp
  process.env.TMP = temp
  process.env.TMPDIR = temp
  process.env.XDG_CONFIG_HOME = xdgConfig
  process.env.XDG_CACHE_HOME = xdgCache
  process.env.DSH_HOME = dshHome
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
    delete process.env[name]
  }
  process.env.NODE_USE_ENV_PROXY = '0'

  return {
    restore() {
      for (const name of names) {
        const value = previous.get(name)
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    },
  }
}

function restoreSecretMode(state: SecretReaderState, failures: string[]): void {
  try {
    state.restore()
  } catch (error: unknown) {
    failures.push(`stdin restore failed: ${errorName(error)}`)
  }
}

async function readCredentialFromStdin(): Promise<{
  readonly secret: string
  readonly state: SecretReaderState
}> {
  const stdin = process.stdin
  if (stdin.isTTY) {
    throw new Error('credential stdin mode requires a non-TTY pipe')
  }
  const chunks: Buffer[] = []
  let byteCount = 0
  return await new Promise((resolvePromise, reject) => {
    let settled = false
    const cleanup = (): void => {
      stdin.off('data', onData)
      stdin.off('error', onError)
      stdin.off('end', onEnd)
      stdin.off('close', onClose)
    }
    const rejectSafe = (message: string): void => {
      if (settled) return
      settled = true
      cleanup()
      stdin.pause()
      reject(new Error(message))
    }
    const onData = (chunk: Buffer | string): void => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteCount += bytes.byteLength
      if (byteCount > MAX_CREDENTIAL_BYTES + 2) {
        rejectSafe('credential stdin rejected because it exceeds the fixed size limit')
        return
      }
      chunks.push(bytes)
    }
    const onError = (): void => rejectSafe('credential stdin read failed')
    const onEnd = (): void => {
      if (settled) return
      const bytes = Buffer.concat(chunks, byteCount)
      let recordBytes = bytes.byteLength
      if (recordBytes >= 2 && bytes[recordBytes - 2] === 0x0d && bytes[recordBytes - 1] === 0x0a) {
        recordBytes -= 2
      } else if (recordBytes >= 1 && bytes[recordBytes - 1] === 0x0a) {
        recordBytes -= 1
      }
      if (recordBytes === 0) {
        rejectSafe('credential stdin was empty')
        return
      }
      if (recordBytes > MAX_CREDENTIAL_BYTES) {
        rejectSafe('credential stdin rejected because it exceeds the fixed size limit')
        return
      }
      for (let index = 0; index < recordBytes; index += 1) {
        const byte = bytes[index]
        if (byte === 0 || byte === 0x0a || byte === 0x0d || byte < 0x20 || byte > 0x7e) {
          rejectSafe('credential stdin rejected because it is not one printable ASCII record')
          return
        }
      }
      settled = true
      cleanup()
      stdin.pause()
      resolvePromise({
        secret: bytes.subarray(0, recordBytes).toString('ascii'),
        state: { restore: () => {} },
      })
    }
    const onClose = (): void => rejectSafe('credential stdin closed before EOF')
    stdin.on('data', onData)
    stdin.once('error', onError)
    stdin.once('end', onEnd)
    stdin.once('close', onClose)
    stdin.resume()
  })
}

function installFetchAllowlist(
  observations: NetworkObservation[],
  gate: NetworkGateState,
): FetchLease {
  const original = globalThis.fetch
  const expected = new URL(MODEL_ORIGIN)
  let restored = false
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (gate.preflightOnly || !gate.keyReady) {
      gate.closedAttempts += 1
      throw new Error(
        gate.preflightOnly
          ? 'model network is closed in preflight-only mode'
          : 'model network is closed until the piped credential is ready',
      )
    }
    const request = input instanceof Request ? input : undefined
    const raw = request?.url ?? String(input)
    const url = new URL(raw)
    if (
      url.protocol !== expected.protocol
      || url.hostname !== expected.hostname
      || url.port !== expected.port
      || url.username !== ''
      || url.password !== ''
      || !url.pathname.startsWith('/v1/')
    ) {
      throw new Error(`network allowlist rejected ${url.protocol}//${url.host}${url.pathname}`)
    }
    const method = String(init?.method ?? request?.method ?? 'GET').toUpperCase()
    if (method === 'POST') {
      if (gate.modelPostAttempts >= 2) {
        gate.closedAttempts += 1
        throw new Error('model request budget exhausted after two POST attempts')
      }
      gate.modelPostAttempts += 1
    }
    const observation: {
      startedAt: string
      finishedAt?: string
      method: string
      url: string
      status?: number
      outcome: 'completed' | 'failed'
      redirect: 'error'
    } = {
      startedAt: utcNow(),
      method,
      url: url.href,
      outcome: 'failed',
      redirect: 'error',
    }
    observations.push(observation)
    try {
      const response = await original(input, {
        ...init,
        redirect: 'error',
        cache: 'no-store',
      })
      observation.status = response.status
      observation.outcome = 'completed'
      observation.finishedAt = utcNow()
      return response
    } catch (error: unknown) {
      observation.finishedAt = utcNow()
      throw error
    }
  }) as typeof fetch

  return {
    restore() {
      if (restored) return
      restored = true
      globalThis.fetch = original
    },
    isRestored() {
      return restored && globalThis.fetch === original
    },
    closedAttempts() {
      return gate.closedAttempts
    },
  }
}

function redactText(value: string, secret: string): string {
  if (secret.length === 0) return value
  return value
    .split(secret).join('[REDACTED]')
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;"']+/gi, '$1[REDACTED]')
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s,;"']+/gi, '$1[REDACTED]')
}

function installOutputRedaction(secret: string): OutputRedactionLease {
  const originalStdoutWrite = process.stdout.write
  const originalStderrWrite = process.stderr.write
  let restored = false
  let currentSecret = secret
  const wrappingWrite = (
    target: NodeJS.WriteStream,
    original: NodeJS.WriteStream['write'],
  ): NodeJS.WriteStream['write'] => {
    return ((chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean => {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
      const redacted = redactText(text, currentSecret)
      const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined
      const completion = typeof encodingOrCallback === 'function'
        ? encodingOrCallback as (error?: Error | null) => void
        : typeof callback === 'function'
          ? callback as (error?: Error | null) => void
          : undefined
      return original.call(target, redacted, encoding as BufferEncoding | undefined, completion)
    }) as NodeJS.WriteStream['write']
  }
  process.stdout.write = wrappingWrite(process.stdout, originalStdoutWrite)
  process.stderr.write = wrappingWrite(process.stderr, originalStderrWrite)
  return {
    restore() {
      if (restored) return
      restored = true
      process.stdout.write = originalStdoutWrite
      process.stderr.write = originalStderrWrite
    },
    isRestored() {
      return restored
        && process.stdout.write === originalStdoutWrite
        && process.stderr.write === originalStderrWrite
    },
    clearSecret() {
      currentSecret = ''
      return currentSecret.length === 0
    },
  }
}

function redactUnknown(value: unknown, secret: string): unknown {
  if (typeof value === 'string') return redactText(value, secret)
  if (Array.isArray(value)) return value.map(entry => redactUnknown(entry, secret))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [redactText(key, secret), redactUnknown(entry, secret)]),
    )
  }
  return value
}

function safeError(error: unknown, secret: string, depth = 0): unknown {
  if (!(error instanceof Error)) return redactUnknown(error, secret)
  const code = (error as Error & { readonly code?: unknown }).code
  return {
    name: error.name,
    message: redactText(error.message, secret),
    ...(code === undefined ? {} : { code: redactUnknown(code, secret) }),
    ...(error.cause === undefined || depth >= 8
      ? {}
      : { cause: safeError(error.cause, secret, depth + 1) }),
  }
}

function errorCodes(error: unknown): string[] {
  const codes: string[] = []
  let current: unknown = error
  for (let depth = 0; current !== undefined && current !== null && depth < 8; depth += 1) {
    if (typeof current !== 'object') break
    const code = (current as { readonly code?: unknown }).code
    if (typeof code === 'string') codes.push(code)
    current = (current as { readonly cause?: unknown }).cause
  }
  return codes
}

function errorMessages(error: unknown): string[] {
  const messages: string[] = []
  let current: unknown = error
  for (let depth = 0; current !== undefined && current !== null && depth < 8; depth += 1) {
    if (current instanceof Error) messages.push(current.message)
    else if (typeof current === 'string') messages.push(current)
    if (typeof current !== 'object') break
    current = (current as { readonly cause?: unknown }).cause
  }
  return messages
}

async function withWatchdog<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_resolvePromise, reject) => {
      timer = setTimeout(
        () => reject(new Error(`technical watchdog expired after ${String(TECHNICAL_WATCHDOG_MS)} ms`)),
        TECHNICAL_WATCHDOG_MS,
      )
    })
    return await Promise.race([work, timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function textOfAssistant(event: NativeEvent): string {
  const data = event.data as {
    readonly message?: {
      readonly content?: readonly { readonly type?: string; readonly text?: string }[]
    }
  }
  return (data.message?.content ?? [])
    .flatMap(part => part.type === 'text' && typeof part.text === 'string' ? [part.text] : [])
    .join('')
}

function latestAssistantText(events: readonly NativeEvent[]): string {
  const message = events.findLast(event => event.type === 'assistant/message')
  return message === undefined ? '' : textOfAssistant(message)
}

function eventSourceRpcId(event: NativeEvent): string | undefined {
  if (event.type !== 'user/message') return undefined
  const data = event.data as {
    readonly source?: { readonly kind?: string; readonly rpcId?: unknown }
  }
  return data.source?.kind === 'user' && typeof data.source.rpcId === 'string'
    ? data.source.rpcId
    : undefined
}

function requestHeaderAtBoundary(
  session: LiveAgent['session'],
  sessionLogOffset: (offset: number) => unknown,
  beforeSeq: number,
  afterSeq: number,
): unknown {
  const prefix = session.snapshotEvents(sessionLogOffset(0), sessionLogOffset(afterSeq))
  const source = prefix.findLast(event => event.type === 'request/header')
  if (source === undefined || source.seq < beforeSeq || source.seq >= afterSeq) {
    throw new Error(`session ${session.id} has no current request/header before boundary ${afterSeq}`)
  }
  return source.data
}

function assertTurn(
  sessionId: string,
  requestId: string,
  prompt: string,
  beforeSeq: number,
  afterSeq: number,
  events: readonly NativeEvent[],
  requestHeader: unknown,
  modelPostAttempts: number,
  modelPostHttp200: number,
): TurnRecord {
  if (afterSeq <= beforeSeq) throw new Error(`request ${requestId} appended no native events`)
  if (!UUID_V4.test(requestId)) throw new Error(`request identity is not a UUID v4: ${requestId}`)
  const types = events.map(event => event.type)
  for (const required of ['turn/start', 'user/message', 'assistant/message', 'turn/end']) {
    if (!types.includes(required)) throw new Error(`request ${requestId} lacks ${required}`)
  }
  if (types.includes('tool/call') || types.includes('tool/result')) {
    throw new Error(`request ${requestId} unexpectedly used a tool`)
  }
  const user = events.findLast(event => event.type === 'user/message')
  if (user === undefined || eventSourceRpcId(user) !== requestId) {
    throw new Error(`user/message does not carry native R ${requestId}`)
  }
  const turnEnd = events.findLast(event => event.type === 'turn/end')
  const reason = (turnEnd?.data as { readonly reason?: { readonly kind?: string } } | undefined)?.reason
  if (reason?.kind !== 'completed') {
    throw new Error(`request ${requestId} ended with ${String(reason?.kind)}`)
  }
  const config = (requestHeader as {
    readonly header?: {
      readonly config?: {
        readonly provider?: unknown
        readonly model?: unknown
        readonly maxTokens?: unknown
      }
    }
  } | undefined)?.header?.config
  if (
    config?.provider !== PROVIDER
    || config.model !== MODEL
    || config.maxTokens !== MAX_TOKENS
  ) {
    throw new Error(`request/header lacks fixed route: ${JSON.stringify(config)}`)
  }
  const responseText = latestAssistantText(events)
  if (responseText.trim().length === 0) throw new Error(`request ${requestId} has no assistant text`)
  if (modelPostAttempts !== 1 || modelPostHttp200 !== 1) {
    throw new Error(
      `request ${requestId} expected one POST/HTTP 200, got ${modelPostAttempts}/${modelPostHttp200}`,
    )
  }
  return {
    sessionId,
    requestId,
    prompt,
    beforeSeq,
    afterSeq,
    responseText,
    requestHeader,
    modelPostAttempts,
    modelPostHttp200,
    eventTypes: types,
  }
}

function normalizedFacts(text: string): string {
  return text.replaceAll(/[\s,，]/g, '')
}

function assertContainsFacts(text: string, required: readonly string[], label: string): void {
  const normalized = normalizedFacts(text)
  for (const fact of required) {
    if (!normalized.includes(normalizedFacts(fact))) {
      throw new Error(
        `${label} did not contain required synthetic fact ${fact}; observed ${JSON.stringify(text)}`,
      )
    }
  }
}

function nativeSnapshot(session: LiveAgent['session']): SessionSnapshot {
  return {
    id: String(session.id),
    header: session.header,
    inheritedEventCount: Number(session.inheritedEventCount),
    events: session.snapshotEvents(),
    surfaceNodes: [...session.surface.nodes],
  }
}

function assertContiguous(events: readonly NativeEvent[], label: string): void {
  events.forEach((event, index) => {
    if (event.seq !== index) throw new Error(`${label} event seq is not contiguous at ${String(index)}`)
  })
}

async function readPersistedEvents(
  ctx: {
    readonly sessionPersistence: {
      open(id: string, mode: 'read'): Promise<{
        read(): Promise<{ events: readonly NativeEvent[] }>
        close(): Promise<void>
      }>
    }
  },
  id: string,
): Promise<readonly NativeEvent[]> {
  const handle = await ctx.sessionPersistence.open(id, 'read')
  try {
    return (await handle.read()).events
  } finally {
    await handle.close()
  }
}

async function setupProduction(
  runRoot: string,
  resolveCredential: () => string,
  acceptContext: (context: ProductionContext) => void,
): Promise<ProductionSetup> {
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
    PersistenceFormatModule,
    QueryModule,
    TypertModule,
    PiAiModule,
    TokenMeterModule,
    CompactionContractModule,
    CompactionBasicModule,
    ControllerAgentModule,
    ControllerCommandsModule,
    ControllerProjectionModule,
    ClientSessionModule,
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
    import(modulePath('packages/session/session-persistence-jsonl/src/format.ts')),
    import(modulePath('packages/session-query/session-query/src/index.ts')),
    import(modulePath('packages/typert/registry/src/index.ts')),
    import(modulePath('packages/llm/llm-pi-ai/src/index.ts')),
    import(modulePath('packages/llm/token-meter/src/index.ts')),
    import(modulePath('packages/compaction/compaction/src/index.ts')),
    import(modulePath('packages/compaction/compaction-basic/src/index.ts')),
    import(modulePath('packages/api/session-controller/src/agent.ts')),
    import(modulePath('packages/api/session-controller/src/commands.ts')),
    import(modulePath('packages/api/session-controller/src/model-selection-projection.ts')),
    import(modulePath('packages/api/session-controller/src/client/sessions/session.ts')),
  ])

  const Context = Cordis.Context
  const LlmRuntime = Llm.default
  const SessionStore = SessionModule.default
  const SessionLogOffset = SessionModule.SessionLogOffset
  const SystemPrompt = SystemPromptModule.default
  const ToolRuntime = ToolsModule.default
  const SessionProjectionRegistry = ProjectionsModule.default
  const AgentRegistry = AgentModule.default
  const AgentLoop = AgentLoopModule.default
  const JsonlSessionPersistence = PersistenceModule.default
  const logPath = PersistenceFormatModule.logPath
  const SessionQueryEngine = QueryModule.SessionQueryEngine
  const TypertRegistry = TypertModule.default
  const PiAiModuleDefault = PiAiModule.default
  const TokenMeter = TokenMeterModule.default
  const isCompactCheckpointSource = CompactionContractModule.isCompactCheckpointSource
  const BasicCompactionEngine = CompactionBasicModule.default
  const ApiSessionAgentController = ControllerAgentModule.ApiSessionAgentController
  const SessionCommandController = ControllerCommandsModule.SessionCommandController
  const installModelSelectionProjection = ControllerProjectionModule.installModelSelectionProjection
  const BrowserSession = ClientSessionModule.Session

  const live = new Context()
  acceptContext(live as unknown as ProductionContext)
  await live.plugin(TypertRegistry)
  await live.plugin(LlmRuntime)
  await live.plugin(SessionStore)
  await live.plugin(SessionProjectionRegistry)
  await live.plugin(SystemPrompt, { personaPrefix: '' })
  await live.plugin(ToolRuntime)
  await live.plugin(AgentRegistry)

  live.provide('agentDefaultModel', {
    currentSelection: () => ({ provider: PROVIDER, model: MODEL }),
    saveSelection: async () => {},
  })
  live.provide('workspaceRegistry', {
    archivedSessionIds: [],
    get: () => undefined,
    list: () => [],
  })
  live.provide('attachments', {
    imageLimits: {
      maxImageBytes: 5 * 1024 * 1024,
      maxImagesPerMessage: 20,
      maxMessageImageBytes: 100 * 1024 * 1024,
      maxImagePixels: 40_000_000,
      maxImageDimension: 2000,
      mediaTypes: ['image/png', 'image/jpeg', 'image/webp'],
    },
    admitPromptContent: async (content: readonly unknown[]) => [...content],
  })
  live.provide('fileUploads', {
    registerAgentResolver: () => () => {},
    resolve: () => undefined,
    retirePrompt: () => {},
    bindPrompt: () => ({
      commit: () => {},
      [Symbol.dispose]: () => {},
    }),
  })
  live.provide('fs', {})
  live.provide('credentials', {
    resolve: async (ref: unknown) => ref === CREDENTIAL_REF ? { value: resolveCredential() } : undefined,
    readRecord: async () => undefined,
    listRecords: async () => [],
    modifyRecord: async () => {
      throw new Error('in-memory credential seam is read-only')
    },
    deleteRecord: async () => {},
  })

  const persistenceRoot = join(runRoot, 'sessions')
  await live.plugin(JsonlSessionPersistence, {
    root: persistenceRoot,
    compression: 'none',
  })
  installModelSelectionProjection(live)
  new SessionQueryEngine(live)
  await live.plugin(PiAiModuleDefault, {
    providers: {
      [PROVIDER]: {
        apiKeyEnv: CREDENTIAL_REF,
        displayName: 'Lawbench synthetic 6000D',
        api: 'openai-completions',
        baseURL: MODEL_URL,
        models: [{
          id: MODEL,
          name: MODEL,
          contextWindow: 32_768,
          maxTokens: MAX_TOKENS,
          input: ['text'],
          reasoningEfforts: false,
        }],
        defaultInput: ['text'],
        defaultContextWindow: 32_768,
        defaultMaxTokens: MAX_TOKENS,
        cacheRetention: 'none',
        retryPolicy: { mode: 'normal', maxRetries: 0 },
        transport: 'sse',
        streamIdleTimeoutMs: 300_000,
      },
    },
  })
  await live.plugin(TokenMeter)
  await live.plugin(BasicCompactionEngine, {
    auto: false,
    summarizationProvider: PROVIDER,
    summarizationModel: MODEL,
    maxTokens: MAX_TOKENS,
    compactionRetries: 0,
    maxOverflowRetries: 0,
  })
  await live.plugin(AgentLoop, { agents: [] })

  const agents = new ApiSessionAgentController(live)
  const workspaceRoot = join(runRoot, 'workspace')
  const commands = new SessionCommandController(live, agents, workspaceRoot)
  const copyOriginalSession = async (sourcePath: string, header: SourceHeader) => {
    const destinationPath = logPath(persistenceRoot, header.cwd, header.id, 'none')
    await mkdir(dirname(destinationPath), { recursive: true })
    await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL)
    const copied = await readFile(destinationPath)
    return {
      destinationPath,
      bytes: copied.byteLength,
      sha256: sha256(copied),
    }
  }
  const reopenPersistedEvents = async (
    parentSessionId: string,
    childSessionId?: string,
  ): Promise<{ readonly parent: readonly NativeEvent[]; readonly child: readonly NativeEvent[] }> => {
    const verifier = new Context()
    try {
      await verifier.plugin(LlmRuntime)
      await verifier.plugin(SessionStore)
      await verifier.plugin(SessionProjectionRegistry)
      await verifier.plugin(SystemPrompt, { personaPrefix: '' })
      await verifier.plugin(ToolRuntime)
      await verifier.plugin(AgentRegistry)
      installModelSelectionProjection(verifier)
      await verifier.plugin(JsonlSessionPersistence, {
        root: persistenceRoot,
        compression: 'none',
      })
      await verifier.plugin(AgentLoop, { agents: [] })
      const parent = await readPersistedEvents(verifier, parentSessionId)
      const child = childSessionId === undefined
        ? []
        : await readPersistedEvents(verifier, childSessionId)
      return { parent, child }
    } finally {
      await verifier.fiber.dispose()
    }
  }
  return {
    live,
    agents,
    commands,
    BrowserSession,
    SessionLogOffset,
    isCompactCheckpointSource,
    persistenceRoot,
    workspaceRoot,
    copyOriginalSession,
    reopenPersistedEvents,
  }
}

function verifyCommittedCompaction(
  session: LiveAgent['session'],
  result: Awaited<ReturnType<ProductionContext['compaction']['compactNow']>> & {},
  isCompactCheckpointSource: (source: unknown) => boolean,
): CompactionObservation['eventSeqs'] {
  const events = session.snapshotEvents()
  const start = events[Number(result.startSeq)]
  const summary = events[Number(result.summarySeq)]
  const end = events[Number(result.endSeq)]
  if (start?.type !== 'compaction/start') throw new Error('compaction result start event is missing')
  if (summary?.type !== 'compaction/summary') throw new Error('compaction result summary event is missing')
  if (end?.type !== 'compaction/end') throw new Error('compaction result end event is missing')
  if (!(result.startSeq < result.summarySeq && result.summarySeq < result.endSeq)) {
    throw new Error('compaction event ordering is invalid')
  }
  const startData = start.data as {
    readonly compactionId?: unknown
    readonly turn?: unknown
  }
  const summaryData = summary.data as {
    readonly compactionId?: unknown
    readonly provider?: unknown
    readonly model?: unknown
    readonly maxTokens?: unknown
    readonly llmStreamCall?: unknown
    readonly summary?: unknown
    readonly shadowedRange?: {
      readonly start?: unknown
      readonly end?: unknown
    }
    readonly shadowedSeqs?: unknown
    readonly shadowedTokenCount?: unknown
  }
  const endData = end.data as {
    readonly compactionId?: unknown
    readonly turn?: unknown
    readonly error?: unknown
  }
  if (
    startData.compactionId !== result.compactionId
    || summaryData.compactionId !== result.compactionId
    || endData.compactionId !== result.compactionId
    || startData.turn !== null
    || endData.turn !== null
    || endData.error !== undefined
  ) {
    throw new Error('compaction lifecycle correlation or owner is invalid')
  }
  if (
    summaryData.provider !== PROVIDER
    || summaryData.model !== MODEL
    || summaryData.maxTokens !== MAX_TOKENS
    || summaryData.llmStreamCall !== true
    || !Array.isArray(summaryData.summary)
    || summaryData.summary.length === 0
    || !isDeepStrictEqual(summaryData.summary, result.summary)
    || summaryData.shadowedRange?.start !== result.shadowedRange.start
    || summaryData.shadowedRange?.end !== result.shadowedRange.end
    || !isDeepStrictEqual(summaryData.shadowedSeqs, result.shadowedSeqs)
    || summaryData.shadowedTokenCount !== result.shadowedTokenCount
  ) {
    throw new Error('compaction summary envelope is not the fixed native route')
  }
  const checkpointIndex = events.findIndex((event, seq) => (
    seq > result.summarySeq
    && seq < result.endSeq
    && event.type === 'user/message'
    && isCompactCheckpointSource((event.data as { readonly source?: unknown }).source)
  ))
  if (checkpointIndex === -1) throw new Error('compaction checkpoint user message is missing')
  const checkpoint = events[checkpointIndex]
  const checkpointData = checkpoint?.data as {
    readonly source?: { readonly compactionId?: unknown }
  }
  const checkpointSurfaceOp = checkpoint?.surfaceOp as {
    readonly op?: unknown
    readonly startSeq?: unknown
    readonly endSeq?: unknown
  } | undefined
  if (
    checkpoint === undefined
    || checkpointData.source?.compactionId !== result.compactionId
    || checkpointSurfaceOp?.op !== 'replace'
    || checkpointSurfaceOp.startSeq !== result.shadowedRange.start
    || checkpointSurfaceOp.endSeq !== result.shadowedRange.end
  ) {
    throw new Error('compaction checkpoint does not replace the reported span')
  }
  return {
    start: result.startSeq,
    summary: result.summarySeq,
    checkpoint: checkpointIndex,
    end: result.endSeq,
  }
}

async function main(): Promise<void> {
  const options = parseRunOptions(process.argv.slice(2))
  const runRoot = await createPrivateRunRoot()
  const networkGate: NetworkGateState = {
    preflightOnly: options.mode === 'preflight-only',
    keyReady: false,
    modelPostAttempts: 0,
    closedAttempts: 0,
  }
  const environment = isolateProcessFiles(runRoot)
  const cleanupFailures: string[] = []
  const network: NetworkObservation[] = []
  const browserSessions: BrowserSessionInstance[] = []
  let secret = ''
  let secretReader: SecretReaderState | undefined
  let outputRedaction: OutputRedactionLease | undefined
  let fetchLease: FetchLease | undefined
  let clientSessionsDisposed = true
  let fiberDisposed = false
  let environmentRestored = false
  let fetchRestored = false
  let outputRedactionRestored = false
  let keyCleared = false
  let ctx: ProductionContext | undefined
  let setup: ProductionSetup | undefined
  let originalBytes: Uint8Array | undefined
  let parsedSource: ReturnType<typeof parseOriginalSession> | undefined
  let sourceAgent: LiveAgent | undefined
  let childAgent: LiveAgent | undefined
  let parentAtFork: SessionSnapshot | undefined
  let parentAfterChild: SessionSnapshot | undefined
  let childAfterFork: SessionSnapshot | undefined
  let childAfterTurn: SessionSnapshot | undefined
  let childTurn: TurnRecord | undefined
  let persistence: RunReport['persistence']
  let originalSourceUnchanged: RunReport['originalSourceUnchanged']
  let restoreRecord: RunReport['restore']
  const compaction: CompactionObservation = {
    attempted: false,
    networkStart: 0,
    modelPostAttempts: 0,
    modelPostHttp200: 0,
    committed: false,
  }
  const report: RunReport = {
    format: 'lawbench-native-genuine-compacted-fork-v1',
    task: 'A-T31-genuine-compacted-fork-20261028-115217',
    mode: options.mode,
    status: 'RUNNING',
    authoredStatus: 'AUTHORED_NOT_RUN',
    process: {
      executable: process.execPath,
      pid: process.pid,
      startedAtUtc: processBirthUtc(),
      node: process.version,
      cwd: process.cwd(),
    },
    fixture: {
      syntheticOnly: true,
      code: SYNTHETIC_CODE,
      person: SYNTHETIC_PERSON,
      amount: SYNTHETIC_AMOUNT,
      provider: PROVIDER,
      model: MODEL,
      endpoint: MODEL_URL,
      maxTokens: MAX_TOKENS,
      tools: 'empty registry',
      automaticCompaction: false,
    },
    runRoot,
    admission: {},
    copy: {
      sourcePath: ORIGINAL_SESSION_PATH,
      sourceBytes: SOURCE_SESSION_BYTES,
      sourceSha256: SOURCE_SESSION_SHA256,
    },
    compaction,
    network,
    networkSummary: {
      observations: 0,
      modelPostAttempts: 0,
      modelPostHttp200: 0,
      closedAttempts: 0,
    },
    cleanup: {
      fiberDisposed: false,
      clientSessionsDisposed: false,
      fetchRestored: false,
      outputRedactionRestored: false,
      environmentRestored: false,
      keyCleared: false,
      failures: cleanupFailures,
    },
    claims: {
      gui: false,
      wholeT31: false,
      projectAcceptance: false,
      packaging: false,
    },
  }

  const isModelPost = (observation: NetworkObservation): boolean => (
    observation.method === 'POST' && new URL(observation.url).pathname.startsWith('/v1/')
  )

  try {
    report.admission.initial = await verifyAdmission()
    originalBytes = await readFile(ORIGINAL_SESSION_PATH)
    parsedSource = parseOriginalSession(originalBytes)
    fetchLease = installFetchAllowlist(network, networkGate)
    setup = await setupProduction(
      runRoot,
      () => {
        if (secret.length === 0) {
          throw new Error('production requested a credential before stdin readiness')
        }
        return secret
      },
      live => {
        ctx = live
      },
    )
    const production = setup
    const live = production.live

    const copied = await production.copyOriginalSession(ORIGINAL_SESSION_PATH, parsedSource.header)
    report.copy = {
      ...report.copy,
      destinationPath: copied.destinationPath,
      copiedBytes: copied.bytes,
      copiedSha256: copied.sha256,
      exactInitialCopy: (
        copied.bytes === SOURCE_SESSION_BYTES
        && copied.sha256 === SOURCE_SESSION_SHA256
      ),
    }
    if (report.copy.exactInitialCopy !== true) {
      throw new Error('copied source is not byte-identical to the accepted original')
    }

    const persistedPrefix = await readPersistedEvents(
      live as unknown as {
        readonly sessionPersistence: {
          open(id: string, mode: 'read'): Promise<{
            read(): Promise<{ events: readonly NativeEvent[] }>
            close(): Promise<void>
          }>
        }
      },
      SOURCE_SESSION_ID,
    )
    if (!isDeepStrictEqual(persistedPrefix, parsedSource.events)) {
      throw new Error('production persistence did not return the exact copied source events')
    }

    const resolved = await production.agents.resolveAgent(SOURCE_SESSION_ID)
    if ('error' in resolved) {
      throw new Error(`production restore failed: ${resolved.error.code}: ${resolved.error.message}`)
    }
    sourceAgent = resolved.agent
    await sourceAgent.whenIdle()
    const restored = nativeSnapshot(sourceAgent.session)
    assertContiguous(restored.events, 'restored parent')
    const prefix = restored.events.slice(0, SOURCE_SESSION_EVENT_COUNT)
    const appended = restored.events.slice(SOURCE_SESSION_EVENT_COUNT)
    if (!isDeepStrictEqual(prefix, parsedSource.events)) {
      throw new Error('restored parent did not preserve the original event prefix exactly')
    }
    if (!isDeepStrictEqual(restored.header, parsedSource.header)) {
      throw new Error('restored parent did not preserve the original header exactly')
    }
    restoreRecord = {
      persistedPrefixEventCount: persistedPrefix.length,
      persistedPrefixEqual: isDeepStrictEqual(persistedPrefix, parsedSource.events),
      livePrefixEqual: isDeepStrictEqual(prefix, parsedSource.events),
      appendedTypes: appended.map(event => event.type),
      sourceHeaderEqual: isDeepStrictEqual(restored.header, parsedSource.header),
      sourceSessionId: restored.id,
    }
    report.restore = restoreRecord

    if (options.mode === 'preflight-only') {
      report.status = 'CLEARSETUP_ONLY'
    } else {
      const credential = await readCredentialFromStdin()
      secret = credential.secret
      secretReader = credential.state
      outputRedaction = installOutputRedaction(secret)
      networkGate.keyReady = true

      compaction.attempted = true
      compaction.networkStart = network.length
      const compactionSignal = AbortSignal.timeout(TECHNICAL_WATCHDOG_MS)
      try {
        const compacted = await withWatchdog(
          live.compaction.compactNow(sourceAgent, compactionSignal),
        )
        compaction.modelPostAttempts = network.slice(compaction.networkStart).filter(isModelPost).length
        compaction.modelPostHttp200 = network
          .slice(compaction.networkStart)
          .filter(item => isModelPost(item) && item.status === 200)
          .length
        if (compacted === null) {
          report.stop = {
            reason: 'NO_USEFUL_RANGE',
            actualCause: 'BasicCompactionEngine.compactNow returned null without writing a compaction bracket',
            followedByFork: false,
            followedByModelTurn: false,
          }
          report.status = 'STOPPED_NO_USEFUL_RANGE'
        } else {
          if (compaction.modelPostAttempts !== 1 || compaction.modelPostHttp200 !== 1) {
            throw new Error(
              `committed compaction expected one model POST/HTTP 200, got`
              + ` ${compaction.modelPostAttempts}/${compaction.modelPostHttp200}`,
            )
          }
          const eventSeqs = verifyCommittedCompaction(
            sourceAgent.session,
            compacted,
            production.isCompactCheckpointSource,
          )
          const summaryEvent = sourceAgent.session.snapshotEvents()[compacted.summarySeq]
          const summaryData = summaryEvent?.data as {
            readonly provider: string
            readonly model: string
            readonly maxTokens: number
            readonly llmStreamCall: true
          }
          compaction.result = compacted
          compaction.eventSeqs = eventSeqs
          compaction.summaryFacts = {
            provider: summaryData.provider,
            model: summaryData.model,
            maxTokens: summaryData.maxTokens,
            llmStreamCall: summaryData.llmStreamCall,
          }
          const compactedPersisted = await readPersistedEvents(
            live as unknown as {
              readonly sessionPersistence: {
                open(id: string, mode: 'read'): Promise<{
                  read(): Promise<{ events: readonly NativeEvent[] }>
                  close(): Promise<void>
                }>
              }
            },
            SOURCE_SESSION_ID,
          )
          compaction.durableReopenEqual = isDeepStrictEqual(
            compactedPersisted,
            sourceAgent.session.snapshotEvents(),
          )
          if (!compaction.durableReopenEqual) {
            throw new Error('committed compaction was not durable on reopen before fork')
          }
          compaction.committed = true
          parentAtFork = nativeSnapshot(sourceAgent.session)
          assertContiguous(parentAtFork.events, 'durable compacted parent')
          if (
            !isDeepStrictEqual(
              parentAtFork.events.slice(0, SOURCE_SESSION_EVENT_COUNT),
              parsedSource.events,
            )
          ) {
            throw new Error('compaction changed the original parent event prefix')
          }

          const forked = await withWatchdog(
            production.commands.fork({ sessionId: SOURCE_SESSION_ID }),
          )
          const childUuid = SESSION_WITH_UUID.exec(forked.sessionId)?.[1]
          if (
            childUuid === undefined
            || !UUID_V4.test(childUuid)
            || forked.sessionId === SOURCE_SESSION_ID
          ) {
            throw new Error(`production fork did not mint a distinct UUID v4 identity: ${forked.sessionId}`)
          }
          const childSessionId = forked.sessionId
          const childSession = live.sessions.get(childSessionId as never)
          childAgent = live.agents.get(childSessionId as never)
          if (childSession === undefined || childAgent === undefined) {
            throw new Error('production fork did not publish the child Session and Agent')
          }
          const childSnapshot = nativeSnapshot(childSession)
          const inherited = childSnapshot.events.slice(0, childSnapshot.inheritedEventCount)
          const parentPrefix = parentAtFork.events.slice(0, childSnapshot.inheritedEventCount)
          const inheritedMarker = childSnapshot.events[childSnapshot.inheritedEventCount]
          const parentUnchangedByFork = isDeepStrictEqual(
            sourceAgent.session.snapshotEvents(),
            parentAtFork.events,
          )
          const childHeader = childSnapshot.header as {
            readonly parentSession?: unknown
            readonly isSeeded?: unknown
          }
          if (
            childHeader.parentSession !== SOURCE_SESSION_ID
            || childHeader.isSeeded !== true
            || !isDeepStrictEqual(inherited, parentPrefix)
            || inheritedMarker?.type !== 'session/end-seed'
            || (inheritedMarker.data as { readonly inherited?: unknown }).inherited !== true
            || !parentUnchangedByFork
          ) {
            throw new Error('production fork lineage, inherited prefix, marker, or parent stability failed')
          }
          if (
            childSnapshot.inheritedEventCount !== parentAtFork.events.length
            || !parentAtFork.events.some(event => event.type === 'compaction/end')
          ) {
            throw new Error('fork boundary did not include the committed durable compaction')
          }
          childAfterFork = childSnapshot
          report.fork = {
            childSessionId,
            parentSession: String(childHeader.parentSession),
            isSeeded: true,
            inheritedEventCount: childSnapshot.inheritedEventCount,
            inheritedPrefixEqual: isDeepStrictEqual(inherited, parentPrefix),
            compactionDurableBeforeFork: true,
            parentUnchangedByFork,
            parentUnchangedByChildTurn: false,
          }

          const childBrowser = new production.BrowserSession(childSession.id, {})
          browserSessions.push(childBrowser)
          childBrowser.handleRunning(true)
          const beforeSeq = Number(childSession.seq)
          const networkStart = network.length
          const submission = childBrowser.beginSubmission({
            mode: 'queue',
            text: FORK_PROMPT,
            attachments: [],
          })
          const requestId = String(submission.requestId)
          await withWatchdog(production.commands.prompt({
            sessionId: childSession.id,
            requestId: submission.requestId,
            mode: 'queue',
            content: [{ type: 'text', text: FORK_PROMPT }],
          }))
          await withWatchdog(childAgent.whenIdle())
          const afterSeq = Number(childSession.seq)
          const eventSlice = childSession.snapshotEvents(
            production.SessionLogOffset(beforeSeq),
            production.SessionLogOffset(afterSeq),
          )
          const turnPosts = network.slice(networkStart).filter(isModelPost)
          childTurn = assertTurn(
            childSession.id,
            requestId,
            FORK_PROMPT,
            beforeSeq,
            afterSeq,
            eventSlice,
            requestHeaderAtBoundary(
              childSession,
              production.SessionLogOffset,
              beforeSeq,
              afterSeq,
            ),
            turnPosts.length,
            turnPosts.filter(item => item.status === 200).length,
          )
          assertContainsFacts(
            childTurn.responseText,
            [SYNTHETIC_CODE, SYNTHETIC_PERSON, SYNTHETIC_AMOUNT],
            'compacted fork follow-up',
          )
          childAfterTurn = nativeSnapshot(childSession)
          assertContiguous(childAfterTurn.events, 'compacted fork child')
          parentAfterChild = nativeSnapshot(sourceAgent.session)
          const parentUnchangedByChildTurn = isDeepStrictEqual(
            parentAfterChild.events,
            parentAtFork.events,
          )
          if (!parentUnchangedByChildTurn) throw new Error('child turn mutated the parent Session')
          report.fork.parentUnchangedByChildTurn = true

          for (const browser of browserSessions.reverse()) {
            try {
              await browser.dispose()
            } catch (error: unknown) {
              clientSessionsDisposed = false
              cleanupFailures.push(`client Session dispose failed: ${errorName(error)}`)
            }
          }
          browserSessions.length = 0
          await live.fiber.dispose()
          fiberDisposed = true
          ctx = undefined

          const reopened = await production.reopenPersistedEvents(
            SOURCE_SESSION_ID,
            childSession.id,
          )
          const parentPath = report.copy.destinationPath
          if (parentPath === undefined) throw new Error('copied parent path is absent')
          const parentBytes = await readFile(parentPath)
          const childPath = join(
            dirname(parentPath),
            '..',
            childSessionId,
            'session.v4.jsonl',
          )
          const childBytes = await readFile(childPath)
          persistence = {
            root: production.persistenceRoot,
            parentReopened: reopened.parent.length > 0,
            childReopened: reopened.child.length > 0,
            parentEqual: isDeepStrictEqual(reopened.parent, parentAfterChild.events),
            childEqual: isDeepStrictEqual(reopened.child, childAfterTurn.events),
            parentBytes: parentBytes.byteLength,
            parentSha256: sha256(parentBytes),
            childBytes: childBytes.byteLength,
            childSha256: sha256(childBytes),
          }
          if (
            !persistence.parentEqual
            || !persistence.childEqual
            || !persistence.parentReopened
            || !persistence.childReopened
          ) {
            throw new Error('persistence close/reopen did not equal the live native event snapshots')
          }
          report.persistence = persistence

          const allPosts = network.filter(isModelPost)
          if (
            allPosts.length !== 2
            || allPosts.filter(item => item.status === 200).length !== 2
            || network.some(item => item.redirect !== 'error')
            || networkGate.closedAttempts !== 0
          ) {
            throw new Error('expected exactly one compaction POST and one fork-follow-up POST, both HTTP 200')
          }
          report.status = 'PASS_OPERATION_ONLY'
        }
      } catch (error: unknown) {
        compaction.modelPostAttempts = network.slice(compaction.networkStart).filter(isModelPost).length
        compaction.modelPostHttp200 = network
          .slice(compaction.networkStart)
          .filter(item => isModelPost(item) && item.status === 200)
          .length
        compaction.failure = safeError(error, secret)
        const codes = errorCodes(error)
        const messages = errorMessages(error)
        if (codes.includes('MAX_TOKENS') || messages.some(message => message.includes('token cap'))) {
          report.stop = {
            reason: 'MAX_TOKENS',
            actualCause: compaction.failure,
            followedByFork: false,
            followedByModelTurn: false,
          }
          report.status = 'STOPPED_MAX_TOKENS'
        } else if (messages.some(message => message.includes('summary is not smaller'))) {
          report.stop = {
            reason: 'NO_SHRINK',
            actualCause: compaction.failure,
            followedByFork: false,
            followedByModelTurn: false,
          }
          report.status = 'STOPPED_NO_SHRINK'
        } else {
          throw error
        }
      }
    }
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  } finally {
    report.compaction = compaction
    if (restoreRecord !== undefined) report.restore = restoreRecord
    if (parentAtFork !== undefined) report.parentAtFork = parentAtFork
    if (parentAfterChild !== undefined) report.parentAfterChild = parentAfterChild
    else if (ctx !== undefined && sourceAgent !== undefined) {
      try {
        report.parentAfterChild = nativeSnapshot(sourceAgent.session)
      } catch (error: unknown) {
        cleanupFailures.push(`final parent snapshot failed: ${errorName(error)}`)
      }
    }
    if (childAfterFork !== undefined) report.childAfterFork = childAfterFork
    if (childAfterTurn !== undefined) report.childAfterTurn = childAfterTurn
    if (childTurn !== undefined) report.childTurn = childTurn

    for (const browser of browserSessions.reverse()) {
      try {
        await browser.dispose()
      } catch (error: unknown) {
        clientSessionsDisposed = false
        cleanupFailures.push(`client Session dispose failed: ${errorName(error)}`)
      }
    }
    if (!fiberDisposed && ctx !== undefined) {
      try {
        await ctx.fiber.dispose()
        fiberDisposed = true
      } catch (error: unknown) {
        cleanupFailures.push(`root fiber dispose failed: ${errorName(error)}`)
      }
    }
    try {
      fetchLease?.restore()
      fetchRestored = fetchLease?.isRestored() ?? false
    } catch (error: unknown) {
      cleanupFailures.push(`fetch restore failed: ${errorName(error)}`)
    }
    try {
      environment.restore()
      environmentRestored = true
    } catch (error: unknown) {
      cleanupFailures.push(`environment restore failed: ${errorName(error)}`)
    }
    if (secretReader !== undefined) restoreSecretMode(secretReader, cleanupFailures)
    try {
      outputRedaction?.restore()
      outputRedactionRestored = outputRedaction?.isRestored() ?? false
    } catch (error: unknown) {
      cleanupFailures.push(`output redaction restore failed: ${errorName(error)}`)
    }
    report.cleanup.fiberDisposed = fiberDisposed
    report.cleanup.clientSessionsDisposed = clientSessionsDisposed
    report.cleanup.fetchRestored = fetchRestored
    report.cleanup.outputRedactionRestored = outputRedactionRestored
    report.cleanup.environmentRestored = environmentRestored
    if (persistence !== undefined) report.persistence = persistence
  }

  const modelPosts = network.filter(isModelPost)
  report.networkSummary = {
    observations: network.length,
    modelPostAttempts: modelPosts.length,
    modelPostHttp200: modelPosts.filter(item => item.status === 200).length,
    closedAttempts: fetchLease?.closedAttempts() ?? networkGate.closedAttempts,
  }

  if (originalBytes !== undefined) {
    try {
      const finalOriginal = await readFile(ORIGINAL_SESSION_PATH)
      originalSourceUnchanged = {
        bytes: finalOriginal.byteLength,
        sha256: sha256(finalOriginal),
        equal: isDeepStrictEqual(finalOriginal, originalBytes),
      }
      report.originalSourceUnchanged = originalSourceUnchanged
      if (
        !originalSourceUnchanged.equal
        || originalSourceUnchanged.sha256 !== SOURCE_SESSION_SHA256
      ) {
        report.status = 'FAILED'
        report.error = { message: 'original source session changed during the operation' }
      }
    } catch (error: unknown) {
      report.status = 'FAILED'
      report.error = {
        message: 'final original source verification failed',
        cause: safeError(error, secret),
      }
    }
  }

  const successfulStatus = (
    report.status === 'PASS_OPERATION_ONLY'
    || report.status === 'CLEARSETUP_ONLY'
    || report.status === 'STOPPED_NO_USEFUL_RANGE'
    || report.status === 'STOPPED_MAX_TOKENS'
    || report.status === 'STOPPED_NO_SHRINK'
  )
  if (successfulStatus && cleanupFailures.length > 0) {
    report.status = 'FAILED'
    report.error = { message: 'resource cleanup failed', failures: [...cleanupFailures] }
  } else if (
    report.status === 'CLEARSETUP_ONLY'
    && (
      !clientSessionsDisposed
      || !fiberDisposed
      || !fetchRestored
      || !environmentRestored
      || report.networkSummary.observations !== 0
      || report.networkSummary.closedAttempts !== 0
      || report.compaction.attempted
    )
  ) {
    report.status = 'FAILED'
    report.error = { message: 'preflight setup cleanup or closed-network invariant failed' }
  }

  if (
    report.status === 'PASS_OPERATION_ONLY'
    || report.status === 'CLEARSETUP_ONLY'
    || report.status === 'STOPPED_NO_USEFUL_RANGE'
    || report.status === 'STOPPED_MAX_TOKENS'
    || report.status === 'STOPPED_NO_SHRINK'
  ) {
    try {
      report.admission.final = await verifyAdmission()
    } catch (error: unknown) {
      report.status = 'FAILED'
      report.error = safeError(error, secret)
    }
  }

  const sanitized = redactUnknown(report, secret) as RunReport
  if (secret.length > 0 && JSON.stringify(sanitized).includes(secret)) {
    throw new Error('credential redaction failed before report write')
  }
  const outputSecretCleared = outputRedaction?.clearSecret() ?? secret.length === 0
  secret = ''
  keyCleared = outputSecretCleared
  sanitized.cleanup.keyCleared = keyCleared
  if (
    (
      sanitized.status === 'PASS_OPERATION_ONLY'
      || sanitized.status === 'STOPPED_NO_USEFUL_RANGE'
      || sanitized.status === 'STOPPED_MAX_TOKENS'
      || sanitized.status === 'STOPPED_NO_SHRINK'
    )
    && (
      !sanitized.cleanup.fiberDisposed
      || !sanitized.cleanup.clientSessionsDisposed
      || !sanitized.cleanup.fetchRestored
      || !sanitized.cleanup.outputRedactionRestored
      || !sanitized.cleanup.environmentRestored
      || !sanitized.cleanup.keyCleared
      || sanitized.networkSummary.closedAttempts !== 0
    )
  ) {
    sanitized.status = 'FAILED'
    sanitized.error = { message: 'final resource cleanup invariant failed' }
  }
  const reportPath = join(runRoot, 'report.json')
  await writeFile(reportPath, `${JSON.stringify(sanitized, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })
  process.stdout.write(`${JSON.stringify({
    status: sanitized.status,
    mode: sanitized.mode,
    report: reportPath,
    sourceSessionId: SOURCE_SESSION_ID,
    childSessionId: sanitized.fork?.childSessionId,
    compactionCommitted: sanitized.compaction.committed,
    compactionPosts: sanitized.compaction.modelPostAttempts,
    modelRequestsObserved: sanitized.networkSummary.modelPostAttempts,
    stopReason: sanitized.stop?.reason,
    childResponse: sanitized.childTurn?.responseText,
  }, null, 2)}\n`)
  if (
    sanitized.status === 'STOPPED_NO_USEFUL_RANGE'
    || sanitized.status === 'STOPPED_MAX_TOKENS'
    || sanitized.status === 'STOPPED_NO_SHRINK'
  ) {
    process.exitCode = 2
  } else if (
    sanitized.status !== 'PASS_OPERATION_ONLY'
    && sanitized.status !== 'CLEARSETUP_ONLY'
  ) {
    process.exitCode = 1
  }
}

await main()
