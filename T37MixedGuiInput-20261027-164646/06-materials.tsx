// 右侧栏"材料"标签（PRD 7.9；Spec U-12、F-MAT-*）：材料列表与状态、导入和拖入、提交识别、识别进度、wiki 内容与建议。
// 生成 / 更新 wiki 的入口在输入区 Skill 胶囊；本页只保留已有内容浏览、运行进度、停止和建议采纳。
// 发往服务器的操作都先弹确认框（工单第 3 步、Q10）。不显示"去水印"（第 5a 步）。
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { DEFAULT_TARGET, scanMaterials, startImport, TABS } from './cases.ts'
import { WikiCard } from './wiki-card.tsx'
import { citationTargets, errorText, shouldNotifyWikiDone, ocrConfirmText, pageRanges, parsePageRanges, STATUS_WORD, TYPE_WORD, UNIT_WORD, type Material } from './format.ts'
import { Badge, Button, C, caseEvent, Empty, ErrorLine, getNav, Loading, S, Section, useLoad } from './kit.tsx'
import { announceOcrDone, claimOcrNotification, OCR_STARTED } from './ocr-watch.ts'
import { call, confirm, notice, type CaseRef } from './state.ts'
import { WithCase, type SessionProps } from './session-case.tsx'
import { charsText, ocrEligible, ocrTargets } from './estimate.ts'
import { openCaseFolder, relocateMaterial, removeMaterial } from './folder-actions.ts'

const POLL_MS = 3000

/** 系统通知（U-7）：只写"识别任务已完成 / 整理任务已完成"，不带材料名、案件名。 */
export function osNotify(text: '识别任务已完成' | '整理任务已完成'): void {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') new Notification(text)
    else if (Notification.permission !== 'denied') void Notification.requestPermission().then((p) => { if (p === 'granted') new Notification(text) })
  } catch { /* 系统不支持通知时不提示 */ }
}

type TabInfo = { tab: { navigation: { params?: Record<string, unknown>; revision?: number } } }

export function MaterialsTab(p: SessionProps & { useTabInfo?: () => TabInfo }) {
  const params = (p.useTabInfo?.().tab.navigation.params ?? {}) as { ocr?: string; at?: string }
  // 运行前提示点了"去识别"（令 1257 第 1 条）：带 ocr=pending 打开，每次的 at 不同
  return <WithCase p={p}>{(c) => <Materials caseRef={c} ocrRequest={params.ocr === 'pending' ? params.at ?? 'pending' : undefined} />}</WithCase>
}

interface OcrJob { job_id: string; material_id: string; name: string; status: 'queued' | 'running' | 'paused' | 'done' | 'cancelled' | 'partial_failed'; pause_reason: string | null; total: number; done: number; failed: number }
interface Task { task_id: string; skill: string | null; status: string }
interface Suggestion { id: string; field: string; value: string; source: string; reason: string | null; status: string }

const JOB_WORD: Record<OcrJob['status'], string> = { queued: '排队中', running: '识别中', paused: '已暂停', done: '已完成', cancelled: '已取消', partial_failed: '部分页失败' }
const PAUSE_WORD: Record<string, string> = { offline: '网络断开', prep_down: '识别服务器不可用', key_invalid: 'Key 无效', app_exit: '软件关闭' }

