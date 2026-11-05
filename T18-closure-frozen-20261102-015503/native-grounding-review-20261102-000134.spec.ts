import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  apply,
  DEFENSE_OPINION_SKILL,
  inject,
  LegalAgent,
} from '../agent/index.ts'
import type {
  GroundingGenerateOptions,
  GroundingStreamChunk,
} from '../agent/grounding-review.ts'
import type { Budget, Params, TaskState } from '../agent/task-state.ts'
import { CoreClient, type CoreCommand, type CoreResult, type Logger } from '../shared/core-client.ts'

type ExternalState = {
  enabled: boolean
  model: string | null
  contextWindow: number | null
  keyConfigured: boolean
  supportsTools: boolean
}

type ToolCall = { command: CoreCommand; body: Record<string, unknown> }
type Held = { started: () => void; wait: Promise<void> }

const noLog: Logger = () => {}
const PARAMS: Params = {
  thinking: '低',
  window: '64K',
  max_tokens: 4096,
  temperature: 0.2,
}
const BUDGET: Budget = { model_calls: 8, tool_calls: 24, minutes: 45 }
const NO_EXTERNAL: ExternalState = {
  enabled: false,
  model: null,
  contextWindow: null,
  keyConfigured: false,
  supportsTools: true,
}

const readFixture: unknown = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_read.result.json'),
  'utf8',
))
const draftFixture: unknown = JSON.parse(readFileSync(
  join(__dirname, '..', '..', 'contracts', 'examples', 'tool_save_draft.result.json'),
  'utf8',
))

const materialResult = () => ({
  ...(structuredClone(readFixture) as Record<string, unknown>),
  name: '借条',
  material_id: 'M0001',
  unit: 'page',
  start: 1,
  end: 1,
  text: '【第1页】借款人尚未还款。',
  has_more: false,
  next_start: null,
  next_offset: null,
})

const wikiResult = () => ({
  section: '争议焦点',
  text: '是否已经还款存在争议。',
  updated_at: null,
  stale: false,
})

const savedVersion = (version: number) => ({
  ...(structuredClone(draftFixture) as Record<string, unknown>),
  version,
})

class LocalCore extends CoreClient {
  readonly calls: ToolCall[] = []
  private sequence = 0
  private readonly toolReplies: Array<CoreResult<unknown>> = []
  private held: Held | undefined

  constructor(
    private readonly budget: Budget = BUDGET,
    private readonly skill: string | null = DEFENSE_OPINION_SKILL,
  ) {
    super(() => undefined, noLog)
  }

  queue(value: unknown): void {
    this.toolReplies.push({ ok: true, value })
  }

  fail(code = 'UNAVAILABLE', message = '合成失败'): void {
    this.toolReplies.push({ ok: false, error: { code, message } })
  }

  holdNext(started: () => void, wait: Promise<void>): void {
    this.held = { started, wait }
  }

  private typed<T>(value: CoreResult<unknown>): CoreResult<T> {
    return value as CoreResult<T>
  }

  override async call<T = unknown>(
    command: CoreCommand,
    body: Record<string, unknown>,
  ): Promise<CoreResult<T>> {
    this.calls.push({ command, body })
    if (command === 'task/begin') {
      this.sequence += 1
      return this.typed<T>({
        ok: true,
        value: {
          task_id: `T-grounding-${this.sequence}`,
          case_id: 'case-grounding',
          skill: this.skill,
          params: PARAMS,
          budget: this.budget,
        },
      })
    }
    if (command === 'context') {
      return this.typed<T>({
        ok: true,
        value: {
          l0: { text: '合成案件卡片' },
          l1: { text: '合成任务输入', truncated: false, toc: [] },
        },
      })
    }
    if (command === 'tool') {
      const held = this.held
      this.held = undefined
      if (held) {
        held.started()
        await held.wait
      }
      return this.typed<T>(this.toolReplies.shift() ?? {
        ok: false,
        error: { code: 'INTERNAL', message: '测试未排入工具结果' },
      })
    }
    return this.typed<T>({ ok: true, value: {} })
  }
}

const agentObj = (id: string) => ({ id, session: { header: { cwd: 'D:\\案件\\合成原生复核' } } })
const enter = () => ({ kind: 'enter' as const, messages: [] })

function makeAgent(
  core: LocalCore,
  stream?: (options: GroundingGenerateOptions) => AsyncIterable<GroundingStreamChunk>,
): LegalAgent {
  return new LegalAgent(
    core,
    noLog,
    () => {},
    () => {},
    () => false,
    () => false,
    async () => NO_EXTERNAL,
    async () => [],
    stream,
  )
}

async function startTask(
  agent: LegalAgent,
  session: string,
  signal?: AbortSignal,
): Promise<TaskState> {
  const decision = await agent.preStep(agentObj(session), 1, enter(), signal)
  if (decision.kind !== 'enter') throw new Error('合成任务未能开始')
  const state = agent.tasks.get(session)
  if (!state) throw new Error('合成任务状态不存在')
  state.noteSuccessfulDefenseSearch()
  return state
}

async function readMaterial(
  agent: LegalAgent,
  core: LocalCore,
  session: string,
  result: unknown = materialResult(),
): Promise<unknown> {
  const args = { name: '借条', start: 1, end: 1 }
  return readMaterialWithArgs(agent, core, session, args, result)
}

async function readMaterialWithArgs(
  agent: LegalAgent,
  core: LocalCore,
  session: string,
  args: Record<string, unknown>,
  result: unknown = materialResult(),
): Promise<unknown> {
  expect(agent.preTool(session, 'case_read_material', args)).toEqual({ kind: 'allow' })
  core.queue(result)
  return agent.executeTool(session, 'case_read_material', args)
}

async function saveDraft(
  agent: LegalAgent,
  core: LocalCore,
  session: string,
  version = 1,
  content = '辩护意见：被告已归还全部借款。',
): Promise<unknown> {
  const args = { title: '合成辩护意见', content }
  expect(agent.preTool(session, 'case_save_draft', args)).toEqual({ kind: 'allow' })
  core.queue(savedVersion(version))
  return agent.executeTool(session, 'case_save_draft', args)
}

