import assert from 'node:assert/strict'

import {
  createDiagnosticLogger,
  installGetSettingsWrapper,
} from './settings-read-observer.mjs'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolveFn, rejectFn) => {
    resolve = resolveFn
    reject = rejectFn
  })
  return { promise, resolve, reject }
}

function captureLogger() {
  const lines = []
  const logger = createDiagnosticLogger({
    sink: (line) => lines.push(line),
    now: () => '2026-10-30T12:59:10.000Z',
    pid: 4100,
  })
  return { lines, logger }
}

function runningContext(state = 'running') {
  return {
    get(key) {
      assert.equal(key, 'lawbenchCore')
      return { state: () => state }
    },
  }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

async function controlOne() {
  const call = deferred()
  let originalCalls = 0
  let originalThis
  let originalArgs
  class Probe {
    getSettings(...args) {
      originalCalls += 1
      originalThis = this
      originalArgs = args
      return call.promise
    }
  }
  const { lines, logger } = captureLogger()
  let state = 'starting'
  const ctx = { get: () => ({ state: () => state }) }
  const restore = installGetSettingsWrapper(Probe.prototype, {
    ctx,
    logger,
    moduleHashVerified: true,
  })
  const receiver = new Probe()
  const returned = receiver.getSettings('settings', 7)
  assert.equal(returned, call.promise)
  assert.equal(originalCalls, 1)
  assert.equal(originalThis, receiver)
  assert.deepEqual(originalArgs, ['settings', 7])
  state = 'running'
  const value = {
    defaults: {},
    skill_presets: {},
    profile: {},
    external_llm: {},
  }
  call.resolve(value)
  assert.equal(await returned, value)
  await settle()
  const events = lines.map((line) => JSON.parse(line))
  assert.deepEqual(events.map((event) => event.phase), ['call', 'fulfilled'])
  assert.equal(events[0].serviceState, 'starting')
  assert.equal(events[1].serviceState, 'running')
  assert.equal(events[1].fulfilledShape.ownsDefaults, true)
  assert.equal(events[1].fulfilledShape.ownsSkillPresets, true)
  assert.equal(events[1].fulfilledShape.ownsProfile, true)
  assert.equal(events[1].fulfilledShape.ownsExternalLlm, true)
  assert.equal(restore(), true)
  console.log('PASS control=1 one_call_same_receiver_args_promise_value_and_state')
}

async function controlTwo() {
  const sentinel = 'T34_SECRET_SENTINEL_DO_NOT_LOG'
  const originalError = new Error(sentinel)
  originalError.code = 'SERVICE_UNAVAILABLE'
  originalError.stack = sentinel
  Object.defineProperty(originalError, 'serviceCode', {
    get() {
      throw new Error(sentinel)
    },
  })
  Object.defineProperty(originalError, 'secret', {
    get() {
      throw new Error(sentinel)
    },
  })
  class Probe {
    getSettings() {
      return Promise.reject(originalError)
    }
  }
  const { lines, logger } = captureLogger()
  const restore = installGetSettingsWrapper(Probe.prototype, {
    ctx: runningContext(),
    logger,
    moduleHashVerified: true,
  })
  const returned = new Probe().getSettings()
  await assert.rejects(returned, (error) => error === originalError)
  await settle()
  const text = lines.join('\n')
  assert.equal(text.includes(sentinel), false)
  const events = lines.map((line) => JSON.parse(line))
  const rejected = events.find((event) => event.phase === 'rejected')
  assert.equal(rejected.errorName, 'Error')
  assert.equal(rejected.code, 'SERVICE_UNAVAILABLE')
  assert.equal(rejected.serviceCode, 'OTHER')
  assert.equal(restore(), true)
  console.log('PASS control=2 rejection_identity_fixed_shape_and_no_secret_read')
}

function controlThree() {
  const originalError = new TypeError('synthetic synchronous failure')
  let calls = 0
  class Probe {
    getSettings() {
      calls += 1
      throw originalError
    }
  }
  const { lines, logger } = captureLogger()
  const restore = installGetSettingsWrapper(Probe.prototype, {
    ctx: runningContext('failed'),
    logger,
    moduleHashVerified: true,
  })
  assert.throws(
    () => new Probe().getSettings(),
    (error) => error === originalError,
  )
  assert.equal(calls, 1)
  const rejected = lines.map((line) => JSON.parse(line))
    .find((event) => event.phase === 'rejected')
  assert.equal(rejected.errorName, 'TypeError')
  assert.equal(rejected.serviceState, 'failed')
  assert.equal(restore(), true)
  console.log('PASS control=3 synchronous_throw_identity_preserved')
}

async function controlFour() {
  const value = Object.freeze({ ok: true })
  const originalPromise = Promise.resolve(value)
  class Probe {
    getSettings() {
      return originalPromise
    }
  }
  const logger = createDiagnosticLogger({
    sink() {
      throw new Error('synthetic logger failure')
    },
    now: () => '2026-10-30T12:59:10.000Z',
    pid: 4100,
  })
  const ctx = {
    get() {
      throw new Error('synthetic state failure')
    },
  }
  const restore = installGetSettingsWrapper(Probe.prototype, {
    ctx,
    logger,
    moduleHashVerified: true,
  })
  const returned = new Probe().getSettings()
  assert.equal(returned, originalPromise)
  assert.equal(await returned, value)
  await settle()
  assert.equal(restore(), true)
  console.log('PASS control=4_logger_and_state_failures_do_not_change_outcome')
}

async function controlFive() {
  class Probe {
    getSettings() {
      return Promise.resolve({
        defaults: {},
        skill_presets: {},
        profile: {},
        external_llm: {},
      })
    }
  }
  const { lines, logger } = captureLogger()
  const restore = installGetSettingsWrapper(Probe.prototype, {
    ctx: runningContext(),
    logger,
    moduleHashVerified: true,
  })
  for (let index = 0; index < 10; index += 1) {
    await new Probe().getSettings()
  }
  await settle()
  assert.equal(lines.length, 8)
  assert.ok(Buffer.byteLength(lines.join('\n'), 'utf8') <= 16 * 1024)

  const replacement = function laterReplacement() {
    return Promise.resolve('later')
  }
  Object.defineProperty(Probe.prototype, 'getSettings', {
    configurable: true,
    writable: true,
    value: replacement,
  })
  assert.equal(restore(), false)
  assert.equal(Probe.prototype.getSettings, replacement)

  const oversizedLines = []
  const oversized = createDiagnosticLogger({
    sink: (line) => oversizedLines.push(line),
    now: () => 'x'.repeat(17 * 1024),
    pid: 4100,
  })
  assert.equal(oversized.log({ phase: 'installed' }), false)
  assert.equal(oversizedLines.length, 0)
  console.log('PASS control=5_event_cap_byte_budget_and_owned_restore')
}

async function main() {
  await controlOne()
  await controlTwo()
  controlThree()
  await controlFour()
  await controlFive()
}

main().catch((error) => {
  console.error(`FAIL ${error?.name ?? 'Error'}: ${error?.message ?? 'unknown'}`)
  process.exitCode = 1
})
