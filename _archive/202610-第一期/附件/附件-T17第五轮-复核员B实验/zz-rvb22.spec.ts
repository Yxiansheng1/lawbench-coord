// Reviewer B（最后一轮）实验：只在复核副本里，不入库
import { createRequire } from 'node:module'
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CACHE_FILE, CaseRoots } from '../session-store/case-roots.ts'
import { NOT_READY, OUTSIDE_CASE, type Backend, type Header } from '../session-store/router.ts'
import { apply as applyStore, name as storeName } from '../session-store/index.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'

const DSH = join(__dirname, '..', '..', 'dsh')
const JSONL_PKG = join(DSH, 'packages', 'session', 'session-persistence-jsonl')
const CACHE_PKG = join(DSH, 'packages', 'session', 'session-projection-cache')
const WS_PKG = join(DSH, 'packages', 'workspace', 'workspace')
const reqJ = createRequire(join(JSONL_PKG, 'package.json'))
const reqW = createRequire(join(WS_PKG, 'package.json'))
const cordis = (await import(/* @vite-ignore */ realpathSync(reqJ.resolve('@deepseek-ai/cordis')))) as { Context: new () => any }
const Jsonl = ((await import(/* @vite-ignore */ realpathSync(join(JSONL_PKG, 'lib', 'index.js')))) as { default: any }).default
const CacheMod = (await import(/* @vite-ignore */ realpathSync(join(CACHE_PKG, 'lib', 'index.js')))) as { default: unknown }
const CONTRACT = join(DSH, 'packages', 'session', 'session-persistence', 'tests', 'contract.ts')
const { meta, oneTurnLog } = (await import(/* @vite-ignore */ CONTRACT)) as { meta(id: string, cwd?: string): Header; oneTurnLog(): any[] }
const WCordis = (await import(/* @vite-ignore */ realpathSync(reqW.resolve('@deepseek-ai/cordis')))) as { Context: new () => any }
const Storage = ((await import(/* @vite-ignore */ realpathSync(reqW.resolve('@deepseek-ai/dsh-storage')))) as { default: unknown }).default
const { DomainFacility } = (await import(/* @vite-ignore */ realpathSync(reqW.resolve('@deepseek-ai/dsh-storage-domain')))) as { DomainFacility: new (...a: unknown[]) => any }
const WorkspaceRegistry = ((await import(/* @vite-ignore */ realpathSync(join(WS_PKG, 'lib', 'index.js')))) as { default: unknown }).default
const MEMORY = join(DSH, 'packages', 'storage', 'storage-domain', 'tests', 'helpers', 'memory-backend.ts')
const { MemoryMediaPool, MemoryStorageBackend } = (await import(/* @vite-ignore */ MEMORY)) as { MemoryMediaPool: new () => unknown; MemoryStorageBackend: new (p: unknown) => unknown }
const CASE_OPEN_OK = JSON.parse(readFileSync(join(__dirname, '..', 'ui', 'fixtures', 'case_open.json'), 'utf8'))

const OUT = join(__dirname, '..', '..', '_x', 'rvb22-out.txt')
mkdirSync(join(__dirname, '..', '..', '_x'), { recursive: true })
let tmp: string
const out = (...a: unknown[]) => appendFileSync(OUT, a.map((x) => String(x).split(tmp).join('<tmp>')).join(' ') + '\n')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type H = { header: Header; append(e: unknown): Promise<void>; close(): Promise<void> }

