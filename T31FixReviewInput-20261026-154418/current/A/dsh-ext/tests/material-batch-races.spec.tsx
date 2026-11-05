// @vitest-environment jsdom
import {
  cancelMaterialBatch,
  captureImportedMaterialBatch,
  makeMaterialSubmissionHook,
  materialBatchBlockFor,
  materialBatchFor,
  toggleMaterialBatchItem,
} from '../ui/material-batch.ts'
import { app, setApi, type LawbenchApi } from '../ui/state.ts'
import type { Material } from '../ui/format.ts'

const CASE = { case_id: 'C-T31-RACE', name: '虚构竞态案件', root: 'D:\\案件\\T31竞态虚构' }
const ROOT_OLD = 'D:\\外部\\竞态旧批'
const ROOT_NEW = 'D:\\外部\\竞态新批'
const ROOT_B = 'D:\\外部\\竞态B批'

// These fixed UUID-shaped values are only inputs to the UI hook. They do not claim
// that a NativeSession.beginSubmission call happened in this synthetic unit test.
const R_CANCEL_OLD = '00000000-0000-4000-8000-000000000101'
const R_CANCEL_RETRY = '00000000-0000-4000-8000-000000000102'
const R_SELECTION_OLD = '00000000-0000-4000-8000-000000000201'
const R_SELECTION_RETRY = '00000000-0000-4000-8000-000000000202'
const R_LIST_CANCEL = '00000000-0000-4000-8000-000000000301'

