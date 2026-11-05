/**
 * Finite T18 native cross-exam-opinion consumer.
 *
 * One fresh private criminal case receives the five approved synthetic Markdown
 * materials. The real B CaseRegistry, text scanner, Native Session, Host request
 * scope, LegalAgent, AgentLoop, and one real 6000D turn form one
 * cross-exam-opinion task. No historical session, messages, task state,
 * case DB, or JSONL is copied. The autonomous consumer observes the model's
 * actual three-ID question, answers only those IDs when the model asks,
 * requires their answers and material listing before every material read,
 * then verifies the model-authored Markdown through case_save_draft.
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
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_ROOT = 'D:/Lawbeach/lawbench-B'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const B_SERVICE_SCRIPT = join(EVIDENCE_DIR, 'b-service-cross-exam.py')
const MATERIAL_INDEX_PATH = ['工作区', '材料', 'index.json'] as const
const FIXED_INPUTS_FORMAT = 'lawbench-t18-cross-exam-native-inputs-v1'
const TASK_NAME = 'A-T18-cross-exam-native-20261029-113906'
const REVIEW_ID = 'T18CrossExamNative-20261029-113906'
const SKILL = 'cross-exam-opinion'
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
const TASK_MAX_TOKENS = 49_152
const TASK_CONTEXT_WINDOW = 131_072
const TASK_COMPLETION_POLL_ATTEMPTS = 1_200
const TASK_COMPLETION_POLL_INTERVAL_MS = 100
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/
const SHA256 = /^[0-9a-f]{64}$/
const APPROVED_INPUTS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18CrossExamNativeInput-20261029-113906\\approved-inputs.json'
const APPROVED_INPUTS_BYTES = 3_092
const APPROVED_INPUTS_SHA256 =
  '0ecc07adbc0b8dd831289dcabb80a11106175c1104cc77ba5c94df389afcb9bf'
const SOURCE_PINS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18RoundCitationRuntimeInput-20261029-105056\\reviewed-b-source-pins-round-citation.json'
const SOURCE_PINS_BYTES = 53_548
const SOURCE_PINS_SHA256 =
  '6b07e5773dc77c6b13fd6688e4febca847af250f8a37ce13d3a4af4d581c5205'
const SOURCE_PINS_ENTRIES = 346
const AUTHORIZED_SYNTHETIC_ANSWERS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18CrossExamNativeInput-20261029-113906\\authorized-synthetic-answers.json'
const AUTHORIZED_SYNTHETIC_ANSWERS_BYTES = 453
const AUTHORIZED_SYNTHETIC_ANSWERS_SHA256 =
  '4784dfc3d345ec2010c1443f7f803bc39fdfd5ca19754b2d4bc6b96a0ae2c9ce'
const CROSS_EXAM_SAMPLE_DIR = join(
  B_ROOT,
  'skills',
  'cross-exam-opinion',
  'tests',
  '样本03-李某乙盗窃无目录',
)
const CROSS_EXAM_TASK_PATH = join(CROSS_EXAM_SAMPLE_DIR, '_任务说明.md')
const CROSS_EXAM_SKILL_PATH = join(B_ROOT, 'skills', 'cross-exam-opinion', 'SKILL.md')
const CROSS_EXAM_REFERENCE_NOTES_PATH = join(
  B_ROOT,
  'skills',
  'cross-exam-opinion',
  'tests',
  '要点.md',
)
const MATERIAL_NAMES = [
  '价格认定结论书',
  '扣押清单',
  '监控视频截图说明',
  '被害人王某丙询问笔录',
  '起诉书',
] as const
const EVIDENCE_NAMES = [
  '价格认定结论书',
  '扣押清单',
  '监控视频截图说明',
  '被害人王某丙询问笔录',
] as const
const QUESTION_IDS = ['stance', 'scope', 'need_questions'] as const
type QuestionId = typeof QUESTION_IDS[number]
const QUESTION_FROM_MATERIALS: Readonly<Record<QuestionId, boolean>> = {
  stance: true,
  scope: false,
  need_questions: false,
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

interface TaskSettlementIO {
  query(): Promise<unknown>
  readOwnedTaskMetadata(taskId: string): Promise<OwnedTaskMetadata>
  sleep(milliseconds: number): Promise<void>
}

export interface TaskSettlementProof {
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
  readonly authorizedSyntheticAnswers: FixedEntry
  readonly canonicalTask: FixedEntry
  readonly skill: FixedEntry
  readonly materials: readonly MaterialInput[]
  readonly referenceNotes: FixedEntry
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
  answeredCallbackCount: number
  answerReadInFlight: boolean
  readonly unsupportedQuestionIds: Set<string>
  readonly requestedQuestionIds: Set<string>
  readonly answeredQuestionIds: Set<QuestionId>
  readonly questionTexts: string[]
  readonly answerTexts: string[]
  answers: Readonly<Record<QuestionId, string>> | null
}

interface ToolCallRecord {
  readonly ordinal: number
  readonly name: string
  readonly callId: string
  readonly seq: number
  readonly argumentsSha256: string
}

export interface RejectedQuestionCallObservation {
  readonly callId: string
  readonly reason: 'invalid_question_ask' | 'missing_questions'
  readonly missingIds: readonly string[]
  readonly seq: number
  readonly resultSeq: number
  readonly resultSha256: string
  readonly answered: false
}

export interface AnsweredQuestionCallObservation {
  readonly callId: string
  readonly questionIds: readonly string[]
  readonly answerIds: readonly string[]
  readonly seq: number
  readonly resultSeq: number
  readonly resultSha256: string
  readonly answered: true
}

export interface QuestionCallbackObservationOptions {
  readonly callbackInvocations: number
  readonly declaredQuestionIds: readonly string[]
  readonly answers: Readonly<Record<string, string>>
  readonly invalidQuestionAskDenial: (missing: readonly string[]) => string
  readonly missingQuestionAskDenial: (missing: readonly string[]) => string
  readonly requestId: string
  readonly expectedListingNames: readonly string[]
  readonly expectedListingScope: readonly ListingScopeEntry[]
}

export interface ListingScopeEntry {
  readonly materialId: string
  readonly version: string
}

export interface QuestionCallbackObservation {
  readonly allAskCallIds: readonly string[]
  readonly rejectedCalls: readonly RejectedQuestionCallObservation[]
  readonly answeredCallIds: readonly string[]
  readonly questionIds: readonly string[]
  readonly answerIds: readonly string[]
  readonly questionTexts: readonly string[]
  readonly answerTexts: readonly string[]
  readonly lastRequiredAnswerSeq: number
  readonly firstMaterialReadSeq: number
  readonly listingSource: 'L0' | 'tool'
  readonly listingSourceSeq: number
  readonly listingNames: readonly string[]
  readonly listingScope: readonly ListingScopeEntry[]
  readonly listingBeforeAnyMaterialRead: true
  readonly successfulSaveAfterRequiredAnswers: true
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
  format: 'lawbench-t18-cross-exam-native-report-v1'
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
    readonly title: string
    readonly kind: 'draft'
    readonly declaredParams: Record<string, unknown>
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
    readonly callIds: readonly string[]
    readonly answeredCallIds: readonly string[]
    readonly rejectedCalls: readonly RejectedQuestionCallObservation[]
    readonly questionIds: readonly string[]
    readonly questionTexts: readonly string[]
    readonly answerIds: readonly string[]
    readonly unsupportedQuestionIds: readonly string[]
    readonly primaryCatalog: true
    readonly actualCallbackInvocations: number
    readonly totalCallbackAttempts: number
    readonly questionTextSha256: string
    readonly answerTextSha256: string
    readonly syntheticCallback: true
    readonly realHumanReply: false
    readonly authorizedAnswerFile: string
    readonly authorizedAnswerFileSha256: string
    readonly providedStance: string
    readonly stanceSource: 'canonical-task'
    readonly beforeFirstSuccessfulSave: true
    readonly stanceAnswerBeforeAnyMaterialRead: true
    readonly scopeAnswerBeforeAnyMaterialRead: true
    readonly needQuestionsAnswerBeforeAnyMaterialRead: true
    readonly threeKnownQuestionSemanticsManualReviewRequired: true
    readonly listingSource: 'L0' | 'tool'
    readonly listingSourceSeq: number
    readonly listingNames: readonly string[]
    readonly listingScope: readonly ListingScopeEntry[]
    readonly listingBeforeAnyMaterialRead: true
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
    readonly parts: readonly Record<string, unknown>[]
    readonly textSha256: string
    readonly textLength: number
  }[]
  citations?: readonly CitationResolution[]
  citationCheck?: {
    readonly stats: Record<string, unknown>
    readonly qualityHints: readonly Record<string, unknown>[]
    readonly problems: readonly Record<string, unknown>[]
  }
  suggestions?: {
    readonly actualSuccessfulCallCount: number
    readonly calls: readonly {
      readonly callId: string
      readonly argumentsSha256: string
      readonly resultSha256: string
    }[]
    readonly validatedLawyerFacts: false
    readonly lawyerConfirmedCard: false
  }
  draft?: {
    readonly title: string
    readonly expectedEvidenceNames: readonly string[]
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
  taskSettlement: {
    attempted: boolean
    outcome: 'not_started' | 'pending' | 'settled' | 'failed'
    taskId?: string
    taskState?: string
    terminalStatus?: string
    attempts?: number
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
  manualAcceptance: {
    readonly required: true
    readonly questionSemantics: 'PENDING_ROOT_REVIEW'
    readonly evidenceRowNamesAndProofPurposes: 'PENDING_ROOT_REVIEW'
    readonly disputedEvidenceExplanations: 'PENDING_ROOT_REVIEW'
    readonly noQuestionsOutline: 'PENDING_ROOT_REVIEW'
    readonly selfCheckInFinalReply: 'PENDING_ROOT_REVIEW'
    readonly saveInstructionInReply: 'PENDING_ROOT_REVIEW'
    readonly businessAcceptance: false
    readonly legalMeritsAcceptance: false
  }
  error?: unknown
  secondaryErrors: unknown[]
  claims: {
    readonly oneSyntheticWorkflowOnly: true
    actualSingleCrossExamConsumer: boolean
    actualModelAuthoredCrossExamOpinion: boolean
    businessAcceptance: false
    legalAcceptance: false
    manualCrossExamBusinessLegalReviewRequired: true
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

async function readAuthorizedSyntheticAnswers(): Promise<Readonly<Record<QuestionId, string>>> {
  const bytes = await readFile(AUTHORIZED_SYNTHETIC_ANSWERS_PATH)
  if (
    bytes.byteLength !== AUTHORIZED_SYNTHETIC_ANSWERS_BYTES
    || sha256Bytes(bytes) !== AUTHORIZED_SYNTHETIC_ANSWERS_SHA256
  ) {
    throw new Error('authorized synthetic answer identity changed')
  }
  const value = asRecord(JSON.parse(bytes.toString('utf8')))
  if (
    Object.keys(value).sort().join('\u0000')
    !== [...QUESTION_IDS].sort().join('\u0000')
  ) {
    throw new Error('authorized synthetic answers do not contain exactly the three declared IDs')
  }
  const answers = Object.fromEntries(QUESTION_IDS.map(id => [
    id,
    asString(value[id], `authorized synthetic answer ${id}`),
  ])) as Record<QuestionId, string>
  if (Object.values(answers).some(answer => answer.trim().length === 0)) {
    throw new Error('authorized synthetic answers contain an empty answer')
  }
  return Object.freeze(answers)
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
    || manifest.dependencies.length !== 26
    || manifest.compilerPrivate.length !== 4
    || manifest.runtimeExecutables.length !== 3
    || !manifest.dependencies.some(entry => (
      entry.role === 'cross-exam-opinion-skill'
      && entry.sha256 === manifest.skill.sha256
    ))
  ) {
    throw new Error('fixed-input manifest header is invalid')
  }
  for (const entry of [
    manifest.approvedInputs,
    manifest.sourcePins,
    manifest.authorizedSyntheticAnswers,
    manifest.canonicalTask,
    manifest.skill,
    ...manifest.materials,
    manifest.referenceNotes,
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
    || manifest.authorizedSyntheticAnswers.path !== AUTHORIZED_SYNTHETIC_ANSWERS_PATH
    || manifest.authorizedSyntheticAnswers.bytes !== AUTHORIZED_SYNTHETIC_ANSWERS_BYTES
    || manifest.authorizedSyntheticAnswers.sha256 !== AUTHORIZED_SYNTHETIC_ANSWERS_SHA256
    || manifest.consumer.path !== fileURLToPath(import.meta.url)
    || manifest.bService.path !== B_SERVICE_SCRIPT
  ) {
    throw new Error('fixed external, self, or companion pin changed')
  }
  for (const material of [
    manifest.canonicalTask,
    manifest.skill,
    manifest.referenceNotes,
    ...manifest.materials,
  ]) {
    await ordinaryFileIdentity(
      material.path,
      material.bytes,
      material.sha256,
      asString(material.mtime_ns, `${basename(material.path)} mtime_ns`),
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
    .filter(row => (
      !['SKILL.md', '_任务说明.md', '要点.md'].includes(basename(row.path))
    ))
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
      || row.path.includes('\\SKILL.md')
      || extname(row.path).toLowerCase() !== '.md'
    ))
  ) {
    throw new Error('manifest material set contains a golden or non-material input')
  }
  if (materialRows.length !== 5) {
    throw new Error('approved literal rows are not exactly five materials plus task, Skill and notes')
  }
  const approvedByName = new Map(approvedRows.map(row => [basename(row.path), row] as const))
  const literalRows = [
    [manifest.canonicalTask, '_任务说明.md'],
    [manifest.skill, 'SKILL.md'],
    [manifest.referenceNotes, '要点.md'],
    ...manifest.materials.map(row => [row, basename(row.path)] as const),
  ] as const
  if (
    approvedByName.size !== 8
    || literalRows.length !== 8
    || new Set(literalRows.map(([, name]) => name)).size !== 8
    || literalRows.some(([row, name]) => {
      const approved = approvedByName.get(name)
      return approved === undefined
        || approved.path !== row.path
        || approved.bytes !== row.bytes
        || approved.sha256 !== row.sha256
        || approved.mtime_ns !== row.mtime_ns
    })
  ) {
    throw new Error('manifest literal rows do not preserve all eight approved SHA-size-mtime identities')
  }
  if (
    pathKey(manifest.canonicalTask.path) !== pathKey(CROSS_EXAM_TASK_PATH)
    || pathKey(manifest.skill.path) !== pathKey(CROSS_EXAM_SKILL_PATH)
    || pathKey(manifest.referenceNotes.path) !== pathKey(CROSS_EXAM_REFERENCE_NOTES_PATH)
    || manifest.materials.some(row => pathKey(dirname(row.path)) !== pathKey(CROSS_EXAM_SAMPLE_DIR))
    || manifest.dependencies.filter(row => row.role === 'cross-exam-opinion-skill').length !== 1
    || pathKey(manifest.dependencies.find(row => row.role === 'cross-exam-opinion-skill')!.path)
      !== pathKey(CROSS_EXAM_SKILL_PATH)
  ) {
    throw new Error('cross-exam task, Skill, notes, or material source escaped its approved B lane paths')
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
    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/CrossExamQuestionPrivateBuild-20261029-122319/private-output-20261029-123906/profile-node_modules/lawbench-dsh/lib/agent.js'),
    import('file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/CrossExamQuestionPrivateBuild-20261029-122319/private-output-20261029-123906/profile-node_modules/lawbench-dsh/lib/host.js'),
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
  const LawbenchRemote = ExtHostModule.LawbenchRemote
  const invalidQuestionAskDenial = ExtAgentModule.invalidQuestionAskDenial
  const questionRequirementDenial = ExtAgentModule.questionRequirementDenial
  if (
    typeof invalidQuestionAskDenial !== 'function'
    || typeof questionRequirementDenial !== 'function'
  ) {
    throw new Error('current compiled LegalAgent lacks producer question-denial functions')
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
          contextWindow: TASK_CONTEXT_WINDOW,
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
        defaultContextWindow: TASK_CONTEXT_WINDOW,
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
    if (question.answeredCallbackCount !== 0) {
      throw new Error('authorized synthetic callback may answer only one committed ask')
    }
    const body = asRecord(request)
    const missingIds = QUESTION_IDS.filter(id => !question.answeredQuestionIds.has(id))
    const rejectInvalidShape = (): never => {
      throw new Error(invalidQuestionAskDenial(missingIds))
    }
    if (!Array.isArray(body.questions)) rejectInvalidShape()
    const questions = body.questions.map(raw => {
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) rejectInvalidShape()
      const item = raw as Record<string, unknown>
      if (
        typeof item.id !== 'string'
        || item.id.length === 0
        || typeof item.question !== 'string'
        || item.question.trim().length === 0
      ) {
        rejectInvalidShape()
      }
      if (item.options !== undefined) {
        if (!Array.isArray(item.options)) rejectInvalidShape()
        for (const rawOption of item.options) {
          if (rawOption === null || typeof rawOption !== 'object' || Array.isArray(rawOption)) {
            rejectInvalidShape()
          }
          const option = rawOption as Record<string, unknown>
          if (typeof option.label !== 'string' || option.label.trim().length === 0) {
            rejectInvalidShape()
          }
          if (option.description !== undefined && typeof option.description !== 'string') {
            rejectInvalidShape()
          }
        }
      }
      if (item.multi_select !== undefined && typeof item.multi_select !== 'boolean') {
        rejectInvalidShape()
      }
      return item
    })
    if (questions.length === 0) rejectInvalidShape()
    const ids = questions.map((item, index) => asString(item.id, `question ${index + 1} id`))
    if (
      new Set(ids).size !== ids.length
      || ids.some(id => !QUESTION_IDS.includes(id as QuestionId))
    ) {
      rejectInvalidShape()
    }
    const missingRequiredIds = QUESTION_IDS.filter(id => !ids.includes(id))
    if (missingRequiredIds.length > 0) {
      throw new Error(questionRequirementDenial(missingRequiredIds))
    }
    const options = questions.flatMap(item => (
      item.options === undefined ? [] : asArray(item.options).map(asRecord)
    ))
    const optionLabels = options.map((option, index) => asString(option.label, `option ${index + 1} label`))
    if (question.answerReadInFlight) {
      throw new Error('authorized synthetic callback already has an answer read in flight')
    }
    question.answerReadInFlight = true
    let authorizedAnswers: Readonly<Record<QuestionId, string>>
    try {
      authorizedAnswers = await readAuthorizedSyntheticAnswers()
    } finally {
      question.answerReadInFlight = false
    }
    const answers = questions.map((item, index) => {
      const id = ids[index]! as QuestionId
      question.requestedQuestionIds.add(id)
      question.answeredQuestionIds.add(id)
      question.questionTexts.push(asString(item.question, `question ${id} text`))
      question.answerTexts.push(authorizedAnswers[id])
      return {
        id,
        selected: [],
        custom: authorizedAnswers[id],
      }
    })
    question.answers = authorizedAnswers
    question.value = {
      questionIds: [...question.requestedQuestionIds],
      questionText: question.questionTexts.join('\n'),
      optionLabels,
      answerIds: [...question.answeredQuestionIds],
      answerText: question.answerTexts.join('\n'),
    }
    question.answeredCallbackCount = 1
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
    invalidQuestionAskDenial,
    questionRequirementDenial,
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

/**
 * Consumer-only settlement for the exact task started by this run.
 *
 * The task-list row is discovery evidence only. Identity comes from that
 * task's own task.json, and completion requires both task.state=finished and
 * a matching terminal result status. The same injected loop is used by the
 * successful main path, the failure cleanup path, and focused finite tests.
 */
