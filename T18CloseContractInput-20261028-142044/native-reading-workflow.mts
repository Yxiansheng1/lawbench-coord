/**
 * Finite T18 consumer: one synthetic five-material case-reading-notes request
 * through the current native Session, AgentLoop, LegalAgent/CoreClient, skill
 * provider, current B HTTP app, real tools, and a persisted Markdown draft.
 *
 * Authoring status: AUTHORED_NOT_RUN. This source contains no credential
 * source other than non-interactive stdin. The finite B token is generated in
 * memory and passed to the owned child process over its stdin pipe.
 */

import { createHash, randomBytes } from 'node:crypto'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, mkdtemp, lstat, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_ROOT = 'D:/Lawbeach/lawbench-B'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'fixed-inputs.json')
const FIXED_INPUTS_FORMAT = 'lawbench-t18-native-reading-fixed-inputs-v1'
const FIXED_INPUTS_SHA256 = '67a61b46b390d3ee7b9f9c2a1c7977cbdd21c3293d8b15bfe51cd0beb9eb07df'
const B_SERVICE_SCRIPT = join(EVIDENCE_DIR, 'b-service.py')
const MODEL_ORIGIN = 'http://10.126.126.1:8000'
const MODEL_URL = `${MODEL_ORIGIN}/v1`
const MODEL = 'qwen38-27b'
const PROVIDER = 'lawfirm'
const CREDENTIAL_REF = 'LAWFIRM_KEY'
const MAX_CREDENTIAL_BYTES = 4096
const TECHNICAL_WATCHDOG_MS = 86_400_000
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/

const MATERIAL_NAMES = ['借条', '情况说明', '案情摘要', '还款记录', '银行流水'] as const
const LAWYER_REQUEST = '李某乙这个借贷案，五份材料全部读一遍，出一份阅卷笔录。'
const USER_PROMPT = `${LAWYER_REQUEST}

这是纯合成测试，不对应任何真实案件或真实当事人。本次范围仅限以下五份已导入的虚构材料：借条、情况说明、案情摘要、还款记录、银行流水。请全部读完，保存一份 Markdown 阅卷笔录草稿。`
const SYNTHETIC_LAWYER_ANSWER =
  '确认本次仅处理以下五份合成材料：借条、情况说明、案情摘要、还款记录、银行流水。全部读完，并保存阅卷笔录 Markdown 草稿。'
const TASK_SKILL = 'case-reading-notes'

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly surfaceOp?: string
}

interface NetworkObservation {
  readonly kind: 'model' | 'core' | 'health'
  readonly startedAt: string
  readonly finishedAt?: string
  readonly method: string
  readonly origin: string
  readonly path: string
  readonly status?: number
  readonly outcome: 'completed' | 'failed'
  readonly redirect: 'error'
}

interface ApiObservation {
  readonly method: string
  readonly http: string
  readonly path: string
  readonly ok: boolean
  readonly code?: string
}

interface FixedEntry {
  readonly role?: string
  readonly group?: string
  readonly id?: string
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

interface FixedInputManifest {
  readonly format: typeof FIXED_INPUTS_FORMAT
  readonly task: 'A-T18-native-reading-workflow-20261028-133231'
  readonly hashAlgorithm: 'sha256'
  readonly sourcePins: {
    readonly root: string
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly entryCount: number
  }
  readonly baselineFixedInputs: {
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly entryCount: number
  }
  readonly fixtures: readonly FixedEntry[]
  readonly dependencies: readonly FixedEntry[]
  readonly runtimeExecutables: readonly FixedEntry[]
  readonly acceptedEvidence: readonly FixedEntry[]
  readonly bServiceEntry: FixedEntry
}

interface AdmissionRecord {
  readonly checkedAtUtc: string
  readonly manifestSha256: string
  readonly fixtureCount: number
  readonly dependencyCount: number
  readonly baselineFixedInputCount: number
  readonly reviewedBSourcePinCount: number
  readonly acceptedEvidenceCount: number
}

interface SecretReaderState {
  restore(): void
}

interface OutputRedactionLease {
  restore(): void
  isRestored(): boolean
  clearSecret(): boolean
}

interface FetchGate {
  modelEnabled: boolean
  localPort?: number
  deniedAttempts: number
}

interface FetchLease {
  restore(): void
  isRestored(): boolean
  deniedAttempts(): number
}

interface EnvironmentLease {
  restore(): void
}

interface BServiceReady {
  readonly status: 'ready'
  readonly pid: number
  readonly executable: string
  readonly startedAtUtc: string
  readonly host: '127.0.0.1'
  readonly port: number
  readonly contractVersion: string
  readonly lifespan: 'off'
  readonly sourcePinCount: number
  readonly forwardListener: false
  readonly ocrStarted: false
  readonly retainerStarted: false
}

interface BServiceLease {
  readonly token: string
  readonly ready: BServiceReady
  stop(): Promise<{ readonly code: number | null; readonly final: Record<string, unknown>; readonly forced: boolean }>
  forceStop(): void
  isStopped(): boolean
}

interface NativeTurnRecord {
  readonly sessionId: string
  readonly requestId: string
  readonly beforeSeq: number
  readonly afterSeq: number
  readonly responseTextSha256: string
  readonly responseTextLength: number
  readonly requestHeader: unknown
  readonly requestHeaderAnchor: {
    readonly sessionId: string
    readonly beforeSeq: number
    readonly afterSeq: number
    readonly sourceSeq: number
    readonly sourceType: 'request/header'
    readonly sourceScope: 'session-prefix' | 'current-turn'
  }
  readonly eventTypes: readonly string[]
}

interface ToolCallRecord {
  readonly ordinal: number
  readonly name: string
  readonly callId: string
  readonly argumentsSha256: string
}

interface QuestionRecord {
  readonly questionIds: readonly string[]
  readonly questionText: string
  readonly optionLabels: readonly string[]
  readonly answerIds: readonly string[]
  readonly answerText: string
}

interface SourceResponseRecord {
  readonly name: string
  readonly loc: unknown
  readonly citation: string
  readonly text: string
  readonly textSha256: string
  readonly sourceChanged: boolean
  readonly originalStatus: string | undefined
}

interface RunReport {
  format: 'lawbench-t18-native-reading-workflow-v1'
  task: 'A-T18-native-reading-workflow-20261028-133231'
  status: 'RUNNING' | 'PASS' | 'FAILED'
  authoredStatus: 'AUTHORED_NOT_RUN'
  startedAtUtc: string
  finishedAtUtc?: string
  process: {
    readonly executable: string
    readonly pid: number
    readonly node: string
    readonly cwd: string
  }
  fixture: {
    readonly syntheticOnly: true
    readonly names: readonly string[]
    readonly lawyerRequest: string
    readonly importedInstructionFile: false
    readonly importedJudgingNotes: false
  }
  runRoot?: string
  admission: { initial?: AdmissionRecord; final?: AdmissionRecord }
  bService?: {
    readonly ready: BServiceReady
    readonly final: Record<string, unknown>
    readonly exitCode: number | null
    readonly forcedStop: boolean
  }
  case?: {
    readonly caseId: string
    readonly path: string
    readonly materialIds: readonly string[]
    readonly importedPaths: readonly string[]
    readonly originalAreaFiles: readonly string[]
  }
  taskSelectionId?: string
  taskId?: string
  nativeSessionId?: string
  requestId?: string
  turn?: NativeTurnRecord
  modelPosts: {
    attempts: number
    http200: number
    observations: NetworkObservation[]
  }
  networkSummary: {
    observations: number
    modelPostAttempts: number
    modelPostHttp200: number
    coreCalls: number
    healthCalls: number
    deniedAttempts: number
  }
  apiCalls: ApiObservation[]
  toolCalls: ToolCallRecord[]
  question: QuestionRecord | null
  taskState?: Record<string, unknown>
  taskResult?: Record<string, unknown>
  coverage?: unknown
  readRanges?: unknown
  draft?: {
    readonly title: string
    readonly path: string
    readonly version: number
    readonly bytes: number
    readonly sha256: string
    readonly textLength: number
  }
  citationResponses?: readonly SourceResponseRecord[]
  persistence?: {
    readonly root: string
    readonly sessionReopened: boolean
    readonly liveEqualsReopened: boolean
    readonly physicalJsonlPath: string
    readonly physicalJsonlBytes: number
    readonly physicalJsonlSha256: string
    readonly physicalEventCount: number
  }
  cleanup: {
    agentCancelledOrIdle: boolean
    browserDisposed: boolean
    contextDisposed: boolean
    bServiceStopped: boolean
    fetchRestored: boolean
    environmentRestored: boolean
    outputRedactionRestored: boolean
    keyCleared: boolean
    failures: string[]
  }
  error?: unknown
  claims: {
    readonly oneSyntheticWorkflowOnly: true
    readonly fullT18: false
    readonly businessAcceptance: false
    readonly gui: false
    readonly packaging: false
  }
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

function modulePath(relativePath: string): string {
  return pathToFileURL(join(DSH_ROOT, relativePath)).href
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('expected an object')
  }
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('expected an array')
  return value
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`)
  return value
}

function asInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be an integer`)
  return Number(value)
}

