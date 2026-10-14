// 活着的会话所在的案件挪走了（N55 用户定 ②：不搬写入者，整轮拒绝并提示重启；改编自复核员 B 第六轮的 zz-rvb22-agent /
// zz-rvb22-move，打印改为断言）：DSH 真 AgentLoop（假模型）+ 我方会话存储 + 我方 Agent 插件 + 我方 Host 的 caseOpen；
// 假工作台服务按真服务语义（按案件编号去重，/api/case/open 之后只列新位置；/core/task/begin 按 cwd 找已登记的案件，
// 找不到报 CASE_NOT_FOUND）。
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
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
const { Context } = await imp('@deepseek-ai/cordis')
const Llm = await imp('@deepseek-ai/dsh-llm')
const SessionMod = await imp('@deepseek-ai/dsh-session')
const SystemPrompt = (await imp('@deepseek-ai/dsh-system-prompt')).default
const ToolRuntime = (await imp('@deepseek-ai/dsh-tools')).default
const AgentRegistry = (await imp('@deepseek-ai/dsh-agent')).default
const Jsonl = (await imp('@deepseek-ai/dsh-session-persistence-jsonl')).default
const AgentLoop = (await imp('@deepseek-ai/dsh-agent-loop')).default
const Projection = (await imp('@deepseek-ai/dsh-session-projection')).default
const { MockAdapter, textResponse } = await import(/* @vite-ignore */ join(AL, 'tests', 'mock-adapter.ts'))
const CASE_OPEN_OK = JSON.parse(readFileSync(join(__dirname, '..', 'ui', 'fixtures', 'case_open.json'), 'utf8'))
const example = (n: string) => JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', n), 'utf8'))
const TASK_BEGIN_OK = example('core_task_begin.res.json')
const TASK_BEGIN_FAIL = example('core_task_begin.fail.json') // CASE_NOT_FOUND
const CONTEXT_OK = example('core_context.res.json')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** 假模型：script 里的元素可写成 { delayMs, chunks }，那一次回答先等这么久（让 caseOpen 落在一轮当中）。 */
class DelayAdapter extends MockAdapter {
  private readonly delays: number[]
  constructor(script: unknown[]) {
    // 我方 Agent 插件按任务单设思考档（契约示例为"低"），假模型要声明支持
    super(script.map((e: any) => (e && typeof e === 'object' && 'chunks' in e ? e.chunks : e)), { efforts: [{ id: 'low', name: 'Low' }], defaultEffort: 'low' })
    this.delays = script.map((e: any) => (e && typeof e === 'object' && 'delayMs' in e ? e.delayMs : 0))
  }
  /** 模型被调了几次。 */
  calls = 0
  async * stream(options: any): AsyncIterable<any> {
    this.calls++
    const ms = this.delays.shift() ?? 0
    if (ms) await sleep(ms)
    yield* super.stream(options)
  }
}

// 假工作台服务：案件编号取自 <案件>\工作区\case-id.txt（复制后两处同号，按号去重，打开哪个就只列哪个）
let reg: Array<{ case_id: string; root: string; t: number }> = []
/** 服务的最近案件接口不可用（名单刷新失败）。 */
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
          // 真服务语义：cwd 必须是已登记、还在盘上的案件根
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
beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'lb-live-'))); reg = []; svcDown = false })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name))
}
const has = (d: string, s: string) => files(d).filter((f) => readFileSync(f).includes(Buffer.from(s))).length
const hashDir = (d: string) => files(d).sort().map((f) => f.slice(d.length) + ':' + createHash('sha256').update(readFileSync(f)).digest('hex')).join('|')
const user = (text: string) => Llm.createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
const idle = (ctx: any, agent: any) => new Promise<void>((resolve) => { const off = ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === agent && status === 'idle') { off(); resolve() } }) })

/** 起 DSH 真 AgentLoop + 我方会话存储 + 我方 Agent 插件；Host 的 caseOpen 走假服务。replies 是假模型依次给的回答（可带延迟）。
 * notices：Agent 插件拒绝整轮时记下的错误码（Host 的 turnNotice 取的就是它）。 */
