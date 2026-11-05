#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TASK = 'T34-copied-context'
const BIN = 'dsh'
const NAMESPACE = 'llm-pi-ai'
const SYNTHETIC_BASE_URL = 'http://127.0.0.1:1/v1'
const SYNTHETIC_KEY_REFERENCE = 'T34_COMPILED_BOUNDARY_SYNTHETIC_KEY'
const SYNTHETIC_LAWFIRM_MODEL = 'compiled-boundary-lawfirm-model'
const SYNTHETIC_EXTERNAL_MODEL = 'compiled-boundary-external-model'
// Cordis FiberState.ACTIVE is the compiled numeric value from the approved pin.
const CORDIS_FIBER_ACTIVE = 2
const HARNESS_FILE = fileURLToPath(import.meta.url)
const HARNESS_DIR = dirname(HARNESS_FILE)
const RUNS_DIR = join(HARNESS_DIR, 'runs')
const OBSERVER_OUTPUT_NAME = 'projection-observer.json'
const MAX_OBSERVER_BYTES = 16 * 1024

const MODULES = Object.freeze({
  appBoot: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-app-boot\\lib\\index.js',
    bytes: 181825,
    sha256: 'b49e65913fff98a54313a4f94b9f9092f0e6aa9dc44a8b2a6e43d56b117967df',
  },
  configEditor: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-config-editor\\lib\\index.js',
    bytes: 6853,
    sha256: 'bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5',
  },
  settings: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-settings\\lib\\index.js',
    bytes: 22636,
    sha256: '9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136',
  },
  loader: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-loader\\lib\\index.js',
    bytes: 23896,
    sha256: 'b57c5075e881b4ceb3a15382f506ce549bcbdcd2a0f5bae292f67e6a83a45b1f',
  },
  cordis: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis\\lib\\index.js',
    bytes: 60361,
    sha256: '6a9394c0877ff45218818c6e815edd038f8057e1a1deb390a8d43ec81c57691e',
  },
  timer: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\cordis-plugin-timer\\lib\\index.js',
    bytes: 3961,
    sha256: 'aab5832ebcefccd223b16ff3e8f09ca611841f53352c8439ea3acf7cc11ad002',
  },
  hmr: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-hmr\\lib\\index.js',
    bytes: 24872,
    sha256: '75686a16199f90f5b580d96923d3d5c52a513402b399ad723d92506d00ea7676',
  },
  llm: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm\\lib\\index.js',
    bytes: 104821,
    sha256: '314204a70152d3bb7efe921fee3078bfe73fb36784829c10aefc49cafe7017c6',
  },
  llmPiAi: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-llm-pi-ai\\lib\\index.js',
    bytes: 114078,
    sha256: 'a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f',
  },
  observer: {
    path: 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\projection-observer.mjs',
    bytes: 20058,
    sha256: '2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac',
  },
})

const DESKTOP_ANCHOR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh-desktop-host\\package.json'
const ACTUAL_INSTALL_ANCHOR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh\\package.json'
const ACTUAL_PROFILE_DIR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home\\profiles\\desktop'
const ACTUAL_DSH_HOME = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home'
const BARE_MODULE_BASE_URL = `${pathToFileURL(dirname(DESKTOP_ANCHOR)).href}/`

const ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'StartupError',
  'SettingsConflictError',
])

const ERROR_CODES = new Set([
  'EACCES',
  'EBUSY',
  'EEXIST',
  'EISDIR',
  'ENOENT',
  'ENOSPC',
  'ENOTDIR',
  'EPERM',
])

const PRIMARY_ERROR_MESSAGES = Object.freeze({
  root_include_missing: `${BIN}: profile reload requires the root Include entry`,
  entry_changed: 'Configuration entry changed during reload',
  entry_unavailable: 'Configuration entry is no longer available',
  entry_inactive: 'Configuration plugin is no longer active',
  patch_not_sequence: 'Profile patch must be a YAML sequence',
  hmr_nested: 'HMR transactions cannot be nested',
  hmr_disposed: 'HMR is disposed',
})

