import {
  LegalAgent, REQUEST_SCOPE_UNAVAILABLE, TASK_END_FAILED, requestIdFromMessages, validRequestScope,
} from '../agent/index.ts'
import type { CoreClient } from '../shared/core-client.ts'

const log = () => {}
const agentObj = (id: string) => ({ id, session: { header: { cwd: 'D:\\案件\\张三诉李四' } } })

describe('原生请求 R 与本批材料 scope（T31）', () => {
  const requestId = '12ab34cd-56ef-4abc-8def-0123456789ab'
  const caseId = '3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90'
  const taskId = 'T-20261026120000-abcd'
  const params = { thinking: '中' as const, window: '64K' as const, max_tokens: 16384 }
  const budget = { model_calls: 32, tool_calls: 48, minutes: 45 }
  const message = {
    id: 'm1', role: 'user' as const, content: [{ type: 'text' as const, text: '只看本批材料' }],
    source: { kind: 'user', rpcId: requestId },
  }

  it('只从已 claim 的用户消息取最后一个原生 R，不从正文或通知另造', () => {
    expect(requestIdFromMessages([
      message,
      { ...message, id: 'm2', source: { kind: 'lawbench-context', form: 'snapshot' } },
    ])).toBe(requestId)
    expect(requestIdFromMessages([{ ...message, source: { kind: 'lawbench-context', form: 'snapshot' } }])).toBeUndefined()
  })

  it('task/begin 带同一 R；响应缺 request_scope 时整轮拒绝并按 blocked 收尾，不读取全案 context', async () => {
    const blocked: Array<[string, string]> = []
    const call = vi.fn(async (command: string) => {
      if (command === 'task/begin') {
        return { ok: true as const, value: {
          task_id: taskId, case_id: caseId, skill: null, params, budget, route: 'local' as const, request_id: requestId,
        } }
      }
      if (command === 'task/end') return { ok: true as const, value: {} }
      throw new Error(`unexpected ${command}`)
    })
    const a = new LegalAgent(
      { call } as unknown as CoreClient,
      log,
      (id, code) => { blocked.push([id, code]) },
    )
    expect(await a.preStep(agentObj('s-scope'), 1, { kind: 'enter', messages: [message] })).toEqual({ kind: 'reject' })
    expect(call).toHaveBeenCalledWith('task/begin', expect.objectContaining({ request_id: requestId }))
    expect(call).not.toHaveBeenCalledWith('context', expect.anything())
    expect(call).toHaveBeenCalledWith('task/end', expect.objectContaining({ task_id: taskId, reason: 'blocked' }))
    expect(blocked).toEqual([['s-scope', REQUEST_SCOPE_UNAVAILABLE]])
    expect(a.tasks.has('s-scope')).toBe(false)
  })

  it('同一 R、同一案件、同一非空材料集合才放行；null 明确表示本次整案', () => {
    expect(validRequestScope({ case_id: caseId, request_id: requestId, request_scope: {
      request_id: requestId, case_id: caseId, kind: 'materials',
      materials: [{ material_id: 'M0001', sha256: 'a'.repeat(64) }],
    } }, requestId)).toBe(true)
    expect(validRequestScope({ case_id: caseId, request_id: requestId, request_scope: null }, requestId)).toBe(true)
    expect(validRequestScope({ case_id: caseId, request_id: requestId, request_scope: {
      request_id: '22ab34cd-56ef-4abc-8def-0123456789ab', case_id: caseId, kind: 'materials',
      materials: [{ material_id: 'M0001', sha256: 'a'.repeat(64) }],
    } }, requestId)).toBe(false)
  })

  it('同一 R 的 scoped begin 成功后 context 返回 INPUT_CHANGED，须保留 error notice、清本地任务并按 blocked 结束该任务', async () => {
    const blocked: Array<[string, string]> = []
    const call = vi.fn(async (command: string) => {
      if (command === 'task/begin') {
        return { ok: true as const, value: {
          task_id: taskId, case_id: caseId, skill: null, params, budget, route: 'local' as const,
          request_id: requestId,
          request_scope: {
            request_id: requestId, case_id: caseId, kind: 'materials' as const,
            materials: [{ material_id: 'M0001', sha256: 'a'.repeat(64) }],
          },
        } }
      }
      if (command === 'context') {
        return { ok: false as const, error: { code: 'INPUT_CHANGED', message: 'input changed' } }
      }
      if (command === 'task/end') return { ok: true as const, value: {} }
      throw new Error(`unexpected ${command}`)
    })
    const a = new LegalAgent(
      { call } as unknown as CoreClient,
      log,
      (id, code) => { blocked.push([id, code]) },
    )

    expect(await a.preStep(agentObj('s-context-changed'), 1, { kind: 'enter', messages: [message] })).toEqual({ kind: 'reject' })
    expect(call).toHaveBeenCalledWith('task/begin', expect.objectContaining({ request_id: requestId }))
    expect(call).toHaveBeenCalledWith('context', expect.objectContaining({ task_id: taskId }))
    expect(call).toHaveBeenCalledWith('task/end', expect.objectContaining({ task_id: taskId, reason: 'blocked' }))
    expect(call.mock.calls.map(([command]: [string]) => command)).toEqual(['task/begin', 'context', 'task/end'])
    expect(blocked).toEqual([['s-context-changed', 'INPUT_CHANGED']])
    expect(a.tasks.has('s-context-changed')).toBe(false)
  })

  it('context 失败后两次 task/end 均失败，须对同一任务按 blocked 重试两次并保留结束失败提示', async () => {
    const blocked: Array<[string, string]> = []
    const call = vi.fn(async (command: string) => {
      if (command === 'task/begin') {
        return { ok: true as const, value: {
          task_id: taskId, case_id: caseId, skill: null, params, budget, route: 'local' as const,
          request_id: requestId,
          request_scope: {
            request_id: requestId, case_id: caseId, kind: 'materials' as const,
            materials: [{ material_id: 'M0001', sha256: 'a'.repeat(64) }],
          },
        } }
      }
      if (command === 'context') {
        return { ok: false as const, error: { code: 'INPUT_CHANGED', message: 'input changed' } }
      }
      if (command === 'task/end') {
        return { ok: false as const, error: { code: 'SERVICE_DOWN', message: 'unavailable' } }
      }
      throw new Error(`unexpected ${command}`)
    })
    const a = new LegalAgent(
      { call } as unknown as CoreClient,
      log,
      (id, code) => { blocked.push([id, code]) },
    )

    expect(await a.preStep(agentObj('s-context-end-failed'), 1, { kind: 'enter', messages: [message] })).toEqual({ kind: 'reject' })
    expect(call).toHaveBeenNthCalledWith(3, 'task/end', expect.objectContaining({ task_id: taskId, reason: 'blocked' }))
    expect(call).toHaveBeenNthCalledWith(4, 'task/end', expect.objectContaining({ task_id: taskId, reason: 'blocked' }))
    expect(call.mock.calls.map(([command]: [string]) => command)).toEqual(['task/begin', 'context', 'task/end', 'task/end'])
    expect(blocked).toEqual([['s-context-end-failed', TASK_END_FAILED]])
    expect(a.tasks.has('s-context-end-failed')).toBe(false)
  })
})