async function boot(appData: string, home: string, replies: unknown[]) {
  const ctx = new Context()
  await ctx.plugin(Llm.default); await ctx.plugin(SessionMod.default); await ctx.plugin(Projection); await ctx.plugin(SystemPrompt); await ctx.plugin(ToolRuntime); await ctx.plugin(AgentRegistry)
  const notices = new Map<string, string>()
  ctx.provide('lawbenchCore', {
    endpoint: () => ({ port, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} },
    noteTurnBlocked: (sid: string, code: string) => { notices.set(sid, code) }, clearTurnBlocked: (sid: string) => { notices.delete(sid) },
  })
  await ctx.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await ctx.plugin({ name: agentName, inject: ['tools', 'lawbenchCore'], apply: applyAgent }, { appData, validateContracts: false })
  await ctx.plugin(AgentLoop, { agents: [] })
  const adapter = new DelayAdapter(replies)
  ctx.llm.registerAdapter(['mock'], adapter)
  const api = new LawbenchRemote({ endpoint: () => ({ port, token: 't' }), state: 'running' } as unknown as Supervisor, appData, () => undefined, [], () => {}, undefined,
    (n) => (n === 'sessionPersistence' ? ctx.sessionPersistence : undefined)) as LawbenchRemote & { caseOpen(r: unknown): Promise<{ ok: boolean }> }
  return { ctx, api, notices, adapter }
}
/** 重启后读这个会话的全部事件（新进程，只有会话存储）。 */
async function readAfterRestart(appData: string, home: string, id: unknown): Promise<string> {
  const ctx2 = new Context()
  await ctx2.plugin(Llm.default); await ctx2.plugin(SessionMod.default)
  ctx2.provide('lawbenchCore', { endpoint: () => ({ port, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} } })
  await ctx2.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await sleep(300)
  await ctx2.sessionPersistence.list()
  const h = await ctx2.sessionPersistence.open(id, 'read')
  const evs = JSON.stringify((await h.read()).events)
  await h.close(); await ctx2.fiber.dispose()
  return evs
}

/** 旧位置建案件，会话 s1 说一句（FIRST），让它落盘；返回各路径与活着的 Agent。 */
async function prepare(replies: unknown[]) {
  const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
  const oldR = join(tmp, '桌面', '案丙'); const newR = join(tmp, '案件盘', '案丙')
  mkdirSync(oldR, { recursive: true }); mkdirSync(join(tmp, '案件盘'))
  const { ctx, api, notices, adapter } = await boot(appData, home, replies)
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  for (let i = 0; i < 100 && !new CaseRoots(appData).load().list().includes(oldR); i++) await sleep(20)
  const id = SessionMod.SessionId('s1')
  const h = await ctx.agents.create({ sessionId: id, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  const p = idle(ctx, h.agent); h.agent.followup(user('FIRST-LIVE')); await p
  await sleep(1500); await ctx.sessionPersistence.flush()
  expect(has(oldR, 'FIRST-LIVE')).toBe(1)
  expect(notices.size).toBe(0)
  return { appData, home, oldR, newR, ctx, api, notices, adapter, id, h }
}

/** 在活着的 Agent 上说一句并等这一轮结束、落盘；返回这一轮假模型被调了几次。 */
async function say(ctx: any, agent: any, adapter: any, text: string): Promise<number> {
  const before = adapter.calls
  const p = idle(ctx, agent); agent.followup(user(text)); await p
  await sleep(1200); await ctx.sessionPersistence.flush().catch(() => undefined) // 盘不在时原版写不进去、留着缓冲
  return adapter.calls - before
}

/** 重启（新进程，带 Agent 插件），从会话现在的位置 resume 后说一句。 */
async function restartAndSay(appData: string, home: string, id: unknown, text: string) {
  const { ctx, notices, adapter } = await boot(appData, home, [textResponse('after-restart')])
  await sleep(300)
  await ctx.sessionPersistence.list()
  const agent = (await ctx.agents.resume({ resumeSessionId: id, agentOptions: { provider: 'mock', model: 'mock' } })).agent
  const cwd = agent.session.header.cwd
  const calls = await say(ctx, agent, adapter, text)
  await ctx.fiber.dispose()
  return { cwd, calls, notice: notices.get(String(id)) }
}



// ===== 复核员 B（rv-A29）实验：只打印 + 少量断言 =====
const out: string[] = []
const P = (k: string, v: unknown) => { out.push(`${k} = ${JSON.stringify(v)}`); console.log(`[RVB29] ${k} = ${JSON.stringify(v)}`) }
afterAll(() => { writeFileSync(join(process.env.RVB_OUT ?? '.', 'rvb29-out.txt'), out.join('\n') + '\n') })

it('E1 复制时正在跑一轮 + 律师排队发第二句（DSH 发送=followup 进下一轮队列）', async () => {
  const slow = { chunks: textResponse('REPLY-E1'), delayMs: 1500 }
  const { ctx, api, notices, adapter, oldR, newR, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  cpSync(oldR, newR, { recursive: true })
  const statuses: string[] = []
  ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === h.agent) statuses.push(status) })
  h.agent.followup(user('RUN-E1'))
  await sleep(200)
  expect(h.agent.status).toBe('running')
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const before = adapter.calls
  const newHash = hashDir(newR)
  h.agent.followup(user('QUEUED-E1')) // 律师在这一轮还在跑时又发一句（打开新位置之后）
  await new Promise<void>((r) => { const t = setInterval(() => { if (h.agent.status === 'idle') { clearInterval(t); r() } }, 50) })
  await sleep(1500); await ctx.sessionPersistence.flush().catch(() => undefined)
  P('E1.statuses', statuses)
  P('E1.modelCallsForQueued', adapter.calls - before)
  P('E1.notice', notices.get(String(id)))
  P('E1.old_has_QUEUED', has(oldR, 'QUEUED-E1'))
  P('E1.new_has_QUEUED', has(newR, 'QUEUED-E1'))
  P('E1.new_unchanged', hashDir(newR) === newHash)
  P('E1.caseMoved', ctx.sessionPersistence.caseMoved(id))
  const oldHash = hashDir(oldR)
  expect(await say(ctx, h.agent, adapter, 'NEXT-E1')).toBe(0)
  P('E1.after_next_old_unchanged', hashDir(oldR) === oldHash)
  await ctx.fiber.dispose()
}, 60000)

