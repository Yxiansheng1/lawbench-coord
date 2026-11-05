// 单个任务（律师发起的一次请求）的计数、预算和进度文本（Spec 9.2；T7 执行令 Q9、Q10 裁决）。
// 纯逻辑，不依赖 DSH，便于测试。
import { createHash } from 'node:crypto'

export interface Budget { model_calls: number; tool_calls: number; minutes: number }
export interface Params { thinking: '关闭' | '低' | '中' | '高'; window: '32K' | '64K' | '128K'; max_tokens: number; temperature?: number }
export type TaskRoute = 'local' | 'external'
export interface ExternalRouteConfig { model: string; contextWindow: number }

/** 不计入工具预算、也不受其限制的工具（Spec 9.2）。 */
export const BUDGET_EXEMPT_TOOL = 'case_save_draft'
/** 放行但不计数的非 case_* 工具（Q10：只数 case_*）。 */
/** 向律师提必问问题的 DSH 工具：等回答的时间不计入时长。 */
export const ASK_USER_TOOL = 'ask_user_question'
export const ALLOWED_OTHER_TOOLS: ReadonlySet<string> = new Set(['skill', 'ask_user_question'])

export const WRAP_UP_TEXT = '【立即收尾】本次任务的调用次数或时长即将用完。请停止新的查找，立即用 case_save_draft 保存已有成果。'
/**
 * 模型调用还剩两次时的提醒（令 0321，用户 2026-10-11 定；真机"刑期计算"16/16 用完没存草稿）：
 * 原来只在最后一次调用前提醒，模型拿最后一次去读材料就什么都没留下。提前一次，并说清两次各做什么。
 */
export const WRAP_UP_TWO_LEFT = `${WRAP_UP_TEXT}你只剩两次机会：先调用 case_save_draft 把已有内容存为草稿，再用最后一次写回答。`
/** 到顶时没有草稿，由 Agent 插件代存的那份草稿的标题（"（未完成）"结尾，界面据此在提示里放草稿卡片）。 */
export const UNFINISHED_SUFFIX = '（未完成）'
export const UNFINISHED_TITLE = `本次回答${UNFINISHED_SUFFIX}`

/** 加载技能的 DSH 工具。 */
export const SKILL_TOOL = 'skill'
/**
 * 防"加载技能 → 压缩 → 又加载"的循环（令 0329 P0）：同一个任务里同一个技能最多加载这么多次（压缩把它摘要掉后允许再加载，但不能没完没了）；
 * 两次压缩之间没有新的案件工具调用（没读新东西、没存稿——真循环的特征）的压缩连续到这么多次就收尾（存稿、结束）；
 * 有进展的压缩不计，正常的长任务压缩多少次都不受影响（复核 rv-A62 P2-3）。
 */
export const MAX_SKILL_LOADS = 3
export const MAX_COMPACTIONS = 3
/**
 * 同一个任务里同一个案件工具带同样的参数（规范化后）调到第这么多次就拒绝（律师反馈 F1，注记 2026-10-14 19:01 第 2 条）：
 * 结果不会变，让模型改做法或作答。存草稿除外（改稿时同样的标题再存一版是正常的）。
 */
export const MAX_SAME_CALLS = 3

/** 熔断命中的种类：思考 / 回复重复（中止本次调用）、同工具同参数、同一技能反复加载（拒绝该工具）。 */
export type LoopKind = 'repetition' | 'repeated_call' | 'skill_reload'