// 假工作台服务，按真服务 registry.py 语义：案件编号存在案件文件夹里（复制时一起带走）；
// recent 列注册表里全部案件、exists=目录在不在；open(path) 同一编号只留一条、指向这次打开的位置。
let reg: Array<{ case_id: string; root: string; t: number }> = []
let afterOpen: 'ok' | 'hang' | '500' | 'reset' = 'ok' // 打开成功之后 /api/case/recent 的表现
let recentMode: 'ok' | 'hang' | '500' | 'reset' = 'ok'
let recentDelay = 0
let recentHits = 0
let server: Server
const PORT = 19312
const cidOf = (root: string): string => {
  const f = join(root, '工作区', 'case-id.txt')
  if (existsSync(f)) return readFileSync(f, 'utf8')
  mkdirSync(join(root, '工作区'), { recursive: true })
  const id = randomUUID(); writeFileSync(f, id); return id
}
let clock = 0
const svcOpen = (root: string) => { const id = cidOf(root); reg = reg.filter((c) => c.case_id !== id && c.root.toLowerCase() !== root.toLowerCase()); reg.push({ case_id: id, root, t: ++clock }) }
beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/api/case/recent') {
      recentHits++
      const m = recentMode
      if (m === 'hang') return
      if (m === 'reset') { req.socket.destroy(); return }
      if (m === '500') { res.statusCode = 500; res.end('x'); return }
      const body = JSON.stringify({ ok: true, value: { cases: [...reg].sort((a, b) => b.t - a.t).map((c) => ({ case_id: c.case_id, name: '虚构', root: c.root, last_opened: '2026-10-01T12:00:00+08:00', exists: existsSync(c.root) })) } })
      setTimeout(() => { res.setHeader('content-type', 'application/json'); res.end(body) }, recentDelay)
      return
    }
    if (req.url === '/api/case/open' && req.method === 'POST') {
      let body = ''
      req.on('data', (d) => { body += d })
      req.on('end', () => { svcOpen(JSON.parse(body).path); recentMode = afterOpen; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(CASE_OPEN_OK)) })
      return
    }
    res.statusCode = 404; res.end('{}')
  })
  await new Promise<void>((r) => server.listen(PORT, '127.0.0.1', () => r()))
})
afterAll(async () => { server.closeAllConnections?.(); await new Promise((r) => server.close(r)) })

const core = () => ({ endpoint: () => ({ port: PORT, token: 't' }), onState: (fn: (s: string) => void) => { fn('running'); return () => {} } })
async function startStore(appData: string, home: string, withCache = false, c: unknown = core()) {
  const ctx = new cordis.Context()
  if (c) ctx.provide('lawbenchCore', c)
  if (withCache) {
    ctx.provide('sessionProjections', {
      checkpoint: (x: { title: string }) => ({ title: { ver: 1, seq: 3, val: x.title } }),
      viewCheckpoint: (rows: Record<string, { val: unknown }>, keys?: string[]) => Object.fromEntries(Object.entries(rows).filter(([k]) => !keys || keys.includes(k)).map(([k, r]) => [k, r.val])),
    })
    ctx.provide('sessions', { get: () => undefined, flush: async () => {} })
  }
  const fiber = await ctx.plugin({ name: storeName, apply: applyStore }, { backend: Jsonl, defaultRoot: home, appData, compression: 'none', ...(withCache ? { projectionCache: { impl: CacheMod.default, writeEveryEvents: 200, writeIntervalMs: 5000 } } : {}) })
  if (withCache) for (let i = 0; i < 100 && !ctx.get('sessionProjectionCache'); i++) await sleep(10)
  return { ctx, persistence: ctx.sessionPersistence as Backend & { refreshCaseRoots(): Promise<void> }, cache: ctx.get('sessionProjectionCache') as any, dispose: () => fiber.dispose() }
}
async function bootReg(pool: unknown, p: Backend) {
  const ctx = new WCordis.Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  ctx.provide('sessionPersistence', { list: () => p.list(), open: (id: string, a: 'read' | 'write') => p.open(id, a), stat: (id: string) => p.stat(id) })
  ctx.provide('sessions', { get: () => undefined, list: () => [] })
  const fiber = await ctx.plugin(WorkspaceRegistry)
  return { reg: ctx.workspaceRegistry, dispose: () => fiber.dispose() }
}
type Api = LawbenchRemote & { caseOpen(request: unknown): Promise<{ ok: boolean; error?: { code: string } }> }
const remote = (p: unknown, r: unknown, appData: string, logs?: string[]): Api =>
  new LawbenchRemote({ endpoint: () => ({ port: PORT, token: 't' }), state: 'running' } as unknown as Supervisor, appData, () => undefined, [], (_l, e) => { logs?.push(e) }, undefined,
    (name) => (name === 'sessionPersistence' ? p : name === 'workspaceRegistry' ? r : undefined)) as Api
