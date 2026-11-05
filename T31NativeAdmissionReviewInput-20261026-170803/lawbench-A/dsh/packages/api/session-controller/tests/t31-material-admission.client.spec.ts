/**
 * T31 material-scope admission after prepare.
 *
 * These are directed red tests for the real ConversationController.sendSession
 * boundary. beginSubmission is observed through a pass-through spy and the
 * Host command controller, ReactLoopInbox, and Agent followup path are real.
 * Only the lawbench material API is synthetic; no HTTP, Gateway backend, model
 * loop, attachment File, or rollout is involved.
 */

import { Context } from '@deepseek-ai/cordis'
import AgentRegistry, { agentEvents, type Agent } from '@deepseek-ai/dsh-agent'
import { inboxProjectionDefinition, ReactLoopInbox } from '../../../core/agent-loop/src/inbox.ts'
import { ok, type RemoteMock } from '@deepseek-ai/dsh-remote-mock'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import type { UserMessage } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import { describe, expect, vi } from 'vitest'
import { ClientRoster } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/roster.ts'
import { createClientTest } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/vitest.ts'
import type { TestClient } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/index.ts'
import { ApiSessionAgentController } from '../src/agent.ts'
import { SessionCommandController } from '../src/commands.ts'
import type { SessionPromptRequest, SessionRequestId } from '../src/types.ts'
import { ConversationController, type ConversationSubmissionLifecycle } from '../../../client/ui-conversation/src/client/service.ts'
import { sessionBench } from './remote/bench.client.ts'
import {
  cancelMaterialBatch,
  captureImportedMaterialBatch,
  makeMaterialSubmissionHook,
  materialBatchFor,
  toggleMaterialBatchItem,
} from '../../../../../dsh-ext/ui/material-batch.ts'
import type { Material } from '../../../../../dsh-ext/ui/format.ts'
import { app, setApi, type LawbenchApi } from '../../../../../dsh-ext/ui/state.ts'

/** The assembled Session client talks to the in-memory Gateway Remote peer. */
const API_ROSTER = ClientRoster.of([
  {
    name: '@deepseek-ai/dsh-typert-registry',
    inject: [],
    immediately: true,
  },
  {
    name: '@deepseek-ai/dsh-api-gateway',
    inject: ['@deepseek-ai/dsh-typert-registry', '@deepseek-ai/dsh-client-connection'],
    immediately: true,
  },
  {
    name: '@deepseek-ai/dsh-client-connection',
    inject: [],
    immediately: true,
  },
]).closure(['@deepseek-ai/dsh-api-gateway'])

const it = createClientTest({ roster: API_ROSTER })
const COLD_BOOT_TIMEOUT_MS = 60_000
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CASE = {
  case_id: 'T31-MATERIAL-ADMISSION-FIXTURE',
  name: 'T31 原生材料接纳虚构案件',
  root: 'D:\\T31虚构\\原生材料接纳',
} as const

interface IdentityHost {
  readonly ctx: Context
  readonly session: Session
  readonly inbox: ReactLoopInbox
  readonly controller: SessionCommandController
  readonly claimed: Array<{ readonly message: UserMessage; readonly turn: number }>
  modelSendAttempts(): number
}

interface ScopeCall {
  readonly action: 'prepare' | 'release'
  readonly case_id: string
  readonly session_id: string
  readonly request_id: string
  readonly material_ids?: readonly string[]
}

interface FrameGate {
  next(): Promise<FrameRequestCallback>
  release(frame: FrameRequestCallback): void
  releasePending(): void
  dispose(): void
}

type Settlement<T> =
  | { readonly status: 'fulfilled'; readonly value: T }
  | { readonly status: 'rejected'; readonly reason: unknown }

/**
 * Build the real Host prompt path used by the existing native identity suite.
 * Agent.send is deliberately forbidden: only followup may append to the real
 * ReactLoopInbox, so reaching a model loop creates a test failure.
 */
