import { createHash } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { lstat, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import path from 'node:path'
import tls from 'node:tls'
import { fileURLToPath } from 'node:url'
import { types as utilTypes } from 'node:util'
import vm from 'node:vm'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const OWN_ROOT = path.dirname(SCRIPT_PATH)
const SOURCE_PATH = path.join(OWN_ROOT, 'native-pre-issue-check.mts')
const SOURCE_BASENAME = 'native-pre-issue-check.mts'
const EXPECTED_SOURCE_BYTES = 153_232
const EXPECTED_SOURCE_SHA256 = '86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536'
const PINNED_TYPESCRIPT_PATH = 'D:\\Lawbeach\\lawbench-A\\dsh\\node_modules\\typescript\\lib\\typescript.js'
const PINNED_TYPESCRIPT_BYTES = 9_144_216
const PINNED_TYPESCRIPT_SHA256 = '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39'
const ROOT_RECEIPT = 'ROOT_PREISSUE_SECTION_RECEIPT'
const TASK = 'B-T18-preissue-section-contract-20261029-204039'
const REQUIRED_CLI = ['--source', '--source-sha', '--result']
const TITLE_NAME = 'CANONICAL_DRAFT_TITLE'
const FUNCTION_NAME = 'assertDraftMachineChecks'
const require = createRequire(import.meta.url)

const processMetadata = Object.freeze({
  executable: process.execPath,
  pid: process.pid,
  startUtcEstimate: new Date(performance.timeOrigin).toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
})

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function parseCli(argv) {
  if (argv.length !== REQUIRED_CLI.length * 2) {
    throw new Error('usage: section-check-finite.mjs --source ABS --source-sha SHA256 --result ABS_JSON')
  }
  const values = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!REQUIRED_CLI.includes(key) || values.has(key) || !value) {
      throw new Error(`invalid or duplicate CLI option: ${key}`)
    }
    values.set(key, value)
  }
  for (const key of REQUIRED_CLI) {
    if (!values.has(key)) throw new Error(`missing CLI option: ${key}`)
  }
  const sourcePath = values.get('--source')
  const sourceSha = values.get('--source-sha').toLowerCase()
  const resultPath = values.get('--result')
  if (!path.isAbsolute(sourcePath) || !path.isAbsolute(resultPath)) {
    throw new Error('--source and --result must be absolute paths')
  }
  if (!/^[0-9a-f]{64}$/.test(sourceSha)) {
    throw new Error('--source-sha must be a lowercase or uppercase SHA-256')
  }
  return { sourcePath, sourceSha, resultPath }
}

function installProcessLocalNetworkDenial() {
  const attempts = []
  const originals = []
  const deny = api => (..._args) => {
    attempts.push({ api, atUtc: new Date().toISOString() })
    throw new Error(`process-local network access denied: ${api}`)
  }
  const replace = (owner, property, api) => {
    originals.push({ owner, property, value: owner[property] })
    owner[property] = deny(api)
  }

  replace(globalThis, 'fetch', 'fetch')
  replace(net.Socket.prototype, 'connect', 'net.Socket.connect')
  replace(net, 'connect', 'net.connect')
  replace(net, 'createConnection', 'net.createConnection')
  replace(http, 'request', 'http.request')
  replace(http, 'get', 'http.get')
  replace(https, 'request', 'https.request')
  replace(https, 'get', 'https.get')
  replace(tls, 'connect', 'tls.connect')
  replace(dns, 'lookup', 'dns.lookup')
  replace(dns, 'resolve', 'dns.resolve')
  replace(dns, 'resolve4', 'dns.resolve4')
  replace(dns, 'resolve6', 'dns.resolve6')
  replace(dns.promises, 'lookup', 'dns.promises.lookup')
  replace(dns.promises, 'resolve', 'dns.promises.resolve')

  return {
    attempts,
    restore() {
      for (const item of originals.reverse()) item.owner[item.property] = item.value
    },
  }
}

