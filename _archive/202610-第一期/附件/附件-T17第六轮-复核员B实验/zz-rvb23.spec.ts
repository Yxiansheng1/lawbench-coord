// 复核员 B（T17 第五轮返修 0210476）实验：真 AgentLoop + 我方会话存储 + 我方 Host caseOpen + （可选）我方 Agent 插件。
// 假服务按真服务语义：/api/case/open 按案件编号去重（只留新位置）；/core/task/begin 按 cwd 找已登记的根（find_by_root）。
// 只打印 + 少量断言，结果以打印为准。
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CaseRoots } from '../session-store/case-roots.ts'
import { apply as applyStore, name as storeName } from '../session-store/index.ts'
import { apply as applyAgent } from '../agent/index.ts'
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
const EX = join(__dirname, '..', '..', 'contracts', 'examples')
const CASE_OPEN_OK = JSON.parse(readFileSync(join(__dirname, '..', 'ui', 'fixtures', 'case_open.json'), 'utf8'))
const BEGIN = JSON.parse(readFileSync(join(EX, 'core_task_begin.res.json'), 'utf8'))
const CONTEXT = JSON.parse(readFileSync(join(EX, 'core_context.res.json'), 'utf8'))

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
class DelayAdapter extends MockAdapter {
  private readonly delays: number[]
  constructor(script: unknown[]) {
    super(script.map((e: any) => (e && typeof e === 'object' && 'chunks' in e ? e.chunks : e)))
    this.delays = script.map((e: any) => (e && typeof e === 'object' && 'delayMs' in e ? e.delayMs : 0))
  }
  async * stream(options: any): AsyncIterable<any> {
    const ms = this.delays.shift() ?? 0
    if (ms) await sleep(ms)
    yield* super.stream(options)
  }
}

let reg: Array<{ case_id: string; root: string; t: number }> = []
let clock = 0
let strictCwd = true
let hideExists = new Set<string>() // 模拟网络盘一时不在：这些根报 exists:false
const beginCalls: string[] = []
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
    let b = ''; q.on('data', (d) => { b += d })
    q.on('end', () => {
      if (q.url === '/api/case/recent') { r.end(JSON.stringify({ ok: true, value: { cases: [...reg].sort((a, c) => c.t - a.t).map((c) => ({ case_id: c.case_id, name: 'x', root: c.root, last_opened: '2026-10-01T12:00:00+08:00', exists: existsSync(c.root) && !hideExists.has(c.root) })) } })); return }
      if (q.url === '/api/case/open') { svcOpen(JSON.parse(b).path); r.end(JSON.stringify(CASE_OPEN_OK)); return }
      if (q.url === '/core/task/begin') {
        const cwd = JSON.parse(b).cwd as string
        const hit = reg.find((c) => c.root.toLowerCase() === String(cwd).toLowerCase())
        beginCalls.push(hit ? 'ok' : 'CASE_NOT_FOUND')
        if (strictCwd && !hit) { r.end(JSON.stringify({ ok: false, error: { code: 'CASE_NOT_FOUND', message: '找不到该案件，请重新打开' } })); return }
        r.end(JSON.stringify({ ok: true, value: { ...BEGIN.value, task_id: 'T-20261001120000-' + randomUUID().slice(0, 4) } })); return
      }
      if (q.url === '/core/context') { r.end(JSON.stringify(CONTEXT)); return }
      if (q.url === '/core/progress') { r.end(JSON.stringify({ ok: true, value: {} })); return }
      if (q.url === '/core/task/end') { r.end(JSON.stringify({ ok: true, value: { status: 'completed' } })); return }
      r.statusCode = 404; r.end('{}')
    })
  })
  await new Promise<void>((res) => server.listen(19331, '127.0.0.1', () => res()))
  port = (server.address() as { port: number }).port
})
afterAll(async () => { server.closeAllConnections?.(); await new Promise((r) => server.close(r)) })

let tmp: string
beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'lb-rvb23-'))); reg = []; strictCwd = true; hideExists = new Set(); beginCalls.length = 0 })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name))
}
const has = (d: string, s: string) => files(d).filter((f) => readFileSync(f).includes(Buffer.from(s))).length
const hashDir = (d: string) => files(d).sort().map((f) => f.slice(d.length) + ':' + createHash('sha256').update(readFileSync(f)).digest('hex')).join('|')
const user = (text: string) => Llm.createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
const idle = (ctx: any, agent: any) => new Promise<void>((resolve) => { const off = ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === agent && status === 'idle') { off(); resolve() } }) })