export async function settleOwnedCoreTask(
  expected: TaskSettlementExpected,
  io: TaskSettlementIO,
  acceptedTerminalStatuses: readonly string[] = [
    'completed',
    'cancelled',
    'interrupted',
    'output_limit',
    'budget_stopped',
    'failed',
  ],
): Promise<TaskSettlementProof> {
  for (const [label, value] of Object.entries(expected)) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`task settlement ${label} is empty`)
    }
  }
  if (!TASK_ID.test(expected.selectionId)) {
    throw new Error('task settlement selection ID is invalid')
  }
  const accepted = new Set(acceptedTerminalStatuses)
  if (accepted.size === 0) throw new Error('task settlement has no accepted terminal statuses')

  for (let attempt = 1; attempt <= TASK_COMPLETION_POLL_ATTEMPTS; attempt += 1) {
    const result = asRecord(await io.query())
    if (result.ok !== true) {
      throw new Error(`task settlement query failed: ${String(asRecord(result.error).code ?? 'UNKNOWN')}`)
    }
    const list = asRecord(result.value)
    const rows = asArray(list.tasks).map(asRecord)
    const matches: Array<{
      readonly taskId: string
      readonly task: Record<string, unknown>
      readonly result: Record<string, unknown>
      readonly taskListRow: Record<string, unknown>
    }> = []
    const ownedTaskIds = new Set<string>()
    let transientRead = false

    for (const row of rows) {
      const taskId = asString(row.task_id, 'task list task_id')
      if (taskId === expected.selectionId) continue
      if (!TASK_ID.test(taskId)) throw new Error(`task list contains invalid task ID: ${taskId}`)

      const metadata = await io.readOwnedTaskMetadata(taskId)
      if (metadata.taskId !== taskId) {
        throw new Error(`owned task metadata identity changed for ${taskId}`)
      }
      if (
        metadata.task.task_id !== taskId
        || metadata.task.case_id !== expected.caseId
        || metadata.task.session_id !== expected.sessionId
        || metadata.task.request_id !== expected.requestId
        || metadata.task.skill !== expected.skill
      ) {
        continue
      }
      ownedTaskIds.add(taskId)
      if (row.skill !== expected.skill) {
        throw new Error(`owned task list skill changed for ${taskId}`)
      }
      if (metadata.result.task_id !== taskId) {
        throw new Error(`owned task result identity changed for ${taskId}`)
      }
      const taskState = asString(metadata.task.state, 'owned task state')
      const rowStatus = asString(row.status, 'owned task list status')
      const resultStatus = asString(metadata.result.status, 'owned task result status')
      if (taskState === 'abnormal') {
        throw new Error(`owned task ${taskId} ended in abnormal stale state`)
      }
      if (taskState !== 'running' && taskState !== 'finished') {
        throw new Error(`owned task ${taskId} has unexpected state ${taskState}`)
      }
      if (rowStatus !== 'running' && !accepted.has(rowStatus)) {
        throw new Error(`owned task list has unaccepted status ${rowStatus}`)
      }
      if (resultStatus !== 'running' && !accepted.has(resultStatus)) {
        throw new Error(`owned task result has unaccepted terminal status ${resultStatus}`)
      }
      if (
        rowStatus !== 'running'
        && accepted.has(rowStatus)
        && resultStatus !== 'running'
        && accepted.has(resultStatus)
        && rowStatus !== resultStatus
      ) {
        throw new Error(`owned task ${taskId} terminal statuses disagree`)
      }

      // task/end saves result.json before task.json reaches finished. The task
      // list and the two owned files are separate reads, so either side may
      // briefly observe the first half of that commit. Requery the same bounded
      // loop; only a later stable snapshot may prove completion.
      if (
        (rowStatus === 'running' && accepted.has(resultStatus))
        || (taskState === 'running' && accepted.has(resultStatus))
      ) {
        transientRead = true
        continue
      }
      if (taskState === 'running') {
        if (rowStatus !== 'running' || resultStatus !== 'running') {
          throw new Error(`owned task ${taskId} has contradictory statuses`)
        }
        continue
      }
      if (resultStatus === 'running') {
        throw new Error(`owned task ${taskId} finished with unaccepted terminal status running`)
      }
      if (rowStatus !== resultStatus) {
        throw new Error(`owned task ${taskId} terminal statuses disagree`)
      }
      matches.push({
        taskId,
        task: metadata.task,
        result: metadata.result,
        taskListRow: { ...row },
      })
    }

    if (ownedTaskIds.size > 1) throw new Error('more than one owned task matches this run')
    if (matches.length > 1) throw new Error('more than one owned task matches this run')
    if (transientRead) {
      await io.sleep(TASK_COMPLETION_POLL_INTERVAL_MS)
      continue
    }
    const match = matches[0]
    if (match !== undefined) {
      const terminalStatus = asString(match.result.status, 'owned task terminal status')
      return {
        taskId: match.taskId,
        taskState: 'finished',
        terminalStatus,
        attempts: attempt,
        taskListRow: match.taskListRow,
      }
    }
    await io.sleep(TASK_COMPLETION_POLL_INTERVAL_MS)
  }
  throw new Error(
    `owned task settlement timed out after ${TASK_COMPLETION_POLL_ATTEMPTS} attempts`,
  )
}

