/**
 * Finite T18 consumer: one synthetic two-material contract-review request
 * through the current native Session, AgentLoop, LegalAgent/CoreClient, skill
 * provider, current B HTTP app, real tools, and the real redline API. It
 * produces a model-authored review draft/edit list and a production-generated
 * OOXML revision artifact without touching the source DOCX.
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
import { inflateRawSync } from 'node:zlib'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_ROOT = 'D:/Lawbeach/lawbench-B'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'fixed-inputs.json')
const FIXED_INPUTS_FORMAT = 'lawbench-t18-native-contract-fixed-inputs-v1'
const FIXED_INPUTS_SHA256 = '13b6c8333dbf6f3fef9fbb0d9e7761449b6fab7bb0ca127950f59b3480e15b01'
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

const MATERIAL_NAMES = ['采购合同', '采购部内部意见'] as const
const LAWYER_REQUEST =
  '帮我审一下这份钢材采购合同。我们代表青禾建材，就是甲方采购方。这是签约前把关，审完顺便出个修订版，我要直接发给对方。采购部的内部意见也放在材料里了，你参考一下。'
const USER_PROMPT = `${LAWYER_REQUEST}

这是纯合成测试，不对应任何真实案件、真实当事人或真实交易。本次范围仅限以下两份已导入的虚构材料：采购合同、采购部内部意见。请全部读完，按当前合同审查 Skill 完成审查，保存审查意见和修改清单，并生成修订版 Word。不要向外部发送材料。`
const PARTY_ANSWER = '确认：我方为甲方青禾建材，即采购方。'
const PURPOSE_ANSWER = '确认：本次是签约前把关，并需要生成修订版。'
const FOCUS_ANSWER =
  '特别关注交付与分批到货、验收安排、质量保证金留存、逾期解除；允许直接修改合同条款。'
const TASK_SKILL = 'contract-review'
const TASK_MAX_TOKENS = 32_768

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
  readonly mtime_ns?: string
}

interface FixedInputManifest {
  readonly format: typeof FIXED_INPUTS_FORMAT
  readonly task: 'A-T18-native-contract-workflow-20261028-163202'
  readonly hashAlgorithm: 'sha256'
  readonly sourceResourcePins: {
    readonly path: string
    readonly bytes: number
    readonly sha256: string
  }
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
  readonly fixtureCount: number
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
  readonly rolesByQuestion: readonly (readonly ('our_party' | 'purpose' | 'focus')[])[]
  readonly answerIds: readonly string[]
  readonly answerText: string
}

interface QuestionOrderRecord {
  readonly answerCallId: string
  readonly answerCallSeq: number
  readonly answerResultSeq: number
  readonly draftCallId: string
  readonly draftCallSeq: number
  readonly draftResultSeq: number
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

interface EditRecord {
  readonly id: number
  readonly para: number
  readonly action: 'replace' | 'insert_after' | 'delete'
  readonly find: string
  readonly text?: string
  readonly comment: string
}

interface ManualEditRecord {
  readonly id: number
  readonly reason: string
}

interface MaterialReadRecord {
  readonly materialId: string
  readonly name: string
  readonly type: string
  readonly unit: string
  readonly unitCount: number
  readonly originalPath: string
  readonly originalBytes: number
  readonly originalSha256: string
  readonly sourceBytes: number
  readonly sourceSha256: string
  readonly sourceMtimeNs: string
}

interface RunReport {
  format: 'lawbench-t18-native-contract-workflow-v1'
  task: 'A-T18-native-contract-workflow-20261028-163202'
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
    readonly noExternalSendInstruction: true
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
  taskParams?: Record<string, unknown>
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
  questionOrder?: QuestionOrderRecord
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
  editList?: {
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly edits: readonly EditRecord[]
    readonly accepted: number
    readonly outOfScope: readonly ManualEditRecord[]
  }
  redline?: {
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly applied: number
    readonly manual: readonly ManualEditRecord[]
    readonly trackChanges: {
      readonly insertions: number
      readonly deletions: number
      readonly comments: number
      readonly expectedInsertions: number
      readonly expectedDeletions: number
    }
    readonly sourceDocx: {
      readonly path: string
      readonly bytes: number
      readonly sha256: string
      readonly mtimeNs: string
      readonly unchanged: boolean
    }
    readonly structure: {
      readonly sourceTables: number
      readonly revisedTables: number
      readonly sourceHyperlinks: number
      readonly revisedHyperlinks: number
      readonly externalRelationshipPreserved: boolean
    }
  }
  materialReads?: readonly MaterialReadRecord[]
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
    actualModelReviewAndEditList: boolean
    productionRedlineArtifact: boolean
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

async function ordinaryFileIdentity(
  path: string,
  expectedBytes: number,
  expectedSha: string,
  expectedMtimeNs: string,
): Promise<{ readonly bytes: number; readonly sha256: string; readonly mtimeNs: string }> {
  const info = await lstat(path, { bigint: true })
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`input is not an ordinary file: ${path}`)
  const bytes = Number(info.size)
  const mtimeNs = info.mtimeNs.toString()
  if (bytes !== expectedBytes) throw new Error(`input byte count changed: ${path}`)
  if (mtimeNs !== expectedMtimeNs) throw new Error(`input mtime_ns changed: ${path}`)
  const actualSha = await sha256File(path)
  if (actualSha !== expectedSha) throw new Error(`input SHA-256 changed: ${path}`)
  return { bytes, sha256: actualSha, mtimeNs }
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
    || manifest.task !== 'A-T18-native-contract-workflow-20261028-163202'
    || manifest.hashAlgorithm !== 'sha256'
    || manifest.fixtures.length !== 2
    || JSON.stringify(manifest.fixtures.map(entry => entry.id).sort())
      !== JSON.stringify([...MATERIAL_NAMES].sort())
    || manifest.fixtures.some(entry => (
      entry.path.includes('_任务说明')
      || entry.path.includes('要点.md')
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes <= 0
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
      || !/^[0-9]+$/.test(entry.mtime_ns ?? '')
    ))
    || !manifest.dependencies.some(entry => entry.role === 'task-notes')
    || !manifest.dependencies.some(entry => entry.role === 'judging-notes')
  ) {
    throw new Error('fixed-inputs manifest header is invalid')
  }

  for (const entry of manifest.fixtures) {
    const identity = await ordinaryFileIdentity(
      entry.path,
      entry.bytes,
      entry.sha256,
      asString(entry.mtime_ns, 'fixture mtime_ns'),
    )
    if (identity.bytes !== entry.bytes || identity.sha256 !== entry.sha256) {
      throw new Error(`fixture identity mismatch: ${entry.id ?? entry.path}`)
    }
  }
  for (const entry of [...manifest.dependencies,
    ...manifest.runtimeExecutables, ...manifest.acceptedEvidence, manifest.bServiceEntry]) {
    await ordinaryFile(entry.path, entry.bytes, entry.sha256)
  }
  await ordinaryFile(
    manifest.sourceResourcePins.path,
    manifest.sourceResourcePins.bytes,
    manifest.sourceResourcePins.sha256,
  )

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
    ['GET', new Set(['/health', '/api/settings'])],
    ['POST', new Set([
      '/api/redline',
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
          || ready.fixtureCount !== 2
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
    ToolSkillModule, UserQuestionsModule, AskUserModule, RepeatToolReminderModule,
    ExtAgentModule, ExtHostModule] =
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
      import(modulePath('packages/guard/repeat-tool-reminder/src/index.ts')),
      import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/DraftFeedbackPrivateBuild-20261028-214724/private-output-20261028-220815/profile-node_modules/lawbench-dsh/lib/agent.js'),
      import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/DraftFeedbackPrivateBuild-20261028-214724/private-output-20261028-220815/profile-node_modules/lawbench-dsh/lib/host.js'),
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
          maxTokens: TASK_MAX_TOKENS,
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
        defaultMaxTokens: TASK_MAX_TOKENS,
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
    skillQuestions: (skillName: string) => remote.skillQuestions(skillName),
    state: () => 'running',
    onState: (callback: (state: string) => void) => { callback('running'); return () => {} },
  }))
  applyLegalAgent(live, { appData, validateContracts: true })
  await live.plugin(RepeatToolReminderModule, {
    thresholds: [3, 5, 8],
    include: [],
    exclude: [],
    argumentsPreviewChars: 500,
  })

  live.on('user-questions/request', (async (request: unknown, next: () => Promise<unknown>) => {
    if (question.value !== null) throw new Error('the synthetic lawyer was asked a second time')
    const body = asRecord(request)
    const questions = asArray(body.questions).map(asRecord)
    if (questions.length === 0) throw new Error('the model emitted an empty question request')
    const ids = questions.map((item, index) => asString(item.id, `question ${index + 1} id`))
    if (ids.some(id => id.length === 0) || new Set(ids).size !== ids.length) {
      throw new Error('the model emitted malformed or duplicate question ids')
    }
    const options = questions.flatMap(item => asArray(item.options ?? []).map(asRecord))
    const optionLabels = options.map((option, index) => asString(option.label, `option ${index + 1} label`))
    const rolesByQuestion = questions.map((item, index) => {
      const ownOptions = asArray(item.options ?? []).map(asRecord)
      const text = [
        ...(item.header === undefined ? [] : [asString(item.header, 'question header')]),
        asString(item.question, 'question text'),
        ...ownOptions.map((option, optionIndex) => asString(
          option.label,
          `question ${index + 1} option ${optionIndex + 1} label`,
        )),
        ...ownOptions.flatMap(option => (
          option.description === undefined ? [] : [asString(option.description, 'option description')]
        )),
      ].join('\n')
      const roles = questionRoles(text)
      if (roles.length === 0) throw new Error(`question ${index + 1} is outside the synthetic contract-review scope`)
      return roles
    })
    const askedRoles = new Set(rolesByQuestion.flat())
    for (const required of ['our_party', 'purpose', 'focus'] as const) {
      if (!askedRoles.has(required)) throw new Error(`the contract-review question is missing ${required}`)
    }
    const answers = ids.map((id, index) => ({
      id,
      selected: [],
      custom: answerTextForRoles(rolesByQuestion[index]!),
    }))
    question.value = {
      questionIds: ids,
      questionText: questions.map(item => asString(item.question, 'question text')).join('\n'),
      optionLabels,
      rolesByQuestion,
      answerIds: ids,
      answerText: answers.map(answer => answer.custom).join('\n'),
    }
    void next
    return { answers }
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
    redline: { method: 'redline', http: 'POST', path: '/api/redline', contract: 'redline' },
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

type QuestionRole = 'our_party' | 'purpose' | 'focus'

function questionRoles(text: string): QuestionRole[] {
  const roles: QuestionRole[] = []
  if (/(我方立场|哪一方|代表.*方|甲方|乙方|采购方|供应方)/.test(text)) roles.push('our_party')
  if (/(审查目的|签约前|修改对方|谈判准备|审查用途)/.test(text)) roles.push('purpose')
  if (/(特别关注|关注点|关注条款|可改动|修改程度|直接.*改|聚焦)/.test(text)) roles.push('focus')
  return roles
}

function answerTextForRoles(roles: readonly QuestionRole[]): string {
  return roles.map(role => {
    if (role === 'our_party') return PARTY_ANSWER
    if (role === 'purpose') return PURPOSE_ANSWER
    return FOCUS_ANSWER
  }).join('\n')
}

function toolArguments(event: NativeEvent): Record<string, unknown> {
  if (event.type !== 'tool/call') throw new Error('expected a tool call event')
  const data = asRecord(event.data)
  if (typeof data.arguments === 'string') {
    return asRecord(JSON.parse(data.arguments))
  }
  return asRecord(data.arguments)
}

function toolResultValue(events: readonly NativeEvent[], callId: string): Record<string, unknown> {
  const result = events.find(event => {
    if (event.type !== 'tool/result') return false
    const source = asRecord(asRecord(event.data).message).source
    return source !== null
      && typeof source === 'object'
      && asRecord(source).callId === callId
  })
  if (result === undefined) throw new Error(`tool result is missing for ${callId}`)
  const message = asRecord(asRecord(result.data).message)
  if (message.isError === true) throw new Error(`tool failed for ${callId}`)
  const text = asArray(message.content)
    .flatMap(part => {
      const row = asRecord(part)
      return row.type === 'text' && typeof row.text === 'string' ? [row.text] : []
    })
    .join('')
  return asRecord(JSON.parse(text))
}

function validateEditItem(raw: unknown, index: number): EditRecord {
  const item = asRecord(raw)
  const keys = Object.keys(item).sort().join(',')
  if (!['action,comment,find,id,para', 'action,comment,find,id,para,text'].includes(keys)) {
    throw new Error(`edit ${index + 1} has fields outside the six-field contract`)
  }
  const id = asInteger(item.id, `edit ${index + 1} id`)
  const para = asInteger(item.para, `edit ${index + 1} para`)
  const action = asString(item.action, `edit ${index + 1} action`)
  if (!['replace', 'insert_after', 'delete'].includes(action)) {
    throw new Error(`edit ${index + 1} action is invalid`)
  }
  if (id !== index + 1 || para < 1) throw new Error(`edit ${index + 1} id/para is invalid`)
  const find = asString(item.find, `edit ${index + 1} find`)
  const comment = asString(item.comment, `edit ${index + 1} comment`)
  if (find.length === 0 || comment.length === 0) throw new Error(`edit ${index + 1} is empty`)
  if (action === 'delete') {
    if (item.text !== undefined) throw new Error(`delete edit ${index + 1} must not contain text`)
    return { id, para, action, find, comment }
  }
  const text = asString(item.text, `edit ${index + 1} text`)
  if (text.length === 0) throw new Error(`edit ${index + 1} text is empty`)
  return { id, para, action, find, text, comment }
}

function readZipEntry(data: Buffer, target: string): Buffer {
  if (data.length < 22 || data.length > 64 * 1024 * 1024) throw new Error('DOCX size is outside the fixed bounds')
  let eocd = -1
  const floor = Math.max(0, data.length - 65_557)
  for (let index = data.length - 22; index >= floor; index -= 1) {
    if (data.readUInt32LE(index) === 0x06054b50) {
      eocd = index
      break
    }
  }
  if (eocd < 0) throw new Error('DOCX end-of-central-directory is absent')
  const entries = data.readUInt16LE(eocd + 10)
  const directorySize = data.readUInt32LE(eocd + 12)
  const directoryOffset = data.readUInt32LE(eocd + 16)
  if (
    entries === 0
    || entries > 10_000
    || directoryOffset + directorySize > data.length
  ) {
    throw new Error('DOCX central directory is invalid')
  }
  let cursor = directoryOffset
  for (let index = 0; index < entries; index += 1) {
    if (cursor + 46 > data.length || data.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('DOCX central directory entry is invalid')
    }
    const method = data.readUInt16LE(cursor + 10)
    const compressedSize = data.readUInt32LE(cursor + 20)
    const uncompressedSize = data.readUInt32LE(cursor + 24)
    const nameLength = data.readUInt16LE(cursor + 28)
    const extraLength = data.readUInt16LE(cursor + 30)
    const commentLength = data.readUInt16LE(cursor + 32)
    const localOffset = data.readUInt32LE(cursor + 42)
    const nameStart = cursor + 46
    const nameEnd = nameStart + nameLength
    if (nameEnd > data.length) throw new Error('DOCX entry name overflows')
    const name = data.subarray(nameStart, nameEnd).toString('utf8')
    cursor = nameEnd + extraLength + commentLength
    if (name !== target) continue
    if (
      localOffset + 30 > data.length
      || data.readUInt32LE(localOffset) !== 0x04034b50
      || uncompressedSize > 32 * 1024 * 1024
    ) {
      throw new Error('DOCX target entry header is invalid')
    }
    const localNameLength = data.readUInt16LE(localOffset + 26)
    const localExtraLength = data.readUInt16LE(localOffset + 28)
    const payloadStart = localOffset + 30 + localNameLength + localExtraLength
    const payloadEnd = payloadStart + compressedSize
    if (payloadEnd > data.length) throw new Error('DOCX target entry data overflows')
    const payload = data.subarray(payloadStart, payloadEnd)
    if (method === 0) return Buffer.from(payload)
    if (method === 8) return inflateRawSync(payload, { maxOutputLength: 32 * 1024 * 1024 })
    throw new Error(`DOCX target entry uses unsupported compression ${String(method)}`)
  }
  throw new Error(`DOCX target entry is absent: ${target}`)
}

function zipXml(data: Buffer, name: string): string {
  return readZipEntry(data, name).toString('utf8')
}

function countXml(xml: string, tag: string): number {
  return [...xml.matchAll(new RegExp(`<w:${tag}(?:\\s|>)`, 'g'))].length
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
  if (coverage.total !== 2) throw new Error('task coverage total is not two')
  const fullyRead = asArray(coverage.fully_read).map((name, index) => asString(name, `fully_read ${index + 1}`))
  const expected = [...MATERIAL_NAMES].sort()
  if (JSON.stringify([...fullyRead].sort()) !== JSON.stringify(expected)) {
    throw new Error(`coverage not both materials: ${JSON.stringify({ fullyRead, ...coverage })}`)
  }
  if (asArray(coverage.partially_read).length || asArray(coverage.not_read).length || asArray(coverage.unreadable).length) {
    throw new Error('coverage still contains partial, unread, or unreadable materials')
  }
}

function assertContractReviewContent(content: string, citations: readonly Record<string, unknown>[]): void {
  if (!/风险\s*[0-9一二三四五六七八九十]/.test(content)) throw new Error('saved review has no numbered risk section')
  if (!/(?:P0|P1|P2)/.test(content)) throw new Error('saved review has no P0/P1/P2 risk level')
  if (!content.includes('法律依据待律师核实')) throw new Error('saved review omits the legal-basis verification marker')
  if (!/(处理方式|修改建议|推荐措辞)/.test(content)) throw new Error('saved review lacks executable edit guidance')
  const names = new Set(citations.map(item => asString(item.name, 'citation name')))
  for (const name of MATERIAL_NAMES) {
    if (!names.has(name)) throw new Error(`saved draft lacks a citation to ${name}`)
    if (!content.includes(`〔${name} `)) {
      throw new Error(`latest saved draft does not cite ${name} inline`)
    }
  }
}

function assertOutOfScopeReported(
  content: string,
  items: readonly ManualEditRecord[],
  edits: readonly EditRecord[],
): void {
  const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim()
  const compact = (value: string): string => value.replace(/\s+/g, '')
  const headings = [...content.matchAll(/^###[ \t]+([^\r\n]*)$/gm)]
  const riskBlocks = new Map<number, string>()
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]!
    const match = /^风险\s*([0-9]+)(?:【|$)/.exec(normalize(heading[1]!))
    if (match === null) continue
    const risk = Number(match[1])
    if (riskBlocks.has(risk)) throw new Error(`saved review has duplicate risk ${String(risk)}`)
    const start = (heading.index ?? 0) + heading[0].length
    const end = index + 1 < headings.length ? (headings[index + 1]!.index ?? content.length) : content.length
    riskBlocks.set(risk, content.slice(start, end))
  }

  const editsById = new Map<number, EditRecord>()
  for (const edit of edits) {
    if (!Number.isInteger(edit.id) || edit.id < 1 || editsById.has(edit.id)) {
      throw new Error(`saved review has missing or duplicate edit id ${String(edit.id)}`)
    }
    editsById.set(edit.id, edit)
  }

  const itemIds = new Set<number>()
  for (const item of items) {
    if (!Number.isInteger(item.id) || item.id < 1 || itemIds.has(item.id)) {
      throw new Error(`saved review has missing or duplicate out-of-scope id ${String(item.id)}`)
    }
    itemIds.add(item.id)
    const edit = editsById.get(item.id)
    if (edit === undefined) {
      throw new Error(`saved review is missing actual edit ${String(item.id)}`)
    }
    const riskMarkers = [...edit.comment.matchAll(/风险\s*([0-9]+)/g)]
    if (riskMarkers.length !== 1) {
      throw new Error(`edit ${String(item.id)} has a missing or ambiguous risk in its comment`)
    }
    const risk = Number(riskMarkers[0]![1])
    const block = riskBlocks.get(risk)
    if (block === undefined) {
      throw new Error(`out-of-scope edit ${String(item.id)} has no matching risk ${String(risk)}`)
    }
    if (!Number.isInteger(edit.para) || edit.para < 1) {
      throw new Error(`out-of-scope edit ${String(item.id)} has an invalid paragraph`)
    }
    const paragraphCites = [...block.matchAll(/第\s*([0-9]+)(?:\s*[-—–]\s*([0-9]+))?\s*段/g)]
    const paragraphBound = paragraphCites.some(cite => {
      const from = Number(cite[1])
      const to = Number(cite[2] ?? cite[1])
      return edit.para >= Math.min(from, to) && edit.para <= Math.max(from, to)
    })
    if (!paragraphBound) {
      throw new Error(`out-of-scope edit ${String(item.id)} is not bound to risk ${String(risk)} paragraph ${String(edit.para)}`)
    }
    const handling = [...block.matchAll(/^[ \t]*(?:[-*][ \t]+)?处理方式[ \t]*[：:][ \t]*([^\r\n]*)$/gm)]
    if (handling.length !== 1) {
      throw new Error(`out-of-scope edit ${String(item.id)} has a missing or ambiguous handling method`)
    }
    const stated = /^该条需人工修改[（(](.+)[）)]$/.exec(normalize(handling[0]![1]!))
    if (stated === null) {
      throw new Error(`out-of-scope edit ${String(item.id)} is not marked for manual revision`)
    }
    const actualReason = item.reason.trim()
    const statedReason = stated[1]!.trim()
    if (actualReason.length === 0) {
      throw new Error(`out-of-scope edit ${String(item.id)} has no specific reason`)
    }
    const crossBoundaryReasonClause = /^(?:find跨越域代码或超链接|find跨越超链接|域代码|(?:find|原文|匹配文本)(?:中|内)?(?:包含|跨越)(?:超链接|域代码|超链接域代码|域代码超链接|域代码或超链接|超链接或域代码))(?:[，,；;](?:(?:系统(?:修改清单)?(?:未收下|未接受))|系统无法自动替换|系统不能自动替换|未能应用|应用未成功|系统未纳入修改清单))?$/
    const actualCrossBoundaryReason = compact(actualReason) === compact('find 跨越域代码或超链接')
    const reasonMatches = actualCrossBoundaryReason
      ? crossBoundaryReasonClause.exec(compact(statedReason)) !== null
      : normalize(statedReason) === normalize(actualReason)
    if (!reasonMatches) {
      throw new Error(`out-of-scope edit ${String(item.id)} does not state its actual reason`)
    }
  }
}

function observeQuestionBeforeFirstDraft(
  events: readonly NativeEvent[],
  question: QuestionRecord,
): QuestionOrderRecord {
  const expectedRoles = ['our_party', 'purpose', 'focus'] as const
  const knownMandatoryQuestionRejection =
    'Error: 提交成果前必须先取得律师对必问问题的真实回答。还缺：our_party、purpose、focus'
  if (
    question.questionIds.length === 0
    || question.questionIds.length !== question.answerIds.length
    || question.questionIds.length !== question.rolesByQuestion.length
    || question.answerText.trim().length === 0
  ) {
    throw new Error('the recorded lawyer question is incomplete')
  }
  const questionIds = new Set<string>()
  for (let index = 0; index < question.questionIds.length; index += 1) {
    const questionId = question.questionIds[index]!
    const answerId = question.answerIds[index]!
    if (
      typeof questionId !== 'string'
      || questionId.length === 0
      || questionIds.has(questionId)
      || answerId !== questionId
    ) {
      throw new Error('the recorded lawyer question IDs are missing, duplicated, or inconsistent')
    }
    questionIds.add(questionId)
  }
  const coveredRoles = new Set<string>()
  for (const roles of question.rolesByQuestion) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('the recorded lawyer question has no required role')
    }
    for (const role of roles) {
      if (!expectedRoles.includes(role)) throw new Error(`unknown lawyer question role ${role}`)
      coveredRoles.add(role)
    }
  }
  for (const requiredRole of expectedRoles) {
    if (!coveredRoles.has(requiredRole)) throw new Error(`the lawyer did not answer ${requiredRole}`)
  }

  const calls = new Map<string, { readonly seq: number; readonly name: string }>()
  const results = new Map<string, { readonly seq: number; readonly isError: boolean; readonly text: string }>()
  let previousToolSeq = -1
  for (const event of events) {
    if (event.type !== 'tool/call' && event.type !== 'tool/result') continue
    if (
      !Number.isSafeInteger(event.seq)
      || event.seq < 0
      || event.seq <= previousToolSeq
    ) {
      throw new Error('native tool events do not have unique increasing sequence numbers')
    }
    previousToolSeq = event.seq
    if (event.data === null || typeof event.data !== 'object' || Array.isArray(event.data)) {
      throw new Error('native tool event data is malformed')
    }
    const data = event.data as Record<string, unknown>
    if (event.type === 'tool/call') {
      if (typeof data.callId !== 'string' || data.callId.length === 0 || typeof data.name !== 'string') {
        throw new Error('native tool call is malformed')
      }
      if (calls.has(data.callId)) throw new Error(`duplicate native tool call ID ${data.callId}`)
      calls.set(data.callId, { seq: event.seq, name: data.name })
      continue
    }
    const message = data.message
    if (message === null || typeof message !== 'object' || Array.isArray(message)) {
      throw new Error('native tool result message is malformed')
    }
    const row = message as Record<string, unknown>
    const source = row.source
    if (
      source === null
      || typeof source !== 'object'
      || Array.isArray(source)
      || (source as Record<string, unknown>).kind !== 'tool'
    ) {
      throw new Error('native tool result source is malformed')
    }
    const callId = (source as Record<string, unknown>).callId
    const isError = row.isError
    if (
      typeof callId !== 'string'
      || callId.length === 0
      || row.toolCallId !== callId
      || typeof isError !== 'boolean'
      || !Array.isArray(row.content)
    ) {
      throw new Error('native tool result is malformed or has a foreign call ID')
    }
    if (results.has(callId)) throw new Error(`duplicate native tool result ${callId}`)
    let text = ''
    for (const part of row.content) {
      if (
        part === null
        || typeof part !== 'object'
        || Array.isArray(part)
        || (part as Record<string, unknown>).type !== 'text'
        || typeof (part as Record<string, unknown>).text !== 'string'
      ) {
        throw new Error(`native tool result ${callId} has a malformed text part`)
      }
      const partText = (part as Record<string, unknown>).text as string
      text += partText
    }
    if (text.trim().length === 0) throw new Error(`native tool result ${callId} has no text`)
    results.set(callId, { seq: event.seq, isError, text })
  }
  for (const [callId, call] of calls) {
    const result = results.get(callId)
    if (result === undefined) throw new Error(`native tool result is missing for ${call.name} ${callId}`)
    if (result.seq <= call.seq) throw new Error(`native tool result precedes its call for ${callId}`)
  }
  for (const [callId, result] of results) {
    const call = calls.get(callId)
    if (call === undefined) throw new Error(`native tool result has unknown call ID ${callId}`)
    if (result.seq <= call.seq) throw new Error(`native tool result precedes its call for ${callId}`)
  }

  let answerCallId = ''
  let answerCallSeq = -1
  let answerResultSeq = -1
  for (const [callId, call] of calls) {
    if (call.name !== 'ask_user_question') continue
    const candidateResult = results.get(callId)!
    if (candidateResult.isError) continue
    if (answerCallId.length !== 0) {
      throw new Error('native turn contains more than one successful lawyer question callback')
    }
    answerCallId = callId
    answerCallSeq = call.seq
    answerResultSeq = candidateResult.seq
  }
  if (answerCallId.length === 0) {
    throw new Error('native turn contains no successful lawyer question callback')
  }
  const answerResult = results.get(answerCallId)!
  let answerPayload: unknown
  try {
    answerPayload = JSON.parse(answerResult.text)
  } catch {
    throw new Error('the lawyer question result is not valid JSON')
  }
  if (
    answerPayload === null
    || typeof answerPayload !== 'object'
    || Array.isArray(answerPayload)
    || !Array.isArray((answerPayload as Record<string, unknown>).answers)
  ) {
    throw new Error('the lawyer question result has no answers array')
  }
  const answers = (answerPayload as Record<string, unknown>).answers as unknown[]
  if (answers.length === 0 || answers.length !== question.answerIds.length) {
    throw new Error('the lawyer answer IDs disappeared or changed count')
  }
  let recordedAnswerText = ''
  for (let index = 0; index < answers.length; index += 1) {
    const rawAnswer = answers[index]
    if (rawAnswer === null || typeof rawAnswer !== 'object' || Array.isArray(rawAnswer)) {
      throw new Error(`lawyer answer ${index + 1} is malformed`)
    }
    const answer = rawAnswer as Record<string, unknown>
    const answerId = answer.id
    const custom = answer.custom
    const selected = answer.selected
    if (
      typeof answerId !== 'string'
      || typeof custom !== 'string'
      || custom.trim().length === 0
      || !Array.isArray(selected)
      || answerId !== question.answerIds[index]
    ) {
      throw new Error(`lawyer answer ${index + 1} does not match the recorded callback IDs/content`)
    }
    for (const selection of selected) {
      if (typeof selection !== 'string') throw new Error(`lawyer answer ${index + 1} has a malformed selection`)
    }
    if (index > 0) recordedAnswerText += '\n'
    recordedAnswerText += custom
  }
  if (recordedAnswerText !== question.answerText) {
    throw new Error('lawyer answer content does not match the recorded callback content')
  }

  for (const [callId, call] of calls) {
    if (call.name !== 'case_save_draft') continue
    const result = results.get(callId)!
    if (result.isError) {
      if (call.seq > answerResult.seq) continue
      const knownRejection =
        result.text.trim() === knownMandatoryQuestionRejection
      if (call.seq < answerResult.seq && result.seq < answerResult.seq && knownRejection) {
        continue
      }
      throw new Error(`uncertain or late draft error for ${callId}`)
    }
    let draftPayload: unknown
    try {
      draftPayload = JSON.parse(result.text)
    } catch {
      throw new Error(`successful draft result is not valid JSON for ${callId}`)
    }
    if (
      draftPayload === null
      || typeof draftPayload !== 'object'
      || Array.isArray(draftPayload)
    ) {
      throw new Error(`successful draft result is malformed for ${callId}`)
    }
    const persistedPath = (draftPayload as Record<string, unknown>).path
    const persistedVersion = (draftPayload as Record<string, unknown>).version
    if (typeof persistedPath !== 'string') {
      throw new Error(`successful draft result has no valid persisted path/version for ${callId}`)
    }
    const pathParts = persistedPath.split('/')
    const invalidPathPart = pathParts.some(part => part.length === 0 || part === '.' || part === '..')
    if (
      persistedPath.length === 0
      || persistedPath.startsWith('/')
      || persistedPath.startsWith('\\')
      || invalidPathPart
      || !persistedPath.endsWith('.md')
      || typeof persistedVersion !== 'number'
      || !Number.isSafeInteger(persistedVersion)
      || persistedVersion < 1
    ) {
      throw new Error(`successful draft result has no valid persisted path/version for ${callId}`)
    }
    if (answerResult.seq >= call.seq) {
      throw new Error('the first persisted review draft call started before the lawyer answer result')
    }
    return {
      answerCallId,
      answerCallSeq,
      answerResultSeq: answerResult.seq,
      draftCallId: callId,
      draftCallSeq: call.seq,
      draftResultSeq: result.seq,
    }
  }
  throw new Error('native turn contains no successfully persisted review draft')
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
    throw new Error('usage: native-contract-workflow.mts --credential-stdin')
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
      format: 'lawbench-t18-native-contract-preflight-failure-v1',
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
  const taskNotesPath = manifest.dependencies.find(entry => entry.role === 'task-notes')?.path
  const judgingNotesPath = manifest.dependencies.find(entry => entry.role === 'judging-notes')?.path
  if (
    personaPath === undefined
    || skillPath === undefined
    || sharedRulesPath === undefined
    || taskNotesPath === undefined
    || judgingNotesPath === undefined
  ) {
    throw new Error('fixed manifest lacks the production persona or skill inputs')
  }
  const personaPrefix = (await readFile(personaPath, 'utf8')).replace(/^【草稿[^\n]*\n+/, '').trim()
  if (!personaPrefix.includes('律所内部的案件助手')) throw new Error('production persona prefix is absent')
  const skillText = await readFile(skillPath, 'utf8')
  if (!skillText.includes(`name: ${TASK_SKILL}`)) throw new Error('contract-review skill identity changed')
  if (!skillText.includes('case_save_edit_list')) throw new Error('contract-review edit-list workflow is absent')
  const sharedRules = await readFile(sharedRulesPath, 'utf8')
  if (!sharedRules.includes('出处格式固定为〔材料名 位置〕')) throw new Error('shared citation rules changed')
  const taskNotes = await readFile(taskNotesPath, 'utf8')
  const lawyerRequest = taskNotes.split(/^---\s*$/m, 1)[0]?.replace(/^# 任务说明\r?\n/, '').trim()
  if (lawyerRequest !== LAWYER_REQUEST) throw new Error('task note lawyer request changed')
  const judgingNotes = await readFile(judgingNotesPath, 'utf8')
  if (judgingNotes.trim().length === 0 || USER_PROMPT.includes('测试要点（不给模型看）')) {
    throw new Error('root-only judging notes leaked into the model prompt')
  }

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
    format: 'lawbench-t18-native-contract-workflow-v1',
    task: 'A-T18-native-contract-workflow-20261028-163202',
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
      noExternalSendInstruction: true,
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
      actualModelReviewAndEditList: false,
      productionRedlineArtifact: false,
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
    if (asArray(imported.skipped).length !== 0 || asArray(imported.copied).length !== 2) {
      throw new Error('current import pipeline did not copy exactly two fixtures')
    }
    const listed = apiOk(await remote.callApi(apiRoute('materialsList'), { case_id: caseId }), 'materialsList')
    const materials = asArray(listed.materials).map(asRecord)
    if (materials.length !== 2) throw new Error('imported material count is not two')
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
    const expectedUnits = new Map([
      ['采购合同', 'para'],
      ['采购部内部意见', 'line'],
    ])
    for (const row of materials) {
      const name = asString(row.name, 'material name')
      if (row.unit !== expectedUnits.get(name)) {
        throw new Error(`imported unit is not the current parser unit for ${name}`)
      }
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
      throw new Error(`case original area is not exactly two declared fixtures: ${JSON.stringify(originalArea)}`)
    }
    report.case = {
      caseId,
      path: caseRoot,
      materialIds,
      importedPaths: asArray(imported.copied).map((raw, index) => asString(asRecord(raw).to, `copied ${index + 1}`)),
      originalAreaFiles: originalArea,
    }
    const materialReads: MaterialReadRecord[] = materialIds.map(materialId => {
      const row = materials.find(candidate => candidate.material_id === materialId)
      if (row === undefined) throw new Error(`material ${materialId} disappeared`)
      const name = asString(row.name, 'material name')
      const fixture = manifest.fixtures.find(entry => entry.id === name)
      if (fixture === undefined) throw new Error(`material ${materialId} is outside the fixed fixtures`)
      const importedPath = resolve(caseRoot, ...asString(row.rel_path, 'material rel_path').split('/'))
      return {
        materialId,
        name,
        type: asString(row.type, 'material type'),
        unit: asString(row.unit, 'material unit'),
        unitCount: asInteger(row.unit_count, 'material unit_count'),
        originalPath: importedPath,
        originalBytes: fixture.bytes,
        originalSha256: fixture.sha256,
        sourceBytes: fixture.bytes,
        sourceSha256: fixture.sha256,
        sourceMtimeNs: asString(fixture.mtime_ns, 'fixture mtime_ns'),
      }
    })
    report.materialReads = materialReads

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
    const skillListing = asRecord(await production.remote.listSkills())
    if (skillListing.ok !== true) throw new Error('production Skill listing failed')
    const skills = asArray(asRecord(skillListing.value).skills).map(asRecord)
    const taskSkill = skills.find(row => row.name === TASK_SKILL)
    if (taskSkill === undefined) throw new Error('contract-review is absent from the production Skill listing')
    const preset = asRecord(settings.skill_presets ?? {})[TASK_SKILL]
    const ownParams = preset === undefined ? asRecord(taskSkill.params) : asRecord(preset)
    const taskParams = ownParams.temperature === undefined
      ? { ...ownParams, temperature: defaults.temperature }
      : { ...ownParams }
    if (
      taskParams.thinking !== '高'
      || taskParams.window !== '128K'
      || taskParams.max_tokens !== TASK_MAX_TOKENS
      || taskParams.temperature !== 0.6
      || JSON.stringify(Object.keys(taskParams).sort())
        !== JSON.stringify(['max_tokens', 'temperature', 'thinking', 'window'])
    ) {
      throw new Error('contract-review production task parameters changed')
    }
    report.taskParams = taskParams

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
      params: taskParams,
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
      || headerConfig.maxTokens !== taskParams.max_tokens
    ) {
      throw new Error('request/header does not carry the production LegalAgent route and task max tokens')
    }
    liveEvents = nativeSession.snapshotEvents() as readonly NativeEvent[]
    const toolCalls = toolCallsFromEvents(turnEvents)
    report.toolCalls = toolCalls
    const toolNames = toolCalls.map(call => call.name)
    for (const requiredTool of [
      'skill',
      'ask_user_question',
      'case_list_materials',
      'case_read_material',
      'case_save_draft',
      'case_save_edit_list',
    ]) {
      if (!toolNames.includes(requiredTool)) throw new Error(`actual tool loop lacks ${requiredTool}`)
    }
    if (!turnEvents.some(event => skillNameFromCall(event) === TASK_SKILL)) {
      throw new Error('the skill tool did not load contract-review from the production provider')
    }
    if (question.value === null) throw new Error('the Skill workflow did not receive synthetic lawyer answers')
    report.questionOrder = observeQuestionBeforeFirstDraft(turnEvents, question.value)
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
        if (candidates.length > 1) throw new Error('more than one executed contract-review task exists')
        const candidate = candidates[0]
        if (candidate !== undefined && candidate.status !== 'running') return candidate
        await new Promise(done => setTimeout(done, 100))
      }
    })())
    if (completedTask === undefined) throw new Error('contract-review task did not reach a terminal state')
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
      throw new Error('persisted task is not a finished contract-review task')
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
      const material = materialReads.find(item => item.materialId === materialId)
      if (
        row.material_version !== materialShaById.get(materialId)
        || material === undefined
        || from < 1
        || to < from
        || material.unit !== asString(row.unit, 'read unit')
        || to > material.unitCount
      ) {
        throw new Error(`actual read range is invalid for ${materialId}`)
      }
    }
    for (const material of materialReads) {
      const intervals = readRows
        .filter(row => row.material_id === material.materialId)
        .map(row => ({
          from: asInteger(row.from, 'read interval from'),
          to: asInteger(row.to, 'read interval to'),
        }))
        .sort((left, right) => left.from - right.from)
      let next = 1
      for (const interval of intervals) {
        if (interval.from > next) throw new Error(`actual reads leave a gap in ${material.name}`)
        next = Math.max(next, interval.to + 1)
      }
      if (next <= material.unitCount) throw new Error(`actual reads do not reach the end of ${material.name}`)
    }
    const citationCheck = asRecord(result.citation_check)
    if (citationCheck.passed !== true) throw new Error('case_save_draft citation check did not pass')
    const citations = asArray(result.citations).map(asRecord)
    if (citations.length === 0) throw new Error('saved draft has no parsed citations')
    const drafts = asArray(result.drafts).map(asRecord)
    if (drafts.length === 0) throw new Error('completed task has no saved Markdown draft')
    const latestDraft = drafts.at(-1)!
    const draftRel = asString(latestDraft.path, 'draft path')
    if (latestDraft.title !== '合同审查意见') throw new Error('saved review title is not 合同审查意见')
    if (!draftRel.endsWith('.md')) throw new Error('saved draft is not Markdown')
    const draftPath = resolve(caseRoot, ...draftRel.split('/'))
    const draftRelative = relative(resolve(caseRoot), draftPath)
    if (draftRelative.startsWith('..') || isAbsolute(draftRelative)) {
      throw new Error('draft path escapes the case')
    }
    const draftBytes = await readFile(draftPath)
    const draftText = draftBytes.toString('utf8')
    if (draftText.trim().length === 0) throw new Error('saved Markdown draft is empty')
    const draftCallEvents = turnEvents.filter(event => (
      event.type === 'tool/call' && asRecord(event.data).name === 'case_save_draft'
    ))
    const finalDraftCall = draftCallEvents.at(-1)
    if (finalDraftCall === undefined) throw new Error('the model did not call case_save_draft')
    const finalDraftArgs = toolArguments(finalDraftCall)
    const finalDraftResult = toolResultValue(
      turnEvents,
      asString(asRecord(finalDraftCall.data).callId, 'draft call id'),
    )
    if (
      finalDraftArgs.title !== latestDraft.title
      || finalDraftArgs.content !== draftText
      || finalDraftResult.path !== draftRel
      || finalDraftResult.version !== latestDraft.version
    ) {
      throw new Error('saved review is not the actual model tool result')
    }
    assertContractReviewContent(draftText, citations)
    if (drafts.some(item => !asString(item.path, 'pre-redline draft path').endsWith('.md'))) {
      throw new Error('the model produced a Word artifact before the production redline API')
    }
    report.draft = {
      title: asString(latestDraft.title, 'draft title'),
      path: draftRel,
      version: asInteger(latestDraft.version, 'draft version'),
      bytes: draftBytes.byteLength,
      sha256: sha256Bytes(draftBytes),
      textLength: draftText.length,
    }

    const editCallEvents = turnEvents.filter(event => (
      event.type === 'tool/call' && asRecord(event.data).name === 'case_save_edit_list'
    ))
    if (editCallEvents.length !== 1) throw new Error('contract-review must save exactly one edit list')
    const editCall = editCallEvents[0]!
    const editArgs = toolArguments(editCall)
    if (JSON.stringify(Object.keys(editArgs).sort()) !== JSON.stringify(['edits', 'name'])) {
      throw new Error('case_save_edit_list arguments have fields outside the contract')
    }
    if (editArgs.name !== '采购合同') throw new Error('case_save_edit_list did not use the imported material name')
    const edits = asArray(editArgs.edits).map(validateEditItem)
    if (edits.length === 0) throw new Error('case_save_edit_list is empty')
    const editCallId = asString(asRecord(editCall.data).callId, 'edit-list call id')
    const editResult = toolResultValue(turnEvents, editCallId)
    const editResultPath = asString(editResult.path, 'edit-list result path')
    const accepted = asInteger(editResult.accepted, 'edit-list accepted')
    const outOfScope = asArray(editResult.out_of_scope).map((raw, index) => {
      const row = asRecord(raw)
      if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(['id', 'reason'])) {
        throw new Error(`out-of-scope edit ${index + 1} has invalid fields`)
      }
      return {
        id: asInteger(row.id, `out-of-scope id ${index + 1}`),
        reason: asString(row.reason, `out-of-scope reason ${index + 1}`),
      }
    })
    const outOfScopeIds = new Set(outOfScope.map(item => item.id))
    if (
      accepted < 1
      || accepted !== edits.length - outOfScope.length
      || outOfScopeIds.size !== outOfScope.length
      || outOfScope.some(item => item.id < 1 || item.id > edits.length || item.reason.length === 0)
    ) {
      throw new Error('case_save_edit_list did not accept any valid in-scope edit')
    }
    const editResultIndex = turnEvents.findIndex(event => {
      if (event.type !== 'tool/result') return false
      const source = asRecord(asRecord(event.data).message).source
      return source !== null
        && typeof source === 'object'
        && asRecord(source).callId === editCallId
    })
    if (
      editResultIndex < 0
      || (outOfScope.length > 0 && turnEvents.indexOf(finalDraftCall) <= editResultIndex)
    ) {
      throw new Error('out-of-scope edit results were not followed by an updated model draft')
    }
    const editListExpected = `工作区/任务/${taskId}/修改清单/采购合同.json`
    if (editResultPath !== editListExpected) throw new Error('edit-list result path is outside the owned task')
    const editListPath = resolve(caseRoot, ...editResultPath.split('/'))
    const editListRelative = relative(resolve(caseRoot), editListPath)
    if (editListRelative.startsWith('..') || isAbsolute(editListRelative)) {
      throw new Error('edit-list path escapes the case')
    }
    const editListBytes = await readFile(editListPath)
    const persistedEdits = JSON.parse(editListBytes.toString('utf8')) as Record<string, unknown>
    if (JSON.stringify(persistedEdits) !== JSON.stringify(editArgs)) {
      throw new Error('persisted edit list differs from the actual model tool arguments')
    }
    assertOutOfScopeReported(draftText, outOfScope, edits)
    report.editList = {
      path: editResultPath,
      bytes: editListBytes.byteLength,
      sha256: sha256Bytes(editListBytes),
      edits,
      accepted,
      outOfScope,
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

    const redlineResult = apiOk(await remote.callApi(apiRoute('redline'), {
      case_id: caseId,
      task_id: taskId,
      edit_list: editResultPath,
    }), 'redline')
    const revisedRel = asString(redlineResult.path, 'redline path')
    const applied = asInteger(redlineResult.applied, 'redline applied')
    const redlineManual = asArray(redlineResult.manual).map((raw, index) => {
      const row = asRecord(raw)
      if (JSON.stringify(Object.keys(row).sort()) !== JSON.stringify(['id', 'reason'])) {
        throw new Error(`redline manual item ${index + 1} has invalid fields`)
      }
      return {
        id: asInteger(row.id, `redline manual id ${index + 1}`),
        reason: asString(row.reason, `redline manual reason ${index + 1}`),
      }
    })
    if (applied < 1) throw new Error('production redline applied no model-authored edit')
    const manualIds = new Set(redlineManual.map(item => item.id))
    const editIds = new Set(edits.map(edit => edit.id))
    if (
      manualIds.size !== redlineManual.length
      || redlineManual.some(item => !editIds.has(item.id) || item.reason.length === 0)
      || outOfScope.some(item => !manualIds.has(item.id))
    ) {
      throw new Error('production redline manual items do not match the actual edit list')
    }
    const appliedEdits = edits.filter(edit => (
      !outOfScope.some(item => item.id === edit.id) && !manualIds.has(edit.id)
    ))
    if (applied !== appliedEdits.length) throw new Error('redline applied count does not match applied edit ids')
    const revisedPath = resolve(caseRoot, ...revisedRel.split('/'))
    const revisedRelative = relative(resolve(caseRoot), revisedPath)
    if (
      revisedRelative.startsWith('..')
      || isAbsolute(revisedRelative)
      || !/^工作区\/任务\/T-[0-9]{14}-[0-9a-f]{4}\/草稿\/采购合同-修订版-v[1-9][0-9]*\.docx$/.test(revisedRel)
      || !revisedRel.startsWith(`工作区/任务/${taskId}/草稿/`)
    ) {
      throw new Error('redline output path is outside the owned task')
    }
    const revisedBytes = await readFile(revisedPath)
    const revisedXml = zipXml(revisedBytes, 'word/document.xml')
    const commentsXml = zipXml(revisedBytes, 'word/comments.xml')
    const expectedInsertions = appliedEdits.filter(edit => (
      edit.action === 'replace' || edit.action === 'insert_after'
    )).length
    const expectedDeletions = appliedEdits.filter(edit => (
      edit.action === 'replace' || edit.action === 'delete'
    )).length
    const insertions = countXml(revisedXml, 'ins')
    const deletions = countXml(revisedXml, 'del')
    const comments = countXml(commentsXml, 'comment')
    if (
      insertions !== expectedInsertions
      || deletions !== expectedDeletions
      || comments !== applied
    ) {
      throw new Error('revised DOCX track changes do not match the actual applied edits')
    }

    const sourceFixture = manifest.fixtures.find(entry => entry.id === '采购合同')
    if (sourceFixture === undefined) throw new Error('canonical contract fixture is absent')
    const sourceDocxBytes = await readFile(sourceFixture.path)
    const sourceXml = zipXml(sourceDocxBytes, 'word/document.xml')
    const sourceRels = zipXml(sourceDocxBytes, 'word/_rels/document.xml.rels')
    const revisedRels = zipXml(revisedBytes, 'word/_rels/document.xml.rels')
    const sourceTables = countXml(sourceXml, 'tbl')
    const sourceHyperlinks = countXml(sourceXml, 'hyperlink')
    if (
      sourceTables < 1
      || sourceHyperlinks < 1
      || countXml(revisedXml, 'tbl') !== sourceTables
      || countXml(revisedXml, 'hyperlink') !== sourceHyperlinks
      || !sourceRels.includes('http://127.0.0.1/lbfx-attachment')
      || !revisedRels.includes('http://127.0.0.1/lbfx-attachment')
    ) {
      throw new Error('table or hyperlink structure was not preserved in the revised DOCX')
    }
    const sourceAfter = await ordinaryFileIdentity(
      sourceFixture.path,
      sourceFixture.bytes,
      sourceFixture.sha256,
      asString(sourceFixture.mtime_ns, 'contract mtime_ns'),
    )
    report.redline = {
      path: revisedRel,
      bytes: revisedBytes.byteLength,
      sha256: sha256Bytes(revisedBytes),
      applied,
      manual: redlineManual,
      trackChanges: {
        insertions,
        deletions,
        comments,
        expectedInsertions,
        expectedDeletions,
      },
      sourceDocx: {
        path: sourceFixture.path,
        bytes: sourceAfter.bytes,
        sha256: sourceAfter.sha256,
        mtimeNs: sourceAfter.mtimeNs,
        unchanged: true,
      },
      structure: {
        sourceTables,
        revisedTables: countXml(revisedXml, 'tbl'),
        sourceHyperlinks,
        revisedHyperlinks: countXml(revisedXml, 'hyperlink'),
        externalRelationshipPreserved: true,
      },
    }
    for (const material of materialReads) {
      await ordinaryFile(material.originalPath, material.originalBytes, material.originalSha256)
    }
    const resultAfterRedline = asRecord(JSON.parse(await readFile(resultFile, 'utf8')))
    const redlineDraft = asArray(resultAfterRedline.drafts)
      .map(asRecord)
      .find(item => item.path === revisedRel)
    if (
      resultAfterRedline.status !== 'completed'
      || redlineDraft === undefined
      || redlineDraft.title !== '采购合同-修订版'
    ) {
      throw new Error('production redline did not register its DOCX draft on the owned completed task')
    }

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
    report.claims.actualModelReviewAndEditList = true
    report.claims.productionRedlineArtifact = true
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
    editList: sanitized.editList,
    redline: sanitized.redline,
    coverage: sanitized.coverage,
  }, null, 2)}\n`)
  if (sanitized.status !== 'PASS') process.exitCode = 1
}

await main()
