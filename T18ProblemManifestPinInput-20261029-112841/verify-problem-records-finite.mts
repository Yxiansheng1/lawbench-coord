import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const oldConsumerPath =
  'D:/Lawbeach/lawbench-coord/T18ProblemRecordObserverInput-20261029-110348/native-criminal-evidence.mts'
const newConsumerPath = join(evidenceDir, 'native-criminal-evidence.mts')
const actualDraftPath =
  'D:/Lawbeach/lawbench-coord/T18ProblemRecordObserverInput-20261029-110348/actual-final-v2.md'
const bServicePath = join(evidenceDir, 'b-service-criminal-evidence.py')
const manifestPath = join(evidenceDir, 'literalfixed-inputs.json')
const functionName = 'assertDraftMachineChecks'

const pin = (
  bytes: Uint8Array,
  expectedBytes: number,
  expectedSha256: string,
  label: string,
): string => {
  assert.equal(bytes.byteLength, expectedBytes, `${label} byte count changed`)
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    expectedSha256,
    `${label} SHA-256 changed`,
  )
  return Buffer.from(bytes).toString('utf8')
}

const oldBytes = await readFile(oldConsumerPath)
const newBytes = await readFile(newConsumerPath)
const actualBytes = await readFile(actualDraftPath)
const bServiceBytes = await readFile(bServicePath)
const manifestBytes = await readFile(manifestPath)

const oldSource = pin(
  oldBytes,
  120951,
  '788b18db4587e0aa44185ab85e8713f4785ca81781dac81589029b9063af2060',
  'frozen old consumer',
)
const newSource = pin(
  newBytes,
  123264,
  '69e80a8e1fea9d04f8cbdde3e73a066a43d22de3e998958603dd9c46c3de70d1',
  'new consumer',
)
const actualDraft = pin(
  actualBytes,
  8496,
  '59f95a086aba1f39ba90068f759f8d20a5b83f3759b36cf98b1586cc5dcadebc',
  'immutable actual final',
)
pin(
  bServiceBytes,
  48428,
  'c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb',
  'B service',
)
pin(
  manifestBytes,
  12239,
  'a0e8272d60fbb872c8099ca5b008fc28eb360b53c6d4558e1fc27bd4f4081da6',
  'fixed-input manifest',
)
assert.notEqual(newSource, oldSource, 'new consumer must differ from the frozen source')
console.log('PASS problem-records-finite: pinned old/new consumer, actual body, B service, and manifest')

type ExtractedFunction = {
  readonly node: any
  readonly sourceFile: any
  readonly source: string
}

const extractFunction = (path: string, source: string): ExtractedFunction => {
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const functions: any[] = []
  const visit = (node: any): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) {
      functions.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  assert.equal(functions.length, 1, `${path} must contain exactly one ${functionName}`)
  const node = functions[0]
  assert.equal(node.parent, sourceFile, `${functionName} must be a top-level function in ${path}`)
  return {
    node,
    sourceFile,
    source: node.getText(sourceFile),
  }
}

const oldFunction = extractFunction(oldConsumerPath, oldSource)
const newFunction = extractFunction(newConsumerPath, newSource)

const newFunctionAt = newSource.indexOf(newFunction.source)
assert.notEqual(newFunctionAt, -1, 'new function body must be present in new source')
assert.equal(
  newSource.indexOf(newFunction.source, newFunctionAt + 1),
  -1,
  'new function body must occur once in new source',
)
const invertedNewSource =
  newSource.slice(0, newFunctionAt)
  + oldFunction.source
  + newSource.slice(newFunctionAt + newFunction.source.length)
assert.equal(
  invertedNewSource,
  oldSource,
  'replacing only the new function with the frozen function must recreate every other old byte',
)

assert.doesNotMatch(
  newFunction.source,
  /\b(?:import|require|process|fetch|WebSocket|XMLHttpRequest|sendBeacon|child_process|http|https|net|tls|fs|os|eval|Function)\b/,
  'extracted function must not have process, credential, filesystem, or network capabilities',
)
const safeCalls = new Set([
  'entries',
  'every',
  'exec',
  'filter',
  'get',
  'includes',
  'join',
  'map',
  'push',
  'replace',
  'recordHasAllFields',
  'set',
  'slice',
  'split',
  'startsWith',
  'test',
  'trim',
])
const safeConstructors = new Set(['Error', 'Map'])
const inspectCapabilities = (node: any): void => {
  if (ts.isCallExpression(node)) {
    const target = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText(newFunction.sourceFile)
    assert.ok(safeCalls.has(target), `function call is outside safe allowlist: ${target}`)
  }
  if (ts.isNewExpression(node)) {
    const target = node.expression.getText(newFunction.sourceFile)
    assert.ok(safeConstructors.has(target), `function constructor is outside safe allowlist: ${target}`)
  }
  ts.forEachChild(node, inspectCapabilities)
}
inspectCapabilities(newFunction.node)
console.log('PASS problem-records-finite: source inverse and function capability boundary')

