import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { basename, isAbsolute, join, parse, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const name = 't34-settings-read-observer'
export const inject = []

const HOST = Object.freeze({
  bytes: 902499,
  sha256: 'ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b',
})
const EVENT_LIMIT = 8
const MAX_BYTES = 16 * 1024
const STATES = new Set([
  'stopped', 'starting', 'running', 'failed', 'version_mismatch',
])
const ERROR_NAMES = new Set([
  'Error', 'TypeError', 'SyntaxError', 'TimeoutError', 'AbortError',
])
const COMMON_ERROR_CODES = new Set([
  'INVALID_ARGUMENT',
  'OUT_OF_CASE',
  'CASE_NOT_FOUND',
  'CASE_ROOT_IS_LINK',
  'CASE_IN_SYNC_FOLDER',
  'MATERIAL_NOT_FOUND',
  'MATERIAL_NOT_READY',
  'TASK_NOT_FOUND',
  'INPUT_CHANGED',
  'BUDGET_EXCEEDED',
  'SERVER_UNREACHABLE',
  'KEY_INVALID',
  'SERVER_BUSY',
  'CONTEXT_TOO_LONG',
  'OUTPUT_TRUNCATED',
  'TIMEOUT',
  'HOST_NOT_ALLOWED',
  'PREP_UNAVAILABLE',
  'CANCELLED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL',
  'OFFICE_DIR_NOT_SET',
  'CONVERTER_UNAVAILABLE',
  'TEMPLATE_MISSING',
  'ENGINE_FAILED',
  'ENGINE_BUSY',
  'PLAN_NOT_CONFIRMED',
  'ORIGINAL_HAS_REVISIONS',
  'CASE_CARD_INVALID',
])

function samePath(left, right) {
  return process.platform === 'win32'
    ? left.toLowerCase() === right.toLowerCase()
    : left === right
}

function assertNoReparse(filePath) {
  const absolute = resolve(filePath)
  const root = parse(absolute).root
  let current = root
  for (const segment of absolute.slice(root.length).split(/[\\/]+/).filter(Boolean)) {
    current = join(current, segment)
    if (lstatSync(current).isSymbolicLink()) {
      throw new Error('T34 settings observer refused a reparse path')
    }
  }
}

function expectedHostPath(stateDir) {
  if (typeof stateDir !== 'string' || !isAbsolute(stateDir)) {
    throw new Error('T34 settings observer state directory is invalid')
  }
  const candidate = resolve(stateDir, '..', 'private-native', 'lib', 'host.js')
  if (basename(candidate) !== 'host.js') {
    throw new Error('T34 settings observer Host basename is invalid')
  }
  return candidate
}

export function verifyAndImportHost(config = {}) {
  const expectedPath = expectedHostPath(config.stateDir)
  const expectedUrl = pathToFileURL(expectedPath).href
  if (config.hostModuleUrl !== expectedUrl) {
    throw new Error('T34 settings observer Host URL is not the owned shim')
  }
  assertNoReparse(expectedPath)
  const stats = lstatSync(expectedPath)
  if (!stats.isFile() || stats.isSymbolicLink() ||
      !samePath(realpathSync.native(expectedPath), expectedPath)) {
    throw new Error('T34 settings observer Host canonical path changed')
  }
  if (stats.size !== HOST.bytes ||
      createHash('sha256').update(readFileSync(expectedPath)).digest('hex') !== HOST.sha256) {
    throw new Error('T34 settings observer Host identity changed')
  }
  return import(expectedUrl)
}

export function readServiceState(ctx) {
  try {
    const core = ctx?.get?.('lawbenchCore')
    if (!core || typeof core.state !== 'function') return 'UNKNOWN'
    const state = Reflect.apply(core.state, core, [])
    return STATES.has(state) ? state : 'UNKNOWN'
  } catch {
    return 'UNKNOWN'
  }
}

function safeErrorName(error) {
  try {
    const value = error?.name
    return typeof value === 'string' && ERROR_NAMES.has(value) ? value : 'OTHER'
  } catch {
    return 'OTHER'
  }
}

function safeErrorCode(error, key) {
  try {
    const value = error?.[key]
    if (value === undefined || value === null) return null
    return typeof value === 'string' && COMMON_ERROR_CODES.has(value) ? value : 'OTHER'
  } catch {
    return 'OTHER'
  }
}

function owned(value, key) {
  try {
    return Object.prototype.hasOwnProperty.call(value, key)
  } catch {
    return false
  }
}

function fulfilledShape(value) {
  const isObject = value !== null && (typeof value === 'object' || typeof value === 'function')
  return {
    typeof: typeof value,
    isObject,
    ownsDefaults: isObject && owned(value, 'defaults'),
    ownsSkillPresets: isObject && owned(value, 'skill_presets'),
    ownsProfile: isObject && owned(value, 'profile'),
    ownsExternalLlm: isObject && owned(value, 'external_llm'),
  }
}

function safeServiceState(ctx) {
  try {
    const state = readServiceState(ctx)
    return STATES.has(state) ? state : 'UNKNOWN'
  } catch {
    return 'UNKNOWN'
  }
}

function safeBoolean(value) {
  return value === true
}

function fixedEvent(fields) {
  const phase = new Set([
    'installed', 'call', 'fulfilled', 'rejected', 'install_failed', 'disposed',
  ]).has(fields?.phase) ? fields.phase : 'install_failed'
  const shape = fields?.fulfilledShape
  return {
    phase,
    localDiagnosticCall: Number.isSafeInteger(fields?.localDiagnosticCall)
      ? fields.localDiagnosticCall
      : 0,
    moduleHashVerified: safeBoolean(fields?.moduleHashVerified),
    sameReceiverPrototype: safeBoolean(fields?.sameReceiverPrototype),
    serviceState: STATES.has(fields?.serviceState) ? fields.serviceState : 'UNKNOWN',
    errorName: ERROR_NAMES.has(fields?.errorName) || fields?.errorName === 'OTHER'
      ? fields.errorName
      : null,
    code: COMMON_ERROR_CODES.has(fields?.code) || fields?.code === 'OTHER'
      ? fields.code
      : null,
    serviceCode: COMMON_ERROR_CODES.has(fields?.serviceCode) || fields?.serviceCode === 'OTHER'
      ? fields.serviceCode
      : null,
    fulfilledShape: shape && typeof shape === 'object'
      ? {
          typeof: typeof shape.typeof === 'string' ? shape.typeof : 'undefined',
          isObject: safeBoolean(shape.isObject),
          ownsDefaults: safeBoolean(shape.ownsDefaults),
          ownsSkillPresets: safeBoolean(shape.ownsSkillPresets),
          ownsProfile: safeBoolean(shape.ownsProfile),
          ownsExternalLlm: safeBoolean(shape.ownsExternalLlm),
        }
      : null,
  }
}

export function createDiagnosticLogger(options = {}) {
  const sink = typeof options.sink === 'function' ? options.sink : console.log
  const now = typeof options.now === 'function' ? options.now : () => new Date().toISOString()
  const pid = Number.isSafeInteger(options.pid) && options.pid > 0 ? options.pid : process.pid
  let sequence = 0
  let bytes = 0

  return {
    log(fields) {
      try {
        if (sequence >= EVENT_LIMIT) return false
        const record = {
          kind: 'T34_SETTINGS_READ_OBS',
          seq: sequence + 1,
          pid,
          time: now(),
          ...fixedEvent(fields),
        }
        const line = JSON.stringify(record)
        const nextBytes = Buffer.byteLength(line, 'utf8') + 1
        if (bytes + nextBytes > MAX_BYTES) return false
        sequence += 1
        bytes += nextBytes
        try {
          Reflect.apply(sink, console, [line])
        } catch {}
        return true
      } catch {
        return false
      }
    },
  }
}

export function installGetSettingsWrapper(prototype, options = {}) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'getSettings')
  if (!descriptor || typeof descriptor.value !== 'function' || !descriptor.writable) {
    throw new Error('T34 settings observer getSettings descriptor is invalid')
  }
  const original = descriptor.value
  const logger = options.logger
  if (!logger || typeof logger.log !== 'function') {
    throw new Error('T34 settings observer logger is invalid')
  }
  const ctx = options.ctx
  const moduleHashVerified = options.moduleHashVerified === true
  let localDiagnosticCall = 0

  const base = (receiver, diagnosticCall) => {
    let sameReceiverPrototype = false
    try {
      sameReceiverPrototype = Object.getPrototypeOf(receiver) === prototype
    } catch {}
    return {
      localDiagnosticCall: diagnosticCall,
      moduleHashVerified,
      sameReceiverPrototype,
      serviceState: safeServiceState(ctx),
    }
  }

  const wrapper = function t34ObservedGetSettings(...args) {
    const receiver = this
    const diagnosticCall = ++localDiagnosticCall
    try {
      logger.log({ ...base(receiver, diagnosticCall), phase: 'call' })
    } catch {}

    let outcome
    try {
      outcome = Reflect.apply(original, this, args)
    } catch (error) {
      try {
        logger.log({
          ...base(receiver, diagnosticCall),
          phase: 'rejected',
          errorName: safeErrorName(error),
          code: safeErrorCode(error, 'code'),
          serviceCode: safeErrorCode(error, 'serviceCode'),
        })
      } catch {}
      throw error
    }

    try {
      if (outcome && typeof outcome.then === 'function') {
        const observed = Promise.prototype.then.call(
          outcome,
          (value) => {
            try {
              logger.log({
                ...base(receiver, diagnosticCall),
                phase: 'fulfilled',
                fulfilledShape: fulfilledShape(value),
              })
            } catch {}
            return value
          },
          (error) => {
            try {
              logger.log({
                ...base(receiver, diagnosticCall),
                phase: 'rejected',
                errorName: safeErrorName(error),
                code: safeErrorCode(error, 'code'),
                serviceCode: safeErrorCode(error, 'serviceCode'),
              })
            } catch {}
            throw error
          },
        )
        if (observed && typeof observed.catch === 'function') {
          observed.catch(() => {})
        }
      }
    } catch {}

    return outcome
  }

  Object.defineProperty(prototype, 'getSettings', {
    ...descriptor,
    value: wrapper,
  })

  let disposed = false
  return () => {
    if (disposed) return false
    disposed = true
    const current = Object.getOwnPropertyDescriptor(prototype, 'getSettings')
    if (current?.value !== wrapper) return false
    Object.defineProperty(prototype, 'getSettings', descriptor)
    return true
  }
}