/** 参数规范化：对象按键名排序（嵌套的也排），其余照 JSON。 */
export function canonicalArgs(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalArgs).join(',')}]`
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonicalArgs(o[k])}`).join(',')}}`
  }
  return JSON.stringify(v ?? null)
}

export type ToolDecision = { allow: true } | { allow: false; reason: string }
export type StepDecision = { kind: 'continue'; wrapUp: boolean } | { kind: 'reject'; reason: string }

export class TaskState {
  modelCalls = 0
  toolCalls = 0
  /** Q10：碰到过任一上限，结束原因一律报 budget。 */
  budgetHit = false
  private readonly texts: string[] = []
  /** 计时起点；等律师回答必问问题的时间从这里补上（往后挪），不计入时长（PRD F-RUN-05、Spec 9.2）。 */
  private startedAt: number
  /** 正在等律师回答必问问题时，开始等的时刻。 */
  private pausedAt: number | undefined
  private wrapUpSent = false
  private twoLeftSent = false
  /** 这次要注入的提醒（beforeModelCall 返回 wrapUp 为 true 时有效）。 */
  wrapUpNotice: string = WRAP_UP_TEXT
  /** 这个任务存过草稿没有（模型自己存的，或到顶时代存的）。 */
  draftSaved = false
  /** 各技能在这个任务里加载过几次。 */
  private readonly skillLoads = new Map<string, number>()
  /** 这个任务里上下文被压缩（摘要）过几次（只作日志）。 */
  compactions = 0
  /** 连续几次压缩之间没有进展。 */
  stalledCompactions = 0
  /** 上一次压缩之后有没有放行过案件工具。 */
  private progressed = false
  /** 各（工具, 参数哈希）在这个任务里放行过几次。只存哈希，不存参数。 */
  private readonly sameCalls = new Map<string, number>()
  /** 这个任务碰到过的熔断（最先碰到的那一种）；一轮结束时据此存稿、提示（注记 19:01）。 */
  loopHit: LoopKind | undefined

  constructor(
    readonly taskId: string,
    readonly budget: Budget,
    readonly params: Params,
    now: number = Date.now(),
    readonly route: TaskRoute = 'local',
    readonly external?: ExternalRouteConfig,
    /** begin 时固定的外部模型工具能力；本地路由不受此项影响。 */
    readonly supportsTools: boolean = true,
  ) { this.startedAt = now }

  /** 本轮模型是否可见、可执行工具；外部配置只在 begin 时快照一次。 */
  get modelToolsAllowed(): boolean {
    return this.route === 'local' || this.supportsTools
  }

  /** 本轮固定的真实 provider/model；外部配置只在 begin 时快照一次。 */
  get routeTarget(): { provider: 'lawfirm' | 'external'; model: string } {
    return this.route === 'external'
      ? { provider: 'external', model: this.external?.model ?? '' }
      : { provider: 'lawfirm', model: 'qwen38-27b' }
  }

  elapsedSeconds(now: number = Date.now()): number {
    return Math.max(0, Math.floor((this.counted(now) - this.startedAt) / 1000))
  }

  /** 计时到的时刻：暂停中就停在开始等的那一刻。 */
  private counted(now: number): number { return this.pausedAt ?? now }

  /** 模型调了 ask_user_question、开始等律师回答（令 1117 注记 11:28）：暂停计时。 */
  pause(now: number = Date.now()): void { this.pausedAt ??= now }

  /** 拿到回答、模型接着往下走：恢复计时，等的这段不算。 */
  resume(now: number = Date.now()): void {
    if (this.pausedAt === undefined) return
    this.startedAt += Math.max(0, now - this.pausedAt)
    this.pausedAt = undefined
  }

  /**
   * 每步模型调用前（agent/pre-step）：超限拒绝；要求注入"立即收尾"（各只注一次）——
   * 模型调用还剩两次时（令 0321：比原来提前一次，说清"先存草稿、再用最后一次作答"），或时长只剩 5 分钟时。
   * 预算只有一次调用时没有"还剩两次"，就在这唯一一次前提醒。通过时计一次模型调用。
   */
  beforeModelCall(now: number = Date.now()): StepDecision {
    // 下一次模型调用要等工具结果都回来：此时律师已经答完
    this.resume(now)
    const overTime = now - this.startedAt >= this.budget.minutes * 60_000
    if (this.modelCalls >= this.budget.model_calls || overTime) {
      this.budgetHit = true
      return { kind: 'reject', reason: overTime ? 'time' : 'model_calls' }
    }
    this.modelCalls += 1
    const twoLeft = !this.twoLeftSent && this.modelCalls >= this.budget.model_calls - 1
    const nearTime = !this.wrapUpSent && now - this.startedAt >= (this.budget.minutes - 5) * 60_000
    if (twoLeft) {
      this.twoLeftSent = true
      this.wrapUpSent = true // 次数的提醒已经说了收尾，时长的那句不再重复
      this.wrapUpNotice = this.modelCalls === this.budget.model_calls - 1 ? WRAP_UP_TWO_LEFT : WRAP_UP_TEXT
      return { kind: 'continue', wrapUp: true }
    }
    if (nearTime) {
      this.wrapUpSent = true
      this.wrapUpNotice = WRAP_UP_TEXT
      return { kind: 'continue', wrapUp: true }
    }
    return { kind: 'continue', wrapUp: false }
  }

  /**
   * 模型要加载技能：同一个技能加载到上限后拒绝（不计数）。
   * @param skill - 技能名；读不到名字的按同一个算。
   */
  beforeSkillLoad(skill: string): ToolDecision {
    const n = this.skillLoads.get(skill) ?? 0
    if (n >= MAX_SKILL_LOADS) { this.loopHit ??= 'skill_reload'; return { allow: false, reason: 'skill_reload' } }
    this.skillLoads.set(skill, n + 1)
    return { allow: true }
  }

  /**
   * 案件工具带这组参数在这个任务里已经调过几次（不含这一次）；到 MAX_SAME_CALLS - 1 次时这一次拒绝（不计数，回 repeated_call）。
   * case_save_draft 不管；参数取不到的按 {} 算。
   */
  beforeSameCall(name: string, args: unknown): ToolDecision {
    if (name === BUDGET_EXEMPT_TOOL || !/^case_[a-z_]+$/.test(name)) return { allow: true }
    const key = `${name}:${createHash('sha256').update(canonicalArgs(args ?? {})).digest('hex')}`
    const n = this.sameCalls.get(key) ?? 0
    if (n >= MAX_SAME_CALLS - 1) { this.loopHit ??= 'repeated_call'; return { allow: false, reason: 'repeated_call' } }
    this.sameCalls.set(key, n + 1)
    return { allow: true }
  }

  /** 这次模型调用里思考或回复原样重复，被中止了（agent/index.ts 的 llm/stream）。 */
  noteRepetition(): void { this.loopHit ??= 'repetition' }

  /**
   * 上下文被压缩了一次（会话事件 compaction/summary）。上一次压缩之后放行过案件工具的算有进展，连续计数清零；否则加一。
   * @returns 没有进展的压缩是不是已经连续到了上限。
   */
  noteCompaction(): boolean {
    this.compactions += 1
    this.stalledCompactions = this.progressed ? 0 : this.stalledCompactions + 1
    this.progressed = false
    return this.compactionLoop
  }

  /** 没有进展的压缩连续到了上限：下一步收尾（存稿、结束任务）。 */
  get compactionLoop(): boolean { return this.stalledCompactions >= MAX_COMPACTIONS }

  /** 现在是不是最后一次模型调用之后（它发起的工具只许存草稿，令 0321）。 */
  get lastCall(): boolean { return this.modelCalls >= this.budget.model_calls }

  /** 到顶时可以代存的文字：这个任务最后一条有正文的回复；没有为 undefined。 */
  lastReply(): string | undefined { return this.texts.at(-1) }

  /**
   * 工具执行前（tools/pre-execute）：白名单 + 工具预算。
   * Q10：只数 case_*（case_save_draft 除外）；被拒绝的不计数。
   * 令 0321：最后一次模型调用发起的工具里，case_* 只放行 case_save_draft（提问等非 case 工具照常），别的回 wrap_up_only——只能存稿或作答。
   * 注记 19:01：预算、收尾都放行之后，同一工具同样参数的第三次回 repeated_call（args 为这次调用的参数）。
   */
  beforeTool(name: string, now: number = Date.now(), args?: unknown): ToolDecision {
    if (name === ASK_USER_TOOL) this.pause(now)
    if (ALLOWED_OTHER_TOOLS.has(name)) return { allow: true }
    if (!/^case_[a-z_]+$/.test(name)) return { allow: false, reason: 'not_allowed' }
    if (name === BUDGET_EXEMPT_TOOL) { this.progressed = true; return { allow: true } }
    if (this.lastCall) return { allow: false, reason: 'wrap_up_only' }
    if (this.toolCalls >= this.budget.tool_calls) {
      this.budgetHit = true
      return { allow: false, reason: 'tool_budget' }
    }
    // 同一工具同样参数第三次（注记 19:01 第 2 条）：放在预算、收尾检查之后——被那两道拒掉的调用不计次数（复核 rv-A64 P3-1）；
    // 这里拒掉的不计入工具预算、不算进展
    const same = this.beforeSameCall(name, args)
    if (!same.allow) return same
    this.toolCalls += 1
    this.progressed = true
    return { allow: true }
  }

  /**
   * 收到一条模型回复（session/event assistant/message）。
   * Q9：返回本任务到目前为止所有回复文本的拼接；这条回复没有正文时返回 undefined（不传）。
   */
  addReply(text: string): string | undefined {
    if (!text.trim()) return undefined
    this.texts.push(text)
    return this.texts.join('\n\n')
  }

  /** turn/end 的 reason.kind → /core/task/end 的 reason（Q10：碰到过上限报 budget）。 */
  endReason(kind: string): 'completed' | 'aborted' | 'blocked' | 'error' | 'max-tokens' | 'interrupted' | 'budget' {
    if (this.budgetHit) return 'budget'
    const known = ['completed', 'aborted', 'blocked', 'error', 'max-tokens', 'interrupted'] as const
    return (known as readonly string[]).includes(kind) ? (kind as (typeof known)[number]) : 'error'
  }
}

/** 界面思考档 → DSH reasoningEffort（路由里"高"再映射成 xhigh 发给 6000D）。 */
export function reasoningEffort(thinking: Params['thinking']): 'off' | 'low' | 'medium' | 'high' {
  return ({ 关闭: 'off', 低: 'low', 中: 'medium', 高: 'high' } as const)[thinking]
}
