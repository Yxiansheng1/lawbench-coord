import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/typescript/lib/typescript.js'

const evidenceDir = dirname(fileURLToPath(import.meta.url))
const consumerPath = join(evidenceDir, 'native-contract-workflow.mts')
const actualDir = 'D:/Lawbeach/lawbench-coord/T18ManualReasonObserverInput-20261028-194335'
const latestActualDir = 'D:/Lawbeach/lawbench-coord/T18ManualReasonClauseInput-20261028-202819'

const consumerSource = await readFile(consumerPath, 'utf8')
const consumerFile = ts.createSourceFile(
  consumerPath,
  consumerSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
)

const functions: any[] = []
const visit = (node: any): void => {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'assertOutOfScopeReported') {
    functions.push(node)
  }
  ts.forEachChild(node, visit)
}
visit(consumerFile)
assert.equal(functions.length, 1, 'expected exactly one current observer function')

const functionNode = functions[0]
assert.equal(functionNode.parent, consumerFile, 'observer must be a top-level function')
const functionSource = functionNode.getText(consumerFile)
assert.doesNotMatch(
  functionSource,
  /\b(?:import|require|process|fetch|WebSocket|XMLHttpRequest|sendBeacon|child_process|http|https|net|tls|fs|os|eval|Function)\b/,
  'extracted observer must not have process, credential, filesystem, or network capabilities',
)

const safeCalls = new Set([
  'Number',
  'String',
  'add',
  'compact',
  'exec',
  'get',
  'has',
  'isInteger',
  'matchAll',
  'max',
  'min',
  'normalize',
  'replace',
  'set',
  'slice',
  'some',
  'trim',
])
const safeConstructors = new Set(['Error', 'Map', 'Set'])
const inspectCapabilities = (node: any): void => {
  if (ts.isCallExpression(node)) {
    const target = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText(consumerFile)
    assert.ok(safeCalls.has(target), `observer call is outside safe allowlist: ${target}`)
  }
  if (ts.isNewExpression(node)) {
    const target = node.expression.getText(consumerFile)
    assert.ok(safeConstructors.has(target), `observer constructor is outside safe allowlist: ${target}`)
  }
  ts.forEachChild(node, inspectCapabilities)
}
inspectCapabilities(functionNode)