async function sha256File(path: string): Promise<string> {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) digest.update(chunk as Buffer)
  return digest.digest('hex')
}

function sha256Bytes(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function ordinaryFile(path: string, expectedBytes?: number, expectedSha?: string): Promise<number> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`input is not an ordinary file: ${path}`)
  if (expectedBytes !== undefined && info.size !== expectedBytes) {
    throw new Error(`input byte count changed: ${path}`)
  }
  if (expectedSha !== undefined) {
    const actual = await sha256File(path)
    if (actual !== expectedSha) throw new Error(`input SHA-256 changed: ${path}`)
  }
  return info.size
}

async function assertDirectoryNotReparse(path: string): Promise<void> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`private root is not an ordinary directory: ${path}`)
  }
  if (pathKey(await realpath(path)) !== pathKey(path)) {
    throw new Error(`private root resolves through a reparse point: ${path}`)
  }
}

async function verifyFixedInputs(): Promise<{
  readonly admission: AdmissionRecord
  readonly manifest: FixedInputManifest
}> {
  if (!/^[0-9a-f]{64}$/.test(FIXED_INPUTS_SHA256)) {
    throw new Error('fixed-inputs manifest pin is not installed')
  }
  const manifestBytes = await readFile(FIXED_INPUTS_PATH)
  const manifestSha256 = sha256Bytes(manifestBytes)
  if (manifestSha256 !== FIXED_INPUTS_SHA256) {
    throw new Error('fixed-inputs manifest SHA-256 does not match the source pin')
  }
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as FixedInputManifest
  if (
    manifest.format !== FIXED_INPUTS_FORMAT
    || manifest.task !== 'A-T18-native-reading-workflow-20261028-133231'
    || manifest.hashAlgorithm !== 'sha256'
    || manifest.fixtures.length !== 5
    || JSON.stringify(manifest.fixtures.map(entry => entry.id).sort())
      !== JSON.stringify([...MATERIAL_NAMES].sort())
    || manifest.fixtures.some(entry => (
      entry.path.includes('_任务说明')
      || entry.path.includes('要点.md')
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes <= 0
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
    ))
  ) {
    throw new Error('fixed-inputs manifest header is invalid')
  }

  for (const entry of [...manifest.fixtures, ...manifest.dependencies,
    ...manifest.runtimeExecutables, ...manifest.acceptedEvidence, manifest.bServiceEntry]) {
    await ordinaryFile(entry.path, entry.bytes, entry.sha256)
  }

  const baseline = manifest.baselineFixedInputs
  await ordinaryFile(baseline.path, baseline.bytes, baseline.sha256)
  const baselineManifest = asRecord(JSON.parse(await readFile(baseline.path, 'utf8')))
  const baselineInputs = asArray(baselineManifest.inputs)
  if (baselineInputs.length !== baseline.entryCount) {
    throw new Error('accepted native baseline input count changed')
  }
  for (const raw of baselineInputs) {
    const entry = asRecord(raw)
    await ordinaryFile(
      asString(entry.path, 'baseline input path'),
      asInteger(entry.bytes, 'baseline input bytes'),
      asString(entry.sha256, 'baseline input sha256'),
    )
  }

  const pins = manifest.sourcePins
  await ordinaryFile(pins.path, pins.bytes, pins.sha256)
  const sourcePins = asRecord(JSON.parse(await readFile(pins.path, 'utf8')))
  const sourceRows = Object.entries(sourcePins)
  if (sourceRows.length !== pins.entryCount) throw new Error('reviewed B source pin count changed')
  for (const [relativePath, raw] of sourceRows) {
    const pure = relativePath.replaceAll('\\', '/')
    if (pure.startsWith('/') || pure.split('/').includes('..')) {
      throw new Error(`reviewed B source pin escapes B: ${relativePath}`)
    }
    const row = asRecord(raw)
    await ordinaryFile(
      join(pins.root, ...pure.split('/')),
      asInteger(row.bytes, 'reviewed B source bytes'),
      asString(row.sha256, 'reviewed B source sha256'),
    )
  }

  await ordinaryFile(B_SERVICE_SCRIPT, manifest.bServiceEntry.bytes, manifest.bServiceEntry.sha256)
  return {
    admission: {
      checkedAtUtc: utcNow(),
      manifestSha256,
      fixtureCount: manifest.fixtures.length,
      dependencyCount: manifest.dependencies.length,
      baselineFixedInputCount: baselineInputs.length,
      reviewedBSourcePinCount: sourceRows.length,
      acceptedEvidenceCount: manifest.acceptedEvidence.length,
    },
    manifest,
  }
}

function minimalChildEnvironment(root: string, pythonExe: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    HOME: join(root, 'home'),
    USERPROFILE: join(root, 'home'),
    APPDATA: join(root, 'appdata'),
    LOCALAPPDATA: join(root, 'localappdata'),
    TEMP: join(root, 'temp'),
    TMP: join(root, 'temp'),
    TMPDIR: join(root, 'temp'),
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUTF8: '1',
    NODE_USE_ENV_PROXY: '0',
    PATH: dirname(pythonExe),
  }
  for (const name of ['SYSTEMROOT', 'SystemRoot', 'WINDIR', 'COMSPEC', 'PATHEXT']) {
    const value = process.env[name]
    if (value !== undefined) env[name] = value
  }
  return env
}

async function isolateProcessFiles(root: string): Promise<EnvironmentLease> {
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
  const appdata = join(root, 'appdata')
  const localAppData = join(root, 'localappdata')
  const temp = join(root, 'temp')
  await mkdir(home, { recursive: true, mode: 0o700 })
  await mkdir(appdata, { recursive: true, mode: 0o700 })
  await mkdir(localAppData, { recursive: true, mode: 0o700 })
  await mkdir(temp, { recursive: true, mode: 0o700 })
  process.env.HOME = home
  process.env.USERPROFILE = home
  process.env.APPDATA = appdata
  process.env.LOCALAPPDATA = localAppData
  process.env.TEMP = temp
  process.env.TMP = temp
  process.env.TMPDIR = temp
  process.env.XDG_CONFIG_HOME = join(root, 'xdg-config')
  process.env.XDG_CACHE_HOME = join(root, 'xdg-cache')
  process.env.DSH_HOME = join(root, 'dsh-home')
  await mkdir(process.env.XDG_CONFIG_HOME, { recursive: true, mode: 0o700 })
  await mkdir(process.env.XDG_CACHE_HOME, { recursive: true, mode: 0o700 })
  await mkdir(process.env.DSH_HOME, { recursive: true, mode: 0o700 })
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

async function readCredentialFromStdin(): Promise<{
  readonly secret: string
  readonly state: SecretReaderState
}> {
  const stdin = process.stdin
  if (stdin.isTTY) throw new Error('credential input requires a non-interactive stdin pipe')
  const chunks: Buffer[] = []
  let count = 0
  return await new Promise((resolvePromise, reject) => {
    let settled = false
    const cleanup = (): void => {
      stdin.off('data', onData)
      stdin.off('error', onError)
      stdin.off('end', onEnd)
      stdin.off('close', onClose)
    }
    const fail = (message: string): void => {
      if (settled) return
      settled = true
      cleanup()
      stdin.pause()
      reject(new Error(message))
    }
    const onData = (chunk: Buffer | string): void => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      count += bytes.length
      if (count > MAX_CREDENTIAL_BYTES + 2) {
        fail('credential stdin exceeds the fixed size limit')
        return
      }
      chunks.push(bytes)
    }
    const onError = (): void => fail('credential stdin read failed')
    const onClose = (): void => fail('credential stdin closed before EOF')
    const onEnd = (): void => {
      if (settled) return
      const bytes = Buffer.concat(chunks, count)
      let size = bytes.length
      if (size >= 2 && bytes[size - 2] === 0x0d && bytes[size - 1] === 0x0a) size -= 2
      else if (size >= 1 && bytes[size - 1] === 0x0a) size -= 1
      if (size === 0) return fail('credential stdin was empty')
      if (size > MAX_CREDENTIAL_BYTES) return fail('credential stdin exceeds the fixed size limit')
      for (let index = 0; index < size; index += 1) {
        const byte = bytes[index]!
        if (byte < 0x20 || byte > 0x7e) return fail('credential contains non-printable ASCII')
      }
      settled = true
      cleanup()
      stdin.pause()
      resolvePromise({
        secret: bytes.subarray(0, size).toString('ascii'),
        state: { restore: () => {} },
      })
    }
    stdin.on('data', onData)
    stdin.once('error', onError)
    stdin.once('end', onEnd)
    stdin.once('close', onClose)
    stdin.resume()
  })
}