async function boot(appData: string, home: string, replies: unknown[], withAgent: boolean, notes: string[]) {
  const ctx = new Context()
  await ctx.plugin(Llm.default); await ctx.plugin(SessionMod.default); await ctx.plugin(Projection); await ctx.plugin(SystemPrompt); await ctx.plugin(ToolRuntime); await ctx.plugin(AgentRegistry)
  ctx.provide('lawbenchCore', { endpoint: () => ({ port, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} }, noteTurnBlocked: (_s: string, c: string) => notes.push(c), clearTurnBlocked: () => {} })
  await ctx.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await ctx.plugin(AgentLoop, { agents: [] })
  if (withAgent) {
    await ctx.plugin({ name: 'lawbench-agent', inject: ['tools', 'lawbenchCore'], apply: applyAgent }, { validateContracts: false, appData })
    // 假模型不支持思考档：只在测试里去掉我方插件设的 reasoningEffort（不影响被测路径）
    ctx.on('agent/request', (async (_p: unknown, next: () => Promise<any>) => { const c = await next(); const { reasoningEffort: _r, ...rest } = c; return rest }) as never, { prepend: true })
  }
  ctx.llm.registerAdapter(['mock'], new DelayAdapter(replies))
  const api = new LawbenchRemote({ endpoint: () => ({ port, token: 't' }), state: 'running' } as unknown as Supervisor, appData, () => undefined, [], () => {}, undefined,
    (n) => (n === 'sessionPersistence' ? ctx.sessionPersistence : n === 'sessions' ? ctx.sessions : undefined)) as LawbenchRemote & { caseOpen(r: unknown): Promise<{ ok: boolean }> }
  return { ctx, api }
}
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
async function prepare(replies: unknown[], withAgent: boolean, turns = ['FIRST-LIVE']) {
  const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
  const oldR = join(tmp, '桌面', '案丙'); const newR = join(tmp, '案件盘', '案丙')
  mkdirSync(oldR, { recursive: true }); mkdirSync(join(tmp, '案件盘'))
  const notes: string[] = []
  const { ctx, api } = await boot(appData, home, replies, withAgent, notes)
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  for (let i = 0; i < 100 && !new CaseRoots(appData).load().list().includes(oldR); i++) await sleep(20)
  const id = SessionMod.SessionId('s1')
  const h = await ctx.agents.create({ sessionId: id, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  for (const t of turns) { const p = idle(ctx, h.agent); h.agent.followup(user(t)); await p }
  await sleep(600); await ctx.sessionPersistence.flush()
  return { appData, home, oldR, newR, ctx, api, id, h, notes }
}

describe('J 真实旅程（带我方 Agent 插件，task/begin 按真服务 find_by_root）', () => {
  for (const strict of [true, false]) {
    it(`J1 聊两轮 → 复制 → 新位置 caseOpen → 立刻续写（Agent 活着）；服务 ${strict ? '按 cwd 找根（真语义）' : '不看 cwd（开发假服务语义）'}`, async () => {
      const { appData, home, oldR, newR, ctx, api, id, h, notes } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('ANSWER-AFTER')], true, ['FIRST-LIVE', 'SECOND-LIVE'])
      strictCwd = strict
      console.log('J1 两轮后 begin:', JSON.stringify(beginCalls), 'old has FIRST/SECOND', has(oldR, 'FIRST-LIVE'), has(oldR, 'SECOND-LIVE'))
      cpSync(oldR, newR, { recursive: true })
      const oldHash = hashDir(oldR)
      expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
      const p = idle(ctx, h.agent); h.agent.followup(user('AFTER-LIVE')); await p
      await sleep(600); await ctx.sessionPersistence.flush()
      const r = { strict, begin: beginCalls.slice(-1)[0], notes: [...notes], cwdInMemory: h.agent.session.header.cwd === oldR ? 'old' : 'new',
        newHasAfterMsg: has(newR, 'AFTER-LIVE'), newHasAnswer: has(newR, 'ANSWER-AFTER'), oldUnchanged: hashDir(oldR) === oldHash,
        writerLost: ctx.sessionPersistence.writerLost(id) }
      console.log('J1 结果', JSON.stringify(r))
      // 再从首页重开一次新位置后再试
      expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
      const p2 = idle(ctx, h.agent); h.agent.followup(user('AFTER-REOPEN')); await p2
      await sleep(600); await ctx.sessionPersistence.flush()
      console.log('J1 重开后再续写', JSON.stringify({ begin: beginCalls.slice(-1)[0], notes: [...notes], newHas: has(newR, 'AFTER-REOPEN') }))
      await ctx.fiber.dispose()
      const after = await readAfterRestart(appData, home, id)
      console.log('J1 重启后', JSON.stringify({ hasAfter: after.includes('AFTER-LIVE'), hasAnswer: after.includes('ANSWER-AFTER'), hasSecond: after.includes('SECOND-LIVE') }))
    }, 60000)
  }
})

