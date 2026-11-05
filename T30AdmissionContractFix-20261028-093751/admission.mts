/**
 * Finite, no-delete admission consumer for the accepted genuine T31 Session
 * logs. It creates one synthetic registered case with the installed B-line
 * CaseRegistry, byte-copies the accepted v4 JSONL files into the case session
 * store, and reads them through the installed SessionRouter and persistence
 * implementation. It never emits workspace/session-delete.
 *
 * AUTHORED_NOT_RUN: this source has not been executed by its author.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants as fsConstants, mkdirSync } from 'node:fs'
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const REPO_ROOT = 'D:/Lawbeach/lawbench-A'
const B_SERVICE_ROOT = 'D:/Lawbeach/lawbench-B/service'
const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const MANIFEST_PATH = join(EVIDENCE_DIR, 'fixed-inputs.json')
const HELPER_PATH = join(EVIDENCE_DIR, 'prepare-case.py')
const NODE_PATH = 'E:/node/node.exe'
const PYTHON_PATH = 'C:/Users/morel/AppData/Local/Programs/Python/Python312/python.exe'
const CORDIS_PATH = join(REPO_ROOT, 'dsh/vendor/cordis/lib/index.js')
const PERSISTENCE_PATH = join(REPO_ROOT, 'dsh/packages/session/session-persistence-jsonl/src/index.ts')
const FORMAT_PATH = join(REPO_ROOT, 'dsh/packages/session/session-persistence-jsonl/src/format.ts')
const ROUTER_PATH = join(REPO_ROOT, 'dsh-ext/session-store/router.ts')
const CASE_ROOTS_PATH = join(REPO_ROOT, 'dsh-ext/session-store/case-roots.ts')
const SESSION_STORE_PATH = join(REPO_ROOT, 'dsh-ext/session-store/index.ts')

const SOURCE_ID = 'session-97c67db2-b8a6-428b-be48-04b4144d10bd'
const CHILD_ID = 'session-7fd6b82e-f361-456a-9c91-b6ba77991bb9'
const SOURCE_BYTES = 12059
const CHILD_BYTES = 16235
const SOURCE_EVENTS = 27
const CHILD_EVENTS = 37
const CHILD_INHERITED_EVENTS = 27
const SOURCE_SHA256 = 'e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee'
const CHILD_SHA256 = 'b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461'
const SOURCE_CWD = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T31\\NativeRealConversation-20261028-000823\\run-RTmLl7\\workspace'
const TECHNICAL_WATCHDOG_MS = 86_400_000
const MANIFEST_SHA256 = '3ce2e0193d228d4a8083ad243ebdbf9065f539aef80bd63e969c5c6a7a373c3a'

interface ManifestEntry {
  readonly group: string
  readonly id: string
  readonly path: string
  readonly bytes: number
  readonly sha256: string
  readonly snapshotPath?: string
}

interface FixedManifest {
  readonly format: 'lawbench-t30-genuine-session-admission-inputs-v1'
  readonly task: 'A-T30-genuine-session-admission-20261028-092536'
  readonly hashAlgorithm: 'sha256'
  readonly entries: readonly ManifestEntry[]
}

interface FileIdentity {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

interface NativeEvent {
  readonly type: string
  readonly seq: number
  readonly [key: string]: unknown
}

interface CaseRegistration {
  readonly format: 'lawbench-t30-genuine-case-registration-v1'
  readonly source: 'installed B-line CaseRegistry.open'
  readonly created: true
  readonly caseRoot: string
  readonly appdata: string
  readonly caseId: string
  readonly kind: 'daily'
  readonly caseDbSha256: string
  readonly casesJsonSha256: string
  readonly sessionRoot: string
  readonly networkImports: 0
  readonly modelCalls: 0
}

interface EnvironmentLease {
  restore(): void
  isRestored(): boolean
}

interface FetchLease {
  restore(): void
  isRestored(): boolean
  attempts(): number
}

interface RunReport {
  format: 'lawbench-t30-genuine-session-admission-v1'
  authoredStatus: 'AUTHORED_NOT_RUN'
  status: 'RUNNING' | 'PASS' | 'FAILED'
  process: {
    executable: string
    pid: number
    startedAtUtc: string
  }
  runRoot: string
  manifest?: {
    path: string
    sha256: string
    entries: number
    checkedAtUtc: string
  }
  case?: CaseRegistration
  sourceAndTarget: {
    sourceBefore?: FileIdentity
    sourceAfterCopy?: FileIdentity
    sourceInputFinal?: FileIdentity
    sourceFinal?: FileIdentity
    childBefore?: FileIdentity
    childAfterCopy?: FileIdentity
    childInputFinal?: FileIdentity
    childFinal?: FileIdentity
    target?: {
      source: FileIdentity & { path: string }
      child: FileIdentity & { path: string }
      sourceProjectDir: string
      childProjectDir: string
      sourceDirectory: string
      childDirectory: string
    }
  }
  router?: {
    caseRootsVisible: boolean
    listedCount: number
    sourceStatSizeBytes?: number
    childStatSizeBytes?: number
    sourceLogicalCwd?: string
    childLogicalCwd?: string
    sourcePhysicalHeaderCwd?: string
    childPhysicalHeaderCwd?: string
    sourceEvents: number
    childEvents: number
    childInheritedEvents: number
    inheritedPrefixEqual: boolean
    parentRelationEqual: boolean
    sourceRecordOwnedByCase: boolean
    childRecordOwnedByCase: boolean
    sourceRecordDirectory?: string
    childRecordDirectory?: string
  }
  preflight?: {
    event: 'workspace/session-delete-check'
    refusalCodes: readonly string[]
    deleteEventsEmitted: number
    deleteEventObserved: boolean
    fixedDriveCheckOnly: true
    stopOrReleaseCalled: false
    trashMoveCalled: false
  }
  network: {
    fetchAttempts: number
    httpRequests: 0
    modelCalls: 0
  }
  cleanup: {
    routerContextDisposed: boolean
    preflightContextDisposed: boolean
    fetchRestored: boolean
    environmentRestored: boolean
    failures: string[]
  }
  claims: {
    gui: false
    fixedDriveTrash: false
    usbRefusal: false
    wholeT30: false
    packaging: false
  }
  error?: { name: string; message: string }
}

const report: RunReport = {
  format: 'lawbench-t30-genuine-session-admission-v1',
  authoredStatus: 'AUTHORED_NOT_RUN',
  status: 'RUNNING',
  process: {
    executable: process.execPath,
    pid: process.pid,
    startedAtUtc: new Date(Date.now() - process.uptime() * 1000).toISOString(),
  },
  runRoot: '',
  sourceAndTarget: {},
  network: {
    fetchAttempts: 0,
    httpRequests: 0,
    modelCalls: 0,
  },
  cleanup: {
    routerContextDisposed: false,
    preflightContextDisposed: false,
    fetchRestored: false,
    environmentRestored: false,
    failures: [],
  },
  claims: {
    gui: false,
    fixedDriveTrash: false,
    usbRefusal: false,
    wholeT30: false,
    packaging: false,
  },
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function pathKey(path: string): string {
  return resolve(path).replace(/\//g, '\\').toLowerCase()
}

function utcNow(): string {
  return new Date().toISOString()
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'Error'
}

function safeError(error: unknown): { name: string; message: string } {
  const name = errorName(error)
  const message = error instanceof Error ? error.message : String(error)
  return { name, message: message.slice(0, 1000) }
}

async function assertRegularFile(path: string): Promise<FileIdentity> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`fixed input is not a regular non-reparse file: ${path}`)
  }
  const bytes = await readFile(path)
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) }
}

async function assertDirectoryNotReparse(path: string): Promise<void> {
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`private root is not a regular directory: ${path}`)
  }
  if (pathKey(await realpath(path)) !== pathKey(path)) {
    throw new Error(`private root resolves through a reparse point: ${path}`)
  }
}

function inside(root: string, target: string): boolean {
  const rel = relative(resolve(root), resolve(target))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

async function verifyManifest(): Promise<FixedManifest> {
  if (!/^[0-9a-f]{64}$/.test(MANIFEST_SHA256)) {
    throw new Error('fixed-inputs manifest literal pin is not installed')
  }
  const manifestInfo = await lstat(MANIFEST_PATH)
  if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) {
    throw new Error('fixed-inputs manifest is not a regular file')
  }
  const manifestBytes = await readFile(MANIFEST_PATH)
  const manifestSha256 = sha256(manifestBytes)
  if (manifestSha256 !== MANIFEST_SHA256) {
    throw new Error('fixed-inputs manifest hash does not match the literal consumer pin')
  }
  const parsed = JSON.parse(manifestBytes.toString('utf8')) as Partial<FixedManifest>
  if (
    parsed.format !== 'lawbench-t30-genuine-session-admission-inputs-v1'
    || parsed.task !== 'A-T30-genuine-session-admission-20261028-092536'
    || parsed.hashAlgorithm !== 'sha256'
    || !Array.isArray(parsed.entries)
  ) {
    throw new Error('fixed-inputs manifest header is invalid')
  }

  const identities = new Set<string>()
  const required = new Map<string, ManifestEntry>()
  for (const entry of parsed.entries) {
    if (
      typeof entry.group !== 'string'
      || typeof entry.id !== 'string'
      || typeof entry.path !== 'string'
      || !isAbsolute(entry.path)
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes < 0
      || typeof entry.sha256 !== 'string'
      || !/^[0-9a-f]{64}$/.test(entry.sha256)
      || (entry.snapshotPath !== undefined
        && (typeof entry.snapshotPath !== 'string' || !isAbsolute(entry.snapshotPath)))
    ) {
      throw new Error('fixed-inputs manifest contains an invalid entry')
    }
    const identity = `${entry.group}\u0000${entry.id}`
    if (identities.has(identity)) throw new Error(`fixed-inputs manifest repeats ${identity}`)
    identities.add(identity)
    required.set(entry.id, entry)

    const actual = await assertRegularFile(entry.path)
    if (actual.bytes !== entry.bytes || actual.sha256 !== entry.sha256) {
      throw new Error(`fixed input bytes or SHA-256 changed: ${entry.path}`)
    }
    if (entry.snapshotPath !== undefined) {
      const snapshot = await assertRegularFile(entry.snapshotPath)
      if (snapshot.bytes !== entry.bytes || snapshot.sha256 !== entry.sha256) {
        throw new Error(`fixed input snapshot changed: ${entry.snapshotPath}`)
      }
    }
  }

  const requiredIds = [
    'node-executable',
    'python-executable',
    'prepare-case-helper',
    'cordis',
    'persistence-jsonl',
    'persistence-format',
    'session-router',
    'case-roots',
    'session-store',
    'trash',
    'source-jsonl',
    'child-jsonl',
  ]
  for (const id of requiredIds) {
    if (!required.has(id)) throw new Error(`fixed-inputs manifest is missing ${id}`)
  }
  const source = required.get('source-jsonl')!
  const child = required.get('child-jsonl')!
  if (
    source.path !== join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536',
      `${SOURCE_ID}.v4.jsonl`)
    || source.bytes !== SOURCE_BYTES
    || source.sha256 !== SOURCE_SHA256
    || child.path !== join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536',
      `${CHILD_ID}.v4.jsonl`)
    || child.bytes !== CHILD_BYTES
    || child.sha256 !== CHILD_SHA256
  ) {
    throw new Error('primary Session identities disagree with the literal consumer pins')
  }
  const helper = required.get('prepare-case-helper')!
  if (helper.path !== HELPER_PATH) throw new Error('prepare-case helper path changed')

  report.manifest = {
    path: MANIFEST_PATH,
    sha256: manifestSha256,
    entries: parsed.entries.length,
    checkedAtUtc: utcNow(),
  }
  return parsed as FixedManifest
}

async function createFreshRoot(): Promise<string> {
  await assertDirectoryNotReparse(EVIDENCE_DIR)
  const root = await mkdtemp(join(EVIDENCE_DIR, 'run-'))
  await assertDirectoryNotReparse(root)
  if ((await readdir(root)).length !== 0) throw new Error('fresh admission root is not empty')
  return root
}

function isolateEnvironment(root: string): EnvironmentLease {
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
    'PYTHONPATH',
    'PYTHONDONTWRITEBYTECODE',
    'PYTHONNOUSERSITE',
    'PYTHONIOENCODING',
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'ALL_PROXY',
    'http_proxy',
    'https_proxy',
    'all_proxy',
    'NO_PROXY',
    'no_proxy',
    'NODE_USE_ENV_PROXY',
  ] as const
  const previous = new Map<string, string | undefined>()
  for (const name of names) previous.set(name, process.env[name])

  const home = join(root, 'home')
  const appData = join(root, 'appdata')
  const localAppData = join(root, 'localappdata')
  const temp = join(root, 'temp')
  const dshHome = join(root, 'dsh-home')
  for (const path of [home, appData, localAppData, temp, dshHome]) {
    mkdirSync(path, { recursive: true })
  }

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
  process.env.PYTHONPATH = B_SERVICE_ROOT
  process.env.PYTHONDONTWRITEBYTECODE = '1'
  process.env.PYTHONNOUSERSITE = '1'
  process.env.PYTHONIOENCODING = 'utf-8'
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
    delete process.env[name]
  }
  process.env.NO_PROXY = '*'
  process.env.no_proxy = '*'
  process.env.NODE_USE_ENV_PROXY = '0'

  let restored = false
  return {
    restore() {
      if (restored) return
      restored = true
      for (const name of names) {
        const value = previous.get(name)
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    },
    isRestored() {
      return restored
    },
  }
}

function denyFetch(): FetchLease {
  const original = globalThis.fetch
  let count = 0
  let restored = false
  globalThis.fetch = (async () => {
    count += 1
    throw new Error('network is closed for T30 genuine Session admission')
  }) as typeof globalThis.fetch
  return {
    restore() {
      if (restored) return
      globalThis.fetch = original
      restored = true
    },
    isRestored() {
      return restored && globalThis.fetch === original
    },
    attempts() {
      return count
    },
  }
}

async function prepareCase(runRoot: string): Promise<CaseRegistration> {
  const child = spawnSync(PYTHON_PATH, [HELPER_PATH, runRoot], {
    cwd: B_SERVICE_ROOT,
    env: process.env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: TECHNICAL_WATCHDOG_MS,
    maxBuffer: 1024 * 1024,
  })
  if (child.error !== undefined) throw child.error
  if (child.status !== 0) {
    throw new Error(`prepare-case.py exited ${String(child.status)}: ${(child.stderr ?? '').trim()}`)
  }
  const registrationPath = join(runRoot, 'case-registration.json')
  const bytes = await readFile(registrationPath)
  const value = JSON.parse(bytes.toString('utf8')) as Partial<CaseRegistration>
  if (
    value.format !== 'lawbench-t30-genuine-case-registration-v1'
    || value.source !== 'installed B-line CaseRegistry.open'
    || value.created !== true
    || typeof value.caseRoot !== 'string'
    || typeof value.appdata !== 'string'
    || typeof value.caseId !== 'string'
    || !/^[0-9a-f-]{36}$/i.test(value.caseId)
    || value.kind !== 'daily'
    || typeof value.caseDbSha256 !== 'string'
    || typeof value.casesJsonSha256 !== 'string'
    || typeof value.sessionRoot !== 'string'
    || value.networkImports !== 0
    || value.modelCalls !== 0
  ) {
    throw new Error('genuine case registration report is invalid')
  }
  const expectedCase = join(runRoot, 'case')
  const expectedAppData = join(runRoot, 'appdata')
  if (pathKey(value.caseRoot) !== pathKey(expectedCase)) throw new Error('registered case root escaped the fresh root')
  if (pathKey(value.appdata) !== pathKey(expectedAppData)) throw new Error('case appdata escaped the fresh root')
  if (pathKey(value.sessionRoot) !== pathKey(join(expectedCase, '工作区', '会话'))) {
    throw new Error('case session root is not the real CaseRegistry location')
  }
  return value as CaseRegistration
}

function firstHeader(bytes: Buffer): { id: string; cwd: string } {
  const newline = bytes.indexOf(0x0a)
  if (newline < 1) throw new Error('Session log lacks a complete header line')
  const parsed = JSON.parse(bytes.subarray(0, newline).toString('utf8')) as { type?: unknown; id?: unknown; cwd?: unknown }
  if (
    parsed.type !== 'session'
    || typeof parsed.id !== 'string'
    || typeof parsed.cwd !== 'string'
    || !isAbsolute(parsed.cwd)
  ) {
    throw new Error('Session log header is invalid or was rewritten')
  }
  return { id: parsed.id, cwd: parsed.cwd }
}

async function copyAcceptedLogs(
  registration: CaseRegistration,
  format: { logPath(root: string, cwd: string | undefined, id: string, compression: 'none'): string; sessionDir(root: string, cwd: string | undefined, id: string): string; projectDir(root: string, cwd: string | undefined): string },
): Promise<void> {
  const sourcePath = join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536', `${SOURCE_ID}.v4.jsonl`)
  const childPath = join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536', `${CHILD_ID}.v4.jsonl`)
  report.sourceAndTarget.sourceBefore = await assertRegularFile(sourcePath)
  report.sourceAndTarget.childBefore = await assertRegularFile(childPath)
  const sourceBytes = await readFile(sourcePath)
  const childBytes = await readFile(childPath)
  const sourceHeader = firstHeader(sourceBytes)
  const childHeader = firstHeader(childBytes)
  if (
    sourceHeader.id !== SOURCE_ID
    || childHeader.id !== CHILD_ID
    || sourceHeader.cwd !== SOURCE_CWD
    || childHeader.cwd !== SOURCE_CWD
  ) {
    throw new Error('accepted Session headers disagree with the literal primary identities')
  }

  const targetSource = format.logPath(registration.sessionRoot, sourceHeader.cwd, SOURCE_ID, 'none')
  const targetChild = format.logPath(registration.sessionRoot, childHeader.cwd, CHILD_ID, 'none')
  for (const target of [targetSource, targetChild]) {
    if (!inside(join(registration.caseRoot, '工作区', '会话'), target)) {
      throw new Error('target Session log escaped the registered case session root')
    }
    await mkdir(dirname(target), { recursive: true })
  }
  await copyFile(sourcePath, targetSource, fsConstants.COPYFILE_EXCL)
  await copyFile(childPath, targetChild, fsConstants.COPYFILE_EXCL)
  const targetSourceIdentity = await assertRegularFile(targetSource)
  const targetChildIdentity = await assertRegularFile(targetChild)
  report.sourceAndTarget.sourceAfterCopy = await assertRegularFile(sourcePath)
  report.sourceAndTarget.childAfterCopy = await assertRegularFile(childPath)
  if (
    targetSourceIdentity.bytes !== SOURCE_BYTES
    || targetSourceIdentity.sha256 !== SOURCE_SHA256
    || targetChildIdentity.bytes !== CHILD_BYTES
    || targetChildIdentity.sha256 !== CHILD_SHA256
    || report.sourceAndTarget.sourceAfterCopy.sha256 !== SOURCE_SHA256
    || report.sourceAndTarget.childAfterCopy.sha256 !== CHILD_SHA256
  ) {
    throw new Error('byte-copy did not preserve exact accepted Session bytes')
  }
  report.sourceAndTarget.target = {
    source: targetSourceIdentity,
    child: targetChildIdentity,
    sourceProjectDir: format.projectDir(registration.sessionRoot, sourceHeader.cwd),
    childProjectDir: format.projectDir(registration.sessionRoot, childHeader.cwd),
    sourceDirectory: format.sessionDir(registration.sessionRoot, sourceHeader.cwd, SOURCE_ID),
    childDirectory: format.sessionDir(registration.sessionRoot, childHeader.cwd, CHILD_ID),
  }
}

async function runRouterChecks(
  registration: CaseRegistration,
  format: any,
  modules: {
    Cordis: any
    Jsonl: any
    SessionRouter: any
    CaseRoots: any
    inside: (root: string, target: string) => boolean
  },
): Promise<void> {
  if (typeof modules.SessionRouter !== 'function' || typeof modules.CaseRoots !== 'function') {
    throw new Error('installed SessionRouter or CaseRoots export is unavailable')
  }
  const roots = new modules.CaseRoots(registration.appdata).load()
  roots.replace([{ root: registration.caseRoot, exists: true }])
  const reloaded = new modules.CaseRoots(registration.appdata).load()
  if (
    reloaded.list().length !== 1
    || pathKey(reloaded.list()[0]) !== pathKey(registration.caseRoot)
  ) {
    throw new Error('CaseRoots did not retain the registered synthetic case')
  }

  const context = new modules.Cordis.Context()
  let disposed = false
  const make = (root: string): any =>
    new modules.Jsonl(context.isolate('sessionPersistence'), { root, compression: 'none' })
  const router = new modules.SessionRouter(make, reloaded, {
    defaultRoot: join(report.runRoot, 'default-sessions'),
    allowOutsideCase: false,
    caseRootTimeoutMs: 3000,
  })
  try {
    const snapshots = await router.list()
    const sourceStat = await router.stat(SOURCE_ID)
    const childStat = await router.stat(CHILD_ID)
    if (
      snapshots.length !== 2
      || sourceStat === undefined
      || childStat === undefined
      || sourceStat.sizeBytes !== SOURCE_BYTES
      || childStat.sizeBytes !== CHILD_BYTES
      || pathKey(sourceStat.header.cwd) !== pathKey(registration.caseRoot)
      || pathKey(childStat.header.cwd) !== pathKey(registration.caseRoot)
      || childStat.header.parentSession !== SOURCE_ID
      || childStat.header.isSeeded !== true
    ) {
      throw new Error('router list/stat logical projection is invalid')
    }

    const readSession = async (id: string) => {
      const handle = await router.open(id, 'read')
      try {
        const read = await handle.read()
        return {
          events: read.events as readonly NativeEvent[],
          inheritedEventCount: Number(handle.inheritedEventCount),
        }
      } finally {
        await handle.close()
      }
    }
    const sourceRead = await readSession(SOURCE_ID)
    const childRead = await readSession(CHILD_ID)
    if (
      sourceRead.events.length !== SOURCE_EVENTS
      || childRead.events.length !== CHILD_EVENTS
      || childRead.inheritedEventCount !== CHILD_INHERITED_EVENTS
      || !isDeepStrictEqual(
        childRead.events.slice(0, CHILD_INHERITED_EVENTS),
        sourceRead.events,
      )
    ) {
      throw new Error('actual persistence reader did not return 27/37 events with the 27-event parent prefix')
    }

    const sourceRecord = await router.recordOf(SOURCE_ID)
    const childRecord = await router.recordOf(CHILD_ID)
    const target = report.sourceAndTarget.target!
    if (
      sourceRecord === undefined
      || childRecord === undefined
      || sourceRecord.caseRoot === null
      || childRecord.caseRoot === null
      || pathKey(sourceRecord.caseRoot) !== pathKey(registration.caseRoot)
      || pathKey(childRecord.caseRoot) !== pathKey(registration.caseRoot)
      || sourceRecord.dir === undefined
      || childRecord.dir === undefined
      || pathKey(sourceRecord.dir) !== pathKey(target.sourceDirectory)
      || pathKey(childRecord.dir) !== pathKey(target.childDirectory)
      || !modules.inside(join(registration.caseRoot, '工作区', '会话'), sourceRecord.dir)
      || !modules.inside(join(registration.caseRoot, '工作区', '会话'), childRecord.dir)
    ) {
      throw new Error('recordOf did not locate both logs under the owned case session store')
    }

    const targetSourceBytes = await readFile(target.source.path)
    const targetChildBytes = await readFile(target.child.path)
    const physicalSourceHeader = firstHeader(targetSourceBytes)
    const physicalChildHeader = firstHeader(targetChildBytes)
    if (
      physicalSourceHeader.cwd !== SOURCE_CWD
      || physicalChildHeader.cwd !== SOURCE_CWD
      || target.sourceProjectDir !== format.projectDir(
        registration.sessionRoot,
        SOURCE_CWD,
      )
    ) {
      throw new Error('physical header or project directory was rewritten instead of logically remapped')
    }

    report.router = {
      caseRootsVisible: true,
      listedCount: snapshots.length,
      sourceStatSizeBytes: sourceStat.sizeBytes,
      childStatSizeBytes: childStat.sizeBytes,
      sourceLogicalCwd: String(sourceStat.header.cwd),
      childLogicalCwd: String(childStat.header.cwd),
      sourcePhysicalHeaderCwd: physicalSourceHeader.cwd,
      childPhysicalHeaderCwd: physicalChildHeader.cwd,
      sourceEvents: sourceRead.events.length,
      childEvents: childRead.events.length,
      childInheritedEvents: childRead.inheritedEventCount,
      inheritedPrefixEqual: true,
      parentRelationEqual: true,
      sourceRecordOwnedByCase: true,
      childRecordOwnedByCase: true,
      sourceRecordDirectory: sourceRecord.dir,
      childRecordDirectory: childRecord.dir,
    }
  } finally {
    await context.fiber.dispose()
    disposed = true
    report.cleanup.routerContextDisposed = disposed
  }
}

async function runPreflight(
  registration: CaseRegistration,
  Cordis: any,
  applySessionStore: any,
): Promise<void> {
  if (typeof applySessionStore !== 'function') {
    throw new Error('installed lawbench session-store apply export is unavailable')
  }
  const context = new Cordis.Context()
  let deleteEventObserved = false
  context.on('workspace/session-delete', () => {
    deleteEventObserved = true
  })
  let disposed = false
  try {
    await applySessionStore(context, {
      backendModule: PERSISTENCE_PATH,
      defaultRoot: join(report.runRoot, 'default-sessions'),
      appData: registration.appdata,
      allowOutsideCase: false,
      compression: 'none',
    })
    const persistence = context.get('sessionPersistence') as {
      list(): Promise<readonly unknown[]>
      stat(id: string): Promise<{ sizeBytes?: number } | undefined>
    } | undefined
    if (persistence === undefined) throw new Error('real session-store plugin did not expose sessionPersistence')
    const listed = await persistence.list()
    const stat = await persistence.stat(SOURCE_ID)
    if (listed.length !== 2 || stat?.sizeBytes !== SOURCE_BYTES) {
      throw new Error('real session-store service did not list/stat the admitted logs')
    }
    if (typeof context.waterfall !== 'function') throw new Error('real Context lacks waterfall')
    const refusalCodes = await context.waterfall(
      'workspace/session-delete-check',
      { sessionId: SOURCE_ID },
      () => Promise.resolve([]),
    ) as readonly string[]
    if (!Array.isArray(refusalCodes) || refusalCodes.length !== 0) {
      throw new Error('fixed-drive delete preflight refused the admitted Session')
    }
    if (deleteEventObserved) throw new Error('workspace/session-delete was emitted during preflight-only admission')
    report.preflight = {
      event: 'workspace/session-delete-check',
      refusalCodes,
      deleteEventsEmitted: 0,
      deleteEventObserved,
      fixedDriveCheckOnly: true,
      stopOrReleaseCalled: false,
      trashMoveCalled: false,
    }
  } finally {
    await context.fiber.dispose()
    disposed = true
    report.cleanup.preflightContextDisposed = disposed
  }
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new Error('admission.mts accepts no arguments')
  if (pathKey(process.execPath) !== pathKey(NODE_PATH)) {
    throw new Error('admission must run under the fixed Node executable')
  }
  const root = await createFreshRoot()
  report.runRoot = root
  const environment = isolateEnvironment(root)
  const fetchLease = denyFetch()
  let passed = false
  try {
    await verifyManifest()
    const registration = await prepareCase(root)
    report.case = registration

    const [cordis, persistence, format, routerModule, caseRootsModule, sessionStoreModule] =
      await Promise.all([
        import(pathToFileURL(CORDIS_PATH).href),
        import(pathToFileURL(PERSISTENCE_PATH).href),
        import(pathToFileURL(FORMAT_PATH).href),
        import(pathToFileURL(ROUTER_PATH).href),
        import(pathToFileURL(CASE_ROOTS_PATH).href),
        import(pathToFileURL(SESSION_STORE_PATH).href),
      ])
    const Jsonl = persistence.default
    if (typeof Jsonl !== 'function') throw new Error('installed JSONL persistence default export is unavailable')

    await copyAcceptedLogs(registration, format as any)
    await runRouterChecks(registration, format, {
      Cordis: cordis.Context,
      Jsonl,
      SessionRouter: routerModule.SessionRouter,
      CaseRoots: caseRootsModule.CaseRoots,
      inside: routerModule.inside,
    })
    await runPreflight(registration, cordis.Context, sessionStoreModule.apply)

    report.sourceAndTarget.sourceFinal = await assertRegularFile(
      report.sourceAndTarget.target!.source.path,
    )
    report.sourceAndTarget.childFinal = await assertRegularFile(
      report.sourceAndTarget.target!.child.path,
    )
    const sourceInputFinal = await assertRegularFile(
      join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536', `${SOURCE_ID}.v4.jsonl`),
    )
    const childInputFinal = await assertRegularFile(
      join('D:/Lawbeach/lawbench-coord/T30GenuineSessionInput-20261028-092536', `${CHILD_ID}.v4.jsonl`),
    )
    report.sourceAndTarget.sourceInputFinal = sourceInputFinal
    report.sourceAndTarget.childInputFinal = childInputFinal
    if (
      sourceInputFinal.sha256 !== SOURCE_SHA256
      || childInputFinal.sha256 !== CHILD_SHA256
      || report.sourceAndTarget.sourceFinal.sha256 !== SOURCE_SHA256
      || report.sourceAndTarget.childFinal.sha256 !== CHILD_SHA256
    ) {
      throw new Error('source or target Session logs changed during admission')
    }
    if (fetchLease.attempts() !== 0) throw new Error('network was attempted during admission')
    passed = true
  } catch (error: unknown) {
    report.error = safeError(error)
  } finally {
    try {
      fetchLease.restore()
      report.cleanup.fetchRestored = fetchLease.isRestored()
    } catch (error: unknown) {
      report.cleanup.failures.push(`fetch restore failed: ${errorName(error)}`)
    }
    try {
      environment.restore()
      report.cleanup.environmentRestored = environment.isRestored()
    } catch (error: unknown) {
      report.cleanup.failures.push(`environment restore failed: ${errorName(error)}`)
    }
    report.network.fetchAttempts = fetchLease.attempts()
    report.status = passed
      && report.cleanup.failures.length === 0
      && report.cleanup.routerContextDisposed
      && report.cleanup.preflightContextDisposed
      && report.cleanup.fetchRestored
      && report.cleanup.environmentRestored
      && report.network.fetchAttempts === 0
      ? 'PASS'
      : 'FAILED'
    const reportPath = join(root, 'admission-report.json')
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', {
      encoding: 'utf8',
      flag: 'wx',
    })
    process.stdout.write(`T30 genuine Session admission: ${report.status}\n`)
    process.stdout.write(`${reportPath}\n`)
  }
  if (report.status !== 'PASS') process.exitCode = 1
}

main().catch(error => {
  process.stderr.write(`T30 genuine Session admission bootstrap failed: ${errorName(error)}\n`)
  process.exitCode = 1
})
