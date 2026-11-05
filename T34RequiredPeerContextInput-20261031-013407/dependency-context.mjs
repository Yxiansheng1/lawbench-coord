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
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TASK = 'T34-complete-launcher'
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
const COMPLETE_RUNTIME_NAME = 'complete-runtime'
const COMPILED_RESULT_NAME = 'compiled-boundary-result.json'

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

const WORKSPACE_APP_BOOT = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\boot\\app-boot\\lib\\index.js',
  bytes: 181825,
  sha256: 'b49e65913fff98a54313a4f94b9f9092f0e6aa9dc44a8b2a6e43d56b117967df',
})

const COPY_TABLE = Object.freeze({
  path: 'D:\\Lawbeach\\lawbench-coord\\T34DependencyContextInput-20261031-011744\\approved-copy-table.json',
  bytes: 1722626,
  sha256: '44710f94a3368937cfd808fae8f0c5ffbdea6ffe14602bf2e183247e0c035c7e',
  schema: 'lawbench-t34-fixed-original-dependency-table-v1',
  fileCount: 4704,
  byteCount: 25628005,
})

const PREPARED_RESOURCE_ROOT = 'D:\\Lawbeach\\lawbench-coord\\T34DependencyResources-20261031-011744'
const PREPARED_RESOURCE_PARENT = 'D:\\Lawbeach\\lawbench-coord'
const PREPARE_MODE = 'PREPARE_ONLY'
const ACTUAL_MODE = 'ACTUAL'
const PREPARED_PROOF_NAME = 'compiled-boundary-result.json'
const RUNTIME_EXTENSIONS = Object.freeze(['.js', '.cjs', '.mjs', '.json'])

const LAUNCHER_MODULES = Object.freeze({
  workspaceCliProfileBoot: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot.js',
    bytes: 310,
    sha256: 'c53d4e2caf21428e263b525e657dafaf63fd183f7ef016aabda56af7998b6c4f',
  },
  workspaceCliProfileBootChunk: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\apps\\cli\\lib\\profile-boot-BZ2ZjNWi.js',
    bytes: 12593,
    sha256: 'c394b2aa2ce08a3b1fcc8c544257c7d689dd4d0b1cfaf8602687e65eeaba5aa1',
  },
  launchEnvironment: {
    path: 'D:\\Lawbeach\\lawbench-A\\dsh\\packages\\util\\launch-environment\\lib\\index.js',
    bytes: 2991,
    sha256: '6aab33b43d6caa4ee483f7d796a17afb400fca02b7a259fb55d486626e6bb7f0',
  },
})

const ACTUAL_INSTALL_ANCHOR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T50\\20261023-211421\\project\\node_modules\\@deepseek-ai\\dsh\\package.json'
const ACTUAL_PROFILE_DIR = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home\\profiles\\desktop'
const ACTUAL_DSH_HOME = 'D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T34\\LiteralRouteGUI-20261030-225948\\runs\\T34-private-projection-observer-20261030-232427\\gui\\dsh-home'

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
  'copy_table_pin_mismatch',
  'copy_table_schema_mismatch',
  'prepared_root_not_found',
  'prepared_proof_invalid',
  'prepared_runtime_mismatch',
  'internal_loader_unavailable',
  'import_identity_mismatch',
  'guard_install_failed',
  'profile_setup_failed',
  'actual_profile_load_failed',
  'runtime_resolution_failed',
  'workspace_app_boot_import_failed',
  'launcher_import_failed',
  'runtime_copy_failed',
  'synthetic_profile_load_failed',
  'launcher_shutdown_unavailable',
  'launcher_boot_rejected',
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

function parseActualRoot(argv) {
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
    assertExistingPrefixesHaveNoReparse(root)
  } catch (error) {
    if (error instanceof BoundaryFailure) throw error
    throw new BoundaryFailure('root_create_failed')
  }
  return root
}

function parsePrepareRoot(argv) {
  if (argv.length !== 3
    || argv[0] !== '--prepare-only'
    || argv[1] !== '--root'
    || !isAbsolute(argv[2])) {
    throw new BoundaryFailure('args_invalid')
  }
  const root = resolve(argv[2])
  if (normalizePathForCompare(root)
    !== normalizePathForCompare(PREPARED_RESOURCE_ROOT)) {
    throw new BoundaryFailure('root_outside_runs')
  }
  if (normalizePathForCompare(dirname(root))
    !== normalizePathForCompare(PREPARED_RESOURCE_PARENT)) {
    throw new BoundaryFailure('root_outside_runs')
  }
  if (!existsSync(PREPARED_RESOURCE_PARENT)) {
    throw new BoundaryFailure('runs_directory_missing')
  }
  assertExistingPrefixesHaveNoReparse(PREPARED_RESOURCE_PARENT)
  if (existsSync(root)) throw new BoundaryFailure('root_already_exists')
  try {
    mkdirSync(root, { mode: 0o700 })
    assertExistingPrefixesHaveNoReparse(root)
  } catch (error) {
    if (error instanceof BoundaryFailure) throw error
    throw new BoundaryFailure('root_create_failed')
  }
  return root
}