const FAILURE_LABELS = new Set([
  'args_invalid',
  'root_not_absolute',
  'root_outside_runs',
  'runs_directory_missing',
  'root_parent_reparse',
  'root_already_exists',
  'root_create_failed',
  'source_pin_mismatch',
  'internal_loader_unavailable',
  'import_identity_mismatch',
  'guard_install_failed',
  'profile_setup_failed',
  'actual_profile_load_failed',
  'runtime_resolution_failed',
  'boot_rejected',
  'namespace_precondition_failed',
  'observer_result_read_failed',
  'result_write_failed',
])

class BoundaryFailure extends Error {
  constructor(label) {
    super(label)
    this.label = label
  }
}

function nowUtc() {
  return new Date().toISOString()
}

function boundedName(error) {
  const value = error && typeof error === 'object' && typeof error.name === 'string'
    ? error.name
    : 'UNKNOWN'
  return ERROR_NAMES.has(value) ? value : 'OTHER'
}

function boundedCode(error) {
  const value = error && typeof error === 'object' && typeof error.code === 'string'
    ? error.code
    : undefined
  return value !== undefined && ERROR_CODES.has(value) ? value : 'UNKNOWN'
}

function boundedMessageMatch(error) {
  const value = error && typeof error === 'object' && typeof error.message === 'string'
    ? error.message
    : undefined
  if (value === undefined) return 'UNKNOWN'
  for (const [label, literal] of Object.entries(PRIMARY_ERROR_MESSAGES)) {
    if (value === literal) return label
  }
  return 'UNKNOWN'
}

function boundedError(error) {
  const label = error instanceof BoundaryFailure && FAILURE_LABELS.has(error.label)
    ? error.label
    : 'OTHER'
  return {
    name: boundedName(error),
    code: boundedCode(error),
    label,
    primaryMessageMatch: boundedMessageMatch(error),
  }
}

function stage(result, name, metadata = {}) {
  result.stages.push({ name, atUtc: nowUtc(), ...metadata })
}

function assertWithin(base, candidate) {
  const rel = relative(resolve(base), resolve(candidate))
  return rel !== ''
    && rel !== '..'
    && !rel.startsWith(`..${sep}`)
    && !isAbsolute(rel)
}

function normalizePathForCompare(value) {
  return resolve(value).replaceAll('/', '\\').toLowerCase()
}

function assertExistingPrefixesHaveNoReparse(target) {
  let cursor = resolve(target)
  while (true) {
    if (existsSync(cursor)) {
      if (lstatSync(cursor).isSymbolicLink()) {
        throw new BoundaryFailure('root_parent_reparse')
      }
      const real = realpathSync.native(cursor)
      if (normalizePathForCompare(real) !== normalizePathForCompare(cursor)) {
        throw new BoundaryFailure('root_parent_reparse')
      }
    }
    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }
}

function parseRoot(argv) {
  if (argv.length !== 2 || argv[0] !== '--root' || !isAbsolute(argv[1])) {
    throw new BoundaryFailure('args_invalid')
  }
  const root = resolve(argv[1])
  if (!assertWithin(RUNS_DIR, root)) throw new BoundaryFailure('root_outside_runs')
  if (!existsSync(RUNS_DIR) || !statSync(RUNS_DIR).isDirectory()) {
    throw new BoundaryFailure('runs_directory_missing')
  }
  assertExistingPrefixesHaveNoReparse(RUNS_DIR)
  if (existsSync(root)) throw new BoundaryFailure('root_already_exists')
  try {
    mkdirSync(root, { mode: 0o700 })
  } catch {
    throw new BoundaryFailure('root_create_failed')
  }
  return root
}

function ownedPath(root, ...parts) {
  const candidate = join(root, ...parts)
  if (!assertWithin(root, candidate)) throw new BoundaryFailure('result_write_failed')
  return candidate
}

function writeOwnedText(root, relativePath, content, flag = 'w') {
  const path = ownedPath(root, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, { encoding: 'utf8', flag })
}

