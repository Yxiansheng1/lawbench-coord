#!/usr/bin/env node
/**
 * Private runtime overlay builder derived from the reviewed T31 builder.
 *
 * This is deliberately a copy-only binding change. The only semantic changes are:
 * 1. output is constrained below the fresh Repair1 run root; and
 * 2. every embedded-contracts call receives the pinned B contracts 1.7 directory.
 * The build still refuses stale inputs, verifies fixed source pins, writes only
 * the explicit package allowlist, and never prepares, starts, probes, or tests a
 * runtime.
 */

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, isAbsolute, join, parse, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  CONTRACTS_SOURCE_DIR,
  CONTRACTS_VERSION,
  EVIDENCE_ROOT,
  EXPECTED_A_HEAD,
  FILE_PINS,
  INTENDED_OUTPUTS,
  LAW_BENCH_BUILD_FILES,
  LAW_BENCH_NODE_ENTRIES,
  LAW_BENCH_PACKAGE_ID,
  LAW_BENCH_ROOT,
  NODE_PIN,
  OUTPUT_NAME_PATTERN,
  OUTPUT_PACKAGES,
  OUTPUT_ROOT,
  REFERENCE_PINS,
  REPO_ROOT,
  RUNS_ROOT,
  SESSION_CONTROLLER_PACKAGE_ID,
  SESSION_CONTROLLER_ROOT,
  TREE_DIGEST_ALGORITHM,
  TREE_PINS,
  TSDOWN_ROOT,
  TYPERT_GENERATOR_ROOT,
  UI_CONVERSATION_PACKAGE_ID,
  UI_CONVERSATION_ROOT,
  ESBUILD_ROOT,
} from './build-config.mjs'

const SCRIPT_ROOT = dirname(fileURLToPath(import.meta.url))
const CONTRACTS_SOURCE = join(LAW_BENCH_ROOT, 'scripts', 'contracts-source.mjs')
const TSDOWN_ENTRY = join(TSDOWN_ROOT, 'dist', 'index.mjs')
const TYPERT_ANALYZER_ENTRY = join(TYPERT_GENERATOR_ROOT, 'lib', 'types', 'analyzer.js')
const TYPERT_WORKSPACE_ENTRY = join(TYPERT_GENERATOR_ROOT, 'lib', 'types', 'workspace.js')
const TYPERT_PLUGIN_ENTRY = join(TYPERT_GENERATOR_ROOT, 'lib', 'types', 'tsdown-plugin.js')
const SESSION_TYPERT_OUTPUTS = [
  'lib/typert.host.js',
  'lib/typert.host.d.ts',
  'lib/typert.remote-client.js',
  'lib/typert.remote-client.d.ts',
  'lib/typert.remote-client.d.ts.map',
]

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function samePath(left, right) {
  return resolve(left).toLowerCase() === resolve(right).toLowerCase()
}

function assertInside(parent, child, label) {
  const rel = relative(resolve(parent), resolve(child))
  assert(rel !== '' && !rel.startsWith('..') && !isAbsolute(rel), `${label} escapes ${parent}: ${child}`)
}

function assertNoReparsePath(target, allowMissingTail = false) {
  const absolute = resolve(target)
  const root = parse(absolute).root
  let current = root
  for (const segment of absolute.slice(root.length).split(/[\\/]+/u).filter(Boolean)) {
    current = join(current, segment)
    if (!existsSync(current)) {
      if (allowMissingTail) continue
      fail(`path component is missing: ${current}`)
    }
    const metadata = lstatSync(current)
    assert(!metadata.isSymbolicLink(), `link/reparse path refused: ${current}`)
  }
}

function fileSha256(path) {
  const hash = createHash('sha256')
  hash.update(readFileSync(path))
  return hash.digest('hex')
}

function assertFilePin(pin, label = 'input') {
  assert(existsSync(pin.path), `${label} is missing: ${pin.path}`)
  const metadata = lstatSync(pin.path)
  assert(metadata.isFile(), `${label} is not a regular file: ${pin.path}`)
  assert(!metadata.isSymbolicLink(), `${label} is a link: ${pin.path}`)
  const actual = fileSha256(pin.path)
  assert(actual === pin.sha256, `${label} hash changed: ${pin.path}\n expected ${pin.sha256}\n actual   ${actual}`)
  return { path: pin.path, bytes: metadata.size, sha256: actual }
}

