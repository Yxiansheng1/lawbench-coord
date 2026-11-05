import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CROSS_EXAM_OPINION_SKILL,
  LegalAgent,
  QUESTION_GATED_TOOLS,
  SKILL_QUESTIONS_UNAVAILABLE,
  questionRequirementDenial,
} from '../agent/index.ts'
import {
  TaskState,
  type Budget,
  type Params,
  type QuestionExecutionIdentity,
} from '../agent/task-state.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'
import { CoreClient, type CoreCommand, type CoreResult, type Logger } from '../shared/core-client.ts'

const CASE = 'case-cross-exam-question-gate'
const SESSION = 'session-cross-exam-question-gate'
const TASK = 'T-cross-exam-question-gate'
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const QUESTIONS = ['stance', 'scope', 'need_questions'] as const
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const SAVED = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
)) as unknown
const NO_LOG: Logger = () => {}

type Question = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<Question[]>
type Call = { command: CoreCommand; body: Record<string, unknown> }

class MemoryCore extends CoreClient {
  readonly calls: Call[] = []
  private sequence = 0

  constructor(private readonly skill: string | null = CROSS_EXAM_OPINION_SKILL) {
    super(() => undefined, NO_LOG)
  }

  writes(): Call[] {
    return this.calls.filter((call) =>
      call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool)))
  }

  override async call<T = unknown>(
    command: CoreCommand,
    body: Record<string, unknown>,
  ): Promise<CoreResult<T>> {
    this.calls.push({ command, body })
    if (command === 'task/begin') {
      this.sequence += 1
      return {
        ok: true,
        value: {
          task_id: `${TASK}-${this.sequence}`,
          case_id: CASE,
          skill: this.skill,
          params: PARAMS,
          budget: BUDGET,
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'context') {
      return {
        ok: true,
        value: { l0: { text: '合成案件卡片' }, l1: { text: '合成任务输入', truncated: false, toc: [] } },
      } as unknown as CoreResult<T>
    }
    if (command === 'tool' && body.tool === 'case_save_draft') {
      return { ok: true, value: SAVED } as unknown as CoreResult<T>
    }
    return { ok: true, value: {} } as unknown as CoreResult<T>
  }
}

const agentObj = (id = SESSION) => ({ id, session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成质证材料' } } })
const enter = () => ({ kind: 'enter' as const, messages: [] })

function makeAgent(core: CoreClient, skillQuestions?: Questions, notes: string[] = []): LegalAgent {
  return new LegalAgent(
    core,
    NO_LOG,
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

async function start(agent: LegalAgent, target = agentObj()) {
  const decision = await agent.preStep(target, 1, enter())
  return { decision, state: agent.tasks.get(target.id) }
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

function taskState(ids: readonly string[] = QUESTIONS, taskId = TASK): TaskState {
  return new TaskState(
    taskId,
    BUDGET,
    PARAMS,
    0,
    'local',
    undefined,
    true,
    CASE,
    SESSION,
    ids,
  )
}

describe('cross-exam-opinion 必问闸门', () => {
  it('主 Host 元数据固定三项，未答时 preTool 与直接 executeTool 都在 Core 和预算前拒绝', async () => {
    const resolve = currentHostQuestions()
    const machineQuestions = await resolve(CROSS_EXAM_OPINION_SKILL)
    expect(machineQuestions.map((question) => question.key)).toEqual([...QUESTIONS])
    expect(machineQuestions.map((question) => question.fromMaterials)).toEqual([true, false, false])

    const core = new MemoryCore()
    const agent = makeAgent(core, resolve)
    const { decision, state } = await start(agent)
    expect(decision.kind).toBe('enter')
    expect(state?.requiredQuestionIds).toEqual([...QUESTIONS])

    state!.toolCalls = state!.budget.tool_calls
    state!.modelCalls = state!.budget.model_calls
    const toolCalls = state!.toolCalls
    const draft = { title: '质证意见', content: '合成质证意见正文' }
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    expect(agent.preTool(SESSION, 'case_save_edit_list', { name: '合成质证意见', edits: [] })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', draft))
      .rejects.toThrow(questionRequirementDenial(QUESTIONS))
    expect(state!.toolCalls).toBe(toolCalls)
    expect(state!.budgetHit).toBe(false)
    expect(state!.draftSaved).toBe(false)
    expect(core.writes()).toEqual([])
  })

  it('空、未知、重复、漏项和畸形提问 ID 都不能打开闸门', async () => {
    const core = new MemoryCore()
    const agent = makeAgent(core, currentHostQuestions())
    const { state } = await start(agent)
    const invalidAsks = [
      { questions: [] },
      askArgs([...QUESTIONS, 'confirm_scope']),
      askArgs(['stance', 'stance', 'need_questions']),
      askArgs(['stance', 'scope']),
      {
        questions: [
          { id: 'stance', question: ' ' },
          { id: 'scope', question: '请确认 scope' },
          { id: 'need_questions', question: '请确认 need_questions' },
        ],
      },
    ]

    for (const [index, args] of invalidAsks.entries()) {
      expect(agent.preTool(SESSION, 'ask_user_question', args, askIdentity(`invalid-${index}`)))
        .toMatchObject({ kind: 'deny' })
      expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])
    }
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(core.writes()).toEqual([])
  })

  it('失败、取消和旧任务晚到结果不解锁；同一任务的联合成功结果解锁一次写入', async () => {
    const core = new MemoryCore()
    const agent = makeAgent(core, currentHostQuestions())
    const { state } = await start(agent)
    const answers = QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' }))

    const failed = askIdentity('failed-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(QUESTIONS), failed)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, failed, { isError: true, value: { answers } })
    expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])

    const cancelled = askIdentity('cancelled-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(QUESTIONS), cancelled)).toEqual({ kind: 'allow' })
    agent.cancelQuestionAsk(SESSION, {
      name: 'ask_user_question',
      callId: cancelled.callId,
      token: cancelled.token,
      agent: { id: SESSION },
    })
    observe(agent, SESSION, cancelled, { isError: false, value: { answers } })
    expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])

    const stale = askIdentity('stale-task-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(QUESTIONS), stale)).toEqual({ kind: 'allow' })
    const fresh = taskState(QUESTIONS, `${TASK}-fresh`)
    agent.tasks.set(SESSION, fresh)
    observe(agent, SESSION, stale, { isError: false, value: { answers } })
    expect(fresh.missingQuestionIds()).toEqual([...QUESTIONS])
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(core.writes()).toEqual([])

    const valid = askIdentity('same-task-joint-answer')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(QUESTIONS), valid)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, valid, { isError: false, value: { answers } })
    expect(fresh.missingQuestionIds()).toEqual([])
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '质证意见', content: '合成正文' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', { title: '质证意见', content: '合成正文' })
    expect(core.writes()).toHaveLength(1)
  })

  it('Host 缺失或返回畸形目录时 fail closed；显式空目录仍是合法的无必问', async () => {
    for (const resolver of [
      undefined,
      async () => [
        { key: 'stance', question: '问一', fromMaterials: true },
        { key: 'stance', question: '问二', fromMaterials: true },
      ],
      async () => [{ key: 'Bad Key', question: '', fromMaterials: true }],
    ]) {
      const core = new MemoryCore()
      const notes: string[] = []
      const agent = makeAgent(core, resolver, notes)
      const { decision, state } = await start(agent)
      expect(decision).toEqual({ kind: 'reject' })
      expect(state).toBeUndefined()
      expect(notes).toEqual([SKILL_QUESTIONS_UNAVAILABLE])
      expect(core.calls.some((call) =>
        call.command === 'task/end' && call.body.reason === 'blocked')).toBe(true)
      expect(core.writes()).toEqual([])
    }

    const noneCore = new MemoryCore()
    const noneAgent = makeAgent(noneCore, async () => [])
    const noneTask = await start(noneAgent)
    expect(noneTask.decision.kind).toBe('enter')
    expect(noneTask.state?.requiredQuestionIds).toEqual([])
    expect(noneAgent.preTool(SESSION, 'case_save_draft', { title: '质证意见', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
  })
})

type Fiber = { dispose(): Promise<void> }
type RuntimeAgent = {
  id: string
  session: { id: string; header: { cwd: string; delegationDepth: number } }
}
type RuntimeExecution = {
  name: string
  callId: string
  token: symbol
  arguments?: unknown
  agent?: RuntimeAgent
}
type RuntimeResult = {
  isError: boolean
  value?: unknown
  content: unknown[]
  error?: { message?: string; info?: { code?: string } }
}
type RuntimeContext = {
  provide(name: string, value: unknown): void
  plugin(plugin: unknown, config?: unknown): Promise<Fiber>
  on(event: string, listener: (...args: never[]) => unknown, options?: unknown): () => void
  waterfall<T>(event: string, payload: unknown, next: () => Promise<T>): Promise<T>
  tools: {
    execute(input: {
      signal: AbortSignal
      callId: string
      name: string
      arguments: unknown
      agent?: RuntimeAgent
    }): Promise<RuntimeResult>
  }
  agents: { enter(agent: RuntimeAgent, parent?: RuntimeAgent): unknown }
  fiber: Fiber
}

async function defaultExport(path: string): Promise<unknown> {
  const module = await import(/* @vite-ignore */ realpathSync(path)) as { default: unknown }
  return module.default
}

const DSH = join(__dirname, '..', '..', 'dsh')
const cordisModule = await import(
  /* @vite-ignore */ realpathSync(join(DSH, 'packages', 'core', 'tools', 'node_modules', '@deepseek-ai', 'cordis', 'lib', 'index.js'))
) as { Context: new () => RuntimeContext }
const ToolRuntime = await defaultExport(join(DSH, 'packages', 'core', 'tools', 'lib', 'index.js'))
const SystemPrompt = await defaultExport(join(DSH, 'packages', 'core', 'system-prompt', 'lib', 'index.js'))
const AgentRegistry = await defaultExport(join(DSH, 'packages', 'core', 'agent', 'lib', 'index.js'))
const UserQuestionService = await defaultExport(join(DSH, 'packages', 'interaction', 'user-questions', 'lib', 'index.js'))
const toolAskUser = await import(
  /* @vite-ignore */ realpathSync(join(DSH, 'packages', 'interaction', 'tool-ask-user', 'lib', 'index.js'))
) as { name: string; apply(ctx: RuntimeContext): void }
const legalAgent = await import('../agent/index.ts')

async function bootRuntime() {
  const temp = mkdtempSync(join(tmpdir(), 'lb-cross-exam-question-gate-'))
  const agent: RuntimeAgent = {
    id: SESSION,
    session: { id: SESSION, header: { cwd: join(temp, 'case'), delegationDepth: 0 } },
  }
  const calls: Call[] = []
  let sequence = 0
  let providerCalls = 0
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), temp, () => undefined, [REPO_SKILLS])
  const core = {
    endpoint: () => undefined,
    noteTurnBlocked: () => {},
    clearTurnBlocked: () => {},
    sheetHeld: () => false,
    externalLlmState: async () => ({
      enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true,
    }),
    skillQuestions: (skill: string) => remote.skillQuestions(skill),
  }
  const coreCall = vi.spyOn(CoreClient.prototype, 'call').mockImplementation(async (
    command: CoreCommand,
    body: Record<string, unknown>,
  ) => {
    calls.push({ command, body })
    if (command === 'task/begin') {
      sequence += 1
      return {
        ok: true,
        value: {
          task_id: `${TASK}-runtime-${sequence}`,
          case_id: CASE,
          skill: CROSS_EXAM_OPINION_SKILL,
          params: PARAMS,
          budget: BUDGET,
        },
      } as never
    }
    if (command === 'context') {
      return {
        ok: true,
        value: { l0: { text: '合成案件卡片' }, l1: { text: '合成任务输入', truncated: false, toc: [] } },
      } as never
    }
    if (command === 'tool' && body.tool === 'case_save_draft') return { ok: true, value: SAVED } as never
    return { ok: true, value: {} } as never
  })
  const ctx = new cordisModule.Context()
  try {
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(UserQuestionService)
    await ctx.plugin(toolAskUser)
    ctx.provide('lawbenchCore', core)
    await ctx.plugin({
      name: legalAgent.name,
      inject: legalAgent.inject,
      apply: legalAgent.apply,
    }, { appData: temp, validateContracts: false })
    ctx.agents.enter(agent, undefined)
    ctx.on('user-questions/request', ((request: { questions: Array<{ id: string }> }) => {
      providerCalls += 1
      return {
        answers: request.questions.map((question) => ({
          id: question.id,
          selected: [`合成回答：${question.id}`],
        })),
      }
    }) as never)
  } catch (error) {
    coreCall.mockRestore()
    await ctx.fiber.dispose().catch(() => undefined)
    rmSync(temp, { recursive: true, force: true })
    throw error
  }

  return {
    ctx,
    agent,
    calls,
    providerCalls: () => providerCalls,
    writes: () => calls.filter((call) =>
      call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool))),
    async dispose() {
      await ctx.fiber.dispose().catch(() => undefined)
      coreCall.mockRestore()
      rmSync(temp, { recursive: true, force: true })
    },
  }
}

describe('cross-exam-opinion 必问闸门真实 ToolRuntime 接线', () => {
  it('未问先写被实际 ToolRuntime 拒绝；一次联合提问的最终结构化答案绑定同一任务后放行', async () => {
    const env = await bootRuntime()
    try {
      expect((await env.ctx.waterfall('agent/pre-step', { agent: env.agent, step: 1 }, async () => enter())).kind)
        .toBe('enter')
      const runTool = (name: string, callId: string, args: unknown) => env.ctx.tools.execute({
        signal: new AbortController().signal,
        callId,
        name,
        arguments: args,
        agent: env.agent,
      })

      const denied = await runTool('case_save_draft', 'save-before-ask', {
        title: '质证意见', content: '合成正文',
      })
      expect(denied.isError).toBe(true)
      expect(JSON.stringify(denied.content)).toContain(questionRequirementDenial(QUESTIONS))
      expect(env.writes()).toEqual([])

      const asked = await runTool('ask_user_question', 'joint-ask', askArgs(QUESTIONS))
      expect(asked.isError).toBe(false)
      expect(env.providerCalls()).toBe(1)
      expect(env.writes()).toEqual([])

      const saved = await runTool('case_save_draft', 'save-after-ask', {
        title: '质证意见', content: '合成正文',
      })
      expect(saved.isError).toBe(false)
      expect(env.writes()).toHaveLength(1)
      expect(env.writes()[0]?.body.tool).toBe('case_save_draft')
    } finally {
      await env.dispose()
    }
  })
})
