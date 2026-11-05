// 设置页"律师工作台"一节（PRD 7.9；settings.json 契约 files/settings.schema.json）：
// 服务器和 Key（T13 执行令 Q7：地址只读；Key 可更换，T14 第二次实跑派修 3）、个人参数预设、Word 模板、本机律师姓名、日常办公文件夹、
// 发票购买方名称、Word 转 PDF 的程序、关于。保存时服务器地址原样带回，不在这里改。
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button, C, ErrorLine, getNav, S } from './kit.tsx'
import { lawyerMessage } from './format.ts'
import { BrandMark, VendorLine } from './brand.tsx'
import { CapsuleSettings } from './home.tsx'
import { FIRM_NAME, PRODUCT_NAME, versionLabel } from '../shared/product.ts'
import {
  app, call, currentCredentialsApi, currentLawbenchApi, currentSettingsRemote, lb, MODE_AGENT, notice, subscribeCredentialsApi,
  type ConnectionResult, type CredentialsApi, type LawbenchApi, type Params, type SkillInfo,
} from './state.ts'
import { createStore, useStore } from './store.ts'
import {
  discardDraft, isDirty, onLeaveSettings, saveDraftResult, settingsDraft, type ExternalLLM,
} from './settings-draft.ts'
import { isMac, keyStoreName } from './platform.ts'
import { RemoteAccessSection } from './remote-access.tsx'
import { SearchKeyControl } from './web-search.tsx'

interface Settings {
  v: 1
  servers: { llm_base_url: string; prep_base_url: string; llm_alt_base_url: string | null; prep_alt_base_url: string | null }
  defaults: Params
  skill_presets: Record<string, Params>
  templates: { 文书: string | null; 合同: string | null }
  ocr_fallback_llm: boolean
  profile: { lawyer_name: string | null }
  office: { dir: string | null; invoice_buyer: string | null }
  converter: 'auto' | 'word' | 'wps' | 'libreoffice'
  /** T34：服务缺字段时仍是旧设置的合法形态；界面只在内存显示关闭态。 */
  external_llm?: ExternalLLM | null
}

export type { ExternalLLM } from './settings-draft.ts'

export const CLOSED_EXTERNAL_LLM: ExternalLLM = { enabled: false, base_url: null, model: null, context_window: null, supports_tools: true }
export const EXTERNAL_LLM_KEY = 'EXTERNAL_LLM_KEY'
export const EXTERNAL_PROVIDER_NS = 'llm-pi-ai'
export const EXTERNAL_PROVIDER_BASE_URL = 'http://127.0.0.1:18765/v1-ext'
const EXTERNAL_PROVIDER_REJECTED = 'DSH 没有接受外部模型路由，请重试'
const SAFE_EXTERNAL_PROVIDER_CODES = new Set([
  'settings/rejected',
  'settings/conflict',
  'gateway/bad-request',
  'gateway/input-invalid',
  'gateway/internal',
  'gateway/service-unavailable',
])
const EXTERNAL_PROVIDER_FIXED_REASONS: ReadonlyArray<readonly [string, string]> = [
  ['settings service is absent', '设置服务缺失'],
  ['No configurable plugin entry', '插件或设置项不可配置'],
  ['has no volatile fields', '插件没有可配置字段'],
  ['is not volatile', '设置字段不允许在运行中修改'],
  ['is no longer configurable', '设置项已失效'],
  ['is overridden by a home patch or command-line overlay', '配置被 home patch 或命令行覆盖'],
]

function externalProviderStringField(value: unknown, key: 'code' | 'message'): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const field = Reflect.get(value, key)
  return typeof field === 'string' ? field : undefined
}

/** 只投影白名单 code 和源码固定短语对应的人话；原始错误内容永不进入界面或日志。 */
function externalProviderFailure(error: unknown): string {
  const sourceCode = externalProviderStringField(error, 'code')
  const safeCode = sourceCode !== undefined && sourceCode.length <= 64 && SAFE_EXTERNAL_PROVIDER_CODES.has(sourceCode)
    ? sourceCode
    : 'unknown'
  let reason = safeCode === 'settings/conflict' ? '设置版本冲突，请重试' : undefined
  if (safeCode !== 'unknown') {
    const sourceMessage = externalProviderStringField(error, 'message')
    if (!reason && sourceMessage !== undefined) {
      reason = EXTERNAL_PROVIDER_FIXED_REASONS.find(([phrase]) => sourceMessage.includes(phrase))?.[1]
    }
  }
  return `${EXTERNAL_PROVIDER_REJECTED}（错误码：${safeCode}${reason ? `；${reason}` : ''}）`
}

function isExternalProviderPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** 只判定实时配置能否证明 external 已不存在；不复制、输出或记录任何 provider 值。 */
function confirmedExternalProviderAbsent(result: unknown): boolean {
  if (!isExternalProviderPlainObject(result) || result.ok !== true ||
    !Object.prototype.hasOwnProperty.call(result, 'value')) return false
  const payload = result.value
  if (!isExternalProviderPlainObject(payload) || !Array.isArray(payload.namespaces)) return false
  const matches = payload.namespaces.filter((candidate) =>
    isExternalProviderPlainObject(candidate) && candidate.ns === EXTERNAL_PROVIDER_NS)
  if (matches.length !== 1) return false
  const descriptor = matches[0]
  if (!isExternalProviderPlainObject(descriptor) || descriptor.applies !== 'live' ||
    !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return false
  const config = descriptor.value
  if (!isExternalProviderPlainObject(config) || !Object.prototype.hasOwnProperty.call(config, 'providers')) return false
  const providers = config.providers
  return isExternalProviderPlainObject(providers) && !Object.prototype.hasOwnProperty.call(providers, 'external')
}

let externalProviderRevision = 0
let externalProviderQueue: Promise<void> = Promise.resolve()
let settingsStateRevision = 0

export interface ExternalProviderLifecycle {
  error: string | null
}

export const externalProviderLifecycle = createStore<ExternalProviderLifecycle>({ error: null })

export interface SettingsStateToken {
  revision: number
  remote: ReturnType<typeof currentSettingsRemote>
  api: LawbenchApi | undefined
}

interface ExternalProviderTarget {
  revision: number
  remote: ReturnType<typeof currentSettingsRemote>
  api: LawbenchApi | undefined
}

/** 每次启动读取、保存或离开保存都领取一个新代次；旧代次的结果不得覆盖新选择。 */
export function beginExternalProviderSync(): number {
  externalProviderRevision += 1
  return externalProviderRevision
}

function captureExternalProviderTarget(revision: number): ExternalProviderTarget {
  return { revision, remote: currentSettingsRemote(), api: currentLawbenchApi() }
}

/** 队列执行、mutate 返回和结果发布共用同一资格门；任一真实身份换代都使旧结果失效。 */
function isCurrentExternalProviderTarget(target: ExternalProviderTarget): boolean {
  return target.revision === externalProviderRevision &&
    target.remote === currentSettingsRemote() &&
    target.api === currentLawbenchApi()
}

/** 保存开始或 Remote 身份变化后，早先发出的设置读取不得再写界面状态。 */
export function beginSettingsStateChange(): number {
  settingsStateRevision += 1
  return settingsStateRevision
}

export function currentSettingsStateToken(): SettingsStateToken {
  return { revision: settingsStateRevision, remote: currentSettingsRemote(), api: currentLawbenchApi() }
}

export function isCurrentSettingsStateToken(token: SettingsStateToken): boolean {
  return token.revision === settingsStateRevision && token.remote === currentSettingsRemote() && token.api === currentLawbenchApi()
}

/**
 * 把工作台设置投影到 DSH 的真实 llm-pi-ai 设置命名空间。只改 providers.external，
 * lawfirm 和其他命名空间内容原样保留；实际供应商地址永不进入这里。
 *
 * 写入串行化：旧请求即使已经开始也只能先完成，随后队列会执行最新代次。
 * 因而最终落盘者是最新选择，而不是最后返回的旧响应。
 */
export async function syncExternalProvider(
  ext: ExternalLLM | null | undefined,
  revision: number = beginExternalProviderSync(),
  target: ExternalProviderTarget = captureExternalProviderTarget(revision),
): Promise<string | null> {
  const saved = ext ? structuredClone(ext) : ext
  const run = async (): Promise<string | null> => {
    if (!isCurrentExternalProviderTarget(target)) return null
    const remote = target.remote
    if (!remote) return 'DSH 设置服务还没接上，外部模型路由没有同步'
    let ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }>
    if (saved?.enabled === true) {
      if (
        typeof saved.base_url !== 'string' || !/^https?:\/\//.test(saved.base_url) ||
        typeof saved.model !== 'string' || !saved.model.trim() ||
        !Number.isInteger(saved.context_window) || (saved.context_window ?? 0) < 2048
      ) return '外部模型配置不完整，DSH 路由没有同步'
      ops = [{
          op: 'set' as const,
          path: ['providers', 'external'],
          value: {
            displayName: '外部模型',
            api: 'openai-completions',
            baseURL: EXTERNAL_PROVIDER_BASE_URL,
            apiKeyEnv: EXTERNAL_LLM_KEY,
            timeoutMs: 1200000,
            retryPolicy: { mode: 'normal', maxRetries: 1 },
            models: [{
              id: saved.model,
              name: '外部模型',
              contextWindow: saved.context_window,
              input: ['text'],
            }],
          },
        }]
    } else {
      let absent = false
      if (typeof remote.describe === 'function') {
        try {
          absent = confirmedExternalProviderAbsent(await remote.describe())
          if (!isCurrentExternalProviderTarget(target)) return null
        } catch {
          if (!isCurrentExternalProviderTarget(target)) return null
        }
      }
      if (absent) return null
      ops = [{ op: 'unset', path: ['providers', 'external'] }]
    }
    try {
      const r = await remote.mutate(EXTERNAL_PROVIDER_NS, ops, undefined)
      if (!isCurrentExternalProviderTarget(target)) return null
      return r?.ok === true && Object.prototype.hasOwnProperty.call(r, 'value')
        ? null
        : externalProviderFailure(r?.ok === false ? r.error : undefined)
    } catch (error) {
      return isCurrentExternalProviderTarget(target) ? externalProviderFailure(error) : null
    }
  }
  const result = externalProviderQueue.then(run, run)
  externalProviderQueue = result.then(() => undefined, () => undefined)
  return result
}

