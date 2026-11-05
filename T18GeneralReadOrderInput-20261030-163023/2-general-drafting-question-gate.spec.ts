import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GENERAL_DRAFTING_SKILL,
  LegalAgent,
  QUESTION_GATED_TOOLS,
  SKILL_QUESTIONS_UNAVAILABLE,
  questionRequirementDenial,
} from '../agent/index.ts'
import type { Budget, Params, QuestionExecutionIdentity } from '../agent/task-state.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'
import type { CoreClient } from '../shared/core-client.ts'

const CASE = 'case-general-drafting-question-gate'
const SESSION = 'session-general-drafting-question-gate'
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '低', window: '64K', max_tokens: 16384 }
const SAVED = JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'), 'utf8')) as unknown

type Call = { cmd: string; body: Record<string, unknown> }
type TestAgent = { id: string; session: { header: { cwd: string } } }
type Questions = (skillName: string) => Promise<Array<{ key: string; question: string; fromMaterials: boolean }>>

function fakeCore(skill: string | null) {
  const calls: Call[] = []
  let sequence = 0
  const core = {
    call: async (cmd: string, body: Record<string, unknown>) => {
      calls.push({ cmd, body })
      if (cmd === 'task/begin') {
        sequence += 1
        return {
          ok: true,
          value: {
            task_id: `T-general-drafting-question-gate-${sequence}`,
            case_id: CASE,
            skill,
            params: PARAMS,
            budget: BUDGET,
          },
        }
      }
      if (cmd === 'context') {
        return { ok: true, value: { l0: { text: '合成案件卡片' }, l1: { text: '合成任务输入', truncated: false, toc: [] } } }
      }
      if (cmd === 'tool' && body.tool === 'case_save_draft') return { ok: true, value: SAVED }
      return { ok: true, value: {} }
    },
  } as unknown as CoreClient
  return {
    core,
    calls,
    writes: () => calls.filter((call) => call.cmd === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool))),
  }
}

function makeLegalAgent(core: CoreClient, skillQuestions?: Questions, notes: string[] = []) {
  return new LegalAgent(
    core,
    (() => {}) as never,
    (_sessionId, code) => { notes.push(code) },
    () => {},
    () => false,
    () => false,
    async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }),
    skillQuestions,
  )
}

function testAgent(id = SESSION): TestAgent {
  return { id, session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成案件' } } }
}

function enter() {
  return { kind: 'enter' as const, messages: [] }
}

function askArgs(ids: readonly string[]) {
  return { questions: ids.map((id) => ({ id, question: `请回答 ${id}` })) }
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

async function start(agent: LegalAgent, target = testAgent()) {
  const decision = await agent.preStep(target, 1, enter())
  return { decision, state: agent.tasks.get(target.id) }
}

function currentHostQuestions() {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
  return (skillName: string) => remote.skillQuestions(skillName)
}

describe('general-drafting 必问闸门真实 LegalAgent 接线', () => {
  it('当前 Host 机器目录精确给出三项必问 ID，Agent 原样固定到本轮 TaskState', async () => {
    const resolve = currentHostQuestions()
    const machineQuestions = await resolve(GENERAL_DRAFTING_SKILL)
    expect(machineQuestions.map((question) => question.key)).toEqual(['doc_type', 'recipient', 'goal'])

    const fake = fakeCore(GENERAL_DRAFTING_SKILL)
    let resolverCalls = 0
    const agent = makeLegalAgent(fake.core, (skillName) => {
      resolverCalls += 1
      return resolve(skillName)
    })
    const { decision, state } = await start(agent)

    expect(decision.kind).toBe('enter')
    expect(resolverCalls).toBe(1)
    expect(state?.requiredQuestionIds).toEqual(machineQuestions.map((question) => question.key))
  })

  it('首份草稿和修改清单在真实回答前都被拒绝，且不到达 Core 工具写入', async () => {
    const fake = fakeCore(GENERAL_DRAFTING_SKILL)
    const agent = makeLegalAgent(fake.core, currentHostQuestions())
    const { state } = await start(agent)
    const missing = state!.requiredQuestionIds
    const draft = { title: '合成律师函', content: '合成正文' }
    const editList = { name: '合成草稿', edits: [] }

    expect(agent.preTool(SESSION, 'case_read_input', { index: 1 })).toEqual({ kind: 'allow' })
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
    expect(fake.writes()).toEqual([])
  })

  it('三项真实结构化回答齐全后允许首份草稿写入一次', async () => {
    const fake = fakeCore(GENERAL_DRAFTING_SKILL)
    const agent = makeLegalAgent(fake.core, currentHostQuestions())
    const { state } = await start(agent)
    const ids = state!.requiredQuestionIds
    const identity = askIdentity('general-valid-answer')

    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), identity)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, identity, {
      isError: false,
      value: {
        answers: ids.map((id) => ({ id, selected: [`合成回答 ${id}`], custom: '' })),
      },
    })
    expect(state?.questionsAnswered).toBe(true)

    const draft = { title: '合成律师函', content: '合成正文' }
    expect(agent.preTool(SESSION, 'case_save_draft', draft)).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', draft)
    expect(fake.writes()).toHaveLength(1)
  })

  it('错问、下游取消和旧任务晚到结果都不解锁同会话的新任务', async () => {
    const fake = fakeCore(GENERAL_DRAFTING_SKILL)
    const agent = makeLegalAgent(fake.core, currentHostQuestions())
    const first = await start(agent)
    const ids = first.state!.requiredQuestionIds

    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(['unexpected']), askIdentity('general-wrong-id')))
      .toMatchObject({ kind: 'deny' })

    const cancelled = askIdentity('general-cancelled')
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
    expect(first.state?.missingQuestionIds()).toEqual(ids)

    const late = askIdentity('general-late-old-task')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(ids), late)).toEqual({ kind: 'allow' })
    const second = await start(agent)
    observe(agent, SESSION, late, {
      isError: false,
      value: { answers: ids.map((id) => ({ id, selected: ['合成旧任务答案'], custom: '' })) },
    })
    expect(second.state).not.toBe(first.state)
    expect(second.state?.missingQuestionIds()).toEqual(ids)
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(fake.writes()).toEqual([])
  })

  it('general-drafting 的 Host 必问能力不可用时整任务 blocked，不创建可写空需求状态', async () => {
    const fake = fakeCore(GENERAL_DRAFTING_SKILL)
    const notes: string[] = []
    const agent = makeLegalAgent(fake.core, undefined, notes)
    const { decision, state } = await start(agent)

    expect(decision).toEqual({ kind: 'reject' })
    expect(state).toBeUndefined()
    expect(notes).toEqual([SKILL_QUESTIONS_UNAVAILABLE])
    expect(fake.calls.some((call) => call.cmd === 'task/end' && call.body.reason === 'blocked')).toBe(true)
    expect(fake.writes()).toEqual([])
  })
})
