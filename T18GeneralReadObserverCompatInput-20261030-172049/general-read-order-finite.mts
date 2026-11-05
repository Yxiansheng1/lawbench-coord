/**
 * T18 general-drafting read-order finite unit.
 *
 * AUTHORED_NOT_RUN. Root alone may execute this after source review. It
 * extracts the actual exported classifier and its literal helpers from the
 * candidate entry, transpiles only those fragments, and runs them in a private
 * VM. The denial helper is imported from the compiled Agent module named by
 * the candidate entry. No entry, NativeSession, task, case, model, HTTP, or
 * credential path is created. All event envelopes below are controlled memory
 * inputs; no production events file is used.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const EVIDENCE_DIR = dirname(fileURLToPath(import.meta.url))
const ENTRY_PATH = join(EVIDENCE_DIR, 'native-general-drafting.mts')
const TYPESCRIPT_PATH =
  'D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'
const TYPESCRIPT_BYTES = 9_144_216
const TYPESCRIPT_SHA256 =
  '569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39'
const QUESTION_IDS = ['doc_type', 'recipient', 'goal'] as const

type Operation =
  | {
    readonly kind: 'call'
    readonly callId: string
    readonly name: string
    readonly args: Record<string, unknown>
  }
  | {
    readonly kind: 'result'
    readonly callId: string
    readonly value: unknown
    readonly isError?: boolean
    readonly sourceCallId?: string
    readonly toolCallId?: string
    readonly sourceKind?: string
  }

type EventEnvelope = {
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
}

type Classifier = (input: {
  readonly events: readonly EventEnvelope[]
  readonly declaredQuestionIds: readonly string[]
  readonly askCallId: string
  readonly askCallSeq: number
  readonly askResultSeq: number
  readonly questionsBeforeReadDenial: (missing: readonly string[]) => string
}) => readonly string[]

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function readPinned(path: string, bytes: number, hash: string): Buffer {
  const value = readFileSync(path)
  assert.equal(value.byteLength, bytes, `byte count changed: ${path}`)
  assert.equal(sha256(value), hash, `SHA-256 changed: ${path}`)
  return value
}

function extractClassifier(ts: any, sourcePath: string, sourceText: string): Classifier {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const names = [
    'asRecord',
    'asArray',
    'asString',
    'sha256Bytes',
    'eventMessageText',
    'toolCallsFromEvents',
    'toolArguments',
    'classifyGeneralReadTimeline',
  ]
  const declarations = names.map(name => {
    const matches = sourceFile.statements.filter((statement: any) => (
      ts.isFunctionDeclaration(statement) && statement.name?.text === name
    ))
    assert.equal(matches.length, 1, `expected one literal ${name} function`)
    return matches[0].getText(sourceFile)
  })
  const fragment = `${declarations.join('\n\n')}

module.exports = { classifyGeneralReadTimeline };
`
  const transpiled = ts.transpileModule(fragment, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    },
    fileName: 'general-read-order-classifier.cts',
  })
  const moduleRecord = { exports: {} as Record<string, unknown> }
  const context = vm.createContext({
    module: moduleRecord,
    exports: moduleRecord.exports,
    createHash,
  })
  vm.runInContext(transpiled.outputText, context, { filename: sourcePath })
  const classifier = moduleRecord.exports.classifyGeneralReadTimeline
  assert.equal(typeof classifier, 'function', 'extracted classifier is not callable')
  return classifier as Classifier
}

async function actualDenialFromCompiledConsumer(
  entrySource: string,
): Promise<(missing: readonly string[]) => string> {
  const imports = [...entrySource.matchAll(
    /import\('(file:\/\/\/[^']+\/agent\.js)'\)/g,
  )].map(match => match[1])
  assert.equal(imports.length, 1, 'candidate must name exactly one compiled Agent module')
  const moduleUrl = imports[0]!
  const module = await import(moduleUrl) as {
    readonly questionsBeforeReadDenial?: unknown
  }
  assert.equal(
    typeof module.questionsBeforeReadDenial,
    'function',
    'compiled Agent denial export is missing',
  )
  return module.questionsBeforeReadDenial as (missing: readonly string[]) => string
}

function call(
  callId: string,
  name: string,
  args: Record<string, unknown> = {},
): Operation {
  return { kind: 'call', callId, name, args }
}

function result(
  callId: string,
  value: unknown,
  options: {
    readonly isError?: boolean
    readonly sourceCallId?: string
    readonly toolCallId?: string
    readonly sourceKind?: string
  } = {},
): Operation {
  return { kind: 'result', callId, value, ...options }
}

function eventsFrom(operations: readonly Operation[]): EventEnvelope[] {
  const events: EventEnvelope[] = []
  let seq = 0
  for (const operation of operations) {
    seq += 1
    if (operation.kind === 'call') {
      events.push({
        type: 'tool/call',
        seq,
        time: seq,
        data: {
          turn: 1,
          callId: operation.callId,
          name: operation.name,
          arguments: JSON.stringify(operation.args),
        },
      })
      continue
    }
    seq += 1
    events.push({
      type: 'tool/result',
      seq,
      time: seq,
      data: {
        turn: 1,
        message: {
          role: 'tool',
          source: {
            kind: operation.sourceKind ?? 'tool',
            callId: operation.sourceCallId ?? operation.callId,
          },
          toolCallId: operation.toolCallId ?? operation.callId,
          content: [{
            type: 'text',
            text: typeof operation.value === 'string'
              ? operation.value
              : JSON.stringify(operation.value),
          }],
          isError: operation.isError === true,
        },
      },
    })
  }
  return events
}

function askCall(): Operation {
  return call('ask', 'ask_user_question', {
    questions: QUESTION_IDS.map(id => ({ id, question: `UNIT question ${id}` })),
  })
}

function askResult(): Operation {
  return result('ask', {
    answers: QUESTION_IDS.map(id => ({
      id,
      selected: [],
      custom: `UNIT answer ${id}`,
    })),
  })
}

function answerSeq(events: readonly EventEnvelope[]): number {
  const answer = events.find(event => (
    event.type === 'tool/result'
    && (event.data as any).message.source.callId === 'ask'
  ))
  assert.ok(answer !== undefined, 'controlled answer result is missing')
  return answer.seq
}

function askSeq(events: readonly EventEnvelope[]): number {
  const ask = events.find(event => (
    event.type === 'tool/call'
    && (event.data as any).callId === 'ask'
  ))
  assert.ok(ask !== undefined, 'controlled ask call is missing')
  return ask.seq
}

function classify(
  classifier: Classifier,
  events: readonly EventEnvelope[],
  denial: (missing: readonly string[]) => string,
): readonly string[] {
  return classifier({
    events,
    declaredQuestionIds: QUESTION_IDS,
    askCallId: 'ask',
    askCallSeq: askSeq(events),
    askResultSeq: answerSeq(events),
    questionsBeforeReadDenial: denial,
  })
}

function expectPass(name: string, work: () => void): Record<string, unknown> {
  work()
  return { name, expected: 'PASS', observed: 'PASS' }
}

function expectRed(name: string, work: () => void): Record<string, unknown> {
  try {
    work()
  } catch (error) {
    return {
      name,
      expected: 'RED',
      observed: 'RED',
      detail: error instanceof Error ? error.message : String(error),
    }
  }
  throw new Error(`${name} was expected RED but passed`)
}

async function main(): Promise<void> {
  const compiler = readPinned(TYPESCRIPT_PATH, TYPESCRIPT_BYTES, TYPESCRIPT_SHA256)
  const require = createRequire(import.meta.url)
  const ts = require(TYPESCRIPT_PATH) as any
  assert.equal(sha256(readFileSync(TYPESCRIPT_PATH)), sha256(compiler))

  const entryBytes = readFileSync(ENTRY_PATH)
  const entrySource = entryBytes.toString('utf8')
  const classifier = extractClassifier(ts, ENTRY_PATH, entrySource)
  const denial = await actualDenialFromCompiledConsumer(entrySource)
  const expectedDenial = `Error: ${denial(QUESTION_IDS)}`
  const readValue = { parts: [{ name: 'UNIT material', read: true }] }

  const cases: Record<string, unknown>[] = []
  cases.push(expectPass('question-first-then-material-success', () => {
    const events = eventsFrom([
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue),
      call('wiki', 'case_read_wiki', { section: '概览' }),
      result('wiki', { section: '概览', text: 'UNIT wiki' }),
    ])
    assert.deepEqual([...classify(classifier, events, denial)], ['read'])
  }))

  cases.push(expectPass('exact-early-production-denial-recovers', () => {
    const events = eventsFrom([
      call('early-denial', 'case_read_material', { name: 'UNIT material' }),
      result('early-denial', expectedDenial, { isError: true }),
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue),
      call('wiki', 'case_read_wiki', { section: '概览' }),
      result('wiki', { section: '概览', text: 'UNIT wiki' }),
    ])
    assert.deepEqual([...classify(classifier, events, denial)], ['read'])
  }))

  cases.push(expectPass('early-denial-is-not-material-data', () => {
    const events = eventsFrom([
      call('early-denial', 'case_read_material', { name: 'UNIT material' }),
      result('early-denial', expectedDenial, { isError: true }),
      askCall(),
      askResult(),
    ])
    assert.deepEqual([...classify(classifier, events, denial)], [])
  }))

  cases.push(expectRed('successful-read-before-answers', () => {
    classify(classifier, eventsFrom([
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue),
      askCall(),
      askResult(),
    ]), denial)
  }))

  cases.push(expectRed('successful-wiki-before-answers', () => {
    classify(classifier, eventsFrom([
      call('wiki', 'case_read_wiki', { section: '概览' }),
      result('wiki', { section: '概览', text: 'UNIT wiki' }),
      askCall(),
      askResult(),
    ]), denial)
  }))

  cases.push(expectRed('unknown-preanswer-error', () => {
    classify(classifier, eventsFrom([
      call('unknown', 'case_read_material', { name: 'UNIT material' }),
      result('unknown', 'Error: UNIT unknown error', { isError: true }),
      askCall(),
      askResult(),
    ]), denial)
  }))

  cases.push(expectRed('denied-read-after-answers', () => {
    classify(classifier, eventsFrom([
      askCall(),
      askResult(),
      call('late-denial', 'case_read_material', { name: 'UNIT material' }),
      result('late-denial', expectedDenial, { isError: true }),
    ]), denial)
  }))

  cases.push(expectRed('missing-paired-result', () => {
    classify(classifier, eventsFrom([
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
    ]), denial)
  }))

  cases.push(expectRed('mismatched-result-call-id', () => {
    classify(classifier, eventsFrom([
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue, { toolCallId: 'other-call' }),
    ]), denial)
  }))

  cases.push(expectRed('unknown-result-origin', () => {
    classify(classifier, eventsFrom([
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue, { sourceKind: 'unit-unknown' }),
    ]), denial)
  }))

  cases.push(expectRed('unknown-unrelated-tool-error', () => {
    classify(classifier, eventsFrom([
      call('save', 'case_save_draft', { title: 'UNIT', content: 'UNIT' }),
      result('save', 'Error: UNIT unknown save failure', { isError: true }),
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue),
    ]), denial)
  }))

  cases.push(expectRed('mismatched-question-sequence', () => {
    const events = eventsFrom([
      askCall(),
      askResult(),
      call('read', 'case_read_material', { name: 'UNIT material' }),
      result('read', readValue),
    ])
    classifier({
      events,
      declaredQuestionIds: QUESTION_IDS,
      askCallId: 'ask',
      askCallSeq: answerSeq(events),
      askResultSeq: answerSeq(events),
      questionsBeforeReadDenial: denial,
    })
  }))

  cases.push(expectRed('malformed-answer-id', () => {
    classify(classifier, eventsFrom([
      askCall(),
      result('ask', {
        answers: [
          { id: QUESTION_IDS[0], selected: [], custom: 'UNIT' },
          { id: QUESTION_IDS[1], selected: [], custom: 'UNIT' },
          { id: 'unknown', selected: [], custom: 'UNIT' },
        ],
      }),
    ]), denial)
  }))

  const output = {
    format: 'lawbench-t18-general-read-order-finite-v1',
    status: 'UNIT_PASS_NOT_ACTUAL_RUN',
    authoredStatus: 'AUTHORED_NOT_RUN',
    actualModelOrNativeRun: false,
    network: false,
    productionEventsFileUsed: false,
    controlledMemoryEnvelopes: true,
    currentCompiledAgentModule: 'resolved-from-candidate-import',
    currentCompiledBaselineIsNotNewAdmission: true,
    entry: {
      bytes: entryBytes.byteLength,
      sha256: sha256(entryBytes),
    },
    cases,
    passed: cases.length,
    fullConsumer: 'NOT_RUN',
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

await main()
