// @vitest-environment jsdom
// T34：外部模型五字段、原草稿保存、真正 credentials Remote 的双 Key 配置态。
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  ExternalKeyControl, ExternalLLMSettings, externalProviderLifecycle, projectAndShowExternalProvider,
  retryExternalProviderProjection, SettingsSection,
} from '../ui/settings.tsx'
import { settingsDraft } from '../ui/settings-draft.ts'
import { registerCore, registerCredentials, registerSettingsRemote } from '../ui/index.tsx'
import {
  app, credentials, setApi, setCredentialsApi, setSettingsRemote,
  type CredentialsApi, type CredentialsRemote, type LawbenchApi, type SettingsRemote,
} from '../ui/state.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
let box: HTMLDivElement

beforeEach(() => {
  box = document.createElement('div')
  document.body.appendChild(box)
})

afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
  box.remove()
  setApi(undefined)
  setCredentialsApi(undefined)
  setSettingsRemote(undefined)
  externalProviderLifecycle.set({ error: null })
  settingsDraft.set({ loaded: null, draft: null, savedAt: null })
  app.set((state) => ({ ...state, dialogs: [] }))
})

const button = (text: string) => [...box.querySelectorAll('button')].find((b) => b.textContent === text)!
const input = (label: string) => box.querySelector(`[aria-label="${label}"]`) as HTMLInputElement
const setInput = async (el: HTMLInputElement, value: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => { setValue.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })) })
}
const state = (configured: boolean, writable = true) => ({
  EXTERNAL_LLM_KEY: { configured, writable },
})

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const deferredValue = <T = void>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

const flushTasks = async (turns = 6) => {
  for (let i = 0; i < turns; i += 1) await act(async () => { await Promise.resolve() })
}

const settingsWithProvider = (model: string, enabled = true): Record<string, unknown> => ({
  v: 1 as const,
  servers: { llm_base_url: 'http://a', prep_base_url: 'http://b', llm_alt_base_url: null, prep_alt_base_url: null },
  defaults: { thinking: '中' as const, window: '64K' as const, max_tokens: 16384 },
  skill_presets: {},
  templates: { 文书: null, 合同: null },
  ocr_fallback_llm: false,
  profile: { lawyer_name: '测试律师' },
  office: { dir: null, invoice_buyer: null },
  converter: 'auto' as const,
  external_llm: {
    enabled,
    base_url: enabled ? 'https://models.example.test/v1' : null,
    model: enabled ? model : null,
    context_window: enabled ? 65536 : null,
    supports_tools: true,
  },
})

const apiWithSettings = (
  getSettings: () => Promise<Record<string, unknown>>,
  putSettings: (value: unknown) => Promise<unknown> = async () => ({ ok: true, value: {} }),
): LawbenchApi => ({
  getSettings,
  putSettings,
  getCapsules: async () => ({
    ok: true,
    value: {
      v: 1,
      hint: '请选择要处理的事项',
      shared: [],
      groups: [{
        id: 'office',
        name: '日常办公',
        hidden: false,
        items: [{
          id: 'invoice',
          name: '发票整理',
          kind: 'tool',
          tool: 'invoice',
          hidden: false,
          custom: false,
        }],
      }],
    },
  }),
  getRemoteAccess: async () => ({
    ok: true,
    value: { enabled: false, has_code: false, state: 'off', reason: null },
  }),
  setupState: async () => ({ configured: true, hasSettings: true, hasKey: false, service: 'fake' }),
  listSkills: async () => ({ ok: true, value: { skills: [] } }),
} as unknown as LawbenchApi)

const rawLawbench = (getSettings: () => Promise<Record<string, unknown>>) => ({
  getSettings: async () => ({ ok: true as const, value: await getSettings() }),
})

const drainProviderQueue = async <T>(pending: Array<Deferred<T>>, value: T): Promise<void> => {
  for (let round = 0; round < 4; round += 1) {
    for (const item of pending.splice(0)) item.resolve(value)
    await flushTasks(10)
  }
}

