// 复核员 B 第九轮（rv-A31）实验，只在实验副本里，不入库。改自第八轮 zz-rvb30（同一套真 AgentLoop 环境）。
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CaseRoots } from '../session-store/case-roots.ts'
import { apply as applyStore, name as storeName } from '../session-store/index.ts'
import { apply as applyAgent, name as agentName } from '../agent/index.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'

const DSH = join(__dirname, '..', '..', 'dsh')
const AL = join(DSH, 'packages', 'core', 'agent-loop')
const req = createRequire(join(AL, 'package.json'))
const imp = async (name: string) => (await import(/* @vite-ignore */ realpathSync(req.resolve(name))))
const reqBase = createRequire(join(DSH, 'packages', 'bundle', 'base', 'package.json'))
const { Context } = await imp('@deepseek-ai/cordis')
const Llm = await imp('@deepseek-ai/dsh-llm')
const SessionMod = await imp('@deepseek-ai/dsh-session')
const SystemPrompt = (await imp('@deepseek-ai/dsh-system-prompt')).default
const ToolRuntime = (await imp('@deepseek-ai/dsh-tools')).default
const AgentRegistry = (await imp('@deepseek-ai/dsh-agent')).default
const Jsonl = (await imp('@deepseek-ai/dsh-session-persistence-jsonl')).default
const AgentLoop = (await imp('@deepseek-ai/dsh-agent-loop')).default
const Projection = (await imp('@deepseek-ai/dsh-session-projection')).default
const Checkpoint = await import(/* @vite-ignore */ realpathSync(reqBase.resolve('@deepseek-ai/dsh-session-checkpoint-policy')))
const { MockAdapter, textResponse, toolCallResponse } = await import(/* @vite-ignore */ join(AL, 'tests', 'mock-adapter.ts'))
const CASE_OPEN_OK = JSON.parse(readFileSync(join(__dirname, '..', 'ui', 'fixtures', 'case_open.json'), 'utf8'))
const example = (n: string) => JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', n), 'utf8'))
const TASK_BEGIN_OK = example('core_task_begin.res.json')
const TASK_BEGIN_FAIL = example('core_task_begin.fail.json')
const CONTEXT_OK = example('core_context.res.json')
const OUT = process.env.RVB31_OUT ?? join(__dirname, '..', '..', '..', 'rvb31-out.txt')
const MODE = process.env.RVB31_CP ?? 'after'
let tmp: string
const P = (k: string, v: unknown) => { const s = `${k} = ${JSON.stringify(v).split(tmp).join('<tmp>').split(tmp.replace(/\\/g, '\\\\')).join('<tmp>')}`; appendFileSync(OUT, s + '\n') }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
class DelayAdapter extends MockAdapter {
  private readonly delays: number[]
  constructor(script: unknown[]) {
    super(script.map((e: any) => (e && typeof e === 'object' && 'chunks' in e ? e.chunks : e)), { efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low' })
    this.delays = script.map((e: any) => (e && typeof e === 'object' && 'delayMs' in e ? e.delayMs : 0))
  }
  calls = 0
  async * stream(options: any): AsyncIterable<any> {
    this.calls++
    const ms = this.delays.shift() ?? 0
    if (ms) await sleep(ms)
    yield* super.stream(options)
  }
}

let reg: Array<{ case_id: string; root: string; t: number }> = []
let clock = 0
let toolDelay = 0
const cidOf = (root: string): string => {
  const f = join(root, '工作区', 'case-id.txt')
  if (existsSync(f)) return readFileSync(f, 'utf8')
  mkdirSync(join(root, '工作区'), { recursive: true }); const id = randomUUID(); writeFileSync(f, id); return id
}
const svcOpen = (root: string) => { const id = cidOf(root); reg = reg.filter((c) => c.case_id !== id && c.root.toLowerCase() !== root.toLowerCase()); reg.push({ case_id: id, root, t: ++clock }) }
let server: Server
let port = 0
beforeAll(async () => {
  server = createServer((q, r) => {
    r.setHeader('content-type', 'application/json')
    if (q.url === '/api/case/recent') { r.end(JSON.stringify({ ok: true, value: { cases: [...reg].sort((a, b) => b.t - a.t).map((c) => ({ case_id: c.case_id, name: 'x', root: c.root, last_opened: '2026-10-01T12:00:00+08:00', exists: existsSync(c.root) })) } })); return }
    if (q.url === '/api/case/open') { let b = ''; q.on('data', (d) => { b += d }); q.on('end', () => { svcOpen(JSON.parse(b).path); r.end(JSON.stringify(CASE_OPEN_OK)) }); return }
    if (q.url?.startsWith('/core/')) {
      let b = ''; q.on('data', (d) => { b += d }); q.on('end', async () => {
        const body = JSON.parse(b || '{}')
        if (q.url === '/core/task/begin') {
          const ok = reg.some((c) => c.root.toLowerCase() === String(body.cwd).toLowerCase() && existsSync(c.root))
          r.end(JSON.stringify(ok ? TASK_BEGIN_OK : TASK_BEGIN_FAIL)); return
        }
        if (q.url === '/core/context') { r.end(JSON.stringify(CONTEXT_OK)); return }
        if (q.url === '/core/tool' && toolDelay) await sleep(toolDelay)
        r.end(JSON.stringify({ ok: true, value: {} }))
      }); return
    }
    r.statusCode = 404; r.end('{}')
  })
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', () => res()))
  port = (server.address() as { port: number }).port
})
afterAll(async () => { server.closeAllConnections?.(); await new Promise((r) => server.close(r)) })

beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'lb-rvb31-'))); reg = []; toolDelay = 0 })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name))
}
const has = (d: string, s: string) => files(d).filter((f) => readFileSync(f).includes(Buffer.from(s))).length
const hashDir = (d: string) => files(d).sort().map((f) => f.slice(d.length) + ':' + createHash('sha256').update(readFileSync(f)).digest('hex')).join('|')
const user = (text: string) => Llm.createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
const idle = (ctx: any, agent: any) => new Promise<void>((resolve) => { const off = ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === agent && status === 'idle') { off(); resolve() } }) })