describe('D 调试', () => {
  it('D1 带 Agent 插件一轮的事件类型', async () => {
    const errs: string[] = []
    const { appData, home, ctx, id, h } = await prepare([textResponse('DBG-ANSWER-ONE')], true, [])
    ctx.on('agent/error', ({ error }: any) => { errs.push(String(error?.message ?? error).slice(0, 200)) })
    strictCwd = false
    const p = idle(ctx, h.agent); h.agent.followup(user('DBG-MSG')); await p
    await sleep(600); await ctx.sessionPersistence.flush()
    await ctx.fiber.dispose()
    const after = JSON.parse(await readAfterRestart(appData, home, id))
    console.log('D1', JSON.stringify({ errs, begin: beginCalls, types: after.map((e: any) => e.type), hasAns: JSON.stringify(after).includes('DBG-ANSWER-ONE') }))
  }, 60000)
})

describe('L CASE_MOVED 之后按提示"从首页重新打开案件，再在这个对话里继续"', () => {
  it('L1 搬家 → 后台刷新（服务报旧处 exists:false）→ 已失效 → 律师从首页打开新位置 → 再续写', async () => {
    const { oldR, newR, ctx, api, id, h, notes } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('a3')], true)
    strictCwd = false // 排除 cwd 问题，只看 CASE_MOVED 能否解除
    renameSync(oldR, newR)
    await (ctx.sessionPersistence as any).refreshCaseRoots()
    const lost1 = ctx.sessionPersistence.writerLost(id)
    const p = idle(ctx, h.agent); h.agent.followup(user('TRY-1')); await p
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    const lost2 = ctx.sessionPersistence.writerLost(id)
    const p2 = idle(ctx, h.agent); h.agent.followup(user('TRY-2')); await p2
    await sleep(600)
    console.log('L1', JSON.stringify({ lost1, notes: [...notes], lostAfterReopen: lost2, newHasTry2: has(newR, 'TRY-2'), oldExists: existsSync(oldR) }))
    await ctx.fiber.dispose()
  }, 60000)
})