function writeResult(root, result) {
  const path = ownedPath(root, 'compiled-boundary-result.json')
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function verifySourcePins(result) {
  let verified = 0
  for (const [moduleName, pin] of Object.entries(MODULES)) {
    const bytes = readFileSync(pin.path)
    const byteMatch = bytes.byteLength === pin.bytes
    const hashMatch = sha256Bytes(bytes) === pin.sha256
    result.source.modules.push({
      module: moduleName,
      bytesMatch: byteMatch,
      sha256Match: hashMatch,
    })
    if (!byteMatch || !hashMatch) {
      throw new BoundaryFailure('source_pin_mismatch')
    }
    verified += 1
  }
  result.source.verified = verified
  stage(result, 'imports_verified', { verified })
}

function createAppReady() {
  return {
    onReady(listener) {
      listener()
      return () => {}
    },
  }
}

function countLiteral(text, literal) {
  let count = 0
  let offset = 0
  while (true) {
    const next = text.indexOf(literal, offset)
    if (next < 0) return count
    count += 1
    offset = next + literal.length
  }
}

function installNetworkAndProcessGuards() {
  const attempts = {
    http: 0,
    https: 0,
    net: 0,
    tls: 0,
    fetch: 0,
    websocket: 0,
    child_process: 0,
    worker: 0,
  }
  const denied = category => function deniedByCompiledBoundary() {
    attempts[category] += 1
    throw new Error(`compiled-boundary: ${category} denied`)
  }
  const replaceMethods = (target, names, category) => {
    for (const name of names) {
      if (target !== undefined && typeof target[name] === 'function') {
        Object.defineProperty(target, name, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: denied(category),
        })
      }
    }
  }
  const net = process.getBuiltinModule('node:net')
  const http = process.getBuiltinModule('node:http')
  const https = process.getBuiltinModule('node:https')
  const tls = process.getBuiltinModule('node:tls')
  const childProcess = process.getBuiltinModule('node:child_process')
  const workerThreads = process.getBuiltinModule('node:worker_threads')

  replaceMethods(net, ['connect', 'createConnection'], 'net')
  if (net?.Socket?.prototype !== undefined) {
    replaceMethods(net.Socket.prototype, ['connect'], 'net')
  }
  replaceMethods(http, ['get', 'request'], 'http')
  replaceMethods(https, ['get', 'request'], 'https')
  replaceMethods(tls, ['connect'], 'tls')
  replaceMethods(childProcess, [
    'exec',
    'execFile',
    'execFileSync',
    'execSync',
    'fork',
    'spawn',
    'spawnSync',
  ], 'child_process')
  replaceMethods(workerThreads, ['Worker'], 'worker')

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: denied('fetch'),
  })
  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: denied('websocket'),
  })
  syncBuiltinESMExports()

  return { attempts, installed: true, held: true }
}

function syntheticBundlePatch(root) {
  return [{
    insert: [
      { id: 'config-editor', name: pathToFileURL(MODULES.configEditor.path).href },
      { id: 'settings', name: pathToFileURL(MODULES.settings.path).href },
      { id: 'llm', name: pathToFileURL(MODULES.llm.path).href },
      { id: 'llm-pi-ai', name: pathToFileURL(MODULES.llmPiAi.path).href },
      { id: 'timer', name: pathToFileURL(MODULES.timer.path).href },
      {
        id: 'hmr',
        name: pathToFileURL(MODULES.hmr.path).href,
        config: { root: [], ignored: [], debounce: 0 },
      },
      {
        id: 't34-projection-observer',
        name: pathToFileURL(MODULES.observer.path).href,
        config: {
          stateDir: root,
          outputPath: join(root, OBSERVER_OUTPUT_NAME),
          configEditorModuleUrl: pathToFileURL(MODULES.configEditor.path).href,
          settingsModuleUrl: pathToFileURL(MODULES.settings.path).href,
        },
      },
    ],
  }]
}

function syntheticProvider(name, model) {
  return {
    displayName: `compiled-boundary-${name}`,
    apiKeyEnv: SYNTHETIC_KEY_REFERENCE,
    api: 'openai-completions',
    baseURL: SYNTHETIC_BASE_URL,
    models: [{
      id: model,
      input: ['text'],
      contextWindow: 2048,
    }],
  }
}

