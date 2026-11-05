/**
 * Finite headless consumer for a real synthetic Session -> AgentLoop -> 6000D
 * conversation, followed by the production Session fork operation and one
 * model turn on the new branch.
 *
 * Authoring status: AUTHORED_NOT_RUN. This file intentionally contains no
 * credential source other than the interactive stdin reader in run().
 */

import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { mkdtemp, lstat, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const DSH_ROOT = join(REPO_ROOT, 'dsh')
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const MODEL_ORIGIN = 'http://10.126.126.1:8000'
const MODEL_URL = `${MODEL_ORIGIN}/v1`
const MODEL = 'qwen38-27b'
const PROVIDER = 'lawbench-6000d'
const CREDENTIAL_REF = 'LAWBENCH_6000D_KEY'
const MAX_TOKENS = 256
const MAX_CREDENTIAL_BYTES = 4096
const TECHNICAL_WATCHDOG_MS = 86_400_000
const FIXED_INPUTS_PATH = join(EVIDENCE_DIR, 'fixed-inputs.json')
const FIXED_INPUTS_FORMAT = 'lawbench-native-real-fixed-inputs-v1'
// Root-owned admission pin. This source file cannot pin itself.
const FIXED_INPUTS_SHA256 = 'ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_WITH_UUID = /^session-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

const SYNTHETIC_CODE = 'LB-SYN-FORK-27'
const SYNTHETIC_PERSON = '林岚'
const SYNTHETIC_AMOUNT = '2700'

const PROMPTS = [
  `这是纯合成测试，不对应任何真实案件。请记住：合成代码 ${SYNTHETIC_CODE}；虚构委托人化名 ${SYNTHETIC_PERSON}；虚构金额 ${SYNTHETIC_AMOUNT} 元。只回复“已记住”。`,
  `同一纯合成对话。刚才的合成代码是什么？只回复代码本身。`,
  `同一纯合成对话。刚才的虚构委托人化名和虚构金额分别是什么？只回复“化名/金额”。`,
] as const

const FORK_PROMPT =
  `这是从原纯合成对话复制出的新分支。只回答原对话里的合成代码、虚构化名和虚构金额，格式为“代码|化名|金额”。`

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
  readonly surfaceOp?: string
}

interface NativeEventRecord {
  readonly sessionId: string
  readonly event: NativeEvent
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

interface TurnRecord {
  readonly sessionId: string
  readonly requestId: string
  readonly prompt: string
  readonly beforeSeq: number
  readonly afterSeq: number
  readonly networkStart: number
  readonly modelPostAttempts: number
  readonly modelPostHttp200: number
  readonly responseText: string
  readonly requestHeader: unknown
  readonly eventTypes: readonly string[]
}

interface SessionSnapshot {
  readonly id: string
  readonly header: unknown
  readonly inheritedEventCount: number
  readonly events: readonly NativeEvent[]
}

type RunMode = 'full' | 'preflight-only'

interface FixedInputManifest {
  readonly format: typeof FIXED_INPUTS_FORMAT
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
  readonly manifestPath: string
  readonly manifestSha256: string
  readonly checkedAtUtc: string
  readonly entryCount: number
  readonly originalSixCount: 6
  readonly runtimeModuleCount: 16
}

interface RunReport {
  format: 'lawbench-native-real-conversation-v2'
  task: 'A-native-real-conversation-20261028-000823'
  mode: RunMode
  status: 'RUNNING' | 'CLEARSETUP_ONLY' | 'PASS' | 'FAILED'
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
    readonly maxTokens: number
    readonly compression: 'none'
    readonly tools: 'empty registry'
  }
  runRoot?: string
  admission: {
    initial?: AdmissionRecord
    final?: AdmissionRecord
  }
  preflight?: {
    readonly setupCompleted: boolean
    readonly productionSessionCreated: boolean
    readonly keyRead: false
    readonly promptsSubmitted: 0
    readonly modelNetworkAttempts: 0
    readonly fullConversationAssertionsEvaluated: false
  }
  sourceSessionId?: string
  childSessionId?: string
  turns: TurnRecord[]
  network: NetworkObservation[]
  networkSummary: {
    readonly observations: number
    readonly modelPostAttempts: number
    readonly modelPostHttp200: number
    readonly closedAttempts: number
  }
  nativeEvents: NativeEventRecord[]
  sourceAtFork?: SessionSnapshot
  sourceAfterChild?: SessionSnapshot
  childAfterFork?: SessionSnapshot
  childAfterTurn?: SessionSnapshot
  childInheritance?: {
    readonly parentSession: string
    readonly isSeeded: boolean
    readonly inheritedEventCount: number
    readonly inheritedPrefixEqual: boolean
    readonly sourceUnchanged: boolean
  }
  persistence?: {
    readonly root: string
    readonly sourceReopened: boolean
    readonly childReopened: boolean
    readonly sourceEqual: boolean
    readonly childEqual: boolean
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
    readonly fullT31: false
    readonly gui: false
    readonly compression: false
    readonly tools: false
    readonly packaging: false
  }
}