async function boot(appData: string, home: string, replies: unknown[], mode = MODE) {
  const ctx = new Context()
  await ctx.plugin(Llm.default); await ctx.plugin(SessionMod.default); await ctx.plugin(Projection); await ctx.plugin(SystemPrompt); await ctx.plugin(ToolRuntime); await ctx.plugin(AgentRegistry)
  const notices = new Map<string, string>()
  const errors: string[] = []
  ctx.provide('lawbenchCore', {
    endpoint: () => ({ port, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} },
    noteTurnBlocked: (sid: string, code: string) => { notices.set(sid, code) }, clearTurnBlocked: (sid: string) => { notices.delete(sid) },
  })
  await ctx.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  if (mode === 'before') await ctx.plugin(Checkpoint)
  await ctx.plugin({ name: agentName, inject: ['tools', 'lawbenchCore'], apply: applyAgent }, { appData, validateContracts: false })
  if (mode === 'after') await ctx.plugin(Checkpoint)
  await ctx.plugin(AgentLoop, { agents: [] })
  ctx.on('agent/error', (p: any) => { errors.push(String(p?.error?.name ?? 'Error') + ':' + String(p?.error?.message ?? p?.error).slice(0, 160)) })
  const adapter = new DelayAdapter(replies)
  ctx.llm.registerAdapter(['mock'], adapter)
  const api = new LawbenchRemote({ endpoint: () => ({ port, token: 't' }), state: 'running' } as unknown as Supervisor, appData, () => undefined, [], () => {}, undefined,
    (n) => (n === 'sessionPersistence' ? ctx.sessionPersistence : undefined)) as LawbenchRemote & { caseOpen(r: unknown): Promise<{ ok: boolean }> }
  return { ctx, api, notices, adapter, errors }
}
async function readAfterRestart(appData: string, home: string, id: unknown): Promise<string> {
  const ctx2 = new Context()
  await ctx2.plugin(Llm.default); await ctx2.plugin(SessionMod.default)
  ctx2.provide('lawbenchCore', { endpoint: () => ({ port, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} } })
  await ctx2.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await sleep(300)
  await ctx2.sessionPersistence.list()
  try {
    const h = await ctx2.sessionPersistence.open(id, 'read')
    const evs = JSON.stringify((await h.read()).events)
    await h.close(); return evs
  } catch (e) { return 'OPEN-FAILED:' + (e as Error).name } finally { await ctx2.fiber.dispose() }
}
async function prepare(replies: unknown[], mode = MODE) {
  const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
  const oldR = join(tmp, '桌面', '案丙'); const newR = join(tmp, '案件盘', '案丙')
  mkdirSync(oldR, { recursive: true }); mkdirSync(join(tmp, '案件盘'))
  const b = await boot(appData, home, replies, mode)
  expect((await b.api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  for (let i = 0; i < 100 && !new CaseRoots(appData).load().list().includes(oldR); i++) await sleep(20)
  const id = SessionMod.SessionId('s1')
  const h = await b.ctx.agents.create({ sessionId: id, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  const p = idle(b.ctx, h.agent); h.agent.followup(user('FIRST-LIVE')); await p
  await sleep(1500); await b.ctx.sessionPersistence.flush()
  expect(has(oldR, 'FIRST-LIVE')).toBe(1)
  return { appData, home, oldR, newR, id, h, ...b }
}
async function say(ctx: any, agent: any, adapter: any, text: string): Promise<number> {
  const before = adapter.calls
  const p = idle(ctx, agent); agent.followup(user(text)); await p
  await sleep(1200); await ctx.sessionPersistence.flush().catch(() => undefined)
  return adapter.calls - before
}

it('C0 搬家 → 新位置打开 → 说两句', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('a3')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const newHash = hashDir(newR)
  const c1 = await say(ctx, h.agent, adapter, 'MOVED-ONE')
  P(`C0[${MODE}].turn1`, { calls: c1, notice: notices.get(String(id)) ?? null, errors: [...errors] })
  notices.clear(); errors.length = 0
  const c2 = await say(ctx, h.agent, adapter, 'MOVED-TWO')
  P(`C0[${MODE}].turn2`, { calls: c2, notice: notices.get(String(id)) ?? null, errors: [...errors] })
  P(`C0[${MODE}].disk`, { oldExists: existsSync(oldR), newSame: hashDir(newR) === newHash, tmpHasOne: has(tmp, 'MOVED-ONE') })
  await ctx.fiber.dispose().catch(() => undefined)
  const evs = await readAfterRestart(appData, home, id)
  P(`C0[${MODE}].restart`, { hasFirst: evs.includes('FIRST-LIVE'), hasMoved: evs.includes('MOVED-ONE'), oldExists: existsSync(oldR) })
}, 60000)

it('C2 盘暂时不在、名单没变', async () => {
  const { oldR, ctx, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('a2')])
  const away = oldR + '-拔出'
  renameSync(oldR, away)
  const c = await say(ctx, h.agent, adapter, 'WHILE-AWAY')
  P(`C2[${MODE}]`, { calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], oldExists: existsSync(oldR) })
  renameSync(away, oldR); notices.clear(); errors.length = 0
  const c2 = await say(ctx, h.agent, adapter, 'BACK-AGAIN')
  P(`C2[${MODE}].back`, { calls: c2, notice: notices.get(String(id)) ?? null, errors: [...errors], hasBack: has(oldR, 'BACK-AGAIN') })
  await ctx.fiber.dispose()
}, 60000)

it('C4 搬家 → 新位置打开 → 原路径又建另一个案件并打开 → 老会话说一句', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('GHOST-REPLY')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  mkdirSync(oldR, { recursive: true })
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  const moved = ctx.sessionPersistence.caseMoved(id)
  const c = await say(ctx, h.agent, adapter, 'GHOST-SAY')
  P(`C4[${MODE}]`, { caseMoved: moved, calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], oldHasSay: has(oldR, 'GHOST-SAY'), tmpHasReply: has(tmp, 'GHOST-REPLY') })
  await ctx.fiber.dispose().catch(() => undefined)
  const evs = await readAfterRestart(appData, home, id)
  P(`C4[${MODE}].restart`, { say: evs.includes('GHOST-SAY'), reply: evs.includes('GHOST-REPLY'), first: evs.includes('FIRST-LIVE') })
}, 60000)