function selected(relativePath, selector) {
  if (selector === 'all') return true
  if (selector === 'version-and-schema-json') {
    if (relativePath === 'VERSION') return true
    if (!relativePath.endsWith('.schema.json')) return false
    return !relativePath.split('/').some(part => part === 'examples' || part === '_build')
  }
  fail(`unknown tree selector: ${selector}`)
}

function walkRegularFiles(root, selector, label) {
  assert(existsSync(root), `${label} root is missing: ${root}`)
  assert(statSync(root).isDirectory(), `${label} root is not a directory: ${root}`)
  const entries = []

  function visit(directory, prefix) {
    const metadata = lstatSync(directory)
    assert(!metadata.isSymbolicLink(), `${label} contains a link/reparse point: ${directory}`)
    const names = readdirSync(directory).sort((left, right) => {
      const a = Buffer.from(left, 'utf8')
      const b = Buffer.from(right, 'utf8')
      return Buffer.compare(a, b)
    })
    for (const name of names) {
      const full = join(directory, name)
      const rel = prefix === '' ? name : `${prefix}/${name}`
      const child = lstatSync(full)
      assert(!child.isSymbolicLink(), `${label} contains a link/reparse point: ${full}`)
      if (child.isDirectory()) {
        visit(full, rel)
      } else {
        assert(child.isFile(), `${label} contains a non-regular entry: ${full}`)
        if (selected(rel, selector)) {
          entries.push({
            absolute: full,
            relative: rel,
            bytes: child.size,
            sha256: fileSha256(full),
          })
        }
      }
    }
  }

  visit(root, '')
  entries.sort((left, right) => Buffer.compare(
    Buffer.from(left.relative, 'utf8'),
    Buffer.from(right.relative, 'utf8'),
  ))
  return entries
}

function treePin(pin) {
  const entries = walkRegularFiles(pin.root, pin.selector, `tree pin ${pin.id}`)
  const bytes = entries.reduce((total, entry) => total + entry.bytes, 0)
  const lines = entries.map(entry => `${entry.relative}\t${entry.bytes}\t${entry.sha256}`).join('\n')
  const actual = createHash('sha256').update(`${lines}\n`, 'utf8').digest('hex')
  assert(entries.length === pin.files, `${pin.id} file count changed: expected ${pin.files}, actual ${entries.length}`)
  assert(bytes === pin.bytes, `${pin.id} byte count changed: expected ${pin.bytes}, actual ${bytes}`)
  assert(actual === pin.sha256, `${pin.id} tree hash changed:\n expected ${pin.sha256}\n actual   ${actual}`)
  return {
    id: pin.id,
    root: pin.root,
    selector: pin.selector,
    files: entries.length,
    bytes,
    sha256: actual,
  }
}

function parseArguments(argv) {
  let output
  let stamp
  let verifyOnly = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--verify-only') { verifyOnly = true; continue }
    if (argument === '--out' || argument === '--stamp') {
      const value = argv[index + 1]
      assert(value !== undefined && !value.startsWith('--'), `${argument} requires a value`)
      if (argument === '--out') output = value
      else stamp = value
      index += 1
      continue
    }
    fail(`unknown argument: ${argument}`)
  }
  assert(output !== undefined, 'missing --out <fresh run child directory>')
  assert(stamp !== undefined, 'missing --stamp <controlled build stamp>')
  assert(/^[0-9A-Za-z.-]{1,40}$/u.test(stamp), '--stamp must match [0-9A-Za-z.-]{1,40}')
  return { output, stamp, verifyOnly }
}

function validateOutputTarget(rawOutput) {
  const output = resolve(SCRIPT_ROOT, rawOutput)
  const runRoot = dirname(output)
  assert(samePath(dirname(runRoot), RUNS_ROOT), `output run root must be a direct child of ${RUNS_ROOT}: ${runRoot}`)
  assert(/^[0-9]{8}-[0-9]{6}$/u.test(basename(runRoot)), `run root basename must be YYYYMMDD-HHMMSS: ${runRoot}`)
  assert(OUTPUT_NAME_PATTERN.test(basename(output)), `output basename must be private-output-YYYYMMDD-HHMMSS: ${output}`)
  assert(!existsSync(output), `fresh output required; already exists: ${output}`)
  assertNoReparsePath(SCRIPT_ROOT)
  assertNoReparsePath(output, true)
  return output
}

