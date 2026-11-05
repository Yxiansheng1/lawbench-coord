// @vitest-environment jsdom
/**
 * T31 compiled Browser Session -> generated Remote -> actual Gateway ->
 * compiled Host SessionController -> real Session/Inbox.
 *
 * The client and Host targets are emitted files from the pinned private
 * runtime, not source implementations. The only transport is a narrow
 * in-process JSON carrier that dispatches through TypertGatewayService.
 */

import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import * as CordisModule from '@deepseek-ai/cordis'
import AgentRegistry, { agentEvents, type Agent } from '@deepseek-ai/dsh-agent'
import TypertGatewayService from '@deepseek-ai/dsh-api-gateway'
import * as GatewayClientModule from '@deepseek-ai/dsh-api-gateway/client'
import * as ApiRemotesModule from '@deepseek-ai/dsh-api-remotes'
import { installConnection, type ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import * as ClientStoreModule from '@deepseek-ai/dsh-client-store'
import SessionStore, { type Session as HostSession, SessionId, type UserMessage } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { SessionQueryEngine } from '@deepseek-ai/dsh-session-query'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import { describe, expect, it, vi } from 'vitest'
import { inboxProjectionDefinition, ReactLoopInbox } from '../../../core/agent-loop/src/inbox.ts'

const PRIVATE_OUTPUT =
  'D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261026-215235'
const MANIFEST_PATH = join(PRIVATE_OUTPUT, 'manifest.json')
const CLIENT_PATH = join(
  PRIVATE_OUTPUT,
  'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/client.js',
)
const HOST_PATH = join(
  PRIVATE_OUTPUT,
  'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js',
)
const HOST_TYPERT_PATH = join(
  PRIVATE_OUTPUT,
  'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.host.js',
)
const REMOTE_TYPERT_PATH = join(
  PRIVATE_OUTPUT,
  'profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.js',
)

const INPUTS = [
  {
    path: MANIFEST_PATH,
    bytes: 58_186,
    sha256: '1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae',
  },
  {
    path: CLIENT_PATH,
    bytes: 144_114,
    sha256: '05f5cdd4d5f96033d86b8c4deec640409e2952e149882b9a746267e3799a41fd',
  },
  {
    path: HOST_PATH,
    bytes: 124_525,
    sha256: 'c0fbf31baa63caa3e29d5de022109356ed2f1c9e136eb8844dccfc59c8843d6f',
  },
  {
    path: HOST_TYPERT_PATH,
    bytes: 158_754,
    sha256: 'a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12',
  },
  {
    path: REMOTE_TYPERT_PATH,
    bytes: 59_116,
    sha256: 'e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630',
  },
] as const

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TEST_TIMEOUT_MS = 60_000

interface FileSnapshot {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
}

interface CompiledModules {
  readonly SessionController: new (...args: never[]) => unknown
  readonly TYPERT: unknown
  readonly TYPERT_REMOTE: unknown
}

interface ArtifactExports {
  readonly inject: readonly string[]
  apply(ctx: Context): void
}

interface ArtifactHandoff {
  readonly id: string
  factory(require: (specifier: string) => unknown): ArtifactExports
}

type ModuleLoaderWindow = Window & {
  __ModuleLoader__?: { load(handoff: ArtifactHandoff): void }
}

interface RemoteFailure {
  readonly code: string
  readonly message: string
  readonly details: object
}

type RemoteResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RemoteFailure }

interface BrowserSubmissionHandle {
  readonly requestId: string
  abandon(): void
}

interface BrowserSession {
  readonly sessionId: SessionId
  beginSubmission(input: {
    readonly mode: 'queue' | 'steer'
    readonly text: string
    readonly attachments: readonly unknown[]
  }): BrowserSubmissionHandle
  prompt(
    content: readonly unknown[],
    mode: 'queue' | 'steer',
    signal?: AbortSignal,
    requestId?: string,
    deliveryRestriction?: 'next-turn-only',
  ): Promise<RemoteResult<{ readonly accepted: true }>>
  updateQueue(
    itemId: string,
    action: { readonly kind: 'steer' },
  ): Promise<RemoteResult<{ readonly accepted: true }>>
  handleRunning(running: boolean): void
}