const CONVERTERS: Array<[Settings['converter'], string]> = [['auto', '自动（依次试 Word、WPS、内置转换程序）'], ['word', 'Microsoft Word'], ['wps', 'WPS'], ['libreoffice', '内置转换程序']]
// Mac 版（令 1424 第 2 条）：不列 Word、WPS；旧设置里是 word / wps 时照样显示出来并注明不可用，不悄悄改值
const MAC_CONVERTERS: Array<[Settings['converter'], string]> = [['auto', '自动（内置转换程序）'], ['libreoffice', '内置转换程序']]
export function converterOptions(current: Settings['converter'], mac = isMac()): Array<[Settings['converter'], string]> {
  if (!mac) return CONVERTERS
  return current === 'word' || current === 'wps' ? [...MAC_CONVERTERS, [current, `${current === 'word' ? 'Microsoft Word' : 'WPS'}（Mac 版不可用）`]] : MAC_CONVERTERS
}
const THINKING: Params['thinking'][] = ['关闭', '低', '中', '高']
const WINDOWS: Params['window'][] = ['32K', '64K', '128K']

async function readSettingsIntoState(
  expectedRevision: number,
  expectedRemote: ReturnType<typeof currentSettingsRemote>,
  settingsApi: LawbenchApi | undefined,
): Promise<Settings | null | undefined> {
  if (!settingsApi) return undefined
  try {
    const s = await settingsApi.getSettings<Settings>()
    if (expectedRevision !== settingsStateRevision || expectedRemote !== currentSettingsRemote() || settingsApi !== currentLawbenchApi()) return null
    app.set((st) => ({ ...st, defaults: s.defaults, presets: s.skill_presets, lawyerName: s.profile?.lawyer_name ?? null }))
    return s
  } catch {
    return expectedRevision === settingsStateRevision && expectedRemote === currentSettingsRemote() && settingsApi === currentLawbenchApi()
      ? undefined
      : null
  }
}

/** 读设置后把默认参数、Skill 预设放进界面状态（输入区参数的初值）。 */
export async function loadSettingsIntoState(): Promise<Settings | null | undefined> {
  const revision = settingsStateRevision
  const remote = currentSettingsRemote()
  return readSettingsIntoState(revision, remote, currentLawbenchApi())
}

/** 服务设置读回后再投影；读取慢于新保存时由代次门丢弃旧结果。 */
export async function projectSavedExternalProvider(
  revision: number = beginExternalProviderSync(),
  target: ExternalProviderTarget = captureExternalProviderTarget(revision),
): Promise<string | null> {
  const stateRevision = settingsStateRevision
  const settings = await readSettingsIntoState(stateRevision, target.remote, target.api)
  if (settings === null || !isCurrentExternalProviderTarget(target)) return null
  if (!settings) return '没能读取服务设置，外部模型路由没有同步'
  return syncExternalProvider(settings.external_llm, revision, target)
}

function publishExternalProviderResult(target: ExternalProviderTarget, error: string | null): void {
  if (!isCurrentExternalProviderTarget(target)) return
  externalProviderLifecycle.set({ error })
  if (error) notice('外部模型当前不可用', `${error}。可在设置中重试同步。`)
}

/** registerSettingsRemote 的启动与重连共用入口；结果必须落到可见状态。 */
export function projectAndShowExternalProvider(): void {
  if (!currentLawbenchApi() || !currentSettingsRemote()) return
  beginSettingsStateChange()
  const revision = beginExternalProviderSync()
  const target = captureExternalProviderTarget(revision)
  void projectSavedExternalProvider(revision, target).then((error) => publishExternalProviderResult(target, error))
}

export function retryExternalProviderProjection(): void {
  projectAndShowExternalProvider()
}