it('E2 盘在一轮当中拔出、一轮结束后名单刷新（exists:false → 放下）→ 插回：这一轮的回答还在不在', async () => {
  const slow = { chunks: textResponse('REPLY-E2-UNPLUG'), delayMs: 1500 }
  const { appData, home, oldR, ctx, notices, adapter, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3'), textResponse('a4')])
  const away = oldR + '-拔出'
  const p = idle(ctx, h.agent); h.agent.followup(user('RUN-E2'))
  await sleep(300)
  renameSync(oldR, away) // 拔盘（这一轮还在跑）
  await p
  await sleep(1200)
  const store = ctx.sessionPersistence as { refreshCaseRoots(): Promise<void>; caseMoved(id: unknown): boolean }
  await store.refreshCaseRoots() // 服务报 exists:false → 名单去掉 → Agent 空闲 → 放下
  P('E2.caseMoved_after_unplug_refresh', store.caseMoved(id))
  renameSync(away, oldR) // 插回
  await store.refreshCaseRoots()
  P('E2.caseMoved_after_plugback', store.caseMoved(id))
  P('E2.old_has_REPLY_after_plugback', has(oldR, 'REPLY-E2-UNPLUG'))
  P('E2.old_has_RUN', has(oldR, 'RUN-E2'))
  P('E2.seq_mem', (ctx as any).sessions?.get?.(id)?.seq)
  const calls = await say(ctx, h.agent, adapter, 'AFTER-E2')
  P('E2.next_turn_calls', calls)
  P('E2.next_notice', notices.get(String(id)))
  await ctx.fiber.dispose()
  const evs = await readAfterRestart(appData, home, id)
  P('E2.restart_has_REPLY', evs.includes('REPLY-E2-UNPLUG'))
  P('E2.restart_has_RUN', evs.includes('RUN-E2'))
}, 60000)

it('E2b 对照：同样拔出、一轮结束、但名单不刷新 → 插回：这一轮的回答还在不在（原版缓冲）', async () => {
  const slow = { chunks: textResponse('REPLY-E2B-UNPLUG'), delayMs: 1500 }
  const { appData, home, oldR, ctx, notices, adapter, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  const away = oldR + '-拔出'
  const p = idle(ctx, h.agent); h.agent.followup(user('RUN-E2B'))
  await sleep(300)
  renameSync(oldR, away)
  await p
  await sleep(1200)
  renameSync(away, oldR)
  const calls = await say(ctx, h.agent, adapter, 'AFTER-E2B')
  P('E2b.next_turn_calls', calls)
  P('E2b.notice', notices.get(String(id)))
  await ctx.fiber.dispose()
  const evs = await readAfterRestart(appData, home, id)
  P('E2b.restart_has_REPLY', evs.includes('REPLY-E2B-UNPLUG'))
}, 60000)

it('E3 竞态：一轮结束（idle）那一刻律师立刻再发一句；放下在 idle 监听里异步做', async () => {
  const slow = { chunks: textResponse('REPLY-E3'), delayMs: 1500 }
  const { ctx, api, notices, adapter, oldR, newR, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  cpSync(oldR, newR, { recursive: true })
  let fired = false
  // 先登记（比会话存储插件的 idle 监听早）：一变 idle 立刻发下一句
  ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === h.agent && status === 'idle' && !fired) { fired = true; h.agent.followup(user('RACE-E3')) } })
  h.agent.followup(user('RUN-E3'))
  await sleep(200)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const before = adapter.calls
  await new Promise<void>((r) => { const t = setInterval(() => { if (fired && h.agent.status === 'idle') { clearInterval(t); r() } }, 50) })
  await sleep(1500); await ctx.sessionPersistence.flush().catch(() => undefined)
  P('E3.calls_after_open', adapter.calls - before)
  P('E3.notice', notices.get(String(id)))
  P('E3.old_has_RACE', has(oldR, 'RACE-E3'))
  P('E3.new_has_RACE', has(newR, 'RACE-E3'))
  await ctx.fiber.dispose()
}, 60000)

