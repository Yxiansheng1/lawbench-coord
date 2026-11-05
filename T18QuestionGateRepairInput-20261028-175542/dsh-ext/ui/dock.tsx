// 会话输入区上方（DSH 插槽 conversation.input.dock）：当前胶囊和 Skill 选择、必问问题、参数、选用的前序成果（PRD 7.9）。
// 契约 1.2（N37）：服务管该会话"当前的选择"，管到律师改掉为止（执行时不消耗）。界面按会话存（与服务同口径），不另记：
// 挂上、切换会话、每轮结束之后从 GET /api/task/current 读，下拉框和状态行都设成服务返回的；律师改动时 POST /api/task，
// 写成功之前状态行显示"正在保存选择…"，写失败显示"任务单没有写成，请重试"并保留下拉框的值，此时发送被拦下（执行令 1751）。entry 填胶囊 id（T13 执行令 Q5）。
// 运行状态和停止沿用 DSH 对话区自带的。
// 用户 10-04 改版（执行令 1156 第 3 条）：两层胶囊放到输入框上方——空会话时从上到下是分流提示一行、第二层"<分类> · 选要做什么"、
// 第一层"能力入口"，选中的能力显示成输入框上方的小标签【证据整理】（× 取消）；会话里有内容后两层收起，点"选能力"再展开。
// 只此一套选择器（原先的胶囊下拉框并进来）；工具胶囊（发票、委托材料）点了仍打开 T26 的页面。
import { useEffect, useMemo, useRef, useState } from 'react'
import { TOOL_WORD, visible, type Capsule, type Capsules, type SkillCapsule } from './capsules.ts'
import { statusErrorText } from './format.ts'
import { Badge, Button, C, getNav, S } from './kit.tsx'
import { TaskAnswerSlot } from './answer.tsx'
import { app, applyServerSelection, call, clearInputChanged, clearStaleServer, confirm, currentCredentialsApi, isDaily, lb, markInputChanged, samePath, markSelectionSaved, MODE_AGENT, notice as showNotice, setSelection, showTaskAnswer, takeIntent, type CaseRef, type Params, type Selection, type SkillInfo } from './state.ts'
import { useStore } from './store.ts'
import { useSessionCase, type SessionProps } from './session-case.tsx'
import { CaseOverview, type SessionBrief } from './overview.tsx'
import { homeView } from './invoice-logic.ts'
import { openRetainer } from './retainer.ts'
import { confirmScope } from './estimate.ts'
import { choiceKey, fromServer, isFree, SelectionSync, selectionKey, statusOf, statusText, type ApiError, type CurrentResult, type ServerSelection, type TaskRoute, type UiSelection, type WriteResult } from './tasksheet.ts'
import { EXTERNAL_ROUTE_UNAVAILABLE, REQUEST_SCOPE_UNAVAILABLE, SKILL_QUESTIONS_UNAVAILABLE } from '../shared/turn-notices.ts'
import { WIKI_SKILL, WikiEntryDialog } from './wiki-entry.tsx'
import { MaterialBatchBar } from './material-batch.tsx'

const THINKING: Params['thinking'][] = ['关闭', '低', '中', '高']
const WINDOWS: Params['window'][] = ['32K', '64K', '128K']
const WRITE_DELAY_MS = 500
const FALLBACK_PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 16384 }
/** 上一轮因输入材料变化被拦下（/core/context 报 INPUT_CHANGED）时状态行的话（ORCH 注记 2026-09-30 13:18）。 */
export const INPUT_CHANGED_TEXT = '输入材料已变化，请重新选择'
/** 上一轮因会话所在的案件文件夹已不在原处被拒（N55 ②，Agent 插件记 CASE_MOVED）。 */
export const CASE_MOVED_TITLE = '这条消息没有发出'
export const CASE_MOVED_TEXT = '这个对话所在的案件文件夹已经不在原来的位置。刚才这句没有发出，重启软件后请在这个对话里重新发送这句话，或新开一个对话。'
/** 上一轮取任务时服务说这个对话不属于任何已打开的案件（/core/task/begin 报 CASE_NOT_FOUND，第六轮复核 A-P2-3 / B-F2）。 */
export const CASE_NOT_FOUND_TEXT = '没有找到这个对话所在的案件。请回到首页重新打开案件；如果案件文件夹刚挪过位置，请重启软件后在这个对话里继续，或新开一个对话。'
/** 写任务单（POST /api/task）明确失败时状态行的话（T14 第二次实跑派修 2，执行令 1751）；此时发送被 Agent 插件拦下。 */
export const SHEET_FAILED_TEXT = '任务单没有写成，请重试'
/** 一轮结束了，但任务的结束状态没能登记到服务（Agent 插件重试一次仍失败，记 TASK_END_FAILED；令 0405 追加）。 */
export const TASK_END_FAILED = 'TASK_END_FAILED'
export const TASK_END_FAILED_TITLE = '任务结束状态未能登记'
export const TASK_END_FAILED_TEXT = '刚才这一轮已经结束，但结束状态没能记到本机服务里。已存的草稿和成果不受影响，可以照常确认保存；多次出现请联系技术支持。'
/** 任务单没写成时律师仍点了发送：这一轮被拒（Agent 插件记 TASK_SHEET_FAILED）。 */
export const SHEET_FAILED_SEND_TEXT = '输入区的任务单没有写成，刚才这句没有发出。请先点输入区的"重试"，写成之后再发送。'
export const TASK_SHEET_FAILED = 'TASK_SHEET_FAILED'
/** 一轮结束的事件名（index.tsx 按会话列表的 running 由真变假发出，detail 为会话 id）。 */
/** Agent 插件到达用量上限时记的提示码（agent/index.ts 的 BUDGET_STOPPED；界面不引 Agent 插件，照写一份）。 */
export const BUDGET_STOPPED = 'BUDGET_STOPPED'
/** Agent 插件的熔断提示码（agent/index.ts 的 REPETITION_STOPPED；注记 2026-10-14 19:01），照写一份。只有第①道（调用被中止）提示。 */
export const REPETITION_STOPPED = 'REPETITION_STOPPED'
export const TURN_ENDED = 'lawbench:turn-ended'
export const TURN_STARTED = 'lawbench:turn-started'
const DOCK_CONNECTION_RESET = 'lawbench:dock-connection-reset'
export const SAVING_ROUTE_TEXT = '正在保存模型选择，暂时不能发送…'
export const EXTERNAL_CONFIRM_TITLE = '切换到外部公开模型'
export const EXTERNAL_CONFIRM_TEXT = '外部公开模型可能读取本案材料。请确认材料可以发送给该服务后再继续。'
export const EXTERNAL_HINT_TEXT = '外部模型采用服务商默认思考设置；使用公开模型时请避免上传客户信息'
export const EXTERNAL_NOT_READY_TEXT = '外部模型尚未配置完整。请先在设置里启用外部模型，填写地址、模型名和上下文窗口，并保存外部 Key。'
export const EXTERNAL_ROUTE_UNAVAILABLE_TITLE = '外部模型暂时不可用'
export const EXTERNAL_ROUTE_UNAVAILABLE_TEXT = '刚才这句没有发出。请检查设置中是否已启用外部模型并保存外部 Key，然后再重试。'
export const REQUEST_SCOPE_UNAVAILABLE_TITLE = '本批材料范围没有锁定'
export const REQUEST_SCOPE_UNAVAILABLE_TEXT = '刚才这句没有按本批材料发出。请重新导入材料，看到"本批材料"提示后再发送。'
export const SKILL_QUESTIONS_UNAVAILABLE_TITLE = '合同审查没有开始'
export const SKILL_QUESTIONS_UNAVAILABLE_TEXT = '没有读到合同审查技能里的必问问题，刚才这句没有发出。请检查安装目录中的合同审查技能或联系技术支持，修好后重试。'
const EXTERNAL_CREDENTIALS_RESET_TEXT = '外部模型连接已更新，请重试保存模型选择。'

