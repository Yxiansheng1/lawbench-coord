import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  DEFENSE_OPINION_SKILL,
  GENERAL_DRAFTING_SKILL,
  LITIGATION_DOCS_SKILL,
  LegalAgent,
  QUESTION_GATED_TOOLS,
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

const CASE = 'case-defense-read-question-order-20261031-224957'
const SESSION = 'session-defense-read-question-order-20261031-224957'
const OTHER_SESSION = 'session-defense-read-question-order-20261031-224957-other'
const TASK = 'T-defense-read-question-order-20261031-224957'
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '中', window: '128K', max_tokens: 49152 }
const DEFENSE_IDS = ['direction', 'stage', 'key_points'] as const
const REPO_SKILLS_A = join(__dirname, '..', '..', 'skills')
const REPO_SKILLS_B = join(__dirname, '..', '..', '..', 'lawbench-B', 'skills')
const READ_MATERIAL = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
)) as unknown
const SEARCH = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_search.result.json'),
  'utf8',
)) as unknown
const SAVED = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
)) as unknown
const WIKI = {
  section: '合成辩护概览',
  text: '合成辩护案件概览',
  updated_at: null,
  stale: false,
}
const NO_LOG: Logger = () => {}

type SkillQuestion = { key: string; question: string; fromMaterials: boolean }
type Questions = (skillName: string) => Promise<SkillQuestion[]>
type Call = { command: CoreCommand; body: Record<string, unknown> }
type AnswerRow = { id: string; selected: string[]; custom: string }

class MemoryCore extends CoreClient {
  readonly calls: Call[] = []
  private sequence = 0

  constructor(private readonly skill: string | null = DEFENSE_OPINION_SKILL) {
    super(() => undefined, NO_LOG)
  }

