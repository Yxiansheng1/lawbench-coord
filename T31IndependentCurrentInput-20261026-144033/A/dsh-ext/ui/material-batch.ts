// T31：输入区导入后，按本次所选根的当前材料成员建立"下一条消息"批次。
// 这里只保存 material_id、显示名和状态；不把用户正文、材料内容或路径写进会话。
import { errorText, type Material } from './format.ts'
import { app, call, notice, samePath, type CaseRef } from './state.ts'

export interface MaterialBatchItem {
  readonly material_id: string
  readonly name: string
  readonly status: Material['status']
  readonly pages_need_ocr: readonly number[]
}

export interface MaterialBatch {
  readonly batch_id: string
  readonly case_id: string
  readonly items: readonly MaterialBatchItem[]
  readonly selected_ids: readonly string[]
  readonly root_paths: readonly string[]
}

export interface MaterialRoot {
  readonly path: string
  readonly kind: 'file' | 'dir'
}

export interface RegisteredMaterialRoot {
  readonly path: string
  readonly ref_id: string
  readonly kind: 'file' | 'dir'
}

export type MaterialBatchBlockReason = 'loading' | 'list_failed' | 'empty'

export interface MaterialBatchBlock {
  readonly case_id: string
  readonly reason: MaterialBatchBlockReason
}

export interface SubmissionEvent {
  readonly sessionId: string
  readonly requestId: string
  readonly mode: 'queue' | 'steer'
}

export interface MaterialSubmissionHook {
  prepare(event: SubmissionEvent): Promise<void>
  accepted(event: SubmissionEvent): Promise<void>
  failed(event: SubmissionEvent): Promise<void>
}

export interface MaterialSubmissionRegistry {
  register(hook: MaterialSubmissionHook): () => void
}

let batchSeq = 0
const nextBatchId = (): string => `material-batch-${Date.now()}-${++batchSeq}`

const norm = (path: string): string => path.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase()
const within = (candidate: string, root: string): boolean => {
  const c = norm(candidate)
  const r = norm(root)
  return c === r || c.startsWith(`${r}\\`)
}

const locationOf = (caseRef: CaseRef, material: Material): string | undefined => {
  if (material.location) return material.location
  // 引用材料没有 location 时，rel_path 只是案件工作区里的虚拟副本位置，不能证明原件在选根内。
  if (material.origin === 'ref' ||
    (material.ref_id !== null && material.ref_id !== undefined) ||
    !material.rel_path) return undefined
  return `${caseRef.root.replace(/[\\/]+$/, '')}\\${material.rel_path.replace(/\//g, '\\')}`
}

export const materialBatchBlockText = (reason: MaterialBatchBlockReason): string => {
  switch (reason) {
    case 'loading':
      return '本次材料正在建立提问范围，请稍候再发送。'
    case 'list_failed':
      return '材料引用已经登记，但读取本次材料清单失败。请重新导入本次材料，或取消本批后按普通对话继续。'
    case 'empty':
      return '材料引用已经登记，但本次所选位置没有可加入提问的材料。请重新导入本次材料，或取消本批后按普通对话继续。'
  }
}

const setMaterialBatchBlock = (
  sessionId: string,
  caseId: string,
  reason: MaterialBatchBlockReason,
): void => {
  app.set((state) => {
    const { [sessionId]: _currentBatch, ...otherBatches } = state.materialBatches
    return {
      ...state,
      materialBatches: otherBatches,
      materialBatchBlocks: {
        ...state.materialBatchBlocks,
        [sessionId]: { case_id: caseId, reason },
      },
    }
  })
}

export const materialBatchBlockFor = (
  sessionId: string,
  caseId: string,
): MaterialBatchBlock | undefined => {
  const block = app.get().materialBatchBlocks[sessionId]
  return block?.case_id === caseId ? block : undefined
}