function parseInvocation(argv) {
  if (argv[0] === '--prepare-only') {
    return {
      mode: PREPARE_MODE,
      root: parsePrepareRoot(argv),
    }
  }
  const root = parseActualRoot(argv)
  if (normalizePathForCompare(root)
      === normalizePathForCompare(PREPARED_RESOURCE_ROOT)) {
    throw new BoundaryFailure('root_outside_runs')
  }
  return { mode: ACTUAL_MODE, root }
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
  const path = ownedPath(root, COMPILED_RESULT_NAME)
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function assertRegularFileNoReparse(path, label) {
  let stats
  try {
    stats = lstatSync(path)
  } catch {
    throw new BoundaryFailure(label)
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new BoundaryFailure(label)
  }
  const real = realpathSync.native(path)
  if (normalizePathForCompare(real) !== normalizePathForCompare(path)) {
    throw new BoundaryFailure(label)
  }
}

function readVerifiedSourcePin(pin) {
  assertRegularFileNoReparse(pin.path, 'source_pin_mismatch')
  const bytes = readFileSync(pin.path)
  if (bytes.byteLength !== pin.bytes
    || sha256Bytes(bytes) !== pin.sha256) {
    throw new BoundaryFailure('source_pin_mismatch')
  }
  return bytes
}

function normalizeOwnedRelative(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value)) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  const normalized = value.replaceAll('/', '\\')
  if (/^[a-zA-Z]:/.test(normalized) || normalized.startsWith('\\\\')) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  const segments = normalized.split('\\')
  if (segments.some(segment => segment === ''
    || segment === '.'
    || segment === '..')) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  if (!RUNTIME_EXTENSIONS.includes(extname(normalized).toLowerCase())) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  return normalized
}

function validateCopyTableDocument(document) {
  if (document === null
    || typeof document !== 'object'
    || Array.isArray(document)
    || document.schema !== COPY_TABLE.schema
    || document.file_count !== COPY_TABLE.fileCount
    || document.bytes !== COPY_TABLE.byteCount
    || !Array.isArray(document.files)
    || document.files.length !== COPY_TABLE.fileCount) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }

  const relativePaths = new Set()
  let byteCount = 0
  const files = document.files.map((row) => {
    if (row === null
      || typeof row !== 'object'
      || Array.isArray(row)
      || typeof row.path !== 'string'
      || !isAbsolute(row.path)
      || !Number.isSafeInteger(row.bytes)
      || row.bytes < 0
      || typeof row.sha256 !== 'string'
      || !/^[0-9a-f]{64}$/.test(row.sha256)
      || typeof row.relative !== 'string') {
      throw new BoundaryFailure('copy_table_schema_mismatch')
    }
    const normalizedRelative = normalizeOwnedRelative(row.relative)
    const relativeKey = normalizedRelative.toLowerCase()
    if (relativePaths.has(relativeKey)) {
      throw new BoundaryFailure('copy_table_schema_mismatch')
    }
    relativePaths.add(relativeKey)
    byteCount += row.bytes
    return Object.freeze({
      path: row.path,
      bytes: row.bytes,
      sha256: row.sha256,
      relative: row.relative,
    })
  })
  if (byteCount !== COPY_TABLE.byteCount) {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  return Object.freeze({
    schema: COPY_TABLE.schema,
    files: Object.freeze(files),
    fileCount: COPY_TABLE.fileCount,
    byteCount: COPY_TABLE.byteCount,
  })
}

function loadCopyTable(result) {
  assertRegularFileNoReparse(COPY_TABLE.path, 'copy_table_pin_mismatch')
  const bytes = readFileSync(COPY_TABLE.path)
  if (bytes.byteLength !== COPY_TABLE.bytes
    || sha256Bytes(bytes) !== COPY_TABLE.sha256) {
    throw new BoundaryFailure('copy_table_pin_mismatch')
  }
  let document
  try {
    document = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new BoundaryFailure('copy_table_schema_mismatch')
  }
  const table = validateCopyTableDocument(document)
  result.copyTable = {
    schema: table.schema,
    fileCount: table.fileCount,
    byteCount: table.byteCount,
    sha256: COPY_TABLE.sha256,
  }
  stage(result, 'fixed_copy_table_verified', {
    fileCount: table.fileCount,
    byteCount: table.byteCount,
  })
  return table
}

