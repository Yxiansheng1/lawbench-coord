/**
 * T18 defense-gate wire-schema finite source observer.
 *
 * AUTHORED_NOT_RUN by the B line. Root alone may execute this file after
 * source review. It extracts only the actual passive ask-user-schema helper
 * and its 2 MiB limit from the pinned consumer. It does not import or execute
 * the consumer, Agent, Session, provider, SDK, service, or model.
 */

import { createHash } from 'node:crypto'
import { readFileSync, lstatSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import vm from 'node:vm'

const FORMAT = 'lawbench-t18-defense-gate-wire-schema-finite-v1'
const RECEIPT = 'ROOT_WIRE_SCHEMA_RECEIPT'
const WATCHDOG_MS = 86_400_000
const EXPECTED_CONTROL_COUNT = 14
const SENTINEL = 'WIRE_SCHEMA_PRIVATE_SENTINEL_7f63'
const TYPESCRIPT_PATH =
  'D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'
const TYPESCRIPT_SHA256 =
  '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39'
const SOURCE_PATH =
  'D:/Lawbeach/lawbench-B/docs/plan/evidence/T18/DefenseGateRecovery-20261029-173550/native-defense-opinion.mts'
const SOURCE_SHA256 =
  '8957b232935d51d5ba7592a28e2de5fba8e3997a574473433b1fbe76165bae76'
const OBSERVER_PATH = realpathSync(new URL(import.meta.url))
const REQUIRED_ARGUMENTS = new Set([
  '--source',
  '--source-sha',
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
        'usage: wire-schema-finite.mjs --source <pinned-mts> '
        + '--source-sha <sha256> --result <new-root-owned-json>',
      )
    }
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`)
    values.set(flag, value)
  }
  if (values.size !== REQUIRED_ARGUMENTS.size) {
    throw new Error('all three wire-schema observer arguments are required')
  }
  return {
    source: values.get('--source'),
    sourceSha: values.get('--source-sha').toLowerCase(),
    result: values.get('--result'),
  }
}

function validateArguments(args) {
  if (pathKey(args.source) !== pathKey(SOURCE_PATH)) {
    throw new Error('observer source path is outside the pinned MTS file')
  }
  if (args.sourceSha !== SOURCE_SHA256) {
    throw new Error('source SHA-256 is not the pinned recovery identity')
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
    if (error instanceof Error && error.message === 'result path already exists') {
      throw error
    }
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) {
      throw error
    }
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

function findVariableStatement(sourceFile, ts, name) {
  const matches = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        matches.push(statement.getText(sourceFile))
      }
    }
  }
  if (matches.length !== 1) {
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

function extractActualFragments(ts, sourcePath, text) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  return {
    bodyLimit: findVariableStatement(sourceFile, ts, 'ASK_SCHEMA_BODY_LIMIT_BYTES'),
    helperDependency: findFunctionDeclaration(sourceFile, ts, 'sha256Bytes'),
    helper: findFunctionDeclaration(
      sourceFile,
      ts,
      'observeAskUserQuestionWireSchema',
    ),
  }
}

function instantiateFragments(ts, sourcePath, fragments) {
  const fragmentSource = `${fragments.bodyLimit}

${fragments.helperDependency}

${fragments.helper}

module.exports = { observeAskUserQuestionWireSchema };
`
  const transpiled = ts.transpileModule(fragmentSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    },
    fileName: 'wire-schema-fragment.cts',
  })
  const moduleRecord = { exports: {} }
  const context = vm.createContext({
    module: moduleRecord,
    exports: moduleRecord.exports,
    createHash,
    Buffer,
    Request,
  })
  vm.runInContext(transpiled.outputText, context, { filename: sourcePath })
  const api = moduleRecord.exports
  if (typeof api.observeAskUserQuestionWireSchema !== 'function') {
    throw new Error('extracted observeAskUserQuestionWireSchema is not callable')
  }
  return {
    api,
    transpiledSha256: sha256Bytes(Buffer.from(transpiled.outputText, 'utf8')),
    executedNames: [
      'ASK_SCHEMA_BODY_LIMIT_BYTES',
      'sha256Bytes',
      'observeAskUserQuestionWireSchema',
    ],
  }
}

function askTool(questionType, withOptions = true) {
  const questionItems = questionType === 'array'
    ? {
        type: 'object',
        properties: {
          id: { type: 'string' },
          question: { type: 'string' },
          ...(withOptions
            ? {
                options: {
                  type: 'array',
                  items: { type: 'object' },
                },
              }
            : {}),
        },
      }
    : undefined
  return {
    type: 'function',
    function: {
      name: 'ask_user_question',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: questionType,
            ...(questionItems === undefined ? {} : { items: questionItems }),
          },
        },
        required: ['questions'],
      },
    },
  }
}

function bodyWithTools(tools) {
  return JSON.stringify({
    model: 'synthetic-only',
    messages: [{ role: 'user', content: SENTINEL }],
    tools,
  })
}

function observationControl(id, observed, passed) {
  return { id, observed, passed }
}

async function runControls(helper) {
  const controls = []

  const structured = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    headers: { 'x-observer-sentinel': SENTINEL },
    body: bodyWithTools([askTool('array')]),
  })
  controls.push(observationControl(
    'structured-array-schema-observed',
    structured,
    structured.status === 'observed'
      && structured.bodySource === 'init-string'
      && structured.toolDefinitionCount === 1
      && structured.questionsType === 'array'
      && structured.questionItemsType === 'object'
      && structured.optionType === 'array'
      && structured.optionItemType === 'object'
      && structured.questionsRequired === true
      && /^[0-9a-f]{64}$/.test(structured.parametersSha256 ?? ''),
  ))

  const stringSchema = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([askTool('string', false)]),
  })
  controls.push(observationControl(
    'string-schema-not-coerced',
    stringSchema,
    stringSchema.status === 'observed'
      && stringSchema.questionsType === 'string'
      && stringSchema.questionItemsType === 'unknown'
      && stringSchema.optionType === 'unknown'
      && stringSchema.questionsRequired === true,
  ))

  const missing = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([{
      type: 'function',
      function: { name: 'case_search', parameters: { type: 'object' } },
    }]),
  })
  controls.push(observationControl(
    'missing-ask-definition',
    missing,
    missing.status === 'missing-ask-definition'
      && missing.toolDefinitionCount === 1,
  ))

  const ambiguous = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([askTool('array'), askTool('array')]),
  })
  controls.push(observationControl(
    'ambiguous-ask-definition',
    ambiguous,
    ambiguous.status === 'ambiguous-ask-definition'
      && ambiguous.toolDefinitionCount === 2,
  ))

  const invalidJson = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: '{"tools":',
  })
  controls.push(observationControl(
    'invalid-json',
    invalidJson,
    invalidJson.status === 'invalid-json'
      && invalidJson.bodySource === 'init-string',
  ))

  const unsupportedBody = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: new URLSearchParams({ synthetic: 'only' }),
  })
  controls.push(observationControl(
    'unsupported-body',
    unsupportedBody,
    unsupportedBody.status === 'unsupported-body'
      && unsupportedBody.bodySource === 'unavailable',
  ))

  const tooLarge = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: 'x'.repeat(2 * 1024 * 1024 + 1),
  })
  controls.push(observationControl(
    'too-large-body',
    tooLarge,
    tooLarge.status === 'too-large-body'
      && tooLarge.bodySource === 'init-string',
  ))

  const invalidTools = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: SENTINEL }] }),
  })
  controls.push(observationControl(
    'invalid-tools',
    invalidTools,
    invalidTools.status === 'invalid-tools',
  ))

  const invalidParameters = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([{
      type: 'function',
      function: { name: 'ask_user_question', parameters: 'synthetic' },
    }]),
  })
  controls.push(observationControl(
    'invalid-parameters',
    invalidParameters,
    invalidParameters.status === 'invalid-parameters'
      && invalidParameters.toolDefinitionCount === 1,
  ))

  const flatLookalike = await helper('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([askTool('array').function]),
  })
  controls.push(observationControl(
    'flat-tool-lookalike-not-observed',
    flatLookalike,
    flatLookalike.status === 'missing-ask-definition'
      && flatLookalike.toolDefinitionCount === 1,
  ))

  const overrideCases = [
    ['url-search-params', new URLSearchParams({ synthetic: 'only' })],
    ['uint8-array', new Uint8Array([1, 2, 3])],
    ['null', null],
  ]
  const overrideObservations = []
  let overrideBodiesUnconsumed = true
  for (const [kind, overrideBody] of overrideCases) {
    const originalBody = bodyWithTools([askTool('array')])
    const request = new Request('http://127.0.0.1/controlled', {
      method: 'POST',
      body: originalBody,
    })
    const observed = await helper(request, {
      method: 'POST',
      body: overrideBody,
    })
    const originalBodyAfter = await request.text()
    overrideBodiesUnconsumed = overrideBodiesUnconsumed
      && originalBodyAfter === originalBody
    overrideObservations.push({
      kind,
      status: observed.status,
      bodySource: observed.bodySource,
      originalBodyUnconsumed: originalBodyAfter === originalBody,
    })
  }
  controls.push(observationControl(
    'request-with-unsupported-body-override',
    overrideObservations,
    overrideBodiesUnconsumed
      && overrideObservations.every(observation => (
        observation.status === 'unsupported-body'
        && observation.bodySource === 'unavailable'
        && observation.originalBodyUnconsumed
      )),
  ))

  const cloneBody = bodyWithTools([askTool('array')])
  const request = new Request('http://127.0.0.1/controlled', {
    method: 'POST',
    headers: { 'x-observer-sentinel': SENTINEL },
    body: cloneBody,
  })
  const cloneObserved = await helper(request)
  const bodyAfter = await request.text()
  controls.push(observationControl(
    'request-clone-preserves-original-body',
    {
      observed: cloneObserved,
      originalBodyUnconsumed: bodyAfter === cloneBody,
    },
    cloneObserved.status === 'observed'
      && cloneObserved.bodySource === 'request-clone'
      && bodyAfter === cloneBody,
  ))

  const oversizedCloneBody = 'x'.repeat(2 * 1024 * 1024 + 1)
  const oversizedRequest = new Request('http://127.0.0.1/controlled', {
    method: 'POST',
    body: oversizedCloneBody,
  })
  const oversizedObserved = await helper(oversizedRequest)
  const oversizedBodyAfter = await oversizedRequest.text()
  controls.push(observationControl(
    'oversized-request-clone-is-bounded',
    {
      observed: oversizedObserved,
      originalBodyUnchanged: oversizedBodyAfter === oversizedCloneBody,
    },
    oversizedObserved.status === 'too-large-body'
      && oversizedObserved.bodySource === 'request-clone'
      && oversizedBodyAfter === oversizedCloneBody,
  ))

  const usedRequest = new Request('http://127.0.0.1/controlled', {
    method: 'POST',
    body: bodyWithTools([askTool('array')]),
  })
  await usedRequest.text()
  const observerError = await helper(usedRequest)
  controls.push(observationControl(
    'request-clone-error-is-fixed-enum',
    observerError,
    observerError.status === 'observer-error'
      && observerError.bodySource === 'request-clone',
  ))

  return controls
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
  const sourceFile = readPinnedFile(
    args.source,
    SOURCE_SHA256,
    'recovery consumer',
  )

  const require = createRequire(import.meta.url)
  const ts = require(realpathSync(TYPESCRIPT_PATH))
  if (typescriptFile.sha256 !== TYPESCRIPT_SHA256) {
    throw new Error('TypeScript executable identity changed before loading')
  }
  installNetworkDenials()

  const fragments = extractActualFragments(ts, sourceFile.path, sourceFile.text)
  const instance = instantiateFragments(ts, sourceFile.path, fragments)
  const controls = await runControls(instance.api.observeAskUserQuestionWireSchema)
  const allControlsPass = (
    controls.length === EXPECTED_CONTROL_COUNT
    && controls.every(control => control.passed)
  )
  const sensitiveLeakFree = !JSON.stringify(controls).includes(SENTINEL)
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
      source: {
        path: sourceFile.path,
        bytes: sourceFile.bytes,
        sha256: sourceFile.sha256,
      },
    },
    actualFragments: {
      bodyLimitSha256: sha256Bytes(Buffer.from(fragments.bodyLimit, 'utf8')),
      sha256BytesDeclarationSha256: sha256Bytes(
        Buffer.from(fragments.helperDependency, 'utf8'),
      ),
      actualFunctionSha256: sha256Bytes(Buffer.from(fragments.helper, 'utf8')),
      transpiledFragmentSha256: instance.transpiledSha256,
      executedNames: instance.executedNames,
    },
    controls,
    networkDenials: {
      scope: 'process-local monkeypatches only; no system-wide network claim',
      patched: networkPatches,
      attempts: networkAttempts,
    },
    summary: {
      controlCount: controls.length,
      controlsConfirmed: controls.filter(control => control.passed).length,
      allControlsPass,
      sensitiveLeakFree,
      outputLeakFree: false,
      networkAttemptCount: networkAttempts.length,
    },
    claims: {
      actualHelperExtracted: true,
      consumerExecuted: false,
      agentExecuted: false,
      sessionExecuted: false,
      providerExecuted: false,
      serviceExecuted: false,
      modelExecuted: false,
      productRuntimeEvaluated: false,
      actualWireObservationMade: false,
      fullT18Accepted: false,
    },
    verdict: (
      allControlsPass
      && sensitiveLeakFree
      && networkAttempts.length === 0
    )
      ? 'WIRE_SCHEMA_SOURCE_CONTROLS_CONFIRMED'
      : 'WIRE_SCHEMA_SOURCE_CONTROLS_FAILED',
    receipt: {
      requiredOnStdin: RECEIPT,
      watchdogMs: WATCHDOG_MS,
    },
  }
  let serialized = `${JSON.stringify(result, null, 2)}\n`
  const resultLeakFree = !serialized.includes(SENTINEL)
  result.summary.outputLeakFree = resultLeakFree
  if (!resultLeakFree) {
    result.verdict = 'WIRE_SCHEMA_SOURCE_CONTROLS_FAILED'
  }
  serialized = `${JSON.stringify(result, null, 2)}\n`
  if (serialized.includes(SENTINEL)) {
    throw new Error('wire-schema observation output contained the private sentinel')
  }
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
  const pass = result.verdict === 'WIRE_SCHEMA_SOURCE_CONTROLS_CONFIRMED'
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
    status: 'WIRE_SCHEMA_OBSERVER_EXECUTION_FAILED',
    error: error instanceof Error ? error.message : String(error),
  })}\n`)
  process.exitCode = 2
}