async function readWiki(
  agent: LegalAgent,
  core: LocalCore,
  session: string,
): Promise<unknown> {
  const args = { section: '争议焦点' }
  expect(agent.preTool(session, 'case_read_wiki', args)).toEqual({ kind: 'allow' })
  core.queue(wikiResult())
  return agent.executeTool(session, 'case_read_wiki', args)
}

function streamOf(
  calls: GroundingGenerateOptions[],
  values: string[],
): (options: GroundingGenerateOptions) => AsyncIterable<GroundingStreamChunk> {
  return async function* (options) {
    calls.push(options)
    const value = values.shift()
    if (value !== undefined) yield { type: 'text-delta', text: value }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

function reviewJson(
  issues: unknown[] = [],
  uncertainty: string[] = [],
): string {
  return JSON.stringify({ issues, uncertainty })
}

function noticeText(decision: unknown): string | undefined {
  if (!decision || typeof decision !== 'object' || !('messages' in decision)) return undefined
  const messages = (decision as { messages?: unknown }).messages
  if (!Array.isArray(messages)) return undefined
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue
    const source = (message as { source?: unknown }).source
    if (!source || typeof source !== 'object' ||
      (source as { kind?: unknown }).kind !== 'lawbench-grounding-review') continue
    const content = (message as { content?: unknown }).content
    if (!Array.isArray(content)) return undefined
    return content.map((block) =>
      block && typeof block === 'object' && typeof (block as { text?: unknown }).text === 'string'
        ? (block as { text: string }).text
        : '').join('')
  }
  return undefined
}

async function reviewedSetup(
  stream: (options: GroundingGenerateOptions) => AsyncIterable<GroundingStreamChunk>,
  budget: Budget = BUDGET,
  content = '辩护意见：被告已归还全部借款。',
): Promise<{ core: LocalCore; agent: LegalAgent; session: string; state: TaskState }> {
  const core = new LocalCore(budget)
  const agent = makeAgent(core, stream)
  const session = `session-native-${Math.random()}`
  const state = await startTask(agent, session)
  await readMaterial(agent, core, session)
  await readWiki(agent, core, session)
  await saveDraft(agent, core, session, 1, content)
  return { core, agent, session, state }
}

describe('T18 原生辩护草稿独立来源复核', () => {
  it('生产形状的 ctx.llm.stream 被注入；两路匿名复核先记账，随后作者调用仍保留原路由与预算', async () => {
    expect(inject).toContain('llm')
    const calls: GroundingGenerateOptions[] = []
    const first = reviewJson([{
      kind: 'adverse_fact',
      draft_quote: '被告已归还全部借款',
      source_id: 'R001',
      source_quote: '借款人尚未还款',
      detail: '草稿结论与读取回执直接冲突。',
    }], ['是否另有还款凭证未读，UNKNOWN。'])
    const second = reviewJson([], ['仅凭现有有限回执不能证明全案只有单一证据。'])
    const setup = await reviewedSetup(streamOf(calls, [first, second]))

    const beforeSaveCalls = setup.core.calls.filter((call) =>
      call.command === 'tool' && call.body.tool === 'case_save_draft').length
    const next = await setup.agent.preStep(agentObj(setup.session), 2, enter())
    const text = noticeText(next)

    expect(setup.state.modelCalls).toBe(4)
    expect(calls).toHaveLength(2)
    expect(calls[0]?.system).not.toBe(calls[1]?.system)
    for (const options of calls) {
      expect(options.provider).toBe('lawfirm')
      expect(options.model).toBe('qwen38-27b')
      expect(options.reasoningEffort).toBe('low')
      expect(options.maxTokens).toBe(4096)
      expect(options.temperature).toBe(0.2)
      expect(options.sessionId).toBe(setup.session)
      expect(options).not.toHaveProperty('purpose')
      expect(options).not.toHaveProperty('tools')
      expect(Object.isFrozen(options)).toBe(false)
      expect(options.messages).toHaveLength(1)
      expect(options.messages[0]).toEqual({
        role: 'user',
        content: [{ type: 'text', text: expect.any(String) }],
      })
      expect(options.messages[0]).not.toHaveProperty('id')
      expect(options.messages[0]).not.toHaveProperty('source')
    }
    expect(text).toContain('草稿“被告已归还全部借款”')
    expect(text).toContain('R001“借款人尚未还款”')
    expect(calls[0]?.messages[0]?.content[0]?.text).toContain('是否已经还款存在争议')
    expect(calls[0]?.messages[0]?.content[0]?.text).toContain('"id":"R002"')
    expect(text).toContain('不是事实或法律通过')
    expect(text).not.toContain('事实 PASS')
    expect(setup.core.calls.filter((call) =>
      call.command === 'tool' && call.body.tool === 'case_save_draft')).toHaveLength(beforeSaveCalls)
  })

  it('首次成功保存后只触发一次；后续保存不重审，修改稿明确未复核', async () => {
    const calls: GroundingGenerateOptions[] = []
    const setup = await reviewedSetup(streamOf(calls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const firstNext = await setup.agent.preStep(agentObj(setup.session), 2, enter())
    expect(noticeText(firstNext)).toContain('未返回可锚定的具体问题')
    expect(noticeText(firstNext)).toContain('不表示事实或法律结论通过')

    await saveDraft(setup.agent, setup.core, setup.session, 2, '修改稿：借款人已经还款。')
    const secondNext = await setup.agent.preStep(agentObj(setup.session), 3, enter())
    expect(calls).toHaveLength(2)
    expect(noticeText(secondNext)).toBeUndefined()
  })

  it('预算不足时在复核前拒绝，至少保留一次作者调用且不更改收尾计数规则', async () => {
    const calls: GroundingGenerateOptions[] = []
    const setup = await reviewedSetup(streamOf(calls, []), {
      model_calls: 3,
      tool_calls: 24,
      minutes: 45,
    })
    const next = await setup.agent.preStep(agentObj(setup.session), 2, enter())
    expect(calls).toHaveLength(0)
    expect(setup.state.modelCalls).toBe(2)
    expect(noticeText(next)).toContain('已保留至少一次作者调用')
  })

  it('失败、拒绝和迟到的读取回执都不进入复核材料', async () => {
    const calls: GroundingGenerateOptions[] = []
    const core = new LocalCore()
    const agent = makeAgent(core, streamOf(calls, [reviewJson([], []), reviewJson([], [])]))
    const session = 'session-native-stale-read'
    await startTask(agent, session)

    const deniedArgs = { name: '失败材料', start: 1, end: 1 }
    expect(agent.preTool(session, 'case_read_material', deniedArgs)).toEqual({ kind: 'allow' })
    core.fail()
    await expect(agent.executeTool(session, 'case_read_material', deniedArgs)).rejects.toThrow('合成失败')

    let releaseStale!: () => void
    const staleGate = new Promise<void>((resolve) => { releaseStale = resolve })
    let markStaleStarted!: () => void
    const started = new Promise<void>((resolve) => { markStaleStarted = resolve })
    core.holdNext(markStaleStarted, staleGate)
    const staleArgs = { name: '迟到材料', start: 1, end: 1 }
    core.queue(materialResult())
    const stale = agent.executeTool(session, 'case_read_material', staleArgs)
    await started
    await startTask(agent, session)
    releaseStale()
    await stale

    await readMaterial(agent, core, session)
    await saveDraft(agent, core, session)
    const next = await agent.preStep(agentObj(session), 2, enter())
    const payload = calls[0]?.messages[0]?.content[0]?.text
    expect(payload).toContain('借款人尚未还款')
    expect(payload).not.toContain('失败材料')
    expect(payload).not.toContain('迟到材料')
    expect(noticeText(next)).toContain('原生独立复核')
  })

  it('草稿或来源超上限时显式标为不完整，不静默截断为通过结论', async () => {
    const capCalls: GroundingGenerateOptions[] = []
    const capCore = new LocalCore()
    const capAgent = makeAgent(capCore, streamOf(capCalls, []))
    const capSession = 'session-native-draft-cap'
    await startTask(capAgent, capSession)
    await readMaterial(capAgent, capCore, capSession)
    await saveDraft(capAgent, capCore, capSession, 1, '长'.repeat(6_001))
    const capNext = await capAgent.preStep(agentObj(capSession), 2, enter())
    expect(capCalls).toHaveLength(0)
    expect(noticeText(capNext)).toContain('草稿超出有限复核上限')
    expect(noticeText(capNext)).not.toContain('通过。')

    const sourceCalls: GroundingGenerateOptions[] = []
    const sourceCore = new LocalCore()
    const sourceAgent = makeAgent(sourceCore, streamOf(sourceCalls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const sourceSession = 'session-native-source-cap'
    await startTask(sourceAgent, sourceSession)
    await readMaterial(sourceAgent, sourceCore, sourceSession, {
      ...materialResult(),
      text: '来源'.repeat(3_001),
    })
    await saveDraft(sourceAgent, sourceCore, sourceSession)
    const sourceNext = await sourceAgent.preStep(agentObj(sourceSession), 2, enter())
    expect(sourceCalls).toHaveLength(2)
    expect(noticeText(sourceNext)).toContain('读取回执不完整')
    expect(noticeText(sourceNext)).toContain('UNKNOWN')
  })

  it('取消、流错误、非正常结束、坏 JSON 和伪锚点都不注入可用结论', async () => {
    const cases: Array<{
      name: string
      stream: (options: GroundingGenerateOptions) => AsyncIterable<GroundingStreamChunk>
      signal?: () => AbortSignal
    }> = [
      {
        name: 'cancel',
        stream: async function* () {
          yield { type: 'text-delta', text: reviewJson() }
          yield { type: 'finish', reason: { kind: 'stop' } }
        },
        signal: () => {
          const controller = new AbortController()
          controller.abort()
          return controller.signal
        },
      },
      {
        name: 'error',
        stream: async function* () {
          yield { type: 'finish', reason: { kind: 'error', failure: { code: 'X' } } }
        },
      },
      {
        name: 'thrown',
        stream: async function* () {
          throw new Error('合成流异常')
        },
      },
      {
        name: 'nonfinish',
        stream: async function* () {
          yield { type: 'text-delta', text: reviewJson() }
        },
      },
      {
        name: 'malformed',
        stream: async function* () {
          yield { type: 'text-delta', text: 'not-json' }
          yield { type: 'finish', reason: { kind: 'stop' } }
        },
      },
      {
        name: 'fake-anchor',
        stream: async function* () {
          yield {
            type: 'text-delta',
            text: reviewJson([{
              kind: 'adverse_fact',
              draft_quote: '被告已归还全部借款',
              source_id: 'R001',
              source_quote: '来源中不存在的句子',
              detail: '伪锚点。',
            }]),
          }
          yield { type: 'finish', reason: { kind: 'stop' } }
        },
      },
    ]

    for (const item of cases) {
      const core = new LocalCore()
      const agent = makeAgent(core, item.stream)
      const session = `session-native-unavailable-${item.name}`
      await startTask(agent, session)
      await readMaterial(agent, core, session)
      await saveDraft(agent, core, session)
      const next = await agent.preStep(agentObj(session), 2, enter(), item.signal?.())
      if (item.name === 'cancel') {
        expect(noticeText(next)).toBeUndefined()
      } else {
        expect(noticeText(next)).toContain('复核不可用')
        expect(noticeText(next)).not.toContain('法律结论通过')
      }
    }
  })

  it('复核等待期间任务被替换时不向旧 decision 注入，也不改后续任务', async () => {
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const entered = new Promise<void>((resolve) => { started = resolve })
    const stream = async function* (options: GroundingGenerateOptions) {
      expect(options.sessionId).toBe('session-native-late')
      started()
      await gate
      yield { type: 'text-delta', text: reviewJson() }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
    const core = new LocalCore()
    const agent = makeAgent(core, stream)
    const session = 'session-native-late'
    await startTask(agent, session)
    await readMaterial(agent, core, session)
    await saveDraft(agent, core, session)

    const oldPreparation = agent.preStep(agentObj(session), 2, enter())
    await entered
    const replacement = await startTask(agent, session)
    release()
    const oldDecision = await oldPreparation
    expect(oldDecision).toEqual({ kind: 'reject' })
    expect(noticeText(oldDecision)).toBeUndefined()
    expect(agent.tasks.get(session)).toBe(replacement)
    expect(replacement.modelCalls).toBe(1)
  })

  it('finish 后出现尾块时主动 abort 并有界关闭未 done 的迭代器', async () => {
    const streamCalls: GroundingGenerateOptions[] = []
    let returnCalls = 0
    const stream = (options: GroundingGenerateOptions): AsyncIterable<GroundingStreamChunk> => {
      streamCalls.push(options)
      let nextCalls = 0
      const iterator: AsyncIterator<GroundingStreamChunk> = {
        async next() {
          nextCalls += 1
          if (nextCalls === 1) return { done: false, value: { type: 'finish', reason: { kind: 'stop' } } }
          if (nextCalls === 2) return { done: false, value: { type: 'text-delta', text: reviewJson() } }
          return { done: true, value: undefined }
        },
        async return() {
          returnCalls += 1
          return { done: true, value: undefined }
        },
      }
      return { [Symbol.asyncIterator]: () => iterator }
    }
    const setup = await reviewedSetup(stream)
    const next = await setup.agent.preStep(agentObj(setup.session), 2, enter())

    expect(returnCalls).toBe(1)
    expect(streamCalls).toHaveLength(1)
    expect(streamCalls[0]?.signal?.aborted).toBe(true)
    expect(noticeText(next)).toContain('复核不可用')
    expect(noticeText(next)).not.toContain('状态：UNVERIFIED')
  })

  it('finish 后取消仍在等 next 的流时立即 abort 并关闭迭代器', async () => {
    const controller = new AbortController()
    const streamCalls: GroundingGenerateOptions[] = []
    let returnCalls = 0
    const stream = (options: GroundingGenerateOptions): AsyncIterable<GroundingStreamChunk> => {
      streamCalls.push(options)
      let nextCalls = 0
      const iterator: AsyncIterator<GroundingStreamChunk> = {
        async next() {
          nextCalls += 1
          if (nextCalls === 1) return { done: false, value: { type: 'finish', reason: { kind: 'stop' } } }
          controller.abort()
          return await new Promise<IteratorResult<GroundingStreamChunk>>(() => {})
        },
        async return() {
          returnCalls += 1
          return { done: true, value: undefined }
        },
      }
      return { [Symbol.asyncIterator]: () => iterator }
    }
    const setup = await reviewedSetup(stream)
    const next = await setup.agent.preStep(agentObj(setup.session), 2, enter(), controller.signal)

    expect(next).toEqual({ kind: 'reject' })
    expect(returnCalls).toBe(1)
    expect(streamCalls[0]?.signal?.aborted).toBe(true)
  })

  it('任务替换会立即取消静默复核、清掉旧材料并拒绝旧 pre-step', async () => {
    let markEntered!: () => void
    const entered = new Promise<void>((resolve) => { markEntered = resolve })
    let reviewSignal: AbortSignal | undefined
    let returnCalls = 0
    const stream = (options: GroundingGenerateOptions): AsyncIterable<GroundingStreamChunk> => {
      reviewSignal = options.signal
      const iterator: AsyncIterator<GroundingStreamChunk> = {
        async next() {
          markEntered()
          return await new Promise<IteratorResult<GroundingStreamChunk>>(() => {})
        },
        async return() {
          returnCalls += 1
          return { done: true, value: undefined }
        },
      }
      return { [Symbol.asyncIterator]: () => iterator }
    }
    const core = new LocalCore()
    const agent = makeAgent(core, stream)
    const session = 'session-native-silent-replacement'
    await startTask(agent, session)
    await readMaterial(agent, core, session)
    await saveDraft(agent, core, session)

    const oldPreparation = agent.preStep(agentObj(session), 2, enter())
    await entered
    const replacement = await startTask(agent, session)
    const oldDecision = await oldPreparation

    expect(oldDecision).toEqual({ kind: 'reject' })
    expect(reviewSignal?.aborted).toBe(true)
    expect(returnCalls).toBe(1)
    expect(agent.tasks.get(session)).toBe(replacement)
    expect(replacement.modelCalls).toBe(1)
  })

  it('恰在五分钟边界跳过复核记账，只让作者调用取得 wrap-up 提醒', async () => {
    const originalNow = Date.now
    const startedAt = 1_700_000_000_000
    let now = startedAt
    Date.now = () => now
    try {
      const calls: GroundingGenerateOptions[] = []
      const setup = await reviewedSetup(streamOf(calls, []))
      now = startedAt + (BUDGET.minutes - 5) * 60_000
      const next = await setup.agent.preStep(agentObj(setup.session), 2, enter())

      expect(calls).toHaveLength(0)
      expect(setup.state.modelCalls).toBe(2)
      expect(noticeText(next)).toContain('已保留至少一次作者调用')
      expect(JSON.stringify(next)).toContain('立即收尾')
    } finally {
      Date.now = originalNow
    }
  })

  it('两路评论者各达上限时第二路问题与不确定项均被保留且总量不超界', async () => {
    const issue = (detail: string) => ({
      kind: 'adverse_fact',
      draft_quote: '被告已归还全部借款',
      source_id: 'R001',
      source_quote: '借款人尚未还款',
      detail,
    })
    const firstIssues = ['first-a', 'first-b', 'first-c', 'first-d', 'first-e', 'first-f'].map(issue)
    const secondIssues = ['second-a', 'second-b', 'second-c', 'second-d', 'second-e', 'second-f'].map(issue)
    const firstUncertainty = ['first-u1', 'first-u2', 'first-u3', 'first-u4']
    const secondUncertainty = ['second-u1', 'second-u2', 'second-u3', 'second-u4']
    const calls: GroundingGenerateOptions[] = []
    const setup = await reviewedSetup(streamOf(calls, [
      reviewJson(firstIssues, firstUncertainty),
      reviewJson(secondIssues, secondUncertainty),
    ]))
    const next = await setup.agent.preStep(agentObj(setup.session), 2, enter())
    const text = noticeText(next) ?? ''

    for (const detail of [...firstIssues.map((item) => item.detail), ...secondIssues.map((item) => item.detail)]) {
      expect(text).toContain(detail)
    }
    for (const item of [...firstUncertainty, ...secondUncertainty]) expect(text).toContain(item)
    expect(text).not.toContain('未逐项展开')
  })

  it('读取范围与文本复制分开标记：顶层续读、未读分片和起始号大于一均按片段处理', async () => {
    const partialCalls: GroundingGenerateOptions[] = []
    const partialCore = new LocalCore()
    const partialAgent = makeAgent(partialCore, streamOf(partialCalls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const partialSession = 'session-native-read-scope-parts'
    await startTask(partialAgent, partialSession)
    await readMaterialWithArgs(
      partialAgent,
      partialCore,
      partialSession,
      { name: '合成材料甲', start: 1, end: 2 },
      {
        ...materialResult(),
        name: '合成材料甲',
        start: 1,
        end: 2,
        text: '合成片段一。',
        has_more: true,
        next_start: 3,
        next_offset: null,
        parts: [
          {
            name: '合成材料甲',
            material_id: 'M0001',
            unit: 'page',
            read: true,
            start: 1,
            end: 1,
            has_more: true,
            next_start: 2,
            error: null,
          },
          {
            name: '合成材料乙',
            material_id: 'M0002',
            unit: 'page',
            read: false,
            start: null,
            end: null,
            has_more: false,
            next_start: null,
            error: '放不下',
          },
        ],
      },
    )
    await saveDraft(partialAgent, partialCore, partialSession)
    const partialNext = await partialAgent.preStep(agentObj(partialSession), 2, enter())
    const partialPayload = partialCalls[0]?.messages[0]?.content[0]?.text
    expect(partialCalls).toHaveLength(2)
    expect(partialPayload).toContain('"read_complete":false')
    expect(partialPayload).toContain('"has_more":true')
    expect(partialPayload).toContain('"next_start":3')
    expect(partialPayload).toContain('"read":false')
    expect(noticeText(partialNext)).toContain('复核仅使用 1 条读取回执返回的片段')
    expect(noticeText(partialNext)).toContain('片段范围外按 UNKNOWN 处理')

    const boundedCalls: GroundingGenerateOptions[] = []
    const boundedCore = new LocalCore()
    const boundedAgent = makeAgent(boundedCore, streamOf(boundedCalls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const boundedSession = 'session-native-read-scope-bounded'
    await startTask(boundedAgent, boundedSession)
    await readMaterialWithArgs(
      boundedAgent,
      boundedCore,
      boundedSession,
      { name: '合成材料丙', start: 3, end: 3 },
      {
        ...materialResult(),
        name: '合成材料丙',
        start: 3,
        end: 3,
        text: '合成片段三。',
        has_more: false,
        next_start: null,
        next_offset: null,
      },
    )
    await saveDraft(boundedAgent, boundedCore, boundedSession)
    const boundedNext = await boundedAgent.preStep(agentObj(boundedSession), 2, enter())
    const boundedPayload = boundedCalls[0]?.messages[0]?.content[0]?.text
    expect(boundedCalls).toHaveLength(2)
    expect(boundedPayload).toContain('"start":3')
    expect(boundedPayload).toContain('"read_complete":false')
    expect(noticeText(boundedNext)).toContain('复核仅使用 1 条读取回执返回的片段')
  })

  it('标题与正文分别接受原样锚点，跨标题正文的拼接伪锚点仍整体拒绝', async () => {
    const positiveCalls: GroundingGenerateOptions[] = []
    const positive = await reviewedSetup(streamOf(positiveCalls, [
      reviewJson([{
        kind: 'adverse_fact',
        draft_quote: '合成辩护意见',
        source_id: 'R001',
        source_quote: '借款人尚未还款',
        detail: '标题锚点应可独立核对。',
      }], []),
      reviewJson([], []),
    ]), BUDGET, '正文只含合成说明。')
    const positiveNext = await positive.agent.preStep(agentObj(positive.session), 2, enter())
    expect(noticeText(positiveNext)).toContain('草稿“合成辩护意见”')
    expect(noticeText(positiveNext)).not.toContain('复核不可用')

    const negativeCalls: GroundingGenerateOptions[] = []
    const negative = await reviewedSetup(streamOf(negativeCalls, [
      reviewJson([{
        kind: 'adverse_fact',
        draft_quote: '合成辩护意见\n正文只含合成说明。',
        source_id: 'R001',
        source_quote: '借款人尚未还款',
        detail: '跨字段拼接不应通过。',
      }], []),
    ]), BUDGET, '正文只含合成说明。')
    const negativeNext = await negative.agent.preStep(agentObj(negative.session), 2, enter())
    expect(negativeCalls).toHaveLength(1)
    expect(noticeText(negativeNext)).toContain('复核不可用')
  })

  it('超长请求、回执、分片与路径元数据不进入载荷；多条受限回执受汇总预算约束', async () => {
    const longMetadata = `合成元数据${'甲'.repeat(700)}`
    const oversizedCalls: GroundingGenerateOptions[] = []
    const oversizedCore = new LocalCore()
    const oversizedAgent = makeAgent(oversizedCore, streamOf(oversizedCalls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const oversizedSession = 'session-native-metadata-cap'
    await startTask(oversizedAgent, oversizedSession)
    await readMaterialWithArgs(
      oversizedAgent,
      oversizedCore,
      oversizedSession,
      { name: longMetadata, start: 1, end: 1 },
      {
        ...materialResult(),
        name: longMetadata,
        parts: [{
          name: longMetadata,
          material_id: 'M0001',
          unit: 'page',
          read: false,
          start: null,
          end: null,
          has_more: false,
          next_start: null,
          error: longMetadata,
        }],
      },
    )
    const saveArgs = { title: '合成辩护意见', content: '正文只含合成说明。' }
    expect(oversizedAgent.preTool(oversizedSession, 'case_save_draft', saveArgs)).toEqual({ kind: 'allow' })
    oversizedCore.queue({
      ...savedVersion(1),
      path: `C:\\合成\\${'乙'.repeat(1_100)}`,
    })
    await oversizedAgent.executeTool(oversizedSession, 'case_save_draft', saveArgs)
    const oversizedNext = await oversizedAgent.preStep(agentObj(oversizedSession), 2, enter())
    const oversizedPayload = oversizedCalls[0]?.messages[0]?.content[0]?.text
    expect(oversizedCalls).toHaveLength(2)
    expect(oversizedPayload).toContain('"read_complete":null')
    expect(oversizedPayload).toContain('"metadata_complete":false')
    expect(oversizedPayload).toContain('"path_complete":false')
    expect(oversizedPayload).not.toContain(longMetadata)
    expect(noticeText(oversizedNext)).toContain('读取回执不完整')
    expect(noticeText(oversizedNext)).toContain('保存路径元数据不可用')

    const aggregateCalls: GroundingGenerateOptions[] = []
    const aggregateCore = new LocalCore()
    const aggregateAgent = makeAgent(aggregateCore, streamOf(aggregateCalls, [
      reviewJson([], []),
      reviewJson([], []),
    ]))
    const aggregateSession = 'session-native-metadata-aggregate'
    await startTask(aggregateAgent, aggregateSession)
    for (let index = 1; index <= 8; index += 1) {
      const name = `合成${index}${'丙'.repeat(390)}`
      await readMaterialWithArgs(
        aggregateAgent,
        aggregateCore,
        aggregateSession,
        { name, start: 1, end: 1 },
        { ...materialResult(), name, text: `合成片段${index}。` },
      )
    }
    await saveDraft(aggregateAgent, aggregateCore, aggregateSession)
    const aggregateNext = await aggregateAgent.preStep(agentObj(aggregateSession), 2, enter())
    const aggregatePayload = aggregateCalls[0]?.messages[0]?.content[0]?.text
    expect(aggregateCalls).toHaveLength(2)
    expect(aggregatePayload).toContain('"unavailable":true')
    expect(aggregatePayload).toContain('"metadata_complete":false')
    const aggregateReviewPayload = JSON.parse(aggregatePayload ?? '{}') as {
      sources: Array<{
        request: Record<string, unknown>
        receipt: Record<string, unknown>
        read_complete: boolean | null
        metadata_complete: boolean
      }>
    }
    const unavailableReceipts = aggregateReviewPayload.sources.filter((source) =>
      source.request.unavailable === true || source.receipt.unavailable === true)
    expect(unavailableReceipts.length).toBeGreaterThan(0)
    for (const source of unavailableReceipts) {
      expect(source.metadata_complete).toBe(false)
      expect(source.read_complete).toBeNull()
    }
    expect(aggregateReviewPayload.sources.some((source) =>
      source.request.unavailable !== true &&
      source.receipt.unavailable !== true &&
      source.metadata_complete &&
      source.read_complete === true)).toBe(true)
    expect(noticeText(aggregateNext)).toContain('读取回执不完整')
    expect(noticeText(aggregateNext)).toContain('范围完整性不可用')
  })

  it('完整读取同时校验请求上界、多点材料身份和每个已读分片的整数范围', async () => {
    const readComplete = async (
      args: Record<string, unknown>,
      result: Record<string, unknown>,
    ): Promise<{ value: boolean | null | undefined; notice: string }> => {
      const calls: GroundingGenerateOptions[] = []
      const core = new LocalCore()
      const agent = makeAgent(core, streamOf(calls, [reviewJson([], []), reviewJson([], [])]))
      const session = `session-native-bounded-read-${Math.random()}`
      await startTask(agent, session)
      await readMaterialWithArgs(agent, core, session, args, result)
      await saveDraft(agent, core, session)
      const next = await agent.preStep(agentObj(session), 2, enter())
      const payload = JSON.parse(calls[0]?.messages[0]?.content[0]?.text ?? '{}') as {
        sources?: Array<{ read_complete?: boolean | null }>
      }
      return { value: payload.sources?.[0]?.read_complete, notice: noticeText(next) ?? '' }
    }

    const positive = await readComplete(
      { name: '合成主材料', more_names: ['合成附件甲'], start: 1, end: 1 },
      {
        ...materialResult(),
        name: '合成主材料',
        end: 1,
        text: '合成完整片段。',
        parts: [
          {
            name: '合成主材料', material_id: 'M0001', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
          {
            name: '合成附件甲', material_id: 'M0002', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
        ],
      },
    )
    expect(positive.value).toBe(true)

    const mainPartBelowRequest = await readComplete(
      { name: '合成主材料', more_names: ['合成附件甲'], start: 1, end: 2 },
      {
        ...materialResult(),
        name: '合成主材料',
        end: 2,
        parts: [
          {
            name: '合成主材料', material_id: 'M0001', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
          {
            name: '合成附件甲', material_id: 'M0002', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
        ],
      },
    )
    expect(mainPartBelowRequest.value).toBe(false)

    const unrelatedCleanPart = await readComplete(
      { name: '合成主材料', start: 1, end: 1 },
      {
        ...materialResult(),
        name: '合成主材料',
        parts: [{
          name: '合成无关材料', material_id: 'M0001', unit: 'page', read: true,
          start: 1, end: 1, has_more: false, next_start: null, error: null,
        }],
      },
    )
    expect(unrelatedCleanPart.value).toBeNull()
    expect(unrelatedCleanPart.notice).toContain('UNKNOWN')
    expect(unrelatedCleanPart.notice).toContain('范围完整性不可用')

    const beyondTotal = await readComplete(
      { name: '合成超界材料', start: 1, end: 2 },
      {
        ...materialResult(),
        name: '合成超界材料',
        end: 1,
        parts: [{
          name: '合成超界材料', material_id: 'M0001', unit: 'page', read: true,
          start: 1, end: 1, has_more: false, next_start: null, error: null,
        }],
      },
    )
    expect(beyondTotal.value).toBe(false)

    const missing = await readComplete(
      { name: '合成主材料', more_names: ['合成附件甲'], start: 1, end: 1 },
      {
        ...materialResult(),
        name: '合成主材料',
        parts: [{
          name: '合成主材料', material_id: 'M0001', unit: 'page', read: true,
          start: 1, end: 1, has_more: false, next_start: null, error: null,
        }],
      },
    )
    expect(missing.value).toBeNull()
    expect(missing.notice).toContain('范围完整性不可用')

    const moreNamesWithoutParts = await readComplete(
      { name: '合成主材料', more_names: ['合成附件甲'], start: 1, end: 1 },
      { ...materialResult(), name: '合成主材料' },
    )
    expect(moreNamesWithoutParts.value).toBeNull()
    expect(moreNamesWithoutParts.notice).toContain('范围完整性不可用')

    const wrongTopNameWithoutParts = await readComplete(
      { name: '合成主材料', start: 1, end: 1 },
      { ...materialResult(), name: '合成其他材料' },
    )
    expect(wrongTopNameWithoutParts.value).toBeNull()
    expect(wrongTopNameWithoutParts.notice).toContain('范围完整性不可用')

    const mismatched = await readComplete(
      { name: '合成主材料', more_names: ['合成附件甲'], start: 1, end: 1 },
      {
        ...materialResult(),
        name: '合成主材料',
        parts: [
          {
            name: '合成主材料', material_id: 'M0001', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
          {
            name: '合成附件甲 ', material_id: 'M0002', unit: 'page', read: true,
            start: 1, end: 1, has_more: false, next_start: null, error: null,
          },
        ],
      },
    )
    expect(mismatched.value).toBeNull()

    const nullEnd = await readComplete(
      { name: '合成无端点材料', start: 1, end: 1 },
      {
        ...materialResult(),
        name: '合成无端点材料',
        parts: [{
          name: '合成无端点材料', material_id: 'M0001', unit: 'page', read: true,
          start: 1, end: null, has_more: false, next_start: null, error: null,
        }],
      },
    )
    expect(nullEnd.value).toBe(false)

    const shiftedStart = await readComplete(
      { name: '合成偏移分片材料', start: 1, end: 2 },
      {
        ...materialResult(),
        name: '合成偏移分片材料',
        end: 2,
        parts: [{
          name: '合成偏移分片材料', material_id: 'M0001', unit: 'page', read: true,
          start: 2, end: 2, has_more: false, next_start: null, error: null,
        }],
      },
    )
    expect(shiftedStart.value).toBe(false)
  })

  it('八条以上已全读材料的名称省略仍属覆盖完整，并在资料限制中单独提示身份范围', async () => {
    const calls: GroundingGenerateOptions[] = []
    const core = new LocalCore()
    const agent = makeAgent(core, streamOf(calls, [reviewJson([], []), reviewJson([], [])]))
    const session = 'session-native-coverage-omitted-full-read'
    await startTask(agent, session)
    for (let index = 1; index <= 10; index += 1) {
      await readMaterialWithArgs(
        agent,
        core,
        session,
        { name: `合成材料${index}`, start: 1, end: 1 },
        { ...materialResult(), name: `合成材料${index}`, text: `合成片段${index}。` },
      )
    }
    const args = { title: '合成辩护意见', content: '正文只含合成说明。' }
    expect(agent.preTool(session, 'case_save_draft', args)).toEqual({ kind: 'allow' })
    core.queue({
      ...savedVersion(1),
      coverage: {
        total: 10,
        fully_read: [
          '合成材料1', '合成材料2', '合成材料3', '合成材料4', '合成材料5',
          '合成材料6', '合成材料7', '合成材料8', '合成材料9', '合成材料10',
        ],
        partially_read: [],
        not_read: [],
        unreadable: [],
      },
    })
    await agent.executeTool(session, 'case_save_draft', args)
    const next = await agent.preStep(agentObj(session), 2, enter())
    const notice = noticeText(next) ?? ''
    expect(notice).toContain('保存覆盖中另有 2 个已全读材料名称被省略')
    expect(notice).toContain('身份元数据受限')
    expect(notice).toContain('实际取回回执之外仍按 UNKNOWN 处理')
    expect(notice).not.toContain('保存覆盖不完整')
  })

  it('接近汇总元数据上限时，放不下的受限回执在入列前按单条省略并保留精确 JSON 边界', async () => {
    const calls: GroundingGenerateOptions[] = []
    const core = new LocalCore()
    const agent = makeAgent(core, streamOf(calls, [reviewJson([], []), reviewJson([], [])]))
    const session = 'session-native-metadata-near-aggregate-cap'
    await startTask(agent, session)
    for (let index = 1; index <= 5; index += 1) {
      const name = `${index}${'甲'.repeat(504)}`
      await readMaterialWithArgs(
        agent,
        core,
        session,
        { name, start: 1, end: 1 },
        {
          ...materialResult(),
          name,
          material_id: `M${String(index).padStart(4, '0')}`,
          unit: 'page',
          start: 1,
          end: 1,
          has_more: false,
          next_start: null,
          next_offset: null,
          text: '合成近上限片段。',
        },
      )
    }
    await readMaterialWithArgs(
      agent,
      core,
      session,
      { name: '合成溢出材料', start: 1, end: 1 },
      { ...materialResult(), name: '合成溢出材料', text: '合成溢出片段。' },
    )
    await saveDraft(agent, core, session)
    const next = await agent.preStep(agentObj(session), 2, enter())
    const payload = JSON.parse(calls[0]?.messages[0]?.content[0]?.text ?? '{}') as {
      sources: Array<{
        request: Record<string, unknown>
        receipt: Record<string, unknown>
        parts: unknown[]
      }>
      omitted_sources?: number
    }
    const storedMetadataChars = payload.sources.reduce((total, source) =>
      total + JSON.stringify({
        request: source.request,
        receipt: source.receipt,
        parts: source.parts,
      }).length, 0)
    const fallbackMetadataChars = JSON.stringify({
      request: { unavailable: true },
      receipt: { unavailable: true },
      parts: [],
    }).length
    expect(payload.sources).toHaveLength(5)
    expect(payload.omitted_sources).toBe(1)
    expect(storedMetadataChars).toBeLessThanOrEqual(6_000)
    expect(storedMetadataChars + fallbackMetadataChars).toBeGreaterThan(6_000)
    expect(noticeText(next)).toContain('读取回执不完整')
  })

  it('立即返回的大量空文本分片受固定上限约束，失败后仍完成迭代器清理', async () => {
    const calls: GroundingGenerateOptions[] = []
    let yielded = 0
    let iteratorReturned = false
    const flood = (options: GroundingGenerateOptions): AsyncIterable<GroundingStreamChunk> => {
      calls.push(options)
      return (async function* () {
        try {
          for (let index = 0; index < 20_000; index += 1) {
            yielded += 1
            yield { type: 'text-delta', text: '' }
          }
        } finally {
          iteratorReturned = true
        }
      })()
    }
    const core = new LocalCore()
    const agent = makeAgent(core, flood)
    const session = 'session-native-empty-chunk-flood'
    await startTask(agent, session)
    await readMaterial(agent, core, session)
    await saveDraft(agent, core, session)
    const next = await agent.preStep(agentObj(session), 2, enter())
    expect(yielded).toBe(16_384)
    expect(iteratorReturned).toBe(true)
    expect(calls).toHaveLength(1)
    expect(noticeText(next)).toContain('复核不可用（复核流分片超过安全上限）')
  }, 2_000)

  it('真实 apply 的 pre-step 与工具 execute 走通 ctx.llm.stream，并保留外部窗口路由', async () => {
    type Hook = (...args: never[]) => unknown
    type Registration = { fn: Hook; prepend: boolean }
    type RegisteredTool = {
      name: string
      execute(args: unknown, exec: { agent: { id: string } }): Promise<unknown>
    }
    const listeners = new Map<string, Registration[]>()
    const definitions = new Map<string, RegisteredTool>()
    const subject = agentObj('session-native-apply-production')
    const reviewCalls: GroundingGenerateOptions[] = []
    const coreCalls: ToolCall[] = []
    const replies: Array<CoreResult<unknown>> = [
      { ok: true, value: { hits: [], total: 0, truncated: false } },
      { ok: true, value: materialResult() },
      { ok: true, value: savedVersion(1) },
    ]
    const first = reviewJson([{
      kind: 'adverse_fact',
      draft_quote: '被告已归还全部借款',
      source_id: 'R001',
      source_quote: '借款人尚未还款',
      detail: 'apply 路径保留了合成评论。',
    }], [])
    const originalCall = CoreClient.prototype.call

    CoreClient.prototype.call = (async function <T = unknown>(
      command: CoreCommand,
      body: Record<string, unknown>,
    ): Promise<CoreResult<T>> {
      coreCalls.push({ command, body })
      if (command === 'task/begin') {
        return {
          ok: true,
          value: {
            task_id: 'T-grounding-apply',
            case_id: 'case-grounding',
            skill: DEFENSE_OPINION_SKILL,
            params: PARAMS,
            budget: BUDGET,
            route: 'external',
          },
        } as CoreResult<T>
      }
      if (command === 'context') {
        return {
          ok: true,
          value: {
            l0: { text: '合成案件卡片' },
            l1: { text: '合成任务输入', truncated: false, toc: [] },
          },
        } as CoreResult<T>
      }
      if (command === 'tool') {
        return (replies.shift() ?? {
          ok: false,
          error: { code: 'INTERNAL', message: '测试未排入工具结果' },
        }) as CoreResult<T>
      }
      return { ok: true, value: {} } as CoreResult<T>
    }) as typeof CoreClient.prototype.call

    try {
      const ctx = {
        on(event: string, fn: Hook, options?: { prepend?: boolean }) {
          const entries = listeners.get(event) ?? []
          entries.push({ fn, prepend: options?.prepend === true })
          listeners.set(event, entries)
        },
        get() { return undefined },
        tools: {
          register(definition: unknown) {
            const tool = definition as RegisteredTool
            definitions.set(tool.name, tool)
            return () => {}
          },
        },
        llm: { stream: streamOf(reviewCalls, [first, reviewJson([], [])]) },
        lawbenchCore: {
          endpoint: () => ({ port: 17650, token: 'fixture-token' }),
          externalLlmState: async () => ({
            enabled: true,
            model: 'fixture-external-review-model',
            contextWindow: 65_536,
            keyConfigured: true,
            supportsTools: true,
          }),
          skillQuestions: async () => [],
        },
        effect(fn: () => () => void) { fn() },
        logger: () => ({ info() {}, warn() {}, error() {} }),
      }
      apply(ctx as never, { appData: tmpdir() })

      const waterfall = async (event: string, args: unknown[], fallback: () => unknown): Promise<unknown> => {
        const entries = [...(listeners.get(event) ?? [])]
          .sort((left, right) => Number(right.prepend) - Number(left.prepend))
        let index = 0
        const next = async (): Promise<unknown> => {
          const current = entries[index++]
          return current ? current.fn(...(args as never[]), next as never) : fallback()
        }
        return next()
      }
      const runTool = async (name: string, args: unknown): Promise<unknown> => {
        const decision = await waterfall(
          'tools/pre-execute',
          [{ callId: `call-${name}`, token: Symbol(name), name, arguments: args, agent: subject }],
          () => ({ kind: 'allow' }),
        )
        expect(decision).toEqual({ kind: 'allow' })
        return definitions.get(name)!.execute(args, { agent: subject })
      }

      const started = await waterfall(
        'agent/pre-step',
        [{ agent: subject, step: 1, messages: [], turn: 1, signal: new AbortController().signal }],
        enter,
      )
      expect(started).toMatchObject({ kind: 'enter' })
      await runTool('case_search', { query: '合成检索' })
      await runTool('case_read_material', { name: '借条', start: 1, end: 1 })
      await runTool('case_save_draft', { title: '合成辩护意见', content: '辩护意见：被告已归还全部借款。' })
      const reviewed = await waterfall(
        'agent/pre-step',
        [{ agent: subject, step: 2, messages: [], turn: 1, signal: new AbortController().signal }],
        enter,
      )

      expect(noticeText(reviewed)).toContain('apply 路径保留了合成评论')
      expect(reviewCalls).toHaveLength(2)
      for (const options of reviewCalls) {
        expect(options.provider).toBe('external')
        expect(options.model).toBe('fixture-external-review-model')
        expect(options.contextWindowOverride).toBe(65_536)
        expect(options.reasoningEffort).toBeUndefined()
        expect(options.sessionId).toBe(subject.id)
        expect(options).not.toHaveProperty('purpose')
        expect(options).not.toHaveProperty('tools')
      }
      expect(coreCalls.filter((call) => call.command === 'tool').map((call) => call.body.tool)).toEqual([
        'case_search',
        'case_read_material',
        'case_save_draft',
      ])
    } finally {
      CoreClient.prototype.call = originalCall
    }
  })
})