export function createTaskSettlement(
  expected: TaskSettlementExpected,
  io: TaskSettlementIO,
  acceptedTerminalStatuses?: readonly string[],
): TaskSettlementController {
  let armed = false
  let settled: TaskSettlementProof | undefined
  let inFlight: Promise<TaskSettlementProof> | undefined
  return {
    arm() {
      armed = true
    },
    isArmed() {
      return armed
    },
    async settle() {
      if (!armed) return undefined
      if (settled !== undefined) return settled
      if (inFlight === undefined) {
        inFlight = settleOwnedCoreTask(expected, io, acceptedTerminalStatuses)
      }
      try {
        settled = await inFlight
        return settled
      } finally {
        inFlight = undefined
      }
    },
  }
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
  const results = events.filter(event => {
    if (event.type !== 'tool/result') return false
    const source = asRecord(asRecord(event.data).message).source
    return source !== null
      && typeof source === 'object'
      && asRecord(source).callId === callId
  })
  if (results.length === 0) throw new Error(`tool result is missing for ${callId}`)
  if (results.length !== 1) throw new Error(`tool result is duplicated for ${callId}`)
  const result = results[0]!
  const message = asRecord(asRecord(result.data).message)
  if (message.isError === true) throw new Error(`tool failed for ${callId}`)
  return asRecord(JSON.parse(eventMessageText(result)))
}

