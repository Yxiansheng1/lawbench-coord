import { createHash } from 'node:crypto'
import {
  closeSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { basename, isAbsolute, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 't34-projection-observer'
export const inject = ['configEditor', 'settings']

const TASK = 'T34-private-projection-observer'
const EVENT_LIMIT = 8
const MAX_BYTES = 16 * 1024
const OUTPUT_NAME = 'projection-observer.json'
const TARGET_NAMESPACE = 'llm-pi-ai'
const WRAPPED = new WeakSet()
const BINDING_FAILURES = new Set([
  'output_config_invalid',
  'output_path_outside_state',
  'output_path_reparse',
  'output_path_changed',
  'service_missing',
  'module_url_invalid',
  'module_pin_mismatch',
  'module_export_missing',
  'service_class_mismatch',
  'config_editor_install_failed',
  'config_editor_install_failed_already_wrapped',
  'settings_install_failed',
  'settings_install_failed_already_wrapped',
  'module_load_error',
])

const MODULE_PINS = Object.freeze({
  configEditor: Object.freeze({
    identity: '@deepseek-ai/dsh-config-editor',
    sha256: 'bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5',
  }),
  settings: Object.freeze({
    identity: '@deepseek-ai/dsh-settings',
    sha256: '9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136',
  }),
})

const ERROR_NAMES = new Set([
  'Error', 'TypeError', 'SyntaxError', 'AggregateError', 'ZodError',
  'ValidationError',
])
const ERROR_CODES = new Set([
  'EACCES', 'EPERM', 'ENOENT', 'EBUSY', 'EINVAL', 'EBADF', 'ESTALE',
  'ETIMEDOUT', 'INACTIVE_EFFECT',
])
const ISSUE_CODES = new Set([
  'invalid_type', 'invalid_value', 'invalid_format', 'not_multiple_of',
  'unrecognized_keys', 'invalid_union', 'invalid_key', 'invalid_element',
  'custom', 'too_big', 'too_small', 'invalid_date', 'invalid_arguments',
  'invalid_return_type', 'invalid_intersection_types', 'not_finite',
])
const SAFE_PATH_SEGMENTS = new Set([
  'providers', 'external', 'lawfirm', 'api', 'models', 'baseURL',
  'base_url', 'contextWindow', 'context_window', 'input', 'id', 'name',
  'model', 'type', 'key', 'tools', 'stream', 'temperature', 'enabled',
])

function fixedFailure(code) {
  const error = new Error(code)
  error.observerCode = code
  return error
}

function failureCode(error) {
  return typeof error?.observerCode === 'string' && BINDING_FAILURES.has(error.observerCode)
    ? error.observerCode
    : 'module_load_error'
}

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
      throw fixedFailure('output_path_reparse')
    }
  }
}

function emptyDocument() {
  return {
    schemaVersion: 1,
    task: TASK,
    observerFile: 'projection-observer.mjs',
    eventLimit: EVENT_LIMIT,
    maxBytes: MAX_BYTES,
    observerState: 'initializing',
    bindingReason: 'not_loaded',
    bindings: {
      configEditor: {
        identity: MODULE_PINS.configEditor.identity,
        sha256: MODULE_PINS.configEditor.sha256,
        hashVerified: false,
        sameServiceClass: false,
        installed: false,
      },
      settings: {
        identity: MODULE_PINS.settings.identity,
        sha256: MODULE_PINS.settings.sha256,
        hashVerified: false,
        sameServiceClass: false,
        installed: false,
      },
    },
    counts: {
      configEditorEdit: 0,
      settingsMutate: 0,
    },
    events: [],
    dropped: 0,
    acceptanceProof: false,
  }
}

function createWriter(config) {
  if (typeof config?.stateDir !== 'string' || typeof config?.outputPath !== 'string' ||
      !isAbsolute(config.stateDir) || !isAbsolute(config.outputPath)) {
    throw fixedFailure('output_config_invalid')
  }
  const stateDir = resolve(config.stateDir)
  const outputPath = resolve(config.outputPath)
  if (!samePath(outputPath, join(stateDir, OUTPUT_NAME)) ||
      basename(outputPath) !== OUTPUT_NAME) {
    throw fixedFailure('output_path_outside_state')
  }
  assertNoReparse(stateDir)
  if (!samePath(realpathSync.native(stateDir), stateDir)) {
    throw fixedFailure('output_path_reparse')
  }

  const document = emptyDocument()
  const descriptor = openSync(outputPath, 'wx', 0o600)
  closeSync(descriptor)

  const verify = () => {
    assertNoReparse(stateDir)
    if (!samePath(realpathSync.native(stateDir), stateDir)) {
      throw fixedFailure('output_path_reparse')
    }
    const current = lstatSync(outputPath)
    if (current.isSymbolicLink() || !current.isFile()) {
      throw fixedFailure('output_path_changed')
    }
  }

  const flush = () => {
    try {
      verify()
      let text = `${JSON.stringify(document, null, 2)}\n`
      while (Buffer.byteLength(text, 'utf8') > MAX_BYTES && document.events.length > 0) {
        document.events.pop()
        document.dropped += 1
        text = `${JSON.stringify(document, null, 2)}\n`
      }
      if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) return false
      writeFileSync(outputPath, text, { encoding: 'utf8', flag: 'w' })
      return true
    } catch {
      return false
    }
  }

  flush()
  return { document, flush }
}