function verifySourcePins(result, copyTable) {
  let verified = 0
  const pinSets = [
    ['module', MODULES],
    ['launcher', LAUNCHER_MODULES],
    ['workspace', { workspaceAppBoot: WORKSPACE_APP_BOOT }],
  ]
  for (const [kind, pins] of pinSets) for (const [moduleName, pin] of Object.entries(pins)) {
    const bytes = readVerifiedSourcePin(pin)
    result.source.modules.push({
      module: moduleName,
      kind,
      bytesMatch: bytes.byteLength === pin.bytes,
      sha256Match: sha256Bytes(bytes) === pin.sha256,
    })
    verified += 1
  }
  result.source.verified = verified

  let copyInputsVerified = 0
  let copyBytesVerified = 0
  for (const pin of copyTable.files) {
    const bytes = readVerifiedSourcePin(pin)
    copyInputsVerified += 1
    copyBytesVerified += bytes.byteLength
  }
  result.source.copyInputsVerified = copyInputsVerified
  result.source.copyInputCount = copyTable.fileCount
  result.source.copyBytesVerified = copyBytesVerified
  result.source.totalVerified = verified + copyInputsVerified
  stage(result, 'source_pins_verified', {
    originalPins: verified,
    copyInputs: copyInputsVerified,
    copyBytes: copyBytesVerified,
  })
}

function pathKey(path) {
  return normalizePathForCompare(path)
}

function assertDirectoryNoReparse(path, label) {
  let stats
  try {
    stats = lstatSync(path)
  } catch {
    throw new BoundaryFailure(label)
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new BoundaryFailure(label)
  }
  const real = realpathSync.native(path)
  if (normalizePathForCompare(real) !== normalizePathForCompare(path)) {
    throw new BoundaryFailure(label)
  }
}

function ensurePreparedDirectory(root, target, checkedDirectories) {
  const rootKey = pathKey(root)
  const targetKey = pathKey(target)
  if (targetKey === rootKey) {
    assertDirectoryNoReparse(root, 'root_parent_reparse')
    checkedDirectories.add(rootKey)
    return
  }
  if (!assertWithin(root, target)) {
    throw new BoundaryFailure('runtime_copy_failed')
  }
  const segments = relative(root, target).split(sep).filter(Boolean)
  let cursor = root
  for (const segment of segments) {
    cursor = join(cursor, segment)
    const key = pathKey(cursor)
    if (checkedDirectories.has(key)) continue
    if (!existsSync(cursor)) {
      try {
        mkdirSync(cursor, { mode: 0o700 })
      } catch {
        throw new BoundaryFailure('runtime_copy_failed')
      }
    }
    assertDirectoryNoReparse(cursor, 'runtime_copy_failed')
    checkedDirectories.add(key)
  }
}

function verifyPreparedDirectory(root, target, checkedDirectories) {
  const rootKey = pathKey(root)
  const targetKey = pathKey(target)
  if (targetKey === rootKey) {
    assertDirectoryNoReparse(root, 'prepared_runtime_mismatch')
    checkedDirectories.add(rootKey)
    return
  }
  if (!assertWithin(root, target)) {
    throw new BoundaryFailure('prepared_runtime_mismatch')
  }
  const segments = relative(root, target).split(sep).filter(Boolean)
  let cursor = root
  for (const segment of segments) {
    cursor = join(cursor, segment)
    const key = pathKey(cursor)
    if (checkedDirectories.has(key)) continue
    assertDirectoryNoReparse(cursor, 'prepared_runtime_mismatch')
    checkedDirectories.add(key)
  }
}

function deriveRuntimePaths(runtimeRoot) {
  const dshDir = ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh')
  const desktopHostDir = ownedPath(
    runtimeRoot,
    'node_modules',
    '@deepseek-ai',
    'dsh-desktop-host',
  )
  const effectiveModulePaths = Object.freeze({
    appBoot: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js'),
    configEditor: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-config-editor', 'lib', 'index.js'),
    settings: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-settings', 'lib', 'index.js'),
    loader: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis-plugin-loader', 'lib', 'index.js'),
    cordis: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis', 'lib', 'index.js'),
    timer: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'cordis-plugin-timer', 'lib', 'index.js'),
    hmr: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-hmr', 'lib', 'index.js'),
    llm: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-llm', 'lib', 'index.js'),
    llmPiAi: ownedPath(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh-llm-pi-ai', 'lib', 'index.js'),
  })
  const effectiveModuleUrls = Object.freeze(Object.fromEntries(
    Object.entries(effectiveModulePaths).map(([name, path]) => [
      name,
      pathToFileURL(path).href,
    ]),
  ))
  return Object.freeze({
    runtimeRoot,
    installAnchor: ownedPath(dshDir, 'package.json'),
    desktopHostEntry: ownedPath(desktopHostDir, 'lib', 'index.js'),
    effectiveModulePaths,
    effectiveModuleUrls,
  })
}