function redactText(value: string, secret: string): string {
  if (secret.length === 0) return value
  return value
    .split(secret).join('[REDACTED]')
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;"']+/gi, '$1[REDACTED]')
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s,;"']+/gi, '$1[REDACTED]')
}

function redactUnknown(value: unknown, secret: string): unknown {
  if (typeof value === 'string') return redactText(value, secret)
  if (Array.isArray(value)) return value.map(entry => redactUnknown(entry, secret))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      redactText(key, secret),
      redactUnknown(entry, secret),
    ]))
  }
  return value
}

function installOutputRedaction(secret: string): OutputRedactionLease {
  const stdoutWrite = process.stdout.write
  const stderrWrite = process.stderr.write
  let restored = false
  let current = secret
  const wrap = (
    target: NodeJS.WriteStream,
    original: NodeJS.WriteStream['write'],
  ): NodeJS.WriteStream['write'] => ((chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
    const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined
    const completion = typeof encodingOrCallback === 'function'
      ? encodingOrCallback as (error?: Error | null) => void
      : typeof callback === 'function'
        ? callback as (error?: Error | null) => void
        : undefined
    return original.call(target, redactText(text, current), encoding as BufferEncoding | undefined, completion)
  }) as NodeJS.WriteStream['write']
  process.stdout.write = wrap(process.stdout, stdoutWrite)
  process.stderr.write = wrap(process.stderr, stderrWrite)
  return {
    restore() {
      if (restored) return
      restored = true
      process.stdout.write = stdoutWrite
      process.stderr.write = stderrWrite
    },
    isRestored() {
      return restored && process.stdout.write === stdoutWrite && process.stderr.write === stderrWrite
    },
    clearSecret() {
      current = ''
      return current.length === 0
    },
  }
}

function safeError(error: unknown, secret: string, depth = 0): unknown {
  if (!(error instanceof Error)) return redactUnknown(error, secret)
  return {
    name: error.name,
    message: redactText(error.message, secret),
    ...(error.cause === undefined || depth >= 8
      ? {}
      : { cause: safeError(error.cause, secret, depth + 1) }),
  }
}

async function withWatchdog<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error(`technical watchdog expired after ${TECHNICAL_WATCHDOG_MS} ms`)),
        TECHNICAL_WATCHDOG_MS,
      )
    })
    return await Promise.race([work, timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function installFetchAllowlist(
  observations: NetworkObservation[],
  gate: FetchGate,
): FetchLease {
  const original = globalThis.fetch
  const expected = new URL(MODEL_ORIGIN)
  const allowedLocal = new Map<string, ReadonlySet<string>>([
    ['GET', new Set(['/health'])],
    ['POST', new Set([
      '/core/task/begin',
      '/core/context',
      '/core/tool',
      '/core/progress',
      '/core/task/end',
    ])],
  ])
  let restored = false
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : undefined
    const url = new URL(request?.url ?? String(input))
    const method = String(init?.method ?? request?.method ?? 'GET').toUpperCase()
    const isModel = (
      !gate.modelEnabled
        ? false
        : url.protocol === expected.protocol
          && url.hostname === expected.hostname
          && url.port === expected.port
          && url.username === ''
          && url.password === ''
          && url.pathname === '/v1/chat/completions'
          && method === 'POST'
    )
    const isLocal = (
      gate.localPort !== undefined
        && url.protocol === 'http:'
        && url.hostname === '127.0.0.1'
        && url.port === String(gate.localPort)
        && (allowedLocal.get(method)?.has(url.pathname) ?? false)
    )
    if (!isModel && !isLocal) {
      gate.deniedAttempts += 1
      throw new Error(`network allowlist denied ${method} ${url.protocol}//${url.host}${url.pathname}`)
    }
    const observation: NetworkObservation = {
      kind: isModel ? 'model' : url.pathname === '/health' ? 'health' : 'core',
      startedAt: utcNow(),
      method,
      origin: `${url.protocol}//${url.host}`,
      path: url.pathname,
      outcome: 'failed',
      redirect: 'error',
    }
    observations.push(observation)
    try {
      const response = await original(input, { ...init, redirect: 'error', cache: 'no-store' })
      observation.status = response.status
      observation.outcome = 'completed'
      observation.finishedAt = utcNow()
      return response
    } catch (error) {
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
    deniedAttempts() {
      return gate.deniedAttempts
    },
  }
}

async function startBService(
  runRoot: string,
  pythonExe: string,
  script: string,
): Promise<BServiceLease> {
  const token = randomBytes(32).toString('hex')
  const child: ChildProcessWithoutNullStreams = spawn(pythonExe, [script, '--root', runRoot], {
    cwd: EVIDENCE_DIR,
    env: minimalChildEnvironment(runRoot, pythonExe),
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let stopped = false
  let stderrTail = ''
  child.stdin.on('error', () => {})
  child.stderr.on('data', (chunk: Buffer) => {
    stderrTail = (stderrTail + chunk.toString('utf8')).slice(-65_536)
  })
  const exitPromise = new Promise<number | null>((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', code => {
      stopped = true
      resolvePromise(code)
    })
  })
  const readyPromise = new Promise<BServiceReady>((resolvePromise, reject) => {
    const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })
    let settled = false
    lines.once('line', line => {
      if (settled) return
      settled = true
      try {
        const ready = asRecord(JSON.parse(line))
        if (
          ready.status !== 'ready'
          || ready.host !== '127.0.0.1'
          || ready.lifespan !== 'off'
          || ready.contractVersion !== '1.6'
          || ready.forwardListener !== false
          || ready.ocrStarted !== false
          || ready.retainerStarted !== false
          || !Number.isSafeInteger(ready.port)
        ) {
          throw new Error('finite B service readiness record is invalid')
        }
        resolvePromise(ready as unknown as BServiceReady)
      } catch (error) {
        reject(error)
      }
    })
    child.once('error', reject)
    void exitPromise.then(code => {
      if (!settled) {
        settled = true
        reject(new Error(`finite B service exited before readiness: ${String(code)}; stderrType=${stderrTail.length}`))
      }
    })
  })
  child.stdin.write(`${token}\n`)
  let ready: BServiceReady
  try {
    ready = await withWatchdog(readyPromise)
    if (ready.pid !== child.pid) throw new Error('finite B service PID does not match the owned child')
    if (pathKey(ready.executable) !== pathKey(pythonExe)) {
      throw new Error('finite B service executable does not match the pinned Python executable')
    }
    const started = Date.parse(ready.startedAtUtc)
    if (!Number.isFinite(started) || started < Date.parse(processBirthUtc()) - 1000 || started > Date.now() + 1000) {
      throw new Error('finite B service UTC birth observation is outside the parent lifetime')
    }
  } catch (error) {
    child.kill()
    await withWatchdog(exitPromise).catch(() => undefined)
    throw error
  }
  let stopResult: { code: number | null; final: Record<string, unknown>; forced: boolean } | undefined
  return {
    token,
    ready,
    async stop() {
      if (stopResult !== undefined) return stopResult
      if (!child.stdin.destroyed) {
        child.stdin.write('stop\n')
        child.stdin.end()
      }
      const code = await withWatchdog(exitPromise)
      const final = asRecord(JSON.parse(await readFile(join(runRoot, 'b-service-final.json'), 'utf8')))
      stopResult = { code, final, forced: false }
      return stopResult
    },
    forceStop() {
      if (!stopped) child.kill()
    },
    isStopped() {
      return stopped
    },
  }
}

