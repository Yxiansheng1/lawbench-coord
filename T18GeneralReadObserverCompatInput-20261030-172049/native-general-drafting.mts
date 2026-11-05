/**
 * Finite T18 native general-drafting consumer.
 *
 * One fresh private case receives five approved synthetic text materials.
 * The real B CaseRegistry, text scanner, Native Session, Host request scope,
 * LegalAgent, AgentLoop, and one real 6000D turn form one general-drafting
 * task. No historical session, messages, task state, case DB, or JSONL is
 * copied. The model must ask the three declared questions once before saving,
 * read current source material, and save the Markdown body through the actual
 * case_save_draft tool.
 *
 * Authoring status: AUTHORED_NOT_RUN. This file has no credential source
 * besides non-interactive stdin and must not itself be executed by its author.
 */

import { createHash, randomBytes } from 'node:crypto'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_ROOT = 'D:/Lawbeach/lawbench-B'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const B_SERVICE_SCRIPT = join(EVIDENCE_DIR, 'b-service-general-drafting.py')
const MATERIAL_INDEX_PATH = ['工作区', '材料', 'index.json'] as const
const FIXED_INPUTS_FORMAT = 'lawbench-t18-general-drafting-native-inputs-v1'
const TASK_NAME = 'A-T18-general-drafting-native-20261029-025642'
const REVIEW_ID = 'T18GeneralDraftingNative-20261029-025642'
const SKILL = 'general-drafting'
const DRAFT_TITLE = '律师函'
const MODEL_ORIGIN = 'http://10.126.126.1:8000'
const MODEL_URL = `${MODEL_ORIGIN}/v1`
const MODEL = 'qwen38-27b'
const PROVIDER = 'lawfirm'
const CREDENTIAL_REF = 'LAWFIRM_KEY'
const MAX_CREDENTIAL_BYTES = 4096
const TECHNICAL_WATCHDOG_MS = 86_400_000
const MODEL_CALL_LIMIT = 32
const TOOL_CALL_LIMIT = 48
const TASK_MINUTES = 45
const TASK_MAX_TOKENS = 32_768
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/
const SHA256 = /^[0-9a-f]{64}$/
const APPROVED_INPUTS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18GeneralDraftingNativeInput-20261029-025642\\approved-sample-and-skill.json'
const APPROVED_INPUTS_BYTES = 2_130
const APPROVED_INPUTS_SHA256 =
  '50a9c328e41d5ab52dbe31411c17d13e1b20d537c711cdc38d101a43e866edb6'
const SOURCE_PINS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18WikiTableFidelityBSourcePins-20261030-033727.json'
const SOURCE_PINS_BYTES = 53_548
const SOURCE_PINS_SHA256 =
  '7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b'
const SOURCE_PINS_ENTRIES = 346
const MATERIAL_NAMES = [
  '借条',
  '微信催款记录',
  '情况说明',
  '还款记录',
  '银行流水',
] as const
const QUESTION_IDS = ['doc_type', 'recipient', 'goal'] as const
type QuestionId = typeof QUESTION_IDS[number]
const QUESTION_ANSWERS: Readonly<Record<QuestionId, string>> = {
  doc_type: '律师函。',
  recipient: '王某丙。',
  goal: '收到函后7日内还清剩余本金，并支付逾期利息。',
}

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
  readonly path: string
  readonly bytes: number
  readonly sha256: string
  readonly mtime_ns?: string
}

interface MaterialInput extends FixedEntry {
  readonly name: string
}

interface FixedInputManifest {
  readonly format: typeof FIXED_INPUTS_FORMAT
  readonly task: typeof TASK_NAME
  readonly hashAlgorithm: 'sha256'
  readonly approvedInputs: FixedEntry
  readonly sourcePins: FixedEntry
  readonly canonicalTask: FixedEntry
  readonly skill: FixedEntry
  readonly materials: readonly MaterialInput[]
  readonly dependencies: readonly FixedEntry[]
  readonly compilerPrivate: readonly FixedEntry[]
  readonly runtimeExecutables: readonly FixedEntry[]
  readonly consumer: FixedEntry
  readonly bService: FixedEntry
}

interface AdmissionRecord {
  readonly checkedAtUtc: string
  readonly manifestSha256: string
  readonly approvedInputsSha256: string
  readonly sourcePinsSha256: string
  readonly materialCount: number
  readonly dependencyCount: number
  readonly compilerPrivateCount: number
  readonly runtimeExecutableCount: number
  readonly consumerSha256: string
  readonly bServiceSha256: string
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
  readonly contractVersion: '1.6'
  readonly lifespan: 'off'
  readonly sourcePinCount: 346
  readonly fixtureCount: 5
  readonly forwardListener: false
  readonly ocrStarted: false
  readonly retainerStarted: false
}

interface BServiceLease {
  readonly token: string
  readonly ready: BServiceReady
  stop(): Promise<{
    readonly code: number | null
    readonly final: Record<string, unknown>
    readonly forced: boolean
  }>
  forceStop(): void
  isStopped(): boolean
}

interface QuestionCapture {
  value: {
    readonly questionIds: readonly string[]
    readonly questionText: string
    readonly optionLabels: readonly string[]
    readonly answerIds: readonly string[]
    readonly answerText: string
  } | null
  invocationCount: number
}

interface ToolCallRecord {
  readonly ordinal: number
  readonly name: string
  readonly callId: string
  readonly seq: number
  readonly argumentsSha256: string
}

type QuestionsBeforeReadDenial = (missing: readonly string[]) => string

interface GeneralReadTimelineInput {
  readonly events: readonly NativeEvent[]
  readonly declaredQuestionIds: readonly string[]
  readonly askCallId: string
  readonly askCallSeq: number
  readonly askResultSeq: number
  readonly questionsBeforeReadDenial: QuestionsBeforeReadDenial
}

interface MaterialReadRecord {
  readonly materialId: string
  readonly name: string
  readonly type: string
  readonly unit: string
  readonly unitCount: number
  readonly relPath: string
  readonly originalPath: string
  readonly originalBytes: number
  readonly originalSha256: string
  readonly sourceMtimeNs: string
}

interface CitationResolution {
  readonly materialId: string
  readonly name: string
  readonly citation: string
  readonly loc: unknown
  readonly textSha256: string
  readonly textLength: number
  readonly sourceChanged: false
}

interface RunReport {
  format: 'lawbench-t18-general-drafting-native-report-v1'
  task: typeof TASK_NAME
  status: 'RUNNING' | 'TECHNICAL_PASS_REVIEW_REQUIRED' | 'FAILED'
  authoredStatus: 'AUTHORED_NOT_RUN'
  startedAtUtc: string
  finishedAtUtc?: string
  process: {
    readonly executable: string
    readonly pid: number
    readonly birthUtc: string
    readonly node: string
    readonly cwd: string
  }
  fixture: {
    readonly syntheticOnly: true
    readonly freshCase: true
    readonly freshNativeSession: true
    readonly materialNames: readonly string[]
    readonly materialCopiesBeforeCaseOpen: true
    readonly materialImportCalls: 0
  }
  modelRoute: {
    readonly provider: typeof PROVIDER
    readonly model: typeof MODEL
    readonly baseURL: typeof MODEL_URL
    readonly thinking: '中'
    readonly contextWindow: 131_072
    readonly maxTokens: 32_768
    readonly modelCallsPerSkill: 32
    readonly requestTimeoutMs: 1_200_000
    readonly streamIdleTimeoutMs: 1_200_000
  }
  runRoot?: string
  admission: { initial?: AdmissionRecord; final?: AdmissionRecord }
  originalInputsHeld: boolean
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
    readonly materials: readonly MaterialReadRecord[]
    readonly originalAreaFiles: readonly string[]
    caseDb: {
      readonly path: string
      readonly bytes: number
      readonly sha256: string
    }
  }
  skillSource?: {
    readonly name: typeof SKILL
    readonly path: string
    readonly bytes: number
    readonly sha256: string
    readonly listed: true
    readonly loaded: true
  }
  prompt?: {
    readonly source: string
    readonly sha256: string
    readonly length: number
    readonly excludesTestExplanation: true
  }
  session?: {
    readonly sessionId: string
    readonly uuid: string
    readonly cwd: string
    readonly freshCreated: true
  }
  task?: {
    readonly selectionId: string
    readonly taskId: string
    readonly requestId: string
    readonly skill: typeof SKILL
    readonly params: Record<string, unknown>
    readonly requestScope: Record<string, unknown>
  }
  question?: {
    readonly callId: string
    readonly questionIds: readonly string[]
    readonly answerIds: readonly string[]
    readonly questionTextSha256: string
    readonly answerTextSha256: string
    readonly beforeFirstSuccessfulSave: true
  }
  turn?: {
    readonly beforeSeq: number
    readonly afterSeq: number
    readonly eventTypes: readonly string[]
    readonly responseTextSha256: string
    readonly responseTextLength: number
    readonly toolCalls: readonly ToolCallRecord[]
  }
  coverage?: unknown
  reads?: unknown
  sourceReads?: readonly {
    readonly names: readonly string[]
    readonly textSha256: string
    readonly textLength: number
  }[]
  citations?: readonly CitationResolution[]
  draft?: {
    readonly title: string
    readonly path: string
    readonly version: number
    readonly bytes: number
    readonly sha256: string
    readonly length: number
    readonly machineChecks: Record<string, boolean>
  }
  accounting?: {
    readonly bTaskUsage: Record<string, unknown>
    readonly observedModelPosts: number
    readonly observedModelHttp200: number
    readonly observedToolCalls: number
    readonly withinTaskBudget: boolean
  }
  persistence?: {
    readonly sessionReopened: boolean
    readonly liveEqualsReopened: boolean
    readonly physicalJsonlPath: string
    readonly physicalJsonlBytes: number
    readonly physicalJsonlSha256: string
    readonly physicalEventCount: number
    readonly headerId: string
    readonly headerCwd: string
  }
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
  secondaryErrors: unknown[]
  claims: {
    readonly oneSyntheticWorkflowOnly: true
    actualSingleGeneralDraftingConsumer: boolean
    actualModelAuthoredDraft: boolean
    businessAcceptance: false
    legalAcceptance: false
    manualFactArithmeticThreatFormatReviewRequired: true
    readonly fullT18: false
    readonly gate1: 'INCOMPLETE'
    readonly packaging: 'HOLD'
    readonly gui: false
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

async function ordinaryFile(
  path: string,
  expectedBytes?: number,
  expectedSha?: string,
): Promise<number> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`input is not an ordinary file: ${path}`)
  if (expectedBytes !== undefined && info.size !== expectedBytes) {
    throw new Error(`input byte count changed: ${path}`)
  }
  if (expectedSha !== undefined && await sha256File(path) !== expectedSha) {
    throw new Error(`input SHA-256 changed: ${path}`)
  }
  return info.size
}

