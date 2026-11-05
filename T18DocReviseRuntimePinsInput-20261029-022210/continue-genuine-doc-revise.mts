/**
 * Finite T18 genuine doc-revise continuation consumer.
 *
 * It copies the actual 115-event case state and one Native Session into a fresh
 * private root, resumes that same session UUID through production, and executes
 * exactly one ordinary doc-revise task. The two selected prior inputs are the
 * immutable original v2 review and the genuine completed pre-issue checklist v4.
 *
 * This consumer does not rerun pre-issue-check, manufacture its TaskState, or
 * claim that the earlier two-stage failure passed. The legal correction remains
 * entirely model-authored. A successful result must be the exact contiguous
 * article correction 七 -> 4.1 inside the original risk-3 block.
 *
 * Authoring status: AUTHORED_NOT_RUN. This source contains no credential
 * source other than non-interactive stdin. The finite B token is generated in
 * memory and passed to the owned child process over its stdin pipe.
 */

import { createHash, randomBytes } from 'node:crypto'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  copyFile,
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

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_ROOT = 'D:/Lawbeach/lawbench-B'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'literalfixed-inputs.json')
const FIXED_INPUTS_FORMAT = 'lawbench-t18-genuine-doc-revise-continuation-inputs-v1'
const TASK_NAME = 'A-T18-genuine-doc-revise-continuation-20261029-013610'
const B_SERVICE_SCRIPT = join(EVIDENCE_DIR, 'b-service-doc-revise.py')
const ACTUAL_RESOURCE_BYTES = 8_494
const ACTUAL_RESOURCE_SHA256 = '1d76a908ef33b9d27d50123a2f534cfce233cb15b44b1f29f6c2437255e26990'
const ROOT_CLOSURE_BYTES = 16_263
const ROOT_CLOSURE_SHA256 = 'f08fb62048249bae3e35b5247164e4939869674d314c4ac358bbf2af9a6c0ad5'
const MODEL_ORIGIN = 'http://10.126.126.1:8000'
const MODEL_URL = `${MODEL_ORIGIN}/v1`
const MODEL = 'qwen38-27b'
const PROVIDER = 'lawfirm'
const CREDENTIAL_REF = 'LAWFIRM_KEY'
const MAX_CREDENTIAL_BYTES = 4096
const TECHNICAL_WATCHDOG_MS = 86_400_000
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/

const ORIGINAL_SESSION_ID = 'session-1cb28369-3a90-46dc-b047-e64986038394'
const ORIGINAL_REQUEST_ID = '60fda87b-25a9-40c1-9abd-1e4893fa7b8b'
const ORIGINAL_TASK_ID = 'T-20261028234100-6b49'
const ORIGINAL_CASE_ID = '9d535ab5-f14c-42cc-bd99-a2f669ff6200'
const ORIGINAL_SESSION_CWD =
  'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\QuestionGateContractWorkflow-20261028-191702\\run-fQoiXe\\case'
const ORIGINAL_DRAFT = `工作区/任务/${ORIGINAL_TASK_ID}/草稿/合同审查意见-v2.md`
const ORIGINAL_DRAFT_SHA256 = '1b095356f48c4a7ae9e94bd171c92377385d70ff3730c59fcb50f26822cba31d'
const ORIGINAL_SESSION_BYTES = 240_391
const ORIGINAL_SESSION_SHA256 = 'cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5'
const PRE_ISSUE_TASK_ID = 'T-20261029012044-5869'
const PRE_ISSUE_REQUEST_ID = 'b91ca8e9-4d23-47bb-b249-c8e46fb7dd06'
const PRE_ISSUE_CHECKLIST = `工作区/任务/${PRE_ISSUE_TASK_ID}/草稿/出稿前审查-合同审查意见-v4.md`
const PRE_ISSUE_CHECKLIST_BYTES = 2_351
const PRE_ISSUE_CHECKLIST_SHA256 = 'b01af533b523c9752a84fd3801d3de1cfd46db5fb75642888aaa6bad493abe2f'
const ACTUAL_SESSION_BYTES = 419_109
const ACTUAL_SESSION_SHA256 = '18f9cd26127b50f9cc220f9149f0769800d1577f5d8a8ecd9fed0d98f0b1912c'
const ACTUAL_ROWS = 116
const ACTUAL_EVENTS = 115
const REVISE_SKILL = 'doc-revise'
const REVISION_TITLE = '合同审查意见-修改稿'
const MATERIAL_NAMES = ['采购合同', '采购部内部意见'] as const
const STAGE2_PROMPT =
  '继续同一会话。材料批已在提交前由我明确取消，本次仍不使用材料范围，只使用普通对话和已选择的前序成果：原稿《合同审查意见》v2 与阶段一的出稿前审查清单。请严格加载 doc-revise。我的修改意见只有一项：按《采购合同》原文核对并改正风险3中的错误条款编号；除此必要更正外，保持原结构、出处和文字不变，不增加新的法律判断或事实。请实际使用 case_read_input 读取上述两份前序成果，并用 case_read_material 回读合同相关段落。把修改后全文按 Skill 要求保存，不向外部发送材料。'
const REVISE_DRAFT_ANSWER = '确认：本次修改已选的原稿《合同审查意见》v2。'
const OPINIONS_ANSWER =
  '确认：按阶段一出稿前审查清单和《采购合同》原文，只改正风险3中的错误条款编号；其他结构、出处和文字保持不变。'
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
  readonly entryCount?: number
}

interface CaseEntry extends FixedEntry {
  readonly relative: string
}

interface FixedInputManifest {
  readonly format: typeof FIXED_INPUTS_FORMAT
  readonly task: typeof TASK_NAME
  readonly hashAlgorithm: 'sha256'
  readonly genuineInputs: FixedEntry
  readonly actualResource: FixedEntry
  readonly rootClosure: FixedEntry
  readonly reviewedBSourcePins: FixedEntry
  readonly originalReportEvidence: FixedEntry
  readonly originalCaseRoot: string
  readonly originalSessionsRoot: string
  readonly originalCaseId: typeof ORIGINAL_CASE_ID
  readonly originalTaskId: typeof ORIGINAL_TASK_ID
  readonly originalRequestId: typeof ORIGINAL_REQUEST_ID
  readonly nativeSessionId: typeof ORIGINAL_SESSION_ID
  readonly originalDraft: typeof ORIGINAL_DRAFT
  readonly appdataFiles: readonly (FixedEntry & { readonly relative: string; readonly mtime_ns: string })[]
  readonly caseFiles: readonly CaseEntry[]
  readonly sessionFiles: readonly (CaseEntry & { readonly kind: 'native-session' })[]
  readonly dependencies: readonly FixedEntry[]
  readonly runtimeExecutables: readonly FixedEntry[]
  readonly consumer: FixedEntry
  readonly bServiceEntry: FixedEntry
}

