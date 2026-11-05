import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_DRAFT_SKILL,
  CONTRACT_REVIEW_SKILL,
  CRIMINAL_APPLICATIONS_SKILL,
  CROSS_EXAM_OPINION_SKILL,
  DEFENSE_OPINION_SKILL,
  DOC_REVISE_SKILL,
  GENERAL_DRAFTING_SKILL,
  LITIGATION_DOCS_SKILL,
  LegalAgent,
  QUESTION_GATED_TOOLS,
  SKILL_QUESTIONS_UNAVAILABLE,
  questionRequirementDenial,
  questionsBeforeReadDenial,
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

const CASE = 'case-litigation-question-order'
const SESSION = 'session-litigation-question-order'
const OTHER_SESSION = 'session-litigation-question-order-other'
const TASK = 'T-litigation-question-order'
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const QUESTIONS = ['doc_type', 'stance', 'court', 'claims'] as const
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const READ_MATERIAL = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
)) as unknown
const SAVED = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
)) as unknown
const WIKI = {
  section: '概览',
  text: '合成案件概览',
  updated_at: null,
  stale: false,
}
const EDIT_LIST = {
  path: 'outputs/合成修改清单.json',
  accepted: 1,
  out_of_scope: [],
}
const NO_LOG: Logger = () => {}

type Question = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<Question[]>
type Call = { command: CoreCommand; body: Record<string, unknown> }

class MemoryCore extends CoreClient {
  readonly calls: Call[] = []
  private sequence = 0

  constructor(private readonly skill: string | null = LITIGATION_DOCS_SKILL) {
    super(() => undefined, NO_LOG)
  }

  writes(): Call[] {
    return this.calls.filter((call) =>
      call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool)))
  }

  toolNames(): string[] {
    return this.calls.filter((call) => call.command === 'tool').map((call) => String(call.body.tool))
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
    if (command === 'tool') {
      const tool = body.tool
      if (tool === 'case_read_material') return { ok: true, value: READ_MATERIAL } as unknown as CoreResult<T>
      if (tool === 'case_read_wiki') return { ok: true, value: WIKI } as unknown as CoreResult<T>
      if (tool === 'case_save_draft') return { ok: true, value: SAVED } as unknown as CoreResult<T>
      if (tool === 'case_save_edit_list') return { ok: true, value: EDIT_LIST } as unknown as CoreResult<T>
    }
    return { ok: true, value: {} } as unknown as CoreResult<T>
  }
}

const agentObj = (id = SESSION) => ({
  id,
  session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成诉讼材料' } },
})
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

function structuredQuestions(ids: readonly string[] = QUESTIONS) {
  return ids.map((id) => ({
    id,
    question: `请确认 ${id}`,
    header: '必问',
    options: [{ label: `确认 ${id}`, description: '合成测试选项' }],
  }))
}

function askArgs(ids: readonly string[] = QUESTIONS) {
  return { questions: structuredQuestions(ids) }
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
    false,
    true,
  )
}