/** 把 DSH 的真实连接重置送到已挂载的输入区，由那里的现有读回队列补偿待释放门。 */
export function notifyDockConnectionReset(): void {
  window.dispatchEvent(new Event(DOCK_CONNECTION_RESET))
}

type ExternalSettings = {
  external_llm?: { enabled?: boolean; base_url?: string | null; model?: string | null; context_window?: number | null } | null
}

/** 外部选择只认服务设置里的完整配置和真实 Key 描述态；不解析 Key，也不把地址写进 DSH profile。 */
export async function externalSelectionReady(settings: ExternalSettings, credentials = currentCredentialsApi()): Promise<boolean> {
  const ext = settings.external_llm
  if (ext?.enabled !== true || typeof ext.base_url !== 'string' || !/^https?:\/\//.test(ext.base_url) ||
    typeof ext.model !== 'string' || !ext.model.trim() || !Number.isInteger(ext.context_window) || (ext.context_window ?? 0) < 2048) return false
  if (!credentials) return false
  try {
    const info = (await credentials.describe(['EXTERNAL_LLM_KEY'])).EXTERNAL_LLM_KEY
    return info?.configured === true
  } catch { return false }
}

// —— 任务结束后把选择清回"自由对话"（注记 0329 第 1 条，用户 2026-10-11 改定：选择"管到任务结束"，原 N37 是"管到律师改掉为止"） ——
// 一轮开始时记下这个会话当时选的是什么；这一轮结束、任务确实跑了，而且此刻选的还是那一份（律师这期间没改），就清掉：
// 选的 Skill、选用的成果、单独调的参数都回到默认，写给服务（entry、skill 为 null）。律师一轮进行中改选的（给下一条用的）不动。
/** 各会话这一轮开始时的选择；没记到（如程序刚启动、会话还没读过选择）就不清。 */
const turnChoice = new Map<string, string>()
/** 一轮已经结束、还没处理的会话（结束时它的输入区可能不在眼前，等下一次读取时处理）。 */
const endedTurns = new Map<string, string>()
if (typeof window !== 'undefined') {
  window.addEventListener(TURN_STARTED, (e) => {
    const id = (e as CustomEvent<string>).detail
    const cur = typeof id === 'string' ? app.get().selections[id] : undefined
    if (cur && cur.saved) turnChoice.set(id, choiceKey(cur)); else turnChoice.delete(id)
  })
  window.addEventListener(TURN_ENDED, (e) => {
    const id = (e as CustomEvent<string>).detail
    const started = typeof id === 'string' ? turnChoice.get(id) : undefined
    if (started !== undefined) { endedTurns.set(id, started); turnChoice.delete(id) }
  })
}
/**
 * 一轮结束后要不要清选择：任务真的跑过才清——没有提示码，或提示码是到顶、结束状态没登记上。
 * 被拦下没跑的（输入变了、案件搬走、任务单没写成、取任务或取上下文失败的其他错误码）不清：律师处理完还要按原来的选择再发。
 */
/**
 * Skill 自带的参数（或律师给它存的预设）里没有温度时，补设置里的默认温度（注记 2026-10-15 14:10，线 B 结论）：
 * 原来 Skill 任务不发 temperature、用网关默认值，与自由对话（发设置的默认 0.6）不一致。Skill 自己写了温度的照用。
 */
export const withDefaultTemperature = (p: Params, defaults: Params | null): Params =>
  p.temperature === undefined && defaults?.temperature !== undefined ? { ...p, temperature: defaults.temperature } : p

/** 跑某个 Skill 用的参数：律师给它存的预设 → Skill 自带的 → 设置里的默认（前两种缺温度时补默认温度）。对话里和生成案件 wiki 共用（注记 1616 第 7 条）。 */
export function skillParams(name: string, skills: readonly SkillInfo[], presets: Record<string, Params>, defaults: Params | null): Params | null {
  const own = presets[name] ?? skills.find((x) => x.name === name)?.params
  return own ? withDefaultTemperature(own, defaults) : defaults
}

/** 案件类型对应默认展开的能力分组（capsules 的分组 id）：民商事→民事与商事，刑事→刑事案件，日常事务→日常办公；没有类型为 undefined。 */
export function groupForKind(kind: string | null | undefined): string | undefined {
  return kind === 'civil' ? 'civil' : kind === 'criminal' ? 'criminal' : kind === 'daily' ? 'office' : undefined
}

