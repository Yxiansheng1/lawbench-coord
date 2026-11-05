import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { Session as NativeSession } from '../../dsh/packages/api/session-controller/src/client/sessions/session.ts'
import type { SessionRemotes } from '../../dsh/packages/api/session-controller/src/client/sessions/remotes.ts'
import { LawbenchRemote, type ApiResult } from '../host/index.ts'
import { requestJson } from '../host/http-json.ts'
import { API_ROUTES, type ApiRoute } from '../shared/api-routes.ts'
import { CoreClient, type CoreResult } from '../shared/core-client.ts'
import { toolId, validate } from '../shared/contracts.ts'

const PREP_DIR = 'D:/Lawbeach/lawbench-B/docs/plan/evidence/T31/ScopeHttpEntry-20261026-031523'
const RUNS_DIR = join(PREP_DIR, 'runs')
const RUN_NAME = /^T33-host-[0-9]{8}-[0-9]{6}$/
type NativeSessionId = ConstructorParameters<typeof NativeSession>[0]
const SESSION_ID = '11111111-1111-4111-8111-111111111111' as NativeSessionId
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TASK_ID = /^T-[0-9]{14}-[0-9a-f]{4}$/
const FINAL_TIMEOUT_MS = 45_000
const LOOP_TIMEOUT_MS = 10_000
const HTTP_TIMEOUT_MS = 5_000

const SCOPE_FILES = [
  ['scope-in.txt', 'T31_SHARED 内部唯一正文\n'],
  ['scope-out.txt', 'T31_SHARED 外部唯一正文\n'],
  ['scope-third.txt', '第三份合成正文\n'],
] as const

const FORBIDDEN_EXTERNAL_CONTEXT = [
  'scope-out',
  'scope-third',
  '外部唯一正文',
  '第三份合成正文',
] as const

type JsonRecord = Record<string, unknown>
type Logged = { level: 'info' | 'warn' | 'error'; event: string; meta?: JsonRecord }
type FileSnapshot = {
  readonly bytes: Buffer
  readonly size: number
  readonly mtimeMs: number
  readonly sha256: string
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') throw new Error(`required environment variable is absent: ${name}`)
  return value
}

function requiredRoot(): string {
  const raw = requiredEnv('LB_SCOPE_HTTP_ROOT')
  if (!isAbsolute(raw)) throw new Error('LB_SCOPE_HTTP_ROOT must be absolute')
  const root = resolve(raw)
  if (
    dirname(root).toLowerCase() !== resolve(RUNS_DIR).toLowerCase()
    || !RUN_NAME.test(basename(root))
  ) {
    throw new Error('LB_SCOPE_HTTP_ROOT must be one T33-host-YYYYMMDD-HHMMSS child of the T31 runs directory')
  }
  return root
}

function requiredPort(): number {
  const raw = requiredEnv('LB_SCOPE_HTTP_PORT')
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error('LB_SCOPE_HTTP_PORT must be an integer')
  const port = Number(raw)
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error('LB_SCOPE_HTTP_PORT must be in 1..65535')
  }
  return port
}

function asRecord(value: unknown): JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('expected an object')
  return value as JsonRecord
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('expected an array')
  return value
}

function asString(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  return value
}