function toolResultRecord(events: readonly NativeEvent[], callId: string): {
  readonly seq: number
  readonly isError: boolean
  readonly text: string
} {
  const results = events.filter(event => {
    if (event.type !== 'tool/result') return false
    const source = asRecord(asRecord(event.data).message).source
    return source !== null
      && typeof source === 'object'
      && asRecord(source).callId === callId
  })
  if (results.length === 0) throw new Error(`tool result is missing for ${callId}`)
  if (results.length !== 1) throw new Error(`tool result is duplicated for ${callId}`)
  const result = results[0]!
  const message = asRecord(asRecord(result.data).message)
  return {
    seq: result.seq,
    isError: message.isError === true,
    text: eventMessageText(result),
  }
}

function parseAskQuestionShape(args: unknown): {
  readonly valid: boolean
  readonly ids: readonly string[]
  readonly questionTexts: readonly string[]
} {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    return { valid: false, ids: [], questionTexts: [] }
  }
  const questions = (args as Record<string, unknown>).questions
  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: false, ids: [], questionTexts: [] }
  }
  const ids: string[] = []
  const questionTexts: string[] = []
  for (const raw of questions) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { valid: false, ids: [], questionTexts: [] }
    }
    const question = raw as Record<string, unknown>
    if (
      typeof question.id !== 'string'
      || question.id.length === 0
      || typeof question.question !== 'string'
      || question.question.trim().length === 0
    ) {
      return { valid: false, ids: [], questionTexts: [] }
    }
    ids.push(question.id)
    questionTexts.push(question.question)
  }
  return { valid: true, ids, questionTexts }
}

function askQuestionArguments(event: NativeEvent): unknown {
  const argumentsValue = asRecord(event.data).arguments
  if (typeof argumentsValue !== 'string') return argumentsValue
  try {
    return JSON.parse(argumentsValue)
  } catch {
    return undefined
  }
}

export interface ScopedL0ListingObservation {
  readonly sourceSeq: number
  readonly names: readonly string[]
  readonly scope: readonly ListingScopeEntry[]
}

function assertExpectedListing(
  options: Pick<QuestionCallbackObservationOptions, 'expectedListingNames' | 'expectedListingScope'>,
): void {
  const names = [...options.expectedListingNames]
  const scope = [...options.expectedListingScope]
  if (names.length === 0 || names.some(name => typeof name !== 'string' || name.length === 0 || name.trim() !== name)) {
    throw new Error('expected listing names are empty or malformed')
  }
  if (new Set(names).size !== names.length) throw new Error('expected listing names are duplicated')
  if (scope.length !== names.length) throw new Error('expected listing scope does not match the material names')
  if (
    scope.some(entry => (
      typeof entry.materialId !== 'string'
      || !/^M[0-9]+$/.test(entry.materialId)
      || typeof entry.version !== 'string'
      || !/^[0-9a-f]{64}$/i.test(entry.version)
    ))
    || new Set(scope.map(entry => entry.materialId)).size !== scope.length
  ) {
    throw new Error('expected listing scope is malformed or duplicated')
  }
}

function sameNames(actual: readonly string[], expected: readonly string[]): boolean {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort())
}

export function parseScopedToolListing(
  resultSeq: number,
  isError: boolean,
  payload: unknown,
  firstMaterialReadSeq: number,
  options: Pick<QuestionCallbackObservationOptions, 'expectedListingNames' | 'expectedListingScope'>,
): ScopedL0ListingObservation | undefined {
  assertExpectedListing(options)
  if (!Number.isSafeInteger(resultSeq) || !Number.isSafeInteger(firstMaterialReadSeq) || resultSeq >= firstMaterialReadSeq) {
    return undefined
  }
  if (isError) return undefined
  const names = asArray(asRecord(payload).materials).map((row, index) => (
    asString(asRecord(row).name, `listed material ${index + 1} name`)
  ))
  if (names.length === 0) throw new Error('successful material-list tool result is empty')
  if (new Set(names).size !== names.length) {
    throw new Error('successful material-list tool result contains duplicate names')
  }
  if (!sameNames(names, options.expectedListingNames)) {
    throw new Error('successful material-list tool result does not match the current material scope')
  }
  return {
    sourceSeq: resultSeq,
    names,
    scope: options.expectedListingScope.map(entry => ({
      materialId: entry.materialId,
      version: entry.version,
    })),
  }
}

/**
 * Reads the material-list line format emitted by B's restricted L0 formatter
 * from the typed L0 section only. User-message prose is never searched.
 */
export function parseScopedL0Listing(
  contextEvent: NativeEvent,
  currentRequestEvent: NativeEvent,
  turnStartSeq: number,
  firstMaterialReadSeq: number,
  options: Pick<QuestionCallbackObservationOptions,
    'requestId' | 'expectedListingNames' | 'expectedListingScope'>,
): ScopedL0ListingObservation {
  assertExpectedListing(options)
  if (contextEvent.type !== 'user/message' || contextEvent.surfaceOp !== 'append') {
    throw new Error('L0 context source is not an appended user/message')
  }
  if (currentRequestEvent.type !== 'user/message' || currentRequestEvent.surfaceOp !== 'append') {
    throw new Error('current request source is not an appended user/message')
  }
  if (
    !Number.isSafeInteger(turnStartSeq)
    || !(turnStartSeq < contextEvent.seq)
    || !(contextEvent.seq < currentRequestEvent.seq)
    || !(currentRequestEvent.seq < firstMaterialReadSeq)
  ) {
    throw new Error('L0 context is not before the current request and every material read')
  }
  const requestSource = asRecord(currentRequestEvent.data).source
  if (
    requestSource === null
    || typeof requestSource !== 'object'
    || asRecord(requestSource).kind !== 'user'
    || asRecord(requestSource).rpcId !== options.requestId
  ) {
    throw new Error('current request source does not carry the actual request ID')
  }
  const source = asRecord(contextEvent.data).source
  if (source === null || typeof source !== 'object') throw new Error('L0 context source is missing')
  const sourceRow = asRecord(source)
  if (sourceRow.kind !== 'lawbench-context' || sourceRow.form !== 'snapshot') {
    throw new Error('context source is not a lawbench-context snapshot')
  }
  const sections = asArray(sourceRow.sections).map((section, index) => {
    const row = asRecord(section)
    return {
      name: asString(row.name, `context section ${index + 1} name`),
      text: asString(row.text, `context section ${index + 1} text`),
    }
  })
  const l0Sections = sections.filter(section => section.name === '案件卡片（L0）')
  if (l0Sections.length !== 1) throw new Error('context snapshot does not contain exactly one L0 section')
  const lines = l0Sections[0]!.text.replace(/\r\n/g, '\n').trimEnd().split('\n')
  const headings = lines.flatMap((line, index) => line === '## 材料清单' ? [index] : [])
  if (headings.length !== 1) throw new Error('L0 section does not contain exactly one material-list heading')
  const names: string[] = []
  for (const line of lines.slice(headings[0]! + 1)) {
    const match = /^- (.+)（(?:已解析|有页待识别|识别中|部分识别|无法处理|原件已删除)）$/u.exec(line)
    if (match === null) throw new Error('L0 material-list line does not match the pinned producer format')
    names.push(match[1]!)
  }
  if (names.length === 0 || new Set(names).size !== names.length) {
    throw new Error('L0 material list is empty or duplicated')
  }
  if (!sameNames(names, options.expectedListingNames)) {
    throw new Error('L0 material names do not match the current material scope')
  }
  return {
    sourceSeq: contextEvent.seq,
    names,
    scope: options.expectedListingScope.map(entry => ({
      materialId: entry.materialId,
      version: entry.version,
    })),
  }
}