/** 材料页的内容（已知是哪个案件）；导出给界面用例直接渲染。 */
export function Materials({ caseRef, ocrRequest, embedded = false }: { caseRef: CaseRef; ocrRequest?: string; embedded?: boolean }) {
  const id = caseRef.case_id
  const [showRemoved, setShowRemoved] = useState(false)
  // 正在移除的材料（从点下去到服务答复为止）：按钮置灰，连点不重复问、不重复发（rv 1.4 客户端 P3-1）
  const removingNow = useRef(new Set<string>())
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set())
  const remove = (m: Material) => {
    if (removingNow.current.has(m.material_id)) return
    removingNow.current.add(m.material_id)
    setRemoving(new Set(removingNow.current))
    void removeMaterial(caseRef, m).then((done) => { if (done) void reloadMats() }).finally(() => {
      removingNow.current.delete(m.material_id)
      setRemoving(new Set(removingNow.current))
    })
  }
  // 同一引用根的材料共用一个重定位操作；请求在途时整组按钮置灰，连点不重复发。
  const relocatingNow = useRef(new Set<string>())
  const [relocating, setRelocating] = useState<ReadonlySet<string>>(new Set())
  interface FilePick { token: number; caseRef: CaseRef; material: Material; resolve: (done: boolean | PromiseLike<boolean>) => void }
  const filePick = useRef<FilePick | null>(null)
  const filePickSeq = useRef(0)
  const finishFilePick = useCallback((token: number, path?: string) => {
    const pick = filePick.current
    if (!pick || pick.token !== token) return
    filePick.current = null
    pick.resolve(path ? relocateMaterial(pick.caseRef, pick.material, path) : false)
  }, [])
  const busyRelocate = (m: Material, run: () => Promise<boolean>) => {
    const refId = m.ref_id
    if (!refId || relocatingNow.current.has(refId)) return
    relocatingNow.current.add(refId)
    setRelocating(new Set(relocatingNow.current))
    void run().finally(() => {
      relocatingNow.current.delete(refId)
      setRelocating(new Set(relocatingNow.current))
    })
  }
  const relocateTo = (m: Material, path: string) => {
    if (!path) return
    return relocateMaterial(caseRef, m, path)
  }
  const pickRelocateFolder = async (m: Material) => {
    if (!m.ref_id || relocatingNow.current.has(m.ref_id)) return
    busyRelocate(m, async () => {
      try {
        const path = await getNav().pickDirectory()
        return path ? relocateTo(m, path)! : false
      } catch {
        notice('重新定位没有完成', '选择新位置时出错，请重试。')
        return false
      }
    })
  }
  const pickRelocateFile = (m: Material) => {
    if (!m.ref_id || relocatingNow.current.has(m.ref_id) || filePick.current) return
    busyRelocate(m, () => new Promise<boolean>((resolve) => {
      const token = ++filePickSeq.current
      filePick.current = { token, caseRef, material: m, resolve }
      const input = relocateFileInput.current
      if (!input) {
        finishFilePick(token)
        notice('重新定位没有完成', '没有可用的文件选择器，请重试。')
        return
      }
      try {
        input.click()
      } catch {
        finishFilePick(token)
        notice('重新定位没有完成', '打开文件选择器失败，请重试。')
      }
    }))
  }
  const [mats, reloadMats] = useLoad(() => call<{ materials: Material[] }>('materialsList', { case_id: id, include_removed: 'true' }), [id])
  const [jobs, reloadJobs] = useLoad(() => call<{ jobs: OcrJob[] }>('ocrList', { case_id: id }), [id], POLL_MS)
  const [over, setOver] = useState(false)
  const [ocrFor, setOcrFor] = useState<Material[] | null>(null)
  // "去识别"：材料读到后弹出待识别页的提交框（每个请求只弹一次）
  const handledOcr = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!ocrRequest || handledOcr.current === ocrRequest || mats.state !== 'ok') return
    handledOcr.current = ocrRequest
    const pending = ocrTargets(mats.value.materials)
    if (pending.length) setOcrFor(pending)
  }, [ocrRequest, mats])
  const fileInput = useRef<HTMLInputElement>(null)
  const relocateFileInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const input = relocateFileInput.current
    if (!input) return
    const onCancel = () => {
      const pick = filePick.current
      if (pick) finishFilePick(pick.token)
    }
    input.addEventListener('cancel', onCancel)
    return () => input.removeEventListener('cancel', onCancel)
  }, [finishFilePick])
  useEffect(() => () => {
    const pick = filePick.current
    if (pick) finishFilePick(pick.token)
  }, [id, finishFilePick])

  // 导入完成后刷新；识别任务从进行中变成完成时刷新材料并发系统通知
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === id) { void reloadMats(); void reloadJobs() } }
    window.addEventListener('lawbench:materials-changed', on)
    return () => window.removeEventListener('lawbench:materials-changed', on)
  }, [id, reloadMats, reloadJobs])
  const prevJobs = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    if (jobs.state !== 'ok') return
    const before = prevJobs.current
    const finished: string[] = []
    for (const j of jobs.value.jobs) {
      const was = before.get(j.job_id)
      if ((was === 'running' || was === 'queued') && (j.status === 'done' || j.status === 'partial_failed')) finished.push(j.job_id)
    }
    prevJobs.current = new Map(jobs.value.jobs.map((j) => [j.job_id, j.status]))
    // 识别完成：系统通知按案件和任务认领；"材料变了"另按事件去重，watcher 先发时这里仍能补通知
    if (finished.length) {
      if (claimOcrNotification(id, finished)) osNotify('识别任务已完成')
      announceOcrDone(id, finished)
    }
  }, [jobs, reloadMats])

  const importPaths = (paths: string[]) => startImport(caseRef, paths, '材料面板')
  // 拦在这里、不再冒泡：DSH 在 document 上监听拖入，放过去会被当成聊天附件收下（D13 不允许）
  const onDrop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setOver(false); importPaths([...e.dataTransfer.files].map((f) => getNav().pathFor(f))) }
  const pickFolder = async () => { const d = await getNav().pickDirectory(); if (d) importPaths([d]) }
  // 扫描、说明结果、刷新列表都在 scanMaterials 里（拖文件夹建成案件后也用它，令 1651）
  const rescan = () => scanMaterials(caseRef)
  const pendingMaterials = mats.state === 'ok'
    ? mats.value.materials.filter((m) => ocrEligible(m) && m.pages_need_ocr.length > 0)
    : []

  return (
    <div style={{ ...S.pane, ...(embedded ? { height: 'auto', overflow: 'visible', padding: 0 } : {}), outline: over ? `2px dashed ${C.brand}` : 'none', outlineOffset: -4 }}
      data-lawbench-drop='' onDragEnter={(e) => e.stopPropagation()} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true) }} onDragLeave={(e) => { e.stopPropagation(); setOver(false) }} onDrop={onDrop}>
      {!embedded ? <div style={S.between}>
        <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{caseRef.name}</div><div style={S.sub}>拖入文件或文件夹即登记为本案材料引用；外部原件不复制。</div></div>
      </div> : null}
      <div style={{ ...S.row, flexWrap: 'wrap' }}>
        <Button size="sm" variant="primary" onClick={() => fileInput.current?.click()}>导入文件…</Button>
        <Button size="sm" variant="outline" onClick={() => void pickFolder()}>导入文件夹…</Button>
        <Button size="sm" variant="ghost" onClick={() => void rescan()}>重新扫描</Button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => { importPaths([...(e.target.files ?? [])].map((f) => getNav().pathFor(f))); e.target.value = '' }} />
        <input ref={relocateFileInput} type="file" hidden onChange={(e) => {
          const pick = filePick.current
          const path = e.target.files?.[0] ? getNav().pathFor(e.target.files[0]) : ''
          e.target.value = ''
          if (pick) finishFilePick(pick.token, path || undefined)
        }} />
      </div>

      {/* 令 1852 第 18 条：案件 wiki 内容仍在材料页；生成 / 更新入口已迁到输入区 Skill 胶囊。 */}
      <WikiSection caseRef={caseRef} materials={mats.state === 'ok' ? mats.value.materials : []} />

      <Section title="材料" extra={<div style={{ ...S.row, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {embedded && mats.state === 'ok' ? <span style={S.sub}>待识别 {pendingMaterials.length} 份</span> : null}
        <Button size="sm" variant="ghost" onClick={() => void openCaseFolder(caseRef, 'materials')}>打开所在文件夹</Button>
        {mats.state === 'ok' && pendingMaterials.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setOcrFor(pendingMaterials)}>待识别页全部提交…</Button>
        ) : null}
      </div>}>
        <Loading data={mats}>{(v) => {
          // 契约 1.4：已移除的材料（服务通常不再列出；列出来的标"已移除"）默认收起，可以点开看
          const gone = v.materials.filter((m) => m.status === 'removed').length
          const shown = showRemoved ? v.materials : v.materials.filter((m) => m.status !== 'removed')
          return v.materials.length === 0 ? <Empty>还没有材料。点"导入文件"或把文件拖进来。</Empty> : (
            <>
              <ul style={S.list}>{shown.map((m) => (
                <MaterialRow
                  key={m.material_id}
                  m={m}
                  onOcr={() => setOcrFor([m])}
                  removing={removing.has(m.material_id)}
                  relocating={!!m.ref_id && relocating.has(m.ref_id)}
                  onRemove={() => remove(m)}
                  onRelocateFolder={() => void pickRelocateFolder(m)}
                  onRelocateFile={() => pickRelocateFile(m)}
                />
              ))}</ul>
              {gone ? <div style={{ ...S.between, marginTop: 6 }}><span style={S.sub}>已移除 {gone} 份</span><Button size="sm" variant="ghost" onClick={() => setShowRemoved(!showRemoved)}>{showRemoved ? '隐藏已移除的' : '显示已移除的'}</Button></div> : null}
            </>
          )
        }}</Loading>
      </Section>

      <Section title="识别进度">
        <Loading data={jobs}>{(v) => v.jobs.length === 0 ? <Empty>没有识别任务</Empty> : (
          <ul style={S.list}>{v.jobs.map((j) => <JobRow key={j.job_id} j={j} onChanged={() => void reloadJobs()} />)}</ul>
        )}</Loading>
      </Section>

      {ocrFor ? <OcrDialog caseRef={caseRef} materials={ocrFor} onClose={() => setOcrFor(null)} onDone={() => { setOcrFor(null); void reloadJobs(); void reloadMats() }} /> : null}
    </div>
  )
}

