// 案卷归档顺序与必问门：内存 Core、当前 Host 的 Skill 机器元数据，以及已安装 DSH 的
// Cordis / ToolRuntime / UserQuestionService 真实接线。不打开端口、不访问模型或网络。
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ARCHIVE_SKILL,
  CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL,
  CASE_LIST_BEFORE_SENTENCE_READ_DENIAL,
  CONTRACT_DRAFT_SKILL,
  CONTRACT_REVIEW_SKILL,
  CRIMINAL_APPLICATIONS_SKILL,
  CROSS_EXAM_OPINION_SKILL,
  DEFENSE_OPINION_SKILL,
  DOC_REVISE_SKILL,
  GENERAL_DRAFTING_SKILL,
  LegalAgent,
  LITIGATION_DOCS_SKILL,
  QUESTION_GATED_TOOLS,
  SENTENCE_CALC_SKILL,
  apply as applyLegalAgent,
  inject as legalAgentInject,
  name as legalAgentName,
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

const CASE = 'case-archive-workflow'
const OTHER_CASE = 'case-archive-workflow-other'
const THIRD_CASE = 'case-archive-workflow-third'
const SESSION = 'session-archive-workflow'
const OTHER_SESSION = 'session-archive-workflow-other'
const TASK = 'T-archive-workflow'
const BUDGET: Budget = { model_calls: 32, tool_calls: 40, minutes: 45 }
const PARAMS: Params = { thinking: '低', window: '64K', max_tokens: 16384 }
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const LIST = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_list.result.json'),
  'utf8',
)) as unknown
const READ = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
)) as unknown
const SAVED = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
)) as unknown
const PLAN_ARGS = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_archive_plan.args.json'),
  'utf8',
)) as Record<string, unknown>
const MATCH = {
  catalog: '民事行政卷',
  items: [],
  unmatched: [],
  ignored: [],
} as const
const PLAN_RESULT = {
  path: `工作区/任务/${TASK}-1/归档方案.json`,
  missing_required: [],
  warnings: [],
} as const
const NO_LOG: Logger = () => {}

type Question = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<Question[]>
type Call = { command: CoreCommand; body: Record<string, unknown> }
type ListMode = 'valid' | 'failed' | 'invalid'

function currentHostQuestions(): Questions {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
  return (skillName: string) => remote.skillQuestions(skillName)
}

const resolveQuestions = currentHostQuestions()
const archiveQuestions = await resolveQuestions(ARCHIVE_SKILL)
const ARCHIVE_IDS = archiveQuestions.map((question) => question.key)

class MemoryCore extends CoreClient {
  readonly calls: Call[] = []
  private sequence = 0
  private deferredList: { promise: Promise<CoreResult>; resolve: (value: CoreResult) => void } | undefined

  constructor(
    private readonly skill: string | null = ARCHIVE_SKILL,
    private readonly listMode: ListMode = 'valid',
    private readonly caseIds: string[] = [],
  ) {
    super(() => undefined, NO_LOG)
  }

  toolNames(): string[] {
    return this.calls.filter((call) => call.command === 'tool').map((call) => String(call.body.tool))
  }