/** 本次导入响应里可能有多个成功根；重复登记同一根时按材料列表的当前位置认回全部当前成员。 */
export async function captureImportedMaterialBatch(
  caseRef: CaseRef,
  sessionId: string,
  roots: readonly MaterialRoot[],
  _registered: readonly RegisteredMaterialRoot[],
): Promise<MaterialBatch | undefined> {
  // 登记已经成功；先把旧批次换成阻断态，清单读取期间也不能静默退回全案。
  setMaterialBatchBlock(sessionId, caseRef.case_id, 'loading')
  const r = await call<{ materials: Material[] }>('materialsList', { case_id: caseRef.case_id })
  if (!r.ok) {
    setMaterialBatchBlock(sessionId, caseRef.case_id, 'list_failed')
    notice('本批材料没有建立', `引用已经登记，但读取本次材料清单失败：${errorText(r.error)}`)
    return undefined
  }

  const seen = new Set<string>()
  const items = r.value.materials.flatMap((material): MaterialBatchItem[] => {
    if (material.status === 'removed' || seen.has(material.material_id)) return []
    const location = locationOf(caseRef, material)
    const inSelectedRoot = roots.some((root) => location !== undefined &&
      (root.kind === 'dir' ? within(location, root.path) : samePath(location, root.path)))
    if (!inSelectedRoot) return []
    seen.add(material.material_id)
    return [{
      material_id: material.material_id,
      name: material.name,
      status: material.status,
      pages_need_ocr: material.pages_need_ocr,
    }]
  })
  if (items.length === 0) {
    setMaterialBatchBlock(sessionId, caseRef.case_id, 'empty')
    notice('本批材料没有建立', '引用已经登记，但本次所选位置目前没有可加入下一页提问的材料。')
    return undefined
  }

  const batch: MaterialBatch = {
    batch_id: nextBatchId(),
    case_id: caseRef.case_id,
    items,
    selected_ids: items.map((item) => item.material_id),
    root_paths: roots.map((root) => root.path),
  }
  app.set((state) => {
    const { [sessionId]: _clearedBlock, ...otherBlocks } = state.materialBatchBlocks
    return {
      ...state,
      materialBatches: { ...state.materialBatches, [sessionId]: batch },
      materialBatchBlocks: otherBlocks,
    }
  })
  return batch
}

export function clearMaterialBatch(sessionId: string, batchId?: string): void {
  app.set((state) => {
    const current = state.materialBatches[sessionId]
    if (!current || (batchId !== undefined && current.batch_id !== batchId)) return state
    const { [sessionId]: _cleared, ...rest } = state.materialBatches
    return { ...state, materialBatches: rest }
  })
}

/** 律师明确取消本批（包括导入成功但本批没建立起来的阻断态）。 */
export function cancelMaterialBatch(sessionId: string): void {
  app.set((state) => {
    const { [sessionId]: _batch, ...otherBatches } = state.materialBatches
    const { [sessionId]: _block, ...otherBlocks } = state.materialBatchBlocks
    return { ...state, materialBatches: otherBatches, materialBatchBlocks: otherBlocks }
  })
}

export function toggleMaterialBatchItem(sessionId: string, materialId: string): void {
  app.set((state) => {
    const current = state.materialBatches[sessionId]
    if (!current) return state
    const selected = new Set(current.selected_ids)
    if (selected.has(materialId)) selected.delete(materialId)
    else selected.add(materialId)
    if (selected.size === 0) {
      const { [sessionId]: _cleared, ...rest } = state.materialBatches
      return { ...state, materialBatches: rest }
    }
    const order = new Map(current.items.map((item, index) => [item.material_id, index]))
    const selectedIds = [...selected].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    return {
      ...state,
      materialBatches: { ...state.materialBatches, [sessionId]: { ...current, selected_ids: selectedIds } },
    }
  })
}

export function selectAllMaterialBatchItems(sessionId: string): void {
  app.set((state) => {
    const current = state.materialBatches[sessionId]
    if (!current) return state
    return {
      ...state,
      materialBatches: {
        ...state.materialBatches,
        [sessionId]: { ...current, selected_ids: current.items.map((item) => item.material_id) },
      },
    }
  })
}

export const materialBatchFor = (sessionId: string, caseId: string): MaterialBatch | undefined => {
  const batch = app.get().materialBatches[sessionId]
  return batch?.case_id === caseId ? batch : undefined
}

interface Reservation extends SubmissionEvent {
  readonly batch: MaterialBatch
}

const reservations = new Map<string, Reservation>()
const preparing = new Map<string, { readonly sessionId: string; readonly promise: Promise<void> }>()
const occupiedSessions = new Map<string, string>()
let submissionRegistrations = 0

const sessionKey = (caseId: string, sessionId: string): string => `${caseId}\u0000${sessionId}`

const releaseSession = (key: string, requestId: string): void => {
  if (occupiedSessions.get(key) === requestId) occupiedSessions.delete(key)
}

const sameIds = (left: readonly string[], right: readonly string[]): boolean => {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((id, index) => id === b[index])
}

/**
 * 在 DSH 原生 beginSubmission 生成 R 后、prompt 开始前调用。
 * 成功后才建立 reservation；prompt 被拒时 release 同一 R，并把界面批次留给律师重试。
 */
