// 单个任务（律师发起的一次请求）的计数、预算和进度文本（Spec 9.2；T7 执行令 Q9、Q10 裁决）。
// 纯逻辑，不依赖 DSH，便于测试。
import { createHash } from 'node:crypto'

export interface Budget { model_calls: number; tool_calls: number; minutes: number }
export interface Params { thinking: '关闭' | '低' | '中' | '高'; window: '32K' | '64K' | '128K'; max_tokens: number; temperature?: number }
export type TaskRoute = 'local' | 'external'
export interface ExternalRouteConfig { model: string; contextWindow: number }

/** 一次真实成功保存所返回覆盖清单的有限快照；数组按类别限长，omitted 记录未展开数量。 */
export interface DeliveryCoverageSnapshot {
  readonly total: number
  readonly fully_read: readonly string[]
  readonly partially_read: ReadonlyArray<{
    readonly name: string
    readonly read_units: number
    readonly total_units: number
  }>
  readonly not_read: readonly string[]
  readonly unreadable: ReadonlyArray<{ readonly name: string; readonly reason: string }>
  readonly omitted: {
    readonly fully_read: number
    readonly partially_read: number
    readonly not_read: number
    readonly unreadable: number
  }
}

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
export type QuestionAskDecision =
  | { allow: true }
  | { allow: false; reason: 'invalid_question_ask' | 'question_already_pending' | 'missing_questions'; missingIds: string[] }

export interface QuestionExecutionIdentity {
  readonly callId: string
  readonly token: symbol
}