  deferNextList(): (value: unknown) => void {
    let resolve!: (value: CoreResult) => void
    const promise = new Promise<CoreResult>((done) => { resolve = done })
    this.deferredList = { promise, resolve }
    return (value: unknown) => resolve({ ok: true, value })
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
          case_id: this.caseIds.shift() ?? CASE,
          skill: this.skill,
          params: PARAMS,
          budget: BUDGET,
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'context') {
      return {
        ok: true,
        value: {
          l0: { text: '合成归档案件卡片' },
          l1: { text: '合成归档任务输入', truncated: false, toc: [] },
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'tool') {
      const tool = String(body.tool)
      if (tool === 'case_list_materials') {
        if (this.deferredList) {
          const response = await this.deferredList.promise
          this.deferredList = undefined
          return response as CoreResult<T>
        }
        if (this.listMode === 'failed') {
          return { ok: false, error: { code: 'INTERNAL', message: '合成清单失败' } } as CoreResult<T>
        }
        if (this.listMode === 'invalid') {
          return { ok: true, value: { materials: 'not-an-array', total: 'bad' } } as unknown as CoreResult<T>
        }
        return { ok: true, value: LIST } as unknown as CoreResult<T>
      }
      if (tool === 'case_archive_match') return { ok: true, value: MATCH } as unknown as CoreResult<T>
      if (tool === 'case_read_material') return { ok: true, value: READ } as unknown as CoreResult<T>
      if (tool === 'case_save_draft') return { ok: true, value: SAVED } as unknown as CoreResult<T>
      if (tool === 'case_save_archive_plan') return { ok: true, value: PLAN_RESULT } as unknown as CoreResult<T>
    }
    return { ok: true, value: {} } as unknown as CoreResult<T>
  }
}

const agentObj = (id = SESSION) => ({
  id,
  session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成归档案件' } },
})
const enter = () => ({ kind: 'enter' as const, messages: [] })

function makeAgent(core: CoreClient, skillQuestions: Questions = resolveQuestions): LegalAgent {
  return new LegalAgent(
    core,
    NO_LOG,
    () => {},
    () => {},
    () => false,
    () => false,
    async () => ({
      enabled: false,
      model: null,
      contextWindow: null,
      keyConfigured: false,
      supportsTools: true,
    }),
    skillQuestions,
  )
}

async function start(agent: LegalAgent, target = agentObj()) {
  const decision = await agent.preStep(target, 1, enter())
  return { decision, state: agent.tasks.get(target.id) }
}

function askArgs(ids: readonly string[] = ARCHIVE_IDS) {
  const byId = new Map(archiveQuestions.map((question) => [question.key, question.question]))
  return {
    questions: ids.map((id) => ({
      id,
      question: byId.get(id) ?? `合成未知问题 ${id}`,
      header: '归档必问',
      options: [{ label: `合成回答 ${id}`, description: '合成测试选项' }],
    })),
  }
}

function askIdentity(callId: string): QuestionExecutionIdentity {
  return { callId, token: Symbol(callId) }
}

function allAnswers() {
  return {
    answers: ARCHIVE_IDS.map((id) => ({
      id,
      selected: [`合成回答 ${id}`],
      custom: '',
    })),
  }
}

function observe(
  agent: LegalAgent,
  agentId: string,
  callId: string,
  token: symbol,
  result: Readonly<{ isError: boolean; value?: unknown }>,
): void {
  agent.observeToolResult({
    name: 'ask_user_question',
    callId,
    token,
    agent: { id: agentId },
  }, result)
}

function cancel(agent: LegalAgent, agentId: string, identity: QuestionExecutionIdentity): void {
  agent.cancelQuestionAsk(agentId, {
    name: 'ask_user_question',
    callId: identity.callId,
    token: identity.token,
    agent: { id: agentId },
  })
}

describe('案卷归档顺序、必问和写入闸门', () => {
  it('从当前 Host Skill 读取四项真实机器 ID', async () => {
    expect(ARCHIVE_IDS).toEqual(['catalog', 'result', 'jzl_no', 'fee_settled'])
    expect(archiveQuestions.map((question) => question.fromMaterials)).toEqual([true, false, false, false])
    expect(QUESTION_GATED_TOOLS).toEqual(new Set(['case_save_draft', 'case_save_edit_list']))
  })

  it('未成功列清单时 preTool 和直接执行都在 Core 与预算前拒绝，成功清单只解锁同一任务', async () => {
    const core = new MemoryCore()
    const agent = makeAgent(core)
    const { decision, state } = await start(agent)
    expect(decision.kind).toBe('enter')
    expect(state?.archiveWorkflow).toBe(true)
    expect(state?.requiredQuestionIds).toEqual(ARCHIVE_IDS)
    expect(state?.materialListConfirmedForReads).toBe(false)

    const before = core.calls.length
    const budgetCalls = state!.toolCalls
    expect(agent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({
      kind: 'deny',
      reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL,
    })
    await expect(agent.executeTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' }))
      .rejects.toThrow(CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL)
    expect(core.calls.length).toBe(before)
    expect(state!.toolCalls).toBe(budgetCalls)
    expect(state!.budgetHit).toBe(false)

    expect(agent.preTool(SESSION, 'case_read_material', { name: '借条' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_read_material', { name: '借条' })
    await agent.executeTool(SESSION, 'case_list_materials', {})
    expect(state?.materialListConfirmedForReads).toBe(true)
    expect(agent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })
    expect(core.toolNames()).toEqual(['case_read_material', 'case_list_materials', 'case_archive_match'])
  })

  it('Core 失败或结果契约不合法都不解锁匹配', async () => {
    for (const listMode of ['failed', 'invalid'] as const) {
      const core = new MemoryCore(ARCHIVE_SKILL, listMode)
      const agent = makeAgent(core)
      const { state } = await start(agent)
      await expect(agent.executeTool(SESSION, 'case_list_materials', {})).rejects.toThrow()
      expect(state?.materialListConfirmedForReads).toBe(false)
      expect(agent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({
        kind: 'deny',
        reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL,
      })
      await expect(agent.executeTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' }))
        .rejects.toThrow(CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL)
      expect(core.toolNames()).toEqual(['case_list_materials'])
    }
  })

  it('旧任务的迟到清单、新任务、新会话和案件身份隔离', async () => {
    const core = new MemoryCore(ARCHIVE_SKILL, 'valid', [CASE, OTHER_CASE, THIRD_CASE])
    const agent = makeAgent(core)
    const { state: oldState } = await start(agent)
    const resolveList = core.deferNextList()
    const pendingList = agent.executeTool(SESSION, 'case_list_materials', {})

    const { state: freshState } = await start(agent)
    const otherAgent = agentObj(OTHER_SESSION)
    const { state: otherState } = await start(agent, otherAgent)
    expect([oldState?.caseId, freshState?.caseId, otherState?.caseId]).toEqual([CASE, OTHER_CASE, THIRD_CASE])

    resolveList(LIST)
    await pendingList
    expect(oldState?.materialListConfirmedForReads).toBe(true)
    expect(freshState?.materialListConfirmedForReads).toBe(false)
    expect(otherState?.materialListConfirmedForReads).toBe(false)
    expect(agent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({
      kind: 'deny',
      reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL,
    })
    expect(agent.preTool(OTHER_SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({
      kind: 'deny',
      reason: CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL,
    })
  })

  it('草稿与归档方案都要四项最终非空答案；失败、取消、空答、迟到、错调用、错令牌、错会话和错案件都不算', async () => {
    const core = new MemoryCore()
    const agent = makeAgent(core)
    const { state } = await start(agent)
    expect(state).toBeDefined()

    const before = core.calls.length
    const budgetCalls = state!.toolCalls
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '归档核对表', content: '合成正文' })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(ARCHIVE_IDS),
    })
    expect(agent.preTool(SESSION, 'case_save_archive_plan', PLAN_ARGS)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(ARCHIVE_IDS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', { title: '归档核对表', content: '合成正文' }))
      .rejects.toThrow(questionRequirementDenial(ARCHIVE_IDS))
    await expect(agent.executeTool(SESSION, 'case_save_archive_plan', PLAN_ARGS))
      .rejects.toThrow(questionRequirementDenial(ARCHIVE_IDS))
    expect(core.calls.length).toBe(before)
    expect(state!.toolCalls).toBe(budgetCalls)
    expect(state!.budgetHit).toBe(false)

    const failed = askIdentity('archive-answer-failed')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), failed)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, failed.callId, failed.token, { isError: true, value: allAnswers() })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)

    const cancelled = askIdentity('archive-answer-cancelled')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), cancelled)).toEqual({ kind: 'allow' })
    cancel(agent, SESSION, cancelled)
    observe(agent, SESSION, cancelled.callId, cancelled.token, { isError: false, value: allAnswers() })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)

    const empty = askIdentity('archive-answer-empty')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), empty)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, empty.callId, empty.token, {
      isError: false,
      value: { answers: ARCHIVE_IDS.map((id) => ({ id, selected: ['  '], custom: ' ' })) },
    })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)

    const wrongSession = askIdentity('archive-answer-wrong-session')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), wrongSession)).toEqual({ kind: 'allow' })
    observe(agent, OTHER_SESSION, wrongSession.callId, wrongSession.token, { isError: false, value: allAnswers() })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)
    cancel(agent, SESSION, wrongSession)

    const wrongCall = askIdentity('archive-answer-wrong-call')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), wrongCall)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, 'not-the-call', wrongCall.token, { isError: false, value: allAnswers() })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)
    cancel(agent, SESSION, wrongCall)

    const wrongToken = askIdentity('archive-answer-wrong-token')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), wrongToken)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, wrongToken.callId, Symbol('not-the-token'), {
      isError: false,
      value: allAnswers(),
    })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)
    cancel(agent, SESSION, wrongToken)

    const wrongCase = askIdentity('archive-answer-wrong-case')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), wrongCase)).toEqual({ kind: 'allow' })
    const mutableState = state as unknown as { caseId: string }
    mutableState.caseId = OTHER_CASE
    observe(agent, SESSION, wrongCase.callId, wrongCase.token, { isError: false, value: allAnswers() })
    expect(state!.missingQuestionIds()).toEqual(ARCHIVE_IDS)
    mutableState.caseId = CASE
    cancel(agent, SESSION, wrongCase)

    const late = askIdentity('archive-answer-late-old-task')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), late)).toEqual({ kind: 'allow' })
    const { state: freshState } = await start(agent)
    observe(agent, SESSION, late.callId, late.token, { isError: false, value: allAnswers() })
    expect(freshState?.missingQuestionIds()).toEqual(ARCHIVE_IDS)

    const correct = askIdentity('archive-answer-correct-four')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), correct)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, correct.callId, correct.token, { isError: false, value: allAnswers() })
    expect(freshState?.questionsAnswered).toBe(true)
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '归档核对表', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_save_archive_plan', PLAN_ARGS)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', { title: '归档核对表', content: '合成正文' })
    await agent.executeTool(SESSION, 'case_save_archive_plan', PLAN_ARGS)
    expect(core.toolNames().slice(-2)).toEqual(['case_save_draft', 'case_save_archive_plan'])
  })

  it('既有九类和无 Skill 的匹配、方案、草稿与原先问后读语义不变', async () => {
    expect(new TaskState(TASK, BUDGET, PARAMS).archiveWorkflow).toBe(false)
    const known = [
      CONTRACT_REVIEW_SKILL,
      DOC_REVISE_SKILL,
      GENERAL_DRAFTING_SKILL,
      CONTRACT_DRAFT_SKILL,
      CROSS_EXAM_OPINION_SKILL,
      CRIMINAL_APPLICATIONS_SKILL,
      DEFENSE_OPINION_SKILL,
      LITIGATION_DOCS_SKILL,
      SENTENCE_CALC_SKILL,
    ] as const
    const oneQuestion: Questions = async () => [
      { key: 'required', question: '请确认合成必问项', fromMaterials: false },
    ]
    for (const skill of known) {
      const agent = makeAgent(new MemoryCore(skill), oneQuestion)
      const { decision, state } = await start(agent)
      expect(decision.kind).toBe('enter')
      expect(state?.archiveWorkflow).toBe(false)
      expect(state?.requiredQuestionIds).toEqual(['required'])
      expect(agent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({ kind: 'allow' })
      expect(agent.preTool(SESSION, 'case_save_archive_plan', PLAN_ARGS)).toEqual({ kind: 'allow' })
      expect(agent.preTool(SESSION, 'case_save_draft', { title: '合成草稿', content: '合成正文' })).toEqual({
        kind: 'deny',
        reason: questionRequirementDenial(['required']),
      })
      if (skill === LITIGATION_DOCS_SKILL) {
        expect(agent.preTool(SESSION, 'case_read_material', { name: '合成材料' })).toEqual({
          kind: 'deny',
          reason: questionsBeforeReadDenial(['required']),
        })
      } else if (skill === SENTENCE_CALC_SKILL) {
        expect(agent.preTool(SESSION, 'case_read_material', { name: '合成材料' })).toEqual({
          kind: 'deny',
          reason: CASE_LIST_BEFORE_SENTENCE_READ_DENIAL,
        })
      } else {
        expect(agent.preTool(SESSION, 'case_read_material', { name: '合成材料' })).toEqual({ kind: 'allow' })
      }
    }

    const noneAgent = makeAgent(new MemoryCore(null), async () => [])
    const { decision, state } = await start(noneAgent)
    expect(decision.kind).toBe('enter')
    expect(state?.archiveWorkflow).toBe(false)
    expect(state?.requiredQuestionIds).toEqual([])
    expect(noneAgent.preTool(SESSION, 'case_archive_match', { catalog: '民事行政卷' })).toEqual({ kind: 'allow' })
    expect(noneAgent.preTool(SESSION, 'case_save_archive_plan', PLAN_ARGS)).toEqual({ kind: 'allow' })
    expect(noneAgent.preTool(SESSION, 'case_save_draft', { title: '合成草稿', content: '合成正文' }))
      .toEqual({ kind: 'allow' })
  })
})

