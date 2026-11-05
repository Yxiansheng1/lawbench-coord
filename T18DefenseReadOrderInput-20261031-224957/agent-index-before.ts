// Agent 插件 legal-agent（Spec 1.2、9.2、20.3、20.4；T7 步骤 2、执行令 Q5/Q6/Q9/Q10/Q11）。挂在 preset-lawbench 里。
import { randomUUID } from 'node:crypto'
import { TOOL_NAMES, toolDescription, toolId, toolParameters, validate } from '../shared/contracts.ts'
import { CoreClient, type Endpoint, type Logger } from '../shared/core-client.ts'
import { defaultAppData, makeLogger } from '../shared/file-log.ts'
import { EXTERNAL_ROUTE_UNAVAILABLE, REQUEST_SCOPE_UNAVAILABLE, SKILL_QUESTIONS_UNAVAILABLE } from '../shared/turn-notices.ts'
export { REQUEST_SCOPE_UNAVAILABLE, SKILL_QUESTIONS_UNAVAILABLE } from '../shared/turn-notices.ts'
import { RepetitionGuard } from './repetition.ts'
import { ALLOWED_OTHER_TOOLS, ASK_USER_TOOL, BUDGET_EXEMPT_TOOL, MAX_SAME_CALLS, SKILL_TOOL, TaskState, UNFINISHED_TITLE, reasoningEffort, type Budget, type DeliveryCoverageSnapshot, type Params, type QuestionExecutionIdentity, type TaskRoute } from './task-state.ts'

export const name = 'lawbench-agent'
export const inject = ['tools', 'lawbenchCore']

export interface Config {
  /** 开发模式按契约校验 /core/* 的请求和返回（T7 步骤 3）。默认开。 */
  validateContracts?: boolean
  /** 应用数据目录（日志写在其下 logs\）；不给时用 %LOCALAPPDATA%\lawbench。 */
  appData?: string
}

// ── DSH 运行时形状（只写用到的字段；来源见 dsh-patches\PATCHES.md 与交付说明）─────────────
type TextBlock = { type: 'text'; text: string }
type UserMessage = { id: string; role: 'user'; content: TextBlock[]; source: unknown }
type AgentLike = { id: string; session?: { header?: { cwd?: string } } }
type PreStepDecision = { kind: 'reject' } | { kind: 'enter'; messages: UserMessage[]; startsRequestSeries?: true }
type RequestScope = {
  request_id: string
  case_id: string
  kind: 'materials'
  materials: Array<{ material_id: string; sha256: string }>
}
type BeginValue = {
  task_id: string
  case_id: string
  skill: string | null
  params: Params
  budget: Budget
  route?: TaskRoute
  request_id?: string
  request_scope?: RequestScope | null
}
type SkillQuestion = { key: string; question: string; fromMaterials: boolean }
type ToolExecutionIdentityLike = {
  callId?: unknown
  token?: unknown
  name: string
  arguments?: unknown
  agent?: { id?: unknown }
}
type ToolExecutionResultLike = { isError: boolean; value?: unknown }
type LlmCallConfig = {
  provider: string
  model: string
  reasoningEffort?: string
  temperature?: number
  maxTokens?: number
  stop?: string[]
  /** Preparation-only capacity fixed by this turn's begin snapshot. */
  contextWindowOverride?: number
}
type PreToolDecision =
  | { kind: 'allow' }
  | { kind: 'deny'; reason: string }
  | { kind: 'cancel' }
  | { kind: 'ask'; reason?: string; displayReason?: { readonly en: string; readonly [locale: string]: string } }
type SessionEvent = { type: string; data?: { message?: { content?: Array<{ type: string; text?: string }> }; reason?: { kind?: string } } }
type ExternalLlmState = { enabled: boolean; model: string | null; contextWindow: number | null; keyConfigured: boolean; supportsTools: boolean }
type PromptAssemblyLike = { tools: unknown[] }
type AssembleContextLike = { agent?: AgentLike }
/** DSH llm/stream 的流式块（只写用到的）；见 dsh\packages\llm\llm\src\types.ts 的 StreamChunk。 */
type StreamChunk = { type: string; text?: string; reason?: unknown }
/** DSH llm/stream 的请求（只写用到的）；见同文件的 GenerateOptions。 */
type LlmOptions = { sessionId?: unknown; purpose?: unknown }

/**
 * 这次模型调用是不是 Agent 循环自己发的（复核 rv-A64 N3）。DSH 有 isAgentLoopRequest，但它查的是 dsh-llm 模块里的一个进程内集合；
 * 我方插件是自包含打包的，引进来是另一份副本，永远查不到。所以按请求本身的两个特征认：Agent 循环的请求整个被冻结、不带 purpose
 * （core\agent-loop\src\agent.ts 的 buildRequest：markAgentLoopRequest(Object.freeze({…}))）；压缩摘要、会话标题这些旁路调用都带
 * purpose（'compaction'、'session-title'），也不冻结。tests\loop-fuses.spec.ts 读这几处源码守着。
 */
export const isAgentLoopCall = (options: LlmOptions): boolean => options.purpose === undefined && Object.isFrozen(options)