function verifyNode() {
  assert(samePath(process.execPath, NODE_PIN.executable), `wrong Node executable: ${process.execPath}`)
  assert(process.version === NODE_PIN.version, `wrong Node version: ${process.version}; expected ${NODE_PIN.version}`)
  const metadata = statSync(process.execPath)
  assert(metadata.size === NODE_PIN.bytes, `Node byte count changed: ${metadata.size}`)
  const actual = fileSha256(process.execPath)
  assert(actual === NODE_PIN.sha256, `Node hash changed: expected ${NODE_PIN.sha256}, actual ${actual}`)
  return { ...NODE_PIN, sha256: actual }
}

function verifyGitHead() {
  const result = spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
    windowsHide: true,
  })
  if (result.error !== undefined) throw result.error
  assert(result.status === 0, `git rev-parse --read-only failed: ${(result.stderr ?? '').trim()}`)
  const head = String(result.stdout ?? '').trim()
  assert(head === EXPECTED_A_HEAD, `A HEAD changed: expected ${EXPECTED_A_HEAD}, actual ${head}`)
  return head
}

function verifyAllPins() {
  const node = verifyNode()
  const head = verifyGitHead()
  const files = FILE_PINS.map(pin => assertFilePin(pin, 'build input'))
  const references = REFERENCE_PINS.map(pin => assertFilePin(pin, 'reference input'))
  const trees = TREE_PINS.map(treePin)
  return { node, head, files, references, trees }
}

function ensureDirectory(target) {
  const output = resolve(SCRIPT_ROOT, argumentsOutput)
  if (!samePath(output, target)) assertInside(output, target, 'output directory')
  assert(!existsSync(target) || statSync(target).isDirectory(), `output path is not a directory: ${target}`)
  mkdirSync(target, { recursive: true })
  assertNoReparsePath(target)
}

let argumentsOutput

function writeNewText(target, text) {
  const output = resolve(SCRIPT_ROOT, argumentsOutput)
  assertInside(output, target, 'output file')
  ensureDirectory(dirname(target))
  assert(!existsSync(target), `refusing to overwrite output: ${target}`)
  writeFileSync(target, text, { encoding: 'utf8', flag: 'wx' })
}

function copyNewFile(source, target, expectedSha256, label) {
  const actual = fileSha256(source)
  assert(actual === expectedSha256, `${label} source hash changed: ${source}`)
  const output = resolve(SCRIPT_ROOT, argumentsOutput)
  assertInside(output, target, label)
  ensureDirectory(dirname(target))
  assert(!existsSync(target), `refusing to overwrite output: ${target}`)
  copyFileSync(source, target)
  assert(fileSha256(target) === expectedSha256, `${label} copy hash mismatch: ${target}`)
}

function packageOutput(id) {
  const value = OUTPUT_PACKAGES.find(candidate => candidate.id === id)
  if (value === undefined) fail(`unknown output package: ${id}`)
  return join(argumentsOutput, value.root)
}

function pinShaFor(path) {
  const pin = FILE_PINS.find(candidate => samePath(candidate.path, path))
  if (pin === undefined) fail(`no manifest pin for ${path}`)
  return pin.sha256
}

function copyPackageManifest(id) {
  const descriptor = OUTPUT_PACKAGES.find(candidate => candidate.id === id)
  assert(descriptor !== undefined, `unknown output package: ${id}`)
  copyNewFile(
    descriptor.manifestSource,
    join(argumentsOutput, descriptor.root, 'package.json'),
    pinShaFor(descriptor.manifestSource),
    `${id} package manifest`,
  )
}

async function loadContractsModule() {
  return import(pathToFileURL(CONTRACTS_SOURCE).href)
}

async function loadEsbuild() {
  const requireFromEsbuild = createRequire(join(ESBUILD_ROOT, 'package.json'))
  const resolved = requireFromEsbuild.resolve('esbuild')
  return import(pathToFileURL(resolved).href)
}

function runNodeCheck(label, argumentsList, cwd) {
  const environment = { ...process.env, NODE_OPTIONS: '' }
  const result = spawnSync(process.execPath, argumentsList, {
    cwd,
    env: environment,
    encoding: 'utf8',
    windowsHide: true,
  })
  if (result.error !== undefined) throw result.error
  assert(
    result.status === 0,
    `${label} failed with ${String(result.status)}: ${(result.stderr ?? '').split(/\r?\n/u).slice(0, 4).join(' ')}`,
  )
  return { stdout: String(result.stdout ?? ''), stderr: String(result.stderr ?? '') }
}