it('E3b 竞态（会话存储的 idle 监听先于律师的下一句，但放下是异步的）：idle 后 0ms 发', async () => {
  const slow = { chunks: textResponse('REPLY-E3B'), delayMs: 1500 }
  const { ctx, api, notices, adapter, oldR, newR, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
  cpSync(oldR, newR, { recursive: true })
  const p = idle(ctx, h.agent)
  h.agent.followup(user('RUN-E3B'))
  await sleep(200)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  let fired = false
  ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === h.agent && status === 'idle' && !fired) { fired = true; setTimeout(() => h.agent.followup(user('RACE-E3B')), 0) } })
  await p
  await sleep(1500); await ctx.sessionPersistence.flush().catch(() => undefined)
  P('E3b.notice', notices.get(String(id)))
  P('E3b.old_has_RACE', has(oldR, 'RACE-E3B'))
  await ctx.fiber.dispose()
}, 60000)

it('E4 全盘特征串：新建→续写→复制→新位置打开→被拒那句→关闭；被拒那句在盘上 0 处', async () => {
  const { appData, home, oldR, newR, ctx, api, notices, adapter, id, h } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('a3')])
  expect(await say(ctx, h.agent, adapter, 'SECOND-E4')).toBe(1)
  cpSync(oldR, newR, { recursive: true })
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const MARK = 'ZQX-REJECTED-' + randomUUID()
  expect(await say(ctx, h.agent, adapter, MARK)).toBe(0)
  P('E4.notice', notices.get(String(id)))
  await ctx.fiber.dispose()
  await sleep(500)
  P('E4.hits_tmp_all', files(tmp).filter((f) => readFileSync(f).includes(Buffer.from(MARK))).map((f) => f.slice(tmp.length)))
  P('E4.hits_TEMP', files(process.env.TEMP!).filter((f) => { try { return readFileSync(f).includes(Buffer.from(MARK)) } catch { return false } }).length)
  P('E4.has_SECOND_old_new', [has(oldR, 'SECOND-E4'), has(newR, 'SECOND-E4')])
}, 60000)

it('E5 第二个窗口：活着时对同一会话再 resume 一次（第二个窗口打开它）', async () => {
  const { ctx, api, notices, adapter, oldR, newR, id, h } = await prepare([textResponse('a1'), textResponse('a2')])
  cpSync(oldR, newR, { recursive: true })
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  const oldHash = hashDir(oldR); const newHash = hashDir(newR)
  let r2: any, err: any
  try { r2 = await ctx.agents.resume({ resumeSessionId: id, agentOptions: { provider: 'mock', model: 'mock' } }) } catch (e) { err = (e as Error)?.name + ':' + (e as Error)?.message?.slice(0, 80) }
  P('E5.resume_err', err)
  P('E5.same_agent', r2?.agent === h.agent)
  P('E5.cwd', r2?.agent?.session?.header?.cwd === newR ? 'new' : r2?.agent?.session?.header?.cwd === oldR ? 'old' : String(r2?.agent?.session?.header?.cwd))
  const ag = r2?.agent ?? h.agent
  const calls = await say(ctx, ag, adapter, 'WIN2-E5')
  P('E5.calls', calls)
  P('E5.notice', notices.get(String(id)))
  P('E5.old_unchanged', hashDir(oldR) === oldHash)
  P('E5.new_unchanged', hashDir(newR) === newHash)
  P('E5.new_has', has(newR, 'WIN2-E5'))
  await ctx.fiber.dispose()
}, 60000)

it('E6 名单刷新服务返回空列表（B-F6 保留旧名单）不误判', async () => {
  const { ctx, notices, adapter, oldR, id, h } = await prepare([textResponse('a1'), textResponse('a2')])
  reg = []
  await (ctx.sessionPersistence as { refreshCaseRoots(): Promise<void> }).refreshCaseRoots()
  P('E6.caseMoved', ctx.sessionPersistence.caseMoved(id))
  // task/begin 用真服务语义：reg 空 → CASE_NOT_FOUND；这里只看判定不误判
  await ctx.fiber.dispose()
}, 60000)