type MachineChecks = Record<string, boolean>
type Observer = (title: string, text: string) => MachineChecks

const loadObserver = (path: string, extracted: ExtractedFunction): Observer => {
  const exportable = extracted.source.replace(
    new RegExp(`^function[ \\t]+${functionName}`),
    `export function ${functionName}`,
  )
  assert.notEqual(exportable, extracted.source, `export transform must be exact for ${path}`)
  const transpiled = ts.transpileModule(exportable, {
    fileName: `${functionName}.ts`,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const moduleShim: { exports: Record<string, unknown> } = { exports: {} }
  const context = vm.createContext(
    { module: moduleShim, exports: moduleShim.exports },
    { codeGeneration: { strings: false, wasm: false } },
  )
  new vm.Script(transpiled, { filename: `${functionName}.cjs` })
    .runInContext(context, { timeout: 500 })
  const observer = moduleShim.exports[functionName]
  assert.equal(typeof observer, 'function', `${functionName} did not load from ${path}`)
  return observer as Observer
}

const oldObserver = loadObserver(oldConsumerPath, oldFunction)
const newObserver = loadObserver(newConsumerPath, newFunction)

const errorMessage = (observer: Observer, title: string, text: string): string | null => {
  try {
    observer(title, text)
    return null
  } catch (error) {
    if (
      typeof error === 'object'
      && error !== null
      && 'message' in error
      && typeof error.message === 'string'
    ) {
      return error.message
    }
    return String(error)
  }
}

const expectPass = (label: string, observer: Observer, text: string): MachineChecks => {
  const checks = observer('证据审查意见', text)
  assert.equal(checks.hasExactEvidenceReviewTitle, true, `${label}: title check failed`)
  assert.equal(checks.hasProblemRecords, true, `${label}: problem records check failed`)
  assert.equal(checks.hasContradictionTable, true, `${label}: contradiction check failed`)
  assert.equal(checks.hasEvidenceChainGapTable, true, `${label}: gaps check failed`)
  assert.equal(checks.hasSelfCheck, true, `${label}: self-check failed`)
  return checks
}

const expectReject = (
  label: string,
  observer: Observer,
  text: string,
  expectedError: string,
): void => {
  assert.equal(errorMessage(observer, '证据审查意见', text), expectedError, `${label} must fail closed`)
}

assert.equal(
  errorMessage(oldObserver, '证据审查意见', actualDraft),
  'draft machine checks failed: hasProblemRecords',
  'the frozen source must reproduce the original actual false negative',
)
const actualChecks = expectPass('actual final body', newObserver, actualDraft)
assert.deepEqual(JSON.parse(JSON.stringify(actualChecks)), {
  hasExactEvidenceReviewTitle: true,
  hasProblemRecords: true,
  hasContradictionTable: true,
  hasEvidenceChainGapTable: true,
  hasSelfCheck: true,
})
console.log('PASS problem-records-finite: old actual rejection and new structural-only acceptance')

const thirdLevelControl = actualDraft.replace(
  /^## (问题[ \t]*[0-9]+[ \t]*[：:])/gm,
  '### $1',
)
assert.notEqual(thirdLevelControl, actualDraft, 'third-level control transform must apply')
expectPass('legacy third-level control', oldObserver, thirdLevelControl)
expectPass('legacy third-level control', newObserver, thirdLevelControl)

for (let rank = 1; rank <= 6; rank += 1) {
  const rankControl = actualDraft.replace(
    /^## (问题[ \t]*1[ \t]*[：:])/m,
    `${'#'.repeat(rank)} $1`,
  )
  expectPass(`${rank}-level problem heading`, newObserver, rankControl)
}
console.log('PASS problem-records-finite: legacy control and all six ATX heading ranks')

const fields = [
  '涉及证据：结构测试证据',
  '审查角度：结构测试角度',
  '具体情况：结构测试事实',
  '可能的影响：结构测试影响',
  '建议：结构测试建议',
]
const miniDocument = (
  omittedField?: string,
  rank = 2,
  extraRecordLines: readonly string[] = [],
): string => [
  `${'#'.repeat(rank)} 问题 1：结构测试`,
  ...fields.filter(field => !field.startsWith(omittedField ?? '\u0000')),
  ...extraRecordLines,
  '## 矛盾对照',
  '结构测试',
  '## 证据链缺口',
  '结构测试',
  '## 自检结果',
  '结构测试',
].join('\n')

for (const field of ['涉及证据', '审查角度', '具体情况', '可能的影响', '建议']) {
  expectReject(
    `missing ${field}`,
    newObserver,
    miniDocument(field),
    'draft machine checks failed: hasProblemRecords',
  )
}
console.log('PASS problem-records-finite: each of five fields is mandatory')

const recordHeading = '## 问题 1：结构测试'
const noRecordsControls: ReadonlyArray<readonly [string, string]> = [
  [
    'missing heading',
    miniDocument().replace(`${recordHeading}\n`, ''),
  ],
  [
    'prose only',
    miniDocument().replace(recordHeading, '本文提到问题 1：结构测试'),
  ],
  [
    'heading only',
    miniDocument().replace(fields.join('\n'), ''),
  ],
  [
    'empty heading',
    miniDocument().replace(recordHeading, '## 问题 1：'),
  ],
  [
    'empty heading with closing hashes',
    miniDocument().replace(recordHeading, '## 问题 1： ##'),
  ],
  [
    'heading without colon',
    miniDocument().replace(recordHeading, '## 问题 1 结构测试'),
  ],
  [
    'unnumbered heading',
    miniDocument().replace(recordHeading, '## 问题：结构测试'),
  ],
  [
    'table label',
    miniDocument().replace(recordHeading, '| ## 问题 1：结构测试 |'),
  ],
  [
    'inline string label',
    miniDocument().replace(recordHeading, '文本包含“## 问题 1：结构测试”'),
  ],
  [
    'indented code heading',
    miniDocument().replace(recordHeading, `    ${recordHeading}`),
  ],
  [
    'fenced fake heading',
    `\`\`\`markdown\n${miniDocument().split('## 矛盾对照')[0]}\`\`\`\n`
      + '## 矛盾对照\n结构测试\n## 证据链缺口\n结构测试\n## 自检结果\n结构测试',
  ],
  [
    'tilde-fenced fake heading',
    `~~~markdown\n${miniDocument().split('## 矛盾对照')[0]}~~~\n`
      + '## 矛盾对照\n结构测试\n## 证据链缺口\n结构测试\n## 自检结果\n结构测试',
  ],
  [
    'quoted fake heading',
    `${miniDocument().split('## 矛盾对照')[0].split('\n').map(line => `> ${line}`).join('\n')}\n`
      + '## 矛盾对照\n结构测试\n## 证据链缺口\n结构测试\n## 自检结果\n结构测试',
  ],
]
for (const [label, text] of noRecordsControls) {
  expectReject(
    label,
    newObserver,
    text,
    'draft machine checks failed: hasProblemRecords',
  )
}
console.log('PASS problem-records-finite: 13 no-record, empty-heading, code, quote, and string controls')

const fencedMissingField = miniDocument(
  '建议',
  undefined,
  ['```markdown', '建议：围栏中的伪字段', '```'],
)
expectReject(
  'fenced fake field',
  newObserver,
  fencedMissingField,
  'draft machine checks failed: hasProblemRecords',
)
const quotedMissingField = miniDocument(
  '建议',
  undefined,
  ['> 建议：引用中的伪字段'],
)
expectReject(
  'quoted fake field',
  newObserver,
  quotedMissingField,
  'draft machine checks failed: hasProblemRecords',
)
expectReject(
  'second incomplete record',
  newObserver,
  `${miniDocument()}\n## 问题 2：缺失字段\n- 涉及证据：结构测试证据\n`,
  'draft machine checks failed: hasProblemRecords',
)
console.log('PASS problem-records-finite: fenced/quoted fields and every record are mandatory')

const wrongTitle = 'draft machine checks failed: hasExactEvidenceReviewTitle'
assert.equal(errorMessage(oldObserver, '错误标题', thirdLevelControl), wrongTitle)
assert.equal(errorMessage(newObserver, '错误标题', thirdLevelControl), wrongTitle)

const sectionControls: ReadonlyArray<readonly [string, string, string]> = [
  ['矛盾对照', 'hasContradictionTable', '已移除的对照'],
  ['证据链缺口', 'hasEvidenceChainGapTable', '已移除的缺口'],
  ['自检结果', 'hasSelfCheck', '已移除的自检'],
]
for (const [section, checkName, replacement] of sectionControls) {
  const text = miniDocument(undefined, 3).replace(`## ${section}`, `## ${replacement}`)
  const expected = `draft machine checks failed: ${checkName}`
  assert.equal(errorMessage(oldObserver, '证据审查意见', text), expected)
  assert.equal(errorMessage(newObserver, '证据审查意见', text), expected)
}
console.log('PASS problem-records-finite: title and other-section errors remain byte-for-byte unchanged')

console.log(
  'PASS problem-records-finite: 39 focused controls; runtime/network/model/credential/process counts are all zero',
)
