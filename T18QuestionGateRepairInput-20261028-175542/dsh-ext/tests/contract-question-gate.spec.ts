import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
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
import { parseSkill } from '../host/skills.ts'
import type { CoreClient } from '../shared/core-client.ts'
import type { Supervisor } from '../host/supervisor.ts'

const T = 'T-20261028174016-a001'
const CASE = 'case-contract-question-gate'
const SESSION = 'session-contract-question-gate'
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const PARAMS: Params = { thinking: '低', window: '64K', max_tokens: 16384 }
const QUESTIONS = ['our_party', 'purpose', 'focus']
const SAVED = JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'), 'utf8')) as unknown
const EDIT_LIST_RESULT = {
  path: '工作区/任务/T-20261028174016-a001/修改清单/采购合同.json',
  accepted: 1,
  out_of_scope: [],
}

type Call = { cmd: string; body: Record<string, unknown> }
type Asked = { questions: Array<{ id: string; question: string }> }

function fakeCore(skill: string | null = CONTRACT_REVIEW_SKILL) {
  const calls: Call[] = []
  const core = {
    call: async (cmd: string, body: Record<string, unknown>) => {
      calls.push({ cmd, body })
      if (cmd === 'task/begin') {
        return {
          ok: true,
          value: { task_id: T, case_id: CASE, skill, params: PARAMS, budget: BUDGET },
        }
      }
      if (cmd === 'context') {
        return { ok: true, value: { l0: { text: '案件卡片' }, l1: { text: '任务输入', truncated: false, toc: [] } } }
      }
      if (cmd === 'tool' && body.tool === 'case_save_draft') return { ok: true, value: SAVED }
      if (cmd === 'tool' && body.tool === 'case_save_edit_list') return { ok: true, value: EDIT_LIST_RESULT }
      return { ok: true, value: {} }
    },
  } as unknown as CoreClient
  return {
    core,
    calls,
    writes: () => calls.filter((call) => call.cmd === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool))),
  }
}

function makeAgent(
  core: CoreClient,
  skillQuestions: (skillName: string) => Promise<Array<{ key: string; question: string; fromMaterials: boolean }>>,
  noteBlocked: (sessionId: string, code: string, taskId?: string) => void = () => {},
) {
  const log = () => {}
  return new LegalAgent(
    core,
    log as never,
    noteBlocked,
    () => {},
    () => false,
    () => false,
    async () => ({ enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true }),
    skillQuestions,
  )
}

const defaultQuestions = async () => QUESTIONS.map((key) => ({
  key,
  question: `请确认 ${key}`,
  fromMaterials: false,
}))
const agentObj = (id = SESSION) => ({ id, session: { header: { cwd: 'D:\\案件\\合成材料' } } })
const enter = () => ({ kind: 'enter' as const, messages: [] })

async function startedAgent(
  skill: string | null = CONTRACT_REVIEW_SKILL,
  resolver = defaultQuestions,
) {
  const fake = fakeCore(skill)
  const agent = makeAgent(fake.core, resolver)
  const decision = await agent.preStep(agentObj(), 1, enter())
  return { ...fake, agent, decision, state: agent.tasks.get(SESSION) }
}

function stateWith(required: readonly string[], session = SESSION, taskId = T): TaskState {
  const state = new TaskState(taskId, BUDGET, PARAMS, 0, 'local', undefined, true, CASE, session, required)
  state.addReply('已有正文，但尚未取得必问项确认。')
  return state
}

function askQuestions(ids = QUESTIONS): Asked {
  return { questions: ids.map((id) => ({ id, question: `请回答 ${id}` })) }
}

function askIdentity(callId = 'call-ask-1'): QuestionExecutionIdentity {
  return { callId, token: Symbol(callId) }
}

function finalAnswers(identity: QuestionExecutionIdentity, answers: unknown[]) {
  return {
    execution: { name: 'ask_user_question', callId: identity.callId, token: identity.token, agent: { id: SESSION } },
    result: { isError: false as const, value: { answers } },
  }
}

