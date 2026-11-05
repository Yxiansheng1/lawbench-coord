// @vitest-environment jsdom
import {
  captureImportedMaterialBatch,
  makeMaterialSubmissionHook,
  materialBatchFor,
} from '../ui/material-batch.ts'
import { runRefImport } from '../ui/cases.ts'
import { app, setApi, type LawbenchApi } from '../ui/state.ts'
import type { Material } from '../ui/format.ts'

const CASE = { case_id: 'C-T31-BOUNDARY', name: '虚构边界案件', root: 'D:\\案件\\T31边界虚构' }
const ROOT = 'D:\\外部\\本批'
const M1_LOCATION = `${ROOT}\\合同.pdf`
const M2_LOCATION = 'D:\\外部\\共享参考\\附件.pdf'

interface ScopeRequest {
  action: 'prepare' | 'release'
  case_id: string
  session_id: string
  request_id: string
  material_ids?: readonly string[]
}

function material(
  id: string,
  name: string,
  location: string | null,
  refId = 'R01',
  relPath = `工作区/引用/${refId}/${name}`,
): Material {
  return {
    material_id: id,
    name,
    rel_path: relPath,
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
    ref_id: refId,
    location,
  }
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

function apiWith(
  materials: readonly Material[],
  requestScope: (request: ScopeRequest) => Promise<unknown>,
): LawbenchApi {
  return {
    materialsList: async () => ({ ok: true, value: { materials } }),
    requestScope,
  } as unknown as LawbenchApi
}

beforeEach(() => {
  app.set((state) => ({
    ...state,
    cases: [CASE],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
})

afterEach(() => {
  setApi(undefined)
  app.set((state) => ({
    ...state,
    cases: [],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
  vi.restoreAllMocks()
})

it('本次只选一个文件时，同 ref_id 但可信位置不在选根内的材料不进入本批', async () => {
  const calls: Array<{ method: string; request: unknown }> = []
  setApi({
    materialsList: async (request: unknown) => {
      calls.push({ method: 'materialsList', request })
      return {
        ok: true,
        value: {
          materials: [
            material('M0001', '合同.pdf', M1_LOCATION),
            material('M0002', '共享附件.pdf', M2_LOCATION),
            material('M0003', '位置不完整.pdf', null, 'R01', ''),
          ],
        },
      }
    },
    requestScope: async (request: unknown) => {
      calls.push({ method: 'requestScope', request })
      throw new Error('建批阶段不应调用范围接口')
    },
  } as unknown as LawbenchApi)

  const batch = await captureImportedMaterialBatch(
    CASE,
    'S-LOCATION',
    [{ path: M1_LOCATION, kind: 'file' }],
    [{ path: ROOT, ref_id: 'R01', kind: 'dir' }],
  )

  expect(batch?.items.map((item) => item.material_id)).toEqual(['M0001'])
  expect(batch?.selected_ids).toEqual(['M0001'])
  expect(calls).toEqual([{
    method: 'materialsList',
    request: { case_id: CASE.case_id },
  }])
})

async function seedOldBatch(sessionId: string, root: string, location: string): Promise<void> {
  setApi(apiWith(
    [material(`OLD-${sessionId}`, '旧材料.pdf', location, 'R-OLD')],
    async (request) => scopeSuccess(request),
  ))
  const old = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: root, kind: 'dir' }],
    [],
  )
  expect(old).toBeDefined()
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeDefined()
}

function refImportResult(root: string) {
  return {
    copied: [],
    skipped: [],
    registered: [{ path: root, ref_id: 'R01', kind: 'dir' as const }],
    scan: { added: 0, changed: 0, removed: 0, failed: 0, review_needed: false },
  }
}

it('真实引用登记成功但材料清单读取失败时，下一页提问必须被失败状态拦住', async () => {
  const sessionId = 'S-LIST-FAIL'
  await seedOldBatch(sessionId, 'D:\\外部\\旧批', 'D:\\外部\\旧批\\旧材料.pdf')
  const scopeCalls: ScopeRequest[] = []
  setApi({
    materialsImport: async () => ({ ok: true, value: refImportResult(ROOT) }),
    materialsList: async () => ({
      ok: false,
      error: { code: 'INTERNAL', message: '虚构清单读取失败' },
    }),
    requestScope: async (request: unknown) => {
      scopeCalls.push(request as ScopeRequest)
      return releaseSuccess(request as ScopeRequest)
    },
  } as unknown as LawbenchApi)

  await runRefImport(CASE, [ROOT], {
    batchSessionId: sessionId,
    roots: [{ path: ROOT, kind: 'dir' }],
  })
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  await expect(hook.prepare({
    sessionId,
    requestId: 'request-list-fail',
    mode: 'queue',
  })).rejects.toThrow()
  expect(scopeCalls).toEqual([])
})

it('真实引用登记成功但本次成员为空时，下一页提问也必须被失败状态拦住', async () => {
  const sessionId = 'S-LIST-EMPTY'
  await seedOldBatch(sessionId, 'D:\\外部\\旧批', 'D:\\外部\\旧批\\旧材料.pdf')
  const scopeCalls: ScopeRequest[] = []
  setApi({
    materialsImport: async () => ({ ok: true, value: refImportResult(ROOT) }),
    materialsList: async () => ({ ok: true, value: { materials: [] } }),
    requestScope: async (request: unknown) => {
      scopeCalls.push(request as ScopeRequest)
      return releaseSuccess(request as ScopeRequest)
    },
  } as unknown as LawbenchApi)

  await runRefImport(CASE, [ROOT], {
    batchSessionId: sessionId,
    roots: [{ path: ROOT, kind: 'dir' }],
  })
  expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  await expect(hook.prepare({
    sessionId,
    requestId: 'request-list-empty',
    mode: 'queue',
  })).rejects.toThrow()
  expect(scopeCalls).toEqual([])
})

it('同一会话两个不同 R 在首个准备未完成时，不得同时发出 prepare', async () => {
  const sessionId = 'S-DIFFERENT-REQUEST'
  const gate = deferred<unknown>()
  const prepareCalls: ScopeRequest[] = []
  const releaseCalls: ScopeRequest[] = []
  setApi(apiWith(
    [material(`M-${sessionId}`, '合同.pdf', M1_LOCATION)],
    async (request) => {
      if (request.action === 'release') {
        releaseCalls.push(request)
        return releaseSuccess(request)
      }
      prepareCalls.push(request)
      return gate.promise
    },
  ))
  const batch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT, kind: 'dir' }],
    [],
  )
  expect(batch?.selected_ids).toEqual([`M-${sessionId}`])
  if (batch === undefined) throw new Error('different-request batch missing')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const firstEvent = { sessionId, requestId: 'different-R-1', mode: 'queue' as const }
  const secondEvent = { sessionId, requestId: 'different-R-2', mode: 'queue' as const }
  const first = hook.prepare(firstEvent)
  const second = hook.prepare(secondEvent)

  gate.resolve(scopeSuccess({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: firstEvent.requestId,
    material_ids: batch.selected_ids,
  }))
  const outcomes = await Promise.allSettled([first, second])
  await hook.accepted(firstEvent)

  expect(prepareCalls).toHaveLength(1)
  expect(releaseCalls).toEqual([])
  expect(outcomes[0]?.status).toBe('fulfilled')
  expect(outcomes[1]?.status).toBe('rejected')
})

it('同一 R 的幂等重入共享同一次真实准备结果，成功时只发一次 prepare', async () => {
  const sessionId = 'S-SAME-REQUEST-OK'
  const gate = deferred<unknown>()
  const prepareCalls: ScopeRequest[] = []
  setApi(apiWith(
    [material(`M-${sessionId}`, '合同.pdf', M1_LOCATION)],
    async (request) => {
      if (request.action === 'release') return releaseSuccess(request)
      prepareCalls.push(request)
      return gate.promise
    },
  ))
  const batch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT, kind: 'dir' }],
    [],
  )
  expect(batch).toBeDefined()
  if (batch === undefined) throw new Error('same-request success batch missing')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const event = { sessionId, requestId: 'same-R-ok', mode: 'queue' as const }
  const first = hook.prepare(event)
  const second = hook.prepare(event)
  gate.resolve(scopeSuccess({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: sessionId,
    request_id: event.requestId,
    material_ids: batch.selected_ids,
  }))
  const outcomes = await Promise.allSettled([first, second])
  await hook.accepted(event)

  expect(prepareCalls).toHaveLength(1)
  expect(outcomes.map((outcome) => outcome.status)).toEqual(['fulfilled', 'fulfilled'])
})

