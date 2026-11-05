// @vitest-environment jsdom
// T32 文稿页：两类来源、真实受控读取、Markdown 预览/编辑、严格三字段保存、
// 失败与超时保留正文，以及换来源时旧读取响应不覆盖当前页。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { captureDocumentsBeforeClose, Documents, DocumentsTab } from '../ui/documents.tsx'
import { app, setApi, type CaseRef, type LawbenchApi } from '../ui/state.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const CASE: CaseRef = { case_id: '00000000-0000-4000-8000-000000000001', name: '甲案（虚构）', root: 'D:\\虚构\\甲案', exists: true }
const TASK = 'T-20261022030000-0001'
const DRAFT = `工作区/任务/${TASK}/草稿/起诉状-v1.md`
const OTHER_DRAFT = `工作区/任务/${TASK}/草稿/证据目录-v1.md`
const OUTPUT = '成果/代理意见-v1.md'
const NEW_DRAFT = `工作区/任务/${TASK}/草稿/起诉状-v2.md`
const ORIGINAL = '## 诉讼请求\r\n\r\n第一段。\n第二段。'
const EDITED = '## 诉讼请求\r\n\r\n第一段。\n第二段已修改。'

let root: Root | undefined
let box: HTMLDivElement
let caseSession = 0
let renderSession = 0
beforeEach(() => { box = document.createElement('div'); document.body.appendChild(box); caseSession++ })
afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
  box.remove()
  setApi(undefined)
  app.set((state) => ({ ...state, dialogs: [] }))
})

const settle = async () => { for (let i = 0; i < 20; i++) await act(async () => { await Promise.resolve() }) }
const text = () => box.textContent ?? ''
const button = (label: string) => [...box.querySelectorAll('button')].find((item) => item.textContent?.includes(label))!
const area = () => box.querySelector('textarea[aria-label="Markdown 正文"]') as HTMLTextAreaElement

function result(path: string = DRAFT, title = '起诉状', version = 1, content = ORIGINAL) {
  return { ok: true as const, value: { task_id: TASK, title, version, path, text: content } }
}

function service(options: {
  read?: (path: string) => Promise<unknown>
  save?: (request: unknown) => Promise<unknown>
  saved?: boolean
  keepVersions?: boolean
} = {}) {
  const calls: Array<[string, unknown]> = []
  const tasks = () => {
    const drafts = options.saved && options.keepVersions ? [
      { title: '起诉状', version: 2, path: NEW_DRAFT },
      { title: '起诉状', version: 1, path: DRAFT },
      { title: '证据目录', version: 1, path: OTHER_DRAFT },
    ] : [
      { title: '起诉状', version: options.saved ? 2 : 1, path: options.saved ? NEW_DRAFT : DRAFT },
      { title: '证据目录', version: 1, path: OTHER_DRAFT },
    ]
    return { ok: true, value: { tasks: [{ task_id: TASK, status: 'completed', drafts, finished_at: '2026-10-22T03:00:00+08:00' }] } }
  }
  setApi({
    tasksList: async (request: unknown) => { calls.push(['tasksList', request]); return tasks() },
    outputsList: async (request: unknown) => {
      calls.push(['outputsList', request])
      return { ok: true, value: { v: 1, outputs: [{
        title: '代理意见', version: 1, task_id: TASK, inputs: [], citation_passed: true, confirmed_at: '2026-10-22T02:00:00+08:00',
        files: [{ format: 'md', path: OUTPUT }, { format: 'docx', path: '成果/代理意见-v1.docx' }],
      }] } }
    },
    documentRead: async (request: unknown) => {
      calls.push(['documentRead', request])
      const path = (request as { path: string }).path
      if (options.read) return options.read(path)
      if (path === OUTPUT) return result(OUTPUT, '代理意见', 1, '代理意见正文')
      if (path === OTHER_DRAFT) return result(OTHER_DRAFT, '证据目录', 1, '证据一：虚构借条')
      if (path === NEW_DRAFT) return result(NEW_DRAFT, '起诉状', 2, EDITED)
      return result(path)
    },
    documentsSave: async (request: unknown) => {
      calls.push(['documentsSave', request])
      if (options.save) {
        const response = await options.save(request)
        if ((response as { ok?: boolean }).ok) options.saved = true
        return response
      }
      options.saved = true
      return { ok: true, value: {
        task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
      } }
    },
  } as unknown as LawbenchApi)
  return { calls }
}

