import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  DEFENSE_OPINION_SKILL,
  DENY_BUDGET,
  LegalAgent,
} from '../agent/index.ts'
import {
  type Budget,
  type Params,
  type QuestionExecutionIdentity,
} from '../agent/task-state.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'
import { CoreClient, type CoreCommand, type CoreResult, type Logger } from '../shared/core-client.ts'

const CASE = 'case-defense-read-bound-20261101-114236'
const SESSION = 'session-defense-read-bound-20261101-114236'
const TASK = 'T-defense-read-bound-20261101-114236'
const BUDGET: Budget = { model_calls: 8, tool_calls: 32, minutes: 45 }
const BUDGET_AT_READ_BOUNDARY: Budget = { ...BUDGET, tool_calls: 1 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const DEFENSE_IDS = ['direction', 'stage', 'key_points'] as const
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const SEARCH_ARGS = { query: '合成资金往来' }
const SEARCH_RESULT = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_search.result.json'),
  'utf8',
)) as unknown
const READ_RESULT = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
)) as Record<string, unknown>
const MALFORMED_SEARCH_RESULT = {
  hits: 'not-an-array',
  total: 1,
  truncated: false,
}
const NO_LOG: Logger = () => {}
const READ_TOOLS = new Set(['case_read_input', 'case_read_material', 'case_read_wiki'])

type SkillQuestion = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<SkillQuestion[]>
type Call = { command: CoreCommand; body: Record<string, unknown> }
type AnswerRow = { id: string; selected: string[]; custom: string }
type SearchReply =
  | { ok: true; value: unknown }
  | { ok: false; error: { code: string; message: string } }

class MemoryCore extends CoreClient {
  readonly calls: Call[] = []
  private sequence = 0

  constructor(
    private readonly skill: string | null = DEFENSE_OPINION_SKILL,
    private readonly searchReply: SearchReply = { ok: true, value: SEARCH_RESULT },
    private readonly readReply: Record<string, unknown> = READ_RESULT,
    private readonly budget: Budget = BUDGET,
  ) {
    super(() => undefined, NO_LOG)
  }

  toolNames(): string[] {
    return this.calls
      .filter((call) => call.command === 'tool')
      .map((call) => String(call.body.tool))
  }