const DSH = join(__dirname, '..', '..', 'dsh')
type Fiber = { dispose(): Promise<void> }
type TestAgent = {
  id: string
  session: {
    id: string
    header: { cwd: string; delegationDepth: number }
  }
}
type RuntimeExecution = {
  name: string
  callId: string
  token: symbol
  arguments?: unknown
  agent?: TestAgent
}
type RuntimeResult = {
  isError: boolean
  value?: unknown
  content: unknown[]
  error?: { message?: string; info?: { code?: string } }
}
type TestContext = {
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
      agent?: TestAgent
    }): Promise<RuntimeResult>
  }
  agents: {
    enter(agent: TestAgent, parent?: TestAgent): unknown
  }
  fiber: Fiber
}

async function defaultExport(path: string): Promise<unknown> {
  const module = await import(/* @vite-ignore */ realpathSync(path)) as { default: unknown }
  return module.default
}

const cordisModule = await import(
  /* @vite-ignore */ realpathSync(join(DSH, 'packages', 'core', 'tools', 'node_modules', '@deepseek-ai', 'cordis', 'lib', 'index.js'))
) as { Context: new () => TestContext }
const ToolRuntime = await defaultExport(join(DSH, 'packages', 'core', 'tools', 'lib', 'index.js'))
const SystemPrompt = await defaultExport(join(DSH, 'packages', 'core', 'system-prompt', 'lib', 'index.js'))
const AgentRegistry = await defaultExport(join(DSH, 'packages', 'core', 'agent', 'lib', 'index.js'))
const UserQuestionService = await defaultExport(join(DSH, 'packages', 'interaction', 'user-questions', 'lib', 'index.js'))
const toolAskUser = await import(
  /* @vite-ignore */ realpathSync(join(DSH, 'packages', 'interaction', 'tool-ask-user', 'lib', 'index.js'))
) as { name: string; apply(ctx: TestContext): void }