describe('litigation-docs 先问后读 UNIT', () => {
  it('实际 Host 固定四问；材料/Wiki 直调与写入均零 Core 调用，检索和清单仍可用', async () => {
    const resolve = currentHostQuestions()
    const machineQuestions = await resolve(LITIGATION_DOCS_SKILL)
    expect(machineQuestions.map((question) => question.key)).toEqual([...QUESTIONS])
    expect(machineQuestions.map((question) => question.fromMaterials)).toEqual([false, true, true, false])

    const core = new MemoryCore()
    const agent = makeAgent(core, resolve)
    const { decision, state } = await start(agent)
    expect(decision.kind).toBe('enter')
    expect(state?.requiredQuestionIds).toEqual([...QUESTIONS])
    expect(state?.questionsBeforeMaterialRead).toBe(true)

    const coreCalls = core.calls.length
    const toolCalls = state!.toolCalls
    const modelCalls = state!.modelCalls
    const elapsedAt = Date.now()
    for (const [tool, args] of [
      ['case_read_material', { name: '借条' }],
      ['case_read_wiki', { section: '概览' }],
    ] as const) {
      for (let attempt = 0; attempt < 3; attempt++) {
        expect(agent.preTool(SESSION, tool, args)).toEqual({
          kind: 'deny',
          reason: questionsBeforeReadDenial(QUESTIONS),
        })
        await expect(agent.executeTool(SESSION, tool, args))
          .rejects.toThrow(questionsBeforeReadDenial(QUESTIONS))
      }
    }
    expect(state!.toolCalls).toBe(toolCalls)
    expect(state!.modelCalls).toBe(modelCalls)
    expect(state!.budgetHit).toBe(false)
    expect(state!.elapsedSeconds(elapsedAt)).toBe(0)
    expect(core.calls.length).toBe(coreCalls)

    expect(agent.preTool(SESSION, 'case_search', { query: '合成法院' })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_list_materials', {})).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'skill', { name: LITIGATION_DOCS_SKILL })).toEqual({ kind: 'allow' })

    state!.addReply('合成诉讼文书正文')
    const draft = { title: '民事起诉状', content: '合成诉讼文书正文' }
    const editList = {
      name: '借条',
      edits: [{ id: 1, para: 1, action: 'delete', find: '合成原文', comment: '合成修改' }],
    }
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    expect(agent.preTool(SESSION, 'case_save_edit_list', editList)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', draft))
      .rejects.toThrow(questionRequirementDenial(QUESTIONS))
    expect(await agent.saveUnfinished(state!)).toBe(false)

    state!.toolCalls = state!.budget.tool_calls
    state!.modelCalls = state!.budget.model_calls
    state!.budgetHit = true
    expect(agent.preTool(SESSION, 'case_read_material', { name: '借条' })).toEqual({
      kind: 'deny',
      reason: questionsBeforeReadDenial(QUESTIONS),
    })
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    expect(core.writes()).toEqual([])
    expect(core.toolNames()).toEqual([])
  })

  it('错误、缺项、重复、空白、失败、取消、旧任务与跨会话结果均不解锁', async () => {
    const core = new MemoryCore()
    const agent = makeAgent(core, currentHostQuestions())
    const { state } = await start(agent)
    const invalidAsks = [
      { questions: [] },
      askArgs([...QUESTIONS, 'confirm_scope']),
      askArgs(['doc_type', 'stance', 'court']),
      {
        questions: [
          { id: 'doc_type', question: '请确认 doc_type' },
          { id: 'doc_type', question: '请再次确认 doc_type' },
          ...structuredQuestions(['stance', 'court', 'claims']),
        ],
      },
      {
        questions: [
          { id: ' ', question: '请确认 doc_type' },
          ...structuredQuestions(['stance', 'court', 'claims']),
        ],
      },
      {
        questions: [
          { id: 'doc_type', question: ' ' },
          ...structuredQuestions(['stance', 'court', 'claims']),
        ],
      },
      { questions: JSON.stringify(structuredQuestions()) },
    ]
    for (const [index, args] of invalidAsks.entries()) {
      expect(agent.preTool(SESSION, 'ask_user_question', args, askIdentity(`invalid-${index}`)))
        .toMatchObject({ kind: 'deny' })
      expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])
    }

    const failed = askIdentity('failed-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), failed)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, failed, {
      isError: true,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })) },
    })
    expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])

    const cancelled = askIdentity('cancelled-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), cancelled)).toEqual({ kind: 'allow' })
    agent.cancelQuestionAsk(SESSION, {
      name: 'ask_user_question',
      callId: cancelled.callId,
      token: cancelled.token,
      agent: { id: SESSION },
    })
    observe(agent, SESSION, cancelled, {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })) },
    })
    expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])

    const blank = askIdentity('blank-answers')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), blank)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, blank, {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: ['  '], custom: ' ' })) },
    })
    expect(state?.missingQuestionIds()).toEqual([...QUESTIONS])

    for (const [index, answers] of [
      [{ id: 'confirm_scope', selected: ['合成回答'], custom: '' }],
      [
        { id: 'doc_type', selected: ['民事起诉状'], custom: '' },
        { id: 'doc_type', selected: ['民事答辩状'], custom: '' },
      ],
      [
        { id: ' ', selected: ['合成回答'], custom: '' },
        ...QUESTIONS.slice(1).map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })),
      ],
    ].entries()) {
      const malformed = askIdentity(`malformed-result-${index}`)
      expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), malformed)).toEqual({ kind: 'allow' })
      observe(agent, SESSION, malformed, { isError: false, value: { answers } })
      expect(state?.missingQuestionIds()).not.toEqual([])
    }

    const partial = askIdentity('partial-answers')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), partial)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, partial, {
      isError: false,
      value: {
        answers: [
          { id: 'doc_type', selected: ['民事起诉状'], custom: '' },
          { id: 'stance', selected: [], custom: '' },
          { id: 'court', selected: ['合成法院'], custom: '' },
        ],
      },
    })
    expect(state?.missingQuestionIds()).not.toEqual([])
    expect(agent.preTool(SESSION, 'case_read_material', { name: '借条' })).toMatchObject({ kind: 'deny' })

    const stale = askIdentity('stale-task-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), stale)).toEqual({ kind: 'allow' })
    const fresh = taskState(QUESTIONS, `${TASK}-fresh`)
    agent.tasks.set(SESSION, fresh)
    observe(agent, SESSION, stale, {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })) },
    })
    expect(fresh.missingQuestionIds()).toEqual([...QUESTIONS])

    const crossSession = askIdentity('cross-session-result')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), crossSession)).toEqual({ kind: 'allow' })
    observe(agent, OTHER_SESSION, crossSession, {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })) },
    })
    expect(fresh.missingQuestionIds()).toEqual([...QUESTIONS])
    observe(agent, SESSION, crossSession, { isError: true })
    expect(fresh.missingQuestionIds()).toEqual([...QUESTIONS])
    expect(core.toolNames()).toEqual([])

    const valid = askIdentity('correct-joint-four')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), valid)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, valid, {
      isError: false,
      value: { answers: QUESTIONS.map((id) => ({ id, selected: [`确认 ${id}`], custom: '' })) },
    })
    expect(fresh.questionsAnswered).toBe(true)
    expect(agent.preTool(SESSION, 'case_read_material', { name: '借条' })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_read_wiki', { section: '概览' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_read_material', { name: '借条' })
    await agent.executeTool(SESSION, 'case_read_wiki', { section: '概览' })
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '民事起诉状', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', { title: '民事起诉状', content: '合成正文' })
    expect(core.toolNames()).toEqual(['case_read_material', 'case_read_wiki', 'case_save_draft'])
  })

  it('默认关闭；其它七类 Skill 与 NONE 不启用先问后读，诉讼目录不可用时 fail closed', async () => {
    const plain = new TaskState(TASK, BUDGET, PARAMS)
    expect(plain.questionsBeforeMaterialRead).toBe(false)

    const resolve = currentHostQuestions()
    for (const skill of [
      CONTRACT_REVIEW_SKILL,
      DOC_REVISE_SKILL,
      GENERAL_DRAFTING_SKILL,
      CONTRACT_DRAFT_SKILL,
      CROSS_EXAM_OPINION_SKILL,
      CRIMINAL_APPLICATIONS_SKILL,
      DEFENSE_OPINION_SKILL,
      null,
    ] as const) {
      const core = new MemoryCore(skill)
      const agent = makeAgent(core, resolve)
      const { decision, state } = await start(agent)
      expect(decision.kind).toBe('enter')
      expect(state?.questionsBeforeMaterialRead).toBe(false)
      expect(agent.preTool(SESSION, 'case_read_material', { name: '合成材料' })).toEqual({ kind: 'allow' })
      expect(agent.preTool(SESSION, 'case_read_wiki', { section: '概览' })).toEqual({ kind: 'allow' })
    }

    for (const resolver of [
      undefined,
      async () => [
        { key: 'doc_type', question: '问一', fromMaterials: false },
        { key: 'doc_type', question: '问二', fromMaterials: true },
      ],
      async () => [{ key: 'Bad Key', question: '', fromMaterials: false }],
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
  })
})

