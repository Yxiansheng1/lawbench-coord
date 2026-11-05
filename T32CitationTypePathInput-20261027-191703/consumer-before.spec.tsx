// @vitest-environment jsdom
// T32 LOCAL_UI_UNIT：文稿 Markdown 里的出处按钮必须按当前所选文稿自己的案件和任务打开原文。
// 这里只合成传输层与界面状态，直接渲染真实 Documents / SourceTab；不是原生运行时、HTTP 或 GUI 验收。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { TABS } from '../ui/cases.ts'
import { Documents } from '../ui/documents.tsx'
import { setNav, type Nav } from '../ui/kit.tsx'
import type { SessionProps } from '../ui/session-case.ts'
import { SourceTab } from '../ui/source.tsx'
import { app, setApi, type AppState, type CaseRef, type LawbenchApi } from '../ui/state.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const CASE: CaseRef = {
  case_id: '00000000-0000-4000-8000-000000000101',
  name: '甲案（虚构）',
  root: 'D:\\虚构\\甲案',
  exists: true,
}
const OTHER_CASE: CaseRef = {
  case_id: '00000000-0000-4000-8000-000000000202',
  name: '乙案（虚构）',
  root: 'D:\\虚构\\乙案',
  exists: true,
}
const SESSION = 'document-citation-navigation'
const TASK_A = 'T-20261027190000-00a1'
const TASK_B = 'T-20261027190000-00b2'
const DRAFT_A = `工作区/任务/${TASK_A}/草稿/第一份文稿-v1.md`
const DRAFT_B = `工作区/任务/${TASK_B}/草稿/第二份文稿-v1.md`
const CITATION_TEXT = '借款合同 第1页'
const CITATION = `〔${CITATION_TEXT}〕`
const CITATION_LABEL = `打开原文：${CITATION_TEXT}`
const MATERIAL_ID = 'M-DOCUMENT-CITATION'
const SOURCE_TEXT = '借款合同第一页的虚构正文。'

type ApiCall = { method: string; request: unknown }
type OpenedTab = { kind: string; params?: Record<string, string> }

const sessionsState = { byId: { [SESSION]: { cwd: CASE.root } } }
const useSessions: NonNullable<SessionProps['useSessions']> = (select) => select(sessionsState)

let root: Root | undefined
let box: HTMLDivElement
let initialState: AppState

beforeEach(() => {
  initialState = app.get()
  box = document.createElement('div')
  document.body.appendChild(box)
  app.set((state) => ({
    ...state,
    cases: [CASE, OTHER_CASE],
    currentRoot: OTHER_CASE.root,
    dialogs: [],
  }))
})

afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
  box.remove()
  setApi(undefined)
  setNav(undefined)
  app.set(initialState)
})

const settle = async () => {
  for (let i = 0; i < 20; i++) await act(async () => { await Promise.resolve() })
}

const buttonWithText = (label: string): HTMLButtonElement | undefined =>
  [...box.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes(label))

const citationButton = (): HTMLButtonElement | null =>
  box.querySelector<HTMLButtonElement>(`button[aria-label="${CITATION_LABEL}"]`)

function fixture() {
  const calls: ApiCall[] = []
  const opened: OpenedTab[] = []
  let sentMessages = 0
  const content = `正文里引用同一处${CITATION}，用于核对文稿来源。`
  const tasks = [
    {
      task_id: TASK_A,
      status: 'completed',
      drafts: [{ title: '第一份文稿', version: 1, path: DRAFT_A }],
      finished_at: null,
    },
    {
      task_id: TASK_B,
      status: 'completed',
      drafts: [{ title: '第二份文稿', version: 1, path: DRAFT_B }],
      finished_at: null,
    },
  ]

  setApi({
    tasksList: async (request: unknown) => {
      calls.push({ method: 'tasksList', request })
      return { ok: true, value: { tasks } }
    },
    outputsList: async (request: unknown) => {
      calls.push({ method: 'outputsList', request })
      return { ok: true, value: { outputs: [] } }
    },
    documentRead: async (request: unknown) => {
      calls.push({ method: 'documentRead', request })
      const path = (request as { path: string }).path
      const ownTask = path === DRAFT_A ? TASK_A : path === DRAFT_B ? TASK_B : undefined
      if (!ownTask) return { ok: false, error: { code: 'NOT_FOUND', message: '没有这份虚构文稿' } }
      return {
        ok: true,
        value: {
          task_id: ownTask,
          title: ownTask === TASK_A ? '第一份文稿' : '第二份文稿',
          version: 1,
          path,
          text: content,
        },
      }
    },
    materialsList: async (request: unknown) => {
      calls.push({ method: 'materialsList', request })
      const caseId = (request as { case_id: string }).case_id
      return {
        ok: true,
        value: {
          materials: caseId === CASE.case_id
            ? [{
                material_id: MATERIAL_ID,
                name: '借款合同',
                unit: 'page',
                unit_count: 2,
                status: 'ready',
              }]
            : [],
        },
      }
    },
    source: async (request: unknown) => {
      calls.push({ method: 'source', request })
      return {
        ok: true,
        value: {
          name: '借款合同',
          loc: { unit: 'page', from: 1 },
          text: SOURCE_TEXT,
          page_png_base64: null,
          source_changed: false,
        },
      }
    },
    documentsSave: async (request: unknown) => {
      calls.push({ method: 'documentsSave', request })
      return { ok: false, error: { code: 'UNEXPECTED_SAVE', message: '本用例不应保存' } }
    },
  } as unknown as LawbenchApi)

  setNav({
    openTab: (kind: string, params?: Record<string, string>) => {
      opened.push({ kind, params })
    },
    sendMessage: async () => {
      sentMessages++
      return true
    },
  } as unknown as Nav)

  return { calls, opened, sentMessages: () => sentMessages }
}