interface BrowserReference {
  readonly binding: { readonly session: BrowserSession }
  readonly ready: Promise<unknown>
  release(): void
}

interface BrowserSessions {
  readonly list: {
    getSnapshot(): {
      readonly ids: readonly SessionId[]
      readonly byId: Readonly<Record<SessionId, { readonly id: SessionId } | undefined>>
    }
  }
  refresh(): Promise<void>
  retain(
    target: SessionId,
    options: { readonly source: 'controllerOperation' },
  ): BrowserReference
}

interface HostGraph {
  readonly ctx: Context
  readonly session: HostSession
  readonly inbox: ReactLoopInbox
  readonly claimed: readonly { readonly message: UserMessage; readonly turn: number }[]
  readonly sendCalls: () => number
  dispose(): Promise<void>
}

interface JsonGatewayTransport {
  readonly rpc: NonNullable<ConnectionHandle['rpc']>
  readonly requests: readonly {
    readonly endpoint: string
    readonly args: Record<string, unknown>
  }[]
  targetCalls(endpoint: 'session/prompt' | 'session/updateQueue'): number
}

interface ClientGraph {
  readonly ctx: Context
  readonly sessions: BrowserSessions
}

interface ClaimedInput {
  readonly message: UserMessage
  readonly turn: number
}

class CompiledGatewayQuery extends SessionQueryEngine {
  override searchSessions(): Promise<never> {
    return Promise.reject(new Error('T31 compiled gateway fixture does not exercise session search'))
  }