export function makeMaterialSubmissionHook(
  cwdOf: (sessionId: string) => string | undefined,
): MaterialSubmissionHook {
  return {
    async prepare(event) {
      const activePrepare = preparing.get(event.requestId)
      if (activePrepare) {
        if (activePrepare.sessionId === event.sessionId) return activePrepare.promise
        throw new Error('这次提交的材料范围正在另一个会话准备，已停止发送。')
      }
      const existing = reservations.get(event.requestId)
      if (existing) {
        if (existing.sessionId === event.sessionId) return
        throw new Error('这次提交的材料范围已绑定到另一个会话，已停止发送。')
      }

      const root = cwdOf(event.sessionId)
      const caseRef = root ? app.get().cases.find((candidate) => samePath(candidate.root, root)) : undefined
      const block = caseRef ? materialBatchBlockFor(event.sessionId, caseRef.case_id) : undefined
      if (block) throw new Error(materialBatchBlockText(block.reason))
      const batch = caseRef ? app.get().materialBatches[event.sessionId] : undefined
      if (!batch) return
      if (!caseRef || batch.case_id !== caseRef.case_id) {
        clearMaterialBatch(event.sessionId, batch.batch_id)
        throw new Error('案件已经切换，原批次已经取消。请重新导入材料后再发送。')
      }
      if (event.mode === 'steer') {
        throw new Error('本批材料只能随新的一问发送。本条是插话，本轮任务范围开始后不能再扩大；请等本轮结束后发送，或先取消本批。')
      }
      if (batch.selected_ids.length === 0) {
        clearMaterialBatch(event.sessionId, batch.batch_id)
        return
      }

      const occupiedKey = sessionKey(caseRef.case_id, event.sessionId)
      if (occupiedSessions.has(occupiedKey)) {
        throw new Error('上一批材料正在随另一条消息准备或发送，请稍后再发。')
      }
      occupiedSessions.set(occupiedKey, event.requestId)

      const operation = (async (): Promise<void> => {
        let releaseNeeded = true
        try {
          const r = await call<{
            action: 'prepare'
            request_id: string
            case_id: string
            session_id: string
            material_ids: string[]
          }>('requestScope', {
            action: 'prepare',
            case_id: caseRef.case_id,
            session_id: event.sessionId,
            request_id: event.requestId,
            material_ids: batch.selected_ids,
          })
          if (!r.ok) throw new Error(errorText(r.error))
          if (r.value.action !== 'prepare' || r.value.request_id !== event.requestId ||
            r.value.case_id !== caseRef.case_id || r.value.session_id !== event.sessionId ||
            !sameIds(r.value.material_ids, batch.selected_ids)) {
            throw new Error('材料范围没有按本次提交正确绑定，已停止发送。')
          }
          reservations.set(event.requestId, { ...event, batch })
          releaseNeeded = false
        } finally {
          // 服务可能已经准备但响应在网络里丢失；任何未确认成功的准备都尝试释放同一个 R。
          if (releaseNeeded) {
            await call('requestScope', {
              action: 'release',
              case_id: caseRef.case_id,
              session_id: event.sessionId,
              request_id: event.requestId,
            })
          }
        }
      })()
      preparing.set(event.requestId, { sessionId: event.sessionId, promise: operation })
      try {
        await operation
      } catch (error) {
        releaseSession(occupiedKey, event.requestId)
        throw error
      } finally {
        if (preparing.get(event.requestId)?.promise === operation) preparing.delete(event.requestId)
      }
    },

    async accepted(event) {
      const reservation = reservations.get(event.requestId)
      if (!reservation || reservation.sessionId !== event.sessionId) return
      reservations.delete(event.requestId)
      releaseSession(sessionKey(reservation.batch.case_id, event.sessionId), event.requestId)
      clearMaterialBatch(event.sessionId, reservation.batch.batch_id)
    },

    async failed(event) {
      const reservation = reservations.get(event.requestId)
      if (!reservation || reservation.sessionId !== event.sessionId) return
      reservations.delete(event.requestId)
      releaseSession(sessionKey(reservation.batch.case_id, event.sessionId), event.requestId)
      await call('requestScope', {
        action: 'release',
        case_id: reservation.batch.case_id,
        session_id: event.sessionId,
        request_id: event.requestId,
      })
    },
  }
}

export function registerMaterialSubmission(
  registry: MaterialSubmissionRegistry,
  cwdOf: (sessionId: string) => string | undefined,
): () => void {
  const dispose = registry.register(makeMaterialSubmissionHook(cwdOf))
  submissionRegistrations++
  return () => {
    dispose()
    submissionRegistrations = Math.max(0, submissionRegistrations - 1)
    if (submissionRegistrations === 0) {
      app.set((state) => ({ ...state, materialBatches: {}, materialBatchBlocks: {} }))
    }
  }
}

/** 输入区用：原生提交观察点没挂上时拒绝建立"下一条只看本批"的假承诺。 */
export const isMaterialSubmissionAvailable = (): boolean => submissionRegistrations > 0