interface SecretReaderState {
  readonly restore: () => void
}

interface NetworkGateState {
  readonly preflightOnly: boolean
  keyReady: boolean
  closedAttempts: number
}

interface FetchLease {
  restore(): void
  isRestored(): boolean
  closedAttempts(): number
}

interface EnvironmentLease {
  readonly restore: () => void
}

interface OutputRedactionLease {
  restore(): void
  isRestored(): boolean
  clearSecret(): boolean
}

function modulePath(relative: string): string {
  return pathToFileURL(join(DSH_ROOT, relative)).href
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

function parseRunMode(args: readonly string[]): RunMode {
  if (args.length === 0) return 'full'
  if (args.length === 1 && args[0] === '--preflight-only') return 'preflight-only'
  throw new Error('usage: native-real-conversation.ts [--preflight-only]')
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function verifyFixedInputs(): Promise<AdmissionRecord> {
  if (!/^[0-9a-f]{64}$/.test(FIXED_INPUTS_SHA256)) {
    throw new Error('fixed-inputs manifest pin is not installed in the consumer')
  }
  const manifestBytes = await readFile(FIXED_INPUTS_PATH)
  const manifestSha256 = sha256(manifestBytes)
  if (manifestSha256 !== FIXED_INPUTS_SHA256) {
    throw new Error('fixed-inputs manifest hash does not match the independent consumer pin')
  }
  const parsed = JSON.parse(manifestBytes.toString('utf8')) as Partial<FixedInputManifest>
  const inputs = parsed.inputs
  if (
    parsed.format !== FIXED_INPUTS_FORMAT
    || parsed.task !== 'A-native-real-conversation-20261028-000823'
    || parsed.hashAlgorithm !== 'sha256'
    || !Array.isArray(inputs)
  ) {
    throw new Error('fixed-inputs manifest header is invalid')
  }

  const identities = new Set<string>()
  let originalSixCount = 0
  let runtimeModuleCount = 0
  for (const entry of inputs) {
    if (
      typeof entry.group !== 'string'
      || typeof entry.id !== 'string'
      || typeof entry.path !== 'string'
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes <= 0
      || typeof entry.sha256 !== 'string'
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
      || (entry.snapshotPath !== undefined && typeof entry.snapshotPath !== 'string')
    ) {
      throw new Error('fixed-inputs manifest contains an invalid entry')
    }
    const identity = `${entry.group}\u0000${entry.id}`
    if (identities.has(identity)) throw new Error(`fixed-inputs manifest repeats ${identity}`)
    identities.add(identity)
    if (entry.group === 'original-six') originalSixCount += 1
    if (entry.group === 'runtime-modules') runtimeModuleCount += 1

    const info = await lstat(entry.path)
    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error(`fixed input is not a non-reparse file: ${entry.path}`)
    }
    const contents = await readFile(entry.path)
    if (contents.byteLength !== entry.bytes || sha256(contents) !== entry.sha256) {
      throw new Error(`fixed input bytes or SHA-256 changed: ${entry.path}`)
    }
  }
  if (originalSixCount !== 6) {
    throw new Error(`fixed-inputs manifest must contain exactly six original inputs, got ${originalSixCount}`)
  }
  if (runtimeModuleCount !== 16) {
    throw new Error(`fixed-inputs manifest must contain exactly sixteen runtime modules, got ${runtimeModuleCount}`)
  }
  return {
    manifestPath: FIXED_INPUTS_PATH,
    manifestSha256,
    checkedAtUtc: utcNow(),
    entryCount: inputs.length,
    originalSixCount: 6,
    runtimeModuleCount: 16,
  }
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
  mkdirSyncPrivate(home)
  mkdirSyncPrivate(appData)
  mkdirSyncPrivate(localAppData)
  mkdirSyncPrivate(temp)
  mkdirSyncPrivate(dshHome)

  process.env.HOME = home
  process.env.USERPROFILE = home
  process.env.APPDATA = appData
  process.env.LOCALAPPDATA = localAppData
  process.env.TEMP = temp
  process.env.TMP = temp
  process.env.TMPDIR = temp
  process.env.XDG_CONFIG_HOME = join(root, 'xdg-config')
  process.env.XDG_CACHE_HOME = join(root, 'xdg-cache')
  process.env.DSH_HOME = dshHome
  mkdirSyncPrivate(process.env.XDG_CONFIG_HOME)
  mkdirSyncPrivate(process.env.XDG_CACHE_HOME)
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

function mkdirSyncPrivate(path: string | undefined): void {
  if (path === undefined) throw new Error('private directory path is missing')
  // This synchronous bootstrap runs before product modules load. The caller
  // checked that the run root is fresh and non-reparse immediately beforehand.
  mkdirSync(path, { recursive: true })
}

function restoreSecretMode(state: SecretReaderState, failures: string[]): void {
  try {
    state.restore()
  } catch (error: unknown) {
    failures.push(`stdin restore failed: ${errorName(error)}`)
  }
}

async function readCredentialFromTty(): Promise<{
  readonly secret: string
  readonly state: SecretReaderState
}> {
  const stdin = process.stdin
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('credential input requires an interactive TTY; refusing environment, file, CLI, or redirected stdin input')
  }
  process.stderr.write('6000D test key (input is not echoed): ')
  const priorRaw = stdin.isRaw
  let restored = false
  const restore = (): void => {
    if (restored) return
    restored = true
    stdin.setRawMode(priorRaw)
    stdin.pause()
  }
  try {
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
  } catch {
    try {
      restore()
    } catch {
      // The caller receives only a safe setup error, never a terminal dump.
    }
    throw new Error('credential input terminal setup failed')
  }

  let value = ''
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
      try {
        restore()
      } catch {
        // Restoration failure is reported without exposing terminal details.
      }
      process.stderr.write('\n')
      reject(new Error(message))
    }
    const finish = (): void => {
      if (settled) return
      settled = true
      cleanup()
      try {
        restore()
      } catch {
        process.stderr.write('\n')
        reject(new Error('credential input terminal restore failed'))
        return
      }
      process.stderr.write('\n')
      if (value.length === 0) reject(new Error('credential input was empty'))
      else resolvePromise({ secret: value, state: { restore } })
    }
    const onError = (): void => rejectSafe('credential input terminal read failed')
    const onEnd = (): void => rejectSafe('credential input ended before a complete record was read')
    const onClose = (): void => rejectSafe('credential input terminal closed before a record was read')
    const onData = (chunk: string): void => {
      for (const character of chunk) {
        if (character === '\u0003') {
          rejectSafe('credential input cancelled')
          return
        }
        if (character === '\r' || character === '\n') {
          finish()
          return
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1)
          continue
        }
        const codePoint = character.codePointAt(0)
        if (codePoint === undefined || codePoint < 0x20 || codePoint > 0x7e) {
          rejectSafe('credential input rejected because it is not printable ASCII')
          return
        }
        if (Buffer.byteLength(value + character, 'utf8') > MAX_CREDENTIAL_BYTES) {
          rejectSafe('credential input rejected because it exceeds the fixed size limit')
          return
        }
        value += character
      }
    }
    stdin.on('data', onData)
    stdin.once('error', onError)
    stdin.once('end', onEnd)
    stdin.once('close', onClose)
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
          : 'model network is closed until the interactive credential is ready',
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
      const response = await original(input, { ...init, redirect: 'error', cache: 'no-store' })
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
  const redactingWrite = (
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
  process.stdout.write = redactingWrite(process.stdout, originalStdoutWrite)
  process.stderr.write = redactingWrite(process.stderr, originalStderrWrite)
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

function errorName(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

async function withWatchdog<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
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

function requestHeaderOf(events: readonly NativeEvent[]): unknown {
  return events.findLast(event => event.type === 'request/header')?.data
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

function assertTurn(
  sessionId: string,
  requestId: string,
  prompt: string,
  beforeSeq: number,
  afterSeq: number,
  events: readonly NativeEvent[],
): TurnRecord {
  if (afterSeq <= beforeSeq) throw new Error(`turn for request ${requestId} appended no native events`)
  const types = events.map(event => event.type)
  for (const required of ['turn/start', 'user/message', 'assistant/message', 'turn/end']) {
    if (!types.includes(required)) throw new Error(`turn for request ${requestId} lacks ${required}`)
  }
  if (types.includes('tool/call') || types.includes('tool/result')) {
    throw new Error(`turn for request ${requestId} unexpectedly used a tool`)
  }
  const user = events.findLast(event => event.type === 'user/message')
  if (user === undefined || eventSourceRpcId(user) !== requestId) {
    throw new Error(`user/message does not carry native R ${requestId}`)
  }
  const turnEnd = events.findLast(event => event.type === 'turn/end')
  if (turnEnd === undefined) throw new Error(`turn for request ${requestId} lacks turn/end`)
  const reason = (turnEnd.data as { readonly reason?: { readonly kind?: string } }).reason
  if (reason?.kind !== 'completed') {
    throw new Error(`turn for request ${requestId} ended with ${String(reason?.kind)}`)
  }
  const responseText = latestAssistantText(events)
  if (responseText.trim().length === 0) {
    throw new Error(`turn for request ${requestId} has no assistant text`)
  }
  const requestHeader = requestHeaderOf(events)
  const headerConfig = (requestHeader as {
    readonly header?: { readonly config?: { readonly provider?: unknown; readonly model?: unknown; readonly maxTokens?: unknown } }
  } | undefined)?.header?.config
  if (
    headerConfig?.provider !== PROVIDER
    || headerConfig.model !== MODEL
    || headerConfig.maxTokens !== MAX_TOKENS
  ) {
    throw new Error(
      `request/header does not carry the fixed route: ${JSON.stringify(headerConfig)}`,
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
      throw new Error(`${label} did not contain required synthetic fact ${fact}; observed ${JSON.stringify(text)}`)
    }
  }
}

function nativeSnapshot(session: {
  readonly id: string
  readonly header: unknown
  readonly inheritedEventCount: number
  snapshotEvents(): readonly NativeEvent[]
}): SessionSnapshot {
  return {
    id: String(session.id),
    header: session.header,
    inheritedEventCount: Number(session.inheritedEventCount),
    events: session.snapshotEvents(),
  }
}

function assertContiguous(session: { snapshotEvents(): readonly NativeEvent[] }, label: string): void {
  session.snapshotEvents().forEach((event, index) => {
    if (event.seq !== index) throw new Error(`${label} event seq is not contiguous at ${String(index)}`)
  })
}

async function readPersistedEvents(
  ctx: { readonly sessionPersistence: { open(id: string, mode: 'read'): Promise<{ read(): Promise<{ events: readonly NativeEvent[] }>; close(): Promise<void> }> } },
  id: string,
): Promise<readonly NativeEvent[]> {
  const handle = await ctx.sessionPersistence.open(id, 'read')
  try {
    return (await handle.read()).events
  } finally {
    await handle.close()
  }
}

interface ProductionContext {
  plugin(plugin: unknown, config?: unknown): Promise<unknown>
  fiber: { dispose(): Promise<void> }
  on(event: string, callback: (...args: never[]) => unknown): () => void
  provide(name: string, value: unknown): void
  readonly sessions: {
    get(id: never): {
      readonly id: string
      readonly header: unknown
      readonly inheritedEventCount: number
      readonly seq: number
      snapshotEvents(offset?: unknown, endOffset?: unknown): readonly NativeEvent[]
    } | undefined
  }
  readonly agents: {
    get(id: never): unknown
  }
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

interface ProductionSetup {
  readonly live: ProductionContext
  readonly commands: {
    create(input: { readonly cwd: string }): Promise<{ readonly sessionId: string }>
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
  readonly persistenceRoot: string
  readonly workspaceRoot: string
  reopenPersistedEvents(sourceSessionId: string, childSessionId: string): Promise<{
    readonly source: readonly NativeEvent[]
    readonly child: readonly NativeEvent[]
  }>
}

async function setupProduction(
  runRoot: string,
  resolveCredential: () => string,
  acceptContext: (context: ProductionContext) => void,
): Promise<ProductionSetup> {
  const [Cordis, Llm, SessionModule, SystemPromptModule, ToolsModule, ProjectionsModule,
    AgentModule, AgentLoopModule, PersistenceModule, QueryModule, TypertModule,
    PiAiModule, ControllerAgentModule, ControllerCommandsModule,
    ControllerProjectionModule, ClientSessionModule] = await Promise.all([
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
  const SessionQueryEngine = QueryModule.SessionQueryEngine
  const TypertRegistry = TypertModule.default
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
  await live.plugin(JsonlSessionPersistence, { root: persistenceRoot, compression: 'none' })
  installModelSelectionProjection(live)
  new SessionQueryEngine(live)
  await live.plugin(PiAiModule, {
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
        transport: 'sse',
        streamIdleTimeoutMs: 300_000,
      },
    },
  })
  await live.plugin(AgentLoop, { agents: [] })

  const agents = new ApiSessionAgentController(live)
  const workspaceRoot = join(runRoot, 'workspace')
  const commands = new SessionCommandController(live, agents, workspaceRoot)
  const reopenPersistedEvents = async (
    sourceSessionId: string,
    childSessionId: string,
  ): Promise<{ readonly source: readonly NativeEvent[]; readonly child: readonly NativeEvent[] }> => {
    const verifier = new Context()
    let source: readonly NativeEvent[] = []
    let child: readonly NativeEvent[] = []
    try {
      await verifier.plugin(LlmRuntime)
      await verifier.plugin(SessionStore)
      await verifier.plugin(SessionProjectionRegistry)
      await verifier.plugin(SystemPrompt, { personaPrefix: '' })
      await verifier.plugin(ToolRuntime)
      await verifier.plugin(AgentRegistry)
      installModelSelectionProjection(verifier)
      await verifier.plugin(JsonlSessionPersistence, { root: persistenceRoot, compression: 'none' })
      await verifier.plugin(AgentLoop, { agents: [] })
      source = await readPersistedEvents(verifier, sourceSessionId)
      child = await readPersistedEvents(verifier, childSessionId)
    } finally {
      await verifier.fiber.dispose()
    }
    return { source, child }
  }
  return {
    live,
    commands,
    BrowserSession,
    SessionLogOffset,
    persistenceRoot,
    workspaceRoot,
    reopenPersistedEvents,
  }
}

async function main(): Promise<void> {
  const mode = parseRunMode(process.argv.slice(2))
  const runRoot = await createPrivateRunRoot()
  const networkGate: NetworkGateState = {
    preflightOnly: mode === 'preflight-only',
    keyReady: false,
    closedAttempts: 0,
  }
  const environment = isolateProcessFiles(runRoot)
  const cleanupFailures: string[] = []
  let secret = ''
  let secretReader: SecretReaderState | undefined
  let outputRedaction: OutputRedactionLease | undefined
  let fetchLease: FetchLease | undefined
  let clientSessionsDisposed = false
  let fiberDisposed = false
  let environmentRestored = false
  let fetchRestored = false
  let outputRedactionRestored = false
  let keyCleared = false
  let ctx: ProductionContext | undefined
  const browserSessions: { dispose(): Promise<void> }[] = []
  const nativeEvents: NativeEventRecord[] = []
  const network: NetworkObservation[] = []
  const turns: TurnRecord[] = []
  let sourceSessionId: string | undefined
  let childSessionId: string | undefined
  let sourceAtFork: SessionSnapshot | undefined
  let sourceAfterChild: SessionSnapshot | undefined
  let childAfterFork: SessionSnapshot | undefined
  let childAfterTurn: SessionSnapshot | undefined
  let childInheritance: RunReport['childInheritance']
  let persistence: RunReport['persistence']

  const report: RunReport = {
    format: 'lawbench-native-real-conversation-v2',
    task: 'A-native-real-conversation-20261028-000823',
    mode,
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
      compression: 'none',
      tools: 'empty registry',
    },
    runRoot,
    admission: {},
    turns,
    network,
    networkSummary: {
      observations: 0,
      modelPostAttempts: 0,
      modelPostHttp200: 0,
      closedAttempts: 0,
    },
    nativeEvents,
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
      fullT31: false,
      gui: false,
      compression: false,
      tools: false,
      packaging: false,
    },
  }

  try {
    report.admission.initial = await verifyFixedInputs()
    fetchLease = installFetchAllowlist(network, networkGate)
    const production = await setupProduction(
      runRoot,
      () => {
        if (secret.length === 0) {
          throw new Error('production requested a credential before interactive TTY readiness')
        }
        return secret
      },
      live => {
        ctx = live
      },
    )
    const live = production.live
    const commands = production.commands
    const workspaceRoot = production.workspaceRoot
    live.on('session/event', (session: { readonly id: string }, event: NativeEvent) => {
      nativeEvents.push({ sessionId: String(session.id), event })
    })

    const created = await withWatchdog(commands.create({ cwd: workspaceRoot })) as {
      readonly sessionId: string
    }
    sourceSessionId = String(created.sessionId)
    report.sourceSessionId = sourceSessionId
    const source = live.sessions.get(created.sessionId)
    const sourceAgent = live.agents.get(created.sessionId) as
      | { readonly whenIdle(): Promise<void> }
      | undefined
    if (source === undefined || sourceAgent === undefined) {
      throw new Error('production SessionController.create did not publish Session and Agent')
    }
    const sourceUuid = SESSION_WITH_UUID.exec(sourceSessionId)?.[1]
    if (sourceUuid === undefined || !UUID_V4.test(sourceUuid)) {
      throw new Error(`production create did not mint an actual UUID identity: ${sourceSessionId}`)
    }

    const sourceBrowser = new production.BrowserSession(source.id, {})
    browserSessions.push(sourceBrowser)
    sourceBrowser.handleRunning(true)

    if (mode === 'preflight-only') {
      report.preflight = {
        setupCompleted: true,
        productionSessionCreated: true,
        keyRead: false,
        promptsSubmitted: 0,
        modelNetworkAttempts: 0,
        fullConversationAssertionsEvaluated: false,
      }
      report.status = 'CLEARSETUP_ONLY'
      return
    }

    const credential = await readCredentialFromTty()
    secret = credential.secret
    secretReader = credential.state
    outputRedaction = installOutputRedaction(secret)
    networkGate.keyReady = true

    const isModelPost = (observation: NetworkObservation): boolean => {
      if (observation.method !== 'POST') return false
      return new URL(observation.url).pathname.startsWith('/v1/')
    }

    const promptTurn = async (
      sessionId: string,
      agent: { followup?: never; whenIdle(): Promise<void> },
      browser: BrowserSessionInstance,
      prompt: string,
    ): Promise<TurnRecord> => {
      const nativeSession = live.sessions.get(sessionId)
      if (nativeSession === undefined) throw new Error(`live Session ${sessionId} is unavailable`)
      const beforeSeq = Number(nativeSession.seq)
      const networkStart = network.length
      const submission = browser.beginSubmission({
        mode: 'queue',
        text: prompt,
        attachments: [],
      })
      const requestId = String(submission.requestId)
      if (!UUID_V4.test(requestId)) throw new Error(`beginSubmission did not mint a UUID v4 R: ${requestId}`)
      await withWatchdog(commands.prompt({
        sessionId: nativeSession.id,
        requestId: submission.requestId,
        mode: 'queue',
        content: [{ type: 'text', text: prompt }],
      }))
      await withWatchdog(agent.whenIdle())
      const afterSeq = Number(nativeSession.seq)
      const events = nativeSession.snapshotEvents(SessionLogOffset(beforeSeq), SessionLogOffset(afterSeq)) as readonly NativeEvent[]
      const base = assertTurn(sessionId, requestId, prompt, beforeSeq, afterSeq, events)
      const turnNetwork = network.slice(networkStart)
      const modelPosts = turnNetwork.filter(isModelPost)
      const record: TurnRecord = {
        ...base,
        networkStart,
        modelPostAttempts: modelPosts.length,
        modelPostHttp200: modelPosts.filter(item => item.status === 200).length,
      }
      if (record.modelPostAttempts === 0 || record.modelPostHttp200 === 0) {
        throw new Error(`turn for request ${requestId} lacked an actual model POST with HTTP 200`)
      }
      turns.push(record)
      return record
    }

    const first = await promptTurn(sourceSessionId, sourceAgent, sourceBrowser, PROMPTS[0])
    assertContainsFacts(first.responseText, ['已记住'], 'turn 1')
    const second = await promptTurn(sourceSessionId, sourceAgent, sourceBrowser, PROMPTS[1])
    assertContainsFacts(second.responseText, [SYNTHETIC_CODE], 'turn 2')
    const third = await promptTurn(sourceSessionId, sourceAgent, sourceBrowser, PROMPTS[2])
    assertContainsFacts(third.responseText, [SYNTHETIC_PERSON, SYNTHETIC_AMOUNT], 'turn 3')
    assertContiguous(source, `source Session ${sourceSessionId}`)
    sourceAtFork = nativeSnapshot(source)

    const forked = await withWatchdog(commands.fork({ sessionId: source.id })) as {
      readonly sessionId: string
    }
    childSessionId = String(forked.sessionId)
    report.childSessionId = childSessionId
    if (childSessionId === sourceSessionId) throw new Error('production fork reused the source Session identity')
    const childUuid = SESSION_WITH_UUID.exec(childSessionId)?.[1]
    if (childUuid === undefined || !UUID_V4.test(childUuid) || childUuid === sourceUuid) {
      throw new Error(`production fork did not mint a distinct UUID identity: ${childSessionId}`)
    }
    const child = live.sessions.get(forked.sessionId)
    const childAgent = live.agents.get(forked.sessionId) as
      | { readonly whenIdle(): Promise<void> }
      | undefined
    if (child === undefined || childAgent === undefined) {
      throw new Error('production fork did not publish the new Session and Agent')
    }
    childAfterFork = nativeSnapshot(child)
    const inherited = childAfterFork.events.slice(0, childAfterFork.inheritedEventCount)
    const sourcePrefix = sourceAtFork.events.slice(0, childAfterFork.inheritedEventCount)
    childInheritance = {
      parentSession: String(child.header.parentSession),
      isSeeded: child.header.isSeeded === true,
      inheritedEventCount: childAfterFork.inheritedEventCount,
      inheritedPrefixEqual: isDeepStrictEqual(inherited, sourcePrefix),
      sourceUnchanged: isDeepStrictEqual(source.snapshotEvents(), sourceAtFork.events),
    }
    if (childInheritance.parentSession !== sourceSessionId) {
      throw new Error(`fork lineage points to ${childInheritance.parentSession}, not ${sourceSessionId}`)
    }
    if (!childInheritance.isSeeded || !childInheritance.inheritedPrefixEqual) {
      throw new Error('fork did not inherit the exact native source prefix')
    }
    if (!childInheritance.sourceUnchanged) throw new Error('fork mutated the source Session')
    if (!child.snapshotEvents().some(event => event.type === 'session/end-seed')) {
      throw new Error('fork lacks the native session/end-seed marker')
    }

    const childBrowser = new production.BrowserSession(child.id, {})
    browserSessions.push(childBrowser)
    childBrowser.handleRunning(true)
    const childTurn = await promptTurn(childSessionId, childAgent, childBrowser, FORK_PROMPT)
    assertContainsFacts(
      childTurn.responseText,
      [SYNTHETIC_CODE, SYNTHETIC_PERSON, SYNTHETIC_AMOUNT],
      'fork follow-up',
    )
    assertContiguous(child, `child Session ${childSessionId}`)
    sourceAfterChild = nativeSnapshot(source)
    childAfterTurn = nativeSnapshot(child)
    if (!isDeepStrictEqual(sourceAfterChild.events, sourceAtFork.events)) {
      throw new Error('child follow-up appended to or changed the source Session')
    }

    await live.fiber.dispose()
    fiberDisposed = true
    ctx = undefined

    const reopened = await production.reopenPersistedEvents(sourceSessionId, childSessionId)
    persistence = {
      root: production.persistenceRoot,
      sourceReopened: reopened.source.length > 0,
      childReopened: reopened.child.length > 0,
      sourceEqual: isDeepStrictEqual(reopened.source, sourceAfterChild.events),
      childEqual: isDeepStrictEqual(reopened.child, childAfterTurn.events),
    }
    if (!persistence.sourceEqual || !persistence.childEqual) {
      throw new Error('reopened JSONL logs do not equal the native live events')
    }
    const modelPosts = network.filter(isModelPost)
    const successfulModelPosts = modelPosts.filter(item => item.status === 200)
    if (modelPosts.length < 4 || successfulModelPosts.length < 4) {
      throw new Error(
        `expected at least four actual model POSTs with HTTP 200, got ${modelPosts.length} POSTs and`
        + ` ${successfulModelPosts.length} HTTP 200 results`,
      )
    }
    if (network.some(item => item.redirect !== 'error')) {
      throw new Error('a model network observation did not enforce redirect denial')
    }
    report.status = 'PASS'
  } catch (error: unknown) {
    report.status = 'FAILED'
    report.error = safeError(error, secret)
  } finally {
    if (sourceAtFork !== undefined) report.sourceAtFork = sourceAtFork
    if (sourceAfterChild !== undefined) report.sourceAfterChild = sourceAfterChild
    else if (ctx !== undefined && sourceSessionId !== undefined) {
      try {
        const source = ctx.sessions.get(sourceSessionId as never)
        if (source !== undefined) report.sourceAfterChild = nativeSnapshot(source)
      } catch (error: unknown) {
        cleanupFailures.push(`final source Session snapshot failed: ${errorName(error)}`)
      }
    }
    if (childAfterFork !== undefined) report.childAfterFork = childAfterFork
    if (childAfterTurn !== undefined) report.childAfterTurn = childAfterTurn
    else if (ctx !== undefined && childSessionId !== undefined) {
      try {
        const child = ctx.sessions.get(childSessionId as never)
        if (child !== undefined) report.childAfterTurn = nativeSnapshot(child)
      } catch (error: unknown) {
        cleanupFailures.push(`final child Session snapshot failed: ${errorName(error)}`)
      }
    }
    if (childInheritance !== undefined) report.childInheritance = childInheritance
    if (persistence !== undefined) report.persistence = persistence

    let browserDisposeFailed = false
    for (const browser of browserSessions.reverse()) {
      try {
        await browser.dispose()
      } catch (error: unknown) {
        browserDisposeFailed = true
        cleanupFailures.push(`client Session dispose failed: ${errorName(error)}`)
      }
    }
    clientSessionsDisposed = !browserDisposeFailed
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
  }

  const modelPosts = network.filter(observation => (
    observation.method === 'POST' && new URL(observation.url).pathname.startsWith('/v1/')
  ))
  report.networkSummary = {
    observations: network.length,
    modelPostAttempts: modelPosts.length,
    modelPostHttp200: modelPosts.filter(item => item.status === 200).length,
    closedAttempts: fetchLease?.closedAttempts() ?? networkGate.closedAttempts,
  }

  const successfulStatus = report.status === 'PASS' || report.status === 'CLEARSETUP_ONLY'
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
      || report.networkSummary.closedAttempts !== 0
      || report.networkSummary.observations !== 0
      || turns.length !== 0
      || secretReader !== undefined
    )
  ) {
    report.status = 'FAILED'
    report.error = { message: 'preflight setup cleanup or closed-network invariant failed' }
  }

  if (report.status === 'PASS' || report.status === 'CLEARSETUP_ONLY') {
    try {
      report.admission.final = await verifyFixedInputs()
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
  const serialized = `${JSON.stringify(sanitized, null, 2)}\n`
  const reportPath = join(runRoot, 'report.json')
  await writeFile(reportPath, serialized, { encoding: 'utf8', flag: 'wx' })
  process.stdout.write(`${JSON.stringify({
    status: sanitized.status,
    mode: sanitized.mode,
    report: reportPath,
    sourceSessionId,
    childSessionId,
    turns: sanitized.turns.length,
    modelRequestsObserved: sanitized.network.length,
    childResponse: sanitized.turns.at(-1)?.responseText,
  }, null, 2)}\n`)
  if (sanitized.status !== 'PASS' && sanitized.status !== 'CLEARSETUP_ONLY') {
    process.exitCode = 1
  }
}

await main()
