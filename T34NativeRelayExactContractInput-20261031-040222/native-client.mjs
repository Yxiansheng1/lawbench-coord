// T34 original native client (line A, DeepSeek).
//
// Source-only artifact. The author wrote this file and did NOT execute it.
// The Root runner owns every runtime action.
//
// What this is: the original canonical CLI profile boot (original appBoot,
// original launch environment, original loader, original llm and llm-pi-ai
// modules, all pinned in the approved inventory) with one private, freshly
// created profile, plus the original T50 in-memory credentials fixture, and
// exactly one original `ctx.llm.stream(...)` call against a loopback
// forwarder.
//
// What this is not: not a GUI run, not an Agent run, not a Session run, not a
// history or session store, not a keyring or system store, and not a
// re-implementation of the SDK. The credential set here is a fake process
// memory sentinel; the real relay key never reaches this process.

import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync as writeFileSyncRaw,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const LITERALS_PATH = join(HERE, 'literal-inputs.json')
const MAX_ARTIFACT_BYTES = 64 * 1024
const STREAM_TIMEOUT_MS = 90000
const CALLER = 'T34_CALLER_SENTINEL'
const CREDENTIAL_REF = 'EXTERNAL_LLM_KEY'

function writeFileSync(path, data, options) {
  return writeFileSyncRaw(
    path,
    data,
    options === 'wx' ? { encoding: 'utf8', flag: 'wx' } : options,
  )
}

const PIN_SUFFIXES = {
  credentials: 't50-memory-credentials.mjs',
  app_boot: 'packages\\boot\\app-boot\\lib\\index.js',
  config_editor: 'packages\\boot\\config-editor\\lib\\index.js',
  settings: 'packages\\settings\\settings\\lib\\index.js',
  loader: 'vendor\\loader\\lib\\index.js',
  timer: 'vendor\\timer\\lib\\index.js',
  hmr: 'packages\\boot\\hmr\\lib\\index.js',
  llm: 'packages\\llm\\llm\\lib\\index.js',
  llm_pi_ai: 'packages\\llm\\llm-pi-ai\\lib\\index.js',
  cli_profile_boot: 'apps\\cli\\lib\\profile-boot.js',
  launch_environment: 'packages\\util\\launch-environment\\lib\\index.js',
}

function parseArgs(argv) {
  const parsed = { root: undefined, port: undefined }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--root') {
      parsed.root = argv[index += 1]
      continue
    }
    if (token === '--port') {
      parsed.port = Number(argv[index += 1])
      continue
    }
    throw new Error('unknown argument')
  }
  if (parsed.root === undefined || !Number.isInteger(parsed.port)) {
    throw new Error('missing --root or --port')
  }
  return parsed
}

function boundedError(error) {
  const allowedNames = new Set([
    'AbortError',
    'Error',
    'RangeError',
    'TimeoutError',
    'TypeError',
  ])
  const allowedCodes = new Set([
    'ABORT_ERR',
    'EACCES',
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOENT',
    'EPIPE',
    'ETIMEDOUT',
  ])
  return {
    name: allowedNames.has(error?.name) ? error.name : 'OTHER',
    code: allowedCodes.has(error?.code) ? error.code : 'OTHER',
  }
}

const args = parseArgs(process.argv.slice(2))
const literals = JSON.parse(readFileSync(LITERALS_PATH, 'utf8'))
const pins = literals.sdk_and_frozen_pins

function verifyPins() {
  const groups = [
    ['sdk', literals.sdk_and_frozen_pins, 45],
    ['service', literals.service_source_pins, 5],
    ['additional', literals.additional_runtime_and_primary_pins, 2],
  ]
  if (groups.some(([, group, count]) => !Array.isArray(group) || group.length !== count)) {
    throw new Error('pin group count mismatch')
  }
  for (const [, group] of groups) {
    for (const pin of group) {
      const bytes = readFileSync(pin.path)
      if (bytes.length !== pin.bytes) {
        throw new Error('pin byte count mismatch')
      }
      const digest = createHash('sha256').update(bytes).digest('hex')
      if (digest !== pin.sha256) {
        throw new Error('pin digest mismatch')
      }
    }
  }
}

verifyPins()

function pinPath(suffix) {
  const matches = pins.filter(
    pin => typeof pin?.path === 'string'
      && pin.path.toLowerCase().endsWith(suffix.toLowerCase()),
  )
  if (matches.length !== 1) {
    throw new Error(`pin lookup failed for ${suffix}`)
  }
  return matches[0].path
}

function moduleUrl(suffix) {
  return pathToFileURL(pinPath(suffix)).href
}

const result = {
  schema: 'lawbench-t34-native-client-v1',
  startedAtUtc: new Date().toISOString(),
  outcome: 'NOT_RUN',
  phase: 'START',
  reply: null,
  reply_bytes: null,
  finish_reason: null,
  usage: null,
  chunks: { total: 0, text_delta: 0, usage: 0, finish: 0 },
  boot: { profile_created: false, profile_loaded: false, run_profile_called: false },
  credential: { ref: CREDENTIAL_REF, value: CALLER, synthetic: true, persisted: false },
  shutdown: { attempted: false, fulfilled: false },
  error: null,
}

let application = null
let shutdown = null