async function render(sessionId?: string) {
  root = createRoot(box)
  await act(async () => {
    root!.render(createElement(Documents, { caseRef: CASE, sessionId: sessionId ?? `documents-test-${caseSession}-${++renderSession}` }))
  })
  await settle()
}

async function change(value: string) {
  const input = area()
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('T32 文稿预览编辑与保存', () => {
  it('明确列出任务草稿和 MD 成果；受控读取后预览、编辑并按严格三字段保存新版本', async () => {
    const svc = service()
    await render()
    expect(text()).toContain('起诉状 · 第 1 版')
    expect(text()).toContain('证据目录 · 第 1 版')
    expect(text()).toContain('代理意见 · 第 1 版')
    expect(text()).not.toContain('代理意见-v1.docx')

    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('第一段。')
    expect(svc.calls.find((call) => call[0] === 'documentRead')).toEqual([
      'documentRead', { case_id: CASE.case_id, root: CASE.root, path: DRAFT },
    ])

    await act(async () => { button('编辑').click() })
    // 原生 textarea 的 DOM value 按 HTML 规范把 CRLF 显示成 LF；保存请求仍恢复原稿的 CRLF。
    expect(area().value).toBe(ORIGINAL.replace(/\r\n/g, '\n'))
    await change(EDITED)
    expect(text()).toContain('有未保存的修改')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()

    const saveCall = svc.calls.find((call) => call[0] === 'documentsSave')!
    expect(saveCall).toEqual(['documentsSave', { case_id: CASE.case_id, path: DRAFT, content: EDITED }])
    expect(Object.keys(saveCall[1] as object)).toEqual(['case_id', 'path', 'content'])
    expect(text()).toContain('已保存为“起诉状”第 2 版')
    expect(text()).toContain('读取时是第 2 版')
    expect(svc.calls.filter((call) => call[0] === 'documentRead').some((call) =>
      JSON.stringify(call[1]) === JSON.stringify({ case_id: CASE.case_id, root: CASE.root, path: NEW_DRAFT }))).toBe(true)
  })

  it('保存中重复点击只发一次；忙/失败/超时都保留可编辑正文，不自动重发', async () => {
    let release!: (value: unknown) => void
    const pending = new Promise((resolve) => { release = resolve })
    const svc = service({ save: async () => pending })
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)

    const saveButton = button('保存为新草稿版本')
    await act(async () => { saveButton.click(); saveButton.click() })
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)

    await act(async () => { release({ ok: false, error: { code: 'BUSY', message: '任务还在处理，暂时不能保存' } }); await pending })
    await settle()
    expect(area().value).toBe(EDITED.replace(/\r\n/g, '\n'))
    expect(text()).toContain('任务还在处理，暂时不能保存')
    expect(text()).toContain('有未保存的修改')
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)

    const timeout = service({ save: async () => ({ ok: false, error: { code: 'TIMEOUT', message: '超时' } }) })
    await act(async () => { root?.unmount() })
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()
    expect(area().value).toBe(EDITED.replace(/\r\n/g, '\n'))
    expect(text()).toContain('保存结果不确定，本次没有自动重发')
    expect(timeout.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)
  })

  it('保存成功后同任务 v1/v2 并存时，切回 v1 读取服务器原文且不残留旧 dirty', async () => {
    service({ keepVersions: true })
    await render('session-save-cache-v1-v2')
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()

    expect(text()).toContain('起诉状 · 第 2 版')
    expect(text()).toContain('第二段已修改。')
    expect(text()).toContain('没有未保存的修改')

    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('起诉状 · 第 1 版')
    expect(text()).toContain('第二段。')
    expect(text()).not.toContain('第二段已修改。')
    expect(text()).toContain('没有未保存的修改')

    await act(async () => { button('起诉状 · 第 2 版').click() })
    await settle()
    expect(app.get().dialogs).toHaveLength(0)
    expect(text()).toContain('起诉状 · 第 2 版')
    expect(text()).toContain('第二段已修改。')
    expect(text()).toContain('没有未保存的修改')
  })

  it('快速换来源时，后返回的旧读取不覆盖当前文稿', async () => {
    const pending = new Map<string, (value: unknown) => void>()
    service({ read: (path) => new Promise((resolve) => pending.set(path, resolve)) })
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await act(async () => { button('证据目录 · 第 1 版').click() })

    await act(async () => { pending.get(OTHER_DRAFT)!(result(OTHER_DRAFT, '证据目录', 1, '当前应显示的正文')); await Promise.resolve() })
    await settle()
    expect(text()).toContain('当前应显示的正文')
    await act(async () => { pending.get(DRAFT)!(result(DRAFT, '起诉状', 1, '迟到的旧正文')); await Promise.resolve() })
    await settle()
    expect(text()).toContain('当前应显示的正文')
    expect(text()).not.toContain('迟到的旧正文')
  })

  it('有未保存修改时切换来源会先询问；取消后当前正文和 dirty 状态都保留', async () => {
    service()
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('证据目录 · 第 1 版').click() })
    await settle()

    const dialog = app.get().dialogs.at(-1)
    expect(dialog?.kind).toBe('confirm')
    if (dialog?.kind !== 'confirm') throw new Error('应弹未保存确认框')
    expect(dialog.title).toBe('文稿还没保存')
    await act(async () => { dialog.resolve(false); await Promise.resolve() })
    await settle()
    expect(area().value).toBe(EDITED.replace(/\r\n/g, '\n'))
    expect(text()).toContain('有未保存的修改')
  })

  it('保存途中换到另一案件，旧保存响应不覆盖新案件正文', async () => {
    const CASE2: CaseRef = { ...CASE, case_id: '00000000-0000-4000-8000-000000000002', name: '乙案（虚构）', root: 'D:\\虚构\\乙案' }
    const OTHER = '工作区/任务/T-20261022030000-0002/草稿/乙稿-v1.md'
    let release!: (value: unknown) => void
    const pending = new Promise((resolve) => { release = resolve })
    setApi({
      tasksList: async (request: unknown) => {
        const caseId = (request as { case_id: string }).case_id
        const draft = caseId === CASE.case_id
          ? { title: '甲稿', version: 1, path: DRAFT }
          : { title: '乙稿', version: 1, path: OTHER }
        return { ok: true, value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [draft], finished_at: null }] } }
      },
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async (request: unknown) => {
        const path = (request as { path: string }).path
        return result(path, path === DRAFT ? '甲稿' : '乙稿', 1, path === DRAFT ? '甲案正文' : '乙案正文')
      },
      documentsSave: async () => pending,
    } as unknown as LawbenchApi)

    await render()
    await act(async () => { button('甲稿 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('保存为新草稿版本').click() })

    await act(async () => { root!.render(createElement(Documents, { caseRef: CASE2 })) })
    await settle()
    await act(async () => { button('乙稿 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('乙案正文')

    await act(async () => {
      release({ ok: true, value: { task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: {}, coverage: {}, not_fully_read: [] } })
      await pending
    })
    await settle()
    expect(text()).toContain('乙案正文')
    expect(text()).not.toContain('甲案正文')
    expect(text()).not.toContain('已保存为“甲稿”')
  })

  it('显式关闭页签时按会话保留未保存正文；重开来源且服务原件未变则恢复', async () => {
    service()
    await render('session-close-doc')
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    captureDocumentsBeforeClose('session-close-doc')
    await act(async () => { root?.unmount() })

    await render('session-close-doc')
    await settle()
    expect(text()).toContain('第二段已修改。')
    await act(async () => { button('编辑').click() })
    expect(area().value).toBe(EDITED.replace(/\r\n/g, '\n'))
    expect(text()).toContain('有未保存的修改')
  })

  it('真实 WithCase 换案 A→B→A 保留各案 dirty；未编辑的 B 不清掉 A', async () => {
    const CASE2: CaseRef = { ...CASE, case_id: '00000000-0000-4000-8000-000000000002', name: '乙案（虚构）', root: 'D:\\虚构\\乙案' }
    const B_DRAFT = '工作区/任务/T-20261022030000-0002/草稿/答辩状-v1.md'
    const A_EDITED = `${ORIGINAL}\n甲案第三段。`
    const B_EDITED = '答辩请求。\r\n请求驳回。'
    setApi({
      tasksList: async (request: unknown) => {
        const caseId = (request as { case_id: string }).case_id
        const draft = caseId === CASE.case_id
          ? { title: '起诉状', version: 1, path: DRAFT }
          : { title: '答辩状', version: 1, path: B_DRAFT }
        return { ok: true, value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [draft], finished_at: null }] } }
      },
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async (request: unknown) => {
        const path = (request as { path: string }).path
        return path === DRAFT ? result(DRAFT, '起诉状', 1, ORIGINAL) : result(B_DRAFT, '答辩状', 1, '答辩请求。\r\n请求驳回。')
      },
      documentsSave: async () => { throw new Error('本用例不应保存') },
    } as unknown as LawbenchApi)

    app.set((s) => ({ ...s, cases: [CASE, CASE2] }))
    let cwd = CASE.root
    const props = {
      sessionId: 'review-case-roundtrip',
      useSessions: (select: (state: { byId: Record<string, { cwd?: string } | undefined> }) => unknown) =>
        select({ byId: { 'review-case-roundtrip': { cwd } } }),
    }
    root = createRoot(box)
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(A_EDITED)

    cwd = CASE2.root
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    cwd = CASE.root
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('甲案第三段。')

    cwd = CASE2.root
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    await act(async () => { button('答辩状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(B_EDITED)

    cwd = CASE.root
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('甲案第三段。')

    cwd = CASE2.root
    await act(async () => { root!.render(createElement(DocumentsTab, props)) })
    await settle()
    await act(async () => { button('答辩状 · 第 1 版').click() })
    await settle()
    expect(text()).toContain('请求驳回。')
  })

  it('保存跨关闭重挂仍单飞；成功只恢复一次并显示新版本', async () => {
    let release!: (value: unknown) => void
    const pending = new Promise((resolve) => { release = resolve })
    const svc = service({ save: async () => pending, keepVersions: true })
    await render('review-reopen-success')
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('保存为新草稿版本').click() })
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)

    captureDocumentsBeforeClose('review-reopen-success')
    await act(async () => { root?.unmount() })
    root = undefined
    await render('review-reopen-success')
    expect(text()).toContain('保存中…')
    expect(button('保存中…').hasAttribute('disabled')).toBe(true)
    button('保存中…').click()
    await settle()
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)

    await act(async () => {
      release({ ok: true, value: { task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: {}, coverage: {}, not_fully_read: [] } })
      await pending
    })
    await settle()
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)
    expect(text()).toContain('已保存为“起诉状”第 2 版')
    expect(text()).toContain('读取时是第 2 版')
  })

  it('保存跨关闭重挂仍单飞；失败只恢复一次并保留 dirty 正文', async () => {
    let release!: (value: unknown) => void
    const pending = new Promise((resolve) => { release = resolve })
    const svc = service({ save: async () => pending })
    await render('review-reopen-failure')
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change(EDITED)
    await act(async () => { button('保存为新草稿版本').click() })
    captureDocumentsBeforeClose('review-reopen-failure')
    await act(async () => { root?.unmount() })
    root = undefined
    await render('review-reopen-failure')
    expect(text()).toContain('保存中…')
    button('保存中…').click()
    await settle()
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)

    await act(async () => {
      release({ ok: false, error: { code: 'BUSY', message: '任务还在处理，暂时不能保存' } })
      await pending
    })
    await settle()
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(1)
    expect(text()).toContain('任务还在处理，暂时不能保存')
    expect(text()).toContain('有未保存的修改')
    await act(async () => { button('编辑').click() })
    expect(area().value).toBe(EDITED.replace(/\r\n/g, '\n'))
  })

  it('混合行尾插入、删除后，textarea 到保存载荷只给新边界用本地默认值', async () => {
    let savedContent: string | undefined
    setApi({
      tasksList: async () => ({
        ok: true,
        value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [{ title: '起诉状', version: 1, path: DRAFT }], finished_at: null }] },
      }),
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async () => result(DRAFT, '起诉状', 1, 'a\r\nb\nc'),
      documentsSave: async (request: unknown) => {
        savedContent = (request as { content: string }).content
        return { ok: true, value: {
          task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
        } }
      },
    } as unknown as LawbenchApi)
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change('a\nb\nc\nd')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()
    expect(savedContent).toBe('a\r\nb\nc\r\nd')

    await act(async () => { root?.unmount() })
    root = undefined
    setApi({
      tasksList: async () => ({
        ok: true,
        value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [{ title: '起诉状', version: 1, path: DRAFT }], finished_at: null }] },
      }),
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async () => result(DRAFT, '起诉状', 1, 'a\r\nb\nc\r\nd'),
      documentsSave: async (request: unknown) => {
        savedContent = (request as { content: string }).content
        return { ok: true, value: {
          task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
        } }
      },
    } as unknown as LawbenchApi)
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change('a\nc\nd')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()
    expect(savedContent).toBe('a\r\nc\r\nd')
  })

  it('连续输入先追加再改写时，未改的混合行尾基准不退回原稿', async () => {
    const saveCalls: unknown[] = []
    setApi({
      tasksList: async () => ({
        ok: true,
        value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [{ title: '起诉状', version: 1, path: DRAFT }], finished_at: null }] },
      }),
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async () => result(DRAFT, '起诉状', 1, 'a\r\nb\nc'),
      documentsSave: async (request: unknown) => {
        saveCalls.push(request)
        return { ok: true, value: {
          task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
        } }
      },
    } as unknown as LawbenchApi)
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change('a\nb\nc\nd')
    await change('A\nb\nc\nd')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()

    expect(saveCalls).toEqual([{ case_id: CASE.case_id, path: DRAFT, content: 'A\r\nb\nc\r\nd' }])
    expect(Object.keys(saveCalls[0] as object)).toEqual(['case_id', 'path', 'content'])
  })

  it('连续输入先插入再追加时，两次原生 textarea 输入都以紧前正文保留行尾', async () => {
    const saveCalls: unknown[] = []
    setApi({
      tasksList: async () => ({
        ok: true,
        value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [{ title: '起诉状', version: 1, path: DRAFT }], finished_at: null }] },
      }),
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async () => result(DRAFT, '起诉状', 1, 'a\r\nb\nc'),
      documentsSave: async (request: unknown) => {
        saveCalls.push(request)
        return { ok: true, value: {
          task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
        } }
      },
    } as unknown as LawbenchApi)
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change('x\na\nb\nc')
    await change('x\na\nb\nc\nd')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()

    expect(saveCalls).toEqual([{ case_id: CASE.case_id, path: DRAFT, content: 'x\r\na\r\nb\nc\r\nd' }])
    expect(Object.keys(saveCalls[0] as object)).toEqual(['case_id', 'path', 'content'])
  })

  it('CR-only 与 BOM 经真实 textarea 保存时保持未编辑边界', async () => {
    let savedContent: string | undefined
    setApi({
      tasksList: async () => ({
        ok: true,
        value: { tasks: [{ task_id: TASK, status: 'completed', drafts: [{ title: '起诉状', version: 1, path: DRAFT }], finished_at: null }] },
      }),
      outputsList: async () => ({ ok: true, value: { v: 1, outputs: [] } }),
      documentRead: async () => result(DRAFT, '起诉状', 1, '\uFEFFa\rb\rc'),
      documentsSave: async (request: unknown) => {
        savedContent = (request as { content: string }).content
        return { ok: true, value: {
          task_id: TASK, path: NEW_DRAFT, version: 2, citation_check: null, coverage: null, not_fully_read: [],
        } }
      },
    } as unknown as LawbenchApi)
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    await change('\uFEFFa\nb\nc\nd')
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()
    expect(savedContent).toBe('\uFEFFa\rb\rc\rd')
  })

  it('超过 512 KiB 时明确拒绝保存，保留正文且不发请求', async () => {
    const svc = service()
    await render()
    await act(async () => { button('起诉状 · 第 1 版').click() })
    await settle()
    await act(async () => { button('编辑').click() })
    const tooLarge = 'a'.repeat(512 * 1024 + 1)
    await change(tooLarge)
    await act(async () => { button('保存为新草稿版本').click() })
    await settle()
    expect(text()).toContain('正文超过 512 KiB，不能保存为新版本')
    expect(area().value).toHaveLength(512 * 1024 + 1)
    expect(svc.calls.filter((call) => call[0] === 'documentsSave')).toHaveLength(0)
  })
})
