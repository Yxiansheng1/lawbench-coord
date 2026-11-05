// @vitest-environment jsdom
// T34：真实 settings Remote 生命周期、保存投影，以及真实 CoreClient/LegalAgent 消费轮次路由。
// 默认配置只跑 provider 生命周期；Agent 路由必须由 t34-provider.vitest.config.mjs 显式喂入 B 合同。
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  beginExternalProviderSync, beginSettingsStateChange, EXTERNAL_PROVIDER_BASE_URL, externalProviderLifecycle,
  loadSettingsIntoState, projectSavedExternalProvider, retryExternalProviderProjection, SettingsSection, syncExternalProvider,
} from '../ui/settings.tsx'
import { saveDraft, settingsDraft } from '../ui/settings-draft.ts'
import { registerSettingsRemote } from '../ui/index.tsx'
import {
  app, currentLawbenchApi, setApi, setSettingsRemote, type LawbenchApi, type SettingsRemote,
} from '../ui/state.ts'
import { LegalAgent, TASK_END_FAILED } from '../agent/index.ts'
import { CoreClient } from '../shared/core-client.ts'
import type { GenerateOptions, StreamChunk } from '../../dsh/packages/llm/llm/lib/types/index.js'

type CordisPackage = typeof import('../../dsh/vendor/cordis/lib/types/index.js')
type LlmPackage = typeof import('../../dsh/packages/llm/llm/lib/types/index.js')

const DSH = join(__dirname, '..', '..', 'dsh')
const JSONL_PKG = join(DSH, 'packages', 'session', 'session-persistence-jsonl')
const packageRequire = createRequire(join(JSONL_PKG, 'package.json'))
const cordisPackage = packageRequire('@deepseek-ai/cordis') as CordisPackage
const llmPackage = packageRequire('@deepseek-ai/dsh-llm') as LlmPackage
const { Context } = cordisPackage
const { LlmAdapter } = llmPackage
const LlmRuntime = llmPackage.default
type AgentCall = ReturnType<LegalAgent['request']>
type RuntimeCall = Omit<AgentCall, 'reasoningEffort'> &
  Pick<Parameters<InstanceType<typeof LlmRuntime>['prepareCall']>[0], 'reasoningEffort'>
const toRuntimeCall = (request: AgentCall): RuntimeCall => request as RuntimeCall

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SETTINGS = {
  v: 1,
  servers: {
    llm_base_url: 'http://127.0.0.1:18765/v1',
    prep_base_url: 'http://127.0.0.1:18765/prep',
    llm_alt_base_url: null,
    prep_alt_base_url: null,
  },
  defaults: { thinking: '中', window: '64K', max_tokens: 16384 },
  skill_presets: {},
  templates: { 文书: null, 合同: null },
  ocr_fallback_llm: false,
  profile: { lawyer_name: '测试律师' },
  office: { dir: null, invoice_buyer: null },
  converter: 'auto',
  external_llm: {
    enabled: true,
    base_url: 'https://models.example.invalid/v1',
    model: 'fixture-chat-model',
    context_window: 65536,
    supports_tools: true,
  },
} as const

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

class NoReasoningAdapter extends LlmAdapter {
  streamCalls = 0

  override async resolveModel(provider: string, model: string) {
    const info = { provider, id: model, name: model }
    if (provider !== 'lawfirm') return info
    const effort = (id: string) => ({ id: id as NonNullable<GenerateOptions['reasoningEffort']>, name: id })
    return {
      ...info,
      reasoning: { efforts: [effort('low'), effort('medium'), effort('high')] },
    }
  }