function prepareOwnedRuntime(root, copyTable, result) {
  assertDirectoryNoReparse(root, 'root_parent_reparse')
  const runtimePaths = deriveRuntimePaths(ownedPath(root, COMPLETE_RUNTIME_NAME))
  const runtimeRoot = runtimePaths.runtimeRoot
  if (existsSync(runtimeRoot)) throw new BoundaryFailure('runtime_copy_failed')
  const checkedDirectories = new Set([pathKey(root)])
  ensurePreparedDirectory(root, runtimeRoot, checkedDirectories)

  let copiedBytes = 0
  let copyCount = 0
  for (const pin of copyTable.files) {
    const sourceBytes = readVerifiedSourcePin(pin)
    const relativePath = normalizeOwnedRelative(pin.relative)
    const destination = ownedPath(runtimeRoot, relativePath)
    ensurePreparedDirectory(
      runtimeRoot,
      dirname(destination),
      checkedDirectories,
    )
    if (existsSync(destination)) {
      throw new BoundaryFailure('runtime_copy_failed')
    }
    try {
      writeFileSync(destination, sourceBytes, { flag: 'wx', mode: 0o600 })
      assertRegularFileNoReparse(destination, 'runtime_copy_failed')
      const copied = readFileSync(destination)
      if (copied.byteLength !== sourceBytes.byteLength
        || copied.byteLength !== pin.bytes
        || sha256Bytes(copied) !== pin.sha256
        || sha256Bytes(sourceBytes) !== pin.sha256) {
        throw new BoundaryFailure('runtime_copy_failed')
      }
    } catch (error) {
      if (error instanceof BoundaryFailure) throw error
      throw new BoundaryFailure('runtime_copy_failed')
    }
    copiedBytes += sourceBytes.byteLength
    copyCount += 1
  }

  result.completeRuntime = {
    target: COMPLETE_RUNTIME_NAME,
    fileCount: copyCount,
    byteCount: copiedBytes,
    allSourceHeld: copyCount === copyTable.fileCount
      && copiedBytes === copyTable.byteCount,
    allCopyEqual: true,
    sourceOfTruth: 'FIXED_APPROVED_COPY_TABLE',
    fixedRoles: {
      installAnchor: 'owned_runtime_dsh_package',
      desktopHostEntry: 'owned_runtime_desktop_host_entry',
      appBoot: 'owned_runtime_appBoot_module',
      profileBoot: 'owned_runtime_dsh_profile_boot',
      observer: 'original_source_pin_unchanged',
    },
  }
  stage(result, 'prepared_dependency_files_created', {
    fileCount: copyCount,
    byteCount: copiedBytes,
  })
  return runtimePaths
}

function verifyPreparedProof(root, copyTable) {
  const proofPath = ownedPath(root, PREPARED_PROOF_NAME)
  assertRegularFileNoReparse(proofPath, 'prepared_proof_invalid')
  if (statSync(proofPath).size > 1024 * 1024) {
    throw new BoundaryFailure('prepared_proof_invalid')
  }
  let proof
  try {
    proof = JSON.parse(readFileSync(proofPath, 'utf8'))
  } catch {
    throw new BoundaryFailure('prepared_proof_invalid')
  }
  if (proof === null
    || typeof proof !== 'object'
    || proof.mode !== PREPARE_MODE
    || proof.copyTable?.schema !== copyTable.schema
    || proof.copyTable?.sha256 !== COPY_TABLE.sha256
    || proof.copyTable?.fileCount !== copyTable.fileCount
    || proof.copyTable?.byteCount !== copyTable.byteCount
    || proof.ready?.outcome !== 'DEPENDENCY_FILES_PREPARED_NO_APP_IMPORT'
    || proof.ready?.appImported !== false
    || proof.ready?.runProfileCalled !== false) {
    throw new BoundaryFailure('prepared_proof_invalid')
  }
}