  readCalls(): Call[] {
    return this.calls.filter((call) =>
      call.command === 'tool' && READ_TOOLS.has(String(call.body.tool)))
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
          budget: this.budget,
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'context') {
      return {
        ok: true,
        value: {
          l0: { text: '合成辩护案件卡片' },
          l1: { text: '合成辩护任务输入', truncated: false, toc: [] },
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'tool') {
      if (body.tool === 'case_search') return this.searchReply as unknown as CoreResult<T>
      if (body.tool === 'case_read_material') {
        return { ok: true, value: this.readReply } as unknown as CoreResult<T>
      }
    }
    return { ok: true, value: {} } as unknown as CoreResult<T>
  }
}

const testAgent = (id = SESSION) => ({
  id,
  session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成辩护意见' } },
})
const enter = () => ({ kind: 'enter' as const, messages: [] })

function currentHostQuestions(): Questions {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
  return (skillName: string) => remote.skillQuestions(skillName)
}

function makeAgent(core: CoreClient, skillQuestions: Questions): LegalAgent {
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

async function start(agent: LegalAgent, id = SESSION) {
  const decision = await agent.preStep(testAgent(id), 1, enter())
  return { decision, state: agent.tasks.get(id) }
}

async function started(
  skill: string | null = DEFENSE_OPINION_SKILL,
  options: {
    searchReply?: SearchReply
    readReply?: Record<string, unknown>
    budget?: Budget
    id?: string
  } = {},
) {
  const id = options.id ?? SESSION
  const core = new MemoryCore(skill, options.searchReply, options.readReply, options.budget)
  const agent = makeAgent(core, currentHostQuestions())
  const result = await start(agent, id)
  return { agent, core, id, ...result }
}

function askArgs(ids: readonly string[]) {
  return {
    questions: ids.map((id) => ({
      id,
      question: `请确认辩护事项 ${id}`,
      header: '必问',
      options: [{ label: `确认 ${id}`, description: '合成辩护测试选项' }],
    })),
  }
}

function askIdentity(callId: string): QuestionExecutionIdentity {
  return { callId, token: Symbol(callId) }
}

function observe(
  agent: LegalAgent,
  agentId: string,
  identity: QuestionExecutionIdentity,
  result: Readonly<{ isError: boolean; value?: unknown }>,
) {
  agent.observeToolResult({
    name: 'ask_user_question',
    callId: identity.callId,
    token: identity.token,
    agent: { id: agentId },
  }, result)
}

function answerRows(ids: readonly string[]): AnswerRow[] {
  return ids.map((id) => ({ id, selected: [`合成辩护回答 ${id}`], custom: '' }))
}

function answerDefenseQuestions(
  agent: LegalAgent,
  state: NonNullable<Awaited<ReturnType<typeof start>>['state']>,
  id = SESSION,
  callId = `answer-${id}`,
) {
  expect(state.requiredQuestionIds).toEqual([...DEFENSE_IDS])
  const identity = askIdentity(callId)
  expect(agent.preTool(id, 'ask_user_question', askArgs(state.requiredQuestionIds), identity))
    .toEqual({ kind: 'allow' })
  observe(agent, id, identity, {
    isError: false,
    value: { answers: answerRows(state.requiredQuestionIds) },
  })
  expect(state.questionsAnswered).toBe(true)
}

async function runSearch(agent: LegalAgent, id = SESSION) {
  expect(agent.preTool(id, 'case_search', SEARCH_ARGS)).toEqual({ kind: 'allow' })
  return agent.executeTool(id, 'case_search', SEARCH_ARGS)
}

function readReplyFor(name: string, start: number, end: number): Record<string, unknown> {
  return {
    ...READ_RESULT,
    name,
    start,
    end,
    text: `合成材料第 ${start} 至 ${end} 单元`,
    next_start: end + 1,
    next_offset: null,
  }
}

const INVALID_ENDS = [
  ['missing end', { name: '借条', start: 1 }],
  ['null end', { name: '借条', start: 1, end: null }],
  ['string end', { name: '借条', start: 1, end: '1' }],
  ['fractional end', { name: '借条', start: 1, end: 1.5 }],
  ['boolean end', { name: '借条', start: 1, end: true }],
  ['zero end', { name: '借条', start: 1, end: 0 }],
  ['reversed end', { name: '借条', start: 2, end: 1 }],
  ['multi-unit end', { name: '借条', start: 1, end: 2 }],
] as const

describe('T18 bounded defense primary reads', () => {
  it.each(INVALID_ENDS)(
    'denies %s through preTool and direct executeTool before budget or Core',
    async (_label: string, args: Record<string, unknown>) => {
      const { agent, core, state } = await started(DEFENSE_OPINION_SKILL, {
        budget: BUDGET_AT_READ_BOUNDARY,
        readReply: READ_RESULT,
      })
      expect(state).toBeDefined()
      answerDefenseQuestions(agent, state!)
      await runSearch(agent)

      expect(state!.toolCalls).toBe(1)
      const coreCalls = core.calls.length
      const decision = agent.preTool(SESSION, 'case_read_material', args)
      expect(decision.kind).toBe('deny')
      if (decision.kind === 'deny') expect(decision.reason).not.toBe(DENY_BUDGET)
      expect(state!.toolCalls).toBe(1)
      expect(state!.budgetHit).toBe(false)
      expect(core.calls).toHaveLength(coreCalls)

      await expect(agent.executeTool(SESSION, 'case_read_material', args)).rejects.toThrow()
      expect(state!.toolCalls).toBe(1)
      expect(state!.budgetHit).toBe(false)
      expect(core.calls).toHaveLength(coreCalls)
      expect(core.readCalls()).toHaveLength(0)
    },
  )

  it.each([
    [1, 1],
    [12, 12],
  ])('allows one located unit %i-%i and forwards the exact inclusive bounds', async (start: number, end: number) => {
    const args = { name: '借条', start, end }
    const { agent, core, state } = await started(DEFENSE_OPINION_SKILL, {
      readReply: readReplyFor(args.name, start, end),
    })
    expect(state).toBeDefined()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expect(agent.preTool(SESSION, 'case_read_material', args)).toEqual({ kind: 'allow' })
    const result = await agent.executeTool(SESSION, 'case_read_material', args)

    expect(core.toolNames()).toEqual(['case_search', 'case_read_material'])
    expect(core.readCalls()).toHaveLength(1)
    expect(core.readCalls()[0]?.body.args).toEqual(args)
    expect(result).toEqual(expect.objectContaining({ start, end }))
    expect(state!.toolCalls).toBe(2)
    expect(state!.budgetHit).toBe(false)
  })

  it('keeps the unanswered-question gate ahead of both read entry points', async () => {
    const args = { name: '借条', start: 1 }
    const { agent, core, state } = await started()
    expect(state).toBeDefined()

    const coreCalls = core.calls.length
    const decision = agent.preTool(SESSION, 'case_read_material', args)
    expect(decision.kind).toBe('deny')
    if (decision.kind === 'deny') {
      expect(decision.reason).toContain('必问')
      expect(decision.reason).not.toContain('case_search')
    }
    expect(state!.toolCalls).toBe(0)
    expect(state!.budgetHit).toBe(false)

    await expect(agent.executeTool(SESSION, 'case_read_material', args)).rejects.toThrow(/必问/)
    expect(core.calls).toHaveLength(coreCalls)
    expect(core.readCalls()).toHaveLength(0)
  })

  it.each([
    ['Core error', { ok: false, error: { code: 'T18_SYNTHETIC_SEARCH', message: '合成检索失败' } }],
    ['schema-invalid result', { ok: true, value: MALFORMED_SEARCH_RESULT }],
  ] as const)('keeps %s isolation ahead of inclusive-end validation', async (_label: string, searchReply: SearchReply) => {
    const args = { name: '借条', start: 1 }
    const { agent, core, state } = await started(DEFENSE_OPINION_SKILL, { searchReply })
    expect(state).toBeDefined()
    answerDefenseQuestions(agent, state!)

    await expect(runSearch(agent)).rejects.toThrow()
    expect(state!.defenseSearchCompletedForRead).toBe(false)
    const coreCalls = core.calls.length
    const decision = agent.preTool(SESSION, 'case_read_material', args)
    expect(decision.kind).toBe('deny')
    if (decision.kind === 'deny') expect(decision.reason).toContain('case_search')
    expect(state!.toolCalls).toBe(1)
    expect(state!.budgetHit).toBe(false)

    await expect(agent.executeTool(SESSION, 'case_read_material', args))
      .rejects.toThrow(/case_search/)
    expect(core.calls).toHaveLength(coreCalls)
    expect(core.readCalls()).toHaveLength(0)
  })

  it.each([
    ['contract-review', CONTRACT_REVIEW_SKILL],
    ['plain conversation', null],
  ] as const)('keeps legacy start-only reads for %s', async (_label: string, skill: string | null) => {
    const args = { name: '借条', start: 1 }
    const { agent, core, state } = await started(skill, { readReply: readReplyFor(args.name, 1, 1) })
    expect(state).toBeDefined()

    expect(agent.preTool(SESSION, 'case_read_material', args)).toEqual({ kind: 'allow' })
    const result = await agent.executeTool(SESSION, 'case_read_material', args)

    expect(core.toolNames()).toEqual(['case_read_material'])
    expect(core.readCalls()[0]?.body.args).toEqual(args)
    expect(result).toEqual(expect.objectContaining({ start: 1 }))
    expect(state!.budgetHit).toBe(false)
  })
})

describe('T18 localized complete question-context', () => {
  it.each([
    ['preTool then executeTool', true],
    ['direct executeTool', false],
  ] as const)(
    'forwards the localized 14..18 context through %s',
    async (_path: string, usePreTool: boolean) => {
      const args: { name: string; start: number; end: number } = {
        name: '借条',
        start: 14,
        end: 18,
      }
      const reply: Record<string, unknown> = readReplyFor(args.name, args.start, args.end)
      const { agent, core, state } = await started(DEFENSE_OPINION_SKILL, {
        readReply: reply,
      })
      expect(state).toBeDefined()
      answerDefenseQuestions(agent, state!)

      const searchResult: unknown = await runSearch(agent)
      expect(searchResult).toEqual(SEARCH_RESULT)
      expect(state!.defenseSearchCompletedForRead).toBe(true)

      if (usePreTool) {
        expect(agent.preTool(SESSION, 'case_read_material', args)).toEqual({ kind: 'allow' })
      }
      const result: Awaited<ReturnType<typeof agent.executeTool>> =
        await agent.executeTool(SESSION, 'case_read_material', args)

      expect(core.toolNames()).toEqual(['case_search', 'case_read_material'])
      expect(core.readCalls()).toHaveLength(1)
      expect(core.readCalls()[0]?.body.args).toEqual(args)
      expect(core.readCalls()[0]?.body.args).not.toEqual({ name: args.name })
      expect(result).toEqual(reply)
      expect(result).toEqual(expect.objectContaining({
        name: '借条',
        start: 14,
        end: 18,
        text: '合成材料第 14 至 18 单元',
      }))
      expect(state!.toolCalls).toBe(2)
      expect(state!.budgetHit).toBe(false)
    },
  )
})
