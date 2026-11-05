import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_DRAFT_SKILL,
  DRAFT_FEEDBACK_NOTICE,
  LegalAgent,
  QUESTION_GATED_TOOLS,
  SKILL_QUESTIONS_UNAVAILABLE,
  questionRequirementDenial,
} from '../agent/index.ts'
import type { Budget, Params, QuestionExecutionIdentity, TaskState } from '../agent/task-state.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'
import { CoreClient, type CoreCommand, type CoreResult, type Logger } from '../shared/core-client.ts'

const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const SESSION = 'session-contract-draft-question-recovery'
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const noLog: Logger = () => {}

type Question = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<Question[]>
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
type Call = { command: CoreCommand; body: Record<string, unknown> }
type DraftGate = { started: () => void; wait: Promise<void> }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

const parsedFixture: unknown = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
))
if (!isRecord(parsedFixture) || !isRecord(parsedFixture.citation_check)) {
  throw new Error('现有 case_save_draft 契约样例结构无效')
}
const DRAFT_FIXTURE = parsedFixture as unknown as DraftResult

const F_HINT: DraftProblem = {
  class: 'F',
  severity: 'hint',
  excerpt: '合成报价中的价款 100 元',
  citation: null,
  message: '合成材料事实陈述尚未标出处',
}

const EDIT_LIST_RESULT = {
  path: '工作区/任务/T-contract-draft/修改清单/合成采购合同.json',
  accepted: 1,
  out_of_scope: [],
}

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

class LocalCore extends CoreClient {
  readonly calls: Call[] = []
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

  writes(): Call[] {
    return this.calls.filter((call) => call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool)))
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
          task_id: `T-contract-draft-${this.sequence}`,
          case_id: 'case-contract-draft',
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
    if (command === 'tool' && body.tool === 'case_save_edit_list') {
      return this.typed<T>({ ok: true, value: EDIT_LIST_RESULT })
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

const agentObj = (id = SESSION) => ({
  id,
  session: { header: { cwd: 'D:\\案件\\合成钢材采购合同' } },
})
const enter = () => ({ kind: 'enter' as const, messages: [] })

function makeAgent(
  core: CoreClient,
  skillQuestions?: Questions,
  notes: string[] = [],
): LegalAgent {
  return new LegalAgent(
    core,
    noLog,
    (_sessionId, code) => { notes.push(code) },
    () => {},
    () => false,
    () => false,
    async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }),
    skillQuestions,
  )
}

function currentHostQuestions(): Questions {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
  return (skillName: string) => remote.skillQuestions(skillName)
}

async function startTask(
  agent: LegalAgent,
  session = SESSION,
  step = 1,
): Promise<TaskState> {
  const decision = await agent.preStep(agentObj(session), step, enter())
  if (decision.kind !== 'enter') throw new Error('合成任务未能开始')
  const state = agent.tasks.get(session)
  if (!state) throw new Error('合成任务状态不存在')
  return state
}

function askArgs(ids: readonly string[]) {
  return { questions: ids.map((id) => ({ id, question: `请确认 ${id}` })) }
}

function askIdentity(callId: string): QuestionExecutionIdentity {
  return { callId, token: Symbol(callId) }
}

function observe(
  agent: LegalAgent,
  agentId: string,
  identity: QuestionExecutionIdentity,
  result: Readonly<{ isError: boolean; value?: unknown }>,
): void {
  agent.observeToolResult({
    name: 'ask_user_question',
    callId: identity.callId,
    token: identity.token,
    agent: { id: agentId },
  }, result)
}

function answerAll(agent: LegalAgent, session: string, state: TaskState, callId: string): void {
  const identity = askIdentity(callId)
  expect(agent.preTool(
    session,
    'ask_user_question',
    askArgs(state.requiredQuestionIds),
    identity,
  )).toEqual({ kind: 'allow' })
  observe(agent, session, identity, {
    isError: false,
    value: {
      answers: state.requiredQuestionIds.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })),
    },
  })
  expect(state.questionsAnswered).toBe(true)
}

async function saveDraft(
  agent: LegalAgent,
  session: string,
  title = '钢材采购合同',
  content = '合成合同正文',
): Promise<unknown> {
  expect(agent.preTool(session, 'case_save_draft', { title, content })).toEqual({ kind: 'allow' })
  return agent.executeTool(session, 'case_save_draft', { title, content })
}

function feedbackMessages(decision: unknown): unknown[] {
  if (!isRecord(decision) || !Array.isArray(decision.messages)) return []
  return decision.messages.filter((message) => {
    if (!isRecord(message) || !isRecord(message.source)) return false
    return message.source.kind === 'lawbench-draft-check'
  })
}