export function SettingsSection() {
  // 草稿在 settings-draft.ts 的界面状态里（令 1609 第 2 条）：这一节卸下（切到别的页面、关掉设置）时草稿不丢，有修改就问
  const { loaded: loadedRaw, draft: draftRaw } = useStore(settingsDraft, (x) => x)
  const providerLifecycle = useStore(externalProviderLifecycle, (x) => x)
  const loaded = loadedRaw as Settings | null
  const draft = draftRaw as Settings | null
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [err, setErr] = useState<{ code: string; message: string } | null>(null)
  const templateInput = useRef<HTMLInputElement>(null)
  const [templateFor, setTemplateFor] = useState<'文书' | '合同'>('文书')
  useEffect(() => {
    // 带着上次没保存的修改回来：不重读，接着改（保存条还在）
    if (!isDirty()) {
      const token = currentSettingsStateToken()
      void loadSettingsIntoState().then((s) => {
        if (!isCurrentSettingsStateToken(token)) return
        if (s === null) return
        if (s === undefined) {
          setErr({ code: 'SERVICE_UNAVAILABLE', message: '没能读取设置，请稍后重试' })
          return
        }
        settingsDraft.set({ loaded: s as never, draft: structuredClone(s) as never, savedAt: null })
      })
    }
    void lb().setupState().then((s) => setHasKey(s.hasKey)).catch(() => setHasKey(null))
    void lb().listSkills().then((r) => setSkills(r.value.skills.filter((x) => x.mode === MODE_AGENT))).catch(() => undefined)
    return () => {
      let leaveExternal: {
        target: ExternalProviderTarget
        external: ExternalLLM | null | undefined
      } | undefined
      void onLeaveSettings({
        onSaveStart: (snapshot) => {
          beginSettingsStateChange()
          const revision = beginExternalProviderSync()
          leaveExternal = {
            target: captureExternalProviderTarget(revision),
            external: snapshot.external_llm ? structuredClone(snapshot.external_llm) : snapshot.external_llm,
          }
        },
        onSaveComplete: async ({ error, current }) => {
          if (error !== null || !current || !leaveExternal || !isCurrentExternalProviderTarget(leaveExternal.target)) return
          const { target, external } = leaveExternal
          const p = await syncExternalProvider(external, target.revision, target)
          publishExternalProviderResult(target, p)
          if (p && isCurrentExternalProviderTarget(target)) {
            notice('外部模型路由没有同步', `${p}。设置已保存，请重新打开设置后再保存一次。`)
          }
        },
      })
    }
  }, [])
  if (!draft || !loaded) return <div style={{ padding: 16 }}><h2 style={S.h2}>律师工作台</h2><ErrorLine error={err} />{err ? null : <div style={S.sub}>读取中…</div>}</div>

  const up = (f: (d: Settings) => void) => { const d = structuredClone(draft); f(d); settingsDraft.set((x) => ({ ...x, draft: d as never })) }
  const save = async () => {
    beginSettingsStateChange()
    const revision = beginExternalProviderSync()
    const target = captureExternalProviderTarget(revision)
    const savedExternal = draft.external_llm ? structuredClone(draft.external_llm) : draft.external_llm
    const result = await saveDraftResult()
    if (!result.current) return
    if (result.error) { setErr({ code: 'INVALID_ARGUMENT', message: result.error }); return }
    setErr(null)
    const p = await syncExternalProvider(savedExternal, revision, target)
    publishExternalProviderResult(target, p)
  }
  const skillTitle = (n: string) => skills.find((s) => s.name === n)?.title ?? n
  const unset = skills.filter((s) => !draft.skill_presets[s.name])

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18, color: C.text, fontSize: 13 }}>
      <h2 style={S.h2}>律师工作台</h2>
      <ErrorLine error={err} />

      <Block title="服务器和 Key" note="服务器地址本版只显示；Key 可以更换。">
        <Field label="律所模型服务器"><Ro>{loaded.servers.llm_base_url}</Ro><Ro>所外：{loaded.servers.llm_alt_base_url ?? '未设置'}</Ro></Field>
        <Field label="律所识别服务器"><Ro>{loaded.servers.prep_base_url}</Ro><Ro>所外：{loaded.servers.prep_alt_base_url ?? '未设置'}</Ro></Field>
        <Field label="个人 Key"><Ro>{hasKey === null ? '读取中' : hasKey ? `已设置（保存在 ${keyStoreName()}）` : '未设置'}</Ro><ChangeKey onChanged={() => setHasKey(true)} /></Field>
      </Block>

      <Block title="外部模型" note="外部模型配置随本页保存；Key 单独存进系统凭据管理器。">
        {providerLifecycle.error ? (
          <div role="alert" style={{ ...S.row, color: C.err, justifyContent: 'space-between' }}>
            <span>外部模型当前不可用：{providerLifecycle.error}</span>
            <Button size="sm" variant="outline" onClick={retryExternalProviderProjection}>重试同步</Button>
          </div>
        ) : null}
        <ExternalLLMSettings value={draft.external_llm} onChange={(v) => up((d) => { d.external_llm = v })} />
      </Block>

      <Block title="公开网页搜索" note="人工触发；只发送搜索框里的查询或你明确选择读取的网页地址。">
        <SearchKeyControl />
        <div style={S.sub}>
          专用 Key 与律所 Key、外部模型 Key 分开保存。搜索不会自动上传案件材料、原问题或聊天历史；产品不会声称自动脱敏，也不保证任何网页都能抓取。
        </div>
      </Block>

      <Block title="胶囊" note="输入框上方的两层胶囊：排序、改名、隐藏、新增。只影响这台电脑。">
        <CapsuleSettings />
      </Block>

      <RemoteAccessSection />

      <Block title="个人参数预设" note="新任务的默认参数；也可以给某个 Skill 单独设一套。">
        <ParamsRow label="默认" p={draft.defaults} onChange={(p) => up((d) => { d.defaults = p })} />
        {/* 注记 1616 第 7 条：wiki 慢查实是思考档位，在这里说清楚 */}
        <div data-hint="thinking" style={S.sub}>思考档位越高，回答和生成案件 wiki 越慢；一般用"中"就够。</div>
        {Object.entries(draft.skill_presets).map(([name, p]) => (
          <ParamsRow key={name} label={skillTitle(name)} p={p} onChange={(np) => up((d) => { d.skill_presets[name] = np })}
            extra={<Button size="sm" variant="ghost" onClick={() => up((d) => { delete d.skill_presets[name] })}>去掉</Button>} />
        ))}
        {unset.length ? (
          <label style={S.row}>给 Skill 单独设
            <select style={S.input} value="" onChange={(e) => { const n = e.target.value; if (n) up((d) => { d.skill_presets[n] = { ...(skills.find((s) => s.name === n)?.params ?? d.defaults) } }) }}>
              <option value="">选择 Skill…</option>
              {unset.map((s) => <option key={s.name} value={s.name}>{s.title}</option>)}
            </select>
          </label>
        ) : null}
      </Block>

      <Block title="Word 模板" note="导出 Word 时套用；不设就用内置模板。">
        {(['文书', '合同'] as const).map((k) => (
          <Field key={k} label={`${k}模板`}>
            <Ro>{draft.templates[k] ?? '内置模板'}</Ro>
            <Button size="sm" variant="outline" onClick={() => { setTemplateFor(k); templateInput.current?.click() }}>选择文件…</Button>
            {draft.templates[k] ? <Button size="sm" variant="ghost" onClick={() => up((d) => { d.templates[k] = null })}>用内置</Button> : null}
          </Field>
        ))}
        <input ref={templateInput} type="file" accept=".docx" hidden onChange={(e) => {
          const f = e.target.files?.[0]; e.target.value = ''
          const path = f ? getNav().pathFor(f) : ''
          if (path) up((d) => { d.templates[templateFor] = path })
        }} />
      </Block>

      <Block title="本机律师">
        <Field label="律师姓名"><input style={{ ...S.input, width: 200 }} value={draft.profile.lawyer_name ?? ''} placeholder="结案报告、立卷申请书默认的承办律师"
          onChange={(e) => up((d) => { d.profile.lawyer_name = e.target.value.trim() ? e.target.value : null })} /></Field>
      </Block>

      <Block title="日常办公" note="发票台账等放在这里；不要选云同步文件夹。">
        <Field label="日常办公文件夹">
          <Ro>{draft.office.dir ?? '未设置'}</Ro>
          <Button size="sm" variant="outline" onClick={() => void getNav().pickDirectory().then((p) => { if (p) up((d) => { d.office.dir = p }) })}>选择文件夹…</Button>
        </Field>
        <Field label="发票购买方名称"><input style={{ ...S.input, width: 280 }} value={draft.office.invoice_buyer ?? ''} placeholder="律所全称，用于核对发票抬头"
          onChange={(e) => up((d) => { d.office.invoice_buyer = e.target.value.trim() ? e.target.value : null })} /></Field>
      </Block>

      <Block title="Word 转 PDF">
        <Field label="使用的程序">
          <select style={S.input} value={draft.converter} onChange={(e) => up((d) => { d.converter = e.target.value as Settings['converter'] })}>
            {converterOptions(draft.converter).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </Field>
      </Block>

      <Block title="关于">
        <div style={{ ...S.row, gap: 12 }}><BrandMark size={32} /><span style={{ fontWeight: 600 }}>{PRODUCT_NAME} {versionLabel()}</span></div>
        <div style={S.sub}>{FIRM_NAME} · 本机运行，案件材料只在这台电脑和律所服务器之间处理。</div>
        <VendorLine />
        <SelfCheckNotes />
      </Block>
      <SaveBar onSave={() => void save()} />
    </div>
  )
}