function syntheticProfilePatch() {
  return [{
    id: 'llm-pi-ai',
    config: {
      providers: {
        lawfirm: syntheticProvider('lawfirm', SYNTHETIC_LAWFIRM_MODEL),
        external: syntheticProvider('external', SYNTHETIC_EXTERNAL_MODEL),
      },
    },
  }]
}

function createSyntheticProfile(root, appBoot) {
  const home = ownedPath(root, 'dsh-home')
  const profileDir = ownedPath(home, 'profiles', 'compiled-boundary')
  const bundleName = 'compiled-boundary-bundle'
  const bundleDir = ownedPath(profileDir, 'node_modules', bundleName)

  mkdirSync(home, { recursive: true })
  appBoot.initProfile(profileDir, [bundleName])

  mkdirSync(bundleDir, { recursive: true })
  writeOwnedText(root, relative(root, ownedPath(bundleDir, 'package.json')), `${JSON.stringify({
    name: bundleName,
    version: '1.0.0',
    private: true,
    dsh: { bundle: { patch: 'cordis.patch.yml' } },
  }, null, 2)}\n`)
  writeOwnedText(
    root,
    relative(root, ownedPath(bundleDir, 'cordis.patch.yml')),
    `${JSON.stringify(syntheticBundlePatch(root), null, 2)}\n`,
  )

  const profilePatchPath = ownedPath(profileDir, 'cordis.patch.yml')
  writeOwnedText(
    root,
    relative(root, profilePatchPath),
    `${JSON.stringify(syntheticProfilePatch(), null, 2)}\n`,
  )
  const rootConfigPath = ownedPath(profileDir, 'cordis.yml')
  writeOwnedText(root, relative(root, rootConfigPath), '[]\n')

  const profileContext = {
    name: 'compiled-boundary',
    dir: profileDir,
    patchPath: profilePatchPath,
    installAnchor: DESKTOP_ANCHOR,
    cwd: root,
    home,
    startedBundles: [bundleName],
    overlays: [],
    telemetryDisabledEnv: undefined,
  }

  return { home, profileDir, rootConfigPath, profileContext }
}

async function loadActualRuntimeResolution(appBoot, result) {
  let loadedActualProfile
  try {
    loadedActualProfile = appBoot.loadProfileDirectory(
      BIN,
      ACTUAL_PROFILE_DIR,
      ACTUAL_INSTALL_ANCHOR,
    )
  } catch (error) {
    result.error = boundedError(error)
    throw new BoundaryFailure('actual_profile_load_failed')
  }

  let resolution
  try {
    resolution = await appBoot.createRuntimeResolution({
      installAnchor: ACTUAL_INSTALL_ANCHOR,
      profile: loadedActualProfile,
      home: ACTUAL_DSH_HOME,
    })
  } catch (error) {
    result.error = boundedError(error)
    throw new BoundaryFailure('runtime_resolution_failed')
  }

  result.actualProfile = {
    loaded: true,
    dirMatchesApproved: normalizePathForCompare(loadedActualProfile.dir)
      === normalizePathForCompare(ACTUAL_PROFILE_DIR),
  }
  result.runtimeResolution = {
    computed: true,
    frozen: Object.isFrozen(resolution),
    entriesFrozen: Object.isFrozen(resolution.entries),
    entryCount: resolution.entries.length,
    localPackageCount: resolution.localPackageNames.length,
    linkedRootCount: resolution.linkedRoots.length,
    profilesDirMatchesApprovedHome: normalizePathForCompare(resolution.profilesDir)
      === normalizePathForCompare(join(ACTUAL_DSH_HOME, 'profiles')),
    profileDirMatchesApproved: resolution.profileDir !== undefined
      && normalizePathForCompare(resolution.profileDir)
        === normalizePathForCompare(ACTUAL_PROFILE_DIR),
  }
  stage(result, 'actual_runtime_resolution_computed', {
    entryCount: result.runtimeResolution.entryCount,
    localPackageCount: result.runtimeResolution.localPackageCount,
    linkedRootCount: result.runtimeResolution.linkedRootCount,
  })
  return resolution
}

