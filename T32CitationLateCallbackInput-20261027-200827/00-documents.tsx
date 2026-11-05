// T32：右栏“文稿”页。只从本案任务/成果索引选择 Markdown 来源，正文经 Host 的受控读取，
// 保存经 /api/documents/save 由服务生成来源任务的新草稿版本；本页不碰文件系统，也不缓存正文到浏览器存储。
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { citationInlineMarks } from './citation.ts'
import { citationDepsFor } from './citation-deps.ts'
import { OfficeDocumentPreview } from './document-preview.tsx'
import { Badge, Button, C, caseEvent, Empty, ErrorLine, Loading, Section, S, useCaseEvent, useLoad } from './kit.tsx'
import { WithCase, type SessionProps } from './session-case.tsx'
import { call, confirm, type CaseRef } from './state.ts'

interface Draft {
  title: string
  path: string
  version: number
}

interface Task {
  task_id: string
  status: string
  drafts: Draft[]
  finished_at: string | null
}

interface Output {
  title: string
  version: number
  task_id: string
  files: Array<{ format: 'md' | 'docx'; path: string }>
  confirmed_at: string
}

export type DocumentChoice = {
  kind: 'draft' | 'output'
  task_id: string
  title: string
  version: number
  path: string
  format: 'md' | 'docx'
  status?: string
  when: string | null
}

interface DocumentValue {
  task_id: string
  title: string
  version: number
  path: string
  text: string
}

interface SaveValue {
  task_id: string
  path: string
  version: number
  citation_check: unknown
  coverage: unknown
  not_fully_read: string[]
}

type ApiError = { code: string; message: string }
type SaveResult = { ok: true; value: SaveValue } | { ok: false; error: ApiError }
type ReadState =
  | { key: string; state: 'loading' }
  | { key: string; state: 'ok'; value: DocumentValue }
  | { key: string; state: 'fail'; error: ApiError }

type Editor = {
  key: string
  text: string
  savedText: string
}

const DOCUMENTS_CHANGED = 'lawbench:documents-changed'
const SAVE_OPERATIONS_CHANGED = 'lawbench:document-save-operations-changed'
const documentKey = (caseId: string, path: string): string => `${caseId}\n${path}`
const MAX_EDITOR_BYTES = 512 * 1024
type PendingDocument = { caseId: string; path: string; text: string; savedText: string }
type SessionDocuments = { lastKey?: string; items: Map<string, PendingDocument> }
type SaveOperation = {
  id: string
  key: string
  sessionId?: string
  caseId: string
  documentKey: string
  path: string
  content: string
  status: 'pending' | 'success' | 'error'
  result?: SaveResult
}

/** 页签关闭、换案和会话切换共用这份进程内暂存；每份文稿各占一项，互不清空。 */
const pendingDocuments = new Map<string, SessionDocuments>()
const activeDocuments = new Map<string, () => void>()
const saveOperations = new Map<string, SaveOperation>()
let saveSequence = 0

function saveOperationKey(sessionId: string | undefined, key: string): string {
  return `${sessionId ?? ''}\n${key}`
}

function notifySaveOperations(): void {
  window.dispatchEvent(new CustomEvent(SAVE_OPERATIONS_CHANGED))
}

function rememberPendingDocument(sessionId: string, document: PendingDocument): void {
  let session = pendingDocuments.get(sessionId)
  if (!session) {
    session = { items: new Map() }
    pendingDocuments.set(sessionId, session)
  }
  const key = documentKey(document.caseId, document.path)
  session.items.set(key, document)
  session.lastKey = key
}

function pendingDocument(sessionId: string | undefined, caseId: string, path: string): PendingDocument | undefined {
  return sessionId ? pendingDocuments.get(sessionId)?.items.get(documentKey(caseId, path)) : undefined
}

function forgetPendingDocument(sessionId: string | undefined, caseId: string, path: string): void {
  if (!sessionId) return
  const session = pendingDocuments.get(sessionId)
  if (!session) return
  const key = documentKey(caseId, path)
  session.items.delete(key)
  if (session.lastKey === key) session.lastKey = [...session.items.keys()].at(-1)
  if (!session.items.size) pendingDocuments.delete(sessionId)
}

function settleSaveOperation(operation: SaveOperation): void {
  if (saveOperations.get(operation.key) === operation) saveOperations.delete(operation.key)
  notifySaveOperations()
}