const notice = (source: string, summary: string, text: string): UserMessage => Object.freeze({
  id: randomUUID(), role: 'user' as const, content: [{ type: 'text' as const, text }],
  source: { kind: source, form: 'notice', summary: summary.slice(0, 120) },
})
const hasDraftCitationProblems = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return false
  const citationCheck = (value as { citation_check?: unknown }).citation_check
  if (citationCheck === null || typeof citationCheck !== 'object') return false
  const problems = (citationCheck as { problems?: unknown }).problems
  return Array.isArray(problems) && problems.length > 0
}
const COVERAGE_ITEMS_PER_KIND = 8
const COVERAGE_NAME_CHARS = 160
const COVERAGE_REASON_CHARS = 240
type UnknownRecord = Record<string, unknown>
const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
const boundedItems = <T>(items: readonly T[], fits: (item: T) => boolean): { shown: T[]; omitted: number } => {
  const shown: T[] = []
  let omitted = 0
  for (const item of items) {
    if (shown.length < COVERAGE_ITEMS_PER_KIND && fits(item)) shown.push(item)
    else omitted += 1
  }
  return { shown, omitted }
}
/** 只从已通过 case_save_draft 结果契约的返回值取有限覆盖快照；结构异常一律不猜。 */
const deliveryCoverageSnapshot = (value: unknown): DeliveryCoverageSnapshot | undefined => {
  if (!isRecord(value) || !isRecord(value.coverage)) return undefined
  const coverage = value.coverage
  if (!isNonNegativeInteger(coverage.total) ||
    !Array.isArray(coverage.fully_read) || !coverage.fully_read.every((name) => typeof name === 'string') ||
    !Array.isArray(coverage.partially_read) || !coverage.partially_read.every((item) => {
      const partial = isRecord(item) ? item : undefined
      return partial !== undefined && typeof partial.name === 'string' &&
        isNonNegativeInteger(partial.read_units) && isNonNegativeInteger(partial.total_units)
    }) ||
    !Array.isArray(coverage.not_read) || !coverage.not_read.every((name) => typeof name === 'string') ||
    !Array.isArray(coverage.unreadable) || !coverage.unreadable.every((item) => {
      const unreadable = isRecord(item) ? item : undefined
      return unreadable !== undefined && typeof unreadable.name === 'string' && typeof unreadable.reason === 'string'
    })) return undefined

  const fullyRead = boundedItems(coverage.fully_read as string[], (name) => name.length <= COVERAGE_NAME_CHARS)
  const partiallyRead = boundedItems(
    coverage.partially_read as Array<{ name: string; read_units: number; total_units: number }>,
    (item) => item.name.length <= COVERAGE_NAME_CHARS,
  )
  const notRead = boundedItems(coverage.not_read as string[], (name) => name.length <= COVERAGE_NAME_CHARS)
  const unreadable = boundedItems(
    coverage.unreadable as Array<{ name: string; reason: string }>,
    (item) => item.name.length <= COVERAGE_NAME_CHARS && item.reason.length <= COVERAGE_REASON_CHARS,
  )
  return {
    total: coverage.total,
    fully_read: fullyRead.shown.map((name) => name),
    partially_read: partiallyRead.shown.map((item) => ({
      name: item.name,
      read_units: item.read_units,
      total_units: item.total_units,
    })),
    not_read: notRead.shown.map((name) => name),
    unreadable: unreadable.shown.map((item) => ({ name: item.name, reason: item.reason })),
    omitted: {
      fully_read: fullyRead.omitted,
      partially_read: partiallyRead.omitted,
      not_read: notRead.omitted,
      unreadable: unreadable.omitted,
    },
  }
}
const quotedCoverageNames = (names: readonly string[]): string => names.map((name) => JSON.stringify(name)).join('、')
const deliveryReviewNoticeText = (coverage: DeliveryCoverageSnapshot | undefined): string => {
  if (!coverage) return DELIVERY_REVIEW_NOTICE
  const incomplete = coverage.partially_read.length + coverage.omitted.partially_read +
    coverage.not_read.length + coverage.omitted.not_read +
    coverage.unreadable.length + coverage.omitted.unreadable
  if (incomplete === 0) {
    return DELIVERY_REVIEW_NOTICE +
      '保存返回的覆盖清单只说明材料读取覆盖，不代表事实、争议点或法律问题均已核验。'
  }

  const fullyReadCount = coverage.fully_read.length + coverage.omitted.fully_read
  const details = [
    `保存返回的覆盖清单显示本任务范围共 ${coverage.total} 份材料，完整读取 ${fullyReadCount} 份；覆盖不完整。`,
  ]
  if (coverage.partially_read.length > 0) {
    details.push(`部分读取：${coverage.partially_read.map((item) =>
      `${JSON.stringify(item.name)}（已读 ${item.read_units}/${item.total_units} 个单元）`).join('；')}。`)
  }
  if (coverage.omitted.partially_read > 0) {
    details.push(`部分读取另有 ${coverage.omitted.partially_read} 项未逐项列出。`)
  }
  if (coverage.not_read.length > 0) details.push(`未读取：${quotedCoverageNames(coverage.not_read)}。`)
  if (coverage.omitted.not_read > 0) details.push(`未读取另有 ${coverage.omitted.not_read} 项未逐项列出。`)
  if (coverage.unreadable.length > 0) {
    details.push(`无法读取：${quotedCoverageNames(coverage.unreadable.map((item) => item.name))}。`)
  }
  if (coverage.omitted.unreadable > 0) details.push(`无法读取另有 ${coverage.omitted.unreadable} 项未逐项列出。`)
  details.push(
    '这份清单只说明材料读取覆盖，不代表程序知道具体哪些事实、争议点或法律问题缺失。',
    '请在最终答复前结合已加载 Skill 的自检清单，检查是否需要补充缺失上下文；只有必要时才在本次任务范围和现有工具预算内补读，不得为消除提示而强制读完整个案件。',
    '无法补齐或材料不可读时，必须如实说明不确定之处及依据限制，不得声称已完整核验、已检查全部事实或已检查全部不利事实。',
    '对材料中的单方陈述，标题和结论均保留原陈述归属，不得改写为双方确认或既定事实。',
  )
  return DELIVERY_REVIEW_NOTICE + details.join('')
}
const snapshot = (sections: Array<{ name: string; text: string }>): UserMessage => Object.freeze({
  id: randomUUID(), role: 'user' as const,
  content: [{ type: 'text' as const, text: sections.map((s) => `## ${s.name}\n\n${s.text}`).join('\n\n') }],
  source: { kind: 'lawbench-context', form: 'snapshot', sections },
})

export const DENY_NOT_ALLOWED = '该工具在律师工作台不可用'
export const DENY_BUDGET = '已达到本次任务的上限，已保存草稿'
/** 同一个任务里同一个技能加载次数到了上限（令 0329 P0，防"加载 → 压缩 → 又加载"）。 */
export const DENY_SKILL_RELOAD = '这个技能在本次任务里已经加载过多次，内容没有变化。请不要再加载，直接按已知的步骤继续；内容记不全时用 case_save_draft 先保存已有成果'
/** 最后一次模型调用发起了存草稿以外的案件工具（令 0321）。 */
export const DENY_WRAP_UP = '这是本次任务的最后一次调用：只能用 case_save_draft 保存草稿，或直接写出回答'
/** 本轮外部模型声明不支持工具：模型请求不携带工具，直接执行入口也不得转发。 */
export const DENY_EXTERNAL_TOOLS = '当前外部模型不支持工具，只能直接回答'
/** 到达用量上限（模型调用次数或时间）整轮收尾时记的提示码，见 shared/turn-notices.ts。 */
export const BUDGET_STOPPED = 'BUDGET_STOPPED'
/** 输入区写任务单明确失败、还没重写成（T14 第二次实跑派修 2）：整轮拒绝，不拿上一张任务单发。 */
export const TASK_SHEET_FAILED = 'TASK_SHEET_FAILED'
/** 一轮结束了但 /core/task/end 重试一次仍没成（令 0405 追加）：界面提示"任务结束状态未能登记"。 */
export const TASK_END_FAILED = 'TASK_END_FAILED'
export const DENY_NO_TASK = '工作台服务未启动，请稍后重试'
export const CONTRACT_REVIEW_SKILL = 'contract-review'
export const DOC_REVISE_SKILL = 'doc-revise'
export const GENERAL_DRAFTING_SKILL = 'general-drafting'
export const CONTRACT_DRAFT_SKILL = 'contract-draft'
export const CROSS_EXAM_OPINION_SKILL = 'cross-exam-opinion'
export const CRIMINAL_APPLICATIONS_SKILL = 'criminal-applications'
export const DEFENSE_OPINION_SKILL = 'defense-opinion'
export const LITIGATION_DOCS_SKILL = 'litigation-docs'
export const SENTENCE_CALC_SKILL = 'sentence-calc'
export const ARCHIVE_SKILL = 'case-archiving'
const REQUIRED_QUESTION_SKILLS: ReadonlySet<string> = new Set([CONTRACT_REVIEW_SKILL, DOC_REVISE_SKILL, GENERAL_DRAFTING_SKILL, CONTRACT_DRAFT_SKILL, CROSS_EXAM_OPINION_SKILL, CRIMINAL_APPLICATIONS_SKILL, DEFENSE_OPINION_SKILL, LITIGATION_DOCS_SKILL, SENTENCE_CALC_SKILL, ARCHIVE_SKILL])
export const DRAFT_FEEDBACK_NOTICE = 'case_save_draft 已完成保存，并返回了 citation_check.problems。' +
  '请逐条核对全部问题：材料中的事实陈述应使用与材料名、位置真实匹配的〔…〕出处；' +
  '拟议条款、修改建议等并非材料事实，不要仅为清除提示而硬加出处。' +
  '需要改动时修改，并用同一标题重新保存；只需律师复核的合法提示，请在最终回答中明确说明仍待律师核对。' +
  'passed=true 只表示没有必须修改项，不等于所有事实已经核验。' +
  '不得为清除提示虚构材料、出处、问答或任务事实。'