const exportable = functionSource.replace(
  /^function[ \t]+assertOutOfScopeReported/,
  'export function assertOutOfScopeReported',
)
assert.notEqual(exportable, functionSource, 'observer export transform must be exact')
const transpiled = ts.transpileModule(exportable, {
  fileName: 'assertOutOfScopeReported.ts',
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
new vm.Script(transpiled, { filename: 'assertOutOfScopeReported.cjs' })
  .runInContext(context, { timeout: 500 })
const observer = moduleShim.exports.assertOutOfScopeReported
assert.equal(typeof observer, 'function', 'observer did not load from current function body')

const actualDraft = await readFile(join(actualDir, 'actual-final-draft.md'), 'utf8')
const actualEditList = JSON.parse(
  await readFile(join(actualDir, 'actual-editlist-and-result.json'), 'utf8'),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  value: { out_of_scope: Array<Record<string, unknown>> }
}
const actualEdits = actualEditList.arguments.edits
const actualOutOfScope = actualEditList.value.out_of_scope

const replaceOnce = (value: string, before: string, after: string): string => {
  assert.equal(value.split(before).length - 1, 1, `fixture edit must match once: ${before}`)
  return value.replace(before, after)
}
const expectReject = (
  label: string,
  draft: string,
  items: Array<Record<string, unknown>>,
  edits: Array<Record<string, unknown>>,
): void => {
  assert.throws(
    () => observer(draft, items, edits),
    undefined,
    `${label} must fail closed`,
  )
}

observer(actualDraft, actualOutOfScope, actualEdits)

observer(
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越域代码或超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

observer(
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

observer(
  replaceOnce(actualDraft, '（find跨越超链接）', '（域代码）'),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing manual reason',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing manual marker',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：该条需修改（find跨越超链接）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'wrong risk manual only',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing edit',
  actualDraft,
  actualOutOfScope,
  actualEdits.filter(edit => edit.id !== 3),
)

expectReject(
  'missing specific reason',
  actualDraft,
  [{ id: 3, reason: '' }],
  actualEdits,
)

expectReject(
  'duplicated edit id',
  actualDraft,
  actualOutOfScope,
  [...actualEdits, { ...actualEdits[2] }],
)

const misleadingOtherBlock = replaceOnce(
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：直接修改（修改清单第3条）',
  ),
  '- 处理方式：批注提示（涉及商务谈判，由律师决定是否提出）',
  '- 处理方式：该条需人工修改（find跨越超链接）',
)
expectReject('misleading other block', misleadingOtherBlock, actualOutOfScope, actualEdits)

expectReject(
  'nonmatching reason',
  replaceOnce(
    actualDraft,
    '（find跨越超链接）',
    '（find 跨越超链接或其他原因）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'missing risk block',
  replaceOnce(
    actualDraft,
    '### 风险3【P0】通知地址附件缺失',
    '### 风险33【P0】通知地址附件缺失',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'duplicated risk block',
  `${actualDraft}\n### 风险3【P0】重复\n- 处理方式：该条需人工修改（find跨越超链接）\n`,
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'ambiguous handling method',
  replaceOnce(
    actualDraft,
    '- 处理方式：该条需人工修改（find跨越超链接）',
    '- 处理方式：该条需人工修改（find跨越超链接）\n- 处理方式：直接修改（修改清单第3条）',
  ),
  actualOutOfScope,
  actualEdits,
)

expectReject(
  'wrong paragraph',
  actualDraft,
  actualOutOfScope,
  actualEdits.map(edit => edit.id === 3 ? { ...edit, para: 40 } : edit),
)

const latestActualDraft = await readFile(join(latestActualDir, 'actual-final-draft.md'), 'utf8')
const latestActualEditList = JSON.parse(
  await readFile(join(latestActualDir, 'actual-editlist-and-result.json'), 'utf8'),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  value: { out_of_scope: Array<Record<string, unknown>> }
}
const latestActualEdits = latestActualEditList.arguments.edits
const latestActualOutOfScope = latestActualEditList.value.out_of_scope

observer(latestActualDraft, latestActualOutOfScope, latestActualEdits)

observer(
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（find 跨越域代码或超链接）',
  ),
  latestActualOutOfScope,
  latestActualEdits,
)

observer(
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（find跨越超链接，系统未接受）',
  ),
  latestActualOutOfScope,
  latestActualEdits,
)

expectReject(
  'status clause with wrong reason',
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（文件损坏，系统未收下）',
  ),
  latestActualOutOfScope,
  latestActualEdits,
)

expectReject(
  'contradictory cause',
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（find未跨越超链接，系统未收下）',
  ),
  latestActualOutOfScope,
  latestActualEdits,
)

expectReject(
  'unrelated suffix after status',
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（find跨越超链接，系统未收下，另需人工复核）',
  ),
  latestActualOutOfScope,
  latestActualEdits,
)

console.log('PASS manual-reason-observer: original and latest actual inputs and 22 focused cases')

const otherReasonOutOfScope = latestActualOutOfScope.map(item => (
  item.id === 5 ? { ...item, reason: '域代码' } : item
))

expectReject(
  'other machine reason with manual cross-boundary display',
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（find跨越超链接）',
  ),
  otherReasonOutOfScope,
  latestActualEdits,
)

observer(
  replaceOnce(
    latestActualDraft,
    '（find跨越超链接，系统未收下）',
    '（域代码）',
  ),
  otherReasonOutOfScope,
  latestActualEdits,
)

console.log('PASS manual-reason-observer: 2 other-machine-reason controls')

