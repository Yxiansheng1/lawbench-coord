// Reviewer B（最后一轮）：用 DSH 真 AgentLoop（假模型）验"活着的会话复制后续写落哪"。只在复核副本里，不入库
import { createRequire } from 'node:module'
import { renameSync, appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CaseRoots } from '../session-store/case-roots.ts'
import { apply as applyStore, name as storeName } from '../session-store/index.ts'
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

const OUT = join(__dirname, '..', '..', '_x', 'rvb22-move-out.txt')
mkdirSync(join(__dirname, '..', '..', '_x'), { recursive: true })
let tmp: string
const out = (...a: unknown[]) => appendFileSync(OUT, a.map((x) => String(x).split(tmp).join('<tmp>')).join(' ') + '\n')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let reg: Array<{ case_id: string; root: string; t: number }> = []
let clock = 0
const cidOf = (root: string): string => {
  const f = join(root, '工作区', 'case-id.txt')
  if (existsSync(f)) return readFileSync(f, 'utf8')
  mkdirSync(join(root, '工作区'), { recursive: true }); const id = randomUUID(); writeFileSync(f, id); return id
}
const svcOpen = (root: string) => { const id = cidOf(root); reg = reg.filter((c) => c.case_id !== id && c.root.toLowerCase() !== root.toLowerCase()); reg.push({ case_id: id, root, t: ++clock }) }
let server: Server
const PORT = 19313
beforeAll(async () => {
  server = createServer((q, r) => {
    r.setHeader('content-type', 'application/json')
    if (q.url === '/api/case/recent') { r.end(JSON.stringify({ ok: true, value: { cases: [...reg].sort((a, b) => b.t - a.t).map((c) => ({ case_id: c.case_id, name: 'x', root: c.root, last_opened: '2026-10-01T12:00:00+08:00', exists: existsSync(c.root) })) } })); return }
    if (q.url === '/api/case/open') { let b = ''; q.on('data', (d) => { b += d }); q.on('end', () => { svcOpen(JSON.parse(b).path); r.end(JSON.stringify(CASE_OPEN_OK)) }); return }
    r.statusCode = 404; r.end('{}')
  })
  await new Promise<void>((res) => server.listen(PORT, '127.0.0.1', () => res()))
})
afterAll(async () => { server.closeAllConnections?.(); await new Promise((r) => server.close(r)) })
beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'rvb22a-'))); reg = [] })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name))
}
const has = (d: string, s: string) => files(d).filter((f) => readFileSync(f).includes(Buffer.from(s))).length
const user = (text: string) => Llm.createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
const idle = (ctx: any, agent: any) => new Promise<void>((resolve) => { const off = ctx.on('agent/status', ({ agent: a, status }: any) => { if (a === agent && status === 'idle') { off(); resolve() } }) })