it('C4b 搬家 → 新位置打开 → 原路径建另一个案件，其会话目录下恰好有同名项目目录（无该会话）→ 老会话说一句', async () => {
  const { oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('GHOST2-REPLY')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const projDirs = readdirSync(join(newR, '工作区', '会话'))
  mkdirSync(join(oldR, '工作区', '会话', projDirs[0]), { recursive: true })
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  const c = await say(ctx, h.agent, adapter, 'GHOST2-SAY')
  P(`C4b[${MODE}]`, { projDirs: projDirs.length, calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], oldHasSay: has(oldR, 'GHOST2-SAY') })
  await ctx.fiber.dispose().catch(() => undefined)
}, 60000)

// 新建会话还没落过盘（seen=false）时案件被搬走
it('M1 新建会话（还没说话）→ 搬家 → 新位置打开 → 在新会话里说一句：提示、旧处是否被重建', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors } = await prepare([textResponse('a1'), textResponse('M1-REPLY')])
  const id2 = SessionMod.SessionId('s2')
  const h2 = await ctx.agents.create({ sessionId: id2, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  await sleep(300)
  const onDiskBefore = files(oldR).some((f) => f.includes('s2'))
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const moved = ctx.sessionPersistence.caseMoved(id2)
  const c = await say(ctx, h2.agent, adapter, 'M1-SAY')
  P(`M1[${MODE}]`, { s2OnDiskBeforeMove: onDiskBefore, caseMoved: moved, calls: c, notice: notices.get(String(id2)) ?? null, errors: [...errors], oldRecreated: existsSync(oldR), oldHasSay: has(oldR, 'M1-SAY'), newHasSay: has(newR, 'M1-SAY') })
  await ctx.fiber.dispose().catch(() => undefined)
  P(`M1[${MODE}].afterDispose`, { oldRecreated: existsSync(oldR), oldFiles: files(oldR).length })
  const evs = await readAfterRestart(appData, home, id2)
  P(`M1[${MODE}].restart`, { r: evs.slice(0, 40) })
}, 60000)