async function setupProduction(
  runRoot: string,
  localPort: number,
  localToken: string,
  personaPrefix: string,
  resolveCredential: () => string,
  recordNetwork: NetworkObservation[],
  recordApi: ApiObservation[],
  question: { value: QuestionRecord | null },
  blocked: Map<string, string>,
): Promise<any> {
  const [Cordis, Llm, SessionModule, SystemPromptModule, ToolsModule, ProjectionsModule,
    AgentModule, AgentLoopModule, PersistenceModule, QueryModule, TypertModule,
    PiAiModule, ControllerAgentModule, ControllerCommandsModule,
    ControllerProjectionModule, ClientSessionModule, SkillModule, SkillFsModule,
    ToolSkillModule, UserQuestionsModule, AskUserModule, ExtAgentModule, ExtHostModule] =
    await Promise.all([
      import(modulePath('vendor/cordis/lib/index.js')),
      import(modulePath('packages/llm/llm/src/index.ts')),
      import(modulePath('packages/core/session/src/index.ts')),
      import(modulePath('packages/core/system-prompt/src/index.ts')),
      import(modulePath('packages/core/tools/src/index.ts')),
      import(modulePath('packages/session/session-projection/src/index.ts')),
      import(modulePath('packages/core/agent/src/index.ts')),
      import(modulePath('packages/core/agent-loop/src/index.ts')),
      import(modulePath('packages/session/session-persistence-jsonl/src/index.ts')),
      import(modulePath('packages/session-query/session-query/src/index.ts')),
      import(modulePath('packages/typert/registry/src/index.ts')),
      import(modulePath('packages/llm/llm-pi-ai/src/index.ts')),
      import(modulePath('packages/api/session-controller/src/agent.ts')),
      import(modulePath('packages/api/session-controller/src/commands.ts')),
      import(modulePath('packages/api/session-controller/src/model-selection-projection.ts')),
      import(modulePath('packages/api/session-controller/src/client/sessions/session.ts')),
      import(modulePath('packages/skill/skill/src/index.ts')),
      import(modulePath('packages/skill/skill-filesystem/src/index.ts')),
      import(modulePath('packages/skill/tool-skill/src/index.ts')),
      import(modulePath('packages/interaction/user-questions/src/index.ts')),
      import(modulePath('packages/interaction/tool-ask-user/src/index.ts')),
      import(pathToFileURL(join(REPO_ROOT, 'dsh-ext/lib/agent.js')).href),
      import(pathToFileURL(join(REPO_ROOT, 'dsh-ext/lib/host.js')).href),
    ])

  const Context = Cordis.Context
  const LlmRuntime = Llm.default
  const SessionStore = SessionModule.default
  const SessionLogOffset = SessionModule.SessionLogOffset
  const SystemPrompt = SystemPromptModule.default
  const ToolRuntime = ToolsModule.default
  const ProjectionRegistry = ProjectionsModule.default
  const AgentRegistry = AgentModule.default
  const AgentLoop = AgentLoopModule.default
  const JsonlPersistence = PersistenceModule.default
  const SessionQueryEngine = QueryModule.SessionQueryEngine
  const TypertRegistry = TypertModule.default
  const ApiSessionAgentController = ControllerAgentModule.ApiSessionAgentController
  const SessionCommandController = ControllerCommandsModule.SessionCommandController
  const installModelSelectionProjection = ControllerProjectionModule.installModelSelectionProjection
  const BrowserSession = ClientSessionModule.Session
  const SkillRegistry = SkillModule.default
  const fileSystemSkills = SkillFsModule
  const toolSkill = ToolSkillModule
  const UserQuestions = UserQuestionsModule.default
  const askUserTool = AskUserModule
  const applyLegalAgent = ExtAgentModule.apply
  const LawbenchRemote = ExtHostModule.LawbenchRemote

  const live = new Context()
  const appData = join(runRoot, 'dsh-appdata')
  await mkdir(appData, { recursive: true, mode: 0o700 })

  await live.plugin(TypertRegistry)
  await live.plugin(LlmRuntime)
  await live.plugin(SessionStore)
  await live.plugin(ProjectionRegistry)
  await live.plugin(SystemPrompt, { personaPrefix })
  await live.plugin(ToolRuntime, { mode: 'native', maxParallelSubCalls: 10 })
  await live.plugin(AgentRegistry)
  await live.plugin(SkillRegistry)
  await live.plugin(fileSystemSkills, {
    providerName: 'lawbench-skills',
    includeDefaultRoots: false,
    watch: false,
    customSkillDirs: [join(B_ROOT, 'skills')],
  })
  await live.plugin(toolSkill)
  await live.plugin(UserQuestions)
  await live.plugin(askUserTool)

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
  await live.plugin(JsonlPersistence, { root: persistenceRoot, compression: 'none' })
  installModelSelectionProjection(live)
  new SessionQueryEngine(live)
  await live.plugin(PiAiModule, {
    providers: {
      [PROVIDER]: {
        displayName: 'Lawbench 6000D',
        apiKeyEnv: CREDENTIAL_REF,
        api: 'openai-completions',
        baseURL: MODEL_URL,
        models: [{
          id: MODEL,
          name: '律所模型（128K）',
          contextWindow: 131_072,
          maxTokens: 16_384,
          input: ['text'],
          reasoningEfforts: {
            off: null,
            low: 'low',
            medium: 'medium',
            high: 'xhigh',
          },
        }],
        defaultInput: ['text'],
        defaultContextWindow: 131_072,
        defaultMaxTokens: 16_384,
        cacheRetention: 'none',
        transport: 'sse',
        timeoutMs: 1_200_000,
        streamIdleTimeoutMs: 1_200_000,
        retryPolicy: { mode: 'normal', maxRetries: 1 },
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          maxTokensField: 'max_tokens',
          thinkingFormat: 'chat-template',
          chatTemplateKwargs: {
            enable_thinking: { $var: 'thinking.enabled' },
            reasoning_effort: { $var: 'thinking.effort', omitWhenOff: true },
          },
        },
      },
    },
  })

  live.provide('lawbenchCore', Object.freeze({
    endpoint: () => ({ port: localPort, token: localToken }),
    noteTurnBlocked: (sessionId: string, code: string) => { blocked.set(sessionId, code) },
    clearTurnBlocked: (sessionId: string) => { blocked.delete(sessionId) },
    sheetHeld: () => false,
    externalLlmState: async () => ({
      enabled: false,
      model: null,
      contextWindow: null,
      keyConfigured: false,
      supportsTools: true,
    }),
    state: () => 'running',
    onState: (callback: (state: string) => void) => { callback('running'); return () => {} },
  }))
  applyLegalAgent(live, { appData, validateContracts: true })

  live.on('user-questions/request', (async (request: unknown, next: () => Promise<unknown>) => {
    if (question.value !== null) return next()
    const body = asRecord(request)
    const questions = asArray(body.questions).map(asRecord)
    if (questions.length === 0) return next()
    const ids = questions.map((item, index) => asString(item.id, `question ${index + 1} id`))
    if (ids.some(id => id.length === 0) || new Set(ids).size !== ids.length) return next()
    const options = questions.flatMap(item => asArray(item.options ?? []).map(asRecord))
    const optionLabels = options.map((option, index) => asString(option.label, `option ${index + 1} label`))
    const forbidden = ['真实案件', '真实材料', '删除', '移除', '覆盖原件']
    for (const item of questions) {
      const ownOptions = asArray(item.options ?? []).map(asRecord)
      const text = [
        asString(item.question, 'question text'),
        ...ownOptions.map((option, index) => asString(option.label, `question option ${index + 1}`)),
        ...ownOptions.flatMap(option => (
          option.description === undefined ? [] : [asString(option.description, 'option description')]
        )),
      ].join('\n')
      if (forbidden.some(word => text.includes(word)) || MATERIAL_NAMES.some(name => !text.includes(name))) {
        return next()
      }
    }
    question.value = {
      questionIds: ids,
      questionText: questions.map(item => asString(item.question, 'question text')).join('\n'),
      optionLabels,
      answerIds: ids,
      answerText: SYNTHETIC_LAWYER_ANSWER,
    }
    return {
      answers: ids.map(id => ({
        id,
        selected: [],
        custom: SYNTHETIC_LAWYER_ANSWER,
      })),
    }
  }) as never)

  await live.plugin(AgentLoop, { agents: [] })
  const agents = new ApiSessionAgentController(live)
  const workspaceRoot = join(runRoot, 'w')
  const commands = new SessionCommandController(live, agents, workspaceRoot)
  const supervisor = {
    endpoint: () => ({ port: localPort, token: localToken }),
    state: 'running' as const,
  }
  const remote = new LawbenchRemote(
    supervisor,
    appData,
    () => {
      throw new Error('host credential getter is outside the finite workflow')
    },
    [join(B_ROOT, 'skills')],
    () => {},
  )
  const forwardedCall = remote.callApi.bind(remote) as (route: any, request: unknown) => Promise<any>
  remote.callApi = async (route: any, request: unknown) => {
    const result = await forwardedCall(route, request)
    recordApi.push({
      method: route.method,
      http: route.http,
      path: route.path,
      ok: result.ok === true,
      ...(result.ok === true ? {} : { code: String(result.error?.code ?? 'UNKNOWN') }),
    })
    return result
  }
  const forwardedSettings = remote.getSettings.bind(remote) as () => Promise<unknown>
  remote.getSettings = async () => {
    const result = await forwardedSettings()
    recordApi.push({ method: 'getSettings', http: 'GET', path: '/api/settings', ok: true })
    return result
  }

  const reopenPersistedEvents = async (sessionId: string): Promise<readonly NativeEvent[]> => {
    const verifier = new Context()
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
      const handle = await verifier.sessionPersistence.open(sessionId, 'read')
      try {
        return (await handle.read()).events as readonly NativeEvent[]
      } finally {
        await handle.close()
      }
    } finally {
      await verifier.fiber.dispose()
    }
  }

  return {
    live,
    commands,
    BrowserSession,
    SessionLogOffset,
    persistenceRoot,
    workspaceRoot,
    remote,
    reopenPersistedEvents,
  }
}

