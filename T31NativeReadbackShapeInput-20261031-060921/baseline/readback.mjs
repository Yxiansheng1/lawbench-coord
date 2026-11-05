import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import path from 'node:path'
import tls from 'node:tls'
import { isDeepStrictEqual } from 'node:util'
import { pathToFileURL } from 'node:url'
import childProcess from 'node:child_process'
import workerThreads from 'node:worker_threads'

const blockedAttempts = []
const guardOriginals = []
const report = {
  source_only: true,
  gui_rerun: false,
  passed: false,
  failed: true,
  read1: false,
  read2: false,
  closed1: false,
  closed2: false,
  ctx_disposed: false,
  read_count: 0,
  actual_header_id: null,
  request_id: null,
  row_count: null,
  event_count: null,
  sources: { jsonl_pin_ok: false, cordis_pin_ok: false, cordis_resolved: false },
  attempts: { blocked: 0, kinds: [] },
  error: null,
}

function invariant(ok, code) {
  if (ok) return
  const error = new Error(code)
  error.safeCode = code
  throw error
}

function guard(target, key, kind) {
  const original = target[key]
  invariant(typeof original === 'function', `GUARD_UNAVAILABLE:${kind}`)
  guardOriginals.push({ target, key, original })
  target[key] = function guarded() {
    blockedAttempts.push(kind)
    const error = new Error(`BLOCKED:${kind}`)
    error.safeCode = `BLOCKED:${kind}`
    throw error
  }
}

function installGuards() {
  guard(net.Socket.prototype, 'connect', 'net.Socket.connect')
  guard(tls, 'connect', 'tls.connect')
  guard(http, 'request', 'http.request')
  guard(https, 'request', 'https.request')
  guard(globalThis, 'fetch', 'fetch')
  guard(childProcess, 'spawn', 'child_process.spawn')
  guard(childProcess, 'exec', 'child_process.exec')
  guard(childProcess, 'fork', 'child_process.fork')
  guard(workerThreads, 'Worker', 'worker_threads.Worker')
}

function restoreGuards() {
  for (const { target, key, original } of guardOriginals.reverse()) target[key] = original
}

function safeError(error) {
  return {
    name: typeof error?.name === 'string' ? error.name : 'Error',
    code: typeof error?.code === 'string' ? error.code : null,
    message: typeof error?.safeCode === 'string' ? error.safeCode : 'bounded_error',
  }
}

async function pinnedFile(pin) {
  const bytes = await readFile(pin.path)
  return bytes.length === pin.bytes
    && createHash('sha256').update(bytes).digest('hex') === pin.sha256
}

function parseRows(text) {
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  while (rows.length > 0 && rows.at(-1) === '') rows.pop()
  return rows.map(line => JSON.parse(line))
}

function materialFacts(value, found = new Map()) {
  if (Array.isArray(value)) {
    for (const item of value) materialFacts(item, found)
  } else if (value && typeof value === 'object') {
    const id = value.material_id ?? value.materialId ?? (value.type === 'material' ? value.id : undefined)
    if (typeof id === 'string' && typeof value.sha256 === 'string') {
      found.set(`${id}:${value.sha256}`, { material_id: id, sha256: value.sha256 })
    }
    for (const item of Object.values(value)) materialFacts(item, found)
  }
  return [...found.values()].sort((a, b) => a.material_id.localeCompare(b.material_id))
}

async function readSession(ctx, id) {
  const state = { read: false, closed: false, result: null, header: null }
  let handle
  let error
  try {
    handle = await ctx.sessionPersistence.open(id, 'read')
    state.header = handle.header
    try {
      state.result = await handle.read()
      state.read = true
    } catch (caught) {
      error = caught
    }
  } catch (caught) {
    error = caught
  } finally {
    if (handle) {
      try {
        await handle.close()
        state.closed = true
      } catch (caught) {
        error = error === undefined ? caught : new AggregateError([error, caught], 'read or close failed')
      }
    }
  }
  return { ...state, error }
}