/**
 * Separates pre-execute producer denials from actual answered callbacks.
 * A denied call remains in allAskCallIds but can never become an answered call.
 */
export function observeQuestionCallbacks(
  events: readonly NativeEvent[],
  options: QuestionCallbackObservationOptions,
): QuestionCallbackObservation {
  if (!Number.isInteger(options.callbackInvocations) || options.callbackInvocations < 0) {
    throw new Error('actual question callback invocation count is invalid')
  }
  const declared = [...options.declaredQuestionIds]
  if (declared.length === 0 || new Set(declared).size !== declared.length) {
    throw new Error('declared required question IDs are empty or duplicated')
  }
  if (declared.some(id => typeof options.answers[id] !== 'string' || options.answers[id]!.length === 0)) {
    throw new Error('declared required question answers are missing')
  }
  if (typeof options.requestId !== 'string' || options.requestId.length === 0) {
    throw new Error('actual request ID is missing')
  }
  assertExpectedListing(options)
  const requestEvents = events.filter(event => {
    if (event.type !== 'user/message') return false
    const source = asRecord(event.data).source
    return source !== null
      && typeof source === 'object'
      && asRecord(source).kind === 'user'
      && asRecord(source).rpcId === options.requestId
  })
  if (requestEvents.length !== 1) throw new Error('event prefix does not contain exactly one current request')
  const currentRequestEvent = requestEvents[0]!
  const turnStart = events.findLast(event => event.type === 'turn/start' && event.seq < currentRequestEvent.seq)
  if (turnStart === undefined) throw new Error('current request is outside its actual native turn')

  const eventToolCalls = toolCallsFromEvents(events)
  if (new Set(eventToolCalls.map(call => call.callId)).size !== eventToolCalls.length) {
    throw new Error('tool call IDs are duplicated')
  }
  const askCalls = eventToolCalls.filter(call => call.name === 'ask_user_question')
  const callById = new Map(events
    .filter(event => event.type === 'tool/call')
    .map(event => [asString(asRecord(event.data).callId, 'tool call id'), event] as const))
  const answered = new Set<string>()
  const rejectedCalls: RejectedQuestionCallObservation[] = []
  const answeredCalls: AnsweredQuestionCallObservation[] = []

  for (const askCall of askCalls) {
    const callEvent = callById.get(askCall.callId)
    if (callEvent === undefined) throw new Error(`ask call event is missing for ${askCall.callId}`)
    const result = toolResultRecord(events, askCall.callId)
    if (result.seq <= askCall.seq) throw new Error(`ask result does not follow its call for ${askCall.callId}`)
    const missingIds = declared.filter(id => !answered.has(id))
    const question = parseAskQuestionShape(askQuestionArguments(callEvent))
    const seen = new Set(question.ids)
    const hasUnknownOrDuplicate = !question.valid
      || seen.size !== question.ids.length
      || question.ids.some(id => !declared.includes(id))
    const lacksMissing = !hasUnknownOrDuplicate && missingIds.some(id => !seen.has(id))

    if (hasUnknownOrDuplicate || lacksMissing) {
      const reason = hasUnknownOrDuplicate ? 'invalid_question_ask' : 'missing_questions'
      const denial = reason === 'invalid_question_ask'
        ? options.invalidQuestionAskDenial(missingIds)
        : options.missingQuestionAskDenial(missingIds)
      if (!result.isError || result.text !== `Error: ${denial}`) {
        throw new Error(`ask call ${askCall.callId} lacks its exact production denial`)
      }
      rejectedCalls.push({
        callId: askCall.callId,
        reason,
        missingIds,
        seq: askCall.seq,
        resultSeq: result.seq,
        resultSha256: sha256Bytes(result.text),
        answered: false,
      })
      continue
    }

    if (result.isError) {
      throw new Error(`actual ask callback failed for valid arguments: ${askCall.callId}`)
    }
    const answerPayload = asRecord(JSON.parse(result.text))
    const rawAnswers = asArray(answerPayload.answers)
    if (rawAnswers.length !== question.ids.length) {
      throw new Error(`actual ask callback omitted required answers for ${askCall.callId}`)
    }
    const answerIds: string[] = []
    const answeredHere = new Set<string>()
    for (const raw of rawAnswers) {
      const answer = asRecord(raw)
      const id = asString(answer.id, 'answer id')
      if (
        answeredHere.has(id)
        || !question.ids.includes(id)
        || !declared.includes(id)
        || !Array.isArray(answer.selected)
        || answer.selected.some(value => typeof value !== 'string')
        || answer.custom !== options.answers[id]
      ) {
        throw new Error(`actual ask callback contains a missing, wrong, or undeclared answer: ${id}`)
      }
      answeredHere.add(id)
      answerIds.push(id)
    }
    if (question.ids.some(id => !answeredHere.has(id))) {
      throw new Error(`actual ask callback did not answer its exact invited IDs: ${askCall.callId}`)
    }
    for (const id of answerIds) {
      answered.add(id)
    }
    answeredCalls.push({
      callId: askCall.callId,
      questionIds: question.ids,
      answerIds,
      seq: askCall.seq,
      resultSeq: result.seq,
      resultSha256: sha256Bytes(result.text),
      answered: true,
    })
  }

  if (
    answeredCalls.length !== 1
    || options.callbackInvocations !== answeredCalls.length
  ) {
    throw new Error('actual callback seam does not contain exactly one successful joint ask')
  }
  if (declared.some(id => !answered.has(id))) {
    throw new Error('actual callbacks did not answer every declared required question')
  }
  const answeredIds = answeredCalls[0]!.answerIds
  if (
    new Set(answeredIds).size !== declared.length
    || declared.some(id => !answeredIds.includes(id))
  ) {
    throw new Error('the joint ask did not answer stance, scope, and need_questions exactly once')
  }
  const lastRequiredAnswerSeq = Math.max(...answeredCalls.map(call => call.resultSeq))
  if (rejectedCalls.some(call => call.resultSeq >= lastRequiredAnswerSeq)) {
    throw new Error('a rejected ask appears after the actual required answers')
  }

  const materialReads = eventToolCalls.filter(call => (
    call.name === 'case_read_material' || call.name === 'case_search'
  ))
  if (materialReads.length === 0) {
    throw new Error('no actual material read or search call follows the three answers')
  }
  if (materialReads.some(call => call.seq <= lastRequiredAnswerSeq)) {
    throw new Error('case_read_material or case_search occurred before all three actual answers')
  }
  const firstMaterialReadSeq = Math.min(...materialReads.map(call => call.seq))
  let listing: ScopedL0ListingObservation | undefined
  let listingSource: 'L0' | 'tool' | undefined
  const toolCalls = eventToolCalls
  for (const call of toolCalls.filter(call => call.name === 'case_list_materials')) {
    const result = toolResultRecord(events, call.callId)
    if (result.isError) continue
    const candidate = parseScopedToolListing(
      result.seq,
      false,
      toolResultValue(events, call.callId),
      firstMaterialReadSeq,
      options,
    )
    if (candidate === undefined) continue
    if (listing === undefined) {
      listing = candidate
      listingSource = 'tool'
    }
  }
  if (listingSource === undefined) {
    const contextEvents = events.filter(event => {
      if (event.type !== 'user/message' || event.seq >= currentRequestEvent.seq) return false
      const source = asRecord(event.data).source
      return source !== null
        && typeof source === 'object'
        && asRecord(source).kind === 'lawbench-context'
        && asRecord(source).form === 'snapshot'
    })
    const contextEvent = contextEvents.findLast(event => event.seq > turnStart.seq)
    if (contextEvent !== undefined) {
      listing = parseScopedL0Listing(
        contextEvent,
        currentRequestEvent,
        turnStart.seq,
        firstMaterialReadSeq,
        options,
      )
      listingSource = 'L0'
    }
  }
  if (listingSource === undefined || listing === undefined) {
    throw new Error(
      'no successful exact case_list_materials result or actual scoped L0 snapshot precedes every material read or search',
    )
  }

  const successfulSaveResults = toolCalls
    .filter(call => call.name === 'case_save_draft')
    .map(call => ({ call, result: toolResultRecord(events, call.callId) }))
    .filter(entry => !entry.result.isError)
  if (
    successfulSaveResults.length === 0
    || successfulSaveResults.some(entry => (
      entry.call.seq < lastRequiredAnswerSeq || entry.result.seq < lastRequiredAnswerSeq
    ))
  ) {
    throw new Error('no successful case_save_draft follows the actual required answers')
  }

  return {
    allAskCallIds: askCalls.map(call => call.callId),
    rejectedCalls,
    answeredCallIds: answeredCalls.map(call => call.callId),
    questionIds: answeredCalls.flatMap(call => call.questionIds),
    answerIds: answeredCalls.flatMap(call => call.answerIds),
    questionTexts: answeredCalls.flatMap(call => parseAskQuestionShape(askQuestionArguments(callById.get(call.callId)!)).questionTexts),
    answerTexts: declared.map(id => options.answers[id]!),
    lastRequiredAnswerSeq,
    firstMaterialReadSeq,
    listingSource,
    listingSourceSeq: listing.sourceSeq,
    listingNames: listing.names,
    listingScope: listing.scope,
    listingBeforeAnyMaterialRead: true,
    successfulSaveAfterRequiredAnswers: true,
  }
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
  title: string,
  text: string,
  expectedTitle: string,
): Record<string, boolean> {
  const header = [
    '编号',
    '证据名称',
    '控方证明目的',
    '真实性',
    '合法性',
    '关联性',
    '证明力',
    '出处',
  ] as const
  const tableCells = (line: string): string[] | undefined => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return undefined
    return trimmed.slice(1, -1).split('|').map(cell => cell.trim())
  }
  const separator = (cells: readonly string[]): boolean => (
    cells.length === header.length
    && cells.every(cell => /^:?-{3,}:?$/.test(cell))
  )
  const lines = text.split(/\r?\n/)
  const headerIndex = lines.findIndex(line => {
    const cells = tableCells(line)
    return cells !== undefined
      && cells.length === header.length
      && cells.every((cell, index) => cell === header[index])
  })
  const hasStandardEvidenceTable = headerIndex >= 0
    && separator(tableCells(lines[headerIndex + 1] ?? '') ?? [])
  const evidenceRows: string[][] = []
  if (hasStandardEvidenceTable) {
    for (const line of lines.slice(headerIndex + 2)) {
      const cells = tableCells(line)
      if (cells === undefined) break
      evidenceRows.push(cells)
    }
  }
  const checks = {
    hasPrimaryDraftTitle: title === expectedTitle,
    hasStandardEvidenceTable,
    hasFourEvidenceRows: evidenceRows.length === 4,
    evidenceRowsHaveEightColumns: (
      evidenceRows.length === 4
      && evidenceRows.every(row => row.length === header.length)
    ),
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
    prompt.trim().length === 0
    || prompt.includes('以下为测试说明')
    || prompt.includes('不给模型看')
  ) {
    throw new Error('canonical user prompt is empty or includes test explanation')
  }
  return prompt
}