describe('合同审查必问闸门', () => {
  it('没有真实提问时草稿、修改清单、直接执行和预算代存都不写 CoreClient', async () => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    agent.tasks.set(SESSION, stateWith(QUESTIONS))

    expect(agent.preTool(SESSION, 'case_save_draft', { title: '合同审查意见', content: '正文' })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    expect(agent.preTool(SESSION, 'case_save_edit_list', { name: '采购合同', edits: [] })).toEqual({
      kind: 'deny',
      reason: questionRequirementDenial(QUESTIONS),
    })
    await expect(agent.executeTool(SESSION, 'case_save_draft', { title: '合同审查意见', content: '正文' }))
      .rejects.toThrow(questionRequirementDenial(QUESTIONS))
    expect(await agent.saveUnfinished(agent.tasks.get(SESSION)!)).toBe(false)
    expect(fake.writes()).toEqual([])
  })

  it('部分真实回答只解除已答 ID；补问尚缺 ID 并收到非空 custom 后才放行两类写入', async () => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    const state = stateWith(QUESTIONS)
    agent.tasks.set(SESSION, state)

    const first = askIdentity()
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), first)).toEqual({ kind: 'allow' })
    const partial = finalAnswers(first, [
      { id: 'our_party', selected: ['甲方采购方'], custom: '' },
      { id: 'purpose', selected: [], custom: '签约前把关' },
    ])
    agent.observeToolResult(partial.execution, partial.result)
    expect(state.missingQuestionIds()).toEqual(['focus'])
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })

    const second = askIdentity('call-ask-2')
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(['focus']), second)).toEqual({ kind: 'allow' })
    const complete = finalAnswers(second, [{ id: 'focus', selected: [], custom: '可直接修改条款' }])
    agent.observeToolResult(complete.execution, complete.result)
    expect(state.missingQuestionIds()).toEqual([])

    expect(agent.preTool(SESSION, 'case_save_draft', { title: '合同审查意见', content: '正文' })).toEqual({ kind: 'allow' })
    expect(agent.preTool(SESSION, 'case_save_edit_list', { name: '采购合同', edits: [] })).toEqual({ kind: 'allow' })
    await agent.executeTool(SESSION, 'case_save_draft', { title: '合同审查意见', content: '正文' })
    await agent.executeTool(SESSION, 'case_save_edit_list', { name: '采购合同', edits: [] })
    expect(fake.writes().map((call) => call.body.tool)).toEqual(['case_save_draft', 'case_save_edit_list'])
  })

  it('空问题、漏问尚缺项、重复或未声明的提问 ID 在 pre-execute 就拒绝，不形成 pending', async () => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    const state = stateWith(QUESTIONS)
    agent.tasks.set(SESSION, state)
    const identity = askIdentity()

    for (const args of [
      { questions: [] },
      askQuestions(['our_party', 'purpose']),
      { questions: [{ id: 'our_party', question: '甲' }, { id: 'our_party', question: '乙' }] },
      { questions: QUESTIONS.map((id) => ({ id, question: '问' })).concat([{ id: 'unknown', question: '问' }]) },
      { questions: QUESTIONS.map((id) => ({ id, question: '' })) },
    ]) {
      expect(agent.preTool(SESSION, 'ask_user_question', args, identity)).toMatchObject({ kind: 'deny' })
    }
    expect(state.missingQuestionIds()).toEqual(QUESTIONS)
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
  })

  const badAnswers: Array<[string, unknown[]]> = [
    ['wrong answer ID', [{ id: 'wrong', selected: ['确认'], custom: '' }]],
    ['empty answer', QUESTIONS.map((id) => ({ id, selected: [], custom: '' }))],
    ['duplicate answer ID', [
      { id: 'our_party', selected: ['确认'], custom: '' },
      { id: 'our_party', selected: ['确认'], custom: '' },
    ]],
    ['malformed selected', QUESTIONS.map((id) => ({ id, selected: id === 'focus' ? '确认' : ['确认'], custom: '' }))],
  ]
  it.each(badAnswers)('%s 不从成功最终结果解锁成果', async (_name, answers) => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    const state = stateWith(QUESTIONS)
    agent.tasks.set(SESSION, state)
    const identity = askIdentity()
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), identity)).toEqual({ kind: 'allow' })
    const final = finalAnswers(identity, answers)
    agent.observeToolResult(final.execution, final.result)
    expect(state.missingQuestionIds().length).toBeGreaterThan(0)
    expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    expect(fake.writes()).toEqual([])
  })

  it('错误 callId/token 的成功值不计数；取消、无 provider、工具错误、post-policy 阻断和 postExecute 后取消重写的最终错误也不计数', async () => {
    for (const label of ['cancelled', 'no-provider', 'tool-error', 'post-block', 'caller-late-abort']) {
      const fake = fakeCore()
      const agent = makeAgent(fake.core, defaultQuestions)
      const state = stateWith(QUESTIONS)
      agent.tasks.set(SESSION, state)
      const identity = askIdentity(label)
      expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), identity)).toEqual({ kind: 'allow' })
      agent.observeToolResult(
        { name: 'ask_user_question', callId: identity.callId, token: identity.token, agent: { id: SESSION } },
        { isError: true, value: { answers: QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })) } },
      )
      expect(state.missingQuestionIds()).toEqual(QUESTIONS)
      expect(agent.preTool(SESSION, 'case_save_draft', {})).toMatchObject({ kind: 'deny' })
    }

    const unknownCall = fakeCore()
    const agent = makeAgent(unknownCall.core, defaultQuestions)
    const state = stateWith(QUESTIONS)
    agent.tasks.set(SESSION, state)
    const actual = askIdentity('actual-call')
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), actual)).toEqual({ kind: 'allow' })
    const wrong = askIdentity('different-call')
    agent.observeToolResult(
      { name: 'ask_user_question', callId: wrong.callId, token: wrong.token, agent: { id: SESSION } },
      { isError: false, value: { answers: QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })) } },
    )
    expect(state.missingQuestionIds()).toEqual(QUESTIONS)
  })

  it('下游 pre-execute 否决后清掉 pending，同一失败调用不计数，但原任务可以重新提问', async () => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    const state = stateWith(QUESTIONS)
    agent.tasks.set(SESSION, state)
    const denied = askIdentity('downstream-denied')
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), denied)).toEqual({ kind: 'allow' })
    agent.cancelQuestionAsk(SESSION, {
      name: 'ask_user_question', callId: denied.callId, token: denied.token, agent: { id: SESSION },
    })
    const deniedFinal = finalAnswers(denied, QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })))
    agent.observeToolResult(deniedFinal.execution, deniedFinal.result)
    expect(state.missingQuestionIds()).toEqual(QUESTIONS)

    const retry = askIdentity('ask-retry')
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), retry)).toEqual({ kind: 'allow' })
    const retryFinal = finalAnswers(retry, QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })))
    agent.observeToolResult(retryFinal.execution, retryFinal.result)
    expect(state.missingQuestionIds()).toEqual([])
  })

  it('旧任务迟到的最终成功结果不能解锁新任务；不同会话也没有共享答案', async () => {
    const fake = fakeCore()
    const agent = makeAgent(fake.core, defaultQuestions)
    const old = stateWith(QUESTIONS, SESSION, 'T-old')
    agent.tasks.set(SESSION, old)
    const oldIdentity = askIdentity('old-call')
    expect(agent.preTool(SESSION, 'ask_user_question', askQuestions(), oldIdentity)).toEqual({ kind: 'allow' })

    const fresh = stateWith(QUESTIONS, SESSION, 'T-new')
    agent.tasks.set(SESSION, fresh)
    const late = finalAnswers(oldIdentity, QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })))
    agent.observeToolResult(late.execution, late.result)
    expect(fresh.missingQuestionIds()).toEqual(QUESTIONS)

    const other = stateWith(QUESTIONS, 'other-session', 'T-other')
    agent.tasks.set('other-session', other)
    const otherIdentity = askIdentity('other-call')
    expect(agent.preTool('other-session', 'ask_user_question', askQuestions(), otherIdentity)).toEqual({ kind: 'allow' })
    const otherFinal = finalAnswers(otherIdentity, QUESTIONS.map((id) => ({ id, selected: ['确认'], custom: '' })))
    otherFinal.execution.agent.id = SESSION
    agent.observeToolResult(otherFinal.execution, otherFinal.result)
    expect(other.missingQuestionIds()).toEqual(QUESTIONS)
  })

  it('预算和重复熔断的未完成代存都返回 false、不写草稿，也不伪造 draftSaved', async () => {
    const fake = fakeCore()
    const notes: string[] = []
    const agent = makeAgent(fake.core, defaultQuestions, (_id, code) => { notes.push(code) })
    const budgetState = stateWith(QUESTIONS, SESSION, 'T-budget')
    const loopState = stateWith(QUESTIONS, SESSION, 'T-loop')

    budgetState.budgetHit = true
    expect(await agent.saveUnfinished(budgetState)).toBe(false)
    loopState.loopHit = 'repetition'
    agent.tasks.set(SESSION, loopState)
    await agent.finishLoop(SESSION, loopState)
    expect(fake.writes()).toEqual([])
    expect(budgetState.draftSaved).toBe(false)
    expect(loopState.draftSaved).toBe(false)
    expect(notes).toContain('REPETITION_STOPPED')
  })

  it('无问题 Skill、其它 Skill 和自由对话不加载 resolver，照常写草稿', async () => {
    for (const skill of [null, 'other-skill']) {
      let resolverCalls = 0
      const fake = fakeCore(skill)
      const agent = makeAgent(fake.core, async () => { resolverCalls++; return [] })
      expect((await agent.preStep(agentObj(), 1, enter())).kind).toBe('enter')
      expect(resolverCalls).toBe(0)
      await agent.executeTool(SESSION, 'case_save_draft', { title: '测试草稿', content: '正文' })
      expect(fake.writes()).toHaveLength(1)
    }

    const explicitEmpty = await startedAgent(CONTRACT_REVIEW_SKILL, async () => [])
    expect(explicitEmpty.decision.kind).toBe('enter')
    expect(explicitEmpty.state!.requiredQuestionIds).toEqual([])
    await explicitEmpty.agent.executeTool(SESSION, 'case_save_draft', { title: '测试草稿', content: '正文' })
    expect(explicitEmpty.writes()).toHaveLength(1)
  })

  it('合同审查问题加载抛错或返回重复/畸形元数据时整任务 blocked，不留下可写的空需求状态', async () => {
    for (const resolver of [
      async () => { throw new Error('loader failed') },
      async () => [
        { key: 'our_party', question: '问', fromMaterials: false },
        { key: 'our_party', question: '再问', fromMaterials: false },
      ],
      async () => [{ key: 'Bad Key', question: '', fromMaterials: false }],
    ]) {
      const fake = fakeCore()
      const notes: string[] = []
      const agent = makeAgent(fake.core, resolver, (_id, code) => { notes.push(code) })
      expect(await agent.preStep(agentObj(), 1, enter())).toEqual({ kind: 'reject' })
      expect(agent.tasks.has(SESSION)).toBe(false)
      expect(notes).toEqual([SKILL_QUESTIONS_UNAVAILABLE])
      expect(fake.writes()).toEqual([])
      expect(fake.calls.some((call) => call.cmd === 'task/end' && call.body.reason === 'blocked')).toBe(true)
    }
  })
})