it('同一 R 的幂等重入共享同一次真实准备失败，失败时也只发一次 prepare', async () => {
  const sessionId = 'S-SAME-REQUEST-FAIL'
  const gate = deferred<unknown>()
  const prepareCalls: ScopeRequest[] = []
  setApi(apiWith(
    [material(`M-${sessionId}`, '合同.pdf', M1_LOCATION)],
    async (request) => {
      if (request.action === 'release') return releaseSuccess(request)
      prepareCalls.push(request)
      return gate.promise
    },
  ))
  const batch = await captureImportedMaterialBatch(
    CASE,
    sessionId,
    [{ path: ROOT, kind: 'dir' }],
    [],
  )
  expect(batch).toBeDefined()
  if (batch === undefined) throw new Error('same-request failure batch missing')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const event = { sessionId, requestId: 'same-R-fail', mode: 'queue' as const }
  const first = hook.prepare(event)
  const second = hook.prepare(event)
  gate.resolve({
    ok: false,
    error: { code: 'INTERNAL', message: '虚构准备失败' },
  })
  const outcomes = await Promise.allSettled([first, second])

  expect(prepareCalls).toHaveLength(1)
  expect(outcomes.map((outcome) => outcome.status)).toEqual(['rejected', 'rejected'])
  expect(outcomes.every((outcome) =>
    outcome.status === 'rejected' && String(outcome.reason).includes('虚构准备失败'))).toBe(true)
})

