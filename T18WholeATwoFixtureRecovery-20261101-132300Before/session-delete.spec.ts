// T30 删除会话（DSH 补丁 P-28）：会话存储答 workspace/session-delete-check 与 workspace/session-delete，接原版 JSONL 包。
// 回收站一步用替身（真去移会动到本机回收站）：Windows 替身把目录挪进临时"回收站"，并记下交给它的路径。
// 覆盖：预检通过 / 不在案件里 / 位置没有回收站（不移、记录还在）；空会话（没落盘）放行、不调回收站；
// 案件根读不到时不当空会话；非法编号不拼缓存路径；移走后列表里没有、缓存一并移走；
// 移失败抛 TRASH_FAILED、记录原样（DSH 据此补回左栏那行）；写句柄没关的兜底关掉再移。
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { CaseRoots } from '../session-store/case-roots.ts'
import { apply as applyStore, name as storeName } from '../session-store/index.ts'
import type { Backend, Header } from '../session-store/router.ts'
import type { Run } from '../session-store/trash.ts'

const JSONL_PKG = join(__dirname, '..', '..', 'dsh', 'packages', 'session', 'session-persistence-jsonl')
const req = createRequire(join(JSONL_PKG, 'package.json'))
const CONTRACT = join(__dirname, '..', '..', 'dsh', 'packages', 'session', 'session-persistence', 'tests', 'contract.ts')
const { meta, oneTurnLog } = (await import(/* @vite-ignore */ CONTRACT)) as { meta(id: string, cwd?: string): Header; oneTurnLog(): unknown[] }
const cordis = (await import(/* @vite-ignore */ realpathSync(req.resolve('@deepseek-ai/cordis')))) as { Context: new () => any }
const Jsonl = ((await import(/* @vite-ignore */ realpathSync(join(JSONL_PKG, 'lib', 'index.js')))) as { default: unknown }).default

type W = { append(e: unknown): Promise<void>; close(): Promise<void>; flush(): Promise<void> }

let tmp: string
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'lb-t30-del-')) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

type BackendClass = new (...args: any[]) => any

/** 给原版 JSONL 类的测试装一个钩子，同时保持适配器按构造器父类求 Base 的身份。 */
function instrumentedJsonl(setup: (backend: any, root: string | undefined) => void): BackendClass {
  function InstrumentedJsonl(this: unknown, ctx: any, config: any) {
    const backend = new (Jsonl as BackendClass)(ctx, config)
    setup(backend, config?.root)
    return backend
  }
  Object.setPrototypeOf(InstrumentedJsonl, Object.getPrototypeOf(Jsonl))
  return InstrumentedJsonl as unknown as BackendClass
}

/** 起会话存储；run 是 Windows 上回收站那一步的替身（平台固定为 win32，Mac 分支见 trash.spec）。 */
async function start(caseRoot: string | readonly string[], run: Run, backend: unknown = Jsonl) {
  const appData = join(tmp, 'appdata')
  const roots = typeof caseRoot === 'string' ? [caseRoot] : caseRoot
  new CaseRoots(appData).replace(roots.map((root) => ({ root, exists: true })))
  const ctx = new cordis.Context()
  const fiber = await ctx.plugin({ name: storeName, apply: applyStore },
    { backend, defaultRoot: join(tmp, 'home'), appData, compression: 'none', trash: { platform: 'win32', run } })
  const check = (id: string): Promise<readonly string[]> =>
    ctx.waterfall('workspace/session-delete-check', { sessionId: id }, () => Promise.resolve([]))
  const del = (id: string): Promise<boolean> =>
    ctx.waterfall('workspace/session-delete', { sessionId: id }, () => Promise.resolve(false))
  return {
    persistence: ctx.sessionPersistence as Backend,
    check,
    del,
    flush: (id: string): Promise<unknown> => ctx.parallel('session/flush', { id }),
    event: (id: string, event: unknown): Promise<unknown> => ctx.parallel('session/event', { id }, event),
    dispose: () => fiber.dispose(),
  }
}

async function session(p: Backend, id: string, cwd: string, close = true): Promise<W> {
  const h = (await p.create(meta(id, cwd) as never)) as unknown as W
  await h.append(oneTurnLog())
  if (close) await h.close()
  return h
}