async function createIdentityHost(sessionId: SessionId): Promise<IdentityHost> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(AgentRegistry)
  ctx.sessionProjections.register(inboxProjectionDefinition)

  const session = ctx.sessions.create(sessionId)
  let modelSendAttempts = 0
  const agent = {
    id: session.id,
    options: {},
    session,
    inbox: undefined,
    status: 'running',
    ctx,
    send: () => {
      modelSendAttempts += 1
      throw new Error('T31 material admission test must not start the Agent model loop')
    },
    followup: () => {},
    steer: () => {},
    inject: () => {},
    cancel: () => {},
    runMaintenance: () => {},
    whenIdle: () => Promise.resolve(),
  } as unknown as Agent
  const inbox = new ReactLoopInbox(ctx.sessionProjections, session, agentEvents(ctx, agent))
  Object.assign(agent, {
    inbox,
    followup: (message: UserMessage) => { inbox.append('next-turn', message) },
    steer: (message: UserMessage) => { inbox.append('next-step', message) },
  })
  await ctx.agents.register(agent)

  const claimed: Array<{ readonly message: UserMessage; readonly turn: number }> = []
  ctx.on('agent/inbox/claimed', ({ agent: subject, message, turn }) => {
    if (subject === agent) claimed.push({ message, turn })
  })

  ctx.provide('attachments', {
    admitPromptContent: async (content: readonly unknown[]) => [...content],
  } as never)
  ctx.provide('fileUploads', {
    resolve: () => undefined,
    bindPrompt: () => ({
      commit: () => {},
      [Symbol.dispose]: () => {},
    }),
  } as never)

  const agents = {
    resolveAgent: async (id: SessionId) => {
      if (id === agent.id) return { agent }
      return {
        error: new RemoteError('session/not-found', 'missing test session', { sessionId: id }),
      }
    },
  } as unknown as ApiSessionAgentController

  return {
    ctx,
    session,
    inbox,
    controller: new SessionCommandController(ctx, agents, '/t31-material-admission'),
    claimed,
    modelSendAttempts: () => modelSendAttempts,
  }
}

/** Deliver Session.prompt payloads to the actual Host command controller. */
function routePromptThroughController(mock: RemoteMock, controller: SessionCommandController): void {
  mock.remote.session.prompt.mockImplementation(async (request: SessionPromptRequest) => {
    try {
      return ok(await controller.prompt(request))
    } catch (error) {
      if (error instanceof RemoteError) return { ok: false as const, error }
      throw error
    }
  })
}

function rpcIdOf(message: UserMessage): SessionRequestId | undefined {
  const source = message.source
  return source.kind === 'user' && 'rpcId' in source ? source.rpcId : undefined
}

function settle<T>(promise: Promise<T>): Promise<Settlement<T>> {
  return promise.then(
    value => ({ status: 'fulfilled' as const, value }),
    reason => ({ status: 'rejected' as const, reason }),
  )
}

function rejectedOrError(settlement: Settlement<{ readonly kind: 'success' | 'error' }>): boolean {
  return settlement.status === 'rejected'
    || (settlement.status === 'fulfilled' && settlement.value.kind === 'error')
}

function material(id: string, name: string, location: string): Material {
  return {
    material_id: id,
    name,
    rel_path: `工作区/引用/R01/${name}`,
    type: 'pdf',
    status: 'parsed',
    unit: 'page',
    unit_count: 1,
    is_ocr: 'none',
    stale_ocr: false,
    error: null,
    pages_need_ocr: [],
    pages_mixed: [],
    origin: 'ref',
    ref_id: 'R01',
    location,
  }
}

function prepareSuccess(request: ScopeCall) {
  return {
    ok: true as const,
    value: {
      action: 'prepare' as const,
      request_id: request.request_id,
      case_id: request.case_id,
      session_id: request.session_id,
      material_ids: request.material_ids ?? [],
    },
  }
}

function releaseSuccess(request: ScopeCall) {
  return {
    ok: true as const,
    value: {
      action: 'release' as const,
      request_id: request.request_id,
      case_id: request.case_id,
      session_id: request.session_id,
    },
  }
}

/**
 * The material backend is a narrow synthetic contract responder. It records
 * the exact prepare/release tuples but never claims HTTP or a real service.
 */
function installMaterialApi(
  materialsOf: () => readonly Material[],
  scopeCalls: ScopeCall[],
): void {
  setApi({
    materialsList: async (_request?: unknown) => ({
      ok: true as const,
      value: { materials: [...materialsOf()] },
    }),
    requestScope: async (raw?: unknown) => {
      const request = raw as ScopeCall
      scopeCalls.push({
        ...request,
        ...(request.material_ids === undefined ? {} : { material_ids: [...request.material_ids] }),
      })
      if (request.action === 'prepare') return prepareSuccess(request)
      if (request.action === 'release') return releaseSuccess(request)
      throw new Error(`unexpected material scope action: ${String(request.action)}`)
    },
  } as Partial<LawbenchApi> as LawbenchApi)
}