async function runNativeCrossExam(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== '--credential-stdin') {
    throw new Error('usage: native-cross-exam.mts --credential-stdin')
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
  const question: QuestionCapture = {
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
  }
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
  let taskSettlement: TaskSettlementController | undefined
  let settledTaskProof: TaskSettlementProof | undefined
  let taskSettlementAttempted = false
  let taskSettlementFailure = ''
  let taskSettlementError: unknown
  let primaryTitle = ''
  let liveEvents: readonly NativeEvent[] = []
  let browserDisposed = false
  let contextDisposed = false
  let bStopped = false
  let agentJoined = false
  let environmentRestored = false
  let environment: EnvironmentLease | undefined

  const report: RunReport = {
    format: 'lawbench-t18-cross-exam-native-report-v1',
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
    taskSettlement: {
      attempted: false,
      outcome: 'not_started',
    },
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
    manualAcceptance: {
      required: true,
      questionSemantics: 'PENDING_ROOT_REVIEW',
      evidenceRowNamesAndProofPurposes: 'PENDING_ROOT_REVIEW',
      disputedEvidenceExplanations: 'PENDING_ROOT_REVIEW',
      noQuestionsOutline: 'PENDING_ROOT_REVIEW',
      selfCheckInFinalReply: 'PENDING_ROOT_REVIEW',
      saveInstructionInReply: 'PENDING_ROOT_REVIEW',
      businessAcceptance: false,
      legalMeritsAcceptance: false,
    },
    claims: {
      oneSyntheticWorkflowOnly: true,
      actualSingleCrossExamConsumer: false,
      actualModelAuthoredCrossExamOpinion: false,
      businessAcceptance: false,
      legalAcceptance: false,
      manualCrossExamBusinessLegalReviewRequired: true,
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
      template: 'criminal',
      kind: 'criminal',
    }), 'caseOpen')
    caseId = asString(opened.case_id, 'case_id')
    if (opened.created !== true || opened.kind !== 'criminal') {
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
      const type = asString(row.type, `material ${name} type`)
      const unit = asString(row.unit, `material ${name} unit`)
      if (extname(relPath).toLowerCase() !== '.md' || type !== 'md' || unit !== 'line') {
        throw new Error(`material ${name} is not an approved line-addressed Markdown source`)
      }
      return {
        materialId,
        name,
        type,
        unit,
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
    const skillRows = asArray(asRecord(skills.value).skills).map(asRecord)
    const primarySkill = skillRows.find(raw => raw.name === SKILL)
    if (primarySkill === undefined) {
      throw new Error(`${SKILL} is absent from the production Skill catalog`)
    }
    primaryTitle = asString(primarySkill.title, 'primary Skill title')
    if (primaryTitle.trim().length === 0) throw new Error('primary Skill title is empty')
    const primaryParams = asRecord(primarySkill.params)
    if (
      primarySkill.kind !== 'draft'
      || primaryParams.thinking !== '中'
      || primaryParams.window !== '128K'
      || primaryParams.max_tokens !== TASK_MAX_TOKENS
    ) {
      throw new Error('primary cross-exam Skill kind or declared parameters changed')
    }
    const declaredQuestions = asArray(await remote.skillQuestions(SKILL)).map(asRecord)
    if (
      JSON.stringify(declaredQuestions.map(row => row.key).sort())
      !== JSON.stringify([...QUESTION_IDS].sort())
      || declaredQuestions.some(row => {
        const id = asString(row.key, 'declared question key') as QuestionId
        return typeof row.question !== 'string'
          || row.question.trim().length === 0
          || row.fromMaterials !== QUESTION_FROM_MATERIALS[id]
      })
    ) {
      throw new Error('current primary Host catalog does not declare stance, scope, and need_questions with their sources')
    }
    const taskParams = {
      thinking: asString(primaryParams.thinking, 'primary thinking'),
      window: asString(primaryParams.window, 'primary window'),
      max_tokens: asInteger(primaryParams.max_tokens, 'primary max_tokens'),
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

    taskSettlement = createTaskSettlement({
      caseId,
      sessionId,
      requestId,
      skill: SKILL,
      selectionId,
    }, {
      query: () => remote.callApi(apiRoute('tasksList'), { case_id: caseId }),
      readOwnedTaskMetadata: async (ownedTaskId: string) => {
        if (!TASK_ID.test(ownedTaskId)) throw new Error('owned task path ID is invalid')
        const taskDir = join(caseRoot, '工作区', '任务', ownedTaskId)
        return {
          taskId: ownedTaskId,
          task: asRecord(JSON.parse(await readFile(join(taskDir, 'task.json'), 'utf8'))),
          result: asRecord(JSON.parse(await readFile(join(taskDir, 'result.json'), 'utf8'))),
        }
      },
      sleep: milliseconds => new Promise(done => setTimeout(done, milliseconds)),
    })

    const beforeSeq = Number(nativeSession.seq)
    const modelNetworkStart = network.length
    taskSettlement.arm()
    report.taskSettlement = { attempted: true, outcome: 'pending' }
    await withWatchdog(production.commands.prompt({
      sessionId,
      requestId: submission.requestId,
      mode: 'queue',
      content: [{ type: 'text', text: promptText }],
    }))
    await withWatchdog(agent.whenIdle())
    agentJoined = true
    taskSettlementAttempted = true
    try {
      const settlement = await withWatchdog(taskSettlement.settle())
      if (settlement === undefined) throw new Error('started task settlement was not armed')
      settledTaskProof = settlement
      report.taskSettlement = {
        attempted: true,
        outcome: 'settled',
        taskId: settlement.taskId,
        taskState: settlement.taskState,
        terminalStatus: settlement.terminalStatus,
        attempts: settlement.attempts,
      }
    } catch (error: unknown) {
      taskSettlementError = error
      taskSettlementFailure = error instanceof Error ? error.name : 'unknown'
      cleanupFailures.push(`task_end_drain_failed: ${taskSettlementFailure}`)
      report.taskSettlement = { attempted: true, outcome: 'failed' }
    }
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
    const firstAskSeq = Math.min(
      ...toolCalls.filter(call => call.name === 'ask_user_question').map(call => call.seq),
    )
    if (!turnEvents.some(event => (
      event.seq < firstAskSeq && skillNameFromCall(event) === SKILL
    ))) {
      throw new Error(`${SKILL} was not loaded before the actual joint question`)
    }
    if (toolCalls.some(call => call.name === 'case_read_input')) {
      throw new Error('cross-exam scenario has no selected L1 input and must not call case_read_input')
    }
    const runtimeSkill = manifest.dependencies.find(entry => entry.role === 'cross-exam-opinion-skill')
    if (
      runtimeSkill === undefined
      || runtimeSkill.bytes !== manifest.skill.bytes
      || runtimeSkill.sha256 !== manifest.skill.sha256
    ) {
      throw new Error('runtime cross-exam Skill identity differs from the approved input')
    }
    report.skillSource = {
      name: SKILL,
      title: primaryTitle,
      kind: 'draft',
      declaredParams: primaryParams,
      path: runtimeSkill.path,
      bytes: runtimeSkill.bytes,
      sha256: runtimeSkill.sha256,
      listed: true,
      loaded: true,
    }
    const capturedQuestion = question.value
    const unsupportedQuestionIds = [...question.unsupportedQuestionIds].sort()
    if (unsupportedQuestionIds.length > 0) {
      throw new Error(`UNSUPPORTED_SYNTHETIC_QUESTION: ${unsupportedQuestionIds.join(',')}`)
    }
    if (
      capturedQuestion === null
      || question.answeredCallbackCount === 0
    ) {
      throw new Error('the synthetic lawyer did not answer an actual question call')
    }
    if (
      question.answeredQuestionIds.size !== QUESTION_IDS.length
      || JSON.stringify([...capturedQuestion.answerIds].sort())
        !== JSON.stringify([...QUESTION_IDS].sort())
    ) {
      throw new Error('lawyer callbacks did not answer the exact three declared IDs')
    }
    if (question.answers === null) {
      throw new Error('authorized synthetic answers were not loaded by the actual ask callback')
    }
    const questionObservation = observeQuestionCallbacks(turnEvents, {
      callbackInvocations: question.answeredCallbackCount,
      declaredQuestionIds: QUESTION_IDS,
      answers: question.answers,
      invalidQuestionAskDenial: production.invalidQuestionAskDenial,
      missingQuestionAskDenial: production.questionRequirementDenial,
      requestId,
      expectedListingNames: materialReads.map(material => material.name),
      expectedListingScope: materialReads.map(material => ({
        materialId: material.materialId,
        version: material.originalSha256,
      })),
    })
    const saveCalls = toolCalls.filter(call => call.name === 'case_save_draft')
    const lastRequiredAnswerSeq = questionObservation.lastRequiredAnswerSeq
    report.question = {
      callIds: questionObservation.allAskCallIds,
      answeredCallIds: questionObservation.answeredCallIds,
      rejectedCalls: questionObservation.rejectedCalls,
      questionIds: capturedQuestion.questionIds,
      questionTexts: questionObservation.questionTexts,
      answerIds: capturedQuestion.answerIds,
      unsupportedQuestionIds,
      primaryCatalog: true,
      actualCallbackInvocations: question.answeredCallbackCount,
      totalCallbackAttempts: question.invocationCount,
      questionTextSha256: sha256Bytes(capturedQuestion.questionText),
      answerTextSha256: sha256Bytes(capturedQuestion.answerText),
      syntheticCallback: true,
      realHumanReply: false,
      authorizedAnswerFile: AUTHORIZED_SYNTHETIC_ANSWERS_PATH,
      authorizedAnswerFileSha256: AUTHORIZED_SYNTHETIC_ANSWERS_SHA256,
      providedStance: question.answers.stance,
      stanceSource: 'canonical-task',
      beforeFirstSuccessfulSave: true,
      stanceAnswerBeforeAnyMaterialRead: true,
      scopeAnswerBeforeAnyMaterialRead: true,
      needQuestionsAnswerBeforeAnyMaterialRead: true,
      threeKnownQuestionSemanticsManualReviewRequired: true,
      listingSource: questionObservation.listingSource,
      listingSourceSeq: questionObservation.listingSourceSeq,
      listingNames: questionObservation.listingNames,
      listingScope: questionObservation.listingScope,
      listingBeforeAnyMaterialRead: true,
    }
    const suggestionCalls = toolCalls.filter(call => call.name === 'case_suggest_wiki')
    const successfulSuggestions = suggestionCalls.flatMap(call => {
      const result = toolResultRecord(turnEvents, call.callId)
      if (result.isError) return []
      const event = turnEvents.find(candidate => (
        candidate.type === 'tool/call'
        && asRecord(candidate.data).callId === call.callId
      ))!
      return [{
        callId: call.callId,
        argumentsSha256: sha256Bytes(JSON.stringify(toolArguments(event))),
        resultSha256: sha256Bytes(result.text),
      }]
    })
    report.suggestions = {
      actualSuccessfulCallCount: successfulSuggestions.length,
      calls: successfulSuggestions,
      validatedLawyerFacts: false,
      lawyerConfirmedCard: false,
    }

    let completedTask: Record<string, unknown> | undefined = settledTaskProof?.taskListRow
    if (completedTask === undefined) throw new Error('cross-exam task produced no completed task')
    taskId = asString(completedTask.task_id, 'task_id')
    if (
      !TASK_ID.test(taskId)
      || taskId === selectionId
      || completedTask.status !== 'completed'
    ) {
      throw new Error('cross-exam task identity or terminal state is invalid')
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
    const citationProblems = asArray(citationCheck.problems).map(asRecord)
    const citationProblemClasses = citationProblems.map(row => asString(row.class, 'citation problem class'))
    const citationMustFixProblems = citationProblems.filter(row => row.severity === 'must_fix')
    const citationQualityHints = citationProblems.filter(row => row.severity === 'hint')
    if (
      citationCheck.passed !== true
      || citationStats.must_fix !== 0
      || citationMustFixProblems.length !== 0
      || citationProblemClasses.some(cls => ['A', 'B', 'C', 'D', 'E'].includes(cls))
      || citationProblems.some(row => !['must_fix', 'hint'].includes(String(row.severity)))
      || citationStats.hints !== citationQualityHints.length
    ) {
      throw new Error('draft citation check did not retain every hint while reaching must_fix=0')
    }
    report.citationCheck = {
      stats: citationStats,
      qualityHints: citationQualityHints,
      problems: citationProblems,
    }
    const coverage = parseTaskCoverage(
      result.coverage,
      asArray(reads.reads).map(asRecord),
      materialReads,
    )
    const fullyReadNames = asArray(asRecord(coverage).fully_read).map((name, index) => (
      asString(name, `fully read name ${index + 1}`)
    ))
    if (JSON.stringify([...fullyReadNames].sort()) !== JSON.stringify([...MATERIAL_NAMES].sort())) {
      throw new Error('cross-exam coverage did not fully read all five current materials')
    }
    report.coverage = coverage
    report.reads = reads.reads

    const readRows = asArray(reads.reads).map(asRecord)
    if (readRows.length === 0) throw new Error('cross-exam task has no actual material reads')
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
    const materialCalls = toolCalls.filter(call => call.name === 'case_read_material')
    const sourceReads: NonNullable<RunReport['sourceReads']>[number][] = []
    const sourceRangesByCallId = new Map<
      string,
      readonly { readonly materialId: string; readonly from: number; readonly to: number }[]
    >()
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
      let names: string[]
      let reportParts: Record<string, unknown>[]
      if (args.more_names === undefined) {
        const actualName = asString(resultValue.name, 'single read name')
        const materialId = asString(resultValue.material_id, 'single read material_id')
        const material = materialReads.find(item => item.materialId === materialId)
        const from = asInteger(resultValue.start, 'single read start')
        const to = asInteger(resultValue.end, 'single read end')
        if (
          actualName !== firstName
          || material === undefined
          || material.name !== actualName
          || asString(resultValue.unit, 'single read unit') !== material.unit
          || from < 1
          || to < from
          || to > material.unitCount
          || asString(resultValue.text, 'single read text').trim().length === 0
        ) {
          throw new Error(`case_read_material call ${call.callId} returned an invalid single read`)
        }
        names = [actualName]
        reportParts = [{
          name: actualName,
          material_id: materialId,
          unit: resultValue.unit,
          start: from,
          end: to,
          read: true,
        }]
        sourceRangesByCallId.set(call.callId, [{ materialId, from, to }])
      } else {
        if (resultValue.parts === undefined) {
          throw new Error(`case_read_material call ${call.callId} omitted batched part status`)
        }
        const partRows = asArray(resultValue.parts).map(asRecord)
        const returnedNames = partRows.map((part, index) => (
          asString(part.name, `read part ${index + 1} name`)
        ))
        if (
          returnedNames.length !== requestedNames.length
          || JSON.stringify([...returnedNames].sort()) !== JSON.stringify([...requestedNames].sort())
        ) {
          throw new Error(`case_read_material call ${call.callId} returned a different material set`)
        }
        names = partRows
          .filter(part => part.read === true)
          .map((part, index) => asString(part.name, `read part ${index + 1} name`))
        reportParts = partRows.map(part => ({ ...part }))
        const ranges: { materialId: string; from: number; to: number }[] = []
        for (const part of partRows) {
          if (part.read !== true) continue
          const materialId = asString(part.material_id, 'read part material_id')
          const material = materialReads.find(item => item.materialId === materialId)
          const from = asInteger(part.start, 'read part start')
          const to = asInteger(part.end, 'read part end')
          if (
            material === undefined
            || from < 1
            || to < from
            || to > material.unitCount
          ) {
            throw new Error(`case_read_material call ${call.callId} returned an invalid read range`)
          }
          ranges.push({ materialId, from, to })
        }
        sourceRangesByCallId.set(call.callId, ranges)
      }
      if (names.length === 0) throw new Error(`case_read_material call ${call.callId} reported no actual read`)
      for (const name of names) {
        if (!MATERIAL_NAMES.includes(name as typeof MATERIAL_NAMES[number])) {
          throw new Error(`model read an unapproved material name ${name}`)
        }
      }
      sourceReads.push({
        names,
        parts: reportParts,
        textSha256: sha256Bytes(resultText),
        textLength: resultText.length,
      })
    }
    report.sourceReads = sourceReads

    const draftRows = asArray(result.drafts).map(asRecord)
    const latestDraft = draftRows.at(-1)
    if (latestDraft === undefined) {
      throw new Error('completed task has no final titled cross-exam draft')
    }
    const actualTitle = asString(latestDraft.title, 'draft title')
    if (actualTitle.trim().length === 0) {
      throw new Error('completed task has no nonempty cross-exam title')
    }
    if (actualTitle !== primaryTitle) {
      throw new Error('final cross-exam title does not match the primary Skill title')
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
    if (draftText.trim().length === 0) throw new Error('saved cross-exam draft is empty')
    const matchingSave = saveCalls.findLast(call => {
      const event = turnEvents.find(candidate => (
        candidate.type === 'tool/call'
        && asRecord(candidate.data).callId === call.callId
      ))!
      const args = toolArguments(event)
      return typeof args.title === 'string'
        && args.title.trim().length > 0
        && typeof args.content === 'string'
        && args.content.trim().length > 0
        && args.title === actualTitle
        && args.content === draftText
    })
    if (matchingSave === undefined || matchingSave.seq < lastRequiredAnswerSeq) {
      throw new Error('saved cross-exam draft is not a post-answer model-authored tool argument')
    }
    const unitsReadBeforeSave = new Map<string, Set<number>>()
    for (const call of materialCalls.filter(item => item.seq < matchingSave.seq)) {
      for (const range of sourceRangesByCallId.get(call.callId) ?? []) {
        const units = unitsReadBeforeSave.get(range.materialId) ?? new Set<number>()
        for (let unit = range.from; unit <= range.to; unit += 1) units.add(unit)
        unitsReadBeforeSave.set(range.materialId, units)
      }
    }
    if (materialReads.some(material => (
      (unitsReadBeforeSave.get(material.materialId)?.size ?? 0) !== material.unitCount
    ))) {
      throw new Error('all five required source materials were not fully read before the final save')
    }
    const matchingResult = toolResultValue(turnEvents, matchingSave.callId)
    if (
      matchingResult.path !== draftRel
      || matchingResult.version !== latestDraft.version
    ) {
      throw new Error('saved draft bytes do not match the actual case_save_draft result')
    }

    const citationRows = asArray(result.citations).map(asRecord)
    if (citationRows.length === 0) throw new Error('saved cross-exam draft has no parsed citations')
    const citationResolutions: CitationResolution[] = []
    const seenCitations = new Set<string>()
    const citedMaterialIds = new Set<string>()
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
      citedMaterialIds.add(materialId)
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
    if (citedMaterialIds.size === 0) {
      throw new Error('parsed citations do not include any current material version')
    }
    report.citations = citationResolutions
    const machineChecks = assertDraftMachineChecks(actualTitle, draftText, primaryTitle)
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
      expectedEvidenceNames: [...EVIDENCE_NAMES],
      path: draftRel,
      version: asInteger(latestDraft.version, 'draft version'),
      bytes: draftBytes.byteLength,
      sha256: sha256Bytes(draftBytes),
      length: draftText.length,
      machineChecks,
    }
    if (taskSettlementError !== undefined) throw taskSettlementError
    const stopped = await service.stop()
    bStopped = true
    report.bService = {
      ready: service.ready,
      final: stopped.final,
      exitCode: stopped.code,
      forcedStop: stopped.forced,
    }
    if (stopped.code !== 0 || stopped.final.passed !== true || stopped.forced) {
      throw new Error('finite B cross-exam service did not stop cleanly')
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
    report.claims.actualSingleCrossExamConsumer = true
    report.claims.actualModelAuthoredCrossExamOpinion = true
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
    if (
      taskSettlement?.isArmed() === true
      && settledTaskProof === undefined
      && !taskSettlementAttempted
    ) {
      taskSettlementAttempted = true
      report.taskSettlement = { attempted: true, outcome: 'pending' }
      try {
        const settlement = await withWatchdog(taskSettlement.settle())
        if (settlement === undefined) throw new Error('started task settlement was not armed')
        settledTaskProof = settlement
        report.taskSettlement = {
          attempted: true,
          outcome: 'settled',
          taskId: settlement.taskId,
          taskState: settlement.taskState,
          terminalStatus: settlement.terminalStatus,
          attempts: settlement.attempts,
        }
      } catch (error: unknown) {
        taskSettlementFailure = error instanceof Error ? error.name : 'unknown'
        cleanupFailures.push(`task_end_drain_failed: ${taskSettlementFailure}`)
        report.taskSettlement = {
          attempted: true,
          outcome: 'failed',
        }
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
    citationMustFix: sanitized.citationCheck?.stats.must_fix ?? null,
    modelPostAttempts: sanitized.networkSummary.modelPostAttempts,
    modelPostHttp200: sanitized.networkSummary.modelPostHttp200,
    manualReviewRequired: true,
  }, null, 2)}\n`)
  if (sanitized.status === 'FAILED') process.exitCode = 1
}

if (
  process.argv[1] !== undefined
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await runNativeCrossExam()
}