function beginSaveOperation(args: {
  sessionId?: string
  caseId: string
  documentKey: string
  path: string
  content: string
}): SaveOperation {
  const key = saveOperationKey(args.sessionId, args.documentKey)
  const existing = saveOperations.get(key)
  if (existing) return existing
  const operation: SaveOperation = {
    id: String(++saveSequence),
    key,
    ...args,
    status: 'pending',
  }
  saveOperations.set(key, operation)
  notifySaveOperations()
  void call<SaveValue>('documentsSave', { case_id: args.caseId, path: args.path, content: args.content })
    .then((result) => {
      operation.status = result.ok ? 'success' : 'error'
      operation.result = result
      if (result.ok) {
        forgetPendingDocument(args.sessionId, args.caseId, args.path)
        caseEvent(DOCUMENTS_CHANGED, args.caseId)
        caseEvent('lawbench:tasks-changed', args.caseId)
      }
      notifySaveOperations()
    })
  return operation
}

export function captureDocumentsBeforeClose(sessionId: string): void {
  activeDocuments.get(sessionId)?.()
}

/** textarea 的 DOM value 固定把 CRLF 变成 LF；以紧前正文为基准，未变的相邻行沿用旧分隔符，只给新边界选默认值。 */
export function preserveLineEndings(value: string, reference: string): string {
  const oldEnds = reference.match(/\r\n|\r|\n/g) ?? []
  const oldParts = reference.split(/\r\n|\r|\n/)
  const parts = value.split(/\r\n|\r|\n/)
  const newEnds = value.match(/\r\n|\r|\n/g) ?? []
  if (!newEnds.length) return value

  const newToOld = new Array<number | undefined>(parts.length)
  let prefix = 0
  while (prefix < oldParts.length && prefix < parts.length && oldParts[prefix] === parts[prefix]) {
    newToOld[prefix] = prefix
    prefix++
  }
  let oldSuffix = oldParts.length - 1
  let newSuffix = parts.length - 1
  while (oldSuffix >= prefix && newSuffix >= prefix && oldParts[oldSuffix] === parts[newSuffix]) {
    newToOld[newSuffix] = oldSuffix
    oldSuffix--
    newSuffix--
  }
  if (oldParts.length === parts.length) {
    for (let i = prefix; i <= newSuffix; i++) newToOld[i] = i
  }

  const crlf = (reference.match(/\r\n/g) ?? []).length
  const lf = (reference.match(/(?<!\r)\n/g) ?? []).length
  const cr = (reference.match(/\r(?!\n)/g) ?? []).length
  const fallback = !oldEnds.length ? '\n' : crlf >= lf && crlf >= cr ? '\r\n' : lf >= cr ? '\n' : '\r'
  let preserved = ''
  for (let i = 0; i < newEnds.length; i++) {
    const oldLeft = newToOld[i]
    const oldRight = newToOld[i + 1]
    const separator = oldLeft !== undefined && oldRight === oldLeft + 1 ? oldEnds[oldLeft] : fallback
    preserved += parts[i] + separator
  }
  return preserved + parts[parts.length - 1]
}

/** 任务草稿和已确认成果里的 Markdown 都明确列出；不从文件名或全部历史里猜“最新”。 */
export function documentChoices(tasks: readonly Task[], outputs: readonly Output[]): DocumentChoice[] {
  const drafts = tasks.flatMap((task) => task.drafts.map((draft) => ({
    kind: 'draft' as const,
    task_id: task.task_id,
    title: draft.title,
    version: draft.version,
    path: draft.path,
    format: 'md' as const,
    status: task.status,
    when: task.finished_at,
  })))
  const results = outputs.flatMap((output) => output.files
    .filter((file) => file.format === 'md' || file.format === 'docx')
    .map((file) => ({
      kind: 'output' as const,
      task_id: output.task_id,
      title: output.title,
      version: output.version,
      path: file.path,
      format: file.format,
      when: output.confirmed_at,
    })))
  return [...drafts, ...results]
}

async function loadChoices(caseId: string): Promise<
  { ok: true; value: { tasks: Task[]; outputs: Output[] } } | { ok: false; error: ApiError }
> {
  const [tasks, outputs] = await Promise.all([
    call<{ tasks: Task[] }>('tasksList', { case_id: caseId }),
    call<{ outputs: Output[] }>('outputsList', { case_id: caseId }),
  ])
  if (!tasks.ok) return tasks
  if (!outputs.ok) return outputs
  return { ok: true, value: { tasks: tasks.value.tasks, outputs: outputs.value.outputs } }
}