describe('R 搬迁窗口里的事件', () => {
  it('R1 律师在搬迁进行中发消息（新位置打开写句柄较慢，如网络盘/长会话）', async () => {
    const { appData, home, oldR, newR, ctx, api, id, h } = await prepare([textResponse('a1'), textResponse('RACE-ANSWER'), textResponse('NEXT-ANSWER')], false)
    cpSync(oldR, newR, { recursive: true })
    const orig = Jsonl.prototype.open
    let hit!: () => void
    const entered = new Promise<void>((r) => { hit = r })
    Jsonl.prototype.open = async function (this: any, sid: any, access: any, o: any) {
      if (access === 'write' && String(this?.root ?? '').startsWith(newR)) { hit(); await sleep(400) }
      return orig.call(this, sid, access, o)
    }
    try {
      const opening = api.caseOpen({ path: newR, template: null })
      await entered
      const p = idle(ctx, h.agent); h.agent.followup(user('RACE-MSG')); await p
      await opening
    } finally { Jsonl.prototype.open = orig }
    await sleep(600)
    let flushErr = 'none'
    await ctx.sessionPersistence.flush().catch((e: any) => { flushErr = e?.name ?? 'err' })
    const p2 = idle(ctx, h.agent); h.agent.followup(user('NEXT-MSG')); await p2
    await sleep(600)
    await ctx.sessionPersistence.flush().catch((e: any) => { flushErr += '/' + (e?.name ?? 'err') })
    const r = { writerLost: ctx.sessionPersistence.writerLost(id), memSeq: (ctx.sessions.get(id) as any)?.seq, flushErr,
      newRace: has(newR, 'RACE-MSG'), newRaceAns: has(newR, 'RACE-ANSWER'), newNext: has(newR, 'NEXT-MSG'), oldRace: has(oldR, 'RACE-MSG'), oldNext: has(oldR, 'NEXT-MSG') }
    console.log('R1 结果', JSON.stringify(r))
    await ctx.fiber.dispose().catch(() => undefined)
    const after = await readAfterRestart(appData, home, id).catch((e) => 'ERR ' + e)
    console.log('R1 重启后', JSON.stringify({ race: after.includes('RACE-MSG'), next: after.includes('NEXT-MSG'), len: (after.match(/"seq"/g) ?? []).length }))
  }, 60000)

  it('R2 复制 → 正在跑一轮时新位置 caseOpen（等 idle）→ 律师点停止并立刻重发', async () => {
    const slow = { chunks: textResponse('SLOW-ANSWER'), delayMs: 1500 }
    const { appData, home, oldR, newR, ctx, api, id, h } = await prepare([textResponse('a1'), slow, textResponse('RESEND-ANSWER'), textResponse('a4')], false)
    cpSync(oldR, newR, { recursive: true })
    const p = idle(ctx, h.agent); h.agent.followup(user('RUN-MSG'))
    await sleep(200)
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    h.agent.cancel({ kind: 'user' })
    h.agent.followup(user('RESEND-MSG'))
    await p
    for (let i = 0; i < 100 && h.agent.status !== 'idle'; i++) await sleep(50)
    await sleep(1500)
    const oldHash = hashDir(oldR)
    let flushErr = 'none'
    await ctx.sessionPersistence.flush().catch((e: any) => { flushErr = e?.name ?? 'err' })
    const r = { status: h.agent.status, writerLost: ctx.sessionPersistence.writerLost(id), flushErr,
      oldResend: has(oldR, 'RESEND-MSG'), newResend: has(newR, 'RESEND-MSG'), oldResendAns: has(oldR, 'RESEND-ANSWER'), newResendAns: has(newR, 'RESEND-ANSWER') }
    console.log('R2 结果', JSON.stringify(r))
    const p3 = idle(ctx, h.agent); h.agent.followup(user('AFTER-R2')); await p3
    await sleep(600)
    console.log('R2 再续写', JSON.stringify({ writerLost: ctx.sessionPersistence.writerLost(id), newAfter: has(newR, 'AFTER-R2'), oldAfter: has(oldR, 'AFTER-R2'), oldUnchanged: hashDir(oldR) === oldHash }))
    await ctx.fiber.dispose().catch(() => undefined)
    const after = await readAfterRestart(appData, home, id).catch((e) => 'ERR ' + e)
    console.log('R2 重启后', JSON.stringify({ resend: after.includes('RESEND-MSG'), resendAns: after.includes('RESEND-ANSWER'), after: after.includes('AFTER-R2') }))
  }, 60000)
})

describe('S 不注入延迟：搬迁进行中发消息（扫时点）', () => {
  it('S1 200 轮会话复制，caseOpen 发出后第 d 毫秒律师发消息', async () => {
    const out: string[] = []
    for (const d of [0, 5, 10, 20, 30, 40, 60, 80, 120]) {
      const replies = Array.from({ length: 202 }, (_, i) => textResponse('r' + i))
      const { newR, oldR, ctx, api, id, h } = await prepare(replies, false, Array.from({ length: 200 }, (_, i) => 'T' + i))
      cpSync(oldR, newR, { recursive: true })
      const t0 = Date.now()
      const opening = api.caseOpen({ path: newR, template: null }).then(() => Date.now() - t0)
      if (d) await sleep(d)
      const p = idle(ctx, h.agent); h.agent.followup(user('SWEEP-MSG-' + d)); await p
      const openMs = await opening
      await sleep(400)
      let fe = 'ok'
      await ctx.sessionPersistence.flush().catch((e: any) => { fe = e?.name ?? 'err' })
      out.push(JSON.stringify({ d, openMs, lost: ctx.sessionPersistence.writerLost(id), flush: fe, newHas: has(newR, 'SWEEP-MSG-' + d), oldHas: has(oldR, 'SWEEP-MSG-' + d) }))
      await ctx.fiber.dispose().catch(() => undefined)
      rmSync(join(tmp, '桌面'), { recursive: true, force: true }); rmSync(join(tmp, '案件盘'), { recursive: true, force: true }); rmSync(join(tmp, 'Local'), { recursive: true, force: true }); rmSync(join(tmp, 'dsh-home'), { recursive: true, force: true })
      reg = []
    }
    console.log('S1\n' + out.join('\n'))
  }, 300000)
})