it('不同会话的并行准备互不误锁，各自使用自己的 R 完成', async () => {
  const firstSession = 'S-PARALLEL-1'
  const secondSession = 'S-PARALLEL-2'
  const gates = new Map<string, Deferred<unknown>>()
  const prepareCalls: ScopeRequest[] = []
  setApi(apiWith(
    [
      material(`M-${firstSession}`, '合同.pdf', M1_LOCATION),
      material(`M-${secondSession}`, '附件.pdf', `${ROOT}\\附件.pdf`),
    ],
    async (request) => {
      if (request.action === 'release') return releaseSuccess(request)
      prepareCalls.push(request)
      const gate = deferred<unknown>()
      gates.set(request.session_id, gate)
      return gate.promise
    },
  ))
  const firstBatch = await captureImportedMaterialBatch(
    CASE,
    firstSession,
    [{ path: M1_LOCATION, kind: 'file' }],
    [],
  )
  const secondBatch = await captureImportedMaterialBatch(
    CASE,
    secondSession,
    [{ path: `${ROOT}\\附件.pdf`, kind: 'file' }],
    [],
  )
  expect(firstBatch?.selected_ids).toEqual([`M-${firstSession}`])
  expect(secondBatch?.selected_ids).toEqual([`M-${secondSession}`])
  if (firstBatch === undefined || secondBatch === undefined) throw new Error('parallel batches missing')

  const hook = makeMaterialSubmissionHook(() => CASE.root)
  const firstEvent = { sessionId: firstSession, requestId: 'parallel-R-1', mode: 'queue' as const }
  const secondEvent = { sessionId: secondSession, requestId: 'parallel-R-2', mode: 'queue' as const }
  const first = hook.prepare(firstEvent)
  const second = hook.prepare(secondEvent)
  expect(prepareCalls.map((call) => call.session_id).sort()).toEqual([firstSession, secondSession])

  gates.get(firstSession)?.resolve(scopeSuccess({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: firstSession,
    request_id: firstEvent.requestId,
    material_ids: firstBatch.selected_ids,
  }))
  gates.get(secondSession)?.resolve(scopeSuccess({
    action: 'prepare',
    case_id: CASE.case_id,
    session_id: secondSession,
    request_id: secondEvent.requestId,
    material_ids: secondBatch.selected_ids,
  }))
  const outcomes = await Promise.allSettled([first, second])
  await hook.accepted(firstEvent)
  await hook.accepted(secondEvent)

  expect(outcomes.map((outcome) => outcome.status)).toEqual(['fulfilled', 'fulfilled'])
})