for (const live of [true]) it('MV ' + `AG 真 AgentLoop：${live ? '会话活着' : '会话已放下（下次续写走 resume）'} → 复制 → 新位置 caseOpen → 在这个会话里续写`, async () => {
  const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
  const oldR = join(tmp, '桌面', '案丙'); const newR = join(tmp, '案件盘', '案丙')
  mkdirSync(oldR, { recursive: true }); mkdirSync(join(tmp, '案件盘'))
  const adapter = new MockAdapter([textResponse('a1'), textResponse('a2'), textResponse('a3')])
  const ctx = new Context()
  await ctx.plugin(Llm.default); await ctx.plugin(SessionMod.default); await ctx.plugin(Projection); await ctx.plugin(SystemPrompt); await ctx.plugin(ToolRuntime); await ctx.plugin(AgentRegistry)
  ctx.provide('lawbenchCore', { endpoint: () => ({ port: PORT, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} } })
  await ctx.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await ctx.plugin(AgentLoop, { agents: [] })
  ctx.llm.registerAdapter(['mock'], adapter)
  const api = new LawbenchRemote({ endpoint: () => ({ port: PORT, token: 't' }), state: 'running' } as unknown as Supervisor, appData, () => undefined, [], () => {}, undefined,
    (n) => (n === 'sessionPersistence' ? ctx.sessionPersistence : undefined)) as any
  expect((await api.caseOpen({ path: oldR, template: null })).ok).toBe(true)
  for (let i = 0; i < 100 && !new CaseRoots(appData).load().list().includes(oldR); i++) await sleep(20)
  const id = SessionMod.SessionId('s1')
  const h = await ctx.agents.create({ sessionId: id, meta: { cwd: oldR }, agentOptions: { provider: 'mock', model: 'mock' } })
  let p = idle(ctx, h.agent); h.agent.followup(user('FIRST-RVB22')); await p
  if (!live) await h.dispose()
  await sleep(1500); await ctx.sessionPersistence.flush().catch(() => undefined)
  out('AG live=' + live, 'old files before copy', JSON.stringify(files(oldR).map((x) => x.slice(oldR.length).replace(/--.*--/, 'ENC'))), 'FIRST in old', has(oldR, 'FIRST-RVB22'))
  let mv = 'ok'; try { renameSync(oldR, newR) } catch (e) { mv = (e as any).code } ; out('MV rename', mv)
  expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
  await ctx.sessionPersistence.list() // 界面 attachCaseSessions 里那次列表
  // 律师在侧栏（已归到新案件下）点开 s1 续写：DSH 先找活着的 Agent，没有才 resume
  let agent = ctx.agents.get(id)
  const wasLive = agent !== undefined
  if (!agent) agent = (await ctx.agents.resume({ resumeSessionId: id, agentOptions: { provider: 'mock', model: 'mock' } })).agent
  const st: string[] = []; ctx.on('agent/status', ({ status }: any) => st.push(status)); agent.followup(user('AFTER-COPY-RVB22')); await Promise.race([idle(ctx, agent), sleep(5000)]); out('MV statuses', JSON.stringify(st), 'old exists', existsSync(oldR))
  await sleep(200)
  out(`AG live=${live}`, 'agent was live', wasLive, 'session cwd', agent.session.header.cwd, 'AFTER-COPY in old', has(oldR, 'AFTER-COPY-RVB22'), 'in new', has(newR, 'AFTER-COPY-RVB22'))
  await ctx.fiber.dispose()
  out(`AG live=${live}`, 'after shutdown flush: AFTER-COPY in old', has(oldR, 'AFTER-COPY-RVB22'), 'in new', has(newR, 'AFTER-COPY-RVB22'))
  // 重启后：列表看到的 s1 有没有这句
  const ctx2 = new Context()
  await ctx2.plugin(Llm.default); await ctx2.plugin(SessionMod.default)
  ctx2.provide('lawbenchCore', { endpoint: () => ({ port: PORT, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} } })
  await ctx2.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none' })
  await sleep(300)
  const rows = await ctx2.sessionPersistence.list()
  out('AG live=' + live, 'restart list', JSON.stringify(rows.map((r: any) => r.header.id + '@' + (r.header.cwd === newR ? 'new' : r.header.cwd))), 'new store files', JSON.stringify(files(join(newR, '工作区', '会话')).map((x) => x.slice(newR.length).replace(/\\\\--[^\\\\]*--/, '\\\\<enc>'))))
  let evs: unknown[] = []
  try { const hr = await ctx2.sessionPersistence.open(id, 'read'); evs = (await hr.read()).events; await hr.close() } catch (e) { out('AG live=' + live, 'restart open read', (e as Error).name) }
  out(`AG live=${live}`, 'after restart list', JSON.stringify(rows.map((r: any) => r.header.id + '@' + (r.header.cwd === newR ? 'new' : 'old'))), 'restart sees AFTER-COPY', JSON.stringify(evs).includes('AFTER-COPY-RVB22'))
  await ctx2.fiber.dispose()
}, 40000)