async function ordinaryFileIdentity(
  path: string,
  expectedBytes: number,
  expectedSha: string,
  expectedMtimeNs: string,
): Promise<void> {
  const info = await lstat(path, { bigint: true })
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`input is not an ordinary file: ${path}`)
  if (Number(info.size) !== expectedBytes || info.mtimeNs.toString() !== expectedMtimeNs) {
    throw new Error(`input bytes or mtime_ns changed: ${path}`)
  }
  if (await sha256File(path) !== expectedSha) throw new Error(`input SHA-256 changed: ${path}`)
}

async function ownedMaterialIndex(
  caseRoot: string,
  caseId: string,
): Promise<Map<string, Record<string, unknown>>> {
  const path = join(caseRoot, ...MATERIAL_INDEX_PATH)
  await ordinaryFile(path)
  const index = asRecord(JSON.parse(await readFile(path, 'utf8')))
  const indexRows = asArray(index.materials).map(asRecord)
  if (
    index.v !== 1
    || index.case_id !== caseId
    || indexRows.length !== 5
  ) {
    throw new Error('owned material index identity is invalid')
  }
  const rows = new Map<string, Record<string, unknown>>()
  for (const row of indexRows) {
    const materialId = asString(row.material_id, 'indexed material_id')
    const version = asString(row.sha256, `indexed material ${materialId} sha256`)
    if (!SHA256.test(version) || rows.has(materialId)) {
      throw new Error(`owned material index row is invalid: ${materialId}`)
    }
    rows.set(materialId, row)
  }
  return rows
}

async function assertDirectoryNotReparse(path: string): Promise<void> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`directory is not ordinary: ${path}`)
  if (pathKey(await realpath(path)) !== pathKey(path)) throw new Error(`directory resolves through reparse: ${path}`)
}