function namespaceOf(value) {
  try {
    return value === TARGET_NAMESPACE ? TARGET_NAMESPACE : 'OTHER'
  } catch {
    return 'OTHER'
  }
}

function safePathSegment(value) {
  if (typeof value === 'string') {
    return SAFE_PATH_SEGMENTS.has(value) ? value : 'OTHER'
  }
  if (Number.isSafeInteger(value) && value >= 0) return 'INDEX'
  return 'OTHER'
}

function safeOperations(ops) {
  try {
    if (!Array.isArray(ops)) {
      return { count: 'OTHER', items: [] }
    }
    return {
      count: ops.length,
      items: ops.slice(0, 4).map((op) => {
        const operation = op?.op
        const safeOperation = operation === 'set' || operation === 'unset'
          ? operation
          : 'OTHER'
        const path = Array.isArray(op?.path)
          ? op.path.slice(0, 8).map(safePathSegment)
          : ['OTHER']
        return { op: safeOperation, path }
      }),
    }
  } catch {
    return { count: 'OTHER', items: [] }
  }
}

function codeOf(value) {
  return typeof value === 'string' && ERROR_CODES.has(value) ? value : 'OTHER'
}

function categoryOf(error, message) {
  if (error?.code === 'INACTIVE_EFFECT') return 'inactive_context'
  if (error?.name === 'ValidationError') return 'config_validation'
  if (message === 'HMR transactions cannot be nested') return 'hmr_nested_transaction'
  if (message === 'HMR is disposed') return 'hmr_disposed'
  if (message.startsWith('atomic-write: timed out waiting for the writer lock at ')) {
    return 'file_lock_timeout'
  }
  if (error?.name === 'SettingsConflictError') return 'revision_conflict'
  if (message === 'Configuration entry is no longer available') return 'entry_unavailable'
  if (message === 'Configuration entry changed during reload') return 'entry_changed'
  if (message === 'Configuration plugin is no longer active') return 'plugin_inactive'
  if (message === 'Profile patch must be a YAML sequence') return 'profile_not_sequence'
  if (message.startsWith('Configuration for "') &&
      message.endsWith('" is overridden by a home patch or command-line overlay')) {
    return 'overlay_override'
  }
  if (message.startsWith('No configurable plugin entry "') &&
      message.endsWith('"')) {
    return 'no_configurable_entry'
  }
  if (message.startsWith('Plugin entry "') &&
      message.endsWith('" has no volatile fields')) {
    return 'no_volatile_fields'
  }
  if (message.startsWith('Config field "') &&
      message.endsWith('" is not volatile')) {
    return 'nonvolatile_path'
  }
  if (message.startsWith('Plugin entry "') &&
      message.endsWith('" is no longer configurable')) {
    return 'entry_unavailable'
  }
  return 'other'
}

function safeIssues(error) {
  if (!Array.isArray(error?.issues)) return []
  return error.issues.slice(0, 3).map((issue) => ({
    code: typeof issue?.code === 'string' && ISSUE_CODES.has(issue.code)
      ? issue.code
      : 'OTHER',
    path: Array.isArray(issue?.path)
      ? issue.path.slice(0, 8).map(safePathSegment)
      : ['OTHER'],
  }))
}

