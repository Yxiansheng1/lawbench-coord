import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  DOC_REVISE_SKILL,
  LegalAgent,
  QUESTION_GATED_TOOLS,
  SKILL_QUESTIONS_UNAVAILABLE,
  questionRequirementDenial,
} from '../agent/index.ts'
import type { Budget, Params, QuestionExecutionIdentity } from '../agent/task-state.ts'
import { LawbenchRemote } from '../host/index.ts'
import type { Supervisor } from '../host/supervisor.ts'
import type { CoreClient } from '../shared/core-client.ts'

const CASE = 'case-doc-revise-question-gate'
const SESSION = 'session-doc-revise-question-gate'
const REPO_SKILLS = join(__dirname, '..', '..', 'skills')
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '低', window: '64K', max_tokens: 16384 }
const DOC_QUESTIONS = ['draft', 'opinions'] as const
const CONTRACT_QUESTIONS = ['our_party', 'purpose', 'focus'] as const
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
            task_id: `T-doc-revise-question-gate-${sequence}`,
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

function makeLegalAgent(core: CoreClient, skillQuestions: Questions, notes: string[] = []) {
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

function questionResolver(ids: readonly string[] = DOC_QUESTIONS): Questions {
  return async () => ids.map((key) => ({ key, question: `请确认 ${key}`, fromMaterials: false }))
}

function testAgent(id = SESSION): TestAgent {
  return { id, session: { header: { cwd: 'D:\\Lawbeach\\fixtures\\合成案件' } } }
}

function enter() {
  return { kind: 'enter' as const, messages: [] }
}

function askArgs(ids: readonly string[] = DOC_QUESTIONS) {
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

describe('doc-revise 必问闸门真实 LegalAgent 接线', () => {
  it('从现有 Host Skill 目录取得 draft、opinions，未答时读取可用而两类成果写入不可达', async () => {
    const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
    const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [REPO_SKILLS])
    const fake = fakeCore(DOC_REVISE_SKILL)
    let resolverCalls = 0
    const agent = makeLegalAgent(fake.core, (skillName) => {
      resolverCalls += 1
      return remote.skillQuestions(skillName)
    })

    const { decision, state } = await start(agent)
    expect(decision.kind).toBe('enter')
    expect(resolverCalls).toBe(1)
    expect(state?.requiredQuestionIds).toEqual([...DOC_QUESTIONS])
    expect(agent.preTool(SESSION, 'case_read_input', { index: 1 })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '合成修改稿', content: '合成正文' })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(DOC_QUESTIONS),
    })
    expect(agent.preTool(SESSION, 'case_save_edit_list', { name: '合成草稿', edits: [] })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(DOC_QUESTIONS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', { title: '合成修改稿', content: '合成正文' }))
      .rejects.toThrow(questionRequirementDenial(DOC_QUESTIONS))
    await expect(agent.executeTool(SESSION, 'case_save_edit_list', { name: '合成草稿', edits: [] }))
      .rejects.toThrow(questionRequirementDenial(DOC_QUESTIONS))
    state!.addReply('合成未完成正文')
    expect(await agent.saveUnfinished(state!)).toBe(false)
    state!.loopHit = 'repetition'
    await agent.finishLoop(SESSION, state!)
    expect(fake.writes()).toEqual([])
  })

  it('错 ID、空提问、错误或空最终结果全不解锁；draft 与 opinions 均非空后只写入一次', async () => {
    const fake = fakeCore(DOC_REVISE_SKILL)
    const agent = makeLegalAgent(fake.core, questionResolver())
    const { state } = await start(agent)
    expect(state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])

    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(['draft', 'unexpected']), askIdentity('wrong-id')))
      .toMatchObject({ kind: 'deny' })
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(['draft', 'draft', 'opinions']), askIdentity('duplicate-id')))
      .toMatchObject({ kind: 'deny' })
    expect(agent.preTool(SESSION, 'ask_user_question', { questions: [] }, askIdentity('empty-ask')))
      .toMatchObject({ kind: 'deny' })

    const errorAsk = askIdentity('error-answer')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), errorAsk)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, errorAsk, {
      isError: true,
      value: {
        answers: DOC_QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })),
      },
    })
    expect(state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])

    const emptyAsk = askIdentity('empty-answer')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), emptyAsk)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, emptyAsk, { isError: false, value: { answers: [] } })
    expect(state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(fake.writes()).toEqual([])

    const validAsk = askIdentity('valid-answer')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), validAsk)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, validAsk, {
      isError: false,
      value: {
        answers: [
          { id: 'draft', selected: ['合成草稿'], custom: '' },
          { id: 'opinions', selected: [], custom: '按合成意见修改但保留原有结构' },
        ],
      },
    })
    expect(state?.missingQuestionIds()).toEqual([])
    expect(agent.preTool(SESSION, 'case_save_draft', { title: '合成修改稿', content: '合成正文' })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', { title: '合成修改稿', content: '合成正文' })
    expect(fake.writes()).toHaveLength(1)
    expect(state?.takeDraftFeedbackNotice()).toBe(false)
  })

  it('同会话新任务不继承答案，旧任务晚到结果不能解锁；新会话答案也相互独立', async () => {
    const fake = fakeCore(DOC_REVISE_SKILL)
    const agent = makeLegalAgent(fake.core, questionResolver())
    const first = await start(agent)

    const firstAsk = askIdentity('first-task-answer')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), firstAsk)).toEqual({ kind: 'allow' })
    observe(agent, SESSION, firstAsk, {
      isError: false,
      value: {
        answers: DOC_QUESTIONS.map((id) => ({ id, selected: ['合成确认'], custom: '' })),
      },
    })
    expect(first.state?.questionsAnswered).toBe(true)

    const second = await start(agent)
    expect(second.state).not.toBe(first.state)
    expect(second.state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })

    const secondAsk = askIdentity('second-task-pending')
    expect(agent.preTool(SESSION, 'ask_user_question', askArgs(), secondAsk)).toEqual({ kind: 'allow' })
    const third = await start(agent)
    observe(agent, SESSION, secondAsk, {
      isError: false,
      value: {
        answers: DOC_QUESTIONS.map((id) => ({ id, selected: ['合成迟到答案'], custom: '' })),
      },
    })
    expect(third.state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })

    const other = await start(agent, testAgent('session-doc-revise-other'))
    expect(other.state?.missingQuestionIds()).toEqual([...DOC_QUESTIONS])
    expect(agent.preTool('session-doc-revise-other', 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(fake.writes()).toEqual([])
  })

  it('Host 能力缺失或机器目录畸形时整任务 blocked，不创建可写空需求状态', async () => {
    for (const resolver of [
      async () => { throw new Error('catalog unavailable') },
      async () => [
        { key: 'draft', question: '问一', fromMaterials: false },
        { key: 'draft', question: '问二', fromMaterials: false },
      ],
      async () => [{ key: 'Bad Key', question: '', fromMaterials: false }],
    ]) {
      const fake = fakeCore(DOC_REVISE_SKILL)
      const notes: string[] = []
      const agent = makeLegalAgent(fake.core, resolver, notes)
      const { decision, state } = await start(agent)
      expect(decision).toEqual({ kind: 'reject' })
      expect(state).toBeUndefined()
      expect(notes).toEqual([SKILL_QUESTIONS_UNAVAILABLE])
      expect(fake.calls.some((call) => call.cmd === 'task/end' && call.body.reason === 'blocked')).toBe(true)
      expect(fake.writes()).toEqual([])
    }
  })

  it('contract-review 既有正向不变；其它 Skill 与自由对话不加载问题目录', async () => {
    const contract = fakeCore(CONTRACT_REVIEW_SKILL)
    const contractAgent = makeLegalAgent(contract.core, questionResolver(CONTRACT_QUESTIONS))
    const contractTask = await start(contractAgent)
    expect(contractTask.state?.requiredQuestionIds).toEqual([...CONTRACT_QUESTIONS])
    const contractAsk = askIdentity('contract-answer')
    expect(contractAgent.preTool(SESSION, 'ask_user_question', askArgs(CONTRACT_QUESTIONS), contractAsk)).toEqual({ kind: 'allow' })
    observe(contractAgent, SESSION, contractAsk, {
      isError: false,
      value: {
        answers: CONTRACT_QUESTIONS.map((id) => ({ id, selected: ['合成确认'], custom: '' })),
      },
    })
    expect(contractAgent.preTool(SESSION, 'case_save_draft', {})).toEqual({ kind: 'allow' })

    for (const skill of ['contract-draft', null]) {
      let resolverCalls = 0
      const control = fakeCore(skill)
      const controlAgent = makeLegalAgent(control.core, async () => {
        resolverCalls += 1
        throw new Error('should not load')
      })
      const controlTask = await start(controlAgent)
      expect(controlTask.decision.kind).toBe('enter')
      expect(controlTask.state?.requiredQuestionIds).toEqual([])
      expect(resolverCalls).toBe(0)
      expect(controlAgent.preTool(SESSION, 'case_save_draft', {})).toEqual({ kind: 'allow' })
    }
  })
})