interface ScopeRequest {
  action: 'prepare' | 'release'
  case_id: string
  session_id: string
  request_id: string
  material_ids?: readonly string[]
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function material(id: string, name: string, location: string): Material {
  return {
    material_id: id,
    name,
    rel_path: `工作区/引用/R01/${name}`,
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
    ref_id: 'R01',
    location,
  }
}

function scopeSuccess(request: ScopeRequest) {
  return {
    ok: true as const,
    value: {
      action: 'prepare' as const,
      request_id: request.request_id,
      case_id: request.case_id,
      session_id: request.session_id,
      material_ids: request.material_ids ?? [],
    },
  }
}

function releaseSuccess(request: ScopeRequest) {
  return {
    ok: true as const,
    value: {
      action: 'release' as const,
      request_id: request.request_id,
      case_id: request.case_id,
      session_id: request.session_id,
    },
  }
}

const unexpectedRejections: unknown[] = []
const recordUnhandledRejection = (reason: unknown): void => {
  unexpectedRejections.push(reason)
}

beforeEach(() => {
  unexpectedRejections.length = 0
  process.on('unhandledRejection', recordUnhandledRejection)
  app.set((state) => ({
    ...state,
    cases: [CASE],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
})

afterEach(async () => {
  setApi(undefined)
  app.set((state) => ({
    ...state,
    cases: [],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
  await Promise.resolve()
  process.off('unhandledRejection', recordUnhandledRejection)
  vi.restoreAllMocks()
  expect(unexpectedRejections).toEqual([])
})

it('取消本批后旧 prepare 才返回：旧 R 不得成功，必须释放并允许新 R 按新批重试', async () => {
  const sessionId = 'S-CANCEL-PENDING'
  const oldPrepareGate = deferred<unknown>()
  const listCalls: unknown[] = []
  const scopeCalls: ScopeRequest[] = []
  let materials = [material('M0001', '旧批合同.pdf', `${ROOT_OLD}\\旧批合同.pdf`)]
  let prepareCount = 0

  setApi({
    materialsList: async (request: unknown) => {
      listCalls.push(request)
      return { ok: true, value: { materials } }
    },
    requestScope: async (request: unknown) => {
      const scope = request as ScopeRequest
      scopeCalls.push(scope)
      if (scope.action === 'release') return releaseSuccess(scope)
      prepareCount += 1
      return prepareCount === 1 ? oldPrepareGate.promise : scopeSuccess(scope)
    },
  } as unknown as LawbenchApi)

  const oldBatch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_OLD, kind: 'dir' }],
    [],
  )
  expect(oldBatch?.selected_ids).toEqual(['M0001'])
  if (!oldBatch) throw new Error('旧批测试批次没有建立')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const oldEvent = { sessionId, requestId: R_CANCEL_OLD, mode: 'queue' as const }
  const oldPrepare = hook.prepare(oldEvent)
  expect(scopeCalls).toHaveLength(1)
  const oldScope = scopeCalls[0]!
  expect(oldScope).toEqual({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: R_CANCEL_OLD,
    material_ids: ['M0001'],
  })
  const oldRejected = expect(oldPrepare).rejects.toThrow()

  cancelMaterialBatch(sessionId)
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()

  materials = [material('M0002', '新批附件.pdf', `${ROOT_NEW}\\新批附件.pdf`)]
  const retryBatch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_NEW, kind: 'dir' }],
    [],
  )
  expect(retryBatch?.selected_ids).toEqual(['M0002'])
  if (!retryBatch) throw new Error('取消后的新批没有建立')

  oldPrepareGate.resolve(scopeSuccess(oldScope))
  await oldRejected
  expect(scopeCalls[1]).toEqual({
    action: 'release',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: R_CANCEL_OLD,
  })
  expect(materialBatchFor(sessionId, CASE.case_id)?.batch_id).toBe(retryBatch.batch_id)

  const retryEvent = { sessionId, requestId: R_CANCEL_RETRY, mode: 'queue' as const }
  await expect(hook.prepare(retryEvent)).resolves.toBeUndefined()
  expect(scopeCalls[2]).toEqual({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: R_CANCEL_RETRY,
    material_ids: ['M0002'],
  })
  await hook.accepted(retryEvent)

  expect(listCalls).toEqual([{ case_id: CASE.case_id }, { case_id: CASE.case_id }])
  expect(scopeCalls).toHaveLength(3)
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
})

it('prepare 返回前改选：不得接受旧选择，释放旧 R 后显式重试必须只带新选择', async () => {
  const sessionId = 'S-SELECTION-PENDING'
  const oldPrepareGate = deferred<unknown>()
  const listCalls: unknown[] = []
  const scopeCalls: ScopeRequest[] = []
  let prepareCount = 0

  setApi({
    materialsList: async (request: unknown) => {
      listCalls.push(request)
      return {
        ok: true,
        value: {
          materials: [
            material('M0011', '合同.pdf', `${ROOT_OLD}\\合同.pdf`),
            material('M0012', '附件.pdf', `${ROOT_OLD}\\附件.pdf`),
          ],
        },
      }
    },
    requestScope: async (request: unknown) => {
      const scope = request as ScopeRequest
      scopeCalls.push(scope)
      if (scope.action === 'release') return releaseSuccess(scope)
      prepareCount += 1
      return prepareCount === 1 ? oldPrepareGate.promise : scopeSuccess(scope)
    },
  } as unknown as LawbenchApi)

  const batch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_OLD, kind: 'dir' }],
    [],
  )
  expect(batch?.selected_ids).toEqual(['M0011', 'M0012'])
  if (!batch) throw new Error('改选测试批次没有建立')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const oldEvent = { sessionId, requestId: R_SELECTION_OLD, mode: 'queue' as const }
  const oldPrepare = hook.prepare(oldEvent)
  expect(scopeCalls).toHaveLength(1)
  const oldScope = scopeCalls[0]!
  expect(oldScope.material_ids).toEqual(['M0011', 'M0012'])
  const oldRejected = expect(oldPrepare).rejects.toThrow()

  toggleMaterialBatchItem(sessionId, 'M0012')
  expect(materialBatchFor(sessionId, CASE.case_id)?.selected_ids).toEqual(['M0011'])

  oldPrepareGate.resolve(scopeSuccess(oldScope))
  await oldRejected
  expect(scopeCalls[1]).toEqual({
    action: 'release',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: R_SELECTION_OLD,
  })

  const retryEvent = { sessionId, requestId: R_SELECTION_RETRY, mode: 'queue' as const }
  await expect(hook.prepare(retryEvent)).resolves.toBeUndefined()
  expect(scopeCalls[2]).toEqual({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: R_SELECTION_RETRY,
    material_ids: ['M0011'],
  })
  await hook.accepted(retryEvent)

  expect(listCalls).toEqual([{ case_id: CASE.case_id }])
  expect(scopeCalls).toHaveLength(3)
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
})