function moduleFrames(stack) {
  if (typeof stack !== 'string') return []
  const normalized = stack.replaceAll('\\', '/')
  const framePaths = [
    {
      module: '@deepseek-ai/dsh-config-editor/lib/index.js',
      paths: [
        '@deepseek-ai/dsh-config-editor/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/packages/boot/config-editor/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/packages/boot/config-editor/lib/index.js',
      ],
    },
    {
      module: '@deepseek-ai/dsh-settings/lib/index.js',
      paths: [
        '@deepseek-ai/dsh-settings/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/packages/settings/settings/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/packages/settings/settings/lib/index.js',
      ],
    },
    {
      module: '@deepseek-ai/dsh-api-settings-controller/lib/index.js',
      paths: [
        '@deepseek-ai/dsh-api-settings-controller/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/packages/api/settings-controller/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/packages/api/settings-controller/lib/index.js',
      ],
    },
    {
      module: '@deepseek-ai/cordis/lib/index.js',
      paths: [
        '@deepseek-ai/cordis/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/vendor/cordis/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/vendor/cordis/lib/index.js',
      ],
    },
    {
      module: '@deepseek-ai/dsh-hmr/lib/index.js',
      paths: [
        '@deepseek-ai/dsh-hmr/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/packages/boot/hmr/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/packages/boot/hmr/lib/index.js',
      ],
    },
    {
      module: '@deepseek-ai/dsh-atomic-write/lib/index.js',
      paths: [
        '@deepseek-ai/dsh-atomic-write/lib/index.js',
        'D:/Lawbeach/lawbench-A/dsh/packages/util/atomic-write/lib/index.js',
        'file:///D:/Lawbeach/lawbench-A/dsh/packages/util/atomic-write/lib/index.js',
      ],
    },
  ]
  const frames = []
  for (const line of normalized.split('\n')) {
    for (const { module, paths } of framePaths) {
      let match
      for (const candidate of paths) {
        const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        match = line.match(
          new RegExp(`(?:^|[\\s(])${escaped}:(\\d+):(\\d+)(?=$|[\\s)])`),
        )
        if (match) break
      }
      if (!match) continue
      const frame = {
        module,
        line: Number.parseInt(match[1], 10),
        column: Number.parseInt(match[2], 10),
      }
      if (!frames.some((row) => row.module === frame.module &&
          row.line === frame.line && row.column === frame.column)) {
        frames.push(frame)
      }
    }
    if (frames.length >= 4) break
  }
  return frames.slice(0, 4)
}

function safeError(error, depth = 0) {
  try {
    const message = typeof error?.message === 'string' ? error.message : ''
    const summary = {
      name: typeof error?.name === 'string' && ERROR_NAMES.has(error.name)
        ? error.name
        : 'OTHER',
      code: codeOf(error?.code),
      errno: codeOf(error?.errno),
      category: categoryOf(error, message),
      issues: safeIssues(error),
      moduleFrames: moduleFrames(error?.stack),
    }
    if (depth === 0) {
      try {
        const cause = error?.cause
        if (cause !== null && typeof cause === 'object') {
          summary.cause = safeError(cause, 1)
        }
      } catch {}
    }
    if (depth >= 1 || !Array.isArray(error?.errors)) return summary
    summary.aggregate = error.errors.slice(0, 3).map((child) => safeError(child, depth + 1))
    return summary
  } catch {
    return {
      name: 'OTHER',
      code: 'OTHER',
      errno: 'OTHER',
      category: 'other',
      issues: [],
      moduleFrames: [],
    }
  }
}

async function importPinned(url, pin) {
  if (typeof url !== 'string' || !url.startsWith('file:')) {
    throw fixedFailure('module_url_invalid')
  }
  const filePath = fileURLToPath(url)
  const actual = createHash('sha256').update(readFileSync(filePath)).digest('hex')
  if (actual !== pin.sha256) throw fixedFailure('module_pin_mismatch')
  return import(url)
}

function wrapPrototypeMethod(prototype, methodName, makeWrapper, label) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName)
  if (!descriptor || typeof descriptor.value !== 'function' || !descriptor.writable) {
    throw fixedFailure(label)
  }
  if (WRAPPED.has(descriptor.value)) throw fixedFailure(`${label}_already_wrapped`)
  const wrapper = makeWrapper(descriptor.value)
  WRAPPED.add(wrapper)
  Object.defineProperty(prototype, methodName, {
    ...descriptor,
    value: wrapper,
  })
  return () => {
    const current = Object.getOwnPropertyDescriptor(prototype, methodName)
    if (current?.value === wrapper) {
      Object.defineProperty(prototype, methodName, descriptor)
    }
  }
}

function addEvent(writer, event) {
  try {
    if (writer.document.events.length >= EVENT_LIMIT) {
      writer.document.dropped += 1
    } else {
      writer.document.events.push({
        at: new Date().toISOString(),
        ...event,
      })
    }
    writer.flush()
  } catch {}
}