async function verifyFixedInputs(): Promise<{
  readonly admission: AdmissionRecord
  readonly manifest: FixedInputManifest
}> {
  const manifestBytes = await readFile(FIXED_INPUTS_PATH)
  const manifestSha256 = sha256Bytes(manifestBytes)
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as FixedInputManifest
  if (
    manifest.format !== FIXED_INPUTS_FORMAT
    || manifest.task !== TASK_NAME
    || manifest.hashAlgorithm !== 'sha256'
    || manifest.materials.length !== 5
    || manifest.compilerPrivate.length !== 4
    || manifest.runtimeExecutables.length !== 3
    || !manifest.dependencies.some(entry => (
      entry.role === 'general-drafting-skill'
      && entry.sha256 === manifest.skill.sha256
    ))
  ) {
    throw new Error('fixed-input manifest header is invalid')
  }
  for (const entry of [
    manifest.approvedInputs,
    manifest.sourcePins,
    manifest.canonicalTask,
    manifest.skill,
    ...manifest.materials,
    ...manifest.dependencies,
    ...manifest.compilerPrivate,
    ...manifest.runtimeExecutables,
    manifest.consumer,
    manifest.bService,
  ]) {
    await ordinaryFile(entry.path, entry.bytes, entry.sha256)
  }
  if (
    manifest.approvedInputs.path !== APPROVED_INPUTS_PATH
    || manifest.approvedInputs.bytes !== APPROVED_INPUTS_BYTES
    || manifest.approvedInputs.sha256 !== APPROVED_INPUTS_SHA256
    || manifest.sourcePins.path !== SOURCE_PINS_PATH
    || manifest.sourcePins.bytes !== SOURCE_PINS_BYTES
    || manifest.sourcePins.sha256 !== SOURCE_PINS_SHA256
    || manifest.consumer.path !== fileURLToPath(import.meta.url)
    || manifest.bService.path !== B_SERVICE_SCRIPT
  ) {
    throw new Error('fixed external, self, or companion pin changed')
  }
  for (const material of manifest.materials) {
    await ordinaryFileIdentity(
      material.path,
      material.bytes,
      material.sha256,
      asString(material.mtime_ns, `${material.name} mtime_ns`),
    )
  }
  const approvedBytes = await readFile(APPROVED_INPUTS_PATH)
  if (
    approvedBytes.byteLength !== APPROVED_INPUTS_BYTES
    || sha256Bytes(approvedBytes) !== APPROVED_INPUTS_SHA256
  ) {
    throw new Error('approved sample-and-skill literal input identity changed')
  }
  const approvedRows = asArray(JSON.parse(approvedBytes.toString('utf8'))).map(row => {
    const value = asRecord(row)
    return {
      path: asString(value.path, 'approved path'),
      bytes: asInteger(value.bytes, 'approved bytes'),
      sha256: asString(value.sha256, 'approved sha256'),
      mtime_ns: asString(value.mtime_ns, 'approved mtime_ns'),
    }
  })
  if (approvedRows.length !== 8) throw new Error('approved literal row count changed')
  const materialRows = approvedRows
    .filter(row => row.path.toLowerCase().endsWith('.txt'))
    .sort((left, right) => left.path.localeCompare(right.path))
  const manifestRows = manifest.materials
    .map(row => ({
      path: row.path,
      bytes: row.bytes,
      sha256: row.sha256,
      mtime_ns: asString(row.mtime_ns, `${row.name} mtime_ns`),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
  if (JSON.stringify(materialRows) !== JSON.stringify(manifestRows)) {
    throw new Error('manifest material rows are not the approved five literal rows')
  }
  if (
    JSON.stringify(manifest.materials.map(row => row.name).sort())
    !== JSON.stringify([...MATERIAL_NAMES].sort())
    || manifest.materials.some(row => (
      row.path.includes('要点.md')
      || row.path.includes('_任务说明.md')
      || !row.path.endsWith('.txt')
    ))
  ) {
    throw new Error('manifest material set contains a golden or non-material input')
  }
  if (
    !manifest.canonicalTask.path.endsWith('\\_任务说明.md')
    || !manifest.skill.path.endsWith('\\SKILL.md')
  ) {
    throw new Error('canonical task or Skill pin path changed')
  }
  const sourcePins = asRecord(JSON.parse(await readFile(SOURCE_PINS_PATH, 'utf8')))
  const sourceRows = Object.entries(sourcePins)
  if (sourceRows.length !== SOURCE_PINS_ENTRIES) throw new Error('reviewed B source pin count changed')
  for (const [relativePath, raw] of sourceRows) {
    const pure = relativePath.replaceAll('\\', '/')
    if (pure.startsWith('/') || pure.split('/').includes('..')) {
      throw new Error(`reviewed B source pin escapes B: ${relativePath}`)
    }
    const row = asRecord(raw)
    await ordinaryFile(
      join(B_ROOT, ...pure.split('/')),
      asInteger(row.bytes, 'reviewed B source bytes'),
      asString(row.sha256, 'reviewed B source sha256'),
    )
  }
  return {
    admission: {
      checkedAtUtc: utcNow(),
      manifestSha256,
      approvedInputsSha256: manifest.approvedInputs.sha256,
      sourcePinsSha256: manifest.sourcePins.sha256,
      materialCount: manifest.materials.length,
      dependencyCount: manifest.dependencies.length,
      compilerPrivateCount: manifest.compilerPrivate.length,
      runtimeExecutableCount: manifest.runtimeExecutables.length,
      consumerSha256: manifest.consumer.sha256,
      bServiceSha256: manifest.bService.sha256,
    },
    manifest,
  }
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
  for (const path of [home, appdata, localAppData, temp]) {
    await mkdir(path, { recursive: true, mode: 0o700 })
  }
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
      gate.modelEnabled
      && url.protocol === expected.protocol
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
          || ready.sourcePinCount !== SOURCE_PINS_ENTRIES
          || ready.fixtureCount !== 5
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
    if (ready.pid !== child.pid) throw new Error('finite B PID does not match the owned child')
    if (pathKey(ready.executable) !== pathKey(pythonExe)) {
      throw new Error('finite B executable does not match the pinned Python executable')
    }
    const started = Date.parse(ready.startedAtUtc)
    if (
      !Number.isFinite(started)
      || started < Date.parse(processBirthUtc()) - 1000
      || started > Date.now() + 1000
    ) {
      throw new Error('finite B UTC birth is outside the driver lifetime')
    }
  } catch (error) {
    child.kill()
    await withWatchdog(exitPromise).catch(() => undefined)
    throw error
  }
  let stopResult: {
    code: number | null
    final: Record<string, unknown>
    forced: boolean
  } | undefined
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
  question: QuestionCapture,
  blocked: Map<string, string>,
): Promise<any> {
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
    QueryModule,
    TypertModule,
    PiAiModule,
    ControllerAgentModule,
    ControllerCommandsModule,
    ControllerProjectionModule,
    ClientSessionModule,
    SkillModule,
    SkillFsModule,
    ToolSkillModule,
    UserQuestionsModule,
    AskUserModule,
    RepeatToolReminderModule,
    ExtAgentModule,
    ExtHostModule,
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
    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/GeneralReadOrderPrivateBuild-20261030-164557/private-output-20261030-171028/profile-node_modules/lawbench-dsh/lib/agent.js'),
    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/GeneralReadOrderPrivateBuild-20261030-164557/private-output-20261030-171028/profile-node_modules/lawbench-dsh/lib/host.js'),
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
  const questionsBeforeReadDenial = ExtAgentModule.questionsBeforeReadDenial
  const LawbenchRemote = ExtHostModule.LawbenchRemote
  if (typeof questionsBeforeReadDenial !== 'function') {
    throw new Error('the current compiled Agent does not export questionsBeforeReadDenial')
  }

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
  await mkdir(persistenceRoot, { recursive: true, mode: 0o700 })
  if ((await readdir(persistenceRoot)).length !== 0) {
    throw new Error('fresh persistence root is not empty')
  }
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
    noteTurnBlocked: (sessionId: string, code: string) => blocked.set(sessionId, code),
    clearTurnBlocked: (sessionId: string) => blocked.delete(sessionId),
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
    onState: (callback: (state: string) => void) => {
      callback('running')
      return () => {}
    },
  }))
  applyLegalAgent(live, { appData, validateContracts: true })
  await live.plugin(RepeatToolReminderModule, {
    thresholds: [3, 5, 8],
    include: [],
    exclude: [],
    argumentsPreviewChars: 500,
  })

  live.on('user-questions/request', (async (request: unknown, next: () => Promise<unknown>) => {
    question.invocationCount += 1
    if (question.invocationCount !== 1 || question.value !== null) {
      throw new Error('the synthetic lawyer was asked more than once')
    }
    const body = asRecord(request)
    const questions = asArray(body.questions).map(asRecord)
    if (questions.length !== QUESTION_IDS.length) {
      throw new Error('general-drafting did not ask all three declared questions together')
    }
    const ids = questions.map((item, index) => asString(item.id, `question ${index + 1} id`))
    if (
      new Set(ids).size !== ids.length
      || JSON.stringify([...ids].sort()) !== JSON.stringify([...QUESTION_IDS].sort())
    ) {
      throw new Error(`question IDs are not exactly ${QUESTION_IDS.join(',')}`)
    }
    const options = questions.flatMap(item => asArray(item.options ?? []).map(asRecord))
    const optionLabels = options.map((option, index) => asString(option.label, `option ${index + 1} label`))
    const answers = ids.map(id => {
      if (!QUESTION_IDS.includes(id as QuestionId)) throw new Error(`unknown question ID ${id}`)
      return {
        id,
        selected: [],
        custom: QUESTION_ANSWERS[id as QuestionId],
      }
    })
    question.value = {
      questionIds: ids,
      questionText: questions.map(item => asString(item.question, 'question text')).join('\n'),
      optionLabels,
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
    SessionLogOffset: SessionModule.SessionLogOffset,
    persistenceRoot,
    workspaceRoot,
    remote,
    reopenPersistedEvents,
    questionsBeforeReadDenial,
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
    materialsScan: {
      method: 'materialsScan',
      http: 'POST',
      path: '/api/materials/scan',
      contract: 'materials_scan',
      timeoutMs: 600_000,
    },
    materialsList: {
      method: 'materialsList',
      http: 'GET',
      path: '/api/materials',
      contract: 'materials_list',
    },
    requestScope: {
      method: 'requestScope',
      http: 'POST',
      path: '/api/request/scope',
      contract: 'request_scope',
    },
    taskCreate: {
      method: 'taskCreate',
      http: 'POST',
      path: '/api/task',
      contract: 'task_create',
    },
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

function eventMessageText(event: NativeEvent): string {
  let message: Record<string, unknown>
  if (event.type === 'user/message') {
    message = asRecord(event.data)
  } else if (event.type === 'assistant/message' || event.type === 'tool/result') {
    message = asRecord(asRecord(event.data).message)
  } else {
    throw new Error(`event type has no message text: ${event.type}`)
  }
  return asArray(message.content ?? [])
    .flatMap(part => {
      const row = asRecord(part)
      return row.type === 'text' && typeof row.text === 'string' ? [row.text] : []
    })
    .join('')
}

function requestIdFromEvent(event: NativeEvent): string | undefined {
  if (event.type !== 'user/message') return undefined
  const source = asRecord(event.data).source
  if (source === null || typeof source !== 'object') return undefined
  const row = source as Record<string, unknown>
  return row.kind === 'user' && typeof row.rpcId === 'string' ? row.rpcId : undefined
}

function requestHeaderAtBoundary(
  session: {
    readonly id: string
    snapshotEvents(offset?: unknown, endOffset?: unknown): readonly NativeEvent[]
  },
  offsetFactory: (offset: number) => unknown,
  beforeSeq: number,
  afterSeq: number,
  turnEvents: readonly NativeEvent[],
): unknown {
  if (afterSeq <= beforeSeq || beforeSeq < 0) throw new Error('invalid native turn boundary')
  const prefix = session.snapshotEvents(offsetFactory(0), offsetFactory(afterSeq))
  const source = prefix.findLast(event => event.type === 'request/header')
  if (source === undefined || source.seq < 0 || source.seq >= afterSeq) {
    throw new Error('turn has no authoritative request/header')
  }
  const hadPrior = prefix.some(event => event.type === 'request/header' && event.seq < beforeSeq)
  const current = turnEvents.findLast(event => event.type === 'request/header')
  if (!hadPrior && current?.seq !== source.seq) {
    throw new Error('first turn lacks its current request/header')
  }
  return source.data
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
      seq: event.seq,
      argumentsSha256: sha256Bytes(JSON.stringify(data.arguments ?? null)),
    })
  }
  return calls
}

function toolArguments(event: NativeEvent): Record<string, unknown> {
  if (event.type !== 'tool/call') throw new Error('expected a tool call event')
  const data = asRecord(event.data)
  if (typeof data.arguments === 'string') return asRecord(JSON.parse(data.arguments))
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
  return asRecord(JSON.parse(eventMessageText(result)))
}

function toolResultRecord(events: readonly NativeEvent[], callId: string): {
  readonly seq: number
  readonly isError: boolean
  readonly text: string
} {
  const result = events.find(event => {
    if (event.type !== 'tool/result') return false
    const source = asRecord(asRecord(event.data).message).source
    return source !== null
      && typeof source === 'object'
      && asRecord(source).callId === callId
  })
  if (result === undefined) throw new Error(`tool result is missing for ${callId}`)
  const message = asRecord(asRecord(result.data).message)
  return {
    seq: result.seq,
    isError: message.isError === true,
    text: eventMessageText(result),
  }
}

// FINITE_GENERAL_READ_TIMELINE_CLASSIFIER_BEGIN
export function classifyGeneralReadTimeline(
  input: GeneralReadTimelineInput,
): readonly string[] {
  const declaredIds = [...input.declaredQuestionIds]
  if (
    declaredIds.length !== 3
    || declaredIds.some(id => id.length === 0)
    || new Set(declaredIds).size !== declaredIds.length
  ) {
    throw new Error('general read timeline requires exactly three declared question IDs')
  }
  if (
    !Number.isSafeInteger(input.askCallSeq)
    || input.askCallSeq <= 0
    || !Number.isSafeInteger(input.askResultSeq)
    || input.askResultSeq <= input.askCallSeq
  ) {
    throw new Error('general read timeline requires the actual question and answer sequences')
  }
  const denialReason = input.questionsBeforeReadDenial([...declaredIds])
  if (typeof denialReason !== 'string' || denialReason.length === 0) {
    throw new Error('the current Agent read-gate denial is unavailable')
  }

  const callsById = new Map<string, {
    readonly call: ToolCallRecord
    readonly event: NativeEvent
  }>()
  for (const call of toolCallsFromEvents(input.events)) {
    if (callsById.has(call.callId)) throw new Error(`duplicate tool call ID ${call.callId}`)
    const event = input.events.find(candidate => (
      candidate.type === 'tool/call'
      && asRecord(candidate.data).callId === call.callId
    ))
    if (event === undefined) throw new Error(`tool call event is missing for ${call.callId}`)
    callsById.set(call.callId, { call, event })
  }

  const resultsByCallId = new Map<string, NativeEvent[]>()
  for (const event of input.events) {
    if (event.type !== 'tool/result') continue
    const message = asRecord(asRecord(event.data).message)
    const source = asRecord(message.source)
    if (source.kind !== 'tool') throw new Error('tool result has an unknown source origin')
    const sourceCallId = asString(source.callId, 'tool result source callId')
    const resultCallId = asString(message.toolCallId, 'tool result callId')
    if (sourceCallId !== resultCallId) {
      throw new Error(`tool result callId mismatch for ${sourceCallId}`)
    }
    const call = callsById.get(sourceCallId)
    if (call === undefined || event.seq <= call.call.seq) {
      throw new Error(`unstably paired tool result for ${sourceCallId}`)
    }
    if (typeof message.isError !== 'boolean') {
      throw new Error(`tool result status is missing for ${sourceCallId}`)
    }
    if (
      message.isError
      && call.call.name !== 'case_read_material'
      && call.call.name !== 'case_read_wiki'
    ) {
      throw new Error(`unknown tool error for ${sourceCallId}`)
    }
    const rows = resultsByCallId.get(sourceCallId) ?? []
    if (rows.length !== 0) throw new Error(`duplicate tool result for ${sourceCallId}`)
    rows.push(event)
    resultsByCallId.set(sourceCallId, rows)
  }

  const askCall = callsById.get(input.askCallId)
  if (
    askCall === undefined
    || askCall.call.name !== 'ask_user_question'
    || askCall.call.seq !== input.askCallSeq
  ) {
    throw new Error('the actual ask_user_question call is missing')
  }
  const askArguments = toolArguments(askCall.event)
  const askedIds = asArray(askArguments.questions ?? [])
    .map((row, index) => asString(asRecord(row).id, `asked question ${index + 1} id`))
  const expectedIds = JSON.stringify([...declaredIds].sort())
  if (
    askedIds.length !== declaredIds.length
    || JSON.stringify([...askedIds].sort()) !== expectedIds
  ) {
    throw new Error('the ask_user_question IDs differ from the declared three IDs')
  }
  const askResults = resultsByCallId.get(input.askCallId) ?? []
  const askResult = askResults[0]
  if (askResults.length !== 1 || askResult === undefined || askResult.seq !== input.askResultSeq) {
    throw new Error('the actual question answer result is missing or out of turn')
  }
  const askMessage = asRecord(asRecord(askResult.data).message)
  if (askMessage.isError !== false) throw new Error('the actual question callback failed')
  const answerPayload = asRecord(JSON.parse(eventMessageText(askResult)))
  const answerRows = asArray(answerPayload.answers).map(asRecord)
  const answerIds = answerRows.map((row, index) => (
    asString(row.id, `answer ${index + 1} id`)
  ))
  if (
    answerRows.length !== declaredIds.length
    || JSON.stringify([...answerIds].sort()) !== expectedIds
  ) {
    throw new Error('the actual answer IDs differ from the declared three IDs')
  }
  for (const answer of answerRows) {
    if (
      !Array.isArray(answer.selected)
      || answer.selected.some(value => typeof value !== 'string')
      || typeof answer.custom !== 'string'
      || (
        !answer.selected.some(value => value.trim().length > 0)
        && answer.custom.trim().length === 0
      )
    ) {
      throw new Error('the actual question callback did not contain a valid answer')
    }
  }

  const successfulMaterialCallIds: string[] = []
  for (const { call } of callsById.values()) {
    if (call.name !== 'case_read_material' && call.name !== 'case_read_wiki') continue
    const results = resultsByCallId.get(call.callId) ?? []
    const result = results[0]
    if (results.length !== 1 || result === undefined) {
      throw new Error(`tool result is missing for ${call.callId}`)
    }
    const message = asRecord(asRecord(result.data).message)
    if (typeof message.isError !== 'boolean') {
      throw new Error(`tool result status is missing for ${call.callId}`)
    }
    if (message.isError) {
      if (
        result.seq >= input.askResultSeq
        || eventMessageText(result) !== `Error: ${denialReason}`
      ) {
        throw new Error(`unknown or late read error for ${call.callId}`)
      }
      continue
    }
    if (call.seq <= input.askResultSeq || result.seq <= input.askResultSeq) {
      throw new Error(`successful read preceded the actual answers for ${call.callId}`)
    }
    if (call.name === 'case_read_material') successfulMaterialCallIds.push(call.callId)
  }
  return successfulMaterialCallIds
}
// FINITE_GENERAL_READ_TIMELINE_CLASSIFIER_END

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

function parseTaskCoverage(
  value: unknown,
  readRows: readonly Record<string, unknown>[],
  materials: readonly MaterialReadRecord[],
): Record<string, unknown> {
  const coverage = asRecord(value)
  const requiredKeys = ['total', 'fully_read', 'partially_read', 'not_read', 'unreadable']
  if (Object.keys(coverage).sort().join('\u0000') !== [...requiredKeys].sort().join('\u0000')) {
    throw new Error('task coverage keys differ from common.schema.json')
  }
  if (asInteger(coverage.total, 'coverage total') !== 5) {
    throw new Error('task coverage total is not the five current materials')
  }
  const groups = ['fully_read', 'partially_read', 'not_read', 'unreadable'] as const
  const categoryByName = new Map<string, string>()
  const partialByName = new Map<string, { readonly readUnits: number; readonly totalUnits: number }>()
  for (const group of groups) {
    for (const raw of asArray(coverage[group])) {
      let name: string
      if (group === 'partially_read') {
        const row = asRecord(raw)
        if (Object.keys(row).sort().join('\u0000') !== ['name', 'read_units', 'total_units'].sort().join('\u0000')) {
          throw new Error('partially_read row has fields outside the coverage schema')
        }
        name = asString(row.name, 'partial name')
        const readUnits = asInteger(row.read_units, 'partial read_units')
        const totalUnits = asInteger(row.total_units, 'partial total_units')
        if (readUnits < 0 || totalUnits < 1 || readUnits >= totalUnits) {
          throw new Error('partial read range is not truthful')
        }
        partialByName.set(name, { readUnits, totalUnits })
      } else if (group === 'unreadable') {
        const row = asRecord(raw)
        if (Object.keys(row).sort().join('\u0000') !== ['name', 'reason'].sort().join('\u0000')) {
          throw new Error('unreadable row has fields outside the coverage schema')
        }
        name = asString(row.name, 'unreadable name')
        if (asString(row.reason, 'unreadable reason').trim().length === 0) {
          throw new Error('unreadable material has no reason')
        }
      } else {
        name = asString(raw, `${group} name`)
      }
      if (name.length === 0 || categoryByName.has(name)) {
        throw new Error(`coverage repeats or omits material ${name}`)
      }
      categoryByName.set(name, group)
    }
  }
  if (
    categoryByName.size !== 5
    || JSON.stringify([...categoryByName.keys()].sort())
      !== JSON.stringify([...MATERIAL_NAMES].sort())
  ) {
    throw new Error('coverage does not describe exactly the five current materials')
  }
  const readUnitsByMaterial = new Map<string, Set<number>>()
  for (const row of readRows) {
    const materialId = asString(row.material_id, 'read material_id')
    const from = asInteger(row.from, 'read from')
    const to = asInteger(row.to, 'read to')
    const units = readUnitsByMaterial.get(materialId) ?? new Set<number>()
    for (let unit = from; unit <= to; unit += 1) units.add(unit)
    readUnitsByMaterial.set(materialId, units)
  }
  for (const material of materials) {
    const readUnits = readUnitsByMaterial.get(material.materialId)?.size ?? 0
    const category = categoryByName.get(material.name)
    if (category === 'unreadable') throw new Error(`${material.name} is parsed and cannot be unreadable`)
    if (readUnits === 0) {
      if (category !== 'not_read') throw new Error(`${material.name} has no read but coverage says ${String(category)}`)
      continue
    }
    if (readUnits === material.unitCount) {
      if (category !== 'fully_read') throw new Error(`${material.name} is fully read but coverage says ${String(category)}`)
      continue
    }
    const partial = partialByName.get(material.name)
    if (
      category !== 'partially_read'
      || partial === undefined
      || partial.readUnits !== readUnits
      || partial.totalUnits !== material.unitCount
    ) {
      throw new Error(`${material.name} coverage does not match actual read ranges`)
    }
  }
  return coverage
}

function assertDraftMachineChecks(
  text: string,
  citations: readonly Record<string, unknown>[],
): Record<string, boolean> {
  const checks = {
    hasTitle: /^(?:#\s*)?(?:标题[：:]\s*)?律师函/m.test(text),
    hasRecipient: text.includes('王某丙'),
    hasRecipientAddress: text.includes('虚构市虚构区无此巷16号'),
    hasLender: text.includes('李某乙'),
    hasPrincipal: /(?:80,000|80000|8万|八万|捌万)/.test(text),
    hasRepayment: /(?:20,000|20000|2万|二万|两万|贰万)/.test(text),
    hasRemainingPrincipal: /(?:60,000|60000|6万|六万|陆万)/.test(text),
    hasDueDate: text.includes('2025年9月10日'),
    hasSevenDayDemand: /(?:7日|七日)/.test(text),
    hasOverdueInterest: text.includes('逾期利息'),
    hasLawfulConsequence: /(?:诉讼|仲裁|依法|法律途径)/.test(text),
    hasLegalVerificationPlaceholder: text.includes('法律依据待律师核实'),
    hasMissingFieldPlaceholder: text.includes('【待补充'),
    excludesExplicitCoerciveRequest: !/(举报|偷税|漏税|曝光)/.test(text),
    citesLoanSource: citations.some(row => row.name === '借条'),
    citesRepaymentSource: citations.some(row => (
      row.name === '还款记录' || row.name === '银行流水'
    )),
  }
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name)
  if (failed.length > 0) throw new Error(`draft machine checks failed: ${failed.join(',')}`)
  return checks
}

function summarizeNetwork(
  observations: readonly NetworkObservation[],
  denied: number,
): RunReport['networkSummary'] {
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

function canonicalPrompt(text: string): string {
  const match = /\r?\n---\r?\n/.exec(text)
  if (match === null || match.index === undefined) throw new Error('canonical task separator is missing')
  const prompt = text.slice(0, match.index).trimEnd()
  if (
    !prompt.startsWith('# 任务说明')
    || prompt.includes('以下为测试说明')
    || prompt.includes('派生自 `tests')
    || !prompt.includes('律师函')
    || !prompt.includes('王某丙')
  ) {
    throw new Error('canonical user prompt includes test explanation or lacks the task')
  }
  return prompt
}

async function runNativeGeneralDrafting(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== '--credential-stdin') {
    throw new Error('usage: native-general-drafting.mts --credential-stdin')
  }
  await assertDirectoryNotReparse(EVIDENCE_DIR)
  const runRoot = await mkdtemp(join(EVIDENCE_DIR, 'run-'))
  await assertDirectoryNotReparse(runRoot)
  if ((await readdir(runRoot)).length !== 0) throw new Error('fresh private run root is not empty')

  const initial = await verifyFixedInputs()
  const manifest = initial.manifest
  const promptText = canonicalPrompt(await readFile(manifest.canonicalTask.path, 'utf8'))
  const network: NetworkObservation[] = []
  const apiCalls: ApiObservation[] = []
  const fetchGate: FetchGate = { modelEnabled: false, deniedAttempts: 0 }
  const fetchLease = installFetchAllowlist(network, fetchGate)
  const cleanupFailures: string[] = []
  const blocked = new Map<string, string>()
  const question: QuestionCapture = { value: null, invocationCount: 0 }
  let secret = ''
  let secretReader: SecretReaderState | undefined
  let outputRedaction: OutputRedactionLease | undefined
  let service: BServiceLease | undefined
  let production: any
  let browser: any
  let agent: any
  let sessionId = ''
  let caseId = ''
  let taskId = ''
  let liveEvents: readonly NativeEvent[] = []
  let browserDisposed = false
  let contextDisposed = false
  let bStopped = false
  let agentJoined = false
  let environmentRestored = false
  let environment: EnvironmentLease | undefined

  const report: RunReport = {
    format: 'lawbench-t18-general-drafting-native-report-v1',
    task: TASK_NAME,
    status: 'RUNNING',
    authoredStatus: 'AUTHORED_NOT_RUN',
    startedAtUtc: processBirthUtc(),
    process: {
      executable: process.execPath,
      pid: process.pid,
      birthUtc: processBirthUtc(),
      node: process.version,
      cwd: process.cwd(),
    },
    fixture: {
      syntheticOnly: true,
      freshCase: true,
      freshNativeSession: true,
      materialNames: [...MATERIAL_NAMES],
      materialCopiesBeforeCaseOpen: true,
      materialImportCalls: 0,
    },
    modelRoute: {
      provider: PROVIDER,
      model: MODEL,
      baseURL: MODEL_URL,
      thinking: '中',
      contextWindow: 131_072,
      maxTokens: TASK_MAX_TOKENS,
      modelCallsPerSkill: MODEL_CALL_LIMIT,
      requestTimeoutMs: 1_200_000,
      streamIdleTimeoutMs: 1_200_000,
    },
    runRoot,
    admission: { initial: initial.admission },
    originalInputsHeld: false,
    prompt: {
      source: manifest.canonicalTask.path,
      sha256: sha256Bytes(promptText),
      length: promptText.length,
      excludesTestExplanation: true,
    },
    modelPosts: { attempts: 0, http200: 0, observations: [] },
    networkSummary: {
      observations: 0,
      modelPostAttempts: 0,
      modelPostHttp200: 0,
      coreCalls: 0,
      healthCalls: 0,
      deniedAttempts: 0,
    },
    apiCalls,
    secondaryErrors: [],
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
      actualSingleGeneralDraftingConsumer: false,
      actualModelAuthoredDraft: false,
      businessAcceptance: false,
      legalAcceptance: false,
      manualFactArithmeticThreatFormatReviewRequired: true,
      fullT18: false,
      gate1: 'INCOMPLETE',
      packaging: 'HOLD',
      gui: false,
    },
  }

  try {
    const caseRoot = join(runRoot, 'case')
    const pythonExe = manifest.runtimeExecutables.find(entry => entry.role === 'python')?.path
    const nodeExe = manifest.runtimeExecutables.find(entry => entry.role === 'node')?.path
    const personaPath = manifest.dependencies.find(entry => entry.role === 'persona')?.path
    if (pythonExe === undefined || nodeExe === undefined || personaPath === undefined) {
      throw new Error('fixed manifest lacks Python, Node, or persona')
    }
    if (pathKey(nodeExe) !== pathKey(process.execPath)) {
      throw new Error('consumer was not started with the pinned Node executable')
    }
    const personaPrefix = (await readFile(personaPath, 'utf8'))
      .replace(/^【草稿[^\n]*\n+/, '')
      .trim()
    if (!personaPrefix.includes('律所的所内助手') && !personaPrefix.includes('律所内部的案件助手')) {
      throw new Error('production persona prefix is absent')
    }

    environment = await isolateProcessFiles(runRoot)
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
        if (secret.length === 0) throw new Error('model credential requested before stdin readiness')
        return secret
      },
      network,
      apiCalls,
      question,
      blocked,
    )
    const remote = production.remote
    const opened = apiOk(await remote.callApi(apiRoute('caseOpen'), {
      path: caseRoot,
      template: 'civil',
      kind: 'civil',
    }), 'caseOpen')
    caseId = asString(opened.case_id, 'case_id')
    if (opened.created !== true || opened.kind !== 'civil') {
      throw new Error('fresh private case was not created by the real CaseRegistry')
    }
    apiOk(await remote.callApi(apiRoute('materialsScan'), { case_id: caseId }), 'materialsScan')
    const listed = apiOk(await remote.callApi(apiRoute('materialsList'), {
      case_id: caseId,
    }), 'materialsList')
    const rows = asArray(listed.materials).map(asRecord)
    if (rows.length !== 5) throw new Error('current material list is not exactly five')
    const indexedMaterials = await ownedMaterialIndex(caseRoot, caseId)
    const materialReads: MaterialReadRecord[] = rows.map((row, index) => {
      const name = asString(row.name, `material ${index + 1} name`)
      const materialId = asString(row.material_id, `material ${name} id`)
      const indexed = indexedMaterials.get(materialId)
      if (
        indexed === undefined
        || indexed.name !== name
        || indexed.rel_path !== row.rel_path
        || indexed.type !== row.type
        || indexed.unit !== row.unit
        || indexed.unit_count !== row.unit_count
        || indexed.status !== row.status
      ) {
        throw new Error(`material ${name} does not match its owned index record`)
      }
      const version = asString(indexed.sha256, `indexed material ${name} sha256`)
      const source = manifest.materials.find(entry => (
        entry.name === name && entry.sha256 === version
      ))
      if (source === undefined) throw new Error(`material ${name} is outside the approved five rows`)
      if (
        row.status !== 'parsed'
        || row.error !== null
        || asArray(row.pages_need_ocr).length !== 0
      ) {
        throw new Error(`material ${name} did not parse as a current text material`)
      }
      const relPath = asString(row.rel_path, `material ${name} rel_path`)
      if (extname(relPath).toLowerCase() !== '.txt') throw new Error(`material ${name} is not text`)
      return {
        materialId,
        name,
        type: asString(row.type, `material ${name} type`),
        unit: asString(row.unit, `material ${name} unit`),
        unitCount: asInteger(row.unit_count, `material ${name} unit_count`),
        relPath,
        originalPath: join(caseRoot, ...relPath.split('/')),
        originalBytes: source.bytes,
        originalSha256: source.sha256,
        sourceMtimeNs: asString(source.mtime_ns, `${name} source mtime_ns`),
      }
    })
    if (
      JSON.stringify(materialReads.map(row => row.name).sort())
      !== JSON.stringify([...MATERIAL_NAMES].sort())
    ) {
      throw new Error('runtime material names differ from the approved five')
    }
    for (const material of materialReads) {
      await ordinaryFileIdentity(
        material.originalPath,
        material.originalBytes,
        material.originalSha256,
        material.sourceMtimeNs,
      )
    }
    const materialIds = materialReads
      .map(row => row.materialId)
      .sort()
    if (new Set(materialIds).size !== 5) throw new Error('runtime material IDs are not unique')
    const originalArea = (await listFiles(caseRoot)).filter(path => (
      !path.startsWith('工作区/')
      && !path.startsWith('成果/')
      && !path.split('/').some(part => part.startsWith('.'))
    ))
    if (
      JSON.stringify(originalArea)
      !== JSON.stringify(materialReads.map(row => row.relPath).sort())
    ) {
      throw new Error(`case original area contains extra data: ${JSON.stringify(originalArea)}`)
    }
    report.case = {
      caseId,
      path: caseRoot,
      materialIds,
      materials: materialReads,
      originalAreaFiles: originalArea,
      caseDb: {
        path: join(caseRoot, '工作区', 'case.db'),
        bytes: 0,
        sha256: '',
      },
    }

    const skills = asRecord(await remote.listSkills())
    if (skills.ok !== true) throw new Error('production Skill listing failed')
    if (!asArray(asRecord(skills.value).skills).some(raw => asRecord(raw).name === SKILL)) {
      throw new Error(`${SKILL} is absent from the production Skill catalog`)
    }
    const declaredQuestions = asArray(await remote.skillQuestions(SKILL)).map(asRecord)
    if (
      JSON.stringify(declaredQuestions.map(row => row.key).sort())
      !== JSON.stringify([...QUESTION_IDS].sort())
    ) {
      throw new Error('current Host Skill catalog does not declare the exact three question IDs')
    }
    const taskParams = {
      thinking: '中',
      window: '128K',
      max_tokens: TASK_MAX_TOKENS,
      temperature: 0.6,
    }
    const created = await withWatchdog(production.commands.create({ cwd: caseRoot })) as {
      readonly sessionId: string
    }
    sessionId = String(created.sessionId)
    const uuid = SESSION_WITH_UUID.exec(sessionId)?.[1]
    if (uuid === undefined || !UUID_V4.test(uuid)) {
      throw new Error('production create did not mint a fresh UUID Native Session')
    }
    const nativeSession = production.live.sessions.get(sessionId)
    agent = production.live.agents.get(sessionId)
    if (nativeSession === undefined || agent === undefined) {
      throw new Error('fresh production Session/Agent was not published')
    }
    if (String(nativeSession.header.cwd) !== caseRoot) {
      throw new Error('fresh Native Session cwd is not the private case')
    }
    browser = new production.BrowserSession(nativeSession.id, {})
    browser.handleRunning(true)
    report.session = {
      sessionId,
      uuid,
      cwd: caseRoot,
      freshCreated: true,
    }

    const selected = apiOk(await remote.callApi(apiRoute('taskCreate'), {
      case_id: caseId,
      session_id: sessionId,
      entry: null,
      skill: SKILL,
      inputs: [],
      params: taskParams,
    }), 'taskCreate')
    const selectionId = asString(selected.task_id, 'task selection id')
    if (!TASK_ID.test(selectionId)) throw new Error('task selection ID is invalid')
    const submission = browser.beginSubmission({
      mode: 'queue',
      text: promptText,
      attachments: [],
    })
    const requestId = String(submission.requestId)
    if (!UUID_V4.test(requestId)) throw new Error('BrowserSession did not mint a UUID v4 R')
    apiOk(await remote.callApi(apiRoute('requestScope'), {
      action: 'prepare',
      case_id: caseId,
      session_id: sessionId,
      request_id: requestId,
      material_ids: materialIds,
    }), 'requestScope prepare')

    const beforeSeq = Number(nativeSession.seq)
    const modelNetworkStart = network.length
    await withWatchdog(production.commands.prompt({
      sessionId,
      requestId: submission.requestId,
      mode: 'queue',
      content: [{ type: 'text', text: promptText }],
    }))
    await withWatchdog(agent.whenIdle())
    agentJoined = true
    const afterSeq = Number(nativeSession.seq)
    if (afterSeq <= beforeSeq) throw new Error('native turn appended no events')
    const turnEvents = nativeSession.snapshotEvents(
      production.SessionLogOffset(beforeSeq),
      production.SessionLogOffset(afterSeq),
    ) as readonly NativeEvent[]
    const header = asRecord(requestHeaderAtBoundary(
      nativeSession,
      production.SessionLogOffset,
      beforeSeq,
      afterSeq,
      turnEvents,
    ))
    const headerConfig = asRecord(asRecord(header.header).config)
    if (
      headerConfig.provider !== PROVIDER
      || headerConfig.model !== MODEL
      || headerConfig.maxTokens !== TASK_MAX_TOKENS
    ) {
      throw new Error('request/header does not carry the exact route and max tokens')
    }
    const eventTypes = turnEvents.map(event => event.type)
    for (const required of ['turn/start', 'user/message', 'assistant/message', 'turn/end']) {
      if (!eventTypes.includes(required)) throw new Error(`native turn lacks ${required}`)
    }
    const userEvent = turnEvents.findLast(event => requestIdFromEvent(event) === requestId)
    if (userEvent === undefined || eventMessageText(userEvent) !== promptText) {
      throw new Error('native user message is not the exact canonical prompt and current R')
    }
    const end = asRecord(turnEvents.findLast(event => event.type === 'turn/end')!.data)
    if (asRecord(end.reason).kind !== 'completed') {
      throw new Error(`native turn ended with ${String(asRecord(end.reason).kind)}`)
    }
    const responseText = eventMessageText(turnEvents.findLast(event => event.type === 'assistant/message')!)
    if (responseText.trim().length === 0) throw new Error('native turn produced no assistant text')
    liveEvents = nativeSession.snapshotEvents() as readonly NativeEvent[]
    const toolCalls = toolCallsFromEvents(turnEvents)
    for (const requiredTool of [
      'skill',
      'ask_user_question',
      'case_list_materials',
      'case_read_material',
      'case_save_draft',
    ]) {
      if (!toolCalls.some(call => call.name === requiredTool)) {
        throw new Error(`actual tool loop lacks ${requiredTool}`)
      }
    }
    if (!turnEvents.some(event => skillNameFromCall(event) === SKILL)) {
      throw new Error(`the Skill tool did not load ${SKILL}`)
    }
    const runtimeSkill = manifest.dependencies.find(entry => entry.role === 'general-drafting-skill')
    if (
      runtimeSkill === undefined
      || runtimeSkill.bytes !== manifest.skill.bytes
      || runtimeSkill.sha256 !== manifest.skill.sha256
    ) {
      throw new Error('runtime general-drafting Skill identity differs from the approved input')
    }
    report.skillSource = {
      name: SKILL,
      path: runtimeSkill.path,
      bytes: runtimeSkill.bytes,
      sha256: runtimeSkill.sha256,
      listed: true,
      loaded: true,
    }
    const capturedQuestion = question.value
    if (capturedQuestion === null || question.invocationCount !== 1) {
      throw new Error('the three declared lawyer questions were not asked exactly once')
    }
    const askCalls = toolCalls.filter(call => call.name === 'ask_user_question')
    if (askCalls.length !== 1) throw new Error('native turn does not contain exactly one ask_user_question call')
    const askCall = askCalls[0]!
    const askResult = toolResultRecord(turnEvents, askCall.callId)
    if (askResult.isError) throw new Error('the actual ask_user_question callback failed')
    const answerPayload = asRecord(JSON.parse(askResult.text))
    const answers = asArray(answerPayload.answers).map(asRecord)
    if (
      answers.length !== QUESTION_IDS.length
      || JSON.stringify([...capturedQuestion.answerIds].sort())
        !== JSON.stringify([...QUESTION_IDS].sort())
      || JSON.stringify(answers.map(row => row.id).sort())
        !== JSON.stringify([...QUESTION_IDS].sort())
    ) {
      throw new Error('lawyer callback answer IDs do not match the exact three declarations')
    }
    for (const answer of answers) {
      const id = asString(answer.id, 'answer id')
      if (!QUESTION_IDS.includes(id as QuestionId)) throw new Error(`unknown answer ID ${id}`)
      if (
        !Array.isArray(answer.selected)
        || answer.selected.some(value => typeof value !== 'string')
        || answer.custom !== QUESTION_ANSWERS[id as QuestionId]
      ) {
        throw new Error(`answer content for ${id} changed after callback capture`)
      }
    }
    const saveCalls = toolCalls.filter(call => call.name === 'case_save_draft')
    if (saveCalls.length === 0) throw new Error('native turn contains no case_save_draft call')
    for (const saveCall of saveCalls) {
      const result = toolResultRecord(turnEvents, saveCall.callId)
      if (!result.isError && saveCall.seq < askResult.seq) {
        throw new Error('a successful draft save preceded the lawyer answer result')
      }
    }
    report.question = {
      callId: askCall.callId,
      questionIds: capturedQuestion.questionIds,
      answerIds: capturedQuestion.answerIds,
      questionTextSha256: sha256Bytes(capturedQuestion.questionText),
      answerTextSha256: sha256Bytes(capturedQuestion.answerText),
      beforeFirstSuccessfulSave: true,
    }

    let completedTask: Record<string, unknown> | undefined
    for (let attempt = 0; attempt < 1_200; attempt += 1) {
      const taskList = apiOk(await remote.callApi(apiRoute('tasksList'), {
        case_id: caseId,
      }), 'tasksList')
      const candidates = asArray(taskList.tasks)
        .map(asRecord)
        .filter(task => (
          task.skill === SKILL
          && task.task_id !== selectionId
          && task.status === 'completed'
        ))
      if (candidates.length > 1) throw new Error('more than one completed general-drafting task exists')
      completedTask = candidates[0]
      if (completedTask !== undefined) break
      await new Promise(done => setTimeout(done, 100))
    }
    if (completedTask === undefined) throw new Error('general-drafting task produced no completed task')
    taskId = asString(completedTask.task_id, 'task_id')
    if (
      !TASK_ID.test(taskId)
      || taskId === selectionId
      || completedTask.status !== 'completed'
    ) {
      throw new Error('general-drafting task identity or terminal state is invalid')
    }
    const taskDir = join(caseRoot, '工作区', '任务', taskId)
    const taskData = asRecord(JSON.parse(await readFile(join(taskDir, 'task.json'), 'utf8')))
    const result = asRecord(JSON.parse(await readFile(join(taskDir, 'result.json'), 'utf8')))
    const reads = asRecord(JSON.parse(await readFile(join(taskDir, 'reads.json'), 'utf8')))
    const budget = asRecord(taskData.budget)
    const scope = asRecord(taskData.request_scope)
    const scopeMaterials = asArray(scope.materials).map(asRecord)
    const expectedVersions = new Map(materialReads.map(row => [row.materialId, row.originalSha256]))
    if (
      taskData.state !== 'finished'
      || taskData.kind !== 'agent'
      || taskData.case_id !== caseId
      || taskData.session_id !== sessionId
      || taskData.request_id !== requestId
      || taskData.skill !== SKILL
      || JSON.stringify(taskData.inputs) !== '[]'
      || JSON.stringify(taskData.params) !== JSON.stringify(taskParams)
      || budget.model_calls !== MODEL_CALL_LIMIT
      || budget.tool_calls !== TOOL_CALL_LIMIT
      || budget.minutes !== TASK_MINUTES
      || scope.request_id !== requestId
      || scope.case_id !== caseId
      || scope.kind !== 'materials'
      || scopeMaterials.length !== 5
      || scopeMaterials.some(row => expectedVersions.get(String(row.material_id)) !== row.sha256)
    ) {
      throw new Error('persisted task, exact scope, params, or budget is invalid')
    }
    if (result.status !== 'completed') throw new Error(`persisted task result is ${String(result.status)}`)
    const citationCheck = asRecord(result.citation_check)
    const citationStats = asRecord(citationCheck.stats)
    if (
      citationCheck.passed !== true
      || citationStats.must_fix !== 0
    ) {
      throw new Error('draft citation check did not reach must_fix=0')
    }
    const coverage = parseTaskCoverage(
      result.coverage,
      asArray(reads.reads).map(asRecord),
      materialReads,
    )
    report.coverage = coverage
    report.reads = reads.reads

    const readRows = asArray(reads.reads).map(asRecord)
    if (readRows.length === 0) throw new Error('general-drafting task has no actual material reads')
    for (const row of readRows) {
      const materialId = asString(row.material_id, 'read material_id')
      const material = materialReads.find(item => item.materialId === materialId)
      const from = asInteger(row.from, 'read from')
      const to = asInteger(row.to, 'read to')
      if (
        material === undefined
        || row.material_version !== material.originalSha256
        || row.unit !== material.unit
        || from < 1
        || to < from
        || to > material.unitCount
      ) {
        throw new Error('read record is outside the current material identity')
      }
    }
    const successfulMaterialCallIds = classifyGeneralReadTimeline({
      events: turnEvents,
      declaredQuestionIds: capturedQuestion.questionIds,
      askCallId: askCall.callId,
      askCallSeq: askCall.seq,
      askResultSeq: askResult.seq,
      questionsBeforeReadDenial: production.questionsBeforeReadDenial as QuestionsBeforeReadDenial,
    })
    const successfulMaterialCallIdSet = new Set(successfulMaterialCallIds)
    const materialCalls = toolCalls.filter(call => (
      call.name === 'case_read_material'
      && successfulMaterialCallIdSet.has(call.callId)
    ))
    const sourceReads: NonNullable<RunReport['sourceReads']>[number][] = []
    const sourceTextByName = new Map<string, string>()
    const sourceNamesByCallId = new Map<string, readonly string[]>()
    for (const call of materialCalls) {
      const event = turnEvents.find(candidate => (
        candidate.type === 'tool/call'
        && asRecord(candidate.data).callId === call.callId
      ))!
      const args = toolArguments(event)
      const firstName = asString(args.name, 'material read name')
      const requestedNames = [
        firstName,
        ...(args.more_names === undefined
          ? []
          : asArray(args.more_names).map((name, index) => asString(name, `more name ${index + 1}`))),
      ]
      const resultValue = toolResultValue(turnEvents, call.callId)
      const resultText = JSON.stringify(resultValue)
      const names = resultValue.parts === undefined
        ? requestedNames
        : asArray(resultValue.parts)
          .map(asRecord)
          .filter(part => part.read === true)
          .map((part, index) => asString(part.name, `read part ${index + 1} name`))
      if (names.length === 0) throw new Error(`case_read_material call ${call.callId} reported no actual read`)
      for (const name of names) {
        if (!MATERIAL_NAMES.includes(name as typeof MATERIAL_NAMES[number])) {
          throw new Error(`model read an unapproved material name ${name}`)
        }
        sourceTextByName.set(name, `${sourceTextByName.get(name) ?? ''}\n${resultText}`)
      }
      sourceNamesByCallId.set(call.callId, names)
      sourceReads.push({
        names,
        textSha256: sha256Bytes(resultText),
        textLength: resultText.length,
      })
    }
    const loanRead = sourceTextByName.get('借条') ?? ''
    if (
      !/(?:捌万元整|80,000|80000)/.test(loanRead)
      || !loanRead.includes('2025年9月10日')
      || !loanRead.includes('王某丙')
      || !loanRead.includes('李某乙')
      || !loanRead.includes('虚构市虚构区无此巷16号')
    ) {
      throw new Error('actual source reads do not contain the primary loan facts')
    }
    const repaymentRead = [
      sourceTextByName.get('还款记录') ?? '',
      sourceTextByName.get('银行流水') ?? '',
    ].join('\n')
    if (!/(?:20000|20,000|2万元|归还部分本金)/.test(repaymentRead)) {
      throw new Error('actual source reads do not contain the partial principal repayment')
    }
    report.sourceReads = sourceReads

    const draftRows = asArray(result.drafts).map(asRecord)
    const latestDraft = draftRows.at(-1)
    if (latestDraft === undefined) {
      throw new Error('completed task has no final titled lawyer-letter draft')
    }
    const actualTitle = asString(latestDraft.title, 'draft title')
    if (actualTitle.trim().length === 0) {
      throw new Error('completed task has no final titled lawyer-letter draft')
    }
    const draftRel = asString(latestDraft.path, 'draft path')
    const draftPath = resolve(caseRoot, ...draftRel.split('/'))
    const draftRelative = relative(resolve(caseRoot), draftPath)
    if (
      draftRelative.startsWith('..')
      || isAbsolute(draftRelative)
      || !draftRel.startsWith(`工作区/任务/${taskId}/草稿/`)
      || !draftRel.endsWith('.md')
    ) {
      throw new Error('saved draft path escapes its owned task')
    }
    const draftBytes = await readFile(draftPath)
    const draftText = draftBytes.toString('utf8')
    if (draftText.trim().length === 0) throw new Error('saved lawyer letter is empty')
    const matchingSave = saveCalls.findLast(call => {
      const event = turnEvents.find(candidate => (
        candidate.type === 'tool/call'
        && asRecord(candidate.data).callId === call.callId
      ))!
      const args = toolArguments(event)
      return args.title === actualTitle && args.content === draftText
    })
    if (matchingSave === undefined || matchingSave.seq < askResult.seq) {
      throw new Error('saved lawyer letter is not a post-answer model-authored tool argument')
    }
    const namesReadBeforeSave = new Set(
      materialCalls
        .filter(call => call.seq < matchingSave.seq)
        .flatMap(call => sourceNamesByCallId.get(call.callId) ?? []),
    )
    if (
      !namesReadBeforeSave.has('借条')
      || (!namesReadBeforeSave.has('还款记录') && !namesReadBeforeSave.has('银行流水'))
    ) {
      throw new Error('primary loan/repayment source reads did not precede the successful final save')
    }
    const matchingResult = toolResultValue(turnEvents, matchingSave.callId)
    if (
      matchingResult.path !== draftRel
      || matchingResult.version !== latestDraft.version
    ) {
      throw new Error('saved draft bytes do not match the actual case_save_draft result')
    }

    const citationRows = asArray(result.citations).map(asRecord)
    if (citationRows.length === 0) throw new Error('saved lawyer letter has no parsed citations')
    const citationResolutions: CitationResolution[] = []
    const seenCitations = new Set<string>()
    for (const row of citationRows) {
      const materialId = asString(row.material_id, 'citation material_id')
      const material = materialReads.find(item => item.materialId === materialId)
      const name = asString(row.name, 'citation name')
      const version = asString(row.material_version, 'citation material_version')
      const loc = asRecord(row.loc)
      if (
        material === undefined
        || material.name !== name
        || material.originalSha256 !== version
        || asString(loc.unit, 'citation unit') !== material.unit
      ) {
        throw new Error('citation does not point to a current case material version/unit')
      }
      const citation = citationTextFor(name, loc)
      const key = `${materialId}\u0000${JSON.stringify(loc)}`
      if (seenCitations.has(key)) continue
      seenCitations.add(key)
      const source = apiOk(await remote.callApi(apiRoute('source'), {
        case_id: caseId,
        material_id: materialId,
        citation,
        task_id: taskId,
      }), `source ${citation}`)
      const text = asString(source.text, 'source text')
      if (
        source.name !== name
        || source.source_changed !== false
        || (source.original_status !== undefined && source.original_status !== 'ok')
        || text.trim().length === 0
      ) {
        throw new Error(`citation did not resolve to unchanged current source: ${citation}`)
      }
      citationResolutions.push({
        materialId,
        name,
        citation,
        loc,
        textSha256: sha256Bytes(text),
        textLength: text.length,
        sourceChanged: false,
      })
    }
    report.citations = citationResolutions
    const machineChecks = assertDraftMachineChecks(draftText, citationRows)
    const usage = asRecord(result.usage)
    const modelCalls = asInteger(usage.model_calls, 'task model_calls')
    const toolCallCount = asInteger(usage.tool_calls, 'task tool_calls')
    const elapsedSeconds = asInteger(usage.elapsed_s, 'task elapsed_s')
    const modelPosts = network.slice(modelNetworkStart).filter(item => (
      item.kind === 'model' && item.method === 'POST'
    ))
    const modelHttp200 = modelPosts.filter(item => item.status === 200)
    const withinTaskBudget = (
      modelCalls > 0
      && modelCalls <= MODEL_CALL_LIMIT
      && toolCallCount >= 0
      && toolCallCount <= TOOL_CALL_LIMIT
      && elapsedSeconds >= 0
      && elapsedSeconds <= TASK_MINUTES * 60
    )
    if (
      !withinTaskBudget
      || modelPosts.length === 0
      || modelHttp200.length === 0
    ) {
      throw new Error('actual model/network or B task accounting exceeded the fixed budget')
    }
    report.accounting = {
      bTaskUsage: usage,
      observedModelPosts: modelPosts.length,
      observedModelHttp200: modelHttp200.length,
      observedToolCalls: toolCalls.length,
      withinTaskBudget,
    }
    report.task = {
      selectionId,
      taskId,
      requestId,
      skill: SKILL,
      params: taskParams,
      requestScope: scope,
    }
    report.turn = {
      beforeSeq,
      afterSeq,
      eventTypes,
      responseTextSha256: sha256Bytes(responseText),
      responseTextLength: responseText.length,
      toolCalls,
    }
    report.draft = {
      title: actualTitle,
      path: draftRel,
      version: asInteger(latestDraft.version, 'draft version'),
      bytes: draftBytes.byteLength,
      sha256: sha256Bytes(draftBytes),
      length: draftText.length,
      machineChecks,
    }
    const stopped = await service.stop()
    bStopped = true
    report.bService = {
      ready: service.ready,
      final: stopped.final,
      exitCode: stopped.code,
      forcedStop: stopped.forced,
    }
    if (stopped.code !== 0 || stopped.final.passed !== true || stopped.forced) {
      throw new Error('finite B general-drafting service did not stop cleanly')
    }
    const caseDbPath = join(caseRoot, '工作区', 'case.db')
    const caseDbBytes = await ordinaryFile(caseDbPath)
    report.case!.caseDb = {
      path: caseDbPath,
      bytes: caseDbBytes,
      sha256: await sha256File(caseDbPath),
    }
    await browser.dispose()
    browserDisposed = true
    await production.live.fiber.dispose()
    contextDisposed = true
    const reopened = await production.reopenPersistedEvents(sessionId)
    const equal = isDeepStrictEqual(reopened, liveEvents)
    if (!equal) throw new Error('reopened JSONL differs from live Native Session events')
    const physicalFiles: string[] = []
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isSymbolicLink()) throw new Error('session persistence contains a reparse entry')
        if (entry.isDirectory()) await walk(path)
        else if (entry.isFile() && entry.name === 'session.v4.jsonl') physicalFiles.push(path)
      }
    }
    await walk(production.persistenceRoot)
    const matching = physicalFiles.filter(path => path.includes(sessionId))
    if (matching.length !== 1) throw new Error('fresh session does not have exactly one physical JSONL')
    const jsonlPath = matching[0]!
    const jsonlBytes = await readFile(jsonlPath)
    const physicalRows = jsonlBytes.toString('utf8').trimEnd().split(/\r?\n/)
    if (physicalRows.length < 2) throw new Error('fresh JSONL has no event rows')
    const headerRow = asRecord(JSON.parse(physicalRows[0]!))
    if (
      headerRow.type !== 'session'
      || headerRow.version !== 4
      || headerRow.id !== sessionId
      || headerRow.cwd !== caseRoot
    ) {
      throw new Error('fresh JSONL header identity/cwd changed')
    }
    report.persistence = {
      sessionReopened: reopened.length > 0,
      liveEqualsReopened: equal,
      physicalJsonlPath: jsonlPath,
      physicalJsonlBytes: jsonlBytes.byteLength,
      physicalJsonlSha256: sha256Bytes(jsonlBytes),
      physicalEventCount: physicalRows.length - 1,
      headerId: String(headerRow.id),
      headerCwd: String(headerRow.cwd),
    }
    for (const material of materialReads) {
      await ordinaryFileIdentity(
        material.originalPath,
        material.originalBytes,
        material.originalSha256,
        material.sourceMtimeNs,
      )
    }
    if (
      blocked.size !== 0
      || fetchGate.deniedAttempts !== 0
      || secret.length === 0
      || JSON.stringify(report).includes(secret)
    ) {
      throw new Error('blocked turn, network denial, or credential invariant failed')
    }
    report.claims.actualSingleGeneralDraftingConsumer = true
    report.claims.actualModelAuthoredDraft = true
    report.status = 'TECHNICAL_PASS_REVIEW_REQUIRED'
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  } finally {
    if (production !== undefined && sessionId.length > 0 && !contextDisposed) {
      try {
        const ownedAgent = production.live.agents.get(sessionId)
        if (ownedAgent === undefined) {
          if (production.live.agents.list().some((candidate: any) => candidate.id === sessionId)) {
            throw new Error('live agent registry lookup and listing disagree')
          }
          agentJoined = true
        } else {
          agent = ownedAgent
        }
        if (ownedAgent?.status === 'running') production.commands.cancel({ sessionId })
        if (ownedAgent !== undefined) {
          await withWatchdog(ownedAgent.whenIdle())
          agentJoined = true
        }
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
        if (stopped.code !== 0 || stopped.final.passed !== true || stopped.forced) {
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
        cleanupFailures.push(`BrowserSession dispose failed: ${error instanceof Error ? error.name : 'unknown'}`)
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
    if (environment !== undefined) {
      try {
        environment.restore()
        environmentRestored = true
      } catch (error: unknown) {
        cleanupFailures.push(`environment restore failed: ${error instanceof Error ? error.name : 'unknown'}`)
      }
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
  report.modelPosts.http200 = report.modelPosts.observations.filter(item => (
    item.method === 'POST' && item.status === 200
  )).length
  report.networkSummary = summarizeNetwork(network, fetchLease.deniedAttempts())
  if (report.networkSummary.deniedAttempts !== 0 && report.error === undefined) {
    report.status = 'FAILED'
    report.error = { message: 'network allowlist denied an attempt' }
  }
  report.cleanup.agentCancelledOrIdle = agentJoined
  report.cleanup.browserDisposed = browserDisposed
  report.cleanup.contextDisposed = contextDisposed
  report.cleanup.bServiceStopped = bStopped
  report.cleanup.fetchRestored = fetchLease.isRestored()
  report.cleanup.environmentRestored = environmentRestored
  if (cleanupFailures.length > 0) {
    report.status = 'FAILED'
    const cleanupError = { message: 'cleanup failed', failures: [...cleanupFailures] }
    if (report.error === undefined) report.error = cleanupError
    else report.secondaryErrors.push(cleanupError)
  }
  try {
    report.admission.final = (await verifyFixedInputs()).admission
    report.originalInputsHeld = true
  } catch (error: unknown) {
    report.status = 'FAILED'
    const finalPinError = safeError(error, secret)
    if (report.error === undefined) report.error = finalPinError
    else report.secondaryErrors.push(finalPinError)
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
    const redactionError = { message: 'output redaction restore failed' }
    if (sanitized.error === undefined) sanitized.error = redactionError
    else sanitized.secondaryErrors.push(redactionError)
  }
  sanitized.cleanup.outputRedactionRestored = outputRedaction?.isRestored() ?? true
  if (!keyCleared || !sanitized.cleanup.outputRedactionRestored) {
    sanitized.status = 'FAILED'
    const credentialCleanupError = { message: 'credential cleanup did not complete' }
    if (sanitized.error === undefined) sanitized.error = credentialCleanupError
    else sanitized.secondaryErrors.push(credentialCleanupError)
  }
  sanitized.finishedAtUtc = utcNow()
  const reportPath = join(runRoot, 'report.json')
  await writeFile(reportPath, `${JSON.stringify(sanitized, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })
  process.stdout.write(`${JSON.stringify({
    status: sanitized.status,
    reviewId: REVIEW_ID,
    report: reportPath,
    nativeSessionId: sanitized.session?.sessionId,
    taskId: sanitized.task?.taskId,
    requestId: sanitized.task?.requestId,
    draftSha256: sanitized.draft?.sha256,
    citationMustFix: 0,
    modelPostAttempts: sanitized.networkSummary.modelPostAttempts,
    modelPostHttp200: sanitized.networkSummary.modelPostHttp200,
    manualReviewRequired: true,
  }, null, 2)}\n`)
  if (sanitized.status === 'FAILED') process.exitCode = 1
}

await runNativeGeneralDrafting()