  override searchEvents(): Promise<never> {
    return Promise.reject(new Error('T31 compiled gateway fixture does not exercise event search'))
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function captureInputs(): Promise<readonly FileSnapshot[]> {
  const snapshots: FileSnapshot[] = []
  for (const input of INPUTS) {
    const info = await lstat(input.path)
    expect(info.isFile()).toBe(true)
    expect(info.isSymbolicLink()).toBe(false)
    expect(info.nlink).toBe(1)
    const bytes = await readFile(input.path)
    expect(bytes.byteLength).toBe(input.bytes)
    expect(sha256(bytes)).toBe(input.sha256)
    snapshots.push({ path: input.path, bytes: bytes.byteLength, sha256: sha256(bytes) })
  }
  return snapshots
}

async function withImmutableInputs(run: () => Promise<void>): Promise<void> {
  const before = await captureInputs()
  try {
    await run()
  } finally {
    await expect(captureInputs()).resolves.toEqual(before)
  }
}

async function loadCompiledModules(): Promise<CompiledModules> {
  const host = await import(
    'D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261026-215235/profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/index.js'
  ) as unknown as { readonly default: CompiledModules['SessionController'] }
  const hostTypert = await import(
    'D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261026-215235/profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.host.js'
  ) as unknown as { readonly TYPERT: unknown }
  const remoteTypert = await import(
    'D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261026-215235/profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.remote-client.js'
  ) as unknown as { readonly TYPERT_REMOTE: unknown }
  return {
    SessionController: host.default,
    TYPERT: hostTypert.TYPERT,
    TYPERT_REMOTE: remoteTypert.TYPERT_REMOTE,
  }
}

async function loadBrowserArtifact(): Promise<{
  readonly exports: ArtifactExports
  readonly restoreModuleLoader: () => void
}> {
  const code = await readFile(CLIENT_PATH, 'utf8')
  let handoff: ArtifactHandoff | undefined
  const target = window as ModuleLoaderWindow
  const previous = target.__ModuleLoader__
  target.__ModuleLoader__ = {
    load(candidate) {
      handoff = candidate
    },
  }
  try {
    // This is the same deliberate artifact carrier used by the existing
    // ui-trajectory client-bundle test: execute emitted bytes, capture their
    // public handoff, and resolve only the manifest-declared externals.
    // oxlint-disable-next-line typescript/no-implied-eval, typescript/no-unsafe-call
    new Function(code)()
    expect(handoff).toBeDefined()
    const required: string[] = []
    const modules = new Map<string, unknown>([
      ['@deepseek-ai/cordis', CordisModule],
      ['@deepseek-ai/dsh-api-gateway/client', GatewayClientModule],
      ['@deepseek-ai/dsh-client-store', ClientStoreModule],
    ])
    const exports = handoff!.factory((specifier) => {
      required.push(specifier)
      if (!modules.has(specifier)) throw new Error(`unexpected compiled Client external: ${specifier}`)
      return modules.get(specifier)
    })
    expect(handoff!.id).toBe('@deepseek-ai/dsh-api-session-controller')
    expect(new Set(required)).toEqual(new Set(modules.keys()))
    expect(exports.apply).toBeTypeOf('function')
    expect(exports.inject).toEqual([
      'connection',
      'fileUpload',
      'typert',
      'remote',
      'remote.commands',
      'remote.session',
      'remote.subagents',
    ])
    return {
      exports,
      restoreModuleLoader: () => {
        if (previous === undefined) Reflect.deleteProperty(target, '__ModuleLoader__')
        else target.__ModuleLoader__ = previous
      },
    }
  } catch (error) {
    if (previous === undefined) Reflect.deleteProperty(target, '__ModuleLoader__')
    else target.__ModuleLoader__ = previous
    throw error
  }
}

function cloneJson<Value>(value: Value): Value {
  return JSON.parse(JSON.stringify(value)) as Value
}

function createJsonGatewayTransport(host: Context): JsonGatewayTransport {
  const gateway = host.get('typertGateway') as unknown as {
    invoke(request: {
      readonly namespace: string
      readonly method: string
      readonly args: Record<string, unknown>
      readonly signal: AbortSignal
    }): Promise<unknown>
    stream(request: {
      readonly namespace: string
      readonly method: string
      readonly args: Record<string, unknown>
      readonly signal: AbortSignal
    }): Promise<AsyncIterable<unknown>>
    readonly wireStream: {
      open(
        endpoint: string,
        payload: unknown,
        uplink: AsyncIterable<unknown>,
        peer: undefined,
        signal: AbortSignal,
      ): Promise<AsyncIterable<unknown>>
      failure(error: unknown): RemoteFailure
    }
  }
  if (gateway === undefined) throw new Error('actual TypertGatewayService was not installed')
  const requests: { endpoint: string; args: Record<string, unknown> }[] = []
  const endpointParts = (endpoint: string): [string, string] => {
    const parts = endpoint.split('/')
    if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
      throw new Error(`unsupported Gateway endpoint: ${endpoint}`)
    }
    return [parts[0]!, parts[1]!]
  }
  const argsOf = (payload: unknown): Record<string, unknown> => {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Gateway RPC payload must be an object')
    }
    const args = (payload as { readonly args?: unknown }).args
    if (args === null || typeof args !== 'object' || Array.isArray(args)) {
      throw new Error('Gateway RPC payload must contain object args')
    }
    return cloneJson(args as Record<string, unknown>)
  }
  const emptyUplink = (): AsyncIterable<unknown> => ({
    [Symbol.asyncIterator]: () => ({
      next: async () => ({ done: true, value: undefined }),
    }),
  })
  const rpc: NonNullable<ConnectionHandle['rpc']> = {
    async call(_channel, endpoint, payload, signal = new AbortController().signal) {
      const args = argsOf(payload)
      requests.push({ endpoint, args: cloneJson(args) })
      const [namespace, method] = endpointParts(endpoint)
      try {
        const value = await gateway.invoke({
          namespace,
          method,
          args,
          signal,
        })
        return { ok: true as const, value: cloneJson(value) }
      } catch (error) {
        return { ok: false as const, error: cloneJson(gateway.wireStream.failure(error)) }
      }
    },
    open(_channel, endpoint, payload, signal, uplink) {
      const args = argsOf(payload)
      requests.push({ endpoint, args: cloneJson(args) })
      return {
        async *[Symbol.asyncIterator]() {
          const source = await gateway.wireStream.open(
            endpoint,
            cloneJson({ args }),
            uplink ?? emptyUplink(),
            undefined,
            signal,
          )
          const iterator = source[Symbol.asyncIterator]()
          try {
            while (true) {
              const next = await iterator.next()
              if (next.done === true) return
              yield cloneJson(next.value)
            }
          } finally {
            await iterator.return?.()
          }
        },
      }
    },
  }
  return {
    rpc,
    requests,
    targetCalls(endpoint) {
      return requests.filter(request => request.endpoint === endpoint).length
    },
  }
}