async function renderDocuments() {
  root = createRoot(box)
  await act(async () => {
    root!.render(createElement(Documents, { caseRef: CASE, sessionId: SESSION }))
  })
  await settle()
}

async function chooseDocument(label: string) {
  const choice = buttonWithText(label)
  expect(choice).toBeInstanceOf(HTMLButtonElement)
  await act(async () => { choice!.click() })
  await settle()
}

describe('T32 原生文稿出处导航', () => {
  it('所选文稿按自己的案件核对材料，并把真实 SourceTab 指向同一案件、材料和来源任务', async () => {
    const svc = fixture()
    await renderDocuments()

    // 若这里先红，说明夹具或导入仍是灰色，而不是目标产品行为已到断言。
    expect(box.textContent).toContain('第一份文稿 · 第 1 版')
    expect(box.textContent).toContain('第二份文稿 · 第 1 版')
    await chooseDocument('第一份文稿 · 第 1 版')
    expect(box.textContent).toContain('正文里引用同一处')

    const mark = citationButton()
    expect(mark).toBeInstanceOf(HTMLButtonElement)
    expect(mark?.textContent).toBe(CITATION_TEXT)
    await act(async () => { mark!.click() })
    await settle()

    expect(svc.calls.filter((call) => call.method === 'materialsList')).toEqual([
      { method: 'materialsList', request: { case_id: CASE.case_id } },
    ])
    expect(svc.calls.some((call) => JSON.stringify(call.request).includes(OTHER_CASE.case_id))).toBe(false)
    expect(svc.opened).toEqual([{
      kind: TABS.source,
      params: { material_id: MATERIAL_ID, citation: CITATION, task_id: TASK_A },
    }])

    const tabInfo = () => ({
      tab: {
        navigation: {
          params: svc.opened[0]?.params,
          revision: 1,
        },
      },
    })
    await act(async () => {
      root!.render(createElement(SourceTab, {
        sessionId: SESSION,
        useSessions,
        useTabInfo: tabInfo,
      }))
    })
    await settle()

    expect(svc.calls.filter((call) => call.method === 'source')).toEqual([{
      method: 'source',
      request: {
        case_id: CASE.case_id,
        material_id: MATERIAL_ID,
        citation: CITATION,
        task_id: TASK_A,
      },
    }])
    expect(box.textContent).toContain(SOURCE_TEXT)

    await act(async () => { root?.unmount() })
    root = undefined
    expect(box.childElementCount).toBe(0)
  })

  it('换到另一任务的同文出处后，点击只带新任务，不弹提示、不调模型或保存', async () => {
    const svc = fixture()
    await renderDocuments()
    await chooseDocument('第一份文稿 · 第 1 版')
    await chooseDocument('第二份文稿 · 第 1 版')

    expect(svc.calls.filter((call) => call.method === 'documentRead').map((call) =>
      (call.request as { path: string }).path)).toEqual([DRAFT_A, DRAFT_B])

    const mark = citationButton()
    expect(mark).toBeInstanceOf(HTMLButtonElement)
    await act(async () => { mark!.click() })
    await settle()

    expect(svc.opened).toEqual([{
      kind: TABS.source,
      params: { material_id: MATERIAL_ID, citation: CITATION, task_id: TASK_B },
    }])
    expect(app.get().dialogs).toEqual([])
    expect(svc.sentMessages()).toBe(0)
    expect(svc.calls.some((call) => call.method === 'documentsSave')).toBe(false)
  })
})