/** T34 外部模型五个设置字段。旧的缺字段响应只在这里补显示，不回写服务。 */
export function ExternalLLMSettings({ value, onChange }: { value?: ExternalLLM | null; onChange: (v: ExternalLLM) => void }) {
  const v = value ?? CLOSED_EXTERNAL_LLM
  const patch = (p: Partial<ExternalLLM>) => onChange({ ...v, ...p })
  return (
    <>
      <Field label="启用">
        <label style={S.row}>
          <input type="checkbox" role="switch" aria-label="启用外部模型" checked={v.enabled === true}
            onChange={(e) => patch({ enabled: e.target.checked })} />
          {v.enabled ? '已启用' : '关闭'}
        </label>
      </Field>
      <Field label="地址">
        <input aria-label="外部模型地址" style={{ ...S.input, width: 380 }} value={v.base_url ?? ''} disabled={!v.enabled}
          placeholder="OpenAI 兼容地址，不含 /chat/completions"
          onChange={(e) => patch({ base_url: e.target.value.trim() ? e.target.value : null })} />
      </Field>
      <Field label="模型名">
        <input aria-label="外部模型名" style={{ ...S.input, width: 280 }} value={v.model ?? ''} disabled={!v.enabled}
          onChange={(e) => patch({ model: e.target.value.trim() ? e.target.value : null })} />
      </Field>
      <Field label="上下文窗口">
        <input aria-label="外部模型上下文窗口" type="number" min={2048} max={2000000} step={1024} disabled={!v.enabled}
          style={{ ...S.input, width: 180 }} value={v.context_window ?? ''}
          onChange={(e) => { const n = Number(e.target.value); patch({ context_window: e.target.value === '' ? null : Number.isInteger(n) ? n : null }) }} />
      </Field>
      <Field label="工具能力">
        <label style={S.row}>
          <input type="checkbox" aria-label="外部模型声明支持工具" checked={v.supports_tools !== false}
            onChange={(e) => patch({ supports_tools: e.target.checked })} />
          支持工具
        </label>
      </Field>
      <Field label="外部 Key"><ExternalKeyControl /></Field>
    </>
  )
}

