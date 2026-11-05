import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { CoreClient } from '../shared/core-client.ts'

const RUNS_DIR = 'D:/Lawbeach/lawbench-B/docs/plan/evidence/T32/NativeDraftEntry-20261025-165327/runs'
const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const DRAFT_TITLE = 'T32SyntheticDraft'
const DRAFT_V1 = '# T32 synthetic draft\n\nSynthetic local document only.\n'
const DRAFT_V2 = '# T32 synthetic draft\n\nSynthetic revision for local UI save.\n'
const DRAFT_V1_SHA256 = 'cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae'
const DRAFT_V2_SHA256 = '7d090ef6fbda9e38b17f1befe5e1c4a2bb8f6db2c2bf45031eb70e52e19a22cc'
const HEALTHY_TIMEOUT_MS = 25_000
const LOOP_TIMEOUT_MS = 5_000

type JsonRecord = Record<string, unknown>
type Logged = { level: 'info' | 'warn' | 'error'; event: string; meta?: JsonRecord }
type RawReply = { status: number; payload: JsonRecord }

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') throw new Error(`required environment variable is absent: ${name}`)
  return value
}

function requiredRoot(): string {
  const raw = requiredEnv('LB_NATIVE_DRAFT_ROOT')
  if (!isAbsolute(raw)) throw new Error('LB_NATIVE_DRAFT_ROOT must be absolute')
  const root = resolve(raw)
  if (dirname(root).toLowerCase() !== resolve(RUNS_DIR).toLowerCase()) {
    throw new Error('LB_NATIVE_DRAFT_ROOT must be a direct child of the T32 NativeDraftEntry runs directory')
  }
  return root
}

function requiredPort(): number {
  const raw = requiredEnv('LB_NATIVE_DRAFT_PORT')
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error('LB_NATIVE_DRAFT_PORT must be an integer')
  const port = Number(raw)
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error('LB_NATIVE_DRAFT_PORT must be in 1..65535')
  }
  return port
}

async function rawRequest(
  port: number,
  token: string,
  method: string,
  path: string,
  body: JsonRecord,
): Promise<RawReply> {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  })
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`non-JSON response from ${path}`)
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`non-object response from ${path}`)
  }
  return { status: response.status, payload: payload as JsonRecord }
}

function asRecord(value: unknown): JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('expected an object')
  }
  return value as JsonRecord
}