export const clearsSelection = (code: string | null): boolean => code === null || code === BUDGET_STOPPED || code === TASK_END_FAILED || code === REPETITION_STOPPED
/** 测试用。 */
export const forgetTurnChoices = (): void => { turnChoice.clear(); endedTurns.clear() }

let capsCache: Promise<Capsules | undefined> | undefined
let skillsCache: Promise<SkillInfo[]> | undefined
// 读失败不缓存（令 1347 一并做 P3-4）：下次挂上输入区再读
const loadCaps = () => (capsCache ??= call<Capsules>('getCapsules').then((r) => {
  if (r.ok) return r.value
  capsCache = undefined
  return undefined
}))
/** 读一次 Skill 清单（几处共用）；读不到为空表、下次重读。 */
export const loadSkills = (): Promise<SkillInfo[]> => (skillsCache ??= Promise.resolve().then(() => lb().listSkills()).then((r) => r.value.skills, () => { skillsCache = undefined; return [] }))
/** 胶囊改动后首页调用，让输入区重新读。 */
export const forgetDockCache = (): void => { capsCache = undefined }

const syncs = new Map<string, SelectionSync>()
/** 测试用：丢掉各会话的读写队列（上一个用例假时钟里没走完的请求不带到下一个）。 */
export const forgetDockSyncs = (): void => {
  syncs.clear()
  selectionWritesInFlight.clear()
  selectionReleaseNeeded.clear()
}
/** 真实写入代次与 Host 拒发门的队首都必须跨组件换会话/卸载保留，旧 finally 才不能放开新保存。 */
const selectionWriteGeneration = new Map<string, number>()
const selectionHoldQueues = new Map<string, Promise<unknown>>()
const selectionWritesInFlight = new Map<string, number>()
/** A persisted selection still needs a confirmed false release after a failed or interrupted call. */
const selectionReleaseNeeded = new Map<string, { generation: number; key: string }>()
const beginSelectionWrite = (sessionId: string): void => {
  selectionWritesInFlight.set(sessionId, (selectionWritesInFlight.get(sessionId) ?? 0) + 1)
}
const endSelectionWrite = (sessionId: string): void => {
  const left = (selectionWritesInFlight.get(sessionId) ?? 1) - 1
  if (left > 0) selectionWritesInFlight.set(sessionId, left)
  else selectionWritesInFlight.delete(sessionId)
}
const hasSelectionWriteInFlight = (sessionId: string): boolean => (selectionWritesInFlight.get(sessionId) ?? 0) > 0
const nextSelectionWrite = (sessionId: string): number => {
  const n = (selectionWriteGeneration.get(sessionId) ?? 0) + 1
  selectionWriteGeneration.set(sessionId, n)
  return n
}
const isSelectionWrite = (sessionId: string, generation: number): boolean =>
  selectionWriteGeneration.get(sessionId) === generation
type SheetHoldResult =
  | { ok: true; value: { held: boolean } }
  | { ok: false; error: ApiError }
/** Host 的 sheetHold 也串行：同一会话先置 true，只有准确那一代写成功才置 false。 */
function setSheetHold(sessionId: string, generation: number, hold: boolean, pendingKey?: string): Promise<SheetHoldResult | undefined> {
  const prev = selectionHoldQueues.get(sessionId) ?? Promise.resolve()
  const run = prev.catch(() => undefined).then(() => {
    if (!isSelectionWrite(sessionId, generation)) return
    if (!hold && pendingKey !== undefined) selectionReleaseNeeded.set(sessionId, { generation, key: pendingKey })
    return call<{ held: boolean }>('sheetHold', { session_id: sessionId, hold })
  })
  selectionHoldQueues.set(sessionId, run)
  void run.catch(() => undefined).finally(() => { if (selectionHoldQueues.get(sessionId) === run) selectionHoldQueues.delete(sessionId) })
  return run
}
/** Only this generation's explicit false acknowledgement completes a save. */
async function releaseSelectionHold(sessionId: string, generation: number, pendingKey: string): Promise<boolean> {
  const result = await setSheetHold(sessionId, generation, false, pendingKey)
  const released = result?.ok === true && result.value.held === false && isSelectionWrite(sessionId, generation)
  const pending = selectionReleaseNeeded.get(sessionId)
  if (released && pending?.generation === generation && pending.key === pendingKey) selectionReleaseNeeded.delete(sessionId)
  return released
}
function syncFor(sessionId: string, caseId: string): SelectionSync {
  const k = JSON.stringify([sessionId, caseId])
  let s = syncs.get(k)
  if (!s) {
    s = new SelectionSync({
      write: (req) => call<{ task_id: string }>('taskCreate', { case_id: caseId, session_id: sessionId, ...req }) as Promise<WriteResult>,
      current: () => call<{ selection: ServerSelection | null }>('taskCurrent', { session_id: sessionId }) as Promise<CurrentResult>,
    })
    syncs.set(k, s)
  }
  return s
}

/** 会话不在已登记案件里时输入区上方的提示（N46 用户定 ②：没有打开案件就不能发消息；发了也会被会话存储拒绝）。 */
export const NO_CASE_TEXT = '先打开或新建一个案件，再在这里发消息。'

/**
 * 输入区上方各行共用的外框（令 1347 第 1 条"没有对齐，看着挺难受"）：与 DSH 的输入框同一左右边缘、同一宽度——
 * 输入框宽 = 容器宽减两侧留白（--dsh-composer-side-clearance），最多 --dsh-composer-card-max-width，居中。
 */
export const DOCK_BOX = {
  boxSizing: 'border-box' as const, width: 'calc(100% - 2 * var(--dsh-composer-side-clearance, 16px))', maxWidth: 'var(--dsh-composer-card-max-width, 952px)',
  margin: '0 auto 4px', display: 'flex', flexDirection: 'column' as const, gap: 10,
}

type SessionRow = { cwd?: string; blank?: boolean; running?: boolean; parentId?: string; displayTitle?: string; title?: string; updatedAt?: number }