const naturalActualDir = 'D:/Lawbeach/lawbench-coord/T18NaturalManualReasonInput-20261028-205411'
const naturalActualDraft = await readFile(join(naturalActualDir, 'actual-final-draft.md'), 'utf8')
const naturalActualEditList = JSON.parse(
  await readFile(join(naturalActualDir, 'actual-editlist-and-result.json'), 'utf8'),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  value: { out_of_scope: Array<Record<string, unknown>> }
}
const naturalActualEdits = naturalActualEditList.arguments.edits
const naturalActualOutOfScope = naturalActualEditList.value.out_of_scope

observer(naturalActualDraft, naturalActualOutOfScope, naturalActualEdits)

observer(
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（匹配文本包含域代码，系统无法自动替换）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

observer(
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（find跨越超链接，系统未接受）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

expectReject(
  'natural cause with wrong boundary',
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（原文包含表格，系统无法自动替换）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

expectReject(
  'negated natural cause',
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（原文不包含超链接，系统无法自动替换）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

expectReject(
  'successful replacement status',
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（原文包含超链接，系统已自动替换）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

expectReject(
  'unrelated suffix after natural status',
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（原文包含超链接，系统无法自动替换，另需人工复核）',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

expectReject(
  'wrong risk for natural cause',
  replaceOnce(
    naturalActualDraft,
    '### 风险2【P0】通知地址以附件为准，但合同无附件',
    '### 风险22【P0】通知地址以附件为准，但合同无附件',
  ),
  naturalActualOutOfScope,
  naturalActualEdits,
)

const otherNaturalMachineOutOfScope = naturalActualOutOfScope.map(item => (
  item.id === 2 ? { ...item, reason: '域代码' } : item
))

expectReject(
  'other machine reason with natural display',
  naturalActualDraft,
  otherNaturalMachineOutOfScope,
  naturalActualEdits,
)

observer(
  replaceOnce(
    naturalActualDraft,
    '（原文包含超链接，系统无法自动替换）',
    '（域代码）',
  ),
  otherNaturalMachineOutOfScope,
  naturalActualEdits,
)

console.log('PASS manual-reason-observer: latest natural cause/status and 10 new controls')

const compositeActualDir = 'D:/Lawbeach/lawbench-coord/T18CompositeManualClauseInput-20261028-212708'
const compositeActualDraft = await readFile(join(compositeActualDir, 'actual-final-draft.md'), 'utf8')
const compositeActualEditList = JSON.parse(
  await readFile(join(compositeActualDir, 'actual-editlist-and-result.json'), 'utf8'),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  value: { out_of_scope: Array<Record<string, unknown>> }
}
const compositeActualEdits = compositeActualEditList.arguments.edits
const compositeActualOutOfScope = compositeActualEditList.value.out_of_scope

observer(compositeActualDraft, compositeActualOutOfScope, compositeActualEdits)

expectReject(
  'compound boundary with successful apply status',
  replaceOnce(
    compositeActualDraft,
    '（find跨越超链接域代码，系统未纳入修改清单）',
    '（find跨越超链接域代码，系统已纳入修改清单）',
  ),
  compositeActualOutOfScope,
  compositeActualEdits,
)

expectReject(
  'failure status without cause',
  replaceOnce(
    compositeActualDraft,
    '（find跨越超链接域代码，系统未纳入修改清单）',
    '（系统未纳入修改清单）',
  ),
  compositeActualOutOfScope,
  compositeActualEdits,
)

expectReject(
  'negated compound boundary cause',
  replaceOnce(
    compositeActualDraft,
    '（find跨越超链接域代码，系统未纳入修改清单）',
    '（find未跨越超链接域代码，系统未纳入修改清单）',
  ),
  compositeActualOutOfScope,
  compositeActualEdits,
)

console.log('PASS manual-reason-observer: composite actual clause and 3 focused negative controls')

const statusScopeActualDir = 'D:/Lawbeach/lawbench-coord/T18ManualStatusScopeInput-20261028-232316'
const statusScopeActualDraftBytes = await readFile(join(statusScopeActualDir, 'actual-final-draft.md'))
assert.equal(statusScopeActualDraftBytes.byteLength, 8919, 'immutable actual draft byte count changed')
assert.equal(
  createHash('sha256').update(statusScopeActualDraftBytes).digest('hex'),
  '2d7660b092eb6a8452d1ecc46d04a9d84660e238eecb55487905774c6e93377b',
  'immutable actual draft SHA-256 changed',
)
const statusScopeActualDraft = statusScopeActualDraftBytes.toString('utf8')

const statusScopeActualEditListBytes = await readFile(join(statusScopeActualDir, 'actual-edits.json'))
assert.equal(statusScopeActualEditListBytes.byteLength, 4046, 'immutable actual edit-list byte count changed')
assert.equal(
  createHash('sha256').update(statusScopeActualEditListBytes).digest('hex'),
  '24121688dfc9d25eed41ce1ddc443da2e978a8fdddf7f102c471a0605c7f7d8b',
  'immutable actual edit-list SHA-256 changed',
)
const statusScopeActualEditList = JSON.parse(
  statusScopeActualEditListBytes.toString('utf8').replace(/^\uFEFF/, ''),
) as {
  arguments: { edits: Array<Record<string, unknown>> }
  result: { accepted: number; out_of_scope: Array<Record<string, unknown>> }
}
const statusScopeActualEdits = statusScopeActualEditList.arguments.edits
const statusScopeActualOutOfScope = statusScopeActualEditList.result.out_of_scope

assert.equal(statusScopeActualEditList.result.accepted, 7)
assert.deepEqual(statusScopeActualOutOfScope, [
  { id: 4, reason: 'find 跨越域代码或超链接' },
])
const statusScopeActualEdit = statusScopeActualEdits.find(edit => edit.id === 4)
assert.ok(statusScopeActualEdit, 'actual edit id 4 must be present')
assert.equal(statusScopeActualEdit.para, 39)
assert.match(String(statusScopeActualEdit.comment), /^风险4[：:]/)

observer(statusScopeActualDraft, statusScopeActualOutOfScope, statusScopeActualEdits)

observer(
  replaceOnce(
    statusScopeActualDraft,
    '（find跨越超链接，系统修改清单未收下）',
    '（find跨越超链接，系统修改清单未接受）',
  ),
  statusScopeActualOutOfScope,
  statusScopeActualEdits,
)

expectReject(
  'scoped negative status with wrong cause',
  replaceOnce(
    statusScopeActualDraft,
    '（find跨越超链接，系统修改清单未收下）',
    '（文件损坏，系统修改清单未收下）',
  ),
  statusScopeActualOutOfScope,
  statusScopeActualEdits,
)

expectReject(
  'scoped positive success status',
  replaceOnce(
    statusScopeActualDraft,
    '（find跨越超链接，系统修改清单未收下）',
    '（find跨越超链接，系统修改清单已收下）',
  ),
  statusScopeActualOutOfScope,
  statusScopeActualEdits,
)

expectReject(
  'scoped negative status with unrelated suffix',
  replaceOnce(
    statusScopeActualDraft,
    '（find跨越超链接，系统修改清单未收下）',
    '（find跨越超链接，系统修改清单未收下，另需人工复核）',
  ),
  statusScopeActualOutOfScope,
  statusScopeActualEdits,
)

expectReject(
  'actual out-of-scope id bound to another edit',
  statusScopeActualDraft,
  statusScopeActualOutOfScope.map(item => item.id === 4 ? { ...item, id: 5 } : item),
  statusScopeActualEdits,
)

expectReject(
  'actual edit paragraph mismatch',
  statusScopeActualDraft,
  statusScopeActualOutOfScope,
  statusScopeActualEdits.map(edit => edit.id === 4 ? { ...edit, para: 40 } : edit),
)

expectReject(
  'actual edit risk comment mismatch',
  statusScopeActualDraft,
  statusScopeActualOutOfScope,
  statusScopeActualEdits.map(edit => (
    edit.id === 4 ? { ...edit, comment: '风险5：删除对附件的引用' } : edit
  )),
)

console.log('PASS manual-status-scope: immutable actual positive, scoped negative status, and 6 binding/status controls')
