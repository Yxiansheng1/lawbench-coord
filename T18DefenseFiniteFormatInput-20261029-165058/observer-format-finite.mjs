/**
 * T18 observer-contract finite source observer.
 *
 * AUTHORED_NOT_RUN by the B line. Root alone may execute this file after
 * source review. It compares the actual assertDraftMachineChecks functions
 * extracted from the pinned BEFORE and repaired CURRENT consumer sources.
 * It does not import or execute the consumer, Agent, Session, provider, SDK,
 * HTTP service, model, or product workflow.
 */

import { createHash } from 'node:crypto'
import { readFileSync, lstatSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import vm from 'node:vm'

const FORMAT = 'lawbench-t18-observer-format-finite-v1'
const RECEIPT = 'ROOT_OBSERVER_RECEIPT'
const WATCHDOG_MS = 86_400_000
const TYPESCRIPT_PATH =
  'D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'
const TYPESCRIPT_SHA256 =
  '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39'
const BEFORE_SOURCE_PATH =
  'D:/Lawbeach/lawbench-coord/T18DefenseObserverContractInput-20261029-162518/native-defense-opinion.mts'
const BEFORE_SOURCE_SHA256 =
  '76c73e0fbf32b1d4e5da936df6b4e226a71e46e27a30d2bd24bb947e6f758f67'
const CURRENT_SOURCE_PATH =
  'D:/Lawbeach/lawbench-B/docs/plan/evidence/T18/DefenseOpinionNative-20261029-155352/native-defense-opinion.mts'
const CURRENT_SOURCE_SHA256 =
  '31622e39fd11629ede25ab78b41af7fa7d43703d223681595ca00b26de2bbeb3'
const OBSERVER_PATH = realpathSync(new URL(import.meta.url))
const REQUIRED_ARGUMENTS = new Set([
  '--before',
  '--before-sha',
  '--current',
  '--current-sha',
  '--result',
])

const networkAttempts = []
const networkPatches = []

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function utcNow() {
  return new Date().toISOString()
}

function pathKey(path) {
  return resolve(path).toLocaleLowerCase('en-US')
}

function ordinaryFile(path) {
  const info = lstatSync(path)
  return info.isFile() && !info.isSymbolicLink()
}

function readPinnedFile(path, expectedSha256, label) {
  if (!isAbsolute(path) || !ordinaryFile(path)) {
    throw new Error(`${label} must be an ordinary absolute file`)
  }
  const bytes = readFileSync(path)
  const actualSha256 = sha256Bytes(bytes)
  if (actualSha256 !== expectedSha256) {
    throw new Error(`${label} SHA-256 changed`)
  }
  return {
    path: realpathSync(path),
    bytes: bytes.byteLength,
    sha256: actualSha256,
    text: bytes.toString('utf8'),
  }
}

function parseArguments(argv) {
  const values = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === undefined || value === undefined || !REQUIRED_ARGUMENTS.has(flag)) {
      throw new Error(
        'usage: observer-format-finite.mjs --before <pinned-mts> '
        + '--before-sha <sha256> --current <repaired-mts> '
        + '--current-sha <sha256> --result <new-root-owned-json>',
      )
    }
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`)
    values.set(flag, value)
  }
  if (values.size !== REQUIRED_ARGUMENTS.size) {
    throw new Error('all five observer arguments are required')
  }
  return {
    before: values.get('--before'),
    beforeSha: values.get('--before-sha').toLowerCase(),
    current: values.get('--current'),
    currentSha: values.get('--current-sha').toLowerCase(),
    result: values.get('--result'),
  }
}

function validateArguments(args) {
  if (
    pathKey(args.before) !== pathKey(BEFORE_SOURCE_PATH)
    || pathKey(args.current) !== pathKey(CURRENT_SOURCE_PATH)
  ) {
    throw new Error('observer source paths are outside the two pinned MTS files')
  }
  if (args.beforeSha !== BEFORE_SOURCE_SHA256) {
    throw new Error('BEFORE SHA-256 is not the pinned source identity')
  }
  if (args.currentSha !== CURRENT_SOURCE_SHA256) {
    throw new Error('CURRENT SHA-256 is not the repaired source identity')
  }
  if (
    !isAbsolute(args.result)
    || extname(args.result).toLocaleLowerCase('en-US') !== '.json'
  ) {
    throw new Error('result must be a new absolute JSON path')
  }
  const resultPath = resolve(args.result)
  try {
    lstatSync(resultPath)
    throw new Error('result path already exists')
  } catch (error) {
    if (error instanceof Error && error.message === 'result path already exists') throw error
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) throw error
  }
  const parent = lstatSync(dirname(resultPath))
  if (!parent.isDirectory() || parent.isSymbolicLink()) {
    throw new Error('result parent must be an ordinary existing directory')
  }
  return resultPath
}

function installNetworkDenials() {
  const recordDenial = (kind) => () => {
    networkAttempts.push({ kind, atUtc: utcNow() })
    throw new Error(`process-local network denial: ${kind}`)
  }
  const replace = (target, property, kind) => {
    const denied = recordDenial(kind)
    target[property] = denied
    if (target[property] !== denied) {
      throw new Error(`could not install process-local denial: ${kind}`)
    }
    networkPatches.push(kind)
  }

  const require = createRequire(import.meta.url)
  const http = require('node:http')
  const https = require('node:https')
  const net = require('node:net')
  const tls = require('node:tls')
  const dgram = require('node:dgram')
  replace(http, 'request', 'http.request')
  replace(http, 'get', 'http.get')
  replace(https, 'request', 'https.request')
  replace(https, 'get', 'https.get')
  replace(net, 'connect', 'net.connect')
  replace(net, 'createConnection', 'net.createConnection')
  replace(tls, 'connect', 'tls.connect')
  replace(dgram, 'createSocket', 'dgram.createSocket')
  replace(globalThis, 'fetch', 'globalThis.fetch')
  replace(globalThis, 'WebSocket', 'globalThis.WebSocket')
}

function findVariableStatement(sourceFile, ts, name, required) {
  const matches = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        matches.push(statement.getText(sourceFile))
      }
    }
  }
  if (matches.length > 1 || (required && matches.length !== 1)) {
    throw new Error(`expected exactly one actual ${name} declaration`)
  }
  return matches[0]
}

function findFunctionDeclaration(sourceFile, ts, name) {
  const matches = []
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement)
      && statement.name?.text === name
    ) {
      matches.push(statement.getText(sourceFile))
    }
  }
  if (matches.length !== 1) {
    throw new Error(`expected exactly one actual ${name} function`)
  }
  return matches[0]
}

function extractActualFragments(ts, path, text, includeTemplateElements) {
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const draftTitles = findVariableStatement(sourceFile, ts, 'DRAFT_TITLES', true)
  const canonicalTitle = findVariableStatement(
    sourceFile,
    ts,
    'CANONICAL_DRAFT_TITLE',
    true,
  )
  const templateElements = findVariableStatement(
    sourceFile,
    ts,
    'REQUIRED_TEMPLATE_ELEMENTS',
    includeTemplateElements,
  )
  const machineChecks = findFunctionDeclaration(
    sourceFile,
    ts,
    'assertDraftMachineChecks',
  )
  return {
    draftTitles,
    canonicalTitle,
    templateElements,
    machineChecks,
  }
}

function instantiateFragments(ts, sourcePath, fragments) {
  const exportNames = ['DRAFT_TITLES', 'CANONICAL_DRAFT_TITLE']
  const declarations = [fragments.draftTitles, fragments.canonicalTitle]
  if (fragments.templateElements !== undefined) {
    declarations.push(fragments.templateElements)
    exportNames.push('REQUIRED_TEMPLATE_ELEMENTS')
  }
  declarations.push(fragments.machineChecks)
  exportNames.push('assertDraftMachineChecks')
  const fragmentSource = `${declarations.join('\n\n')}

module.exports = { ${exportNames.join(', ')} };
`
  const transpiled = ts.transpileModule(fragmentSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    },
    fileName: sourcePath,
  })
  const moduleRecord = { exports: {} }
  const context = vm.createContext({
    module: moduleRecord,
    exports: moduleRecord.exports,
  })
  vm.runInContext(transpiled.outputText, context, { filename: sourcePath })
  const api = moduleRecord.exports
  if (typeof api.assertDraftMachineChecks !== 'function') {
    throw new Error('extracted assertDraftMachineChecks is not callable')
  }
  return {
    api,
    transpiledSha256: sha256Bytes(Buffer.from(transpiled.outputText, 'utf8')),
    executedNames: [
      'DRAFT_TITLES',
      'CANONICAL_DRAFT_TITLE',
      ...(fragments.templateElements === undefined
        ? []
        : ['REQUIRED_TEMPLATE_ELEMENTS']),
      'assertDraftMachineChecks',
    ],
  }
}

function runDraftCheck(api, title, text) {
  try {
    return {
      outcome: 'accepted',
      checks: api.assertDraftMachineChecks(title, text),
    }
  } catch (error) {
    return {
      outcome: 'rejected',
      error: error !== null && typeof error === 'object' && typeof error.message === 'string' ? error.message : String(error),
    }
  }
}

function currentControls() {
  return [
    {
      id: 'positive-single-citation',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n事实依据见〔起诉意见书 第2行〕。',
      expected: 'accepted',
    },
    {
      id: 'positive-range-citation-and-second-title',
      title: '辩护词',
      text: '辩护词\n法律依据待律师核实。\n事实依据见〔讯问笔录 第2-4行〕。',
      expected: 'accepted',
    },
    {
      id: 'positive-compound-citation',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n事实依据见〔起诉意见书 第2行、讯问笔录 第4行〕。',
      expected: 'accepted',
    },
    {
      id: 'positive-alternate-layout',
      title: '辩护词',
      text: '本案按事实与证据展开辩护。法律依据待律师核实，材料位置为〔起诉意见书 第3-5行〕。',
      expected: 'accepted',
    },
    {
      id: 'negative-wrong-title',
      title: '辩护意见书',
      text: '辩护意见书\n法律依据待律师核实。\n〔起诉意见书 第2行〕。',
      expected: 'rejected',
      expectedFailure: 'hasPrimaryDraftTitle',
    },
    {
      id: 'negative-missing-legal-marker',
      title: '辩护意见',
      text: '辩护意见\n〔起诉意见书 第2行〕。',
      expected: 'rejected',
      expectedFailure: 'hasLegalVerificationPlaceholder',
    },
    {
      id: 'negative-unknown-material',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n〔情况说明 第2行〕。',
      expected: 'rejected',
      expectedFailure: 'hasOriginalLineCitation',
    },
    {
      id: 'negative-upstream-as-citation',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n〔刑事阅卷笔录 第2行〕。',
      expected: 'rejected',
      expectedFailure: 'hasOriginalLineCitation',
    },
    {
      id: 'negative-page-units',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n〔起诉意见书 第2页〕。',
      expected: 'rejected',
      expectedFailure: 'hasOriginalLineCitation',
    },
    {
      id: 'negative-no-formatted-citation',
      title: '辩护意见',
      text: '辩护意见\n法律依据待律师核实。\n依据起诉意见书第2行。',
      expected: 'rejected',
      expectedFailure: 'hasOriginalLineCitation',
    },
    {
      id: 'negative-test-note-contamination',
      title: '辩护意见',
      text: '辩护意见\n以下为测试说明。\n法律依据待律师核实。\n〔起诉意见书 第2行〕。',
      expected: 'rejected',
      expectedFailure: 'hasDraftOnlyBody',
    },
    {
      id: 'negative-blank-body',
      title: '辩护意见',
      text: '   ',
      expected: 'rejected',
      expectedFailure: 'hasOriginalLineCitation',
    },
  ]
}

function executeCurrentControls(api) {
  return currentControls().map((control) => {
    const observed = runDraftCheck(api, control.title, control.text)
    const expectedFailurePresent =
      control.expected !== 'rejected'
      || (observed.error ?? '').includes(control.expectedFailure)
    return {
      id: control.id,
      title: control.title,
      bodySha256: sha256Bytes(Buffer.from(control.text, 'utf8')),
      expected: control.expected,
      ...(control.expectedFailure === undefined
        ? {}
        : { expectedFailure: control.expectedFailure }),
      observed,
      passed: observed.outcome === control.expected && expectedFailurePresent,
    }
  })
}

function executeOldRejections(oldApi) {
  const alternativeLayout = runDraftCheck(
    oldApi,
    '辩护意见',
    '本案围绕事实和证据展开辩护。法律依据待律师核实。'
    + '〔起诉意见书 第2行〕载明相关事实。',
  )
  const alternativeError = alternativeLayout.error ?? ''
  const compoundOnly = runDraftCheck(
    oldApi,
    '辩护意见',
    '辩护人：张某\n'
    + '一、事实认定部分。\n'
    + '二、证据采信部分。\n'
    + '三、法律适用部分。\n'
    + '此致\n'
    + '法律依据待律师核实。\n'
    + '〔起诉意见书 第2行、讯问笔录 第4行〕',
  )
  const compoundError = compoundOnly.error ?? ''
  return [
    {
      id: 'old-unsupported-literal-layout',
      primaryFinding: true,
      bodySha256: sha256Bytes(Buffer.from(
        '本案围绕事实和证据展开辩护。法律依据待律师核实。'
        + '〔起诉意见书 第2行〕载明相关事实。',
        'utf8',
      )),
      observed: alternativeLayout,
      rejectionConfirmed:
        alternativeLayout.outcome === 'rejected'
        && alternativeError.includes('hasAllRequiredTemplateElements')
        && alternativeError.includes('hasDefensePointHeadings'),
    },
    {
      id: 'old-compound-citation-rejection',
      primaryFinding: true,
      bodySha256: sha256Bytes(Buffer.from(
        '辩护人：张某\n'
        + '一、事实认定部分。\n'
        + '二、证据采信部分。\n'
        + '三、法律适用部分。\n'
        + '此致\n'
        + '法律依据待律师核实。\n'
        + '〔起诉意见书 第2行、讯问笔录 第4行〕',
        'utf8',
      )),
      observed: compoundOnly,
      rejectionConfirmed:
        compoundOnly.outcome === 'rejected'
        && compoundError === 'draft machine checks failed: hasOriginalLineCitation',
    },
  ]
}

function waitForReceipt() {
  return new Promise((resolveReceipt, rejectReceipt) => {
    let buffered = ''
    const finish = (callback, value) => {
      clearTimeout(timer)
      process.stdin.off('data', onData)
      process.stdin.off('end', onEnd)
      process.stdin.pause()
      callback(value)
    }
    const onData = (chunk) => {
      buffered += chunk
      const newline = buffered.indexOf('\n')
      if (newline < 0) return
      finish(resolveReceipt, buffered.slice(0, newline).replace(/\r$/, ''))
    }
    const onEnd = () => {
      finish(rejectReceipt, new Error('stdin ended before the ROOT receipt'))
    }
    const timer = setTimeout(() => {
      finish(
        rejectReceipt,
        new Error('ROOT receipt watchdog expired after 86400 seconds'),
      )
    }, WATCHDOG_MS)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', onData)
    process.stdin.on('end', onEnd)
    process.stdin.resume()
  })
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  const resultPath = validateArguments(args)
  const typescriptFile = readPinnedFile(
    TYPESCRIPT_PATH,
    TYPESCRIPT_SHA256,
    'TypeScript compiler',
  )
  const beforeFile = readPinnedFile(
    args.before,
    BEFORE_SOURCE_SHA256,
    'BEFORE consumer',
  )
  const currentFile = readPinnedFile(
    args.current,
    CURRENT_SOURCE_SHA256,
    'CURRENT consumer',
  )

  const require = createRequire(import.meta.url)
  const ts = require(realpathSync(TYPESCRIPT_PATH))
  if (typescriptFile.sha256 !== TYPESCRIPT_SHA256) {
    throw new Error('TypeScript executable identity changed before loading')
  }
  installNetworkDenials()

  const oldFragments = extractActualFragments(
    ts,
    beforeFile.path,
    beforeFile.text,
    true,
  )
  const currentFragments = extractActualFragments(
    ts,
    currentFile.path,
    currentFile.text,
    false,
  )
  const oldInstance = instantiateFragments(ts, beforeFile.path, oldFragments)
  const currentInstance = instantiateFragments(
    ts,
    currentFile.path,
    currentFragments,
  )
  const oldRejections = executeOldRejections(oldInstance.api)
  const controls = executeCurrentControls(currentInstance.api)
  const allControlsPass = (
    controls.length === 12
    && controls.filter(control => control.passed).length === 12
    && oldRejections.length === 2
    && oldRejections.every(rejection => rejection.rejectionConfirmed)
  )
  const pass = allControlsPass && networkAttempts.length === 0
  const observerBytes = readFileSync(OBSERVER_PATH)
  const result = {
    format: FORMAT,
    authoredBy: 'B',
    sourceRuntime: true,
    authorRuntime: 0,
    executedAtUtc: utcNow(),
    process: {
      executable: process.execPath,
      pid: process.pid,
      startUtcEstimate: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      cwd: process.cwd(),
    },
    observer: {
      path: OBSERVER_PATH,
      bytes: observerBytes.byteLength,
      sha256: sha256Bytes(observerBytes),
    },
    inputs: {
      typescript: {
        path: typescriptFile.path,
        bytes: typescriptFile.bytes,
        sha256: typescriptFile.sha256,
      },
      before: {
        path: beforeFile.path,
        bytes: beforeFile.bytes,
        sha256: beforeFile.sha256,
        templateRequirementPresent:
          oldFragments.templateElements !== undefined,
        draftTitles: oldInstance.api.DRAFT_TITLES,
        canonicalTitle: oldInstance.api.CANONICAL_DRAFT_TITLE,
        requiredTemplateElements:
          oldInstance.api.REQUIRED_TEMPLATE_ELEMENTS,
        actualFunctionSha256: sha256Bytes(
          Buffer.from(oldFragments.machineChecks, 'utf8'),
        ),
        transpiledFragmentSha256: oldInstance.transpiledSha256,
      },
      current: {
        path: currentFile.path,
        bytes: currentFile.bytes,
        sha256: currentFile.sha256,
        templateRequirementPresent:
          currentFragments.templateElements !== undefined,
        draftTitles: currentInstance.api.DRAFT_TITLES,
        canonicalTitle: currentInstance.api.CANONICAL_DRAFT_TITLE,
        actualFunctionSha256: sha256Bytes(
          Buffer.from(currentFragments.machineChecks, 'utf8'),
        ),
        transpiledFragmentSha256: currentInstance.transpiledSha256,
      },
    },
    oldSourceFindings: {
      primary: true,
      sourceFindingsNotProductRed: true,
      rejections: oldRejections,
    },
    currentControls: controls,
    networkDenials: {
      scope: 'process-local monkeypatches only; no system-wide network claim',
      patched: networkPatches,
      attempts: networkAttempts,
    },
    summary: {
      oldRejectionsConfirmed: oldRejections.filter(
        rejection => rejection.rejectionConfirmed,
      ).length,
      currentPositiveAccepted: controls.filter(
        control => control.expected === 'accepted' && control.passed,
      ).length,
      currentNegativeRejected: controls.filter(
        control => control.expected === 'rejected' && control.passed,
      ).length,
      allControlsPass,
      networkAttemptCount: networkAttempts.length,
    },
    claims: {
      pureFunctionObserverOnly: true,
      consumerExecuted: false,
      agentExecuted: false,
      sessionExecuted: false,
      providerExecuted: false,
      serviceExecuted: false,
      modelExecuted: false,
      productRuntimeEvaluated: false,
      legalMeritsEvaluated: false,
      fullT18Accepted: false,
    },
    verdict: pass
      ? 'OBSERVER_CONTRACT_SOURCE_FIX_CONFIRMED'
      : 'OBSERVER_CONTRACT_CONTROL_FAILED',
    receipt: {
      requiredOnStdin: RECEIPT,
      watchdogMs: WATCHDOG_MS,
    },
  }
  const serialized = `${JSON.stringify(result, null, 2)}\n`
  writeFileSync(resultPath, serialized, { encoding: 'utf8', flag: 'wx' })
  const resultBytes = Buffer.from(serialized, 'utf8')
  process.stdout.write(`${JSON.stringify({
    status: result.verdict,
    result: resultPath,
    resultBytes: resultBytes.byteLength,
    resultSha256: sha256Bytes(resultBytes),
    pid: process.pid,
    receiptRequiredOnStdin: RECEIPT,
    watchdogMs: WATCHDOG_MS,
  }, null, 2)}\n`)

  const receipt = await waitForReceipt()
  if (receipt !== RECEIPT) {
    process.stderr.write('observer received an invalid ROOT identity receipt\n')
    process.exitCode = 2
    return
  }
  process.stdout.write(`${JSON.stringify({
    status: 'RECEIPT_ACCEPTED',
    exitCode: pass ? 0 : 1,
  })}\n`)
  process.exitCode = pass ? 0 : 1
}

try {
  await main()
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    status: 'OBSERVER_EXECUTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
  })}\n`)
  process.exitCode = 2
}