function skillText(name: string, questions: string) {
  return [
    '---',
    `name: ${name}`,
    'title: 测试技能',
    'description: 测试。',
    'mode: agent',
    'kind: analysis',
    'params: {thinking: 低, window: 64K, max_tokens: 16384}',
    'inputs: [materials]',
    '---',
    '',
    '## 适用场景',
    '',
    '测试。',
    '',
    '## 输入',
    '',
    '材料。',
    '',
    '## 必问问题',
    '',
    questions,
    '',
    '## 处理步骤',
    '',
    '1. 读。',
    '',
    '## 输出模板',
    '',
    '无。',
    '',
    '## 自检清单',
    '',
    '- 无。',
    '',
  ].join('\n')
}

describe('Host 从现有配置目录解析合同审查问题', () => {
  const up = () => ({ endpoint: () => undefined, state: 'running' }) as unknown as Supervisor
  const repoSkills = join(__dirname, '..', '..', 'skills')

  it('当前 contract-review 精确返回 our_party、purpose、focus', async () => {
    const remote = new LawbenchRemote(up(), tmpdir(), () => undefined, [repoSkills])
    expect((await remote.skillQuestions('contract-review')).map((question) => question.key))
      .toEqual(['our_party', 'purpose', 'focus'])
  })

  it('缺失 Skill、重复问题元数据都抛可用性错误；显式“无”合法为空', async () => {
    const root = mkdtempSync(join(tmpdir(), 'lb-contract-questions-'))
    try {
      const remote = new LawbenchRemote(up(), root, () => undefined, [root])
      await expect(remote.skillQuestions('contract-review')).rejects.toThrow(SKILL_QUESTIONS_UNAVAILABLE)

      mkdirSync(join(root, 'contract-review'))
      writeFileSync(join(root, 'contract-review', 'SKILL.md'), skillText('contract-review', [
        '- our_party：问甲方？（可从材料中获取：否）',
        '- our_party：再问？（可从材料中获取：否）',
      ].join('\n')))
      await expect(remote.skillQuestions('contract-review')).rejects.toThrow(SKILL_QUESTIONS_UNAVAILABLE)
      expect(parseSkill(skillText('contract-review', [
        '- our_party：问甲方？（可从材料中获取：否）',
        '- our_party：再问？（可从材料中获取：否）',
      ].join('\n')))).toBeUndefined()
      expect(parseSkill(skillText('mixed', [
        '无',
        '- our_party：问甲方？（可从材料中获取：否）',
      ].join('\n')))).toBeUndefined()

      mkdirSync(join(root, 'no-questions'))
      writeFileSync(join(root, 'no-questions', 'SKILL.md'), skillText('no-questions', '无'))
      expect(await remote.skillQuestions('no-questions')).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
