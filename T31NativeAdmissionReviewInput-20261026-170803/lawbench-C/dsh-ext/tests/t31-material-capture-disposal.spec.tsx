// @vitest-environment jsdom
import {
  captureImportedMaterialBatch,
  isMaterialSubmissionAvailable,
  materialBatchBlockFor,
  materialBatchFor,
  registerMaterialSubmission,
  type MaterialSubmissionHook,
  type MaterialSubmissionRegistry,
} from '../../../lawbench-A/dsh-ext/ui/material-batch.ts'
import {
  app,
  currentLawbenchApi,
  setApi,
  type LawbenchApi,
} from '../../../lawbench-A/dsh-ext/ui/state.ts'
import type { Material } from '../../../lawbench-A/dsh-ext/ui/format.ts'

const CASE = {
  case_id: 'C-T31-CAPTURE-DISPOSAL',
  name: 'T31 解绑回归虚构案件',
  root: 'D:\\fixtures\\t31-capture-disposal\\案件',
}
const SESSION_ID = 'S-T31-CAPTURE-DISPOSAL'
const MATERIAL_ROOT = 'D:\\fixtures\\t31-capture-disposal\\本批'
const MATERIAL_LOCATION = `${MATERIAL_ROOT}\\虚构材料.pdf`

interface Deferred<T> {
  readonly promise: Promise<T>
  settle(value: T): void
}

function deferred<T>(): Deferred<T> {
  let settled = false
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return {
    promise,
    settle(value) {
      if (settled) return
      settled = true
      resolve(value)
    },
  }
}

function fixtureMaterial(): Material {
  return {
    material_id: 'M-T31-CAPTURE-DISPOSAL',
    name: '虚构材料.pdf',
    rel_path: '工作区/引用/LOCAL-FIXTURE/虚构材料.pdf',
    type: 'pdf',
    status: 'parsed',
    unit: 'page',
    unit_count: 1,
    is_ocr: 'none',
    stale_ocr: false,
    error: null,
    pages_need_ocr: [],
    pages_mixed: [],
    origin: 'ref',
    ref_id: 'LOCAL-FIXTURE',
    location: MATERIAL_LOCATION,
  }
}

test('最后一个提交观察点解绑后，迟到的材料清单不得重建批次或阻断态', async () => {
  const previousState = app.get()
  const previousApi = currentLawbenchApi()
  const listGate = deferred<{ ok: true; value: { materials: Material[] } }>()
  const listCalls: unknown[] = []
  const scopeCalls: unknown[] = []
  const hookCalls: string[] = []
  const hooks = new Set<MaterialSubmissionHook>()
  let registerCalls = 0
  let unregisterCalls = 0
  let dispose: (() => void) | undefined
  let disposed = false
  let capture: ReturnType<typeof captureImportedMaterialBatch> | undefined

  const disposeOnce = (): void => {
    if (!dispose || disposed) return
    disposed = true
    dispose()
  }

  const registry: MaterialSubmissionRegistry = {
    register(hook) {
      registerCalls += 1
      hooks.add(hook)
      return () => {
        unregisterCalls += 1
        hooks.delete(hook)
      }
    },
  }

  const hook: MaterialSubmissionHook = {
    async prepare() { hookCalls.push('prepare') },
    async accepted() { hookCalls.push('accepted') },
    async failed() { hookCalls.push('failed') },
  }

  try {
    setApi({
      materialsList: async (request: unknown) => {
        listCalls.push(request)
        return listGate.promise
      },
      requestScope: async (request: unknown) => {
        scopeCalls.push(request)
        throw new Error('解绑回归不得请求材料范围')
      },
    } as unknown as LawbenchApi)
    app.set((state) => ({
      ...state,
      cases: [CASE],
      currentRoot: CASE.root,
      dialogs: [],
      materialBatches: {},
      materialBatchBlocks: {},
    }))

    dispose = registerMaterialSubmission(registry, () => CASE.root)
    const availableWhileRegistered = isMaterialSubmissionAvailable()
    capture = captureImportedMaterialBatch(
      CASE,
      SESSION_ID,
      [{ path: MATERIAL_ROOT, kind: 'dir' }],
      [],
    )
    await Promise.resolve()
    const pendingListCalls = listCalls.length

    disposeOnce()
    const availableAfterUnregister = isMaterialSubmissionAvailable()
    listGate.settle({ ok: true, value: { materials: [fixtureMaterial()] } })
    const batch = await capture

    expect(pendingListCalls).toBe(1)
    expect(availableWhileRegistered).toBe(true)
    expect(availableAfterUnregister).toBe(false)
    expect(batch).toBeUndefined()
    expect(materialBatchFor(SESSION_ID, CASE.case_id)).toBeUndefined()
    expect(materialBatchBlockFor(SESSION_ID, CASE.case_id)).toBeUndefined()
    expect(registerCalls).toBe(1)
    expect(unregisterCalls).toBe(1)
    expect(hooks.size).toBe(0)
    expect(listCalls).toEqual([{ case_id: CASE.case_id }])
    expect(scopeCalls).toEqual([])
    expect(hookCalls).toEqual([])
  } finally {
    listGate.settle({ ok: true, value: { materials: [fixtureMaterial()] } })
    if (capture) await capture.catch(() => undefined)
    disposeOnce()
    hooks.clear()
    setApi(previousApi)
    app.set(previousState)
    vi.restoreAllMocks()
  }
})