function MaterialRow({ m, removing, relocating, onOcr, onRemove, onRelocateFolder, onRelocateFile }: {
  m: Material
  removing: boolean
  relocating: boolean
  onOcr: () => void
  onRemove: () => void
  onRelocateFolder: () => void
  onRelocateFile: () => void
}) {
  const isRef = m.origin === 'ref'
  const tone = m.status === 'parsed' ? 'ok' : m.status === 'removed' ? 'info' : m.status === 'failed' || m.status === 'source_deleted' || m.status === 'missing' ? 'err' : m.status === 'ocr_running' ? 'info' : 'warn'
  return (
    <li style={{ ...S.card, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={S.between}>
        <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{m.name}</span>
        <span style={S.row}>
          {isRef ? <Badge tone="info">引用</Badge> : null}
          <Badge tone={tone}>{STATUS_WORD[m.status]}</Badge>
        </span>
      </div>
      <div style={S.sub}>{TYPE_WORD[m.type] ?? m.type} · {m.unit_count} {UNIT_WORD[m.unit]}{typeof m.chars === 'number' && m.chars > 0 ? ` · ${charsText(m.chars)}` : ''} · {m.rel_path}</div>
      {isRef ? <div style={S.sub}>引用根 {m.ref_id ?? '未知'}{m.location ? ` · ${m.location}` : ''}</div> : null}
      {m.error ? <div style={{ color: C.err, fontSize: 12 }}>原因：{m.error}</div> : null}
      {m.stale_ocr ? <div style={{ color: C.warn, fontSize: 12 }}>原件变了，识别结果需要重新识别</div> : null}
      {m.pages_mixed.length ? <div style={S.sub}>图文混排页：第 {pageRanges(m.pages_mixed)} 页</div> : null}
      {m.pages_need_ocr.length ? (
        <div style={S.between}>
          <span style={{ color: C.warn, fontSize: 12 }}>第 {pageRanges(m.pages_need_ocr)} 页待识别</span>
          <Button size="sm" variant="outline" disabled={!ocrEligible(m)} onClick={onOcr}>提交识别…</Button>
        </div>
      ) : null}
      {/* 令 2043 第 2 条、契约 1.4：移到回收站；识别进行中不能移除（服务还在用这个文件）；已移除的没有这个按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
        {isRef && m.status === 'missing' ? <>
          <Button size="sm" variant="outline" disabled={relocating} onClick={onRelocateFolder}>重新定位文件夹…</Button>
          <Button size="sm" variant="outline" disabled={relocating} onClick={onRelocateFile}>重新定位文件…</Button>
        </> : null}
        {m.status === 'removed' ? null : <Button size="sm" variant="ghost" disabled={m.status === 'ocr_running' || removing} onClick={onRemove}>移除此材料</Button>}
      </div>
    </li>
  )
}

function JobRow({ j, onChanged }: { j: OcrJob; onChanged: () => void }) {
  const [err, setErr] = useState<{ code: string; message: string } | null>(null)
  const cancellable = j.status === 'queued' || j.status === 'running' || j.status === 'paused'
  const cancel = async () => {
    if (!await confirm('取消识别', `取消"${j.name}"还没识别的页？已识别的页保留。`, '取消识别')) return
    const r = await call('ocrCancel', { job_id: j.job_id })
    if (!r.ok) setErr(r.error); else onChanged()
  }
  const pct = j.total ? Math.round((j.done / j.total) * 100) : 0
  return (
    <li style={{ ...S.card, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={S.between}><span style={{ wordBreak: 'break-all' }}>{j.name}</span><Badge tone={j.status === 'done' ? 'ok' : j.status === 'partial_failed' ? 'err' : j.status === 'paused' ? 'warn' : 'info'}>{JOB_WORD[j.status]}</Badge></div>
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 4, background: C.border, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.brand, borderRadius: 2 }} />
      </div>
      <div style={S.between}>
        <span style={S.sub}>{j.done} / {j.total} 页{j.failed ? `，失败 ${j.failed} 页` : ''}{j.pause_reason ? `（${PAUSE_WORD[j.pause_reason] ?? '暂停'}，恢复后继续）` : ''}</span>
        {cancellable ? <Button size="sm" variant="ghost" onClick={() => void cancel()}>取消</Button> : null}
      </div>
      <ErrorLine error={err} />
    </li>
  )
}

/** 提交识别：律师选定页码范围后确认（F-MAT-03）；dewatermark 固定为 false，界面不出现（第 5a 步）。 */
function OcrDialog({ caseRef, materials, onClose, onDone }: { caseRef: CaseRef; materials: Material[]; onClose: () => void; onDone: () => void }) {
  const [ranges, setRanges] = useState<Record<string, string>>(() => Object.fromEntries(materials.map((m) => [m.material_id, pageRanges(m.pages_need_ocr).replace(/、/g, ', ')])))
  const [err, setErr] = useState<string | null>(null)
  const picks = materials.map((m) => ({ m, pages: parsePageRanges(ranges[m.material_id] ?? '', Math.max(m.unit_count, ...m.pages_need_ocr)) }))
  const bad = picks.filter((x) => !x.pages)
  const submit = async () => {
    if (bad.length) return
    const ready = picks as Array<{ m: Material; pages: number[] }>
    if (!await confirm('发往识别服务器', ocrConfirmText(ready.map((x) => ({ name: x.m.name, pages: x.pages }))), '提交识别')) return
    const failed: string[] = []
    for (const x of ready) {
      const r = await call('ocrSubmit', { case_id: caseRef.case_id, material_id: x.m.material_id, pages: x.pages, dewatermark: false })
      if (!r.ok) failed.push(`${x.m.name}：${errorText(r.error)}`)
    }
    // 交上去了（哪怕部分）：告诉左侧的案件卡片开始盯识别进度（ocr-watch.ts）
    if (failed.length < ready.length) caseEvent(OCR_STARTED, caseRef.case_id)
    if (failed.length) setErr(failed.join('；')); else onDone()
  }
  return (
    <Modal open onClose={onClose} title="提交识别" closeLabel="关闭"
      footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button variant="primary" disabled={bad.length > 0} onClick={() => void submit()}>下一步</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={S.sub}>选定要识别的页（如 3-6, 9）。识别结果按页合并回文本，标注"识别所得"。</div>
        {picks.map(({ m, pages }) => (
          <label key={m.material_id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>{m.name}（共 {m.unit_count} 页）</span>
            <input style={S.input} value={ranges[m.material_id] ?? ''} onChange={(e) => setRanges({ ...ranges, [m.material_id]: e.target.value })} aria-invalid={!pages} />
            {!pages ? <span style={{ color: C.err, fontSize: 12 }}>页码写法不对或超出范围</span> : <span style={S.sub}>{pages.length} 页</span>}
          </label>
        ))}
        {err ? <div role="alert" style={{ color: C.err, fontSize: 12 }}>{err}</div> : null}
      </div>
    </Modal>
  )
}

/** notice（契约 1.4）：整理中有一步被跳过等要让律师知道的话（如识别服务器不可用，材料信息抽取被跳过）；没有为 null。 */
interface PipelineStatus { status: string; step_index: number; step_total: number; current: string | null; queue_wait_ms: number | null; notice?: string | null }

function WikiSection({ caseRef, materials }: { caseRef: CaseRef; materials: Material[] }) {
  const id = caseRef.case_id
  const [tasks, reloadTasks] = useLoad(() => call<{ tasks: Task[] }>('tasksList', { case_id: id }), [id], POLL_MS)
  const running = tasks.state === 'ok' ? tasks.value.tasks.find((t) => t.task_id.startsWith('P-') && t.status === 'running') : undefined
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [sugs, reloadSugs] = useLoad(() => call<{ suggestions: Suggestion[] }>('getWikiSuggestions', { case_id: id }), [id])
  const watched = useRef<string | null>(null)
  // 整理结束、采纳建议后让 wiki 卡重读
  const [wikiTick, setWikiTick] = useState(0)

  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === id) void reloadTasks() }
    window.addEventListener('lawbench:tasks-changed', on)
    return () => window.removeEventListener('lawbench:tasks-changed', on)
  }, [id, reloadTasks])
  useEffect(() => {
    if (!running) {
      // 只在成功完成时通知；被停止、失败的不发"已完成"（返修一并做）
      if (watched.current) {
        // 契约 1.4：整理结束后再读一次进度，有提示（如某一步被跳过的原因）就告诉律师一次
        const ended = watched.current
        void call<PipelineStatus>('pipelineStatus', { task_id: ended }).then((r) => { if (r.ok && r.value.notice) notice('整理时有情况要留意', r.value.notice) })
        if (shouldNotifyWikiDone(watched.current, tasks.state === 'ok' ? tasks.value.tasks : undefined)) osNotify('整理任务已完成')
        watched.current = null
        void reloadSugs()
        setWikiTick((n) => n + 1)
      }
      setStatus(null)
      return
    }
    watched.current = running.task_id
    let stop = false
    const tick = async () => {
      const r = await call<PipelineStatus>('pipelineStatus', { task_id: running.task_id })
      if (!stop && r.ok) setStatus(r.value)
    }
    void tick()
    const t = setInterval(() => { void tick() }, POLL_MS)
    return () => { stop = true; clearInterval(t) }
  }, [running?.task_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async () => {
    if (!running || !await confirm('停止整理', '停止正在进行的案件 wiki 整理？已完成的步骤保留。', '停止')) return
    await call('pipelineCancel', { task_id: running.task_id })
    void reloadTasks()
  }
  const decide = async (s: Suggestion, accept: boolean) => {
    const r = await call('postWikiSuggestions', { case_id: id, id: s.id, accept })
    if (!r.ok) notice('没有处理成功', errorText(r.error))
    void reloadSugs()
    setWikiTick((n) => n + 1)
  }
  return (
    <Section title="案件 wiki">
      {running ? (
        <div style={{ ...S.card, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={S.between}><span>正在整理</span><Button size="sm" variant="ghost" onClick={() => void cancel()}>停止</Button></div>
          <div style={S.sub}>{status ? `第 ${status.step_index} / ${status.step_total} 步${status.current ? `：${status.current}` : ''}${status.queue_wait_ms ? `（服务器排队约 ${Math.ceil(status.queue_wait_ms / 1000)} 秒）` : ''}` : '读取进度中…'}</div>
          {status?.notice ? <div style={{ color: C.warn, fontSize: 12 }}>{status.notice}</div> : null}
        </div>
      ) : null}
      <WikiCard caseRef={caseRef} materials={materials} refreshKey={wikiTick} />
      <Loading data={sugs}>{(v) => {
        const pending = v.suggestions.filter((s) => s.status === 'pending')
        return pending.length === 0 ? <Empty>没有待确认的 wiki 修改建议</Empty> : (
          <ul style={S.list}>{pending.map((s) => (
            <li key={s.id} style={{ ...S.card, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><b>{s.field}</b>：{s.value}</div>
              <div style={S.sub}>出处：{citationTargets(s.source, materials).map((t, i) => t.material_id
                ? <button key={i} type="button" onClick={() => getNav().openTab(TABS.source, { material_id: t.material_id!, citation: t.citation })}
                    style={{ font: 'inherit', color: C.brand, background: 'none', border: 'none', padding: '0 4px 0 0', cursor: 'pointer', textDecoration: 'underline' }}>{t.text}</button>
                : <span key={i}>{t.text} </span>)}</div>
              {s.reason ? <div style={S.sub}>理由：{s.reason}</div> : null}
              <div style={S.row}><Button size="sm" variant="primary" onClick={() => void decide(s, true)}>采纳</Button><Button size="sm" variant="ghost" onClick={() => void decide(s, false)}>不采纳</Button></div>
            </li>
          ))}</ul>
        )
      }}</Loading>
    </Section>
  )
}
