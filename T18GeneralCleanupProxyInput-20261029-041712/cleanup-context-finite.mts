/**
 * Finite lifecycle check for the T18 cleanup entry guard.
 *
 * This file is authored, not run. A later root run may execute it with the
 * approved TSX loader. It creates one empty real Cordis Context, installs the
 * real AgentRegistry, and exercises only the cancel/join guard at the cleanup
 * boundary. It does not create a session, agent, model request, or HTTP call.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const CANDIDATE_ENTRY = join(EVIDENCE_DIR, 'native-general-drafting.mts')
const ORIGINAL_ENTRY =
  'D:\\Lawbeach\\lawbench-coord\\T18GeneralCleanupContractInput-20261029-040438\\native-general-drafting.mts'
const APPROVED_INPUTS =
  'D:\\Lawbeach\\lawbench-coord\\T18GeneralCleanupContractInput-20261029-040438\\approved-empty-context-inputs.json'
const NODE_EXE = 'E:\\node\\node.exe'
const TSX_CLI = 'D:\\Lawbeach\\lawbench-A\\dsh\\node_modules\\tsx\\dist\\cli.mjs'
const LOOKUP_ID = 'cleanup-context-no-agent'
const GUARD_LINE_NUMBER = 2607
const GUARD_PREFIX = '    if ('
const GUARD_SUFFIX = ') {'
const OLD_PREDICATE =
  'production !== undefined && sessionId.length > 0'
const CANDIDATE_PREDICATE =
  'production !== undefined && sessionId.length > 0 && !contextDisposed'
const EXPECTED_INPUTS = [
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/vendor/cordis/lib/index.js',
    bytes: 60_361,
    sha256: '6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/core/agent/src/index.ts',
    bytes: 31_340,
    sha256: '9979fdae64fd0a342067981c39de9cde2da7066d28f8506a501fd51e8f9068b9',
  },
  {
    path: 'D:/Lawbeach/lawbench-A/dsh/packages/core/session/src/index.ts',
    bytes: 60_384,
    sha256: 'e4092a93a5a6daecf9639f2a261cf074d1877318c9ddb2226249802cc21ddd2d',
  },
] as const

type Guard = (
  production: unknown,
  sessionId: string,
  contextDisposed: boolean,
) => boolean

interface BranchResult {
  readonly attempted: boolean
  readonly joined: boolean
  readonly cancelRequests: number
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function readPinned(
  path: string,
  expectedBytes: number,
  expectedSha256: string,
): Promise<Buffer> {
  const bytes = await readFile(path)
  assert.equal(bytes.byteLength, expectedBytes, `byte count mismatch: ${path}`)
  assert.equal(sha256(bytes), expectedSha256, `SHA-256 mismatch: ${path}`)
  return bytes
}

function extractKnownGuard(
  source: string,
  lineNumber: number,
  expectedPredicate: string,
): string {
  const lines = source.split(/\r?\n/)
  const line = lines[lineNumber - 1]
  assert.ok(line !== undefined, `guard line ${lineNumber} is missing`)
  assert.ok(line.startsWith(GUARD_PREFIX), 'guard prefix changed')
  assert.ok(line.endsWith(GUARD_SUFFIX), 'guard suffix changed')
  const predicate = line.slice(
    GUARD_PREFIX.length,
    line.length - GUARD_SUFFIX.length,
  )
  assert.equal(predicate, expectedPredicate, 'known guard predicate changed')
  return predicate
}

function compileKnownGuard(predicate: string): Guard {
  return new Function(
    'production',
    'sessionId',
    'contextDisposed',
    `'use strict'; return Boolean(${predicate});`,
  ) as Guard
}

function runCancelJoinBranch(
  guard: Guard,
  production: unknown,
  sessionId: string,
  contextDisposed: boolean,
  liveRegistry: unknown,
): BranchResult {
  if (!guard(production, sessionId, contextDisposed)) {
    return { attempted: false, joined: false, cancelRequests: 0 }
  }

  const context = production as { live: { agents: unknown } }
  const agents = context.live.agents as {
    get(id: string): { status?: string } | undefined
    list(): Array<{ id: string }>
  }
  const ownedAgent = agents.get(LOOKUP_ID)
  assert.equal(context.live.agents, liveRegistry, 'live registry identity changed')
  assert.equal(ownedAgent, undefined, 'empty registry unexpectedly returned an Agent')
  assert.deepEqual(agents.list(), [], 'empty registry unexpectedly listed an Agent')

  let cancelRequests = 0
  if (ownedAgent?.status === 'running') cancelRequests += 1
  return { attempted: true, joined: true, cancelRequests }
}

async function main(): Promise<void> {
  const inputsBytes = await readPinned(APPROVED_INPUTS, 571,
    '5fa4f92c6584fecba14788ee92d6b7fda378bb9ceb21e0acd0f0e1f56b10affe')
  const inputs: unknown = JSON.parse(inputsBytes.toString('utf8'))
  assert.deepEqual(inputs, EXPECTED_INPUTS, 'approved input manifest changed')

  await readPinned(NODE_EXE, 93_580_104,
    'ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32')
  assert.equal(
    resolve(process.execPath).toLowerCase(),
    resolve(NODE_EXE).toLowerCase(),
    'cleanup check is running under an unapproved Node executable',
  )
  await readPinned(TSX_CLI, 120_402,
    '5d5b2a9f9cf4d6a8b44326b676417e00b42ad04037ed173b7af82ea8146a4fc0')
  for (const input of EXPECTED_INPUTS) {
    await readPinned(input.path, input.bytes, input.sha256)
  }

  const originalBytes = await readPinned(ORIGINAL_ENTRY, 101_388,
    '8da50e45e6c54b78bb3a6e1d2c7c3e736e8534885cb0116c816fcc4aa4439871')
  const candidateBytes = await readPinned(CANDIDATE_ENTRY, 101_408,
    '9dc27eb332b0aedfbc520929b80ed88654d260f6aa0f6e24e109f4cf626c3b40')
  const oldPredicate = extractKnownGuard(
    originalBytes.toString('utf8'),
    GUARD_LINE_NUMBER,
    OLD_PREDICATE,
  )
  const candidatePredicate = extractKnownGuard(
    candidateBytes.toString('utf8'),
    GUARD_LINE_NUMBER,
    CANDIDATE_PREDICATE,
  )
  const oldGuard = compileKnownGuard(oldPredicate)
  const candidateGuard = compileKnownGuard(candidatePredicate)

  const cordisUrl = pathToFileURL(EXPECTED_INPUTS[0].path).href
  const agentUrl = pathToFileURL(EXPECTED_INPUTS[1].path).href
  const cordisModule = await import(cordisUrl) as { Context: new () => any }
  const agentModule = await import(agentUrl) as { default: any }
  const Context = cordisModule.Context
  const AgentRegistry = agentModule.default

  const context = new Context()
  let disposed = false
  try {
    await context.plugin(AgentRegistry)
    const liveRegistry = context.agents
    assert.ok(liveRegistry !== undefined, 'real AgentRegistry did not publish')
    assert.equal(liveRegistry.get(LOOKUP_ID), undefined)
    assert.deepEqual(liveRegistry.list(), [])

    const liveProduction = { live: context }
    const liveBranch = runCancelJoinBranch(
      candidateGuard,
      liveProduction,
      LOOKUP_ID,
      false,
      liveRegistry,
    )
    assert.deepEqual(liveBranch, {
      attempted: true,
      joined: true,
      cancelRequests: 0,
    })

    await context.fiber.dispose()
    disposed = true
    assert.equal(context.agents, undefined, 'disposed Context retained ctx.agents')

    assert.equal(oldGuard({ live: context }, LOOKUP_ID, true), true)
    let oldError: unknown
    try {
      runCancelJoinBranch(
        oldGuard,
        { live: context },
        LOOKUP_ID,
        true,
        liveRegistry,
      )
    } catch (error: unknown) {
      oldError = error
    }
    assert.ok(oldError instanceof TypeError, 'old guard did not reproduce TypeError')

    assert.equal(candidateGuard({ live: context }, LOOKUP_ID, true), false)
    assert.deepEqual(
      runCancelJoinBranch(
        candidateGuard,
        { live: context },
        LOOKUP_ID,
        true,
        liveRegistry,
      ),
      { attempted: false, joined: false, cancelRequests: 0 },
    )
    assert.equal(candidateGuard(undefined, LOOKUP_ID, false), false)
    assert.equal(candidateGuard({ live: context }, '', false), false)

    const report = {
      format: 'lawbench-t18-cleanup-context-finite-v1',
      status: 'PASS',
      scope: 'ACTUAL_EMPTY_CONTEXT_REGISTRY_LIFECYCLE_ONLY',
      originalEntrySha256: sha256(originalBytes),
      candidateEntrySha256: sha256(candidateBytes),
      approvedInputsSha256: sha256(inputsBytes),
      guardLine: GUARD_LINE_NUMBER,
      oldPostDisposeFailure: 'TypeError',
      candidatePostDisposeLookup: 'SKIPPED',
      liveEmptyRegistryBranch: liveBranch,
      setupAbortLookup: 'SKIPPED',
      modelCalls: 0,
      httpCalls: 0,
      agentsCreated: 0,
      sessionsCreated: 0,
      fullConsumerRun: 'NOT_RUN',
    }
    const encoded = `${JSON.stringify(report, null, 2)}\n`

    const args = process.argv.slice(2)
    if (args.length > 0) {
      assert.deepEqual(args.slice(0, 1), ['--output'], 'only --output is accepted')
      assert.equal(args.length, 2, '--output requires one path')
      const outputPath = resolve(args[1])
      assert.equal(dirname(outputPath), EVIDENCE_DIR, 'output must stay in evidence dir')
      assert.equal(
        basename(outputPath),
        'cleanup-context-finite-result.json',
        'output filename is fixed',
      )
      await writeFile(outputPath, encoded, 'utf8')
    }
    process.stdout.write(encoded)
  } finally {
    if (!disposed) await context.fiber.dispose()
  }
}

await main()