try {
  result.phase = 'IMPORTS'
  const appBoot = await import(moduleUrl(PIN_SUFFIXES.app_boot))
  const cliBoot = await import(moduleUrl(PIN_SUFFIXES.cli_profile_boot))
  const launchEnvironment = await import(moduleUrl(PIN_SUFFIXES.launch_environment))

  result.phase = 'PROFILE'
  const profileName = 'native-relay'
  const bundleName = 'native-relay-bundle'
  const home = join(args.root, 'dsh-home')
  process.env.DSH_HOME = home
  const profileDir = join(home, 'profiles', profileName)
  const bundleDir = join(profileDir, 'node_modules', bundleName)
  mkdirSync(join(home, 'profiles'), { recursive: true })
  mkdirSync(bundleDir, { recursive: true })
  appBoot.initProfile(profileDir, [bundleName])

  const bundlePatch = [
    {
      insert: [
        { id: 't50-memory-credentials', name: moduleUrl(PIN_SUFFIXES.credentials) },
        { id: 'config-editor', name: moduleUrl(PIN_SUFFIXES.config_editor) },
        { id: 'settings', name: moduleUrl(PIN_SUFFIXES.settings) },
        { id: 'llm', name: moduleUrl(PIN_SUFFIXES.llm) },
        { id: 'llm-pi-ai', name: moduleUrl(PIN_SUFFIXES.llm_pi_ai) },
        { id: 'timer', name: moduleUrl(PIN_SUFFIXES.timer) },
        {
          id: 'hmr',
          name: moduleUrl(PIN_SUFFIXES.hmr),
          config: { root: [], ignored: [], debounce: 0 },
        },
      ],
    },
  ]
  writeFileSync(
    join(bundleDir, 'package.json'),
    `${JSON.stringify(
      {
        name: bundleName,
        version: '1.0.0',
        private: true,
        dsh: { bundle: { patch: 'cordis.patch.yml' } },
      },
      null,
      2,
    )}\n`,
    { encoding: 'utf8', flag: 'wx' },
  )
  writeFileSync(
    join(bundleDir, 'cordis.patch.yml'),
    `${JSON.stringify(bundlePatch, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  )
  const profilePatch = [
    {
      id: 'llm-pi-ai',
      config: {
        providers: {
          external: {
            displayName: 't34-native-relay',
            apiKeyEnv: CREDENTIAL_REF,
            api: 'openai-completions',
            baseURL: `http://127.0.0.1:${args.port}/v1-ext`,
            models: [
              {
                id: literals.model,
                input: ['text'],
                contextWindow: 32768,
              },
            ],
          },
        },
      },
    },
  ]
  writeFileSync(
    join(profileDir, 'cordis.patch.yml'),
    `${JSON.stringify(profilePatch, null, 2)}\n`,
    { encoding: 'utf8', flag: 'w' },
  )
  writeFileSync(join(profileDir, 'cordis.yml'), '[]\n', {
    encoding: 'utf8',
    flag: 'wx',
  })
  result.boot.profile_created = true

  const loaded = appBoot.loadProfileDirectory('dsh', profileDir, literals.install_anchor)
  result.boot.profile_loaded = true

  result.phase = 'BOOT'
  const environment = launchEnvironment.createLaunchEnvironmentSnapshot([])
  application = await cliBoot.runProfile({
    environment,
    profile: profileName,
    resolvedProfile: {
      profile: loaded,
      installAnchor: literals.install_anchor,
    },
    patchFiles: [],
    args: [],
  })
  result.boot.run_profile_called = true
  const ctx = application?.ctx
  shutdown = application?.shutdown
  if (ctx === undefined || typeof shutdown?.shutdown !== 'function') {
    throw new Error('boot returned no usable context')
  }

  result.phase = 'CREDENTIAL'
  const credentials = ctx.get('credentials')
  if (credentials === undefined || typeof credentials.set !== 'function') {
    throw new Error('credentials service unavailable')
  }
  await credentials.set(CREDENTIAL_REF, CALLER)

  result.phase = 'STREAM'
  const stream = ctx.llm.stream({
    provider: 'external',
    model: literals.model,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: literals.prompt }],
      },
    ],
    maxTokens: literals.max_tokens,
    signal: AbortSignal.timeout(STREAM_TIMEOUT_MS),
  })
  let text = ''
  let bytes = 0
  for await (const chunk of stream) {
    result.chunks.total += 1
    if (chunk?.type === 'text-delta') {
      result.chunks.text_delta += 1
      const delta = typeof chunk.text === 'string' ? chunk.text : ''
      bytes += Buffer.byteLength(delta, 'utf8')
      if (bytes > MAX_ARTIFACT_BYTES) {
        throw new Error('reply exceeded the bounded artifact size')
      }
      text += delta
    } else if (chunk?.type === 'usage') {
      result.chunks.usage += 1
      result.usage = chunk.usage ?? null
    } else if (chunk?.type === 'finish') {
      result.chunks.finish += 1
      result.finish_reason = chunk.reason ?? null
    }
  }
  result.reply = text
  result.reply_bytes = Buffer.byteLength(text, 'utf8')
  if (result.reply_bytes === 0) {
    throw new Error('empty reply')
  }
  if (result.finish_reason?.kind !== 'stop') {
    throw new Error('finish reason kind is not stop')
  }
  result.outcome = 'STREAM_COMPLETE'
} catch (error) {
  result.error = boundedError(error)
  if (result.outcome === 'NOT_RUN') {
    result.outcome = 'FAILED'
  }
} finally {
  result.phase = 'SHUTDOWN'
  if (shutdown !== undefined && typeof shutdown?.shutdown === 'function') {
    result.shutdown.attempted = true
    try {
      await shutdown.shutdown(0)
      result.shutdown.fulfilled = true
    } catch (error) {
      result.shutdown.error = boundedError(error)
    }
  }
  result.finishedAtUtc = new Date().toISOString()
  const target = join(args.root, 'node-result.json')
  if (!existsSync(target)) {
    writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, 'wx')
  }
}

process.exitCode = result.outcome === 'STREAM_COMPLETE' && result.shutdown.fulfilled ? 0 : 1