it('取消 loading 阻断后清单才返回：迟到的成功清单不得重建批次或重新阻断提问', async () => {
  const sessionId = 'S-LIST-CANCEL-PENDING'
  const listGate = deferred<unknown>()
  const listCalls: unknown[] = []
  const scopeCalls: ScopeRequest[] = []

  setApi({
    materialsList: async (request: unknown) => {
      listCalls.push(request)
      return listGate.promise
    },
    requestScope: async (request: unknown) => {
      scopeCalls.push(request as ScopeRequest)
      throw new Error('取消后无批次时不应请求材料范围')
    },
  } as unknown as LawbenchApi)

  const capture = captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_OLD, kind: 'dir' }],
    [],
  )
  expect(materialBatchBlockFor(sessionId, CASE.case_id)?.reason).toBe('loading')
  cancelMaterialBatch(sessionId)
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
  expect(materialBatchBlockFor(sessionId, CASE.case_id)).toBeUndefined()

  listGate.resolve({
    ok: true,
    value: {
      materials: [material('M0021', '迟到材料.pdf', `${ROOT_OLD}\\迟到材料.pdf`)],
    },
  })
  const staleResult = await capture
  expect(staleResult).toBeUndefined()
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
  expect(materialBatchBlockFor(sessionId, CASE.case_id)).toBeUndefined()

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  await expect(hook.prepare({
    sessionId,
    requestId: R_LIST_CANCEL,
    mode: 'queue',
  })).resolves.toBeUndefined()

  expect(listCalls).toEqual([{ case_id: CASE.case_id }])
  expect(scopeCalls).toEqual([])
})

it('同一会话 A/B 两批并发建批且 B 先返回：A 的迟到清单不得覆盖 B', async () => {
  const sessionId = 'S-OLDER-LIST'
  const listGates = [deferred<unknown>(), deferred<unknown>()]
  const listCalls: unknown[] = []
  const unexpectedScopeCalls: unknown[] = []

  setApi({
    materialsList: async (request: unknown) => {
      const gate = listGates[listCalls.length]
      listCalls.push(request)
      if (!gate) throw new Error('只允许 A/B 两次合成材料清单请求')
      return gate.promise
    },
    requestScope: async (request: unknown) => {
      unexpectedScopeCalls.push(request)
      throw new Error('建批竞态用例不应请求材料范围')
    },
  } as unknown as LawbenchApi)

  const olderCapture = captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_OLD, kind: 'dir' }],
    [],
  )
  const newerCapture = captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT_B, kind: 'dir' }],
    [],
  )
  expect(listCalls).toEqual([{ case_id: CASE.case_id }, { case_id: CASE.case_id }])

  listGates[1]!.resolve({
    ok: true,
    value: {
      materials: [
        material('M0031', 'B批材料.pdf', `${ROOT_B}\\B批材料.pdf`),
        material('M0039', '范围外材料.pdf', `${ROOT_NEW}\\范围外材料.pdf`),
      ],
    },
  })
  const newerBatch = await newerCapture
  expect(newerBatch?.selected_ids).toEqual(['M0031'])
  if (!newerBatch) throw new Error('新批 B 没有建立')
  expect(materialBatchFor(sessionId, CASE.case_id)?.batch_id).toBe(newerBatch.batch_id)

  listGates[0]!.resolve({
    ok: true,
    value: {
      materials: [material('M0029', 'A批材料.pdf', `${ROOT_OLD}\\A批材料.pdf`)],
    },
  })
  await Promise.allSettled([olderCapture])

  const active = materialBatchFor(sessionId, CASE.case_id)
  expect(active?.batch_id).toBe(newerBatch.batch_id)
  expect(active?.selected_ids).toEqual(['M0031'])
  expect(active?.root_paths).toEqual([ROOT_B])
  expect(materialBatchBlockFor(sessionId, CASE.case_id)).toBeUndefined()
  expect(unexpectedScopeCalls).toEqual([])
})