async function buildLawbenchPlugin(stamp) {
  const output = packageOutput(LAW_BENCH_PACKAGE_ID)
  const lib = join(output, 'lib')
  ensureDirectory(lib)
  copyNewFile(
    join(LAW_BENCH_ROOT, 'cordis.patch.yml'),
    join(output, 'cordis.patch.yml'),
    pinShaFor(join(LAW_BENCH_ROOT, 'cordis.patch.yml')),
    'lawbench cordis patch',
  )
  copyNewFile(
    join(LAW_BENCH_ROOT, 'persona.md'),
    join(output, 'persona.md'),
    pinShaFor(join(LAW_BENCH_ROOT, 'persona.md')),
    'lawbench persona',
  )
  copyPackageManifest(LAW_BENCH_PACKAGE_ID)

  const esbuild = await loadEsbuild()
  const contracts = await loadContractsModule()
  const boundContracts = contracts.loadContracts(CONTRACTS_SOURCE_DIR)
  const boundContractsSource = contracts.contractsModuleSource(CONTRACTS_SOURCE_DIR)
  assert(boundContracts.version === CONTRACTS_VERSION, `B contracts version changed: ${boundContracts.version}; expected ${CONTRACTS_VERSION}`)
  assert(
    boundContractsSource === `export default ${JSON.stringify(boundContracts)}`,
    'B contracts provenance source does not equal loadContracts(B contracts directory)',
  )
  const contractsPlugin = {
    name: 'lawbench-contracts-b-1.7',
    setup(build) {
      build.onResolve({ filter: /^lawbench:contracts$/ }, () => ({
        path: contracts.VIRTUAL_ID,
        namespace: 'lawbench',
      }))
      build.onLoad({ filter: /.*/, namespace: 'lawbench' }, () => ({
        contents: boundContractsSource,
        loader: 'js',
      }))
    },
  }
  const define = { __LAWBENCH_BUILD__: JSON.stringify(stamp) }
  const shared = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/*']

  const clientBuild = await esbuild.build({
    absWorkingDir: LAW_BENCH_ROOT,
    entryPoints: { client: 'ui/index.tsx' },
    outdir: lib,
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    external: shared,
    banner: {
      js: `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(LAW_BENCH_PACKAGE_ID)},\n  factory: (require) => {\n    var module = { exports: {} };\n    var exports = module.exports;`,
    },
    footer: { js: '    return module.exports;\n  }\n});' },
    plugins: [contractsPlugin],
    define,
    metafile: true,
    logLevel: 'silent',
  })

  const nodeBuilds = await esbuild.build({
    absWorkingDir: LAW_BENCH_ROOT,
    entryPoints: LAW_BENCH_NODE_ENTRIES,
    outdir: lib,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    sourcemap: false,
    legalComments: 'none',
    banner: {
      js: "import { createRequire as __lbCreateRequire } from 'node:module'; const require = __lbCreateRequire(import.meta.url);",
    },
    plugins: [contractsPlugin],
    define,
    metafile: true,
    logLevel: 'silent',
  })

  for (const name of LAW_BENCH_BUILD_FILES) {
    const artifact = join(lib, name)
    assert(existsSync(artifact), `lawbench build did not emit ${artifact}`)
    assert(statSync(artifact).size > 0, `lawbench build emitted an empty artifact: ${artifact}`)
  }

  for (const name of ['agent', 'host', 'credentials', 'session-store', 'index']) {
    const url = pathToFileURL(join(lib, `${name}.js`)).href
    runNodeCheck(
      `lawbench ESM import ${name}.js`,
      ['--input-type=module', '-e', `await import(${JSON.stringify(url)})`],
      LAW_BENCH_ROOT,
    )
  }

  const hostCheck = `const m = await import(${JSON.stringify(pathToFileURL(join(lib, 'host.js')).href)});
    const bad = [];
    for (const { method, params } of m.REMOTE_METHODS) {
      const fn = m.LawbenchRemote.prototype[method];
      const src = String(fn);
      const got = src.slice(src.indexOf('(') + 1, src.indexOf(')')).split(',').map(value => value.trim()).filter(Boolean);
      if (got.join() !== params.join()) bad.push(method + '(' + got.join() + ')');
    }
    if (bad.length) {
      console.error(bad.join(' '));
      process.exit(1);
    }`
  runNodeCheck('lawbench Host parameter-name check', ['--input-type=module', '-e', hostCheck], LAW_BENCH_ROOT)

  const clientText = readFileSync(join(lib, 'client.js'), 'utf8')
  const agentText = readFileSync(join(lib, 'agent.js'), 'utf8')
  assert(clientText.includes('window.__ModuleLoader__.load'), 'lawbench client module-loader banner is missing')
  assert(clientText.includes('conversationSubmission'), 'lawbench client lacks the T31 submission observer')
  assert(clientText.includes('requestScope'), 'lawbench client lacks the T31 requestScope path')
  assert(agentText.includes('requestIdFromMessages'), 'lawbench agent lacks native R extraction')
  assert(boundContractsSource.includes(`"version":"${CONTRACTS_VERSION}"`), 'B contracts 1.7 literal is absent from the bundle source')

  const inputs = new Set([
    ...Object.keys(clientBuild.metafile?.inputs ?? {}),
    ...Object.keys(nodeBuilds.metafile?.inputs ?? {}),
  ])
  const stale = [...inputs].filter(path => /(?:^|[\\/])dsh-ext[\\/]lib[\\/]/u.test(path))
  assert(stale.length === 0, `lawbench build consumed stale dsh-ext/lib inputs: ${stale.join(', ')}`)
  return {
    inputs: [...inputs].sort(),
    contracts: {
      directory: CONTRACTS_SOURCE_DIR,
      version: boundContracts.version,
      schemaIds: Object.keys(boundContracts.schemas).sort(),
    },
    checks: [
      'five Node entries imported as pure ESM',
      'Host generated method parameter names match REMOTE_METHODS',
      `embedded contracts came from ${CONTRACTS_SOURCE_DIR} at version ${CONTRACTS_VERSION}`,
      'B contracts loadContracts() and contractsModuleSource() provenance agree',
      'client contains conversationSubmission and requestScope',
      'agent contains requestIdFromMessages',
      'no dsh-ext/lib input entered either build',
    ],
  }
}

function tsdownOverrides(config, options) {
  return {
    ...config,
    cwd: options.cwd,
    tsconfig: options.tsconfig,
    outDir: options.outDir,
    config: false,
    clean: false,
    dts: false,
    exports: false,
    report: false,
    logLevel: 'silent',
    entry: options.entry,
  }
}

async function runTsdown(build, config, options, label) {
  const bundles = await build(tsdownOverrides(config, options))
  try {
    assert(bundles.length > 0, `${label} emitted no build bundle`)
    const moduleIds = new Set()
    const outputFiles = []
    for (const bundle of bundles) {
      for (const chunk of bundle.chunks) {
        outputFiles.push(join(chunk.outDir, chunk.fileName))
        if (chunk.type === 'chunk') {
          for (const moduleId of Object.keys(chunk.modules ?? {})) moduleIds.add(moduleId)
        }
      }
    }
    return {
      moduleIds: [...moduleIds].sort(),
      outputFiles: [...new Set(outputFiles)].sort(),
    }
  } finally {
    for (const bundle of bundles) await bundle[Symbol.asyncDispose]()
  }
}

function assertSourceModules(label, moduleIds, requiredSuffixes, forbiddenRoot) {
  const normalized = moduleIds.map(value => value.replaceAll('\\', '/').split('?', 1)[0])
  for (const suffix of requiredSuffixes) {
    assert(normalized.some(value => value.endsWith(suffix)), `${label} did not compile ${suffix}`)
  }
  const forbidden = normalized.filter(value => value.startsWith(forbiddenRoot.replaceAll('\\', '/') + '/lib/'))
  assert(forbidden.length === 0, `${label} consumed stale package lib: ${forbidden.join(', ')}`)
}

function assertMarker(path, marker) {
  const text = readFileSync(path, 'utf8')
  assert(text.includes(marker), `${path} lacks required marker ${JSON.stringify(marker)}`)
}

async function buildUiConversation(build) {
  const output = packageOutput(UI_CONVERSATION_PACKAGE_ID)
  const lib = join(output, 'lib')
  ensureDirectory(lib)
  copyPackageManifest(UI_CONVERSATION_PACKAGE_ID)

  const factory = (await import(pathToFileURL(join(UI_CONVERSATION_ROOT, 'tsdown.config.ts')).href)).default
  const configs = factory({ env: {} })
  const nodeConfig = configs.find(config => config.name === UI_CONVERSATION_PACKAGE_ID)
  const clientConfig = configs.find(config => config.name === `${UI_CONVERSATION_PACKAGE_ID}/client`)
  assert(nodeConfig !== undefined, 'ui-conversation source Node config is missing')
  assert(clientConfig !== undefined, 'ui-conversation source Client config is missing')

  const node = await runTsdown(build, nodeConfig, {
    cwd: UI_CONVERSATION_ROOT,
    tsconfig: join(UI_CONVERSATION_ROOT, 'tsconfig.host.json'),
    outDir: lib,
    entry: { index: join(UI_CONVERSATION_ROOT, 'src', 'index.ts') },
  }, 'ui-conversation source Node build')
  const client = await runTsdown(build, clientConfig, {
    cwd: UI_CONVERSATION_ROOT,
    tsconfig: join(UI_CONVERSATION_ROOT, 'tsconfig.client.json'),
    outDir: lib,
    entry: { client: join(UI_CONVERSATION_ROOT, 'src', 'client', 'index.ts') },
  }, 'ui-conversation current-source Client build')

  assertSourceModules(
    'ui-conversation',
    [...node.moduleIds, ...client.moduleIds],
    [
      '/ui-conversation/src/index.ts',
      '/ui-conversation/src/client/index.ts',
      '/ui-conversation/src/client/apply.ts',
      '/ui-conversation/src/client/service.ts',
    ],
    UI_CONVERSATION_ROOT,
  )
  assertMarker(join(lib, 'client.js'), UI_CONVERSATION_PACKAGE_ID)
  assertMarker(join(lib, 'client.js'), 'conversationSubmission')
  assertMarker(join(lib, 'client.js'), 'ctx.provide("conversationSubmission",')
  return {
    moduleIds: [...new Set([...node.moduleIds, ...client.moduleIds])].sort(),
    outputFiles: [...new Set([...node.outputFiles, ...client.outputFiles])].sort(),
    checks: [
      'current src/index.ts compiled for Node',
      'current src/client/index.ts compiled from source',
      'no ui-conversation lib input entered the private build',
      'client bundle registers @deepseek-ai/dsh-client-ui-conversation',
      'client bundle contains conversationSubmission',
    ],
  }
}

async function materializeSessionTypert(lib) {
  const analyzerModule = await import(pathToFileURL(TYPERT_ANALYZER_ENTRY).href)
  const clientAnalysis = new analyzerModule.WorkspaceAnalyzer({
    root: join(REPO_ROOT, 'dsh'),
    packages: [SESSION_CONTROLLER_PACKAGE_ID],
    faces: ['client'],
    checkDiagnostics: true,
    mode: 'check',
  }).analyze()
  assert(clientAnalysis.faces.length === 1, `session-controller Client analysis returned ${clientAnalysis.faces.length} faces, expected 1`)
  assert(clientAnalysis.faces[0].face === 'client', `unexpected analyzed Typert face: ${clientAnalysis.faces[0].face}`)
  assert(
    clientAnalysis.faces[0].packages.some(packageModel => packageModel.name === SESSION_CONTROLLER_PACKAGE_ID),
    `session-controller Client analysis did not return ${SESSION_CONTROLLER_PACKAGE_ID}`,
  )

  const generatorModule = await import(pathToFileURL(TYPERT_WORKSPACE_ENTRY).href)
  const generator = new generatorModule.WorkspaceTypertGenerator(
    join(REPO_ROOT, 'dsh'),
    { checkDiagnostics: true },
  )
  const artifacts = generator.generate([SESSION_CONTROLLER_PACKAGE_ID], ['host'])
  assert(artifacts.length === 1, `session-controller Typert generation returned ${artifacts.length} artifacts, expected 1`)
  const artifact = artifacts[0]
  assert(artifact.package === SESSION_CONTROLLER_PACKAGE_ID, `unexpected Typert package: ${artifact.package}`)
  assert(artifact.face === 'host', `unexpected Typert face: ${artifact.face}`)
  assert(artifact.remote !== undefined, 'session-controller Typert Remote artifact is missing')

  const paths = {
    hostJs: join(lib, 'typert.host.js'),
    hostDts: join(lib, 'typert.host.d.ts'),
    remoteJs: join(lib, 'typert.remote-client.js'),
    remoteDts: join(lib, 'typert.remote-client.d.ts'),
    remoteDtsMap: join(lib, 'typert.remote-client.d.ts.map'),
  }
  writeNewText(paths.hostJs, artifact.js)
  writeNewText(paths.hostDts, artifact.dts)
  writeNewText(paths.remoteJs, artifact.remote.js)
  writeNewText(paths.remoteDts, artifact.remote.dts)
  writeNewText(paths.remoteDtsMap, artifact.remote.dtsMap)

  assertMarker(paths.hostJs, SESSION_CONTROLLER_PACKAGE_ID)
  assertMarker(paths.hostJs, "face: 'host'")
  assertMarker(paths.remoteJs, SESSION_CONTROLLER_PACKAGE_ID)
  assertMarker(paths.remoteJs, 'session/prompt')
  return {
    package: artifact.package,
    face: artifact.face,
    outputs: SESSION_TYPERT_OUTPUTS,
    checks: [
      'WorkspaceAnalyzer checked the current Client source face with diagnostics enabled without emission',
      'exactly one Host FaceModel artifact was produced',
      'Host and Remote metadata name the same package',
      'generated Remote metadata includes session/prompt',
    ],
  }
}

async function buildSessionController(build) {
  const output = packageOutput(SESSION_CONTROLLER_PACKAGE_ID)
  const lib = join(output, 'lib')
  ensureDirectory(lib)
  copyPackageManifest(SESSION_CONTROLLER_PACKAGE_ID)

  const factory = (await import(pathToFileURL(join(SESSION_CONTROLLER_ROOT, 'tsdown.config.ts')).href)).default
  const configs = factory({ env: {} })
  const nodeConfig = configs.find(config => config.name === SESSION_CONTROLLER_PACKAGE_ID)
  const clientConfig = configs.find(config => config.name === `${SESSION_CONTROLLER_PACKAGE_ID}/client`)
  assert(nodeConfig !== undefined, 'session-controller source Node config is missing')
  assert(clientConfig !== undefined, 'session-controller source Client config is missing')

  const pluginModule = await import(pathToFileURL(TYPERT_PLUGIN_ENTRY).href)
  const repositoryTypertPlugin = pluginModule.typertPlugin({ mode: 'package', faces: ['host'] })
  const decoratorLoweringOnly = {
    name: 'lawbench-typert-decorator-lowering-only',
    transform(code, id) {
      return repositoryTypertPlugin.transform(code, id)
    },
  }
  const nodeConfigWithLowering = {
    ...nodeConfig,
    plugins: [...(nodeConfig.plugins ?? []), decoratorLoweringOnly],
  }

  const node = await runTsdown(build, nodeConfigWithLowering, {
    cwd: SESSION_CONTROLLER_ROOT,
    tsconfig: join(SESSION_CONTROLLER_ROOT, 'tsconfig.host.json'),
    outDir: lib,
    entry: { index: join(SESSION_CONTROLLER_ROOT, 'src', 'index.ts') },
  }, 'session-controller current-source Node build')

  const client = await runTsdown(build, clientConfig, {
    cwd: SESSION_CONTROLLER_ROOT,
    tsconfig: join(SESSION_CONTROLLER_ROOT, 'tsconfig.client.json'),
    outDir: lib,
    entry: { client: join(SESSION_CONTROLLER_ROOT, 'src', 'client', 'index.ts') },
  }, 'session-controller current-source Client build')

  const typeShims = await runTsdown(build, {
    name: `${SESSION_CONTROLLER_PACKAGE_ID}/types-runtime`,
    entry: {},
    outDir: join(lib, 'types'),
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    sourcemap: false,
    deps: nodeConfig.deps,
  }, {
    cwd: SESSION_CONTROLLER_ROOT,
    tsconfig: join(SESSION_CONTROLLER_ROOT, 'tsconfig.host.json'),
    outDir: join(lib, 'types'),
    entry: {
      types: join(SESSION_CONTROLLER_ROOT, 'src', 'types.ts'),
      'remote-events': join(SESSION_CONTROLLER_ROOT, 'src', 'remote-events.ts'),
    },
  }, 'session-controller browser-safe type-entry runtime build')

  const typert = await materializeSessionTypert(lib)
  const moduleIds = [...new Set([...node.moduleIds, ...client.moduleIds, ...typeShims.moduleIds])].sort()
  assertSourceModules(
    'session-controller',
    moduleIds,
    [
      '/session-controller/src/index.ts',
      '/session-controller/src/commands.ts',
      '/session-controller/src/client/index.ts',
      '/session-controller/src/client/sessions/session.ts',
      '/session-controller/src/types.ts',
    ],
    SESSION_CONTROLLER_ROOT,
  )
  assertMarker(join(lib, 'index.js'), 'agent/inbox/spliced')
  assertMarker(join(lib, 'index.js'), 'rpcId')
  assertMarker(join(lib, 'client.js'), SESSION_CONTROLLER_PACKAGE_ID)
  assertMarker(join(lib, 'client.js'), 'beginSubmission')
  return {
    moduleIds,
    outputFiles: [...new Set([...node.outputFiles, ...client.outputFiles, ...typeShims.outputFiles])].sort(),
    typert,
    checks: [
      'current src/index.ts compiled for Node with repository Typert decorator lowering',
      'current src/client/index.ts compiled from source',
      'current src/types.ts and remote-events.ts compiled for package subpath runtime',
      'no session-controller lib input entered the private build',
      'Node bundle contains claimed-inbox replay logic markers',
      'Client bundle contains native beginSubmission',
    ],
  }
}

function inventory(root) {
  return walkRegularFiles(root, 'all', 'private output').map(entry => ({
    path: entry.relative,
    bytes: entry.bytes,
    sha256: entry.sha256,
  }))
}

function assertExactOutputSet(output) {
  const actual = inventory(output).map(entry => entry.path)
  const expected = INTENDED_OUTPUTS.filter(path => path !== 'manifest.json').sort((a, b) =>
    Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')))
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `private output set differs from the explicit allowlist\n expected ${JSON.stringify(expected)}\n actual   ${JSON.stringify(actual)}`,
  )
  return inventory(output)
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  argumentsOutput = validateOutputTarget(args.output)

  assert(!process.env.NODE_OPTIONS, 'clear NODE_OPTIONS before the private build; the script must not inherit the T50 guard/resolver')
  assert(samePath(SCRIPT_ROOT, EVIDENCE_ROOT), `script is not running from its prepared evidence directory: ${SCRIPT_ROOT}`)

  process.env.NODE_ENV = 'production'
  process.env.LAWBENCH_BUILD_STAMP = args.stamp

  const verified = verifyAllPins()
  if (args.verifyOnly) { console.log(JSON.stringify({ status: "INPUT_PINS_VERIFIED_NO_BUILD", verified })); return }
  const buildModule = await import(pathToFileURL(TSDOWN_ENTRY).href)
  assert(typeof buildModule.build === 'function', 'installed tsdown does not export build()')

  ensureDirectory(argumentsOutput)
  ensureDirectory(join(argumentsOutput, OUTPUT_ROOT))

  const lawbench = await buildLawbenchPlugin(args.stamp)
  const uiConversation = await buildUiConversation(buildModule.build)
  const sessionController = await buildSessionController(buildModule.build)
  const outputs = assertExactOutputSet(argumentsOutput)

  const manifest = {
    format: 'WindowsPackageP1Repair1-private-runtime-build-v1',
    task: 'WindowsP1RootTarget-20261102-032101',
    generatedAt: new Date().toISOString(),
    status: 'SOURCE_BUILT_RUNTIME_NOT_EXERCISED',
    source: {
      head: verified.head,
      treeDigestAlgorithm: TREE_DIGEST_ALGORITHM,
      buildStamp: args.stamp,
      node: verified.node,
      contractsVersion: CONTRACTS_VERSION,
    },
    inputs: {
      files: verified.files,
      references: verified.references,
      trees: verified.trees,
    },
    sourceModules: {
      lawbench: lawbench.inputs,
      uiConversation: uiConversation.moduleIds,
      sessionController: sessionController.moduleIds,
    },
    contractsProvenance: lawbench.contracts,
    buildChecks: {
      lawbench: lawbench.checks,
      uiConversation: uiConversation.checks,
      sessionController: sessionController.checks,
      typert: sessionController.typert.checks,
    },
    outputs,
    closureThree: [
      'dsh-ext/agent/index.ts',
      'dsh-ext/agent/grounding-review.ts',
      'dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts',
    ],
    runtimeDelivery: {
      profilePackageRoot: '<RunRoot>/stage/app/resources/app.asar/dsh/node_modules',
      replacements: [
        'lawbench-dsh',
        '@deepseek-ai/dsh-client-ui-conversation',
        '@deepseek-ai/dsh-api-session-controller',
      ],
      appLaunchExecuted: false,
      installerExecuted: false,
    },
    claims: {
      buildExecutedByScript: true,
      sourceAndStaticChecksOnly: true,
      nativeModuleLoadedInProfile: false,
      prepareExecuted: false,
      appLaunchExecuted: false,
      installerExecuted: false,
      httpOrModelExecuted: false,
      allP1AcceptancePass: false,
    },
  }
  const manifestPath = join(argumentsOutput, 'manifest.json')
  writeNewText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const finalFiles = inventory(argumentsOutput)
  console.log(JSON.stringify({
    ok: true,
    output: argumentsOutput,
    manifest: manifestPath,
    fileCount: finalFiles.length,
    status: manifest.status,
  }, null, 2))
}

main().catch(error => {
  const output = argumentsOutput === undefined ? '(not created)' : argumentsOutput
  console.error(`Repair1 private build refused/failed: ${error instanceof Error ? error.message : String(error)}`)
  console.error(`output: ${output}`)
  process.exitCode = 1
})