export const DELIVERY_REVIEW_NOTICE = 'case_save_draft 已实际保存成功。' +
  '请在给律师的最终可见答复中，按本次任务已经加载的 Skill 自检清单逐项列出每项结论：通过，或问题与处理；' +
  '不得只用“已按清单自查”等概括代替。' +
  '自检结果只写在聊天答复中，不写入草稿，不展示内部推理。' +
  '不得虚构通过项、材料、出处或任务事实；需要改稿的照实说明并处理后重新保存。'
export const QUESTION_GATED_TOOLS: ReadonlySet<string> = new Set([BUDGET_EXEMPT_TOOL, 'case_save_edit_list'])
const REQUIRED_QUESTIONS_PREFIX = '提交成果前必须先取得律师对必问问题的真实回答。还缺：'
const INVALID_QUESTION_ASK = 'ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：'
const QUESTIONS_BEFORE_READ_PREFIX = '文书起草必须先取得律师对必问问题的真实回答，再读取案件材料或案件 Wiki。还缺：'
export const CASE_LIST_BEFORE_SENTENCE_READ_DENIAL = '刑期计算必须先调用 case_list_materials 取得本案的真实材料清单，再读取案件材料。'
export const CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL = '案卷归档必须先调用 case_list_materials 取得本案的真实材料清单，再调用 case_archive_match。'
export const questionRequirementDenial = (missing: readonly string[]): string => REQUIRED_QUESTIONS_PREFIX + missing.join('、')
export const invalidQuestionAskDenial = (missing: readonly string[]): string => INVALID_QUESTION_ASK + missing.join('、')
export const questionsBeforeReadDenial = (missing: readonly string[]): string => QUESTIONS_BEFORE_READ_PREFIX + missing.join('、')
const deliverableWriteGated = (state: TaskState, toolName: string): boolean =>
  QUESTION_GATED_TOOLS.has(toolName) || (state.archiveWorkflow && toolName === 'case_save_archive_plan')
/** 同一个案件工具带同样的参数第三次调用（注记 2026-10-14 19:01 第 2 条）：拒绝，让模型改做法或作答。 */
export const DENY_REPEATED_CALL = `repeated_call：同样的调用（同一工具、同样参数）在本次任务里已经做过 ${MAX_SAME_CALLS - 1} 次，结果不会变。不要再调，换个做法，或根据已有结果直接作答；做不到就用一句话说明做不了`
/** 思考或回复原样重复、本次模型调用被中止（注记 19:01 第 1 条）：界面提示"这个请求我做不了或没理解……"并显示存下的草稿。 */
export const REPETITION_STOPPED = 'REPETITION_STOPPED'
/** 中止那次模型调用时给 DSH 的失败码：不在任何重试策略的可重试码里，DSH 不重试，这一轮按出错结束。 */
export const REPETITION_FAILURE_CODE = 'LAWBENCH_REPETITION'
/** 中止时 DSH 显示在对话里的那句（与界面提示同一句）。 */
export const REPETITION_MESSAGE = '这个请求我做不了或没理解，请换个说法或拆成小步'
/**
 * 能力边界（律师反馈 F1，令 2026-10-14 15:38 第 3 条；注记 2026-10-15 15:01 按律师原话拆开指路）：每个任务注入的运行时上下文里的一节。
 * 自由对话不加载 Skill，读不到 skills\_shared\共用规则.md 里同样的那条，这里再说一遍。与共用规则那条逐字一致（线 B 照这里改；
 * tests\loop-fuses.spec.ts 对照）。
 */
export const CAPABILITY_TEXT = '对话里能做的只有你手上这些工具做得到的事（读案件材料、检索、计算刑期、保存草稿和归档方案等）。' +
  '律师要求文件改名或批量改名、把图片拼合或合并成 PDF、转换文件格式、移动删除文件、处理案件以外的文件时，用一句话说明对话里做不了，并指路：' +
  '多张图片合并成 PDF 用首页"工具"里"格式互转"的"多张图片 → 一个 PDF"（选文件夹，按子文件夹各出一个、以子文件夹名命名）；' +
  '图片转 PDF（每张图片各出一个 PDF）、Word / PDF / Markdown 互转、xls 转 xlsx 也用"格式互转"；长截图切成几段用首页"工具"里的"长截图切分"；' +
  '改名、移动文件请在资源管理器或其他软件里做（Mac 版没有这两个小工具）。' +
  '请求里同时要识别材料内容的（例如各文件夹里有没有合同、押金单、身份信息），告诉律师把这个文件夹拖进工作台建成案件后直接问，' +
  '会读完逐个文件夹列出并带出处；合并和识别分开做，先合并后识别。' +
  '不要用 case_save_archive_plan、case_save_draft 等工具变通凑出结果；说明完就结束本次回复，不反复尝试。'

type ContextValue = { l0: { text: string }; l1: { text: string; truncated: boolean; toc: Array<{ index: number; title: string; tokens: number }> } }

/** 从 DSH 已 claim 的用户消息里取最后一条原生 R；不另造、也不从正文推导。 */
export function requestIdFromMessages(messages: readonly UserMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const source = messages[index]?.source
    if (source === null || typeof source !== 'object') continue
    const candidate = source as { kind?: unknown; rpcId?: unknown }
    if (candidate.kind === 'user' && typeof candidate.rpcId === 'string' && candidate.rpcId.length > 0) return candidate.rpcId
  }
  return undefined
}

/** 服务返回的 scope 必须回指同一个 R 和同一案件；材料列表不得为空或重复。 */
export function validRequestScope(
  value: Pick<BeginValue, 'case_id' | 'request_id' | 'request_scope'>,
  requestId: string,
): boolean {
  if (value.request_id !== requestId || !('request_scope' in value)) return false
  const scope = value.request_scope
  if (scope === null) return true
  if (!scope || scope.request_id !== requestId || scope.case_id !== value.case_id || scope.kind !== 'materials') return false
  const ids = scope.materials.map((material) => material.material_id)
  return ids.length > 0 && new Set(ids).size === ids.length &&
    scope.materials.every((material) => /^M[0-9]{4}$/.test(material.material_id) && /^[0-9a-f]{64}$/.test(material.sha256))
}

/** 与 DSH 无关的核心逻辑；apply() 只把它接到 DSH 的挂载点上。 */
export class LegalAgent {
  /** 以会话 ID（= agent.id）为键的当前任务。 */
  readonly tasks = new Map<string, TaskState>()
  /** DSH 本轮权威 assembly 的引用；按 agent 对象隔离，agent 释放后由 WeakMap 自然回收。 */
  private readonly promptAssemblies = new WeakMap<AgentLike, PromptAssemblyLike>()