  toolNames(): string[] {
    return this.calls
      .filter((call) => call.command === 'tool')
      .map((call) => String(call.body.tool))
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
        value: {
          l0: { text: '合成辩护案件卡片' },
          l1: { text: '合成辩护任务输入', truncated: false, toc: [] },
        },
      } as unknown as CoreResult<T>
    }
    if (command === 'tool') {
      if (body.tool === 'case_search') {
        return { ok: true, value: SEARCH } as unknown as CoreResult<T>
      }
      if (body.tool === 'case_read_material') {
        return { ok: true, value: READ_MATERIAL } as unknown as CoreResult<T>
      }
      if (body.tool === 'case_read_wiki') {
        return { ok: true, value: WIKI } as unknown as CoreResult<T>
      }
      if (body.tool === 'case_save_draft') {
        return { ok: true, value: SAVED } as unknown as CoreResult<T>
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

function currentHostQuestions(skillDir = REPO_SKILLS_A): Questions {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [skillDir])
  return (skillName: string) => remote.skillQuestions(skillName)
}

async function start(agent: LegalAgent, id = SESSION) {
  const target = testAgent(id)
  const decision = await agent.preStep(target, 1, enter())
  return { decision, state: agent.tasks.get(id) }
}

async function startedDefense() {
  const core = new MemoryCore()
  const agent = makeAgent(core, currentHostQuestions())
  const started = await start(agent)
  return { agent, core, ...started }
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

function answerRows(ids: readonly string[], text = '合成辩护回答'): AnswerRow[] {
  return ids.map((id) => ({ id, selected: [`${text} ${id}`], custom: '' }))
}

describe('defense-opinion 先问后读 RED（T18 20261031-224957）', () => {
  it('A/B 实际 Skill 均给出三项必问；未答时材料与 Wiki 的 preTool 和直调都在 Core/预算前拒绝', async () => {
    const questionsA = await currentHostQuestions(REPO_SKILLS_A)(DEFENSE_OPINION_SKILL)
    const questionsB = await currentHostQuestions(REPO_SKILLS_B)(DEFENSE_OPINION_SKILL)
    expect(questionsA.map((question) => question.key)).toEqual([...DEFENSE_IDS])
    expect(questionsB.map((question) => question.key)).toEqual([...DEFENSE_IDS])
    expect(questionsA.map((question) => question.fromMaterials)).toEqual([false, true, false])
    expect(questionsB.map((question) => question.fromMaterials)).toEqual([false, true, false])

    const { agent, core, decision, state } = await startedDefense()
    expect(decision.kind).toBe('enter')
    expect(state?.requiredQuestionIds).toEqual([...DEFENSE_IDS])
    expect(state?.questionsBeforeMaterialRead).toBe(true)

    const coreCalls = core.calls.length
    const toolCalls = state!.toolCalls
    const modelCalls = state!.modelCalls
    for (const [tool, args] of [
      ['case_read_material', { name: '合成起诉意见书' }],
      ['case_read_wiki', { section: '合成辩护概览' }],
    ] as const) {
      expect(agent.preTool(SESSION, tool, args)).toEqual({
        kind: 'deny',
        reason: questionsBeforeReadDenial(DEFENSE_IDS),
      })
      await expect(agent.executeTool(SESSION, tool, args))
        .rejects.toThrow(questionsBeforeReadDenial(DEFENSE_IDS))
    }
    expect(state!.toolCalls).toBe(toolCalls)
    expect(state!.modelCalls).toBe(modelCalls)
    expect(state!.budgetHit).toBe(false)
    expect(core.calls.length).toBe(coreCalls)

    expect(agent.preTool(SESSION, 'case_read_input', { index: 1 })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_search', { query: '合成辩护事实' })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_list_materials', {})).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'skill', { name: DEFENSE_OPINION_SKILL })).toEqual({ kind: 'allow' })
    expect(agent.preTool(
      SESSION,
      'ask_user_question',
      askArgs(DEFENSE_IDS),
      askIdentity('defense-allowed-ask'),
    )).toEqual({ kind: 'allow' })

    const draft = { title: '合成辩护词', content: '合成辩护正文' }
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(DEFENSE_IDS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', draft))
      .rejects.toThrow(questionRequirementDenial(DEFENSE_IDS))
    expect(core.toolNames()).toEqual([])
  })

  it('三项真实最终回答齐全后才解锁当前任务的材料、Wiki 与既有写入闸门', async () => {
    const { agent, core, state } = await startedDefense()
    const ids = state!.requiredQuestionIds
    const identity = askIdentity('defense-valid-final-answer')

    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), identity)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, identity, {
      isError: false,
      value: { answers: answerRows(ids) },
    })
    expect(state?.questionsAnswered).toBe(true)

    expect(agent.preTool(SESSION, 'case_read_material', { name: '合成起诉意见书', start: 1 })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_read_wiki', { section: '合成辩护概览' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_search', { query: '合成辩护事实' })
    await agent.executeTool(SESSION, 'case_read_material', { name: '合成起诉意见书', start: 1 })
    await agent.executeTool(SESSION, 'case_read_wiki', { section: '合成辩护概览' })

    const draft = { title: '合成辩护词', content: '合成辩护正文' }
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', draft)
    expect(core.toolNames()).toEqual([
      'case_search',
      'case_read_material',
      'case_read_wiki',
      'case_save_draft',
    ])
    expect(core.writes()).toHaveLength(1)
  })

  it('部分、错 ID、空答、错误结果和取消结果都不能解锁', async () => {
    const cases = ['partial', 'wrong', 'empty', 'error', 'cancel'] as const
    for (const kind of cases) {
      const { agent, core, state } = await startedDefense()
      const ids = state!.requiredQuestionIds
      const identity = askIdentity(`defense-invalid-${kind}`)
      expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), identity)).toEqual({ kind: 'allow' })

      if (kind === 'partial') {
        observe(agent, SESSION, identity, {
          isError: false,
          value: { answers: answerRows(ids.slice(0, 1), '部分回答') },
        })
      } else if (kind === 'wrong') {
        observe(agent, SESSION, identity, {
          isError: false,
          value: {
            answers: [{ id: 'unexpected', selected: ['合成错误 ID'], custom: '' }],
          },
        })
      } else if (kind === 'empty') {
        observe(agent, SESSION, identity, {
          isError: false,
          value: {
            answers: ids.map((id) => ({ id, selected: ['  '], custom: ' ' })),
          },
        })
      } else if (kind === 'error') {
        observe(agent, SESSION, identity, {
          isError: true,
          value: { answers: answerRows(ids, '合成失败结果') },
        })
      } else {
        agent.cancelQuestionAsk(SESSION, {
          name: 'ask_user_question',
          callId: identity.callId,
          token: identity.token,
          agent: { id: SESSION },
        })
        observe(agent, SESSION, identity, {
          isError: false,
          value: { answers: answerRows(ids, '取消后迟到回答') },
        })
      }

      expect(state?.questionsAnswered).toBe(false)
      expect(state?.missingQuestionIds()).not.toEqual([])
      expect(agent.preTool(SESSION, 'case_read_material', { name: '合成起诉意见书' }))
        .toMatchObject({ kind: 'deny' })
      await expect(agent.executeTool(SESSION, 'case_read_material', { name: '合成起诉意见书' }))
        .rejects.toThrow(questionsBeforeReadDenial(state!.missingQuestionIds()))
      expect(core.toolNames()).toEqual([])
    }
  })

  it('旧任务迟到结果、跨会话结果和旧 TaskState 都不能解锁新任务', async () => {
    const { agent, core, state: oldState } = await startedDefense()
    const stale = askIdentity('defense-stale-old-task')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(oldState!.requiredQuestionIds), stale))
      .toEqual({ kind: 'allow' })

    const second = await start(agent)
    expect(second.decision.kind).toBe('enter')
    expect(second.state).not.toBe(oldState)
    expect(second.state?.taskId).not.toBe(oldState?.taskId)

    observe(agent, SESSION, stale, {
      isError: false,
      value: { answers: answerRows(second.state!.requiredQuestionIds, '合成旧任务迟到回答') },
    })

    const crossSession = askIdentity('defense-cross-session')
    expect(agent.preTool(
      SESSION,
      'ask_user_question',
      askArgs(second.state!.requiredQuestionIds),
      crossSession,
    )).toEqual({ kind: 'allow' })
    observe(agent, OTHER_SESSION, crossSession, {
      isError: false,
      value: { answers: answerRows(second.state!.requiredQuestionIds, '合成跨会话回答') },
    })
    observe(agent, SESSION, crossSession, { isError: true })

    expect(second.state?.questionsAnswered).toBe(false)
    expect(second.state?.missingQuestionIds()).toEqual([...DEFENSE_IDS])
    expect(agent.preTool(SESSION, 'case_read_material', { name: '合成起诉意见书' }))
      .toMatchObject({ kind: 'deny' })
    await expect(agent.executeTool(SESSION, 'case_read_material', { name: '合成起诉意见书' }))
      .rejects.toThrow(questionsBeforeReadDenial(DEFENSE_IDS))
    expect(core.toolNames()).toEqual([])
  })

  it('诉讼与通用文书读闸保持；合同审查、NONE 与 TaskState 默认值不被全局扩权', async () => {
    const plain = new TaskState(TASK, BUDGET, PARAMS)
    expect(plain.questionsBeforeMaterialRead).toBe(false)

    for (const skill of [LITIGATION_DOCS_SKILL, GENERAL_DRAFTING_SKILL] as const) {
      const core = new MemoryCore(skill)
      const agent = makeAgent(core, currentHostQuestions())
      const started = await start(agent)
      expect(started.decision.kind).toBe('enter')
      expect(started.state?.questionsBeforeMaterialRead).toBe(true)
      expect(agent.preTool(SESSION, 'case_read_material', { name: '合成既有文书材料' })).toEqual({
        kind: 'deny',
        reason: questionsBeforeReadDenial(started.state!.missingQuestionIds()),
      })
    }

    for (const skill of [CONTRACT_REVIEW_SKILL, null] as const) {
      const core = new MemoryCore(skill)
      const agent = makeAgent(core, currentHostQuestions())
      const started = await start(agent)
      expect(started.decision.kind).toBe('enter')
      expect(started.state?.questionsBeforeMaterialRead).toBe(false)
      expect(agent.preTool(SESSION, 'case_read_material', { name: '合成普通案件材料' })).toEqual({ kind: 'allow' })
      expect(agent.preTool(SESSION, 'case_read_wiki', { section: '合成普通概览' })).toEqual({ kind: 'allow' })
    }
  })
})
