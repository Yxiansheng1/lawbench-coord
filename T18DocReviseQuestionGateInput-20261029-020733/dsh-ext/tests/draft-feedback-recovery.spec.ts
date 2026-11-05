import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  DRAFT_FEEDBACK_NOTICE,
  LegalAgent,
} from '../agent/index.ts'
import type { Budget, Params, QuestionExecutionIdentity, TaskState } from '../agent/task-state.ts'
import { CoreClient, type CoreCommand, type CoreResult, type Logger } from '../shared/core-client.ts'

type DraftProblem = {
  class: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  severity: 'must_fix' | 'hint'
  excerpt: string
  citation?: string | null
  message: string
}

type DraftResult = {
  path: string
  version: number
  citation_check: {
    passed: boolean
    problems: DraftProblem[]
    stats: { citations: number; must_fix: number; hints: number }
  }
  coverage: unknown
  not_fully_read: string[]
}

type ToolCall = { command: CoreCommand; body: Record<string, unknown> }
type DraftGate = { started: () => void; wait: Promise<void> }

const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '低', window: '64K', max_tokens: 16384 }
const QUESTIONS = ['our_party', 'purpose', 'focus'] as const
const noLog: Logger = () => {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isDraftResult(value: unknown): value is DraftResult {
  if (!isRecord(value) || !isRecord(value.citation_check)) return false
  return typeof value.path === 'string' &&
    typeof value.version === 'number' &&
    typeof value.citation_check.passed === 'boolean' &&
    Array.isArray(value.citation_check.problems) &&
    isRecord(value.citation_check.stats) &&
    Array.isArray(value.not_fully_read)
}

const parsedFixture: unknown = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
))
if (!isDraftResult(parsedFixture)) throw new Error('现有 case_save_draft 契约样例结构无效')
const DRAFT_FIXTURE = parsedFixture

function draftWith(problem: DraftProblem | undefined, version = 1): DraftResult {
  const result = structuredClone(DRAFT_FIXTURE)
  result.version = version
  result.citation_check.problems = problem ? [problem] : []
  result.citation_check.passed = problem?.severity !== 'must_fix'
  result.citation_check.stats = {
    citations: problem ? 1 : 0,
    must_fix: problem?.severity === 'must_fix' ? 1 : 0,
    hints: problem?.severity === 'hint' ? 1 : 0,
  }
  result.not_fully_read = []
  return result
}

const F_HINT: DraftProblem = {
  class: 'F',
  severity: 'hint',
  excerpt: '测试材料中的金额 100 元',
  citation: null,
  message: '合成材料事实陈述尚未标出处',
}

const MUST_FIX = DRAFT_FIXTURE.citation_check.problems[0]
if (!MUST_FIX) throw new Error('现有 case_save_draft 契约样例缺少 must_fix 问题')

class LocalCore extends CoreClient {
  readonly calls: ToolCall[] = []
  private sequence = 0
  private readonly draftReplies: Array<CoreResult<unknown>> = []
  private draftGate: DraftGate | undefined

  constructor(
    private readonly skill: string | null,
    private readonly budget: Budget = BUDGET,
  ) {
    super(() => undefined, noLog)
  }

  queueDraft(result: DraftResult): void {
    this.draftReplies.push({ ok: true, value: result })
  }

  queueDraftFailure(): void {
    this.draftReplies.push({ ok: false, error: { code: 'SERVICE_UNAVAILABLE', message: '合成服务失败' } })
  }

  queueInvalidDraftResult(): void {
    this.draftReplies.push({ ok: true, value: { path: '工作区/草稿.md', version: 1 } })
  }

  holdNextDraft(started: () => void, wait: Promise<void>): void {
    this.draftGate = { started, wait }
  }

  private typed<T>(result: CoreResult<unknown>): CoreResult<T> {
    return result as CoreResult<T>
  }

  override async call<T = unknown>(
    command: CoreCommand,
    body: Record<string, unknown>,
  ): Promise<CoreResult<T>> {
    this.calls.push({ command, body })
    if (command === 'task/begin') {
      this.sequence += 1
      return this.typed<T>({
        ok: true,
        value: {
          task_id: `T-draft-feedback-${this.sequence}`,
          case_id: 'case-draft-feedback',
          skill: this.skill,
          params: PARAMS,
          budget: this.budget,
        },
      })
    }
    if (command === 'context') {
      return this.typed<T>({
        ok: true,
        value: { l0: { text: '合成案件卡片' }, l1: { text: '合成任务输入', truncated: false, toc: [] } },
      })
    }
    if (command === 'tool' && body.tool === 'case_save_draft') {
      const gate = this.draftGate
      this.draftGate = undefined
      if (gate) {
        gate.started()
        await gate.wait
      }
      const reply = this.draftReplies.shift()
      return this.typed<T>(reply ?? {
        ok: false,
        error: { code: 'INTERNAL', message: '测试未配置存稿结果' },
      })
    }
    return this.typed<T>({ ok: true, value: {} })
  }
}

const agentObj = (id: string) => ({ id, session: { header: { cwd: 'D:\\案件\\合成合同审查' } } })
const enter = () => ({ kind: 'enter' as const, messages: [] })