function waitForRootReceipt() {
  process.stdout.write(`${JSON.stringify({
    ready: ROOT_RECEIPT,
    processMetadata,
    waitsFor: `stdin line ${ROOT_RECEIPT}`,
  })}\n`)

  return new Promise((resolve, reject) => {
    let buffered = ''
    let settled = false
    const cleanup = () => {
      process.stdin.off('data', onData)
      process.stdin.off('end', onEnd)
      process.stdin.off('error', onError)
      process.stdin.pause()
    }
    const settle = (error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }
    const onData = chunk => {
      buffered += chunk.toString('utf8')
      const newline = buffered.indexOf('\n')
      if (newline < 0) return
      const line = buffered.slice(0, newline).replace(/\r$/, '')
      if (line !== ROOT_RECEIPT) {
        settle(new Error(`unexpected root receipt line: ${JSON.stringify(line)}`))
        return
      }
      settle()
    }
    const onEnd = () => settle(new Error('stdin ended before root receipt'))
    const onError = error => settle(error)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', onData)
    process.stdin.on('end', onEnd)
    process.stdin.on('error', onError)
    process.stdin.resume()
  })
}

async function assertOrdinaryExistingPath(absolutePath, expectedKind) {
  const parsed = path.parse(absolutePath)
  const relative = absolutePath.slice(parsed.root.length)
  let current = parsed.root
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    const stats = await lstat(current)
    const reparse = typeof stats.attributes === 'number'
      && (stats.attributes & fsConstants.FILE_ATTRIBUTE_REPARSE_POINT) !== 0
    if (stats.isSymbolicLink() || reparse) {
      throw new Error(`reparse or symbolic-link path component refused: ${current}`)
    }
    if (current === absolutePath) {
      if (expectedKind === 'directory' && !stats.isDirectory()) {
        throw new Error(`expected ordinary directory: ${absolutePath}`)
      }
      if (expectedKind === 'file' && !stats.isFile()) {
        throw new Error(`expected ordinary file: ${absolutePath}`)
      }
    }
  }
}

async function assertPaths(cli) {
  if (path.resolve(cli.sourcePath) !== path.resolve(SOURCE_PATH)) {
    throw new Error(`--source must be the exact own source path: ${SOURCE_PATH}`)
  }
  if (path.basename(SOURCE_PATH) !== SOURCE_BASENAME) {
    throw new Error('own source basename changed unexpectedly')
  }
  if (cli.sourceSha !== EXPECTED_SOURCE_SHA256) {
    throw new Error(`--source-sha does not match ROOT identity: ${EXPECTED_SOURCE_SHA256}`)
  }
  if (path.dirname(path.resolve(cli.resultPath)) !== path.resolve(OWN_ROOT)) {
    throw new Error(`--result must be directly under own evidence root: ${OWN_ROOT}`)
  }
  if (path.extname(cli.resultPath).toLowerCase() !== '.json') {
    throw new Error('--result must be a JSON file')
  }
  if (path.resolve(cli.resultPath) === path.resolve(SOURCE_PATH)) {
    throw new Error('--result must not equal --source')
  }

  await assertOrdinaryExistingPath(OWN_ROOT, 'directory')
  await assertOrdinaryExistingPath(SOURCE_PATH, 'file')
  try {
    await lstat(cli.resultPath)
    throw new Error(`--result already exists; no overwrite is allowed: ${cli.resultPath}`)
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error
  }
}

function extractOnlyScopedBindings(sourcePath, sourceText, ts) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const titleMatches = []
  const functionMatches = []

  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      const declarations = statement.declarationList.declarations
      if (declarations.length === 1) {
        const declaration = declarations[0]
        if (
          ts.isIdentifier(declaration.name)
          && declaration.name.text === TITLE_NAME
          && declaration.initializer
          && ts.isStringLiteralLike(declaration.initializer)
        ) {
          titleMatches.push(statement.getText(sourceFile))
        }
      }
    }
    if (
      ts.isFunctionDeclaration(statement)
      && statement.name
      && statement.name.text === FUNCTION_NAME
    ) {
      functionMatches.push(statement.getText(sourceFile))
    }
  }

  if (titleMatches.length !== 1) {
    throw new Error(`expected exactly one ${TITLE_NAME} declaration, found ${titleMatches.length}`)
  }
  if (functionMatches.length !== 1) {
    throw new Error(`expected exactly one ${FUNCTION_NAME} declaration, found ${functionMatches.length}`)
  }
  return {
    titleSnippet: titleMatches[0],
    functionSnippet: functionMatches[0],
  }
}

