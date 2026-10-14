// 复核员 B 第八轮（rv-A30）实验：live-writer.spec 的同一套真 AgentLoop 环境，另可加载 DSH 生产插件树里的
// session-checkpoint-policy（每步前 sessions.flush，失败即 fail-closed），看 B-F1 改后"搬家不放下"的影响半径。只打印，不入库。
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync, appendFileSync } from 'node:fs'
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
const { MockAdapter, textResponse } = await import(/* @vite-ignore */ join(AL, 'tests', 'mock-adapter.ts'))
const CASE_OPEN_OK = JSON.parse(readFileSync(join(__dirname, '..', 'ui', 'fixtures', 'case_open.json'), 'utf8'))
const example = (n: string) => JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', n), 'utf8'))
const TASK_BEGIN_OK = example('core_task_begin.res.json')
const TASK_BEGIN_FAIL = example('core_task_begin.fail.json')
const CONTEXT_OK = example('core_context.res.json')
const OUT = process.env.RVB30_OUT ?? join(__dirname, '..', '..', '..', 'rvb30-out.txt')
const P = (k: string, v: unknown) => { const s = `${k} = ${JSON.stringify(v)}`; appendFileSync(OUT, s + '\n'); console.log('[RVB30] ' + s) }
const MODE = process.env.RVB30_CP ?? 'after' // none | before | after：checkpoint-policy 不加 / 在我方 Agent 插件之前 / 之后加载

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
let svcDown = false
let clock = 0
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
    if (q.url === '/api/case/recent' && svcDown) { r.statusCode = 503; r.end('{}'); return }
    if (q.url === '/api/case/recent') { r.end(JSON.stringify({ ok: true, value: { cases: [...reg].sort((a, b) => b.t - a.t).map((c) => ({ case_id: c.case_id, name: 'x', root: c.root, last_opened: '2026-10-01T12:00:00+08:00', exists: existsSync(c.root) })) } })); return }
    if (q.url === '/api/case/open') { let b = ''; q.on('data', (d) => { b += d }); q.on('end', () => { svcOpen(JSON.parse(b).path); r.end(JSON.stringify(CASE_OPEN_OK)) }); return }
    if (q.url?.startsWith('/core/')) {
      let b = ''; q.on('data', (d) => { b += d }); q.on('end', () => {
        const body = JSON.parse(b || '{}')
        if (q.url === '/core/task/begin') {
          const ok = reg.some((c) => c.root.toLowerCase() === String(body.cwd).toLowerCase() && existsSync(c.root))
          r.end(JSON.stringify(ok ? TASK_BEGIN_OK : TASK_BEGIN_FAIL)); return
        }
        if (q.url === '/core/context') { r.end(JSON.stringify(CONTEXT_OK)); return }
        r.end(JSON.stringify({ ok: true, value: {} }))
      }); return
    }
    r.statusCode = 404; r.end('{}')
  })
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', () => res()))
  port = (server.address() as { port: number }).port
})
afterAll(async () => { server.closeAllConnections?.(); await new Promise((r) => server.close(r)) })

let tmp: string
beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'lb-rvb30-'))); reg = []; svcDown = false })
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
  ctx.on('agent/error', (p: any) => { errors.push(String(p?.error?.name ?? 'Error') + ':' + String(p?.error?.message ?? p?.error).slice(0, 160).replace(tmp, '<tmp>')) })
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

