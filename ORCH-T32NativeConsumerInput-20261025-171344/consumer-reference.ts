import { lstat, readdir, readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../shared/core-client.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = 'D:/Lawbeach/lawbench-B'
const PREP_DIR = join(REPO_ROOT, 'docs', 'plan', 'evidence', 'T34', 'CoreHttpEntry-20261025-163357')
const RUNS_DIR = join(PREP_DIR, 'runs')
const SESSION_ID = '11111111-1111-4111-8111-111111111111'
const HEALTHY_TIMEOUT_MS = 25_000

type JsonRecord = Record<string, unknown>
type Logged = { level: 'info' | 'warn' | 'error'; event: string; meta?: JsonRecord }
type RawReply = { status: number; payload: JsonRecord }

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') throw new Error(`required environment variable is absent: ${name}`)
  return value
}

function requiredRoot(): string {
  const raw = requiredEnv('LB_NATIVE_TEST_ROOT')
  if (!isAbsolute(raw)) throw new Error('LB_NATIVE_TEST_ROOT must be absolute')
  const root = resolve(raw)
  const rel = relative(RUNS_DIR, root)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('LB_NATIVE_TEST_ROOT must be inside this preparation runs directory')
  }
  return root
}

function requiredPort(): number {
  const raw = requiredEnv('LB_NATIVE_TEST_PORT')
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error('LB_NATIVE_TEST_PORT must be an integer')
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('LB_NATIVE_TEST_PORT must be in 1..65535')
  }
  return port
}

async function rawRequest(port: number, token: string, method: string, path: string, body: JsonRecord): Promise<RawReply> {
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

async function readJson(path: string): Promise<JsonRecord> {
  const value = JSON.parse(await readFile(path, 'utf8'))
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`non-object JSON: ${path}`)
  return value as JsonRecord
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

describe('T34 native CoreClient HTTP entry', () => {
  it('crosses the preparer-owned server once per case/begin/end boundary', async () => {
    const root = requiredRoot()
    const port = requiredPort()
    const token = requiredEnv('LB_NATIVE_TEST_TOKEN')
    const casePath = join(root, 'case')
    const logs: Logged[] = []
    const client = new CoreClient(
      () => ({ port, token }),
      (level, event, meta) => logs.push({ level, event, meta }),
      true,
      5_000,
    )

    const opened = await rawRequest(port, token, 'POST', '/api/case/open', { path: casePath })
    expect(opened.status).toBe(200)
    expect(opened.payload.ok).toBe(true)
    const openedValue = opened.payload.value as JsonRecord
    expect(typeof openedValue?.case_id).toBe('string')
    const caseId = openedValue.case_id as string
    expect(caseId.length).toBeGreaterThan(0)

    const badCwd = await rawRequest(port, token, 'POST', '/core/task/begin', {
      session_id: SESSION_ID,
      cwd: join(casePath, 'outside'),
    })
    expect(badCwd.status).toBe(403)

    const begun = await client.call<JsonRecord>('task/begin', { session_id: SESSION_ID, cwd: casePath })
    expect(begun.ok).toBe(true)
    if (!begun.ok) throw new Error('native task/begin did not return the contract success shape')
    const taskId = begun.value.task_id as string
    expect(taskId).toMatch(/^T-[0-9]{14}-[0-9a-f]{4}$/)
    expect(begun.value.case_id).toBe(caseId)
    expect(begun.value.route).toBe('local')
    expect(begun.value.skill).toBeNull()
    expect(begun.value.params).toEqual(expect.any(Object))
    expect(begun.value.budget).toEqual(expect.any(Object))

    const duplicateBegin = await rawRequest(port, token, 'POST', '/core/task/begin', {
      session_id: SESSION_ID,
      cwd: casePath,
    })
    expect(duplicateBegin.status).toBe(403)

    const wrongEnd = await rawRequest(port, token, 'POST', '/core/task/end', {
      task_id: 'T-20000101000000-0000',
      reason: 'aborted',
      model_calls: 0,
      tool_calls: 0,
      elapsed_s: 0,
    })
    expect(wrongEnd.status).toBe(403)

    const ended = await client.call<JsonRecord>('task/end', {
      task_id: taskId,
      reason: 'aborted',
      model_calls: 0,
      tool_calls: 0,
      elapsed_s: 0,
    })
    expect(ended).toEqual({ ok: true, value: { status: 'cancelled' } })

    const duplicateEnd = await rawRequest(port, token, 'POST', '/core/task/end', {
      task_id: taskId,
      reason: 'aborted',
      model_calls: 0,
      tool_calls: 0,
      elapsed_s: 0,
    })
    expect(duplicateEnd.status).toBe(403)

    const forbiddenTool = await rawRequest(port, token, 'POST', '/core/tool', {})
    expect(forbiddenTool.status).toBe(403)
    const forbiddenSettings = await rawRequest(port, token, 'PUT', '/api/settings', {})
    expect(forbiddenSettings.status).toBe(403)

    const contractErrors = logs.filter(
      (entry) => entry.event === 'core.request_contract' || entry.event === 'core.response_contract',
    )
    expect(contractErrors).toEqual([])

    const taskBase = join(casePath, '工作区', '任务')
    const taskFolders = await readdir(taskBase)
    expect(taskFolders).toEqual([taskId])
    const taskDir = join(taskBase, taskId)
    const taskFiles = (await readdir(taskDir)).sort()
    expect(taskFiles).toEqual(['reads.json', 'result.json', 'task.json'])
    for (const name of taskFiles) {
      const info = await lstat(join(taskDir, name))
      expect(info.isFile()).toBe(true)
      expect(info.isSymbolicLink()).toBe(false)
      expect(info.nlink).toBe(1)
      expect(info.size).toBeLessThanOrEqual(64 * 1024)
    }
    const task = await readJson(join(taskDir, 'task.json'))
    expect(task).toMatchObject({
      task_id: taskId,
      case_id: caseId,
      session_id: SESSION_ID,
      kind: 'agent',
      route: 'local',
      skill: null,
    })
    const result = await readJson(join(taskDir, 'result.json'))
    expect(result).toMatchObject({
      task_id: taskId,
      status: 'cancelled',
      usage: { model_calls: 0, tool_calls: 0 },
      drafts: [],
      citations: [],
    })
    expect(await readJson(join(taskDir, 'reads.json'))).toMatchObject({ task_id: taskId, reads: [] })

    const ledger = await readFile(join(root, 'requests.ndjson'), 'utf8')
    expect(ledger.includes(token)).toBe(false)
    for (const line of ledger.trim().split(/\r?\n/).filter(Boolean)) {
      expect(Object.keys(JSON.parse(line) as JsonRecord).sort()).toEqual([
        'disposition',
        'elapsed_ms',
        'method',
        'path',
        'status',
      ])
    }

    const final = await waitForJson(join(root, 'final-metadata.json'), HEALTHY_TIMEOUT_MS)
    expect(final.outcome).toBe('COMPLETED_FOR_ROOT_REVIEW')
    expect(final.source_unchanged).toBe(true)
    expect(final.fixture_source_unchanged).toBe(true)
    expect(final.cleanup).toMatchObject({
      server_should_exit: true,
      server_task_done: true,
      listener_closed: true,
      net_client_closed: true,
      product_logs_closed: true,
      root_retained: true,
    })
    const loop = await waitForJson(join(root, 'loop-closed.json'), 5_000)
    expect(loop.event_loop_closed).toBe(true)
    expect(loop.final_metadata_written).toBe(true)
  }, 40_000)
})
