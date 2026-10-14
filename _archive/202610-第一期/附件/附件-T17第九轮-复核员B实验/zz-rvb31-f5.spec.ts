// 复核员 B 第九轮：接回 open 到时后，原来那次 open 迟到返回的句柄有没有人关；接回 read 到时后 close 挂住会不会卡住 recheck 队列。只在实验副本。
import { mkdirSync, mkdtempSync, rmSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SessionRouter } from '../session-store/router.ts'

const OUT = join(__dirname, '..', '..', '..', 'rvb31-f5.txt')
const P = (k: string, v: unknown) => appendFileSync(OUT, `${k} = ${JSON.stringify(v)}\n`)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function setup(tmp: string, mode: { openDelay?: number; readHang?: boolean; closeHangAfter?: number }) {
  const OLD = join(tmp, 'old'); mkdirSync(join(OLD, '工作区', '会话', 'proj', 's1'), { recursive: true })
  let list = [OLD]
  const roots: any = { list: () => list, has: (r: string) => list.includes(r), match: (c?: string) => list.find((r) => c?.startsWith(r)) }
  const opened: any[] = []
  let closes = 0
  let n = 0
  const backend = {
    async create(h: any) { const x = { id: h.id, header: h, access: 'write', close: async () => { closes++ }, read: async () => ({ events: [] }) }; opened.push(x); return x },
    async open(id: string, access: string) {
      const k = ++n
      if (k > 1 && mode.openDelay) await sleep(mode.openDelay)
      const x = { id, header: { id, cwd: OLD }, access, k,
        close: async () => { if (mode.closeHangAfter && k > 1) await new Promise(() => {}); closes++ },
        read: async () => { if (mode.readHang && k > 1) await new Promise(() => {}); return { events: [] } } }
      opened.push(x); return x
    },
    async flush() {}, async stat(id: string) { return { header: { id, cwd: OLD } } }, async list() { return [] },
  }
  const router = new SessionRouter((root: string) => ({ ...backend, stat: async (id: string) => (root.includes('工作区') ? { header: { id, cwd: OLD } } : undefined) }) as any, roots, { defaultRoot: join(tmp, 'home'), allowOutsideCase: false, caseRootTimeoutMs: 100, liveSeq: () => 0, log: () => {} })
  return { router, OLD, setList: (l: string[]) => { list = l }, opened, closes: () => closes }
}

it('F5a 接回 open 到时之后迟到的句柄', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'rvb31f5-'))
  try {
    const { router, OLD, setList, opened, closes } = setup(tmp, { openDelay: 400 })
    await router.open('s1', 'write')
    setList([]) // 复制后在别处打开：根不在名单、还在盘上 → 放下
    await router.recheck('s1')
    const afterDetach = { moved: router.caseMoved('s1'), closes: closes() }
    setList([OLD]) // 根回到名单 → 接回，open 迟到 400ms，上限 100ms
    await router.recheck('s1')
    const atTimeout = { moved: router.caseMoved('s1'), opened: opened.length }
    await sleep(600)
    P('F5a', { afterDetach, atTimeout, later: { opened: opened.length, closes: closes(), moved: router.caseMoved('s1') } })
  } finally { rmSync(tmp, { recursive: true, force: true }) }
})

it('F5b 接回 read 到时后关新句柄挂住：recheck 是否返回、同一会话下一次 recheck 是否被卡', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'rvb31f5-'))
  try {
    const { router, OLD, setList } = setup(tmp, { readHang: true, closeHangAfter: 1 })
    await router.open('s1', 'write')
    setList([]); await router.recheck('s1')
    setList([OLD])
    const t0 = Date.now()
    const r1 = Promise.race([router.recheck('s1').then(() => 'returned'), sleep(2000).then(() => 'STILL-WAITING-2s')])
    const v1 = await r1
    const r2 = await Promise.race([router.recheck('s1').then(() => 'returned'), sleep(1000).then(() => 'STILL-WAITING-1s')])
    P('F5b', { first: v1, ms: Date.now() - t0, second: r2 })
  } finally { rmSync(tmp, { recursive: true, force: true }) }
})
