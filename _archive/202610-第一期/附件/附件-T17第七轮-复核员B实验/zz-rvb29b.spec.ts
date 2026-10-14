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



const out: string[] = []
const P = (k: string, v: unknown) => { out.push(`${k} = ${JSON.stringify(v)}`) }
afterAll(() => { writeFileSync(join(process.env.RVB_OUT ?? '.', 'rvb29-out2.txt'), out.join('\n') + '\n') })

for (const ms of [20, 100, 300, 1000]) {
  it(`E3c 竞态窗口：idle 后 ${ms}ms 发下一句`, async () => {
    const slow = { chunks: textResponse('REPLY-E3C'), delayMs: 1200 }
    const { ctx, api, notices, oldR, newR, id, h } = await prepare([textResponse('a1'), slow, textResponse('a3')])
    cpSync(oldR, newR, { recursive: true })
    const p = idle(ctx, h.agent)
    h.agent.followup(user('RUN-E3C'))
    await sleep(200)
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    await p
    const t0 = Date.now()
    await sleep(ms)
    h.agent.followup(user('RACE-E3C'))
    await new Promise<void>((r) => { const t = setInterval(() => { if (h.agent.status === 'idle') { clearInterval(t); r() } }, 20) })
    await sleep(1500); await ctx.sessionPersistence.flush().catch(() => undefined)
    P(`E3c.${ms}ms.old_has_RACE`, has(oldR, 'RACE-E3C'))
    P(`E3c.${ms}ms.notice`, notices.get(String(id)))
    void t0
    await ctx.fiber.dispose()
  }, 60000)
}