function makeAgent(
  core: LocalCore,
  questions: readonly string[] = [],
): LegalAgent {
  return new LegalAgent(
    core,
    noLog,
    () => {},
    () => {},
    () => false,
    () => false,
    async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }),
    async (skill) => skill === CONTRACT_REVIEW_SKILL
      ? questions.map((key) => ({ key, question: `请确认 ${key}`, fromMaterials: false }))
      : [],
  )
}

async function startTask(agent: LegalAgent, session: string): Promise<TaskState> {
  const decision = await agent.preStep(agentObj(session), 1, enter())
  if (decision.kind !== 'enter') throw new Error('合成任务未能开始')
  const state = agent.tasks.get(session)
  if (!state) throw new Error('合成任务状态不存在')
  return state
}

function answerRequiredQuestions(agent: LegalAgent, session: string): void {
  const identity: QuestionExecutionIdentity = { callId: 'ask-contract-questions', token: Symbol('ask-contract-questions') }
  expect(agent.preTool(
    session,
    'ask_user_question',
    { questions: QUESTIONS.map((id) => ({ id, question: `请回答 ${id}` })) },
    identity,
  )).toEqual({ kind: 'allow' })
  agent.observeToolResult(
    { name: 'ask_user_question', callId: identity.callId, token: identity.token, agent: { id: session } },
    {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })) },
    },
  )
}

async function saveValidDraft(agent: LegalAgent, session: string, title = '合同审查意见'): Promise<unknown> {
  expect(agent.preTool(session, 'case_save_draft', { title, content: '合成正文' })).toEqual({ kind: 'allow' })
  return agent.executeTool(session, 'case_save_draft', { title, content: '合成正文' })
}

function messagesOf(decision: unknown): unknown[] {
  if (!isRecord(decision) || !Array.isArray(decision.messages)) return []
  return decision.messages
}

function draftFeedbackMessages(decision: unknown): unknown[] {
  return messagesOf(decision).filter((message) => {
    if (!isRecord(message) || !isRecord(message.source)) return false
    return message.source.kind === 'lawbench-draft-check'
  })
}