function inertSessionRemotes(onAccess: () => void): SessionRemotes {
  return new Proxy({} as SessionRemotes, {
    get(_target, property) {
      onAccess()
      throw new Error(`native Session remote access is outside the finite T31 consumer: ${String(property)}`)
    },
  })
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

async function capturePlainFile(path: string): Promise<FileSnapshot> {
  const info = await lstat(path)
  expect(info.isFile()).toBe(true)
  expect(info.isSymbolicLink()).toBe(false)
  expect(info.nlink).toBe(1)
  expect(info.size).toBeLessThanOrEqual(64 * 1024)
  const bytes = await readFile(path)
  return { bytes, size: info.size, mtimeMs: info.mtimeMs, sha256: sha256(bytes) }
}

async function captureFiles(paths: readonly string[]): Promise<FileSnapshot[]> {
  const snapshots: FileSnapshot[] = []
  for (const path of paths) snapshots.push(await capturePlainFile(path))
  return snapshots
}

async function captureScopeSources(scopeSource: string): Promise<Map<string, FileSnapshot>> {
  const info = await lstat(scopeSource)
  expect(info.isDirectory()).toBe(true)
  expect(info.isSymbolicLink()).toBe(false)
  const names = (await readdir(scopeSource)).sort()
  expect(names).toEqual(SCOPE_FILES.map(([name]) => name))

  const snapshots = new Map<string, FileSnapshot>()
  for (const [name, text] of SCOPE_FILES) {
    const snapshot = await capturePlainFile(join(scopeSource, name))
    expect(snapshot.bytes.toString('utf8')).toBe(text)
    expect(snapshot.size).toBe(Buffer.byteLength(text, 'utf8'))
    snapshots.set(name, snapshot)
  }
  return snapshots
}

function parseJson(bytes: Uint8Array): JsonRecord {
  return asRecord(JSON.parse(Buffer.from(bytes).toString('utf8')))
}

async function readJson(path: string): Promise<JsonRecord> {
  return parseJson(await readFile(path))
}

async function waitForJson(path: string, timeoutMs: number): Promise<JsonRecord> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      return await readJson(path)
    } catch (error) {
      if (Date.now() >= deadline) throw error
      await new Promise((done) => setTimeout(done, 100))
    }
  }
}

async function optionalDirectoryNames(path: string): Promise<string[] | undefined> {
  try {
    return await readdir(path)
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return undefined
    throw error
  }
}

function insideCase(casePath: string, relPath: string): string {
  const root = resolve(casePath)
  const target = resolve(root, relPath)
  const child = relative(root, target)
  if (!child || child.startsWith('..') || isAbsolute(child)) {
    throw new Error('native material path escaped the case root')
  }
  return target
}

function apiRoute(method: string): ApiRoute {
  const route = API_ROUTES.find((candidate) => candidate.method === method)
  if (route === undefined) throw new Error(`missing API route: ${method}`)
  return { ...route, timeoutMs: HTTP_TIMEOUT_MS }
}

function apiOk(result: ApiResult, label: string): JsonRecord {
  if (!result.ok) throw new Error(`${label} failed: ${result.error.code}`)
  return asRecord(result.value)
}

function coreOk(result: CoreResult<JsonRecord>, label: string): JsonRecord {
  if (!result.ok) throw new Error(`${label} failed: ${result.error.code}`)
  return result.value
}