function apiRoute(method: string): any {
  const routes: Record<string, {
    method: string
    http: 'GET' | 'POST'
    path: string
    contract: string
    timeoutMs?: number
  }> = {
    caseOpen: { method: 'caseOpen', http: 'POST', path: '/api/case/open', contract: 'case_open' },
    materialsImport: {
      method: 'materialsImport',
      http: 'POST',
      path: '/api/materials/import',
      contract: 'materials_import',
      timeoutMs: 10 * 60_000,
    },
    materialsList: { method: 'materialsList', http: 'GET', path: '/api/materials', contract: 'materials_list' },
    requestScope: { method: 'requestScope', http: 'POST', path: '/api/request/scope', contract: 'request_scope' },
    taskCreate: { method: 'taskCreate', http: 'POST', path: '/api/task', contract: 'task_create' },
    tasksList: { method: 'tasksList', http: 'GET', path: '/api/tasks', contract: 'tasks_list' },
    source: { method: 'source', http: 'GET', path: '/api/source', contract: 'source' },
  }
  const route = routes[method]
  if (route === undefined) throw new Error(`missing API route ${method}`)
  return route
}

function apiOk(result: any, label: string): Record<string, unknown> {
  if (result.ok !== true) throw new Error(`${label} failed: ${String(result.error?.code ?? 'UNKNOWN')}`)
  return asRecord(result.value)
}

function requestIdFromEvent(event: NativeEvent): string | undefined {
  if (event.type !== 'user/message') return undefined
  const source = asRecord(event.data).source
  if (source === null || typeof source !== 'object') return undefined
  const row = source as Record<string, unknown>
  return row.kind === 'user' && typeof row.rpcId === 'string' ? row.rpcId : undefined
}

function assistantText(event: NativeEvent): string {
  const message = asRecord(asRecord(event.data).message)
  return asArray(message.content ?? [])
    .flatMap(part => {
      const row = asRecord(part)
      return row.type === 'text' && typeof row.text === 'string' ? [row.text] : []
    })
    .join('')
}

function requestHeaderAtBoundary(
  session: { readonly id: string; snapshotEvents(offset?: unknown, endOffset?: unknown): readonly NativeEvent[] },
  offsetFactory: (offset: number) => unknown,
  beforeSeq: number,
  afterSeq: number,
  turnEvents: readonly NativeEvent[],
): {
  readonly data: unknown
  readonly anchor: NativeTurnRecord['requestHeaderAnchor']
} {
  if (afterSeq <= beforeSeq || beforeSeq < 0) throw new Error('invalid native turn boundary')
  const prefix = session.snapshotEvents(offsetFactory(0), offsetFactory(afterSeq))
  const source = prefix.findLast(event => event.type === 'request/header')
  if (source === undefined || source.seq < 0 || source.seq >= afterSeq) {
    throw new Error('authoritative request/header is absent from the session prefix')
  }
  const hadPrior = prefix.some(event => event.type === 'request/header' && event.seq < beforeSeq)
  const current = turnEvents.findLast(event => event.type === 'request/header')
  if (!hadPrior && current?.seq !== source.seq) {
    throw new Error('the first turn lacks a current native request/header')
  }
  return {
    data: source.data,
    anchor: {
      sessionId: String(session.id),
      beforeSeq,
      afterSeq,
      sourceSeq: source.seq,
      sourceType: 'request/header',
      sourceScope: source.seq >= beforeSeq ? 'current-turn' : 'session-prefix',
    },
  }
}

function toolCallsFromEvents(events: readonly NativeEvent[]): ToolCallRecord[] {
  const calls: ToolCallRecord[] = []
  for (const event of events) {
    if (event.type !== 'tool/call') continue
    const data = asRecord(event.data)
    calls.push({
      ordinal: calls.length + 1,
      name: asString(data.name, 'tool call name'),
      callId: asString(data.callId, 'tool call id'),
      argumentsSha256: sha256Bytes(JSON.stringify(data.arguments ?? null)),
    })
  }
  return calls
}

function skillNameFromCall(event: NativeEvent): string | undefined {
  if (event.type !== 'tool/call') return undefined
  const data = asRecord(event.data)
  if (data.name !== 'skill') return undefined
  if (data.arguments !== null && typeof data.arguments === 'object' && !Array.isArray(data.arguments)) {
    const args = data.arguments as Record<string, unknown>
    return typeof args.name === 'string' ? args.name : undefined
  }
  if (typeof data.arguments === 'string') {
    try {
      const args = JSON.parse(data.arguments) as Record<string, unknown>
      return typeof args.name === 'string' ? args.name : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

async function listFiles(root: string): Promise<string[]> {
  const output: string[] = []
  const walk = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`case tree contains a reparse entry: ${path}`)
      if (entry.isDirectory()) await walk(path)
      else if (entry.isFile()) output.push(relative(root, path).replaceAll('\\', '/'))
      else throw new Error(`case tree contains a non-ordinary entry: ${path}`)
    }
  }
  await walk(root)
  return output.sort()
}

function citationTextFor(name: string, loc: Record<string, unknown>): string {
  const unit = asString(loc.unit, 'citation unit')
  if (unit === 'cell') {
    return `〔${name} ${asString(loc.sheet, 'citation sheet')}!${asString(loc.ref, 'citation ref')}〕`
  }
  const from = asInteger(loc.from, 'citation from')
  const toValue = loc.to
  const suffix = unit === 'page' ? '页' : unit === 'para' ? '段' : unit === 'line' ? '行' : ''
  if (suffix.length === 0) throw new Error(`unsupported citation unit ${unit}`)
  const to = toValue === undefined ? from : asInteger(toValue, 'citation to')
  return `〔${name} 第${from === to ? String(from) : `${String(from)}-${String(to)}`}${suffix}〕`
}

function assertCoverage(value: unknown): void {
  const coverage = asRecord(value)
  if (coverage.total !== 5) throw new Error('task coverage total is not five')
  const fullyRead = asArray(coverage.fully_read).map((name, index) => asString(name, `fully_read ${index + 1}`))
  const expected = [...MATERIAL_NAMES].sort()
  if (JSON.stringify([...fullyRead].sort()) !== JSON.stringify(expected)) {
    throw new Error(`coverage not all five materials: ${JSON.stringify({ fullyRead, ...coverage })}`)
  }
  if (asArray(coverage.partially_read).length || asArray(coverage.not_read).length || asArray(coverage.unreadable).length) {
    throw new Error('coverage still contains partial, unread, or unreadable materials')
  }
}

function assertBusinessContent(content: string, citations: readonly Record<string, unknown>[]): void {
  const facts: readonly [string, RegExp][] = [
    ['出借人李某乙', /李某乙/],
    ['借款人王某丙', /王某丙/],
    ['本金80000', /80[,，]?000/],
    ['已还20000', /20[,，]?000/],
    ['借款日期2025-03-10', /2025(?:年3月10日|-0?3-10)/],
  ]
  for (const [label, pattern] of facts) {
    if (!pattern.test(content)) throw new Error(`saved draft lacks source fact ${label}`)
  }
  for (const forbidden of ['胜诉率', '成功率', '诉讼策略', '必定胜诉', '必然胜诉']) {
    if (content.includes(forbidden)) throw new Error(`saved draft contains forbidden judgment ${forbidden}`)
  }
  const names = new Set(citations.map(item => asString(item.name, 'citation name')))
  for (const name of MATERIAL_NAMES) {
    if (!names.has(name)) throw new Error(`saved draft lacks a citation to ${name}`)
    if (!content.includes(`〔${name} `)) {
      throw new Error(`latest saved draft does not cite ${name} inline`)
    }
  }
}