function instantiatePrivateVmBindings(ts, titleSnippet, functionSnippet, label) {
  const scopedSource = `${titleSnippet}\n\n${functionSnippet}`
  const transpiled = ts.transpileModule(scopedSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
      sourceMap: false,
      removeComments: false,
      newLine: ts.NewLineKind.LineFeed,
    },
    fileName: `${label}.ts`,
  }).outputText
  const context = vm.createContext(Object.create(null), { name: label })
  const script = new vm.Script(transpiled, {
    filename: `${label}.generated.js`,
    displayErrors: true,
  })
  script.runInContext(context)
  const bindings = new vm.Script(
    `({ title: ${TITLE_NAME}, check: ${FUNCTION_NAME} })`,
    { filename: `${label}.binding-read.js` },
  ).runInContext(context)
  if (typeof bindings.title !== 'string' || typeof bindings.check !== 'function') {
    throw new Error(`${label} did not expose the two scoped bindings`)
  }
  if (bindings.check.name !== FUNCTION_NAME) {
    throw new Error(`${label} function name changed unexpectedly`)
  }
  return bindings
}

const HEADINGS = Object.freeze({
  conclusion: '一、总体结论：',
  problems: '二、问题清单',
  supplements: '三、待补充项汇总',
  authorities: '四、需律师核实的法律依据清单',
  passed: '五、已通过的检查项',
})

const TABLE = [
  '| 序号 | 位置 | 说明 |',
  '| --- | --- | --- |',
  '| 占位 | 占位 | 占位 |',
].join('\n')

function exactFive() {
  return [
    HEADINGS.conclusion,
    '结论占位。',
    '',
    HEADINGS.problems,
    TABLE,
    '',
    HEADINGS.supplements,
    '补充项占位。',
    '',
    HEADINGS.authorities,
    '依据项占位。',
    '',
    HEADINGS.passed,
    '通过项占位。',
  ].join('\n')
}

function withSupplementarySection() {
  return `${exactFive()}\n\n六、未核对的出处\n出处占位。`
}

function withInnerNumberedItem() {
  return exactFive().replace(
    `${HEADINGS.passed}\n通过项占位。`,
    `${HEADINGS.passed}\n六、检查项占位\n检查项占位。`,
  )
}

function missingRequiredHeading() {
  return exactFive().replace(
    `${HEADINGS.authorities}\n依据项占位。`,
    '六、未核对的出处\n依据项占位。',
  )
}

function wrongOrder() {
  return [
    HEADINGS.conclusion,
    '结论占位。',
    '',
    HEADINGS.supplements,
    '补充项占位。',
    '',
    HEADINGS.problems,
    TABLE,
    '',
    HEADINGS.authorities,
    '依据项占位。',
    '',
    HEADINGS.passed,
    '通过项占位。',
  ].join('\n')
}

function emptyRequiredSection() {
  return exactFive().replace(
    `${HEADINGS.supplements}\n补充项占位。\n\n${HEADINGS.authorities}`,
    `${HEADINGS.supplements}\n\n${HEADINGS.authorities}`,
  )
}

function missingTable() {
  return exactFive().replace(`${TABLE}\n\n`, '')
}

function captureNativeFailure(check, title, text, expectedFailedKeys) {
  let thrown
  try {
    check(title, text)
  } catch (error) {
    thrown = error
  }
  if (!utilTypes.isNativeError(thrown)) {
    throw new Error(`negative control did not throw a native cross-VM Error: ${expectedFailedKeys.join(',')}`)
  }
  const summary = {
    name: String(thrown.name),
    message: String(thrown.message),
  }
  const expectedMessage = `pre-issue output machine checks failed: ${expectedFailedKeys.join(',')}`
  if (summary.message !== expectedMessage) {
    throw new Error(
      `negative control failed for unexpected reason: expected=${JSON.stringify(expectedMessage)} actual=${JSON.stringify(summary.message)}`,
    )
  }
  return summary
}