export async function apply(ctx, config = {}) {
  let writer
  try {
    writer = createWriter(config)
  } catch {
    return
  }

  const restore = []
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const restoreMethod of restore.reverse()) {
      try {
        restoreMethod()
      } catch {}
    }
    writer.document.observerState = 'disposed'
    writer.flush()
  }

  try {
    const configEditorService = ctx.get('configEditor')
    const settingsService = ctx.get('settings')
    if (!configEditorService || !settingsService) {
      throw fixedFailure('service_missing')
    }

    const configEditorModule = await importPinned(config.configEditorModuleUrl, MODULE_PINS.configEditor)
    const settingsModule = await importPinned(config.settingsModuleUrl, MODULE_PINS.settings)
    const ConfigEditor = configEditorModule.ConfigEditor ?? configEditorModule.default
    const SettingsForms = settingsModule.SettingsForms ?? settingsModule.default
    if (typeof ConfigEditor !== 'function' || typeof SettingsForms !== 'function') {
      throw fixedFailure('module_export_missing')
    }
    writer.document.bindings.configEditor.hashVerified = true
    writer.document.bindings.settings.hashVerified = true
    writer.document.bindings.configEditor.sameServiceClass =
      Object.getPrototypeOf(configEditorService) === ConfigEditor.prototype
    writer.document.bindings.settings.sameServiceClass =
      Object.getPrototypeOf(settingsService) === SettingsForms.prototype
    if (!writer.document.bindings.configEditor.sameServiceClass ||
        !writer.document.bindings.settings.sameServiceClass) {
      throw fixedFailure('service_class_mismatch')
    }

    restore.push(wrapPrototypeMethod(
      ConfigEditor.prototype,
      'edit',
      (original) => function observedConfigEditorEdit(entry, change) {
        const namespace = namespaceOf(entry?.options?.id)
        const relevant = namespace === TARGET_NAMESPACE
        if (relevant) {
          writer.document.counts.configEditorEdit += 1
          addEvent(writer, {
            seam: 'configEditor.edit',
            phase: 'call',
            namespace,
            changeCallable: typeof change === 'function',
          })
        }
        let outcome
        try {
          outcome = Reflect.apply(original, this, arguments)
        } catch (error) {
          if (relevant) {
            addEvent(writer, {
              seam: 'configEditor.edit',
              phase: 'failed',
              namespace,
              error: safeError(error),
            })
          }
          throw error
        }
        if (!outcome || typeof outcome.then !== 'function') {
          if (relevant) {
            addEvent(writer, {
              seam: 'configEditor.edit',
              phase: 'fulfilled',
              namespace,
            })
          }
          return outcome
        }
        return outcome.then(
          (value) => {
            if (relevant) {
              addEvent(writer, {
                seam: 'configEditor.edit',
                phase: 'fulfilled',
                namespace,
              })
            }
            return value
          },
          (error) => {
            if (relevant) {
              addEvent(writer, {
                seam: 'configEditor.edit',
                phase: 'rejected',
                namespace,
                error: safeError(error),
              })
            }
            throw error
          },
        )
      },
      'config_editor_install_failed',
    ))

    restore.push(wrapPrototypeMethod(
      SettingsForms.prototype,
      'mutate',
      (original) => function observedSettingsMutate(ns, ops, expectedRevision) {
        const namespace = namespaceOf(ns)
        const relevant = namespace === TARGET_NAMESPACE
        const operations = safeOperations(ops)
        if (relevant) {
          writer.document.counts.settingsMutate += 1
          addEvent(writer, {
            seam: 'settings.mutate',
            phase: 'call',
            namespace,
            operations,
            expectedRevisionPresent: arguments.length >= 3 && expectedRevision !== undefined,
          })
        }
        let outcome
        try {
          outcome = Reflect.apply(original, this, arguments)
        } catch (error) {
          if (relevant) {
            addEvent(writer, {
              seam: 'settings.mutate',
              phase: 'failed',
              namespace,
              operations,
              error: safeError(error),
            })
          }
          throw error
        }
        if (!outcome || typeof outcome.then !== 'function') {
          if (relevant) {
            addEvent(writer, {
              seam: 'settings.mutate',
              phase: 'fulfilled',
              namespace,
              operations,
            })
          }
          return outcome
        }
        return outcome.then(
          (value) => {
            if (relevant) {
              addEvent(writer, {
                seam: 'settings.mutate',
                phase: 'fulfilled',
                namespace,
                operations,
              })
            }
            return value
          },
          (error) => {
            if (relevant) {
              addEvent(writer, {
                seam: 'settings.mutate',
                phase: 'rejected',
                namespace,
                operations,
                error: safeError(error),
              })
            }
            throw error
          },
        )
      },
      'settings_install_failed',
    ))

    writer.document.bindings.configEditor.installed = true
    writer.document.bindings.settings.installed = true
    writer.document.bindingReason = 'same_service_classes'
    writer.document.observerState = 'ready'
    writer.flush()
  } catch (error) {
    for (const restoreMethod of restore.reverse()) {
      try {
        restoreMethod()
      } catch {}
    }
    writer.document.bindings.configEditor.installed = false
    writer.document.bindings.settings.installed = false
    writer.document.bindingReason = failureCode(error)
    writer.document.observerState = 'not_installed'
    writer.flush()
  }

  try {
    ctx.effect(() => () => {
      dispose()
    }, 't34-projection-observer: restore wrapped methods')
  } catch {
    dispose()
  }
}