type Fiber = { dispose(): Promise<void> }
type RuntimeAgent = {
  id: string
  session: { id: string; header: { cwd: string; delegationDepth: number } }
}
type RuntimeResult = {
  isError: boolean
  value?: unknown
  content: unknown[]
  error?: { message?: string; info?: { code?: string } }
}
type JsonSchemaLike = {
  type?: string
  properties?: Record<string, JsonSchemaLike>
  items?: JsonSchemaLike
}
type RuntimeContext = {
  provide(name: string, value: unknown): void
  plugin(plugin: unknown, config?: unknown): Promise<Fiber>
  on(event: string, listener: (...args: never[]) => unknown, options?: unknown): () => void
  waterfall<T>(event: string, payload: unknown, next: () => Promise<T>): Promise<T>
  tools: {
    get(name: string, scope?: RuntimeAgent): { parameters?: Record<string, unknown> } | undefined
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
  const temp = mkdtempSync(join(tmpdir(), 'lb-litigation-question-order-'))
  const agent: RuntimeAgent = {
    id: SESSION,
    session: { id: SESSION, header: { cwd: join(temp, 'case'), delegationDepth: 0 } },
  }
  const calls: Call[] = []
  let sequence = 0
  let answerCalls = 0
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
          skill: LITIGATION_DOCS_SKILL,
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
    if (command === 'tool') {
      if (body.tool === 'case_read_material') return { ok: true, value: READ_MATERIAL } as never
      if (body.tool === 'case_read_wiki') return { ok: true, value: WIKI } as never
      if (body.tool === 'case_save_draft') return { ok: true, value: SAVED } as never
    }
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
      answerCalls += 1
      return {
        answers: request.questions.map((question) => ({
          id: question.id,
          selected: [`合成回答：${question.id}`],
          custom: '',
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
    answerCalls: () => answerCalls,
    toolNames: () => calls.filter((call) => call.command === 'tool').map((call) => String(call.body.tool)),
    writes: () => calls.filter((call) =>
      call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool))),
    async dispose() {
      await ctx.fiber.dispose().catch(() => undefined)
      coreCall.mockRestore()
      rmSync(temp, { recursive: true, force: true })
    },
  }
}

describe('litigation-docs 先问后读真实 ToolRuntime 接线', () => {
  it('真实问答 schema 先拒材料/Wiki，联合四答后才放行读取与保存', async () => {
    const env = await bootRuntime()
    try {
      const definition = env.ctx.tools.get('ask_user_question', env.agent)
      expect(definition).toBeDefined()
      const parameters = definition!.parameters as JsonSchemaLike
      const questionsSchema = parameters.properties?.questions
      const optionsSchema = questionsSchema?.items?.properties?.options
      expect(questionsSchema?.type).toBe('array')
      expect(questionsSchema?.items?.type).toBe('object')
      expect(optionsSchema?.type).toBe('array')
      expect(optionsSchema?.items?.type).toBe('object')

      expect((await env.ctx.waterfall('agent/pre-step', { agent: env.agent, step: 1 }, async () => enter())).kind)
        .toBe('enter')
      const runTool = (name: string, callId: string, args: unknown) => env.ctx.tools.execute({
        signal: new AbortController().signal,
        callId,
        name,
        arguments: args,
        agent: env.agent,
      })

      for (const [name, args] of [
        ['case_read_material', { name: '借条' }],
        ['case_read_wiki', { section: '概览' }],
      ] as const) {
        const denied = await runTool(name, `read-before-ask-${name}`, args)
        expect(denied.isError).toBe(true)
        expect(JSON.stringify(denied.content)).toContain(questionsBeforeReadDenial(QUESTIONS))
      }
      expect(env.toolNames()).toEqual([])

      const stringQuestions = await runTool('ask_user_question', 'questions-as-json-string', {
        questions: JSON.stringify(structuredQuestions()),
      })
      expect(stringQuestions.isError).toBe(true)
      expect(env.answerCalls()).toBe(0)

      const stringOptions = await runTool('ask_user_question', 'options-as-strings', {
        questions: QUESTIONS.map((id) => ({
          id,
          question: `请确认 ${id}`,
          options: [`确认 ${id}`],
        })),
      })
      expect(stringOptions.isError).toBe(true)
      expect(env.answerCalls()).toBe(0)
      expect(env.toolNames()).toEqual([])

      const asked = await runTool('ask_user_question', 'correct-joint-four', askArgs())
      expect(asked.isError).toBe(false)
      expect(env.answerCalls()).toBe(1)
      expect(env.toolNames()).toEqual([])

      const readMaterial = await runTool('case_read_material', 'read-after-ask-material', { name: '借条' })
      const readWiki = await runTool('case_read_wiki', 'read-after-ask-wiki', { section: '概览' })
      expect(readMaterial.isError).toBe(false)
      expect(readWiki.isError).toBe(false)

      const saved = await runTool('case_save_draft', 'save-after-ask', {
        title: '民事起诉状', content: '合成诉讼文书正文',
      })
      expect(saved.isError).toBe(false)
      expect(env.toolNames()).toEqual(['case_read_material', 'case_read_wiki', 'case_save_draft'])
      expect(env.writes()).toHaveLength(1)
    } finally {
      await env.dispose()
    }
  })
})