function runMeaningfulCases(actual) {
  const cases = []

  const passCase = (name, title, text) => {
    const checks = actual.check(title, text)
    const allTrue = Object.values(checks).every(value => value === true)
    if (!allTrue) throw new Error(`${name}: pinned source function returned a false check`)
    cases.push({
      name,
      expected: 'PASS',
      passed: true,
      actual: checks,
      executedFunctionNames: [actual.check.name],
    })
  }

  const failCase = (name, title, text, expectedFailedKeys) => {
    const actualError = captureNativeFailure(actual.check, title, text, expectedFailedKeys)
    cases.push({
      name,
      expected: 'FAIL',
      passed: true,
      expectedFailedKeys,
      actualError,
      executedFunctionNames: [actual.check.name],
    })
  }

  passCase('original-exact-five', actual.title, exactFive())
  passCase('supplementary-section-permitted', actual.title, withSupplementarySection())
  passCase('inner-numbered-check-item-permitted', actual.title, withInnerNumberedItem())
  failCase(
    'missing-required-heading',
    actual.title,
    missingRequiredHeading(),
    ['hasFivePrimaryHeadings', 'hasFiveSectionsInOrder', 'hasFiveNonemptySections'],
  )
  failCase(
    'wrong-primary-order',
    actual.title,
    wrongOrder(),
    ['hasFiveSectionsInOrder', 'hasFiveNonemptySections'],
  )
  failCase(
    'empty-required-section',
    actual.title,
    emptyRequiredSection(),
    ['hasFiveNonemptySections'],
  )
  failCase(
    'wrong-title',
    '错误标题占位',
    exactFive(),
    ['hasExactReviewTitle'],
  )
  failCase(
    'missing-table',
    actual.title,
    missingTable(),
    ['hasProblemListTable'],
  )
  return cases
}

function runControlledOldControls(oldVariant) {
  const controls = [
    ['old-predicate-rejects-supplementary-section', withSupplementarySection()],
    ['old-predicate-rejects-inner-numbered-item', withInnerNumberedItem()],
  ]
  return controls.map(([name, text]) => {
    const actualError = captureNativeFailure(
      oldVariant.check,
      oldVariant.title,
      text,
      ['hasExactlyFiveNumberedSections'],
    )
    return {
      name,
      controlledUnitOnly: true,
      expected: 'FAIL',
      passed: true,
      expectedFailedKeys: ['hasExactlyFiveNumberedSections'],
      actualError,
      executedFunctionNames: [`${oldVariant.check.name} [controlled-old-variant]`],
    }
  })
}

