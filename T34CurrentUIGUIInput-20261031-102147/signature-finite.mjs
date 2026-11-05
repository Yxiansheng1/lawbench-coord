import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import {
  createDiagnosticLogger,
  installGetSettingsWrapper,
} from './settings-read-observer.mjs'

const GATEWAY = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\api\\gateway\\lib\\index.js',
  bytes: 62665,
  sha256: 'ab72e05df730f474737be99e0035f5bd7152433f8a817d3d037876087e993172',
})
const PARSER_BYTES = 1532
const PARSER_SHA256 =
  '6a06ddf7213cfb4df681e3e784255ed96d47c73d571a265fc784c37c0d52eb60'
const OLD_OBSERVER = Object.freeze({
  path:
    'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\SettingsReadPathGUI-20261030-132137\\settings-read-observer.mjs',
  bytes: 11515,
  sha256: 'b53e64830958656d39b92f5360cb41856847f0cd083fbd94248d1d8c97080d08',
})
const OLD_OBSERVER_URL =
  'file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T34/SettingsReadPathGUI-20261030-132137/settings-read-observer.mjs'

class MemoryTypertGatewayError extends Error {
  constructor(code, endpoint, message) {
    super(message)
    this.name = 'TypertGatewayError'
    this.code = code
    this.endpoint = endpoint
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function assertPinnedFile(file) {
  const stats = lstatSync(file.path)
  assert.equal(stats.isFile(), true)
  assert.equal(stats.isSymbolicLink(), false)
  assert.equal(realpathSync.native(file.path), file.path)
  assert.equal(stats.size, file.bytes)
  assert.equal(sha256(readFileSync(file.path)), file.sha256)
}

function loadPinnedParser() {
  assertPinnedFile(GATEWAY)
  const wholeBytes = readFileSync(GATEWAY.path)
  assert.equal(wholeBytes.length, GATEWAY.bytes)
  assert.equal(sha256(wholeBytes), GATEWAY.sha256)

  const source = wholeBytes.toString('utf8')
  const start = source.indexOf('function methodParameterNames(')
  const end = source.indexOf('function assertExactArguments(', start)
  assert.ok(start >= 0 && end > start)
  const parserSource = source.slice(start, end)
  const parserBytes = Buffer.from(parserSource, 'utf8')
  assert.equal(parserBytes.length, PARSER_BYTES)
  assert.equal(sha256(parserBytes), PARSER_SHA256)

  const factory = new Function(
    'TypertGatewayError',
    `${parserSource}\nreturn Object.freeze({ methodParameterNames });`,
  )
  return factory(MemoryTypertGatewayError).methodParameterNames
}

function fixedLogger(module) {
  const lines = []
  const logger = module.createDiagnosticLogger({
    sink: (line) => lines.push(line),
    now: () => '2026-10-30T13:42:12.000Z',
    pid: 4100,
  })
  return { lines, logger }
}

const fixedContext = Object.freeze({
  get() {
    return undefined
  },
})

async function rejectOldRestSignature(methodParameterNames) {
  assertPinnedFile(OLD_OBSERVER)
  assert.equal(pathToFileURL(OLD_OBSERVER.path).href, OLD_OBSERVER_URL)
  const oldObserver = await import(OLD_OBSERVER_URL)
  const { logger } = fixedLogger(oldObserver)
  let originalCalls = 0

  class MemoryProbe {
    getSettings() {
      originalCalls += 1
      return 'unexpected'
    }
  }

  const restore = oldObserver.installGetSettingsWrapper(MemoryProbe.prototype, {
    ctx: fixedContext,
    logger,
    moduleHashVerified: true,
  })
  try {
    const receiver = new MemoryProbe()
    assert.throws(
      () =>
        methodParameterNames(
          receiver,
          'getSettings',
          'llm-pi-ai/getSettings',
        ),
      (error) =>
        error instanceof MemoryTypertGatewayError &&
        error.code === 'gateway/signature-invalid' &&
        error.endpoint === 'llm-pi-ai/getSettings',
    )
    assert.equal(originalCalls, 0)
  } finally {
    assert.equal(restore(), true)
  }
  console.log(
    'PASS old=rejected_before_original count=0 code=gateway/signature-invalid',
  )
}

async function acceptNewZeroParameterSignature(methodParameterNames) {
  const value = Object.freeze({ ok: true })
  const originalPromise = Promise.resolve(value)
  let originalCalls = 0

  class MemoryProbe {
    getSettings() {
      originalCalls += 1
      return originalPromise
    }
  }

  const original = Object.getOwnPropertyDescriptor(
    MemoryProbe.prototype,
    'getSettings',
  ).value
  const { logger } = fixedLogger({ createDiagnosticLogger })
  const restore = installGetSettingsWrapper(MemoryProbe.prototype, {
    ctx: fixedContext,
    logger,
    moduleHashVerified: true,
  })
  try {
    const receiver = new MemoryProbe()
    const names = methodParameterNames(
      receiver,
      'getSettings',
      'llm-pi-ai/getSettings',
    )
    assert.deepEqual(names, [])
    const returned = receiver.getSettings()
    assert.equal(returned, originalPromise)
    assert.equal(await returned, value)
    assert.equal(originalCalls, 1)
  } finally {
    assert.equal(restore(), true)
  }
  assert.equal(MemoryProbe.prototype.getSettings, original)
  console.log(
    'PASS new=accepted names=[] promise_value_identity=held restore=true',
  )
}

async function main() {
  const methodParameterNames = loadPinnedParser()
  await rejectOldRestSignature(methodParameterNames)
  await acceptNewZeroParameterSignature(methodParameterNames)
}

main().catch((error) => {
  console.error(`FAIL ${error?.name ?? 'Error'}: ${error?.message ?? 'unknown'}`)
  process.exitCode = 1
})
