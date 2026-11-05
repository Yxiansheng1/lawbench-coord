/**
 * T18 litigation question/read observer replay.
 *
 * AUTHORED_NOT_RUN by B. Root alone may execute this after source review.
 * It extracts the actual observer functions from the repaired consumer with
 * the pinned TypeScript compiler, transpiles only those fragments, and runs
 * them in a private VM. It imports no consumer, Agent, Session, provider, SDK,
 * HTTP service, model, task, or case. The immutable 68-event actual JSONL is
 * read-only input; this script writes only its root-owned result file after a
 * ROOT receipt arrives on stdin.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  lstatSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const OBSERVER_PATH = realpathSync(new URL(import.meta.url))
const CURRENT_SOURCE_PATH = join(EVIDENCE_DIR, 'native-litigation-docs.mts')
const CURRENT_SOURCE_BYTES = 127_135
const CURRENT_SOURCE_SHA256 =
  '7e615458396fefcba57bb6f23647f9e40a6263b046705b9a5012fe48256d3ec3'
const ACTUAL_EVENTS_PATH =
  'D:\\Lawbeach\\lawbench-coord\\T18LitigationObserverInput-20261029-192800\\original-actual-session.v4.jsonl'
const ACTUAL_EVENTS_BYTES = 197_963
const ACTUAL_EVENTS_SHA256 =
  'c449784caf29430657eb65ab5265a155027f68857f4304312a8ac8b05a773f1b'
const TYPESCRIPT_PATH =
  'D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'
const TYPESCRIPT_BYTES = 9_144_216
const TYPESCRIPT_SHA256 =
  '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39'
const WATCHDOG_MS = 86_400_000
const ROOT_RECEIPT = 'ROOT_OBSERVER_RECEIPT'
const QUESTION_IDS = ['doc_type', 'stance', 'court', 'claims']
const QUESTION_ANSWERS = Object.freeze({
  doc_type: '确认，起草民事起诉状。',
  stance: '确认，我方代理原告李某乙。',
  court: '法院暂未确定，落款标【待补充：法院全称】。',
  claims: '确认，按任务说明的四项请求起草；逾期利息具体数额不用算，律师费金额待补充。',
})
const SYNTHETIC_CALLBACK_QUESTION_DENIAL =
  'Error: UNSUPPORTED_SYNTHETIC_QUESTION: the joint ask must contain the exact four IDs'
const QUESTIONS_BEFORE_READ_PREFIX =
  '诉讼文书起草必须先取得律师对必问问题的真实回答，再读取案件材料或案件 Wiki。还缺：'
const INVALID_QUESTION_ASK_PREFIX =
  'ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：'
const REQUIRED_QUESTIONS_PREFIX =
  '提交成果前必须先取得律师对必问问题的真实回答。还缺：'
const REQUIRED_ARGUMENTS = new Set([
  '--source',
  '--source-sha',
  '--actual',
  '--actual-sha',
  '--result',
])

const networkAttempts = []
let activeResultPath
let rootAckReceived = false

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

function under(root, path) {
  const rel = relative(resolve(root), resolve(path))
  return rel.length > 0 && !rel.startsWith('..') && !isAbsolute(rel)
}

function readPinned(path, expectedBytes, expectedSha256, label) {
  if (!isAbsolute(path) || !ordinaryFile(path)) {
    throw new Error(`${label} must be an ordinary absolute file`)
  }
  const bytes = readFileSync(path)
  const actualSha256 = sha256Bytes(bytes)
  if (bytes.byteLength !== expectedBytes || actualSha256 !== expectedSha256) {
    throw new Error(`${label} bytes or SHA-256 changed`)
  }
  return { path: realpathSync(path), bytes, sha256: actualSha256 }
}

function parseArguments(argv) {
  const values = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === undefined || value === undefined || !REQUIRED_ARGUMENTS.has(flag)) {
      throw new Error(
        'usage: observer-replay-finite.mjs --source <mts> --source-sha <sha256> '
        + '--actual <jsonl> --actual-sha <sha256> --result <new-json>',
      )
    }
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`)
    values.set(flag, value)
  }
  if (values.size !== REQUIRED_ARGUMENTS.size) {
    throw new Error('all five observer arguments are required')
  }
  return {
    source: values.get('--source'),
    sourceSha: values.get('--source-sha').toLowerCase(),
    actual: values.get('--actual'),
    actualSha: values.get('--actual-sha').toLowerCase(),
    result: values.get('--result'),
  }
}

function validateArguments(args) {
  if (
    pathKey(args.source) !== pathKey(CURRENT_SOURCE_PATH)
    || pathKey(args.actual) !== pathKey(ACTUAL_EVENTS_PATH)
  ) {
    throw new Error('observer inputs are outside the exact pinned paths')
  }
  if (args.sourceSha !== CURRENT_SOURCE_SHA256) {
    throw new Error('source SHA-256 is not the reviewed repaired-consumer identity')
  }
  if (args.actualSha !== ACTUAL_EVENTS_SHA256) {
    throw new Error('actual JSONL SHA-256 is not the frozen 68-event identity')
  }
  if (!isAbsolute(args.result) || !args.result.toLowerCase().endsWith('.json')) {
    throw new Error('result must be a new absolute JSON path')
  }
  const resultPath = resolve(args.result)
  if (!under(EVIDENCE_DIR, resultPath)) {
    throw new Error('result must be under the owned evidence directory')
  }
  try {
    lstatSync(resultPath)
    throw new Error('result path already exists')
  } catch (error) {
    if (error instanceof Error && error.message === 'result path already exists') throw error
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) throw error
  }
  const parent = lstatSync(dirname(resultPath))
  if (!parent.isDirectory() || parent.isSymbolicLink()) {
    throw new Error('result parent must be an ordinary directory')
  }
  return resultPath
}

function installNetworkDenials() {
  const recordDenial = kind => () => {
    networkAttempts.push({ kind, atUtc: utcNow() })
    throw new Error(`process-local network denial: ${kind}`)
  }
  const replace = (target, property, kind) => {
    const denied = recordDenial(kind)
    target[property] = denied
    if (target[property] !== denied) {
      throw new Error(`could not install process-local denial: ${kind}`)
    }
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
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      matches.push(statement.getText(sourceFile))
    }
  }
  if (matches.length !== 1) {
    throw new Error(`expected exactly one actual ${name} function`)
  }
  return matches[0]
}

function instantiateObserver(ts, sourcePath, sourceText) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const variableNames = ['QUESTION_IDS', 'SYNTHETIC_CALLBACK_QUESTION_DENIAL']
  const functionNames = [
    'asRecord',
    'asArray',
    'asString',
    'sha256Bytes',
    'eventMessageText',
    'toolCallsFromEvents',
    'toolResultRecord',
    'parseAskQuestionShape',
    'askQuestionArguments',
    'observeQuestionCallbacks',
    'observeReadTimeline',
  ]
  const variableFragments = variableNames.map(name => (
    findVariableStatement(sourceFile, ts, name)
  ))
  const functionFragments = functionNames.map(name => (
    findFunctionDeclaration(sourceFile, ts, name)
  ))
  const fragmentSource = `${[...variableFragments, ...functionFragments].join('\n\n')}

module.exports = {
  ${[...variableNames, ...functionNames].join(',\n  ')}
};
`
  const transpiled = ts.transpileModule(fragmentSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    },
    fileName: 'litigation-observer-fragments.cts',
  })
  const moduleRecord = { exports: {} }
  const context = vm.createContext({
    module: moduleRecord,
    exports: moduleRecord.exports,
    createHash,
  })
  vm.runInContext(transpiled.outputText, context, { filename: sourcePath })
  const api = moduleRecord.exports
  for (const name of functionNames) {
    if (typeof api[name] !== 'function') {
      throw new Error(`extracted ${name} is not callable`)
    }
  }
  return {
    api,
    fragmentSourceBytes: Buffer.byteLength(fragmentSource, 'utf8'),
    fragmentSourceSha256: sha256Bytes(Buffer.from(fragmentSource, 'utf8')),
    transpiledBytes: Buffer.byteLength(transpiled.outputText, 'utf8'),
    transpiledSha256: sha256Bytes(Buffer.from(transpiled.outputText, 'utf8')),
    executedNames: [...variableNames, ...functionNames],
  }
}

function cloneEvents(events) {
  return structuredClone(events)
}

function eventAt(events, type, seq) {
  const event = events.find(value => value.type === type && value.seq === seq)
  assert.ok(event !== undefined, `missing ${type} at seq ${seq}`)
  return event
}

function resultText(event) {
  return event.data.message.content[0].text
}

function setResult(event, text, isError) {
  event.data.message.content[0].text = text
  event.data.message.isError = isError
}

function expectRejected(cases, name, work) {
  let error
  try {
    work()
  } catch (caught) {
    error = caught
  }
  assert.ok(error instanceof Error, `${name} did not reject`)
  cases.push({ name, expected: 'rejected', outcome: error.message, passed: true })
}

function deriveCallbackCounts(api, events) {
  const calls = api.toolCallsFromEvents(events)
    .filter(call => call.name === 'ask_user_question')
  let successful = 0
  const outcomes = calls.map(call => {
    const result = api.toolResultRecord(events, call.callId)
    if (!result.isError) successful += 1
    return {
      callId: call.callId,
      callSeq: call.seq,
      resultSeq: result.seq,
      isError: result.isError,
    }
  })
  return { attempts: calls.length, successful, outcomes }
}

function waitForRootReceipt() {
  return new Promise((resolveReceipt, rejectReceipt) => {
    let buffered = ''
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      process.stdin.off('data', onData)
      process.stdin.off('end', onEnd)
      process.stdin.pause()
      callback(value)
    }
    const onData = chunk => {
      buffered += chunk
      const newline = buffered.indexOf('\n')
      if (newline < 0) return
      finish(resolveReceipt, buffered.slice(0, newline).replace(/\r$/, ''))
    }
    const onEnd = () => {
      finish(rejectReceipt, new Error('stdin ended before the ROOT receipt'))
    }
    const timer = setTimeout(() => {
      finish(rejectReceipt, new Error('ROOT receipt watchdog expired'))
    }, WATCHDOG_MS)
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', onData)
    process.stdin.on('end', onEnd)
    process.stdin.resume()
  })
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  activeResultPath = validateArguments(args)
  const source = readPinned(
    args.source,
    CURRENT_SOURCE_BYTES,
    CURRENT_SOURCE_SHA256,
    'repaired consumer',
  )
  const actual = readPinned(
    args.actual,
    ACTUAL_EVENTS_BYTES,
    ACTUAL_EVENTS_SHA256,
    'actual 68-event JSONL',
  )
  const typescript = readPinned(
    TYPESCRIPT_PATH,
    TYPESCRIPT_BYTES,
    TYPESCRIPT_SHA256,
    'TypeScript compiler',
  )
  const receipt = await waitForRootReceipt()
  if (receipt !== ROOT_RECEIPT) throw new Error('ROOT receipt literal mismatch')
  rootAckReceived = true

  const require = createRequire(import.meta.url)
  const ts = require(realpathSync(TYPESCRIPT_PATH))
  if (sha256Bytes(readFileSync(TYPESCRIPT_PATH)) !== TYPESCRIPT_SHA256) {
    throw new Error('TypeScript compiler changed before loading')
  }
  installNetworkDenials()
  const observer = instantiateObserver(
    ts,
    source.path,
    source.bytes.toString('utf8'),
  )
  const api = observer.api

  const lines = actual.bytes.toString('utf8').split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  assert.equal(lines.length, 68)
  const events = lines.map((line, index) => {
    const event = JSON.parse(line)
    assert.equal(event.seq, index + 1)
    return event
  })
  assert.deepEqual(api.QUESTION_IDS, QUESTION_IDS)
  assert.equal(api.SYNTHETIC_CALLBACK_QUESTION_DENIAL, SYNTHETIC_CALLBACK_QUESTION_DENIAL)

  const counts = deriveCallbackCounts(api, events)
  assert.equal(counts.attempts, 2)
  assert.equal(counts.successful, 1)
  const accepted = api.observeQuestionCallbacks(events, {
    callbackAttempts: counts.attempts,
    successfulCallbackInvocations: counts.successful,
    declaredQuestionIds: QUESTION_IDS,
    answers: QUESTION_ANSWERS,
    invalidQuestionAskDenial: missing => INVALID_QUESTION_ASK_PREFIX + missing.join('、'),
    missingQuestionAskDenial: missing => REQUIRED_QUESTIONS_PREFIX + missing.join('、'),
  })
  assert.deepEqual(accepted.allAskCallIds, [
    'chatcmpl-tool-baa002d56a583298',
    'chatcmpl-tool-9c07637b850eab32',
  ])
  assert.deepEqual(
    accepted.rejectedCalls.map(call => ({
      callId: call.callId,
      reason: call.reason,
      origin: call.origin,
      seq: call.seq,
      resultSeq: call.resultSeq,
      answered: call.answered,
    })),
    [{
      callId: 'chatcmpl-tool-baa002d56a583298',
      reason: 'invalid_question_ask',
      origin: 'synthetic_callback',
      seq: 36,
      resultSeq: 37,
      answered: false,
    }],
  )
  assert.deepEqual(accepted.answeredCallIds, ['chatcmpl-tool-9c07637b850eab32'])
  assert.equal(accepted.lastRequiredAnswerSeq, 42)
  assert.equal(accepted.successfulCallbackInvocations, 1)

  const readTimeline = api.observeReadTimeline(events, {
    question: accepted,
    questionsBeforeReadDenial: missing => QUESTIONS_BEFORE_READ_PREFIX + missing.join('、'),
  })
  assert.equal(readTimeline.primaryQuestionFirst, true)
  assert.equal(readTimeline.successfulReadsAfterRequiredAnswers, false)
  assert.deepEqual(
    readTimeline.successfulReads
      .filter(read => read.resultSeq <= accepted.lastRequiredAnswerSeq)
      .map(read => [read.tool, read.seq, read.resultSeq]),
    [
      ['case_read_wiki', 18, 19],
      ['case_read_wiki', 20, 21],
      ['case_read_material', 27, 28],
      ['case_read_material', 29, 30],
      ['case_read_material', 31, 32],
    ],
  )

  const cases = [
    {
      name: 'actual_bad_callback_then_one_valid_four_id_callback',
      expected: 'accepted',
      outcome: 'synthetic_callback_origin_recorded',
      passed: true,
    },
    {
      name: 'actual_saved_draft_after_answers',
      expected: 'accepted',
      outcome: accepted.successfulSaveAfterRequiredAnswers ? 'after_required_answers' : 'missing',
      passed: accepted.successfulSaveAfterRequiredAnswers,
    },
    {
      name: 'actual_read_order',
      expected: 'RED',
      outcome: 'wiki18/material27_precede_answers42',
      passed: readTimeline.successfulReadsAfterRequiredAnswers === false,
    },
  ]

  const arbitraryError = cloneEvents(events)
  setResult(eventAt(arbitraryError, 'tool/result', 37), 'Error: arbitrary callback failure', true)
  expectRejected(cases, 'arbitrary_callback_error_rejects', () => api.observeQuestionCallbacks(
    arbitraryError,
    {
      callbackAttempts: 2,
      successfulCallbackInvocations: 1,
      declaredQuestionIds: QUESTION_IDS,
      answers: QUESTION_ANSWERS,
      invalidQuestionAskDenial: missing => INVALID_QUESTION_ASK_PREFIX + missing.join('、'),
      missingQuestionAskDenial: missing => REQUIRED_QUESTIONS_PREFIX + missing.join('、'),
    },
  ))

  const productionDenial = cloneEvents(events)
  setResult(
    eventAt(productionDenial, 'tool/result', 37),
    `Error: ${INVALID_QUESTION_ASK_PREFIX}${QUESTION_IDS.join('、')}`,
    true,
  )
  const productionAccepted = api.observeQuestionCallbacks(productionDenial, {
    callbackAttempts: 1,
    successfulCallbackInvocations: 1,
    declaredQuestionIds: QUESTION_IDS,
    answers: QUESTION_ANSWERS,
    invalidQuestionAskDenial: missing => INVALID_QUESTION_ASK_PREFIX + missing.join('、'),
    missingQuestionAskDenial: missing => REQUIRED_QUESTIONS_PREFIX + missing.join('、'),
  })
  assert.equal(productionAccepted.rejectedCalls[0].origin, 'production')
  cases.push({
    name: 'UNIT_exact_production_denial_origin_is_distinct',
    expected: 'accepted',
    outcome: 'production_origin_recorded',
    passed: true,
  })

  const validArgumentsCallbackError = cloneEvents(events)
  setResult(
    eventAt(validArgumentsCallbackError, 'tool/result', 42),
    'Error: arbitrary valid-arguments callback failure',
    true,
  )
  expectRejected(cases, 'valid_arguments_callback_error_rejects', () => (
    api.observeQuestionCallbacks(validArgumentsCallbackError, {
      callbackAttempts: 2,
      successfulCallbackInvocations: 1,
      declaredQuestionIds: QUESTION_IDS,
      answers: QUESTION_ANSWERS,
      invalidQuestionAskDenial: missing => INVALID_QUESTION_ASK_PREFIX + missing.join('、'),
      missingQuestionAskDenial: missing => REQUIRED_QUESTIONS_PREFIX + missing.join('、'),
    })
  ))

  const wrongSuccessCount = () => api.observeQuestionCallbacks(events, {
    callbackAttempts: 2,
    successfulCallbackInvocations: 2,
    declaredQuestionIds: QUESTION_IDS,
    answers: QUESTION_ANSWERS,
    invalidQuestionAskDenial: missing => INVALID_QUESTION_ASK_PREFIX + missing.join('、'),
    missingQuestionAskDenial: missing => REQUIRED_QUESTIONS_PREFIX + missing.join('、'),
  })
  expectRejected(cases, 'two_success_count_rejects', wrongSuccessCount)

  const deniedReads = cloneEvents(events)
  for (const seq of [19, 21, 28, 30, 32]) {
    setResult(
      eventAt(deniedReads, 'tool/result', seq),
      `Error: ${QUESTIONS_BEFORE_READ_PREFIX}${QUESTION_IDS.join('、')}`,
      true,
    )
  }
  const deniedTimeline = api.observeReadTimeline(deniedReads, {
    question: accepted,
    questionsBeforeReadDenial: missing => QUESTIONS_BEFORE_READ_PREFIX + missing.join('、'),
  })
  assert.equal(deniedTimeline.rejectedCalls.length, 5)
  assert.equal(deniedTimeline.successfulReads.length, 0)
  assert.equal(deniedTimeline.successfulReadsAfterRequiredAnswers, true)
  cases.push({
    name: 'UNIT_exact_preanswer_denials_are_retained_not_read_as_data',
    expected: 'accepted',
    outcome: 'five_denied_attempts_zero_successful_reads',
    passed: true,
  })

  const wrongDenial = cloneEvents(deniedReads)
  setResult(eventAt(wrongDenial, 'tool/result', 19), 'Error: arbitrary read denial', true)
  expectRejected(cases, 'arbitrary_preanswer_read_error_rejects', () => (
    api.observeReadTimeline(wrongDenial, {
      question: accepted,
      questionsBeforeReadDenial: missing => QUESTIONS_BEFORE_READ_PREFIX + missing.join('、'),
    })
  ))

  const observerBytes = readFileSync(OBSERVER_PATH)
  const report = {
    format: 'lawbench-t18-litigation-observer-replay-v1',
    status: 'PASS_OBSERVER_CONTRACT_ACTUAL_READ_ORDER_RED',
    authoredStatus: 'AUTHORED_NOT_RUN_BY_B',
    executedAtUtc: utcNow(),
    process: {
      executable: process.execPath,
      pid: process.pid,
      cwd: process.cwd(),
      rootReceipt: true,
    },
    observerSelf: {
      path: OBSERVER_PATH,
      bytes: observerBytes.byteLength,
      sha256: sha256Bytes(observerBytes),
    },
    source: {
      path: source.path,
      bytes: source.bytes.byteLength,
      sha256: source.sha256,
      extraction: observer,
    },
    actualEvents: {
      path: actual.path,
      bytes: actual.bytes.byteLength,
      sha256: actual.sha256,
      events: events.length,
      responseIdsMutated: false,
      seqUuidRHistoryMutated: false,
    },
    derivedFromToolResultsNotRuntimeCounter: counts,
    question: {
      rejectedCalls: accepted.rejectedCalls,
      answeredCallIds: accepted.answeredCallIds,
      questionIds: accepted.questionIds,
      answerIds: accepted.answerIds,
      lastRequiredAnswerSeq: accepted.lastRequiredAnswerSeq,
      successfulCallbackInvocations: accepted.successfulCallbackInvocations,
    },
    readTimeline: {
      actual: readTimeline,
      actualStatus: 'RED',
      unitExactDenials: deniedTimeline,
    },
    savedTimeline: {
      actualSuccessfulSavesAfterAnswers: true,
      firstSuccessfulSaveResultSeq: 47,
      finalSuccessfulSaveResultSeq: 62,
    },
    cases,
    controlledUnitsClearlyMarked: true,
    producerEvidenceClaimed: false,
    networkDenials: {
      attempts: networkAttempts,
      scope: 'process-local monkeypatches only',
    },
    runtimeCreation: {
      agents: 0,
      sessions: 0,
      contexts: 0,
      tasks: 0,
      cases: 0,
      modelRequests: 0,
      httpRequests: 0,
      childProcesses: 0,
    },
    fullConsumer: 'NOT_RUN_BY_B',
    futureProducerBinding: 'REQUIRED_8_PRIVATE_4_IMPORTS_4_PINS',
    businessAcceptance: 'NOT_RUN',
    packaging: 'HOLD',
  }
  writeFileSync(activeResultPath, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

try {
  await main()
} catch (error) {
  const failed = {
    format: 'lawbench-t18-litigation-observer-replay-v1',
    status: 'FAILED',
    authoredStatus: 'AUTHORED_NOT_RUN_BY_B',
    failedAtUtc: utcNow(),
    error: error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: typeof error, message: String(error) },
    networkAttempts,
    fullConsumer: 'NOT_RUN_BY_B',
  }
  if (activeResultPath !== undefined && rootAckReceived) {
    try {
      writeFileSync(activeResultPath, `${JSON.stringify(failed, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
      })
    } catch {
      // The primary exception remains authoritative; never overwrite a result.
    }
  }
  throw error
}