function seedMaterialApp(): void {
  app.set(state => ({
    ...state,
    cases: [CASE],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
}

function clearMaterialApp(): void {
  setApi(undefined)
  app.set(state => ({
    ...state,
    cases: [],
    dialogs: [],
    materialBatches: {},
    materialBatchBlocks: {},
  }))
}

/**
 * Hold the production nextPaint await on a controlled animation frame.
 * Fake timers also hold nextPaint's 100 ms fallback, so the race window is
 * deterministic rather than timing-dependent.
 */
function installFrameGate(): FrameGate {
  vi.useFakeTimers()
  const queued: FrameRequestCallback[] = []
  const waiters: Array<(frame: FrameRequestCallback) => void> = []
  vi.stubGlobal('requestAnimationFrame', vi.fn((frame: FrameRequestCallback) => {
    const waiter = waiters.shift()
    if (waiter !== undefined) waiter(frame)
    else queued.push(frame)
    return queued.length
  }))

  return {
    next: () => {
      const frame = queued.shift()
      if (frame !== undefined) return Promise.resolve(frame)
      return new Promise(resolve => { waiters.push(resolve) })
    },
    release: frame => { frame(0) },
    releasePending: () => {
      for (const frame of queued.splice(0)) frame(0)
    },
    dispose: () => {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    },
  }
}

async function startConversationController(
  client: TestClient,
  materialHook: ReturnType<typeof makeMaterialSubmissionHook>,
) {
  const fiber = client.ctx.plugin(ConversationController, {
    input: {} as never,
    blocks: {} as never,
    maxConcurrentFileUploads: 1,
    submissionLifecycle: materialHook as ConversationSubmissionLifecycle,
  })
  await fiber.await()
  const conversation = client.ctx.get('conversation') as ConversationController | undefined
  if (conversation === undefined) {
    throw new Error('ConversationController did not register on the test client context')
  }
  return { controller: conversation, fiber }
}

function promptRequests(mock: RemoteMock): SessionPromptRequest[] {
  return mock.log.requests('session/prompt') as SessionPromptRequest[]
}

type ControllerBridge = Awaited<ReturnType<typeof startConversationController>>

describe('T31 native material admission after prepare', () => {
  it('rejects a cancelled-and-replaced batch at the nextPaint boundary and retries with a fresh R', async ({ mock, start }) => {
    const sessionId = SessionId('t31-material-admission-cancel')
    const scopeCalls: ScopeCall[] = []
    const oldRoot = `${CASE.root}\\原批`
    const resumedRoot = `${CASE.root}\\新批`
    let materials: readonly Material[] = [
      material('M0001', '旧批合同.pdf', `${oldRoot}\\旧批合同.pdf`),
    ]
    let host: IdentityHost | undefined
    let frameGate: FrameGate | undefined
    let materialHook: ReturnType<typeof makeMaterialSubmissionHook> | undefined
    let controllerBridge: ControllerBridge | undefined
    let oldEvent: { sessionId: string; requestId: string; mode: 'queue' } | undefined
    let retryEvent: { sessionId: string; requestId: string; mode: 'queue' } | undefined
    const pending: Promise<unknown>[] = []

    try {
      seedMaterialApp()
      installMaterialApi(() => materials, scopeCalls)
      const oldBatch = await captureImportedMaterialBatch(
        CASE,
        sessionId,
        [{ path: oldRoot, kind: 'dir' }],
        [],
      )
      if (oldBatch === undefined) throw new Error('old material batch was not constructed')
      expect(oldBatch.selected_ids).toEqual(['M0001'])

      host = await createIdentityHost(sessionId)
      const client = await sessionBench(mock, start, sessionId)
      const testClient = await start()
      routePromptThroughController(mock, host.controller)
      client.handleRunning(true)
      materialHook = makeMaterialSubmissionHook(() => CASE.root)
      controllerBridge = await startConversationController(testClient, materialHook)
      const conversation = controllerBridge.controller
      const beginSubmission = vi.spyOn(client, 'beginSubmission')
      frameGate = installFrameGate()

      const firstSending = conversation.sendSession(client, '旧范围问题', [], 'queue')
      pending.push(firstSending)
      const firstSettled = settle(firstSending)
      const firstFrame = await frameGate.next()

      const firstPrepare = scopeCalls.find(call => call.action === 'prepare')
      if (firstPrepare === undefined) throw new Error('material prepare did not start')
      const oldR = firstPrepare.request_id as SessionRequestId
      oldEvent = { sessionId: sessionId as string, requestId: oldR, mode: 'queue' }
      expect(oldR).toMatch(UUID_V4)
      expect(firstPrepare).toEqual({
        action: 'prepare',
        case_id: CASE.case_id,
        session_id: sessionId,
        request_id: oldR,
        material_ids: ['M0001'],
      })
      expect(mock.log.requests('session/prompt')).toEqual([])

      cancelMaterialBatch(sessionId)
      expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
      materials = [
        material('M0002', '新批附件.pdf', `${resumedRoot}\\新批附件.pdf`),
      ]
      const resumedBatch = await captureImportedMaterialBatch(
        CASE,
        sessionId,
        [{ path: resumedRoot, kind: 'dir' }],
        [],
      )
      if (resumedBatch === undefined) throw new Error('resumed material batch was not constructed')
      expect(resumedBatch.selected_ids).toEqual(['M0002'])

      frameGate.release(firstFrame)
      await vi.advanceTimersByTimeAsync(0)
      const firstOutcome = await firstSettled
      const promptsAfterFirst = promptRequests(mock)
      const queuedAfterFirst = host.inbox.nextTurn.map(rpcIdOf)

      // A cancelled scope must not be silently admitted by the old R.
      expect(promptsAfterFirst).toEqual([])
      expect(queuedAfterFirst).toEqual([])
      expect(rejectedOrError(firstOutcome)).toBe(true)
      expect(scopeCalls.filter(call => call.action === 'release' && call.request_id === oldR)).toHaveLength(1)

      const retrySending = conversation.sendSession(client, '新范围问题', [], 'queue')
      pending.push(retrySending)
      const retrySettled = settle(retrySending)
      const retryFrame = await frameGate.next()
      const prepares = scopeCalls.filter(call => call.action === 'prepare')
      expect(prepares).toHaveLength(2)
      const retryPrepare = prepares[1]!
      const retryR = retryPrepare.request_id as SessionRequestId
      retryEvent = { sessionId: sessionId as string, requestId: retryR, mode: 'queue' }
      expect(retryR).toMatch(UUID_V4)
      expect(retryR).not.toBe(oldR)
      expect(retryPrepare).toEqual({
        action: 'prepare',
        case_id: CASE.case_id,
        session_id: sessionId,
        request_id: retryR,
        material_ids: ['M0002'],
      })

      frameGate.release(retryFrame)
      await vi.advanceTimersByTimeAsync(0)
      expect(await retrySettled).toEqual({
        status: 'fulfilled',
        value: { kind: 'success' },
      })

      const nativeIds = beginSubmission.mock.results.map(result => result.value.requestId)
      expect(nativeIds).toEqual([oldR, retryR])
      expect(promptRequests(mock).map(request => request.requestId)).toEqual([retryR])
      expect(host.inbox.nextTurn.map(rpcIdOf)).toEqual([retryR])
      const claimed = host.inbox.claim('next-turn', 1)
      expect(claimed.map(rpcIdOf)).toEqual([retryR])
      expect(host.claimed.map(entry => ({ rpcId: rpcIdOf(entry.message), turn: entry.turn }))).toEqual([
        { rpcId: retryR, turn: 1 },
      ])
      expect(host.modelSendAttempts()).toBe(0)
      expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
    } finally {
      frameGate?.releasePending()
      if (frameGate !== undefined) await vi.advanceTimersByTimeAsync(0)
      await Promise.allSettled(pending)
      if (materialHook !== undefined) {
        await Promise.allSettled([oldEvent, retryEvent]
          .filter((event): event is NonNullable<typeof event> => event !== undefined)
          .map(event => materialHook!.failed(event)))
      }
      await controllerBridge?.fiber.dispose()
      await host?.ctx.fiber.dispose()
      frameGate?.dispose()
      clearMaterialApp()
      vi.restoreAllMocks()
    }
  }, COLD_BOOT_TIMEOUT_MS)

  it('rejects a changed selection at the nextPaint boundary and retries with only the current selection', async ({ mock, start }) => {
    const sessionId = SessionId('t31-material-admission-selection')
    const scopeCalls: ScopeCall[] = []
    let materials: readonly Material[] = [
      material('M0011', '合同.pdf', `${CASE.root}\\材料\\合同.pdf`),
      material('M0012', '附件.pdf', `${CASE.root}\\材料\\附件.pdf`),
    ]
    let host: IdentityHost | undefined
    let frameGate: FrameGate | undefined
    let materialHook: ReturnType<typeof makeMaterialSubmissionHook> | undefined
    let controllerBridge: ControllerBridge | undefined
    let oldEvent: { sessionId: string; requestId: string; mode: 'queue' } | undefined
    let retryEvent: { sessionId: string; requestId: string; mode: 'queue' } | undefined
    const pending: Promise<unknown>[] = []

    try {
      seedMaterialApp()
      installMaterialApi(() => materials, scopeCalls)
      const batch = await captureImportedMaterialBatch(
        CASE,
        sessionId,
        [{ path: `${CASE.root}\\材料`, kind: 'dir' }],
        [],
      )
      if (batch === undefined) throw new Error('material batch was not constructed')
      expect(batch.selected_ids).toEqual(['M0011', 'M0012'])

      host = await createIdentityHost(sessionId)
      const client = await sessionBench(mock, start, sessionId)
      const testClient = await start()
      routePromptThroughController(mock, host.controller)
      client.handleRunning(true)
      materialHook = makeMaterialSubmissionHook(() => CASE.root)
      controllerBridge = await startConversationController(testClient, materialHook)
      const conversation = controllerBridge.controller
      const beginSubmission = vi.spyOn(client, 'beginSubmission')
      frameGate = installFrameGate()

      const firstSending = conversation.sendSession(client, '旧选择问题', [], 'queue')
      pending.push(firstSending)
      const firstSettled = settle(firstSending)
      const firstFrame = await frameGate.next()

      const firstPrepare = scopeCalls.find(call => call.action === 'prepare')
      if (firstPrepare === undefined) throw new Error('material prepare did not start')
      const oldR = firstPrepare.request_id as SessionRequestId
      oldEvent = { sessionId: sessionId as string, requestId: oldR, mode: 'queue' }
      expect(oldR).toMatch(UUID_V4)
      expect(firstPrepare.material_ids).toEqual(['M0011', 'M0012'])
      expect(mock.log.requests('session/prompt')).toEqual([])

      toggleMaterialBatchItem(sessionId, 'M0012')
      expect(materialBatchFor(sessionId, CASE.case_id)?.selected_ids).toEqual(['M0011'])

      frameGate.release(firstFrame)
      await vi.advanceTimersByTimeAsync(0)
      const firstOutcome = await firstSettled
      const promptsAfterFirst = promptRequests(mock)
      const queuedAfterFirst = host.inbox.nextTurn.map(rpcIdOf)

      // The selection changed after prepare; the old R must not bind it.
      expect(promptsAfterFirst).toEqual([])
      expect(queuedAfterFirst).toEqual([])
      expect(rejectedOrError(firstOutcome)).toBe(true)
      expect(scopeCalls.filter(call => call.action === 'release' && call.request_id === oldR)).toHaveLength(1)

      const retrySending = conversation.sendSession(client, '当前选择问题', [], 'queue')
      pending.push(retrySending)
      const retrySettled = settle(retrySending)
      const retryFrame = await frameGate.next()
      const prepares = scopeCalls.filter(call => call.action === 'prepare')
      expect(prepares).toHaveLength(2)
      const retryPrepare = prepares[1]!
      const retryR = retryPrepare.request_id as SessionRequestId
      retryEvent = { sessionId: sessionId as string, requestId: retryR, mode: 'queue' }
      expect(retryR).toMatch(UUID_V4)
      expect(retryR).not.toBe(oldR)
      expect(retryPrepare).toEqual({
        action: 'prepare',
        case_id: CASE.case_id,
        session_id: sessionId,
        request_id: retryR,
        material_ids: ['M0011'],
      })

      frameGate.release(retryFrame)
      await vi.advanceTimersByTimeAsync(0)
      expect(await retrySettled).toEqual({
        status: 'fulfilled',
        value: { kind: 'success' },
      })

      const nativeIds = beginSubmission.mock.results.map(result => result.value.requestId)
      expect(nativeIds).toEqual([oldR, retryR])
      expect(promptRequests(mock).map(request => request.requestId)).toEqual([retryR])
      expect(host.inbox.nextTurn.map(rpcIdOf)).toEqual([retryR])
      const claimed = host.inbox.claim('next-turn', 1)
      expect(claimed.map(rpcIdOf)).toEqual([retryR])
      expect(host.claimed.map(entry => ({ rpcId: rpcIdOf(entry.message), turn: entry.turn }))).toEqual([
        { rpcId: retryR, turn: 1 },
      ])
      expect(host.modelSendAttempts()).toBe(0)
      expect(materialBatchFor(sessionId, CASE.case_id)).toBeUndefined()
    } finally {
      frameGate?.releasePending()
      if (frameGate !== undefined) await vi.advanceTimersByTimeAsync(0)
      await Promise.allSettled(pending)
      if (materialHook !== undefined) {
        await Promise.allSettled([oldEvent, retryEvent]
          .filter((event): event is NonNullable<typeof event> => event !== undefined)
          .map(event => materialHook!.failed(event)))
      }
      await controllerBridge?.fiber.dispose()
      await host?.ctx.fiber.dispose()
      frameGate?.dispose()
      clearMaterialApp()
      vi.restoreAllMocks()
    }
  }, COLD_BOOT_TIMEOUT_MS)
})