/** 只走真实 credentials Remote；提交后先清空输入，再进行异步写入。 */
export function ExternalKeyControl() {
  const [capability, setCapability] = useState<{
    api: CredentialsApi
    configured: boolean | null
    writable: boolean
  } | null>(null)
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const api = useSyncExternalStore(subscribeCredentialsApi, currentCredentialsApi, currentCredentialsApi)
  const generation = useRef(0)
  const operation = useRef(0)
  const busyGate = useRef(false)
  const isCurrent = (startedAt: number, usedApi: CredentialsApi) =>
    generation.current === startedAt && currentCredentialsApi() === usedApi
  // readonly 资格必须由当前 API 实例的有效 describe 产生；旧实例留下的 true 不能跨代沿用。
  const configured = capability !== null && capability.api === api ? capability.configured : null
  const writable = capability !== null && capability.api === api && capability.writable === true

  // 凭据插件可能在设置控件挂载后才注入、撤下或重新注入；能力换代时旧响应和旧忙碌门都失效。
  useEffect(() => {
    let active = true
    const startedAt = ++generation.current
    operation.current += 1
    busyGate.current = false
    setBusy(false)
    setMessage('')
    if (!api) {
      setCapability(null)
      return () => { active = false; generation.current += 1 }
    }
    setCapability(null)
    const read = async () => {
      try {
        const info = (await api.describe([EXTERNAL_LLM_KEY]))[EXTERNAL_LLM_KEY]
        if (!active || !isCurrent(startedAt, api)) return
        setCapability({ api, configured: info?.configured === true, writable: info?.writable !== false })
      } catch {
        if (!active || !isCurrent(startedAt, api)) return
        setCapability({ api, configured: null, writable: false })
        setMessage('没能读取外部 Key 状态')
      }
    }
    void read()
    return () => { active = false; generation.current += 1 }
  }, [api])

  const begin = () => {
    busyGate.current = true
    setBusy(true)
    setMessage('')
    return { op: ++operation.current, startedAt: ++generation.current }
  }

  const submit = async () => {
    const secret = key.trim()
    const usedApi = api
    if (!usedApi || currentCredentialsApi() !== usedApi || !capability || capability.api !== usedApi || !capability.writable ||
      !secret || busyGate.current) return
    setKey('')
    const { op, startedAt } = begin()
    try {
      await usedApi.set(EXTERNAL_LLM_KEY, secret)
      if (!isCurrent(startedAt, usedApi)) return
      setOpen(false)
      setMessage('外部 Key 已保存')
      try {
        const info = (await usedApi.describe([EXTERNAL_LLM_KEY]))[EXTERNAL_LLM_KEY]
        if (!isCurrent(startedAt, usedApi)) return
        setCapability({ api: usedApi, configured: info?.configured === true, writable: info?.writable !== false })
      } catch {
        if (!isCurrent(startedAt, usedApi)) return
        setCapability({ api: usedApi, configured: null, writable: false })
        setMessage('外部 Key 已保存，但没能读取当前状态')
      }
    } catch {
      if (isCurrent(startedAt, usedApi)) setMessage('外部 Key 没有保存成功')
    } finally {
      if (operation.current === op && isCurrent(startedAt, usedApi)) {
        busyGate.current = false
        setBusy(false)
      }
    }
  }
  const clear = async () => {
    const usedApi = api
    if (!usedApi || currentCredentialsApi() !== usedApi || !capability || capability.api !== usedApi || !capability.writable ||
      capability.configured !== true || busyGate.current) return
    const { op, startedAt } = begin()
    try {
      await usedApi.unset(EXTERNAL_LLM_KEY)
      if (!isCurrent(startedAt, usedApi)) return
      let info: { configured: boolean; writable: boolean } | undefined
      try {
        info = (await usedApi.describe([EXTERNAL_LLM_KEY]))[EXTERNAL_LLM_KEY]
      } catch {
        if (!isCurrent(startedAt, usedApi)) return
        setCapability({ api: usedApi, configured: null, writable: false })
        setMessage('未确认清除：没能读取当前状态')
        return
      }
      if (!isCurrent(startedAt, usedApi)) return
      if (!info) {
        setCapability({ api: usedApi, configured: null, writable: false })
        setMessage('未确认清除：没能读取当前状态')
        return
      }
      setCapability({ api: usedApi, configured: info.configured === true, writable: info?.writable !== false })
      setMessage(info.configured === false ? '外部 Key 已清除' : '未确认清除：外部 Key 仍显示为已设置')
    } catch {
      if (isCurrent(startedAt, usedApi)) setMessage('外部 Key 没有清除成功')
    } finally {
      if (operation.current === op && isCurrent(startedAt, usedApi)) {
        busyGate.current = false
        setBusy(false)
      }
    }
  }
  const canSubmit = key.trim().length > 0 && !busy && writable
  return (
    <span style={{ ...S.row, flexWrap: 'wrap' }}>
      <span>{configured === null ? '状态未知' : configured ? '已设置' : '未设置'}</span>
      {open ? (
        <>
          <input type="password" autoComplete="off" aria-label="外部模型 Key" style={{ ...S.input, width: 240 }} value={key}
            onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) { e.preventDefault(); void submit() } }} />
          <Button size="sm" variant="primary" disabled={!canSubmit} onClick={() => void submit()}>保存外部 Key</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setKey(''); setOpen(false) }}>取消</Button>
        </>
      ) : <Button size="sm" variant="outline" disabled={busy || !writable} onClick={() => { setMessage(''); setOpen(true) }}>保存外部 Key</Button>}
      {configured ? <Button size="sm" variant="ghost" disabled={busy || !writable} onClick={() => void clear()}>清除外部 Key</Button> : null}
      {message ? <span role="status">{message}</span> : null}
    </span>
  )
}