async function main() {
  const cli = parseCli(process.argv.slice(2))
  const network = installProcessLocalNetworkDenial()
  try {
    await waitForRootReceipt()
    await assertPaths(cli)

    const typescriptBytes = await readFile(PINNED_TYPESCRIPT_PATH)
    const typescriptSha = sha256(typescriptBytes)
    if (
      typescriptBytes.length !== PINNED_TYPESCRIPT_BYTES
      || typescriptSha !== PINNED_TYPESCRIPT_SHA256
    ) {
      throw new Error(
        `pinned TypeScript identity mismatch: bytes=${typescriptBytes.length} sha256=${typescriptSha}`,
      )
    }

    const ts = require(PINNED_TYPESCRIPT_PATH)
    const sourceBytesBefore = await readFile(SOURCE_PATH)
    const sourceShaBefore = sha256(sourceBytesBefore)
    if (
      sourceBytesBefore.length !== EXPECTED_SOURCE_BYTES
      || sourceShaBefore !== EXPECTED_SOURCE_SHA256
    ) {
      throw new Error(
        `source identity mismatch: bytes=${sourceBytesBefore.length} sha256=${sourceShaBefore}`,
      )
    }

    const sourceText = sourceBytesBefore.toString('utf8')
    const scoped = extractOnlyScopedBindings(SOURCE_PATH, sourceText, ts)
    const actual = instantiatePrivateVmBindings(
      ts,
      scoped.titleSnippet,
      scoped.functionSnippet,
      'preissue-section-actual',
    )
    const oldFunctionSnippet = scoped.functionSnippet.replace(
      'numberedSections.length >= 5',
      'numberedSections.length === 5',
    )
    if (
      oldFunctionSnippet === scoped.functionSnippet
      || (oldFunctionSnippet.match(/numberedSections\.length === 5/g) ?? []).length !== 1
    ) {
      throw new Error('controlled-old variant could not invert exactly one predicate')
    }
    const oldVariant = instantiatePrivateVmBindings(
      ts,
      scoped.titleSnippet,
      oldFunctionSnippet,
      'preissue-section-controlled-old',
    )

    const meaningfulCases = runMeaningfulCases(actual)
    const controlledOldRedControls = runControlledOldControls(oldVariant)
    if (meaningfulCases.length !== 8 || !meaningfulCases.every(item => item.passed)) {
      throw new Error('not all eight meaningful finite cases passed their own contract')
    }
    if (controlledOldRedControls.length !== 2 || !controlledOldRedControls.every(item => item.passed)) {
      throw new Error('not both controlled-old red controls behaved as specified')
    }

    const sourceBytesAfter = await readFile(SOURCE_PATH)
    const sourceShaAfter = sha256(sourceBytesAfter)
    if (
      sourceBytesAfter.length !== sourceBytesBefore.length
      || sourceShaAfter !== sourceShaBefore
    ) {
      throw new Error('source bytes changed during finite execution')
    }
    if (network.attempts.length !== 0) {
      throw new Error(`process-local network attempts were observed: ${network.attempts.length}`)
    }

    const report = {
      format: 'lawbench-t18-preissue-section-contract-finite-report-v1',
      task: TASK,
      status: 'SECTION_CONTRACT_FINITE_PASS',
      verdict: 'SECTION_CONTRACT_FINITE_PASS',
      scope: 'source-only-controlled-unit:two-extracted-bindings-only',
      fullConsumerVerdict: 'NOT_ASSESSED',
      businessVerdict: 'NOT_ASSESSED',
      artifactMetadata: {
        generatedAtUtc: new Date().toISOString(),
        scriptPath: SCRIPT_PATH,
        sourcePath: SOURCE_PATH,
        resultPath: cli.resultPath,
        syntheticPlaceholdersOnly: true,
        realCaseMaterialUsed: false,
        historyOrEventsRecorded: false,
        nativeIdentifiersRecorded: false,
      },
      sourceIdentity: {
        path: SOURCE_PATH,
        expectedBytes: EXPECTED_SOURCE_BYTES,
        expectedSha256: EXPECTED_SOURCE_SHA256,
        bytesBefore: sourceBytesBefore.length,
        sha256Before: sourceShaBefore,
        bytesAfter: sourceBytesAfter.length,
        sha256After: sourceShaAfter,
        heldBeforeAfter: true,
      },
      pinnedTypescript: {
        path: PINNED_TYPESCRIPT_PATH,
        expectedBytes: PINNED_TYPESCRIPT_BYTES,
        expectedSha256: PINNED_TYPESCRIPT_SHA256,
        observedBytes: typescriptBytes.length,
        observedSha256: typescriptSha,
        loadedAfterRootReceipt: true,
      },
      rootReceipt: {
        expected: ROOT_RECEIPT,
        received: ROOT_RECEIPT,
        receivedBeforeTypeScriptLoadAstAndVm: true,
      },
      processMetadata,
      extraction: {
        titleBindingsExtracted: 1,
        functionBindingsExtracted: 1,
        executedBindingNames: [TITLE_NAME, FUNCTION_NAME],
        otherTopLevelConsumerCodeExecuted: false,
      },
      actualFunctionNames: [actual.check.name],
      meaningfulCaseCount: meaningfulCases.length,
      meaningfulCases,
      controlledOldRedControlCount: controlledOldRedControls.length,
      controlledOldRedControls,
      summary: {
        passedMeaningfulCases: meaningfulCases.filter(item => item.passed).length,
        passedControlledOldRedControls: controlledOldRedControls.filter(item => item.passed).length,
        oldPredicateVariantUsedOnlyForExplicitRedControls: true,
      },
      networkAttempts: {
        scope: 'process-local-instrumentation-only',
        wholeMachineZeroNetworkClaimed: false,
        instrumentedApis: [
          'fetch',
          'net.Socket.connect',
          'net.connect',
          'net.createConnection',
          'http.request',
          'http.get',
          'https.request',
          'https.get',
          'tls.connect',
          'dns.lookup',
          'dns.resolve',
          'dns.resolve4',
          'dns.resolve6',
          'dns.promises.lookup',
          'dns.promises.resolve',
        ],
        observed: network.attempts,
        count: network.attempts.length,
      },
    }
    await writeFile(cli.resultPath, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    })
  } finally {
    network.restore()
  }
}

main().catch(error => {
  const summary = utilTypes.isNativeError(error)
    ? { name: String(error.name), message: String(error.message) }
    : { name: 'NonNativeError', message: String(error) }
  process.stderr.write(`${JSON.stringify({ finiteStatus: 'FAILED', error: summary })}\n`)
  process.exitCode = 1
})