const members = (r: any, path: string): string[] => [...(r.list().find((w: any) => w.path === path)?.sessionIds ?? ['<no ws>'])].sort()
const raw = (r: any, path: string): string[] => { const w = r.list().find((x: any) => x.path === path); return w ? [...r.table.get(w.id).sessionIds].sort() : ['<no ws>'] }
function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name))
}
const hashDir = (d: string) => files(d).sort().map((f) => f.slice(d.length) + ':' + createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 12)).join('|')
const evCount = (d: string, id: string) => files(join(d, '工作区', '会话')).filter((f) => f.includes(id) && f.endsWith('.jsonl')).map((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).length).join(',')
const waitRoots = async (appData: string, want: string) => { for (let i = 0; i < 150; i++) { if (new CaseRoots(appData).load().list().includes(want)) return; await sleep(20) } }
/** 界面 openCase 的顺序：caseOpen → workspaces.create → attachCaseSessions → openWorkspace。 */
async function uiOpenCase(api: Api, r: any, root: string) {
  const t0 = Date.now()
  const o = await api.caseOpen({ path: root, template: null })
  const t1 = Date.now()
  if (!o.ok) return { open: o, openMs: t1 - t0 }
  await r.create(root)
  const a = await api.attachCaseSessions({ root })
  return { open: o.ok, openMs: t1 - t0, attach: JSON.stringify((a as any).value ?? a), attachMs: Date.now() - t1 }
}

beforeEach(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'rvb22-'))); reg = []; afterOpen = 'ok'; recentMode = 'ok'; recentDelay = 0; recentHits = 0 })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

/** 旧位置开案件、建 s1、挂进旧工作区。keepOpen：s1 的写句柄不关（DSH 里活着的 Agent 一直拿着它）。 */
async function setup(pool: unknown, keepOpen: boolean, withCache = false) {
  const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
  const oldR = join(tmp, '桌面', '案丙'); const newR = join(tmp, '案件盘', '案丙')
  mkdirSync(oldR, { recursive: true }); mkdirSync(join(tmp, '案件盘'))
  const s = await startStore(appData, home, withCache)
  const b = await bootReg(pool, s.persistence)
  const api = remote(s.persistence, b.reg, appData)
  await uiOpenCase(api, b.reg, oldR)
  await waitRoots(appData, oldR)
  const h = (await s.persistence.create(meta('s1', oldR) as never)) as unknown as H
  await h.append(oneTurnLog().slice(0, 2))
  await b.reg.list().find((w: any) => w.path === oldR).attachSession('s1')
  if (!keepOpen) await h.close()
  return { appData, home, oldR, newR, s, b, api, h }
}