type RuntimeCore = {
  calls: Call[]
  result(command: string, body: Record<string, unknown>): unknown
}

function makeRuntimeCore(): RuntimeCore {
  let sequence = 0
  const calls: Call[] = []
  return {
    calls,
    result(command: string, body: Record<string, unknown>) {
      if (command === 'task/begin') {
        sequence += 1
        return {
          ok: true,
          value: {
            task_id: `T-runtime-archive-${sequence}`,
            case_id: CASE,
            skill: ARCHIVE_SKILL,
            params: PARAMS,
            budget: BUDGET,
          },
        }
      }
      if (command === 'context') {
        return {
          ok: true,
          value: {
            l0: { text: '合成归档案件卡片' },
            l1: { text: '合成归档任务输入', truncated: false, toc: [] },
          },
        }
      }
      if (command === 'tool') {
        const tool = String(body.tool)
        if (tool === 'case_list_materials') return { ok: true, value: LIST }
        if (tool === 'case_archive_match') return { ok: true, value: MATCH }
        if (tool === 'case_read_material') return { ok: true, value: READ }
        if (tool === 'case_save_draft') return { ok: true, value: SAVED }
        if (tool === 'case_save_archive_plan') return { ok: true, value: PLAN_RESULT }
      }
      return { ok: true, value: {} }
    },
  }
}