function inspectRootProvenance(ctx) {
  const rootIsSelf = ctx.root === ctx
  return {
    rootIsSelf,
    configEditorOwnedByRoot: ctx.configEditor.ownerContext.root === ctx.root,
    settingsOwnedByRoot: ctx.settings.ownerContext.root === ctx.root,
  }
}

function captureObserverFinal(root, result) {
  result.observerFinal = {
    captured: false,
    reason: 'NOT_AVAILABLE',
  }
  try {
    const path = ownedPath(root, OBSERVER_OUTPUT_NAME)
    const text = readFileSync(path, 'utf8')
    if (Buffer.byteLength(text, 'utf8') > MAX_OBSERVER_BYTES) {
      result.observerFinal.reason = 'SIZE_LIMIT'
      stage(result, 'observer_final_capture_skipped', { reason: 'SIZE_LIMIT' })
      return
    }
    const document = JSON.parse(text)
    if (document === null || typeof document !== 'object' || Array.isArray(document)) {
      result.observerFinal.reason = 'INVALID_DOCUMENT'
      stage(result, 'observer_final_capture_skipped', { reason: 'INVALID_DOCUMENT' })
      return
    }
    result.observerFinal = {
      captured: true,
      document,
    }
    stage(result, 'observer_final_captured')
  } catch {
    result.observerFinal.reason = 'READ_OR_PARSE_FAILED'
    stage(result, 'observer_final_capture_skipped', { reason: 'READ_OR_PARSE_FAILED' })
  }
}

function physicalMarkerCounts(profilePatchPath) {
  const text = readFileSync(profilePatchPath, 'utf8')
  const lawfirmModelCount = countLiteral(text, SYNTHETIC_LAWFIRM_MODEL)
  const externalModelCount = countLiteral(text, SYNTHETIC_EXTERNAL_MODEL)
  return {
    bytes: Buffer.byteLength(text),
    lawfirmModelMarkerCount: lawfirmModelCount,
    externalModelMarkerCount: externalModelCount,
    syntheticModelMarkerCount: lawfirmModelCount + externalModelCount,
    lawfirmLabelMarkerCount: countLiteral(text, 'compiled-boundary-lawfirm'),
    externalLabelMarkerCount: countLiteral(text, 'compiled-boundary-external'),
    literalBaseUrlCount: countLiteral(text, SYNTHETIC_BASE_URL),
    apiKeyReferenceMarkerCount: countLiteral(text, SYNTHETIC_KEY_REFERENCE),
  }
}

function inspectLiveNamespace(ctx) {
  const entries = [...ctx.loader.entries()].filter(entry => entry.options.id === NAMESPACE)
  const activeEntry = entries.length === 1
    && entries[0]?.fiber !== undefined
    && entries[0].fiber.state === CORDIS_FIBER_ACTIVE
  const descriptors = ctx.settings.describe().filter(row => row.ns === NAMESPACE)
  const providers = descriptors.length === 1
    && descriptors[0]?.value !== null
    && typeof descriptors[0]?.value === 'object'
    && descriptors[0].value.providers !== null
    && typeof descriptors[0].value.providers === 'object'
    ? descriptors[0].value.providers
    : undefined
  const hasLawfirm = providers !== undefined && Object.hasOwn(providers, 'lawfirm')
  const hasExternal = providers !== undefined && Object.hasOwn(providers, 'external')
  return {
    activeEntryCount: entries.length,
    activeEntry,
    liveDescriptorCount: descriptors.length,
    providersOwnLawfirm: hasLawfirm,
    providersOwnExternal: hasExternal,
    ready: activeEntry
      && descriptors.length === 1
      && hasLawfirm
      && hasExternal,
  }
}