describe('R3 停止后立刻重发，重发这一轮的模型慢（带 Agent 插件）', () => {
  it('R3 复制 → 跑一轮中新位置 caseOpen → 停止 → 立刻重发（回答要 800ms）', async () => {
    const slow = { chunks: textResponse('SLOW-ANSWER'), delayMs: 1500 }
    const resend = { chunks: textResponse('RESEND-ANSWER-R3'), delayMs: 800 }
    const { appData, home, oldR, newR, ctx, api, id, h, notes } = await prepare([textResponse('a1'), slow, resend, textResponse('a4')], true)
    strictCwd = false
    cpSync(oldR, newR, { recursive: true })
    const p = idle(ctx, h.agent); h.agent.followup(user('RUN-MSG'))
    await sleep(300)
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    h.agent.cancel({ kind: 'user' })
    h.agent.followup(user('RESEND-MSG-R3'))
    await p
    for (let i = 0; i < 200 && h.agent.status !== 'idle'; i++) await sleep(50)
    await sleep(1500)
    console.log('R3 结果', JSON.stringify({ notes: [...notes], writerLost: ctx.sessionPersistence.writerLost(id), oldMsg: has(oldR, 'RESEND-MSG-R3'), newMsg: has(newR, 'RESEND-MSG-R3'), oldAns: has(oldR, 'RESEND-ANSWER-R3'), newAns: has(newR, 'RESEND-ANSWER-R3') }))
    await ctx.fiber.dispose().catch(() => undefined)
    const after = await readAfterRestart(appData, home, id).catch((e) => 'ERR ' + e)
    console.log('R3 重启后', JSON.stringify({ msg: after.includes('RESEND-MSG-R3'), ans: after.includes('RESEND-ANSWER-R3') }))
  }, 60000)
})

describe('S2 窗口里丢了一条之后，后面的轮次', () => {
  it('S2 d=20/30 毫秒发消息后再说一句；重启看', async () => {
    const out: string[] = []
    for (const d of [20, 30, 25]) {
      const replies = Array.from({ length: 203 }, (_, i) => textResponse('r' + i))
      const { appData, home, newR, oldR, ctx, api, id, h } = await prepare(replies, false, Array.from({ length: 200 }, (_, i) => 'T' + i))
      cpSync(oldR, newR, { recursive: true })
      const opening = api.caseOpen({ path: newR, template: null })
      await sleep(d)
      const p = idle(ctx, h.agent); h.agent.followup(user('WIN-MSG')); await p
      await opening; await sleep(400)
      const p2 = idle(ctx, h.agent); h.agent.followup(user('LATER-MSG')); await p2
      await sleep(400)
      let fe = 'ok'
      await ctx.sessionPersistence.flush().catch((e: any) => { fe = e?.name ?? 'err' })
      const mem = (ctx.sessions.get(id) as any)?.seq
      await ctx.fiber.dispose().catch(() => undefined)
      const after = await readAfterRestart(appData, home, id).catch((e) => 'ERR ' + e)
      out.push(JSON.stringify({ d, lost: false, flush: fe, memSeq: mem, diskEvents: (() => { try { return JSON.parse(after).length } catch { return after.slice(0, 40) } })(), win: after.includes('WIN-MSG'), later: after.includes('LATER-MSG'), oldWin: has(oldR, 'WIN-MSG') }))
      rmSync(join(tmp, '桌面'), { recursive: true, force: true }); rmSync(join(tmp, '案件盘'), { recursive: true, force: true }); rmSync(join(tmp, 'Local'), { recursive: true, force: true }); rmSync(join(tmp, 'dsh-home'), { recursive: true, force: true })
      reg = []
    }
    console.log('S2\n' + out.join('\n'))
  }, 300000)
})