function makeRuntimeAgent(id: string, cwd: string): TestAgent {
  return { id, session: { id, header: { cwd, delegationDepth: 0 } } }
}

async function bootRuntime() {
  const temp = mkdtempSync(join(tmpdir(), 'lb-archive-runtime-'))
  const agent = makeRuntimeAgent(SESSION, join(temp, SESSION))
  const runtimeCore = makeRuntimeCore()
  const coreCall = vi.spyOn(CoreClient.prototype, 'call').mockImplementation(async (command: string, body: Record<string, unknown>) => {
    runtimeCore.calls.push({ command: command as CoreCommand, body })
    return runtimeCore.result(command, body) as never
  })
  const ctx = new cordisModule.Context()
  let providerCalls = 0
  const observed: Array<{ callId: string; result: RuntimeResult }> = []
  try {
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(UserQuestionService)
    await ctx.plugin(toolAskUser)
    ctx.provide('lawbenchCore', {
      endpoint: () => undefined,
      noteTurnBlocked: () => {},
      clearTurnBlocked: () => {},
      sheetHeld: () => false,
      externalLlmState: async () => ({
        enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true,
      }),
      skillQuestions: async (skill: string) => skill === ARCHIVE_SKILL ? archiveQuestions : [],
    })
    await ctx.plugin({ name: legalAgentName, inject: legalAgentInject, apply: applyLegalAgent }, {
      appData: temp,
      validateContracts: false,
    })
    ctx.agents.enter(agent, undefined)
    ctx.on('user-questions/request', ((request: {
      questions: Array<{ id: string }>
    }) => {
      providerCalls++
      return {
        answers: request.questions.map((question) => ({
          id: question.id,
          selected: [`合成回答 ${question.id}`],
        })),
      }
    }) as never)
    ctx.on('tools/result', ((execution: RuntimeExecution, result: RuntimeResult) => {
      observed.push({ callId: execution.callId, result })
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
    runtimeCore,
    observed,
    providerCalls: () => providerCalls,
    async dispose() {
      await ctx.fiber.dispose().catch(() => undefined)
      coreCall.mockRestore()
      rmSync(temp, { recursive: true, force: true })
    },
  }
}

type RuntimeEnv = Awaited<ReturnType<typeof bootRuntime>>

async function startRuntime(env: RuntimeEnv) {
  return env.ctx.waterfall('agent/pre-step', { agent: env.agent, step: 1 }, async () => ({
    kind: 'enter' as const,
    messages: [],
  }))
}

async function runRuntimeTool(
  env: RuntimeEnv,
  name: string,
  callId: string,
  args: unknown,
  signal = new AbortController().signal,
) {
  return env.ctx.tools.execute({ signal, callId, name, arguments: args, agent: env.agent })
}

function observedRuntime(env: RuntimeEnv, callId: string): RuntimeResult {
  const found = env.observed.findLast((entry) => entry.callId === callId)
  if (!found) throw new Error(`tools/result did not observe ${callId}`)
  return found.result
}

function runtimeText(result: RuntimeResult): string {
  return JSON.stringify(result.content)
}

describe('归档闸门真实 DSH 接线', () => {
  it('未知问题 ID 在 provider 和暂停前拒绝；清单与四答控制匹配、草稿和方案', async () => {
    const pause = vi.spyOn(TaskState.prototype, 'pause')
    const env = await bootRuntime()
    try {
      expect((await startRuntime(env)).kind).toBe('enter')

      const unknown = await runRuntimeTool(env, 'ask_user_question', 'archive-unknown', askArgs(['unknown']))
      expect(unknown.isError).toBe(true)
      expect(observedRuntime(env, 'archive-unknown')).toEqual(unknown)
      expect(env.providerCalls()).toBe(0)
      expect(pause).not.toHaveBeenCalled()

      const writeDenied = await runRuntimeTool(env, 'case_save_archive_plan', 'plan-before-answers', PLAN_ARGS)
      expect(writeDenied.isError).toBe(true)
      expect(runtimeText(writeDenied)).toContain(questionRequirementDenial(ARCHIVE_IDS))
      expect(env.runtimeCore.calls.filter((call) => call.command === 'tool')).toEqual([])

      const matchDenied = await runRuntimeTool(env, 'case_archive_match', 'match-before-list', {
        catalog: '民事行政卷',
      })
      expect(matchDenied.isError).toBe(true)
      expect(runtimeText(matchDenied)).toContain(CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL)
      expect(env.runtimeCore.calls.filter((call) => call.command === 'tool')).toEqual([])

      const read = await runRuntimeTool(env, 'case_read_material', 'read-before-questions', { name: '借条' })
      expect(read.isError).toBe(false)
      const listed = await runRuntimeTool(env, 'case_list_materials', 'list-archive', {})
      expect(listed.isError).toBe(false)
      const matched = await runRuntimeTool(env, 'case_archive_match', 'match-after-list', {
        catalog: '民事行政卷',
      })
      expect(matched.isError).toBe(false)

      const asked = await runRuntimeTool(env, 'ask_user_question', 'ask-four-archive', askArgs())
      expect(asked.isError).toBe(false)
      expect(observedRuntime(env, 'ask-four-archive')).toEqual(asked)
      expect(env.providerCalls()).toBe(1)
      expect(pause).toHaveBeenCalled()

      const draft = await runRuntimeTool(env, 'case_save_draft', 'draft-after-answers', {
        title: '归档核对表',
        content: '合成归档核对表正文',
      })
      expect(draft.isError).toBe(false)
      const plan = await runRuntimeTool(env, 'case_save_archive_plan', 'plan-after-answers', PLAN_ARGS)
      expect(plan.isError).toBe(false)
      expect(env.runtimeCore.calls
        .filter((call) => call.command === 'tool')
        .map((call) => String(call.body.tool)))
        .toEqual([
          'case_read_material',
          'case_list_materials',
          'case_archive_match',
          'case_save_draft',
          'case_save_archive_plan',
        ])
    } finally {
      await env.dispose()
      pause.mockRestore()
    }
  })
})