function summarizeNetwork(observations: readonly NetworkObservation[], denied: number): RunReport['networkSummary'] {
  const model = observations.filter(item => item.kind === 'model')
  return {
    observations: observations.length,
    modelPostAttempts: model.filter(item => item.method === 'POST').length,
    modelPostHttp200: model.filter(item => item.method === 'POST' && item.status === 200).length,
    coreCalls: observations.filter(item => item.kind === 'core').length,
    healthCalls: observations.filter(item => item.kind === 'health').length,
    deniedAttempts: denied,
  }
}

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== '--credential-stdin') {
    throw new Error('usage: native-reading-workflow.mts --credential-stdin')
  }
  await assertDirectoryNotReparse(EVIDENCE_DIR)
  const runRoot = await mkdtemp(join(EVIDENCE_DIR, 'run-'))
  await assertDirectoryNotReparse(runRoot)
  if ((await readdir(runRoot)).length !== 0) throw new Error('fresh private run root is not empty')

  let initial: Awaited<ReturnType<typeof verifyFixedInputs>>
  try {
    initial = await verifyFixedInputs()
  } catch (error: unknown) {
    await writeFile(join(runRoot, 'preflight-failure.json'), `${JSON.stringify({
      format: 'lawbench-t18-native-reading-preflight-failure-v1',
      status: 'FAILED',
      authoredStatus: 'AUTHORED_NOT_RUN',
      checkedAtUtc: utcNow(),
      error: safeError(error, ''),
      runRoot,
    }, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    throw error
  }
  const manifest = initial.manifest
  const pythonExe = manifest.runtimeExecutables.find(entry => entry.role === 'python')?.path
  if (pythonExe === undefined) throw new Error('fixed manifest lacks the Python executable')
  const nodeExe = manifest.runtimeExecutables.find(entry => entry.role === 'node')?.path
  if (nodeExe === undefined || pathKey(nodeExe) !== pathKey(process.execPath)) {
    throw new Error('consumer was not started with the pinned Node executable')
  }
  const personaPath = manifest.dependencies.find(entry => entry.role === 'persona')?.path
  const skillPath = manifest.dependencies.find(entry => entry.role === 'skill')?.path
  const sharedRulesPath = manifest.dependencies.find(entry => entry.role === 'shared-rules')?.path
  if (personaPath === undefined || skillPath === undefined || sharedRulesPath === undefined) {
    throw new Error('fixed manifest lacks the production persona or skill inputs')
  }
  const personaPrefix = (await readFile(personaPath, 'utf8')).replace(/^【草稿[^\n]*\n+/, '').trim()
  if (!personaPrefix.includes('律所内部的案件助手')) throw new Error('production persona prefix is absent')
  const skillText = await readFile(skillPath, 'utf8')
  if (!skillText.includes(`name: ${TASK_SKILL}`)) throw new Error('case-reading-notes skill identity changed')
  const sharedRules = await readFile(sharedRulesPath, 'utf8')
  if (!sharedRules.includes('出处格式固定为〔材料名 位置〕')) throw new Error('shared citation rules changed')

  const environment = await isolateProcessFiles(runRoot)
  const network: NetworkObservation[] = []
  const apiCalls: ApiObservation[] = []
  const fetchGate: FetchGate = { modelEnabled: false, deniedAttempts: 0 }
  const fetchLease = installFetchAllowlist(network, fetchGate)
  const cleanupFailures: string[] = []
  const blocked = new Map<string, string>()
  const question = { value: null as QuestionRecord | null }
  let secret = ''
  let secretReader: SecretReaderState | undefined
  let outputRedaction: OutputRedactionLease | undefined
  let service: BServiceLease | undefined
  let production: any
  let sessionId = ''
  let agent: any
  let browser: any
  let liveEvents: readonly NativeEvent[] = []
  let browserDisposed = false
  let contextDisposed = false
  let bStopped = false
  let agentJoined = false
  let environmentRestored = false

  const report: RunReport = {
    format: 'lawbench-t18-native-reading-workflow-v1',
    task: 'A-T18-native-reading-workflow-20261028-133231',
    status: 'RUNNING',
    authoredStatus: 'AUTHORED_NOT_RUN',
    startedAtUtc: processBirthUtc(),
    process: {
      executable: process.execPath,
      pid: process.pid,
      node: process.version,
      cwd: process.cwd(),
    },
    fixture: {
      syntheticOnly: true,
      names: [...MATERIAL_NAMES],
      lawyerRequest: LAWYER_REQUEST,
      importedInstructionFile: false,
      importedJudgingNotes: false,
    },
    runRoot,
    admission: { initial: initial.admission },
    modelPosts: { attempts: 0, http200: 0, observations: network.filter(item => item.kind === 'model') },
    networkSummary: {
      observations: 0,
      modelPostAttempts: 0,
      modelPostHttp200: 0,
      coreCalls: 0,
      healthCalls: 0,
      deniedAttempts: 0,
    },
    apiCalls,
    toolCalls: [],
    question: null,
    cleanup: {
      agentCancelledOrIdle: false,
      browserDisposed: false,
      contextDisposed: false,
      bServiceStopped: false,
      fetchRestored: false,
      environmentRestored: false,
      outputRedactionRestored: false,
      keyCleared: false,
      failures: cleanupFailures,
    },
    claims: {
      oneSyntheticWorkflowOnly: true,
      fullT18: false,
      businessAcceptance: false,
      gui: false,
      packaging: false,
    },
  }

  try {
    const credential = await readCredentialFromStdin()
    secret = credential.secret
    secretReader = credential.state
    outputRedaction = installOutputRedaction(secret)
    fetchGate.modelEnabled = true

    service = await startBService(runRoot, pythonExe, B_SERVICE_SCRIPT)
    fetchGate.localPort = service.ready.port
    const health = await withWatchdog(fetch(`http://127.0.0.1:${String(service.ready.port)}/health`, {
      headers: { authorization: `Bearer ${service.token}` },
      redirect: 'error',
      cache: 'no-store',
    }))
    if (health.status !== 200) throw new Error(`finite B health returned ${String(health.status)}`)
    const healthBody = asRecord(await health.json())
    if (healthBody.status !== 'ok' || healthBody.contract_version !== '1.6') {
      throw new Error('finite B health contract is invalid')
    }

    production = await setupProduction(
      runRoot,
      service.ready.port,
      service.token,
      personaPrefix,
      () => {
        if (secret.length === 0) throw new Error('model requested a credential before stdin readiness')
        return secret
      },
      network,
      apiCalls,
      question,
      blocked,
    )
    const remote = production.remote
    const caseRoot = join(runRoot, 'case')
    await mkdir(caseRoot, { recursive: true, mode: 0o700 })
    const opened = apiOk(await remote.callApi(apiRoute('caseOpen'), {
      path: caseRoot,
      template: 'civil',
      kind: 'civil',
    }), 'caseOpen')
    const caseId = asString(opened.case_id, 'case_id')
    if (opened.created !== true) throw new Error('fresh synthetic case was not created')

    const fixturePaths = manifest.fixtures.map(entry => entry.path)
    const imported = apiOk(await remote.callApi(apiRoute('materialsImport'), {
      case_id: caseId,
      paths: fixturePaths,
      target: '02案件材料',
      unzip: false,
      mode: 'copy',
    }), 'materialsImport')
    if (asArray(imported.skipped).length !== 0 || asArray(imported.copied).length !== 5) {
      throw new Error('current import pipeline did not copy exactly five fixtures')
    }
    const listed = apiOk(await remote.callApi(apiRoute('materialsList'), { case_id: caseId }), 'materialsList')
    const materials = asArray(listed.materials).map(asRecord)
    if (materials.length !== 5) throw new Error('imported material count is not five')
    const byName = new Map(materials.map(row => [asString(row.name, 'material name'), row]))
    for (const expected of manifest.fixtures) {
      const row = byName.get(expected.id!)
      if (
        row === undefined
        || row.status !== 'parsed'
        || row.error !== null
        || asArray(row.pages_need_ocr).length !== 0
      ) {
        throw new Error(`imported material identity or parse state changed: ${expected.id}`)
      }
      await ordinaryFile(
        join(caseRoot, ...asString(row.rel_path, 'material rel_path').split('/')),
        expected.bytes,
        expected.sha256,
      )
    }
    const materialIds = materials
      .slice()
      .sort((left, right) => asString(left.material_id, 'material_id').localeCompare(
        asString(right.material_id, 'material_id'),
      ))
      .map(row => asString(row.material_id, 'material_id'))
    const materialShaById = new Map(materialIds.map(materialId => {
      const row = materials.find(candidate => candidate.material_id === materialId)
      if (row === undefined) throw new Error(`material ${materialId} disappeared`)
      const name = asString(row.name, 'material name')
      const fixture = manifest.fixtures.find(entry => entry.id === name)
      if (fixture === undefined) throw new Error(`material ${materialId} is outside the fixed fixtures`)
      return [materialId, fixture.sha256] as const
    }))
    const originalArea = (await listFiles(caseRoot)).filter(path => (
      !path.startsWith('工作区/') && !path.startsWith('成果/') && !path.split('/').some(part => part.startsWith('.'))
    ))
    const expectedOriginal = manifest.fixtures
      .map(entry => `02案件材料/${entry.id!}.${extname(entry.path).slice(1)}`)
      .sort()
    if (JSON.stringify(originalArea) !== JSON.stringify(expectedOriginal)) {
      throw new Error(`case original area is not exactly five declared fixtures: ${JSON.stringify(originalArea)}`)
    }
    report.case = {
      caseId,
      path: caseRoot,
      materialIds,
      importedPaths: asArray(imported.copied).map((raw, index) => asString(asRecord(raw).to, `copied ${index + 1}`)),
      originalAreaFiles: originalArea,
    }

    const settings = asRecord(await remote.getSettings())
    const defaults = asRecord(settings.defaults)
    if (
      defaults.thinking !== '中'
      || defaults.window !== '64K'
      || defaults.max_tokens !== 16_384
      || defaults.temperature !== 0.6
    ) {
      throw new Error('fresh B settings no longer expose the current production defaults')
    }

    const created = await withWatchdog(production.commands.create({ cwd: caseRoot })) as { sessionId: string }
    sessionId = String(created.sessionId)
    report.nativeSessionId = sessionId
    if (SESSION_WITH_UUID.exec(sessionId)?.[1] === undefined) {
      throw new Error(`SessionCommandController.create did not mint a UUID Session: ${sessionId}`)
    }
    const nativeSession = production.live.sessions.get(created.sessionId)
    agent = production.live.agents.get(created.sessionId)
    if (nativeSession === undefined || agent === undefined) {
      throw new Error('SessionCommandController.create did not publish the production Session and Agent')
    }
    browser = new production.BrowserSession(nativeSession.id, {})
    browser.handleRunning(true)

    const selected = apiOk(await remote.callApi(apiRoute('taskCreate'), {
      case_id: caseId,
      session_id: sessionId,
      entry: null,
      skill: TASK_SKILL,
      inputs: [],
      params: defaults,
    }), 'taskCreate')
    report.taskSelectionId = asString(selected.task_id, 'task selection id')

    const submission = browser.beginSubmission({
      mode: 'queue',
      text: USER_PROMPT,
      attachments: [],
    })
    const requestId = String(submission.requestId)
    if (!UUID_V4.test(requestId)) throw new Error('BrowserSession did not mint a UUID R')
    report.requestId = requestId
    apiOk(await remote.callApi(apiRoute('requestScope'), {
      action: 'prepare',
      case_id: caseId,
      session_id: sessionId,
      request_id: requestId,
      material_ids: materialIds,
    }), 'requestScope prepare')

    const beforeSeq = Number(nativeSession.seq)
    await withWatchdog(production.commands.prompt({
      sessionId: nativeSession.id,
      requestId: submission.requestId,
      mode: 'queue',
      content: [{ type: 'text', text: USER_PROMPT }],
    }))
    await withWatchdog(agent.whenIdle())
    agentJoined = true
    const afterSeq = Number(nativeSession.seq)
    if (afterSeq <= beforeSeq) throw new Error('native turn appended no events')
    const turnEvents = nativeSession.snapshotEvents(
      production.SessionLogOffset(beforeSeq),
      production.SessionLogOffset(afterSeq),
    ) as readonly NativeEvent[]
    const header = requestHeaderAtBoundary(
      nativeSession,
      production.SessionLogOffset,
      beforeSeq,
      afterSeq,
      turnEvents,
    )
    const types = turnEvents.map(event => event.type)
    for (const required of ['turn/start', 'user/message', 'assistant/message', 'turn/end']) {
      if (!types.includes(required)) throw new Error(`native turn lacks ${required}`)
    }
    const userMessage = turnEvents.findLast(event => requestIdFromEvent(event) === requestId)
    if (userMessage === undefined) throw new Error('native turn does not carry the actual BrowserSession R')
    const end = asRecord(turnEvents.findLast(event => event.type === 'turn/end')!.data)
    if (asRecord(end.reason).kind !== 'completed') {
      throw new Error(`native turn ended with ${String(asRecord(end.reason).kind)}`)
    }
    const responseText = assistantText(turnEvents.findLast(event => event.type === 'assistant/message')!)
    if (responseText.trim().length === 0) throw new Error('native turn produced no assistant text')
    const headerConfig = asRecord(asRecord(asRecord(header.data).header).config)
    if (
      headerConfig.provider !== PROVIDER
      || headerConfig.model !== MODEL
      || headerConfig.maxTokens !== defaults.max_tokens
    ) {
      throw new Error('request/header does not carry the production LegalAgent route and task max tokens')
    }
    liveEvents = nativeSession.snapshotEvents() as readonly NativeEvent[]
    const toolCalls = toolCallsFromEvents(turnEvents)
    report.toolCalls = toolCalls
    const toolNames = toolCalls.map(call => call.name)
    for (const requiredTool of ['skill', 'ask_user_question', 'case_list_materials', 'case_read_material', 'case_save_draft']) {
      if (!toolNames.includes(requiredTool)) throw new Error(`actual tool loop lacks ${requiredTool}`)
    }
    if (!turnEvents.some(event => skillNameFromCall(event) === TASK_SKILL)) {
      throw new Error('the skill tool did not load case-reading-notes from the production provider')
    }
    if (question.value === null) throw new Error('the Skill workflow did not receive its synthetic scope confirmation')
    report.question = question.value
    report.turn = {
      sessionId,
      requestId,
      beforeSeq,
      afterSeq,
      responseTextSha256: sha256Bytes(responseText),
      responseTextLength: responseText.length,
      requestHeader: header.data,
      requestHeaderAnchor: header.anchor,
      eventTypes: types,
    }

    const completedTask = await withWatchdog((async () => {
      for (;;) {
        const taskList = apiOk(await remote.callApi(apiRoute('tasksList'), { case_id: caseId }), 'tasksList')
        const candidates = asArray(taskList.tasks).map(asRecord).filter(task => task.skill === TASK_SKILL)
        if (candidates.length > 1) throw new Error('more than one executed case-reading-notes task exists')
        const candidate = candidates[0]
        if (candidate !== undefined && candidate.status !== 'running') return candidate
        await new Promise(done => setTimeout(done, 100))
      }
    })())
    if (completedTask === undefined) throw new Error('case-reading-notes task did not reach a terminal state')
    const taskId = asString(completedTask.task_id, 'task_id')
    report.taskId = taskId
    if (!TASK_ID.test(taskId)) throw new Error(`invalid task id ${taskId}`)
    if (completedTask.status !== 'completed') throw new Error(`task ended ${String(completedTask.status)}`)

    const taskDir = join(caseRoot, '工作区', '任务', taskId)
    const taskFile = join(taskDir, 'task.json')
    const resultFile = join(taskDir, 'result.json')
    const readsFile = join(taskDir, 'reads.json')
    await ordinaryFile(taskFile)
    await ordinaryFile(resultFile)
    await ordinaryFile(readsFile)
    const taskData = asRecord(JSON.parse(await readFile(taskFile, 'utf8')))
    const result = asRecord(JSON.parse(await readFile(resultFile, 'utf8')))
    const reads = asRecord(JSON.parse(await readFile(readsFile, 'utf8')))
    if (taskData.state !== 'finished' || taskData.skill !== TASK_SKILL) {
      throw new Error('persisted task is not a finished case-reading-notes task')
    }
    if (result.status !== 'completed') throw new Error(`persisted result is ${String(result.status)}`)
    assertCoverage(result.coverage)
    const readRows = asArray(reads.reads).map(asRecord)
    const readMaterialIds = new Set(readRows.map(row => asString(row.material_id, 'read material_id')))
    if (
      JSON.stringify([...readMaterialIds].sort()) !== JSON.stringify([...materialIds].sort())
      || readRows.length === 0
    ) {
      throw new Error('actual reads.json does not cover every scoped material')
    }
    for (const row of readRows) {
      const materialId = asString(row.material_id, 'read material_id')
      const from = asInteger(row.from, 'read from')
      const to = asInteger(row.to, 'read to')
      if (
        row.material_version !== materialShaById.get(materialId)
        || from < 1
        || to < from
        || !['page', 'para', 'line', 'cell'].includes(asString(row.unit, 'read unit'))
      ) {
        throw new Error(`actual read range is invalid for ${materialId}`)
      }
    }
    const citationCheck = asRecord(result.citation_check)
    if (citationCheck.passed !== true) throw new Error('case_save_draft citation check did not pass')
    const citations = asArray(result.citations).map(asRecord)
    if (citations.length === 0) throw new Error('saved draft has no parsed citations')
    const drafts = asArray(result.drafts).map(asRecord)
    if (drafts.length === 0) throw new Error('completed task has no saved Markdown draft')
    const latestDraft = drafts.at(-1)!
    const draftRel = asString(latestDraft.path, 'draft path')
    if (!draftRel.endsWith('.md')) throw new Error('saved draft is not Markdown')
    const draftPath = resolve(caseRoot, ...draftRel.split('/'))
    const draftRelative = relative(resolve(caseRoot), draftPath)
    if (draftRelative.startsWith('..') || isAbsolute(draftRelative)) {
      throw new Error('draft path escapes the case')
    }
    const draftBytes = await readFile(draftPath)
    const draftText = draftBytes.toString('utf8')
    if (draftText.trim().length === 0) throw new Error('saved Markdown draft is empty')
    assertBusinessContent(draftText, citations)
    report.draft = {
      title: asString(latestDraft.title, 'draft title'),
      path: draftRel,
      version: asInteger(latestDraft.version, 'draft version'),
      bytes: draftBytes.byteLength,
      sha256: sha256Bytes(draftBytes),
      textLength: draftText.length,
    }

    const sourceResponses: SourceResponseRecord[] = []
    const seen = new Set<string>()
    for (const citation of citations) {
      const loc = asRecord(citation.loc)
      const name = asString(citation.name, 'citation name')
      const materialId = asString(citation.material_id, 'citation material_id')
      const citationText = citationTextFor(name, loc)
      const key = `${materialId}\u0000${JSON.stringify(loc)}`
      if (seen.has(key)) continue
      seen.add(key)
      const source = apiOk(await remote.callApi(apiRoute('source'), {
        case_id: caseId,
        material_id: materialId,
        citation: citationText,
        task_id: taskId,
      }), `source ${citationText}`)
      if (
        source.name !== name
        || source.source_changed !== false
        || (source.original_status !== undefined && source.original_status !== 'ok')
        || asString(source.text, 'source text').trim().length === 0
      ) {
        throw new Error(`citation did not resolve to unchanged source text: ${citationText}`)
      }
      const text = asString(source.text, 'source text')
      sourceResponses.push({
        name,
        loc,
        citation: citationText,
        text,
        textSha256: sha256Bytes(text),
        sourceChanged: false,
        originalStatus: source.original_status === undefined ? undefined : String(source.original_status),
      })
    }
    report.taskState = taskData
    report.taskResult = result
    report.coverage = result.coverage
    report.readRanges = reads.reads
    report.citationResponses = sourceResponses

    const stopped = await service.stop()
    bStopped = true
    report.bService = {
      ready: service.ready,
      final: stopped.final,
      exitCode: stopped.code,
      forcedStop: stopped.forced,
    }
    if (stopped.code !== 0 || stopped.final.passed !== true) {
      throw new Error('finite B service did not stop cleanly')
    }

    await browser.dispose()
    browserDisposed = true
    await production.live.fiber.dispose()
    contextDisposed = true
    const reopened = await production.reopenPersistedEvents(sessionId)
    const equal = JSON.stringify(reopened) === JSON.stringify(liveEvents)
    if (!equal) throw new Error('reopened JSONL events differ from live native Session events')

    const sessionRoot = join(production.persistenceRoot)
    const allSessionFiles: string[] = []
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isSymbolicLink()) throw new Error('session persistence contains a reparse entry')
        if (entry.isDirectory()) await walk(path)
        else if (entry.isFile() && entry.name === 'session.v4.jsonl') allSessionFiles.push(path)
      }
    }
    await walk(sessionRoot)
    const matches = allSessionFiles.filter(path => path.includes(sessionId))
    if (matches.length !== 1) throw new Error(`expected one physical JSONL for ${sessionId}, found ${String(matches.length)}`)
    const jsonlPath = matches[0]!
    const jsonlBytes = await readFile(jsonlPath)
    const lines = jsonlBytes.toString('utf8').trim().split(/\r?\n/).filter(Boolean)
    report.persistence = {
      root: production.persistenceRoot,
      sessionReopened: reopened.length > 0,
      liveEqualsReopened: equal,
      physicalJsonlPath: jsonlPath,
      physicalJsonlBytes: jsonlBytes.byteLength,
      physicalJsonlSha256: sha256Bytes(jsonlBytes),
      physicalEventCount: Math.max(0, lines.length - 1),
    }

    const finalAdmission = await verifyFixedInputs()
    report.admission.final = finalAdmission.admission
    report.modelPosts.observations = network.filter(item => item.kind === 'model')
    report.modelPosts.attempts = report.modelPosts.observations.filter(item => item.method === 'POST').length
    report.modelPosts.http200 = report.modelPosts.observations.filter(item => item.method === 'POST' && item.status === 200).length
    report.networkSummary = summarizeNetwork(network, fetchGate.deniedAttempts)
    if (
      report.networkSummary.deniedAttempts !== 0
      || report.networkSummary.modelPostHttp200 === 0
      || blocked.size !== 0
      || secret.length === 0
      || JSON.stringify(report).includes(secret)
    ) {
      throw new Error('network, blocked-turn, or credential invariants failed')
    }
    report.status = 'PASS'
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  } finally {
    if (production !== undefined && sessionId !== '') {
      try {
        if (agent?.status === 'running') {
          production.commands.cancel({ sessionId })
        }
        if (agent !== undefined) await withWatchdog(agent.whenIdle())
        agentJoined = true
      } catch (error: unknown) {
        cleanupFailures.push(`agent cancel/join failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
    }
    if (!bStopped && service !== undefined) {
      try {
        const stopped = await service.stop()
        bStopped = true
        report.bService = {
          ready: service.ready,
          final: stopped.final,
          exitCode: stopped.code,
          forcedStop: stopped.forced,
        }
        if (stopped.code !== 0 || stopped.final.passed !== true) {
          cleanupFailures.push('B HTTP service did not stop cleanly')
        }
      } catch (error: unknown) {
        service.forceStop()
        cleanupFailures.push(`B HTTP service stop failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
    }
    if (!browserDisposed && browser !== undefined) {
      try {
        await browser.dispose()
        browserDisposed = true
      } catch (error: unknown) {
        cleanupFailures.push(`browser Session dispose failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
    }
    if (!contextDisposed && production !== undefined) {
      try {
        await production.live.fiber.dispose()
        contextDisposed = true
      } catch (error: unknown) {
        cleanupFailures.push(`Context dispose failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
    }
    try {
      fetchLease.restore()
    } catch (error: unknown) {
      cleanupFailures.push(`fetch restore failed: ${error instanceof Error ? error.name : 'unknown'}`)
    }
    try {
      environment.restore()
      environmentRestored = true
    } catch (error: unknown) {
      cleanupFailures.push(`environment restore failed: ${error instanceof Error ? error.name : 'unknown'}`)
    }
    if (secretReader !== undefined) {
      try {
        secretReader.restore()
      } catch (error: unknown) {
        cleanupFailures.push(`stdin restore failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
    }
  }

  report.modelPosts.observations = network.filter(item => item.kind === 'model')
  report.modelPosts.attempts = report.modelPosts.observations.filter(item => item.method === 'POST').length
  report.modelPosts.http200 = report.modelPosts.observations.filter(item => item.method === 'POST' && item.status === 200).length
  report.networkSummary = summarizeNetwork(network, fetchLease.deniedAttempts())
  report.cleanup.agentCancelledOrIdle = agentJoined
  report.cleanup.browserDisposed = browserDisposed
  report.cleanup.contextDisposed = contextDisposed
  report.cleanup.bServiceStopped = bStopped
  report.cleanup.fetchRestored = fetchLease.isRestored()
  report.cleanup.environmentRestored = environmentRestored
  if (cleanupFailures.length > 0) {
    report.status = 'FAILED'
    report.error = { message: 'cleanup failed', failures: [...cleanupFailures] }
  }
  try {
    report.admission.final = (await verifyFixedInputs()).admission
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  }
  const sanitized = redactUnknown(report, secret) as RunReport
  if (secret.length > 0 && JSON.stringify(sanitized).includes(secret)) {
    throw new Error('credential redaction failed before report write')
  }
  const keyCleared = outputRedaction?.clearSecret() ?? secret.length === 0
  secret = ''
  sanitized.cleanup.keyCleared = keyCleared
  try {
    outputRedaction?.restore()
  } catch {
    sanitized.status = 'FAILED'
    sanitized.error = { message: 'output redaction restore failed' }
  }
  sanitized.cleanup.outputRedactionRestored = outputRedaction?.isRestored() ?? true
  if (!keyCleared || !sanitized.cleanup.outputRedactionRestored) {
    sanitized.status = 'FAILED'
    sanitized.error = { message: 'credential cleanup did not complete' }
  }
  sanitized.finishedAtUtc = utcNow()
  const reportPath = join(runRoot, 'report.json')
  await writeFile(reportPath, `${JSON.stringify(sanitized, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  process.stdout.write(`${JSON.stringify({
    status: sanitized.status,
    report: reportPath,
    nativeSessionId: sanitized.nativeSessionId,
    requestId: sanitized.requestId,
    taskId: sanitized.taskId,
    modelPostAttempts: sanitized.networkSummary.modelPostAttempts,
    modelPostHttp200: sanitized.networkSummary.modelPostHttp200,
    draft: sanitized.draft,
    coverage: sanitized.coverage,
  }, null, 2)}\n`)
  if (sanitized.status !== 'PASS') process.exitCode = 1
}

await main()