export async function apply(ctx, config = {}) {
  const logger = createDiagnosticLogger()
  let restore
  let moduleHashVerified = false
  const logFailure = (serviceState = 'UNKNOWN') => {
    try {
      logger.log({
        phase: 'install_failed',
        localDiagnosticCall: 0,
        moduleHashVerified,
        sameReceiverPrototype: false,
        serviceState,
      })
    } catch {}
  }

  try {
    const hostModule = await verifyAndImportHost(config)
    moduleHashVerified = true
    if (typeof hostModule.LawbenchRemote !== 'function') {
      throw new Error('T34 settings observer Host export is missing')
    }
    restore = installGetSettingsWrapper(hostModule.LawbenchRemote.prototype, {
      ctx,
      logger,
      moduleHashVerified,
    })
    try {
      logger.log({
        phase: 'installed',
        localDiagnosticCall: 0,
        moduleHashVerified,
        sameReceiverPrototype: false,
        serviceState: safeServiceState(ctx),
      })
    } catch {}
  } catch {
    logFailure(safeServiceState(ctx))
    return
  }

  const dispose = () => {
    try {
      restore()
    } catch {}
    try {
      logger.log({
        phase: 'disposed',
        localDiagnosticCall: 0,
        moduleHashVerified,
        sameReceiverPrototype: false,
        serviceState: safeServiceState(ctx),
      })
    } catch {}
  }

  try {
    ctx.effect(() => () => {
      dispose()
    }, 't34-settings-read-observer: restore getSettings')
  } catch {
    dispose()
  }
}