async function createHostGraph(
  modules: CompiledModules,
  sessionId: SessionId,
): Promise<HostGraph> {
  const ctx = new Context()
  let disposeTypert: (() => Promise<void>) | undefined
  try {
    await ctx.plugin(TypertRegistry)
    disposeTypert = ctx.typert.register(modules.TYPERT as never)
    await ctx.plugin(SessionStore)
    await ctx.plugin(SessionProjectionRegistry)
    await ctx.plugin(AgentRegistry)
    new CompiledGatewayQuery(ctx)
    ctx.sessionProjections.register(inboxProjectionDefinition)

    ctx.provide('workspaceRegistry', {
      archivedSessionIds: [],
      get: () => undefined,
      list: () => [],
    } as never)
    ctx.provide('agentDefaultModel', {
      currentSelection: () => ({ provider: 'fixture', model: 'fixture-model' }),
      saveSelection: async () => {},
    } as never)
    ctx.provide('llm', {
      listModels: async () => [],
      listProviders: () => [],
      resolveModelInfo: async () => ({ inputModalities: ['text'] }),
    } as never)
    ctx.provide('attachments', {
      imageLimits: {
        maxImageBytes: 5 * 1024 * 1024,
        maxImagesPerMessage: 20,
        maxMessageImageBytes: 100 * 1024 * 1024,
        maxImagePixels: 40_000_000,
        maxImageDimension: 2000,
        mediaTypes: ['image/png'],
      },
      admitPromptContent: async (content: readonly unknown[]) => cloneJson(content),
    } as never)
    ctx.provide('fileUploads', {
      registerAgentResolver: () => () => {},
      resolve: () => undefined,
      retirePrompt: () => {},
      bindPrompt: () => ({
        commit: () => {},
        [Symbol.dispose]: () => {},
      }),
    } as never)
    ctx.provide('fs', {} as never)

    const session = ctx.sessions.create(sessionId)
    let sendCalls = 0
    const agent = {
      id: session.id,
      options: {},
      session,
      inbox: undefined,
      status: 'running',
      ctx,
      send: () => {
        sendCalls += 1
        throw new Error('T31 compiled gateway test must not start the Agent model loop')
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

    const claimed: ClaimedInput[] = []
    ctx.on('agent/inbox/claimed', ({ agent: subject, message, turn }) => {
      if (subject === agent) claimed.push({ message, turn })
    })

    await ctx.plugin(modules.SessionController as never, { nativeOpen: false } as never)
    await ctx.plugin(TypertGatewayService, {})
    await ctx.plugin({ inject: ApiRemotesModule.inject, apply: ApiRemotesModule.apply })

    let disposed = false
    return {
      ctx,
      session,
      inbox,
      claimed,
      sendCalls: () => sendCalls,
      async dispose() {
        if (disposed) return
        disposed = true
        const failures: unknown[] = []
        try {
          await ctx.fiber.dispose()
        } catch (error) {
          failures.push(error)
        }
        try {
          await disposeTypert?.()
        } catch (error) {
          failures.push(error)
        }
        if (failures.length > 0) throw new AggregateError(failures, 'compiled Host teardown failed')
      },
    }
  } catch (error) {
    const failures = [error]
    try {
      await ctx.fiber.dispose()
    } catch (cleanupError) {
      failures.push(cleanupError)
    }
    try {
      await disposeTypert?.()
    } catch (cleanupError) {
      failures.push(cleanupError)
    }
    throw failures.length === 1 ? error : new AggregateError(failures, 'compiled Host setup failed')
  }
}

async function createClientGraph(
  modules: CompiledModules,
  transport: JsonGatewayTransport,
  artifact: ArtifactExports,
  restoreModuleLoader: () => void,
): Promise<ClientGraph> {
  const ctx = new Context()
  try {
    installConnection(ctx, {
      transport: {
        rpc: transport.rpc,
        ownsHost: true,
      },
    })
    const connection = ctx.get('connection') as ConnectionHandle

    await ctx.plugin(TypertRegistry)
    ctx.provide('fileUpload', {} as never)
    ctx.provide('remote.commands', {
      execute: async () => {
        throw new Error('T31 compiled gateway test does not route Commands')
      },
    } as never)
    ctx.provide('remote.subagents', {
      prompt: async () => {
        throw new Error('T31 compiled gateway test does not route Subagents')
      },
      interruptByParent: async () => {
        throw new Error('T31 compiled gateway test does not route Subagents')
      },
    } as never)

    const gatewayFiber = ctx.plugin({
      inject: GatewayClientModule.inject,
      apply: GatewayClientModule.apply,
    })
    await gatewayFiber
    await vi.waitFor(() => {
      expect(connection.generation.getSnapshot()).toBeDefined()
    })

    await ctx.remote.$mount(modules.TYPERT_REMOTE as never)
    const artifactFiber = ctx.plugin({
      inject: artifact.inject,
      apply: artifact.apply,
    })
    await artifactFiber
    const sessions = ctx.get('sessions') as unknown as BrowserSessions | undefined
    if (sessions === undefined) throw new Error('compiled Browser Session did not register ctx.sessions')
    return { ctx, sessions }
  } catch (error) {
    const failures = [error]
    try {
      await ctx.fiber.dispose()
    } catch (cleanupError) {
      failures.push(cleanupError)
    }
    try {
      restoreModuleLoader()
    } catch (cleanupError) {
      failures.push(cleanupError)
    }
    throw failures.length === 1 ? error : new AggregateError(failures, 'compiled Client setup failed')
  }
}

function messageRpcId(message: UserMessage): string | undefined {
  const source = message.source
  return source.kind === 'user' && 'rpcId' in source ? String(source.rpcId) : undefined
}

function messageFor(messages: readonly UserMessage[], requestId: string): UserMessage {
  const message = messages.find(candidate => messageRpcId(candidate) === requestId)
  if (message === undefined) throw new Error(`missing Host Inbox message for R=${requestId}`)
  return message
}

function hasTurnAttempt(session: HostSession): boolean {
  return session.snapshotEvents().some(event =>
    event.type === 'user/message'
    || event.type === 'assistant/attempt'
    || event.type === 'assistant/message'
    || event.type === 'turn/start'
  )
}

async function withCompiledPair(
  sessionId: SessionId,
  run: (pair: {
    readonly host: HostGraph
    readonly client: ClientGraph
    readonly session: BrowserSession
    readonly reference: BrowserReference
    readonly transport: JsonGatewayTransport
    track(handle: BrowserSubmissionHandle): void
  }) => Promise<void>,
): Promise<void> {
  await withImmutableInputs(async () => {
    const modules = await loadCompiledModules()
    const host = await createHostGraph(modules, sessionId)
    let artifact: Awaited<ReturnType<typeof loadBrowserArtifact>> | undefined
    let client: ClientGraph | undefined
    let reference: BrowserReference | undefined
    const handles: BrowserSubmissionHandle[] = []
    let runFailure: unknown
    try {
      const liveTransport = createJsonGatewayTransport(host.ctx)
      artifact = await loadBrowserArtifact()
      client = await createClientGraph(modules, liveTransport, artifact.exports, artifact.restoreModuleLoader)
      await client.sessions.refresh()
      await vi.waitFor(() => {
        const snapshot = client!.sessions.list.getSnapshot()
        expect(snapshot.ids).toContain(sessionId)
        expect(snapshot.byId[sessionId]?.id).toBe(sessionId)
      })
      reference = client.sessions.retain(sessionId, { source: 'controllerOperation' })
      await reference.ready
      await vi.waitFor(() => {
        expect(liveTransport.requests.some(request => request.endpoint === 'session/follow')).toBe(true)
        expect(liveTransport.requests.some(request => request.endpoint === 'session/control')).toBe(true)
      })
      const session = reference.binding.session
      session.handleRunning(true)
      await run({
        host,
        client,
        session,
        reference,
        transport: liveTransport,
        track: handle => { handles.push(handle) },
      })
    } catch (error) {
      runFailure = error
    }
    const failures: unknown[] = []
    for (const handle of handles.reverse()) {
      try {
        handle.abandon()
      } catch (error) {
        failures.push(error)
      }
    }
    try {
      reference?.release()
    } catch (error) {
      failures.push(error)
    }
    if (client !== undefined) {
      try {
        await client.ctx.fiber.dispose()
      } catch (error) {
        failures.push(error)
      }
    }
    try {
      artifact?.restoreModuleLoader()
    } catch (error) {
      failures.push(error)
    }
    try {
      await host.dispose()
    } catch (error) {
      failures.push(error)
    }
    if (runFailure !== undefined || failures.length > 0) {
      const causes = runFailure === undefined ? failures : [runFailure, ...failures]
      throw new AggregateError(causes, 'compiled Gateway pair failed')
    }
  })
}

describe('T31 compiled Browser Session through actual Gateway into compiled Host', () => {
  it('keeps a restricted queued R scoped after claim and refuses its next-step promotion', async () => {
    const sessionId = SessionId('11111111-1111-4111-8111-111111111111')
    await withCompiledPair(sessionId, async ({ host, session, transport, track }) => {
      const firstText = 'compiled restricted queued R1'
      const first = session.beginSubmission({
        mode: 'queue',
        text: firstText,
        attachments: [],
      })
      track(first)
      expect(first.requestId).toMatch(UUID_V4)
      await expect(session.prompt(
        [{ type: 'text', text: firstText }],
        'queue',
        undefined,
        first.requestId,
        'next-turn-only',
      )).resolves.toEqual({ ok: true, value: { accepted: true } })

      const firstWire = transport.requests.find(request => request.endpoint === 'session/prompt')
      expect(firstWire?.args).toMatchObject({
        request: {
          requestId: first.requestId,
          sessionId,
          mode: 'queue',
          deliveryRestriction: 'next-turn-only',
        },
      })
      const firstMessage = messageFor(host.inbox.nextTurn, first.requestId)
      expect(firstMessage.source).toMatchObject({
        kind: 'user',
        rpcId: first.requestId,
        deliveryRestriction: 'next-turn-only',
      })

      const claimed = host.inbox.claim('next-turn', 1)
      expect(claimed).toEqual([firstMessage])
      expect(host.claimed).toHaveLength(1)
      expect(host.claimed[0]).toEqual({ message: firstMessage, turn: 1 })
      expect(messageRpcId(host.claimed[0]!.message)).toBe(first.requestId)
      expect(host.inbox.nextTurn).toEqual([])
      expect(host.inbox.nextStep).toEqual([])

      const secondText = 'compiled distinct scoped R2'
      const second = session.beginSubmission({
        mode: 'queue',
        text: secondText,
        attachments: [],
      })
      track(second)
      expect(second.requestId).toMatch(UUID_V4)
      expect(second.requestId).not.toBe(first.requestId)
      await expect(session.prompt(
        [{ type: 'text', text: secondText }],
        'queue',
        undefined,
        second.requestId,
        'next-turn-only',
      )).resolves.toEqual({ ok: true, value: { accepted: true } })

      const secondWire = transport.requests.filter(request => request.endpoint === 'session/prompt')[1]
      expect(secondWire?.args).toMatchObject({
        request: {
          requestId: second.requestId,
          sessionId,
          mode: 'queue',
          deliveryRestriction: 'next-turn-only',
        },
      })
      const secondMessage = messageFor(host.inbox.nextTurn, second.requestId)
      await expect(session.updateQueue(secondMessage.id, { kind: 'steer' })).resolves.toMatchObject({
        ok: false,
        error: { code: 'session/steer-unavailable' },
      })
      const updateWire = transport.requests.find(request => request.endpoint === 'session/updateQueue')
      expect(updateWire?.args).toMatchObject({
        request: {
          sessionId,
          itemId: secondMessage.id,
          action: { kind: 'steer' },
        },
      })

      expect(host.inbox.nextTurn).toEqual([secondMessage])
      expect(host.inbox.nextStep).toEqual([])
      expect(transport.targetCalls('session/prompt')).toBe(2)
      expect(transport.targetCalls('session/updateQueue')).toBe(1)
      expect(host.sendCalls()).toBe(0)
      expect(hasTurnAttempt(host.session)).toBe(false)
    })
  }, TEST_TIMEOUT_MS)

  it('keeps ordinary queued-to-steer delivery through the same compiled Gateway route', async () => {
    const sessionId = SessionId('22222222-2222-4222-8222-222222222222')
    await withCompiledPair(sessionId, async ({ host, session, transport, track }) => {
      const text = 'compiled ordinary queued request'
      const submission = session.beginSubmission({
        mode: 'queue',
        text,
        attachments: [],
      })
      track(submission)
      expect(submission.requestId).toMatch(UUID_V4)
      await expect(session.prompt(
        [{ type: 'text', text }],
        'queue',
        undefined,
        submission.requestId,
      )).resolves.toEqual({ ok: true, value: { accepted: true } })

      const promptWire = transport.requests.find(request => request.endpoint === 'session/prompt')
      expect(promptWire?.args).toMatchObject({
        request: {
          requestId: submission.requestId,
          sessionId,
          mode: 'queue',
        },
      })
      expect((promptWire?.args.request as Record<string, unknown>)).not.toHaveProperty('deliveryRestriction')

      const queued = messageFor(host.inbox.nextTurn, submission.requestId)
      expect(queued.source).not.toHaveProperty('deliveryRestriction')
      await expect(session.updateQueue(queued.id, { kind: 'steer' }))
        .resolves.toEqual({ ok: true, value: { accepted: true } })

      const updateWire = transport.requests.find(request => request.endpoint === 'session/updateQueue')
      expect(updateWire?.args).toMatchObject({
        request: {
          sessionId,
          itemId: queued.id,
          action: { kind: 'steer' },
        },
      })
      expect(host.inbox.nextTurn).toEqual([])
      expect(host.inbox.nextStep).toEqual([queued])
      expect(messageRpcId(host.inbox.nextStep[0]!)).toBe(submission.requestId)
      expect(transport.targetCalls('session/prompt')).toBe(1)
      expect(transport.targetCalls('session/updateQueue')).toBe(1)
      expect(host.sendCalls()).toBe(0)
      expect(hasTurnAttempt(host.session)).toBe(false)
    })
  }, TEST_TIMEOUT_MS)
})