async function readJson(path: string): Promise<JsonRecord> {
  return asRecord(JSON.parse(await readFile(path, 'utf8')))
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

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

async function expectPlainSmallFile(path: string, limit: number): Promise<void> {
  const info = await lstat(path)
  expect(info.isFile()).toBe(true)
  expect(info.isSymbolicLink()).toBe(false)
  expect(info.nlink).toBe(1)
  expect(info.size).toBeLessThanOrEqual(limit)
}

async function expectAbsent(path: string): Promise<void> {
  let found = true
  try {
    await lstat(path)
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') throw error
    found = false
  }
  expect(found).toBe(false)
}

describe('T32 native CoreClient and Markdown lifecycle', () => {
  it('uses the actual source consumer for one claimed native draft and UI save', async () => {
    const root = requiredRoot()
    const port = requiredPort()
    const token = requiredEnv('LB_NATIVE_DRAFT_TOKEN')
    const casePath = join(root, 'case')
    const logs: Logged[] = []
    const client = new CoreClient(
      () => ({ port, token }),
      (level, event, meta) => logs.push(meta === undefined ? { level, event } : { level, event, meta }),
      true,
      5_000,
    )

    const rootInfo = await lstat(root)
    expect(rootInfo.isDirectory()).toBe(true)
    expect(rootInfo.isSymbolicLink()).toBe(false)
    const forbiddenArtifacts = ['fixtures', 'index', 'result', 'history', 'rollout']
    for (const base of [root, casePath]) {
      for (const name of forbiddenArtifacts) await expectAbsent(join(base, name))
    }

    const opened = await rawRequest(port, token, 'POST', '/api/case/open', { path: casePath })
    expect(opened.status).toBe(200)
    expect(opened.payload.ok).toBe(true)
    const openedValue = asRecord(opened.payload.value)
    expect(typeof openedValue.case_id).toBe('string')
    const caseId = openedValue.case_id as string
    expect(caseId.length).toBeGreaterThan(0)

    const begun = await client.call<JsonRecord>('task/begin', { session_id: SESSION_ID, cwd: casePath })
    expect(begun.ok).toBe(true)
    if (!begun.ok) throw new Error('native task/begin did not return the contract success shape')
    const begunValue = asRecord(begun.value)
    expect(typeof begunValue.task_id).toBe('string')
    const taskId = begunValue.task_id as string
    expect(taskId).toMatch(/^T-[0-9]{14}-[0-9a-f]{4}$/)
    expect(begunValue).toMatchObject({
      case_id: caseId,
      route: 'local',
      skill: null,
    })
    expect(asRecord(begunValue.params)).toEqual(expect.any(Object))
    expect(asRecord(begunValue.budget)).toEqual(expect.any(Object))

    const draftArgs = { title: DRAFT_TITLE, content: DRAFT_V1 }
    const draftBody = { task_id: taskId, tool: 'case_save_draft', args: draftArgs }
    const wrongTool = await rawRequest(port, token, 'POST', '/core/tool', {
      task_id: taskId,
      tool: 'case_search',
      args: {},
    })
    expect(wrongTool.status).toBe(403)
    const wrongDraftArgs = await rawRequest(port, token, 'POST', '/core/tool', {
      task_id: taskId,
      tool: 'case_save_draft',
      args: { title: 'WrongTitle', content: DRAFT_V1 },
    })
    expect(wrongDraftArgs.status).toBe(403)

    const drafted = await client.call<JsonRecord>('tool', draftBody)
    expect(drafted.ok).toBe(true)
    if (!drafted.ok) throw new Error('native case_save_draft did not return the contract success shape')
    const draftedValue = asRecord(drafted.value)
    const v1Relative = `工作区/任务/${taskId}/草稿/${DRAFT_TITLE}-v1.md`
    const v2Relative = `工作区/任务/${taskId}/草稿/${DRAFT_TITLE}-v2.md`
    const emptyCoverage = {
      total: 0,
      fully_read: [],
      partially_read: [],
      not_read: [],
      unreadable: [],
    }
    expect(draftedValue).toMatchObject({
      path: v1Relative,
      version: 1,
      citation_check: {
        passed: true,
        problems: [],
        stats: { citations: 0, must_fix: 0, hints: 0 },
      },
      coverage: emptyCoverage,
    })

    const taskBase = join(casePath, '工作区', '任务')
    const taskDir = join(taskBase, taskId)
    const draftDir = join(taskDir, '草稿')
    const v1Path = join(draftDir, `${DRAFT_TITLE}-v1.md`)
    const v2Path = join(draftDir, `${DRAFT_TITLE}-v2.md`)
    await expectPlainSmallFile(v1Path, 4 * 1024)
    const v1Bytes = await readFile(v1Path)
    expect(v1Bytes.length).toBe(54)
    expect(sha256(v1Bytes)).toBe(DRAFT_V1_SHA256)
    const resultAfterTool = await readJson(join(taskDir, 'result.json'))
    expect(resultAfterTool).toMatchObject({
      task_id: taskId,
      status: 'running',
      drafts: [{ title: DRAFT_TITLE, path: v1Relative, version: 1 }],
      citations: [],
      citation_check: {
        passed: true,
        problems: [],
        stats: { citations: 0, must_fix: 0, hints: 0 },
      },
      coverage: emptyCoverage,
    })

    const duplicateTool = await rawRequest(port, token, 'POST', '/core/tool', draftBody)
    expect(duplicateTool.status).toBe(403)

    const documentBody = { case_id: caseId, path: v1Relative, content: DRAFT_V2 }
    const saveBeforeEnd = await rawRequest(port, token, 'POST', '/api/documents/save', documentBody)
    expect(saveBeforeEnd.status).toBe(403)

    const ended = await client.call<JsonRecord>('task/end', {
      task_id: taskId,
      reason: 'aborted',
      model_calls: 0,
      tool_calls: 1,
      elapsed_s: 0,
    })
    expect(ended).toEqual({ ok: true, value: { status: 'cancelled' } })

    const wrongSource = await rawRequest(port, token, 'POST', '/api/documents/save', {
      case_id: caseId,
      path: v1Relative.replace(/-v1\.md$/, '-v0.md'),
      content: DRAFT_V2,
    })
    expect(wrongSource.status).toBe(403)
    const saved = await rawRequest(port, token, 'POST', '/api/documents/save', documentBody)
    expect(saved.status).toBe(200)
    expect(saved.payload.ok).toBe(true)
    expect(asRecord(saved.payload.value)).toMatchObject({
      task_id: taskId,
      path: v2Relative,
      version: 2,
      citation_check: {
        passed: true,
        problems: [],
        stats: { citations: 0, must_fix: 0, hints: 0 },
      },
      coverage: emptyCoverage,
      not_fully_read: [],
    })
    const duplicateSave = await rawRequest(port, token, 'POST', '/api/documents/save', documentBody)
    expect(duplicateSave.status).toBe(403)

    const forbiddenSettings = await rawRequest(port, token, 'PUT', '/api/settings', {})
    expect(forbiddenSettings.status).toBe(403)
    const forbiddenProgress = await rawRequest(port, token, 'POST', '/core/progress', {})
    expect(forbiddenProgress.status).toBe(403)

    const taskFolders = await readdir(taskBase)
    expect(taskFolders).toEqual([taskId])
    const taskFiles = (await readdir(taskDir)).sort()
    expect(taskFiles).toEqual(['reads.json', 'result.json', 'task.json', '草稿'])
    for (const name of taskFiles.filter((item) => item !== '草稿')) {
      await expectPlainSmallFile(join(taskDir, name), 64 * 1024)
    }
    const draftInfo = await lstat(draftDir)
    expect(draftInfo.isDirectory()).toBe(true)
    expect(draftInfo.isSymbolicLink()).toBe(false)
    const draftFiles = (await readdir(draftDir)).sort()
    expect(draftFiles).toEqual([`${DRAFT_TITLE}-v1.md`, `${DRAFT_TITLE}-v2.md`])
    await expectPlainSmallFile(v1Path, 4 * 1024)
    await expectPlainSmallFile(v2Path, 4 * 1024)
    const v1AfterSave = await readFile(v1Path)
    const v2AfterSave = await readFile(v2Path)
    expect(v1AfterSave.equals(v1Bytes)).toBe(true)
    expect(v1AfterSave.length).toBe(54)
    expect(sha256(v1AfterSave)).toBe(DRAFT_V1_SHA256)
    expect(v2AfterSave.length).toBe(61)
    expect(sha256(v2AfterSave)).toBe(DRAFT_V2_SHA256)

    const task = await readJson(join(taskDir, 'task.json'))
    expect(task).toMatchObject({
      task_id: taskId,
      case_id: caseId,
      session_id: SESSION_ID,
      kind: 'agent',
      route: 'local',
      skill: null,
      state: 'finished',
    })
    const result = await readJson(join(taskDir, 'result.json'))
    expect(result).toMatchObject({
      task_id: taskId,
      status: 'cancelled',
      usage: { model_calls: 0, tool_calls: 1, elapsed_s: 0 },
      drafts: [
        { title: DRAFT_TITLE, path: v1Relative, version: 1 },
        { title: DRAFT_TITLE, path: v2Relative, version: 2 },
      ],
      citations: [],
    })
    expect(await readJson(join(taskDir, 'reads.json'))).toMatchObject({ task_id: taskId, reads: [] })
    for (const base of [root, casePath]) {
      for (const name of forbiddenArtifacts) await expectAbsent(join(base, name))
    }

    const ledgerText = await readFile(join(root, 'requests.ndjson'), 'utf8')
    expect(ledgerText.includes(token)).toBe(false)
    const ledgerEntries = ledgerText
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => asRecord(JSON.parse(line)))
    for (const entry of ledgerEntries) {
      expect(Object.keys(entry).sort()).toEqual(['disposition', 'elapsed_ms', 'method', 'path', 'status'])
    }
    const forwarded = ledgerEntries.filter((entry) => entry.status === 200)
    expect(forwarded.map((entry) => entry.path)).toEqual([
      '/api/case/open',
      '/core/task/begin',
      '/core/tool',
      '/core/task/end',
      '/api/documents/save',
    ])
    expect(forwarded.every((entry) => entry.disposition === 'native_app')).toBe(true)
    const guarded = ledgerEntries.filter((entry) => entry.status !== 200)
    expect(guarded.length).toBeGreaterThan(0)
    expect(guarded.every((entry) => entry.status === 403)).toBe(true)
    expect(guarded.every((entry) => entry.disposition !== 'native_app')).toBe(true)

    const contractErrors = logs.filter(
      (entry) => entry.event === 'core.request_contract' || entry.event === 'core.response_contract',
    )
    expect(contractErrors).toEqual([])
    const coreCalls = logs.filter((entry) => entry.event === 'core.call')
    expect(coreCalls.map((entry) => entry.meta?.command)).toEqual(['task/begin', 'tool', 'task/end'])
    expect(coreCalls.every((entry) => entry.meta?.status === 200)).toBe(true)
    expect(JSON.stringify(logs).includes(token)).toBe(false)

    const final = await waitForJson(join(root, 'final-metadata.json'), HEALTHY_TIMEOUT_MS)
    expect(final).toMatchObject({
      outcome: 'COMPLETED_FOR_ROOT_REVIEW',
      source_unchanged: true,
      fixture_source_unchanged: true,
    })
    expect(final.credentials).toEqual({
      local_getter_calls: 0,
      external_getter_calls: 0,
      keyring_rejections: 0,
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
    expect(final.lifecycle).toEqual({
      ocr_threads: 0,
      ocr_start_called: false,
      ocr_stop_called: false,
      retainer_process_started: false,
      retainer_close_called: false,
      product_lifespan_started: false,
    })
    expect(final.listener).toMatchObject({
      host: '127.0.0.1',
      requested_port: port,
      actual_port: port,
      ipv4_only: true,
      websocket: false,
      forward_listener: false,
    })
    expect(final.cleanup).toMatchObject({
      server_should_exit: true,
      server_task_done: true,
      listener_closed: true,
      net_client_closed: true,
      product_logs_closed: true,
      root_retained: true,
    })
    const loop = await waitForJson(join(root, 'loop-closed.json'), LOOP_TIMEOUT_MS)
    expect(loop).toMatchObject({
      event_loop_closed: true,
      final_metadata_written: true,
    })
  }, 40_000)
})