  /** @param noteBlocked - 拒绝整轮时记下错误码，界面经 Host 的 turnNotice 取走（DSH 的 reject 带不了消息）。 */
  /**
   * @param noteBlocked - 拒绝整轮时记下错误码，界面经 Host 的 turnNotice 取走（DSH 的 reject 带不了消息）。
   * @param clearBlocked - 这一轮顺利开始时清掉该会话没被取走的旧记录（复核 P3-C ①）。
   * @param caseMoved - 这个会话所在的案件文件夹是否已不在原位置（N55 ②；见会话存储 router.ts）。
   * @param sheetHeld - 这个会话的任务单是否没写成（输入区经 Host 的 sheetHold 记；T14 第二次实跑派修 2）。
   * @param skillQuestions - begin 已给出已确认的问题门 Skill 后，从 Host 现有 Skill 目录读机器必问项；不给按不可用处理。
   */
  constructor(private readonly core: CoreClient, private readonly log: Logger, private readonly noteBlocked: (sessionId: string, code: string, taskId?: string) => void = () => {}, private readonly clearBlocked: (sessionId: string) => void = () => {}, private readonly caseMoved: (sessionId: string) => boolean = () => false, private readonly sheetHeld: (sessionId: string) => boolean = () => false, private readonly externalLlmState: () => Promise<ExternalLlmState> = async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }), private readonly skillQuestions: (skillName: string) => Promise<SkillQuestion[]> = async () => { throw new Error(SKILL_QUESTIONS_UNAVAILABLE) }) {}

  /**
   * 案件文件夹已不在原处（N55 ②）：整轮拒绝，不写旧处；界面提示重启软件后在这个对话里继续，或新开一个对话。
   * 排在最前的那个 pre-step 和下面的 preStep 都走这一处（第九轮复核 B-NOTE）。
   */
  rejectMoved(sessionId: string): PreStepDecision {
    this.log('warn', 'agent.case_moved', {})
    this.noteBlocked(sessionId, 'CASE_MOVED')
    this.tasks.delete(sessionId)
    return { kind: 'reject' }
  }

  /**
   * 记录同一个 agent 本轮 `system-prompt/assemble` 的最终结果。pre-step 发生在该 waterfall 之后；
   * 不支持工具时清空这里保存的同一个 tools 数组，AgentLoop 随后构建的持久 header 与真实请求都取不到工具。
   */
  rememberPromptAssembly(owner: AgentLike, assembly: PromptAssemblyLike): void {
    this.promptAssemblies.set(owner, assembly)
  }

  private omitPromptTools(owner: AgentLike): void {
    const assembly = this.promptAssemblies.get(owner)
    if (assembly) assembly.tools.splice(0, assembly.tools.length)
  }

  /** 只对已确认缺口的 9 类 Skill 读机器必问项；其它 Skill 和自由对话不加载。 */
  private async requiredQuestionIds(skill: string | null): Promise<readonly string[]> {
    if (skill === null || !REQUIRED_QUESTION_SKILLS.has(skill)) return []
    const questions = await this.skillQuestions(skill)
    if (!Array.isArray(questions)) throw new Error(SKILL_QUESTIONS_UNAVAILABLE)
    const keys = new Set<string>()
    for (const question of questions) {
      if (!question || typeof question.key !== 'string' || !/^[a-z][a-z0-9_]*$/.test(question.key) ||
        typeof question.question !== 'string' || !question.question.trim() ||
        typeof question.fromMaterials !== 'boolean' || keys.has(question.key)) {
        throw new Error(SKILL_QUESTIONS_UNAVAILABLE)
      }
      keys.add(question.key)
    }
    return [...keys]
  }

  /** agent/pre-step。step 1 取任务和上下文；每步检查模型调用预算。 */
  async preStep(agent: AgentLike, step: number, decision: PreStepDecision): Promise<PreStepDecision> {
    if (decision.kind === 'reject') return decision
    let state = this.tasks.get(agent.id)
    const added: UserMessage[] = []
    // 案件卡片和任务输入放在律师这条消息的前面（令 0329 P0 追加线索）：模型看到的最后一条用户消息应当是律师刚发的那句，
    // 不是我方注入的背景——否则上下文一长，模型容易把背景或摘要里的旧事当成这一轮要办的
    const lead: UserMessage[] = []
    if (step === 1 && this.caseMoved(agent.id)) return this.rejectMoved(agent.id)
    // 律师改了选择、写任务单明确失败还没重写成：服务那边还是上一张，整轮拒绝（不在第 2 步之后拦：一轮已按取到的任务单开始）
    if (step === 1 && this.sheetHeld(agent.id)) {
      this.log('warn', 'agent.sheet_held', {})
      this.noteBlocked(agent.id, TASK_SHEET_FAILED)
      this.tasks.delete(agent.id)
      return { kind: 'reject' }
    }
    if (step === 1 || !state) {
      // 上一轮的任务还挂着（它的结束事件没收到）：先登记结束再开新的，不让它在服务里永远是"进行中"（令 0405 追加）
      if (state) await this.endTask(agent.id, state, 'interrupted')
      const requestId = requestIdFromMessages(decision.messages)
      const begin = await this.core.call<BeginValue>('task/begin', {
        session_id: agent.id,
        cwd: agent.session?.header?.cwd ?? '',
        ...(requestId === undefined ? {} : { request_id: requestId }),
      })
      if (!begin.ok) {
        // Q11：取任务失败拒绝整轮（DSH 的 reject 不能附带消息，界面提示由 T13 做）
        this.log('warn', 'agent.task_begin_failed', { code: begin.error.code })
        this.noteBlocked(agent.id, begin.error.code)
        this.tasks.delete(agent.id)
        return { kind: 'reject' }
      }
      // 带原生 R 的新服务必须明确回同一 R 的 request_scope（整案时写 null）；
      // 不从缺字段猜“全案”，否则一次接线错误会静默扩大读取范围。
      if (requestId !== undefined && !validRequestScope(begin.value, requestId)) {
        this.log('warn', 'agent.request_scope_invalid', {})
        const ended = await this.endTask(agent.id, new TaskState(begin.value.task_id, begin.value.budget, begin.value.params), 'blocked')
        if (ended) this.noteBlocked(agent.id, REQUEST_SCOPE_UNAVAILABLE)
        return { kind: 'reject' }
      }
      const route = begin.value.route ?? 'local'
      if (route !== 'local' && route !== 'external') {
        const ended = await this.endTask(
          agent.id,
          new TaskState(begin.value.task_id, begin.value.budget, begin.value.params),
          'blocked',
        )
        if (ended) this.noteBlocked(agent.id, EXTERNAL_ROUTE_UNAVAILABLE)
        return { kind: 'reject' }
      }
      let external: { model: string; contextWindow: number } | undefined
      let supportsTools = true
      if (route === 'external') {
        const ext = await this.externalLlmState().catch(() => undefined)
        const contextWindow = ext?.contextWindow
        // 已开始的任务不因设置随后被关闭或删 Key 而静默改走本地；保留本机 /v1-ext 的 404/拒绝语义。
        if (ext?.enabled !== true || ext.keyConfigured !== true || typeof ext.model !== 'string' || !ext.model.trim() ||
          typeof contextWindow !== 'number' || !Number.isInteger(contextWindow) || contextWindow < 2048) {
          this.log('warn', 'agent.external_route_unavailable', {})
          const ended = await this.endTask(
            agent.id,
            new TaskState(begin.value.task_id, begin.value.budget, begin.value.params),
            'blocked',
          )
          if (ended) this.noteBlocked(agent.id, EXTERNAL_ROUTE_UNAVAILABLE)
          return { kind: 'reject' }
        }
        external = { model: ext.model, contextWindow }
        supportsTools = ext.supportsTools
      }
      let requiredQuestionIds: readonly string[]
      try {
        requiredQuestionIds = await this.requiredQuestionIds(begin.value.skill)
      } catch {
        // begin 已建任务，取不到目标 Skill 的真实机器必问项时不能当成“无必问”放行；按 blocked 收尾。
        this.log('warn', 'agent.skill_questions_unavailable', { skill: begin.value.skill })
        const failed = new TaskState(
          begin.value.task_id, begin.value.budget, begin.value.params, Date.now(), route, external, supportsTools,
          begin.value.case_id, agent.id,
        )
        const ended = await this.endTask(agent.id, failed, 'blocked')
        if (ended) this.noteBlocked(agent.id, SKILL_QUESTIONS_UNAVAILABLE)
        return { kind: 'reject' }
      }
      state = new TaskState(
        begin.value.task_id, begin.value.budget, begin.value.params, Date.now(), route, external, supportsTools,
        begin.value.case_id, agent.id, requiredQuestionIds,
        begin.value.skill === CONTRACT_REVIEW_SKILL || begin.value.skill === CONTRACT_DRAFT_SKILL,
        begin.value.skill === LITIGATION_DOCS_SKILL || begin.value.skill === GENERAL_DRAFTING_SKILL,
        begin.value.skill === SENTENCE_CALC_SKILL,
        begin.value.skill === ARCHIVE_SKILL,
        begin.value.skill === GENERAL_DRAFTING_SKILL ||
          begin.value.skill === LITIGATION_DOCS_SKILL ||
          begin.value.skill === DEFENSE_OPINION_SKILL,
      )
      this.tasks.set(agent.id, state)
      const ctxRes = await this.core.call<ContextValue>('context', { task_id: state.taskId })
      if (!ctxRes.ok) {
        this.log('warn', 'agent.context_failed', { code: ctxRes.error.code })
        const ended = await this.endTask(agent.id, state, 'blocked')
        if (ended) this.noteBlocked(agent.id, ctxRes.error.code)
        return { kind: 'reject' }
      }
      this.clearBlocked(agent.id)
      const selectedSkill = begin.value.skill
      const { l0, l1 } = ctxRes.value
      const sections = [{ name: '案件卡片（L0）', text: l0.text }, { name: '任务输入（L1）', text: l1.text }]
      if (l1.toc.length) {
        sections.push({ name: '未放入 L1 的输入（用 case_read_input 按序号读取）', text: l1.toc.map((t) => `${t.index}. ${t.title}（约 ${t.tokens} token）`).join('\n') })
      }
      sections.push({ name: '能力边界', text: CAPABILITY_TEXT })
      if (selectedSkill !== null) {
        sections.push({
          name: '本次任务 Skill',
          text: `本次任务选择的是 ${selectedSkill}。执行任务动作前，必须先调用 skill 工具加载该 Skill，并按该 Skill 的要求执行任务。`,
        })
      }
      lead.push(snapshot(sections))
    }
    // begin 时快照不支持工具：每个新 assembly 丢 schema；同一轮后续步骤不读取后来变化的设置。
    if (!state.modelToolsAllowed) this.omitPromptTools(agent)
    // 令 0329 P0：这个任务里连续几次压缩之间都没有进展（模型在"想 → 加载技能 → 压缩"里打转）：不再继续，存稿收尾（同到顶的处理）
    if (state.compactionLoop) {
      state.budgetHit = true
      this.log('warn', 'agent.compaction_loop', { compactions: state.compactions, stalled: state.stalledCompactions, model_calls: state.modelCalls, stopped: true })
      await this.saveUnfinished(state)
      this.noteBlocked(agent.id, BUDGET_STOPPED, state.taskId)
      return { kind: 'reject' }
    }
    const d = state.beforeModelCall()
    if (d.kind === 'reject') {
      this.log('info', 'agent.model_budget', { reason: d.reason, model_calls: state.modelCalls })
      // 令 0321：到顶时这个任务还没有草稿，就把最后一条回复的文字代存成"未完成"的草稿，律师不至于一无所有
      await this.saveUnfinished(state)
      // 到达用量上限：模型这时往往刚存完草稿、没写文字回答（T14 实跑）。记下任务编号，输入区据此在对话区显示
      // 提示和刚存的草稿（出处可点；T14 派修 2，用户选"对话区显示草稿"）
      this.noteBlocked(agent.id, BUDGET_STOPPED, state.taskId)
      return { kind: 'reject' }
    }
    if (state.takeDraftFeedbackNotice()) {
      added.push(notice('lawbench-draft-check', '处理草稿核对反馈', DRAFT_FEEDBACK_NOTICE))
    }
    const deliveryCoverage = state.pendingDeliveryReviewCoverage
    if (state.takeDeliveryReviewNotice()) {
      added.push(notice('lawbench-delivery-review', '逐项完成交付自检', deliveryReviewNoticeText(deliveryCoverage)))
    }
    if (d.wrapUp) added.push(notice('lawbench-budget', '立即收尾', state.wrapUpNotice))
    return lead.length || added.length ? { ...decision, messages: [...lead, ...decision.messages, ...added] } : decision
  }

  /**
   * 预算到顶、这个任务还没有草稿：把最后一条回复的文字按存草稿的口径存一次（经 /core/tool 的 case_save_draft，标题以"（未完成）"结尾）。
   * 没有文字可存、存不成都不拦收尾（界面照旧说"没有存下草稿"）。日志只记结果，不记标题和正文。
   * @returns 存成了为 true。
   */
  async saveUnfinished(state: TaskState): Promise<boolean> {
    if (state.draftSaved) return false
    if (!state.deliverableWritesAllowed) {
      this.log('info', 'agent.unfinished_draft_blocked_questions', { missing: state.missingQuestionIds().length })
      return false
    }
    const text = state.lastReply()?.trim()
    if (!text) return false
    const r = await this.core.call('tool', { task_id: state.taskId, tool: BUDGET_EXEMPT_TOOL, args: { title: UNFINISHED_TITLE, content: text } }).catch(() => undefined)
    const ok = r?.ok === true
    if (ok) state.draftSaved = true
    this.log(ok ? 'info' : 'warn', 'agent.unfinished_draft', { saved: ok, code: r && !r.ok ? r.error.code : undefined })
    return ok
  }

  /** agent/request：按本轮 begin 快照固定 provider/model、思考档、最大生成量和温度。 */
  request(agentId: string, cfg: LlmCallConfig): LlmCallConfig {
    const state = this.tasks.get(agentId)
    if (!state) return cfg
    const p = state.params
    const target = state.routeTarget
    if (target.provider === 'external') {
      // 未知外部模型的思考能力由服务商默认决定；连 DSH 调用方继承来的字段也要从对象上真正移除。
      const call = { ...cfg }
      delete call.reasoningEffort
      return {
        ...call,
        provider: target.provider,
        model: target.model,
        maxTokens: p.max_tokens,
        ...state.external === undefined ? {} : { contextWindowOverride: state.external.contextWindow },
        ...(p.temperature === undefined ? {} : { temperature: p.temperature }),
      }
    }
    return {
      ...cfg,
      provider: target.provider,
      model: target.model,
      reasoningEffort: reasoningEffort(p.thinking),
      maxTokens: p.max_tokens,
      ...(p.temperature === undefined ? {} : { temperature: p.temperature }),
    }
  }

  /** tools/pre-execute：白名单 + 十类已确认 Skill 的必问闸门 + 工具预算（Spec 9.2、Q10）。 */
  preTool(agentId: string | undefined, toolName: string, args?: unknown, execution?: { callId?: unknown; token?: unknown }): PreToolDecision {
    const state = agentId ? this.tasks.get(agentId) : undefined
    // 必须在预算、ask_user_question 暂停、skill 次数等任何副作用之前拒绝支持配置为 false 的外部轮次。
    if (state && !state.modelToolsAllowed) return { kind: 'deny', reason: DENY_EXTERNAL_TOOLS }
    if (!ALLOWED_OTHER_TOOLS.has(toolName) && !/^case_[a-z_]+$/.test(toolName)) {
      this.log('warn', 'agent.tool_not_allowed', { tool: toolName }) // Spec 3.1：出现这条日志说明有工具漏进来
      return { kind: 'deny', reason: DENY_NOT_ALLOWED }
    }
    if (toolName === ASK_USER_TOOL) {
      // 进入必问闸门的任务先核实际问题 ID；校验失败不能暂停计时，更不能留下可被晚到结果命中的 pending。
      if (state && state.requiredQuestionIds.length > 0) {
        const identity = execution && typeof execution.callId === 'string' && typeof execution.token === 'symbol'
          ? { callId: execution.callId, token: execution.token }
          : undefined
        const question = identity && agentId ? state.captureQuestionAsk(agentId, identity, args)
          : { allow: false as const, reason: 'invalid_question_ask' as const, missingIds: state.missingQuestionIds() }
        if (!question.allow) {
          this.log('warn', 'agent.required_question_ask_denied', {
            reason: question.reason, missing: question.missingIds.length,
          })
          return {
            kind: 'deny',
            reason: question.reason === 'missing_questions'
              ? questionRequirementDenial(question.missingIds)
              : invalidQuestionAskDenial(question.missingIds),
          }
        }
      }
      // 等律师回答必问问题：暂停本任务的时长计时，下一次模型调用时恢复（PRD F-RUN-05、Spec 9.2；令 1117 注记 11:28）
      if (agentId) state?.pause()
      return { kind: 'allow' }
    }
    // 令 0329 P0：同一个任务里反复加载同一个技能（压缩把它剪掉、摘要掉后模型又去加载）——到上限后拒绝，让模型往下走
    if (toolName === SKILL_TOOL) {
      const task = agentId ? this.tasks.get(agentId) : undefined
      const skill = (args as { name?: unknown } | null | undefined)?.name
      if (task && !task.beforeSkillLoad(typeof skill === 'string' ? skill : '').allow) {
        this.log('warn', 'agent.skill_reload_loop', { model_calls: task.modelCalls, compactions: task.compactions })
        return { kind: 'deny', reason: DENY_SKILL_RELOAD }
      }
    }
    if (ALLOWED_OTHER_TOOLS.has(toolName)) return { kind: 'allow' }
    if (!state) return { kind: 'deny', reason: DENY_NO_TASK }
    // 归档先真实列清单、再匹配；必问项仍可在这两步之后、保存成果之前提出。
    if (state.archiveWorkflow && toolName === 'case_archive_match' && !state.materialListConfirmedForReads) {
      this.log('warn', 'agent.archive_workflow_blocked_match', { tool: toolName })
      return { kind: 'deny', reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL }
    }
    // 刑期计算先真实列清单、再读材料；必问项仍可在这两步之后、计算或写入之前提出。
    if (state.sentenceWorkflow && toolName === 'case_read_material' && !state.materialListConfirmedForReads) {
      this.log('warn', 'agent.sentence_workflow_blocked_read', { tool: toolName })
      return { kind: 'deny', reason: CASE_LIST_BEFORE_SENTENCE_READ_DENIAL }
    }
    // 诉讼文书与通用文书先问后读：只拦材料与 Wiki，检索、清单、Skill 加载和提问仍可先行。
    if (state.questionsBeforeMaterialRead && !state.questionsAnswered &&
      (toolName === 'case_read_material' || toolName === 'case_read_wiki')) {
      const missing = state.missingQuestionIds()
      this.log('warn', 'agent.required_questions_blocked_read', { tool: toolName, missing: missing.length })
      return { kind: 'deny', reason: questionsBeforeReadDenial(missing) }
    }
    // 刑期计算必须等本任务 Skill 的三项必问都有真实最终答案；未答齐的调用不进入预算。
    if (state.sentenceWorkflow && toolName === 'case_calc_sentence' && !state.questionsAnswered) {
      const missing = state.missingQuestionIds()
      this.log('warn', 'agent.required_questions_blocked_calc', { missing: missing.length })
      return { kind: 'deny', reason: questionRequirementDenial(missing) }
    }
    // 草稿和修改清单都在预算计数、CoreClient 写请求之前过同一个谓词；未答齐的调用不计数。
    if (deliverableWriteGated(state, toolName) && !state.deliverableWritesAllowed) {
      const missing = state.missingQuestionIds()
      this.log('warn', 'agent.required_questions_blocked_write', { tool: toolName, missing: missing.length })
      return { kind: 'deny', reason: questionRequirementDenial(missing) }
    }
    const d = state.beforeTool(toolName, Date.now(), args)
    if (d.allow) return { kind: 'allow' }
    const deniedReason = (legacy: string): string =>
      state.requiredQuestionIds.length > 0 && !state.questionsAnswered
        ? questionRequirementDenial(state.missingQuestionIds())
        : legacy
    // 注记 19:01 第 2 条：同一工具同样参数第三次——拒绝（不计数），让模型改做法或作答。日志只记工具名和次数
    if (d.reason === 'repeated_call') {
      this.log('warn', 'agent.repeated_call', { tool: toolName, count: MAX_SAME_CALLS, model_calls: state.modelCalls })
      return { kind: 'deny', reason: deniedReason(DENY_REPEATED_CALL) }
    }
    if (d.reason === 'tool_budget') this.log('info', 'agent.tool_budget', { tool_calls: state.toolCalls })
    if (d.reason === 'wrap_up_only') {
      this.log('info', 'agent.wrap_up_only', { tool: toolName })
      return { kind: 'deny', reason: deniedReason(DENY_WRAP_UP) }
    }
    return {
      kind: 'deny',
      reason: deniedReason(d.reason === 'tool_budget' ? DENY_BUDGET : DENY_NOT_ALLOWED),
    }
  }

  /** 下游 pre-execute 否决时清掉未被执行的提问快照；不把该调用算成已答。 */
  cancelQuestionAsk(agentId: string | undefined, execution: ToolExecutionIdentityLike): void {
    const state = agentId ? this.tasks.get(agentId) : undefined
    if (!state || execution.name !== ASK_USER_TOOL || typeof execution.callId !== 'string' || typeof execution.token !== 'symbol') return
    state.cancelPendingQuestionAsk(agentId!, { callId: execution.callId, token: execution.token })
  }

  /**
   * tools/result 同步观察最终冻结结果。这里已经晚于 post-execute 和所有会改写/阻断结果的策略；
   * 只有现行任务、现行 callId/token 和成功结构化答案才由 TaskState 收下。
   */
  observeToolResult(execution: ToolExecutionIdentityLike, result: Readonly<ToolExecutionResultLike>): void {
    if (execution.name !== ASK_USER_TOOL) return
    const agentId = typeof execution.agent?.id === 'string' ? execution.agent.id : undefined
    const state = agentId ? this.tasks.get(agentId) : undefined
    if (!state || state.requiredQuestionIds.length === 0 ||
      typeof execution.callId !== 'string' || typeof execution.token !== 'symbol') return
    const accepted = state.acceptFinalQuestionAnswers(agentId!, { callId: execution.callId, token: execution.token }, result)
    this.log('info', 'agent.required_question_result', { accepted, is_error: result.isError })
  }

  /** 工具执行：转发 /core/tool。Q6：失败抛错，把中文 message 给模型；成功时按契约校验 value。 */
  async executeTool(agentId: string | undefined, tool: string, args: unknown): Promise<unknown> {
    const state = agentId ? this.tasks.get(agentId) : undefined
    if (!state) throw new Error(DENY_NO_TASK)
    if (!state.modelToolsAllowed) throw new Error(DENY_EXTERNAL_TOOLS)
    // 有些既有测试和内部调用直接执行工具体而不先跑 preTool；读取和写入谓词都须在 CoreClient 前守住。
    if (state.archiveWorkflow && tool === 'case_archive_match' && !state.materialListConfirmedForReads) {
      throw new Error(CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL)
    }
    if (state.sentenceWorkflow && tool === 'case_read_material' && !state.materialListConfirmedForReads) {
      throw new Error(CASE_LIST_BEFORE_SENTENCE_READ_DENIAL)
    }
    if (state.questionsBeforeMaterialRead && !state.questionsAnswered &&
      (tool === 'case_read_material' || tool === 'case_read_wiki')) {
      throw new Error(questionsBeforeReadDenial(state.missingQuestionIds()))
    }
    if (state.sentenceWorkflow && tool === 'case_calc_sentence' && !state.questionsAnswered) {
      throw new Error(questionRequirementDenial(state.missingQuestionIds()))
    }
    if (deliverableWriteGated(state, tool) && !state.deliverableWritesAllowed) {
      throw new Error(questionRequirementDenial(state.missingQuestionIds()))
    }
    const r = await this.core.call('tool', { task_id: state.taskId, tool, args: (args ?? {}) as Record<string, unknown> })
    if (!r.ok) throw new Error(r.error.message)
    const errs = validate(toolId(tool), 'result', r.value)
    if (errs.length) {
      this.log('error', 'agent.tool_result_contract', { tool, errors: errs })
      throw new Error('内部错误，请重试；多次出现请联系技术支持')
    }
    if (tool === 'case_list_materials' && (state.sentenceWorkflow || state.archiveWorkflow)) {
      state.noteSuccessfulMaterialList()
    }
    if (tool === BUDGET_EXEMPT_TOOL) {
      state.draftSaved = true
      state.noteDraftFeedback(hasDraftCitationProblems(r.value))
      const coverage = deliveryCoverageSnapshot(r.value)
      if (coverage) state.noteSuccessfulDraftForDeliveryReview(coverage)
    }
    return r.value
  }

  /**
   * 登记任务结束（/core/task/end）。所有结束路径都走这里（令 0405 追加）：正常结束、律师停止、到顶、出错、中断、压缩循环收尾；
   * 没成重试一次，仍没成记日志并记 TASK_END_FAILED 让界面提示——否则服务里这个任务永远是"进行中"。
   * @param kind - DSH turn/end 的 reason.kind；任务碰到过上限的一律报 budget（见 TaskState.endReason）。
   */
  async endTask(sessionId: string, state: TaskState, kind: string): Promise<boolean> {
    if (this.tasks.get(sessionId) === state) this.tasks.delete(sessionId)
    const body = { task_id: state.taskId, reason: state.endReason(kind), model_calls: state.modelCalls, tool_calls: state.toolCalls, elapsed_s: state.elapsedSeconds() }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await this.core.call('task/end', body).catch(() => undefined)
      if (r?.ok) return true
      this.log('warn', 'agent.task_end_failed', { attempt, code: r && !r.ok ? r.error.code : undefined, reason: body.reason })
    }
    this.noteBlocked(sessionId, TASK_END_FAILED)
    return false
  }

  /**
   * 会话的 Agent 空闲了（agent/status idle）：这一轮已经不在跑。任务还挂着说明没收到它的结束事件——按中断登记结束（令 0405 追加，兜底）。
   */
  async onIdle(sessionId: string, expected?: TaskState): Promise<void> {
    const state = this.tasks.get(sessionId)
    // expected：空闲那一刻挂着的任务；这期间已经换成新一轮的任务就不动它
    if (!state || (expected !== undefined && state !== expected)) return
    this.log('warn', 'agent.task_left_open', {})
    await this.finishLoop(sessionId, state)
    await this.endTask(sessionId, state, 'interrupted')
  }

  /**
   * llm/stream：包住这个会话任务里的每次模型调用，边收边查思考 / 回复是否原样重复（注记 19:01 第 1 条）。
   * 同一段第三次出现：不再往下收（上游请求随之取消），补一个出错结束块，DSH 按出错结束这一轮（失败码不在可重试码里，不重试）；
   * 已经流出的这次思考、回复不进会话记录（出错的那次只记 assistant/attempt）。日志只记次数，不记内容。
   * 只套 Agent 循环自己发的请求（见 isAgentLoopCall）；压缩摘要、会话标题等旁路调用，以及没有任务的会话，原样放过（复核 rv-A64 N3）。
   */
  async *guardStream(options: LlmOptions, source: AsyncIterable<StreamChunk>): AsyncIterable<StreamChunk> {
    const state = isAgentLoopCall(options) && options.sessionId !== undefined ? this.tasks.get(String(options.sessionId)) : undefined
    if (!state) { yield* source; return }
    const guard = new RepetitionGuard()
    for await (const chunk of source) {
      const kind = chunk.type === 'reasoning-delta' ? 'reasoning' : chunk.type === 'text-delta' ? 'text' : undefined
      if (kind && typeof chunk.text === 'string' && guard.push(kind, chunk.text)) {
        state.noteRepetition()
        this.log('warn', 'agent.repetition_loop', { model_calls: state.modelCalls, in: kind, stopped: true })
        yield { type: 'finish', reason: { kind: 'error', failure: { code: REPETITION_FAILURE_CODE, message: REPETITION_MESSAGE } } }
        return
      }
      yield chunk
    }
  }

  /**
   * 一轮结束时：这个任务碰到过熔断（重复、同工具同参数、技能反复加载）就按到顶的口径存稿（还没有草稿时把最后一条回复代存）（注记 19:01）。
   * 只有第①道（这次调用被掐断、律师看不到回答）记提示码让界面说一句、显示草稿；第②③道只是拦下一次调用，这一轮照常答完，
   * 只记日志、存稿，不提示（注记 2026-10-15 14:29 第 2 条）。已经按到顶收尾的（预算、压缩循环）那边已存稿、已记提示，这里不再记。
   */
  async finishLoop(sessionId: string, state: TaskState): Promise<void> {
    if (!state.loopHit || state.budgetHit) return
    await this.saveUnfinished(state)
    if (state.loopHit === 'repetition') this.noteBlocked(sessionId, REPETITION_STOPPED, state.taskId)
  }

  /** session/event：assistant/message → /core/progress；turn/end → /core/task/end。 */
  async onSessionEvent(sessionId: string, event: SessionEvent): Promise<void> {
    const state = this.tasks.get(sessionId)
    if (!state) return
    if (event.type === 'assistant/message') {
      const text = (event.data?.message?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('')
      const all = state.addReply(text)
      if (all === undefined) return
      await this.core.call('progress', { task_id: state.taskId, text: all, model_calls: state.modelCalls, tool_calls: state.toolCalls })
    } else if (event.type === 'compaction/summary') {
      // 上下文被压缩了一次（令 0329 P0）：记数；超过上限时记一条，下一步收尾
      if (state.noteCompaction()) this.log('warn', 'agent.compaction_loop', { compactions: state.compactions, stalled: state.stalledCompactions, model_calls: state.modelCalls })
    } else if (event.type === 'turn/end') {
      await this.finishLoop(sessionId, state)
      await this.endTask(sessionId, state, event.data?.reason?.kind ?? 'error')
    }
  }
}

