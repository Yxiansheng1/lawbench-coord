import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  DEFENSE_OPINION_SKILL,
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

const CASE = 'case-defense-search-read-order-20261101-024639'
const SESSION = 'session-defense-search-read-order-20261101-024639'
const SIBLING_SESSION = 'session-defense-search-read-order-20261101-024639-sibling'
const TASK = 'T-defense-search-read-order-20261101-024639'
const BUDGET: Budget = { model_calls: 8, tool_calls: 32, minutes: 45 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const DEFENSE_IDS = ['direction', 'stage', 'key_points'] as const
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const SEARCH_ARGS = { query: '合成资金往来' }
const READ_WITH_START = { name: '借条', start: 1 }
const READ_WITHOUT_START = { name: '借条' }
const SEARCH_RESULT = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_search.result.json'),
  'utf8',
)) as unknown
const READ_RESULT = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
)) as unknown
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
          budget: BUDGET,
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
        return { ok: true, value: READ_RESULT } as unknown as CoreResult<T>
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

function currentHostQuestions(): Questions {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
  return (skillName: string) => remote.skillQuestions(skillName)
}

async function start(agent: LegalAgent, id = SESSION) {
  const decision = await agent.preStep(testAgent(id), 1, enter())
  return { decision, state: agent.tasks.get(id) }
}

async function started(skill: string | null = DEFENSE_OPINION_SKILL, id = SESSION) {
  const core = new MemoryCore(skill)
  const agent = makeAgent(core, currentHostQuestions())
  const result = await start(agent, id)
  return { agent, core, ...result }
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

function expectDeniedWithoutRead(
  agent: LegalAgent,
  core: MemoryCore,
  id = SESSION,
  args: unknown = READ_WITH_START,
) {
  const toolCalls = agent.tasks.get(id)?.toolCalls
  expect(agent.preTool(id, 'case_read_material', args)).toMatchObject({ kind: 'deny' })
  expect(agent.tasks.get(id)?.toolCalls).toBe(toolCalls)
  expect(core.readCalls()).toHaveLength(0)
}

describe('T18 defense primary read search order', () => {
  it('1. denies defense primary read before search without spending tool budget', async () => {
    const { agent, core, state } = await started()
    expect(state).toBeDefined()
    answerDefenseQuestions(agent, state!)

    const coreCalls = core.calls.length
    const toolCalls = state!.toolCalls
    const decision = agent.preTool(SESSION, 'case_read_material', READ_WITHOUT_START)
    expect(decision).toMatchObject({ kind: 'deny' })
    if (decision.kind === 'deny') expect(decision.reason).toContain('case_search')
    expect(state!.toolCalls).toBe(toolCalls)
    expect(state!.budgetHit).toBe(false)
    expect(core.calls.length).toBe(coreCalls)
    expect(core.readCalls()).toHaveLength(0)
  })

  it('2. denies direct executeTool without preTool and does not forward a read', async () => {
    const { agent, core, state } = await started()
    expect(state).toBeDefined()
    answerDefenseQuestions(agent, state!)

    await expect(agent.executeTool(SESSION, 'case_read_material', READ_WITHOUT_START))
      .rejects.toThrow(/case_search/)
    expect(core.readCalls()).toHaveLength(0)
  })

  it('3. a Core search error does not unlock primary read', async () => {
    const core = new MemoryCore(DEFENSE_OPINION_SKILL, {
      ok: false,
      error: { code: 'T18_SYNTHETIC_SEARCH', message: '合成检索失败' },
    })
    const agent = makeAgent(core, currentHostQuestions())
    const { state } = await start(agent)
    answerDefenseQuestions(agent, state!)

    await expect(runSearch(agent)).rejects.toThrow('合成检索失败')
    expectDeniedWithoutRead(agent, core)
  })

  it('4. a schema-invalid search result does not unlock primary read', async () => {
    const core = new MemoryCore(DEFENSE_OPINION_SKILL, {
      ok: true,
      value: MALFORMED_SEARCH_RESULT,
    })
    const agent = makeAgent(core, currentHostQuestions())
    const { state } = await start(agent)
    answerDefenseQuestions(agent, state!)

    await expect(runSearch(agent)).rejects.toThrow()
    expectDeniedWithoutRead(agent, core)
  })

  it('5. a validated search followed by explicit start 1 allows the read', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)

    await runSearch(agent)
    expect(agent.preTool(SESSION, 'case_read_material', READ_WITH_START)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_read_material', READ_WITH_START)

    expect(core.toolNames()).toEqual(['case_search', 'case_read_material'])
    expect(core.readCalls()).toHaveLength(1)
  })

  it('6. denies a read after search when start is missing', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expectDeniedWithoutRead(agent, core, SESSION, READ_WITHOUT_START)
  })

  it('7. denies start 0 after search', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expectDeniedWithoutRead(agent, core, SESSION, { name: '借条', start: 0 })
  })

  it('8. denies non-integer start 1.5 after search', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expectDeniedWithoutRead(agent, core, SESSION, { name: '借条', start: 1.5 })
  })

  it('9. denies string start after search', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expectDeniedWithoutRead(agent, core, SESSION, { name: '借条', start: '1' })
  })

  it('10. denies null start after search', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)
    await runSearch(agent)

    expectDeniedWithoutRead(agent, core, SESSION, { name: '借条', start: null })
  })

  it('11. a search in session A does not unlock sibling defense session B', async () => {
    const { agent, core, state } = await started()
    const sibling = await start(agent, SIBLING_SESSION)
    answerDefenseQuestions(agent, state!, SESSION, 'answer-primary')
    answerDefenseQuestions(agent, sibling.state!, SIBLING_SESSION, 'answer-sibling')

    await runSearch(agent, SESSION)
    expectDeniedWithoutRead(agent, core, SIBLING_SESSION)
  })

  it('12. a search does not carry into a fresh task after same-session end and begin', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!, SESSION, 'answer-old-task')
    await runSearch(agent)
    await agent.endTask(SESSION, state!, 'completed')

    const restarted = await start(agent)
    expect(restarted.state).toBeDefined()
    expect(restarted.state).not.toBe(state)
    answerDefenseQuestions(agent, restarted.state!, SESSION, 'answer-new-task')

    expectDeniedWithoutRead(agent, core)
  })

  it('13. contract-review name-only read behavior remains unchanged', async () => {
    const { agent, core, state } = await started(CONTRACT_REVIEW_SKILL)
    expect(state?.questionsBeforeMaterialRead).toBe(false)
    expect(agent.preTool(SESSION, 'case_read_material', READ_WITHOUT_START)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_read_material', READ_WITHOUT_START)
    expect(core.toolNames()).toEqual(['case_read_material'])
  })

  it('14. defense case_read_input remains allowed before search after answers', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)

    expect(agent.preTool(SESSION, 'case_read_input', { index: 1 })).toEqual({ kind: 'allow' })
    expect(core.readCalls()).toHaveLength(0)
  })

  it('15. defense case_read_wiki remains allowed before search after answers', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)

    expect(agent.preTool(SESSION, 'case_read_wiki', { section: '合成辩护概览' })).toEqual({ kind: 'allow' })
    expect(core.readCalls()).toHaveLength(0)
  })

  it('16. defense case_list_materials remains allowed before search after answers', async () => {
    const { agent, core, state } = await started()
    answerDefenseQuestions(agent, state!)

    expect(agent.preTool(SESSION, 'case_list_materials', {})).toEqual({ kind: 'allow' })
    expect(core.readCalls()).toHaveLength(0)
  })
})