describe('合同审查草稿反馈回收', () => {
  it('显式无必问仍启用；F 提示只在后续正常请求前提示一次，换版本也不重排', async () => {
    const core = new LocalCore(CONTRACT_REVIEW_SKILL)
    const agent = makeAgent(core)
    const session = 'session-contract-no-questions'
    const state = await startTask(agent, session)
    expect(state.requiredQuestionIds).toEqual([])
    expect(state.draftFeedbackRecovery).toBe(true)

    core.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(agent, session)
    const first = await agent.preStep(agentObj(session), 2, enter())
    const feedback = draftFeedbackMessages(first)
    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toMatchObject({
      source: { kind: 'lawbench-draft-check', form: 'notice', summary: '处理草稿核对反馈' },
    })
    expect(JSON.stringify(feedback[0])).toContain(DRAFT_FEEDBACK_NOTICE)

    core.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(agent, session)
    core.queueDraft(draftWith({ ...F_HINT, excerpt: '测试材料中的日期 2026-01-01', message: '另一条合成提示' }, 2))
    await saveValidDraft(agent, session)
    const later = await agent.preStep(agentObj(session), 3, enter())
    expect(draftFeedbackMessages(later)).toEqual([])
  })

  it('合法任务取得有效必问答案后，must_fix 提示进入同一 notice 流且不改变结束原因', async () => {
    const core = new LocalCore(CONTRACT_REVIEW_SKILL)
    const agent = makeAgent(core, QUESTIONS)
    const session = 'session-contract-must-fix'
    const state = await startTask(agent, session)
    expect(state.requiredQuestionIds).toEqual(QUESTIONS)
    answerRequiredQuestions(agent, session)
    expect(state.missingQuestionIds()).toEqual([])

    core.queueDraft(draftWith(MUST_FIX, 2))
    await saveValidDraft(agent, session)
    const callsBefore = core.calls.length
    const next = await agent.preStep(agentObj(session), 2, enter())
    expect(draftFeedbackMessages(next)).toHaveLength(1)
    expect(core.calls).toHaveLength(callsBefore)
    expect(state.endReason('completed')).toBe('completed')
  })

  it('干净保存不排队；有问题后、取提示前又干净保存会清掉旧 pending', async () => {
    const core = new LocalCore(CONTRACT_REVIEW_SKILL)
    const agent = makeAgent(core)

    const cleanSession = 'session-clean-only'
    await startTask(agent, cleanSession)
    core.queueDraft(draftWith(undefined, 1))
    await saveValidDraft(agent, cleanSession)
    const cleanNext = await agent.preStep(agentObj(cleanSession), 2, enter())
    expect(draftFeedbackMessages(cleanNext)).toEqual([])

    const clearedSession = 'session-cleaned-before-take'
    await startTask(agent, clearedSession)
    core.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(agent, clearedSession)
    core.queueDraft(draftWith(undefined, 2))
    await saveValidDraft(agent, clearedSession)
    const clearedNext = await agent.preStep(agentObj(clearedSession), 2, enter())
    expect(draftFeedbackMessages(clearedNext)).toEqual([])
  })

  it('其它 Skill 即使显式无必问也不排队或读取合同问题元数据', async () => {
    const core = new LocalCore('other-skill')
    const agent = makeAgent(core)
    const session = 'session-other-skill'
    const state = await startTask(agent, session)
    expect(state.draftFeedbackRecovery).toBe(false)

    core.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(agent, session)
    const next = await agent.preStep(agentObj(session), 2, enter())
    expect(draftFeedbackMessages(next)).toEqual([])
  })

  it('Core 失败和结果契约失败都不排反馈；只有完整校验通过的保存结果才观察', async () => {
    const core = new LocalCore(CONTRACT_REVIEW_SKILL)
    const agent = makeAgent(core)

    const failedSession = 'session-core-failed'
    await startTask(agent, failedSession)
    core.queueDraftFailure()
    expect(agent.preTool(failedSession, 'case_save_draft', { title: '合同审查意见', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
    await expect(agent.executeTool(failedSession, 'case_save_draft', {
      title: '合同审查意见', content: '合成正文',
    })).rejects.toThrow('合成服务失败')
    const afterFailure = await agent.preStep(agentObj(failedSession), 2, enter())
    expect(draftFeedbackMessages(afterFailure)).toEqual([])

    const invalidSession = 'session-invalid-result'
    await startTask(agent, invalidSession)
    core.queueInvalidDraftResult()
    expect(agent.preTool(invalidSession, 'case_save_draft', { title: '合同审查意见', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
    await expect(agent.executeTool(invalidSession, 'case_save_draft', {
      title: '合同审查意见', content: '合成正文',
    })).rejects.toThrow('内部错误')
    const afterInvalid = await agent.preStep(agentObj(invalidSession), 2, enter())
    expect(draftFeedbackMessages(afterInvalid)).toEqual([])
  })

  it('迟到旧任务结果不进入新任务；另一个会话可在自己的任务里独立提示一次', async () => {
    const core = new LocalCore(CONTRACT_REVIEW_SKILL)
    const agent = makeAgent(core)
    const oldSession = 'session-old-task'
    await startTask(agent, oldSession)
    expect(agent.preTool(oldSession, 'case_save_draft', { title: '合同审查意见', content: '合成正文' }))
      .toEqual({ kind: 'allow' })

    let markStarted!: () => void
    const started = new Promise<void>((resolve) => { markStarted = resolve })
    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    core.holdNextDraft(markStarted, held)
    core.queueDraft(draftWith(F_HINT, 1))
    const oldSave = agent.executeTool(oldSession, 'case_save_draft', {
      title: '合同审查意见', content: '合成正文',
    })
    await started

    await startTask(agent, oldSession)
    release()
    await oldSave
    const newTaskNext = await agent.preStep(agentObj(oldSession), 2, enter())
    expect(draftFeedbackMessages(newTaskNext)).toEqual([])

    const otherSession = 'session-other-task'
    await startTask(agent, otherSession)
    core.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(agent, otherSession)
    const otherNext = await agent.preStep(agentObj(otherSession), 2, enter())
    expect(draftFeedbackMessages(otherNext)).toHaveLength(1)
  })

  it('预算拒绝不取提示、不增加 Core 或模型调用；取消登记原结束原因且 idle 不重跑', async () => {
    const budgetCore = new LocalCore(CONTRACT_REVIEW_SKILL, { model_calls: 1, tool_calls: 24, minutes: 45 })
    const budgetAgent = makeAgent(budgetCore)
    const budgetSession = 'session-budget'
    const budgetState = await startTask(budgetAgent, budgetSession)
    budgetCore.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(budgetAgent, budgetSession)
    const beforeBudgetReject = budgetCore.calls.length
    const rejected = await budgetAgent.preStep(agentObj(budgetSession), 2, enter())
    expect(rejected).toEqual({ kind: 'reject' })
    expect(draftFeedbackMessages(rejected)).toEqual([])
    expect(budgetCore.calls).toHaveLength(beforeBudgetReject)
    expect(budgetState.modelCalls).toBe(1)

    const cancelCore = new LocalCore(CONTRACT_REVIEW_SKILL)
    const cancelAgent = makeAgent(cancelCore)
    const cancelSession = 'session-cancelled'
    const cancelledState = await startTask(cancelAgent, cancelSession)
    cancelCore.queueDraft(draftWith(F_HINT, 1))
    await saveValidDraft(cancelAgent, cancelSession)
    await cancelAgent.onSessionEvent(cancelSession, {
      type: 'turn/end',
      data: { reason: { kind: 'aborted' } },
    })
    expect(cancelAgent.tasks.has(cancelSession)).toBe(false)
    expect(cancelCore.calls.findLast((call) => call.command === 'task/end')?.body.reason).toBe('aborted')
    const callsAfterCancel = cancelCore.calls.length
    await cancelAgent.onIdle(cancelSession, cancelledState)
    expect(cancelCore.calls).toHaveLength(callsAfterCancel)
  })
})