it('M1b 新建空白会话（还没说话）→ 搬家（不在新位置打开）→ 在这个空白会话里说第一句', async () => {
  const { oldR, newR, ctx, notices, adapter, errors } = await prepare([textResponse('a1'), textResponse('M1B-REPLY')])
  const id2 = SessionMod.SessionId('s2')
  const h2 = await ctx.agents.create({ sessionId: id2, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  await sleep(300)
  renameSync(oldR, newR)
  const c = await say(ctx, h2.agent, adapter, 'M1B-SAY')
  P(`M1b[${MODE}]`, { calls: c, notice: notices.get(String(id2)) ?? null, errors: [...errors], oldRecreated: existsSync(oldR), oldFiles: files(oldR).map((f) => f.slice(oldR.length)), oldHasSay: has(oldR, 'M1B-SAY') })
  await ctx.fiber.dispose().catch(() => undefined)
}, 60000)

it('M2 新建会话（还没说话）→ 搬家 → 新位置打开 → 原路径建另一个案件并打开 → 在新会话里说一句', async () => {
  const { oldR, newR, ctx, api, notices, adapter, errors } = await prepare([textResponse('a1'), textResponse('M2-REPLY')])
  const id2 = SessionMod.SessionId('s2')
  const h2 = await ctx.agents.create({ sessionId: id2, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  await sleep(300)
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  mkdirSync(oldR, { recursive: true })
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  const moved = ctx.sessionPersistence.caseMoved(id2)
  const c = await say(ctx, h2.agent, adapter, 'M2-SAY')
  P(`M2[${MODE}]`, { caseMoved: moved, calls: c, notice: notices.get(String(id2)) ?? null, errors: [...errors], otherCaseHasSay: has(oldR, 'M2-SAY'), otherCaseHasReply: has(oldR, 'M2-REPLY'), newHasSay: has(newR, 'M2-SAY') })
  await ctx.fiber.dispose().catch(() => undefined)
}, 60000)

// 一轮当中（第二步之前）搬家：第一步发了工具调用，工具执行期间案件被搬走
for (const reopen of [false, true]) {
  it(`S2 一轮当中搬家（工具执行时），${reopen ? '新位置打开' : '不打开'}：第二步怎么结束、提示、回答是否保住`, async () => {
    const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), toolCallResponse('c1', 'case_list_materials', {}), textResponse('S2-REPLY'), textResponse('after')])
    toolDelay = 1500
    const p = idle(ctx, h.agent); h.agent.followup(user('S2-SAY'))
    await sleep(600)
    renameSync(oldR, newR)
    if (reopen) await api.caseOpen({ path: newR, template: null })
    await p; await sleep(1200)
    await ctx.sessionPersistence.flush().catch(() => undefined)
    P(`S2[${MODE}] reopen=${reopen}`, { calls: adapter.calls, notice: notices.get(String(id)) ?? null, errors: [...errors], caseMoved: ctx.sessionPersistence.caseMoved(id), oldExists: existsSync(oldR), newHasSay: has(newR, 'S2-SAY'), newHasReply: has(newR, 'S2-REPLY') })
    await ctx.fiber.dispose().catch(() => undefined)
    const evs = await readAfterRestart(appData, home, id)
    P(`S2[${MODE}] reopen=${reopen}.restart`, { say: evs.includes('S2-SAY'), reply: evs.includes('S2-REPLY'), first: evs.includes('FIRST-LIVE'), oldExists: existsSync(oldR) })
  }, 60000)
}