describe('RVB22', () => {
  it('Y1 活着的会话（写句柄未关）→ 复制 → 新位置打开（走 caseOpen）→ 接着在这个会话里续写', async () => {
    const pool = new MemoryMediaPool()
    const { oldR, newR, s, b, api, h } = await setup(pool, true)
    cpSync(oldR, newR, { recursive: true })
    const oldHash = hashDir(oldR); const newHash = hashDir(newR)
    out('Y1 uiOpenCase', JSON.stringify(await uiOpenCase(api, b.reg, newR)), 'members new', JSON.stringify(members(b.reg, newR)), 'old', JSON.stringify(members(b.reg, oldR)))
    // DSH：会话已有活着的 Agent → 不再 resume，续写走它拿着的那个句柄
    await h.append(oneTurnLog().slice(2))
    out('Y1 after append: old changed', hashDir(oldR) !== oldHash, 'new changed', hashDir(newR) !== newHash, 'events old', evCount(oldR, 's1'), 'new', evCount(newR, 's1'))
    let second = 'ok'
    try { const h2 = (await s.persistence.open('s1', 'write')) as unknown as H; second = 'ok cwd=' + h2.header.cwd; await h2.close() } catch (e) { second = (e as Error).name + ': ' + (e as Error).message.split(tmp).join('<tmp>').slice(0, 160) }
    out('Y1 open(write) again while live handle held', second)
    await h.close()
    let third = 'ok'
    try { const h3 = (await s.persistence.open('s1', 'write')) as unknown as H; third = 'ok cwd=' + h3.header.cwd; await h3.append([]); await h3.close() } catch (e) { third = (e as Error).name + ': ' + (e as Error).message.split(tmp).join('<tmp>').slice(0, 160) }
    out('Y1 open(write) after agent released', third)
    await b.dispose(); await s.dispose()
  }, 40000)

  it('Y1m 活着的会话 → 纯搬家（改名）→ 新位置打开 → 续写', async () => {
    const pool = new MemoryMediaPool()
    const { oldR, newR, s, b, api, h } = await setup(pool, true)
    let mv = 'ok'
    try { renameSync(oldR, newR) } catch (e) { mv = (e as NodeJS.ErrnoException).code ?? 'err' }
    out('Y1m rename with live handle', mv)
    if (mv === 'ok') {
      out('Y1m uiOpenCase', JSON.stringify(await uiOpenCase(api, b.reg, newR)))
      let ap = 'ok'
      try { await h.append(oneTurnLog().slice(2)) } catch (e) { ap = (e as Error).name + ' ' + ((e as NodeJS.ErrnoException).code ?? '') }
      out('Y1m append via live handle', ap, 'old dir recreated', existsSync(oldR), 'old files', files(oldR).length, 'events new', evCount(newR, 's1'))
    }
    await h.close().catch(() => {})
    await b.dispose(); await s.dispose()
  }, 40000)

  for (const mode of ['hang', '500', 'reset'] as const) it(`Y2 打开成功后名单刷新失败（${mode}）：挂回、续写落哪、律师看到什么`, async () => {
    const pool = new MemoryMediaPool()
    const { appData, oldR, newR, s, b, api } = await setup(pool, false)
    cpSync(oldR, newR, { recursive: true })
    const oldHash = hashDir(oldR)
    afterOpen = mode
    const logs: string[] = []
    const api2 = remote(s.persistence, b.reg, appData, logs)
    const r = await uiOpenCase(api2, b.reg, newR)
    out('Y2', mode, 'uiOpenCase', JSON.stringify(r), 'roots', JSON.stringify(new CaseRoots(appData).load().list()), 'members new', JSON.stringify(members(b.reg, newR)), 'old', JSON.stringify(members(b.reg, oldR)))
    const t0 = Date.now()
    let w = 'ok'
    try { const h = (await s.persistence.open('s1', 'write')) as unknown as H; w = 'cwd=' + h.header.cwd; await h.append(oneTurnLog().slice(2)); await h.close() } catch (e) { w = (e as Error).name + ' ' + (e as Error).message.slice(0, 80) }
    out('Y2', mode, 'continue write', w, 'ms', Date.now() - t0, 'old changed', hashDir(oldR) !== oldHash, 'events old', evCount(oldR, 's1'), 'new', evCount(newR, 's1'), 'logs', JSON.stringify(logs.filter((x) => x !== 'api.call')))
    recentMode = 'ok'; afterOpen = 'ok'
    await b.dispose(); await s.dispose()
    void api
  }, 60000)

  it('Y3 打开后立刻续写（不等列表、不等挂回）', async () => {
    const pool = new MemoryMediaPool()
    const { oldR, newR, s, b, api } = await setup(pool, false)
    cpSync(oldR, newR, { recursive: true })
    await s.persistence.list() // 侧栏按旧名单列过：编号表指向旧位置
    const oldHash = hashDir(oldR)
    const o = await api.caseOpen({ path: newR, template: null })
    const h = (await s.persistence.open('s1', 'write')) as unknown as H
    await h.append(oneTurnLog().slice(2)); await h.close()
    out('Y3 open ok', o.ok, 'cwd', h.header.cwd, 'old unchanged', hashDir(oldR) === oldHash, 'events new', evCount(newR, 's1'))
    await b.dispose(); await s.dispose()
  }, 40000)

  it('Y4 两个窗口：一边在新位置打开复制的案件甲，一边打开案件乙，并发', async () => {
    const pool = new MemoryMediaPool()
    const { appData, oldR, newR, s, b, api } = await setup(pool, false)
    const B = join(tmp, '案乙'); mkdirSync(B)
    await uiOpenCase(api, b.reg, B)
    const hb = (await s.persistence.create(meta('b1', B) as never)) as unknown as H; await hb.append(oneTurnLog()); await hb.close()
    cpSync(oldR, newR, { recursive: true })
    const oldHash = hashDir(oldR)
    recentDelay = 400
    const [ra, rb] = await Promise.all([uiOpenCase(remote(s.persistence, b.reg, appData), b.reg, newR), uiOpenCase(remote(s.persistence, b.reg, appData), b.reg, B)])
    out('Y4 A', JSON.stringify(ra), 'B', JSON.stringify(rb), 'roots', JSON.stringify(new CaseRoots(appData).load().list()))
    const [h1, h2] = await Promise.all([s.persistence.open('s1', 'write'), s.persistence.open('b1', 'write')]) as unknown as H[]
    await h1.append(oneTurnLog().slice(2)); await h1.close(); await h2.close()
    out('Y4 s1 cwd', h1.header.cwd, 'b1 cwd', h2.header.cwd, 'old unchanged', hashDir(oldR) === oldHash, 'members new', JSON.stringify(members(b.reg, newR)), 'B', JSON.stringify(members(b.reg, B)))
    await b.dispose()
    let boot = 'ok'; try { const b2 = await bootReg(pool, s.persistence); await b2.dispose() } catch (e) { boot = (e as Error).message.slice(0, 120) }
    out('Y4 reboot registry', boot)
    await s.dispose()
  }, 40000)

  it('Y5 同一编号两边都有记录且复制后两边都写过（先在旧位置续写，再到新位置打开续写，再回旧位置打开）', async () => {
    const pool = new MemoryMediaPool()
    const { appData, oldR, newR, s, b, api } = await setup(pool, false)
    cpSync(oldR, newR, { recursive: true })
    // 复制后律师先没去新位置，仍在旧位置续写（服务仍列旧位置）
    let h = (await s.persistence.open('s1', 'write')) as unknown as H; const c0 = h.header.cwd; await h.append(oneTurnLog().slice(2, 3)); await h.close()
    out('Y5 before opening new: wrote to', c0, 'events old', evCount(oldR, 's1'), 'new', evCount(newR, 's1'))
    const oldHash = hashDir(oldR)
    out('Y5 open new', JSON.stringify(await uiOpenCase(api, b.reg, newR)))
    h = (await s.persistence.open('s1', 'write')) as unknown as H; const c1 = h.header.cwd; await h.append(oneTurnLog().slice(2)); await h.close()
    out('Y5 after open new: wrote to', c1, 'old unchanged', hashDir(oldR) === oldHash, 'events old', evCount(oldR, 's1'), 'new', evCount(newR, 's1'))
    out('Y5 reopen old', JSON.stringify(await uiOpenCase(api, b.reg, oldR)), 'members old', JSON.stringify(members(b.reg, oldR)), 'new', JSON.stringify(members(b.reg, newR)))
    const newHash = hashDir(newR)
    h = (await s.persistence.open('s1', 'write')) as unknown as H; const c2 = h.header.cwd; await h.append([]); await h.close()
    out('Y5 after reopen old: wrote to', c2, 'new unchanged', hashDir(newR) === newHash, 'list', JSON.stringify((await s.persistence.list()).map((r) => r.header.id + '@' + r.header.cwd)))
    await b.dispose()
    let boot = 'ok'; try { const b2 = await bootReg(pool, s.persistence); await b2.dispose() } catch (e) { boot = (e as Error).message.slice(0, 120) }
    out('Y5 reboot registry', boot)
    await s.dispose(); void appData
  }, 40000)

  for (const order of ['先打开后列表', '先列表后打开'] as const) it(`Y6 A-P2-2 同进程复制：${order}；投影缓存往哪写（ownerOf）`, async () => {
    const pool = new MemoryMediaPool()
    const { oldR, newR, s, b, api } = await setup(pool, false, true)
    await s.cache.write({ id: 's1', header: (await s.persistence.stat('s1'))!.header, inheritedEventCount: 0, title: 'T-old' })
    cpSync(oldR, newR, { recursive: true })
    const oldHash = hashDir(oldR)
    if (order === '先列表后打开') { await s.persistence.list(); await api.caseOpen({ path: newR, template: null }) } else { await api.caseOpen({ path: newR, template: null }); await s.persistence.list() }
    const st = await s.persistence.stat('s1')
    await s.cache.write({ id: 's1', header: st!.header, inheritedEventCount: 0, title: 'T-new' })
    await sleep(100)
    out('Y6', order, 'stat cwd', st?.header.cwd, 'old unchanged', hashDir(oldR) === oldHash, 'cache files old', files(join(oldR, '工作区', '会话缓存')).length, 'new', files(join(newR, '工作区', '会话缓存')).map((f) => readFileSync(f, 'utf8').includes('T-new')).join(','))
    await b.dispose(); await s.dispose()
  }, 40000)

  for (const v of ['缺 table', '缺 indexHeaders', '都缺', 'detach 抛错'] as const) it(`Y7 B-F2 ${v}：挂回结果、登记、律师看到什么、点开续写落哪、重启`, async () => {
    const pool = new MemoryMediaPool()
    const { appData, oldR, newR, s, b } = await setup(pool, false)
    cpSync(oldR, newR, { recursive: true })
    const real = b.reg
    let view: any = real
    if (v === '缺 table') view = { list: () => real.list(), indexHeaders: (h: any) => real.indexHeaders(h) }
    if (v === '缺 indexHeaders') view = { list: () => real.list(), table: real.table }
    if (v === '都缺') view = { list: () => real.list() }
    if (v === 'detach 抛错') { const w = real.list().find((x: any) => x.path === oldR); w.detachSession = async () => { throw new Error('disk') } }
    const logs: string[] = []
    const api = remote(s.persistence, view, appData, logs)
    const r = await uiOpenCase(api, real, newR)
    out('Y7', v, JSON.stringify(r), 'logs', JSON.stringify(logs.filter((x) => x !== 'api.call')), 'members new', JSON.stringify(members(real, newR)), 'old', JSON.stringify(members(real, oldR)), 'raw new', JSON.stringify(raw(real, newR)), 'raw old', JSON.stringify(raw(real, oldR)))
    const listed = (await s.persistence.list()).map((x) => x.header.id + '@' + (x.header.cwd === newR ? 'new' : x.header.cwd === oldR ? 'old' : x.header.cwd))
    const oldHash = hashDir(oldR)
    const h = (await s.persistence.open('s1', 'write')) as unknown as H; await h.append(oneTurnLog().slice(2)); await h.close()
    out('Y7', v, 'list', JSON.stringify(listed), 'write old unchanged', hashDir(oldR) === oldHash)
    await b.dispose()
    let boot = 'ok'; try { const b2 = await bootReg(pool, s.persistence); out('Y7', v, 'reboot members new', JSON.stringify(members(b2.reg, newR)), 'old', JSON.stringify(members(b2.reg, oldR))); await b2.dispose() } catch (e) { boot = (e as Error).message.split(tmp).join('<tmp>').slice(0, 160) }
    out('Y7', v, 'reboot', boot)
    await s.dispose()
  }, 40000)

  it('Y8 B-F4 服务一直没起（名单空）：首刷只等一次；服务在但挂住：列表耗时；B-F6 空列表', async () => {
    const appData = join(tmp, 'Local', 'lawbench'); const home = join(tmp, 'dsh-home', 'sessions')
    const C = join(tmp, '案丁'); mkdirSync(C, { recursive: true })
    let s = await startStore(appData, home, false, { endpoint: () => undefined, onState: () => () => {} })
    const times: number[] = []
    for (let i = 0; i < 3; i++) { const t0 = Date.now(); await s.persistence.list(); times.push(Date.now() - t0) }
    let ce = ''; const t1 = Date.now(); try { await s.persistence.create(meta('n1', C) as never) } catch (e) { ce = (e as Error).message }
    const tc = Date.now() - t1
    const conc = await Promise.all([0, 1, 2].map(async () => { const t = Date.now(); await s.persistence.list(); return Date.now() - t }))
    out('Y8 down: list ms', JSON.stringify(times), 'create', ce === NOT_READY ? 'NOT_READY' : ce === OUTSIDE_CASE ? 'OUTSIDE_CASE' : ce, tc, 'later concurrent lists', JSON.stringify(conc))
    await s.dispose()
    rmSync(appData, { recursive: true, force: true })
    s = await startStore(appData, home, false, { endpoint: () => undefined, onState: () => () => {} })
    const cc = await Promise.all([0, 1, 2].map(async () => { const t = Date.now(); await s.persistence.list(); return Date.now() - t }))
    out('Y8 down fresh: 3 concurrent first lists ms', JSON.stringify(cc))
    await s.dispose()
    rmSync(appData, { recursive: true, force: true })
    recentMode = 'hang'
    s = await startStore(appData, home)
    const th: number[] = []
    for (let i = 0; i < 3; i++) { const t0 = Date.now(); await s.persistence.list(); th.push(Date.now() - t0) }
    out('Y8 hang: list ms', JSON.stringify(th))
    recentMode = 'ok'
    await s.dispose()
    // B-F6：服务列一个、然后空
    rmSync(appData, { recursive: true, force: true })
    reg = []; svcOpen(C)
    s = await startStore(appData, home)
    await waitRoots(appData, C)
    await (async () => { const h = (await s.persistence.create(meta('k1', C) as never)) as unknown as H; await h.append(oneTurnLog()); await h.close() })()
    reg = []
    await s.persistence.refreshCaseRoots()
    let we = 'ok'; try { const h = (await s.persistence.open('k1', 'write')) as unknown as H; we = 'writable cwd=' + h.header.cwd; await h.close() } catch (e) { we = (e as Error).message }
    let ne = 'ok'; try { const h = (await s.persistence.create(meta('k2', C) as never)) as unknown as H; await h.close() } catch (e) { ne = (e as Error).message.slice(0, 40) }
    out('Y8 B-F6 empty: roots', JSON.stringify(new CaseRoots(appData).load().list().map((x) => x === C)), 'list', JSON.stringify((await s.persistence.list()).map((r) => r.header.id)), 'open write', we, 'create new in that case', ne)
    await s.dispose()
  }, 60000)

  it('Y9 全盘特征串：新建（带特征串）→ 复制 → 新位置打开（caseOpen）→ 立刻续写（另一特征串）+ 投影缓存 → 关 → 全盘搜', async () => {
    const SIG2 = 'RVB22-NEW-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    const pool = new MemoryMediaPool()
    const { appData, home, oldR, newR, s, b, api } = await setup(pool, false, true)
    await s.cache.write({ id: 's1', header: (await s.persistence.stat('s1'))!.header, inheritedEventCount: 0, title: 'old-title' })
    await s.persistence.list()
    cpSync(oldR, newR, { recursive: true })
    const oldHash = hashDir(oldR)
    expect((await api.caseOpen({ path: newR, template: null })).ok).toBe(true)
    const h = (await s.persistence.open('s1', 'write')) as unknown as H
    const ev = JSON.parse(JSON.stringify(oneTurnLog().slice(2)))
    const tx = JSON.stringify(ev); const ev2 = JSON.parse(tx.replace(/"text":"[^"]*"/, `"text":"${SIG2}"`))
    await h.append(ev2)
    await s.cache.write({ id: 's1', header: h.header, inheritedEventCount: 0, title: SIG2 })
    await h.close()
    await b.reg.create(newR)
    out('Y9 attach', JSON.stringify(await api.attachCaseSessions({ root: newR })))
    const rows = (await s.persistence.list()).map((r) => r.header.id + '@' + (r.header.cwd === newR ? 'new' : r.header.cwd))
    const title = s.cache.cachedSnapshot((await s.persistence.stat('s1'))!.header)?.values
    await b.dispose(); await s.dispose()
    const hitsIn = (d: string) => files(d).filter((f) => { const x = readFileSync(f); return x.includes(Buffer.from(SIG2, 'utf8')) || x.includes(Buffer.from(SIG2, 'utf16le')) }).map((f) => f.slice(tmp.length))
    out('Y9 list', JSON.stringify(rows), 'title', JSON.stringify(title), 'members new', '(after dispose n/a)')
    out('Y9 SIG2 in dsh-home', JSON.stringify(hitsIn(join(tmp, 'dsh-home'))), 'appData', JSON.stringify(hitsIn(appData)), 'old folder', JSON.stringify(hitsIn(oldR)), 'old unchanged', hashDir(oldR) === oldHash, 'ALL', JSON.stringify(hitsIn(tmp)))
    const sysTmp = tmpdir()
    const sysHits = readdirSync(sysTmp, { withFileTypes: true }).filter((e) => e.isFile()).filter((e) => { try { return readFileSync(join(sysTmp, e.name)).includes(Buffer.from(SIG2)) } catch { return false } }).length
    out('Y9 SIG2 system TEMP top-level files', sysHits)
    void home
  }, 40000)

  it('Y10 caseOpen 期间有一次打开之前发出、晚回来的刷新（途中那次与强制那次同时在飞）', async () => {
    const pool = new MemoryMediaPool()
    const { appData, oldR, newR, s, b, api } = await setup(pool, false)
    cpSync(oldR, newR, { recursive: true })
    await sleep(5200) // 过节流
    recentDelay = 1500
    void s.persistence.list() // 后台刷新发出（拿到的是打开之前的旧名单，1.5 秒后才回）
    await sleep(50)
    const t0 = Date.now()
    const r = await uiOpenCase(api, b.reg, newR)
    out('Y10', JSON.stringify(r), 'total ms', Date.now() - t0, 'roots', JSON.stringify(new CaseRoots(appData).load().list().map((x) => (x === newR ? 'new' : x === oldR ? 'old' : x))))
    recentDelay = 0
    await b.dispose(); await s.dispose()
  }, 40000)

  it('Y11 miss 节流：不存在的编号连续 stat，问服务次数；服务挂住时每次 stat 耗时', async () => {
    const pool = new MemoryMediaPool()
    const { s, b } = await setup(pool, false)
    recentHits = 0
    for (let i = 0; i < 5; i++) await s.persistence.stat('nope-' + i)
    const h1 = recentHits
    await sleep(2100)
    await s.persistence.stat('nope-x')
    out('Y11 5 quick misses -> recent hits', h1, 'after 2.1s one more ->', recentHits)
    recentMode = 'hang'
    await sleep(2100)
    const ts: number[] = []
    for (let i = 0; i < 3; i++) { const t0 = Date.now(); await s.persistence.stat('nope-h' + i); ts.push(Date.now() - t0) }
    out('Y11 hang stat ms', JSON.stringify(ts))
    recentMode = 'ok'
    await b.dispose(); await s.dispose()
  }, 40000)
})
