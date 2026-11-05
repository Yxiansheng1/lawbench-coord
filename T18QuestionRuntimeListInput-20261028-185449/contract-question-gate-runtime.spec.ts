// 合同审查必问闸门的真实 DSH 接线测试：已安装编译件中的 Cordis、ToolRuntime、
// UserQuestionService 和 ask_user_question 工具，加上生产 apply hooks。
// Core 只在内存中接住 CoreClient.call，不打开端口、不访问网络，也不调用模型。
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CONTRACT_REVIEW_SKILL,
  QUESTION_GATED_TOOLS,
  apply as applyLegalAgent,
  inject as legalAgentInject,
  name as legalAgentName,
  questionRequirementDenial,
} from '../agent/index.ts'
import { CoreClient } from '../shared/core-client.ts'

const DSH = join(__dirname, '..', '..', 'dsh')
const SAVED = JSON.parse(readFileSync(join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'), 'utf8')) as unknown
const QUESTIONS = ['our_party', 'purpose', 'focus'] as const
const CASE = 'case-question-gate-runtime'

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
type PostDecision =
  | { kind: 'accept'; value?: unknown; content?: unknown[] }
  | { kind: 'block'; feedback: unknown[] }
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

type Budget = { model_calls: number; tool_calls: number; minutes: number }
type CoreCall = { command: string; body: Record<string, unknown> }
type FakeCore = {
  capability: Record<string, unknown>
  calls: CoreCall[]
  notes: string[]
  writes(): CoreCall[]
  begins(): CoreCall[]
}

function makeCore(budget: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }) {
  const calls: CoreCall[] = []
  const notes: string[] = []
  let sequence = 0
  const capability = {
    endpoint: () => undefined,
    noteTurnBlocked: (_sessionId: string, code: string) => { notes.push(code) },
    clearTurnBlocked: () => {},
    sheetHeld: () => false,
    externalLlmState: async () => ({
      enabled: false, model: null, contextWindow: null, keyConfigured: false, supportsTools: true,
    }),
    skillQuestions: async (skill: string) => skill === CONTRACT_REVIEW_SKILL
      ? QUESTIONS.map((key) => ({ key, question: `请确认 ${key}`, fromMaterials: false }))
      : [],
  }
  const result = (command: string, body: Record<string, unknown>): unknown => {
    if (command === 'task/begin') {
      sequence++;
      return {
        ok: true,
        value: {
          task_id: `T-runtime-${sequence}`,
          case_id: CASE,
          skill: CONTRACT_REVIEW_SKILL,
          params: { thinking: '低', window: '64K', max_tokens: 16384 },
          budget,
        },
      }
    }
    if (command === 'context') {
      return { ok: true, value: { l0: { text: '合成案件卡片' }, l1: { text: '合成任务输入', truncated: false, toc: [] } } }
    }
    if (command === 'tool') {
      return { ok: true, value: body.tool === 'case_save_draft' ? SAVED : {} }
    }
    return { ok: true, value: {} }
  }
  const core: FakeCore = {
    capability,
    calls,
    notes,
    writes: () => calls.filter((call) =>
      call.command === 'tool' && QUESTION_GATED_TOOLS.has(String(call.body.tool))),
    begins: () => calls.filter((call) => call.command === 'task/begin'),
  }
  return { core, result }
}

function makeAgent(id: string, cwd: string): TestAgent {
  return { id, session: { id, header: { cwd, delegationDepth: 0 } } }
}

type BootOptions = {
  budget?: Budget
  agents?: string[]
  provider?: boolean
}

async function boot(options: BootOptions = {}) {
  const temp = mkdtempSync(join(tmpdir(), 'lb-question-runtime-'))
  const agents = (options.agents ?? ['session-question-runtime']).map((id) => makeAgent(id, join(temp, id)))
  const core = makeCore(options.budget)
  const coreCall = vi.spyOn(CoreClient.prototype, 'call').mockImplementation(async (command: string, body: Record<string, unknown>) => {
    core.core.calls.push({ command, body })
    return core.result(command, body) as never
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
    ctx.provide('lawbenchCore', core.core.capability)
    await ctx.plugin({ name: legalAgentName, inject: legalAgentInject, apply: applyLegalAgent }, {
      appData: temp,
      validateContracts: false,
    })
    for (const agent of agents) ctx.agents.enter(agent, undefined)
    if (options.provider !== false) {
      ctx.on('user-questions/request', ((request: {
        questions: Array<{ id: string }>
      }) => {
        providerCalls++
        return {
          answers: request.questions.map((question) => ({
            id: question.id,
            selected: [`合成答案：${question.id}`],
          })),
        }
      }) as never)
    }
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
    agents,
    core: core.core,
    observed,
    providerCalls: () => providerCalls,
    async dispose() {
      await ctx.fiber.dispose().catch(() => undefined)
      coreCall.mockRestore()
      rmSync(temp, { recursive: true, force: true })
    },
  }
}

type RuntimeEnv = Awaited<ReturnType<typeof boot>>

async function startTask(env: RuntimeEnv, agent = env.agents[0]!, step = 1) {
  return env.ctx.waterfall('agent/pre-step', { agent, step }, async () => ({
    kind: 'enter' as const,
    messages: [],
  }))
}

function askArgs(ids: readonly string[] = QUESTIONS) {
  return { questions: ids.map((id) => ({ id, question: `请回答 ${id}` })) }
}

async function runTool(
  env: RuntimeEnv,
  name: string,
  callId: string,
  args: unknown,
  agent = env.agents[0]!,
  signal = new AbortController().signal,
) {
  return env.ctx.tools.execute({ signal, callId, name, arguments: args, agent })
}

function observed(env: RuntimeEnv, callId: string): RuntimeResult {
  const found = env.observed.findLast((entry) => entry.callId === callId)
  if (!found) throw new Error(`tools/result did not observe ${callId}`)
  return found.result
}

function text(result: RuntimeResult): string {
  return JSON.stringify(result.content)
}

async function assertStillBlocked(env: RuntimeEnv, callId: string) {
  const result = await runTool(env, 'case_save_draft', callId, { title: '不该保存', content: '合成正文' })
  expect(result.isError).toBe(true)
  expect(text(result)).toContain(questionRequirementDenial(QUESTIONS))
  expect(env.core.writes()).toEqual([])
}

describe('合同审查必问闸门真实运行时接线', () => {
  it('有效答案从最终 tools/result 解锁真实案件写入', async () => {
    const env = await boot()
    try {
      expect((await startTask(env)).kind).toBe('enter')
      const identity = 'ask-positive'
      const asked = await runTool(env, 'ask_user_question', identity, askArgs())
      expect(asked.isError).toBe(false)
      expect(observed(env, identity)).toEqual(asked)
      expect(env.providerCalls()).toBe(1)
      expect(env.core.writes()).toEqual([])

      const write = await runTool(env, 'case_save_draft', 'save-positive', {
        title: '合同审查意见', content: '合成正文',
      })
      expect(write.isError).toBe(false)
      expect(env.core.writes()).toHaveLength(1)
      expect(env.core.writes()[0]?.body.tool).toBe('case_save_draft')
    } finally {
      await env.dispose()
    }
  })

  it.each([
    ['post-policy 阻断', 'block'],
    ['postExecute 后、最终结果前 caller abort', 'abort'],
    ['最终输出 schema/materialization 失败', 'materialize'],
  ] as const)('%s 都以最终 Error 收口且不解锁写入', async (
    _label: string,
    mode: 'block' | 'abort' | 'materialize',
  ) => {
    const env = await boot()
    try {
      expect((await startTask(env)).kind).toBe('enter')
      const controller = new AbortController()
      env.ctx.on('tools/post-execute', (async (
        execution: RuntimeExecution,
        _result: RuntimeResult,
        next: () => Promise<PostDecision>,
      ) => {
        if (execution.name !== 'ask_user_question') return next()
        if (mode === 'block') {
          return { kind: 'block' as const, feedback: [{ type: 'text', text: '合成 post-policy 阻断' }] }
        }
        if (mode === 'materialize') {
          return { kind: 'accept' as const, value: { answers: 'not-an-array' } }
        }
        const decision = await next()
        controller.abort()
        return decision
      }) as never)

      const identity = `ask-${mode}`
      const asked = await runTool(env, 'ask_user_question', identity, askArgs(), env.agents[0], controller.signal)
      expect(asked.isError).toBe(true)
      expect(observed(env, identity)).toEqual(asked)
      expect(env.providerCalls()).toBe(1)
      await assertStillBlocked(env, `save-after-${mode}`)
    } finally {
      await env.dispose()
    }
  })

  it('无 provider 与 invalid args 都由实际最终结果失败，不执行问题体或案件写入', async () => {
    const noProvider = await boot({ provider: false })
    try {
      expect((await startTask(noProvider)).kind).toBe('enter')
      const asked = await runTool(noProvider, 'ask_user_question', 'ask-no-provider', askArgs())
      expect(asked.isError).toBe(true)
      expect(observed(noProvider, 'ask-no-provider')).toEqual(asked)
      expect(noProvider.providerCalls()).toBe(0)
      await assertStillBlocked(noProvider, 'save-no-provider')
    } finally {
      await noProvider.dispose()
    }

    const invalid = await boot()
    try {
      expect((await startTask(invalid)).kind).toBe('enter')
      const asked = await runTool(invalid, 'ask_user_question', 'ask-invalid', { questions: [] })
      expect(asked.isError).toBe(true)
      expect(observed(invalid, 'ask-invalid')).toEqual(asked)
      expect(invalid.providerCalls()).toBe(0)
      await assertStillBlocked(invalid, 'save-invalid')
    } finally {
      await invalid.dispose()
    }
  })

  it('非存稿 case 工具用尽工具预算后，下一调用报告仍缺问题而不是伪造已保存', async () => {
    const env = await boot({ budget: { model_calls: 8, tool_calls: 1, minutes: 45 } })
    try {
      expect((await startTask(env)).kind).toBe('enter')
      const listed = await runTool(env, 'case_list_materials', 'list-budget', {})
      expect(listed.isError).toBe(false)
      const denied = await runTool(env, 'case_read_input', 'read-after-budget', { index: 1 })
      expect(denied.isError).toBe(true)
      expect(text(denied)).toContain(questionRequirementDenial(QUESTIONS))
      expect(text(denied)).not.toContain('已保存草稿')
      expect(env.core.writes()).toEqual([])
      expect(env.core.calls.filter((call) =>
        call.command === 'tool' && call.body.tool === 'case_list_materials')).toHaveLength(1)
    } finally {
      await env.dispose()
    }
  })

  it('实际 preStep 预算到顶时合同审查不代存草稿，并记 BUDGET_STOPPED', async () => {
    const env = await boot({ budget: { model_calls: 1, tool_calls: 24, minutes: 45 } })
    try {
      expect((await startTask(env)).kind).toBe('enter')
      expect((await startTask(env, env.agents[0], 2)).kind).toBe('reject')
      expect(env.core.writes()).toEqual([])
      expect(env.core.notes).toContain('BUDGET_STOPPED')
    } finally {
      await env.dispose()
    }
  })

  it('旧任务在新任务和新会话出现后才到达的最终成功结果不能解锁任何写入', async () => {
    const env = await boot({ agents: ['session-old', 'session-other'] })
    try {
      const oldAgent = env.agents[0]!
      const otherAgent = env.agents[1]!
      expect((await startTask(env, oldAgent)).kind).toBe('enter')

      let bodyDone!: () => void
      const bodyReached = new Promise<void>((resolve) => { bodyDone = resolve })
      let release!: () => void
      const held = new Promise<void>((resolve) => { release = resolve })
      env.ctx.on('tools/post-execute', (async (
        execution: RuntimeExecution,
        _result: RuntimeResult,
        next: () => Promise<PostDecision>,
      ) => {
        if (execution.name !== 'ask_user_question') return next()
        bodyDone()
        await held
        return next()
      }) as never)

      const pending = runTool(env, 'ask_user_question', 'ask-old-task', askArgs(), oldAgent)
      await bodyReached
      expect((await startTask(env, oldAgent)).kind).toBe('enter')
      expect((await startTask(env, otherAgent)).kind).toBe('enter')
      release()
      const late = await pending
      expect(late.isError).toBe(false)
      expect(observed(env, 'ask-old-task')).toEqual(late)
      expect(env.core.begins()).toHaveLength(3)
      expect(env.core.writes()).toEqual([])

      for (const [agent, id] of [[oldAgent, 'save-new-task'], [otherAgent, 'save-other-session']] as const) {
        const denied = await runTool(env, 'case_save_draft', id, {
          title: '不该保存', content: '合成正文',
        }, agent)
        expect(denied.isError).toBe(true)
      }
      expect(env.core.writes()).toEqual([])
    } finally {
      await env.dispose()
    }
  })
})