function inspectPostMutation(ctx) {
  const descriptors = ctx.settings.describe().filter(row => row.ns === NAMESPACE)
  const providers = descriptors.length === 1
    && descriptors[0]?.value !== null
    && typeof descriptors[0]?.value === 'object'
    && descriptors[0].value.providers !== null
    && typeof descriptors[0].value.providers === 'object'
    ? descriptors[0].value.providers
    : undefined
  return {
    liveDescriptorCount: descriptors.length,
    providersOwnLawfirm: providers !== undefined && Object.hasOwn(providers, 'lawfirm'),
    providersOwnExternal: providers !== undefined && Object.hasOwn(providers, 'external'),
  }
}

async function disposeBootedContext(ctx, result, root) {
  if (ctx === undefined || result.disposal.attempted) return
  result.disposal.attempted = true
  try {
    await ctx.fiber.dispose()
    result.disposal.outcome = 'FULFILLED'
    stage(result, 'disposed')
  } catch (error) {
    result.disposal.outcome = 'REJECTED'
    result.disposal.error = boundedError(error)
    stage(result, 'dispose_rejected')
  }
  result.finishedAtUtc = nowUtc()
  writeResult(root, result)
}

async function main(argv) {
  let root
  let result
  let bootedCtx
  try {
    root = parseRoot(argv)
    result = {
      schema: 'lawbench-t34-copied-context-v1',
      task: TASK,
      startedAtUtc: nowUtc(),
      authorRuntime: 'NOT_RUN',
      rootFreshAndExclusive: true,
      stages: [],
      source: { verified: 0, modules: [] },
      guards: { installed: false, held: false },
      profile: { synthetic: true, defaultBusinessProfileUsed: false },
      actualProfile: { loaded: false },
      runtimeResolution: { computed: false },
      prepare: { pluginPackages: 'NOT_STARTED' },
      rootProvenance: { checked: false },
      importIdentity: { checked: false },
      precondition: { checked: false, ready: false },
      mutation: { attempted: false, outcome: 'NOT_RUN' },
      physicalPrivatePatch: { checked: false },
      observerFinal: { captured: false, reason: 'NOT_AVAILABLE' },
      disposal: { attempted: false, outcome: 'NOT_RUN' },
      outcome: 'NOT_RUN',
    }
    writeResult(root, result)

    verifySourcePins(result)

    const appBoot = await import(pathToFileURL(MODULES.appBoot.path).href)
    const loaderModule = await import(pathToFileURL(MODULES.loader.path).href)

    result.guards = installNetworkAndProcessGuards()
    stage(result, 'guards_installed')
    writeResult(root, result)

    const actualResolution = await loadActualRuntimeResolution(appBoot, result)
    writeResult(root, result)

    const synthetic = createSyntheticProfile(root, appBoot)
    result.profile.created = true
    stage(result, 'profile_created')
    writeResult(root, result)

    const patches = appBoot.readProfilePatches(BIN, synthetic.profileContext)
    const appReady = createAppReady()
    stage(result, 'boot_started')
    writeResult(root, result)

    let ctx
    try {
      ctx = await appBoot.boot(
        BIN,
        synthetic.rootConfigPath,
        patches,
        async hostCtx => {
          hostCtx.provide('profileContext', synthetic.profileContext)
          hostCtx.provide('appReady', appReady)
          stage(result, 'prepare_services_provided')
          result.prepare.pluginPackages = 'STARTED'
          await hostCtx.plugin(appBoot.PluginPackages, {
            resolution: actualResolution,
          })
          result.prepare.pluginPackages = 'INSTALLED'
          stage(result, 'plugin_packages_installed')
        },
        BARE_MODULE_BASE_URL,
      )
      bootedCtx = ctx
    } catch (error) {
      result.mutation.outcome = 'NOT_STARTED_BOOT_REJECTED'
      result.error = boundedError(error)
      result.outcome = 'BOOT_REJECTED'
      stage(result, 'boot_rejected', {
        boundedError: result.error,
        pluginPackages: result.prepare.pluginPackages,
      })
      writeResult(root, result)
      return 1
    }

    result.profile.booted = true
    stage(result, 'booted')
    result.rootProvenance = {
      checked: true,
      ...inspectRootProvenance(ctx),
    }
    writeResult(root, result)

    const internalLoader = loaderModule.ModuleLoader.fromInternal()
    if (internalLoader === undefined) {
      throw new BoundaryFailure('internal_loader_unavailable')
    }
    const internalAppBoot = await internalLoader.import(
      '@deepseek-ai/dsh-app-boot',
      pathToFileURL(MODULES.configEditor.path).href,
      {},
    )
    result.importIdentity = {
      checked: true,
      base: 'actual_config_editor_file_url',
      boot: appBoot.boot === internalAppBoot.boot,
      mountRootInclude: appBoot.mountRootInclude === internalAppBoot.mountRootInclude,
      reconcileProfilePatches: appBoot.reconcileProfilePatches === internalAppBoot.reconcileProfilePatches,
    }
    if (!result.importIdentity.boot
      || !result.importIdentity.mountRootInclude
      || !result.importIdentity.reconcileProfilePatches) {
      throw new BoundaryFailure('import_identity_mismatch')
    }
    stage(result, 'import_identity_verified')
    writeResult(root, result)

    result.precondition = {
      checked: true,
      ...inspectLiveNamespace(ctx),
    }
    stage(result, 'namespace_ready', {
      ready: result.precondition.ready,
      activeEntryCount: result.precondition.activeEntryCount,
      liveDescriptorCount: result.precondition.liveDescriptorCount,
    })
    writeResult(root, result)

    if (!result.precondition.ready) {
      result.mutation.outcome = 'NOT_STARTED_PRECONDITION_FAILED'
      result.outcome = 'PRECONDITION_REJECTED'
    } else {
      result.mutation.attempted = true
      stage(result, 'mutation_started', {
        namespace: NAMESPACE,
        operationCount: 1,
      })
      writeResult(root, result)
      try {
        await ctx.settings.mutate(NAMESPACE, [{
          op: 'unset',
          path: ['providers', 'external'],
        }])
        result.mutation.outcome = 'FULFILLED'
        result.outcome = 'MUTATION_FULFILLED_NOT_WHOLE_T34_PASS'
        stage(result, 'mutation_fulfilled_or_rejected', { outcome: 'FULFILLED' })
      } catch (error) {
        result.mutation.outcome = 'REJECTED'
        result.mutation.error = boundedError(error)
        result.outcome = 'MUTATION_REJECTED_CAUSE_UNKNOWN'
        stage(result, 'mutation_fulfilled_or_rejected', { outcome: 'REJECTED' })
      }
      result.mutation.post = inspectPostMutation(ctx)
    }

    result.physicalPrivatePatch = {
      checked: true,
      ...physicalMarkerCounts(synthetic.profileContext.patchPath),
    }
    result.guards.blockedAttempts = { ...result.guards.attempts }
    writeResult(root, result)

    await disposeBootedContext(bootedCtx, result, root)
    captureObserverFinal(root, result)
    writeResult(root, result)

    if (result.disposal.outcome !== 'FULFILLED') return 4
    if (result.outcome === 'PRECONDITION_REJECTED') return 3
    if (result.mutation.outcome === 'REJECTED') return 2
    return 0
  } catch (error) {
    if (result !== undefined && root !== undefined) {
      if (bootedCtx !== undefined && !result.disposal.attempted) {
        try {
          await disposeBootedContext(bootedCtx, result, root)
        } catch {
          if (result.disposal.outcome !== 'FULFILLED' && result.disposal.outcome !== 'REJECTED') {
            result.disposal.outcome = 'RESULT_WRITE_FAILED_AFTER_DISPOSE_ATTEMPT'
          }
        }
      }
      result.outcome = 'HARNESS_ERROR'
      result.error = boundedError(error)
      result.finishedAtUtc = nowUtc()
      try {
        writeResult(root, result)
      } catch {
        process.stderr.write('compiled-boundary: result write failed\n')
      }
    } else {
      process.stderr.write('compiled-boundary: boundary or internal error\n')
    }
    return 1
  }
}

process.exitCode = await main(process.argv.slice(2))