type Ctx = {
  on(event: string, fn: (...a: never[]) => unknown, opts?: { prepend?: boolean }): void
  get?(name: string): unknown
  tools: { register(def: unknown): () => void }
  lawbenchCore: {
    endpoint(): Endpoint | undefined
    noteTurnBlocked?(sessionId: string, code: string, taskId?: string): void
    clearTurnBlocked?(sessionId: string): void
    sheetHeld?(sessionId: string): boolean
    externalLlmState?(): Promise<ExternalLlmState>
    skillQuestions?(skillName: string): Promise<SkillQuestion[]>
  }
  effect(fn: () => () => void, label?: string): void
  logger?(name: string): { info(...a: unknown[]): void; warn(...a: unknown[]): void; error(...a: unknown[]): void }
}

export function apply(ctx: Ctx, config: Config = {}): void {
  const log: Logger = makeLogger('agent', config.appData ?? defaultAppData(), ctx.logger?.('lawbench-agent'))
  const core = new CoreClient(() => ctx.lawbenchCore.endpoint(), log, config.validateContracts ?? true)
  type Store = { caseMoved?(id: string): boolean; releaseMoved?(id: string): Promise<void> } | undefined
  const store = (): Store => ctx.get?.('sessionPersistence') as Store
  const caseMoved = (sessionId: string): boolean => store()?.caseMoved?.(sessionId) === true
  const agent = new LegalAgent(core, log,
    (sessionId, code, taskId) => ctx.lawbenchCore.noteTurnBlocked?.(sessionId, code, taskId),
    (sessionId) => ctx.lawbenchCore.clearTurnBlocked?.(sessionId),
    caseMoved,
    (sessionId) => ctx.lawbenchCore.sheetHeld?.(sessionId) === true,
    async () => ctx.lawbenchCore.externalLlmState?.() ?? { enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true },
    async (skillName) => {
      if (!ctx.lawbenchCore.skillQuestions) throw new Error(SKILL_QUESTIONS_UNAVAILABLE)
      return ctx.lawbenchCore.skillQuestions(skillName)
    })

  for (const tool of TOOL_NAMES) {
    ctx.effect(() => ctx.tools.register({
      name: tool,
      description: toolDescription(tool),
      parameters: toolParameters(tool),
      // Q6：DSH 的 output.schema 只接受受限写法，契约的 result 过不去；这里用宽松写法，结果由 executeTool 按契约校验
      output: { schema: { type: 'object' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: JSON.stringify(value) }] },
      execute: (args: unknown, exec: { agent?: { id: string } }) => agent.executeTool(exec?.agent?.id, tool, args),
    }), `lawbench-agent: tool ${tool}`)
  }

  // session-reference 采用同一写法：prepend 后调 next，观察完整下游 waterfall 的最终 assembly。
  ctx.on('system-prompt/assemble', (async (
    _assembly: PromptAssemblyLike,
    context: AssembleContextLike,
    next: () => Promise<PromptAssemblyLike>,
  ) => {
    const assembly = await next()
    if (context.agent) agent.rememberPromptAssembly(context.agent, assembly)
    return assembly
  }) as never, { prepend: true })

  ctx.on('agent/pre-step', (async (payload: { agent: AgentLike; step: number }, next: () => Promise<PreStepDecision>) =>
    agent.preStep(payload.agent, payload.step, await next())) as never)

  // 会话所在的案件文件夹已不在原位置（N55 ②）：排在最前，不调 next() 直接整轮拒绝。别的 pre-step 可能先动存储——
  // DSH 生产插件树里的 session-checkpoint-policy 每步前先 sessions.flush，搬家后旧路径写不进去就抛错、整轮按 agent/error
  // 结束，走不到上面那个先 next() 再判的处理，律师只看到含完整路径的英文错（T17 第八轮复核 B-F1）。
  // 拒绝之前请会话存储放下还没落过盘的写入者（第十轮 R10-1：否则被拒这一轮的事件让原版把旧路径整条重建、写进去）
  ctx.on('agent/pre-step', (async (payload: { agent: AgentLike; step: number }, next: () => Promise<PreStepDecision>) => {
    if (payload.step !== 1 || !caseMoved(payload.agent.id)) return next()
    await store()?.releaseMoved?.(payload.agent.id).catch(() => undefined)
    return agent.rejectMoved(payload.agent.id)
  }) as never, { prepend: true })

  // 思考 / 回复原样重复的熔断（注记 19:01 第 1 条）。只包有任务的会话的调用，见 guardStream
  ctx.on('llm/stream', ((options: LlmOptions, next: () => AsyncIterable<StreamChunk>) => agent.guardStream(options, next())) as never)

  ctx.on('agent/request', (async (payload: { agent: AgentLike }, next: () => Promise<LlmCallConfig>) =>
    agent.request(payload.agent.id, await next())) as never)

  ctx.on('tools/pre-execute', (async (exec: ToolExecutionIdentityLike, next: () => Promise<PreToolDecision>) => {
    const agentId = typeof exec.agent?.id === 'string' ? exec.agent.id : undefined
    const mine = agent.preTool(agentId, exec.name, exec.arguments, { callId: exec.callId, token: exec.token })
    if (mine.kind !== 'allow') return mine
    const decision = await next()
    if (decision.kind === 'deny' || decision.kind === 'cancel') agent.cancelQuestionAsk(agentId, exec)
    return decision
  }) as never, { prepend: true })

  // 最终结果观察：晚于 post-execute、调用方取消重写和最终 materialize；同步、无新存储。
  ctx.on('tools/result', ((exec: ToolExecutionIdentityLike, result: Readonly<ToolExecutionResultLike>) => {
    agent.observeToolResult(exec, result)
  }) as never)

  // 兜底：Agent 空闲时任务还挂着（没收到 turn/end）就登记结束。排在 turn/end 的处理之后：正常结束时任务已经摘掉，这里什么都不做
  ctx.on('agent/status', ((payload: { agent: AgentLike; status: string }) => {
    if (payload.status !== 'idle') return
    const left = agent.tasks.get(payload.agent.id)
    if (!left) return
    setTimeout(() => { void agent.onIdle(payload.agent.id, left).catch((e: unknown) => log('error', 'agent.idle_end_failed', { error: String((e as Error)?.message ?? e) })) }, 2000)
  }) as never)

  ctx.on('session/event', ((session: { id: string }, event: SessionEvent) => {
    void agent.onSessionEvent(session.id, event).catch((e: unknown) => log('error', 'agent.session_event_failed', { error: String((e as Error)?.message ?? e) }))
  }) as never)
}