/**
 * 设置页底部固定的保存条（令 1609 第 2 条）：贴在设置内容的底边、不随内容滚动。有未保存的修改时显示"有未保存的修改"＋"保存"＋"放弃修改"；
 * 保存成功后两秒内显示"已保存 HH:mm"；其余时候不显示。
 */
export function SaveBar({ onSave, now = () => Date.now() }: { onSave: () => void; now?: () => number }) {
  const state = useStore(settingsDraft, (x) => x)
  const dirty = isDirty(state)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!state.savedAt) return
    const t = setTimeout(() => tick((n) => n + 1), Math.max(0, state.savedAt + 2000 - now()))
    return () => clearTimeout(t)
  }, [state.savedAt]) // eslint-disable-line react-hooks/exhaustive-deps
  const justSaved = !dirty && state.savedAt !== null && now() - state.savedAt < 2000
  if (!dirty && !justSaved) return null
  const hm = (t: number) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  return (
    <div role="region" aria-label="保存" data-lawbench-savebar="" style={{
      position: 'sticky', bottom: 0, zIndex: 2, margin: '0 -16px -16px', padding: '10px 16px',
      background: C.layer, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      {dirty ? (
        <>
          <span style={{ color: C.warn, fontWeight: 600 }}>有未保存的修改</span>
          <span style={S.row}>
            <Button variant="outline" size="sm" onClick={() => discardDraft()}>放弃修改</Button>
            <Button variant="primary" size="sm" onClick={onSave}>保存</Button>
          </span>
        </>
      ) : <span style={{ color: C.ok }}>已保存 {hm(state.savedAt!)}</span>}
    </div>
  )
}

/** 一台服务器测试结果的一句话（服务给的 message 已是中文说明）。 */
export function connectionLine(label: string, r: ConnectionResult | null): string {
  if (!r) return `${label}：没有测成`
  return `${label}：${r.message}`
}

/**
 * 更换 Key（执行令 1751 必修 3）：输入新 Key → Host 写进凭据管理器（覆盖旧 Key）→ 自动测一次连接 → 显示结果。
 * 输入框是密码框；提交后立即清空，界面任何地方都不显示 Key。
 */
export function ChangeKey({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; lines: string[] } | null>(null)
  const submit = async () => {
    const k = key.trim()
    setKey('')
    if (!/^[!-~]{8,512}$/.test(k)) { setResult({ ok: false, lines: ['Key 格式不对：应为 8 个字符以上、不含空格和中文'] }); return }
    setBusy(true); setResult(null)
    try {
      const r = await lb().changeKey(k)
      onChanged()
      setOpen(false)
      const ok = !r.error && r.llm?.reachable === true && r.llm.key_valid !== false && r.prep?.reachable === true
      setResult({ ok, lines: ['已换成新 Key', ...(r.error ? [`测试连接没有做成：${r.error}`] : [connectionLine('律所模型服务器', r.llm), connectionLine('律所识别服务器', r.prep)])] })
    } catch (e) {
      setResult({ ok: false, lines: [`没有换成：${lawyerMessage((e as Error).message)}`] })
    } finally { setBusy(false) }
  }
  return (
    <>
      {open ? (
        <span style={S.row}>
          <input type="password" autoComplete="off" aria-label="新 Key" style={{ ...S.input, width: 240 }} value={key} placeholder="粘贴新 Key"
            onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && key) void submit() }} />
          <Button size="sm" variant="primary" disabled={!key || busy} onClick={() => void submit()}>保存并测试</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setKey(''); setOpen(false) }}>取消</Button>
        </span>
      ) : <Button size="sm" variant="outline" disabled={busy} onClick={() => { setResult(null); setOpen(true) }}>{busy ? '正在测试…' : '更换 Key'}</Button>}
      {result ? (
        <div role="status" style={{ width: '100%', paddingLeft: 118, fontSize: 12, color: result.ok ? C.ok : C.err }}>
          {result.lines.map((l) => <div key={l}>{l}</div>)}
        </div>
      ) : null}
    </>
  )
}

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div><h3 style={S.h3}>{title}</h3>{note ? <div style={S.sub}>{note}</div> : null}</div>
      {children}
    </section>
  )
}
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ ...S.row, flexWrap: 'wrap' }}><span style={{ width: 110, color: C.sub }}>{label}</span>{children}</div>
)
const Ro = ({ children }: { children: ReactNode }) => <span style={{ ...S.input, border: 'none', padding: '5px 0', wordBreak: 'break-all' }}>{children}</span>