export function ComposerDock(p: SessionProps) {
  const { root, caseRef } = useSessionCase(p)
  // 空会话（DSH 的会话摘要 blank）显示概览卡和两层胶囊；有内容后收起
  const hero = p.useSessions?.((s) => (s.byId[p.sessionId] as SessionRow | undefined)?.blank === true) ?? false
  const running = p.useSessions?.((s) => (s.byId[p.sessionId] as SessionRow | undefined)?.running === true) ?? false
  const daily = useStore(app, (s) => isDaily(s, caseRef))
  // 同一案件里别的、有内容的会话（概览卡"最近对话"）；选成字符串，免得每次都是新数组
  const briefsKey = p.useSessions?.((s) => JSON.stringify(Object.entries(s.byId)
    .filter(([id, x]) => id !== p.sessionId && x && !(x as SessionRow).blank && !(x as SessionRow).parentId && root && x.cwd && samePath(x.cwd, root))
    .map(([id, x]) => ({ id, title: (x as SessionRow).displayTitle ?? (x as SessionRow).title ?? '未命名对话', updatedAt: (x as SessionRow).updatedAt ?? 0 })))) ?? '[]'
  const briefs = useMemo(() => JSON.parse(briefsKey) as SessionBrief[], [briefsKey])
  if (!caseRef) {
    return (
      <div style={DOCK_BOX}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: C.rMd, padding: '6px 10px', fontSize: 14, color: C.err, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span role="status">{NO_CASE_TEXT}</span>
          <Button size="sm" variant="ghost" onClick={() => getNav().goHome()}>选择案件</Button>
        </div>
      </div>
    )
  }
  return (
    <div style={DOCK_BOX}>
      {hero ? <CaseOverview caseRef={caseRef} daily={daily} sessions={briefs} /> : null}
      <TaskAnswerSlot caseRef={caseRef} sessionId={p.sessionId} />
      <Dock caseRef={caseRef} sessionId={p.sessionId} hero={hero} running={running} composerBlocks={p.composerBlocks} />
    </div>
  )
}

/** 胶囊按钮（两层共用的样子）。 */
const pill = (on: boolean, dashed: boolean) => ({
  font: 'inherit', fontSize: 13, padding: '3px 12px', borderRadius: 999, cursor: 'pointer', background: on ? 'rgba(47,107,255,0.08)' : 'transparent',
  border: `1px ${dashed && !on ? 'dashed' : 'solid'} ${on ? C.brand : C.border}`, color: on ? C.brand : C.text, fontWeight: on ? 600 : 400,
})