/** 替身回收站：把东西挪进 tmp\回收站，判盘时 E: 开头的算 U 盘。 */
function bin(): { run: Run; got: string[] } {
  const got: string[] = []
  const dir = join(tmp, '回收站'); mkdirSync(dir, { recursive: true })
  return {
    got,
    run: async (p, check) => {
      if (p.toUpperCase().startsWith('E:')) return 2
      if (check) return 0
      got.push(p)
      renameSync(p, join(dir, `${got.length}-${basename(p)}`))
      return 0
    },
  }
}

describe('会话存储答删除会话两个事件（接原版 JSONL 包）', () => {
  it('预检通过、移走：记录目录与会话缓存进回收站，列表里没有了', async () => {
    const caseRoot = join(tmp, '刑事-虚构甲'); mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, 'keep', caseRoot)
      await session(s.persistence, 'gone', caseRoot)
      const cache = join(caseRoot, '工作区', '会话缓存'); mkdirSync(cache, { recursive: true })
      writeFileSync(join(cache, 'gone.json'), '{}')
      expect(await s.check('gone')).toEqual([])
      expect(await s.del('gone')).toBe(true)
      expect(b.got).toHaveLength(2)
      expect(b.got[0]).toContain(join(caseRoot, '工作区', '会话'))
      expect(b.got[1]).toBe(join(cache, 'gone.json'))
      expect((await s.persistence.list()).map((r) => r.header.id)).toEqual(['keep'])
      expect(await s.persistence.stat('gone')).toBeUndefined()
      expect(await s.check('gone')).toEqual(['NOT_FOUND'])
    } finally { await s.dispose() }
  })

  it('位置没有回收站（U 盘）、不在案件里：预检给原因码，硬移也拒，记录原样', async () => {
    const caseRoot = join(tmp, '民事-虚构乙'); mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, async (p, check) => (p.startsWith(join(tmp, '民事')) ? 2 : b.run(p, check)))
    try {
      await session(s.persistence, 'usb', caseRoot)
      expect(await s.check('usb')).toEqual(['NO_RECYCLE_BIN'])
      await expect(s.del('usb')).rejects.toMatchObject({ code: 'NO_RECYCLE_BIN' })
      expect((await s.persistence.list()).map((r) => r.header.id)).toEqual(['usb'])
      expect(b.got).toEqual([])
      expect(await s.check('nowhere')).toEqual(['NOT_FOUND'])
    } finally { await s.dispose() }
  })

  it('移失败：抛 TRASH_FAILED，记录原样、还能列出', async () => {
    const caseRoot = join(tmp, '刑事-虚构丙'); mkdirSync(caseRoot)
    const s = await start(caseRoot, async (_p, check) => (check ? 0 : 1))
    try {
      await session(s.persistence, 'locked', caseRoot)
      expect(await s.check('locked')).toEqual([])
      await expect(s.del('locked')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect((await s.persistence.list()).map((r) => r.header.id)).toEqual(['locked'])
    } finally { await s.dispose() }
  })

  it('空会话（新建后没说过话，原版还没落盘）：预检放行，删除不调回收站直接算成，之后找不到', async () => {
    const caseRoot = join(tmp, '刑事-虚构戊'); mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      const h = (await s.persistence.create(meta('blank', caseRoot) as never)) as unknown as W
      expect(await s.check('blank')).toEqual([])
      await h.close() // DSH 释放会话时关写句柄；没写过东西，原版不落盘
      expect(await s.del('blank')).toBe(true)
      expect(b.got).toEqual([])
      expect(await s.check('blank')).toEqual(['NOT_FOUND'])
    } finally { await s.dispose() }
  })

  it.each([
    ['list', 'missing'],
    ['read-open', 'missing'],
    ['stat', 'missing'],
    ['list', 'existing'],
    ['read-open', 'existing'],
    ['stat', 'existing'],
  ] as const)('从未落盘的空会话经 %s 后仍可删除（%s 会话根）', async (action: 'list' | 'read-open' | 'stat', root: 'missing' | 'existing') => {
    const caseRoot = join(tmp, '刑事-虚构待落盘')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      if (root === 'existing') await session(s.persistence, 'other', caseRoot)
      const h = (await s.persistence.create(meta('blank', caseRoot) as never)) as unknown as W
      if (action === 'list') {
        expect((await s.persistence.list()).map((r) => r.header.id)).toContain('blank')
      } else if (action === 'read-open') {
        const reader = (await s.persistence.open('blank', 'read')) as unknown as W
        await reader.close()
      } else {
        expect(await s.persistence.stat('blank')).toMatchObject({ header: { id: 'blank' } })
        expect((await s.persistence.stat('blank'))?.sizeBytes).toBeUndefined()
      }
      await h.close()
      expect(await s.check('blank')).toEqual([])
      expect(await s.del('blank')).toBe(true)
      expect(b.got).toEqual([])
      expect(await s.check('blank')).toEqual(['NOT_FOUND'])
    } finally { await s.dispose() }
  })

  it('handle.flush 后 stat 已确认落盘：暂移子记录再关闭，拒绝删除并保留缓存归属，恢复后可列出', async () => {
    const caseRoot = join(tmp, '民事-虚构显式落盘')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      const h = (await s.persistence.create(meta('flushed', caseRoot) as never)) as unknown as W
      await h.flush()
      const snapshot = await s.persistence.stat('flushed')
      expect(snapshot?.sizeBytes).toBeGreaterThan(0)
      const sessionRoot = join(caseRoot, '工作区', '会话')
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'flushed')
      const backup = join(tmp, '显式落盘-暂移')
      renameSync(record, backup)
      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, 'flushed.json')
      writeFileSync(cached, '{}')

      await h.close()
      expect(await s.check('flushed')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('flushed')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      expect(existsSync(cached)).toBe(true)

      renameSync(backup, record)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('flushed')
    } finally { await s.dispose() }
  })

  it('真实 session/flush 绕过 router.flush 但已落盘：暂移子记录再关闭，拒绝删除并保留缓存归属，恢复后可列出', async () => {
    const caseRoot = join(tmp, '民事-虚构事件落盘')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      const h = (await s.persistence.create(meta('event-flushed', caseRoot) as never)) as unknown as W
      await s.flush('event-flushed')
      const sessionRoot = join(caseRoot, '工作区', '会话')
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'event-flushed')
      const backup = join(tmp, '事件落盘-暂移')
      renameSync(record, backup)
      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, 'event-flushed.json')
      writeFileSync(cached, '{}')

      await h.close()
      expect(await s.check('event-flushed')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('event-flushed')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      expect(existsSync(cached)).toBe(true)

      renameSync(backup, record)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('event-flushed')
    } finally { await s.dispose() }
  })

  it('原版自动事件批量落盘：暂移子记录再关闭，拒绝删除并保留缓存归属', async () => {
    const caseRoot = join(tmp, '民事-虚构自动落盘')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      const h = (await s.persistence.create(meta('auto-flushed', caseRoot) as never)) as unknown as W
      await s.event('auto-flushed', oneTurnLog()[0])
      const sessionRoot = join(caseRoot, '工作区', '会话')
      await expect.poll(() => {
        if (!existsSync(sessionRoot)) return false
        return readdirSync(sessionRoot).some((project) => existsSync(join(sessionRoot, project, 'auto-flushed')))
      }, { timeout: 2000 }).toBe(true)
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'auto-flushed')
      const backup = join(tmp, '自动落盘-暂移')
      await expect.poll(() => {
        try {
          renameSync(record, backup)
          return true
        } catch {
          return false
        }
      }, { timeout: 2000 }).toBe(true)

      await h.close()
      expect(await s.check('auto-flushed')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('auto-flushed')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
    } finally { await s.dispose() }
  })

  it('drain 已物化后核验读 EIO 不倒退事实：暂移记录后拒绝、不回收、缓存保留、恢复可列出', async () => {
    const caseRoot = join(tmp, '民事-虚构drain成功读故障')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      const h = (await s.persistence.create(meta('drained', caseRoot) as never)) as unknown as W & {
        read(...args: unknown[]): Promise<unknown>
      }
      h.read = async () => {
        throw Object.assign(new Error('injected read EIO after successful drain'), { code: 'EIO' })
      }
      await s.event('drained', oneTurnLog()[0])
      await h.close()

      const sessionRoot = join(caseRoot, '工作区', '会话')
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'drained')
      expect(readdirSync(record).some((name) => name.endsWith('.jsonl'))).toBe(true)
      const backup = join(tmp, 'drain成功读故障-暂移')
      renameSync(record, backup)

      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, 'drained.json')
      writeFileSync(cached, '{}')

      expect(await s.check('drained')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('drained')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      expect(existsSync(cached)).toBe(true)

      renameSync(backup, record)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('drained')
    } finally { await s.dispose() }
  })

  it('同一次 drain 前批落盘后批失败：关闭释放后仍拒绝删除、不回收、缓存原位、恢复可列出', async () => {
    const caseRoot = join(tmp, '民事-虚构部分落盘')
    mkdirSync(caseRoot)
    const b = bin()
    let backend: any
    const Backend = instrumentedJsonl((candidate, root) => {
      if (root === join(caseRoot, '工作区', '会话')) backend = candidate
    })
    const s = await start(caseRoot, b.run, Backend)
    try {
      const id = 'partial-drain'
      const h = (await s.persistence.create(meta(id, caseRoot) as never)) as unknown as W & {
        drainLive(): Promise<void>
      }
      const persist = backend.persistBatch.bind(backend)
      let committed = 0
      let record = ''
      let backup = ''
      backend.persistBatch = async (...args: unknown[]) => {
        if (committed > 0) throw Object.assign(new Error('injected second batch EIO'), { code: 'EIO' })
        await persist(...args)
        committed += 1
        const sessionRoot = join(caseRoot, '工作区', '会话')
        record = join(sessionRoot, readdirSync(sessionRoot)[0]!, id)
        backup = join(tmp, '部分落盘-暂移')
        renameSync(record, backup)
        await s.event(id, oneTurnLog()[1])
      }

      await s.event(id, oneTurnLog()[0])
      await expect(h.drainLive()).rejects.toMatchObject({ code: 'EIO' })
      expect(committed).toBe(1)
      expect(readdirSync(backup).some((name) => name.endsWith('.jsonl'))).toBe(true)
      await expect(h.close()).rejects.toMatchObject({ code: 'EIO' })

      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, `${id}.json`)
      writeFileSync(cached, '{}')

      const before = await s.check(id)
      let deletion: boolean | { code?: string } = false
      try {
        deletion = await s.del(id)
      } catch (error) {
        deletion = { code: (error as { code?: string }).code }
      }
      const trashCount = b.got.length
      const cacheRetained = existsSync(cached)

      renameSync(backup, record)
      const reopened = (await s.persistence.open(id, 'write')) as unknown as W
      await reopened.close()
      const restored = (await s.persistence.list()).map((r) => r.header.id)

      expect(before).toEqual(['RECORD_UNREADABLE'])
      expect(deletion).toMatchObject({ code: 'TRASH_FAILED' })
      expect(trashCount).toBe(0)
      expect(cacheRetained).toBe(true)
      expect(restored).toContain(id)
    } finally { await s.dispose() }
  })

  it('已有落盘历史后重新 open：补充 stat 暂缺不能重授予空资格，拒绝且缓存归属不变', async () => {
    const caseRoot = join(tmp, '民事-虚构重新打开')
    mkdirSync(caseRoot)
    const b = bin()
    let backend: any
    const Backend = instrumentedJsonl((candidate, root) => {
      if (root === join(caseRoot, '工作区', '会话')) backend = candidate
    })
    const s = await start(caseRoot, b.run, Backend)
    try {
      await session(s.persistence, 'persisted', caseRoot)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('persisted')

      const sessionRoot = join(caseRoot, '工作区', '会话')
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'persisted')
      const backup = join(tmp, '重新打开-暂移')
      const open = backend.open.bind(backend)
      let moved = false
      backend.open = async (...args: unknown[]) => {
        const h = await open(...args)
        if (!moved && args[0] === 'persisted') {
          moved = true
          renameSync(record, backup)
        }
        return h
      }

      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, 'persisted.json')
      writeFileSync(cached, '{}')

      const reopened = (await s.persistence.open('persisted', 'write')) as unknown as W
      await reopened.close()
      expect(moved).toBe(true)
      expect(await s.check('persisted')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('persisted')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      expect(existsSync(cached)).toBe(true)

      renameSync(backup, record)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('persisted')
    } finally { await s.dispose() }
  })

  it.each([
    ['取消', (controller: AbortController) => controller.abort(), { name: 'AbortError' }],
    ['stat EIO', () => Object.assign(new Error('injected post-open stat EIO'), { code: 'EIO' }), { code: 'EIO' }],
  ] as const)('open 成功后补充 stat %s：关闭已取得句柄并传播原错，重试可成功', async (
    _label: string,
    fail: (controller: AbortController) => void | Error,
    expected: Record<string, string>,
  ) => {
    const caseRoot = join(tmp, `民事-虚构打开失败-${_label}`)
    mkdirSync(caseRoot)
    const b = bin()
    let backend: any
    const Backend = instrumentedJsonl((candidate, root) => {
      if (root === join(caseRoot, '工作区', '会话')) backend = candidate
    })
    const s = await start(caseRoot, b.run, Backend)
    try {
      await session(s.persistence, 'retryable', caseRoot)
      const controller = new AbortController()
      let armed = false
      let inject = true
      const open = backend.open.bind(backend)
      const stat = backend.stat.bind(backend)
      backend.open = async (...args: unknown[]) => {
        const h = await open(...args)
        if (inject && args[0] === 'retryable') {
          inject = false
          armed = true
        }
        return h
      }
      backend.stat = async (...args: unknown[]) => {
        if (armed && args[0] === 'retryable') {
          armed = false
          const failure = fail(controller)
          if (failure) throw failure
        }
        return stat(...args)
      }

      await expect(s.persistence.open('retryable', 'write', { signal: controller.signal }))
        .rejects.toMatchObject(expected)
      const retry = (await s.persistence.open('retryable', 'write')) as unknown as W
      await retry.close()
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('retryable')
    } finally { await s.dispose() }
  })

  it('open 重定位到第二实例后 stat 失败：同样关闭第二句柄，重试可成功', async () => {
    const first = join(tmp, '民事-虚构重定位甲')
    const second = join(tmp, '民事-虚构重定位乙')
    mkdirSync(first)
    mkdirSync(second)
    const b = bin()
    const backends = new Map<string, any>()
    const Backend = instrumentedJsonl((candidate, root) => {
      if (root === join(first, '工作区', '会话')) backends.set('first', candidate)
      if (root === join(second, '工作区', '会话')) backends.set('second', candidate)
    })
    const s = await start([first, second], b.run, Backend)
    try {
      await session(s.persistence, 'moved', first)
      await session(s.persistence, 'moved', second)
      expect((await s.persistence.list()).filter((r) => r.header.id === 'moved')).toHaveLength(1)

      const firstRoot = join(first, '工作区', '会话')
      const firstRecord = join(firstRoot, readdirSync(firstRoot)[0]!, 'moved')
      renameSync(firstRecord, join(tmp, '第一实例记录-暂移'))

      const secondBackend = backends.get('second')
      const open = secondBackend.open.bind(secondBackend)
      const stat = secondBackend.stat.bind(secondBackend)
      let armed = false
      let inject = true
      secondBackend.open = async (...args: unknown[]) => {
        const h = await open(...args)
        if (inject && args[0] === 'moved') {
          inject = false
          armed = true
        }
        return h
      }
      secondBackend.stat = async (...args: unknown[]) => {
        if (armed && args[0] === 'moved') {
          armed = false
          throw Object.assign(new Error('injected reattach stat EIO'), { code: 'EIO' })
        }
        return stat(...args)
      }

      await expect(s.persistence.open('moved', 'write')).rejects.toMatchObject({ code: 'EIO' })
      const retry = (await s.persistence.open('moved', 'write')) as unknown as W
      await retry.close()
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('moved')
    } finally { await s.dispose() }
  })

  it('案件根读不到（拔盘、搬走、权限错误等）：不当空会话，预检拒绝、硬删也拒，记录归属保留', async () => {
    const caseRoot = join(tmp, '民事-虚构读不到'); mkdirSync(caseRoot)
    const moved = join(tmp, '民事-虚构读不到-暂移')
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, 'unreadable', caseRoot)
      renameSync(caseRoot, moved)
      expect(await s.check('unreadable')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('unreadable')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      renameSync(moved, caseRoot)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('unreadable')
    } finally { await s.dispose() }
  })

  it('会话根本身读取异常（不是 ENOENT）：不当空会话，移回目录后记录仍在', async () => {
    const caseRoot = join(tmp, '民事-虚构异常'); mkdirSync(caseRoot)
    const sessionRoot = join(caseRoot, '工作区', '会话')
    const backup = join(tmp, '会话备份')
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, 'io-error', caseRoot)
      renameSync(sessionRoot, backup)
      writeFileSync(sessionRoot, 'not a directory')
      expect(await s.check('io-error')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('io-error')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      rmSync(sessionRoot, { force: true })
      renameSync(backup, sessionRoot)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('io-error')
    } finally { await s.dispose() }
  })

  it.each([
    ['会话根 ENOENT', 'root'],
    ['子记录缺失', 'record'],
  ] as const)('已持久化的会话在%s时不当空会话：拒绝、不回收、缓存归属不变、恢复后可列出', async (_label: string, missing: 'root' | 'record') => {
    const caseRoot = join(tmp, '民事-虚构已落盘')
    mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, 'persisted', caseRoot)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('persisted')
      await s.persistence.open('persisted', 'read')

      const sessionRoot = join(caseRoot, '工作区', '会话')
      const record = join(sessionRoot, readdirSync(sessionRoot)[0]!, 'persisted')
      const backup = join(tmp, `暂移-${missing}`)
      renameSync(missing === 'root' ? sessionRoot : record, backup)

      const cache = join(caseRoot, '工作区', '会话缓存')
      mkdirSync(cache, { recursive: true })
      const cached = join(cache, 'persisted.json')
      writeFileSync(cached, '{}')

      expect(await s.check('persisted')).toEqual(['RECORD_UNREADABLE'])
      await expect(s.del('persisted')).rejects.toMatchObject({ code: 'TRASH_FAILED' })
      expect(b.got).toEqual([])
      expect(existsSync(cached)).toBe(true)

      renameSync(backup, missing === 'root' ? sessionRoot : record)
      expect((await s.persistence.list()).map((r) => r.header.id)).toContain('persisted')
    } finally { await s.dispose() }
  })

  it('非法会话编号不拼缓存路径：只移记录，不移动案件工作区里的其他文件', async () => {
    const caseRoot = join(tmp, '刑事-虚构编号'); mkdirSync(caseRoot)
    const id = '../outside'
    const outside = join(caseRoot, '工作区', 'outside.json')
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, id, caseRoot)
      mkdirSync(join(caseRoot, '工作区'), { recursive: true })
      writeFileSync(outside, '{"虚构":true}')
      expect(await s.del(id)).toBe(true)
      expect(b.got).toHaveLength(1)
      expect(b.got[0]).toContain(join(caseRoot, '工作区', '会话'))
      expect(existsSync(outside)).toBe(true)
    } finally { await s.dispose() }
  })

  it('写句柄还没关（DSH 没释放到）：先兜底关掉再移，之后写不进旧处', async () => {
    const caseRoot = join(tmp, '刑事-虚构丁'); mkdirSync(caseRoot)
    const b = bin()
    const s = await start(caseRoot, b.run)
    try {
      await session(s.persistence, 'open', caseRoot, false)
      expect(await s.del('open')).toBe(true)
      expect(b.got).toHaveLength(1)
      const left = join(caseRoot, '工作区', '会话')
      const stillThere = existsSync(left) ? readdirSync(left, { recursive: true }).filter((n) => String(n).includes('open')) : []
      expect(stillThere).toEqual([])
    } finally { await s.dispose() }
  })
})