describe('J2 关软件 → 复制 → 再开（旧位置 resume）→ 打开新位置 → 续写（带 Agent 插件，真语义）', () => {
  it('J2', async () => {
    const { appData, home, oldR, newR, ctx, h, id } = await prepare([textResponse('a1')], true)
    await h.dispose(); await ctx.fiber.dispose()
    cpSync(oldR, newR, { recursive: true })
    const notes: string[] = []
    const { ctx: ctx2, api } = await boot(appData, home, [textResponse('J2-ANSWER')], true, notes)
    await sleep(300); await ctx2.sessionPersistence.list()
    const agent = (await ctx2.agents.resume({ resumeSessionId: id, agentOptions: { provider: 'mock', model: 'mock' } })).agent
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    const p = idle(ctx2, agent); agent.followup(user('J2-MSG')); await p
    await sleep(600)
    console.log('J2', JSON.stringify({ notes, writerLost: ctx2.sessionPersistence.writerLost(id), newMsg: has(newR, 'J2-MSG'), newAns: has(newR, 'J2-ANSWER'), oldMsg: has(oldR, 'J2-MSG') }))
    await ctx2.fiber.dispose()
  }, 60000)
})

describe('J3 全盘特征串（活会话，服务不看 cwd）', () => {
  it('J3 新建 → 续写 → 复制 → 新位置打开续写（特征串）→ 关闭 → 搜', async () => {
    const SIG = 'RVB23SIG' + randomUUID().slice(0, 8)
    const tempBefore = new Set(readdirSync(tmpdir()))
    const { appData, home, oldR, newR, ctx, api, h } = await prepare([textResponse('a1'), textResponse('ans-' + SIG)], true)
    strictCwd = false
    cpSync(oldR, newR, { recursive: true })
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    const p = idle(ctx, h.agent); h.agent.followup(user('msg-' + SIG)); await p
    await sleep(600); await ctx.fiber.dispose()
    const all = files(tmp).filter((f) => readFileSync(f).includes(Buffer.from(SIG))).map((f) => f.slice(tmp.length))
    const newTemp = readdirSync(tmpdir()).filter((n) => !tempBefore.has(n))
    const tempHits = newTemp.flatMap((n) => { try { return files(join(tmpdir(), n)) } catch { return [] } }).filter((f) => { try { return readFileSync(f).includes(Buffer.from(SIG)) } catch { return false } }).length
    console.log('J3', JSON.stringify({ hits: all, inHome: has(home, SIG), inAppData: has(appData, SIG), inOld: has(oldR, SIG), inNew: has(newR, SIG), tempHits }))
  }, 60000)
})

describe('N 案件没搬、只是服务一时报 exists:false（网络盘、U 盘一时不在）', () => {
  it('N1 刷新时旧处报 exists:false → 之后恢复 → 再续写', async () => {
    const { oldR, ctx, api, id, h, notes } = await prepare([textResponse('a1'), textResponse('a2'), textResponse('a3')], true)
    strictCwd = false
    hideExists.add(oldR)
    await (ctx.sessionPersistence as any).refreshCaseRoots()
    const lostDuring = ctx.sessionPersistence.writerLost(id)
    hideExists = new Set()
    expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
    const p = idle(ctx, h.agent); h.agent.followup(user('AFTER-BLIP')); await p
    await sleep(600)
    console.log('N1', JSON.stringify({ lostDuring, lostAfter: ctx.sessionPersistence.writerLost(id), notes: [...notes], oldHasAfter: has(oldR, 'AFTER-BLIP') }))
    await ctx.fiber.dispose()
  }, 60000)
})

describe('P 搬迁耗时（大会话）', () => {
  it('P1 600 轮的会话复制后打开新位置：caseOpen 用时', async () => {
    const replies = Array.from({ length: 601 }, (_, i) => textResponse('r' + i))
    const { newR, oldR, ctx, api, id } = await prepare(replies, false, Array.from({ length: 600 }, (_, i) => 'T' + i))
    cpSync(oldR, newR, { recursive: true })
    const seq = (ctx.sessions.get(id) as any)?.seq
    const t0 = Date.now()
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    console.log('P1', JSON.stringify({ events: seq, caseOpenMs: Date.now() - t0, writerLost: ctx.sessionPersistence.writerLost(id), bytes: files(newR).map((f) => readFileSync(f).length).reduce((a, b) => a + b, 0) }))
    await ctx.fiber.dispose()
  }, 120000)
})