it('C0 搬家 → 新位置打开 → 说两句：模型调用、CASE_MOVED 提示、agent/error、旧处是否被重建、全盘特征串', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('a3')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const newHash = hashDir(newR)
  P(`C0[${MODE}].caseMoved`, ctx.sessionPersistence.caseMoved(id))
  const c1 = await say(ctx, h.agent, adapter, 'MOVED-ONE')
  P(`C0[${MODE}].turn1`, { calls: c1, notice: notices.get(String(id)) ?? null, errors: [...errors] })
  notices.clear(); errors.length = 0
  const c2 = await say(ctx, h.agent, adapter, 'MOVED-TWO')
  P(`C0[${MODE}].turn2`, { calls: c2, notice: notices.get(String(id)) ?? null, errors: [...errors] })
  P(`C0[${MODE}].disk`, { oldExists: existsSync(oldR), newSame: hashDir(newR) === newHash, tmpHasOne: has(tmp, 'MOVED-ONE'), tmpHasTwo: has(tmp, 'MOVED-TWO') })
  const t0 = Date.now(); let disposeErr = 'none'
  await ctx.fiber.dispose().catch((e: Error) => { disposeErr = e.name })
  P(`C0[${MODE}].dispose`, { ms: Date.now() - t0, disposeErr, tmpHasOne: has(tmp, 'MOVED-ONE'), oldExists: existsSync(oldR) })
  const evs = await readAfterRestart(appData, home, id)
  P(`C0[${MODE}].restart`, { hasFirst: evs.includes('FIRST-LIVE'), hasMoved: evs.includes('MOVED-ONE') })
}, 60000)

it('C1 复制 → 新位置打开 → 说一句（放下的情形）', async () => {
  const { oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('a2')])
  cpSync(oldR, newR, { recursive: true })
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const oh = hashDir(oldR); const nh = hashDir(newR)
  const c = await say(ctx, h.agent, adapter, 'COPIED-ONE')
  P(`C1[${MODE}]`, { calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], oldSame: hashDir(oldR) === oh, newSame: hashDir(newR) === nh, tmpHas: has(tmp, 'COPIED-ONE') })
  await ctx.fiber.dispose()
}, 60000)

it('C2 盘暂时不在、名单没变（第 5 例）：提示与错误', async () => {
  const { oldR, ctx, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('a2')])
  const away = oldR + '-拔出'
  renameSync(oldR, away)
  const c = await say(ctx, h.agent, adapter, 'WHILE-AWAY')
  P(`C2[${MODE}]`, { calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors] })
  renameSync(away, oldR); notices.clear(); errors.length = 0
  const c2 = await say(ctx, h.agent, adapter, 'BACK-AGAIN')
  P(`C2[${MODE}].back`, { calls: c2, notice: notices.get(String(id)) ?? null, errors: [...errors], hasBack: has(oldR, 'BACK-AGAIN'), hasAway: has(oldR, 'WHILE-AWAY') })
  await ctx.fiber.dispose()
}, 60000)

it('C3 E2：盘在一轮当中拔出、名单刷新 → 插回、刷新 → 续写', async () => {
  const slow = { chunks: textResponse('REPLY-E2-UNPLUG'), delayMs: 1500 }
  const { appData, home, oldR, ctx, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  const away = oldR + '-拔出'
  const p = idle(ctx, h.agent); h.agent.followup(user('RUN-E2'))
  await sleep(300); renameSync(oldR, away); await p; await sleep(1200)
  const store = ctx.sessionPersistence as any
  await store.refreshCaseRoots()
  const m1 = store.caseMoved(id)
  renameSync(away, oldR); await store.refreshCaseRoots()
  const m2 = store.caseMoved(id)
  const c = await say(ctx, h.agent, adapter, 'AFTER-E2')
  P(`C3[${MODE}]`, { movedWhileAway: m1, movedAfterBack: m2, calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], hasReply: has(oldR, 'REPLY-E2-UNPLUG'), hasAfter: has(oldR, 'AFTER-E2') })
  await ctx.fiber.dispose()
  const evs = await readAfterRestart(appData, home, id)
  P(`C3[${MODE}].restart`, { run: evs.includes('RUN-E2'), reply: evs.includes('REPLY-E2-UNPLUG'), after: evs.includes('AFTER-E2') })
}, 60000)