function ParamsRow({ label, p, onChange, extra }: { label: string; p: Params; onChange: (p: Params) => void; extra?: ReactNode }) {
  return (
    <div style={{ ...S.row, flexWrap: 'wrap' }}>
      <span style={{ width: 110, color: C.sub }}>{label}</span>
      <label style={S.row}>思考<select style={S.input} value={p.thinking} onChange={(e) => onChange({ ...p, thinking: e.target.value as Params['thinking'] })}>{THINKING.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label style={S.row}>窗口<select style={S.input} value={p.window} onChange={(e) => onChange({ ...p, window: e.target.value as Params['window'] })}>{WINDOWS.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label style={S.row}>最长输出<input type="number" min={256} max={262144} step={1024} style={{ ...S.input, width: 100 }} value={p.max_tokens}
        onChange={(e) => { const n = Number(e.target.value); if (n >= 256 && n <= 262144) onChange({ ...p, max_tokens: n }) }} /></label>
      {extra}
    </div>
  )
}

/** 启动自检里只作说明的项（注记 2053：如"未配置律所统一 Skill 目录"），在"关于"里一行一条，不算问题。 */
export function SelfCheckNotes() {
  const [notes, setNotes] = useState<Array<{ id: string; message: string }>>([])
  useEffect(() => { void call<{ notes?: Array<{ id: string; message: string }> }>('selfCheck').then((r) => { if (r.ok) setNotes(r.value.notes ?? []) }) }, [])
  return <>{notes.map((n) => <div key={n.id} data-selfcheck-note={n.id} style={S.sub}>{n.message}</div>)}</>
}