describe('T31 native scoped HTTP consumer', () => {
  it('carries one native request identity through the exact finite Host/Core boundary', async () => {
    const root = requiredRoot()
    const port = requiredPort()
    const token = requiredEnv('LB_SCOPE_HTTP_TOKEN')
    const rootInfo = await lstat(root)
    expect(rootInfo.isDirectory()).toBe(true)
    expect(rootInfo.isSymbolicLink()).toBe(false)

    const prepared = await readJson(join(root, 'prepared.json'))
    const preparedPaths = asRecord(prepared.paths)
    expect(resolve(asString(asRecord(preparedPaths.root).path, 'prepared paths.root.path')).toLowerCase())
      .toBe(resolve(root).toLowerCase())
    const casePath = insideCase(root, asString(asRecord(preparedPaths.case).path, 'prepared paths.case.path'))
    const readyPath = insideCase(root, asString(asRecord(preparedPaths.ready).path, 'prepared paths.ready.path'))
    const appDataPath = insideCase(root, asString(asRecord(preparedPaths.appdata).path, 'prepared paths.appdata.path'))
    const scopeSource = join(readyPath, 'scope-source')
    const scopeSourceBefore = await captureScopeSources(scopeSource)
    const logs: Logged[] = []
    let credentialGetterCalls = 0
    const log = (level: Logged['level'], event: string, meta?: JsonRecord): void => {
      logs.push(meta === undefined ? { level, event } : { level, event, meta })
    }
    const supervisor = { endpoint: () => ({ port, token }) } as unknown as
      ConstructorParameters<typeof LawbenchRemote>[0]
    const remote = new LawbenchRemote(
      supervisor,
      appDataPath,
      () => {
        credentialGetterCalls += 1
        throw new Error('credentials getter is outside the finite T31 consumer')
      },
      [],
      log,
    )
    const core = new CoreClient(() => ({ port, token }), log, true, HTTP_TIMEOUT_MS)
    let remoteAccesses = 0
    const nativeRemote = inertSessionRemotes(() => { remoteAccesses += 1 })

    let nativeSession: NativeSession | undefined
    let pending: ReturnType<NativeSession['beginSubmission']> | undefined
    let caseId = ''
    let requestId = ''
    let materialId = ''
    let materialSha = ''
    let taskId = ''
    let elapsedSeconds = 0
    let persistentPaths: string[] = []
    let persistentBeforeFinal: FileSnapshot[] | undefined

    try {
      const health = asRecord(await requestJson({
        method: 'GET',
        port,
        path: '/health',
        headers: { authorization: `Bearer ${token}` },
        timeoutMs: HTTP_TIMEOUT_MS,
      }))
      expect(health).toMatchObject({ status: 'ok', contract_version: '1.6' })

      const opened = apiOk(
        await remote.callApi(apiRoute('caseOpen'), { path: casePath }),
        'caseOpen',
      )
      caseId = asString(opened.case_id, 'case_id')
      expect(opened).toMatchObject({ created: true, kind: null })
      expect(opened.folders_created).toEqual(expect.any(Array))

      const imported = apiOk(
        await remote.callApi(apiRoute('materialsImport'), {
          case_id: caseId,
          paths: [scopeSource],
          target: null,
          unzip: false,
          mode: 'copy',
        }),
        'materialsImport',
      )
      expect(imported.skipped).toEqual([])
      expect(imported.copied).toHaveLength(3)

      const listed = apiOk(
        await remote.callApi(apiRoute('materialsList'), { case_id: caseId }),
        'materialsList',
      )
      const materialRows = asArray(listed.materials).map(asRecord)
      expect(materialRows).toHaveLength(3)
      expect(materialRows.map((row) => asString(row.name, 'material name')).sort()).toEqual([
        'scope-in',
        'scope-out',
        'scope-third',
      ])
      const scopeInRows = materialRows.filter((row) => row.name === 'scope-in')
      expect(scopeInRows).toHaveLength(1)
      const scopeIn = scopeInRows[0]!
      materialId = asString(scopeIn.material_id, 'scope-in material_id')
      const materialRelPath = asString(scopeIn.rel_path, 'scope-in rel_path')

      expect((await optionalDirectoryNames(join(casePath, '工作区', '任务'))) ?? []).toEqual([])

      nativeSession = new NativeSession(SESSION_ID, nativeRemote)
      pending = nativeSession.beginSubmission({
        mode: 'queue',
        text: 'T31 finite scoped HTTP consumer',
        attachments: [],
      })
      requestId = pending.requestId
      expect(requestId).toMatch(UUID_V4)
      expect(nativeSession.sessionId).toBe(SESSION_ID)
      expect(nativeSession.getSnapshot().pendingSubmissions).toHaveLength(1)
      expect(remoteAccesses).toBe(0)

      const scopeRequest = {
        action: 'prepare',
        case_id: caseId,
        session_id: SESSION_ID,
        request_id: requestId,
        material_ids: [materialId],
      }
      const preparedFirst = apiOk(
        await remote.callApi(apiRoute('requestScope'), scopeRequest),
        'requestScope prepare first',
      )
      const preparedSecond = apiOk(
        await remote.callApi(apiRoute('requestScope'), scopeRequest),
        'requestScope prepare replay',
      )
      const preparedValue = {
        action: 'prepare',
        request_id: requestId,
        case_id: caseId,
        session_id: SESSION_ID,
        material_ids: [materialId],
      }
      expect(preparedFirst).toEqual(preparedValue)
      expect(preparedSecond).toEqual(preparedFirst)

      const taskStartedAt = Date.now()
      const beginRequest = {
        session_id: SESSION_ID,
        cwd: casePath,
        request_id: requestId,
      }
      const begunFirst = coreOk(await core.call<JsonRecord>('task/begin', beginRequest), 'task/begin first')
      const begunSecond = coreOk(await core.call<JsonRecord>('task/begin', beginRequest), 'task/begin replay')
      expect(begunSecond).toEqual(begunFirst)
      taskId = asString(begunFirst.task_id, 'task_id')
      expect(taskId).toMatch(TASK_ID)
      expect(begunFirst).toMatchObject({
        case_id: caseId,
        request_id: requestId,
        route: 'local',
        skill: null,
      })
      const requestScope = asRecord(begunFirst.request_scope)
      expect(requestScope).toMatchObject({
        request_id: requestId,
        case_id: caseId,
        kind: 'materials',
      })
      const scopedMaterials = asArray(requestScope.materials).map(asRecord)
      expect(scopedMaterials).toHaveLength(1)
      expect(scopedMaterials[0]?.material_id).toBe(materialId)
      materialSha = asString(scopedMaterials[0]?.sha256, 'scope-in sha256')
      expect(materialSha).toMatch(/^[0-9a-f]{64}$/)
      expect(begunFirst.request_scope).toEqual({
        request_id: requestId,
        case_id: caseId,
        kind: 'materials',
        materials: [{ material_id: materialId, sha256: materialSha }],
      })
      expect((await readdir(join(casePath, '工作区', '任务'))).sort()).toEqual([taskId])

      const indexPath = join(casePath, '工作区', '材料', 'index.json')
      const materialIndexSnapshot = await capturePlainFile(indexPath)
      const materialIndex = parseJson(materialIndexSnapshot.bytes)
      const indexedRows = asArray(materialIndex.materials).map(asRecord)
      const indexedScopeRows = indexedRows.filter((row) => row.material_id === materialId)
      expect(indexedScopeRows).toHaveLength(1)
      const indexedScope = indexedScopeRows[0]!
      expect(indexedScope).toMatchObject({
        material_id: materialId,
        name: 'scope-in',
        rel_path: materialRelPath,
        sha256: materialSha,
      })
      const materialCopyPath = insideCase(casePath, materialRelPath)
      const materialCopySnapshot = await capturePlainFile(materialCopyPath)
      expect(materialCopySnapshot.sha256).toBe(materialSha)
      expect(materialCopySnapshot.bytes.toString('utf8')).toBe(SCOPE_FILES[0][1])
      expect(materialCopySnapshot.sha256).toBe(scopeSourceBefore.get('scope-in.txt')?.sha256)

      const contextValue = coreOk(
        await core.call<JsonRecord>('context', { task_id: taskId }),
        'context',
      )
      const l0 = asRecord(contextValue.l0)
      const l1 = asRecord(contextValue.l1)
      const contextText = `${asString(l0.text, 'l0.text')}\n${asString(l1.text, 'l1.text')}`
      for (const forbidden of FORBIDDEN_EXTERNAL_CONTEXT) {
        expect(contextText).not.toContain(forbidden)
      }

      const listedTools = coreOk(
        await core.call<JsonRecord>('tool', {
          task_id: taskId,
          tool: 'case_list_materials',
          args: {},
        }),
        'case_list_materials',
      )
      expect(validate(toolId('case_list_materials'), 'result', listedTools)).toEqual([])
      expect(listedTools.total).toBe(1)
      const toolRows = asArray(listedTools.materials).map(asRecord)
      expect(toolRows).toHaveLength(1)
      expect(toolRows[0]).toMatchObject({ material_id: materialId, name: 'scope-in' })

      const readIn = coreOk(
        await core.call<JsonRecord>('tool', {
          task_id: taskId,
          tool: 'case_read_material',
          args: { name: 'scope-in' },
        }),
        'case_read_material scope-in',
      )
      expect(validate(toolId('case_read_material'), 'result', readIn)).toEqual([])
      expect(readIn).toMatchObject({ name: 'scope-in', material_id: materialId })
      expect(asString(readIn.text, 'scope-in text')).toContain('T31_SHARED 内部唯一正文')

      const searched = coreOk(
        await core.call<JsonRecord>('tool', {
          task_id: taskId,
          tool: 'case_search',
          args: { query: 'T31_SHARED' },
        }),
        'case_search',
      )
      expect(validate(toolId('case_search'), 'result', searched)).toEqual([])
      const hits = asArray(searched.hits).map(asRecord)
      expect(hits).toHaveLength(1)
      expect(hits.every((hit) => hit.material_id === materialId && hit.name === 'scope-in')).toBe(true)
      expect(searched.total).toBe(hits.length)
      for (const forbidden of FORBIDDEN_EXTERNAL_CONTEXT) {
        expect(JSON.stringify(searched)).not.toContain(forbidden)
      }

      const readOut = await core.call<JsonRecord>('tool', {
        task_id: taskId,
        tool: 'case_read_material',
        args: { name: 'scope-out' },
      })
      expect(readOut).toEqual({
        ok: false,
        error: {
          code: 'MATERIAL_NOT_FOUND',
          message: '没有这份材料，请先查看材料清单',
        },
      })
      expect(validate('lawbench://contracts/common.schema.json', 'fail', readOut)).toEqual([])
      for (const forbidden of FORBIDDEN_EXTERNAL_CONTEXT) {
        expect(JSON.stringify(readOut)).not.toContain(forbidden)
      }

      elapsedSeconds = Math.floor((Date.now() - taskStartedAt) / 1000)
      expect(elapsedSeconds).toBeGreaterThanOrEqual(0)
      expect(elapsedSeconds).toBeLessThanOrEqual(120)
      const ended = coreOk(
        await core.call<JsonRecord>('task/end', {
          task_id: taskId,
          reason: 'aborted',
          model_calls: 0,
          tool_calls: 4,
          elapsed_s: elapsedSeconds,
        }),
        'task/end',
      )
      expect(ended).toEqual({ status: 'cancelled' })

      const taskBase = join(casePath, '工作区', '任务')
      expect((await readdir(taskBase)).sort()).toEqual([taskId])
      const taskDir = join(taskBase, taskId)
      const taskDirInfo = await lstat(taskDir)
      expect(taskDirInfo.isDirectory()).toBe(true)
      expect(taskDirInfo.isSymbolicLink()).toBe(false)
      const taskFiles = (await readdir(taskDir)).sort()
      expect(taskFiles).toEqual(['reads.json', 'result.json', 'task.json'])

      const taskPath = join(taskDir, 'task.json')
      const resultPath = join(taskDir, 'result.json')
      const readsPath = join(taskDir, 'reads.json')
      const storePath = join(appDataPath, 'request-scopes.json')
      const task = await readJson(taskPath)
      const result = await readJson(resultPath)
      const reads = await readJson(readsPath)
      const store = await readJson(storePath)

      const expectedScope = {
        request_id: requestId,
        case_id: caseId,
        kind: 'materials',
        materials: [{ material_id: materialId, sha256: materialSha }],
      }
      expect(task).toMatchObject({
        task_id: taskId,
        case_id: caseId,
        session_id: SESSION_ID,
        kind: 'agent',
        route: 'local',
        skill: null,
        state: 'finished',
        request_id: requestId,
        request_scope: expectedScope,
      })
      expect(result).toMatchObject({
        task_id: taskId,
        status: 'cancelled',
        usage: { model_calls: 0, tool_calls: 4, elapsed_s: elapsedSeconds },
        drafts: [],
        citations: [],
      })
      expect(result.finished_at).toEqual(expect.any(String))
      expect(result.coverage).toMatchObject({
        total: 1,
        fully_read: ['scope-in'],
        partially_read: [],
        not_read: [],
        unreadable: [],
      })
      expect(reads).toMatchObject({ v: 1, task_id: taskId })
      const readRows = asArray(reads.reads).map(asRecord)
      expect(readRows).toHaveLength(1)
      expect(readRows[0]).toMatchObject({
        material_id: materialId,
        material_version: materialSha,
      })
      expect(readRows[0]?.at).toEqual(expect.any(String))

      expect(store.v).toBe(1)
      const records = asRecord(store.records)
      expect(Object.keys(records)).toEqual([requestId])
      const persistedScope = asRecord(records[requestId])
      expect(Object.keys(persistedScope).sort()).toEqual([
        'case_id',
        'materials',
        'session_id',
        'state',
        'task_id',
        'updated_at',
      ])
      expect(persistedScope).toMatchObject({
        case_id: caseId,
        session_id: SESSION_ID,
        state: 'claimed',
        materials: [{ material_id: materialId, sha256: materialSha }],
        task_id: taskId,
      })
      expect(persistedScope.updated_at).toEqual(expect.any(String))

      persistentPaths = [
        taskPath,
        resultPath,
        readsPath,
        storePath,
        indexPath,
        materialCopyPath,
      ]
      persistentBeforeFinal = await captureFiles(persistentPaths)
      expect(credentialGetterCalls).toBe(0)
    } finally {
      pending?.abandon()
      if (nativeSession !== undefined) await nativeSession.dispose()
    }

    expect(remoteAccesses).toBe(0)
    expect(credentialGetterCalls).toBe(0)
    if (persistentBeforeFinal === undefined) throw new Error('persistent task evidence was not captured')

    const final = await waitForJson(join(root, 'final-metadata.json'), FINAL_TIMEOUT_MS)
    expect(final).toMatchObject({
      outcome: 'COMPLETED_FOR_ROOT_REVIEW',
      failure_code: null,
      source_unchanged: true,
      fixture_source_unchanged: true,
      fixture_copy_unchanged: true,
      scope_source_unchanged: true,
      listener: {
        host: '127.0.0.1',
        requested_port: port,
        actual_port: port,
        ipv4_only: true,
        websocket: false,
        forward_listener: false,
      },
      native_app: {
        lifespan: 'off',
        routes_contracts: 'native',
        materials_registry_gate: 'native',
      },
      credentials: {
        local_getter_calls: 0,
        external_getter_calls: 0,
        keyring_rejections: 0,
      },
      lifecycle: {
        ocr_threads: 0,
        ocr_start_called: false,
        ocr_stop_called: false,
        retainer_process_started: false,
        retainer_close_called: false,
        product_lifespan_started: false,
      },
      cleanup: {
        server_should_exit: true,
        server_task_done: true,
        listener_closed: true,
        net_client_closed: true,
        product_logs_closed: true,
        root_retained: true,
      },
    })
    expect(final.fixture_copy).toMatchObject({
      bytes: 47_379,
      sha256: 'feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad',
    })

    const guard = asRecord(final.guard)
    expect(guard.violations).toEqual([])
    expect(guard.unexpected_outbound_violations).toBe(0)
    const guardCounts = asRecord(guard.counts)
    for (const name of [
      'keyring',
      'keyring_access',
      'socket.connect',
      'socket.connect_ex',
      'socket.create_connection',
      'httpx_mock_transport',
    ]) {
      expect(guardCounts[name] ?? 0).toBe(0)
    }

    const protocol = asRecord(final.protocol)
    expect(protocol).toMatchObject({
      phase: 'done',
      protocol_complete: true,
      failure_code: null,
      auth_denials: 0,
      policy_denials: {},
      case_bound: true,
      case_id: caseId,
      case_open_attempts: 1,
      import_attempts: 1,
      material_list_attempts: 1,
      material_list_ok: 1,
      material_count: 3,
      scope_in_material_id: materialId,
      scope_in_sha256: materialSha,
      request_id: requestId,
      scope_prepare_attempts: 2,
      scope_prepare_ok: 2,
      begin_attempts: 2,
      begin_ok: 1,
      task_id: taskId,
      context_attempts: 1,
      context_ok: 1,
      tool_attempts: 4,
      tool_ok: 4,
      scope_out_native_denial: true,
      scope_authority_verified: true,
      material_current_hash_verified: true,
      task_file_identity_verified: true,
      reads_identity_verified: true,
      task_end_attempts: 1,
      task_end_ok: true,
      task_status: 'cancelled',
    })
    expect(protocol.tools).toEqual([
      {
        ordinal: 1,
        tool: 'case_list_materials',
        http_status: 200,
        business_ok: true,
        native_error_code: null,
        positive_native: true,
        expected_native_denial: false,
      },
      {
        ordinal: 2,
        tool: 'case_read_material',
        http_status: 200,
        business_ok: true,
        native_error_code: null,
        positive_native: true,
        expected_native_denial: false,
      },
      {
        ordinal: 3,
        tool: 'case_search',
        http_status: 200,
        business_ok: true,
        native_error_code: null,
        positive_native: true,
        expected_native_denial: false,
      },
      {
        ordinal: 4,
        tool: 'case_read_material',
        http_status: 200,
        business_ok: false,
        native_error_code: 'MATERIAL_NOT_FOUND',
        positive_native: false,
        expected_native_denial: true,
      },
    ])

    const expectedRequests = [
      ['GET', '/health', 200, 'native_app'],
      ['POST', '/api/case/open', 200, 'native_app'],
      ['POST', '/api/materials/import', 200, 'native_app'],
      ['GET', '/api/materials', 200, 'native_app'],
      ['POST', '/api/request/scope', 200, 'native_app'],
      ['POST', '/api/request/scope', 200, 'native_app'],
      ['POST', '/core/task/begin', 200, 'native_app'],
      ['POST', '/core/task/begin', 200, 'native_app'],
      ['POST', '/core/context', 200, 'native_app'],
      ['POST', '/core/tool', 200, 'native_app'],
      ['POST', '/core/tool', 200, 'native_app'],
      ['POST', '/core/tool', 200, 'native_app'],
      ['POST', '/core/tool', 200, 'native_app'],
      ['POST', '/core/task/end', 200, 'native_app'],
    ]
    const finalRequests = asArray(final.requests).map(asRecord)
    expect(finalRequests.map((request) => [
      request.method,
      request.path,
      request.status,
      request.disposition,
    ])).toEqual(expectedRequests)

    const ledgerText = await readFile(join(root, 'requests.ndjson'), 'utf8')
    const ledgerEntries = ledgerText.trim().split(/\r?\n/).filter(Boolean).map((line) => asRecord(JSON.parse(line)))
    for (const entry of ledgerEntries) {
      expect(Object.keys(entry).sort()).toEqual(['disposition', 'elapsed_ms', 'method', 'path', 'status'])
    }
    expect(ledgerEntries).toEqual(finalRequests)
    for (const forbidden of [
      token,
      'T31_SHARED',
      '内部唯一正文',
      '外部唯一正文',
      '第三份合成正文',
      'scope-in',
      'scope-out',
      'scope-third',
    ]) {
      expect(ledgerText).not.toContain(forbidden)
    }

    const serviceLog = await readFile(join(appDataPath, 'logs', 'service.log'), 'utf8')
    for (const forbidden of [
      token,
      'T31_SHARED',
      '内部唯一正文',
      '外部唯一正文',
      '第三份合成正文',
      'scope-in',
      'scope-out',
      'scope-third',
    ]) {
      expect(serviceLog).not.toContain(forbidden)
    }
    const finalText = JSON.stringify(final)
    for (const forbidden of [
      token,
      'T31_SHARED',
      '内部唯一正文',
      '外部唯一正文',
      '第三份合成正文',
    ]) {
      expect(finalText).not.toContain(forbidden)
    }

    const scopeSourceAfter = await captureScopeSources(scopeSource)
    for (const [name] of SCOPE_FILES) {
      expect(scopeSourceAfter.get(name)).toEqual(scopeSourceBefore.get(name))
    }
    const persistentAfterFinal = await captureFiles(persistentPaths)
    expect(persistentAfterFinal).toEqual(persistentBeforeFinal)

    const loop = await waitForJson(join(root, 'loop-closed.json'), LOOP_TIMEOUT_MS)
    expect(loop).toMatchObject({
      event_loop_closed: true,
      final_metadata_written: true,
    })
  }, 75_000)
})