const coreContext = (lawbench: ReturnType<typeof rawLawbench>) => {
  const effects: Array<() => void> = []
  const resetListeners = new Set<() => void>()
  const ctx = {
    remote: { lawbench },
    slots: {
      inject: (_name: string, fn: () => unknown) => fn(),
      register: () => () => {},
    },
    effect: (fn: () => unknown) => { effects.push(fn() as () => void) },
    on: (event: string, listener: () => void) => {
      if (event !== 'connection/reset') throw new Error(`unexpected event: ${event}`)
      resetListeners.add(listener)
      return () => { resetListeners.delete(listener) }
    },
  }
  return { ctx: ctx as never, dispose: () => { for (const off of effects.splice(0)) off() } }
}

const settingsContext = (remote: SettingsRemote) => {
  const effects: Array<() => void> = []
  const ctx = {
    remote: { settings: remote },
    effect: (fn: () => unknown) => { effects.push(fn() as () => void) },
    on: () => () => {},
  }
  return { ctx, dispose: () => { for (const off of effects.splice(0)) off() } }
}

describe('T34 外部模型设置', () => {
  it('旧响应缺 external_llm 时显示关闭态且不崩溃', async () => {
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalLLMSettings, { value: undefined, onChange: () => {} })) })
    const toggle = box.querySelector('[aria-label="启用外部模型"]') as HTMLInputElement
    expect(toggle.checked).toBe(false)
    expect(box.textContent).toContain('关闭')
    expect((box.querySelector('[aria-label="外部模型地址"]') as HTMLInputElement).disabled).toBe(true)
  })

  it('五个外部模型字段从设置页真实控件经完整草稿保存', async () => {
    const settings = {
      v: 1,
      servers: { llm_base_url: 'http://a', prep_base_url: 'http://b', llm_alt_base_url: null, prep_alt_base_url: null },
      defaults: { thinking: '中', window: '64K', max_tokens: 16384 },
      skill_presets: {}, templates: { 文书: null, 合同: null }, ocr_fallback_llm: false,
      profile: { lawyer_name: '测试律师' }, office: { dir: null, invoice_buyer: null }, converter: 'auto',
    }
    let put: Record<string, unknown> | undefined
    setApi(apiWithSettings(
      async () => structuredClone(settings),
      async (value) => { put = value as Record<string, unknown>; return { ok: true, value: {} } },
    ))
    settingsDraft.set({ loaded: structuredClone(settings), draft: structuredClone(settings), savedAt: null })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    await act(async () => { input('启用外部模型').click() })
    await setInput(input('外部模型地址'), 'https://models.example.test/v1')
    await setInput(input('外部模型名'), 'fake-chat-model')
    await setInput(input('外部模型上下文窗口'), '65536')
    await act(async () => { input('外部模型声明支持工具').click() })
    await act(async () => { button('保存').click(); await Promise.resolve(); await Promise.resolve() })
    expect(put?.external_llm).toEqual({
      enabled: true,
      base_url: 'https://models.example.test/v1',
      model: 'fake-chat-model',
      context_window: 65536,
      supports_tools: false,
    })
    expect(put?.profile).toEqual({ lawyer_name: '测试律师' })
  })

  it('Key 只投配置态；set/unset 使用 EXTERNAL_LLM_KEY，提交后 DOM 不含 fake Key', async () => {
    let configured = false
    const calls: string[] = []
    const api: CredentialsApi = {
      describe: async (refs) => Object.fromEntries(refs.map((ref) => [ref, { configured, writable: true }])),
      set: async (ref, value) => { calls.push(`set:${ref}:${value}`); configured = true },
      unset: async (ref) => { calls.push(`unset:${ref}`); configured = false },
    }
    setCredentialsApi(api)
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)) })
    await act(async () => { button('保存外部 Key').click() })
    const input = box.querySelector('[aria-label="外部模型 Key"]') as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => { setValue.call(input, 'fake-external-secret-0001'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => { button('保存外部 Key').click(); await Promise.resolve() })
    expect(calls).toContain('set:EXTERNAL_LLM_KEY:fake-external-secret-0001')
    expect(box.innerHTML).not.toContain('fake-external-secret-0001')
    expect((box.querySelector('[aria-label="外部模型 Key"]') as HTMLInputElement | null)).toBeNull()
    await act(async () => { button('清除外部 Key').click(); await Promise.resolve() })
    expect(calls).toContain('unset:EXTERNAL_LLM_KEY')
  })

  it('真实 registerCredentials 消费 connection/reset；同一 Remote 恢复、卸载和迟到回复受控', async () => {
    let deny = false
    let describeCalls = 0
    let rejectFirst!: (reason?: unknown) => void
    let resolveLate!: (value: Awaited<ReturnType<CredentialsRemote['describe']>>) => void
    const first = new Promise<Awaited<ReturnType<CredentialsRemote['describe']>>>((_, reject) => { rejectFirst = reject })
    const late = new Promise<Awaited<ReturnType<CredentialsRemote['describe']>>>((resolve) => { resolveLate = resolve })
    const remote: CredentialsRemote = {
      describe: async (refs) => {
        describeCalls += 1
        if (describeCalls === 1) return first
        if (describeCalls === 2) {
          return {
            ok: true,
            value: Object.fromEntries(refs.map((ref) => [ref, { configured: true, writable: true }])),
          }
        }
        return late
      },
      set: async () => deny
        ? { ok: false, error: { message: 'credential/rejected' } }
        : { ok: true, value: undefined },
      unset: async () => deny
        ? { ok: false, error: { message: 'credential/rejected' } }
        : { ok: true, value: undefined },
    }
    const offs: Array<() => void> = []
    const listeners = new Set<() => void>()
    const events: string[] = []
    const emitReset = () => { for (const listener of [...listeners]) listener() }
    registerCredentials({
      remote: { credentials: remote },
      effect: (fn) => { offs.push(fn() as () => void) },
      on: (event, listener) => {
        events.push(event)
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    })

    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)); await Promise.resolve() })
    expect(describeCalls).toBe(1)
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)

    await act(async () => { rejectFirst(new Error('offline')); await first.catch(() => undefined) })
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)

    await act(async () => { emitReset(); await Promise.resolve(); await Promise.resolve() })
    expect(events).toEqual(['connection/reset'])
    expect(describeCalls).toBe(2)
    expect(box.textContent).toContain('已设置')
    expect(button('保存外部 Key').disabled).toBe(false)
    expect(button('清除外部 Key').disabled).toBe(false)

    await expect(credentials().set('EXTERNAL_LLM_KEY', 'fake-external-secret-0002')).resolves.toBeUndefined()
    deny = true
    await expect(credentials().unset('EXTERNAL_LLM_KEY')).rejects.toThrow()

    await act(async () => { emitReset(); await Promise.resolve(); await Promise.resolve() })
    expect(describeCalls).toBe(3)
    expect(box.textContent).toContain('状态未知')
    for (const off of offs) off()
    expect(() => credentials()).toThrow()
    await act(async () => {
      resolveLate({
        ok: true,
        value: { EXTERNAL_LLM_KEY: { configured: false, writable: true } },
      })
      await late
    })
    expect(box.textContent).toContain('状态未知')
    emitReset()
    expect(describeCalls).toBe(3)
    expect(events).toEqual(['connection/reset'])
  })

  it('Enter 与按钮共用非空、可写、非忙碌门', async () => {
    const set = vi.fn(async () => {})
    setCredentialsApi({
      describe: async (refs) => Object.fromEntries(refs.map((ref) => [ref, { configured: false, writable: true }])),
      set,
      unset: async () => {},
    })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)) })
    await act(async () => { button('保存外部 Key').click() })
    const input = box.querySelector('[aria-label="外部模型 Key"]') as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => { setValue.call(input, '   '); input.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    expect(set).not.toHaveBeenCalled()
    expect(button('保存外部 Key').disabled).toBe(true)
  })

  it('挂载后凭据 Remote 晚到、撤下或重连时，控件按当前能力刷新', async () => {
    let reads = 0
    const first: CredentialsApi = {
      describe: async (refs) => { reads += 1; return Object.fromEntries(refs.map((ref) => [ref, { configured: true, writable: true }])) },
      set: async () => {},
      unset: async () => {},
    }
    const second: CredentialsApi = {
      describe: async (refs) => Object.fromEntries(refs.map((ref) => [ref, { configured: false, writable: true }])),
      set: async () => {},
      unset: async () => {},
    }
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)) })
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)

    await act(async () => { setCredentialsApi(first); await Promise.resolve() })
    expect(reads).toBe(1)
    expect(box.textContent).toContain('已设置')
    expect(button('清除外部 Key')).toBeDefined()

    await act(async () => { setCredentialsApi(undefined); await Promise.resolve() })
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)
    expect(box.querySelector('button[disabled]')?.textContent).toBe('保存外部 Key')

    await act(async () => { setCredentialsApi(second); await Promise.resolve() })
    expect(box.textContent).toContain('未设置')
    expect(button('保存外部 Key').disabled).toBe(false)
  })

  it('A 已确认后换 B：B 首读挂起与不可写期间，真实点击和 Enter 都不调用 B', async () => {
    type KeyState = ReturnType<typeof state>
    const deferred = () => {
      let resolve!: (value: KeyState) => void
      const promise = new Promise<KeyState>((done) => { resolve = done })
      return { promise, resolve }
    }
    const pendingB: Array<ReturnType<typeof deferred>> = []
    const pendingC: Array<ReturnType<typeof deferred>> = []
    const writes: string[] = []
    const deletes: string[] = []
    const apiA: CredentialsApi = {
      describe: async (refs) => Object.fromEntries(refs.map((ref) => [ref, { configured: true, writable: true }])),
      set: async () => {},
      unset: async () => {},
    }
    const apiB: CredentialsApi = {
      describe: () => { const read = deferred(); pendingB.push(read); return read.promise },
      set: async (_ref, value) => { writes.push(`B:${value}`) },
      unset: async () => { deletes.push('B') },
    }
    const apiC: CredentialsApi = {
      describe: () => { const read = deferred(); pendingC.push(read); return read.promise },
      set: async (_ref, value) => { writes.push(`C:${value}`) },
      unset: async () => { deletes.push('C') },
    }

    setCredentialsApi(apiA)
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)); await Promise.resolve() })
    expect(box.textContent).toContain('已设置')
    await act(async () => { button('保存外部 Key').click() })
    await setInput(input('外部模型 Key'), 'fake-external-secret-race-0002')

    await act(async () => { setCredentialsApi(apiB); await Promise.resolve() })
    expect(pendingB).toHaveLength(1)
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)
    expect(box.querySelector('button[disabled]')?.textContent).toBe('保存外部 Key')
    await act(async () => {
      button('保存外部 Key').click()
      input('外部模型 Key').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await Promise.resolve()
    })
    expect(writes).toEqual([])
    expect(deletes).toEqual([])

    await act(async () => { pendingB[0].resolve(state(true, false)); await pendingB[0].promise })
    expect(box.textContent).toContain('已设置')
    expect(button('保存外部 Key').disabled).toBe(true)
    expect(button('清除外部 Key').disabled).toBe(true)
    await act(async () => {
      button('保存外部 Key').click()
      input('外部模型 Key').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      button('清除外部 Key').click()
      await Promise.resolve()
    })
    expect(writes).toEqual([])
    expect(deletes).toEqual([])

    await act(async () => { setCredentialsApi(apiC); await Promise.resolve() })
    expect(pendingC).toHaveLength(1)
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)
    await act(async () => { pendingC[0].resolve(state(true, true)); await pendingC[0].promise })
    expect(button('保存外部 Key').disabled).toBe(false)
    expect(button('清除外部 Key').disabled).toBe(false)
    await act(async () => {
      button('保存外部 Key').click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(writes).toEqual(['C:fake-external-secret-race-0002'])
    expect(pendingC).toHaveLength(2)
    await act(async () => { pendingC[1].resolve(state(true, true)); await pendingC[1].promise })
    expect(box.textContent).toContain('外部 Key 已保存')
    expect(deletes).toEqual([])
  })

  it('能力换代后仅在新 API 可写时从真实 UI 写入，旧 API 晚回不倒灌', async () => {
    type KeyState = ReturnType<typeof state>
    const deferred = () => {
      let resolve!: (value: KeyState) => void
      const promise = new Promise<KeyState>((done) => { resolve = done })
      return { promise, resolve }
    }
    const pendingA: Array<ReturnType<typeof deferred>> = []
    const pendingB: Array<ReturnType<typeof deferred>> = []
    const writes: string[] = []
    const apiA: CredentialsApi = {
      describe: () => { const read = deferred(); pendingA.push(read); return read.promise },
      set: async () => {},
      unset: async () => {},
    }
    const apiB: CredentialsApi = {
      describe: () => { const read = deferred(); pendingB.push(read); return read.promise },
      set: async (_ref, value) => { writes.push(value) },
      unset: async () => {},
    }
    setCredentialsApi(apiA)
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)); await Promise.resolve() })
    expect(pendingA).toHaveLength(1)
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)

    await act(async () => { setCredentialsApi(apiB); await Promise.resolve() })
    expect(pendingB).toHaveLength(1)
    expect(box.textContent).toContain('状态未知')
    expect(button('保存外部 Key').disabled).toBe(true)
    await act(async () => { pendingB[0].resolve(state(false)); await pendingB[0].promise })
    expect(box.textContent).toContain('未设置')
    expect(button('保存外部 Key').disabled).toBe(false)

    await act(async () => { button('保存外部 Key').click() })
    await setInput(input('外部模型 Key'), 'fake-external-secret-race-0001')
    expect(button('保存外部 Key').disabled).toBe(false)
    await act(async () => {
      button('保存外部 Key').click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(writes).toEqual(['fake-external-secret-race-0001'])
    expect(pendingB).toHaveLength(2)

    await act(async () => { pendingB[1].resolve(state(true)); await pendingB[1].promise })
    expect(box.textContent).toContain('已设置')
    expect(button('清除外部 Key')).toBeDefined()
    expect(box.textContent).toContain('外部 Key 已保存')
    await act(async () => { pendingA[0].resolve(state(false)); await pendingA[0].promise })
    expect(box.textContent).toContain('已设置')
    expect(box.textContent).not.toContain('未设置')
    expect(box.textContent).toContain('外部 Key 已保存')
    expect(button('清除外部 Key')).toBeDefined()
  })

  it('unset 外壳成功但 fresh describe 仍配置时不报已清除', async () => {
    const calls: string[] = []
    const api: CredentialsApi = {
      describe: async (refs) => { calls.push('describe'); return Object.fromEntries(refs.map((ref) => [ref, { configured: true, writable: true }])) },
      set: async () => {},
      unset: async () => { calls.push('unset') },
    }
    setCredentialsApi(api)
    root = createRoot(box)
    await act(async () => { root!.render(createElement(ExternalKeyControl)); await Promise.resolve() })
    await act(async () => { button('清除外部 Key').click(); await Promise.resolve(); await Promise.resolve() })
    expect(calls).toEqual(['describe', 'unset', 'describe'])
    expect(box.textContent).toContain('未确认清除')
    expect(box.textContent).not.toContain('外部 Key 已清除')
    expect(box.textContent).toContain('已设置')
  })

  it('API-only 与 Remote-only 换代后，已进入 mutate 的旧成功和旧错误都不发布', async () => {
    type Mutation = Awaited<ReturnType<SettingsRemote['mutate']>>
    const operations: string[] = []
    const pending: Array<Deferred<Mutation>> = []
    const remote = (label: string): SettingsRemote => ({
      mutate: async (_ns, ops) => {
        const model = (ops[0]?.value as { models?: Array<{ id: string }> } | undefined)?.models?.[0]?.id ?? 'unset'
        operations.push(`${label}:${model}`)
        const result = deferredValue<Mutation>()
        pending.push(result)
        return result.promise
      },
    })
    const api = (name: string) => apiWithSettings(async () =>
      ({ ...settingsWithProvider('old-model'), profile: { lawyer_name: name } }))
    const remoteA = remote('A')
    const remoteB = remote('B')
    const remoteC = remote('C')
    const remoteD = remote('D')

    try {
      setApi(api('api-a'))
      setSettingsRemote(remoteA)
      projectAndShowExternalProvider()
      await flushTasks()
      expect(operations).toEqual(['A:old-model'])

      // 仅换实际 API；不换 Remote，也不手工推进 provider revision。
      setApi(api('api-b'))
      externalProviderLifecycle.set({ error: '新的错误' })
      pending.shift()!.resolve({ ok: true, value: { revision: 1 } })
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('新的错误')
      expect(app.get().dialogs.filter((x) => x.kind === 'notice')).toEqual([])

      projectAndShowExternalProvider()
      await flushTasks()
      expect(operations).toEqual(['A:old-model', 'A:old-model'])
      setApi(api('api-c'))
      externalProviderLifecycle.set({ error: '错误仍属于新代次' })
      // 旧 mutate 以受控 rejection 真正进入 catch；后续 ok:false 子案仍保留。
      pending.shift()!.reject(new Error('old-api-failure'))
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('错误仍属于新代次')
      expect(app.get().dialogs.filter((x) => x.kind === 'notice')).toEqual([])

      // 仅换 Remote 身份；不换 API，也不手工推进 provider revision。
      setSettingsRemote(remoteB)
      projectAndShowExternalProvider()
      await flushTasks()
      expect(operations).toEqual(['A:old-model', 'A:old-model', 'B:old-model'])
      setSettingsRemote(remoteC)
      externalProviderLifecycle.set({ error: 'Remote 新代次错误' })
      pending.shift()!.resolve({ ok: true, value: { revision: 3 } })
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('Remote 新代次错误')
      expect(operations.filter((x) => x.startsWith('C:'))).toEqual([])

      projectAndShowExternalProvider()
      await flushTasks()
      expect(operations).toEqual(['A:old-model', 'A:old-model', 'B:old-model', 'C:old-model'])
      setSettingsRemote(remoteD)
      externalProviderLifecycle.set({ error: 'Remote 新代次仍保留' })
      pending.shift()!.resolve({ ok: false, error: { message: 'old-remote-failure' } })
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('Remote 新代次仍保留')
      expect(operations.filter((x) => x.startsWith('D:'))).toEqual([])
      expect(app.get().dialogs.filter((x) => x.kind === 'notice')).toEqual([])
    } finally {
      await drainProviderQueue(pending, { ok: true as const, value: { revision: 99 } })
    }
  })

  it('排队未进入 mutate 的旧配置在 API/Remote 换代后不写新 Remote', async () => {
    type Mutation = Awaited<ReturnType<SettingsRemote['mutate']>>
    const pending: Array<Deferred<Mutation>> = []
    const modelOf = (ops: Array<{ value?: unknown }>): string =>
      (ops[0]?.value as { models?: Array<{ id: string }> } | undefined)?.models?.[0]?.id ?? 'unset'
    const deferredMutation = (): Deferred<Mutation> => {
      const result = deferredValue<Mutation>()
      pending.push(result)
      return result
    }

    try {
      // 子案一：旧配置已排队时只换实际 API，Remote 仍是同一个对象。
      const apiReads: string[] = []
      const writesA: string[] = []
      const firstApiOnly = deferredMutation()
      let apiOnlyEntered = false
      const remoteA: SettingsRemote = {
        mutate: async (_ns, ops) => {
          writesA.push(modelOf(ops))
          if (!apiOnlyEntered) {
            apiOnlyEntered = true
            return firstApiOnly.promise
          }
          return { ok: true, value: { revision: 2 } }
        },
      }
      const apiA = apiWithSettings(async () => {
        apiReads.push('A')
        return settingsWithProvider('old-model')
      })
      const apiB = apiWithSettings(async () => {
        apiReads.push('B')
        return settingsWithProvider('latest-model')
      })

      setApi(apiA)
      setSettingsRemote(remoteA)
      projectAndShowExternalProvider()
      await flushTasks()
      expect(writesA).toEqual(['old-model'])

      // 第二份 A 配置已排队，但旧 mutate 仍占住串行队列；不推进 revision。
      projectAndShowExternalProvider()
      await flushTasks()
      expect(writesA).toEqual(['old-model'])
      expect(apiReads).toEqual(['A', 'A'])

      setApi(apiB)
      firstApiOnly.resolve({ ok: true, value: { revision: 1 } })
      await flushTasks(10)
      expect(writesA).toEqual(['old-model'])
      expect(apiReads).toEqual(['A', 'A'])

      // 队列排净后，从当前合法 API 入口投影 latest 作为正向控制。
      projectAndShowExternalProvider()
      await flushTasks(10)
      expect(writesA).toEqual(['old-model', 'latest-model'])
      expect(apiReads).toEqual(['A', 'A', 'B'])

      // 子案二：旧配置已排队时只换 Remote，API 身份保持不变。
      const oldWrites: string[] = []
      const newWrites: string[] = []
      const apiStableReads: string[] = []
      let stableModel = 'old-model'
      let remoteOnlyEntered = false
      const firstRemoteOnly = deferredMutation()
      const remoteOld: SettingsRemote = {
        mutate: async (_ns, ops) => {
          oldWrites.push(modelOf(ops))
          if (!remoteOnlyEntered) {
            remoteOnlyEntered = true
            return firstRemoteOnly.promise
          }
          return { ok: true, value: { revision: 4 } }
        },
      }
      const remoteNew: SettingsRemote = {
        mutate: async (_ns, ops) => {
          newWrites.push(modelOf(ops))
          return { ok: true, value: { revision: 5 } }
        },
      }
      const apiStable = apiWithSettings(async () => {
        apiStableReads.push(stableModel)
        return settingsWithProvider(stableModel)
      })

      setApi(apiStable)
      setSettingsRemote(remoteOld)
      projectAndShowExternalProvider()
      await flushTasks()
      expect(oldWrites).toEqual(['old-model'])

      projectAndShowExternalProvider()
      await flushTasks()
      expect(oldWrites).toEqual(['old-model'])
      expect(apiStableReads).toEqual(['old-model', 'old-model'])

      setSettingsRemote(remoteNew)
      firstRemoteOnly.resolve({ ok: true, value: { revision: 3 } })
      await flushTasks(10)
      expect(oldWrites).toEqual(['old-model'])
      expect(newWrites).toEqual([])
      expect(apiStableReads).toEqual(['old-model', 'old-model'])

      // 只有队列排净后，新 Remote 才从当前合法生命周期入口拿到 latest。
      stableModel = 'latest-model'
      projectAndShowExternalProvider()
      await flushTasks(10)
      expect(newWrites).toEqual(['latest-model'])
      expect(oldWrites).toEqual(['old-model'])
      expect(apiStableReads).toEqual(['old-model', 'old-model', 'latest-model'])
    } finally {
      await drainProviderQueue(pending, { ok: true as const, value: { revision: 99 } })
    }
  })

  it('真实 registerSettingsRemote 先接、registerCore 后到与 API 换代都重读当前配置，旧结果晚到不覆盖最新', async () => {
    type Mutation = Awaited<ReturnType<SettingsRemote['mutate']>>
    const state: { providers: Record<string, unknown> } = {
      providers: {
        lawfirm: { displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' },
        external: { displayName: '旧外部模型' },
      },
    }
    const variants: string[] = []
    const pending: Array<{
      op: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }>
      result: Deferred<Mutation>
    }> = []
    const remote: SettingsRemote = {
      mutate: async (_ns, ops) => {
        const model = (ops[0]?.value as { models?: Array<{ id: string }> } | undefined)?.models?.[0]?.id ?? 'unset'
        variants.push(model)
        const result = deferredValue<Mutation>()
        pending.push({ op: ops, result })
        return result.promise
      },
    }
    const disposers: Array<() => void> = []
    let latestRead: Deferred<Record<string, unknown>> | undefined
    try {
      const providerRemote = settingsContext(remote)
      disposers.push(providerRemote.dispose)
      registerSettingsRemote(providerRemote.ctx)
      await flushTasks()
      expect(variants).toEqual([])

      const apiA = coreContext(rawLawbench(async () => settingsWithProvider('old-model')))
      disposers.push(apiA.dispose)
      registerCore(apiA.ctx)
      await flushTasks()
      expect(variants).toEqual(['old-model'])
      externalProviderLifecycle.set({ error: '旧调用期间的新错误' })

      latestRead = deferredValue<Record<string, unknown>>()
      let apiBReads = 0
      const apiB = coreContext(rawLawbench(async () => {
        apiBReads += 1
        if (apiBReads <= 2) return latestRead!.promise
        throw new Error('current-settings-unavailable')
      }))
      disposers.push(apiB.dispose)
      registerCore(apiB.ctx)
      await flushTasks()
      apiA.dispose()
      latestRead.resolve(settingsWithProvider('latest-model'))
      await flushTasks()
      expect(variants).toEqual(['old-model'])

      pending[0]!.result.resolve({ ok: false, error: { message: 'old-late-failure' } })
      await flushTasks()
      expect(variants).toEqual(['old-model', 'latest-model'])
      expect(externalProviderLifecycle.get().error).toBe('旧调用期间的新错误')

      for (const op of pending[1]!.op) {
        if (op.op === 'set') state.providers[op.path[1]!] = op.value
        else delete state.providers[op.path[1]!]
      }
      pending[1]!.result.resolve({ ok: true, value: { revision: 2 } })
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBeNull()
      expect(state.providers.external).toMatchObject({
        baseURL: 'http://127.0.0.1:18765/v1-ext',
        models: [expect.objectContaining({ id: 'latest-model' })],
      })
      expect(state.providers.lawfirm).toEqual({
        displayName: '律所模型',
        baseURL: 'http://127.0.0.1:18765/v1',
      })

      app.set((current) => ({ ...current, dialogs: [] }))
      retryExternalProviderProjection()
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('没能读取服务设置，外部模型路由没有同步')
      expect(app.get().dialogs.filter((x) => x.kind === 'notice')).toHaveLength(1)
      expect(variants).toEqual(['old-model', 'latest-model'])
      expect(state.providers.lawfirm).toEqual({
        displayName: '律所模型',
        baseURL: 'http://127.0.0.1:18765/v1',
      })
    } finally {
      latestRead?.resolve(settingsWithProvider('latest-model'))
      for (const dispose of disposers.splice(0).reverse()) dispose()
      await drainProviderQueue(pending.splice(0).map((item) => item.result), {
        ok: true as const,
        value: { revision: 99 },
      })
    }
  })

  it('外部禁用只 unset external，provider 可见错误重试成功后恢复且保留 lawfirm', async () => {
    const state: { providers: Record<string, unknown> } = {
      providers: {
        lawfirm: { displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' },
        external: { displayName: '旧外部模型' },
      },
    }
    let attempt = 0
    const remote: SettingsRemote = {
      mutate: async (_ns, ops) => {
        attempt += 1
        if (attempt === 1) return { ok: false, error: { message: 'provider-failed' } }
        for (const op of ops) {
          if (op.op === 'set') state.providers[op.path[1]] = op.value
          else delete state.providers[op.path[1]]
        }
        return { ok: true, value: { revision: attempt } }
      },
    }
    setApi(apiWithSettings(async () => settingsWithProvider('ignored-model', false)))
    const registered = settingsContext(remote)
    try {
      registerSettingsRemote(registered.ctx)
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBe('DSH 没有接受外部模型路由，请重试（错误码：unknown）')

      const loaded = settingsWithProvider('ignored-model', false)
      settingsDraft.set({ loaded, draft: structuredClone(loaded), savedAt: null })
      root = createRoot(box)
      await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
      expect(box.querySelector('[role="alert"]')?.textContent).toContain('外部模型当前不可用')

      await act(async () => { button('重试同步').click(); await Promise.resolve(); await Promise.resolve() })
      await flushTasks()
      expect(externalProviderLifecycle.get().error).toBeNull()
      expect(box.querySelector('[role="alert"]')).toBeNull()
      expect(state.providers.external).toBeUndefined()
      expect(state.providers.lawfirm).toEqual({
        displayName: '律所模型',
        baseURL: 'http://127.0.0.1:18765/v1',
      })
    } finally {
      registered.dispose()
    }
  })
})