let ctx
let failure
try {
  installGuards()
  const approved = JSON.parse(await readFile(new URL('./literal-inputs.json', import.meta.url), 'utf8'))
  report.request_id = approved.request_id
  const task = JSON.parse(await readFile(approved.task.path, 'utf8'))
  invariant(isDeepStrictEqual(task.scope, approved.scope), 'TASK_SCOPE_MISMATCH')

  const jsonlPin = approved.sdk_pins.find(pin => pin.path.endsWith('\\session-persistence-jsonl\\lib\\index.js'))
  const packagePin = approved.sdk_pins.find(pin => pin.path.endsWith('\\session-persistence-jsonl\\package.json'))
  const cordisPin = approved.sdk_pins.find(pin => pin.path.endsWith('\\vendor\\cordis\\lib\\index.js'))
  invariant(jsonlPin && packagePin && cordisPin, 'SOURCE_PIN_MISSING')
  report.sources.jsonl_pin_ok = await pinnedFile(jsonlPin) && await pinnedFile(packagePin)
  report.sources.cordis_pin_ok = await pinnedFile(cordisPin)
  invariant(report.sources.jsonl_pin_ok && report.sources.cordis_pin_ok, 'SOURCE_PIN_CHANGED')

  const requireFromSdkPackage = createRequire(pathToFileURL(packagePin.path))
  const cordisPath = await realpath(requireFromSdkPackage.resolve('@deepseek-ai/cordis'))
  invariant(path.resolve(cordisPath).toLowerCase() === path.resolve(cordisPin.path).toLowerCase(), 'CORDIS_RESOLUTION_MISMATCH')
  report.sources.cordis_resolved = true

  const rows = parseRows(await readFile(approved.physical_native.path, 'utf8'))
  report.row_count = rows.length
  report.event_count = rows.length - 1
  invariant(rows.length === 17 && rows.length - 1 === 16, 'RAW_ROW_COUNT_MISMATCH')
  const [{ type, ...rawHeader }, ...rawEvents] = rows
  invariant(type === 'session', 'RAW_HEADER_TYPE_MISMATCH')

  const { Context } = await import(pathToFileURL(cordisPath).href)
  const { default: JsonlPersistence } = await import(pathToFileURL(jsonlPin.path).href)
  invariant(typeof Context === 'function' && typeof JsonlPersistence === 'function', 'SOURCE_EXPORT_MISMATCH')

  ctx = new Context()
  await ctx.plugin(JsonlPersistence, { root: approved.session_root, compression: 'none' })
  const first = await readSession(ctx, approved.session_id)
  report.read1 = first.read
  report.closed1 = first.closed
  if (first.error) throw first.error

  const second = await readSession(ctx, approved.session_id)
  report.read2 = second.read
  report.closed2 = second.closed
  if (second.error) throw second.error
  report.read_count = 2

  invariant(first.result && second.result, 'READ_RESULT_MISSING')
  invariant(isDeepStrictEqual(first.result.events, rawEvents), 'READ1_EVENTS_MISMATCH')
  invariant(isDeepStrictEqual(second.result.events, rawEvents), 'READ2_EVENTS_MISMATCH')
  invariant(isDeepStrictEqual(first.result.events, second.result.events), 'READ1_READ2_MISMATCH')

  invariant(isDeepStrictEqual(first.header, rawHeader), 'READ_HEADER_MISMATCH')
  invariant(isDeepStrictEqual(second.header, first.header), 'READ_HEADER_INSTABILITY')
  report.actual_header_id = first.header.id
  invariant(first.header.id === approved.session_id, 'HEADER_ID_MISMATCH')
  invariant(first.header.isSeeded === false, 'HEADER_SEEDED_MISMATCH')

  const userMessages = rawEvents.filter(event => event?.type === 'user/message')
  invariant(userMessages.length === 1, 'USER_MESSAGE_COUNT_MISMATCH')
  invariant(userMessages[0].source?.rpcId === approved.request_id, 'USER_MESSAGE_REQUEST_ID_MISMATCH')

  const contextL0 = rawEvents.filter(event => String(event?.type).toLowerCase() === 'context/l0')
  invariant(contextL0.length === 1, 'CONTEXT_L0_COUNT_MISMATCH')
  const expectedFacts = materialFacts(approved.scope.materials)
  const actualFacts = materialFacts(contextL0[0])
  invariant(isDeepStrictEqual(actualFacts, expectedFacts), 'CONTEXT_L0_SCOPE_MISMATCH')
  const l0Text = JSON.stringify(contextL0[0]).toLowerCase()
  invariant(!l0Text.includes('scope-c') && !l0Text.includes('m0003'), 'CONTEXT_L0_SCOPE_C_PRESENT')
} catch (caught) {
  failure = caught
} finally {
  if (ctx) {
    try {
      await ctx.fiber.dispose()
      report.ctx_disposed = true
    } catch (caught) {
      failure = failure === undefined ? caught : new AggregateError([failure, caught], 'dispose failed')
    }
  }
  restoreGuards()
}

report.attempts.blocked = blockedAttempts.length
report.attempts.kinds = [...new Set(blockedAttempts)]
if (failure !== undefined) report.error = safeError(failure)
report.passed = failure === undefined
  && report.read1 && report.read2 && report.closed1 && report.closed2
  && report.ctx_disposed && report.sources.jsonl_pin_ok && report.sources.cordis_pin_ok
  && report.sources.cordis_resolved && blockedAttempts.length === 0
report.failed = !report.passed
console.log(JSON.stringify(report))
process.exitCode = report.passed ? 0 : 1