  override async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.streamCalls += 1
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

function apiWithSettings(
  getSettings: () => Promise<Record<string, unknown>>,
  putSettings: (value: unknown) => Promise<unknown> = async () => ({ ok: true, value: {} }),
): LawbenchApi {
  return {
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
  } as unknown as LawbenchApi
}

describe('T34 provider 生命周期与保存投影', () => {
  let box: HTMLDivElement
  let root: Root | undefined

  beforeEach(() => {
    box = document.createElement('div')
    document.body.appendChild(box)
    setApi(apiWithSettings(async () => structuredClone(SETTINGS)))
  })

  afterEach(async () => {
    await act(async () => { root?.unmount() })
    root = undefined
    box.remove()
    setApi(undefined)
    setSettingsRemote(undefined)
    settingsDraft.set({ loaded: null, draft: null, savedAt: null })
    externalProviderLifecycle.set({ error: null })
    app.set((state) => ({ ...state, dialogs: [] }))
  })

  it('真实 registerSettingsRemote 启动读回后投影现有 enabled 配置，重连重新投影', async () => {
    const calls: Array<{ ns: string; ops: unknown[] }> = []
    const remote: SettingsRemote = {
      mutate: async (ns, ops) => {
        calls.push({ ns, ops })
        return { ok: true, value: { revision: calls.length } }
      },
    }
    const listeners = new Set<() => void>()
    const offs: Array<() => void> = []
    registerSettingsRemote({
      remote: { settings: remote },
      effect: (fn) => { offs.push(fn() as () => void) },
      on: (_event, listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    })
    await flush()

    expect(calls).toHaveLength(1)
    expect(calls[0].ns).toBe('llm-pi-ai')
    expect(calls[0].ops).toEqual([{
      op: 'set',
      path: ['providers', 'external'],
      value: expect.objectContaining({
        baseURL: EXTERNAL_PROVIDER_BASE_URL,
        apiKeyEnv: 'EXTERNAL_LLM_KEY',
        models: [expect.objectContaining({ id: 'fixture-chat-model', contextWindow: 65536 })],
      }),
    }])
    expect(JSON.stringify(calls[0].ops)).not.toContain('models.example.invalid')

    for (const listener of [...listeners]) listener()
    await flush()
    expect(calls).toHaveLength(2)
    offs.forEach((off) => off())
  })

  it('真实 SettingsSection 保存成功后同步；禁用只 unset providers.external 并保留 lawfirm', async () => {
    const state: { providers: Record<string, unknown> } = {
      providers: {
        lawfirm: { displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' },
        external: { displayName: '旧外部模型' },
      },
    }
    const mutations: Array<{ ns: string; ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }> }> = []
    setSettingsRemote({
      mutate: async (ns, ops) => {
        mutations.push({ ns, ops })
        for (const op of ops) {
          if (op.path[0] !== 'providers') continue
          if (op.op === 'set') state.providers[op.path[1]] = op.value
          else delete state.providers[op.path[1]]
        }
        return { ok: true, value: { revision: mutations.length } }
      },
    })
    const saved: settingsSave[] = []
    setApi(apiWithSettings(
      async () => structuredClone(SETTINGS),
      async (value) => { saved.push(value as settingsSave); return { ok: true, value: {} } },
    ))
    const loaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const draft = { ...structuredClone(loaded), profile: { lawyer_name: '待保存律师' } }
    settingsDraft.set({ loaded, draft, savedAt: null })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    const toggle = box.querySelector('[aria-label="启用外部模型"]') as HTMLInputElement
    await act(async () => { toggle.click() })
    const save = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
    if (!save) throw new Error('没有设置保存按钮')
    await act(async () => { save.click(); await Promise.resolve(); await Promise.resolve() })

    expect(saved.at(-1)?.external_llm?.enabled).toBe(true)
    expect(mutations.at(-1)?.ns).toBe('llm-pi-ai')
    expect(mutations.at(-1)?.ops[0]).toMatchObject({
      op: 'set',
      path: ['providers', 'external'],
      value: expect.objectContaining({ baseURL: EXTERNAL_PROVIDER_BASE_URL }),
    })
    expect(state.providers.lawfirm).toEqual({ displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' })

    await act(async () => {
      settingsDraft.set((draft) => ({
        ...draft,
        draft: draft.draft ? {
          ...draft.draft,
          external_llm: { ...(draft.draft.external_llm as object), enabled: false },
        } : null,
      }))
      await Promise.resolve()
    })
    const saveAgain = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
    if (!saveAgain) throw new Error('没有再次保存按钮')
    await act(async () => { saveAgain.click(); await Promise.resolve(); await Promise.resolve() })
    expect(mutations.at(-1)?.ops).toEqual([{ op: 'unset', path: ['providers', 'external'] }])
    expect(state.providers.external).toBeUndefined()
    expect(state.providers.lawfirm).toEqual({ displayName: '律所模型', baseURL: 'http://127.0.0.1:18765/v1' })
  })

  it('离开设置有未保存修改并选择保存时，也走同一条真实投影且成功后才算同步', async () => {
    const mutations: unknown[][] = []
    setSettingsRemote({
      mutate: async (_ns, ops) => {
        mutations.push(ops)
        return { ok: true, value: { revision: mutations.length } }
      },
    })
    const loaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const draft = { ...structuredClone(loaded), profile: { lawyer_name: '离开时保存' } }
    settingsDraft.set({ loaded, draft, savedAt: null })
    app.set((state) => ({ ...state, dialogs: [] }))
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    await act(async () => { root!.unmount(); await Promise.resolve() })
    root = undefined
    const dialog = app.get().dialogs.at(-1)
    if (dialog?.kind !== 'unsaved') throw new Error('离开设置没有未保存询问')
    await act(async () => {
      dialog.resolve('save')
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(mutations).toHaveLength(1)
    expect(mutations[0]).toEqual([{ op: 'unset', path: ['providers', 'external'] }])
  })

  it('真实离开保存成功后，当前代成功发布并清除旧 provider 错误', async () => {
    const mutations: unknown[][] = []
    setSettingsRemote({
      mutate: async (_ns, ops) => {
        mutations.push(ops)
        return { ok: true, value: { revision: mutations.length } }
      },
    })
    const loaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const draft = { ...structuredClone(loaded), external_llm: { ...SETTINGS.external_llm, enabled: true } }
    settingsDraft.set({ loaded, draft, savedAt: null })
    externalProviderLifecycle.set({ error: '旧的 provider 错误' })
    app.set((state) => ({ ...state, dialogs: [] }))
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    await act(async () => { root!.unmount(); await Promise.resolve() })
    root = undefined
    const dialog = app.get().dialogs.at(-1)
    if (dialog?.kind !== 'unsaved') throw new Error('离开设置没有未保存询问')
    await act(async () => {
      dialog.resolve('save')
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(mutations).toHaveLength(1)
    expect(externalProviderLifecycle.get().error).toBeNull()
  })

  it('Remote 缺失、失败和返回无 value 都固定中文失败，不伪装成功', async () => {
    const enabled = SETTINGS.external_llm
    setSettingsRemote(undefined)
    expect(await syncExternalProvider(enabled)).toBe('DSH 设置服务还没接上，外部模型路由没有同步')

    setSettingsRemote({ mutate: async () => ({ ok: false, error: { message: 'offline' } }) })
    expect(await syncExternalProvider(enabled)).toBe('DSH 没有接受外部模型路由，请重试（错误码：unknown）')

    setSettingsRemote({ mutate: async () => ({ ok: true } as never) })
    expect(await syncExternalProvider(enabled)).toBe('DSH 没有接受外部模型路由，请重试（错误码：unknown）')
  })

  it('受控 Promise：旧 load 晚回被跳过；旧保存晚回后队列仍以最新选择收尾', async () => {
    const mutations: string[] = []
    const firstMutation = deferred<{ ok: true; value: unknown }>()
    const enteredOldSave = deferred<void>()
    let call = 0
    setSettingsRemote({
      mutate: async (_ns, ops) => {
        const model = (ops[0]?.value as { models?: Array<{ id: string }> } | undefined)?.models?.[0]?.id ?? 'disabled'
        mutations.push(model)
        call += 1
        if (call === 1) {
          enteredOldSave.resolve(undefined)
          return firstMutation.promise
        }
        return { ok: true, value: { revision: call } }
      },
    })

    const oldLoad = deferred<Record<string, unknown>>()
    setApi(apiWithSettings(() => oldLoad.promise))
    const loadRevision = beginExternalProviderSync()
    const loading = projectSavedExternalProvider(loadRevision)
    const oldRevision = beginExternalProviderSync()
    const oldSave = syncExternalProvider({ ...SETTINGS.external_llm, model: 'old-model' }, oldRevision)
    await act(async () => { await enteredOldSave.promise })
    expect(mutations).toEqual(['old-model'])

    const newRevision = beginExternalProviderSync()
    const newSave = syncExternalProvider({ ...SETTINGS.external_llm, model: 'new-model' }, newRevision)
    expect(mutations).toEqual(['old-model'])

    await act(async () => {
      oldLoad.resolve(structuredClone(SETTINGS))
      expect(await loading).toBeNull()
    })
    firstMutation.resolve({ ok: true, value: { revision: 1 } })
    await act(async () => { expect(await Promise.all([oldSave, newSave])).toEqual([null, null]) })
    expect(mutations).toEqual(['old-model', 'new-model'])
  })

  it('真实 register 投影失败显示固定不可用状态，重试成功后清除', async () => {
    let attempt = 0
    const remote: SettingsRemote = {
      mutate: async () => {
        attempt += 1
        return attempt === 1
          ? { ok: false, error: { message: 'C:\\secret\\provider.json' } }
          : { ok: true, value: { revision: attempt } }
      },
    }
    const offs: Array<() => void> = []
    registerSettingsRemote({
      remote: { settings: remote },
      effect: (fn) => { offs.push(fn() as () => void) },
      on: () => () => undefined,
    })
    settingsDraft.set({ loaded: structuredClone(SETTINGS), draft: structuredClone(SETTINGS), savedAt: null })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve(); await Promise.resolve() })

    const alert = box.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('外部模型当前不可用：DSH 没有接受外部模型路由，请重试')
    expect(alert?.textContent).not.toContain('secret')
    const retry = [...box.querySelectorAll('button')].find((button) => button.textContent === '重试同步')
    if (!retry) throw new Error('没有重试同步按钮')
    await act(async () => { retry.click(); await Promise.resolve(); await Promise.resolve() })
    expect(externalProviderLifecycle.get().error).toBeNull()
    expect(box.querySelector('[role="alert"]')).toBeNull()
    offs.forEach((off) => off())
  })

  it('旧 load 晚回不覆盖新 app 默认、预设、姓名，也不投影 provider', async () => {
    const started = deferred<void>()
    const oldLoad = deferred<Record<string, unknown>>()
    setApi(apiWithSettings(() => { started.resolve(undefined); return oldLoad.promise }))
    const mutations: unknown[][] = []
    setSettingsRemote({ mutate: async (_ns, ops) => { mutations.push(ops); return { ok: true, value: {} } } })
    const offs: Array<() => void> = []
    registerSettingsRemote({
      remote: { settings: { mutate: async (_ns, ops) => { mutations.push(ops); return { ok: true, value: {} } } } },
      effect: (fn) => { offs.push(fn() as () => void) },
      on: () => () => undefined,
    })
    await act(async () => { await started.promise })

    const fresh = {
      ...structuredClone(SETTINGS),
      defaults: { thinking: '高', window: '128K', max_tokens: 24576 },
      skill_presets: { 'case-summary': { thinking: '低', window: '32K', max_tokens: 4096 } },
      profile: { lawyer_name: '新律师' },
    }
    beginSettingsStateChange()
    settingsDraft.set({ loaded: structuredClone(SETTINGS), draft: structuredClone(fresh), savedAt: null })
    expect(await saveDraft()).toBeNull()
    const beforeLate = app.get()
    expect(beforeLate.defaults).toEqual(fresh.defaults)
    expect(beforeLate.presets).toEqual(fresh.skill_presets)
    expect(beforeLate.lawyerName).toBe('新律师')

    await act(async () => { oldLoad.resolve(structuredClone(SETTINGS)); await Promise.resolve(); await Promise.resolve() })
    expect(app.get().defaults).toEqual(beforeLate.defaults)
    expect(app.get().presets).toEqual(beforeLate.presets)
    expect(app.get().lawyerName).toBe('新律师')
    expect(mutations).toEqual([])
    offs.forEach((off) => off())
  })

  it('同一 Remote 仅实际设置 API 换代：new GET 先回、old GET 最后，旧结果不覆盖 app', async () => {
    const remote: SettingsRemote = { mutate: async () => ({ ok: true, value: {} }) }
    setSettingsRemote(remote)
    const oldRead = deferred<Record<string, unknown>>()
    const newRead = deferred<Record<string, unknown>>()
    const oldEntered = deferred<void>()
    const newEntered = deferred<void>()
    const apiA = apiWithSettings(() => { oldEntered.resolve(undefined); return oldRead.promise })
    const apiB = apiWithSettings(() => { newEntered.resolve(undefined); return newRead.promise })
    const fresh = {
      ...structuredClone(SETTINGS),
      defaults: { thinking: '高', window: '128K', max_tokens: 24576 },
      skill_presets: { 'case-summary': { thinking: '低', window: '32K', max_tokens: 4096 } },
      profile: { lawyer_name: '同一 Remote 新 API' },
    }

    setApi(apiA)
    beginSettingsStateChange()
    const oldLoading = loadSettingsIntoState()
    await act(async () => { await oldEntered.promise })
    setApi(apiB)
    const newLoading = loadSettingsIntoState()
    await act(async () => { await newEntered.promise })
    newRead.resolve(structuredClone(fresh))
    await act(async () => { expect(await newLoading).toEqual(fresh) })
    expect(app.get().lawyerName).toBe('同一 Remote 新 API')

    oldRead.resolve(structuredClone(SETTINGS))
    await act(async () => { expect(await oldLoading).toBeNull() })
    expect(app.get().defaults).toEqual(fresh.defaults)
    expect(app.get().presets).toEqual(fresh.skill_presets)
    expect(app.get().lawyerName).toBe('同一 Remote 新 API')
  })

  it('普通 Save 的 old PUT 在途时换 API 或 Remote，成功或失败最后回都不投影且无第二 PUT', async () => {
    const fresh = { ...structuredClone(SETTINGS), profile: { lawyer_name: '普通保存后的新读' } }
    for (const changed of ['实际设置 API', 'Remote'] as const) {
      const remoteA: SettingsRemote = { mutate: async () => ({ ok: true, value: {} }) }
      const remoteB: SettingsRemote = { mutate: async () => ({ ok: true, value: {} }) }
      const oldPut = deferred<unknown>()
      const putEntered = deferred<void>()
      const freshRead = deferred<Record<string, unknown>>()
      const freshReadEntered = deferred<void>()
      let putCalls = 0
      const readFresh = () => { freshReadEntered.resolve(undefined); return freshRead.promise }
      const apiA = apiWithSettings(
        readFresh,
        () => { putCalls += 1; putEntered.resolve(undefined); return oldPut.promise },
      )
      const apiB = apiWithSettings(readFresh)
      setApi(apiA)
      setSettingsRemote(remoteA)
      const oldLoaded = { ...structuredClone(SETTINGS), profile: { lawyer_name: '普通旧已载入' } }
      settingsDraft.set({
        loaded: oldLoaded,
        draft: { ...structuredClone(oldLoaded), profile: { lawyer_name: '普通旧保存' } },
        savedAt: null,
      })
      externalProviderLifecycle.set({ error: '当前 provider 错误' })
      box.replaceChildren()
      root = createRoot(box)
      await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
      const save = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
      if (!save) throw new Error(`${changed} 场景没有普通保存按钮`)
      await act(async () => { save.click() })
      await act(async () => { await putEntered.promise })
      expect(putCalls).toBe(1)

      if (changed === '实际设置 API') setApi(apiB)
      else setSettingsRemote(remoteB)
      if (changed === 'Remote') expect(currentLawbenchApi()).toBe(apiA)
      beginSettingsStateChange()
      const freshLoading = loadSettingsIntoState()
      await act(async () => { await freshReadEntered.promise })
      await act(async () => {
        freshRead.resolve(structuredClone(fresh))
        expect(await freshLoading).toEqual(fresh)
        settingsDraft.set({ loaded: structuredClone(fresh), draft: structuredClone(fresh), savedAt: null })
      })
      expect(app.get().lawyerName).toBe('普通保存后的新读')

      await act(async () => {
        if (changed === '实际设置 API') oldPut.reject(new Error('old put failed'))
        else oldPut.resolve({ ok: true, value: {} })
        await Promise.resolve()
      })
      await flush()
      expect(putCalls).toBe(1)
      expect(settingsDraft.get().loaded?.profile).toEqual({ lawyer_name: '普通保存后的新读' })
      expect(app.get().lawyerName).toBe('普通保存后的新读')
      expect(externalProviderLifecycle.get().error).toBe('当前 provider 错误')
      await act(async () => { root!.unmount() })
      root = undefined
      setSettingsRemote(undefined)
      settingsDraft.set({ loaded: null, draft: null, savedAt: null })
    }
  })

  it('实际 SettingsSection：provider 保存失败后重试成功清掉唯一 alert，secret 不入错误，普通 PUT 错误仍可见', async () => {
    let providerCalls = 0
    setSettingsRemote({
      mutate: async () => {
        providerCalls += 1
        if (providerCalls === 1) throw new Error('C:\\secret\\provider.json')
        return { ok: true, value: { revision: providerCalls } }
      },
    })
    let putCalls = 0
    setApi(apiWithSettings(
      async () => structuredClone(SETTINGS),
      async () => {
        putCalls += 1
        return { ok: true, value: {} }
      },
    ))
    const loaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const draft = { ...structuredClone(loaded), profile: { lawyer_name: 'provider 重试' } }
    settingsDraft.set({ loaded, draft, savedAt: null })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    const save = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
    if (!save) throw new Error('没有普通保存按钮')
    await act(async () => { save.click(); await Promise.resolve(); await Promise.resolve() })
    expect(putCalls).toBe(1)
    expect(box.querySelector('[role="alert"]')?.textContent).toContain('外部模型当前不可用')
    expect(box.textContent).not.toContain('secret')

    const retry = [...box.querySelectorAll('button')].find((button) => button.textContent === '重试同步')
    if (!retry) throw new Error('没有重试同步按钮')
    await act(async () => { retry.click(); await Promise.resolve(); await Promise.resolve() })
    expect(box.querySelector('[role="alert"]')).toBeNull()
    expect(externalProviderLifecycle.get().error).toBeNull()

    await act(async () => {
      setApi(apiWithSettings(
        async () => structuredClone(SETTINGS),
        async () => { putCalls += 1; throw new Error('普通设置保存失败') },
      ))
      settingsDraft.set({
        loaded: structuredClone(SETTINGS),
        draft: { ...structuredClone(SETTINGS), profile: { lawyer_name: '普通错误' } },
        savedAt: null,
      })
    })
    const saveAgain = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
    if (!saveAgain) throw new Error('没有再次普通保存按钮')
    await act(async () => { saveAgain.click(); await Promise.resolve(); await Promise.resolve() })
    expect(putCalls).toBe(2)
    expect(box.textContent).toContain('普通设置保存失败')
    expect(box.querySelectorAll('[role="alert"]')).toHaveLength(1)
    expect(box.querySelector('[role="alert"]')?.textContent).toContain('普通设置保存失败')
    expect(box.textContent).not.toContain('secret')
  })

  it('真实离开保存 PUT 在途：新保存与新 Remote 错误完成后，旧 PUT 最后回不投影旧值也不清新错', async () => {
    const oldPut = deferred<unknown>()
    const newPut = deferred<unknown>()
    let putCall = 0
    setApi(apiWithSettings(
      async () => structuredClone(SETTINGS),
      () => {
        putCall += 1
        return putCall === 1 ? oldPut.promise : newPut.promise
      },
    ))

    const oldLoaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const oldDraft = { ...structuredClone(oldLoaded), profile: { lawyer_name: '离开旧保存' } }
    settingsDraft.set({ loaded: oldLoaded, draft: oldDraft, savedAt: null })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    await act(async () => { root!.unmount(); await Promise.resolve() })
    root = undefined
    const leaveDialog = app.get().dialogs.at(-1)
    if (leaveDialog?.kind !== 'unsaved') throw new Error('离开设置没有未保存询问')
    await act(async () => { leaveDialog.resolve('save'); await Promise.resolve() })
    expect(putCall).toBe(1)

    box.replaceChildren()
    const newDraft = { ...structuredClone(SETTINGS), profile: { lawyer_name: '新保存律师' } }
    settingsDraft.set({ loaded: oldLoaded, draft: newDraft, savedAt: null })
    const newMutations: string[] = []
    setSettingsRemote({
      mutate: async (_ns, ops) => {
        const ext = (ops[0]?.value as { models?: Array<{ id: string }> } | undefined)?.models?.[0]?.id ?? 'disabled'
        newMutations.push(ext)
        return { ok: true, value: {} }
      },
    })
    root = createRoot(box)
    await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
    const save = [...box.querySelectorAll('button')].find((button) => button.textContent === '保存')
    if (!save) throw new Error('没有设置保存按钮')
    await act(async () => { save.click(); await Promise.resolve() })
    expect(putCall).toBe(2)
    newPut.resolve({ ok: true, value: {} })
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(newMutations).toEqual(['fixture-chat-model'])

    const offs: Array<() => void> = []
    registerSettingsRemote({
      remote: {
        settings: {
          mutate: async () => ({ ok: false, error: { message: 'offline' } }),
        },
      },
      effect: (fn) => { offs.push(fn() as () => void) },
      on: () => () => undefined,
    })
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(externalProviderLifecycle.get().error).toBe('DSH 没有接受外部模型路由，请重试（错误码：unknown）')

    oldPut.resolve({ ok: true, value: {} })
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })
    expect(settingsDraft.get().loaded?.profile).toEqual({ lawyer_name: '新保存律师' })
    expect(app.get().lawyerName).not.toBe('离开旧保存')
    expect(newMutations).toEqual(['fixture-chat-model'])
    expect(externalProviderLifecycle.get().error).toBe('DSH 没有接受外部模型路由，请重试（错误码：unknown）')
    offs.forEach((off) => off())
  })

  it('真实离开保存 PUT 在途时，仅换 Remote 或实际设置 API 并新读回，旧 PUT 最后回也不覆盖', async () => {
    const remoteA: SettingsRemote = { mutate: async () => ({ ok: true, value: {} }) }
    const remoteB: SettingsRemote = { mutate: async () => ({ ok: true, value: {} }) }
    const oldLoaded = { ...structuredClone(SETTINGS), external_llm: { ...SETTINGS.external_llm, enabled: false } }
    const oldDraft = { ...structuredClone(oldLoaded), profile: { lawyer_name: '离开旧保存' } }
    const fresh = { ...structuredClone(SETTINGS), profile: { lawyer_name: '仅新读回律师' } }

    for (const changed of ['Remote', '实际设置 API'] as const) {
      const oldPut = deferred<unknown>()
      const newRead = deferred<Record<string, unknown>>()
      const readStarted = deferred<void>()
      let putCall = 0
      const read = () => { readStarted.resolve(undefined); return newRead.promise }
      const apiA = apiWithSettings(
        read,
        () => { putCall += 1; return oldPut.promise },
      )
      const apiB = apiWithSettings(
        read,
        async () => { putCall += 1; return { ok: true, value: {} } },
      )
      setApi(apiA)
      setSettingsRemote(remoteA)
      settingsDraft.set({ loaded: oldLoaded, draft: oldDraft, savedAt: null })
      app.set((state) => ({ ...state, dialogs: [] }))

      root = createRoot(box)
      await act(async () => { root!.render(createElement(SettingsSection)); await Promise.resolve() })
      await act(async () => { root!.unmount(); await Promise.resolve() })
      root = undefined
      const dialog = app.get().dialogs.at(-1)
      if (dialog?.kind !== 'unsaved') throw new Error(`${changed} 场景离开设置没有未保存询问`)
      await act(async () => { dialog.resolve('save'); await Promise.resolve() })
      expect(putCall).toBe(1)

      if (changed === 'Remote') setSettingsRemote(remoteB)
      else setApi(apiB)
      settingsDraft.set({ loaded: oldLoaded, draft: structuredClone(oldLoaded), savedAt: null })
      box.replaceChildren()
      root = createRoot(box)
      await act(async () => { root!.render(createElement(SettingsSection)) })
      await readStarted.promise
      await act(async () => {
        newRead.resolve(structuredClone(fresh))
        await newRead.promise
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(putCall).toBe(1)
      expect(settingsDraft.get().loaded?.profile).toEqual({ lawyer_name: '仅新读回律师' })
      expect(app.get().lawyerName).toBe('仅新读回律师')

      oldPut.resolve({ ok: true, value: {} })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(settingsDraft.get().loaded?.profile).toEqual({ lawyer_name: '仅新读回律师' })
      expect(app.get().lawyerName).toBe('仅新读回律师')
      await act(async () => { root!.unmount() })
      root = undefined
      setSettingsRemote(undefined)
    }
  })
})

type settingsSave = { external_llm?: { enabled?: boolean } }

describe.skipIf(process.env.LAWBENCH_T34_CONTRACTS_DIR === undefined)(
  'T34 真 CoreClient 与 Agent 消费者（B 合同）',
  () => {
    const logs: Array<[string, string, Record<string, unknown> | undefined]> = []
    const log = (level: string, event: string, meta?: Record<string, unknown>) => { logs.push([level, event, meta]) }
    const originalFetch = globalThis.fetch
    let requests: Array<{ command: string; body: Record<string, unknown>; url: string }>

    beforeEach(() => {
      requests = []
      logs.length = 0
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input)
        if (!url.startsWith('http://127.0.0.1:17650/core/')) throw new Error(`意外网络目标：${url}`)
        const command = url.slice('http://127.0.0.1:17650/core/'.length)
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
        requests.push({ command, body, url })
        if (command === 'task/begin') {
          const sid = String(body.session_id)
          const external = sid.startsWith('S-external')
          const off = sid.includes('off')
          const endFail = sid.includes('end-fail')
          const badRoute = sid === 'S-route-invalid'
          return new Response(JSON.stringify({
            ok: true,
            value: {
              task_id: endFail ? 'T-20261023030000-a003' : external ? 'T-20261023030000-a001' : 'T-20261023030000-b002',
              case_id: '3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90',
              skill: null,
              params: { thinking: off ? '关闭' : '高', window: '64K', max_tokens: 8192, temperature: 0.2 },
              budget: { model_calls: 5, tool_calls: 12, minutes: 30 },
              ...(badRoute ? { route: 'invalid' } : external ? { route: 'external' } : {}),
            },
          }), { status: 200, headers: { 'content-type': 'application/json' } })
        }
        if (command === 'task/end') {
          if (body.task_id === 'T-20261023030000-a003') {
            return new Response(JSON.stringify({ ok: false, error: { code: 'OFFLINE', message: 'offline' } }), {
              status: 200, headers: { 'content-type': 'application/json' },
            })
          }
          return new Response(JSON.stringify({ ok: true, value: { status: 'failed' } }), {
            status: 200, headers: { 'content-type': 'application/json' },
          })
        }
        if (command === 'context') {
          return new Response(JSON.stringify({
            ok: true,
            value: {
              l0: { text: '虚构案件卡片', chars: 8 },
              l1: { text: '虚构输入', tokens: 4, truncated: false, toc: [] },
            },
          }), { status: 200, headers: { 'content-type': 'application/json' } })
        }
        throw new Error(`本测试不处理命令：${command}`)
      }) as typeof fetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('旧无 route 为 local；external 用 begin 快照；begin 一次且请求预算参数固定', async () => {
      let ext = {
        enabled: true, model: 'fixture-external', contextWindow: 65536, keyConfigured: true, supportsTools: true,
      }
      const core = new CoreClient(() => ({ port: 17650, token: 'fixture-token' }), log)
      const agent = new LegalAgent(core, log, () => {}, () => {}, () => false, () => false, async () => ext)

      const local = await agent.preStep(
        { id: 'S-local', session: { header: { cwd: 'D:\\虚构案件\\本地' } } },
        1,
        { kind: 'enter', messages: [] },
      )
      expect(local.kind).toBe('enter')
      const callLocal = agent.request('S-local', { provider: 'ui-next', model: 'ui-next-model', reasoningEffort: 'low' })
      expect(callLocal).toMatchObject({
        provider: 'lawfirm', model: 'qwen38-27b', reasoningEffort: 'high', maxTokens: 8192, temperature: 0.2,
      })

      const external = await agent.preStep(
        { id: 'S-external', session: { header: { cwd: 'D:\\虚构案件\\外部' } } },
        1,
        { kind: 'enter', messages: [] },
      )
      expect(external.kind).toBe('enter')
      const task = agent.tasks.get('S-external')!
      expect(task.budget).toEqual({ model_calls: 5, tool_calls: 12, minutes: 30 })
      expect(task.params).toEqual({ thinking: '高', window: '64K', max_tokens: 8192, temperature: 0.2 })
      expect(task.route).toBe('external')
      expect(task.external).toEqual({ model: 'fixture-external', contextWindow: 65536 })

      ext = { ...ext, model: 'later-ui-model', contextWindow: 32768 }
      await agent.preStep(
        { id: 'S-external', session: { header: { cwd: 'D:\\虚构案件\\外部' } } },
        2,
        { kind: 'enter', messages: [] },
      )
      const callHigh = agent.request('S-external', {
        provider: 'ui-next', model: 'ui-next-model', reasoningEffort: 'low', maxTokens: 1,
      })
      expect(callHigh).toMatchObject({
        provider: 'external', model: 'fixture-external', maxTokens: 8192, temperature: 0.2,
      })
      expect(callHigh).not.toHaveProperty('reasoningEffort')

      const externalOff = await agent.preStep(
        { id: 'S-external-off', session: { header: { cwd: 'D:\\虚构案件\\外部关闭' } } },
        1,
        { kind: 'enter', messages: [] },
      )
      expect(externalOff.kind).toBe('enter')
      const callOff = agent.request('S-external-off', { provider: 'ui-next', model: 'ui-next-model', reasoningEffort: 'high' })
      expect(callOff).not.toHaveProperty('reasoningEffort')

      // 真实 LlmRuntime 消费边界：模型信息没有 reasoning，调用方可继承的 reasoningEffort 已从对象移除。
      const ctx = new Context()
      const runtimeFiber = await ctx.plugin(LlmRuntime)
      try {
        const adapter = new NoReasoningAdapter()
        ctx.llm.registerAdapter(['lawfirm', 'external'], adapter)
        const modelInfo = await ctx.llm.resolveModelInfo('external', 'fixture-external')
        expect(modelInfo).not.toHaveProperty('reasoning')

        const preparedLocal = await ctx.llm.prepareCall(toRuntimeCall(callLocal))
        expect(preparedLocal.config).toMatchObject({
          provider: 'lawfirm', model: 'qwen38-27b', reasoningEffort: 'high', maxTokens: 8192, temperature: 0.2,
        })

        const preparedHigh = await ctx.llm.prepareCall(toRuntimeCall(callHigh))
        expect(preparedHigh.config).not.toHaveProperty('reasoningEffort')
        expect(preparedHigh.config).toMatchObject({
          provider: 'external', model: 'fixture-external', maxTokens: 8192, temperature: 0.2,
        })

        const preparedOff = await ctx.llm.prepareCall(toRuntimeCall(callOff))
        expect(preparedOff.config).not.toHaveProperty('reasoningEffort')
        expect(preparedOff.config).toMatchObject({
          provider: 'external', model: 'later-ui-model', maxTokens: 8192, temperature: 0.2,
        })
        expect(adapter.streamCalls).toBe(0)
      } finally {
        await runtimeFiber.dispose()
      }

      const begins = requests.filter((request) => request.command === 'task/begin')
      expect(begins).toHaveLength(3)
      expect(begins[0].body).toEqual({ session_id: 'S-local', cwd: 'D:\\虚构案件\\本地' })
      expect(begins[1].body).toEqual({ session_id: 'S-external', cwd: 'D:\\虚构案件\\外部' })
      expect(requests.filter((request) => request.command === 'context')).toHaveLength(3)
    })

    it('external 未启用、无 Key 或模型窗口无效时 begin/blocked-end 配对，不取 context、不静默本地', async () => {
      const variants = [
        { enabled: false, model: 'fixture-external', contextWindow: 65536, keyConfigured: true, supportsTools: true },
        { enabled: true, model: 'fixture-external', contextWindow: 65536, keyConfigured: false, supportsTools: true },
        { enabled: true, model: null, contextWindow: 65536, keyConfigured: true, supportsTools: true },
        { enabled: true, model: 'fixture-external', contextWindow: 1024, keyConfigured: true, supportsTools: true },
      ]
      for (const [index, externalLlmState] of variants.entries()) {
        const blocked: Array<[string, string]> = []
        const core = new CoreClient(() => ({ port: 17650, token: 'fixture-token' }), log)
        const agent = new LegalAgent(
          core, log, (sessionId, code) => { blocked.push([sessionId, code]) }, () => {}, () => false, () => false,
          async () => externalLlmState,
        )
        const id = `S-external-unavailable-${index}`
        const requestStart = requests.length
        const result = await agent.preStep(
          { id, session: { header: { cwd: 'D:\\虚构案件\\不可用' } } },
          1,
          { kind: 'enter', messages: [] },
        )
        expect(result).toEqual({ kind: 'reject' })
        expect(agent.tasks.has(id)).toBe(false)
        expect(blocked).toEqual([[id, 'EXTERNAL_ROUTE_UNAVAILABLE']])
        const round = requests.slice(requestStart)
        const began = round.filter((request) => request.command === 'task/begin')
        const ended = round.filter((request) => request.command === 'task/end')
        expect(began).toHaveLength(1)
        expect(ended).toHaveLength(1)
        expect(ended[0].body).toMatchObject({
          task_id: 'T-20261023030000-a001', reason: 'blocked', model_calls: 0, tool_calls: 0,
        })
        expect(agent.request(id, { provider: 'lawfirm', model: 'qwen38-27b' })).toEqual({
          provider: 'lawfirm', model: 'qwen38-27b',
        })
      }
      expect(requests.filter((request) => request.command === 'context')).toHaveLength(0)
      expect(requests.filter((request) => request.command === 'tool' || request.command === 'progress')).toHaveLength(0)
    })

    it('非法 route 响应由真实合同校验拒绝', async () => {
      const blocked: Array<[string, string]> = []
      // 返回值故意违反 B 合同：真实 CoreClient 必须先以 INTERNAL 拒收。
      // Agent 对已合法 begin 任务的非法 route 防御分支仅由产品源码静态覆盖，本入口不冒称执行。
      const core = new CoreClient(() => ({ port: 17650, token: 'fixture-token' }), log)
      const agent = new LegalAgent(
        core, log, (sessionId, code) => { blocked.push([sessionId, code]) }, () => {}, () => false, () => false,
      )
      const result = await agent.preStep(
        { id: 'S-route-invalid', session: { header: { cwd: 'D:\\虚构案件\\未知路由' } } },
        1,
        { kind: 'enter', messages: [] },
      )
      expect(result).toEqual({ kind: 'reject' })
      expect(blocked).toEqual([['S-route-invalid', 'INTERNAL']])
      expect(logs).toContainEqual([
        'error',
        'core.response_contract',
        expect.objectContaining({ command: 'task/begin' }),
      ])
      const began = requests.filter((request) => request.command === 'task/begin')
      const ended = requests.filter((request) => request.command === 'task/end')
      expect(began).toHaveLength(1)
      expect(ended).toHaveLength(0)
      expect(requests.some((request) => ['context', 'tool', 'progress'].includes(request.command))).toBe(false)
    })

    it('blocked 收尾两次失败时保留 TASK_END_FAILED，随后不再用外部不可用提示覆盖', async () => {
      const blocked: Array<[string, string]> = []
      const core = new CoreClient(() => ({ port: 17650, token: 'fixture-token' }), log)
      const agent = new LegalAgent(
        core, log, (sessionId, code) => { blocked.push([sessionId, code]) }, () => {}, () => false, () => false,
        async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }),
      )
      const result = await agent.preStep(
        { id: 'S-external-end-fail', session: { header: { cwd: 'D:\\虚构案件\\收尾失败' } } },
        1,
        { kind: 'enter', messages: [] },
      )
      expect(result).toEqual({ kind: 'reject' })
      expect(agent.tasks.has('S-external-end-fail')).toBe(false)
      expect(blocked).toEqual([['S-external-end-fail', TASK_END_FAILED]])
      const ended = requests.filter((request) => request.command === 'task/end')
      expect(ended).toHaveLength(2)
      expect(ended.map((request) => request.body)).toEqual([
        expect.objectContaining({ task_id: 'T-20261023030000-a003', reason: 'blocked', model_calls: 0, tool_calls: 0 }),
        expect.objectContaining({ task_id: 'T-20261023030000-a003', reason: 'blocked', model_calls: 0, tool_calls: 0 }),
      ])
      expect(requests.some((request) => ['context', 'tool', 'progress'].includes(request.command))).toBe(false)
    })
  },
)