it('C3b E2b：盘在一轮当中拔出、不刷新 → 插回 → 续写', async () => {
  const slow = { chunks: textResponse('REPLY-E2B'), delayMs: 1500 }
  const { appData, home, oldR, ctx, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  const away = oldR + '-拔出'
  const p = idle(ctx, h.agent); h.agent.followup(user('RUN-E2B'))
  await sleep(300); renameSync(oldR, away); await p; await sleep(1200)
  renameSync(away, oldR)
  const c = await say(ctx, h.agent, adapter, 'AFTER-E2B')
  P(`C3b[${MODE}]`, { calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], hasReply: has(oldR, 'REPLY-E2B'), hasAfter: has(oldR, 'AFTER-E2B') })
  await ctx.fiber.dispose()
  const evs = await readAfterRestart(appData, home, id)
  P(`C3b[${MODE}].restart`, { reply: evs.includes('REPLY-E2B'), after: evs.includes('AFTER-E2B') })
}, 60000)

it('C4 搬家 → 新位置打开 → 原路径又建了另一个案件并打开 → 回到老会话说一句', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('GHOST-REPLY')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  mkdirSync(oldR, { recursive: true }) // 原路径上另一个案件（新案件编号）
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  const moved = ctx.sessionPersistence.caseMoved(id)
  const c = await say(ctx, h.agent, adapter, 'GHOST-SAY')
  P(`C4[${MODE}]`, { caseMoved: moved, calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], tmpHasSay: has(tmp, 'GHOST-SAY'), tmpHasReply: has(tmp, 'GHOST-REPLY') })
  await ctx.fiber.dispose().catch(() => undefined)
  const evs = await readAfterRestart(appData, home, id)
  P(`C4[${MODE}].restart`, { say: evs.includes('GHOST-SAY'), reply: evs.includes('GHOST-REPLY'), first: evs.includes('FIRST-LIVE') })
}, 60000)

it('C5 搬家 → 新位置打开 → 被拒一句 → 搬回原处、打开原处 → 续写', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse('UNDO-REPLY')])
  renameSync(oldR, newR)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const c0 = await say(ctx, h.agent, adapter, 'BLOCKED-MID')
  renameSync(newR, oldR)
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  notices.clear(); errors.length = 0
  const c = await say(ctx, h.agent, adapter, 'UNDO-SAY')
  P(`C5[${MODE}]`, { blockedCalls: c0, caseMoved: ctx.sessionPersistence.caseMoved(id), calls: c, notice: notices.get(String(id)) ?? null, errors: [...errors], hasSay: has(oldR, 'UNDO-SAY'), hasBlocked: has(oldR, 'BLOCKED-MID') })
  await ctx.fiber.dispose()
  const evs = await readAfterRestart(appData, home, id)
  P(`C5[${MODE}].restart`, { say: evs.includes('UNDO-SAY'), reply: evs.includes('UNDO-REPLY') })
}, 60000)

for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30]) {
  it(`X4 k=${k}ms 复制 → 新位置打开（放下）→ 重新打开原位置的同时律师发话`, async () => {
    const { appData, home, oldR, newR, ctx, api, notices, adapter, errors, id, h } = await prepare([textResponse('a1'), textResponse(`X4-REPLY-${k}`)])
    cpSync(oldR, newR, { recursive: true })
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    const p = idle(ctx, h.agent)
    const open = api.caseOpen({ path: oldR, template: null })
    await sleep(k)
    h.agent.followup(user(`X4-SAY-${k}`))
    await open; await p; await sleep(1200)
    let flushErr = 'none'
    await ctx.sessionPersistence.flush().catch((e: Error) => { flushErr = e.name })
    const moved = ctx.sessionPersistence.caseMoved(id)
    await ctx.fiber.dispose().catch(() => undefined)
    const evs = await readAfterRestart(appData, home, id)
    const ok = moved ? notices.get(String(id)) === 'CASE_MOVED' || evs.includes(`X4-REPLY-${k}`) : evs.includes(`X4-SAY-${k}`) && evs.includes(`X4-REPLY-${k}`)
    P(`X4[${MODE}] k=${k}`, { moved, calls: adapter.calls, notice: notices.get(String(id)) ?? null, flushErr, errors: errors.length, say: evs.includes(`X4-SAY-${k}`), reply: evs.includes(`X4-REPLY-${k}`), newHasSay: has(newR, `X4-SAY-${k}`), verdict: ok ? 'ok' : 'BAD' })
  }, 60000)
}