function verifyPreparedRuntime(root, copyTable, result) {
  if (normalizePathForCompare(root)
    !== normalizePathForCompare(PREPARED_RESOURCE_ROOT)) {
    throw new BoundaryFailure('prepared_root_not_found')
  }
  if (!existsSync(root)) throw new BoundaryFailure('prepared_root_not_found')
  assertDirectoryNoReparse(root, 'prepared_root_not_found')
  verifyPreparedProof(root, copyTable)

  const runtimePaths = deriveRuntimePaths(ownedPath(root, COMPLETE_RUNTIME_NAME))
  const runtimeRoot = runtimePaths.runtimeRoot
  const checkedDirectories = new Set([pathKey(root)])
  verifyPreparedDirectory(root, runtimeRoot, checkedDirectories)

  let copyCount = 0
  let copyBytes = 0
  for (const pin of copyTable.files) {
    const relativePath = normalizeOwnedRelative(pin.relative)
    const destination = ownedPath(runtimeRoot, relativePath)
    verifyPreparedDirectory(
      runtimeRoot,
      dirname(destination),
      checkedDirectories,
    )
    assertRegularFileNoReparse(destination, 'prepared_runtime_mismatch')
    const copied = readFileSync(destination)
    if (copied.byteLength !== pin.bytes
      || sha256Bytes(copied) !== pin.sha256) {
      throw new BoundaryFailure('prepared_runtime_mismatch')
    }
    copyCount += 1
    copyBytes += copied.byteLength
  }
  if (copyCount !== copyTable.fileCount
    || copyBytes !== copyTable.byteCount) {
    throw new BoundaryFailure('prepared_runtime_mismatch')
  }

  result.completeRuntime = {
    target: COMPLETE_RUNTIME_NAME,
    fileCount: copyCount,
    byteCount: copyBytes,
    allSourceHeld: true,
    allCopyEqual: true,
    sourceOfTruth: 'FIXED_APPROVED_COPY_TABLE',
    fixedRoles: {
      installAnchor: 'owned_runtime_dsh_package',
      desktopHostEntry: 'owned_runtime_desktop_host_entry',
      appBoot: 'owned_runtime_appBoot_module',
      profileBoot: 'owned_runtime_dsh_profile_boot',
      observer: 'original_source_pin_unchanged',
    },
  }
  result.preparedRuntime = {
    proofVerified: true,
    copiesVerified: true,
    fileCount: copyCount,
    byteCount: copyBytes,
  }
  stage(result, 'prepared_runtime_verified', {
    fileCount: copyCount,
    byteCount: copyBytes,
  })
  return runtimePaths
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

function syntheticBundlePatch(root, runtime) {
  return [{
    insert: [
      { id: 'config-editor', name: runtime.effectiveModuleUrls.configEditor },
      { id: 'settings', name: runtime.effectiveModuleUrls.settings },
      { id: 'llm', name: runtime.effectiveModuleUrls.llm },
      { id: 'llm-pi-ai', name: runtime.effectiveModuleUrls.llmPiAi },
      { id: 'timer', name: runtime.effectiveModuleUrls.timer },
      {
        id: 'hmr',
        name: runtime.effectiveModuleUrls.hmr,
        config: { root: [], ignored: [], debounce: 0 },
      },
      {
        id: 't34-projection-observer',
        name: pathToFileURL(MODULES.observer.path).href,
        config: {
          stateDir: root,
          outputPath: join(root, OBSERVER_OUTPUT_NAME),
          configEditorModuleUrl: runtime.effectiveModuleUrls.configEditor,
          settingsModuleUrl: runtime.effectiveModuleUrls.settings,
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

function createSyntheticProfile(root, appBoot, runtime) {
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
    `${JSON.stringify(syntheticBundlePatch(root, runtime), null, 2)}\n`,
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
    installAnchor: runtime.installAnchor,
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

async function importLauncherProfileBoot(loaderModule, result, runtime) {
  const internalLoader = loaderModule.ModuleLoader.fromInternal()
  if (internalLoader === undefined) {
    throw new BoundaryFailure('internal_loader_unavailable')
  }
  const parentUrl = pathToFileURL(runtime.desktopHostEntry).href
  let profileBoot
  try {
    profileBoot = await internalLoader.import(
      '@deepseek-ai/dsh/profile-boot',
      parentUrl,
      {},
    )
  } catch (error) {
    result.profileBootImport = {
      attempted: true,
      outcome: 'REJECTED',
      specifier: '@deepseek-ai/dsh/profile-boot',
      parentEntry: basename(runtime.desktopHostEntry),
      parentIsOwnedRuntime: true,
      loaderResolveApiAvailable: typeof internalLoader.resolve === 'function',
      boundedResolvedPath: 'NOT_RECORDED',
      error: boundedError(error),
    }
    throw new BoundaryFailure('launcher_import_failed')
  }
  result.profileBootImport = {
    attempted: true,
    outcome: 'FULFILLED',
    specifier: '@deepseek-ai/dsh/profile-boot',
    parentEntry: basename(runtime.desktopHostEntry),
    parentIsOwnedRuntime: true,
    loaderResolveApiAvailable: typeof internalLoader.resolve === 'function',
    boundedResolvedPath: 'NOT_RECORDED',
    runProfileFunction: typeof profileBoot.runProfile === 'function',
  }
  stage(result, 'launcher_profile_boot_imported')
  return {
    internalLoader,
    profileBoot,
    parentUrl,
  }
}

async function importWorkspaceAppBoot(result) {
  try {
    const workspaceAppBoot = await import(
      pathToFileURL(WORKSPACE_APP_BOOT.path).href
    )
    result.workspaceAppBootImport = {
      attempted: true,
      outcome: 'FULFILLED',
      bootFunction: typeof workspaceAppBoot.boot === 'function',
    }
    stage(result, 'workspace_app_boot_imported')
    return workspaceAppBoot
  } catch (error) {
    result.workspaceAppBootImport = {
      attempted: true,
      outcome: 'REJECTED',
      error: boundedError(error),
    }
    throw new BoundaryFailure('workspace_app_boot_import_failed')
  }
}

function identity3(left, right) {
  return {
    boot: left.boot === right.boot,
    mountRootInclude: left.mountRootInclude === right.mountRootInclude,
    reconcileProfilePatches: left.reconcileProfilePatches
      === right.reconcileProfilePatches,
  }
}

async function compareAppBootModules(
  internalLoader,
  effectiveRuntimeAppBoot,
  workspaceAppBoot,
  runtime,
  result,
) {
  let internalAppBoot
  try {
    internalAppBoot = await internalLoader.import(
      '@deepseek-ai/dsh-app-boot',
      runtime.effectiveModuleUrls.configEditor,
      {},
    )
  } catch (error) {
    result.importIdentity = {
      checked: true,
      outcome: 'REJECTED',
      base: 'actual_config_editor_file_url',
      error: boundedError(error),
    }
    throw new BoundaryFailure('launcher_import_failed')
  }
  result.importIdentity = {
    checked: true,
    outcome: 'CAPTURED',
    diagnosticOnly: true,
    hardAbortOnMismatch: false,
    base: 'owned_runtime_config_editor_file_url',
    regularWorkspaceIdentity3: identity3(workspaceAppBoot, internalAppBoot),
    effectiveRuntimeIdentity3: identity3(effectiveRuntimeAppBoot, internalAppBoot),
  }
  stage(result, 'app_boot_identities_captured')
  return internalAppBoot
}

function inspectPluginPackages(ctx, result, runtime) {
  const pluginPackages = ctx.get('pluginPackages')
  if (pluginPackages === undefined
    || typeof pluginPackages.packageOf !== 'function') {
    result.pluginPackagesResolution = {
      packageOfAvailable: false,
    }
    return
  }
  let appBootPackage
  let profileBootPackage
  try {
    appBootPackage = pluginPackages.packageOf(
      '@deepseek-ai/dsh-app-boot',
      runtime.effectiveModuleUrls.configEditor,
    )
    profileBootPackage = pluginPackages.packageOf(
      '@deepseek-ai/dsh/profile-boot',
      pathToFileURL(runtime.desktopHostEntry).href,
    )
  } catch {
    result.pluginPackagesResolution = {
      packageOfAvailable: true,
      queryOutcome: 'REJECTED',
    }
    return
  }
  const effectiveAppBootDir = dirname(dirname(
    runtime.effectiveModulePaths.appBoot,
  ))
  const effectiveDshDir = dirname(runtime.installAnchor)
  result.pluginPackagesResolution = {
    packageOfAvailable: true,
    queryOutcome: 'FULFILLED',
    appBootResolved: appBootPackage !== undefined,
    appBootDirectoryMatchesOwnedRuntime: appBootPackage?.dir !== undefined
      && normalizePathForCompare(appBootPackage.dir)
        === normalizePathForCompare(effectiveAppBootDir),
    appBootManifestMatchesOwnedRuntime: appBootPackage?.manifestPath !== undefined
      && normalizePathForCompare(appBootPackage.manifestPath)
        === normalizePathForCompare(join(effectiveAppBootDir, 'package.json')),
    profileBootPackageResolved: profileBootPackage !== undefined,
    profileBootPackageDirectoryMatchesOwnedRuntime:
      profileBootPackage?.dir !== undefined
      && normalizePathForCompare(profileBootPackage.dir)
        === normalizePathForCompare(effectiveDshDir),
  }
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

async function disposeBootedContext(ctx, shutdown, result, root) {
  if (ctx === undefined || result.disposal.attempted) return
  result.disposal.attempted = true
  try {
    await shutdown.shutdown(0)
    result.disposal.outcome = 'FULFILLED'
    result.disposal.route = 'RUNPROFILE_SHUTDOWN'
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
  let invocation
  let root
  let result
  let bootedCtx
  let launcherShutdown
  try {
    invocation = parseInvocation(argv)
    root = invocation.root
    result = {
      schema: 'lawbench-t34-dependency-context-v1',
      task: TASK,
      mode: invocation.mode,
      startedAtUtc: nowUtc(),
      authorRuntime: 'NOT_RUN',
      rootFreshAndExclusive: true,
      stages: [],
      source: {
        verified: 0,
        modules: [],
        copyInputsVerified: 0,
        copyInputCount: 0,
        copyBytesVerified: 0,
      },
      copyTable: {
        schema: COPY_TABLE.schema,
        fileCount: 0,
        byteCount: 0,
        sha256: COPY_TABLE.sha256,
      },
      guards: { installed: false, held: false },
      completeRuntime: {
        target: COMPLETE_RUNTIME_NAME,
        fileCount: 0,
        byteCount: 0,
        allSourceHeld: false,
        allCopyEqual: false,
      },
      preparedRuntime: {
        proofVerified: false,
        copiesVerified: false,
      },
      ready: {
        outcome: 'NOT_REACHED',
        appImported: false,
        runProfileCalled: false,
      },
      effectiveImports: { attempted: false, outcome: 'NOT_RUN' },
      profile: { synthetic: true, defaultBusinessProfileUsed: false },
      actualProfile: { loaded: false },
      runtimeResolution: { computed: false },
      profileBootImport: { attempted: false, outcome: 'NOT_RUN' },
      workspaceAppBootImport: { attempted: false, outcome: 'NOT_RUN' },
      prepare: { pluginPackages: 'RUNPROFILE_OWNED' },
      rootProvenance: { checked: false },
      importIdentity: { checked: false },
      pluginPackagesResolution: { packageOfAvailable: false },
      precondition: { checked: false, ready: false },
      mutation: { attempted: false, outcome: 'NOT_RUN' },
      physicalPrivatePatch: { checked: false },
      observerFinal: { captured: false, reason: 'NOT_AVAILABLE' },
      disposal: { attempted: false, outcome: 'NOT_RUN' },
      outcome: 'NOT_RUN',
    }
    writeResult(root, result)

    const copyTable = loadCopyTable(result)
    writeResult(root, result)

    verifySourcePins(result, copyTable)
    writeResult(root, result)

    result.guards = installNetworkAndProcessGuards()
    stage(result, 'guards_installed')
    writeResult(root, result)

    if (invocation.mode === PREPARE_MODE) {
      prepareOwnedRuntime(root, copyTable, result)
      result.ready = {
        outcome: 'DEPENDENCY_FILES_PREPARED_NO_APP_IMPORT',
        appImported: false,
        runProfileCalled: false,
      }
      result.outcome = 'DEPENDENCY_FILES_PREPARED_NO_APP_IMPORT'
      result.finishedAtUtc = nowUtc()
      writeResult(root, result)
      return 0
    }

    const runtime = verifyPreparedRuntime(
      PREPARED_RESOURCE_ROOT,
      copyTable,
      result,
    )
    writeResult(root, result)

    result.effectiveImports.attempted = true
    const appBoot = await import(runtime.effectiveModuleUrls.appBoot)
    const loaderModule = await import(runtime.effectiveModuleUrls.loader)
    const launchEnvironment = await import(
      pathToFileURL(LAUNCHER_MODULES.launchEnvironment.path).href
    )
    result.effectiveImports.outcome = 'FULFILLED'
    result.ready.appImported = true
    result.effectiveImports.moduleCount = Object.keys(
      runtime.effectiveModuleUrls,
    ).length
    stage(result, 'effective_runtime_imported', {
      moduleCount: result.effectiveImports.moduleCount,
    })
    writeResult(root, result)

    await loadActualRuntimeResolution(appBoot, result)
    writeResult(root, result)

    const launcher = await importLauncherProfileBoot(loaderModule, result, runtime)
    const workspaceAppBoot = await importWorkspaceAppBoot(result)
    writeResult(root, result)

    const synthetic = createSyntheticProfile(root, appBoot, runtime)
    result.profile.created = true
    stage(result, 'profile_created')
    writeResult(root, result)

    let loadedSynthetic
    try {
      loadedSynthetic = appBoot.loadProfileDirectory(
        BIN,
        synthetic.profileDir,
        runtime.installAnchor,
      )
    } catch (error) {
      result.profile.loaded = false
      result.error = boundedError(error)
      throw new BoundaryFailure('synthetic_profile_load_failed')
    }
    result.profile.loaded = true
    result.profile.loadedDirMatchesOwned = normalizePathForCompare(
      loadedSynthetic.dir,
    ) === normalizePathForCompare(synthetic.profileDir)
    stage(result, 'synthetic_profile_loaded')
    writeResult(root, result)

    const launchEnvironmentSnapshot =
      launchEnvironment.createLaunchEnvironmentSnapshot([])
    stage(result, 'launcher_boot_started')
    writeResult(root, result)

    let application
    try {
      application = await launcher.profileBoot.runProfile({
        environment: launchEnvironmentSnapshot,
        profile: 'compiled-boundary',
        resolvedProfile: {
          profile: loadedSynthetic,
          installAnchor: runtime.installAnchor,
        },
        patchFiles: [],
        args: [],
      })
      bootedCtx = application?.ctx
      launcherShutdown = application?.shutdown
      if (bootedCtx === undefined
        || launcherShutdown === undefined
        || typeof launcherShutdown.shutdown !== 'function') {
        throw new BoundaryFailure('launcher_shutdown_unavailable')
      }
    } catch (error) {
      result.mutation.outcome = 'NOT_REACHED'
      result.error = boundedError(error)
      result.outcome = 'BOOT_REJECTED'
      result.ready.outcome = 'ACTUAL_BOOT_REJECTED'
      result.disposal = {
        attempted: false,
        outcome: bootedCtx === undefined
          ? 'NO_CONTEXT_RETURNED'
          : 'CONTEXT_RETURNED_WITHOUT_USABLE_SHUTDOWN',
        fullContextDisposedClaimed: false,
      }
      stage(result, 'launcher_boot_rejected', {
        boundedError: result.error,
      })
      if (bootedCtx !== undefined
        && launcherShutdown !== undefined
        && typeof launcherShutdown.shutdown === 'function') {
        await disposeBootedContext(
          bootedCtx,
          launcherShutdown,
          result,
          root,
        )
      }
      writeResult(root, result)
      return 1
    }

    result.profile.booted = true
    result.ready.runProfileCalled = true
    stage(result, 'launcher_booted')
    result.rootProvenance = {
      checked: true,
      ...inspectRootProvenance(bootedCtx),
    }
    inspectPluginPackages(bootedCtx, result, runtime)
    writeResult(root, result)

    await compareAppBootModules(
      launcher.internalLoader,
      appBoot,
      workspaceAppBoot,
      runtime,
      result,
    )
    writeResult(root, result)

    result.precondition = {
      checked: true,
      ...inspectLiveNamespace(bootedCtx),
    }
    result.ready.outcome = result.precondition.ready
      ? 'ACTUAL_LAUNCHER_READY'
      : 'ACTUAL_PRECONDITION_FAILED'
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
        await bootedCtx.settings.mutate(NAMESPACE, [{
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
      result.mutation.post = inspectPostMutation(bootedCtx)
    }

    result.physicalPrivatePatch = {
      checked: true,
      ...physicalMarkerCounts(synthetic.profileContext.patchPath),
    }
    result.guards.blockedAttempts = { ...result.guards.attempts }
    writeResult(root, result)

    await disposeBootedContext(bootedCtx, launcherShutdown, result, root)
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
          await disposeBootedContext(
            bootedCtx,
            launcherShutdown,
            result,
            root,
          )
        } catch {
          if (result.disposal.outcome !== 'FULFILLED' && result.disposal.outcome !== 'REJECTED') {
            result.disposal.outcome = 'RESULT_WRITE_FAILED_AFTER_DISPOSE_ATTEMPT'
          }
        }
      }
      if (result.mode === PREPARE_MODE) {
        result.outcome = 'PREPARE_FAILED_COPY_FAILED_NO_APP'
        result.ready = {
          outcome: 'DEPENDENCY_FILES_NOT_PREPARED',
          appImported: false,
          runProfileCalled: false,
        }
      } else if (!result.mutation.attempted) {
        result.mutation.outcome = 'NOT_REACHED'
        result.outcome = 'ACTUAL_FAILED_BEFORE_MUTATION'
        result.ready = {
          outcome: 'ACTUAL_NOT_READY',
          appImported: result.ready.appImported,
          runProfileCalled: result.ready.runProfileCalled,
        }
      } else {
        result.outcome = 'HARNESS_ERROR'
      }
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