type PendingQuestionAsk = {
  readonly identity: QuestionExecutionIdentity
  readonly agentId: string
  readonly taskId: string
  readonly caseId: string
  readonly invitedIds: readonly string[]
}

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
  /** 本轮由 Skill 机器元数据固定的必问 ID；只对本轮任务有效。 */
  readonly requiredQuestionIds: readonly string[]
  /** 已从 ask_user_question 的最终冻结结果收下的真实非空答案 ID。 */
  private readonly answeredQuestionIds = new Set<string>()
  /** 当前唯一在途的提问调用；最终结果观察器只接受与它完全相同的 callId/token。 */
  private pendingQuestionAsk: PendingQuestionAsk | undefined
  /** 刑期计算或案卷归档任务是否已由本任务实际的 case_list_materials 成功结果确认过材料清单。 */
  private materialListConfirmed = false
  /** 合同审查任务里，最近一次成功保存带回了尚未提示的出处核对问题。 */
  private draftFeedbackPending = false
  /** 每个合同审查任务只提示一次；之后同题、换问题或存新版本都不再排队。 */
  private draftFeedbackSent = false
  /** 通用文书、诉讼文书和辩护词在真实保存成功后，是否还需在可见答复中逐项完成交付自检。 */
  private deliveryReviewPending = false
  private deliveryReviewSent = false
  private deliveryReviewCoverageSnapshot: DeliveryCoverageSnapshot | undefined
  /** 本任务是否已收到通过结果契约校验的 case_search 成功回复。 */
  private defenseSearchSucceeded = false

  constructor(
    readonly taskId: string,
    readonly budget: Budget,
    readonly params: Params,
    now: number = Date.now(),
    readonly route: TaskRoute = 'local',
    readonly external?: ExternalRouteConfig,
    /** begin 时固定的外部模型工具能力；本地路由不受此项影响。 */
    readonly supportsTools: boolean = true,
    /** begin 时固定的案件与会话身份，供迟到工具结果核对。 */
    readonly caseId: string = '',
    readonly sessionId: string = '',
    requiredQuestionIds: readonly string[] = [],
    /** begin 时按 Skill 固定；合同审查即使显式“无必问”也启用反馈回收。 */
    readonly draftFeedbackRecovery: boolean = false,
    /** begin 时按 Skill 固定；诉讼文书在必问项答齐前不得读取材料或 Wiki。 */
    readonly questionsBeforeMaterialRead: boolean = false,
    /** begin 时按 Skill 固定；刑期计算在读第一份材料前必须先取得本任务的成功材料清单。 */
    readonly sentenceWorkflow: boolean = false,
    /** begin 时按 Skill 固定；案卷归档在匹配前必须先取得本任务的成功材料清单。 */
    readonly archiveWorkflow: boolean = false,
    /** begin 时按 Skill 固定；三类起草任务在成功后排队一次交付自检提示。 */
    readonly deliveryReviewRecovery: boolean = false,
    /** begin 时按 Skill 固定；辩护意见主材料读取前必须先完成本任务的有效检索。 */
    readonly defenseSearchBeforePrimaryRead: boolean = false,
  ) {
    this.startedAt = now
    this.requiredQuestionIds = [...requiredQuestionIds]
  }

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

  /** 当前仍缺的必问 ID；给拒绝原因和测试直接用，不在日志里写问题正文。 */
  missingQuestionIds(): string[] {
    return this.requiredQuestionIds.filter((id) => !this.answeredQuestionIds.has(id))
  }

  /** 所有必问 ID 都从最终成功结果收到非空答案；无必问项的 Skill 恒为 true。 */
  get questionsAnswered(): boolean { return this.missingQuestionIds().length === 0 }

  /** 本任务是否已收到通过结果契约校验的 case_list_materials 成功回复。 */
  get materialListConfirmedForReads(): boolean { return this.materialListConfirmed }

  /** 只由 Agent 在 case_list_materials 成功且结果通过契约校验后调用。 */
  noteSuccessfulMaterialList(): void { this.materialListConfirmed = true }

  /** 本任务是否已收到通过结果契约校验的 case_search 成功回复。 */
  get defenseSearchCompletedForRead(): boolean { return this.defenseSearchSucceeded }

  /** 只由 Agent 在 case_search 成功且结果通过契约校验后调用。 */
  noteSuccessfulDefenseSearch(): void {
    if (this.defenseSearchBeforePrimaryRead) this.defenseSearchSucceeded = true
  }

  /**
   * tools/pre-execute 的提问校验。只认本轮 Skill 的声明 ID，要求本次问题覆盖全部尚缺项；
   * 空问题、重复 ID、未知 ID 都拒绝。通过后保存实际 callId/token，等待 tools/result。
   */
  captureQuestionAsk(agentId: string, identity: QuestionExecutionIdentity, args: unknown): QuestionAskDecision {
    const missingIds = this.missingQuestionIds()
    if (this.requiredQuestionIds.length === 0) return { allow: true }
    if (!agentId || (this.sessionId.length > 0 && agentId !== this.sessionId) || !identity.callId) {
      return { allow: false, reason: 'invalid_question_ask', missingIds }
    }
    if (this.pendingQuestionAsk) return { allow: false, reason: 'question_already_pending', missingIds }
    const request = args as { questions?: unknown } | null | undefined
    const questions = request?.questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return { allow: false, reason: 'invalid_question_ask', missingIds }
    }
    const declared = new Set(this.requiredQuestionIds)
    const invited: string[] = []
    const seen = new Set<string>()
    for (const value of questions) {
      const question = value as { id?: unknown; question?: unknown } | null
      if (!question || typeof question.id !== 'string' || !question.id || typeof question.question !== 'string' || !question.question.trim()) {
        return { allow: false, reason: 'invalid_question_ask', missingIds }
      }
      if (seen.has(question.id) || !declared.has(question.id)) {
        return { allow: false, reason: 'invalid_question_ask', missingIds }
      }
      seen.add(question.id)
      invited.push(question.id)
    }
    if (missingIds.some((id) => !seen.has(id))) {
      return { allow: false, reason: 'missing_questions', missingIds }
    }
    this.pendingQuestionAsk = {
      identity,
      agentId,
      taskId: this.taskId,
      caseId: this.caseId,
      invitedIds: [...invited],
    }
    return { allow: true }
  }

  /** 本调用被下游 pre-execute 拦下，没有真正执行：只清与它完全相同的 pending，允许模型重试。 */
  cancelPendingQuestionAsk(agentId: string, identity: QuestionExecutionIdentity): void {
    const pending = this.pendingQuestionAsk
    if (pending && pending.agentId === agentId && pending.identity.callId === identity.callId &&
      pending.identity.token === identity.token) this.pendingQuestionAsk = undefined
  }

  /**
   * tools/result 是 post-policy、取消和最终 materialize 之后的权威结果。
   * 只有同一任务的同一 callId/token、isError=false、实际回答了本次问到的声明 ID 且非空，才收下。
   * 结果结构异常时整份不收（fail closed），不按选项位置或问题正文猜答案。
   */
  acceptFinalQuestionAnswers(
    agentId: string,
    identity: QuestionExecutionIdentity,
    result: Readonly<{ isError: boolean; value?: unknown }>,
  ): boolean {
    const pending = this.pendingQuestionAsk
    if (!pending || pending.agentId !== agentId || (this.sessionId.length > 0 && agentId !== this.sessionId) ||
      pending.taskId !== this.taskId || pending.caseId !== this.caseId ||
      pending.identity.callId !== identity.callId || pending.identity.token !== identity.token) return false
    // 这一调用已经冻结出最终结果；无论成功、失败还是空答案，都不能再等同一调用的第二次结果。
    this.pendingQuestionAsk = undefined
    if (result.isError !== false) return false
    const value = result.value as { answers?: unknown } | null | undefined
    const answers = value?.answers
    if (!Array.isArray(answers)) return false
    const invited = new Set(pending.invitedIds)
    const seen = new Set<string>()
    const additions: string[] = []
    for (const value of answers) {
      const answer = value as { id?: unknown; selected?: unknown; custom?: unknown } | null
      if (!answer || typeof answer.id !== 'string' || seen.has(answer.id) || !invited.has(answer.id) ||
        !Array.isArray(answer.selected) || !answer.selected.every((item) => typeof item === 'string') ||
        (answer.custom !== undefined && typeof answer.custom !== 'string')) return false
      seen.add(answer.id)
      const selectedNonempty = answer.selected.some((item) => item.trim().length > 0)
      const customNonempty = typeof answer.custom === 'string' && answer.custom.trim().length > 0
      if (selectedNonempty || customNonempty) additions.push(answer.id)
    }
    for (const id of additions) this.answeredQuestionIds.add(id)
    return additions.length > 0
  }

  /** 写入成果前的统一谓词：本任务的 Skill 必问项是否都已真实回答。 */
  get deliverableWritesAllowed(): boolean { return this.questionsAnswered }

  /**
   * 记下一次成功保存的出处核对反馈。只有本任务启用了反馈回收才处理；
   * 干净结果会清掉尚未取走的旧提示，避免下一次模型请求看到已过期的提醒。
   */
  noteDraftFeedback(hasProblems: boolean): void {
    if (!this.draftFeedbackRecovery || this.draftFeedbackSent) return
    this.draftFeedbackPending = hasProblems
  }

  /** 在下一次模型请求已经放行后取走提示；每个任务至多返回一次。 */
  takeDraftFeedbackNotice(): boolean {
    if (!this.draftFeedbackPending || this.draftFeedbackSent) return false
    this.draftFeedbackPending = false
    this.draftFeedbackSent = true
    return true
  }

  /**
   * 只由 Agent 在 case_save_draft 实际成功且返回通过结果契约后调用。
   * 同任务的重复保存仍只保留一次待取提示，未取走前以最近一次成功保存的覆盖快照为准；失败保存不调用这里。
   */
  noteSuccessfulDraftForDeliveryReview(coverage?: DeliveryCoverageSnapshot): void {
    if (!this.deliveryReviewRecovery || this.deliveryReviewSent) return
    this.deliveryReviewPending = true
    this.deliveryReviewCoverageSnapshot = coverage
  }

  /** 等待随下一次模型请求注入的交付自检提示所对应的覆盖快照。 */
  get pendingDeliveryReviewCoverage(): DeliveryCoverageSnapshot | undefined {
    return this.deliveryReviewPending ? this.deliveryReviewCoverageSnapshot : undefined
  }

  /** 在下一次模型请求已经放行后取走交付自检提示；每个任务至多返回一次。 */
  takeDeliveryReviewNotice(): boolean {
    if (!this.deliveryReviewPending || this.deliveryReviewSent) return false
    this.deliveryReviewPending = false
    this.deliveryReviewSent = true
    this.deliveryReviewCoverageSnapshot = undefined
    return true
  }

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
