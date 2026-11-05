// @vitest-environment jsdom
import {
  beginExternalProviderSync, CLOSED_EXTERNAL_LLM, EXTERNAL_PROVIDER_BASE_URL, EXTERNAL_PROVIDER_NS,
  externalProviderLifecycle, projectAndShowExternalProvider, syncExternalProvider,
} from '../ui/settings.tsx'
import {
  setApi, setSettingsRemote, type LawbenchApi, type RemoteResult, type SettingsRemote,
} from '../ui/state.ts'

const UNSET_EXTERNAL = [{ op: 'unset' as const, path: ['providers', 'external'] }]
const ENABLED_EXTERNAL = {
  enabled: true,
  base_url: 'https://models.example.invalid/v1',
  model: 'fixture-chat-model',
  context_window: 65536,
  supports_tools: true,
}

const mutationResult = (): RemoteResult<unknown> => ({ ok: true, value: { revision: 1 } })

const liveProviders = (providers: Record<string, unknown>) => ({
  ok: true as const,
  value: {
    namespaces: [{
      ns: EXTERNAL_PROVIDER_NS,
      applies: 'live',
      value: { providers },
      revision: 7,
    }],
  },
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

const flush = async (turns = 8): Promise<void> => {
  for (let index = 0; index < turns; index += 1) await Promise.resolve()
}

const currentApi = (): LawbenchApi => ({ getSettings: async () => ({}) } as unknown as LawbenchApi)
const providerApi = (): LawbenchApi => ({
  getSettings: async () => ({ external_llm: CLOSED_EXTERNAL_LLM }),
} as unknown as LawbenchApi)

afterEach(() => {
  setSettingsRemote(undefined)
  setApi(undefined)
})

describe('T34 禁用外部模型时的实时幂等检查', () => {
  it('实时确认单一 live llm-pi-ai 没有 external 时零写入', async () => {
    const describe = vi.fn(async () => liveProviders({
      lawfirm: { displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' },
    }))
    const mutate = vi.fn(async () => mutationResult())
    setApi(currentApi())
    setSettingsRemote({ describe, mutate })

    await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBeNull()
    expect(describe).toHaveBeenCalledTimes(1)
    expect(describe).toHaveBeenCalledWith()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('existing external 即使值为 undefined 或 null 仍发原样 unset', async () => {
    const lawfirm = { displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' }
    for (const external of [undefined, null]) {
      const providers = { lawfirm, external }
      const mutate = vi.fn(async () => mutationResult())
      setApi(currentApi())
      setSettingsRemote({
        describe: async () => liveProviders(providers),
        mutate,
      })

      await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBeNull()
      expect(mutate).toHaveBeenCalledTimes(1)
      expect(mutate).toHaveBeenCalledWith(EXTERNAL_PROVIDER_NS, UNSET_EXTERNAL, undefined)
      expect(providers.lawfirm).toBe(lawfirm)
      expect(providers.external).toBe(external)
      expect(Object.prototype.hasOwnProperty.call(providers, 'external')).toBe(true)
    }
  })

  it('describe 缺失或不可调用时保持原 unset 写入路径', async () => {
    for (const remote of [
      { mutate: vi.fn(async () => mutationResult()) },
      { describe: 1 as never, mutate: vi.fn(async () => mutationResult()) },
    ] as SettingsRemote[]) {
      setApi(currentApi())
      setSettingsRemote(remote)

      await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBeNull()
      expect(remote.mutate).toHaveBeenCalledTimes(1)
      expect(remote.mutate).toHaveBeenCalledWith(EXTERNAL_PROVIDER_NS, UNSET_EXTERNAL, undefined)
    }
  })

  it('拒绝、抛错和所有不明确描述形态都不被当作 absence，继续原 unset', async () => {
    const malformed = [
      async () => ({ ok: false as const, error: { message: 'offline' } }),
      async () => { throw new Error('describe failed') },
      async () => ({ ok: true as const }),
      async () => ({ ok: true as const, value: { namespaces: 'invalid' } }),
      async () => ({ ok: true as const, value: { namespaces: [] } }),
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: description.value.namespaces.map((row) => ({ ...row, ns: 'other-namespace' })) } }
      },
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: [...description.value.namespaces, ...description.value.namespaces] } }
      },
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: description.value.namespaces.map((row) => ({ ...row, applies: 'static' })) } }
      },
      async () => {
        const description = liveProviders({})
        return {
          ...description,
          value: {
            namespaces: description.value.namespaces.map((row) => ({
              ns: row.ns,
              applies: row.applies,
              revision: row.revision,
            })),
          },
        }
      },
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: description.value.namespaces.map((row) => ({ ...row, value: { providers: null } })) } }
      },
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: description.value.namespaces.map((row) => ({ ...row, value: {} })) } }
      },
      async () => {
        const description = liveProviders({})
        return { ...description, value: { namespaces: description.value.namespaces.map((row) => ({ ...row, value: { providers: [] } })) } }
      },
    ]

    for (const describeResult of malformed) {
      const mutate = vi.fn(async () => mutationResult())
      setApi(currentApi())
      setSettingsRemote({ describe: describeResult as SettingsRemote['describe'], mutate })
      await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBeNull()
      expect(mutate).toHaveBeenCalledTimes(1)
      expect(mutate).toHaveBeenCalledWith(EXTERNAL_PROVIDER_NS, UNSET_EXTERNAL, undefined)
    }
  })

  it('描述失败后原 mutate 的失败仍是可见错误，不被幂等检查吞掉', async () => {
    setApi(currentApi())
    setSettingsRemote({
      describe: async () => ({ ok: false, error: { message: 'describe failed' } }),
      mutate: async () => ({ ok: false, error: { code: 'settings/rejected', message: 'write failed' } }),
    })

    await expect(syncExternalProvider(CLOSED_EXTERNAL_LLM)).resolves.toBe(
      'DSH 没有接受外部模型路由，请重试（错误码：settings/rejected）',
    )
  })

  it('启用分支不调用 describe，原 set 参数完全保留', async () => {
    const describe = vi.fn(async () => liveProviders({}))
    const mutate = vi.fn(async () => mutationResult())
    setApi(currentApi())
    setSettingsRemote({ describe, mutate })

    await expect(syncExternalProvider(ENABLED_EXTERNAL)).resolves.toBeNull()
    expect(describe).not.toHaveBeenCalled()
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith(EXTERNAL_PROVIDER_NS, [{
      op: 'set',
      path: ['providers', 'external'],
      value: {
        displayName: '外部模型',
        api: 'openai-completions',
        baseURL: EXTERNAL_PROVIDER_BASE_URL,
        apiKeyEnv: 'EXTERNAL_LLM_KEY',
        timeoutMs: 1200000,
        retryPolicy: { mode: 'normal', maxRetries: 1 },
        models: [{
          id: 'fixture-chat-model',
          name: '外部模型',
          contextWindow: 65536,
          input: ['text'],
        }],
      },
    }], undefined)
  })

  it('describe 在途时仅换 Remote 或实际 API，旧结果不写新目标也不发布', async () => {
    for (const changed of ['Remote', '实际 API'] as const) {
      const description = deferred<RemoteResult<unknown>>()
      const entered = deferred<void>()
      const oldMutate = vi.fn(async () => mutationResult())
      const newMutate = vi.fn(async () => mutationResult())
      const remoteA: SettingsRemote = {
        describe: () => { entered.resolve(undefined); return description.promise },
        mutate: oldMutate,
      }
      const remoteB: SettingsRemote = { mutate: newMutate }
      setApi(providerApi())
      setSettingsRemote(remoteA)
      externalProviderLifecycle.set({ error: '保留当前错误' })
      projectAndShowExternalProvider()
      await entered.promise

      if (changed === 'Remote') setSettingsRemote(remoteB)
      else setApi(providerApi())
      description.resolve(liveProviders({}))
      await flush()

      expect(oldMutate).not.toHaveBeenCalled()
      expect(newMutate).not.toHaveBeenCalled()
      expect(externalProviderLifecycle.get().error).toBe('保留当前错误')
    }
  })

  it('describe 在途时代次变化，旧结果不写当前 Remote 也不发布', async () => {
    const description = deferred<RemoteResult<unknown>>()
    const entered = deferred<void>()
    const mutate = vi.fn(async () => mutationResult())
    setApi(providerApi())
    setSettingsRemote({
      describe: () => { entered.resolve(undefined); return description.promise },
      mutate,
    })
    externalProviderLifecycle.set({ error: '保留当前错误' })
    projectAndShowExternalProvider()
    await entered.promise

    beginExternalProviderSync()
    description.resolve(liveProviders({}))
    await flush()

    expect(mutate).not.toHaveBeenCalled()
    expect(externalProviderLifecycle.get().error).toBe('保留当前错误')
  })

  it('禁用 describe 在途时排队的新启用选择仍按原 set 路径落盘', async () => {
    const description = deferred<RemoteResult<unknown>>()
    const entered = deferred<void>()
    const describe = vi.fn(() => { entered.resolve(undefined); return description.promise })
    const mutate = vi.fn(async () => mutationResult())
    setApi(currentApi())
    setSettingsRemote({ describe, mutate })

    const oldRevision = beginExternalProviderSync()
    const oldDisabled = syncExternalProvider(CLOSED_EXTERNAL_LLM, oldRevision)
    await entered.promise
    const newRevision = beginExternalProviderSync()
    const newEnabled = syncExternalProvider(ENABLED_EXTERNAL, newRevision)

    description.resolve(liveProviders({}))
    await expect(Promise.all([oldDisabled, newEnabled])).resolves.toEqual([null, null])
    expect(describe).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith(EXTERNAL_PROVIDER_NS, [{
      op: 'set',
      path: ['providers', 'external'],
      value: expect.objectContaining({
        baseURL: EXTERNAL_PROVIDER_BASE_URL,
        apiKeyEnv: 'EXTERNAL_LLM_KEY',
        models: [expect.objectContaining({ id: 'fixture-chat-model', contextWindow: 65536 })],
      }),
    }], undefined)
  })
})