export function DocumentsTab(p: SessionProps) {
  return <WithCase p={p}>{(c) => <Documents caseRef={c} sessionId={p.sessionId} />}</WithCase>
}

/** 文稿页内容；导出给界面用例直接渲染。 */
export function Documents({ caseRef, sessionId }: { caseRef: CaseRef; sessionId?: string }) {
  const caseId = caseRef.case_id
  const [sources, reloadSources] = useLoad(() => loadChoices(caseId), [caseId])
  useCaseEvent(DOCUMENTS_CHANGED, caseId, reloadSources)

  // 选择连同案件编号保存；换案后旧选择自然失效，旧读取/保存响应也按 key 拒绝覆盖。
  const rememberedSession = sessionId ? pendingDocuments.get(sessionId) : undefined
  const remembered = rememberedSession?.lastKey ? rememberedSession.items.get(rememberedSession.lastKey) : undefined
  const [picked, setPicked] = useState<{ caseId: string; path: string } | undefined>(() =>
    remembered?.caseId === caseId ? { caseId, path: remembered.path } : undefined)
  const selected = picked?.caseId === caseId ? picked.path : undefined
  const [read, setRead] = useState<ReadState>()
  const [editor, setEditor] = useState<Editor>()
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [saveError, setSaveError] = useState<ApiError>()
  const [savedMessage, setSavedMessage] = useState<string>()
  const [, refreshSaveOperations] = useState(0)

  const choices = sources.state === 'ok' ? documentChoices(sources.value.tasks, sources.value.outputs) : []
  const selectedChoice = choices.find((choice) => choice.path === selected)
  const key = selected ? documentKey(caseId, selected) : undefined
  const dirty = !!editor && editor.text !== editor.savedText
  const markdownSelected = selectedChoice?.format === 'md'
  const currentRead = markdownSelected ? read?.key === key ? read : key ? { key, state: 'loading' as const } : undefined : undefined
  const shownEditor = currentRead?.state === 'ok' && editor?.key === key ? editor : undefined
  const currentSaveOperation = key ? saveOperations.get(saveOperationKey(sessionId, key)) : undefined
  const saving = currentSaveOperation?.status === 'pending'
  const citationCaseId = currentRead?.state === 'ok' ? caseId : undefined
  const citationTaskId = currentRead?.state === 'ok' ? currentRead.value.task_id : undefined
  const citationTarget = citationCaseId && citationTaskId && key
    ? `${sessionId ?? ''}\n${citationCaseId}\n${key}\n${citationTaskId}`
    : undefined
  const liveCitationTarget = useRef<string | undefined>(undefined)
  useLayoutEffect(() => {
    liveCitationTarget.current = citationTarget
    return () => {
      if (liveCitationTarget.current === citationTarget) liveCitationTarget.current = undefined
    }
  }, [citationTarget])
  const citationMarks = useMemo(() => {
    if (!citationCaseId || !citationTaskId || !citationTarget) return undefined
    const capturedTarget = citationTarget
    return citationInlineMarks({
      ...citationDepsFor(citationTaskId),
      caseId: () => liveCitationTarget.current === capturedTarget ? citationCaseId : undefined,
    })
  }, [citationCaseId, citationTarget, citationTaskId])

  useEffect(() => {
    const refresh = () => refreshSaveOperations((revision) => revision + 1)
    window.addEventListener(SAVE_OPERATIONS_CHANGED, refresh)
    return () => window.removeEventListener(SAVE_OPERATIONS_CHANGED, refresh)
  }, [])

  useEffect(() => {
    if (!selected || !markdownSelected) {
      setRead(undefined)
      setEditor(undefined)
      return
    }
    const myKey = documentKey(caseId, selected)
    let live = true
    setRead({ key: myKey, state: 'loading' })
    setEditor(undefined)
    setSaveError(undefined)
    void call<DocumentValue>('documentRead', { case_id: caseId, root: caseRef.root, path: selected }).then((r) => {
      if (!live) return
      if (!r.ok) {
        setRead({ key: myKey, state: 'fail', error: r.error })
        return
      }
      setRead({ key: myKey, state: 'ok', value: r.value })
      const kept = pendingDocument(sessionId, caseId, selected)
      if (kept && kept.savedText !== r.value.text) forgetPendingDocument(sessionId, caseId, selected)
      const text = kept?.savedText === r.value.text ? kept.text : r.value.text
      setEditor({ key: myKey, text, savedText: r.value.text })
      setMode('preview')
    })
    return () => { live = false }
  }, [caseId, caseRef.root, markdownSelected, selected])

  const identity = sessionId && key ? `${sessionId}\n${key}` : undefined
  const live = useRef(new Map<string, { caseId: string; path: string; editor?: Editor }>())
  if (identity) live.current.set(identity, { caseId, path: selected!, editor })
  const discarded = useRef(new Set<string>())
  useEffect(() => {
    if (!sessionId || !identity) return
    const capture = () => {
      const current = live.current.get(identity)
      if (discarded.current.delete(identity)) {
        forgetPendingDocument(sessionId, caseId, selected!)
        return
      }
      if (!current?.editor || current.editor.text === current.editor.savedText) return
      rememberPendingDocument(sessionId, {
        caseId: current.caseId,
        path: current.path,
        text: current.editor.text,
        savedText: current.editor.savedText,
      })
    }
    activeDocuments.set(sessionId, capture)
    return () => {
      capture()
      if (activeDocuments.get(sessionId) === capture) activeDocuments.delete(sessionId)
      live.current.delete(identity)
    }
  }, [caseId, identity, selected, sessionId])

  const handledSaveResults = useRef(new Set<string>())
  useEffect(() => {
    const operation = currentSaveOperation
    if (!operation || operation.status === 'pending' || handledSaveResults.current.has(operation.id)
      || currentRead?.state !== 'ok' || editor?.key !== key || !operation.result) return
    handledSaveResults.current.add(operation.id)
    const result = operation.result
    if (!result.ok) {
      setSaveError(result.error.code === 'TIMEOUT'
        ? { code: result.error.code, message: '保存结果不确定，本次没有自动重发。正文仍保留；请先重新打开原稿确认是否已生成新版本。' }
        : result.error)
      settleSaveOperation(operation)
      return
    }

    const nextKey = documentKey(caseId, result.value.path)
    const nextDocument: DocumentValue = {
      task_id: result.value.task_id,
      title: currentRead.value.title,
      version: result.value.version,
      path: result.value.path,
      text: operation.content,
    }
    setRead({ key: nextKey, state: 'ok', value: nextDocument })
    setEditor({ key: nextKey, text: operation.content, savedText: operation.content })
    setPicked({ caseId, path: result.value.path })
    setSavedMessage(`已保存为“${nextDocument.title}”第 ${result.value.version} 版`)
    if (sessionId) {
      // 保存成功后旧 identity 的 effect 清理不能再把已落盘正文记回旧版本缓存。
      discarded.current.add(`${sessionId}\n${operation.documentKey}`)
      forgetPendingDocument(sessionId, caseId, operation.path)
    }
    setMode('preview')
    settleSaveOperation(operation)
  }, [caseId, currentRead, currentSaveOperation, currentSaveOperation?.status, editor?.key, key, sessionId])

  const choose = async (choice: DocumentChoice) => {
    if (saving || choice.path === selected) return
    if (dirty && !await confirm('文稿还没保存', '切换文稿会放下这份尚未保存的修改。要继续吗？', '不保存并切换')) return
    if (dirty && sessionId && identity) {
      discarded.current.add(identity)
      forgetPendingDocument(sessionId, caseId, selected!)
    }
    setSaveError(undefined)
    setSavedMessage(undefined)
    setPicked({ caseId, path: choice.path })
  }

  const save = () => {
    if (!selected || !editor || currentRead?.state !== 'ok' || saving) return
    if (!editor.text.length) {
      setSaveError({ code: 'INVALID_ARGUMENT', message: '正文为空，不能保存。' })
      return
    }
    if (new TextEncoder().encode(editor.text).byteLength > MAX_EDITOR_BYTES) {
      setSaveError({ code: 'OUTPUT_TRUNCATED', message: '正文超过 512 KiB，不能保存为新版本；正文仍保留在这里。' })
      return
    }
    setSaveError(undefined)
    setSavedMessage(undefined)
    beginSaveOperation({
      sessionId,
      caseId,
      documentKey: editor.key,
      path: selected,
      content: editor.text,
    })
  }

  const draftChoices = choices.filter((choice) => choice.kind === 'draft')
  const outputChoices = choices.filter((choice) => choice.kind === 'output' && choice.format === 'md')
  const previewChoices = choices.filter((choice) => choice.kind === 'output' && choice.format === 'docx')

  return (
    <div style={S.pane}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>文稿</div>
        <div style={S.sub}>Markdown 保存会生成新草稿版本；已确认 DOCX 只生成只读预览，编辑交回 WPS/Office，二者都不覆盖原件。</div>
      </div>

      <Loading data={sources}>{(v) => {
        const all = documentChoices(v.tasks, v.outputs)
        if (!all.length) return <Empty>本案还没有可打开的草稿或已确认成果。</Empty>
        return (
          <>
            <ChoiceSection title="任务草稿" choices={draftChoices} selected={selected} disabled={saving} onChoose={choose} />
            <ChoiceSection title="已确认成果" choices={outputChoices} selected={selected} disabled={saving} onChoose={choose} />
            <ChoiceSection title="Word 成果预览" choices={previewChoices} selected={selected} disabled={saving} onChoose={choose} />
          </>
        )
      }}</Loading>

      {!selected ? <Empty>从上面选择一份文稿开始查看。</Empty> : (
        selectedChoice?.format === 'docx' ? (
          <OfficeDocumentPreview caseRef={caseRef} path={selectedChoice.path} title={selectedChoice.title} version={selectedChoice.version} />
        ) : (
        <Section title={selectedChoice ? `${selectedChoice.title} · 第 ${selectedChoice.version} 版` : '正在打开文稿'}
          extra={selectedChoice?.kind === 'draft' && selectedChoice.status === 'running'
            ? <Badge tone="warn">任务进行中，保存可能被拒</Badge>
            : <Badge tone={selectedChoice?.kind === 'output' ? 'ok' : 'info'}>{selectedChoice?.kind === 'output' ? '已确认成果' : '任务草稿'}</Badge>}>
          {currentRead?.state === 'loading' ? <Empty>读取完整正文中…</Empty> : null}
          {currentRead?.state === 'fail' ? <ErrorLine error={currentRead.error} /> : null}
          {currentRead?.state === 'ok' && shownEditor ? (
            <>
              <div style={S.sub}>{currentRead.value.path} · 读取时是第 {currentRead.value.version} 版</div>
              <div style={{ ...S.row, flexWrap: 'wrap' }}>
                <Button size="sm" variant={mode === 'preview' ? 'primary' : 'outline'} onClick={() => setMode('preview')}>预览</Button>
                <Button size="sm" variant={mode === 'edit' ? 'primary' : 'outline'} onClick={() => setMode('edit')}>编辑</Button>
                <Button size="sm" variant="primary" disabled={saving || !dirty || !shownEditor.text.length} onClick={() => void save()}>
                  {saving ? '保存中…' : '保存为新草稿版本'}
                </Button>
                <span style={{ ...S.sub, color: dirty ? C.warn : C.sub }}>{dirty ? '有未保存的修改' : '没有未保存的修改'}</span>
              </div>
              {mode === 'edit'
                ? <textarea aria-label="Markdown 正文" value={shownEditor.text} disabled={saving}
                    onChange={(e) => setEditor({ ...shownEditor, text: preserveLineEndings(e.target.value, shownEditor.text) })}
                    style={{ ...S.input, width: '100%', minHeight: 320, boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                : <div style={{ ...S.card, minHeight: 160, overflowWrap: 'anywhere' }}><MarkdownText text={shownEditor.text}
                    labels={{ code: { copyLabel: '复制', copiedLabel: '已复制' }, footnotes: '注释' }} inlineMarks={citationMarks} /></div>}
              <ErrorLine error={saveError} />
              {savedMessage ? <div role="status" style={{ color: C.ok, fontSize: 12 }}>{savedMessage}</div> : null}
            </>
          ) : null}
        </Section>
        )
      )}
    </div>
  )
}

function ChoiceSection({ title, choices, selected, disabled, onChoose }: {
  title: string
  choices: DocumentChoice[]
  selected?: string
  disabled: boolean
  onChoose: (choice: DocumentChoice) => void
}) {
  if (!choices.length) return null
  return (
    <Section title={title}>
      <ul style={S.list}>{choices.map((choice) => (
        <li key={`${choice.kind}\n${choice.path}`}>
          <Button size="sm" variant={choice.path === selected ? 'primary' : 'ghost'} disabled={disabled} aria-pressed={choice.path === selected}
            style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }} onClick={() => onChoose(choice)}>
            {choice.title} · 第 {choice.version} 版{choice.format === 'docx' ? ' · DOCX 预览' : ''}
          </Button>
        </li>
      ))}</ul>
    </Section>
  )
}