function Dock({ caseRef, sessionId, hero, running, composerBlocks }: { caseRef: CaseRef; sessionId: string; hero: boolean; running: boolean; composerBlocks?: SessionProps['composerBlocks'] }) {
  const [caps, setCaps] = useState<Capsules | undefined>()
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [open, setOpen] = useState(false)
  /** 第一层选中的分类（null：跟随当前能力所在的分类，没有就第一个）。 */
  const [groupId, setGroupId] = useState<string | null>(null)
  /** 会话里有内容后，两层胶囊默认收起，点"选能力"展开。 */
  const [rowsOpen, setRowsOpen] = useState(false)
  /** 第二层是否展开；与第一层入口的显隐分开，点当前分类只收起第二层。 */
  const [itemsOpen, setItemsOpen] = useState(true)
  /** 生成案件 wiki 仍走原 dialog，不写输入区任务单。 */
  const [wikiOpen, setWikiOpen] = useState(false)
  /** 最近一次读或写失败（sessionId：哪个会话的；key：写失败时写的那份选择）。 */
  const [error, setError] = useState<{ sessionId: string; key: string; op: 'read' | 'write'; error: ApiError } | null>(null)
  /** 已经读回过（成败都算）的会话：换会话后、读回之前状态行说"正在读取当前选择…"。 */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  /**
   * 服务那边此刻的选择（刚读回或刚写成功的）的键；律师选回同一份时不必再写。
   * null 表示不知道：还没读回、换了会话、写失败之后（超时或返回不合契约时服务可能已经建了单，T13 返修 P2-1）。
   */
  const serverKey = useRef<string | null>(null)
  const routeOp = useRef(0)
  const lifecycle = useRef({ sessionId, live: true })
  if (lifecycle.current.sessionId !== sessionId) lifecycle.current = { sessionId, live: true }
  // DSH 换会话时输入区不一定重挂（插槽可能只换属性）：按会话 id 重置"服务那边是什么"（T13 返修 P2-2）
  const shownSession = useRef(sessionId)
  if (shownSession.current !== sessionId) { shownSession.current = sessionId; serverKey.current = null }
  useEffect(() => { void loadCaps().then(setCaps); void loadSkills().then(setSkills) }, [])
  const stored = useStore(app, (s) => s.selections[sessionId])
  const intent = useStore(app, (s) => s.intents[caseRef.case_id])
  const inputChanged = useStore(app, (s) => s.inputChanged[sessionId] === true)
  const sel = stored ?? { capsuleId: null, skill: null, params: null, inputs: [], route: 'local' as TaskRoute, saved: false }
  const defaults = useStore(app, (s) => s.defaults)
  const presets = useStore(app, (s) => s.presets)

  const capsules = useMemo(() => (caps ? visible(caps).flatMap((g) => g.items.filter((x): x is SkillCapsule => x.kind === 'skill').map((x) => ({ ...x, group: g.name }))) : []), [caps])
  const capsule = capsules.find((c) => c.id === sel.capsuleId)
  const groups = useMemo(() => (caps ? visible(caps) : []), [caps])
  // 律师点过的分组 → 已选能力所在的分组 → 按案件类型（第九版注记 1616 第 1 条：刑事案件进来默认展开"刑事案件"）→ 第一个
  const byKind = groupForKind(caseRef.kind)
  const group = groups.find((g) => g.id === groupId) ?? groups.find((g) => g.items.some((x) => x.id === sel.capsuleId)) ?? groups.find((g) => g.id === byKind) ?? groups[0]
  const showRows = hero || rowsOpen
  const showItems = showRows && itemsOpen
  const agentSkills = skills.filter((s) => s.mode === MODE_AGENT)
  const choices = capsule ? [...new Set([...capsule.skills, ...(caps?.shared ?? [])])].filter((n) => agentSkills.some((s) => s.name === n)) : []
  const skill = agentSkills.find((s) => s.name === sel.skill)
  const params: Params = sel.params ?? (skill ? skillParams(skill.name, [skill], presets, defaults) : defaults) ?? { thinking: '中', window: '128K', max_tokens: 16384 }

  // 同一会话的读、写排成一队（tasksheet.ts）；队列按会话留着，换走再换回时接着排
  const sync = useMemo(() => syncFor(sessionId, caseRef.case_id), [sessionId, caseRef.case_id])
  const label = capsule ? capsule.name : sel.inputs.length ? '自由对话（带选用的成果）' : '自由对话'
  const ui: UiSelection = { capsuleId: sel.capsuleId, skill: sel.skill, inputs: sel.inputs, params, route: stored?.route ?? 'local' }
  const key = selectionKey(ui)

  // 读服务的当前选择：挂上、换会话、每轮结束之后。律师有还没写成功的改动时不覆盖（写完会再读到同样的值）
  useEffect(() => {
    let alive = true
    const sid = sessionId
    const load = () => {
      void sync.current().then(async (r) => {
        if (!alive) return
        setLoadedFor(sid)
        if (!r.ok) { setError({ sessionId: sid, key: '', op: 'read', error: { code: r.error.code, message: statusErrorText(r.error) } }); return }
        const pending = selectionReleaseNeeded.get(sid)
        const cur = app.get().selections[sid]
        const curKey = cur && selectionKey({ capsuleId: cur.capsuleId, skill: cur.skill, inputs: cur.inputs, params: cur.params ?? params, route: cur.route ?? 'local' })
        if (cur && !cur.saved && (pending === undefined || curKey !== pending.key)) return
        const s = fromServer(r.value.selection)
        const loadedKey = selectionKey(s.params ? s : { ...s, params })
        if (pending !== undefined && (r.value.selection === null || loadedKey !== pending.key)) return
        serverKey.current = loadedKey
        if (pending !== undefined) {
          const generation = nextSelectionWrite(sid)
          if (!await releaseSelectionHold(sid, generation, pending.key)) {
            if (alive && isSelectionWrite(sid, generation)) {
              setError({ sessionId: sid, key: loadedKey, op: 'read', error: { code: 'SHEET_HOLD_FAILED', message: SHEET_FAILED_TEXT } })
            }
            return
          }
          if (!alive || !isSelectionWrite(sid, generation)) return
          const after = app.get().selections[sid]
          if (!after || selectionKey({ capsuleId: after.capsuleId, skill: after.skill, inputs: after.inputs, params: after.params ?? params, route: after.route ?? 'local' }) !== pending.key) return
          markSelectionSaved(sid, (selection) =>
            selectionKey({ capsuleId: selection.capsuleId, skill: selection.skill, inputs: selection.inputs, params: selection.params ?? params, route: selection.route ?? 'local' }) === pending.key)
          composerBlocks?.clear(sid, SAVING_ROUTE_TEXT)
          setError(null)
          return
        }
        if (!alive) return
        composerBlocks?.clear(sid, SAVING_ROUTE_TEXT)
        setError(null)
        applyServerSelection(sid, { capsuleId: s.capsuleId, skill: s.skill, inputs: s.inputs, params: (s.params as Params | null) ?? null, route: s.route ?? 'local' })
      })
    }
    // 问 Host 上一轮是否被拦下（取一次即删）；输入材料变了（INPUT_CHANGED）就记下提示，并退回"正在读取"
    // 提示按会话记进 store，取到了就记，不看 alive：Host 那边取一次即删，途中切走也不能丢（第三轮复核 P3-3）
    // 取提示出错（Host 方法抛错、返回不合形状）不挡读取：两处调用都是取完再读（第四轮复核 N1、N2）
    const notice = async (): Promise<string | null | undefined> => {
      try {
        const r = await call<{ code: string | null; task_id?: string | null }>('turnNotice', { session_id: sid })
        if (r.ok && r.value?.code === 'INPUT_CHANGED') { markInputChanged(sid); if (alive) setLoadedFor(null) }
        if (r.ok && r.value?.code === 'CASE_MOVED') showNotice(CASE_MOVED_TITLE, CASE_MOVED_TEXT)
        if (r.ok && r.value?.code === 'CASE_NOT_FOUND') showNotice(CASE_MOVED_TITLE, CASE_NOT_FOUND_TEXT)
        if (r.ok && r.value?.code === TASK_SHEET_FAILED) showNotice(CASE_MOVED_TITLE, SHEET_FAILED_SEND_TEXT)
        if (r.ok && r.value?.code === TASK_END_FAILED) showNotice(TASK_END_FAILED_TITLE, TASK_END_FAILED_TEXT)
        if (r.ok && r.value?.code === EXTERNAL_ROUTE_UNAVAILABLE) showNotice(EXTERNAL_ROUTE_UNAVAILABLE_TITLE, EXTERNAL_ROUTE_UNAVAILABLE_TEXT)
        if (r.ok && r.value?.code === REQUEST_SCOPE_UNAVAILABLE) showNotice(REQUEST_SCOPE_UNAVAILABLE_TITLE, REQUEST_SCOPE_UNAVAILABLE_TEXT)
        if (r.ok && r.value?.code === SKILL_QUESTIONS_UNAVAILABLE) showNotice(SKILL_QUESTIONS_UNAVAILABLE_TITLE, SKILL_QUESTIONS_UNAVAILABLE_TEXT)
        // 到达用量上限：对话区（输入区上方）显示提示和刚存的草稿（T14 派修 2）
        if (r.ok && r.value?.code === BUDGET_STOPPED && typeof r.value.task_id === 'string') showTaskAnswer(sid, r.value.task_id)
        // 熔断第①道：同一块位置显示一句提示和存下的草稿（注记 2026-10-14 19:01）
        if (r.ok && r.value?.code === REPETITION_STOPPED && typeof r.value.task_id === 'string') showTaskAnswer(sid, r.value.task_id, 'repetition')
        return r.ok ? r.value?.code ?? null : undefined
      } catch { return undefined /* 当没有提示（也不据此清选择） */ }
    }
    // 这个会话有一轮结束了、任务确实跑过：服务此刻的选择还是那一轮开始时的那一份，就写回自由对话（见文件顶部的说明）。
    // 排在读写队列里：先读服务此刻的选择来比，再写；随后的 load() 读到的就是清过的。律师有还没写成的改动时不动。
    const clearAfterTurn = async (code: string | null | undefined): Promise<void> => {
      const started = endedTurns.get(sid)
      if (started === undefined) return
      endedTurns.delete(sid)
      if (code === undefined || !clearsSelection(code)) return
      const local = app.get().selections[sid]
      if (local && !local.saved) return
      const now = await sync.current()
      if (!now.ok) return
      const server = fromServer(now.value.selection)
      if (isFree(server) || choiceKey(server) !== started) return
      const again = app.get().selections[sid]
      if (again && !again.saved) return
      // 参数回到全局默认（契约要求任务单必须带参数）
      await sync.save({ capsuleId: null, skill: null, inputs: [], params: app.get().defaults ?? { thinking: '中', window: '128K', max_tokens: 16384 }, route: server.route })
    }
    setError(null)
    // 挂上、换会话时也取一次：被拦下的那一轮结束时律师可能正看着别的会话（返修 P3-C ②）。
    // 与一轮结束时一样先取提示再读：并行时提示晚到会把已读完的 loadedFor 清掉，状态行卡在"正在读取"（第三轮复核 P3-1）
    void notice().then(clearAfterTurn).then(() => { if (alive) load() })
    // 一轮结束：先取提示再重读
    const onTurn = (e: Event) => { if ((e as CustomEvent<string>).detail === sid) void notice().then(clearAfterTurn).then(() => { if (alive) load() }) }
    const onConnectionReset = () => load()
    window.addEventListener(TURN_ENDED, onTurn)
    window.addEventListener(DOCK_CONNECTION_RESET, onConnectionReset)
    return () => {
      alive = false
      window.removeEventListener(TURN_ENDED, onTurn)
      window.removeEventListener(DOCK_CONNECTION_RESET, onConnectionReset)
    }
  }, [sync, sessionId, reload]) // eslint-disable-line react-hooks/exhaustive-deps

  // 换会话或卸载时，到此为止的读回、外部确认与待写都作废；不开旧会话的发送门。
  useEffect(() => {
    const token = lifecycle.current
    return () => {
      token.live = false
      routeOp.current += 1
    }
  }, [sessionId])

  // 首页、成果区留给本案件的待带入意向：本会话读回之后取走一次，当作律师在这里改的
  useEffect(() => {
    if (loadedFor !== sessionId || !intent) return
    const patch = takeIntent(caseRef.case_id)
    if (patch) setSelection(sessionId, patch)
  }, [loadedFor, sessionId, intent, caseRef.case_id])

  // 律师改动了（saved 为 false）：防抖后写给服务；写成功且途中没再改才记为已保存；写失败显示错误、保留下拉框的值。
  // 依赖整份 stored：律师再选一次、或点"重试"（setSelection 生成新的一份）都会重新写；依赖 key 见下。
  // 写哪个会话在发起时定下：写完时已换到别的会话的，结果只记到原会话，不动此刻显示的（T13 返修 P2-2）
  // 已保存、但此刻显示的不是服务那份（Skill 列表比写成还晚回来，参数框改显示 Skill 预设）也要重写（第三轮复核 P2-1）；
  // serverKey 为 null（刚换会话还没读到、或写失败）时不据此重写
  useEffect(() => {
    if (!stored || (stored.saved && (serverKey.current === null || key === serverKey.current))) return
    const sid = sessionId
    const generation = nextSelectionWrite(sid)
    const lifecycleForWrite = lifecycle.current
    clearInputChanged(sid)
    // 服务那份的输入快照过期了（INPUT_CHANGED 之后）：选回同一份也要真写，服务才会重算快照（返修 P3-B）
    // 已在途的旧写可能把服务改成别的路由；此时同 key 也不能免写，最新选择要排在它后面补偿。
    if (key === serverKey.current && !app.get().staleServer[sid] && !hasSelectionWriteInFlight(sid)) {
      beginSelectionWrite(sid)
      const here = lifecycleForWrite.live && shownSession.current === sid
      void setSheetHold(sid, generation, false, key).then((result) => {
        const sameSelection = (cur: Selection | undefined): boolean =>
          cur !== undefined && selectionKey({ capsuleId: cur.capsuleId, skill: cur.skill, inputs: cur.inputs, params: cur.params ?? params, route: cur.route ?? 'local' }) === key
        if (!isSelectionWrite(sid, generation)
          || result?.ok !== true
          || result.value.held !== false) {
          if (isSelectionWrite(sid, generation) && lifecycleForWrite.live) {
            setError({
              sessionId: sid,
              key,
              op: 'write',
              error: { code: result?.ok === false ? result.error.code : 'SHEET_HOLD_FAILED', message: SHEET_FAILED_TEXT },
            })
          }
          return
        }
        if (!sameSelection(app.get().selections[sid])) return
        const pending = selectionReleaseNeeded.get(sid)
        if (pending?.generation === generation && pending.key === key) selectionReleaseNeeded.delete(sid)
        markSelectionSaved(sid, sameSelection)
        if (here) setError(null)
        composerBlocks?.clear(sid, SAVING_ROUTE_TEXT)
      }).finally(() => { endSelectionWrite(sid) })
      return
    }
    // 防抖从律师改选这一刻起就拒发；Host 门跨切换/卸载保留，直到这一代准确写成。
    void setSheetHold(sid, generation, true)
    const writing = ui
    const writingKey = key
    const stillThisWrite = () => isSelectionWrite(sid, generation) && lifecycleForWrite.live && shownSession.current === sid
    const write = async (): Promise<void> => {
      if (!stillThisWrite()) return
      if (writing.route === 'external') {
        const credentials = currentCredentialsApi()
        let ready = false
        try { ready = await externalSelectionReady((await lb().getSettings()) as unknown as ExternalSettings, credentials) } catch { ready = false }
        // describe/设置可能在切会话、卸载、改选或凭据 API 换代之后才回来：那一代一律不写。
        if (!stillThisWrite()) return
        if (currentCredentialsApi() !== credentials) {
          setError({ sessionId: sid, key: writingKey, op: 'write', error: { code: 'EXTERNAL_CREDENTIALS_RESET', message: EXTERNAL_CREDENTIALS_RESET_TEXT } })
          return
        }
        if (!ready) {
          serverKey.current = null
          setError({ sessionId: sid, key: writingKey, op: 'write', error: { code: 'EXTERNAL_NOT_READY', message: EXTERNAL_NOT_READY_TEXT } })
          return
        }
      }
      beginSelectionWrite(sid)
      void sync.save(writing).then(async (r) => {
        const current = isSelectionWrite(sid, generation)
        if (!current) return
        const here = lifecycleForWrite.live && shownSession.current === sid
        if (r.ok) {
          if (here) serverKey.current = writingKey
          if (!await releaseSelectionHold(sid, generation, writingKey)) {
            if (isSelectionWrite(sid, generation) && lifecycleForWrite.live) {
              setError({
                sessionId: sid,
                key: writingKey,
                op: 'write',
                error: { code: 'SHEET_HOLD_FAILED', message: SHEET_FAILED_TEXT },
              })
            }
            return
          }
          // 写成了，服务那份的输入快照已是新的：提示一并清（被拦那一轮前后刚改过选择时，否则红字误报到下次改动，第三轮复核 P3-2）
          clearStaleServer(sid)
          clearInputChanged(sid)
          markSelectionSaved(sid, (cur) => selectionKey({ capsuleId: cur.capsuleId, skill: cur.skill, inputs: cur.inputs, params: cur.params ?? writing.params, route: cur.route ?? 'local' }) === writingKey)
          if (here) setError((e) => (e?.sessionId === sid && e.key === writingKey ? null : e))
          composerBlocks?.clear(sid, SAVING_ROUTE_TEXT)
        } else if (here) {
          serverKey.current = null
          setError({ sessionId: sid, key: writingKey, op: 'write', error: { code: r.error.code, message: SHEET_FAILED_TEXT } })
        }
      }).finally(() => { endSelectionWrite(sid) })
    }
    // 不在 cleanup 取消排程：切会话/卸载时这一代已由上面的守卫作废；仍在原会话的改选由新代次接管。
    setTimeout(() => { void write() }, WRITE_DELAY_MS)
    // 依赖带上 key（N48，复核 P2-A）：刚挂上时 Skill 列表还没回来，参数取的是全局默认；列表回来后参数框改显示 Skill 预设，
    // 这里要重新计时，写出去的才是此刻显示的那份（写失败时错误也按这份记，状态行才有"重试"）
  }, [stored, sync, key]) // eslint-disable-line react-hooks/exhaustive-deps

  // 保存选择期间用 DSH 真实 composer block 停发送。按会话和写代次清理：
  // 旧 effect 晚回时不能放开新一轮保存，也不清掉别的插件设置的 block。
  useEffect(() => {
    if (!stored || stored.saved || !composerBlocks) return
    composerBlocks.set(sessionId, SAVING_ROUTE_TEXT)
  }, [stored?.saved, sessionId, composerBlocks])

  // 读错误总显示（T13 返修 P3-1）；写错误只在失败的就是此刻显示的这份时显示
  const shownError = error && error.sessionId === sessionId && (error.op === 'read' || error.key === key) ? error.error : null
  const reading = loadedFor !== sessionId && (!stored || stored.saved)
  const status = inputChanged && !shownError && (!stored || stored.saved)
    ? { kind: 'notice' as const, text: INPUT_CHANGED_TEXT }
    : statusOf(stored && !reading ? ui : undefined, sel.saved, shownError, label)
  const statusColor = status.kind === 'error' || status.kind === 'notice' ? C.err : status.kind === 'ready' ? C.ok : C.sub

  const pickCapsule = (id: string) => {
    const c = capsules.find((x) => x.id === id)
    setSelection(sessionId, { capsuleId: c?.id ?? null, skill: c?.skills[0] ?? null, params: null })
  }
  const chooseRoute = async (route: TaskRoute) => {
    if (route === ui.route) return
    const sid = sessionId
    const op = ++routeOp.current
    const from = ui.route
    if (route === 'local') { setSelection(sid, { route }); return }
    const credentials = currentCredentialsApi()
    let ready = false
    try { ready = await externalSelectionReady((await lb().getSettings()) as unknown as ExternalSettings, credentials) } catch { ready = false }
    const currentRoute = app.get().selections[sid]?.route ?? 'local'
    if (op !== routeOp.current || shownSession.current !== sid || currentCredentialsApi() !== credentials || currentRoute !== from) return
    if (!ready) {
      showNotice('不能切换到外部模型', EXTERNAL_NOT_READY_TEXT)
      return
    }
    let confirmed = false
    try { confirmed = await confirm(EXTERNAL_CONFIRM_TITLE, EXTERNAL_CONFIRM_TEXT, '切换到外部模型') } catch { confirmed = false }
    const routeAfterConfirm = app.get().selections[sid]?.route ?? 'local'
    if (!confirmed || op !== routeOp.current || shownSession.current !== sid || currentCredentialsApi() !== credentials || routeAfterConfirm !== from) return
    setSelection(sid, { route })
  }
  const setParam = <K extends keyof Params>(k: K, v: Params[K]) => setSelection(sessionId, { params: { ...params, [k]: v } })
  /** 点第二层：Skill 胶囊写进任务单（同下拉框时的写法）；工具胶囊打开 T26 的页面。 */
  const openItem = async (item: Capsule) => {
    if (item.kind === 'tool') {
      if (item.tool === 'invoice') { homeView.set('invoice'); getNav().goHome() } else void openRetainer(caseRef)
      return
    }
    // 案件 wiki 是流水线，不由对话 Agent 执行：显式点胶囊后打开原入口，由原确认框触发 pipelineRun。
    if (item.skills.length === 1 && item.skills[0] === WIKI_SKILL) {
      setWikiOpen(true)
      setRowsOpen(false)
      return
    }
    // 令 2043 第 4 条：写任务单之前按材料篇幅估一次，读不全先问（可"仍然开始"）
    if (item.id !== sel.capsuleId && !await confirmScope(caseRef)) return
    pickCapsule(item.id)
    setRowsOpen(false)
  }

  return (
    <div data-lawbench-dock="" data-capsule={sel.capsuleId ?? ''} style={{ fontSize: 14, color: C.text, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {hero && caps?.hint ? <div style={{ fontSize: 13, color: C.faint, lineHeight: 1.6 }}>{caps.hint}</div> : null}
      {showItems && group ? (
        <div role="toolbar" aria-label="选要做什么" style={{ ...S.row, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: C.sub, minWidth: 76 }}>{group.name} · 选要做什么</span>
          {group.items.map((item) => (
            <button key={item.id} type="button" data-capsule-id={item.id} aria-pressed={item.id === sel.capsuleId} title={item.kind === 'tool' ? `内置工具：${TOOL_WORD[item.tool]}` : undefined}
              onClick={() => void openItem(item)} style={pill(item.id === sel.capsuleId, true)}>{item.name}</button>
          ))}
          {group.items.length === 0 ? <span style={{ fontSize: 12, color: C.faint }}>这一类的胶囊都隐藏了，可在设置里"管理胶囊"显示。</span> : null}
        </div>
      ) : null}
      {showRows && groups.length ? (
        <div role="tablist" aria-label="能力入口" style={{ ...S.row, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: C.sub, minWidth: 76 }}>能力入口</span>
          {groups.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={g.id === group?.id}
              aria-expanded={g.id === group?.id && itemsOpen}
              onClick={() => {
                if (g.id === group?.id) setItemsOpen(!itemsOpen)
                else { setGroupId(g.id); setItemsOpen(true) }
              }} style={pill(g.id === group?.id, false)}>{g.name} ▾</button>
          ))}
        </div>
      ) : null}
      <MaterialBatchBar sessionId={sessionId} caseId={caseRef.case_id} />
      <div style={{ ...S.row, flexWrap: 'wrap', border: `1px solid ${C.border}`, borderRadius: C.rMd, padding: '4px 10px' }}>
        <span data-route-label={ui.route} style={{ ...S.row, gap: 4, color: ui.route === 'external' ? C.warn : C.ok, fontWeight: 600 }}>
          {running ? '本轮已开始（按启动时任务快照，本轮真实模型不按下一次选择猜测）' : `下一条消息：${ui.route === 'external' ? '外部公开模型' : '本地模型'}`}
        </span>
        <Button size="sm" variant={ui.route === 'local' ? 'outline' : 'ghost'} aria-pressed={ui.route === 'local'} onClick={() => void chooseRoute('local')}>本地</Button>
        <Button size="sm" variant={ui.route === 'external' ? 'outline' : 'ghost'} aria-pressed={ui.route === 'external'} onClick={() => void chooseRoute('external')}>外部</Button>
        {capsule ? (
          <span data-capsule-tag="" style={{ ...S.row, gap: 4, border: `1px solid ${C.brand}`, color: C.brand, borderRadius: C.rMd, padding: '0 6px' }}>
            【{capsule.name}】
            <button type="button" aria-label="取消这项能力" onClick={() => pickCapsule('')} style={{ background: 'none', border: 'none', color: C.brand, cursor: 'pointer', padding: 0 }}>×</button>
          </span>
        ) : null}
        {capsule ? (
          <label style={S.row}>Skill
            <select style={S.input} value={sel.skill ?? ''} onChange={(e) => setSelection(sessionId, { skill: e.target.value || null, params: null })} aria-label="Skill">
              {choices.map((n) => <option key={n} value={n}>{agentSkills.find((s) => s.name === n)?.title ?? n}</option>)}
            </select>
          </label>
        ) : null}
        {!hero ? <Button size="sm" variant="ghost" aria-expanded={rowsOpen}
          onClick={() => {
            const next = !rowsOpen
            setRowsOpen(next)
            if (next) setItemsOpen(true)
          }}>{rowsOpen ? '收起能力' : '选能力'}</Button> : null}
        <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起参数' : '参数'}</Button>
        {sel.inputs.map((path) => (
          <span key={path} style={{ ...S.row, gap: 4, border: `1px solid ${C.border}`, borderRadius: 999, padding: '0 6px', fontSize: 12 }}>
            选用：{path.split('/').pop()}
            <button type="button" aria-label="不再选用" onClick={() => setSelection(sessionId, { inputs: sel.inputs.filter((x) => x !== path) })}
              style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', padding: 0 }}>×</button>
          </span>
        ))}
        <span role="status" style={{ fontSize: 13, color: statusColor }}>{statusText(status)}</span>
        {status.kind === 'error' ? <Button size="sm" variant="ghost" onClick={() => (error?.op === 'write' ? setSelection(sessionId, {}) : setReload((n) => n + 1))}>重试</Button> : null}
      </div>
      {ui.route === 'external' ? <div role="note" data-public-model-hint="" style={{ fontSize: 12, color: C.warn }}>{EXTERNAL_HINT_TEXT}</div> : null}
      {open ? (
        <div style={{ ...S.row, flexWrap: 'wrap' }}>
          <label style={S.row}>思考
            <select style={S.input} value={params.thinking} onChange={(e) => setParam('thinking', e.target.value as Params['thinking'])}>{THINKING.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label style={S.row}>窗口
            <select style={S.input} value={params.window} onChange={(e) => setParam('window', e.target.value as Params['window'])}>{WINDOWS.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label style={S.row}>最长输出
            <input type="number" min={256} max={262144} step={1024} style={{ ...S.input, width: 100 }} value={params.max_tokens}
              onChange={(e) => { const n = Number(e.target.value); if (n >= 256 && n <= 262144) setParam('max_tokens', n) }} />
          </label>
          <Button size="sm" variant="ghost" onClick={() => setSelection(sessionId, { params: null })}>恢复默认</Button>
        </div>
      ) : null}
      {skill && skill.questions.length ? (
        <details>
          <summary style={{ cursor: 'pointer', color: C.sub, fontSize: 13 }}>开始前会先问你 {skill.questions.length} 个问题（必问问题）</summary>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12, color: C.sub }}>
            {skill.questions.map((q) => <li key={q.key}>{q.question}{q.fromMaterials ? <> <Badge tone="faint">能从材料里找的会先填好请你确认</Badge></> : null}</li>)}
          </ul>
        </details>
      ) : null}
      {wikiOpen ? (
        <WikiEntryDialog caseRef={caseRef} onClose={() => setWikiOpen(false)}
          resolveParams={async () => skillParams(WIKI_SKILL, await loadSkills(), app.get().presets, app.get().defaults) ?? FALLBACK_PARAMS} />
      ) : null}
    </div>
  )
}