interface AdmissionRecord {
  readonly checkedAtUtc: string
  readonly manifestSha256: string
  readonly caseFileCount: number
  readonly sessionFileCount: number
  readonly appdataFileCount: number
  readonly dependencyCount: number
  readonly runtimeExecutableCount: number
  readonly reviewedBSourcePinsSha256: string
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
  readonly requestHeader?: unknown
  readonly requestHeaderAnchor?: {
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

type QuestionRole = 'draft' | 'opinions'

interface QuestionRecord {
  readonly questionIds: readonly string[]
  readonly questionText: string
  readonly optionLabels: readonly string[]
  readonly rolesByQuestion: readonly (readonly QuestionRole[])[]
  readonly answerIds: readonly string[]
  readonly answerText: string
}

interface QuestionCapture {
  value: QuestionRecord | null
}

interface QuestionOrderRecord {
  readonly answerCallId: string
  readonly answerCallSeq: number
  readonly answerResultSeq: number
  readonly answerResultSha256: string
  readonly answerResultLength: number
  readonly draftCallId: string
  readonly draftCallSeq: number
  readonly draftResultSeq: number
}

interface SourceResponseRecord {
  readonly name: string
  readonly loc: unknown
  readonly citation: string
  readonly textSha256: string
  readonly textLength: number
  readonly sourceChanged: boolean
  readonly originalStatus: string | undefined
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

interface CopiedIdentity {
  readonly source: string
  readonly destination: string
  readonly relative: string
  readonly bytes: number
  readonly sha256: string
}

interface ReportQuestion {
  readonly questionIds: readonly string[]
  readonly rolesByQuestion: readonly (readonly QuestionRole[])[]
  readonly answerIds: readonly string[]
  readonly questionTextSha256: string
  readonly questionTextLength: number
  readonly answerTextSha256: string
  readonly answerTextLength: number
}

interface StageRecord {
  readonly stage: 2
  readonly skill: typeof REVISE_SKILL
  selectionId: string
  taskId?: string
  requestId?: string
  taskParams?: Record<string, unknown>
  beforeSeq?: number
  afterSeq?: number
  turn?: NativeTurnRecord
  toolCalls?: readonly ToolCallRecord[]
  question?: ReportQuestion
  questionOrder?: QuestionOrderRecord
  taskState?: Record<string, unknown>
  taskResult?: Record<string, unknown>
  coverage?: unknown
  readRanges?: unknown
  inputReads?: readonly {
    readonly index: number
    readonly start: number
    readonly end: number
    readonly hasMore: boolean
    readonly resultSha256: string
    readonly resultLength: number
  }[]
  sourceReadTextSha256s?: readonly string[]
  citationResponses?: readonly SourceResponseRecord[]
  draft?: {
    readonly title: string
    readonly path: string
    readonly version: number
    readonly bytes: number
    readonly sha256: string
  }
}

interface OneEditRecord {
  readonly prefixBytes: number
  readonly suffixBytes: number
  readonly oldTextSha256: string
  readonly newTextSha256: string
  readonly oldTextLength: number
  readonly newTextLength: number
  readonly removesArticle7: true
  readonly introducesArticle4_1: true
}

interface ExecutedStage extends StageRecord {
  readonly draftText: string
}

interface RunReport {
  format: 'lawbench-t18-genuine-doc-revise-continuation-v1'
  task: typeof TASK_NAME
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
    readonly actualCurrentTwoMaterialCaseOnly: true
    readonly materialNames: readonly string[]
    readonly explicitCancelBatchBeforeBegin: true
    readonly priorInputOnly: true
    readonly requestScopePrepareCalls: 0
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
  originalFilesHeld: boolean
  bService?: {
    readonly ready: BServiceReady
    readonly final: Record<string, unknown>
    readonly exitCode: number | null
    readonly forcedStop: boolean
  }
  copy?: {
    readonly caseFiles: readonly CopiedIdentity[]
    readonly sessionFiles: readonly CopiedIdentity[]
  }
  case?: {
    readonly caseId: string
    readonly path: string
    readonly materialIds: readonly string[]
    readonly originalAreaFiles: readonly string[]
    readonly created: false
  }
  preIssueInputs?: {
    readonly taskId: typeof PRE_ISSUE_TASK_ID
    readonly requestId: typeof PRE_ISSUE_REQUEST_ID
    readonly checklistPath: typeof PRE_ISSUE_CHECKLIST
    readonly checklistBytes: typeof PRE_ISSUE_CHECKLIST_BYTES
    readonly checklistSha256: typeof PRE_ISSUE_CHECKLIST_SHA256
    readonly sourceUnchanged: true
  }
  nativeSessionId?: string
  resumedSession?: {
    readonly sameUuid: true
    readonly originalCwdPreserved: true
    readonly actual115EventPrefixPreserved: true
  }
  stages: StageRecord[]
  oneEdit?: OneEditRecord
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
  materialReads?: readonly MaterialReadRecord[]
  persistence?: {
    readonly root: string
    readonly sessionReopened: boolean
    readonly liveEqualsReopened: boolean
    readonly physicalJsonlPath: string
    readonly physicalJsonlBytes: number
    readonly physicalJsonlSha256: string
    readonly physicalEventCount: number
    readonly actualPrefixBytes: number
    readonly actualPrefixPreserved: boolean
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
  secondaryErrors: unknown[]
  claims: {
    readonly oneSyntheticWorkflowOnly: true
    actualSingleDocReviseSkillConsumer: boolean
    actualModelAuthoredRevision: boolean
    readonly oldTwoStageFailedRetained: true
    readonly priorChecklistNotRerun: true
    readonly fullT18: false
    readonly businessAcceptance: false
    readonly legalAcceptance: false
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
  const manifestBytes = await readFile(FIXED_INPUTS_PATH)
  const manifestSha256 = sha256Bytes(manifestBytes)
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as FixedInputManifest
  if (
    manifest.format !== FIXED_INPUTS_FORMAT
    || manifest.task !== TASK_NAME
    || manifest.hashAlgorithm !== 'sha256'
    || manifest.caseFiles.length !== 23
    || manifest.sessionFiles.length !== 1
    || manifest.appdataFiles.length !== 2
    || manifest.originalCaseId !== ORIGINAL_CASE_ID
    || manifest.originalTaskId !== ORIGINAL_TASK_ID
    || manifest.originalRequestId !== ORIGINAL_REQUEST_ID
    || manifest.nativeSessionId !== ORIGINAL_SESSION_ID
    || manifest.originalDraft !== ORIGINAL_DRAFT
    || !manifest.caseFiles.some(entry => (
      entry.relative === PRE_ISSUE_CHECKLIST
      && entry.bytes === PRE_ISSUE_CHECKLIST_BYTES
      && entry.sha256 === PRE_ISSUE_CHECKLIST_SHA256
    ))
    || manifest.reviewedBSourcePins.entryCount !== 346
    || manifest.caseFiles.some(entry => (
      entry.path.includes('_任务说明')
      || entry.path.includes('要点.md')
      || entry.relative.length === 0
      || entry.relative.startsWith('/')
      || entry.relative.split('/').some(part => part === '' || part === '.' || part === '..')
      || !Number.isSafeInteger(entry.bytes)
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
      || !/^[0-9]+$/.test(entry.mtime_ns ?? '')
    ))
    || manifest.sessionFiles[0]?.kind !== 'native-session'
    || !manifest.dependencies.some(entry => entry.role === 'persona')
    || !manifest.dependencies.some(entry => entry.role === 'current-compiled-agent')
    || !manifest.dependencies.some(entry => entry.role === 'current-compiled-host')
  ) {
    throw new Error('fixed-inputs manifest header is invalid')
  }
  for (const entry of [...manifest.caseFiles, ...manifest.sessionFiles]) {
    await ordinaryFileIdentity(
      entry.path,
      entry.bytes,
      entry.sha256,
      asString(entry.mtime_ns, 'copied source mtime_ns'),
    )
  }
  for (const entry of manifest.appdataFiles) {
    await ordinaryFileIdentity(
      entry.path,
      entry.bytes,
      entry.sha256,
      entry.mtime_ns,
    )
  }
  for (const entry of [
    manifest.genuineInputs,
    manifest.actualResource,
    manifest.rootClosure,
    manifest.reviewedBSourcePins,
    manifest.originalReportEvidence,
    ...manifest.dependencies,
    ...manifest.runtimeExecutables,
    manifest.consumer,
    manifest.bServiceEntry,
  ]) {
    await ordinaryFile(entry.path, entry.bytes, entry.sha256)
  }
  if (
    manifest.genuineInputs.bytes !== 10_014
    || manifest.genuineInputs.sha256 !== 'e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1'
    || sha256Bytes(await readFile(manifest.genuineInputs.path))
      !== 'e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1'
    || manifest.actualResource.bytes !== ACTUAL_RESOURCE_BYTES
    || manifest.actualResource.sha256 !== ACTUAL_RESOURCE_SHA256
    || sha256Bytes(await readFile(manifest.actualResource.path)) !== ACTUAL_RESOURCE_SHA256
    || manifest.rootClosure.bytes !== ROOT_CLOSURE_BYTES
    || manifest.rootClosure.sha256 !== ROOT_CLOSURE_SHA256
    || sha256Bytes(await readFile(manifest.rootClosure.path)) !== ROOT_CLOSURE_SHA256
  ) {
    throw new Error('frozen input, actual resource, or root closure source pin changed')
  }
  const captured = asRecord(JSON.parse(await readFile(manifest.actualResource.path, 'utf8')))
  const capturedRows = (field: 'case_files' | 'session_files' | 'appdata_files'): unknown[] => (
    asArray(captured[field]).map(raw => {
      const row = asRecord(raw)
      return {
        relative: asString(row.relative, `${field} relative`),
        bytes: asInteger(row.bytes, `${field} bytes`),
        sha256: asString(row.sha256, `${field} sha256`),
        mtimeNs: asString(row.mtime_ns, `${field} mtime_ns`),
      }
    }).sort((left, right) => left.relative.localeCompare(right.relative))
  )
  const manifestRows = (field: 'caseFiles' | 'sessionFiles' | 'appdataFiles'): unknown[] => {
    let rows: readonly (FixedEntry & { readonly relative: string })[]
    if (field === 'caseFiles') rows = manifest.caseFiles
    else if (field === 'sessionFiles') rows = manifest.sessionFiles
    else rows = manifest.appdataFiles
    return rows.map(row => ({
      relative: row.relative,
      bytes: row.bytes,
      sha256: row.sha256,
      mtimeNs: asString(row.mtime_ns, `${field} mtime_ns`),
    })).sort((left, right) => left.relative.localeCompare(right.relative))
  }
  const checklistIdentity = asRecord(captured.preissue_checklist_identity)
  if (
    captured.format !== 'genuine-t18-completed-preissue-continuation-v1'
    || captured.source_case !== manifest.originalCaseRoot
    || captured.source_sessions !== manifest.originalSessionsRoot
    || captured.completed_preissue_task !== PRE_ISSUE_TASK_ID
    || captured.completed_preissue_request !== PRE_ISSUE_REQUEST_ID
    || captured.original_draft !== ORIGINAL_DRAFT
    || captured.session_id !== ORIGINAL_SESSION_ID
    || captured.physical_rows !== ACTUAL_ROWS
    || captured.events !== ACTUAL_EVENTS
    || asInteger(checklistIdentity.bytes, 'checklist bytes') !== PRE_ISSUE_CHECKLIST_BYTES
    || asString(checklistIdentity.sha256, 'checklist sha256') !== PRE_ISSUE_CHECKLIST_SHA256
    || JSON.stringify(capturedRows('case_files')) !== JSON.stringify(manifestRows('caseFiles'))
    || JSON.stringify(capturedRows('session_files')) !== JSON.stringify(manifestRows('sessionFiles'))
    || JSON.stringify(capturedRows('appdata_files')) !== JSON.stringify(manifestRows('appdataFiles'))
  ) {
    throw new Error('literal manifest does not match the pinned actual resource inventory')
  }
  if (manifest.consumer.path !== fileURLToPath(import.meta.url)) {
    throw new Error('consumer self-pin path is not this file')
  }
  if (manifest.bServiceEntry.path !== B_SERVICE_SCRIPT) {
    throw new Error('B service pin path is not the companion file')
  }
  const sourcePins = asRecord(JSON.parse(await readFile(manifest.reviewedBSourcePins.path, 'utf8')))
  const sourceRows = Object.entries(sourcePins)
  if (sourceRows.length !== manifest.reviewedBSourcePins.entryCount) {
    throw new Error('reviewed B source pin count changed')
  }
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
      caseFileCount: manifest.caseFiles.length,
      sessionFileCount: manifest.sessionFiles.length,
      appdataFileCount: manifest.appdataFiles.length,
      dependencyCount: manifest.dependencies.length,
      runtimeExecutableCount: manifest.runtimeExecutables.length,
      reviewedBSourcePinsSha256: manifest.reviewedBSourcePins.sha256,
      consumerSha256: manifest.consumer.sha256,
      bServiceSha256: manifest.bServiceEntry.sha256,
    },
    manifest,
  }
}

async function copyPinnedFile(
  source: FixedEntry,
  relativePath: string,
  destinationRoot: string,
): Promise<CopiedIdentity> {
  const pure = relativePath.replaceAll('\\', '/')
  if (
    pure.length === 0
    || pure.startsWith('/')
    || pure.split('/').some(part => part.length === 0 || part === '.' || part === '..')
  ) {
    throw new Error(`copy-relative path is invalid: ${relativePath}`)
  }
  const destination = resolve(destinationRoot, ...pure.split('/'))
  const rel = relative(resolve(destinationRoot), destination)
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('copy destination escapes private root')
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 })
  await copyFile(source.path, destination)
  await ordinaryFile(destination, source.bytes, source.sha256)
  return {
    source: source.path,
    destination,
    relative: pure,
    bytes: source.bytes,
    sha256: source.sha256,
  }
}

async function verifyActualSessionCopy(
  copiedPath: string,
  actualBytes: Buffer,
): Promise<{
  readonly rowCount: number
  readonly eventCount: number
  readonly headerId: string
  readonly headerCwd: string
  readonly firstEventSeq: number
  readonly lastEventSeq: number
  readonly eventPrefixSha256: string
}> {
  const copied = await readFile(copiedPath)
  if (
    copied.byteLength !== ACTUAL_SESSION_BYTES
    || !copied.equals(actualBytes)
    || sha256Bytes(copied) !== ACTUAL_SESSION_SHA256
  ) {
    throw new Error('copied session is not byte-identical to the actual 115-event source')
  }
  const rows = copied.toString('utf8').trimEnd().split(/\r?\n/)
  if (rows.length !== ACTUAL_ROWS) throw new Error('copied session physical row count changed')
  const header = asRecord(JSON.parse(rows[0]!))
  if (
    header.type !== 'session'
    || header.version !== 4
    || header.id !== ORIGINAL_SESSION_ID
    || header.cwd !== ORIGINAL_SESSION_CWD
  ) {
    throw new Error('copied session header identity or original cwd changed')
  }
  const events = rows.slice(1).map((line, index) => {
    const event = asRecord(JSON.parse(line))
    if (event.seq !== index) throw new Error(`copied session event ${String(index)} is out of sequence`)
    return event
  })
  if (
    events.length !== ACTUAL_EVENTS
    || events[0]?.type !== 'agent/inbox/spliced'
    || events.at(-1)?.type !== 'turn/end'
  ) {
    throw new Error('copied actual 115-event source is not intact')
  }
  const immutablePrefix = copied.subarray(0, ORIGINAL_SESSION_BYTES)
  if (
    immutablePrefix.byteLength !== ORIGINAL_SESSION_BYTES
    || sha256Bytes(immutablePrefix) !== ORIGINAL_SESSION_SHA256
  ) {
    throw new Error('actual source no longer contains the immutable original 59-event prefix')
  }
  return {
    rowCount: rows.length,
    eventCount: events.length,
    headerId: String(header.id),
    headerCwd: String(header.cwd),
    firstEventSeq: Number(events[0]!.seq),
    lastEventSeq: Number(events.at(-1)!.seq),
    eventPrefixSha256: sha256Bytes(JSON.stringify(events)),
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
          || ready.sourcePinCount !== 346
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
  question: QuestionCapture,
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
    const requiredIds = mandatoryQuestionIds()
    if (
      ids.length !== requiredIds.length
      || ids.some(id => !requiredIds.includes(questionRoleFromId(id)))
    ) {
      throw new Error(`the selected Skill question IDs are not exactly ${requiredIds.join(',')}`)
    }
    const rolesByQuestion = ids.map(id => [questionRoleFromId(id)])
    const answers = ids.map(id => ({
      id,
      selected: [],
      custom: answerTextForQuestionId(id),
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
    materialsList: { method: 'materialsList', http: 'GET', path: '/api/materials', contract: 'materials_list' },
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

function assistantText(event: NativeEvent): string {
  const message = asRecord(asRecord(event.data).message)
  return asArray(message.content ?? [])
    .flatMap(part => {
      const row = asRecord(part)
      return row.type === 'text' && typeof row.text === 'string' ? [row.text] : []
    })
    .join('')
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

function mandatoryQuestionIds(): readonly QuestionRole[] {
  return ['draft', 'opinions']
}

function questionRoleFromId(id: string): QuestionRole {
  const role = mandatoryQuestionIds().find(candidate => candidate === id)
  if (role === undefined) throw new Error(`unknown mandatory question id ${id}`)
  return role
}

function answerTextForQuestionId(id: string): string {
  const role = questionRoleFromId(id)
  if (role === 'draft') return REVISE_DRAFT_ANSWER
  return OPINIONS_ANSWER
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

function toolResultSearchText(events: readonly NativeEvent[], callId: string): string {
  return JSON.stringify(toolResultValue(events, callId))
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

function parseTaskCoverage(
  value: unknown,
  readRows: readonly Record<string, unknown>[],
  materials: readonly MaterialReadRecord[],
): {
  readonly coverage: Record<string, unknown>
  readonly categoryByName: ReadonlyMap<string, string>
} {
  const coverage = asRecord(value)
  const requiredKeys = ['total', 'fully_read', 'partially_read', 'not_read', 'unreadable']
  if (
    Object.keys(coverage).sort().join('\u0000')
    !== [...requiredKeys].sort().join('\u0000')
  ) {
    throw new Error('task coverage does not have the exact common.schema.json groups')
  }
  if (asInteger(coverage.total, 'coverage total') !== 2) {
    throw new Error('task coverage total is not the exact two materials')
  }

  const groups = ['fully_read', 'partially_read', 'not_read', 'unreadable'] as const
  const names: string[] = []
  const categoryByName = new Map<string, string>()
  const partialByName = new Map<string, { readonly readUnits: number; readonly totalUnits: number }>()
  for (const group of groups) {
    for (const [index, raw] of asArray(coverage[group]).entries()) {
      let name: string
      if (group === 'partially_read') {
        const row = asRecord(raw)
        if (
          Object.keys(row).sort().join('\u0000')
          !== ['name', 'read_units', 'total_units'].sort().join('\u0000')
        ) {
          throw new Error(`partially_read ${index + 1} has fields outside the coverage schema`)
        }
        name = asString(row.name, `partially_read ${index + 1} name`)
        const readUnits = asInteger(row.read_units, `partially_read ${index + 1} read_units`)
        const totalUnits = asInteger(row.total_units, `partially_read ${index + 1} total_units`)
        if (readUnits < 0 || totalUnits < 1 || readUnits >= totalUnits) {
          throw new Error(`partially_read ${index + 1} is not a truthful partial range`)
        }
        partialByName.set(name, { readUnits, totalUnits })
      } else if (group === 'unreadable') {
        const row = asRecord(raw)
        if (Object.keys(row).sort().join('\u0000') !== ['name', 'reason'].sort().join('\u0000')) {
          throw new Error(`unreadable ${index + 1} has fields outside the coverage schema`)
        }
        name = asString(row.name, `unreadable ${index + 1} name`)
        if (asString(row.reason, `unreadable ${index + 1} reason`).trim().length === 0) {
          throw new Error(`unreadable ${index + 1} has no reason`)
        }
      } else {
        name = asString(raw, `${group} ${index + 1}`)
      }
      if (name.length === 0 || categoryByName.has(name)) {
        throw new Error(`coverage repeats or omits a material name: ${JSON.stringify(name)}`)
      }
      names.push(name)
      categoryByName.set(name, group)
    }
  }
  if (
    names.length !== 2
    || JSON.stringify([...new Set(names)].sort()) !== JSON.stringify([...MATERIAL_NAMES].sort())
  ) {
    throw new Error(`coverage does not describe exactly the original two materials: ${JSON.stringify(coverage)}`)
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
    if (category === 'unreadable') {
      throw new Error(`${material.name} is parsed and cannot be marked unreadable`)
    }
    if (readUnits === 0) {
      if (category !== 'not_read') {
        throw new Error(`${material.name} has no actual read but coverage says ${String(category)}`)
      }
      continue
    }
    if (readUnits === material.unitCount) {
      if (category !== 'fully_read') {
        throw new Error(`${material.name} was fully read but coverage says ${String(category)}`)
      }
      continue
    }
    const partial = partialByName.get(material.name)
    if (
      category !== 'partially_read'
      || partial === undefined
      || partial.readUnits !== readUnits
      || partial.totalUnits !== material.unitCount
    ) {
      throw new Error(`${material.name} coverage does not match its actual read ranges`)
    }
  }
  return { coverage, categoryByName }
}

function risk3BlockRange(content: string): { readonly start: number; readonly end: number } {
  const match = /^###[ \t]+风险\s*3(?:【[^\r\n]*】)?[^\r\n]*$/m.exec(content)
  if (match === null) throw new Error('draft has no risk-3 heading')
  const start = (match.index ?? 0) + match[0].length
  const next = /^###[ \t]+风险\s*[0-9]+[^\r\n]*$/gm
  next.lastIndex = start
  const trailing = next.exec(content)
  return { start, end: trailing?.index ?? content.length }
}

function risk3Block(content: string): string {
  const range = risk3BlockRange(content)
  return content.slice(range.start, range.end)
}

function assertRevisionContent(content: string): void {
  const risk3 = risk3Block(content)
  if (risk3.includes('第七条')) throw new Error('revised risk 3 still contains the wrong article 7')
  if (!risk3.includes('4.1')) throw new Error('revised risk 3 does not identify source article 4.1')
}

function oneContiguousEdit(original: string, revised: string): OneEditRecord {
  const originalBytes = Buffer.from(original, 'utf8')
  const revisedBytes = Buffer.from(revised, 'utf8')
  let prefix = 0
  while (
    prefix < originalBytes.length
    && prefix < revisedBytes.length
    && originalBytes[prefix] === revisedBytes[prefix]
  ) prefix += 1
  let suffix = 0
  while (
    suffix < originalBytes.length - prefix
    && suffix < revisedBytes.length - prefix
    && originalBytes[originalBytes.length - 1 - suffix] === revisedBytes[revisedBytes.length - 1 - suffix]
  ) suffix += 1
  const oldDelta = originalBytes.subarray(prefix, originalBytes.length - suffix)
  const newDelta = revisedBytes.subarray(prefix, revisedBytes.length - suffix)
  if (!oldDelta.equals(Buffer.from('七', 'utf8')) || !newDelta.equals(Buffer.from('4.1', 'utf8'))) {
    throw new Error('the single body edit is not the exact article-number replacement 七 -> 4.1')
  }
  const originalRisk3 = risk3Block(original)
  const wrongArticleAtInRisk3 = originalRisk3.indexOf('第七条')
  if (wrongArticleAtInRisk3 < 0) throw new Error('original risk 3 has no wrong article 7')
  const risk3 = risk3BlockRange(original)
  const wrongArticleAt = risk3.start + wrongArticleAtInRisk3
  const deltaStart = Buffer.byteLength(original.slice(0, wrongArticleAt + '第'.length), 'utf8')
  const afterArticle = Buffer.byteLength(
    original.slice(0, wrongArticleAt + '第七'.length),
    'utf8',
  )
  if (prefix !== deltaStart || suffix !== originalBytes.length - afterArticle) {
    throw new Error('the exact article-number replacement is not in original risk 3')
  }
  return {
    prefixBytes: prefix,
    suffixBytes: suffix,
    oldTextSha256: sha256Bytes(oldDelta),
    newTextSha256: sha256Bytes(newDelta),
    oldTextLength: oldDelta.toString('utf8').length,
    newTextLength: newDelta.toString('utf8').length,
    removesArticle7: true,
    introducesArticle4_1: true,
  }
}

function observeQuestionBeforeFirstDraft(
  events: readonly NativeEvent[],
  question: QuestionRecord,
): QuestionOrderRecord {
  const expectedRoles = mandatoryQuestionIds()
  const knownMandatoryQuestionPrefix =
    'Error: 提交成果前必须先取得律师对必问问题的真实回答。还缺：'
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
      const knownRejection = result.text.trim().startsWith(knownMandatoryQuestionPrefix)
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
      answerResultSha256: sha256Bytes(answerResult.text),
      answerResultLength: answerResult.text.length,
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

async function runGenuineDocReviseContinuation(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== '--credential-stdin') {
    throw new Error('usage: continue-genuine-doc-revise.mts --credential-stdin')
  }
  await assertDirectoryNotReparse(EVIDENCE_DIR)
  const runRoot = await mkdtemp(join(EVIDENCE_DIR, 'run-'))
  await assertDirectoryNotReparse(runRoot)
  if ((await readdir(runRoot)).length !== 0) throw new Error('fresh private run root is not empty')

  const initial = await verifyFixedInputs()
  const manifest = initial.manifest
  const originalDraftPin = manifest.caseFiles.find(entry => entry.relative === ORIGINAL_DRAFT)
  const preIssuePin = manifest.caseFiles.find(entry => entry.relative === PRE_ISSUE_CHECKLIST)
  const originalSessionPin = manifest.sessionFiles[0]
  if (originalDraftPin === undefined || preIssuePin === undefined || originalSessionPin === undefined) {
    throw new Error('manifest lacks the original v2, completed checklist, or actual Native Session')
  }
  if (
    originalDraftPin.sha256 !== ORIGINAL_DRAFT_SHA256
    || preIssuePin.sha256 !== PRE_ISSUE_CHECKLIST_SHA256
    || preIssuePin.bytes !== PRE_ISSUE_CHECKLIST_BYTES
    || originalSessionPin.sha256 !== ACTUAL_SESSION_SHA256
    || originalSessionPin.bytes !== ACTUAL_SESSION_BYTES
  ) {
    throw new Error('manifest prior-input or actual Session identity changed')
  }
  const originalDraftText = (await readFile(originalDraftPin.path)).toString('utf8')
  const preIssueText = (await readFile(preIssuePin.path)).toString('utf8')
  const inputSourceLines = [
    originalDraftText.trimEnd().split(/\r?\n/),
    preIssueText.trimEnd().split(/\r?\n/),
  ]
  const actualSessionBytes = await readFile(originalSessionPin.path)
  if (
    !originalDraftText.includes('风险3')
    || !originalDraftText.includes('第七条')
    || !originalDraftText.includes('4.1')
    || !preIssueText.includes('风险3')
    || !preIssueText.includes('合同第四条')
    || !preIssueText.includes('合同第七条')
  ) {
    throw new Error('actual prior inputs do not contain the known risk-3 error or completed checklist marker')
  }

  const network: NetworkObservation[] = []
  const apiCalls: ApiObservation[] = []
  const fetchGate: FetchGate = { modelEnabled: false, deniedAttempts: 0 }
  const fetchLease = installFetchAllowlist(network, fetchGate)
  const cleanupFailures: string[] = []
  const blocked = new Map<string, string>()
  const question: QuestionCapture = { value: null }
  let secret = ''
  let secretReader: SecretReaderState | undefined
  let outputRedaction: OutputRedactionLease | undefined
  let service: BServiceLease | undefined
  let production: any
  let sessionId = ORIGINAL_SESSION_ID
  let agent: any
  let browser: any
  let liveEvents: readonly NativeEvent[] = []
  let browserDisposed = false
  let contextDisposed = false
  let bStopped = false
  let agentJoined = false
  let environmentRestored = false
  let environment: EnvironmentLease | undefined

  const report: RunReport = {
    format: 'lawbench-t18-genuine-doc-revise-continuation-v1',
    task: TASK_NAME,
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
      actualCurrentTwoMaterialCaseOnly: true,
      materialNames: [...MATERIAL_NAMES],
      explicitCancelBatchBeforeBegin: true,
      priorInputOnly: true,
      requestScopePrepareCalls: 0,
      materialImportCalls: 0,
    },
    modelRoute: {
      provider: PROVIDER,
      model: MODEL,
      baseURL: MODEL_URL,
      thinking: '中',
      contextWindow: 131_072,
      maxTokens: TASK_MAX_TOKENS,
      modelCallsPerSkill: 32,
      requestTimeoutMs: 1_200_000,
      streamIdleTimeoutMs: 1_200_000,
    },
    runRoot,
    admission: { initial: initial.admission },
    originalFilesHeld: false,
    nativeSessionId: ORIGINAL_SESSION_ID,
    stages: [],
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
      actualSingleDocReviseSkillConsumer: false,
      actualModelAuthoredRevision: false,
      oldTwoStageFailedRetained: true,
      priorChecklistNotRerun: true,
      fullT18: false,
      businessAcceptance: false,
      legalAcceptance: false,
      gui: false,
      packaging: false,
    },
  }

  try {
    const caseRoot = join(runRoot, 'case')
    const sessionsRoot = join(runRoot, 'sessions')
    await mkdir(caseRoot, { recursive: true, mode: 0o700 })
    await mkdir(sessionsRoot, { recursive: true, mode: 0o700 })
    const copiedCaseFiles: CopiedIdentity[] = []
    const copiedSessionFiles: CopiedIdentity[] = []
    for (const entry of manifest.caseFiles) {
      copiedCaseFiles.push(await copyPinnedFile(entry, entry.relative, caseRoot))
    }
    for (const entry of manifest.sessionFiles) {
      copiedSessionFiles.push(await copyPinnedFile(entry, entry.relative, sessionsRoot))
    }
    if (
      copiedCaseFiles.length !== 23
      || copiedSessionFiles.length !== 1
      || copiedCaseFiles.some(entry => entry.destination.endsWith('cases.json'))
    ) {
      throw new Error('private copy count is not exactly 23 case files plus one session')
    }
    const copiedSession = await verifyActualSessionCopy(
      copiedSessionFiles[0]!.destination,
      actualSessionBytes,
    )
    if (
      copiedSession.headerId !== ORIGINAL_SESSION_ID
      || copiedSession.headerCwd !== ORIGINAL_SESSION_CWD
      || copiedSession.eventCount !== ACTUAL_EVENTS
    ) {
      throw new Error('copied Session identity changed before resume')
    }
    report.copy = { caseFiles: copiedCaseFiles, sessionFiles: copiedSessionFiles }

    environment = await isolateProcessFiles(runRoot)
    const credential = await readCredentialFromStdin()
    secret = credential.secret
    secretReader = credential.state
    outputRedaction = installOutputRedaction(secret)
    fetchGate.modelEnabled = true

    const pythonExe = manifest.runtimeExecutables.find(entry => entry.role === 'python')?.path
    const nodeExe = manifest.runtimeExecutables.find(entry => entry.role === 'node')?.path
    const personaPath = manifest.dependencies.find(entry => entry.role === 'persona')?.path
    if (pythonExe === undefined || nodeExe === undefined || personaPath === undefined) {
      throw new Error('fixed manifest lacks the Python, Node, or persona dependency')
    }
    if (pathKey(nodeExe) !== pathKey(process.execPath)) {
      throw new Error('consumer was not started with the pinned Node executable')
    }
    const personaPrefix = (await readFile(personaPath, 'utf8'))
      .replace(/^【草稿[^\n]*\n+/, '')
      .trim()
    if (!personaPrefix.includes('律所内部的案件助手')) throw new Error('production persona prefix is absent')

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
    const opened = apiOk(await remote.callApi(apiRoute('caseOpen'), {
      path: caseRoot,
      template: 'civil',
      kind: 'civil',
    }), 'caseOpen')
    const caseId = asString(opened.case_id, 'case_id')
    if (caseId !== ORIGINAL_CASE_ID || opened.created !== false) {
      throw new Error('copied case did not open as the existing original case')
    }

    const listed = apiOk(await remote.callApi(apiRoute('materialsList'), { case_id: caseId }), 'materialsList')
    const materials = asArray(listed.materials).map(asRecord)
    if (materials.length !== 2) throw new Error('copied genuine case material count is not two')
    const materialIds = materials.map((row, index) => (
      asString(row.material_id, `material ${index + 1} id`)
    )).sort()
    if (new Set(materialIds).size !== 2) throw new Error('copied genuine case material ids are not unique')
    const materialShaById = new Map<string, string>()
    const materialReads: MaterialReadRecord[] = materials.map((row, index) => {
      const name = asString(row.name, `material ${index + 1} name`)
      if (asString(row.status, `material ${index + 1} status`) !== 'parsed') {
        throw new Error(`material ${name} is not parsed`)
      }
      const relativePath = `02案件材料/${name}.${extname(asString(row.rel_path, 'material rel_path')).slice(1)}`
      const original = manifest.caseFiles.find(entry => entry.relative === relativePath)
      if (original === undefined) throw new Error(`material ${name} is outside the original two fixtures`)
      const materialId = asString(row.material_id, 'material_id')
      materialShaById.set(materialId, original.sha256)
      return {
        materialId,
        name,
        type: asString(row.type, 'material type'),
        unit: asString(row.unit, 'material unit'),
        unitCount: asInteger(row.unit_count, 'material unit_count'),
        originalPath: join(caseRoot, ...relativePath.split('/')),
        originalBytes: original.bytes,
        originalSha256: original.sha256,
        sourceBytes: original.bytes,
        sourceSha256: original.sha256,
        sourceMtimeNs: asString(original.mtime_ns, 'material source mtime_ns'),
      }
    })
    if (
      JSON.stringify(materialReads.map(item => item.name).sort())
      !== JSON.stringify([...MATERIAL_NAMES].sort())
    ) {
      throw new Error('material names differ from the original two synthetic fixtures')
    }
    const originalArea = (await listFiles(caseRoot)).filter(path => (
      !path.startsWith('工作区/') && !path.startsWith('成果/') && !path.split('/').some(part => part.startsWith('.'))
    ))
    if (
      JSON.stringify(originalArea)
      !== JSON.stringify([
        '02案件材料/采购合同.docx',
        '02案件材料/采购部内部意见.txt',
      ])
    ) {
      throw new Error(`private case original area contains extra data: ${JSON.stringify(originalArea)}`)
    }
    for (const material of materialReads) {
      await ordinaryFile(material.originalPath, material.originalBytes, material.originalSha256)
    }
    report.case = {
      caseId,
      path: caseRoot,
      materialIds,
      originalAreaFiles: originalArea,
      created: false,
    }
    report.materialReads = materialReads
    report.resumedSession = {
      sameUuid: true,
      originalCwdPreserved: true,
      actual115EventPrefixPreserved: true,
    }
    report.preIssueInputs = {
      taskId: PRE_ISSUE_TASK_ID,
      requestId: PRE_ISSUE_REQUEST_ID,
      checklistPath: PRE_ISSUE_CHECKLIST,
      checklistBytes: PRE_ISSUE_CHECKLIST_BYTES,
      checklistSha256: PRE_ISSUE_CHECKLIST_SHA256,
      sourceUnchanged: true,
    }

    const skillListing = asRecord(await production.remote.listSkills())
    if (skillListing.ok !== true) throw new Error('production Skill listing failed')
    const skills = asArray(asRecord(skillListing.value).skills).map(asRecord)
    if (!skills.some(row => row.name === REVISE_SKILL)) {
      throw new Error(`${REVISE_SKILL} is absent from the production Skill listing`)
    }
    const taskParams = {
      thinking: '中',
      window: '128K',
      max_tokens: TASK_MAX_TOKENS,
      temperature: 0.6,
    }

    browser = new production.BrowserSession(sessionId, {})
    browser.handleRunning(true)
    const initialTasks = apiOk(await remote.callApi(apiRoute('tasksList'), { case_id: caseId }), 'initial tasksList')
    const knownTaskIds = new Set(asArray(initialTasks.tasks).map((raw, index) => (
      asString(asRecord(raw).task_id, `initial task ${index + 1} id`)
    )))

    const executeStage = async (
      skill: typeof REVISE_SKILL,
      inputs: readonly string[],
      promptText: string,
      expectedTitle: string,
    ): Promise<ExecutedStage> => {
      question.value = null
      const selected = apiOk(await remote.callApi(apiRoute('taskCreate'), {
        case_id: caseId,
        session_id: sessionId,
        entry: null,
        skill,
        inputs: [...inputs],
        params: taskParams,
      }), 'doc-revise taskCreate')
      const selectionId = asString(selected.task_id, 'task selection id')
      if (
        !TASK_ID.test(selectionId)
        || knownTaskIds.has(selectionId)
        || selectionId === ORIGINAL_TASK_ID
        || selectionId === PRE_ISSUE_TASK_ID
      ) {
        throw new Error('doc-revise task selection identity is not new')
      }
      const submission = browser.beginSubmission({
        mode: 'queue',
        text: promptText,
        attachments: [],
      })
      const requestId = String(submission.requestId)
      if (
        !UUID_V4.test(requestId)
        || requestId === ORIGINAL_REQUEST_ID
        || requestId === PRE_ISSUE_REQUEST_ID
      ) {
        throw new Error('BrowserSession did not mint a new UUID request')
      }
      const beforeSeq = production.live.sessions.get(sessionId)?.seq === undefined
        ? ACTUAL_EVENTS
        : Number(production.live.sessions.get(sessionId).seq)
      await withWatchdog(production.commands.prompt({
        sessionId,
        requestId: submission.requestId,
        mode: 'queue',
        content: [{ type: 'text', text: promptText }],
      }))
      const nativeSession = production.live.sessions.get(sessionId)
      agent = production.live.agents.get(sessionId)
      if (nativeSession === undefined || agent === undefined) {
        throw new Error('production prompt did not resume the copied Native Session')
      }
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
      const headerConfig = asRecord(asRecord(asRecord(header.data).header).config)
      if (
        headerConfig.provider !== PROVIDER
        || headerConfig.model !== MODEL
        || headerConfig.maxTokens !== taskParams.max_tokens
      ) {
        throw new Error('request/header does not carry the production route and task max tokens')
      }
      const types = turnEvents.map(event => event.type)
      for (const required of ['turn/start', 'user/message', 'assistant/message', 'turn/end']) {
        if (!types.includes(required)) throw new Error(`native turn lacks ${required}`)
      }
      if (turnEvents.findLast(event => requestIdFromEvent(event) === requestId) === undefined) {
        throw new Error('native turn does not carry the actual BrowserSession request id')
      }
      const end = asRecord(turnEvents.findLast(event => event.type === 'turn/end')!.data)
      if (asRecord(end.reason).kind !== 'completed') {
        throw new Error(`native turn ended with ${String(asRecord(end.reason).kind)}`)
      }
      const responseText = assistantText(turnEvents.findLast(event => event.type === 'assistant/message')!)
      if (responseText.trim().length === 0) throw new Error('native turn produced no assistant text')
      const toolCalls = toolCallsFromEvents(turnEvents)
      for (const requiredTool of [
        'skill',
        'ask_user_question',
        'case_read_input',
        'case_read_material',
        'case_save_draft',
      ]) {
        if (!toolCalls.some(call => call.name === requiredTool)) {
          throw new Error(`actual tool loop lacks ${requiredTool}`)
        }
      }
      if (!turnEvents.some(event => skillNameFromCall(event) === skill)) {
        throw new Error(`the skill tool did not load ${skill}`)
      }
      if (question.value === null) throw new Error(`${skill} did not ask its mandatory questions`)
      const questionOrder = observeQuestionBeforeFirstDraft(turnEvents, question.value)

      let completedTask: Record<string, unknown> | undefined
      for (let attempt = 0; attempt < 1_200; attempt += 1) {
        const taskList = apiOk(await remote.callApi(apiRoute('tasksList'), { case_id: caseId }), 'tasksList')
        const candidates = asArray(taskList.tasks)
          .map(asRecord)
          .filter(task => task.skill === skill && !knownTaskIds.has(asString(task.task_id, 'task_id')))
        if (candidates.length > 1) throw new Error(`${skill} produced more than one new executed task`)
        completedTask = candidates[0]
        if (completedTask !== undefined) break
        await new Promise(done => setTimeout(done, 100))
      }
      if (completedTask === undefined) throw new Error(`${skill} produced no executed task`)
      const taskId = asString(completedTask.task_id, 'task_id')
      if (
        !TASK_ID.test(taskId)
        || taskId === ORIGINAL_TASK_ID
        || taskId === PRE_ISSUE_TASK_ID
        || taskId === selectionId
        || knownTaskIds.has(taskId)
      ) {
        throw new Error(`${skill} task id is not a new production task`)
      }
      if (completedTask.status !== 'completed') throw new Error(`${skill} task ended ${String(completedTask.status)}`)

      const taskDir = join(caseRoot, '工作区', '任务', taskId)
      const taskData = asRecord(JSON.parse(await readFile(join(taskDir, 'task.json'), 'utf8')))
      const result = asRecord(JSON.parse(await readFile(join(taskDir, 'result.json'), 'utf8')))
      const reads = asRecord(JSON.parse(await readFile(join(taskDir, 'reads.json'), 'utf8')))
      const taskBudget = asRecord(taskData.budget)
      if (
        taskData.state !== 'finished'
        || taskData.kind !== 'agent'
        || taskData.entry !== null
        || taskData.case_id !== caseId
        || taskData.request_id !== requestId
        || taskData.skill !== skill
        || taskData.session_id !== sessionId
        || taskData.request_scope !== null
        || taskBudget.model_calls !== 32
        || taskBudget.tool_calls !== 48
        || taskBudget.minutes !== 45
      ) {
        throw new Error(`${skill} persisted task is not an ordinary completed unscoped task`)
      }
      const selectedInputs = asArray(taskData.inputs).map((raw, index) => (
        asString(asRecord(raw).path, `task input ${index + 1} path`)
      ))
      const selectedInputHashes = asArray(taskData.inputs).map((raw, index) => (
        asString(asRecord(raw).sha256, `task input ${index + 1} sha256`)
      ))
      if (
        JSON.stringify(selectedInputs) !== JSON.stringify(inputs)
        || JSON.stringify(selectedInputHashes)
          !== JSON.stringify([ORIGINAL_DRAFT_SHA256, PRE_ISSUE_CHECKLIST_SHA256])
      ) {
        throw new Error(`${skill} persisted task inputs differ from the explicit prior inputs`)
      }
      if (result.status !== 'completed') throw new Error(`${skill} persisted result is ${String(result.status)}`)
      const citationCheck = asRecord(result.citation_check)
      if (citationCheck.passed !== true) throw new Error(`${skill} citation check did not pass`)
      const citations = asArray(result.citations).map(asRecord)
      if (citations.length === 0) throw new Error(`${skill} saved output has no parsed citations`)
      const readRows = asArray(reads.reads).map(asRecord)
      if (readRows.length === 0) throw new Error(`${skill} task has no actual material reads`)
      for (const row of readRows) {
        const materialId = asString(row.material_id, 'read material_id')
        const material = materialReads.find(item => item.materialId === materialId)
        const from = asInteger(row.from, 'read from')
        const to = asInteger(row.to, 'read to')
        if (
          material === undefined
          || row.material_version !== materialShaById.get(materialId)
          || row.unit !== material.unit
          || from < 1
          || to < from
          || to > material.unitCount
        ) {
          throw new Error(`${skill} read record is outside the original material identity`)
        }
      }
      const parsedCoverage = parseTaskCoverage(result.coverage, readRows, materialReads)

      const drafts = asArray(result.drafts).map(asRecord)
      const latestDraft = drafts.at(-1)
      if (latestDraft === undefined) throw new Error(`${skill} completed task has no saved draft`)
      if (latestDraft.title !== expectedTitle) {
        throw new Error(`${skill} saved draft title is ${String(latestDraft.title)}`)
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
        throw new Error(`${skill} draft path escapes its owned task`)
      }
      const draftBytes = await readFile(draftPath)
      const draftText = draftBytes.toString('utf8')
      if (draftText.trim().length === 0) throw new Error(`${skill} saved draft is empty`)
      const saveCalls = turnEvents.filter(event => (
        event.type === 'tool/call' && asRecord(event.data).name === 'case_save_draft'
      ))
      const matchingSave = saveCalls.findLast(event => {
        const args = toolArguments(event)
        return args.title === expectedTitle && args.content === draftText
      })
      if (matchingSave === undefined) {
        throw new Error(`${skill} saved draft is not the actual model-authored tool argument`)
      }
      const saveResult = toolResultValue(
        turnEvents,
        asString(asRecord(matchingSave.data).callId, 'draft call id'),
      )
      if (saveResult.path !== draftRel || saveResult.version !== latestDraft.version) {
        throw new Error(`${skill} saved draft path/version is not the actual tool result`)
      }

      const inputCalls = toolCalls
        .filter(call => call.name === 'case_read_input')
      const inputReads: NonNullable<StageRecord['inputReads']>[number][] = []
      const inputIndexes = new Set<number>()
      const inputReadTexts = new Map<number, string[]>()
      for (const call of inputCalls) {
        const args = toolArguments(turnEvents.find(event => (
          event.type === 'tool/call' && asRecord(event.data).callId === call.callId
        ))!)
        const inputIndex = asInteger(args.index, 'case_read_input index')
        if (inputIndex < 1 || inputIndex > 2) throw new Error('case_read_input index is outside the selected inputs')
        const resultValue = toolResultValue(turnEvents, call.callId)
        const resultText = asString(resultValue.text, 'case_read_input text')
        if (resultText.trim().length === 0) throw new Error('case_read_input returned no actual text')
        if (asInteger(resultValue.index, 'case_read_input result index') !== inputIndex) {
          throw new Error('case_read_input result index differs from the actual request')
        }
        const start = asInteger(resultValue.start, 'case_read_input start')
        const end = asInteger(resultValue.end, 'case_read_input end')
        const hasMoreRaw = resultValue.has_more
        if (
          start < 1
          || end < start
          || (hasMoreRaw !== undefined && typeof hasMoreRaw !== 'boolean')
        ) {
          throw new Error('case_read_input pagination metadata is invalid')
        }
        const hasMore = hasMoreRaw === true
        if (args.start !== undefined && asInteger(args.start, 'case_read_input requested start') !== start) {
          throw new Error('case_read_input response start differs from the actual request')
        }
        const sourceLines = inputSourceLines[inputIndex - 1]!
        if (end > sourceLines.length) {
          throw new Error(`case_read_input ${inputIndex} reports lines beyond the actual prior input`)
        }
        const expectedPageText = sourceLines.slice(start - 1, end).join('\n')
        if (resultText !== expectedPageText) {
          throw new Error(`case_read_input ${inputIndex} page differs from the actual prior input`)
        }
        if (hasMore !== (end < sourceLines.length)) {
          throw new Error(`case_read_input ${inputIndex} has inconsistent has_more metadata`)
        }
        const priorTexts = inputReadTexts.get(inputIndex) ?? []
        priorTexts.push(resultText)
        inputReadTexts.set(inputIndex, priorTexts)
        inputIndexes.add(inputIndex)
        inputReads.push({
          index: inputIndex,
          start,
          end,
          hasMore,
          resultSha256: sha256Bytes(resultText),
          resultLength: resultText.length,
        })
      }
      if (JSON.stringify([...inputIndexes].sort()) !== JSON.stringify([1, 2])) {
        throw new Error(`${skill} did not read every explicitly selected prior input`)
      }
      for (const inputIndex of [1, 2] as const) {
        const expectedLines = inputSourceLines[inputIndex - 1]!.length
        const coveredLines = new Set<number>()
        for (const read of inputReads.filter(row => row.index === inputIndex)) {
          if (read.end > expectedLines) {
            throw new Error(`case_read_input ${inputIndex} reports lines beyond the actual prior input`)
          }
          for (let line = read.start; line <= read.end; line += 1) coveredLines.add(line)
        }
        if (
          coveredLines.size !== expectedLines
          || Array.from({ length: expectedLines }, (_value, index) => index + 1)
            .some(line => !coveredLines.has(line))
        ) {
          throw new Error(`case_read_input ${inputIndex} did not cover the actual prior input`);
        }
      }
      const originalInputText = inputReadTexts.get(1)?.join('\n') ?? ''
      const preIssueInputText = inputReadTexts.get(2)?.join('\n') ?? ''
      if (!originalInputText.includes('第七条')) {
        throw new Error('doc-revise did not actually read the selected original v2 input')
      }
      if (
        !preIssueInputText.includes('风险3')
        || !preIssueInputText.includes('合同第四条')
        || !preIssueInputText.includes('合同第七条')
      ) {
        throw new Error('doc-revise did not actually read the genuine pre-issue checklist')
      }

      const materialCalls = toolCalls.filter(call => call.name === 'case_read_material')
      if (!materialCalls.some(call => {
        const event = turnEvents.find(candidate => (
          candidate.type === 'tool/call' && asRecord(candidate.data).callId === call.callId
        ))
        return event !== undefined && toolArguments(event).name === '采购合同'
      })) {
        throw new Error('doc-revise did not read the original procurement contract by material name')
      }
      const sourceReadTexts = materialCalls.map(call => toolResultSearchText(turnEvents, call.callId))
      if (!sourceReadTexts.some(text => text.includes('4.1'))) {
        throw new Error(`${skill} did not actually read source clause 4.1 from the contract`)
      }
      const sourceReadTextSha256s = sourceReadTexts.map(text => sha256Bytes(text))

      const citationResponses: SourceResponseRecord[] = []
      const seenCitations = new Set<string>()
      for (const citation of citations) {
        const loc = asRecord(citation.loc)
        const name = asString(citation.name, 'citation name')
        const materialId = asString(citation.material_id, 'citation material_id')
        const citationText = citationTextFor(name, loc)
        const key = `${materialId}\u0000${JSON.stringify(loc)}`
        if (seenCitations.has(key)) continue
        seenCitations.add(key)
        const source = apiOk(await remote.callApi(apiRoute('source'), {
          case_id: caseId,
          material_id: materialId,
          citation: citationText,
          task_id: taskId,
        }), `source ${citationText}`)
        const text = asString(source.text, 'source text')
        if (
          source.name !== name
          || source.source_changed !== false
          || (source.original_status !== undefined && source.original_status !== 'ok')
          || text.trim().length === 0
        ) {
          throw new Error(`citation did not resolve to unchanged source text: ${citationText}`)
        }
        citationResponses.push({
          name,
          loc,
          citation: citationText,
          textSha256: sha256Bytes(text),
          textLength: text.length,
          sourceChanged: false,
          originalStatus: source.original_status === undefined ? undefined : String(source.original_status),
        })
      }

      knownTaskIds.add(taskId)
      return {
        stage: 2,
        skill,
        selectionId,
        taskId,
        requestId,
        taskParams,
        beforeSeq,
        afterSeq,
        turn: {
          sessionId,
          requestId,
          beforeSeq,
          afterSeq,
          responseTextSha256: sha256Bytes(responseText),
          responseTextLength: responseText.length,
          requestHeader: header.data,
          requestHeaderAnchor: header.anchor,
          eventTypes: types,
        },
        toolCalls,
        question: {
          questionIds: question.value.questionIds,
          rolesByQuestion: question.value.rolesByQuestion,
          answerIds: question.value.answerIds,
          questionTextSha256: sha256Bytes(question.value.questionText),
          questionTextLength: question.value.questionText.length,
          answerTextSha256: sha256Bytes(question.value.answerText),
          answerTextLength: question.value.answerText.length,
        },
        questionOrder,
        taskState: {
          taskId,
          caseId,
          sessionId,
          skill,
          requestId,
          state: taskData.state,
          inputPaths: selectedInputs,
          inputSha256s: asArray(taskData.inputs).map((raw, index) => (
            asString(asRecord(raw).sha256, `task input ${index + 1} sha256`)
          )),
          params: asRecord(taskData.params),
          budget: asRecord(taskData.budget),
          requestScope: taskData.request_scope ?? null,
        },
        taskResult: {
          status: result.status,
          citationPassed: citationCheck.passed,
          citationCount: citations.length,
          draftCount: drafts.length,
          coverage: result.coverage,
        },
        coverage: parsedCoverage.coverage,
        readRanges: reads.reads,
        inputReads,
        sourceReadTextSha256s,
        citationResponses,
        draft: {
          title: expectedTitle,
          path: draftRel,
          version: asInteger(latestDraft.version, 'draft version'),
          bytes: draftBytes.byteLength,
          sha256: sha256Bytes(draftBytes),
        },
        draftText,
      }
    }

    const revisionStage = await executeStage(
      REVISE_SKILL,
      [ORIGINAL_DRAFT, PRE_ISSUE_CHECKLIST],
      STAGE2_PROMPT,
      REVISION_TITLE,
    )
    assertRevisionContent(revisionStage.draftText)
    const oneEdit = oneContiguousEdit(originalDraftText, revisionStage.draftText)
    report.oneEdit = oneEdit
    const { draftText: _revisionText, ...revisionStageReport } = revisionStage
    report.stages.push(revisionStageReport)

    if (
      !revisionStage.taskId
      || !revisionStage.requestId
      || revisionStage.taskId === ORIGINAL_TASK_ID
      || revisionStage.taskId === PRE_ISSUE_TASK_ID
      || revisionStage.requestId === ORIGINAL_REQUEST_ID
      || revisionStage.requestId === PRE_ISSUE_REQUEST_ID
    ) {
      throw new Error('doc-revise task or Native request identity was reused')
    }
    liveEvents = production.live.sessions.get(sessionId).snapshotEvents() as readonly NativeEvent[]

    const stopped = await service.stop()
    bStopped = true
    report.bService = {
      ready: service.ready,
      final: stopped.final,
      exitCode: stopped.code,
      forcedStop: stopped.forced,
    }
    if (stopped.code !== 0 || stopped.final.passed !== true) {
      throw new Error('finite B doc-revise service did not stop cleanly')
    }

    await browser.dispose()
    browserDisposed = true
    await production.live.fiber.dispose()
    contextDisposed = true
    const reopened = await production.reopenPersistedEvents(sessionId)
    const equal = JSON.stringify(reopened) === JSON.stringify(liveEvents)
    if (!equal) throw new Error('reopened JSONL events differ from live Native Session events')

    const allSessionFiles: string[] = []
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isSymbolicLink()) throw new Error('session persistence contains a reparse entry')
        if (entry.isDirectory()) await walk(path)
        else if (entry.isFile() && entry.name === 'session.v4.jsonl') allSessionFiles.push(path)
      }
    }
    await walk(production.persistenceRoot)
    const physical = allSessionFiles.filter(path => path.includes(sessionId))
    if (physical.length !== 1) throw new Error(`expected one physical JSONL for ${sessionId}`)
    const jsonlPath = physical[0]!
    const jsonlBytes = await readFile(jsonlPath)
    const eventLines = jsonlBytes.toString('utf8').trim().split(/\r?\n/).filter(Boolean)
    const prefixPreserved = (
      jsonlBytes.byteLength >= actualSessionBytes.byteLength
      && jsonlBytes.subarray(0, actualSessionBytes.byteLength).equals(actualSessionBytes)
      && sha256Bytes(jsonlBytes.subarray(0, actualSessionBytes.byteLength)) === ACTUAL_SESSION_SHA256
    )
    if (!prefixPreserved) throw new Error('actual 115-event Session bytes are no longer an exact prefix')
    report.persistence = {
      root: production.persistenceRoot,
      sessionReopened: reopened.length > 0,
      liveEqualsReopened: equal,
      physicalJsonlPath: jsonlPath,
      physicalJsonlBytes: jsonlBytes.byteLength,
      physicalJsonlSha256: sha256Bytes(jsonlBytes),
      physicalEventCount: Math.max(0, eventLines.length - 1),
      actualPrefixBytes: actualSessionBytes.byteLength,
      actualPrefixPreserved: prefixPreserved,
    }

    for (const material of materialReads) {
      await ordinaryFile(material.originalPath, material.originalBytes, material.originalSha256)
    }
    const originalDraftAfter = await readFile(join(caseRoot, ...ORIGINAL_DRAFT.split('/')))
    if (sha256Bytes(originalDraftAfter) !== ORIGINAL_DRAFT_SHA256) {
      throw new Error('original v2 draft bytes changed inside the private case')
    }
    const preIssueAfter = await readFile(join(caseRoot, ...PRE_ISSUE_CHECKLIST.split('/')))
    if (
      preIssueAfter.byteLength !== PRE_ISSUE_CHECKLIST_BYTES
      || sha256Bytes(preIssueAfter) !== PRE_ISSUE_CHECKLIST_SHA256
    ) {
      throw new Error('genuine pre-issue checklist bytes changed inside the private case')
    }
    report.modelPosts.observations = network.filter(item => item.kind === 'model')
    report.modelPosts.attempts = report.modelPosts.observations.filter(item => item.method === 'POST').length
    report.modelPosts.http200 = report.modelPosts.observations.filter(item => (
      item.method === 'POST' && item.status === 200
    )).length
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
    report.claims.actualSingleDocReviseSkillConsumer = true
    report.claims.actualModelAuthoredRevision = true
    report.status = 'PASS'
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  } finally {
    if (production !== undefined && sessionId !== '') {
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
        if (ownedAgent?.status === 'running') {
          production.commands.cancel({ sessionId })
        }
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
    report.originalFilesHeld = true
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
  await writeFile(reportPath, `${JSON.stringify(sanitized, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  process.stdout.write(`${JSON.stringify({
    status: sanitized.status,
    report: reportPath,
    nativeSessionId: sanitized.nativeSessionId,
    docReviseTaskId: sanitized.stages[0]?.taskId,
    docReviseRequestId: sanitized.stages[0]?.requestId,
    oneEdit: sanitized.oneEdit,
    modelPostAttempts: sanitized.networkSummary.modelPostAttempts,
    modelPostHttp200: sanitized.networkSummary.modelPostHttp200,
  }, null, 2)}\n`)
  if (sanitized.status !== 'PASS') process.exitCode = 1
}

await runGenuineDocReviseContinuation()