function feedbackText(message: unknown): string {
  if (!isRecord(message) || !Array.isArray(message.content)) return ''
  return message.content
    .filter((block): block is Record<string, unknown> => isRecord(block) && block.type === 'text')
    .map((block) => typeof block.text === 'string' ? block.text : '')
    .join('')
}

describe('contract-draft 必问闸门与保存反馈回收', () => {
  it('当前 Host 机器目录精确返回 three IDs/fromMaterials，LegalAgent 原样固定且启用反馈回收', async () => {
    const resolve = currentHostQuestions()
    const machineQuestions = await resolve(CONTRACT_DRAFT_SKILL)
    expect(machineQuestions.map((question) => question.key)).toEqual(['our_party', 'doc_scope', 'deal_terms'])
    expect(machineQuestions.map((question) => question.fromMaterials)).toEqual([false, false, true])
    expect(machineQuestions.every((question) => question.question.trim().length > 0)).toBe(true)

    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    let resolverCalls = 0
    const agent = makeAgent(core, (skillName) => {
      resolverCalls += 1
      return resolve(skillName)
    })
    const state = await startTask(agent)
    expect(resolverCalls).toBe(1)
    expect(state.requiredQuestionIds).toEqual(['our_party', 'doc_scope', 'deal_terms'])
    expect(state.draftFeedbackRecovery).toBe(true)
  })

  it('首次草稿和修改清单在真实回答前不到 Core；三项结构化确认后解锁两类写入', async () => {
    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    const agent = makeAgent(core, currentHostQuestions())
    const state = await startTask(agent)
    const missing = state.requiredQuestionIds
    const draft = { title: '钢材采购合同', content: '合成合同正文' }
    const editList = { name: '钢材采购合同', edits: [] }

    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(missing),
    })
    expect(agent.preTool(SESSION, 'case_save_edit_list', editList)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(missing),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', draft)).rejects.toThrow(questionRequirementDenial(missing))
    await expect(agent.executeTool(SESSION, 'case_save_edit_list', editList)).rejects.toThrow(questionRequirementDenial(missing))
    expect(core.writes()).toEqual([])

    answerAll(agent, SESSION, state, 'contract-draft-valid-answers')
    core.queueDraft(draftWith(undefined))
    await saveDraft(agent, SESSION, draft.title, draft.content)
    expect(agent.preTool(SESSION, 'case_save_edit_list', editList)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_edit_list', editList)
    expect(core.writes().map((call) => call.body.tool)).toEqual(['case_save_draft', 'case_save_edit_list'])
  })

  it('错问、下游取消和旧任务晚到结果都不能解锁当前 contract-draft 任务', async () => {
    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    const agent = makeAgent(core, currentHostQuestions())
    const first = await startTask(agent)
    const ids = first.requiredQuestionIds

    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(['unexpected']), askIdentity('wrong-id')))
      .toMatchObject({ kind: 'deny' })

    const cancelled = askIdentity('cancelled-ask')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), cancelled)).toEqual({ kind: 'allow' })
    agent.cancelQuestionAsk(SESSION, {
      name: 'ask_user_question',
      callId: cancelled.callId,
      token: cancelled.token,
      agent: { id: SESSION },
    })
    observe(agent, SESSION, cancelled, {
      isError: false,
      value: { answers: ids.map((id) => ({ id, selected: ['合成取消后答案'], custom: '' })) },
    })
    expect(first.missingQuestionIds()).toEqual(ids)

    const late = askIdentity('old-task-late')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), late)).toEqual({ kind: 'allow' })
    const second = await startTask(agent)
    observe(agent, SESSION, late, {
      isError: false,
      value: { answers: ids.map((id) => ({ id, selected: ['合成旧任务答案'], custom: '' })) },
    })
    expect(second).not.toBe(first)
    expect(second.missingQuestionIds()).toEqual(ids)
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(core.writes()).toEqual([])
  })

  it('contract-draft 的 Host 必问能力不可用时 fail closed，任务 blocked 且没有可写空状态', async () => {
    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    const notes: string[] = []
    const agent = makeAgent(core, undefined, notes)
    const decision = await agent.preStep(agentObj(), 1, enter())

    expect(decision).toEqual({ kind: 'reject' })
    expect(agent.tasks.has(SESSION)).toBe(false)
    expect(notes).toEqual([SKILL_QUESTIONS_UNAVAILABLE])
    expect(core.calls).toContainEqual({
      command: 'task/end',
      body: expect.objectContaining({ reason: 'blocked' }),
    })
    expect(core.writes()).toEqual([])
  })

  it('validated save with nonempty F hints queues the exact existing notice on the next allowed pre-step once', async () => {
    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    const agent = makeAgent(core, currentHostQuestions())
    const state = await startTask(agent)
    answerAll(agent, SESSION, state, 'feedback-valid-answers')

    core.queueDraft(draftWith(F_HINT, 1))
    await saveDraft(agent, SESSION)
    const next = await agent.preStep(agentObj(), 2, enter())
    const feedback = feedbackMessages(next)
    expect(feedback).toHaveLength(1)
    expect(feedbackText(feedback[0])).toBe(DRAFT_FEEDBACK_NOTICE)

    core.queueDraft(draftWith(F_HINT, 1))
    await saveDraft(agent, SESSION)
    core.queueDraft(draftWith({ ...F_HINT, excerpt: '合成材料中的日期 2026-01-01' }, 2))
    await saveDraft(agent, SESSION)
    const later = await agent.preStep(agentObj(), 3, enter())
    expect(feedbackMessages(later)).toEqual([])

    const cleanSession = 'session-contract-draft-clean'
    const cleanState = await startTask(agent, cleanSession)
    answerAll(agent, cleanSession, cleanState, 'feedback-clean-answers')
    core.queueDraft(draftWith(undefined, 1))
    await saveDraft(agent, cleanSession)
    const cleanNext = await agent.preStep(agentObj(cleanSession), 2, enter())
    expect(feedbackMessages(cleanNext)).toEqual([])

    const failedSession = 'session-contract-draft-failed'
    const failedState = await startTask(agent, failedSession)
    answerAll(agent, failedSession, failedState, 'feedback-failed-answers')
    core.queueDraftFailure()
    await expect(saveDraft(agent, failedSession)).rejects.toThrow('合成服务失败')
    const failedNext = await agent.preStep(agentObj(failedSession), 2, enter())
    expect(feedbackMessages(failedNext)).toEqual([])

    const invalidSession = 'session-contract-draft-invalid'
    const invalidState = await startTask(agent, invalidSession)
    answerAll(agent, invalidSession, invalidState, 'feedback-invalid-answers')
    core.queueInvalidDraftResult()
    await expect(saveDraft(agent, invalidSession)).rejects.toThrow('内部错误')
    const invalidNext = await agent.preStep(agentObj(invalidSession), 2, enter())
    expect(feedbackMessages(invalidNext)).toEqual([])
  })

  it('预算拒绝不取反馈、不增加 Core 或模型调用', async () => {
    const budget: Budget = { model_calls: 1, tool_calls: 24, minutes: 45 }
    const core = new LocalCore(CONTRACT_DRAFT_SKILL, budget)
    const agent = makeAgent(core, currentHostQuestions())
    const state = await startTask(agent)
    answerAll(agent, SESSION, state, 'budget-feedback-answers')
    core.queueDraft(draftWith(F_HINT, 1))
    await saveDraft(agent, SESSION)
    const callsBefore = core.calls.length

    expect(await agent.preStep(agentObj(), 2, enter())).toEqual({ kind: 'reject' })
    expect(core.calls).toHaveLength(callsBefore)
    expect(state.modelCalls).toBe(1)
    expect(state.takeDraftFeedbackNotice()).toBe(true)
  })

  it('旧任务迟到保存不污染新任务；其它 Skill 不读取必问项也不回收反馈', async () => {
    const core = new LocalCore(CONTRACT_DRAFT_SKILL)
    const agent = makeAgent(core, currentHostQuestions())
    const oldSession = 'session-contract-draft-old'
    const oldState = await startTask(agent, oldSession)
    answerAll(agent, oldSession, oldState, 'old-task-answers')

    let markStarted!: () => void
    const started = new Promise<void>((resolve) => { markStarted = resolve })
    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    core.holdNextDraft(markStarted, held)
    core.queueDraft(draftWith(F_HINT, 1))
    const oldSave = saveDraft(agent, oldSession)
    await started

    const newState = await startTask(agent, oldSession)
    release()
    await oldSave
    const newNext = await agent.preStep(agentObj(oldSession), 2, enter())
    expect(newState).not.toBe(oldState)
    expect(feedbackMessages(newNext)).toEqual([])

    const otherCore = new LocalCore('other-skill')
    let resolverCalls = 0
    const otherAgent = makeAgent(otherCore, async () => {
      resolverCalls += 1
      return []
    })
    const otherSession = 'session-other-skill'
    const otherState = await startTask(otherAgent, otherSession)
    expect(otherState.requiredQuestionIds).toEqual([])
    expect(otherState.draftFeedbackRecovery).toBe(false)
    otherCore.queueDraft(draftWith(F_HINT, 1))
    await saveDraft(otherAgent, otherSession)
    const otherNext = await otherAgent.preStep(agentObj(otherSession), 2, enter())
    expect(feedbackMessages(otherNext)).toEqual([])
    expect(resolverCalls).toBe(0)
  })
})
